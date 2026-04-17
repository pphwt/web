import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import HeartModel3D from '../components/HeartModel3D';

const LiveMonitoring = () => {
  const ecgData = Array.from({ length: 40 }, (_, i) => ({
    val: 10 + Math.sin(i * 0.8) * 5 + (Math.random() * 2)
  }));

  return (
    <div className="animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Live Monitoring</h2>
        <div className="bg-[#161B2A] px-4 py-2 rounded-lg border border-cyan-900/50 text-xs text-cyan-400">
          PINN ENGINE: LINKED
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* กล่องหัวใจ 3D (Anatomical Localization) */}
        <div className="col-span-8 bg-[#161B2A] p-6 rounded-3xl border border-gray-800/50 h-[500px] flex flex-col relative">
          <p className="text-gray-500 text-[10px] mb-4 uppercase tracking-[0.2em] font-bold">Anatomical Localization</p>
          <div className="flex-1 rounded-2xl bg-[#0B0F1A]/50">
            <HeartModel3D />
          </div>
        </div>

        {/* ฝั่งขวา (Summary & Graph) */}
        <div className="col-span-4 space-y-6">
          <div className="bg-[#161B2A] p-6 rounded-3xl border border-gray-800/50">
            <p className="text-gray-400 text-[10px] mb-4 font-bold uppercase tracking-widest">Patient Summary</p>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-800 rounded-xl border border-gray-700"></div>
              <div>
                <p className="font-bold text-white">Mr. John Doe</p>
                <p className="text-[10px] text-gray-500">Age: 20 | 170 cm | 55 kg</p>
              </div>
            </div>
          </div>

          <div className="bg-[#161B2A] p-6 rounded-3xl border border-gray-800/50">
            <p className="text-gray-500 text-[10px] mb-4 uppercase tracking-[0.2em] font-bold">EEG Stream - Lead II</p>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ecgData}>
                  <Line type="monotone" dataKey="val" stroke="#22d3ee" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitoring;