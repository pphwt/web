import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Beaker, CheckCircle2, Download, FileCheck2, FlaskConical, Hash, RefreshCw, ShieldAlert } from 'lucide-react';
import { modelApi } from '../services/modelApi';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const STATUS = {
  measured: { label: 'MEASURED', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' },
  pending: { label: 'PENDING', className: 'border-amber-500/30 bg-amber-500/10 text-amber-500' },
  not_available: { label: 'NOT AVAILABLE', className: 'border-slate-400/30 bg-slate-400/10 text-slate-500' },
  failed: { label: 'FAILED', className: 'border-rose-500/30 bg-rose-500/10 text-rose-500' },
};

const fmt = (value, digits = 4) => value === null || value === undefined || value === '' ? '—' : Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : String(value);
const percent = (value) => value === null || value === undefined ? '—' : `${(Number(value) * 100).toFixed(1)}%`;

function StatusPill({ status }) {
  const token = STATUS[status] || STATUS.not_available;
  return <span className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-black tracking-wider ${token.className}`}>{token.label}</span>;
}

function Metric({ label, value, detail, dk }) {
  return (
    <div className={`rounded-xl border p-3 ${dk ? 'border-white/[0.07] bg-white/[0.025]' : 'border-slate-200 bg-white'}`}>
      <p className={`text-[9px] font-black uppercase tracking-wider ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
      <p className={`mt-1 text-xl font-black ${dk ? 'text-white' : 'text-slate-900'}`}>{value}</p>
      {detail && <p className={`mt-1 text-[9px] ${dk ? 'text-slate-500' : 'text-slate-500'}`}>{detail}</p>}
    </div>
  );
}

