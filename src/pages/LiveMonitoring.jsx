import React from 'react';
import BrainModel3D from '../components/visualizers/BrainModel3D';
import ECGViewer from '../components/visualizers/ECGViewer';

const LiveMonitoring = () => {
  return (
    <div className="p-10 font-sans h-full min-h-screen bg-[#070b14] flex flex-col text-slate-200">
      {/* Dynamic Header */}
      <div className="flex justify-between items-start mb-8 w-full max-w-[1600px] mx-auto">
        <h1 className="text-4xl font-black text-sky-400 tracking-tighter mt-2">LIVE MONITORING</h1>
        
        <div className="flex flex-col">
           <span className="text-[10px] font-bold text-slate-500 mb-2 pl-1 tracking-widest">CURRENT PATIENT</span>
           <div className="bg-slate-800/40 border border-white/5 rounded-2xl px-6 py-4 flex items-center justify-between min-w-[380px] backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 border border-white/20 shadow-lg" />
                 <div className="flex flex-col">
                    <span className="text-white font-bold text-base">Mr. John Doe</span>
                    <span className="text-slate-400 text-[11px] font-medium tracking-wide">ID: #9928-AX-2026</span>
                 </div>
              </div>
              <ChevronDownIcon />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1 max-w-[1600px] w-full mx-auto">
        {/* Analytics Sidebar */}
        <div className="col-span-3 space-y-6 flex flex-col">
          <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/5 backdrop-blur-md shadow-2xl">
             <div className="flex items-center gap-3 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                PINNS INSIGHTS
             </div>
             
             <div className="space-y-8">
                 <Insight title="Haemodynamics" status="Normal" desc="Stable pressure detected." />
                 <Insight title="Myocardial Fatigue" status="Caution" desc="Minor apical decoupling." color="text-amber-400" />
             </div>

             <div className="mt-12 pt-8 border-t border-white/5">
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-sky-500 w-[98%]" />
                </div>
                <p className="text-slate-500 text-[10px] font-bold tracking-widest">MODEL CONFIDENCE: 98.2%</p>
             </div>
          </div>
        </div>

        {/* Real-time Visualization Engine */}
        <div className="col-span-9 flex flex-col gap-8">
          <div className="h-[450px]">
            <ECGViewer heartRate="72" rhythm="Normal" />
          </div>

          <div className="grid grid-cols-2 gap-8 h-[350px]">
             <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/5 backdrop-blur-md">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">3D LOCALIZATION</p>
                <div className="h-full max-h-[220px] rounded-2xl bg-black/20 overflow-hidden">
                   <BrainModel3D />
                </div>
             </div>

             <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/5 backdrop-blur-md flex flex-col justify-center">
                <Metric label="Mitral Valve Flow" value={80} color="bg-sky-500" />
                <Metric label="Aortic Root Dilation" value={45} color="bg-amber-500" className="my-8" />
                <Metric label="Septal Wall Strain" value={92} color="bg-emerald-500" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Insight = ({ title, status, desc, color = "text-sky-400" }) => (
    <div>
        <div className="flex justify-between items-baseline mb-2">
            <h3 className="text-white text-sm font-bold">{title}</h3>
            <span className={`text-[10px] font-black uppercase tracking-tighter ${color}`}>{status}</span>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
    </div>
);

const Metric = ({ label, value, color, className }) => (
    <div className={`space-y-3 ${className}`}>
        <div className="flex justify-between text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            <span>{label}</span>
            <span>{value}%</span>
        </div>
        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
            <div className={`h-full ${color} transition-all`} style={{ width: `${value}%` }} />
        </div>
    </div>
);

const ChevronDownIcon = () => (
    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

export default LiveMonitoring;