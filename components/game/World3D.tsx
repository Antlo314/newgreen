'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader, ThreeEvent } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { useGame } from '../../src/game/store';
import { audio } from '../../src/game/audio';
import {
  BRIDGE_HALF_WIDTH,
  BRIDGE_Z,
  RIVER_WIDTH,
  RIVER_X,
  WORLD_HALF,
  generateFlowers,
  generateGrassTufts,
  generateLamps,
} from '../../src/game/world';

const tmpObj = new THREE.Object3D();
const tmpColor = new THREE.Color();

export default function World3D() {
  return (
    <group>
      <Ground />
      <Plaza />
      <River />
      <ResourceNodes />
      <Decorations />
      <Lamps />
      <MoveMarker />
      <InteractHighlight />
      <EventBeacon />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Live-event beacon — a pulsing pillar of light over the active Market Rush /
// Rich Find. Reads the store imperatively so it never forces React re-renders.
// ---------------------------------------------------------------------------

function EventBeacon() {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const col = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const ev = useGame.getState().activeEvent;
    const g = group.current;
    if (!g) return;
    if (!ev) {
      g.visible = false;
      return;
    }
    g.visible = true;
    g.position.set(ev.x, 0, ev.z);

    const t = state.clock.elapsedTime;
    col.set(ev.kind === 'rush' ? '#ffd54f' : '#5eead4');
    const urgency = 1 - ev.timeLeft / ev.duration; // beats faster as time runs out
    const pulse = 0.6 + Math.sin(t * (4 + urgency * 9)) * 0.4;

    if (core.current) {
      core.current.rotation.y = t * 1.6;
      core.current.position.y = 3 + Math.sin(t * 2) * 0.2;
      (core.current.material as THREE.MeshBasicMaterial).color.copy(col);
      core.current.scale.setScalar(0.9 + pulse * 0.3);
    }
    if (beam.current) {
      const m = beam.current.material as THREE.MeshBasicMaterial;
      m.color.copy(col);
      m.opacity = 0.16 + pulse * 0.16;
    }
    if (ring.current) {
      const m = ring.current.material as THREE.MeshBasicMaterial;
      m.color.copy(col);
      m.opacity = 0.4 + pulse * 0.3;
      ring.current.scale.setScalar(1 + Math.sin(t * 3) * 0.15);
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={beam} position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.45, 0.7, 6.4, 16, 1, true]} />
        <meshBasicMaterial
          color="#ffd54f"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={core} position={[0, 3, 0]}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshBasicMaterial color="#ffd54f" transparent opacity={0.95} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[1.2, 1.6, 32]} />
        <meshBasicMaterial color="#ffd54f" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------

function Ground() {
  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    audio.unlock();
    const s = useGame.getState();
    if (s.phase !== 'playing' || s.dialogue) return;
    s.setMoveTarget({ x: e.point.x, z: e.point.z });
  };

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
      onPointerDown={onPointerDown}
    >
      <planeGeometry args={[WORLD_HALF * 2 + 30, WORLD_HALF * 2 + 30]} />
      <meshStandardMaterial color="#4d8a4a" roughness={1} />
    </mesh>
  );
}

function Plaza() {
  return (
    <group>
      {/* plaza brick circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[9, 40]} />
        <meshStandardMaterial color="#9a6a4f" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[8.4, 9, 40]} />
        <meshStandardMaterial color="#7a513c" roughness={0.95} />
      </mesh>
      {/* main street east-west */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
        <planeGeometry args={[40, 4.4]} />
        <meshStandardMaterial color="#8d6248" roughness={1} />
      </mesh>
      {/* avenue north-south */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
        <planeGeometry args={[4.4, 40]} />
        <meshStandardMaterial color="#8d6248" roughness={1} />
      </mesh>
      {/* road to bridge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(RIVER_X + 20) / 2 + 1, 0.014, BRIDGE_Z]} receiveShadow>
        <planeGeometry args={[RIVER_X + 26, 3.6]} />
        <meshStandardMaterial color="#8d6248" roughness={1} />
      </mesh>

      {/* central monument — obelisk of the founders */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.5, 1.7, 0.7, 8]} />
          <meshStandardMaterial color="#776655" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.9, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.55, 2.6, 4]} />
          <meshStandardMaterial color="#8a7a66" roughness={0.6} />
        </mesh>
        <mesh position={[0, 3.45, 0]} castShadow>
          <coneGeometry args={[0.4, 0.7, 4]} />
          <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.25} emissive="#a8861f" emissiveIntensity={0.35} />
        </mesh>
      </group>
    </group>
  );
}

