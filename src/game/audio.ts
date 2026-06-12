// AudioManager — crossfading music (HTMLAudio) + synthesized SFX (WebAudio).
// Singleton so game logic can call audio.sfx(...) without React plumbing.

import { MUSIC } from './data';

export type SfxName =
  | 'ui'
  | 'chop'
  | 'mine'
  | 'dig'
  | 'build'
  | 'complete'
  | 'coin'
  | 'talk'
  | 'questAccept'
  | 'questReady'
  | 'footstep'
  | 'error';

const MUSIC_VOL = 0.35;
const FADE_MS = 1200;

class AudioManager {
  private a: HTMLAudioElement | null = null;
  private b: HTMLAudioElement | null = null;
  private active: 'a' | 'b' = 'a';
  private currentUrl: string | null = null;
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private muted = false;
  private unlocked = false;
  private fadeRaf = 0;
  private jingle: HTMLAudioElement | null = null;
  private lastSfx: Record<string, number> = {};

  /** Must be called from a user gesture (click/keydown) to satisfy autoplay policy. */
  unlock() {
    if (this.unlocked || typeof window === 'undefined') return;
    this.unlocked = true;
    this.a = new Audio();
    this.b = new Audio();
    this.a.loop = true;
    this.b.loop = true;
    this.a.volume = 0;
    this.b.volume = 0;
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
    if (this.currentUrl) {
      const url = this.currentUrl;
      this.currentUrl = null;
      this.playMusic(url);
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    const cur = this.active === 'a' ? this.a : this.b;
    if (cur) cur.volume = m ? 0 : MUSIC_VOL;
    if (this.sfxGain) this.sfxGain.gain.value = m ? 0 : 0.5;
    if (m && this.jingle) this.jingle.pause();
  }

  isMuted() {
    return this.muted;
  }

  /** Crossfade to a new looping track. No-op if already playing it. */
  playMusic(url: string | null) {
    if (url === this.currentUrl) return;
    this.currentUrl = url;
    if (!this.unlocked || !this.a || !this.b) return;

    const from = this.active === 'a' ? this.a : this.b;
    const to = this.active === 'a' ? this.b : this.a;
    this.active = this.active === 'a' ? 'b' : 'a';

    cancelAnimationFrame(this.fadeRaf);

    if (url) {
      to.src = url;
      to.volume = 0;
      to.currentTime = 0;
      to.play().catch(() => {});
    }

    const fromStart = from.volume;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / FADE_MS);
      from.volume = fromStart * (1 - k);
      if (url && !this.muted) to.volume = MUSIC_VOL * k;
      if (k < 1) {
        this.fadeRaf = requestAnimationFrame(step);
      } else {
        from.pause();
        from.removeAttribute('src');
      }
    };
    this.fadeRaf = requestAnimationFrame(step);
  }

  /** One-shot achievement jingle, ducking the music briefly. */
  playLevelUp() {
    if (!this.unlocked || this.muted) return;
    try {
      if (!this.jingle) this.jingle = new Audio(MUSIC.levelUp);
      this.jingle.currentTime = 0;
      this.jingle.volume = 0.45;
      this.jingle.play().catch(() => {});
      const cur = this.active === 'a' ? this.a : this.b;
      if (cur) {
        cur.volume = MUSIC_VOL * 0.3;
        setTimeout(() => {
          if (cur && !this.muted) cur.volume = MUSIC_VOL;
        }, 4000);
      }
      setTimeout(() => this.jingle?.pause(), 5000);
    } catch {
      /* noop */
    }
  }

  // -------------------------------------------------------------------
  // Synthesized SFX
  // -------------------------------------------------------------------

  sfx(name: SfxName) {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = performance.now();
    // rate-limit identical sfx to avoid machine-gunning
    if (now - (this.lastSfx[name] ?? 0) < 70) return;
    this.lastSfx[name] = now;
    const t = this.ctx.currentTime;

    switch (name) {
      case 'ui':
        this.blip(660, 0.04, 'square', 0.12, t);
        break;
      case 'talk':
        this.blip(440, 0.05, 'triangle', 0.18, t);
        this.blip(550, 0.05, 'triangle', 0.14, t + 0.06);
        break;
      case 'chop':
        this.noise(0.07, 1200, 0.5, t);
        this.blip(180, 0.06, 'triangle', 0.25, t);
        break;
      case 'mine':
        this.noise(0.05, 2600, 0.4, t);
        this.blip(95, 0.09, 'square', 0.22, t);
        break;
      case 'dig':
        this.noise(0.12, 500, 0.5, t);
        break;
      case 'build':
        this.blip(150, 0.1, 'square', 0.3, t);
        this.noise(0.08, 900, 0.4, t + 0.02);
        this.blip(150, 0.1, 'square', 0.22, t + 0.18);
        this.noise(0.08, 900, 0.3, t + 0.2);
        break;
      case 'complete':
        this.blip(523, 0.12, 'triangle', 0.25, t);
        this.blip(659, 0.12, 'triangle', 0.25, t + 0.1);
        this.blip(784, 0.2, 'triangle', 0.28, t + 0.2);
        break;
      case 'coin':
        this.blip(988, 0.05, 'sine', 0.12, t);
        this.blip(1319, 0.1, 'sine', 0.12, t + 0.05);
        break;
      case 'questAccept':
        this.blip(392, 0.1, 'triangle', 0.22, t);
        this.blip(523, 0.16, 'triangle', 0.24, t + 0.1);
        break;
      case 'questReady':
        this.blip(587, 0.1, 'sine', 0.2, t);
        this.blip(880, 0.18, 'sine', 0.22, t + 0.1);
        break;
      case 'footstep':
        this.noise(0.03, 350, 0.12, t);
        break;
      case 'error':
        this.blip(160, 0.15, 'sawtooth', 0.18, t);
        break;
    }
  }

  private blip(freq: number, dur: number, type: OscillatorType, vol: number, when: number) {
    if (!this.ctx || !this.sfxGain) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    o.connect(g);
    g.connect(this.sfxGain);
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  private noise(dur: number, cutoff: number, vol: number, when: number) {
    if (!this.ctx || !this.sfxGain) return;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxGain);
    src.start(when);
  }
}

export const audio = new AudioManager();
