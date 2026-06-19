'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../../../src/game/store';
import { adjacencyInfo, goalAt, QUEST_BY_ID, xpForLevel } from '../../../src/game/data';
import { deriveResidents } from '../../../src/game/residents';
import { clearTouchMove, setTouchMove, setTouchSprint } from '../../../src/game/touchControls';
import Minimap from './Minimap';
import { useCoarse } from './useCoarse';

// Two fully separate HUD trees. Touch devices get a ground-up mobile layout
// (TouchHUD); desktop keeps its original chrome verbatim (DesktopHUD). The
// runtime `coarse` flag chooses — we never CSS-shrink the desktop HUD onto a
// phone.
export default function HUD() {
  const coarse = useCoarse();
  return (
    <>
      {/* headless — pinch-to-zoom works on any touch-capable device, even a
          touchscreen laptop that reports a fine primary pointer */}
      <PinchZoom />
      {coarse ? <TouchHUD /> : <DesktopHUD />}
    </>
  );
}

function DesktopHUD() {
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
      <PlacementButtons />
      <Toasts />
      <HotkeyBar />
      <WelcomeBackModal />
      <FounderArrival />
    </div>
  );
}

// Brief celebratory banner when a new founder joins the town.
function FounderArrival() {
  const fa = useGame((s) => s.founderArrival);
  if (!fa) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
      <div className="animate-scaleIn rounded-2xl border border-amber-300/40 bg-[#161310]/90 px-7 py-4 text-center shadow-2xl backdrop-blur-sm">
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300/80">✦ A Founder Arrives ✦</div>
        <div className="mt-1.5 text-xl font-extrabold text-amber-100">{fa.name}</div>
        <div className="text-[11px] uppercase tracking-wider text-white/55">{fa.title}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function StatPill({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <div
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 backdrop-blur-sm"
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
  const legacy = useGame((s) => s.legacy);
  const townFed = useGame((s) => s.townFed);
  const plots = useGame((s) => s.plots);
  const population = useMemo(() => deriveResidents(plots).length, [plots]);
  const rep = useGame((s) => s.reputation);
  const level = useGame((s) => s.level);
  const xp = useGame((s) => s.xp);
  const stamina = useGame((s) => s.stamina);
  const staminaMax = useGame((s) => s.staminaMax);
  const skillPoints = useGame((s) => s.skillPoints);
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
    <div className="safe-pt pointer-events-auto absolute left-0 right-0 top-0 flex flex-nowrap items-start gap-1.5 p-2 sm:gap-2 sm:p-3">
      <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto sm:flex-wrap sm:gap-2">
      <StatPill icon="◆" value={bswx.toLocaleString()} label="BSWX" color="#ffd54f" />
      <StatPill icon="🪵" value={String(wood)} label="Lumber" color="#a87b4f" />
      <StatPill icon="🪨" value={String(stone)} label="Stone" color="#aeb6bf" />
      <StatPill icon="🧱" value={String(clay)} label="Clay" color="#c4663d" />
      <StatPill
        icon="🌾"
        value={String(Math.floor(food))}
        label={townFed ? 'Food' : 'Food — town is hungry!'}
        color={townFed ? '#a3d977' : '#f87171'}
      />
      {goods > 0 && <StatPill icon="📦" value={String(Math.floor(goods))} label="Goods" color="#c9a227" />}
      {population > 0 && <StatPill icon="👪" value={String(population)} label="Population" color="#e8b4f8" />}
      <StatPill icon="✦" value={String(rep)} label="Reputation" color="#7dd3fc" />
      {circulation > 1 && (
        <StatPill icon="⟳" value={`×${circulation.toFixed(2)}`} label="Circulation multiplier" color="#6ee7b7" />
      )}
      {(legacy.tokens > 0 || legacy.district > 1) && (
        <StatPill
          icon="🏙"
          value={`D${legacy.district}${legacy.tokens > 0 ? ` ✦+${Math.round(legacy.tokens * 8)}%` : ''}`}
          label="District & Legacy bonus"
          color="#f0b429"
        />
      )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-black/55 px-2.5 py-1.5 backdrop-blur-sm">
          <div className="max-w-[140px] truncate text-[10px] font-bold text-amber-100/90">{name}</div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wide text-amber-300">LV {level}</span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/15 sm:w-24">
              <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${Math.min(100, (xp / xpNeed) * 100)}%` }} />
            </div>
            {skillPoints > 0 && (
              <button
                onClick={() => setPanel('inventory')}
                title="Spend skill points"
                className="animate-eventPulse rounded-full bg-amber-400/25 px-1.5 py-0.5 text-[9px] font-bold text-amber-200"
              >
                ★{skillPoints}
              </button>
            )}
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
          <div className="mt-0.5 text-[11px] text-white/60">Find the blue marker.</div>
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
    <div className="pointer-events-auto absolute bottom-2 left-1/2 hidden -translate-x-1/2 gap-1.5 sm:bottom-3 sm:flex sm:gap-2">
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
// Touch controls — virtual joystick, contextual action button, sprint toggle,
// headless pinch-zoom. Rendered only inside TouchHUD (the runtime `coarse`
// branch), so on desktop they aren't in the DOM at all and ground taps flow
// straight through to click-to-move.
// ---------------------------------------------------------------------------

const VERB_ICON: Record<string, string> = {
  Talk: '💬',
  Collect: '⚡',
  Read: '📋',
  Trade: '🛒',
  Build: '⚒️',
  Manage: '⚒️',
  Chop: '🪓',
  Mine: '⛏️',
  Dig: '🥄',
};

// ---------------------------------------------------------------------------
// TOUCH HUD — the dedicated phone layout. Five single-owner regions so nothing
// collides: a fixed top stack (identity + resource ribbon + ambient goal, then
// the happenings banner, then the quest/loan rail), a bottom-center status
// column, a fixed bottom tab bar, and the joystick / action / sprint thumb
// controls (joystick + action + sprint hidden while aiming a building so the
// ground stays tappable for tap-to-place). Pinch-zoom runs headless.
// ---------------------------------------------------------------------------

function TouchHUD() {
  const placing = useGame((s) => s.placing !== null);
  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      <FortuneTint />
      <MobileTopStack />
      <TouchStatusColumn />
      <MobileHarvestPop />
      {!placing && <Joystick />}
      {!placing && <ActionButton />}
      {!placing && <SprintButton />}
      <BottomNav />
      <WelcomeBackModal />
      <FounderArrival />
    </div>
  );
}

// One fixed, flow-laid top container — the bar, the happenings banner, and the
// quest/loan rail stack in document order with real gaps, so they can never
// overlap regardless of safe-area or how many objectives a quest has.
function MobileTopStack() {
  const placing = useGame((s) => s.placing !== null);
  return (
    <div className="safe-pt pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-1.5">
      <MobileTopBar />
      <HappeningsBanner />
      {!placing && (
        <div className="px-2">
          <MobileQuestLoan />
        </div>
      )}
    </div>
  );
}

// Solid top bar: identity (name + LV/STA) and day/clock on row 1, a fixed
// 5-cell resource ribbon on row 2 (tap → Inventory), an ambient goal line
// below. No horizontal scroll — primary numbers are always visible.
function MobileTopBar() {
  const name = useGame((s) => s.appearance.name);
  const bswx = useGame((s) => s.bswx);
  const wood = useGame((s) => s.wood);
  const stone = useGame((s) => s.stone);
  const clay = useGame((s) => s.clay);
  const food = useGame((s) => s.food);
  const townFed = useGame((s) => s.townFed);
  const level = useGame((s) => s.level);
  const xp = useGame((s) => s.xp);
  const stamina = useGame((s) => s.stamina);
  const staminaMax = useGame((s) => s.staminaMax);
  const skillPoints = useGame((s) => s.skillPoints);
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

  const cells = [
    { icon: '◆', value: bswx.toLocaleString(), color: '#ffd54f' },
    { icon: '🌾', value: String(Math.floor(food)), color: townFed ? '#a3d977' : '#f87171', warn: !townFed },
    { icon: '🪵', value: String(wood), color: '#a87b4f' },
    { icon: '🪨', value: String(stone), color: '#aeb6bf' },
    { icon: '🧱', value: String(clay), color: '#c4663d' },
  ];

  return (
    <div className="pointer-events-auto border-b border-white/10 bg-[#12100c]/92 backdrop-blur-md">
      <div className="flex items-center gap-2 px-2.5 pt-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[11px] font-bold text-amber-100/90">{name}</span>
            {skillPoints > 0 && (
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  setPanel('inventory');
                }}
                aria-label="Spend skill points"
                className="animate-eventPulse shrink-0 rounded-full bg-amber-400/25 px-1.5 py-0.5 text-[9px] font-bold text-amber-200"
              >
                ★{skillPoints}
              </button>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-amber-300">LV{level}</span>
            <div className="h-1 w-full max-w-[64px] overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(100, (xp / xpNeed) * 100)}%` }} />
            </div>
            <span className="ml-0.5 text-[9px] font-bold text-emerald-300">STA</span>
            <div className="h-1 w-full max-w-[64px] overflow-hidden rounded-full bg-white/15">
              <div
                className={`h-full rounded-full ${stamina < 15 ? 'bg-red-400' : 'bg-emerald-400'}`}
                style={{ width: `${(stamina / staminaMax) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[9px] font-semibold text-white/65">DAY {day}</div>
          <div className="text-[11px] font-bold text-white">
            {isNight ? '🌙' : '☀️'} {clock}
          </div>
        </div>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            toggleMute();
          }}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40 text-base"
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
      <button
        onPointerDown={(e) => {
          e.preventDefault();
          setPanel('inventory');
        }}
        aria-label="Open inventory"
        className="mt-1.5 flex w-full divide-x divide-white/10 border-t border-white/10"
      >
        {cells.map((c, i) => (
          <span
            key={i}
            className={`flex flex-1 items-center justify-center gap-1 py-1.5 ${c.warn ? 'animate-eventPulse' : ''}`}
          >
            <span style={{ color: c.color }} className="text-[13px] leading-none">
              {c.icon}
            </span>
            <span className="text-xs font-bold tabular-nums text-white">{c.value}</span>
          </span>
        ))}
      </button>
      <GoalMini />
    </div>
  );
}

// Ambient town-goal line (moved out of the action zone into the top bar).
function GoalMini() {
  const goalIndex = useGame((s) => s.goalIndex);
  const reputation = useGame((s) => s.reputation);
  const totalEarned = useGame((s) => s.totalEarned);
  const level = useGame((s) => s.level);
  const plots = useGame((s) => s.plots);
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
    <div className="flex items-center gap-2 border-t border-white/10 px-2.5 py-1">
      <span className="text-[11px] leading-none">🎯</span>
      <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-amber-100/80">{goal.label}</span>
      <span className="text-[9px] font-bold tabular-nums text-amber-300/90">
        {Math.min(val, goal.target).toLocaleString()}/{goal.target.toLocaleString()}
      </span>
      <div className="h-1 w-10 overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Transient happenings collapsed to ONE banner (+N counter) below the bar.
function HappeningsBanner() {
  const rows = useHappenings();
  if (rows.length === 0) return null;
  const r = rows[0];
  const c = TONE[r.tone];
  return (
    <div className="px-2">
      <div
        className={`pointer-events-none rounded-xl border ${c.border} bg-black/75 px-3 py-1.5 backdrop-blur-sm ${
          r.pulse ? 'animate-eventPulse' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{r.icon}</span>
          <div className="min-w-0 flex-1">
            <div className={`truncate text-xs font-bold ${c.text}`}>{r.title}</div>
            <div className="truncate text-[10px] text-white/65">{r.sub}</div>
          </div>
          {rows.length > 1 && (
            <span className="shrink-0 rounded-full bg-white/15 px-1.5 text-[9px] font-bold text-white/70">
              +{rows.length - 1}
            </span>
          )}
          <span className={`text-sm font-extrabold tabular-nums ${c.text}`}>{r.secs}s</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/15">
          <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${r.pct}%` }} />
        </div>
      </div>
    </div>
  );
}

// Left rail: the tracked-quest card + loan chip, in flow under the banner.
function MobileQuestLoan() {
  return (
    <div className="flex max-w-[64%] flex-col items-start gap-1.5">
      <MobileQuestPill />
      <MobileLoanChip />
    </div>
  );
}

function MobileQuestPill() {
  const trackedQuest = useGame((s) => s.trackedQuest);
  const quests = useGame((s) => s.quests);
  const setPanel = useGame((s) => s.setPanel);
  if (!trackedQuest) return null;
  const def = QUEST_BY_ID[trackedQuest];
  const prog = quests[trackedQuest];
  if (!def || !prog) return null;

  if (prog.status === 'available') {
    return (
      <button
        onClick={() => setPanel('quests')}
        className="pointer-events-auto rounded-lg border border-sky-400/30 bg-black/65 px-2.5 py-1.5 text-left backdrop-blur-sm"
      >
        <div className="text-[9px] font-bold uppercase tracking-wider text-sky-300">New Quest</div>
        <div className="truncate text-[11px] font-semibold text-white">{def.title}</div>
      </button>
    );
  }
  if (prog.status !== 'active' && prog.status !== 'ready') return null;
  return (
    <button
      onClick={() => setPanel('quests')}
      className="pointer-events-auto rounded-lg border border-amber-400/30 bg-black/65 px-2.5 py-1.5 text-left backdrop-blur-sm"
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300">
          {def.line === 'main' ? 'Main' : 'Side'}
        </span>
        {prog.status === 'ready' && (
          <span className="rounded bg-amber-400/20 px-1 text-[8px] font-bold text-amber-300">TURN IN</span>
        )}
      </div>
      <div className="truncate text-[11px] font-semibold text-white">{def.title}</div>
      {prog.status === 'active' && (
        <div className="mt-0.5 space-y-0.5">
          {def.objectives.map((o, i) => {
            const done = prog.progress[i] >= o.amount;
            return (
              <div key={i} className={`truncate text-[10px] ${done ? 'text-emerald-300 line-through' : 'text-white/70'}`}>
                {done ? '✓' : '•'} {o.label}
                {o.amount > 1 && ` (${prog.progress[i]}/${o.amount})`}
              </div>
            );
          })}
        </div>
      )}
    </button>
  );
}

function MobileLoanChip() {
  const loan = useGame((s) => s.loan);
  const day = useGame((s) => s.day);
  const setPanel = useGame((s) => s.setPanel);
  if (!loan) return null;
  const overdue = day > loan.dueDay;
  return (
    <button
      onClick={() => setPanel('loan')}
      className={`pointer-events-auto rounded-lg border px-2.5 py-1.5 text-left backdrop-blur-sm ${
        overdue ? 'animate-eventPulse border-red-400/60 bg-red-500/20' : 'border-amber-400/40 bg-black/65'
      }`}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-red-300">{overdue ? '⚠ Overdue' : '🪙 Debt'}</span>
      <span className="ml-1.5 text-[11px] font-bold text-white">◆{loan.owed}</span>
    </button>
  );
}

// Bottom-center status column — single owner of that zone, so the interaction
// prompt, placement controls, and toasts can never stack on top of each other.
function TouchStatusColumn() {
  const placing = useGame((s) => s.placing !== null);
  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-10 flex flex-col items-center gap-2 px-3"
      style={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom))' }}
    >
      <MobileToasts />
      {placing ? <MobilePlacementSynergy /> : null}
      {placing ? <MobilePlacementButtons /> : <MobileInteractPrompt />}
    </div>
  );
}

function MobileToasts() {
  const toasts = useGame((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-1">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-toastIn rounded-lg border bg-black/80 px-3 py-1.5 text-center text-xs font-medium backdrop-blur-sm ${TOAST_STYLE[t.kind]}`}
        >
          {t.icon && <span className="mr-1.5">{t.icon}</span>}
          {t.text}
        </div>
      ))}
    </div>
  );
}

