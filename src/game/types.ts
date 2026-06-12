// Core shared types for New Greenwood 3D

export type ResourceType = 'wood' | 'stone' | 'clay';

export interface Vec2 {
  x: number;
  z: number;
}

export interface ResourceNode {
  id: string;
  type: ResourceType;
  x: number;
  z: number;
  /** remaining harvests before depletion */
  hp: number;
  maxHp: number;
  /** game-time seconds remaining until regrowth (0 = active) */
  regrow: number;
  /** per-node visual variation seed 0..1 */
  seed: number;
}

export type BuildingId =
  | 'cottage'
  | 'grocery'
  | 'sugarbowl'
  | 'workshop'
  | 'bank'
  | 'hotel'
  | 'cultural_hall'
  | 'garden';

export interface BuildingConfig {
  id: BuildingId;
  name: string;
  desc: string;
  cost: { wood: number; stone: number; clay?: number; bswx?: number };
  /** BSWX generated per economy tick (5s) at level 1 */
  income: number;
  repReward: number;
  xpReward: number;
  /** reputation required before this appears in the build menu */
  repRequired: number;
  /** quest id that must be completed to unlock (optional) */
  questRequired?: string;
  footprint: number; // visual size hint
}

export interface Plot {
  id: string;
  x: number;
  z: number;
  building: BuildingId | null;
  level: number;
  /** seconds of construction remaining; 0 = operational */
  construction: number;
}

export interface NPCDef {
  id: string;
  name: string;
  title: string;
  x: number;
  z: number;
  color: string;
  hat: 'tophat' | 'bowler' | 'headwrap' | 'crown' | 'none';
  bio: string;
  gossip: string[];
}

export type QuestObjectiveKind =
  | 'gather' // gather resource (cumulative)
  | 'build' // build a specific building
  | 'earn' // cumulative BSWX earned
  | 'talk' // talk to npc(s)
  | 'reputation' // reach reputation amount
  | 'upgrade'; // upgrade any building to a level

export interface QuestObjective {
  kind: QuestObjectiveKind;
  /** resource type, building id, or npc id depending on kind */
  target?: string;
  amount: number;
  label: string;
}

export interface QuestDef {
  id: string;
  title: string;
  giver: string; // npc id
  line: 'main' | 'side';
  intro: string[]; // dialogue when accepting
  outro: string[]; // dialogue when turning in
  objectives: QuestObjective[];
  rewards: {
    bswx?: number;
    rep?: number;
    xp?: number;
    wood?: number;
    stone?: number;
    clay?: number;
    staminaMax?: number;
    text?: string;
  };
  /** quest id required before this is offered */
  requires?: string;
}

export type QuestStatus = 'locked' | 'available' | 'active' | 'ready' | 'done';

export interface QuestProgress {
  status: QuestStatus;
  /** progress per objective index */
  progress: number[];
}

export type HairStyle = 'fade' | 'afro' | 'locs' | 'braids' | 'puffs' | 'waves' | 'bald';
export type HatStyle = 'none' | 'cap' | 'bowler' | 'tophat' | 'headwrap';
export type AccessoryStyle = 'none' | 'glasses' | 'earrings' | 'bowtie';
export type BodyBuild = 'broad' | 'slender';

export interface PlayerAppearance {
  name: string;
  /** starting calling/profession — grants a one-time bonus */
  calling: string;
  build: BodyBuild;
  skin: string;
  hair: HairStyle;
  hairColor: string;
  hat: HatStyle;
  hatColor: string;
  shirt: string;
  pants: string;
  accessory: AccessoryStyle;
}

export interface CallingDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  bonusLabel: string;
  bonus: { wood?: number; stone?: number; clay?: number; bswx?: number; staminaMax?: number; rep?: number };
}

export type PanelId =
  | null
  | 'quests'
  | 'inventory'
  | 'build'
  | 'dialogue'
  | 'map'
  | 'help'
  | 'settings';

export interface DialogueState {
  npcId: string;
  lines: string[];
  index: number;
  /** quest being offered / turned in via this dialogue */
  questId?: string;
  mode: 'gossip' | 'offer' | 'turnin';
}

export interface Toast {
  id: number;
  text: string;
  icon?: string;
  kind: 'info' | 'reward' | 'quest' | 'warn';
}

export interface InteractTarget {
  kind: 'node' | 'npc' | 'plot' | 'building';
  id: string;
  label: string;
  verb: string;
  x: number;
  z: number;
}
