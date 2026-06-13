'use client';

import React, { useEffect, useRef } from 'react';
import { useGame } from '../../../src/game/store';
import { NPCS, npcRevealed, QUEST_BY_ID } from '../../../src/game/data';
import { BRIDGE_Z, RIVER_WIDTH, RIVER_X, WORLD_HALF } from '../../../src/game/world';

// Canvas-based minimap. Redraws ~5x/sec — cheap.
export default function Minimap({ size = 148 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const k = size / (WORLD_HALF * 2);
    const toMap = (x: number, z: number) => [(x + WORLD_HALF) * k, (z + WORLD_HALF) * k] as const;

    let raf = 0;
    let last = 0;
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 200) return;
      last = t;
      const s = useGame.getState();

      // ground
      ctx.fillStyle = '#3a6b3a';
      ctx.fillRect(0, 0, size, size);

      // plaza
      ctx.fillStyle = '#8d6248';
      ctx.beginPath();
      const [px0, pz0] = toMap(0, 0);
      ctx.arc(px0, pz0, 9 * k, 0, Math.PI * 2);
      ctx.fill();

      // river
      ctx.fillStyle = '#2e6f8e';
      const [rx] = toMap(RIVER_X - RIVER_WIDTH / 2, 0);
      ctx.fillRect(rx, 0, RIVER_WIDTH * k, size);
      // bridge
      ctx.fillStyle = '#6e4a2f';
      const [, bz] = toMap(0, BRIDGE_Z - 2.6);
      ctx.fillRect(rx - 2, bz, RIVER_WIDTH * k + 4, 5.2 * k);

      // resource nodes
      for (const n of s.nodes) {
        if (n.hp <= 0) continue;
        ctx.fillStyle = n.type === 'wood' ? '#1d4a1d' : n.type === 'stone' ? '#9aa0a8' : '#c4663d';
        const [x, z] = toMap(n.x, n.z);
        ctx.fillRect(x - 1.2, z - 1.2, 2.4, 2.4);
      }

      // plots / buildings
      for (const p of s.plots) {
        const [x, z] = toMap(p.x, p.z);
        if (p.building) {
          ctx.fillStyle = p.construction > 0 ? '#bfa06a' : '#e8c33a';
          ctx.fillRect(x - 2.5, z - 2.5, 5, 5);
        } else {
          ctx.strokeStyle = 'rgba(232,195,58,0.6)';
          ctx.strokeRect(x - 2, z - 2, 4, 4);
        }
      }

      // founders (only those revealed) — the tracked quest giver gets a ring
      const trackedGiver = s.trackedQuest ? QUEST_BY_ID[s.trackedQuest]?.giver : null;
      for (const npc of NPCS) {
        if (!npcRevealed(npc.id, s.quests)) continue;
        const [x, z] = toMap(npc.x, npc.z);
        ctx.fillStyle = '#7dd3fc';
        ctx.beginPath();
        ctx.arc(x, z, 2.4, 0, Math.PI * 2);
        ctx.fill();
        if (npc.id === trackedGiver) {
          ctx.strokeStyle = '#ffd54f';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, z, 4.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // player
      const [x, z] = toMap(s.px, s.pz);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, z, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-lg border border-white/15 opacity-90"
    />
  );
}
