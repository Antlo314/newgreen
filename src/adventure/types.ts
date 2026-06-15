// Emberwilds — shared runtime types.
import { Appearance } from './appearance';
import { PropName } from './sprites';
import { AdvMood } from './audio';

export type EntityKind =
  | 'prop'
  | 'bush'
  | 'chest'
  | 'sign'
  | 'shard'
  | 'pickup'
  | 'npc'
  | 'shop'
  | 'enemy'
  | 'lantern'
  | 'portal'
  | 'gate';

export interface Entity {
  id: string;
  kind: EntityKind;
  x: number; // world px, horizontal center
  y: number; // world px, ground contact (feet / base)
  sprite?: PropName;
  solid?: boolean;
  r?: number; // collision radius (px)
  sway?: boolean; // gentle wind animation for foliage

  // bush
  hp?: number;
  maxHp?: number;

  // chest / gate / sign / shard
  locked?: boolean;
  contents?: { ember?: number; key?: number; heart?: number };
  text?: string;
  shardId?: number;
  name?: string;
  gateId?: string;

  // pickup
  pickup?: 'ember' | 'heart' | 'key';
  amount?: number;

  // npc
  appearance?: Appearance;
  dialog?: string[];
  facing?: number;

  // enemy
  enemy?: 'slime' | 'bat' | 'warden' | 'wraith';
  speed?: number;
  touch?: number; // contact damage
  reward?: number; // embers on death
  aggroR?: number;
  castT?: number; // boss ability timer

  // portal
  toMap?: string;
  toX?: number;
  toY?: number;

  // runtime
  t?: number;
  vx?: number;
  vy?: number;
  dir?: number;
  hurtT?: number;
  dead?: boolean;
  removed?: boolean;
  cooldown?: number;
  homeX?: number;
  homeY?: number;
  wanderT?: number;

  // render cache (NPC sprite sheet, built lazily by the engine)
  _sheet?: unknown;
}

export interface GameMap {
  id: string;
  name: string;
  w: number; // tiles
  h: number; // tiles
  ground: Uint8Array; // w*h tile ids
  entities: Entity[];
  mood: AdvMood;
  dark: boolean; // cave-style darkness / vignette
  spawn: { x: number; y: number };
}

export interface SaveData {
  v: number;
  appearance: Appearance;
  mapId: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  embers: number;
  keys: number;
  shards: boolean[]; // length 4
  consumed: string[]; // ids of chests/pickups/bushes/shards taken or destroyed
  openGates: string[];
  lit: boolean;
  playtime: number;
  // progression / upgrades
  atk: number; // sword damage
  dash: boolean; // roll-dash unlocked
  swift: number; // sprint upgrade level
  lightLvl: number; // lantern charm level
  bossDefeated: boolean;
}

export const SHARD_NAMES = ['Sunpetal Shard', 'Hollowwood Shard', 'Tidewatch Shard', 'Deepglow Shard'];
export const SAVE_KEY = 'emberwilds_v1';
export const SAVE_VERSION = 2;
