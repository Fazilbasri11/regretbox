import type { CemeteryZone, Grave, GraveStyle } from '../types/grave';

export const MAX_INSCRIPTION_LENGTH = 120;
export const MIN_INSCRIPTION_LENGTH = 3;

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
    return new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
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
    subtitle: 'Beyond the wrought-iron RegretBox gate.',
  },
  new_cemetery: {
    title: 'New Cemetery',
    subtitle: 'Recently laid stones along the cobblestone lantern path.',
  },
  old_cemetery: {
    title: 'Old Cemetery',
    subtitle: 'Quiet weathered stones deeper beyond the gate.',
  },
  memorial_garden: {
    title: 'Memorial Garden',
    subtitle: 'A still corner beneath pine trees and soft blossoms.',
  },
};

export const GRAVE_STYLE_LABELS: Record<GraveStyle, string> = {
  classic: 'Classic Headstone',
  obelisk: 'Tall Obelisk',
  slab: 'Ledger Slab',
  cross_arch: 'Gothic Arch',
  mossy_stone: 'Mossy Monolith',
};

/**
 * Demonstration seed graves (is_demo = true) displayed when Supabase is not yet connected.
 * Matches the layout of the 3D cemetery so visitors can explore immediately.
 */
export const DEMO_GRAVES: Grave[] = [
  {
    id: 'demo-291',
    grave_number: 291,
    slot_index: 3,
    zone: 'new_cemetery',
    inscription: 'I should not have bought that.',
    pos_x: -4.8,
    pos_y: 0,
    pos_z: 1.5,
    rotation_y: 0.06,
    grave_style: 'classic',
    created_at: '2026-11-25T10:00:00.000Z',
    is_demo: true,
  },
  {
    id: 'demo-290',
    grave_number: 290,
    slot_index: 2,
    zone: 'new_cemetery',
    inscription: 'Trusted them far too easily.',
    pos_x: -7.2,
    pos_y: 0,
    pos_z: -4.5,
    rotation_y: 0.08,
    grave_style: 'mossy_stone',
    created_at: '2026-11-20T14:20:00.000Z',
    is_demo: true,
  },
  {
    id: 'demo-289',
    grave_number: 289,
    slot_index: 1,
    zone: 'new_cemetery',
    inscription: 'Maybe I could have been more patient.',
    pos_x: 6.2,
    pos_y: 0,
    pos_z: -4.5,
    rotation_y: -0.07,
    grave_style: 'classic',
    created_at: '2026-11-18T09:15:00.000Z',
    is_demo: true,
  },
  {
    id: 'demo-292',
    grave_number: 292,
    slot_index: 4,
    zone: 'new_cemetery',
    inscription: 'I should have walked away.',
    pos_x: -10.2,
    pos_y: 0,
    pos_z: -10.5,
    rotation_y: 0.05,
    grave_style: 'obelisk',
    created_at: '2026-11-11T19:00:00.000Z',
    is_demo: true,
  },
  {
    id: 'demo-293',
    grave_number: 293,
    slot_index: 5,
    zone: 'new_cemetery',
    inscription: 'Held back an apology out of stubborn pride.',
    pos_x: 9.6,
    pos_y: 0,
    pos_z: -10.5,
    rotation_y: -0.05,
    grave_style: 'cross_arch',
    created_at: '2026-11-06T16:40:00.000Z',
    is_demo: true,
  },
  {
    id: 'demo-294',
    grave_number: 294,
    slot_index: 6,
    zone: 'old_cemetery',
    inscription: 'Thought there would always be another weekend.',
    pos_x: -6.8,
    pos_y: 0,
    pos_z: -37.0,
    rotation_y: 0.04,
    grave_style: 'mossy_stone',
    created_at: '2026-10-11T21:10:00.000Z',
    is_demo: true,
  },
  {
    id: 'demo-295',
    grave_number: 295,
    slot_index: 7,
    zone: 'old_cemetery',
    inscription: 'Chased applause instead of quiet craft.',
    pos_x: 6.8,
    pos_y: 0,
    pos_z: -37.0,
    rotation_y: -0.04,
    grave_style: 'slab',
    created_at: '2026-09-24T13:05:00.000Z',
    is_demo: true,
  },
  {
    id: 'demo-296',
    grave_number: 296,
    slot_index: 8,
    zone: 'memorial_garden',
    inscription: 'Stayed two years in a place I had already outgrown.',
    pos_x: -12.8,
    pos_y: 0,
    pos_z: -44.0,
    rotation_y: 0.03,
    grave_style: 'classic',
    created_at: '2026-08-27T11:30:00.000Z',
    is_demo: true,
  },
  {
    id: 'demo-297',
    grave_number: 297,
    slot_index: 9,
    zone: 'memorial_garden',
    inscription: 'Argued to win instead of listening.',
    pos_x: 12.8,
    pos_y: 0,
    pos_z: -44.0,
    rotation_y: -0.03,
    grave_style: 'obelisk',
    created_at: '2026-07-28T08:45:00.000Z',
    is_demo: true,
  },
];
