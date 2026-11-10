/**
 * Screenlit Case State Machine
 * Server authoritative transitions, guards, SLA windows, and escalation rules
 */

import { SCREENLIT_CONFIG } from './config';
import {
  CaseDocument,
  CaseState,
  EscalationStep,
  Role,
  StateTransitionRule,
} from './types';

export const CASE_TRANSITIONS_TABLE: Record<CaseState, StateTransitionRule> = {
  ResultIssued: {
    from: 'ResultIssued',
    to: ['PatientNotified', 'Overdue', 'Unassigned'],
    allowedRoles: ['coordinator', 'physician', 'admin'],
    defaultOwnerRole: 'coordinator',
    slaHours: SCREENLIT_CONFIG.slaHours.ResultIssued,
    escalationLadder: SCREENLIT_CONFIG.escalationLadders.standard,
  },

  PatientNotified: {
    from: 'PatientNotified',
    to: ['Acknowledged', 'Overdue', 'LostToFollowUp'],
    allowedRoles: ['patient', 'caregiver', 'coordinator', 'admin'],
    defaultOwnerRole: 'patient',
    slaHours: SCREENLIT_CONFIG.slaHours.PatientNotified,
    escalationLadder: SCREENLIT_CONFIG.escalationLadders.standard,
  },

  Acknowledged: {
    from: 'Acknowledged',
    to: ['ConfirmationPending', 'Confirmed', 'Referred', 'Overdue'],
    allowedRoles: ['coordinator', 'physician', 'admin'],
    defaultOwnerRole: 'coordinator',
    slaHours: SCREENLIT_CONFIG.slaHours.Acknowledged,
    escalationLadder: SCREENLIT_CONFIG.escalationLadders.standard,
  },

  ConfirmationPending: {
    from: 'ConfirmationPending',
    to: ['Confirmed', 'Overdue', 'LostToFollowUp'],
    allowedRoles: ['patient', 'coordinator', 'physician', 'admin'],
    defaultOwnerRole: 'patient',
    slaHours: SCREENLIT_CONFIG.slaHours.ConfirmationPending,
    escalationLadder: SCREENLIT_CONFIG.escalationLadders.standard,
    guardConditionName: 'requiresRepeatObservation',
  },

  Confirmed: {
    from: 'Confirmed',
    to: ['Referred', 'AppointmentBooked', 'Overdue'],
    allowedRoles: ['coordinator', 'physician', 'admin'],
    defaultOwnerRole: 'coordinator',
    slaHours: SCREENLIT_CONFIG.slaHours.Confirmed,
    escalationLadder: SCREENLIT_CONFIG.escalationLadders.standard,
  },

  Referred: {
    from: 'Referred',
    to: ['ReferralAccepted', 'Rejected', 'Overdue'],
    allowedRoles: ['physician', 'specialist', 'admin'],
    defaultOwnerRole: 'physician',
    slaHours: SCREENLIT_CONFIG.slaHours.Referred,
    escalationLadder: SCREENLIT_CONFIG.escalationLadders.standard,
    guardConditionName: 'requiresPhysicianApproval',
  },

  ReferralAccepted: {
    from: 'ReferralAccepted',
    to: ['AppointmentBooked', 'Overdue', 'Unassigned'],
    allowedRoles: ['coordinator', 'physician', 'specialist', 'admin'],
    defaultOwnerRole: 'coordinator',
    slaHours: SCREENLIT_CONFIG.slaHours.ReferralAccepted,
    escalationLadder: SCREENLIT_CONFIG.escalationLadders.standard,
  },

  AppointmentBooked: {
    from: 'AppointmentBooked',
    to: ['Attended', 'Overdue', 'LostToFollowUp'],
    allowedRoles: ['patient', 'coordinator', 'physician', 'specialist', 'admin'],
    defaultOwnerRole: 'coordinator',
    slaHours: SCREENLIT_CONFIG.slaHours.AppointmentBooked,
    escalationLadder: SCREENLIT_CONFIG.escalationLadders.standard,
  },

  Attended: {
    from: 'Attended',
    to: ['TreatmentStarted', 'Closed', 'Overdue'],
    allowedRoles: ['physician', 'specialist', 'admin'],
    defaultOwnerRole: 'physician',
    slaHours: SCREENLIT_CONFIG.slaHours.Attended,
    escalationLadder: SCREENLIT_CONFIG.escalationLadders.standard,
  },

  TreatmentStarted: {
    from: 'TreatmentStarted',
    to: ['Surveillance', 'Closed', 'Overdue'],
    allowedRoles: ['physician', 'specialist', 'coordinator', 'admin'],
    defaultOwnerRole: 'coordinator',
    slaHours: SCREENLIT_CONFIG.slaHours.TreatmentStarted,
    escalationLadder: SCREENLIT_CONFIG.escalationLadders.standard,
  },

  Surveillance: {
    from: 'Surveillance',
    to: ['Closed', 'Reopened', 'Overdue'],
    allowedRoles: ['physician', 'specialist', 'admin'],
    defaultOwnerRole: 'coordinator',
    slaHours: SCREENLIT_CONFIG.slaHours.Surveillance,
    escalationLadder: SCREENLIT_CONFIG.escalationLadders.standard,
    guardConditionName: 'requiresFullClosureEvidence',
  },

  Closed: {
    from: 'Closed',
    to: ['Reopened'],
    allowedRoles: ['coordinator', 'physician', 'admin'],
    defaultOwnerRole: 'physician',
    slaHours: 0,
    escalationLadder: [],
  },

  Overdue: {
    from: 'Overdue',
    to: [
      'PatientNotified',
      'Acknowledged',
      'Confirmed',
      'Referred',
      'ReferralAccepted',
      'AppointmentBooked',
      'Attended',
      'TreatmentStarted',
      'Surveillance',
      'LostToFollowUp',
      'Closed',
    ],
    allowedRoles: ['coordinator', 'physician', 'admin'],
    defaultOwnerRole: 'coordinator',
    slaHours: SCREENLIT_CONFIG.slaHours.Overdue,
    escalationLadder: SCREENLIT_CONFIG.escalationLadders.standard,
  },

  Rejected: {
    from: 'Rejected',
    to: ['Referred', 'Unassigned'],
    allowedRoles: ['coordinator', 'physician', 'specialist', 'admin'],
    defaultOwnerRole: 'coordinator',
    slaHours: SCREENLIT_CONFIG.slaHours.Rejected,
    escalationLadder: SCREENLIT_CONFIG.escalationLadders.standard,
  },

  Unassigned: {
    from: 'Unassigned',
    to: ['PatientNotified', 'Confirmed', 'Referred'],
    allowedRoles: ['coordinator', 'physician', 'admin'],
    defaultOwnerRole: 'coordinator',
    slaHours: SCREENLIT_CONFIG.slaHours.Unassigned,
    escalationLadder: SCREENLIT_CONFIG.escalationLadders.standard,
  },

  LostToFollowUp: {
    from: 'LostToFollowUp',
    to: ['Reopened'],
    allowedRoles: ['coordinator', 'physician', 'admin'],
    defaultOwnerRole: 'coordinator',
    slaHours: SCREENLIT_CONFIG.slaHours.LostToFollowUp,
    escalationLadder: [],
  },

  Reopened: {
    from: 'Reopened',
    to: ['PatientNotified', 'ConfirmationPending', 'Referred', 'Surveillance'],
    allowedRoles: ['coordinator', 'physician', 'admin'],
    defaultOwnerRole: 'coordinator',
    slaHours: SCREENLIT_CONFIG.slaHours.Reopened,
    escalationLadder: SCREENLIT_CONFIG.escalationLadders.standard,
  },
};

