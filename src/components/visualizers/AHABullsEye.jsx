import React, { useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';

// AHA 17-segment coronary territory
const TERRITORY = {
  1:'LAD',2:'LAD',3:'RCA',4:'RCA',5:'LCx',6:'LCx',
  7:'LAD',8:'LAD',9:'RCA',10:'RCA',11:'LCx',12:'LCx',
  13:'LAD',14:'LAD',15:'RCA',16:'LCx',17:'LAD',
};

const TERRITORY_COLOR = { LAD: '#ef4444', RCA: '#22c55e', LCx: '#f59e0b' };
const TERRITORY_LABEL = { LAD: 'LAD', RCA: 'RCA', LCx: 'LCx' };

const SEG_LABEL = {
  1:'Ant',2:'AntSep',3:'InfSep',4:'Inf',5:'InfLat',6:'AntLat',
  7:'Ant',8:'AntSep',9:'InfSep',10:'Inf',11:'InfLat',12:'AntLat',
  13:'Ant',14:'Sep',15:'Inf',16:'Lat',17:'Apex',
};

// Draw a ring sector (annular segment) in SVG polar coords
function sector(cx, cy, r1, r2, startDeg, endDeg) {
  const toRad = (d) => (d - 90) * (Math.PI / 180); // 0° = 12 o'clock
  const s = toRad(startDeg), e = toRad(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x1, y1] = p(r1, s), [x2, y2] = p(r2, s);
  const [x3, y3] = p(r2, e), [x4, y4] = p(r1, e);
  return `M${x1},${y1} L${x2},${y2} A${r2},${r2},0,${large},1,${x3},${y3} L${x4},${y4} A${r1},${r1},0,${large},0,${x1},${y1}Z`;
}

// Text anchor position for a segment label
function labelPos(cx, cy, r, midDeg) {
  const rad = (midDeg - 90) * (Math.PI / 180);
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

const AHABullsEye = ({ activeSegment = 0, activationPerSeg = {}, aha }) => {
  const { isDarkMode: dk } = useTheme();
  const cx = 110, cy = 110;
  const R = [88, 64, 40, 18]; // outer→inner ring radii: basal, mid, apical, center

  // Per-segment fill: dim base color, brighten if active
  const fill = (seg) => {
    const base  = TERRITORY_COLOR[TERRITORY[seg]];
    const isAct = seg === activeSegment;
    const alpha = isAct ? 'dd' : '44';
    return base + alpha;
  };

  // Basal: 6 × 60°, Mid: 6 × 60°, Apical: 4 × 90°, Apex: full circle
  const basalSegs  = [1,2,3,4,5,6];
  const midSegs    = [7,8,9,10,11,12];
  const apicalSegs = [13,14,15,16];

  const stroke = dk ? '#1e293b' : '#f1f5f9';
  const activeBorder = activeSegment > 0 ? TERRITORY_COLOR[TERRITORY[activeSegment]] : '#fff';

  return (
    <div className="flex flex-col gap-2">
      {/* Diagram */}
      <svg width={220} height={220} viewBox="0 0 220 220">
        {/* Basal ring */}
        {basalSegs.map((seg, i) => {
          const start = i * 60, end = (i + 1) * 60;
          return (
            <path key={seg} d={sector(cx, cy, R[1], R[0], start, end)}
              fill={fill(seg)}
              stroke={seg === activeSegment ? activeBorder : stroke}
              strokeWidth={seg === activeSegment ? 2.5 : 0.8}
            />
          );
        })}
        {/* Mid ring */}
        {midSegs.map((seg, i) => {
          const start = i * 60, end = (i + 1) * 60;
          return (
            <path key={seg} d={sector(cx, cy, R[2], R[1], start, end)}
              fill={fill(seg)}
              stroke={seg === activeSegment ? activeBorder : stroke}
              strokeWidth={seg === activeSegment ? 2.5 : 0.8}
            />
          );
        })}
        {/* Apical ring — 4 × 90° */}
        {apicalSegs.map((seg, i) => {
          const start = i * 90, end = (i + 1) * 90;
          return (
            <path key={seg} d={sector(cx, cy, R[3], R[2], start, end)}
              fill={fill(seg)}
              stroke={seg === activeSegment ? activeBorder : stroke}
              strokeWidth={seg === activeSegment ? 2.5 : 0.8}
            />
          );
        })}
        {/* Apex — center circle */}
        <circle cx={cx} cy={cy} r={R[3]}
          fill={fill(17)}
          stroke={17 === activeSegment ? activeBorder : stroke}
          strokeWidth={17 === activeSegment ? 2.5 : 0.8}
        />

        {/* Segment labels — basal */}
        {basalSegs.map((seg, i) => {
          const [lx, ly] = labelPos(cx, cy, (R[0] + R[1]) / 2, i * 60 + 30);
          return (
            <text key={seg} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fontSize={6.5} fontFamily="ui-monospace,monospace" fontWeight="600"
              fill={seg === activeSegment ? '#fff' : (dk ? '#64748b' : '#94a3b8')}>
              {SEG_LABEL[seg]}
            </text>
          );
        })}
        {/* Mid labels */}
        {midSegs.map((seg, i) => {
          const [lx, ly] = labelPos(cx, cy, (R[1] + R[2]) / 2, i * 60 + 30);
          return (
            <text key={seg} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fontSize={5.5} fontFamily="ui-monospace,monospace" fontWeight="600"
              fill={seg === activeSegment ? '#fff' : (dk ? '#64748b' : '#94a3b8')}>
              {SEG_LABEL[seg]}
            </text>
          );
        })}

        {/* Directional labels */}
        {[['Ant', 0], ['AntLat', 60], ['InfLat', 120], ['Inf', 180], ['InfSep', 240], ['AntSep', 300]].map(([lbl, deg]) => {
          const [lx, ly] = labelPos(cx, cy, R[0] + 10, deg + 30);
          return (
            <text key={lbl} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fontSize={5} fontFamily="ui-monospace,monospace"
              fill={dk ? '#334155' : '#cbd5e1'}>
              {lbl}
            </text>
          );
        })}

        {/* Active segment pulse ring */}
        {activeSegment > 0 && (
          <circle cx={cx} cy={cy} r={R[0] + 4}
            fill="none" stroke={activeBorder} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.6} />
        )}
      </svg>

      {/* Legend */}
      <div className="flex gap-3 justify-center">
        {Object.entries(TERRITORY_COLOR).map(([t, c]) => (
          <div key={t} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: c + '99' }} />
            <span className={`text-[9px] font-bold font-mono ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{t}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm border" style={{ borderColor: '#60a5fa' }} />
          <span className={`text-[9px] font-bold font-mono ${dk ? 'text-slate-500' : 'text-slate-400'}`}>Active</span>
        </div>
      </div>

      {/* AHA info panel */}
      {aha && aha.segment > 0 && (
        <div className={`rounded-xl border p-3 space-y-1.5 ${
          dk ? 'bg-[#0a1220] border-white/[0.07]' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold font-mono ${dk ? 'text-slate-200' : 'text-slate-800'}`}>
              Seg {aha.segment} — {aha.label}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
              aha.risk === 'HIGH' ? 'bg-red-500/20 text-red-400' :
              aha.risk === 'MODERATE' ? 'bg-amber-500/20 text-amber-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>{aha.risk}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm flex-shrink-0"
              style={{ backgroundColor: TERRITORY_COLOR[aha.territory] + '99' }} />
            <span className={`text-[9px] font-mono ${dk ? 'text-slate-400' : 'text-slate-600'}`}>
              {aha.territory} territory
            </span>
          </div>
          {aha.note && (
            <p className={`text-[8.5px] leading-relaxed font-mono whitespace-pre-line ${dk ? 'text-slate-500' : 'text-slate-500'}`}>
              {aha.note}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AHABullsEye;
