import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload, Play, Loader2, AlertTriangle, Info, Database, CheckCircle2, FileDown,
  ChevronDown, Bookmark, ThumbsUp, ThumbsDown, ZoomIn, Maximize2, Activity, LockKeyhole,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { usePatient } from '../../context/PatientContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigationLock } from '../../context/NavigationLockContext';
import { canPreviewImageFile, modelApi, isImageEcgFile } from '../../services/modelApi';
import {
  ClinicalMetricCard,
  ClinicalSectionHeader,
  ClinicalStatusBadge,
  ClinicalWarning,
} from '../ui/ClinicalPrimitives';
import HeartModel3D from '../visualizers/HeartModel3D';
import AHABullsEye from '../visualizers/AHABullsEye';

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
REASON_TEXT.p_wave_evidence_unavailable = 'อ่านหลักฐาน P wave ไม่ได้';
REASON_TEXT.axis_unavailable = 'คำนวณแกนไฟฟ้าหัวใจไม่ได้';
REASON_TEXT.calibration_uncertain = 'หา grid มาตราส่วนไม่ได้ ค่าเป็นการประมาณ';
REASON_TEXT.layout_low_confidence = 'layout/bbox confidence low - review original image or repeat ECG';


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

const resolveOverlayCoordinateSize = (overlay, loadedSize = null) => {
  const declaredWidth = Number(overlay?.image_size?.width || 0);
  const declaredHeight = Number(overlay?.image_size?.height || 0);
  if (declaredWidth > 0 && declaredHeight > 0) {
    return { width: declaredWidth, height: declaredHeight, source: 'metadata' };
  }

  // Older responses may contain panel coordinates without image_size. Derive
  // a coordinate canvas from every auditable geometry field so scanning can
  // continue instead of withholding the complete overlay.
  let maxX = 0;
  let maxY = 0;
  const includeBox = (box) => {
    if (!Array.isArray(box) || box.length < 4) return;
    maxX = Math.max(maxX, Number(box[2]) || 0);
    maxY = Math.max(maxY, Number(box[3]) || 0);
  };
  includeBox(overlay?.page_bbox);
  (overlay?.panels || []).forEach((panel) => {
    includeBox(panel?.bbox);
    includeBox(panel?.cell_bbox);
    includeBox(panel?.trace_bbox);
    (panel?.trace_points || []).forEach((point) => {
      maxX = Math.max(maxX, Number(point?.[0]) || 0);
      maxY = Math.max(maxY, Number(point?.[1]) || 0);
    });
  });
  if (maxX > 0 && maxY > 0) return { width: maxX, height: maxY, source: 'geometry' };
  return {
    width: Number(loadedSize?.width || 0),
    height: Number(loadedSize?.height || 0),
    source: 'displayed_image',
  };
};

