'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AdventureEngine, EngineSnapshot } from '../../src/adventure/engine';
import { advAudio } from '../../src/adventure/audio';
import { Appearance, DEFAULT_APPEARANCE, randomAppearance, sanitizeAppearance } from '../../src/adventure/appearance';
import { SaveData, SAVE_KEY, SAVE_VERSION } from '../../src/adventure/types';
import CharacterCreator from './CharacterCreator';

type Phase = 'menu' | 'create' | 'play';
interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'good' | 'bad';
}

function loadSave(): SaveData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SaveData;
    if (!s || typeof s !== 'object') return null;
    if (s.v !== SAVE_VERSION) return null; // wrong/foreign save shape -> start fresh
    s.appearance = sanitizeAppearance(s.appearance);
    if (!Array.isArray(s.shards)) s.shards = [false, false, false, false];
    return s;
  } catch {
    return null;
  }
}
function writeSave(s: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch {
    /* quota / private mode */
  }
}

// Single source of truth for "is this a touch device" — drives every
// mobile-vs-desktop behavior split (controls, key hints, sheet overlays).
// We deliberately do NOT use Tailwind `sm:` width breakpoints for this:
// a narrow desktop window is not a phone, and a wide tablet still is one.
// SSR-safe: false on first paint, resolved after mount.
function useTouch(): boolean {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    setTouch(window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);
  }, []);
  return touch;
}

