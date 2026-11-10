/**
 * Screenlit Patient Care Schedule and Calendar View
 * Dynamically computes and renders real dates that advance every day with interactive month navigation
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowUpRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Pill,
  RotateCcw,
  Stethoscope,
  X,
} from 'lucide-react';

interface CalendarSlot {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasEvent?: boolean;
}

export const ScheduleCalendarView: React.FC = () => {
  const { dict, setActiveView, currentLanguage } = useApp();

  // Compute live current date
  const computeCurrentDate = () => new Date();

  const [currentDate, setCurrentDate] = useState<Date>(computeCurrentDate());
  const [selectedDate, setSelectedDate] = useState<Date>(computeCurrentDate());
  const [viewYear, setViewYear] = useState<number>(computeCurrentDate().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(computeCurrentDate().getMonth());

  // Periodic heartbeat every minute to check if calendar day changed
  useEffect(() => {
    const timer = setInterval(() => {
      const liveNow = computeCurrentDate();
      if (
        liveNow.getDate() !== currentDate.getDate() ||
        liveNow.getMonth() !== currentDate.getMonth() ||
        liveNow.getFullYear() !== currentDate.getFullYear()
      ) {
        setCurrentDate(liveNow);
        setSelectedDate(liveNow);
        setViewYear(liveNow.getFullYear());
        setViewMonth(liveNow.getMonth());
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [currentDate]);

  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    const today = computeCurrentDate();
    setSelectedDate(today);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  // Generate dynamic calendar slots for viewMonth/viewYear
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const slots: CalendarSlot[] = [];

  // Previous month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dNum = prevMonthDays - i;
    slots.push({
      date: new Date(viewYear, viewMonth - 1, dNum),
      dayNumber: dNum,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const slotDate = new Date(viewYear, viewMonth, d);
    const isToday =
      slotDate.getFullYear() === currentDate.getFullYear() &&
      slotDate.getMonth() === currentDate.getMonth() &&
      slotDate.getDate() === currentDate.getDate();
    const isSelected =
      slotDate.getFullYear() === selectedDate.getFullYear() &&
      slotDate.getMonth() === selectedDate.getMonth() &&
      slotDate.getDate() === selectedDate.getDate();

    slots.push({
      date: slotDate,
      dayNumber: d,
      isCurrentMonth: true,
      isToday,
      isSelected,
      hasEvent: d % 3 === 0 || isToday,
    });
  }

  // Next month padding to fill complete grid
  const remainingSlots = (7 - (slots.length % 7)) % 7;
  for (let n = 1; n <= remainingSlots; n++) {
    slots.push({
      date: new Date(viewYear, viewMonth + 1, n),
      dayNumber: n,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
    });
  }

  const localeCode =
    currentLanguage === 'ar'
      ? 'ar-QA'
      : currentLanguage === 'sw'
      ? 'sw-KE'
      : 'en-US';

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    localeCode,
    { month: 'long' }
  );

  const isSelectedToday =
    selectedDate.getFullYear() === currentDate.getFullYear() &&
    selectedDate.getMonth() === currentDate.getMonth() &&
    selectedDate.getDate() === currentDate.getDate();

  const selectedDateLabel = selectedDate.toLocaleDateString(localeCode, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const dailyActivities = [
    {
      id: 'act_1',
      title: 'Morning Cuff Reading',
      detail: 'Withings Cellular BPM Connect',
      time: '8:00 AM',
      icon: Heart,
      status: isSelectedToday ? 'completed' : 'scheduled',
      action: 'readings',
    },
    {
      id: 'act_2',
      title: 'Clinical Consultation',
      detail: 'Dr. Amina Al Mansoor, Family Medicine',
      time: '10:30 AM',
      icon: Stethoscope,
      status: 'upcoming',
      action: 'appointments',
    },
    {
      id: 'act_3',
      title: 'Prescribed Medication',
      detail: 'Amlodipine 5mg oral daily',
      time: '2:00 PM',
      icon: Pill,
      status: 'upcoming',
      action: 'carePlan',
    },
    {
      id: 'act_4',
      title: 'Evening Resting Reading',
      detail: 'Seated resting protocol',
      time: '8:00 PM',
      icon: Clock,
      status: 'scheduled',
      action: 'readings',
    },
  ];

  return (
    <div className="flex flex-col gap-4 text-white">
      {/* Top Header with Month Navigator */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <span className="text-xs font-semibold text-slate-400">
            {viewYear}
          </span>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-100 tracking-tight capitalize">
              {monthName}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-full bg-[#1b2230] hover:bg-[#252f42] text-slate-400 hover:text-white flex items-center justify-center transition"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-full bg-[#1b2230] hover:bg-[#252f42] text-slate-400 hover:text-white flex items-center justify-center transition"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isSelectedToday && (
            <button
              type="button"
              onClick={handleJumpToToday}
              className="px-3 py-1 rounded-full text-xs font-bold bg-[#1b2230] text-[#d4f933] border border-slate-700 hover:bg-[#252f42] transition flex items-center gap-1"
              title="Jump to Today"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Today</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="w-8 h-8 rounded-full bg-[#1b2230] hover:bg-[#252f42] text-slate-400 hover:text-white flex items-center justify-center transition"
            title="Close Calendar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Royal Blue Calendar Card */}
      <div className="bg-[#3b5bf5] rounded-3xl p-5 shadow-xl text-white">
        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 text-center mb-3">
          {daysOfWeek.map((d) => (
            <span
              key={d}
              className="text-[10px] font-bold text-blue-200 tracking-wider"
            >
              {d}
            </span>
          ))}
        </div>

        {/* Dynamic Days Grid */}
        <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
          {slots.map((item, idx) => {
            const isSelected = item.isSelected;
            const isToday = item.isToday;

            return (
              <div key={idx} className="flex items-center justify-center relative">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(item.date);
                    if (!item.isCurrentMonth) {
                      setViewYear(item.date.getFullYear());
                      setViewMonth(item.date.getMonth());
                    }
                  }}
                  className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition relative ${
                    isSelected
                      ? 'bg-[#d4f933] text-black font-extrabold shadow-md scale-110'
                      : isToday
                      ? 'bg-white text-[#3b5bf5] font-black shadow-sm ring-2 ring-white/50'
                      : item.isCurrentMonth
                      ? 'bg-black/25 text-white hover:bg-black/40'
                      : 'border border-dashed border-white/20 text-blue-200/50'
                  }`}
                >
                  {item.dayNumber}
                  {item.hasEvent && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-[#d4f933] absolute bottom-1" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Activities Section */}
      <div className="bg-[#151a24] border border-slate-800/80 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-100">
              Daily Care Activities
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedDateLabel}
              {isSelectedToday && (
                <span className="ms-2 px-2 py-0.5 rounded-full bg-[#d4f933]/20 text-[#d4f933] text-[10px] font-bold">
                  Today
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveView('appointments')}
            className="text-slate-400 hover:text-white p-1 transition"
            title="View All Visits"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline List */}
        <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:border-l-2 before:border-dashed before:border-slate-700">
          {dailyActivities.map((act) => {
            const Icon = act.icon;
            const isDone = act.status === 'completed';

            return (
              <div
                key={act.id}
                onClick={() => setActiveView(act.action)}
                className="relative flex items-center justify-between group cursor-pointer"
              >
                {/* Timeline node */}
                <span
                  className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isDone
                      ? 'bg-[#d4f933] border-[#d4f933]'
                      : 'bg-[#151a24] border-slate-600 group-hover:border-slate-400'
                  }`}
                >
                  {isDone && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                </span>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:bg-slate-700 transition">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200 group-hover:text-white transition">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-slate-400">{act.detail}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-300">
                    {act.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
