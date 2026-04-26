import React from 'react';
import BrainModel3D from '../components/visualizers/BrainModel3D';
import { useLanguage } from '../context/LanguageContext';
import { Brain, Zap, ShieldCheck, Activity } from 'lucide-react';

const BrainDiagnostics = () => {
  const { t } = useLanguage();

  return (
    <div className="p-4 md:p-10 font-sans h-full min-h-screen bg-[var(--bg-main)] flex flex-col text-[var(--text-main)] overflow-hidden">
      <div className="max-w-[1600px] w-full mx-auto flex flex-col gap-8 h-full flex-1">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--border-color)] pb-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                        <Brain size={24} />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-indigo-500 tracking-tighter uppercase italic leading-none">Neurological PINN</h1>
                </div>
                <p className="text-[var(--text-muted)] text-[9px] md:text-[11px] font-black tracking-[0.4em] uppercase opacity-70 ml-2 md:ml-14">Brain Source Localization Hub</p>
            </div>
            
            <div className="flex gap-4">
                <div className="bg-indigo-500/10 border border-indigo-500/20 px-6 py-4 rounded-2xl flex flex-col items-end">
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Active Modal</span>
                    <span className="text-xl font-black italic">ECoG Matrix</span>
                </div>
            </div>
        </header>

        {/* Main Visualization Grid */}
        <div className="flex-1 grid grid-cols-12 gap-8 min-h-0">
            {/* Left: 3D Mapping (Huge Area) */}
            <div className="col-span-12 lg:col-span-9 h-[600px] lg:h-full relative">
                <BrainModel3D />
                
                {/* Overlay Legend */}
                <div className="absolute bottom-10 left-10 space-y-4 bg-black/60 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-4 h-4 rounded-full bg-sky-400 shadow-[0_0_15px_#38bdf8]" />
                        <span className="text-xs font-black uppercase tracking-[0.15em] text-white">Localized Neural Spike</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-4 h-4 rounded-full border-2 border-white/40" />
                        <span className="text-xs font-black uppercase tracking-[0.15em] text-white/70">Muted Cortex Region</span>
                    </div>
                </div>
            </div>

            {/* Right: Neuro Stats */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                <NeuroCard title="Neural Resonance" icon={<Zap size={16}/>} value="98.2%" color="text-indigo-500" />
                <NeuroCard title="Latency Sync" icon={<Activity size={16}/>} value="12.4ms" color="text-sky-500" />
                
                <div className="flex-1 bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-2xl flex flex-col justify-center text-center space-y-6">
                    <ShieldCheck size={48} className="mx-auto text-emerald-500 opacity-20" />
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Solver Integrity</p>
                        <p className="text-2xl font-black italic tracking-tighter">Verified PINN</p>
                    </div>
                    <p className="text-[10px] leading-relaxed text-[var(--text-muted)] italic">
                        "The neurological bridge is utilizing Aliev-Panfilov diffusion equations adapted for cortical electrical propagation."
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const NeuroCard = ({ title, icon, value, color }) => (
    <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-xl space-y-4">
        <div className="flex items-center gap-3">
            <span className={color}>{icon}</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">{title}</span>
        </div>
        <p className={`text-4xl font-black italic tracking-tighter ${color}`}>{value}</p>
    </div>
);

export default BrainDiagnostics;
