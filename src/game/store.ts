import { create } from 'zustand';
import {
  BUILDINGS,
  NPCS,
  COTTAGE_INCOME_BONUS,
  GARDEN_INCOME_BONUS,
  MAX_BUILDING_LEVEL,
  QUESTS,
  QUEST_BY_ID,
  RESOURCE_LABEL,
  UPGRADE_COST_MULT,
  xpForLevel,
} from './data';
import { generatePlots, generateResourceNodes } from './world';
import { CALLING_BY_ID, DEFAULT_APPEARANCE } from './customization';
import type {
  BuildingId,
  DialogueState,
  InteractTarget,
  PanelId,
  PlayerAppearance,
  Plot,
  QuestProgress,
  QuestStatus,
  ResourceNode,
  ResourceType,
  Toast,
} from './types';
import { audio } from './audio';

const NPC_GOSSIP: Record<string, string[]> = Object.fromEntries(
  NPCS.map((n) => [n.id, n.gossip])
);

const SAVE_KEY = 'newgreenwood3d_v1';
const ECONOMY_TICK = 5; // seconds
const DAY_LENGTH = 240; // seconds per full day/night cycle
const NODE_REGROW = 70; // seconds
const HARVEST_TIME = 1.1; // seconds per harvest swing
const HARVEST_STAMINA = 6;
const HARVEST_YIELD: Record<ResourceType, [number, number]> = {
  wood: [2, 3],
  stone: [2, 3],
  clay: [1, 2],
};

export type GamePhase = 'menu' | 'create' | 'playing';

let toastId = 1;

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

  // world
  nodes: ResourceNode[];
  nodesVersion: number;
  plots: Plot[];
  timeOfDay: number; // 0..1 (0.25 = dawn, 0.5 = noon, 0.75 = dusk)
  day: number;

  // quests
  quests: Record<string, QuestProgress>;
  trackedQuest: string | null;

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
  setPlayerPos: (x: number, z: number, facing: number, moving: boolean) => void;
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
  buildOnPlot: (plotId: string, buildingId: BuildingId) => void;
  upgradePlot: (plotId: string) => void;
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
    nodes: generateResourceNodes(),
    nodesVersion: 0,
    plots: generatePlots(),
    timeOfDay: 0.32,
    day: 1,
    quests: initialQuests(),
    trackedQuest: 'first_foundations' as string | null,
  };
}

// ---------------------------------------------------------------------------

