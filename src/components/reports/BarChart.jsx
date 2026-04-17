import React from 'react';

export const BarChart = ({ data, color, highlightIndex }) => {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1 h-[60px]">
      {data.map((v, i) => {
        const heightPercent = Math.max(10, (v / max) * 100);
        const isHigh = i === highlightIndex;
        
        return (
          <div
            key={i}
            title={v}
            className="flex-1 rounded-t-sm transition-all duration-300"
            style={{
              height: `${heightPercent}%`,
              backgroundColor: isHigh ? '#ef4444' : color,
              opacity: isHigh ? 1 : 0.4,
              boxShadow: isHigh ? '0 0 12px rgba(239, 68, 68, 0.4)' : 'none'
            }}
          />
        );
      })}
    </div>
  );
};
