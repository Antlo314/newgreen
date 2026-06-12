'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Humanoid from './Humanoid';
import { useGame } from '../../src/game/store';
import { audio } from '../../src/game/audio';
import {
  ACCESSORIES,
  BUILDS,
  CALLINGS,
  CALLING_BY_ID,
  HAIR_COLORS,
  HAIR_STYLES,
  HAT_COLORS,
  HAT_STYLES,
  PANTS_COLORS,
  SHIRT_COLORS,
  SKIN_TONES,
  randomAppearance,
  randomName,
} from '../../src/game/customization';
import type { PlayerAppearance } from '../../src/game/types';
import splashImg from '../../src/assets/images/new_greenwood_splash_1779631301817.png';

export default function CharacterCreator() {
  const createCharacter = useGame((s) => s.createCharacter);
  const cancelCreate = useGame((s) => s.cancelCreate);
  const [ap, setAp] = useState<PlayerAppearance>(() => randomAppearance());

  const patch = (p: Partial<PlayerAppearance>) => {
    audio.sfx('ui');
    setAp((cur) => ({ ...cur, ...p }));
  };

  const calling = CALLING_BY_ID[ap.calling];
  const canBegin = ap.name.trim().length >= 2;

  const begin = () => {
    if (!canBegin) return;
    audio.unlock();
    createCharacter({ ...ap, name: ap.name.trim() });
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#0b0e0a]">
      <Image src={splashImg} alt="" fill priority className="object-cover opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/80" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pt-4 sm:px-8 sm:pt-6">
        <header className="mb-3 text-center">
          <div className="text-[9px] font-bold uppercase tracking-[0.35em] text-amber-300/80">
            A New Legacy Begins
          </div>
          <h1 className="font-retro text-xl text-amber-100 drop-shadow-[0_2px_12px_rgba(212,175,55,0.45)] sm:text-2xl">
            FOUND YOUR LEGACY
          </h1>
        </header>

        <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4 md:flex-row">
          {/* ------------------------------ preview ------------------------------ */}
          <div className="flex shrink-0 flex-col items-center md:w-[320px]">
            <PreviewStage ap={ap} />
            <div className="mt-2 text-center">
              <div className="font-retro text-sm text-amber-100">{ap.name.trim() || '— unnamed —'}</div>
              <div className="text-[11px] text-white/55">
                {calling?.icon} {calling?.name} · {calling?.bonusLabel}
              </div>
            </div>
          </div>

          {/* ------------------------------ options ------------------------------ */}
          <div className="custom-scroll min-h-0 flex-1 space-y-4 overflow-y-auto pb-3 pr-1">
            <Section title="Name">
              <div className="flex gap-2">
                <input
                  value={ap.name}
                  maxLength={26}
                  onChange={(e) => setAp((c) => ({ ...c, name: e.target.value }))}
                  placeholder="What do folks call you?"
                  className="w-full rounded-lg border border-white/15 bg-black/45 px-3 py-2 text-sm text-amber-50 outline-none backdrop-blur-sm placeholder:text-white/30 focus:border-amber-400/60"
                />
                <button
                  onClick={() => patch({ name: randomName() })}
                  className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-3 text-sm transition hover:bg-white/15"
                  title="Random era name"
                >
                  🎲
                </button>
              </div>
            </Section>

            <Section title="Calling" hint="Your trade before Greenwood — grants a founding gift">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CALLINGS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => patch({ calling: c.id })}
                    className={`rounded-xl border px-2.5 py-2 text-left transition ${
                      ap.calling === c.id
                        ? 'border-amber-400/70 bg-amber-400/15 shadow-[0_0_14px_rgba(212,175,55,0.25)]'
                        : 'border-white/10 bg-black/40 hover:bg-white/5'
                    }`}
                  >
                    <div className="text-sm">
                      {c.icon} <span className="font-semibold text-amber-50">{c.name}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] leading-snug text-emerald-300/90">{c.bonusLabel}</div>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] italic leading-relaxed text-white/50">“{calling?.desc}”</p>
            </Section>

            <Section title="Build">
              <div className="flex gap-2">
                {BUILDS.map((b) => (
                  <Chip key={b.id} active={ap.build === b.id} onClick={() => patch({ build: b.id })} title={b.desc}>
                    {b.name}
                  </Chip>
                ))}
              </div>
            </Section>

            <Section title="Skin Tone">
              <div className="flex flex-wrap gap-2">
                {SKIN_TONES.map((t) => (
                  <Swatch key={t.color} color={t.color} name={t.name} active={ap.skin === t.color} onClick={() => patch({ skin: t.color })} />
                ))}
              </div>
            </Section>

            <Section title="Hair">
              <div className="flex flex-wrap gap-2">
                {HAIR_STYLES.map((h) => (
                  <Chip key={h.id} active={ap.hair === h.id} onClick={() => patch({ hair: h.id })}>
                    {h.name}
                  </Chip>
                ))}
              </div>
              {ap.hair !== 'bald' && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {HAIR_COLORS.map((c) => (
                    <Swatch key={c.color} color={c.color} name={c.name} active={ap.hairColor === c.color} onClick={() => patch({ hairColor: c.color })} />
                  ))}
                </div>
              )}
            </Section>

            <Section title="Hat">
              <div className="flex flex-wrap gap-2">
                {HAT_STYLES.map((h) => (
                  <Chip key={h.id} active={ap.hat === h.id} onClick={() => patch({ hat: h.id })}>
                    {h.name}
                  </Chip>
                ))}
              </div>
              {ap.hat !== 'none' && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {HAT_COLORS.map((c) => (
                    <Swatch key={c.color} color={c.color} name={c.name} active={ap.hatColor === c.color} onClick={() => patch({ hatColor: c.color })} />
                  ))}
                </div>
              )}
            </Section>

            <Section title="Attire">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-white/40">Shirt</div>
              <div className="flex flex-wrap gap-2">
                {SHIRT_COLORS.map((c) => (
                  <Swatch key={c.color} color={c.color} name={c.name} active={ap.shirt === c.color} onClick={() => patch({ shirt: c.color })} />
                ))}
              </div>
              <div className="mb-1 mt-2 text-[10px] uppercase tracking-wider text-white/40">Trousers</div>
              <div className="flex flex-wrap gap-2">
                {PANTS_COLORS.map((c) => (
                  <Swatch key={c.color} color={c.color} name={c.name} active={ap.pants === c.color} onClick={() => patch({ pants: c.color })} />
                ))}
              </div>
            </Section>

            <Section title="Finishing Touch">
              <div className="flex flex-wrap gap-2">
                {ACCESSORIES.map((a) => (
                  <Chip key={a.id} active={ap.accessory === a.id} onClick={() => patch({ accessory: a.id })}>
                    {a.name}
                  </Chip>
                ))}
              </div>
            </Section>
          </div>
        </div>
      </div>

      {/* ------------------------------ footer ------------------------------ */}
      <div className="relative z-10 flex items-center justify-center gap-3 border-t border-white/10 bg-black/60 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={cancelCreate}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/70 transition hover:bg-white/10"
        >
          ◂ Back
        </button>
        <button
          onClick={() => {
            audio.sfx('ui');
            setAp(randomAppearance());
          }}
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-white/80 transition hover:bg-white/10"
        >
          🎲 Surprise Me
        </button>
        <button
          onClick={begin}
          disabled={!canBegin}
          className={`rounded-xl border px-6 py-2.5 text-sm font-bold tracking-wide shadow-lg transition ${
            canBegin
              ? 'border-amber-400/60 bg-amber-400/20 text-amber-100 hover:scale-[1.03] hover:bg-amber-400/30 active:scale-100'
              : 'cursor-not-allowed border-white/10 bg-white/5 text-white/30'
          }`}
        >
          ✦ Begin Legacy
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live 3D preview — auto-rotating turntable, drag to spin.
// ---------------------------------------------------------------------------

