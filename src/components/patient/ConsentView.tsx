/**
 * Screenlit Patient Consent and Caregiver Delegation Management View
 * Allows patients to inspect and control data sharing per healthcare organization and revoke caregiver access in dark mode
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  Lock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserMinus,
  Users,
  X,
} from 'lucide-react';

export const ConsentView: React.FC = () => {
  const {
    dict,
    consents,
    toggleConsent,
    caregiverRevoked,
    revokeCaregiver,
    setActiveView,
  } = useApp();
  const [revokedBanner, setRevokedBanner] = useState(false);

  const handleRevoke = () => {
    revokeCaregiver();
    setRevokedBanner(true);
  };

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
            {dict.consent.title}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {dict.consent.subtitle}
          </p>
        </div>

        <div className="bg-[#10141d] border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#d4f933] mt-0.5 flex-shrink-0" />
          <p className="leading-relaxed">
            Screenlit operates on patient sovereign consent. Clinical providers
            can only view your screening and surveillance records when you grant
            active permission.
          </p>
        </div>

        <div className="space-y-3 pt-1">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
            {dict.consent.activeProviders}
          </h3>

          <div className="space-y-2.5">
            {consents.map((c) => {
              const orgName =
                c.organization?.[0]?.display || 'Health Provider';
              const orgRef = c.organization?.[0]?.reference || '';
              const orgId = orgRef.replace('Organization/', '');
              const isPermitted = c.status === 'active';

              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                    isPermitted
                      ? 'bg-[#181f2c] border-slate-700/80'
                      : 'bg-[#10141d] border-slate-800/60 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isPermitted
                          ? 'bg-blue-500/20 text-[#d4f933] border border-blue-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{orgName}</p>
                      <p className="text-[11px] text-slate-400">
                        {c.scope?.text || 'Care Coordination'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleConsent(orgId)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                      isPermitted
                        ? 'bg-[#d4f933] hover:bg-[#c2e825] text-black shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isPermitted ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        {dict.consent.togglePermit}
                      </>
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5" />
                        {dict.consent.toggleDeny}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Caregiver Delegation */}
      <div className="bg-[#151a24] rounded-3xl p-5 border border-slate-800/80 shadow-xl space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white">
            {dict.consent.caregiverTitle}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {dict.consent.caregiverSubtitle}
          </p>
        </div>

        {caregiverRevoked ? (
          <div className="p-4 bg-[#10141d] border border-slate-800 rounded-2xl text-center space-y-2">
            <div className="w-10 h-10 bg-slate-800 text-slate-500 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-white">
              No Active Caregiver Delegation
            </p>
            <p className="text-[11px] text-slate-400">
              {dict.consent.caregiverRevokedAlert}
            </p>
          </div>
        ) : (
          <div className="p-4 bg-[#191a2e] border border-purple-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                  ZA
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    Zainab Al Mahmoud
                  </p>
                  <p className="text-xs text-purple-300 font-medium">
                    Family Caregiver (Daughter)
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 bg-purple-900/60 text-purple-200 text-[11px] font-bold rounded-full border border-purple-700/60">
                Active Delegation
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Zainab has permission to review screening results, log blood
              pressure readings, and receive clinic reminders on your behalf.
            </p>

            <button
              type="button"
              onClick={handleRevoke}
              className="w-full py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs rounded-xl border border-rose-800/60 transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <UserMinus className="w-4 h-4" />
              {dict.consent.revokeCaregiver}
            </button>
          </div>
        )}

        {revokedBanner && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 text-xs font-bold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {dict.consent.caregiverRevokedAlert}
          </div>
        )}
      </div>
    </div>
  );
};
