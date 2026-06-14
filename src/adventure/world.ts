// Emberwilds — deterministic world generation.
// Builds the overworld (meadow / woods / shore / glade) and the Deepglow cavern,
// scatters foliage, and places all quest content. Seeded so chest/shard/enemy
// placement is stable across reloads (the save references entity ids).

import { GameMap, Entity, SHARD_NAMES } from './types';
import { T, TILE, SOLID_TILES, PropName } from './sprites';
import { Appearance } from './appearance';

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// center a sprite-based entity on a tile, feet at tile bottom
const tc = (tx: number) => tx * TILE + TILE / 2;
const tb = (ty: number) => ty * TILE + TILE;

function npcAppearance(over: Partial<Appearance>): Appearance {
  return {
    skin: 5,
    hair: 2,
    hairColor: 0,
    brow: 0,
    top: 0,
    bottom: 0,
    shoes: 0,
    eyes: 0,
    accessory: 0,
    accessoryColor: 0,
    ...over,
  };
}

interface Builder {
  W: number;
  H: number;
  g: number[][]; // [y][x]
  blocked: Set<number>; // tiles reserved from foliage scatter
  ents: Entity[];
}

function key(x: number, y: number) {
  return y * 10000 + x;
}

function reserve(b: Builder, tx: number, ty: number, rad = 1) {
  for (let y = ty - rad; y <= ty + rad; y++)
    for (let x = tx - rad; x <= tx + rad; x++)
      if (x >= 0 && y >= 0 && x < b.W && y < b.H) b.blocked.add(key(x, y));
}

function carvePath(b: Builder, pts: [number, number][], width = 1) {
  for (let i = 0; i < pts.length - 1; i++) {
    let [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const dx = Math.sign(x1 - x0);
    const dy = Math.sign(y1 - y0);
    while (x0 !== x1 || y0 !== y1) {
      stamp(b, x0, y0, width);
      if (x0 !== x1) x0 += dx;
      else if (y0 !== y1) y0 += dy;
    }
    stamp(b, x1, y1, width);
  }
}
function stamp(b: Builder, x: number, y: number, w: number) {
  for (let oy = 0; oy < w; oy++)
    for (let ox = 0; ox < w; ox++) {
      const px = x + ox;
      const py = y + oy;
      if (px >= 0 && py >= 0 && px < b.W && py < b.H) {
        if (b.g[py][px] !== T.WATER && b.g[py][px] !== T.WATERDEEP) b.g[py][px] = T.PATH;
        b.blocked.add(key(px, py));
      }
    }
}

function disc(b: Builder, cx: number, cy: number, r: number, tile: number) {
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++) {
      if (x < 0 || y < 0 || x >= b.W || y >= b.H) continue;
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) b.g[y][x] = tile;
    }
}

function flatten(g: number[][], W: number, H: number): Uint8Array {
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out[y * W + x] = g[y][x];
  return out;
}

let _idc = 0;
const uid = (p: string) => `${p}${_idc++}`;

