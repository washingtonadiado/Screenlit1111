/**
 * Screenlit Phase 0 Unit Tests
 * Validates shared types, state machine rules, and FHIR resource builders
 */

import { describe, expect, it } from 'vitest';
import {
  CASE_TRANSITIONS_TABLE,
  getNextEscalationStep,
  validateClosurePrerequisites,
  validateTransition,
} from '../shared/stateMachine';
import {
  buildAuditEvent,
  buildBloodPressureObservation,
  buildScreeningTask,
} from '../shared/fhir';
import { SCREENLIT_CONFIG } from '../shared/config';
import { CaseDocument } from '../shared/types';
import { generateSeedSkeleton } from '../scripts/seed';

describe('Phase 0: Shared State Machine and Rules', () => {
  it('defines all required canonical case states and transitions', () => {
    expect(CASE_TRANSITIONS_TABLE.ResultIssued).toBeDefined();
    expect(CASE_TRANSITIONS_TABLE.PatientNotified).toBeDefined();
    expect(CASE_TRANSITIONS_TABLE.Acknowledged).toBeDefined();
    expect(CASE_TRANSITIONS_TABLE.ConfirmationPending).toBeDefined();
    expect(CASE_TRANSITIONS_TABLE.Confirmed).toBeDefined();
    expect(CASE_TRANSITIONS_TABLE.Referred).toBeDefined();
    expect(CASE_TRANSITIONS_TABLE.ReferralAccepted).toBeDefined();
    expect(CASE_TRANSITIONS_TABLE.AppointmentBooked).toBeDefined();
    expect(CASE_TRANSITIONS_TABLE.Attended).toBeDefined();
    expect(CASE_TRANSITIONS_TABLE.TreatmentStarted).toBeDefined();
    expect(CASE_TRANSITIONS_TABLE.Surveillance).toBeDefined();
    expect(CASE_TRANSITIONS_TABLE.Closed).toBeDefined();
  });

  it('validates allowed transitions by role', () => {
    const mockCase: CaseDocument = {
      id: 'case_test_1',
      resource: {} as any,
      state: 'ResultIssued',
      ownerRole: 'coordinator',
      ownerUid: 'coord_1',
      patientId: 'pat_1',
      dueAt: new Date().toISOString(),
      riskScore: 0.75,
      condition: 'hypertension',
      isUrgent: false,
      repeatRequired: true,
      evidence: {
        initialObservationId: 'obs_1',
        controlledReadingsCount: 0,
        surveillanceReadingsRequired: 3,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const validResult = validateTransition(
      mockCase,
      'PatientNotified',
      'coordinator'
    );
    expect(validResult.valid).toBe(true);

    const unauthorizedResult = validateTransition(
      mockCase,
      'PatientNotified',
      'patient'
    );
    expect(unauthorizedResult.valid).toBe(false);

    const invalidStateResult = validateTransition(mockCase, 'Closed', 'coordinator');
    expect(invalidStateResult.valid).toBe(false);
  });

  it('strictly rejects closure without treatment, acknowledgement, readings, and clinician signature', () => {
    const mockCase: CaseDocument = {
      id: 'case_test_2',
      resource: {} as any,
      state: 'Surveillance',
      ownerRole: 'coordinator',
      ownerUid: 'coord_1',
      patientId: 'pat_1',
      dueAt: new Date().toISOString(),
      riskScore: 0.2,
      condition: 'hypertension',
      isUrgent: false,
      repeatRequired: false,
      evidence: {
        initialObservationId: 'obs_1',
        controlledReadingsCount: 1,
        surveillanceReadingsRequired: 3,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const patientAttempt = validateClosurePrerequisites(mockCase, 'patient');
    expect(patientAttempt.valid).toBe(false);
    expect(patientAttempt.reason).toContain('clinician signature');

    const physicianAttemptIncomplete = validateClosurePrerequisites(
      mockCase,
      'physician'
    );
    expect(physicianAttemptIncomplete.valid).toBe(false);

    mockCase.evidence.patientAcknowledgedAt = new Date().toISOString();
    mockCase.evidence.treatmentStartedAt = new Date().toISOString();
    mockCase.evidence.controlledReadingsCount = 3;
    mockCase.evidence.clinicianSignature = {
      signerUid: 'dr_amina',
      signerName: 'Dr. Amina Al Mansoor',
      signerRole: 'physician',
      signedAt: new Date().toISOString(),
      clinicalNote: 'Blood pressure controlled on dual therapy. Case closed.',
    };

    const completeAttempt = validateClosurePrerequisites(mockCase, 'physician');
    expect(completeAttempt.valid).toBe(true);
  });

  it('calculates escalation steps correctly for standard and urgent pathways', () => {
    const standardStep = getNextEscalationStep('PatientNotified', 50, false);
    expect(standardStep).toBeDefined();
    expect(standardStep?.targetRole).toBe('coordinator');

    const urgentStep = getNextEscalationStep('PatientNotified', 0, true);
    expect(urgentStep).toBeDefined();
    expect(urgentStep?.targetRole).toBe('physician');
  });

  it('builds valid FHIR R4 shaped observations and tasks', () => {
    const obs = buildBloodPressureObservation({
      id: 'obs_bp_test',
      patientId: 'pat_99',
      systolic: 165,
      diastolic: 102,
      recordedAt: new Date().toISOString(),
    });

    expect(obs.resourceType).toBe('Observation');
    expect(obs.component).toHaveLength(2);
    expect(obs.interpretation?.[0]?.coding?.[0]?.code).toBe('H');

    const task = buildScreeningTask({
      id: 'task_test',
      patientId: 'pat_99',
      focusObservationId: 'obs_bp_test',
      coordinatorId: 'coord_1',
      businessStatus: 'ResultIssued',
      isUrgent: false,
      dueAt: new Date().toISOString(),
      authoredOn: new Date().toISOString(),
    });

    expect(task.resourceType).toBe('Task');
    expect(task.for.reference).toBe('Patient/pat_99');

    const audit = buildAuditEvent({
      id: 'audit_test',
      action: 'C',
      recorded: new Date().toISOString(),
      actorUid: 'user_1',
      actorRole: 'coordinator',
      caseId: 'task_test',
      reason: 'Created test case',
    });

    expect(audit.resourceType).toBe('AuditEvent');
  });

  it('generates complete seed skeleton bundle', () => {
    const bundle = generateSeedSkeleton();
    expect(bundle.organizations.length).toBeGreaterThan(0);
    expect(bundle.practitioners.length).toBeGreaterThan(0);
    expect(bundle.users.length).toBeGreaterThan(0);
    expect(bundle.patients.length).toBeGreaterThan(0);
    expect(bundle.observations.length).toBeGreaterThan(0);
    expect(bundle.tasks.length).toBeGreaterThan(0);
    expect(bundle.auditEvents.length).toBeGreaterThan(0);
  });
});
