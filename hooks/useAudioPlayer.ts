import { useEffect, useRef } from 'react';

export function useAudioPlayer(
  currentTrackUrl: string | null,
  masterVolume: number,
  isMuted: boolean,
  hasInteracted: boolean
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentPlayingUrlRef = useRef<string | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize single audio element
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
      audioRef.current = new window.Audio();
      audioRef.current.loop = true;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  // Handle track changes, volume, and muting
  useEffect(() => {
    if (!hasInteracted) return;

    const audio = audioRef.current;
    if (!audio) return;

    const targetMaxVol = isMuted ? 0 : masterVolume * 0.4;

    // Helper to change track immediately
    const playNewTrack = (url: string) => {
      try {
        audio.pause();
        audio.src = url;
        audio.volume = 0;
        currentPlayingUrlRef.current = url;
        if (!isMuted) {
          audio.play().catch(() => {});
        }
        
        // Fade in
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        let fadeStep = 0;
        fadeIntervalRef.current = setInterval(() => {
          fadeStep += 0.1;
          if (fadeStep >= 1) {
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
            audio.volume = targetMaxVol;
          } else {
            audio.volume = fadeStep * targetMaxVol;
          }
        }, 50);
      } catch (e) {}
    };

    // Helper to fade out and stop
    const stopPlaying = () => {
      try {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        
        const startVol = audio.volume;
        if (startVol > 0 && !audio.paused) {
          let fadeStep = 0;
          fadeIntervalRef.current = setInterval(() => {
            fadeStep += 0.1;
            if (fadeStep >= 1) {
              if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
              fadeIntervalRef.current = null;
              audio.pause();
              audio.src = '';
              audio.volume = 0;
              currentPlayingUrlRef.current = null;
            } else {
              audio.volume = Math.max(0, startVol * (1 - fadeStep));
            }
          }, 50);
        } else {
          audio.pause();
          audio.src = '';
          audio.volume = 0;
          currentPlayingUrlRef.current = null;
        }
      } catch (e) {}
    };

    // If no track url is active
    if (!currentTrackUrl) {
      stopPlaying();
      return;
    }

    // If target track is already playing, sync volume and play/pause state
    if (currentTrackUrl === currentPlayingUrlRef.current) {
      if (isMuted) {
        audio.volume = 0;
      } else {
        if (!fadeIntervalRef.current) {
          audio.volume = targetMaxVol;
        }
        if (audio.paused) {
          audio.play().catch(() => {});
        }
      }
      return;
    }

    // Otherwise, transition to new track (fade out first, then play new track)
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    const startVol = audio.volume;
    if (startVol > 0 && !audio.paused) {
      let fadeStep = 0;
      fadeIntervalRef.current = setInterval(() => {
        fadeStep += 0.1;
        if (fadeStep >= 1) {
          if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
          playNewTrack(currentTrackUrl);
        } else {
          audio.volume = Math.max(0, startVol * (1 - fadeStep));
        }
      }, 50);
    } else {
      playNewTrack(currentTrackUrl);
    }

  }, [currentTrackUrl, masterVolume, isMuted, hasInteracted]);

  const achievementSfxRef = useRef<HTMLAudioElement | null>(null);

  const playAchievementSfx = () => {
    // Silenced completely - only background music plays
  };

  return { playAchievementSfx };
}


