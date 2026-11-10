/**
 * Screenlit Patient App Responsive Web Shell
 * Plain responsive web application layout removing phone mockup bezels and artificial status bars
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HomeNextStepView } from './HomeNextStepView';
import { ResultExplainerView } from './ResultExplainerView';
import { AcknowledgeView } from './AcknowledgeView';
import { HomeReadingEntryView } from './HomeReadingEntryView';
import { WearableStatusView } from './WearableStatusView';
import { AppointmentView } from './AppointmentView';
import { CarePlanView } from './CarePlanView';
import { ConsentView } from './ConsentView';
import { MessagesView } from './MessagesView';
import { StatisticsView } from './StatisticsView';
import { ScheduleCalendarView } from './ScheduleCalendarView';
import { PatientFeelingCheckin } from './PatientFeelingCheckin';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Bell,
  Calendar,
  ChevronDown,
  Globe,
  Home,
  LogIn,
  MessageSquare,
  Settings,
  Shield,
  User,
  Users,
  X,
} from 'lucide-react';
import { LANGUAGE_OPTIONS, getReviewNotice } from '../../locales';
import { SupportedLanguage } from '@shared/types';

export const PatientApp: React.FC = () => {
  const {
    dict,
    currentLanguage,
    setLanguage,
    activeView,
    setActiveView,
    currentUser,
    setCurrentUser,
    availableUsers,
  } = useApp();

  const [showRoleModal, setShowRoleModal] = useState(false);

  const reviewNotice = getReviewNotice(currentLanguage);

  // Extract first name for greeting
  const firstName = currentUser.displayName.split(' ')[0] || 'Tariq';

  // Determine active tab for floating dock
  const isHomeActive = activeView === 'home';
  const isScheduleActive = activeView === 'schedule' || activeView === 'appointments';
  const isStatsActive = activeView === 'statistics' || activeView === 'wearable';
  const isSettingsActive =
    activeView === 'settings' || activeView === 'consent' || activeView === 'carePlan';

  return (
    <div className="min-h-screen bg-[#070a0f] flex flex-col text-slate-100 font-sans selection:bg-[#d4f933] selection:text-black relative">
      {/* Ambient Top Glow */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-[#1b2f28]/25 via-[#18233a]/15 to-transparent pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col relative z-10 px-4 sm:px-6">
        {/* Top App Header */}
        <header className="py-4 z-30 flex items-center justify-between border-b border-slate-800/70">
          <div className="flex items-center gap-3">
            {/* User Circular Avatar */}
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#3b5bf5] to-[#d4f933] p-0.5 shadow-md">
                <div className="w-full h-full rounded-full bg-[#141923] flex items-center justify-center font-bold text-sm text-white">
                  {firstName.charAt(0)}
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 leading-none">
                {dict.home.welcome || 'Hello'}
              </p>
              <h1 className="text-lg font-extrabold text-white leading-tight mt-0.5">
                {currentUser.displayName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative">
              <select
                value={currentLanguage}
                onChange={(e) =>
                  setLanguage(e.target.value as SupportedLanguage)
                }
                className="appearance-none bg-[#161c28] hover:bg-[#1f2738] text-xs font-semibold py-2 ps-3 pe-7 rounded-full text-slate-200 cursor-pointer focus:outline-none border border-slate-800 transition"
                title="Select Language"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code} className="bg-slate-900 text-white">
                    {opt.nativeName}
                  </option>
                ))}
              </select>
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute end-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Role Switcher Button */}
            <button
              type="button"
              onClick={() => setShowRoleModal(true)}
              className="p-2 bg-[#161c28] hover:bg-[#1f2738] text-slate-300 hover:text-white rounded-full border border-slate-800 transition flex items-center justify-center"
              title="Switch Demo Role"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Notifications Bell */}
            <button
              type="button"
              onClick={() => setActiveView('messages')}
              className="p-2 bg-[#161c28] hover:bg-[#1f2738] text-slate-300 hover:text-white rounded-full border border-slate-800 transition relative flex items-center justify-center"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#d4f933] absolute top-1 right-1" />
            </button>
          </div>
        </header>

        {/* Native Review Clinical Disclaimer Bar */}
        {reviewNotice && (
          <div className="bg-amber-950/70 border-b border-amber-900/60 px-4 py-1.5 text-center text-xs font-medium text-amber-300 flex items-center justify-center gap-2 my-2 rounded-2xl">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>{reviewNotice}</span>
          </div>
        )}

        {/* Scrollable Main Content Area */}
        <main className="flex-1 py-5 pb-28 z-10">
          {activeView === 'home' && <HomeNextStepView />}
          {activeView === 'feelings' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setActiveView('home')}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              <PatientFeelingCheckin />
            </div>
          )}
          {activeView === 'schedule' && <ScheduleCalendarView />}
          {activeView === 'statistics' && <StatisticsView />}
          {activeView === 'result' && <ResultExplainerView />}
          {activeView === 'acknowledge' && <AcknowledgeView />}
          {activeView === 'readings' && <HomeReadingEntryView />}
          {activeView === 'wearable' && <WearableStatusView />}
          {activeView === 'appointments' && <AppointmentView />}
          {activeView === 'carePlan' && <CarePlanView />}
          {activeView === 'consent' && <ConsentView />}
          {activeView === 'messages' && <MessagesView />}
          {activeView === 'settings' && <ConsentView />}
        </main>
      </div>

      {/* Floating Dock Navigation Bar pinned at bottom of viewport */}
      <div className="fixed bottom-6 inset-x-0 px-4 z-40 pointer-events-none flex justify-center">
        <nav className="pointer-events-auto bg-[#141923]/95 backdrop-blur-xl border border-slate-800/90 rounded-full px-5 py-2.5 flex items-center justify-between gap-6 shadow-[0_12px_40px_rgba(0,0,0,0.85)]">
          {/* Slot 1: Home */}
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className={`transition-all duration-200 flex items-center justify-center ${
              isHomeActive
                ? 'bg-[#d4f933] text-black w-12 h-12 rounded-full shadow-lg scale-105 font-bold'
                : 'text-slate-400 hover:text-white p-2'
            }`}
            title="Home"
          >
            <Home className="w-5 h-5" />
          </button>

          {/* Slot 2: Schedule / Calendar */}
          <button
            type="button"
            onClick={() => setActiveView('schedule')}
            className={`transition-all duration-200 flex items-center justify-center ${
              isScheduleActive
                ? 'bg-[#d4f933] text-black w-12 h-12 rounded-full shadow-lg scale-105 font-bold'
                : 'text-slate-400 hover:text-white p-2'
            }`}
            title="Schedule"
          >
            <Calendar className="w-5 h-5" />
          </button>

          {/* Slot 3: Statistics / Analytics */}
          <button
            type="button"
            onClick={() => setActiveView('statistics')}
            className={`transition-all duration-200 flex items-center justify-center ${
              isStatsActive
                ? 'bg-[#d4f933] text-black w-12 h-12 rounded-full shadow-lg scale-105 font-bold'
                : 'text-slate-400 hover:text-white p-2'
            }`}
            title="Health Statistics"
          >
            <Activity className="w-5 h-5" />
          </button>

          {/* Slot 4: Settings / Consent */}
          <button
            type="button"
            onClick={() => setActiveView('settings')}
            className={`transition-all duration-200 flex items-center justify-center ${
              isSettingsActive
                ? 'bg-[#d4f933] text-black w-12 h-12 rounded-full shadow-lg scale-105 font-bold'
                : 'text-slate-400 hover:text-white p-2'
            }`}
            title="Privacy and Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </nav>
      </div>

      {/* Role Switcher Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141923] border border-slate-800 rounded-3xl max-w-sm w-full p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-[#d4f933]" />
                Switch Demo User
              </h3>
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mt-4 max-h-80 overflow-y-auto">
              {availableUsers.map((user) => {
                const isSelected = user.uid === currentUser.uid;

                return (
                  <button
                    key={user.uid}
                    type="button"
                    onClick={() => {
                      setCurrentUser(user);
                      setShowRoleModal(false);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#3b5bf5]/20 border-[#3b5bf5] text-white'
                        : 'bg-[#181e2a] border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-xs">{user.displayName}</p>
                      <p className="text-[10px] text-slate-400 capitalize">
                        Role: {user.role} ({user.language})
                      </p>
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#d4f933]" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowRoleModal(false);
                  window.location.pathname = '/login';
                }}
                className="w-full py-2 bg-[#3b5bf5] hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Open Full Login Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
