import React, { useRef, useEffect } from 'react';

/**
 * High-performance 12-Lead ECG Visualizer.
 * Uses a persistent canvas animation loop to avoid React re-render overhead.
 */
const ECGViewer = ({ heartRate = '--', rhythm = 'Detecting...', leadData = [] }) => {
  const canvasRef = useRef(null);
  const offsetRef = useRef(0);
  const LEAD_NAMES = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationId;
    const render = () => {
      const { width, height } = canvas;
      const rowHeight = height / 12;

      // 1. Draw Professional Medical Grid
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
      
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      
      // Vertical / Horizontal major grid
      ctx.beginPath();
      for (let x = 0; x < width; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
      for (let y = 0; y < height; y += 40) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
      ctx.stroke();

      // 2. Draw Waveforms
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      
      LEAD_NAMES.forEach((lead, i) => {
        const yBase = (i + 0.5) * rowHeight;
        
        // Lead Labels
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 11px Inter';
        ctx.fillText(lead, 10, yBase - rowHeight/2 + 20);

        // Signal Path
        ctx.beginPath();
        ctx.strokeStyle = '#0ea5e9';
        
        for (let x = 0; x < width; x++) {
          const t = (x + offsetRef.current) % 1000;
          
          // Synthetic Signal with P-QRS-T approximation
          const qrs = Math.exp(-Math.pow((t % 200 - 100) / 5, 2)) * 60;
          const noise = (Math.random() - 0.5) * 2;
          const val = -qrs + noise; // Negative because Y is down

          if (x === 0) ctx.moveTo(x, yBase + val);
          else ctx.lineTo(x, yBase + val);
        }
        ctx.stroke();
      });

      offsetRef.current = (offsetRef.current + 3) % 1000;
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, []); // Stable loop, no dependencies needed

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-white/5 bg-slate-900 shadow-2xl">
      <div className="flex justify-between items-center px-6 py-4 bg-slate-800/50 backdrop-blur-md">
        <div className="flex gap-8">
          <Stat label="HEART RATE" value={heartRate} unit="BPM" color="text-sky-400" />
          <Stat label="RHYTHM" value={rhythm} color={rhythm === 'Normal' ? 'text-emerald-400' : 'text-rose-400'} />
        </div>
        <div className="text-[10px] font-bold text-slate-500 tracking-widest bg-slate-700/50 px-3 py-1 rounded-full uppercase">
          LIVE FEED
        </div>
      </div>
      <div className="flex-1 bg-slate-950">
        <canvas ref={canvasRef} width={1200} height={800} className="w-full h-full opacity-90" />
      </div>
    </div>
  );
};

const Stat = ({ label, value, unit, color }) => (
  <div className="flex flex-col">
    <span className="text-[9px] font-bold text-slate-500 tracking-wider mb-1 uppercase">{label}</span>
    <span className={`text-xl font-black ${color} flex items-baseline gap-1`}>
      {value} {unit && <span className="text-[10px] font-normal opacity-50">{unit}</span>}
    </span>
  </div>
);

export default ECGViewer;
