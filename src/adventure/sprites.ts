// Emberwilds — 100% procedural pixel art.
// Nothing here loads an external image. Characters, tiles, props and enemies are
// all drawn with fillRect onto offscreen canvases once, then blitted by the
// engine. That keeps character customization truly unlimited (any palette combo)
// and the whole game self-contained / CC0-clean.

import {
  Appearance,
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  BROWS,
  TOP_COLORS,
  BOTTOM_COLORS,
  SHOE_COLORS,
  EYE_COLORS,
  ACCESSORIES,
  ACCESSORY_COLORS,
} from './appearance';

// ---------------------------------------------------------------------------
// color helpers
// ---------------------------------------------------------------------------
export function shade(hex: string, f: number): string {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = cl(((n >> 16) & 255) * f);
  const g = cl(((n >> 8) & 255) * f);
  const b = cl((n & 255) * f);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w: number, h: number): { c: HTMLCanvasElement; x: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d')!;
  x.imageSmoothingEnabled = false;
  return { c, x };
}

const px = (x: CanvasRenderingContext2D, a: number, b: number, w: number, h: number, c: string) => {
  x.fillStyle = c;
  x.fillRect(a, b, w, h);
};

// ===========================================================================
// CHARACTER
// ===========================================================================
export const FW = 16; // frame width
export const FH = 24; // frame height
const COLS = 3; // direction columns: 0 down, 1 up, 2 side(right)
const ROWS = 4; // walk frames

export interface ActorSheet {
  canvas: HTMLCanvasElement;
  fw: number;
  fh: number;
}

interface Pal {
  skin: string;
  skinSh: string;
  skinHi: string;
  hair: string;
  hairSh: string;
  hairHi: string;
  top: string;
  topSh: string;
  topHi: string;
  pants: string;
  pantsSh: string;
  shoe: string;
  eye: string;
  acc: string;
  accSh: string;
}

function palFor(a: Appearance): Pal {
  const skin = SKIN_TONES[a.skin].hex;
  const hair = HAIR_COLORS[a.hairColor].hex;
  const top = TOP_COLORS[a.top].hex;
  const pants = BOTTOM_COLORS[a.bottom].hex;
  const acc = ACCESSORY_COLORS[a.accessoryColor].hex;
  return {
    skin,
    skinSh: shade(skin, 0.82),
    skinHi: shade(skin, 1.12),
    hair,
    hairSh: shade(hair, 0.72),
    hairHi: shade(hair, 1.25),
    top,
    topSh: shade(top, 0.78),
    topHi: shade(top, 1.18),
    pants,
    pantsSh: shade(pants, 0.78),
    shoe: SHOE_COLORS[a.shoes].hex,
    eye: EYE_COLORS[a.eyes].hex,
    acc,
    accSh: shade(acc, 0.78),
  };
}

/** dir: 0 down, 1 up, 2 left, 3 right -> source cell + horizontal flip. */
export function actorSrc(dir: number, frame: number): { sx: number; sy: number; flip: boolean } {
  const col = dir === 0 ? 0 : dir === 1 ? 1 : 2;
  return { sx: col * FW, sy: frame * FH, flip: dir === 2 };
}

export function buildActorSheet(a: Appearance): ActorSheet {
  const { c, x } = makeCanvas(FW * COLS, FH * ROWS);
  const pal = palFor(a);
  for (let dir = 0; dir < COLS; dir++) {
    for (let f = 0; f < ROWS; f++) {
      x.save();
      x.translate(dir * FW, f * FH);
      drawActor(x, a, pal, dir, f);
      x.restore();
    }
  }
  return { canvas: c, fw: FW, fh: FH };
}

function drawActor(x: CanvasRenderingContext2D, a: Appearance, p: Pal, dir: number, frame: number) {
  const bob = frame === 1 || frame === 3 ? -1 : 0;
  // soft shadow
  px(x, 4, 22, 8, 1, 'rgba(0,0,0,0.20)');
  px(x, 5, 23, 6, 1, 'rgba(0,0,0,0.14)');
  drawLegs(x, p, dir, frame);
  drawBody(x, p, dir, frame, bob);
  drawArms(x, p, dir, frame, bob);
  drawHead(x, p, dir, bob);
  drawFace(x, p, a, dir, bob);
  drawBrow(x, p, a, dir, bob);
  drawHair(x, p, a, dir, bob);
  drawAccessory(x, p, a, dir, bob);
}

