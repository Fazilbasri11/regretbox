import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { AssetLoader } from './AssetLoader';
import type { QualityTier } from './PerformanceManager';

interface LanternUnit {
  light: THREE.PointLight | null;
  sprite: THREE.Sprite;
  flameMat: THREE.MeshBasicMaterial;
  phase: number;
  baseIntensity: number;
}

function buildLanternFrameGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // Tapered stepped base
  const base = new THREE.CylinderGeometry(0.14, 0.19, 0.14, 6);
  base.translate(0, 0.07, 0);
  parts.push(base);

  // 4 corner wrought-iron struts
  for (let i = 0; i < 4; i += 1) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const strut = new THREE.CylinderGeometry(0.015, 0.018, 0.34, 5);
    strut.translate(Math.cos(angle) * 0.12, 0.31, Math.sin(angle) * 0.12);
    parts.push(strut);
  }

  // Tiered pagoda iron cap & ring finial
  const roof = new THREE.ConeGeometry(0.22, 0.16, 6);
  roof.translate(0, 0.54, 0);
  parts.push(roof);

  const ring = new THREE.TorusGeometry(0.04, 0.01, 6, 12);
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
    positions: Array<{ x: number; y: number; z: number; hasLight: boolean; scale?: number }>,
  ) {
    scene.add(this.group);

    const frameGeo = buildLanternFrameGeometry();
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1b2029,
      roughness: 0.45,
      metalness: 0.82,
    });
    const glassGeo = new THREE.CylinderGeometry(0.11, 0.095, 0.28, 6);
    const decalGeo = new THREE.PlaneGeometry(2.6, 2.6);

    const frames = new THREE.InstancedMesh(frameGeo, frameMat, positions.length);
    const dummy = new THREE.Object3D();

    positions.forEach((pos, idx) => {
      const s = pos.scale ?? 1;
      dummy.position.set(pos.x, pos.y, pos.z);
      dummy.rotation.set(0, (idx * 0.4) % Math.PI, 0);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      frames.setMatrixAt(idx, dummy.matrix);

      // Warm glass & candle core
      const flameMat = new THREE.MeshBasicMaterial({
        color: 0xffd9a0,
      });
      const glass = new THREE.Mesh(glassGeo, flameMat);
      glass.position.set(pos.x, pos.y + 0.3 * s, pos.z);
      glass.scale.set(s, s, s);
      this.group.add(glass);

      // Additive radial glow sprite (~1.2m radius)
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: assets.glowMap,
          color: 0xffb45a,
          transparent: true,
          opacity: 0.52,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      sprite.position.set(pos.x, pos.y + 0.32 * s, pos.z);
      sprite.scale.set(1.75 * s, 1.75 * s, 1);
      this.group.add(sprite);

      // Subtle warm light decal pool on ground beneath lantern
      if (pos.y < 1.2) {
        const decal = new THREE.Mesh(
          decalGeo,
          new THREE.MeshBasicMaterial({
            map: assets.glowMap,
            color: 0xffa84c,
            transparent: true,
            opacity: 0.16,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        decal.rotation.x = -Math.PI / 2;
        decal.position.set(pos.x, 0.04, pos.z);
        this.group.add(decal);
      }

      // Real PointLight budget: max 4-6 nearest lanterns
      let light: THREE.PointLight | null = null;
      if (pos.hasLight && tier !== 'low') {
        light = new THREE.PointLight('#FFB45A', 1.45, 6.8, 2);
        light.position.set(pos.x, pos.y + 0.38 * s, pos.z);
        this.group.add(light);
      }

      this.units.push({
        light,
        sprite,
        flameMat,
        phase: idx * 1.73,
        baseIntensity: 1.45,
      });
    });

    frames.instanceMatrix.needsUpdate = true;
    this.group.add(frames);
  }

  public update(elapsedSec: number, reducedMotion: boolean): void {
    for (const u of this.units) {
      const flicker = reducedMotion
        ? 1.0
        : 0.94 + Math.sin(elapsedSec * 7.2 + u.phase) * 0.04 + Math.cos(elapsedSec * 11.4 + u.phase) * 0.03;
      if (u.light) {
        u.light.intensity = u.baseIntensity * flicker;
      }
      u.sprite.material.opacity = 0.78 * flicker;
    }
  }
}
