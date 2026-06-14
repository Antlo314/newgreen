'use client';

import dynamic from 'next/dynamic';

// Emberwilds — a fully self-contained 2D canvas adventure. Client-only (canvas,
// WebAudio, localStorage) and completely isolated from the 3D New Greenwood game.
const AdventureGame = dynamic(() => import('../../components/adventure/AdventureGame'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0807]">
      <div className="text-center">
        <div className="font-retro text-xl text-amber-200">EMBERWILDS</div>
        <div className="mt-3 text-xs tracking-widest text-amber-200/50">KINDLING THE WILDS…</div>
      </div>
    </div>
  ),
});

export default function AdventurePage() {
  return <AdventureGame />;
}
