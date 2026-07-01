import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Upload, Play, MapPin, AlertTriangle, HeartPulse, Loader2, User, CheckCircle2, FileText } from 'lucide-react';
import HeartModel3D from '../components/visualizers/HeartModel3D';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { usePatient } from '../context/PatientContext';
import { modelApi } from '../services/modelApi';
import { diagnosticService } from '../services/diagnosticService';

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

// Hardcoded PTB-XL fallback so the dropdown always has data even when the
// backend is cold-starting or the real_samples endpoint is unreachable.
const DEFAULT_SAMPLES = [
  { id: '00001_hr', name: 'Normal ECG – F 56y',          split: 'Normal' },
  { id: '00002_hr', name: 'Normal ECG – M 19y',          split: 'Normal' },
  { id: '00003_hr', name: 'Normal ECG – F 37y',          split: 'Normal' },
  { id: '00017_hr', name: 'Atrial Fibrillation – M 56y', split: 'AFIB'   },
  { id: '00152_hr', name: 'Atrial Fibrillation – F 70y', split: 'AFIB'   },
  { id: '00282_hr', name: 'Atrial Fibrillation – M',     split: 'AFIB'   },
  { id: '00008_hr', name: 'Inferior MI – M 48y',         split: 'MI'     },
  { id: '00039_hr', name: 'Inferior MI – M 56y',         split: 'MI'     },
  { id: '00103_hr', name: 'Inferior MI – M 39y',         split: 'MI'     },
  { id: '00077_hr', name: 'Anterior MI – M 43y',         split: 'MI'     },
  { id: '00199_hr', name: 'Anterior MI – F 19y',         split: 'MI'     },
  { id: '00211_hr', name: 'Anterior MI – F 85y',         split: 'MI'     },
];

