import React, { useRef, useEffect, useState } from 'react';

const ECGViewer = ({ data, anomalies, heartRate, rhythm }) => {
  const canvasRef = useRef(null);
  const [offset, setOffset] = useState(0);

  // Constants for rendering
  const LEAD_NAMES = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
  const ROWS = 12;
  const GRID_SIZE = 20;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationId;
    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const rowHeight = height / ROWS;

      // 1. Clear background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw medical grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      
      // Vertical lines
      for (let x = 0; x < width; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      // Horizontal lines
      for (let y = 0; y < height; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. Draw Waveforms
      ctx.lineWidth = 1.5;
      
      LEAD_NAMES.forEach((lead, i) => {
        const yBase = (i + 0.5) * rowHeight;
        
        // Draw lead name
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px JetBrains Mono';
        ctx.fillText(lead, 10, yBase - rowHeight/2 + 20);

        ctx.beginPath();
        ctx.strokeStyle = '#38bdf8';
        
        // Simulated or real data streaming
        for (let x = 0; x < width; x++) {
          const t = (x + offset) % 1000;
          const val = Math.sin(t * 0.1) * 20 + Math.random() * 2; // placeholder
          
          // Check for anomaly highlighting
          const isAnomaly = anomalies && anomalies.some(a => t > a.start && t < a.end);
          if (isAnomaly) {
            ctx.strokeStyle = '#ef4444';
          } else {
            ctx.strokeStyle = '#38bdf8';
          }

          if (x === 0) ctx.moveTo(x, yBase + val);
          else ctx.lineTo(x, yBase + val);
        }
        ctx.stroke();
      });

      setOffset(prev => (prev + 2) % 1000);
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [offset, anomalies]);

  return (
    <div className="flex flex-col h-full glass rounded-xl overflow-hidden glow-blue">
      <div className="flex justify-between items-center p-4 bg-surface/50 border-b border-white/10">
        <div className="flex gap-6">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 uppercase tracking-tighter">Heart Rate</span>
            <span className="text-xl font-bold text-primary">{heartRate || '--'} <span className="text-xs font-normal">BPM</span></span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 uppercase tracking-tighter">Rhythm</span>
            <span className={`text-xl font-bold ${rhythm === 'Normal' ? 'text-normal' : 'text-anomaly'}`}>
              {rhythm || 'Detecting...'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full border border-primary/30">Stable</div>
          <div className="px-3 py-1 bg-white/5 text-slate-400 text-xs rounded-full border border-white/10 italic">12-Lead Standard</div>
        </div>
      </div>
      
      <div className="flex-1 relative bg-background">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600} 
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default ECGViewer;
