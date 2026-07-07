import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload, Play, Loader2, AlertTriangle, Info, Database, CheckCircle2, FileDown,
  ChevronDown, Bookmark, ThumbsUp, ThumbsDown, ZoomIn, Maximize2, Activity,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { usePatient } from '../../context/PatientContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
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

const RATE_METRIC = METRICS[0];
const INTERVAL_METRICS = METRICS.filter((m) => ['pr_ms', 'qrs_ms', 'qt_ms', 'qtc_ms'].includes(m.key));

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

REASON_TEXT.image_heuristic_approx = 'approx image morphology';

const CLINICAL_STATUS_TEXT = {
  eligible_for_review: 'พร้อมให้แพทย์ทบทวน',
  repeat_required: 'ควรถ่าย/วัดซ้ำก่อนใช้ผล',
  not_supported: 'ข้อมูลไม่พอสำหรับวิเคราะห์',
  pending: 'รอผล',
};

const metricStatus = (metric, normal) => {
  if (!metric || metric.value === null || metric.value === undefined) return 'unavailable';
  if (!normal) return 'normal';
  return metric.value < normal[0] || metric.value > normal[1] ? 'abnormal' : 'normal';
};

const statusToken = (status, dk) => {
  if (status === 'urgent') {
    return {
      label: 'Urgent',
      Icon: AlertTriangle,
      card: dk ? 'border-rose-500/30 bg-rose-500/[0.10]' : 'border-rose-300 bg-rose-50',
      text: dk ? 'text-rose-200' : 'text-rose-800',
      badge: dk ? 'border-rose-500/40 bg-rose-500/15 text-rose-200' : 'border-rose-300 bg-white text-rose-800',
    };
  }
  if (status === 'abnormal' || status === 'review') {
    return {
      label: 'Review',
      Icon: AlertTriangle,
      card: dk ? 'border-rose-500/25 bg-rose-500/[0.07]' : 'border-rose-300 bg-rose-50',
      text: dk ? 'text-rose-300' : 'text-rose-700',
      badge: dk ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-rose-300 bg-white text-rose-700',
    };
  }
  if (status === 'unavailable') {
    return {
      label: 'Unavailable',
      Icon: Info,
      card: dk ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-200 bg-slate-50',
      text: dk ? 'text-slate-400' : 'text-slate-600',
      badge: dk ? 'border-white/[0.08] bg-white/[0.04] text-slate-300' : 'border-slate-200 bg-white text-slate-600',
    };
  }
  return {
    label: 'Normal',
    Icon: CheckCircle2,
    card: dk ? 'border-emerald-500/20 bg-emerald-500/[0.06]' : 'border-emerald-200 bg-emerald-50',
    text: dk ? 'text-emerald-300' : 'text-emerald-700',
    badge: dk ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' : 'border-emerald-200 bg-white text-emerald-700',
  };
};

function StatusBadge({ status, dk }) {
  const token = statusToken(status, dk);
  const Icon = token.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${token.badge}`}>
      <Icon size={10} /> {token.label}
    </span>
  );
}

const LEAD_ORDER = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];

const ECG_DISPLAY_ROWS = [
  ['I', 'aVR', 'V1', 'V4'],
  ['II', 'aVL', 'V2', 'V5'],
  ['III', 'aVF', 'V3', 'V6'],
];

const pickWaveformLead = (waveform, label) => {
  if (!waveform) return null;
  const key = Object.keys(waveform).find((name) => name.toUpperCase() === label.toUpperCase());
  return key ? waveform[key] : null;
};

const makePolyline = (values, x, y, width, height, maxPoints = 260) => {
  if (!values || values.length < 2) return '';
  const step = Math.max(1, Math.floor(values.length / maxPoints));
  const sampled = [];
  for (let i = 0; i < values.length; i += step) sampled.push(Number(values[i]) || 0);
  if (sampled.length < 2) return '';

  const sorted = [...sampled].sort((a, b) => a - b);
  const p10 = sorted[Math.floor(sorted.length * 0.10)] ?? sorted[0];
  const p90 = sorted[Math.floor(sorted.length * 0.90)] ?? sorted[sorted.length - 1];
  const mid = (p10 + p90) / 2;
  const span = Math.max(Math.abs(p90 - p10), 0.2);
  const gain = height * 0.55 / span;

  return sampled
    .map((value, index) => {
      const px = x + (index / (sampled.length - 1)) * width;
      const py = y + height / 2 - (value - mid) * gain;
      return `${px.toFixed(1)},${Math.min(y + height - 4, Math.max(y + 4, py)).toFixed(1)}`;
    })
    .join(' ');
};

const percentile = (values, ratio) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * ratio)))];
};

const pickOverlayPanel = (overlay, label, rhythm = false) => {
  const panels = Array.isArray(overlay?.panels) ? overlay.panels : [];
  const matches = panels.filter((panel) => panel?.name?.toUpperCase() === label.toUpperCase());
  if (!matches.length) return null;
  const preferredRole = rhythm ? 'rhythm_strip' : 'panel';
  return matches.find((panel) => panel.role === preferredRole && (panel.trace_points || []).length > 1)
    || matches.find((panel) => (panel.trace_points || []).length > 1)
    || null;
};

const makeOverlayPolyline = (panel, x, y, width, height, pxPerMm, maxPoints = 260) => {
  const tracePoints = Array.isArray(panel?.trace_points) ? panel.trace_points : [];
  const sourceBox = panel?.trace_bbox || panel?.bbox;
  if (tracePoints.length < 2 || !sourceBox) return '';

  const [sx0, , sx1] = sourceBox;
  const sourceWidth = Math.max(1, sx1 - sx0);
  const step = Math.max(1, Math.floor(tracePoints.length / maxPoints));
  const sampled = [];
  for (let i = 0; i < tracePoints.length; i += step) sampled.push(tracePoints[i]);
  if (sampled[sampled.length - 1] !== tracePoints[tracePoints.length - 1]) sampled.push(tracePoints[tracePoints.length - 1]);

  const ys = sampled.map((pt) => Number(pt?.[1])).filter((value) => Number.isFinite(value));
  if (ys.length < 2) return '';
  const baseline = percentile(ys, 0.5);
  const p05 = percentile(ys, 0.05);
  const p95 = percentile(ys, 0.95);
  const sourceSpan = Math.max(1, Math.abs(p95 - p05));
  const physicalScale = pxPerMm > 0 ? 10 / pxPerMm : height * 0.66 / sourceSpan;
  const maxScale = height * 0.82 / sourceSpan;
  const yScale = Math.max(0.25, Math.min(physicalScale, maxScale));

  return sampled
    .map((pt) => {
      const px = x + ((Number(pt?.[0]) - sx0) / sourceWidth) * width;
      const py = y + height / 2 + (Number(pt?.[1]) - baseline) * yScale;
      return `${px.toFixed(1)},${Math.min(y + height - 4, Math.max(y + 4, py)).toFixed(1)}`;
    })
    .join(' ');
};

function EcgPaperChart({ waveform, dk, compact = false, overlay = null, calibration = null }) {
  const rowHeight = compact ? 118 : 126;
  const chartWidth = 1120;
  const left = 34;
  const top = 28;
  const segmentWidth = chartWidth / 4;
  const totalHeight = compact ? 236 : 560;
  const traceColor = dk ? '#334155' : '#3f3f46';
  const rows = compact ? [['II']] : ECG_DISPLAY_ROWS;
  const pxPerMm = Number(calibration?.px_per_mm || 0);

  const renderCalibration = (x, y) => (
    <path
      d={`M ${x} ${y + rowHeight * 0.68} L ${x + 12} ${y + rowHeight * 0.68} L ${x + 12} ${y + rowHeight * 0.28} L ${x + 32} ${y + rowHeight * 0.28} L ${x + 32} ${y + rowHeight * 0.68} L ${x + 48} ${y + rowHeight * 0.68}`}
      fill="none"
      stroke={traceColor}
      strokeWidth="2"
      vectorEffect="non-scaling-stroke"
    />
  );

  const renderLead = (label, rowIndex, colIndex, fullWidth = false) => {
    const values = pickWaveformLead(waveform, label);
    const x = left + (fullWidth ? 58 : colIndex * segmentWidth + 58);
    const y = top + rowIndex * rowHeight;
    const width = fullWidth ? chartWidth - 74 : segmentWidth - 78;
    const overlayPanel = pickOverlayPanel(overlay, label, fullWidth || compact);
    const points = overlayPanel
      ? makeOverlayPolyline(overlayPanel, x, y + 4, width, rowHeight - 18, pxPerMm, fullWidth ? 520 : 220)
      : makePolyline(values, x, y + 4, width, rowHeight - 18, fullWidth ? 520 : 220);
    return (
      <g key={`${label}-${rowIndex}-${colIndex}`}>
        {colIndex === 0 && renderCalibration(left + 8, y)}
        <text x={x + 4} y={y + 42} fill={dk ? '#64748b' : '#71717a'} fontSize="14" fontWeight="700">{label}</text>
        {points ? (
          <polyline points={points} fill="none" stroke={traceColor} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        ) : (
          <text x={x + 42} y={y + 70} fill={dk ? '#94a3b8' : '#94a3b8'} fontSize="13">Lead unavailable</text>
        )}
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 1200 ${totalHeight}`}
      className="block h-full w-full rounded-lg border border-rose-200/70 bg-rose-50/80"
      preserveAspectRatio="xMidYMid meet"
      shapeRendering="geometricPrecision"
    >
      <defs>
        <pattern id="ecg-minor-grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#fecdd3" strokeWidth="0.7" />
        </pattern>
        <pattern id="ecg-major-grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect width="50" height="50" fill="url(#ecg-minor-grid)" />
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#fda4af" strokeWidth="1.1" />
        </pattern>
      </defs>
      <rect width="1200" height={totalHeight} fill="url(#ecg-major-grid)" />
      {rows.map((row, rowIndex) => (
        row.map((lead, colIndex) => renderLead(lead, rowIndex, colIndex, compact))
      ))}
      {!compact && renderLead('II', 3, 0, true)}
    </svg>
  );
}

