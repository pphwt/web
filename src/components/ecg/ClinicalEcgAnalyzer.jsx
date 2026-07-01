import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload, Play, Loader2, HeartPulse, AlertTriangle, Activity, Info, Database, CheckCircle2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { modelApi } from '../../services/modelApi';

// Measurement metrics → display config. `approx` marks values that come from
// open-source (neurokit2) delineation and can be less accurate than a certified
// cart on noisy real ECG — we label them honestly.
const METRICS = [
  { key: 'heart_rate_bpm', label: 'Heart rate', unit: 'bpm', approx: false, normal: [60, 100] },
  { key: 'pr_ms', label: 'PR', unit: 'ms', approx: true, normal: [120, 200] },
  { key: 'qrs_ms', label: 'QRS', unit: 'ms', approx: true, normal: [70, 110] },
  { key: 'qt_ms', label: 'QT', unit: 'ms', approx: true, normal: [320, 440] },
  { key: 'qtc_ms', label: 'QTc', unit: 'ms', approx: true, normal: [350, 450] },
  { key: 'axis_deg', label: 'Axis', unit: '°', approx: false, normal: [-30, 90] },
];

const REASON_TEXT = {
  window_too_short: 'สัญญาณสั้นเกินไป',
  insufficient_beats: 'จับ R-peak ไม่พอ',
  processing_failed: 'ประมวลผลไม่สำเร็จ',
  delineation_failed: 'หาขอบคลื่นไม่ได้',
  qt_or_rr_unavailable: 'QT/RR ไม่พอคำนวณ',
  leads_I_aVF_unavailable: 'ไม่มี lead I/aVF',
  qrs_bounds_unavailable: 'หาขอบ QRS ไม่ได้',
  bad_rr: 'RR ผิดปกติ',
};

const LEAD_ORDER = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];

