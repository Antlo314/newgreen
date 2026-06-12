'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Humanoid, { WalkRef } from './Humanoid';
import { useGame } from '../../src/game/store';
import { BUILDINGS, NPCS, QUESTS, RESOURCE_LABEL } from '../../src/game/data';

const QUEST_GIVER: Record<string, string> = Object.fromEntries(
  QUESTS.map((q) => [q.id, q.giver])
);
import {
  BRIDGE_HALF_WIDTH,
  BRIDGE_Z,
  RIVER_WIDTH,
  RIVER_X,
  STATIC_COLLIDERS,
  WORLD_HALF,
  isInRiver,
} from '../../src/game/world';
import { audio } from '../../src/game/audio';
import type { InteractTarget } from '../../src/game/types';

const SPEED = 5.2;
const PLAYER_R = 0.45;
const INTERACT_RANGE = 2.6;

export default function Player() {
  const group = useRef<THREE.Group>(null);
  const walkRef = useRef<WalkRef>({ speed: 0 });
  const keys = useRef<Record<string, boolean>>({});
  const camera = useThree((s) => s.camera);
  const camTarget = useRef(new THREE.Vector3());
  const footTimer = useRef(0);
  const initialized = useRef(false);

  // keyboard listeners
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys.current[k] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      const s = useGame.getState();
      if (k === 'e' || k === 'enter' || k === ' ') {
        s.interact();
      } else if (k === 'escape') {
        if (s.dialogue) s.declineDialogue();
        else s.setPanel(null);
      } else if (k === 'q' || k === 'j') {
        s.setPanel(s.panel === 'quests' ? null : 'quests');
      } else if (k === 'i') {
        s.setPanel(s.panel === 'inventory' ? null : 'inventory');
      } else if (k === 'm') {
        s.setPanel(s.panel === 'map' ? null : 'map');
      } else if (k === 'h') {
        s.setPanel(s.panel === 'help' ? null : 'help');
      }
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    const blur = () => {
      keys.current = {};
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  // wheel zoom
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const s = useGame.getState();
      s.setCameraZoom(s.cameraZoom + (e.deltaY > 0 ? 0.08 : -0.08));
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  const tmpDir = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useGame.getState();
    if (s.phase !== 'playing' || !group.current) return;

    // initialize position from store (after load)
    if (!initialized.current) {
      group.current.position.set(s.px, 0, s.pz);
      initialized.current = true;
    }

    // handle teleporting if requested
    if (s.teleportTarget) {
      group.current.position.set(s.teleportTarget.x, 0, s.teleportTarget.z);
      s.completeTeleport();
    }

    // run the global game tick here (single driver)
    s.tick(dt);

    const pos = group.current.position;
    const inputBlocked = s.dialogue !== null || s.panel === 'build' || s.panel === 'help';

    // --- desired velocity ---
    tmpDir.set(0, 0, 0);
    if (!inputBlocked) {
      const k = keys.current;
      if (k['w'] || k['arrowup']) tmpDir.z -= 1;
      if (k['s'] || k['arrowdown']) tmpDir.z += 1;
      if (k['a'] || k['arrowleft']) tmpDir.x -= 1;
      if (k['d'] || k['arrowright']) tmpDir.x += 1;
    }

    let speed = 0;
    if (tmpDir.lengthSq() > 0) {
      // keyboard overrides click-to-move
      if (s.moveTarget) s.setMoveTarget(null);
      tmpDir.normalize();
      speed = SPEED;
    } else if (s.moveTarget && !inputBlocked) {
      const dx = s.moveTarget.x - pos.x;
      const dz = s.moveTarget.z - pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.35) {
        s.setMoveTarget(null);
      } else {
        tmpDir.set(dx / dist, 0, dz / dist);
        speed = SPEED * Math.min(1, dist / 0.8);
      }
    }

    // moving cancels an in-progress harvest
    if (speed > 0.5 && s.harvesting) s.cancelHarvest();

    // --- movement with collision (separate axes for wall sliding) ---
    if (speed > 0) {
      const nx = pos.x + tmpDir.x * speed * dt;
      const nz = pos.z + tmpDir.z * speed * dt;
      if (!collides(nx, pos.z, s, pos.x, pos.z)) pos.x = nx;
      if (!collides(pos.x, nz, s, pos.x, pos.z)) pos.z = nz;

      // facing
      const targetFacing = Math.atan2(tmpDir.x, tmpDir.z);
      group.current.rotation.y = lerpAngle(group.current.rotation.y, targetFacing, 12 * dt);

      // footsteps
      footTimer.current += dt;
      if (footTimer.current > 0.34) {
        footTimer.current = 0;
        audio.sfx('footstep');
      }
    }
    walkRef.current.speed = speed;

    // publish position (throttled by zustand shallow check downstream)
    s.setPlayerPos(pos.x, pos.z, group.current.rotation.y, speed > 0.1);

    // --- interaction target scan ---
    updateInteractTarget(pos.x, pos.z, s);

    // --- camera follow (isometric-ish top-down) ---
    const zoom = s.cameraZoom;
    camTarget.current.set(pos.x, 0, pos.z);
    const camPos = new THREE.Vector3(pos.x, 17 * zoom, pos.z + 11 * zoom);
    camera.position.lerp(camPos, Math.min(1, 5 * dt));
    camera.lookAt(camera.position.x, 0, camera.position.z - 11 * zoom * 0.92);
  });

  const s0 = useGame.getState();
  const ap = useGame((s) => s.appearance);

  return (
    <group ref={group} position={[s0.px, 0, s0.pz]}>
      <Humanoid
        skin={ap.skin}
        shirt={ap.shirt}
        pants={ap.pants}
        hat={ap.hat}
        hatColor={ap.hatColor}
        hair={ap.hair}
        hairColor={ap.hairColor}
        accessory={ap.accessory}
        build={ap.build}
        walkRef={walkRef}
      />
      {/* soft blob shadow helper ring when harvesting */}
      <HarvestRing />
    </group>
  );
}