function ChartModeButton({ active, Icon, label, onClick, dk }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[10px] font-black transition ${
        active
          ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
          : dk
            ? 'border-white/[0.08] bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Icon size={12} />
      <span>{label}</span>
    </button>
  );
}

function EcgChartViewer({ waveform, dk, overlay = null, digitizationReport = null }) {
  const [mode, setMode] = useState('readable');
  const compact = mode === 'leadII';
  const aspectRatio = compact ? '1200 / 236' : '1200 / 560';
  const width = mode === 'fit' ? '100%' : compact ? '980px' : '1120px';
  const minWidth = mode === 'fit' ? '640px' : width;
  const usesImageTrace = Array.isArray(overlay?.panels)
    && overlay.panels.some((panel) => (panel?.trace_points || []).length > 1);

  return (
    <div className={`rounded-xl border p-2.5 ${dk ? 'border-white/[0.07] bg-slate-950/25' : 'border-slate-200 bg-slate-50'}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold ${dk ? 'border-white/[0.08] text-slate-300' : 'border-slate-200 bg-white text-slate-600'}`}>
          <Activity size={12} />
          <span>25 mm/s</span>
          <span className={dk ? 'text-slate-600' : 'text-slate-300'}>|</span>
          <span>10 mm/mV</span>
          {usesImageTrace && (
            <>
              <span className={dk ? 'text-slate-600' : 'text-slate-300'}>|</span>
              <span>image trace</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <ChartModeButton active={mode === 'readable'} Icon={ZoomIn} label="Readable" onClick={() => setMode('readable')} dk={dk} />
          <ChartModeButton active={mode === 'fit'} Icon={Maximize2} label="Fit" onClick={() => setMode('fit')} dk={dk} />
          <ChartModeButton active={mode === 'leadII'} Icon={Activity} label="Lead II" onClick={() => setMode('leadII')} dk={dk} />
        </div>
      </div>

      <div className={`overflow-x-auto rounded-lg ${dk ? 'bg-slate-950/30' : 'bg-rose-50/40'}`}>
        <div className="max-w-none" style={{ width, minWidth, aspectRatio }}>
          <EcgPaperChart
            waveform={waveform}
            dk={dk}
            compact={compact}
            overlay={overlay}
            calibration={digitizationReport?.calibration}
          />
        </div>
      </div>
    </div>
  );
}

const panelStroke = (panel, highlighted) => {
  if (highlighted) return '#38bdf8';
  if (panel?.confidence === 'low_confidence' || panel?.reason) return '#ef4444';
  if (panel?.confidence === 'interpolated') return '#f59e0b';
  return '#10b981';
};

const humanize = (value) => (typeof value === 'string' ? value.replace(/_/g, ' ') : value);

function PanelTooltip({ panel, width, height, dk }) {
  if (!panel?.bbox) return null;
  const [x0, y0, x1, y1] = panel.bbox;
  const leftPct = Math.min(Math.max(((x0 + x1) / 2 / width) * 100, 14), 86);
  const nearTop = (y0 / height) * 100 < 15;
  const anchorPct = nearTop ? (y1 / height) * 100 : (y0 / height) * 100;
  const stroke = panelStroke(panel, false);
  const rows = [
    ['Role', humanize(panel.role)],
    ['Confidence', humanize(panel.confidence)],
    ['Coverage', panel.coverage != null ? `${(Number(panel.coverage) * 100).toFixed(1)}%` : '-'],
    ['Samples', panel.samples ?? '-'],
    ['Source', humanize(panel.bbox_source)],
  ];
  if (panel.reason) rows.push(['Reason', humanize(panel.reason)]);
  return (
    <div
      className={`pointer-events-none absolute z-10 min-w-[150px] rounded-lg border px-2.5 py-2 text-[10px] shadow-lg ${
        dk ? 'border-white/[0.1] bg-[#0b1220]/95 text-slate-200' : 'border-slate-200 bg-white/95 text-slate-700'
      }`}
      style={{
        left: `${leftPct}%`,
        top: `${Math.max(anchorPct, 0)}%`,
        transform: nearTop ? 'translate(-50%, 10px)' : 'translate(-50%, calc(-100% - 10px))',
      }}
    >
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-black" style={{ color: stroke }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stroke }} />
        Lead {panel.name}
      </div>
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3">
          <span className={dk ? 'text-slate-400' : 'text-slate-500'}>{label}</span>
          <span className="font-bold capitalize">{value}</span>
        </div>
      ))}
    </div>
  );
}