function River() {
  const water = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (water.current) {
      const m = water.current.material as THREE.MeshStandardMaterial;
      m.opacity = 0.85 + Math.sin(state.clock.elapsedTime * 1.4) * 0.06;
    }
  });
  return (
    <group>
      {/* river bed */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[RIVER_X, 0.005, 0]}>
        <planeGeometry args={[RIVER_WIDTH + 1.6, WORLD_HALF * 2 + 30]} />
        <meshStandardMaterial color="#3c4f3a" roughness={1} />
      </mesh>
      {/* water */}
      <mesh ref={water} rotation={[-Math.PI / 2, 0, 0]} position={[RIVER_X, 0.05, 0]}>
        <planeGeometry args={[RIVER_WIDTH, WORLD_HALF * 2 + 30]} />
        <meshStandardMaterial color="#2e6f8e" transparent opacity={0.88} roughness={0.15} metalness={0.1} />
      </mesh>
      {/* bridge */}
      <group position={[RIVER_X, 0, BRIDGE_Z]}>
        <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
          <boxGeometry args={[RIVER_WIDTH + 2.4, 0.25, BRIDGE_HALF_WIDTH * 2]} />
          <meshStandardMaterial color="#6e4a2f" roughness={0.9} />
        </mesh>
        {/* rails */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[0, 0.62, side * (BRIDGE_HALF_WIDTH - 0.15)]} castShadow>
            <boxGeometry args={[RIVER_WIDTH + 2.4, 0.12, 0.12]} />
            <meshStandardMaterial color="#5a3b24" roughness={0.9} />
          </mesh>
        ))}
        {[-2.8, 0, 2.8].flatMap((x) =>
          [-1, 1].map((side) => (
            <mesh key={`${x}-${side}`} position={[x, 0.4, side * (BRIDGE_HALF_WIDTH - 0.15)]} castShadow>
              <boxGeometry args={[0.14, 0.6, 0.14]} />
              <meshStandardMaterial color="#5a3b24" roughness={0.9} />
            </mesh>
          ))
        )}
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// GLB instancing helpers — Kenney models flattened to baked geometry parts so
// every model variant stays a handful of instanced draw calls.
// ---------------------------------------------------------------------------

interface ModelPart {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

/** Extract baked, ground-centered, size-normalized geometry parts from a GLB. */
function useModelParts(url: string, targetSize: number, fit: 'height' | 'width' = 'height'): ModelPart[] {
  const { scene } = useLoader(GLTFLoader, url);
  return useMemo(() => {
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const measure = fit === 'height' ? size.y : Math.max(size.x, size.z);
    const k = targetSize / Math.max(0.0001, measure);
    const cx = (box.min.x + box.max.x) / 2;
    const cz = (box.min.z + box.max.z) / 2;
    const parts: ModelPart[] = [];
    scene.traverse((o: THREE.Object3D) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const g = m.geometry.clone();
      g.applyMatrix4(m.matrixWorld);
      g.translate(-cx, -box.min.y, -cz);
      g.scale(k, k, k);
      parts.push({ geometry: g, material: m.material as THREE.Material });
    });
    return parts;
  }, [scene, targetSize, fit]);
}

const MAXI = 200;

/** One instancedMesh per geometry part, all driven by the same matrix list. */
function InstancedParts({
  parts,
  matrices,
  castShadow = false,
}: {
  parts: ModelPart[];
  matrices: THREE.Matrix4[];
  castShadow?: boolean;
}) {
  return (
    <>
      {parts.map((p, i) => (
        <PartInstances key={i} part={p} matrices={matrices} castShadow={castShadow} />
      ))}
    </>
  );
}

