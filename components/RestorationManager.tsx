'use client';

import React, { useState, useEffect } from 'react';
import { Landmark, ArrowUp, Sparkles, Check, Film, Tv, Play, RotateCw } from 'lucide-react';

interface LandmarkData {
  id: string;
  name: string;
  x: number;
  y: number;
  desc: string;
  lpReward: number;
}

interface RestorationManagerProps {
  discoveredLandmarks: string[];
  restoredLandmarks: string[]; // Holds "id" or "id_stage"
  landmarkStages: Record<string, number>; // e.g. { 'ame_church': 1 }
  setLandmarkStages: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  
  // Resource states
  wood: number;
  stone: number;
  clay: number;
  polishedPlank: number;
  reinforcedBrick: number;
  ceramics: number;
  bswx: number;
  
  // Setters
  setWood: React.Dispatch<React.SetStateAction<number>>;
  setStone: React.Dispatch<React.SetStateAction<number>>;
  setClay: React.Dispatch<React.SetStateAction<number>>;
  setPolishedPlank: React.Dispatch<React.SetStateAction<number>>;
  setReinforcedBrick: React.Dispatch<React.SetStateAction<number>>;
  setCeramics: React.Dispatch<React.SetStateAction<number>>;
  setBswx: React.Dispatch<React.SetStateAction<number>>;
  setReputation: React.Dispatch<React.SetStateAction<number>>;
  setLegacyPoints: React.Dispatch<React.SetStateAction<number>>;
  
  addLog: (msg: string) => void;
  playRetroTone: (type: 'strike' | 'success' | 'fail' | 'level', volumeMult?: number) => void;
}

const HISTORIC_SITES: LandmarkData[] = [
  { id: 'ame_church', name: 'Vernon A.M.E. Church', x: 14, y: 11, desc: 'A spiritual sanctuary built in 1914. Its basement survived the 1921 riots.', lpReward: 15 },
  { id: 'dreamland', name: 'Dreamland Theatre', x: 18, y: 11, desc: 'Loula Williams\' magnificent 750-seat modern cinema.', lpReward: 15 },
  { id: 'daily_star', name: 'Greenwood Daily Star Office', x: 11, y: 18, desc: 'The sovereign newspaper edited by A.J. Smitherman.', lpReward: 15 },
  { id: 'mt_zion', name: 'Mount Zion Baptist Church', x: 21, y: 18, desc: 'A beautiful temple of hope funded entirely by its local congregation.', lpReward: 15 }
];

const HISTORIC_FILMS = [
  "The Symbol of the Unconquered (1920) by Oscar Micheaux",
  "The Crimson Skull (1922) by Lincoln Motion Picture Co.",
  "Ten Minutes to Live (1932) by Oscar Micheaux"
];

