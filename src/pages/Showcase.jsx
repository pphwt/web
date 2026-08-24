import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Clock3,
  Download, Expand, FlaskConical, HeartPulse, LockKeyhole,
  Play, RefreshCw, RotateCcw, ShieldCheck, TriangleAlert, XCircle,
} from 'lucide-react';
import HeartModel3D from '../components/visualizers/HeartModel3D';
import { useTheme } from '../context/ThemeContext';
import { modelApi } from '../services/modelApi';

const CHAPTERS = [
  { id: 'hook', speaker: 1, duration: 35, title: 'จากภาพกระดาษ สู่หลักฐานที่ตรวจสอบได้', subtitle: 'ปัญหาและเหตุผลที่ระบบนี้ต้องมี' },
  { id: 'workflow', speaker: 1, duration: 80, title: 'Clinical workflow ที่ไม่ข้าม safety gate', subtitle: 'รับไฟล์ → คุณภาพ → วิเคราะห์ → แพทย์ทบทวน' },
  { id: 'normal', speaker: 2, duration: 60, title: 'Demo 1 — สัญญาณอ่านได้', subtitle: 'Normal synthetic case' },
  { id: 'repeat', speaker: 2, duration: 55, title: 'Demo 2 — คุณภาพไม่ผ่าน', subtitle: 'ระบบหยุด AI และขอทำ ECG ซ้ำ' },
  { id: 'risk', speaker: 2, duration: 55, title: 'Demo 3 — Referral support', subtitle: 'ยกระดับให้ clinician review ไม่วินิจฉัยอัตโนมัติ' },
  { id: 'regional', speaker: 3, duration: 55, title: '3D Regional Evidence', subtitle: 'Top regions จาก relative activation — ไม่ใช่ probability' },
  { id: 'evidence', speaker: 3, duration: 50, title: 'Evidence, Audit & Security', subtitle: 'ทุก claim มี source, hash, readiness และข้อจำกัด' },
  { id: 'close', speaker: 3, duration: 30, title: 'AI ที่รู้ว่าเมื่อไรควรหยุด', subtitle: 'Decision-support ที่วัดผลและตรวจสอบย้อนหลังได้' },
];

const TOTAL_SECONDS = CHAPTERS.reduce((sum, chapter) => sum + chapter.duration, 0);
const CASE_BY_CHAPTER = { normal: 'normal', repeat: 'repeat', risk: 'risk' };

const formatTime = (seconds) => {
  const safe = Math.max(0, Math.round(seconds || 0));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
};

const statusClass = (status) => {
  if (status === 'pass' || status === 'PASS' || status === 'complete') return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
  if (status === 'fail' || status === 'FAIL' || status === 'skipped') return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
  return 'border-amber-400/35 bg-amber-400/10 text-amber-100';
};

