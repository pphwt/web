import React, { useState } from 'react';
import { ScanEye, Grid3X3, Rotate3d } from 'lucide-react';
import BrainModel3D from '../components/ui/BrainModel3D';

const Analysis = () => {
  const [depth, setDepth] = useState(42);

  return (
    <div className="p-10 font-sans h-full min-h-screen bg-[#070b14] flex flex-col">
      <h1 className="text-4xl font-bold text-[#4FD1C5] mb-10 tracking-wide">3D Analysis</h1>

      <div className="flex-1 grid grid-cols-12 gap-10 max-w-[1600px] w-full mx-auto">
        {/* Main 3D View Portal */}
        <div className="col-span-8 flex flex-col gap-6 h-[800px]">
          <div className="flex-1 bg-[#23293e]/30 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 w-full h-full">
               
               {/* 3D Canvas */}
               <BrainModel3D />
               
               {/* Glowing Marker 1 */}
               <div className="absolute top-[48%] left-[58%] w-8 h-8 border-[3px] border-white/80 rounded-full bg-[#ff5252]/90 shadow-[0_0_25px_rgba(255,82,82,1)] z-20 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
               </div>
               
               {/* Glowing Marker 2 */}
               <div className="absolute top-[68%] left-[68%] w-8 h-8 border-[3px] border-white/80 rounded-full bg-[#ff5252]/90 shadow-[0_0_25px_rgba(255,82,82,1)] z-20 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
               </div>
            </div>
          </div>

          {/* Bottom Control Bar */}
          <div className="bg-[#181d2d] border border-white/10 rounded-2xl py-6 px-10 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
             <div className="flex items-center gap-14">
                <button className="flex flex-col items-center gap-3 group">
                   <div className="text-white group-hover:text-[#4FD1C5] transition-all">
                      <ScanEye size={26} strokeWidth={1.5} />
                   </div>
                   <span className="text-[11px] font-medium text-slate-400 group-hover:text-[#4FD1C5] transition-colors">ViewSlice</span>
                </button>
                <button className="flex flex-col items-center gap-3 group">
                   <div className="text-white group-hover:text-[#4FD1C5] transition-all">
                      <Grid3X3 size={26} strokeWidth={1.5} />
                   </div>
                   <span className="text-[11px] font-medium text-slate-400 group-hover:text-[#4FD1C5] transition-colors">Opacity</span>
                </button>
                <button className="flex flex-col items-center gap-3 group">
                   <div className="text-white group-hover:text-[#4FD1C5] transition-all">
                      <Rotate3d size={26} strokeWidth={1.5} />
                   </div>
                   <span className="text-[11px] font-medium text-slate-400 group-hover:text-[#4FD1C5] transition-colors">Rotation</span>
                </button>
             </div>

             <div className="h-16 w-[1px] bg-white/10 mx-6"></div>

             <div className="flex-1 flex items-center gap-12 pr-6">
                <div className="flex flex-col gap-3 flex-1">
                   <div className="flex justify-between items-center text-[12px]">
                      <span className="text-white font-medium">Depth Axis</span>
                      <span className="text-white font-medium">{depth}%</span>
                   </div>
                   <input 
                      type="range" 
                      min="0" max="100" 
                      value={depth} 
                      onChange={(e) => setDepth(e.target.value)}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ 
                          background: `linear-gradient(to right, #4FD1C5 0%, #4FD1C5 ${depth}%, #2d3748 ${depth}%, #2d3748 100%)`
                      }}
                   />
                </div>
                
                <button className="flex flex-col items-start justify-center pl-10 border-l border-white/10 h-16 group">
                   <span className="text-[12px] text-white font-medium leading-[1.3] group-hover:text-[#4FD1C5] transition-colors">
                      Capture<br />frame
                   </span>
                </button>
             </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="col-span-4 space-y-8 flex flex-col h-[800px]">
          {/* Structural Integrity Card */}
          <div className="bg-[#181d2d] p-8 rounded-2xl border border-white/5 shadow-2xl">
             <h2 className="text-white text-lg font-medium mb-8">Structural Integrity</h2>
             
             <div className="space-y-8 mb-4">
                <div className="space-y-3">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-[#4FD1C5] font-medium">Tissue Homogeneity</span>
                      <span className="text-[#4FD1C5] font-medium">98.4%</span>
                   </div>
                   <div className="h-2.5 w-full bg-[#0b0e14]/80 rounded-r-full overflow-hidden">
                      <div className="h-full bg-[#4FD1C5] w-[98.4%]"></div>
                   </div>
                </div>

                <div className="space-y-3">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-300 font-medium">Stress Points (N)</span>
                      <span className="text-[#EAB308] font-medium">0.02</span>
                   </div>
                   <div className="h-2.5 w-full bg-[#0b0e14]/80 rounded-r-full overflow-hidden">
                      <div className="h-full bg-[#EAB308] w-[8%]"></div>
                   </div>
                </div>
             </div>
          </div>

          {/* Neurological Targets Card */}
          <div className="bg-[#181d2d] p-8 rounded-2xl border border-white/5 shadow-2xl flex-1">
             <h2 className="text-white text-lg font-medium mb-10">Localization Points</h2>
             
             <div className="space-y-10">
                {[
                  { x: "44.23", y: "12.01", z: "98.4" },
                  { x: "12.00", y: "33.91", z: "12.8" },
                  { x: "88.11", y: "04.55", z: "21.0" }
                ].map((point, idx) => (
                  <div key={idx} className="flex items-center text-slate-100 text-[15px] font-medium tracking-wide">
                     <span className="w-20">X: {point.x}</span>
                     <span className="text-slate-500 mx-2">|</span>
                     <span className="w-20">Y: {point.y}</span>
                     <span className="text-slate-500 mx-2">|</span>
                     <span className="w-20">Z: {point.z}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
