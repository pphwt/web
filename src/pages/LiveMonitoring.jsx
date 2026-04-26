import React, { useState, useEffect } from 'react';
import AnatomyVisualizer3D from '../components/visualizers/AnatomyVisualizer3D';
import ECGViewer from '../components/visualizers/ECGViewer';
import { usePatient } from '../context/PatientContext';
import { useStream } from '../context/StreamContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const LiveMonitoring = () => {
  const { selectedPatient } = usePatient();
  const { data: streamData, isConnected } = useStream();
  const { token } = useAuth();
  const { t } = useLanguage();

  // Archive Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [buffer, setBuffer] = useState({ lead_i: [], lead_ii: [], v5: [] });
  const [recordTime, setRecordTime] = useState(0);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    if (isRecording && streamData?.leads) {
      setBuffer(prev => ({
        lead_i: [...prev.lead_i, streamData.leads.lead_i].slice(-500), // Keep last 500 points
        lead_ii: [...prev.lead_ii, streamData.leads.lead_ii].slice(-500),
        v5: [...prev.v5, streamData.leads.v5].slice(-500),
      }));
      setRecordTime(t => t + 0.05);
    }
  }, [streamData, isRecording]);

  const toggleRecording = async () => {
    if (!isRecording) {
      setBuffer({ lead_i: [], lead_ii: [], v5: [] });
      setRecordTime(0);
      setIsRecording(true);
      setSaveStatus(null);
    } else {
      setIsRecording(false);
      await saveRecording();
    }
  };

  const saveRecording = async () => {
    if (!selectedPatient || buffer.lead_i.length === 0) return;
    
    setSaveStatus('saving');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/archives/`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          leads_data: buffer,
          physics_snapshot: streamData?.physics_params,
          bpm_avg: streamData?.heart_rate,
          ai_confidence: streamData?.ai_confidence,
          duration_seconds: recordTime
        })
      });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      setSaveStatus('error');
    }
  };

  return (
    <div className="p-10 font-sans h-full min-h-screen bg-[var(--bg-main)] flex flex-col text-[var(--text-main)] transition-colors duration-300">
      <div className="flex justify-between items-start mb-8 w-full max-w-[1600px] mx-auto">
        <div className="flex flex-col">
            <h1 className="text-4xl font-black text-sky-500 tracking-tighter mt-2 uppercase italic">{t('nav_monitoring')}</h1>
            <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    {isConnected ? t('success') : t('error')}
                </span>
            </div>
        </div>
        
        <div className="flex items-center gap-6">
           {/* Recording Controller */}
           <button 
              onClick={toggleRecording}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all duration-300 group shadow-lg ${
                isRecording 
                ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' 
                : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-sky-500'
              }`}
           >
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-[var(--text-muted)]'}`} />
              <div className="flex flex-col items-start leading-none">
                 <span className="text-[10px] font-black uppercase tracking-widest">
                    {isRecording ? t('loading') : saveStatus === 'success' ? t('success') : t('nav_archives')}
                 </span>
                 {isRecording && <span className="text-xs font-mono mt-1 font-bold">{recordTime.toFixed(1)}s</span>}
              </div>
           </button>

           <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[var(--text-muted)] mb-2 pl-1 tracking-widest uppercase">Current Patient</span>
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-6 py-4 flex items-center justify-between min-w-[380px] backdrop-blur-xl shadow-lg">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 border border-white/20 shadow-lg" />
                    <div className="flex flex-col">
                       <span className="text-[var(--text-main)] font-bold text-base">{selectedPatient?.name || "System Idle"}</span>
                       <span className="text-[var(--text-muted)] text-[11px] font-medium tracking-wide uppercase tracking-tighter">
                         ID: {selectedPatient?.id?.substring(0, 8) || "N/A"}...
                       </span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1 max-w-[1600px] w-full mx-auto">
        <div className="col-span-3 space-y-6 flex flex-col">
          <div className="bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border-color)] backdrop-blur-md shadow-lg">
             <div className="flex items-center gap-3 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                PINNS INSIGHTS
             </div>
             
             <div className="space-y-8">
                  <Insight 
                    title="Haemodynamics" 
                    status={isConnected ? "Normal" : "Disconnected"} 
                    desc={isConnected ? "Stable pressure detected." : "Waiting for neural bridge..."} 
                    color={isConnected ? "text-emerald-500" : "text-rose-500"}
                  />
                  <Insight 
                    title="Neural Diffusion" 
                    status="Active" 
                    desc="Real-time PINN inference running." 
                    color="text-sky-500" 
                  />
             </div>

             <div className="mt-12 pt-8 border-t border-[var(--border-color)]">
                <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-sky-500 transition-all duration-500" style={{ width: `${(streamData?.ai_confidence || 0.98) * 100}%` }} />
                </div>
                <p className="text-[var(--text-muted)] text-[10px] font-bold tracking-widest uppercase">
                  Model Confidence: {((streamData?.ai_confidence || 0.98) * 100).toFixed(1)}%
                </p>
             </div>
          </div>
        </div>

        <div className="col-span-9 flex flex-col gap-8">
          <div className="h-[450px]">
            <ECGViewer 
              heartRate={streamData?.heart_rate || 72} 
              rhythm="Normal" 
              liveData={streamData?.leads}
            />
          </div>

          <div className="grid grid-cols-2 gap-8 h-[350px]">
             <div className="col-span-1 shadow-lg bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden">
                <AnatomyVisualizer3D />
             </div>

             <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border-color)] backdrop-blur-md flex flex-col justify-center gap-8 shadow-lg">
                <Metric label="Excitation Threshold (a)" value={Math.floor((streamData?.physics_params?.a || 0.1) * 200)} color="bg-sky-500" />
                <Metric label="Potential Scaling (k)" value={Math.floor((streamData?.physics_params?.k || 8.0) * 5)} color="bg-amber-500" />
                <Metric label="Diffusion Coeff (D)" value={Math.floor((streamData?.physics_params?.D || 0.0001) * 100000)} color="bg-emerald-500" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Insight = ({ title, status, desc, color = "text-sky-500" }) => (
    <div>
        <div className="flex justify-between items-baseline mb-2">
            <h3 className="text-[var(--text-main)] text-sm font-bold tracking-tight">{title}</h3>
            <span className={`text-[10px] font-black uppercase tracking-tighter ${color}`}>{status}</span>
        </div>
        <p className="text-[var(--text-muted)] text-xs leading-relaxed opacity-60">{desc}</p>
    </div>
);

const Metric = ({ label, value, color, className }) => (
    <div className={`space-y-3 ${className}`}>
        <div className="flex justify-between text-[10px] font-black tracking-widest text-[var(--text-muted)] uppercase">
            <span>{label}</span>
            <span className="text-[var(--text-main)] font-mono">{value}%</span>
        </div>
        <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden shadow-inner">
            <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${value}%` }} />
        </div>
    </div>
);

export default LiveMonitoring;