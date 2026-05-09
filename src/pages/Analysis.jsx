import React, { useState, useEffect } from 'react';
import { ScanEye, Grid3X3, Rotate3d, Cpu, MapPin, Save } from 'lucide-react';
import HeartModel3D from '../components/visualizers/HeartModel3D';
import { diagnosticService } from '../services/diagnosticService';
import PhysicsControlPanel from '../components/visualizers/PhysicsControlPanel';
import { useStream } from '../context/StreamContext';
import { usePatient } from '../context/PatientContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const Analysis = () => {
  const { socket, data: streamData } = useStream();
  const { selectedPatient } = usePatient();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const { isDarkMode: dk } = useTheme();

  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key.toLowerCase() === 's' && !isCapturing) handleCapture(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedPatient, isCapturing, streamData]);

  const handleCapture = async () => {
    if (!selectedPatient) { showToast('Select a patient to capture snapshot', 'warning'); return; }
    setIsCapturing(true);
    try {
      await diagnosticService.captureSnapshot({
        patient_id: selectedPatient.id,
        organ_type: streamData?.organ_type || 'heart',
        ai_confidence: streamData?.ai_confidence || 0.98,
        localization_coords: streamData?.localization_coords || { x: 0, y: 0, z: 0 },
        physics_params: streamData?.physics_params || { a: 0.1, k: 8.0, D: 0.0001 },
        notes: `Automated capture from 3D Analysis portal for ${selectedPatient.name}.`,
      });
      showToast(t('capture_success'), 'success');
    } catch { showToast(t('capture_error'), 'error'); }
    finally  { setIsCapturing(false); }
  };

  // ── tokens ──────────────────────────────────────────────────────
  const surface  = dk ? 'bg-[#0d1525] border-white/[0.06]'  : 'bg-white border-slate-200';
  const divider  = dk ? 'border-white/[0.06]'               : 'border-slate-100';
  const secLabel = dk ? 'text-slate-500'                    : 'text-slate-400';
  const mainText = dk ? 'text-white'                        : 'text-slate-900';
  const subText  = dk ? 'text-slate-400'                    : 'text-slate-500';

  const physics = streamData?.physics_params || { a: 0.1, k: 8.0, D: 0.0001 };
  const coords  = streamData?.localization_coords;

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      <div className="max-w-[1800px] mx-auto flex flex-col gap-5">

        {/* Header */}
        <header className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border p-4 ${surface}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
              dk ? 'bg-sky-500/15 border-sky-500/20 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'
            }`}>
              <Cpu size={17} />
            </div>
            <div>
              <h1 className={`text-sm font-bold ${mainText}`}>{t('analysis_title')}</h1>
              <p className={`mt-0.5 text-xs ${subText}`}>{t('analysis_subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedPatient && (
              <div className={`rounded-xl border px-3 py-1.5 ${
                dk ? 'bg-sky-500/[0.08] border-sky-500/20' : 'bg-sky-50 border-sky-200'
              }`}>
                <p className={`text-[9px] font-semibold uppercase tracking-wider ${dk ? 'text-sky-400/70' : 'text-sky-700/70'}`}>{t('active_patient')}</p>
                <p className={`text-xs font-bold ${dk ? 'text-sky-300' : 'text-sky-700'}`}>{selectedPatient.name}</p>
              </div>
            )}
            <button
              onClick={handleCapture}
              disabled={isCapturing}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all active:scale-95 ${
                isCapturing ? 'bg-sky-600/60 text-white cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700 text-white'
              }`}
            >
              <Save size={13} />
              {isCapturing ? t('loading') : t('capture_snapshot')}
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* 3D Viewer */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-5">
            <div className={`rounded-2xl border overflow-hidden ${surface}`}>
              <div className={`flex items-center justify-between px-4 py-3 border-b ${divider}`}>
                <span className={`text-xs font-semibold ${secLabel}`}>Heart 3D Visualization</span>
                <div className="flex items-center gap-4">
                  {[
                    { icon: <ScanEye size={14} />, label: t('slice') },
                    { icon: <Grid3X3 size={14} />, label: t('grid') },
                    { icon: <Rotate3d size={14} />, label: t('3d') },
                  ].map(({ icon, label }) => (
                    <button key={label} className={`flex items-center gap-1.5 text-[10px] font-semibold transition-all ${
                      dk ? 'text-slate-500 hover:text-sky-400' : 'text-slate-400 hover:text-sky-600'
                    }`}>
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[480px] lg:h-[540px]">
                <HeartModel3D />
              </div>
            </div>

            {/* Biophysical insight bar */}
            <div className={`rounded-2xl border p-4 ${surface}`}>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`h-1.5 w-1.5 rounded-full bg-emerald-400`} />
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${dk ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      Biophysical Insight (XAI)
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed italic ${subText}`}>
                    "Accelerated heart rate. High diffusion coefficient leading to rapid propagation."
                  </p>
                </div>

                <div className={`h-px md:h-10 md:w-px ${dk ? 'bg-white/[0.06]' : 'bg-slate-200'}`} />

                <div className="grid grid-cols-3 gap-4 shrink-0">
                  {[
                    { label: 'Excitation (A)', value: physics.a },
                    { label: 'Scaling (K)',    value: physics.k },
                    { label: 'Diffusion (D)',  value: physics.D },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className={`text-[9px] font-semibold uppercase tracking-wider ${secLabel}`}>{label}</p>
                      <p className={`text-sm font-bold font-mono mt-0.5 ${mainText}`}>{value}</p>
                    </div>
                  ))}
                </div>

                <div className={`h-px md:h-10 md:w-px ${dk ? 'bg-white/[0.06]' : 'bg-slate-200'}`} />

                <div className="shrink-0">
                  <p className={`text-[9px] font-semibold uppercase tracking-wider ${secLabel}`}>{t('system_resonance')}</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className={`text-2xl font-bold ${mainText}`}>100%</span>
                    <span className={`text-[10px] font-semibold ${dk ? 'text-emerald-400' : 'text-emerald-600'}`}>{t('success')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Physics + Localization */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-5">
            <PhysicsControlPanel socket={socket} />

            <div className={`rounded-2xl border p-4 ${surface}`}>
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={14} className={dk ? 'text-sky-400' : 'text-sky-600'} />
                <span className={`text-xs font-semibold ${secLabel}`}>{t('localization_log')}</span>
              </div>
              {coords ? (
                <div className={`grid grid-cols-3 gap-2 rounded-xl border p-3 font-mono text-xs ${
                  dk ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-100'
                }`}>
                  {['x', 'y', 'z'].map(axis => (
                    <div key={axis} className="text-center">
                      <p className={`text-[9px] font-semibold uppercase ${secLabel}`}>{axis.toUpperCase()}</p>
                      <p className={`font-bold mt-0.5 ${dk ? 'text-sky-300' : 'text-sky-700'}`}>
                        {coords[axis].toFixed(4)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-xs text-center py-6 ${subText}`}>รอข้อมูล signal...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
