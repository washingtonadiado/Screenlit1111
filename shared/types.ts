/**
 * Screenlit Shared Type Definitions
 * Strict FHIR R4 shaped models, case state machine types, and system entities
 */

export type Role =
  | 'patient'
  | 'caregiver'
  | 'coordinator'
  | 'physician'
  | 'specialist'
  | 'admin';

export type CaseState =
  | 'ResultIssued'
  | 'PatientNotified'
  | 'Acknowledged'
  | 'ConfirmationPending'
  | 'Confirmed'
  | 'Referred'
  | 'ReferralAccepted'
  | 'AppointmentBooked'
  | 'Attended'
  | 'TreatmentStarted'
  | 'Surveillance'
  | 'Closed'
  | 'Overdue'
  | 'Rejected'
  | 'Unassigned'
  | 'LostToFollowUp'
  | 'Reopened';

export type PathwayCondition = 'hypertension' | 'colorectal_cancer' | 'maternal_hypertension';

export type SupportedLanguage = 'en' | 'ar' | 'sw';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  language: SupportedLanguage;
  linkedPatientId?: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EscalationStep {
  level: number;
  action: 'automated_reminder' | 'coordinator_outreach' | 'clinician_review' | 'urgent_physician_escalation';
  targetRole: Role;
  delayHours: number;
}

export interface StateTransitionRule {
  from: CaseState;
  to: CaseState[];
  allowedRoles: Role[];
  defaultOwnerRole: Role;
  slaHours: number;
  escalationLadder: EscalationStep[];
  guardConditionName?: string;
}

export interface FHIRResourceBase {
  resourceType: string;
  id: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    profile?: string[];
  };
}

export interface FHIRCodeableConcept {
  coding?: Array<{
    system?: string;
    code?: string;
    display?: string;
  }>;
  text?: string;
}

export interface FHIRReference {
  reference: string;
  display?: string;
  type?: string;
}

export interface FHIRObservationComponent {
  code: FHIRCodeableConcept;
  valueQuantity?: {
    value: number;
    unit: string;
    system?: string;
    code?: string;
  };
}

export interface FHIRObservation extends FHIRResourceBase {
  resourceType: 'Observation';
  status: 'registered' | 'preliminary' | 'final' | 'amended';
  category?: FHIRCodeableConcept[];
  code: FHIRCodeableConcept;
  subject: FHIRReference;
  effectiveDateTime?: string;
  issued?: string;
  performer?: FHIRReference[];
  valueQuantity?: {
    value: number;
    unit: string;
    system?: string;
    code?: string;
  };
  component?: FHIRObservationComponent[];
  interpretation?: FHIRCodeableConcept[];
  note?: Array<{ text: string; time?: string }>;
  device?: FHIRReference;
}

export interface FHIRTask extends FHIRResourceBase {
  resourceType: 'Task';
  status: 'draft' | 'requested' | 'received' | 'accepted' | 'rejected' | 'ready' | 'cancelled' | 'in-progress' | 'on-hold' | 'failed' | 'completed' | 'entered-in-error';
  businessStatus: FHIRCodeableConcept;
  intent: 'order' | 'plan' | 'proposal';
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';
  code: FHIRCodeableConcept;
  focus?: FHIRReference;
  for: FHIRReference;
  owner?: FHIRReference;
  authoredOn: string;
  lastModified: string;
  executionPeriod?: {
    start?: string;
    end?: string;
  };
  restriction?: {
    repetitions?: number;
    period?: {
      end?: string;
    };
  };
  note?: Array<{ authorString?: string; time?: string; text: string }>;
}

export interface FHIRPatient extends FHIRResourceBase {
  resourceType: 'Patient';
  active: boolean;
  name: Array<{
    use?: string;
    family?: string;
    given?: string[];
    text?: string;
  }>;
  telecom?: Array<{
    system: 'phone' | 'email' | 'sms';
    value: string;
    use?: 'home' | 'work' | 'mobile';
  }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  address?: Array<{
    line?: string[];
    city?: string;
    district?: string;
    country?: string;
  }>;
  communication?: Array<{
    language: FHIRCodeableConcept;
    preferred?: boolean;
  }>;
  generalPractitioner?: FHIRReference[];
  managingOrganization?: FHIRReference;
}

export interface FHIRPractitioner extends FHIRResourceBase {
  resourceType: 'Practitioner';
  active: boolean;
  name: Array<{
    family?: string;
    given?: string[];
    prefix?: string[];
    text?: string;
  }>;
  telecom?: Array<{
    system: 'phone' | 'email';
    value: string;
  }>;
  qualification?: Array<{
    code: FHIRCodeableConcept;
  }>;
}

