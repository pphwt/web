import React, { useState } from 'react';
import { ScanEye, Grid3X3, Rotate3d, Camera } from 'lucide-react';
import HeartModel3D from '../components/ui/HeartModel3D';

const Analysis = () => {
  const [depth, setDepth] = useState(42);

  return (
    <div className="p-10 font-sans h-full flex flex-col">
      <h1 className="text-4xl font-bold text-[#4FD1C5] mb-10">3D Analysis</h1>

      <div className="flex-1 grid grid-cols-12 gap-10">
        {/* Main 3D View Portal */}
        <div className="col-span-8 flex flex-col gap-6">
          <div className="flex-1 bg-[#1a1f2e] rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#0b0e14]/50 z-0"></div>
            <div className="relative z-10 w-full h-full p-4">
               {/* Markers Layer (Simulation) */}
               <div className="absolute top-[40%] left-[45%] w-6 h-6 border-2 border-white rounded-full bg-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.8)] z-20 flex items-center justify-center cursor-pointer hover:scale-125 transition-transform">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
               </div>
               <div className="absolute top-[60%] left-[55%] w-6 h-6 border-2 border-white rounded-full bg-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.8)] z-20 flex items-center justify-center cursor-pointer hover:scale-125 transition-transform">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
               </div>

               <HeartModel3D />
               
               {/* Arc visualization (Simulation) */}
               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30 z-10" viewBox="0 0 100 100">
                  <path d="M48 40 Q 60 45, 65 75" fill="none" stroke="white" strokeWidth="0.2" strokeDasharray="1 1" />
               </svg>
            </div>
          </div>

          {/* Bottom Control Bar */}
          <div className="bg-[#131826] border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-xl">
             <div className="flex items-center gap-8 pl-4">
                <button className="flex flex-col items-center gap-2 group">
                   <div className="p-2 rounded-lg bg-[#2d3748] group-hover:bg-[#4FD1C5]/20 group-hover:text-[#4FD1C5] transition-all">
                      <ScanEye size={20} />
                   </div>
                   <span className="text-[10px] uppercase font-bold text-slate-500">ViewSlice</span>
                </button>
                <button className="flex flex-col items-center gap-2 group">
                   <div className="p-2 rounded-lg bg-[#2d3748] group-hover:bg-[#4FD1C5]/20 group-hover:text-[#4FD1C5] transition-all">
                      <Grid3X3 size={20} />
                   </div>
                   <span className="text-[10px] uppercase font-bold text-slate-500">Opacity</span>
                </button>
                <button className="flex flex-col items-center gap-2 group">
                   <div className="p-2 rounded-lg bg-[#2d3748] group-hover:bg-[#4FD1C5]/20 group-hover:text-[#4FD1C5] transition-all">
                      <Rotate3d size={20} />
                   </div>
                   <span className="text-[10px] uppercase font-bold text-slate-500">Rotation</span>
                </button>
             </div>

             <div className="h-10 w-px bg-white/10 mx-6"></div>

             <div className="flex-1 flex items-center gap-6">
                <div className="flex flex-col gap-1 flex-1">
                   <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                      <span>Depth Axis</span>
                      <span>{depth}%</span>
                   </div>
                   <input 
                      type="range" 
                      min="0" max="100" 
                      value={depth} 
                      onChange={(e) => setDepth(e.target.value)}
                      className="w-full accent-[#4FD1C5] bg-[#2d3748] h-1.5 rounded-full appearance-none cursor-pointer"
                   />
                </div>
                
                <button className="flex flex-col items-center gap-2 px-6 group border-l border-white/5">
                   <span className="text-[10px] text-white font-bold leading-tight group-hover:text-[#4FD1C5] transition-colors whitespace-pre">Capture{"\n"}frame</span>
                </button>
             </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="col-span-4 space-y-8">
          {/* Structural Integrity Card */}
          <div className="bg-[#1a1f2e] p-6 rounded-2xl border border-white/5 shadow-xl">
             <p className="text-[#8e95a5] text-[10px] font-bold uppercase tracking-widest mb-8">Structural Integrity</p>
             <div className="space-y-10">
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-[#4FD1C5]">Tissue Homogeneity</span>
                      <span className="text-[#4FD1C5]">98.4%</span>
                   </div>
                   <div className="h-2 w-full bg-[#0b0e14] rounded-full overflow-hidden">
                      <div className="h-full bg-[#4FD1C5] w-[98.4%] shadow-[0_0_8px_rgba(79,209,197,0.4)]"></div>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-400">Stress Points (N)</span>
                      <span className="text-[#EAB308]">0.02</span>
                   </div>
                   <div className="h-2 w-full bg-[#0b0e14] rounded-full overflow-hidden">
                      <div className="h-full bg-[#EAB308] w-[20%] shadow-[0_0_8px_rgba(234,179,8,0.4)]"></div>
                   </div>
                </div>
             </div>
          </div>

          {/* Localization Points Card */}
          <div className="bg-[#1a1f2e] p-6 rounded-2xl border border-white/5 shadow-xl flex-1 flex flex-col">
             <p className="text-[#8e95a5] text-[10px] font-bold uppercase tracking-widest mb-10">Localization Points</p>
             <div className="space-y-10">
                {[
                  { x: "44.23", y: "12.01", z: "98.4" },
                  { x: "12.00", y: "33.91", z: "12.8" },
                  { x: "88.11", y: "04.55", z: "21.0" }
                ].map((point, idx) => (
                  <div key={idx} className="flex items-center gap-4 text-white font-mono text-sm tracking-widest opacity-80 border-b border-white/5 pb-4 last:border-0">
                     <span>X: {point.x}</span>
                     <span className="text-slate-600">|</span>
                     <span>Y: {point.y}</span>
                     <span className="text-slate-600">|</span>
                     <span>Z: {point.z}</span>
                  </div>
                ))}
             </div>
             <div className="mt-auto pt-10 px-4">
                <div className="w-full h-32 rounded-xl bg-[#0b0e14]/50 border border-white/5 flex items-center justify-center">
                   <ScanEye className="text-slate-700" size={48} />
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
