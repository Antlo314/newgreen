import { useEffect, useRef, useState } from 'react';

export function useAudioPlayer(
  currentTrackUrl: string | null,
  masterVolume: number,
  isMuted: boolean,
  hasInteracted: boolean
) {
  const audio1Ref = useRef<HTMLAudioElement | null>(null);
  const audio2Ref = useRef<HTMLAudioElement | null>(null);
  const [activeAudio, setActiveAudio] = useState<1 | 2>(1);
  const [currentPlayingUrl, setCurrentPlayingUrl] = useState<string | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio elements
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
      audio1Ref.current = new window.Audio();
      audio1Ref.current.loop = true;
      audio2Ref.current = new window.Audio();
      audio2Ref.current.loop = true;
    }
  }, []);

  // Sync volume for active audio when volume/mute changes without track change
  useEffect(() => {
    const currentAudio = activeAudio === 1 ? audio1Ref.current : audio2Ref.current;
    if (currentAudio && currentTrackUrl === currentPlayingUrl) {
      currentAudio.volume = isMuted ? 0 : masterVolume * 0.4;
    }
  }, [masterVolume, isMuted, activeAudio, currentTrackUrl, currentPlayingUrl]);

  // Handle track changes with crossfade
  useEffect(() => {
    if (!hasInteracted) return;

    const currentAudio = activeAudio === 1 ? audio1Ref.current : audio2Ref.current;
    const nextAudio = activeAudio === 1 ? audio2Ref.current : audio1Ref.current;

    if (!currentAudio || !nextAudio) return;

    if (currentTrackUrl === currentPlayingUrl) {
      // If we interacted and current is paused, play it
      if (currentTrackUrl && currentAudio.paused && !isMuted) {
        currentAudio.play().catch(() => {});
      }
      return;
    }

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    if (!currentTrackUrl) {
      // Just fade out current
      let fadeStep = 0;
      fadeIntervalRef.current = setInterval(() => {
        fadeStep += 0.05;
        if (fadeStep >= 1) {
          if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
          currentAudio.pause();
          currentAudio.src = '';
        } else {
          try { currentAudio.volume = (1 - fadeStep) * (isMuted ? 0 : masterVolume * 0.4); } catch(e){}
        }
      }, 50);
      setCurrentPlayingUrl(null);
      return;
    }

    // Prepare next audio
    nextAudio.src = currentTrackUrl;
    nextAudio.volume = 0;
    nextAudio.play().catch(() => {
      // Browsers may block autoplay
    });

    // Crossfade
    let fadeStep = 0;
    fadeIntervalRef.current = setInterval(() => {
      fadeStep += 0.05;
      if (fadeStep >= 1) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        currentAudio.pause();
        currentAudio.src = '';
        nextAudio.volume = isMuted ? 0 : masterVolume * 0.4;
      } else {
        const nextVol = fadeStep * (isMuted ? 0 : masterVolume * 0.4);
        const currVol = (1 - fadeStep) * (isMuted ? 0 : masterVolume * 0.4);
        try { nextAudio.volume = nextVol; } catch(e){}
        try { currentAudio.volume = currVol; } catch(e){}
      }
    }, 50);

    setActiveAudio(activeAudio === 1 ? 2 : 1);
    setCurrentPlayingUrl(currentTrackUrl);

    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, [currentTrackUrl, masterVolume, isMuted, activeAudio, currentPlayingUrl, hasInteracted]);

  const playAchievementSfx = () => {
    if (isMuted || typeof window === 'undefined') return;
    const sfx = new window.Audio('/music/GreenWood Level Up_Achievement.m4a');
    sfx.volume = masterVolume * 0.8;
    sfx.play().catch(() => {});
  };

  return { playAchievementSfx };
}
