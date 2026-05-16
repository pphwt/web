import React, { useState } from 'react';
import { Activity, Zap, Wind, RotateCcw, Heart } from 'lucide-react';
import { useStream } from '../../context/StreamContext';
import { useTheme } from '../../context/ThemeContext';

const DEFAULTS = { a: 0.1, k: 8.0, D: 0.0001 };

const PARAMS = [
  {
    key: 'a',
    icon: Activity,
    label: 'Ischemia Level',
    clinicalLabel: 'Excitation Threshold (a)',
    unit: '',
    min: 0,
    max: 0.5,
    step: 0.01,
    format: (v) => v.toFixed(2),
    desc: 'Myocardial excitability — elevated in ischemia',
    normalRange: [0.05, 0.15],
    color: 'sky',
  },
  {
    key: 'k',
    icon: Zap,
    label: 'Contractility',
    clinicalLabel: 'Action Potential Amplitude (k)',
    unit: '',
    min: 1,
    max: 20,
    step: 0.1,
    format: (v) => v.toFixed(1),
    desc: 'Ventricular force generation capacity',
    normalRange: [7, 10],
    color: 'indigo',
  },
  {
    key: 'D',
    icon: Wind,
    label: 'Conduction Speed',
    clinicalLabel: 'Tissue Diffusivity (D)',
    unit: '',
    min: 0.00001,
    max: 0.001,
    step: 0.00001,
    format: (v) => v.toFixed(5),
    desc: 'Intercellular electrical propagation speed',
    normalRange: [0.00007, 0.00015],
    color: 'violet',
  },
];

