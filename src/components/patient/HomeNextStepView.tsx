/**
 * Screenlit Patient Home Screen with 2x2 Bento Action Cards Grid
 * Recreates Screen 1 from the reference design with dark mode, royal blue accent, and neon lime highlights
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  Mic,
  Plus,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Watch,
} from 'lucide-react';
import { PatientFeelingCheckin } from './PatientFeelingCheckin';

export const HomeNextStepView: React.FC = () => {
  const {
    dict,
    activeCase,
    currentUser,
    observations,
    setActiveView,
    caregiverRevoked,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'plan' | 'team'>('all');

  const isCaregiver = currentUser.role === 'caregiver';

  const bpObservations = observations.filter(
    (o) => o.code.coding?.[0]?.code === '85354-9'
  );
  const latestBp = bpObservations[0];
  const systolic = latestBp?.component?.[0]?.valueQuantity?.value || 158;
  const diastolic = latestBp?.component?.[1]?.valueQuantity?.value || 98;

  const state = activeCase?.state || 'ResultIssued';

  return (
    <div className="flex flex-col gap-4 text-white">
      {/* Caregiver Delegation Notice */}
      {isCaregiver && !caregiverRevoked && (
        <div className="bg-[#182338] border border-blue-500/40 rounded-2xl p-3 text-xs text-blue-200 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span>
            {dict.home.caregiverBanner} <strong>Tariq Al Mahmoud</strong>
          </span>
        </div>
      )}

      {/* Hero Headline matching Reference Screen 1 */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white leading-tight">
          Ready for Today's Care Steps?
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {dict.app.tagline || 'Closing the screening to care loop'}
        </p>
      </div>

      {/* Filter Segmented Control Tabs matching Reference Screen 1 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
            activeFilter === 'all'
              ? 'bg-[#d4f933] text-black shadow-sm'
              : 'bg-[#181d28] text-slate-400 hover:text-white'
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('plan')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
            activeFilter === 'plan'
              ? 'bg-[#d4f933] text-black shadow-sm'
              : 'bg-[#181d28] text-slate-400 hover:text-white'
          }`}
        >
          Care Plan
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('team')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
            activeFilter === 'team'
              ? 'bg-[#d4f933] text-black shadow-sm'
              : 'bg-[#181d28] text-slate-400 hover:text-white'
          }`}
        >
          Care Team
        </button>
      </div>

      {/* 2x2 Bento Action Cards Grid matching Reference Screen 1 */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Top Left - Royal Blue Card */}
        <div
          onClick={() => setActiveView('result')}
          className="bg-[#3b5bf5] text-white rounded-3xl p-4.5 flex flex-col justify-between h-40 shadow-lg relative overflow-hidden group hover:scale-[1.02] transition cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xs font-bold">
                <Heart className="w-3.5 h-3.5 text-white" />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider">
                Screening
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-white/80 group-hover:text-white transition" />
          </div>

          <div>
            <h4 className="font-bold text-base text-white tracking-tight leading-snug">
              BP {systolic}/{diastolic}
            </h4>
            <p className="text-[11px] text-blue-100 font-medium opacity-90 mt-0.5">
              {state === 'Closed' ? 'Controlled' : 'Review Result'}
            </p>
          </div>
        </div>

        {/* Card 2: Top Right - Dark Charcoal Glass Card */}
        <div
          onClick={() => setActiveView('readings')}
          className="bg-[#161c28] border border-slate-800/80 rounded-3xl p-4.5 flex flex-col justify-between h-40 hover:border-slate-700 transition cursor-pointer group hover:scale-[1.02]"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-300">
                <Activity className="w-3.5 h-3.5" />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase tracking-wider">
                Home Cuff
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
          </div>

          <div>
            <h4 className="font-bold text-base text-white tracking-tight leading-snug">
              Log Reading
            </h4>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Morning and Evening
            </p>
          </div>
        </div>

        {/* Card 3: Bottom Left - Deep Forest Tint Card */}
        <div
          onClick={() => setActiveView('wearable')}
          className="bg-[#121c1c] border border-emerald-900/40 rounded-3xl p-4.5 flex flex-col justify-between h-40 hover:border-emerald-700/60 transition cursor-pointer group hover:scale-[1.02]"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-7 h-7 rounded-full bg-emerald-950 flex items-center justify-center text-xs text-emerald-400">
                <Watch className="w-3.5 h-3.5" />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 uppercase tracking-wider">
                Wristband
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
          </div>

          <div>
            <h4 className="font-bold text-base text-white tracking-tight leading-snug">
              Pulse Signal
            </h4>
            <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
              71 bpm Baseline
            </p>
          </div>
        </div>

        {/* Card 4: Bottom Right - Voice & Typed Feeling Journal Card */}
        <div
          onClick={() => {
            const el = document.getElementById('feeling-checkin-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-[#192238] border border-blue-500/30 rounded-3xl p-4.5 flex flex-col justify-between h-40 hover:border-blue-400/60 transition cursor-pointer group hover:scale-[1.02]"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-7 h-7 rounded-full bg-[#3b5bf5]/20 text-[#d4f933] flex items-center justify-center text-xs">
                <Mic className="w-3.5 h-3.5" />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3b5bf5]/30 text-blue-200 uppercase tracking-wider">
                Daily Journal
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#d4f933] transition" />
          </div>

          <div>
            <h4 className="font-bold text-base text-white tracking-tight leading-snug">
              How You Feel
            </h4>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5">
              Voice or Type Notes
            </p>
          </div>
        </div>
      </div>

      {/* Primary Action Guidance Card */}
      <div className="bg-[#151a24] border border-slate-800/80 rounded-3xl p-5 shadow-sm mt-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#d4f933]" />
            <span className="text-xs font-bold text-[#d4f933] uppercase tracking-wider">
              {state === 'Closed' ? 'Loop Closed' : 'Priority Care Step'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Assigned: Fatima Noor, RN
          </span>
        </div>

        {state === 'ResultIssued' || state === 'PatientNotified' ? (
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              {dict.home.nextStepTitle}
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {dict.home.acknowledgePrompt}
            </p>
            <button
              type="button"
              onClick={() => setActiveView('result')}
              className="w-full py-3.5 bg-[#d4f933] hover:bg-[#c2e825] text-black font-extrabold rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-lg active:scale-[0.99]"
            >
              <span>{dict.home.acknowledgeButton}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : state === 'Acknowledged' || state === 'ConfirmationPending' ? (
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              {dict.home.nextStepTitle}
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {dict.home.repeatReadingPrompt}
            </p>
            <button
              type="button"
              onClick={() => setActiveView('readings')}
              className="w-full py-3.5 bg-[#3b5bf5] hover:bg-blue-600 text-white font-extrabold rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-lg active:scale-[0.99]"
            >
              <span>{dict.home.repeatReadingButton}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : state === 'Closed' ? (
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
              <CheckCircle2 className="w-5 h-5" />
              <span>{dict.home.caseClosedTitle}</span>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {dict.home.caseClosedMessage}
            </p>
            <button
              type="button"
              onClick={() => setActiveView('readings')}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-lg active:scale-[0.99]"
            >
              <span>{dict.home.logReadingButton}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              {dict.home.nextStepTitle}
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Your clinical care plan is in progress. Regular home cuff readings and
              doctor follow ups ensure blood pressure reaches target control.
            </p>
            <button
              type="button"
              onClick={() => setActiveView('schedule')}
              className="w-full py-3.5 bg-[#d4f933] hover:bg-[#c2e825] text-black font-extrabold rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-lg active:scale-[0.99]"
            >
              <span>View Care Schedule</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Patient Feeling & Symptom Checkin Section */}
      <div id="feeling-checkin-section">
        <PatientFeelingCheckin />
      </div>
    </div>
  );
};
