'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SkinnedCharacter from './SkinnedCharacter';
import { WalkRef } from './Humanoid';
import { useGame } from '../../src/game/store';
import { deriveResidents, type Resident } from '../../src/game/residents';
import { isNightTime } from '../../src/game/data';
import { RIVER_X } from '../../src/game/world';

// Residents walk the district on a simple schedule: workplaces and the plaza
// by day, home at dusk (they step "indoors" and hide for the night).

const WALK_SPEED = 1.6;
const ARRIVE_DIST = 0.6;

export default function Residents() {
  const plots = useGame((s) => s.plots);
  const residents = useMemo(() => deriveResidents(plots), [plots]);
  return (
    <group>
      {residents.map((r) => (
        <ResidentActor key={r.id} r={r} />
      ))}
    </group>
  );
}

// share the one dusk boundary used by income/lamps so townsfolk don't keep
// strolling for a sliver of dusk after night has otherwise begun
function isNight(t: number) {
  return isNightTime(t);
}

function ResidentActor({ r }: { r: Resident }) {
  const group = useRef<THREE.Group>(null);
  const walkRef = useRef<WalkRef>({ speed: 0 });
  const friend = useGame((s) => (s.relationships[r.id] ?? 0) >= 3);
  const target = useRef<{ x: number; z: number } | null>(null);
  const pauseUntil = useRef(r.seed * 6);
  const clock = useRef(0);

  const pickTarget = (t: number) => {
    if (isNight(t)) {
      // head home for the evening
      target.current = { x: r.home.x + 1.6, z: r.home.z + 1.6 };
      return;
    }
    const roll = Math.random();
    if (r.work && roll < 0.45) {
      // clock in nearby
      const a = Math.random() * Math.PI * 2;
      target.current = { x: r.work.x + Math.cos(a) * 2.4, z: r.work.z + Math.sin(a) * 2.4 };
    } else if (roll < 0.75) {
      // stroll the plaza ring
      const a = Math.random() * Math.PI * 2;
      const rad = 5 + Math.random() * 5;
      target.current = { x: Math.cos(a) * rad, z: Math.sin(a) * rad };
    } else {
      // potter around home
      target.current = {
        x: r.home.x + (Math.random() - 0.5) * 7,
        z: r.home.z + (Math.random() - 0.5) * 7,
      };
    }
    // keep townsfolk on their OWN bank so pathing never cuts across the river
    if (r.home.x > RIVER_X) {
      if (target.current.x < RIVER_X + 4) target.current.x = RIVER_X + 4;
    } else if (target.current.x > 18) {
      target.current.x = 18;
    }
  };

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const g = group.current;
    if (!g) return;
    const s = useGame.getState();
    if (s.phase !== 'playing') return;
    clock.current += dt;

    const night = isNight(s.timeOfDay);

    if (!target.current) {
      if (clock.current >= pauseUntil.current) pickTarget(s.timeOfDay);
      walkRef.current.speed = 0;
      return;
    }

    const dx = target.current.x - g.position.x;
    const dz = target.current.z - g.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist < ARRIVE_DIST) {
      target.current = null;
      walkRef.current.speed = 0;
      pauseUntil.current = clock.current + 2 + Math.random() * 6;
      // arrived home at night → step indoors
      g.visible = !night;
      return;
    }

    g.visible = true;
    const step = WALK_SPEED * dt;
    g.position.x += (dx / dist) * step;
    g.position.z += (dz / dist) * step;
    const targetFacing = Math.atan2(dx, dz);
    let diff = targetFacing - g.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    g.rotation.y += diff * Math.min(1, 8 * dt);
    walkRef.current.speed = WALK_SPEED;
  });

  return (
    <group ref={group} position={[r.home.x + 1.6, 0, r.home.z + 1.6]}>
      <SkinnedCharacter appearance={r.appearance} walkRef={walkRef} scale={0.92} />
      {friend && (
        <mesh position={[0, 2.15, 0]} rotation={[0, 0, Math.PI / 4]}>
          <octahedronGeometry args={[0.12, 0]} />
          <meshBasicMaterial color="#f472b6" />
        </mesh>
      )}
    </group>
  );
}
