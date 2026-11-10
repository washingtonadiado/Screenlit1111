/**
 * Screenlit Continuous Wearable Signals View
 * Connects continuous physiological telemetry with mandatory non diagnostic disclaimers
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Footprints,
  Heart,
  Moon,
  Radio,
  ShieldAlert,
  Thermometer,
  Watch,
  Wifi,
} from 'lucide-react';

export const WearableStatusView: React.FC = () => {
  const { dict, refreshData, currentUser, setActiveView } = useApp();

  // Automatic real time biometric state
  const [heartRate, setHeartRate] = useState(70);
  const [steps, setSteps] = useState(4280);
  const [pulseScale, setPulseScale] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(1);

  // Automatic vital signs telemetry loop
  useEffect(() => {
    // Pulse animation timer
    const pulseInterval = setInterval(() => {
      setPulseScale((prev) => !prev);
    }, 850);

    // Heart rate and steps auto telemetry stream
    const telemetryInterval = setInterval(() => {
      // Natural resting biometric variation between 68 and 73 bpm
      const nextHr = 68 + Math.floor(Math.random() * 6);
      setHeartRate(nextHr);
      setSteps((prev) => prev + Math.floor(Math.random() * 3));
      setSecondsAgo(0);

      // Ingest live wearable data automatically into server
      fetch('/api/wearable/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceApiKey: 'key_device_wristband_001',
          deviceId: 'device_wristband_001',
          patientId: currentUser.linkedPatientId || 'pat_tariq_001',
          recordedAt: new Date().toISOString(),
          metrics: {
            restingHeartRateBpm: nextHr,
            oxygenSaturationPct: 98,
            skinTemperatureCelsius: 36.6,
            sleepDurationMinutes: 444,
            dailyStepsCount: steps,
          },
        }),
      }).catch((err) => {
        // Silent catch for background stream
      });
    }, 4000);

    // Sync seconds counter
    const syncCounter = setInterval(() => {
      setSecondsAgo((prev) => (prev < 60 ? prev + 1 : 1));
    }, 1000);

    return () => {
      clearInterval(pulseInterval);
      clearInterval(telemetryInterval);
      clearInterval(syncCounter);
    };
  }, [currentUser.linkedPatientId, steps]);

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
        {/* Device Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1d273a] border border-blue-500/20 flex items-center justify-center text-[#d4f933]">
              <Watch className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {dict.wearable.deviceName}
              </h3>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#d4f933] animate-pulse" />
                {dict.wearable.connectedStatus}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="px-2.5 py-1 bg-[#10141d] text-slate-400 text-xs font-mono rounded-full border border-slate-800">
              SN 8841
            </span>
            <p className="text-[10px] text-slate-500 mt-1">
              Synced {secondsAgo === 0 ? 'just now' : `${secondsAgo}s ago`}
            </p>
          </div>
        </div>

        {/* Live Automatic Telemetry Feed Banner */}
        <div className="bg-[#121c2e] border border-blue-500/30 rounded-2xl p-3 flex items-center justify-between text-xs text-blue-200">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#d4f933] animate-pulse" />
            <span className="font-semibold">
              Live Continuous Telemetry Active
            </span>
          </div>
          <span className="text-[10px] bg-blue-500/20 text-[#d4f933] font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
            Auto Streaming
          </span>
        </div>

        {/* Non-diagnostic Disclaimer */}
        <div className="bg-amber-950/40 border border-amber-900/60 rounded-2xl p-3.5 text-amber-200 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="leading-relaxed font-semibold">
            {dict.wearable.disclaimer}
          </p>
        </div>

        {/* 2x2 Telemetry Metrics with Live Fluctuation */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Resting Heart Rate */}
          <div className="bg-[#10141d] p-3.5 rounded-2xl border border-slate-800 transition">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Heart
                  className={`w-4 h-4 text-rose-500 transition-transform duration-300 ${
                    pulseScale ? 'scale-125' : 'scale-100'
                  }`}
                />
                <span>{dict.wearable.restingHeartRate}</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            </div>
            <p className="text-2xl font-black text-white">
              {heartRate}{' '}
              <span className="text-xs font-normal text-slate-400">bpm</span>
            </p>
            <p className="text-[11px] font-bold mt-1 text-emerald-400">
              Normal 14 day baseline
            </p>
          </div>

          {/* Oxygen Level */}
          <div className="bg-[#10141d] p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>{dict.wearable.oxygenLevel}</span>
            </div>
            <p className="text-2xl font-black text-white">
              98 <span className="text-xs font-normal text-slate-400">%</span>
            </p>
            <p className="text-[11px] text-emerald-400 font-bold mt-1">
              Optimal saturation
            </p>
          </div>

          {/* Skin Temperature */}
          <div className="bg-[#10141d] p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
              <Thermometer className="w-4 h-4 text-amber-400" />
              <span>{dict.wearable.skinTemp}</span>
            </div>
            <p className="text-2xl font-black text-white">
              36.6 <span className="text-xs font-normal text-slate-400">&deg;C</span>
            </p>
            <p className="text-[11px] text-emerald-400 font-bold mt-1">
              Normal range
            </p>
          </div>

          {/* Sleep Duration */}
          <div className="bg-[#10141d] p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
              <Moon className="w-4 h-4 text-purple-400" />
              <span>{dict.wearable.sleepDuration}</span>
            </div>
            <p className="text-2xl font-black text-white">
              7.4 <span className="text-xs font-normal text-slate-400">hrs</span>
            </p>
            <p className="text-[11px] text-emerald-400 font-bold mt-1">
              Restorative sleep
            </p>
          </div>
        </div>

        {/* Daily Physical Activity Card */}
        <div className="bg-[#10141d] p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
              <Footprints className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Daily Steps</p>
              <p className="text-[11px] text-slate-400">Active tracking</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-base font-black text-[#d4f933]">{steps.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400">Goal: 8,000 steps</p>
          </div>
        </div>

        {/* Baseline Normal Status */}
        <div className="p-3 bg-emerald-950/40 rounded-2xl border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{dict.wearable.baselineNormal}</span>
        </div>
      </div>
    </div>
  );
};
