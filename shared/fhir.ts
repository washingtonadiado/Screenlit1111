/**
 * Screenlit FHIR R4 Resource Builders and Helpers
 * Provides conformant FHIR R4 shapes for population health screening to care coordination
 */

import {
  FHIRAuditEvent,
  FHIRObservation,
  FHIRPatient,
  FHIRServiceRequest,
  FHIRTask,
  Role,
} from './types';

export function buildBloodPressureObservation(params: {
  id: string;
  patientId: string;
  systolic: number;
  diastolic: number;
  recordedAt: string;
  performerId?: string;
  deviceId?: string;
  noteText?: string;
}): FHIRObservation {
  const isUrgent = params.systolic >= 180 || params.diastolic >= 110;
  const isActionable = params.systolic >= 140 || params.diastolic >= 90;

  return {
    resourceType: 'Observation',
    id: params.id,
    meta: {
      profile: ['http://hl7.org/fhir/StructureDefinition/bp'],
      lastUpdated: params.recordedAt,
    },
    status: 'final',
    category: [
      {
        coding: [
          {
            system:
              'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs',
            display: 'Vital Signs',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '85354-9',
          display: 'Blood pressure panel with all children optional',
        },
      ],
      text: 'Blood pressure',
    },
    subject: {
      reference: `Patient/${params.patientId}`,
      type: 'Patient',
    },
    effectiveDateTime: params.recordedAt,
    issued: params.recordedAt,
    performer: params.performerId
      ? [
          {
            reference: `Practitioner/${params.performerId}`,
            type: 'Practitioner',
          },
        ]
      : undefined,
    device: params.deviceId
      ? {
          reference: `Device/${params.deviceId}`,
          type: 'Device',
        }
      : undefined,
    component: [
      {
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '8480-6',
              display: 'Systolic blood pressure',
            },
          ],
          text: 'Systolic blood pressure',
        },
        valueQuantity: {
          value: params.systolic,
          unit: 'mmHg',
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]',
        },
      },
      {
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '8462-4',
              display: 'Diastolic blood pressure',
            },
          ],
          text: 'Diastolic blood pressure',
        },
        valueQuantity: {
          value: params.diastolic,
          unit: 'mmHg',
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]',
        },
      },
    ],
    interpretation: [
      {
        coding: [
          {
            system:
              'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: isUrgent ? 'CR' : isActionable ? 'H' : 'N',
            display: isUrgent
              ? 'Critical high'
              : isActionable
              ? 'High'
              : 'Normal',
          },
        ],
      },
    ],
    note: params.noteText ? [{ text: params.noteText }] : undefined,
  };
}

export function buildScreeningTask(params: {
  id: string;
  patientId: string;
  focusObservationId: string;
  coordinatorId: string;
  businessStatus: string;
  isUrgent: boolean;
  dueAt: string;
  authoredOn: string;
}): FHIRTask {
  return {
    resourceType: 'Task',
    id: params.id,
    status: 'requested',
    businessStatus: {
      text: params.businessStatus,
    },
    intent: 'order',
    priority: params.isUrgent ? 'urgent' : 'routine',
    code: {
      coding: [
        {
          system: 'http://hl7.org/fhir/CodeSystem/task-code',
          code: 'fulfill',
          display: 'Fulfill the focal request',
        },
      ],
      text: 'Hypertension Screening to Care Coordination',
    },
    focus: {
      reference: `Observation/${params.focusObservationId}`,
      type: 'Observation',
    },
    for: {
      reference: `Patient/${params.patientId}`,
      type: 'Patient',
    },
    owner: {
      reference: `Practitioner/${params.coordinatorId}`,
      type: 'Practitioner',
    },
    authoredOn: params.authoredOn,
    lastModified: params.authoredOn,
    restriction: {
      period: {
        end: params.dueAt,
      },
    },
  };
}

export function buildReferralServiceRequest(params: {
  id: string;
  patientId: string;
  requesterId: string;
  performerId: string;
  authoredOn: string;
  reasonText: string;
  isUrgent: boolean;
}): FHIRServiceRequest {
  return {
    resourceType: 'ServiceRequest',
    id: params.id,
    status: 'active',
    intent: 'order',
    priority: params.isUrgent ? 'urgent' : 'routine',
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '306206005',
          display: 'Referral to medical specialist',
        },
      ],
      text: 'Hypertension clinical consult and treatment initiation',
    },
    subject: {
      reference: `Patient/${params.patientId}`,
      type: 'Patient',
    },
    requester: {
      reference: `Practitioner/${params.requesterId}`,
      type: 'Practitioner',
    },
    performer: [
      {
        reference: `Practitioner/${params.performerId}`,
        type: 'Practitioner',
      },
    ],
    authoredOn: params.authoredOn,
    note: [{ text: params.reasonText }],
  };
}

export function buildAuditEvent(params: {
  id: string;
  action: 'C' | 'R' | 'U' | 'D' | 'E';
  recorded: string;
  actorUid: string;
  actorRole: Role;
  caseId: string;
  reason: string;
  outcome?: '0' | '4' | '8' | '12';
}): FHIRAuditEvent {
  return {
    resourceType: 'AuditEvent',
    id: params.id,
    type: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
          code: 'rest',
          display: 'RESTful Operation',
        },
      ],
      text: 'Case State Transition',
    },
    action: params.action,
    recorded: params.recorded,
    outcome: params.outcome || '0',
    outcomeDesc: params.reason,
    agent: [
      {
        who: {
          reference: `Practitioner/${params.actorUid}`,
          display: `Role: ${params.actorRole}`,
        },
        requestor: true,
      },
    ],
    source: {
      observer: {
        reference: 'Device/ScreenlitCoordinationEngine',
        display: 'Screenlit Coordination Engine',
      },
    },
    entity: [
      {
        what: {
          reference: `Task/${params.caseId}`,
          type: 'Task',
        },
        description: params.reason,
      },
    ],
  };
}