const pickOverlayPanel = (overlay, label, rhythm = false) => {
  const panels = Array.isArray(overlay?.panels) ? overlay.panels : [];
  // A low-confidence panel's trace_points are mostly straight-line
  // interpolation across sparse ink (see the same exclusion in the raw-image
  // overlay) -- plotting it here in the "Readable" synthetic chart produces
  // the same misleading flat-then-jump artifact, just redrawn as if it were
  // a clean signal. Exclude it so the caller falls back to `waveform` (or
  // "Lead unavailable") instead of a fabricated-looking trace.
  const matches = panels.filter((panel) => panel?.name?.toUpperCase() === label.toUpperCase() && panel.confidence !== 'low_confidence');
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

function ChartModeButton({ active, Icon, label, onClick, dk, disabled = false }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[10px] font-black transition ${
        disabled
          ? dk
            ? 'cursor-not-allowed border-white/[0.05] bg-white/[0.02] text-slate-600'
            : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
          : active
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

const SCAN_STAGE_LABELS = {
  ingest: 'รับไฟล์',
  normalize: 'ปรับภาพ',
  layout: 'หา Layout',
  lead_detection: 'หา Leads',
  trace_extraction: 'อ่านเส้น ECG',
  calibration: 'สอบเทียบ Grid',
  signal_validation: 'ตรวจสัญญาณ',
  measurements: 'วัดค่า',
  classification: 'ประเมินโมเดลโรค',
  localization: 'ตรวจสิทธิ์ 3D',
};

function ScanPipelineStatus({ loading, scanStatus, dk }) {
  if (!loading && !scanStatus) return null;
  const stages = scanStatus?.stages || [
    { key: 'ingest', status: 'complete' },
    { key: 'normalize', status: 'pending' },
    { key: 'layout', status: 'pending' },
    { key: 'lead_detection', status: 'pending' },
    { key: 'trace_extraction', status: 'pending' },
    { key: 'calibration', status: 'pending' },
    { key: 'signal_validation', status: 'pending' },
  ];
  const colorFor = (status) => ({
    complete: dk ? 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700',
    review: dk ? 'border-amber-500/25 bg-amber-500/[0.08] text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700',
    failed: dk ? 'border-rose-500/25 bg-rose-500/[0.08] text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700',
    blocked: dk ? 'border-white/[0.08] bg-white/[0.03] text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500',
    pending: dk ? 'border-sky-500/20 bg-sky-500/[0.05] text-sky-300' : 'border-sky-200 bg-sky-50 text-sky-600',
  }[status] || (dk ? 'border-white/[0.08] text-slate-400' : 'border-slate-200 text-slate-500'));

  return (
    <div className={`mt-3 rounded-xl border p-3 ${dk ? 'border-white/[0.08] bg-slate-950/25' : 'border-slate-200 bg-white'}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className={`flex items-center gap-2 text-[11px] font-black ${dk ? 'text-slate-200' : 'text-slate-800'}`}>
          {loading ? <Loader2 size={13} className="animate-spin text-sky-500" /> : <CheckCircle2 size={13} className="text-emerald-500" />}
          {loading ? 'กำลัง Scan และอ่าน ECG…' : `Scan ${scanStatus?.status || 'complete'}`}
        </div>
        <span className={`text-[9px] font-semibold ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
          Scan ก่อน · AI เฉพาะข้อมูลที่ผ่านเกณฑ์
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
        {stages.map((stage) => (
          <div
            key={stage.key}
            title={stage.reason || ''}
            className={`rounded-lg border px-2 py-1.5 ${colorFor(stage.status)}`}
          >
            <div className="truncate text-[11px] font-black">{SCAN_STAGE_LABELS[stage.key] || stage.key}</div>
            <div className="truncate text-[10px] font-semibold uppercase opacity-75">{stage.status}</div>
          </div>
        ))}
      </div>
      {scanStatus?.capabilities && (
        <div className={`mt-2 text-[9px] font-semibold ${dk ? 'text-slate-400' : 'text-slate-500'}`}>
          ใช้งานได้: {Object.entries(scanStatus.capabilities).filter(([, enabled]) => enabled).map(([name]) => name.replaceAll('_', ' ')).join(' · ') || 'source preview only'}
        </div>
      )}
    </div>
  );
}

function SourceImageTraceChart({ imageUrl, overlay, dk }) {
  const [loadedSize, setLoadedSize] = useState(null);
  const displayUrl = overlay?.processed_image || imageUrl;
  const coordinateSize = resolveOverlayCoordinateSize(overlay, loadedSize);
  const { width, height } = coordinateSize;
  const panels = Array.isArray(overlay?.panels) ? overlay.panels : [];
  useEffect(() => setLoadedSize(null), [displayUrl]);
  if (!displayUrl) {
    return (
      <div className={`flex min-h-[260px] items-center justify-center rounded-lg border border-dashed text-xs font-bold ${dk ? 'border-white/[0.08] text-slate-500' : 'border-slate-200 text-slate-400'}`}>
        Source image unavailable
      </div>
    );
  }
  return (
    <div className={`relative overflow-auto rounded-lg border ${dk ? 'border-white/[0.07] bg-slate-950/30' : 'border-slate-200 bg-white'}`}>
      <img src={displayUrl} alt="Processed ECG source" className="block w-full" onLoad={(event) => setLoadedSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} />
      {width > 0 && height > 0 && panels.length > 0 && (
        <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          {panels.map((panel, index) => {
            const points = (panel.trace_points || []).map((pt) => `${pt[0]},${pt[1]}`).join(' ');
            const stroke = panelStroke(panel, false);
            const [rawX0, rawY0, rawX1, rawY1] = panel.cell_bbox || panel.bbox || [0, 0, 0, 0];
            // See EcgImageOverlay's matching inset: adjacent panels are often
            // flush, which reads as one merged box -- draw with a small gap.
            const boxInset = Math.min(rawX1 - rawX0, rawY1 - rawY0) * 0.04;
            const x0 = rawX0 + boxInset;
            const y0 = rawY0 + boxInset;
            const x1 = rawX1 - boxInset;
            const y1 = rawY1 - boxInset;
            return (
              <g key={`${panel.name}-${panel.role}-${index}`}>
                {panel.bbox && (
                  <rect
                    x={x0}
                    y={y0}
                    width={Math.max(0, x1 - x0)}
                    height={Math.max(0, y1 - y0)}
                    fill="none"
                    stroke={stroke}
                    strokeOpacity="0.75"
                    strokeWidth="1.8"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                {/* See EcgImageOverlay's matching skip: a low-confidence trace is
                    mostly straight-line interpolation across sparse points and
                    reads as real (wrong) data if drawn. */}
                {points && panel.confidence !== 'low_confidence' && (
                  <polyline
                    points={points}
                    fill="none"
                    stroke={stroke}
                    strokeOpacity="0.9"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

function EcgChartViewer({ waveform, dk, overlay = null, digitizationReport = null, imageUrl = null }) {
  const layoutConfidence = digitizationReport?.layout_confidence || overlay?.layout_confidence || {};
  const layoutLevel = layoutConfidence.level || digitizationReport?.quality?.layout_confidence || 'medium';
  const layoutReason = layoutConfidence.reason || digitizationReport?.quality?.reason;
  const qualityStatus = digitizationReport?.quality?.status;
  const layoutRequiresSource = Boolean(
    digitizationReport
      && (layoutLevel === 'low' || qualityStatus === 'low_confidence' || qualityStatus === 'not_supported')
  );
  const [mode, setMode] = useState(layoutRequiresSource ? 'source' : 'readable');
  useEffect(() => {
    if (layoutRequiresSource) setMode('source');
  }, [layoutRequiresSource]);
  const compact = mode === 'leadII';
  const aspectRatio = compact ? '1200 / 236' : '1200 / 560';
  const width = mode === 'fit' ? '100%' : compact ? '980px' : '1120px';
  const minWidth = mode === 'fit' ? '640px' : width;
  const hasSourceImage = Boolean(imageUrl || overlay?.processed_image);
  const usesImageTrace = Array.isArray(overlay?.panels)
    && overlay.panels.some((panel) => (panel?.trace_points || []).length > 1);

  return (
    <div className={`clinical-panel p-3 ${dk ? 'border-white/[0.07] bg-slate-950/25' : 'bg-slate-50'}`}>
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
          {hasSourceImage && (
            <ChartModeButton active={mode === 'source'} Icon={Info} label="Source" onClick={() => setMode('source')} dk={dk} />
          )}
          <ChartModeButton active={mode === 'readable'} Icon={ZoomIn} label="Readable" onClick={() => setMode('readable')} dk={dk} disabled={layoutRequiresSource} />
          <ChartModeButton active={mode === 'fit'} Icon={Maximize2} label="Fit" onClick={() => setMode('fit')} dk={dk} disabled={layoutRequiresSource} />
          <ChartModeButton active={mode === 'leadII'} Icon={Activity} label="Lead II" onClick={() => setMode('leadII')} dk={dk} disabled={layoutRequiresSource} />
        </div>
      </div>

      {layoutRequiresSource && (
        <div className={`mb-2 rounded-lg border px-2.5 py-2 text-[10px] font-semibold ${dk ? 'border-amber-500/25 bg-amber-500/[0.06] text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
          Layout or trace confidence is not ready ({humanize(layoutReason || qualityStatus || 'review_required')}). Readable synthetic chart is disabled until bbox/layout is corrected or ECG is repeated.
        </div>
      )}

      {mode === 'source' ? (
        <SourceImageTraceChart imageUrl={imageUrl} overlay={overlay} dk={dk} />
      ) : (
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
      )}
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
  const [loadedSize, setLoadedSize] = useState(null);
  const panels = overlay?.panels || [];
  const warnings = overlay?.warnings || [];
  const layoutConfidence = overlay?.layout_confidence || {};
  const standardPanels = panels.filter((panel) => panel?.role === 'panel');
  const recoveredCount = standardPanels.filter((panel) => panel?.extraction_status === 'recovered' || (!panel?.extraction_status && !panel?.reason && panel?.confidence !== 'low_confidence')).length;
  const lowConfidenceCount = panels.filter((panel) => panel?.reason || panel?.confidence === 'low_confidence').length;
  const partialCount = panels.filter((panel) => panel?.confidence === 'interpolated').length;
  const missingLeads = overlay?.missing_leads || [];
  // processed_image is the deskewed/perspective-corrected image whose pixel
  // coordinates exactly match all panel bbox values returned by the backend.
  // We display it in overlay view modes so boxes align correctly, and fall
  // back to the original upload if it is absent (e.g. very old responses).
  const processedImageUrl = overlay?.processed_image || null;
  const viewModes = [
    ...(imageUrl ? [{ key: 'original', label: 'Original' }] : []),
    { key: 'panels', label: 'Panels' },
    { key: 'trace', label: 'Trace' },
    { key: 'both', label: 'Both' },
  ];
  const showPanels = viewMode === 'panels' || viewMode === 'both';
  const showTrace = viewMode === 'trace' || viewMode === 'both';
  // Use processed image for overlay modes so bbox coords align; original for the plain view.
  const displayUrl = (viewMode !== 'original' && processedImageUrl) ? processedImageUrl : imageUrl;
  const coordinateSize = resolveOverlayCoordinateSize(overlay, loadedSize);
  const { width, height } = coordinateSize;
  const hasOverlay = width > 0 && height > 0 && Array.isArray(overlay?.panels);
  // SVG viewBox performs independent X/Y scaling into the exact rendered
  // image box. This supports browser resize, EXIF-oriented uploads, cropped
  // processed images and legacy responses whose natural dimensions differ.
  const overlayReady = hasOverlay && Boolean(displayUrl);
  const usesBestEffortSource = viewMode !== 'original'
    && !processedImageUrl
    && loadedSize
    && coordinateSize.source !== 'displayed_image';
  useEffect(() => setLoadedSize(null), [displayUrl]);
  const readableWarnings = warnings.map((warning) => ({
    perspective_contour_too_small: 'Page border was weak; perspective correction may be approximate.',
    deskew_unavailable: 'Deskew angle was not reliable.',
    calibration_uncertain: 'Calibration is uncertain; interval values need clinician review.',
    layout_adaptive_trace_bands: 'Panel geometry was adapted from detected trace bands.',
    rhythm_strip_from_trace_band: 'Rhythm strip bbox follows the detected trace band.',
    bbox_low_trace_coverage: 'One or more panels have low trace coverage and need review.',
    layout_low_confidence: 'Layout evidence is weak or label anchors conflict; review source image or repeat ECG.',
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
              {recoveredCount}/{standardPanels.length || panels.length} standard panels recovered
              {lowConfidenceCount > 0 ? ` · ${lowConfidenceCount} need review` : ''}
              {partialCount > 0 ? ` · ${partialCount} partial` : ''}
            </p>
          )}
          {layoutConfidence.level && (
            <p className={`mt-1 text-[10px] font-bold ${layoutConfidence.level === 'low' ? 'text-amber-500' : dk ? 'text-slate-400' : 'text-slate-500'}`}>
              Layout confidence: {layoutConfidence.level}
              {layoutConfidence.reason ? ` · ${humanize(layoutConfidence.reason)}` : ''}
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
        {/* No max-height/scroll here -- the whole image renders at its
            natural size so the overlay is never taller than its container
            (see the old max-h-[500px] version's comment history: that clamp
            made the absolutely-positioned SVG's h-full resolve against the
            clamped box instead of the image's true rendered size). */}
        <div className="relative">
          <img src={displayUrl} alt="Uploaded ECG" className="block w-full" onLoad={(event) => setLoadedSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} />
          {overlayReady && viewMode !== 'original' && (
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
                const [rawX0, rawY0, rawX1, rawY1] = panel.cell_bbox || panel.bbox || [0, 0, 0, 0];
                // Adjacent panels are often flush (no real gap in the source
                // geometry), which reads as one merged box once low-confidence
                // panels share a border color -- inset the drawn rect a touch
                // so neighboring boxes are always visually distinct.
                const insetAmount = Math.min(rawX1 - rawX0, rawY1 - rawY0) * 0.04;
                const x0 = rawX0 + insetAmount;
                const y0 = rawY0 + insetAmount;
                const x1 = rawX1 - insetAmount;
                const y1 = rawY1 - insetAmount;
                const highlighted = highlightedLead && panel.name?.toUpperCase() === highlightedLead.toUpperCase();
                const stroke = panelStroke(panel, highlighted);
                const points = (panel.trace_points || []).map((pt) => `${pt[0]},${pt[1]}`).join(' ');
                const [tx0, ty0, tx1, ty1] = panel.trace_bbox || panel.bbox || [0, 0, 0, 0];
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
                    {showTrace && (panel.trace_bbox || panel.bbox) && (
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
                    {/* A low-confidence panel found very few ink columns, so this
                        polyline is mostly straight-line interpolation across
                        large gaps -- it reads as a real (wrong-looking) waveform
                        rather than the "not enough data" it actually is. Skip
                        it and let the red box + tooltip carry that signal. */}
                    {showTrace && points && panel.confidence !== 'low_confidence' && (
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
      </div>
      {usesBestEffortSource && (
        <p className={`mt-2 rounded-lg border px-2.5 py-2 text-[10px] font-semibold ${dk ? 'border-amber-500/25 bg-amber-500/[0.06] text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
          Overlay scaled to the displayed source image. Verify alignment because a processed coordinate image was not returned by this response.
        </p>
      )}
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

function PredictionChip({ label, score, status, dk }) {
  const token = statusToken(status, dk);
  const scoreLabel = score !== null && score !== undefined ? `score ${Number(score).toFixed(3)}` : null;
  return (
    <div className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 ${dk ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-100 bg-white shadow-sm'}`}>
      <span className={`min-w-0 truncate text-[11px] font-bold ${dk ? 'text-slate-200' : 'text-slate-700'}`}>{label}</span>
      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold ${token.badge}`}>
        {scoreLabel || token.label}
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

const WORKFLOW_STEPS = ['Input', 'Signal Quality', 'Digitization', 'Measurements', 'AI Screening', 'Clinician Review', 'Export'];

const ECG_CLASS_LABELS = {
  NORM: 'ไม่พบรูปแบบผิดปกติเด่น',
  MI: 'ลักษณะที่อาจสัมพันธ์กับกล้ามเนื้อหัวใจขาดเลือด/ตาย',
  STTC: 'ความเปลี่ยนแปลงของ ST/T',
  CD: 'ความผิดปกติของการนำไฟฟ้าหัวใจ',
  HYP: 'ลักษณะที่อาจสัมพันธ์กับหัวใจห้องโต/กล้ามเนื้อหนา',
  AFIB: 'ลักษณะที่อาจสัมพันธ์กับหัวใจห้องบนสั่นพลิ้ว',
};

function ResearchLocalizationPanel({ result, dk }) {
  if (!result) return null;

  const detail = result?.research_localization;
  const display = result?.localization_display || {};
  const legacySource = result?.source;
  const supported = (detail?.supported === true && display.status === 'measured')
    || Boolean(legacySource && result.localization_supported !== false);
  const region = detail?.region || result?.region || {};
  const surface = dk ? 'bg-[#0d1525] border-white/[0.06]' : 'bg-white border-slate-200';
  const mainText = dk ? 'text-white' : 'text-slate-900';
  const subText = dk ? 'text-slate-400' : 'text-slate-500';
  const missingLeads = detail?.input_mapping?.missing_clinical_leads
    || detail?.input_mapping?.missing_model_input_leads
    || [];
  const unavailableReason = detail?.reason
    || display.reason
    || result?.research_localization_note
    || 'ข้อมูล ECG ไม่ผ่าน quality, layout หรือ calibration gate';

  return (
    <section className={`rounded-2xl border p-3 ${surface}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-wider ${dk ? 'text-sky-300' : 'text-sky-700'}`}>3D regional screening support</p>
          <h3 className={`mt-1 text-sm font-black ${mainText}`}>Regional estimate — AHA segment / territory</h3>
        </div>
        <span className={`rounded-full border px-2 py-1 text-[9px] font-black ${dk ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>NOT CLINICALLY VALIDATED</span>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className={`space-y-2 rounded-xl border p-3 text-[10px] ${dk ? 'border-white/[0.07] bg-white/[0.025]' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex justify-center rounded-lg border border-slate-200/60 bg-white/40 py-1 dark:border-white/[0.05] dark:bg-white/[0.02]">
            <AHABullsEye activeSegment={supported ? (display.aha_segment || detail?.region?.segment || region?.segment || 0) : 0} aha={region} />
          </div>
          {!supported ? (
            <div className={`rounded-lg border p-3 leading-relaxed ${dk ? 'border-amber-500/25 bg-amber-500/[0.06] text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              <p className="font-black">แสดงหัวใจโดยยังไม่ปัก marker</p>
              <p className="mt-1">{unavailableReason}</p>
              {missingLeads.length > 0 && <p className="mt-1">Missing leads: {missingLeads.join(', ')}</p>}
              <p className="mt-2 opacity-80">ระบบจะไม่ฝืนสร้างตำแหน่งเมื่อหลักฐานไม่เพียงพอ</p>
            </div>
          ) : (
            <>
            <div className={`rounded-lg border p-2 ${dk ? 'border-amber-500/20 bg-amber-500/[0.05]' : 'border-amber-200 bg-amber-50'}`}>
              <p className={`font-black ${dk ? 'text-amber-200' : 'text-amber-800'}`}>Regional electrical activity estimate</p>
              <p className={`mt-1 ${subText}`}>AHA #{display.aha_segment || detail?.region?.segment || '—'} · {display.territory || detail?.region?.territory || '—'} · not a probability</p>
              <p className={`mt-1 font-mono text-[9px] ${subText}`}>Leads: {(display.input_leads || detail?.input_mapping?.model_input_leads || []).join(', ') || '—'}</p>
              <p className={`font-mono text-[9px] ${subText}`}>Model: {display.model_version || detail?.validation?.model_version || '—'} · Mesh: {display.mesh_calibration_version || '—'}</p>
              <p className={`font-mono text-[9px] ${subText}`}>Processed: {display.processing_timestamp || result.processing_timestamp || '—'}</p>
            </div>
            <div><span className={subText}>AHA segment</span><p className={`font-black ${mainText}`}>{region?.label || display.aha_label || '—'}</p></div>
            <div><span className={subText}>Territory</span><p className={`font-black ${mainText}`}>{region?.territory || display.territory || '—'}</p></div>
            <div><span className={subText}>Activation compactness</span><p className={`font-black ${mainText}`}>{detail?.confidence != null ? Number(detail.confidence).toFixed(3) : '—'}</p><p className={subText}>unitless indicator, not probability or accuracy</p></div>
            <div>
              <span className={subText}>Top regional candidates</span>
              <div className="mt-1 space-y-1">
                {(display.regional_candidates || detail?.regional_candidates || result?.regional_candidates || []).slice(0, 3).map((candidate) => (
                  <div key={`${candidate.rank}-${candidate.aha_segment}`} className={`rounded-lg border px-2 py-1.5 ${dk ? 'border-white/[0.07]' : 'border-slate-200'}`}>
                    <p className={`font-black ${mainText}`}>#{candidate.rank} AHA {candidate.aha_segment} · {candidate.label}</p>
                    <p className={subText}>{candidate.territory} · relative activation {Number(candidate.relative_activation_score || 0).toFixed(3)} · not probability</p>
                  </div>
                ))}
              </div>
            </div>
            <div><span className={subText}>Input mapping</span><p className={`font-mono text-[9px] ${mainText}`}>{detail?.input_mapping?.version || display.mapping_version || '—'}</p></div>
            <div><span className={subText}>Validation</span><p className={`font-semibold ${dk ? 'text-amber-200' : 'text-amber-800'}`}>{detail?.validation?.clinical_12_lead_validated === true ? 'validated by manifest' : 'clinical_12_lead_validated: false'}</p></div>
            <div><span className={subText}>3D uncertainty</span><p className={`font-semibold ${dk ? 'text-amber-200' : 'text-amber-800'}`}>{detail?.uncertainty?.calibration_status === 'pending' ? 'not available — calibration pending' : `${detail?.uncertainty?.uncertainty_radius_mm ?? 'not available'} mm`}</p><p className={subText}>coverage target: {detail?.uncertainty?.coverage_target ?? '—'}</p></div>
            <p className={`border-t pt-2 leading-relaxed ${dk ? 'border-white/[0.07] text-slate-400' : 'border-slate-200 text-slate-500'}`}>ตำแหน่งนี้เป็น regional research estimate ไม่ใช่จุดโรคที่ยืนยันแล้ว</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function WorkflowStepper({ activeStep, dk }) {
  return (
    <div className={`rounded-2xl border p-3 ${dk ? 'border-white/[0.06] bg-[#0d1525]' : 'border-slate-200 bg-white'}`} aria-label="ECG workflow progress">
      <div className="flex items-center justify-between gap-1 overflow-x-auto">
        {WORKFLOW_STEPS.map((step, index) => (
          <React.Fragment key={step}>
            <div className="flex min-w-fit flex-col items-center gap-1">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black ${index <= activeStep ? 'bg-sky-600 text-white' : dk ? 'bg-white/[0.06] text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                {index < activeStep ? <CheckCircle2 size={13} /> : index + 1}
              </span>
              <span className={`text-[9px] font-bold ${index <= activeStep ? (dk ? 'text-sky-300' : 'text-sky-700') : dk ? 'text-slate-500' : 'text-slate-400'}`}>{step}</span>
            </div>
            {index < WORKFLOW_STEPS.length - 1 && <span className={`h-px min-w-5 flex-1 ${index < activeStep ? 'bg-sky-500' : dk ? 'bg-white/[0.08]' : 'bg-slate-200'}`} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function QualityEvidence({ q, dk }) {
  if (!q) return null;
  const artifactCodes = [...new Set((q.artifact_profile || []).map((item) => item.code))];
  return (
    <div className="mt-2 space-y-1">
      {q.per_lead && Object.keys(q.per_lead).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(q.per_lead).map(([lead, evidence]) => (
            <span key={lead} className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${evidence.status === 'PASS' ? 'border-emerald-500/30 text-emerald-500' : evidence.status === 'WARN' ? 'border-amber-500/30 text-amber-500' : 'border-rose-500/30 text-rose-500'}`} title={(evidence.reasons || []).join(', ')}>{lead}: {evidence.status}</span>
          ))}
        </div>
      )}
      {artifactCodes.length > 0 && <p className={`text-[10px] ${dk ? 'text-amber-300' : 'text-amber-700'}`}>Artifacts: {artifactCodes.join(', ')}</p>}
    </div>
  );
}

function EcgVisualizerPanel({ result, loading, imageUrl, processedImageUrl, activeTab, setActiveTab, screeningSummary, dk }) {
  const display = result?.localization_display || {};
  const detail = result?.research_localization || {};
  const legacySource = result?.source;
  const supported = (detail.supported === true && display.status === 'measured')
    || Boolean(legacySource && result.localization_supported !== false);
  const region = detail.region || result?.region || {};
  const coords = display.web_mesh_point_norm || display.point_norm || detail.source?.norm || legacySource?.norm || null;
  const visualResult = {
    localization_coords: coords,
    localization_supported: supported,
    localization_note: detail.reason || display.reason || result?.localization_note || 'รอผลวิเคราะห์ ECG',
    confidence_type: detail.confidence_type || result?.confidence_type,
    ai_confidence: detail.confidence ?? result?.confidence,
    validation: detail.validation || result?.validation || { clinical_12_lead_validated: false },
    uncertainty: detail.uncertainty || result?.uncertainty,
    localization_display: display,
    aha: region,
    activation_map: detail.activation_map || result?.activation_map || Array(75).fill(0.5),
    top5_nodes: detail.top5_nodes || result?.top5_nodes || [],
    regional_candidates: display.regional_candidates || detail.regional_candidates || result?.regional_candidates || [],
    localization_normal_gated: result?.localization_normal_gated,
  };
  const image = processedImageUrl || imageUrl;
  const title = screeningSummary?.title_th
    || (result?.ground_truth_label ? String(result.ground_truth_label) : null)
    || 'รอผลการวิเคราะห์ ECG';
  const reason = detail.reason || display.reason || result?.localization_note || 'ยังไม่มีหลักฐานเพียงพอสำหรับการปัก marker';

  return (
    <section className={`clinical-panel overflow-hidden ${dk ? 'bg-[#0b1220] border-white/[0.07]' : 'bg-white border-slate-200'}`}>
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 ${dk ? 'border-white/[0.07]' : 'border-slate-100'}`}>
        <div>
          <p className={`text-[10px] font-black uppercase tracking-wider ${dk ? 'text-sky-300' : 'text-sky-700'}`}>Unified ECG workspace</p>
          <h2 className={`mt-1 text-sm font-black ${dk ? 'text-white' : 'text-slate-900'}`}>หัวใจ 3D และผลคัดกรองเบื้องต้น</h2>
        </div>
        <span className={`rounded-full border px-2 py-1 text-[9px] font-black ${supported ? 'border-sky-500/30 bg-sky-500/10 text-sky-500' : 'border-amber-500/30 bg-amber-500/10 text-amber-600'}`}>
          {supported ? 'REGIONAL RESEARCH ESTIMATE' : 'รอหลักฐานสำหรับ MARKER'}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
        <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-white/5">
          <button type="button" onClick={() => setActiveTab('3d')} className={`rounded-md px-3 py-1.5 text-[10px] font-bold ${activeTab === '3d' ? 'bg-white text-sky-600 shadow-sm dark:bg-slate-800' : 'text-slate-500'}`}>หัวใจ 3D</button>
          {image && <button type="button" onClick={() => setActiveTab('image')} className={`rounded-md px-3 py-1.5 text-[10px] font-bold ${activeTab === 'image' ? 'bg-white text-sky-600 shadow-sm dark:bg-slate-800' : 'text-slate-500'}`}>ภาพ ECG</button>}
        </div>
        {supported && <span className={`text-[10px] font-bold ${dk ? 'text-sky-300' : 'text-sky-700'}`}>{region.label || display.aha_label || 'AHA region'} · {region.territory || display.territory || '—'}</span>}
      </div>
      <div className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="relative h-[420px] min-h-[340px] overflow-hidden rounded-xl border border-sky-500/20 bg-slate-950/10">
          {activeTab === 'image' && image ? (
            <img src={image} alt="ECG source" className="h-full w-full object-contain bg-white" />
          ) : (
            <HeartModel3D result={visualResult} />
          )}
          {loading && <div className="absolute inset-x-4 bottom-4 rounded-lg border border-sky-400/30 bg-slate-950/80 px-3 py-2 text-center text-[10px] font-bold text-sky-200">กำลังประมวลผล ECG และประเมินตำแหน่งระดับภูมิภาค…</div>}
        </div>
        <div className={`space-y-2 rounded-xl border p-3 text-[10px] ${dk ? 'border-white/[0.07] bg-white/[0.025]' : 'border-slate-200 bg-slate-50'}`}>
          <div>
            <p className={`font-bold uppercase tracking-wider ${dk ? 'text-slate-500' : 'text-slate-400'}`}>ผลคัดกรองทันที</p>
            <p className={`mt-1 text-base font-black ${dk ? 'text-white' : 'text-slate-900'}`}>{title}</p>
            {result && <span className="mt-1 inline-flex rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[9px] font-black text-amber-800">รอแพทย์ตรวจยืนยัน</span>}
          </div>
          {supported ? (
            <div className={`rounded-lg border p-2 ${dk ? 'border-sky-500/20 bg-sky-500/[0.06]' : 'border-sky-200 bg-sky-50'}`}>
              <p className={`font-black ${dk ? 'text-sky-200' : 'text-sky-800'}`}>Marker พร้อมใช้งาน</p>
              <p className={dk ? 'text-slate-300' : 'text-slate-600'}>AHA {display.aha_segment || region.segment || '—'} · {region.territory || display.territory || '—'}</p>
              <p className="mt-1 text-[9px] opacity-70">เป็น regional electrical activity estimate ไม่ใช่จุดโรคที่ยืนยันแล้ว</p>
            </div>
          ) : (
            <div className={`rounded-lg border p-2 leading-relaxed ${dk ? 'border-amber-500/25 bg-amber-500/[0.06] text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              <p className="font-black">แสดงหัวใจโดยยังไม่ปัก marker</p>
              <p className="mt-1">{reason}</p>
            </div>
          )}
          <div className={`rounded-lg border p-2 ${dk ? 'border-white/[0.07]' : 'border-slate-200 bg-white'}`}>
            <p className={dk ? 'text-slate-400' : 'text-slate-500'}>สถานะ</p>
            <p className={`font-black ${dk ? 'text-slate-200' : 'text-slate-700'}`}>{result?.pipeline?.status || (loading ? 'processing' : 'ready')}</p>
            {screeningSummary?.recommended_action_th && <p className="mt-1 text-[9px]">คำแนะนำ: {screeningSummary.recommended_action_th}</p>}
          </div>
          <div className={`flex justify-center rounded-lg border py-1 ${dk ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-200 bg-white'}`}>
            <AHABullsEye activeSegment={supported ? (display.aha_segment || region.segment || 0) : 0} aha={region} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ClinicalEcgAnalyzer() {
  const { isDarkMode: dk } = useTheme();
  const { selectedPatient } = usePatient();
  const { showToast } = useToast();
  const { language } = useLanguage();
  const { setNavigationLocked } = useNavigationLock();
  const locale = language === 'th' ? 'th-TH' : 'en-US';
  const [uploadedFiles, setUploadedFiles] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [samples, setSamples] = useState(DEFAULT_SAMPLES);
  const [researchSamples, setResearchSamples] = useState([]);
  const [sampleSource, setSampleSource] = useState('clinical');
  const [sampleId, setSampleId] = useState('');
  const [researchSampleId, setResearchSampleId] = useState('');
  const [result, setResult] = useState(null);
  const [ocrOnly, setOcrOnly] = useState(false);
  const demoMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1';
  // Image uploads run the guarded regional estimate automatically. The API
  // withholds the marker when image, signal or calibration evidence is weak.
  const [layoutOverride, setLayoutOverride] = useState('');
  const [erQuickMode, setErQuickMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formatInfo, setFormatInfo] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [highlightedLead, setHighlightedLead] = useState(null);
  const [sampleDropdownOpen, setSampleDropdownOpen] = useState(false);
  const [activeVisualizerTab, setActiveVisualizerTab] = useState('3d');
  const [referralDestination, setReferralDestination] = useState('โรงพยาบาลแม่ข่าย / แผนกหัวใจ');
  const [clinicianNote, setClinicianNote] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);
  const inputRef = useRef(null);
  const resultRef = useRef(null);
  const sampleDropdownRef = useRef(null);
  const analyzeInFlightRef = useRef(false);
  const pdfInFlightRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const analysisAbortRef = useRef(null);
  const saveAbortRef = useRef(null);
  const hasImageUpload = Array.isArray(uploadedFiles) && uploadedFiles.some((file) => isImageEcgFile(file));

  useEffect(() => {
    if (!sampleDropdownOpen) return;
    const onClickOutside = (e) => {
      if (sampleDropdownRef.current && !sampleDropdownRef.current.contains(e.target)) {
        setSampleDropdownOpen(false);
      }
    };
    const onKeyDown = (e) => { if (e.key === 'Escape') setSampleDropdownOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [sampleDropdownOpen]);

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
    modelApi.samples()
      .then((payload) => {
        if (payload?.samples?.length) setResearchSamples(payload.samples);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const imageFile = Array.isArray(uploadedFiles)
      ? uploadedFiles.find((file) => isImageEcgFile(file))
      : null;
    if (!imageFile || !canPreviewImageFile(imageFile)) {
      setImagePreviewUrl('');
      setLayoutOverride('');
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    setLayoutOverride('');
    return () => URL.revokeObjectURL(url);
  }, [uploadedFiles]);

  const surface = dk ? 'bg-[#0d1525] border-white/[0.06]' : 'bg-white border-slate-200';
  const secLabel = dk ? 'text-slate-500' : 'text-slate-400';
  const mainText = dk ? 'text-white' : 'text-slate-900';
  const subText = dk ? 'text-slate-400' : 'text-slate-500';

  const analyze = async () => {
    // React state updates are asynchronous; this ref closes the small window
    // where two rapid clicks could otherwise start duplicate uploads.
    if (analyzeInFlightRef.current || loading) return;
    if (!uploadedFiles && !sampleId && !researchSampleId) { setError('เลือกตัวอย่าง หรืออัปโหลดไฟล์ก่อน'); return; }
    analyzeInFlightRef.current = true;
    const controller = new AbortController();
    analysisAbortRef.current = controller;
    setNavigationLocked(true, 'กำลัง Scan และอ่าน ECG… กรุณารอให้การประมวลผลเสร็จก่อนเปลี่ยนหน้า', () => controller.abort());
    setLoading(true); setError(''); setResult(null); setSavedReport(null);
    try {
      setResult(uploadedFiles
        ? await modelApi.analyzeEcgFile(uploadedFiles, ocrOnly, layoutOverride || null, {
          signal: controller.signal,
          localizationMode: hasImageUpload ? 'auto' : 'disabled',
        })
        : sampleSource === 'research'
          ? await modelApi.analyzeSample(researchSampleId, { signal: controller.signal })
          : await modelApi.analyzeEcgSample(sampleId, { signal: controller.signal }));
    } catch (e) {
      setError(e.message || 'วิเคราะห์ไม่สำเร็จ');
    } finally {
      setLoading(false);
      setNavigationLocked(false);
      analyzeInFlightRef.current = false;
      analysisAbortRef.current = null;
    }
  };

  useEffect(() => () => {
    analysisAbortRef.current?.abort();
    saveAbortRef.current?.abort();
    setNavigationLocked(false);
  }, [setNavigationLocked]);

  const [pdfLoading, setPdfLoading] = useState(false);
  const downloadPdf = async () => {
    if (pdfInFlightRef.current || pdfLoading) return;
    if (sampleSource === 'research') {
      showToast('ตัวอย่าง 3D Research ไม่มี clinical report PDF ให้ดาวน์โหลด', 'warning');
      return;
    }
    pdfInFlightRef.current = true;
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
      pdfInFlightRef.current = false;
    }
  };

  const [saving, setSaving] = useState(false);
  const [savedReport, setSavedReport] = useState(null);
  const canWriteClinicalRecord = Boolean(uploadedFiles?.length && selectedPatient?.id && result);
  const saveToRecord = async () => {
    if (saveInFlightRef.current || saving || savedReport?.report_id) return;
    if (!result) {
      showToast('วิเคราะห์ ECG ให้เสร็จก่อนบันทึก', 'warning');
      return;
    }
    if (!selectedPatient?.id) {
      showToast('เลือกผู้ป่วยก่อน (จากหน้า Patients) เพื่อบันทึกเข้าเวชระเบียน', 'warning');
      return;
    }
    if (!uploadedFiles?.length) {
      showToast('ตัวอย่างสาธิต/ข้อมูลสาธารณะไม่ถูกบันทึกเป็นเวชระเบียน ให้ใช้อัปโหลด ECG จริงก่อน', 'warning');
      return;
    }
    saveInFlightRef.current = true;
    const controller = new AbortController();
    saveAbortRef.current = controller;
    setNavigationLocked(true, 'กำลังบันทึกผล ECG… กรุณารอให้เสร็จก่อนเปลี่ยนหน้า', () => controller.abort());
    setSaving(true);
    try {
      const res = await modelApi.saveEcgReport({
        patient_id: selectedPatient.id,
        result,
        notes: clinicianNote,
        referral_destination: referralDestination,
        source_name: uploadedFiles 
          ? (uploadedFiles.length === 1 ? uploadedFiles[0].name : uploadedFiles.map(f => f.name).join(', ')) 
          : sampleId,
      }, { signal: controller.signal });
      const reportId = res.report_id;
      setSavedReport({ report_id: reportId, status: res.status || 'success' });
      if (reportId && attachments.length > 0) {
        for (const file of attachments) {
          try {
            await modelApi.uploadReportAttachment(reportId, file, { signal: controller.signal });
          } catch (uploadErr) {
            if (uploadErr?.name === 'AbortError') throw uploadErr;
            showToast(`แนบไฟล์ ${file.name} ล้มเหลว: ${uploadErr.message}`, 'warning');
          }
        }
      }
      showToast(
        res.status === 'already_exists'
          ? `ผล ECG นี้ถูกบันทึกไว้แล้วในเวชระเบียน ${selectedPatient.name}`
          : `บันทึกเข้าเวชระเบียน ${selectedPatient.name} สำเร็จ`,
        'success'
      );
      setAttachments([]);
    } catch (e) {
      showToast(`บันทึกไม่สำเร็จ: ${e.message}`, 'error');
    } finally {
      setSaving(false);
      setNavigationLocked(false);
      saveInFlightRef.current = false;
      saveAbortRef.current = null;
    }
  };

  const downloadReferralLetter = async () => {
    if (!result || !canWriteClinicalRecord) {
      showToast('ใบส่งตัวใช้ได้กับผลจากไฟล์ ECG ที่อัปโหลดและผ่านการวิเคราะห์แล้ว', 'warning');
      return;
    }
    setReferralLoading(true);
    try {
      const blob = await modelApi.ecgReferralLetterBlob({
        result,
        files: uploadedFiles,
        patient: selectedPatient,
        clinicianNote,
        referralDestination,
        locale,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = locale.startsWith('th')
        ? `ใบส่งตัว_${selectedPatient?.name || 'ECG'}.pdf`
        : `Referral_${selectedPatient?.name || 'ECG'}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      showToast('ดาวน์โหลดใบส่งตัวสำเร็จ', 'success');
    } catch (e) {
      showToast(`สร้างใบส่งตัวไม่สำเร็จ: ${e.message}`, 'error');
    } finally {
      setReferralLoading(false);
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
  const scanStatus = result?.scan_status || null;
  const digitizedLeadRows = digitizationReport?.leads || [];
  const recoveredDigitizedLeads = digitizedLeadRows.filter((lead) => lead?.extraction_status === 'recovered' || (!lead?.extraction_status && (lead?.reason === null || lead?.reason === undefined)));
  const digitizationQuality = digitizationReport?.quality || {};
  const ocrUnavailable = formatInfo?.ocr && formatInfo.ocr.available === false;
  const claimContext = result?.claim_context || formatInfo?.claim_context || {};
  const claimText = claimContext.intended_use || DEFAULT_CLAIM_WORDING;
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
    if (!compact && key === 'heart_rate_bpm') {
      return (
        <ClinicalMetricCard
          label={label}
          value={hasValue ? value : null}
          unit={unit}
          status={status}
          dark={dk}
          detail={metric.reason ? (REASON_TEXT[metric.reason] || metric.reason) : `Source: ${usedMachine ? 'machine OCR header' : `computed waveform lead ${measurements.lead_used || '-'}`}`}
        />
      );
    }
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
  const classifierReview = result?.classification?.clinical_review;
  const screeningSummary = result?.screening_summary;
  // Put an available model prediction first in the summary card. The
  // independently reviewed finding remains visible below and can override the
  // status when it disagrees with the model.
  const topLabel = screeningSummary?.title_th || result?.classification?.top_label || primaryFinding?.label || (rhythm.label ? 'RHYTHM' : 'MEASUREMENTS');
  const topProbability = result?.classification?.top_probability;
  const confidenceBand = result?.classification?.confidence_band;
  const isPathological = primaryFinding
    ? !['normal', 'unavailable'].includes(primaryFinding.severity)
    : result?.classification?.top_label && result.classification.top_label !== 'NORM';
  const outputUnverified = primaryFinding?.severity === 'unavailable'
    || classifierReview?.status === 'unconfirmed'
    || Boolean(result?.classification_warning)
    || (!result?.classification && Boolean(result?.classification_note));
  const clinicalSummaryStatus = outputUnverified ? 'review' : isPathological ? 'urgent' : 'normal';
  // Only the classifier's own probability breakdown belongs here — findings,
  // rhythm, and axis are already shown once each in their own detail cards
  // above; repeating them in this list just restated the same conclusions
  // in a second format without adding information.
  const rankedPredictions = result?.classification?.top_predictions?.length
    ? result.classification.top_predictions
    : Object.entries(result?.classification?.probabilities || {})
      .sort(([, left], [, right]) => Number(right) - Number(left))
      .map(([label, score], index) => ({ rank: index + 1, label, score }));
  const predictionItems = rankedPredictions.slice(0, 3).map((prediction) => {
    const score = prediction.score ?? 0;
    return {
      label: `#${prediction.rank} ${prediction.label} · ${ECG_CLASS_LABELS[prediction.label] || 'กลุ่มคัดกรอง'}`,
      score,
      status: prediction.label === 'NORM' ? (score > 0.5 ? 'normal' : 'unavailable') : (score > 0.35 ? 'abnormal' : 'unavailable'),
    };
  });
  const artifactManifest = result?.artifact_manifest || {};
  const provenance = [
    ['Source', artifactManifest.source_name || result?.source_name || sampleId || uploadedFiles?.map((file) => file.name).join(', ') || '—'],
    ['Artifact hash', artifactManifest.artifact_hash || 'assigned when stored'],
    ['Report hash', savedReport?.report_hash || result?.report_hash || 'assigned when saved'],
    ['Model version', result?.classification?.model || 'measurements-only'],
    ['Processed', result ? 'current analysis session' : '—'],
    ['Reviewer', result?.review?.reviewed_by || 'clinician sign-off required'],
  ];
  const activeWorkflowStep = savedReport?.report_id ? 6 : result ? 5 : loading ? 3 : (uploadedFiles || sampleId || researchSampleId ? 1 : 0);
  const processedImageUrl = digitizationOverlay?.processed_image || '';
  const selectedResearchSample = researchSamples.find((item) => item.id === researchSampleId);

  return (
    <div className="flex flex-col gap-5">
      <WorkflowStepper activeStep={activeWorkflowStep} dk={dk} />
      {result?.pipeline?.stages?.length > 0 && (
        <div className={`rounded-2xl border p-3 ${surface}`}>
          <div className="mb-2 flex items-center justify-between">
            <p className={`text-[10px] font-black uppercase tracking-wider ${secLabel}`}>Analysis pipeline</p>
            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${result.pipeline.status === 'completed' ? 'border-emerald-500/30 text-emerald-500' : 'border-amber-500/30 text-amber-500'}`}>{result.pipeline.status} · {result.pipeline.elapsed_ms} ms</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.pipeline.stages.map((stage) => (
              <span key={stage.name} title={stage.reason || stage.name} className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${stage.status === 'completed' || stage.status === 'measured' ? 'border-emerald-500/30 text-emerald-500' : stage.status === 'not_applicable' ? 'border-slate-300 text-slate-400' : 'border-amber-500/30 text-amber-500'}`}>
                {stage.name}: {stage.status}
              </span>
            ))}
          </div>
        </div>
      )}
      {/* Unified input + visualizer workspace */}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
      <div className={`clinical-panel p-4 ${surface}`}>
        <ClinicalSectionHeader
          eyebrow="ECG REVIEW · STEP 1"
          title="เลือกและตรวจ ECG"
          description="เลือกข้อมูลผู้ป่วยหรืออัปโหลด ECG จากนั้นตรวจคุณภาพก่อนอ่านผลและบันทึกเวชระเบียน"
          dark={dk}
        />
        {!selectedPatient && (
          <ClinicalWarning dark={dk} className="mb-3">
            ยังไม่ได้เลือกผู้ป่วย ระบบยังวิเคราะห์ ECG ได้ แต่ต้องเลือกผู้ป่วยก่อนบันทึกเข้าเวชระเบียน
          </ClinicalWarning>
        )}

        <div className={`mb-3 grid grid-cols-3 gap-1 rounded-lg border p-1 ${dk ? 'border-white/[0.08] bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}>
          {[
            ['clinical', 'PTB-XL'],
            ['research', '3D Research'],
            ['upload', 'อัปโหลด'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setSampleSource(value);
                setResult(null);
                setError('');
                setSavedReport(null);
                if (value === 'upload') {
                  setSampleId('');
                  setResearchSampleId('');
                } else {
                  setUploadedFiles(null);
                  setLayoutOverride('');
                  setHighlightedLead(null);
                }
              }}
              className={`rounded-md px-2 py-1.5 text-[9px] font-black transition ${sampleSource === value ? 'bg-sky-600 text-white shadow-sm' : dk ? 'text-slate-400 hover:bg-white/[0.06]' : 'text-slate-500 hover:bg-white'}`}
            >{label}</button>
          ))}
        </div>

        <div className={`group relative mb-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${dk ? 'border-sky-500/20 bg-sky-500/[0.06] text-sky-300' : 'border-sky-200 bg-sky-50 text-sky-700'}`}>
          <Info size={11} />
          Clinician CDS claim
          <div className={`invisible absolute left-0 top-full z-30 mt-1.5 w-80 rounded-lg border p-2.5 text-[10px] font-normal leading-relaxed opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${dk ? 'border-white/[0.08] bg-[#0d1525] text-slate-300' : 'border-slate-200 bg-white text-slate-700'}`}>
            {claimText}
          </div>
        </div>

        {sampleSource === 'clinical' && samples.length > 0 && (
          <>
            <label className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${secLabel}`}>
              <Database size={11} /> ตัวอย่างจริง PTB-XL (มี label ยืนยัน)
            </label>
            <div ref={sampleDropdownRef} className="relative mb-3">
              <button
                type="button"
                disabled={!!uploadedFiles}
                onClick={() => setSampleDropdownOpen((v) => !v)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs ${dk ? 'bg-white/[0.03] border-white/[0.08] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'} ${uploadedFiles ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="truncate">
                  {sampleId
                    ? (() => {
                        const s = samples.find((x) => x.id === sampleId);
                        return s ? `${s.primary_label} · ${s.id} (${s.sex}, ${s.age ?? '?'}y)` : '— เลือกตัวอย่างจริง —';
                      })()
                    : '— เลือกตัวอย่างจริง —'}
                </span>
                <ChevronDown size={14} className={`shrink-0 transition-transform ${sampleDropdownOpen ? 'rotate-180' : ''} ${secLabel}`} />
              </button>
              {sampleDropdownOpen && (
                <div
                  role="listbox"
                  className={`absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border text-xs shadow-lg ${dk ? 'bg-[#0d1525] border-white/[0.08]' : 'bg-white border-slate-200'}`}
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={sampleId === ''}
                    onClick={() => { setSampleId(''); setUploadedFiles(null); setLayoutOverride(''); setHighlightedLead(null); setError(''); setSavedReport(null); setSampleDropdownOpen(false); }}
                    className={`block w-full px-3 py-2 text-left ${sampleId === '' ? 'bg-sky-600 text-white' : dk ? 'text-slate-300 hover:bg-white/[0.06]' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    — เลือกตัวอย่างจริง —
                  </button>
                  {samples.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      role="option"
                      aria-selected={sampleId === s.id}
                      onClick={() => { setSampleId(s.id); setUploadedFiles(null); setLayoutOverride(''); setHighlightedLead(null); setError(''); setSavedReport(null); setSampleDropdownOpen(false); }}
                      className={`block w-full px-3 py-2 text-left ${sampleId === s.id ? 'bg-sky-600 text-white' : dk ? 'text-slate-300 hover:bg-white/[0.06]' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      {s.primary_label} · {s.id} ({s.sex}, {s.age ?? '?'}y)
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={`text-[10px] mb-3 ${secLabel}`}>หรืออัปโหลดไฟล์เอง</div>
          </>
        )}

        {sampleSource === 'research' && (
          <div className={`mb-3 rounded-xl border p-3 ${dk ? 'border-amber-500/25 bg-amber-500/[0.06]' : 'border-amber-200 bg-amber-50'}`}>
            <label className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${dk ? 'text-amber-200' : 'text-amber-800'}`}>
              <Database size={11} /> ตัวอย่างจำลองสำหรับโมเดล 3D
            </label>
            <select
              value={researchSampleId}
              onChange={(e) => { setResearchSampleId(e.target.value); setResult(null); setSavedReport(null); setError(''); }}
              className={`mt-2 w-full rounded-lg border px-3 py-2 text-xs ${dk ? 'border-white/[0.08] bg-white/[0.03] text-slate-200' : 'border-amber-200 bg-white text-slate-700'}`}
            >
              <option value="">— เลือกตัวอย่างจำลอง 3D —</option>
              {researchSamples.map((sample) => <option key={sample.id} value={sample.id}>{sample.name || sample.primary_label || sample.id}</option>)}
            </select>
            <p className={`mt-2 text-[9px] leading-relaxed ${dk ? 'text-amber-200/80' : 'text-amber-800/80'}`}>
              RESEARCH / SYNTHETIC · ใช้ดู marker และ ground truth เท่านั้น ไม่ใช่ข้อมูลผู้ป่วยจริง
            </p>
            {selectedResearchSample?.ground_truth_label && <p className="mt-1 text-[9px]">Label: {selectedResearchSample.ground_truth_label}</p>}
          </div>
        )}

        <label className={`flex items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-xs cursor-pointer mb-3 ${dk ? 'border-white/[0.12] text-slate-400 hover:bg-white/[0.03]' : 'border-slate-300 text-slate-500 hover:bg-slate-50'}`}>
          <Upload size={14} />
          <span className="truncate">
            {uploadedFiles 
              ? (uploadedFiles.length === 1 ? uploadedFiles[0].name : `${uploadedFiles.length} files selected`) 
              : 'เลือกไฟล์ (รูปถ่าย/สแกน .jpg .png .webp หรือ .npy / .csv / .hea+.dat / .dcm)'}
          </span>
          <input ref={inputRef} type="file" multiple disabled={loading} accept=".npy,.csv,.xlsx,.xls,.xml,.hea,.dat,.dcm,.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff,.heic,.heif,.pdf,image/*,application/pdf" className="hidden"
            onChange={(e) => { 
              const list = Array.from(e.target.files || []); 
              if (list.length > 0) setSampleSource('upload');
              setUploadedFiles(list.length > 0 ? list : null); 
              setSampleId(''); 
              setLayoutOverride('');
              setHighlightedLead(null);
              setError(''); 
              setSavedReport(null);
            }} />
        </label>
        <div className={`group relative mb-3 inline-flex items-center gap-1 text-[10px] ${subText}`}>
          <Info size={11} />
          รองรับไฟล์มาตรฐานและรูปถ่าย/สแกน ECG
          <div className={`invisible absolute left-0 top-full z-30 mt-1.5 w-80 rounded-lg border p-2.5 text-[10px] font-normal leading-relaxed opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${dk ? 'border-white/[0.08] bg-[#0d1525] text-slate-300' : 'border-slate-200 bg-white text-slate-700'}`}>
            รองรับ WFDB (PTB-XL), DICOM-ECG, XML (GE MUSE), Excel (.xlsx), CSV, NumPy — 12/10-lead ·
            รูปถ่าย/สแกน ECG (.png/.jpg/.webp/.bmp/.tiff) = digitize เต็ม 12-lead ได้ (รองรับหลาย layout: 3x4, 2x6, 4x3, มี/ไม่มี rhythm strip)
            + อ่านค่าจากหัวกระดาษเครื่องด้วย OCR ถ้ามี — ความชัดเจนของรูปมีผลต่อผลลัพธ์
          </div>
        </div>
        {uploadedFiles && uploadedFiles.some((f) => isImageEcgFile(f)) && (
          <div className="mb-3 space-y-2">
            {Array.isArray(formatInfo?.image_layouts) && formatInfo.image_layouts.length > 0 && (
              <label className={`flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-[10px] font-bold ${dk ? 'border-white/[0.08] bg-white/[0.03] text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                <span>Image layout</span>
                <select
                  value={layoutOverride}
                  disabled={loading}
                  onChange={(e) => setLayoutOverride(e.target.value)}
                  className={`rounded-md border px-2 py-1 text-[10px] ${dk ? 'border-white/[0.1] bg-slate-900 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}
                >
                  <option value="">Auto detect</option>
                  {formatInfo.image_layouts.map((layout) => <option key={layout.name} value={layout.name}>{layout.name}</option>)}
                </select>
              </label>
            )}
            <div className="flex items-center gap-2">
            <input
              id="ocr-only-checkbox"
              type="checkbox"
              checked={ocrOnly}
              disabled={loading}
              onChange={(e) => setOcrOnly(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="ocr-only-checkbox" className={`text-[10px] font-bold cursor-pointer select-none ${dk ? 'text-slate-300' : 'text-slate-700'}`}>
              อ่านเฉพาะผลวิเคราะห์และตัวเลขหัวกระดาษ (OCR Only — ข้ามการดึงคลื่นไฟฟ้าหัวใจเพื่อรันทันที)
            </label>
            </div>
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
        {hasImageUpload && !result && (
          <ClinicalWarning dark={dk} className="mb-3">
            ภาพ ECG จะถูกส่งให้โมเดลประเมินเบื้องต้นทันที แต่ผลอาจคลาดเคลื่อนจากภาพถ่าย/สแกน ควรให้แพทย์ตรวจยืนยันทุกครั้ง
          </ClinicalWarning>
        )}
        <button
          onClick={analyze}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all active:scale-95 ${loading ? 'bg-sky-600/60 text-white cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700 text-white'}`}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {loading ? 'กำลังวิเคราะห์...' : '2 · วัดผล ECG'}
        </button>
        {hasImageUpload && <ScanPipelineStatus loading={loading} scanStatus={scanStatus} dk={dk} />}
        {error && <p className="mt-2 text-[11px] text-rose-500">{error}</p>}
      </div>

      <EcgVisualizerPanel
        result={result}
        loading={loading}
        imageUrl={imagePreviewUrl}
        processedImageUrl={processedImageUrl}
        activeTab={activeVisualizerTab}
        setActiveTab={setActiveVisualizerTab}
        screeningSummary={screeningSummary}
        dk={dk}
      />
      </div>

      {(imagePreviewUrl || digitizationOverlay?.processed_image) && (
        <EcgImageOverlay
          imageUrl={imagePreviewUrl}
          overlay={digitizationOverlay}
          dk={dk}
          highlightedLead={highlightedLead}
          onHighlight={setHighlightedLead}
        />
      )}

      {result && (
        <div ref={resultRef} className="space-y-5 scroll-mt-6">
          <ClinicalSectionHeader
            eyebrow="ECG REVIEW · STEP 2"
            title="ผลการอ่าน ECG และรายงานเต็ม"
            description={`${patientInfo.name} · ${patientInfo.mrn} · ตรวจสอบ trace และคุณภาพก่อนลงนามผล`}
            dark={dk}
            actions={<ClinicalStatusBadge status={clinicalSummaryStatus} dark={dk} />}
          />
          {result.meta?.format === 'image' && (
            <div className={`flex gap-2 rounded-xl border p-2.5 ${dk ? 'border-fuchsia-500/25 bg-fuchsia-500/[0.06]' : 'border-fuchsia-300 bg-fuchsia-50'}`}>
              <AlertTriangle size={13} className={`shrink-0 mt-0.5 ${dk ? 'text-fuchsia-400' : 'text-fuchsia-600'}`} />
              <p className={`text-[10px] leading-relaxed ${dk ? 'text-fuchsia-300/90' : 'text-fuchsia-700'}`}>
                <b>BETA · digitize จากรูปถ่าย</b> — {result.meta.note}
                {result.meta.px_per_mm_estimated && ' (px/mm ประมาณ — เวลา/HR อาจคลาดเคลื่อน)'}
              </p>
            </div>
          )}

          <div className={`clinical-panel overflow-hidden p-4 ${dk ? 'border-white/[0.07] bg-[#0b1220]' : 'bg-white'}`}>
            {result.ground_truth_label && (
              <p className={`mb-3 text-[24px] ${subText}`}>
                ผลการประมวลผล: <b className={mainText}>{result.ground_truth_label}</b>
              </p>
            )}
            <div className={`mb-4 rounded-lg border ${dk ? 'border-white/[0.07] divide-white/[0.07]' : 'border-slate-200 divide-slate-200'} divide-y sm:divide-y-0 sm:divide-x sm:grid sm:grid-cols-2`}>
              <div className="p-3">
                <h3 className={`mb-2 text-[11px] font-bold uppercase tracking-wider ${secLabel}`}>Patient Information</h3>
                <div className="grid grid-cols-1 gap-x-5 gap-y-1 sm:grid-cols-2">
                  <InfoPair dk={dk} label="MRN:" value={patientInfo.mrn} />
                  <InfoPair dk={dk} label="Gender:" value={patientInfo.gender} />
                  <InfoPair dk={dk} label="Name:" value={patientInfo.name} />
                  <InfoPair dk={dk} label="ECG Date:" value={patientInfo.date} />
                  <InfoPair dk={dk} label="Age:" value={patientInfo.age} />
                  <InfoPair dk={dk} label="ECG Time:" value={patientInfo.time} />
                </div>
              </div>

              <div className="p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className={`text-[11px] font-bold uppercase tracking-wider ${secLabel}`}>ECG Measurements</h3>
                  <button
                    type="button"
                    onClick={() => setErQuickMode((v) => !v)}
                    className={`text-[11px] font-bold ${erQuickMode ? 'text-rose-500' : dk ? 'text-sky-300' : 'text-sky-600'}`}
                  >
                    {erQuickMode ? 'Full View' : 'ER Quick'}
                  </button>
                </div>
                <InfoPair dk={dk} label="Heart Rate:" value={`${getMetricValue('heart_rate_bpm')} bpm`} />
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
                    <p className={`mt-1 break-words text-base font-bold ${rhythm.label ? statusToken(rhythmStatus, dk).text : subText}`}>
                      {rhythm.label || REASON_TEXT[rhythm.reason] || rhythm.reason || 'Unavailable'}
                    </p>
                    {rhythmWhy && <p className={`mt-1 text-[9px] ${subText}`}>{rhythmWhy}</p>}
                  </div>
                  <div className={`rounded-xl border p-3 ${statusToken(axisCategory.category ? (axisCategory.category === 'Normal' ? 'normal' : 'abnormal') : 'unavailable', dk).card}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[9px] font-semibold uppercase tracking-wider ${secLabel}`}>Axis</p>
                      <StatusBadge status={axisCategory.category ? (axisCategory.category === 'Normal' ? 'normal' : 'abnormal') : 'unavailable'} dk={dk} />
                    </div>
                    <p className={`mt-1 break-words text-base font-bold ${axisCategory.category ? statusToken(axisCategory.category === 'Normal' ? 'normal' : 'abnormal', dk).text : subText}`}>
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
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
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
                        disabled={saving || Boolean(savedReport?.report_id) || !canWriteClinicalRecord}
                        title={!canWriteClinicalRecord ? 'ต้องอัปโหลด ECG และเลือกผู้ป่วยก่อนบันทึกเวชระเบียน' : undefined}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-60 ${savedReport?.report_id ? 'bg-emerald-600' : 'bg-sky-600 hover:bg-sky-700'}`}
                      >
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Bookmark size={13} />}
                        {saving ? 'กำลังบันทึก…' : savedReport?.report_id ? 'บันทึกแล้ว' : 'บันทึกเข้าเวชระเบียน'}
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
                  {digitizationReport?.layout === 'ocr_only' || digitizationReport?.layout === 'unknown' ? (
                    <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center ${
                      dk ? 'border-white/[0.08] bg-white/[0.01]' : 'border-slate-200 bg-slate-50'
                    }`}>
                      <Info size={28} className="text-sky-500 mb-2 opacity-80" />
                      <h4 className={`text-xs font-bold ${mainText}`}>ไม่ได้ดึงข้อมูลสัญญาณคลื่นไฟฟ้าหัวใจ (Waveform Bypassed)</h4>
                      <p className={`mt-1 max-w-md text-[10px] leading-relaxed ${subText}`}>
                        {digitizationReport?.layout === 'ocr_only' 
                          ? 'ระบบเปิดใช้งานโหมด OCR Only เพื่ออ่านข้อมูลและตัวเลขจากหัวกระดาษเป็นหลัก'
                          : 'ระบบไม่สามารถตรวจจับเส้นกราฟคลื่นไฟฟ้าหัวใจบนภาพถ่ายได้อย่างสมบูรณ์ จึงแสดงเฉพาะข้อมูลที่ถอดจาก OCR หัวกระดาษ'}
                      </p>
                    </div>
                  ) : (
                    <EcgChartViewer
                      waveform={result.waveform}
                      dk={dk}
                      overlay={digitizationOverlay}
                      digitizationReport={digitizationReport}
                      imageUrl={imagePreviewUrl}
                    />
                  )}
                </section>

                <aside className="lg:sticky lg:top-24 lg:self-start">
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className={`text-base font-black ${mainText}`}>AI Predictions</h3>
                    <Info size={13} className={subText} />
                    <span className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-lg">{predictionItems.length || '—'}</span>
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
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black ${outputUnverified ? 'bg-amber-500' : isPathological ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                        {outputUnverified ? 'UNVERIFIED' : isPathological ? 'REVIEW' : 'SCREEN OK'}
                      </span>
                      <div className="flex items-center gap-1 opacity-80">
                        <ThumbsUp size={13} />
                        <ThumbsDown size={13} />
                        <ChevronDown size={14} />
                      </div>
                    </div>
                    <div className="p-3">
                      {result.classification_warning && (
                        <div className={`mb-3 rounded-lg border p-2.5 text-[10px] font-semibold leading-relaxed ${dk ? 'border-amber-500/25 bg-amber-500/[0.06] text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
                          {result.classification_warning}
                        </div>
                      )}
                      {screeningSummary && (
                        <div className={`mb-3 rounded-xl border p-3 ${screeningSummary.status === 'withheld'
                          ? (dk ? 'border-amber-500/30 bg-amber-500/[0.08]' : 'border-amber-300 bg-amber-50')
                          : screeningSummary.severity === 'normal'
                            ? (dk ? 'border-emerald-500/25 bg-emerald-500/[0.07]' : 'border-emerald-200 bg-emerald-50')
                            : (dk ? 'border-rose-500/25 bg-rose-500/[0.07]' : 'border-rose-200 bg-rose-50')
                        }`}>
                          <p className={`text-[10px] font-black uppercase tracking-wider ${secLabel}`}>ผลคัดกรองทันที</p>
                          <p className={`mt-1 text-base font-black ${mainText}`}>{screeningSummary.title_th}</p>
                          <span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[10px] font-black ${dk ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
                            {screeningSummary.review_label_th || 'รอแพทย์ตรวจยืนยัน'}
                          </span>
                          <p className={`mt-1 text-[11px] leading-relaxed ${subText}`}>{screeningSummary.summary_th}</p>
                          <div className={`mt-2 rounded-lg border px-2.5 py-2 text-[10px] font-semibold ${dk ? 'border-white/[0.08] text-slate-200' : 'border-white/80 bg-white/70 text-slate-700'}`}>
                            คำแนะนำ: {screeningSummary.recommended_action_th}
                          </div>
                          {screeningSummary.model_class && (
                            <p className={`mt-2 font-mono text-[9px] ${subText}`}>
                              Class {screeningSummary.model_class} · raw score {Number(screeningSummary.raw_model_score ?? 0).toFixed(3)} · preliminary screening, not a diagnosis
                            </p>
                          )}
                        </div>
                      )}
                      <div className={`mb-3 rounded-lg border p-3 ${dk ? 'border-white/[0.07] bg-slate-950/40' : 'border-slate-100 bg-slate-50'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${secLabel}`}>Primary output</p>
                        <p className={`mt-1 text-lg font-black ${mainText}`}>{topLabel}</p>
                        <p className={`text-[11px] ${subText}`}>
                          {topProbability !== null && topProbability !== undefined ? `raw model score ${Number(topProbability).toFixed(3)} · ` : ''}
                          {confidenceBand ? `${confidenceBand} raw-score band · ` : ''}
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
                      {result.classification_note && (
                        <div className={`mb-3 rounded-lg border p-2.5 text-[10px] font-semibold leading-relaxed ${dk ? 'border-amber-500/25 bg-amber-500/[0.06] text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
                          ยังไม่มีผลโมเดลโรค: {humanize(result.classification_note)} ข้อมูล measurements และ morphology ยังพร้อมให้แพทย์ตรวจสอบ
                        </div>
                      )}
                      {classifierReview?.status === 'unconfirmed' && (
                        <div className={`mb-3 rounded-lg border p-2.5 text-[10px] font-semibold leading-relaxed ${dk ? 'border-amber-500/25 bg-amber-500/[0.06] text-amber-200' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
                          Model output is unconfirmed by independent ECG measurements: {(classifierReview.reasons || []).join(' ')}
                        </div>
                      )}
                      <p className={`mb-2 text-[10px] font-bold uppercase tracking-wider ${secLabel}`}>Top preliminary screening scores</p>
                      <div className="grid grid-cols-1 gap-2">
                        {predictionItems.length ? predictionItems.map((item) => (
                          <PredictionChip key={`${item.label}-${item.score}`} dk={dk} {...item} />
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

          <ResearchLocalizationPanel result={result} dk={dk} />
          <QualityEvidence q={q} dk={dk} />

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
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-wider ${secLabel}`}>Clinician review & referral</p>
                <p className={`mt-1 text-[11px] ${subText}`}>กรอกข้อมูลประกอบการส่งต่อก่อนออกเอกสาร PDF</p>
              </div>
              <span className={`rounded-full border px-2 py-1 text-[9px] font-bold ${canWriteClinicalRecord ? 'border-emerald-500/30 text-emerald-500' : 'border-slate-300 text-slate-400'}`}>{canWriteClinicalRecord ? 'UPLOAD SOURCE' : 'DEMO / PUBLIC ONLY'}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className={`text-[10px] font-bold ${secLabel}`}>
                โรงพยาบาล/แผนกปลายทาง
                <input value={referralDestination} onChange={(e) => setReferralDestination(e.target.value)} className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs outline-none focus:border-sky-500 ${dk ? 'border-white/[0.08] bg-white/[0.03] text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`} />
              </label>
              <label className={`text-[10px] font-bold ${secLabel}`}>
                บันทึกแพทย์/เจ้าหน้าที่
                <textarea value={clinicianNote} onChange={(e) => setClinicianNote(e.target.value)} rows={2} className={`mt-1 w-full resize-none rounded-lg border px-3 py-2 text-xs outline-none focus:border-sky-500 ${dk ? 'border-white/[0.08] bg-white/[0.03] text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`} />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={downloadReferralLetter} disabled={referralLoading || !canWriteClinicalRecord} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50">
                {referralLoading ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />} ใบส่งตัว PDF
              </button>
              {!canWriteClinicalRecord && <span className={`self-center text-[9px] ${subText}`}>ตัวอย่างสาธารณะ/จำลองใช้ดูผลเท่านั้น ไม่บันทึกเข้าเวชระเบียน</span>}
            </div>
          </div>

          <div className={`rounded-2xl border p-4 ${surface}`}>
            <div className="mb-3 flex items-center gap-2">
              <LockKeyhole size={14} className={dk ? 'text-sky-300' : 'text-sky-700'} />
              <p className={`text-[10px] font-black uppercase tracking-wider ${secLabel}`}>Provenance & clinician review</p>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {provenance.map(([label, value]) => (
                <div key={label} className={`rounded-lg border p-2 ${dk ? 'border-white/[0.07] bg-white/[0.025]' : 'border-slate-100 bg-slate-50'}`}>
                  <p className={`text-[9px] font-bold uppercase tracking-wider ${secLabel}`}>{label}</p>
                  <p className={`mt-1 break-words text-[10px] font-semibold ${mainText}`}>{value}</p>
                </div>
              ))}
            </div>
            <p className={`mt-2 text-[9px] leading-relaxed ${subText}`}>Review status remains pending until an authorized clinician signs off. Unsupported or repeat-required results cannot be approved.</p>
          </div>

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
                accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff"
                className="hidden"
                onChange={(e) => {
                  const list = Array.from(e.target.files || []);
                  setAttachments([...attachments, ...list]);
                }}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
