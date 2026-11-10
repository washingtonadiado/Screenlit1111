/**
 * Screenlit Audit Log Viewer
 * Displays immutable FHIR AuditEvent logs documenting who, what, when, and why for every state transition
 */

import React, { useEffect, useState } from 'react';
import { FHIRAuditEvent } from '@shared/types';
import { FileText, RefreshCw, Shield, ShieldCheck } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const [audits, setAudits] = useState<FHIRAuditEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/demo/audits');
      if (res.ok) {
        const data = await res.json();
        setAudits(data.audits || []);
      }
    } catch (err) {
      console.error('Failed to load audit events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  const sorted = [...audits].sort(
    (a, b) => new Date(b.recorded).getTime() - new Date(a.recorded).getTime()
  );

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Electronic Health Audit Trail (FHIR AuditEvent)
          </h3>
          <p className="text-xs text-slate-500">
            Immutable log of all screening observations, state transitions, and clinician signatures
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAudits}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          title="Refresh Audit Log"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3 text-start">Timestamp</th>
              <th className="py-2.5 px-3 text-start">Action</th>
              <th className="py-2.5 px-3 text-start">Case Entity</th>
              <th className="py-2.5 px-3 text-start">Actor / Role</th>
              <th className="py-2.5 px-3 text-start">Clinical Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((a) => {
              const recordedDate = new Date(a.recorded).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <tr key={a.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {recordedDate}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.action === 'C'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {a.action === 'C' ? 'Create' : 'Update'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-800">
                    {a.entity?.[0]?.what?.reference || 'Task'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 font-medium">
                    {a.agent?.[0]?.who?.display || a.agent?.[0]?.who?.reference || 'System'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-800 max-w-xs leading-snug">
                    {a.outcomeDesc || 'State transition verified'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
