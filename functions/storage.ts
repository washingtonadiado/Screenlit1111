/**
 * Screenlit Firestore Storage and Memory Store Interface
 * Encapsulates FHIR R4 collections and flat index fields for server authoritative operations
 */

import {
  AIOutputRecord,
  CaseDocument,
  FHIRAppointment,
  FHIRAuditEvent,
  FHIRCarePlan,
  FHIRCommunication,
  FHIRConsent,
  FHIRCoverage,
  FHIRDevice,
  FHIRDiagnosticReport,
  FHIRObservation,
  FHIROrganization,
  FHIRPatient,
  FHIRPractitioner,
  FHIRServiceRequest,
  FHIRTask,
  OutboxItem,
  PatientFeelingLog,
  Role,
  SimulationRunRecord,
  UserProfile,
} from '../shared/types';
import { SCREENLIT_CONFIG } from '../shared/config';
import { generateSeedSkeleton } from '../scripts/seed';

export interface StorageCollections {
  users: Map<string, UserProfile>;
  patients: Map<string, FHIRPatient>;
  practitioners: Map<string, FHIRPractitioner>;
  organizations: Map<string, FHIROrganization>;
  coverages: Map<string, FHIRCoverage>;
  devices: Map<string, FHIRDevice>;
  observations: Map<string, FHIRObservation>;
  diagnosticReports: Map<string, FHIRDiagnosticReport>;
  tasks: Map<string, CaseDocument>;
  serviceRequests: Map<string, FHIRServiceRequest>;
  appointments: Map<string, FHIRAppointment>;
  carePlans: Map<string, FHIRCarePlan>;
  communications: Map<string, FHIRCommunication>;
  consents: Map<string, FHIRConsent>;
  auditEvents: Map<string, FHIRAuditEvent>;
  outbox: Map<string, OutboxItem>;
  aiOutputs: Map<string, AIOutputRecord>;
  config: Map<string, Record<string, unknown>>;
  simulationRuns: Map<string, SimulationRunRecord>;
  deviceApiKeys: Map<string, string>;
  patientFeelings: Map<string, PatientFeelingLog>;
}

export class ScreenlitDatabase {
  private static instance: ScreenlitDatabase;

  public collections: StorageCollections = {
    users: new Map(),
    patients: new Map(),
    practitioners: new Map(),
    organizations: new Map(),
    coverages: new Map(),
    devices: new Map(),
    observations: new Map(),
    diagnosticReports: new Map(),
    tasks: new Map(),
    serviceRequests: new Map(),
    appointments: new Map(),
    carePlans: new Map(),
    communications: new Map(),
    consents: new Map(),
    auditEvents: new Map(),
    outbox: new Map(),
    aiOutputs: new Map(),
    config: new Map(),
    simulationRuns: new Map(),
    deviceApiKeys: new Map(),
    patientFeelings: new Map(),
  };

  private demoClockOffsetHours = 0;

  private constructor() {
    this.seedDefaults();
  }

  public static getInstance(): ScreenlitDatabase {
    if (!ScreenlitDatabase.instance) {
      ScreenlitDatabase.instance = new ScreenlitDatabase();
    }
    return ScreenlitDatabase.instance;
  }

  public static resetInstance(): ScreenlitDatabase {
    ScreenlitDatabase.instance = new ScreenlitDatabase();
    return ScreenlitDatabase.instance;
  }

  public getNow(): Date {
    return new Date(Date.now() + this.demoClockOffsetHours * 3600 * 1000);
  }

  public getDemoClockOffsetHours(): number {
    return this.demoClockOffsetHours;
  }

  public advanceDemoClock(hours: number): void {
    this.demoClockOffsetHours += hours;
  }

  public setDemoClockOffset(hours: number): void {
    this.demoClockOffsetHours = hours;
  }