// ---------------------------------------------------------------------------
// OVERWORLD
// ---------------------------------------------------------------------------
function buildOverworld(): GameMap {
  const W = 76;
  const H = 58;
  const r = rng(1337);
  const g: number[][] = Array.from({ length: H }, () => new Array(W).fill(T.GRASS));
  const b: Builder = { W, H, g, blocked: new Set(), ents: [] };

  // regions ---------------------------------------------------------------
  // woods: left third + top strip -> darker grass
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (x < 22 || y < 8) g[y][x] = T.GRASS2;
    }
  // shore: bottom-right -> sand
  for (let y = 36; y < H; y++)
    for (let x = 46; x < W; x++) {
      const d = (x - 46) + (y - 36);
      if (d > 6) g[y][x] = T.SAND;
    }

  // a lake centered east, with a river snaking south to the shore
  disc(b, 52, 22, 7, T.WATER);
  disc(b, 52, 22, 4, T.WATERDEEP);
  // river
  let rx = 52;
  for (let y = 28; y < 50; y++) {
    rx += Math.round((r() - 0.5) * 1.4);
    for (let x = rx - 1; x <= rx + 1; x++) if (x >= 0 && x < W) g[y][x] = T.WATER;
    g[y][Math.max(0, rx - 2)] = T.SAND;
  }
  // sea at the very bottom-right beyond the shore
  for (let y = 50; y < H; y++)
    for (let x = 56; x < W; x++) {
      if ((x - 56) + (y - 50) > 2) g[y][x] = T.WATER;
      if ((x - 56) + (y - 50) > 6) g[y][x] = T.WATERDEEP;
    }

  // shore islet (holds the Tidewatch Shard) — ringed by water, one bridge
  for (let y = 47; y <= 52; y++)
    for (let x = 60; x <= 66; x++) g[y][x] = T.SAND;
  // moat around islet
  for (let y = 45; y <= 54; y++)
    for (let x = 58; x <= 68; x++) {
      const onIsle = x >= 60 && x <= 66 && y >= 47 && y <= 52;
      const ring = x >= 59 && x <= 67 && y >= 46 && y <= 53;
      if (ring && !onIsle) g[y][x] = T.WATER;
    }
  // bridge to islet (north side), with a gate at its mouth
  g[46][63] = T.BRIDGE;
  g[45][63] = T.BRIDGE;

  // glade clearing at center with the Lantern Tree
  const LX = 36;
  const LY = 27;
  disc(b, LX, LY, 5, T.GRASS);
  disc(b, LX, LY, 3, T.EMBER);

  // paths connecting glade -> each region ---------------------------------
  carvePath(b, [
    [LX, LY + 3],
    [LX, 40],
    [30, 48],
    [18, 50],
  ]); // to meadow / woods south
  carvePath(b, [
    [LX - 3, LY],
    [16, 22],
    [10, 16],
  ]); // to deep woods (hermit + woods shard)
  carvePath(b, [
    [LX + 3, LY - 1],
    [44, 18],
    [40, 6],
  ]); // to cave (north-east)
  carvePath(b, [
    [LX + 2, LY + 3],
    [48, 38],
    [56, 44],
    [63, 47],
  ]); // to shore / islet bridge

  // fixed entities --------------------------------------------------------
  const E = b.ents;
  const place = (e: Entity, clr = 1) => {
    reserve(b, Math.floor(e.x / TILE), Math.floor((e.y - 1) / TILE), clr);
    E.push(e);
  };

  // Lantern Tree (goal)
  place(
    { id: 'lantern', kind: 'lantern', x: tc(LX), y: tb(LY) + 6, sprite: 'lanternDark', solid: true, r: 12 },
    3,
  );

  // NPCs
  place({
    id: 'npc_keeper',
    kind: 'npc',
    x: tc(LX - 4),
    y: tb(LY + 1),
    name: 'Keeper Adaeze',
    facing: 3,
    appearance: npcAppearance({ skin: 6, hair: 4, hairColor: 8, top: 9, bottom: 1, accessory: 0, eyes: 2 }),
    dialog: [
      'Keeper Adaeze: You came. The Lantern Tree has gone dark, traveler.',
      'For an age its light kept the Hollow back. Now gloomlings wander the wilds.',
      'Four Ember Shards were scattered to the meadow, the woods, the shore, and the deep cavern.',
      'Bring them home and we will rekindle the light together. Walk safe.',
    ],
  });

  place({
    id: 'npc_mara',
    kind: 'npc',
    x: tc(28),
    y: tb(46),
    name: 'Mara',
    facing: 0,
    appearance: npcAppearance({ skin: 3, hair: 3, hairColor: 2, top: 2, bottom: 4, accessory: 6, eyes: 0 }),
    dialog: [
      'Mara: Careful in the meadow! The Sunpetal Shard glows out among the flowers,',
      'but squishy gloomlings bounce around it. Swing your blade — they pop!',
    ],
  });

  place({
    id: 'npc_bramble',
    kind: 'npc',
    x: tc(11),
    y: tb(18),
    name: 'Old Bramble',
    facing: 3,
    appearance: npcAppearance({ skin: 7, hair: 1, hairColor: 7, brow: 3, top: 5, bottom: 2, accessory: 8, accessoryColor: 4, eyes: 6 }),
    dialog: [
      'Old Bramble: Hmph. The Hollowwood Shard sits in yon clearing, ringed by gloom.',
      'And the Deepglow Shard? Down the cavern, north-east. A Warden squats over it.',
      'Big, slow, mean. Strike, step back, strike again. You did not hear it from me.',
    ],
  });

  place({
    id: 'npc_finn',
    kind: 'npc',
    x: tc(57),
    y: tb(45),
    name: 'Finn the Fisher',
    facing: 2,
    appearance: npcAppearance({ skin: 4, hair: 10, hairColor: 3, brow: 1, top: 6, bottom: 0, accessory: 1, eyes: 4 }),
    dialog: [
      'Finn: The Tidewatch Shard rests on the islet, past the old tide-gate.',
      "It's locked tight. A rusty key went missing in the woods — folks say it's in a chest out west.",
      'Find the key, open the gate, cross the bridge. Mind the gloom in the cavern, friend.',
    ],
  });

  // Signs
  place({ id: 'sign_glade', kind: 'sign', x: tc(LX + 4), y: tb(LY + 2), sprite: 'sign', solid: true, r: 6, text: 'THE GLADE\n← woods · meadow ↓ · shore → · cavern ↑' });
  place({ id: 'sign_cave', kind: 'sign', x: tc(41), y: tb(8), sprite: 'sign', solid: true, r: 6, text: 'DEEPGLOW CAVERN ahead.\nBring a brave heart.' });

  // The four shards
  place({ id: 'shard0', kind: 'shard', x: tc(20), y: tb(50), sprite: 'shard', shardId: 0, name: SHARD_NAMES[0] }); // meadow south
  place({ id: 'shard1', kind: 'shard', x: tc(8), y: tb(12), sprite: 'shard', shardId: 1, name: SHARD_NAMES[1] }); // deep woods clearing
  place({ id: 'shard2', kind: 'shard', x: tc(63), y: tb(50), sprite: 'shard', shardId: 2, name: SHARD_NAMES[2] }); // islet
  // shard3 lives in the cave map

  // tide-gate guarding the islet bridge
  place({ id: 'gate_tide', kind: 'gate', x: tc(63), y: tb(46), sprite: 'gate', solid: true, r: 9, locked: true, gateId: 'tide' }, 0);

  // key chest in the woods
  place({ id: 'chest_key', kind: 'chest', x: tc(6), y: tb(26), sprite: 'chest', solid: true, r: 8, contents: { key: 1 } });
  // a couple of ember chests for flavor
  place({ id: 'chest_e1', kind: 'chest', x: tc(45), y: tb(50), sprite: 'chest', solid: true, r: 8, contents: { ember: 15 } });
  place({ id: 'chest_e2', kind: 'chest', x: tc(18), y: tb(6), sprite: 'chest', solid: true, r: 8, contents: { ember: 12, heart: 1 } });

  // cave entrance portal (north-east)
  place(
    {
      id: 'cave_mouth',
      kind: 'portal',
      x: tc(40),
      y: tb(5),
      sprite: 'cave',
      solid: false,
      r: 10,
      toMap: 'cave',
      toX: tc(20),
      toY: tb(28),
    },
    2,
  );

  // enemies guarding the shards / roaming
  const slime = (x: number, y: number): Entity => ({
    id: uid('en'),
    kind: 'enemy',
    enemy: 'slime',
    x,
    y,
    r: 6,
    hp: 3,
    maxHp: 3,
    speed: 26,
    touch: 1,
    reward: 3,
    aggroR: 120,
    homeX: x,
    homeY: y,
  });
  // meadow guards (around shard0)
  E.push(slime(tc(18), tb(49)), slime(tc(23), tb(51)), slime(tc(21), tb(53)));
  // woods clearing guards (around shard1)
  E.push(slime(tc(7), tb(14)), slime(tc(11), tb(11)), slime(tc(6), tb(10)), slime(tc(10), tb(15)));
  // a few roamers
  E.push(slime(tc(33), tb(40)), slime(tc(50), tb(33)), slime(tc(58), tb(40)));

  // foliage scatter -------------------------------------------------------
  scatterFoliage(b, r);

  return {
    id: 'overworld',
    name: 'The Emberwilds',
    w: W,
    h: H,
    ground: flatten(g, W, H),
    entities: E,
    mood: 'explore',
    dark: false,
    spawn: { x: tc(LX), y: tb(LY + 5) },
  };
}

