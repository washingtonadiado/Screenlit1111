/**
 * Screenlit Phase 1 Unit Tests
 * Comprehensive unit testing for state machine transitions, clinical guards,
 * closure evidence validation, and security rules schema alignment
 */

import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  CASE_TRANSITIONS_TABLE,
  getNextEscalationStep,
  validateClosurePrerequisites,
  validateTransition,
} from '../shared/stateMachine';
import {
  CLINICAL_GUIDELINE_DISCLAIMER,
  SCREENLIT_CONFIG,
} from '../shared/config';
import { CaseDocument, CaseState, Role } from '../shared/types';

function createMockCase(overrides?: Partial<CaseDocument>): CaseDocument {
  return {
    id: 'case_test_mock',
    resource: {} as any,
    state: 'ResultIssued',
    ownerRole: 'coordinator',
    ownerUid: 'user_coord_1',
    patientId: 'pat_test_1',
    dueAt: new Date(Date.now() + 86400000).toISOString(),
    riskScore: 0.65,
    condition: 'hypertension',
    isUrgent: false,
    repeatRequired: true,
    evidence: {
      initialObservationId: 'obs_init_1',
      controlledReadingsCount: 0,
      surveillanceReadingsRequired: 3,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Phase 1: State Machine Transitions and Guard Exhaustiveness', () => {
  it('covers all allowed transitions across the lifecycle', () => {
    const states: CaseState[] = [
      'ResultIssued',
      'PatientNotified',
      'Acknowledged',
      'ConfirmationPending',
      'Confirmed',
      'Referred',
      'ReferralAccepted',
      'AppointmentBooked',
      'Attended',
      'TreatmentStarted',
      'Surveillance',
      'Closed',
      'Overdue',
      'Rejected',
      'Unassigned',
      'LostToFollowUp',
      'Reopened',
    ];

    states.forEach((state) => {
      const rule = CASE_TRANSITIONS_TABLE[state];
      expect(rule).toBeDefined();
      expect(rule.from).toBe(state);
      expect(rule.to.length).toBeGreaterThan(0);
      expect(rule.allowedRoles.length).toBeGreaterThan(0);
    });
  });

  it('rejects unauthorized role transitions', () => {
    const caseDoc = createMockCase({ state: 'ResultIssued' });
    const result = validateTransition(caseDoc, 'PatientNotified', 'patient');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not authorized');
  });

  it('rejects illegal transition hops', () => {
    const caseDoc = createMockCase({ state: 'ResultIssued' });
    const result = validateTransition(caseDoc, 'Attended', 'coordinator');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('is not allowed');
  });

  it('allows administrator override on valid transitions', () => {
    const caseDoc = createMockCase({ state: 'ResultIssued' });
    const result = validateTransition(caseDoc, 'PatientNotified', 'admin');
    expect(result.valid).toBe(true);
  });
});

describe('Phase 1: Strict Closure Guard Invariants', () => {
  it('strictly rejects non clinician roles attempting closure', () => {
    const readyCase = createMockCase({
      state: 'Surveillance',
      evidence: {
        initialObservationId: 'obs_1',
        patientAcknowledgedAt: new Date().toISOString(),
        treatmentStartedAt: new Date().toISOString(),
        controlledReadingsCount: 3,
        surveillanceReadingsRequired: 3,
        clinicianSignature: {
          signerUid: 'user_doc_1',
          signerName: 'Dr. Amina Al Mansoor',
          signerRole: 'physician',
          signedAt: new Date().toISOString(),
          clinicalNote: 'Stable control verified over 14 days.',
        },
      },
    });

    const patientClosure = validateClosurePrerequisites(readyCase, 'patient');
    expect(patientClosure.valid).toBe(false);
    expect(patientClosure.reason).toContain('authorized clinician signature');

    const coordinatorClosure = validateClosurePrerequisites(readyCase, 'coordinator');
    expect(coordinatorClosure.valid).toBe(false);
    expect(coordinatorClosure.reason).toContain('authorized clinician signature');
  });

  it('strictly rejects closure when patient acknowledgement is missing', () => {
    const caseMissingAck = createMockCase({
      state: 'Surveillance',
      evidence: {
        initialObservationId: 'obs_1',
        treatmentStartedAt: new Date().toISOString(),
        controlledReadingsCount: 3,
        surveillanceReadingsRequired: 3,
        clinicianSignature: {
          signerUid: 'user_doc_1',
          signerName: 'Dr. Amina Al Mansoor',
          signerRole: 'physician',
          signedAt: new Date().toISOString(),
          clinicalNote: 'Note',
        },
      },
    });

    const result = validateClosurePrerequisites(caseMissingAck, 'physician');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('patient acknowledgement');
  });

  it('strictly rejects closure when treatment start is missing', () => {
    const caseMissingTx = createMockCase({
      state: 'Surveillance',
      evidence: {
        initialObservationId: 'obs_1',
        patientAcknowledgedAt: new Date().toISOString(),
        controlledReadingsCount: 3,
        surveillanceReadingsRequired: 3,
        clinicianSignature: {
          signerUid: 'user_doc_1',
          signerName: 'Dr. Amina Al Mansoor',
          signerRole: 'physician',
          signedAt: new Date().toISOString(),
          clinicalNote: 'Note',
        },
      },
    });

    const result = validateClosurePrerequisites(caseMissingTx, 'physician');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('treatment initiation');
  });

  it('strictly rejects closure with insufficient controlled readings', () => {
    const insufficientReadingsCase = createMockCase({
      state: 'Surveillance',
      evidence: {
        initialObservationId: 'obs_1',
        patientAcknowledgedAt: new Date().toISOString(),
        treatmentStartedAt: new Date().toISOString(),
        controlledReadingsCount: 2,
        surveillanceReadingsRequired: 3,
        clinicianSignature: {
          signerUid: 'user_doc_1',
          signerName: 'Dr. Amina Al Mansoor',
          signerRole: 'physician',
          signedAt: new Date().toISOString(),
          clinicalNote: 'Note',
        },
      },
    });

    const result = validateClosurePrerequisites(insufficientReadingsCase, 'physician');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('controlled readings across the surveillance window');
  });

  it('strictly rejects closure without clinician signature', () => {
    const unsignedCase = createMockCase({
      state: 'Surveillance',
      evidence: {
        initialObservationId: 'obs_1',
        patientAcknowledgedAt: new Date().toISOString(),
        treatmentStartedAt: new Date().toISOString(),
        controlledReadingsCount: 3,
        surveillanceReadingsRequired: 3,
      },
    });

    const result = validateClosurePrerequisites(unsignedCase, 'physician');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('verified clinician electronic signature');
  });

  it('accepts closure when all clinical prerequisites and signatures are present', () => {
    const validCase = createMockCase({
      state: 'Surveillance',
      evidence: {
        initialObservationId: 'obs_1',
        patientAcknowledgedAt: new Date().toISOString(),
        treatmentStartedAt: new Date().toISOString(),
        controlledReadingsCount: 3,
        surveillanceReadingsRequired: 3,
        clinicianSignature: {
          signerUid: 'user_doc_1',
          signerName: 'Dr. Amina Al Mansoor',
          signerRole: 'physician',
          signedAt: new Date().toISOString(),
          clinicalNote: 'Complete resolution with confirmed blood pressure control.',
        },
      },
    });

    const result = validateClosurePrerequisites(validCase, 'physician');
    expect(result.valid).toBe(true);
  });
});

describe('Phase 1: Clinical Guideline Compliance and Configuration', () => {
  it('marks all clinical thresholds with required clinician disclaimer', () => {
    expect(SCREENLIT_CONFIG.hypertensionThresholds.disclaimer).toBe(
      CLINICAL_GUIDELINE_DISCLAIMER
    );
    expect(SCREENLIT_CONFIG.colorectalCancerThresholds.disclaimer).toBe(
      CLINICAL_GUIDELINE_DISCLAIMER
    );
    expect(SCREENLIT_CONFIG.pregnancyThresholds.disclaimer).toBe(
      CLINICAL_GUIDELINE_DISCLAIMER
    );
  });

  it('enforces exact hypertension threshold values', () => {
    expect(SCREENLIT_CONFIG.hypertensionThresholds.actionableSystolic).toBe(140);
    expect(SCREENLIT_CONFIG.hypertensionThresholds.actionableDiastolic).toBe(90);
    expect(SCREENLIT_CONFIG.hypertensionThresholds.urgentSystolic).toBe(180);
    expect(SCREENLIT_CONFIG.hypertensionThresholds.urgentDiastolic).toBe(110);
    expect(SCREENLIT_CONFIG.hypertensionThresholds.targetSystolic).toBe(140);
    expect(SCREENLIT_CONFIG.hypertensionThresholds.targetDiastolic).toBe(90);
  });

  it('routes urgent cases immediately to physician review', () => {
    const urgentEscalation = getNextEscalationStep('ResultIssued', 0, true);
    expect(urgentEscalation).toBeDefined();
    expect(urgentEscalation?.targetRole).toBe('physician');
    expect(urgentEscalation?.action).toBe('urgent_physician_escalation');
  });
});

describe('Phase 1: Blueprint and Firestore Rules Integrity', () => {
  it('validates that firebase blueprint covers all required collections', () => {
    const blueprintPath = path.resolve(import.meta.dirname, '../firebase-blueprint.json');
    expect(fs.existsSync(blueprintPath)).toBe(true);

    const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));
    expect(blueprint.entities).toBeDefined();
    expect(blueprint.firestore).toBeDefined();

    const expectedCollections = [
      '/patients/{patientId}',
      '/practitioners/{practitionerId}',
      '/organizations/{organizationId}',
      '/coverages/{coverageId}',
      '/devices/{deviceId}',
      '/observations/{observationId}',
      '/diagnosticReports/{reportId}',
      '/tasks/{taskId}',
      '/serviceRequests/{serviceRequestId}',
      '/appointments/{appointmentId}',
      '/carePlans/{carePlanId}',
      '/communications/{communicationId}',
      '/consents/{consentId}',
      '/auditEvents/{auditEventId}',
      '/users/{userId}',
      '/outbox/{outboxId}',
      '/aiOutputs/{aiOutputId}',
      '/config/{configDocId}',
      '/simulationRuns/{runId}',
    ];

    expectedCollections.forEach((coll) => {
      expect(blueprint.firestore[coll]).toBeDefined();
    });
  });

  it('validates that firestore.rules implements default deny and role helpers', () => {
    const rulesPath = path.resolve(import.meta.dirname, '../firestore.rules');
    expect(fs.existsSync(rulesPath)).toBe(true);

    const rules = fs.readFileSync(rulesPath, 'utf8');
    expect(rules).toContain("rules_version = '2';");
    expect(rules).toContain('match /{document=**} {\n      allow read, write: if false;\n    }');
    expect(rules).toContain('function isValidId(id)');
    expect(rules).toContain('function hasActiveConsent(patId)');
    expect(rules).toContain('match /tasks/{taskId}');
    expect(rules).toContain('match /auditEvents/{auditEventId}');
    expect(rules).toContain('allow write: if isValidId(taskId) && isAdmin();');
  });
});
