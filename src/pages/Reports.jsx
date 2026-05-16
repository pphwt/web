import React, { useState, useEffect } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { AnalyticCard } from '../components/reports/AnalyticCard';
import { ReportRow } from '../components/reports/ReportRow';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const FILTERS = ['ALL', 'URGENT', 'ANALYZING', 'COMPLETED'];

const Reports = () => {
  const { token } = useAuth();
  const { isDarkMode: dk } = useTheme();
  const { t } = useLanguage();

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

  const filtered = Array.isArray(reports)
    ? (filter === 'ALL' ? reports : reports.filter(r => r.status === filter))
    : [];

  const demoCardio = [10, 15, 8, 12, 10, 25, 45, 12, 10, 8, 15, 10];
  const demoNeuro  = [80, 82, 85, 84, 88, 92, 94, 91, 89, 88, 85, 82];

  const surface  = dk ? 'bg-[#0d1525] border-white/[0.06]'  : 'bg-white border-slate-200';
  const divider  = dk ? 'border-white/[0.06]'               : 'border-slate-100';
  const secLabel = dk ? 'text-slate-500'                    : 'text-slate-400';
  const mainText = dk ? 'text-white'                        : 'text-slate-900';
  const subText  = dk ? 'text-slate-400'                    : 'text-slate-500';

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

        {/* Analytic cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AnalyticCard
            title="Cardiovascular Recovery Trend" badge="HEART" badgeColor="#0ea5e9"
            data={demoCardio} color="#0ea5e9"
            stats={[
              { label: 'Avg Pulse',    value: '72.4',  color: '#0ea5e9' },
              { label: 'Variability',  value: '84.2%', color: '#fbbf24' },
              { label: 'Anomalies',    value: Array.isArray(reports) ? reports.length : 0, color: '#94a3b8' },
            ]}
          />
          <AnalyticCard
            title="Neural Diffusion Accuracy" badge="PINN" badgeColor="#10b981"
            data={demoNeuro} color="#10b981"
            stats={[
              { label: 'Accuracy',  value: '98.8%', color: '#10b981' },
              { label: 'Latency',   value: '12ms',  color: '#a78bfa' },
              { label: 'Stability', value: 'High',  color: '#94a3b8' },
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
                    report={{ ...r, patientName: r.patient_id?.substring(0, 8), status: r.status || 'COMPLETED' }}
                    isOpen={openRow === i}
                    onToggle={() => setOpenRow(openRow === i ? null : i)}
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
