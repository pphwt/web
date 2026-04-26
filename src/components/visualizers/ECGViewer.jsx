import React, { useEffect, useRef } from 'react';
import { useStream } from '../../context/StreamContext';

const ECGViewer = ({ heartRate, rhythm = "Normal" }) => {
  const canvasRef = useRef(null);
  const dataRef = useRef([]);
  const themeRef = useRef({ grid: '', muted: '', main: '' });
  const { events } = useStream();

  // High-performance event subscription (Zero re-renders)
  useEffect(() => {
    const handleData = (e) => {
      const payload = e.detail;
      if (payload && payload.leads) {
        dataRef.current.push(payload.leads);
        if (dataRef.current.length > 400) dataRef.current.shift();
      }
    };

    if (events) {
      console.log("ECGViewer: Subscribed to Raw Stream");
      events.addEventListener('data', handleData);
      return () => events.removeEventListener('data', handleData);
    } else {
      console.warn("ECGViewer: Raw Stream Events not found");
    }
  }, [events]);

  // Pre-cache theme colors to avoid expensive getComputedStyle in loop
  useEffect(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    themeRef.current = {
      grid: rootStyle.getPropertyValue('--grid-color').trim() || 'rgba(14, 165, 233, 0.08)',
      muted: rootStyle.getPropertyValue('--text-muted').trim() || 'rgba(0, 0, 0, 0.4)',
      main: rootStyle.getPropertyValue('--text-main').trim() || '#0ea5e9'
    };
  }, [rhythm]); // Re-cache on potential theme switch

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      const { width, height } = canvas;
      const buffer = [...dataRef.current]; // Snapshot for stable iteration
      const { grid, muted } = themeRef.current;
      
      ctx.clearRect(0, 0, width, height);
      
      // 1. Draw Grid
      ctx.strokeStyle = grid || 'rgba(14, 165, 233, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += 40) {
        ctx.moveTo(x, 0); ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += 40) {
        ctx.moveTo(0, y); ctx.lineTo(width, y);
      }
      ctx.stroke();

      if (buffer.length < 2) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const rows = 3;
      const cellHeight = height / rows;
      const xStep = width / 400;

      // 2. Draw Leads
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0ea5e9';
      
      // Lead I
      ctx.beginPath();
      for (let i = 0; i < buffer.length; i++) {
        const x = i * xStep;
        const y = cellHeight * 0.5 - (buffer[i].lead_i || 0) * 80;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Lead II
      ctx.beginPath();
      for (let i = 0; i < buffer.length; i++) {
        const x = i * xStep;
        const y = cellHeight * 1.5 - (buffer[i].lead_ii || 0) * 80;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // V5
      ctx.beginPath();
      for (let i = 0; i < buffer.length; i++) {
        const x = i * xStep;
        const y = cellHeight * 2.5 - (buffer[i].v5 || 0) * 80;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 3. Labels
      ctx.fillStyle = muted || '#888';
      ctx.font = 'bold 10px Inter';
      ctx.fillText('LEAD I (PINN)', 20, 25);
      ctx.fillText('LEAD II (AI SOURCE)', 20, cellHeight + 25);
      ctx.fillText('V5 (DIFFUSION)', 20, cellHeight * 2 + 25);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="w-full h-full bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden p-6 flex flex-col shadow-sm transition-colors duration-300">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest italic">Neural Stream</h3>
            <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-md flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-bold text-rose-500 font-mono">{heartRate} BPM</span>
            </div>
        </div>
        <div className="flex gap-2">
           <span className="bg-sky-500/10 text-sky-500 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{rhythm}</span>
        </div>
      </div>
      <canvas 
        ref={canvasRef} 
        width={1000} 
        height={500} 
        className="flex-1 w-full bg-[var(--bg-card)] rounded-2xl"
      />
    </div>
  );
};

export default React.memo(ECGViewer);
