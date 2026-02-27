import { describe, it, expect } from 'vitest';

/**
 * We test the router's pattern-matching logic directly.
 * This is the most fragile part — if someone tweaks the split/match logic,
 * all navigation silently breaks. The functions are private in router.ts,
 * so we duplicate the pure logic here to test it in isolation.
 *
 * If you ever refactor router.ts, export extractParams or update these tests.
 */

// --- Extracted pure logic from router.ts (lines 82-100) ---
function extractParams(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i];
    if (pp.startsWith(':')) {
      params[pp.slice(1)] = pathParts[i];
    } else if (pp !== pathParts[i]) {
      return null;
    }
  }

  return params;
}

describe('Router: extractParams', () => {
  it('matches root path "/" against root pattern "/"', () => {
    expect(extractParams('/', '/')).toEqual({});
  });

  it('matches a simple static path', () => {
    expect(extractParams('/lobby', '/lobby')).toEqual({});
  });

  it('extracts a single param from /games/:id', () => {
    const result = extractParams('/games/:id', '/games/abc-123');
    expect(result).toEqual({ id: 'abc-123' });
  });

  it('extracts multiple params', () => {
    const result = extractParams('/games/:gameId/players/:playerId', '/games/g1/players/p2');
    expect(result).toEqual({ gameId: 'g1', playerId: 'p2' });
  });

  it('returns null when segment counts differ', () => {
    expect(extractParams('/games/:id', '/games')).toBeNull();
    expect(extractParams('/games', '/games/extra')).toBeNull();
  });

  it('returns null when a static segment does not match', () => {
    expect(extractParams('/games/:id', '/lobbies/abc')).toBeNull();
  });

  it('handles UUID-style params correctly', () => {
    const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const result = extractParams('/games/:id', `/games/${uuid}`);
    expect(result).toEqual({ id: uuid });
  });
});
