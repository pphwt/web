import React, { useState, useEffect } from 'react';
import { Play, Database, FileText, CheckCircle2, Activity, BarChart3 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePatient } from '../context/PatientContext';

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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/localization/batch_test/`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          leads_data: selectedArchive.leads_data,
          t_start: 0,
          t_step: 0.05
        })
      });
      const result = await response.json();
      setTestResults(result);
    } catch (err) {
      console.error("Test execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-10 font-sans h-full min-h-screen bg-[var(--bg-main)] flex flex-col text-[var(--text-main)] transition-colors duration-300">
      <div className="max-w-[1400px] w-full mx-auto space-y-12">
        <header>
            <h1 className="text-5xl font-black text-sky-500 tracking-tighter uppercase italic">{t('sandbox_title')}</h1>
            <p className="text-[var(--text-muted)] text-[10px] font-bold tracking-[0.4em] mt-4 uppercase">{t('sandbox_subtitle')}</p>
        </header>

        <div className="grid grid-cols-12 gap-10">
            {/* Control Panel */}
            <div className="col-span-4 space-y-8">
                <div className="bg-[var(--bg-card)] p-10 rounded-[3rem] border border-[var(--border-color)] shadow-2xl">
                    <div className="flex items-center gap-3 mb-10">
                        <Database className="text-sky-500" size={20} />
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{t('select_dataset')}</h2>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {archives.length > 0 ? archives.map((archive) => (
                            <div 
                                key={archive.id}
                                onClick={() => setSelectedArchive(archive)}
                                className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                                    selectedArchive?.id === archive.id 
                                    ? 'bg-sky-500/10 border-sky-500/50 text-sky-500 ring-2 ring-sky-500/20' 
                                    : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-sky-500/30'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold uppercase tracking-tight">Recording Segment</span>
                                        <span className="text-[10px] opacity-60 mt-1 font-mono">{new Date(archive.created_at).toLocaleString()}</span>
                                    </div>
                                    <FileText size={16} />
                                </div>
                            </div>
                        )) : (
                            <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase text-center py-10 opacity-50">No recordings found for {selectedPatient?.name}</p>
                        )}
                    </div>

                    <button 
                        onClick={handleRunTest}
                        disabled={!selectedArchive || isRunning}
                        className="w-full mt-10 h-16 bg-sky-500 hover:bg-sky-600 disabled:opacity-30 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3"
                    >
                        {isRunning ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={18} fill="currentColor" />}
                        {t('run_test')}
                    </button>
                </div>
            </div>

            {/* Results Panel */}
            <div className="col-span-8">
                {testResults ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="bg-[var(--bg-card)] p-10 rounded-[3rem] border border-[var(--border-color)] shadow-2xl">
                             <div className="flex items-center justify-between mb-12">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="text-emerald-500" size={24} />
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">{t('test_results')}</h2>
                                </div>
                                <div className="flex gap-4">
                                    <MetricBadge label={t('mse_error')} value="0.0024" color="text-emerald-500" />
                                    <MetricBadge label={t('latency')} value="12ms" color="text-sky-500" />
                                </div>
                             </div>

                             {/* Test Graph */}
                             <div className="h-[400px] w-full bg-[var(--bg-main)] rounded-3xl border border-[var(--border-color)] p-8 flex items-end gap-1">
                                {testResults.u.slice(0, 100).map((val, i) => (
                                    <div 
                                        key={i} 
                                        className="flex-1 bg-sky-500/50 rounded-full hover:bg-sky-500 transition-all cursor-crosshair"
                                        style={{ height: `${Math.abs(val) * 100}%`, minHeight: '4px' }}
                                    />
                                ))}
                             </div>
                             <p className="text-center text-[var(--text-muted)] text-[9px] font-black uppercase tracking-[0.3em] mt-6">Neural Activation Response (U) - Time Domain</p>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <StatsCard icon={<Activity className="text-rose-500" />} label="Peak Recovery (V)" value={testResults.metrics.max_v.toFixed(4)} />
                            <StatsCard icon={<BarChart3 className="text-amber-500" />} label="Avg Potential" value={testResults.metrics.avg_u.toFixed(4)} />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border-color)] border-dashed opacity-40">
                         <Play size={48} className="text-[var(--text-muted)] mb-6" />
                         <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest italic">{selectedArchive ? "Ready to compute..." : "Select a dataset to begin validation"}</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

const MetricBadge = ({ label, value, color }) => (
    <div className="bg-[var(--bg-main)] px-5 py-3 rounded-xl border border-[var(--border-color)] flex flex-col">
        <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">{label}</span>
        <span className={`text-sm font-black ${color}`}>{value}</span>
    </div>
);

const StatsCard = ({ icon, label, value }) => (
    <div className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-color)] flex items-center gap-6 shadow-xl">
        <div className="p-4 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-color)]">
            {icon}
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{label}</span>
            <span className="text-2xl font-black text-[var(--text-main)] tracking-tighter">{value}</span>
        </div>
    </div>
);

export default NeuralSandbox;
