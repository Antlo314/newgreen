'use client';

import React, { useState } from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';

interface CrtFrameProps {
  children: React.ReactNode;
}

export default function CrtFrame({ children }: CrtFrameProps) {
  const [crtEnabled, setCrtEnabled] = useState(true);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Control Switch bar on top of cabinet */}
      <div className="w-full max-w-[550px] bg-zinc-900 border-2 border-b-0 border-yellow-500/20 rounded-t-xl px-4 py-1.5 flex justify-between items-center text-[10px] font-mono text-gray-400 select-none">
        <span className="text-yellow-405 font-bold uppercase tracking-widest">📺 CRT MONITOR EMULATOR</span>
        <button
          onClick={() => setCrtEnabled(!crtEnabled)}
          className="flex items-center gap-1.5 text-white bg-black/60 hover:bg-black/90 border border-white/10 px-2 py-0.5 rounded cursor-pointer transition-colors active:scale-95"
        >
          <span>SCANLINES:</span>
          {crtEnabled ? (
            <span className="text-emerald-400 font-extrabold flex items-center gap-0.5">ON <ToggleRight size={14} className="text-emerald-400" /></span>
          ) : (
            <span className="text-gray-500 flex items-center gap-0.5">OFF <ToggleLeft size={14} /></span>
          )}
        </button>
      </div>

      {/* Screen Frame Bezel */}
      <div className="relative w-full max-w-[550px] aspect-square rounded-b-2xl bg-zinc-950 p-3 sm:p-5 border-4 border-t-2 border-yellow-500/30 shadow-[0_15px_40px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Curvature & Bezel Shadow Overlays */}
        <div className="absolute inset-0 rounded-b-xl border border-black/80 pointer-events-none z-45" />

        {/* Screen Content Wrapper */}
        <div className={`relative w-full h-full rounded-lg overflow-hidden ${crtEnabled ? 'crt-glow' : ''}`}>
          {children}

          {/* CRT Filters overlay */}
          {crtEnabled && (
            <>
              {/* Scanlines */}
              <div 
                className="absolute inset-0 pointer-events-none z-40 opacity-20 mix-blend-overlay"
                style={{
                  backgroundImage: 'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%)',
                  backgroundSize: '100% 4px',
                }}
              />
              {/* Screen Curved Reflection Highlight */}
              <div 
                className="absolute inset-0 pointer-events-none z-40 opacity-15"
                style={{
                  background: 'radial-gradient(circle at 50% 15%, rgba(255,255,255,0.18) 0%, transparent 60%)',
                }}
              />
              {/* Corner Vignette Shadows */}
              <div 
                className="absolute inset-0 pointer-events-none z-40 shadow-[inset_0_0_20px_rgba(0,0,0,0.9)]"
              />
              {/* Phosphor Flicker */}
              <div className="absolute inset-0 pointer-events-none z-40 animate-crtFlicker bg-white/[0.003] mix-blend-screen" />
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes crtFlicker {
          0% { opacity: 0.985; }
          50% { opacity: 0.995; }
          100% { opacity: 0.985; }
        }
        .animate-crtFlicker {
          animation: crtFlicker 0.15s infinite;
        }
        .crt-glow {
          filter: contrast(1.08) brightness(1.03) saturate(1.05);
          box-shadow: 0 0 10px rgba(234, 179, 8, 0.05);
        }
      `}</style>
    </div>
  );
}
