import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { usePatients } from '../hooks/usePatients';
import PatientSelector from '../components/layout/PatientSelector';
import HeartModel3D from '../components/ui/HeartModel3D';
import PatientSummaryCard from '../components/ui/PatientSummaryCard';
import PinnsInsightsCard from '../components/ui/PinnsInsightsCard';
import LocalizedZoneStressCard from '../components/ui/LocalizedZoneStressCard';

const LiveMonitoring = () => {
  const { currentPatient } = usePatients();
  
  const ecgData = Array.from({ length: 100 }, (_, i) => ({
    val: 10 + Math.sin(i * 0.4) * 8 + (Math.random() * 3)
  }));

  return (
    <div className="p-10 font-sans animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-[#4FD1C5]">Live Monitoring</h1>
        <PatientSelector />
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="col-span-3 space-y-8">
          <div className="h-[400px]">
            <PatientSummaryCard patient={currentPatient} />
          </div>
          <div className="h-[400px]">
            <PinnsInsightsCard />
          </div>
        </div>

        {/* Center/Right Area */}
        <div className="col-span-9 flex flex-col gap-8">
          {/* Top Row: ECG Stream */}
          <div className="bg-[#1a1f2e] p-6 rounded-2xl border border-white/5 shadow-xl">
            <p className="text-[#8e95a5] text-[10px] font-bold uppercase tracking-widest mb-6">ECG STREAM - LEAD II</p>
            <div className="bg-[#0b0e14] h-64 rounded-xl border border-white/5 p-4 relative overflow-hidden group">
              <div className="absolute inset-0 opacity-10 pointer-events-none" 
                   style={{ backgroundImage: 'linear-gradient(#4FD1C5 1px, transparent 1px), linear-gradient(90deg, #4FD1C5 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ecgData}>
                  <YAxis hide domain={[0, 30]} />
                  <Line 
                    type="monotone" 
                    dataKey="val" 
                    stroke="#4FD1C5" 
                    strokeWidth={2.5} 
                    dot={false} 
                    isAnimationActive={false} 
                    className="drop-shadow-[0_0_8px_rgba(79,209,197,0.8)]"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-start gap-3">
               <span className="text-[#8e95a5] text-[10px] uppercase font-bold tracking-widest">Heart Rate</span>
               <span className="text-xl font-bold text-[#4FD1C5]">{currentPatient.bpm} <span className="text-[10px] text-[#8e95a5]">BPM</span></span>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-2 gap-8 flex-1">
             {/* Anatomical Localization */}
             <div className="bg-[#1a1f2e] p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col h-[400px]">
                <p className="text-[#8e95a5] text-[10px] font-bold uppercase tracking-widest mb-6">Anatomical Localization</p>
                <div className="flex-1 rounded-xl bg-[#0b0e14] border border-white/5 overflow-hidden">
                   <HeartModel3D />
                </div>
             </div>

             {/* Localized Zone Stress */}
             <div className="h-[400px]">
                <LocalizedZoneStressCard />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitoring;