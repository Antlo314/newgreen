'use client';

import React from 'react';
import { motion } from 'motion/react';
import { HardHat, Sparkles } from 'lucide-react';

export interface RetroBusinessProps {
  businessId: string; // 'grocery' | 'sugarbowl' | 'bank' | 'hotel' | 'cottage'
  level?: number;     // 1 to 5
  isConstructing?: boolean;
  constructionTimer?: number;
  specialization?: 'A' | 'B' | 'C' | null;
  className?: string;
  isMuted?: boolean;
  masterVolume?: number;
}

const BUSINESS_DETAILS: Record<string, {
  name: string;
  themeColor: string;
  accentColor: string;
  signText: string;
}> = {
  grocery: {
    name: 'Greenwood Grocery',
    themeColor: '#064e3b', // Deep Spruce Emerald
    accentColor: '#10b981',
    signText: 'GROCERY'
  },
  sugarbowl: {
    name: 'Williams Sugar Bowl',
    themeColor: '#78350f', // Warm golden mahogany
    accentColor: '#f59e0b',
    signText: 'SWEETS'
  },
  bank: {
    name: 'Strap & Lock Safe Bank',
    themeColor: '#1e3a8a', // Deep wealth royal blue
    accentColor: '#3b82f6',
    signText: 'BANK'
  },
  hotel: {
    name: 'Gurley Luxury Hotel',
    themeColor: '#3b0764', // Imperial deep violet
    accentColor: '#a855f7',
    signText: 'HOTEL'
  },
  cottage: {
    name: 'Pioneer Cottage',
    themeColor: '#1c1917', // Warm slate charcoal
    accentColor: '#fbbf24',
    signText: 'HAZHOUSE'
  },
  garden: {
    name: 'Community Garden',
    themeColor: '#14532d', // Deep green forest
    accentColor: '#22c55e', // Vibrant grass green
    signText: 'GARDEN'
  }
};

export default function RetroBusiness({
  businessId,
  level = 1,
  isConstructing = false,
  constructionTimer = 0,
  specialization = null,
  className = '',
  isMuted = false,
  masterVolume = 0.5
}: RetroBusinessProps) {

  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const hasPlayedSoundRef = React.useRef<boolean>(false);

  const playConstructionSound = React.useCallback(() => {
    if (isMuted || typeof window === 'undefined') return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Determine sound signature (sawing wood vs metal hammering)
      // Level 3+ or modern industries (bank & hotel) utilize metal hammer cues. Others utilize classic wood saws.
      const isMetal = businessId === 'bank' || businessId === 'hotel' || level >= 3;

      if (isMetal) {
        const now = ctx.currentTime;
        // 3 heavy hammer strike clangs
        for (let strike = 0; strike < 3; strike++) {
          const startTime = now + strike * 0.42;
          const strikeDuration = 0.38;

          // High-frequency crystalline resonance chime
          const chimeOsc1 = ctx.createOscillator();
          chimeOsc1.type = 'sine';
          chimeOsc1.frequency.setValueAtTime(1330, startTime);

          const chimeOsc2 = ctx.createOscillator();
          chimeOsc2.type = 'sine';
          chimeOsc2.frequency.setValueAtTime(1820, startTime);

          // Deep mechanical solid structural impact frequency
          const impactOsc = ctx.createOscillator();
          impactOsc.type = 'triangle';
          impactOsc.frequency.setValueAtTime(175, startTime);
          impactOsc.frequency.exponentialRampToValueAtTime(40, startTime + 0.15);

          const chimeGain = ctx.createGain();
          const impactGain = ctx.createGain();
          const mainGain = ctx.createGain();

          chimeOsc1.connect(chimeGain);
          chimeOsc2.connect(chimeGain);
          impactOsc.connect(impactGain);

          chimeGain.connect(mainGain);
          impactGain.connect(mainGain);
          mainGain.connect(ctx.destination);

          // Rhythmic amplitude envelope
          chimeGain.gain.setValueAtTime(0.18 * masterVolume, startTime);
          chimeGain.gain.exponentialRampToValueAtTime(0.001, startTime + strikeDuration);

          impactGain.gain.setValueAtTime(0.32 * masterVolume, startTime);
          impactGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

          mainGain.gain.setValueAtTime(1.0, startTime);

          chimeOsc1.start(startTime);
          chimeOsc1.stop(startTime + strikeDuration);

          chimeOsc2.start(startTime);
          chimeOsc2.stop(startTime + strikeDuration);

          impactOsc.start(startTime);
          impactOsc.stop(startTime + 0.18);
        }
      } else {
        const now = ctx.currentTime;
        // 3 recursive rhythmic wood sawing scrapes ("shhhwk")
        for (let stroke = 0; stroke < 3; stroke++) {
          const startTime = now + stroke * 0.45;
          const strokeDuration = 0.32;

          // Saw rasp tone
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(110, startTime);
          osc.frequency.linearRampToValueAtTime(175, startTime + strokeDuration * 0.4);
          osc.frequency.linearRampToValueAtTime(85, startTime + strokeDuration);

          // Wood resonance filter
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.Q.setValueAtTime(3.5, startTime);
          filter.frequency.setValueAtTime(650, startTime);
          filter.frequency.exponentialRampToValueAtTime(1150, startTime + strokeDuration * 0.4);
          filter.frequency.exponentialRampToValueAtTime(450, startTime + strokeDuration);

          // Soft rustle noise simulation buffer
          const bufferSize = ctx.sampleRate * strokeDuration;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;

          const noiseFilter = ctx.createBiquadFilter();
          noiseFilter.type = 'bandpass';
          noiseFilter.frequency.setValueAtTime(950, startTime);
          noiseFilter.Q.setValueAtTime(4.5, startTime);

          const oscGain = ctx.createGain();
          const noiseGain = ctx.createGain();
          const mainGain = ctx.createGain();

          osc.connect(filter);
          filter.connect(oscGain);

          noise.connect(noiseFilter);
          noiseFilter.connect(noiseGain);

          oscGain.connect(mainGain);
          noiseGain.connect(mainGain);
          mainGain.connect(ctx.destination);

          oscGain.gain.setValueAtTime(0.12 * masterVolume, startTime);
          oscGain.gain.exponentialRampToValueAtTime(0.01, startTime + strokeDuration);

          noiseGain.gain.setValueAtTime(0.28 * masterVolume, startTime);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + strokeDuration);

          mainGain.gain.setValueAtTime(1.0, startTime);

          osc.start(startTime);
          osc.stop(startTime + strokeDuration);

          noise.start(startTime);
          noise.stop(startTime + strokeDuration);
        }
      }
    } catch {
      // Audio context failure guard
    }
  }, [businessId, level, isMuted, masterVolume]);

  React.useEffect(() => {
    if (isConstructing) {
      if (!hasPlayedSoundRef.current) {
        hasPlayedSoundRef.current = true;
        playConstructionSound();
      }
    } else {
      hasPlayedSoundRef.current = false;
    }
  }, [isConstructing, playConstructionSound]);

  const details = BUSINESS_DETAILS[businessId] || {
    name: 'Cooperative Hub',
    themeColor: '#111827',
    accentColor: '#9ca3af',
    signText: 'COOP'
  };

  if (isConstructing) {
    return (
      <div className={`relative w-full h-full flex flex-col items-center justify-center bg-zinc-950/80 hover:bg-zinc-950/90 rounded-xl border border-amber-500/30 overflow-hidden ${className}`}>
        {/* Scaffolding grid line background overlay */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-0.5 opacity-20 pointer-events-none">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="border border-amber-500/40" />
          ))}
        </div>

        {/* Dynamic Construction SVG */}
        <svg viewBox="0 0 100 100" className="w-10/12 h-10/12 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          <defs>
            <linearGradient id="scaffoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
          </defs>
          
          {/* Base structural pillars */}
          <line x1="15" y1="20" x2="15" y2="85" stroke="url(#scaffoldGrad)" strokeWidth="3" />
          <line x1="85" y1="20" x2="85" y2="85" stroke="url(#scaffoldGrad)" strokeWidth="3" />
          <line x1="15" y1="35" x2="85" y2="35" stroke="url(#scaffoldGrad)" strokeWidth="2.5" />
          <line x1="15" y1="60" x2="85" y2="60" stroke="url(#scaffoldGrad)" strokeWidth="2.5" />
          <line x1="15" y1="80" x2="85" y2="80" stroke="#ca8a04" strokeWidth="3" />
          
          {/* Support structural cross struts */}
          <line x1="15" y1="20" x2="85" y2="60" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,3" />
          <line x1="85" y1="20" x2="15" y2="60" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,3" />
          <line x1="15" y1="60" x2="85" y2="80" stroke="#b45309" strokeWidth="1.8" />
          <line x1="85" y1="60" x2="15" y2="80" stroke="#b45309" strokeWidth="1.8" />

          {/* Golden scaffold outline glow */}
          <circle cx="50" cy="48" r="16" fill="#000000" opacity="0.6" />
          <text x="50" y="52" fill="url(#scaffoldGrad)" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle" className="animate-pulse">
            {constructionTimer}S
          </text>

          {/* Dynamic HardHat illustration block */}
          <path d="M 38,32 C 38,20, 62,20, 62,32 Z" fill="#eab308" />
          <rect x="34" y="31" width="32" height="3.5" fill="#ca8a04" rx="1" />
        </svg>

        <motion.div 
          className="absolute inset-0 bg-yellow-500/10 pointer-events-none"
          animate={{ opacity: [0.08, 0.25, 0.08] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden border border-white/5 rounded-xl bg-zinc-950/40 p-0.5 ${className}`}>
      {/* Visual tier status highlights */}
      {level === 5 && (
        <div className="absolute top-1.5 right-1.5 flex gap-1 z-30 pointer-events-none animate-bounce">
          <Sparkles size={11} className="text-yellow-400 drop-shadow-[0_0_8px_#facc15]" />
          <Sparkles size={8} className="text-white" />
        </div>
      )}

      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_5px_12px_rgba(0,0,0,0.7)]">
        <defs>
          {/* Luxury multi-layered shading gradients */}
          <linearGradient id={`${businessId}ThemeGrad`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={details.accentColor} />
            <stop offset="60%" stopColor={details.themeColor} />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>

          <linearGradient id="luxuryGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9a3412" />
            <stop offset="35%" stopColor="#eab308" />
            <stop offset="65%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>

          <linearGradient id="stoneColumnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#27272a" />
            <stop offset="50%" stopColor="#52525b" />
            <stop offset="100%" stopColor="#18181b" />
          </linearGradient>

          <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.8" />
          </linearGradient>

          {/* 32-Bit Texture Overlays */}
          <pattern id="brickOverlay" width="8" height="6" patternUnits="userSpaceOnUse">
            <path d="M 0 6 L 8 6 M 4 0 L 4 3 M 8 3 L 8 6 M 0 3 L 8 3" fill="none" stroke="#000000" strokeWidth="0.55" opacity="0.6" />
            <path d="M 0 5 L 8 5" fill="none" stroke="#ffffff" strokeWidth="0.3" opacity="0.25" />
          </pattern>

          <pattern id="plankOverlay" width="10" height="5" patternUnits="userSpaceOnUse">
            <line x1="0" y1="5" x2="10" y2="5" stroke="#000000" strokeWidth="0.6" opacity="0.65" />
            <line x1="0" y1="4.5" x2="10" y2="4.5" stroke="#ffffff" strokeWidth="0.3" opacity="0.2" />
          </pattern>

          <pattern id="shingleOverlay" width="8" height="5" patternUnits="userSpaceOnUse">
            <path d="M 0 5 Q 4 8, 8 5" fill="none" stroke="#000000" strokeWidth="0.65" opacity="0.7" />
            <path d="M 0 4.2 Q 4 7.2, 8 4.2" fill="none" stroke="#ffffff" strokeWidth="0.35" opacity="0.2" />
          </pattern>

          <pattern id="soilOverlay" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.6" fill="#facc15" opacity="0.2" />
            <circle cx="4.5" cy="3.5" r="0.5" fill="#ca8a04" opacity="0.3" />
            <circle cx="3" cy="5" r="0.7" fill="#000000" opacity="0.4" />
          </pattern>

          <pattern id="techGridOverlay" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="none" stroke="#ca8a04" strokeWidth="0.4" opacity="0.3" />
            <line x1="0" y1="0" x2="6" y2="6" stroke="#facc15" strokeWidth="0.2" opacity="0.15" />
          </pattern>
        </defs>

        {/* Ambient Occlusion Ground shadows */}
        <ellipse cx="50" cy="94" rx="42" ry="4.5" fill="#000000" opacity="0.65" />

        {/* --- LEVEL INDICATOR TAG --- */}
        <g opacity="0.85">
          <rect x="4" y="4" width="18" height="9" rx="2" fill="#030712" stroke="#eab308" strokeWidth="0.8" />
          <text x="13" y="11" fill="#fbbf24" fontSize="6.5" fontWeight="black" fontFamily="monospace" textAnchor="middle">
            L{level}
          </text>
        </g>

        {/* --- RESIDENTIAL ZONE: PIONEER COTTAGE GRAPHIC --- */}
        {businessId === 'cottage' && (
          <g>
            {/* Timber foundations */}
            <rect x="10" y="84" width="80" height="10" fill="#2d1b09" rx="1" />
            <rect x="12" y="85" width="76" height="2" fill="#ca8a04" />

            {/* Cozy cottage log framing */}
            <rect x="16" y="44" width="68" height="40" fill="url(#cottageThemeGrad)" stroke="#ca8a04" strokeWidth="1" />
            <rect x="16" y="44" width="68" height="40" fill="url(#plankOverlay)" opacity="0.3" />
            
            {/* Log ridges */}
            {Array.from({ length: 5 }).map((_, i) => (
              <line key={i} x1="16" y1={44 + i * 8} x2="84" y2={44 + i * 8} stroke="#09090b" strokeWidth="1" opacity="0.3" />
            ))}

            {/* Symmetrical High-pitch brick fireplace chimney */}
            <rect x="22" y="18" width="10" height="26" fill="#7f1d1d" stroke="#000" strokeWidth="1" />
            <rect x="22" y="18" width="10" height="26" fill="url(#brickOverlay)" opacity="0.4" />
            <rect x="20" y="16" width="14" height="3.5" fill="#450a0a" />
            {/* Smoke effects */}
            <circle cx="27" cy="10" r="3.5" fill="#a1a1aa" opacity="0.5" className="animate-pulse" />
            <circle cx="25" cy="5" r="2.5" fill="#d4d4d8" opacity="0.3" />

            {/* High-fidelity custom angled triangular Roof */}
            <polygon points="10,44 50,15 90,44" fill="#78350f" stroke="url(#luxuryGoldGrad)" strokeWidth="1.8" />
            <polygon points="10,44 50,15 90,44" fill="url(#shingleOverlay)" opacity="0.5" />
            <polygon points="12,42 50,18 88,42" fill="#451a03" opacity="0.6" />

            {/* Polished vintage glass door */}
            <rect x="42" y="56" width="16" height="28" fill="#18181b" stroke="#eab308" strokeWidth="1" />
            <rect x="44" y="58" width="12" height="12" fill="url(#glassReflection)" />
            <circle cx="54" cy="72" r="1.5" fill="#facc15" />

            {/* Lattice windows with highlights */}
            <rect x="20" y="54" width="14" height="16" fill="url(#glassReflection)" stroke="#09090b" strokeWidth="1" rx="1" />
            <line x1="20" y1="62" x2="34" y2="62" stroke="#ffffff" strokeWidth="0.8" opacity="0.5" />
            <line x1="27" y1="54" x2="27" y2="70" stroke="#ffffff" strokeWidth="0.8" opacity="0.5" />

            <rect x="66" y="54" width="14" height="16" fill="url(#glassReflection)" stroke="#09090b" strokeWidth="1" rx="1" />
            <line x1="66" y1="62" x2="80" y2="62" stroke="#ffffff" strokeWidth="0.8" opacity="0.5" />
            <line x1="73" y1="54" x2="73" y2="70" stroke="#ffffff" strokeWidth="0.8" opacity="0.5" />
          </g>
        )}

        {/* --- ECOLOGICAL ZONE: COMMUNITY GARDEN GRAPHIC --- */}
        {businessId === 'garden' && (
          <g>
            {/* Rich black soil background bed with golden border */}
            <rect x="10" y="40" width="80" height="46" fill="#1e130c" rx="6" stroke="#fbbf24" strokeWidth="1.5" />
            <rect x="10" y="40" width="80" height="46" fill="url(#soilOverlay)" rx="6" opacity="0.5" />
            
            {/* Picket fence at the back / sides */}
            {Array.from({ length: 9 }).map((_, i) => (
              <g key={`fence-${i}`}>
                <rect x={14 + i * 8} y="32" width="4" height="15" fill="#f4f4f5" stroke="#71717a" strokeWidth="0.5" />
                <polygon points={`${14 + i * 8},32 ${16 + i * 8},28 ${18 + i * 8},32`} fill="#f4f4f5" stroke="#71717a" strokeWidth="0.5" />
              </g>
            ))}
            <line x1="10" y1="36" x2="90" y2="36" stroke="#a1a1aa" strokeWidth="1.5" />
            <line x1="10" y1="42" x2="90" y2="42" stroke="#a1a1aa" strokeWidth="1" />

            {/* Raised planting rows with sprouts and carrots/veggies */}
            {/* Row 1 (Lettuce / Cabbage) */}
            <ellipse cx="25" cy="52" rx="12" ry="4" fill="#3f2314" />
            <circle cx="20" cy="51" r="2.5" fill="#22c55e" stroke="#15803d" strokeWidth="0.5" />
            <circle cx="25" cy="51" r="3" fill="#22c55e" stroke="#15803d" strokeWidth="0.5" />
            <circle cx="30" cy="51" r="2.5" fill="#22c55e" stroke="#15803d" strokeWidth="0.5" />

            {/* Row 2 (Red flowers / Tomatoes) */}
            <ellipse cx="75" cy="52" rx="12" ry="4" fill="#3f2314" />
            <circle cx="70" cy="51" r="2.5" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.5" />
            <circle cx="75" cy="51" r="3" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.5" />
            <circle cx="80" cy="51" r="2.5" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.5" />

            {/* Row 3 (Wheat / Corn spikes) */}
            <ellipse cx="25" cy="68" rx="14" ry="4" fill="#3f2314" />
            <line x1="18" y1="68" x2="18" y2="58" stroke="#eab308" strokeWidth="1.2" />
            <line x1="25" y1="68" x2="25" y2="56" stroke="#eab308" strokeWidth="1.5" />
            <line x1="32" y1="68" x2="32" y2="58" stroke="#eab308" strokeWidth="1.2" />

            {/* Row 4 (Vibrant Flowers / Lavenders) */}
            <ellipse cx="75" cy="68" rx="14" ry="4" fill="#3f2314" />
            <circle cx="68" cy="67" r="2" fill="#a855f7" />
            <circle cx="75" cy="66" r="2.5" fill="#ec4899" />
            <circle cx="82" cy="67" r="2" fill="#3b82f6" />

            {/* Central Water Fountain */}
            <ellipse cx="50" cy="74" rx="16" ry="6" fill="#4b5563" stroke="#9ca3af" strokeWidth="1" />
            <ellipse cx="50" cy="74" rx="12" ry="4.5" fill="#0284c7" />
            
            {/* Fountain Spout tier */}
            <rect x="48" y="58" width="4" height="15" fill="#d1d5db" rx="1" />
            <ellipse cx="50" cy="58" rx="5" ry="2" fill="#9ca3af" />
            
            {/* Water spray arches */}
            <path d="M 50,56 Q 42,50 38,68" fill="none" stroke="#e0f2fe" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.8" />
            <path d="M 50,56 Q 58,50 62,68" fill="none" stroke="#e0f2fe" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.8" />
            <path d="M 50,56 Q 50,47 50,68" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.9" />

            {/* Sign board: "COMMUNITY GARDEN" */}
            <rect x="25" y="81" width="50" height="9" fill="#78350f" rx="1.5" stroke="#fef08a" strokeWidth="0.8" />
            <text x="50" y="87.5" fill="#fef08a" fontSize="5.5" fontWeight="black" fontFamily="monospace" textAnchor="middle">
              🌱 {details.name.toUpperCase()}
            </text>

            {/* Level-based flora richness scale */}
            {level >= 2 && (
              <g>
                <circle cx="16" cy="46" r="1.5" fill="#facc15" />
                <circle cx="84" cy="46" r="1.5" fill="#f87171" />
              </g>
            )}
            {level >= 3 && (
              <g>
                {/* Additional gold birdbath */}
                <rect x="42" y="72" width="2" height="6" fill="#fbbf24" opacity="0.8" />
                <ellipse cx="43" cy="72" rx="3.5" ry="1.2" fill="#fef08a" opacity="0.9" />
              </g>
            )}
            {level >= 4 && (
              <g>
                {/* Stone stepping path */}
                <circle cx="43" cy="85" r="2" fill="#71717a" />
                <circle cx="57" cy="85" r="2" fill="#71717a" />
              </g>
            )}
            {level >= 5 && (
              <g>
                {/* Extra spectacular particles and golden star sparkles */}
                <path d="M 50,56 Q 30,42 22,60" fill="none" stroke="#fbcfe8" strokeWidth="1" strokeDasharray="1,1" />
                <path d="M 50,56 Q 70,42 78,60" fill="none" stroke="#fbcfe8" strokeWidth="1" strokeDasharray="1,1" />
                <text x="50" y="27" fill="#fbbf24" fontSize="8" fontWeight="black" textAnchor="middle" className="animate-pulse">✨ ROYAL ✨</text>
              </g>
            )}

            {/* Playful sparkling butterflies / flower sparkles */}
            <circle cx="22" cy="42" r="1.5" fill="#fef08a" className="animate-pulse" />
            <circle cx="78" cy="45" r="1" fill="#ec4899" className="animate-pulse" />
            <circle cx="50" cy="40" r="1.2" fill="#60a5fa" className="animate-pulse" />
          </g>
        )}

        {/* --- LEVEL 1: STANDARD STOREFRONT --- */}
        {businessId !== 'cottage' && businessId !== 'garden' && level === 1 && (
          <g>
            {/* Ground steps */}
            <rect x="8" y="86" width="84" height="8" fill="#3f3f46" rx="1" />
            <rect x="12" y="88" width="76" height="6" fill="#27272a" />

            {/* Solid Brickwork main body */}
            <rect x="16" y="44" width="68" height="42" fill={`url(#${businessId}ThemeGrad)`} rx="4" stroke="#ca8a04" strokeWidth="1.2" />
            <rect x="16" y="44" width="68" height="42" fill="url(#brickOverlay)" rx="4" opacity="0.3" />
            
            {/* Sign board base */}
            <rect x="20" y="32" width="60" height="13" fill="#09090b" rx="2" stroke="url(#luxuryGoldGrad)" strokeWidth="1.5" />
            <text x="50" y="41.5" fill="#fbbf24" fontSize="8" fontWeight="black" fontFamily="monospace" textAnchor="middle" letterSpacing="0.8">
              {details.signText}
            </text>

            {/* Cozy glass door */}
            <rect x="42" y="58" width="16" height="28" fill="#18181b" />
            <rect x="44" y="60" width="12" height="11" fill="url(#glassReflection)" />
            <circle cx="54" cy="74" r="1.5" fill="#fbbf24" />

            {/* Small glass show-windows */}
            <rect x="20" y="58" width="16" height="16" fill="url(#glassReflection)" rx="1" stroke="#000" strokeWidth="0.8" />
            <rect x="64" y="58" width="16" height="16" fill="url(#glassReflection)" rx="1" stroke="#000" strokeWidth="0.8" />
          </g>
        )}

        {/* --- LEVEL 2: DUAL GLASS & LANTERNS --- */}
        {businessId !== 'cottage' && businessId !== 'garden' && level === 2 && (
          <g>
            <rect x="6" y="86" width="88" height="8" fill="#3f3f46" rx="1" />

            {/* Upgraded corporate facade */}
            <rect x="15" y="38" width="70" height="48" fill={`url(#${businessId}ThemeGrad)`} rx="5" stroke="url(#luxuryGoldGrad)" strokeWidth="1.6" />
            <rect x="15" y="38" width="70" height="48" fill="url(#brickOverlay)" rx="5" opacity="0.3" />
            <rect x="15" y="38" width="70" height="3" fill="#ffffff" opacity="0.15" />

            {/* Highly detailed double glass doors */}
            <rect x="40" y="52" width="20" height="34" fill="#0c0a09" stroke="#eab308" strokeWidth="1" />
            <rect x="42" y="54" width="7" height="30" fill="url(#glassReflection)" />
            <rect x="51" y="54" width="7" height="30" fill="url(#glassReflection)" />
            <circle cx="47" cy="72" r="1.5" fill="#facc15" />
            <circle cx="53" cy="72" r="1.5" fill="#facc15" />

            {/* Multi-plate premium visual windows */}
            <rect x="19" y="50" width="16" height="24" fill="url(#glassReflection)" rx="1" stroke="#334155" strokeWidth="0.8" />
            <line x1="19" y1="62" x2="35" y2="62" stroke="#ffffff" strokeWidth="1" opacity="0.6" />

            <rect x="65" y="50" width="16" height="24" fill="url(#glassReflection)" rx="1" stroke="#334155" strokeWidth="0.8" />
            <line x1="65" y1="62" x2="81" y2="62" stroke="#ffffff" strokeWidth="1" opacity="0.6" />

            {/* Luxury side banner flags and dynamic neon glow */}
            <polygon points="10,22 17,22 17,38 10,31" fill="#eab308" />
            <line x1="17" y1="18" x2="17" y2="38" stroke="url(#luxuryGoldGrad)" strokeWidth="2.5" />

            {/* Glowing marquee sign */}
            <rect x="22" y="24" width="56" height="13" fill="#09090b" rx="2.5" stroke="url(#luxuryGoldGrad)" strokeWidth="1.8" />
            <text x="50" y="33.5" fill="#fcd34d" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle" letterSpacing="1">
              {details.signText}
            </text>
          </g>
        )}

        {/* --- LEVEL 3: TWO-FLOOR COMMUNION MASTERPIECE --- */}
        {businessId !== 'cottage' && businessId !== 'garden' && level === 3 && (
          <g>
            {/* Grand foundations */}
            <rect x="5" y="86" width="90" height="8" fill="url(#stoneColumnGrad)" rx="1" />

            {/* Floor 1 */}
            <rect x="12" y="50" width="76" height="36" fill="#0c0a09" stroke="#ca8a04" strokeWidth="1" />
            <rect x="12" y="50" width="76" height="36" fill="url(#brickOverlay)" opacity="0.35" />
            
            {/* Decorative structural divider */}
            <rect x="8" y="44" width="84" height="6" fill="url(#luxuryGoldGrad)" rx="1.5" />
            <rect x="12" y="45" width="76" height="1.5" fill="#fef08a" />

            {/* Floor 2 Penthouse Structure */}
            <rect x="15" y="16" width="70" height="28" fill={`url(#${businessId}ThemeGrad)`} stroke="#ca8a04" strokeWidth="1.5" />
            <rect x="15" y="16" width="70" height="28" fill="url(#brickOverlay)" opacity="0.3" />

            {/* Floor 2 Arched luxury panels */}
            <rect x="24" y="22" width="12" height="16" rx="4" fill="url(#glassReflection)" />
            <rect x="44" y="22" width="12" height="16" rx="4" fill="url(#glassReflection)" />
            <rect x="64" y="22" width="12" height="16" rx="4" fill="url(#glassReflection)" />

            {/* Floor 1 Arched Doorway grand frame */}
            <rect x="41" y="54" width="18" height="32" fill="url(#luxuryGoldGrad)" rx="9" />
            <rect x="43" y="56" width="14" height="30" fill="#09090b" rx="7" />
            <rect x="45" y="58" width="10" height="28" fill="url(#glassReflection)" rx="5" />

            {/* Large side landscape display glass panels */}
            <rect x="17" y="56" width="19" height="24" fill="url(#glassReflection)" rx="1" />
            <rect x="64" y="56" width="19" height="24" fill="url(#glassReflection)" rx="1" />

            {/* Lit path options (A, B, C Specializations) */}
            {specialization === 'A' && (
              <g>
                <polygon points="10,44 90,44 84,52 16,52" fill="#eab308" />
                <line x1="20" y1="44" x2="25" y2="52" stroke="#ca8a04" strokeWidth="1.5" />
                <line x1="50" y1="44" x2="50" y2="52" stroke="#ca8a04" strokeWidth="1.5" />
                <line x1="80" y1="44" x2="75" y2="52" stroke="#ca8a04" strokeWidth="1.5" />
              </g>
            )}

            {specialization === 'B' && (
              <g>
                {/* Community stone park benches on perimeter edges */}
                <rect x="2" y="74" width="9" height="12" rx="1.5" fill="#a16207" stroke="#fbbf24" strokeWidth="0.8" />
                <rect x="89" y="74" width="9" height="12" rx="1.5" fill="#a16207" stroke="#fbbf24" strokeWidth="0.8" />
              </g>
            )}

            {specialization === 'C' && (
              <g>
                {/* Advanced eco solar matrices panels */}
                <polygon points="14,16 50,4 86,16" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
                <line x1="50" y1="4" x2="50" y2="16" stroke="#38bdf8" strokeWidth="1" />
              </g>
            )}
          </g>
        )}

        {/* --- LEVEL 4: CLASSIC IMPERIAL MONUMENT PILLARS --- */}
        {businessId !== 'cottage' && businessId !== 'garden' && level === 4 && (
          <g>
            <rect x="4" y="86" width="92" height="8" fill="#18181b" />

            {/* Obsidian grand block structure with pillars */}
            <rect x="12" y="16" width="76" height="70" fill="#09090c" rx="3" stroke="#eab308" strokeWidth="1.5" />
            <rect x="16" y="24" width="68" height="62" fill={`url(#${businessId}ThemeGrad)`} />
            <rect x="16" y="24" width="68" height="62" fill="url(#brickOverlay)" opacity="0.25" />

            {/* Premium 3D Marble pillars (White-gold) */}
            <rect x="14" y="24" width="7" height="62" fill="url(#stoneColumnGrad)" rx="1.5" />
            <rect x="14" y="24" width="2" height="62" fill="#fbbf24" opacity="0.6" />

            <rect x="33" y="24" width="7" height="62" fill="url(#stoneColumnGrad)" rx="1.5" />
            <rect x="33" y="24" width="2" height="62" fill="#fbbf24" opacity="0.6" />

            <rect x="60" y="24" width="7" height="62" fill="url(#stoneColumnGrad)" rx="1.5" />
            <rect x="60" y="24" width="2" height="62" fill="#fbbf24" opacity="0.6" />

            <rect x="79" y="24" width="7" height="62" fill="url(#stoneColumnGrad)" rx="1.5" />
            <rect x="79" y="24" width="2" height="62" fill="#fbbf24" opacity="0.6" />

            {/* Grand Roman Pediment Triangular Crown */}
            <polygon points="8,24 50,2 92,24" fill="url(#luxuryGoldGrad)" stroke="#fcd34d" strokeWidth="1.8" />
            <circle cx="50" cy="14" r="5.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />

            {/* Main high-density tall entrance glass doors */}
            <rect x="42" y="44" width="16" height="42" fill="#1c1917" stroke="url(#luxuryGoldGrad)" strokeWidth="1" />
            <rect x="44" y="46" width="12" height="40" fill="url(#glassReflection)" />

            {/* Dual golden eagle status statues */}
            <circle cx="25" cy="46" r="3" fill="#eab308" />
            <circle cx="75" cy="46" r="3" fill="#eab308" />
          </g>
        )}

        {/* --- LEVEL 5: OBSIDIAN EMPIRE ENTERPRISE TOWER --- */}
        {businessId !== 'cottage' && businessId !== 'garden' && level === 5 && (
          <g>
            {/* Grand stone base tiers */}
            <rect x="4" y="88" width="92" height="10" fill="#030712" />

            {/* Royal Obsidian Glass Skyscraper Block with Gold Lining */}
            <rect x="14" y="12" width="72" height="76" fill="#09090b" rx="6" stroke="url(#luxuryGoldGrad)" strokeWidth="2.2" />
            <rect x="14" y="12" width="72" height="76" fill="url(#techGridOverlay)" opacity="0.4" rx="6" />

            {/* Glowing neon high-tech glass towers */}
            <rect x="19" y="18" width="23" height="64" fill="url(#glassReflection)" rx="3" />
            <rect x="58" y="18" width="23" height="64" fill="url(#glassReflection)" rx="3" />

            {/* Horizontal architectural steel bands */}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={i} x1="19" y1={24 + i * 8} x2="42" y2={24 + i * 8} stroke="#ffffff" strokeWidth="0.8" opacity="0.5" />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={i} x1="58" y1={24 + i * 8} x2="81" y2={24 + i * 8} stroke="#ffffff" strokeWidth="0.8" opacity="0.5" />
            ))}

            {/* Central pneumatic capsule lift columns */}
            <rect x="46" y="12" width="8" height="76" fill="#020617" opacity="0.7" />
            <rect x="47" y="40" width="6" height="14" fill="url(#scaffoldGrad)" rx="1.5" className="animate-pulse" />

            {/* Giant Illuminated Neon Board Sign */}
            <rect x="8" y="1" width="84" height="10" fill="url(#luxuryGoldGrad)" rx="2" stroke="#ffffff" strokeWidth="1" />
            <text x="50" y="8.5" fill="#ffffff" fontSize="6.5" fontWeight="905" fontFamily="monospace" textAnchor="middle" letterSpacing="0.8">
              {details.name.toUpperCase()}
            </text>

            {/* Security sliding portal entrance */}
            <rect x="40" y="66" width="20" height="22" stroke="#06b6d4" strokeWidth="1.5" fill="#020617" />
            <rect x="42" y="68" width="16" height="20" fill="url(#glassReflection)" />
          </g>
        )}
      </svg>
    </div>
  );
}

