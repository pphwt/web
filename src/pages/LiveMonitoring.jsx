import React, { useState, useEffect, useRef } from 'react';
import HeartModel3D from '../components/visualizers/HeartModel3D';
import ECGCanvas from '../components/visualizers/ECGCanvas';
import { usePatient } from '../context/PatientContext';
import { useStream, WS_URL } from '../context/StreamContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useDiagnosticSolver } from '../hooks/useDiagnosticSolver';
import { API_BASE } from '../utils/constants';
import {
  Activity, Zap, Save, Heart, TrendingUp, TrendingDown,
  Wifi, WifiOff, Snowflake, History, Dot, Circle,
  CheckCircle2, AlertTriangle, AlertCircle, Minus, Usb,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => String(n ?? '--');
const MAX_CAPTURE_SECONDS = Number(import.meta.env.VITE_ECG_CAPTURE_MAX_SECONDS || 30);
const LIVE_12_LEADS = [
  { key: 'I', label: 'LEAD I', color: '#0ea5e9' },
  { key: 'aVR', label: 'aVR', color: '#64748b' },
  { key: 'V1', label: 'V1', color: '#14b8a6' },
  { key: 'V4', label: 'V4', color: '#f97316' },
  { key: 'II', label: 'LEAD II', color: '#2563eb' },
  { key: 'aVL', label: 'aVL', color: '#64748b' },
  { key: 'V2', label: 'V2', color: '#06b6d4' },
  { key: 'V5', label: 'V5', color: '#8b5cf6' },
  { key: 'III', label: 'LEAD III', color: '#2563eb' },
  { key: 'aVF', label: 'aVF', color: '#64748b' },
  { key: 'V3', label: 'V3', color: '#0d9488' },
  { key: 'V6', label: 'V6', color: '#a855f7' },
];

const numericOrNull = (...values) => {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

const buildLive12LeadFrame = (rawLeads = {}) => {
  const I = numericOrNull(rawLeads.I, rawLeads.lead_i);
  const II = numericOrNull(rawLeads.II, rawLeads.lead_ii);
  const frame = { ...rawLeads };

  if (I != null) frame.I = I;
  if (II != null) frame.II = II;
  if (I != null && II != null) {
    frame.III = numericOrNull(rawLeads.III, II - I);
    frame.aVR = numericOrNull(rawLeads.aVR, rawLeads.AVR, -(I + II) / 2);
    frame.aVL = numericOrNull(rawLeads.aVL, rawLeads.AVL, I - II / 2);
    frame.aVF = numericOrNull(rawLeads.aVF, rawLeads.AVF, II - I / 2);
  }

  ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'].forEach((lead) => {
    const lower = lead.toLowerCase();
    const value = numericOrNull(rawLeads[lead], rawLeads[lower]);
    if (value != null) frame[lead] = value;
  });

  if (frame.I != null) frame.lead_i = frame.I;
  if (frame.II != null) frame.lead_ii = frame.II;
  if (frame.V5 != null) frame.v5 = frame.V5;
  return frame;
};

const pickWaveformValue = (waveform, lead, index) => {
  const key = Object.keys(waveform || {}).find((name) => name.toUpperCase() === lead.toUpperCase());
  return key ? numericOrNull(waveform[key]?.[index]) : null;
};

const buildFrameFromWaveform = (waveform, index) => {
  const direct = {};
  LIVE_12_LEADS.forEach(({ key }) => {
    const value = pickWaveformValue(waveform, key, index);
    if (value != null) direct[key] = value;
  });
  return buildLive12LeadFrame(direct);
};

const createRecordingBuffer = () => {
  const buffer = { lead_i: [], lead_ii: [], v5: [] };
  LIVE_12_LEADS.forEach(({ key }) => {
    buffer[key] = [];
  });
  return buffer;
};