function Trace({ result, color = '#38bdf8' }) {
  const values = result?.analysis?.waveform?.leads?.map((row) => Number(row?.[0] || 0)) || [];
  if (!values.length) return <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-600 text-sm text-slate-400">Trace withheld by quality gate</div>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1e-8);
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 600},${100 - ((value - min) / span) * 82}`).join(' ');
  return (
    <svg viewBox="0 0 600 112" className="h-28 w-full rounded-xl border border-white/10 bg-white" role="img" aria-label="Extracted synthetic ECG trace">
      <defs><pattern id="showcase-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#fecdd3" strokeWidth="0.7" /></pattern></defs>
      <rect width="600" height="112" fill="url(#showcase-grid)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

function Preflight({ checks, running, onRun, onStart }) {
  const criticalFailed = checks.some((check) => check.critical && check.status !== 'pass');
  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col justify-center px-8 py-10">
      <div className="mb-8 text-center">
        <p className="text-xs font-black uppercase tracking-[0.32em] text-sky-300">National Evidence Upgrade v0.3</p>
        <h1 className="mt-3 text-4xl font-black text-white md:text-6xl">Showcase Preflight</h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-slate-300">ตรวจ API, model hashes, OCR, manifest และ synthetic demo assets ก่อนเริ่มวิดีโอ 7 นาที</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map((check) => (
          <div key={check.name} className={`rounded-2xl border p-4 ${statusClass(check.status)}`}>
            <div className="flex items-center gap-2">
              {check.status === 'pass' ? <CheckCircle2 size={18} /> : check.status === 'fail' ? <XCircle size={18} /> : <AlertTriangle size={18} />}
              <span className="font-black">{check.label}</span>
            </div>
            <p className="mt-2 text-xs opacity-80">{check.detail}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onRun} disabled={running} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 font-bold text-slate-200 hover:bg-white/5 disabled:opacity-50">
          <RefreshCw size={17} className={running ? 'animate-spin' : ''} /> Run preflight
        </button>
        <button type="button" onClick={onStart} disabled={running || criticalFailed || !checks.length} className="inline-flex items-center gap-2 rounded-xl bg-sky-400 px-6 py-3 font-black text-slate-950 shadow-lg shadow-sky-500/20 disabled:cursor-not-allowed disabled:opacity-40">
          <Play size={18} fill="currentColor" /> Start 7-minute showcase
        </button>
      </div>
      {criticalFailed && <p className="mt-4 text-center text-sm text-rose-200">Critical preflight ยังไม่ผ่าน ระบบจะไม่ถือว่า ready และไม่สร้างสถานะผ่านแทนค่าที่ตรวจไม่ได้</p>}
    </div>
  );
}

function WorkflowScene({ stages = [] }) {
  return (
    <div className="grid h-full grid-cols-1 gap-5 p-8 lg:grid-cols-6 lg:p-12">
      <div className="flex flex-col justify-center lg:col-span-2">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-sky-300">Safety-first workflow</p>
        <h2 className="mt-3 text-4xl font-black leading-tight text-white">AI ทำงานต่อ<br />เมื่อหลักฐานพร้อมเท่านั้น</h2>
        <p className="mt-5 text-lg leading-relaxed text-slate-300">หากภาพอ่านไม่ได้ ระบบจะหยุดก่อน classification และ 3D localization แล้วส่งกลับไปทำ ECG ซ้ำ</p>
      </div>
      <div className="grid content-center gap-3 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-3">
        {stages.map((stage, index) => (
          <div key={stage.id} className="relative rounded-2xl border border-white/10 bg-white/[0.045] p-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-400 text-sm font-black text-slate-950">{index + 1}</span>
            <h3 className="mt-4 text-lg font-black text-white">{stage.label}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{stage.evidence}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoScene({ caseInfo, result, loading }) {
  const quality = result?.analysis?.signal_quality || {};
  const screening = result?.screening_support || caseInfo?.screening_support || {};
  const tone = caseInfo?.tone === 'rose' ? '#fb7185' : caseInfo?.tone === 'amber' ? '#fbbf24' : '#34d399';
  const reasons = [
    ...(quality.issues || []).map((item) => item.code),
    ...(quality.artifact_profile || []).map((item) => item.code || item),
  ].filter(Boolean);
  return (
    <div className="grid h-full grid-cols-1 gap-5 p-7 lg:grid-cols-12 lg:p-10">
      <div className="flex min-h-0 flex-col lg:col-span-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-black text-sky-200">SOURCE IMAGE</span>
          <span className="font-mono text-xs text-slate-400">{caseInfo?.source_image}</span>
        </div>
        <div className="mt-3 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white p-2">
          {caseInfo && <img src={`/demo/${caseInfo.source_image}`} alt="Synthetic ECG source" className="max-h-full w-full object-contain" />}
        </div>
        <div className="mt-3"><Trace result={result} color={tone} /></div>
      </div>
      <div className="flex flex-col justify-center lg:col-span-7">
        {loading ? <div className="flex items-center gap-3 text-xl font-black text-sky-200"><RefreshCw className="animate-spin" /> Processing synthetic ECG through backend…</div> : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Quality gate', quality.status || 'not_available'],
                ['Quality score', quality.score != null ? `${quality.score}/100` : '—'],
                ['Decision support', screening.decision || 'REVIEW'],
                ['Database write', result?.demo?.writes_to_clinical_db === false ? 'NONE' : 'UNKNOWN'],
              ].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 break-words text-lg font-black text-white">{value}</p></div>)}
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Processing timeline</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {(result?.timeline || []).map((step) => (
                  <div key={step.stage} className="flex items-center gap-2 text-sm text-slate-200">
                    {step.status === 'complete' ? <CheckCircle2 className="text-emerald-400" size={16} /> : <AlertTriangle className="text-amber-300" size={16} />}
                    <span>{step.stage.replaceAll('_', ' ')}</span><span className="ml-auto font-mono text-xs text-slate-500">{step.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-4"><p className="text-xs font-black uppercase tracking-wider text-amber-200">Quality reasons</p><p className="mt-2 text-sm leading-relaxed text-amber-100">{reasons.length ? reasons.join(' · ') : 'No blocking artifact detected'}</p></div>
              <div className="rounded-2xl border border-sky-400/25 bg-sky-400/[0.07] p-4"><p className="text-xs font-black uppercase tracking-wider text-sky-200">Screening / referral support</p><p className="mt-2 text-sm leading-relaxed text-sky-100">{screening.finding}. {screening.reason}</p></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RegionalScene({ result }) {
  const analysis = result?.analysis || {};
  const candidates = analysis.regional_candidates || [];
  const visualResult = analysis.source?.norm ? {
    localization_supported: analysis.localization_supported,
    localization_coords: analysis.source.norm,
    ai_confidence: analysis.confidence,
    confidence_type: analysis.confidence_type,
    aha: analysis.region,
    activation_map: analysis.activation_map,
    top5_nodes: analysis.top5_nodes,
    regional_candidates: candidates,
    uncertainty: { uncertainty_radius_mm: null, calibration_status: 'pending' },
    validation: { clinical_12_lead_validated: false },
  } : { localization_supported: false };
  return (
    <div className="grid h-full grid-cols-1 gap-5 p-7 lg:grid-cols-12 lg:p-10">
      <div className="min-h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-[#f7f3eb] lg:col-span-7"><HeartModel3D result={visualResult} /></div>
      <div className="flex flex-col justify-center lg:col-span-5">
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-100"><TriangleAlert className="inline" size={18} /> <b className="ml-2">RESEARCH-ONLY REGIONAL ESTIMATE</b><p className="mt-2 text-sm">ไม่ใช่ตำแหน่งโรคที่ยืนยัน และ relative activation score ไม่ใช่ probability</p></div>
        <div className="mt-4 space-y-3">
          {candidates.length ? candidates.map((candidate) => (
            <div key={`${candidate.rank}-${candidate.aha_segment}`} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-center justify-between"><p className="text-lg font-black text-white">#{candidate.rank} · AHA {candidate.aha_segment} {candidate.label}</p><span className="rounded-full bg-sky-400/10 px-3 py-1 text-xs font-black text-sky-200">{candidate.territory}</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-400" style={{ width: `${Math.max(4, Number(candidate.relative_activation_score || 0) * 100)}%` }} /></div>
              <p className="mt-2 font-mono text-xs text-slate-400">relative activation {Number(candidate.relative_activation_score || 0).toFixed(3)} · not probability</p>
            </div>
          )) : <div className="rounded-2xl border border-dashed border-slate-600 p-5 text-slate-300">Regional candidates unavailable — no replacement estimate is generated.</div>}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl border border-white/10 p-3 text-slate-300">Uncertainty radius<br /><b className="text-white">not_available</b></div><div className="rounded-xl border border-white/10 p-3 text-slate-300">Clinical 12-lead validated<br /><b className="text-rose-300">false</b></div></div>
      </div>
    </div>
  );
}

export default function Showcase() {
  useTheme();
  const [summary, setSummary] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [demoResults, setDemoResults] = useState({});
  const [preflight, setPreflight] = useState([]);
  const [preflightRunning, setPreflightRunning] = useState(true);
  const [started, setStarted] = useState(false);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [chapterStartedAt, setChapterStartedAt] = useState(null);
  const [chapterElapsed, setChapterElapsed] = useState(0);
  const [safeGuides, setSafeGuides] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);

  const runPreflight = useCallback(async () => {
    setPreflightRunning(true);
    const checks = [];
    try {
      const [progress, cases] = await Promise.all([modelApi.progressSummary(), modelApi.demoCases()]);
      setSummary(progress);
      setCatalog(cases.cases || []);
      checks.push({ name: 'api', label: 'API', status: 'pass', detail: 'Authenticated progress and demo APIs responded', critical: true });
      checks.push({ name: 'manifest', label: 'Validation manifest', status: progress.manifest_sha256 ? 'pass' : 'fail', detail: progress.manifest_sha256 ? `sha256 ${progress.manifest_sha256.slice(0, 16)}…` : 'Manifest hash unavailable', critical: true });
      const modelChecks = (progress.release_gate?.checks || []).filter((check) => check.name.startsWith('model_hash:'));
      checks.push({ name: 'models', label: 'Model hashes', status: modelChecks.length && modelChecks.every((check) => check.status === 'pass') ? 'pass' : 'fail', detail: `${modelChecks.filter((check) => check.status === 'pass').length}/${modelChecks.length} declared model files verified`, critical: true });
      checks.push({ name: 'ocr', label: 'OCR', status: progress.readiness?.ocr?.available ? 'pass' : 'not_available', detail: progress.readiness?.ocr?.available ? `${progress.readiness.ocr.engine} ${progress.readiness.ocr.version}` : 'Optional OCR runtime unavailable', critical: false });

      const assetChecks = await Promise.all((cases.cases || []).map((item) => new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(true);
        image.onerror = () => resolve(false);
        image.src = `/demo/${item.source_image}?preflight=1`;
      })));
      checks.push({ name: 'assets', label: 'Demo assets', status: assetChecks.length === 3 && assetChecks.every(Boolean) ? 'pass' : 'fail', detail: `${assetChecks.filter(Boolean).length}/3 synthetic source images loaded`, critical: true });

      const runs = await Promise.all((cases.cases || []).map((item) => modelApi.runDemoCase(item.id)));
      const nextResults = Object.fromEntries(runs.map((result) => [result.demo.case_id, result]));
      setDemoResults(nextResults);
      const isolated = runs.length === 3 && runs.every((result) => result.demo?.synthetic && result.demo?.writes_to_clinical_db === false && result.demo?.patient_id == null && result.demo?.report_id == null);
      checks.push({ name: 'demo-runtime', label: 'Synthetic runtime', status: isolated ? 'pass' : 'fail', detail: `${runs.length}/3 cases processed · no clinical database writes`, critical: true });
    } catch (error) {
      checks.push({ name: 'api', label: 'API / demo runtime', status: 'fail', detail: error.message || 'Backend unavailable', critical: true });
    }
    setPreflight(checks);
    setPreflightRunning(false);
  }, []);

  useEffect(() => { runPreflight(); }, [runPreflight]);

  useEffect(() => {
    if (!startedAt) return undefined;
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      setChapterElapsed(Math.floor((Date.now() - chapterStartedAt) / 1000));
    }, 250);
    return () => window.clearInterval(timer);
  }, [chapterStartedAt, startedAt]);

  const goTo = useCallback((index) => {
    const next = Math.max(0, Math.min(CHAPTERS.length - 1, index));
    setChapterIndex(next);
    setChapterStartedAt(Date.now());
    setChapterElapsed(0);
  }, []);

  const reset = useCallback(() => {
    setStarted(false);
    setStartedAt(null);
    setElapsed(0);
    setChapterIndex(0);
    setChapterElapsed(0);
    setDemoResults({});
    runPreflight();
  }, [runPreflight]);

  useEffect(() => {
    const handler = (event) => {
      if (!started) return;
      if (['INPUT', 'TEXTAREA'].includes(event.target?.tagName)) return;
      if (event.key === 'ArrowRight' || event.key === ' ') { event.preventDefault(); goTo(chapterIndex + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(chapterIndex - 1); }
      if (event.key.toLowerCase() === 'r') reset();
      if (event.key.toLowerCase() === 'f') document.documentElement.requestFullscreen?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [chapterIndex, goTo, reset, started]);

  const start = () => {
    const now = Date.now();
    setStarted(true);
    setStartedAt(now);
    setChapterStartedAt(now);
    setChapterIndex(0);
    setElapsed(0);
    setChapterElapsed(0);
  };

  const downloadEvidence = useCallback(async () => {
    setDownloadBusy(true);
    try {
      const { blob, filename } = await modelApi.evidencePack();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(href);
    } finally {
      setDownloadBusy(false);
    }
  }, []);

  const chapter = CHAPTERS[chapterIndex];
  const caseId = CASE_BY_CHAPTER[chapter.id];
  const caseInfo = catalog.find((item) => item.id === caseId);
  const riskResult = demoResults.risk;
  const benchmark = summary?.benchmark?.baseline || {};
  const gate = summary?.release_gate || {};
  const chapterRemaining = chapter.duration - chapterElapsed;
  const totalRemaining = TOTAL_SECONDS - elapsed;
  const chapterProgress = Math.min(100, (chapterElapsed / chapter.duration) * 100);
  const evidenceChecks = (gate.checks || []).filter((check) => ['validation_manifest_sha256', 'synthetic_baseline_benchmark', 'mesh_landmark_transform', 'authentication_coverage', 'demo_isolation'].includes(check.name));

  const scene = useMemo(() => {
    if (chapter.id === 'workflow') return <WorkflowScene stages={summary?.workflow?.stages || []} />;
    if (caseId) return <DemoScene caseInfo={caseInfo} result={demoResults[caseId]} loading={!demoResults[caseId]} />;
    if (chapter.id === 'regional') return <RegionalScene result={riskResult} />;
    if (chapter.id === 'evidence') return (
      <div className="grid h-full grid-cols-1 gap-5 p-8 lg:grid-cols-12 lg:p-12">
        <div className="flex flex-col justify-center lg:col-span-5">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-sky-300">Reproducible evidence</p>
          <h2 className="mt-3 text-4xl font-black text-white">วัดได้ · ตรวจได้ · ไม่ปน PHI</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><p className="text-xs text-slate-400">Synthetic golden set</p><p className="mt-1 text-3xl font-black text-white">n={benchmark.sample_count ?? '—'}</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><p className="text-xs text-slate-400">Lead detection F1</p><p className="mt-1 text-3xl font-black text-white">{benchmark.metrics?.lead_detection_f1?.toFixed?.(3) || '—'}</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><p className="text-xs text-slate-400">Evidence SHA</p><p className="mt-1 break-all font-mono text-sm font-black text-sky-200">{benchmark.evidence_sha256?.slice(0, 20) || 'not_available'}…</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><p className="text-xs text-slate-400">Candidate comparison</p><p className="mt-1 text-xl font-black text-amber-200">{summary?.benchmark?.candidate?.status || 'not_available'}</p></div>
          </div>
          <button type="button" onClick={downloadEvidence} disabled={downloadBusy} className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-sky-400 px-5 py-3 font-black text-slate-950 disabled:opacity-50"><Download size={18} /> Download non-PHI Evidence Pack</button>
        </div>
        <div className="grid content-center gap-3 sm:grid-cols-2 lg:col-span-7">
          {evidenceChecks.map((check) => <div key={check.name} className={`rounded-2xl border p-5 ${statusClass(check.status)}`}><div className="flex items-center gap-2">{check.status === 'pass' ? <CheckCircle2 /> : <AlertTriangle />}<p className="font-black">{check.name.replaceAll('_', ' ')}</p></div><p className="mt-2 text-sm opacity-80">{check.reason || 'Evidence verified from current release.'}</p></div>)}
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-amber-100"><LockKeyhole /><p className="mt-3 font-black">Release Gate: {gate.status || 'not_available'}</p><p className="mt-2 text-sm">ค่าที่ตรวจไม่ได้จะคง not_available และไม่นับเป็น pass</p></div>
        </div>
      </div>
    );
    if (chapter.id === 'close') return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <ShieldCheck size={58} className="text-sky-300" />
        <h2 className="mt-6 text-4xl font-black leading-tight text-white md:text-6xl">เป้าหมายไม่ใช่ให้ AI<br />ตัดสินใจแทนแพทย์</h2>
        <p className="mt-6 max-w-3xl text-xl leading-relaxed text-slate-300">แต่คือทำให้ ECG จากภาพอ่านได้อย่างมี safety gate ชี้หลักฐานเชิงภูมิภาคอย่างซื่อสัตย์ และส่งข้อมูลที่ตรวจสอบย้อนหลังได้ให้แพทย์ตัดสินใจเร็วขึ้น</p>
        <p className="mt-7 rounded-full border border-amber-400/30 bg-amber-400/10 px-6 py-2 font-black text-amber-100">CLINICIAN DECISION-SUPPORT · NOT AUTONOMOUS DIAGNOSIS</p>
      </div>
    );
    return (
      <div className="relative flex h-full items-center overflow-hidden px-8 lg:px-16">
        <div className="absolute -right-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="relative max-w-5xl"><p className="text-sm font-black uppercase tracking-[0.3em] text-sky-300">ECG IMAGE → SAFETY EVIDENCE → CLINICIAN</p><h2 className="mt-5 text-5xl font-black leading-[1.08] text-white md:text-7xl">ภาพ ECG หนึ่งใบ<br /><span className="text-sky-300">ควรให้มากกว่าคำตอบ</span></h2><p className="mt-7 max-w-3xl text-xl leading-relaxed text-slate-300">ระบบต้องบอกได้ว่าอ่านจากอะไร คุณภาพพอหรือไม่ AI ใช้หลักฐานใด จุด 3D มีข้อจำกัดอย่างไร และใครเป็นผู้ตัดสินใจสุดท้าย</p><div className="mt-8 flex flex-wrap gap-3">{['Quality gate', 'Digitization', 'Regional 3D', 'Clinician review', 'Audit trail'].map((item) => <span key={item} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 font-bold text-slate-200">{item}</span>)}</div></div>
      </div>
    );
  }, [benchmark, caseId, caseInfo, chapter.id, demoResults, downloadBusy, downloadEvidence, evidenceChecks, gate.status, riskResult, summary]);

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-black text-white">
      <div className="relative overflow-hidden bg-[#050914]" style={{ width: 'min(100vw, 177.7778vh)', height: 'min(100vh, 56.25vw)' }}>
      {!started ? <Preflight checks={preflight} running={preflightRunning} onRun={runPreflight} onStart={start} /> : (
        <div className="relative flex h-full flex-col">
          {safeGuides && <div className="pointer-events-none absolute inset-y-0 left-1/2 z-40 w-[31.64%] -translate-x-1/2 border-x border-dashed border-fuchsia-300/50 bg-fuchsia-400/[0.025]"><span className="absolute right-2 top-20 text-[10px] font-black text-fuchsia-200">9:16 SAFE AREA</span></div>}
          <header className="relative z-50 flex h-20 shrink-0 items-center gap-4 border-b border-white/10 bg-[#070c18]/95 px-5">
            <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-400 text-slate-950"><HeartPulse size={21} /></div><div className="min-w-0"><p className="truncate text-sm font-black text-white">{chapter.title}</p><p className="truncate text-xs text-slate-400">ผู้พูดคนที่ {chapter.speaker} · {chapter.subtitle}</p></div></div>
            <div className="mx-auto hidden min-w-[260px] max-w-xl flex-1 md:block"><div className="flex justify-between text-[10px] font-bold text-slate-500"><span>CHAPTER {chapterIndex + 1}/{CHAPTERS.length}</span><span>{Math.round(chapterProgress)}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-sky-400 transition-all" style={{ width: `${chapterProgress}%` }} /></div></div>
            <div className="ml-auto flex items-center gap-2 font-mono"><div className={`rounded-xl border px-3 py-2 text-sm font-black ${chapterRemaining < 0 ? 'border-rose-400/40 bg-rose-400/10 text-rose-200' : 'border-white/10 text-slate-200'}`}><Clock3 size={14} className="mr-2 inline" />{formatTime(chapterRemaining)}</div><div className={`rounded-xl border px-3 py-2 text-sm font-black ${totalRemaining < 0 ? 'border-rose-400/40 bg-rose-400/10 text-rose-200' : 'border-sky-400/25 bg-sky-400/10 text-sky-200'}`}>{formatTime(elapsed)} / 07:00</div></div>
          </header>
          <div className="relative min-h-0 flex-1">{scene}</div>
          <footer className="relative z-50 flex h-16 shrink-0 items-center border-t border-white/10 bg-[#070c18]/95 px-5">
            <div className="flex items-center gap-2"><Link to="/page/progress" className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/5" title="Exit showcase"><ArrowLeft size={17} /></Link><button type="button" onClick={() => setSafeGuides((value) => !value)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${safeGuides ? 'border-fuchsia-400/40 text-fuchsia-200' : 'border-white/10 text-slate-300'}`}>9:16 guides</button><button type="button" onClick={() => document.documentElement.requestFullscreen?.()} className="rounded-lg border border-white/10 p-2 text-slate-300" title="Fullscreen (F)"><Expand size={17} /></button><button type="button" onClick={reset} className="rounded-lg border border-white/10 p-2 text-slate-300" title="Reset (R)"><RotateCcw size={17} /></button></div>
            <div className="mx-auto hidden items-center gap-1 lg:flex">{CHAPTERS.map((item, index) => <button type="button" key={item.id} onClick={() => goTo(index)} className={`h-2 rounded-full transition-all ${index === chapterIndex ? 'w-8 bg-sky-400' : index < chapterIndex ? 'w-3 bg-emerald-400' : 'w-3 bg-slate-700'}`} aria-label={`Go to chapter ${index + 1}`} />)}</div>
            <div className="ml-auto flex items-center gap-2"><button type="button" onClick={() => goTo(chapterIndex - 1)} disabled={chapterIndex === 0} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 disabled:opacity-30"><ArrowLeft size={16} /> Back</button><button type="button" onClick={() => goTo(chapterIndex + 1)} disabled={chapterIndex === CHAPTERS.length - 1} className="inline-flex items-center gap-2 rounded-xl bg-sky-400 px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-30">Next <ArrowRight size={16} /></button></div>
          </footer>
          <div className="pointer-events-none absolute left-1/2 top-24 z-30 -translate-x-1/2 rounded-full border border-sky-400/35 bg-sky-950/90 px-4 py-1.5 text-xs font-black tracking-[0.18em] text-sky-100 shadow-lg"><FlaskConical size={13} className="mr-2 inline" /> DEMO / SYNTHETIC DATA</div>
        </div>
      )}
      </div>
    </div>
  );
}
