/**
 * Screenlit Phase 6 Verification Test Suite
 * Validates clinical seed generation, multi role coverage, condition agnostic pathways,
 * closure prerequisites, and sovereign cloud deployment configuration
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import { describe, expect, it } from 'vitest';
import { generateSeedSkeleton } from '../scripts/seed';
import { ScreenlitDatabase } from '../functions/storage';
import { SCREENLIT_CONFIG } from '../shared/config';
import { validateClosurePrerequisites } from '../shared/stateMachine';

describe('Phase 6: Clinical Seed Generation and Multi Role Verification', () => {
  it('generates a complete FHIR R4 seed bundle with all required collections', () => {
    const bundle = generateSeedSkeleton();

    expect(bundle.organizations.length).toBeGreaterThanOrEqual(2);
    expect(bundle.practitioners.length).toBeGreaterThanOrEqual(3);
    expect(bundle.users.length).toBeGreaterThanOrEqual(6);
    expect(bundle.patients.length).toBeGreaterThanOrEqual(6);
    expect(bundle.observations.length).toBeGreaterThanOrEqual(8);
    expect(bundle.tasks.length).toBeGreaterThanOrEqual(8);
    expect(bundle.auditEvents.length).toBeGreaterThanOrEqual(4);
    expect(bundle.coverages.length).toBeGreaterThanOrEqual(6);
    expect(bundle.devices.length).toBeGreaterThanOrEqual(4);
    expect(bundle.diagnosticReports.length).toBeGreaterThanOrEqual(1);
    expect(bundle.serviceRequests.length).toBeGreaterThanOrEqual(2);
    expect(bundle.appointments.length).toBeGreaterThanOrEqual(2);
    expect(bundle.carePlans.length).toBeGreaterThanOrEqual(2);
    expect(bundle.communications.length).toBeGreaterThanOrEqual(2);
    expect(bundle.consents.length).toBeGreaterThanOrEqual(6);
  });

  it('provides dedicated demo user profiles for all six system roles', () => {
    const bundle = generateSeedSkeleton();
    const roles = bundle.users.map((u) => u.role);

    expect(roles).toContain('patient');
    expect(roles).toContain('caregiver');
    expect(roles).toContain('coordinator');
    expect(roles).toContain('physician');
    expect(roles).toContain('specialist');
    expect(roles).toContain('admin');

    const caregiver = bundle.users.find((u) => u.role === 'caregiver');
    expect(caregiver?.linkedPatientId).toBe('pat_tariq_001');

    const patient = bundle.users.find((u) => u.role === 'patient');
    expect(patient?.linkedPatientId).toBe('pat_tariq_001');
  });

  it('demonstrates condition agnostic architecture with colorectal cancer and maternal pathways', () => {
    const bundle = generateSeedSkeleton();

    const fitTask = bundle.tasks.find((t) =>
      t.code.text?.includes('Colorectal')
    );
    expect(fitTask).toBeDefined();
    expect(fitTask?.businessStatus.text).toBe('Referred');

    const fitReport = bundle.diagnosticReports.find((r) =>
      r.code.text?.includes('Colorectal')
    );
    expect(fitReport).toBeDefined();
    expect(fitReport?.conclusion?.toLowerCase()).toContain('abnormal');

    const maternalTask = bundle.tasks.find((t) =>
      t.code.text?.includes('Maternal')
    );
    expect(maternalTask).toBeDefined();
    expect(maternalTask?.businessStatus.text).toBe('Acknowledged');
  });

  it('enforces strict server side prerequisites on the seeded closed case', () => {
    const bundle = generateSeedSkeleton();
    const closedTask = bundle.tasks.find(
      (t) => t.businessStatus.text === 'Closed'
    );
    expect(closedTask).toBeDefined();

    const db = ScreenlitDatabase.resetInstance();
    const closedCaseDoc = db.collections.tasks.get(closedTask!.id);
    expect(closedCaseDoc).toBeDefined();

    const closureValidation = validateClosurePrerequisites(
      closedCaseDoc!,
      'physician'
    );
    expect(closureValidation.valid).toBe(true);
    expect(closedCaseDoc?.evidence.controlledReadingsCount).toBe(3);
    expect(closedCaseDoc?.evidence.clinicianSignature).toBeDefined();
    expect(
      closedCaseDoc?.evidence.clinicianSignature?.signerRole
    ).toBe('physician');
  });

  it('verifies Middle East sovereign data residency in Doha Qatar me central1', () => {
    const bundle = generateSeedSkeleton();
    const resConfig = bundle.config.dataResidency as Record<string, string>;

    expect(resConfig.cloudRegion).toBe('me-central1');
    expect(resConfig.location).toBe('Doha, Qatar');
    expect(SCREENLIT_CONFIG.region.primaryMiddleEastRegion).toBe('me-central1');
  });
});
