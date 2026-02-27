import { describe, it, expect } from 'vitest';
import { getAgencyExtention } from './utils';
import { ASPECT_RATIO, HANDLE_RADIUS, PUCK_RADIUS, GOAL_WIDTH } from './constants';
import type { Player } from '../types';

// ---- getAgencyExtention ----

const players: Player[] = [
  { username: 'Alice', agency: 'PLAYER_1', ready: true, score: 0, gamesWon: 0 },
  { username: 'Bob', agency: 'PLAYER_2', ready: false, score: 3, gamesWon: 1 }
];

describe('getAgencyExtention', () => {
  it('returns "player-1" for PLAYER_1', () => {
    expect(getAgencyExtention(players, 'Alice')).toBe('player-1');
  });

  it('returns "player-2" for PLAYER_2', () => {
    expect(getAgencyExtention(players, 'Bob')).toBe('player-2');
  });

  it('throws when username is not found', () => {
    expect(() => getAgencyExtention(players, 'Unknown')).toThrow();
  });

  it('throws when player list is empty', () => {
    expect(() => getAgencyExtention([], 'Alice')).toThrow();
  });
});

// ---- Constants sanity checks ----
// These catch accidental edits to the derived constant values.
// If ASPECT_RATIO changes, the radii MUST update proportionally.

describe('Game constants consistency', () => {
  it('HANDLE_RADIUS.y is derived from HANDLE_RADIUS.x * ASPECT_RATIO', () => {
    expect(HANDLE_RADIUS.y).toBeCloseTo(HANDLE_RADIUS.x * ASPECT_RATIO, 6);
  });

  it('PUCK_RADIUS.y is derived from PUCK_RADIUS.x * ASPECT_RATIO', () => {
    expect(PUCK_RADIUS.y).toBeCloseTo(PUCK_RADIUS.x * ASPECT_RATIO, 6);
  });

  it('GOAL_WIDTH is a reasonable fraction of the board (5-50%)', () => {
    expect(GOAL_WIDTH).toBeGreaterThan(0.05);
    expect(GOAL_WIDTH).toBeLessThan(0.5);
  });

  it('ASPECT_RATIO is positive and less than 1 (portrait board)', () => {
    expect(ASPECT_RATIO).toBeGreaterThan(0);
    expect(ASPECT_RATIO).toBeLessThan(1);
  });
});