function MobileInteractPrompt() {
  const target = useGame((s) => s.interactTarget);
  const harvesting = useGame((s) => s.harvesting);
  const dialogue = useGame((s) => s.dialogue);
  if (dialogue) return null;
  if (harvesting) {
    return (
      <div className="w-44 overflow-hidden rounded-full border border-amber-300/40 bg-black/70 backdrop-blur-sm">
        <div
          className="h-2.5 bg-gradient-to-r from-amber-400 to-yellow-300"
          style={{ width: `${Math.min(100, harvesting.progress * 100)}%` }}
        />
      </div>
    );
  }
  if (!target) return null;
  return (
    <div className="max-w-[58vw] truncate rounded-full border border-white/15 bg-black/75 px-3.5 py-1.5 text-xs text-white backdrop-blur-sm">
      <span className="font-semibold text-amber-300">{target.verb}</span> — {target.label}
    </div>
  );
}

function MobilePlacementSynergy() {
  const placing = useGame((s) => s.placing);
  const plots = useGame((s) => s.plots);
  if (!placing) return null;
  const syn = adjacencyInfo(placing.buildingId, placing.x, placing.z, plots);
  if (syn.bonus <= 0) return null;
  return (
    <div className="rounded-full border border-amber-300/50 bg-black/75 px-3 py-1 text-[11px] font-bold text-amber-200 backdrop-blur-sm">
      ✦ +{Math.round(syn.bonus * 100)}% synergy here
    </div>
  );
}

