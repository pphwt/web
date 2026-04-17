import React, { useState } from 'react';
import {
  FileText, Download, Filter, ChevronDown, ChevronRight,
  Activity, Heart, Brain, TrendingUp, TrendingDown,
  Calendar, Clock, AlertTriangle, CheckCircle, Eye,
} from 'lucide-react';

// ──────────────────────────────────────────────
// Tiny inline bar-chart component (pure SVG/CSS)
// ──────────────────────────────────────────────
const BarChart = ({ data, color, highlightIndex }) => {
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '60px' }}>
      {data.map((v, i) => {
        const h = Math.max(6, (v / max) * 60);
        const isHigh = i === highlightIndex;
        return (
          <div
            key={i}
            title={v}
            style={{
              flex: 1,
              height: `${h}px`,
              borderRadius: '3px 3px 0 0',
              background: isHigh
                ? '#f87171'
                : `${color}`,
              opacity: isHigh ? 1 : 0.55 + (i / data.length) * 0.45,
              transition: 'opacity 0.2s',
            }}
          />
        );
      })}
    </div>
  );
};

// ──────────────────────────────────────────────
// Stat pill under each chart
// ──────────────────────────────────────────────
const StatPill = ({ label, value, color, small }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '52px' }}>
    <span style={{ fontSize: small ? '18px' : '22px', fontWeight: 700, color }}>{value}</span>
    <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>{label}</span>
  </div>
);

