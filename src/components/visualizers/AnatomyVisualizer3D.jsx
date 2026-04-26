import React, { useState, useEffect } from 'react';
import BrainModel3D from './BrainModel3D';
import HeartModel3D from './HeartModel3D';
import { useStream } from '../../context/StreamContext';
import ErrorBoundary from '../common/ErrorBoundary';

/**
 * AnatomyVisualizer3D
 * Includes a real-time Uncertainty Engine based on AI confidence.
 */
const AnatomyVisualizer3D = () => {
  const [organ, setOrgan] = useState('brain');
  const { data: streamData, isConnected } = useStream();
  const [confidence, setConfidence] = useState(0.98);
  const [localizationCoords, setLocalizationCoords] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (streamData) {
      if (streamData.ai_confidence) setConfidence(streamData.ai_confidence);
      if (streamData.localization_coords) {
         setLocalizationCoords(streamData.localization_coords);
      }
    }
  }, [streamData]);

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden backdrop-blur-md shadow-2xl transition-colors duration-300">
      {/* Control Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-black/5">
        <div className="flex items-center gap-3">
           <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 animate-pulse'}`} />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
             {isConnected ? 'STREAMING' : 'OFFLINE'}
           </span>
        </div>
        
        <div className="flex bg-[var(--bg-main)] rounded-full p-1 border border-[var(--border-color)]">
          <button 
            onClick={() => setOrgan('brain')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${organ === 'brain' ? 'bg-sky-500 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
          >
            BRAIN
          </button>
          <button 
            onClick={() => setOrgan('heart')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${organ === 'heart' ? 'bg-sky-500 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
          >
            HEART
          </button>
        </div>
      </div>

      {/* Model Display Area */}
      <div className="flex-1 relative overflow-hidden bg-[var(--bg-main)]/30">
        {/* Dynamic Uncertainty Glow */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
          style={{ 
            background: `radial-gradient(circle, rgba(14, 165, 233, ${(1 - confidence) * 0.4}) 0%, transparent 70%)`,
          }}
        />

        <ErrorBoundary>
          {organ === 'brain' ? (
            <BrainModel3D localizationCoords={localizationCoords} />
          ) : (
            <HeartModel3D localizationCoords={localizationCoords} />
          )}
        </ErrorBoundary>
        
        {/* Localization Overlay */}
        <div className="absolute bottom-6 right-6 pointer-events-none flex flex-col gap-3">
          <div className="bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--border-color)] px-6 py-4 rounded-2xl shadow-xl">
             <div className="flex justify-between items-baseline mb-2 gap-8">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">AI Confidence</p>
                <p className={`text-xs font-black ${(confidence * 100) > 90 ? 'text-sky-500' : 'text-amber-500'}`}>
                   {(confidence * 100).toFixed(1)}%
                </p>
             </div>
             <div className="h-1 w-32 bg-black/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-sky-500 transition-all duration-500" 
                  style={{ width: `${confidence * 100}%` }} 
                />
             </div>
             <p className="text-[11px] text-[var(--text-main)] font-mono uppercase mt-4 opacity-70">
                {organ} L-AXIS: {streamData?.leads?.lead_i.toFixed(3) || '0.000'}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnatomyVisualizer3D;
