'use client';

import React from 'react';
import { Hammer, Users, Cpu, ArrowRight } from 'lucide-react';

interface DigitalApprentice {
  id: number;
  x: number;
  y: number;
  type: 'wood' | 'stone' | 'clay';
  state: 'walking' | 'harvesting' | 'idle';
  targetX: number;
  targetY: number;
  actionTimer: number;
  skin: string;
  hair: string;
  clothing: string;
  role?: 'gatherer' | 'craftsman'; // Added role
}

interface CraftingWorkshopProps {
  wood: number;
  stone: number;
  clay: number;
  polishedPlank: number;
  reinforcedBrick: number;
  ceramics: number;
  setWood: React.Dispatch<React.SetStateAction<number>>;
  setStone: React.Dispatch<React.SetStateAction<number>>;
  setClay: React.Dispatch<React.SetStateAction<number>>;
  setPolishedPlank: React.Dispatch<React.SetStateAction<number>>;
  setReinforcedBrick: React.Dispatch<React.SetStateAction<number>>;
  setCeramics: React.Dispatch<React.SetStateAction<number>>;
  apprentices: DigitalApprentice[];
  setApprentices: React.Dispatch<React.SetStateAction<DigitalApprentice[]>>;
  playRetroTone: (type: 'strike' | 'success' | 'fail' | 'level', volumeMult?: number) => void;
  addLog: (msg: string) => void;
}

