import React, { useState, useEffect } from 'react';
import AnatomyVisualizer3D from '../components/visualizers/AnatomyVisualizer3D';
import ECGViewer from '../components/visualizers/ECGViewer';
import PhysicsControlPanel from '../components/visualizers/PhysicsControlPanel';
import { useStream } from '../context/StreamContext';
import { useAuth } from '../context/AuthContext';

const EducationalLab = () => {
  const { data: streamData, isConnected, sendUpdate } = useStream();
  const { token } = useAuth();
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [scenarios, setScenarios] = useState([]);

  useEffect(() => {
    if (token) fetchScenarios();
  }, [token]);

  const fetchScenarios = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/scenarios/`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setScenarios(data);
    } catch (err) {
      console.error("Failed to load scenarios");
    }
  };

  const loadScenario = (scenario) => {
    setSelectedScenario(scenario);
    // Push the scenario physics to the neural bridge
    sendUpdate({
      type: 'parameter_update',
      params: scenario.target_physics
    });
  };

  return (
    <div className="p-10 font-sans min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-10 flex justify-between items-center">
            <div>
                <h1 className="text-4xl font-black text-emerald-500 tracking-tighter uppercase italic">Neural Lab</h1>
                <p className="text-[var(--text-muted)] text-xs font-bold tracking-[0.2em] mt-2 uppercase">Clinical Physics Simulation Environment</p>
            </div>
            <div className={`px-4 py-2 rounded-full border shadow-sm ${isConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'} text-[10px] font-black uppercase tracking-widest transition-colors duration-300`}>
                {isConnected ? 'Neural Bridge Active' : 'Bridge Offline'}
            </div>
        </header>

        <div className="grid grid-cols-12 gap-8">
            {/* Scenario Selection */}
            <div className="col-span-3 space-y-4">
                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">Training Modules</h3>
                {scenarios.map(s => (
                    <div 
                        key={s.id}
                        onClick={() => loadScenario(s)}
                        className={`p-6 rounded-3xl border transition-all cursor-pointer shadow-sm ${selectedScenario?.id === s.id ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-emerald-500/50'}`}
                    >
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full mb-3 inline-block ${selectedScenario?.id === s.id ? 'bg-white/20 text-white' : (s.difficulty_level === 'Beginner' ? 'bg-sky-500/20 text-sky-500' : 'bg-amber-500/20 text-amber-500')}`}>
                            {s.difficulty_level}
                        </span>
                        <h4 className={`font-bold mb-2 ${selectedScenario?.id === s.id ? 'text-white' : 'text-[var(--text-main)]'}`}>{s.title}</h4>
                        <p className={`text-xs leading-relaxed ${selectedScenario?.id === s.id ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>{s.description}</p>
                    </div>
                ))}
            </div>

            {/* Simulation Area */}
            <div className="col-span-6 space-y-6">
                <div className="h-[450px] bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border-color)] relative overflow-hidden group shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                    <AnatomyVisualizer3D />
                    
                    <div className="absolute top-20 right-6 flex flex-col items-end gap-2 z-20">
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 rounded-full shadow-lg">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                            <span className="text-emerald-500 text-[9px] font-black uppercase tracking-widest">
                                PINN Solver Active
                            </span>
                        </div>
                        {selectedScenario && (
                            <div className="px-3 py-1 bg-[var(--bg-card)]/80 backdrop-blur-md text-[var(--text-main)] text-[9px] font-black rounded-full border border-[var(--border-color)] uppercase tracking-widest shadow-sm">
                                Case: {selectedScenario.title}
                            </div>
                        )}
                    </div>

                    {selectedScenario && (
                        <div className="absolute bottom-8 left-8 right-8 bg-[var(--bg-card)]/95 p-6 rounded-3xl border border-[var(--border-color)] backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-500 shadow-2xl">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Clinical Protocol</h5>
                            </div>
                            <p className="text-xs text-[var(--text-main)] leading-relaxed italic">"{selectedScenario.clinical_notes}"</p>
                        </div>
                    )}
                </div>

                <div className="bg-[var(--bg-card)] p-1 rounded-[2.5rem] border border-[var(--border-color)] shadow-lg overflow-hidden">
                    <div className="h-[280px]">
                        <ECGViewer 
                            heartRate={streamData?.heart_rate || 72} 
                            liveData={streamData?.leads} 
                            rhythm={selectedScenario ? `Simulating: ${selectedScenario.title}` : "Live Neural Bridge"}
                        />
                    </div>
                </div>
            </div>

            {/* Lab Controls */}
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
