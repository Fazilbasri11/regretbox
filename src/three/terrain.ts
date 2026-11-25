export const PATH_HALF_WIDTH = 1.65;

/**
 * Curving center X of the cobblestone path at world Z.
 * Path flows from bottom-right (z = 8, x ≈ +1.55) to the gate (z = -46, x = 0).
 */
export function getPathCenterX(z: number): number {
  const t = Math.max(0, Math.min(1, (z + 46) / 54));
  return Number((Math.sin(t * Math.PI * 0.62) * 1.45).toFixed(3));
}

/**
 * Shared rolling-hill terrain heightmap so the ground has natural cemetery
 * mounds and gentle uphill shoulders ("pundak bukit kecil") while keeping
 * the cobblestone path smoothly graded.
 */
export function getTerrainHeight(x: number, z: number): number {
  const pathX = getPathCenterX(z);
  const distFromPath = Math.abs(x - pathX);

  // Gentle uphill slope toward the distant gate (z = -46)
  const gateSlope = Math.max(0, Math.min(1, (6 - z) / 52)) * 0.65;

  // Smooth lateral hills ("pundak bukit") outside the path edge
  const shoulderMask = Math.max(0, Math.min(1, (distFromPath - PATH_HALF_WIDTH) / 3.2));
  const hillA = Math.sin(x * 0.22 + 0.5) * Math.cos(z * 0.14 - 0.3) * 0.55;
  const hillB = Math.sin(x * 0.11 - z * 0.09) * 0.45 + 0.35;
  const outerRidge = Math.max(0, (distFromPath - 7) * 0.08);

  return Number((gateSlope + shoulderMask * Math.max(0, hillA + hillB + outerRidge)).toFixed(3));
}
