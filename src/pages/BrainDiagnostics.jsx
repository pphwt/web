import React from 'react';
import BrainModel3D from '../components/visualizers/BrainModel3D';
import { useStream } from '../context/StreamContext';
import { usePatient } from '../context/PatientContext';
import { useTheme } from '../context/ThemeContext';
import { Brain, Zap, Activity, ShieldCheck, Wifi, WifiOff, MapPin } from 'lucide-react';

// ─── sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, icon, color, dk }) => (
  <div className={`rounded-2xl border p-4 ${dk ? 'bg-[#0d1525] border-white/[0.06]' : 'bg-white border-slate-200'}`}>
    <div className="flex items-center gap-2 mb-3">
      <span className={color}>{icon}</span>
      <span className={`text-[10px] font-semibold uppercase tracking-wider ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{label}</span>
    </div>
    <p className={`text-2xl font-bold leading-none ${color}`}>{value}</p>
    {sub && <p className={`mt-1.5 text-[10px] ${dk ? 'text-slate-600' : 'text-slate-400'}`}>{sub}</p>}
  </div>
);

const CoordRow = ({ axis, value, dk }) => (
  <div className={`flex items-center justify-between py-2 border-b last:border-0 ${dk ? 'border-white/[0.05]' : 'border-slate-100'}`}>
    <span className={`text-xs font-semibold ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{axis}</span>
    <span className={`text-xs font-bold font-mono ${dk ? 'text-sky-300' : 'text-sky-700'}`}>
      {value !== null ? value.toFixed(3) : '---'}
    </span>
  </div>
);

// ─── main ─────────────────────────────────────────────────────────────────────

const BrainDiagnostics = () => {
  const { data, isConnected } = useStream();
  const { selectedPatient } = usePatient();
  const { isDarkMode: dk } = useTheme();

  const loc = data?.localization ?? null;

  const surface  = dk ? 'bg-[#0d1525] border-white/[0.06]'  : 'bg-white border-slate-200';
  const divider  = dk ? 'border-white/[0.06]'               : 'border-slate-100';
  const secLabel = dk ? 'text-slate-500'                    : 'text-slate-400';
  const mainText = dk ? 'text-white'                        : 'text-slate-900';
  const subText  = dk ? 'text-slate-400'                    : 'text-slate-500';

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      <div className="max-w-[1800px] mx-auto flex flex-col gap-5">

        {/* ── Header ───────────────────────────────────────────── */}
        <header className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border p-4 ${surface}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
              dk ? 'bg-indigo-500/15 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'
            }`}>
              <Brain size={17} />
            </div>
            <div>
              <h1 className={`text-sm font-bold ${mainText}`}>Brain Source Mapping</h1>
              <p className={`mt-0.5 text-xs ${subText}`}>
                {selectedPatient ? selectedPatient.name : 'ไม่ได้เลือกคนไข้'} · Neurological PINN Solver
              </p>
            </div>
          </div>

          <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${
            isConnected
              ? dk ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : dk ? 'bg-slate-500/10 text-slate-500 border-slate-500/20'       : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {isConnected
              ? <><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Stream Active</>
              : <><WifiOff size={12} /> Offline</>
            }
          </div>
        </header>

        {/* ── Body ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ── 3D Viewer ────────────────────────────────────────── */}
          <div className="lg:col-span-8 xl:col-span-9">
            <div className={`rounded-2xl border overflow-hidden ${surface}`}>
              <div className={`flex items-center justify-between px-4 py-3 border-b ${divider}`}>
                <div className="flex items-center gap-2">
                  <Activity size={14} className={dk ? 'text-indigo-400' : 'text-indigo-600'} />
                  <span className={`text-xs font-semibold ${secLabel}`}>3D Neural Activity Map · ECoG Matrix</span>
                </div>
                <span className={`text-[10px] font-semibold ${dk ? 'text-indigo-400/60' : 'text-indigo-600/60'}`}>
                  Aliev-Panfilov Diffusion Model
                </span>
              </div>
              <div className="h-[520px] lg:h-[600px]">
                <BrainModel3D />
              </div>
            </div>
          </div>

          {/* ── Right: Stats ─────────────────────────────────────── */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">

            <StatCard dk={dk}
              label="Neural Resonance" icon={<Zap size={14} />}
              color={dk ? 'text-indigo-400' : 'text-indigo-600'}
              value="98.2%" sub="Cortical synchrony index" />

            <StatCard dk={dk}
              label="Latency Sync" icon={<Activity size={14} />}
              color={dk ? 'text-sky-400' : 'text-sky-600'}
              value="12.4ms" sub="Signal propagation delay" />

            {/* Source localization coords */}
            <div className={`rounded-2xl border p-4 flex-1 ${surface}`}>
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={14} className={dk ? 'text-sky-400' : 'text-sky-600'} />
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${secLabel}`}>Source Coordinates</span>
              </div>
              <CoordRow dk={dk} axis="X (Lateral)"   value={loc?.x ?? null} />
              <CoordRow dk={dk} axis="Y (Superior)"  value={loc?.y ?? null} />
              <CoordRow dk={dk} axis="Z (Anterior)"  value={loc?.z ?? null} />
              {!loc && (
                <p className={`mt-3 text-[10px] text-center ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
                  รอข้อมูล localization จาก stream
                </p>
              )}
            </div>

            {/* Solver integrity */}
            <div className={`rounded-2xl border p-4 ${
              dk ? 'bg-emerald-500/[0.06] border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={14} className={dk ? 'text-emerald-400' : 'text-emerald-600'} />
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${dk ? 'text-emerald-400/70' : 'text-emerald-700/70'}`}>
                  Solver Integrity
                </span>
              </div>
              <p className={`text-sm font-bold ${dk ? 'text-emerald-300' : 'text-emerald-700'}`}>Verified PINN</p>
              <p className={`mt-1.5 text-[10px] leading-relaxed ${dk ? 'text-emerald-400/50' : 'text-emerald-600/60'}`}>
                Aliev-Panfilov equations adapted for cortical electrical propagation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrainDiagnostics;
