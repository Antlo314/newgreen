'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Appearance,
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  BROWS,
  TOP_COLORS,
  BOTTOM_COLORS,
  SHOE_COLORS,
  EYE_COLORS,
  ACCESSORIES,
  ACCESSORY_COLORS,
  randomAppearance,
} from '../../src/adventure/appearance';
import { buildActorSheet, actorSrc, FW, FH } from '../../src/adventure/sprites';
import { advAudio } from '../../src/adventure/audio';

interface Props {
  initial: Appearance;
  onConfirm: (a: Appearance) => void;
  onBack: () => void;
}

// preview cycles through these facings to show the model off
const DIR_CYCLE = [0, 3, 1, 2];

export default function CharacterCreator({ initial, onConfirm, onBack }: Props) {
  const [app, setApp] = useState<Appearance>(initial);
  const [name, setName] = useState('Wayfarer');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sheet = useMemo(() => buildActorSheet(app), [app]);

  // animated preview
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    let raf = 0;
    let t0 = performance.now();
    const SC = 9;
    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      const dir = DIR_CYCLE[Math.floor(t / 1.4) % DIR_CYCLE.length];
      const frame = Math.floor(t * 7) % 4;
      const src = actorSrc(dir, frame);
      ctx.clearRect(0, 0, cv.width, cv.height);
      // soft platform
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
  }, [sheet]);

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

  return (
    <div className="relative flex h-full w-full flex-col bg-gradient-to-b from-[#1a120c] via-[#120d0a] to-[#0a0807] text-amber-50">
      <div className="flex items-center justify-between px-4 pt-4 sm:px-6">
        <button
          onClick={onBack}
          className="rounded-lg border border-amber-200/15 bg-black/30 px-3 py-1.5 text-xs font-semibold text-amber-100/80 transition hover:bg-black/50"
        >
          ‹ Back
        </button>
        <div className="font-retro text-sm text-amber-200 drop-shadow-[0_2px_8px_rgba(224,113,47,0.5)] sm:text-base">
          FORGE YOUR WAYFARER
        </div>
        <button
          onClick={randomize}
          className="rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/20"
        >
          🎲 Random
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 sm:flex-row sm:gap-6 sm:p-6">
        {/* preview */}
        <div className="flex shrink-0 flex-col items-center justify-center sm:w-64">
          <div className="rounded-2xl border border-amber-200/15 bg-gradient-to-b from-[#26190f] to-[#150f0a] p-4 shadow-[inset_0_1px_0_rgba(255,200,120,0.1)]">
            <canvas
              ref={canvasRef}
              width={FW * 9}
              height={FH * 9 + 10}
              className="[image-rendering:pixelated]"
              style={{ width: FW * 9, height: FH * 9 + 10 }}
            />
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 16))}
            className="mt-3 w-44 rounded-lg border border-amber-200/15 bg-black/40 px-3 py-2 text-center text-sm text-amber-100 outline-none focus:border-amber-300/40"
            placeholder="Name"
          />
        </div>

        {/* options */}
        <div className="no-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <Styles label="Skin" value={app.skin} colors={SKIN_TONES} onPick={(i) => set('skin', i)} />
          <Names label="Hair" value={app.hair} items={HAIR_STYLES} onPick={(i) => set('hair', i)} />
          <Styles label="Hair Color" value={app.hairColor} colors={HAIR_COLORS} onPick={(i) => set('hairColor', i)} />
          <Names label="Facial Hair" value={app.brow} items={BROWS} onPick={(i) => set('brow', i)} />
          <Styles label="Eyes" value={app.eyes} colors={EYE_COLORS} onPick={(i) => set('eyes', i)} />
          <Styles label="Shirt" value={app.top} colors={TOP_COLORS} onPick={(i) => set('top', i)} />
          <Styles label="Pants" value={app.bottom} colors={BOTTOM_COLORS} onPick={(i) => set('bottom', i)} />
          <Styles label="Shoes" value={app.shoes} colors={SHOE_COLORS} onPick={(i) => set('shoes', i)} />
          <Names label="Headwear" value={app.accessory} items={ACCESSORIES} onPick={(i) => set('accessory', i)} />
          {ACCESSORIES[app.accessory].id !== 'none' && (
            <Styles
              label="Headwear Color"
              value={app.accessoryColor}
              colors={ACCESSORY_COLORS}
              onPick={(i) => set('accessoryColor', i)}
            />
          )}
        </div>
      </div>

      <div className="border-t border-amber-200/10 bg-black/30 p-4 sm:p-5">
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
      <div className="flex flex-wrap gap-1.5">
        {colors.map((c, i) => (
          <button
            key={i}
            title={c.name}
            onClick={() => onPick(i)}
            className={`h-7 w-7 rounded-md border transition ${
              value === i
                ? 'border-amber-200 ring-2 ring-amber-300/60'
                : 'border-black/40 hover:border-amber-200/40'
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
      <div className="flex flex-wrap gap-1.5">
        {items.map((it, i) => (
          <button
            key={it.id}
            onClick={() => onPick(i)}
            className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
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
