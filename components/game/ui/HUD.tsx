'use client';

import React, { useMemo } from 'react';
import { useGame } from '../../../src/game/store';
import { goalAt, QUEST_BY_ID, xpForLevel } from '../../../src/game/data';
import { deriveResidents } from '../../../src/game/residents';
import Minimap from './Minimap';

export default function HUD() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      <FortuneTint />
      <TopBar />
      <QuestTracker />
      <LoanBadge />
      <HappeningsStack />
      <div className="absolute right-3 top-16 hidden sm:block">
        <Minimap size={148} />
      </div>
      <InteractPrompt />
      <HarvestPop />
      <GoalTracker />
      <PlacementControls />
      <Toasts />
      <HotkeyBar />
      <MobileControls />
      <WelcomeBackModal />
    </div>
  );
}

// ---------------------------------------------------------------------------

function StatPill({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 backdrop-blur-sm"
      title={label}
    >
      <span style={{ color }} className="text-sm leading-none">{icon}</span>
      <span className="text-xs font-semibold text-white sm:text-sm">{value}</span>
    </div>
  );
}

function TopBar() {
  const name = useGame((s) => s.appearance.name);
  const bswx = useGame((s) => s.bswx);
  const wood = useGame((s) => s.wood);
  const stone = useGame((s) => s.stone);
  const clay = useGame((s) => s.clay);
  const food = useGame((s) => s.food);
  const goods = useGame((s) => s.goods);
  const circulation = useGame((s) => s.circulation);
  const townFed = useGame((s) => s.townFed);
  const plots = useGame((s) => s.plots);
  const population = useMemo(() => deriveResidents(plots).length, [plots]);
  const rep = useGame((s) => s.reputation);
  const level = useGame((s) => s.level);
  const xp = useGame((s) => s.xp);
  const stamina = useGame((s) => s.stamina);
  const staminaMax = useGame((s) => s.staminaMax);
  const day = useGame((s) => s.day);
  const timeOfDay = useGame((s) => s.timeOfDay);
  const muted = useGame((s) => s.muted);
  const toggleMute = useGame((s) => s.toggleMute);
  const setPanel = useGame((s) => s.setPanel);

  const hours = Math.floor(timeOfDay * 24);
  const mins = Math.floor((timeOfDay * 24 - hours) * 60);
  const clock = `${hours.toString().padStart(2, '0')}:${(Math.floor(mins / 10) * 10).toString().padStart(2, '0')}`;
  const isNight = timeOfDay < 0.27 || timeOfDay > 0.73;
  const xpNeed = xpForLevel(level);

  return (
    <div className="pointer-events-auto absolute left-0 right-0 top-0 flex flex-wrap items-center gap-1.5 p-2 sm:gap-2 sm:p-3">
      <StatPill icon="◆" value={bswx.toLocaleString()} label="BSWX — Black Wall Street Exchange" color="#ffd54f" />
      <StatPill icon="🪵" value={String(wood)} label="Lumber" color="#a87b4f" />
      <StatPill icon="🪨" value={String(stone)} label="Stone" color="#aeb6bf" />
      <StatPill icon="🧱" value={String(clay)} label="Clay" color="#c4663d" />
      <StatPill
        icon="🌾"
        value={String(Math.floor(food))}
        label={townFed ? 'Food — gardens feed your residents' : 'Food — GREENWOOD IS HUNGRY!'}
        color={townFed ? '#a3d977' : '#f87171'}
      />
      {goods > 0 && <StatPill icon="📦" value={String(Math.floor(goods))} label="Crafted goods — sold by your commerce" color="#c9a227" />}
      {population > 0 && <StatPill icon="👪" value={String(population)} label="Population — residents of Greenwood" color="#e8b4f8" />}
      <StatPill icon="✦" value={String(rep)} label="Reputation" color="#7dd3fc" />
      {circulation > 1 && (
        <StatPill
          icon="⟳"
          value={`×${circulation.toFixed(2)}`}
          label="Circulation — every Greenwood hand the dollar passes through multiplies it"
          color="#6ee7b7"
        />
      )}

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-black/55 px-2.5 py-1.5 backdrop-blur-sm">
          <div className="max-w-[140px] truncate text-[10px] font-bold text-amber-100/90">{name}</div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wide text-amber-300">LV {level}</span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/15 sm:w-24">
              <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${Math.min(100, (xp / xpNeed) * 100)}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wide text-emerald-300">STA</span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/15 sm:w-24">
              <div
                className={`h-full rounded-full transition-all ${stamina < 15 ? 'bg-red-400' : 'bg-emerald-400'}`}
                style={{ width: `${(stamina / staminaMax) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/55 px-2.5 py-1.5 text-center backdrop-blur-sm">
          <div className="text-[10px] font-semibold text-white/70">DAY {day}</div>
          <div className="text-xs font-bold text-white">{isNight ? '🌙' : '☀️'} {clock}</div>
        </div>
        <button
          onClick={toggleMute}
          className="rounded-lg border border-white/10 bg-black/55 px-2.5 py-2.5 text-sm backdrop-blur-sm transition hover:bg-black/75"
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <button
          onClick={() => setPanel('help')}
          className="hidden rounded-lg border border-white/10 bg-black/55 px-2.5 py-2.5 text-sm backdrop-blur-sm transition hover:bg-black/75 sm:block"
          title="Help (H)"
        >
          ❓
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function QuestTracker() {
  const trackedQuest = useGame((s) => s.trackedQuest);
  const quests = useGame((s) => s.quests);
  const setPanel = useGame((s) => s.setPanel);

  if (!trackedQuest) return null;
  const def = QUEST_BY_ID[trackedQuest];
  const prog = quests[trackedQuest];
  if (!def || !prog || (prog.status !== 'active' && prog.status !== 'ready')) {
    // show hint for available quest
    if (prog?.status === 'available') {
      return (
        <div className="pointer-events-auto absolute left-2 top-16 max-w-[230px] rounded-lg border border-sky-400/30 bg-black/60 p-2.5 backdrop-blur-sm sm:left-3 sm:top-20 sm:max-w-[260px]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-300">New Quest Available</div>
          <div className="mt-0.5 text-xs font-semibold text-white">{def.title}</div>
          <div className="mt-0.5 text-[11px] text-white/60">Find the quest giver — look for the blue marker.</div>
        </div>
      );
    }
    return null;
  }

  return (
    <button
      onClick={() => setPanel('quests')}
      className="pointer-events-auto absolute left-2 top-16 max-w-[230px] rounded-lg border border-amber-400/30 bg-black/60 p-2.5 text-left backdrop-blur-sm transition hover:border-amber-400/60 sm:left-3 sm:top-20 sm:max-w-[260px]"
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
          {def.line === 'main' ? 'Main Quest' : 'Side Quest'}
        </span>
        {prog.status === 'ready' && (
          <span className="rounded bg-amber-400/20 px-1 text-[9px] font-bold text-amber-300">TURN IN</span>
        )}
      </div>
      <div className="mt-0.5 text-xs font-semibold text-white sm:text-sm">{def.title}</div>
      <div className="mt-1 space-y-0.5">
        {def.objectives.map((o, i) => {
          const done = prog.progress[i] >= o.amount;
          return (
            <div key={i} className={`text-[11px] ${done ? 'text-emerald-300 line-through' : 'text-white/75'}`}>
              {done ? '✓' : '•'} {o.label}
              {o.amount > 1 && ` (${prog.progress[i]}/${o.amount})`}
            </div>
          );
        })}
      </div>
      {prog.status === 'ready' && (
        <div className="mt-1 text-[11px] font-semibold text-amber-300">Return to the quest giver!</div>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------

function InteractPrompt() {
  const target = useGame((s) => s.interactTarget);
  const harvesting = useGame((s) => s.harvesting);
  const dialogue = useGame((s) => s.dialogue);

  if (dialogue) return null;

  if (harvesting) {
    return (
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 sm:bottom-24">
        <div className="w-44 overflow-hidden rounded-full border border-amber-300/40 bg-black/60 backdrop-blur-sm">
          <div
            className="h-2.5 bg-gradient-to-r from-amber-400 to-yellow-300"
            style={{ width: `${Math.min(100, harvesting.progress * 100)}%` }}
          />
        </div>
      </div>
    );
  }

  if (!target) return null;
  return (
    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 sm:bottom-24">
      <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/65 px-3 py-1.5 backdrop-blur-sm">
        <kbd className="hidden rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-bold text-white sm:inline">E</kbd>
        <span className="text-xs text-white">
          <span className="font-semibold text-amber-300">{target.verb}</span> — {target.label}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

const TOAST_STYLE: Record<string, string> = {
  info: 'border-white/15 text-white/90',
  reward: 'border-emerald-400/40 text-emerald-200',
  quest: 'border-amber-400/40 text-amber-200',
  warn: 'border-red-400/40 text-red-200',
};

function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <div className="absolute bottom-44 left-1/2 flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-1 px-4 sm:bottom-36">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-toastIn rounded-lg border bg-black/70 px-3 py-1.5 text-xs font-medium backdrop-blur-sm ${TOAST_STYLE[t.kind]}`}
        >
          {t.icon && <span className="mr-1.5">{t.icon}</span>}
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

function HotkeyBar() {
  const setPanel = useGame((s) => s.setPanel);
  const panel = useGame((s) => s.panel);
  const quests = useGame((s) => s.quests);
  const hasReady = Object.values(quests).some((q) => q.status === 'ready');

  const items: { key: string; label: string; panel: 'quests' | 'inventory' | 'build' | 'map' | 'market' | 'help'; badge?: boolean }[] = [
    { key: 'B', label: 'Build', panel: 'build' },
    { key: 'Q', label: 'Quests', panel: 'quests', badge: hasReady },
    { key: 'I', label: 'Inventory', panel: 'inventory' },
    { key: 'T', label: 'Market', panel: 'market' },
    { key: 'M', label: 'Map', panel: 'map' },
    { key: 'H', label: 'Help', panel: 'help' },
  ];

  return (
    <div className="pointer-events-auto absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 sm:bottom-3 sm:gap-2">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => setPanel(panel === it.panel ? null : it.panel)}
          className={`relative rounded-lg border px-2.5 py-1.5 text-xs font-semibold backdrop-blur-sm transition sm:px-3.5 sm:py-2 ${
            panel === it.panel
              ? 'border-amber-400/60 bg-amber-400/20 text-amber-200'
              : 'border-white/10 bg-black/55 text-white/85 hover:bg-black/75'
          }`}
        >
          <span className="mr-1 hidden rounded bg-white/15 px-1 text-[9px] sm:inline">{it.key}</span>
          {it.label}
          {it.badge && (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
          )}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile: virtual joystick (left) + interact button (right)
// ---------------------------------------------------------------------------

function MobileControls() {
  const target = useGame((s) => s.interactTarget);
  const interact = useGame((s) => s.interact);

  return (
    <div className="sm:hidden">
      {target && (
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            interact();
          }}
          className="pointer-events-auto absolute bottom-16 right-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-400/60 bg-black/60 text-xl font-bold text-amber-300 backdrop-blur-sm active:scale-95"
        >
          {target.verb === 'Talk'
            ? '💬'
            : target.verb === 'Collect'
              ? '⚡'
              : target.verb === 'Build' || target.verb === 'Manage'
                ? '⚒️'
                : '✊'}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Happenings stack — every active timed thing (event / fortune / merchant /
// speculator) shown top-center with its own countdown.
// ---------------------------------------------------------------------------

type Tone = 'amber' | 'emerald' | 'red' | 'sky' | 'fuchsia';
const TONE: Record<Tone, { border: string; text: string; bar: string }> = {
  amber: { border: 'border-amber-300/50', text: 'text-amber-200', bar: 'bg-amber-400' },
  emerald: { border: 'border-emerald-300/50', text: 'text-emerald-200', bar: 'bg-emerald-400' },
  red: { border: 'border-red-400/60', text: 'text-red-200', bar: 'bg-red-400' },
  sky: { border: 'border-sky-300/50', text: 'text-sky-200', bar: 'bg-sky-400' },
  fuchsia: { border: 'border-fuchsia-300/50', text: 'text-fuchsia-200', bar: 'bg-fuchsia-400' },
};

interface Happening {
  key: string;
  icon: string;
  title: string;
  sub: string;
  secs: number;
  pct: number;
  tone: Tone;
  pulse?: boolean;
}

function HappeningsStack() {
  const ev = useGame((s) => s.activeEvent);
  const fortune = useGame((s) => s.fortune);
  const merchant = useGame((s) => s.merchant);
  const spec = useGame((s) => s.speculatorOffer);

  const rows: Happening[] = [];
  const pct = (t: number, d: number) => Math.max(0, Math.min(100, (t / d) * 100));
  if (ev)
    rows.push({ key: 'ev', icon: '⚡', title: ev.title, sub: ev.hint, secs: Math.ceil(ev.timeLeft), pct: pct(ev.timeLeft, ev.duration), tone: 'amber', pulse: true });
  if (fortune)
    rows.push({ key: 'fortune', icon: fortune.icon, title: fortune.label, sub: fortune.desc, secs: Math.ceil(fortune.timeLeft), pct: pct(fortune.timeLeft, fortune.duration), tone: fortune.good ? 'emerald' : 'red', pulse: !fortune.good });
  if (merchant)
    rows.push({ key: 'merch', icon: '🛒', title: `${merchant.name} — Trader`, sub: 'Deals at the plaza — go trade!', secs: Math.ceil(merchant.timeLeft), pct: pct(merchant.timeLeft, merchant.duration), tone: 'sky' });
  if (spec)
    rows.push({ key: 'spec', icon: '🎩', title: "Speculator's Offer", sub: `Eyeing your ${spec.buildingName}`, secs: Math.ceil(spec.timeLeft), pct: pct(spec.timeLeft, spec.duration), tone: 'fuchsia', pulse: true });

  if (rows.length === 0) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-16 w-[min(90vw,330px)] -translate-x-1/2 space-y-1.5">
      {rows.map((r) => {
        const c = TONE[r.tone];
        return (
          <div key={r.key} className={`rounded-xl border ${c.border} bg-black/70 px-3 py-1.5 backdrop-blur-sm ${r.pulse ? 'animate-eventPulse' : ''}`}>
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">{r.icon}</span>
              <div className="min-w-0 flex-1">
                <div className={`truncate text-xs font-bold ${c.text}`}>{r.title}</div>
                <div className="truncate text-[10px] text-white/65">{r.sub}</div>
              </div>
              <span className={`text-sm font-extrabold tabular-nums ${c.text}`}>{r.secs}s</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/15">
              <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${r.pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Loan-shark debt badge — sits under the quest tracker, reddens when overdue.
function LoanBadge() {
  const loan = useGame((s) => s.loan);
  const day = useGame((s) => s.day);
  const setPanel = useGame((s) => s.setPanel);
  if (!loan) return null;
  const overdue = day > loan.dueDay;
  return (
    <button
      onClick={() => setPanel('loan')}
      className={`pointer-events-auto absolute left-2 top-[148px] rounded-lg border px-2.5 py-1.5 text-left backdrop-blur-sm transition sm:left-3 sm:top-44 ${
        overdue ? 'animate-eventPulse border-red-400/60 bg-red-500/20' : 'border-amber-400/40 bg-black/60 hover:bg-black/75'
      }`}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-red-300">{overdue ? '⚠ Debt Overdue!' : '🪙 Loan Shark Debt'}</div>
      <div className="text-xs font-bold text-white">
        ◆{loan.owed} <span className="font-normal text-white/50">· due day {loan.dueDay}</span>
      </div>
    </button>
  );
}

// Persistent "always an objective" town-goal tracker (bottom-center).
function GoalTracker() {
  const goalIndex = useGame((s) => s.goalIndex);
  const reputation = useGame((s) => s.reputation);
  const totalEarned = useGame((s) => s.totalEarned);
  const level = useGame((s) => s.level);
  const plots = useGame((s) => s.plots);
  const placing = useGame((s) => s.placing !== null);
  if (placing) return null;

  const goal = goalAt(goalIndex);
  let val = 0;
  switch (goal.kind) {
    case 'buildings':
      val = plots.filter((p) => p.building && p.construction === 0).length;
      break;
    case 'population':
      val = deriveResidents(plots).length;
      break;
    case 'reputation':
      val = reputation;
      break;
    case 'earned':
      val = totalEarned;
      break;
    case 'level':
      val = level;
      break;
  }
  const pct = Math.max(0, Math.min(100, (val / goal.target) * 100));
  return (
    <div className="pointer-events-none absolute bottom-14 left-1/2 w-[min(90vw,300px)] -translate-x-1/2 sm:bottom-16">
      <div className="rounded-xl border border-amber-300/30 bg-black/65 px-3 py-1.5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm leading-none">🎯</span>
          <div className="min-w-0 flex-1 truncate text-[11px] font-semibold text-amber-100">{goal.label}</div>
          <span className="text-[10px] font-bold tabular-nums text-amber-300">
            {Math.min(val, goal.target).toLocaleString()}/{goal.target.toLocaleString()}
          </span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

// Rotate / Place / Cancel controls shown while placing a building.
function PlacementControls() {
  const placing = useGame((s) => s.placing);
  const rotate = useGame((s) => s.rotatePlacing);
  const confirm = useGame((s) => s.confirmPlacing);
  const cancel = useGame((s) => s.cancelPlacing);
  if (!placing) return null;
  return (
    <div className="pointer-events-auto absolute bottom-24 left-1/2 flex -translate-x-1/2 items-center gap-2 sm:bottom-28">
      <button
        onClick={cancel}
        className="rounded-xl border border-white/20 bg-black/70 px-3 py-2 text-xs font-bold text-white/80 backdrop-blur-sm transition active:scale-95"
      >
        ✕ Cancel
      </button>
      <button
        onClick={rotate}
        className="rounded-xl border border-sky-400/50 bg-sky-500/20 px-3 py-2 text-xs font-bold text-sky-100 backdrop-blur-sm transition active:scale-95"
      >
        ⟳ Rotate
      </button>
      <button
        onClick={confirm}
        disabled={!placing.valid}
        className={`rounded-xl border px-4 py-2 text-xs font-bold backdrop-blur-sm transition active:scale-95 ${
          placing.valid
            ? 'border-emerald-400/60 bg-emerald-500/25 text-emerald-100'
            : 'cursor-not-allowed border-white/15 bg-white/5 text-white/40'
        }`}
      >
        ✓ Place
      </button>
    </div>
  );
}

// Red vignette while a bad fortune (panic / blight) grips the town.
function FortuneTint() {
  const fortune = useGame((s) => s.fortune);
  if (!fortune || fortune.good) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ boxShadow: 'inset 0 0 160px 50px rgba(130,22,22,0.34)' }}
    />
  );
}

// ---------------------------------------------------------------------------
// Floating "+N" reward number that pops above the harvest bar on each swing.
// ---------------------------------------------------------------------------

const RES_ICON: Record<string, string> = { wood: '🪵', stone: '🪨', clay: '🧱' };

function HarvestPop() {
  const pop = useGame((s) => s.harvestPop);
  if (!pop) return null;
  return (
    <div className="absolute bottom-44 left-1/2 sm:bottom-36">
      <div
        key={pop.id}
        className={`animate-popUp whitespace-nowrap font-extrabold drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)] ${
          pop.crit ? 'text-2xl text-amber-300' : 'text-lg text-emerald-200'
        }`}
      >
        {pop.crit && <span className="mr-1">RICH VEIN!</span>}+{pop.amount} {RES_ICON[pop.type]}
        {pop.combo >= 3 && (
          <span className="ml-1.5 align-middle text-xs font-bold text-amber-300/90">×{pop.combo}</span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Welcome-back modal — offline earnings payout on load.
// ---------------------------------------------------------------------------

function WelcomeBackModal() {
  const wb = useGame((s) => s.welcomeBack);
  const collect = useGame((s) => s.collectWelcomeBack);
  if (!wb) return null;
  const h = Math.floor(wb.seconds / 3600);
  const m = Math.floor((wb.seconds % 3600) / 60);
  const away = h > 0 ? `${h}h ${m}m` : `${Math.max(1, m)}m`;
  const amount = wb.bswx.toLocaleString();
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="animate-scaleIn w-full max-w-xs rounded-2xl border border-amber-300/30 bg-[#161310]/95 p-5 text-center shadow-2xl">
        <div className="text-3xl">🌅</div>
        <h2 className="mt-2 text-sm font-bold uppercase tracking-widest text-amber-300">Welcome Back</h2>
        <p className="mt-1 text-xs leading-relaxed text-white/70">
          While you were away <span className="font-semibold text-white">{away}</span>, Greenwood&apos;s businesses kept
          the dollar circulating.
        </p>
        <div className="my-4 rounded-xl border border-amber-400/30 bg-amber-400/10 py-3">
          <div className="text-[10px] uppercase tracking-wider text-amber-200/70">Earnings while away</div>
          <div className="text-2xl font-extrabold text-amber-300">◆{amount}</div>
        </div>
        <button
          onClick={collect}
          className="w-full rounded-xl border border-amber-400/50 bg-amber-400/20 py-2.5 text-sm font-bold text-amber-100 transition hover:bg-amber-400/30 active:scale-95"
        >
          Collect ◆{amount}
        </button>
      </div>
    </div>
  );
}
