import gsap from 'gsap';
import * as THREE from 'three';
import type { Grave } from '../types/grave';
import type { CameraController } from './CameraController';
import type { PostFX } from './PostFX';

export class BurialAnimation {
  private risingMesh: THREE.Mesh | null = null;
  private glowLight: THREE.PointLight | null = null;
  private timeline: gsap.core.Timeline | null = null;

  constructor(
    private scene: THREE.Scene,
    private cameraCtrl: CameraController,
    private postFx: PostFX,
  ) {}

  public play(grave: Grave, onComplete: () => void): void {
    this.stop();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      this.cameraCtrl.flyToGrave(grave, onComplete);
      return;
    }

    const shape = new THREE.Shape();
    shape.moveTo(-0.5, 0);
    shape.lineTo(-0.5, 1.0);
    shape.absarc(0, 1.0, 0.5, Math.PI, 0, true);
    shape.lineTo(0.5, 0);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.24, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3 });
    geo.translate(0, 0, -0.12);

    const mat = new THREE.MeshStandardMaterial({
      color: 0x86888a,
      emissive: new THREE.Color('#FFB45A'),
      emissiveIntensity: 0.45,
      roughness: 0.88,
    });
    this.risingMesh = new THREE.Mesh(geo, mat);
    this.risingMesh.position.set(grave.pos_x, -1.5, grave.pos_z);
    this.risingMesh.rotation.y = grave.rotation_y;
    this.scene.add(this.risingMesh);

    this.glowLight = new THREE.PointLight('#FFB45A', 2.8, 7.5, 2);
    this.glowLight.position.set(grave.pos_x, 0.9, grave.pos_z + 0.85);
    this.scene.add(this.glowLight);

    this.cameraCtrl.flyToGrave(grave);
    this.postFx.pulseBurialBloom();

    this.timeline = gsap.timeline({
      onComplete: () => {
        this.cleanupTempObjects();
        onComplete();
      },
    });

    this.timeline
      .to(this.risingMesh.position, {
        y: 0.14,
        duration: 1.65,
        ease: 'power2.out',
      })
      .to(
        mat,
        {
          emissiveIntensity: 0,
          duration: 0.85,
          ease: 'sine.inOut',
        },
        '-=0.35',
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
