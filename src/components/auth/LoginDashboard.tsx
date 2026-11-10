/**
 * Screenlit Authentication and Identity Gateway
 * Real email and password login and signup with Firebase Auth
 * Users decide. AI only ranks, predicts, drafts, and summarizes.
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Role, SupportedLanguage } from '@shared/types';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Globe,
  Lock,
  LogIn,
  LogOut,
  Mail,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  User,
  UserPlus,
} from 'lucide-react';

interface LoginDashboardProps {
  onNavigateToPortal?: (route: 'app' | 'staff') => void;
}

type AuthMode = 'login' | 'signup';

const ROLE_OPTIONS: Array<{
  value: Role;
  label: string;
  description: string;
  portal: 'app' | 'staff';
}> = [
  { value: 'patient', label: 'Patient', description: 'Blood pressure monitoring and care tracking', portal: 'app' },
  { value: 'caregiver', label: 'Family Caregiver', description: 'Delegated access for a family member', portal: 'app' },
  { value: 'coordinator', label: 'Care Coordinator (RN)', description: 'Queue management and patient outreach', portal: 'staff' },
  { value: 'physician', label: 'Physician', description: 'Clinical review and case closure', portal: 'staff' },
  { value: 'specialist', label: 'Specialist', description: 'Hospital consult and therapy adjustment', portal: 'staff' },
  { value: 'admin', label: 'Administrator', description: 'Security audit and threshold configuration', portal: 'staff' },
];

const LANGUAGE_OPTIONS: Array<{ value: SupportedLanguage; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
  { value: 'sw', label: 'Swahili' },
];

export const LoginDashboard: React.FC<LoginDashboardProps> = ({ onNavigateToPortal }) => {
  const {
    currentUser,
    currentLanguage,
    setLanguage,
    isAuthenticated,
    signUp,
    signIn,
    signInWithGoogle,
    signOutUser,
  } = useApp();

  const [mode, setMode] = useState<AuthMode>('login');

  // Shared form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Signup only state
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('patient');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');

  const isCurrentStaff =
    currentUser.role !== 'patient' && currentUser.role !== 'caregiver';

  const navigateAfterAuth = (role: Role) => {
    const option = ROLE_OPTIONS.find((r) => r.value === role);
    const target = option ? option.portal : 'app';
    if (onNavigateToPortal) {
      onNavigateToPortal(target);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    const result = await signIn({ email: email.trim(), password });
    setSubmitting(false);

    if (result.success) {
      setSuccess('Authentication successful. Redirecting to your portal.');
      setTimeout(() => navigateAfterAuth(result.role || 'patient'), 400);
    } else {
      setError(result.error || 'Sign in failed. Please check your credentials.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!displayName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const result = await signUp({
      email: email.trim(),
      password,
      displayName: displayName.trim(),
      role: selectedRole,
      language: selectedLanguage,
    });
    setSubmitting(false);

    if (result.success) {
      setSuccess('Account created. Redirecting to your portal.');
      setTimeout(() => navigateAfterAuth(selectedRole), 400);
    } else {
      setError(result.error || 'Sign up failed. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign in error:', err);
      setError('Google sign in failed. Please try again.');
    }
  };

  const resetForm = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
    setSuccess(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
  };

  return (
    <div className="min-h-[calc(100vh-48px)] flex items-center justify-center px-4 py-8 relative">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#3b5bf5]/10 via-[#18233a]/8 to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="font-extrabold tracking-wide uppercase text-[11px] bg-[#161c28] border border-slate-800 px-3 py-1 rounded-full text-[#d4f933]">
              Screenlit
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {mode === 'login'
              ? 'Sign in to access your health coordination portal'
              : 'Join Screenlit to close the screening to care loop'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-2xl">
          {/* Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-[#0e131d] rounded-2xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-[#3b5bf5] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'bg-[#d4f933] text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-900 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-900 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full bg-[#10141d] border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3b5bf5] transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    autoComplete="current-password"
                    className="w-full bg-[#10141d] border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3b5bf5] transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#3b5bf5] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span className="animate-pulse">Signing in...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Signup Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                    className="w-full bg-[#10141d] border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#d4f933] transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full bg-[#10141d] border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#d4f933] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                    className="w-full bg-[#10141d] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#d4f933] transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Confirm
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    className="w-full bg-[#10141d] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#d4f933] transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Role
                </label>
                {/* Visual Role Picker — two columns */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Patient side */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-[#3b5bf5]" />
                      Patient Portal
                    </p>
                    {ROLE_OPTIONS.filter((r) => r.portal === 'app').map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedRole(opt.value)}
                        className={`w-full p-2.5 rounded-xl border text-left transition ${
                          selectedRole === opt.value
                            ? 'bg-[#1b253b] border-[#3b5bf5] text-white shadow-sm'
                            : 'bg-[#10141d] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <p className="text-xs font-bold leading-tight">{opt.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{opt.description}</p>
                      </button>
                    ))}
                  </div>
                  {/* Staff side */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-[#d4f933]" />
                      Command Centre
                    </p>
                    {ROLE_OPTIONS.filter((r) => r.portal === 'staff').map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedRole(opt.value)}
                        className={`w-full p-2.5 rounded-xl border text-left transition ${
                          selectedRole === opt.value
                            ? 'bg-[#1a231b] border-[#d4f933]/60 text-white shadow-sm'
                            : 'bg-[#10141d] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <p className="text-xs font-bold leading-tight">{opt.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{opt.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Portal destination indicator */}
                <div className={`mt-2 p-2 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 ${
                  ROLE_OPTIONS.find((r) => r.value === selectedRole)?.portal === 'app'
                    ? 'bg-[#3b5bf5]/10 text-[#3b5bf5] border border-[#3b5bf5]/20'
                    : 'bg-[#d4f933]/10 text-[#d4f933] border border-[#d4f933]/20'
                }`}>
                  {ROLE_OPTIONS.find((r) => r.value === selectedRole)?.portal === 'app'
                    ? <><Smartphone className="w-3.5 h-3.5" /> You will access the Patient Portal</>
                    : <><Stethoscope className="w-3.5 h-3.5" /> You will access the Clinical Command Centre</>
                  }
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Preferred Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) =>
                    setSelectedLanguage(e.target.value as SupportedLanguage)
                  }
                  className="w-full bg-[#10141d] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4f933] transition cursor-pointer"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#d4f933] hover:bg-[#c2e726] disabled:opacity-50 disabled:cursor-not-allowed text-black font-extrabold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span className="animate-pulse">Creating account...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[11px] text-slate-500 font-semibold">OR</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 bg-[#10141d] hover:bg-[#161c28] border border-slate-800 hover:border-slate-700 text-slate-200 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2.5 shadow-sm"
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
            <span>Continue with Google</span>
          </button>

          {/* Mode Switch Link */}
          <p className="text-center text-xs text-slate-400 mt-5">
            {mode === 'login' ? (
              <>
                New to Screenlit?{' '}
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[#3b5bf5] hover:text-blue-400 font-bold transition"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[#d4f933] hover:text-[#c2e726] font-bold transition"
                >
                  Sign in instead
                </button>
              </>
            )}
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex items-center justify-center gap-2 mt-5">
          <Globe className="w-4 h-4 text-slate-500" />
          <div className="flex items-center gap-1 bg-[#141923] p-1 rounded-xl border border-slate-800">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLanguage(opt.value)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  currentLanguage === opt.value
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Compliance Footer */}
        <div className="flex items-center justify-center gap-4 mt-5 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>FHIR R4 Compliant</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero Trust Access Control</span>
          </span>
        </div>

        {/* Resume Session for Already Authenticated Users */}
        {isAuthenticated && currentUser.uid && (
          <div className="mt-5 bg-[#141923] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3b5bf5] to-[#d4f933] p-0.5">
                <div className="w-full h-full rounded-xl bg-[#0e131d] flex items-center justify-center font-black text-sm text-white">
                  {currentUser.displayName.charAt(0)}
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-white truncate">
                  {currentUser.displayName}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {currentUser.email}
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#d4f933]/15 text-[#d4f933] border border-[#d4f933]/30">
                {currentUser.role}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigateAfterAuth(currentUser.role)}
                className="flex-1 py-2 bg-[#d4f933] hover:bg-[#c2e726] text-black font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <span>Open {isCurrentStaff ? 'Command Centre' : 'Patient App'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={signOutUser}
                className="py-2 px-3 bg-[#10141d] hover:bg-[#161c28] border border-slate-800 text-slate-300 hover:text-rose-400 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
