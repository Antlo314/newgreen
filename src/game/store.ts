import { create } from 'zustand';
import {
  BUILDINGS,
  NPCS,
  NPC_BY_ID,
  COTTAGE_INCOME_BONUS,
  FORTUNES,
  GARDEN_INCOME_BONUS,
  GOALS,
  goalAt,
  adjacencyInfo,
  boonBuildFactor,
  boonIncomeMult,
  boonMarketMult,
  boonXpMult,
  CIVICS,
  civicCost,
  civicFoodBonus,
  civicIncomeMult,
  civicNightMult,
  civicXpMult,
  emptyCivics,
  emptySkills,
  incomeTimeFactor,
  isNightTime,
  MAX_SKILL,
  LOAN_TIERS,
  MAX_BUILDING_LEVEL,
  MERCHANT_POS,
  npcOpen,
  npcHoursLabel,
  PROVISIONS,
  QUESTS,
  QUEST_BY_ID,
  RESOURCE_LABEL,
  SPECULATOR_POS,
  UPGRADE_COST_MULT,
  xpForLevel,
} from './data';
import { canBuildAt, generateResourceNodes, snapToGrid } from './world';
import { CALLING_BY_ID, DEFAULT_APPEARANCE, randomName } from './customization';
import { deriveResidents, employmentStats } from './residents';
import type {
  BuildingId,
  DialogueState,
  FortuneState,
  GameEvent,
  HarvestPop,
  InteractTarget,
  LegacyState,
  LoanState,
  ResidentRequest,
  MarketResource,
  MerchantDeal,
  MerchantState,
  PanelId,
  PlacingState,
  CivicId,
  Civics,
  PlayerAppearance,
  Plot,
  QuestProgress,
  QuestStatus,
  ResourceNode,
  ResourceType,
  SkillId,
  Skills,
  SpeculatorOffer,
  Toast,
  TownGoal,
  WelcomeBack,
} from './types';
import { audio } from './audio';

const NPC_GOSSIP: Record<string, string[]> = Object.fromEntries(
  NPCS.map((n) => [n.id, n.gossip])
);

const SAVE_KEY = 'newgreenwood3d_v1';
const ECONOMY_TICK = 5; // seconds
const DAY_LENGTH = 240; // seconds per full day/night cycle
const NODE_REGROW = 70; // seconds
const HARVEST_TIME = 1.25; // seconds per harvest swing
const HARVEST_STAMINA = 6;

// the grind: a single dial that damps all passive business income so BSWX is
// a resource worth fighting for (and a buyout offer is a real temptation).
const INCOME_SCALE = 0.72;

// stamina is a real resource — walking burns it, rest restores it (faster at
// night). Run yourself ragged and you trudge until you rest or grab a bite.
const MOVE_DRAIN = 1.5; // stamina per second while on the move
// rest restores ~5/s — slow enough that harvesting (which holds you still) is
// roughly stamina-neutral rather than a free refill, so a real rest or a
// provision matters. Recovery is notably quicker after dark.
const IDLE_REGEN = 5; // stamina per second while standing still
const NIGHT_REGEN_MULT = 1.6; // you recover quicker after dark
const SPRINT_DRAIN_MULT = 2.2; // sprinting burns stamina faster

// skill effects (per point invested)
const VIGOR_MAX_PER_PT = 6; // +max stamina, applied when the point is spent
const VIGOR_DRAIN_PER_PT = 0.08; // each Vigor point shaves this off movement drain
const LABOR_TIME_PER_PT = 0.06; // each Labor point trims this off a harvest swing
const HAGGLE_SELL_PER_PT = 0.05; // better sell price per Haggling point
const HAGGLE_BUY_PER_PT = 0.04; // cheaper purchases per Haggling point
const HARVEST_YIELD: Record<ResourceType, [number, number]> = {
  wood: [2, 3],
  stone: [2, 3],
  clay: [1, 2],
};

// circulation economy
const FOOD_PER_RESIDENT = 0.15; // eaten per economy tick
const PANTRY_BUFFER = 4; // food the grocery won't sell off
const FOOD_PRICE = 2; // BSWX per surplus food sold
const GOODS_PRICE = 3; // BSWX per good sold through commerce
const WOOD_RESERVE = 25; // lumber the workshop leaves for construction
const FOOD_CAP = 99;
const GOODS_CAP = 99;
const MARKET_SPREAD = 1.25; // buy price multiplier over sell price

// offline earnings
const OFFLINE_CAP = 8 * 3600; // accrue at most 8 hours away
const OFFLINE_EFFICIENCY = 0.6; // offline earns 60% of the active rate
const OFFLINE_MIN_SECONDS = 120; // ignore quick tab switches

// live events (Market Rush / Rich Find beacons)
const EVENT_FIRST_GAP = 55; // first beacon after this many seconds
const EVENT_MIN_GAP = 70;
const EVENT_MAX_GAP = 120;
const EVENT_WINDOW = 30; // seconds to reach & collect a beacon
const RUSH_TICK_VALUE = 6; // a rush pays roughly this many ticks of income
const RUSH_MIN = 12; // ...but never less than this

// harvest crits & combo
const CRIT_BASE = 0.12;
const CRIT_PER_COMBO = 0.03;
const CRIT_MAX = 0.5;
const CRIT_MULT = 2;
const COMBO_WINDOW = 3; // seconds before an idle combo decays
const COMBO_MAX = 12;

// traveling merchant
const MERCHANT_FIRST_GAP = 95;
const MERCHANT_MIN_GAP = 150;
const MERCHANT_MAX_GAP = 240;
const MERCHANT_WINDOW = 75; // seconds the stall stays open
const MERCHANT_INSPECTS = 1; // free inspections per visit

// speculator buyout offers — a shady outsider who only operates after dark and
// fattens his bid when your coffers run low, so quick cash is a real lure.
const SPECULATOR_FIRST_GAP = 200;
const SPECULATOR_MIN_GAP = 190;
const SPECULATOR_MAX_GAP = 330;
const SPECULATOR_WINDOW = 60;
const SPECULATOR_VALUE_MULT = 34; // BSWX per (income × level)
const SPECULATOR_BASE = 120;

// town-wide fortunes
const FORTUNE_FIRST_GAP = 150;
const FORTUNE_MIN_GAP = 160;
const FORTUNE_MAX_GAP = 280;
const FORTUNE_MIN_DUR = 40;
const FORTUNE_MAX_DUR = 70;

// loan shark
const LOAN_OVERDUE_GROWTH = 1.12; // debt grows this much each overdue day

// prestige
const LEGACY_PER_TOKEN = 0.08; // +8% to all income per legacy token

// resident requests (community board)
const REQUEST_FIRST_GAP = 70;
const REQUEST_MIN_GAP = 110;
const REQUEST_MAX_GAP = 185;
const MAX_REQUESTS = 3;

const legacyMultiplier = (legacy: { tokens: number }) => 1 + legacy.tokens * LEGACY_PER_TOKEN;

export type GamePhase = 'menu' | 'create' | 'playing';

let toastId = 1;

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

/** Passive BSWX produced per economy tick from the current town layout. */
function passiveIncomePerTick(plots: Plot[], circulation: number, legacyMult = 1): number {
  let base = 0;
  let cottages = 0;
  let gardens = 0;
  for (const p of plots) {
    if (!p.building || p.construction > 0) continue;
    base += BUILDINGS[p.building].income * p.level * adjacencyInfo(p.building, p.x, p.z, plots, p.id).mult;
    if (p.building === 'cottage') cottages++;
    if (p.building === 'garden') gardens++;
  }
  const mult =
    (1 + cottages * COTTAGE_INCOME_BONUS + gardens * GARDEN_INCOME_BONUS) * (circulation || 1);
  return base * mult * legacyMult * INCOME_SCALE;
}

interface GameState {
  phase: GamePhase;
  hasSave: boolean;

  // player
  appearance: PlayerAppearance;
  px: number;
  pz: number;
  facing: number; // radians
  moving: boolean;
  bswx: number;
  wood: number;
  stone: number;
  clay: number;
  stamina: number;
  staminaMax: number;
  reputation: number;
  level: number;
  xp: number;
  totalEarned: number;
  /** whether the player is sprinting right now (burns extra stamina) */
  sprinting: boolean;

  // personal mastery
  skillPoints: number;
  skills: Skills;

  // civic improvements (town-wide BSWX-bought upgrades)
  civics: Civics;

  // world
  nodes: ResourceNode[];
  nodesVersion: number;
  plots: Plot[];
  timeOfDay: number; // 0..1 (0.25 = dawn, 0.5 = noon, 0.75 = dusk)
  day: number;

  // circulation economy
  food: number;
  goods: number;
  /** income multiplier from active supply-chain links (display + applied) */
  circulation: number;
  /** false only when there are residents and not enough food */
  townFed: boolean;
  marketPrices: Record<MarketResource, number>;

  // quests
  quests: Record<string, QuestProgress>;
  trackedQuest: string | null;

  // free-placement building & endless goals
  placing: PlacingState | null;
  goalIndex: number;

  // prestige & resident requests
  legacy: LegacyState;
  requests: ResidentRequest[];
  nextRequestIn: number;
  relationships: Record<string, number>;

  // live events, offline payout & harvest juice
  activeEvent: GameEvent | null;
  nextEventIn: number;
  welcomeBack: WelcomeBack | null;
  harvestPop: HarvestPop | null;
  combo: number;

  // strangers in town & town-wide fortunes
  merchant: MerchantState | null;
  nextMerchantIn: number;
  loan: LoanState | null;
  speculatorOffer: SpeculatorOffer | null;
  nextSpeculatorIn: number;
  fortune: FortuneState | null;
  nextFortuneIn: number;

