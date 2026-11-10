/**
 * Screenlit Clinical Coordination Command Centre
 * Central staff portal with Doctor Workstation dashboard layout matching the clinical design
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CaseDocument, FHIRAuditEvent } from '@shared/types';
import { DoctorWorkstationView } from './DoctorWorkstationView';
import { QueuesView } from './QueuesView';
import { TimelineView } from './TimelineView';
import { AuditLogView } from './AuditLogView';
import { OutboxView } from './OutboxView';
import {
  Activity,
  ArrowLeft,
  Clock,
  FileCheck,
  FileText,
  Filter,
  Layers,
  LayoutDashboard,
  ListOrdered,
  LogIn,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';

export const CommandCentre: React.FC = () => {
  const { currentUser, setCurrentUser, availableUsers } = useApp();
  const [activeTab, setActiveTab] = useState<
    'workstation' | 'queues' | 'timeline' | 'audits' | 'outbox'
  >('workstation');

  const [cases, setCases] = useState<CaseDocument[]>([]);
  const [audits, setAudits] = useState<FHIRAuditEvent[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseDocument | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const casesRes = await fetch('/api/cases');
      if (casesRes.ok) {
        const data = await casesRes.json();
        setCases(data.cases || []);
        if (data.cases && data.cases.length > 0) {
          if (!selectedCase) {
            setSelectedCase(data.cases[0]);
          } else {
            // refresh active selected case
            const updated = data.cases.find((c: CaseDocument) => c.id === selectedCase.id);
            if (updated) setSelectedCase(updated);
          }
        }
      }

      const auditsRes = await fetch('/api/demo/audits');
      if (auditsRes.ok) {
        const data = await auditsRes.json();
        setAudits(data.audits || []);
      }
    } catch (err) {
      console.error('Failed to load command centre data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectCase = (c: CaseDocument) => {
    setSelectedCase(c);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Top Header Card in Obsidian Glass */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141923] p-4 sm:p-5 rounded-3xl border border-slate-800/80 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#3b5bf5] to-[#d4f933] p-0.5 shadow-lg flex-shrink-0">
            <div className="w-full h-full rounded-2xl bg-[#0e131d] flex items-center justify-center text-white">
              <Stethoscope className="w-5 h-5 text-[#d4f933]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white leading-tight">
                Screenlit Clinical Workstation
              </h2>
              <span className="px-2.5 py-0.5 bg-[#3b5bf5]/20 text-[#3b5bf5] border border-[#3b5bf5]/30 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                Staff Portal
              </span>
              <span className="px-2.5 py-0.5 bg-[#d4f933]/15 text-[#d4f933] border border-[#d4f933]/30 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                Firestore Live
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Future Health Population Screening to Care Loop Coordinator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="text-xs font-bold text-slate-400">Staff Identity:</label>
          <select
            value={currentUser.uid}
            onChange={(e) => {
              const u = availableUsers.find((user) => user.uid === e.target.value);
              if (u) setCurrentUser(u);
            }}
            className="bg-[#10141d] hover:bg-[#161c28] border border-slate-800 rounded-2xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#d4f933] transition cursor-pointer"
          >
            {availableUsers
              .filter((u) => u.role !== 'patient' && u.role !== 'caregiver')
              .map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName} ({u.role})
                </option>
              ))}
          </select>
          <button
            type="button"
            onClick={loadData}
            className="p-2.5 bg-[#10141d] hover:bg-[#161c28] border border-slate-800 text-slate-300 hover:text-white rounded-2xl transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d4f933]' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.pathname = '/login';
            }}
            className="px-3 py-2 bg-[#10141d] hover:bg-[#161c28] border border-slate-800 text-slate-300 hover:text-white rounded-2xl transition flex items-center gap-1.5 text-xs font-bold"
            title="Switch Account on Login Dashboard"
          >
            <LogIn className="w-3.5 h-3.5 text-[#d4f933]" />
            <span className="hidden sm:inline">Switch Account</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('workstation')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap shadow-sm ${
            activeTab === 'workstation'
              ? 'bg-[#d4f933] text-black shadow-md'
              : 'bg-[#141923] text-slate-300 hover:text-white border border-slate-800/80 hover:bg-[#18202d]'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Doctor Workstation ({cases.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('queues')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'queues'
              ? 'bg-[#d4f933] text-black shadow-md'
              : 'bg-[#141923] text-slate-300 hover:text-white border border-slate-800/80 hover:bg-[#18202d]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Queue View</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'bg-[#d4f933] text-black shadow-md'
              : 'bg-[#141923] text-slate-300 hover:text-white border border-slate-800/80 hover:bg-[#18202d]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Timeline View {selectedCase ? `(${selectedCase.id})` : ''}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audits')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'audits'
              ? 'bg-[#d4f933] text-black shadow-md'
              : 'bg-[#141923] text-slate-300 hover:text-white border border-slate-800/80 hover:bg-[#18202d]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Audit Log Trail ({audits.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('outbox')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'outbox'
              ? 'bg-[#d4f933] text-black shadow-md'
              : 'bg-[#141923] text-slate-300 hover:text-white border border-slate-800/80 hover:bg-[#18202d]'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Notification Outbox</span>
        </button>
      </div>

      {/* Main Tab Views */}
      <div>
        {activeTab === 'workstation' && (
          <DoctorWorkstationView
            cases={cases}
            selectedCase={selectedCase}
            onSelectCase={handleSelectCase}
            audits={audits}
            onRefresh={loadData}
            currentRole={currentUser.role}
            currentUid={currentUser.uid}
          />
        )}

        {activeTab === 'queues' && (
          <QueuesView
            cases={cases}
            onSelectCase={(c) => {
              setSelectedCase(c);
              setActiveTab('workstation');
            }}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'timeline' && selectedCase && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setActiveTab('workstation')}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Doctor Workstation
            </button>
            <TimelineView
              caseDoc={selectedCase}
              audits={audits}
              onRefresh={loadData}
              currentRole={currentUser.role}
              currentUid={currentUser.uid}
            />
          </div>
        )}

        {activeTab === 'audits' && <AuditLogView />}

        {activeTab === 'outbox' && <OutboxView />}
      </div>
    </div>
  );
};
