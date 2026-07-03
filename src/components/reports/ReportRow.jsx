import React, { useState, useEffect } from 'react';
import { Heart, Clock, ChevronDown, Download, Loader2, FileText } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { diagnosticService } from '../../services/diagnosticService';
import { modelApi } from '../../services/modelApi';

const REPORT_TEXT = {
  th: {
    ecgReview: 'ทบทวนผลคัดกรอง ECG',
    referralSupport: 'รายงานประกอบการส่งต่อ',
    ecgConfidence: 'ความมั่นใจ ECG',
    supportConfidence: 'ความมั่นใจระบบช่วยตัดสินใจ',
    leadSystem: 'Lead system',
    localization: 'ตำแหน่ง 3D',
    primaryFinding: 'ผลหลักที่ระบบสรุป',
    risk: 'ความเสี่ยง',
    digitizationQuality: 'คุณภาพการอ่านภาพ',
    signalQuality: 'คุณภาพสัญญาณ',
    leadRecovery: 'Lead ที่อ่านได้',
    recovered: 'อ่านได้',
    missing: 'ขาด',
    clinicalUseStatus: 'สถานะใช้ทางคลินิก',
    review: 'การทบทวน',
    by: 'โดย',
    physicianNotes: 'บันทึกแพทย์',
    attachments: 'เอกสารแนบ',
    signOff: 'ลงนามทบทวนโดยแพทย์',
    notesPlaceholder: 'สรุปความเห็นแพทย์ เหตุผลส่งต่อ/ตรวจซ้ำ หรือคำแนะนำเพิ่มเติม',
    accept: 'ยอมรับผลคัดกรอง',
    approve: 'อนุมัติ',
    refer: 'ส่งต่อหัวใจ',
    markReferred: 'ระบุว่าส่งต่อ',
    repeat: 'ตรวจ ECG ซ้ำ',
    retake: 'ต้องตรวจซ้ำ',
    reject: 'ปฏิเสธ: อ่านไม่ได้',
    rejectShort: 'ปฏิเสธ',
    exportPdf: 'ส่งออก PDF',
    downloadFailed: 'ดาวน์โหลด PDF ไม่สำเร็จ',
    reviewFailed: 'บันทึกการทบทวนไม่สำเร็จ',
    cannotAccept: 'ยอมรับไม่ได้',
    referBadge: 'ส่งต่อ',
    reviewBadge: 'ทบทวน',
    followUpBadge: 'ติดตาม',
  },
  en: {
    ecgReview: 'ECG Screening Review',
    referralSupport: 'Referral Support',
    ecgConfidence: 'ECG Confidence',
    supportConfidence: 'Support Confidence',
    leadSystem: 'Lead System',
    localization: 'Localization',
    primaryFinding: 'Primary Finding',
    risk: 'Risk',
    digitizationQuality: 'Digitization Quality',
    signalQuality: 'Signal Quality',
    leadRecovery: 'Lead Recovery',
    recovered: 'recovered',
    missing: 'Missing',
    clinicalUseStatus: 'Clinical Use Status',
    review: 'Review',
    by: 'by',
    physicianNotes: 'Physician Notes',
    attachments: 'Attachments',
    signOff: 'Clinician Sign-Off',
    notesPlaceholder: 'Clinician summary, referral rationale, repeat reason, or additional instructions',
    accept: 'Accept Screening',
    approve: 'Approve',
    refer: 'Refer Cardiology',
    markReferred: 'Mark Referred',
    repeat: 'Repeat ECG',
    retake: 'Needs Retake',
    reject: 'Reject Unreadable',
    rejectShort: 'Reject',
    exportPdf: 'Export Professional PDF',
    downloadFailed: 'Failed to download PDF',
    reviewFailed: 'Failed to review report',
    cannotAccept: 'Cannot accept',
    referBadge: 'REFER',
    reviewBadge: 'REVIEW',
    followUpBadge: 'FOLLOW-UP',
  },
};