export interface TransitionValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateTransition(
  caseDoc: CaseDocument,
  targetState: CaseState,
  actorRole: Role
): TransitionValidationResult {
  const currentStateRule = CASE_TRANSITIONS_TABLE[caseDoc.state];
  if (!currentStateRule) {
    return {
      valid: false,
      reason: `Unknown origin state: ${caseDoc.state}`,
    };
  }

  if (!currentStateRule.to.includes(targetState)) {
    return {
      valid: false,
      reason: `Transition from ${caseDoc.state} to ${targetState} is not allowed`,
    };
  }

  if (
    !currentStateRule.allowedRoles.includes(actorRole) &&
    actorRole !== 'admin'
  ) {
    return {
      valid: false,
      reason: `Role ${actorRole} is not authorized to transition from ${caseDoc.state}`,
    };
  }

  if (targetState === 'Closed') {
    const closureCheck = validateClosurePrerequisites(caseDoc, actorRole);
    if (!closureCheck.valid) {
      return closureCheck;
    }
  }

  return { valid: true };
}

export function validateClosurePrerequisites(
  caseDoc: CaseDocument,
  actorRole: Role
): TransitionValidationResult {
  const isClinician =
    actorRole === 'physician' ||
    actorRole === 'specialist' ||
    actorRole === 'admin';
  if (!isClinician) {
    return {
      valid: false,
      reason: 'Closure requires an authorized clinician signature',
    };
  }

  const { evidence } = caseDoc;
  if (!evidence) {
    return {
      valid: false,
      reason: 'Closure requires attached clinical evidence',
    };
  }

  if (!evidence.patientAcknowledgedAt) {
    return {
      valid: false,
      reason: 'Closure requires recorded patient acknowledgement',
    };
  }

  if (!evidence.treatmentStartedAt) {
    return {
      valid: false,
      reason: 'Closure requires documentation of treatment initiation',
    };
  }

  const requiredReadings =
    evidence.surveillanceReadingsRequired ||
    SCREENLIT_CONFIG.hypertensionThresholds.surveillanceRequiredReadingsCount;

  if (evidence.controlledReadingsCount < requiredReadings) {
    return {
      valid: false,
      reason: `Closure requires at least ${requiredReadings} controlled readings across the surveillance window. Found ${evidence.controlledReadingsCount}.`,
    };
  }

  if (!evidence.clinicianSignature || !evidence.clinicianSignature.signerUid) {
    return {
      valid: false,
      reason: 'Closure requires a verified clinician electronic signature',
    };
  }

  return { valid: true };
}

export function getNextEscalationStep(
  state: CaseState,
  overdueHours: number,
  isUrgent: boolean
): EscalationStep | null {
  const ladder = isUrgent
    ? SCREENLIT_CONFIG.escalationLadders.urgent
    : CASE_TRANSITIONS_TABLE[state]?.escalationLadder ||
      SCREENLIT_CONFIG.escalationLadders.standard;

  for (let i = ladder.length - 1; i >= 0; i--) {
    if (overdueHours >= ladder[i].delayHours) {
      return ladder[i];
    }
  }
  return null;
}
