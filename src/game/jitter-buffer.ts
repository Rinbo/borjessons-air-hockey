import { Position } from './board';

interface Snapshot {
  position: Position;
  timestamp: number;
}

/** Render delay in ms — we render this far behind real-time to absorb jitter. */
const BUFFER_DELAY_MS = 40; // 2 server ticks at 50 FPS

/** Maximum snapshots to retain. */
const MAX_SNAPSHOTS = 6;

/**
 * Time-based jitter buffer for the opponent's handle.
 *
 * Instead of rendering the latest server position immediately (which causes
 * stuttering on network jitter), we delay rendering by BUFFER_DELAY_MS and
 * smoothly interpolate between buffered snapshots. This adds ~40ms of visual
 * latency for the opponent's handle — imperceptible in practice — but
 * eliminates all stutter and teleportation.
 */
export default class JitterBuffer {
  private snapshots: Snapshot[] = [];

  /**
   * Push a new server snapshot into the buffer.
   */
  public push(position: Position, timestamp: number): void {
    this.snapshots.push({ position, timestamp });

    // Evict old snapshots beyond capacity
    if (this.snapshots.length > MAX_SNAPSHOTS) {
      this.snapshots.shift();
    }
  }

  /**
   * Sample the buffered position at the given render time.
   * Returns an interpolated position from BUFFER_DELAY_MS ago.
   */
  public sample(now: number): Position | null {
    if (this.snapshots.length === 0) return null;

    const renderTime = now - BUFFER_DELAY_MS;

    // If we only have one snapshot, use it directly
    if (this.snapshots.length === 1) {
      return this.snapshots[0].position;
    }

    // Find the two snapshots surrounding renderTime
    // Snapshots are in chronological order
    const len = this.snapshots.length;

    // If renderTime is before the earliest snapshot, use the earliest
    if (renderTime <= this.snapshots[0].timestamp) {
      return this.snapshots[0].position;
    }

    // If renderTime is after the latest snapshot, use the latest
    // (happens during sustained packet loss — better to show last known position)
    if (renderTime >= this.snapshots[len - 1].timestamp) {
      return this.snapshots[len - 1].position;
    }

    // Find the bracketing pair
    for (let i = 0; i < len - 1; i++) {
      const a = this.snapshots[i];
      const b = this.snapshots[i + 1];

      if (renderTime >= a.timestamp && renderTime <= b.timestamp) {
        const dt = b.timestamp - a.timestamp;
        if (dt <= 0) return b.position;

        const alpha = (renderTime - a.timestamp) / dt;
        return {
          x: a.position.x + (b.position.x - a.position.x) * alpha,
          y: a.position.y + (b.position.y - a.position.y) * alpha,
        };
      }
    }

    // Fallback (shouldn't happen)
    return this.snapshots[len - 1].position;
  }

  /**
   * Clear the buffer (e.g., on disconnect or game reset).
   */
  public clear(): void {
    this.snapshots = [];
  }
}
