/**
 * Screenlit Patient Care Plan View
 * Structured clinical care protocol, lifestyle targets, and daily medication adherence checklist in dark mode
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Activity,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Footprints,
  Pill,
  Salad,
  ShieldCheck,
  Target,
} from 'lucide-react';

export const CarePlanView: React.FC = () => {
  const { dict, setActiveView } = useApp();
  const [adherence, setAdherence] = useState({
    morningMed: true,
    walkingGoal: false,
    sodiumLimit: true,
  });

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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d4f933]/15 text-[#d4f933] border border-[#d4f933]/30 text-xs font-bold rounded-full mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Active Clinical Protocol
          </span>
          <h2 className="text-xl font-black text-white">
            {dict.carePlan.title}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {dict.carePlan.condition}
          </p>
        </div>

        {/* Clinical Targets */}
        <div className="space-y-2.5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
            {dict.carePlan.goals}
          </h3>

          <div className="p-3.5 bg-[#10141d] border border-slate-800 rounded-2xl space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2.5">
              <Target className="w-4 h-4 text-[#d4f933] mt-0.5 flex-shrink-0" />
              <p className="leading-snug font-medium">
                {dict.carePlan.goal1}
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <Footprints className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="leading-snug font-medium">
                {dict.carePlan.goal2}
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <Salad className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <p className="leading-snug font-medium">
                {dict.carePlan.goal3}
              </p>
            </div>
          </div>
        </div>

        {/* Prescribed Medications */}
        <div className="space-y-2.5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
            {dict.carePlan.medications}
          </h3>

          <div className="p-4 bg-[#121c2e] border border-blue-900/50 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-[#d4f933] flex items-center justify-center font-bold">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">
                  Amlodipine 5mg
                </p>
                <p className="text-xs text-slate-400">
                  {dict.carePlan.med1}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full border border-blue-500/30">
              Active
            </span>
          </div>
        </div>

        {/* Daily Adherence Checklist */}
        <div className="space-y-2.5 pt-1">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
            Daily Adherence Checklist
          </h3>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() =>
                setAdherence((prev) => ({
                  ...prev,
                  morningMed: !prev.morningMed,
                }))
              }
              className={`w-full p-3 rounded-2xl border text-left text-xs font-semibold transition flex items-center justify-between ${
                adherence.morningMed
                  ? 'bg-[#182338] border-[#3b5bf5] text-white'
                  : 'bg-[#10141d] border-slate-800 text-slate-400'
              }`}
            >
              <span>Took morning medication (Amlodipine 5mg)</span>
              {adherence.morningMed ? (
                <CheckCircle2 className="w-4 h-4 text-[#d4f933]" />
              ) : (
                <Circle className="w-4 h-4 text-slate-600" />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setAdherence((prev) => ({
                  ...prev,
                  walkingGoal: !prev.walkingGoal,
                }))
              }
              className={`w-full p-3 rounded-2xl border text-left text-xs font-semibold transition flex items-center justify-between ${
                adherence.walkingGoal
                  ? 'bg-[#182338] border-[#3b5bf5] text-white'
                  : 'bg-[#10141d] border-slate-800 text-slate-400'
              }`}
            >
              <span>Completed 30 minutes brisk walking</span>
              {adherence.walkingGoal ? (
                <CheckCircle2 className="w-4 h-4 text-[#d4f933]" />
              ) : (
                <Circle className="w-4 h-4 text-slate-600" />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setAdherence((prev) => ({
                  ...prev,
                  sodiumLimit: !prev.sodiumLimit,
                }))
              }
              className={`w-full p-3 rounded-2xl border text-left text-xs font-semibold transition flex items-center justify-between ${
                adherence.sodiumLimit
                  ? 'bg-[#182338] border-[#3b5bf5] text-white'
                  : 'bg-[#10141d] border-slate-800 text-slate-400'
              }`}
            >
              <span>Maintained low sodium meal choices</span>
              {adherence.sodiumLimit ? (
                <CheckCircle2 className="w-4 h-4 text-[#d4f933]" />
              ) : (
                <Circle className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
