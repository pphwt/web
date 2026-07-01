import React, { useState } from 'react';
import { Heart, Clock, ChevronDown, Download, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { diagnosticService } from '../../services/diagnosticService';

export const ReportRow = ({ report, isOpen, onToggle }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { isDarkMode: dk } = useTheme();

  // Map database organ_type to icons
  const Icon = Heart;
  const referral = report.physics_params?.referral_support || {};
  const quality = referral.signal_quality || {};
  const riskLevel = referral.risk_level || 'REVIEW';
  const statusColor = riskLevel === 'HIGH'
    ? '#ef4444'
    : riskLevel === 'MODERATE'
    ? '#f59e0b'
    : report.ai_confidence > 0.9
    ? '#10b981'
    : '#fbbf24';

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

  const dateObj = report.timestamp || report.created_at;
  const formattedDate = dateObj ? new Date(dateObj).toLocaleString() : 'No Date';

  // Theme-specific style classes
  const containerBg = dk 
    ? `bg-[#0d1525] hover:bg-[#131d31]` 
    : `bg-slate-50/50 hover:bg-slate-100/30`;
    
  const activeBorder = dk ? 'border-sky-500/30 shadow-[0_4px_20px_rgba(14,165,233,0.08)]' : 'border-sky-500/20 shadow-[0_4px_16px_rgba(15,23,42,0.03)]';
  const inactiveBorder = dk ? 'border-white/[0.06]' : 'border-slate-200/80';

  const textTitle = dk ? 'text-white' : 'text-slate-800';
  const textSub = dk ? 'text-slate-500' : 'text-slate-400';
  const textBody = dk ? 'text-slate-400' : 'text-slate-600';

  const detailPanelBg = dk ? 'bg-black/10' : 'bg-slate-100/30';
  const detailCardBg = dk ? 'bg-[#0a1220] border-white/[0.05]' : 'bg-white border-slate-200/80 shadow-sm';

  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${containerBg} ${isOpen ? activeBorder : inactiveBorder}`}>
      <button
        onClick={onToggle}
        className={`w-full h-full flex items-center gap-5 p-5 text-left transition-colors ${
          dk ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-100/50'
        }`}
      >
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${statusColor}18` }}
        >
          <Icon size={18} style={{ color: statusColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold tracking-tight leading-none mb-1 ${textTitle}`}>
            {report.patientName || report.patient_id}
          </p>
          <p className={`text-[10px] uppercase tracking-tighter ${textSub}`}>{report.organ_type} REFERRAL SUPPORT</p>
        </div>

        <span 
          className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
          style={{ 
            backgroundColor: `${statusColor}18`, 
            color: statusColor,
            borderColor: `${statusColor}30`
          }}
        >
          {riskLevel === 'HIGH' ? 'REFER' : riskLevel === 'MODERATE' ? 'REVIEW' : 'FOLLOW-UP'}
        </span>

        <div className={`text-[10px] font-medium flex items-center gap-1.5 ml-4 ${textSub}`}>
          <Clock size={12} />
          {formattedDate}
        </div>

        <ChevronDown 
          size={16} 
          className={`ml-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${textSub}`} 
        />
      </button>

      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden ${detailPanelBg}`}>
        <div className="p-6 pt-0 ml-[60px] flex flex-col gap-6">
          <div className="flex gap-4 flex-wrap">
            <div className={`${detailCardBg} rounded-xl p-4 min-w-[140px]`}>
              <p className={`text-[9px] uppercase tracking-widest font-bold mb-2 ${textSub}`}>Support Confidence</p>
              <p className="text-xl font-bold tracking-tight text-sky-400">{(report.ai_confidence * 100).toFixed(2)}%</p>
            </div>
            <div className={`${detailCardBg} rounded-xl p-4 min-w-[140px]`}>
              <p className={`text-[9px] uppercase tracking-widest font-bold mb-2 ${textSub}`}>Localization</p>
              <p className={`text-sm font-mono ${textBody}`}>
                X: {Number(report.localization_coords?.x ?? 0).toFixed(2)}, Y: {Number(report.localization_coords?.y ?? 0).toFixed(2)}
              </p>
            </div>
            <div className={`${detailCardBg} rounded-xl p-4 min-w-[140px]`}>
              <p className={`text-[9px] uppercase tracking-widest font-bold mb-2 ${textSub}`}>Risk</p>
              <p className="text-xl font-bold tracking-tight" style={{ color: statusColor }}>{riskLevel}</p>
            </div>
            <div className={`${detailCardBg} rounded-xl p-4 min-w-[160px]`}>
              <p className={`text-[9px] uppercase tracking-widest font-bold mb-2 ${textSub}`}>Signal Quality</p>
              <p className={`text-sm font-bold ${textBody}`}>{quality.status || 'N/A'} {quality.score != null ? `· ${quality.score}/100` : ''}</p>
            </div>
            {report.notes && (
              <div className={`${detailCardBg} rounded-xl p-4 flex-1`}>
                <p className={`text-[9px] uppercase tracking-widest font-bold mb-2 ${textSub}`}>Physician Notes</p>
                <p className={`text-xs italic ${textBody}`}>"{report.notes}"</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 border ${
                dk
                  ? 'bg-[#4FD1C5]/10 border-[#4FD1C5]/30 text-[#4FD1C5] hover:bg-[#4FD1C5]/20'
                  : 'bg-[#0d9488]/5 border-[#0d9488]/20 text-[#0d9488] hover:bg-[#0d9488]/10'
              }`}
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
