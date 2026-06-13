'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WalkRef } from './Humanoid';
import SkinnedCharacter from './SkinnedCharacter';
import { NPCS, npcSpot, QUESTS } from '../../src/game/data';
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
  return (
    <group>
      {NPCS.map((npc) => (
        <NPC key={npc.id} def={npc} />
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
      {/* quest marker */}
      <mesh ref={marker} position={[0, 2.25, 0]} visible={false}>
        <octahedronGeometry args={[0.16, 0]} />
        <meshBasicMaterial color="#ffd54f" />
      </mesh>
    </group>
  );
}
