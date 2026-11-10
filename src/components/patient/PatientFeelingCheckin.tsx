/**
 * Screenlit Patient Feeling & Symptom Journal Checkin
 * Enables patients to log how they feel by typing and by voice recording with real time live transcription
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PatientFeelingLog, SymptomAnalysisResult } from '@shared/types';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
  History,
  Mic,
  MicOff,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Send,
  Settings,
  Shield,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';

interface PatientFeelingCheckinProps {
  onSuccess?: () => void;
  compact?: boolean;
}

const FEELING_OPTIONS: Array<{
  key: 'great' | 'good' | 'okay' | 'unwell' | 'concerning';
  label: string;
  emoji: string;
  color: string;
}> = [
  { key: 'great', label: 'Great', emoji: '😊', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30' },
  { key: 'good', label: 'Good', emoji: '🙂', color: 'border-blue-500/40 text-blue-400 bg-blue-950/30' },
  { key: 'okay', label: 'Okay', emoji: '😐', color: 'border-slate-700 text-slate-300 bg-slate-800/40' },
  { key: 'unwell', label: 'Unwell', emoji: '🤒', color: 'border-amber-500/40 text-amber-400 bg-amber-950/30' },
  { key: 'concerning', label: 'Concerning', emoji: '🚨', color: 'border-rose-500/40 text-rose-400 bg-rose-950/30' },
];

const QUICK_TAGS = [
  'Headache',
  'Mild Dizziness',
  'Fatigue',
  'Feeling Calm',
  'Shoulder Tension',
  'Chest Warmth',
  'Seated Rested',
  'Normal',
];

export const PatientFeelingCheckin: React.FC<PatientFeelingCheckinProps> = ({
  onSuccess,
  compact = false,
}) => {
  const { currentUser, activeCase } = useApp();

  const [selectedFeeling, setSelectedFeeling] = useState<
    'great' | 'good' | 'okay' | 'unwell' | 'concerning'
  >('good');
  const [typedNote, setTypedNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Seated Rested']);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [hasVoiceTranscript, setHasVoiceTranscript] = useState(false);
  const [liveInterim, setLiveInterim] = useState('');
  const [audioLevels, setAudioLevels] = useState<number[]>([15, 25, 40, 60, 30, 70, 50, 80, 45, 65, 35, 55, 25]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<SymptomAnalysisResult | null>(null);
  const [history, setHistory] = useState<PatientFeelingLog[]>([]);
  const [showHistory, setShowHistory] = useState(!compact);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [micMode, setMicMode] = useState<'idle' | 'hardware'>('idle');
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<
    'unknown' | 'prompt' | 'granted' | 'denied' | 'requesting'
  >('prompt');

  const isRecordingRef = useRef<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const speechRecognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const accumulatedFinalRef = useRef<string>('');

  // Check browser permission status for microphone on initial render
  useEffect(() => {
    let permObj: PermissionStatus | null = null;
    const probePermission = async () => {
      if (
        typeof navigator !== 'undefined' &&
        navigator.permissions &&
        navigator.permissions.query
      ) {
        try {
          const status = await navigator.permissions.query({ name: 'microphone' as any });
          permObj = status;
          setMicPermission(status.state as any);
          if (status.state === 'granted') {
            setMicMode('hardware');
            setMicNotice(null);
          } else if (status.state === 'denied') {
            setMicPermission('denied');
          }
          status.onchange = () => {
            setMicPermission(status.state as any);
            if (status.state === 'granted') {
              setMicMode('hardware');
              setMicNotice(null);
            }
          };
        } catch {
          setMicPermission('prompt');
        }
      }
    };
    probePermission();

    return () => {
      if (permObj) permObj.onchange = null;
    };
  }, []);

  // Explicit user action to request microphone permission from the browser
  const requestMicrophonePermission = async (): Promise<boolean> => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setMicPermission('denied');
      setMicNotice('Microphone device access is not supported in this browser window.');
      return false;
    }

    setMicPermission('requesting');
    setMicNotice(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop temporary stream tracks immediately after permission check
      stream.getTracks().forEach((track) => track.stop());
      setMicPermission('granted');
      setMicMode('hardware');
      setMicNotice(null);
      return true;
    } catch (err: any) {
      console.warn('Microphone permission request error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermission('denied');
        setMicNotice(
          'Microphone permission was denied. Please allow microphone access in your browser address bar settings.'
        );
      } else {
        setMicPermission('denied');
        setMicNotice('Microphone could not be accessed. Please verify that a microphone is plugged in and authorized.');
      }
      return false;
    }
  };

  // Load existing feeling history for this patient
  const loadFeelings = async () => {
    try {
      const res = await fetch(`/api/patient/feelings?patientId=${currentUser.uid}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.feelings || []);
      }
    } catch (err) {
      console.error('Failed to load feeling history:', err);
    }
  };

  useEffect(() => {
    loadFeelings();
  }, [currentUser.uid]);

  // Clean up all timers, audio context, and speech listeners on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {
          // Ignore
        }
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Start voice recording and live transcription in real time
  const startRecording = async () => {
    setRecordedAudioUrl(null);
    setAudioBase64(null);
    setRecordingSeconds(0);
    setLiveInterim('');
    setMicNotice(null);
    audioChunksRef.current = [];
    isRecordingRef.current = true;
    setIsRecording(true);
    accumulatedFinalRef.current = typedNote.trim();

    // Start timer counter
    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    let stream: MediaStream | null = null;

    // 1. Request real microphone access
    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    ) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicMode('hardware');
        setMicPermission('granted');
        setMicNotice(null);

        // Connect Web Audio API Analyser for real acoustic waveform
        try {
          const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateAudioWave = () => {
              if (analyserRef.current && isRecordingRef.current) {
                analyserRef.current.getByteFrequencyData(dataArray);
                const levels: number[] = [];
                const step = Math.floor(dataArray.length / 13) || 1;
                for (let i = 0; i < 13; i++) {
                  const val = dataArray[i * step] || 0;
                  levels.push(Math.max(12, Math.min(100, Math.round((val / 255) * 100))));
                }
                setAudioLevels(levels);
                animationFrameRef.current = requestAnimationFrame(updateAudioWave);
              }
            };
            updateAudioWave();
          }
        } catch (audioErr) {
          console.warn('Web Audio Analyser notice:', audioErr);
        }

        // Setup real MediaRecorder
        let mimeType = '';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          }

          const mediaRecorder = mimeType
            ? new MediaRecorder(stream, { mimeType })
            : new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.onstop = async () => {
            const actualType = mimeType || 'audio/webm';
            if (audioChunksRef.current.length > 0) {
              const audioBlob = new Blob(audioChunksRef.current, { type: actualType });
              const url = URL.createObjectURL(audioBlob);
              setRecordedAudioUrl(url);

              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onloadend = async () => {
                const base64Data = (reader.result as string)?.split(',')[1];
                if (base64Data) {
                  setAudioBase64(base64Data);

                  if (!typedNote.trim()) {
                    setIsTranscribing(true);
                    try {
                      const res = await fetch('/api/ai/transcribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          audioBase64: base64Data,
                          mimeType: actualType,
                        }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        if (data.transcript) {
                          setTypedNote(data.transcript);
                          setHasVoiceTranscript(true);
                        }
                      }
                    } catch (e) {
                      console.warn('Transcription request notice:', e);
                    } finally {
                      setIsTranscribing(false);
                    }
                  }
                }
              };
            }

            stream?.getTracks().forEach((track) => track.stop());
          };

          mediaRecorder.start(250);
        }
      } catch (err: any) {
        console.warn('Microphone permission notice:', err);
        isRecordingRef.current = false;
        setIsRecording(false);
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMicPermission('denied');
          setMicNotice(
            'Microphone permission was denied. Please allow microphone access in your browser settings to record your voice.'
          );
        } else {
          setMicNotice('Microphone is unavailable. Please check your audio device or type your notes.');
        }
        return;
      }
    } else {
      isRecordingRef.current = false;
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setMicNotice('Microphone API is not supported in this browser. Please type your reflection.');
      return;
    }

    // 2. Real SpeechRecognition for continuous speech to text
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition && stream) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang =
          currentUser.language === 'ar'
            ? 'ar-QA'
            : currentUser.language === 'sw'
            ? 'sw-KE'
            : 'en-US';

        recognition.onresult = (event: any) => {
          let interimText = '';
          let newlyFinalText = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              newlyFinalText += transcript;
            } else {
              interimText += transcript;
            }
          }

          if (newlyFinalText.trim()) {
            accumulatedFinalRef.current = accumulatedFinalRef.current
              ? `${accumulatedFinalRef.current.trim()} ${newlyFinalText.trim()}`
              : newlyFinalText.trim();
          }

          setLiveInterim(interimText.trim());

          const combined = [accumulatedFinalRef.current, interimText.trim()]
            .filter(Boolean)
            .join(' ');

          setTypedNote(combined);
          setHasVoiceTranscript(true);
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition notice:', e.error);
        };

        recognition.onend = () => {
          if (isRecordingRef.current) {
            try {
              recognition.start();
            } catch {
              // Ignore
            }
          }
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
      } catch (err) {
        console.warn('Speech recognition start notice:', err);
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setLiveInterim('');

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignore
      }
      audioContextRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // Ignore
      }
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('MediaRecorder stop notice:', e);
      }
    }
  };

  // Play audio preview
  const togglePlayAudio = () => {
    if (!recordedAudioUrl) return;

    if (!audioPlayerRef.current || audioPlayerRef.current.src !== recordedAudioUrl) {
      audioPlayerRef.current = new Audio(recordedAudioUrl);
      audioPlayerRef.current.onended = () => setIsPlayingAudio(false);
    }

    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch((e) => {
          console.warn('Audio playback notice:', e);
          setIsPlayingAudio(false);
        });
    }
  };

  // Submit feeling checkin
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedNote.trim() && selectedTags.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/patient/feelings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: currentUser.uid,
          caseId: activeCase?.id,
          feelingScore: selectedFeeling,
          feelingNote: typedNote.trim() || `Reported feeling ${selectedFeeling}`,
          tags: selectedTags,
          transcribedFromVoice: hasVoiceTranscript,
          audioDurationSeconds: recordingSeconds,
          voiceAudioUrl: recordedAudioUrl || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          setLatestAnalysis(data.analysis);
        }
        setSubmissionSuccess(true);
        setTypedNote('');
        setHasVoiceTranscript(false);
        setRecordedAudioUrl(null);
        setAudioBase64(null);
        setRecordingSeconds(0);
        await loadFeelings();
        setTimeout(() => setSubmissionSuccess(false), 5000);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Failed to submit feeling checkin:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#141923] border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 text-white">
      {/* Header with Title and Mode Indicator */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3b5bf5] to-[#d4f933] p-0.5 shadow-md flex-shrink-0">
            <div className="w-full h-full rounded-2xl bg-[#141923] flex items-center justify-center font-bold text-sm">
              <Sparkles className="w-5 h-5 text-[#d4f933]" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white leading-tight">
              Daily Well-being & Symptom Journal
            </h3>
            <p className="text-xs text-slate-400">
              Log how you feel by typing or speak with real time live voice transcription
            </p>
          </div>
        </div>

        {hasVoiceTranscript && (
          <span className="px-2.5 py-1 rounded-full bg-[#3b5bf5]/20 text-[#3b5bf5] border border-[#3b5bf5]/30 text-[10px] font-extrabold flex items-center gap-1 uppercase tracking-wider">
            <Volume2 className="w-3 h-3" />
            Live Transcribed
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Feeling Mood Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-2">
            How are you feeling right now?
          </label>
          <div className="grid grid-cols-5 gap-2">
            {FEELING_OPTIONS.map((opt) => {
              const isSelected = selectedFeeling === opt.key;

              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSelectedFeeling(opt.key)}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? `${opt.color} ring-2 ring-[#d4f933] shadow-md scale-105`
                      : 'border-slate-800 bg-[#10141d] hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-xl sm:text-2xl leading-none">{opt.emoji}</span>
                  <span className="text-[11px] font-bold leading-tight mt-1">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Voice Recording Controls Bar with Real-Time Transcription */}
        <div className="bg-[#10141d] border border-slate-800 rounded-2xl p-4 space-y-3">
          {/* Microphone Permission Prompt Card */}
          {micPermission !== 'granted' && micPermission !== 'denied' && !isRecording && (
            <div className="bg-[#141d2e] border border-blue-500/30 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#3b5bf5]/20 text-[#3b5bf5] flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-[#d4f933]" />
                </div>
                <div>
                  <p className="font-bold text-white leading-tight">
                    Microphone Permission Needed
                  </p>
                  <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                    Allow microphone access to enable real time voice transcription
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={requestMicrophonePermission}
                disabled={micPermission === 'requesting'}
                className="px-4 py-2 bg-[#d4f933] hover:bg-[#c2e62b] text-black rounded-full text-xs font-black transition flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>
                  {micPermission === 'requesting'
                    ? 'Requesting...'
                    : 'Allow Microphone'}
                </span>
              </button>
            </div>
          )}

          {/* Microphone Permission Granted Banner */}
          {micPermission === 'granted' && !isRecording && (
            <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-800/30 rounded-2xl px-3.5 py-1.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Microphone Permission Granted (Hardware Mic Ready)</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                Ready
              </span>
            </div>
          )}

          {/* Microphone Blocked Guidance Banner */}
          {micPermission === 'denied' && (
            <div className="bg-rose-950/30 border border-rose-800/40 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-rose-200">Microphone Access Blocked</p>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Your browser blocked microphone access. To allow it, click the lock or settings icon next to the URL in your browser address bar and change Microphone to Allow, then click Try Again.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={requestMicrophonePermission}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isRecording ? 'bg-rose-500 animate-ping' : 'bg-slate-600'
                }`}
              />
              <span className="text-xs font-bold text-slate-300">
                {isRecording
                  ? `Live Transcribing as You Speak (${recordingSeconds}s)`
                  : isTranscribing
                  ? 'Finalizing transcription...'
                  : 'Real Time Voice Dictation'}
              </span>
            </div>

            {/* Mic Action Button */}
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={isTranscribing}
                className="px-4 py-2 bg-[#3b5bf5] hover:bg-blue-600 active:scale-95 text-white rounded-full text-xs font-bold transition flex items-center gap-2 shadow-md"
              >
                <Mic className="w-4 h-4 text-[#d4f933]" />
                <span>Start Voice Recording</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-full text-xs font-bold transition flex items-center gap-2 shadow-md animate-pulse"
              >
                <MicOff className="w-4 h-4" />
                <span>Stop Voice Recording</span>
              </button>
            )}
          </div>

          {/* Real-time Frequency Waveform Bars responding to actual voice */}
          {isRecording && (
            <div className="space-y-3 pt-1">
              <div className="flex items-end justify-center gap-1.5 h-12 bg-[#0a0d14] p-2 rounded-xl border border-slate-800/80">
                {audioLevels.map((lvl, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full transition-all duration-75"
                    style={{
                      height: `${lvl}%`,
                      backgroundColor: lvl > 65 ? '#d4f933' : lvl > 40 ? '#3b5bf5' : '#475569',
                    }}
                  />
                ))}
              </div>

              {/* Live Streaming Speech Bubble */}
              <div className="bg-[#182338] border border-blue-500/40 rounded-2xl p-3 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#d4f933] animate-ping mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span className="font-bold text-[#d4f933] uppercase tracking-wider flex items-center gap-1">
                      <Radio className="w-3 h-3 text-[#d4f933] animate-pulse" />
                      Live Voice Stream
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {recordingSeconds}s
                    </span>
                  </div>
                  <p className="text-xs text-white font-medium italic leading-relaxed">
                    "{liveInterim || (typedNote.slice(-60) || 'Listening for speech, speak naturally...')}"
                    <span className="inline-block w-1.5 h-3 bg-[#d4f933] ms-1 animate-pulse" />
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notice banner if mic permission is constrained in iframe */}
          {micNotice && (
            <div className="text-[11px] text-amber-300 bg-amber-950/30 border border-amber-800/40 rounded-xl p-2.5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <span className="leading-tight">{micNotice}</span>
            </div>
          )}

          {/* Recorded Audio Preview Bar if available */}
          {recordedAudioUrl && !isRecording && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlayAudio}
                  className="p-1.5 rounded-full bg-[#3b5bf5] text-white hover:bg-blue-600 transition"
                  title="Play recorded voice note"
                >
                  {isPlayingAudio ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                </button>
                <span>Voice Audio Captured ({recordingSeconds}s)</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setRecordedAudioUrl(null);
                  setAudioBase64(null);
                }}
                className="text-[11px] text-slate-500 hover:text-slate-300"
              >
                Discard Audio
              </button>
            </div>
          )}
        </div>

        {/* 3. Typed Note and Real-time Transcript Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Describe how you feel (words appear here live as you talk, or type directly):
            </label>
            {typedNote && (
              <button
                type="button"
                onClick={() => {
                  setTypedNote('');
                  accumulatedFinalRef.current = '';
                }}
                className="text-[11px] text-slate-500 hover:text-white"
              >
                Clear text
              </button>
            )}
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={typedNote}
              onChange={(e) => {
                setTypedNote(e.target.value);
                accumulatedFinalRef.current = e.target.value;
              }}
              placeholder="E.g. Feeling rested today. Seated calmly during morning blood pressure check. No chest pain or dizziness."
              className={`w-full bg-[#10141d] border rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none transition leading-relaxed ${
                isRecording
                  ? 'border-[#d4f933] ring-1 ring-[#d4f933]/50'
                  : 'border-slate-800 focus:border-[#d4f933]'
              }`}
            />
            {hasVoiceTranscript && (
              <span className="absolute end-3 bottom-3 text-[10px] text-[#d4f933] flex items-center gap-1 font-mono">
                <Edit3 className="w-3 h-3" />
                Live Transcribed
              </span>
            )}
          </div>
        </div>

        {/* 4. Common Symptom Tags */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-2">
            Select any symptoms or physical sensations:
          </label>
          <div className="flex flex-wrap gap-2">
            {QUICK_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                    isSelected
                      ? 'bg-[#d4f933] text-black font-bold shadow-sm'
                      : 'bg-[#181e2a] text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Success Alert */}
        {submissionSuccess && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center gap-2 text-xs text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Check-in saved successfully! Real time AI symptom analysis generated below.</span>
          </div>
        )}

        {/* AI Symptom & Voice Analysis Insights Card */}
        {latestAnalysis && (
          <div className="p-4 bg-[#182338] border border-blue-500/40 rounded-2xl space-y-2.5 animate-in fade-in text-xs shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[#d4f933] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-[#d4f933]" />
                Gemini AI Symptom & Voice Analysis
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950 text-blue-200 border border-blue-800 uppercase tracking-wider">
                Risk Tier: {latestAnalysis.riskLevel}
              </span>
            </div>

            <p className="text-white leading-relaxed font-medium">
              {latestAnalysis.summary}
            </p>

            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px]">
              <div className="flex items-start gap-1.5">
                <span className="text-slate-400 font-semibold">Identified Symptoms:</span>
                <span className="text-white font-medium">
                  {latestAnalysis.extractedSymptoms.join(', ') || 'Resting Baseline'}
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-slate-400 font-semibold">Recommended Care Step:</span>
                <span className="text-slate-200">
                  {latestAnalysis.patientGuidance}
                </span>
              </div>
            </div>

            {latestAnalysis.redFlagAlert && (
              <div className="p-2.5 bg-rose-950/70 border border-rose-800 rounded-xl text-[11px] text-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="leading-snug font-medium">
                  {latestAnalysis.redFlagReason || 'Reported symptoms require prompt medical review. Your care team has been flagged.'}
                </p>
              </div>
            )}

            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
              <span>Model: {latestAnalysis.modelVersion}</span>
              <span>Clinical review only &bull; Humans decide</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || (!typedNote.trim() && selectedTags.length === 0)}
          className="w-full py-3.5 bg-[#d4f933] hover:bg-[#c2e825] disabled:opacity-50 disabled:cursor-not-allowed text-black font-extrabold rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-lg active:scale-[0.99]"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? 'Saving Check-in...' : 'Submit Feeling Check-in'}</span>
        </button>
      </form>

      {/* Safety Notice */}
      <div className="bg-[#10141d] border border-slate-800/80 rounded-2xl p-3 text-[11px] text-slate-400 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="leading-snug">
          Self reported feelings and symptoms keep your care team informed during surveillance. If you experience severe chest discomfort, difficulty breathing, or sudden numbness, please contact emergency medical care immediately.
        </p>
      </div>

      {/* 5. Past Feeling Logs Accordion */}
      {history.length > 0 && (
        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-400 hover:text-white transition py-1"
          >
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#d4f933]" />
              Recent Feeling Journal Entries ({history.length})
            </span>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showHistory && (
            <div className="space-y-2.5 mt-3 max-h-72 overflow-y-auto pe-1 custom-scrollbar">
              {history.map((item) => {
                const opt = FEELING_OPTIONS.find((f) => f.key === item.feelingScore);

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-[#10141d] border border-slate-800/80 rounded-2xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{opt?.emoji || '🙂'}</span>
                        <span className="font-bold text-white capitalize">
                          {item.feelingScore}
                        </span>
                        {item.transcribedFromVoice && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3b5bf5]/20 text-[#3b5bf5] border border-[#3b5bf5]/30 font-bold flex items-center gap-1">
                            <Volume2 className="w-2.5 h-2.5" />
                            Voice Note
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(item.recordedAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {item.feelingNote}
                    </p>

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {item.tags.map((t, idx) => (
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
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
