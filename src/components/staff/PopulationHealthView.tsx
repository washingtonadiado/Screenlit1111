/**
 * Screenlit Population Health Impact Simulation Dashboard
 * Visualizes Monte Carlo simulation results across 9 KPIs with baseline vs Screenlit comparison
 *
 * Permanent banner: Simulated results, not clinical evidence.
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';import {
  SimulationAssumption,
  SimulationRunRecord,
} from '@shared/types';
import {
  Activity,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';

interface KpiCardProps {
  label: string;
  baselineRate: number;
  screenlitMedian: number;
  p5: number;
  p95: number;
  unit: string;
  lowerIsBetter: boolean;
}

const UNIT_MAP: Record<string, string> = {
  timeToNotificationHours: 'h',
  acknowledgementRatePercent: '%',
  timeToConsultationDays: 'd',
  referralCompletionPercent: '%',
  appointmentCompletionPercent: '%',
  treatmentInitiationPercent: '%',
  unresolvedActionableAt90DaysPercent: '%',
  documentedClosureRatePercent: '%',
  bloodPressureControlAt90DaysPercent: '%',
};

const LOWER_IS_BETTER: Record<string, boolean> = {
  timeToNotificationHours: true,
  acknowledgementRatePercent: false,
  timeToConsultationDays: true,
  referralCompletionPercent: false,
  appointmentCompletionPercent: false,
  treatmentInitiationPercent: false,
  unresolvedActionableAt90DaysPercent: true,
  documentedClosureRatePercent: false,
  bloodPressureControlAt90DaysPercent: false,
};

const LABEL_MAP: Record<string, string> = {
  timeToNotificationHours: 'Time to Notification',
  acknowledgementRatePercent: 'Acknowledgement Rate',
  timeToConsultationDays: 'Time to Consultation',
  referralCompletionPercent: 'Referral Completion',
  appointmentCompletionPercent: 'Appointment Completion',
  treatmentInitiationPercent: 'Treatment Initiation',
  unresolvedActionableAt90DaysPercent: 'Unresolved at 90 Days',
  documentedClosureRatePercent: 'Documented Closure Rate',
  bloodPressureControlAt90DaysPercent: 'BP Controlled at 90 Days',
};

const ICON_MAP: Record<string, React.ReactNode> = {
  timeToNotificationHours: <Clock className="w-4 h-4" />,
  acknowledgementRatePercent: <CheckCircle2 className="w-4 h-4" />,
  timeToConsultationDays: <Clock className="w-4 h-4" />,
  referralCompletionPercent: <TrendingUp className="w-4 h-4" />,
  appointmentCompletionPercent: <Users className="w-4 h-4" />,
  treatmentInitiationPercent: <Activity className="w-4 h-4" />,
  unresolvedActionableAt90DaysPercent: <TrendingDown className="w-4 h-4" />,
  documentedClosureRatePercent: <CheckCircle2 className="w-4 h-4" />,
  bloodPressureControlAt90DaysPercent: <Activity className="w-4 h-4" />,
};

function KpiCard({ label, baselineRate, screenlitMedian, p5, p95, unit, lowerIsBetter }: KpiCardProps) {  const isImprovement = lowerIsBetter
    ? screenlitMedian < baselineRate
    : screenlitMedian > baselineRate;

  const delta = lowerIsBetter
    ? ((baselineRate - screenlitMedian) / baselineRate) * 100
    : ((screenlitMedian - baselineRate) / baselineRate) * 100;

  return (
    <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
      {/* Left color strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isImprovement ? 'bg-emerald-500' : 'bg-rose-500'}`} />

      <div className="ps-2">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>

        <div className="flex items-end gap-3 mt-1.5">
          <div>
            <p className="text-[10px] text-slate-500">Baseline</p>
            <p className="text-xl font-black text-slate-400">
              {baselineRate.toFixed(1)}
              <span className="text-xs font-normal ml-0.5">{unit}</span>
            </p>
          </div>
          <div className="text-slate-600 pb-1">→</div>
          <div>
            <p className="text-[10px] text-[#d4f933]">Screenlit (median)</p>
            <p className={`text-xl font-black ${isImprovement ? 'text-emerald-400' : 'text-rose-400'}`}>
              {screenlitMedian.toFixed(1)}
              <span className="text-xs font-normal ml-0.5">{unit}</span>
            </p>
          </div>
        </div>

        {/* P5 / P95 range */}
        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
          <span>5th pct: {p5.toFixed(1)}{unit}</span>
          <span>·</span>
          <span>95th pct: {p95.toFixed(1)}{unit}</span>
        </div>

        {/* Improvement badge */}
        <div className={`mt-2 inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
          isImprovement
            ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/60'
            : 'bg-rose-950/50 text-rose-400 border border-rose-800/60'
        }`}>
          {isImprovement ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{delta.toFixed(0)}% {isImprovement ? 'improvement' : 'change'} vs baseline</span>
        </div>
      </div>
    </div>
  );
}

