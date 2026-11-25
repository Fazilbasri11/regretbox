export type CemeteryZone = 'entrance' | 'new_cemetery' | 'old_cemetery' | 'memorial_garden';
export type GraveStyle = 'arched' | 'slim' | 'cross' | 'scroll';

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
  if (bucket < 85) return 'cross';
  return 'scroll';
}

export function getPathCenterX(z: number): number {
  const t = Math.max(0, Math.min(1, (z + 34) / 42));
  return Number((Math.sin(t * Math.PI * 0.65) * 1.35).toFixed(3));
}

export function computeGravePlacement(slotIndex: number): GravePlacement {
  const s = Math.max(1, Math.floor(slotIndex));
  const style = s === 38 || s === 39 || s === 40 ? 'arched' : pickWeightedGraveStyle(s);

  if (s <= 36) {
    const row = Math.floor((s - 1) / 4);
    const col = (s - 1) % 4;
    const zBase = -30.5 + row * 3.1;
    const xCols = [-8.0, -4.1, 4.1, 7.8];
    const xOffset = ((s % 3) - 1) * 0.14;
    const zOffset = s % 2 === 0 ? 0.15 : -0.15;
    const posX = Number((xCols[col] + xOffset).toFixed(2));
    const posZ = Number((zBase + zOffset).toFixed(2));
    const faceBase = col < 2 ? 0.08 : -0.09;
    const yaw = Number((faceBase + ((s % 5) - 2) * 0.025).toFixed(3));
    const zone: CemeteryZone =
      row <= 4 ? 'old_cemetery' : col >= 2 && row <= 6 ? 'memorial_garden' : 'new_cemetery';

    return { slotIndex: s, zone, posX, posY: 0, posZ, rotationY: yaw, graveStyle: style };
  }

  if (s === 37) {
    return { slotIndex: 37, zone: 'new_cemetery', posX: -6.9, posY: 0, posZ: -2.6, rotationY: 0.09, graveStyle: 'scroll' };
  }
  if (s === 38) {
    return { slotIndex: 38, zone: 'new_cemetery', posX: 3.05, posY: 0, posZ: -1.6, rotationY: -0.14, graveStyle: 'arched' };
  }
  if (s === 39) {
    return { slotIndex: 39, zone: 'new_cemetery', posX: -3.45, posY: 0, posZ: -1.2, rotationY: 0.16, graveStyle: 'arched' };
  }
  if (s === 40) {
    return { slotIndex: 40, zone: 'new_cemetery', posX: -0.62, posY: 0, posZ: 1.35, rotationY: 0.06, graveStyle: 'arched' };
  }

  const extra = s - 41;
  const cycle = Math.floor(extra / 3);
  const role = extra % 3;
  const baseZ = 4.4 + cycle * 3.1;
  const pathX = getPathCenterX(baseZ);

  if (role === 0) {
    return {
      slotIndex: s,
      zone: 'new_cemetery',
      posX: Number((pathX + 2.9 + ((s % 3) - 1) * 0.15).toFixed(2)),
      posY: 0,
      posZ: Number((baseZ - 0.3).toFixed(2)),
      rotationY: -0.13,
      graveStyle: style,
    };
  }
  if (role === 1) {
    return {
      slotIndex: s,
      zone: 'new_cemetery',
      posX: Number((pathX - 3.6 + ((s % 3) - 1) * 0.15).toFixed(2)),
      posY: 0,
      posZ: Number((baseZ + 0.1).toFixed(2)),
      rotationY: 0.15,
      graveStyle: style,
    };
  }
  return {
    slotIndex: s,
    zone: 'new_cemetery',
    posX: Number((pathX - 1.55).toFixed(2)),
    posY: 0,
    posZ: Number((baseZ + 2.6).toFixed(2)),
    rotationY: 0.06,
    graveStyle: style,
  };
}
