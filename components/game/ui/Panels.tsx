'use client';

import React, { useRef, useState } from 'react';
import { BANK_LOAN_TIERS, useGame } from '../../../src/game/store';
import { useCoarse } from './useCoarse';
import {
  adjacencyInfo,
  boonActive,
  boonMarketMult,
  BUILDINGS,
  CIVICS,
  civicCost,
  FOUNDER_BOONS,
  LOAN_TIERS,
  MAX_BUILDING_LEVEL,
  MAX_SKILL,
  NPC_BY_ID,
  PROVISIONS,
  QUESTS,
  QUEST_BY_ID,
  RESOURCE_LABEL,
  SKILLS,
  UPGRADE_COST_MULT,
} from '../../../src/game/data';
import type { BuildingConfig, QuestDef } from '../../../src/game/types';
import { deriveResidents } from '../../../src/game/residents';
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
      {panel === 'market' && <Modal title="Greenwood Exchange"><MarketPanel /></Modal>}
      {panel === 'merchant' && <Modal title="Traveling Merchant"><MerchantPanel /></Modal>}
      {panel === 'loan' && <Modal title="Back-Alley Lending"><LoanPanel /></Modal>}
      {panel === 'speculator' && <Modal title="An Outside Offer"><SpeculatorPanel /></Modal>}
      {panel === 'board' && <Modal title="Community Board"><BoardPanel /></Modal>}
      {panel === 'charter' && <Modal title="Charter a New District"><CharterPanel /></Modal>}
      {panel === 'civic' && <Modal title="Town Improvements"><CivicPanel /></Modal>}
      {panel === 'labor' && <Modal title="Labor Office"><LaborPanel /></Modal>}
      {panel === 'bank' && <Modal title="Strap & Lock Safe Bank"><BankPanel /></Modal>}
      {panel === 'help' && <Modal title="How to Play"><HelpPanel /></Modal>}
    </>
  );
}

// ---------------------------------------------------------------------------

