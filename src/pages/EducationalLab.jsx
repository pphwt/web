import React, { useState, useEffect } from 'react';
import HeartModel3D from '../components/visualizers/HeartModel3D';
import ECGCanvas from '../components/visualizers/ECGCanvas';
import PhysicsControlPanel from '../components/visualizers/PhysicsControlPanel';
import { useStream } from '../context/StreamContext';
import { useAuth } from '../context/AuthContext';

const InsightValue = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</span>
        <span className="text-slate-900 font-mono text-xl font-black italic tracking-tighter">{value}</span>
    </div>
);

const EducationalLab = () => {
  const { data: streamData, isConnected, sendUpdate } = useStream();
  const { token } = useAuth();
  const [selectedScenario, setSelectedScenario] = useState(null);
  
  const pathologyLibrary = [
    { 
        id: 'normal', 
        title: 'Normal Sinus Rhythm', 
        description: 'Baseline cardiac electrical activity. Stable diffusion and excitation.',
        params: { a: 0.1, k: 8.0, D: 0.0001 },
        difficulty: 'Beginner'
    },
    { 
        id: 'tachycardia', 
        title: 'Sinus Tachycardia', 
        description: 'Accelerated heart rate. High diffusion coefficient leading to rapid propagation.',
        params: { a: 0.1, k: 8.0, D: 0.0005 },
        difficulty: 'Beginner'
    },
    { 
        id: 'bradycardia', 
        title: 'Sinus Bradycardia', 
        description: 'Slowed heart rate. Reduced diffusion and lower excitation frequency.',
        params: { a: 0.12, k: 7.5, D: 0.00005 },
        difficulty: 'Beginner'
    },
    { 
        id: 'ischemia', 
        title: 'Myocardial Ischemia', 
        description: 'Weakened myocardial response. High excitation threshold (a) and reduced potential scaling (k).',
        params: { a: 0.25, k: 4.5, D: 0.00008 },
        difficulty: 'Intermediate'
    }
  ];

  const loadScenario = (scenario) => {
    setSelectedScenario(scenario);
    sendUpdate({
      type: 'parameter_update',
      params: scenario.params
    });
  };

  return (
    <div className="p-10 font-sans min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-10 flex justify-between items-center">
            <div>
                <h1 className="text-4xl font-black text-emerald-500 tracking-tighter uppercase italic">Neural Lab</h1>
                <p className="text-[var(--text-muted)] text-xs font-bold tracking-[0.2em] mt-2 uppercase">Interactive Pathology Simulator</p>
            </div>
            <div className={`px-4 py-2 rounded-full border shadow-sm ${isConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'} text-[10px] font-black uppercase tracking-widest transition-colors duration-300`}>
                {isConnected ? 'Neural Bridge Active' : 'Bridge Offline'}
            </div>
        </header>

        <div className="grid grid-cols-12 gap-8">
            <div className="col-span-3 space-y-4">
                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">Pathology Library</h3>
                {pathologyLibrary.map(s => (
                    <div 
                        key={s.id}
                        onClick={() => loadScenario(s)}
                        className={`p-6 rounded-3xl border transition-all cursor-pointer shadow-sm ${selectedScenario?.id === s.id ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-emerald-500/50'}`}
                    >
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full mb-3 inline-block ${selectedScenario?.id === s.id ? 'bg-white/20 text-white' : (s.difficulty === 'Beginner' ? 'bg-sky-500/20 text-sky-500' : 'bg-amber-500/20 text-amber-500')}`}>
                            {s.difficulty}
                        </span>
                        <h4 className={`font-bold mb-2 ${selectedScenario?.id === s.id ? 'text-white' : 'text-[var(--text-main)]'}`}>{s.title}</h4>
                        <p className={`text-xs leading-relaxed ${selectedScenario?.id === s.id ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>{s.description}</p>
                    </div>
                ))}
            </div>

            <div className="col-span-6 space-y-6">
                <div className="h-[450px] bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border-color)] relative overflow-hidden group shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                    <HeartModel3D />
                    
                    <div className="absolute top-20 right-6 flex flex-col items-end gap-2 z-20">
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 rounded-full shadow-lg">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                            <span className="text-emerald-500 text-[9px] font-black uppercase tracking-widest">
                                PINN Solver Active
                            </span>
                        </div>
                        {selectedScenario && (
                            <div className="px-4 py-1.5 bg-white shadow-xl text-slate-900 text-[11px] font-black rounded-full border border-slate-200 uppercase tracking-widest">
                                Case: {selectedScenario.title}
                            </div>
                        )}
                    </div>

                    {selectedScenario && (
                        <div className="absolute bottom-8 left-8 right-8 bg-[var(--bg-card)]/95 p-6 rounded-3xl border border-[var(--border-color)] backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-500 shadow-2xl">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <h5 className="text-sm font-black text-emerald-700 uppercase tracking-widest">Biophysical Insight (XAI)</h5>
                            </div>
                            <p className="text-base font-bold text-slate-800 leading-relaxed italic mb-4">"{selectedScenario.description}"</p>
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--border-color)]">
                                <InsightValue label="Excitation (a)" value={selectedScenario.params.a} />
                                <InsightValue label="Scaling (k)" value={selectedScenario.params.k} />
                                <InsightValue label="Diffusion (D)" value={selectedScenario.params.D} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-[var(--bg-card)] p-6 rounded-[2.5rem] border border-[var(--border-color)] shadow-lg space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] ml-4">Neural Signal Synthesis</h3>
                    <div className="space-y-2">
                        <ECGCanvas data={streamData?.leads?.lead_i} label="LEAD I (FRONTAL)" color="#0ea5e9" height={80} />
                        <ECGCanvas data={streamData?.leads?.lead_ii} label="LEAD II (VECTOR)" color="#6366f1" height={80} />
                        <ECGCanvas data={streamData?.leads?.v5} label="V5 (PRECORDIAL)" color="#8b5cf6" height={80} />
                    </div>
                </div>
            </div>

            <div className="col-span-3">
                <div className="bg-[var(--bg-card)] p-8 rounded-[3rem] border border-[var(--border-color)] h-full shadow-lg">
                    <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-8 text-center">Interactive Physics</h3>
                    <PhysicsControlPanel />
                    <div className="mt-10 p-6 bg-black/5 rounded-3xl border border-[var(--border-color)] italic text-center">
                        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                            Adjust neural parameters to see how the PINN solver redistributes electrical potential across the myocardium.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EducationalLab;
