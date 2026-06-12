'use client';

import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Player from './Player';
import World3D from './World3D';
import Buildings from './Buildings';
import NPCs from './NPCs';
import Effects from './Effects';
import { useGame } from '../../src/game/store';

export default function GameCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 17, 17], fov: 42, near: 1, far: 160 }}
      gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      style={{ touchAction: 'none' }}
    >
      <DayNightLighting />
      <Suspense fallback={null}>
        <World3D />
        <Buildings />
        <NPCs />
        <Player />
        <Effects />
      </Suspense>
    </Canvas>
  );
}

// ---------------------------------------------------------------------------
// Day/night cycle: sun orbit, warm dawn/dusk, cool night, fog + sky tint.
// timeOfDay: 0 = midnight, 0.25 = dawn, 0.5 = noon, 0.75 = dusk
// ---------------------------------------------------------------------------

const SKY_NIGHT = new THREE.Color('#101630');
const SKY_DAWN = new THREE.Color('#e89a5a');
const SKY_DAY = new THREE.Color('#8ec9e8');
const SKY_DUSK = new THREE.Color('#d97a4a');
const tmpSky = new THREE.Color();

const SUN_NIGHT = new THREE.Color('#3a4a7a');
const SUN_DAWN = new THREE.Color('#ffb070');
const SUN_DAY = new THREE.Color('#fff4e0');
const tmpSun = new THREE.Color();

function skyAt(t: number, out: THREE.Color) {
  // piecewise lerp through night->dawn->day->dusk->night
  if (t < 0.2) out.copy(SKY_NIGHT);
  else if (t < 0.3) out.lerpColors(SKY_NIGHT, SKY_DAWN, (t - 0.2) / 0.1);
  else if (t < 0.4) out.lerpColors(SKY_DAWN, SKY_DAY, (t - 0.3) / 0.1);
  else if (t < 0.65) out.copy(SKY_DAY);
  else if (t < 0.75) out.lerpColors(SKY_DAY, SKY_DUSK, (t - 0.65) / 0.1);
  else if (t < 0.85) out.lerpColors(SKY_DUSK, SKY_NIGHT, (t - 0.75) / 0.1);
  else out.copy(SKY_NIGHT);
  return out;
}

function DayNightLighting() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const scene = useThree((s) => s.scene);
  const fogRef = useRef<THREE.Fog | null>(null);

  if (!fogRef.current) {
    fogRef.current = new THREE.Fog('#8ec9e8', 55, 130);
    scene.fog = fogRef.current;
  }

  useFrame(() => {
    const s = useGame.getState();
    const t = s.timeOfDay;
    const dayK = Math.max(0, Math.sin((t - 0.25) * Math.PI * 2)); // 0 at night, 1 at noon

    // sun orbits east->west, follows player so the shadow box stays useful
    const angle = (t - 0.25) * Math.PI * 2;
    const sx = Math.cos(angle) * 40;
    const sy = Math.max(6, Math.sin(angle) * 50);
    if (sun.current) {
      sun.current.position.set(s.px + sx, sy, s.pz + 18);
      sun.current.target.position.set(s.px, 0, s.pz);
      sun.current.target.updateMatrixWorld();
      sun.current.intensity = 0.25 + dayK * 1.9;
      if (t < 0.3 || t > 0.7) tmpSun.lerpColors(SUN_NIGHT, SUN_DAWN, dayK * 2);
      else tmpSun.copy(SUN_DAY);
      sun.current.color.copy(tmpSun);
    }
    if (ambient.current) ambient.current.intensity = 0.25 + dayK * 0.45;
    if (hemi.current) hemi.current.intensity = 0.25 + dayK * 0.5;

    skyAt(t, tmpSky);
    if (scene.background instanceof THREE.Color) scene.background.copy(tmpSky);
    else scene.background = tmpSky.clone();
    if (fogRef.current) fogRef.current.color.copy(tmpSky);
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.6} color="#cfe5ff" />
      <hemisphereLight ref={hemi} args={['#bcd8ff', '#4a5d3a', 0.6]} />
      <directionalLight
        ref={sun}
        position={[30, 45, 20]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-38}
        shadow-camera-right={38}
        shadow-camera-top={38}
        shadow-camera-bottom={-38}
        shadow-camera-near={5}
        shadow-camera-far={140}
        shadow-bias={-0.0004}
      />
    </>
  );
}
