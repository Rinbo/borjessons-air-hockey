/* ===================================================
   Sound Engine — Web Audio API Synthesized Sounds
   =================================================== */

/** Collision event flags matching the server-side BroadcastState constants. */
export const CollisionEvent = {
  NO_EVENT: 0,
  WALL_HIT: 1,
  HANDLE_HIT: 2,
  GOAL: 4,
} as const;

/**
 * Singleton sound engine using the Web Audio API.
 * All sounds are synthesized — no audio file dependencies.
 *
 * Must be initialized after a user gesture (browser autoplay policy).
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private _muted: boolean;

  constructor() {
    this._muted = localStorage.getItem('sound-muted') === 'true';
  }

  get muted(): boolean {
    return this._muted;
  }

  set muted(value: boolean) {
    this._muted = value;
    localStorage.setItem('sound-muted', String(value));
  }

  /** Initialize AudioContext. Call on first user gesture. */
  init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
  }

  /** Resume a suspended AudioContext (needed after tab switch etc). */
  private ensureRunning(): void {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /** Dispatch a collision event to the correct sound. */
  playCollision(event: number): void {
    if (event === CollisionEvent.NO_EVENT) return;
    if (event & CollisionEvent.GOAL) this.playGoal();
    else if (event & CollisionEvent.HANDLE_HIT) this.playHandleHit();
    else if (event & CollisionEvent.WALL_HIT) this.playWallHit();
  }

  /**
   * Handle hit — pure noise, no oscillators.
   * A sharp broadband impact with a resonant body, like hard plastic on plastic.
   */
  playHandleHit(): void {
    if (!this.ctx || this._muted) return;
    this.ensureRunning();
    this.playImpact(4000, 0.45, 300, 0.04);
  }

  /**
   * Wall bounce — same noise family as handle, tuned lower and softer
   * for the duller thud of puck against the rail.
   */
  playWallHit(): void {
    if (!this.ctx || this._muted) return;
    this.ensureRunning();
    this.playImpact(2500, 0.3, 200, 0.05);
  }

  /**
   * Core impact synthesis — shaped white noise through resonant filters.
   * No oscillators = no pitched tonal character.
   *
   * @param cutoff   Lowpass cutoff Hz (higher = brighter/sharper)
   * @param volume   Peak gain (0–1)
   * @param bassFreq Peaking EQ center for the bass "thump"
   * @param decay    Envelope decay time in seconds
   */
  private playImpact(cutoff: number, volume: number, bassFreq: number, decay: number): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const sr = ctx.sampleRate;
    const len = Math.floor(sr * decay);

    // Generate noise with sharp exponential decay baked in
    const buf = ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = Math.pow(1 - i / len, 6); // very sharp decay
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const source = ctx.createBufferSource();
    source.buffer = buf;

    // Resonant lowpass — shapes the main body without adding pitch
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(cutoff, t);
    lp.Q.setValueAtTime(3, t); // resonance adds snap

    // Peaking EQ for bass "thump" weight
    const peak = ctx.createBiquadFilter();
    peak.type = 'peaking';
    peak.frequency.setValueAtTime(bassFreq, t);
    peak.gain.setValueAtTime(8, t);
    peak.Q.setValueAtTime(2, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);

    source.connect(lp).connect(peak).connect(gain).connect(ctx.destination);
    source.start(t);
    source.stop(t + decay);
  }

  /** Rewarding ascending "ding" for goals. */
  playGoal(): void {
    if (!this.ctx || this._muted) return;
    this.ensureRunning();
    const t = this.ctx.currentTime;

    // Two-tone ascending ding
    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const offset = i * 0.12;
      osc.frequency.setValueAtTime(i === 0 ? 880 : 1320, t + offset);

      gain.gain.setValueAtTime(0, t + offset);
      gain.gain.linearRampToValueAtTime(0.3, t + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.3);

      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.3);
    }
  }

  /**
   * Single countdown tick tone. Call once per countdown number.
   * @param isFinal true for the "Go!" tone (higher pitch)
   */
  playCountdownTick(isFinal: boolean): void {
    if (!this.ctx || this._muted) return;
    this.ensureRunning();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isFinal ? 880 : 440, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(isFinal ? 0.3 : 0.2, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  /**
   * Game over buzzer — a short, assertive but not alarming tone.
   * Sawtooth wave with gentle tremolo, like a sports timer horn.
   */
  playGameOver(): void {
    if (!this.ctx || this._muted) return;
    this.ensureRunning();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const masterGain = this.ctx.createGain();

    // Sawtooth at 220 Hz — warmer than square, less harsh
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);

    // Gentle tremolo via LFO
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(6, t);
    lfoGain.gain.setValueAtTime(0.04, t);
    lfo.connect(lfoGain);
    lfoGain.connect(masterGain.gain);

    // Low-pass filter to tame the sawtooth harshness
    const lpf = this.ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(800, t);

    masterGain.gain.setValueAtTime(0.12, t);
    masterGain.gain.setValueAtTime(0.12, t + 0.5);
    masterGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    osc.connect(lpf).connect(masterGain).connect(this.ctx.destination);

    osc.start(t);
    lfo.start(t);
    osc.stop(t + 0.7);
    lfo.stop(t + 0.7);
  }
}

/** Singleton instance. */
export const soundEngine = new SoundEngine();
