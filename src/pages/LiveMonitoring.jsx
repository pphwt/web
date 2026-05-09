import React, { useState, useEffect, useRef } from 'react';
import HeartModel3D from '../components/visualizers/HeartModel3D';
import ECGCanvas from '../components/visualizers/ECGCanvas';
import { usePatient } from '../context/PatientContext';
import { useStream } from '../context/StreamContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useDiagnosticSolver } from '../hooks/useDiagnosticSolver';
import {
  Activity, Zap, Save, Heart, TrendingUp, TrendingDown,
  Wifi, WifiOff, Snowflake, History, Dot, Circle,
  CheckCircle2, AlertTriangle, AlertCircle, Minus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => String(n ?? '--');

const StatusPill = ({ connected, dk }) => (
  <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border ${
    connected
      ? dk ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : dk ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'         : 'bg-rose-50 text-rose-600 border-rose-200'
  }`}>
    <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
    {connected ? 'Live · 4.2ms' : 'Offline'}
  </div>
);

const MetricCard = ({ label, value, unit, color, sub, dk }) => (
  <div className={`rounded-xl border p-4 ${dk ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-100'}`}>
    <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
    <div className="flex items-end gap-1">
      <span className={`text-2xl font-bold leading-none ${color}`}>{value}</span>
      <span className={`text-xs mb-0.5 ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{unit}</span>
    </div>
    {sub && <p className={`mt-1 text-[10px] ${dk ? 'text-slate-600' : 'text-slate-400'}`}>{sub}</p>}
  </div>
);

const EventRow = ({ event, dk }) => (
  <div className="flex items-start gap-3">
    <div className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${event.color}`} />
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] font-semibold truncate ${event.color}`}>{event.type}</span>
        <span className={`text-[10px] shrink-0 ${dk ? 'text-slate-600' : 'text-slate-400'}`}>{event.time}</span>
      </div>
      <p className={`text-xs mt-0.5 ${dk ? 'text-slate-300' : 'text-slate-600'}`}>{event.detail}</p>
    </div>
  </div>
);

// ─── main ─────────────────────────────────────────────────────────────────────

const LiveMonitoring = () => {
  const { selectedPatient } = usePatient();
  const { data: streamData, isConnected, subscribe } = useStream();
  const { token } = useAuth();
  const { t } = useLanguage();
  const { isDarkMode: dk } = useTheme();

  const { metrics, clinicalState, isNormal, isCritical } = useDiagnosticSolver(streamData);

  const recordingBuffer = useRef({ lead_i: [], lead_ii: [], v5: [] });
  const [isRecording, setIsRecording]   = useState(false);
  const [recordTime, setRecordTime]     = useState(0);
  const [saveStatus, setSaveStatus]     = useState(null);
  const [isFrozen, setIsFrozen]         = useState(false);
  const [events, setEvents]             = useState([
    { id: 1, time: '10:02:15', type: 'System',   detail: 'Neural Link Established',          color: 'bg-sky-400' },
    { id: 2, time: '10:05:42', type: 'AI Alert', detail: 'Slight QTc Prolongation Detected', color: 'bg-amber-400' },
  ]);

  useEffect(() => {
    if (selectedPatient?.id) subscribe(selectedPatient.id);
  }, [selectedPatient?.id]);

  useEffect(() => {
    let iv;
    if (isRecording) iv = setInterval(() => setRecordTime(p => p + 1), 1000);
    return () => clearInterval(iv);
  }, [isRecording]);

  useEffect(() => {
    if (isRecording && streamData?.leads) {
      recordingBuffer.current.lead_i.push(streamData.leads.lead_i);
      recordingBuffer.current.lead_ii.push(streamData.leads.lead_ii);
      recordingBuffer.current.v5.push(streamData.leads.v5);
    }
  }, [streamData, isRecording]);

  const toggleRecording = async () => {
    if (!isRecording) {
      recordingBuffer.current = { lead_i: [], lead_ii: [], v5: [] };
      setRecordTime(0); setIsRecording(true); setSaveStatus(null);
    } else {
      setIsRecording(false);
      await saveRecording();
    }
  };

  const saveRecording = async () => {
    if (!selectedPatient || recordingBuffer.current.lead_i.length === 0) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/archives/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          leads_data: recordingBuffer.current,
          bpm_avg: metrics?.hr,
          duration_seconds: recordTime,
        }),
      });
      setSaveStatus(res.ok ? 'success' : 'error');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('error');
    }
  };

  // ── tokens ─────────────────────────────────────────────────────
  const surface   = dk ? 'bg-[#0d1525] border-white/[0.06]'  : 'bg-white border-slate-200';
  const divider   = dk ? 'border-white/[0.06]'               : 'border-slate-100';
  const secLabel  = dk ? 'text-slate-500'                    : 'text-slate-400';
  const mainText  = dk ? 'text-white'                        : 'text-slate-900';
  const subText   = dk ? 'text-slate-400'                    : 'text-slate-500';
  const ecgBg     = dk ? 'bg-[#060d18]'                      : 'bg-slate-50';

  // AI diagnosis color
  const diagColor = isCritical
    ? { ring: 'border-rose-500/30',   bg: dk ? 'bg-rose-500/[0.08]'    : 'bg-rose-50',    text: dk ? 'text-rose-400'    : 'text-rose-700',    icon: <AlertCircle size={18} /> }
    : isNormal
    ? { ring: 'border-emerald-500/25',bg: dk ? 'bg-emerald-500/[0.07]' : 'bg-emerald-50', text: dk ? 'text-emerald-400' : 'text-emerald-700', icon: <CheckCircle2 size={18} /> }
    : { ring: 'border-amber-500/30',  bg: dk ? 'bg-amber-500/[0.08]'   : 'bg-amber-50',   text: dk ? 'text-amber-400'   : 'text-amber-700',   icon: <AlertTriangle size={18} /> };

  const hrColor = isNormal
    ? (dk ? 'text-emerald-400' : 'text-emerald-600')
    : isCritical
    ? (dk ? 'text-rose-400'    : 'text-rose-600')
    : (dk ? 'text-amber-400'   : 'text-amber-600');

  return (
    <div className={`p-4 md:p-6 min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300`}>
      <div className="max-w-[1800px] mx-auto flex flex-col gap-5">

        {/* ── Header ───────────────────────────────────────────── */}
        <header className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border p-4 ${surface}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
              isConnected
                ? dk ? 'bg-sky-500/15 border-sky-500/20 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'
                : dk ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}>
              {isConnected ? <Activity size={17} /> : <WifiOff size={17} />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className={`text-sm font-bold ${mainText}`}>{t('nav_monitoring')}</h1>
                <StatusPill connected={isConnected} dk={dk} />
                {!isNormal && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border animate-pulse ${
                    dk ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}>
                    At-Risk
                  </span>
                )}
              </div>
              <p className={`mt-0.5 text-xs ${subText}`}>
                {selectedPatient ? selectedPatient.name : 'ไม่ได้เลือกผู้ป่วย'} · Signal 98%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Save status */}
            <AnimatePresence>
              {saveStatus && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${
                    saveStatus === 'success'
                      ? dk ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : dk ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}
                >
                  {saveStatus === 'saving' ? 'กำลังบันทึก...' : saveStatus === 'success' ? 'บันทึกแล้ว' : 'บันทึกล้มเหลว'}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Freeze */}
            <button
              onClick={() => setIsFrozen(v => !v)}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                isFrozen
                  ? dk ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : dk ? 'border-white/[0.07] text-slate-400 hover:bg-white/[0.04]' : 'border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Snowflake size={14} className={isFrozen ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{isFrozen ? 'Frozen' : 'Freeze'}</span>
            </button>

            {/* Record */}
            <button
              onClick={toggleRecording}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all active:scale-95 ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-sky-600 hover:bg-sky-700 text-white'
              }`}
            >
              {isRecording ? (
                <><span className="h-2 w-2 rounded-full bg-white animate-ping" />{recordTime}s</>
              ) : (
                <><Save size={13} />{t('start_capture')}</>
              )}
            </button>
          </div>
        </header>

        {/* ── Body ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── Left: ECG + AI ─────────────────────────────────── */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-5">

            {/* ECG panel */}
            <div className={`rounded-2xl border overflow-hidden ${surface}`}>
              <div className={`flex items-center justify-between px-4 py-3 border-b ${divider}`}>
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className={dk ? 'text-sky-400' : 'text-sky-600'} />
                  <span className={`text-xs font-semibold ${secLabel}`}>Neural-Physics Stream · 500 Hz</span>
                </div>
                {isFrozen && (
                  <span className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${dk ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-700'}`}>
                    Freeze · Analysis Active
                  </span>
                )}
              </div>
              <div className={`${ecgBg} p-4 space-y-3`}>
                {[
                  { data: streamData?.leads?.lead_i,  label: 'LEAD I',  color: '#0ea5e9' },
                  { data: streamData?.leads?.lead_ii, label: 'LEAD II', color: '#6366f1' },
                  { data: streamData?.leads?.v5,      label: 'V5',      color: '#8b5cf6' },
                ].map(({ data, label, color }) => (
                  <div key={label}>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                    <ECGCanvas data={isFrozen ? undefined : data} label="" color={color} height={110} />
                  </div>
                ))}
              </div>
            </div>

            {/* AI diagnosis strip */}
            <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 ${diagColor.bg} ${diagColor.ring}`}>
              <span className={diagColor.text}>{diagColor.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${diagColor.text} opacity-70`}>
                  Real-time Clinical Insight
                </p>
                <p className={`text-base font-bold truncate ${diagColor.text}`}>{clinicalState.diagnosis}</p>
              </div>
              <span className={`shrink-0 text-xs font-semibold ${diagColor.text} opacity-60`}>
                Confidence {fmt(metrics?.confidence)}%
              </span>
            </div>
          </div>

          {/* ── Right: Vitals + Events ─────────────────────────── */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-5">

            {/* Vitals card */}
            <div className={`rounded-2xl border p-5 ${surface}`}>
              <div className="flex items-center gap-2 mb-4">
                <Heart size={14} className="text-rose-400" />
                <span className={`text-xs font-semibold ${secLabel}`}>Vital Summary</span>
              </div>

              {/* HR hero */}
              <div className={`flex items-end justify-between mb-4 pb-4 border-b ${divider}`}>
                <div>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${secLabel}`}>Heart Rate</p>
                  <div className="flex items-end gap-1.5">
                    <span className={`text-5xl font-bold leading-none ${hrColor}`}>{fmt(metrics?.hr)}</span>
                    <span className={`text-sm mb-1 ${subText}`}>BPM</span>
                    {clinicalState.trend === 'rising'  && <TrendingUp   size={14} className="text-rose-400 mb-1" />}
                    {clinicalState.trend === 'falling' && <TrendingDown size={14} className="text-sky-400 mb-1"  />}
                    {clinicalState.trend === 'stable'  && <Minus        size={14} className={`mb-1 ${subText}`}  />}
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border ${
                  isNormal
                    ? dk ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : dk ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'         : 'bg-rose-50 text-rose-600 border-rose-200'
                }`}>
                  {isNormal ? 'Stable' : 'Alert'}
                </span>
              </div>

              {/* Secondary metrics */}
              <div className="grid grid-cols-2 gap-2.5">
                <MetricCard dk={dk} label="QTc" value={fmt(metrics?.qtc)} unit="ms"
                  color={metrics?.qtc > 450 ? (dk ? 'text-rose-400' : 'text-rose-600') : (dk ? 'text-sky-400' : 'text-sky-600')}
                  sub={metrics?.qtc > 450 ? 'Prolonged' : 'Normal'} />
                <MetricCard dk={dk} label="QRS" value={fmt(metrics?.qrs)} unit="ms"
                  color={dk ? 'text-sky-400' : 'text-sky-600'} />
              </div>
            </div>

            {/* Event log */}
            <div className={`flex flex-col rounded-2xl border flex-1 min-h-[280px] ${surface}`}>
              <div className={`flex items-center gap-2 px-4 py-3 border-b ${divider}`}>
                <History size={14} className={dk ? 'text-sky-400' : 'text-sky-600'} />
                <span className={`text-xs font-semibold ${secLabel}`}>Event Log</span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {isCritical && (
                  <div className={`rounded-xl border px-3 py-2.5 animate-pulse ${
                    dk ? 'bg-rose-500/[0.08] border-rose-500/20' : 'bg-rose-50 border-rose-200'
                  }`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${dk ? 'text-rose-400' : 'text-rose-700'}`}>
                      ⚠ Critical Alert
                    </p>
                    <p className={`text-xs mt-0.5 ${dk ? 'text-rose-300' : 'text-rose-600'}`}>
                      Sudden Rhythm Change Detected
                    </p>
                  </div>
                )}
                {events.map(e => <EventRow key={e.id} event={e} dk={dk} />)}
              </div>

              <div className={`px-4 py-3 border-t ${divider}`}>
                <p className={`text-[10px] font-semibold ${secLabel}`}>Auto-Snapshot Ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitoring;
