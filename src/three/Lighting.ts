import * as THREE from 'three';
import type { QualityTier } from './PerformanceManager';

export class Lighting {
  public readonly moonLight: THREE.DirectionalLight;
  public readonly hemiLight: THREE.HemisphereLight;
  public readonly heroFillLight: THREE.DirectionalLight;

  constructor(scene: THREE.Scene, tier: QualityTier) {
    // Moon DirectionalLight aligned with moon back-right-up (14.5, 25.5, -78)
    this.moonLight = new THREE.DirectionalLight('#9DB4FF', 1.28);
    this.moonLight.position.set(16, 26, -48);
    this.moonLight.castShadow = tier !== 'low';
    this.moonLight.shadow.mapSize.set(2048, 2048);
    this.moonLight.shadow.camera.near = 2;
    this.moonLight.shadow.camera.far = 96;
    this.moonLight.shadow.camera.left = -22;
    this.moonLight.shadow.camera.right = 22;
    this.moonLight.shadow.camera.top = 22;
    this.moonLight.shadow.camera.bottom = -22;
    this.moonLight.shadow.bias = -0.0005;
    scene.add(this.moonLight);

    // Sky/ground HemisphereLight keeping shadows cold indigo-green & readable
    this.hemiLight = new THREE.HemisphereLight('#465A94', '#1E2F22', 0.85);
    scene.add(this.hemiLight);

    // Soft cool moon-mist bounce from camera-front so gravestone faces remain >= 70/255 readable
    this.heroFillLight = new THREE.DirectionalLight('#849CD6', 0.92);
    this.heroFillLight.position.set(-2, 4.8, 14);
    scene.add(this.heroFillLight);
  }

  public setTier(tier: QualityTier): void {
    this.moonLight.castShadow = tier !== 'low';
  }
}
