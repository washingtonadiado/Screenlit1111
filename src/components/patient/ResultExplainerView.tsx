/**
 * Screenlit Plain Language Result Explainer View
 * Tailored for low digital health literacy with visual gauges and reassurance in dark mode
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Activity,
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  HelpCircle,
  Info,
} from 'lucide-react';

export const ResultExplainerView: React.FC = () => {
  const { dict, setActiveView, observations } = useApp();

  const bpObservations = observations.filter(
    (o) => o.code.coding?.[0]?.code === '85354-9'
  );
  const latestBp = bpObservations[0];
  const systolic = latestBp?.component?.[0]?.valueQuantity?.value || 158;
  const diastolic = latestBp?.component?.[1]?.valueQuantity?.value || 98;

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

      <div className="bg-[#151a24] rounded-3xl p-5 border border-slate-800/80 shadow-xl">
        <h2 className="text-xl font-black text-white mb-1">
          {dict.result.title}
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          {dict.result.readingLabel}: Recorded at community health screening
        </p>

        {/* Reading Gauge Card */}
        <div className="bg-[#10141d] rounded-2xl p-4 border border-slate-800 mb-5">
          <div className="flex items-center justify-around text-center mb-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Systolic
              </p>
              <p className="text-4xl font-black text-rose-500">{systolic}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">mmHg</p>
            </div>
            <div className="text-3xl font-light text-slate-600">/</div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Diastolic
              </p>
              <p className="text-4xl font-black text-rose-500">{diastolic}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">mmHg</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-[#151a24] p-3 rounded-xl border border-slate-800/80">
            <div>
              <p className="font-bold text-white">Top number</p>
              <p className="text-slate-400 leading-snug">
                Pressure when your heart beats
              </p>
            </div>
            <div>
              <p className="font-bold text-white">Bottom number</p>
              <p className="text-slate-400 leading-snug">
                Pressure when your heart rests
              </p>
            </div>
          </div>
        </div>

        {/* What does this mean */}
        <div className="bg-[#121c2e] border border-blue-900/50 rounded-2xl p-4 text-blue-100 mb-5">
          <div className="flex items-start gap-2.5">
            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-blue-200 mb-1">
                {dict.result.whatItMeans}
              </h4>
              <p className="text-xs leading-relaxed text-blue-100/80">
                {dict.result.whatItMeansBody}
              </p>
            </div>
          </div>
        </div>

        {/* Clinical Disclaimer */}
        <div className="p-3 bg-amber-950/40 rounded-2xl border border-amber-900/60 mb-5 text-[11px] text-amber-200 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="leading-relaxed font-medium">
            {dict.result.guidelineDisclaimer}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-6">
          <h4 className="font-bold text-sm text-white">
            {dict.result.nextStepsHeader}
          </h4>
          <div className="flex items-start gap-3 text-xs text-slate-300">
            <div className="w-5 h-5 rounded-full bg-[#d4f933] text-black font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
              1
            </div>
            <p className="pt-0.5 leading-snug">{dict.result.nextStep1}</p>
          </div>
          <div className="flex items-start gap-3 text-xs text-slate-300">
            <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
              2
            </div>
            <p className="pt-0.5 leading-snug">{dict.result.nextStep2}</p>
          </div>
          <div className="flex items-start gap-3 text-xs text-slate-300">
            <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
              3
            </div>
            <p className="pt-0.5 leading-snug">{dict.result.nextStep3}</p>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => setActiveView('acknowledge')}
          className="w-full py-4 bg-[#d4f933] hover:bg-[#c2e825] text-black font-extrabold rounded-2xl text-base transition flex items-center justify-center gap-2 shadow-lg active:scale-[0.99]"
        >
          <span>Continue to Acknowledge</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