function LeadTrace({ name, values, dk }) {
  const pts = useMemo(() => {
    if (!values || values.length < 2) return '';
    const mn = Math.min(...values);
    const mx = Math.max(...values);
    const span = mx - mn || 1;
    const N = values.length;
    return values.map((v, i) => `${(i / (N - 1)) * 100},${100 - ((v - mn) / span) * 100}`).join(' ');
  }, [values]);

  return (
    <div className={`rounded-lg border px-2 py-1.5 ${dk ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-100'}`}>
      <div className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{name}</div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-10">
        <polyline points={pts} fill="none" stroke={dk ? '#38bdf8' : '#0284c7'} strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

export default function ClinicalEcgAnalyzer() {
  const { isDarkMode: dk } = useTheme();
  const [file, setFile] = useState(null);
  const [samples, setSamples] = useState([]);
  const [sampleId, setSampleId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    modelApi.ecgSamples()
      .then((d) => setSamples(d?.samples || []))
      .catch(() => {});
  }, []);

  const surface = dk ? 'bg-[#0d1525] border-white/[0.06]' : 'bg-white border-slate-200';
  const secLabel = dk ? 'text-slate-500' : 'text-slate-400';
  const mainText = dk ? 'text-white' : 'text-slate-900';
  const subText = dk ? 'text-slate-400' : 'text-slate-500';

  const analyze = async () => {
    if (!file && !sampleId) { setError('เลือกตัวอย่างจริง หรืออัปโหลดไฟล์ก่อน'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      setResult(file
        ? await modelApi.analyzeEcgFile(file)
        : await modelApi.analyzeEcgSample(sampleId));
    } catch (e) {
      setError(e.message || 'วิเคราะห์ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const orderedLeads = useMemo(() => {
    if (!result?.waveform) return [];
    const names = Object.keys(result.waveform);
    const known = LEAD_ORDER.filter((l) => names.some((n) => n.toUpperCase() === l.toUpperCase()));
    const rest = names.filter((n) => !LEAD_ORDER.some((l) => l.toUpperCase() === n.toUpperCase()));
    const pick = (label) => names.find((n) => n.toUpperCase() === label.toUpperCase());
    return [...known.map(pick), ...rest];
  }, [result]);

  const q = result?.signal_quality;

  return (
    <div className="flex flex-col gap-5">
      {/* Input */}
      <div className={`rounded-2xl border p-4 ${surface}`}>
        <div className={`text-xs font-semibold mb-3 ${secLabel}`}>1 · เลือก ECG จริง</div>

        {samples.length > 0 && (
          <>
            <label className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${secLabel}`}>
              <Database size={11} /> ตัวอย่างจริง PTB-XL (มี label ยืนยัน)
            </label>
            <select
              value={sampleId}
              onChange={(e) => { setSampleId(e.target.value); setFile(null); setError(''); }}
              disabled={!!file}
              className={`w-full rounded-lg border px-3 py-2 text-xs mb-3 ${dk ? 'bg-white/[0.03] border-white/[0.08] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'} ${file ? 'opacity-50' : ''}`}
            >
              <option value="">— เลือกตัวอย่างจริง —</option>
              {samples.map((s) => (
                <option key={s.id} value={s.id}>{s.primary_label} · {s.id} ({s.sex}, {s.age ?? '?'}y)</option>
              ))}
            </select>
            <div className={`text-[10px] mb-3 ${secLabel}`}>หรืออัปโหลดไฟล์เอง</div>
          </>
        )}

        <label className={`flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-xs cursor-pointer mb-3 ${dk ? 'border-white/[0.12] text-slate-400 hover:bg-white/[0.03]' : 'border-slate-300 text-slate-500 hover:bg-slate-50'}`}>
          <Upload size={14} />
          <span className="truncate">{file ? file.name : 'เลือกไฟล์ (.npy / .csv / .hea+.dat / .dcm)'}</span>
          <input ref={inputRef} type="file" accept=".npy,.csv,.xlsx,.xls,.hea,.dat,.dcm,.png,.jpg,.jpeg" className="hidden"
            onChange={(e) => { setFile(e.target.files?.[0] || null); setSampleId(''); setError(''); }} />
        </label>
        <p className={`text-[10px] mb-3 ${subText}`}>
          รองรับ WFDB (PTB-XL / PhysioNet), DICOM-ECG, Excel (.xlsx), CSV, NumPy — 12-lead หรือ 10-lead ·
          รูปถ่าย ECG (.png/.jpg) = <b>BETA</b> single-lead
        </p>
        <button
          onClick={analyze}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all active:scale-95 ${loading ? 'bg-sky-600/60 text-white cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700 text-white'}`}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {loading ? 'กำลังวิเคราะห์...' : '2 · วัดผล ECG'}
        </button>
        {error && <p className="mt-2 text-[11px] text-rose-500">{error}</p>}
      </div>

      {result && (
        <>
          {result.meta?.format === 'image' && (
            <div className={`flex gap-2 rounded-xl border p-2.5 ${dk ? 'border-fuchsia-500/25 bg-fuchsia-500/[0.06]' : 'border-fuchsia-300 bg-fuchsia-50'}`}>
              <AlertTriangle size={13} className={`shrink-0 mt-0.5 ${dk ? 'text-fuchsia-400' : 'text-fuchsia-600'}`} />
              <p className={`text-[10px] leading-relaxed ${dk ? 'text-fuchsia-300/90' : 'text-fuchsia-700'}`}>
                <b>BETA · digitize จากรูปถ่าย</b> — {result.meta.note}
                {result.meta.px_per_mm_estimated && ' (px/mm ประมาณ — เวลา/HR อาจคลาดเคลื่อน)'}
              </p>
            </div>
          )}

          {/* Lead system + measurements */}
          <div className={`rounded-2xl border p-4 ${surface}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HeartPulse size={14} className={dk ? 'text-sky-400' : 'text-sky-600'} />
                <span className={`text-xs font-semibold ${secLabel}`}>3 · ค่าที่วัดได้ (Measurement Results)</span>
              </div>
              <span className={`rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase ${
                result.lead_system === 'clinical_12'
                  ? dk ? 'border-sky-500/30 text-sky-300 bg-sky-500/10' : 'border-sky-300 text-sky-700 bg-sky-50'
                  : dk ? 'border-slate-600 text-slate-400 bg-white/[0.03]' : 'border-slate-300 text-slate-500 bg-slate-50'
              }`}>
                {result.lead_system} · {result.lead_names?.length} leads
              </span>
            </div>

            {result.ground_truth_label && (
              <div className={`mb-3 flex items-center gap-2 rounded-xl border p-2.5 ${dk ? 'bg-emerald-500/[0.08] border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                <span className={`text-[11px] ${dk ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  Label ยืนยันจาก PTB-XL: <b>{result.ground_truth_label}</b>
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {METRICS.map(({ key, label, unit, approx, normal }) => {
                const m = result.measurements?.[key] || {};
                const has = m.value !== null && m.value !== undefined;
                const abnormal = has && normal && (m.value < normal[0] || m.value > normal[1]);
                return (
                  <div key={key} className={`rounded-xl border p-2.5 ${dk ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-100'}`}>
                    <p className={`text-[9px] font-semibold uppercase tracking-wider ${secLabel}`}>
                      {label}{approx && <span className="ml-1 opacity-60">≈</span>}
                    </p>
                    {has ? (
                      <p className={`text-lg font-bold mt-0.5 ${abnormal ? 'text-amber-500' : mainText}`}>
                        {m.value}<span className={`text-[10px] font-normal ml-1 ${subText}`}>{unit}</span>
                      </p>
                    ) : (
                      <p className={`text-xs font-semibold mt-1 ${subText}`}>— <span className="text-[9px]">{REASON_TEXT[m.reason] || m.reason}</span></p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={`mt-3 flex gap-2 rounded-lg border p-2 ${dk ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
              <Info size={12} className={`shrink-0 mt-0.5 ${subText}`} />
              <p className={`text-[10px] leading-relaxed ${subText}`}>
                วัดจาก lead <b>{result.measurements?.lead_used}</b> ด้วย neurokit2. ค่าที่มี <b>≈</b> (PR/QRS/QT/QTc)
                เป็น open-source delineation อาจคลาดเคลื่อนบน ECG จริงที่มี noise — ใช้ประกอบ ไม่ใช่ค่าจากเครื่องรับรอง
              </p>
            </div>
          </div>

          {/* Diagnostic classification (PTB-XL) */}
          <div className={`rounded-2xl border p-4 ${surface}`}>
            <div className={`text-xs font-semibold mb-3 flex items-center gap-2 ${secLabel}`}>
              <HeartPulse size={14} /> วินิจฉัยเบื้องต้น (Interpretation)
            </div>
            {result.classification ? (
              <div className="flex flex-col gap-2">
                <div className={`text-sm font-bold ${mainText}`}>
                  {result.classification.top_label}
                  <span className={`text-[11px] font-normal ml-2 ${subText}`}>
                    {Math.round(result.classification.top_probability * 100)}% · {result.classification.model}
                  </span>
                </div>
                {result.classification.labels.map((lb) => {
                  const p = result.classification.probabilities[lb] ?? 0;
                  return (
                    <div key={lb} className="flex items-center gap-2">
                      <span className={`w-14 text-[10px] font-semibold ${subText}`}>{lb}</span>
                      <div className={`flex-1 h-2 rounded-full overflow-hidden ${dk ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                        <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.round(p * 100)}%` }} />
                      </div>
                      <span className={`w-9 text-right text-[10px] font-mono ${subText}`}>{Math.round(p * 100)}%</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`flex gap-2 rounded-lg border p-2.5 ${dk ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                <Info size={12} className={`shrink-0 mt-0.5 ${subText}`} />
                <p className={`text-[10px] leading-relaxed ${subText}`}>{result.classification_note}</p>
              </div>
            )}
          </div>

          {/* 12-lead waveform */}
          <div className={`rounded-2xl border p-4 ${surface}`}>
            <div className={`text-xs font-semibold mb-3 flex items-center gap-2 ${secLabel}`}>
              <Activity size={14} /> คลื่น ECG จริง ({orderedLeads.length}-lead · {result.sample_rate_hz} Hz)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {orderedLeads.map((name) => (
                <LeadTrace key={name} name={name} values={result.waveform[name]} dk={dk} />
              ))}
            </div>
          </div>

          {/* Signal quality */}
          {q && (
            <div className={`rounded-2xl border p-3 ${surface}`}>
              <div className={`text-[10px] font-bold uppercase tracking-wider ${secLabel}`}>
                Signal Quality · {q.status} · {q.score}/100
              </div>
              <div className={`mt-1 text-[11px] ${subText}`}>
                {q.active_leads}/{q.n_leads} active leads · {q.duration_sec}s · noise {q.noise_ratio}
              </div>
            </div>
          )}

          {/* Localization gating — honest */}
          <div className={`rounded-2xl border p-3 ${
            result.localization
              ? dk ? 'bg-sky-500/[0.06] border-sky-500/20' : 'bg-sky-50 border-sky-200'
              : dk ? 'bg-amber-500/[0.06] border-amber-500/25' : 'bg-amber-50 border-amber-200'
          }`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider ${
              result.localization ? (dk ? 'text-sky-300' : 'text-sky-700') : (dk ? 'text-amber-300' : 'text-amber-700')
            }`}>
              3D Localization
            </div>
            {result.localization ? (
              <p className={`mt-1 text-[11px] ${subText}`}>
                รันบนสัญญาณ synthetic-compatible · region {result.localization.region?.label || '—'}
              </p>
            ) : (
              <p className={`mt-1 text-[11px] leading-relaxed ${subText}`}>
                {result.localization_note}
              </p>
            )}
          </div>

          {/* Disclaimer */}
          <div className={`flex gap-2 rounded-lg border p-2.5 ${dk ? 'border-amber-500/25 bg-amber-500/[0.06]' : 'border-amber-300 bg-amber-50'}`}>
            <AlertTriangle size={13} className={`shrink-0 mt-0.5 ${dk ? 'text-amber-400' : 'text-amber-600'}`} />
            <p className={`text-[10px] leading-relaxed ${dk ? 'text-amber-300/80' : 'text-amber-700'}`}>
              {result.disclaimer}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