const appendRecordingFrame = (buffer, frame) => {
  Object.entries(frame || {}).forEach(([key, value]) => {
    if (!Array.isArray(buffer[key])) return;
    if (Number.isFinite(Number(value))) buffer[key].push(Number(value));
  });
};

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

  const [localStreamData, setLocalStreamData] = useState(null);
  const { metrics, clinicalState, isNormal, isCritical } = useDiagnosticSolver(localStreamData || streamData);
  const isUnknown = clinicalState.status === 'unknown';

  const recordingBuffer = useRef(createRecordingBuffer());
  const [isRecording, setIsRecording]   = useState(false);
  const [recordTime, setRecordTime]     = useState(0);
  const [saveStatus, setSaveStatus]     = useState(null);
  const [isFrozen, setIsFrozen]         = useState(false);
  const [events, setEvents]             = useState([]);

  const { showToast } = useToast();
  const { events: streamEvents } = useStream();

  const [serialSupported] = useState('serial' in navigator);
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const serialPortRef = useRef(null);
  const serialReaderRef = useRef(null);
  const hardwareSocketRef = useRef(null);

  // Demo Mode state
  const [isDemoMode, setIsDemoMode] = useState(false);
  const demoIntervalRef = useRef(null);
  const demoDataRef = useRef(null); // { wf, leadKeys, len, idx }

  useEffect(() => {
    if (!streamEvents) return;
    const handler = (e) => {
      const detail = e.detail || {};
      setLocalStreamData({
        ...detail,
        leads: buildLive12LeadFrame(detail.leads || {}),
      });
    };
    streamEvents.addEventListener('data', handler);
    return () => streamEvents.removeEventListener('data', handler);
  }, [streamEvents]);

  const disconnectSerial = async () => {
    try {
      if (serialReaderRef.current) {
        await serialReaderRef.current.cancel();
        serialReaderRef.current = null;
      }
      if (serialPortRef.current) {
        await serialPortRef.current.close();
        serialPortRef.current = null;
      }
      if (hardwareSocketRef.current) {
        hardwareSocketRef.current.close();
        hardwareSocketRef.current = null;
      }
      setIsSerialConnected(false);
      showToast('ปิดการเชื่อมต่อ USB Serial แล้ว', 'info');
    } catch (err) {
      console.error(err);
      setIsSerialConnected(false);
    }
  };

  // Auto-baud probe for devices we have no prior knowledge of: try common
  // rates, keep whichever one produces legible ASCII text. This is what
  // makes "plug in an arbitrary device, no pre-flashed firmware" possible
  // at all -- the trade-off (explicitly accepted for this project) is that
  // an unrecognized device's field order/meaning is a heuristic guess, not
  // a validated protocol; see `verified_protocol` below, which keeps that
  // distinction visible rather than silently presenting a guess as certain.
  const BAUD_CANDIDATES = [115200, 9600, 57600, 38400];

  const asciiLegibleRatio = (bytes) => {
    if (!bytes.length) return 0;
    let printable = 0;
    for (const b of bytes) {
      if ((b >= 0x20 && b <= 0x7e) || b === 0x0a || b === 0x0d) printable += 1;
    }
    return printable / bytes.length;
  };

  const detectBaudRate = async (port) => {
    for (const baud of BAUD_CANDIDATES) {
      try {
        await port.open({ baudRate: baud });
      } catch (err) {
        continue;
      }
      const reader = port.readable.getReader();
      const chunks = [];
      const deadline = Date.now() + 600;
      try {
        while (Date.now() < deadline) {
          const remaining = deadline - Date.now();
          if (remaining <= 0) break;
          const result = await Promise.race([
            reader.read(),
            new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), remaining)),
          ]);
          if (result.timeout || result.done) break;
          if (result.value) chunks.push(result.value);
        }
      } catch (err) {
        // fall through to the ratio check below on whatever was captured
      }
      await reader.cancel().catch(() => {});
      reader.releaseLock();

      const totalBytes = chunks.reduce((acc, c) => acc + c.length, 0);
      const merged = new Uint8Array(totalBytes);
      let offset = 0;
      for (const c of chunks) { merged.set(c, offset); offset += c.length; }

      if (totalBytes > 10 && asciiLegibleRatio(merged) > 0.85) {
        return baud; // legible text at this rate -- leave the port open here
      }
      await port.close().catch(() => {});
    }
    // Nothing looked legible at any candidate rate -- fall back to the most
    // common one and let the format-warning toast in the main loop explain
    // if it's still wrong, rather than refusing to connect at all.
    await port.open({ baudRate: BAUD_CANDIDATES[0] }).catch(() => {});
    return BAUD_CANDIDATES[0];
  };

  // Shared by both a fresh "Connect USB Serial" click and silent
  // auto-reconnect to a port the browser already has permission for (see
  // the mount effect below) -- one read loop, one place to keep the parser
  // and error feedback in sync.
  const runSerialSession = async (port) => {
    const baud = await detectBaudRate(port);
    showToast(`ตรวจพบ baud rate ${baud} อัตโนมัติ`, 'info');
    serialPortRef.current = port;
    setIsSerialConnected(true);
    showToast('เชื่อมต่ออุปกรณ์ผ่าน USB สำเร็จ!', 'success');

    // Forward real samples to the backend's hardware ingestion socket --
    // that's what actually computes HR/QTc/PR/QRS (real R-peak detection +
    // the CardiacLocalizer) and feeds it back over the already-subscribed
    // /ws/signals connection as `streamData`. Do not fabricate those
    // numbers here; showing a clinician a specific reading ("72 bpm")
    // that was never measured from this device is worse than showing
    // nothing until a real one arrives.
    const hwUrl = WS_URL.replace(/\/ws\/signals.*$/, `/ws/hardware/${selectedPatient.id}`);
    const hwSocket = new WebSocket(hwUrl);
    hardwareSocketRef.current = hwSocket;

    const reader = port.readable.getReader();
    serialReaderRef.current = reader;

    const decoder = new TextDecoder();
    let buffer = '';
    let goodLines = 0;
    let badLines = 0;
    let formatWarningShown = false;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Recognized device: our reference firmware for a cheap single-lead
        // front-end (AD8232 + ESP32/Arduino, see docs/hardware-integration
        // -protocol.md) self-identifies with an "AD8232," prefix and reports
        // its own leads-off state -- a real, validated protocol, not a guess.
        let parsed = null;
        if (trimmed.startsWith('AD8232,')) {
          const parts = trimmed.split(',');
          const v = Number(parts[1]);
          const off = parts[2] === '1';
          if (Number.isFinite(v)) {
            parsed = { lead_i: v, lead_ii: v, v5: v, single_lead: true, leads_off: off, verified_protocol: true };
          }
        } else {
          // Unrecognized device: accept whatever comma/semicolon/whitespace
          // -separated numbers show up, on the assumption (never confirmed)
          // that 1 field means a single channel and 2-3 fields mean
          // lead_i/lead_ii/v5 in that order. This is a deliberate honesty
          // trade-off for broader plug-and-play compatibility -- field
          // *order* and *meaning* are unverified for a device we've never
          // seen before, so `verified_protocol: false` follows this data
          // downstream and the UI must keep saying so, not present it with
          // the same confidence as a known device.
          const tokens = trimmed.split(/[,;\s]+/).filter(Boolean).map(Number);
          if (tokens.length > 0 && !tokens.some(isNaN)) {
            parsed = tokens.length === 1
              ? { lead_i: tokens[0], lead_ii: tokens[0], v5: tokens[0], single_lead: true, leads_off: false, verified_protocol: false }
              : { lead_i: tokens[0] ?? 0.0, lead_ii: tokens[1] ?? 0.0, v5: tokens[2] ?? 0.0, single_lead: false, leads_off: false, verified_protocol: false };
          }
        }

        if (!parsed) {
          badLines += 1;
          // A device sending truly non-numeric data (binary, text logs,
          // etc.) looks identical to "nothing is happening" from the UI
          // alone -- surface it once, concretely, rather than leaving the
          // user to guess why the connection "succeeded" but shows no data.
          if (badLines >= 20 && goodLines === 0 && !formatWarningShown) {
            formatWarningShown = true;
            showToast('อุปกรณ์เชื่อมต่อแล้วแต่ยังไม่มีข้อมูลตัวเลขที่อ่านได้ — ต้องส่งตัวเลข (คั่นด้วย comma/semicolon/space) หรือ "AD8232,<ค่า>,<leads_off>" ทาง serial', 'error');
          }
          continue;
        }
        goodLines += 1;

        const { lead_i, lead_ii, v5, single_lead, leads_off, verified_protocol } = parsed;
        const leadFrame = single_lead ? { II: lead_ii, lead_ii } : buildLive12LeadFrame({ lead_i, lead_ii, v5 });

        if (hwSocket.readyState === WebSocket.OPEN) {
          hwSocket.send(JSON.stringify({ lead_i, lead_ii, v5, single_lead, leads_off, verified_protocol }));
        }

        // Local dispatch is for instant waveform trace rendering only --
        // real vitals arrive separately via `streamData` once the backend
        // measures them from the forwarded samples above.
        if (streamEvents) {
          streamEvents.dispatchEvent(new CustomEvent('data', {
            detail: { leads: leadFrame, is_hardware: true, single_lead, leads_off, verified_protocol },
          }));
        }

        if (isRecording) {
          appendRecordingFrame(recordingBuffer.current, leadFrame);
        }
      }
    }
  };

  const connectSerial = async () => {
    if (!selectedPatient?.id) {
      showToast('เลือกผู้ป่วยก่อนเชื่อมต่ออุปกรณ์', 'error');
      return;
    }
    try {
      const port = await navigator.serial.requestPort();
      await runSerialSession(port);
    } catch (err) {
      console.error(err);
      if (err.name !== 'AbortError') {
        showToast('เชื่อมต่อพอร์ตล้มเหลว: ' + err.message, 'error');
      }
      setIsSerialConnected(false);
    }
  };

  // Auto-reconnect: the browser remembers ports the user already granted
  // permission for (navigator.serial.getPorts()), so a returning user with
  // a patient selected doesn't have to click "Connect" and re-pick the same
  // device from the OS port dialog every time they open this page.
  useEffect(() => {
    if (!serialSupported || !selectedPatient?.id || isSerialConnected) return;
    let cancelled = false;
    (async () => {
      try {
        const ports = await navigator.serial.getPorts();
        if (cancelled || !ports.length || serialPortRef.current) return;
        await runSerialSession(ports[0]);
      } catch (err) {
        console.error('Auto-reconnect failed:', err);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialSupported, selectedPatient?.id]);

  // Cleanup serial on unmount
  useEffect(() => {
    return () => {
      if (serialReaderRef.current) serialReaderRef.current.cancel().catch(() => {});
      if (serialPortRef.current) serialPortRef.current.close().catch(() => {});
      if (hardwareSocketRef.current) hardwareSocketRef.current.close();
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    };
  }, []);

  const stopDemo = () => {
    clearInterval(demoIntervalRef.current);
    demoIntervalRef.current = null;
    demoDataRef.current = null;
    setIsDemoMode(false);
    showToast('Demo Mode หยุดแล้ว', 'info');
  };

  const startDemo = async () => {
    if (isDemoMode) {
      stopDemo();
      return;
    }
    showToast('โหลดข้อมูล Demo ECG...', 'info');
    try {
      const endpoint = `${API_BASE}/ecg/analyze`;
      const token = localStorage.getItem('bio_token');
      const form = new FormData();
      form.append('sample_id', '00017_hr'); // AFIB
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const wf = data.waveform || {};
      const leadKeys = Object.keys(wf);
      if (!leadKeys.length) throw new Error('ไม่มีข้อมูล waveform');
      const len = wf[leadKeys[0]].length;
      demoDataRef.current = { wf, leadKeys, len, idx: 0 };
      setIsDemoMode(true);
      showToast('▶ Demo Mode: AFIB (00017_hr) — สัญญาณ ECG จริง', 'success');

      // This sample was already measured server-side by the same real
      // pipeline used for uploaded ECGs (/ecg/analyze) -- replay those
      // actual numbers instead of a hand-picked "typical AFIB" placeholder,
      // which would show the same fixed reading regardless of which real
      // sample is loaded.
      const m = data.measurements || {};
      const demoVitals = {
        heart_rate: m.heart_rate_bpm?.value ?? null,
        qtc: m.qtc_ms?.value ?? null,
        pr_interval: m.pr_ms?.value ?? null,
        qrs_duration: m.qrs_ms?.value ?? null,
        ai_confidence: data.classification?.probabilities?.AFIB ?? data.classification?.top_probability ?? null,
      };

      const BATCH = 50;
      demoIntervalRef.current = setInterval(() => {
        const d = demoDataRef.current;
        if (!d) return;
        const leadFrame = buildFrameFromWaveform(wf, d.idx);
        if (leadFrame.I == null) leadFrame.I = wf[leadKeys[0]]?.[d.idx] ?? 0;
        if (leadFrame.II == null) leadFrame.II = wf[leadKeys[1] || leadKeys[0]]?.[d.idx] ?? 0;

        d.idx = (d.idx + BATCH) % d.len;

        const payload = {
          leads: buildLive12LeadFrame(leadFrame),
          is_hardware: false,
          is_demo: true,
          ...demoVitals,
        };

        if (streamEvents) {
          streamEvents.dispatchEvent(new CustomEvent('data', { detail: payload }));
        }
      }, 100);
    } catch (e) {
      showToast(`Demo Mode ล้มเหลว: ${e.message}`, 'error');
    }
  };

  // Generate real-time event logs dynamically from WebSocket connection and AI state
  useEffect(() => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    setEvents(prev => [
      {
        id: Date.now(),
        time: timeStr,
        type: 'System',
        detail: isConnected ? 'Cardiac Link Connected' : 'Cardiac Link Disconnected',
        color: isConnected ? 'bg-emerald-400' : 'bg-rose-400'
      },
      ...prev.slice(0, 19) // limit to 20 events
    ]);
  }, [isConnected]);

  useEffect(() => {
    if (clinicalState?.diagnosis) {
      const timeStr = new Date().toTimeString().split(' ')[0];
      const isNormalThresholdState = clinicalState.status === 'normal';
      setEvents(prev => [
        {
          id: Date.now() + 1,
          time: timeStr,
          type: isNormalThresholdState ? 'System' : 'Threshold Alert',
          detail: clinicalState.diagnosis,
          color: isNormalThresholdState ? 'bg-emerald-400' : isCritical ? 'bg-rose-400' : 'bg-amber-400'
        },
        ...prev.slice(0, 19)
      ]);
    }
  }, [clinicalState?.diagnosis]);

  useEffect(() => {
    if (selectedPatient?.id) subscribe(selectedPatient.id);
  }, [selectedPatient?.id]);

  useEffect(() => {
    let iv;
    if (isRecording) iv = setInterval(() => setRecordTime(p => p + 1), 1000);
    return () => clearInterval(iv);
  }, [isRecording]);

  useEffect(() => {
    if (isRecording && recordTime >= MAX_CAPTURE_SECONDS) {
      toggleRecording();
    }
  }, [isRecording, recordTime]);

  const toggleRecording = async () => {
    if (!isRecording) {
      recordingBuffer.current = createRecordingBuffer();
      setRecordTime(0); setIsRecording(true); setSaveStatus(null);
    } else {
      setIsRecording(false);
      await saveRecording();
    }
  };

  const saveRecording = async () => {
    if (!selectedPatient || (recordingBuffer.current.I?.length || recordingBuffer.current.lead_i?.length || 0) === 0) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`${API_BASE}/archives/`, {
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

  // AI triage color — "unknown" (no measurement yet) must read as neutral,
  // never amber/red, or a device that just connected but hasn't produced a
  // real reading yet would look like an active clinical warning.
  const diagColor = isUnknown
    ? { ring: 'border-slate-400/25',  bg: dk ? 'bg-white/[0.03]'       : 'bg-slate-50',   text: dk ? 'text-slate-400'   : 'text-slate-500',   icon: <Minus size={18} /> }
    : isCritical
    ? { ring: 'border-rose-500/30',   bg: dk ? 'bg-rose-500/[0.08]'    : 'bg-rose-50',    text: dk ? 'text-rose-400'    : 'text-rose-700',    icon: <AlertCircle size={18} /> }
    : isNormal
    ? { ring: 'border-emerald-500/25',bg: dk ? 'bg-emerald-500/[0.07]' : 'bg-emerald-50', text: dk ? 'text-emerald-400' : 'text-emerald-700', icon: <CheckCircle2 size={18} /> }
    : { ring: 'border-amber-500/30',  bg: dk ? 'bg-amber-500/[0.08]'   : 'bg-amber-50',   text: dk ? 'text-amber-400'   : 'text-amber-700',   icon: <AlertTriangle size={18} /> };

  const hrColor = isUnknown
    ? (dk ? 'text-slate-500' : 'text-slate-400')
    : isNormal
    ? (dk ? 'text-emerald-400' : 'text-emerald-600')
    : isCritical
    ? (dk ? 'text-rose-400'    : 'text-rose-600')
    : (dk ? 'text-amber-400'   : 'text-amber-600');

  return (
    <div className={`min-h-full bg-[var(--bg-main)] px-2 py-3 text-[var(--text-main)] transition-colors duration-300 sm:px-4 lg:px-6`}>
      <div className="clinical-page flex flex-col gap-4 lg:gap-5">

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
                {streamData?.is_hardware ? (
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border animate-pulse ${
                    dk ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`} title="รับสัญญาณดิบจากเครื่องตรวจจับทางคลินิก (Real Detector)">HARDWARE SENSOR</span>
                ) : (
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                    dk ? 'bg-violet-500/10 text-violet-300 border-violet-500/25' : 'bg-violet-50 text-violet-600 border-violet-200'
                  }`} title="สัญญาณนี้สร้างจากแบบจำลอง ไม่ใช่ผู้ป่วยจริง">SIMULATION</span>
                )}
                <StatusPill connected={isConnected} dk={dk} />
                {!isNormal && !isUnknown && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border animate-pulse ${
                    dk ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}>
                    At-Risk
                  </span>
                )}
              </div>
              <p className={`mt-0.5 text-xs ${subText}`}>
                {selectedPatient ? selectedPatient.name : 'ไม่ได้เลือกผู้ป่วย'} · Signal 98% · Decision-support stream
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

            {/* Native USB Serial (Web Serial API) */}
            {serialSupported ? (
              <button
                type="button"
                onClick={isSerialConnected ? disconnectSerial : connectSerial}
                title={
                  isSerialConnected
                    ? `กำลังส่งข้อมูลจริงไปคำนวณ HR/QRS/PR/QTc ให้ผู้ป่วย: ${selectedPatient?.name || '-'}`
                    : 'อุปกรณ์ต้องส่งข้อความทีละบรรทัด รูปแบบ "lead_i,lead_ii,v5" (ตัวเลขคั่นด้วยจุลภาค) ที่ baud rate 115200 — ระบบจะคำนวณ HR/QRS/PR/QTc จริงจากสัญญาณนี้ให้ผู้ป่วยที่เลือกอยู่โดยอัตโนมัติ'
                }
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all active:scale-95 ${
                  isSerialConnected
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : dk
                    ? 'border-white/[0.07] text-slate-300 hover:bg-white/[0.04] bg-slate-900/40'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 bg-white'
                }`}
              >
                <Usb size={14} className={isSerialConnected ? 'animate-pulse' : ''} />
                <span>{isSerialConnected ? 'Connected USB' : 'Connect USB Serial'}</span>
              </button>
            ) : (
              <span
                title="การเชื่อมต่อ USB Serial โดยตรงใช้ได้เฉพาะ Chrome/Edge บนคอมพิวเตอร์ (Web Serial API) — ใช้ Demo Mode แทนได้บนเบราว์เซอร์นี้"
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold opacity-60 ${
                  dk ? 'border-white/[0.07] text-slate-500 bg-slate-900/40' : 'border-slate-200 text-slate-400 bg-white'
                }`}
              >
                <Usb size={14} />
                <span>USB Serial (ต้องใช้ Chrome/Edge)</span>
              </span>
            )}

            {/* Demo Mode Button */}
            <button
              type="button"
              onClick={startDemo}
              title="เล่น ECG จากข้อมูลจริง (AFIB 00017_hr) โดยไม่ต้องใช้ Hardware"
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all active:scale-95 ${
                isDemoMode
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : dk
                  ? 'border-white/[0.07] text-slate-300 hover:bg-white/[0.04] bg-slate-900/40'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 bg-white'
              }`}
            >
              {isDemoMode
                ? <><span className="h-2 w-2 rounded-full bg-white animate-ping" /><span>■ Stop Demo</span></>
                : <><Activity size={14} /><span>▶ Demo Mode</span></>}
            </button>

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
                <><span className="h-2 w-2 rounded-full bg-white animate-ping" />{recordTime}/{MAX_CAPTURE_SECONDS}s</>
              ) : (
                <><Save size={13} />{t('start_capture')}</>
              )}
            </button>
          </div>
        </header>

        {/* ── Hardware setup guide (only while nothing is connected yet) ── */}
        {serialSupported && !isSerialConnected && !isDemoMode && (
          <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 rounded-2xl border px-4 py-3 text-xs ${surface}`}>
            {[
              { done: !!selectedPatient, label: 'เลือกผู้ป่วยที่จะติดตาม' },
              { done: !!selectedPatient, label: 'เสียบสาย USB ของเครื่องตรวจเข้าคอมพิวเตอร์' },
              { done: false, label: 'กด "Connect USB Serial" แล้วเลือกอุปกรณ์จากรายการ' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  step.done
                    ? 'bg-emerald-500 text-white'
                    : dk ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-500'
                }`}>
                  {step.done ? '✓' : i + 1}
                </span>
                <span className={step.done ? (dk ? 'text-slate-300' : 'text-slate-600') : (dk ? 'text-slate-500' : 'text-slate-400')}>
                  {step.label}
                </span>
              </div>
            ))}
            {!selectedPatient && (
              <span className={`text-[11px] font-semibold ${dk ? 'text-amber-400' : 'text-amber-600'}`}>
                ← เลือกผู้ป่วยจากหน้าทะเบียนก่อน ปุ่มเชื่อมต่อจะยังใช้ไม่ได้
              </span>
            )}
          </div>
        )}

        {/* ── Body ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── Left: ECG + AI ─────────────────────────────────── */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-5">

            {/* ECG panel */}
            <div className={`rounded-2xl border overflow-hidden ${surface}`}>
              <div className={`flex items-center justify-between px-4 py-3 border-b ${divider}`}>
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className={dk ? 'text-sky-400' : 'text-sky-600'} />
                  <span className={`text-xs font-semibold ${secLabel}`}>ECG-Physics Stream · 12-lead view · 500 Hz</span>
                </div>
                {isFrozen && (
                  <span className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${dk ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-700'}`}>
                    Freeze · Analysis Active
                  </span>
                )}
              </div>
              <div className={`${ecgBg} p-4`}>
                {streamData?.is_hardware && streamData?.verified_protocol === false && (
                  <div className={`mb-3 rounded-xl border px-3 py-2 text-[11px] leading-relaxed ${
                    dk ? 'border-amber-500/25 bg-amber-500/[0.06] text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'
                  }`}>
                    ⚠ อุปกรณ์นี้ยังไม่ได้ยืนยัน protocol เต็มรูปแบบ (auto-detect จากสัญญาณตัวเลขทั่วไป) — Heart rate คำนวณจริงจากสัญญาณ เชื่อถือได้ แต่ QRS/PR/QTc/axis/3D localization จะซ่อนไว้จนกว่าจะใช้อุปกรณ์ที่มี protocol ยืนยันแล้ว (เช่น AD8232 ตามคู่มือ)
                  </div>
                )}
                {streamData?.single_lead ? (
                  <>
                    <div className={`mb-3 flex flex-wrap items-center justify-between gap-2 text-[10px] ${subText}`}>
                      <span>อุปกรณ์ single-lead (เช่น AD8232) วัดได้แค่ Lead II — ไม่ใช่ 12-lead ECG</span>
                      <span className={`rounded-full border px-2 py-0.5 font-semibold ${dk ? 'border-violet-500/25 text-violet-300' : 'border-violet-200 text-violet-700'}`}>
                        1/12 lead slot · HR/rhythm only
                      </span>
                    </div>
                    {streamData?.leads_off && (
                      <div className={`mb-3 rounded-xl border px-3 py-2 text-[11px] font-semibold ${
                        dk ? 'border-rose-500/25 bg-rose-500/[0.08] text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}>
                        ⚠ Leads off — ตรวจสอบว่า electrode ติดผิวหนังแน่นหรือไม่ (ไม่แสดง HR จนกว่าจะติดกลับ)
                      </div>
                    )}
                    <div className="max-w-md">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">LEAD II</p>
                      <ECGCanvas
                        leadKey="II"
                        valueFrom={(leads) => leads?.II ?? leads?.lead_ii}
                        paused={isFrozen}
                        label=""
                        color="#2563eb"
                        height={140}
                        emptyMessage="Lead unavailable"
                      />
                    </div>
                    <div className={`mt-3 rounded-xl border px-3 py-2 text-[10px] leading-relaxed ${
                      dk ? 'border-amber-500/20 bg-amber-500/[0.06] text-amber-200/85' : 'border-amber-200 bg-amber-50 text-amber-800'
                    }`}>
                      Single-lead ไม่พอสำหรับ axis หรือ 3D source localization — ใช้สำหรับติดตาม HR/rhythm เบื้องต้นเท่านั้น ต้องการผล 12-lead เต็มให้อัปโหลดภาพ/ไฟล์ ECG ที่หน้า "อ่านผล ECG (ไฟล์จริง)"
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`mb-3 flex flex-wrap items-center justify-between gap-2 text-[10px] ${subText}`}>
                      <span>แสดงครบ 12 leads ตามตำแหน่งมาตรฐาน; limb leads คำนวณจาก I/II เมื่อ stream ส่งมาเป็น 3-channel</span>
                      <span className={`rounded-full border px-2 py-0.5 font-semibold ${dk ? 'border-sky-500/20 text-sky-300' : 'border-sky-200 text-sky-700'}`}>
                        12/12 lead slots
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
                      {LIVE_12_LEADS.map(({ key, label, color }) => (
                        <div key={key} className="min-w-0">
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                          <ECGCanvas
                            leadKey={key}
                            valueFrom={(leads) => buildLive12LeadFrame(leads)[key]}
                            paused={isFrozen}
                            label=""
                            color={color}
                            height={86}
                            emptyMessage="Lead unavailable"
                          />
                        </div>
                      ))}
                    </div>
                    <div className={`mt-3 rounded-xl border px-3 py-2 text-[10px] leading-relaxed ${
                      dk ? 'border-amber-500/20 bg-amber-500/[0.06] text-amber-200/85' : 'border-amber-200 bg-amber-50 text-amber-800'
                    }`}>
                      Hardware/USB ที่ส่งมาแค่ I, II, V5 จะแสดง V lead อื่นเป็น unavailable จนกว่าจะมีข้อมูลจริงหรือใช้ Demo/clinical ECG ที่มีครบ 12 leads
                    </div>
                  </>
                )}
              </div>
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
                  isUnknown
                    ? dk ? 'bg-white/[0.05] text-slate-400 border-white/10' : 'bg-slate-100 text-slate-500 border-slate-200'
                    : isNormal
                    ? dk ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : dk ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'         : 'bg-rose-50 text-rose-600 border-rose-200'
                }`}>
                  {isUnknown ? 'No signal' : isNormal ? 'Stable' : 'Alert'}
                </span>
              </div>

              {/* Secondary metrics */}
              <div className="grid grid-cols-2 gap-2.5">
                <MetricCard dk={dk} label="QTc" value={fmt(metrics?.qtc)} unit="ms"
                  color={metrics?.qtc == null ? (dk ? 'text-slate-500' : 'text-slate-400') : metrics.qtc > 450 ? (dk ? 'text-rose-400' : 'text-rose-600') : (dk ? 'text-sky-400' : 'text-sky-600')}
                  sub={metrics?.qtc == null ? '--' : metrics.qtc > 450 ? 'Prolonged' : 'Normal'} />
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
                      Simulated threshold crossed
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
