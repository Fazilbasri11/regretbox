export type CemeteryZone = 'entrance' | 'new_cemetery' | 'old_cemetery' | 'memorial_garden';
export type GraveStyle = 'arched' | 'slim' | 'pillar' | 'scroll';

export interface GravePlacement {
  slotIndex: number;
  zone: CemeteryZone;
  posX: number;
  posY: number;
  posZ: number;
  rotationY: number;
  graveStyle: GraveStyle;
}

export function pickWeightedGraveStyle(seed: number): GraveStyle {
  const bucket = Math.abs(seed * 37 + 13) % 100;
  if (bucket < 45) return 'arched';
  if (bucket < 70) return 'slim';
  if (bucket < 85) return 'pillar';
  return 'scroll';
}

export function getPathCenterX(z: number): number {
  const t = Math.max(0, Math.min(1, (z + 46) / 54));
  return Number((Math.sin(t * Math.PI * 0.62) * 1.45).toFixed(3));
}

function terrainHeight(x: number, z: number): number {
  const pathX = getPathCenterX(z);
  const distFromPath = Math.abs(x - pathX);
  const gateSlope = Math.max(0, Math.min(1, (6 - z) / 52)) * 0.65;
  const shoulderMask = Math.max(0, Math.min(1, (distFromPath - 1.65) / 3.2));
  const hillA = Math.sin(x * 0.22 + 0.5) * Math.cos(z * 0.14 - 0.3) * 0.55;
  const hillB = Math.sin(x * 0.11 - z * 0.09) * 0.45 + 0.35;
  const outerRidge = Math.max(0, (distFromPath - 7) * 0.08);
  return Number((gateSlope + shoulderMask * Math.max(0, hillA + hillB + outerRidge)).toFixed(3));
}

/**
 * Spacious, non-overlapping slot allocation from gate (z = -43) outward (+Z).
 * Row spacing ~4.6m, column spacing ~5.2m so stones never look crowded.
 */
export function computeGravePlacement(slotIndex: number): GravePlacement {
  const s = Math.max(1, Math.floor(slotIndex));
  const style = s === 38 || s === 39 || s === 40 ? 'arched' : pickWeightedGraveStyle(s);

  if (s <= 36) {
    const row = Math.floor((s - 1) / 4);
    const col = (s - 1) % 4;
    const zBase = -42.5 + row * 4.4;
    const xCols = [-11.8, -5.6, 5.6, 11.8];
    const xOffset = ((s % 3) - 1) * 0.22;
    const zOffset = s % 2 === 0 ? 0.22 : -0.22;
    const posX = Number((xCols[col] + xOffset).toFixed(2));
    const posZ = Number((zBase + zOffset).toFixed(2));
    const faceBase = col < 2 ? 0.08 : -0.09;
    const yaw = Number((faceBase + ((s % 5) - 2) * 0.025).toFixed(3));
    const zone: CemeteryZone =
      row <= 4 ? 'old_cemetery' : col >= 2 && row <= 6 ? 'memorial_garden' : 'new_cemetery';

    return {
      slotIndex: s,
      zone,
      posX,
      posY: terrainHeight(posX, posZ),
      posZ,
      rotationY: yaw,
      graveStyle: style,
    };
  }

  if (s === 37) {
    const posX = -9.6;
    const posZ = -4.2;
    return { slotIndex: 37, zone: 'new_cemetery', posX, posY: terrainHeight(posX, posZ), posZ, rotationY: 0.09, graveStyle: 'scroll' };
  }
  if (s === 38) {
    const posX = 4.35;
    const posZ = -2.2;
    return { slotIndex: 38, zone: 'new_cemetery', posX, posY: terrainHeight(posX, posZ), posZ, rotationY: -0.14, graveStyle: 'arched' };
  }
  if (s === 39) {
    const posX = -4.65;
    const posZ = -1.9;
    return { slotIndex: 39, zone: 'new_cemetery', posX, posY: terrainHeight(posX, posZ), posZ, rotationY: 0.15, graveStyle: 'arched' };
  }
  if (s === 40) {
    const posX = -0.75;
    const posZ = 1.65;
    return { slotIndex: 40, zone: 'new_cemetery', posX, posY: terrainHeight(posX, posZ), posZ, rotationY: 0.06, graveStyle: 'arched' };
  }

  const extra = s - 41;
  const cycle = Math.floor(extra / 3);
  const role = extra % 3;
  const baseZ = 6.6 + cycle * 5.0;
  const pathX = getPathCenterX(baseZ);

  if (role === 0) {
    const posX = Number((pathX + 4.0 + ((s % 3) - 1) * 0.2).toFixed(2));
    const posZ = Number((baseZ - 0.4).toFixed(2));
    return { slotIndex: s, zone: 'new_cemetery', posX, posY: terrainHeight(posX, posZ), posZ, rotationY: -0.13, graveStyle: style };
  }
  if (role === 1) {
    const posX = Number((pathX - 4.6 + ((s % 3) - 1) * 0.2).toFixed(2));
    const posZ = Number((baseZ + 0.2).toFixed(2));
    return { slotIndex: s, zone: 'new_cemetery', posX, posY: terrainHeight(posX, posZ), posZ, rotationY: 0.15, graveStyle: style };
  }
  const posX = Number((pathX - 2.35).toFixed(2));
  const posZ = Number((baseZ + 2.4).toFixed(2));
  return { slotIndex: s, zone: 'new_cemetery', posX, posY: terrainHeight(posX, posZ), posZ, rotationY: 0.06, graveStyle: style };
}