function PreviewStage({ ap }: { ap: PlayerAppearance }) {
  const spin = useRef({ y: 0.5, auto: true, lastX: 0 });

  return (
    <div
      className="h-[260px] w-full max-w-[300px] cursor-grab touch-none rounded-2xl border border-amber-400/25 bg-gradient-to-b from-[#13190f] to-[#070906] shadow-[0_0_30px_rgba(212,175,55,0.12)] active:cursor-grabbing sm:h-[320px]"
      onPointerDown={(e) => {
        spin.current.auto = false;
        spin.current.lastX = e.clientX;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (spin.current.auto) return;
        spin.current.y += (e.clientX - spin.current.lastX) * 0.012;
        spin.current.lastX = e.clientX;
      }}
      onPointerUp={() => (spin.current.auto = true)}
      onPointerLeave={() => (spin.current.auto = true)}
    >
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0.25, 3.1], fov: 36 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.7} color="#ffeedd" />
        <directionalLight position={[3, 5, 4]} intensity={1.7} color="#fff0d8" />
        <directionalLight position={[-4, 2, -3]} intensity={0.5} color="#7d9cd3" />
        <Turntable ap={ap} spin={spin} />
      </Canvas>
    </div>
  );
}

function Turntable({
  ap,
  spin,
}: {
  ap: PlayerAppearance;
  spin: React.MutableRefObject<{ y: number; auto: boolean; lastX: number }>;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (spin.current.auto) spin.current.y += dt * 0.55;
    if (group.current) group.current.rotation.y = spin.current.y;
  });

  return (
    <group position={[0, -0.95, 0]}>
      <group ref={group}>
        <Humanoid
          skin={ap.skin}
          shirt={ap.shirt}
          pants={ap.pants}
          hat={ap.hat}
          hatColor={ap.hatColor}
          hair={ap.hair}
          hairColor={ap.hairColor}
          accessory={ap.accessory}
          build={ap.build}
        />
      </group>
      {/* pedestal */}
      <mesh position={[0, -0.09, 0]}>
        <cylinderGeometry args={[0.85, 0.95, 0.18, 28]} />
        <meshStandardMaterial color="#2a2218" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.78, 0.84, 28]} />
        <meshBasicMaterial color="#d4af37" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-black/45 p-3 backdrop-blur-sm">
      <div className="mb-2 flex items-baseline gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300/90">{title}</h2>
        {hint && <span className="text-[10px] text-white/40">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Chip({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${
        active
          ? 'border-amber-400/70 bg-amber-400/15 text-amber-100'
          : 'border-white/10 bg-black/40 text-white/65 hover:bg-white/5 hover:text-white/90'
      }`}
    >
      {children}
    </button>
  );
}

function Swatch({ color, name, active, onClick }: { color: string; name: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={name}
      aria-label={name}
      className={`h-8 w-8 rounded-full border-2 transition hover:scale-110 ${
        active ? 'border-amber-300 shadow-[0_0_10px_rgba(212,175,55,0.55)]' : 'border-white/20'
      }`}
      style={{ backgroundColor: color }}
    />
  );
}
