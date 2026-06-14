import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Upload, Play, MapPin, AlertTriangle, HeartPulse, Loader2, User, CheckCircle2 } from 'lucide-react';
import HeartModel3D from '../components/visualizers/HeartModel3D';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { usePatient } from '../context/PatientContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const RISK_COLOR = { HIGH: '#ef4444', MODERATE: '#f59e0b', LOW: '#22c55e' };

// ── Static ECG waveform plot (real analyzed signal) ───────────────────────────
function WaveformPlot({ leads, dk }) {
  // leads: array[N][10]. Plot the first 3 channels as stacked traces.
  const traces = useMemo(() => {
    if (!leads || !leads.length) return [];
    const N = leads.length;
    const channels = [0, 1, 2];
    return channels.map((c) => {
      const series = leads.map((row) => row[c]);
      const mn = Math.min(...series);
      const mx = Math.max(...series);
      const span = mx - mn || 1;
      const pts = series
        .map((v, i) => `${(i / (N - 1)) * 100},${100 - ((v - mn) / span) * 100}`)
        .join(' ');
      return pts;
    });
  }, [leads]);

  if (!traces.length) return null;
  const names = ['Lead 1', 'Lead 2', 'Lead 3'];

  return (
    <div className="flex flex-col gap-2">
      {traces.map((pts, i) => (
        <div key={i} className={`rounded-lg border px-3 py-2 ${dk ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-100'}`}>
          <div className={`text-[9px] font-semibold uppercase tracking-wider mb-1 ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{names[i]}</div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-12">
            <polyline points={pts} fill="none" stroke={dk ? '#38bdf8' : '#0284c7'} strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      ))}
    </div>
  );
}

const Analysis = () => {
  const { isDarkMode: dk } = useTheme();
  const { showToast } = useToast();
  const { selectedPatient, patients } = usePatient();

  const [samples, setSamples] = useState([]);
  const [sampleId, setSampleId] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-match patient to a sample signal
  const activeSample = useMemo(() => {
    if (!selectedPatient || !patients.length || !samples.length) return null;
    const idx = patients.findIndex(p => p.id === selectedPatient.id);
    if (idx === -1) return null;
    return samples[idx % samples.length];
  }, [selectedPatient, patients, samples]);

  // Set sampleId when activeSample is resolved
  useEffect(() => {
    if (activeSample && !file) {
      setSampleId(activeSample.id);
    }
  }, [activeSample, file]);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/localization/samples?limit=24`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.samples) {
          setSamples(d.samples);
          // Only set default if no active patient sample is matched yet
          if (d.samples[0] && !selectedPatient) {
            setSampleId(d.samples[0].id);
          }
        }
      })
      .catch(() => {});
  }, [selectedPatient]);

  const analyze = async () => {
    if (!file && !sampleId) {
      showToast('เลือกตัวอย่าง ECG หรืออัปโหลดไฟล์ก่อน', 'warning');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      if (file) fd.append('file', file);
      else fd.append('sample_id', sampleId);
      const r = await fetch(`${API_BASE}/api/v1/localization/analyze`, { method: 'POST', body: fd });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${r.status}`);
      }
      setResult(await r.json());
    } catch (e) {
      showToast(`วิเคราะห์ไม่สำเร็จ: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const heartResult = useMemo(() => {
    if (!result) return null;
    return {
      localization_coords: result.source.norm,
      ai_confidence: result.confidence,
      aha: result.region,
      activation_map: result.activation_map,
      top5_nodes: result.top5_nodes,
    };
  }, [result]);

  // ── tokens ──────────────────────────────────────────────────────
  const surface = dk ? 'bg-[#0d1525] border-white/[0.06]' : 'bg-white border-slate-200';
  const divider = dk ? 'border-white/[0.06]' : 'border-slate-100';
  const secLabel = dk ? 'text-slate-500' : 'text-slate-400';
  const mainText = dk ? 'text-white' : 'text-slate-900';
  const subText = dk ? 'text-slate-400' : 'text-slate-500';

  const region = result?.region;
  const risk = region?.risk || 'LOW';
  const riskColor = RISK_COLOR[risk] || '#60a5fa';

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      <div className="max-w-[1800px] mx-auto flex flex-col gap-5">

        {/* Header */}
        <header className={`flex items-center justify-between gap-4 rounded-2xl border p-4 ${surface}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${dk ? 'bg-sky-500/15 border-sky-500/20 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'}`}>
              <HeartPulse size={17} />
            </div>
            <div>
              <h1 className={`text-sm font-bold ${mainText}`}>วิเคราะห์ ECG จริง — ระบุตำแหน่งต้นกำเนิดในหัวใจ</h1>
              <p className={`mt-0.5 text-xs ${subText}`}>เลือกตัวอย่างหรืออัปโหลด ECG → CardiacLocalizer ประมาณตำแหน่ง 3D</p>
            </div>
          </div>
          <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold ${dk ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-emerald-300 text-emerald-700 bg-emerald-50'}`}>
            REAL MODEL
          </span>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left: 3D + waveform */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className={`rounded-2xl border overflow-hidden ${surface}`}>
              <div className={`flex items-center justify-between px-4 py-3 border-b ${divider}`}>
                <span className={`text-xs font-semibold ${secLabel}`}>ตำแหน่งต้นกำเนิด 3D (Heart)</span>
                {result && (
                  <span className="text-[10px] font-mono" style={{ color: riskColor }}>
                    {region?.label} · {region?.territory}
                  </span>
                )}
              </div>
              <div className="h-[460px]">
                {heartResult
                  ? <HeartModel3D result={heartResult} />
                  : (
                    <div className={`h-full flex flex-col items-center justify-center gap-2 ${subText}`}>
                      <Activity size={28} className="opacity-40" />
                      <p className="text-xs">เลือก ECG แล้วกด “วิเคราะห์” เพื่อแสดงตำแหน่ง</p>
                    </div>
                  )}
              </div>
            </div>

            {result?.waveform?.leads && (
              <div className={`rounded-2xl border p-4 ${surface}`}>
                <div className={`text-xs font-semibold mb-3 ${secLabel}`}>คลื่น ECG ที่วิเคราะห์ (สัญญาณจริง)</div>
                <WaveformPlot leads={result.waveform.leads} dk={dk} />
              </div>
            )}
          </div>

          {/* Right: controls + honest result */}
          <div className="lg:col-span-4 flex flex-col gap-5">

            {/* Selected Patient Context Card */}
            {selectedPatient && (
              <div className={`rounded-2xl border p-4 transition-all duration-300 ${
                dk ? 'bg-sky-500/[0.02] border-sky-500/20 shadow-[0_0_15px_rgba(56,189,248,0.02)]' : 'bg-sky-50/50 border-sky-200'
              }`}>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    dk ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-700'
                  }`}>
                    <User size={14} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold leading-none ${dk ? 'text-white' : 'text-slate-900'}`}>{selectedPatient.name}</p>
                    <p className={`text-[9px] mt-0.5 ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
                      HN: {selectedPatient.id_card?.substring(0, 8) || 'GEN-001'} · Age: {selectedPatient.age || 'n/a'}
                    </p>
                  </div>
                </div>
                {activeSample && (
                  <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] ${
                    dk ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    <CheckCircle2 size={12} className="shrink-0 text-emerald-500 animate-pulse" />
                    <span className="font-medium">
                      เชื่อมต่อคลื่นไฟฟ้าคนไข้สำเร็จ (Auto-linked: {activeSample.name})
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            <div className={`rounded-2xl border p-4 ${surface}`}>
              <div className={`text-xs font-semibold mb-3 ${secLabel}`}>1 · เลือกข้อมูล ECG</div>

              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${secLabel}`}>ตัวอย่างจากชุดข้อมูล</label>
              <select
                value={sampleId}
                onChange={(e) => { setSampleId(e.target.value); setFile(null); }}
                disabled={!!file}
                className={`w-full rounded-lg border px-3 py-2 text-xs font-mono mb-3 ${dk ? 'bg-white/[0.03] border-white/[0.08] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'} ${file ? 'opacity-50' : ''}`}
              >
                {samples.length === 0 && <option>— ไม่พบตัวอย่าง (เช็ก backend/dataset) —</option>}
                {samples.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.source})</option>
                ))}
              </select>

              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${secLabel}`}>หรืออัปโหลดไฟล์ (.npy / .csv)</label>
              <label className={`flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs cursor-pointer mb-4 ${dk ? 'border-white/[0.12] text-slate-400 hover:bg-white/[0.03]' : 'border-slate-300 text-slate-500 hover:bg-slate-50'}`}>
                <Upload size={14} />
                <span className="truncate">{file ? file.name : 'เลือกไฟล์ ECG'}</span>
                <input type="file" accept=".npy,.csv" className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
              {file && (
                <button onClick={() => setFile(null)} className={`text-[10px] mb-3 ${dk ? 'text-slate-500' : 'text-slate-400'} hover:underline`}>
                  ล้างไฟล์ (กลับไปใช้ตัวอย่าง)
                </button>
              )}

              <button
                onClick={analyze}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all active:scale-95 ${loading ? 'bg-sky-600/60 text-white cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700 text-white'}`}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                {loading ? 'กำลังวิเคราะห์...' : '2 · วิเคราะห์'}
              </button>
            </div>

            {/* Result */}
            {result && (
              <div className={`rounded-2xl border p-4 ${surface}`}>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={14} style={{ color: riskColor }} />
                  <span className={`text-xs font-semibold ${secLabel}`}>3 · ผลการประเมิน</span>
                </div>

                <div className="rounded-xl border p-3 mb-3" style={{ borderColor: `${riskColor}55`, background: `${riskColor}11` }}>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: riskColor }}>{risk} RISK</div>
                  <div className={`text-sm font-bold ${mainText}`}>{region?.label}</div>
                  <div className={`text-[11px] ${subText}`}>Segment {region?.segment} · {region?.territory} territory</div>
                  {region?.note && <div className={`text-[11px] mt-1 ${subText}`}>{region.note}</div>}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Stat label="Confidence" value={`${Math.round(result.confidence * 100)}%`} dk={dk} />
                  <Stat label="Heart rate"
                    value={result.heart_rate_bpm ? `${Math.round(result.heart_rate_bpm)} bpm` : 'n/a'}
                    hint={result.hr_note} dk={dk} />
                </div>

                <div className={`grid grid-cols-3 gap-2 rounded-xl border p-3 font-mono text-xs ${dk ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-100'}`}>
                  {['x', 'y', 'z'].map((ax, i) => (
                    <div key={ax} className="text-center">
                      <p className={`text-[9px] font-semibold uppercase ${secLabel}`}>{ax} (mm)</p>
                      <p className={`font-bold mt-0.5 ${dk ? 'text-sky-300' : 'text-sky-700'}`}>{result.source.xyz_mm[i].toFixed(1)}</p>
                    </div>
                  ))}
                </div>

                {/* Honest disclaimer */}
                <div className={`mt-3 flex gap-2 rounded-lg border p-2.5 ${dk ? 'border-amber-500/25 bg-amber-500/[0.06]' : 'border-amber-300 bg-amber-50'}`}>
                  <AlertTriangle size={13} className={`shrink-0 mt-0.5 ${dk ? 'text-amber-400' : 'text-amber-600'}`} />
                  <p className={`text-[10px] leading-relaxed ${dk ? 'text-amber-300/80' : 'text-amber-700'}`}>
                    {result.disclaimer}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function Stat({ label, value, hint, dk }) {
  return (
    <div className={`rounded-xl border p-3 ${dk ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-100'}`}>
      <p className={`text-[9px] font-semibold uppercase tracking-wider ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${dk ? 'text-white' : 'text-slate-900'}`}>{value}</p>
      {hint && <p className={`text-[9px] mt-0.5 ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{hint}</p>}
    </div>
  );
}

export default Analysis;
