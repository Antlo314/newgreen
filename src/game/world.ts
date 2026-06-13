import type { Plot, ResourceNode } from './types';

// ---------------------------------------------------------------------------
// World layout (units = meters). Origin (0,0) is the plaza center.
// North = -Z. The river runs north-south at x ~ +22, with a bridge at z ~ 2.
// Forest: north-west region. Quarry: east of the river. Clay: southern riverbank.
// ---------------------------------------------------------------------------

export const WORLD_HALF = 46; // playable area is [-46, 46] in x/z
export const RIVER_X = 23;
export const RIVER_WIDTH = 5;
export const BRIDGE_Z = 2;
export const BRIDGE_HALF_WIDTH = 2.6;

// Mulberry32 — deterministic PRNG so the world is identical every session.
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function isInRiver(x: number, z: number): boolean {
  if (Math.abs(x - RIVER_X) > RIVER_WIDTH / 2) return false;
  // bridge crossing
  if (Math.abs(z - BRIDGE_Z) < BRIDGE_HALF_WIDTH) return false;
  return true;
}

function nearPlaza(x: number, z: number, r = 12) {
  return Math.abs(x) < r && Math.abs(z) < r;
}

export function generateResourceNodes(): ResourceNode[] {
  const rng = mulberry32(20260612);
  const nodes: ResourceNode[] = [];
  let id = 0;

  const tryPlace = (
    type: ResourceNode['type'],
    x: number,
    z: number,
    maxHp: number
  ) => {
    if (Math.abs(x) > WORLD_HALF - 2 || Math.abs(z) > WORLD_HALF - 2) return;
    if (isInRiver(x, z) || Math.abs(x - RIVER_X) < 4 && type !== 'clay') return;
    if (nearPlaza(x, z)) return;
    // keep nodes from stacking
    for (const n of nodes) {
      const dx = n.x - x;
      const dz = n.z - z;
      if (dx * dx + dz * dz < 6) return;
    }
    nodes.push({ id: `n${id++}`, type, x, z, hp: maxHp, maxHp, regrow: 0, seed: rng() });
  };

  // Forest: clusters in the north and north-west
  for (let i = 0; i < 90; i++) {
    const cx = -38 + rng() * 56; // x in [-38, 18]
    const cz = -44 + rng() * 26; // z in [-44, -18]
    tryPlace('wood', cx, cz, 3);
  }
  // Scattered trees west
  for (let i = 0; i < 30; i++) {
    tryPlace('wood', -44 + rng() * 18, -16 + rng() * 40, 3);
  }
  // Quarry: east of the river
  for (let i = 0; i < 45; i++) {
    tryPlace('stone', 28 + rng() * 16, -30 + rng() * 55, 4);
  }
  // Clay: southern riverbank, west side
  for (let i = 0; i < 25; i++) {
    tryPlace('clay', 10 + rng() * 9, 12 + rng() * 30, 3);
  }

  return nodes;
}

// ---------------------------------------------------------------------------
// Free-placement build grid. The player places buildings anywhere on a grid
// surrounding the plaza, snapped to GRID-sized cells.
// ---------------------------------------------------------------------------

export const GRID = 4; // cell size in meters
export const BUILD_AREA_HALF = 40; // buildable region is [-40, 40] in x/z
export const PLAZA_KEEP = 7.5; // keep the plaza/monument clear of buildings

// Founder huts ring — small homes the founders retire into off-hours. Kept
// permanently clear of player building so a hut never ends up inside a shop.
// These mirror each NPCDef.home in data.ts (source of truth for the geometry).
export const HUT_SPOTS: { x: number; z: number }[] = [
  { x: -16, z: -12 }, // O.W. Gurley
  { x: 16, z: -12 }, // Sarah Rector
  { x: -16, z: 12 }, // J.B. Stradford
  { x: -8, z: 18 }, // Pharoah Gerumba
];
const HUT_KEEP = 3.4; // radius around each hut the player can't build in

/** Snap a world coordinate to the center of its grid cell. */
export function snapToGrid(v: number): number {
  return Math.round(v / GRID) * GRID;
}

/** Can a building be placed on the grid cell at (x, z)? x/z are already snapped. */
export function canBuildAt(
  x: number,
  z: number,
  nodes: ResourceNode[],
  plots: Plot[],
  excludeId?: string
): boolean {
  // inside the buildable area
  if (Math.abs(x) > BUILD_AREA_HALF || Math.abs(z) > BUILD_AREA_HALF) return false;
  // keep the central plaza & monument clear
  if (x * x + z * z < PLAZA_KEEP * PLAZA_KEEP) return false;
  // keep the founders' huts clear
  for (const h of HUT_SPOTS) {
    const dx = h.x - x;
    const dz = h.z - z;
    if (dx * dx + dz * dz < HUT_KEEP * HUT_KEEP) return false;
  }
  // not in (or right beside) the river — this is what stops building in water
  if (Math.abs(x - RIVER_X) < RIVER_WIDTH / 2 + 2) return false;
  // not on a standing resource node
  for (const n of nodes) {
    if (n.hp <= 0) continue;
    const dx = n.x - x;
    const dz = n.z - z;
    if (dx * dx + dz * dz < 2.6 * 2.6) return false;
  }
  // not on an occupied cell
  for (const p of plots) {
    if (!p.building || p.id === excludeId) continue;
    if (Math.abs(p.x - x) < GRID - 0.5 && Math.abs(p.z - z) < GRID - 0.5) return false;
  }
  return true;
}

// The live game now starts with no plots and lets the player place buildings
// freely on the grid.
export function generatePlots(): Plot[] {
  return [];
}

// Decorative elements (lampposts, plaza tiles handled in renderer)
export function generateLamps(): { x: number; z: number }[] {
  return [
    [-6, -5], [6, -5], [-6, 5], [6, 5],
    [-12, 0], [12, 0], [0, -12], [0, 12],
    [-18, 8], [18, 8], [-18, -8], [18, -8],
  ].map(([x, z]) => ({ x, z }));
}

// Static collision circles (monument, well, etc.)
export const STATIC_COLLIDERS: { x: number; z: number; r: number }[] = [
  { x: 0, z: 0, r: 1.6 }, // plaza monument
];

export function generateGrassTufts(): { x: number; z: number; s: number }[] {
  const rng = mulberry32(777);
  const tufts: { x: number; z: number; s: number }[] = [];
  for (let i = 0; i < 400; i++) {
    const x = -WORLD_HALF + rng() * WORLD_HALF * 2;
    const z = -WORLD_HALF + rng() * WORLD_HALF * 2;
    if (isInRiver(x, z) || nearPlaza(x, z, 10)) continue;
    tufts.push({ x, z, s: 0.5 + rng() * 0.8 });
  }
  return tufts;
}

export function generateFlowers(): { x: number; z: number; c: number }[] {
  const rng = mulberry32(4242);
  const flowers: { x: number; z: number; c: number }[] = [];
  for (let i = 0; i < 120; i++) {
    const x = -WORLD_HALF + rng() * WORLD_HALF * 2;
    const z = -WORLD_HALF + rng() * WORLD_HALF * 2;
    if (isInRiver(x, z) || nearPlaza(x, z, 11)) continue;
    flowers.push({ x, z, c: Math.floor(rng() * 3) });
  }
  return flowers;
}