export const useGame = create<GameState>((set, get) => {
  let economyTimer = 0;
  let saveTimer = 0;
  let staminaWarned = false;

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

  function grantXp(amount: number) {
    const state = get();
    let xp = state.xp + amount;
    let level = state.level;
    let staminaMax = state.staminaMax;
    let leveled = false;
    while (xp >= xpForLevel(level)) {
      xp -= xpForLevel(level);
      level += 1;
      staminaMax += 8;
      leveled = true;
    }
    set({ xp, level, staminaMax, stamina: leveled ? staminaMax : state.stamina });
    if (leveled) {
      get().addToast(`Level up! You are now level ${level}. Max stamina +8.`, 'reward', '★');
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
          set({ ...loaded, phase: 'playing', panel: null, dialogue: null, harvesting: null, moveTarget: null });
          get().addToast('Welcome back to New Greenwood.', 'info');
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
        toasts: [],
      });
      const first = appearance.name.split(' ')[0];
      get().addToast(`Welcome to Greenwood, ${first} the ${calling?.name ?? 'Builder'}.`, 'reward', '✦');
      get().addToast('Speak with O.W. Gurley at the plaza to begin.', 'quest', '!');
      get().save();
    },

    backToMenu: () => {
      get().save();
      set({ phase: 'menu', panel: null, dialogue: null, harvesting: null, moveTarget: null });
    },

    setPlayerPos: (px, pz, facing, moving) => set({ px, pz, facing, moving }),
    setMoveTarget: (moveTarget) => set({ moveTarget }),
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
      let timeOfDay = state.timeOfDay + dt / DAY_LENGTH;
      let day = state.day;
      if (timeOfDay >= 1) {
        timeOfDay -= 1;
        day += 1;
        get().addToast(`Day ${day} dawns over New Greenwood.`, 'info');
      }

      // stamina regen (faster when idle)
      const regen = state.moving ? 1.6 : 4.5;
      const stamina = Math.min(state.staminaMax, state.stamina + regen * dt);
      if (stamina > 25) staminaWarned = false;

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

      for (const p of finishing) {
        const cfg = BUILDINGS[p.building!];
        get().addToast(`${cfg.name} is complete! +${cfg.repReward} reputation`, 'reward', '⚒');
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
          const progress = h.progress + dt / HARVEST_TIME;
          if (progress >= 1) {
            finishHarvest(node);
          } else {
            set({ harvesting: { nodeId: h.nodeId, progress } });
          }
        }
      }

      // economy tick
      economyTimer += dt;
      if (economyTimer >= ECONOMY_TICK) {
        economyTimer = 0;
        const s = get();
        const cottages = s.plots.filter((p) => p.building === 'cottage' && p.construction === 0).length;
        const gardens = s.plots.filter((p) => p.building === 'garden' && p.construction === 0).length;
        const mult = 1 + cottages * COTTAGE_INCOME_BONUS + gardens * GARDEN_INCOME_BONUS;
        let income = 0;
        for (const p of s.plots) {
          if (!p.building || p.construction > 0) continue;
          income += BUILDINGS[p.building].income * p.level;
        }
        income = Math.round(income * mult);
        if (income > 0) {
          earn(income);
          audio.sfx('coin');
        }
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
        const bonus = Math.floor((s.level - 1) / 2); // +1 yield every 2 levels
        const amount = lo + Math.floor(Math.random() * (hi - lo + 1)) + bonus;
        const hp = node.hp - 1;
        const nodes = s.nodes.map((n) =>
          n.id === node.id ? { ...n, hp, regrow: hp <= 0 ? NODE_REGROW : 0 } : n
        );
        const patch: Partial<GameState> = {
          nodes,
          nodesVersion: s.nodesVersion + 1,
          harvesting: hp > 0 && s.stamina >= HARVEST_STAMINA ? { nodeId: node.id, progress: 0 } : null,
        };
        patch[node.type] = (s[node.type] as number) + amount;
        set(patch as never);
        audio.sfx(node.type === 'wood' ? 'chop' : node.type === 'stone' ? 'mine' : 'dig');
        grantXp(4);
        applyQuestEvent('gather', node.type, amount);
        get().addToast(`+${amount} ${RESOURCE_LABEL[node.type]}`, 'reward', '+');
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
      }
    },

    talkTo: (npcId) => {
      const state = get();
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

    buildOnPlot: (plotId, buildingId) => {
      const state = get();
      const plot = state.plots.find((p) => p.id === plotId);
      const cfg = BUILDINGS[buildingId];
      if (!plot || plot.building || !cfg) return;
      const c = cfg.cost;
      if (
        state.wood < c.wood ||
        state.stone < c.stone ||
        state.clay < (c.clay ?? 0) ||
        state.bswx < (c.bswx ?? 0)
      ) {
        get().addToast('Not enough resources for that.', 'warn', '!');
        return;
      }
      const plots = state.plots.map((p) =>
        p.id === plotId ? { ...p, building: buildingId, level: 1, construction: 6 } : p
      );
      set({
        plots,
        wood: state.wood - c.wood,
        stone: state.stone - c.stone,
        clay: state.clay - (c.clay ?? 0),
        bswx: state.bswx - (c.bswx ?? 0),
        panel: null,
        selectedPlot: null,
      });
      audio.sfx('build');
      get().addToast(`Construction started: ${cfg.name}`, 'info', '⚒');
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
        p.id === plotId ? { ...p, level: p.level + 1, construction: 4 } : p
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

    save: () => {
      try {
        const s = get();
        const data = {
          v: 1,
          appearance: s.appearance,
          px: s.px, pz: s.pz,
          bswx: s.bswx, wood: s.wood, stone: s.stone, clay: s.clay,
          stamina: s.stamina, staminaMax: s.staminaMax,
          reputation: s.reputation, level: s.level, xp: s.xp, totalEarned: s.totalEarned,
          timeOfDay: s.timeOfDay, day: s.day,
          quests: s.quests, trackedQuest: s.trackedQuest,
          plots: s.plots,
          nodes: s.nodes.map((n) => ({ id: n.id, hp: n.hp, regrow: Math.round(n.regrow) })),
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
      reputation: data.reputation ?? 0,
      level: data.level ?? 1,
      xp: data.xp ?? 0,
      totalEarned: data.totalEarned ?? 0,
      timeOfDay: data.timeOfDay ?? 0.32,
      day: data.day ?? 1,
      quests,
      trackedQuest: data.trackedQuest ?? null,
      plots: (data.plots ?? generatePlots()) as Plot[],
      nodes,
      nodesVersion: 1,
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