export const PopulationHealthView: React.FC = () => {
  const [simulation, setSimulation] = useState<SimulationRunRecord | null>(null);
  const [assumptions, setAssumptions] = useState<SimulationAssumption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [rerunning, setRerunning] = useState(false);

  const loadSimulation = async () => {
    setLoading(true);
    try {
      const [simRes, assRes] = await Promise.all([
        fetch('/api/simulation/latest'),
        fetch('/api/simulation/assumptions'),
      ]);
      if (simRes.ok) {
        const d = await simRes.json();
        setSimulation(d.simulation);
      }
      if (assRes.ok) {
        const d = await assRes.json();
        setAssumptions(d.assumptions || []);
      }
    } catch (err) {
      console.error('Failed to load simulation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const rerunSimulation = async () => {
    setRerunning(true);
    try {
      const res = await fetch('/api/simulation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohortSize: 2000, replicationsCount: 50 }),
      });
      if (res.ok) {
        const d = await res.json();
        setSimulation(d.simulation);
      }
    } catch (err) {
      console.error('Failed to rerun simulation:', err);
    } finally {
      setRerunning(false);
    }
  };

  useEffect(() => {
    loadSimulation();
  }, []);

  // Build bar chart comparison data
  const buildComparisonData = () => {
    if (!simulation) return [];
    return assumptions.map((a) => ({
      name: LABEL_MAP[a.key] || a.key,
      Baseline: a.baselineRate,
      Screenlit: (simulation.metrics as any)[a.key]?.median ?? a.screenlitRate,
      lowerIsBetter: LOWER_IS_BETTER[a.key],
    }));
  };

  const metricsKeys = Object.keys(LABEL_MAP);

  // Build care pathway funnel data from simulation metrics
  const buildFunnelData = (sim: SimulationRunRecord) => [
    { stage: 'Screened', baseline: 100, screenlit: 100, fill: '#3b5bf5' },
    { stage: 'Acknowledged', baseline: 31.4, screenlit: sim.metrics.acknowledgementRatePercent.median, fill: '#6366f1' },
    { stage: 'Referred', baseline: 44.2, screenlit: sim.metrics.referralCompletionPercent.median * sim.metrics.acknowledgementRatePercent.median / 100, fill: '#8b5cf6' },
    { stage: 'Appointment', baseline: 52.8 * 0.44, screenlit: sim.metrics.appointmentCompletionPercent.median * sim.metrics.referralCompletionPercent.median / 100, fill: '#a855f7' },
    { stage: 'Treatment', baseline: 38.6, screenlit: sim.metrics.treatmentInitiationPercent.median * sim.metrics.appointmentCompletionPercent.median / 100, fill: '#d4f933' },
    { stage: 'Closed', baseline: 18.2, screenlit: sim.metrics.documentedClosureRatePercent.median, fill: '#10b981' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-slate-700 border-t-[#d4f933] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold">Loading population simulation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      {/* Permanent evidence banner */}
      <div className="bg-amber-950/40 border border-amber-700/50 rounded-2xl p-3.5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
            Simulated results, not clinical evidence.
          </p>
          <p className="text-xs text-amber-200/70 mt-0.5">
            All metrics are outputs of a Monte Carlo simulation over 2,000 synthetic adults across {simulation?.replicationsCount || 50} replications.
            These projections are based on documented literature assumptions and do not constitute clinical trial evidence.
          </p>
        </div>
      </div>

      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141923] border border-slate-800/80 rounded-3xl p-5 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white">Population Health Impact Simulation</h2>
            <span className="px-2.5 py-0.5 bg-[#d4f933]/15 text-[#d4f933] border border-[#d4f933]/30 text-[10px] font-extrabold rounded-full uppercase">
              Synthetic Cohort
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Cohort: {simulation?.cohortSize?.toLocaleString() || '2,000'} synthetic adults ·
            Replications: {simulation?.replicationsCount || 50} ·
            Executed: {simulation ? new Date(simulation.executedAt).toLocaleString() : 'Not run yet'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAssumptions(true)}
            className="px-4 py-2.5 bg-[#10141d] hover:bg-[#161c28] border border-slate-800 text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-[#3b5bf5]" />
            <span>View Model Assumptions</span>
          </button>
          <button
            type="button"
            onClick={rerunSimulation}
            disabled={rerunning}
            className="px-4 py-2.5 bg-[#d4f933] hover:bg-[#c2e726] text-black font-extrabold text-xs rounded-2xl transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${rerunning ? 'animate-spin' : ''}`} />
            <span>{rerunning ? 'Simulating...' : 'Re-run Simulation'}</span>
          </button>
        </div>
      </div>

      {simulation ? (
        <>
          {/* Screening to Closure Funnel — the core challenge narrative */}
          <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-base text-white">Screening to Closure: Care Pathway Funnel</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Percentage of 2,000 adults reaching each care milestone. Standard care vs Screenlit coordination.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-600 inline-block" />Standard Care</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#d4f933] inline-block" />Screenlit</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={buildFunnelData(simulation)}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                barGap={4}
                barCategoryGap="25%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2738" vertical={false} />
                <XAxis dataKey="stage" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  domain={[0, 100]}
                  unit="%"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ background: '#141923', border: '1px solid #334155', borderRadius: 12, fontSize: 11 }}
                  labelStyle={{ color: '#f1f5f9', fontWeight: 700 }}
                  formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name === 'baseline' ? 'Standard Care' : 'Screenlit']}
                />
                <Bar dataKey="baseline" name="baseline" fill="#334155" radius={[4, 4, 0, 0]} />
                <Bar dataKey="screenlit" name="screenlit" radius={[4, 4, 0, 0]}>
                  {buildFunnelData(simulation).map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Drop-off callout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800">
              {buildFunnelData(simulation).slice(1).map((stage) => {
                const gap = stage.screenlit - stage.baseline;
                return (
                  <div key={stage.stage} className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-300">{stage.stage}:</span>
                    <span className={`font-extrabold ${gap > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {gap > 0 ? '+' : ''}{gap.toFixed(1)}pp
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 text-center">
              pp = percentage points difference. Simulated results, not clinical evidence.
            </p>
          </div>

          {/* 9 KPI Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {metricsKeys.map((key) => {
              const metrics = (simulation.metrics as any)[key];
              const assumption = assumptions.find((a) => a.key === key);
              if (!metrics) return null;
              return (
                <KpiCard
                  key={key}
                  label={LABEL_MAP[key]}
                  baselineRate={assumption?.baselineRate ?? 0}
                  screenlitMedian={metrics.median}
                  p5={metrics.p5}
                  p95={metrics.p95}
                  unit={UNIT_MAP[key] || ''}
                  lowerIsBetter={LOWER_IS_BETTER[key]}
                />
              );
            })}
          </div>

          {/* Bar chart: Baseline vs Screenlit comparison */}
          <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                Baseline vs Screenlit: Rate Comparison
              </h3>
              <span className="text-[11px] text-slate-500">
                Percentage point outcomes (% metrics only)
              </span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={assumptions
                  .filter((a) => !a.key.includes('Hours') && !a.key.includes('Days'))
                  .map((a) => ({
                    name: LABEL_MAP[a.key]?.replace(' ', '\n') || a.key,
                    Baseline: a.baselineRate,
                    Screenlit: (simulation.metrics as any)[a.key]?.median ?? a.screenlitRate,
                  }))}
                margin={{ top: 5, right: 10, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2738" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 9 }}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{ background: '#141923', border: '1px solid #334155', borderRadius: 12, fontSize: 11 }}
                  labelStyle={{ color: '#f1f5f9', fontWeight: 700 }}
                  formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                />
                <Bar dataKey="Baseline" fill="#334155" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Screenlit" fill="#d4f933" radius={[4, 4, 0, 0]}>
                  {assumptions
                    .filter((a) => !a.key.includes('Hours') && !a.key.includes('Days'))
                    .map((a, index) => (
                      <Cell
                        key={index}
                        fill={LOWER_IS_BETTER[a.key] ? '#f87171' : '#d4f933'}
                      />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-slate-500 text-center">
              Bars in yellow = higher is better (completion rates). Bars in red = lower is better (unresolved cases).
            </p>
          </div>

          {/* Time metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#d4f933]" />
                Time to Notification
              </h4>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] text-slate-500">Baseline</p>
                  <p className="text-3xl font-black text-slate-400">72<span className="text-sm font-normal">h</span></p>
                </div>
                <div className="text-2xl text-slate-700">→</div>
                <div>
                  <p className="text-[10px] text-[#d4f933]">Screenlit median</p>
                  <p className="text-3xl font-black text-emerald-400">
                    {simulation.metrics.timeToNotificationHours.median.toFixed(1)}
                    <span className="text-sm font-normal">h</span>
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                p5: {simulation.metrics.timeToNotificationHours.p5.toFixed(1)}h ·
                p95: {simulation.metrics.timeToNotificationHours.p95.toFixed(1)}h
              </p>
            </div>

            <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#d4f933]" />
                Time to Consultation
              </h4>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] text-slate-500">Baseline</p>
                  <p className="text-3xl font-black text-slate-400">26.5<span className="text-sm font-normal">d</span></p>
                </div>
                <div className="text-2xl text-slate-700">→</div>
                <div>
                  <p className="text-[10px] text-[#d4f933]">Screenlit median</p>
                  <p className="text-3xl font-black text-emerald-400">
                    {simulation.metrics.timeToConsultationDays.median.toFixed(1)}
                    <span className="text-sm font-normal">d</span>
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                p5: {simulation.metrics.timeToConsultationDays.p5.toFixed(1)}d ·
                p95: {simulation.metrics.timeToConsultationDays.p95.toFixed(1)}d
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-10 text-center space-y-4">
          <Activity className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400">No simulation data loaded. Run the simulation to generate projections.</p>
          <button
            type="button"
            onClick={rerunSimulation}
            disabled={rerunning}
            className="px-5 py-2.5 bg-[#d4f933] hover:bg-[#c2e726] text-black font-extrabold text-sm rounded-2xl transition mx-auto flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${rerunning ? 'animate-spin' : ''}`} />
            <span>{rerunning ? 'Running...' : 'Run Population Simulation'}</span>
          </button>
        </div>
      )}

      {/* Model Assumptions Modal */}
      {showAssumptions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141923] border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#d4f933]" />
                  Model Assumptions and Literature Sources
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Documented baseline and projected Screenlit rates with intended literature citations
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssumptions(false)}
                className="p-1 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-3">
              {assumptions.map((a) => (
                <div
                  key={a.key}
                  className="bg-[#10141d] border border-slate-800 rounded-2xl p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{LABEL_MAP[a.key] || a.key}</span>
                    <span className="text-[10px] text-slate-500 font-mono uppercase">{a.key}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 bg-[#141923] rounded-xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 mb-0.5">Baseline (Standard Care)</p>
                      <p className="font-black text-slate-300">
                        {a.baselineRate.toFixed(1)}{UNIT_MAP[a.key] || ''}
                      </p>
                    </div>
                    <div className="p-2.5 bg-[#141923] rounded-xl border border-slate-800">
                      <p className="text-[10px] text-[#d4f933] mb-0.5">Projected Screenlit Rate</p>
                      <p className="font-black text-emerald-400">
                        {a.screenlitRate.toFixed(1)}{UNIT_MAP[a.key] || ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-400">
                    <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5 text-[#3b5bf5]" />
                    <span className="text-[11px] italic">{a.intendedSource}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
              All assumptions require validation against primary clinical literature before use in regulatory or payer submissions.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
