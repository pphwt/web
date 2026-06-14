import React, { useState, useEffect } from 'react';
import { FlaskConical, Wifi, WifiOff, Heart, Activity, Zap, Clock } from 'lucide-react';
import HeartModel3D from '../components/visualizers/HeartModel3D';
import ECGCanvas from '../components/visualizers/ECGCanvas';
import PhysicsControlPanel from '../components/visualizers/PhysicsControlPanel';
import AHABullsEye from '../components/visualizers/AHABullsEye';
import { useStream } from '../context/StreamContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const SCENARIOS = [
  {
    id: 'normal',
    title: 'Normal Sinus Rhythm',
    difficulty: 'Beginner',
    params: { a: 0.1, k: 8.0, D: 0.0001 },
    description: 'Baseline cardiac electrical activity.',
    signs: ['HR 60–100 BPM', 'Normal QRS <120 ms', 'Regular R-R interval'],
    color: '#22c55e',
  },
  {
    id: 'tachycardia',
    title: 'Sinus Tachycardia',
    difficulty: 'Beginner',
    params: { a: 0.1, k: 8.0, D: 0.0005 },
    description: 'Accelerated conduction, rapid propagation.',
    signs: ['HR >100 BPM', 'Narrow QRS', 'Short R-R interval'],
    color: '#f59e0b',
  },
  {
    id: 'bradycardia',
    title: 'Sinus Bradycardia',
    difficulty: 'Beginner',
    params: { a: 0.12, k: 7.5, D: 0.00005 },
    description: 'Reduced diffusion, slowed heart rate.',
    signs: ['HR <60 BPM', 'Normal QRS morphology', 'Prolonged R-R interval'],
    color: '#3b82f6',
  },
  {
    id: 'ischemia',
    title: 'Myocardial Ischemia',
    difficulty: 'Intermediate',
    params: { a: 0.25, k: 4.5, D: 0.00008 },
    description: 'Reduced myocardial perfusion & excitability.',
    signs: ['ST depression', 'T-wave inversion', 'QRS widening', 'Elevated QTc'],
    color: '#ef4444',
  },
];

