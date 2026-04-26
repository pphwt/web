import React, { useState } from 'react';
import { ScanEye, Grid3X3, Rotate3d } from 'lucide-react';
import BrainModel3D from '../components/visualizers/BrainModel3D';

const Analysis = () => {
  const [depth, setDepth] = useState(42);

  return (
    <div className="p-10 font-sans h-full min-h-screen bg-[#070b14] flex flex-col text-slate-200">
      <h1 className="text-4xl font-black text-sky-400 tracking-tighter mb-10">3D ANALYSIS</h1>

      <div className="flex-1 grid grid-cols-12 gap-10 max-w-[1600px] w-full mx-auto">
        {/* Main 3D View Portal */}
        <div className="col-span-8 flex flex-col gap-6">
          <div className="flex-1 bg-slate-900/50 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden backdrop-blur-3xl h-[700px]">
             <div className="relative z-10 w-full h-full">
                <BrainModel3D />
                
                {/* Hotspots */}
                <Marker top="48%" left="58%" />
                <Marker top="68%" left="68%" />
             </div>
          </div>

          {/* Precision Controls */}
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/5 rounded-3xl py-8 px-12 flex items-center justify-between shadow-2xl">
             <div className="flex items-center gap-14">
                <ControlButton icon={<ScanEye size={24} />} label="Slice" />
                <ControlButton icon={<Grid3X3 size={24} />} label="Grid" />
                <ControlButton icon={<Rotate3d size={24} />} label="3D" />
             </div>

             <div className="h-16 w-[1px] bg-white/5 mx-8" />

             <div className="flex-1 flex items-center gap-12">
                <div className="flex flex-col gap-3 flex-1">
                   <div className="flex justify-between items-center text-[11px] font-black tracking-widest text-slate-500 uppercase">
                      <span>Depth Axis</span>
                      <span className="text-sky-400">{depth}%</span>
                   </div>
                   <input 
                      type="range" min="0" max="100" value={depth} 
                      onChange={(e) => setDepth(e.target.value)}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-800 accent-sky-500"
                   />
                </div>
                
                <button className="flex flex-col items-center justify-center px-8 border-l border-white/5 h-16 group hover:text-sky-400 transition-colors">
                   <span className="text-[11px] font-black uppercase tracking-widest">Capture</span>
                </button>
             </div>
          </div>
        </div>

        {/* Diagnostic Metadata */}
        <div className="col-span-4 space-y-8 flex flex-col">
          <Card title="Structural Integrity">
             <div className="space-y-8">
                <DiagnosticMetric label="Tissue Homogeneity" value="98.4%" />
                <DiagnosticMetric label="Stress Points (N)" value="0.02" />
             </div>
          </Card>

          <Card title="Localization Log" className="flex-1">
             <div className="space-y-6">
                <Coordinate x="44.23" y="12.01" z="98.4" />
                <Coordinate x="12.00" y="33.91" z="12.8" />
                <Coordinate x="88.11" y="04.55" z="21.0" />
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Marker = ({ top, left }) => (
    <div className="absolute w-10 h-10 border-4 border-white/40 rounded-full bg-rose-500/80 shadow-[0_0_30px_rgba(244,63,94,0.8)] z-20 flex items-center justify-center cursor-pointer hover:scale-125 transition-all" 
         style={{ top, left }}>
        <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
    </div>
);

const ControlButton = ({ icon, label }) => (
    <button className="flex flex-col items-center gap-3 group text-slate-400 hover:text-sky-400 transition-all">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest opacity-50 group-hover:opacity-100">{label}</span>
    </button>
);

const Card = ({ title, children, className }) => (
    <div className={`bg-slate-900/50 p-10 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md ${className}`}>
        <h2 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10">{title}</h2>
        {children}
    </div>
);

const DiagnosticMetric = ({ label, value }) => (
    <div className="flex justify-between items-baseline border-b border-white/5 pb-4">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <span className="text-sky-400 font-black text-xl">{value}</span>
    </div>
);

const Coordinate = ({ x, y, z }) => (
    <div className="flex items-center text-slate-300 text-xs font-mono bg-black/30 p-4 rounded-xl border border-white/5">
        <span className="flex-1"><span className="text-slate-600 mr-2">X:</span>{x}</span>
        <span className="flex-1"><span className="text-slate-600 mr-2">Y:</span>{y}</span>
        <span className="flex-1"><span className="text-slate-600 mr-2">Z:</span>{z}</span>
    </div>
);

export default Analysis;