function BarList({ title, data, valueKey, dk }) {
  const entries = Object.entries(data || {});
  return (
    <div className={`rounded-2xl border p-4 ${dk ? 'border-white/[0.06] bg-[#0d1525]' : 'border-slate-200 bg-white'}`}>
      <h3 className={`text-xs font-black ${dk ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
      <div className="mt-4 space-y-3">
        {entries.length === 0 && <p className={`text-[10px] ${dk ? 'text-slate-500' : 'text-slate-500'}`}>No frozen evidence available.</p>}
        {entries.map(([name, item]) => {
          const value = Number(item?.[valueKey]);
          const width = Number.isFinite(value) ? Math.max(3, Math.min(100, value * 100)) : 3;
          return (
            <div key={name}>
              <div className="mb-1 flex items-center justify-between gap-2 text-[10px]">
                <span className={dk ? 'text-slate-300' : 'text-slate-600'}>{name}</span>
                <span className={`font-mono ${dk ? 'text-slate-400' : 'text-slate-500'}`}>{Number.isFinite(value) ? percent(value) : '—'}</span>
              </div>
              <div className={`h-2 overflow-hidden rounded-full ${dk ? 'bg-white/[0.08]' : 'bg-slate-100'}`}>
                <div className="h-full rounded-full bg-sky-500" style={{ width: `${width}%` }} />
              </div>
              <p className={`mt-1 text-[9px] ${dk ? 'text-slate-500' : 'text-slate-400'}`}>n={item?.sample_count ?? '—'} · abstain={item?.abstention_count ?? '—'}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ArtifactHeatmap({ data, dk }) {
  const entries = Object.entries(data || {});
  const cell = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return dk ? 'bg-white/[0.06] text-slate-500' : 'bg-slate-100 text-slate-400';
    if (numeric >= 0.8) return 'bg-emerald-500/80 text-white';
    if (numeric >= 0.5) return 'bg-amber-500/80 text-white';
    return 'bg-rose-500/80 text-white';
  };
  return (
    <div className={`rounded-2xl border p-4 ${dk ? 'border-white/[0.06] bg-[#0d1525]' : 'border-slate-200 bg-white'}`}>
      <h3 className={`text-xs font-black ${dk ? 'text-white' : 'text-slate-900'}`}>Artifact robustness heatmap</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-[10px]">
          <thead className={dk ? 'text-slate-500' : 'text-slate-400'}><tr><th className="pb-2 font-bold">Artifact</th><th className="pb-2 font-bold">Coverage</th><th className="pb-2 font-bold">Lead F1</th><th className="pb-2 text-right font-bold">n / abstain</th></tr></thead>
          <tbody>
            {entries.map(([name, item]) => <tr key={name} className={dk ? 'border-t border-white/[0.05]' : 'border-t border-slate-100'}>
              <td className={`py-2 font-medium ${dk ? 'text-slate-300' : 'text-slate-600'}`}>{name}</td>
              <td className="py-2"><span className={`inline-flex min-w-[58px] justify-center rounded px-2 py-1 font-bold ${cell(item?.coverage)}`}>{percent(item?.coverage)}</span></td>
              <td className="py-2"><span className={`inline-flex min-w-[58px] justify-center rounded px-2 py-1 font-bold ${cell(item?.lead_detection_f1)}`}>{percent(item?.lead_detection_f1)}</span></td>
              <td className={`py-2 text-right ${dk ? 'text-slate-400' : 'text-slate-500'}`}>{item?.sample_count ?? '—'} / {item?.abstention_count ?? '—'}</td>
            </tr>)}
          </tbody>
        </table>
        {entries.length === 0 && <p className={`text-[10px] ${dk ? 'text-slate-500' : 'text-slate-500'}`}>No frozen artifact evidence available.</p>}
      </div>
    </div>
  );
}

function ResearchLab() {
  const { isDarkMode: dk } = useTheme();
  const { language } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [detail, setDetail] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const next = await modelApi.researchRuns();
      setSummary(next);
      const firstMeasured = (next.runs || []).find((run) => run.status === 'measured' && run.run_id);
      if (firstMeasured && !selectedId) setSelectedId(firstMeasured.run_id);
    } catch (err) {
      setError(err.message || 'Research evidence unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return undefined;
    }
    const controller = new AbortController();
    modelApi.researchRun(selectedId, { signal: controller.signal }).then(setDetail).catch((err) => {
      if (err.name !== 'AbortError') setError(err.message || 'Research run unavailable');
    });
    return () => controller.abort();
  }, [selectedId]);

  const testRuns = useMemo(() => (summary?.runs || []).filter((run) => run.split === 'held_out_test'), [summary]);
  const selected = detail || testRuns.find((run) => run.run_id === selectedId) || testRuns[0] || summary?.runs?.[0];
  const metrics = selected?.aggregate || selected?.metrics || {};
  const digitization = metrics.digitization || {};
  const measurements = metrics.measurements || {};
  const abstention = metrics.safe_abstention || {};
  const localization = metrics.localization || {};
  const layoutData = detail?.by_layout || selected?.by_layout || {};
  const artifactData = detail?.by_artifact || selected?.by_artifact || {};
  const failureRows = (detail?.rows || []).filter((row) => !row.accepted_for_localization || (row.failure_reasons || []).length).slice(0, 20);
  const mainText = dk ? 'text-white' : 'text-slate-900';
  const subText = dk ? 'text-slate-400' : 'text-slate-500';
  const surface = dk ? 'border-white/[0.06] bg-[#0d1525]' : 'border-slate-200 bg-white';

  const downloadEvidence = async () => {
    setDownloading(true);
    try {
      const { blob, filename } = await modelApi.evidencePack();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Evidence pack unavailable');
    } finally {
      setDownloading(false);
    }
  };

  const downloadRun = (format) => {
    if (!detail) {
      setError('Select a measured research run before downloading evidence.');
      return;
    }
    const filenameBase = detail.run_id || 'ysc-research-run';
    let content;
    let type;
    let filename;
    if (format === 'json') {
      content = `${JSON.stringify(detail, null, 2)}\n`;
      type = 'application/json';
      filename = `${filenameBase}.json`;
    } else {
      const fields = ['case_id', 'layout', 'artifact', 'lead_detection_f1', 'waveform_rmse', 'waveform_pearson_r', 'heart_rate_error_bpm', 'pr_error_ms', 'qrs_error_ms', 'qt_error_ms', 'quality_gate', 'accepted_for_localization', 'failure_reasons', 'runtime_ms', 'failure_reason'];
      const escapeCsv = (value) => {
        const normalized = Array.isArray(value) ? value.join('|') : value ?? '';
        return `"${String(normalized).replaceAll('"', '""')}"`;
      };
      const rows = (detail.rows || []).map((row) => {
        const errors = row.measurement_errors || {};
        return [
          row.case_id,
          row.layout,
          (row.artifact_profile || []).join('|'),
          row.lead_detection?.f1,
          row.waveform?.rmse,
          row.waveform?.pearson_r,
          errors.heart_rate_bpm,
          errors.pr_ms,
          errors.qrs_ms,
          errors.qt_ms,
          row.quality_gate,
          row.accepted_for_localization,
          row.failure_reasons,
          row.runtime_ms,
          row.failure_reason,
        ].map(escapeCsv).join(',');
      });
      content = `${fields.join(',')}\n${rows.join('\n')}\n`;
      type = 'text/csv;charset=utf-8';
      filename = `${filenameBase}.csv`;
    }
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-full px-3 py-4 text-[var(--text-main)] transition-colors duration-300 sm:px-5 lg:px-7 ${dk ? 'bg-[#07101d]' : 'bg-slate-50'}`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <header className={`rounded-2xl border p-5 ${surface}`}>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <FlaskConical size={17} className="text-violet-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500">YSC RESEARCH</span>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[9px] font-black text-amber-500">SYNTHETIC / PUBLIC DATA</span>
                <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[9px] font-black text-rose-500">NOT CLINICAL VALIDATION</span>
              </div>
              <h1 className={`mt-3 text-xl font-black ${mainText}`}>{language === 'th' ? 'ห้องทดลองความทนทานของระบบ ECG' : 'ECG Robustness Research Lab'}</h1>
              <p className={`mt-2 max-w-4xl text-xs leading-relaxed ${subText}`}>{summary?.research_question || 'Does quality-aware abstention reduce unsafe ECG image localization results under visual artifacts?'}</p>
              <p className={`mt-2 max-w-4xl text-[10px] leading-relaxed ${subText}`}><b>Hypothesis:</b> {summary?.hypothesis || 'Artifact-aware quality gates reduce unsafe accepted results while increasing abstention on low-quality cases.'}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={load} disabled={loading} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold ${dk ? 'border-white/[0.08] text-slate-300 hover:bg-white/[0.04]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}><RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh</button>
              <button type="button" onClick={() => downloadRun('json')} disabled={!detail} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold ${dk ? 'border-white/[0.08] text-slate-300 hover:bg-white/[0.04]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'} disabled:cursor-not-allowed disabled:opacity-50`}><Download size={13} /> JSON</button>
              <button type="button" onClick={() => downloadRun('csv')} disabled={!detail} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold ${dk ? 'border-white/[0.08] text-slate-300 hover:bg-white/[0.04]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'} disabled:cursor-not-allowed disabled:opacity-50`}><Download size={13} /> CSV</button>
              <button type="button" onClick={downloadEvidence} disabled={downloading} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-sky-500"><Download size={13} /> {downloading ? 'Preparing…' : 'Evidence Pack'}</button>
            </div>
          </div>
        </header>

        {error && <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[11px] text-rose-500"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{error}</div>}

        <section className={`rounded-2xl border p-4 ${surface}`}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div><h2 className={`text-sm font-black ${mainText}`}>Frozen research runs</h2><p className={`mt-1 text-[10px] ${subText}`}>Offline CLI output only. No clinical record is created by this page.</p></div>
            <StatusPill status={summary?.status || 'not_available'} />
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {(summary?.runs || []).map((run, index) => (
              <button type="button" key={`${run.run_id || run.variant}-${run.split}-${index}`} onClick={() => run.run_id && setSelectedId(run.run_id)} disabled={!run.run_id} className={`text-left rounded-xl border p-3 transition ${selectedId === run.run_id ? 'border-sky-500 bg-sky-500/10' : dk ? 'border-white/[0.07] hover:bg-white/[0.03]' : 'border-slate-200 hover:bg-slate-50'} ${!run.run_id ? 'cursor-default opacity-70' : ''}`}>
                <div className="flex items-center justify-between gap-2"><span className={`text-[10px] font-black ${mainText}`}>{run.variant}</span><StatusPill status={run.status} /></div>
                <p className={`mt-2 text-[10px] ${subText}`}>{run.split} · n={run.sample_count ?? '—'} · {run.evaluated_at || 'not frozen'}</p>
                <p className={`mt-1 truncate font-mono text-[9px] ${subText}`}>{run.evidence_sha256 || 'Evidence hash not available'}</p>
              </button>
            ))}
          </div>
          {loading && <p className={`mt-3 text-[10px] ${subText}`}>Loading research evidence…</p>}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric dk={dk} label="Coverage" value={percent(abstention.coverage)} detail="Accepted for research localization" />
          <Metric dk={dk} label="Abstention" value={percent(abstention.abstention_rate)} detail="Quality-aware stop decision" />
          <Metric dk={dk} label="Lead F1" value={fmt(digitization.lead_detection_f1)} detail={`Waveform r=${fmt(digitization.waveform_pearson_r)}`} />
          <Metric dk={dk} label="Runtime" value={metrics.runtime?.mean_ms ? `${fmt(metrics.runtime.mean_ms, 0)} ms` : '—'} detail={metrics.runtime?.p95_ms ? `p95 ${fmt(metrics.runtime.p95_ms, 0)} ms` : 'not available'} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <ArtifactHeatmap data={artifactData} dk={dk} />
          <BarList title="Coverage by layout" data={layoutData} valueKey="coverage" dk={dk} />
        </section>

        <section className={`rounded-2xl border p-4 ${surface}`}>
          <div className="flex items-center gap-2"><BarChart3 size={16} className="text-sky-500" /><h2 className={`text-sm font-black ${mainText}`}>Measurements and safe-abstention evidence</h2></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(measurements).map(([key, value]) => <Metric key={key} dk={dk} label={`${key} MAE`} value={fmt(value, 2)} detail="Measured error; not diagnosis" />)}
            {Object.keys(measurements).length === 0 && <p className={`text-[10px] ${subText}`}>Measurement metrics are not available until a frozen run is loaded.</p>}
          </div>
          <div className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-[10px] leading-relaxed ${dk ? 'border-amber-500/20 bg-amber-500/[0.06] text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'}`}><ShieldAlert size={15} className="mt-0.5 shrink-0" /><span>Localization accuracy, false-marker rate and quality-gate precision/recall remain <b>not available</b> until paired ground truth and an adjudicated unsafe-result label are frozen. The system must not convert missing evidence into zero.</span></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric dk={dk} label="AHA top-1" value={percent(localization.aha_top1)} detail="Regional research metric" />
            <Metric dk={dk} label="AHA top-3" value={percent(localization.aha_top3)} detail="Regional research metric" />
            <Metric dk={dk} label="Territory" value={percent(localization.territory_accuracy)} detail="Not diagnostic accuracy" />
            <Metric dk={dk} label="Marker in mesh" value={percent(localization.marker_in_mesh_rate)} detail="Coordinate contract" />
          </div>
        </section>

        <section className={`rounded-2xl border p-4 ${surface}`}>
          <div className="flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /><h2 className={`text-sm font-black ${mainText}`}>Failure gallery / abstention reason codes</h2></div>
          {failureRows.length === 0 ? <p className={`mt-3 text-[10px] ${subText}`}>No frozen per-case failure evidence is available. This section remains empty rather than inventing examples.</p> : <div className="mt-3 grid gap-2 md:grid-cols-2">
            {failureRows.map((row) => <div key={row.case_id} className={`rounded-xl border p-3 ${dk ? 'border-white/[0.07] bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center justify-between gap-2"><span className={`font-mono text-[10px] font-bold ${mainText}`}>{row.case_id}</span><span className="text-[9px] text-amber-500">{row.layout} / {(row.artifact_profile || []).join(', ')}</span></div>
              <p className={`mt-2 text-[10px] ${subText}`}>{(row.failure_reasons || []).join(', ') || row.failure_reason || 'not available'}</p>
            </div>)}
          </div>}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className={`rounded-2xl border p-4 ${surface}`}>
            <div className="flex items-center gap-2"><FileCheck2 size={16} className="text-emerald-500" /><h2 className={`text-sm font-black ${mainText}`}>Reproducibility</h2></div>
            <div className={`mt-3 space-y-2 text-[10px] ${subText}`}>
              <p><b className={mainText}>Run:</b> {selected?.run_id || 'not frozen'}</p>
              <p><b className={mainText}>Dataset:</b> {selected?.dataset || 'not available'} / {selected?.split || '—'} / n={selected?.sample_count ?? '—'}</p>
              <p><b className={mainText}>Model hash:</b> <span className="font-mono">{selected?.model_hash || 'not available'}</span></p>
              <p><b className={mainText}>Manifest hash:</b> <span className="font-mono">{selected?.manifest_sha256 || 'not available'}</span></p>
              <p><b className={mainText}>Evidence hash:</b> <span className="font-mono">{selected?.evidence_sha256 || 'not available'}</span></p>
            </div>
          </div>
          <div className={`rounded-2xl border p-4 ${surface}`}>
            <div className="flex items-center gap-2"><Hash size={16} className="text-violet-500" /><h2 className={`text-sm font-black ${mainText}`}>Failure reasons and limitations</h2></div>
            <div className={`mt-3 space-y-2 text-[10px] ${subText}`}>
              {(detail?.limitations || selected?.limitations || summary?.limitations || []).map((item) => <p key={item}>• {item}</p>)}
              {!(detail?.limitations || selected?.limitations || summary?.limitations || []).length && <p>No frozen limitation report is available.</p>}
            </div>
          </div>
        </section>

        <footer className={`flex items-start gap-2 rounded-2xl border p-4 text-[10px] leading-relaxed ${dk ? 'border-rose-500/20 bg-rose-500/[0.04] text-rose-200' : 'border-rose-200 bg-rose-50 text-rose-800'}`}><AlertTriangle size={15} className="mt-0.5 shrink-0" /><span><b>Research boundary:</b> this page presents synthetic/public research evidence only. A 3D marker remains a regional research estimate and is not an exact anatomical diagnosis, probability, or clinical validation result.</span></footer>
      </div>
    </div>
  );
}

export default ResearchLab;