function drawLegs(x: CanvasRenderingContext2D, p: Pal, dir: number, frame: number) {
  const top = 17;
  if (dir === 2) {
    let frontX = 7;
    let backX = 5;
    if (frame === 1) {
      frontX = 8;
      backX = 4;
    } else if (frame === 3) {
      frontX = 6;
      backX = 6;
    }
    px(x, backX, top, 3, 5, p.pantsSh);
    px(x, backX, top + 3, 3, 2, shade(p.shoe, 0.8));
    px(x, frontX, top, 3, 5, p.pants);
    px(x, frontX, top + 3, 3, 2, p.shoe);
    return;
  }
  let lLen = 5;
  let rLen = 5;
  if (frame === 1) {
    lLen = 6;
    rLen = 4;
  } else if (frame === 3) {
    lLen = 4;
    rLen = 6;
  }
  px(x, 5, top, 3, lLen, p.pants);
  px(x, 5, top, 1, lLen, p.pantsSh);
  px(x, 5, top + lLen - 2, 3, 2, p.shoe);
  px(x, 8, top, 3, rLen, p.pants);
  px(x, 8, top, 1, rLen, p.pantsSh);
  px(x, 8, top + rLen - 2, 3, 2, p.shoe);
}

function drawBody(x: CanvasRenderingContext2D, p: Pal, dir: number, frame: number, dy: number) {
  const top = 11 + dy;
  if (dir === 2) {
    px(x, 5, top, 6, 6, p.top);
    px(x, 5, top, 1, 6, p.topSh);
    px(x, 9, top + 1, 1, 4, p.topHi);
    px(x, 5, top + 5, 6, 1, p.topSh);
    return;
  }
  px(x, 4, top, 8, 6, p.top);
  px(x, 4, top, 1, 6, p.topSh);
  px(x, 11, top, 1, 6, p.topSh);
  px(x, 5, top + 1, 2, 1, p.topHi);
  px(x, 4, top + 5, 8, 1, p.topSh);
  if (dir === 0) px(x, 6, top, 4, 1, p.skinSh); // collar gap
}

function drawArms(x: CanvasRenderingContext2D, p: Pal, dir: number, frame: number, dy: number) {
  const top = 11 + dy;
  const swing = frame === 1 ? 1 : frame === 3 ? -1 : 0;
  if (dir === 2) {
    const ay = top + 1 + (swing > 0 ? 1 : swing < 0 ? -1 : 0);
    px(x, 9, ay, 2, 4, p.top);
    px(x, 9, ay + 4, 2, 2, p.skin);
    return;
  }
  const lY = top + 1 + swing;
  const rY = top + 1 - swing;
  px(x, 2, lY, 2, 4, p.top);
  px(x, 2, lY + 4, 2, 2, p.skin);
  px(x, 12, rY, 2, 4, p.top);
  px(x, 12, rY + 4, 2, 2, p.skin);
}

function drawHead(x: CanvasRenderingContext2D, p: Pal, dir: number, dy: number) {
  const top = 3 + dy;
  if (dir === 2) {
    px(x, 5, top, 6, 7, p.skin);
    px(x, 5, top, 6, 1, p.skinHi);
    px(x, 5, top + 6, 6, 1, p.skinSh);
    px(x, 11, top + 3, 1, 2, p.skin); // nose
    px(x, 6, top + 7, 3, 1, p.skinSh); // neck
    return;
  }
  px(x, 4, top, 8, 7, p.skin);
  px(x, 4, top, 1, 7, p.skinSh);
  px(x, 11, top, 1, 7, p.skinSh);
  px(x, 4, top, 8, 1, p.skinHi);
  px(x, 6, top + 7, 4, 1, p.skinSh); // neck
}

function drawFace(x: CanvasRenderingContext2D, p: Pal, _a: Appearance, dir: number, dy: number) {
  const top = 3 + dy;
  if (dir === 1) return; // back of head
  if (dir === 2) {
    px(x, 9, top + 4, 1, 2, '#241812');
    px(x, 9, top + 4, 1, 1, p.eye);
    px(x, 9, top + 6, 1, 1, p.skinSh); // hint of mouth
    return;
  }
  // down
  px(x, 6, top + 4, 1, 2, '#241812');
  px(x, 9, top + 4, 1, 2, '#241812');
  px(x, 6, top + 4, 1, 1, p.eye);
  px(x, 9, top + 4, 1, 1, p.eye);
  px(x, 7, top + 6, 2, 1, shade(p.skin, 0.68)); // mouth
}

function drawBrow(x: CanvasRenderingContext2D, p: Pal, a: Appearance, dir: number, dy: number) {
  const id = BROWS[a.brow].id;
  if (id === 'plain') return;
  if (dir === 1) return;
  const top = 3 + dy;
  const h = p.hairSh;
  if (dir === 2) {
    if (id === 'stubble' || id === 'full') px(x, 6, top + 6, 5, 1, h);
    if (id === 'goatee') px(x, 8, top + 6, 2, 2, h);
    if (id === 'full') px(x, 10, top + 4, 1, 3, h);
    if (id === 'mustache') px(x, 8, top + 5, 2, 1, h);
    return;
  }
  if (id === 'stubble') {
    px(x, 5, top + 6, 6, 1, h);
  } else if (id === 'goatee') {
    px(x, 7, top + 6, 2, 2, h);
  } else if (id === 'full') {
    px(x, 4, top + 5, 1, 2, h);
    px(x, 11, top + 5, 1, 2, h);
    px(x, 5, top + 6, 6, 2, h);
  } else if (id === 'mustache') {
    px(x, 6, top + 5, 4, 1, h);
  }
}

