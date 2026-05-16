import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useStream } from '../../context/StreamContext';

const MAX_PTS = 200; // 10 seconds at 20 Hz

const ECGCanvas = ({ data, leadKey, paused = false, initialData, color = '#0ea5e9', height = 100, label = '' }) => {
  const canvasRef = useRef(null);
  const dataRef   = useRef(initialData ? [...initialData] : []);
  const { isDarkMode: dk } = useTheme();
  const { events } = useStream();

  useEffect(() => {
    if (!leadKey || !events || paused) return;
    const handler = (e) => {
      const val = e.detail?.leads?.[leadKey];
      if (val == null) return;
      dataRef.current.push(val);
      if (dataRef.current.length > MAX_PTS) dataRef.current.shift();
    };
    events.addEventListener('data', handler);
    return () => events.removeEventListener('data', handler);
  }, [events, leadKey, paused]);

  useEffect(() => {
    if (leadKey) return;
    if (data !== undefined) {
      dataRef.current.push(data);
      if (dataRef.current.length > MAX_PTS) dataRef.current.shift();
    }
  }, [data, leadKey]);

  useEffect(() => {
    if (initialData) dataRef.current = [...initialData];
  }, [initialData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Background
      ctx.fillStyle = dk ? '#040c18' : '#f8fafc';
      ctx.fillRect(0, 0, w, h);

      // Minor grid (1mm ECG paper = every 20px)
      ctx.strokeStyle = dk ? 'rgba(14,165,233,0.07)' : 'rgba(100,116,139,0.10)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      // Major grid (5mm = every 100px)
      ctx.strokeStyle = dk ? 'rgba(14,165,233,0.14)' : 'rgba(100,116,139,0.18)';
      ctx.lineWidth = 0.8;
      for (let x = 0; x < w; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      // Isoelectric baseline
      const mid = h / 2;
      ctx.strokeStyle = dk ? 'rgba(100,116,139,0.25)' : 'rgba(100,116,139,0.30)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
      ctx.setLineDash([]);

      // Waveform — always span full canvas width
      const pts = dataRef.current;
      if (pts.length > 2) {
        const step  = w / Math.max(pts.length - 1, 1);
        const scale = h * 0.38;

        // Glow pass
        ctx.beginPath();
        ctx.strokeStyle = color + '40';
        ctx.lineWidth   = 4;
        ctx.lineJoin    = 'round';
        ctx.shadowBlur  = 0;
        pts.forEach((val, i) => {
          const x = i * step;
          const y = mid - val * scale;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Main line
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth   = 1.8;
        ctx.shadowBlur  = dk ? 6 : 2;
        ctx.shadowColor = color;
        pts.forEach((val, i) => {
          const x = i * step;
          const y = mid - val * scale;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Live cursor dot at end
        const lastX = (pts.length - 1) * step;
        const lastY = mid - pts[pts.length - 1] * scale;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowBlur  = 8;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Waiting for data
        ctx.fillStyle = dk ? 'rgba(100,116,139,0.3)' : 'rgba(148,163,184,0.5)';
        ctx.font = '11px ui-monospace,monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Acquiring signal…', w / 2, mid + 4);
      }

      raf = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, [color, dk]);

  return (
    <div>
      {label && (
        <div className="flex items-center gap-2 mb-1.5 px-0.5">
          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${dk ? 'text-slate-300' : 'text-slate-600'}`}>
            {label}
          </span>
          <div className={`h-px flex-1 ${dk ? 'bg-white/[0.05]' : 'bg-slate-200'}`} />
          <span className={`text-[9px] font-mono ${dk ? 'text-slate-600' : 'text-slate-400'}`}>25 mm/s · 10 mm/mV</span>
        </div>
      )}
      <div className={`w-full rounded-xl overflow-hidden border ${dk ? 'border-white/[0.07]' : 'border-slate-200'}`}>
        <canvas ref={canvasRef} width={800} height={height} className="w-full block" />
      </div>
    </div>
  );
};

export default React.memo(ECGCanvas);