// ──────────────────────────────────────────────
// Analytic card (top row)
// ──────────────────────────────────────────────
const AnalyticCard = ({ title, subtitle, data, color, highlightIndex, stats, badge, badgeColor }) => (
  <div style={{
    flex: 1,
    background: 'rgba(22, 27, 42, 0.85)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '14px',
    padding: '20px 24px',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    minWidth: 0,
  }}>
    {/* header */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>Signal Analytics</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>{title}</div>
      </div>
      <span style={{
        fontSize: '9px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
        background: `${badgeColor}22`, color: badgeColor, border: `1px solid ${badgeColor}44`,
        letterSpacing: '0.05em',
      }}>{badge}</span>
    </div>

    {/* chart */}
    <BarChart data={data} color={color} highlightIndex={highlightIndex} />

    {/* stats row */}
    <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
      {stats.map((s) => (
        <StatPill key={s.label} label={s.label} value={s.value} color={s.color} small={s.small} />
      ))}
    </div>
  </div>
);

// ──────────────────────────────────────────────
// Recent report row
// ──────────────────────────────────────────────
const ReportRow = ({ report, isOpen, onToggle }) => {
  const statusColor = {
    'COMPLETED': '#10b981',
    'ANALYZING': '#38bdf8',
    'URGENT ALERT': '#ef4444',
  }[report.status] ?? '#94a3b8';

  const IconMap = { Heart, Brain, Activity };
  const Icon = IconMap[report.icon] ?? FileText;

  return (
    <div style={{
      background: 'rgba(22, 27, 42, 0.7)',
      border: `1px solid ${isOpen ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* row header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
          padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
          color: 'white', textAlign: 'left',
        }}
      >
        {/* icon bubble */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: `${statusColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={16} color={statusColor} />
        </div>

        {/* identity */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{report.patientId}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{report.type}</div>
        </div>

        {/* status badge */}
        <span style={{
          fontSize: '9px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px',
          background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}33`,
          letterSpacing: '0.05em', whiteSpace: 'nowrap',
        }}>{report.status}</span>

        {/* timestamp */}
        <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '12px', whiteSpace: 'nowrap' }}>
          <Clock size={11} />
          {report.time}
        </div>

        {/* chevron */}
        <ChevronDown size={14} color="#64748b" style={{ marginLeft: '8px', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      {/* expanded details */}
      {isOpen && (
        <div style={{ padding: '0 20px 18px 70px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {report.details.map((d) => (
              <div key={d.label} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', padding: '10px 14px', minWidth: '100px',
              }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>{d.label}</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: d.color ?? '#e2e8f0' }}>{d.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px',
              background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)',
              borderRadius: '8px', color: '#38bdf8', fontSize: '11px', cursor: 'pointer', fontWeight: 600,
            }}>
              <Eye size={13} /> View Full Report
            </button>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', fontWeight: 600,
            }}>
              <Download size={13} /> Export PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// Main Reports Page
// ──────────────────────────────────────────────
const Reports = () => {
  const [openRow, setOpenRow] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const cardioData = [65, 72, 58, 80, 74, 88, 60, 78, 83, 70, 65, 90, 55, 78, 84, 72, 61, 79, 88, 74];
  const neuroData  = [80, 90, 94, 88, 76, 72, 85, 91, 95, 88, 72, 80, 94, 88, 82, 90, 78, 85, 93, 94];

  const recentReports = [
    {
      patientId: 'PAT_01', type: 'Cardiovascular — Tachycardia Pattern', status: 'URGENT ALERT',
      icon: 'Heart', time: '09:41',
      details: [
        { label: 'Avg BPM', value: '124', color: '#f87171' },
        { label: 'Signal Q.', value: '78%', color: '#fbbf24' },
        { label: 'Duration', value: '18 min' },
        { label: 'Risk', value: 'HIGH', color: '#ef4444' },
      ],
    },
    {
      patientId: 'PAT_02', type: 'Neural Activity — GMs Index Monitoring', status: 'ANALYZING',
      icon: 'Brain', time: '09:12',
      details: [
        { label: 'GMs Index', value: '94.2', color: '#38bdf8' },
        { label: 'Accuracy', value: '52.4%', color: '#a78bfa' },
        { label: 'Anomalies', value: '25' },
        { label: 'Risk', value: 'MOD', color: '#fbbf24' },
      ],
    },
    {
      patientId: 'PAT_03', type: 'Cardiovascular — Stable Resting Rhythm', status: 'COMPLETED',
      icon: 'Activity', time: '08:55',
      details: [
        { label: 'Avg BPM', value: '64', color: '#10b981' },
        { label: 'Signal Q.', value: '96%', color: '#10b981' },
        { label: 'Duration', value: '24 min' },
        { label: 'Risk', value: 'LOW', color: '#10b981' },
      ],
    },
  ];

  const filtered = filter === 'ALL'
    ? recentReports
    : recentReports.filter((r) => r.status === filter);

  const FILTERS = ['ALL', 'URGENT ALERT', 'ANALYZING', 'COMPLETED'];

  return (
    <div style={{
      background: '#0b0f1a', minHeight: '100vh', color: 'white',
      padding: '40px 40px 60px', fontFamily: "'Inter', sans-serif", overflowY: 'auto',
    }}>

      {/* ── Page header ───────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <div style={{ fontSize: '10px', color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
            Bioelectric AI · Diagnostics
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Diagnostic Reports
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', color: '#94a3b8', fontSize: '12px', cursor: 'pointer',
          }}>
            <Calendar size={14} /> Apr 2026
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
            background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)',
            borderRadius: '10px', color: '#38bdf8', fontSize: '12px', cursor: 'pointer', fontWeight: 600,
          }}>
            <Download size={14} /> Export All
          </button>
        </div>
      </div>

      {/* ── Analytic cards row ────────────────────────── */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
        <AnalyticCard
          title="Cardiovascular Recovery Trend"
          badge="HIGH ALERT"
          badgeColor="#ef4444"
          data={cardioData}
          color="#f87171"
          highlightIndex={12}
          stats={[
            { label: 'Avg BPM', value: '78.4', color: '#f87171' },
            { label: 'Signal Q.', value: '84.2%', color: '#fbbf24' },
            { label: 'Anomalies', value: '83', color: '#94a3b8' },
          ]}
        />
        <AnalyticCard
          title="Neural Activity Index (GMs)"
          badge="MONITORING"
          badgeColor="#38bdf8"
          data={neuroData}
          color="#38bdf8"
          highlightIndex={18}
          stats={[
            { label: 'GMs Index', value: '94.2', color: '#38bdf8' },
            { label: 'Accuracy', value: '52.4%', color: '#a78bfa' },
            { label: 'Anomalies', value: '25', color: '#94a3b8' },
          ]}
        />
      </div>

      {/* ── Recent Reports section ────────────────────── */}
      <div>
        {/* section header + filter tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Recent Reports
          </h2>
          <div style={{ display: 'flex', gap: '6px' }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '5px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                  cursor: 'pointer', letterSpacing: '0.05em', transition: 'all 0.2s',
                  background: filter === f ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
                  border: filter === f ? '1px solid rgba(56,189,248,0.35)' : '1px solid rgba(255,255,255,0.08)',
                  color: filter === f ? '#38bdf8' : '#64748b',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* report rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((r, i) => (
            <ReportRow
              key={r.patientId}
              report={r}
              isOpen={openRow === i}
              onToggle={() => setOpenRow(openRow === i ? null : i)}
            />
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px', fontSize: '13px' }}>
              No reports match that filter.
            </div>
          )}
        </div>
      </div>

      {/* ambient glow */}
      <div style={{ position: 'fixed', top: '20%', right: '-80px', width: '380px', height: '380px', background: 'radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />
      <div style={{ position: 'fixed', bottom: '15%', left: '-80px', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />
    </div>
  );
};

export default Reports;
