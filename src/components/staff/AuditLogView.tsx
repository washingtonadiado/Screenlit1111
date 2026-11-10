/**
 * Screenlit Audit Log Viewer
 * Displays immutable FHIR AuditEvent logs documenting who, what, when, and why for every state transition
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useEffect, useState } from 'react';
import { FHIRAuditEvent } from '@shared/types';
import { RefreshCw, ShieldCheck } from 'lucide-react';

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
    <div className="bg-[#141923] rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div>
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Electronic Health Audit Trail
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 uppercase tracking-wider">
              FHIR AuditEvent
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log of all screening observations, state transitions, and clinician signatures
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAudits}
          className="p-2 rounded-xl bg-[#10141d] hover:bg-[#161c28] border border-slate-800 text-slate-400 hover:text-white transition"
          title="Refresh Audit Log"
          aria-label="Refresh audit log"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d4f933]' : ''}`} />
        </button>
      </div>

      {/* Count pill */}
      <div className="px-5 py-2.5 bg-[#10141d] border-b border-slate-800 flex items-center gap-2 text-xs text-slate-400">
        <span className="font-mono font-bold text-white">{sorted.length}</span>
        <span>audit events recorded</span>
        <span aria-hidden="true">·</span>
        <span>Append-only immutable log</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {sorted.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            {loading ? 'Loading audit events...' : 'No audit events recorded yet.'}
          </div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#10141d] text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-4 text-left whitespace-nowrap border-b border-slate-800">Timestamp</th>
                <th className="py-3 px-4 text-left border-b border-slate-800">Action</th>
                <th className="py-3 px-4 text-left border-b border-slate-800">Case Entity</th>
                <th className="py-3 px-4 text-left border-b border-slate-800">Actor / Role</th>
                <th className="py-3 px-4 text-left border-b border-slate-800">Clinical Reason</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a, idx) => {
                const recordedDate = new Date(a.recorded).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                const isEven = idx % 2 === 0;

                return (
                  <tr
                    key={a.id}
                    className={`border-b border-slate-800/60 hover:bg-[#182338] transition-colors ${
                      isEven ? 'bg-[#141923]' : 'bg-[#10141d]'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {recordedDate}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide ${
                          a.action === 'C'
                            ? 'bg-[#3b5bf5]/20 text-[#3b5bf5] border border-[#3b5bf5]/30'
                            : 'bg-amber-950/50 text-amber-300 border border-amber-800/50'
                        }`}
                      >
                        {a.action === 'C' ? 'Create' : 'Update'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                      {a.entity?.[0]?.what?.reference || 'Task'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium text-[11px]">
                      {a.agent?.[0]?.who?.display || a.agent?.[0]?.who?.reference || 'System'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-sm leading-relaxed text-[11px]">
                      {a.outcomeDesc || 'State transition verified'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