function drawHair(x: CanvasRenderingContext2D, p: Pal, a: Appearance, dir: number, dy: number) {
  const id = HAIR_STYLES[a.hair].id;
  if (id === 'bald') return;
  const top = 3 + dy;
  const H = p.hair;
  const HS = p.hairSh;
  const HH = p.hairHi;

  // common scalp cap helper
  const cap = () => {
    if (dir === 2) {
      px(x, 5, top - 1, 6, 3, H);
      px(x, 5, top, 1, 4, H);
      px(x, 5, top - 1, 6, 1, HH);
    } else {
      px(x, 4, top - 1, 8, 3, H);
      px(x, 4, top, 1, 4, H);
      px(x, 11, top, 1, 4, H);
      px(x, 4, top - 1, 8, 1, HH);
    }
  };
  // full back-of-head coverage (used heavily for the 'up' direction)
  const back = () => {
    if (dir === 1) {
      px(x, 4, top - 1, 8, 8, H);
      px(x, 4, top - 1, 8, 1, HH);
      px(x, 4, top - 1, 1, 8, HS);
      px(x, 11, top - 1, 1, 8, HS);
    }
  };

  switch (id) {
    case 'short':
      cap();
      back();
      break;
    case 'afro': {
      back();
      if (dir === 2) {
        px(x, 4, top - 3, 8, 4, H);
        px(x, 3, top - 1, 9, 4, H);
        px(x, 4, top - 3, 8, 1, HH);
      } else {
        px(x, 5, top - 4, 6, 1, H);
        px(x, 4, top - 3, 8, 2, H);
        px(x, 3, top - 1, 10, 3, H);
        px(x, 3, top, 2, 5, H);
        px(x, 11, top, 2, 5, H);
        px(x, 5, top - 4, 6, 1, HH);
        px(x, 3, top + 1, 1, 3, HS);
        px(x, 12, top + 1, 1, 3, HS);
      }
      break;
    }
    case 'curls': {
      cap();
      back();
      // bumpy crown
      for (let i = 0; i < 4; i++) px(x, 4 + i * 2, top - 2, 1, 1, HH);
      if (dir !== 2) {
        px(x, 3, top + 1, 1, 3, H);
        px(x, 12, top + 1, 1, 3, H);
      }
      break;
    }
    case 'puffs': {
      back();
      cap();
      if (dir === 2) {
        px(x, 4, top - 2, 4, 3, H);
        px(x, 4, top - 2, 1, 1, HH);
      } else {
        // two side puffs
        px(x, 2, top - 2, 3, 3, H);
        px(x, 11, top - 2, 3, 3, H);
        px(x, 2, top - 2, 1, 1, HH);
        px(x, 13, top - 2, 1, 1, HH);
      }
      break;
    }
    case 'locs': {
      cap();
      back();
      // hanging strands at the sides
      const ys = top + 4;
      if (dir === 2) {
        px(x, 4, ys, 1, 6, H);
        px(x, 5, ys + 2, 1, 5, HS);
      } else {
        px(x, 3, ys, 1, 7, H);
        px(x, 4, ys, 1, 6, HS);
        px(x, 11, ys, 1, 6, HS);
        px(x, 12, ys, 1, 7, H);
        if (dir === 1) {
          for (let i = 0; i < 4; i++) px(x, 4 + i * 2, top + 6, 1, 4, i % 2 ? HS : H);
        }
      }
      break;
    }
    case 'braids': {
      cap();
      back();
      // cornrow lines on the crown
      if (dir !== 2) {
        for (let i = 0; i < 4; i++) px(x, 5 + i * 2, top - 1, 1, 3, HS);
      } else {
        for (let i = 0; i < 3; i++) px(x, 6 + i, top - 1, 1, 3, HS);
      }
      break;
    }
    case 'ponytail': {
      cap();
      back();
      if (dir === 1) {
        px(x, 7, top + 4, 2, 7, H); // tail down the back
        px(x, 7, top + 4, 1, 7, HS);
      } else if (dir === 2) {
        px(x, 3, top, 2, 4, H); // tail behind
        px(x, 3, top, 1, 4, HS);
      } else {
        px(x, 3, top, 1, 3, H);
        px(x, 12, top, 1, 3, H);
      }
      break;
    }
    case 'bun': {
      cap();
      back();
      px(x, 6, top - 3, 4, 3, H); // top knot
      px(x, 6, top - 3, 4, 1, HH);
      px(x, 7, top - 2, 1, 1, HS);
      break;
    }
    case 'mohawk': {
      back();
      if (dir === 2) {
        px(x, 6, top - 4, 3, 5, H);
        px(x, 6, top - 4, 3, 1, HH);
      } else {
        px(x, 7, top - 4, 2, 6, H);
        px(x, 7, top - 4, 2, 1, HH);
        // faded sides
        px(x, 5, top, 1, 2, HS);
        px(x, 10, top, 1, 2, HS);
      }
      break;
    }
    case 'long': {
      cap();
      back();
      if (dir === 1) {
        px(x, 4, top + 2, 8, 9, H);
        px(x, 4, top + 2, 1, 9, HS);
        px(x, 11, top + 2, 1, 9, HS);
      } else if (dir === 2) {
        px(x, 4, top + 1, 2, 9, H);
        px(x, 4, top + 1, 1, 9, HS);
      } else {
        px(x, 3, top + 1, 2, 9, H);
        px(x, 11, top + 1, 2, 9, H);
        px(x, 3, top + 1, 1, 9, HS);
        px(x, 12, top + 1, 1, 9, HS);
      }
      break;
    }
    case 'flattop': {
      back();
      if (dir === 2) {
        px(x, 5, top - 4, 6, 5, H);
        px(x, 5, top - 4, 6, 1, HH);
      } else {
        px(x, 4, top - 4, 8, 5, H);
        px(x, 4, top - 4, 8, 1, HH);
        px(x, 4, top - 4, 1, 5, HS);
        px(x, 11, top - 4, 1, 5, HS);
      }
      break;
    }
    default:
      cap();
      back();
  }
}

