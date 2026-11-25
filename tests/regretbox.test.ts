import { describe, expect, it } from 'vitest';
import { computeGravePlacement } from '../api/_lib/graveGrid';
import { sanitizeSentence } from '../api/_lib/supabaseAdmin';
import { computeLanternPositions } from '../src/three/Lanterns';
import { getPathCenterX, getTerrainHeight, PATH_HALF_WIDTH } from '../src/three/terrain';
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

describe('Seed data integrity & neutral styling', () => {
  it('provides 40 neutral graves with rolling hill elevation and spacious separation', () => {
    expect(DEMO_GRAVES).toHaveLength(40);
    const hero = DEMO_GRAVES.find((g) => g.grave_number === 291);
    const left = DEMO_GRAVES.find((g) => g.grave_number === 290);
    const right = DEMO_GRAVES.find((g) => g.grave_number === 289);
    expect(hero?.inscription).toBe('I should not have bought that.');
    expect(left?.inscription).toBe('Trusted them far too easily...');
    expect(right?.inscription).toBe('Maybe I could have been more patient.');

    for (const g of DEMO_GRAVES) {
      expect(['arched', 'slim', 'pillar', 'scroll']).toContain(g.grave_style);
      expect(g.pos_y).toBeGreaterThanOrEqual(0);
    }
    expect(DEMO_GRAVES[0].pos_y).toBeGreaterThan(0.3);
  });
});

describe('Deterministic 3D grave placement & terrain', () => {
  it('allocates spacious non-overlapping slots off the path', () => {
    const placements = Array.from({ length: 80 }, (_, idx) => computeGravePlacement(idx + 1));
    for (let i = 0; i < placements.length; i += 1) {
      const p = placements[i];
      const pathX = getPathCenterX(p.posZ);
      expect(Math.abs(p.posX - pathX)).toBeGreaterThanOrEqual(1.8);
      for (let j = i + 1; j < placements.length; j += 1) {
        const q = placements[j];
        const dist = Math.hypot(p.posX - q.posX, p.posZ - q.posZ);
        expect(dist).toBeGreaterThanOrEqual(3.2);
      }
    }
    expect(getTerrainHeight(-8, -20)).toBeGreaterThan(getTerrainHeight(0, 4));
  });
});

describe('Off-road lantern placement', () => {
  it('places every lantern outside the cobblestone road surface', () => {
    const hero = DEMO_GRAVES.find((g) => g.grave_number === 291) || null;
    const left = DEMO_GRAVES.find((g) => g.grave_number === 290) || null;
    const right = DEMO_GRAVES.find((g) => g.grave_number === 289) || null;
    const lanterns = computeLanternPositions(hero, left, right);

    for (const l of lanterns) {
      const pathX = getPathCenterX(l.z);
      expect(Math.abs(l.x - pathX)).toBeGreaterThanOrEqual(PATH_HALF_WIDTH + 0.5);
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