function PartInstances({
  part,
  matrices,
  castShadow,
}: {
  part: ModelPart;
  matrices: THREE.Matrix4[];
  castShadow: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    for (let i = 0; i < matrices.length; i++) m.setMatrixAt(i, matrices[i]);
    m.count = matrices.length;
    m.instanceMatrix.needsUpdate = true;
  }, [matrices]);
  return (
    <instancedMesh
      ref={ref}
      args={[part.geometry, part.material, MAXI]}
      castShadow={castShadow}
      frustumCulled={false}
    />
  );
}

// matrix pool reused across recomputes to avoid per-frame allocation during regrowth
const matrixPool: THREE.Matrix4[] = [];
let poolCursor = 0;
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler();
const tmpPos = new THREE.Vector3();
const tmpScale = new THREE.Vector3();

function poolMatrix(x: number, y: number, z: number, rotY: number, sx: number, sy: number, sz: number) {
  const m = (matrixPool[poolCursor] ??= new THREE.Matrix4());
  poolCursor++;
  tmpPos.set(x, y, z);
  tmpQuat.setFromEuler(tmpEuler.set(0, rotY, 0));
  tmpScale.set(sx, sy, sz);
  return m.compose(tmpPos, tmpQuat, tmpScale);
}

// ---------------------------------------------------------------------------
// Resource nodes — instanced Kenney trees, rocks, stumps (+ depleted variants)
// ---------------------------------------------------------------------------

function ResourceNodes() {
  const oakParts = useModelParts('/models/nature/tree_oak.glb', 4.1);
  const treeParts = useModelParts('/models/nature/tree_default.glb', 3.5);
  const stumpParts = useModelParts('/models/nature/stump_roundDetailed.glb', 0.5);
  const rockParts = useModelParts('/models/nature/stone_largeA.glb', 1.7, 'width');
  const rubbleParts = useModelParts('/models/nature/stone_smallFlatA.glb', 1.2, 'width');

  const nodesVersion = useGame((s) => s.nodesVersion);

  const sets = useMemo(() => {
    void nodesVersion;
    poolCursor = 0;
    const nodes = useGame.getState().nodes;
    const oaks: THREE.Matrix4[] = [];
    const trees: THREE.Matrix4[] = [];
    const stumps: THREE.Matrix4[] = [];
    const rocks: THREE.Matrix4[] = [];
    const rubble: THREE.Matrix4[] = [];
    const clay: THREE.Matrix4[] = [];
    const dug: THREE.Matrix4[] = [];

    for (const n of nodes) {
      const alive = n.hp > 0;
      const scaleK = 0.85 + n.seed * 0.4;
      const rot = n.seed * Math.PI * 2;
      if (n.type === 'wood') {
        if (alive) {
          const s = scaleK * (0.7 + (n.hp / n.maxHp) * 0.3);
          (n.seed > 0.5 ? oaks : trees).push(poolMatrix(n.x, 0, n.z, rot, s, s, s));
        } else {
          stumps.push(poolMatrix(n.x, 0, n.z, rot, scaleK, scaleK, scaleK));
        }
      } else if (n.type === 'stone') {
        if (alive) {
          const s = scaleK * (0.7 + (n.hp / n.maxHp) * 0.3);
          rocks.push(poolMatrix(n.x, 0, n.z, rot, s, s, s));
        } else {
          rubble.push(poolMatrix(n.x, 0, n.z, rot, scaleK, scaleK, scaleK));
        }
      } else {
        if (alive) clay.push(poolMatrix(n.x, 0.1, n.z, rot, scaleK, scaleK * 0.5, scaleK));
        else dug.push(poolMatrix(n.x, 0.02, n.z, rot, scaleK, 0.15, scaleK));
      }
    }
    return { oaks, trees, stumps, rocks, rubble, clay, dug };
  }, [nodesVersion]);

  return (
    <group>
      <InstancedParts parts={oakParts} matrices={sets.oaks} castShadow />
      <InstancedParts parts={treeParts} matrices={sets.trees} castShadow />
      <InstancedParts parts={stumpParts} matrices={sets.stumps} />
      <InstancedParts parts={rockParts} matrices={sets.rocks} castShadow />
      <InstancedParts parts={rubbleParts} matrices={sets.rubble} />
      {/* clay mounds stay procedural — they read as dug earth */}
      <ClayMounds matrices={sets.clay} dugMatrices={sets.dug} />
    </group>
  );
}

