import React from 'react';
import { User } from 'lucide-react';

const PatientSummaryCard = ({ patient }) => {
  return (
    <div className="bg-[#1a1f2e] p-6 rounded-2xl border border-white/5 shadow-xl h-full">
      <p className="text-[#8e95a5] text-[10px] font-bold uppercase tracking-widest mb-6">Patient Summary</p>
      
      <div className="flex flex-col items-center">
        <div className="w-32 h-32 bg-[#2d3748] rounded-xl flex items-center justify-center overflow-hidden mb-6 border border-white/10 shadow-inner">
          <User className="text-[#8e95a5]" size={64} />
        </div>
        
        <div className="w-full space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-[#8e95a5] text-xs font-medium">Name</span>
            <span className="text-white text-sm font-bold">{patient.name}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-[#8e95a5] text-xs font-medium">Age</span>
            <span className="text-white text-sm font-bold">{patient.age}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-[#8e95a5] text-xs font-medium">Height</span>
            <span className="text-white text-sm font-bold">{patient.height} cm</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#8e95a5] text-xs font-medium">Weight</span>
            <span className="text-white text-sm font-bold">{patient.weight} kg</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientSummaryCard;