export const ReportRow = ({ report, isOpen, onToggle, currentUser, onReviewed }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const { isDarkMode: dk } = useTheme();
  const { language } = useLanguage();
  const locale = language === 'th' ? 'th-TH' : 'en-US';
  const text = REPORT_TEXT[language === 'th' ? 'th' : 'en'];

  useEffect(() => {
    if (isOpen && report.id) {
      setLoadingAttachments(true);
      modelApi.getReportAttachments(report.id)
        .then((data) => setAttachments(data || []))
        .catch((err) => console.error("Failed to load attachments:", err))
        .finally(() => setLoadingAttachments(false));
    }
  }, [isOpen, report.id]);

  // Map database organ_type to icons
  const Icon = Heart;
  const ecgResult = report.physics_params?.ecg_result || null;
  const isEcgReport = !!ecgResult;
  const referral = report.physics_params?.referral_support || {};
  const quality = isEcgReport
    ? (ecgResult.digitization_report?.quality || ecgResult.signal_quality || {})
    : (referral.signal_quality || {});
  const review = isEcgReport
    ? (ecgResult.review || {
        status: ecgResult.review_status,
        decision: ecgResult.review_decision,
        reviewed_by: ecgResult.reviewed_by,
        reviewed_at: ecgResult.reviewed_at,
        clinician_notes: ecgResult.review_notes,
      })
    : (referral.review || {});
  const canReview = ['doctor', 'admin'].includes(currentUser?.role);
  const clinicalUse = ecgResult?.clinical_use_status || {};
  const clinicalUseStatus = clinicalUse.status || 'eligible_for_review';
  const acceptDisabled = isReviewing || (isEcgReport && clinicalUseStatus !== 'eligible_for_review');
  const primaryFinding = ecgResult?.findings?.primary || {};
  const riskLevel = isEcgReport
    ? (primaryFinding.severity === 'urgent' ? 'HIGH' : ['abnormal', 'review'].includes(primaryFinding.severity) ? 'MODERATE' : 'LOW')
    : (referral.risk_level || 'REVIEW');
  const confidenceValue = Number.isFinite(Number(report.ai_confidence)) ? Number(report.ai_confidence) : null;
  const statusColor = riskLevel === 'HIGH'
    ? '#ef4444'
    : riskLevel === 'MODERATE'
    ? '#f59e0b'
    : confidenceValue !== null && confidenceValue > 0.9
    ? '#10b981'
    : '#fbbf24';

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      setIsDownloading(true);
      await diagnosticService.downloadReportPDF(report.id, locale);
    } catch (err) {
      alert(text.downloadFailed);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReview = async (status, decision) => {
    try {
      setIsReviewing(true);
      await diagnosticService.reviewReport(report.id, {
        status,
        review_decision: decision,
        clinician_notes: reviewNotes || decision,
        repeat_reason: status === 'NEEDS_RETAKE' ? (reviewNotes || decision) : null,
        referral_destination: isEcgReport
          ? (ecgResult.referral_destination || (status === 'REFERRED' ? 'Cardiology' : null))
          : referral.referral_destination,
      });
      if (onReviewed) await onReviewed();
    } catch (err) {
      alert(err.message || text.reviewFailed);
    } finally {
      setIsReviewing(false);
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
          <p className={`text-[10px] uppercase tracking-tighter ${textSub}`}>
            {isEcgReport ? text.ecgReview : `${report.organ_type} ${text.referralSupport}`}
          </p>
        </div>

        <span 
          className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
          style={{ 
            backgroundColor: `${statusColor}18`, 
            color: statusColor,
            borderColor: `${statusColor}30`
          }}
        >
          {riskLevel === 'HIGH' ? text.referBadge : riskLevel === 'MODERATE' ? text.reviewBadge : text.followUpBadge}
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

      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden ${detailPanelBg}`}>
        <div className="p-6 pt-0 ml-[60px] flex flex-col gap-6">
          <div className="flex gap-4 flex-wrap">
            <div className={`${detailCardBg} rounded-xl p-4 min-w-[140px]`}>
              <p className={`text-[9px] uppercase tracking-widest font-bold mb-2 ${textSub}`}>
                {isEcgReport ? text.ecgConfidence : text.supportConfidence}
              </p>
              <p className="text-xl font-bold tracking-tight text-sky-400">
                {confidenceValue !== null ? `${(confidenceValue * 100).toFixed(2)}%` : 'Screening'}
              </p>
            </div>
            <div className={`${detailCardBg} rounded-xl p-4 min-w-[140px]`}>
              <p className={`text-[9px] uppercase tracking-widest font-bold mb-2 ${textSub}`}>
                {isEcgReport ? text.leadSystem : text.localization}
              </p>
              {isEcgReport ? (
                <p className={`text-sm font-bold ${textBody}`}>{ecgResult.lead_system || 'N/A'}</p>
              ) : (
                <p className={`text-sm font-mono ${textBody}`}>
                  X: {Number(report.localization_coords?.x ?? 0).toFixed(2)}, Y: {Number(report.localization_coords?.y ?? 0).toFixed(2)}
                </p>
              )}
            </div>
            <div className={`${detailCardBg} rounded-xl p-4 min-w-[140px]`}>
              <p className={`text-[9px] uppercase tracking-widest font-bold mb-2 ${textSub}`}>
                {isEcgReport ? text.primaryFinding : text.risk}
              </p>
              <p className="text-xl font-bold tracking-tight" style={{ color: statusColor }}>
                {isEcgReport ? (primaryFinding.label || riskLevel) : riskLevel}
              </p>
            </div>
            <div className={`${detailCardBg} rounded-xl p-4 min-w-[160px]`}>
              <p className={`text-[9px] uppercase tracking-widest font-bold mb-2 ${textSub}`}>
                {isEcgReport ? text.digitizationQuality : text.signalQuality}
              </p>
              <p className={`text-sm font-bold ${textBody}`}>{quality.status || 'N/A'} {quality.score != null ? `· ${quality.score}/100` : ''}</p>
            </div>
            {isEcgReport && (
              <div className={`${detailCardBg} rounded-xl p-4 min-w-[180px]`}>
                <p className={`text-[9px] uppercase tracking-widest font-bold mb-2 ${textSub}`}>{text.leadRecovery}</p>
                <p className={`text-sm font-bold ${textBody}`}>
                  {quality.standard_leads_recovered ?? (ecgResult.lead_names || []).length}/12 {text.recovered}
                </p>
                {(quality.missing_leads || []).length > 0 && (
                  <p className={`mt-1 text-[10px] ${textSub}`}>{text.missing}: {quality.missing_leads.join(', ')}</p>
                )}
              </div>
            )}
            {isEcgReport && (
              <div className={`${detailCardBg} rounded-xl p-4 min-w-[220px] flex-1`}>
                <p className={`text-[9px] uppercase tracking-widest font-bold mb-2 ${textSub}`}>{text.clinicalUseStatus}</p>
                <p className={`text-sm font-bold ${
                  clinicalUseStatus === 'eligible_for_review'
                    ? 'text-emerald-400'
                    : clinicalUseStatus === 'not_supported' ? 'text-rose-400' : 'text-amber-400'
                }`}>{clinicalUseStatus}</p>
                {(clinicalUse.reasons || []).length > 0 && (
                  <p className={`mt-1 text-[10px] ${textSub}`}>{clinicalUse.reasons.join(', ')}</p>
                )}
              </div>
            )}
            <div className={`${detailCardBg} rounded-xl p-4 min-w-[180px]`}>
              <p className={`text-[9px] uppercase tracking-widest font-bold mb-2 ${textSub}`}>{text.review}</p>
              <p className={`text-sm font-bold ${textBody}`}>{review.status || report.status || 'PENDING_REVIEW'}</p>
              {review.reviewed_by && <p className={`text-[10px] mt-1 ${textSub}`}>{text.by} {review.reviewed_by}</p>}
            </div>
            {report.notes && (
              <div className={`${detailCardBg} rounded-xl p-4 flex-1`}>
                <p className={`text-[9px] uppercase tracking-widest font-bold mb-2 ${textSub}`}>{text.physicianNotes}</p>
                <p className={`text-xs italic ${textBody}`}>"{report.notes}"</p>
              </div>
            )}
            {attachments.length > 0 && (
              <div className={`${detailCardBg} rounded-xl p-4 min-w-[240px] flex-1`}>
                <p className={`text-[9px] uppercase tracking-widest font-bold mb-2 ${textSub}`}>{text.attachments}</p>
                <div className="flex flex-col gap-2">
                  {attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1.5 text-xs font-semibold hover:underline ${
                        dk ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-700'
                      }`}
                      title={`ขนาด ${(att.file_size / 1024).toFixed(1)} KB`}
                    >
                      <FileText size={12} />
                      <span className="truncate max-w-[200px]">{att.file_name}</span>
                      <span className="text-[9px] font-normal opacity-60">({(att.file_size / 1024).toFixed(1)} KB)</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {canReview && (
            <div className={`${detailCardBg} rounded-xl p-4`}>
              <p className={`text-[9px] uppercase tracking-widest font-bold mb-2 ${textSub}`}>{text.signOff}</p>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={2}
                className={`w-full rounded-lg border px-3 py-2 text-xs resize-none mb-3 ${
                  dk ? 'bg-white/[0.03] border-white/[0.08] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
                placeholder={text.notesPlaceholder}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleReview('APPROVED', isEcgReport ? 'Accept screening' : 'Reviewed and approved for clinical follow-up')}
                  disabled={acceptDisabled}
                  title={acceptDisabled && isEcgReport ? `${text.cannotAccept}: ${clinicalUseStatus}` : undefined}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold disabled:opacity-50"
                >
                  {isEcgReport ? text.accept : text.approve}
                </button>
                <button
                  onClick={() => handleReview('REFERRED', isEcgReport ? 'Refer cardiology' : 'Referral recommended')}
                  disabled={isReviewing}
                  className="rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 text-xs font-bold disabled:opacity-50"
                >
                  {isEcgReport ? text.refer : text.markReferred}
                </button>
                <button
                  onClick={() => handleReview('NEEDS_RETAKE', isEcgReport ? 'Repeat ECG' : 'ECG retake required before review')}
                  disabled={isReviewing}
                  className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 text-xs font-bold disabled:opacity-50"
                >
                  {isEcgReport ? text.repeat : text.retake}
                </button>
                <button
                  onClick={() => handleReview('REJECTED', isEcgReport ? 'Reject unreadable' : 'Not appropriate for referral based on review')}
                  disabled={isReviewing}
                  className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 text-xs font-bold disabled:opacity-50"
                >
                  {isEcgReport ? text.reject : text.rejectShort}
                </button>
              </div>
            </div>
          )}
          
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
              {text.exportPdf}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
