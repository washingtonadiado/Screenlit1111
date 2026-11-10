/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { PatientApp } from './components/patient/PatientApp';
import { CommandCentre } from './components/staff/CommandCentre';
import { LoginDashboard } from './components/auth/LoginDashboard';
import {
  ArrowRight,
  KeyRound,
  LogIn,
  LogOut,
  Shield,
  Smartphone,
  Stethoscope,
  User,
  Users,
} from 'lucide-react';

function AppContent() {
  const [route, setRoute] = useState<'app' | 'staff' | 'login'>('login');
  const { currentUser, setCurrentUser, availableUsers, firebaseUser, signInWithGoogle, signOutUser } = useApp();

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/staff')) {
      setRoute('staff');
    } else if (path.startsWith('/app')) {
      setRoute('app');
    } else if (path.startsWith('/login')) {
      setRoute('login');
    } else {
      // Check stored preference or default to login dashboard
      const hasStoredLogin = localStorage.getItem('screenlit_logged_in') === 'true';
      if (hasStoredLogin) {
        setRoute('app');
      } else {
        setRoute('login');
      }
    }
  }, []);

  const switchRoute = (newRoute: 'app' | 'staff' | 'login') => {
    setRoute(newRoute);
    const targetPath = newRoute === 'staff' ? '/staff' : newRoute === 'login' ? '/login' : '/app';
    window.history.pushState({}, '', targetPath);

    if (newRoute === 'staff' && (currentUser.role === 'patient' || currentUser.role === 'caregiver')) {
      const coordinatorUser = availableUsers.find((u) => u.role === 'coordinator');
      if (coordinatorUser) {
        setCurrentUser(coordinatorUser);
      }
    } else if (newRoute === 'app' && currentUser.role !== 'patient' && currentUser.role !== 'caregiver') {
      const patientUser = availableUsers.find((u) => u.role === 'patient');
      if (patientUser) {
        setCurrentUser(patientUser);
      }
    }
  };

  const isStaffRole = currentUser.role !== 'patient' && currentUser.role !== 'caregiver';

  return (
    <div className="min-h-screen bg-[#070a0f] flex flex-col font-sans text-slate-100">
      <div className="bg-[#0c1017] text-white px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40 shadow-sm border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => switchRoute('login')}
            className="flex items-center gap-2 hover:opacity-90 transition text-left"
          >
            <span className="font-extrabold tracking-wide uppercase text-[10px] bg-[#161c28] border border-slate-800 px-2 py-0.5 rounded-full text-[#d4f933]">
              Screenlit
            </span>
            <span className="text-slate-300 font-bold hidden sm:inline text-xs">
              Population Health to Care Loop
            </span>
          </button>
        </div>

        {/* Triple Portal Switcher Navigation */}
        <div className="flex items-center gap-1 bg-[#141923] p-1 rounded-full border border-slate-800">
          <button
            type="button"
            onClick={() => switchRoute('login')}
            className={`px-3 py-1 rounded-full font-bold text-xs transition flex items-center gap-1.5 ${
              route === 'login'
                ? 'bg-[#d4f933] text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Login Gateway</span>
          </button>

          <button
            type="button"
            onClick={() => switchRoute('app')}
            className={`px-3 py-1 rounded-full font-bold text-xs transition flex items-center gap-1.5 ${
              route === 'app'
                ? 'bg-[#3b5bf5] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Patient Portal</span>
          </button>

          <button
            type="button"
            onClick={() => switchRoute('staff')}
            className={`px-3 py-1 rounded-full font-bold text-xs transition flex items-center gap-1.5 ${
              route === 'staff'
                ? 'bg-[#d4f933] text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Command Centre</span>
          </button>
        </div>

        {/* Current User Session & Firebase Auth Status */}
        <div className="flex items-center gap-2">
          {/* Active User Persona Pill with Switch Action */}
          <button
            type="button"
            onClick={() => switchRoute('login')}
            className="flex items-center gap-2 bg-[#141923] hover:bg-[#1a2230] border border-slate-800 rounded-full px-2.5 py-1 text-xs text-slate-300 hover:text-white transition"
            title="Switch User on Login Dashboard"
          >
            <div className="w-4 h-4 rounded-full bg-[#1e2738] flex items-center justify-center text-[10px] font-bold text-[#d4f933]">
              {currentUser.displayName.charAt(0)}
            </div>
            <span className="font-semibold text-[11px] max-w-[120px] truncate hidden md:inline">
              {currentUser.displayName}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded font-mono uppercase">
              {currentUser.role}
            </span>
          </button>

          {/* Firebase Authentication Status */}
          {firebaseUser ? (
            <div className="flex items-center gap-1.5 bg-[#141923] border border-slate-800 rounded-full px-2 py-1 text-xs">
              {firebaseUser.photoURL ? (
                <img
                  src={firebaseUser.photoURL}
                  alt={firebaseUser.displayName || 'User'}
                  className="w-4 h-4 rounded-full"
                />
              ) : (
                <span className="w-4 h-4 rounded-full bg-[#3b5bf5] text-white flex items-center justify-center text-[9px] font-bold">
                  {firebaseUser.displayName?.[0] || 'U'}
                </span>
              )}
              <button
                type="button"
                onClick={signOutUser}
                className="text-slate-400 hover:text-rose-400 transition"
                title="Sign out of Firebase"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="bg-[#141923] hover:bg-[#1a2230] text-slate-300 hover:text-white border border-slate-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition"
              title="Sign in with Google Account"
            >
              <LogIn className="w-3.5 h-3.5 text-[#d4f933]" />
              <span className="hidden lg:inline text-[11px]">Google</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1">
        {route === 'login' && (
          <LoginDashboard onNavigateToPortal={(target) => switchRoute(target)} />
        )}
        {route === 'app' && <PatientApp />}
        {route === 'staff' && <CommandCentre />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
