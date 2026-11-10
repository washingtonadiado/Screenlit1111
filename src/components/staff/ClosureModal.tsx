/**
 * Screenlit Case Closure Modal with Evidence Verification Checklist
 * Requires treatment initiation, patient acknowledgement, controlled readings, and clinician electronic signature
 */

import React, { useState } from 'react';
import { CaseDocument, Role } from '@shared/types';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  PenTool,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';

interface ClosureModalProps {
  caseDoc: CaseDocument;
  onClose: () => void;
  onSuccess: () => void;
  currentRole: Role;
  currentUid: string;
}

export const ClosureModal: React.FC<ClosureModalProps> = ({
  caseDoc,
  onClose,
  onSuccess,
  currentRole,
  currentUid,
}) => {
  const [signerName, setSignerName] = useState('Dr. Amina Al Mansoor');
  const [clinicalNote, setClinicalNote] = useState(
    'Blood pressure confirmed controlled under 140/90 mmHg over 14 day surveillance window on Amlodipine 5mg. Patient education completed. Documented closure approved.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasAck = !!caseDoc.evidence?.patientAcknowledgedAt;
  const hasTx = !!caseDoc.evidence?.treatmentStartedAt;
  const controlledCount = caseDoc.evidence?.controlledReadingsCount || 0;
  const requiredCount =
    caseDoc.evidence?.surveillanceReadingsRequired || 3;
  const hasReadings = controlledCount >= requiredCount;
  const isClinician =
    currentRole === 'physician' ||
    currentRole === 'specialist' ||
    currentRole === 'admin';

  const allPrerequisitesMet =
    hasAck && hasTx && hasReadings && isClinician && signerName.trim().length > 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/cases/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: caseDoc.id,
          targetState: 'Closed',
          actorUid: currentUid,
          actorRole: currentRole,
          reason: `Documented clinical closure approved by ${signerName}`,
          evidenceUpdates: {
            clinicianSignature: {
              signerUid: currentUid,
              signerName,
              signerRole: currentRole,
              signedAt: new Date().toISOString(),
              clinicalNote,
            },
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(data.error || 'Closure rejected by server validation guard');
      }
    } catch (err) {
      setErrorMessage('Failed to connect to case coordination server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#141923] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-800 text-white">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Documented Case Closure
              </h3>
              <p className="text-xs text-slate-400">Case ID: {caseDoc.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Mandatory Clinical Evidence Checklist
          </h4>

          <div className="space-y-2 bg-[#10141d] p-4 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-300">
                1. Patient Result Acknowledgement on Record
              </span>
              {hasAck ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-rose-400">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  Missing
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-300">
                2. Treatment Initiation Documented
              </span>
              {hasTx ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Documented
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-rose-400">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  Missing
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-300">
                3. Surveillance Controlled Readings ({controlledCount} of{' '}
                {requiredCount} readings under 140 over 90)
              </span>
              {hasReadings ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Sufficient
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  {controlledCount} of {requiredCount} Readings
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-300">
                4. Signer Role Authorization (Physician, Specialist, or Admin)
              </span>
              {isClinician ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Authorized ({currentRole})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-rose-400">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  Unauthorized ({currentRole})
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Clinician Electronic Signature Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Full Name and Title"
                className="w-full text-xs font-semibold p-3 ps-9 bg-[#10141d] border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-[#d4f933] transition"
                required
              />
              <PenTool className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Clinical Justification Note
            </label>
            <textarea
              rows={3}
              value={clinicalNote}
              onChange={(e) => setClinicalNote(e.target.value)}
              className="w-full text-xs p-3 bg-[#10141d] border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-[#d4f933] transition leading-relaxed"
              required
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs rounded-2xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
              <p className="leading-snug font-medium">{errorMessage}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-800 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-2xl text-black font-extrabold text-xs transition flex items-center gap-1.5 shadow-lg ${
                allPrerequisitesMet && !isSubmitting
                  ? 'bg-[#d4f933] hover:bg-[#c2e825] active:scale-[0.99]'
                  : 'bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              {isSubmitting ? 'Verifying Evidence...' : 'Submit Documented Closure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
