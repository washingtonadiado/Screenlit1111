/**
 * Screenlit Population Health Impact Simulation Engine
 * Models a synthetic cohort of 2,000 adults across Monte Carlo replications
 *
 * Permanent Banner: Simulated results, not clinical evidence.
 * All assumptions documented with intended clinical literature sources
 */

import { SimulationAssumption, SimulationResultMetrics, SimulationRunRecord } from '../shared/types';
import { ScreenlitDatabase } from './storage';

export const SIMULATION_ASSUMPTIONS: SimulationAssumption[] = [
  {
    key: 'timeToNotificationHours',
    baselineRate: 72.0,
    screenlitRate: 1.8,
    intendedSource: 'Regional community screening operational benchmark data',
  },
  {
    key: 'acknowledgementRatePercent',
    baselineRate: 31.4,
    screenlitRate: 88.6,
    intendedSource: 'Population digital engagement and SMS reminder trials',
  },
  {
    key: 'timeToConsultationDays',
    baselineRate: 26.5,
    screenlitRate: 8.2,
    intendedSource: 'Primary care referral navigation delay studies',
  },
  {
    key: 'referralCompletionPercent',
    baselineRate: 44.2,
    screenlitRate: 86.4,
    intendedSource: 'Closed loop clinical referral audit benchmarks',
  },
  {
    key: 'appointmentCompletionPercent',
    baselineRate: 52.8,
    screenlitRate: 91.2,
    intendedSource: 'Clinic attendance and appointment navigation research',
  },
  {
    key: 'treatmentInitiationPercent',
    baselineRate: 38.6,
    screenlitRate: 84.5,
    intendedSource: 'Hypertension guideline initiation and medication start registries',
  },
  {
    key: 'unresolvedActionableAt90DaysPercent',
    baselineRate: 58.7,
    screenlitRate: 9.4,
    intendedSource: 'Lost to follow up population screening cohort studies',
  },
  {
    key: 'documentedClosureRatePercent',
    baselineRate: 18.2,
    screenlitRate: 78.4,
    intendedSource: 'Clinical screening loop closure audit standards',
  },
  {
    key: 'bloodPressureControlAt90DaysPercent',
    baselineRate: 34.0,
    screenlitRate: 68.8,
    intendedSource: 'Surveillance home blood pressure telemonitoring trials',
  },
];

export interface SyntheticPatientProfile {
  id: string;
  age: number;
  gender: 'male' | 'female';
  baselineSystolic: number;
  baselineDiastolic: number;
  hasComorbidity: boolean;
  hasInNetworkInsurance: boolean;
  digitalLiteracyTier: 'low' | 'moderate' | 'high';
}

export function generateSyntheticAdultCohort(size = 2000): SyntheticPatientProfile[] {
  const cohort: SyntheticPatientProfile[] = [];

  for (let i = 1; i <= size; i++) {
    const age = Math.floor(35 + Math.random() * 45);
    const gender = Math.random() > 0.48 ? 'female' : 'male';
    const isElevated = Math.random() > 0.4;
    const baselineSystolic = isElevated
      ? Math.floor(142 + Math.random() * 32)
      : Math.floor(118 + Math.random() * 18);
    const baselineDiastolic = isElevated
      ? Math.floor(92 + Math.random() * 18)
      : Math.floor(76 + Math.random() * 12);

    const hasComorbidity = Math.random() > 0.65;
    const hasInNetworkInsurance = Math.random() > 0.22;
    const randLit = Math.random();
    const digitalLiteracyTier =
      randLit < 0.35 ? 'low' : randLit < 0.75 ? 'moderate' : 'high';

    cohort.push({
      id: `syn_adult_${i}`,
      age,
      gender,
      baselineSystolic,
      baselineDiastolic,
      hasComorbidity,
      hasInNetworkInsurance,
      digitalLiteracyTier,
    });
  }

  return cohort;
}

export function calculatePercentiles(values: number[]): SimulationResultMetrics {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const p5Index = Math.floor(n * 0.05);
  const medianIndex = Math.floor(n * 0.5);
  const p95Index = Math.min(n - 1, Math.floor(n * 0.95));

  return {
    median: parseFloat(sorted[medianIndex].toFixed(1)),
    p5: parseFloat(sorted[p5Index].toFixed(1)),
    p95: parseFloat(sorted[p95Index].toFixed(1)),
  };
}

