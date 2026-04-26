import React, { useState, useEffect } from 'react';
import { Download, Calendar, Search, Activity } from 'lucide-react';
import { AnalyticCard } from '../components/reports/AnalyticCard';
import { ReportRow } from '../components/reports/ReportRow';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const [openRow, setOpenRow] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (token) fetchReports();
  }, [token]);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/reports/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setReports(data);
    } catch (err) {
      console.error("Failed to fetch reports", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = Array.isArray(reports) 
    ? (filter === 'ALL' ? reports : reports.filter((r) => r.status === filter))
    : [];

  const FILTERS = ['ALL', 'URGENT', 'ANALYZING', 'COMPLETED'];

  // Demo stats for the cards
  const demoCardio = [10, 15, 8, 12, 10, 25, 45, 12, 10, 8, 15, 10];
  const demoNeuro = [80, 82, 85, 84, 88, 92, 94, 91, 89, 88, 85, 82];

  return (
    <div className="p-10 font-sans min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-12 flex justify-between items-end">
            <div>
                <h1 className="text-4xl font-black text-sky-500 tracking-tighter uppercase italic">Diagnostic Reports</h1>
                <p className="text-[var(--text-muted)] text-xs font-bold tracking-[0.2em] mt-2 uppercase">Clinical Summary & Metrics</p>
            </div>
            <div className="flex gap-4">
                <button className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-[var(--text-muted)] text-xs font-black uppercase tracking-widest hover:bg-sky-500 hover:text-white transition-all shadow-sm">
                    <Download size={14} /> Export v0.1
                </button>
            </div>
        </header>

        <div className="grid grid-cols-2 gap-8 mb-16">
            <AnalyticCard
                title="Cardiovascular Recovery Trend"
                badge="HEART"
                badgeColor="#0ea5e9"
                data={demoCardio}
                color="#0ea5e9"
                stats={[
                    { label: 'Avg Pulse', value: '72.4', color: '#0ea5e9' },
                    { label: 'Variability', value: '84.2%', color: '#fbbf24' },
                    { label: 'Anomalies', value: Array.isArray(reports) ? reports.length : 0, color: '#94a3b8' },
                ]}
            />
            <AnalyticCard
                title="Neural Diffusion Accuracy"
                badge="PINN"
                badgeColor="#10b981"
                data={demoNeuro}
                color="#10b981"
                stats={[
                    { label: 'Accuracy', value: '98.8%', color: '#10b981' },
                    { label: 'Latency', value: '12ms', color: '#a78bfa' },
                    { label: 'Stability', value: 'High', color: '#94a3b8' },
                ]}
            />
        </div>

        <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-4">
                <h2 className="text-sm font-black text-[var(--text-muted)] uppercase tracking-widest">Clinical Journal</h2>
                <div className="flex gap-2 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)] shadow-sm">
                    {FILTERS.map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${filter === f ? 'bg-sky-500 text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center">
                    <div className="w-10 h-10 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((r, i) => (
                        <ReportRow
                            key={r.id || i}
                            report={{
                                ...r,
                                patientName: r.patient_id?.substring(0, 8),
                                status: r.status || 'COMPLETED'
                            }}
                            isOpen={openRow === i}
                            onToggle={() => setOpenRow(openRow === i ? null : i)}
                        />
                    ))}
                    {filtered.length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-[var(--border-color)] rounded-[3rem] opacity-40">
                            <p className="text-lg font-black uppercase tracking-widest text-[var(--text-muted)]">No Records Found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
