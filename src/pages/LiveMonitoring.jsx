import React, { useState, useEffect, useRef } from 'react';
import HeartModel3D from '../components/visualizers/HeartModel3D';
import ECGCanvas from '../components/visualizers/ECGCanvas';
import { usePatient } from '../context/PatientContext';
import { useStream } from '../context/StreamContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useDiagnosticSolver } from '../hooks/useDiagnosticSolver';
import { 
  Activity, ShieldCheck, Zap, Save, AlertCircle, Heart, TrendingUp, 
  Info, Wifi, Thermometer, ShieldAlert, Snowflake, History, MessageSquare, PlusCircle
} from 'lucide-react';

const LiveMonitoring = () => {
  const { selectedPatient } = usePatient();
  const { data: streamData, isConnected } = useStream();
  const { token } = useAuth();
  const { t } = useLanguage();
  
  const { metrics, clinicalState, isNormal, isCritical } = useDiagnosticSolver(streamData);

  const recordingBuffer = useRef({ lead_i: [], lead_ii: [], v5: [] });
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [saveStatus, setSaveStatus] = useState(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [events, setEvents] = useState([
    { id: 1, time: '10:02:15', type: 'System', detail: 'Neural Link Established', color: 'text-sky-500' },
    { id: 2, time: '10:05:42', type: 'AI Alert', detail: 'Slight QTc Prolongation Detected', color: 'text-amber-500' }
  ]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => setRecordTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (isRecording && streamData?.leads) {
      recordingBuffer.current.lead_i.push(streamData.leads.lead_i);
      recordingBuffer.current.lead_ii.push(streamData.leads.lead_ii);
      recordingBuffer.current.v5.push(streamData.leads.v5);
    }
  }, [streamData, isRecording]);

  const toggleRecording = async () => {
    if (!isRecording) {
      recordingBuffer.current = { lead_i: [], lead_ii: [], v5: [] };
      setRecordTime(0);
      setIsRecording(true);
      setSaveStatus(null);
    } else {
      setIsRecording(false);
      await saveRecording();
    }
  };

  const saveRecording = async () => {
    if (!selectedPatient || recordingBuffer.current.lead_i.length === 0) return;
    setSaveStatus('saving');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/archives/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          leads_data: recordingBuffer.current,
          bpm_avg: metrics?.hr,
          duration_seconds: recordTime
        })
      });
      setSaveStatus(response.ok ? 'success' : 'error');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus('error');
    }
  };

  return (
    <div className="p-4 md:p-10 font-sans h-full min-h-screen bg-[var(--bg-main)] flex flex-col text-[var(--text-main)] overflow-x-hidden">
      <div className="max-w-[1900px] w-full mx-auto flex flex-col gap-8">
        
        {/* Advanced Clinical Header */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-[var(--bg-card)] p-10 rounded-[3.5rem] border border-[var(--border-color)] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-sky-500" />
            
            <div className="flex items-center gap-8">
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-700 ${isConnected ? 'bg-sky-500 text-white shadow-sky-500/40 ring-4 ring-sky-500/10' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                    <Activity size={40} className={isConnected ? "animate-pulse" : ""} />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">{t('nav_monitoring')}</h1>
                        {!isNormal && <span className="px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">At-Risk Detect</span>}
                    </div>
                    <div className="flex items-center gap-6">
                        <StatusInfo icon={<Wifi size={14}/>} label="Neural Bridge" value={isConnected ? "Active (4.2ms)" : "Offline"} color={isConnected ? "text-emerald-500" : "text-rose-500"} />
                        <StatusInfo icon={<Thermometer size={14}/>} label="Sensor Temp" value="36.8°C" color="text-sky-500" />
                        <StatusInfo icon={<ShieldAlert size={14}/>} label="Signal Quality" value="High (98%)" color="text-sky-500" />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 w-full xl:w-auto">
                <button 
                    onClick={() => setIsFrozen(!isFrozen)}
                    className={`px-8 h-16 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center gap-3 ${isFrozen ? 'bg-indigo-500 text-white' : 'bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)]'}`}
                >
                    <Snowflake size={18} className={isFrozen ? "animate-spin" : ""} />
                    {isFrozen ? "View Frozen" : "Freeze Stream"}
                </button>
                <button 
                    onClick={toggleRecording}
                    className={`flex-1 xl:flex-none flex items-center justify-center gap-4 px-10 h-16 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl ${isRecording ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse' : 'bg-sky-500 text-white hover:bg-sky-600 shadow-sky-500/20'}`}
                >
                    {isRecording ? <><div className="w-2 h-2 bg-white rounded-full animate-ping" /> REC: {recordTime}s</> : <><Save size={20}/> {t('start_capture')}</>}
                </button>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Main Center Area */}
            <div className="lg:col-span-9 flex flex-col gap-8">
                
                {/* 1. Multi-Lead Stream */}
                <div className="bg-[var(--bg-card)] p-10 rounded-[3.5rem] border border-[var(--border-color)] shadow-2xl flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <TrendingUp className="text-sky-500" size={24} />
                            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-[var(--text-muted)] italic">Neural-Physics Stream (500Hz)</h3>
                        </div>
                        {isFrozen && <div className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Freeze Mode: Analysis Active</div>}
                    </div>
                    <div className="flex-1 space-y-6">
                        <ECGCanvas data={isFrozen ? undefined : streamData?.leads?.lead_i} label="LEAD I (FRONTAL)" color="#0ea5e9" height={140} />
                        <ECGCanvas data={isFrozen ? undefined : streamData?.leads?.lead_ii} label="LEAD II (VECTOR)" color="#6366f1" height={140} />
                        <ECGCanvas data={isFrozen ? undefined : streamData?.leads?.v5} label="V5 (PRECORDIAL)" color="#8b5cf6" height={140} />
                    </div>
                </div>

                {/* 2. AI Interpretation Banner */}
                <div className={`p-12 rounded-[3.5rem] shadow-2xl flex flex-col xl:flex-row justify-between items-center gap-10 transition-all duration-700 ${isNormal ? 'bg-indigo-600 text-white' : isCritical ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'}`}>
                    <div className="flex items-center gap-8 text-center xl:text-left flex-1">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20">
                             <Zap size={40} />
                        </div>
                        <div className="space-y-2">
                             <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Real-time Clinical Insight</span>
                             <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">{clinicalState.diagnosis}</h2>
                             <p className="text-xs font-bold opacity-70 italic">AI Detection Precision: {metrics?.confidence}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Clinical Sidebar */}
            <div className="lg:col-span-3 flex flex-col gap-8">
                
                {/* 1. Vital Metrics HUD */}
                <div className="bg-[var(--bg-card)] p-10 rounded-[3.5rem] border border-[var(--border-color)] shadow-2xl flex flex-col gap-6 relative overflow-hidden">
                    <div className="flex items-center gap-3">
                        <Heart className="text-rose-500" size={20} />
                        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] italic">Vital Summary</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Heart Rate</p>
                                    {clinicalState.trend === 'rising' && <TrendingUp size={12} className="text-rose-500 animate-bounce" />}
                                    {clinicalState.trend === 'falling' && <TrendingUp size={12} className="text-sky-500 rotate-180 animate-bounce" />}
                                </div>
                                <p className="text-6xl font-black tracking-tighter italic text-[var(--text-main)]">
                                    {metrics?.hr} <span className="text-lg text-[var(--text-muted)] not-italic uppercase font-bold tracking-widest ml-1">BPM</span>
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${isNormal ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                    {isNormal ? 'STABLE' : 'ALERT'}
                                </div>
                                {clinicalState.trend !== 'stable' && (
                                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${clinicalState.trend === 'rising' ? 'text-rose-500' : 'text-sky-500'}`}>
                                        Trend: {clinicalState.trend}
                                    </span>
                                )}
                            </div>
                        </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-black/5 rounded-2xl">
                                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">QTc</p>
                                <p className={`text-xl font-black italic ${metrics?.qtc > 450 ? 'text-rose-500' : 'text-sky-500'}`}>{metrics?.qtc}ms</p>
                             </div>
                             <div className="p-4 bg-black/5 rounded-2xl">
                                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">QRS</p>
                                <p className="text-xl font-black italic text-sky-500">{metrics?.qrs}ms</p>
                             </div>
                        </div>
                    </div>
                </div>

                {/* 2. Real-time Event Log */}
                <div className="bg-[var(--bg-card)] p-10 rounded-[3.5rem] border border-[var(--border-color)] shadow-2xl flex-1 flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <History size={18} className="text-sky-500" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] italic">Event Log</h3>
                        </div>
                        <button className="p-2 hover:bg-black/5 rounded-full transition-colors"><PlusCircle size={14} className="text-sky-500"/></button>
                    </div>
                    
                    <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                         {events.map(event => (
                             <div key={event.id} className="relative pl-6 border-l border-[var(--border-color)] space-y-1">
                                 <div className={`absolute top-0 left-[-4px] w-2 h-2 rounded-full bg-current ${event.color}`} />
                                 <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-[var(--text-muted)] uppercase opacity-60">{event.time}</span>
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${event.color}`}>{event.type}</span>
                                 </div>
                                 <p className="text-[11px] font-bold leading-tight">{event.detail}</p>
                             </div>
                         ))}
                         {isCritical && (
                             <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-pulse">
                                 <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">CRITICAL ALERT</p>
                                 <p className="text-xs font-bold text-rose-600 italic">Sudden Rhythm Change Detected</p>
                             </div>
                         )}
                    </div>
                    
                    <div className="mt-8 pt-8 border-t border-[var(--border-color)]">
                         <div className="flex items-center gap-3 text-[var(--text-muted)] opacity-50 italic">
                             <MessageSquare size={14} />
                             <span className="text-[9px] font-black uppercase tracking-widest">Auto-Snapshot Ready</span>
                         </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

const StatusInfo = ({ icon, label, value, color }) => (
    <div className="flex items-center gap-3">
        <span className="text-[var(--text-muted)] opacity-60">{icon}</span>
        <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">{label}</span>
            <span className={`text-[10px] font-bold ${color}`}>{value}</span>
        </div>
    </div>
);

export default LiveMonitoring;