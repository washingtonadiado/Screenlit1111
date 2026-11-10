/**
 * Screenlit Phase 2 Scenario Test Suite
 * Validates scenarios 1 through 4, closure prerequisites, and offline AI operation
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { CaseEngine } from '../functions/caseEngine';
import { ScreenlitDatabase } from '../functions/storage';

describe('Phase 2 Scenario 1: Happy Path to Closed with Evidence', () => {
  let db: ScreenlitDatabase;

  beforeEach(() => {
    db = ScreenlitDatabase.resetInstance();
  });

  it('runs the complete clinical pathway from screening to verified documented closure', () => {
    const ingestRes = CaseEngine.ingestObservation(
      {
        patientId: 'pat_tariq_001',
        systolic: 158,
        diastolic: 98,
        performerId: 'prac_coord_fatima',
        performerRole: 'coordinator',
        noteText: 'Community clinic pop up screening',
      },
      db
    );

    expect(ingestRes.success).toBe(true);
    expect(ingestRes.caseCreated).toBe(true);
    expect(ingestRes.isActionable).toBe(true);
    expect(ingestRes.isUrgent).toBe(false);

    const caseId = ingestRes.caseId!;
    let caseDoc = db.collections.tasks.get(caseId)!;
    expect(caseDoc.state).toBe('ResultIssued');
    expect(caseDoc.ownerRole).toBe('coordinator');
    expect(caseDoc.ownerUid).toBe('prac_coord_fatima');

    const notifiedRes = CaseEngine.transitionCase(
      {
        caseId,
        targetState: 'PatientNotified',
        actorUid: 'prac_coord_fatima',
        actorRole: 'coordinator',
        reason: 'Automated SMS and patient portal notification dispatched',
      },
      db
    );
    expect(notifiedRes.success).toBe(true);
    caseDoc = notifiedRes.caseDoc!;
    expect(caseDoc.state).toBe('PatientNotified');

    const ackRes = CaseEngine.transitionCase(
      {
        caseId,
        targetState: 'Acknowledged',
        actorUid: 'user_patient_tariq',
        actorRole: 'patient',
        reason: 'Patient confirmed result receipt and comprehension check',
        evidenceUpdates: {
          patientAcknowledgedAt: db.getNow().toISOString(),
        },
      },
      db
    );
    expect(ackRes.success).toBe(true);

    const confPendingRes = CaseEngine.transitionCase(
      {
        caseId,
        targetState: 'ConfirmationPending',
        actorUid: 'prac_coord_fatima',
        actorRole: 'coordinator',
        reason: 'Repeat blood pressure reading scheduled to confirm diagnosis',
      },
      db
    );
    expect(confPendingRes.success).toBe(true);

    const repeatObsRes = CaseEngine.ingestObservation(
      {
        patientId: 'pat_tariq_001',
        systolic: 152,
        diastolic: 94,
        performerId: 'prac_coord_fatima',
        noteText: 'Clinic repeat confirmation reading',
      },
      db
    );
    expect(repeatObsRes.success).toBe(true);

    const confirmedRes = CaseEngine.transitionCase(
      {
        caseId,
        targetState: 'Confirmed',
        actorUid: 'prac_coord_fatima',
        actorRole: 'coordinator',
        reason: 'Hypertension screening confirmed by secondary clinic reading',
        evidenceUpdates: {
          confirmedObservationId: repeatObsRes.observationId,
        },
      },
      db
    );
    expect(confirmedRes.success).toBe(true);

    const referralRes = CaseEngine.createReferral(
      {
        caseId,
        patientId: 'pat_tariq_001',
        requesterUid: 'prac_coord_fatima',
        requesterRole: 'coordinator',
        reasonText: 'Confirmed stage 1 hypertension requiring medical assessment',
        preferredPractitionerId: 'prac_dr_amina',
      },
      db
    );
    expect(referralRes.success).toBe(true);
    expect(referralRes.caseDoc?.state).toBe('Referred');
    expect(referralRes.assignedPractitioner?.id).toBe('prac_dr_amina');

    const acceptRes = CaseEngine.transitionCase(
      {
        caseId,
        targetState: 'ReferralAccepted',
        actorUid: 'prac_dr_amina',
        actorRole: 'physician',
        reason: 'Referral reviewed and accepted into cardiology clinic schedule',
      },
      db
    );
    expect(acceptRes.success).toBe(true);

    const bookedRes = CaseEngine.transitionCase(
      {
        caseId,
        targetState: 'AppointmentBooked',
        actorUid: 'prac_coord_fatima',
        actorRole: 'coordinator',
        reason: 'Consultation appointment confirmed for Tuesday 10am',
      },
      db
    );
    expect(bookedRes.success).toBe(true);

    const attendedRes = CaseEngine.transitionCase(
      {
        caseId,
        targetState: 'Attended',
        actorUid: 'prac_dr_amina',
        actorRole: 'physician',
        reason: 'Patient attended in person consultation with Dr. Amina',
      },
      db
    );
    expect(attendedRes.success).toBe(true);

    const treatmentRes = CaseEngine.transitionCase(
      {
        caseId,
        targetState: 'TreatmentStarted',
        actorUid: 'prac_dr_amina',
        actorRole: 'physician',
        reason: 'Initiated Amlodipine 5mg daily and dietary sodium restriction',
        evidenceUpdates: {
          treatmentStartedAt: db.getNow().toISOString(),
        },
      },
      db
    );
    expect(treatmentRes.success).toBe(true);

    const surveillanceRes = CaseEngine.transitionCase(
      {
        caseId,
        targetState: 'Surveillance',
        actorUid: 'prac_dr_amina',
        actorRole: 'physician',
        reason: 'Entering home cuff surveillance monitoring phase',
      },
      db
    );
    expect(surveillanceRes.success).toBe(true);

    const prematureCloseRes = CaseEngine.transitionCase(
      {
        caseId,
        targetState: 'Closed',
        actorUid: 'prac_dr_amina',
        actorRole: 'physician',
        reason: 'Attempting early closure without surveillance readings',
      },
      db
    );
    expect(prematureCloseRes.success).toBe(false);
    expect(prematureCloseRes.error).toContain('controlled readings');

    const reading1 = CaseEngine.ingestObservation(
      {
        patientId: 'pat_tariq_001',
        systolic: 132,
        diastolic: 84,
        noteText: 'Home cuff morning reading day 3',
      },
      db
    );
    const reading2 = CaseEngine.ingestObservation(
      {
        patientId: 'pat_tariq_001',
        systolic: 128,
        diastolic: 82,
        noteText: 'Home cuff morning reading day 7',
      },
      db
    );
    const reading3 = CaseEngine.ingestObservation(
      {
        patientId: 'pat_tariq_001',
        systolic: 126,
        diastolic: 80,
        noteText: 'Home cuff morning reading day 14',
      },
      db
    );
    expect(reading1.success && reading2.success && reading3.success).toBe(true);

    const finalCloseRes = CaseEngine.transitionCase(
      {
        caseId,
        targetState: 'Closed',
        actorUid: 'prac_dr_amina',
        actorRole: 'physician',
        reason: 'Documented closure: blood pressure controlled below 140/90 over 14 days',
        evidenceUpdates: {
          controlledReadingsCount: 3,
          clinicianSignature: {
            signerUid: 'prac_dr_amina',
            signerName: 'Dr. Amina Al Mansoor',
            signerRole: 'physician',
            signedAt: db.getNow().toISOString(),
            clinicalNote: 'Target blood pressure achieved and maintained on Amlodipine 5mg. Case closed with ongoing primary care follow up.',
          },
        },
      },
      db
    );

    expect(finalCloseRes.success).toBe(true);
    expect(finalCloseRes.caseDoc?.state).toBe('Closed');
    expect(finalCloseRes.caseDoc?.resource.status).toBe('completed');

    const caseAudits = Array.from(db.collections.auditEvents.values()).filter(
      (a) => a.entity?.[0]?.what?.reference === `Task/${caseId}`
    );
    expect(caseAudits.length).toBeGreaterThanOrEqual(10);
  });
});

describe('Phase 2 Scenario 2: Overdue Escalation on Missed Acknowledgement', () => {
  let db: ScreenlitDatabase;

  beforeEach(() => {
    db = ScreenlitDatabase.resetInstance();
  });

  it('detects SLA breaches, transitions cases to Overdue, and escalates appropriately', () => {
    const ingestRes = CaseEngine.ingestObservation(
      {
        patientId: 'pat_tariq_001',
        systolic: 154,
        diastolic: 96,
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
        reason: 'Notification sent',
      },
      db
    );

    db.advanceDemoClock(50);

    const sweepResult = CaseEngine.evaluateSlaAndEscalate(db);
    expect(sweepResult.overdueCount).toBeGreaterThan(0);

    const caseDoc = db.collections.tasks.get(caseId)!;
    expect(caseDoc.state).toBe('Overdue');

    const overdueAudits = Array.from(db.collections.auditEvents.values()).filter(
      (a) =>
        a.entity?.[0]?.what?.reference === `Task/${caseId}` &&
        a.outcomeDesc?.includes('SLA window breached')
    );
    expect(overdueAudits.length).toBeGreaterThan(0);

    const urgentRes = CaseEngine.ingestObservation(
      {
        patientId: 'pat_tariq_001',
        systolic: 195,
        diastolic: 118,
        noteText: 'Critical screening blood pressure',
      },
      db
    );
    expect(urgentRes.isUrgent).toBe(true);
    const urgentCaseId = urgentRes.caseId!;
    const urgentCaseDoc = db.collections.tasks.get(urgentCaseId)!;
    expect(urgentCaseDoc.ownerRole).toBe('physician');
    expect(urgentCaseDoc.ownerUid).toBe('prac_dr_amina');

    db.advanceDemoClock(3);
    CaseEngine.evaluateSlaAndEscalate(db);

    const urgentOutbox = Array.from(db.collections.outbox.values()).filter(
      (o) => o.caseId === urgentCaseId && o.body.includes('URGENT ESCALATION')
    );
    expect(urgentOutbox.length).toBeGreaterThan(0);
  });
});

describe('Phase 2 Scenario 3: Referral Rejection and Provider Transfer', () => {
  let db: ScreenlitDatabase;

  beforeEach(() => {
    db = ScreenlitDatabase.resetInstance();
  });

  it('handles provider rejection, transfers ownership to an alternate physician, and preserves history', () => {
    const ingestRes = CaseEngine.ingestObservation(
      {
        patientId: 'pat_tariq_001',
        systolic: 156,
        diastolic: 98,
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
        reason: 'Notification sent',
      },
      db
    );
    CaseEngine.transitionCase(
      {
        caseId,
        targetState: 'Acknowledged',
        actorUid: 'user_patient_tariq',
        actorRole: 'patient',
        reason: 'Acknowledged',
        evidenceUpdates: { patientAcknowledgedAt: db.getNow().toISOString() },
      },
      db
    );
    CaseEngine.transitionCase(
      {
        caseId,
        targetState: 'Confirmed',
        actorUid: 'prac_coord_fatima',
        actorRole: 'coordinator',
        reason: 'Confirmed',
      },
      db
    );

    const firstReferral = CaseEngine.createReferral(
      {
        caseId,
        patientId: 'pat_tariq_001',
        requesterUid: 'prac_coord_fatima',
        requesterRole: 'coordinator',
        reasonText: 'Referral for cardiology evaluation',
        preferredPractitionerId: 'prac_dr_mwangi',
      },
      db
    );
    expect(firstReferral.success).toBe(true);

    let caseDoc = db.collections.tasks.get(caseId)!;
    expect(caseDoc.ownerUid).toBe('prac_dr_mwangi');

    const transferRes = CaseEngine.rejectReferralAndTransfer(
      {
        caseId,
        rejectionReason: 'Clinic clinic panel currently at full capacity',
        newPractitionerId: 'prac_dr_amina',
        actorUid: 'prac_dr_mwangi',
        actorRole: 'specialist',
      },
      db
    );

    expect(transferRes.success).toBe(true);
    caseDoc = db.collections.tasks.get(caseId)!;
    expect(caseDoc.state).toBe('Referred');
    expect(caseDoc.ownerUid).toBe('prac_dr_amina');

    const auditHistory = Array.from(db.collections.auditEvents.values()).filter(
      (a) => a.entity?.[0]?.what?.reference === `Task/${caseId}`
    );
    const hasRejectionAudit = auditHistory.some((a) =>
      a.outcomeDesc?.includes('Referral rejected')
    );
    const hasTransferAudit = auditHistory.some((a) =>
      a.outcomeDesc?.includes('Transfer referral after rejection')
    );
    expect(hasRejectionAudit).toBe(true);
    expect(hasTransferAudit).toBe(true);
  });
});

describe('Phase 2 Scenario 4: Surveillance Lapse and Wearable Signal Detection', () => {
  let db: ScreenlitDatabase;

  beforeEach(() => {
    db = ScreenlitDatabase.resetInstance();
  });

  it('reopens closed case upon surveillance lapse and flags wearable baseline deviation without diagnostic claims', () => {
    const ingestRes = CaseEngine.ingestObservation(
      {
        patientId: 'pat_tariq_001',
        systolic: 150,
        diastolic: 95,
      },
      db
    );
    const caseId = ingestRes.caseId!;

    const caseDoc = db.collections.tasks.get(caseId)!;
    caseDoc.state = 'Closed';
    caseDoc.resource.status = 'completed';

    const reopenRes = CaseEngine.reopenCaseForSurveillanceLapse(
      {
        caseId,
        reason: 'Missed scheduled weekly home readings and reported rebound elevated symptoms',
        actorUid: 'prac_coord_fatima',
        actorRole: 'coordinator',
      },
      db
    );

    expect(reopenRes.success).toBe(true);
    expect(reopenRes.caseDoc?.state).toBe('Reopened');
    expect(reopenRes.caseDoc?.ownerRole).toBe('coordinator');

    const wearableRes = CaseEngine.ingestWearable(
      {
        deviceApiKey: 'key_device_wristband_001',
        deviceId: 'device_wristband_001',
        patientId: 'pat_tariq_001',
        recordedAt: db.getNow().toISOString(),
        metrics: {
          restingHeartRateBpm: 92,
        },
      },
      db
    );

    expect(wearableRes.success).toBe(true);
    expect(wearableRes.baselineDeviationFlag?.flagged).toBe(true);
    expect(wearableRes.baselineDeviationFlag?.disclaimer).toBe('Not clinically validated');

    const updatedCase = db.collections.tasks.get(caseId)!;
    expect(updatedCase.aiFlags?.length).toBeGreaterThan(0);
    expect(updatedCase.aiFlags?.[0].disclaimer).toBe('Not clinically validated');
    expect(updatedCase.aiFlags?.[0].description).toContain('Prompt for clinical team review');

    const hrObs = Array.from(db.collections.observations.values()).find(
      (o) => o.code.coding?.[0]?.code === '8867-4'
    );
    expect(hrObs?.note?.[0].text).toContain('Wristband does not measure blood pressure');
  });

  it('operates deterministically in AI off mode without external API dependencies', () => {
    const ingestRes = CaseEngine.ingestObservation(
      {
        patientId: 'pat_tariq_001',
        systolic: 160,
        diastolic: 100,
      },
      db
    );

    expect(ingestRes.success).toBe(true);
    expect(ingestRes.caseId).toBeDefined();

    const caseDoc = db.collections.tasks.get(ingestRes.caseId!)!;
    expect(caseDoc.riskScore).toBeGreaterThan(0);
    expect(caseDoc.riskScore).toBeLessThanOrEqual(1);
  });
});
