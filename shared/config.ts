/**
 * Screenlit Clinical, SLA, and Operational Configuration
 * Clinical thresholds marked: to be confirmed by a clinician against the chosen guideline
 */

import { EscalationStep } from './types';

export const CLINICAL_GUIDELINE_DISCLAIMER =
  'To be confirmed by a clinician against the chosen guideline';

export const SCREENLIT_CONFIG = {
  region: {
    primaryMiddleEastRegion: 'me-central1',
    datacenterLocation: 'Doha, Qatar',
    complianceNote:
      'Data residency aligned with Middle East healthcare data sovereignty standards',
  },

  hypertensionThresholds: {
    disclaimer: CLINICAL_GUIDELINE_DISCLAIMER,
    actionableSystolic: 140,
    actionableDiastolic: 90,
    urgentSystolic: 180,
    urgentDiastolic: 110,
    targetSystolic: 140,
    targetDiastolic: 90,
    surveillanceRequiredReadingsCount: 3,
    surveillanceWindowDays: 14,
    repeatConfirmationWindowHours: 168,
  },

  colorectalCancerThresholds: {
    disclaimer: CLINICAL_GUIDELINE_DISCLAIMER,
    actionableFitResult: 'positive',
    urgentFollowupDays: 14,
    standardFollowupDays: 30,
  },

  pregnancyThresholds: {
    disclaimer: CLINICAL_GUIDELINE_DISCLAIMER,
    actionableSystolic: 140,
    actionableDiastolic: 90,
    severeSystolic: 160,
    severeDiastolic: 110,
    requiresImmediateReview: true,
  },

  slaHours: {
    ResultIssued: 24,
    PatientNotified: 48,
    Acknowledged: 72,
    ConfirmationPending: 168,
    Confirmed: 48,
    Referred: 72,
    ReferralAccepted: 168,
    AppointmentBooked: 336,
    Attended: 48,
    TreatmentStarted: 72,
    Surveillance: 720,
    Overdue: 24,
    Rejected: 24,
    Unassigned: 12,
    LostToFollowUp: 168,
    Reopened: 24,
  },

  escalationLadders: {
    standard: [
      {
        level: 1,
        action: 'automated_reminder',
        targetRole: 'patient',
        delayHours: 24,
      },
      {
        level: 2,
        action: 'coordinator_outreach',
        targetRole: 'coordinator',
        delayHours: 48,
      },
      {
        level: 3,
        action: 'clinician_review',
        targetRole: 'physician',
        delayHours: 72,
      },
    ] as EscalationStep[],

    urgent: [
      {
        level: 1,
        action: 'urgent_physician_escalation',
        targetRole: 'physician',
        delayHours: 0,
      },
      {
        level: 2,
        action: 'coordinator_outreach',
        targetRole: 'coordinator',
        delayHours: 2,
      },
    ] as EscalationStep[],
  },

  riskScoringCoefficients: {
    intercept: -2.1,
    severityUrgent: 1.8,
    severityActionable: 0.9,
    ageOver60: 0.7,
    comorbidityCountWeight: 0.4,
    hoursSinceResultWeight: 0.015,
    noPriorEngagement: 0.8,
    outOfNetworkInsurance: 0.6,
    distanceKmWeight: 0.02,
  },

  dropOffCoefficients: {
    intercept: -1.5,
    noPriorEngagement: 1.2,
    languageBarrier: 0.9,
    delayHoursWeight: 0.012,
    distanceKmWeight: 0.025,
    outOfNetwork: 0.75,
  },

  wearableMonitoring: {
    rollingBaselineDays: 14,
    zScoreThreshold: 2.5,
    cusumThreshold: 3.0,
    disclaimer: 'Not clinically validated',
    promptForReviewOnly: true,
  },
};
