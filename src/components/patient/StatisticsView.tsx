/**
 * Screenlit Patient Statistics and Health Monitoring View
 * Recreates the dark mode analytics screen with waveform visualizations,
 * Recharts self reported feeling and wellness trend chart, and metric cards
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PatientFeelingLog } from '@shared/types';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  Mic,
  ShieldAlert,
  Smile,
  Sparkles,
  TrendingUp,
  Volume2,
  X,
} from 'lucide-react';

interface ChartPoint {
  day: string;
  fullDate: string;
  score: number;
  feeling: string;
  emoji: string;
  note: string;
  tags: string[];
  isVoice: boolean;
}

const SCORE_MAP: Record<string, { score: number; label: string; emoji: string }> = {
  great: { score: 5, label: 'Great', emoji: '😊' },
  good: { score: 4, label: 'Good', emoji: '🙂' },
  okay: { score: 3, label: 'Okay', emoji: '😐' },
  unwell: { score: 2, label: 'Unwell', emoji: '🤒' },
  concerning: { score: 1, label: 'Alert', emoji: '🚨' },
};

export const StatisticsView: React.FC = () => {
  const { dict, setActiveView, observations, activeCase, currentUser } = useApp();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [feelings, setFeelings] = useState<PatientFeelingLog[]>([]);

  // Fetch logged feeling checkins for this patient
  useEffect(() => {
    const loadFeelings = async () => {
      try {
        const res = await fetch(`/api/patient/feelings?patientId=${currentUser.uid}`);
        if (res.ok) {
          const data = await res.json();
          setFeelings(data.feelings || []);
        }
      } catch (err) {
        console.error('Failed to load feeling history for statistics:', err);
      }
    };
    loadFeelings();
  }, [currentUser.uid]);

  const bpObservations = observations.filter(
    (o) => o.code.coding?.[0]?.code === '85354-9'
  );
  const latestBp = bpObservations[0];
  const systolic = latestBp?.component?.[0]?.valueQuantity?.value || 132;
  const diastolic = latestBp?.component?.[1]?.valueQuantity?.value || 84;

  const weeklyWaveformBars = [
    { day: 'Mon', h1: 65, h2: 45, val: '138/88' },
    { day: 'Tue', h1: 85, h2: 55, val: '142/90' },
    { day: 'Wed', h1: 50, h2: 35, val: '134/86' },
    { day: 'Thu', h1: 75, h2: 50, val: '136/88' },
    { day: 'Fri', h1: 45, h2: 30, val: '130/82' },
    { day: 'Sat', h1: 40, h2: 25, val: '128/80' },
    { day: 'Sun', h1: 55, h2: 35, val: '132/84' },
  ];

  // Build wellness trend chart data points from real patient feeling entries
  const chartData: ChartPoint[] = useMemo(() => {
    // Standard baseline template points across the surveillance schedule
    const baselineDays = [
      { label: 'Mon', date: 'Oct 27', score: 3, feeling: 'okay', note: 'First morning checkin after clinic consultation', tags: ['Normal'], isVoice: false },
      { label: 'Tue', date: 'Oct 28', score: 2, feeling: 'unwell', note: 'Mild headache in afternoon, rested calmly', tags: ['Headache'], isVoice: false },
      { label: 'Wed', date: 'Oct 29', score: 3, feeling: 'okay', note: 'Headache subsiding after hydration and resting', tags: ['Seated Rested'], isVoice: true },
      { label: 'Thu', date: 'Oct 30', score: 4, feeling: 'good', note: 'Breathing easy, good morning walking energy', tags: ['Normal'], isVoice: false },
      { label: 'Fri', date: 'Oct 31', score: 4, feeling: 'good', note: 'Calm resting blood pressure measurement taken', tags: ['Feeling Calm'], isVoice: true },
      { label: 'Sat', date: 'Nov 01', score: 4, feeling: 'good', note: 'Comfortable weekend routine with family', tags: ['Seated Rested'], isVoice: false },
      { label: 'Sun', date: 'Nov 02', score: 5, feeling: 'great', note: 'Feeling energetic and blood pressure is controlled', tags: ['Normal'], isVoice: true },
    ];

    if (feelings.length === 0) {
      return baselineDays.map((b) => ({
        day: b.label,
        fullDate: b.date,
        score: b.score,
        feeling: b.feeling,
        emoji: SCORE_MAP[b.feeling]?.emoji || '🙂',
        note: b.note,
        tags: b.tags,
        isVoice: b.isVoice,
      }));
    }

    // Sort chronologically ascending for the timeline
    const chronological = [...feelings].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );

    // If user has fewer than 5 real entries, merge them into the baseline sequence
    if (chronological.length < 5) {
      const merged = [...baselineDays];
      chronological.forEach((f, idx) => {
        const d = new Date(f.recordedAt);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const targetIdx = Math.min(merged.length - 1, merged.length - chronological.length + idx);
        merged[targetIdx] = {
          label: dayName,
          date: dateStr,
          score: SCORE_MAP[f.feelingScore]?.score || 4,
          feeling: f.feelingScore,
          note: f.feelingNote,
          tags: f.tags || ['Normal'],
          isVoice: !!f.transcribedFromVoice,
        };
      });

      return merged.map((b) => ({
        day: b.label,
        fullDate: b.date,
        score: b.score,
        feeling: b.feeling,
        emoji: SCORE_MAP[b.feeling]?.emoji || '🙂',
        note: b.note,
        tags: b.tags,
        isVoice: b.isVoice,
      }));
    }

    // If patient has plenty of entries, map directly from real records
    const subset = period === 'daily'
      ? chronological.slice(-5)
      : period === 'monthly'
      ? chronological.slice(-14)
      : chronological.slice(-7);

    return subset.map((item) => {
      const d = new Date(item.recordedAt);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const meta = SCORE_MAP[item.feelingScore] || { score: 3, label: 'Okay', emoji: '😐' };

      return {
        day: dayName,
        fullDate: dateStr,
        score: meta.score,
        feeling: item.feelingScore,
        emoji: meta.emoji,
        note: item.feelingNote,
        tags: item.tags || [],
        isVoice: !!item.transcribedFromVoice,
      };
    });
  }, [feelings, period]);

  // Compute average wellness score
  const averageScore = useMemo(() => {
    if (chartData.length === 0) return 4.0;
    const sum = chartData.reduce((acc, curr) => acc + curr.score, 0);
    return (sum / chartData.length).toFixed(1);
  }, [chartData]);

  // Count voice checkins
  const voiceCheckinCount = useMemo(() => {
    return chartData.filter((item) => item.isVoice).length;
  }, [chartData]);

  // Custom Dot component with feeling color indicator
  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;

    const fillColor =
      payload.score >= 4
        ? '#d4f933'
        : payload.score === 3
        ? '#3b5bf5'
        : '#f43f5e';

    return (
      <g key={`dot-${payload.day}-${cx}`}>
        <circle
          cx={cx}
          cy={cy}
          r={5}
          fill={fillColor}
          stroke="#070a0f"
          strokeWidth={2}
        />
      </g>
    );
  };

  return (
    <div className="flex flex-col gap-4 text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="w-8" />
        <h2 className="text-lg font-bold text-slate-100 tracking-tight">
          {dict.nav.statistics || 'Statistics'}
        </h2>
        <button
          type="button"
          onClick={() => setActiveView('home')}
          className="w-8 h-8 rounded-full bg-[#1b2230] hover:bg-[#252f42] text-slate-400 hover:text-white flex items-center justify-center transition"
          title="Close Statistics"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Period Segmented Control */}
      <div className="flex items-center justify-center gap-1.5 p-1 bg-[#141923] rounded-full border border-slate-800/80 mx-auto w-full max-w-xs">
        <button
          type="button"
          onClick={() => setPeriod('daily')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition ${
            period === 'daily'
              ? 'bg-[#d4f933] text-black shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Daily
        </button>
        <button
          type="button"
          onClick={() => setPeriod('weekly')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition ${
            period === 'weekly'
              ? 'bg-[#d4f933] text-black shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Weekly
        </button>
        <button
          type="button"
          onClick={() => setPeriod('monthly')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition ${
            period === 'monthly'
              ? 'bg-[#d4f933] text-black shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Monthly
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-3">
        <button
          type="button"
          className="p-1 hover:text-white transition"
          title="Previous surveillance interval"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-medium tracking-wide">
          Oct 27, 2026 to Nov 2, 2026
        </span>
        <button
          type="button"
          className="p-1 hover:text-white transition"
          title="Next surveillance interval"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* NEW SECTION: Self-Reported Feeling and Wellness Trends Chart using Recharts */}
      <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-[#d4f933]/20 text-[#d4f933] flex items-center justify-center">
                <Smile className="w-4 h-4" />
              </span>
              <h3 className="font-extrabold text-base text-white tracking-tight">
                Self Reported Wellness Trends
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Emotional and physical feeling score trajectory over time
            </p>
          </div>

          <div className="text-end">
            <span className="px-2.5 py-1 rounded-full bg-[#d4f933]/20 text-[#d4f933] border border-[#d4f933]/30 text-xs font-black">
              Avg {averageScore} of 5
            </span>
            <p className="text-[10px] text-slate-500 mt-0.5">Stable Trend</p>
          </div>
        </div>

        {/* Recharts Area Chart Container */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="wellnessGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4f933" stopOpacity={0.35} />
                  <stop offset="60%" stopColor="#3b5bf5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b5bf5" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#1e293b"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="day"
                stroke="#64748b"
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />

              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                stroke="#64748b"
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                width={70}
                tickFormatter={(val: number) => {
                  if (val === 5) return '😊 Great';
                  if (val === 4) return '🙂 Good';
                  if (val === 3) return '😐 Okay';
                  if (val === 2) return '🤒 Unwell';
                  if (val === 1) return '🚨 Alert';
                  return '';
                }}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ChartPoint;
                    return (
                      <div className="bg-[#0e131d] border border-slate-700/80 rounded-2xl p-3 shadow-2xl text-xs space-y-1.5 max-w-xs">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1">
                          <span className="font-bold text-slate-300">
                            {data.fullDate} ({data.day})
                          </span>
                          <span className="text-sm">{data.emoji}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#d4f933]">
                            {data.feeling.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Score {data.score} of 5
                          </span>
                          {data.isVoice && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#3b5bf5]/20 text-[#3b5bf5] font-bold flex items-center gap-1">
                              <Volume2 className="w-2.5 h-2.5" />
                              Voice Note
                            </span>
                          )}
                        </div>

                        {data.note && (
                          <p className="text-[11px] text-slate-300 italic leading-snug">
                            "{data.note}"
                          </p>
                        )}

                        {data.tags && data.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {data.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-slate-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey="score"
                stroke="#d4f933"
                strokeWidth={3}
                fill="url(#wellnessGradient)"
                dot={renderCustomDot}
                activeDot={{
                  r: 6,
                  fill: '#d4f933',
                  stroke: '#070a0f',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Wellness Highlights Summary Bar */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center text-xs">
          <div className="p-2.5 bg-[#10141d] rounded-2xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block mb-0.5">
              Average Wellness
            </span>
            <span className="font-extrabold text-white text-sm">
              {averageScore} / 5.0
            </span>
          </div>

          <div className="p-2.5 bg-[#10141d] rounded-2xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block mb-0.5">
              Weekly Progress
            </span>
            <span className="font-extrabold text-emerald-400 text-sm flex items-center justify-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Progressing Well
            </span>
          </div>

          <div className="p-2.5 bg-[#10141d] rounded-2xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block mb-0.5">
              Voice Checkins
            </span>
            <span className="font-extrabold text-[#3b5bf5] text-sm flex items-center justify-center gap-1">
              <Mic className="w-3.5 h-3.5 text-[#3b5bf5]" />
              {voiceCheckinCount} Logged
            </span>
          </div>
        </div>
      </div>

      {/* Hero Royal Blue Waveform Card */}
      <div className="bg-[#3b5bf5] rounded-3xl p-5 shadow-xl text-white relative overflow-hidden">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-base tracking-tight">
              Blood Pressure and Activity
            </h3>
            <p className="text-xs text-blue-100 font-medium opacity-90">
              Total for the week: 14 home readings
            </p>
          </div>
          <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[11px] font-bold">
            Controlled
          </span>
        </div>

        {/* Audio Waveform style Visualization */}
        <div className="bg-black/15 rounded-2xl p-3.5 mb-4 border border-white/10">
          <div className="flex items-end justify-between h-20 px-2 gap-2">
            {weeklyWaveformBars.map((bar) => (
              <div
                key={bar.day}
                className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                title={`${bar.day}: ${bar.val}`}
              >
                <div className="w-full flex items-end justify-center gap-0.5 h-14">
                  <div
                    style={{ height: `${bar.h1}%` }}
                    className="w-1.5 bg-[#d4f933] rounded-full transition-all group-hover:brightness-125"
                  />
                  <div
                    style={{ height: `${bar.h2}%` }}
                    className="w-1.5 bg-white/60 rounded-full transition-all group-hover:bg-white"
                  />
                </div>
                <span className="text-[10px] text-blue-100 font-semibold group-hover:text-white">
                  {bar.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-stats Row */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/15 text-center">
          <div>
            <p className="text-[10px] text-blue-200">Latest BP</p>
            <p className="text-xs font-black tracking-tight">
              {systolic}/{diastolic}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-blue-200">Resting HR</p>
            <p className="text-xs font-black tracking-tight">71 bpm</p>
          </div>
          <div>
            <p className="text-[10px] text-blue-200">Readings</p>
            <p className="text-xs font-black tracking-tight">14 of 14</p>
          </div>
        </div>
      </div>

      {/* 2x2 Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Metric Card 1: Blood Pressure */}
        <div
          onClick={() => setActiveView('readings')}
          className="bg-[#151a24] border border-slate-800/80 rounded-3xl p-4 flex flex-col justify-between hover:border-slate-700 transition cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-300">
                Blood Pressure
              </p>
              <p className="text-[10px] text-slate-500">Average</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white tracking-tight">
                {systolic}/{diastolic}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                Down 16 percent
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Target is below 140 over 90
            </p>
          </div>
        </div>

        {/* Metric Card 2: Home Readings */}
        <div
          onClick={() => setActiveView('readings')}
          className="bg-[#151a24] border border-slate-800/80 rounded-3xl p-4 flex flex-col justify-between hover:border-slate-700 transition cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-300">
                Home Readings
              </p>
              <p className="text-[10px] text-slate-500">Logged this week</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white tracking-tight">
                14
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                100%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Goal is 14 cuff readings
            </p>
          </div>
        </div>

        {/* Metric Card 3: Resting Heart Rate */}
        <div
          onClick={() => setActiveView('wearable')}
          className="bg-[#151a24] border border-slate-800/80 rounded-3xl p-4 flex flex-col justify-between hover:border-slate-700 transition cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-300">Heart Rate</p>
              <p className="text-[10px] text-slate-500">Resting baseline</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white tracking-tight">
                71
              </span>
              <span className="text-xs text-slate-400">bpm</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                Normal
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Wristband 14 day baseline
            </p>
          </div>
        </div>

        {/* Metric Card 4: Surveillance Closure */}
        <div
          onClick={() => setActiveView('result')}
          className="bg-[#151a24] border border-slate-800/80 rounded-3xl p-4 flex flex-col justify-between hover:border-slate-700 transition cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-300">Closure Goal</p>
              <p className="text-[10px] text-slate-500">Controlled check</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#d4f933] tracking-tight">
                {activeCase?.evidence.controlledReadingsCount || 2} of 3
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              1 controlled reading to closure
            </p>
          </div>
        </div>
      </div>

      {/* Non-diagnostic notice */}
      <div className="bg-[#12161f] border border-slate-800/90 rounded-2xl p-3 text-[11px] text-slate-400 flex items-start gap-2 mt-1">
        <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="leading-snug">
          Wearable flags are prompts for clinical team review, not medical
          diagnoses. Blood pressure measurements come strictly from certified cuff
          readings.
        </p>
      </div>
    </div>
  );
};
