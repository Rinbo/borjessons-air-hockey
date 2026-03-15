import { Position } from './board';

interface Snapshot {
  x: number;
  y: number;
  time: number;
}

/**
 * Render delay in ms — we render this far behind real-time to ensure
 * we almost always have two snapshots to interpolate between.
 * At 60Hz server tick rate (16.7ms per tick), 2 ticks ≈ 33ms.
 */
const BUFFER_DELAY_MS = 50;

/** Maximum snapshots to retain (ring buffer capacity). */
const MAX_SNAPSHOTS = 10;

/**
 * Snapshot interpolation buffer for server-authoritative entities
 * (puck and opponent handle).
 *
 * Uses a fixed-size ring buffer of pre-allocated Snapshot objects
 * (zero per-push GC allocations) and Hermite cubic interpolation
 * for buttery-smooth motion between server ticks.
 *
 * Instead of rendering the latest server position immediately (which causes
 * stuttering on network jitter), we delay rendering by BUFFER_DELAY_MS and
 * interpolate between two buffered server snapshots using cubic curves
 * derived from consecutive-snapshot velocities.
 *
 * Based on the snapshot interpolation technique described by:
 * - Valve Source Engine (entity interpolation / cl_interp)
 * - Gabriel Gambetta (Fast-Paced Multiplayer Part III)
 * - Glenn Fiedler / Gaffer On Games (Snapshot Interpolation)
 */
export default class SnapshotBuffer {
  // Pre-allocated ring buffer — no `new` or `push` on the hot path
  private readonly ring: Snapshot[];
  private head: number = 0;  // next write index
  private count: number = 0; // number of valid entries

  // Reusable position object to avoid per-frame allocation
  private readonly resultPos: Position = { x: 0, y: 0 };

  constructor() {
    this.ring = new Array(MAX_SNAPSHOTS);
    for (let i = 0; i < MAX_SNAPSHOTS; i++) {
      this.ring[i] = { x: 0, y: 0, time: 0 };
    }
  }

  /**
   * Push a new server snapshot into the ring buffer (zero allocation).
   */
  public push(x: number, y: number, now: number): void {
    const slot = this.ring[this.head];
    slot.x = x;
    slot.y = y;
    slot.time = now;

    this.head = (this.head + 1) % MAX_SNAPSHOTS;
    if (this.count < MAX_SNAPSHOTS) this.count++;
  }

  /**
   * Clear all buffered snapshots (e.g. when puck goes off-board after a goal).
   */
  public clear(): void {
    this.count = 0;
    this.head = 0;
  }

  /**
   * Get the i-th oldest snapshot (0 = oldest, count-1 = newest).
   * Only valid for i in [0, count).
   */
  private at(i: number): Snapshot {
    // The oldest entry is at (head - count) mod capacity
    return this.ring[((this.head - this.count + i) % MAX_SNAPSHOTS + MAX_SNAPSHOTS) % MAX_SNAPSHOTS];
  }

  /**
   * Sample the interpolated position at the given render time.
   * Uses Hermite cubic interpolation when 3+ snapshots are available,
   * falling back to linear interpolation otherwise.
   */
  public sample(now: number): Position | null {
    if (this.count === 0) return null;

    const renderTime = now - BUFFER_DELAY_MS;

    // If we only have one snapshot, use it directly
    if (this.count === 1) {
      const s = this.at(0);
      this.resultPos.x = s.x;
      this.resultPos.y = s.y;
      return this.resultPos;
    }

    // If renderTime is before the earliest snapshot, use the earliest
    const earliest = this.at(0);
    if (renderTime <= earliest.time) {
      this.resultPos.x = earliest.x;
      this.resultPos.y = earliest.y;
      return this.resultPos;
    }

    // If renderTime is after the latest snapshot, hold at last known position
    const latest = this.at(this.count - 1);
    if (renderTime >= latest.time) {
      this.resultPos.x = latest.x;
      this.resultPos.y = latest.y;
      return this.resultPos;
    }

    // Find the two snapshots bracketing renderTime
    for (let i = 0; i < this.count - 1; i++) {
      const a = this.at(i);
      const b = this.at(i + 1);

      if (renderTime >= a.time && renderTime <= b.time) {
        const dt = b.time - a.time;
        if (dt <= 0) {
          this.resultPos.x = b.x;
          this.resultPos.y = b.y;
          return this.resultPos;
        }

        const t = (renderTime - a.time) / dt;

        // Linear interpolation — physically correct for straight-line puck motion
        this.resultPos.x = a.x + (b.x - a.x) * t;
        this.resultPos.y = a.y + (b.y - a.y) * t;

        return this.resultPos;
      }
    }

    // Fallback (shouldn't happen)
    this.resultPos.x = latest.x;
    this.resultPos.y = latest.y;
    return this.resultPos;
  }
}
