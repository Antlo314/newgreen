'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WalkRef } from './Humanoid';
import SkinnedCharacter from './SkinnedCharacter';
import { NPCS, npcRevealed, npcSpot, QUESTS } from '../../src/game/data';
import { DEFAULT_APPEARANCE } from '../../src/game/customization';
import { useGame } from '../../src/game/store';
import type { NPCDef, PlayerAppearance } from '../../src/game/types';

const SHIRTS: Record<string, string> = {
  gurley: '#5d3a8e',
  rector: '#b03a48',
  stradford: '#2b4a6f',
  gerumba: '#946018',
};

const NPC_MODEL: Record<string, string> = {
  gurley: 'suit_m',
  rector: 'formal_f',
  stradford: 'suit_m',
  gerumba: 'casual_m',
};

export default function NPCs() {
  // founders arrive one-by-one as the main story unfolds, so only the revealed
  // ones (and their huts) exist in the world at any given time.
  const quests = useGame((s) => s.quests);
  const revealed = useMemo(() => NPCS.filter((n) => npcRevealed(n.id, quests)), [quests]);
  return (
    <group>
      {revealed.map((npc) => (
        <React.Fragment key={npc.id}>
          <NPCHome def={npc} />
          <NPC def={npc} />
        </React.Fragment>
      ))}
    </group>
  );
}

const NPC_SPEED = 3.2;

