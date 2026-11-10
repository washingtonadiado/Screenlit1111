/**
 * Screenlit Demo Clock Bar
 * Persistent simulation time control for judges and demo environments
 * Allows advancing the demo clock to trigger SLA breaches and test escalation ladders
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertTriangle,
  Clock,
  FastForward,
  RefreshCw,
  RotateCcw,
  Timer,
  Zap,
} from 'lucide-react';

interface DemoClockBarProps {
  onAfterAdvance?: () => void;
}

export const DemoClockBar: React.FC<DemoClockBarProps> = ({ onAfterAdvance }) => {
  const { demoClockOffsetHours, advanceDemoClock, refreshData } = useApp();
  const [advancing, setAdvancing] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const simulatedNow = new Date(Date.now() + demoClockOffsetHours * 3600 * 1000);

  const handleAdvance = async (hours: number, label: string) => {
    setAdvancing(true);
    setLastAction(null);
    try {
      await advanceDemoClock(hours);
      setLastAction(label);
      onAfterAdvance?.();
    } finally {
      setAdvancing(false);
    }
  };

  const handleReset = async () => {
    setAdvancing(true);
    setLastAction(null);
    try {
      const res = await fetch('/api/demo/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setOffsetHours: 0 }),
      });
      if (res.ok) {
        await refreshData();
        setLastAction('Clock reset');
        onAfterAdvance?.();
      }
    } finally {
      setAdvancing(false);
    }
  };

  const offsetLabel =
    demoClockOffsetHours === 0
      ? 'Real time'
      : demoClockOffsetHours < 0
      ? `${Math.abs(demoClockOffsetHours)}h behind`
      : `+${demoClockOffsetHours}h ahead`;

  return (
    <div
      className="flex flex-wrap items-center gap-3 bg-[#0c1017] border border-slate-800/80 rounded-2xl px-4 py-2.5"
      role="region"
      aria-label="Demo clock controls"
    >
      {/* Clock icon + current simulated time */}
      <div className="flex items-center gap-2 text-xs flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-[#141923] border border-slate-800 flex items-center justify-center">
          <Timer className="w-3.5 h-3.5 text-[#d4f933]" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider leading-none mb-0.5">
            Demo Clock
          </p>
          <p className="font-mono font-bold text-white text-xs">
            {simulatedNow.toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
            {' '}
            <span className="text-slate-300">
              {simulatedNow.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </p>
        </div>
      </div>

      {/* Offset pill */}
      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono flex-shrink-0 ${
          demoClockOffsetHours === 0
            ? 'bg-slate-800/60 text-slate-400 border-slate-700'
            : 'bg-amber-950/50 text-amber-300 border-amber-800/60'
        }`}
        aria-live="polite"
      >
        {offsetLabel}
      </span>

      {/* Divider */}
      <div className="hidden sm:block w-px h-5 bg-slate-800 flex-shrink-0" aria-hidden="true" />

      {/* Clock advance buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => handleAdvance(1, '+1h')}
          disabled={advancing}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#141923] hover:bg-[#161c28] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-[11px] font-bold transition disabled:opacity-40"
          aria-label="Advance clock 1 hour"
        >
          <Clock className="w-3 h-3" />
          <span>+1h</span>
        </button>

        <button
          type="button"
          onClick={() => handleAdvance(12, '+12h')}
          disabled={advancing}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#141923] hover:bg-[#161c28] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-[11px] font-bold transition disabled:opacity-40"
          aria-label="Advance clock 12 hours"
        >
          <FastForward className="w-3 h-3" />
          <span>+12h</span>
        </button>

        <button
          type="button"
          onClick={() => handleAdvance(48, '+48h SLA Breach')}
          disabled={advancing}
          className="flex items-center gap-1 px-3 py-1.5 bg-rose-950/50 hover:bg-rose-950 border border-rose-800/60 hover:border-rose-700 text-rose-300 hover:text-rose-200 rounded-xl text-[11px] font-extrabold transition disabled:opacity-40"
          aria-label="Advance clock 48 hours to trigger SLA breach"
        >
          <AlertTriangle className="w-3 h-3" />
          <span>+48h SLA Breach</span>
        </button>

        <button
          type="button"
          onClick={() => handleAdvance(168, '+7d')}
          disabled={advancing}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#141923] hover:bg-[#161c28] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-[11px] font-bold transition disabled:opacity-40"
          aria-label="Advance clock 7 days"
        >
          <Zap className="w-3 h-3 text-amber-400" />
          <span>+7d</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={advancing}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#141923] hover:bg-[#161c28] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-[11px] font-bold transition disabled:opacity-40"
          aria-label="Reset demo clock to real time"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Feedback indicator */}
      <div className="flex items-center gap-1.5 text-[11px] ms-auto flex-shrink-0">
        {advancing && (
          <span className="flex items-center gap-1.5 text-slate-400">
            <RefreshCw className="w-3 h-3 animate-spin text-[#d4f933]" />
            <span>Advancing clock and running SLA sweep...</span>
          </span>
        )}
        {!advancing && lastAction && (
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            {lastAction} applied. SLA sweep complete.
          </span>
        )}
      </div>
    </div>
  );
};
