import { describe, expect, it } from 'vitest';
import { computeGravePlacement, getPathCenterX } from '../api/_lib/graveGrid';
import { sanitizeSentence } from '../api/_lib/supabaseAdmin';
import { DEMO_GRAVES, formatBurialDate, formatGraveNumber, parseGraveNumberQuery } from '../src/utils/graves';

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

describe('Burial date formatting', () => {
  it('formats date in id-ID D MMM YYYY style', () => {
    expect(formatBurialDate('2026-11-25T09:00:00Z')).toContain('2026');
    expect(formatBurialDate('2026-11-25T09:00:00Z')).toContain('Nov');
  });
});

describe('Seed data integrity', () => {
  it('provides 40 graves from #00252 to #00291 matching reference triad', () => {
    expect(DEMO_GRAVES).toHaveLength(40);
    const hero = DEMO_GRAVES.find((g) => g.grave_number === 291);
    const left = DEMO_GRAVES.find((g) => g.grave_number === 290);
    const right = DEMO_GRAVES.find((g) => g.grave_number === 289);
    expect(hero?.inscription).toBe('Seharusnya aku tidak membeli itu.');
    expect(left?.inscription).toBe('Terlalu percaya sama dia...');
    expect(right?.inscription).toBe('Mungkin aku bisa lebih sabar.');
  });
});

describe('Deterministic 3D grave placement', () => {
  it('allocates sequential non-overlapping slots from gate outward', () => {
    const coords = new Set<string>();
    for (let slot = 1; slot <= 80; slot += 1) {
      const p = computeGravePlacement(slot);
      const pathX = getPathCenterX(p.posZ);
      expect(Math.abs(p.posX - pathX)).toBeGreaterThanOrEqual(1.4);
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
