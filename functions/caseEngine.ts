/**
 * Screenlit Server Authoritative Case Engine
 * Executes state transitions, SLA escalation ladder, referral routing, and surveillance verification
 */

import {
  buildAuditEvent,
  buildBloodPressureObservation,
  buildReferralServiceRequest,
  buildScreeningTask,
} from '../shared/fhir';
import { SCREENLIT_CONFIG } from '../shared/config';
import {
  CaseDocument,
  CaseState,
  FHIRObservation,
  FHIRPractitioner,
  FHIRServiceRequest,
  OutboxItem,
  Role,
} from '../shared/types';
import {
  validateClosurePrerequisites,
  validateTransition,
} from '../shared/stateMachine';
import {
  CreateReferralRequest,
  CreateReferralResponse,
  IngestObservationRequest,
  IngestObservationResponse,
  TransitionCaseRequest,
  TransitionCaseResponse,
  WearableIngestPayload,
  WearableIngestResponse,
} from './types';
import { ScreenlitDatabase } from './storage';
import { AILayer } from './aiLayer';

export class CaseEngine {
  public static ingestObservation(
    req: IngestObservationRequest,
    db: ScreenlitDatabase = ScreenlitDatabase.getInstance()
  ): IngestObservationResponse {
    const nowIso = db.getNow().toISOString();
    const obsId = `obs_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const isUrgent =
      req.systolic >= SCREENLIT_CONFIG.hypertensionThresholds.urgentSystolic ||
      req.diastolic >= SCREENLIT_CONFIG.hypertensionThresholds.urgentDiastolic;

    const isActionable =
      isUrgent ||
      req.systolic >=
        SCREENLIT_CONFIG.hypertensionThresholds.actionableSystolic ||
      req.diastolic >=
        SCREENLIT_CONFIG.hypertensionThresholds.actionableDiastolic;

    const observation = buildBloodPressureObservation({
      id: obsId,
      patientId: req.patientId,
      systolic: req.systolic,
      diastolic: req.diastolic,
      recordedAt: req.recordedAt || nowIso,
      performerId: req.performerId,
      deviceId: req.deviceId,
      noteText: req.noteText,
    });

    db.collections.observations.set(obsId, observation);

    if (!isActionable) {
      return {
        success: true,
        observationId: obsId,
        caseCreated: false,
        isUrgent: false,
        isActionable: false,
      };
    }

    const taskId = `task_case_${Date.now()}`;
    const slaHours = isUrgent
      ? 2
      : SCREENLIT_CONFIG.slaHours.ResultIssued;
    const dueAt = new Date(
      db.getNow().getTime() + slaHours * 3600 * 1000
    ).toISOString();

    const initialOwnerUid = isUrgent ? 'prac_dr_amina' : 'prac_coord_fatima';
    const initialOwnerRole: Role = isUrgent ? 'physician' : 'coordinator';

    const taskResource = buildScreeningTask({
      id: taskId,
      patientId: req.patientId,
      focusObservationId: obsId,
      coordinatorId: initialOwnerUid,
      businessStatus: 'ResultIssued',
      isUrgent,
      dueAt,
      authoredOn: nowIso,
    });

    const riskScore = this.computeTransparentRiskScore({
      systolic: req.systolic,
      diastolic: req.diastolic,
      isUrgent,
      patientAge: 56,
      comorbiditiesCount: 1,
      hoursSinceResult: 0,
      priorEngagement: true,
    });

    const caseDoc: CaseDocument = {
      id: taskId,
      resource: taskResource,
      state: 'ResultIssued',
      ownerRole: initialOwnerRole,
      ownerUid: initialOwnerUid,
      patientId: req.patientId,
      dueAt,
      riskScore,
      condition: 'hypertension',
      isUrgent,
      repeatRequired: !isUrgent,
      evidence: {
        initialObservationId: obsId,
        controlledReadingsCount: 0,
        surveillanceReadingsRequired:
          SCREENLIT_CONFIG.hypertensionThresholds.surveillanceRequiredReadingsCount,
      },
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.collections.tasks.set(taskId, caseDoc);

    const auditId = `audit_${Date.now()}_init`;
    const audit = buildAuditEvent({
      id: auditId,
      action: 'C',
      recorded: nowIso,
      actorUid: req.performerId || 'system_engine',
      actorRole: req.performerRole || 'coordinator',
      caseId: taskId,
      reason: isUrgent
        ? 'Urgent hypertension screening detected. Routed to physician review.'
        : 'Actionable screening blood pressure recorded. Coordinator assigned.',
    });
    db.collections.auditEvents.set(auditId, audit);

    const outboxId = `outbox_${Date.now()}_init`;
    const outboxItem: OutboxItem = {
      id: outboxId,
      to: req.patientId,
      channel: 'sms',
      language: 'en',
      body: isUrgent
        ? 'Urgent health update: Your recent blood pressure reading was significantly elevated. A clinical coordinator has scheduled physician review.'
        : 'Important health update: Your recent screening blood pressure reading requires review. Please open your Screenlit portal to confirm next steps.',
      status: 'queued',
      patientId: req.patientId,
      caseId: taskId,
      createdAt: nowIso,
    };
    db.collections.outbox.set(outboxId, outboxItem);

    return {
      success: true,
      observationId: obsId,
      caseCreated: true,
      caseId: taskId,
      isUrgent,
      isActionable: true,
    };
  }

  public static transitionCase(
    req: TransitionCaseRequest,
    db: ScreenlitDatabase = ScreenlitDatabase.getInstance()
  ): TransitionCaseResponse {
    const caseDoc = db.collections.tasks.get(req.caseId);
    if (!caseDoc) {
      return { success: false, error: `Case not found: ${req.caseId}` };
    }

    const patientConsent = Array.from(db.collections.consents.values()).find(
      (c) => c.patient?.reference === `Patient/${caseDoc.patientId}` && c.status === 'active'
    );
    if (!patientConsent && req.actorRole !== 'admin' && req.actorRole !== 'patient') {
      return {
        success: false,
        error: `Active patient consent missing for patient: ${caseDoc.patientId}`,
      };
    }

    if (req.evidenceUpdates) {
      caseDoc.evidence = {
        ...caseDoc.evidence,
        ...req.evidenceUpdates,
      };
    }

    const validation = validateTransition(caseDoc, req.targetState, req.actorRole);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.reason || 'Invalid transition request',
      };
    }

    const nowIso = db.getNow().toISOString();
    const previousState = caseDoc.state;
    caseDoc.state = req.targetState;
    caseDoc.updatedAt = nowIso;
    caseDoc.resource.businessStatus.text = req.targetState;
    caseDoc.resource.lastModified = nowIso;

    if (req.targetState === 'Closed') {
      caseDoc.resource.status = 'completed';
    } else if (req.targetState === 'Rejected') {
      caseDoc.resource.status = 'on-hold';
    } else {
      caseDoc.resource.status = 'in-progress';
    }

    if (req.newOwnerUid) {
      caseDoc.ownerUid = req.newOwnerUid;
      if (req.newOwnerRole) {
        caseDoc.ownerRole = req.newOwnerRole;
      }
      caseDoc.resource.owner = {
        reference: `Practitioner/${req.newOwnerUid}`,
        type: 'Practitioner',
      };
    }

    const nextSla = (SCREENLIT_CONFIG.slaHours as Record<string, number>)[req.targetState] || 48;
    caseDoc.dueAt = new Date(
      db.getNow().getTime() + nextSla * 3600 * 1000
    ).toISOString();

    db.collections.tasks.set(caseDoc.id, caseDoc);

    const auditId = `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const audit = buildAuditEvent({
      id: auditId,
      action: 'U',
      recorded: nowIso,
      actorUid: req.actorUid,
      actorRole: req.actorRole,
      caseId: caseDoc.id,
      reason: `${req.reason} (State changed from ${previousState} to ${req.targetState})`,
    });
    db.collections.auditEvents.set(auditId, audit);

    if (req.targetState === 'PatientNotified') {
      // Look up the patient's preferred language for a localized message
      const patientUser = Array.from(db.collections.users.values()).find(
        (u) => u.linkedPatientId === caseDoc.patientId || u.uid === caseDoc.patientId
      );
      const patientLang = patientUser?.language || 'en';
      const patientName = patientUser?.displayName || 'Patient';

      const draftResult = AILayer.draftPatientMessage(
        {
          caseId: caseDoc.id,
          patientId: caseDoc.patientId,
          language: patientLang,
          messageType: 'result_issued',
          patientName,
          clinicName: 'Screenlit Health',
        },
        db
      );

      const outboxId = `outbox_${Date.now()}_notified`;
      const outboxItem: OutboxItem = {
        id: outboxId,
        to: caseDoc.patientId,
        channel: 'sms',
        language: patientLang,
        body: draftResult.safetyCheckPassed
          ? draftResult.messageText
          : 'Action required: Your screening result requires confirmation. Please acknowledge receipt in the Screenlit portal.',
        status: 'queued',
        patientId: caseDoc.patientId,
        caseId: caseDoc.id,
        createdAt: nowIso,
      };
      db.collections.outbox.set(outboxId, outboxItem);
    }

    return { success: true, caseDoc };
  }

