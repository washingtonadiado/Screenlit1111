/**
 * Screenlit Patient Clinical Messages View
 * Real time coordination messages and SMS push notifications in dark mode
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  Clock,
  MessageSquare,
  Send,
  Smartphone,
  User,
} from 'lucide-react';
import { OutboxItem } from '@shared/types';

export const MessagesView: React.FC = () => {
  const { dict, currentUser, setActiveView } = useApp();
  const [outboxItems, setOutboxItems] = useState<OutboxItem[]>([]);
  const [newMsg, setNewMsg] = useState('');

  const fetchOutbox = async () => {
    try {
      const res = await fetch('/api/demo/outbox');
      if (res.ok) {
        const data = await res.json();
        setOutboxItems(data.outbox || []);
      }
    } catch (err) {
      console.error('Failed to fetch outbox messages:', err);
    }
  };

  useEffect(() => {
    fetchOutbox();
  }, []);

  const patientOutbox = outboxItems.filter(
    (item) => item.patientId === (currentUser.linkedPatientId || 'pat_tariq_001')
  );

  return (
    <div className="space-y-4 text-white">
      {/* Back button */}
      <button
        type="button"
        onClick={() => setActiveView('home')}
        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      <div className="bg-[#151a24] rounded-3xl p-5 border border-slate-800/80 shadow-xl space-y-4">
        <div>
          <h2 className="text-xl font-black text-white">
            {dict.nav.messages}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Coordination notifications and clinician guidance
          </p>
        </div>

        <div className="p-3 bg-[#10141d] border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <Smartphone className="w-4 h-4 text-[#d4f933]" />
            <span>Dual Channel: Web Push and SMS Fallback</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        <div className="space-y-3">
          {patientOutbox.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-[#10141d] rounded-2xl border border-slate-800">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No new messages</p>
              <p className="mt-1">
                Clinical alerts and coordinator outreach notes appear here.
              </p>
            </div>
          ) : (
            patientOutbox.map((msg) => (
              <div
                key={msg.id}
                className="p-4 bg-[#182338] border border-blue-900/50 rounded-2xl space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between text-[11px] text-blue-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <User className="w-3.5 h-3.5 text-[#d4f933]" />
                    <span>Fatima Noor, RN (Care Coordinator)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-white leading-relaxed font-medium">
                  {msg.body}
                </p>

                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-blue-900/40">
                  <span>Channel: {msg.channel.toUpperCase()}</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCheck className="w-3.5 h-3.5" /> Delivered
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
