/**
 * Screenlit Home Blood Pressure Reading Entry View
 * Large touch target inputs for home cuff observations with instant control feedback in dark mode
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Heart,
  Plus,
} from 'lucide-react';

export const HomeReadingEntryView: React.FC = () => {
  const {
    dict,
    submitObservation,
    observations,
    activeCase,
    transitionCase,
    setActiveView,
  } = useApp();
  const [systolic, setSystolic] = useState<string>('128');
  const [diastolic, setDiastolic] = useState<string>('82');
  const [pulse, setPulse] = useState<string>('72');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const numSys = parseInt(systolic, 10) || 0;
  const numDia = parseInt(diastolic, 10) || 0;

  const isControlled = numSys < 140 && numDia < 90 && numSys > 70 && numDia > 40;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numSys || !numDia) return;

    setIsSaving(true);
    await submitObservation({
      systolic: numSys,
      diastolic: numDia,
      noteText: notes ? `${notes} (Pulse: ${pulse} bpm)` : `Pulse: ${pulse} bpm`,
    });

    if (
      activeCase &&
      (activeCase.state === 'TreatmentStarted' ||
        activeCase.state === 'Surveillance')
    ) {
      const currentControlled = activeCase.evidence?.controlledReadingsCount || 0;
      if (isControlled) {
        await transitionCase(
          activeCase.state,
          `Logged controlled surveillance reading: ${numSys}/${numDia} mmHg`,
          {
            controlledReadingsCount: currentControlled + 1,
          }
        );
      }
    } else if (activeCase && activeCase.state === 'ConfirmationPending') {
      await transitionCase(
        'Confirmed',
        `Repeat blood pressure reading logged: ${numSys}/${numDia} mmHg`
      );
    }

    setIsSaving(false);
    setFeedback(dict.reading.successAlert);
    setTimeout(() => setFeedback(null), 3000);
  };

  const bpObservations = observations.filter(
    (o) => o.code.coding?.[0]?.code === '85354-9'
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
            {dict.reading.title}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {dict.reading.subtitle}
          </p>
        </div>

        <div className="bg-[#121c2e] border border-blue-900/50 rounded-2xl p-3.5 text-xs text-blue-200 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="leading-relaxed font-medium">
            {dict.reading.cuffReminder}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {dict.reading.systolicLabel}
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="w-full text-center text-2xl font-black p-3.5 bg-[#10141d] border border-slate-800 rounded-2xl text-white focus:border-[#d4f933] focus:outline-none transition"
                  placeholder="120"
                />
                <span className="absolute right-3 bottom-4 text-[10px] text-slate-500 font-bold">
                  mmHg
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {dict.reading.diastolicLabel}
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="w-full text-center text-2xl font-black p-3.5 bg-[#10141d] border border-slate-800 rounded-2xl text-white focus:border-[#d4f933] focus:outline-none transition"
                  placeholder="80"
                />
                <span className="absolute right-3 bottom-4 text-[10px] text-slate-500 font-bold">
                  mmHg
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {dict.reading.pulseLabel}
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                className="w-full text-center text-lg font-bold p-3 bg-[#10141d] border border-slate-800 rounded-2xl text-white focus:border-[#d4f933] focus:outline-none transition"
                placeholder="72"
              />
              <span className="absolute right-3 bottom-3 text-[10px] text-slate-500 font-bold">
                bpm
              </span>
            </div>
          </div>

          <div
            className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
              isControlled
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {isControlled ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
              {isControlled
                ? 'Controlled Reading (Target under 140/90)'
                : 'Above Target Threshold'}
            </span>
            <span className="text-[11px] font-bold">
              {numSys}/{numDia}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSaving || !numSys || !numDia}
            className="w-full py-4 bg-[#d4f933] hover:bg-[#c2e825] text-black font-extrabold rounded-2xl text-base transition flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            {isSaving ? 'Saving...' : dict.reading.submitButton}
          </button>
        </form>

        {feedback && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 text-xs font-bold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {feedback}
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-[#151a24] rounded-3xl p-5 border border-slate-800/80 shadow-xl space-y-3">
        <h3 className="font-bold text-white text-sm flex items-center justify-between">
          <span>Recorded Blood Pressure History</span>
          <span className="text-xs text-slate-400 font-normal">
            {bpObservations.length} readings on file
          </span>
        </h3>

        <div className="divide-y divide-slate-800/80">
          {bpObservations.slice(0, 5).map((obs) => {
            const sys = obs.component?.[0]?.valueQuantity?.value || 0;
            const dia = obs.component?.[1]?.valueQuantity?.value || 0;
            const controlled = sys < 140 && dia < 90;
            const dateStr = obs.effectiveDateTime
              ? new Date(obs.effectiveDateTime).toLocaleDateString()
              : 'Recent';

            return (
              <div
                key={obs.id}
                className="py-3 flex items-center justify-between first:pt-1 last:pb-1"
              >
                <div>
                  <p className="text-base font-extrabold text-white">
                    {sys} / {dia}{' '}
                    <span className="text-xs font-normal text-slate-400">
                      mmHg
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {dateStr} &bull; {obs.note?.[0]?.text || 'Upper arm cuff'}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    controlled
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                      : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                  }`}
                >
                  {controlled ? 'Controlled' : 'Elevated'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