  // interaction / ui
  panel: PanelId;
  dialogue: DialogueState | null;
  interactTarget: InteractTarget | null;
  selectedPlot: string | null;
  harvesting: { nodeId: string; progress: number } | null;
  moveTarget: { x: number; z: number } | null;
  teleportTarget: { x: number; z: number } | null;
  toasts: Toast[];
  muted: boolean;
  cameraZoom: number;

  // actions
  startGame: (fresh: boolean) => void;
  createCharacter: (appearance: PlayerAppearance) => void;
  backToMenu: () => void;
  setPlayerPos: (x: number, z: number, facing: number, moving: boolean, sprinting?: boolean) => void;
  spendSkill: (id: SkillId) => void;
  buyCivic: (id: CivicId) => void;
  setMoveTarget: (t: { x: number; z: number } | null) => void;
  setInteractTarget: (t: InteractTarget | null) => void;
  setPanel: (p: PanelId) => void;
  setSelectedPlot: (id: string | null) => void;
  setCameraZoom: (z: number) => void;
  toggleMute: () => void;
  addToast: (text: string, kind?: Toast['kind'], icon?: string) => void;

  tick: (dt: number) => void;
  beginHarvest: (nodeId: string) => void;
  cancelHarvest: () => void;
  interact: () => void;
  talkTo: (npcId: string) => void;
  advanceDialogue: () => void;
  acceptQuest: () => void;
  declineDialogue: () => void;
  trackQuest: (id: string) => void;
  startPlacing: (buildingId: BuildingId) => void;
  movePlacing: (x: number, z: number) => void;
  rotatePlacing: () => void;
  confirmPlacing: () => void;
  cancelPlacing: () => void;
  upgradePlot: (plotId: string) => void;
  demolishPlot: (plotId: string) => void;
  rotatePlot: (plotId: string) => void;
  sellResource: (type: MarketResource, amount: number) => void;
  buyResource: (type: Exclude<MarketResource, 'goods'>, amount: number) => void;
  buyProvision: (id: string) => void;
  collectEvent: () => void;
  collectWelcomeBack: () => void;
  inspectDeal: (dealId: number) => void;
  buyDeal: (dealId: number) => void;
  takeLoan: (tierIndex: number) => void;
  repayLoan: (amount: number) => void;
  acceptBuyout: () => void;
  declineBuyout: () => void;
  fulfillRequest: (id: number) => void;
  charterDistrict: () => void;
  unstuck: () => void;
  completeTeleport: () => void;
  save: () => void;
}

function initialQuests(): Record<string, QuestProgress> {
  const q: Record<string, QuestProgress> = {};
  for (const def of QUESTS) {
    q[def.id] = {
      status: def.requires ? 'locked' : 'available',
      progress: def.objectives.map(() => 0),
    };
  }
  return q;
}

function freshPlayerState() {
  return {
    appearance: DEFAULT_APPEARANCE,
    px: 0,
    pz: 6,
    facing: Math.PI,
    moving: false,
    bswx: 15,
    wood: 0,
    stone: 0,
    clay: 0,
    stamina: 100,
    staminaMax: 100,
    reputation: 0,
    level: 1,
    xp: 0,
    totalEarned: 0,
    sprinting: false,
    skillPoints: 0,
    skills: emptySkills(),
    civics: emptyCivics(),
    nodes: generateResourceNodes(),
    nodesVersion: 0,
    plots: [] as Plot[],
    goalIndex: 0,
    legacy: { tokens: 0, district: 1 } as LegacyState,
    requests: [] as ResidentRequest[],
    nextRequestIn: REQUEST_FIRST_GAP,
    relationships: {} as Record<string, number>,
    timeOfDay: 0.32,
    day: 1,
    food: 6,
    goods: 0,
    circulation: 1,
    townFed: true,
    marketPrices: { wood: 2, stone: 2.4, clay: 3, goods: 4 },
    quests: initialQuests(),
    trackedQuest: 'first_foundations' as string | null,
  };
}

// ---------------------------------------------------------------------------