export default function AdventureGame() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [save, setSave] = useState<SaveData | null>(null);
  const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [usingSave, setUsingSave] = useState(false);
  const touch = useTouch();

  const [snap, setSnap] = useState<EngineSnapshot | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [winDismissed, setWinDismissed] = useState(false);
  const [showJournal, setShowJournal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AdventureEngine | null>(null);
  const toastId = useRef(0);

  useEffect(() => {
    setSave(loadSave());
  }, []);

  const pushToast = useCallback((text: string, kind: 'info' | 'good' | 'bad' = 'info') => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-3), { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  // ----- mount/unmount engine for the play phase -----
  useEffect(() => {
    if (phase !== 'play' || !canvasRef.current) return;
    advAudio.unlock();
    const engine = new AdventureEngine(canvasRef.current, {
      appearance,
      initial: usingSave ? save : null,
      muted,
      onUpdate: (s) => setSnap(s),
      onToast: pushToast,
    });
    engineRef.current = engine;
    (window as unknown as { __emberwilds?: AdventureEngine }).__emberwilds = engine;
    engine.start();
    // continuing an already-beaten save shouldn't re-flash the victory modal;
    // only a fresh win during play should show it
    setWinDismissed(usingSave && !!save?.bossDefeated);

    const autosave = window.setInterval(() => writeSave(engine.serialize()), 8000);
    const onHide = () => writeSave(engine.serialize());
    window.addEventListener('beforeunload', onHide);
    document.addEventListener('visibilitychange', onHide);

    return () => {
      writeSave(engine.serialize());
      setSave(engine.serialize());
      engine.stop();
      engineRef.current = null;
      delete (window as unknown as { __emberwilds?: AdventureEngine }).__emberwilds;
      window.clearInterval(autosave);
      window.removeEventListener('beforeunload', onHide);
      document.removeEventListener('visibilitychange', onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startFresh = (a: Appearance) => {
    setAppearance(a);
    setUsingSave(false);
    setPhase('play');
  };
  const continueGame = () => {
    if (!save) return;
    advAudio.unlock();
    setAppearance(save.appearance);
    setUsingSave(true);
    setPhase('play');
  };
  const toMenu = () => {
    setPaused(false);
    setPhase('menu');
    setSave(loadSave());
    advAudio.setMood('menu');
  };

  const togglePause = () => {
    const e = engineRef.current;
    if (!e) return;
    const p = !paused;
    setPaused(p);
    e.setPaused(p);
  };
  const toggleMute = () => {
    const m = engineRef.current ? engineRef.current.toggleMute() : !muted;
    setMuted(m);
    advAudio.setMuted(m);
  };

  // ============================ MENU ============================
  if (phase === 'menu') {
    return (
      <MenuScreen
        hasSave={!!save}
        save={save}
        onContinue={continueGame}
        onNew={() => {
          advAudio.unlock();
          advAudio.setMood('menu');
          setAppearance(randomAppearance());
          setPhase('create');
        }}
      />
    );
  }

  // ============================ CREATE ============================
  if (phase === 'create') {
    return <CharacterCreator initial={appearance} onConfirm={startFresh} onBack={toMenu} />;
  }

  // ============================ PLAY ============================
  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-[#0a0807]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none [image-rendering:pixelated]" />

      {/* top HUD */}
      {snap && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-2 safe-pt sm:p-3">
          <div className="flex flex-col gap-1.5">
            <Hearts hp={snap.hp} maxHp={snap.maxHp} />
            <Shards shards={snap.shards} names={snap.shardNames} />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2 rounded-lg border border-amber-200/15 bg-black/45 px-2.5 py-1 text-xs font-bold text-amber-100 backdrop-blur-sm">
              <span className="text-amber-400">✦</span>
              {snap.embers}
              {snap.keys > 0 && <span className="ml-1 text-amber-200/80">🔑 {snap.keys}</span>}
            </div>
            <div className={`pointer-events-auto flex ${touch ? 'gap-2.5' : 'gap-1.5'}`}>
              <HudBtn onClick={() => setShowJournal(true)} label="📖" touch={touch} />
              {!touch && <HudBtn onClick={toggleMute} label={muted ? '🔇' : '🔊'} touch={touch} />}
              <HudBtn onClick={togglePause} label="⏸" touch={touch} />
            </div>
          </div>
        </div>
      )}

      {/* zone banner + objective */}
      {snap && (
        <div
          className={`pointer-events-none absolute left-1/2 top-2 z-10 flex -translate-x-1/2 flex-col items-center text-center safe-pt ${
            touch ? 'max-w-[55vw]' : 'max-w-[70%]'
          }`}
        >
          <div className="font-retro text-[10px] tracking-wider text-amber-200/70 drop-shadow">{snap.mapName}</div>
          {!touch && <div className="mt-1 truncate text-[10px] text-amber-100/55">◇ {snap.objective}</div>}
        </div>
      )}

      {/* boss health bar */}
      {snap?.boss && (
        <div className="pointer-events-none absolute left-1/2 top-16 z-10 w-[78%] max-w-md -translate-x-1/2">
          <div className="mb-1 text-center font-retro text-[10px] tracking-widest text-red-300 drop-shadow">
            {snap.boss.name}
          </div>
          <div className="h-3 overflow-hidden rounded-full border border-red-400/40 bg-black/60">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-[width] duration-200"
              style={{ width: `${Math.max(0, (snap.boss.hp / snap.boss.max) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* interaction prompt */}
      {snap?.prompt && !snap.dialog && (
        <div
          className={`pointer-events-none absolute z-10 -translate-x-1/2 ${
            touch ? 'bottom-44 left-[58%]' : 'bottom-20 left-1/2'
          }`}
        >
          <div className="rounded-full border border-amber-200/25 bg-black/65 px-4 py-1.5 text-xs font-semibold text-amber-100 backdrop-blur-sm">
            {!touch && '[E] '}
            {snap.prompt}
          </div>
        </div>
      )}

      {/* dialogue */}
      {snap?.dialog && (
        <button
          onClick={() => engineRef.current?.advanceDialog()}
          className="absolute inset-x-0 bottom-0 z-20 cursor-pointer p-3 text-left sm:p-5"
        >
          <div className="mx-auto max-w-2xl rounded-xl border border-amber-200/25 bg-[#160f0a]/95 p-4 shadow-2xl backdrop-blur-sm">
            {snap.dialog.name && (
              <div className="mb-1 font-retro text-[11px] text-amber-300">{snap.dialog.name}</div>
            )}
            <div className="text-sm leading-relaxed text-amber-50/90">{snap.dialog.text}</div>
            <div className="mt-2 text-right text-[10px] text-amber-200/50">
              {snap.dialog.index + 1}/{snap.dialog.total} · {touch ? 'tap' : '[E]'} ▸
            </div>
          </div>
        </button>
      )}

      {/* toasts — pushed below the boss bar while a boss is active */}
      <div
        className={`pointer-events-none absolute left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1.5 ${
          snap?.boss ? 'top-32' : 'top-16'
        }`}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-toastIn rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-sm ${
              t.kind === 'good'
                ? 'border-emerald-300/30 bg-emerald-900/70 text-emerald-100'
                : t.kind === 'bad'
                ? 'border-red-300/30 bg-red-950/70 text-red-100'
                : 'border-amber-200/20 bg-black/70 text-amber-100'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* mobile controls — hidden during dialogue so the full-width dialog
          card stays tap-to-advance (the joystick zone would otherwise eat
          taps in the lower-left; the engine locks movement during dialogue
          anyway, so there's no gameplay downside) */}
      {!snap?.dialog && (
        <MobileControls
          touch={touch}
          onMove={(x, y) => engineRef.current?.setMoveAxis(x, y)}
          onAttack={() => engineRef.current?.pressAttack()}
          onInteract={() => engineRef.current?.pressInteract()}
          onDash={() => engineRef.current?.pressDash()}
          hasPrompt={!!snap?.prompt}
          canDash={!!snap?.canDash}
        />
      )}

      {/* pause */}
      {paused && (
        <Overlay touch={touch}>
          <div className="font-retro text-lg text-amber-200">PAUSED</div>
          <div className="mt-4 flex flex-col gap-2">
            <PanelBtn onClick={togglePause}>▸ Resume</PanelBtn>
            <PanelBtn onClick={toggleMute}>{muted ? '🔇 Sound: Off' : '🔊 Sound: On'}</PanelBtn>
            <PanelBtn
              onClick={() => {
                if (engineRef.current) writeSave(engineRef.current.serialize());
                toMenu();
              }}
            >
              ⌂ Save & Quit
            </PanelBtn>
          </div>
          <div className="mt-5 max-w-xs text-center text-[10px] leading-relaxed text-amber-200/50">
            {touch
              ? 'Joystick move · ⚔ attack · ✋ interact · 🌀 dash'
              : 'WASD/arrows move · Space attack · E talk · Shift sprint · K dash · Esc pause'}
          </div>
        </Overlay>
      )}

      {/* journal */}
      {showJournal && snap && (
        <Overlay touch={touch} onClose={() => setShowJournal(false)}>
          <div className="font-retro text-sm text-amber-200">JOURNAL</div>
          <div className="mt-4 w-[300px] max-w-[86vw] space-y-3 text-left">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-200/50">Goal</div>
              <div className="mt-1 text-sm text-amber-50/90">{snap.objective}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-200/50">Ember Shards</div>
              <div className="mt-1 space-y-0.5">
                {snap.shardNames.map((n, i) => (
                  <div key={i} className={`text-xs ${snap.shards[i] ? 'text-amber-200' : 'text-white/35'}`}>
                    {snap.shards[i] ? '◆' : '◇'} {n}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-200/50">Wayfarer</div>
              <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-amber-50/80">
                <span>❤ Health {snap.maxHp / 2}</span>
                <span>⚔ Sword {snap.stats.atk}</span>
                <span>✦ Embers {snap.embers}</span>
                <span>🌀 Dash {snap.stats.dash ? 'yes' : 'no'}</span>
              </div>
            </div>
          </div>
          <div className="mt-5">
            <PanelBtn onClick={() => setShowJournal(false)}>▸ Close</PanelBtn>
          </div>
        </Overlay>
      )}

      {/* shop */}
      {snap?.shop && (
        <Overlay touch={touch} onClose={() => engineRef.current?.closeShop()}>
          <div className="font-retro text-sm text-amber-200">TAMSIN&apos;S WARES</div>
          <div className="mt-1 text-xs text-amber-200/70">✦ {snap.embers} embers</div>
          <div className="mt-4 w-[330px] max-w-[90vw] space-y-2">
            {snap.shop.map((it) => {
              const maxed = it.level >= it.max;
              const afford = snap.embers >= it.cost;
              return (
                <button
                  key={it.id}
                  disabled={maxed || !afford}
                  onClick={() => engineRef.current?.buyUpgrade(it.id)}
                  className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition ${
                    maxed
                      ? 'border-amber-200/10 bg-black/30 opacity-50'
                      : afford
                      ? 'border-amber-300/40 bg-amber-400/10 hover:bg-amber-400/20 active:scale-[0.98]'
                      : 'border-white/10 bg-black/30 opacity-60'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-amber-100">
                      {it.name}
                      {it.max > 1 && it.max < 90 && (
                        <span className="ml-1.5 text-[10px] font-normal text-amber-200/50">
                          Lv {it.level}/{it.max}
                        </span>
                      )}
                    </div>
                    <div className="truncate text-[11px] text-amber-50/60">{it.desc}</div>
                  </div>
                  <div className="shrink-0 text-xs font-bold text-amber-300">{maxed ? 'MAX' : `✦ ${it.cost}`}</div>
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <PanelBtn onClick={() => engineRef.current?.closeShop()}>▸ Done</PanelBtn>
          </div>
        </Overlay>
      )}

      {/* victory */}
      {snap?.won && !winDismissed && (
        <Overlay touch={touch}>
          <div className="text-3xl">🏮</div>
          <div className="mt-2 font-retro text-base text-amber-200 drop-shadow-[0_2px_10px_rgba(224,113,47,0.6)]">
            LIGHT RESTORED
          </div>
          <p className="mt-3 max-w-sm text-center text-xs leading-relaxed text-amber-50/80">
            The four Ember Shards burn as one. Warmth spills across the meadow, the woods, and the shore — the Hollow
            recedes. The Emberwilds are whole again, Wayfarer.
          </p>
          <div className="mt-4 text-xs text-amber-200/70">✦ {snap.embers} embers gathered</div>
          <div className="mt-5 flex flex-col gap-2">
            <PanelBtn onClick={() => setWinDismissed(true)}>▸ Keep Exploring</PanelBtn>
            <PanelBtn onClick={toMenu}>⌂ Return to Title</PanelBtn>
          </div>
        </Overlay>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- pieces */

function MenuScreen({
  hasSave,
  save,
  onContinue,
  onNew,
}: {
  hasSave: boolean;
  save: SaveData | null;
  onContinue: () => void;
  onNew: () => void;
}) {
  useEffect(() => {
    const unlock = () => {
      advAudio.unlock();
      advAudio.setMood('menu');
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const got = save ? save.shards.filter(Boolean).length : 0;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0a0807]">
      {/* layered gradient sky + glow */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_120%,#3a1d0c_0%,#1a0f08_45%,#0a0807_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(40%_30%_at_50%_38%,rgba(224,113,47,0.25)_0%,transparent_70%)]" />
      <EmberField />

      <div className="relative z-10 flex max-w-lg flex-col items-center px-6 text-center">
        <h1 className="font-retro text-3xl leading-snug text-amber-100 drop-shadow-[0_3px_16px_rgba(224,113,47,0.6)] sm:text-5xl">
          EMBER
          <br />
          WILDS
        </h1>
        <p className="mt-4 max-w-sm text-xs leading-relaxed text-amber-50/65 sm:text-sm">
          The Lantern Tree has gone dark. Forge a wayfarer, roam meadow, woods, shore and cavern, and gather the four
          Ember Shards to rekindle the light.
        </p>

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          {hasSave && (
            <button
              onClick={onContinue}
              className="rounded-xl border border-amber-300/50 bg-amber-400/20 px-6 py-3.5 text-sm font-bold tracking-wide text-amber-100 shadow-lg transition hover:scale-[1.02] hover:bg-amber-400/30 active:scale-100"
            >
              ▸ Continue Journey
              <span className="ml-2 text-[10px] font-normal text-amber-200/60">{got}/4 shards</span>
            </button>
          )}
          <button
            onClick={onNew}
            className={`rounded-xl border px-6 py-3.5 text-sm font-bold tracking-wide shadow-lg transition hover:scale-[1.02] active:scale-100 ${
              hasSave
                ? 'border-amber-200/15 bg-white/5 text-amber-50/80 hover:bg-white/10'
                : 'border-amber-300/50 bg-amber-400/20 text-amber-100 hover:bg-amber-400/30'
            }`}
          >
            ✦ New Adventure
          </button>
          <a
            href="/"
            className="mt-1 rounded-xl border border-white/10 bg-black/30 px-6 py-2.5 text-xs font-semibold text-white/55 transition hover:bg-black/50 hover:text-white/80"
          >
            ‹ Back to New Greenwood
          </a>
        </div>
      </div>
    </div>
  );
}

function EmberField() {
  // pure-CSS floating embers for the title screen (fewer on small/mobile screens)
  const motes = React.useMemo(
    () =>
      Array.from({ length: typeof window !== 'undefined' && window.innerWidth < 700 ? 12 : 26 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 8,
        dur: 7 + Math.random() * 8,
        size: 1 + Math.random() * 2.5,
        op: 0.3 + Math.random() * 0.5,
        key: i,
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {motes.map((m) => (
        <span
          key={m.key}
          className="absolute bottom-[-10px] rounded-full bg-amber-300"
          style={{
            left: `${m.left}%`,
            width: m.size,
            height: m.size,
            opacity: m.op,
            boxShadow: '0 0 6px 1px rgba(245,180,90,0.7)',
            animation: `emberRise ${m.dur}s linear ${m.delay}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes emberRise{0%{transform:translateY(0) translateX(0);opacity:0}10%{opacity:.8}90%{opacity:.5}100%{transform:translateY(-105vh) translateX(20px);opacity:0}}`}</style>
    </div>
  );
}

function Hearts({ hp, maxHp }: { hp: number; maxHp: number }) {
  const hearts = Math.ceil(maxHp / 2);
  return (
    <div className="flex flex-wrap gap-0.5 rounded-lg border border-amber-200/15 bg-black/45 px-2 py-1 backdrop-blur-sm">
      {Array.from({ length: hearts }, (_, i) => {
        const v = hp - i * 2;
        const cls = v >= 2 ? 'text-red-500' : v === 1 ? 'text-red-400/70' : 'text-white/15';
        return (
          <span key={i} className={`text-sm leading-none ${cls}`} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
            ♥
          </span>
        );
      })}
    </div>
  );
}

function Shards({ shards, names }: { shards: boolean[]; names: string[] }) {
  return (
    <div className="flex gap-1 rounded-lg border border-amber-200/15 bg-black/45 px-2 py-1 backdrop-blur-sm">
      {shards.map((got, i) => (
        <span
          key={i}
          title={names[i]}
          className={`text-sm leading-none transition ${got ? 'text-amber-400 drop-shadow-[0_0_4px_rgba(245,180,90,0.8)]' : 'text-white/15'}`}
        >
          ◆
        </span>
      ))}
    </div>
  );
}

function HudBtn({ onClick, label, touch }: { onClick: () => void; label: string; touch?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center rounded-lg border border-amber-200/15 bg-black/45 text-amber-100/80 backdrop-blur-sm transition hover:bg-black/65 ${
        touch ? 'h-11 w-11 text-base' : 'h-8 w-8 text-sm'
      }`}
    >
      {label}
    </button>
  );
}

function PanelBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="min-w-[200px] rounded-xl border border-amber-200/20 bg-amber-400/10 px-6 py-3 text-sm font-bold text-amber-100 transition hover:bg-amber-400/20 active:scale-95"
    >
      {children}
    </button>
  );
}

// Centered modal on desktop; bottom-sheet on touch so the CTAs land in the
// thumb zone instead of mid-screen. Same children either way.
function Overlay({ children, onClose, touch }: { children: React.ReactNode; onClose?: () => void; touch?: boolean }) {
  if (touch) {
    return (
      <div
        className="absolute inset-0 z-30 flex flex-col justify-end bg-black/75 backdrop-blur-sm"
        onClick={onClose ? () => onClose() : undefined}
      >
        <div
          className="safe-pb animate-sheetUp flex w-full flex-col items-center rounded-t-3xl border-t border-amber-200/20 bg-[#160f0a]/97 px-5 pb-5 pt-3 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 h-1.5 w-11 rounded-full bg-white/25" />
          <div className="no-scrollbar flex max-h-[78vh] w-full flex-col items-center overflow-y-auto">{children}</div>
        </div>
      </div>
    );
  }
  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75 p-6 backdrop-blur-sm"
      onClick={onClose ? () => onClose() : undefined}
    >
      <div className="animate-scaleIn flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/* --------------------------- mobile touch controls --------------------------- */
function MobileControls({
  touch,
  onMove,
  onAttack,
  onInteract,
  onDash,
  hasPrompt,
  canDash,
}: {
  touch: boolean;
  onMove: (x: number, y: number) => void;
  onAttack: () => void;
  onInteract: () => void;
  onDash: () => void;
  hasPrompt: boolean;
  canDash: boolean;
}) {
  if (!touch) return null;
  return (
    <>
      {/* movement: dynamic-origin stick owning the lower-left quadrant */}
      <Joystick onMove={onMove} />
      {/* actions: bottom-right thumb cluster */}
      <div className="safe-pb pointer-events-auto absolute bottom-0 right-0 z-20 flex items-end gap-3 p-4 pb-6">
        <div className="flex flex-col gap-3">
          {canDash && (
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                onDash();
              }}
              aria-label="Dash"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-sky-300/40 bg-sky-500/25 text-lg text-sky-50 backdrop-blur-sm transition active:scale-90"
            >
              🌀
            </button>
          )}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              onInteract();
            }}
            aria-label="Interact"
            className={`flex h-14 w-14 items-center justify-center rounded-full border text-lg font-bold backdrop-blur-sm transition active:scale-90 ${
              hasPrompt
                ? 'border-amber-300/60 bg-amber-400/30 text-amber-50 shadow-[0_0_14px_rgba(245,180,90,0.5)]'
                : 'border-amber-200/20 bg-black/45 text-amber-100/70'
            }`}
          >
            ✋
          </button>
        </div>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            onAttack();
          }}
          aria-label="Attack"
          className="flex h-20 w-20 items-center justify-center rounded-full border border-red-300/40 bg-red-500/25 text-2xl text-red-50 backdrop-blur-sm transition active:scale-90"
        >
          ⚔
        </button>
      </div>
    </>
  );
}

