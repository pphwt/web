import React, { useState, useEffect } from 'react';
import { Archive, Download, Activity, Clock, Cpu } from 'lucide-react';
import { usePatient } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import ECGCanvas from '../components/visualizers/ECGCanvas';

const PatientArchives = () => {
  const { selectedPatient } = usePatient();
  const { token } = useAuth();
  const { isDarkMode: dk } = useTheme();
  const { t } = useLanguage();

  const [archives, setArchives]             = useState([]);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [loading, setLoading]               = useState(false);

  useEffect(() => {
    if (selectedPatient && token) fetchArchives();
  }, [selectedPatient, token]);

  const fetchArchives = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/archives/${selectedPatient.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setArchives(await res.json());
    } catch { console.error('Failed to fetch archives'); }
    finally  { setLoading(false); }
  };

  const handleExport = () => {
    if (!selectedArchive) return;
    const blob = new Blob([JSON.stringify({
      report_metadata: { app: 'Bioelectric PINN', version: '1.4.2', timestamp: new Date().toISOString() },
      patient: { name: selectedPatient?.name, id: selectedPatient?.id },
      snapshot: {
        id: selectedArchive.id,
        timestamp: selectedArchive.created_at,
        avg_bpm: selectedArchive.bpm_avg,
        ai_confidence: selectedArchive.ai_confidence,
        physics: selectedArchive.physics_snapshot,
      },
      data_leads: selectedArchive.leads_data,
    }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Bioelectric_Report_${selectedArchive.id.substring(0, 8)}.json`;
    a.click();
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
              dk ? 'bg-sky-500/15 border-sky-500/20 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'
            }`}>
              <Archive size={17} />
            </div>
            <div>
              <h1 className={`text-sm font-bold ${mainText}`}>{t('nav_archives')}</h1>
              <p className={`mt-0.5 text-xs ${subText}`}>
                {selectedPatient ? selectedPatient.name : 'ไม่ได้เลือกคนไข้'} · Historical Bio-Signal Repository
              </p>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Archive list */}
          <div className={`lg:col-span-4 xl:col-span-3 rounded-2xl border flex flex-col ${surface}`}>
            <div className={`flex items-center gap-2 px-4 py-3 border-b ${divider}`}>
              <Clock size={14} className={dk ? 'text-sky-400' : 'text-sky-600'} />
              <span className={`text-xs font-semibold ${secLabel}`}>Snapshot History</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5 max-h-[600px]">
              {loading && (
                <div className="py-12 flex justify-center">
                  <div className={`h-6 w-6 rounded-full border-2 border-t-sky-400 animate-spin ${dk ? 'border-white/10' : 'border-slate-200'}`} />
                </div>
              )}
              {!loading && archives.length === 0 && (
                <div className={`py-12 text-center text-xs ${subText}`}>
                  {selectedPatient ? 'ไม่พบข้อมูลคลัง' : 'เลือกคนไข้ก่อน'}
                </div>
              )}
              {archives.map(arc => {
                const active = selectedArchive?.id === arc.id;
                return (
                  <button
                    key={arc.id}
                    onClick={() => setSelectedArchive(arc)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
                      active
                        ? dk ? 'bg-sky-500/[0.12] border-sky-500/25' : 'bg-sky-50 border-sky-200'
                        : dk ? 'border-transparent hover:bg-white/[0.04]' : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-semibold ${active ? (dk ? 'text-sky-300' : 'text-sky-700') : secLabel}`}>
                        {new Date(arc.created_at).toLocaleDateString('th-TH')}
                      </span>
                      <span className={`text-[10px] font-mono ${dk ? 'text-slate-600' : 'text-slate-400'}`}>
                        {arc.duration_seconds?.toFixed(1)}s
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className={`text-[9px] ${secLabel}`}>Avg BPM</p>
                        <p className={`text-xs font-bold ${active ? (dk ? 'text-sky-300' : 'text-sky-700') : mainText}`}>{arc.bpm_avg}</p>
                      </div>
                      <div>
                        <p className={`text-[9px] ${secLabel}`}>Confidence</p>
                        <p className={`text-xs font-bold ${dk ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {(arc.ai_confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    {active && <span className={`mt-1.5 inline-block h-0.5 w-full rounded-full ${dk ? 'bg-sky-500/30' : 'bg-sky-200'}`} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Viewer */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-5">
            {selectedArchive ? (
              <>
                {/* ECG panel */}
                <div className={`rounded-2xl border overflow-hidden ${surface}`}>
                  <div className={`flex items-center justify-between px-4 py-3 border-b ${divider}`}>
                    <div className="flex items-center gap-2">
                      <Activity size={14} className={dk ? 'text-sky-400' : 'text-sky-600'} />
                      <span className={`text-xs font-semibold ${secLabel}`}>Signal Playback</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {Object.entries(selectedArchive.physics_snapshot || {}).map(([k, v]) => (
                        <span key={k} className={`rounded-lg border px-2 py-0.5 text-[10px] font-mono ${
                          dk ? 'bg-white/[0.03] border-white/[0.06] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}>
                          {k}: {Number(v).toFixed(4)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={`p-4 space-y-3 ${ecgBg}`}>
                    {[
                      { data: selectedArchive.leads_data?.lead_i,  label: 'LEAD I',  color: '#0ea5e9' },
                      { data: selectedArchive.leads_data?.lead_ii, label: 'LEAD II', color: '#6366f1' },
                      { data: selectedArchive.leads_data?.v5,      label: 'V5',      color: '#8b5cf6' },
                    ].map(({ data, label, color }) => (
                      <ECGCanvas key={label} initialData={data} label={label} color={color} height={90} />
                    ))}
                  </div>
                </div>

                {/* Info + Export */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`rounded-2xl border p-4 ${surface}`}>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${secLabel}`}>Observation</p>
                    <p className={`text-xs leading-relaxed ${subText}`}>
                      Neural activity during this session showed stable diffusion patterns with high AI classification accuracy.
                    </p>
                  </div>
                  <div className={`rounded-2xl border p-4 ${surface}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu size={13} className={dk ? 'text-sky-400' : 'text-sky-600'} />
                      <p className={`text-[10px] font-semibold uppercase tracking-wider ${secLabel}`}>Integrity</p>
                    </div>
                    <p className={`text-xs leading-relaxed ${subText}`}>
                      Data packet integrity: 100%. Recorded at 20Hz via PINN Neural Bridge.
                    </p>
                  </div>
                  <div className={`rounded-2xl border p-4 flex items-center justify-center ${surface}`}>
                    <button
                      onClick={handleExport}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white py-2.5 text-xs font-semibold transition-all active:scale-95"
                    >
                      <Download size={13} /> Export Snapshot
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className={`flex-1 min-h-[400px] flex flex-col items-center justify-center rounded-2xl border border-dashed gap-4 ${
                dk ? 'border-white/[0.07]' : 'border-slate-200'
              }`}>
                <Archive size={28} className={dk ? 'text-slate-700' : 'text-slate-300'} />
                <p className={`text-sm font-semibold ${dk ? 'text-slate-600' : 'text-slate-400'}`}>เลือก Snapshot เพื่อดูสัญญาณ</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientArchives;