function Modal({ title, children }: { title: string; children: React.ReactNode }) {
  const setPanel = useGame((s) => s.setPanel);
  const coarse = useCoarse();
  const close = () => setPanel(null);
  return coarse ? (
    <BottomSheet title={title} onClose={close}>
      {children}
    </BottomSheet>
  ) : (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-3 backdrop-blur-[2px]"
      onClick={close}
    >
      <div
        className="flex max-h-[82vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-amber-200/20 bg-[#161310]/95 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-amber-300">{title}</h2>
          <button
            onClick={close}
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

// Mobile panels render as a bottom-sheet: full-width, bottom-anchored, a
// grab handle you can drag down to dismiss, scrollable body, and a sticky
// thumb-zone Done button. Same children as the desktop modal — only the
// wrapper changes, so no panel content or store wiring moves.
function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [drag, setDrag] = useState(0);
  const startY = useRef<number | null>(null);

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/55 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="animate-sheetUp flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl border-t border-amber-200/25 bg-[#161310]/97 shadow-2xl"
        style={drag ? { transform: `translateY(${drag}px)` } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {/* grab handle — drag down past a threshold to dismiss */}
        <div
          className="flex shrink-0 cursor-grab touch-none flex-col items-center pt-2.5 active:cursor-grabbing"
          onPointerDown={(e) => {
            startY.current = e.clientY;
            try {
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            } catch {
              /* capture is a nicety; drag math uses clientY regardless */
            }
          }}
          onPointerMove={(e) => {
            if (startY.current !== null) setDrag(Math.max(0, e.clientY - startY.current));
          }}
          onPointerUp={() => {
            if (drag > 90) onClose();
            else setDrag(0);
            startY.current = null;
          }}
          onPointerCancel={() => {
            setDrag(0);
            startY.current = null;
          }}
        >
          <div className="h-1.5 w-11 rounded-full bg-white/25" />
          <h2 className="mt-2 px-4 text-center text-xs font-bold uppercase tracking-widest text-amber-300">{title}</h2>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto overscroll-contain px-4 pb-2 pt-2">{children}</div>
        <div className="safe-pb shrink-0 border-t border-white/10 p-3">
          <button
            onClick={onClose}
            className="w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-sm font-bold text-white/85 transition active:scale-[0.98]"
          >
            Done
          </button>
        </div>
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
    { icon: '🪵', name: 'Lumber', count: s.wood },
    { icon: '🪨', name: 'Stone', count: s.stone },
    { icon: '🧱', name: 'Clay', count: s.clay },
    { icon: '◆', name: 'BSWX', count: s.bswx },
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
          <Row k="Passive income" v={`◆${income} / 5s`} />
          <Row k="Harvest bonus" v={`+${Math.floor((s.level - 1) / 2)} per swing`} />
          <Row k="District" v={`${s.legacy.district}`} />
          {s.legacy.tokens > 0 && (
            <Row k="Legacy bonus" v={`✦${s.legacy.tokens} · +${Math.round(s.legacy.tokens * 8)}% income`} />
          )}
        </div>
      </div>

      <SkillsSection />
      <BoonsSection />

      {s.quests['first_foundations']?.status === 'done' && (
        <button
          onClick={() => s.setPanel('civic')}
          className="w-full rounded-xl border border-sky-400/40 bg-sky-500/10 py-2.5 text-xs font-bold text-sky-100 transition hover:bg-sky-500/20"
        >
          🏛️ Town Improvements
        </button>
      )}

      {deriveResidents(s.plots).length > 0 && (
        <button
          onClick={() => s.setPanel('labor')}
          className="w-full rounded-xl border border-amber-400/40 bg-amber-400/10 py-2.5 text-xs font-bold text-amber-100 transition hover:bg-amber-400/20"
        >
          👷 Labor Office
        </button>
      )}

      {s.quests['legacy_restored']?.status === 'done' && (
        <button
          onClick={() => s.setPanel('charter')}
          className="w-full rounded-xl border border-amber-400/50 bg-amber-400/15 py-2.5 text-xs font-bold text-amber-100 transition hover:bg-amber-400/25"
        >
          🏙️ Charter a New District
        </button>
      )}
    </div>
  );
}

function SkillsSection() {
  const skills = useGame((s) => s.skills);
  const skillPoints = useGame((s) => s.skillPoints);
  const spendSkill = useGame((s) => s.spendSkill);
  return (
    <div>
      <h3 className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/50">
        Founder&apos;s Skills
        {skillPoints > 0 && (
          <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
            ★ {skillPoints} to spend
          </span>
        )}
      </h3>
      <div className="space-y-2">
        {SKILLS.map((def) => {
          const lvl = skills[def.id] ?? 0;
          const maxed = lvl >= MAX_SKILL;
          const can = skillPoints > 0 && !maxed;
          return (
            <div key={def.id} className="rounded-lg border border-white/10 bg-white/5 p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  {def.icon} {def.name}
                </span>
                <span className="flex gap-0.5">
                  {Array.from({ length: MAX_SKILL }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-3 rounded-sm ${i < lvl ? 'bg-amber-400' : 'bg-white/15'}`}
                    />
                  ))}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-[10px] text-white/55">
                  {def.desc} <span className="text-amber-200/70">({def.perPoint})</span>
                </span>
                <button
                  disabled={!can}
                  onClick={() => spendSkill(def.id)}
                  className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
                    can
                      ? 'border-amber-400/50 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25'
                      : 'cursor-not-allowed border-white/10 bg-white/5 text-white/35'
                  }`}
                >
                  {maxed ? 'Maxed' : 'Invest ★'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BoonsSection() {
  const quests = useGame((s) => s.quests);
  return (
    <div>
      <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/50">Founder Boons</h3>
      <div className="space-y-1.5">
        {FOUNDER_BOONS.map((b) => {
          const active = boonActive(b.npc, quests);
          return (
            <div
              key={b.npc}
              className={`flex items-center gap-2 rounded-lg border p-2.5 ${
                active ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-white/10 bg-white/[0.03] opacity-60'
              }`}
            >
              <span className="text-lg">{b.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white">{b.name}</div>
                <div className="text-[10px] text-white/55">{b.desc}</div>
              </div>
              <span className={`shrink-0 text-[10px] font-bold ${active ? 'text-emerald-300' : 'text-white/40'}`}>
                {active ? '✓ Active' : 'Locked'}
              </span>
            </div>
          );
        })}
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
  const plot = s.plots.find((p) => p.id === s.selectedPlot && p.building);

  // managing an existing building (walked up + pressed E)
  if (plot?.building) {
    const cfg = BUILDINGS[plot.building];
    const syn = adjacencyInfo(plot.building, plot.x, plot.z, s.plots, plot.id);
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
            <div className="mt-1 text-[11px] text-emerald-300">
              Income: ◆{cfg.income * plot.level} per tick
              {syn.bonus > 0 && <span className="text-amber-300"> · +{Math.round(syn.bonus * 100)}% synergy</span>}
            </div>
          )}
          {syn.parts.length > 0 && (
            <div className="mt-1 text-[10px] text-amber-200/70">
              ✦ Good neighbors: {syn.parts.map((p) => `${p.count}× ${BUILDINGS[p.type].name}`).join(', ')}
            </div>
          )}
        </div>
        {plot.building === 'bank' && (
          <button
            onClick={() => s.setPanel('bank')}
            className="w-full rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-[11px] font-bold text-sky-200 transition hover:bg-sky-500/20"
          >
            🏦 Bank Services
          </button>
        )}
        {plot.building === 'cultural_hall' && (
          <button
            onClick={() => s.hostFestival()}
            disabled={s.festivalCooldown > 0 || s.bswx < 150}
            className={`w-full rounded-lg border px-3 py-2 text-[11px] font-bold transition ${
              s.festivalCooldown > 0 || s.bswx < 150
                ? 'cursor-not-allowed border-white/10 bg-white/5 text-white/35'
                : 'border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-100 hover:bg-fuchsia-500/25'
            }`}
          >
            {s.festivalCooldown > 0 ? `🎉 Festival recovering (${Math.ceil(s.festivalCooldown)}s)` : '🎉 Host a Festival — ◆150'}
          </button>
        )}
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
        <button
          onClick={() => s.rotatePlot(plot.id)}
          className="w-full rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-[11px] font-bold text-sky-200 transition hover:bg-sky-500/20"
        >
          ⟳ Rotate 90°
        </button>
        <button
          onClick={() => s.demolishPlot(plot.id)}
          className="w-full rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-200 transition hover:bg-red-500/20"
        >
          Demolish (refund ~40%)
        </button>
      </div>
    );
  }

  // catalog — choose a building to place freely on the grid
  const unlocked = s.quests['first_foundations']?.status === 'done';
  if (!unlocked) {
    return (
      <div className="text-xs text-white/60">
        Complete <span className="font-semibold text-amber-300">First Foundations</span> to unlock building.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] leading-relaxed text-white/55">
        Place complementary buildings side-by-side for a <b className="text-amber-300">synergy</b> income bonus.
      </p>
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
            onClick={() => s.startPlacing(cfg.id)}
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

const MARKET_ROWS: { type: 'wood' | 'stone' | 'clay' | 'goods'; icon: string; name: string; buyable: boolean }[] = [
  { type: 'wood', icon: '🪵', name: 'Lumber', buyable: true },
  { type: 'stone', icon: '🪨', name: 'Stone', buyable: true },
  { type: 'clay', icon: '🧱', name: 'Clay', buyable: true },
  { type: 'goods', icon: '📦', name: 'Goods', buyable: false },
];

function MarketPanel() {
  const s = useGame();
  const hasGrocery = s.plots.some((p) => p.building === 'grocery' && p.construction === 0);

  if (!hasGrocery) {
    return (
      <div className="text-xs leading-relaxed text-white/60">
        Build a <span className="font-semibold text-amber-300">Grocery</span> to open the exchange.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-white/55">Prices drift each tick. Sell high, buy low.</p>
      {MARKET_ROWS.map(({ type, icon, name, buyable }) => {
        const have = Math.floor(type === 'goods' ? s.goods : s[type]);
        const price = s.marketPrices[type];
        const buyDiscount = 1 - (s.skills.haggle ?? 0) * 0.04; // mirrors HAGGLE_BUY_PER_PT
        const sellMult = (1 + (s.skills.haggle ?? 0) * 0.05) * boonMarketMult(s.quests);
        // mirrors the store's no-arbitrage clamp exactly, per quantity: the ask
        // never dips to/below the bid, so a round trip is always a small loss
        const buyCostFor = (qty: number) =>
          Math.max(Math.ceil(price * 1.25 * qty * buyDiscount), Math.floor(price * qty * sellMult) + 1);
        return (
          <div key={type} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {icon} <span className="font-semibold text-white">{name}</span>
                <span className="ml-2 text-[11px] text-white/45">×{have}</span>
              </span>
              <span className="text-xs font-bold text-amber-300">◆{price.toFixed(1)}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {[1, 10].map((qty) => (
                <button
                  key={`s${qty}`}
                  disabled={have < qty}
                  onClick={() => s.sellResource(type, qty)}
                  className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Sell {qty}
                </button>
              ))}
              <button
                disabled={have < 1}
                onClick={() => s.sellResource(type, have)}
                className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Sell all
              </button>
              {buyable && (
                <span className="ml-auto flex items-center gap-1.5">
                  {[1, 10].map((qty) => (
                    <button
                      key={`b${qty}`}
                      disabled={s.bswx < buyCostFor(qty)}
                      onClick={() => s.buyResource(type as 'wood' | 'stone' | 'clay', qty)}
                      className="rounded-lg border border-sky-400/40 bg-sky-400/10 px-2.5 py-1 text-[11px] font-bold text-sky-200 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Buy {qty} (◆{buyCostFor(qty)})
                    </button>
                  ))}
                </span>
              )}
            </div>
          </div>
        );
      })}

      <Provisions />
    </div>
  );
}

function Provisions() {
  const s = useGame();
  const full = s.stamina >= s.staminaMax;
  return (
    <div className="border-t border-white/10 pt-3">
      <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/50">Provisions</h3>
      <div className="space-y-2">
        {PROVISIONS.map((p) => {
          const available = !p.requires || s.plots.some((pl) => pl.building === p.requires && pl.construction === 0);
          const afford = s.bswx >= p.cost;
          const disabled = !available || !afford || full;
          return (
            <div key={p.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2.5">
              <span className="text-lg">{p.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white">{p.name}</div>
                <div className="text-[10px] text-white/50">
                  {available ? p.desc : `Build the ${BUILDINGS[p.requires!].name} to unlock.`}
                </div>
              </div>
              <button
                disabled={disabled}
                onClick={() => s.buyProvision(p.id)}
                className="shrink-0 rounded-lg border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-200 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {full ? 'Full' : `Eat ◆${p.cost}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function MerchantPanel() {
  const s = useGame();
  const m = s.merchant;
  if (!m) return <div className="text-xs text-white/60">The merchant has packed up and moved on.</div>;
  const trustLabel = m.trust > 1 ? 'Trusts you' : m.trust < -1 ? 'Wary of you' : 'Neutral';
  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-white/60">
        <span className="font-semibold text-white">{m.name}</span> brought mystery crates — one steal, one fair, one
        snake oil. Inspect one free, then gamble. <span className="text-white/40">({trustLabel})</span>
      </p>
      <div className="text-[10px] text-white/45">
        Inspects left: <span className="font-bold text-amber-300">{m.inspectsLeft}</span>
      </div>
      <div className="space-y-2">
        {m.deals.map((d) => {
          const afford = s.bswx >= d.cost;
          const qcolor =
            d.quality === 'steal' ? 'text-emerald-300' : d.quality === 'ripoff' ? 'text-red-300' : 'text-white/80';
          return (
            <div
              key={d.id}
              className={`rounded-xl border p-3 ${d.sold ? 'border-white/5 bg-white/[0.02] opacity-60' : 'border-white/10 bg-white/5'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  {d.mystery && !d.sold ? '❓ Mystery Crate' : <>📦 <span className={qcolor}>{d.label}</span></>}
                </span>
                <span className="text-xs font-bold text-amber-300">◆{d.cost}</span>
              </div>
              {!d.mystery && (
                <div className={`mt-0.5 text-[10px] ${qcolor}`}>
                  {d.quality === 'steal' ? 'A genuine bargain.' : d.quality === 'ripoff' ? 'Looks worthless…' : 'A fair exchange.'}
                </div>
              )}
              <div className="mt-2 flex gap-1.5">
                {d.sold ? (
                  <span className="text-[11px] font-bold text-white/40">Purchased</span>
                ) : (
                  <>
                    {d.mystery && (
                      <button
                        disabled={m.inspectsLeft <= 0}
                        onClick={() => s.inspectDeal(d.id)}
                        className="rounded-lg border border-sky-400/40 bg-sky-400/10 px-2.5 py-1 text-[11px] font-bold text-sky-200 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        🔍 Inspect
                      </button>
                    )}
                    <button
                      disabled={!afford}
                      onClick={() => s.buyDeal(d.id)}
                      className="rounded-lg border border-amber-400/50 bg-amber-400/15 px-3 py-1 text-[11px] font-bold text-amber-200 transition hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {d.mystery ? 'Buy blind' : 'Buy'} ◆{d.cost}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LoanPanel() {
  const s = useGame();
  const loan = s.loan;
  if (loan) {
    const overdue = s.day > loan.dueDay;
    const payable = Math.min(loan.owed, Math.floor(s.bswx));
    return (
      <div className="space-y-3">
        <div className={`rounded-xl border p-3 ${overdue ? 'border-red-400/50 bg-red-500/10' : 'border-amber-400/30 bg-amber-400/5'}`}>
          <div className="text-sm font-bold text-white">Outstanding Debt</div>
          <div className="mt-1 text-2xl font-extrabold text-amber-300">◆{loan.owed}</div>
          <div className="mt-0.5 text-[11px] text-white/60">
            Borrowed ◆{loan.principal} · due day {loan.dueDay}{' '}
            {overdue && <span className="font-bold text-red-300">(OVERDUE — growing every dawn!)</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[50, 100].map((a) => (
            <button
              key={a}
              disabled={s.bswx < 1}
              onClick={() => s.repayLoan(a)}
              className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Repay ◆{a}
            </button>
          ))}
          <button
            disabled={s.bswx < 1}
            onClick={() => s.repayLoan(loan.owed)}
            className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Pay in full (◆{payable})
          </button>
        </div>
        <p className="text-[11px] leading-relaxed text-white/50">
          Miss the due day and the debt grows each dawn — and your reputation falls.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-white/60">
        Fast BSWX at steep rates. Repay before the due day or the debt grows.
      </p>
      <div className="space-y-2">
        {LOAN_TIERS.map((t, i) => {
          const owed = Math.round(t.principal * (1 + t.rate));
          return (
            <button
              key={i}
              onClick={() => s.takeLoan(i)}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-amber-400/50 hover:bg-amber-400/10"
            >
              <div>
                <div className="text-sm font-bold text-white">Borrow ◆{t.principal}</div>
                <div className="text-[10px] text-white/55">Repay ◆{owed} within {t.days} days</div>
              </div>
              <span className="text-[11px] font-bold text-red-300">+{Math.round(t.rate * 100)}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SpeculatorPanel() {
  const s = useGame();
  const offer = s.speculatorOffer;
  if (!offer) return <div className="text-xs text-white/60">The speculator has moved on.</div>;
  return (
    <div className="space-y-3 text-center">
      <div className="text-3xl">🎩</div>
      <p className="text-xs leading-relaxed text-white/75">
        An investor wants your <b className="text-fuchsia-300">{offer.buildingName}</b>. Cash now — but you lose its
        income and a piece of Greenwood.
      </p>
      <div className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-400/10 py-3">
        <div className="text-[10px] uppercase tracking-wider text-fuchsia-200/70">Their Offer</div>
        <div className="text-2xl font-extrabold text-fuchsia-200">◆{offer.amount}</div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => s.declineBuyout()}
          className="flex-1 rounded-xl border border-emerald-400/50 bg-emerald-400/15 py-2.5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/25 active:scale-95"
        >
          ✊ Refuse (+3 rep)
        </button>
        <button
          onClick={() => s.acceptBuyout()}
          className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-bold text-white/70 transition hover:bg-white/10 active:scale-95"
        >
          Sell out (−8 rep)
        </button>
      </div>
    </div>
  );
}

function BoardPanel() {
  const s = useGame();
  const friends = Object.values(s.relationships).filter((v) => v >= 3).length;
  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-white/55">
        Help neighbors for BSWX, rep, and friendship 💛.
        {friends > 0 && (
          <>
            {' '}
            You have <span className="font-semibold text-amber-200">{friends}</span> close{' '}
            {friends === 1 ? 'friend' : 'friends'} so far.
          </>
        )}
      </p>
      {s.requests.length === 0 ? (
        <div className="text-xs text-white/50">Quiet for now. Build cottages to draw neighbors.</div>
      ) : (
        <div className="space-y-2">
          {s.requests.map((r) => {
            const icon = r.kind === 'wood' ? '🪵' : r.kind === 'stone' ? '🪨' : r.kind === 'clay' ? '🧱' : '◆';
            const label = r.kind === 'bswx' ? 'BSWX' : RESOURCE_LABEL[r.kind];
            const have = Math.floor(s[r.kind] as number);
            const rel = s.relationships[r.residentId] ?? 0;
            const can = have >= r.amount;
            return (
              <div key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    {r.residentName}
                    {rel > 0 && <span className="ml-1 text-[10px] text-pink-300">{'❤'.repeat(Math.min(5, rel))}</span>}
                  </span>
                  <span className="text-[10px] text-amber-200">Reward: ◆{r.rewardBswx} · ✦{r.rewardRep}</span>
                </div>
                <div className="mt-0.5 text-[11px] text-white/65">
                  Needs {icon} {r.amount} {label} <span className="text-white/40">(you have {have})</span>
                </div>
                <button
                  disabled={!can}
                  onClick={() => s.fulfillRequest(r.id)}
                  className={`mt-2 w-full rounded-lg border px-3 py-1.5 text-[11px] font-bold transition ${
                    can
                      ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/25'
                      : 'cursor-not-allowed border-white/10 bg-white/5 text-white/35'
                  }`}
                >
                  {can ? `Give ${r.amount} ${label}` : `Need ${r.amount - have} more`}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BankPanel() {
  const s = useGame();
  const bankLevels = s.plots.reduce(
    (sum, p) => (p.building === 'bank' && p.construction === 0 ? sum + p.level : sum),
    0
  );
  const hasBank = bankLevels > 0;
  const rate = Math.min(0.07, 0.03 + Math.max(0, bankLevels - 1) * 0.01); // mirrors store
  const loan = s.loan;
  const depositBtn = 'rounded-lg border border-sky-400/40 bg-sky-400/10 px-2.5 py-1 text-[11px] font-bold text-sky-200 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-30';
  const drawBtn = 'rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-30';
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-sky-400/30 bg-sky-400/5 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white">Community Savings</span>
          <span className="text-lg font-extrabold text-sky-200">◆{Math.floor(s.savings).toLocaleString()}</span>
        </div>
        <div className="mt-0.5 text-[10px] text-white/55">
          {hasBank ? `Earns ${Math.round(rate * 100)}% interest every dawn.` : 'Build a bank to earn interest.'}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[50, 100].map((a) => (
            <button key={`d${a}`} disabled={s.bswx < a} onClick={() => s.deposit(a)} className={depositBtn}>
              Deposit ◆{a}
            </button>
          ))}
          <button disabled={s.bswx < 1} onClick={() => s.deposit(Math.floor(s.bswx))} className={depositBtn}>
            Deposit all
          </button>
          {[50, 100].map((a) => (
            <button key={`w${a}`} disabled={s.savings < a} onClick={() => s.withdraw(a)} className={drawBtn}>
              Withdraw ◆{a}
            </button>
          ))}
          <button disabled={s.savings < 1} onClick={() => s.withdraw(Math.floor(s.savings))} className={drawBtn}>
            Withdraw all
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/50">Fair Loans</h3>
        {loan ? (
          <div className="space-y-2">
            <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-2.5 text-[11px] text-white/70">
              You owe <span className="font-bold text-amber-300">◆{loan.owed}</span> (due day {loan.dueDay}).
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[50, 100].map((a) => (
                <button key={a} disabled={s.bswx < 1} onClick={() => s.repayLoan(a)} className={drawBtn}>
                  Repay ◆{a}
                </button>
              ))}
              <button disabled={s.bswx < 1} onClick={() => s.repayLoan(loan.owed)} className={drawBtn}>
                Pay in full
              </button>
            </div>
          </div>
        ) : !hasBank ? (
          <div className="text-[11px] text-white/50">Operate a bank to borrow on fair, honest terms.</div>
        ) : (
          <div className="space-y-2">
            {BANK_LOAN_TIERS.map((t, i) => {
              const owed = Math.round(t.principal * (1 + t.rate));
              return (
                <button
                  key={i}
                  onClick={() => s.takeBankLoan(i)}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-sky-400/50 hover:bg-sky-400/10"
                >
                  <div>
                    <div className="text-sm font-bold text-white">Borrow ◆{t.principal}</div>
                    <div className="text-[10px] text-white/55">Repay ◆{owed} within {t.days} days</div>
                  </div>
                  <span className="text-[11px] font-bold text-sky-300">+{Math.round(t.rate * 100)}%</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LaborPanel() {
  const s = useGame();
  const population = deriveResidents(s.plots).length;
  const rows = [
    { res: 'wood', icon: '🪵', name: 'Lumber' },
    { res: 'stone', icon: '🪨', name: 'Stone' },
    { res: 'clay', icon: '🧱', name: 'Clay' },
  ] as const;
  if (population === 0) {
    return (
      <div className="text-xs leading-relaxed text-white/60">
        Build <span className="font-semibold text-amber-300">cottages</span> to gain laborers.
      </div>
    );
  }
  const assigned = s.labor.wood + s.labor.stone + s.labor.clay;
  const free = population - assigned;
  const wage = Math.ceil(rows.reduce((sum, r) => sum + s.labor[r.res] * s.marketPrices[r.res], 0));
  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-white/55">
        Assign neighbors to gather materials each tick at the <b>market rate</b>.
      </p>
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px]">
        <span className="text-white/70">
          Available: <b className="text-amber-200">{free}</b> / {population} residents
        </span>
        <span className="text-white/70">
          Wage: <b className="text-amber-300">◆{wage}</b>/tick
        </span>
      </div>
      <div className="space-y-2">
        {rows.map((r) => {
          const n = s.labor[r.res];
          return (
            <div key={r.res} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  {r.icon} {r.name} <span className="text-[11px] font-normal text-white/45">— {n} on the job</span>
                </span>
                <span className="text-[10px] text-amber-200/80">+{n}/tick · ◆{Math.ceil(s.marketPrices[r.res])}/ea</span>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => s.assignLabor(r.res, -1)}
                  disabled={n <= 0}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-bold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  − Pull
                </button>
                <button
                  onClick={() => s.assignLabor(r.res, 1)}
                  disabled={free <= 0}
                  className="rounded-lg border border-amber-400/50 bg-amber-400/15 px-3 py-1 text-[12px] font-bold text-amber-200 transition hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  + Assign
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CivicPanel() {
  const s = useGame();
  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-white/55">Permanent, district-wide upgrades.</p>
      <div className="space-y-2">
        {CIVICS.map((def) => {
          const lvl = s.civics[def.id] ?? 0;
          const maxed = lvl >= def.maxLevel;
          const cost = civicCost(def, lvl);
          const afford = s.bswx >= cost;
          return (
            <div key={def.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  {def.icon} {def.name}
                </span>
                <span className="flex gap-0.5">
                  {Array.from({ length: def.maxLevel }).map((_, i) => (
                    <span key={i} className={`h-1.5 w-3 rounded-sm ${i < lvl ? 'bg-sky-400' : 'bg-white/15'}`} />
                  ))}
                </span>
              </div>
              <div className="mt-0.5 text-[10px] text-white/55">
                {def.desc} <span className="text-sky-200/70">({def.perLevel} / level)</span>
              </div>
              <button
                disabled={maxed || !afford}
                onClick={() => s.buyCivic(def.id)}
                className={`mt-2 w-full rounded-lg border px-3 py-1.5 text-[11px] font-bold transition ${
                  maxed
                    ? 'cursor-default border-amber-400/30 bg-amber-400/5 text-amber-300'
                    : afford
                      ? 'border-sky-400/50 bg-sky-400/15 text-sky-100 hover:bg-sky-400/25'
                      : 'cursor-not-allowed border-white/10 bg-white/5 text-white/35'
                }`}
              >
                {maxed ? '★ Fully improved' : `Improve to Lv ${lvl + 1} — ◆${cost}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CharterPanel() {
  const s = useGame();
  const eligible = s.quests['legacy_restored']?.status === 'done';
  const pop = deriveResidents(s.plots).length;
  const tokens = Math.max(
    1,
    Math.floor(s.totalEarned / 4000) + Math.floor(s.reputation / 40) + Math.floor(pop / 4)
  );
  const curMult = Math.round(s.legacy.tokens * 8);
  const newMult = Math.round((s.legacy.tokens + tokens) * 8);
  return (
    <div className="space-y-3 text-center">
      <div className="text-3xl">🏙️</div>
      <p className="text-xs leading-relaxed text-white/75">
        Reset your town for a permanent <b className="text-amber-200">Legacy</b> boost to all income — forever.
      </p>
      <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 py-3">
        <div className="text-[10px] uppercase tracking-wider text-amber-200/70">Legacy after chartering</div>
        <div className="text-2xl font-extrabold text-amber-300">
          ✦ {s.legacy.tokens + tokens} <span className="text-sm font-semibold text-amber-200">(+{tokens})</span>
        </div>
        <div className="text-[11px] text-white/60">
          Income bonus: +{curMult}% → <span className="font-bold text-emerald-300">+{newMult}%</span>
        </div>
      </div>
      {eligible ? (
        <button
          onClick={() => s.charterDistrict()}
          className="w-full rounded-xl border border-amber-400/50 bg-amber-400/20 py-2.5 text-sm font-bold text-amber-100 transition hover:bg-amber-400/30 active:scale-95"
        >
          ✦ Charter District {s.legacy.district + 1} — resets your town
        </button>
      ) : (
        <div className="text-[11px] text-white/50">
          Finish <span className="text-amber-300">A Legacy Restored</span> to unlock.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function MapPanel() {
  const s = useGame();
  const buildings = s.plots.filter((p) => p.building && p.construction === 0);
  const travel = (x: number, z: number) => {
    s.setPanel(null);
    useGame.setState({ teleportTarget: { x, z }, moveTarget: null, harvesting: null });
  };
  return (
    <div className="flex flex-col items-center gap-3">
      <Minimap size={300} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-white/70">
        <span>⬤ <span className="text-white">You</span></span>
        <span className="text-sky-300">⬤ Founders</span>
        <span className="text-green-900">■ Forest (lumber)</span>
        <span className="text-gray-300">■ Quarry (stone)</span>
        <span className="text-orange-400">■ Riverbank (clay)</span>
        <span className="text-amber-300">■ Buildings / plots</span>
      </div>
      <div className="w-full border-t border-white/10 pt-2">
        <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/50">Fast Travel</h3>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => travel(0, 6)}
            className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[11px] font-bold text-amber-200 transition hover:bg-amber-400/20"
          >
            ⌂ Town Square
          </button>
          {buildings.map((p) => (
            <button
              key={p.id}
              onClick={() => travel(p.x, p.z + 2.6)}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/80 transition hover:bg-white/10"
            >
              {BUILDINGS[p.building!].name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function HelpPanel() {
  const unstuck = useGame((s) => s.unstuck);
  const setPanel = useGame((s) => s.setPanel);
  const coarse = useCoarse();

  const rows: [React.ReactNode, string][] = coarse
    ? [
        ['🕹️ Move', 'Left-thumb stick, or tap the ground'],
        ['💨 Sprint', 'Toggle — faster, burns stamina'],
        ['✊ Act', 'Harvest, talk, trade, manage'],
        ['🤏 Zoom', 'Pinch with two fingers'],
        ['▾ Tabs', 'Build · Quests · Items · Market · Map'],
      ]
    : [
        [
          <>
            <Kbd>WASD</Kbd> / click
          </>,
          'Move · hold Shift to sprint',
        ],
        [<Kbd>E</Kbd>, 'Interact — harvest, talk, manage'],
        [<Kbd>B</Kbd>, 'Build — place, R to rotate'],
        [<Kbd>Q</Kbd>, 'Quests'],
        [<Kbd>I</Kbd>, 'Inventory, skills & boons'],
        [<Kbd>T</Kbd>, 'Market & provisions'],
        [<Kbd>M</Kbd>, 'Map & fast-travel'],
      ];

  return (
    <div className="space-y-4 text-xs text-white/80">
      <div>
        <h3 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">Goal</h3>
        <p className="leading-relaxed text-white/70">
          Harvest, build, and trade to grow Greenwood&apos;s wealth. Follow O.W. Gurley&apos;s quests to restore the
          district.
        </p>
      </div>
      <div>
        <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">Controls</h3>
        <div className="space-y-1.5">
          {rows.map(([k, v], i) => (
            <div key={i} className="flex items-baseline gap-3">
              <span className="flex min-w-[92px] shrink-0 items-center gap-1.5 font-semibold text-white/90">{k}</span>
              <span className="text-white/60">{v}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-white/45">
        Founders arrive as you finish main quests · blue marker = new quest, gold = ready to turn in · your town
        autosaves.
      </p>
      <div className="border-t border-white/10 pt-3">
        <p className="mb-2 text-[11px] text-white/60">Stuck inside a building? Teleport to the town square.</p>
        <button
          onClick={() => {
            unstuck();
            setPanel(null);
          }}
          className="w-full rounded-xl border border-amber-400/50 bg-amber-400/15 py-2.5 text-center text-xs font-bold text-amber-100 shadow-md transition hover:bg-amber-400/25 active:scale-95"
        >
          🛟 Teleport to Town Square
        </button>
      </div>
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
