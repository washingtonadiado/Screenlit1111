/**
 * Screenlit Cloud Functions Context and Types
 * Data transfer interfaces for case transitions, referrals, wearable ingestion, and outbox notifications
 */

import {
  CaseDocument,
  CaseState,
  EscalationStep,
  FHIRObservation,
  FHIROrganization,
  FHIRPatient,
  FHIRPractitioner,
  FHIRServiceRequest,
  FHIRTask,
  Role,
  SupportedLanguage,
  UserProfile,
} from '../shared/types';

export interface TransitionCaseRequest {
  caseId: string;
  targetState: CaseState;
  actorUid: string;
  actorRole: Role;
  reason: string;
  evidenceUpdates?: Partial<CaseDocument['evidence']>;
  newOwnerUid?: string;
  newOwnerRole?: Role;
}

export interface TransitionCaseResponse {
  success: boolean;
  caseDoc?: CaseDocument;
  error?: string;
}

export interface CreateReferralRequest {
  caseId: string;
  patientId: string;
  requesterUid: string;
  requesterRole: Role;
  reasonText: string;
  preferredPractitionerId?: string;
}

export interface CreateReferralResponse {
  success: boolean;
  serviceRequest?: FHIRServiceRequest;
  assignedPractitioner?: FHIRPractitioner;
  caseDoc?: CaseDocument;
  error?: string;
}

export interface WearableIngestPayload {
  deviceApiKey: string;
  deviceId: string;
  patientId: string;
  recordedAt: string;
  metrics: {
    restingHeartRateBpm?: number;
    oxygenSaturationPct?: number;
    skinTemperatureCelsius?: number;
    sleepDurationMinutes?: number;
    dailyStepsCount?: number;
  };
}

export interface WearableIngestResponse {
  success: boolean;
  observationIds: string[];
  baselineDeviationFlag?: {
    metric: string;
    zScore: number;
    flagged: boolean;
    disclaimer: 'Not clinically validated';
  };
  error?: string;
}

export interface IngestObservationRequest {
  patientId: string;
  systolic: number;
  diastolic: number;
  performerId?: string;
  performerRole?: Role;
  deviceId?: string;
  recordedAt?: string;
  noteText?: string;
}

export interface IngestObservationResponse {
  success: boolean;
  observationId: string;
  caseCreated: boolean;
  caseId?: string;
  isUrgent: boolean;
  isActionable: boolean;
  error?: string;
}
