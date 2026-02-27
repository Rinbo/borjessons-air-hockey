import { describe, it, expect } from 'vitest';
import { trimName, shortenAgency } from './misc-utils';

describe('trimName', () => {
  it('returns everything before the $ delimiter', () => {
    expect(trimName('Robin$session-12345')).toBe('Robin');
  });

  it('returns the full string when no $ is present', () => {
    expect(trimName('Robin')).toBe('Robin');
  });

  it('returns empty string when $ is the first character', () => {
    expect(trimName('$garbage')).toBe('');
  });

  it('only splits on the first $', () => {
    expect(trimName('A$B$C')).toBe('A');
  });
});

describe('shortenAgency', () => {
  it('shortens PLAYER_1 to P1', () => {
    expect(shortenAgency('PLAYER_1')).toBe('P1');
  });

  it('shortens PLAYER_2 to P2', () => {
    expect(shortenAgency('PLAYER_2')).toBe('P2');
  });

  it('handles arbitrary underscored strings', () => {
    expect(shortenAgency('SOME_LONG_NAME')).toBe('SLN');
  });
});
