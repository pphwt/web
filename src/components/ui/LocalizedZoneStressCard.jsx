import React from 'react';

const StressIndicator = ({ label, value, status, color }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center text-[11px] font-bold">
      <span className="text-[#8e95a5] uppercase tracking-tighter">{label}</span>
      <span style={{ color }}>{status}</span>
    </div>
    <div className="h-2 w-full bg-[#2d3748] rounded-full overflow-hidden">
      <div 
        className="h-full transition-all duration-1000 ease-out" 
        style={{ width: `${value}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}
      ></div>
    </div>
  </div>
);

const LocalizedZoneStressCard = () => {
  return (
    <div className="bg-[#1a1f2e] p-6 rounded-2xl border border-white/5 shadow-xl h-full">
      <p className="text-[#8e95a5] text-[10px] font-bold uppercase tracking-widest mb-8">Localized Zone Stress</p>
      
      <div className="space-y-8">
        <StressIndicator 
          label="Mitral Valve Flow" 
          status="Normal" 
          value={85} 
          color="#4FD1C5" 
        />
        <StressIndicator 
          label="Aortic Root Dilation" 
          status="Monitor" 
          value={70} 
          color="#EAB308" 
        />
        <StressIndicator 
          label="Septal Wall Strain" 
          status="Stable" 
          value={90} 
          color="#4FD1C5" 
        />
      </div>
    </div>
  );
};

export default LocalizedZoneStressCard;
