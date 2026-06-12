'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../src/game/store';
import type { BuildingId, Plot } from '../../src/game/types';

export default function Buildings() {
  const plots = useGame((s) => s.plots);
  const plotsUnlocked = useGame((s) => s.quests['first_foundations']?.status === 'done');

  return (
    <group>
      {plots.map((p) =>
        p.building ? (
          p.construction > 0 ? (
            <ConstructionSite key={p.id} plot={p} />
          ) : (
            <Building key={p.id} plot={p} />
          )
        ) : (
          <PlotMarker key={p.id} plot={p} unlocked={plotsUnlocked} />
        )
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------

function PlotMarker({ plot, unlocked }: { plot: Plot; unlocked: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const m = ref.current.material as THREE.MeshBasicMaterial;
    m.opacity = unlocked ? 0.35 + Math.sin(state.clock.elapsedTime * 2 + plot.x) * 0.15 : 0.12;
  });
  return (
    <group position={[plot.x, 0, plot.z]}>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial color={unlocked ? '#e8c33a' : '#888888'} transparent opacity={0.2} />
      </mesh>
      {/* corner stakes */}
      {[[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.25, z]} castShadow>
          <boxGeometry args={[0.1, 0.5, 0.1]} />
          <meshStandardMaterial color="#8a6b43" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function ConstructionSite({ plot }: { plot: Plot }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    // building rises out of the ground as construction completes
    const total = plot.level === 1 ? 6 : 4;
    const k = 1 - plot.construction / total;
    ref.current.scale.y = 0.2 + k * 0.8;
  });
  return (
    <group position={[plot.x, 0, plot.z]}>
      <group ref={ref}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[2.4, 1.6, 2.4]} />
          <meshStandardMaterial color="#a9885a" roughness={1} wireframe />
        </mesh>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[2.2, 1.2, 2.2]} />
          <meshStandardMaterial color="#bfa06a" roughness={1} transparent opacity={0.7} />
        </mesh>
      </group>
      {/* material piles */}
      <mesh position={[1.6, 0.18, 1.4]} castShadow>
        <boxGeometry args={[0.7, 0.36, 0.5]} />
        <meshStandardMaterial color="#8a5a2e" roughness={1} />
      </mesh>
      <mesh position={[-1.6, 0.15, 1.3]} castShadow>
        <dodecahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#8d8d94" roughness={1} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------

const WALL: Record<BuildingId, { wall: string; roof: string; trim: string }> = {
  cottage: { wall: '#d9c7a7', roof: '#8c4a32', trim: '#6e4a2f' },
  grocery: { wall: '#cfe3cd', roof: '#3e6b44', trim: '#2c4a30' },
  sugarbowl: { wall: '#f0d9e3', roof: '#a04668', trim: '#6e2e47' },
  workshop: { wall: '#c9b18a', roof: '#5a4632', trim: '#3c2e20' },
  bank: { wall: '#d6d2c4', roof: '#44484f', trim: '#2f3338' },
  hotel: { wall: '#e3d6b8', roof: '#7a2e2e', trim: '#4f1f1f' },
  cultural_hall: { wall: '#caa24a', roof: '#5f3b1e', trim: '#d4af37' },
  garden: { wall: '#7fb069', roof: '#7fb069', trim: '#5a8049' },
};

function Building({ plot }: { plot: Plot }) {
  const id = plot.building!;
  const c = WALL[id];
  const lvlScale = 1 + (plot.level - 1) * 0.12;

  return (
    <group position={[plot.x, 0, plot.z]} scale={lvlScale}>
      {id === 'garden' ? (
        <Garden />
      ) : id === 'cottage' ? (
        <Cottage c={c} />
      ) : id === 'bank' ? (
        <Bank c={c} />
      ) : id === 'hotel' ? (
        <Hotel c={c} />
      ) : id === 'cultural_hall' ? (
        <CulturalHall c={c} />
      ) : (
        <Shop c={c} sign={id === 'grocery' ? '#3e6b44' : id === 'sugarbowl' ? '#a04668' : '#5a4632'} />
      )}
      {/* level stars */}
      {plot.level > 1 &&
        Array.from({ length: plot.level - 1 }).map((_, i) => (
          <mesh key={i} position={[-0.5 + i * 1, 2.9, 0]} >
            <octahedronGeometry args={[0.14, 0]} />
            <meshStandardMaterial color="#d4af37" emissive="#a8861f" emissiveIntensity={0.6} metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
    </group>
  );
}

type Palette = { wall: string; roof: string; trim: string };

function Cottage({ c }: { c: Palette }) {
  return (
    <group>
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.4, 2]} />
        <meshStandardMaterial color={c.wall} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.85, 1.1, 4]} />
        <meshStandardMaterial color={c.roof} roughness={0.85} />
      </mesh>
      <Door z={1.01} color={c.trim} />
      <Window x={-0.7} z={1.01} />
      <Window x={0.7} z={1.01} />
      {/* chimney */}
      <mesh position={[0.7, 2.1, -0.4]} castShadow>
        <boxGeometry args={[0.3, 0.8, 0.3]} />
        <meshStandardMaterial color="#8a5a4a" roughness={1} />
      </mesh>
    </group>
  );
}

function Shop({ c, sign }: { c: Palette; sign: string }) {
  return (
    <group>
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 1.8, 2.2]} />
        <meshStandardMaterial color={c.wall} roughness={0.9} />
      </mesh>
      {/* flat roof with parapet */}
      <mesh position={[0, 1.9, 0]} castShadow>
        <boxGeometry args={[2.8, 0.2, 2.4]} />
        <meshStandardMaterial color={c.roof} roughness={0.85} />
      </mesh>
      {/* awning */}
      <mesh position={[0, 1.35, 1.25]} rotation={[0.5, 0, 0]} castShadow>
        <boxGeometry args={[2.4, 0.06, 0.7]} />
        <meshStandardMaterial color={sign} roughness={0.8} />
      </mesh>
      {/* sign board */}
      <mesh position={[0, 1.7, 1.12]}>
        <boxGeometry args={[1.8, 0.34, 0.08]} />
        <meshStandardMaterial color={c.trim} roughness={0.7} />
      </mesh>
      <Door z={1.11} color={c.trim} />
      <Window x={-0.85} z={1.11} w={0.6} />
      <Window x={0.85} z={1.11} w={0.6} />
    </group>
  );
}

function Bank({ c }: { c: Palette }) {
  return (
    <group>
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 2, 2.4]} />
        <meshStandardMaterial color={c.wall} roughness={0.8} />
      </mesh>
      {/* columns */}
      {[-1, -0.33, 0.33, 1].map((x) => (
        <mesh key={x} position={[x, 1, 1.3]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, 2, 8]} />
          <meshStandardMaterial color="#e8e4d8" roughness={0.6} />
        </mesh>
      ))}
      {/* pediment */}
      <mesh position={[0, 2.35, 0.6]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.1, 0.8, 4]} />
        <meshStandardMaterial color={c.roof} roughness={0.7} />
      </mesh>
      <Door z={1.21} color={c.trim} w={0.7} h={1.1} />
      {/* vault emblem */}
      <mesh position={[0, 1.7, 1.21]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.06, 12]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  );
}

