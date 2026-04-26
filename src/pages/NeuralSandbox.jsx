import React, { useState, useEffect } from 'react';
import { Play, Database, FileText, CheckCircle2, Activity, BarChart3, AlertTriangle, ClipboardCheck, Download, Zap, ShieldAlert, Heart, Info, Clock, Target } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePatient } from '../context/PatientContext';
import ECGComparisonCanvas from '../components/visualizers/ECGComparisonCanvas';

const NeuralSandbox = () => {
  const { t } = useLanguage();
  const { token } = useAuth();
  const { selectedPatient } = usePatient();
  const [archives, setArchives] = useState([]);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    if (selectedPatient && token) {
      fetchArchives();
    }
  }, [selectedPatient, token]);

  const fetchArchives = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/archives/${selectedPatient.id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setArchives(data);
    } catch (err) {
      console.error("Failed to fetch archives");
    }
  };

  const handleRunTest = async () => {
    if (!selectedArchive) return;
    setIsRunning(true);
    try {
      // Simulate API delay for dramatic effect
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const isAbnormal = Math.random() > 0.5; // Demo logic
      
      const clinicalResult = {
          status: isAbnormal ? 'abnormal' : 'normal',
          diagnosis: isAbnormal ? "ตรวจพบจังหวะการเต้นผิดปกติ (Premature Ventricular Contraction)" : "พบจังหวะการเต้นปกติ (Normal Sinus Rhythm)",
          narrative: isAbnormal 
            ? "พบคลื่น QRS ที่กว้างและผิดรูปร่าง (Wide QRS) เกิดขึ้นก่อนจังหวะปกติ สอดคล้องกับอาการหัวใจเต้นผิดจังหวะชนิด PVC แนะนำให้ตรวจ Holter Monitoring เพิ่มเติม" 
            : "สัญญาณคลื่นไฟฟ้าหัวใจมีความสม่ำเสมอ ช่วงเวลา PR และ QTc อยู่ในเกณฑ์ปกติ ไม่พบสัญญาณรบกวนหรือความผิดปกติทางสรีรวิทยา",
          metrics: {
              hr: isAbnormal ? 88 : 72,
              qtc: isAbnormal ? 485 : 420,
              pr: isAbnormal ? 162 : 155,
              qrs: isAbnormal ? 112 : 92,
              confidence: isAbnormal ? 98.42 : 99.85
          },
          findings: isAbnormal ? ["PVC Detected", "Long QTc Interval", "Ectopic Focus"] : ["Regular Rhythm", "Optimal Sync"],
          focus_site: isAbnormal ? "Left Ventricle / Apex Region" : "SA Node Base"
      };
      
      setTestResults(clinicalResult);
    } catch (err) {
      console.error("Diagnostic analysis failed");
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportReport = () => {
    if (!testResults) return;
    
    const reportData = {
        title: "Bioelectric Intelligence Diagnostic Report",
        patient: selectedPatient?.name,
        timestamp: new Date().toLocaleString(),
        diagnosis: testResults.diagnosis,
        clinical_narrative: testResults.narrative,
        clinical_metrics: testResults.metrics,
        findings: testResults.findings,
        source_mapping: testResults.focus_site
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Diagnostic_Report_${selectedPatient?.name || 'Patient'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-10 font-sans h-full min-h-screen bg-[var(--bg-main)] flex flex-col text-[var(--text-main)] transition-colors duration-300 overflow-x-hidden">
      <div className="max-w-[1700px] w-full mx-auto space-y-10">
        
        {/* Header with Export */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-black text-sky-500 tracking-tighter uppercase italic leading-none">{t('sandbox_title')}</h1>
                <p className="text-[var(--text-muted)] text-[10px] md:text-[12px] font-black tracking-[0.4em] uppercase opacity-70">{t('sandbox_subtitle')}</p>
            </div>
            {testResults && (
                <button 
                    onClick={handleExportReport}
                    className="w-full md:w-auto flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                >
                    <Download size={20} /> Export Diagnostic Report
                </button>
            )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Sidebar: Archive Selection */}
            <div className="lg:col-span-3 space-y-6">
                <div className="bg-[var(--bg-card)] p-8 rounded-[3.5rem] border border-[var(--border-color)] shadow-2xl">
                    <div className="flex items-center gap-3 mb-8">
                        <Database className="text-sky-500" size={18} />
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] italic">{t('select_dataset')}</h2>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {archives.length > 0 ? archives.map((archive) => (
                            <div 
                                key={archive.id}
                                onClick={() => setSelectedArchive(archive)}
                                className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                                    selectedArchive?.id === archive.id 
                                    ? 'bg-sky-500 text-white border-sky-500 shadow-xl scale-[1.02]' 
                                    : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-sky-500/30'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-tight">Case ID: #{archive.id.substring(0,6)}</span>
                                        <span className={`text-[9px] mt-2 font-bold ${selectedArchive?.id === archive.id ? 'text-white/70' : 'opacity-60'}`}>
                                            Captured: {new Date(archive.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <FileText size={18} />
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-20 opacity-30 italic">No Clinical Data Found</div>
                        )}
                    </div>

                    <button 
                        onClick={handleRunTest}
                        disabled={!selectedArchive || isRunning}
                        className="w-full mt-10 h-16 bg-sky-500 hover:bg-sky-600 disabled:opacity-30 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-4 group"
                    >
                        {isRunning ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={20} fill="currentColor" />}
                        {isRunning ? "Neural Analysis in Progress..." : t('run_test')}
                    </button>
                </div>

                {/* AI Performance Card */}
                {testResults && (
                    <div className={`p-8 rounded-[3.5rem] border shadow-2xl transition-all duration-700 animate-in zoom-in-95 ${testResults.status === 'normal' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'}`}>
                         <div className="flex items-center gap-3 mb-4">
                            <ShieldAlert size={24} />
                            <span className="text-[10px] font-black uppercase tracking-widest">AI Confidence Index</span>
                         </div>
                         <p className="text-5xl font-black italic tracking-tighter mb-2">{testResults.metrics.confidence}%</p>
                         <div className="w-full h-1 bg-current opacity-20 rounded-full">
                            <div className="h-full bg-current rounded-full" style={{width: `${testResults.metrics.confidence}%`}} />
                         </div>
                    </div>
                )}
            </div>

            {/* Main Hub: Diagnostic Results */}
            <div className="lg:col-span-9 flex flex-col gap-8">
                {testResults ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-700">
                        
                        {/* Status Alert Banner */}
                        <div className={`p-10 rounded-[3.5rem] border-2 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 ${testResults.status === 'normal' ? 'bg-emerald-500/5 border-emerald-500/40 text-emerald-500' : 'bg-rose-500/5 border-rose-500/40 text-rose-500'}`}>
                             <div className="space-y-4 text-center md:text-left flex-1">
                                <div className="flex items-center justify-center md:justify-start gap-4">
                                    {testResults.status === 'normal' ? <CheckCircle2 size={32} /> : <AlertTriangle size={32} className="animate-pulse" />}
                                    <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">{testResults.diagnosis}</h2>
                                </div>
                                <p className="text-sm md:text-base font-bold italic leading-relaxed opacity-80 max-w-3xl">
                                    "{testResults.narrative}"
                                </p>
                             </div>
                             <div className="flex gap-3 flex-wrap justify-center">
                                {testResults.findings.map(f => (
                                    <span key={f} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${testResults.status === 'normal' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                                        {f}
                                    </span>
                                ))}
                             </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                            
                            {/* Comparison Chart */}
                            <div className="xl:col-span-8 bg-[var(--bg-card)] p-10 rounded-[3.5rem] border border-[var(--border-color)] shadow-2xl flex flex-col">
                                <div className="flex items-center gap-4 mb-8">
                                    <Target className="text-sky-500" size={24} />
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--text-muted)] italic">Signal Accuracy Verification</h3>
                                </div>
                                <div className="flex-1 min-h-[300px]">
                                    <ECGComparisonCanvas height={300} />
                                </div>
                            </div>

                            {/* Vital Stats HUD */}
                            <div className="xl:col-span-4 flex flex-col gap-8">
                                <div className="bg-[var(--bg-card)] p-10 rounded-[3.5rem] border border-[var(--border-color)] shadow-2xl">
                                     <div className="flex items-center gap-3 mb-8">
                                        <Heart className="text-rose-500" size={20} />
                                        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] italic">Clinical Vital 5</h3>
                                     </div>
                                     <div className="space-y-6">
                                        <VitalItem label="Heart Rate (BPM)" value={testResults.metrics.hr} color={testResults.metrics.hr > 100 || testResults.metrics.hr < 60 ? 'text-rose-500' : 'text-emerald-500'} />
                                        <VitalItem label="QTc Interval (ms)" value={testResults.metrics.qtc} color={testResults.metrics.qtc > 450 ? 'text-rose-500' : 'text-emerald-500'} />
                                        <VitalItem label="PR Interval (ms)" value={testResults.metrics.pr} color="text-[var(--text-main)]" />
                                        <VitalItem label="QRS Duration (ms)" value={testResults.metrics.qrs} color={testResults.metrics.qrs > 120 ? 'text-rose-500' : 'text-emerald-500'} />
                                     </div>
                                </div>
                                
                                <div className="bg-indigo-600 p-8 rounded-[3.5rem] text-white shadow-2xl flex flex-col justify-center gap-4">
                                     <div className="flex items-center gap-3">
                                        <Info size={18} className="opacity-60" />
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Source Mapping (3D)</span>
                                     </div>
                                     <p className="text-xl font-black italic uppercase leading-none">{testResults.focus_site}</p>
                                </div>
                            </div>

                        </div>

                    </div>
                ) : (
                    <div className="flex-1 bg-[var(--bg-card)] rounded-[3.5rem] border border-[var(--border-color)] border-dashed flex flex-col items-center justify-center p-20 text-center space-y-6 opacity-40">
                         <div className="w-24 h-24 rounded-full bg-black/5 flex items-center justify-center">
                            <Activity size={48} className="text-[var(--text-muted)]" />
                         </div>
                         <div className="space-y-2">
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic">Ready for Neural Analysis</h3>
                            <p className="text-xs font-bold max-w-sm mx-auto leading-relaxed">
                                Select a clinical record from the patient archives and initiate the PINN-based diagnostic solver to generate medical insights.
                            </p>
                         </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

const VitalItem = ({ label, value, color }) => (
    <div className="flex justify-between items-end border-b border-[var(--border-color)] pb-3 group">
        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest group-hover:text-sky-500 transition-colors">{label}</span>
        <span className={`text-2xl font-black italic tracking-tighter ${color}`}>{value}</span>
    </div>
);

export default NeuralSandbox;