function EcgImageOverlay({ imageUrl, overlay, dk, highlightedLead, onHighlight }) {
  const [viewMode, setViewMode] = useState('panels');
  const [hoveredPanel, setHoveredPanel] = useState(null);
  const width = Number(overlay?.image_size?.width || 0);
  const height = Number(overlay?.image_size?.height || 0);
  const hasOverlay = width > 0 && height > 0 && Array.isArray(overlay?.panels);
  const panels = overlay?.panels || [];
  const warnings = overlay?.warnings || [];
  const recoveredCount = panels.filter((panel) => !panel?.reason && panel?.confidence !== 'low_confidence').length;
  const lowConfidenceCount = panels.filter((panel) => panel?.reason || panel?.confidence === 'low_confidence').length;
  const partialCount = panels.filter((panel) => panel?.confidence === 'interpolated').length;
  const missingLeads = overlay?.missing_leads || [];
  const viewModes = [
    { key: 'original', label: 'Original' },
    { key: 'panels', label: 'Panels' },
    { key: 'trace', label: 'Trace' },
    { key: 'both', label: 'Both' },
  ];
  const showPanels = viewMode === 'panels' || viewMode === 'both';
  const showTrace = viewMode === 'trace' || viewMode === 'both';
  const readableWarnings = warnings.map((warning) => ({
    perspective_contour_too_small: 'Page border was weak; perspective correction may be approximate.',
    deskew_unavailable: 'Deskew angle was not reliable.',
    calibration_uncertain: 'Calibration is uncertain; interval values need clinician review.',
    layout_adaptive_trace_bands: 'Panel geometry was adapted from detected trace bands.',
    rhythm_strip_from_trace_band: 'Rhythm strip bbox follows the detected trace band.',
    bbox_low_trace_coverage: 'One or more panels have low trace coverage and need review.',
  }[warning] || warning));

  return (
    <div className={`rounded-2xl border p-3 ${dk ? 'border-white/[0.06] bg-[#0d1525]' : 'border-slate-200 bg-white'}`}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider ${dk ? 'text-slate-400' : 'text-slate-500'}`}>
            <Info size={12} /> ECG image audit
          </div>
          {hasOverlay && (
            <p className={`mt-1 text-[11px] font-semibold ${dk ? 'text-slate-300' : 'text-slate-700'}`}>
              {recoveredCount}/{panels.length} panels recovered
              {lowConfidenceCount > 0 ? ` · ${lowConfidenceCount} need review` : ''}
              {partialCount > 0 ? ` · ${partialCount} partial` : ''}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {hasOverlay && (
            <div className={`inline-flex rounded-lg border p-1 ${dk ? 'border-white/[0.08] bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}>
              {viewModes.map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => setViewMode(mode.key)}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-black transition ${
                    viewMode === mode.key
                      ? 'bg-sky-600 text-white shadow-sm'
                      : dk ? 'text-slate-300 hover:bg-white/[0.06]' : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-1">
            {[
              ['Recovered', '#10b981'],
              ['Partial', '#f59e0b'],
              ['Low confidence', '#ef4444'],
            ].map(([label, color]) => (
              <span key={label} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold" style={{ borderColor: `${color}55`, color }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-lg border border-rose-200/70 bg-rose-50/60">
        <img src={imageUrl} alt="Uploaded ECG" className="block w-full" />
        {hasOverlay && viewMode !== 'original' && (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
          >
            {overlay.page_bbox && (
              <rect
                x={overlay.page_bbox[0]}
                y={overlay.page_bbox[1]}
                width={Math.max(0, overlay.page_bbox[2] - overlay.page_bbox[0])}
                height={Math.max(0, overlay.page_bbox[3] - overlay.page_bbox[1])}
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                strokeDasharray="6 4"
              />
            )}
            {panels.map((panel, index) => {
              const [x0, y0, x1, y1] = panel.bbox || [0, 0, 0, 0];
              const highlighted = highlightedLead && panel.name?.toUpperCase() === highlightedLead.toUpperCase();
              const stroke = panelStroke(panel, highlighted);
              const points = (panel.trace_points || []).map((pt) => `${pt[0]},${pt[1]}`).join(' ');
              const [tx0, ty0, tx1, ty1] = panel.trace_bbox || [];
              return (
                <g
                  key={`${panel.name}-${panel.role}-${index}`}
                  onClick={() => onHighlight?.(panel.name)}
                  onMouseEnter={() => { onHighlight?.(panel.name); setHoveredPanel(panel); }}
                  onMouseLeave={() => { onHighlight?.(null); setHoveredPanel(null); }}
                  className="cursor-pointer"
                >
                  <title>
                    {[
                      panel.name,
                      panel.role,
                      panel.bbox_source,
                      panel.coverage != null ? `coverage ${Number(panel.coverage).toFixed(3)}` : null,
                      panel.reason,
                    ].filter(Boolean).join(' · ')}
                  </title>
                  {showPanels && (
                    <rect
                      x={x0}
                      y={y0}
                      width={Math.max(0, x1 - x0)}
                      height={Math.max(0, y1 - y0)}
                      fill={highlighted ? 'rgba(14,165,233,0.13)' : 'rgba(255,255,255,0.01)'}
                      stroke={stroke}
                      strokeOpacity={highlighted ? 1 : 0.86}
                      strokeWidth={highlighted ? 4 : 2.2}
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                  {showTrace && panel.trace_bbox && (
                    <rect
                      x={tx0}
                      y={ty0}
                      width={Math.max(0, tx1 - tx0)}
                      height={Math.max(0, ty1 - ty0)}
                      fill="none"
                      stroke={highlighted ? '#38bdf8' : stroke}
                      strokeDasharray="4 4"
                      strokeOpacity={highlighted ? 0.9 : 0.42}
                      strokeWidth={highlighted ? 2.1 : 1.2}
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                  {showTrace && points && (
                    <polyline
                      points={points}
                      fill="none"
                      stroke={stroke}
                      strokeOpacity={highlighted ? 0.95 : 0.72}
                      strokeWidth={highlighted ? 2.4 : 1.15}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                  {showPanels && (
                    <text
                      x={x0 + 8}
                      y={y0 + 18}
                      fill={stroke}
                      fontSize="14"
                      fontWeight="800"
                      stroke={dk ? '#0f172a' : '#ffffff'}
                      strokeWidth="3"
                      paintOrder="stroke"
                    >
                      {panel.name}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
        {hoveredPanel && <PanelTooltip panel={hoveredPanel} width={width} height={height} dk={dk} />}
      </div>
      {(missingLeads.length > 0 || readableWarnings.length > 0) && (
        <div className={`mt-2 rounded-lg border px-2.5 py-2 text-[10px] font-semibold leading-relaxed ${dk ? 'border-amber-500/25 bg-amber-500/[0.06] text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
          {missingLeads.length > 0 && <div>Missing leads: {missingLeads.join(', ')}</div>}
          {readableWarnings.length > 0 && <div>Warnings: {readableWarnings.join(' ')}</div>}
        </div>
      )}
    </div>
  );
}

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

function InfoPair({ label, value, dk, valueClassName }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-2 text-[11px] leading-5">
      <span className={`font-bold ${dk ? 'text-slate-400' : 'text-slate-700'}`}>{label}</span>
      <span className={`truncate text-right font-semibold ${valueClassName || (dk ? 'text-slate-200' : 'text-slate-600')}`}>{value ?? '-'}</span>
    </div>
  );
}

function PredictionChip({ label, probability, status, dk }) {
  const token = statusToken(status, dk);
  const percent = probability !== null && probability !== undefined ? `${Math.round(probability * 100)}%` : null;
  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 ${dk ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-100 bg-white shadow-sm'}`}>
      <span className={`min-w-0 truncate text-[11px] font-bold ${dk ? 'text-slate-200' : 'text-slate-700'}`}>{label}</span>
      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold ${token.badge}`}>
        {percent || token.label}
      </span>
    </div>
  );
}

const DEFAULT_SAMPLES = [
  { id: "00001_hr", primary_label: "Normal ECG", age: 56, sex: "F" },
  { id: "00002_hr", primary_label: "Normal ECG", age: 19, sex: "M" },
  { id: "00003_hr", primary_label: "Normal ECG", age: 37, sex: "F" },
  { id: "00017_hr", primary_label: "Atrial fibrillation", age: 56, sex: "M" },
  { id: "00152_hr", primary_label: "Atrial fibrillation", age: 70, sex: "F" },
  { id: "00282_hr", primary_label: "Atrial fibrillation", age: null, sex: "M" },
  { id: "00008_hr", primary_label: "Inferior MI", age: 48, sex: "M" },
  { id: "00039_hr", primary_label: "Inferior MI", age: 56, sex: "M" },
  { id: "00103_hr", primary_label: "Inferior MI", age: 39, sex: "M" },
  { id: "00077_hr", primary_label: "Anterior MI", age: 43, sex: "M" },
  { id: "00199_hr", primary_label: "Anterior MI", age: 19, sex: "F" },
  { id: "00211_hr", primary_label: "Anterior MI", age: 85, sex: "F" }
];

const DEFAULT_CLAIM_WORDING = 'Bioelectric ECG Image Reader digitizes photographed or scanned 12-lead ECG printouts, extracts waveform/interval measurements, surfaces traceable screening findings, and supports clinician review/sign-off. It is decision-support only and does not provide an autonomous diagnosis.';

export default function ClinicalEcgAnalyzer() {
  const { isDarkMode: dk } = useTheme();
  const { selectedPatient } = usePatient();
  const { showToast } = useToast();
  const { language } = useLanguage();
  const locale = language === 'th' ? 'th-TH' : 'en-US';
  const [uploadedFiles, setUploadedFiles] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [samples, setSamples] = useState(DEFAULT_SAMPLES);
  const [sampleId, setSampleId] = useState('');
  const [result, setResult] = useState(null);
  const [ocrOnly, setOcrOnly] = useState(false);
  const [erQuickMode, setErQuickMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formatInfo, setFormatInfo] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [highlightedLead, setHighlightedLead] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    modelApi.ecgSamples()
      .then((d) => {
        if (d?.samples && d.samples.length > 0) {
          setSamples(d.samples);
        }
      })
      .catch(() => {});
    modelApi.ecgFormats()
      .then(setFormatInfo)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const imageFile = Array.isArray(uploadedFiles)
      ? uploadedFiles.find((file) => file?.type?.startsWith('image/') || /\.(png|jpe?g)$/i.test(file?.name || ''))
      : null;
    if (!imageFile) {
      setImagePreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [uploadedFiles]);

  const surface = dk ? 'bg-[#0d1525] border-white/[0.06]' : 'bg-white border-slate-200';
  const secLabel = dk ? 'text-slate-500' : 'text-slate-400';
  const mainText = dk ? 'text-white' : 'text-slate-900';
  const subText = dk ? 'text-slate-400' : 'text-slate-500';

  const analyze = async () => {
    if (!uploadedFiles && !sampleId) { setError('เลือกตัวอย่างจริง หรืออัปโหลดไฟล์ก่อน'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      setResult(uploadedFiles
        ? await modelApi.analyzeEcgFile(uploadedFiles, ocrOnly)
        : await modelApi.analyzeEcgSample(sampleId));
    } catch (e) {
      setError(e.message || 'วิเคราะห์ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const [pdfLoading, setPdfLoading] = useState(false);
  const downloadPdf = async () => {
    setPdfLoading(true);
    try {
      const blob = await modelApi.ecgReportBlob(
        uploadedFiles 
          ? (uploadedFiles.length === 1 ? { file: uploadedFiles[0], locale } : { files: uploadedFiles, locale }) 
          : { sampleId, locale }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = locale.startsWith('th') ? `รายงาน_ECG_${sampleId || 'upload'}.pdf` : `ECG_Report_${sampleId || 'upload'}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || 'สร้าง PDF ไม่สำเร็จ');
    } finally {
      setPdfLoading(false);
    }
  };

  const [saving, setSaving] = useState(false);
  const saveToRecord = async () => {
    if (!selectedPatient?.id) {
      showToast('เลือกผู้ป่วยก่อน (จากหน้า Patients) เพื่อบันทึกเข้าเวชระเบียน', 'warning');
      return;
    }
    setSaving(true);
    try {
      const res = await modelApi.saveEcgReport({
        patient_id: selectedPatient.id,
        result,
        source_name: uploadedFiles 
          ? (uploadedFiles.length === 1 ? uploadedFiles[0].name : uploadedFiles.map(f => f.name).join(', ')) 
          : sampleId,
      });
      const reportId = res.report_id;
      if (reportId && attachments.length > 0) {
        for (const file of attachments) {
          try {
            await modelApi.uploadReportAttachment(reportId, file);
          } catch (uploadErr) {
            showToast(`แนบไฟล์ ${file.name} ล้มเหลว: ${uploadErr.message}`, 'warning');
          }
        }
      }
      showToast(`บันทึกเข้าเวชระเบียน ${selectedPatient.name} สำเร็จ`, 'success');
      setAttachments([]);
    } catch (e) {
      showToast(`บันทึกไม่สำเร็จ: ${e.message}`, 'error');
    } finally {
      setSaving(false);
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
  const measurements = result?.measurements || {};
  const digitizationReport = result?.digitization_report || result?.meta?.digitization_report;
  const digitizationOverlay = result?.digitization_overlay || result?.meta?.digitization_overlay;
  const digitizedLeadRows = digitizationReport?.leads || [];
  const recoveredDigitizedLeads = digitizedLeadRows.filter((lead) => lead?.reason === null || lead?.reason === undefined);
  const digitizationQuality = digitizationReport?.quality || {};
  const ocrUnavailable = formatInfo?.ocr && formatInfo.ocr.available === false;
  const claimContext = result?.claim_context || formatInfo?.claim_context || {};
  const claimText = claimContext.intended_use || DEFAULT_CLAIM_WORDING;
  const clinicalUse = result?.clinical_use_status || {};
  const clinicalUseStatus = clinicalUse.status || 'pending';
  const machineFields = result?.machine_reported?.fields || {};
  const hasMachineReported = Object.values(machineFields).some((field) => field?.value !== null && field?.value !== undefined);
  const rhythm = result?.rhythm || {};
  // Prefer the backend-resolved axis (falls back to machine-OCR'd axis when the
  // signal-computed one is unavailable, e.g. single-lead image uploads) over the
  // raw self-computed-only measurements.axis_category.
  const axisCategory = result?.axis || measurements.axis_category || {};
  const leadIIName = orderedLeads.find((name) => name?.toUpperCase() === 'II');
  const leadIIValues = leadIIName ? result?.waveform?.[leadIIName] : null;

  const renderMetricTile = ({ key, label, unit, approx, normal }, compact = false) => {
    const metric = measurements[key] || {};
    const machine = machineFields[key] || {};
    const usedMachine = machine.value !== null && machine.value !== undefined;
    const value = usedMachine ? machine.value : metric.value;
    const hasValue = value !== null && value !== undefined;
    const status = metricStatus({ value }, normal);
    const token = statusToken(status, dk);
    return (
      <div key={key} className={`rounded-xl border p-3 ${token.card}`}>
        <div className="flex items-start justify-between gap-2">
          <p className={`text-[9px] font-semibold uppercase tracking-wider ${secLabel}`}>
            {label}{approx && !usedMachine && <span className="ml-1 opacity-60">~</span>}
          </p>
          {/* The number itself is already color-coded by status — repeating a
              "Review" chip on every small interval tile just adds noise when
              several tiles are abnormal at once. Reserve the explicit badge
              for the primary Rate/Rhythm/Axis cards. */}
          {!compact && <StatusBadge status={status} dk={dk} />}
        </div>
        {hasValue ? (
          <>
            <p className={`mt-1 text-xl font-bold ${token.text}`}>
              {value}<span className={`ml-1 text-[10px] font-normal ${subText}`}>{unit}</span>
            </p>
            {metric.reason && (
              <p className={`mt-0.5 text-[9px] font-semibold ${subText}`}>
                {REASON_TEXT[metric.reason] || metric.reason}
              </p>
            )}
          </>
        ) : (
          <p className={`mt-2 text-[11px] font-semibold ${subText}`}>
            - <span className="text-[9px]">{REASON_TEXT[metric.reason] || metric.reason || 'unavailable'}</span>
          </p>
        )}
      </div>
    );
  };

  const rhythmWhy = [
    rhythm.rr_cv !== null && rhythm.rr_cv !== undefined ? `RR CV ${rhythm.rr_cv}` : null,
    rhythm.p_wave_fraction !== null && rhythm.p_wave_fraction !== undefined
      ? `P wave ${rhythm.p_waves_detected}/${rhythm.beats_evaluated}`
      : null,
    rhythm.afib_probability !== null && rhythm.afib_probability !== undefined
      ? `AFIB ${rhythm.afib_probability}`
      : null,
  ].filter(Boolean).join(' · ');
  const rhythmStatus = rhythm.label
    ? (rhythm.label.toLowerCase().startsWith('normal sinus') ? 'normal' : 'abnormal')
    : 'unavailable';
  const resultDate = new Date();
  const patientInfo = {
    mrn: selectedPatient?.id_card || selectedPatient?.id?.slice?.(0, 10) || 'ไม่ระบุ',
    name: selectedPatient?.name || 'ไม่ระบุชื่อผู้ป่วย',
    age: selectedPatient?.age ? `${selectedPatient.age} years old` : '-',
    gender: selectedPatient?.gender || '-',
    date: resultDate.toLocaleDateString('en-GB'),
    time: resultDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  };
  const getMetricValue = (key, fallback = '-') => {
    const machine = machineFields?.[key];
    if (machine?.value !== null && machine?.value !== undefined) return machine.value;
    const metric = measurements?.[key];
    return metric?.value !== null && metric?.value !== undefined ? metric.value : fallback;
  };
  const primaryFinding = result?.findings?.primary;
  const topLabel = primaryFinding?.label || result?.classification?.top_label || (rhythm.label ? 'RHYTHM' : 'MEASUREMENTS');
  const topProbability = result?.classification?.top_probability;
  const isPathological = primaryFinding
    ? !['normal', 'unavailable'].includes(primaryFinding.severity)
    : result?.classification?.top_label && result.classification.top_label !== 'NORM';
  // Only the classifier's own probability breakdown belongs here — findings,
  // rhythm, and axis are already shown once each in their own detail cards
  // above; repeating them in this list just restated the same conclusions
  // in a second format without adding information.
  const predictionItems = (result?.classification?.labels || []).slice(0, 6).map((label) => {
    const probability = result.classification.probabilities?.[label] ?? 0;
    return {
      label,
      probability,
      status: label === 'NORM' ? (probability > 0.5 ? 'normal' : 'unavailable') : (probability > 0.35 ? 'abnormal' : 'unavailable'),
    };
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Input */}
      <div className={`rounded-2xl border p-4 ${surface}`}>
        <div className={`text-xs font-semibold mb-3 ${secLabel}`}>1 · เลือก ECG จริง</div>

        <div className={`mb-3 rounded-lg border p-2.5 ${dk ? 'border-sky-500/20 bg-sky-500/[0.06]' : 'border-sky-200 bg-sky-50'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${dk ? 'text-sky-300' : 'text-sky-700'}`}>Clinician CDS claim</p>
          <p className={`mt-1 text-[10px] leading-relaxed ${dk ? 'text-slate-300' : 'text-slate-700'}`}>{claimText}</p>
        </div>

        {samples.length > 0 && (
          <>
            <label className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${secLabel}`}>
              <Database size={11} /> ตัวอย่างจริง PTB-XL (มี label ยืนยัน)
            </label>
            <select
              value={sampleId}
              onChange={(e) => { setSampleId(e.target.value); setUploadedFiles(null); setHighlightedLead(null); setError(''); }}
              disabled={!!uploadedFiles}
              className={`w-full rounded-lg border px-3 py-2 text-xs mb-3 ${dk ? 'bg-white/[0.03] border-white/[0.08] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'} ${uploadedFiles ? 'opacity-50' : ''}`}
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
          <span className="truncate">
            {uploadedFiles 
              ? (uploadedFiles.length === 1 ? uploadedFiles[0].name : `${uploadedFiles.length} files selected`) 
              : 'เลือกไฟล์ (.npy / .csv / .hea+.dat / .dcm)'}
          </span>
          <input ref={inputRef} type="file" multiple accept=".npy,.csv,.xlsx,.xls,.xml,.hea,.dat,.dcm,.png,.jpg,.jpeg" className="hidden"
            onChange={(e) => { 
              const list = Array.from(e.target.files || []); 
              setUploadedFiles(list.length > 0 ? list : null); 
              setSampleId(''); 
              setHighlightedLead(null);
              setError(''); 
            }} />
        </label>
        <p className={`text-[10px] mb-3 ${subText}`}>
          รองรับ WFDB (PTB-XL), DICOM-ECG, XML (GE MUSE), Excel (.xlsx), CSV, NumPy — 12/10-lead ·
          รูปถ่าย/สแกน ECG (.png/.jpg) = digitize เต็ม 12-lead ได้ (รองรับหลาย layout: 3x4, 2x6, 4x3, มี/ไม่มี rhythm strip)
          + อ่านค่าจากหัวกระดาษเครื่องด้วย OCR ถ้ามี — ความชัดเจนของรูปมีผลต่อผลลัพธ์
        </p>
        {uploadedFiles && uploadedFiles.some(f => f?.type?.startsWith('image/') || /\.(png|jpe?g)$/i.test(f?.name || '')) && (
          <div className="mb-3 flex items-center gap-2">
            <input
              id="ocr-only-checkbox"
              type="checkbox"
              checked={ocrOnly}
              onChange={(e) => setOcrOnly(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="ocr-only-checkbox" className={`text-[10px] font-bold cursor-pointer select-none ${dk ? 'text-slate-300' : 'text-slate-700'}`}>
              อ่านเฉพาะผลวิเคราะห์และตัวเลขหัวกระดาษ (OCR Only — ข้ามการดึงคลื่นไฟฟ้าหัวใจเพื่อรันทันที)
            </label>
          </div>
        )}
        {ocrUnavailable && (
          <div className={`mb-3 flex gap-2 rounded-lg border p-2.5 ${dk ? 'border-amber-500/25 bg-amber-500/[0.06]' : 'border-amber-300 bg-amber-50'}`}>
            <AlertTriangle size={13} className={`mt-0.5 shrink-0 ${dk ? 'text-amber-400' : 'text-amber-600'}`} />
            <p className={`text-[10px] leading-relaxed ${dk ? 'text-amber-300/90' : 'text-amber-700'}`}>
              OCR unavailable, waveform digitization still works.
            </p>
          </div>
        )}
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

      {imagePreviewUrl && (
        <EcgImageOverlay
          imageUrl={imagePreviewUrl}
          overlay={digitizationOverlay}
          dk={dk}
          highlightedLead={highlightedLead}
          onHighlight={setHighlightedLead}
        />
      )}

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

          <div className={`flex gap-2 rounded-xl border p-2.5 ${
            clinicalUseStatus === 'eligible_for_review'
              ? (dk ? 'border-emerald-500/25 bg-emerald-500/[0.06]' : 'border-emerald-300 bg-emerald-50')
              : clinicalUseStatus === 'not_supported'
                ? (dk ? 'border-rose-500/25 bg-rose-500/[0.07]' : 'border-rose-300 bg-rose-50')
                : (dk ? 'border-amber-500/25 bg-amber-500/[0.06]' : 'border-amber-300 bg-amber-50')
          }`}>
            <AlertTriangle size={13} className={`shrink-0 mt-0.5 ${
              clinicalUseStatus === 'eligible_for_review'
                ? 'text-emerald-500'
                : clinicalUseStatus === 'not_supported' ? 'text-rose-500' : 'text-amber-500'
            }`} />
            <div>
              <p className={`text-[11px] font-black tracking-wide ${dk ? 'text-slate-200' : 'text-slate-800'}`}>
                {CLINICAL_STATUS_TEXT[clinicalUseStatus] || clinicalUseStatus}
              </p>
              <p className={`mt-0.5 text-[10px] leading-relaxed ${dk ? 'text-slate-300' : 'text-slate-700'}`}>
                {(clinicalUse.reasons || []).length ? `Gate reasons: ${clinicalUse.reasons.join(', ')}` : 'Eligible for clinician review with sign-off.'}
                {(clinicalUse.flags || []).length ? ` Flags: ${clinicalUse.flags.join(', ')}` : ''}
              </p>
            </div>
          </div>

          <div className={`overflow-hidden rounded-[22px] border p-4 shadow-sm ${dk ? 'border-white/[0.07] bg-[#0b1220]' : 'border-slate-200 bg-white'}`}>
            {result.ground_truth_label && (
              <div className={`mb-3 flex items-center gap-2 rounded-xl border p-2.5 ${dk ? 'bg-emerald-500/[0.08] border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                <span className={`text-[11px] ${dk ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  Label ยืนยันจาก PTB-XL: <b>{result.ground_truth_label}</b>
                </span>
              </div>
            )}
            <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className={`rounded-lg border p-3 ${dk ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200 bg-white'}`}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-lg">1</span>
                  <h3 className={`text-sm font-bold ${mainText}`}>Patient Information</h3>
                </div>
                <div className="grid grid-cols-1 gap-x-5 gap-y-1 sm:grid-cols-2">
                  <InfoPair dk={dk} label="MRN:" value={patientInfo.mrn} />
                  <InfoPair dk={dk} label="Gender:" value={patientInfo.gender} />
                  <InfoPair dk={dk} label="Name:" value={patientInfo.name} />
                  <InfoPair dk={dk} label="ECG Date:" value={patientInfo.date} />
                  <InfoPair dk={dk} label="Age:" value={patientInfo.age} />
                  <InfoPair dk={dk} label="ECG Time:" value={patientInfo.time} />
                </div>
              </div>

              <div className={`rounded-lg border p-3 ${dk ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200 bg-white'}`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-lg">2</span>
                    <h3 className={`text-sm font-bold ${mainText}`}>ECG Measurements</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErQuickMode((v) => !v)}
                    className={`text-[11px] font-bold ${erQuickMode ? 'text-rose-500' : dk ? 'text-sky-300' : 'text-sky-600'}`}
                  >
                    {erQuickMode ? 'Full View' : 'ER Quick'}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-x-5 gap-y-1 sm:grid-cols-2">
                  <InfoPair dk={dk} label="Heart Rate:" value={`${getMetricValue('heart_rate_bpm')} bpm`} />
                </div>
                {/* Rhythm/Axis/Intervals shown once, in the detail cards below — repeating them
                    here as plain text just doubled the page without adding information. */}
                <p className={`mt-2 text-[10px] font-semibold ${hasMachineReported ? (dk ? 'text-cyan-300' : 'text-cyan-700') : subText}`}>
                  Source: {hasMachineReported ? 'machine OCR header' : `computed waveform lead ${measurements.lead_used || '-'}`}
                </p>
              </div>
            </div>

            {erQuickMode ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
                <div className={`rounded-xl border p-4 ${dk ? 'border-rose-500/25 bg-rose-500/[0.06]' : 'border-rose-200 bg-rose-50'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${dk ? 'text-rose-300' : 'text-rose-700'}`}>Emergency Lead-II Screen</p>
                  <p className={`mt-2 text-5xl font-black leading-none ${dk ? 'text-white' : 'text-slate-950'}`}>
                    {getMetricValue('heart_rate_bpm')}<span className={`ml-2 text-sm font-semibold ${subText}`}>bpm</span>
                  </p>
                  <p className={`mt-3 text-sm font-bold ${rhythmStatus === 'abnormal' ? 'text-rose-500' : dk ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    {rhythm.label || REASON_TEXT[rhythm.reason] || 'Rhythm unavailable'}
                  </p>
                  {rhythmWhy && <p className={`mt-1 text-[11px] ${subText}`}>{rhythmWhy}</p>}
                </div>
                <div className={`overflow-x-auto rounded-xl border p-2 ${dk ? 'border-white/[0.07] bg-slate-950/25' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="max-w-none" style={{ width: '980px', minWidth: '680px', aspectRatio: '1200 / 236' }}>
                    <EcgPaperChart
                      waveform={result.waveform}
                      dk={dk}
                      compact
                      overlay={digitizationOverlay}
                      calibration={digitizationReport?.calibration}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {renderMetricTile(RATE_METRIC)}
                  <div className={`rounded-xl border p-3 ${statusToken(rhythmStatus, dk).card}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[9px] font-semibold uppercase tracking-wider ${secLabel}`}>Rhythm</p>
                      <StatusBadge status={rhythmStatus} dk={dk} />
                    </div>
                    <p className={`mt-1 text-base font-bold ${rhythm.label ? statusToken(rhythmStatus, dk).text : subText}`}>
                      {rhythm.label || REASON_TEXT[rhythm.reason] || rhythm.reason || 'Unavailable'}
                    </p>
                    {rhythmWhy && <p className={`mt-1 text-[9px] ${subText}`}>{rhythmWhy}</p>}
                  </div>
                  <div className={`rounded-xl border p-3 ${statusToken(axisCategory.category ? (axisCategory.category === 'Normal' ? 'normal' : 'abnormal') : 'unavailable', dk).card}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[9px] font-semibold uppercase tracking-wider ${secLabel}`}>Axis</p>
                      <StatusBadge status={axisCategory.category ? (axisCategory.category === 'Normal' ? 'normal' : 'abnormal') : 'unavailable'} dk={dk} />
                    </div>
                    <p className={`mt-1 text-base font-bold ${axisCategory.category ? statusToken(axisCategory.category === 'Normal' ? 'normal' : 'abnormal', dk).text : subText}`}>
                      {axisCategory.category || REASON_TEXT[axisCategory.reason] || axisCategory.reason || 'Unavailable'}
                    </p>
                    {axisCategory.degrees !== null && axisCategory.degrees !== undefined && (
                      <p className={`mt-1 text-[9px] ${subText}`}>
                        {axisCategory.degrees}° frontal QRS axis{axisCategory.source === 'machine_ocr' && ' · จากเครื่อง (OCR)'}
                      </p>
                    )}
                  </div>
                </section>
                <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {INTERVAL_METRICS.map((metric) => renderMetricTile(metric, true))}
                </section>
                <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
                <section>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-lg">3</span>
                      <h3 className={`text-base font-black ${mainText}`}>ECG Chart</h3>
                      <Info size={13} className={subText} />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveToRecord}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-60"
                      >
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Bookmark size={13} />}
                        Saved
                      </button>
                      <button
                        onClick={downloadPdf}
                        disabled={pdfLoading}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition ${dk ? 'border-white/[0.08] text-slate-300 hover:bg-white/[0.04]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                      >
                        {pdfLoading ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
                        PDF
                      </button>
                    </div>
                  </div>
                  <EcgChartViewer
                    waveform={result.waveform}
                    dk={dk}
                    overlay={digitizationOverlay}
                    digitizationReport={digitizationReport}
                  />
                </section>

                <aside>
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className={`text-base font-black ${mainText}`}>AI Predictions</h3>
                    <Info size={13} className={subText} />
                    <span className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-lg">4</span>
                  </div>
                  <div className={`overflow-hidden rounded-xl border ${dk ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 px-3 py-3 text-white">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">BIOELECTRIC ECG AI</p>
                        <p className="text-[10px] font-semibold opacity-80">{result.classification?.model || 'signal-derived measurements'}</p>
                        <p className="text-[9px] font-semibold opacity-70">
                          {result.classification?.validation?.val_macro_auc != null
                            ? `val macroAUC ${result.classification.validation.val_macro_auc.toFixed(3)} · n=${result.classification.validation.n_val_records} · ${result.classification.validation.full_dataset ? 'full dataset' : `subset=${result.classification.validation.subset_arg}`}`
                            : result.classification
                              ? 'ยังไม่มีเลข validation จริงบันทึกไว้ (checkpoint เก่า) — ห้ามเชื่อ % ด้านบนเป็นความแม่นยำ'
                              : ''}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black ${isPathological ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                        {isPathological ? 'REVIEW' : 'SCREEN OK'}
                      </span>
                      <div className="flex items-center gap-1 opacity-80">
                        <ThumbsUp size={13} />
                        <ThumbsDown size={13} />
                        <ChevronDown size={14} />
                      </div>
                    </div>
                    <div className="p-3">
                      <div className={`mb-3 rounded-lg border p-3 ${dk ? 'border-white/[0.07] bg-slate-950/40' : 'border-slate-100 bg-slate-50'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${secLabel}`}>Primary output</p>
                        <p className={`mt-1 text-lg font-black ${mainText}`}>{topLabel}</p>
                        <p className={`text-[11px] ${subText}`}>
                          {topProbability !== null && topProbability !== undefined ? `${Math.round(topProbability * 100)}% confidence · ` : ''}
                          Axis {axisCategory.category || '-'} · Lead {measurements.lead_used || '-'}
                        </p>
                        {primaryFinding?.criteria?.length > 0 && (
                          <ul className={`mt-2 space-y-1 text-[10px] ${subText}`}>
                            {primaryFinding.criteria.slice(0, 3).map((criterion) => (
                              <li key={criterion}>• {criterion}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <p className={`mb-2 text-[10px] font-bold uppercase tracking-wider ${secLabel}`}>Classifier probabilities (all 6 classes)</p>
                      <div className="grid grid-cols-1 gap-2">
                        {predictionItems.length ? predictionItems.map((item) => (
                          <PredictionChip key={`${item.label}-${item.probability}`} dk={dk} {...item} />
                        )) : (
                          <div className={`rounded-lg border p-3 text-xs ${dk ? 'border-white/[0.07] text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                            No classifier output available.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
              </div>
            )}

            {digitizationReport && (
              <div className={`mt-4 rounded-xl border p-3 ${dk ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={`text-[10px] font-black uppercase tracking-wider ${secLabel}`}>Digitization report</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${dk ? 'border-cyan-500/25 text-cyan-300 bg-cyan-500/10' : 'border-cyan-200 text-cyan-700 bg-white'}`}>
                    {digitizationReport.layout} · {digitizationQuality.status || 'unknown'} · {recoveredDigitizedLeads.length}/{digitizedLeadRows.length} leads
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 text-[10px] md:grid-cols-3">
                  <div className={subText}>Calibration: <b>{digitizationReport.calibration?.source || '-'}</b></div>
                  <div className={subText}>px/mm: <b>{digitizationReport.calibration?.px_per_mm ?? '-'}</b></div>
                  <div className={subText}>
                    Recovered:
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(digitizationReport.recovered_leads || []).length ? (
                        (digitizationReport.recovered_leads || []).map((lead) => (
                          <button
                            key={lead}
                            type="button"
                            onClick={() => setHighlightedLead(lead)}
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                              highlightedLead?.toUpperCase() === lead.toUpperCase()
                                ? 'border-sky-400 bg-sky-500/15 text-sky-400'
                                : dk ? 'border-white/[0.08] text-slate-300' : 'border-slate-200 text-slate-600 bg-white'
                            }`}
                          >
                            {lead}
                          </button>
                        ))
                      ) : (
                        <b>-</b>
                      )}
                    </div>
                  </div>
                </div>
                {(digitizationQuality.missing_leads || []).length > 0 && (
                  <p className={`mt-2 text-[10px] font-semibold ${dk ? 'text-amber-300' : 'text-amber-700'}`}>
                    Missing leads: {digitizationQuality.missing_leads.join(', ')}
                  </p>
                )}
              </div>
            )}

            <div className={`mt-4 flex gap-2 rounded-lg border p-2.5 ${dk ? 'border-amber-500/25 bg-amber-500/[0.06]' : 'border-amber-300 bg-amber-50'}`}>
              <AlertTriangle size={13} className={`mt-0.5 shrink-0 ${dk ? 'text-amber-400' : 'text-amber-600'}`} />
              <p className={`text-[10px] leading-relaxed ${dk ? 'text-amber-300/80' : 'text-amber-700'}`}>
                {result.disclaimer} OCR/machine values are kept separate from self-computed measurements.
              </p>
            </div>
          </div>

          {(q || result.localization_note || result.localization) && (
            <div className={`rounded-2xl border p-3 ${surface}`}>
              {q && (
                <>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${secLabel}`}>
                    Signal Quality · {q.status} · {q.score}/100
                  </div>
                  <div className={`mt-1 text-[11px] ${subText}`}>
                    {q.active_leads}/{q.n_leads} active leads · {q.duration_sec}s · noise {q.noise_ratio}
                  </div>
                </>
              )}
              <div className={`${q ? 'mt-2 pt-2 border-t border-slate-150 dark:border-white/[0.05]' : ''} text-[11px] ${subText}`}>
                <span className={`font-bold uppercase tracking-wider text-[10px] ${result.localization ? (dk ? 'text-sky-300' : 'text-sky-700') : (dk ? 'text-amber-300' : 'text-amber-700')}`}>
                  3D Localization:
                </span>{' '}
                {result.localization
                  ? `region ${result.localization.region?.label || '—'}`
                  : result.localization_note}
              </div>
            </div>
          )}

          <div className={`rounded-2xl border p-4 ${surface}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${secLabel}`}>
              เอกสารแนบรายงานส่งต่อ (Attachments - สูงสุด 5 ไฟล์)
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((f, i) => (
                <span key={i} className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border ${
                  dk ? 'bg-white/[0.04] border-white/[0.08] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  {f.name}
                  <button
                    onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                    className="ml-1 text-rose-500 hover:text-rose-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <label className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-semibold cursor-pointer transition ${
              dk ? 'border-white/[0.08] text-slate-300 hover:bg-white/[0.04]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}>
              <Upload size={11} /> เพิ่มไฟล์ประวัติ/รายงานส่งต่อ...
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => {
                  const list = Array.from(e.target.files || []);
                  setAttachments([...attachments, ...list]);
                }}
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
}