export default function CraftingWorkshop({
  wood, stone, clay,
  polishedPlank, reinforcedBrick, ceramics,
  setWood, setStone, setClay,
  setPolishedPlank, setReinforcedBrick, setCeramics,
  apprentices, setApprentices,
  playRetroTone, addLog
}: CraftingWorkshopProps) {

  // Refine action
  const handleRefine = (type: 'wood' | 'stone' | 'clay') => {
    if (type === 'wood') {
      if (wood < 10) {
        addLog("Fails: Polished Planks require 10 raw wood logs.");
        playRetroTone('fail');
        return;
      }
      setWood(w => w - 10);
      setPolishedPlank(p => p + 1);
      addLog("Refinery: Manually converted 10 Wood -> 1 Polished Plank.");
    } else if (type === 'stone') {
      if (stone < 10) {
        addLog("Fails: Reinforced Bricks require 10 raw stone.");
        playRetroTone('fail');
        return;
      }
      setStone(s => s - 10);
      setReinforcedBrick(b => b + 1);
      addLog("Refinery: Manually converted 10 Stone -> 1 Reinforced Brick.");
    } else {
      if (clay < 10) {
        addLog("Fails: Fine Ceramics require 10 raw clay.");
        playRetroTone('fail');
        return;
      }
      setClay(c => c - 10);
      setCeramics(c => c + 1);
      addLog("Refinery: Manually converted 10 Clay -> 1 Fine Ceramic.");
    }
    playRetroTone('success');
  };

  // Toggle Apprentice Role
  const toggleApprenticeRole = (appId: number) => {
    setApprentices(prev => prev.map(app => {
      if (app.id === appId) {
        const currentRole = app.role || 'gatherer';
        const nextRole = currentRole === 'gatherer' ? 'craftsman' : 'gatherer';
        addLog(`Apprentice Guild: Assigned Apprentice to ${nextRole.toUpperCase()} role.`);
        playRetroTone('success', 0.8);
        return {
          ...app,
          role: nextRole,
          state: 'idle' // reset behavior states
        };
      }
      return app;
    }));
  };

  const craftsmen = apprentices.filter(a => a.role === 'craftsman');
  const gatherers = apprentices.filter(a => !a.role || a.role === 'gatherer');

  return (
    <div className="space-y-4">
      {/* Upper Manual refinery */}
      <div className="p-4 bg-gradient-to-br from-yellow-950/20 to-black rounded-xl border border-yellow-500/20 space-y-3">
        <span className="text-xs font-black text-amber-500 block font-mono uppercase tracking-wider flex items-center gap-1.5">
          <Hammer size={13} /> Manual Refining Workbench
        </span>
        <p className="text-[10px] text-gray-400 font-sans leading-normal">
          Manually process raw commodities into construction materials (rate: 10 to 1 conversion).
        </p>

        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono leading-none pt-1">
          <div className="p-3 bg-black/60 rounded border border-white/5 flex flex-col justify-between h-24">
            <span className="text-white font-bold">🪵 Polished Plank</span>
            <span className="text-gray-500 text-[8.5px] mt-1 font-mono">Needs: 10 Wood</span>
            <button
              onClick={() => handleRefine('wood')}
              className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] uppercase rounded active:scale-95 transition-all cursor-pointer"
            >
              Process +1
            </button>
          </div>
          <div className="p-3 bg-black/60 rounded border border-white/5 flex flex-col justify-between h-24">
            <span className="text-white font-bold">🧱 Reinforced Brick</span>
            <span className="text-gray-500 text-[8.5px] mt-1 font-mono">Needs: 10 Stone</span>
            <button
              onClick={() => handleRefine('stone')}
              className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] uppercase rounded active:scale-95 transition-all cursor-pointer"
            >
              Process +1
            </button>
          </div>
          <div className="p-3 bg-black/60 rounded border border-yellow-500/25 flex flex-col justify-between h-24">
            <span className="text-yellow-400 font-bold">🏺 Fine Ceramic</span>
            <span className="text-gray-500 text-[8.5px] mt-1 font-mono">Needs: 10 Clay</span>
            <button
              onClick={() => handleRefine('clay')}
              className="mt-3 w-full py-1.5 bg-amber-600 hover:bg-amber-505 text-white font-bold text-[9px] uppercase rounded active:scale-95 transition-all cursor-pointer"
            >
              Process +1
            </button>
          </div>
        </div>
      </div>

      {/* Apprentice Workshop Automation section */}
      <div className="p-4 bg-gradient-to-br from-emerald-950/20 to-black rounded-xl border border-emerald-500/20 space-y-3">
        <span className="text-xs font-black text-emerald-400 block font-mono uppercase tracking-wider flex items-center gap-1.5">
          <Users size={13} /> Apprentice Crafting Automation
        </span>
        <p className="text-[10px] text-gray-400 font-sans leading-normal">
          Assign contracted apprentices to the workshop. As **Craftsmen**, they passively refine raw resources inside your ledger every 10 seconds!
        </p>

        <div className="space-y-2">
          {apprentices.length === 0 ? (
            <div className="text-center py-4 bg-black/40 rounded border border-white/5 text-gray-500 text-[10px] italic font-mono">
              Hire apprentices in the main HUD to automate crafting operations.
            </div>
          ) : (
            apprentices.map((app, appIdx) => {
              const isCraftsman = app.role === 'craftsman';
              return (
                <div key={app.id} className="p-2.5 bg-black/55 rounded border border-white/5 flex justify-between items-center text-[10px] font-mono leading-none">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{app.type === 'wood' ? '🪵' : app.type === 'stone' ? '⛏️' : '🏺'}</span>
                    <div>
                      <span className="text-white font-extrabold block">Apprentice #{appIdx + 1} ({app.type.toUpperCase()})</span>
                      <span className="text-gray-500 text-[8px] mt-1 block">Role: <strong className={isCraftsman ? "text-amber-400" : "text-emerald-400"}>{isCraftsman ? 'CRAFTSMAN' : 'GATHERER'}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleApprenticeRole(app.id)}
                    className={`px-2.5 py-1 text-[8.5px] font-extrabold uppercase rounded transition-all active:scale-95 cursor-pointer border ${
                      isCraftsman 
                        ? 'bg-amber-600/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                        : 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    {isCraftsman ? 'Assign Gatherer ➔' : 'Assign Craftsman ➔'}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Live Guild Status Summary */}
        <div className="p-2 bg-zinc-950 rounded border border-white/5 text-[9px] text-gray-500 font-mono flex justify-between select-none">
          <span>Active Gatherers: <strong className="text-white">{gatherers.length}</strong></span>
          <span>•</span>
          <span>Workshop Craftsmen: <strong className="text-amber-400">{craftsmen.length}</strong></span>
        </div>
      </div>
    </div>
  );
}