// Dynamic-origin virtual stick: wherever the thumb lands in the lower-left
// quadrant becomes the centre; tilt distance (clamped to R) drives the analog
// move vector. No fixed target to find. Feeds onMove(dirX*mag, dirY*mag) — the
// same shape the engine's setMoveAxis expects.
function Joystick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const [base, setBase] = useState<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const pid = useRef<number | null>(null);
  const R = 46;

  const end = () => {
    pid.current = null;
    originRef.current = null;
    setBase(null);
    setKnob({ x: 0, y: 0 });
    onMove(0, 0);
  };

  // never leave the player drifting if the stick unmounts mid-drag (onMove
  // routes through a stable engine ref, so a mount-time closure is fine)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => onMove(0, 0), []);

  return (
    <div
      className="pointer-events-auto absolute bottom-0 left-0 z-20 h-[55%] w-[46%] touch-none"
      onPointerDown={(e) => {
        if (pid.current !== null) return;
        e.preventDefault();
        pid.current = e.pointerId;
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {
          /* capture is a nicety, not required */
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
        const d = Math.hypot(dx, dy);
        const m = Math.min(1, d / R);
        if (d > 0) {
          dx /= d;
          dy /= d;
        }
        setKnob({ x: dx * R * m, y: dy * R * m });
        onMove(dx * m, dy * m);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {/* resting hint when idle so the stick is discoverable */}
      {!base && (
        <div className="absolute bottom-6 left-6 h-24 w-24 rounded-full border border-amber-200/15 bg-black/20">
          <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-200/25 bg-amber-400/10" />
          <div className="absolute left-1/2 top-2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-wider text-amber-100/35">
            Move
          </div>
        </div>
      )}
      {base && (
        <div className="pointer-events-none fixed z-20" style={{ left: base.x, top: base.y }}>
          <div className="absolute h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-300/30 bg-black/30 backdrop-blur-[1px]" />
          <div
            className="absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-300/70 bg-amber-300/25 shadow-[0_0_20px_rgba(245,180,90,0.4)]"
            style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
          />
        </div>
      )}
    </div>
  );
}
