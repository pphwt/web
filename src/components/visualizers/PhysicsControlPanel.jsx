import React, { useState } from 'react';
import { Activity, Zap, Wind, RotateCcw } from 'lucide-react';
import { useStream } from '../../context/StreamContext';
import { useTheme } from '../../context/ThemeContext';

const DEFAULTS = { a: 0.1, k: 8.0, D: 0.0001 };

const PARAMS = [
  {
    key: 'a',
    icon: Activity,
    label: 'Threshold',
    unit: 'A',
    min: 0,
    max: 0.5,
    step: 0.01,
    format: (v) => v.toFixed(2),
    desc: 'Neuronal excitation sensitivity',
    color: 'sky',
  },
  {
    key: 'k',
    icon: Zap,
    label: 'Magnitude',
    unit: 'K',
    min: 1,
    max: 20,
    step: 0.1,
    format: (v) => v.toFixed(1),
    desc: 'Action potential amplitude',
    color: 'indigo',
  },
  {
    key: 'D',
    icon: Wind,
    label: 'Conductivity',
    unit: 'D',
    min: 0.00001,
    max: 0.001,
    step: 0.00001,
    format: (v) => v.toFixed(5),
    desc: 'Tissue diffusion / propagation',
    color: 'violet',
  },
];

const colorMap = {
  sky:    { accent: 'text-sky-400',    track: 'bg-sky-500/20',    bar: 'bg-sky-500',    badge: 'bg-sky-500/10 border-sky-500/20 text-sky-400'    },
  indigo: { accent: 'text-indigo-400', track: 'bg-indigo-500/20', bar: 'bg-indigo-500', badge: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' },
  violet: { accent: 'text-violet-400', track: 'bg-violet-500/20', bar: 'bg-violet-500', badge: 'bg-violet-500/10 border-violet-500/20 text-violet-400' },
};

const colorMapLight = {
  sky:    { accent: 'text-sky-600',    track: 'bg-sky-100',    bar: 'bg-sky-500',    badge: 'bg-sky-50 border-sky-200 text-sky-700'    },
  indigo: { accent: 'text-indigo-600', track: 'bg-indigo-100', bar: 'bg-indigo-500', badge: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  violet: { accent: 'text-violet-600', track: 'bg-violet-100', bar: 'bg-violet-500', badge: 'bg-violet-50 border-violet-200 text-violet-700' },
};

const PhysicsControlPanel = () => {
  const { sendUpdate } = useStream();
  const { isDarkMode: dk } = useTheme();
  const [params, setParams] = useState(DEFAULTS);

  const updateParam = (key, value) => {
    const next = { ...params, [key]: parseFloat(value) };
    setParams(next);
    sendUpdate({ type: 'parameter_update', params: next });
  };

  const reset = () => {
    setParams(DEFAULTS);
    sendUpdate({ type: 'parameter_update', params: DEFAULTS });
  };

  const surface  = dk ? 'bg-[#0d1525] border-white/[0.06]' : 'bg-white border-slate-200';
  const divider  = dk ? 'border-white/[0.06]' : 'border-slate-100';
  const secLabel = dk ? 'text-slate-500' : 'text-slate-400';
  const mainText = dk ? 'text-white' : 'text-slate-900';
  const subText  = dk ? 'text-slate-500' : 'text-slate-400';

  const cmap = dk ? colorMap : colorMapLight;

  const pct = (p) => {
    const { min, max, key } = p;
    return ((params[key] - min) / (max - min)) * 100;
  };

  return (
    <div className="space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${secLabel}`}>
          Physics Engine
        </span>
        <button
          onClick={reset}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold border transition-all ${
            dk
              ? 'border-white/[0.06] text-slate-500 hover:text-slate-200 hover:bg-white/[0.05]'
              : 'border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <RotateCcw size={10} />
          Reset
        </button>
      </div>

      {/* Sliders */}
      <div className={`rounded-2xl border divide-y ${surface} ${dk ? 'divide-white/[0.06]' : 'divide-slate-100'}`}>
        {PARAMS.map((p) => {
          const { key, icon: Icon, label, unit, min, max, step, format, desc, color } = p;
          const c = cmap[color];
          const progress = pct(p);

          return (
            <div key={key} className="px-4 py-3.5 space-y-2.5">
              {/* Row 1: label + value */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-5 w-5 items-center justify-center rounded-md border ${c.badge}`}>
                    <Icon size={10} />
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${mainText}`}>
                    {label}
                  </span>
                  <span className={`text-[9px] font-bold ${c.accent}`}>({unit})</span>
                </div>
                <span className={`text-xs font-bold font-mono ${c.accent}`}>{format(params[key])}</span>
              </div>

              {/* Slider track */}
              <div className="relative py-2 group/slider">
                <div className={`h-1.5 w-full rounded-full overflow-hidden ${c.track}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-75 ${c.bar}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {/* Thumb knob */}
                <div
                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full border-2 shadow-md transition-transform duration-75 group-hover/slider:scale-125 ${c.bar} ${dk ? 'border-[#0d1525]' : 'border-white'}`}
                  style={{ left: `${progress}%` }}
                />
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={params[key]}
                  onChange={(e) => updateParam(key, e.target.value)}
                  className="absolute inset-0 w-full opacity-0 cursor-grab active:cursor-grabbing h-full"
                />
              </div>

              {/* Row 3: desc + range */}
              <div className="flex items-center justify-between">
                <span className={`text-[9px] ${subText}`}>{desc}</span>
                <span className={`text-[9px] font-mono ${dk ? 'text-slate-600' : 'text-slate-300'}`}>
                  {min} – {max}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sync status */}
      <div className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 ${
        dk ? 'bg-sky-500/[0.05] border-sky-500/15' : 'bg-sky-50 border-sky-200'
      }`}>
        <Zap size={11} className={`mt-0.5 shrink-0 ${dk ? 'text-sky-400' : 'text-sky-600'}`} fill="currentColor" />
        <p className={`text-[9px] leading-relaxed font-semibold ${dk ? 'text-sky-400/70' : 'text-sky-700/70'}`}>
          PINN weights perturbed in real-time based on simulation parameters
        </p>
      </div>
    </div>
  );
};

export default PhysicsControlPanel;
