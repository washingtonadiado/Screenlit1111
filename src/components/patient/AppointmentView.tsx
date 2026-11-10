/**
 * Screenlit Patient Appointments View
 * Clinic visit schedule, clinician details, location, and reminder notifications in dark mode
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  BellRing,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  MapPin,
  Phone,
  User,
} from 'lucide-react';

export const AppointmentView: React.FC = () => {
  const { dict, setActiveView } = useApp();
  const [remindersEnabled, setRemindersEnabled] = useState(true);

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
            {dict.appointments.title}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Confirmed clinical coordination visits
          </p>
        </div>

        <div className="p-4 bg-[#121c2e] border border-blue-900/50 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 bg-[#3b5bf5] text-white text-xs font-bold rounded-full">
              {dict.appointments.upcoming}
            </span>
            <span className="text-xs font-semibold text-blue-300">
              In 4 days
            </span>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-start gap-2.5 text-xs text-slate-200">
              <User className="w-4 h-4 text-[#d4f933] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-white">
                  Dr. Amina Al Mansoor, Family Medicine
                </p>
                <p className="text-[11px] text-slate-400">
                  Attending Clinical Physician
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-200">
              <Calendar className="w-4 h-4 text-[#d4f933] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-white">
                  Thursday, November 12, 2026
                </p>
                <p className="text-[11px] text-slate-400">
                  10:30 AM (Duration 30 minutes)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-200">
              <MapPin className="w-4 h-4 text-[#d4f933] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-white">
                  Al Amal Community Health Centre
                </p>
                <p className="text-[11px] text-slate-400">
                  Clinic Room 204, Al Sadd Medical District
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              <Bell className="w-4 h-4 text-slate-400" />
              <span>SMS and Web Push Reminders</span>
            </div>
            <button
              type="button"
              onClick={() => setRemindersEnabled(!remindersEnabled)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                remindersEnabled
                  ? 'bg-[#d4f933] text-black shadow-sm'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {remindersEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>
        </div>

        <div className="p-4 bg-[#10141d] rounded-2xl border border-slate-800 space-y-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
            Preparation for Your Visit
          </h4>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
            <li>Bring your home blood pressure log readings.</li>
            <li>Take your morning medications as scheduled.</li>
            <li>Wear loose fitting clothing for accurate cuff placement.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
