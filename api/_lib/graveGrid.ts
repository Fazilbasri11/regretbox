export type CemeteryZone = 'entrance' | 'new_cemetery' | 'old_cemetery' | 'memorial_garden';
export type GraveStyle = 'classic' | 'obelisk' | 'slab' | 'cross_arch' | 'mossy_stone';

export const GRAVE_STYLES: GraveStyle[] = [
  'classic',
  'obelisk',
  'slab',
  'cross_arch',
  'mossy_stone',
];

export interface GravePlacement {
  slotIndex: number;
  zone: CemeteryZone;
  posX: number;
  posY: number;
  posZ: number;
  rotationY: number;
  graveStyle: GraveStyle;
}

/**
 * Deterministic, collision-free slot placement matching the 3D cemetery geometry:
 * - Central cobblestone path occupies |x| < 4.4
 * - Grand Iron Gate spans z in [-29, -24]
 * - Gothic Stone Chapel occupies x in [12, 32], z in [-25, -8]
 * - Foreground (z in [-22, 3]): New Cemetery
 * - Beyond the Gate (z <= -34): Old Cemetery & Memorial Garden
 */
export function computeGravePlacement(slotIndex: number): GravePlacement {
  const safeSlot = Math.max(1, Math.floor(slotIndex));
  const style = GRAVE_STYLES[(safeSlot - 1) % GRAVE_STYLES.length];

  // Candidate grid: 4 columns on left, 4 columns on right per row
  // Skip chapel footprint and gate footprint automatically
  let validCursor = 0;
  let row = 0;

  while (row < 500) {
    const z = row < 4 ? 1.5 - row * 5.8 : -36.5 - (row - 4) * 5.8;
    const cols = [-19.5, -14.5, -9.8, -5.6, 5.6, 9.8, 14.5, 19.5];

    for (const x of cols) {
      // Skip Gothic Chapel footprint on the right midground
      const inChapel = x > 11.5 && z > -26.5 && z < -6.5;
      if (inChapel) continue;

      validCursor += 1;
      if (validCursor === safeSlot) {
        const zone: CemeteryZone =
          row < 4 ? 'new_cemetery' : Math.abs(x) >= 14 ? 'memorial_garden' : 'old_cemetery';
        const yawTowardPath = x < 0 ? 0.08 : -0.08;
        const subtleJitter = ((safeSlot % 5) - 2) * 0.025;

        return {
          slotIndex: safeSlot,
          zone,
          posX: Number((x + ((safeSlot % 3) - 1) * 0.25).toFixed(2)),
          posY: 0,
          posZ: Number((z + ((safeSlot % 4) - 1.5) * 0.2).toFixed(2)),
          rotationY: Number((yawTowardPath + subtleJitter).toFixed(3)),
          graveStyle: style,
        };
      }
    }
    row += 1;
  }

  return {
    slotIndex: safeSlot,
    zone: 'old_cemetery',
    posX: -8,
    posY: 0,
    posZ: -80,
    rotationY: 0.04,
    graveStyle: style,
  };
}
