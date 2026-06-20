// Emberwilds — self-contained WebAudio engine.
// Synthesizes all SFX and a small procedural chiptune score (no audio files),
// so the adventure ships zero audio assets and never touches the parent game's
// AudioManager.

export type AdvSfx =
  | 'ui'
  | 'step'
  | 'swing'
  | 'hit'
  | 'hurt'
  | 'enemyDie'
  | 'coin'
  | 'heart'
  | 'chest'
  | 'key'
  | 'shard'
  | 'talk'
  | 'gate'
  | 'warp'
  | 'victory'
  | 'error';

export type AdvMood = 'menu' | 'explore' | 'forest' | 'cave' | 'danger' | 'victory';

// scale degrees (semitone offsets) for a warm, folk-ish minor pentatonic feel
const A2 = 110;
const note = (semi: number, octave = 0) => A2 * Math.pow(2, octave + semi / 12);

interface Track {
  lead: number[]; // semitone offsets, -99 = rest
  bass: number[];
  octave: number;
  tempo: number; // seconds per step
  wave: OscillatorType;
}

const SCORES: Record<AdvMood, Track> = {
  menu: {
    lead: [0, 3, 7, 10, 7, 3, 5, 3, 0, -99, 3, 7, 12, 10, 7, 3],
    bass: [0, -99, 7, -99, 5, -99, 3, -99],
    octave: 1,
    tempo: 0.34,
    wave: 'triangle',
  },
  explore: {
    lead: [0, 3, 5, 7, 5, 3, 0, -99, 7, 5, 3, 5, 7, 10, 7, 5],
    bass: [0, -99, 5, -99, 7, -99, 3, -99],
    octave: 1,
    tempo: 0.3,
    wave: 'triangle',
  },
  forest: {
    lead: [7, 5, 3, 0, 3, 5, 7, -99, 10, 7, 5, 3, 0, -99, 3, -99],
    bass: [0, -99, 3, -99, 5, -99, 0, -99],
    octave: 1,
    tempo: 0.32,
    wave: 'sine',
  },
  cave: {
    lead: [0, -99, 3, -99, 2, -99, 0, -99, -2, -99, 0, -99, 3, -99, 5, -99],
    bass: [0, -99, -99, -99, -5, -99, -99, -99],
    octave: 0,
    tempo: 0.36,
    wave: 'sine',
  },
  danger: {
    lead: [0, 1, 0, -2, 0, 1, 3, 1, 0, 1, 0, -2, -3, -2, 0, 1],
    bass: [0, 0, -2, -2, -3, -3, -2, -2],
    octave: 1,
    tempo: 0.18,
    wave: 'square',
  },
  victory: {
    lead: [0, 4, 7, 12, 7, 12, 16, 19, 16, 12, 7, 12, 16, 19, 24, -99],
    bass: [0, -99, 7, -99, 12, -99, 7, -99],
    octave: 1,
    tempo: 0.2,
    wave: 'triangle',
  },
};

class AdventureAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private muted = false;
  private unlocked = false;

  private mood: AdvMood | null = null;
  private step = 0;
  private nextTime = 0;
  private timer: number | null = null;
  private lastSfx: Record<string, number> = {};

  unlock() {
    if (this.unlocked || typeof window === 'undefined') return;
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.32;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.6;
      this.sfxGain.connect(this.master);
      this.unlocked = true;
      if (this.mood) this.startLoop();
    } catch {
      this.ctx = null;
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.9;
  }
  isMuted() {
    return this.muted;
  }

  setMood(mood: AdvMood) {
    if (mood === this.mood) return;
    this.mood = mood;
    this.step = 0;
    if (this.unlocked && this.ctx) {
      this.nextTime = this.ctx.currentTime + 0.05;
      this.startLoop();
    }
  }

  private startLoop() {
    if (this.timer != null) return;
    const tick = () => {
      this.schedule();
      this.timer = window.setTimeout(tick, 60);
    };
    tick();
  }

  stop() {
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private schedule() {
    if (!this.ctx || !this.musicGain || !this.mood) return;
    // if the tab was backgrounded (or this is the first unlock), the audio clock
    // ran ahead of nextTime — resync instead of replaying a backlog of past-
    // timestamp notes, which would otherwise fire all at once as a glitchy burst
    if (this.nextTime < this.ctx.currentTime) this.nextTime = this.ctx.currentTime + 0.05;
    const track = SCORES[this.mood];
    const lookahead = 0.3;
    while (this.nextTime < this.ctx.currentTime + lookahead) {
      const i = this.step % track.lead.length;
      const lead = track.lead[i];
      if (lead > -90 && !this.muted) {
        this.tone(note(lead, track.octave + 1), this.nextTime, track.tempo * 0.9, track.wave, 0.16);
      }
      const bi = this.step % track.bass.length;
      const bass = track.bass[bi];
      if (bass > -90 && !this.muted) {
        this.tone(note(bass, track.octave), this.nextTime, track.tempo * 1.4, 'sine', 0.22);
      }
      this.nextTime += track.tempo;
      this.step++;
    }
  }

  private tone(freq: number, when: number, dur: number, wave: OscillatorType, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = wave;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, when + dur);
    o.connect(g);
    g.connect(this.musicGain);
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  private blip(freq: number, dur: number, wave: OscillatorType, vol: number, t: number, slideTo?: number) {
    if (!this.ctx || !this.sfxGain) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.sfxGain);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private noise(dur: number, cutoff: number, vol: number, t: number) {
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
    src.start(t);
  }

  sfx(name: AdvSfx) {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = performance.now();
    if (now - (this.lastSfx[name] ?? 0) < 55) return;
    this.lastSfx[name] = now;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'ui':
        this.blip(620, 0.05, 'square', 0.14, t);
        break;
      case 'step':
        this.noise(0.03, 380, 0.1, t);
        break;
      case 'swing':
        this.noise(0.08, 2200, 0.18, t);
        this.blip(420, 0.06, 'sawtooth', 0.08, t, 760);
        break;
      case 'hit':
        this.noise(0.06, 1400, 0.3, t);
        this.blip(180, 0.08, 'square', 0.2, t, 90);
        break;
      case 'hurt':
        this.blip(330, 0.16, 'sawtooth', 0.2, t, 110);
        this.noise(0.1, 800, 0.18, t);
        break;
      case 'enemyDie':
        this.blip(440, 0.12, 'square', 0.18, t, 120);
        this.noise(0.12, 1600, 0.2, t);
        break;
      case 'coin':
        this.blip(880, 0.05, 'sine', 0.14, t);
        this.blip(1320, 0.1, 'sine', 0.14, t + 0.05);
        break;
      case 'heart':
        this.blip(523, 0.1, 'triangle', 0.18, t);
        this.blip(784, 0.16, 'triangle', 0.18, t + 0.09);
        break;
      case 'chest':
        this.noise(0.06, 900, 0.2, t);
        this.blip(330, 0.1, 'square', 0.16, t);
        this.blip(660, 0.16, 'triangle', 0.18, t + 0.12);
        break;
      case 'key':
        this.blip(740, 0.06, 'square', 0.14, t);
        this.blip(990, 0.12, 'sine', 0.16, t + 0.06);
        break;
      case 'shard':
        this.blip(659, 0.1, 'triangle', 0.2, t);
        this.blip(988, 0.1, 'triangle', 0.2, t + 0.09);
        this.blip(1319, 0.28, 'sine', 0.22, t + 0.18);
        break;
      case 'talk':
        this.blip(440, 0.04, 'triangle', 0.12, t);
        this.blip(560, 0.05, 'triangle', 0.1, t + 0.05);
        break;
      case 'gate':
        this.noise(0.4, 500, 0.22, t);
        this.blip(120, 0.4, 'sawtooth', 0.16, t, 70);
        break;
      case 'warp':
        this.blip(300, 0.3, 'sine', 0.2, t, 1200);
        this.blip(500, 0.3, 'triangle', 0.12, t + 0.05, 1600);
        break;
      case 'victory': {
        const seq = [523, 659, 784, 1047, 1319, 1568];
        seq.forEach((f, i) => this.blip(f, 0.22, 'triangle', 0.22, t + i * 0.13));
        break;
      }
      case 'error':
        this.blip(180, 0.16, 'sawtooth', 0.18, t, 120);
        break;
    }
  }
}

export const advAudio = new AdventureAudio();
