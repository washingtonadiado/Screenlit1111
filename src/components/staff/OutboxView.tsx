/**
 * Screenlit Notification Outbox Inspector
 * Inspects queued and delivered SMS notifications and web push alerts
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

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-600" />
            Patient Notification Outbox (SMS & Web Push)
          </h3>
          <p className="text-xs text-slate-500">
            Real time transmission dispatch queue for automated patient and staff alerts
          </p>
        </div>
        <button
          type="button"
          onClick={fetchOutbox}
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          title="Refresh Outbox"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No outgoing messages in queue.
          </div>
        ) : (
          sorted.map((item) => {
            const timeStr = new Date(item.createdAt).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={item.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded uppercase">
                      {item.channel}
                    </span>
                    <span className="font-bold text-slate-900">
                      To: {item.to}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      Lang: {item.language}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {timeStr}
                  </span>
                </div>

                <p className="text-slate-800 font-normal leading-relaxed bg-white p-3 rounded-lg border border-slate-200/50">
                  {item.body}
                </p>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span>Linked Case: {item.caseId || 'General'}</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Delivered to Gateway
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
