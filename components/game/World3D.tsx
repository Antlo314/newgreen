'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
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
// Resource nodes — instanced trees, rocks, clay mounds (+ depleted variants)
// ---------------------------------------------------------------------------

function ResourceNodes() {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const foliage = useRef<THREE.InstancedMesh>(null);
  const foliageTop = useRef<THREE.InstancedMesh>(null);
  const stumps = useRef<THREE.InstancedMesh>(null);
  const rocks = useRef<THREE.InstancedMesh>(null);
  const rubble = useRef<THREE.InstancedMesh>(null);
  const clayMounds = useRef<THREE.InstancedMesh>(null);
  const clayDug = useRef<THREE.InstancedMesh>(null);

  const nodesVersion = useGame((s) => s.nodesVersion);
  const MAXI = 200;

  // geometries translated so each model's base sits at y=0 of its instance
  const trunkGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.22, 0.3, 1.6, 6);
    g.translate(0, 0.8, 0);
    return g;
  }, []);
  const foliageGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(1.35, 2.2, 7);
    g.translate(0, 2.2, 0);
    return g;
  }, []);
  const foliageTopGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(0.85, 1.6, 7);
    g.translate(0, 3.3, 0);
    return g;
  }, []);
  const stumpGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.26, 0.32, 0.4, 6);
    g.translate(0, 0.2, 0);
    return g;
  }, []);

  useEffect(() => {
    const nodes = useGame.getState().nodes;
    const refs = [trunks, foliage, foliageTop, stumps, rocks, rubble, clayMounds, clayDug];
    if (refs.some((r) => !r.current)) return;

    let iTree = 0, iStump = 0, iRock = 0, iRubble = 0, iClay = 0, iDug = 0;

    for (const n of nodes) {
      const alive = n.hp > 0;
      const scaleK = 0.85 + n.seed * 0.4;
      const rot = n.seed * Math.PI * 2;
      if (n.type === 'wood') {
        if (alive) {
          const hpK = 0.7 + (n.hp / n.maxHp) * 0.3;
          tmpObj.position.set(n.x, 0, n.z);
          tmpObj.rotation.set(0, rot, 0);
          tmpObj.scale.setScalar(scaleK * hpK);
          tmpObj.updateMatrix();
          trunks.current!.setMatrixAt(iTree, tmpObj.matrix);
          foliage.current!.setMatrixAt(iTree, tmpObj.matrix);
          foliageTop.current!.setMatrixAt(iTree, tmpObj.matrix);
          tmpColor.setHSL(0.33 + n.seed * 0.06, 0.45 + n.seed * 0.15, 0.28 + n.seed * 0.08);
          foliage.current!.setColorAt(iTree, tmpColor);
          foliageTop.current!.setColorAt(iTree, tmpColor.offsetHSL(0, 0, 0.05));
          iTree++;
        } else {
          tmpObj.position.set(n.x, 0, n.z);
          tmpObj.rotation.set(0, rot, 0);
          tmpObj.scale.setScalar(scaleK);
          tmpObj.updateMatrix();
          stumps.current!.setMatrixAt(iStump++, tmpObj.matrix);
        }
      } else if (n.type === 'stone') {
        tmpObj.position.set(n.x, alive ? 0.45 * scaleK : 0.12, n.z);
        tmpObj.rotation.set(n.seed, rot, n.seed * 0.5);
        tmpObj.scale.setScalar(alive ? scaleK * (0.7 + (n.hp / n.maxHp) * 0.3) : scaleK * 0.45);
        tmpObj.updateMatrix();
        if (alive) rocks.current!.setMatrixAt(iRock++, tmpObj.matrix);
        else rubble.current!.setMatrixAt(iRubble++, tmpObj.matrix);
      } else {
        tmpObj.position.set(n.x, alive ? 0.1 : 0.02, n.z);
        tmpObj.rotation.set(0, rot, 0);
        tmpObj.scale.set(scaleK, alive ? scaleK * 0.5 : 0.15, scaleK);
        tmpObj.updateMatrix();
        if (alive) clayMounds.current!.setMatrixAt(iClay++, tmpObj.matrix);
        else clayDug.current!.setMatrixAt(iDug++, tmpObj.matrix);
      }
    }

    trunks.current!.count = iTree;
    foliage.current!.count = iTree;
    foliageTop.current!.count = iTree;
    stumps.current!.count = iStump;
    rocks.current!.count = iRock;
    rubble.current!.count = iRubble;
    clayMounds.current!.count = iClay;
    clayDug.current!.count = iDug;

    for (const r of refs) {
      r.current!.instanceMatrix.needsUpdate = true;
      if (r.current!.instanceColor) r.current!.instanceColor.needsUpdate = true;
    }
  }, [nodesVersion]);

  return (
    <group>
      {/* tree trunks */}
      <instancedMesh ref={trunks} args={[undefined, undefined, MAXI]} geometry={trunkGeo} castShadow frustumCulled={false}>
        <meshStandardMaterial color="#6b4226" roughness={0.95} />
      </instancedMesh>
      {/* foliage cones */}
      <instancedMesh ref={foliage} args={[undefined, undefined, MAXI]} geometry={foliageGeo} castShadow frustumCulled={false}>
        <meshStandardMaterial roughness={0.9} color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={foliageTop} args={[undefined, undefined, MAXI]} geometry={foliageTopGeo} castShadow frustumCulled={false}>
        <meshStandardMaterial roughness={0.9} color="#ffffff" />
      </instancedMesh>
      {/* stumps */}
      <instancedMesh ref={stumps} args={[undefined, undefined, MAXI]} geometry={stumpGeo} castShadow frustumCulled={false}>
        <meshStandardMaterial color="#7d5a3a" roughness={1} />
      </instancedMesh>
      {/* rocks */}
      <instancedMesh ref={rocks} args={[undefined, undefined, MAXI]} castShadow frustumCulled={false}>
        <dodecahedronGeometry args={[0.75, 0]} />
        <meshStandardMaterial color="#8d8d94" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={rubble} args={[undefined, undefined, MAXI]} frustumCulled={false}>
        <dodecahedronGeometry args={[0.75, 0]} />
        <meshStandardMaterial color="#6f6f76" roughness={1} />
      </instancedMesh>
      {/* clay mounds */}
      <instancedMesh ref={clayMounds} args={[undefined, undefined, MAXI]} castShadow frustumCulled={false}>
        <sphereGeometry args={[0.8, 10, 7]} />
        <meshStandardMaterial color="#b35c3a" roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={clayDug} args={[undefined, undefined, MAXI]} frustumCulled={false}>
        <sphereGeometry args={[0.8, 8, 6]} />
        <meshStandardMaterial color="#7e4128" roughness={1} />
      </instancedMesh>
    </group>
  );
}

// ---------------------------------------------------------------------------

function Decorations() {
  const grass = useRef<THREE.InstancedMesh>(null);
  const flowers = useRef<THREE.InstancedMesh>(null);

  const tufts = useMemo(generateGrassTufts, []);
  const blooms = useMemo(generateFlowers, []);
  const flowerColors = useMemo(() => ['#e8c33a', '#d96aa0', '#e9e4d4'].map((c) => new THREE.Color(c)), []);

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