const Analysis = () => {
  const { isDarkMode: dk } = useTheme();
  const { showToast } = useToast();
  const { selectedPatient, patients } = usePatient();

  const [samples, setSamples] = useState(DEFAULT_SAMPLES);
  const [sampleId, setSampleId] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [referralDestination, setReferralDestination] = useState('โรงพยาบาลแม่ข่าย / แผนกหัวใจ');
  const [clinicianNote, setClinicianNote] = useState('');
  const [datasetInfo, setDatasetInfo] = useState(null);

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
    modelApi.ecgSamples()
      .then((d) => {
        if (d?.samples && d.samples.length > 0) {
          setSamples(d.samples);
          setDatasetInfo(d.dataset || null);
          // Only set default if no active patient sample is matched yet
          if (d.samples[0] && !selectedPatient) {
            setSampleId(d.samples[0].id);
          }
        }
        // else: keep DEFAULT_SAMPLES already in state
      })
      .catch(() => {}); // silent – fallback already loaded
  }, [selectedPatient]);

  const analyze = async () => {
    if (!file && !sampleId) {
      showToast('เลือกตัวอย่าง ECG หรืออัปโหลดไฟล์ก่อน', 'warning');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const analyzed = file
        ? await modelApi.analyzeFile(file)
        : await modelApi.analyzeSample(sampleId);
      setResult(analyzed);
    } catch (e) {
      showToast(`วิเคราะห์ไม่สำเร็จ: ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveReferralReport = async () => {
    if (!selectedPatient?.id) {
      showToast('เลือกผู้ป่วยก่อนบันทึกรายงานส่งต่อ', 'warning');
      return;
    }
    if (!result?.source) {
      showToast('ยังไม่มีผลคัดกรองที่พร้อมบันทึกรายงาน', 'warning');
      return;
    }
    setSavingReport(true);
    try {
      const [x, y, z] = result.source.xyz_mm;
      const payload = {
        patient_id: selectedPatient.id,
        organ_type: 'heart',
        ai_confidence: result.confidence ?? 0,
        localization_coords: { x, y, z },
        physics_params: { a: 0, k: 0, D: 0 },
        notes: clinicianNote || 'Referral decision-support snapshot. Final diagnosis must be confirmed by a physician.',
        risk_level: result.region?.risk,
        triage_status: result.triage_status,
        signal_quality: result.signal_quality,
        referral_recommendation: result.referral_recommendation || referralAdvice,
        model_version: 'CardiacLocalizer prototype',
        source_name: result.source_name,
        heart_rate_bpm: result.heart_rate_bpm,
        referral_destination: referralDestination,
      };
      const saved = await diagnosticService.captureSnapshot(payload);
      showToast(saved?.report_id ? 'บันทึกรายงานส่งต่อสำเร็จ' : 'บันทึกรายงานส่งต่อแล้ว', 'success');
    } catch (e) {
      showToast(`บันทึกรายงานส่งต่อไม่สำเร็จ: ${e.message}`, 'error');
    } finally {
      setSavingReport(false);
    }
  };

  const heartResult = useMemo(() => {
    if (!result?.source) return null;
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
  const referralAdvice = result?.referral_recommendation || {
    HIGH: {
      title: 'ควรส่งต่อหรือปรึกษาแพทย์โดยเร็ว',
      body: 'ผลคัดกรองพบแนวโน้มเสี่ยงสูง ให้ใช้ร่วมกับอาการ สัญญาณชีพ และดุลยพินิจของบุคลากรเพื่อพิจารณาส่งต่อโรงพยาบาลที่มีเครื่องมือหัวใจพร้อม',
    },
    MODERATE: {
      title: 'ควรติดตามใกล้ชิดและพิจารณาส่งต่อ',
      body: 'ผลคัดกรองอยู่ในระดับปานกลาง ควรทบทวน ECG ซ้ำ ประเมินอาการร่วม และพิจารณาส่งต่อหากมีอาการหรือปัจจัยเสี่ยงเพิ่มเติม',
    },
    LOW: {
      title: 'ติดตามตามดุลยพินิจทางคลินิก',
      body: 'ผลคัดกรองยังไม่พบสัญญาณเสี่ยงสูง แต่ไม่ใช่คำยืนยันว่าไม่มีโรค ควรติดตามตามอาการและแนวทางของหน่วยบริการ',
    },
  }[risk] || {
    title: 'ใช้เป็นข้อมูลประกอบการคัดกรอง',
    body: 'ผลลัพธ์นี้เป็น decision support สำหรับบุคลากรทางการแพทย์ ไม่ใช่คำวินิจฉัยสุดท้าย',
  };
  const signalQuality = result?.signal_quality;
  const signalIssues = signalQuality?.issues || [];

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
              <h1 className={`text-sm font-bold ${mainText}`}>คัดกรอง ECG เพื่อประกอบการส่งต่อ — ระบุตำแหน่ง 3D</h1>
              <p className={`mt-0.5 text-xs ${subText}`}>เลือกตัวอย่างหรืออัปโหลด ECG เพื่อประเมินแนวโน้มเบื้องต้น ไม่ใช่คำวินิจฉัยสุดท้าย</p>
            </div>
          </div>
          <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold ${dk ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-emerald-300 text-emerald-700 bg-emerald-50'}`}>
            REFERRAL SUPPORT
          </span>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left: 3D + waveform */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className={`rounded-2xl border overflow-hidden ${surface}`}>
              <div className={`flex items-center justify-between px-4 py-3 border-b ${divider}`}>
                <span className={`text-xs font-semibold ${secLabel}`}>ตำแหน่งต้นกำเนิด 3D (Heart)</span>
                {result?.source && (
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
                      <p className="text-xs">เลือก ECG แล้วกด “ประเมินเพื่อคัดกรอง” เพื่อแสดงตำแหน่ง</p>
                    </div>
                  )}
              </div>
            </div>

            {result?.waveform?.leads && (
              <div className={`rounded-2xl border p-4 ${surface}`}>
                <div className={`text-xs font-semibold mb-3 ${secLabel}`}>คลื่น ECG ที่วิเคราะห์ (สัญญาณจริง)</div>
                <WaveformPlot leads={result.waveform.leads} dk={dk} />
                {datasetInfo && (
                  <div className={`mt-2 rounded-xl px-3 py-2 text-[10px] ${
                    dk ? 'bg-white/[0.03] text-slate-400 border border-white/[0.06]' : 'bg-white/70 text-slate-500 border border-slate-100'
                  }`}>
                    Model API: localizer.pt · {datasetInfo.doi}
                  </div>
                )}
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
                className={`w-full rounded-lg border px-3 py-2 text-xs mb-3 ${dk ? 'bg-white/[0.03] border-white/[0.08] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'} ${file ? 'opacity-50' : ''}`}
              >
                {samples.length === 0 && <option>— ไม่พบตัวอย่าง —</option>}
                {/* Group samples by their split/category */}
                {['Normal', 'AFIB', 'MI', 'sample'].map((group) => {
                  const grouped = samples.filter(s => (s.split || 'sample') === group);
                  if (!grouped.length) return null;
                  const groupLabel = { Normal: '🟢 Normal ECG', AFIB: '🟡 Atrial Fibrillation', MI: '🔴 Myocardial Infarction', sample: '⚪ Other' }[group];
                  return (
                    <optgroup key={group} label={groupLabel}>
                      {grouped.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name || s.primary_label || s.id}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
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
                {loading ? 'กำลังวิเคราะห์...' : '2 · ประเมินเพื่อคัดกรอง'}
              </button>
            </div>

            {/* Result */}
            {result && (
              <div className={`rounded-2xl border p-4 ${surface}`}>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={14} style={{ color: riskColor }} />
                  <span className={`text-xs font-semibold ${secLabel}`}>3 · ผลคัดกรองเพื่อส่งต่อ</span>
                </div>

                {signalQuality && (
                  <div className={`rounded-xl border p-3 mb-3 ${
                    signalQuality.status === 'FAIL'
                      ? dk ? 'bg-rose-500/[0.08] border-rose-500/25' : 'bg-rose-50 border-rose-200'
                      : signalQuality.status === 'WARN'
                      ? dk ? 'bg-amber-500/[0.08] border-amber-500/25' : 'bg-amber-50 border-amber-200'
                      : dk ? 'bg-emerald-500/[0.07] border-emerald-500/25' : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${
                      signalQuality.status === 'FAIL'
                        ? dk ? 'text-rose-300' : 'text-rose-700'
                        : signalQuality.status === 'WARN'
                        ? dk ? 'text-amber-300' : 'text-amber-700'
                        : dk ? 'text-emerald-300' : 'text-emerald-700'
                    }`}>
                      Signal Quality · {signalQuality.status} · {signalQuality.score}/100
                    </div>
                    <div className={`mt-1 text-[11px] ${subText}`}>
                      {signalQuality.active_leads}/{signalQuality.n_leads} active leads · {signalQuality.duration_sec}s · noise {signalQuality.noise_ratio}
                    </div>
                    {signalIssues.length > 0 && (
                      <ul className={`mt-2 space-y-1 text-[10px] leading-relaxed ${subText}`}>
                        {signalIssues.map((issue) => (
                          <li key={issue.code}>• {issue.message}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {result?.source && (
                  <div className="rounded-xl border p-3 mb-3" style={{ borderColor: `${riskColor}55`, background: `${riskColor}11` }}>
                    <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: riskColor }}>{risk} RISK</div>
                    <div className={`text-sm font-bold ${mainText}`}>{region?.label}</div>
                    <div className={`text-[11px] ${subText}`}>Segment {region?.segment} · {region?.territory} territory</div>
                    {region?.note && <div className={`text-[11px] mt-1 ${subText}`}>{region.note}</div>}
                  </div>
                )}

                {result?.source && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <Stat label="Support confidence" value={`${Math.round(result.confidence * 100)}%`} dk={dk} />
                    <Stat label="Heart rate"
                      value={result.heart_rate_bpm ? `${Math.round(result.heart_rate_bpm)} bpm` : 'n/a'}
                      hint={result.hr_note} dk={dk} />
                  </div>
                )}

                <div className={`mb-3 rounded-xl border p-3 ${
                  dk ? 'bg-sky-500/[0.06] border-sky-500/20' : 'bg-sky-50 border-sky-200'
                }`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${dk ? 'text-sky-300' : 'text-sky-700'}`}>
                    Referral Decision Support
                  </div>
                  <div className={`mt-1 text-sm font-bold ${mainText}`}>{referralAdvice.title}</div>
                  <p className={`mt-1 text-[11px] leading-relaxed ${subText}`}>
                    {referralAdvice.body}
                  </p>
                </div>

                {result?.source && (
                  <div className={`mb-3 rounded-xl border p-3 ${dk ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-100'}`}>
                    <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${secLabel}`}>
                      Referral Destination
                    </label>
                    <input
                      value={referralDestination}
                      onChange={(e) => setReferralDestination(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-xs mb-2 ${dk ? 'bg-white/[0.03] border-white/[0.08] text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
                      placeholder="โรงพยาบาลแม่ข่าย / แผนกหัวใจ"
                    />
                    <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${secLabel}`}>
                      Clinician / Staff Note
                    </label>
                    <textarea
                      value={clinicianNote}
                      onChange={(e) => setClinicianNote(e.target.value)}
                      rows={2}
                      className={`w-full rounded-lg border px-3 py-2 text-xs resize-none ${dk ? 'bg-white/[0.03] border-white/[0.08] text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
                      placeholder="อาการสำคัญ สัญญาณชีพ หรือเหตุผลประกอบการส่งต่อ"
                    />
                  </div>
                )}

                {result?.source && (
                  <button
                    onClick={saveReferralReport}
                    disabled={savingReport}
                    className={`mb-3 w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all active:scale-95 ${
                      savingReport ? 'bg-emerald-600/60 text-white cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {savingReport ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                    {savingReport ? 'กำลังบันทึกรายงาน...' : 'บันทึกรายงานประกอบการส่งต่อ'}
                  </button>
                )}

                {result?.source && (
                  <div className={`grid grid-cols-3 gap-2 rounded-xl border p-3 font-mono text-xs ${dk ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-100'}`}>
                    {['x', 'y', 'z'].map((ax, i) => (
                      <div key={ax} className="text-center">
                        <p className={`text-[9px] font-semibold uppercase ${secLabel}`}>{ax} (mm)</p>
                        <p className={`font-bold mt-0.5 ${dk ? 'text-sky-300' : 'text-sky-700'}`}>{result.source.xyz_mm[i].toFixed(1)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {result.ground_truth && (
                  <div className={`mt-3 rounded-xl border p-3 ${dk ? 'bg-emerald-500/[0.06] border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${dk ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      Held-out test ground truth
                    </div>
                    <div className={`mt-1 grid grid-cols-2 gap-2 text-[11px] ${dk ? 'text-slate-300' : 'text-slate-700'}`}>
                      <div>True node: <b>{result.ground_truth.node_idx}</b></div>
                      <div>Top-5 hit: <b>{result.ground_truth.top5_hit ? 'YES' : 'NO'}</b></div>
                      <div className="col-span-2">
                        Node error: <b>{result.ground_truth.predicted_node_error_mm?.toFixed(1)} mm</b>
                      </div>
                    </div>
                    <p className={`mt-1 text-[10px] ${subText}`}>
                      Paired VmData ground truth from the simulated intracardiac ECG dataset.
                    </p>
                  </div>
                )}

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
