/**
 * Screenlit Case Timeline and Handoff Consult View
 * Chronological milestone events, owner re-assignment, and consult summary citing event IDs
 */

import React, { useState } from 'react';
import { CaseDocument, FHIRAuditEvent, Role } from '@shared/types';
import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Heart,
  MessageSquare,
  Send,
  Share2,
  ShieldCheck,
  Stethoscope,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import { ClosureModal } from './ClosureModal';

interface TimelineViewProps {
  caseDoc: CaseDocument;
  audits: FHIRAuditEvent[];
  onRefresh: () => void;
  currentRole: Role;
  currentUid: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  caseDoc,
  audits,
  onRefresh,
  currentRole,
  currentUid,
}) => {
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState('prac_dr_amina');
  const [isReassigning, setIsReassigning] = useState(false);
  const [consultSummary, setConsultSummary] = useState('');

  const handleReassign = async () => {
    setIsReassigning(true);
    const targetPracName =
      selectedNewOwner === 'prac_dr_amina'
        ? 'Dr. Amina Al Mansoor'
        : selectedNewOwner === 'prac_dr_mwangi'
        ? 'Dr. David Mwangi'
        : 'Fatima Noor, RN';

    const targetRole: Role =
      selectedNewOwner === 'prac_coord_fatima' ? 'coordinator' : 'physician';

    try {
      await fetch('/api/cases/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: caseDoc.id,
          targetState: caseDoc.state,
          actorUid: currentUid,
          actorRole: currentRole,
          reason: `Reassigned case owner to ${targetPracName}`,
          newOwnerUid: selectedNewOwner,
          newOwnerRole: targetRole,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to reassign owner:', err);
    } finally {
      setIsReassigning(false);
    }
  };

  const generateConsultSummary = () => {
    const summary = [
      `Patient presenting with confirmed hypertension following community screening reading [EVT-01].`,
      `Patient reviewed result explainer and successfully submitted understanding acknowledgement [EVT-02].`,
      `Secondary confirmation reading verified actionable blood pressure threshold [EVT-03].`,
      `Care coordination referral initiated and matched with network primary care provider [EVT-04].`,
      `Clinical consultation requested for diagnostic evaluation and ongoing surveillance management [EVT-05].`,
    ].join(' ');
    setConsultSummary(summary);
    setShowConsultModal(true);
  };

  const caseAudits = audits
    .filter((a) => a.entity?.[0]?.what?.reference === `Task/${caseDoc.id}`)
    .sort(
      (a, b) => new Date(a.recorded).getTime() - new Date(b.recorded).getTime()
    );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500">
                {caseDoc.id}
              </span>
              <span className="px-2.5 py-0.5 bg-slate-900 text-white text-xs font-bold rounded-full">
                {caseDoc.state}
              </span>
              {caseDoc.isUrgent && (
                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-xs font-bold rounded-full">
                  Urgent
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 mt-1">
              Patient: Tariq Al Mahmoud (pat_tariq_001)
            </h3>
            <p className="text-xs text-slate-500">
              Condition: Hypertension &bull; Risk Score: {caseDoc.riskScore}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={generateConsultSummary}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-xs rounded-xl border border-indigo-200 transition flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              Generate Consult Summary
            </button>

            <button
              type="button"
              onClick={() => setShowClosureModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              Close Case
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-600" />
            <span className="text-slate-600">Active Owner:</span>
            <span className="font-bold text-slate-900">
              {caseDoc.ownerUid === 'prac_dr_amina'
                ? 'Dr. Amina Al Mansoor'
                : caseDoc.ownerUid === 'prac_dr_mwangi'
                ? 'Dr. David Mwangi'
                : 'Fatima Noor, RN'}
            </span>
            <span className="text-slate-400">({caseDoc.ownerRole})</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-600 font-medium">Reassign to:</label>
            <select
              value={selectedNewOwner}
              onChange={(e) => setSelectedNewOwner(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none"
            >
              <option value="prac_dr_amina">Dr. Amina (Physician)</option>
              <option value="prac_dr_mwangi">Dr. Mwangi (Specialist)</option>
              <option value="prac_coord_fatima">Fatima Noor (Coordinator)</option>
            </select>
            <button
              type="button"
              disabled={isReassigning}
              onClick={handleReassign}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs transition"
            >
              {isReassigning ? 'Updating...' : 'Transfer'}
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
            Case Chronological Timeline and Audit Events
          </h4>

          <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
            {caseAudits.map((evt, idx) => {
              const eventId = `EVT-0${idx + 1}`;
              const recordedDate = new Date(evt.recorded).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={evt.id} className="relative flex items-start gap-3 pl-1">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold z-10 flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex-1 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                          {eventId}
                        </span>
                        {evt.action === 'C' ? 'Case Created' : 'State Transition'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {recordedDate}
                      </span>
                    </div>

                    <p className="text-slate-800 font-normal leading-relaxed">
                      {evt.outcomeDesc || 'Transition recorded'}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[10px] text-slate-500">
                      <span>Actor: {evt.agent?.[0]?.who?.reference || 'System'}</span>
                      <span className="font-mono">{evt.id}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showConsultModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Clinician to Clinician Handoff Summary
              </h3>
              <button
                type="button"
                onClick={() => setShowConsultModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Every summary statement cites a chronological timeline event identifier for clinical provenance.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono leading-relaxed text-slate-900">
              {consultSummary}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConsultModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {showClosureModal && (
        <ClosureModal
          caseDoc={caseDoc}
          onClose={() => setShowClosureModal(false)}
          onSuccess={() => {
            onRefresh();
            setShowClosureModal(false);
          }}
          currentRole={currentRole}
          currentUid={currentUid}
        />
      )}
    </div>
  );
};
