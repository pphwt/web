import React from 'react';

export const StatPill = ({ label, value, color, small, dk }) => (
  <div className="flex flex-col items-center min-w-[56px]">
    <span
      className={`font-bold leading-none ${small ? 'text-lg' : 'text-xl'}`}
      style={{ color }}
    >
      {value}
    </span>
    <span className={`text-[9px] uppercase tracking-tighter mt-1 font-semibold ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
      {label}
    </span>
  </div>
);