function drawAccessory(x: CanvasRenderingContext2D, p: Pal, a: Appearance, dir: number, dy: number) {
  const id = ACCESSORIES[a.accessory].id;
  if (id === 'none') return;
  const top = 3 + dy;
  const A = p.acc;
  const AS = p.accSh;
  switch (id) {
    case 'straw': {
      px(x, 2, top, 12, 2, A); // brim
      px(x, 2, top + 1, 12, 1, AS);
      px(x, 5, top - 3, 6, 3, A); // crown
      px(x, 5, top - 3, 6, 1, shade(A, 1.15));
      px(x, 5, top - 1, 6, 1, AS);
      break;
    }
    case 'cap': {
      px(x, 4, top - 2, 8, 3, A);
      px(x, 4, top - 2, 8, 1, shade(A, 1.15));
      if (dir === 0) px(x, 8, top + 1, 5, 1, AS); // brim front
      else if (dir === 2) px(x, 10, top + 1, 4, 1, AS);
      else px(x, 4, top - 1, 8, 1, AS);
      break;
    }
    case 'beanie': {
      px(x, 4, top - 2, 8, 4, A);
      px(x, 4, top + 1, 8, 1, AS); // fold
      px(x, 4, top - 2, 8, 1, shade(A, 1.15));
      break;
    }
    case 'headband': {
      px(x, 4, top + 1, 8, 1, A);
      if (dir !== 1) px(x, 6, top + 1, 1, 1, shade(A, 1.2));
      break;
    }
    case 'bandana': {
      px(x, 4, top - 1, 8, 3, A);
      px(x, 4, top + 1, 8, 1, AS);
      if (dir === 1) {
        px(x, 6, top + 2, 4, 2, A); // knot at back
      }
      break;
    }
    case 'glasses': {
      if (dir === 1) break;
      if (dir === 2) {
        px(x, 9, top + 4, 2, 2, '#20242c');
        px(x, 9, top + 4, 2, 1, '#9fd0ff');
      } else {
        px(x, 5, top + 4, 2, 2, '#20242c');
        px(x, 9, top + 4, 2, 2, '#20242c');
        px(x, 7, top + 4, 2, 1, '#20242c');
        px(x, 5, top + 4, 2, 1, '#9fd0ff');
        px(x, 9, top + 4, 2, 1, '#9fd0ff');
      }
      break;
    }
    case 'flowercrown': {
      px(x, 4, top - 1, 8, 1, '#3a7a3a');
      const cols = ['#e7607f', '#f2c94c', '#7aa6e0', '#e89b4a'];
      if (dir !== 1) {
        px(x, 4, top - 2, 1, 1, cols[0]);
        px(x, 7, top - 2, 1, 1, cols[1]);
        px(x, 10, top - 2, 1, 1, cols[2]);
      } else {
        for (let i = 0; i < 4; i++) px(x, 5 + i * 2, top - 2, 1, 1, cols[i]);
      }
      break;
    }
    case 'wizard': {
      px(x, 6, top - 6, 4, 2, A);
      px(x, 5, top - 4, 6, 2, A);
      px(x, 4, top - 2, 8, 2, A);
      px(x, 2, top, 12, 1, A); // brim
      px(x, 6, top - 6, 1, 6, shade(A, 1.2));
      px(x, 8, top - 5, 1, 1, '#f7e08a'); // star
      break;
    }
    case 'crown': {
      px(x, 4, top - 1, 8, 1, A);
      px(x, 4, top - 2, 1, 1, A);
      px(x, 11, top - 2, 1, 1, A);
      px(x, 7, top - 2, 1, 1, '#f2d24c');
      px(x, 7, top - 2, 1, 1, '#7aa6e0'); // gem
      break;
    }
  }
}

