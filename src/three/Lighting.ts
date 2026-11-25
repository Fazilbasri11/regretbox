import * as THREE from 'three';
import type { QualityTier } from './PerformanceManager';

export class Lighting {
  public readonly moonLight: THREE.DirectionalLight;
  public readonly hemiLight: THREE.HemisphereLight;
  public readonly heroFillLight: THREE.DirectionalLight;

  constructor(scene: THREE.Scene, tier: QualityTier) {
    // Brighter moonlit rim & shadow directional light (1024 shadow map for smooth FPS)
    this.moonLight = new THREE.DirectionalLight('#B8CDFF', 1.68);
    this.moonLight.position.set(16, 28, -54);
    this.moonLight.castShadow = tier !== 'low';
    this.moonLight.shadow.mapSize.set(1024, 1024);
    this.moonLight.shadow.camera.near = 4;
    this.moonLight.shadow.camera.far = 92;
    this.moonLight.shadow.camera.left = -18;
    this.moonLight.shadow.camera.right = 18;
    this.moonLight.shadow.camera.top = 18;
    this.moonLight.shadow.camera.bottom = -18;
    this.moonLight.shadow.bias = -0.0006;
    scene.add(this.moonLight);

    // Stronger hemisphere ambient so mossy hills, grass, and stones read brightly like reference
    this.hemiLight = new THREE.HemisphereLight('#5870AD', '#293F2E', 1.15);
    scene.add(this.hemiLight);

    // Soft cool front-fill illuminating foreground stone faces
    this.heroFillLight = new THREE.DirectionalLight('#96AEE6', 1.25);
    this.heroFillLight.position.set(-2, 5.2, 16);
    scene.add(this.heroFillLight);
  }

  public setTier(tier: QualityTier): void {
    this.moonLight.castShadow = tier !== 'low';
  }
}
