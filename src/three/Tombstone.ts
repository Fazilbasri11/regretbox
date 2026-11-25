import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { GraveStyle } from '../types/grave';

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

function buildPillarShape(w: number, h: number): THREE.Shape {
  const hw = w / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, 0);
  shape.lineTo(-hw, h * 0.82);
  shape.lineTo(-hw * 0.78, h * 0.92);
  shape.lineTo(0, h);
  shape.lineTo(hw * 0.78, h * 0.92);
  shape.lineTo(hw, h * 0.82);
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
  plinth: THREE.BufferGeometry;
  mound: THREE.BufferGeometry;
}

function buildStyleGeometry(style: GraveStyle, detail: 'lod0' | 'lod1'): THREE.BufferGeometry {
  const curveSeg = detail === 'lod0' ? 20 : 8;
  const bevelSeg = detail === 'lod0' ? 3 : 1;
  const bevel = detail === 'lod1' ? 0.02 : 0.042;
  const parts: THREE.BufferGeometry[] = [];

  if (style === 'arched') {
    parts.push(createExtrudedSlab(buildArchedShape(1.02, 1.52, 0.51), 0.24, curveSeg, bevelSeg, bevel));
    if (detail === 'lod0') {
      const trim = createExtrudedSlab(buildArchedShape(0.94, 1.44, 0.47), 0.04, curveSeg, 1, 0.016);
      trim.translate(0, 0.04, 0.13);
      parts.push(trim);
    }
  } else if (style === 'slim') {
    parts.push(createExtrudedSlab(buildArchedShape(0.86, 1.72, 0.43), 0.22, curveSeg, bevelSeg, bevel));
  } else if (style === 'pillar') {
    // Neutral beveled Gothic pointed-spire monument (no cross)
    parts.push(createExtrudedSlab(buildPillarShape(0.94, 1.66), 0.26, curveSeg, bevelSeg, bevel));
  } else {
    parts.push(createExtrudedSlab(buildScrollShape(1.04, 1.44), 0.24, curveSeg, bevelSeg, bevel));
  }

  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return merged;
}

export function createTombstoneGeometries(): TombstoneGeometries {
  const styles: GraveStyle[] = ['arched', 'slim', 'pillar', 'scroll'];
  const lod0 = {} as Record<GraveStyle, THREE.BufferGeometry>;
  const lod1 = {} as Record<GraveStyle, THREE.BufferGeometry>;

  for (const s of styles) {
    lod0[s] = buildStyleGeometry(s, 'lod0');
    lod1[s] = buildStyleGeometry(s, 'lod1');
  }

  const plinthShape = new THREE.Shape();
  plinthShape.moveTo(-0.66, 0);
  plinthShape.lineTo(-0.66, 0.22);
  plinthShape.lineTo(0.66, 0.22);
  plinthShape.lineTo(0.66, 0);
  plinthShape.closePath();
  const plinth = createExtrudedSlab(plinthShape, 0.56, 4, 2, 0.024);
  plinth.translate(0, -0.04, 0);

  const mound = new THREE.SphereGeometry(0.62, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
  mound.scale(1.15, 0.22, 1.55);
  mound.translate(0, 0, 0.62);

  return { lod0, lod1, plinth, mound };
}