// ===========================================================================
// TILES
// ===========================================================================
export const T = {
  GRASS: 0,
  GRASS2: 1,
  PATH: 2,
  SAND: 3,
  WATER: 4,
  WATERDEEP: 5,
  STONE: 6,
  STONE2: 7,
  WALL: 8,
  BRIDGE: 9,
  EMBER: 10,
} as const;
export const TILE_COUNT = 11;
export const TILE = 16;
export const TVARIANTS = 4;

export const SOLID_TILES = new Set<number>([T.WATER, T.WATERDEEP, T.WALL]);

export interface TileAtlas {
  canvas: HTMLCanvasElement;
  src(id: number, variant: number): { sx: number; sy: number };
}

export function buildTileAtlas(): TileAtlas {
  const { c, x } = makeCanvas(TILE * TVARIANTS, TILE * TILE_COUNT);
  for (let id = 0; id < TILE_COUNT; id++) {
    for (let v = 0; v < TVARIANTS; v++) {
      x.save();
      x.translate(v * TILE, id * TILE);
      drawTile(x, id, mulberry32(id * 101 + v * 17 + 7));
      x.restore();
    }
  }
  return {
    canvas: c,
    src: (id, variant) => ({ sx: (variant % TVARIANTS) * TILE, sy: id * TILE }),
  };
}

function speckle(x: CanvasRenderingContext2D, rng: () => number, n: number, col: string) {
  for (let i = 0; i < n; i++) px(x, Math.floor(rng() * TILE), Math.floor(rng() * TILE), 1, 1, col);
}

function drawTile(x: CanvasRenderingContext2D, id: number, rng: () => number) {
  switch (id) {
    case T.GRASS:
      px(x, 0, 0, TILE, TILE, '#5aa64a');
      speckle(x, rng, 10, '#67b455');
      speckle(x, rng, 8, '#4f9942');
      for (let i = 0; i < 3; i++) {
        const bx = Math.floor(rng() * 14) + 1;
        const by = Math.floor(rng() * 13) + 2;
        px(x, bx, by, 1, 2, '#3f8a37');
      }
      break;
    case T.GRASS2:
      px(x, 0, 0, TILE, TILE, '#3f7e3c');
      speckle(x, rng, 10, '#4a8c44');
      speckle(x, rng, 8, '#356b34');
      break;
    case T.PATH:
      px(x, 0, 0, TILE, TILE, '#b89668');
      speckle(x, rng, 12, '#a9854f');
      speckle(x, rng, 6, '#c7a87a');
      break;
    case T.SAND:
      px(x, 0, 0, TILE, TILE, '#e3d29a');
      speckle(x, rng, 10, '#d6c184');
      speckle(x, rng, 5, '#efe2b3');
      break;
    case T.WATER:
      px(x, 0, 0, TILE, TILE, '#3f86c4');
      px(x, 0, 4 + Math.floor(rng() * 3), TILE, 1, '#5a9bd4');
      px(x, 0, 10 + Math.floor(rng() * 3), TILE, 1, '#357bb8');
      speckle(x, rng, 5, '#6fb0e0');
      break;
    case T.WATERDEEP:
      px(x, 0, 0, TILE, TILE, '#2c5f95');
      px(x, 0, 6 + Math.floor(rng() * 3), TILE, 1, '#3c74ad');
      break;
    case T.STONE:
      px(x, 0, 0, TILE, TILE, '#6a6a78');
      speckle(x, rng, 8, '#777787');
      speckle(x, rng, 6, '#5b5b69');
      px(x, 2 + Math.floor(rng() * 8), 3 + Math.floor(rng() * 8), 3, 1, '#56566a');
      break;
    case T.STONE2:
      px(x, 0, 0, TILE, TILE, '#565463');
      speckle(x, rng, 8, '#615f70');
      break;
    case T.WALL:
      px(x, 0, 0, TILE, TILE, '#34313f');
      px(x, 0, 0, TILE, 4, '#45414f'); // lit top edge
      px(x, 0, 0, TILE, 1, '#564f60');
      speckle(x, rng, 6, '#2a2834');
      break;
    case T.BRIDGE:
      px(x, 0, 0, TILE, TILE, '#9a6f43');
      for (let i = 0; i < TILE; i += 4) px(x, i, 0, 1, TILE, '#7d5732');
      px(x, 0, 1, TILE, 1, '#b08350');
      break;
    case T.EMBER:
      px(x, 0, 0, TILE, TILE, '#5aa64a');
      speckle(x, rng, 8, '#67b455');
      speckle(x, rng, 5, '#e8a23a');
      px(x, 7, 7, 2, 2, '#f7c451');
      break;
  }
}