function MobilePlacementButtons() {
  const placing = useGame((s) => s.placing);
  const rotate = useGame((s) => s.rotatePlacing);
  const confirm = useGame((s) => s.confirmPlacing);
  const cancel = useGame((s) => s.cancelPlacing);
  if (!placing) return null;
  return (
    <div className="pointer-events-auto flex items-center gap-2">
      <button
        onClick={cancel}
        aria-label="Cancel"
        className="rounded-xl border border-white/20 bg-black/80 px-4 py-3 text-sm font-bold text-white/80 backdrop-blur-sm transition active:scale-95"
      >
        ✕
      </button>
      <button
        onClick={rotate}
        aria-label="Rotate"
        className="rounded-xl border border-sky-400/50 bg-sky-500/25 px-4 py-3 text-sm font-bold text-sky-100 backdrop-blur-sm transition active:scale-95"
      >
        ⟳
      </button>
      <button
        onClick={confirm}
        disabled={!placing.valid}
        className={`rounded-xl border px-6 py-3 text-sm font-bold backdrop-blur-sm transition active:scale-95 ${
          placing.valid
            ? 'border-emerald-400/60 bg-emerald-500/30 text-emerald-100'
            : 'cursor-not-allowed border-white/15 bg-white/5 text-white/40'
        }`}
      >
        ✓ Place
      </button>
    </div>
  );
}