  public static createReferral(
    req: CreateReferralRequest,
    db: ScreenlitDatabase = ScreenlitDatabase.getInstance()
  ): CreateReferralResponse {
    const caseDoc = db.collections.tasks.get(req.caseId);
    if (!caseDoc) {
      return { success: false, error: `Case not found: ${req.caseId}` };
    }

    const patient = db.collections.patients.get(req.patientId);
    const coverage = Array.from(db.collections.coverages.values()).find(
      (c) => c.beneficiary.reference === `Patient/${req.patientId}` && c.status === 'active'
    );

    let assignedPrac: FHIRPractitioner | undefined;
    if (req.preferredPractitionerId) {
      assignedPrac = db.collections.practitioners.get(req.preferredPractitionerId);
    }

    if (!assignedPrac && patient?.generalPractitioner?.[0]?.reference) {
      const gpId = patient.generalPractitioner[0].reference.replace('Practitioner/', '');
      assignedPrac = db.collections.practitioners.get(gpId);
    }

    if (!assignedPrac) {
      assignedPrac = Array.from(db.collections.practitioners.values())[0];
    }

    if (!assignedPrac) {
      return { success: false, error: 'No available practitioner found for referral' };
    }

    const nowIso = db.getNow().toISOString();
    const serviceRequestId = `sr_ref_${Date.now()}`;
    const serviceRequest = buildReferralServiceRequest({
      id: serviceRequestId,
      patientId: req.patientId,
      requesterId: req.requesterUid,
      performerId: assignedPrac.id,
      authoredOn: nowIso,
      reasonText: req.reasonText,
      isUrgent: caseDoc.isUrgent,
    });

    db.collections.serviceRequests.set(serviceRequestId, serviceRequest);

    const transitionRes = this.transitionCase(
      {
        caseId: req.caseId,
        targetState: 'Referred',
        actorUid: req.requesterUid,
        actorRole: req.requesterRole,
        reason: `${req.reasonText}. Referred to ${assignedPrac.name?.[0]?.text || assignedPrac.id}. Insurance network: ${coverage?.network || 'in_network'}.`,
        newOwnerUid: assignedPrac.id,
        newOwnerRole: 'physician',
        evidenceUpdates: {
          serviceRequestId,
        },
      },
      db
    );

    if (!transitionRes.success) {
      return { success: false, error: transitionRes.error };
    }

    return {
      success: true,
      serviceRequest,
      assignedPractitioner: assignedPrac,
      caseDoc: transitionRes.caseDoc,
    };
  }

