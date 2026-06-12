'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../src/game/store';

// Lightweight particle system: a fixed pool of points, recycled per burst.
// Bursts are emitted on harvest progress completion and building completion
// by watching store counters.

const POOL = 240;

interface P {
  life: number;
  vx: number;
  vy: number;
  vz: number;
}

export default function Effects() {
  const points = useRef<THREE.Points>(null);
  const particles = useRef<P[]>(Array.from({ length: POOL }, () => ({ life: 0, vx: 0, vy: 0, vz: 0 })));
  const cursor = useRef(0);

  const { positions, colors } = useMemo(() => {
    return {
      positions: new Float32Array(POOL * 3),
      colors: new Float32Array(POOL * 3),
    };
  }, []);

  // emit bursts when resources change
  const lastTotals = useRef<{ wood: number; stone: number; clay: number } | null>(null);
  const lastBuiltCount = useRef(-1);

  const emit = (x: number, y: number, z: number, color: THREE.Color, count: number, spread = 2.4) => {
    const geo = points.current?.geometry;
    if (!geo) return;
    const pos = geo.attributes.position.array as Float32Array;
    const col = geo.attributes.color.array as Float32Array;
    for (let k = 0; k < count; k++) {
      const i = cursor.current;
      cursor.current = (cursor.current + 1) % POOL;
      const p = particles.current[i];
      p.life = 0.7 + Math.random() * 0.5;
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * spread;
      p.vx = Math.cos(a) * r;
      p.vz = Math.sin(a) * r;
      p.vy = 2.5 + Math.random() * 2.5;
      pos[i * 3] = x + (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = y + Math.random() * 0.5;
      pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.4;
      col[i * 3] = color.r * (0.8 + Math.random() * 0.2);
      col[i * 3 + 1] = color.g * (0.8 + Math.random() * 0.2);
      col[i * 3 + 2] = color.b * (0.8 + Math.random() * 0.2);
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  };

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useGame.getState();
    const geo = points.current?.geometry;
    if (!geo) return;

    // --- detect resource gains (harvest bursts at interact target) ---
    if (lastTotals.current) {
      const lt = lastTotals.current;
      const gains: [number, string][] = [
        [s.wood - lt.wood, '#7cb342'],
        [s.stone - lt.stone, '#aeb6bf'],
        [s.clay - lt.clay, '#c4663d'],
      ];
      for (const [gain, c] of gains) {
        if (gain > 0 && s.interactTarget) {
          emit(s.interactTarget.x, 0.8, s.interactTarget.z, new THREE.Color(c), 16);
        }
      }
    }
    lastTotals.current = { wood: s.wood, stone: s.stone, clay: s.clay };

    // --- detect newly completed buildings ---
    const builtCount = s.plots.filter((p) => p.building && p.construction === 0).length;
    if (lastBuiltCount.current >= 0 && builtCount > lastBuiltCount.current) {
      const recent = s.plots.find((p) => p.building && p.construction === 0);
      // celebrate at all completed plots changed this frame (approx: tracked diff)
      for (const p of s.plots) {
        if (p.building && p.construction === 0) {
          // emit only near player to avoid spamming on load
          const d2 = (p.x - s.px) ** 2 + (p.z - s.pz) ** 2;
          if (d2 < 500) emit(p.x, 1.5, p.z, new THREE.Color('#ffd54f'), 8, 3);
        }
      }
      void recent;
    }
    lastBuiltCount.current = builtCount;

    // --- integrate particles ---
    const pos = geo.attributes.position.array as Float32Array;
    let anyAlive = false;
    for (let i = 0; i < POOL; i++) {
      const p = particles.current[i];
      if (p.life <= 0) continue;
      anyAlive = true;
      p.life -= dt;
      p.vy -= 9.5 * dt;
      pos[i * 3] += p.vx * dt;
      pos[i * 3 + 1] = Math.max(0.02, pos[i * 3 + 1] + p.vy * dt);
      pos[i * 3 + 2] += p.vz * dt;
      if (p.life <= 0) {
        pos[i * 3 + 1] = -10; // hide below ground
      }
    }
    if (anyAlive) geo.attributes.position.needsUpdate = true;
  });

  useEffect(() => {
    // park all particles underground initially
    for (let i = 0; i < POOL; i++) positions[i * 3 + 1] = -10;
  }, [positions]);

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.18} vertexColors transparent opacity={0.95} sizeAttenuation />
    </points>
  );
}
