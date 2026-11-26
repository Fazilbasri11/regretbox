import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Grave } from '../types/grave';
import type { AssetLoader } from './AssetLoader';
import type { QualityTier } from './PerformanceManager';
import { getPathCenterX, getTerrainHeight, PATH_HALF_WIDTH } from './terrain';

interface LanternUnit {
  light: THREE.PointLight | null;
  sprite: THREE.Sprite;
  flameMat: THREE.MeshBasicMaterial;
  phase: number;
  baseIntensity: number;
}

export interface LanternSpec {
  x: number;
  y: number;
  z: number;
  hasLight: boolean;
  scale?: number;
}

/**
 * Generates lantern positions strictly OFF the cobblestone road (|x - pathCenter| >= PATH_HALF_WIDTH + 0.65)
 * and resting accurately on the rolling terrain height.
 */
export function computeLanternPositions(
  heroGrave: Grave | null,
  leftGrave: Grave | null,
  rightGrave: Grave | null,
): LanternSpec[] {
  const hx = heroGrave?.pos_x ?? -0.75;
  const hz = heroGrave?.pos_z ?? 1.65;
  const lx = leftGrave?.pos_x ?? -4.65;
  const lz = leftGrave?.pos_z ?? -1.9;
  const rx = rightGrave?.pos_x ?? 4.35;
  const rz = rightGrave?.pos_z ?? -2.2;

  const curbOffset = PATH_HALF_WIDTH + 0.72; // 2.37m from path center -> always on grass shoulder
  const gateZ = -46;
  const gateY = getTerrainHeight(0, gateZ);

  const groundLantern = (x: number, z: number, hasLight: boolean, scale = 0.78): LanternSpec => ({
    x,
    y: getTerrainHeight(x, z),
    z,
    hasLight,
    scale,
  });

  const signLanternZ = hz + 0.72;
  const signLanternX = getPathCenterX(signLanternZ) + curbOffset + 0.35;

  return [
    groundLantern(hx - 0.85, hz + 0.32, true, 0.76),
    groundLantern(lx - 0.82, lz + 0.35, true, 0.72),
    groundLantern(rx + 0.82, rz + 0.35, true, 0.72),
    groundLantern(signLanternX, signLanternZ, true, 0.65), // Beside Add Your Regret sign (off road)
    { x: -3.6, y: gateY + 5.58, z: gateZ, hasLight: true, scale: 1.2 }, // Left gate pillar
    { x: 3.6, y: gateY + 5.58, z: gateZ, hasLight: false, scale: 1.2 }, // Right gate pillar
    groundLantern(getPathCenterX(-8) + curbOffset, -8, false, 0.82),
    groundLantern(getPathCenterX(-15) - curbOffset, -15, false, 0.82),
    groundLantern(getPathCenterX(-22) + curbOffset, -22, false, 0.82),
    groundLantern(getPathCenterX(-29) - curbOffset, -29, false, 0.82),
    groundLantern(getPathCenterX(-36) + curbOffset, -36, false, 0.82),
    groundLantern(getPathCenterX(-42) - curbOffset, -42, false, 0.82),
    groundLantern(11.4, -30.5, false, 0.9), // Pavilion front
    groundLantern(-9.5, -44.2, false, 0.82), // Fence left
    groundLantern(9.5, -44.2, false, 0.82), // Fence right
  ];
}

function buildLanternFrameGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const base = new THREE.CylinderGeometry(0.14, 0.19, 0.14, 6);
  base.translate(0, 0.07, 0);
  parts.push(base);

  for (let i = 0; i < 4; i += 1) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const strut = new THREE.CylinderGeometry(0.015, 0.018, 0.34, 5);
    strut.translate(Math.cos(angle) * 0.12, 0.31, Math.sin(angle) * 0.12);
    parts.push(strut);
  }

  const roof = new THREE.ConeGeometry(0.22, 0.16, 6);
  roof.translate(0, 0.54, 0);
  parts.push(roof);

  const ring = new THREE.TorusGeometry(0.04, 0.01, 6, 10);
  ring.translate(0, 0.65, 0);
  parts.push(ring);

  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return merged;
}

export class Lanterns {
  private units: LanternUnit[] = [];
  private group = new THREE.Group();

  constructor(
    scene: THREE.Scene,
    assets: AssetLoader,
    tier: QualityTier,
    positions: LanternSpec[],
  ) {
    scene.add(this.group);

    const frameGeo = buildLanternFrameGeometry();
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1b2029,
      roughness: 0.45,
      metalness: 0.82,
    });
    const glassGeo = new THREE.CylinderGeometry(0.11, 0.095, 0.28, 6);
    const decalGeo = new THREE.PlaneGeometry(2.4, 2.4);

    const frames = new THREE.InstancedMesh(frameGeo, frameMat, positions.length);
    const dummy = new THREE.Object3D();

    positions.forEach((pos, idx) => {
      const s = pos.scale ?? 1;
      dummy.position.set(pos.x, pos.y, pos.z);
      dummy.rotation.set(0, (idx * 0.4) % Math.PI, 0);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      frames.setMatrixAt(idx, dummy.matrix);

      const flameMat = new THREE.MeshBasicMaterial({ color: 0xffdfa8 });
      const glass = new THREE.Mesh(glassGeo, flameMat);
      glass.position.set(pos.x, pos.y + 0.3 * s, pos.z);
      glass.scale.set(s, s, s);
      this.group.add(glass);

      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: assets.glowMap,
          color: 0xffb45a,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      sprite.position.set(pos.x, pos.y + 0.32 * s, pos.z);
      sprite.scale.set(1.7 * s, 1.7 * s, 1);
      this.group.add(sprite);

      if (pos.y < 1.6) {
        const decal = new THREE.Mesh(
          decalGeo,
          new THREE.MeshBasicMaterial({
            map: assets.glowMap,
            color: 0xffa84c,
            transparent: true,
            opacity: tier === 'low' ? 0.22 : 0.16,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        decal.rotation.x = -Math.PI / 2;
        decal.position.set(pos.x, pos.y + 0.04, pos.z);
        this.group.add(decal);
      }

      let light: THREE.PointLight | null = null;
      const maxLights = tier === 'high' ? 5 : tier === 'medium' ? 2 : 0;
      if (pos.hasLight && idx < maxLights) {
        light = new THREE.PointLight('#FFB45A', 1.55, 7.2, 2);
        light.position.set(pos.x, pos.y + 0.38 * s, pos.z);
        this.group.add(light);
      }

      this.units.push({
        light,
        sprite,
        flameMat,
        phase: idx * 1.73,
        baseIntensity: 1.55,
      });
    });

    frames.instanceMatrix.needsUpdate = true;
    this.group.add(frames);
  }

  public update(elapsedSec: number, reducedMotion: boolean): void {
    for (const u of this.units) {
      const flicker = reducedMotion
        ? 1.0
        : 0.92 + Math.sin(elapsedSec * 7.2 + u.phase) * 0.05 + Math.cos(elapsedSec * 11.4 + u.phase) * 0.04;
      if (u.light) {
        u.light.intensity = u.baseIntensity * flicker;
      }
      u.sprite.material.opacity = 0.48 * flicker;
      const baseScale = (u.sprite.userData.baseScale as number) || u.sprite.scale.x;
      u.sprite.userData.baseScale = baseScale;
      const s = baseScale * (0.96 + flicker * 0.04);
      u.sprite.scale.set(s, s, 1);
    }
  }
}
