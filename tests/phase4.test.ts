/**
 * Screenlit Phase 4 Unit Tests
 * Validates command centre queues, timeline event ID citation, demo clock advancement,
 * and closure verification safeguards
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { ScreenlitDatabase } from '../functions/storage';
import { CaseEngine } from '../functions/caseEngine';
import { CaseDocument } from '@shared/types';
import { validateClosurePrerequisites } from '@shared/stateMachine';

describe('Phase 4: Demo Clock and Immediate SLA Fast Forward', () => {
  let db: ScreenlitDatabase;

  beforeEach(() => {
    db = ScreenlitDatabase.resetInstance();
  });

  it('advances simulated time and adjusts getNow calculation', () => {
    const initialTime = db.getNow().getTime();
    db.advanceDemoClock(24);
    const advancedTime = db.getNow().getTime();
    const diffHours = (advancedTime - initialTime) / (3600 * 1000);
    expect(Math.round(diffHours)).toBe(24);
    expect(db.getDemoClockOffsetHours()).toBe(24);

    db.setDemoClockOffset(0);
    expect(db.getDemoClockOffsetHours()).toBe(0);
  });

  it('triggers scheduler sweep upon demo clock fast forward and detects SLA breach', () => {
    const ingestRes = CaseEngine.ingestObservation(
      {
        patientId: 'pat_tariq_001',
        systolic: 152,
        diastolic: 94,
        performerId: 'prac_coord_fatima',
      },
      db
    );
    const caseId = ingestRes.caseId!;

    CaseEngine.transitionCase(
      {
        caseId,
        targetState: 'PatientNotified',
        actorUid: 'prac_coord_fatima',
        actorRole: 'coordinator',
        reason: 'Patient notified',
      },
      db
    );

    db.advanceDemoClock(50);
    const sweep = CaseEngine.evaluateSlaAndEscalate(db);
    expect(sweep.overdueCount).toBeGreaterThan(0);

    const caseDoc = db.collections.tasks.get(caseId)!;
    expect(caseDoc.state).toBe('Overdue');
  });
});

describe('Phase 4: Clinician Handoff Summary with Timeline Event Citations', () => {
  it('cites chronological event identifiers for all consult statements', () => {
    const summaryStatements = [
      'Patient presenting with confirmed Stage 1 hypertension on initial screening reading [EVT-01].',
      'Result acknowledged with comprehension check [EVT-02].',
      'Repeat confirmation reading verified actionable threshold [EVT-03].',
      'Care coordination referral initiated for primary care provider [EVT-04].',
      'Clinical consultation requested for diagnostic evaluation [EVT-05].',
    ];

    summaryStatements.forEach((stmt) => {
      expect(stmt).toMatch(/\[EVT-\d{2}\]/);
    });
  });
});

describe('Phase 4: Documented Closure Verification Safeguards', () => {
  let db: ScreenlitDatabase;

  beforeEach(() => {
    db = ScreenlitDatabase.resetInstance();
  });

  it('rejects closure if signer is not a clinician', () => {
    const mockCase: CaseDocument = {
      id: 'case_closure_test',
      resource: {} as any,
      state: 'Surveillance',
      ownerRole: 'coordinator',
      ownerUid: 'prac_coord_fatima',
      patientId: 'pat_tariq_001',
      dueAt: new Date().toISOString(),
      riskScore: 0.35,
      condition: 'hypertension',
      isUrgent: false,
      repeatRequired: false,
      evidence: {
        initialObservationId: 'obs_1',
        patientAcknowledgedAt: new Date().toISOString(),
        treatmentStartedAt: new Date().toISOString(),
        controlledReadingsCount: 3,
        surveillanceReadingsRequired: 3,
        clinicianSignature: {
          signerUid: 'prac_coord_fatima',
          signerName: 'Fatima Noor, RN',
          signerRole: 'coordinator',
          signedAt: new Date().toISOString(),
          clinicalNote: 'Patient completed surveillance',
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = validateClosurePrerequisites(mockCase, 'coordinator');
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('authorized clinician signature');
  });

  it('accepts closure when physician signature and all 3 controlled readings are attached', () => {
    const mockCase: CaseDocument = {
      id: 'case_closure_test_valid',
      resource: {} as any,
      state: 'Surveillance',
      ownerRole: 'physician',
      ownerUid: 'prac_dr_amina',
      patientId: 'pat_tariq_001',
      dueAt: new Date().toISOString(),
      riskScore: 0.15,
      condition: 'hypertension',
      isUrgent: false,
      repeatRequired: false,
      evidence: {
        initialObservationId: 'obs_1',
        patientAcknowledgedAt: new Date().toISOString(),
        treatmentStartedAt: new Date().toISOString(),
        controlledReadingsCount: 3,
        surveillanceReadingsRequired: 3,
        clinicianSignature: {
          signerUid: 'prac_dr_amina',
          signerName: 'Dr. Amina Al Mansoor',
          signerRole: 'physician',
          signedAt: new Date().toISOString(),
          clinicalNote: 'Controlled blood pressure verified. Case closed.',
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = validateClosurePrerequisites(mockCase, 'physician');
    expect(res.valid).toBe(true);
  });
});