function ClayMounds({ matrices, dugMatrices }: { matrices: THREE.Matrix4[]; dugMatrices: THREE.Matrix4[] }) {
  const mounds = useRef<THREE.InstancedMesh>(null);
  const dug = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    if (mounds.current) {
      matrices.forEach((m, i) => mounds.current!.setMatrixAt(i, m));
      mounds.current.count = matrices.length;
      mounds.current.instanceMatrix.needsUpdate = true;
    }
    if (dug.current) {
      dugMatrices.forEach((m, i) => dug.current!.setMatrixAt(i, m));
      dug.current.count = dugMatrices.length;
      dug.current.instanceMatrix.needsUpdate = true;
    }
  }, [matrices, dugMatrices]);
  return (
    <group>
      <instancedMesh ref={mounds} args={[undefined, undefined, MAXI]} castShadow frustumCulled={false}>
        <sphereGeometry args={[0.8, 10, 7]} />
        <meshStandardMaterial color="#b35c3a" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={dug} args={[undefined, undefined, MAXI]} frustumCulled={false}>
        <sphereGeometry args={[0.8, 8, 6]} />
        <meshStandardMaterial color="#7e4128" roughness={1} />
      </instancedMesh>
    </group>
  );
}

useLoader.preload(GLTFLoader, '/models/nature/tree_oak.glb');
useLoader.preload(GLTFLoader, '/models/nature/tree_default.glb');
useLoader.preload(GLTFLoader, '/models/nature/stump_roundDetailed.glb');
useLoader.preload(GLTFLoader, '/models/nature/stone_largeA.glb');
useLoader.preload(GLTFLoader, '/models/nature/stone_smallFlatA.glb');
useLoader.preload(GLTFLoader, '/models/nature/plant_bushDetailed.glb');

// ---------------------------------------------------------------------------

function Decorations() {
  const grass = useRef<THREE.InstancedMesh>(null);
  const flowers = useRef<THREE.InstancedMesh>(null);

  const tufts = useMemo(generateGrassTufts, []);
  const blooms = useMemo(generateFlowers, []);
  const flowerColors = useMemo(() => ['#e8c33a', '#d96aa0', '#e9e4d4'].map((c) => new THREE.Color(c)), []);

  // every 14th grass tuft hosts a Kenney bush for mid-size ground cover
  const bushParts = useModelParts('/models/nature/plant_bushDetailed.glb', 0.72);
  const bushMatrices = useMemo(
    () =>
      tufts
        .filter((_, i) => i % 14 === 0)
        .map((t, i) => {
          const m = new THREE.Matrix4();
          const s = 0.8 + t.s * 0.5;
          tmpObj.position.set(t.x, 0, t.z);
          tmpObj.rotation.set(0, t.s * 9 + i, 0);
          tmpObj.scale.setScalar(s);
          tmpObj.updateMatrix();
          return m.copy(tmpObj.matrix);
        }),
    [tufts, bushParts]
  );

  useEffect(() => {
    if (grass.current) {
      tufts.forEach((t, i) => {
        tmpObj.position.set(t.x, 0.12 * t.s, t.z);
        tmpObj.rotation.set(0, t.s * 9, 0);
        tmpObj.scale.set(t.s, t.s, t.s);
        tmpObj.updateMatrix();
        grass.current!.setMatrixAt(i, tmpObj.matrix);
        tmpColor.setHSL(0.3, 0.5, 0.3 + (t.s - 0.5) * 0.12);
        grass.current!.setColorAt(i, tmpColor);
      });
      grass.current.count = tufts.length;
      grass.current.instanceMatrix.needsUpdate = true;
      if (grass.current.instanceColor) grass.current.instanceColor.needsUpdate = true;
    }
    if (flowers.current) {
      blooms.forEach((f, i) => {
        tmpObj.position.set(f.x, 0.12, f.z);
        tmpObj.rotation.set(0, f.c * 2, 0);
        tmpObj.scale.setScalar(1);
        tmpObj.updateMatrix();
        flowers.current!.setMatrixAt(i, tmpObj.matrix);
        flowers.current!.setColorAt(i, flowerColors[f.c]);
      });
      flowers.current.count = blooms.length;
      flowers.current.instanceMatrix.needsUpdate = true;
      if (flowers.current.instanceColor) flowers.current.instanceColor.needsUpdate = true;
    }
  }, [tufts, blooms, flowerColors]);

  return (
    <group>
      <instancedMesh ref={grass} args={[undefined, undefined, 450]} frustumCulled={false}>
        <coneGeometry args={[0.16, 0.35, 4]} />
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={flowers} args={[undefined, undefined, 150]} frustumCulled={false}>
        <sphereGeometry args={[0.09, 6, 5]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} />
      </instancedMesh>
      <InstancedParts parts={bushParts} matrices={bushMatrices} castShadow />
    </group>
  );
}

