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
  /** y-rotation in radians (0 / 90 / 180 / 270) */
  rot: number;
}

/** Live state while the player is placing a building on the grid. */
export interface PlacingState {
  buildingId: BuildingId;
  x: number;
  z: number;
  rot: number;
  /** whether the current cell is a legal place to build */
  valid: boolean;
}

export interface NPCDef {
  id: string;
  name: string;
  title: string;
  /** daytime post (where they conduct business) */
  x: number;
  z: number;
  /** where they retire when off the clock */
  home: { x: number; z: number };
  /** hours they are at their post & available, as [open, close) on a 24h clock.
   *  open > close means an overnight shift (e.g. [18, 6]). */
  hours: [number, number];
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

export type HairStyle = 'classic' | 'fade' | 'afro' | 'locs' | 'braids' | 'puffs' | 'waves' | 'bald';
export type HatStyle = 'none' | 'cap' | 'bowler' | 'tophat' | 'headwrap';
export type AccessoryStyle = 'none' | 'glasses' | 'earrings' | 'bowtie';
export type BodyBuild = 'broad' | 'slender';

export interface PlayerAppearance {
  name: string;
  /** starting calling/profession — grants a one-time bonus */
  calling: string;
  /** rigged character model id (see CHARACTER_MODELS) */
  model: string;
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
  | 'market'
  | 'merchant'
  | 'loan'
  | 'speculator'
  | 'board'
  | 'charter'
  | 'help'
  | 'settings';

export type MarketResource = 'wood' | 'stone' | 'clay' | 'goods';

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
  kind: 'node' | 'npc' | 'plot' | 'building' | 'event' | 'merchant' | 'lender' | 'speculator' | 'board';
  id: string;
  label: string;
  verb: string;
  x: number;
  z: number;
}

// ---------------------------------------------------------------------------
// Live events, offline earnings & harvest juice
// ---------------------------------------------------------------------------

export type GameEventKind = 'rush' | 'cache';

/** A short, time-limited beacon the player runs to and collects for a windfall. */
export interface GameEvent {
  id: string;
  kind: GameEventKind;
  /** plot id (rush) or node id (cache) the beacon is anchored to */
  anchorId: string;
  x: number;
  z: number;
  title: string;
  hint: string;
  /** resource type granted by a 'cache' event */
  resource?: ResourceType;
  /** seconds remaining before the beacon vanishes */
  timeLeft: number;
  /** total window length, for the countdown bar */
  duration: number;
}

/** Ephemeral floating number shown when a harvest lands. */
export interface HarvestPop {
  id: number;
  amount: number;
  type: ResourceType;
  crit: boolean;
  combo: number;
}

/** Accrued passive income while the player was away. */
export interface WelcomeBack {
  seconds: number;
  bswx: number;
}

export interface ProvisionDef {
  id: string;
  name: string;
  icon: string;
  /** BSWX cost */
  cost: number;
  /** stamina restored (use a large number for a full refill) */
  stamina: number;
  desc: string;
  /** building that must be operational before this is sold */
  requires?: BuildingId;
}

// ---------------------------------------------------------------------------
// Strangers in town: the Traveling Merchant, the Loan Shark, the Speculator
// ---------------------------------------------------------------------------

export type DealQuality = 'steal' | 'fair' | 'ripoff';

/** A single crate on the merchant's table — its contents are hidden until
 *  inspected or bought, and some are deliberately bad ("snake oil"). */
export interface MerchantDeal {
  id: number;
  /** BSWX the player pays */
  cost: number;
  /** what's actually inside */
  reward: { wood?: number; stone?: number; clay?: number; goods?: number; bswx?: number; stamina?: number };
  quality: DealQuality;
  /** label shown once revealed */
  label: string;
  /** still face-down? */
  mystery: boolean;
  /** already purchased this visit */
  sold: boolean;
}

export interface MerchantState {
  name: string;
  x: number;
  z: number;
  deals: MerchantDeal[];
  /** free inspections remaining this visit */
  inspectsLeft: number;
  /** trust −3..+3; rises with fair dealing, sinks if you snub him */
  trust: number;
  timeLeft: number;
  duration: number;
}

export interface LoanState {
  principal: number;
  owed: number;
  /** in-game day the balance is due */
  dueDay: number;
  overdue: boolean;
}

export interface LoanTier {
  principal: number;
  /** upfront interest fraction (owed = principal * (1 + rate)) */
  rate: number;
  /** days until due */
  days: number;
}

export interface SpeculatorOffer {
  plotId: string;
  buildingName: string;
  /** BSWX offered for the building */
  amount: number;
  x: number;
  z: number;
  timeLeft: number;
  duration: number;
}

// ---------------------------------------------------------------------------
// Endless town goals — there is always a next objective
// ---------------------------------------------------------------------------

export type GoalKind = 'buildings' | 'population' | 'reputation' | 'earned' | 'level';

export interface TownGoal {
  kind: GoalKind;
  target: number;
  label: string;
  /** rewards for completing this goal */
  reward: { bswx?: number; rep?: number; xp?: number };
}

// ---------------------------------------------------------------------------
// Prestige (Charter a New District) & resident requests
// ---------------------------------------------------------------------------

export interface LegacyState {
  /** permanent legacy tokens earned by chartering districts */
  tokens: number;
  /** which district you're building (1 = the first) */
  district: number;
}

export interface ResidentRequest {
  id: number;
  residentId: string;
  residentName: string;
  kind: 'wood' | 'stone' | 'clay' | 'bswx';
  amount: number;
  rewardBswx: number;
  rewardRep: number;
}

export type FortuneKind = 'festival' | 'boom' | 'panic' | 'blight';

/** A town-wide temporary modifier — good (festival/boom) or bad (panic/blight). */
export interface FortuneState {
  kind: FortuneKind;
  label: string;
  desc: string;
  icon: string;
  good: boolean;
  /** multiplier applied to economy income while active */
  incomeMult: number;
  /** gardens grow no food while true */
  foodOff: boolean;
  /** reputation change per economy tick */
  repPerTick: number;
  timeLeft: number;
  duration: number;
}