function NPC({ def }: { def: NPCDef }) {
  const root = useRef<THREE.Group>(null);
  const group = useRef<THREE.Group>(null);
  const walkRef = useRef<WalkRef>({ speed: 0 });
  const marker = useRef<THREE.Mesh>(null);
  const seed = useMemo(() => def.x * 7.3 + def.z * 3.1, [def]);

  const questIds = useMemo(() => QUESTS.filter((q) => q.giver === def.id).map((q) => q.id), [def.id]);
  const labelTex = useMemo(() => makeLabelTexture(def.name), [def.name]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const s = useGame.getState();
    const spot = npcSpot(def, s.timeOfDay);
    const r = root.current;
    let speed = 0;
    if (r) {
      // walk toward the scheduled spot (post by day, home off-hours)
      const dx = spot.x - r.position.x;
      const dz = spot.z - r.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.05) {
        const step = Math.min(dist, NPC_SPEED * dt);
        r.position.x += (dx / dist) * step;
        r.position.z += (dz / dist) * step;
        speed = step / Math.max(dt, 0.001);
      }
      // off the clock, once they reach home they step inside the hut and vanish
      const homeDist = Math.hypot(r.position.x - def.home.x, r.position.z - def.home.z);
      r.visible = !(!spot.open && homeDist < 1.0);
    }
    walkRef.current.speed = speed;

    if (group.current && r) {
      let target: number;
      if (speed > 0.3) {
        target = Math.atan2(spot.x - r.position.x, spot.z - r.position.z);
      } else {
        const pdx = s.px - r.position.x;
        const pdz = s.pz - r.position.z;
        if (spot.open && pdx * pdx + pdz * pdz < 30) target = Math.atan2(pdx, pdz);
        else target = Math.sin(t * 0.3 + seed) * 0.6;
      }
      let diff = target - group.current.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      group.current.rotation.y += diff * (speed > 0.3 ? 0.18 : 0.05);
    }

    // quest marker — only when they're at their post and available
    if (marker.current) {
      let kind: 'none' | 'avail' | 'ready' = 'none';
      for (const id of questIds) {
        const st = s.quests[id]?.status;
        if (st === 'ready') {
          kind = 'ready';
          break;
        }
        if (st === 'available') kind = 'avail';
      }
      marker.current.visible = spot.open && kind !== 'none';
      marker.current.position.y = 2.25 + Math.sin(t * 3 + seed) * 0.08;
      const m = marker.current.material as THREE.MeshBasicMaterial;
      m.color.set(kind === 'ready' ? '#ffd54f' : '#7dd3fc');
      marker.current.rotation.y = t * 1.5;
    }
  });

  const appearance: PlayerAppearance = useMemo(
    () => ({
      ...DEFAULT_APPEARANCE,
      model: NPC_MODEL[def.id] ?? 'suit_m',
      skin: def.color,
      shirt: SHIRTS[def.id] ?? '#444444',
      pants: '#2c2c30',
      // HeadGear renders 'crown' fine even though the creator doesn't offer it
      hat: def.hat as PlayerAppearance['hat'],
      hatColor: def.hat === 'headwrap' ? '#c9622f' : '#1c1a18',
      hair: 'classic',
      accessory: 'none',
    }),
    [def]
  );

  return (
    <group ref={root} position={[def.x, 0, def.z]}>
      <group ref={group}>
        <SkinnedCharacter appearance={appearance} walkRef={walkRef} />
      </group>
      {/* gold ground ring marks a founder apart from the everyday townsfolk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.55, 0.74, 28]} />
        <meshBasicMaterial color="#ffd54f" transparent opacity={0.4} depthWrite={false} />
      </mesh>
      {/* floating name tag so you always know who this is */}
      <sprite position={[0, 2.75, 0]} scale={[2.4, 0.6, 1]}>
        <spriteMaterial map={labelTex} transparent depthTest={false} depthWrite={false} />
      </sprite>
      {/* quest marker */}
      <mesh ref={marker} position={[0, 2.25, 0]} visible={false}>
        <octahedronGeometry args={[0.16, 0]} />
        <meshBasicMaterial color="#ffd54f" />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Founder huts — a small home each founder retires into off-hours, tinted with
// their banner colour so the homes read at a glance.
// ---------------------------------------------------------------------------

function NPCHome({ def }: { def: NPCDef }) {
  return (
    <group position={[def.home.x, 0, def.home.z]}>
      {/* walls */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 1.2, 1.8]} />
        <meshStandardMaterial color="#cdb892" roughness={0.95} />
      </mesh>
      {/* thatched pitched roof */}
      <mesh position={[0, 1.45, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.7, 0.95, 4]} />
        <meshStandardMaterial color="#6e4a2f" roughness={0.9} />
      </mesh>
      {/* door */}
      <mesh position={[0, 0.45, 0.91]}>
        <boxGeometry args={[0.5, 0.9, 0.06]} />
        <meshStandardMaterial color="#4a3221" roughness={0.8} />
      </mesh>
      {/* warm windows (read as "someone's home" after dark) */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.7, 0.91]}>
          <boxGeometry args={[0.34, 0.34, 0.04]} />
          <meshStandardMaterial color="#bfe0ea" emissive="#ffd27d" emissiveIntensity={0.35} roughness={0.4} />
        </mesh>
      ))}
      {/* owner's banner above the door, in their colour */}
      <mesh position={[0, 1.12, 0.95]}>
        <boxGeometry args={[0.74, 0.26, 0.05]} />
        <meshStandardMaterial color={def.color} roughness={0.7} />
      </mesh>
      {/* little chimney */}
      <mesh position={[0.6, 1.7, -0.4]} castShadow>
        <boxGeometry args={[0.26, 0.7, 0.26]} />
        <meshStandardMaterial color="#8a5a4a" roughness={1} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Name-tag texture — a small rounded banner drawn to a canvas, shown on a
// camera-facing sprite. No extra dependencies.
// ---------------------------------------------------------------------------

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeLabelTexture(name: string): THREE.Texture {
  if (typeof document === 'undefined') return new THREE.Texture();
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = 'rgba(18,14,10,0.82)';
    roundRect(ctx, 6, 16, 244, 34, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,213,79,0.6)';
    ctx.lineWidth = 2;
    roundRect(ctx, 6, 16, 244, 34, 12);
    ctx.stroke();
    ctx.fillStyle = '#ffe9b0';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 128, 34);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}
