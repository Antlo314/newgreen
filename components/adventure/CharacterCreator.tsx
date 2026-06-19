'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Appearance,
  BODIES,
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  BROWS,
  OUTFITS,
  TOP_COLORS,
  BOTTOM_COLORS,
  SHOE_COLORS,
  EYE_COLORS,
  ACCESSORIES,
  ACCESSORY_COLORS,
  randomAppearance,
  presetAppearance,
} from '../../src/adventure/appearance';
import { buildActorSheet, actorSrc, FW, FH } from '../../src/adventure/sprites';
import { advAudio } from '../../src/adventure/audio';

interface Props {
  initial: Appearance;
  onConfirm: (a: Appearance) => void;
  onBack: () => void;
}

const DIR_CYCLE = [0, 3, 1, 2];
const TABS = ['Body', 'Hair', 'Face', 'Outfit', 'Extras'] as const;
type Tab = (typeof TABS)[number];

export default function CharacterCreator({ initial, onConfirm, onBack }: Props) {
  const [app, setApp] = useState<Appearance>(initial);
  const [tab, setTab] = useState<Tab>('Body');
  const [spin, setSpin] = useState(true);
  const [dir, setDir] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sheet = useMemo(() => buildActorSheet(app), [app]);

  // animated / posable preview
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    let raf = 0;
    const t0 = performance.now();
    const SC = 9;
    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      const d = spin ? DIR_CYCLE[Math.floor(t / 1.4) % DIR_CYCLE.length] : dir;
      const frame = Math.floor(t * 7) % 4;
      const src = actorSrc(d, frame);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      const cxp = cv.width / 2;
      ctx.beginPath();
      ctx.ellipse(cxp, FH * SC - 4, FW * SC * 0.42, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      const w = FW * SC;
      const h = FH * SC;
      const dx = cxp - w / 2;
      const dy = 6;
      if (src.flip) {
        ctx.save();
        ctx.translate(dx + w, dy);
        ctx.scale(-1, 1);
        ctx.drawImage(sheet.canvas, src.sx, src.sy, FW, FH, 0, 0, w, h);
        ctx.restore();
      } else {
        ctx.drawImage(sheet.canvas, src.sx, src.sy, FW, FH, dx, dy, w, h);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [sheet, spin, dir]);

  const set = <K extends keyof Appearance>(k: K, v: number) => {
    advAudio.unlock();
    advAudio.sfx('ui');
    setApp((a) => ({ ...a, [k]: v }));
  };
  const randomize = () => {
    advAudio.unlock();
    advAudio.sfx('shard');
    setApp(randomAppearance());
  };
  const preset = (body: number) => {
    advAudio.unlock();
    advAudio.sfx('heart');
    setApp(presetAppearance(body));
  };
  const rotate = () => {
    advAudio.sfx('ui');
    setSpin(false);
    setDir((d) => (d + 1) % 4);
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-gradient-to-b from-[#1a120c] via-[#120d0a] to-[#0a0807] text-amber-50">
      <div className="flex items-center justify-between px-4 pt-4 safe-pt sm:px-6">
        <button
          onClick={onBack}
          className="rounded-lg border border-amber-200/15 bg-black/30 px-3 py-1.5 text-xs font-semibold text-amber-100/80 transition hover:bg-black/50"
        >
          ‹ Back
        </button>
        <div className="font-retro text-xs text-amber-200 drop-shadow-[0_2px_8px_rgba(224,113,47,0.5)] sm:text-base">
          FORGE YOUR WAYFARER
        </div>
        <button
          onClick={randomize}
          className="rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/20"
        >
          🎲 Random
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:flex-row sm:gap-6 sm:p-6">
        {/* preview */}
        <div className="flex shrink-0 flex-col items-center justify-center sm:w-60">
          <div className="relative rounded-2xl border border-amber-200/15 bg-gradient-to-b from-[#26190f] to-[#150f0a] p-3 shadow-[inset_0_1px_0_rgba(255,200,120,0.1)] sm:p-4">
            <canvas
              ref={canvasRef}
              width={FW * 9}
              height={FH * 9 + 10}
              className="[image-rendering:pixelated]"
              style={{ width: FW * 9, height: FH * 9 + 10 }}
            />
            <button
              onClick={rotate}
              className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-lg border border-amber-200/20 bg-black/50 text-base text-amber-100/80 transition hover:bg-black/70"
              title="Rotate"
            >
              ⟳
            </button>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => preset(0)}
              className="rounded-lg border border-amber-200/15 bg-black/30 px-3 py-1.5 text-xs font-semibold text-amber-100/80 transition hover:bg-black/50"
            >
              ♂ Preset
            </button>
            <button
              onClick={() => preset(1)}
              className="rounded-lg border border-amber-200/15 bg-black/30 px-3 py-1.5 text-xs font-semibold text-amber-100/80 transition hover:bg-black/50"
            >
              ♀ Preset
            </button>
          </div>
        </div>

        {/* tabs + options */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="no-scrollbar mb-3 flex gap-1.5 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => {
                  advAudio.sfx('ui');
                  setTab(t);
                }}
                className={`min-h-11 shrink-0 rounded-lg px-3.5 py-2.5 text-xs font-bold transition ${
                  tab === t
                    ? 'bg-amber-400/25 text-amber-100 ring-1 ring-amber-300/40'
                    : 'bg-black/30 text-amber-100/55 hover:bg-black/50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="no-scrollbar min-h-0 flex-1 space-y-3.5 overflow-y-auto pr-1">
            {tab === 'Body' && (
              <>
                <Names label="Build" value={app.body} items={BODIES} onPick={(i) => set('body', i)} />
                <Styles label="Skin Tone" value={app.skin} colors={SKIN_TONES} onPick={(i) => set('skin', i)} />
              </>
            )}
            {tab === 'Hair' && (
              <>
                <Names label="Hairstyle" value={app.hair} items={HAIR_STYLES} onPick={(i) => set('hair', i)} />
                <Styles label="Hair Color" value={app.hairColor} colors={HAIR_COLORS} onPick={(i) => set('hairColor', i)} />
              </>
            )}
            {tab === 'Face' && (
              <>
                <Styles label="Eyes" value={app.eyes} colors={EYE_COLORS} onPick={(i) => set('eyes', i)} />
                <Names label="Facial Hair" value={app.brow} items={BROWS} onPick={(i) => set('brow', i)} />
              </>
            )}
            {tab === 'Outfit' && (
              <>
                <Names label="Garment" value={app.outfit} items={OUTFITS} onPick={(i) => set('outfit', i)} />
                <Styles label="Primary Color" value={app.top} colors={TOP_COLORS} onPick={(i) => set('top', i)} />
                <Styles label="Secondary / Trim" value={app.bottom} colors={BOTTOM_COLORS} onPick={(i) => set('bottom', i)} />
                <Styles label="Shoes" value={app.shoes} colors={SHOE_COLORS} onPick={(i) => set('shoes', i)} />
              </>
            )}
            {tab === 'Extras' && (
              <>
                <Names label="Headwear" value={app.accessory} items={ACCESSORIES} onPick={(i) => set('accessory', i)} />
                {ACCESSORIES[app.accessory].id !== 'none' && (
                  <Styles
                    label="Headwear Color"
                    value={app.accessoryColor}
                    colors={ACCESSORY_COLORS}
                    onPick={(i) => set('accessoryColor', i)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-amber-200/10 bg-black/30 p-3 safe-pb sm:p-5">
        <button
          onClick={() => {
            advAudio.unlock();
            advAudio.sfx('heart');
            onConfirm(app);
          }}
          className="mx-auto block w-full max-w-sm rounded-xl border border-amber-300/50 bg-gradient-to-b from-amber-400/30 to-orange-500/25 px-6 py-3.5 text-sm font-bold tracking-wide text-amber-50 shadow-lg transition hover:scale-[1.02] active:scale-100"
        >
          ✦ Begin the Adventure
        </button>
      </div>
    </div>
  );
}

function Styles({
  label,
  value,
  colors,
  onPick,
}: {
  label: string;
  value: number;
  colors: { name: string; hex: string }[];
  onPick: (i: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/55">{label}</div>
      <div className="flex flex-wrap gap-2.5">
        {colors.map((c, i) => (
          <button
            key={i}
            title={c.name}
            onClick={() => onPick(i)}
            className={`h-11 w-11 rounded-md border transition ${
              value === i ? 'border-amber-200 ring-2 ring-amber-300/60' : 'border-black/40 hover:border-amber-200/40'
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
    </div>
  );
}

function Names({
  label,
  value,
  items,
  onPick,
}: {
  label: string;
  value: number;
  items: { id: string; name: string }[];
  onPick: (i: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/55">{label}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <button
            key={it.id}
            onClick={() => onPick(i)}
            className={`min-h-11 rounded-md border px-3.5 py-2.5 text-xs font-semibold transition ${
              value === i
                ? 'border-amber-300/60 bg-amber-400/20 text-amber-100'
                : 'border-amber-200/15 bg-black/30 text-amber-100/70 hover:bg-black/50'
            }`}
          >
            {it.name}
          </button>
        ))}
      </div>
    </div>
  );
}