  public static rejectReferralAndTransfer(
    params: {
      caseId: string;
      rejectionReason: string;
      newPractitionerId: string;
      actorUid: string;
      actorRole: Role;
    },
    db: ScreenlitDatabase = ScreenlitDatabase.getInstance()
  ): { success: boolean; caseDoc?: CaseDocument; error?: string } {
    const caseDoc = db.collections.tasks.get(params.caseId);
    if (!caseDoc) {
      return { success: false, error: 'Case not found' };
    }

    const rejectRes = this.transitionCase(
      {
        caseId: params.caseId,
        targetState: 'Rejected',
        actorUid: params.actorUid,
        actorRole: params.actorRole,
        reason: `Referral rejected: ${params.rejectionReason}`,
        newOwnerUid: 'prac_coord_fatima',
        newOwnerRole: 'coordinator',
      },
      db
    );

    if (!rejectRes.success) {
      return { success: false, error: rejectRes.error };
    }

    const newPractitioner = db.collections.practitioners.get(params.newPractitionerId);
    if (!newPractitioner) {
      return { success: false, error: 'Target transfer practitioner not found' };
    }

    const transferRes = this.createReferral(
      {
        caseId: params.caseId,
        patientId: caseDoc.patientId,
        requesterUid: params.actorUid,
        requesterRole: params.actorRole,
        reasonText: `Transfer referral after rejection. Target: ${newPractitioner.name?.[0]?.text || newPractitioner.id}`,
        preferredPractitionerId: params.newPractitionerId,
      },
      db
    );

    return {
      success: transferRes.success,
      caseDoc: transferRes.caseDoc,
      error: transferRes.error,
    };
  }