function HarvestRing() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const s = useGame.getState();
    if (!ref.current) return;
    const active = s.harvesting !== null;
    ref.current.visible = active;
    if (active) {
      const t = state.clock.elapsedTime;
      ref.current.rotation.z = t * 2;
      const k = 1 + Math.sin(t * 8) * 0.06;
      ref.current.scale.setScalar(k);
    }
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} visible={false}>
      <ringGeometry args={[0.7, 0.85, 32]} />
      <meshBasicMaterial color="#ffd54f" transparent opacity={0.7} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------

type GS = ReturnType<typeof useGame.getState>;

/**
 * Circle collider check with depenetration: if the player is already inside
 * (e.g. a tree regrew underfoot), moves that increase distance are allowed so
 * they can always walk out instead of being trapped.
 */
function circleBlocks(x: number, z: number, fx: number, fz: number, cx: number, cz: number, r: number): boolean {
  const dx = x - cx;
  const dz = z - cz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= r * r) return false;
  const fdx = fx - cx;
  const fdz = fz - cz;
  const fd2 = fdx * fdx + fdz * fdz;
  return !(fd2 < r * r && d2 > fd2);
}

function collides(x: number, z: number, s: GS, fx: number, fz: number): boolean {
  // world bounds
  if (Math.abs(x) > WORLD_HALF - 1 || Math.abs(z) > WORLD_HALF - 1) return true;
  // river (bridge passable, slightly wider check for player radius)
  if (
    Math.abs(x - RIVER_X) < RIVER_WIDTH / 2 + PLAYER_R - 0.2 &&
    Math.abs(z - BRIDGE_Z) > BRIDGE_HALF_WIDTH - 0.3
  ) {
    if (isInRiver(x, z) || Math.abs(x - RIVER_X) < RIVER_WIDTH / 2) return true;
  }
  // static colliders
  for (const c of STATIC_COLLIDERS) {
    if (circleBlocks(x, z, fx, fz, c.x, c.z, c.r + PLAYER_R)) return true;
  }
  // resource nodes (only standing ones)
  for (const n of s.nodes) {
    if (n.hp <= 0) continue;
    const r = n.type === 'wood' ? 0.55 : 0.8;
    if (circleBlocks(x, z, fx, fz, n.x, n.z, r + PLAYER_R)) return true;
  }
  // buildings
  for (const p of s.plots) {
    if (!p.building) continue;
    const half = BUILDINGS[p.building].footprint / 2 + PLAYER_R - 0.15;
    if (Math.abs(x - p.x) < half && Math.abs(z - p.z) < half) {
      // allow escape if already overlapping (e.g. built around the player)
      const inside = Math.abs(fx - p.x) < half && Math.abs(fz - p.z) < half;
      const deeper =
        Math.min(half - Math.abs(x - p.x), half - Math.abs(z - p.z)) >=
        Math.min(half - Math.abs(fx - p.x), half - Math.abs(fz - p.z));
      if (!inside || deeper) return true;
    }
  }
  // npcs
  for (const npc of NPCS) {
    if (circleBlocks(x, z, fx, fz, npc.x, npc.z, 0.5 + PLAYER_R)) return true;
  }
  return false;
}

function updateInteractTarget(x: number, z: number, s: GS) {
  let best: InteractTarget | null = null;
  let bestD = INTERACT_RANGE * INTERACT_RANGE;

  // npcs
  for (const npc of NPCS) {
    const d = (x - npc.x) ** 2 + (z - npc.z) ** 2;
    if (d < bestD + 1.2) {
      const hasQuest =
        Object.entries(s.quests).some(
          ([id, q]) =>
            (q.status === 'available' || q.status === 'ready') &&
            QUEST_GIVER[id] === npc.id
        );
      best = {
        kind: 'npc',
        id: npc.id,
        label: npc.name + (hasQuest ? ' — has business with you' : ''),
        verb: 'Talk',
        x: npc.x,
        z: npc.z,
      };
      bestD = d;
    }
  }
  // nodes
  for (const n of s.nodes) {
    if (n.hp <= 0) continue;
    const d = (x - n.x) ** 2 + (z - n.z) ** 2;
    if (d < bestD) {
      const verb = n.type === 'wood' ? 'Chop' : n.type === 'stone' ? 'Mine' : 'Dig';
      best = { kind: 'node', id: n.id, label: RESOURCE_LABEL[n.type], verb, x: n.x, z: n.z };
      bestD = d;
    }
  }
  // plots / buildings
  const plotsUnlocked = s.quests['first_foundations']?.status === 'done';
  for (const p of s.plots) {
    const d = (x - p.x) ** 2 + (z - p.z) ** 2;
    const range = p.building ? (BUILDINGS[p.building].footprint / 2 + 1.6) ** 2 : bestD;
    if (p.building) {
      if (d < Math.min(bestD, range) && p.construction === 0) {
        best = {
          kind: 'building',
          id: p.id,
          label: `${BUILDINGS[p.building].name} (Lv ${p.level})`,
          verb: 'Manage',
          x: p.x,
          z: p.z,
        };
        bestD = d;
      }
    } else if (plotsUnlocked && d < bestD) {
      best = { kind: 'plot', id: p.id, label: 'Open Plot', verb: 'Build', x: p.x, z: p.z };
      bestD = d;
    }
  }

  s.setInteractTarget(best);
}

function lerpAngle(a: number, b: number, t: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * Math.min(1, t);
}