// ===========================================================================
// PROPS  (each is its own canvas; bottom edge is the ground contact point)
// ===========================================================================
export interface Sprite {
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
}

function sprite(w: number, h: number, draw: (x: CanvasRenderingContext2D) => void): Sprite {
  const { c, x } = makeCanvas(w, h);
  draw(x);
  return { canvas: c, w, h };
}

export type PropName =
  | 'tree'
  | 'pine'
  | 'stump'
  | 'rock'
  | 'rockSmall'
  | 'bush'
  | 'flowerR'
  | 'flowerY'
  | 'flowerB'
  | 'grass'
  | 'reed'
  | 'chest'
  | 'chestOpen'
  | 'sign'
  | 'shard'
  | 'heart'
  | 'ember'
  | 'key'
  | 'lanternDark'
  | 'lanternLit'
  | 'cave'
  | 'mushroom'
  | 'crystal'
  | 'gate'
  | 'slime0'
  | 'slime1'
  | 'bat0'
  | 'bat1'
  | 'warden0'
  | 'warden1';

export function buildProps(): Record<PropName, Sprite> {
  const tree = sprite(26, 30, (x) => {
    px(x, 11, 18, 4, 12, '#6a4626');
    px(x, 11, 18, 1, 12, '#5a3a1e');
    px(x, 14, 18, 1, 12, '#7a5631');
    // canopy
    px(x, 4, 2, 18, 14, '#3f7e3c');
    px(x, 2, 5, 22, 9, '#3f7e3c');
    px(x, 6, 0, 14, 4, '#4a9044');
    px(x, 4, 2, 18, 2, '#56a04e'); // top light
    for (let i = 0; i < 16; i++) px(x, 4 + Math.floor(Math.random() * 18), 3 + Math.floor(Math.random() * 11), 1, 1, '#356b34');
    px(x, 5, 12, 16, 2, '#2f6230'); // bottom shade
  });

  const pine = sprite(22, 32, (x) => {
    px(x, 9, 24, 4, 8, '#6a4626');
    px(x, 2, 16, 18, 7, '#2f6b46');
    px(x, 4, 9, 14, 7, '#36764e');
    px(x, 6, 3, 10, 7, '#3f8255');
    px(x, 8, 0, 6, 4, '#4a8f5e');
    px(x, 4, 9, 14, 1, '#488a5f');
  });

  const stump = sprite(16, 12, (x) => {
    px(x, 3, 4, 10, 7, '#6a4626');
    px(x, 3, 3, 10, 2, '#8a6a40');
    px(x, 6, 4, 4, 1, '#a07a4c');
    px(x, 3, 10, 10, 1, '#4f3219');
  });

  const rock = sprite(20, 16, (x) => {
    px(x, 2, 6, 16, 10, '#7c7c8a');
    px(x, 4, 3, 12, 5, '#8a8a98');
    px(x, 4, 3, 12, 1, '#9c9caa');
    px(x, 2, 13, 16, 3, '#62626f');
    px(x, 6, 8, 3, 1, '#56565f');
  });

  const rockSmall = sprite(12, 10, (x) => {
    px(x, 2, 3, 8, 7, '#7c7c8a');
    px(x, 3, 2, 6, 2, '#8e8e9c');
    px(x, 2, 8, 8, 2, '#62626f');
  });

  const bush = sprite(18, 15, (x) => {
    const g = '#46934a';
    const gd = '#2f6b34';
    const gl = '#69ba5b';
    // bumpy leafy dome — transparent corners give a rounded, non-boxy silhouette
    px(x, 5, 2, 3, 2, g);
    px(x, 10, 3, 3, 2, g);
    px(x, 3, 4, 12, 3, g);
    px(x, 2, 6, 14, 5, g);
    px(x, 3, 11, 12, 2, gd);
    px(x, 5, 13, 8, 1, gd);
    // top-left leaf highlights
    px(x, 4, 4, 3, 2, gl);
    px(x, 9, 4, 2, 2, gl);
    px(x, 12, 6, 2, 2, gl);
    px(x, 7, 7, 2, 1, gl);
    // berries
    px(x, 6, 9, 1, 1, '#e2474d');
    px(x, 11, 8, 1, 1, '#f2c94c');
    px(x, 9, 10, 1, 1, '#e2474d');
  });

  const flower = (petal: string, center: string) =>
    sprite(16, 12, (x) => {
      const make = (cx: number, cy: number) => {
        px(x, cx, cy + 4, 1, 3, '#3a7a3a'); // stem
        px(x, cx - 1, cy + 1, 3, 2, petal);
        px(x, cx, cy, 1, 4, petal);
        px(x, cx, cy + 1, 1, 1, center);
      };
      make(4, 3);
      make(9, 5);
      make(12, 2);
    });

  const grass = sprite(14, 10, (x) => {
    px(x, 2, 3, 1, 7, '#4f9942');
    px(x, 4, 1, 1, 9, '#56a04e');
    px(x, 6, 4, 1, 6, '#4f9942');
    px(x, 8, 2, 1, 8, '#56a04e');
    px(x, 10, 4, 1, 6, '#4f9942');
    px(x, 11, 2, 1, 8, '#67b455');
  });

  const reed = sprite(12, 16, (x) => {
    px(x, 3, 2, 1, 14, '#6f8f4a');
    px(x, 6, 0, 1, 16, '#7da055');
    px(x, 9, 3, 1, 13, '#6f8f4a');
    px(x, 5, 0, 3, 2, '#9a7b3a');
  });

  const chest = sprite(16, 14, (x) => {
    px(x, 2, 6, 12, 8, '#7a5026');
    px(x, 2, 6, 12, 2, '#9a6a36');
    px(x, 2, 4, 12, 3, '#8a5c2e'); // lid
    px(x, 2, 4, 12, 1, '#a87a40');
    px(x, 2, 4, 1, 10, '#5e3c1c');
    px(x, 13, 4, 1, 10, '#5e3c1c');
    px(x, 7, 6, 2, 4, '#e6bd4a'); // lock
    px(x, 7, 7, 2, 1, '#fff0b0');
    px(x, 2, 9, 12, 1, '#5e3c1c'); // band
  });

  const chestOpen = sprite(16, 14, (x) => {
    px(x, 2, 8, 12, 6, '#7a5026');
    px(x, 2, 8, 12, 1, '#9a6a36');
    px(x, 2, 2, 12, 3, '#8a5c2e'); // raised lid
    px(x, 2, 2, 12, 1, '#a87a40');
    px(x, 3, 9, 10, 4, '#2a1c12'); // dark interior
    px(x, 4, 10, 8, 1, '#e6bd4a'); // gleam
  });

  const sign = sprite(16, 16, (x) => {
    px(x, 7, 8, 2, 8, '#6a4626');
    px(x, 2, 2, 12, 7, '#9a6f43');
    px(x, 2, 2, 12, 1, '#b08350');
    px(x, 2, 8, 12, 1, '#6a4626');
    px(x, 4, 4, 8, 1, '#5e3c1c');
    px(x, 4, 6, 6, 1, '#5e3c1c');
  });

  const shard = sprite(12, 16, (x) => {
    px(x, 5, 0, 2, 16, '#ffd36a');
    px(x, 4, 3, 4, 10, '#f2a93a');
    px(x, 3, 6, 6, 5, '#e88a2a');
    px(x, 5, 1, 1, 14, '#fff0b0');
    px(x, 4, 5, 1, 4, '#ffd36a');
  });

  const heart = sprite(12, 12, (x) => {
    const c = '#e2474d';
    px(x, 2, 2, 3, 3, c);
    px(x, 7, 2, 3, 3, c);
    px(x, 1, 4, 10, 3, c);
    px(x, 2, 7, 8, 2, c);
    px(x, 4, 9, 4, 1, c);
    px(x, 3, 3, 2, 1, '#f59ba0'); // shine
  });

  const ember = sprite(10, 12, (x) => {
    px(x, 4, 0, 2, 3, '#ffe08a');
    px(x, 3, 2, 4, 6, '#f6a93a');
    px(x, 2, 5, 6, 5, '#e8772a');
    px(x, 4, 3, 1, 4, '#fff0c0');
    px(x, 3, 9, 4, 2, '#c85a22');
  });

  const key = sprite(12, 12, (x) => {
    px(x, 2, 2, 5, 5, '#e6bd4a');
    px(x, 3, 3, 3, 3, '#5e3c1c');
    px(x, 6, 5, 5, 2, '#e6bd4a');
    px(x, 9, 7, 2, 2, '#e6bd4a');
    px(x, 8, 7, 1, 3, '#e6bd4a');
  });

  const lantern = (lit: boolean) =>
    sprite(44, 56, (x) => {
      // big heart-tree trunk
      px(x, 18, 30, 8, 26, '#5a3a1e');
      px(x, 18, 30, 2, 26, '#4a2f18');
      px(x, 24, 30, 2, 26, '#6a4626');
      px(x, 14, 50, 16, 6, '#4a2f18'); // roots
      // canopy
      px(x, 6, 4, 32, 24, '#356b34');
      px(x, 2, 10, 40, 14, '#356b34');
      px(x, 12, 0, 20, 6, '#3f7e3c');
      px(x, 6, 4, 32, 3, '#4a9044');
      for (let i = 0; i < 40; i++) px(x, 4 + Math.floor(Math.random() * 36), 4 + Math.floor(Math.random() * 22), 1, 1, '#2f6230');
      // hanging lantern
      const glow = lit ? '#ffd86a' : '#3a3530';
      px(x, 20, 24, 4, 6, lit ? '#caa24a' : '#5a554c');
      px(x, 19, 26, 6, 2, '#caa24a');
      px(x, 20, 25, 4, 4, glow);
      if (lit) {
        px(x, 21, 26, 2, 2, '#fff3c0');
        // a few lit fruit
        px(x, 10, 12, 2, 2, '#ffd36a');
        px(x, 30, 16, 2, 2, '#ffd36a');
        px(x, 20, 8, 2, 2, '#ffd36a');
      }
    });

  const cave = sprite(30, 28, (x) => {
    px(x, 0, 6, 30, 22, '#5b5563');
    px(x, 2, 2, 26, 8, '#6a6472');
    px(x, 2, 2, 26, 2, '#7a7482');
    // dark arch
    px(x, 9, 12, 12, 16, '#171520');
    px(x, 11, 10, 8, 4, '#171520');
    px(x, 10, 14, 1, 12, '#0d0c14');
    px(x, 19, 14, 1, 12, '#0d0c14');
    speckle(x, mulberry32(99), 12, '#4a4552');
  });

  const mushroom = sprite(14, 14, (x) => {
    px(x, 6, 7, 2, 7, '#d8cdb0');
    px(x, 3, 3, 8, 5, '#7a4aa0');
    px(x, 3, 3, 8, 2, '#9a6ac0');
    px(x, 5, 4, 1, 1, '#d8b0f0');
    px(x, 8, 5, 1, 1, '#d8b0f0');
  });

  const crystal = sprite(14, 18, (x) => {
    px(x, 6, 1, 2, 17, '#8fe0d6');
    px(x, 4, 5, 6, 10, '#5ec4b8');
    px(x, 3, 8, 8, 5, '#46a89c');
    px(x, 6, 2, 1, 14, '#c8fff6');
  });

  const gate = sprite(20, 22, (x) => {
    px(x, 1, 0, 4, 22, '#6a6472');
    px(x, 15, 0, 4, 22, '#6a6472');
    for (let i = 0; i < 4; i++) px(x, 6, 1 + i * 5, 8, 3, '#caa24a');
    for (let i = 0; i < 3; i++) px(x, 6 + i * 4, 1, 2, 20, '#b08a36');
    px(x, 8, 9, 4, 4, '#e6bd4a'); // lock
  });

  const slimeBody = (squash: number) =>
    sprite(16, 14, (x) => {
      const y = 4 + squash;
      const h = 10 - squash;
      px(x, 2, y, 12, h, '#6a4f8a');
      px(x, 2, y, 12, 2, '#8a6aae');
      px(x, 3, y + 1, 2, 1, '#b89ad6');
      px(x, 5, y + 3, 2, 2, '#1b1622'); // eyes
      px(x, 9, y + 3, 2, 2, '#1b1622');
      px(x, 5, y + 3, 1, 1, '#e0d0f0');
      px(x, 9, y + 3, 1, 1, '#e0d0f0');
      px(x, 2, y + h - 1, 12, 1, '#4a3566');
    });

  const bat = (wing: number) =>
    sprite(18, 12, (x) => {
      const wy = 3 - wing;
      px(x, 6, 4, 6, 5, '#3a3346');
      px(x, 0, wy, 6, 4, '#4a4258'); // left wing
      px(x, 12, wy, 6, 4, '#4a4258'); // right wing
      px(x, 7, 5, 1, 1, '#e2474d');
      px(x, 10, 5, 1, 1, '#e2474d');
      px(x, 6, 2, 2, 2, '#3a3346'); // ears
      px(x, 10, 2, 2, 2, '#3a3346');
    });

  const warden = (pulse: number) =>
    sprite(26, 24, (x) => {
      const y = 4 + pulse;
      px(x, 2, y, 22, 18 - pulse, '#3a2a5a');
      px(x, 2, y, 22, 3, '#5a3f8a');
      px(x, 4, y + 1, 3, 2, '#8a6ace');
      px(x, 7, y + 5, 3, 3, '#ff5a5a'); // eyes
      px(x, 16, y + 5, 3, 3, '#ff5a5a');
      px(x, 7, y + 5, 1, 1, '#ffd0d0');
      px(x, 16, y + 5, 1, 1, '#ffd0d0');
      px(x, 9, y + 11, 8, 1, '#1a1226'); // mouth
      px(x, 2, y + 14 - pulse, 22, 2, '#241836');
    });

  return {
    tree,
    pine,
    stump,
    rock,
    rockSmall,
    bush,
    flowerR: flower('#e2474d', '#f2d24c'),
    flowerY: flower('#f2c94c', '#e0772a'),
    flowerB: flower('#5a8fd0', '#f2d24c'),
    grass,
    reed,
    chest,
    chestOpen,
    sign,
    shard,
    heart,
    ember,
    key,
    lanternDark: lantern(false),
    lanternLit: lantern(true),
    cave,
    mushroom,
    crystal,
    gate,
    slime0: slimeBody(0),
    slime1: slimeBody(2),
    bat0: bat(0),
    bat1: bat(2),
    warden0: warden(0),
    warden1: warden(2),
  };
}
