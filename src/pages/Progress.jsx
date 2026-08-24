import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, AlertTriangle, CheckCircle2, Database, FileCheck2,
  FlaskConical, HeartPulse, LockKeyhole, Play, RefreshCw, RotateCcw,
  ShieldCheck, TriangleAlert, Download, Presentation,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { modelApi } from '../services/modelApi';

const DEMO_CASES = [
  {
    id: 'normal',
    label: '1 · Normal ECG',
    title: 'Clear signal — ready for review',
    tone: 'emerald',
    quality: 'PASS',
    qualityScore: 96,
    confidence: '0.91',
    finding: 'No high-risk screening flag',
    decision: 'READY_FOR_REVIEW',
    reason: '12 leads recovered, calibration stable, low noise.',
    source: 'demo_normal_12lead.svg',
  },
  {
    id: 'repeat',
    label: '2 · Low-quality ECG',
    title: 'Quality gate — repeat ECG required',
    tone: 'amber',
    quality: 'FAIL',
    qualityScore: 38,
    confidence: '—',
    finding: 'AI screening withheld',
    decision: 'NEEDS_RETAKE',
    reason: 'Lead II missing and trace coverage is insufficient.',
    source: 'demo_low_quality_12lead.svg',
  },
  {
    id: 'risk',
    label: '3 · Risk signal',
    title: 'Referral support — clinician decision needed',
    tone: 'rose',
    quality: 'PASS',
    qualityScore: 89,
    confidence: '0.78',
    finding: 'Review for urgent referral',
    decision: 'REFERRED',
    reason: 'Screening finding is surfaced with provenance; it is not an autonomous diagnosis.',
    source: 'demo_risk_12lead.svg',
  },
];

const STATUS_STYLES = {
  emerald: { badge: 'border-emerald-300 bg-emerald-50 text-emerald-700', dark: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300', line: '#10b981' },
  amber: { badge: 'border-amber-300 bg-amber-50 text-amber-700', dark: 'border-amber-500/25 bg-amber-500/10 text-amber-300', line: '#f59e0b' },
  rose: { badge: 'border-rose-300 bg-rose-50 text-rose-700', dark: 'border-rose-500/25 bg-rose-500/10 text-rose-300', line: '#f43f5e' },
};

const formatPercent = (value) => value == null ? '—' : `${(Number(value) * 100).toFixed(1)}%`;

function MiniWaveform({ color, muted = false, trace = null }) {
  const values = Array.isArray(trace) && trace.length ? trace : Array.from({ length: 72 }, (_, index) => {
    const x = index / 8;
    return Math.sin(x * 1.7) * 3 + Math.exp(-((x % 8 - 3.9) ** 2) / 0.08) * 34;
  });
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1e-6);
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 288},${86 - ((value - min) / span) * 70}`).join(' ');
  return (
    <svg viewBox="0 0 288 96" role="img" aria-label="Synthetic ECG source preview" className="h-28 w-full rounded-xl border border-slate-200 bg-white">
      <path d="M0 48H288 M0 24H288 M0 72H288" stroke="#dbeafe" strokeWidth="1" />
      <path d="M0 0V96 M48 0V96 M96 0V96 M144 0V96 M192 0V96 M240 0V96" stroke="#e0f2fe" strokeWidth="1" />
      <polyline points={points} fill="none" stroke={muted ? '#94a3b8' : color} strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
}

function MetricCard({ label, value, detail, icon: Icon, dk, tone = 'sky' }) {
  const colors = {
    sky: dk ? 'text-sky-300 bg-sky-500/10 border-sky-500/20' : 'text-sky-700 bg-sky-50 border-sky-200',
    emerald: dk ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
    amber: dk ? 'text-amber-300 bg-amber-500/10 border-amber-500/20' : 'text-amber-700 bg-amber-50 border-amber-200',
  };
  return (
    <div className={`rounded-2xl border p-4 ${dk ? 'border-white/[0.07] bg-[#0d1525]' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${colors[tone]}`}><Icon size={15} /></span>
        <span className={`text-[9px] font-bold uppercase tracking-widest ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
      </div>
      <p className={`mt-3 text-2xl font-black ${dk ? 'text-white' : 'text-slate-900'}`}>{value}</p>
      <p className={`mt-1 text-[10px] ${dk ? 'text-slate-400' : 'text-slate-500'}`}>{detail}</p>
    </div>
  );
}

