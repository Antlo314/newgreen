'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AccessoryStyle, BodyBuild, HairStyle } from '../../src/game/types';

export interface WalkRef {
  /** current movement speed in m/s — drives limb swing */
  speed: number;
}

interface HumanoidProps {
  skin: string;
  shirt: string;
  pants: string;
  hat?: 'tophat' | 'bowler' | 'headwrap' | 'crown' | 'cap' | 'none';
  hatColor?: string;
  hair?: HairStyle;
  hairColor?: string;
  accessory?: AccessoryStyle;
  build?: BodyBuild;
  walkRef?: React.MutableRefObject<WalkRef>;
  scale?: number;
}

// Stylized low-poly villager built from primitives. ~14 meshes, cheap to render.
export default function Humanoid({
  skin,
  shirt,
  pants,
  hat = 'none',
  hatColor = '#222222',
  hair = 'fade',
  hairColor = '#15100c',
  accessory = 'none',
  build = 'broad',
  walkRef,
  scale = 1,
}: HumanoidProps) {
  const lArm = useRef<THREE.Mesh>(null);
  const rArm = useRef<THREE.Mesh>(null);
  const lLeg = useRef<THREE.Mesh>(null);
  const rLeg = useRef<THREE.Mesh>(null);
  const body = useRef<THREE.Group>(null);
  const phase = useRef(Math.random() * 10);

  useFrame((_, dt) => {
    const speed = walkRef?.current.speed ?? 0;
    const target = Math.min(1, speed / 4);
    phase.current += dt * (4 + speed * 2.2);
    const swing = Math.sin(phase.current) * 0.7 * target;
    if (lArm.current) lArm.current.rotation.x = swing;
    if (rArm.current) rArm.current.rotation.x = -swing;
    if (lLeg.current) lLeg.current.rotation.x = -swing;
    if (rLeg.current) rLeg.current.rotation.x = swing;
    if (body.current) {
      body.current.position.y = Math.abs(Math.sin(phase.current)) * 0.05 * target;
      // idle breathing
      if (target < 0.05) {
        body.current.position.y = Math.sin(phase.current * 0.4) * 0.012;
      }
    }
  });

  const slim = build === 'slender';
  const torsoW = slim ? 0.42 : 0.5;
  const armX = slim ? 0.28 : 0.32;
  const armW = slim ? 0.1 : 0.12;
  const legX = slim ? 0.11 : 0.13;
  const legW = slim ? 0.14 : 0.16;

  return (
    <group scale={scale}>
      <group ref={body}>
        {/* torso */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[torsoW, 0.55, 0.3]} />
          <meshStandardMaterial color={shirt} roughness={0.8} />
        </mesh>
        {/* head */}
        <mesh position={[0, 1.45, 0]} castShadow>
          <boxGeometry args={[0.34, 0.34, 0.32]} />
          <meshStandardMaterial color={skin} roughness={0.7} />
        </mesh>
        <HeadGear hat={hat} hatColor={hatColor} hair={hair} hairColor={hairColor} accessory={accessory} />
        {/* arms (pivot at shoulder) */}
        <mesh ref={lArm} position={[-armX, 1.18, 0]} castShadow>
          <boxGeometry args={[armW, 0.5, 0.14]} />
          <meshStandardMaterial color={shirt} roughness={0.8} />
        </mesh>
        <mesh ref={rArm} position={[armX, 1.18, 0]} castShadow>
          <boxGeometry args={[armW, 0.5, 0.14]} />
          <meshStandardMaterial color={shirt} roughness={0.8} />
        </mesh>
      </group>
      {/* legs (pivot at hip) */}
      <mesh ref={lLeg} position={[-legX, 0.66, 0]} castShadow>
        <boxGeometry args={[legW, 0.62, 0.18]} />
        <meshStandardMaterial color={pants} roughness={0.85} />
      </mesh>
      <mesh ref={rLeg} position={[legX, 0.66, 0]} castShadow>
        <boxGeometry args={[legW, 0.62, 0.18]} />
        <meshStandardMaterial color={pants} roughness={0.85} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// HeadGear — hats, natural hairstyles, and accessories in body-root space
// (head center at y≈1.45). Reused by SkinnedCharacter via a head-bone portal.
// ---------------------------------------------------------------------------

export function HeadGear({
  hat,
  hatColor,
  hair,
  hairColor,
  accessory,
}: {
  hat: string;
  hatColor: string;
  hair: HairStyle;
  hairColor: string;
  accessory: AccessoryStyle;
}) {
  return (
    <group>
      <Hair style={hair} color={hairColor} hat={hat} />
      <Accessory style={accessory} />
      {hat === 'tophat' && (
        <group position={[0, 1.68, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.24, 0.24, 0.04, 12]} />
            <meshStandardMaterial color={hatColor} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 0.3, 12]} />
            <meshStandardMaterial color={hatColor} roughness={0.6} />
          </mesh>
        </group>
      )}
      {hat === 'bowler' && (
        <group position={[0, 1.66, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.23, 0.23, 0.03, 12]} />
            <meshStandardMaterial color={hatColor} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.07, 0]} castShadow>
            <sphereGeometry args={[0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={hatColor} roughness={0.6} />
          </mesh>
        </group>
      )}
      {hat === 'headwrap' && (
        <mesh position={[0, 1.64, 0]} castShadow>
          <sphereGeometry args={[0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={hatColor} roughness={0.8} />
        </mesh>
      )}
      {hat === 'crown' && (
        <mesh position={[0, 1.66, 0]} castShadow>
          <cylinderGeometry args={[0.19, 0.15, 0.14, 8]} />
          <meshStandardMaterial color="#d4af37" metalness={0.7} roughness={0.3} />
        </mesh>
      )}
      {hat === 'cap' && (
        <group position={[0, 1.63, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={hatColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0, 0.17]} castShadow>
            <boxGeometry args={[0.22, 0.03, 0.14]} />
            <meshStandardMaterial color={hatColor} roughness={0.7} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Natural hairstyles built from primitives. Tall styles compress to a low base
// under a hat so brims never clip; locs and braids keep their hanging strands.
// ---------------------------------------------------------------------------

const LOC_ANGLES = [-2.4, -1.7, -1.0, 1.0, 1.7, 2.4];

function Hair({ style, color, hat }: { style: HairStyle; color: string; hat: string }) {
  if (style === 'bald') return null;
  if (style === 'classic') style = 'fade'; // primitive bodies have no built-in hair
  const covered = hat !== 'none';
  const strands = style === 'locs' || style === 'braids';

  return (
    <group>
      {/* crown volume — hidden under headwraps, flattened under other hats */}
      {hat !== 'headwrap' && (
        <>
          {(covered || style === 'fade') && (
            <mesh position={[0, 1.615, -0.005]} castShadow>
              <boxGeometry args={[0.36, 0.09, 0.33]} />
              <meshStandardMaterial color={color} roughness={0.95} />
            </mesh>
          )}
          {!covered && style === 'waves' && (
            <mesh position={[0, 1.63, -0.005]} castShadow>
              <boxGeometry args={[0.355, 0.055, 0.325]} />
              <meshStandardMaterial color={color} roughness={0.9} metalness={0.08} />
            </mesh>
          )}
          {!covered && style === 'afro' && (
            <mesh position={[0, 1.7, 0]} castShadow>
              <sphereGeometry args={[0.27, 14, 12]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
          )}
          {!covered && style === 'puffs' && (
            <>
              <mesh position={[0, 1.62, -0.005]} castShadow>
                <boxGeometry args={[0.36, 0.08, 0.33]} />
                <meshStandardMaterial color={color} roughness={0.95} />
              </mesh>
              <mesh position={[-0.15, 1.74, 0]} castShadow>
                <sphereGeometry args={[0.13, 10, 8]} />
                <meshStandardMaterial color={color} roughness={1} />
              </mesh>
              <mesh position={[0.15, 1.74, 0]} castShadow>
                <sphereGeometry args={[0.13, 10, 8]} />
                <meshStandardMaterial color={color} roughness={1} />
              </mesh>
            </>
          )}
          {!covered && style === 'locs' && (
            <mesh position={[0, 1.63, -0.005]} castShadow>
              <boxGeometry args={[0.38, 0.1, 0.35]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
          )}
          {!covered && style === 'braids' && (
            <group position={[0, 1.625, -0.005]}>
              {[-0.12, 0, 0.12].map((x) => (
                <mesh key={x} position={[x, 0, 0]} castShadow>
                  <boxGeometry args={[0.08, 0.09, 0.34]} />
                  <meshStandardMaterial color={color} roughness={1} />
                </mesh>
              ))}
            </group>
          )}
        </>
      )}
      {/* hanging strands frame the face even under hats and wraps */}
      {strands &&
        LOC_ANGLES.map((a) => (
          <mesh
            key={a}
            position={[Math.sin(a) * 0.185, 1.41, Math.cos(a) * -0.17]}
            castShadow
          >
            <boxGeometry args={style === 'locs' ? [0.055, 0.34, 0.055] : [0.045, 0.3, 0.045]} />
            <meshStandardMaterial color={color} roughness={1} />
          </mesh>
        ))}
    </group>
  );
}

function Accessory({ style }: { style: AccessoryStyle }) {
  if (style === 'none') return null;
  if (style === 'glasses') {
    return (
      <group position={[0, 1.47, 0.17]}>
        <mesh position={[-0.08, 0, 0]}>
          <torusGeometry args={[0.05, 0.011, 6, 14]} />
          <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0.08, 0, 0]}>
          <torusGeometry args={[0.05, 0.011, 6, 14]} />
          <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.06, 0.014, 0.014]} />
          <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.35} />
        </mesh>
      </group>
    );
  }
  if (style === 'earrings') {
    return (
      <group>
        <mesh position={[-0.185, 1.36, 0]}>
          <sphereGeometry args={[0.028, 8, 6]} />
          <meshStandardMaterial color="#e8c64a" metalness={0.75} roughness={0.25} />
        </mesh>
        <mesh position={[0.185, 1.36, 0]}>
          <sphereGeometry args={[0.028, 8, 6]} />
          <meshStandardMaterial color="#e8c64a" metalness={0.75} roughness={0.25} />
        </mesh>
      </group>
    );
  }
  // bowtie
  return (
    <group position={[0, 1.245, 0.16]}>
      <mesh>
        <boxGeometry args={[0.05, 0.045, 0.035]} />
        <meshStandardMaterial color="#6e2b2b" roughness={0.7} />
      </mesh>
      <mesh position={[-0.06, 0, 0]} rotation={[0, 0, 0.18]}>
        <boxGeometry args={[0.08, 0.06, 0.03]} />
        <meshStandardMaterial color="#8a3535" roughness={0.7} />
      </mesh>
      <mesh position={[0.06, 0, 0]} rotation={[0, 0, -0.18]}>
        <boxGeometry args={[0.08, 0.06, 0.03]} />
        <meshStandardMaterial color="#8a3535" roughness={0.7} />
      </mesh>
    </group>
  );
}
