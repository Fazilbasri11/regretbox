import { describe, expect, it } from 'vitest';
import { computeGravePlacement } from '../api/_lib/graveGrid';
import { sanitizeSentence } from '../api/_lib/supabaseAdmin';
import { formatGraveNumber, parseGraveNumberQuery } from '../src/utils/graves';
import { resolveTimeOfDay } from '../src/utils/timeTheme';

describe('Time-of-day theme resolver', () => {
  it('resolves morning, afternoon, dusk, and night from local hours', () => {
    expect(resolveTimeOfDay(new Date(2026, 10, 25, 7, 30))).toBe('morning');
    expect(resolveTimeOfDay(new Date(2026, 10, 25, 14, 50))).toBe('afternoon');
    expect(resolveTimeOfDay(new Date(2026, 10, 25, 17, 15))).toBe('dusk');
    expect(resolveTimeOfDay(new Date(2026, 10, 25, 21, 0))).toBe('night');
    expect(resolveTimeOfDay(new Date(2026, 10, 25, 2, 15))).toBe('night');
  });
});

describe('Grave number formatting and parsing', () => {
  it('formats and parses valid grave numbers', () => {
    expect(formatGraveNumber(291)).toBe('#00291');
    expect(parseGraveNumberQuery('#00291')).toBe(291);
    expect(parseGraveNumberQuery('00291')).toBe(291);
    expect(parseGraveNumberQuery('1')).toBe(1);
    expect(parseGraveNumberQuery('abc')).toBeNull();
    expect(parseGraveNumberQuery('0')).toBeNull();
  });
});

describe('Deterministic 3D grave placement', () => {
  it('generates unique non-overlapping positions outside path and chapel', () => {
    const coords = new Set<string>();
    for (let slot = 1; slot <= 80; slot += 1) {
      const p = computeGravePlacement(slot);
      expect(Math.abs(p.posX)).toBeGreaterThanOrEqual(4.4);
      const inChapel = p.posX > 11.5 && p.posZ > -26.5 && p.posZ < -6.5;
      expect(inChapel).toBe(false);
      const key = `${p.posX}:${p.posZ}`;
      expect(coords.has(key)).toBe(false);
      coords.add(key);
    }
  });
});

describe('Server sentence sanitization', () => {
  it('strips HTML brackets, normalizes whitespace, and caps at 120 chars', () => {
    expect(sanitizeSentence('  <script>alert(1)</script>  I stayed too long.  ')).toBe(
      'scriptalert(1)/script I stayed too long.',
    );
    const long = 'a'.repeat(160);
    expect(sanitizeSentence(long)).toHaveLength(120);
  });
});