const colorMap = {
  sky:    { accent: 'text-sky-400',    track: 'bg-sky-500/20',    bar: 'bg-sky-500',    badge: 'bg-sky-500/10 border-sky-500/20 text-sky-400',    warn: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  indigo: { accent: 'text-indigo-400', track: 'bg-indigo-500/20', bar: 'bg-indigo-500', badge: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400', warn: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  violet: { accent: 'text-violet-400', track: 'bg-violet-500/20', bar: 'bg-violet-500', badge: 'bg-violet-500/10 border-violet-500/20 text-violet-400', warn: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
};

const colorMapLight = {
  sky:    { accent: 'text-sky-600',    track: 'bg-sky-100',    bar: 'bg-sky-500',    badge: 'bg-sky-50 border-sky-200 text-sky-700',    warn: 'bg-amber-50 border-amber-200 text-amber-700' },
  indigo: { accent: 'text-indigo-600', track: 'bg-indigo-100', bar: 'bg-indigo-500', badge: 'bg-indigo-50 border-indigo-200 text-indigo-700', warn: 'bg-amber-50 border-amber-200 text-amber-700' },
  violet: { accent: 'text-violet-600', track: 'bg-violet-100', bar: 'bg-violet-500', badge: 'bg-violet-50 border-violet-200 text-violet-700', warn: 'bg-amber-50 border-amber-200 text-amber-700' },
};

const PhysicsControlPanel = () => {
  const { data: streamData, sendUpdate } = useStream();
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

  const surface  = dk ? 'bg-[#0a1220] border-white/[0.07]' : 'bg-white border-slate-200';
  const mainText = dk ? 'text-white' : 'text-slate-900';
  const subText  = dk ? 'text-slate-500' : 'text-slate-400';
  const secLabel = dk ? 'text-slate-500' : 'text-slate-400';
  const cmap     = dk ? colorMap : colorMapLight;

  const liveHR  = streamData?.heart_rate ?? null;
  const liveQTc = streamData?.qtc ?? null;

  const isOutOfNormal = (p) => {
    const v = params[p.key];
    return v < p.normalRange[0] || v > p.normalRange[1];
  };

  return (
    <div className="space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${secLabel}`}>
          Cardiac Parameters
        </span>
        <button
          onClick={reset}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold border transition-all ${
            dk
              ? 'border-white/[0.07] text-slate-500 hover:text-slate-200 hover:bg-white/[0.05]'
              : 'border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <RotateCcw size={10} />
          Reset
        </button>
      </div>

      {/* Live BPM badge */}
      {liveHR !== null && (
        <div className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
          liveHR < 50 || liveHR > 130
            ? dk ? 'bg-red-500/[0.08] border-red-500/20' : 'bg-red-50 border-red-200'
            : liveHR < 60 || liveHR > 100
            ? dk ? 'bg-amber-500/[0.08] border-amber-500/20' : 'bg-amber-50 border-amber-200'
            : dk ? 'bg-emerald-500/[0.06] border-emerald-500/15' : 'bg-emerald-50/60 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            <Heart size={12} className={
              liveHR < 50 || liveHR > 130 ? (dk ? 'text-red-400' : 'text-red-600')
              : liveHR < 60 || liveHR > 100 ? (dk ? 'text-amber-400' : 'text-amber-600')
              : (dk ? 'text-emerald-400' : 'text-emerald-600')
            } />
            <div>
              <div className={`text-[8px] font-bold uppercase tracking-widest ${secLabel}`}>Heart Rate</div>
              <div className={`text-xs font-black font-mono ${
                liveHR < 50 || liveHR > 130 ? (dk ? 'text-red-400' : 'text-red-600')
                : liveHR < 60 || liveHR > 100 ? (dk ? 'text-amber-400' : 'text-amber-600')
                : (dk ? 'text-emerald-400' : 'text-emerald-600')
              }`}>
                {liveHR} <span className={`text-[9px] font-medium ${subText}`}>BPM</span>
              </div>
            </div>
          </div>
          {liveQTc && (
            <div className="text-right">
              <div className={`text-[8px] font-bold uppercase tracking-widest ${secLabel}`}>QTc</div>
              <div className={`text-xs font-black font-mono ${
                liveQTc > 500 ? (dk ? 'text-red-400' : 'text-red-600')
                : liveQTc > 450 ? (dk ? 'text-amber-400' : 'text-amber-600')
                : (dk ? 'text-emerald-400' : 'text-emerald-600')
              }`}>
                {liveQTc} <span className={`text-[9px] font-medium ${subText}`}>ms</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sliders */}
      <div className={`rounded-2xl border divide-y ${surface} ${dk ? 'divide-white/[0.06]' : 'divide-slate-100'}`}>
        {PARAMS.map((p) => {
          const { key, icon: Icon, label, clinicalLabel, min, max, step, format, desc, color, normalRange } = p;
          const c       = cmap[color];
          const progress = ((params[key] - min) / (max - min)) * 100;
          const abnormal = isOutOfNormal(p);

          return (
            <div key={key} className="px-4 py-3.5 space-y-2.5">
              {/* Label row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-5 w-5 items-center justify-center rounded-md border ${abnormal ? c.warn : c.badge}`}>
                    <Icon size={10} />
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold ${mainText}`}>{label}</span>
                    {abnormal && (
                      <span className={`ml-1.5 text-[8px] font-bold ${dk ? 'text-amber-400' : 'text-amber-600'}`}>
                        ↑ ABNORMAL
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-black font-mono ${abnormal ? (dk ? 'text-amber-400' : 'text-amber-600') : c.accent}`}>
                  {format(params[key])}
                </span>
              </div>

              {/* Slider */}
              <div className="relative py-2 group/slider">
                {/* Normal range indicator */}
                <div className="absolute top-1/2 -translate-y-1/2 h-1.5 w-full rounded-full overflow-hidden pointer-events-none">
                  <div style={{
                    position: 'absolute',
                    left: `${((normalRange[0] - min) / (max - min)) * 100}%`,
                    width: `${((normalRange[1] - normalRange[0]) / (max - min)) * 100}%`,
                    height: '100%',
                    background: dk ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.20)',
                  }} />
                </div>
                <div className={`h-1.5 w-full rounded-full overflow-hidden ${c.track}`}>
                  <div className={`h-full rounded-full ${abnormal ? 'bg-amber-500' : c.bar} transition-all duration-75`}
                       style={{ width: `${progress}%` }} />
                </div>
                <div
                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full border-2 shadow-md transition-transform duration-75 group-hover/slider:scale-125 ${abnormal ? 'bg-amber-500' : c.bar} ${dk ? 'border-[#0a1220]' : 'border-white'}`}
                  style={{ left: `${progress}%` }}
                />
                <input
                  type="range" min={min} max={max} step={step} value={params[key]}
                  onChange={(e) => updateParam(key, e.target.value)}
                  className="absolute inset-0 w-full opacity-0 cursor-grab active:cursor-grabbing h-full"
                />
              </div>

              {/* Desc + range */}
              <div className="flex items-center justify-between">
                <span className={`text-[9px] ${subText}`}>{desc}</span>
                <span className={`text-[8px] font-mono ${dk ? 'text-slate-600' : 'text-slate-300'}`}>
                  Normal: {normalRange[0]}–{normalRange[1]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status */}
      <div className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 ${
        dk ? 'bg-sky-500/[0.05] border-sky-500/15' : 'bg-sky-50 border-sky-100'
      }`}>
        <Zap size={11} className={`mt-0.5 shrink-0 ${dk ? 'text-sky-400' : 'text-sky-600'}`} fill="currentColor" />
        <p className={`text-[9px] leading-relaxed font-semibold ${dk ? 'text-sky-400/70' : 'text-sky-700/70'}`}>
          Parameters update the PINN model in real-time. Green zone = physiological normal range.
        </p>
      </div>
    </div>
  );
};

export default PhysicsControlPanel;
