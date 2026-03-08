import { BroadcastState, Position } from './board';

/**
 * Snapshot stored in the ring buffer — the server state plus its arrival time.
 */
interface TimedState {
  state: BroadcastState;
  arrivalTime: number; // performance.now() when the state was received
}

/**
 * The result of sampling the buffer at a given time.
 */
export interface InterpolatedState {
  opponent: Position;
  puck: Position;
  remainingSeconds: number;
  collisionEvent: number;
}

/**
 * Debug statistics exposed for the optional network overlay.
 */
export interface JitterStats {
  /** Number of states currently queued in the buffer */
  bufferDepth: number;
  /** Estimated server tick interval in ms (running average) */
  estimatedTickMs: number;
  /** Current jitter — standard deviation of inter-arrival times in ms */
  jitterMs: number;
  /** Whether the buffer is currently extrapolating (ran out of states) */
  isExtrapolating: boolean;
}

// ── Constants ──────────────────────────────────────────

/** Maximum number of states to hold in the ring buffer */
const BUFFER_CAPACITY = 8;

/**
 * Target buffer depth in states. We intentionally play back states with a small
 * delay (targetDepth × tick) so there's always a cushion to absorb jitter.
 * 2 states ≈ 40ms at 50Hz — barely perceptible but absorbs most spikes.
 */
const TARGET_DEPTH = 2;

/** Smoothing factor for the exponential moving average of tick intervals */
const TICK_EMA_ALPHA = 0.15;

/** Maximum duration (in ticks) to extrapolate before holding position */
const MAX_EXTRAPOLATION_TICKS = 1.5;

/** Default assumed tick interval before we have enough data */
const DEFAULT_TICK_MS = 20; // 50Hz

// ── Helpers ────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpPos(from: Position, to: Position, t: number): Position {
  return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t) };
}

/**
 * Detect the server's OFF_BOARD_POSITION sentinel (-1, -1).
 * When a goal is scored, the puck is placed here until the reset timer expires.
 */
function isOffBoard(pos: Position): boolean {
  return pos.x < 0 || pos.y < 0;
}

/**
 * A jitter-absorbing interpolation buffer for smooth real-time game rendering.
 *
 * Instead of rendering the two most recent server states directly, incoming
 * states are pushed into a small ring buffer. The renderer samples the buffer
 * at display-refresh rate, playing back states with a small intentional delay
 * (≈ TARGET_DEPTH × tick). This decouples the rendering timeline from the
 * network arrival timeline, absorbing jitter spikes without visible stuttering.
 *
 * When the buffer runs dry (packet loss / severe jitter), the sampler linearly
 * extrapolates from the last two known states for up to MAX_EXTRAPOLATION_TICKS
 * before freezing in place. This bridges brief gaps invisibly.
 */
export default class InterpolationBuffer {
  // Ring buffer of incoming states
  private buffer: TimedState[] = [];

  // The two states we are currently interpolating between
  private fromState: BroadcastState | null = null;
  private toState: BroadcastState | null = null;

  // Playback timeline (in performance.now() space)
  private playbackTime: number = 0;
  private playbackStarted: boolean = false;

  // Adaptive tick estimation
  private estimatedTickMs: number = DEFAULT_TICK_MS;
  private lastArrivalTime: number = 0;
  private arrivalCount: number = 0;

  // Jitter tracking (variance of inter-arrival deltas)
  private jitterVariance: number = 0;

  // Extrapolation tracking
  private isExtrapolating: boolean = false;

  /**
   * Push a new server state into the buffer. Called on every WebSocket message.
   */
  push(state: BroadcastState): void {
    const now = performance.now();

    // Update adaptive tick estimation
    if (this.lastArrivalTime > 0) {
      const delta = now - this.lastArrivalTime;
      this.arrivalCount++;

      if (this.arrivalCount <= 3) {
        // Bootstrap: use simple average for the first few samples
        this.estimatedTickMs =
          (this.estimatedTickMs * (this.arrivalCount - 1) + delta) / this.arrivalCount;
      } else {
        // EMA for stable ongoing estimation; ignore extreme outliers (> 4× tick)
        if (delta < this.estimatedTickMs * 4) {
          const diff = delta - this.estimatedTickMs;
          this.estimatedTickMs += TICK_EMA_ALPHA * diff;
          // Update jitter variance (Welford-style EMA)
          this.jitterVariance += TICK_EMA_ALPHA * (diff * diff - this.jitterVariance);
        }
      }
    }
    this.lastArrivalTime = now;

    // Add to buffer
    this.buffer.push({ state, arrivalTime: now });

    // Cap buffer size — drop oldest if we're accumulating too much
    while (this.buffer.length > BUFFER_CAPACITY) {
      this.buffer.shift();
    }

    // Initialize playback timeline on first state
    if (!this.playbackStarted && this.buffer.length >= 2) {
      this.fromState = this.buffer[0].state;
      this.toState = this.buffer[1].state;
      // Start playback delayed by TARGET_DEPTH ticks behind real-time
      this.playbackTime = now - TARGET_DEPTH * this.estimatedTickMs;
      this.playbackStarted = true;
      this.buffer.splice(0, 2);
    }
  }

  /**
   * Sample the buffer at the current time and return the interpolated state.
   * Called once per rAF frame.
   */
  sample(now: number): InterpolatedState | null {
    if (!this.playbackStarted || !this.fromState || !this.toState) {
      return null;
    }

    // Advance the playback cursor. The playback time tracks real-time but
    // started offset by TARGET_DEPTH ticks, creating the jitter cushion.
    const targetPlaybackTime = now - TARGET_DEPTH * this.estimatedTickMs;

    // Don't let playback time jump forward too aggressively if there was
    // a long pause (e.g., tab was backgrounded). Cap the advance.
    const maxAdvance = this.estimatedTickMs * 3;
    if (targetPlaybackTime - this.playbackTime > maxAdvance) {
      this.playbackTime += maxAdvance;
    } else {
      this.playbackTime = targetPlaybackTime;
    }

    // Consume buffered states: advance fromState/toState as playback catches up
    while (this.buffer.length > 0) {
      const nextArrival = this.buffer[0].arrivalTime;
      // The state at buffer[0] represents the game state at nextArrival - offset
      // We use arrival times as our timeline reference
      const stateTime = nextArrival - TARGET_DEPTH * this.estimatedTickMs;

      if (this.playbackTime >= stateTime) {
        // Playback has passed this state — shift it in
        this.fromState = this.toState;
        this.toState = this.buffer.shift()!.state;
        this.isExtrapolating = false;
      } else {
        break;
      }
    }

    // Calculate interpolation alpha between fromState and toState
    // Both states are separated by ~1 server tick
    const alpha = this.computeAlpha(now);

    if (alpha <= 1.0) {
      // Normal interpolation between two known states
      this.isExtrapolating = false;

      // Handle off-board puck (goal scored): snap instead of interpolating
      const puck = this.snapOrLerpPuck(this.fromState.puck, this.toState.puck, alpha);

      return {
        opponent: lerpPos(this.fromState.opponent, this.toState.opponent, alpha),
        puck,
        remainingSeconds: this.toState.remainingSeconds,
        collisionEvent: alpha < 0.5 ? this.fromState.collisionEvent : this.toState.collisionEvent
      };
    }

    // alpha > 1.0 — we've run past the toState. Extrapolate if within limits.
    this.isExtrapolating = true;
    const extraAlpha = Math.min(alpha, 1.0 + MAX_EXTRAPOLATION_TICKS);

    return {
      opponent: lerpPos(this.fromState.opponent, this.toState.opponent, extraAlpha),
      puck: this.extrapolatePuck(extraAlpha),
      remainingSeconds: this.toState.remainingSeconds,
      collisionEvent: this.toState.collisionEvent
    };
  }

  /**
   * Return debug/diagnostic statistics.
   */
  getJitterStats(): JitterStats {
    return {
      bufferDepth: this.buffer.length,
      estimatedTickMs: Math.round(this.estimatedTickMs * 10) / 10,
      jitterMs: Math.round(Math.sqrt(this.jitterVariance) * 10) / 10,
      isExtrapolating: this.isExtrapolating
    };
  }

  // ── Private ──────────────────────────────────────────

  /**
   * Compute the interpolation alpha (0..1+ ) for the current playback position
   * between fromState and toState.
   */
  private computeAlpha(_now: number): number {
    // We increment the playback cursor by real elapsed time. The two reference
    // states are assumed to be ~1 tick apart. So alpha = elapsed / tickMs,
    // where elapsed is how far playbackTime has advanced since we last shifted.
    // Rather than tracking the exact shift time, we use a simpler model:
    // the fraction of a tick that hasn't been consumed from the buffer yet.

    // Time since we last consumed a state. Use the arrival gap as reference.
    // If there are buffered states, the next consume will happen when
    // playbackTime reaches the next state's adjusted time.
    if (this.buffer.length > 0) {
      const nextStateTime =
        this.buffer[0].arrivalTime - TARGET_DEPTH * this.estimatedTickMs;
      const prevStateTime = nextStateTime - this.estimatedTickMs;
      const range = nextStateTime - prevStateTime;
      if (range > 0) {
        return (this.playbackTime - prevStateTime) / range;
      }
    }

    // No buffer — use estimated tick as the range.
    // This happens during extrapolation.
    // We track how far past the "toState would have been" we are.
    const timeSinceLastArrival = this.playbackTime -
      (this.lastArrivalTime - TARGET_DEPTH * this.estimatedTickMs);
    return timeSinceLastArrival / this.estimatedTickMs + 1.0;
  }

  /**
   * Extrapolate puck position beyond the last known state, clamping to
   * MAX_EXTRAPOLATION_TICKS to avoid runaway drift. The puck cannot
   * move backwards (no negative velocity reversal from extrapolation).
   */
  private extrapolatePuck(alpha: number): Position {
    const from = this.fromState!.puck;
    const to = this.toState!.puck;

    // Don't extrapolate off-board puck — keep it hidden
    if (isOffBoard(to)) return to;
    if (isOffBoard(from)) return to;

    // Clamp alpha to prevent excessive drift
    const clampedAlpha = Math.min(alpha, 1.0 + MAX_EXTRAPOLATION_TICKS);

    // Linear extrapolation: continue the velocity vector from→to
    const ex = lerp(from.x, to.x, clampedAlpha);
    const ey = lerp(from.y, to.y, clampedAlpha);

    // Clamp to board bounds [0, 1] to prevent the puck from disappearing
    return {
      x: Math.max(0, Math.min(1, ex)),
      y: Math.max(0, Math.min(1, ey))
    };
  }

  /**
   * Handle puck interpolation with off-board sentinel awareness.
   * When either state has the puck off-board, snap instead of interpolating
   * to prevent the puck from briefly appearing at (0, 0).
   */
  private snapOrLerpPuck(from: Position, to: Position, alpha: number): Position {
    // Target is off-board (goal just scored) → snap to off-board immediately
    if (isOffBoard(to)) return to;
    // Coming back from off-board (puck reset) → snap to new position
    if (isOffBoard(from)) return to;
    // Normal case: smooth interpolation
    return lerpPos(from, to, alpha);
  }
}
