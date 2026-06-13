'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import SkinnedCharacter from './SkinnedCharacter';
import { WalkRef } from './Humanoid';
import { useGame } from '../../src/game/store';
import { LENDER_POS } from '../../src/game/data';
import { DEFAULT_APPEARANCE } from '../../src/game/customization';
import type { PlayerAppearance } from '../../src/game/types';

// Distinctive looks so each stranger reads at a glance.
const LENDER_LOOK: PlayerAppearance = {
  ...DEFAULT_APPEARANCE,
  model: 'suit_m',
  skin: '#4d2e1e',
  shirt: '#6e2b2b',
  pants: '#23262e',
  hair: 'classic',
  hat: 'bowler',
  hatColor: '#1c1a18',
  accessory: 'glasses',
};

const MERCHANT_LOOK: PlayerAppearance = {
  ...DEFAULT_APPEARANCE,
  model: 'casual_m',
  skin: '#8a5736',
  shirt: '#b8862b',
  pants: '#4a3526',
  hair: 'fade',
  hat: 'cap',
  hatColor: '#c9622f',
  accessory: 'none',
};

const SPECULATOR_LOOK: PlayerAppearance = {
  ...DEFAULT_APPEARANCE,
  model: 'suit_m',
  skin: '#9c6b3f',
  shirt: '#5d3a8e',
  pants: '#33302c',
  hair: 'classic',
  hat: 'tophat',
  hatColor: '#1c1a18',
  accessory: 'glasses',
};

export default function Encounters() {
  const merchant = useGame((s) => s.merchant);
  const speculatorOffer = useGame((s) => s.speculatorOffer);

  return (
    <group>
      <LoanShark />
      {merchant && <Merchant x={merchant.x} z={merchant.z} />}
      {speculatorOffer && <Speculator x={speculatorOffer.x} z={speculatorOffer.z} />}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Static GLB prop — loaded once, cloned, normalized to a target height, grounded.
// ---------------------------------------------------------------------------

function Prop({
  url,
  targetSize,
  fit = 'height',
  position = [0, 0, 0],
  rotation = 0,
}: {
  url: string;
  targetSize: number;
  fit?: 'height' | 'width';
  position?: [number, number, number];
  rotation?: number;
}) {
  const { scene } = useLoader(GLTFLoader, url);
  const obj = useMemo(() => {
    const c = scene.clone(true);
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    const size = new THREE.Vector3();
    box.getSize(size);
    const measure = fit === 'height' ? size.y : Math.max(size.x, size.z);
    const k = targetSize / Math.max(0.0001, measure);
    c.scale.setScalar(k);
    const grounded = new THREE.Box3().setFromObject(c);
    c.position.y = -grounded.min.y;
    c.traverse((o: THREE.Object3D) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.castShadow = true;
    });
    return c;
  }, [scene, targetSize, fit]);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <primitive object={obj} />
    </group>
  );
}

// Floating diamond marker above an actor's head.
function Marker({ color, y = 2.3 }: { color: string; y?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = y + Math.sin(t * 3) * 0.1;
    ref.current.rotation.y = t * 1.6;
  });
  return (
    <mesh ref={ref} position={[0, y, 0]}>
      <octahedronGeometry args={[0.18, 0]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

// A stranger character that turns to face the player when they come near.
function Actor({
  appearance,
  baseRotation = 0,
}: {
  appearance: PlayerAppearance;
  baseRotation?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const walkRef = useRef<WalkRef>({ speed: 0 });
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const parent = g.parent;
    if (!parent) return;
    const s = useGame.getState();
    const dx = s.px - parent.position.x;
    const dz = s.pz - parent.position.z;
    if (dx * dx + dz * dz < 36) {
      const target = Math.atan2(dx, dz);
      let diff = target - g.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      g.rotation.y += diff * 0.06;
    } else {
      g.rotation.y += (baseRotation - g.rotation.y) * 0.04;
    }
  });
  return (
    <group ref={group} rotation={[0, baseRotation, 0]}>
      <SkinnedCharacter appearance={appearance} walkRef={walkRef} />
    </group>
  );
}

// ---------------------------------------------------------------------------

function LoanShark() {
  return (
    <group position={[LENDER_POS.x, 0, LENDER_POS.z]}>
      <Actor appearance={LENDER_LOOK} baseRotation={-Math.PI * 0.7} />
      <Prop url="/models/nature/sign.glb" targetSize={1.5} position={[1.1, 0, 0.4]} rotation={-0.5} />
      <Marker color="#f0b429" />
    </group>
  );
}

function Merchant({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Prop url="/models/nature/tent_detailedOpen.glb" targetSize={2.4} position={[0, 0, -0.9]} rotation={Math.PI} />
      <Prop url="/models/nature/pot_large.glb" targetSize={0.7} position={[-0.9, 0, 0.3]} />
      <Prop url="/models/nature/log_stack.glb" targetSize={0.7} fit="width" position={[0.95, 0, 0.4]} rotation={0.4} />
      <Actor appearance={MERCHANT_LOOK} baseRotation={0.3} />
      <Marker color="#6ee7b7" y={2.5} />
    </group>
  );
}

function Speculator({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Actor appearance={SPECULATOR_LOOK} baseRotation={Math.PI} />
      <Marker color="#c084fc" y={2.5} />
    </group>
  );
}

useLoader.preload(GLTFLoader, '/models/nature/tent_detailedOpen.glb');
useLoader.preload(GLTFLoader, '/models/nature/sign.glb');
useLoader.preload(GLTFLoader, '/models/nature/pot_large.glb');
useLoader.preload(GLTFLoader, '/models/nature/log_stack.glb');
