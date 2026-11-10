/**
 * Screenlit Clinical Triage Queues View
 * Ranked by transparent risk score with top 3 contributing factors displayed per case
 */

import React, { useState } from 'react';
import { CaseDocument } from '@shared/types';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  ExternalLink,
  Filter,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  XCircle,
} from 'lucide-react';

// Map known seed patient IDs to display names
const PATIENT_NAME_MAP: Record<string, string> = {
  pat_tariq_001: 'Tariq Al Mahmoud',
  pat_fatima_002: 'Fatima Al Zahra',
  pat_grace_003: 'Grace Wanjiku',
  pat_maryam_004: 'Maryam Saleh',
  pat_ahmed_005: 'Ahmed Hassan',
  pat_salim_006: 'Salim Al Nuaimi',
  pat_layla_007: 'Layla Ibrahim',
  pat_khalid_008: 'Khalid Al Dossary',
};

const OWNER_NAME_MAP: Record<string, string> = {
  prac_dr_amina: 'Dr. Amina Al Mansoor',
  prac_dr_mwangi: 'Dr. David Mwangi',
  prac_coord_fatima: 'Fatima Noor, RN',
  scheduler_daemon: 'SLA Scheduler',
  system_engine: 'Coordination Engine',
};

const CONDITION_LABEL: Record<string, string> = {
  hypertension: 'Hypertension',
  colorectal_cancer: 'Colorectal Screening',
  maternal_hypertension: 'Maternal Hypertension',
};

function getPatientName(patientId: string): string {
  return PATIENT_NAME_MAP[patientId] || patientId;
}

function getOwnerName(ownerUid: string): string {
  return OWNER_NAME_MAP[ownerUid] || ownerUid;
}

interface QueuesViewProps {
  cases: CaseDocument[];
  onSelectCase: (caseDoc: CaseDocument) => void;
  onRefresh: () => void;
}

export const QueuesView: React.FC<QueuesViewProps> = ({
  cases,
  onSelectCase,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overdue' | 'rejected' | 'unassigned' | 'active' | 'closed'
  >('overdue');

  const filteredCases = cases.filter((c) => {
    if (activeTab === 'overdue') return c.state === 'Overdue';
    if (activeTab === 'rejected') return c.state === 'Rejected';
    if (activeTab === 'unassigned') return c.state === 'Unassigned';
    if (activeTab === 'closed') return c.state === 'Closed';
    return c.state !== 'Closed' && c.state !== 'Overdue' && c.state !== 'Rejected';
  });

  const sortedCases = [...filteredCases].sort((a, b) => b.riskScore - a.riskScore);

  const getContributingFactors = (c: CaseDocument): string[] => {
    const factors: string[] = [];
    if (c.isUrgent) {
      factors.push('Severe blood pressure elevation (systolic >= 180 or diastolic >= 110)');
    } else {
      factors.push('Elevated screening blood pressure above guideline threshold');
    }

    if (c.state === 'Overdue') {
      factors.push('Breached SLA communication timeline');
    } else if (c.state === 'ConfirmationPending') {
      factors.push('Pending secondary confirmation reading');
    } else {
      factors.push('Age over 55 population cohort risk');
    }

    if (!c.evidence?.patientAcknowledgedAt) {
      factors.push('Awaiting initial patient portal acknowledgement');
    } else if (!c.evidence?.treatmentStartedAt) {
      factors.push('Awaiting clinical treatment initiation');
    } else {
      factors.push('Active surveillance monitoring window');
    }

    return factors.slice(0, 3);
  };

  const overdueCount = cases.filter((c) => c.state === 'Overdue').length;
  const rejectedCount = cases.filter((c) => c.state === 'Rejected').length;
  const unassignedCount = cases.filter((c) => c.state === 'Unassigned').length;
  const activeCount = cases.filter(
    (c) => c.state !== 'Closed' && c.state !== 'Overdue' && c.state !== 'Rejected'
  ).length;
  const closedCount = cases.filter((c) => c.state === 'Closed').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('overdue')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'overdue'
              ? 'bg-rose-100 text-rose-900 border border-rose-300'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Overdue Queue ({overdueCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rejected')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'rejected'
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Rejected Referrals ({rejectedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('unassigned')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'unassigned'
              ? 'bg-blue-100 text-blue-900 border border-blue-300'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Unassigned ({unassignedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'active'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Active Cases ({activeCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('closed')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'closed'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Closed ({closedCount})</span>
        </button>
      </div>

      <div className="space-y-3">
        {sortedCases.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 text-xs">
            No cases in this queue.
          </div>
        ) : (
          sortedCases.map((c) => {
            const factors = getContributingFactors(c);
            const isDueOver = new Date(c.dueAt) < new Date();

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3 hover:border-slate-300 transition"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {c.id}
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 text-xs font-bold rounded-full">
                        {c.state}
                      </span>
                      {c.isUrgent && (
                        <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-xs font-bold rounded-full">
                          Urgent
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900 mt-1">
                      {getPatientName(c.patientId)}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {CONDITION_LABEL[c.condition] || c.condition} &bull; Owner: {getOwnerName(c.ownerUid)} ({c.ownerRole})
                    </p>
                  </div>

                  <div className="text-end">
                    <div className="flex items-center gap-1.5 justify-end">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs text-slate-500 font-semibold">
                        Risk Score:
                      </span>
                      <span className="text-base font-black text-slate-900 font-mono">
                        {c.riskScore}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] font-bold mt-0.5 ${
                        isDueOver ? 'text-rose-600' : 'text-slate-500'
                      }`}
                    >
                      {isDueOver ? 'SLA Breached' : 'Within SLA Window'}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                  <p className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
                    Top 3 Contributing Scoring Factors:
                  </p>
                  {factors.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-slate-700 leading-snug"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-500">
                    Controlled Readings: {c.evidence?.controlledReadingsCount || 0}/
                    {c.evidence?.surveillanceReadingsRequired || 3}
                  </span>

                  <button
                    type="button"
                    onClick={() => onSelectCase(c)}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                  >
                    <span>View Timeline & Actions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
