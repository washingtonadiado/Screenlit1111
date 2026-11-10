/**
 * Screenlit Phase 5 Unit Tests
 * Validates AI layer abstraction, safety rules, human overrides,
 * and Monte Carlo cohort impact simulation calculations
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { ScreenlitDatabase } from '../functions/storage';
import { AILayer } from '../functions/aiLayer';
import {
  ImpactSimulationEngine,
  SIMULATION_ASSUMPTIONS,
  calculatePercentiles,
  generateSyntheticAdultCohort,
} from '../functions/impactSimulation';

describe('Phase 5: AI Layer Abstraction and Safety Safeguards', () => {
  let db: ScreenlitDatabase;

  beforeEach(() => {
    db = ScreenlitDatabase.resetInstance();
  });

  it('runs in template mode by default with zero API key dependencies', () => {
    expect(AILayer.getMode()).toBe('template');
    expect(AILayer.isAiEnabled()).toBe(true);
  });

  it('ranks cases transparently with logistic scoring and top 3 factors', () => {
    const rankResult = AILayer.rankCases(
      {
        caseId: 'case_test_rank',
        systolic: 172,
        diastolic: 104,
        isUrgent: false,
        patientAge: 62,
        comorbiditiesCount: 2,
        hoursSinceResult: 12,
        priorEngagement: false,
        outOfNetwork: false,
        distanceKm: 8,
      },
      db
    );

    expect(rankResult.riskScore).toBeGreaterThan(0.5);
    expect(rankResult.riskScore).toBeLessThan(1.0);
    expect(rankResult.factors.length).toBeLessThanOrEqual(3);
    expect(rankResult.factors.length).toBeGreaterThan(0);

    const logRecord = db.collections.aiOutputs.get(rankResult.aiOutputId);
    expect(logRecord).toBeDefined();
    expect(logRecord?.taskType).toBe('rankCases');
    expect(logRecord?.overridden).toBe(false);
  });

  it('predicts patient engagement drop off likelihood and assigns outreach tier', () => {
    const dropOffResult = AILayer.predictDropOff(
      {
        caseId: 'case_test_drop',
        patientId: 'pat_tariq_001',
        priorEngagement: false,
        languageBarrier: true,
        delayHours: 36,
        distanceKm: 15,
        outOfNetwork: true,
      },
      db
    );

    expect(dropOffResult.dropOffProbability).toBeGreaterThan(0.4);
    expect(['low', 'moderate', 'high']).toContain(dropOffResult.riskTier);
    expect(dropOffResult.recommendedOutreach.length).toBeGreaterThan(10);
  });

  it('drafts patient messages safely without diagnostic claims or prescribing advice', () => {
    const messageResult = AILayer.draftPatientMessage(
      {
        caseId: 'case_test_msg',
        patientId: 'pat_tariq_001',
        language: 'en',
        messageType: 'result_issued',
        patientName: 'Tariq Al Mahmoud',
        clinicName: 'Al Amal Health Centre',
      },
      db
    );

    expect(messageResult.safetyCheckPassed).toBe(true);
    expect(messageResult.messageText).toContain('Tariq Al Mahmoud');
    expect(messageResult.messageText.toLowerCase()).not.toContain('you have hypertension');
    expect(messageResult.messageText.toLowerCase()).not.toContain('take this medication');

    const logRecord = db.collections.aiOutputs.get(messageResult.aiOutputId);
    expect(logRecord).toBeDefined();
  });

  it('generates clinician consult summaries where every sentence cites an event identifier', () => {
    const citations = [
      { eventId: 'EVT-01', fact: 'Actionable blood pressure recorded at community screening' },
      { eventId: 'EVT-02', fact: 'Patient acknowledged result with comprehension verification' },
      { eventId: 'EVT-03', fact: 'Referral dispatched to primary care physician' },
    ];

    const result = AILayer.summarizeHandoff('case_test_handoff', citations, db);
    expect(result.summary).toContain('[EVT-01]');
    expect(result.summary).toContain('[EVT-02]');
    expect(result.summary).toContain('[EVT-03]');

    const sentences = result.summary.split('.').filter((s) => s.trim().length > 0);
    sentences.forEach((s) => {
      expect(s).toMatch(/\[EVT-\d{2}\]/);
    });
  });

  it('allows human staff to override AI outputs with clinical justification', () => {
    const rankResult = AILayer.rankCases(
      {
        caseId: 'case_override_test',
        systolic: 142,
        diastolic: 92,
        isUrgent: false,
        patientAge: 45,
        comorbiditiesCount: 0,
        hoursSinceResult: 2,
        priorEngagement: true,
        outOfNetwork: false,
        distanceKm: 2,
      },
      db
    );

    const overrideRes = AILayer.overrideAIOutput(
      rankResult.aiOutputId,
      'Dr. Amina Al Mansoor',
      'Clinical assessment indicates lower urgency due to known white coat elevation',
      db
    );

    expect(overrideRes.success).toBe(true);

    const updated = db.collections.aiOutputs.get(rankResult.aiOutputId);
    expect(updated?.overridden).toBe(true);
    expect(updated?.overriddenBy).toBe('Dr. Amina Al Mansoor');
    expect(updated?.overrideNote).toContain('white coat elevation');
  });
});

describe('Phase 5: Population Health Cohort Simulation and Percentiles', () => {
  let db: ScreenlitDatabase;

  beforeEach(() => {
    db = ScreenlitDatabase.resetInstance();
  });

  it('generates a synthetic cohort of exactly 2,000 adult profiles', () => {
    const cohort = generateSyntheticAdultCohort(2000);
    expect(cohort.length).toBe(2000);

    const hasLowLit = cohort.some((p) => p.digitalLiteracyTier === 'low');
    const hasModLit = cohort.some((p) => p.digitalLiteracyTier === 'moderate');
    const hasHighLit = cohort.some((p) => p.digitalLiteracyTier === 'high');
    expect(hasLowLit && hasModLit && hasHighLit).toBe(true);
  });

  it('calculates median, 5th percentile, and 95th percentile accurately', () => {
    const sample = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const metrics = calculatePercentiles(sample);

    expect(metrics.median).toBe(60);
    expect(metrics.p5).toBe(10);
    expect(metrics.p95).toBe(100);
  });

  it('runs Monte Carlo replications and computes all 9 required outcome metrics', () => {
    const result = ImpactSimulationEngine.runSimulation(2000, 10, db);
    expect(result.cohortSize).toBe(2000);
    expect(result.banner).toBe('Simulated results, not clinical evidence.');

    const m = result.metrics;
    expect(m.timeToNotificationHours.median).toBeLessThan(5.0);
    expect(m.acknowledgementRatePercent.median).toBeGreaterThan(80.0);
    expect(m.timeToConsultationDays.median).toBeLessThan(15.0);
    expect(m.referralCompletionPercent.median).toBeGreaterThan(70.0);
    expect(m.appointmentCompletionPercent.median).toBeGreaterThan(80.0);
    expect(m.treatmentInitiationPercent.median).toBeGreaterThan(75.0);
    expect(m.unresolvedActionableAt90DaysPercent.median).toBeLessThan(25.0);
    expect(m.documentedClosureRatePercent.median).toBeGreaterThan(65.0);
    expect(m.bloodPressureControlAt90DaysPercent.median).toBeGreaterThan(60.0);

    const saved = db.collections.simulationRuns.get(result.id);
    expect(saved).toBeDefined();
  });

  it('documents literature source references for all simulation model assumptions', () => {
    expect(SIMULATION_ASSUMPTIONS.length).toBe(9);
    SIMULATION_ASSUMPTIONS.forEach((a) => {
      expect(a.intendedSource.length).toBeGreaterThan(15);
      expect(a.baselineRate).toBeGreaterThan(0);
      expect(a.screenlitRate).toBeGreaterThan(0);
    });
  });
});
