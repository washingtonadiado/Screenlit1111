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
  KeyRound,
  LogIn,
  LogOut,
  Smartphone,
  Stethoscope,
} from 'lucide-react';

function AppContent() {
  const [route, setRoute] = useState<'app' | 'staff' | 'login'>('login');
  const { currentUser, isAuthenticated, isLoadingAuth, firebaseUser, signInWithGoogle, signOutUser } = useApp();

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/staff')) {
      setRoute('staff');
    } else if (path.startsWith('/app')) {
      setRoute('app');
    } else if (path.startsWith('/login')) {
      setRoute('login');
    } else {
      setRoute('login');
    }
  }, []);

  // Force login route when not authenticated (skip during initial auth load)
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated && route !== 'login') {
      setRoute('login');
    }
  }, [isAuthenticated, isLoadingAuth, route]);

  const switchRoute = (newRoute: 'app' | 'staff' | 'login') => {
    if (!isAuthenticated && newRoute !== 'login') {
      setRoute('login');
      window.history.pushState({}, '', '/login');
      return;
    }
    setRoute(newRoute);
    const targetPath = newRoute === 'staff' ? '/staff' : newRoute === 'login' ? '/login' : '/app';
    window.history.pushState({}, '', targetPath);

    // Update page title to reflect active portal
    const titles = {
      login: 'Screenlit',
      app: 'Screenlit Patient Portal',
      staff: 'Screenlit Clinical Command Centre',
    };
    document.title = titles[newRoute];
  };

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
          {/* Active User Persona Pill */}
          {isAuthenticated && currentUser.uid ? (
            <button
              type="button"
              onClick={() => switchRoute('login')}
              className="flex items-center gap-2 bg-[#141923] hover:bg-[#1a2230] border border-slate-800 rounded-full px-2.5 py-1 text-xs text-slate-300 hover:text-white transition"
              title="Back to Login"
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
          ) : (
            <span className="text-[11px] text-slate-500 font-semibold hidden sm:inline">
              Not signed in
            </span>
          )}

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
        {isLoadingAuth && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-slate-700 border-t-[#d4f933] rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-semibold">Loading Screenlit...</p>
            </div>
          </div>
        )}
        {!isLoadingAuth && route === 'login' && (
          <LoginDashboard onNavigateToPortal={(target) => switchRoute(target)} />
        )}
        {!isLoadingAuth && route === 'app' && isAuthenticated && <PatientApp />}
        {!isLoadingAuth && route === 'staff' && isAuthenticated && <CommandCentre />}
        {!isLoadingAuth && (route === 'app' || route === 'staff') && !isAuthenticated && (
          <LoginDashboard onNavigateToPortal={(target) => switchRoute(target)} />
        )}
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