// Floating "+N" harvest number — own absolute element so animate-popUp's
// translate(-50%) stays centred.
function MobileHarvestPop() {
  const pop = useGame((s) => s.harvestPop);
  if (!pop) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 z-10" style={{ bottom: 'calc(9.5rem + env(safe-area-inset-bottom))' }}>
      <div
        key={pop.id}
        className={`animate-popUp whitespace-nowrap font-extrabold drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)] ${
          pop.crit ? 'text-2xl text-amber-300' : 'text-lg text-emerald-200'
        }`}
      >
        {pop.crit && <span className="mr-1">RICH VEIN!</span>}+{pop.amount} {RES_ICON[pop.type]}
        {pop.combo >= 3 && <span className="ml-1.5 align-middle text-xs font-bold text-amber-300/90">×{pop.combo}</span>}
      </div>
    </div>
  );
}

// Fixed bottom tab bar — the single launcher (replaces the floating ☰ + the
// desktop hotkey bar). Hidden while placing so the ground stays tappable.
function BottomNav() {
  const setPanel = useGame((s) => s.setPanel);
  const panel = useGame((s) => s.panel);
  const placing = useGame((s) => s.placing !== null);
  const backToMenu = useGame((s) => s.backToMenu);
  const quests = useGame((s) => s.quests);
  const skillPoints = useGame((s) => s.skillPoints);
  const hasReady = Object.values(quests).some((q) => q.status === 'ready');
  const [more, setMore] = useState(false);
  if (placing) return null;

  const tabs: { icon: string; label: string; panel: 'build' | 'quests' | 'inventory' | 'market' | 'map'; badge?: boolean }[] = [
    { icon: '⚒️', label: 'Build', panel: 'build' },
    { icon: '📜', label: 'Quests', panel: 'quests', badge: hasReady },
    { icon: '🎒', label: 'Items', panel: 'inventory', badge: skillPoints > 0 },
    { icon: '🛒', label: 'Market', panel: 'market' },
    { icon: '🗺️', label: 'Map', panel: 'map' },
  ];
  const tap = (p: 'build' | 'quests' | 'inventory' | 'market' | 'map') => {
    setMore(false);
    setPanel(panel === p ? null : p);
  };

  return (
    <>
      {more && (
        <div
          className="pointer-events-auto fixed inset-x-0 top-0 z-30"
          style={{ bottom: 'calc(3.25rem + env(safe-area-inset-bottom))' }}
          onPointerDown={() => setMore(false)}
        >
          <div
            className="absolute inset-x-0 bottom-2 mx-auto flex max-w-sm flex-col gap-1.5 px-3"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setMore(false);
                setPanel('help');
              }}
              className="rounded-2xl border border-white/15 bg-[#161310]/97 py-3 text-sm font-bold text-white/90 backdrop-blur transition active:scale-[0.98]"
            >
              ❓ How to Play
            </button>
            <button
              onClick={() => {
                setMore(false);
                backToMenu();
              }}
              className="rounded-2xl border border-white/15 bg-[#161310]/97 py-3 text-sm font-bold text-white/90 backdrop-blur transition active:scale-[0.98]"
            >
              ⌂ Save &amp; Quit to Menu
            </button>
          </div>
        </div>
      )}
      <div className="safe-pb pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex items-stretch border-t border-white/10 bg-[#12100c]/95 backdrop-blur-md">
        {tabs.map((t) => (
          <NavTab key={t.panel} icon={t.icon} label={t.label} active={panel === t.panel} badge={t.badge} onTap={() => tap(t.panel)} />
        ))}
        <NavTab icon="☰" label="Menu" active={more} onTap={() => setMore((v) => !v)} />
      </div>
    </>
  );
}