function Lamps() {
  const lamps = useMemo(generateLamps, []);
  const bulbMat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    const t = useGame.getState().timeOfDay;
    const night = t < 0.27 || t > 0.73;
    if (bulbMat.current) {
      const target = night ? 2.2 : 0.05;
      bulbMat.current.emissiveIntensity += (target - bulbMat.current.emissiveIntensity) * 0.04;
    }
  });
  return (
    <group>
      {lamps.map((l, i) => (
        <group key={i} position={[l.x, 0, l.z]}>
          <mesh position={[0, 1.1, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.09, 2.2, 6]} />
            <meshStandardMaterial color="#2e2a26" roughness={0.7} metalness={0.4} />
          </mesh>
          <mesh position={[0, 2.3, 0]}>
            <sphereGeometry args={[0.18, 8, 6]} />
            {i === 0 ? (
              <meshStandardMaterial
                ref={bulbMat}
                color="#ffe9b0"
                emissive="#ffc14d"
                emissiveIntensity={0.05}
              />
            ) : (
              <SharedBulbMaterial matRef={bulbMat} />
            )}
          </mesh>
        </group>
      ))}
    </group>
  );
}

// all bulbs share the first bulb's material instance for synced glow
function SharedBulbMaterial({ matRef }: { matRef: React.RefObject<THREE.MeshStandardMaterial | null> }) {
  const [mat, setMat] = React.useState<THREE.MeshStandardMaterial | null>(null);
  useEffect(() => {
    const id = setInterval(() => {
      if (matRef.current) {
        setMat(matRef.current);
        clearInterval(id);
      }
    }, 100);
    return () => clearInterval(id);
  }, [matRef]);
  return mat ? <primitive object={mat} attach="material" /> : (
    <meshStandardMaterial color="#ffe9b0" emissive="#ffc14d" emissiveIntensity={0.05} />
  );
}

// ---------------------------------------------------------------------------

function MoveMarker() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const s = useGame.getState();
    if (!ref.current) return;
    if (s.moveTarget) {
      ref.current.visible = true;
      ref.current.position.set(s.moveTarget.x, 0.07, s.moveTarget.z);
      const k = 0.8 + Math.sin(state.clock.elapsedTime * 6) * 0.15;
      ref.current.scale.setScalar(k);
    } else {
      ref.current.visible = false;
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.3, 0.45, 24]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
    </mesh>
  );
}

function InteractHighlight() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const s = useGame.getState();
    if (!ref.current) return;
    const t = s.interactTarget;
    if (t && s.phase === 'playing') {
      ref.current.visible = true;
      ref.current.position.set(t.x, 0.08, t.z);
      const k = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      const base = t.kind === 'building' || t.kind === 'plot' ? 2 : 1.1;
      ref.current.scale.setScalar(base * k);
    } else {
      ref.current.visible = false;
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.85, 1, 32]} />
      <meshBasicMaterial color="#ffd54f" transparent opacity={0.85} />
    </mesh>
  );
}
