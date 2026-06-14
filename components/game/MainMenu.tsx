'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { hasSavedGame, useGame } from '../../src/game/store';
import { audio } from '../../src/game/audio';
import { MUSIC } from '../../src/game/data';
import splashImg from '../../src/assets/images/new_greenwood_splash_1779631301817.png';

export default function MainMenu() {
  const startGame = useGame((s) => s.startGame);
  const [saveExists, setSaveExists] = useState(false);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    setSaveExists(hasSavedGame());
    setTouch(window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);
  }, []);

  const begin = (fresh: boolean) => {
    audio.unlock();
    audio.playMusic(MUSIC.menu);
    startGame(fresh);
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0b0e0a]">
      <Image
        src={splashImg}
        alt=""
        fill
        priority
        className="object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/60" />

      <div className="relative z-10 flex max-w-lg flex-col items-center px-6 text-center">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.35em] text-amber-300/80">
          Black Wall Street Reborn
        </div>
        <h1 className="font-retro text-3xl leading-snug text-amber-100 drop-shadow-[0_2px_12px_rgba(212,175,55,0.45)] sm:text-4xl">
          NEW
          <br />
          GREENWOOD
        </h1>
        <p className="mt-4 max-w-sm text-xs leading-relaxed text-white/70 sm:text-sm">
          Walk the district. Harvest, build, and trade. Grow community wealth, restore the legacy — one storefront at a
          time.
        </p>

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          {saveExists && (
            <button
              onClick={() => begin(false)}
              className="rounded-xl border border-amber-400/60 bg-amber-400/20 px-6 py-3.5 text-sm font-bold tracking-wide text-amber-100 shadow-lg transition hover:scale-[1.02] hover:bg-amber-400/30 active:scale-100"
            >
              ▸ Continue Building
            </button>
          )}
          <button
            onClick={() => begin(true)}
            className={`rounded-xl border px-6 py-3.5 text-sm font-bold tracking-wide shadow-lg transition hover:scale-[1.02] active:scale-100 ${
              saveExists
                ? 'border-white/20 bg-white/5 text-white/80 hover:bg-white/10'
                : 'border-amber-400/60 bg-amber-400/20 text-amber-100 hover:bg-amber-400/30'
            }`}
          >
            ✦ New Legacy
          </button>

          <div className="my-1 flex items-center gap-3 text-[9px] uppercase tracking-[0.3em] text-white/25">
            <span className="h-px flex-1 bg-white/15" />
            also playable
            <span className="h-px flex-1 bg-white/15" />
          </div>

          <a
            href="/adventure"
            onClick={() => audio.unlock()}
            className="group relative overflow-hidden rounded-xl border border-orange-400/50 bg-gradient-to-r from-orange-500/20 to-amber-500/15 px-6 py-3.5 text-sm font-bold tracking-wide text-orange-100 shadow-lg transition hover:scale-[1.02] hover:from-orange-500/30 hover:to-amber-500/25 active:scale-100"
          >
            <span className="relative z-10">🏮 Play “Emberwilds”</span>
            <span className="relative z-10 ml-1 block text-[10px] font-normal tracking-normal text-orange-200/70">
              a 2D pixel adventure · build your own hero
            </span>
          </a>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-x-6 gap-y-1 text-[10px] text-white/45">
          {touch ? (
            <>
              <span>Joystick — move</span>
              <span>Tap map — walk to</span>
              <span>💨 — sprint</span>
              <span>⚒ button — act</span>
              <span>Pinch — zoom</span>
              <span>☰ — menu</span>
            </>
          ) : (
            <>
              <span>WASD / click — move</span>
              <span>Shift — sprint</span>
              <span>E — interact</span>
              <span>Q — quests</span>
              <span>I — inventory</span>
              <span>M — map</span>
              <span>H — help</span>
            </>
          )}
        </div>

        <p className="mt-6 max-w-sm text-[10px] leading-relaxed text-white/35">
          Honoring the historic Greenwood District of Tulsa, Oklahoma — where O.W. Gurley, J.B. Stradford, and a
          community of builders created Black Wall Street.
        </p>
      </div>
    </div>
  );
}
