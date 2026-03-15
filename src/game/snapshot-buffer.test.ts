import { describe, it, expect } from 'vitest';
import SnapshotBuffer from './snapshot-buffer';

describe('SnapshotBuffer', () => {
  // ---- Ring buffer basics ----

  describe('ring buffer', () => {
    it('returns null when empty', () => {
      const buf = new SnapshotBuffer();
      expect(buf.sample(1000)).toBeNull();
    });

    it('returns single snapshot position', () => {
      const buf = new SnapshotBuffer();
      buf.push(0.5, 0.3, 100);
      const pos = buf.sample(200); // renderTime = 200 - 50 = 150, past the snapshot
      expect(pos).not.toBeNull();
      expect(pos!.x).toBeCloseTo(0.5);
      expect(pos!.y).toBeCloseTo(0.3);
    });

    it('clear resets to empty', () => {
      const buf = new SnapshotBuffer();
      buf.push(0.5, 0.3, 100);
      buf.clear();
      expect(buf.sample(200)).toBeNull();
    });

    it('wraps around when exceeding capacity', () => {
      const buf = new SnapshotBuffer();
      // Push 12 snapshots (capacity is 10) — should evict the oldest 2
      for (let i = 0; i < 12; i++) {
        buf.push(i * 0.1, i * 0.1, 100 + i * 20);
      }
      // The oldest snapshot should now be i=2 (time=140)
      // Request renderTime well after all snapshots → should hold at latest
      const pos = buf.sample(500);
      expect(pos).not.toBeNull();
      // Latest snapshot: i=11 → x=1.1, y=1.1
      expect(pos!.x).toBeCloseTo(1.1);
      expect(pos!.y).toBeCloseTo(1.1);
    });
  });

  // ---- Edge cases ----

  describe('edge cases', () => {
    it('holds at earliest when renderTime is before all snapshots', () => {
      const buf = new SnapshotBuffer();
      buf.push(0.2, 0.3, 1000);
      buf.push(0.4, 0.5, 1020);
      // renderTime = 50 - 50 = 0, well before snapshot at t=1000
      const pos = buf.sample(50);
      expect(pos!.x).toBeCloseTo(0.2);
      expect(pos!.y).toBeCloseTo(0.3);
    });

    it('holds at latest when renderTime is after all snapshots', () => {
      const buf = new SnapshotBuffer();
      buf.push(0.2, 0.3, 100);
      buf.push(0.8, 0.9, 120);
      // renderTime = 5000 - 50 = 4950, well after t=120
      const pos = buf.sample(5000);
      expect(pos!.x).toBeCloseTo(0.8);
      expect(pos!.y).toBeCloseTo(0.9);
    });

    it('returns exact position when renderTime lands on a snapshot', () => {
      const buf = new SnapshotBuffer();
      buf.push(0.2, 0.3, 100);
      buf.push(0.8, 0.9, 120);
      // renderTime = 100 + 50 = 150, but the BUFFER_DELAY is 50, so now = 100 + 50 → renderTime = 100
      const pos = buf.sample(150); // renderTime = 100, exactly on first snapshot
      expect(pos!.x).toBeCloseTo(0.2);
      expect(pos!.y).toBeCloseTo(0.3);
    });
  });

  // ---- Linear interpolation (2 snapshots, no tangent data) ----

  describe('linear interpolation fallback', () => {
    it('interpolates linearly at midpoint with only 2 snapshots', () => {
      const buf = new SnapshotBuffer();
      buf.push(0.0, 0.0, 100);
      buf.push(1.0, 1.0, 120);
      // renderTime at midpoint: (100 + 120) / 2 = 110 → now = 110 + 50 = 160
      const pos = buf.sample(160);
      expect(pos!.x).toBeCloseTo(0.5, 2);
      expect(pos!.y).toBeCloseTo(0.5, 2);
    });

    it('interpolates linearly at quarter point with only 2 snapshots', () => {
      const buf = new SnapshotBuffer();
      buf.push(0.0, 0.0, 100);
      buf.push(1.0, 0.0, 120);
      // renderTime at 25%: 100 + 5 = 105 → now = 105 + 50 = 155
      const pos = buf.sample(155);
      expect(pos!.x).toBeCloseTo(0.25, 2);
      expect(pos!.y).toBeCloseTo(0.0, 2);
    });
  });

  // ---- Hermite cubic interpolation (3+ snapshots) ----

  describe('linear interpolation with 3+ snapshots', () => {
    it('interpolates linearly at midpoint with multiple snapshots', () => {
      const buf = new SnapshotBuffer();
      // Constant velocity: 0.1 units per 20ms
      buf.push(0.0, 0.0, 100);
      buf.push(0.1, 0.0, 120);
      buf.push(0.2, 0.0, 140);
      buf.push(0.3, 0.0, 160);
      // Midpoint of segment [1]-[2]: renderTime = (120 + 140) / 2 = 130 → now = 180
      const pos = buf.sample(180);
      expect(pos!.x).toBeCloseTo(0.15, 2);
      expect(pos!.y).toBeCloseTo(0.0, 2);
    });

    it('interpolates linearly for non-constant velocity', () => {
      const buf = new SnapshotBuffer();
      // Accelerating motion: x positions at 0, 0.1, 0.3, 0.6
      buf.push(0.0, 0.0, 100);
      buf.push(0.1, 0.0, 120);
      buf.push(0.3, 0.0, 140);
      buf.push(0.6, 0.0, 160);
      // Midpoint of segment [1]-[2]: renderTime = 130 → now = 180
      const pos = buf.sample(180);
      // Linear: midpoint between 0.1 and 0.3 = 0.2
      expect(pos!.x).toBeCloseTo(0.2, 2);
    });

    it('reuses the same position object (zero alloc)', () => {
      const buf = new SnapshotBuffer();
      buf.push(0.0, 0.0, 100);
      buf.push(0.5, 0.5, 120);
      buf.push(1.0, 1.0, 140);
      const pos1 = buf.sample(180);
      const pos2 = buf.sample(185);
      // Both calls should return the exact same object reference
      expect(pos1).toBe(pos2);
    });
  });
});
