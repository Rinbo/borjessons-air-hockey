import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import InterpolationBuffer from './interpolation-buffer';
import type { BroadcastState } from './board';

// ── Helpers ──────────────────────────────────────────

function makeState(puckX: number, puckY: number, opX = 0.5, opY = 0.2): BroadcastState {
  return {
    puck: { x: puckX, y: puckY },
    opponent: { x: opX, y: opY },
    remainingSeconds: 60,
    collisionEvent: 0
  };
}

let mockNow = 0;

function advanceTime(ms: number) {
  mockNow += ms;
}

describe('InterpolationBuffer', () => {
  beforeEach(() => {
    mockNow = 1000; // start at 1000ms to avoid edge cases near zero
    vi.spyOn(performance, 'now').mockImplementation(() => mockNow);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null before receiving enough states', () => {
    const buf = new InterpolationBuffer();
    expect(buf.sample(mockNow)).toBeNull();

    buf.push(makeState(0.5, 0.5));
    expect(buf.sample(mockNow)).toBeNull(); // need at least 2 states
  });

  it('produces smooth output with steady 20ms arrivals', () => {
    const buf = new InterpolationBuffer();

    // Feed 5 states at perfect 20ms intervals
    for (let i = 0; i < 5; i++) {
      buf.push(makeState(0.1 * i, 0.5));
      advanceTime(20);
    }

    // After feeding, the buffer should produce valid output
    const result = buf.sample(mockNow);
    expect(result).not.toBeNull();
    expect(result!.puck.x).toBeGreaterThanOrEqual(0);
    expect(result!.puck.x).toBeLessThanOrEqual(1);
    expect(result!.puck.y).toBeCloseTo(0.5, 2);
  });

  it('handles a jitter spike without backwards movement', () => {
    const buf = new InterpolationBuffer();

    // Feed states: 3 on time, then a 40ms gap (delayed packet)
    buf.push(makeState(0.1, 0.5)); advanceTime(20);
    buf.push(makeState(0.2, 0.5)); advanceTime(20);
    buf.push(makeState(0.3, 0.5)); advanceTime(20);

    // Normal sampling — should be moving forward
    const before = buf.sample(mockNow);
    expect(before).not.toBeNull();

    // Simulate 40ms gap (delayed packet)
    advanceTime(40);
    buf.push(makeState(0.5, 0.5));

    const after = buf.sample(mockNow);
    expect(after).not.toBeNull();

    // Puck x should never go backwards
    if (before && after) {
      expect(after.puck.x).toBeGreaterThanOrEqual(before.puck.x - 0.01);
    }
  });

  it('handles a packet burst (two packets within 2ms)', () => {
    const buf = new InterpolationBuffer();

    buf.push(makeState(0.1, 0.5)); advanceTime(20);
    buf.push(makeState(0.2, 0.5)); advanceTime(20);

    // Burst: two packets arrive almost simultaneously
    buf.push(makeState(0.3, 0.5)); advanceTime(2);
    buf.push(makeState(0.4, 0.5)); advanceTime(18);

    const result = buf.sample(mockNow);
    expect(result).not.toBeNull();
    // Buffer should absorb the burst — the puck should be somewhere reasonable
    expect(result!.puck.x).toBeGreaterThanOrEqual(0);
    expect(result!.puck.x).toBeLessThanOrEqual(0.5);
  });

  it('extrapolates during buffer underrun without backwards movement', () => {
    const buf = new InterpolationBuffer();

    // Feed a few states
    buf.push(makeState(0.2, 0.5)); advanceTime(20);
    buf.push(makeState(0.3, 0.5)); advanceTime(20);
    buf.push(makeState(0.4, 0.5)); advanceTime(20);

    const beforeUnderrun = buf.sample(mockNow);
    expect(beforeUnderrun).not.toBeNull();

    // Now stop sending states — simulate 80ms of no data
    advanceTime(20);
    const mid1 = buf.sample(mockNow);

    advanceTime(20);
    const mid2 = buf.sample(mockNow);

    advanceTime(20);
    const mid3 = buf.sample(mockNow);

    advanceTime(20);
    const afterUnderrun = buf.sample(mockNow);

    // All samples should still be valid (extrapolation/hold)
    expect(afterUnderrun).not.toBeNull();

    // No backwards movement — each x should be >= previous or approximately equal
    const xs = [beforeUnderrun, mid1, mid2, mid3, afterUnderrun]
      .filter(Boolean)
      .map(s => s!.puck.x);

    for (let i = 1; i < xs.length; i++) {
      // Allow small float tolerance but no significant backward movement
      expect(xs[i]).toBeGreaterThanOrEqual(xs[i - 1] - 0.01);
    }
  });

  it('adapts tick estimation to 25ms intervals', () => {
    const buf = new InterpolationBuffer();

    // Feed 10 states at 25ms intervals (40Hz)
    for (let i = 0; i < 10; i++) {
      buf.push(makeState(0.05 * i, 0.5));
      advanceTime(25);
    }

    const stats = buf.getJitterStats();
    // The estimated tick should converge toward 25ms, not stay at 20ms
    expect(stats.estimatedTickMs).toBeGreaterThan(22);
    expect(stats.estimatedTickMs).toBeLessThan(28);
  });

  it('reports correct jitter stats', () => {
    const buf = new InterpolationBuffer();

    buf.push(makeState(0.1, 0.5)); advanceTime(20);
    buf.push(makeState(0.2, 0.5)); advanceTime(20);
    buf.push(makeState(0.3, 0.5)); advanceTime(20);

    const stats = buf.getJitterStats();
    expect(stats).toHaveProperty('bufferDepth');
    expect(stats).toHaveProperty('estimatedTickMs');
    expect(stats).toHaveProperty('jitterMs');
    expect(stats).toHaveProperty('isExtrapolating');
    expect(typeof stats.bufferDepth).toBe('number');
    expect(typeof stats.estimatedTickMs).toBe('number');
    expect(typeof stats.jitterMs).toBe('number');
    expect(typeof stats.isExtrapolating).toBe('boolean');
  });

  it('clamps extrapolated puck to board bounds [0, 1]', () => {
    const buf = new InterpolationBuffer();

    // Puck moving fast to the right — will extrapolate past x=1
    buf.push(makeState(0.8, 0.5)); advanceTime(20);
    buf.push(makeState(0.95, 0.5)); advanceTime(20);
    buf.push(makeState(1.1, 0.5)); advanceTime(20); // already past boundary

    // Let buffer run dry and extrapolate
    advanceTime(60);
    const result = buf.sample(mockNow);
    if (result) {
      expect(result.puck.x).toBeLessThanOrEqual(1);
      expect(result.puck.x).toBeGreaterThanOrEqual(0);
    }
  });

  it('recovers smoothly after a long pause (tab backgrounded)', () => {
    const buf = new InterpolationBuffer();

    // Build up normal state
    for (let i = 0; i < 5; i++) {
      buf.push(makeState(0.1 * i, 0.5));
      advanceTime(20);
    }

    const beforePause = buf.sample(mockNow);
    expect(beforePause).not.toBeNull();

    // Simulate 2 seconds of being backgrounded
    advanceTime(2000);

    // Resume with new states
    buf.push(makeState(0.6, 0.5)); advanceTime(20);
    buf.push(makeState(0.65, 0.5)); advanceTime(20);

    const afterResume = buf.sample(mockNow);
    expect(afterResume).not.toBeNull();
    // Should not throw or produce NaN
    expect(afterResume!.puck.x).not.toBeNaN();
    expect(afterResume!.puck.y).not.toBeNaN();
  });
});
