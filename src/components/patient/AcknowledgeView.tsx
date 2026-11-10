/**
 * Screenlit Patient Acknowledgment with Understanding Check
 * Enforces comprehension check before recording patient acknowledgement on case in dark mode
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

export const AcknowledgeView: React.FC = () => {
  const { dict, transitionCase, setActiveView } = useApp();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSelect = (index: number) => {
    setSelectedOption(index);
    if (index === 2) {
      setShowError(false);
    } else {
      setShowError(true);
    }
  };

  const handleConfirm = async () => {
    if (selectedOption !== 2) {
      setShowError(true);
      return;
    }

    setIsSubmitting(true);
    const result = await transitionCase(
      'Acknowledged',
      'Patient successfully passed understanding check and confirmed result receipt',
      {
        patientAcknowledgedAt: new Date().toISOString(),
      }
    );
    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        setActiveView('home');
      }, 2000);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-[#151a24] rounded-3xl p-8 border border-slate-800 shadow-xl text-center space-y-4 text-white">
        <div className="w-16 h-16 bg-[#d4f933]/20 text-[#d4f933] rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-black text-white">
          Receipt Confirmed
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
          Your acknowledgement has been recorded on your clinical case. Our care
          coordinator has been notified to guide your next steps.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-white">
      {/* Back button */}
      <button
        type="button"
        onClick={() => setActiveView('result')}
        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Result</span>
      </button>

      <div className="bg-[#151a24] rounded-3xl p-5 border border-slate-800/80 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-[#d4f933]" />
          <h2 className="text-lg font-black text-white">
            {dict.ack.title}
          </h2>
        </div>

        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          To ensure your safety and mutual understanding, please answer this quick
          question before confirming.
        </p>

        {/* 1 Question Understanding Check Gate */}
        <div className="bg-[#10141d] rounded-2xl p-4 border border-slate-800 mb-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-2">
            <HelpCircle className="w-4 h-4 text-[#d4f933]" />
            <span>{dict.ack.questionPrompt}</span>
          </div>

          <p className="text-sm font-semibold text-white mb-4">
            {dict.ack.question}
          </p>

          <div className="space-y-2.5">
            {/* Option 1 */}
            <button
              type="button"
              onClick={() => handleSelect(1)}
              className={`w-full p-3.5 rounded-2xl border text-left text-xs font-medium transition flex items-center justify-between ${
                selectedOption === 1
                  ? 'bg-rose-950/40 border-rose-500/80 text-rose-200'
                  : 'bg-[#151a24] border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <span>{dict.ack.opt1}</span>
              <span className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center">
                {selectedOption === 1 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                )}
              </span>
            </button>

            {/* Option 2 (Correct) */}
            <button
              type="button"
              onClick={() => handleSelect(2)}
              className={`w-full p-3.5 rounded-2xl border text-left text-xs font-medium transition flex items-center justify-between ${
                selectedOption === 2
                  ? 'bg-[#d4f933]/15 border-[#d4f933] text-white shadow-md'
                  : 'bg-[#151a24] border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <span>{dict.ack.opt2}</span>
              <span className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center">
                {selectedOption === 2 && (
                  <span className="w-2 h-2 rounded-full bg-[#d4f933]" />
                )}
              </span>
            </button>

            {/* Option 3 */}
            <button
              type="button"
              onClick={() => handleSelect(3)}
              className={`w-full p-3.5 rounded-2xl border text-left text-xs font-medium transition flex items-center justify-between ${
                selectedOption === 3
                  ? 'bg-rose-950/40 border-rose-500/80 text-rose-200'
                  : 'bg-[#151a24] border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <span>{dict.ack.opt3}</span>
              <span className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center">
                {selectedOption === 3 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                )}
              </span>
            </button>
          </div>

          {showError && selectedOption !== 2 && (
            <div className="mt-3 p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="leading-snug">
                That is not quite right. A single elevated reading requires a repeat
                confirmation reading and consultation with a clinical provider.
              </p>
            </div>
          )}
        </div>

        {/* Confirmation Button */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={selectedOption !== 2 || isSubmitting}
          className={`w-full py-4 font-extrabold rounded-2xl text-base transition flex items-center justify-center gap-2 shadow-lg ${
            selectedOption === 2 && !isSubmitting
              ? 'bg-[#d4f933] hover:bg-[#c2e825] text-black active:scale-[0.99] cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
          }`}
        >
          <span>
            {isSubmitting ? 'Recording Acknowledgement...' : dict.ack.confirmButton}
          </span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
