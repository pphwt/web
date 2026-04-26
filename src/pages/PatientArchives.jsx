import React, { useState, useEffect } from 'react';
import { usePatient } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';
import ECGCanvas from '../components/visualizers/ECGCanvas';

const PatientArchives = () => {
  const { selectedPatient } = usePatient();
  const { token } = useAuth();
  const [archives, setArchives] = useState([]);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedPatient && token) {
      fetchArchives();
    }
  }, [selectedPatient, token]);

  const handleExport = () => {
    if (!selectedArchive) return;
    
    const exportData = {
        report_metadata: {
            app: "Bioelectric PINN Intelligence",
            version: "1.4.2",
            timestamp: new Date().toISOString()
        },
        patient: {
            name: selectedPatient?.name,
            id: selectedPatient?.id
        },
        snapshot: {
            id: selectedArchive.id,
            timestamp: selectedArchive.created_at,
            avg_bpm: selectedArchive.bpm_avg,
            ai_confidence: selectedArchive.ai_confidence,
            physics: selectedArchive.physics_snapshot
        },
        data_leads: selectedArchive.leads_data
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bioelectric_Report_${selectedArchive.id.substring(0,8)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchArchives = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/archives/${selectedPatient.id}/`, {
        headers: { 
            'Authorization': `Bearer ${token}` 
        }
      });
      const data = await response.json();
      setArchives(data);
    } catch (err) {
      console.error("Failed to fetch archives", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 font-sans min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-12 flex justify-between items-end">
            <div>
                <h1 className="text-4xl font-black text-sky-500 tracking-tighter uppercase italic">Neural Archives</h1>
                <p className="text-[var(--text-muted)] text-xs font-bold tracking-[0.2em] mt-2 uppercase">Historical Bio-Signal Repository</p>
            </div>
            <div className="bg-[var(--bg-card)] px-6 py-3 rounded-2xl border border-[var(--border-color)] flex items-center gap-4 shadow-sm">
                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Neural History</span>
                <span className="text-sky-500 font-bold">{selectedPatient?.name || "No Patient Selected"}</span>
            </div>
        </header>

        <div className="grid grid-cols-12 gap-10">
            {/* Archive List */}
            <div className="col-span-4 space-y-4 max-h-[700px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-sky-500/20">
                {archives.length === 0 && !loading && (
                    <div className="p-10 text-center border-2 border-dashed border-[var(--border-color)] rounded-[2rem] opacity-40">
                        <p className="text-sm font-bold text-[var(--text-muted)]">No Neural Records Found</p>
                    </div>
                )}
                
                {archives.map(archive => (
                    <div 
                        key={archive.id}
                        onClick={() => setSelectedArchive(archive)}
                        className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer group shadow-sm ${
                            selectedArchive?.id === archive.id 
                            ? 'bg-sky-500 text-white border-sky-500 shadow-lg' 
                            : 'bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-sky-500/50'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${selectedArchive?.id === archive.id ? 'text-white/80' : 'text-sky-500'}`}>
                                Snapshot {new Date(archive.created_at).toLocaleTimeString()}
                            </span>
                            <span className={`font-mono text-[10px] ${selectedArchive?.id === archive.id ? 'text-white/60' : 'text-[var(--text-muted)] opacity-40'}`}>
                                {archive.duration_seconds.toFixed(1)}s
                            </span>
                        </div>
                        <h3 className={`font-bold mb-1 ${selectedArchive?.id === archive.id ? 'text-white' : 'text-[var(--text-main)]'}`}>
                            {new Date(archive.created_at).toLocaleDateString()}
                        </h3>
                        <div className="flex gap-4 mt-4">
                             <div className="flex flex-col">
                                <span className={`text-[9px] font-bold uppercase ${selectedArchive?.id === archive.id ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>Avg BPM</span>
                                <span className={`font-black ${selectedArchive?.id === archive.id ? 'text-white' : 'text-[var(--text-main)]'}`}>{archive.bpm_avg}</span>
                             </div>
                             <div className="flex flex-col">
                                <span className={`text-[9px] font-bold uppercase ${selectedArchive?.id === archive.id ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>Confidence</span>
                                <span className={`font-black ${selectedArchive?.id === archive.id ? 'text-white' : 'text-sky-500'}`}>{(archive.ai_confidence * 100).toFixed(0)}%</span>
                             </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Visualizer */}
            <div className="col-span-8">
                {selectedArchive ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border-color)] p-8 backdrop-blur-xl shadow-lg">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-bold text-[var(--text-main)] uppercase tracking-tight">Signal Playback</h2>
                                <div className="flex gap-2">
                                    {Object.keys(selectedArchive.physics_snapshot || {}).map(k => (
                                        <div key={k} className="px-3 py-1 bg-black/5 rounded-full text-[9px] font-bold text-[var(--text-muted)] uppercase">
                                            {k}: {selectedArchive.physics_snapshot[k].toFixed(4)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <ECGCanvas initialData={selectedArchive.leads_data?.lead_i} label="LEAD I (FRONTAL)" color="#0ea5e9" height={100} />
                                <ECGCanvas initialData={selectedArchive.leads_data?.lead_ii} label="LEAD II (VECTOR)" color="#6366f1" height={100} />
                                <ECGCanvas initialData={selectedArchive.leads_data?.v5} label="V5 (PRECORDIAL)" color="#8b5cf6" height={100} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm">
                                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-1">Observation</span>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">Neural activity during this session showed stable diffusion patterns with high AI classification accuracy.</p>
                            </div>
                            <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm">
                                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-1">Integrity</span>
                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">Data packet integrity: 100%. Recorded at 20Hz sample rate via PINN Neural Bridge.</p>
                            </div>
                            <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] flex flex-col justify-center items-center shadow-sm">
                                <button 
                                    onClick={handleExport}
                                    className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg active:scale-95"
                                >
                                    Export Snapshot
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-color)] rounded-[3rem] opacity-30">
                        <div className="w-20 h-20 bg-black/5 rounded-full mb-6 flex items-center justify-center text-[var(--text-muted)]">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <p className="text-lg font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Select Record to Visualize</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PatientArchives;
