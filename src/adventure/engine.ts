// Emberwilds — game engine. Owns the simulation + canvas rendering. React only
// supplies the appearance/save and renders HUD chrome from the snapshots this
// emits, plus forwards touch input. Keyboard/mouse are handled here directly.

import { Appearance } from './appearance';
import { advAudio } from './audio';
import {
  buildActorSheet,
  buildTileAtlas,
  buildProps,
  actorSrc,
  TILE,
  TVARIANTS,
  SOLID_TILES,
  ActorSheet,
  TileAtlas,
  Sprite,
  PropName,
} from './sprites';
import { GameMap, Entity, SaveData, SHARD_NAMES, SAVE_VERSION } from './types';
import { generateWorld } from './world';

export interface EngineSnapshot {
  hp: number;
  maxHp: number;
  embers: number;
  keys: number;
  shards: boolean[];
  shardNames: string[];
  prompt: string | null;
  dialog: { name: string; text: string; index: number; total: number } | null;
  mapName: string;
  won: boolean;
  dead: boolean;
}

export interface EngineOpts {
  appearance: Appearance;
  initial?: SaveData | null;
  muted?: boolean;
  onUpdate: (s: EngineSnapshot) => void;
  onToast: (text: string, kind?: 'info' | 'good' | 'bad') => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  grav: number;
  glow?: boolean;
}

const DIRV = [
  [0, 1],
  [0, -1],
  [-1, 0],
  [1, 0],
];

const PLAYER_SPEED = 74;
const SPRINT = 1.5;
const ATTACK_DUR = 0.3;
const ATTACK_COOL = 0.32;
const IFRAME = 0.9;

