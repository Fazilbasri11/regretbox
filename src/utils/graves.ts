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
    subtitle: 'Quiet garden beside the gothic chapel.',
  },
};

export const GRAVE_STYLE_LABELS: Record<GraveStyle, string> = {
  arched: 'Arched Classic',
  slim: 'Slim Arch',
  cross: 'Cross Monument',
  scroll: 'Scroll Pediment',
};

const RAW_SEED: Array<[number, number, CemeteryZone, string, number, number, number, GraveStyle, string]> = [
  [252, 1, 'old_cemetery', 'Left a good friend standing alone at the station.', -8.2, -30.5, 0.08, 'slim', '2026-08-12T10:00:00Z'],
  [253, 2, 'old_cemetery', 'Terlalu takut mencoba sampai waktu habis.', -4.3, -30.2, 0.11, 'arched', '2026-08-15T11:20:00Z'],
  [254, 3, 'old_cemetery', 'Burned a bridge just to prove a point.', 4.1, -30.4, -0.09, 'cross', '2026-08-18T14:00:00Z'],
  [255, 4, 'old_cemetery', 'Menunda minta maaf hingga terlambat.', 7.9, -30.1, -0.12, 'scroll', '2026-08-21T09:10:00Z'],
  [256, 5, 'old_cemetery', 'Ignored the quiet warning in my own chest.', -8.1, -27.4, 0.06, 'arched', '2026-08-24T17:45:00Z'],
  [257, 6, 'old_cemetery', 'Berpura-pura baik-baik saja terlalu lama.', -4.2, -27.1, 0.09, 'slim', '2026-08-27T20:30:00Z'],
  [258, 7, 'old_cemetery', 'Sold patience for instant relief.', 4.2, -27.3, -0.07, 'arched', '2026-08-30T08:15:00Z'],
  [259, 8, 'old_cemetery', 'Tidak datang di hari penting keluargaku.', 7.8, -27.0, -0.10, 'scroll', '2026-09-02T12:00:00Z'],
  [260, 9, 'old_cemetery', 'Chased applause from people who never knew me.', -8.0, -24.3, 0.05, 'cross', '2026-09-05T15:20:00Z'],
  [261, 10, 'old_cemetery', 'Membandingkan hidupku dengan bayangan orang lain.', -4.1, -24.0, 0.12, 'arched', '2026-09-08T19:00:00Z'],
  [262, 11, 'memorial_garden', 'Spoke sharply when silence was kinder.', 4.1, -24.2, -0.06, 'slim', '2026-09-11T10:30:00Z'],
  [263, 12, 'memorial_garden', 'Menyia-nyiakan kepercayaan yang susah dibangun.', 8.0, -23.9, -0.11, 'arched', '2026-09-14T16:40:00Z'],
  [264, 13, 'old_cemetery', 'Kept promises to strangers and broke my own.', -8.2, -21.2, 0.09, 'scroll', '2026-09-17T07:50:00Z'],
  [265, 14, 'old_cemetery', 'Lupa berterima kasih saat masih sempat.', -4.2, -20.9, 0.07, 'arched', '2026-09-20T13:15:00Z'],
  [266, 15, 'memorial_garden', 'Stayed two years in a room I outgrew.', 4.0, -21.1, -0.08, 'cross', '2026-09-23T18:25:00Z'],
  [267, 16, 'memorial_garden', 'Membiarkan gengsi menang atas rindu.', 7.8, -20.8, -0.12, 'slim', '2026-09-26T21:10:00Z'],
  [268, 17, 'old_cemetery', 'Thought there would always be another weekend.', -8.0, -18.1, 0.04, 'arched', '2026-09-29T09:40:00Z'],
  [269, 18, 'old_cemetery', 'Menjawab dengan emosi saat lelah.', -4.1, -17.8, 0.10, 'scroll', '2026-10-02T14:55:00Z'],
  [270, 19, 'memorial_garden', 'Let fear write my excuses for a decade.', 4.1, -18.0, -0.05, 'arched', '2026-10-05T11:20:00Z'],
  [271, 20, 'memorial_garden', 'Tidak jujur sejak awal agar terlihat kuat.', 7.9, -17.7, -0.09, 'slim', '2026-10-08T17:05:00Z'],
  [272, 21, 'old_cemetery', 'Closed the door before hearing the full story.', -7.9, -15.0, 0.07, 'arched', '2026-10-11T08:30:00Z'],
  [273, 22, 'old_cemetery', 'Menghabiskan malam untuk khawatir hal kecil.', -4.0, -14.7, 0.11, 'cross', '2026-10-14T22:00:00Z'],
  [274, 23, 'new_cemetery', 'Walked away without saying goodbye properly.', 4.1, -14.9, -0.07, 'arched', '2026-10-17T15:15:00Z'],
  [275, 24, 'new_cemetery', 'Terlalu sering bilang nanti.', 7.8, -14.6, -0.10, 'scroll', '2026-10-20T10:45:00Z'],
  [276, 25, 'new_cemetery', 'Spent savings trying to impress nobody.', -7.9, -11.9, 0.08, 'slim', '2026-10-23T19:30:00Z'],
  [277, 26, 'new_cemetery', 'Percaya janji manis tanpa melihat kenyataan.', -3.9, -11.6, 0.12, 'arched', '2026-10-26T12:10:00Z'],
  [278, 27, 'new_cemetery', 'Forgot to celebrate small victories.', 4.0, -11.8, -0.06, 'arched', '2026-10-29T16:00:00Z'],
  [279, 28, 'new_cemetery', 'Menyakiti orang yang paling tulus.', 7.7, -11.5, -0.09, 'cross', '2026-11-01T20:20:00Z'],
  [280, 29, 'new_cemetery', 'Kept checking a door that had already locked.', -7.6, -8.8, 0.06, 'arched', '2026-11-03T08:50:00Z'],
  [281, 30, 'new_cemetery', 'Membuang waktu di tempat yang salah.', -3.8, -8.5, 0.10, 'slim', '2026-11-05T14:15:00Z'],
  [282, 31, 'new_cemetery', 'Argued to win instead of listen.', 3.9, -8.7, -0.08, 'scroll', '2026-11-07T11:30:00Z'],
  [283, 32, 'new_cemetery', 'Menyerah satu langkah sebelum selesai.', 7.5, -8.4, -0.11, 'arched', '2026-11-09T18:40:00Z'],
  [284, 33, 'new_cemetery', 'Hidup untuk menyenangkan semua orang.', -7.4, -5.7, 0.07, 'cross', '2026-11-11T09:20:00Z'],
  [285, 34, 'new_cemetery', 'Ignored the red flags in soft light.', -3.7, -5.4, 0.12, 'arched', '2026-11-13T15:00:00Z'],
  [286, 35, 'new_cemetery', 'Missed the last train home.', 3.8, -5.6, -0.09, 'slim', '2026-11-15T21:10:00Z'],
  [287, 36, 'new_cemetery', 'Mengambil keputusan besar saat sedang marah.', 7.3, -5.3, -0.08, 'arched', '2026-11-16T13:45:00Z'],
  [288, 37, 'new_cemetery', 'Sold too early out of panic.', -6.9, -2.6, 0.09, 'scroll', '2026-11-17T10:15:00Z'],
  [289, 38, 'new_cemetery', 'Mungkin aku bisa lebih sabar.', 3.05, -1.6, -0.14, 'arched', '2026-11-18T12:00:00Z'],
  [290, 39, 'new_cemetery', 'Terlalu percaya sama dia...', -3.45, -1.2, 0.16, 'arched', '2026-11-20T14:30:00Z'],
  [291, 40, 'new_cemetery', 'Seharusnya aku tidak membeli itu.', -0.62, 1.35, 0.06, 'arched', '2026-11-25T09:00:00Z'],
];

export const DEMO_GRAVES: Grave[] = RAW_SEED.map(
  ([grave_number, slot_index, zone, inscription, pos_x, pos_z, rotation_y, grave_style, created_at]) => ({
    id: `seed-${grave_number}`,
    grave_number,
    slot_index,
    zone,
    inscription,
    pos_x,
    pos_y: 0,
    pos_z,
    rotation_y,
    grave_style,
    created_at,
    is_demo: true,
  }),
);