function NavTab({
  icon,
  label,
  active,
  badge,
  onTap,
}: {
  icon: string;
  label: string;
  active?: boolean;
  badge?: boolean;
  onTap: () => void;
}) {
  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        onTap();
      }}
      className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition active:bg-white/10 ${
        active ? 'text-amber-300' : 'text-white/70'
      }`}
      style={{ minHeight: '3.25rem' }}
    >
      {active && <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-amber-400" />}
      <span className="relative text-lg leading-none">
        {icon}
        {badge && <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-amber-400" />}
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-wide">{label}</span>
    </button>
  );
}

// Pinch-to-zoom, headless (was ZoomCluster's effect; the on-screen +/- buttons
// are gone — pinch is the mobile zoom).
function PinchZoom() {
  useEffect(() => {
    let startDist = 0;
    let startZoom = 1;
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        startDist = dist(e.touches);
        startZoom = useGame.getState().cameraZoom;
      }
    };
    const onMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && startDist > 0) {
        e.preventDefault();
        const ratio = dist(e.touches) / startDist;
        useGame.getState().setCameraZoom(startZoom / ratio);
      }
    };
    const onEnd = () => {
      startDist = 0;
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, []);
  return null;
}

// --- Virtual joystick -------------------------------------------------------
// Dynamic-origin stick living in the lower-left zone: wherever the thumb lands
// becomes the centre, and the knob tracks within a fixed radius. Tilt distance
// drives analog speed (with a small dead-zone) via the touchControls singleton.

const JOY_RADIUS = 58;
const JOY_DEAD = 0.18;

function Joystick() {
  // origin lives in a ref so the FIRST pointermove (which can fire before a
  // setState flush) already has it; `base` mirrors it only for rendering.
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const [base, setBase] = useState<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const pid = useRef<number | null>(null);

  const end = () => {
    pid.current = null;
    originRef.current = null;
    setBase(null);
    setKnob({ x: 0, y: 0 });
    clearTouchMove();
  };

  // never leave the player drifting if the stick unmounts mid-drag
  useEffect(() => () => clearTouchMove(), []);

  return (
    <div
      className="pointer-events-auto absolute left-0 h-[46%] w-[46%] touch-none"
      style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom))' }}
      onPointerDown={(e) => {
        if (pid.current !== null) return;
        pid.current = e.pointerId;
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
          /* ignore — capture is a nicety, not required */
        }
        originRef.current = { x: e.clientX, y: e.clientY };
        setBase(originRef.current);
        setKnob({ x: 0, y: 0 });
      }}
      onPointerMove={(e) => {
        const o = originRef.current;
        if (e.pointerId !== pid.current || !o) return;
        let dx = e.clientX - o.x;
        let dy = e.clientY - o.y;
        const dist = Math.hypot(dx, dy);
        const clamped = Math.min(dist, JOY_RADIUS);
        if (dist > 0) {
          dx = (dx / dist) * clamped;
          dy = (dy / dist) * clamped;
        }
        setKnob({ x: dx, y: dy });
        const raw = clamped / JOY_RADIUS;
        const mag = raw < JOY_DEAD ? 0 : (raw - JOY_DEAD) / (1 - JOY_DEAD);
        // dx → +X (right), dy → +Z (down). Player normalizes (x,z).
        setTouchMove(dx, dy, mag);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {/* resting hint when idle so the stick is discoverable */}
      {!base && (
        <div className="absolute bottom-4 left-5 h-20 w-20 rounded-full border border-white/15 bg-white/[0.04]">
          <div className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-white/10" />
          <div className="absolute left-1/2 top-1 -translate-x-1/2 text-[8px] font-bold uppercase tracking-wider text-white/35">
            Move
          </div>
        </div>
      )}
      {base && (
        <div className="pointer-events-none fixed z-20" style={{ left: base.x, top: base.y }}>
          <div
            className="absolute h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-300/30 bg-black/30 backdrop-blur-[1px]"
          />
          <div
            className="absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-300/70 bg-amber-300/25 shadow-[0_0_20px_rgba(255,213,79,0.4)]"
            style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
          />
        </div>
      )}
    </div>
  );
}

// --- Action button ----------------------------------------------------------
// Always present in the right thumb zone so it's a consistent target; lights
// up and pulses when something interactable is in range.

function ActionButton() {
  const target = useGame((s) => s.interactTarget);
  const harvesting = useGame((s) => s.harvesting !== null);
  const interact = useGame((s) => s.interact);
  const live = !!target || harvesting;
  const icon = harvesting ? '✊' : target ? VERB_ICON[target.verb] ?? '✊' : '✊';

  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        if (live) interact();
      }}
      aria-label={target ? `${target.verb} ${target.label}` : 'Act'}
      style={{ bottom: 'calc(4.25rem + env(safe-area-inset-bottom))' }}
      className={`pointer-events-auto absolute right-5 flex h-[4.75rem] w-[4.75rem] flex-col items-center justify-center rounded-full border-2 backdrop-blur-sm transition active:scale-90 ${
        live
          ? 'animate-eventPulse border-amber-400/70 bg-black/65 text-amber-200'
          : 'border-white/15 bg-black/40 text-white/30'
      }`}
    >
      <span className="text-2xl leading-none">{icon}</span>
      {target && <span className="mt-0.5 max-w-[4rem] truncate text-[9px] font-bold uppercase tracking-wide">{target.verb}</span>}
    </button>
  );
}

// --- Sprint toggle ----------------------------------------------------------

function SprintButton() {
  const [on, setOn] = useState(false);
  const stamina = useGame((s) => s.stamina);
  const winded = stamina <= 0;
  const toggle = () => {
    const next = !on;
    setOn(next);
    setTouchSprint(next);
  };
  // drop the sprint flag if the component ever unmounts (e.g. enter placement)
  useEffect(() => () => setTouchSprint(false), []);
  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        toggle();
      }}
      aria-pressed={on}
      aria-label="Toggle sprint"
      style={{ bottom: 'calc(9.5rem + env(safe-area-inset-bottom))' }}
      className={`pointer-events-auto absolute right-[1.6rem] flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 backdrop-blur-sm transition active:scale-90 ${
        on && !winded
          ? 'border-emerald-400/70 bg-emerald-500/25 text-emerald-100'
          : 'border-white/15 bg-black/45 text-white/55'
      }`}
    >
      <span className="text-lg leading-none">💨</span>
      <span className="text-[8px] font-bold uppercase tracking-wide">{winded ? 'Tired' : on ? 'On' : 'Run'}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Happenings — every active timed thing (event / fortune / merchant /
// speculator). Desktop shows a top-center stack; mobile collapses to one banner.
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

function useHappenings(): Happening[] {
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
    rows.push({ key: 'merch', icon: '🛒', title: `${merchant.name} — Trader`, sub: 'At the plaza', secs: Math.ceil(merchant.timeLeft), pct: pct(merchant.timeLeft, merchant.duration), tone: 'sky' });
  if (spec)
    rows.push({ key: 'spec', icon: '🎩', title: "Speculator's Offer", sub: `Eyeing your ${spec.buildingName}`, secs: Math.ceil(spec.timeLeft), pct: pct(spec.timeLeft, spec.duration), tone: 'fuchsia', pulse: true });
  return rows;
}

function HappeningsStack() {
  const rows = useHappenings();
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
      <div className="text-[10px] font-bold uppercase tracking-wider text-red-300">{overdue ? '⚠ Overdue' : '🪙 Debt'}</div>
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
    <div className="pointer-events-none absolute bottom-28 left-1/2 w-[min(58vw,230px)] -translate-x-1/2 sm:bottom-16 sm:w-[min(90vw,300px)]">
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
  const plots = useGame((s) => s.plots);
  if (!placing) return null;
  const syn = adjacencyInfo(placing.buildingId, placing.x, placing.z, plots);
  if (syn.bonus <= 0) return null;
  return (
    <div className="pointer-events-none absolute bottom-36 left-1/2 -translate-x-1/2 sm:bottom-40">
      <div className="rounded-full border border-amber-300/50 bg-black/70 px-3 py-1 text-[11px] font-bold text-amber-200 backdrop-blur-sm">
        ✦ +{Math.round(syn.bonus * 100)}% synergy here
      </div>
    </div>
  );
}

function PlacementButtons() {
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
  const coarse = useCoarse();
  if (!wb) return null;
  const h = Math.floor(wb.seconds / 3600);
  const m = Math.floor((wb.seconds % 3600) / 60);
  const away = h > 0 ? `${h}h ${m}m` : `${Math.max(1, m)}m`;
  const amount = wb.bswx.toLocaleString();
  return (
    <div
      className={`pointer-events-auto absolute inset-0 z-30 flex justify-center bg-black/55 p-4 backdrop-blur-[2px] ${
        coarse ? 'items-end pb-8 safe-pb' : 'items-center'
      }`}
    >
      <div className="animate-scaleIn w-full max-w-xs rounded-2xl border border-amber-300/30 bg-[#161310]/95 p-5 text-center shadow-2xl">
        <div className="text-3xl">🌅</div>
        <h2 className="mt-2 text-sm font-bold uppercase tracking-widest text-amber-300">Welcome Back</h2>
        <p className="mt-1 text-xs leading-relaxed text-white/70">
          You were away <span className="font-semibold text-white">{away}</span>. Your businesses kept earning.
        </p>
        <div className="my-4 rounded-xl border border-amber-400/30 bg-amber-400/10 py-3">
          <div className="text-[10px] uppercase tracking-wider text-amber-200/70">Earned</div>
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
