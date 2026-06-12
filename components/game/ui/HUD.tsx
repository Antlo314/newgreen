'use client';

import React, { useMemo } from 'react';
import { useGame } from '../../../src/game/store';
import { QUEST_BY_ID, xpForLevel } from '../../../src/game/data';
import { deriveResidents } from '../../../src/game/residents';
import Minimap from './Minimap';

export default function HUD() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      <TopBar />
      <QuestTracker />
      <div className="absolute right-3 top-16 hidden sm:block">
        <Minimap size={148} />
      </div>
      <InteractPrompt />
      <Toasts />
      <HotkeyBar />
      <MobileControls />
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

  const items: { key: string; label: string; panel: 'quests' | 'inventory' | 'map' | 'market' | 'help'; badge?: boolean }[] = [
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
          {target.verb === 'Talk' ? '💬' : target.verb === 'Build' || target.verb === 'Manage' ? '⚒️' : '✊'}
        </button>
      )}
    </div>
  );
}
