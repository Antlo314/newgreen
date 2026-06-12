'use client';

import dynamic from 'next/dynamic';

// The game uses WebGL, WebAudio and localStorage — client-only.
const Game = dynamic(() => import('../components/game/Game'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0b0e0a]">
      <div className="text-center">
        <div className="font-retro text-xl text-amber-200">NEW GREENWOOD</div>
        <div className="mt-3 text-xs tracking-widest text-white/50">LOADING THE DISTRICT…</div>
      </div>
    </div>
  ),
});

export default function Page() {
  return <Game />;
}
