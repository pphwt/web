import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

const ECGCanvas = ({ data, initialData, color = '#0ea5e9', height = 100, label = '' }) => {
  const canvasRef = useRef(null);
  const dataRef   = useRef(initialData ? [...initialData] : []);
  const { isDarkMode: dk } = useTheme();

  useEffect(() => {
    if (data !== undefined) {
      dataRef.current.push(data);
      if (dataRef.current.length > 500) dataRef.current.shift();
    }
  }, [data]);

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

      // Fill background explicitly so no bleed-through
      ctx.fillStyle = dk ? '#060c17' : '#f1f5f9';
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = dk ? 'rgba(14,165,233,0.06)' : 'rgba(100,116,139,0.10)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Waveform — single stroke pass
      if (dataRef.current.length > 2) {
        const step   = w / 500;
        const middle = h / 2;
        const scale  = h * 0.4;

        ctx.beginPath();
        ctx.strokeStyle  = color;
        ctx.lineWidth    = 1.8;
        ctx.lineJoin     = 'round';
        ctx.shadowBlur   = dk ? 6 : 3;
        ctx.shadowColor  = color;

        dataRef.current.forEach((val, i) => {
          const x = i * step;
          const y = middle - val * scale;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, [color, dk]);

  return (
    <div>
      {label && (
        <div className="flex items-center gap-1.5 mb-1 px-0.5">
          <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className={`text-[9px] font-semibold uppercase tracking-wider ${dk ? 'text-slate-500' : 'text-slate-400'}`}>
            {label}
          </span>
        </div>
      )}
      <div className={`w-full rounded-xl overflow-hidden border ${
        dk ? 'border-white/[0.06]' : 'border-slate-200'
      }`}>
        <canvas ref={canvasRef} width={800} height={height} className="w-full block" />
      </div>
    </div>
  );
};

export default React.memo(ECGCanvas);
