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
    // Lighter moonlit mist fog so background stones & gate silhouettes stay vivid
    this.fog = new THREE.FogExp2('#1D2848', 0.0155);
    scene.fog = this.fog;

    const mistCount = tier === 'low' ? 2 : 4;
    for (let i = 0; i < mistCount; i += 1) {
      const mist = new THREE.Mesh(
        new THREE.PlaneGeometry(26, 18),
        new THREE.MeshBasicMaterial({
          map: assets.mistMap,
          color: 0x7185b8,
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      mist.rotation.x = -Math.PI / 2;
      const baseX = (i - 1.5) * 6.5;
      const baseZ = -8 - i * 9.5;
      mist.position.set(baseX, 0.55 + (i % 2) * 0.25, baseZ);
      mist.userData = { baseX, phase: i * 1.4 };
      scene.add(mist);
      this.mistPlanes.push(mist);
    }

    const maxCount = 56;
    this.fireflyPositions = new Float32Array(maxCount * 3);
    this.fireflyBase = new Float32Array(maxCount * 3);

    for (let i = 0; i < maxCount; i += 1) {
      const x = (((i * 37) % 100) / 100 - 0.5) * 20;
      const y = 0.6 + ((i * 29) % 100) / 100 * 2.4;
      const z = 3.5 - ((i * 53) % 100) / 100 * 42;
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
        size: 0.24,
        transparent: true,
        opacity: 0.85,
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
      m.visible = tier !== 'low' || idx < 2;
    });
  }

  private setParticleBudget(geo: THREE.BufferGeometry, tier: QualityTier): void {
    const count = tier === 'high' ? 56 : tier === 'medium' ? 32 : 12;
    geo.setDrawRange(0, count);
  }

  public update(elapsedSec: number, reducedMotion: boolean): void {
    if (reducedMotion) return;

    this.mistPlanes.forEach((mist) => {
      const baseX = Number(mist.userData.baseX || 0);
      const phase = Number(mist.userData.phase || 0);
      mist.position.x = baseX + Math.sin(elapsedSec * 0.09 + phase) * 2.2;
      (mist.material as THREE.MeshBasicMaterial).opacity =
        0.19 + Math.sin(elapsedSec * 0.35 + phase) * 0.05;
    });

    (this.fireflies.material as THREE.PointsMaterial).opacity =
      0.75 + Math.sin(elapsedSec * 1.9) * 0.18;

    const attr = this.fireflies.geometry.getAttribute('position') as THREE.BufferAttribute;
    const count = this.fireflies.geometry.drawRange.count;
    for (let i = 0; i < count; i += 1) {
      const bx = this.fireflyBase[i * 3];
      const by = this.fireflyBase[i * 3 + 1];
      const bz = this.fireflyBase[i * 3 + 2];
      this.fireflyPositions[i * 3] = bx + Math.sin(elapsedSec * 0.65 + i) * 0.48;
      this.fireflyPositions[i * 3 + 1] = by + Math.cos(elapsedSec * 0.85 + i * 1.3) * 0.32;
      this.fireflyPositions[i * 3 + 2] = bz + Math.sin(elapsedSec * 0.52 + i * 0.8) * 0.42;
    }
    attr.needsUpdate = true;
  }
}