export class AdventureEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private opts: EngineOpts;

  private actor: ActorSheet;
  private tiles: TileAtlas;
  private props: Record<PropName, Sprite>;

  private maps: Record<string, GameMap>;
  private map: GameMap;

  // player
  private px = 0;
  private py = 0;
  private dir = 0;
  private anim = 0;
  private moving = false;
  private iframe = 0;
  private attackT = 0;
  private attackHits = new Set<string>();
  private cool = 0;
  private kx = 0;
  private ky = 0;
  private stepTimer = 0;

  // stats / progress
  private hp = 6;
  private maxHp = 6;
  private embers = 0;
  private keys = 0;
  private shards = [false, false, false, false];
  private consumed = new Set<string>();
  private openGates = new Set<string>();
  private lit = false;
  private playtime = 0;

  // view
  private dpr = 1;
  private scale = 3;
  private cssW = 0;
  private cssH = 0;
  private camX = 0;
  private camY = 0;

  // input
  private keysDown = new Set<string>();
  private touchX = 0;
  private touchY = 0;
  private touchActive = false;
  private queuedAttack = false;
  private queuedInteract = false;

  // misc
  private clock = 0.34; // day-night phase (0 midnight .. 0.5 noon)
  private particles: Particle[] = [];
  private floaters: { x: number; y: number; max: number; life: number; ratio: number; w: number }[] = [];
  private fireT = 0;
  private dialog: { name: string; lines: string[]; idx: number } | null = null;
  private interactTarget: Entity | null = null;
  private prompt: string | null = null;
  private won = false;
  private dead = false;
  private paused = false;
  private fade = 0; // transition fade 0..1
  private fadeDir = 0; // -1 fading in, +1 fading out
  private pendingWarp: { map: string; x: number; y: number } | null = null;
  private deathT = 0;

  private raf = 0;
  private last = 0;
  private lightCanvas: HTMLCanvasElement;
  private lightCtx: CanvasRenderingContext2D;
  private lastSnap = '';

  constructor(canvas: HTMLCanvasElement, opts: EngineOpts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.opts = opts;
    this.actor = buildActorSheet(opts.appearance);
    this.tiles = buildTileAtlas();
    this.props = buildProps();
    this.maps = generateWorld();
    this.lightCanvas = document.createElement('canvas');
    this.lightCtx = this.lightCanvas.getContext('2d')!;

    advAudio.setMuted(!!opts.muted);

    if (opts.initial) {
      this.applySave(opts.initial);
      this.map = this.maps[opts.initial.mapId] ?? this.maps.overworld;
    } else {
      this.map = this.maps.overworld;
      this.px = this.map.spawn.x;
      this.py = this.map.spawn.y;
    }
    this.reconcileMap();
  }

  // -------------------------------------------------------------------- save
  private applySave(s: SaveData) {
    this.hp = s.hp;
    this.maxHp = s.maxHp;
    this.embers = s.embers;
    this.keys = s.keys;
    this.shards = s.shards.slice(0, 4);
    while (this.shards.length < 4) this.shards.push(false);
    this.consumed = new Set(s.consumed ?? []);
    this.openGates = new Set(s.openGates ?? []);
    this.lit = !!s.lit;
    this.won = !!s.lit;
    this.playtime = s.playtime ?? 0;
    this.px = s.x;
    this.py = s.y;
  }

  serialize(): SaveData {
    return {
      v: SAVE_VERSION,
      appearance: this.opts.appearance,
      mapId: this.map.id,
      x: this.px,
      y: this.py,
      hp: this.hp,
      maxHp: this.maxHp,
      embers: this.embers,
      keys: this.keys,
      shards: this.shards.slice(),
      consumed: [...this.consumed],
      openGates: [...this.openGates],
      lit: this.lit,
      playtime: this.playtime,
    };
  }

  /** Mark consumed/opened entities across the active map after load or warp. */
  private reconcileMap() {
    for (const e of this.map.entities) {
      if (this.consumed.has(e.id)) {
        if (e.kind === 'chest') {
          e.sprite = 'chestOpen';
          e.contents = undefined;
        } else {
          e.removed = true;
        }
      }
      if (e.kind === 'gate' && this.openGates.has(e.gateId ?? e.id)) {
        e.removed = true;
        e.solid = false;
      }
      if (e.kind === 'lantern' && this.lit) e.sprite = 'lanternLit';
    }
  }

  // ------------------------------------------------------------------ start
  start() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.canvas.addEventListener('pointerdown', this.onPointer);
    window.addEventListener('resize', this.resize);
    this.resize();
    advAudio.setMood(this.map.mood);
    this.last = performance.now();
    this.render(); // draw one frame immediately (covers rAF-paused previews)
    this.pushSnapshot(true);
    this.loop(this.last);
  }

  stop() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('pointerdown', this.onPointer);
    window.removeEventListener('resize', this.resize);
    advAudio.stop();
  }

  // ----------------------------------------------------------------- input
  private onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (this.keysDown.has(k)) return;
    this.keysDown.add(k);
    if (k === 'escape' || k === 'p') this.setPaused(!this.paused);
    if (this.paused) return;
    if (this.dialog) {
      if ([' ', 'enter', 'e', 'f'].includes(k)) this.advanceDialog();
      return;
    }
    if ([' ', 'j', 'k', 'x'].includes(k)) this.queuedAttack = true;
    if (['e', 'f', 'enter'].includes(k)) this.queuedInteract = true;
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keysDown.delete(e.key.toLowerCase());
  };
  private onPointer = () => {
    advAudio.unlock();
    if (this.paused) return;
    if (this.dialog) this.advanceDialog();
    else this.queuedAttack = true;
  };

  // touch API for React mobile controls
  setMoveAxis(x: number, y: number) {
    this.touchX = x;
    this.touchY = y;
    this.touchActive = Math.hypot(x, y) > 0.12;
  }
  pressAttack() {
    advAudio.unlock();
    if (this.dialog) this.advanceDialog();
    else this.queuedAttack = true;
  }
  pressInteract() {
    advAudio.unlock();
    if (this.dialog) this.advanceDialog();
    else this.queuedInteract = true;
  }
  setPaused(p: boolean) {
    this.paused = p;
    if (!p) this.last = performance.now();
    this.pushSnapshot(true);
  }
  isPaused() {
    return this.paused;
  }
  toggleMute() {
    advAudio.setMuted(!advAudio.isMuted());
    return advAudio.isMuted();
  }
  advanceDialog() {
    if (!this.dialog) return;
    this.dialog.idx++;
    if (this.dialog.idx >= this.dialog.lines.length) {
      this.dialog = null;
    } else {
      advAudio.sfx('talk');
    }
    this.pushSnapshot(true);
  }

  // ----------------------------------------------------------------- resize
  private resize = () => {
    const rect = this.canvas.getBoundingClientRect();
    this.cssW = Math.max(1, Math.round(rect.width));
    this.cssH = Math.max(1, Math.round(rect.height));
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.cssW * this.dpr);
    this.canvas.height = Math.round(this.cssH * this.dpr);
    this.lightCanvas.width = this.canvas.width;
    this.lightCanvas.height = this.canvas.height;
    // aim for ~15 tiles tall, integer zoom
    this.scale = Math.max(2, Math.min(5, Math.round(this.cssH / (TILE * 15))));
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
    this.lightCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  // ------------------------------------------------------------------- loop
  private loop = (now: number) => {
    this.raf = requestAnimationFrame(this.loop);
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.05) dt = 0.05; // clamp big gaps (tab refocus)
    if (!this.paused) this.update(dt);
    this.render();
  };

  // ----------------------------------------------------------------- update
  private update(dt: number) {
    this.playtime += dt;
    this.clock = (this.clock + dt / 240) % 1;
    this.fireT += dt;

    // transition fade
    if (this.fadeDir !== 0) {
      this.fade += this.fadeDir * dt * 3.2;
      if (this.fadeDir > 0 && this.fade >= 1) {
        this.fade = 1;
        this.doWarp();
        this.fadeDir = -1;
      } else if (this.fadeDir < 0 && this.fade <= 0) {
        this.fade = 0;
        this.fadeDir = 0;
      }
    }

    if (this.dead) {
      this.deathT -= dt;
      if (this.deathT <= 0) this.respawn();
      this.updateParticles(dt);
      return;
    }

    if (!this.dialog && this.fadeDir <= 0) {
      this.updatePlayer(dt);
      this.updateAttack(dt);
    }
    this.updateEnemies(dt);
    this.updatePickups(dt);
    this.updateInteract();
    this.updateParticles(dt);
    this.updateFloaters(dt);
    this.spawnAmbient(dt);

    // music mood: danger when an enemy is chasing nearby
    if (!this.won) {
      const danger = this.map.entities.some(
        (e) => e.kind === 'enemy' && !e.removed && Math.hypot(e.x - this.px, e.y - this.py) < 110,
      );
      advAudio.setMood(danger ? 'danger' : this.map.mood);
    }

    if (this.queuedInteract) {
      this.queuedInteract = false;
      this.doInteract();
    }
    this.pushSnapshot();
  }

  private updatePlayer(dt: number) {
    let mx = 0;
    let my = 0;
    const k = this.keysDown;
    if (k.has('a') || k.has('arrowleft')) mx -= 1;
    if (k.has('d') || k.has('arrowright')) mx += 1;
    if (k.has('w') || k.has('arrowup')) my -= 1;
    if (k.has('s') || k.has('arrowdown')) my += 1;
    if (this.touchActive) {
      mx = this.touchX;
      my = this.touchY;
    }
    let mag = Math.hypot(mx, my);
    const sprint = k.has('shift') ? SPRINT : 1;
    this.moving = mag > 0.1 && this.attackT <= 0;

    // knockback decays
    this.kx *= Math.pow(0.001, dt);
    this.ky *= Math.pow(0.001, dt);

    if (this.moving) {
      if (mag > 1) {
        mx /= mag;
        my /= mag;
        mag = 1;
      }
      // facing from dominant axis
      if (Math.abs(mx) > Math.abs(my)) this.dir = mx < 0 ? 2 : 3;
      else this.dir = my < 0 ? 1 : 0;
      const sp = PLAYER_SPEED * sprint * (this.attackT > 0 ? 0.3 : 1);
      this.tryMove(mx * sp * mag * dt, my * sp * mag * dt);
      this.anim += dt * (6 + sprint * 2) * mag;
      // footsteps
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        advAudio.sfx('step');
        this.stepTimer = 0.32 / sprint;
      }
    } else {
      this.anim = 0;
    }
    // apply knockback
    if (Math.abs(this.kx) + Math.abs(this.ky) > 1) this.tryMove(this.kx * dt, this.ky * dt);

    if (this.iframe > 0) this.iframe -= dt;
  }

  private tryMove(dx: number, dy: number) {
    if (!this.blocked(this.px + dx, this.py)) this.px += dx;
    else this.kx = 0;
    if (!this.blocked(this.px, this.py + dy)) this.py += dy;
    else this.ky = 0;
    // clamp to map
    this.px = Math.max(8, Math.min(this.map.w * TILE - 8, this.px));
    this.py = Math.max(12, Math.min(this.map.h * TILE - 2, this.py));
  }

  /** collision sample point is the player's feet */
  private blocked(x: number, y: number): boolean {
    const fy = y - 4;
    const rad = 4;
    for (const [ox, oy] of [
      [-rad, 0],
      [rad, 0],
      [0, -rad],
      [0, rad],
    ]) {
      const tx = Math.floor((x + ox) / TILE);
      const ty = Math.floor((fy + oy) / TILE);
      if (tx < 0 || ty < 0 || tx >= this.map.w || ty >= this.map.h) return true;
      if (SOLID_TILES.has(this.map.ground[ty * this.map.w + tx])) return true;
    }
    for (const e of this.map.entities) {
      if (!e.solid || e.removed) continue;
      const ex = e.x;
      const ey = e.y - 5;
      const rr = (e.r ?? 7) + 4;
      if ((x - ex) ** 2 + (fy - ey) ** 2 < rr * rr) return true;
    }
    return false;
  }

  private updateAttack(dt: number) {
    if (this.queuedAttack && this.cool <= 0 && this.attackT <= 0) {
      this.queuedAttack = false;
      this.attackT = ATTACK_DUR;
      this.cool = ATTACK_COOL;
      this.attackHits.clear();
      advAudio.sfx('swing');
    }
    this.queuedAttack = false;
    if (this.cool > 0) this.cool -= dt;
    if (this.attackT > 0) {
      this.attackT -= dt;
      // active window
      const prog = 1 - this.attackT / ATTACK_DUR;
      if (prog > 0.1 && prog < 0.7) {
        const [dx, dy] = DIRV[this.dir];
        const fx = this.px + dx * 15;
        const fy = this.py - 6 + dy * 15;
        for (const e of this.map.entities) {
          if (e.removed) continue;
          if (e.kind !== 'enemy' && e.kind !== 'bush') continue;
          if (this.attackHits.has(e.id)) continue;
          const ec = e.y - 6;
          if ((e.x - fx) ** 2 + (ec - fy) ** 2 < (15 + (e.r ?? 7)) ** 2) {
            this.attackHits.add(e.id);
            this.hitEntity(e, dx, dy);
          }
        }
      }
    }
  }

  private hitEntity(e: Entity, dx: number, dy: number) {
    if (e.kind === 'bush') {
      e.hp = (e.hp ?? 1) - 1;
      this.burst(e.x, e.y - 6, '#4a9044', 6);
      advAudio.sfx('hit');
      if ((e.hp ?? 0) <= 0) {
        e.removed = true;
        this.consumed.add(e.id);
        if (Math.random() < 0.5) this.dropPickup(e.x, e.y, Math.random() < 0.25 ? 'heart' : 'ember');
      }
      return;
    }
    // enemy
    e.hp = (e.hp ?? 1) - 1;
    e.hurtT = 0.18;
    e.vx = (e.vx ?? 0) + dx * 150;
    e.vy = (e.vy ?? 0) + dy * 150;
    this.burst(e.x, e.y - 6, '#ffffff', 5);
    this.addFloater(e);
    advAudio.sfx('hit');
    if ((e.hp ?? 0) <= 0) this.killEnemy(e);
  }

  private killEnemy(e: Entity) {
    e.removed = true;
    advAudio.sfx('enemyDie');
    this.burst(e.x, e.y - 6, e.enemy === 'warden' ? '#7a3aa0' : '#6a4f8a', 14);
    const n = e.enemy === 'warden' ? 6 : 1;
    for (let i = 0; i < n; i++) this.dropPickup(e.x + (Math.random() - 0.5) * 16, e.y, 'ember');
    if (Math.random() < (e.enemy === 'warden' ? 1 : 0.18)) this.dropPickup(e.x, e.y, 'heart');
    if (e.enemy === 'warden') this.opts.onToast('The Warden falls! The way is clear.', 'good');
  }

  private dropPickup(x: number, y: number, sub: 'ember' | 'heart' | 'key') {
    this.map.entities.push({
      id: `drop${Math.random().toString(36).slice(2)}`,
      kind: 'pickup',
      pickup: sub,
      amount: sub === 'ember' ? 1 + Math.floor(Math.random() * 2) : 1,
      x,
      y,
      sprite: sub === 'ember' ? 'ember' : sub === 'heart' ? 'heart' : 'key',
      vx: (Math.random() - 0.5) * 40,
      vy: -30 - Math.random() * 20,
      t: 0,
    });
  }

  private updateEnemies(dt: number) {
    for (const e of this.map.entities) {
      if (e.kind !== 'enemy' || e.removed) continue;
      e.t = (e.t ?? 0) + dt;
      if (e.hurtT && e.hurtT > 0) e.hurtT -= dt;
      // velocity (knockback) integrate + friction
      e.vx = (e.vx ?? 0) * Math.pow(0.0001, dt);
      e.vy = (e.vy ?? 0) * Math.pow(0.0001, dt);

      const dist = Math.hypot(this.px - e.x, this.py - e.y);
      const aggro = dist < (e.aggroR ?? 120) && !this.dead;
      let mvx = 0;
      let mvy = 0;
      if (aggro) {
        const a = Math.atan2(this.py - e.y, this.px - e.x);
        let sp = e.speed ?? 24;
        if (e.enemy === 'slime') {
          // hopping: move in pulses
          const hop = (Math.sin(e.t * 4) + 1) / 2;
          sp *= hop * 1.6;
        }
        mvx = Math.cos(a) * sp;
        mvy = Math.sin(a) * sp;
      } else {
        // wander near home
        e.wanderT = (e.wanderT ?? 0) - dt;
        if ((e.wanderT ?? 0) <= 0) {
          e.wanderT = 1 + Math.random() * 2;
          const a = Math.random() * Math.PI * 2;
          e.dir = a as unknown as number; // store wander angle in dir slot
        }
        const hx = e.homeX ?? e.x;
        const hy = e.homeY ?? e.y;
        const back = Math.hypot(hx - e.x, hy - e.y);
        const ang = back > 60 ? Math.atan2(hy - e.y, hx - e.x) : (e.dir as unknown as number) ?? 0;
        mvx = Math.cos(ang) * (e.speed ?? 24) * 0.35;
        mvy = Math.sin(ang) * (e.speed ?? 24) * 0.35;
      }
      const nx = e.x + (mvx + (e.vx ?? 0)) * dt;
      const ny = e.y + (mvy + (e.vy ?? 0)) * dt;
      if (!this.enemyBlocked(nx, e.y, e)) e.x = nx;
      if (!this.enemyBlocked(e.x, ny, e)) e.y = ny;

      // contact damage
      if (!this.dead && this.iframe <= 0 && dist < (e.r ?? 6) + 6) {
        this.damagePlayer(e.touch ?? 1, e.x, e.y);
      }
    }
  }

  private enemyBlocked(x: number, y: number, e: Entity): boolean {
    if (x < 8 || y < 12 || x > this.map.w * TILE - 8 || y > this.map.h * TILE - 2) return true;
    const fy = e.enemy === 'bat' ? y - 2 : y - 3;
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(fy / TILE);
    if (tx < 0 || ty < 0 || tx >= this.map.w || ty >= this.map.h) return true;
    const t = this.map.ground[ty * this.map.w + tx];
    // nothing crosses walls; bats may fly over water, others can't
    if (t === 8 /*WALL*/) return true;
    if (e.enemy !== 'bat' && SOLID_TILES.has(t)) return true;
    return false;
  }

  private damagePlayer(amount: number, sx: number, sy: number) {
    if (this.iframe > 0 || this.dead) return;
    this.hp -= amount;
    this.iframe = IFRAME;
    const a = Math.atan2(this.py - sy, this.px - sx);
    this.kx = Math.cos(a) * 200;
    this.ky = Math.sin(a) * 200;
    advAudio.sfx('hurt');
    this.burst(this.px, this.py - 8, '#e2474d', 6);
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
    this.pushSnapshot(true);
  }

  private die() {
    this.dead = true;
    this.deathT = 1.6;
    this.moving = false;
    advAudio.sfx('error');
    this.opts.onToast('The gloom overtakes you…', 'bad');
  }

  private respawn() {
    this.dead = false;
    this.hp = this.maxHp;
    this.iframe = IFRAME * 1.5;
    const ow = this.maps.overworld;
    if (this.map.id !== 'overworld') {
      this.map = ow;
      this.reconcileMap();
      advAudio.setMood(this.map.mood);
    }
    this.px = ow.spawn.x;
    this.py = ow.spawn.y;
    this.kx = 0;
    this.ky = 0;
    this.opts.onToast('You wake at the Glade, weary but whole.', 'info');
    this.pushSnapshot(true);
  }

  private updatePickups(dt: number) {
    for (const e of this.map.entities) {
      if (e.kind !== 'pickup' || e.removed) continue;
      e.t = (e.t ?? 0) + dt;
      // toss arc then settle
      if (e.vy !== undefined && e.t < 0.6) {
        e.x += (e.vx ?? 0) * dt;
        e.y += e.vy * dt;
        e.vy += 240 * dt;
      }
      const d = Math.hypot(this.px - e.x, this.py - e.y);
      if (d < 14 && !this.dead) this.collect(e);
    }
  }

  private collect(e: Entity) {
    e.removed = true;
    if (e.id.startsWith('drop')) {
      /* runtime drop, not persisted */
    } else this.consumed.add(e.id);
    if (e.pickup === 'ember') {
      this.embers += e.amount ?? 1;
      advAudio.sfx('coin');
    } else if (e.pickup === 'heart') {
      this.hp = Math.min(this.maxHp, this.hp + (e.amount ?? 2) * 2);
      advAudio.sfx('heart');
      this.burst(this.px, this.py - 10, '#e2474d', 6);
    } else if (e.pickup === 'key') {
      this.keys += 1;
      advAudio.sfx('key');
      this.opts.onToast('Found a rusty key.', 'good');
    }
    this.pushSnapshot(true);
  }

  // ------------------------------------------------------------- interaction
  private updateInteract() {
    if (this.dead || this.dialog) {
      this.interactTarget = null;
      this.prompt = null;
      return;
    }
    let best: Entity | null = null;
    let bestD = 30;
    let autoCollect: Entity | null = null;
    for (const e of this.map.entities) {
      if (e.removed) continue;
      const d = Math.hypot(this.px - e.x, this.py - (e.y - 6));
      if (e.kind === 'shard' && d < 16) autoCollect = e;
      if (e.kind === 'portal' && d < (e.r ?? 12)) {
        if (this.fadeDir === 0) this.startWarp(e);
      }
      const interactable =
        e.kind === 'npc' || e.kind === 'sign' || e.kind === 'chest' || e.kind === 'gate' || e.kind === 'lantern';
      if (interactable && d < bestD) {
        best = e;
        bestD = d;
      }
    }
    if (autoCollect) this.collectShard(autoCollect);
    this.interactTarget = best;
    this.prompt = best ? this.promptFor(best) : null;
  }

  private promptFor(e: Entity): string {
    switch (e.kind) {
      case 'npc':
        return `Talk to ${e.name}`;
      case 'sign':
        return 'Read sign';
      case 'chest':
        return e.contents ? (e.locked ? 'Unlock chest' : 'Open chest') : 'Empty';
      case 'gate':
        return 'Unlock gate';
      case 'lantern':
        return this.lit ? 'The Lantern burns bright' : 'Light the Lantern';
      default:
        return 'Interact';
    }
  }

  private doInteract() {
    const e = this.interactTarget;
    if (!e) return;
    if (e.kind === 'npc') {
      this.faceNpcToPlayer(e);
      this.openDialog(e.name ?? '', e.dialog ?? ['…']);
      advAudio.sfx('talk');
    } else if (e.kind === 'sign') {
      this.openDialog('', (e.text ?? '').split('\n'));
      advAudio.sfx('ui');
    } else if (e.kind === 'chest') {
      this.openChest(e);
    } else if (e.kind === 'gate') {
      this.openGate(e);
    } else if (e.kind === 'lantern') {
      this.tryLight();
    }
  }

  private faceNpcToPlayer(e: Entity) {
    const dx = this.px - e.x;
    const dy = this.py - e.y;
    e.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : dy < 0 ? 1 : 0;
  }

  private openChest(e: Entity) {
    if (!e.contents) {
      advAudio.sfx('ui');
      return;
    }
    if (e.locked && this.keys < 1) {
      advAudio.sfx('error');
      this.opts.onToast('Locked tight. You need a key.', 'bad');
      return;
    }
    if (e.locked) this.keys -= 1;
    const c = e.contents;
    if (c.ember) {
      this.embers += c.ember;
      this.opts.onToast(`+${c.ember} embers`, 'good');
    }
    if (c.key) {
      this.keys += c.key;
      this.opts.onToast('A rusty key!', 'good');
    }
    if (c.heart) {
      this.maxHp += c.heart * 2;
      this.hp = this.maxHp;
      this.opts.onToast('A Heart Berry! Max health up.', 'good');
    }
    e.contents = undefined;
    e.sprite = 'chestOpen';
    this.consumed.add(e.id);
    this.burst(e.x, e.y - 8, '#ffd86a', 12);
    advAudio.sfx('chest');
    this.pushSnapshot(true);
  }

  private openGate(e: Entity) {
    if (this.keys < 1) {
      advAudio.sfx('error');
      this.opts.onToast('The tide-gate is locked. Find a key.', 'bad');
      return;
    }
    this.keys -= 1;
    e.removed = true;
    e.solid = false;
    this.openGates.add(e.gateId ?? e.id);
    advAudio.sfx('gate');
    this.burst(e.x, e.y - 10, '#caa24a', 12);
    this.opts.onToast('The gate grinds open.', 'good');
    this.pushSnapshot(true);
  }

  private collectShard(e: Entity) {
    e.removed = true;
    this.consumed.add(e.id);
    const id = e.shardId ?? 0;
    this.shards[id] = true;
    advAudio.sfx('shard');
    for (let i = 0; i < 22; i++) this.burst(e.x, e.y - 8, '#ffd36a', 1);
    const got = this.shards.filter(Boolean).length;
    this.opts.onToast(`${SHARD_NAMES[id]} recovered!  (${got}/4)`, 'good');
    if (got === 4) this.opts.onToast('All shards gathered — return to the Lantern Tree!', 'good');
    this.pushSnapshot(true);
  }

  private tryLight() {
    const got = this.shards.filter(Boolean).length;
    if (got < 4) {
      advAudio.sfx('error');
      this.opts.onToast(`The Lantern is dark. Bring the Ember Shards. (${got}/4)`, 'info');
      return;
    }
    if (this.lit) return;
    this.lit = true;
    this.won = true;
    const lantern = this.map.entities.find((x) => x.kind === 'lantern');
    if (lantern) lantern.sprite = 'lanternLit';
    advAudio.setMood('victory');
    advAudio.sfx('victory');
    for (let i = 0; i < 80; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 30 + Math.random() * 120;
      this.particles.push({
        x: lantern ? lantern.x : this.px,
        y: (lantern ? lantern.y : this.py) - 26,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 30,
        life: 2.5,
        max: 2.5,
        size: 1 + Math.random() * 2,
        color: ['#ffd36a', '#f6a93a', '#fff0b0'][Math.floor(Math.random() * 3)],
        grav: 20,
        glow: true,
      });
    }
    this.opts.onToast('The Lantern blazes — light returns to the Emberwilds!', 'good');
    this.pushSnapshot(true);
  }

  // ------------------------------------------------------------------ warp
  private startWarp(e: Entity) {
    this.pendingWarp = { map: e.toMap ?? 'overworld', x: e.toX ?? 0, y: e.toY ?? 0 };
    this.fadeDir = 1;
    advAudio.sfx('warp');
  }
  private doWarp() {
    if (!this.pendingWarp) return;
    const m = this.maps[this.pendingWarp.map];
    if (m) {
      this.map = m;
      this.reconcileMap();
      this.px = this.pendingWarp.x;
      this.py = this.pendingWarp.y;
      advAudio.setMood(m.mood);
    }
    this.pendingWarp = null;
    this.pushSnapshot(true);
  }

  // ------------------------------------------------------------- particles
  private burst(x: number, y: number, color: string, n: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 20 + Math.random() * 60;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 20,
        life: 0.4 + Math.random() * 0.3,
        max: 0.7,
        size: 1 + Math.random() * 1.5,
        color,
        grav: 120,
      });
    }
  }
  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.grav * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    if (this.particles.length > 400) this.particles.splice(0, this.particles.length - 400);
  }
  private addFloater(e: Entity) {
    this.floaters.push({ x: e.x, y: e.y - (this.props[e.sprite ?? 'slime0']?.h ?? 14), max: 0.8, life: 0.8, ratio: (e.hp ?? 0) / (e.maxHp ?? 1), w: 16 });
  }
  private updateFloaters(dt: number) {
    for (const f of this.floaters) f.life -= dt;
    this.floaters = this.floaters.filter((f) => f.life > 0);
  }
  private spawnAmbient(dt: number) {
    const night = this.daylight() < 0.4;
    if (this.map.dark) {
      // drifting dust motes
      if (Math.random() < dt * 14) {
        this.particles.push({
          x: this.camX + Math.random() * this.cssW / this.scale,
          y: this.camY + Math.random() * this.cssH / this.scale,
          vx: (Math.random() - 0.5) * 6,
          vy: 4 + Math.random() * 6,
          life: 3,
          max: 3,
          size: 1,
          color: 'rgba(180,200,255,0.5)',
          grav: 0,
        });
      }
    } else if (night && Math.random() < dt * 10) {
      // fireflies near the player
      this.particles.push({
        x: this.px + (Math.random() - 0.5) * 220,
        y: this.py + (Math.random() - 0.5) * 160 - 10,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 2.5,
        max: 2.5,
        size: 1,
        color: '#cfff8a',
        grav: 0,
        glow: true,
      });
    }
    // embers rising from the lantern when lit
    if (this.lit && this.map.id === 'overworld' && Math.random() < dt * 18) {
      const l = this.map.entities.find((x) => x.kind === 'lantern');
      if (l)
        this.particles.push({
          x: l.x + (Math.random() - 0.5) * 24,
          y: l.y - 24,
          vx: (Math.random() - 0.5) * 8,
          vy: -18 - Math.random() * 12,
          life: 2,
          max: 2,
          size: 1 + Math.random(),
          color: '#ffd36a',
          grav: -4,
          glow: true,
        });
    }
  }

  // ------------------------------------------------------------------ light
  private daylight(): number {
    // 0 at midnight, 1 at noon — eased
    const d = 0.5 - 0.5 * Math.cos(this.clock * Math.PI * 2);
    const lift = 0.2 + 0.05 * this.shards.filter(Boolean).length + (this.lit ? 0.3 : 0);
    return Math.min(1, d * (1 - lift) + lift);
  }

  // ---------------------------------------------------------------- snapshot
  private pushSnapshot(force = false) {
    const snap: EngineSnapshot = {
      hp: this.hp,
      maxHp: this.maxHp,
      embers: this.embers,
      keys: this.keys,
      shards: this.shards.slice(),
      shardNames: SHARD_NAMES,
      prompt: this.dialog ? null : this.prompt,
      dialog: this.dialog
        ? {
            name: this.dialog.name,
            text: this.dialog.lines[this.dialog.idx] ?? '',
            index: this.dialog.idx,
            total: this.dialog.lines.length,
          }
        : null,
      mapName: this.map.name,
      won: this.won,
      dead: this.dead,
    };
    const key = JSON.stringify(snap);
    if (force || key !== this.lastSnap) {
      this.lastSnap = key;
      this.opts.onUpdate(snap);
    }
  }

  private openDialog(name: string, lines: string[]) {
    this.dialog = { name, lines: lines.filter((l) => l.length), idx: 0 };
    this.pushSnapshot(true);
  }

  // ----------------------------------------------------------------- render
  private render() {
    const ctx = this.ctx;
    const S = this.scale;
    // camera centered on player, clamped
    const viewW = this.cssW / S;
    const viewH = this.cssH / S;
    let cx = this.px - viewW / 2;
    let cy = this.py - viewH / 2;
    cx = Math.max(0, Math.min(this.map.w * TILE - viewW, cx));
    cy = Math.max(0, Math.min(this.map.h * TILE - viewH, cy));
    if (this.map.w * TILE < viewW) cx = (this.map.w * TILE - viewW) / 2;
    if (this.map.h * TILE < viewH) cy = (this.map.h * TILE - viewH) / 2;
    this.camX = cx;
    this.camY = cy;

    ctx.clearRect(0, 0, this.cssW, this.cssH);
    // bg base
    ctx.fillStyle = this.map.dark ? '#0c0b12' : '#3a6b8f';
    ctx.fillRect(0, 0, this.cssW, this.cssH);

    this.renderTiles(cx, cy, S, viewW, viewH);
    this.renderEntities(cx, cy, S);
    this.renderParticles(cx, cy, S);
    this.renderLighting(cx, cy, S);
    this.renderFloaters(cx, cy, S);

    if (this.fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.fade})`;
      ctx.fillRect(0, 0, this.cssW, this.cssH);
    }
    if (this.dead) {
      ctx.fillStyle = `rgba(30,0,8,${0.5 * Math.min(1, (1.6 - this.deathT) * 2)})`;
      ctx.fillRect(0, 0, this.cssW, this.cssH);
    }
  }

  private renderTiles(cx: number, cy: number, S: number, viewW: number, viewH: number) {
    const ctx = this.ctx;
    const t0 = Math.floor(cx / TILE);
    const tx0 = Math.max(0, t0);
    const ty0 = Math.max(0, Math.floor(cy / TILE));
    const tx1 = Math.min(this.map.w - 1, Math.ceil((cx + viewW) / TILE));
    const ty1 = Math.min(this.map.h - 1, Math.ceil((cy + viewH) / TILE));
    const atlas = this.tiles.canvas;
    const waterFrame = Math.floor(this.fireT * 3) % TVARIANTS;
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const id = this.map.ground[ty * this.map.w + tx];
        let variant = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
        if (id === 4 || id === 5) variant = waterFrame;
        const src = this.tiles.src(id, variant % TVARIANTS);
        const dx = Math.round((tx * TILE - cx) * S);
        const dy = Math.round((ty * TILE - cy) * S);
        ctx.drawImage(atlas, src.sx, src.sy, TILE, TILE, dx, dy, TILE * S, TILE * S);
      }
    }
  }

  private renderEntities(cx: number, cy: number, S: number) {
    const ctx = this.ctx;
    const margin = 40;
    const list: { sortY: number; e: Entity | null }[] = [];
    for (const e of this.map.entities) {
      if (e.removed) continue;
      if (e.x < cx - margin || e.x > cx + this.cssW / S + margin || e.y < cy - margin || e.y > cy + this.cssH / S + margin)
        continue;
      list.push({ sortY: e.y, e });
    }
    list.push({ sortY: this.py, e: null }); // player
    list.sort((a, b) => a.sortY - b.sortY);

    for (const item of list) {
      if (item.e === null) this.drawPlayer(cx, cy, S);
      else this.drawEntity(item.e, cx, cy, S);
    }
  }

  private drawEntity(e: Entity, cx: number, cy: number, S: number) {
    const ctx = this.ctx;
    if (e.kind === 'portal') {
      // draw the cave arch; portals on cave map double as the way back
      const sp = this.props[e.sprite ?? 'cave'];
      this.blit(sp, e.x, e.y, cx, cy, S);
      return;
    }
    if (e.kind === 'pickup' || e.kind === 'shard') {
      const bob = Math.sin(this.fireT * 3 + e.x) * 2;
      const sp = this.props[e.sprite ?? 'ember'];
      const gx = Math.round((e.x - cx) * S);
      const gy = Math.round((e.y - cy) * S);
      // little ground shadow + glow handled in lighting pass; draw sprite w/ bob
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#000';
      ctx.fillRect(gx - 3 * S, gy - S, 6 * S, 2 * S);
      ctx.globalAlpha = 1;
      this.blitAt(sp, e.x, e.y + bob - 4, cx, cy, S);
      return;
    }
    if (e.kind === 'enemy') {
      this.drawEnemy(e, cx, cy, S);
      return;
    }
    if (e.kind === 'npc') {
      this.drawNpc(e, cx, cy, S);
      return;
    }
    // generic prop / chest / sign / gate / lantern / bush
    const name = e.sprite ?? 'rock';
    const sp = this.props[name];
    if (!sp) return;
    if (e.sway) {
      const baseX = Math.round((e.x - cx) * S);
      const baseY = Math.round((e.y - cy) * S);
      const ang = Math.sin(this.fireT * 1.4 + e.x * 0.15) * (name === 'grass' || name.startsWith('flower') ? 0.06 : 0.02);
      ctx.save();
      ctx.translate(baseX, baseY);
      ctx.rotate(ang);
      ctx.drawImage(sp.canvas, Math.round((-sp.w / 2) * S), Math.round(-sp.h * S), sp.w * S, sp.h * S);
      ctx.restore();
    } else {
      this.blit(sp, e.x, e.y, cx, cy, S);
    }
  }

  private drawEnemy(e: Entity, cx: number, cy: number, S: number) {
    const ctx = this.ctx;
    let name: PropName = 'slime0';
    if (e.enemy === 'slime') name = Math.floor((e.t ?? 0) * 6) % 2 ? 'slime1' : 'slime0';
    else if (e.enemy === 'bat') name = Math.floor((e.t ?? 0) * 10) % 2 ? 'bat1' : 'bat0';
    else if (e.enemy === 'warden') name = Math.floor((e.t ?? 0) * 3) % 2 ? 'warden1' : 'warden0';
    const sp = this.props[name];
    // shadow
    const gx = Math.round((e.x - cx) * S);
    const gy = Math.round((e.y - cy) * S);
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#000';
    ctx.fillRect(gx - (sp.w / 2 - 1) * S, gy - S, (sp.w - 2) * S, 2 * S);
    ctx.globalAlpha = 1;
    if (e.hurtT && e.hurtT > 0 && Math.floor(this.fireT * 30) % 2) {
      // flash: draw brighter silhouette
      this.blit(sp, e.x, e.y, cx, cy, S);
      ctx.globalAlpha = 0.5;
      ctx.globalCompositeOperation = 'lighter';
      this.blit(sp, e.x, e.y, cx, cy, S);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    } else {
      this.blit(sp, e.x, e.y, cx, cy, S);
    }
  }

  private drawNpc(e: Entity, cx: number, cy: number, S: number) {
    const ctx = this.ctx;
    if (!e.appearance) return;
    if (!e._sheet) e._sheet = buildActorSheet(e.appearance);
    const sheet = e._sheet as ActorSheet;
    const dir = e.facing ?? 0;
    const bobF = Math.floor(this.fireT * 2 + e.x) % 2 ? 2 : 0; // gentle idle sway via frame
    const src = actorSrc(dir, bobF);
    const gx = Math.round((e.x - cx) * S);
    const gy = Math.round((e.y - cy) * S);
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#000';
    ctx.fillRect(gx - 4 * S, gy - S, 8 * S, 2 * S);
    ctx.globalAlpha = 1;
    const w = sheet.fw * S;
    const h = sheet.fh * S;
    const dx = gx - w / 2;
    const dy = gy - h;
    if (src.flip) {
      ctx.save();
      ctx.translate(dx + w, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet.canvas, src.sx, src.sy, sheet.fw, sheet.fh, 0, 0, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(sheet.canvas, src.sx, src.sy, sheet.fw, sheet.fh, dx, dy, w, h);
    }
    // ! indicator over quest giver
  }

  private drawPlayer(cx: number, cy: number, S: number) {
    const ctx = this.ctx;
    if (this.iframe > 0 && Math.floor(this.fireT * 20) % 2 && !this.dead) return; // blink
    let frame = 0;
    if (this.attackT > 0) frame = 2;
    else if (this.moving) frame = Math.floor(this.anim) % 4;
    const src = actorSrc(this.dir, frame);
    const gx = Math.round((this.px - cx) * S);
    const gy = Math.round((this.py - cy) * S);
    // shadow
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.fillRect(gx - 4 * S, gy - S, 8 * S, 2 * S);
    ctx.globalAlpha = 1;
    const w = this.actor.fw * S;
    const h = this.actor.fh * S;
    const dx = gx - w / 2;
    const dy = gy - h;
    if (src.flip) {
      ctx.save();
      ctx.translate(dx + w, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(this.actor.canvas, src.sx, src.sy, this.actor.fw, this.actor.fh, 0, 0, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(this.actor.canvas, src.sx, src.sy, this.actor.fw, this.actor.fh, dx, dy, w, h);
    }
    // attack slash
    if (this.attackT > 0) this.drawSlash(gx, gy, S);
  }

  private drawSlash(gx: number, gy: number, S: number) {
    const ctx = this.ctx;
    const prog = 1 - this.attackT / ATTACK_DUR;
    if (prog > 0.75) return;
    const [dx, dy] = DIRV[this.dir];
    const cxp = gx + dx * 14 * S;
    const cyp = gy - 8 * S + dy * 14 * S;
    const baseAng = Math.atan2(dy, dx);
    const sweep = -0.9 + prog * 1.8;
    ctx.save();
    ctx.translate(cxp, cyp);
    ctx.rotate(baseAng + sweep);
    ctx.globalAlpha = 0.85 * (1 - prog);
    ctx.fillStyle = '#fff7e0';
    ctx.fillRect(0, -2 * S, 12 * S, 3 * S);
    ctx.globalAlpha = 0.5 * (1 - prog);
    ctx.fillStyle = '#ffd36a';
    ctx.fillRect(2 * S, -1 * S, 10 * S, 1.5 * S);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private blit(sp: Sprite, wx: number, wy: number, cx: number, cy: number, S: number) {
    const ctx = this.ctx;
    const dx = Math.round((wx - cx) * S - (sp.w / 2) * S);
    const dy = Math.round((wy - cy) * S - sp.h * S);
    ctx.drawImage(sp.canvas, dx, dy, sp.w * S, sp.h * S);
  }
  private blitAt(sp: Sprite, wx: number, wy: number, cx: number, cy: number, S: number) {
    this.blit(sp, wx, wy, cx, cy, S);
  }

  private renderParticles(cx: number, cy: number, S: number) {
    const ctx = this.ctx;
    for (const p of this.particles) {
      const a = Math.max(0, p.life / p.max);
      const dx = Math.round((p.x - cx) * S);
      const dy = Math.round((p.y - cy) * S);
      if (p.glow) {
        ctx.globalAlpha = a * 0.5;
        ctx.fillStyle = p.color;
        ctx.fillRect(dx - 1 * S, dy - 1 * S, (p.size + 2) * S, (p.size + 2) * S);
      }
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(dx, dy, Math.max(1, p.size * S), Math.max(1, p.size * S));
    }
    ctx.globalAlpha = 1;
  }

  private renderFloaters(cx: number, cy: number, S: number) {
    const ctx = this.ctx;
    for (const f of this.floaters) {
      const dx = Math.round((f.x - cx) * S);
      const dy = Math.round((f.y - cy) * S - 2 * S);
      const w = f.w * S;
      ctx.globalAlpha = Math.min(1, f.life / 0.3);
      ctx.fillStyle = '#000';
      ctx.fillRect(dx - w / 2 - S, dy - S, w + 2 * S, 3 * S);
      ctx.fillStyle = '#3a1216';
      ctx.fillRect(dx - w / 2, dy, w, S);
      ctx.fillStyle = '#e2474d';
      ctx.fillRect(dx - w / 2, dy, w * Math.max(0, f.ratio), S);
    }
    ctx.globalAlpha = 1;
  }

  private renderLighting(cx: number, cy: number, S: number) {
    const ctx = this.ctx;
    const day = this.daylight();
    if (this.map.dark) {
      const lc = this.lightCtx;
      lc.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      lc.clearRect(0, 0, this.cssW, this.cssH);
      lc.fillStyle = 'rgba(6,5,14,0.9)';
      lc.fillRect(0, 0, this.cssW, this.cssH);
      lc.globalCompositeOperation = 'destination-out';
      const punch = (wx: number, wy: number, r: number, soft = 0.55) => {
        const sx = (wx - cx) * S;
        const sy = (wy - cy) * S;
        const g = lc.createRadialGradient(sx, sy, 0, sx, sy, r);
        g.addColorStop(0, 'rgba(0,0,0,1)');
        g.addColorStop(soft, 'rgba(0,0,0,0.6)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        lc.fillStyle = g;
        lc.beginPath();
        lc.arc(sx, sy, r, 0, Math.PI * 2);
        lc.fill();
      };
      punch(this.px, this.py - 8, 90 + (this.attackT > 0 ? 16 : 0));
      for (const e of this.map.entities) {
        if (e.removed) continue;
        if (e.sprite === 'crystal' || e.sprite === 'mushroom') punch(e.x, e.y - 8, 36, 0.4);
        if (e.kind === 'shard') punch(e.x, e.y - 8, 50, 0.4);
      }
      lc.globalCompositeOperation = 'source-over';
      ctx.drawImage(this.lightCanvas, 0, 0, this.canvas.width, this.canvas.height, 0, 0, this.cssW, this.cssH);
      // warm light tint additive around player torch
      this.glow(this.px, this.py - 8, 70, 'rgba(255,200,120,0.10)', cx, cy, S);
    } else if (day < 0.85) {
      // night/dusk tint over the overworld
      const a = (0.85 - day) * 0.7;
      // warm at dawn/dusk, cool at deep night
      const cool = day < 0.4;
      ctx.fillStyle = cool ? `rgba(18,26,62,${a})` : `rgba(60,40,70,${a * 0.7})`;
      ctx.fillRect(0, 0, this.cssW, this.cssH);
    }
    // additive glows for lit lantern, shards, ember pickups (both maps)
    for (const e of this.map.entities) {
      if (e.removed) continue;
      if (e.kind === 'lantern' && this.lit) this.glow(e.x, e.y - 24, 64, 'rgba(255,210,110,0.22)', cx, cy, S);
      if (!this.map.dark && day < 0.8) {
        if (e.kind === 'shard') this.glow(e.x, e.y - 8, 28, 'rgba(255,200,110,0.18)', cx, cy, S);
        if (e.sprite === 'ember') this.glow(e.x, e.y - 6, 20, 'rgba(255,150,70,0.16)', cx, cy, S);
      }
    }
  }

  private glow(wx: number, wy: number, r: number, color: string, cx: number, cy: number, S: number) {
    const ctx = this.ctx;
    const sx = (wx - cx) * S;
    const sy = (wy - cy) * S;
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
}