  public static evaluateSlaAndEscalate(
    db: ScreenlitDatabase = ScreenlitDatabase.getInstance()
  ): { escalatedCount: number; overdueCount: number } {
    const now = db.getNow();
    let escalatedCount = 0;
    let overdueCount = 0;

    for (const [taskId, caseDoc] of db.collections.tasks.entries()) {
      if (
        caseDoc.state === 'Closed' ||
        caseDoc.state === 'LostToFollowUp'
      ) {
        continue;
      }

      const dueDate = new Date(caseDoc.dueAt);
      if (now > dueDate) {
        overdueCount++;
        const hoursOverdue = (now.getTime() - dueDate.getTime()) / (3600 * 1000);

        if (caseDoc.state !== 'Overdue') {
          caseDoc.state = 'Overdue';
          caseDoc.resource.businessStatus.text = 'Overdue';
          caseDoc.updatedAt = now.toISOString();

          const auditId = `audit_${Date.now()}_overdue_${taskId}`;
          db.collections.auditEvents.set(
            auditId,
            buildAuditEvent({
              id: auditId,
              action: 'U',
              recorded: now.toISOString(),
              actorUid: 'scheduler_daemon',
              actorRole: 'coordinator',
              caseId: taskId,
              reason: `SLA window breached (${hoursOverdue.toFixed(1)} hours past deadline). Case marked Overdue.`,
            })
          );
        }

        if (caseDoc.isUrgent) {
          caseDoc.ownerRole = 'physician';
          caseDoc.ownerUid = 'prac_dr_amina';
          escalatedCount++;

          const outboxId = `outbox_${Date.now()}_urgent_esc_${taskId}`;
          db.collections.outbox.set(outboxId, {
            id: outboxId,
            to: caseDoc.ownerUid,
            channel: 'push',
            language: 'en',
            body: `URGENT ESCALATION: Case ${taskId} is overdue with critical blood pressure. Immediate clinical review required.`,
            status: 'queued',
            patientId: caseDoc.patientId,
            caseId: taskId,
            createdAt: now.toISOString(),
          });
        } else if (hoursOverdue >= 24) {
          caseDoc.ownerRole = 'coordinator';
          caseDoc.ownerUid = 'prac_coord_fatima';
          escalatedCount++;

          const outboxId = `outbox_${Date.now()}_coord_esc_${taskId}`;
          db.collections.outbox.set(outboxId, {
            id: outboxId,
            to: caseDoc.ownerUid,
            channel: 'push',
            language: 'en',
            body: `Overdue outreach task: Case ${taskId} requires telephone coordination.`,
            status: 'queued',
            patientId: caseDoc.patientId,
            caseId: taskId,
            createdAt: now.toISOString(),
          });
        }
      }
    }

    return { escalatedCount, overdueCount };
  }

