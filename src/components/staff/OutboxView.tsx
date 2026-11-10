/**
 * Screenlit Notification Outbox Inspector
 * Inspects queued and delivered SMS notifications and web push alerts
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useEffect, useState } from 'react';
import { OutboxItem } from '@shared/types';
import {
  CheckCheck,
  Clock,
  MessageSquare,
  RefreshCw,
  Send,
  Smartphone,
} from 'lucide-react';

const LANG_LABEL: Record<string, string> = {
  en: 'English',
  ar: 'Arabic',
  sw: 'Swahili',
};

const STATUS_STYLES: Record<string, string> = {
  queued: 'bg-amber-950/50 text-amber-300 border border-amber-800/60',
  sent: 'bg-blue-950/50 text-blue-300 border border-blue-800/60',
  delivered: 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/60',
  failed: 'bg-rose-950/50 text-rose-400 border border-rose-800/60',
};

export const OutboxView: React.FC = () => {
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOutbox = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/demo/outbox');
      if (res.ok) {
        const data = await res.json();
        setOutbox(data.outbox || []);
      }
    } catch (err) {
      console.error('Failed to fetch outbox:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutbox();
  }, []);

  const sorted = [...outbox].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const queuedCount = outbox.filter((i) => i.status === 'queued').length;
  const deliveredCount = outbox.filter((i) => i.status === 'delivered').length;

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-[#141923] border border-slate-800/80 rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#3b5bf5]" />
            Patient Notification Outbox
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3b5bf5]/20 text-[#3b5bf5] border border-[#3b5bf5]/30 uppercase tracking-wider">
              SMS and Web Push
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated patient and staff alerts dispatched by the coordination engine
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats pills */}
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/50 text-amber-300 border border-amber-800/60 font-bold">
              <Clock className="w-3 h-3" />
              {queuedCount} queued
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-800/60 font-bold">
              <CheckCheck className="w-3 h-3" />
              {deliveredCount} delivered
            </span>
          </div>

          <button
            type="button"
            onClick={fetchOutbox}
            className="p-2 rounded-xl bg-[#10141d] hover:bg-[#161c28] border border-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh Outbox"
            aria-label="Refresh outbox"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d4f933]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Message list */}
      <div className="space-y-2.5">
        {sorted.length === 0 ? (
          <div className="bg-[#141923] border border-slate-800/80 rounded-2xl p-10 text-center">
            <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">No outgoing messages in queue.</p>
            <p className="text-xs text-slate-600 mt-1">
              Notifications are generated automatically when cases transition states.
            </p>
          </div>
        ) : (
          sorted.map((item) => {
            const timeStr = new Date(item.createdAt).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const isUrgent = item.body.toLowerCase().includes('urgent');

            return (
              <div
                key={item.id}
                className={`bg-[#141923] border rounded-2xl p-4 space-y-3 transition-colors hover:border-slate-700 ${
                  isUrgent ? 'border-rose-900/60' : 'border-slate-800/80'
                }`}
              >
                {/* Row 1: metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Channel badge */}
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-[#10141d] border border-slate-800 rounded-md text-[10px] font-bold text-slate-300 uppercase">
                      {item.channel === 'sms' ? (
                        <Smartphone className="w-3 h-3 text-[#3b5bf5]" />
                      ) : (
                        <Send className="w-3 h-3 text-[#d4f933]" />
                      )}
                      {item.channel}
                    </span>

                    {/* Language badge */}
                    <span className="px-2 py-0.5 bg-[#10141d] border border-slate-800 rounded-md text-[10px] font-bold text-slate-400 font-mono">
                      {LANG_LABEL[item.language] || item.language.toUpperCase()}
                    </span>

                    {/* Status badge */}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${STATUS_STYLES[item.status] || STATUS_STYLES.queued}`}>
                      {item.status}
                    </span>

                    {isUrgent && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950/50 text-rose-400 border border-rose-800/60">
                        Urgent
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-slate-500">{timeStr}</span>
                </div>

                {/* Row 2: message body */}
                <div className="bg-[#10141d] border border-slate-800 rounded-xl p-3">
                  <p className="text-xs text-slate-200 leading-relaxed">{item.body}</p>
                </div>

                {/* Row 3: footer */}
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Patient: <span className="text-slate-300 font-mono">{item.patientId}</span>
                  </span>
                  {item.caseId && (
                    <span>
                      Case: <span className="text-slate-300 font-mono">{item.caseId}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                    <CheckCheck className="w-3.5 h-3.5" />
                    Dispatched to Gateway
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