// ── Vital sign card ───────────────────────────────────────────────────────────
function VitalCard({ icon: Icon, label, value, unit, normal, sublabel, color }) {
  const { isDarkMode: dk } = useTheme();
  let status = 'normal';
  if (value !== '--' && normal) {
    const v = Number(value);
    if (v < normal[0] || v > normal[1]) status = v < normal[0] * 0.8 || v > normal[1] * 1.25 ? 'critical' : 'warning';
  }
  const statusColor = color || (status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#22c55e');
  const bg = dk
    ? status === 'critical' ? 'bg-red-500/[0.08] border-red-500/20'
      : status === 'warning' ? 'bg-amber-500/[0.08] border-amber-500/20'
      : 'bg-emerald-500/[0.06] border-emerald-500/15'
    : status === 'critical' ? 'bg-red-50 border-red-200'
      : status === 'warning' ? 'bg-amber-50 border-amber-200'
      : 'bg-emerald-50/60 border-emerald-200';

  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-1.5 ${bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon size={11} style={{ color: statusColor }} />}
          <span className={`text-[9px] font-bold uppercase tracking-widest ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
            {label}
          </span>
        </div>
        {status !== 'normal' && (
          <span style={{
            background: statusColor + '20', color: statusColor,
            border: `1px solid ${statusColor}40`,
            fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, letterSpacing: 0.5,
          }}>
            {status === 'critical' ? 'CRIT' : 'WARN'}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black font-mono" style={{ color: statusColor, lineHeight: 1 }}>
          {value}
        </span>
        <span className={`text-[10px] font-semibold ${dk ? 'text-slate-500' : 'text-slate-400'}`}>{unit}</span>
      </div>
      {sublabel && (
        <span className={`text-[9px] ${dk ? 'text-slate-600' : 'text-slate-400'}`}>{sublabel}</span>
      )}
    </div>
  );
}

const EducationalLab = () => {
  const { data: streamData, isConnected, sendUpdate, events } = useStream();
  const { isDarkMode: dk } = useTheme();
  const { t } = useLanguage();
  const [selected, setSelected] = useState(null);
  const [ahaData,  setAhaData]  = useState(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.aha?.segment > 0) setAhaData(e.detail.aha);
    };
    events?.addEventListener('data', handler);
    return () => events?.removeEventListener('data', handler);
  }, [events]);

  const loadScenario = (s) => {
    setSelected(s);
    sendUpdate({ type: 'parameter_update', params: s.params, scenario_id: s.id });
  };

  const hr   = streamData?.heart_rate  ?? '--';
  const qrs  = streamData?.qrs_duration ?? '--';
  const pr   = streamData?.pr_interval  ?? '--';
  const qtc  = streamData?.qtc         ?? '--';
  const conf = streamData ? Math.round(streamData.ai_confidence * 100) : '--';

  const surface  = dk ? 'bg-[#0a1220] border-white/[0.07]'  : 'bg-white border-slate-200';
  const divider  = dk ? 'border-white/[0.07]'               : 'border-slate-100';
  const secLabel = dk ? 'text-slate-500'                    : 'text-slate-400';
  const mainText = dk ? 'text-white'                        : 'text-slate-900';
  const subText  = dk ? 'text-slate-400'                    : 'text-slate-500';

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
              <div className="flex items-center gap-2">
                <h1 className={`text-sm font-bold ${mainText}`}>{t('nav_lab')}</h1>
                {streamData?.is_hardware ? (
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border animate-pulse ${
                    dk ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}>HARDWARE SENSOR</span>
                ) : (
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                    dk ? 'bg-violet-500/10 text-violet-300 border-violet-500/25' : 'bg-violet-50 text-violet-600 border-violet-200'
                  }`}>SIMULATION</span>
                )}
              </div>
              <p className={`mt-0.5 text-xs ${subText}`}>Cardiac Electrophysiology Simulator</p>
            </div>
          </div>

          <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${
            isConnected
              ? dk ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : dk ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200'
          }`}>
            {isConnected
              ? <><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> PINN Engine Active</>
              : <><WifiOff size={12} /> Engine Offline</>
            }
          </div>
        </header>

        {/* Live Vitals Strip (Full Width at Top) */}
        <div className={`rounded-2xl border overflow-hidden ${surface}`}>
          <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${divider}`}>
            <Activity size={13} className={`${dk ? 'text-rose-400' : 'text-rose-600'}`} />
            <span className={`text-xs font-bold ${mainText}`}>Live Vital Signs</span>
            {!isConnected && (
              <span className={`text-[9px] font-semibold ml-auto ${dk ? 'text-red-400' : 'text-red-500'}`}>
                — Not connected
              </span>
            )}
          </div>
          <div className="p-3 grid grid-cols-5 gap-2">
            <VitalCard icon={Heart}    label="Heart Rate" value={hr}   unit="BPM" normal={[60, 100]} sublabel="HR" />
            <VitalCard icon={Activity} label="QRS Duration" value={qrs} unit="ms"  normal={[60, 120]}  sublabel="QRS" />
            <VitalCard icon={Clock}    label="PR Interval" value={pr}  unit="ms"  normal={[120, 200]} sublabel="PR" />
            <VitalCard icon={Zap}      label="Corrected QT" value={qtc} unit="ms"  normal={[350, 450]} sublabel="QTc" />
            <VitalCard             label="AI Confidence" value={conf} unit="%"   color="#0ea5e9"     sublabel="PINN" />
          </div>
        </div>

        {/* Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Left Column (lg:col-span-3): Clinical Scenarios & AHA 17-Segment Map */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            {/* Clinical Scenarios */}
            <div className={`rounded-2xl border flex flex-col ${surface}`}>
              <div className={`flex items-center gap-2 px-4 py-3 border-b ${divider}`}>
                <Heart size={13} className={secLabel} />
                <span className={`text-xs font-bold ${secLabel}`}>Clinical Scenarios</span>
              </div>
              <div className="p-3 space-y-2 relative">
                {streamData?.is_hardware && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] rounded-b-2xl flex flex-col items-center justify-center p-4 text-center z-10">
                    <Heart size={20} className="text-emerald-400 animate-pulse mb-1.5" />
                    <p className="text-xs font-bold text-emerald-400">Hardware Feed Active</p>
                    <p className="text-[10px] text-slate-400 mt-1">Cannot select simulation scenarios while physical detector is streaming.</p>
                  </div>
                )}
                {SCENARIOS.map(s => {
                  const active = selected?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => loadScenario(s)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                        active
                          ? dk ? 'bg-white/[0.04]' : 'bg-white shadow-md'
                          : dk ? 'bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.12] hover:-translate-y-0.5' : 'bg-slate-50/40 border-slate-100 hover:bg-slate-50/80 hover:border-slate-200 hover:-translate-y-0.5'
                      }`}
                      style={active ? {
                        borderColor: s.color + '70',
                        boxShadow: dk ? `0 4px 20px ${s.color}12, 0 0 0 1px ${s.color}20` : `0 4px 20px ${s.color}0a, 0 0 0 1px ${s.color}15`
                      } : {}}
                    >
                      {/* Color bar indicator on the left side */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300"
                        style={{
                          backgroundColor: s.color,
                          opacity: active ? 1 : 0.35,
                        }}
                      />
                      
                      <div className="pl-1.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: s.color }}>
                            {s.difficulty}
                          </span>
                          {active ? (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                              backgroundColor: s.color + '15',
                              color: s.color,
                              border: `1px solid ${s.color}30`
                            }}>ACTIVE</span>
                          ) : (
                            <span className={`text-[8px] font-medium opacity-0 group-hover:opacity-100 transition-opacity ${subText}`}>
                              CLICK TO LOAD
                            </span>
                          )}
                        </div>
                        <p className={`text-xs font-bold mb-1 ${mainText}`}>{s.title}</p>
                        <p className={`text-[10px] leading-relaxed ${subText}`}>{s.description}</p>
                        {active && (
                          <div className={`mt-2.5 pt-2 border-t space-y-1 ${divider}`}>
                            {s.signs.map(sign => (
                              <div key={sign} className="flex items-center gap-1.5">
                                <div className="h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                <span className={`text-[9px] font-mono ${subText}`}>{sign}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AHA 17-Segment Bull's-eye */}
            <div className={`rounded-2xl border p-4 ${surface}`}>
              <div className="flex items-center gap-2 mb-3">
                <Heart size={12} className={secLabel} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${secLabel}`}>
                  AHA 17-Segment Map
                </span>
              </div>
              <div className="flex justify-center">
                <AHABullsEye
                  activeSegment={ahaData?.segment ?? 0}
                  aha={ahaData}
                />
              </div>
            </div>
          </div>

          {/* Center Column: 3D Localization & ECG Monitor */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* 3D Localization */}
            <div className={`rounded-2xl border overflow-hidden ${surface}`}>
              <div className={`flex items-center justify-between px-4 py-3 border-b ${divider}`}>
                <div className="flex items-center gap-2">
                  <Zap size={13} className={`${dk ? 'text-sky-400' : 'text-sky-600'}`} />
                  <span className={`text-xs font-bold ${mainText}`}>3D Cardiac Source Localization</span>
                </div>
                {streamData?.is_hardware ? (
                  <span className="rounded-full border px-2.5 py-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse">
                    Hardware Stream
                  </span>
                ) : selected ? (
                  <span className="rounded-full border px-2.5 py-1 text-[10px] font-semibold" style={{
                    color: selected.color,
                    backgroundColor: selected.color + '18',
                    borderColor: selected.color + '40',
                  }}>
                    {selected.title}
                  </span>
                ) : null}
              </div>
              <div className="h-[360px] relative">
                <HeartModel3D />
                <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-black/50 backdrop-blur-md px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-300 tracking-wide">PINN ACTIVE</span>
                </div>
              </div>
            </div>

            {/* ECG Monitor (Moved inside center column, height reduced to 50px per lead) */}
            <div className={`rounded-2xl border overflow-hidden ${surface}`}>
              <div className={`flex items-center justify-between px-4 py-2 border-b ${divider}`}>
                <div className="flex items-center gap-2">
                  <Activity size={13} className={`${dk ? 'text-sky-400' : 'text-sky-600'}`} />
                  <span className={`text-xs font-bold ${mainText}`}>ECG Monitor</span>
                </div>
                <span className={`text-[8px] font-semibold ${secLabel}`}>3-Lead · 20 Hz · Real-time</span>
              </div>
              <div className={`p-3 space-y-3 ${dk ? 'bg-[#030a14]' : 'bg-slate-50'}`}>
                {[
                  { leadKey: 'lead_i',  label: 'Lead I',   color: '#0ea5e9' },
                  { leadKey: 'lead_ii', label: 'Lead II',  color: '#6366f1' },
                  { leadKey: 'v5',      label: 'V5',       color: '#8b5cf6' },
                ].map(({ leadKey, label, color }) => (
                  <ECGCanvas key={label} leadKey={leadKey} label={label} color={color} height={50} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Physics Control Panel & Scenario Signs */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            {/* Physics Control Panel */}
            <div className={`rounded-2xl border p-4 ${surface}`}>
              <PhysicsControlPanel />
            </div>

            {/* Clinical signs for active scenario */}
            {selected && (
              <div className={`rounded-2xl border p-4 ${surface}`}>
                <div className={`text-[9px] font-bold uppercase tracking-widest mb-3 ${secLabel}`}>
                  Scenario Signs
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selected.color }} />
                  <span className={`text-xs font-bold ${mainText}`}>{selected.title}</span>
                </div>
                <div className="space-y-1.5">
                  {selected.signs.map(sign => (
                    <div key={sign} className={`flex items-start gap-2 rounded-lg px-2.5 py-2 ${
                      dk ? 'bg-white/[0.03]' : 'bg-slate-50'
                    }`}>
                      <div className="h-1.5 w-1.5 mt-1 rounded-full shrink-0" style={{ backgroundColor: selected.color }} />
                      <span className={`text-[10px] leading-relaxed ${subText}`}>{sign}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default EducationalLab;
