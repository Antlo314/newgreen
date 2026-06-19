'use client';

import React, { useEffect } from 'react';
import GameCanvas from './GameCanvas';
import MainMenu from './MainMenu';
import CharacterCreator from './CharacterCreator';
import HUD from './ui/HUD';
import Panels from './ui/Panels';
import { useCoarse } from './ui/useCoarse';
import { useGame } from '../../src/game/store';
import { audio } from '../../src/game/audio';
import { MUSIC } from '../../src/game/data';

export default function Game() {
  const phase = useGame((s) => s.phase);

  // unlock audio on the very first user gesture anywhere
  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // adaptive music: menu / market plaza / day / night
  useEffect(() => {
    const pick = () => {
      const s = useGame.getState();
      if (s.phase === 'menu' || s.phase === 'create') {
        audio.playMusic(MUSIC.menu);
        return;
      }
      const inMarket = Math.abs(s.px) < 13 && Math.abs(s.pz) < 13;
      const isNight = s.timeOfDay < 0.27 || s.timeOfDay > 0.73;
      audio.playMusic(inMarket ? MUSIC.market : isNight ? MUSIC.night : MUSIC.day);
    };
    pick();
    const id = setInterval(pick, 3000);
    return () => clearInterval(id);
  }, [phase]);

  // save on tab hide / close
  useEffect(() => {
    const onHide = () => {
      const s = useGame.getState();
      if (s.phase === 'playing') s.save();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('beforeunload', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('beforeunload', onHide);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {phase === 'menu' ? (
        <MainMenu />
      ) : phase === 'create' ? (
        <CharacterCreator />
      ) : (
        <>
          <GameCanvas />
          <HUD />
          <Panels />
          <MenuButton />
        </>
      )}
    </div>
  );
}

function MenuButton() {
  const backToMenu = useGame((s) => s.backToMenu);
  const coarse = useCoarse();
  // On touch, Save & Quit lives in the BottomNav ☰ menu; this desktop corner
  // button must not reappear (it's pointer-gated, not width-gated, so it can't
  // collide with the tab bar on a tablet or a phone in landscape).
  if (coarse) return null;
  return (
    <button
      onClick={backToMenu}
      className="absolute bottom-2 left-2 z-10 hidden rounded-lg border border-white/10 bg-black/55 px-2.5 py-1.5 text-[11px] font-semibold text-white/70 backdrop-blur-sm transition hover:bg-black/75 hover:text-white sm:block sm:bottom-3 sm:left-3"
      title="Save & return to menu"
    >
      ⌂
    </button>
  );
}
