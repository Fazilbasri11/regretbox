import gsap from 'gsap';
import * as THREE from 'three';
import type { Grave } from '../types/grave';
import type { CameraController } from './CameraController';

export class BurialAnimation {
  private risingMesh: THREE.Mesh | null = null;
  private glowLight: THREE.PointLight | null = null;
  private timeline: gsap.core.Timeline | null = null;

  constructor(
    private scene: THREE.Scene,
    private cameraCtrl: CameraController,
  ) {}

  public play(grave: Grave, onComplete: () => void): void {
    this.stop();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      this.cameraCtrl.flyToGrave(grave, onComplete);
      return;
    }

    // Create a temporary rising amber-lit stone spirit effect at the new plot
    const geo = new THREE.BoxGeometry(1.18, 1.66, 0.34);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x808792,
      emissive: 0xe09f3e,
      emissiveIntensity: 0.45,
      roughness: 0.85,
    });
    this.risingMesh = new THREE.Mesh(geo, mat);
    this.risingMesh.position.set(grave.pos_x, -1.2, grave.pos_z);
    this.risingMesh.rotation.y = grave.rotation_y;
    this.scene.add(this.risingMesh);

    this.glowLight = new THREE.PointLight(0xffb54d, 3.0, 9, 1.5);
    this.glowLight.position.set(grave.pos_x, 1.2, grave.pos_z + 1.0);
    this.scene.add(this.glowLight);

    this.cameraCtrl.flyToGrave(grave);

    this.timeline = gsap.timeline({
      onComplete: () => {
        this.cleanupTempObjects();
        onComplete();
      },
    });

    this.timeline
      .to(this.risingMesh.position, {
        y: 1.04,
        duration: 1.6,
        ease: 'power2.out',
      })
      .to(
        mat,
        {
          emissiveIntensity: 0,
          duration: 0.9,
          ease: 'sine.inOut',
        },
        '-=0.4',
      );
  }

  public skip(grave: Grave, onComplete: () => void): void {
    this.stop();
    this.cameraCtrl.flyToGrave(grave, onComplete);
  }

  public stop(): void {
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
    this.cleanupTempObjects();
  }

  private cleanupTempObjects(): void {
    if (this.risingMesh) {
      this.scene.remove(this.risingMesh);
      this.risingMesh.geometry.dispose();
      (this.risingMesh.material as THREE.Material).dispose();
      this.risingMesh = null;
    }
    if (this.glowLight) {
      this.scene.remove(this.glowLight);
      this.glowLight = null;
    }
  }
}