  public static ingestWearable(
    payload: WearableIngestPayload,
    db: ScreenlitDatabase = ScreenlitDatabase.getInstance()
  ): WearableIngestResponse {
    const expectedDeviceId = db.collections.deviceApiKeys.get(payload.deviceApiKey);
    if (!expectedDeviceId || expectedDeviceId !== payload.deviceId) {
      return {
        success: false,
        observationIds: [],
        error: 'Unauthorized device API key or device ID mismatch',
      };
    }

    const nowIso = db.getNow().toISOString();
    const createdObsIds: string[] = [];

    if (payload.metrics.restingHeartRateBpm !== undefined) {
      const hrId = `obs_hr_${Date.now()}`;
      const hrObs: FHIRObservation = {
        resourceType: 'Observation',
        id: hrId,
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'vital-signs',
                display: 'Vital Signs',
              },
            ],
          },
        ],
        code: {
          coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }],
          text: 'Resting heart rate',
        },
        subject: { reference: `Patient/${payload.patientId}` },
        device: { reference: `Device/${payload.deviceId}` },
        effectiveDateTime: payload.recordedAt || nowIso,
        valueQuantity: {
          value: payload.metrics.restingHeartRateBpm,
          unit: 'beats/minute',
          system: 'http://unitsofmeasure.org',
          code: '/min',
        },
        note: [
          {
            text: 'Wearable continuous monitoring signal. Note: Wristband does not measure blood pressure.',
          },
        ],
      };
      db.collections.observations.set(hrId, hrObs);
      createdObsIds.push(hrId);
    }

    let baselineDeviation: WearableIngestResponse['baselineDeviationFlag'];
    if (payload.metrics.restingHeartRateBpm !== undefined) {
      const baselineMean = 68;
      const baselineStdDev = 4.2;
      const zScore = (payload.metrics.restingHeartRateBpm - baselineMean) / baselineStdDev;

      if (Math.abs(zScore) >= SCREENLIT_CONFIG.wearableMonitoring.zScoreThreshold) {
        baselineDeviation = {
          metric: 'restingHeartRateBpm',
          zScore: parseFloat(zScore.toFixed(2)),
          flagged: true,
          disclaimer: 'Not clinically validated',
        };

        const activeCases = Array.from(db.collections.tasks.values()).filter(
          (t) => t.patientId === payload.patientId && t.state !== 'Closed'
        );

        activeCases.forEach((activeCase) => {
          if (!activeCase.aiFlags) {
            activeCase.aiFlags = [];
          }
          activeCase.aiFlags.push({
            id: `flag_${Date.now()}_${activeCase.id}`,
            type: 'baseline_change',
            flaggedAt: nowIso,
            description: `Resting heart rate shifted to ${payload.metrics.restingHeartRateBpm} bpm (z score ${zScore.toFixed(1)}). Prompt for clinical team review.`,
            status: 'pending_review',
            disclaimer: 'Not clinically validated',
          });
        });
      }
    }

    return {
      success: true,
      observationIds: createdObsIds,
      baselineDeviationFlag: baselineDeviation,
    };
  }

  public static reopenCaseForSurveillanceLapse(
    params: {
      caseId: string;
      reason: string;
      actorUid: string;
      actorRole: Role;
    },
    db: ScreenlitDatabase = ScreenlitDatabase.getInstance()
  ): { success: boolean; caseDoc?: CaseDocument; error?: string } {
    const caseDoc = db.collections.tasks.get(params.caseId);
    if (!caseDoc) {
      return { success: false, error: 'Case not found' };
    }

    if (caseDoc.state !== 'Closed') {
      return {
        success: false,
        error: `Only Closed cases can be reopened. Current state: ${caseDoc.state}`,
      };
    }

    return this.transitionCase(
      {
        caseId: params.caseId,
        targetState: 'Reopened',
        actorUid: params.actorUid,
        actorRole: params.actorRole,
        reason: `Surveillance lapse detected: ${params.reason}`,
        newOwnerUid: 'prac_coord_fatima',
        newOwnerRole: 'coordinator',
      },
      db
    );
  }

  private static computeTransparentRiskScore(inputs: {
    systolic: number;
    diastolic: number;
    isUrgent: boolean;
    patientAge: number;
    comorbiditiesCount: number;
    hoursSinceResult: number;
    priorEngagement: boolean;
  }): number {
    const c = SCREENLIT_CONFIG.riskScoringCoefficients;
    let logit = c.intercept;

    if (inputs.isUrgent) {
      logit += c.severityUrgent;
    } else {
      logit += c.severityActionable;
    }

    if (inputs.patientAge >= 60) {
      logit += c.ageOver60;
    }

    logit += inputs.comorbiditiesCount * c.comorbidityCountWeight;
    logit += inputs.hoursSinceResult * c.hoursSinceResultWeight;

    if (!inputs.priorEngagement) {
      logit += c.noPriorEngagement;
    }

    const prob = 1 / (1 + Math.exp(-logit));
    return parseFloat(prob.toFixed(2));
  }
}
