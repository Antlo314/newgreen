'use client';

import React from 'react';
import { useGame } from '../../../src/game/store';
import {
  BUILDINGS,
  MAX_BUILDING_LEVEL,
  NPC_BY_ID,
  QUESTS,
  QUEST_BY_ID,
  UPGRADE_COST_MULT,
} from '../../../src/game/data';
import type { BuildingConfig, QuestDef } from '../../../src/game/types';
import Minimap from './Minimap';

export default function Panels() {
  const panel = useGame((s) => s.panel);
  if (!panel) return null;
  return (
    <>
      {panel === 'dialogue' && <DialoguePanel />}
      {panel === 'quests' && <Modal title="Quest Log"><QuestLog /></Modal>}
      {panel === 'inventory' && <Modal title="Inventory & Stats"><Inventory /></Modal>}
      {panel === 'build' && <Modal title="Greenwood Land Office"><BuildMenu /></Modal>}
      {panel === 'map' && <Modal title="District Map"><MapPanel /></Modal>}
      {panel === 'help' && <Modal title="How to Play"><HelpPanel /></Modal>}
    </>
  );
}

// ---------------------------------------------------------------------------

function Modal({ title, children }: { title: string; children: React.ReactNode }) {
  const setPanel = useGame((s) => s.setPanel);
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-3 backdrop-blur-[2px]"
      onClick={() => setPanel(null)}
    >
      <div
        className="flex max-h-[82vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-amber-200/20 bg-[#161310]/95 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-amber-300">{title}</h2>
          <button
            onClick={() => setPanel(null)}
            className="rounded-md px-2 py-0.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function QuestLog() {
  const quests = useGame((s) => s.quests);
  const trackedQuest = useGame((s) => s.trackedQuest);
  const trackQuest = useGame((s) => s.trackQuest);

  const sections: [string, QuestDef[]][] = [
    ['In Progress', QUESTS.filter((q) => ['active', 'ready'].includes(quests[q.id]?.status))],
    ['Available', QUESTS.filter((q) => quests[q.id]?.status === 'available')],
    ['Completed', QUESTS.filter((q) => quests[q.id]?.status === 'done')],
  ];

  return (
    <div className="space-y-4">
      {sections.map(([label, defs]) =>
        defs.length === 0 ? null : (
          <div key={label}>
            <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</h3>
            <div className="space-y-2">
              {defs.map((def) => {
                const prog = quests[def.id];
                const isTracked = trackedQuest === def.id;
                const giver = NPC_BY_ID[def.giver];
                return (
                  <button
                    key={def.id}
                    onClick={() => trackQuest(def.id)}
                    className={`w-full rounded-lg border p-2.5 text-left transition ${
                      isTracked ? 'border-amber-400/50 bg-amber-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${def.line === 'main' ? 'text-amber-300' : 'text-sky-300'}`}>
                        {def.line}
                      </span>
                      <span className="text-xs font-semibold text-white">{def.title}</span>
                      {prog.status === 'ready' && (
                        <span className="ml-auto rounded bg-amber-400/25 px-1.5 text-[9px] font-bold text-amber-300">TURN IN</span>
                      )}
                      {prog.status === 'done' && <span className="ml-auto text-[10px] text-emerald-300">✓ Done</span>}
                    </div>
                    <div className="mt-0.5 text-[10px] text-white/45">Giver: {giver?.name}</div>
                    {prog.status !== 'done' && prog.status !== 'available' && (
                      <div className="mt-1 space-y-0.5">
                        {def.objectives.map((o, i) => {
                          const done = prog.progress[i] >= o.amount;
                          return (
                            <div key={i} className={`text-[11px] ${done ? 'text-emerald-300' : 'text-white/70'}`}>
                              {done ? '✓' : '○'} {o.label}
                              {o.amount > 1 && ` — ${prog.progress[i]}/${o.amount}`}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {prog.status === 'available' && (
                      <div className="mt-1 text-[11px] text-sky-200/80">Speak with {giver?.name} to accept.</div>
                    )}
                    <RewardLine def={def} />
                  </button>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
}

function RewardLine({ def }: { def: QuestDef }) {
  const r = def.rewards;
  const parts: string[] = [];
  if (r.bswx) parts.push(`◆${r.bswx}`);
  if (r.rep) parts.push(`✦${r.rep} rep`);
  if (r.xp) parts.push(`${r.xp} XP`);
  if (r.wood) parts.push(`🪵${r.wood}`);
  if (r.stone) parts.push(`🪨${r.stone}`);
  if (r.staminaMax) parts.push(`+${r.staminaMax} max stamina`);
  if (parts.length === 0) return null;
  return <div className="mt-1 text-[10px] text-amber-200/70">Rewards: {parts.join(' · ')}</div>;
}

// ---------------------------------------------------------------------------

function Inventory() {
  const s = useGame();
  const items = [
    { icon: '🪵', name: 'Lumber', count: s.wood, desc: 'Harvested from the northern pines.' },
    { icon: '🪨', name: 'Stone', count: s.stone, desc: 'Quarried east of the river.' },
    { icon: '🧱', name: 'Clay', count: s.clay, desc: 'Dug from the southern riverbank.' },
    { icon: '◆', name: 'BSWX', count: s.bswx, desc: 'Black Wall Street Exchange currency.' },
  ];
  const built = s.plots.filter((p) => p.building && p.construction === 0);
  const income = built.reduce((sum, p) => sum + BUILDINGS[p.building!].income * p.level, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {items.map((it) => (
          <div key={it.name} className="rounded-lg border border-white/10 bg-white/5 p-2.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">{it.icon}</span>
              <div>
                <div className="text-xs font-semibold text-white">{it.name}</div>
                <div className="text-sm font-bold text-amber-300">{it.count.toLocaleString()}</div>
              </div>
            </div>
            <div className="mt-1 text-[10px] text-white/45">{it.desc}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/50">Builder Profile</h3>
        <div className="space-y-1 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/85">
          <Row k="Level" v={`${s.level}`} />
          <Row k="Reputation" v={`${s.reputation}`} />
          <Row k="Stamina" v={`${Math.round(s.stamina)} / ${s.staminaMax}`} />
          <Row k="Total earned" v={`◆${s.totalEarned.toLocaleString()}`} />
          <Row k="Buildings" v={`${built.length}`} />
          <Row k="Passive income" v={`◆${income} / 5s (before bonuses)`} />
          <Row k="Harvest bonus" v={`+${Math.floor((s.level - 1) / 2)} per swing`} />
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/55">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------

function costLine(c: BuildingConfig['cost'], mult = 1) {
  const parts: string[] = [];
  if (c.wood) parts.push(`🪵${Math.round(c.wood * mult)}`);
  if (c.stone) parts.push(`🪨${Math.round(c.stone * mult)}`);
  if (c.clay) parts.push(`🧱${Math.round(c.clay * mult)}`);
  if (c.bswx) parts.push(`◆${Math.round(c.bswx * mult)}`);
  return parts.join('  ');
}

function BuildMenu() {
  const s = useGame();
  const plot = s.plots.find((p) => p.id === s.selectedPlot);

  if (!plot) {
    return <div className="text-xs text-white/60">Stand near an open plot (golden markers) and press E to build.</div>;
  }

  // managing an existing building
  if (plot.building) {
    const cfg = BUILDINGS[plot.building];
    const canUpgrade = plot.level < MAX_BUILDING_LEVEL;
    const mult = Math.pow(UPGRADE_COST_MULT, plot.level);
    const afford =
      s.wood >= Math.round(cfg.cost.wood * mult) &&
      s.stone >= Math.round(cfg.cost.stone * mult) &&
      s.clay >= Math.round((cfg.cost.clay ?? 0) * mult) &&
      s.bswx >= Math.round((cfg.cost.bswx ?? 0) * mult);
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3">
          <div className="text-sm font-bold text-white">{cfg.name}</div>
          <div className="mt-0.5 text-[11px] text-amber-300">Level {plot.level} / {MAX_BUILDING_LEVEL}</div>
          <div className="mt-1 text-[11px] text-white/65">{cfg.desc}</div>
          {cfg.income > 0 && (
            <div className="mt-1 text-[11px] text-emerald-300">Income: ◆{cfg.income * plot.level} per tick</div>
          )}
        </div>
        {canUpgrade ? (
          <button
            onClick={() => s.upgradePlot(plot.id)}
            disabled={!afford}
            className={`w-full rounded-lg border px-3 py-2.5 text-xs font-bold transition ${
              afford
                ? 'border-amber-400/50 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25'
                : 'cursor-not-allowed border-white/10 bg-white/5 text-white/35'
            }`}
          >
            Upgrade to Level {plot.level + 1} — {costLine(cfg.cost, mult)}
          </button>
        ) : (
          <div className="text-center text-[11px] text-amber-300">★ Fully upgraded ★</div>
        )}
      </div>
    );
  }

  // empty plot: catalog
  const unlocked = s.quests['first_foundations']?.status === 'done';
  if (!unlocked) {
    return (
      <div className="text-xs text-white/60">
        Complete <span className="font-semibold text-amber-300">First Foundations</span> for O.W. Gurley before the land
        office will lease you a plot.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Object.values(BUILDINGS).map((cfg) => {
        const repOk = s.reputation >= cfg.repRequired;
        const questOk = !cfg.questRequired || s.quests[cfg.questRequired]?.status === 'done';
        const locked = !repOk || !questOk;
        const afford =
          s.wood >= cfg.cost.wood &&
          s.stone >= cfg.cost.stone &&
          s.clay >= (cfg.cost.clay ?? 0) &&
          s.bswx >= (cfg.cost.bswx ?? 0);
        return (
          <button
            key={cfg.id}
            disabled={locked || !afford}
            onClick={() => s.buildOnPlot(plot.id, cfg.id)}
            className={`w-full rounded-lg border p-2.5 text-left transition ${
              locked
                ? 'cursor-not-allowed border-white/5 bg-white/[0.02] opacity-50'
                : afford
                  ? 'border-white/15 bg-white/5 hover:border-amber-400/50 hover:bg-amber-400/10'
                  : 'cursor-not-allowed border-white/10 bg-white/[0.03] opacity-70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{cfg.name}</span>
              {cfg.income > 0 && <span className="text-[10px] font-semibold text-emerald-300">◆{cfg.income}/tick</span>}
            </div>
            <div className="mt-0.5 text-[10px] text-white/55">{cfg.desc}</div>
            <div className="mt-1 flex items-center justify-between">
              <span className={`text-[11px] font-semibold ${afford ? 'text-amber-200' : 'text-red-300'}`}>
                {costLine(cfg.cost)}
              </span>
              {locked && (
                <span className="text-[10px] text-white/45">
                  {!questOk ? 'Quest locked' : `Needs ✦${cfg.repRequired} rep`}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------

function MapPanel() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Minimap size={300} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-white/70">
        <span>⬤ <span className="text-white">You</span></span>
        <span className="text-sky-300">⬤ Townsfolk</span>
        <span className="text-green-900">■ Forest (lumber)</span>
        <span className="text-gray-300">■ Quarry (stone)</span>
        <span className="text-orange-400">■ Riverbank (clay)</span>
        <span className="text-amber-300">■ Buildings / plots</span>
      </div>
    </div>
  );
}

function HelpPanel() {
  return (
    <div className="space-y-3 text-xs text-white/80">
      <Section h="Goal">
        Rebuild New Greenwood — gather resources, raise businesses, and grow community wealth and reputation. Follow the
        main quests from O.W. Gurley to restore the district to glory.
      </Section>
      <Section h="Movement">
        <Kbd>WASD</Kbd> or arrow keys to walk. You can also <b>click / tap the ground</b> to move there. Mouse wheel
        zooms the camera.
      </Section>
      <Section h="Interacting">
        Walk up to anything highlighted with a golden ring and press <Kbd>E</Kbd> (or tap the action button on mobile):
        chop pines 🌲, mine quarry rock 🪨, dig riverbank clay 🧱, talk to townsfolk, or build on open plots.
        Harvesting costs stamina — it recovers when you rest.
      </Section>
      <Section h="Economy">
        Businesses generate <b>◆ BSWX</b> automatically. Cottages boost all income +10% each; gardens +5% and
        reputation. Upgrade buildings up to level 3 for bigger returns.
      </Section>
      <Section h="Quests">
        Blue markers = new quests. Gold markers = ready to turn in. Press <Kbd>Q</Kbd> for the quest log,{' '}
        <Kbd>I</Kbd> for inventory, <Kbd>M</Kbd> for the map.
      </Section>
      <Section h="Saving">Your progress autosaves every few seconds and when you return to the menu.</Section>
    </div>
  );
}

function Section({ h, children }: { h: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">{h}</h3>
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-bold text-white">{children}</kbd>;
}

// ---------------------------------------------------------------------------

function DialoguePanel() {
  const dialogue = useGame((s) => s.dialogue);
  const advanceDialogue = useGame((s) => s.advanceDialogue);
  const declineDialogue = useGame((s) => s.declineDialogue);
  const acceptQuest = useGame((s) => s.acceptQuest);

  if (!dialogue) return null;
  const npc = NPC_BY_ID[dialogue.npcId];
  const quest = dialogue.questId ? QUEST_BY_ID[dialogue.questId] : null;
  const isLast = dialogue.index >= dialogue.lines.length - 1;

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 p-3 sm:p-5">
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-200/25 bg-[#161310]/95 p-4 shadow-2xl">
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-sm font-bold text-white"
            style={{ background: npc ? npc.color : '#444' }}
          >
            {npc?.name.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-bold text-amber-200">{npc?.name}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/45">{npc?.title}</div>
          </div>
          {quest && (
            <span className="ml-auto rounded bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              {dialogue.mode === 'turnin' ? `Completing: ${quest.title}` : quest.title}
            </span>
          )}
        </div>
        <p className="mt-3 min-h-[3rem] text-sm leading-relaxed text-white/90">{dialogue.lines[dialogue.index]}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-white/35">
            {dialogue.index + 1} / {dialogue.lines.length}
          </span>
          <div className="flex gap-2">
            {dialogue.mode === 'offer' && isLast ? (
              <>
                <button
                  onClick={declineDialogue}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10"
                >
                  Not yet
                </button>
                <button
                  onClick={acceptQuest}
                  className="rounded-lg border border-amber-400/50 bg-amber-400/20 px-4 py-1.5 text-xs font-bold text-amber-200 transition hover:bg-amber-400/30"
                >
                  Accept Quest
                </button>
              </>
            ) : (
              <button
                onClick={advanceDialogue}
                className="rounded-lg border border-amber-400/50 bg-amber-400/20 px-4 py-1.5 text-xs font-bold text-amber-200 transition hover:bg-amber-400/30"
              >
                {isLast ? (dialogue.mode === 'turnin' ? 'Complete Quest ✦' : 'Close') : 'Next ▸'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