export default function RestorationManager({
  discoveredLandmarks, restoredLandmarks,
  landmarkStages, setLandmarkStages,
  wood, stone, clay, polishedPlank, reinforcedBrick, ceramics, bswx,
  setWood, setStone, setClay, setPolishedPlank, setReinforcedBrick, setCeramics, setBswx,
  setReputation, setLegacyPoints, addLog, playRetroTone
}: RestorationManagerProps) {

  // Mini-game state
  const [activeGameSite, setActiveGameSite] = useState<LandmarkData | null>(null);
  const [currentOffset, setCurrentOffset] = useState<number>(0);
  const [lockedOffsets, setLockedOffsets] = useState<number[]>([]);
  const [gameMessage, setGameMessage] = useState<string>("Align the film reel and lock it in the center target!");
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [celebrationFilm, setCelebrationFilm] = useState<string>("");

  // Calculate costs for a landmark stage upgrade
  const getUpgradeCost = (stage: number) => {
    if (stage === 0) {
      return { wood: 15, stone: 15, clay: 15, planks: 0, bricks: 0, bswx: 100 };
    } else if (stage === 1) {
      return { wood: 25, stone: 25, clay: 25, planks: 5, bricks: 5, bswx: 200 };
    } else {
      return { wood: 40, stone: 40, clay: 40, planks: 12, bricks: 12, bswx: 350 };
    }
  };

  // Animate the film reel indicator
  useEffect(() => {
    if (!activeGameSite) return;
    let animId: number;
    let val = 0;
    let dir = 1;
    const loop = () => {
      const speed = 1.8 + (lockedOffsets.length * 1.4);
      val += dir * speed;
      if (val >= 100) {
        val = 100;
        dir = -1;
      } else if (val <= 0) {
        val = 0;
        dir = 1;
      }
      setCurrentOffset(val);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [activeGameSite, lockedOffsets.length]);

  const handleUpgradeLandmark = (site: LandmarkData) => {
    const currentStage = landmarkStages[site.id] || 0;
    if (currentStage >= 3) return; // Max stage

    const cost = getUpgradeCost(currentStage);

    const hasRes = (
      wood >= cost.wood &&
      stone >= cost.stone &&
      clay >= cost.clay &&
      polishedPlank >= cost.planks &&
      reinforcedBrick >= cost.bricks &&
      bswx >= cost.bswx
    );

    if (!hasRes) {
      addLog(`Fails: Awaiting resources for ${site.name} Stage ${currentStage + 1}.`);
      playRetroTone('fail');
      return;
    }

    if (site.id === 'dreamland') {
      // Launch mini-game for Dreamland
      playRetroTone('success', 0.8);
      setLockedOffsets([]);
      setGameMessage("Reel alignment initiated. Press lock when indicator matches center!");
      setShowCelebration(false);
      setActiveGameSite(site);
    } else {
      // Standard direct restoration for other sites
      deductAndUpgrade(site);
    }
  };

  const deductAndUpgrade = (site: LandmarkData) => {
    const currentStage = landmarkStages[site.id] || 0;
    const cost = getUpgradeCost(currentStage);

    // Deduct
    setWood(w => w - cost.wood);
    setStone(s => s - cost.stone);
    setClay(c => c - cost.clay);
    setPolishedPlank(p => p - cost.planks);
    setReinforcedBrick(b => b - cost.bricks);
    setBswx(b => Number((b - cost.bswx).toFixed(2)));

    // Upgrade Stage
    setLandmarkStages(prev => {
      const nextStage = currentStage + 1;
      const next = { ...prev, [site.id]: nextStage };
      addLog(`✨ Landmark Restoration: Upgraded ${site.name} to Stage ${nextStage}!`);
      
      // Award bonuses
      setReputation(r => r + nextStage * 100);
      setLegacyPoints(lp => lp + nextStage * 15);
      
      playRetroTone('level', 1.5);
      return next;
    });
  };

  const handleLockFrame = () => {
    if (!activeGameSite) return;
    const isTarget = currentOffset >= 42 && currentOffset <= 58;

    if (isTarget) {
      playRetroTone('success', 1.0);
      const nextOffsets = [...lockedOffsets, currentOffset];
      setLockedOffsets(nextOffsets);
      
      if (nextOffsets.length >= 3) {
        // Complete the restoration
        const currentStage = landmarkStages[activeGameSite.id] || 0;
        const filmName = HISTORIC_FILMS[currentStage] || "Historic Cinema Reels";
        setCelebrationFilm(filmName);
        setShowCelebration(true);
        setGameMessage("🎥 Perfect Alignment! Projector fully synchronized!");
        deductAndUpgrade(activeGameSite);
      } else {
        setGameMessage(`Reel #${nextOffsets.length} locked successfully! Keep going!`);
      }
    } else {
      playRetroTone('fail', 1.0);
      setLockedOffsets([]); // Reset progression
      setGameMessage("❌ Film snapped! Re-threading the projector... Start over!");
    }
  };

  return (
    <div className="p-4 bg-zinc-950/80 rounded-xl border border-white/5 space-y-4 relative">
      
      {/* 1. TOP HEADER */}
      <div className="border-b border-yellow-500/20 pb-2 flex items-center justify-between">
        <div>
          <span className="text-xs font-black text-yellow-405 font-mono uppercase tracking-wider flex items-center gap-1.5">
            <Landmark size={13} /> Landmark Restoration Registry
          </span>
          <span className="text-[8.5px] text-gray-500 font-mono block mt-0.5">Upgrade ancient landmarks to unlock passive co-op buffs</span>
        </div>
      </div>

      {/* 2. MINI GAME OVERLAY MODAL */}
      {activeGameSite && (
        <div className="absolute inset-0 bg-black/95 rounded-xl border border-yellow-500/30 flex flex-col items-center justify-center p-4 z-50 animate-fadeIn font-mono text-center">
          <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-bold uppercase mb-2">
            <Film size={14} className="animate-spin" />
            <span>Dreamland Cinema Projector</span>
          </div>

          <p className="text-[9.5px] text-gray-300 max-w-xs mb-3 leading-relaxed">
            {activeGameSite.name} Stage {landmarkStages[activeGameSite.id] || 0} → {(landmarkStages[activeGameSite.id] || 0) + 1}
          </p>

          {!showCelebration ? (
            <div className="w-full space-y-4 flex flex-col items-center">
              {/* Target screen / grid visualizer */}
              <div className="w-full max-w-[280px] h-20 bg-zinc-950 rounded border-2 border-zinc-800 relative overflow-hidden flex flex-col items-center justify-center">
                {/* Horizontal sweep alignment lane */}
                <div className="absolute left-[42%] right-[42%] top-0 bottom-0 bg-emerald-500/15 border-x border-emerald-500/30 flex items-center justify-center">
                  <span className="text-[7px] text-emerald-400/60 font-black tracking-widest rotate-90">TARGET</span>
                </div>
                
                {/* Center marker line */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-yellow-500 z-10" />

                {/* Moving projector film frame strip */}
                <div 
                  className="absolute h-10 w-6 bg-amber-500/30 border border-amber-400 rounded flex items-center justify-center shadow-inner"
                  style={{ left: `${currentOffset}%`, transform: 'translateX(-50%)' }}
                >
                  <Tv size={12} className="text-amber-300" />
                </div>

                {/* Film frame tickers */}
                <div className="absolute bottom-1 w-full px-2 flex justify-between text-[7px] text-zinc-600">
                  <span>0%</span>
                  <span>SYNC LENS</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Progress reels indicator */}
              <div className="flex gap-2">
                {[0, 1, 2].map((idx) => (
                  <div 
                    key={idx} 
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-black ${
                      lockedOffsets.length > idx 
                        ? 'bg-emerald-600 border-emerald-400 text-white animate-pulse' 
                        : 'bg-zinc-900 border-zinc-700 text-gray-500'
                    }`}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>

              <div className="text-[9px] text-yellow-405/90 max-w-[240px] leading-snug h-8 px-2">
                {gameMessage}
              </div>

              <div className="flex gap-2 w-full max-w-[280px]">
                <button
                  onClick={() => setActiveGameSite(null)}
                  className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-gray-400 rounded border border-white/5 text-[9px] font-bold uppercase transition-all"
                >
                  ABORT
                </button>
                <button
                  onClick={handleLockFrame}
                  className="flex-1 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-black rounded border border-yellow-400 text-[9px] font-black uppercase transition-all"
                >
                  LOCK FILM REEL
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[280px] space-y-4 flex flex-col items-center">
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-xl space-y-2 text-[9px] text-gray-300 leading-normal">
                <span className="text-emerald-400 font-extrabold text-[10px] block uppercase tracking-wider">🎞️ NOW SCREENING:</span>
                <p className="italic font-sans text-white text-[11px] font-medium">{celebrationFilm}</p>
                <p className="text-gray-400 text-[8.5px]">
                  Loula Williams welcomes the community to the restored hall. Sovereign film creation and representation is secured!
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveGameSite(null);
                  setShowCelebration(false);
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded border border-emerald-400 text-[9.5px] font-black uppercase tracking-wider transition-all"
              >
                PROCEED
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. NORMAL RESTORATION WIDGET LIST */}
      <div className="space-y-3">
        {HISTORIC_SITES.map(site => {
          const isDiscovered = discoveredLandmarks.includes(site.id);
          const currentStage = landmarkStages[site.id] || 0;
          const cost = getUpgradeCost(currentStage);

          if (!isDiscovered) {
            return (
              <div key={site.id} className="p-3 bg-black/40 rounded-lg border border-dashed border-zinc-800 text-center text-gray-650 font-mono text-[10px]">
                ☁️ LANDMARK NOT YET DISCOVERED ON HUD GRID
              </div>
            );
          }

          const hasMaterials = (
            wood >= cost.wood && stone >= cost.stone && clay >= cost.clay &&
            polishedPlank >= cost.planks && reinforcedBrick >= cost.bricks &&
            bswx >= cost.bswx
          );

          return (
            <div key={site.id} className="p-3 bg-zinc-950 border border-white/5 rounded-xl space-y-2 text-[10px] font-mono">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-white font-extrabold flex items-center gap-1.5">
                    🏛️ {site.name} 
                    <span className="text-[8.5px] bg-yellow-500/10 text-yellow-405 px-1.5 py-0.2 rounded font-black border border-yellow-500/25">
                      STAGE {currentStage}/3
                    </span>
                  </h4>
                  <p className="text-gray-400 font-sans text-[9px] mt-0.5 leading-relaxed">{site.desc}</p>
                </div>
              </div>

              {/* Passive buffs details */}
              <div className="p-2 bg-black/40 rounded border border-white/5 text-[8.5px] text-gray-400">
                <span className="text-yellow-400 font-bold block uppercase tracking-wider text-[8px] mb-0.5">Active Buffs:</span>
                {site.id === 'ame_church' && <span>⚡ Restores Stamina (+{currentStage * 3}% passively every 10 seconds)</span>}
                {site.id === 'dreamland' && <span>📈 Passive Reputation Multiplier (+{currentStage * 10}%)</span>}
                {site.id === 'daily_star' && <span>📓 Cartography GPS coin discovery rewards (+{currentStage * 1.5} BSWX)</span>}
                {site.id === 'mt_zion' && <span>🧱 Building component material discounts (-{currentStage * 8}%)</span>}
              </div>

              {/* Upgrade requirements & button */}
              {currentStage < 3 ? (
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-1.5 border-t border-white/5">
                  <div className="text-[8px] text-gray-500 leading-snug">
                    <span>Needs: <strong>{cost.wood}W</strong> / <strong>{cost.stone}S</strong> / <strong>{cost.clay}C</strong></span>
                    {cost.planks > 0 && <span> / <strong>{cost.planks} PLK</strong> / <strong>{cost.bricks} BRK</strong></span>}
                    <span> / <strong>{cost.bswx} B</strong></span>
                  </div>
                  <button
                    onClick={() => handleUpgradeLandmark(site)}
                    disabled={!hasMaterials}
                    className={`px-3 py-1 font-black uppercase rounded transition-all active:scale-95 cursor-pointer text-center flex items-center justify-center gap-1 border ${
                      hasMaterials 
                        ? 'bg-yellow-600 border-yellow-500 text-black hover:bg-yellow-500' 
                        : 'bg-zinc-900 border-zinc-800 text-gray-500 disabled:opacity-50'
                    }`}
                  >
                    <ArrowUp size={10} /> Upgrade Stage
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8.5px] px-2 py-1 rounded text-center font-bold flex items-center justify-center gap-1 select-none">
                  <Check size={11} /> MONUMENT HISTORICALLY PRESERVED & MAXED OUT
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
