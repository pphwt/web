import React from 'react';
import { BarChart } from './BarChart';
import { StatPill } from './StatPill';

export const AnalyticCard = ({ title, data, color, highlightIndex, stats, badge, badgeColor }) => (
  <div className="flex-1 bg-[#1a1f2e] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col gap-6 group hover:border-[#4FD1C5]/20 transition-all">
    {/* Header */}
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Signal Analytics</p>
        <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
      </div>
      <span 
        className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
        style={{ 
          backgroundColor: `${badgeColor}15`, 
          color: badgeColor, 
          borderColor: `${badgeColor}30` 
        }}
      >
        {badge}
      </span>
    </div>

    {/* Chart */}
    <div className="px-1">
      <BarChart data={data} color={color} highlightIndex={highlightIndex} />
    </div>

    {/* Stats row */}
    <div className="flex gap-6 pt-4 border-t border-white/5 items-center justify-center">
      {stats.map((s) => (
        <StatPill key={s.label} label={s.label} value={s.value} color={s.color} small={s.small} />
      ))}
    </div>
  </div>
);
