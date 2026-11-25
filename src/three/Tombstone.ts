import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { GraveStyle } from '../types/grave';

function applyWeatheringNoise(geo: THREE.BufferGeometry, amplitude = 0.012): THREE.BufferGeometry {
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n =
      Math.sin(x * 13.7 + y * 9.3 + z * 17.1) * 0.5 +
      Math.cos(x * 23.1 - y * 15.7) * 0.5;
    pos.setXYZ(i, x + n * amplitude, y + n * amplitude * 0.5, z + n * amplitude * 0.4);
  }
  geo.computeVertexNormals();
  return geo;
}

function buildArchedShape(w: number, h: number, archHeight: number): THREE.Shape {
  const hw = w / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, 0);
  shape.lineTo(-hw, h - archHeight);
  shape.absarc(0, h - archHeight, hw, Math.PI, 0, true);
  shape.lineTo(hw, 0);
  shape.closePath();
  return shape;
}

function buildScrollShape(w: number, h: number): THREE.Shape {
  const hw = w / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, 0);
  shape.lineTo(-hw, h * 0.86);
  shape.quadraticCurveTo(-hw * 0.72, h * 1.03, -hw * 0.35, h * 0.94);
  shape.quadraticCurveTo(0, h * 1.04, hw * 0.35, h * 0.94);
  shape.quadraticCurveTo(hw * 0.72, h * 1.03, hw, h * 0.86);
  shape.lineTo(hw, 0);
  shape.closePath();
  return shape;
}

function createExtrudedSlab(
  shape: THREE.Shape,
  depth: number,
  curveSegments: number,
  bevelSegments: number,
  bevelSize = 0.04,
): THREE.BufferGeometry {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    curveSegments,
    bevelEnabled: true,
    bevelThickness: bevelSize,
    bevelSize,
    bevelSegments,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

export interface TombstoneGeometries {
  lod0: Record<GraveStyle, THREE.BufferGeometry>;
  lod1: Record<GraveStyle, THREE.BufferGeometry>;
  lod2: Record<GraveStyle, THREE.BufferGeometry>;
  plinth: THREE.BufferGeometry;
  mound: THREE.BufferGeometry;
}

function buildStyleGeometry(style: GraveStyle, detail: 'lod0' | 'lod1' | 'lod2'): THREE.BufferGeometry {
  const curveSeg = detail === 'lod0' ? 40 : detail === 'lod1' ? 16 : 6;
  const bevelSeg = detail === 'lod0' ? 6 : detail === 'lod1' ? 2 : 1;
  const bevel = detail === 'lod2' ? 0.015 : 0.045;

  const parts: THREE.BufferGeometry[] = [];

  if (style === 'arched') {
    const body = createExtrudedSlab(buildArchedShape(1.02, 1.52, 0.51), 0.24, curveSeg, bevelSeg, bevel);
    parts.push(body);

    if (detail !== 'lod2') {
      // Stepped beveled arch trim around the recessed front face
      const trim = createExtrudedSlab(buildArchedShape(0.94, 1.44, 0.47), 0.04, curveSeg, 2, 0.018);
      trim.translate(0, 0.04, 0.13);
      parts.push(trim);
    }
  } else if (style === 'slim') {
    const body = createExtrudedSlab(buildArchedShape(0.84, 1.72, 0.42), 0.22, curveSeg, bevelSeg, bevel);
    parts.push(body);
  } else if (style === 'cross') {
    const body = createExtrudedSlab(buildArchedShape(0.94, 1.32, 0.47), 0.24, curveSeg, bevelSeg, bevel);
    parts.push(body);
    const vBar = createExtrudedSlab(buildArchedShape(0.18, 0.44, 0.05), 0.14, 8, 2, 0.02);
    vBar.translate(0, 1.28, 0);
    const hBar = createExtrudedSlab(buildArchedShape(0.42, 0.14, 0.02), 0.14, 8, 2, 0.02);
    hBar.translate(0, 1.46, 0);
    parts.push(vBar, hBar);
  } else {
    const body = createExtrudedSlab(buildScrollShape(1.04, 1.44), 0.24, curveSeg, bevelSeg, bevel);
    parts.push(body);
  }

  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return detail === 'lod0' ? applyWeatheringNoise(merged, 0.008) : merged;
}

export function createTombstoneGeometries(): TombstoneGeometries {
  const styles: GraveStyle[] = ['arched', 'slim', 'cross', 'scroll'];
  const lod0 = {} as Record<GraveStyle, THREE.BufferGeometry>;
  const lod1 = {} as Record<GraveStyle, THREE.BufferGeometry>;
  const lod2 = {} as Record<GraveStyle, THREE.BufferGeometry>;

  for (const s of styles) {
    lod0[s] = buildStyleGeometry(s, 'lod0');
    lod1[s] = buildStyleGeometry(s, 'lod1');
    lod2[s] = buildStyleGeometry(s, 'lod2');
  }

  // Stepped wider plinth half-sunk in soil
  const plinthShape = new THREE.Shape();
  plinthShape.moveTo(-0.66, 0);
  plinthShape.lineTo(-0.66, 0.22);
  plinthShape.lineTo(0.66, 0.22);
  plinthShape.lineTo(0.66, 0);
  plinthShape.closePath();
  const plinth = createExtrudedSlab(plinthShape, 0.56, 4, 2, 0.025);
  plinth.translate(0, -0.04, 0);

  // Soft earth mound in front of gravestone
  const mound = new THREE.SphereGeometry(0.62, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
  mound.scale(1.15, 0.24, 1.65);
  mound.translate(0, 0.0, 0.65);

  return { lod0, lod1, lod2, plinth, mound };
}
