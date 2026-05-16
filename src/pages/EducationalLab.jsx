import React, { useState } from 'react';
import { FlaskConical, Wifi, WifiOff } from 'lucide-react';
import HeartModel3D from '../components/visualizers/HeartModel3D';
import ECGCanvas from '../components/visualizers/ECGCanvas';
import PhysicsControlPanel from '../components/visualizers/PhysicsControlPanel';
import { useStream } from '../context/StreamContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const SCENARIOS = [
  { id: 'normal',       title: 'Normal Sinus Rhythm',  difficulty: 'Beginner',     params: { a: 0.1,  k: 8.0, D: 0.0001  }, description: 'Baseline cardiac electrical activity. Stable diffusion and excitation.' },
  { id: 'tachycardia',  title: 'Sinus Tachycardia',    difficulty: 'Beginner',     params: { a: 0.1,  k: 8.0, D: 0.0005  }, description: 'Accelerated heart rate. High diffusion coefficient leading to rapid propagation.' },
  { id: 'bradycardia',  title: 'Sinus Bradycardia',    difficulty: 'Beginner',     params: { a: 0.12, k: 7.5, D: 0.00005 }, description: 'Slowed heart rate. Reduced diffusion and lower excitation frequency.' },
  { id: 'ischemia',     title: 'Myocardial Ischemia',  difficulty: 'Intermediate', params: { a: 0.25, k: 4.5, D: 0.00008 }, description: 'Weakened myocardial response. High excitation threshold and reduced potential scaling.' },
];

const EducationalLab = () => {
  const { data: streamData, isConnected, sendUpdate } = useStream();
  const { isDarkMode: dk } = useTheme();
  const { t } = useLanguage();

  const [selected, setSelected] = useState(null);

  const loadScenario = (s) => {
    setSelected(s);
    sendUpdate({ type: 'parameter_update', params: s.params });
  };

  // ── tokens ──────────────────────────────────────────────────────
  const surface  = dk ? 'bg-[#0d1525] border-white/[0.06]'  : 'bg-white border-slate-200';
  const divider  = dk ? 'border-white/[0.06]'               : 'border-slate-100';
  const secLabel = dk ? 'text-slate-500'                    : 'text-slate-400';
  const mainText = dk ? 'text-white'                        : 'text-slate-900';
  const subText  = dk ? 'text-slate-400'                    : 'text-slate-500';
  const ecgBg    = dk ? 'bg-[#060d18]'                      : 'bg-slate-50';

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      <div className="max-w-[1800px] mx-auto flex flex-col gap-5">

        {/* Header */}
        <header className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border p-4 ${surface}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
              dk ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              <FlaskConical size={17} />
            </div>
            <div>
              <h1 className={`text-sm font-bold ${mainText}`}>{t('nav_lab')}</h1>
              <p className={`mt-0.5 text-xs ${subText}`}>Interactive Pathology Simulator</p>
            </div>
          </div>

          <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${
            isConnected
              ? dk ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : dk ? 'bg-slate-500/10 text-slate-500 border-slate-500/20'       : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {isConnected
              ? <><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Neural Bridge Active</>
              : <><WifiOff size={12} /> Bridge Offline</>
            }
          </div>
        </header>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Pathology library */}
          <div className={`lg:col-span-3 rounded-2xl border flex flex-col ${surface}`}>
            <div className={`flex items-center gap-2 px-4 py-3 border-b ${divider}`}>
              <span className={`text-xs font-semibold ${secLabel}`}>Pathology Library</span>
            </div>
            <div className="p-3 space-y-1.5">
              {SCENARIOS.map(s => {
                const active = selected?.id === s.id;
                const isBeginner = s.difficulty === 'Beginner';
                return (
                  <button
                    key={s.id}
                    onClick={() => loadScenario(s)}
                    className={`w-full text-left px-3 py-3 rounded-xl border transition-all ${
                      active
                        ? dk ? 'bg-emerald-500/[0.10] border-emerald-500/25' : 'bg-emerald-50 border-emerald-200'
                        : dk ? 'border-transparent hover:bg-white/[0.04]' : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold border ${
                        active
                          ? dk ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-100 border-emerald-200 text-emerald-700'
                          : isBeginner
                          ? dk ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'
                          : dk ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'
                      }`}>
                        {s.difficulty}
                      </span>
                    </div>
                    <p className={`text-xs font-semibold ${active ? (dk ? 'text-emerald-300' : 'text-emerald-700') : mainText}`}>{s.title}</p>
                    <p className={`text-[10px] mt-0.5 leading-relaxed ${subText}`}>{s.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center: 3D + ECG */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className={`rounded-2xl border overflow-hidden ${surface}`}>
              <div className={`flex items-center justify-between px-4 py-3 border-b ${divider}`}>
                <span className={`text-xs font-semibold ${secLabel}`}>Heart 3D Simulation</span>
                {selected && (
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                    dk ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}>
                    {selected.title}
                  </span>
                )}
              </div>
              <div className="h-[360px] relative">
                <HeartModel3D />
                <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-black/40 backdrop-blur-md px-2.5 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-semibold text-emerald-300">PINN Solver Active</span>
                </div>
              </div>

              {/* Physics params strip */}
              {selected && (
                <div className={`px-4 py-3 border-t flex items-center gap-6 ${divider}`}>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${secLabel}`}>Parameters</span>
                  {Object.entries(selected.params).map(([k, v]) => (
                    <div key={k}>
                      <span className={`text-[9px] font-semibold uppercase ${secLabel}`}>{k.toUpperCase()}</span>
                      <span className={`ml-1.5 text-xs font-bold font-mono ${dk ? 'text-sky-300' : 'text-sky-700'}`}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ECG */}
            <div className={`rounded-2xl border overflow-hidden ${surface}`}>
              <div className={`flex items-center gap-2 px-4 py-3 border-b ${divider}`}>
                <span className={`text-xs font-semibold ${secLabel}`}>Neural Signal Synthesis</span>
              </div>
              <div className={`p-4 space-y-3 ${ecgBg}`}>
                {[
                  { leadKey: 'lead_i',  label: 'LEAD I',  color: '#0ea5e9' },
                  { leadKey: 'lead_ii', label: 'LEAD II', color: '#6366f1' },
                  { leadKey: 'v5',      label: 'V5',      color: '#8b5cf6' },
                ].map(({ leadKey, label, color }) => (
                  <ECGCanvas key={label} leadKey={leadKey} label={label} color={color} height={70} />
                ))}
              </div>
            </div>
          </div>

          {/* Right: Physics controls */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            <div className={`rounded-2xl border p-4 ${surface}`}>
              <p className={`text-xs font-semibold mb-3 ${secLabel}`}>Interactive Physics</p>
              <PhysicsControlPanel />
            </div>
            <div className={`rounded-2xl border p-4 ${
              dk ? 'bg-sky-500/[0.05] border-sky-500/15' : 'bg-sky-50 border-sky-200'
            }`}>
              <p className={`text-[10px] leading-relaxed ${dk ? 'text-sky-400/60' : 'text-sky-700/70'}`}>
                ปรับ neural parameters เพื่อดูว่า PINN solver กระจาย electrical potential ข้ามกล้ามเนื้อหัวใจอย่างไร
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EducationalLab;
