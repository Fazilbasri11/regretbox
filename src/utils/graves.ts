import { computeGravePlacement } from '../../api/_lib/graveGrid';
import { APP_CONFIG } from '../app/config';
import type { CemeteryZone, Grave, GraveStyle } from '../types/grave';

export const MAX_INSCRIPTION_LENGTH = APP_CONFIG.maxInscriptionLength;
export const MIN_INSCRIPTION_LENGTH = APP_CONFIG.minInscriptionLength;

export function formatGraveNumber(graveNumber: number): string {
  return `#${String(graveNumber).padStart(5, '0')}`;
}

export function parseGraveNumberQuery(raw: string): number | null {
  const cleaned = raw.replace(/^#/, '').trim();
  if (!/^\d{1,7}$/.test(cleaned)) return null;
  const num = Number(cleaned);
  if (!Number.isInteger(num) || num < 1 || num > 9999999) return null;
  return num;
}

export function formatBurialDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(APP_CONFIG.graveDateLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export const ZONE_LABELS: Record<CemeteryZone, { title: string; subtitle: string }> = {
  entrance: {
    title: 'Entrance',
    subtitle: 'Wrought-iron gate and lantern pillars.',
  },
  old_cemetery: {
    title: 'Old Cemetery',
    subtitle: 'Older weathered stones closer to the gate.',
  },
  new_cemetery: {
    title: 'New Cemetery',
    subtitle: 'Most recent stones along the lantern path.',
  },
  memorial_garden: {
    title: 'Memorial Garden',
    subtitle: 'Quiet garden beside the stone pavilion.',
  },
};

export const GRAVE_STYLE_LABELS: Record<GraveStyle, string> = {
  arched: 'Arched Classic',
  slim: 'Slim Arch',
  pillar: 'Stepped Pillar',
  scroll: 'Scroll Pediment',
};

const SEED_ENTRIES: Array<[number, string, string]> = [
  [252, 'Left a good friend standing alone at the station.', '2026-08-12T10:00:00Z'],
  [253, 'Too afraid to try until the moment slipped away.', '2026-08-15T11:20:00Z'],
  [254, 'Burned a bridge just to prove a point.', '2026-08-18T14:00:00Z'],
  [255, 'Waited too long to say I was sorry.', '2026-08-21T09:10:00Z'],
  [256, 'Ignored the quiet warning in my own chest.', '2026-08-24T17:45:00Z'],
  [257, 'Pretended everything was fine for far too long.', '2026-08-27T20:30:00Z'],
  [258, 'Traded patience for instant relief.', '2026-08-30T08:15:00Z'],
  [259, 'Missed the one family evening that truly mattered.', '2026-09-02T12:00:00Z'],
  [260, 'Chased applause from people who never knew me.', '2026-09-05T15:20:00Z'],
  [261, 'Measured my own worth against borrowed shadows.', '2026-09-08T19:00:00Z'],
  [262, 'Spoke sharply when silence would have been kinder.', '2026-09-11T10:30:00Z'],
  [263, 'Broke a trust that took years to build.', '2026-09-14T16:40:00Z'],
  [264, 'Kept promises to strangers and broke my own.', '2026-09-17T07:50:00Z'],
  [265, 'Forgot to say thank you while there was still time.', '2026-09-20T13:15:00Z'],
  [266, 'Stayed two years in a room I had outgrown.', '2026-09-23T18:25:00Z'],
  [267, 'Let stubborn pride stand taller than love.', '2026-09-26T21:10:00Z'],
  [268, 'Thought there would always be another weekend.', '2026-09-29T09:40:00Z'],
  [269, 'Answered in anger when I was simply exhausted.', '2026-10-02T14:55:00Z'],
  [270, 'Let fear write my excuses for a decade.', '2026-10-05T11:20:00Z'],
  [271, 'Hid the truth early just to look strong.', '2026-10-08T17:05:00Z'],
  [272, 'Closed the door before hearing the full story.', '2026-10-11T08:30:00Z'],
  [273, 'Spent sleepless nights worrying over small things.', '2026-10-14T22:00:00Z'],
  [274, 'Walked away without saying goodbye properly.', '2026-10-17T15:15:00Z'],
  [275, 'Kept telling myself there is always tomorrow.', '2026-10-20T10:45:00Z'],
  [276, 'Spent my savings trying to impress nobody.', '2026-10-23T19:30:00Z'],
  [277, 'Trusted sweet promises without watching the actions.', '2026-10-26T12:10:00Z'],
  [278, 'Forgot to celebrate the small victories.', '2026-10-29T16:00:00Z'],
  [279, 'Hurt the person who cared most sincerely.', '2026-11-01T20:20:00Z'],
  [280, 'Kept checking a door that was already locked.', '2026-11-03T08:50:00Z'],
  [281, 'Wasted precious seasons in the wrong place.', '2026-11-05T14:15:00Z'],
  [282, 'Argued to win instead of listening.', '2026-11-07T11:30:00Z'],
  [283, 'Gave up one step before the finish line.', '2026-11-09T18:40:00Z'],
  [284, 'Lived to please everyone except myself.', '2026-11-11T09:20:00Z'],
  [285, 'Ignored the red flags in soft light.', '2026-11-13T15:00:00Z'],
  [286, 'Missed the last train home.', '2026-11-15T21:10:00Z'],
  [287, 'Made a permanent choice in a passing storm.', '2026-11-16T13:45:00Z'],
  [288, 'Sold too early out of panic.', '2026-11-17T10:15:00Z'],
  [289, 'Maybe I could have been more patient.', '2026-11-18T12:00:00Z'],
  [290, 'Trusted them far too easily...', '2026-11-20T14:30:00Z'],
  [291, 'I should not have bought that.', '2026-11-25T09:00:00Z'],
];

export const DEMO_GRAVES: Grave[] = SEED_ENTRIES.map(([num, inscription, created_at], idx) => {
  const placement = computeGravePlacement(idx + 1);
  return {
    id: `seed-${num}`,
    grave_number: num,
    slot_index: placement.slotIndex,
    zone: placement.zone,
    inscription,
    pos_x: placement.posX,
    pos_y: placement.posY,
    pos_z: placement.posZ,
    rotation_y: placement.rotationY,
    grave_style: placement.graveStyle,
    created_at,
    is_demo: true,
  };
});