export class ImpactSimulationEngine {
  public static runSimulation(
    cohortSize = 2000,
    replicationsCount = 50,
    db: ScreenlitDatabase = ScreenlitDatabase.getInstance()
  ): SimulationRunRecord {
    const timeToNotificationRuns: number[] = [];
    const ackRateRuns: number[] = [];
    const timeToConsultRuns: number[] = [];
    const referralCompRuns: number[] = [];
    const apptCompRuns: number[] = [];
    const txInitiationRuns: number[] = [];
    const unresolvedAt90Runs: number[] = [];
    const closureRateRuns: number[] = [];
    const bpControlRuns: number[] = [];

    for (let r = 0; r < replicationsCount; r++) {
      const cohort = generateSyntheticAdultCohort(cohortSize);
      let notifiedCount = 0;
      let acknowledgedCount = 0;
      let referredCount = 0;
      let attendedCount = 0;
      let treatedCount = 0;
      let closedCount = 0;
      let controlledAt90Count = 0;

      let totalNotificationHours = 0;
      let totalConsultDays = 0;

      cohort.forEach((patient) => {
        const notifHours = 1.2 + Math.random() * 1.2;
        totalNotificationHours += notifHours;
        notifiedCount++;

        const ackChance =
          patient.digitalLiteracyTier === 'low'
            ? 0.93
            : patient.digitalLiteracyTier === 'moderate'
            ? 0.96
            : 0.98;

        if (Math.random() < ackChance) {
          acknowledgedCount++;

          const refChance = patient.hasInNetworkInsurance ? 0.98 : 0.94;
          if (Math.random() < refChance) {
            referredCount++;
            const consultDays = 5.0 + Math.random() * 3.5;
            totalConsultDays += consultDays;

            if (Math.random() < 0.97) {
              attendedCount++;

              if (Math.random() < 0.96) {
                treatedCount++;

                if (Math.random() < 0.95) {
                  closedCount++;
                }

                if (Math.random() < 0.72) {
                  controlledAt90Count++;
                }
              }
            }
          }
        }
      });

      const ackRate = (acknowledgedCount / cohortSize) * 100;
      const refComp = (referredCount / (acknowledgedCount || 1)) * 100;
      const apptComp = (attendedCount / (referredCount || 1)) * 100;
      const txInit = (treatedCount / (attendedCount || 1)) * 100;
      const closureRate = (closedCount / cohortSize) * 100;
      const unresolvedAt90 = 100 - ((treatedCount || 0) / cohortSize) * 100;
      const bpControl = (controlledAt90Count / (treatedCount || 1)) * 100;

      timeToNotificationRuns.push(totalNotificationHours / notifiedCount);
      ackRateRuns.push(ackRate);
      timeToConsultRuns.push(totalConsultDays / (referredCount || 1));
      referralCompRuns.push(refComp);
      apptCompRuns.push(apptComp);
      txInitiationRuns.push(txInit);
      closureRateRuns.push(closureRate);
      unresolvedAt90Runs.push(unresolvedAt90);
      bpControlRuns.push(bpControl);
    }

    const runRecord: SimulationRunRecord = {
      id: `sim_run_${Date.now()}`,
      executedAt: db.getNow().toISOString(),
      cohortSize,
      replicationsCount,
      banner: 'Simulated results, not clinical evidence.',
      metrics: {
        timeToNotificationHours: calculatePercentiles(timeToNotificationRuns),
        acknowledgementRatePercent: calculatePercentiles(ackRateRuns),
        timeToConsultationDays: calculatePercentiles(timeToConsultRuns),
        referralCompletionPercent: calculatePercentiles(referralCompRuns),
        appointmentCompletionPercent: calculatePercentiles(apptCompRuns),
        treatmentInitiationPercent: calculatePercentiles(txInitiationRuns),
        unresolvedActionableAt90DaysPercent: calculatePercentiles(unresolvedAt90Runs),
        documentedClosureRatePercent: calculatePercentiles(closureRateRuns),
        bloodPressureControlAt90DaysPercent: calculatePercentiles(bpControlRuns),
      },
    };

    db.collections.simulationRuns.set(runRecord.id, runRecord);
    return runRecord;
  }
}
