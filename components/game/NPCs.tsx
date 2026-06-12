'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WalkRef } from './Humanoid';
import SkinnedCharacter from './SkinnedCharacter';
import { NPCS, QUESTS } from '../../src/game/data';
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

function NPC({ def }: { def: NPCDef }) {
  const group = useRef<THREE.Group>(null);
  const walkRef = useRef<WalkRef>({ speed: 0 });
  const marker = useRef<THREE.Mesh>(null);
  const seed = useMemo(() => def.x * 7.3 + def.z * 3.1, [def]);

  const questIds = useMemo(() => QUESTS.filter((q) => q.giver === def.id).map((q) => q.id), [def.id]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      // gentle idle sway / turning toward player when near
      const s = useGame.getState();
      const dx = s.px - def.x;
      const dz = s.pz - def.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < 30) {
        const target = Math.atan2(dx, dz);
        const cur = group.current.rotation.y;
        let diff = target - cur;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        group.current.rotation.y = cur + diff * 0.05;
      } else {
        group.current.rotation.y = Math.sin(t * 0.3 + seed) * 0.6;
      }
    }
    // quest marker
    if (marker.current) {
      const s = useGame.getState();
      let kind: 'none' | 'avail' | 'ready' = 'none';
      for (const id of questIds) {
        const st = s.quests[id]?.status;
        if (st === 'ready') {
          kind = 'ready';
          break;
        }
        if (st === 'available') kind = 'avail';
      }
      marker.current.visible = kind !== 'none';
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
    <group position={[def.x, 0, def.z]}>
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
