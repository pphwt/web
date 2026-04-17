import React from 'react';
import { usePatients } from '../hooks/usePatients';
import PatientSelector from '../components/layout/PatientSelector';

const Waveform = ({ color }) => (
  <svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 10H10L13 2L17 18L20 10H30L33 2L37 18L40 10H60" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PatientList = () => {
  const { patients } = usePatients();

  return (
    <div className="p-10 font-sans">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold text-[#4FD1C5]">Patient List</h1>
        <PatientSelector />
      </div>
      
      {/* Cards Section */}
      <div className="grid grid-cols-2 gap-5 mb-8">
        <div className="bg-[#131826] p-6 rounded-b-lg border-t-4 border-[#8e95a5] flex flex-col justify-center min-h-[140px] shadow-lg">
          <p className="text-[#8e95a5] text-sm mb-4">Signal Quality</p>
          <div className="flex items-center gap-3">
            <p className="text-4xl text-[#f87171] leading-none">25% <span className="text-2xl font-bold">+</span></p>
            <p className="text-xs text-[#8e95a5] pt-2">(Default : 45.2%)</p>
          </div>
        </div>
        <div className="bg-[#131826] p-6 rounded-b-lg border-t-4 border-[#f87171] flex justify-between items-center min-h-[140px] shadow-lg">
          <div>
            <p className="text-[#8e95a5] text-sm mb-4">Risk Level</p>
            <p className="text-4xl text-[#ef4444] font-bold leading-none">Critical</p>
          </div>
          <div className="bg-[#8a4046] w-12 h-12 rounded-full flex items-center justify-center border-2 border-[#8a4046]">
            <span className="text-[#f87171] text-2xl font-bold">!</span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#131826]/50 rounded-xl border border-[#1e2538] overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead className="bg-[#1e2538]/80 text-[#4FD1C5] text-xs uppercase tracking-wider">
            <tr>
              <th className="px-8 py-5">Patient Identity</th>
              <th className="px-5 py-5 text-center">Status</th>
              <th className="px-5 py-5 text-center">Vitals (BPM)</th>
              <th className="px-5 py-5 text-center">Diagnostic Signal</th>
              <th className="px-8 py-5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2538]">
            {patients.map((p, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="px-8 py-8 text-slate-300 font-medium">{p.id}</td>
                <td className="px-5 py-8 text-center">
                  <span className="inline-block px-3 py-1 rounded border text-[10px] font-bold" 
                    style={{ 
                      backgroundColor: `${p.color}15`, 
                      borderColor: `${p.color}40`, 
                      color: p.color 
                    }}>
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-8 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-bold mb-1" style={{ color: p.color }}>{p.bpm}</span>
                    <span className="bg-[#1e2538] text-[9px] text-slate-500 px-2 py-0.5 rounded border border-white/5">
                      {p.type}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Waveform color={p.color} />
                    <div className="flex gap-1">
                      {(p.diagnosticTags || []).map((tag, idx) => (
                        <span key={idx} className="bg-[#1e2538] text-[8px] text-slate-400 px-1.5 py-0.5 rounded border border-white/5 whitespace-nowrap">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="px-8 py-8 text-center">
                  <button className="bg-[#2d3748] hover:bg-[#3a475c] text-slate-300 text-[10px] font-bold py-2 px-4 rounded transition-colors whitespace-nowrap shadow-sm border border-white/5 uppercase">
                    {p.actionLabel || 'View Analysis'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientList;