export interface FHIROrganization extends FHIRResourceBase {
  resourceType: 'Organization';
  active: boolean;
  name: string;
  type?: FHIRCodeableConcept[];
  telecom?: Array<{
    system: 'phone' | 'email' | 'url';
    value: string;
  }>;
  address?: Array<{
    line?: string[];
    city?: string;
    country?: string;
  }>;
}

export interface FHIRCoverage extends FHIRResourceBase {
  resourceType: 'Coverage';
  status: 'active' | 'cancelled' | 'draft' | 'entered-in-error';
  beneficiary: FHIRReference;
  payor: FHIRReference[];
  network?: string;
}

export interface FHIRDevice extends FHIRResourceBase {
  resourceType: 'Device';
  status: 'active' | 'inactive' | 'entered-in-error' | 'unknown';
  manufacturer?: string;
  modelNumber?: string;
  patient?: FHIRReference;
  type?: FHIRCodeableConcept;
  serialNumber?: string;
}

export interface FHIRServiceRequest extends FHIRResourceBase {
  resourceType: 'ServiceRequest';
  status: 'draft' | 'active' | 'on-hold' | 'revoked' | 'completed' | 'entered-in-error' | 'unknown';
  intent: 'order' | 'proposal' | 'plan';
  category?: FHIRCodeableConcept[];
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';
  code: FHIRCodeableConcept;
  subject: FHIRReference;
  requester?: FHIRReference;
  performer?: FHIRReference[];
  reasonCode?: FHIRCodeableConcept[];
  authoredOn?: string;
  note?: Array<{ text: string }>;
}

export interface FHIRDiagnosticReport extends FHIRResourceBase {
  resourceType: 'DiagnosticReport';
  status: 'registered' | 'partial' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'appended' | 'cancelled' | 'entered-in-error' | 'unknown';
  code: FHIRCodeableConcept;
  subject: FHIRReference;
  effectiveDateTime?: string;
  issued?: string;
  performer?: FHIRReference[];
  result?: FHIRReference[];
  conclusion?: string;
}

export interface FHIRCommunication extends FHIRResourceBase {
  resourceType: 'Communication';
  status: 'preparation' | 'in-progress' | 'not-done' | 'on-hold' | 'stopped' | 'completed' | 'entered-in-error' | 'unknown';
  category?: FHIRCodeableConcept[];
  subject?: FHIRReference;
  recipient?: FHIRReference[];
  sender?: FHIRReference;
  sent?: string;
  received?: string;
  payload?: Array<{
    contentString: string;
  }>;
}

export interface FHIRAppointment extends FHIRResourceBase {
  resourceType: 'Appointment';
  status: 'proposed' | 'pending' | 'booked' | 'arrived' | 'fulfilled' | 'cancelled' | 'noshow' | 'entered-in-error' | 'checked-in' | 'waitlist';
  serviceCategory?: FHIRCodeableConcept[];
  description?: string;
  start?: string;
  end?: string;
  participant: Array<{
    actor: FHIRReference;
    status: 'accepted' | 'declined' | 'tentative' | 'needs-action';
  }>;
}

export interface FHIRCarePlan extends FHIRResourceBase {
  resourceType: 'CarePlan';
  status: 'draft' | 'active' | 'on-hold' | 'revoked' | 'completed' | 'entered-in-error' | 'unknown';
  intent: 'proposal' | 'plan' | 'order';
  title?: string;
  description?: string;
  subject: FHIRReference;
  author?: FHIRReference;
  addresses?: FHIRCodeableConcept[];
  activity?: Array<{
    detail?: {
      description?: string;
      status: string;
      scheduledString?: string;
    };
  }>;
}

export interface FHIRConsent extends FHIRResourceBase {
  resourceType: 'Consent';
  status: 'draft' | 'proposed' | 'active' | 'rejected' | 'inactive' | 'entered-in-error';
  scope: FHIRCodeableConcept;
  category: FHIRCodeableConcept[];
  patient: FHIRReference;
  dateTime?: string;
  performer?: FHIRReference[];
  organization?: FHIRReference[];
  policyRule?: FHIRCodeableConcept;
  provision?: {
    type?: 'deny' | 'permit';
    period?: { start?: string; end?: string };
    actor?: Array<{
      role: FHIRCodeableConcept;
      reference: FHIRReference;
    }>;
    action?: FHIRCodeableConcept[];
  };
}

export interface FHIRAuditEvent extends FHIRResourceBase {
  resourceType: 'AuditEvent';
  type: FHIRCodeableConcept;
  action: 'C' | 'R' | 'U' | 'D' | 'E';
  recorded: string;
  outcome?: '0' | '4' | '8' | '12';
  outcomeDesc?: string;
  agent: Array<{
    who?: FHIRReference;
    requestor: boolean;
    role?: FHIRCodeableConcept[];
  }>;
  source: {
    observer: FHIRReference;
  };
  entity?: Array<{
    what: FHIRReference;
    type?: FHIRCodeableConcept;
    description?: string;
  }>;
}

export interface CaseDocument {
  id: string;
  resource: FHIRTask;
  state: CaseState;
  ownerRole: Role;
  ownerUid: string;
  patientId: string;
  dueAt: string;
  riskScore: number;
  condition: PathwayCondition;
  isUrgent: boolean;
  repeatRequired: boolean;
  evidence: {
    initialObservationId: string;
    confirmedObservationId?: string;
    serviceRequestId?: string;
    appointmentId?: string;
    patientAcknowledgedAt?: string;
    treatmentStartedAt?: string;
    controlledReadingsCount: number;
    surveillanceReadingsRequired: number;
    clinicianSignature?: {
      signerUid: string;
      signerName: string;
      signerRole: Role;
      signedAt: string;
      clinicalNote: string;
    };
  };
  aiFlags?: Array<{
    id: string;
    type: 'baseline_change' | 'drop_off_risk' | 'adherence_prompt';
    flaggedAt: string;
    description: string;
    status: 'pending_review' | 'acknowledged' | 'dismissed';
    disclaimer: 'Not clinically validated';
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface OutboxItem {
  id: string;
  to: string;
  channel: 'sms' | 'push';
  language: SupportedLanguage;
  body: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  patientId: string;
  caseId: string;
  createdAt: string;
  sentAt?: string;
}

export interface AIOutputRecord {
  id: string;
  taskType: 'rankCases' | 'predictDropOff' | 'draftPatientMessage' | 'summarizeHandoff' | 'detectBaselineChange' | 'analyzeSymptoms';
  reason: string;
  modelVersion: string;
  inputsRef: string;
  rawOutput: unknown;
  overridden: boolean;
  overriddenBy?: string;
  overrideNote?: string;
  createdAt: string;
}

export interface SimulationAssumption {
  key: string;
  baselineRate: number;
  screenlitRate: number;
  intendedSource: string;
}

export interface SimulationResultMetrics {
  median: number;
  p5: number;
  p95: number;
}

export interface SimulationRunRecord {
  id: string;
  executedAt: string;
  cohortSize: number;
  replicationsCount: number;
  metrics: {
    timeToNotificationHours: SimulationResultMetrics;
    acknowledgementRatePercent: SimulationResultMetrics;
    timeToConsultationDays: SimulationResultMetrics;
    referralCompletionPercent: SimulationResultMetrics;
    appointmentCompletionPercent: SimulationResultMetrics;
    treatmentInitiationPercent: SimulationResultMetrics;
    unresolvedActionableAt90DaysPercent: SimulationResultMetrics;
    documentedClosureRatePercent: SimulationResultMetrics;
    bloodPressureControlAt90DaysPercent: SimulationResultMetrics;
  };
  banner: 'Simulated results, not clinical evidence.';
}

export interface PatientFeelingLog {
  id: string;
  patientId: string;
  caseId?: string;
  recordedAt: string;
  feelingScore: 'great' | 'good' | 'okay' | 'unwell' | 'concerning';
  feelingNote: string;
  tags: string[];
  transcribedFromVoice?: boolean;
  audioDurationSeconds?: number;
  voiceAudioUrl?: string;
}

export interface SymptomAnalysisInputs {
  patientId: string;
  caseId?: string;
  feelingScore: 'great' | 'good' | 'okay' | 'unwell' | 'concerning';
  noteText: string;
  tags: string[];
  transcribedFromVoice?: boolean;
  recentVitals?: {
    bp?: string;
    heartRate?: number;
    spo2?: number;
    temperature?: number;
  };
}

export interface SymptomAnalysisResult {
  aiOutputId: string;
  summary: string;
  riskLevel: 'routine' | 'moderate' | 'high' | 'crisis';
  extractedSymptoms: string[];
  suggestedProbes: string[];
  redFlagAlert: boolean;
  redFlagReason?: string;
  patientGuidance: string;
  clinicianNotes: string;
  modelVersion: string;
}
