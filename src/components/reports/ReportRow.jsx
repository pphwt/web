import React from 'react';
import { Heart, Brain, Activity, FileText, Clock, ChevronDown, Eye, Download } from 'lucide-react';

export const ReportRow = ({ report, isOpen, onToggle }) => {
  const statusColor = {
    'COMPLETED': '#10b981',
    'ANALYZING': '#38bdf8',
    'URGENT ALERT': '#ef4444',
  }[report.status] ?? '#94a3b8';

  const IconMap = { Heart, Brain, Activity };
  const Icon = IconMap[report.icon] ?? FileText;

  return (
    <div className={`bg-[#1a1f2e]/60 border rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-[#4FD1C5]/30' : 'border-white/5'}`}>
      {/* row header */}
      <button
        onClick={onToggle}
        className="w-full h-full flex items-center gap-5 p-5 text-left transition-colors hover:bg-white/5"
      >
        {/* icon bubble */}
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${statusColor}18` }}
        >
          <Icon size={18} style={{ color: statusColor }} />
        </div>

        {/* identity */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white tracking-tight leading-none mb-1">{report.patientId}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{report.type}</p>
        </div>

        {/* status badge */}
        <span 
          className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-black/10"
          style={{ 
            backgroundColor: `${statusColor}18`, 
            color: statusColor,
            borderColor: `${statusColor}30`
          }}
        >
          {report.status}
        </span>

        {/* timestamp */}
        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 ml-4">
          <Clock size={12} />
          {report.time}
        </div>

        {/* chevron */}
        <ChevronDown 
          size={16} 
          className={`text-slate-500 ml-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* expanded details */}
      <div 
        className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden bg-black/10`}
      >
        <div className="p-6 pt-0 ml-[60px] flex flex-col gap-6">
          <div className="flex gap-4 flex-wrap">
            {report.details.map((d) => (
              <div key={d.label} className="bg-[#1a1f2e] border border-white/5 rounded-xl p-4 min-w-[120px] shadow-inner">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">{d.label}</p>
                <p 
                  className="text-xl font-bold tracking-tight"
                  style={{ color: d.color ?? 'white' }}
                >
                  {d.value}
                </p>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#4FD1C5]/10 border border-[#4FD1C5]/30 rounded-lg text-[#4FD1C5] text-xs font-bold hover:bg-[#4FD1C5]/20 transition-all">
              <Eye size={14} /> 
              View Full Report
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 text-xs font-bold hover:bg-white/10 hover:text-white transition-all">
              <Download size={14} /> 
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