function walkableForFoliage(b: Builder, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= b.W || y >= b.H) return false;
  const t = b.g[y][x];
  if (SOLID_TILES.has(t)) return false;
  if (b.blocked.has(key(x, y))) return false;
  return true;
}

function scatterFoliage(b: Builder, r: () => number) {
  const flowers: PropName[] = ['flowerR', 'flowerY', 'flowerB'];
  for (let y = 0; y < b.H; y++) {
    for (let x = 0; x < b.W; x++) {
      if (!walkableForFoliage(b, x, y)) continue;
      const t = b.g[y][x];
      const woods = t === T.GRASS2;
      const sand = t === T.SAND;
      const meadowish = t === T.GRASS && y > 38 && x < 40;
      const roll = r();
      let prop: PropName | null = null;
      let solid = false;
      let bush = false;
      if (woods) {
        if (roll < 0.26) {
          prop = r() < 0.5 ? 'tree' : 'pine';
          solid = true;
        } else if (roll < 0.32) {
          prop = 'bush';
          bush = true;
        } else if (roll < 0.36) {
          prop = r() < 0.5 ? 'rock' : 'grass';
          solid = prop === 'rock';
        } else if (roll < 0.4) prop = 'grass';
      } else if (sand) {
        if (roll < 0.04) {
          prop = 'rockSmall';
          solid = true;
        } else if (roll < 0.09) prop = 'reed';
      } else {
        // open grass / meadow
        if (roll < 0.05) {
          prop = 'tree';
          solid = true;
        } else if (roll < 0.08) {
          prop = 'bush';
          bush = true;
        } else if (roll < (meadowish ? 0.3 : 0.14)) {
          prop = flowers[Math.floor(r() * flowers.length)];
        } else if (roll < (meadowish ? 0.36 : 0.18)) prop = 'grass';
      }
      if (!prop) continue;
      const e: Entity = {
        id: uid('p'),
        kind: bush ? 'bush' : 'prop',
        x: tc(x) + (r() - 0.5) * 6,
        y: tb(y),
        sprite: prop,
        solid,
        r: solid ? 7 : undefined,
        sway: prop === 'tree' || prop === 'pine' || prop === 'grass' || prop === 'bush' || prop.startsWith('flower'),
      };
      if (bush) {
        e.hp = 2;
        e.maxHp = 2;
      }
      b.ents.push(e);
      if (solid) reserve(b, x, y, 0);
    }
  }
}

