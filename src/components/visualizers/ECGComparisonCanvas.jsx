import React, { useEffect, useRef } from 'react';

const ECGComparisonCanvas = ({ height = 200 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let offset = 0;

    const render = () => {
      const width = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;
      
      ctx.clearRect(0, 0, width, h);
      
      // Draw Grid
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Generate Simulated Waves for Comparison
      const points = [];
      const residualPoints = [];
      for (let x = 0; x < width; x++) {
        const t = (x + offset) * 0.05;
        // Ground Truth (Raw)
        const ground = Math.sin(t) * 40 + Math.sin(t * 2) * 10 + (Math.random() - 0.5) * 2;
        // AI Prediction (PINN) - Slightly delayed and filtered
        const pred = Math.sin(t - 0.05) * 39 + Math.sin(t * 2) * 11;
        
        points.push({ x, ground, pred });
        residualPoints.push({ x, error: Math.abs(ground - pred) });
      }

      // 1. Draw Ground Truth (Solid Gray)
      ctx.beginPath();
      ctx.strokeStyle = '#94a3b8';
      ctx.setLineDash([]);
      ctx.lineWidth = 1.5;
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, centerY + p.ground);
        else ctx.lineTo(p.x, centerY + p.ground);
      });
      ctx.stroke();

      // 2. Draw AI Prediction (Dashed SkyBlue)
      ctx.beginPath();
      ctx.strokeStyle = '#0ea5e9';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, centerY + p.pred);
        else ctx.lineTo(p.x, centerY + p.pred);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Draw Residual Error (Bottom Strip)
      const stripY = h - 30;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.lineWidth = 1;
      residualPoints.forEach((p, i) => {
        const barHeight = p.error * 2;
        ctx.moveTo(p.x, stripY);
        ctx.lineTo(p.x, stripY - barHeight);
      });
      ctx.stroke();

      offset += 2;
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="relative w-full bg-black/5 rounded-3xl overflow-hidden border border-[var(--border-color)] group">
      <div className="absolute top-4 left-6 flex gap-6 z-10">
        <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-slate-400 rounded-full" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ground Truth (Raw)</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-sky-500 rounded-full border-t border-dashed" />
            <span className="text-[9px] font-black text-sky-500 uppercase tracking-widest">PINN Reconstruction</span>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-6 text-[8px] font-black text-rose-500/50 uppercase tracking-[0.2em] italic">
         Residual Error Analysis (Δ)
      </div>

      <canvas ref={canvasRef} width={1200} height={height} className="w-full block" />
    </div>
  );
};

export default ECGComparisonCanvas;