export const useGame = create<GameState>((set, get) => {
  let economyTimer = 0;
  let saveTimer = 0;
  let staminaWarned = false;
  let windedWarned = false;
  let nightExplained = false;
  let hungerWarned = false;
  let comboTimer = 0;
  let eventId = 1;
  let popId = 1;
  let dealId = 1;
  let plotSeq = 1;
  let requestId = 1;
  let firstFortune = true;

  // ---- quest helpers (operate on draft-ish copies) ----

  function questCounts(quests: Record<string, QuestProgress>, id: string) {
    const def = QUEST_BY_ID[id];
    const prog = quests[id];
    const ready = def.objectives.every((o, i) => (prog.progress[i] ?? 0) >= o.amount);
    return ready;
  }

  /** Apply an event to all active quests; returns updated quests + toasts to fire. */
  function applyQuestEvent(
    kind: 'gather' | 'build' | 'earn' | 'talk' | 'upgrade',
    target: string | null,
    amount: number
  ) {
    const state = get();
    let changed = false;
    const quests = { ...state.quests };
    const newlyReady: string[] = [];

    for (const def of QUESTS) {
      const prog = quests[def.id];
      if (prog.status !== 'active') continue;
      let touched = false;
      const progress = [...prog.progress];
      def.objectives.forEach((o, i) => {
        if (o.kind !== kind) return;
        if (o.target && target && o.target !== target) return;
        if (o.target && !target) return;
        if (progress[i] >= o.amount) return;
        progress[i] = Math.min(o.amount, progress[i] + amount);
        touched = true;
      });
      if (touched) {
        quests[def.id] = { ...prog, progress };
        changed = true;
        if (questCounts(quests, def.id) && prog.status === 'active') {
          quests[def.id] = { ...quests[def.id], status: 'ready' };
          newlyReady.push(def.id);
        }
      }
    }

    // reputation objectives are checked against absolute value separately in tick
    if (changed) {
      set({ quests });
      for (const id of newlyReady) {
        get().addToast(`Quest ready to turn in: ${QUEST_BY_ID[id].title}`, 'quest', '!');
        audio.sfx('questReady');
      }
    }
  }

  function checkReputationObjectives() {
    const state = get();
    const quests = { ...state.quests };
    let changed = false;
    for (const def of QUESTS) {
      const prog = quests[def.id];
      if (prog.status !== 'active') continue;
      const progress = [...prog.progress];
      let touched = false;
      def.objectives.forEach((o, i) => {
        if (o.kind !== 'reputation') return;
        const v = Math.min(o.amount, state.reputation);
        if (v !== progress[i]) {
          progress[i] = v;
          touched = true;
        }
      });
      if (touched) {
        quests[def.id] = { ...prog, progress };
        changed = true;
        if (questCounts(quests, def.id)) {
          quests[def.id] = { ...quests[def.id], status: 'ready' };
          get().addToast(`Quest ready to turn in: ${QUEST_BY_ID[def.id].title}`, 'quest', '!');
          audio.sfx('questReady');
        }
      }
    }
    if (changed) set({ quests });
  }

  function grantXp(rawAmount: number) {
    const state = get();
    const amount = rawAmount * boonXpMult(state.quests) * civicXpMult(state.civics);
    let xp = state.xp + amount;
    let level = state.level;
    let staminaMax = state.staminaMax;
    let gained = 0;
    while (xp >= xpForLevel(level)) {
      xp -= xpForLevel(level);
      level += 1;
      staminaMax += 8;
      gained += 1;
    }
    set({
      xp,
      level,
      staminaMax,
      stamina: gained > 0 ? staminaMax : state.stamina,
      skillPoints: state.skillPoints + gained,
    });
    if (gained > 0) {
      get().addToast(
        `Level up! Now level ${level}. +${gained} skill point${gained > 1 ? 's' : ''} — spend it in Inventory (I).`,
        'reward',
        '★'
      );
      audio.playLevelUp();
    }
  }

  function earn(amount: number) {
    if (amount <= 0) return;
    const state = get();
    set({ bswx: state.bswx + amount, totalEarned: state.totalEarned + amount });
    applyQuestEvent('earn', null, amount);
  }

  return {
    phase: 'menu',
    hasSave: false,
    ...freshPlayerState(),
    placing: null,
    activeEvent: null,
    nextEventIn: EVENT_FIRST_GAP,
    welcomeBack: null,
    harvestPop: null,
    combo: 0,
    merchant: null,
    nextMerchantIn: MERCHANT_FIRST_GAP,
    loan: null,
    speculatorOffer: null,
    nextSpeculatorIn: SPECULATOR_FIRST_GAP,
    fortune: null,
    nextFortuneIn: FORTUNE_FIRST_GAP,
    panel: null,
    dialogue: null,
    interactTarget: null,
    selectedPlot: null,
    harvesting: null,
    moveTarget: null,
    teleportTarget: null,
    toasts: [],
    muted: false,
    cameraZoom: 1,

    startGame: (fresh) => {
      if (!fresh) {
        const loaded = loadSave();
        if (loaded) {
          set({
            ...loaded,
            phase: 'playing',
            panel: null,
            dialogue: null,
            harvesting: null,
            moveTarget: null,
            placing: null,
            activeEvent: null,
            nextEventIn: EVENT_FIRST_GAP,
            harvestPop: null,
            combo: 0,
            merchant: null,
            nextMerchantIn: MERCHANT_FIRST_GAP,
            speculatorOffer: null,
            nextSpeculatorIn: SPECULATOR_FIRST_GAP,
            fortune: null,
            nextFortuneIn: FORTUNE_FIRST_GAP,
            nextRequestIn: REQUEST_FIRST_GAP,
          });
          economyTimer = 0;
          comboTimer = 0;
          firstFortune = true;
          if (!loaded.welcomeBack) get().addToast('Welcome back to New Greenwood.', 'info');
          return;
        }
      }
      // new legacy: design your founder first
      set({ phase: 'create', panel: null, dialogue: null, harvesting: null, moveTarget: null });
    },

    createCharacter: (appearance) => {
      const calling = CALLING_BY_ID[appearance.calling];
      const fresh = freshPlayerState();
      const b = calling?.bonus ?? {};
      set({
        ...fresh,
        appearance,
        wood: fresh.wood + (b.wood ?? 0),
        stone: fresh.stone + (b.stone ?? 0),
        clay: fresh.clay + (b.clay ?? 0),
        bswx: fresh.bswx + (b.bswx ?? 0),
        staminaMax: fresh.staminaMax + (b.staminaMax ?? 0),
        stamina: fresh.staminaMax + (b.staminaMax ?? 0),
        reputation: fresh.reputation + (b.rep ?? 0),
        phase: 'playing',
        panel: null,
        dialogue: null,
        harvesting: null,
        moveTarget: null,
        placing: null,
        activeEvent: null,
        nextEventIn: EVENT_FIRST_GAP,
        welcomeBack: null,
        harvestPop: null,
        combo: 0,
        merchant: null,
        nextMerchantIn: MERCHANT_FIRST_GAP,
        loan: null,
        speculatorOffer: null,
        nextSpeculatorIn: SPECULATOR_FIRST_GAP,
        fortune: null,
        nextFortuneIn: FORTUNE_FIRST_GAP,
        toasts: [],
      });
      firstFortune = true;
      const first = appearance.name.split(' ')[0];
      get().addToast(`Welcome to Greenwood, ${first} the ${calling?.name ?? 'Builder'}.`, 'reward', '✦');
      get().addToast('Speak with O.W. Gurley at the plaza to begin.', 'quest', '!');
      get().save();
    },

    backToMenu: () => {
      // only persist real progress — saving from the creator would wipe an existing legacy
      if (get().phase === 'playing') get().save();
      set({ phase: 'menu', panel: null, dialogue: null, harvesting: null, moveTarget: null });
    },

    setPlayerPos: (px, pz, facing, moving, sprinting = false) =>
      set({ px, pz, facing, moving, sprinting: moving && sprinting }),
    setMoveTarget: (moveTarget) => set({ moveTarget }),

    spendSkill: (id) => {
      const s = get();
      if (s.skillPoints <= 0) return;
      const cur = s.skills[id] ?? 0;
      if (cur >= MAX_SKILL) return;
      const patch: Partial<GameState> = {
        skills: { ...s.skills, [id]: cur + 1 },
        skillPoints: s.skillPoints - 1,
      };
      // Vigor permanently raises (and tops up) your max stamina on the spot
      if (id === 'vigor') {
        const staminaMax = s.staminaMax + VIGOR_MAX_PER_PT;
        patch.staminaMax = staminaMax;
        patch.stamina = Math.min(staminaMax, s.stamina + VIGOR_MAX_PER_PT);
      }
      set(patch as never);
      audio.sfx('questAccept');
      get().addToast(`${id[0].toUpperCase()}${id.slice(1)} raised to ${cur + 1}.`, 'reward', '★');
      get().save();
    },

    buyCivic: (id) => {
      const s = get();
      const def = CIVICS.find((c) => c.id === id);
      if (!def) return;
      const lvl = s.civics[id] ?? 0;
      if (lvl >= def.maxLevel) return;
      const cost = civicCost(def, lvl);
      if (s.bswx < cost) {
        get().addToast('Not enough BSWX for that improvement.', 'warn', '!');
        audio.sfx('error');
        return;
      }
      set({ bswx: s.bswx - cost, civics: { ...s.civics, [id]: lvl + 1 } });
      audio.sfx('coin');
      audio.playLevelUp();
      get().addToast(`${def.name} improved to level ${lvl + 1}!`, 'reward', def.icon);
      get().save();
    },
    setInteractTarget: (interactTarget) => {
      const cur = get().interactTarget;
      if (cur?.id === interactTarget?.id && cur?.kind === interactTarget?.kind) return;
      set({ interactTarget });
    },
    unstuck: () => {
      set({ teleportTarget: { x: 0, z: 6 }, moveTarget: null, harvesting: null });
      get().addToast('Teleported back to the town square.', 'info', '🛟');
      get().save();
    },
    completeTeleport: () => {
      const target = get().teleportTarget;
      if (target) {
        set({
          px: target.x,
          pz: target.z,
          teleportTarget: null,
        });
      }
    },
    setPanel: (panel) => {
      audio.sfx('ui');
      set({ panel, selectedPlot: panel === 'build' ? get().selectedPlot : null });
    },
    setSelectedPlot: (selectedPlot) => set({ selectedPlot }),
    setCameraZoom: (cameraZoom) => set({ cameraZoom: Math.min(1.6, Math.max(0.55, cameraZoom)) }),
    toggleMute: () => {
      const muted = !get().muted;
      audio.setMuted(muted);
      set({ muted });
    },

    addToast: (text, kind = 'info', icon) => {
      const t: Toast = { id: toastId++, text, kind, icon };
      set({ toasts: [...get().toasts.slice(-4), t] });
      setTimeout(() => {
        set({ toasts: get().toasts.filter((x) => x.id !== t.id) });
      }, 4200);
    },

    // ------------------------------------------------------------------
    // main game tick (called from the R3F frame loop, throttled by caller)
    // ------------------------------------------------------------------
    tick: (dt) => {
      const state = get();
      if (state.phase !== 'playing') return;

      // time of day
      const wasNight = isNightTime(state.timeOfDay);
      let timeOfDay = state.timeOfDay + dt / DAY_LENGTH;
      let day = state.day;
      let dayRolled = false;
      if (timeOfDay >= 1) {
        timeOfDay -= 1;
        day += 1;
        dayRolled = true;
        get().addToast(`Day ${day} dawns over New Greenwood.`, 'info');
      }
      // first time dusk falls, explain what night changes
      if (isNightTime(timeOfDay) && !wasNight && !nightExplained) {
        nightExplained = true;
        get().addToast(
          'Night falls — daytime shops quiet down, but the hotel & Sugar Bowl come alive. Rest comes quicker after dark.',
          'info',
          '🌙'
        );
      }

      // stamina is a real resource — walking burns it, rest restores it (and
      // you recover faster at night). Run dry and you trudge until you rest.
      let stamina: number;
      if (state.moving) {
        const vigorEase = 1 - (state.skills.vigor ?? 0) * VIGOR_DRAIN_PER_PT;
        const drain = MOVE_DRAIN * vigorEase * (state.sprinting ? SPRINT_DRAIN_MULT : 1);
        stamina = Math.max(0, state.stamina - drain * dt);
      } else {
        const regen = IDLE_REGEN * (isNightTime(timeOfDay) ? NIGHT_REGEN_MULT : 1);
        stamina = Math.min(state.staminaMax, state.stamina + regen * dt);
      }
      if (stamina > 25) staminaWarned = false;
      if (stamina > 30) windedWarned = false;
      if (stamina <= 0 && !windedWarned) {
        windedWarned = true;
        get().addToast('You are winded — rest a moment or grab a bite to get your legs back.', 'warn', '😮‍💨');
      }

      // node regrowth
      let nodesVersion = state.nodesVersion;
      let nodes = state.nodes;
      let anyRegrow = false;
      for (const n of nodes) {
        if (n.regrow > 0) {
          anyRegrow = true;
          break;
        }
      }
      if (anyRegrow) {
        nodes = nodes.map((n) => {
          if (n.regrow <= 0) return n;
          const regrow = n.regrow - dt;
          if (regrow <= 0) return { ...n, regrow: 0, hp: n.maxHp };
          return { ...n, regrow };
        });
        nodesVersion++;
      }

      // construction progress
      let plots = state.plots;
      const finishing: Plot[] = [];
      if (plots.some((p) => p.construction > 0)) {
        plots = plots.map((p) => {
          if (p.construction <= 0) return p;
          const construction = Math.max(0, p.construction - dt);
          const np = { ...p, construction };
          if (construction === 0) finishing.push(np);
          return np;
        });
      }

      set({ timeOfDay, day, stamina, nodes, nodesVersion, plots });
      if (dayRolled) processLoanDay(day);

      for (const p of finishing) {
        const cfg = BUILDINGS[p.building!];
        get().addToast(`${cfg.name} is complete! +${cfg.repReward} reputation`, 'reward', '⚒');
        if (p.building === 'cottage') {
          get().addToast('A family moves into Greenwood. Population grows!', 'info', '👪');
        }
        if (p.building === 'grocery') {
          get().addToast('The market stalls open — press T to trade resources.', 'quest', '⚖');
        }
        set({ reputation: get().reputation + cfg.repReward });
        grantXp(cfg.xpReward);
        audio.sfx('complete');
        applyQuestEvent('build', p.building!, 1);
        checkReputationObjectives();
      }

      // harvesting progress
      const h = state.harvesting;
      if (h) {
        const node = state.nodes.find((n) => n.id === h.nodeId);
        if (!node || node.hp <= 0) {
          set({ harvesting: null });
        } else {
          const effTime = HARVEST_TIME * (1 - (state.skills.labor ?? 0) * LABOR_TIME_PER_PT);
          const progress = h.progress + dt / effTime;
          if (progress >= 1) {
            finishHarvest(node);
          } else {
            set({ harvesting: { nodeId: h.nodeId, progress } });
          }
        }
      }

      // ------------------------------------------------------------------
      // economy tick — the circulation model. A dollar that passes through
      // more Greenwood hands is worth more: every active supply-chain link
      // (grow → feed → sell → craft → trade → employ) raises the multiplier.
      // ------------------------------------------------------------------
      economyTimer += dt;
      if (economyTimer >= ECONOMY_TICK) {
        economyTimer = 0;
        const s = get();
        const levelOf = (id: BuildingId) =>
          s.plots.reduce((sum, p) => (p.building === id && p.construction === 0 ? sum + p.level : sum), 0);

        const residents = deriveResidents(s.plots);
        const { population, employed, employedRatio } = employmentStats(residents);
        const fortune = s.fortune;
        const legacyMult = legacyMultiplier(s.legacy);

        // 1) gardens grow food in daylight (a blight or nightfall stops them)
        const daytime = !isNightTime(s.timeOfDay);
        let food = Math.min(
          FOOD_CAP,
          s.food + (fortune?.foodOff || !daytime ? 0 : levelOf('garden')) + civicFoodBonus(s.civics)
        );

        // 2) families eat — a fed town prospers, a hungry one falters
        const need = population * FOOD_PER_RESIDENT;
        const townFed = population === 0 || food >= need;
        if (population > 0 && townFed) food -= need;

        // 3) the grocery sells surplus food (always keeps a pantry)
        const foodSold = Math.min(Math.max(0, Math.floor(food - PANTRY_BUFFER)), 2 * levelOf('grocery'));
        food -= foodSold;

        // 4) the workshop crafts goods from spare lumber
        let wood = s.wood;
        let goods = s.goods;
        const crafted = Math.min(levelOf('workshop'), Math.max(0, wood - WOOD_RESERVE), GOODS_CAP - goods);
        wood -= crafted;
        goods += crafted;

        // 5) commerce moves goods (sugar bowl, hotel, cultural hall)
        const goodsSold = Math.min(goods, levelOf('sugarbowl') + levelOf('hotel') + levelOf('cultural_hall'));
        goods -= goodsSold;

        // 6) circulation multiplier from active links
        const links =
          (levelOf('garden') > 0 ? 1 : 0) +
          (population > 0 && townFed ? 1 : 0) +
          (foodSold > 0 ? 1 : 0) +
          (crafted > 0 ? 1 : 0) +
          (goodsSold > 0 ? 1 : 0) +
          (employed > 0 ? 1 : 0);
        const circulation = Math.round((1 + links * 0.05 + employedRatio * 0.15) * 100) / 100;

        const cottages = s.plots.filter((p) => p.building === 'cottage' && p.construction === 0).length;
        const gardens = s.plots.filter((p) => p.building === 'garden' && p.construction === 0).length;
        const mult =
          (1 + cottages * COTTAGE_INCOME_BONUS + gardens * GARDEN_INCOME_BONUS) *
          circulation *
          (population > 0 && !townFed ? 0.8 : 1);

        let income = 0;
        for (const p of s.plots) {
          if (!p.building || p.construction > 0) continue;
          income +=
            BUILDINGS[p.building].income *
            p.level *
            incomeTimeFactor(p.building, s.timeOfDay) *
            adjacencyInfo(p.building, p.x, p.z, s.plots, p.id).mult;
        }
        income += foodSold * FOOD_PRICE + goodsSold * GOODS_PRICE;
        income = Math.round(
          income *
            mult *
            (fortune?.incomeMult ?? 1) *
            legacyMult *
            INCOME_SCALE *
            boonIncomeMult(s.quests) *
            civicIncomeMult(s.civics) *
            (isNightTime(s.timeOfDay) ? civicNightMult(s.civics) : 1)
        );

        // market prices drift like a real exchange
        const drift = (v: number, lo: number, hi: number) =>
          Math.round(Math.min(hi, Math.max(lo, v + (Math.random() - 0.5) * 0.36)) * 10) / 10;
        const marketPrices = {
          wood: drift(s.marketPrices.wood, 1, 3.2),
          stone: drift(s.marketPrices.stone, 1.2, 3.6),
          clay: drift(s.marketPrices.clay, 1.5, 4.5),
          goods: drift(s.marketPrices.goods, 2.5, 5.5),
        };

        set({ food: Math.round(food * 10) / 10, goods, wood, circulation, townFed, marketPrices });
        if (population > 0 && !townFed && !hungerWarned) {
          hungerWarned = true;
          get().addToast('Greenwood is hungry! Build or upgrade gardens to feed your residents.', 'warn', '🥖');
        }
        if (townFed) hungerWarned = false;
        if (income > 0) {
          earn(income);
          audio.sfx('coin');
        }
        if (fortune?.repPerTick) {
          set({ reputation: get().reputation + fortune.repPerTick });
          checkReputationObjectives();
        }
        checkGoals();
      }

      // ------------------------------------------------------------------
      // live events — short, tappable windfalls that reward being active
      // ------------------------------------------------------------------
      if (state.activeEvent) {
        const timeLeft = state.activeEvent.timeLeft - dt;
        if (timeLeft <= 0) {
          set({ activeEvent: null, nextEventIn: rand(EVENT_MIN_GAP, EVENT_MAX_GAP) });
          get().addToast('The moment passed — keep an eye out for the next one.', 'info', '⌛');
        } else {
          set({ activeEvent: { ...state.activeEvent, timeLeft } });
        }
      } else {
        const nextEventIn = state.nextEventIn - dt;
        if (nextEventIn <= 0) spawnEvent();
        else set({ nextEventIn });
      }

      // ------------------------------------------------------------------
      // strangers in town — the traveling merchant & the speculator
      // ------------------------------------------------------------------
      if (state.merchant) {
        const timeLeft = state.merchant.timeLeft - dt;
        if (timeLeft <= 0) {
          set({ merchant: null, nextMerchantIn: rand(MERCHANT_MIN_GAP, MERCHANT_MAX_GAP) });
          if (get().panel === 'merchant') set({ panel: null });
          get().addToast('The traveling merchant packs up and moves on.', 'info', '🧳');
        } else {
          set({ merchant: { ...state.merchant, timeLeft } });
        }
      } else {
        const nextMerchantIn = state.nextMerchantIn - dt;
        if (nextMerchantIn <= 0) spawnMerchant();
        else set({ nextMerchantIn });
      }

      if (state.speculatorOffer) {
        const timeLeft = state.speculatorOffer.timeLeft - dt;
        if (timeLeft <= 0) {
          set({ speculatorOffer: null, nextSpeculatorIn: rand(SPECULATOR_MIN_GAP, SPECULATOR_MAX_GAP) });
          if (get().panel === 'speculator') set({ panel: null });
          get().addToast('The speculator withdraws his offer — for now.', 'info', '🎩');
        } else {
          set({ speculatorOffer: { ...state.speculatorOffer, timeLeft } });
        }
      } else {
        const nextSpeculatorIn = state.nextSpeculatorIn - dt;
        if (nextSpeculatorIn <= 0) spawnSpeculatorOffer();
        else set({ nextSpeculatorIn });
      }

      // ------------------------------------------------------------------
      // town-wide fortunes — festivals, booms, panics, blights
      // ------------------------------------------------------------------
      if (state.fortune) {
        const timeLeft = state.fortune.timeLeft - dt;
        if (timeLeft <= 0) {
          set({ fortune: null, nextFortuneIn: rand(FORTUNE_MIN_GAP, FORTUNE_MAX_GAP) });
          get().addToast(`${state.fortune.label} has passed.`, 'info', state.fortune.icon);
        } else {
          set({ fortune: { ...state.fortune, timeLeft } });
        }
      } else {
        const nextFortuneIn = state.nextFortuneIn - dt;
        if (nextFortuneIn <= 0) rollFortune();
        else set({ nextFortuneIn });
      }

      // residents post requests to the community board
      {
        const nextRequestIn = state.nextRequestIn - dt;
        if (nextRequestIn <= 0) spawnRequest();
        else set({ nextRequestIn });
      }

      // harvest combo decays when you stop swinging
      if (comboTimer > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0 && get().combo !== 0) set({ combo: 0 });
      }

      // autosave
      saveTimer += dt;
      if (saveTimer >= 12) {
        saveTimer = 0;
        get().save();
      }

      function finishHarvest(node: ResourceNode) {
        const s = get();
        const [lo, hi] = HARVEST_YIELD[node.type];
        // +1 yield every 2 levels, plus each point invested in Labor
        const bonus = Math.floor((s.level - 1) / 2) + (s.skills.labor ?? 0);

        // sustained harvesting builds a combo, raising the chance of a crit
        const combo = Math.min(COMBO_MAX, s.combo + 1);
        const critChance = Math.min(CRIT_MAX, CRIT_BASE + combo * CRIT_PER_COMBO);
        const crit = Math.random() < critChance;
        let amount = lo + Math.floor(Math.random() * (hi - lo + 1)) + bonus;
        if (crit) amount = Math.round(amount * CRIT_MULT);

        const hp = node.hp - 1;
        const nodes = s.nodes.map((n) =>
          n.id === node.id ? { ...n, hp, regrow: hp <= 0 ? NODE_REGROW : 0 } : n
        );
        const patch: Partial<GameState> = {
          nodes,
          nodesVersion: s.nodesVersion + 1,
          combo,
          harvestPop: { id: popId++, amount, type: node.type, crit, combo },
          harvesting: hp > 0 && s.stamina >= HARVEST_STAMINA ? { nodeId: node.id, progress: 0 } : null,
        };
        patch[node.type] = (s[node.type] as number) + amount;
        set(patch as never);
        comboTimer = COMBO_WINDOW;
        audio.sfx(node.type === 'wood' ? 'chop' : node.type === 'stone' ? 'mine' : 'dig');
        if (crit) audio.sfx('crit');
        grantXp(crit ? 8 : 4);
        applyQuestEvent('gather', node.type, amount);
        get().addToast(
          crit ? `RICH VEIN! +${amount} ${RESOURCE_LABEL[node.type]}` : `+${amount} ${RESOURCE_LABEL[node.type]}`,
          'reward',
          crit ? '✦' : '+'
        );
        // continue harvesting costs stamina up-front
        if (patch.harvesting) {
          set({ stamina: get().stamina - HARVEST_STAMINA });
        }
      }
    },

    beginHarvest: (nodeId) => {
      const state = get();
      if (state.harvesting?.nodeId === nodeId) return;
      const node = state.nodes.find((n) => n.id === nodeId);
      if (!node || node.hp <= 0) return;
      if (state.stamina < HARVEST_STAMINA) {
        if (!staminaWarned) {
          staminaWarned = true;
          get().addToast('Too exhausted! Rest a moment to recover stamina.', 'warn', '!');
        }
        return;
      }
      set({ harvesting: { nodeId, progress: 0 }, stamina: state.stamina - HARVEST_STAMINA, moveTarget: null });
    },

    cancelHarvest: () => {
      if (get().harvesting) set({ harvesting: null });
    },

    // E-key / tap interaction with current target
    interact: () => {
      const state = get();
      if (state.dialogue) {
        get().advanceDialogue();
        return;
      }
      const t = state.interactTarget;
      if (!t) return;
      if (t.kind === 'node') {
        get().beginHarvest(t.id);
      } else if (t.kind === 'npc') {
        get().talkTo(t.id);
      } else if (t.kind === 'plot') {
        audio.sfx('ui');
        set({ selectedPlot: t.id, panel: 'build' });
      } else if (t.kind === 'building') {
        audio.sfx('ui');
        set({ selectedPlot: t.id, panel: 'build' });
      } else if (t.kind === 'event') {
        get().collectEvent();
      } else if (t.kind === 'merchant') {
        audio.sfx('ui');
        set({ panel: 'merchant' });
      } else if (t.kind === 'lender') {
        audio.sfx('ui');
        set({ panel: 'loan' });
      } else if (t.kind === 'speculator') {
        audio.sfx('ui');
        set({ panel: 'speculator' });
      } else if (t.kind === 'board') {
        audio.sfx('ui');
        set({ panel: 'board' });
      }
    },

    talkTo: (npcId) => {
      const state = get();
      const npc = NPC_BY_ID[npcId];
      if (npc && !npcOpen(npc, state.timeOfDay)) {
        audio.sfx('error');
        get().addToast(`${npc.name} is off the clock. Find them at their post (${npcHoursLabel(npc)}).`, 'warn', '🌙');
        return;
      }
      audio.sfx('talk');
      applyQuestEvent('talk', npcId, 1);

      // 1) quest ready to turn in to this npc?
      for (const def of QUESTS) {
        if (def.giver !== npcId) continue;
        if (get().quests[def.id].status === 'ready') {
          set({
            dialogue: { npcId, lines: def.outro, index: 0, questId: def.id, mode: 'turnin' },
            panel: 'dialogue',
            moveTarget: null,
            harvesting: null,
          });
          return;
        }
      }
      // 2) quest available from this npc?
      for (const def of QUESTS) {
        if (def.giver !== npcId) continue;
        if (get().quests[def.id].status === 'available') {
          set({
            dialogue: { npcId, lines: def.intro, index: 0, questId: def.id, mode: 'offer' },
            panel: 'dialogue',
            moveTarget: null,
            harvesting: null,
          });
          return;
        }
      }
      // 3) gossip
      void state;
      set({
        dialogue: { npcId, lines: [getGossip(npcId)], index: 0, mode: 'gossip' },
        panel: 'dialogue',
        moveTarget: null,
        harvesting: null,
      });
    },

    advanceDialogue: () => {
      const state = get();
      const d = state.dialogue;
      if (!d) return;
      audio.sfx('ui');
      if (d.index < d.lines.length - 1) {
        set({ dialogue: { ...d, index: d.index + 1 } });
        return;
      }
      // dialogue finished
      if (d.mode === 'offer' && d.questId) {
        get().acceptQuest();
        return;
      }
      if (d.mode === 'turnin' && d.questId) {
        completeQuest(d.questId);
      }
      set({ dialogue: null, panel: null });
    },

    acceptQuest: () => {
      const state = get();
      const d = state.dialogue;
      if (!d?.questId) {
        set({ dialogue: null, panel: null });
        return;
      }
      const quests = { ...state.quests };
      quests[d.questId] = { ...quests[d.questId], status: 'active' };
      set({ quests, dialogue: null, panel: null, trackedQuest: d.questId });
      get().addToast(`Quest accepted: ${QUEST_BY_ID[d.questId].title}`, 'quest', '◆');
      audio.sfx('questAccept');
      checkReputationObjectives();
    },

    declineDialogue: () => {
      set({ dialogue: null, panel: null });
    },

    trackQuest: (id) => set({ trackedQuest: id }),

    startPlacing: (buildingId) => {
      const s = get();
      const cfg = BUILDINGS[buildingId];
      if (!cfg) return;
      if (s.quests['first_foundations']?.status !== 'done') {
        get().addToast('Complete First Foundations before you can build.', 'warn', '!');
        return;
      }
      // start the ghost a few cells in front of the player
      const x = snapToGrid(s.px);
      const z = snapToGrid(s.pz - 8);
      const valid = canBuildAt(x, z, s.nodes, s.plots);
      audio.sfx('ui');
      set({ placing: { buildingId, x, z, rot: 0, valid }, panel: null, selectedPlot: null, moveTarget: null });
      get().addToast('Aim with the mouse, R to rotate, then Place.', 'info', '⚒');
    },

    movePlacing: (rawX, rawZ) => {
      const s = get();
      if (!s.placing) return;
      const x = snapToGrid(rawX);
      const z = snapToGrid(rawZ);
      if (x === s.placing.x && z === s.placing.z) return;
      const valid = canBuildAt(x, z, s.nodes, s.plots);
      set({ placing: { ...s.placing, x, z, valid } });
    },

    rotatePlacing: () => {
      const s = get();
      if (!s.placing) return;
      audio.sfx('ui');
      set({ placing: { ...s.placing, rot: (s.placing.rot + Math.PI / 2) % (Math.PI * 2) } });
    },

    cancelPlacing: () => {
      if (get().placing) {
        audio.sfx('ui');
        set({ placing: null });
      }
    },

    confirmPlacing: () => {
      const s = get();
      const pl = s.placing;
      if (!pl) return;
      const cfg = BUILDINGS[pl.buildingId];
      if (!canBuildAt(pl.x, pl.z, s.nodes, s.plots)) {
        get().addToast('Can’t build there — find open ground away from the water.', 'warn', '!');
        audio.sfx('error');
        return;
      }
      const c = cfg.cost;
      if (s.wood < c.wood || s.stone < c.stone || s.clay < (c.clay ?? 0) || s.bswx < (c.bswx ?? 0)) {
        get().addToast('Not enough resources for that.', 'warn', '!');
        audio.sfx('error');
        return;
      }
      const plot: Plot = {
        id: `b${plotSeq++}_${pl.x}_${pl.z}`,
        x: pl.x,
        z: pl.z,
        building: pl.buildingId,
        level: 1,
        construction: Math.max(1, Math.round(6 * boonBuildFactor(s.quests))),
        rot: pl.rot,
      };
      set({
        plots: [...s.plots, plot],
        wood: s.wood - c.wood,
        stone: s.stone - c.stone,
        clay: s.clay - (c.clay ?? 0),
        bswx: s.bswx - (c.bswx ?? 0),
        placing: null,
      });
      audio.sfx('build');
      get().addToast(`Construction started: ${cfg.name}`, 'info', '⚒');
    },

    demolishPlot: (plotId) => {
      const s = get();
      const plot = s.plots.find((p) => p.id === plotId);
      if (!plot?.building) return;
      const cfg = BUILDINGS[plot.building];
      const refundWood = Math.round(cfg.cost.wood * 0.4 * plot.level);
      const refundStone = Math.round(cfg.cost.stone * 0.4 * plot.level);
      const refundClay = Math.round((cfg.cost.clay ?? 0) * 0.4 * plot.level);
      set({
        plots: s.plots.filter((p) => p.id !== plotId),
        wood: s.wood + refundWood,
        stone: s.stone + refundStone,
        clay: s.clay + refundClay,
        panel: null,
        selectedPlot: null,
      });
      audio.sfx('build');
      get().addToast(`Demolished ${cfg.name} — salvaged some materials.`, 'info', '⚒');
    },

    rotatePlot: (plotId) => {
      const s = get();
      const plot = s.plots.find((p) => p.id === plotId);
      if (!plot?.building) return;
      const plots = s.plots.map((p) =>
        p.id === plotId ? { ...p, rot: (p.rot + Math.PI / 2) % (Math.PI * 2) } : p
      );
      set({ plots });
      audio.sfx('ui');
      get().save();
    },

    upgradePlot: (plotId) => {
      const state = get();
      const plot = state.plots.find((p) => p.id === plotId);
      if (!plot?.building || plot.construction > 0 || plot.level >= MAX_BUILDING_LEVEL) return;
      const cfg = BUILDINGS[plot.building];
      const mult = Math.pow(UPGRADE_COST_MULT, plot.level);
      const cost = {
        wood: Math.round(cfg.cost.wood * mult),
        stone: Math.round(cfg.cost.stone * mult),
        clay: Math.round((cfg.cost.clay ?? 0) * mult),
        bswx: Math.round((cfg.cost.bswx ?? 0) * mult),
      };
      if (state.wood < cost.wood || state.stone < cost.stone || state.clay < cost.clay || state.bswx < cost.bswx) {
        get().addToast('Not enough resources to upgrade.', 'warn', '!');
        return;
      }
      const plots = state.plots.map((p) =>
        p.id === plotId
          ? { ...p, level: p.level + 1, construction: Math.max(1, Math.round(4 * boonBuildFactor(state.quests))) }
          : p
      );
      set({
        plots,
        wood: state.wood - cost.wood,
        stone: state.stone - cost.stone,
        clay: state.clay - cost.clay,
        bswx: state.bswx - cost.bswx,
      });
      audio.sfx('build');
      get().addToast(`Upgrading ${cfg.name} to level ${plot.level + 1}...`, 'info', '⚒');
      applyQuestEvent('upgrade', null, 1);
    },

    sellResource: (type, amount) => {
      const s = get();
      const have = type === 'goods' ? s.goods : s[type];
      const qty = Math.min(amount, Math.floor(have));
      if (qty <= 0) return;
      const sellMult = (1 + (s.skills.haggle ?? 0) * HAGGLE_SELL_PER_PT) * boonMarketMult(s.quests);
      const gain = Math.max(1, Math.floor(s.marketPrices[type] * qty * sellMult));
      set({ [type]: have - qty } as never);
      earn(gain);
      audio.sfx('coin');
      get().addToast(`Sold ${qty} ${RESOURCE_LABEL[type]} for ◆${gain}`, 'reward', '⚖');
    },

    buyResource: (type, amount) => {
      const s = get();
      const buyDiscount = 1 - (s.skills.haggle ?? 0) * HAGGLE_BUY_PER_PT;
      const cost = Math.ceil(s.marketPrices[type] * MARKET_SPREAD * amount * buyDiscount);
      if (s.bswx < cost) {
        get().addToast('Not enough BSWX for that purchase.', 'warn', '!');
        return;
      }
      set({ bswx: s.bswx - cost, [type]: s[type] + amount } as never);
      audio.sfx('coin');
      get().addToast(`Bought ${amount} ${RESOURCE_LABEL[type]} for ◆${cost}`, 'info', '⚖');
    },

    buyProvision: (id) => {
      const s = get();
      const def = PROVISIONS.find((p) => p.id === id);
      if (!def) return;
      if (def.requires && !s.plots.some((p) => p.building === def.requires && p.construction === 0)) {
        get().addToast('That provision is not for sale yet.', 'warn', '!');
        return;
      }
      if (s.stamina >= s.staminaMax) {
        get().addToast('You are already at full stamina.', 'info');
        return;
      }
      if (s.bswx < def.cost) {
        get().addToast('Not enough BSWX for that.', 'warn', '!');
        audio.sfx('error');
        return;
      }
      const stamina = Math.min(s.staminaMax, s.stamina + def.stamina);
      set({ bswx: s.bswx - def.cost, stamina });
      staminaWarned = false;
      audio.sfx('coin');
      get().addToast(`Ate ${def.name}. +${Math.round(stamina - s.stamina)} stamina!`, 'reward', def.icon);
    },

    collectEvent: () => {
      const s = get();
      const ev = s.activeEvent;
      if (!ev) return;
      set({ activeEvent: null, nextEventIn: rand(EVENT_MIN_GAP, EVENT_MAX_GAP) });
      if (ev.kind === 'rush') {
        const perTick = passiveIncomePerTick(
          s.plots,
          s.circulation,
          legacyMultiplier(s.legacy) * boonIncomeMult(s.quests) * civicIncomeMult(s.civics)
        );
        const reward = Math.max(RUSH_MIN, Math.round(perTick * RUSH_TICK_VALUE * rand(0.8, 1.4)));
        earn(reward);
        audio.sfx('coin');
        audio.sfx('crit');
        get().addToast(`Market rush! The crowd spends ◆${reward}.`, 'reward', '⚡');
      } else {
        const type = ev.resource ?? 'wood';
        const amount = 8 + Math.floor(Math.random() * 7) + Math.floor((s.level - 1) / 2);
        set({ [type]: (s[type] as number) + amount } as never);
        audio.sfx(type === 'wood' ? 'chop' : type === 'stone' ? 'mine' : 'dig');
        audio.sfx('crit');
        applyQuestEvent('gather', type, amount);
        get().addToast(`Rich find! +${amount} ${RESOURCE_LABEL[type]}`, 'reward', '✨');
      }
      grantXp(12);
    },

    collectWelcomeBack: () => {
      const wb = get().welcomeBack;
      if (!wb) return;
      set({ welcomeBack: null });
      if (wb.bswx > 0) {
        earn(wb.bswx);
        audio.sfx('coin');
        audio.playLevelUp();
        get().addToast(`Collected ◆${wb.bswx} earned while you were away.`, 'reward', '◆');
      }
    },

    // ---- traveling merchant ----
    inspectDeal: (dealId) => {
      const m = get().merchant;
      if (!m || m.inspectsLeft <= 0) return;
      const deals = m.deals.map((d) => (d.id === dealId ? { ...d, mystery: false } : d));
      set({ merchant: { ...m, deals, inspectsLeft: m.inspectsLeft - 1 } });
      audio.sfx('ui');
    },

    buyDeal: (dealId) => {
      const s = get();
      const m = s.merchant;
      if (!m) return;
      const deal = m.deals.find((d) => d.id === dealId);
      if (!deal || deal.sold) return;
      if (s.bswx < deal.cost) {
        get().addToast('Not enough BSWX for that.', 'warn', '!');
        audio.sfx('error');
        return;
      }
      const r = deal.reward;
      const patch: Partial<GameState> = {
        bswx: s.bswx - deal.cost + (r.bswx ?? 0),
        wood: s.wood + (r.wood ?? 0),
        stone: s.stone + (r.stone ?? 0),
        clay: s.clay + (r.clay ?? 0),
        goods: s.goods + (r.goods ?? 0),
      };
      if (r.stamina) patch.stamina = Math.min(s.staminaMax, s.stamina + r.stamina);
      const trust = Math.max(
        -3,
        Math.min(3, m.trust + (deal.quality === 'ripoff' ? -1 : deal.quality === 'steal' ? 1 : 0))
      );
      const deals = m.deals.map((d) => (d.id === dealId ? { ...d, sold: true, mystery: false } : d));
      patch.merchant = { ...m, deals, trust };
      set(patch as never);
      (['wood', 'stone', 'clay'] as const).forEach((k) => {
        if (r[k]) applyQuestEvent('gather', k, r[k]!);
      });
      audio.sfx(deal.quality === 'ripoff' ? 'error' : 'coin');
      const msg =
        deal.quality === 'ripoff'
          ? 'Snake oil! That crate was all straw and lies.'
          : deal.quality === 'steal'
            ? `A steal! You got ${deal.label}.`
            : `Fair trade: ${deal.label}.`;
      get().addToast(msg, deal.quality === 'ripoff' ? 'warn' : 'reward', deal.quality === 'ripoff' ? '🐍' : '🛒');
    },

    // ---- loan shark ----
    takeLoan: (tierIndex) => {
      const s = get();
      if (s.loan) {
        get().addToast('Settle your current debt before borrowing more.', 'warn', '!');
        return;
      }
      const tier = LOAN_TIERS[tierIndex];
      if (!tier) return;
      const owed = Math.round(tier.principal * (1 + tier.rate));
      set({
        bswx: s.bswx + tier.principal,
        loan: { principal: tier.principal, owed, dueDay: s.day + tier.days, overdue: false },
        panel: null,
      });
      audio.sfx('coin');
      get().addToast(`Borrowed ◆${tier.principal}. You owe ◆${owed} by day ${s.day + tier.days}.`, 'warn', '🪙');
      get().save();
    },

    repayLoan: (amount) => {
      const s = get();
      const loan = s.loan;
      if (!loan) return;
      const pay = Math.min(amount, loan.owed, Math.floor(s.bswx));
      if (pay <= 0) {
        get().addToast('Not enough BSWX to repay that.', 'warn', '!');
        audio.sfx('error');
        return;
      }
      const owed = loan.owed - pay;
      audio.sfx('coin');
      if (owed <= 0) {
        set({ bswx: s.bswx - pay, loan: null, reputation: s.reputation + 4 });
        get().addToast('Debt cleared — and you kept your good name. (+4 rep)', 'reward', '✓');
        checkReputationObjectives();
      } else {
        set({ bswx: s.bswx - pay, loan: { ...loan, owed } });
        get().addToast(`Repaid ◆${pay}. ◆${owed} still owed.`, 'info', '🪙');
      }
      get().save();
    },

    // ---- speculator buyout ----
    acceptBuyout: () => {
      const s = get();
      const offer = s.speculatorOffer;
      if (!offer) return;
      const plot = s.plots.find((p) => p.id === offer.plotId);
      if (!plot?.building) {
        set({ speculatorOffer: null, panel: null });
        return;
      }
      const plots = s.plots.map((p) =>
        p.id === offer.plotId ? { ...p, building: null, level: 0, construction: 0 } : p
      );
      set({
        plots,
        bswx: s.bswx + offer.amount,
        totalEarned: s.totalEarned + offer.amount,
        reputation: Math.max(0, s.reputation - 8),
        speculatorOffer: null,
        nextSpeculatorIn: rand(SPECULATOR_MIN_GAP, SPECULATOR_MAX_GAP),
        panel: null,
      });
      audio.sfx('coin');
      get().addToast(`You sold the ${offer.buildingName} for ◆${offer.amount}. The block feels emptier. (−8 rep)`, 'warn', '🎩');
      get().save();
    },

    declineBuyout: () => {
      const s = get();
      if (!s.speculatorOffer) {
        set({ panel: null });
        return;
      }
      set({
        speculatorOffer: null,
        nextSpeculatorIn: rand(SPECULATOR_MIN_GAP, SPECULATOR_MAX_GAP),
        reputation: s.reputation + 3,
        panel: null,
      });
      audio.sfx('questAccept');
      get().addToast("You hold your ground. Greenwood stays in Greenwood's hands. (+3 rep)", 'reward', '✊');
      checkReputationObjectives();
    },

    // ---- community board: resident requests ----
    fulfillRequest: (id) => {
      const s = get();
      const req = s.requests.find((r) => r.id === id);
      if (!req) return;
      const have = req.kind === 'bswx' ? s.bswx : (s[req.kind] as number);
      if (have < req.amount) {
        const what = req.kind === 'bswx' ? 'BSWX' : RESOURCE_LABEL[req.kind];
        get().addToast(`You need ${req.amount} ${what} to help with that.`, 'warn', '!');
        audio.sfx('error');
        return;
      }
      const rel = (s.relationships[req.residentId] ?? 0) + 1;
      const patch: Partial<GameState> = {
        requests: s.requests.filter((r) => r.id !== id),
        relationships: { ...s.relationships, [req.residentId]: rel },
        reputation: s.reputation + req.rewardRep,
      };
      (patch as Record<string, number>)[req.kind] = have - req.amount;
      set(patch as never);
      earn(req.rewardBswx);
      audio.sfx('coin');
      get().addToast(`${req.residentName} thanks you! +◆${req.rewardBswx}, +${req.rewardRep} rep`, 'reward', '💛');
      if (rel === 3 || rel === 5) {
        const bonus = rel * 15;
        earn(bonus);
        get().addToast(
          `${req.residentName} is now a ${rel >= 5 ? 'dear friend' : 'good friend'}! Gift: ◆${bonus}`,
          'reward',
          '💞'
        );
      }
      checkReputationObjectives();
    },

    // ---- prestige: charter a new district ----
    charterDistrict: () => {
      const s = get();
      if (s.quests['legacy_restored']?.status !== 'done') {
        get().addToast('Complete the founding story before chartering a new district.', 'warn', '!');
        return;
      }
      const tokens = computeCharterTokens(s);
      const fresh = freshPlayerState();
      set({
        ...fresh,
        appearance: s.appearance,
        legacy: { tokens: s.legacy.tokens + tokens, district: s.legacy.district + 1 },
        quests: s.quests, // the story stays told — you are a seasoned founder
        placing: null,
        activeEvent: null,
        nextEventIn: EVENT_FIRST_GAP,
        welcomeBack: null,
        harvestPop: null,
        combo: 0,
        merchant: null,
        nextMerchantIn: MERCHANT_FIRST_GAP,
        loan: null,
        speculatorOffer: null,
        nextSpeculatorIn: SPECULATOR_FIRST_GAP,
        fortune: null,
        nextFortuneIn: FORTUNE_FIRST_GAP,
        nextRequestIn: REQUEST_FIRST_GAP,
        panel: null,
        dialogue: null,
        harvesting: null,
        moveTarget: null,
      });
      economyTimer = 0;
      comboTimer = 0;
      firstFortune = true;
      audio.playLevelUp();
      get().addToast(
        `Chartered District ${s.legacy.district + 1}! +${tokens} Legacy ✦ — permanent +${Math.round(tokens * LEGACY_PER_TOKEN * 100)}% income.`,
        'reward',
        '🏙'
      );
      get().addToast('A fresh district rises. Your legacy carries forward.', 'quest', '✦');
      get().save();
    },

    save: () => {
      try {
        const s = get();
        const data = {
          v: 1,
          appearance: s.appearance,
          px: s.px, pz: s.pz,
          bswx: s.bswx, wood: s.wood, stone: s.stone, clay: s.clay,
          food: s.food, goods: s.goods, marketPrices: s.marketPrices, circulation: s.circulation,
          stamina: s.stamina, staminaMax: s.staminaMax,
          reputation: s.reputation, level: s.level, xp: s.xp, totalEarned: s.totalEarned,
          skillPoints: s.skillPoints, skills: s.skills, civics: s.civics,
          timeOfDay: s.timeOfDay, day: s.day,
          quests: s.quests, trackedQuest: s.trackedQuest,
          plots: s.plots,
          goalIndex: s.goalIndex,
          legacy: s.legacy,
          requests: s.requests,
          relationships: s.relationships,
          nodes: s.nodes.map((n) => ({ id: n.id, hp: n.hp, regrow: Math.round(n.regrow) })),
          loan: s.loan,
          lastSeen: Date.now(),
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        set({ hasSave: true });
      } catch {
        // storage unavailable — ignore
      }
    },
  };

  // ---- local helpers needing closure over set/get ----

  function completeQuest(id: string) {
    const state = get();
    const def = QUEST_BY_ID[id];
    const quests = { ...state.quests };
    quests[id] = { ...quests[id], status: 'done' as QuestStatus };

    // unlock dependents
    for (const q of QUESTS) {
      if (q.requires === id && quests[q.id].status === 'locked') {
        quests[q.id] = { ...quests[q.id], status: 'available' };
      }
    }

    // a founder arrives in town when the quest that reveals them is completed
    for (const npc of NPCS) {
      if (npc.reveal === id) {
        get().addToast(`${npc.name} has arrived in New Greenwood — seek them out.`, 'quest', '✦');
      }
    }

    const r = def.rewards;
    const patch: Partial<GameState> = {
      quests,
      wood: state.wood + (r.wood ?? 0),
      stone: state.stone + (r.stone ?? 0),
      clay: state.clay + (r.clay ?? 0),
      reputation: state.reputation + (r.rep ?? 0),
      staminaMax: state.staminaMax + (r.staminaMax ?? 0),
    };
    // pick next quest to track
    const nextActive = QUESTS.find((q) => quests[q.id].status === 'active' || quests[q.id].status === 'ready');
    const nextAvail = QUESTS.find((q) => quests[q.id].status === 'available');
    patch.trackedQuest = nextActive?.id ?? nextAvail?.id ?? null;
    set(patch as never);

    if (r.bswx) earn(r.bswx);
    if (r.xp) grantXp(r.xp);
    audio.playLevelUp();
    get().addToast(`Quest complete: ${def.title}!${r.text ? ' ' + r.text : ''}`, 'quest', '✦');
    checkReputationObjectives();
    get().save();
  }

  function getGossip(npcId: string): string {
    const npc = NPC_GOSSIP[npcId];
    if (!npc || npc.length === 0) return '...';
    return npc[Math.floor(Math.random() * npc.length)];
  }

  /** Spawn a Market Rush (at a business) or a Rich Find (at a resource node). */
  function spawnEvent() {
    const s = get();
    const businesses = s.plots.filter(
      (p) => p.building && p.construction === 0 && BUILDINGS[p.building].income > 0
    );
    const aliveNodes = s.nodes.filter((n) => n.hp > 0);

    let ev: GameEvent | null = null;
    const preferRush = businesses.length > 0 && (Math.random() < 0.6 || aliveNodes.length === 0);

    if (preferRush) {
      const p = businesses[Math.floor(Math.random() * businesses.length)];
      const cfg = BUILDINGS[p.building!];
      ev = {
        id: `ev${eventId++}`,
        kind: 'rush',
        anchorId: p.id,
        x: p.x,
        z: p.z,
        title: `Market Rush — ${cfg.name}`,
        hint: 'Customers are pouring in — collect the rush!',
        timeLeft: EVENT_WINDOW,
        duration: EVENT_WINDOW,
      };
    } else if (aliveNodes.length > 0) {
      const n = aliveNodes[Math.floor(Math.random() * aliveNodes.length)];
      ev = {
        id: `ev${eventId++}`,
        kind: 'cache',
        anchorId: n.id,
        x: n.x,
        z: n.z,
        resource: n.type,
        title: `Rich Find — ${RESOURCE_LABEL[n.type]}`,
        hint: `A rich seam of ${RESOURCE_LABEL[n.type]} — grab it fast!`,
        timeLeft: EVENT_WINDOW,
        duration: EVENT_WINDOW,
      };
    }

    if (ev) {
      set({ activeEvent: ev, nextEventIn: rand(EVENT_MIN_GAP, EVENT_MAX_GAP) });
      get().addToast(`${ev.title} — hurry!`, 'quest', '⚡');
      audio.sfx('questReady');
    } else {
      // nothing to anchor to yet — check again shortly
      set({ nextEventIn: 20 });
    }
  }

  /** Build one merchant crate of a given quality, scaled to player level. */
  function makeDeal(quality: 'steal' | 'fair' | 'ripoff', lvl: number): MerchantDeal {
    const id = dealId++;
    const base = 20 + lvl * 6;
    const cost = Math.round(base * (0.8 + Math.random() * 0.6));
    const res = (['wood', 'stone', 'clay'] as const)[Math.floor(Math.random() * 3)];
    const fairUnits = Math.max(1, Math.round(cost / 2.5));
    const amt =
      quality === 'steal'
        ? Math.round(fairUnits * 2.2)
        : quality === 'fair'
          ? fairUnits
          : Math.max(1, Math.round(fairUnits * 0.18));
    return {
      id,
      cost,
      reward: { [res]: amt },
      quality,
      label: `${amt} ${RESOURCE_LABEL[res]}`,
      mystery: true,
      sold: false,
    };
  }

  /** Traveling merchant rolls into town with three face-down crates: one steal,
   *  one fair, one snake-oil — but you don't know which is which. */
  function spawnMerchant() {
    const s = get();
    if (!s.plots.some((p) => p.building && p.construction === 0)) {
      set({ nextMerchantIn: 30 });
      return;
    }
    const qualities: ('steal' | 'fair' | 'ripoff')[] = ['steal', 'fair', 'ripoff'];
    for (let i = qualities.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [qualities[i], qualities[j]] = [qualities[j], qualities[i]];
    }
    const deals = qualities.map((q) => makeDeal(q, s.level));
    set({
      merchant: {
        name: randomName(),
        x: MERCHANT_POS.x,
        z: MERCHANT_POS.z,
        deals,
        inspectsLeft: MERCHANT_INSPECTS,
        trust: 0,
        timeLeft: MERCHANT_WINDOW,
        duration: MERCHANT_WINDOW,
      },
      nextMerchantIn: rand(MERCHANT_MIN_GAP, MERCHANT_MAX_GAP),
    });
    get().addToast('A traveling merchant set up at the plaza — deals for a limited time!', 'quest', '🛒');
    audio.sfx('questReady');
  }

  /** Speculator makes a tempting buyout offer on one of your businesses. */
  function spawnSpeculatorOffer() {
    const s = get();
    // the speculator only slinks into town after dark
    if (!isNightTime(s.timeOfDay)) {
      set({ nextSpeculatorIn: 25 });
      return;
    }
    const targets = s.plots.filter(
      (p) => p.building && p.construction === 0 && BUILDINGS[p.building].income > 0
    );
    if (targets.length === 0) {
      set({ nextSpeculatorIn: 40 });
      return;
    }
    // he covets your crown jewel — the most valuable business in town
    const p = targets.reduce((best, c) =>
      BUILDINGS[c.building!].income * c.level > BUILDINGS[best.building!].income * best.level ? c : best
    );
    const cfg = BUILDINGS[p.building!];
    // a thin war chest makes the cash dangerously tempting — he bids higher
    const desperation = s.bswx < 150 ? 1.35 : s.bswx < 400 ? 1.15 : 1;
    const amount = Math.round(
      (SPECULATOR_BASE + cfg.income * p.level * SPECULATOR_VALUE_MULT) * desperation * (0.9 + Math.random() * 0.4)
    );
    set({
      speculatorOffer: {
        plotId: p.id,
        buildingName: cfg.name,
        amount,
        x: SPECULATOR_POS.x,
        z: SPECULATOR_POS.z,
        timeLeft: SPECULATOR_WINDOW,
        duration: SPECULATOR_WINDOW,
      },
      nextSpeculatorIn: rand(SPECULATOR_MIN_GAP, SPECULATOR_MAX_GAP),
    });
    get().addToast(`A speculator offers ◆${amount} for your ${cfg.name}. Defend your turf!`, 'warn', '🎩');
    audio.sfx('questReady');
  }

  /** Roll a town-wide fortune — a festival, boom, panic, or blight. */
  function rollFortune() {
    const s = get();
    const operational = s.plots.filter((p) => p.building && p.construction === 0).length;
    if (operational === 0) {
      set({ nextFortuneIn: 40 });
      return;
    }
    // ease players in: the first fortune (and the early game) is always good
    const pool = firstFortune || operational < 3 ? FORTUNES.filter((f) => f.good) : FORTUNES;
    const tmpl = pool[Math.floor(Math.random() * pool.length)];
    firstFortune = false;
    const duration = Math.round(rand(FORTUNE_MIN_DUR, FORTUNE_MAX_DUR));
    set({
      fortune: { ...tmpl, timeLeft: duration, duration },
      nextFortuneIn: rand(FORTUNE_MIN_GAP, FORTUNE_MAX_GAP),
    });
    get().addToast(`${tmpl.label}! ${tmpl.desc}`, tmpl.good ? 'reward' : 'warn', tmpl.icon);
    audio.sfx(tmpl.good ? 'complete' : 'error');
  }

  function goalValue(s: GameState, kind: TownGoal['kind']): number {
    switch (kind) {
      case 'buildings':
        return s.plots.filter((p) => p.building && p.construction === 0).length;
      case 'population':
        return deriveResidents(s.plots).length;
      case 'reputation':
        return s.reputation;
      case 'earned':
        return s.totalEarned;
      case 'level':
        return s.level;
      default:
        return 0;
    }
  }

  /** Advance the endless goal ladder, awarding any goals now satisfied. */
  function checkGoals() {
    let advanced = false;
    for (let guard = 0; guard < 20; guard++) {
      const s = get();
      const goal = goalAt(s.goalIndex);
      if (goalValue(s, goal.kind) < goal.target) break;
      set({ goalIndex: s.goalIndex + 1 });
      const r = goal.reward;
      if (r.rep) set({ reputation: get().reputation + r.rep });
      if (r.bswx) earn(r.bswx);
      if (r.xp) grantXp(r.xp);
      get().addToast(`Town goal reached: ${goal.label}!`, 'quest', '🎯');
      advanced = true;
    }
    if (advanced) {
      audio.playLevelUp();
      checkReputationObjectives();
    }
  }

  /** Grow an overdue loan and ding reputation at each day rollover. */
  function processLoanDay(newDay: number) {
    const s = get();
    const loan = s.loan;
    if (!loan) return;
    if (newDay > loan.dueDay) {
      const owed = Math.round(loan.owed * LOAN_OVERDUE_GROWTH);
      set({ loan: { ...loan, owed, overdue: true }, reputation: Math.max(0, s.reputation - 2) });
      get().addToast(`Overdue! The shark's debt swells to ◆${owed}. (−2 rep)`, 'warn', '⚠');
    }
  }

  /** Legacy tokens a charter would award right now, from accumulated progress. */
  function computeCharterTokens(s: GameState): number {
    const pop = deriveResidents(s.plots).length;
    return Math.max(
      1,
      Math.floor(s.totalEarned / 4000) + Math.floor(s.reputation / 40) + Math.floor(pop / 4)
    );
  }

  /** A resident posts a resource request to the community board. */
  function spawnRequest() {
    const s = get();
    const residents = deriveResidents(s.plots);
    const busy = new Set(s.requests.map((r) => r.residentId));
    const free = residents.filter((r) => !busy.has(r.id));
    if (free.length === 0 || s.requests.length >= MAX_REQUESTS) {
      set({ nextRequestIn: 30 });
      return;
    }
    const res = free[Math.floor(Math.random() * free.length)];
    const kinds = ['wood', 'stone', 'clay'] as const;
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const amount = 5 + Math.floor(Math.random() * (6 + s.level));
    const unitVal = kind === 'clay' ? 3 : 2.4;
    const rewardBswx = Math.round(amount * unitVal * 1.6);
    const rel = s.relationships[res.id] ?? 0;
    const rewardRep = 2 + Math.floor(rel / 2);
    set({
      requests: [
        ...s.requests,
        { id: requestId++, residentId: res.id, residentName: res.name, kind, amount, rewardBswx, rewardRep },
      ],
      nextRequestIn: rand(REQUEST_MIN_GAP, REQUEST_MAX_GAP),
    });
    get().addToast(`${res.name} pinned a request to the community board.`, 'info', '📌');
  }
});

