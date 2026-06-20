'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal, useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { HeadGear, WalkRef } from './Humanoid';
import { CHARACTER_MODELS, MODEL_BY_ID } from '../../src/game/customization';
import type { PlayerAppearance } from '../../src/game/types';

/**
 * Rigged, animated character (Quaternius Ultimate Modular Men/Women, CC0).
 * Materials are recolored per-instance from the appearance (skin, hair, shirt,
 * trousers); hats/hairstyles/accessories attach to the Head bone so they track
 * every animation.
 */

const TARGET_HEIGHT = 1.78; // match the old primitive humanoid's world height

const HAIR_MATERIALS = ['Hair', 'Hair_Brown', 'Hair_Blond'];
const BROW_MATERIALS = ['Eyebrows', 'Moustache'];

export type CharacterAction = 'auto' | 'interact' | 'talk' | 'wave';

interface SkinnedCharacterProps {
  appearance: PlayerAppearance;
  walkRef?: React.MutableRefObject<WalkRef>;
  /** override the speed-driven animation (e.g. while harvesting) */
  action?: CharacterAction;
  scale?: number;
}

export default function SkinnedCharacter({
  appearance,
  walkRef,
  action = 'auto',
  scale = 1,
}: SkinnedCharacterProps) {
  const def = MODEL_BY_ID[appearance.model] ?? CHARACTER_MODELS[0];
  const gltf = useLoader(GLTFLoader, def.file);
  const [headBone, setHeadBone] = useState<THREE.Object3D | null>(null);

  // per-instance skeleton clone (skinned meshes can't share a scene graph)
  const rig = useMemo(() => {
    const root = cloneSkeleton(gltf.scene);
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const k = TARGET_HEIGHT / Math.max(0.0001, size.y);
    root.scale.setScalar(k);
    root.position.y = -box.min.y * k;
    return { root, k };
  }, [gltf]);

  // recolor cloned materials + hide props we don't use
  useEffect(() => {
    const showModelHair = appearance.hair === 'classic';
    rig.root.traverse((o: THREE.Object3D) => {
      if (o.name === 'Pistol') o.visible = false;
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.frustumCulled = false; // skinned bounds lag the skeleton
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const recolored = mats.map((m) => {
        const sm = (m as THREE.MeshStandardMaterial).clone();
        const name = sm.name;
        if (name === 'Skin') sm.color.set(appearance.skin);
        else if (name === 'Skin_Darker') sm.color.set(appearance.skin).multiplyScalar(0.82);
        else if (HAIR_MATERIALS.includes(name)) {
          if (showModelHair) {
            sm.color.set(appearance.hairColor);
            sm.transparent = false;
            sm.opacity = 1;
            sm.depthWrite = true;
          } else {
            sm.transparent = true;
            sm.opacity = 0;
            sm.depthWrite = false;
          }
        } else if (BROW_MATERIALS.includes(name)) sm.color.set(appearance.hairColor);
        else if (def.slots.shirt.includes(name)) sm.color.set(appearance.shirt);
        else if (def.slots.pants.includes(name)) sm.color.set(appearance.pants);
        else if (def.slots.hat?.includes(name)) sm.color.set(appearance.hatColor);
        return sm;
      });
      mesh.material = Array.isArray(mesh.material) ? recolored : recolored[0];
    });
    setHeadBone(rig.root.getObjectByName('Head') ?? null);
  }, [rig, appearance, def]);

  // ---- animation ----
  const mixer = useMemo(() => new THREE.AnimationMixer(rig.root), [rig]);
  const current = useRef<THREE.AnimationAction | null>(null);

  const actions = useMemo(() => {
    const find = (n: string) => gltf.animations.find((a: THREE.AnimationClip) => a.name === n);
    const make = (n: string) => {
      const clip = find(n);
      return clip ? mixer.clipAction(clip) : null;
    };
    return {
      idle: make('Idle') ?? make('Idle_Neutral'),
      walk: make('Walk'),
      run: make('Run'),
      interact: make('Interact'),
      wave: make('Wave'),
    };
  }, [gltf, mixer]);

  useFrame((_, dt) => {
    const speed = walkRef?.current.speed ?? 0;
    let next: THREE.AnimationAction | null;
    if (action === 'interact') next = actions.interact ?? actions.idle;
    else if (action === 'wave' || action === 'talk') next = actions.wave ?? actions.idle;
    else if (speed > 4.2) next = actions.run ?? actions.walk ?? actions.idle;
    else if (speed > 0.25) next = actions.walk ?? actions.idle;
    else next = actions.idle;

    if (next && next !== current.current) {
      next.reset().fadeIn(0.18).play();
      current.current?.fadeOut(0.18);
      current.current = next;
    }
    mixer.update(dt);
  });

  // dispose mixer bindings when the rig changes
  useEffect(() => () => {
    mixer.stopAllAction();
    mixer.uncacheRoot(rig.root);
  }, [mixer, rig]);

  return (
    <group scale={scale}>
      <primitive object={rig.root} />
      {headBone && (
        // keyed so the portal fully remounts when the rig (and bone) changes —
        // R3F portals don't reparent when only the container prop changes
        <BoneGear key={headBone.uuid} bone={headBone} k={rig.k} appearance={appearance} />
      )}
    </group>
  );
}

// HeadGear was authored in body-root space (primitive head center y≈1.45, head
// 0.34 tall). The GLTF "Head" bone sits at the jaw/neck joint (native y≈1.547)
// while the visible head extends up to the crown (~1.856), centered near 1.70.
// So we counter-translate the authored origin, rescale, and lift it up onto the
// face — 0.14/k lands glasses at eye level and hats/hair on the crown (measured
// against the GLTF rest geometry; a smaller offset leaves features at the chin).
function BoneGear({
  bone,
  k,
  appearance,
}: {
  bone: THREE.Object3D;
  k: number;
  appearance: PlayerAppearance;
}) {
  return createPortal(
    <group scale={0.62 / k} position={[0, 0.14 / k, 0]}>
      <group position={[0, -1.45, 0]}>
        <HeadGear
          hat={appearance.hat}
          hatColor={appearance.hatColor}
          hair={appearance.hair === 'classic' ? 'bald' : appearance.hair}
          hairColor={appearance.hairColor}
          accessory={appearance.accessory}
          facialHair={appearance.facialHair}
        />
      </group>
    </group>,
    bone
  );
}

for (const m of CHARACTER_MODELS) useLoader.preload(GLTFLoader, m.file);
