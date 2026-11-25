import * as THREE from 'three';
import type { AssetLoader } from './AssetLoader';
import type { QualityTier } from './PerformanceManager';

export class Atmosphere {
  private fog: THREE.FogExp2;
  private mistPlanes: THREE.Mesh[] = [];
  private fireflies: THREE.Points;
  private fireflyPositions: Float32Array;
  private fireflyBase: Float32Array;

  constructor(
    scene: THREE.Scene,
    assets: AssetLoader,
    tier: QualityTier,
  ) {
    this.fog = new THREE.FogExp2('#141B33', 0.021);
    scene.fog = this.fog;

    // 5 Drifting ground mist layers (y = 0.2..0.85m, tinted #5A6C9C)
    const mistCount = tier === 'low' ? 3 : 5;
    for (let i = 0; i < mistCount; i += 1) {
      const mist = new THREE.Mesh(
        new THREE.PlaneGeometry(24, 16),
        new THREE.MeshBasicMaterial({
          map: assets.mistMap,
          color: 0x5a6c9c,
          transparent: true,
          opacity: 0.17,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      mist.rotation.x = -Math.PI / 2;
      const baseX = (i - 2) * 5.5;
      const baseZ = -4 - i * 6.5;
      mist.position.set(baseX, 0.22 + (i % 3) * 0.2, baseZ);
      mist.userData = { baseX, phase: i * 1.4 };
      scene.add(mist);
      this.mistPlanes.push(mist);
    }

    // Warm fireflies / dust particles near lanterns (80 / 40 / 15)
    const maxCount = 80;
    this.fireflyPositions = new Float32Array(maxCount * 3);
    this.fireflyBase = new Float32Array(maxCount * 3);

    for (let i = 0; i < maxCount; i += 1) {
      const x = (((i * 37) % 100) / 100 - 0.5) * 18;
      const y = 0.4 + ((i * 29) % 100) / 100 * 2.2;
      const z = 2.5 - ((i * 53) % 100) / 100 * 32;
      this.fireflyBase[i * 3] = this.fireflyPositions[i * 3] = x;
      this.fireflyBase[i * 3 + 1] = this.fireflyPositions[i * 3 + 1] = y;
      this.fireflyBase[i * 3 + 2] = this.fireflyPositions[i * 3 + 2] = z;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.fireflyPositions, 3));
    this.setParticleBudget(geo, tier);

    this.fireflies = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        map: assets.glowMap,
        color: 0xffd9a0,
        size: 0.22,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(this.fireflies);
  }

  public setTier(tier: QualityTier, reducedMotion: boolean): void {
    this.setParticleBudget(this.fireflies.geometry, tier);
    this.fireflies.visible = !reducedMotion;
    this.mistPlanes.forEach((m, idx) => {
      m.visible = tier !== 'low' || idx < 3;
    });
  }

  private setParticleBudget(geo: THREE.BufferGeometry, tier: QualityTier): void {
    const count = tier === 'high' ? 80 : tier === 'medium' ? 40 : 15;
    geo.setDrawRange(0, count);
  }

  public update(elapsedSec: number, reducedMotion: boolean): void {
    if (reducedMotion) return;

    this.mistPlanes.forEach((mist) => {
      const baseX = Number(mist.userData.baseX || 0);
      const phase = Number(mist.userData.phase || 0);
      mist.position.x = baseX + Math.sin(elapsedSec * 0.06 + phase) * 1.6;
    });

    const attr = this.fireflies.geometry.getAttribute('position') as THREE.BufferAttribute;
    const count = this.fireflies.geometry.drawRange.count;
    for (let i = 0; i < count; i += 1) {
      const bx = this.fireflyBase[i * 3];
      const by = this.fireflyBase[i * 3 + 1];
      const bz = this.fireflyBase[i * 3 + 2];
      this.fireflyPositions[i * 3] = bx + Math.sin(elapsedSec * 0.55 + i) * 0.35;
      this.fireflyPositions[i * 3 + 1] = by + Math.cos(elapsedSec * 0.7 + i * 1.3) * 0.25;
      this.fireflyPositions[i * 3 + 2] = bz + Math.sin(elapsedSec * 0.45 + i * 0.8) * 0.3;
    }
    attr.needsUpdate = true;
  }
}
