import React, { useState, useEffect } from 'react';
import { ScanEye, Grid3X3, Rotate3d } from 'lucide-react';
import AnatomyVisualizer3D from '../components/visualizers/AnatomyVisualizer3D';
import { diagnosticService } from '../services/diagnosticService';
import PhysicsControlPanel from '../components/visualizers/PhysicsControlPanel';
import { useStream } from '../context/StreamContext';
import { usePatient } from '../context/PatientContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

const Analysis = () => {
  const { socket, data: streamData } = useStream();
  const { selectedPatient } = usePatient();
  const [isCapturing, setIsCapturing] = useState(false);
  const { showToast } = useToast();
  const { t } = useLanguage();

  // Keyboard Shortcut: S for Snapshot
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 's' && !isCapturing) {
        handleCapture();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPatient, isCapturing, streamData]);

  const handleCapture = async () => {
    if (!selectedPatient) {
      showToast("Select a patient to capture snapshot", "warning");
      return;
    }
    setIsCapturing(true);
    try {
      await diagnosticService.captureSnapshot({
        patient_id: selectedPatient.id,
        organ_type: streamData?.organ_type || "heart",
        ai_confidence: streamData?.ai_confidence || 0.98,
        localization_coords: streamData?.localization_coords || { x: 0, y: 0, z: 0 },
        physics_params: streamData?.physics_params || { a: 0.1, k: 8.0, D: 0.0001 },
        notes: `Automated capture from 3D Analysis portal for ${selectedPatient.name}.`
      });
      showToast(t('capture_success'), "success");
    } catch (error) {
      showToast(t('capture_error'), "error");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="p-10 font-sans h-full min-h-screen bg-[var(--bg-main)] flex flex-col text-[var(--text-main)] transition-colors duration-300">
      <div className="flex justify-between items-end mb-10">
        <div>
           <h1 className="text-5xl font-black text-[var(--text-main)] tracking-tighter uppercase italic leading-none">
             {t('analysis_title').split(' ')[0]} <span className="text-sky-500">{t('analysis_title').split(' ').slice(1).join(' ')}</span>
           </h1>
           <p className="text-[var(--text-muted)] text-xs font-bold tracking-[0.4em] uppercase mt-4">
             {t('analysis_subtitle')}
           </p>
        </div>
        {selectedPatient && (
          <div className="bg-sky-500/10 border border-sky-500/20 px-6 py-3 rounded-2xl">
             <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-1">{t('active_patient')}</p>
             <p className="text-sky-500 font-bold text-sm tracking-tight">{selectedPatient.name}</p>
          </div>
        )}
      </div>

      <div className="flex-1 grid grid-cols-12 gap-10 max-w-[1600px] w-full mx-auto">
        {/* Main 3D View Portal */}
        <div className="col-span-8 flex flex-col gap-6">
          <div className="flex-1 min-h-[650px] bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border-color)] overflow-hidden">
             <AnatomyVisualizer3D />
          </div>

          {/* Precision Controls */}
          <div className="bg-[var(--bg-card)] backdrop-blur-2xl border border-[var(--border-color)] rounded-3xl py-8 px-12 flex items-center justify-between shadow-2xl">
             <div className="flex items-center gap-14">
                <ControlButton icon={<ScanEye size={24} />} label={t('slice')} />
                <ControlButton icon={<Grid3X3 size={24} />} label={t('grid')} />
                <ControlButton icon={<Rotate3d size={24} />} label={t('3d')} />
             </div>

             <div className="h-16 w-[1px] bg-[var(--border-color)] mx-8" />

             <div className="flex-1 flex items-center gap-12">
                <div className="flex flex-col gap-1 flex-1">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">{t('system_resonance')}</p>
                   <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-[var(--text-main)] tracking-tighter">100%</span>
                      <span className="text-[10px] text-emerald-500 font-bold uppercase">{t('success')}</span>
                   </div>
                </div>
                
                <button 
                   onClick={handleCapture}
                   disabled={isCapturing}
                   className={`bg-sky-500 hover:bg-sky-600 text-white h-16 px-10 rounded-2xl font-black text-xs tracking-widest transition-all shadow-lg uppercase italic ${isCapturing ? 'opacity-50' : ''}`}
                >
                   {isCapturing ? t('loading') : t('capture_snapshot')}
                </button>
             </div>
          </div>
        </div>

        {/* Diagnostic Metadata */}
        <div className="col-span-4 space-y-8 flex flex-col">
          <PhysicsControlPanel socket={socket} />

          <Card title={t('localization_log')} className="flex-1 overflow-auto">
             <div className="space-y-4">
                {streamData?.localization_coords ? (
                  <Coordinate 
                    x={streamData.localization_coords.x.toFixed(4)} 
                    y={streamData.localization_coords.y.toFixed(4)} 
                    z={streamData.localization_coords.z.toFixed(4)} 
                  />
                ) : (
                  <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase text-center py-20">Waiting for Signal...</p>
                )}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ControlButton = ({ icon, label }) => (
    <button className="flex flex-col items-center gap-3 group text-[var(--text-muted)] hover:text-sky-500 transition-all">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest opacity-50 group-hover:opacity-100">{label}</span>
    </button>
);

const Card = ({ title, children, className }) => (
    <div className={`bg-[var(--bg-card)] p-10 rounded-3xl border border-[var(--border-color)] shadow-2xl backdrop-blur-md ${className}`}>
        <h2 className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.2em] mb-10">{title}</h2>
        {children}
    </div>
);

const Coordinate = ({ x, y, z }) => (
    <div className="flex items-center text-[var(--text-main)] text-xs font-mono bg-black/5 p-4 rounded-xl border border-[var(--border-color)]">
        <span className="flex-1"><span className="text-[var(--text-muted)] mr-2">X:</span>{x}</span>
        <span className="flex-1"><span className="text-[var(--text-muted)] mr-2">Y:</span>{y}</span>
        <span className="flex-1"><span className="text-[var(--text-muted)] mr-2">Z:</span>{z}</span>
    </div>
);

export default Analysis;
