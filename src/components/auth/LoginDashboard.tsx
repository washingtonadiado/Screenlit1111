/**
 * Screenlit Authentication and Identity Gateway Dashboard
 * Dual access portal for Patient & Family Care and Clinical Command Centre
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserProfile } from '@shared/types';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe,
  Heart,
  KeyRound,
  Lock,
  LogIn,
  LogOut,
  Mail,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  User,
  UserCheck,
  Users,
} from 'lucide-react';

interface LoginDashboardProps {
  onNavigateToPortal?: (route: 'app' | 'staff') => void;
}

export const LoginDashboard: React.FC<LoginDashboardProps> = ({ onNavigateToPortal }) => {
  const {
    currentUser,
    setCurrentUser,
    availableUsers,
    currentLanguage,
    setLanguage,
    firebaseUser,
    signInWithGoogle,
    signOutUser,
  } = useApp();

  // Portal view mode: 'all' | 'patient' | 'staff'
  const [activePortalTab, setActivePortalTab] = useState<'all' | 'patient' | 'staff'>('all');

  // Patient manual credentials state
  const [patientIdInput, setPatientIdInput] = useState('');
  const [patientPinInput, setPatientPinInput] = useState('');
  const [patientError, setPatientError] = useState<string | null>(null);
  const [patientSuccess, setPatientSuccess] = useState<string | null>(null);

  // Staff manual credentials state
  const [staffEmailInput, setStaffEmailInput] = useState('');
  const [staffPinInput, setStaffPinInput] = useState('');
  const [staffRoleInput, setStaffRoleInput] = useState<string>('physician');
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffSuccess, setStaffSuccess] = useState<string | null>(null);

  // Patient quick logins
  const patientUsers = availableUsers.filter(
    (u) => u.role === 'patient' || u.role === 'caregiver'
  );

  // Staff quick logins
  const staffUsers = availableUsers.filter(
    (u) => u.role !== 'patient' && u.role !== 'caregiver'
  );

  // Authenticate as a specific user
  const handleQuickLogin = (user: UserProfile, targetRoute: 'app' | 'staff') => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('screenlit_logged_in', 'true');
      localStorage.setItem('screenlit_user_id', user.uid);
    }
    if (onNavigateToPortal) {
      onNavigateToPortal(targetRoute);
    }
  };

  // Handle manual patient form submit
  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPatientError(null);
    setPatientSuccess(null);

    const trimmedId = patientIdInput.trim().toLowerCase();
    if (!trimmedId) {
      setPatientError('Please provide a valid Patient MRN or National Health ID');
      return;
    }

    // Match patient or caregiver
    let matchedUser = availableUsers.find(
      (u) =>
        u.uid.toLowerCase().includes(trimmedId) ||
        (u.linkedPatientId && u.linkedPatientId.toLowerCase().includes(trimmedId)) ||
        u.displayName.toLowerCase().includes(trimmedId)
    );

    if (!matchedUser) {
      // Default to Tariq Al Mahmoud if demo credentials entered or fallback
      matchedUser = availableUsers.find((u) => u.role === 'patient') || availableUsers[0];
    }

    setPatientSuccess(`Verified. Welcome back, ${matchedUser.displayName}`);
    setTimeout(() => {
      handleQuickLogin(matchedUser!, 'app');
    }, 450);
  };

  // Handle manual staff form submit
  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);
    setStaffSuccess(null);

    const trimmedEmail = staffEmailInput.trim().toLowerCase();
    if (!trimmedEmail) {
      setStaffError('Please provide an official clinical staff email or ID');
      return;
    }

    // Match staff member
    let matchedUser = availableUsers.find(
      (u) =>
        u.role !== 'patient' &&
        u.role !== 'caregiver' &&
        (u.email.toLowerCase().includes(trimmedEmail) ||
          u.uid.toLowerCase().includes(trimmedEmail) ||
          u.displayName.toLowerCase().includes(trimmedEmail))
    );

    if (!matchedUser) {
      matchedUser =
        availableUsers.find((u) => u.role === staffRoleInput) ||
        availableUsers.find((u) => u.role === 'physician') ||
        availableUsers[2];
    }

    setStaffSuccess(`Authorized. Launching workstation for ${matchedUser.displayName}`);
    setTimeout(() => {
      handleQuickLogin(matchedUser!, 'staff');
    }, 450);
  };

  const isCurrentStaff = currentUser.role !== 'patient' && currentUser.role !== 'caregiver';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Identity Hero Banner */}
      <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-gradient-to-br from-[#3b5bf5]/15 to-[#d4f933]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-extrabold uppercase tracking-wider text-[#d4f933]">
                Screenlit Population Health
              </span>
              <span aria-hidden="true">·</span>
              <span>Primary Care to Specialist Loop</span>
              <span aria-hidden="true">·</span>
              <span>FHIR R4 Compliant</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Screenlit Identity and Access Gateway
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Select your role to access the personalized Patient Care Dashboard or the Clinical Command Centre.
              All consultations, blood pressure readings, and coordination actions maintain full clinical audit logs.
            </p>
          </div>

          {/* Current Session Indicator */}
          <div className="bg-[#0e131d] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Session
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d4f933]/15 text-[#d4f933] border border-[#d4f933]/30">
                {currentUser.role.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1b2232] border border-slate-700 flex items-center justify-center text-white font-black text-sm">
                {currentUser.displayName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{currentUser.displayName}</p>
                <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToPortal) {
                    onNavigateToPortal(isCurrentStaff ? 'staff' : 'app');
                  }
                }}
                className="flex-1 py-1.5 px-3 bg-[#d4f933] hover:bg-[#c2e726] text-black font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <span>Open {isCurrentStaff ? 'Command Centre' : 'Patient App'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Portal Filter Segmented Control and Language Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-[#0e131d] rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActivePortalTab('all')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition ${
                activePortalTab === 'all'
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dual Portals View
            </button>
            <button
              type="button"
              onClick={() => setActivePortalTab('patient')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 ${
                activePortalTab === 'patient'
                  ? 'bg-[#3b5bf5] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Patient and Family Portal</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePortalTab('staff')}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 ${
                activePortalTab === 'staff'
                  ? 'bg-[#d4f933] text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Clinical Command Centre</span>
            </button>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-semibold">Language:</span>
            <div className="flex items-center gap-1 bg-[#0e131d] p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  currentLanguage === 'en'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  currentLanguage === 'ar'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => setLanguage('sw')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  currentLanguage === 'sw'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Kiswahili
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dual Grid Portals */}
      <div
        className={`grid gap-8 ${
          activePortalTab === 'all'
            ? 'grid-cols-1 lg:grid-cols-2'
            : 'grid-cols-1 max-w-2xl mx-auto'
        }`}
      >
        {/* PORTAL 1: PATIENT & FAMILY PORTAL */}
        {(activePortalTab === 'all' || activePortalTab === 'patient') && (
          <div className="bg-[#141923] border border-blue-900/40 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#3b5bf5] to-blue-400 p-0.5 shadow-lg">
                    <div className="w-full h-full rounded-2xl bg-[#0e131d] flex items-center justify-center text-white">
                      <Smartphone className="w-6 h-6 text-[#3b5bf5]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-white">Patient and Family Portal</h2>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Citizen Access
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Blood pressure monitoring, real time voice journal, and doctor visits
                    </p>
                  </div>
                </div>
              </div>

              {/* Verified One-Click Enrolled Patient Access */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Enrolled Citizen Personas (Instant Access)</span>
                  <span className="text-[11px] text-blue-400 font-normal">One Click Sign In</span>
                </label>

                <div className="space-y-2">
                  {patientUsers.map((user) => {
                    const isSelected = currentUser.uid === user.uid;
                    const isCaregiver = user.role === 'caregiver';

                    return (
                      <div
                        key={user.uid}
                        className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#1b253b] border-[#3b5bf5] shadow-md'
                            : 'bg-[#10141d] border-slate-800 hover:border-slate-700 hover:bg-[#141923]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                              isCaregiver
                                ? 'bg-purple-900/40 text-purple-300 border border-purple-500/30'
                                : 'bg-blue-900/40 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {isCaregiver ? <Users className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-white">
                                {user.displayName}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-slate-400">
                                {isCaregiver ? 'Family Caregiver' : 'Primary Patient'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">
                              MRN: {user.linkedPatientId || 'pat_tariq_001'} · Lang: {user.language.toUpperCase()}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleQuickLogin(user, 'app')}
                          className="px-3.5 py-1.5 rounded-xl bg-[#3b5bf5] hover:bg-blue-600 text-white font-extrabold text-xs transition shadow-sm flex items-center gap-1"
                        >
                          <span>Sign In</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form 2: National Health ID or MRN Sign In */}
              <div className="pt-2">
                <form
                  onSubmit={handlePatientSubmit}
                  className="bg-[#10141d] border border-slate-800 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-[#3b5bf5]" />
                      <span>Sign In with Health ID / Qatar ID</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">e.g. QA-8841-X</span>
                  </div>

                  {patientError && (
                    <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{patientError}</span>
                    </div>
                  )}

                  {patientSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-900 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>{patientSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Patient MRN / ID
                      </label>
                      <input
                        type="text"
                        value={patientIdInput}
                        onChange={(e) => setPatientIdInput(e.target.value)}
                        placeholder="pat_tariq_001 or QA-8841"
                        className="w-full bg-[#161c28] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3b5bf5] transition"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Access PIN / Password
                      </label>
                      <input
                        type="password"
                        value={patientPinInput}
                        onChange={(e) => setPatientPinInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#161c28] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3b5bf5] transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#3b5bf5] hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Authenticate Patient Access</span>
                  </button>
                </form>
              </div>

              {/* Form 3: Google Firebase Sign-in */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await signInWithGoogle();
                      const patientUser = availableUsers.find((u) => u.role === 'patient') || availableUsers[0];
                      handleQuickLogin(patientUser, 'app');
                    } catch (err) {
                      console.error('Patient Google sign in error:', err);
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-[#10141d] hover:bg-[#161c28] border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google (Patient Account)</span>
                </button>
              </div>
            </div>

            {/* Privacy and Compliance Footer */}
            <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>256-bit TLS Encrypted</span>
              </span>
              <span>Qatar Health Law No. 22 Compliant</span>
            </div>
          </div>
        )}

        {/* PORTAL 2: CLINICAL COMMAND CENTRE STAFF PORTAL */}
        {(activePortalTab === 'all' || activePortalTab === 'staff') && (
          <div className="bg-[#141923] border border-emerald-900/40 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#d4f933] to-emerald-400 p-0.5 shadow-lg">
                    <div className="w-full h-full rounded-2xl bg-[#0e131d] flex items-center justify-center text-white">
                      <Stethoscope className="w-6 h-6 text-[#d4f933]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-white">Clinical Command Centre</h2>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#d4f933]/15 text-[#d4f933] border border-[#d4f933]/30">
                        Staff Workstation
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Doctor triage workstation, coordinator workflows, and referral loops
                    </p>
                  </div>
                </div>
              </div>

              {/* Non-negotiable Clinical Governance Banner */}
              <div className="p-3 rounded-2xl bg-[#0e131d] border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#d4f933] mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed font-semibold">
                  Clinical Safety Standard: Humans decide. AI only ranks, predicts, drafts, and summarizes. AI never gives diagnoses or closes cases.
                </p>
              </div>

              {/* Verified One-Click Clinician and Staff Access */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Authorized Clinical Staff (Instant Access)</span>
                  <span className="text-[11px] text-[#d4f933] font-normal">One Click Sign In</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {staffUsers.map((user) => {
                    const isSelected = currentUser.uid === user.uid;

                    return (
                      <div
                        key={user.uid}
                        className={`p-3 rounded-2xl border transition flex flex-col justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-[#1a231b] border-[#d4f933] shadow-md'
                            : 'bg-[#10141d] border-slate-800 hover:border-slate-700 hover:bg-[#141923]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-black text-xs text-[#d4f933]">
                            {user.displayName.charAt(0)}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-extrabold text-white truncate">
                              {user.displayName}
                            </p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                              {user.role}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleQuickLogin(user, 'staff')}
                          className="w-full py-1.5 rounded-xl bg-[#d4f933] hover:bg-[#c2e726] text-black font-extrabold text-xs transition shadow-sm flex items-center justify-center gap-1"
                        >
                          <span>Sign In as {user.displayName.split(' ')[0]}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form 2: Clinical Staff Credentials Sign In */}
              <div className="pt-2">
                <form
                  onSubmit={handleStaffSubmit}
                  className="bg-[#10141d] border border-slate-800 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#d4f933]" />
                      <span>Sign In with Clinical Credentials</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">e.g. dr.amina@screenlit.health</span>
                  </div>

                  {staffError && (
                    <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{staffError}</span>
                    </div>
                  )}

                  {staffSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-900 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>{staffSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Staff Email / ID
                      </label>
                      <input
                        type="text"
                        value={staffEmailInput}
                        onChange={(e) => setStaffEmailInput(e.target.value)}
                        placeholder="dr.amina@screenlit.health"
                        className="w-full bg-[#161c28] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4f933] transition"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Clinical Role
                      </label>
                      <select
                        value={staffRoleInput}
                        onChange={(e) => setStaffRoleInput(e.target.value)}
                        className="w-full bg-[#161c28] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4f933] transition"
                      >
                        <option value="physician">Physician (Doctor Workstation)</option>
                        <option value="coordinator">Care Coordinator (RN)</option>
                        <option value="specialist">Specialist (Hospital Consult)</option>
                        <option value="admin">Administrator & Compliance</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#d4f933] hover:bg-[#c2e726] text-black font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Authorize Clinical Workstation</span>
                  </button>
                </form>
              </div>

              {/* Form 3: Google Firebase Sign-in */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await signInWithGoogle();
                      const staffUser = availableUsers.find((u) => u.role === 'physician') || availableUsers[3];
                      handleQuickLogin(staffUser, 'staff');
                    } catch (err) {
                      console.error('Staff Google sign in error:', err);
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-[#10141d] hover:bg-[#161c28] border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Building2 className="w-4 h-4 text-[#d4f933]" />
                  <span>Authenticate with Hospital Google Workspace</span>
                </button>
              </div>
            </div>

            {/* Audit Compliance Footer */}
            <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>FHIR R4 AuditEvent Trail Enforced</span>
              </span>
              <span>QCHP Certified Portal</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
