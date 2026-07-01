import React, { useState, useEffect } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { AnalyticCard } from '../components/reports/AnalyticCard';
import { ReportRow } from '../components/reports/ReportRow';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { usePatient } from '../context/PatientContext';

const FILTERS = ['ALL', 'PENDING_REVIEW', 'APPROVED', 'REFERRED', 'REJECTED', 'NEEDS_RETAKE'];

const Reports = () => {
  const { token, user } = useAuth();
  const { isDarkMode: dk } = useTheme();
  const { t } = useLanguage();
  const { patients } = usePatient();

  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [openRow, setOpenRow]   = useState(null);
  const [filter, setFilter]     = useState('ALL');

  useEffect(() => { if (token) fetchReports(); }, [token]);

  const fetchReports = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/reports/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(await res.json());
    } catch { console.error('Failed to fetch reports'); }
    finally  { setLoading(false); }
  };

  const getReportStatus = (report) =>
    report?.status ||
    report?.physics_params?.referral_support?.review?.status ||
    'PENDING_REVIEW';

  const filtered = Array.isArray(reports)
    ? (filter === 'ALL' ? reports : reports.filter(r => getReportStatus(r) === filter))
    : [];
  const reportsList = Array.isArray(reports) ? [...reports].sort((a, b) => new Date(a.timestamp || a.created_at) - new Date(b.timestamp || b.created_at)) : [];

  const getReportHR = (r) => {
    const hr = r.heart_rate_bpm ?? r.physics_params?.referral_support?.heart_rate_bpm;
    return Number.isFinite(Number(hr)) ? Number(hr) : null;
  };

  const getReportConfidence = (r) =>
    Number.isFinite(Number(r.ai_confidence)) ? Number(r.ai_confidence) : null;

  const heartRates = reportsList.map(getReportHR).filter((value) => value !== null);
  const confidences = reportsList.map(getReportConfidence).filter((value) => value !== null);

  const recoveryTrend = heartRates.length > 0 ? heartRates : [0, 0, 0, 0, 0];

  const supportConfidenceTrend = reportsList.length > 0 
    ? reportsList.map(r => {
        const confidence = getReportConfidence(r);
        return confidence === null ? 0 : confidence * 100;
      })
    : [0, 0, 0, 0, 0];

  const avgPulseVal = heartRates.length > 0
    ? (heartRates.reduce((acc, curr) => acc + curr, 0) / heartRates.length).toFixed(1)
    : '--';

  const variabilityVal = heartRates.length > 1
    ? (Math.max(...heartRates) - Math.min(...heartRates)).toFixed(1) + ' bpm'
    : '--';

  const anomaliesCount = reportsList.filter(r => {
    const risk = r.risk_level || r.physics_params?.referral_support?.risk_level;
    return risk === 'HIGH' || getReportStatus(r) === 'NEEDS_RETAKE';
  }).length;

  const avgAccuracy = confidences.length > 0
    ? (confidences.reduce((acc, curr) => acc + curr, 0) / confidences.length * 100).toFixed(1) + '%'
    : '--';

  const reviewedCount = reportsList.filter(r => getReportStatus(r) !== 'PENDING_REVIEW').length;

  const stabilityLabel = reportsList.length > 0
    ? (reportsList.filter(r => getReportConfidence(r) !== null && getReportConfidence(r) < 0.85).length > 0 ? 'Review' : 'Recorded')
    : '--';

  const surface  = dk ? 'bg-[#0d1525] border-white/[0.06]'  : 'bg-white border-slate-200';
  const divider  = dk ? 'border-white/[0.06]'               : 'border-slate-100';
  const secLabel = dk ? 'text-slate-500'                    : 'text-slate-400';
  const mainText = dk ? 'text-white'                        : 'text-slate-900';
  const subText  = dk ? 'text-slate-400'                    : 'text-slate-500';

  const getPatientName = (id) => {
    const p = patients?.find(item => item.id === id);
    return p ? p.name : id?.substring(0, 8);
  };

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      <div className="max-w-[1800px] mx-auto flex flex-col gap-5">

        {/* Header */}
        <header className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border p-4 ${surface}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
              dk ? 'bg-sky-500/15 border-sky-500/20 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'
            }`}>
              <FileText size={17} />
            </div>
            <div>
              <h1 className={`text-sm font-bold ${mainText}`}>{t('nav_reports')}</h1>
              <p className={`mt-0.5 text-xs ${subText}`}>Clinical Summary &amp; Metrics</p>
            </div>
          </div>
          <button className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
            dk ? 'border-white/[0.07] text-slate-400 hover:bg-white/[0.04]' : 'border-slate-200 text-slate-500 hover:bg-slate-100'
          }`}>
            <Download size={13} /> Export
          </button>
        </header>

        {/* Analytic cards — derived from stored report snapshots */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnalyticCard
            title="Cardiovascular Recovery Trend" badge="HEART" badgeColor="#0ea5e9"
            data={recoveryTrend} color="#0ea5e9"
            stats={[
              { label: 'Avg Pulse',    value: avgPulseVal,  color: '#0ea5e9' },
              { label: 'Variability',  value: variabilityVal, color: '#fbbf24' },
              { label: 'Anomalies',    value: anomaliesCount, color: '#94a3b8' },
            ]}
          />
          <AnalyticCard
            title="Avg Support Confidence" badge="PINN" badgeColor="#10b981"
            data={supportConfidenceTrend} color="#10b981"
            stats={[
              { label: 'Confidence', value: avgAccuracy, color: '#10b981' },
              { label: 'Reviewed',   value: reviewedCount,  color: '#a78bfa' },
              { label: 'Stability',  value: stabilityLabel,  color: '#94a3b8' },
            ]}
          />
        </div>

        {/* Journal */}
        <div className={`rounded-2xl border ${surface}`}>
          <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-b ${divider}`}>
            <span className={`text-xs font-semibold ${secLabel}`}>Clinical Journal</span>
            <div className={`flex gap-1 rounded-xl border p-1 ${dk ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                    filter === f
                      ? 'bg-sky-600 text-white'
                      : dk ? 'text-slate-500 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={24} className={`animate-spin ${dk ? 'text-sky-400' : 'text-sky-600'}`} />
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-2">
                {filtered.map((r, i) => (
                  <ReportRow
                    key={r.id || i}
                    report={{ ...r, patientName: getPatientName(r.patient_id), status: getReportStatus(r) }}
                    isOpen={openRow === i}
                    onToggle={() => setOpenRow(openRow === i ? null : i)}
                    currentUser={user}
                    onReviewed={fetchReports}
                  />
                ))}
              </div>
            ) : (
              <div className={`flex flex-col items-center justify-center py-16 rounded-xl border border-dashed ${
                dk ? 'border-white/[0.07]' : 'border-slate-200'
              }`}>
                <FileText size={28} className={`mb-3 ${dk ? 'text-slate-700' : 'text-slate-300'}`} />
                <p className={`text-sm font-semibold ${dk ? 'text-slate-600' : 'text-slate-400'}`}>No Records Found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
