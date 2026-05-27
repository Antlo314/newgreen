import { useEffect, useRef } from 'react';

export function useAudioPlayer(
  currentTrackUrl: string | null,
  masterVolume: number,
  isMuted: boolean,
  hasInteracted: boolean
) {
  const audio1Ref = useRef<HTMLAudioElement | null>(null);
  const audio2Ref = useRef<HTMLAudioElement | null>(null);
  const activeIndexRef = useRef<1 | 2>(1);
  const currentPlayingUrlRef = useRef<string | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio elements
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
      audio1Ref.current = new window.Audio();
      audio1Ref.current.loop = true;
      audio2Ref.current = new window.Audio();
      audio2Ref.current.loop = true;
    }
    return () => {
      if (audio1Ref.current) {
        audio1Ref.current.pause();
        audio1Ref.current.src = '';
      }
      if (audio2Ref.current) {
        audio2Ref.current.pause();
        audio2Ref.current.src = '';
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  // Handle track changes, crossfades, volume, and muting
  useEffect(() => {
    if (!hasInteracted) return;

    const audio1 = audio1Ref.current;
    const audio2 = audio2Ref.current;
    if (!audio1 || !audio2) return;

    const targetMaxVol = isMuted ? 0 : masterVolume * 0.4;

    const stopAudio = (audio: HTMLAudioElement) => {
      try {
        audio.pause();
        audio.src = '';
        audio.volume = 0;
      } catch (e) {}
    };

    // If no track url is active (e.g. game is paused or chiptunes are playing)
    if (!currentTrackUrl) {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }

      const activeAudio = activeIndexRef.current === 1 ? audio1 : audio2;
      const startVol = activeAudio.volume;

      if (startVol > 0 && !activeAudio.paused) {
        let fadeStep = 0;
        fadeIntervalRef.current = setInterval(() => {
          fadeStep += 0.05;
          if (fadeStep >= 1) {
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
            stopAudio(audio1);
            stopAudio(audio2);
            currentPlayingUrlRef.current = null;
          } else {
            activeAudio.volume = Math.max(0, startVol * (1 - fadeStep));
          }
        }, 50);
      } else {
        stopAudio(audio1);
        stopAudio(audio2);
        currentPlayingUrlRef.current = null;
      }
      return;
    }

    // If same track is playing, update volume and playing state
    if (currentTrackUrl === currentPlayingUrlRef.current) {
      const activeAudio = activeIndexRef.current === 1 ? audio1 : audio2;
      const inactiveAudio = activeIndexRef.current === 1 ? audio2 : audio1;

      stopAudio(inactiveAudio);

      if (isMuted) {
        activeAudio.volume = 0;
      } else {
        if (!fadeIntervalRef.current) {
          activeAudio.volume = targetMaxVol;
        }
        if (activeAudio.paused) {
          activeAudio.play().catch(() => {});
        }
      }
      return;
    }

    // Crossfade to new track
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    const currentAudio = activeIndexRef.current === 1 ? audio1 : audio2;
    const nextAudio = activeIndexRef.current === 1 ? audio2 : audio1;

    currentPlayingUrlRef.current = currentTrackUrl;
    activeIndexRef.current = activeIndexRef.current === 1 ? 2 : 1;

    // Setup and play next audio
    nextAudio.src = currentTrackUrl;
    nextAudio.volume = 0;
    if (!isMuted) {
      nextAudio.play().catch(() => {});
    }

    const startVol = currentAudio.volume;
    let fadeStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      fadeStep += 0.05;
      if (fadeStep >= 1) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        stopAudio(currentAudio);
        nextAudio.volume = targetMaxVol;
      } else {
        nextAudio.volume = fadeStep * targetMaxVol;
        currentAudio.volume = Math.max(0, (1 - fadeStep) * startVol);
      }
    }, 50);

  }, [currentTrackUrl, masterVolume, isMuted, hasInteracted]);

  const playAchievementSfx = () => {
    if (isMuted || typeof window === 'undefined') return;
    const sfx = new window.Audio('/music/GreenWood Level Up_Achievement.m4a');
    sfx.volume = masterVolume * 0.8;
    sfx.play().catch(() => {});
  };

  return { playAchievementSfx };
}

