import React, { useState } from 'react';
import { Sliders, Zap, Wind, Activity, RotateCcw } from 'lucide-react';
import { useStream } from '../../context/StreamContext';

const PhysicsControlPanel = () => {
  const { sendUpdate } = useStream();
  const [params, setParams] = useState({
    a: 0.1,    // Excitation Threshold
    k: 8.0,    // Action Potential Scaling
    D: 0.0001, // Diffusion / Conductivity
  });

  const updateParam = (key, value) => {
    const newParams = { ...params, [key]: parseFloat(value) };
    setParams(newParams);
    
    // Send update via global context helper
    sendUpdate({
      type: 'parameter_update',
      params: newParams
    });
  };

  const resetParams = () => {
    const defaults = { a: 0.1, k: 8.0, D: 0.0001 };
    setParams(defaults);
    sendUpdate({
      type: 'parameter_update',
      params: defaults
    });
  };

  return (
    <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-color)] rounded-[2rem] p-8 shadow-2xl transition-colors duration-300">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 rounded-xl text-sky-500">
            <Sliders size={20} />
          </div>
          <h2 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest italic">Neural Physics Engine</h2>
        </div>
        <button 
          onClick={resetParams}
          className="p-2 text-[var(--text-muted)] hover:text-sky-500 transition-colors"
          title="Reset to Defaults"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="space-y-10">
        {/* Param A */}
        <div className="space-y-4 group/item relative">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Activity size={14} />
              Threshold (a)
              <div className="group-hover/item:opacity-100 opacity-0 absolute left-0 -top-12 bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-xl shadow-2xl transition-all z-50 w-48 pointer-events-none">
                 <p className="normal-case font-medium text-[10px] text-[var(--text-muted)] leading-relaxed">
                   Determines the minimum electrical input required to trigger a neuronal spike. Higher value = lower sensitivity.
                 </p>
              </div>
            </div>
            <span className="text-sky-500 font-mono">{params.a.toFixed(2)}</span>
          </div>
          <input 
            type="range" min="0" max="0.5" step="0.01"
            value={params.a}
            onChange={(e) => updateParam('a', e.target.value)}
            className="w-full h-2 bg-sky-500/10 rounded-full appearance-none cursor-pointer accent-sky-500 border border-[var(--border-color)]"
          />
          <p className="text-[9px] text-[var(--text-muted)] italic opacity-70">Adjusts the sensitivity of neuronal excitation triggers.</p>
        </div>

        {/* Param K */}
        <div className="space-y-4 group/item relative">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Zap size={14} />
              Magnitude (k)
              <div className="group-hover/item:opacity-100 opacity-0 absolute left-0 -top-12 bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-xl shadow-2xl transition-all z-50 w-48 pointer-events-none">
                 <p className="normal-case font-medium text-[10px] text-[var(--text-muted)] leading-relaxed">
                   Scales the amplitude of the action potential. Increases the peak of the electrical signal.
                 </p>
              </div>
            </div>
            <span className="text-sky-500 font-mono">{params.k.toFixed(1)}</span>
          </div>
          <input 
            type="range" min="1" max="20" step="0.1"
            value={params.k}
            onChange={(e) => updateParam('k', e.target.value)}
            className="w-full h-2 bg-sky-500/10 rounded-full appearance-none cursor-pointer accent-sky-500 border border-[var(--border-color)]"
          />
          <p className="text-[9px] text-[var(--text-muted)] italic opacity-70">Scales the action potential amplitude and signal intensity.</p>
        </div>

        {/* Param D */}
        <div className="space-y-4 group/item relative">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <Wind size={14} />
              Conductivity (D)
              <div className="group-hover/item:opacity-100 opacity-0 absolute left-0 -top-12 bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-xl shadow-2xl transition-all z-50 w-48 pointer-events-none">
                 <p className="normal-case font-medium text-[10px] text-[var(--text-muted)] leading-relaxed">
                   Controls the speed at which electrical signals diffuse through tissue. Mimics neural connectivity.
                 </p>
              </div>
            </div>
            <span className="text-sky-500 font-mono">{params.D.toFixed(5)}</span>
          </div>
          <input 
            type="range" min="0.00001" max="0.001" step="0.00001"
            value={params.D}
            onChange={(e) => updateParam('D', e.target.value)}
            className="w-full h-2 bg-sky-500/10 rounded-full appearance-none cursor-pointer accent-sky-500 border border-[var(--border-color)]"
          />
          <p className="text-[9px] text-[var(--text-muted)] italic opacity-70">Simulates tissue diffusion properties (Signal propagation speed).</p>
        </div>
      </div>

      <div className="mt-10 p-4 bg-sky-500/5 border border-sky-500/10 rounded-2xl">
         <p className="text-[9px] text-sky-500/80 leading-relaxed font-bold uppercase tracking-tighter">
           ⚡ Dynamic Physics Sync Active: PINN weights are being perturbed in real-time based on simulation parameters.
         </p>
      </div>
    </div>
  );
};

export default PhysicsControlPanel;
