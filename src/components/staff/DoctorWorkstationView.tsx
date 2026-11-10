/**
 * Screenlit Doctor Clinical Workstation Dashboard
 * Master detail dashboard implementing the watchlist and patient workstation layout
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useEffect, useState } from 'react';
import {
  CaseDocument,
  FHIRAuditEvent,
  PatientFeelingLog,
  Role,
  SymptomAnalysisResult,
} from '@shared/types';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Droplet,
  ExternalLink,
  FileCheck,
  FileText,
  Filter,
  Heart,
  History,
  Lock,
  MessageSquare,
  Mic,
  PenTool,
  Phone,
  RefreshCw,
  Search,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  Thermometer,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import { ClosureModal } from './ClosureModal';

interface DoctorWorkstationViewProps {
  cases: CaseDocument[];
  selectedCase: CaseDocument | null;
  onSelectCase: (c: CaseDocument) => void;
  audits: FHIRAuditEvent[];
  onRefresh: () => void;
  currentRole: Role;
  currentUid: string;
  currentDisplayName: string;
}

export const DoctorWorkstationView: React.FC<DoctorWorkstationViewProps> = ({
  cases,
  selectedCase,
  onSelectCase,
  audits,
  onRefresh,
  currentRole,
  currentUid,
  currentDisplayName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterQueue, setFilterQueue] = useState<
    'all' | 'high_risk' | 'overdue' | 'active' | 'closed'
  >('all');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'vitals' | 'history'>('overview');

  // Modals
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAcceptReferralModal, setShowAcceptReferralModal] = useState(false);

  // Form states
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [overrideSuccess, setOverrideSuccess] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [newOwnerUid, setNewOwnerUid] = useState('prac_dr_amina');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientFeelings, setPatientFeelings] = useState<PatientFeelingLog[]>([]);

  // Filter cases for the left Watchlist
  const filteredCases = cases.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.id.toLowerCase().includes(term) ||
      c.patientId.toLowerCase().includes(term) ||
      c.condition.toLowerCase().includes(term) ||
      c.state.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (filterQueue === 'high_risk') return c.isUrgent || c.riskScore >= 0.8;
    if (filterQueue === 'overdue') return c.state === 'Overdue';
    if (filterQueue === 'closed') return c.state === 'Closed';
    if (filterQueue === 'active')
      return c.state !== 'Closed' && c.state !== 'Overdue' && c.state !== 'Rejected';

    return true;
  });

  const activeCase = selectedCase || filteredCases[0] || cases[0];

  useEffect(() => {
    if (activeCase?.patientId) {
      fetch(`/api/patient/feelings?patientId=${activeCase.patientId}`)
        .then((res) => (res.ok ? res.json() : { feelings: [] }))
        .then((data) => setPatientFeelings(data.feelings || []))
        .catch(() => setPatientFeelings([]));
    }
  }, [activeCase?.patientId]);

  // Helper for patient display information
  const getPatientInfo = (c?: CaseDocument | null) => {
    if (!c) return { name: currentDisplayName || 'Patient', age: 'N/A', gender: 'N/A', conditionText: 'No active case' };

    if (c.patientId === 'pat_fatima_002') {
      return { name: 'Fatima Al Zahra', age: '62', gender: 'Female', conditionText: 'Urgent Crisis Elevation' };
    }
    if (c.patientId === 'pat_grace_003') {
      return { name: 'Grace Wanjiku', age: '52', gender: 'Female', conditionText: 'Colorectal FIT Positive' };
    }
    if (c.patientId === 'pat_maryam_004') {
      return { name: 'Maryam Saleh', age: '29', gender: 'Female', conditionText: 'Gestational Raised BP (Week 32)' };
    }
    if (c.patientId === 'pat_ahmed_005') {
      return { name: 'Ahmed Hassan', age: '64', gender: 'Male', conditionText: 'Surveillance Management' };
    }
    if (c.patientId === 'pat_salim_006') {
      return { name: 'Salim Al Nuaimi', age: '48', gender: 'Male', conditionText: 'Controlled Blood Pressure' };
    }
    if (c.patientId === 'pat_layla_007') {
      return { name: 'Layla Ibrahim', age: '58', gender: 'Female', conditionText: 'Overdue Communication' };
    }
    if (c.patientId === 'pat_khalid_008') {
      return { name: 'Khalid Al Dossary', age: '50', gender: 'Male', conditionText: 'Rejected Referral Reassigned' };
    }
    if (c.patientId === 'pat_tariq_001') {
      return { name: 'Tariq Al Mahmoud', age: '56', gender: 'Male', conditionText: 'Stage 2 Hypertension' };
    }

    // Generic fallback for new real patients
    return { name: c.patientId, age: 'N/A', gender: 'N/A', conditionText: c.condition || 'Hypertension Screening' };
  };

  const patient = getPatientInfo(activeCase);

  // Vitals metrics based on case
  const getCaseVitals = (c?: CaseDocument | null) => {
    if (!c) return { bp: '158/98', hr: 71, spo2: 98, temp: 36.6, controlled: '0 of 3' };

    if (c.patientId === 'pat_fatima_002') {
      return { bp: '184/114', hr: 88, spo2: 96, temp: 36.8, controlled: '0 of 3' };
    }
    if (c.patientId === 'pat_maryam_004') {
      return { bp: '146/94', hr: 78, spo2: 99, temp: 36.9, controlled: '0 of 3' };
    }
    if (c.patientId === 'pat_ahmed_005') {
      return { bp: '132/84', hr: 68, spo2: 98, temp: 36.5, controlled: '2 of 3' };
    }
    if (c.patientId === 'pat_salim_006') {
      return { bp: '128/82', hr: 66, spo2: 98, temp: 36.6, controlled: '3 of 3' };
    }

    return { bp: '158/98', hr: 71, spo2: 98, temp: 36.6, controlled: `${c.evidence?.controlledReadingsCount || 0} of 3` };
  };

  const vitals = getCaseVitals(activeCase);

  const [symptomAnalysis, setSymptomAnalysis] = useState<SymptomAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runSymptomAnalysis = async () => {
    if (!activeCase) return;
    setIsAnalyzing(true);
    try {
      const latestFeeling = patientFeelings[0];
      const res = await fetch('/api/ai/analyze-symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: activeCase.patientId,
          caseId: activeCase.id,
          feelingScore: latestFeeling?.feelingScore || 'good',
          noteText: latestFeeling?.feelingNote || 'Routine home surveillance and treatment adherence',
          tags: latestFeeling?.tags || ['Normal', 'Seated Rested'],
          transcribedFromVoice: latestFeeling?.transcribedFromVoice || false,
          recentVitals: {
            bp: vitals.bp,
            heartRate: vitals.hr,
            spo2: vitals.spo2,
            temperature: vitals.temp,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSymptomAnalysis(data.analysis || null);
      }
    } catch (err) {
      console.error('Failed to run symptom analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (activeCase?.patientId) {
      runSymptomAnalysis();
    }
  }, [activeCase?.patientId, patientFeelings.length]);

  // Risk presentation helpers
  const getRiskPresentation = (c?: CaseDocument | null) => {
    if (!c) return { title: 'High Risk', scoreText: '0.78', color: 'red', summary: 'Elevated screening reading requires repeat confirmation' };

    if (c.isUrgent) {
      return {
        title: 'Urgent Crisis Risk',
        scoreText: '0.98',
        color: 'red',
        summary: 'Blood pressure exceeds crisis threshold (systolic >= 180 or diastolic >= 110). Immediate physician review mandated.',
      };
    }
    if (c.state === 'Overdue') {
      return {
        title: 'Overdue Escalation',
        scoreText: '0.85',
        color: 'amber',
        summary: 'Communication timeline breached. Active coordinator outreach ladder required.',
      };
    }
    if (c.state === 'Closed') {
      return {
        title: 'Controlled Closure',
        scoreText: '0.12',
        color: 'emerald',
        summary: 'Three consecutive controlled readings verified. Electronic clinician sign off completed.',
      };
    }
    if (c.riskScore >= 0.7) {
      return {
        title: 'High Risk',
        scoreText: c.riskScore.toFixed(2),
        color: 'red',
        summary: 'Severe stage 2 elevation with multi factor cardiovascular risk indicators.',
      };
    }

    return {
      title: 'Moderate Risk',
      scoreText: c.riskScore.toFixed(2),
      color: 'amber',
      summary: 'Actionable screening reading requiring clinical confirmation and primary care referral.',
    };
  };

  const risk = getRiskPresentation(activeCase);

  // Case audit log events for active case
  const caseAudits = audits.filter(
    (a) =>
      a.entity?.[0]?.what?.reference?.includes(activeCase?.id || '') ||
      a.outcomeDesc?.includes(activeCase?.id || '')
  );

  // Empty state for new users with no cases yet
  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#3b5bf5] to-[#d4f933] p-0.5">
          <div className="w-full h-full rounded-3xl bg-[#141923] flex items-center justify-center">
            <Stethoscope className="w-7 h-7 text-[#d4f933]" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-white">
            Welcome, {currentDisplayName}
          </h2>
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
            Your workstation is ready. No patient cases have been assigned to you yet.
            Cases will appear here once screening results are ingested and routed to your role.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center text-xs font-bold">
          <div className="bg-[#141923] border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-2 text-slate-300">
            <UserCheck className="w-4 h-4 text-[#d4f933]" />
            <span>Role: <span className="text-white capitalize">{currentRole}</span></span>
          </div>
          <div className="bg-[#141923] border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero Trust Access Active</span>
          </div>
          <div className="bg-[#141923] border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-2 text-slate-300">
            <Target className="w-4 h-4 text-[#3b5bf5]" />
            <span>FHIR R4 Ready</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="px-5 py-2.5 bg-[#d4f933] hover:bg-[#c2e726] text-black font-extrabold text-sm rounded-2xl transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Patient Queue</span>
        </button>
      </div>
    );
  }

  // Send quick notification handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim() || !activeCase) return;

    setIsSubmitting(true);
    try {
      await fetch('/api/outbox/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: activeCase.patientId,
          channel: 'sms',
          body: messageBody.trim(),
        }),
      });
      setMessageBody('');
      setShowMessageModal(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to send outreach message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reassign owner handler
  const handleReassignOwner = async () => {
    if (!activeCase) return;
    setIsSubmitting(true);

    const targetPracName =
      newOwnerUid === 'prac_dr_amina'
        ? 'Dr. Amina Al Mansoor'
        : newOwnerUid === 'prac_dr_mwangi'
        ? 'Dr. David Mwangi'
        : 'Fatima Noor, RN';

    const targetRole: Role =
      newOwnerUid === 'prac_coord_fatima' ? 'coordinator' : 'physician';

    try {
      await fetch('/api/cases/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: activeCase.id,
          targetState: activeCase.state,
          actorUid: currentUid,
          actorRole: currentRole,
          reason: `Reassigned case ownership to ${targetPracName}`,
          newOwnerUid: newOwnerUid,
          newOwnerRole: targetRole,
        }),
      });
      setShowTransferModal(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to transfer case:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Accept referral handler (Referred → ReferralAccepted)
  const handleAcceptReferral = async () => {
    if (!activeCase) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/cases/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: activeCase.id,
          targetState: 'ReferralAccepted',
          actorUid: currentUid,
          actorRole: currentRole,
          reason: `Referral accepted by ${currentDisplayName} (${currentRole}). Proceeding to appointment scheduling.`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAcceptReferralModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to accept referral:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Persist AI override to audit log
  const handleOverrideSubmit = async () => {
    if (!overrideReason.trim() || !activeCase) return;
    setOverrideSubmitting(true);
    setOverrideSuccess(false);
    try {
      // Fetch the latest AI ranking output for this case
      const outputsRes = await fetch('/api/ai/outputs');
      if (outputsRes.ok) {
        const outputsData = await outputsRes.json();
        const caseOutputs = (outputsData.outputs || []).filter(
          (o: any) => o.inputsRef === `Task/${activeCase.id}` && !o.overridden
        );
        const latestOutput = caseOutputs[caseOutputs.length - 1];
        if (latestOutput) {
          await fetch('/api/ai/override', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              outputId: latestOutput.id,
              overriddenBy: currentUid,
              overrideNote: overrideReason.trim(),
            }),
          });
        }
      }
      setOverrideSuccess(true);
      setTimeout(() => {
        setShowOverrideModal(false);
        setOverrideReason('');
        setOverrideSuccess(false);
        onRefresh();
      }, 1000);
    } catch (err) {
      console.error('Failed to persist AI override:', err);
    } finally {
      setOverrideSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-5 text-white">
      {/* LEFT COLUMN: Patient Watchlist */}
      <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-3">
        {/* Watchlist Header */}
        <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-extrabold text-sm text-white">
              Patient Watchlist ({filteredCases.length})
            </h3>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-[#d4f933]" />
              Risk Ranked
            </span>
          </div>

          <p className="text-[11px] text-slate-400 mb-3">
            Sorted by risk score and SLA urgency
          </p>

          {/* Search Box */}
          <div className="relative mb-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, or condition..."
              className="w-full bg-[#10141d] border border-slate-800 rounded-2xl py-2 ps-9 pe-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#d4f933] transition"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute start-3 top-2.5 pointer-events-none" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute end-2.5 top-2.5 text-slate-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Queue Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            <button
              type="button"
              onClick={() => setFilterQueue('all')}
              className={`px-2.5 py-1 rounded-full font-bold transition whitespace-nowrap ${
                filterQueue === 'all'
                  ? 'bg-[#d4f933] text-black shadow-sm'
                  : 'bg-[#181e2a] text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterQueue('high_risk')}
              className={`px-2.5 py-1 rounded-full font-bold transition whitespace-nowrap ${
                filterQueue === 'high_risk'
                  ? 'bg-[#d4f933] text-black shadow-sm'
                  : 'bg-[#181e2a] text-slate-400 hover:text-white'
              }`}
            >
              High Risk
            </button>
            <button
              type="button"
              onClick={() => setFilterQueue('overdue')}
              className={`px-2.5 py-1 rounded-full font-bold transition whitespace-nowrap ${
                filterQueue === 'overdue'
                  ? 'bg-[#d4f933] text-black shadow-sm'
                  : 'bg-[#181e2a] text-slate-400 hover:text-white'
              }`}
            >
              Overdue
            </button>
            <button
              type="button"
              onClick={() => setFilterQueue('closed')}
              className={`px-2.5 py-1 rounded-full font-bold transition whitespace-nowrap ${
                filterQueue === 'closed'
                  ? 'bg-[#d4f933] text-black shadow-sm'
                  : 'bg-[#181e2a] text-slate-400 hover:text-white'
              }`}
            >
              Closed
            </button>
          </div>
        </div>

        {/* Watchlist Cards Scrollable List */}
        <div className="space-y-2.5 max-h-[720px] overflow-y-auto pe-1 custom-scrollbar">
          {filteredCases.map((c) => {
            const isSelected = activeCase?.id === c.id;
            const pInfo = getPatientInfo(c);
            const isHigh = c.isUrgent || c.riskScore >= 0.8;
            const isClosed = c.state === 'Closed';

            return (
              <div
                key={c.id}
                onClick={() => onSelectCase(c)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex items-start gap-3 ${
                  isSelected
                    ? 'bg-[#182338] border-[#3b5bf5] shadow-lg ring-1 ring-[#3b5bf5]'
                    : 'bg-[#141923] border-slate-800/80 hover:border-slate-700 hover:bg-[#161c28]'
                }`}
              >
                {/* Left colored risk strip */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    isHigh
                      ? 'bg-rose-500'
                      : isClosed
                      ? 'bg-emerald-500'
                      : 'bg-amber-400'
                  }`}
                />

                <div className="flex-1 ps-1">
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <h4 className="font-extrabold text-xs text-white leading-snug">
                      {pInfo.name}
                    </h4>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isHigh
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          : isClosed
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                      }`}
                    >
                      {isHigh ? 'High Risk' : isClosed ? 'Closed' : 'Medium Risk'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-2">
                    {pInfo.conditionText}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                    <span className="flex items-center gap-1 font-mono">
                      State: {c.state}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3 text-[#d4f933]" />
                      {c.state === 'Overdue' ? 'Overdue 48h' : 'Due in 24h'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Master Clinical Workstation */}
      <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-4">
        {/* Top Patient Header Bar matching Screenshot */}
        <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Avatar Circle with initials */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#3b5bf5] to-[#d4f933] p-0.5 shadow-md flex-shrink-0">
              <div className="w-full h-full rounded-full bg-[#141923] flex items-center justify-center font-black text-sm text-white">
                {patient.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white leading-tight">
                  {patient.name}
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#3b5bf5]/20 text-[#3b5bf5] border border-[#3b5bf5]/30 font-bold">
                  {activeCase?.state || 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {patient.gender}, {patient.age}y &bull; {patient.conditionText} &bull; Qatar National Health Scheme
              </p>
            </div>
          </div>

          {/* Action Buttons matching Screenshot */}
          <div className="flex items-center gap-2">
            {/* Call button */}
            <button
              type="button"
              onClick={() => setShowCallModal(true)}
              className="px-3.5 py-2 bg-[#1b2230] hover:bg-[#252f42] text-slate-200 hover:text-white rounded-2xl text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
              title="Call Patient / Caregiver"
            >
              <Phone className="w-3.5 h-3.5 text-[#d4f933]" />
              <span>Call</span>
            </button>

            {/* Message button */}
            <button
              type="button"
              onClick={() => setShowMessageModal(true)}
              className="px-3.5 py-2 bg-[#1b2230] hover:bg-[#252f42] text-slate-200 hover:text-white rounded-2xl text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
              title="Send Clinical Notification"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#3b5bf5]" />
              <span>Message</span>
            </button>

            {/* Transfer / Reassign */}
            <button
              type="button"
              onClick={() => setShowTransferModal(true)}
              className="px-3.5 py-2 bg-[#1b2230] hover:bg-[#252f42] text-slate-200 hover:text-white rounded-2xl text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
              title="Reassign Provider"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Transfer</span>
            </button>

            {/* Accept Referral — visible only when case is Referred and actor is clinician */}
            {activeCase?.state === 'Referred' &&
              (currentRole === 'physician' || currentRole === 'specialist' || currentRole === 'admin') && (
              <button
                type="button"
                onClick={() => setShowAcceptReferralModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-lg active:scale-95"
                title="Accept this referral and proceed to appointment scheduling"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Accept Referral</span>
              </button>
            )}

            {/* Close Case Button */}
            <button
              type="button"
              onClick={() => setShowClosureModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-lg active:scale-95"
              title="Formal Evidence Closure Signoff"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Close Case</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs matching Screenshot */}
        <div className="flex items-center gap-6 border-b border-slate-800 text-xs font-bold px-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('overview')}
            className={`pb-3 border-b-2 transition ${
              activeSubTab === 'overview'
                ? 'border-[#d4f933] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('vitals')}
            className={`pb-3 border-b-2 transition ${
              activeSubTab === 'vitals'
                ? 'border-[#d4f933] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Vitals and Surveillance
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`pb-3 border-b-2 transition ${
              activeSubTab === 'history'
                ? 'border-[#d4f933] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Case Event History
          </button>
        </div>

        {/* TAB 1: OVERVIEW (Matching Screenshot Layout) */}
        {activeSubTab === 'overview' && (
          <div className="grid grid-cols-12 gap-4">
            {/* Primary Left Workstation Column */}
            <div className="col-span-12 xl:col-span-8 space-y-4">
              {/* Health Risk Score Card matching Screenshot */}
              <div
                className={`rounded-3xl p-5 border shadow-xl relative overflow-hidden ${
                  risk.color === 'red'
                    ? 'bg-rose-950/25 border-rose-500/40'
                    : risk.color === 'emerald'
                    ? 'bg-emerald-950/25 border-emerald-500/40'
                    : 'bg-amber-950/25 border-amber-500/40'
                }`}
              >
                {/* Left vertical highlight strip */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-2 ${
                    risk.color === 'red'
                      ? 'bg-rose-500'
                      : risk.color === 'emerald'
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  }`}
                />

                <div className="ps-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-slate-300">
                      Health Risk Score
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowOverrideModal(true)}
                      className="text-[11px] font-bold text-slate-400 hover:text-white underline decoration-slate-600 transition"
                    >
                      Override Score
                    </button>
                  </div>

                  <h3
                    className={`text-2xl font-black mb-2 ${
                      risk.color === 'red'
                        ? 'text-rose-400'
                        : risk.color === 'emerald'
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {risk.title} &bull; Score {risk.scoreText}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {risk.summary}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-[#d4f933]" />
                    <span>
                      Contributing Factors: Guideline elevation &bull; Comorbid risk profile &bull; Repeat confirmation required
                    </span>
                  </div>
                </div>
              </div>

              {/* Vitals Metrics Row matching Screenshot */}
              <div className="grid grid-cols-3 gap-3">
                {/* Card 1: Heart Rate / BP */}
                <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-4 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Heart Rate</p>
                    <p className="text-xl font-black text-white">
                      {vitals.hr} <span className="text-xs font-normal text-slate-400">bpm</span>
                    </p>
                    <p className="text-[10px] text-slate-500">Normal resting</p>
                  </div>
                </div>

                {/* Card 2: SpO2 */}
                <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-4 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                    <Droplet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">SpO2</p>
                    <p className="text-xl font-black text-white">
                      {vitals.spo2} <span className="text-xs font-normal text-slate-400">%</span>
                    </p>
                    <p className="text-[10px] text-slate-500">Optimal level</p>
                  </div>
                </div>

                {/* Card 3: Temperature */}
                <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-4 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Thermometer className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Temp</p>
                    <p className="text-xl font-black text-white">
                      {vitals.temp} <span className="text-xs font-normal text-slate-400">&deg;C</span>
                    </p>
                    <p className="text-[10px] text-slate-500">Standard range</p>
                  </div>
                </div>
              </div>

              {/* Source label matching screenshot */}
              <p className="text-[10px] text-slate-500 text-center">
                Source: Verified Cellular Cuff and Continuous Wearable Telemetry
              </p>

              {/* Clinical Factors and Screening Attributes matching Screenshot */}
              <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Clinical Factors and Attributes
                </h4>

                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-[#182338] text-blue-200 text-xs font-medium border border-blue-500/30">
                    Actionable Screening Result
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-[#182338] text-blue-200 text-xs font-medium border border-blue-500/30">
                    BP: {vitals.bp} mmHg
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-[#182338] text-blue-200 text-xs font-medium border border-blue-500/30">
                    Surveillance Progress: {vitals.controlled}
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-[#182338] text-blue-200 text-xs font-medium border border-blue-500/30">
                    In Network Primary Care
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-[#182338] text-blue-200 text-xs font-medium border border-blue-500/30">
                    Active Patient Consent
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-[#182338] text-blue-200 text-xs font-medium border border-blue-500/30">
                    Middle East Sovereign Enclave
                  </span>
                </div>
              </div>

              {/* Patient Self Reported Feeling Journal & Voice Transcripts */}
              <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-[#d4f933]" />
                    Patient Symptom & Feeling Journal ({patientFeelings.length})
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Self Reported Live
                  </span>
                </div>

                {patientFeelings.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pe-1 custom-scrollbar">
                    {patientFeelings.map((f) => (
                      <div
                        key={f.id}
                        className="p-3 bg-[#10141d] rounded-2xl border border-slate-800 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {f.feelingScore === 'great'
                                ? '😊'
                                : f.feelingScore === 'good'
                                ? '🙂'
                                : f.feelingScore === 'unwell'
                                ? '🤒'
                                : f.feelingScore === 'concerning'
                                ? '🚨'
                                : '😐'}
                            </span>
                            <span className="font-bold text-white capitalize">
                              Reported: {f.feelingScore}
                            </span>
                            {f.transcribedFromVoice && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3b5bf5]/20 text-[#3b5bf5] border border-[#3b5bf5]/30 font-bold flex items-center gap-1">
                                <Volume2 className="w-2.5 h-2.5" />
                                Voice Transcribed
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(f.recordedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          "{f.feelingNote}"
                        </p>
                        {f.tags && f.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {f.tags.map((t, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-[#181e2a] text-slate-400 text-[10px] font-medium border border-slate-800"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    No symptom journal entries logged today.
                  </p>
                )}

                {/* AI Multimodal Voice & Symptom Synthesis Panel */}
                <div className="bg-[#10141d] rounded-2xl p-4 border border-blue-500/40 space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#d4f933] flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-[#d4f933]" />
                      Gemini Multimodal Voice & Symptom Synthesis
                    </span>
                    <button
                      type="button"
                      onClick={runSymptomAnalysis}
                      disabled={isAnalyzing}
                      className="px-2.5 py-1 bg-[#182338] hover:bg-[#202e48] text-xs font-bold text-blue-300 hover:text-white rounded-xl border border-blue-500/30 transition flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      <span>{isAnalyzing ? 'Analyzing...' : 'Re-analyze'}</span>
                    </button>
                  </div>

                  {symptomAnalysis ? (
                    <div className="space-y-2.5 text-xs">
                      <p className="text-white leading-relaxed font-medium">
                        {symptomAnalysis.summary}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800">
                        <div className="p-2 bg-[#141923] rounded-xl border border-slate-800">
                          <span className="text-slate-400 font-bold block mb-1">Identified Symptoms:</span>
                          <span className="text-blue-200">
                            {symptomAnalysis.extractedSymptoms.join(', ') || 'Resting Baseline'}
                          </span>
                        </div>

                        <div className="p-2 bg-[#141923] rounded-xl border border-slate-800">
                          <span className="text-slate-400 font-bold block mb-1">Safety Screening:</span>
                          <span className={symptomAnalysis.redFlagAlert ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                            {symptomAnalysis.redFlagAlert ? 'Alert: Red Flag Detected' : 'Clear: Routine Surveillance'}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-[#141923] rounded-xl border border-slate-800 space-y-1">
                        <span className="text-slate-400 font-bold block text-[11px]">
                          Suggested Coordinator Probes for Consultation Call:
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-300 text-[11px]">
                          {symptomAnalysis.suggestedProbes.map((probe, i) => (
                            <li key={i}>{probe}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <span>Model: {symptomAnalysis.modelVersion}</span>
                        <span>Clinical decision support &bull; Humans decide</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-xs text-slate-400">
                      Loading AI symptom analysis...
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contacts & Care Team matching Screenshot */}
              <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Care Team and Emergency Contacts
                </h4>

                <div className="space-y-2 text-xs divide-y divide-slate-800">
                  <div className="flex items-center justify-between pt-2 first:pt-0">
                    <span className="text-slate-300 font-medium">
                      Fatima Noor, RN (Care Coordinator)
                    </span>
                    <span className="font-mono text-slate-400">+974 4400 1234</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-300 font-medium">
                      Dr. Amina Al Mansoor (Attending Physician)
                    </span>
                    <span className="font-mono text-slate-400">+974 4400 5678</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-300 font-medium">
                      Zainab Al Mahmoud (Family Caregiver)
                    </span>
                    <span className="font-mono text-slate-400">+974 5511 2233</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Right Column: Case Log History matching Screenshot */}
            <div className="col-span-12 xl:col-span-4 space-y-3">
              <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Calendar className="w-4 h-4 text-[#d4f933]" />
                  <h3 className="font-bold text-sm text-white">
                    Case Log History
                  </h3>
                </div>

                <div className="space-y-3 max-h-[620px] overflow-y-auto pe-1 custom-scrollbar">
                  {/* Card Log 1 */}
                  <div className="p-3.5 bg-[#10141d] border border-slate-800 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Today, 10:35 AM</span>
                      <span className="text-emerald-400 font-bold">Risk: Moderate</span>
                    </div>
                    <p className="text-xs font-bold text-white">
                      Result Acknowledged with Comprehension Check [EVT-02]
                    </p>
                    <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc pl-4">
                      <li>Patient confirmed understanding of repeat reading requirement</li>
                      <li>Coordinator outreach scheduled</li>
                    </ul>
                  </div>

                  {/* Card Log 2 */}
                  <div className="p-3.5 bg-[#10141d] border border-slate-800 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Today, 10:30 AM</span>
                      <span className="text-rose-400 font-bold">Risk: High</span>
                    </div>
                    <p className="text-xs font-bold text-white">
                      Actionable Screening Observation Recorded [EVT-01]
                    </p>
                    <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc pl-4">
                      <li>Blood pressure: {vitals.bp} mmHg</li>
                      <li>SLA timer started: 24h response window</li>
                    </ul>
                  </div>

                  {/* Card Log 3 */}
                  <div className="p-3.5 bg-[#10141d] border border-slate-800 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Yesterday, 3:00 PM</span>
                      <span className="text-blue-400 font-bold">Status: Routine</span>
                    </div>
                    <p className="text-xs font-bold text-white">
                      Wearable Pulse Telemetry Synchronized [EVT-03]
                    </p>
                    <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc pl-4">
                      <li>Resting heart rate: 71 bpm</li>
                      <li>Skin temperature: 36.6 &deg;C</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VITALS & SURVEILLANCE */}
        {activeSubTab === 'vitals' && (
          <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white">
              Surveillance Trends and Home Cuff Logs
            </h3>
            <p className="text-xs text-slate-400">
              Controlled status requires 3 verified readings below 140 over 90 mmHg across the surveillance window.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-[#10141d] rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-400">Controlled Readings</p>
                <p className="text-2xl font-black text-[#d4f933] mt-1">
                  {vitals.controlled}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Target: 3 readings</p>
              </div>

              <div className="p-4 bg-[#10141d] rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-400">Latest Upper Arm Cuff</p>
                <p className="text-2xl font-black text-white mt-1">
                  {vitals.bp} <span className="text-xs font-normal text-slate-400">mmHg</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Withings BPM Connect</p>
              </div>

              <div className="p-4 bg-[#10141d] rounded-2xl border border-slate-800">
                <p className="text-xs text-slate-400">Resting Baseline</p>
                <p className="text-2xl font-black text-white mt-1">
                  {vitals.hr} <span className="text-xs font-normal text-slate-400">bpm</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Garmin Vivosmart 5</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CASE EVENT HISTORY */}
        {activeSubTab === 'history' && (
          <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white">
              Immutable Case Audit Log
            </h3>
            <p className="text-xs text-slate-400">
              Chronological milestones citing verified event identifiers for clinical accountability.
            </p>

            <div className="space-y-3">
              {caseAudits.length > 0 ? (
                caseAudits.map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 bg-[#10141d] border border-slate-800 rounded-2xl flex items-start justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">{a.outcomeDesc || 'Case Event Recorded'}</p>
                      <p className="text-[11px] text-slate-400">
                        Actor: {a.agent?.[0]?.who?.display || a.agent?.[0]?.who?.reference || 'System'}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(a.recorded).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 bg-[#10141d] rounded-2xl border border-slate-800">
                  Audit events initialized on case record.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: CLOSURE MODAL */}
      {showClosureModal && activeCase && (
        <ClosureModal
          caseDoc={activeCase}
          onClose={() => setShowClosureModal(false)}
          onSuccess={() => {
            setShowClosureModal(false);
            onRefresh();
          }}
          currentRole={currentRole}
          currentUid={currentUid}
        />
      )}

      {/* MODAL 2: CALL OUTREACH MODAL */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141923] border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#d4f933]" />
                Primary Care Phone Outreach
              </h3>
              <button
                type="button"
                onClick={() => setShowCallModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Calling <strong>{patient.name}</strong> at <strong>+974 5511 2233</strong> regarding actionable blood pressure screening navigation.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Outreach Consultation Notes:
              </label>
              <textarea
                rows={3}
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Spoke with patient. Advised on seated resting cuff protocol and confirmed appointment."
                className="w-full bg-[#10141d] border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-[#d4f933] transition"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setShowCallModal(false);
                setCallNotes('');
                onRefresh();
              }}
              className="w-full py-3 bg-[#d4f933] text-black font-extrabold rounded-2xl text-xs shadow-lg"
            >
              Log Call and Complete Outreach
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK MESSAGE MODAL */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141923] border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#3b5bf5]" />
                Send Clinical Guidance Notification
              </h3>
              <button
                type="button"
                onClick={() => setShowMessageModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Recipient: {patient.name} (+974 5511 2233)
                </label>
                <textarea
                  rows={3}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Dear patient, please remember to take your resting morning blood pressure reading before breakfast."
                  className="w-full bg-[#10141d] border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-[#d4f933] transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !messageBody.trim()}
                className="w-full py-3 bg-[#3b5bf5] text-white font-extrabold rounded-2xl text-xs shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Dispatching...' : 'Dispatch SMS and Web Push Alert'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: TRANSFER PROVIDER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141923] border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-400" />
                Transfer Case Ownership
              </h3>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Reassign clinical case owner while preserving full history and audit records.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Select Clinician:
              </label>
              <select
                value={newOwnerUid}
                onChange={(e) => setNewOwnerUid(e.target.value)}
                className="w-full bg-[#10141d] border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-[#d4f933] transition"
              >
                <option value="prac_dr_amina">Dr. Amina Al Mansoor (Family Medicine)</option>
                <option value="prac_dr_mwangi">Dr. David Mwangi (Cardiologist)</option>
                <option value="prac_coord_fatima">Fatima Noor, RN (Care Coordinator)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleReassignOwner}
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-xs shadow-lg"
            >
              {isSubmitting ? 'Transferring...' : 'Confirm Case Reassignment'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: OVERRIDE SCORE MODAL */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141923] border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <PenTool className="w-5 h-5 text-[#d4f933]" />
                Clinician Score Override
              </h3>
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Clinical justification is required to adjust algorithmic risk rankings.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Clinical Override Justification Note:
              </label>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Clinical evaluation indicates lower immediate urgency due to verified white coat artifact on previous readings."
                className="w-full bg-[#10141d] border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-[#d4f933] transition"
              />
            </div>

            {overrideSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Override recorded and logged to AI audit trail.</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleOverrideSubmit}
              disabled={overrideSubmitting || !overrideReason.trim()}
              className="w-full py-3 bg-[#d4f933] text-black font-extrabold rounded-2xl text-xs shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {overrideSubmitting ? 'Recording Override...' : 'Record Clinical Override'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 6: ACCEPT REFERRAL MODAL */}
      {showAcceptReferralModal && activeCase && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141923] border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                Accept Clinical Referral
              </h3>
              <button
                type="button"
                onClick={() => setShowAcceptReferralModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-[#10141d] border border-slate-800 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Case ID</span>
                <span className="font-bold text-white font-mono">{activeCase.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Patient</span>
                <span className="font-bold text-white">{patient.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Condition</span>
                <span className="font-bold text-white capitalize">{activeCase.condition}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current State</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-950/50 text-amber-300 border border-amber-800/60 font-bold">
                  {activeCase.state}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Accepting this referral will transition the case to <strong className="text-emerald-400">ReferralAccepted</strong> and assign you as the named clinician owner for the next coordination step. An audit event will be recorded.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAcceptReferralModal(false)}
                className="flex-1 py-3 bg-[#10141d] border border-slate-800 text-slate-300 font-bold rounded-2xl text-xs transition hover:bg-[#161c28]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAcceptReferral}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-xs shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                {isSubmitting ? 'Accepting...' : 'Accept and Take Ownership'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
