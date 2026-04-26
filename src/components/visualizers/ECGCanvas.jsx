import React, { useEffect, useRef } from 'react';

const ECGCanvas = ({ data, initialData, color = "#0ea5e9", height = 100, label = "LEAD" }) => {
  const canvasRef = useRef(null);
  const dataRef = useRef(initialData || []);

  // Sync data to ref for zero-latency access in animation loop
  useEffect(() => {
    if (data !== undefined) {
      dataRef.current.push(data);
      if (dataRef.current.length > 500) dataRef.current.shift();
    }
  }, [data]);

  // Handle static data updates (e.g. switching archives)
  useEffect(() => {
    if (initialData) {
      dataRef.current = initialData;
    }
  }, [initialData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      // Draw Grid (Subtle)
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Draw Waveform
      if (dataRef.current.length > 2) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        
        const step = width / 500;
        const middle = height / 2;
        const scale = height * 0.4;

        dataRef.current.forEach((val, i) => {
          const x = i * step;
          const y = middle - (val * scale);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        
        ctx.stroke();

        // Draw Glow Effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [color]);

  return (
    <div className="relative w-full bg-black/5 rounded-2xl overflow-hidden border border-[var(--border-color)]">
      <div className="absolute top-3 left-4 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{label}</span>
      </div>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={height} 
        className="w-full block"
      />
    </div>
  );
};

export default React.memo(ECGCanvas);
