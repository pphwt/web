import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis } from 'recharts';
import BrainModel3D from '../components/ui/BrainModel3D';

const LiveMonitoring = () => {
  // Mock data for ECG Stream (Realistic P-QRS-T wave simulation)
  const generateECG = () => {
    const data = [];
    for (let i = 0; i < 200; i++) {
        // baseline wander
        let val = 15;
        let cycle = i % 40;
        
        if (cycle === 4) val += 1.5; // P wave
        else if (cycle === 5) val += 2;
        else if (cycle === 6) val += 1.5;
        
        else if (cycle === 12) val -= 2; // Q
        else if (cycle === 13) val += 10; // R
        else if (cycle === 14) val -= 4; // S
        else if (cycle === 15) val -= 1;
        
        else if (cycle >= 22 && cycle <= 28) {
            // T wave
            val += 2.5 * Math.sin((cycle - 22) * Math.PI / 6);
        }
        
        data.push({ time: i, val1: val });
    }
    return data;
  };
  const ecgData = generateECG();

  return (
    <div className="p-10 font-sans h-full min-h-screen bg-[#070b14] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 w-full max-w-[1600px] mx-auto">
        <h1 className="text-4xl font-bold text-[#4FD1C5] tracking-wide mt-2">Live Monitoring</h1>
        
        {/* Right side selector */}
        <div className="flex flex-col">
           <span className="text-[10px] font-bold text-slate-400 mb-2 pl-1">Select People</span>
           <div className="bg-[#181d2d] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between min-w-[350px] shadow-lg cursor-pointer">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-white/20">
                    {/* Placeholder icon profile */}
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-slate-300 transform mt-2">
                       <circle cx="12" cy="8" r="4" fill="currentColor"/>
                       <path d="M4 22C4 17.5817 7.58172 14 12 14C16.4183 14 20 17.5817 20 22" fill="currentColor"/>
                    </svg>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-white font-medium text-sm">Mr. John Doe</span>
                    <span className="text-slate-400 text-xs">Age : 20 , Height : 170 , Weight : 55</span>
                 </div>
              </div>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1 max-w-[1600px] w-full mx-auto">
        {/* Left Column */}
        <div className="col-span-3 lg:col-span-4 xl:col-span-3 space-y-6 flex flex-col">
          
          {/* Patient Summary Card */}
          <div className="bg-[#181d2d] p-6 rounded-2xl border border-white/5 shadow-xl h-[340px] flex flex-col">
             <div className="flex items-center gap-3 text-[#8e95a5] text-[11px] font-bold uppercase tracking-widest mb-6">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                PATIENT SUMMARY
             </div>
             
             <div className="flex-1 flex flex-col items-center justify-center">
                <div className="flex gap-8 items-center w-full justify-center">
                    <div className="w-32 h-32 rounded-xl bg-[#23293e]/50 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                       {/* SVG Person shape mimicking illustration */}
                       <svg viewBox="0 0 100 100" className="w-[80%] h-[80%] opacity-80" fill="none">
                          <path d="M50 55 C35 55 25 45 25 30 C25 15 35 10 50 10 C65 10 75 15 75 30 C75 45 65 55 50 55 Z" fill="#d4a373" />
                          <path d="M20 90 C20 70 30 65 50 65 C70 65 80 70 80 90 L80 100 L20 100 Z" fill="#4a5568" />
                       </svg>
                    </div>
                    <div className="flex flex-col gap-3">
                       <h2 className="text-white text-lg font-bold">Mr. John Doe</h2>
                       <div className="flex flex-col gap-2 text-sm text-slate-300">
                          <span>Age : 20</span>
                          <span>Height : 170</span>
                          <span>Weight : 55</span>
                       </div>
                    </div>
                </div>
             </div>
          </div>

          {/* PINNS Insights Card */}
          <div className="bg-[#181d2d] p-7 rounded-2xl border border-white/5 shadow-xl flex-1 flex flex-col justify-between">
             <p className="text-[#8e95a5] text-[11px] font-bold uppercase tracking-widest mb-6">PINNS INSIGHTS</p>
             
             <div className="space-y-6">
                 <div>
                    <h3 className="text-[#4FD1C5] font-medium text-15px] mb-2">Predictive Haemodynamics</h3>
                    <p className="text-slate-300 text-[13px] leading-relaxed pr-4">
                       System predicts 4% increase in aortic pressure within 2 hours based on fluid retention trends.
                    </p>
                 </div>
                 
                 <div>
                    <h3 className="text-[#EAB308] font-medium text-[15px] mb-2">Myocardial Fatigue Index</h3>
                    <p className="text-slate-300 text-[13px] leading-relaxed pr-4">
                       Strain analysis shows minor localized decoupling in the left ventricle apex.
                    </p>
                 </div>
             </div>

             <div className="mt-8 space-y-3">
                <div className="h-1.5 w-full bg-[#0b0e14] rounded-full overflow-hidden">
                    <div className="h-full bg-[#4FD1C5] w-[85%]"></div>
                </div>
                <p className="text-slate-300 text-sm font-medium">Model Confidence: 98.2% Accurate</p>
             </div>
          </div>
        </div>

        {/* Center/Right Area */}
        <div className="col-span-9 lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
          {/* Top Row: EEG Stream */}
          <div className="bg-[#181d2d] p-7 rounded-2xl border border-white/5 shadow-xl flex flex-col">
            <p className="text-[#8e95a5] text-[11px] font-bold uppercase tracking-widest mb-6">ECG STREAM - LEAD II</p>
            
            <div className="bg-[#0b0e14]/60 h-64 rounded-xl border border-white/5 p-4 relative overflow-hidden group flex-1">
              {/* Background Grid Lines representing medical paper */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" 
                   style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
              </div>
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                   style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }}>
              </div>

              {/* Labels */}
              <div className="absolute left-6 top-8 text-[#8e95a5] text-xs font-bold">Fp1-F7</div>
              <div className="absolute left-6 bottom-16 text-[#8e95a5] text-xs font-bold">Fp2-F8</div>

              <div className="w-full h-full min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ecgData}>
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={[0, 30]} />
                    <Line type="monotone" dataKey="val1" stroke="#4FD1C5" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Metrics Bar */}
            <div className="mt-6 flex items-center justify-start gap-3">
               <span className="text-[#8e95a5] text-[12px] font-bold tracking-widest uppercase">HEART RATE</span>
               <div className="flex items-baseline gap-1">
                  <span className="text-[#4FD1C5] font-bold text-lg">72</span>
                  <span className="text-[#4FD1C5] text-[10px] font-bold uppercase">BPM</span>
               </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-2 gap-6 h-[340px]">
             {/* Anatomical Localization */}
             <div className="bg-[#181d2d] p-7 rounded-2xl border border-white/5 shadow-xl flex flex-col h-full">
                <p className="text-[#8e95a5] text-[11px] font-bold uppercase tracking-widest mb-4">ANATOMICAL LOCALIZATION</p>
                <div className="flex-1 rounded-xl bg-[#23293e]/30 border border-white/10 overflow-hidden relative">
                   <BrainModel3D />
                </div>
             </div>

             {/* Localized Zone Stress */}
             <div className="bg-[#181d2d] p-7 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-center gap-8 h-full">
                <p className="text-slate-300 text-sm font-medium">Localized Zone Stress</p>
                
                <div className="space-y-6">
                   <div className="space-y-3">
                      <div className="flex justify-between items-center text-[13px]">
                         <span className="text-white font-medium">Mitral Valve Flow</span>
                         <span className="text-[#4FD1C5]">Normal</span>
                      </div>
                      <div className="h-2 w-full bg-[#0b0e14] rounded-full overflow-hidden">
                         <div className="h-full bg-[#4FD1C5] w-[80%] rounded-r-full"></div>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <div className="flex justify-between items-center text-[13px]">
                         <span className="text-white font-medium">Aortic Root Dilation</span>
                         <span className="text-[#EAB308]">Monitor</span>
                      </div>
                      <div className="h-2 w-full bg-[#0b0e14] rounded-full overflow-hidden">
                         <div className="h-full bg-[#EAB308] w-[60%] rounded-r-full"></div>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <div className="flex justify-between items-center text-[13px]">
                         <span className="text-white font-medium">Septal Wall Strain</span>
                         <span className="text-[#4FD1C5]">Stable</span>
                      </div>
                      <div className="h-2 w-full bg-[#0b0e14] rounded-full overflow-hidden">
                         <div className="h-full bg-[#4FD1C5] w-[90%] rounded-r-full"></div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitoring;