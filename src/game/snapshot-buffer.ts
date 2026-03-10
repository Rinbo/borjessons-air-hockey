import { Position } from './board';

interface Snapshot {
  x: number;
  y: number;
  time: number;
  vx?: number;
  vy?: number;
}

/**
 * Render delay in ms — we render this far behind real-time to ensure
 * we almost always have two snapshots to interpolate between.
 * At 60Hz server tick rate (16.7ms per tick), 2 ticks ≈ 33ms.
 */
const BUFFER_DELAY_MS = 50;

/** Maximum snapshots to retain. */
const MAX_SNAPSHOTS = 10;

/**
 * Snapshot interpolation buffer for server-authoritative entities
 * (puck and opponent handle).
 *
 * Instead of rendering the latest server position immediately (which causes
 * stuttering on network jitter), we delay rendering by BUFFER_DELAY_MS and
 * linearly interpolate between two buffered server snapshots.
 *
 * This adds ~33ms of visual latency — imperceptible in practice — but
 * completely eliminates stutter and teleportation. No client-side physics
 * simulation is involved; we only interpolate between real server positions.
 *
 * Based on the snapshot interpolation technique described by:
 * - Valve Source Engine (entity interpolation / cl_interp)
 * - Gabriel Gambetta (Fast-Paced Multiplayer Part III)
 * - Glenn Fiedler / Gaffer On Games (Snapshot Interpolation)
 */
export default class SnapshotBuffer {
  private snapshots: Snapshot[] = [];

  // Reusable position object to avoid per-frame allocation
  private readonly resultPos: Position = { x: 0, y: 0 };

  /**
   * Push a new server snapshot into the buffer.
   */
  public push(x: number, y: number, now: number, vx?: number, vy?: number): void {
    this.snapshots.push({ x, y, time: now, vx, vy });

    // Evict old snapshots beyond capacity
    if (this.snapshots.length > MAX_SNAPSHOTS) {
      this.snapshots.shift();
    }
  }

  /**
   * Clear all buffered snapshots (e.g. when puck goes off-board after a goal).
   */
  public clear(): void {
    this.snapshots.length = 0;
  }

  /**
   * Sample the interpolated position at the given render time.
   * Returns a position interpolated or extrapolated from BUFFER_DELAY_MS ago.
   * If boundedRadius is provided, extrapolated positions will be clamped.
   */
  public sample(now: number, boundedRadius?: { x: number; y: number }): Position | null {
    if (this.snapshots.length === 0) return null;

    const renderTime = now - BUFFER_DELAY_MS;
    const len = this.snapshots.length;

    // If we only have one snapshot, use it directly
    if (len === 1) {
      this.resultPos.x = this.snapshots[0].x;
      this.resultPos.y = this.snapshots[0].y;
      return this.resultPos;
    }

    // If renderTime is before the earliest snapshot, use the earliest
    if (renderTime <= this.snapshots[0].time) {
      this.resultPos.x = this.snapshots[0].x;
      this.resultPos.y = this.snapshots[0].y;
      return this.resultPos;
    }

    // If renderTime is after the latest snapshot, extrapolate if we have velocity
    if (renderTime >= this.snapshots[len - 1].time) {
      const latest = this.snapshots[len - 1];
      
      if (latest.vx !== undefined && latest.vy !== undefined) {
        // Cap extrapolation to 100ms to avoid flying off to infinity
        const timeDeltaMs = Math.min(renderTime - latest.time, 100);
        // Backend speed is per 16.666ms tick (60Hz)
        const ticks = timeDeltaMs / (1000 / 60);
        
        let ex = latest.x + latest.vx * ticks;
        let ey = latest.y + latest.vy * ticks;
        
        // Clamp to board bounds if radius is provided
        if (boundedRadius) {
          ex = Math.max(boundedRadius.x, Math.min(1 - boundedRadius.x, ex));
          // For Y, we also clamp but slightly more generously for goals
          ey = Math.max(0, Math.min(1, ey)); 
        }
        
        this.resultPos.x = ex;
        this.resultPos.y = ey;
        return this.resultPos;
      }
      
      // Fallback: hold at last known position
      this.resultPos.x = latest.x;
      this.resultPos.y = latest.y;
      return this.resultPos;
    }

    // Find the two snapshots bracketing renderTime and interpolate
    for (let i = 0; i < len - 1; i++) {
      const a = this.snapshots[i];
      const b = this.snapshots[i + 1];

      if (renderTime >= a.time && renderTime <= b.time) {
        const dt = b.time - a.time;
        if (dt <= 0) {
          this.resultPos.x = b.x;
          this.resultPos.y = b.y;
          return this.resultPos;
        }

        const alpha = (renderTime - a.time) / dt;
        this.resultPos.x = a.x + (b.x - a.x) * alpha;
        this.resultPos.y = a.y + (b.y - a.y) * alpha;
        return this.resultPos;
      }
    }

    // Fallback (shouldn't happen)
    this.resultPos.x = this.snapshots[len - 1].x;
    this.resultPos.y = this.snapshots[len - 1].y;
    return this.resultPos;
  }
}