// ---------------------------------------------------------------------------
// CAVE
// ---------------------------------------------------------------------------
function buildCave(): GameMap {
  const W = 42;
  const H = 34;
  const r = rng(7777);
  const g: number[][] = Array.from({ length: H }, () => new Array(W).fill(T.WALL));
  const b: Builder = { W, H, g, blocked: new Set(), ents: [] };

  const room = (x0: number, y0: number, x1: number, y1: number) => {
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) g[y][x] = r() < 0.12 ? T.STONE2 : T.STONE;
  };
  const corridor = (x0: number, y0: number, x1: number, y1: number) => {
    let x = x0;
    let y = y0;
    while (x !== x1) {
      g[y][x] = T.STONE;
      g[y + 1][x] = T.STONE;
      x += Math.sign(x1 - x);
    }
    while (y !== y1) {
      g[y][x] = T.STONE;
      g[y][x + 1] = T.STONE;
      y += Math.sign(y1 - y);
    }
  };

  room(16, 24, 26, 31); // entrance hall (spawn ~ 20,28)
  room(4, 14, 16, 22); // west chamber
  room(24, 12, 36, 22); // east chamber
  room(14, 3, 30, 11); // back chamber (warden + shard)
  corridor(20, 24, 10, 20);
  corridor(22, 24, 30, 20);
  corridor(10, 14, 22, 7);
  corridor(30, 14, 22, 9);

  const E = b.ents;

  // return portal at the entrance
  E.push({
    id: 'cave_exit',
    kind: 'portal',
    x: tc(20),
    y: tb(31),
    sprite: 'cave',
    r: 12,
    toMap: 'overworld',
    toX: tc(40),
    toY: tb(7),
  });
  E.push({ id: 'sign_deep', kind: 'sign', x: tc(24), y: tb(29), sprite: 'sign', solid: true, r: 6, text: 'DEEPGLOW CAVERN\nThe Warden guards the last shard.' });

  // shard3 in back chamber, the Warden in front of it
  E.push({ id: 'shard3', kind: 'shard', x: tc(22), y: tb(5), sprite: 'shard', shardId: 3, name: SHARD_NAMES[3] });
  E.push({
    id: 'warden',
    kind: 'enemy',
    enemy: 'warden',
    x: tc(22),
    y: tb(8),
    r: 11,
    hp: 12,
    maxHp: 12,
    speed: 20,
    touch: 2,
    reward: 30,
    aggroR: 200,
    homeX: tc(22),
    homeY: tb(8),
  });

  // bats + slimes
  const bat = (tx: number, ty: number): Entity => ({
    id: uid('en'),
    kind: 'enemy',
    enemy: 'bat',
    x: tc(tx),
    y: tb(ty) - 6,
    r: 6,
    hp: 2,
    maxHp: 2,
    speed: 42,
    touch: 1,
    reward: 4,
    aggroR: 150,
    homeX: tc(tx),
    homeY: tb(ty) - 6,
  });
  const slime = (tx: number, ty: number): Entity => ({
    id: uid('en'),
    kind: 'enemy',
    enemy: 'slime',
    x: tc(tx),
    y: tb(ty),
    r: 6,
    hp: 3,
    maxHp: 3,
    speed: 26,
    touch: 1,
    reward: 3,
    aggroR: 120,
    homeX: tc(tx),
    homeY: tb(ty),
  });
  E.push(bat(9, 18), bat(30, 16), bat(26, 8), slime(12, 19), slime(33, 18), slime(20, 10));

  // a treasure chest in the east chamber
  E.push({ id: 'chest_cave', kind: 'chest', x: tc(33), y: tb(15), sprite: 'chest', solid: true, r: 8, contents: { ember: 20, heart: 1 } });

  // decor: crystals + glowing mushrooms on the stone
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (g[y][x] === T.WALL) continue;
      const roll = r();
      if (roll < 0.04) E.push({ id: uid('d'), kind: 'prop', x: tc(x), y: tb(y), sprite: r() < 0.5 ? 'crystal' : 'mushroom' });
      else if (roll < 0.06) E.push({ id: uid('d'), kind: 'prop', x: tc(x), y: tb(y), sprite: 'rockSmall', solid: true, r: 6 });
    }

  return {
    id: 'cave',
    name: 'Deepglow Cavern',
    w: W,
    h: H,
    ground: flatten(g, W, H),
    entities: E,
    mood: 'cave',
    dark: true,
    spawn: { x: tc(20), y: tb(28) },
  };
}

export function generateWorld(): Record<string, GameMap> {
  _idc = 0;
  return {
    overworld: buildOverworld(),
    cave: buildCave(),
  };
}
