import React, { useState } from 'react';
import { Download, Calendar, Search, Filter } from 'lucide-react';
import { AnalyticCard } from '../components/reports/AnalyticCard';
import { ReportRow } from '../components/reports/ReportRow';
import { cardioData, neuroData, recentReports } from '../lib/mockData';

const Reports = () => {
  const [openRow, setOpenRow] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const filtered = filter === 'ALL'
    ? recentReports
    : recentReports.filter((r) => r.status === filter);

  const FILTERS = ['ALL', 'URGENT ALERT', 'ANALYZING', 'COMPLETED'];

  return (
    <div className="p-10 font-sans min-h-screen animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Bioelectric AI · Diagnostics</p>
          <h1 className="text-4xl font-bold text-[#4FD1C5]">Diagnostic Reports</h1>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 text-sm font-bold hover:bg-white/10 hover:text-white transition-all">
            <Calendar size={16} /> 
            Apr 2026
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#4FD1C5]/10 border border-[#4FD1C5]/30 rounded-xl text-[#4FD1C5] text-sm font-bold hover:bg-[#4FD1C5]/20 transition-all shadow-[0_0_15px_rgba(79,209,197,0.15)]">
            <Download size={16} /> 
            Export All
          </button>
        </div>
      </div>

      {/* Analytic Cards Row */}
      <div className="flex gap-8 mb-12">
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

      {/* Recent Reports Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Recent Reports</h2>
          
          <div className="flex items-center gap-2 bg-[#1a1f2e] p-1 rounded-xl border border-white/5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-tight transition-all ${
                  filter === f 
                    ? 'bg-[#4FD1C5]/20 text-[#4FD1C5] shadow-lg' 
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Report Rows */}
        <div className="flex flex-col gap-3">
          {filtered.map((r, i) => (
            <ReportRow
              key={r.patientId}
              report={r}
              isOpen={openRow === i}
              onToggle={() => setOpenRow(openRow === i ? null : i)}
            />
          ))}
          
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-[#1a1f2e]/30 rounded-2xl border border-dashed border-white/10 text-slate-500">
              <Search size={40} className="mb-4 opacity-20" />
              <p className="text-sm">No reports match that filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
