'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

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

  return (
    <group scale={scale}>
      <group ref={body}>
        {/* torso */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[0.5, 0.55, 0.3]} />
          <meshStandardMaterial color={shirt} roughness={0.8} />
        </mesh>
        {/* head */}
        <mesh position={[0, 1.45, 0]} castShadow>
          <boxGeometry args={[0.34, 0.34, 0.32]} />
          <meshStandardMaterial color={skin} roughness={0.7} />
        </mesh>
        {/* hats */}
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
        {/* arms (pivot at shoulder) */}
        <mesh ref={lArm} position={[-0.32, 1.18, 0]} castShadow>
          <boxGeometry args={[0.12, 0.5, 0.14]} />
          <meshStandardMaterial color={shirt} roughness={0.8} />
        </mesh>
        <mesh ref={rArm} position={[0.32, 1.18, 0]} castShadow>
          <boxGeometry args={[0.12, 0.5, 0.14]} />
          <meshStandardMaterial color={shirt} roughness={0.8} />
        </mesh>
      </group>
      {/* legs (pivot at hip) */}
      <mesh ref={lLeg} position={[-0.13, 0.66, 0]} castShadow>
        <boxGeometry args={[0.16, 0.62, 0.18]} />
        <meshStandardMaterial color={pants} roughness={0.85} />
      </mesh>
      <mesh ref={rLeg} position={[0.13, 0.66, 0]} castShadow>
        <boxGeometry args={[0.16, 0.62, 0.18]} />
        <meshStandardMaterial color={pants} roughness={0.85} />
      </mesh>
    </group>
  );
}
