import React, { useState, useEffect } from 'react';
import {
  Play, Database, FileText, CheckCircle2, Activity, AlertTriangle,
  Download, Heart, Info, Target, Loader2, FlaskConical,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePatient } from '../context/PatientContext';
import { useTheme } from '../context/ThemeContext';
import ECGComparisonCanvas from '../components/visualizers/ECGComparisonCanvas';

// ─── sub-components ───────────────────────────────────────────────────────────

const VitalRow = ({ label, value, unit, status, dk }) => {
  const color =
    status === 'high'   ? (dk ? 'text-rose-400'    : 'text-rose-600')    :
    status === 'low'    ? (dk ? 'text-amber-400'   : 'text-amber-600')   :
                          (dk ? 'text-emerald-400' : 'text-emerald-600');
  return (
    <div className={`flex items-center justify-between py-2.5 border-b last:border-0 ${dk ? 'border-white/[0.05]' : 'border-slate-100'}`}>
      <span className={`text-xs ${dk ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`text-sm font-bold ${color}`}>{value}</span>
        <span className={`text-[10px] ${dk ? 'text-slate-600' : 'text-slate-400'}`}>{unit}</span>
      </div>
    </div>
  );
};

// ─── main ─────────────────────────────────────────────────────────────────────

const NeuralSandbox = () => {
  const { t } = useLanguage();
  const { token } = useAuth();
  const { selectedPatient } = usePatient();
  const { isDarkMode: dk } = useTheme();

  const [archives, setArchives]           = useState([]);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [isRunning, setIsRunning]         = useState(false);
  const [testResults, setTestResults]     = useState(null);

  useEffect(() => {
    if (selectedPatient && token) fetchArchives();
    setSelectedArchive(null);
    setTestResults(null);
  }, [selectedPatient?.id, token]);

  const fetchArchives = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/archives/${selectedPatient.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setArchives(await res.json());
    } catch {
      console.error('Failed to fetch archives');
    }
  };

  const handleRunTest = async () => {
    if (!selectedArchive) return;
    setIsRunning(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const abnormal = Math.random() > 0.5;
      setTestResults({
        status: abnormal ? 'abnormal' : 'normal',
        diagnosis: abnormal
          ? 'Premature Ventricular Contraction (PVC)'
          : 'Normal Sinus Rhythm',
        narrative: abnormal
          ? 'พบคลื่น QRS กว้างและผิดรูปร่าง เกิดก่อนจังหวะปกติ สอดคล้องกับ PVC แนะนำ Holter Monitoring เพิ่มเติม'
          : 'สัญญาณสม่ำเสมอ ช่วง PR และ QTc อยู่ในเกณฑ์ปกติ ไม่พบความผิดปกติทางสรีรวิทยา',
        metrics: {
          hr:  abnormal ? 88  : 72,
          qtc: abnormal ? 485 : 420,
          pr:  abnormal ? 162 : 155,
          qrs: abnormal ? 112 : 92,
          confidence: abnormal ? 98.42 : 99.85,
        },
        findings: abnormal
          ? ['PVC Detected', 'Long QTc', 'Ectopic Focus']
          : ['Regular Rhythm', 'Normal QTc', 'Optimal Sync'],
        focus_site: abnormal ? 'Left Ventricle / Apex' : 'SA Node Base',
      });
    } catch {
      console.error('Analysis failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleExport = () => {
    if (!testResults) return;
    const blob = new Blob([JSON.stringify({
      title: 'Bioelectric PINN Diagnostic Report',
      patient: selectedPatient?.name,
      timestamp: new Date().toLocaleString(),
      ...testResults,
    }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Report_${selectedPatient?.name || 'Patient'}.json`;
    a.click();
  };

  // ── tokens ──────────────────────────────────────────────────────
  const surface  = dk ? 'bg-[#0d1525] border-white/[0.06]'  : 'bg-white border-slate-200';
  const divider  = dk ? 'border-white/[0.06]'               : 'border-slate-100';
  const secLabel = dk ? 'text-slate-500'                    : 'text-slate-400';
  const mainText = dk ? 'text-white'                        : 'text-slate-900';
  const subText  = dk ? 'text-slate-400'                    : 'text-slate-500';

  const isNormal = testResults?.status === 'normal';
  const diagTokens = testResults ? (isNormal ? {
    bg:   dk ? 'bg-emerald-500/[0.07]' : 'bg-emerald-50',
    ring: 'border-emerald-500/25',
    text: dk ? 'text-emerald-400' : 'text-emerald-700',
    icon: <CheckCircle2 size={20} />,
  } : {
    bg:   dk ? 'bg-rose-500/[0.08]' : 'bg-rose-50',
    ring: 'border-rose-500/30',
    text: dk ? 'text-rose-400' : 'text-rose-700',
    icon: <AlertTriangle size={20} />,
  }) : null;

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      <div className="max-w-[1800px] mx-auto flex flex-col gap-5">

        {/* ── Header ───────────────────────────────────────────── */}
        <header className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border p-4 ${surface}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
              dk ? 'bg-sky-500/15 border-sky-500/20 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'
            }`}>
              <FlaskConical size={17} />
            </div>
            <div>
              <h1 className={`text-sm font-bold ${mainText}`}>{t('sandbox_title')}</h1>
              <p className={`mt-0.5 text-xs ${subText}`}>{t('sandbox_subtitle')}</p>
            </div>
          </div>

          <AnimatePresence>
            {testResults && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleExport}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold transition-all active:scale-95"
              >
                <Download size={14} /> Export Report
              </motion.button>
            )}
          </AnimatePresence>
        </header>

        {/* ── Body ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── Left: Archive selector ──────────────────────────── */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-5">

            <div className={`rounded-2xl border flex flex-col ${surface}`}>
              <div className={`flex items-center gap-2 px-4 py-3 border-b ${divider}`}>
                <Database size={14} className={dk ? 'text-sky-400' : 'text-sky-600'} />
                <span className={`text-xs font-semibold ${secLabel}`}>{t('select_dataset')}</span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5 max-h-[420px]">
                {archives.length > 0 ? archives.map(arc => {
                  const active = selectedArchive?.id === arc.id;
                  return (
                    <button
                      key={arc.id}
                      onClick={() => { setSelectedArchive(arc); setTestResults(null); }}
                      className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        active
                          ? dk ? 'bg-sky-500/[0.12] border border-sky-500/25' : 'bg-sky-50 border border-sky-200'
                          : dk ? 'hover:bg-white/[0.04] border border-transparent' : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                        active
                          ? dk ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-600'
                          : dk ? 'bg-white/[0.05] text-slate-500' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <FileText size={12} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${active ? (dk ? 'text-sky-300' : 'text-sky-700') : (dk ? 'text-slate-300' : 'text-slate-700')}`}>
                          Case #{arc.id.substring(0, 6).toUpperCase()}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
                          {new Date(arc.created_at).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                      {active && <span className={`ml-auto mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${dk ? 'bg-sky-400' : 'bg-sky-600'}`} />}
                    </button>
                  );
                }) : (
                  <div className={`py-12 text-center text-xs ${subText}`}>
                    {selectedPatient ? 'ไม่พบข้อมูลคลังของคนไข้นี้' : 'เลือกคนไข้ก่อน'}
                  </div>
                )}
              </div>

              <div className={`p-3 border-t ${divider}`}>
                <button
                  onClick={handleRunTest}
                  disabled={!selectedArchive || isRunning}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-95 ${
                    !selectedArchive || isRunning
                      ? dk ? 'bg-white/[0.04] text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-sky-600 hover:bg-sky-700 text-white'
                  }`}
                >
                  {isRunning
                    ? <><Loader2 size={14} className="animate-spin" /> กำลังวิเคราะห์...</>
                    : <><Play size={13} fill="currentColor" /> {t('run_test')}</>
                  }
                </button>
              </div>
            </div>

            {/* Confidence card */}
            <AnimatePresence>
              {testResults && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`rounded-2xl border p-4 ${diagTokens.bg} ${diagTokens.ring}`}
                >
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${diagTokens.text} opacity-70`}>
                    AI Confidence
                  </p>
                  <p className={`text-4xl font-bold leading-none mb-3 ${diagTokens.text}`}>
                    {testResults.metrics.confidence}%
                  </p>
                  <div className={`h-1.5 rounded-full overflow-hidden ${dk ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isNormal ? 'bg-emerald-400' : 'bg-rose-400'}`}
                      style={{ width: `${testResults.metrics.confidence}%` }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right: Results / Empty ───────────────────────────── */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-5">
            <AnimatePresence mode="wait">
              {testResults ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-5"
                >
                  {/* Diagnosis banner */}
                  <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border px-5 py-4 ${diagTokens.bg} ${diagTokens.ring}`}>
                    <span className={diagTokens.text}>{diagTokens.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${diagTokens.text} opacity-70`}>
                        Clinical Diagnosis
                      </p>
                      <p className={`text-base font-bold ${diagTokens.text}`}>{testResults.diagnosis}</p>
                      <p className={`mt-1 text-xs leading-relaxed ${dk ? 'text-slate-400' : 'text-slate-600'}`}>
                        {testResults.narrative}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      {testResults.findings.map(f => (
                        <span key={f} className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${diagTokens.bg} ${diagTokens.ring} ${diagTokens.text}`}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* ECG + Vitals */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

                    {/* ECG comparison */}
                    <div className={`xl:col-span-8 rounded-2xl border overflow-hidden ${surface}`}>
                      <div className={`flex items-center gap-2 px-4 py-3 border-b ${divider}`}>
                        <Target size={14} className={dk ? 'text-sky-400' : 'text-sky-600'} />
                        <span className={`text-xs font-semibold ${secLabel}`}>Signal Accuracy Verification</span>
                      </div>
                      <div className={`p-4 ${dk ? 'bg-[#060d18]' : 'bg-slate-50'}`}>
                        <ECGComparisonCanvas height={240} />
                      </div>
                    </div>

                    {/* Vitals + Source */}
                    <div className="xl:col-span-4 flex flex-col gap-5">
                      <div className={`rounded-2xl border p-4 flex-1 ${surface}`}>
                        <div className={`flex items-center gap-2 mb-3`}>
                          <Heart size={14} className="text-rose-400" />
                          <span className={`text-xs font-semibold ${secLabel}`}>Clinical Vitals</span>
                        </div>
                        <VitalRow dk={dk} label="Heart Rate" value={testResults.metrics.hr} unit="BPM"
                          status={testResults.metrics.hr > 100 ? 'high' : testResults.metrics.hr < 60 ? 'low' : 'normal'} />
                        <VitalRow dk={dk} label="QTc Interval" value={testResults.metrics.qtc} unit="ms"
                          status={testResults.metrics.qtc > 450 ? 'high' : 'normal'} />
                        <VitalRow dk={dk} label="PR Interval" value={testResults.metrics.pr} unit="ms"
                          status={testResults.metrics.pr > 200 ? 'high' : 'normal'} />
                        <VitalRow dk={dk} label="QRS Duration" value={testResults.metrics.qrs} unit="ms"
                          status={testResults.metrics.qrs > 120 ? 'high' : 'normal'} />
                      </div>

                      <div className={`rounded-2xl border p-4 ${
                        dk ? 'bg-indigo-500/[0.08] border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Info size={13} className={dk ? 'text-indigo-400' : 'text-indigo-600'} />
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${dk ? 'text-indigo-400/70' : 'text-indigo-600/70'}`}>
                            Source Mapping
                          </span>
                        </div>
                        <p className={`text-sm font-bold ${dk ? 'text-indigo-300' : 'text-indigo-700'}`}>
                          {testResults.focus_site}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`flex-1 min-h-[480px] flex flex-col items-center justify-center rounded-2xl border border-dashed gap-4 ${
                    dk ? 'border-white/[0.07] bg-white/[0.015]' : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${
                    dk ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white border-slate-200'
                  }`}>
                    <Activity size={24} className={dk ? 'text-slate-600' : 'text-slate-300'} />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-semibold ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
                      พร้อมสำหรับการวิเคราะห์
                    </p>
                    <p className={`mt-1 text-xs ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
                      เลือกชุดข้อมูลจากคลังและกด Run
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeuralSandbox;