// debug handle (harmless in prod, invaluable when investigating live issues)
if (typeof window !== 'undefined') {
  (window as unknown as { __game: typeof useGame }).__game = useGame;
}

// ---------------------------------------------------------------------------
// SAVE / LOAD
// ---------------------------------------------------------------------------

export function hasSavedGame(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

function loadSave(): Partial<GameState> | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.v !== 1) return null;

    const baseNodes = generateResourceNodes();
    const nodeState: Record<string, { hp: number; regrow: number }> = {};
    for (const n of data.nodes ?? []) nodeState[n.id] = n;
    const nodes = baseNodes.map((n) => {
      const s = nodeState[n.id];
      return s ? { ...n, hp: s.hp, regrow: s.regrow } : n;
    });

    // merge saved quests with definitions (handles new quests added later)
    const quests = initialQuestsMerge(data.quests ?? {});

    // keep only built plots (drops legacy pre-generated empty squares) and
    // default rotation for saves from before free placement existed
    const plots = ((data.plots ?? []) as Plot[])
      .filter((p) => p.building)
      .map((p) => ({ ...p, rot: p.rot ?? 0 }));
    const circulation = data.circulation ?? 1;
    const legacy: LegacyState = data.legacy ?? { tokens: 0, district: 1 };
    const civics: Civics = { ...emptyCivics(), ...(data.civics ?? {}) };

    // offline earnings — accrue passive income for time spent away (capped)
    let welcomeBack: WelcomeBack | null = null;
    if (data.lastSeen) {
      const elapsed = Math.max(0, (Date.now() - data.lastSeen) / 1000);
      if (elapsed >= OFFLINE_MIN_SECONDS) {
        const perTick = passiveIncomePerTick(
          plots,
          circulation,
          legacyMultiplier(legacy) * boonIncomeMult(quests) * civicIncomeMult(civics)
        );
        if (perTick > 0) {
          const ticks = Math.floor(Math.min(elapsed, OFFLINE_CAP) / ECONOMY_TICK);
          const bswx = Math.round(perTick * ticks * OFFLINE_EFFICIENCY);
          if (bswx >= 1) welcomeBack = { seconds: Math.min(elapsed, OFFLINE_CAP), bswx };
        }
      }
    }

    return {
      appearance: { ...DEFAULT_APPEARANCE, ...(data.appearance ?? {}) },
      px: data.px ?? 0,
      pz: data.pz ?? 6,
      bswx: data.bswx ?? 15,
      wood: data.wood ?? 0,
      stone: data.stone ?? 0,
      clay: data.clay ?? 0,
      stamina: data.stamina ?? 100,
      staminaMax: data.staminaMax ?? 100,
      food: data.food ?? 6,
      goods: data.goods ?? 0,
      circulation,
      marketPrices: { wood: 2, stone: 2.4, clay: 3, goods: 4, ...(data.marketPrices ?? {}) },
      reputation: data.reputation ?? 0,
      level: data.level ?? 1,
      xp: data.xp ?? 0,
      totalEarned: data.totalEarned ?? 0,
      // existing saves get one retroactive point per level already earned
      skillPoints: data.skillPoints ?? Math.max(0, (data.level ?? 1) - 1),
      skills: { ...emptySkills(), ...(data.skills ?? {}) },
      civics,
      sprinting: false,
      timeOfDay: data.timeOfDay ?? 0.32,
      day: data.day ?? 1,
      quests,
      trackedQuest: data.trackedQuest ?? null,
      plots,
      goalIndex: data.goalIndex ?? 0,
      legacy,
      requests: data.requests ?? [],
      relationships: data.relationships ?? {},
      nodes,
      nodesVersion: 1,
      welcomeBack,
      loan: data.loan ?? null,
    };
  } catch {
    return null;
  }
}

function initialQuestsMerge(saved: Record<string, QuestProgress>): Record<string, QuestProgress> {
  const q: Record<string, QuestProgress> = {};
  for (const def of QUESTS) {
    const s = saved[def.id];
    if (s) {
      q[def.id] = { status: s.status, progress: def.objectives.map((_, i) => s.progress[i] ?? 0) };
    } else {
      const reqDone = def.requires ? saved[def.requires]?.status === 'done' : true;
      q[def.id] = {
        status: def.requires && !reqDone ? 'locked' : 'available',
        progress: def.objectives.map(() => 0),
      };
    }
  }
  return q;
}
