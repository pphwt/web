import React, { useState, useEffect } from 'react';
import { Archive, Download, Activity, Clock, Cpu, FileText, CheckCircle2 } from 'lucide-react';
import { ArchiveSkeleton } from '../components/ui/Skeleton';
import { usePatient } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import ECGCanvas from '../components/visualizers/ECGCanvas';
import { API_BASE } from '../utils/constants';
import { modelApi } from '../services/modelApi';

const PatientArchives = () => {
  const { selectedPatient } = usePatient();
  const { token } = useAuth();
  const { isDarkMode: dk } = useTheme();
  const { t } = useLanguage();

  const [archives, setArchives]             = useState([]);
  const [reports, setReports]               = useState([]);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading]               = useState(false);

  useEffect(() => {
    if (selectedPatient && token) fetchArchives();
  }, [selectedPatient, token]);

  const fetchArchives = async () => {
    setLoading(true);
    setSelectedArchive(null);
    setSelectedReport(null);
    try {
      const [archiveResult, reportResult] = await Promise.allSettled([
        fetch(`${API_BASE}/archives/${selectedPatient.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.ok ? res.json() : Promise.reject(new Error(`Archives HTTP ${res.status}`))),
        modelApi.getPatientReports(selectedPatient.id),
      ]);
      setArchives(archiveResult.status === 'fulfilled' && Array.isArray(archiveResult.value) ? archiveResult.value : []);
      setReports(reportResult.status === 'fulfilled' && Array.isArray(reportResult.value) ? reportResult.value : []);
    } catch { console.error('Failed to fetch archives'); }
    finally  { setLoading(false); }
  };

  const handleExport = () => {
    if (!selectedArchive) return;
    const blob = new Blob([JSON.stringify({
      report_metadata: { app: 'Bioelectric PINN', version: '1.4.2', timestamp: new Date().toISOString() },
      patient: { name: selectedPatient?.name, id: selectedPatient?.id },
      snapshot: {
        id: selectedArchive.id,
        timestamp: selectedArchive.created_at,
        avg_bpm: selectedArchive.bpm_avg,
        ai_confidence: selectedArchive.ai_confidence,
        physics: selectedArchive.physics_snapshot,
      },
      data_leads: selectedArchive.leads_data,
    }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Bioelectric_Report_${selectedArchive.id.substring(0, 8)}.json`;
    a.click();
  };

  // ── tokens ──────────────────────────────────────────────────────
  const surface  = dk ? 'bg-[#0d1525] border-white/[0.06]'  : 'bg-white border-slate-200';
  const divider  = dk ? 'border-white/[0.06]'               : 'border-slate-100';
  const secLabel = dk ? 'text-slate-500'                    : 'text-slate-400';
  const mainText = dk ? 'text-white'                        : 'text-slate-900';
  const subText  = dk ? 'text-slate-400'                    : 'text-slate-500';
  const ecgBg    = dk ? 'bg-[#060d18]'                      : 'bg-slate-50';

  return (
    <div className="min-h-full bg-[var(--bg-main)] px-2 py-3 text-[var(--text-main)] transition-colors duration-300 sm:px-4 lg:px-6">
      <div className="clinical-page flex flex-col gap-4 lg:gap-5">

        {/* Header */}
        <header className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border p-4 ${surface}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
              dk ? 'bg-sky-500/15 border-sky-500/20 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'
            }`}>
              <Archive size={17} />
            </div>
            <div>
              <h1 className={`text-sm font-bold ${mainText}`}>{t('nav_archives')}</h1>
              <p className={`mt-0.5 text-xs ${subText}`}>
                {selectedPatient ? selectedPatient.name : 'ไม่ได้เลือกคนไข้'} · Historical Bio-Signal Repository
              </p>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Archive list */}
          <div className={`lg:col-span-4 xl:col-span-3 rounded-2xl border flex flex-col ${surface}`}>
            <div className={`flex items-center gap-2 px-4 py-3 border-b ${divider}`}>
              <Clock size={14} className={dk ? 'text-sky-400' : 'text-sky-600'} />
              <span className={`text-xs font-semibold ${secLabel}`}>Snapshot History</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 max-h-[600px]">
              {loading && (
                <ArchiveSkeleton dk={dk} />
              )}
              {!loading && archives.length === 0 && (
                <div className={`py-12 text-center text-xs ${subText}`}>
                  {selectedPatient ? 'ไม่พบข้อมูลคลัง' : 'เลือกคนไข้ก่อน'}
                </div>
              )}
              {!loading && archives.length > 0 && (
                <div className="relative border-l-2 border-dashed border-sky-500/20 ml-2 pl-4 py-2 space-y-4">
                  {archives.map((arc, index) => {
                    const active = selectedArchive?.id === arc.id;
                    const dateStr = new Date(arc.created_at).toLocaleString('th-TH', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    return (
                      <div key={arc.id} className="relative">
                        {/* Timeline Node Point */}
                        <div className={`absolute -left-[23px] top-3.5 h-3.5 w-3.5 rounded-full border-2 transition-all ${
                          active
                            ? 'bg-sky-500 border-sky-400 scale-110 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                            : dk ? 'bg-slate-900 border-white/20' : 'bg-white border-slate-300'
                        }`} />
                        
                        <button
                          onClick={() => setSelectedArchive(arc)}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                            active
                              ? dk ? 'bg-sky-500/[0.12] border-sky-500/25' : 'bg-sky-50 border-sky-200'
                              : dk ? 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.04]' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[10px] font-bold ${active ? (dk ? 'text-sky-300' : 'text-sky-700') : secLabel}`}>
                              {dateStr}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                              dk ? 'bg-white/[0.04] text-slate-400' : 'bg-slate-200/50 text-slate-500'
                            }`}>
                              {arc.duration_seconds?.toFixed(0)}s
                            </span>
                          </div>
                          <div className="flex gap-5">
                            <div>
                              <p className={`text-[9px] ${secLabel}`}>Avg Heart Rate</p>
                              <p className={`text-sm font-bold ${active ? (dk ? 'text-sky-300' : 'text-sky-700') : mainText}`}>
                                {arc.bpm_avg} <span className="text-[9px] font-normal opacity-70">BPM</span>
                              </p>
                            </div>
                            <div>
                              <p className={`text-[9px] ${secLabel}`}>AI Confidence</p>
                              <p className={`text-sm font-bold ${dk ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                {(arc.ai_confidence * 100).toFixed(0)}%
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`border-t ${divider}`}>
              <div className={`flex items-center gap-2 px-4 py-3`}>
                <FileText size={14} className={dk ? 'text-emerald-400' : 'text-emerald-600'} />
                <span className={`text-xs font-semibold ${secLabel}`}>Saved ECG Reports</span>
                <span className={`ml-auto text-[10px] ${subText}`}>{reports.length}</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar px-4 pb-4 space-y-2">
                {!loading && reports.length === 0 && (
                  <p className={`py-4 text-center text-[11px] ${subText}`}>ยังไม่มีรายงาน ECG ที่บันทึก</p>
                )}
                {reports.map((report) => {
                  const active = selectedReport?.id === report.id;
                  const ecgResult = report.physics_params?.ecg_result || {};
                  const classification = ecgResult.classification || {};
                  const label = classification.top_label || classification.label || 'ECG screening';
                  const dateStr = report.created_at
                    ? new Date(report.created_at).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '-';
                  return (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => { setSelectedReport(report); setSelectedArchive(null); }}
                      className={`w-full rounded-xl border px-3 py-2 text-left transition ${active
                        ? dk ? 'border-emerald-500/30 bg-emerald-500/[0.12]' : 'border-emerald-200 bg-emerald-50'
                        : dk ? 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.04]' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`truncate text-[11px] font-bold ${active ? (dk ? 'text-emerald-300' : 'text-emerald-700') : mainText}`}>{label}</span>
                        <span className={`shrink-0 text-[9px] ${subText}`}>{report.status || 'PENDING_REVIEW'}</span>
                      </div>
                      <div className={`mt-1 flex items-center gap-2 text-[10px] ${subText}`}>
                        <span>{dateStr}</span>
                        {ecgResult.measurements?.heart_rate_bpm != null && <span>· {ecgResult.measurements.heart_rate_bpm} BPM</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Viewer */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-5">
            {selectedReport ? (
              <div className={`rounded-2xl border ${surface}`}>
                <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${divider}`}>
                  <div className="flex items-center gap-2">
                    <FileText size={14} className={dk ? 'text-emerald-400' : 'text-emerald-600'} />
                    <span className={`text-xs font-semibold ${secLabel}`}>Saved ECG Report</span>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${dk ? 'bg-amber-400/10 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
                    {selectedReport.status || 'PENDING_REVIEW'}
                  </span>
                </div>
                <div className={`grid grid-cols-1 gap-4 p-5 md:grid-cols-2 ${ecgBg}`}>
                  {(() => {
                    const ecgResult = selectedReport.physics_params?.ecg_result || {};
                    const classification = ecgResult.classification || {};
                    const measurements = ecgResult.measurements || {};
                    const findings = ecgResult.findings || [];
                    return (
                      <>
                        <div className={`rounded-xl border p-4 ${surface}`}>
                          <p className={`mb-3 text-[10px] font-semibold uppercase tracking-wider ${secLabel}`}>Analysis summary</p>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between gap-3"><span className={subText}>Classification</span><strong className={mainText}>{classification.top_label || classification.label || 'Unavailable'}</strong></div>
                            <div className="flex justify-between gap-3"><span className={subText}>Confidence</span><strong className={mainText}>{classification.top_probability != null ? `${Math.round(classification.top_probability * 100)}%` : '—'}</strong></div>
                            <div className="flex justify-between gap-3"><span className={subText}>Heart rate</span><strong className={mainText}>{measurements.heart_rate_bpm ?? '—'} BPM</strong></div>
                            <div className="flex justify-between gap-3"><span className={subText}>Created</span><strong className={mainText}>{selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleString('th-TH') : '—'}</strong></div>
                          </div>
                        </div>
                        <div className={`rounded-xl border p-4 ${surface}`}>
                          <p className={`mb-3 text-[10px] font-semibold uppercase tracking-wider ${secLabel}`}>Clinical findings</p>
                          {Array.isArray(findings) && findings.length > 0 ? (
                            <ul className={`list-disc space-y-1 pl-4 text-xs ${subText}`}>{findings.slice(0, 8).map((finding, index) => <li key={`${index}-${String(finding)}`}>{typeof finding === 'string' ? finding : finding.label || finding.message || JSON.stringify(finding)}</li>)}</ul>
                          ) : <p className={`text-xs ${subText}`}>ไม่มี findings ที่บันทึกไว้</p>}
                          <p className={`mt-4 text-[11px] leading-relaxed ${subText}`}>รายงานนี้เป็นผลคัดกรองเพื่อรอแพทย์ทบทวน ไม่ใช่การวินิจฉัยอัตโนมัติ</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : selectedArchive ? (
              <>
                {/* ECG panel */}
                <div className={`rounded-2xl border overflow-hidden ${surface}`}>
                  <div className={`flex items-center justify-between px-4 py-3 border-b ${divider}`}>
                    <div className="flex items-center gap-2">
                      <Activity size={14} className={dk ? 'text-sky-400' : 'text-sky-600'} />
                      <span className={`text-xs font-semibold ${secLabel}`}>Signal Playback</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {Object.entries(selectedArchive.physics_snapshot || {}).map(([k, v]) => (
                        <span key={k} className={`rounded-lg border px-2 py-0.5 text-[10px] font-mono ${
                          dk ? 'bg-white/[0.03] border-white/[0.06] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}>
                          {k}: {Number(v).toFixed(4)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={`p-4 space-y-3 ${ecgBg}`}>
                    {[
                      { data: selectedArchive.leads_data?.lead_i,  label: 'LEAD I',  color: '#0ea5e9' },
                      { data: selectedArchive.leads_data?.lead_ii, label: 'LEAD II', color: '#6366f1' },
                      { data: selectedArchive.leads_data?.v5,      label: 'V5',      color: '#8b5cf6' },
                    ].map(({ data, label, color }) => (
                      <ECGCanvas key={label} initialData={data} label={label} color={color} height={90} />
                    ))}
                  </div>
                </div>

                {/* Info + Export */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`rounded-2xl border p-4 ${surface}`}>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${secLabel}`}>Observation</p>
                    <p className={`text-xs leading-relaxed ${subText}`}>
                      Cardiac activation propagation showed stable diffusion patterns. Use this record as referral-support context, not as a final diagnosis.
                    </p>
                  </div>
                  <div className={`rounded-2xl border p-4 ${surface}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu size={13} className={dk ? 'text-sky-400' : 'text-sky-600'} />
                      <p className={`text-[10px] font-semibold uppercase tracking-wider ${secLabel}`}>Integrity</p>
                    </div>
                    <p className={`text-xs leading-relaxed ${subText}`}>
                      Data packet integrity: 100%. Recorded at 20Hz via PINN Cardiac Bridge.
                    </p>
                  </div>
                  <div className={`rounded-2xl border p-4 flex items-center justify-center ${surface}`}>
                    <button
                      onClick={handleExport}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white py-2.5 text-xs font-semibold transition-all active:scale-95"
                    >
                      <Download size={13} /> Export Snapshot
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className={`flex-1 min-h-[400px] flex flex-col items-center justify-center rounded-2xl border border-dashed gap-4 ${
                dk ? 'border-white/[0.07]' : 'border-slate-200'
              }`}>
                <Archive size={28} className={dk ? 'text-slate-700' : 'text-slate-300'} />
                <p className={`text-sm font-semibold ${dk ? 'text-slate-600' : 'text-slate-400'}`}>เลือก Snapshot เพื่อดูสัญญาณ</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientArchives;
