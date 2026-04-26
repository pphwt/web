import React, { useState } from 'react';
import { Heart, Brain, Activity, FileText, Clock, ChevronDown, Eye, Download, Loader2 } from 'lucide-react';
import { diagnosticService } from '../../services/diagnosticService';

export const ReportRow = ({ report, isOpen, onToggle }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  // Map database organ_type to icons
  const Icon = report.organ_type === 'brain' ? Brain : Heart;
  const statusColor = report.ai_confidence > 0.9 ? '#10b981' : '#fbbf24';

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      setIsDownloading(true);
      await diagnosticService.downloadReportPDF(report.id);
    } catch (err) {
      alert('Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const formattedDate = new Date(report.created_at).toLocaleString();

  return (
    <div className={`bg-[#1a1f2e]/60 border rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-[#4FD1C5]/30' : 'border-white/5'}`}>
      <button
        onClick={onToggle}
        className="w-full h-full flex items-center gap-5 p-5 text-left transition-colors hover:bg-white/5"
      >
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${statusColor}18` }}
        >
          <Icon size={18} style={{ color: statusColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white tracking-tight leading-none mb-1">{report.patient_id}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{report.organ_type} DIAGNOSTIC</p>
        </div>

        <span 
          className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
          style={{ 
            backgroundColor: `${statusColor}18`, 
            color: statusColor,
            borderColor: `${statusColor}30`
          }}
        >
          {report.ai_confidence > 0.9 ? 'VERIFIED' : 'REVIEW NEEDED'}
        </span>

        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 ml-4">
          <Clock size={12} />
          {formattedDate}
        </div>

        <ChevronDown 
          size={16} 
          className={`text-slate-500 ml-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden bg-black/10`}>
        <div className="p-6 pt-0 ml-[60px] flex flex-col gap-6">
          <div className="flex gap-4 flex-wrap">
            <div className="bg-[#1a1f2e] border border-white/5 rounded-xl p-4 min-w-[140px] shadow-inner">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">AI Confidence</p>
              <p className="text-xl font-bold tracking-tight text-sky-400">{(report.ai_confidence * 100).toFixed(2)}%</p>
            </div>
            <div className="bg-[#1a1f2e] border border-white/5 rounded-xl p-4 min-w-[140px] shadow-inner">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">Localization</p>
              <p className="text-sm font-mono text-slate-300">
                X: {report.localization_coords?.x.toFixed(2)}, Y: {report.localization_coords?.y.toFixed(2)}
              </p>
            </div>
            {report.notes && (
              <div className="bg-[#1a1f2e] border border-white/5 rounded-xl p-4 flex-1 shadow-inner">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">Physician Notes</p>
                <p className="text-xs text-slate-400 italic">"{report.notes}"</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-6 py-2 bg-[#4FD1C5]/10 border border-[#4FD1C5]/30 rounded-lg text-[#4FD1C5] text-xs font-bold hover:bg-[#4FD1C5]/20 transition-all disabled:opacity-50"
            >
              {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
              Export Professional PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