function EvidenceMetric({ label, value, unit, detail, dk }) {
  return (
    <div className={`rounded-xl border p-3 ${dk ? 'border-white/[0.07] bg-white/[0.025]' : 'border-slate-100 bg-slate-50'}`}>
      <p className={`text-[9px] font-bold uppercase tracking-wider ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
      <p className={`mt-1 text-lg font-black ${dk ? 'text-white' : 'text-slate-900'}`}>{value}{unit && <span className={`ml-1 text-[10px] font-semibold ${dk ? 'text-slate-400' : 'text-slate-500'}`}>{unit}</span>}</p>
      <p className={`mt-1 text-[9px] ${dk ? 'text-slate-500' : 'text-slate-500'}`}>{detail}</p>
    </div>
  );
}

export default function Progress() {
  const { isDarkMode: dk } = useTheme();
  const { language } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [demoId, setDemoId] = useState(null);
  const [demoStartedAt, setDemoStartedAt] = useState(null);
  const [demoElapsedSeconds, setDemoElapsedSeconds] = useState(0);
  const [demoCatalog, setDemoCatalog] = useState(DEMO_CASES);
  const [demoResult, setDemoResult] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState('');
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  const loadSummary = () => {
    setLoading(true);
    setError('');
    modelApi.progressSummary()
      .then(setSummary)
      .catch((err) => setError(err.message || 'Progress summary unavailable'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSummary(); }, []);

  useEffect(() => {
    modelApi.demoCases()
      .then((payload) => {
        const cases = (payload.cases || []).map((item) => ({
          ...item,
          finding: item.screening_support?.finding || 'Screening output requires review',
          decision: item.screening_support?.decision || 'CLINICIAN_REVIEW',
          reason: item.screening_support?.reason || 'Synthetic fixture',
          source: item.source_image,
          quality: '—',
          qualityScore: '—',
          confidence: '—',
        }));
        if (cases.length) setDemoCatalog(cases);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!demoStartedAt) {
      setDemoElapsedSeconds(0);
      return undefined;
    }
    const timer = window.setInterval(() => {
      setDemoElapsedSeconds(Math.floor((Date.now() - demoStartedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [demoStartedAt]);

  const selectedDemo = useMemo(() => demoCatalog.find((item) => item.id === demoId) || null, [demoCatalog, demoId]);
  const surface = dk ? 'border-white/[0.06] bg-[#0d1525]' : 'border-slate-200 bg-white';
  const mainText = dk ? 'text-white' : 'text-slate-900';
  const subText = dk ? 'text-slate-400' : 'text-slate-500';
  const quality = summary?.clinical_quality || {};
  const validation = summary?.validation?.models || {};
  const localizer = validation.cardiac_localizer || {};
  const localizerMetrics = localizer.metrics || {};
  const pinn = validation.ep_pinn || {};
  const pinnMetrics = pinn.metrics || {};
  const readinessChecks = summary?.readiness?.security?.checks || [];
  const readinessFailCount = readinessChecks.filter((check) => !check.ok && check.severity === 'fail').length;
  const demoDisplaySeconds = Math.min(5 * 60 - 1, demoElapsedSeconds);

  const startDemo = (id) => {
    setDemoId(id);
    setDemoStartedAt(Date.now());
    setDemoElapsedSeconds(0);
    setDemoResult(null);
    setDemoError('');
    setDemoLoading(true);
    modelApi.runDemoCase(id)
      .then(setDemoResult)
      .catch((err) => setDemoError(err.message || 'Demo processing unavailable'))
      .finally(() => setDemoLoading(false));
  };

  const downloadEvidence = async () => {
    setEvidenceLoading(true);
    try {
      const { blob, filename } = await modelApi.evidencePack();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(href);
    } catch (err) {
      setError(err.message || 'Evidence pack unavailable');
    } finally {
      setEvidenceLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-[var(--bg-main)] px-2 py-3 text-[var(--text-main)] sm:px-4 lg:px-6">
      <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-5">
        <header className={`rounded-2xl border p-5 ${surface}`}>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex items-start gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${dk ? 'border-sky-500/25 bg-sky-500/10 text-sky-300' : 'border-sky-200 bg-sky-50 text-sky-700'}`}><ShieldCheck size={21} /></div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${dk ? 'text-sky-300' : 'text-sky-700'}`}>National-level evidence view</p>
                <h1 className={`mt-1 text-xl font-black ${mainText}`}>{language === 'th' ? 'ความก้าวหน้าโครงการ' : 'Project Progress & Evidence'}</h1>
                <p className={`mt-1 max-w-3xl text-xs leading-relaxed ${subText}`}>A single reviewer view for workflow readiness, held-out model evidence, clinical quality and transparent limitations.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black ${summary?.readiness?.ready ? (dk ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700') : (dk ? 'border-amber-500/25 bg-amber-500/10 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700')}`}>
                {summary?.readiness?.ready ? 'READY CHECKS PASS' : 'REVIEW READINESS'}
              </span>
              <button type="button" onClick={loadSummary} disabled={loading} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold ${dk ? 'border-white/[0.08] text-slate-300 hover:bg-white/[0.04]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
              <button type="button" onClick={downloadEvidence} disabled={evidenceLoading} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold ${dk ? 'border-white/[0.08] text-slate-300 hover:bg-white/[0.04]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                <Download size={13} /> Evidence Pack
              </button>
              <Link to="/page/showcase" className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-[10px] font-black text-white hover:bg-sky-600">
                <Presentation size={13} /> Showcase
              </Link>
            </div>
          </div>
          <div className={`mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t pt-3 text-[10px] ${dk ? 'border-white/[0.06] text-slate-500' : 'border-slate-100 text-slate-500'}`}>
            <span>Release: <b className={mainText}>{summary?.release?.version || '—'}</b></span>
            <span>Build: <b className={mainText}>{summary?.release?.build_id || '—'}</b></span>
            <span>Evidence frozen: <b className={mainText}>{summary?.release?.evidence_frozen_at || '—'}</b></span>
            <span>Manifest: <b className={mainText}>{summary?.manifest_version || '—'}</b></span>
            <span title={summary?.manifest_sha256 || ''}>Manifest SHA: <b className={mainText}>{summary?.manifest_sha256?.slice(0, 12) || '—'}</b></span>
          </div>
        </header>

        {error && <div className={`flex items-center gap-2 rounded-xl border p-3 text-xs ${dk ? 'border-rose-500/25 bg-rose-500/10 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}><TriangleAlert size={15} /> {error}. The dashboard will not substitute unverified metrics.</div>}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard dk={dk} icon={Activity} label="Workflow" value={`${summary?.workflow?.completion_percent ?? '—'}%`} detail={`${summary?.workflow?.stages?.length || 0} connected stages`} />
          <MetricCard dk={dk} icon={Database} label="ECG reports" value={quality.total_ecg_reports ?? '—'} detail={`${quality.pending_review ?? 0} pending clinician review`} tone="emerald" />
          <MetricCard dk={dk} icon={FileCheck2} label="Repeat rate" value={formatPercent(quality.repeat_ecg_rate)} detail={`${quality.needs_retake ?? 0} cases routed to repeat ECG`} tone="amber" />
          <MetricCard dk={dk} icon={LockKeyhole} label="Provenance" value={quality.reports_with_provenance ?? '—'} detail={`${quality.artifact_records ?? 0} artifact records`} />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className={`xl:col-span-7 rounded-2xl border p-4 ${surface}`}>
            <div className="flex items-center justify-between gap-3">
              <div><h2 className={`text-sm font-black ${mainText}`}>End-to-end workflow</h2><p className={`mt-1 text-[10px] ${subText}`}>What is available today and what evidence backs each stage.</p></div>
              <HeartPulse size={18} className={dk ? 'text-sky-300' : 'text-sky-700'} />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(summary?.workflow?.stages || []).map((stage) => (
                <div key={stage.id} className={`rounded-xl border p-3 ${dk ? 'border-white/[0.07] bg-white/[0.025]' : 'border-slate-100 bg-slate-50'}`}>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /><span className={`text-[11px] font-bold ${mainText}`}>{stage.label}</span></div>
                  <p className={`mt-2 text-[9px] leading-relaxed ${subText}`}>{stage.evidence}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`xl:col-span-5 rounded-2xl border p-4 ${surface}`}>
            <div className="flex items-center justify-between gap-3"><div><h2 className={`text-sm font-black ${mainText}`}>System readiness</h2><p className={`mt-1 text-[10px] ${subText}`}>{readinessFailCount ? `${readinessFailCount} production check(s) need attention.` : 'Security, migration, storage and OCR checks.'}</p></div><ShieldCheck size={18} className={readinessFailCount ? 'text-amber-500' : 'text-emerald-500'} /></div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[...(summary?.readiness?.security?.checks || []), ...(summary?.readiness?.ocr?.checks || [])].slice(0, 8).map((check) => (
                <div key={check.name} className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[10px] ${check.ok ? (dk ? 'border-emerald-500/15 text-emerald-300' : 'border-emerald-200 text-emerald-700') : (dk ? 'border-amber-500/20 text-amber-300' : 'border-amber-200 text-amber-700')}`}>
                  {check.ok ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}<span className="truncate">{check.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`rounded-2xl border p-4 ${surface}`}>
          <div className="flex items-center justify-between gap-3"><div><h2 className={`text-sm font-black ${mainText}`}>Research scout & benchmark</h2><p className={`mt-1 text-[10px] ${subText}`}>Eight shortlisted approaches are tracked offline; production does not install every candidate.</p></div><FlaskConical size={18} className={dk ? 'text-violet-300' : 'text-violet-700'} /></div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <EvidenceMetric dk={dk} label="Shortlist" value={summary?.research?.shortlist_count ?? 8} detail="of 20 reviewed" />
            <EvidenceMetric dk={dk} label="Benchmark" value={summary?.benchmark?.baseline?.status || 'not_available'} detail={`Synthetic n=${summary?.benchmark?.baseline?.sample_count ?? '—'}`} />
            <EvidenceMetric dk={dk} label="Mesh" value={summary?.research?.mesh_calibration?.status || 'pending'} detail={summary?.research?.mesh_calibration?.version || 'versioned contract'} />
            <EvidenceMetric dk={dk} label="12-lead" value={summary?.research?.clinical_12_lead_localizer?.status || 'pending'} detail="Held-out validation" />
          </div>
          <p className={`mt-3 text-[10px] leading-relaxed ${dk ? 'text-amber-300' : 'text-amber-700'}`}>3D marker uncertainty is not available until a held-out calibration set is measured. Current localization remains research-only.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <EvidenceMetric dk={dk} label="Lead detection F1" value={summary?.benchmark?.baseline?.metrics?.lead_detection_f1?.toFixed?.(3) || '—'} detail="18-case synthetic golden set" />
            <EvidenceMetric dk={dk} label="Waveform Pearson" value={summary?.benchmark?.baseline?.metrics?.waveform_pearson_r?.toFixed?.(3) || '—'} detail="Aligned Lead II morphology" />
            <EvidenceMetric dk={dk} label="Quality pass" value={formatPercent(summary?.benchmark?.baseline?.metrics?.quality_gate_pass_rate)} detail="Failures retained in report" />
            <EvidenceMetric dk={dk} label="ECG-Digitiser" value={summary?.benchmark?.candidate?.status || 'not_available'} detail="Pinned shadow candidate" />
          </div>
        </section>

        <section className={`rounded-2xl border p-4 ${surface}`}>
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div><h2 className={`text-sm font-black ${mainText}`}>Automated Release Gate</h2><p className={`mt-1 text-[10px] ${subText}`}>Model/manifest hashes, migrations, storage, OCR, demo isolation and authentication coverage.</p></div>
            <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black ${summary?.release_gate?.status === 'pass' ? (dk ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700') : summary?.release_gate?.status === 'fail' ? (dk ? 'border-rose-500/25 bg-rose-500/10 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700') : (dk ? 'border-amber-500/25 bg-amber-500/10 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700')}`}>{summary?.release_gate?.status || 'not_available'}</span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(summary?.release_gate?.checks || []).map((check) => (
              <div key={check.name} className={`flex items-start gap-2 rounded-xl border p-3 text-[10px] ${check.status === 'pass' ? (dk ? 'border-emerald-500/15 text-emerald-200' : 'border-emerald-200 text-emerald-700') : check.status === 'fail' ? (dk ? 'border-rose-500/20 text-rose-200' : 'border-rose-200 text-rose-700') : (dk ? 'border-amber-500/20 text-amber-200' : 'border-amber-200 text-amber-700')}`}>
                {check.status === 'pass' ? <CheckCircle2 size={13} className="mt-0.5 shrink-0" /> : <AlertTriangle size={13} className="mt-0.5 shrink-0" />}
                <div className="min-w-0"><p className="truncate font-black">{check.name}</p><p className={`mt-1 line-clamp-2 ${subText}`}>{check.reason || check.status}</p></div>
              </div>
            ))}
          </div>
          <p className={`mt-3 text-[10px] ${subText}`}>{summary?.release_gate?.rule || 'Unknown checks never count as pass.'}</p>
        </section>

        <section className={`rounded-2xl border p-4 ${surface}`}>
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><div><h2 className={`text-sm font-black ${mainText}`}>Model validation evidence</h2><p className={`mt-1 text-[10px] ${subText}`}>Held-out evidence is shown with dataset, split, sample count and limitations.</p></div><span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold ${dk ? 'border-amber-500/20 bg-amber-500/10 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>NOT DIAGNOSTIC ACCURACY</span></div>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={`rounded-xl border p-3 ${dk ? 'border-amber-500/15 bg-amber-500/[0.03]' : 'border-amber-100 bg-amber-50/40'}`}>
              <div className="flex items-center justify-between gap-2"><h3 className={`text-xs font-black ${mainText}`}>CardiacLocalizer · 3D source localization</h3><span className="text-[9px] font-bold text-emerald-500">{localizer.status || 'not_available'}</span></div>
              <p className={`mt-1 text-[9px] ${subText}`}>{localizer.dataset || 'Dataset unavailable'} · {localizer.split || 'Split unavailable'} · n={localizer.sample_count ?? '—'} · {localizer.evaluated_at || 'date unavailable'} · sha256 {localizer.model_sha256?.slice(0, 12) || '—'}</p>
              <div className="mt-3 grid grid-cols-3 gap-2"><EvidenceMetric dk={dk} label="Mean error" value={localizerMetrics.mean_error_mm ?? '—'} unit="mm" detail="Held-out estimate" /><EvidenceMetric dk={dk} label="Top-1 node" value={formatPercent(localizerMetrics.aha_top1)} detail="AHA node" /><EvidenceMetric dk={dk} label="Top-3 node" value={formatPercent(localizerMetrics.aha_top3)} detail="AHA node" /></div>
              <p className={`mt-3 text-[9px] leading-relaxed ${subText}`}>{(localizer.limitations || []).join(' ') || 'No limitation recorded.'}</p>
            </div>
            <div className={`rounded-xl border p-3 ${dk ? 'border-emerald-500/15 bg-emerald-500/[0.03]' : 'border-emerald-100 bg-emerald-50/40'}`}>
              <div className="flex items-center justify-between gap-2"><h3 className={`text-xs font-black ${mainText}`}>EP-PINN · physics-informed reconstruction</h3><span className="text-[9px] font-bold text-emerald-500">{pinn.status || 'not_available'}</span></div>
              <p className={`mt-1 text-[9px] ${subText}`}>{pinn.dataset || 'Dataset unavailable'} · {pinn.split || 'Split unavailable'} · n={pinn.sample_count ?? '—'} · {pinn.evaluated_at || 'date unavailable'} · sha256 {pinn.model_sha256?.slice(0, 12) || '—'}</p>
              <div className="mt-3 grid grid-cols-3 gap-2"><EvidenceMetric dk={dk} label="R²" value={pinnMetrics.reconstruction_r2 ?? '—'} detail="Reconstruction" /><EvidenceMetric dk={dk} label="RMSE" value={pinnMetrics.rmse ?? '—'} detail="Held-out estimate" /><EvidenceMetric dk={dk} label="PDE" value={formatPercent(pinnMetrics.pde_convergence)} detail="Convergence" /></div>
              <p className={`mt-3 text-[9px] leading-relaxed ${subText}`}>{(pinn.limitations || []).join(' ') || 'No limitation recorded.'}</p>
            </div>
          </div>
        </section>

        <section className={`rounded-2xl border p-4 ${surface}`}>
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><div><h2 className={`text-sm font-black ${mainText}`}>Guided demo · non-PHI synthetic data</h2><p className={`mt-1 text-[10px] ${subText}`}>Use these three cases to demonstrate the quality gate, explainability and clinician review without writing to Supabase.</p></div><span className={`inline-flex items-center gap-1.5 self-start rounded-full border px-2.5 py-1 text-[9px] font-black ${dk ? 'border-sky-500/20 bg-sky-500/10 text-sky-300' : 'border-sky-200 bg-sky-50 text-sky-700'}`}><FlaskConical size={12} /> DEMO / SYNTHETIC DATA</span></div>
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">{demoCatalog.map((item) => { const style = STATUS_STYLES[item.tone] || STATUS_STYLES.sky; const active = selectedDemo?.id === item.id; return <button key={item.id} type="button" onClick={() => startDemo(item.id)} className={`text-left rounded-xl border p-3 transition ${active ? (dk ? 'border-sky-400 ring-2 ring-sky-500/20' : 'border-sky-500 ring-2 ring-sky-100') : dk ? 'border-white/[0.07] hover:border-white/[0.18]' : 'border-slate-200 hover:border-sky-300'}`}><div className="flex items-center justify-between gap-2"><span className={`rounded-full border px-2 py-1 text-[9px] font-black ${dk ? style.dark : style.badge}`}>{item.label}</span><Play size={14} className={dk ? 'text-slate-400' : 'text-slate-500'} /></div><p className={`mt-3 text-xs font-black ${mainText}`}>{item.title}</p><p className={`mt-1 text-[10px] ${subText}`}>{item.reason}</p></button>; })}</div>
          {demoError && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-[10px] text-rose-700">{demoError}</div>}
          {selectedDemo && <div className={`mt-4 grid grid-cols-1 gap-4 rounded-xl border p-3 lg:grid-cols-12 ${dk ? 'border-sky-500/20 bg-sky-500/[0.03]' : 'border-sky-100 bg-sky-50/40'}`}><div className="lg:col-span-5"><div className="flex items-center justify-between gap-2"><span className={`text-[10px] font-black uppercase tracking-wider ${mainText}`}>Synthetic source preview</span><span className={`rounded-full border px-2 py-1 text-[9px] font-bold ${dk ? STATUS_STYLES[selectedDemo.tone].dark : STATUS_STYLES[selectedDemo.tone].badge}`}>{selectedDemo.source}</span></div><img src={`/demo/${selectedDemo.source}`} alt="Synthetic ECG demo source" className="mt-3 h-28 w-full rounded-xl border border-slate-200 bg-white object-contain" /><div className="mt-3"><MiniWaveform color={STATUS_STYLES[selectedDemo.tone].line} muted={demoResult?.analysis?.signal_quality?.status === 'FAIL'} trace={demoResult?.analysis?.waveform?.leads?.map((row) => row[0])} /></div></div><div className="lg:col-span-7"><div className="flex items-center justify-between"><h3 className={`text-sm font-black ${mainText}`}>{selectedDemo.title}</h3><button type="button" onClick={() => { setDemoId(null); setDemoStartedAt(null); setDemoResult(null); }} className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[9px] font-bold ${dk ? 'border-white/[0.08] text-slate-300' : 'border-slate-200 text-slate-600'}`}><RotateCcw size={11} /> Reset</button></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><EvidenceMetric dk={dk} label="Quality" value={demoResult?.analysis?.signal_quality?.status || (demoLoading ? 'RUNNING' : selectedDemo.quality)} detail={`${demoResult?.analysis?.signal_quality?.score ?? selectedDemo.qualityScore}/100`} /><EvidenceMetric dk={dk} label="Activation compactness" value={demoResult?.analysis?.confidence != null ? Number(demoResult.analysis.confidence).toFixed(3) : '—'} detail="Unitless · not probability" /><EvidenceMetric dk={dk} label="Decision" value={demoResult?.screening_support?.decision || selectedDemo.decision} detail="Clinician required" /><EvidenceMetric dk={dk} label="Elapsed" value={`${demoDisplaySeconds >= 60 ? `${Math.floor(demoDisplaySeconds / 60)}m ${demoDisplaySeconds % 60}s` : `${demoDisplaySeconds}s`}`} detail="No database write" /></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{(demoResult?.timeline || ['Input received', 'Quality gate complete', 'Clinician review / referral']).map((step) => { const label = typeof step === 'string' ? step : step.stage; const status = typeof step === 'string' ? 'pending' : step.status; return <div key={label} className="flex items-center gap-2 text-[10px]"><CheckCircle2 size={13} className={status === 'skipped' ? 'text-amber-500' : status === 'pending' || status === 'not_started' ? 'text-slate-400' : 'text-emerald-500'} /><span className={subText}>{label} · {status}</span></div>; })}</div><div className={`mt-3 flex gap-2 rounded-lg border p-2.5 text-[10px] leading-relaxed ${dk ? 'border-amber-500/20 bg-amber-500/[0.06] text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'}`}><AlertTriangle size={13} className="mt-0.5 shrink-0" /><span>{demoResult?.screening_support?.finding || selectedDemo.finding}. {demoResult?.screening_support?.reason || selectedDemo.reason} This demonstration is not a patient record and cannot be approved as clinical evidence.</span></div></div></div>}
        </section>

        <section className={`flex gap-2 rounded-2xl border p-4 ${dk ? 'border-amber-500/20 bg-amber-500/[0.04]' : 'border-amber-200 bg-amber-50'}`}><TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-500" /><div><p className={`text-xs font-black ${dk ? 'text-amber-200' : 'text-amber-800'}`}>Clinical safety boundary</p><p className={`mt-1 text-[10px] leading-relaxed ${dk ? 'text-amber-200/80' : 'text-amber-700'}`}>{(summary?.limitations || ['Bioelectric is clinician decision-support only.', 'A qualified clinician must review the ECG and context before action.']).join(' ')}</p></div></section>
      </div>
    </div>
  );
}
