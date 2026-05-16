import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { BarChart } from './BarChart';
import { StatPill } from './StatPill';

export const AnalyticCard = ({ title, data, color, highlightIndex, stats, badge, badgeColor }) => {
  const { isDarkMode: dk } = useTheme();

  return (
    <div className={`flex-1 rounded-2xl border p-6 flex flex-col gap-6 transition-all ${
      dk
        ? 'bg-[#0d1525] border-white/[0.06] hover:border-sky-500/20'
        : 'bg-white border-slate-200 hover:border-sky-300'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className={`text-[10px] uppercase font-semibold tracking-widest mb-1 ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
            Signal Analytics
          </p>
          <h3 className={`text-sm font-bold tracking-tight ${dk ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
        </div>
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
          style={{
            backgroundColor: `${badgeColor}15`,
            color: badgeColor,
            borderColor: `${badgeColor}30`,
          }}
        >
          {badge}
        </span>
      </div>

      {/* Chart */}
      <div className="px-1">
        <BarChart data={data} color={color} highlightIndex={highlightIndex} dk={dk} />
      </div>

      {/* Stats row */}
      <div className={`flex gap-6 pt-4 border-t items-center justify-center ${dk ? 'border-white/[0.06]' : 'border-slate-100'}`}>
        {stats.map((s) => (
          <StatPill key={s.label} label={s.label} value={s.value} color={s.color} small={s.small} dk={dk} />
        ))}
      </div>
    </div>
  );
};
