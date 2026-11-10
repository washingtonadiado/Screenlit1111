/**
 * Screenlit Synthetic Cohort and Clinical Seed Script
 * Generates synthetic FHIR R4 collections and demo users for local emulator and demo environments
 *
 * All synthetic records use synthetic identifiers and data
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import {
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
  Role,
  SupportedLanguage,
  UserProfile,
} from '../shared/types';
import { SCREENLIT_CONFIG } from '../shared/config';
import {
  buildAuditEvent,
  buildBloodPressureObservation,
  buildScreeningTask,
} from '../shared/fhir';

export interface SeedDataBundle {
  organizations: FHIROrganization[];
  practitioners: FHIRPractitioner[];
  users: UserProfile[];
  patients: FHIRPatient[];
  observations: FHIRObservation[];
  tasks: FHIRTask[];
  auditEvents: FHIRAuditEvent[];
  coverages: FHIRCoverage[];
  devices: FHIRDevice[];
  diagnosticReports: FHIRDiagnosticReport[];
  serviceRequests: FHIRServiceRequest[];
  appointments: FHIRAppointment[];
  carePlans: FHIRCarePlan[];
  communications: FHIRCommunication[];
  consents: FHIRConsent[];
  config: Record<string, unknown>;
}

export function generateSeedSkeleton(): SeedDataBundle {
  const timestamp = new Date().toISOString();
  const pastDay = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const pastThreeDays = new Date(Date.now() - 72 * 3600 * 1000).toISOString();
  const pastWeek = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const futureTwoDays = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

  const organizations: FHIROrganization[] = [
    {
      resourceType: 'Organization',
      id: 'org_alamal_clinic',
      active: true,
      name: 'Al Amal Community Health Centre',
      telecom: [{ system: 'phone', value: '+974 4400 1234' }],
      address: [
        {
          city: 'Doha',
          country: 'Qatar',
          line: ['Al Sadd Medical District Street 4'],
        },
      ],
    },
    {
      resourceType: 'Organization',
      id: 'org_central_hospital',
      active: true,
      name: 'Central District Hospital',
      telecom: [{ system: 'phone', value: '+974 4400 5678' }],
      address: [
        {
          city: 'Doha',
          country: 'Qatar',
          line: ['Rayyan Road Zone 38'],
        },
      ],
    },
    {
      resourceType: 'Organization',
      id: 'org_maternal_wellness',
      active: true,
      name: 'Sidra Maternal and Child Health Clinic',
      telecom: [{ system: 'phone', value: '+974 4003 3333' }],
      address: [
        {
          city: 'Doha',
          country: 'Qatar',
          line: ['Education City Al Gharrafa'],
        },
      ],
    },
  ];

  const practitioners: FHIRPractitioner[] = [
    {
      resourceType: 'Practitioner',
      id: 'prac_dr_amina',
      active: true,
      name: [
        {
          family: 'Al Mansoor',
          given: ['Amina'],
          prefix: ['Dr.'],
          text: 'Dr. Amina Al Mansoor',
        },
      ],
      telecom: [{ system: 'email', value: 'dr.amina@screenlit.health' }],
    },
    {
      resourceType: 'Practitioner',
      id: 'prac_coord_fatima',
      active: true,
      name: [
        {
          family: 'Noor',
          given: ['Fatima'],
          prefix: ['Nurse'],
          text: 'Fatima Noor, RN',
        },
      ],
      telecom: [{ system: 'email', value: 'coordinator.fatima@screenlit.health' }],
    },
    {
      resourceType: 'Practitioner',
      id: 'prac_dr_mwangi',
      active: true,
      name: [
        {
          family: 'Mwangi',
          given: ['David'],
          prefix: ['Dr.'],
          text: 'Dr. David Mwangi, Specialist',
        },
      ],
      telecom: [{ system: 'email', value: 'dr.mwangi@screenlit.health' }],
    },
  ];

  const users: UserProfile[] = [
    {
      uid: 'user_patient_tariq',
      email: 'tariq.patient@screenlit.health',
      displayName: 'Tariq Al Mahmoud',
      role: 'patient',
      language: 'ar',
      linkedPatientId: 'pat_tariq_001',
      organizationId: 'org_alamal_clinic',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      uid: 'user_caregiver_zainab',
      email: 'zainab.caregiver@screenlit.health',
      displayName: 'Zainab Al Mahmoud',
      role: 'caregiver',
      language: 'ar',
      linkedPatientId: 'pat_tariq_001',
      organizationId: 'org_alamal_clinic',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      uid: 'user_coordinator_fatima',
      email: 'coordinator.fatima@screenlit.health',
      displayName: 'Fatima Noor, RN',
      role: 'coordinator',
      language: 'en',
      organizationId: 'org_alamal_clinic',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      uid: 'user_physician_amina',
      email: 'dr.amina@screenlit.health',
      displayName: 'Dr. Amina Al Mansoor',
      role: 'physician',
      language: 'en',
      organizationId: 'org_alamal_clinic',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      uid: 'user_specialist_mwangi',
      email: 'dr.mwangi@screenlit.health',
      displayName: 'Dr. David Mwangi',
      role: 'specialist',
      language: 'sw',
      organizationId: 'org_central_hospital',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      uid: 'user_admin_hassan',
      email: 'admin.hassan@screenlit.health',
      displayName: 'Hassan Al Kuwari',
      role: 'admin',
      language: 'en',
      organizationId: 'org_alamal_clinic',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];

  const patients: FHIRPatient[] = [
    {
      resourceType: 'Patient',
      id: 'pat_tariq_001',
      active: true,
      name: [{ family: 'Al Mahmoud', given: ['Tariq'], text: 'Tariq Al Mahmoud' }],
      telecom: [
        { system: 'phone', value: '+974 5511 2233', use: 'mobile' },
        { system: 'email', value: 'tariq.patient@screenlit.health' },
      ],
      gender: 'male',
      birthDate: '1968-04-12',
      address: [{ city: 'Doha', country: 'Qatar' }],
      communication: [
        {
          language: { text: 'Arabic', coding: [{ code: 'ar', display: 'Arabic' }] },
          preferred: true,
        },
      ],
      generalPractitioner: [{ reference: 'Practitioner/prac_dr_amina' }],
      managingOrganization: { reference: 'Organization/org_alamal_clinic' },
    },
    {
      resourceType: 'Patient',
      id: 'pat_fatima_002',
      active: true,
      name: [{ family: 'Al Zahra', given: ['Fatima'], text: 'Fatima Al Zahra' }],
      telecom: [
        { system: 'phone', value: '+974 5522 3344', use: 'mobile' },
        { system: 'email', value: 'fatima.alzahra@screenlit.health' },
      ],
      gender: 'female',
      birthDate: '1962-09-18',
      address: [{ city: 'Doha', country: 'Qatar' }],
      communication: [
        {
          language: { text: 'Arabic', coding: [{ code: 'ar', display: 'Arabic' }] },
          preferred: true,
        },
      ],
      generalPractitioner: [{ reference: 'Practitioner/prac_dr_amina' }],
      managingOrganization: { reference: 'Organization/org_alamal_clinic' },
    },
    {
      resourceType: 'Patient',
      id: 'pat_grace_003',
      active: true,
      name: [{ family: 'Wanjiku', given: ['Grace'], text: 'Grace Wanjiku' }],
      telecom: [
        { system: 'phone', value: '+254 712 345678', use: 'mobile' },
        { system: 'email', value: 'grace.wanjiku@screenlit.health' },
      ],
      gender: 'female',
      birthDate: '1974-11-05',
      address: [{ city: 'Nairobi', country: 'Kenya' }],
      communication: [
        {
          language: { text: 'Swahili', coding: [{ code: 'sw', display: 'Swahili' }] },
          preferred: true,
        },
      ],
      generalPractitioner: [{ reference: 'Practitioner/prac_dr_mwangi' }],
      managingOrganization: { reference: 'Organization/org_central_hospital' },
    },
    {
      resourceType: 'Patient',
      id: 'pat_maryam_004',
      active: true,
      name: [{ family: 'Saleh', given: ['Maryam'], text: 'Maryam Saleh' }],
      telecom: [
        { system: 'phone', value: '+974 5533 4455', use: 'mobile' },
        { system: 'email', value: 'maryam.saleh@screenlit.health' },
      ],
      gender: 'female',
      birthDate: '1995-02-20',
      address: [{ city: 'Doha', country: 'Qatar' }],
      communication: [
        {
          language: { text: 'Arabic', coding: [{ code: 'ar', display: 'Arabic' }] },
          preferred: true,
        },
      ],
      generalPractitioner: [{ reference: 'Practitioner/prac_dr_amina' }],
      managingOrganization: { reference: 'Organization/org_maternal_wellness' },
    },
    {
      resourceType: 'Patient',
      id: 'pat_ahmed_005',
      active: true,
      name: [{ family: 'Hassan', given: ['Ahmed'], text: 'Ahmed Hassan' }],
      telecom: [
        { system: 'phone', value: '+974 5544 5566', use: 'mobile' },
        { system: 'email', value: 'ahmed.hassan@screenlit.health' },
      ],
      gender: 'male',
      birthDate: '1960-08-30',
      address: [{ city: 'Doha', country: 'Qatar' }],
      communication: [
        {
          language: { text: 'Arabic', coding: [{ code: 'ar', display: 'Arabic' }] },
          preferred: true,
        },
      ],
      generalPractitioner: [{ reference: 'Practitioner/prac_dr_amina' }],
      managingOrganization: { reference: 'Organization/org_alamal_clinic' },
    },
    {
      resourceType: 'Patient',
      id: 'pat_salim_006',
      active: true,
      name: [{ family: 'Al Nuaimi', given: ['Salim'], text: 'Salim Al Nuaimi' }],
      telecom: [
        { system: 'phone', value: '+974 5555 6677', use: 'mobile' },
        { system: 'email', value: 'salim.nuaimi@screenlit.health' },
      ],
      gender: 'male',
      birthDate: '1976-05-14',
      address: [{ city: 'Doha', country: 'Qatar' }],
      communication: [
        {
          language: { text: 'English', coding: [{ code: 'en', display: 'English' }] },
          preferred: true,
        },
      ],
      generalPractitioner: [{ reference: 'Practitioner/prac_dr_amina' }],
      managingOrganization: { reference: 'Organization/org_alamal_clinic' },
    },
    {
      resourceType: 'Patient',
      id: 'pat_layla_007',
      active: true,
      name: [{ family: 'Ibrahim', given: ['Layla'], text: 'Layla Ibrahim' }],
      telecom: [
        { system: 'phone', value: '+974 5566 7788', use: 'mobile' },
        { system: 'email', value: 'layla.ibrahim@screenlit.health' },
      ],
      gender: 'female',
      birthDate: '1966-12-03',
      address: [{ city: 'Doha', country: 'Qatar' }],
      communication: [
        {
          language: { text: 'Arabic', coding: [{ code: 'ar', display: 'Arabic' }] },
          preferred: true,
        },
      ],
      generalPractitioner: [{ reference: 'Practitioner/prac_dr_amina' }],
      managingOrganization: { reference: 'Organization/org_alamal_clinic' },
    },
    {
      resourceType: 'Patient',
      id: 'pat_khalid_008',
      active: true,
      name: [{ family: 'Al Dossary', given: ['Khalid'], text: 'Khalid Al Dossary' }],
      telecom: [
        { system: 'phone', value: '+974 5577 8899', use: 'mobile' },
        { system: 'email', value: 'khalid.dossary@screenlit.health' },
      ],
      gender: 'male',
      birthDate: '1973-07-22',
      address: [{ city: 'Doha', country: 'Qatar' }],
      communication: [
        {
          language: { text: 'Arabic', coding: [{ code: 'ar', display: 'Arabic' }] },
          preferred: true,
        },
      ],
      generalPractitioner: [{ reference: 'Practitioner/prac_dr_amina' }],
      managingOrganization: { reference: 'Organization/org_alamal_clinic' },
    },
  ];

  const coverages: FHIRCoverage[] = [
    {
      resourceType: 'Coverage',
      id: 'cov_tariq_doha_care',
      status: 'active',
      beneficiary: { reference: 'Patient/pat_tariq_001', type: 'Patient' },
      payor: [{ reference: 'Organization/org_alamal_clinic', display: 'Qatar National Health Scheme' }],
      network: 'in_network',
    },
    {
      resourceType: 'Coverage',
      id: 'cov_fatima_daman',
      status: 'active',
      beneficiary: { reference: 'Patient/pat_fatima_002', type: 'Patient' },
      payor: [{ reference: 'Organization/org_alamal_clinic', display: 'Daman National Insurance' }],
      network: 'in_network',
    },
    {
      resourceType: 'Coverage',
      id: 'cov_grace_nhif',
      status: 'active',
      beneficiary: { reference: 'Patient/pat_grace_003', type: 'Patient' },
      payor: [{ reference: 'Organization/org_central_hospital', display: 'National Hospital Insurance Fund' }],
      network: 'in_network',
    },
    {
      resourceType: 'Coverage',
      id: 'cov_maryam_doha_care',
      status: 'active',
      beneficiary: { reference: 'Patient/pat_maryam_004', type: 'Patient' },
      payor: [{ reference: 'Organization/org_maternal_wellness', display: 'Qatar National Health Scheme' }],
      network: 'in_network',
    },
    {
      resourceType: 'Coverage',
      id: 'cov_ahmed_doha_care',
      status: 'active',
      beneficiary: { reference: 'Patient/pat_ahmed_005', type: 'Patient' },
      payor: [{ reference: 'Organization/org_alamal_clinic', display: 'Qatar National Health Scheme' }],
      network: 'in_network',
    },
    {
      resourceType: 'Coverage',
      id: 'cov_salim_doha_care',
      status: 'active',
      beneficiary: { reference: 'Patient/pat_salim_006', type: 'Patient' },
      payor: [{ reference: 'Organization/org_alamal_clinic', display: 'Qatar National Health Scheme' }],
      network: 'in_network',
    },
    {
      resourceType: 'Coverage',
      id: 'cov_layla_doha_care',
      status: 'active',
      beneficiary: { reference: 'Patient/pat_layla_007', type: 'Patient' },
      payor: [{ reference: 'Organization/org_alamal_clinic', display: 'Qatar National Health Scheme' }],
      network: 'in_network',
    },
    {
      resourceType: 'Coverage',
      id: 'cov_khalid_out_network',
      status: 'active',
      beneficiary: { reference: 'Patient/pat_khalid_008', type: 'Patient' },
      payor: [{ reference: 'Organization/org_alamal_clinic', display: 'International Private Plan' }],
      network: 'out_of_network',
    },
  ];

  const devices: FHIRDevice[] = [
    {
      resourceType: 'Device',
      id: 'dev_tariq_withings_cuff',
      status: 'active',
      manufacturer: 'Withings',
      modelNumber: 'BPM Connect',
      patient: { reference: 'Patient/pat_tariq_001' },
      type: { text: 'Cellular Blood Pressure Cuff' },
      serialNumber: 'WTH-BPM-8821',
    },
    {
      resourceType: 'Device',
      id: 'dev_tariq_garmin_band',
      status: 'active',
      manufacturer: 'Garmin',
      modelNumber: 'Vivosmart 5',
      patient: { reference: 'Patient/pat_tariq_001' },
      type: { text: 'Consumer Health Wristband' },
      serialNumber: 'GRM-VIV-9912',
    },
    {
      resourceType: 'Device',
      id: 'dev_ahmed_withings_cuff',
      status: 'active',
      manufacturer: 'Withings',
      modelNumber: 'BPM Connect',
      patient: { reference: 'Patient/pat_ahmed_005' },
      type: { text: 'Cellular Blood Pressure Cuff' },
      serialNumber: 'WTH-BPM-7744',
    },
    {
      resourceType: 'Device',
      id: 'dev_ahmed_garmin_band',
      status: 'active',
      manufacturer: 'Garmin',
      modelNumber: 'Vivosmart 5',
      patient: { reference: 'Patient/pat_ahmed_005' },
      type: { text: 'Consumer Health Wristband' },
      serialNumber: 'GRM-VIV-4411',
    },
  ];

  const observations: FHIRObservation[] = [];

  const bpObs1 = buildBloodPressureObservation({
    id: 'obs_bp_tariq_001',
    patientId: 'pat_tariq_001',
    systolic: 158,
    diastolic: 98,
    recordedAt: timestamp,
    performerId: 'prac_coord_fatima',
    noteText: 'Community clinic pop up screening reading',
  });
  observations.push(bpObs1);

  const bpObs2 = buildBloodPressureObservation({
    id: 'obs_bp_fatima_urgent',
    patientId: 'pat_fatima_002',
    systolic: 184,
    diastolic: 114,
    recordedAt: timestamp,
    performerId: 'prac_coord_fatima',
    noteText: 'Urgent hypertensive screening reading above crisis threshold',
  });
  observations.push(bpObs2);

  const fitObs3: FHIRObservation = {
    resourceType: 'Observation',
    id: 'obs_fit_grace_003',
    status: 'final',
    code: {
      coding: [{ system: 'http://loinc.org', code: '14563-1', display: 'Fecal occult blood' }],
      text: 'Faecal Immunochemical Test quantitative positive',
    },
    subject: { reference: 'Patient/pat_grace_003', type: 'Patient' },
    effectiveDateTime: pastDay,
    issued: pastDay,
    performer: [{ reference: 'Practitioner/prac_dr_mwangi' }],
    valueQuantity: {
      value: 142,
      unit: 'ug/g',
      system: 'http://unitsofmeasure.org',
      code: 'ug/g',
    },
    interpretation: [{ text: 'Positive abnormal screening result' }],
    note: [{ text: 'FIT positive result above 100 ug/g threshold requiring prompt colonoscopy referral' }],
  };
  observations.push(fitObs3);

  const bpObs4 = buildBloodPressureObservation({
    id: 'obs_bp_maryam_maternal',
    patientId: 'pat_maryam_004',
    systolic: 146,
    diastolic: 94,
    recordedAt: pastDay,
    performerId: 'prac_coord_fatima',
    noteText: 'Maternal health antenatal screening at 32 weeks gestation with raised blood pressure',
  });
  observations.push(bpObs4);

  const bpObs5Init = buildBloodPressureObservation({
    id: 'obs_bp_ahmed_init',
    patientId: 'pat_ahmed_005',
    systolic: 162,
    diastolic: 102,
    recordedAt: pastWeek,
    performerId: 'prac_dr_amina',
    noteText: 'Initial baseline screening blood pressure',
  });
  const bpObs5C1 = buildBloodPressureObservation({
    id: 'obs_bp_ahmed_c1',
    patientId: 'pat_ahmed_005',
    systolic: 132,
    diastolic: 84,
    recordedAt: pastThreeDays,
    performerId: 'pat_ahmed_005',
    noteText: 'Home cuff controlled reading 1',
  });
  const bpObs5C2 = buildBloodPressureObservation({
    id: 'obs_bp_ahmed_c2',
    patientId: 'pat_ahmed_005',
    systolic: 136,
    diastolic: 86,
    recordedAt: pastDay,
    performerId: 'pat_ahmed_005',
    noteText: 'Home cuff controlled reading 2',
  });
  observations.push(bpObs5Init, bpObs5C1, bpObs5C2);

  const bpObs6Init = buildBloodPressureObservation({
    id: 'obs_bp_salim_init',
    patientId: 'pat_salim_006',
    systolic: 154,
    diastolic: 96,
    recordedAt: pastWeek,
    performerId: 'prac_dr_amina',
    noteText: 'Initial elevated screening reading',
  });
  const bpObs6C1 = buildBloodPressureObservation({
    id: 'obs_bp_salim_c1',
    patientId: 'pat_salim_006',
    systolic: 128,
    diastolic: 82,
    recordedAt: pastThreeDays,
    performerId: 'pat_salim_006',
    noteText: 'Surveillance reading 1 under target',
  });
  const bpObs6C2 = buildBloodPressureObservation({
    id: 'obs_bp_salim_c2',
    patientId: 'pat_salim_006',
    systolic: 126,
    diastolic: 80,
    recordedAt: pastDay,
    performerId: 'pat_salim_006',
    noteText: 'Surveillance reading 2 under target',
  });
  const bpObs6C3 = buildBloodPressureObservation({
    id: 'obs_bp_salim_c3',
    patientId: 'pat_salim_006',
    systolic: 130,
    diastolic: 84,
    recordedAt: timestamp,
    performerId: 'pat_salim_006',
    noteText: 'Surveillance reading 3 under target',
  });
  observations.push(bpObs6Init, bpObs6C1, bpObs6C2, bpObs6C3);

  const bpObs7Overdue = buildBloodPressureObservation({
    id: 'obs_bp_layla_overdue',
    patientId: 'pat_layla_007',
    systolic: 152,
    diastolic: 94,
    recordedAt: pastThreeDays,
    performerId: 'prac_coord_fatima',
    noteText: 'Screening reading recorded three days ago awaiting patient notification acknowledgement',
  });
  observations.push(bpObs7Overdue);

  const bpObs8Rejected = buildBloodPressureObservation({
    id: 'obs_bp_khalid_screen',
    patientId: 'pat_khalid_008',
    systolic: 156,
    diastolic: 96,
    recordedAt: pastDay,
    performerId: 'prac_coord_fatima',
    noteText: 'Screening reading requiring in network provider referral reassignment',
  });
  observations.push(bpObs8Rejected);

  const diagnosticReports: FHIRDiagnosticReport[] = [
    {
      resourceType: 'DiagnosticReport',
      id: 'diag_fit_grace_003',
      status: 'final',
      code: { text: 'Colorectal Screening Quantitative FIT Report' },
      subject: { reference: 'Patient/pat_grace_003' },
      effectiveDateTime: pastDay,
      issued: pastDay,
      performer: [{ reference: 'Practitioner/prac_dr_mwangi' }],
      result: [{ reference: 'Observation/obs_fit_grace_003' }],
      conclusion: 'Abnormal quantitative fecal immunochemical test finding requiring colonoscopy evaluation',
    },
  ];

  const tasks: FHIRTask[] = [];

  const task1 = buildScreeningTask({
    id: 'task_case_001',
    patientId: 'pat_tariq_001',
    focusObservationId: 'obs_bp_tariq_001',
    coordinatorId: 'prac_coord_fatima',
    businessStatus: 'ResultIssued',
    isUrgent: false,
    dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    authoredOn: timestamp,
  });
  tasks.push(task1);

  const task2 = buildScreeningTask({
    id: 'task_case_002',
    patientId: 'pat_fatima_002',
    focusObservationId: 'obs_bp_fatima_urgent',
    coordinatorId: 'prac_dr_amina',
    businessStatus: 'ResultIssued',
    isUrgent: true,
    dueAt: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    authoredOn: timestamp,
  });
  task2.priority = 'stat';
  tasks.push(task2);

  const task3 = buildScreeningTask({
    id: 'task_case_003',
    patientId: 'pat_grace_003',
    focusObservationId: 'obs_fit_grace_003',
    coordinatorId: 'prac_dr_mwangi',
    businessStatus: 'Referred',
    isUrgent: false,
    dueAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    authoredOn: pastDay,
  });
  task3.code = { text: 'Colorectal cancer screening navigation' };
  tasks.push(task3);

  const task4 = buildScreeningTask({
    id: 'task_case_004',
    patientId: 'pat_maryam_004',
    focusObservationId: 'obs_bp_maryam_maternal',
    coordinatorId: 'prac_coord_fatima',
    businessStatus: 'Acknowledged',
    isUrgent: false,
    dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    authoredOn: pastDay,
  });
  task4.code = { text: 'Maternal raised blood pressure antenatal navigation' };
  tasks.push(task4);

  const task5 = buildScreeningTask({
    id: 'task_case_005',
    patientId: 'pat_ahmed_005',
    focusObservationId: 'obs_bp_ahmed_init',
    coordinatorId: 'prac_coord_fatima',
    businessStatus: 'Surveillance',
    isUrgent: false,
    dueAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    authoredOn: pastWeek,
  });
  tasks.push(task5);

  const task6 = buildScreeningTask({
    id: 'task_case_006',
    patientId: 'pat_salim_006',
    focusObservationId: 'obs_bp_salim_init',
    coordinatorId: 'prac_dr_amina',
    businessStatus: 'Closed',
    isUrgent: false,
    dueAt: timestamp,
    authoredOn: pastWeek,
  });
  task6.status = 'completed';
  task6.note = [
    {
      authorString: 'Dr. Amina Al Mansoor',
      time: timestamp,
      text: 'Verified 3 consecutive controlled readings below 140 over 90. Case formally closed.',
    },
  ];
  tasks.push(task6);

  const task7 = buildScreeningTask({
    id: 'task_case_007',
    patientId: 'pat_layla_007',
    focusObservationId: 'obs_bp_layla_overdue',
    coordinatorId: 'prac_coord_fatima',
    businessStatus: 'Overdue',
    isUrgent: false,
    dueAt: pastDay,
    authoredOn: pastThreeDays,
  });
  tasks.push(task7);

  const task8 = buildScreeningTask({
    id: 'task_case_008',
    patientId: 'pat_khalid_008',
    focusObservationId: 'obs_bp_khalid_screen',
    coordinatorId: 'prac_coord_fatima',
    businessStatus: 'Rejected',
    isUrgent: false,
    dueAt: timestamp,
    authoredOn: pastDay,
  });
  task8.note = [
    {
      authorString: 'Dr. David Mwangi',
      time: timestamp,
      text: 'Referral declined due to out of network plan. Reassigned for in network physician matching.',
    },
  ];
  tasks.push(task8);

  const serviceRequests: FHIRServiceRequest[] = [
    {
      resourceType: 'ServiceRequest',
      id: 'req_ref_grace_003',
      status: 'active',
      intent: 'order',
      code: { text: 'Diagnostic Colonoscopy Referral' },
      subject: { reference: 'Patient/pat_grace_003' },
      requester: { reference: 'Practitioner/prac_coord_fatima' },
      performer: [{ reference: 'Practitioner/prac_dr_mwangi' }],
      authoredOn: pastDay,
    },
    {
      resourceType: 'ServiceRequest',
      id: 'req_ref_ahmed_005',
      status: 'completed',
      intent: 'order',
      code: { text: 'Hypertension Clinical Evaluation' },
      subject: { reference: 'Patient/pat_ahmed_005' },
      requester: { reference: 'Practitioner/prac_coord_fatima' },
      performer: [{ reference: 'Practitioner/prac_dr_amina' }],
      authoredOn: pastWeek,
    },
  ];

  const appointments: FHIRAppointment[] = [
    {
      resourceType: 'Appointment',
      id: 'appt_ahmed_attended',
      status: 'fulfilled',
      description: 'Comprehensive hypertension consultation and medication review',
      start: pastThreeDays,
      end: pastThreeDays,
      participant: [
        { actor: { reference: 'Patient/pat_ahmed_005' }, status: 'accepted' },
        { actor: { reference: 'Practitioner/prac_dr_amina' }, status: 'accepted' },
      ],
    },
    {
      resourceType: 'Appointment',
      id: 'appt_salim_attended',
      status: 'fulfilled',
      description: 'Cardiovascular assessment and anti hypertensive titration',
      start: pastThreeDays,
      end: pastThreeDays,
      participant: [
        { actor: { reference: 'Patient/pat_salim_006' }, status: 'accepted' },
        { actor: { reference: 'Practitioner/prac_dr_amina' }, status: 'accepted' },
      ],
    },
  ];

  const carePlans: FHIRCarePlan[] = [
    {
      resourceType: 'CarePlan',
      id: 'plan_ahmed_005',
      status: 'active',
      intent: 'plan',
      title: 'Hypertension Control and Surveillance Plan',
      description: 'Amlodipine 5mg daily with cellular cuff surveillance and lifestyle sodium reduction',
      subject: { reference: 'Patient/pat_ahmed_005' },
      author: { reference: 'Practitioner/prac_dr_amina' },
    },
    {
      resourceType: 'CarePlan',
      id: 'plan_salim_006',
      status: 'completed',
      intent: 'plan',
      title: 'Successful Hypertension Stabilization Plan',
      description: 'Lisinopril 10mg daily with documented normal blood pressure readings',
      subject: { reference: 'Patient/pat_salim_006' },
      author: { reference: 'Practitioner/prac_dr_amina' },
    },
  ];

  const communications: FHIRCommunication[] = [
    {
      resourceType: 'Communication',
      id: 'comm_tariq_sms_01',
      status: 'completed',
      category: [{ text: 'screening-notification' }],
      subject: { reference: 'Patient/pat_tariq_001' },
      sent: timestamp,
      recipient: [{ reference: 'Patient/pat_tariq_001' }],
      payload: [
        {
          contentString:
            'Screenlit Health Notice: Your recent blood pressure reading is ready for secure review in your patient portal.',
        },
      ],
    },
    {
      resourceType: 'Communication',
      id: 'comm_fatima_urgent_alert',
      status: 'completed',
      category: [{ text: 'urgent-clinical-alert' }],
      subject: { reference: 'Patient/pat_fatima_002' },
      sent: timestamp,
      recipient: [{ reference: 'Practitioner/prac_dr_amina' }],
      payload: [
        {
          contentString:
            'Urgent Alert: Screening blood pressure 184/114 requires immediate physician evaluation.',
        },
      ],
    },
  ];

  const consents: FHIRConsent[] = [
    {
      resourceType: 'Consent',
      id: 'pat_tariq_001_org_alamal_clinic',
      status: 'active',
      scope: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy' }],
        text: 'Clinical coordination data sharing',
      },
      category: [{ text: 'Care coordination' }],
      patient: { reference: 'Patient/pat_tariq_001', type: 'Patient' },
      organization: [{ reference: 'Organization/org_alamal_clinic', display: 'Al Amal Community Health Centre' }],
      provision: {
        type: 'permit',
      },
    },
    {
      resourceType: 'Consent',
      id: 'pat_fatima_002_org_alamal_clinic',
      status: 'active',
      scope: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy' }],
        text: 'Clinical coordination data sharing',
      },
      category: [{ text: 'Care coordination' }],
      patient: { reference: 'Patient/pat_fatima_002', type: 'Patient' },
      organization: [{ reference: 'Organization/org_alamal_clinic', display: 'Al Amal Community Health Centre' }],
      provision: {
        type: 'permit',
      },
    },
    {
      resourceType: 'Consent',
      id: 'pat_grace_003_org_central_hospital',
      status: 'active',
      scope: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy' }],
        text: 'Clinical coordination data sharing',
      },
      category: [{ text: 'Care coordination' }],
      patient: { reference: 'Patient/pat_grace_003', type: 'Patient' },
      organization: [{ reference: 'Organization/org_central_hospital', display: 'Central District Hospital' }],
      provision: {
        type: 'permit',
      },
    },
    {
      resourceType: 'Consent',
      id: 'pat_maryam_004_org_maternal_wellness',
      status: 'active',
      scope: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy' }],
        text: 'Clinical coordination data sharing',
      },
      category: [{ text: 'Care coordination' }],
      patient: { reference: 'Patient/pat_maryam_004', type: 'Patient' },
      organization: [{ reference: 'Organization/org_maternal_wellness', display: 'Sidra Maternal and Child Health Clinic' }],
      provision: {
        type: 'permit',
      },
    },
    {
      resourceType: 'Consent',
      id: 'pat_ahmed_005_org_alamal_clinic',
      status: 'active',
      scope: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy' }],
        text: 'Clinical coordination data sharing',
      },
      category: [{ text: 'Care coordination' }],
      patient: { reference: 'Patient/pat_ahmed_005', type: 'Patient' },
      organization: [{ reference: 'Organization/org_alamal_clinic', display: 'Al Amal Community Health Centre' }],
      provision: {
        type: 'permit',
      },
    },
    {
      resourceType: 'Consent',
      id: 'pat_salim_006_org_alamal_clinic',
      status: 'active',
      scope: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy' }],
        text: 'Clinical coordination data sharing',
      },
      category: [{ text: 'Care coordination' }],
      patient: { reference: 'Patient/pat_salim_006', type: 'Patient' },
      organization: [{ reference: 'Organization/org_alamal_clinic', display: 'Al Amal Community Health Centre' }],
      provision: {
        type: 'permit',
      },
    },
    {
      resourceType: 'Consent',
      id: 'pat_layla_007_org_alamal_clinic',
      status: 'active',
      scope: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy' }],
        text: 'Clinical coordination data sharing',
      },
      category: [{ text: 'Care coordination' }],
      patient: { reference: 'Patient/pat_layla_007', type: 'Patient' },
      organization: [{ reference: 'Organization/org_alamal_clinic', display: 'Al Amal Community Health Centre' }],
      provision: {
        type: 'permit',
      },
    },
    {
      resourceType: 'Consent',
      id: 'pat_khalid_008_org_alamal_clinic',
      status: 'active',
      scope: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy' }],
        text: 'Clinical coordination data sharing',
      },
      category: [{ text: 'Care coordination' }],
      patient: { reference: 'Patient/pat_khalid_008', type: 'Patient' },
      organization: [{ reference: 'Organization/org_alamal_clinic', display: 'Al Amal Community Health Centre' }],
      provision: {
        type: 'permit',
      },
    },
  ];

  const auditEvents: FHIRAuditEvent[] = [
    buildAuditEvent({
      id: 'audit_init_001',
      action: 'C',
      recorded: pastWeek,
      actorUid: 'prac_coord_fatima',
      actorRole: 'coordinator',
      caseId: 'task_case_001',
      reason: 'Initial actionable blood pressure screening observation recorded',
    }),
    buildAuditEvent({
      id: 'audit_init_002',
      action: 'C',
      recorded: pastDay,
      actorUid: 'prac_coord_fatima',
      actorRole: 'coordinator',
      caseId: 'task_case_002',
      reason: 'Urgent hypertensive reading identified with immediate physician notification',
    }),
    buildAuditEvent({
      id: 'audit_init_003',
      action: 'C',
      recorded: pastDay,
      actorUid: 'prac_dr_mwangi',
      actorRole: 'specialist',
      caseId: 'task_case_003',
      reason: 'Colorectal positive FIT screening result received and referred for colonoscopy',
    }),
    buildAuditEvent({
      id: 'audit_salim_closed',
      action: 'U',
      recorded: timestamp,
      actorUid: 'prac_dr_amina',
      actorRole: 'physician',
      caseId: 'task_case_006',
      reason: 'Formal case closure verified with clinician electronic signature and three controlled readings',
    }),
  ];

  return {
    organizations,
    practitioners,
    users,
    patients,
    observations,
    tasks,
    auditEvents,
    coverages,
    devices,
    diagnosticReports,
    serviceRequests,
    appointments,
    carePlans,
    communications,
    consents,
    config: {
      clinicalThresholds: SCREENLIT_CONFIG.hypertensionThresholds,
      slaHours: SCREENLIT_CONFIG.slaHours,
      demoClockOffsetHours: 0,
      region: SCREENLIT_CONFIG.region,
      dataResidency: {
        jurisdiction: 'Middle East (GCC)',
        cloudRegion: 'me-central1',
        location: 'Doha, Qatar',
        complianceStatus: 'Sovereign clinical data enclave',
      },
    },
  };
}

export async function runSeed(): Promise<void> {
  console.log('Generating Screenlit synthetic clinical seed bundle...');
  const bundle = generateSeedSkeleton();
  console.log(`Generated ${bundle.organizations.length} organizations.`);
  console.log(`Generated ${bundle.practitioners.length} practitioners.`);
  console.log(`Generated ${bundle.users.length} demo user profiles.`);
  console.log(`Generated ${bundle.patients.length} patients.`);
  console.log(`Generated ${bundle.observations.length} observations.`);
  console.log(`Generated ${bundle.tasks.length} cases.`);
  console.log(`Generated ${bundle.auditEvents.length} audit event log records.`);
  console.log(`Generated ${bundle.coverages.length} insurance coverage records.`);
  console.log(`Generated ${bundle.devices.length} medical and wearable devices.`);
  console.log(`Generated ${bundle.diagnosticReports.length} diagnostic reports.`);
  console.log(`Generated ${bundle.serviceRequests.length} referral service requests.`);
  console.log(`Generated ${bundle.appointments.length} clinical appointments.`);
  console.log(`Generated ${bundle.carePlans.length} care plans.`);
  console.log(`Generated ${bundle.communications.length} notifications and communications.`);
  console.log(`Generated ${bundle.consents.length} privacy and sharing consent records.`);
  console.log('Seed bundle generation completed successfully.');
}

if (
  process.argv[1] &&
  (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'))
) {
  runSeed().catch((err) => {
    console.error('Seed execution encountered an error:', err);
    process.exit(1);
  });
}