function Hotel({ c }: { c: Palette }) {
  return (
    <group>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 3, 2.4]} />
        <meshStandardMaterial color={c.wall} roughness={0.85} />
      </mesh>
      <mesh position={[0, 3.15, 0]} castShadow>
        <boxGeometry args={[3.2, 0.3, 2.6]} />
        <meshStandardMaterial color={c.roof} roughness={0.8} />
      </mesh>
      {/* window grid */}
      {[-0.95, 0, 0.95].flatMap((x) =>
        [0.9, 1.7, 2.5].map((y) => (
          <mesh key={`${x}-${y}`} position={[x, y, 1.21]}>
            <boxGeometry args={[0.45, 0.5, 0.04]} />
            <meshStandardMaterial color="#bfe0ea" emissive="#ffd27d" emissiveIntensity={0.25} roughness={0.3} />
          </mesh>
        ))
      )}
      {/* entrance canopy */}
      <mesh position={[0, 0.95, 1.45]} castShadow>
        <boxGeometry args={[1.3, 0.08, 0.6]} />
        <meshStandardMaterial color={c.roof} roughness={0.7} />
      </mesh>
      <Door z={1.21} color={c.trim} w={0.7} />
    </group>
  );
}

function CulturalHall({ c }: { c: Palette }) {
  return (
    <group>
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 2.2, 2.8]} />
        <meshStandardMaterial color={c.wall} roughness={0.8} />
      </mesh>
      {/* dome */}
      <mesh position={[0, 2.65, 0]} castShadow>
        <sphereGeometry args={[1.15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={c.trim} metalness={0.7} roughness={0.3} emissive="#5e4a17" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, 3.85, 0]} castShadow>
        <coneGeometry args={[0.12, 0.5, 6]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* grand steps */}
      <mesh position={[0, 0.12, 1.7]} receiveShadow>
        <boxGeometry args={[2.4, 0.24, 0.8]} />
        <meshStandardMaterial color="#b8a888" roughness={0.9} />
      </mesh>
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} position={[x, 1.1, 1.42]} castShadow>
          <cylinderGeometry args={[0.13, 0.15, 2.2, 8]} />
          <meshStandardMaterial color="#e0d6b8" roughness={0.6} />
        </mesh>
      ))}
      <Door z={1.41} color={c.roof} w={0.8} h={1.2} />
    </group>
  );
}

function Garden() {
  return (
    <group>
      {/* beds */}
      {[[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
            <boxGeometry args={[1.2, 0.24, 1.2]} />
            <meshStandardMaterial color="#5e4630" roughness={1} />
          </mesh>
          {[[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3], [0, 0]].map(([px, pz], j) => (
            <mesh key={j} position={[px, 0.36, pz]} castShadow>
              <sphereGeometry args={[0.14, 6, 5]} />
              <meshStandardMaterial color={j % 2 ? '#7fb069' : '#e8c33a'} roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}
      {/* fence */}
      {[-1.55, 1.55].flatMap((v) => [
        <mesh key={`h${v}`} position={[0, 0.3, v]} castShadow>
          <boxGeometry args={[3.2, 0.08, 0.08]} />
          <meshStandardMaterial color="#8a6b43" roughness={1} />
        </mesh>,
        <mesh key={`v${v}`} position={[v, 0.3, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[3.2, 0.08, 0.08]} />
          <meshStandardMaterial color="#8a6b43" roughness={1} />
        </mesh>,
      ])}
    </group>
  );
}

function Door({ z, color, w = 0.55, h = 0.95 }: { z: number; color: string; w?: number; h?: number }) {
  return (
    <mesh position={[0, h / 2, z]}>
      <boxGeometry args={[w, h, 0.06]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}

function Window({ x, z, w = 0.45 }: { x: number; z: number; w?: number }) {
  return (
    <mesh position={[x, 0.95, z]}>
      <boxGeometry args={[w, 0.5, 0.05]} />
      <meshStandardMaterial color="#bfe0ea" emissive="#ffd27d" emissiveIntensity={0.2} roughness={0.3} />
    </mesh>
  );
}