  public seedDefaults(): void {
    const seed = generateSeedSkeleton();

    seed.organizations.forEach((org) => this.collections.organizations.set(org.id, org));
    seed.practitioners.forEach((prac) => this.collections.practitioners.set(prac.id, prac));
    seed.users.forEach((u) => this.collections.users.set(u.uid, u));
    seed.patients.forEach((pat) => this.collections.patients.set(pat.id, pat));
    seed.observations.forEach((obs) => this.collections.observations.set(obs.id, obs));
    seed.auditEvents.forEach((aud) => this.collections.auditEvents.set(aud.id, aud));

    seed.coverages?.forEach((cov) => this.collections.coverages.set(cov.id, cov));
    seed.devices?.forEach((dev) => {
      this.collections.devices.set(dev.id, dev);
      this.collections.deviceApiKeys.set(`key_${dev.id}`, dev.id);
    });
    // Legacy test device identifiers
    this.collections.devices.set('device_cuff_001', {
      resourceType: 'Device',
      id: 'device_cuff_001',
      status: 'active',
      manufacturer: 'Omron Healthcare',
      patient: { reference: 'Patient/pat_tariq_001' },
    });
    this.collections.deviceApiKeys.set('key_device_cuff_001', 'device_cuff_001');
    this.collections.devices.set('device_wristband_001', {
      resourceType: 'Device',
      id: 'device_wristband_001',
      status: 'active',
      manufacturer: 'Biowatch Systems',
      patient: { reference: 'Patient/pat_tariq_001' },
    });
    this.collections.deviceApiKeys.set('key_device_wristband_001', 'device_wristband_001');
    seed.diagnosticReports?.forEach((rep) => this.collections.diagnosticReports.set(rep.id, rep));
    seed.serviceRequests?.forEach((req) => this.collections.serviceRequests.set(req.id, req));
    seed.appointments?.forEach((appt) => this.collections.appointments.set(appt.id, appt));
    seed.carePlans?.forEach((cp) => this.collections.carePlans.set(cp.id, cp));
    seed.communications?.forEach((comm) => this.collections.communications.set(comm.id, comm));
    seed.consents?.forEach((c) => this.collections.consents.set(c.id, c));

    seed.tasks.forEach((t) => {
      const state = (t.businessStatus.text || 'ResultIssued') as any;
      const isStat = t.priority === 'stat';
      const isUrgent = isStat || t.priority === 'urgent';
      const ownerRole: Role = t.owner?.reference?.includes('dr_mwangi')
        ? 'specialist'
        : t.owner?.reference?.includes('dr_amina')
        ? 'physician'
        : 'coordinator';

      const caseDoc: CaseDocument = {
        id: t.id,
        resource: t,
        state,
        ownerRole,
        ownerUid: t.owner?.reference?.replace('Practitioner/', '') || 'prac_coord_fatima',
        patientId: t.for.reference.replace('Patient/', ''),
        dueAt: t.restriction?.period?.end || new Date().toISOString(),
        riskScore: isUrgent ? 0.95 : state === 'Closed' ? 0.12 : 0.65,
        condition: t.code.text?.includes('Colorectal') ? 'colorectal_cancer' : 'hypertension',
        isUrgent,
        repeatRequired: state === 'ResultIssued' || state === 'ConfirmationPending',
        evidence: {
          initialObservationId: t.focus?.reference?.replace('Observation/', '') || 'obs_bp_tariq_001',
          controlledReadingsCount: state === 'Closed' ? 3 : state === 'Surveillance' ? 2 : 0,
          surveillanceReadingsRequired: 3,
          patientAcknowledgedAt: state !== 'ResultIssued' ? t.authoredOn : undefined,
          treatmentStartedAt: ['Attended', 'TreatmentStarted', 'Surveillance', 'Closed'].includes(state) ? t.authoredOn : undefined,
          clinicianSignature: state === 'Closed' ? {
            signerUid: 'prac_dr_amina',
            signerName: 'Dr. Amina Al Mansoor',
            signerRole: 'physician',
            signedAt: t.lastModified,
            clinicalNote: 'Formal closure signed following three verified controlled readings.',
          } : undefined,
        },
        createdAt: t.authoredOn,
        updatedAt: t.lastModified,
      };
      this.collections.tasks.set(caseDoc.id, caseDoc);
    });

    this.collections.config.set('clinical', {
      hypertensionThresholds: SCREENLIT_CONFIG.hypertensionThresholds,
      slaHours: SCREENLIT_CONFIG.slaHours,
      escalationLadders: SCREENLIT_CONFIG.escalationLadders,
      region: SCREENLIT_CONFIG.region,
    });

    this.collections.patientFeelings.set('feel_001', {
      id: 'feel_001',
      patientId: 'pat_tariq_001',
      caseId: 'task_case_001',
      recordedAt: new Date(Date.now() - 3600 * 4 * 1000).toISOString(),
      feelingScore: 'good',
      feelingNote: 'Resting comfortably at home after morning walk. No headache today.',
      tags: ['Normal', 'Seated Rested'],
      transcribedFromVoice: false,
    });

    this.collections.patientFeelings.set('feel_002', {
      id: 'feel_002',
      patientId: 'pat_tariq_001',
      caseId: 'task_case_001',
      recordedAt: new Date(Date.now() - 3600 * 24 * 1000).toISOString(),
      feelingScore: 'okay',
      feelingNote: 'Felt slight tightness in shoulders when climbing stairs earlier, rested 10 minutes and feel settled now.',
      tags: ['Mild Fatigue', 'Shoulder Tension'],
      transcribedFromVoice: true,
      audioDurationSeconds: 8,
    });
  }
}
