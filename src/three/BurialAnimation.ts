import gsap from 'gsap';
import * as THREE from 'three';
import type { Grave } from '../types/grave';
import type { CameraController } from './CameraController';
import type { GraveManager } from './GraveManager';
import type { PostFX } from './PostFX';
import { getTerrainHeight } from './terrain';

export class BurialAnimation {
  private risingGroup: THREE.Group | null = null;
  private risingStoneMat: THREE.MeshStandardMaterial | null = null;
  private ritualRing: THREE.Mesh | null = null;
  private embers: THREE.Points | null = null;
  private glowLight: THREE.PointLight | null = null;
  private timeline: gsap.core.Timeline | null = null;

  constructor(
    private scene: THREE.Scene,
    private cameraCtrl: CameraController,
    private postFx: PostFX,
    private graveMgr: GraveManager,
  ) {}

  public play(grave: Grave, onComplete: () => void): void {
    this.stop();
    gsap.ticker.lagSmoothing(0);

    const gy =
      typeof grave.pos_y === 'number' && grave.pos_y !== 0
        ? grave.pos_y
        : getTerrainHeight(grave.pos_x, grave.pos_z);

    // Hide the permanent static stone while the rising ceremony plays
    this.graveMgr.setAnimatingGraveId(grave.id);

    // 1. Build rising stone + plinth group starting underground below hill elevation gy
    const group = new THREE.Group();
    group.position.set(grave.pos_x, gy - 1.75, grave.pos_z);
    group.rotation.y = grave.rotation_y;

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0xaab2be,
      emissive: new THREE.Color('#FFB45A'),
      emissiveIntensity: 0.9,
      roughness: 0.82,
    });
    this.risingStoneMat = stoneMat;

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.22, 0.56), stoneMat);
    plinth.position.set(0, 0.08, 0);
    group.add(plinth);

    const shape = new THREE.Shape();
    shape.moveTo(-0.5, 0);
    shape.lineTo(-0.5, 1.0);
    shape.absarc(0, 1.0, 0.5, Math.PI, 0, true);
    shape.lineTo(0.5, 0);
    shape.closePath();

    const headGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.24,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 3,
    });
    headGeo.translate(0, 0, -0.12);
    const headMesh = new THREE.Mesh(headGeo, stoneMat);
    headMesh.position.set(0, 0.14, 0);
    group.add(headMesh);

    this.scene.add(group);
    this.risingGroup = group;

    // 2. Glowing golden earth seal ring at ground level gy
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#FFB45A',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.68, 1.06, 32), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(grave.pos_x, gy + 0.05, grave.pos_z);
    ring.scale.setScalar(0.35);
    this.scene.add(ring);
    this.ritualRing = ring;

    // 3. Rising golden embers & dust motes around the grave base
    const emberCount = 42;
    const emberPos = new Float32Array(emberCount * 3);
    const emberInit = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount; i += 1) {
      const ang = (i / emberCount) * Math.PI * 2 + (i % 3) * 0.4;
      const rad = 0.28 + ((i * 19) % 10) * 0.07;
      const px = grave.pos_x + Math.cos(ang) * rad;
      const py = gy + 0.04;
      const pz = grave.pos_z + Math.sin(ang) * rad;
      emberInit[i * 3] = emberPos[i * 3] = px;
      emberInit[i * 3 + 1] = emberPos[i * 3 + 1] = py;
      emberInit[i * 3 + 2] = emberPos[i * 3 + 2] = pz;
    }
    const emberGeo = new THREE.BufferGeometry();
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
    const emberMat = new THREE.PointsMaterial({
      color: '#ffd085',
      size: 0.12,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const embers = new THREE.Points(emberGeo, emberMat);
    this.scene.add(embers);
    this.embers = embers;

    // 4. Warm dramatic ritual light
    const sin = Math.sin(grave.rotation_y);
    const cos = Math.cos(grave.rotation_y);
    const glow = new THREE.PointLight('#FFB45A', 3.4, 9.5, 2);
    glow.position.set(grave.pos_x + sin * 0.95, gy + 1.05, grave.pos_z + cos * 0.95);
    this.scene.add(glow);
    this.glowLight = glow;

    // Fly camera to face the plot, then raise the stone out of the earth!
    this.cameraCtrl.flyToGrave(grave);
    this.postFx.pulseBurialBloom();

    const emberState = { progress: 0 };
    this.timeline = gsap.timeline({
      onComplete: () => {
        this.graveMgr.setAnimatingGraveId(null);
        this.graveMgr.updateNearbyPlaques(this.cameraCtrl.camera.position);
        this.cleanupTempObjects();
        onComplete();
      },
    });

    this.timeline
      // Earth opens & ritual ring glows while camera arrives
      .to(ringMat, { opacity: 0.92, duration: 0.45, ease: 'power2.out' }, 0)
      .to(ring.scale, { x: 1.25, y: 1.25, z: 1.25, duration: 0.9, ease: 'power2.out' }, 0)
      .to(emberMat, { opacity: 0.95, duration: 0.35 }, 0.3)
      // Rising headstone emerging dramatically out of the soil at true height gy
      .to(
        group.position,
        {
          y: gy,
          duration: 1.85,
          ease: 'power3.out',
        },
        0.55,
      )
      // Upward swirling dust & golden embers
      .to(
        emberState,
        {
          progress: 1,
          duration: 2.25,
          ease: 'power1.out',
          onUpdate: () => {
            const attr = emberGeo.getAttribute('position') as THREE.BufferAttribute;
            const p = emberState.progress;
            for (let i = 0; i < emberCount; i += 1) {
              const speed = 0.8 + (i % 5) * 0.35;
              const swirl = p * 2.2 + i * 0.4;
              emberPos[i * 3] = emberInit[i * 3] + Math.sin(swirl) * 0.16 * p;
              emberPos[i * 3 + 1] = emberInit[i * 3 + 1] + p * 2.1 * speed;
              emberPos[i * 3 + 2] = emberInit[i * 3 + 2] + Math.cos(swirl) * 0.16 * p;
            }
            attr.needsUpdate = true;
          },
        },
        0.4,
      )
      // Cool down glow & reveal final engraved stone plaque cleanly
      .to(stoneMat, { emissiveIntensity: 0, duration: 0.6, ease: 'sine.inOut' }, 2.25)
      .to(ringMat, { opacity: 0, duration: 0.55 }, 2.25)
      .to(emberMat, { opacity: 0, duration: 0.55 }, 2.25)
      .to(glow, { intensity: 0, duration: 0.55 }, 2.25);
  }

  public skip(grave: Grave, onComplete: () => void): void {
    this.stop();
    this.graveMgr.setAnimatingGraveId(null);
    this.cameraCtrl.flyToGrave(grave, () => {
      this.graveMgr.updateNearbyPlaques(this.cameraCtrl.camera.position);
      onComplete();
    });
  }

  public stop(): void {
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
    this.graveMgr.setAnimatingGraveId(null);
    this.cleanupTempObjects();
  }

  private cleanupTempObjects(): void {
    if (this.risingGroup) {
      this.scene.remove(this.risingGroup);
      this.risingGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
        }
      });
      this.risingGroup = null;
    }
    if (this.risingStoneMat) {
      this.risingStoneMat.dispose();
      this.risingStoneMat = null;
    }
    if (this.ritualRing) {
      this.scene.remove(this.ritualRing);
      this.ritualRing.geometry.dispose();
      (this.ritualRing.material as THREE.Material).dispose();
      this.ritualRing = null;
    }
    if (this.embers) {
      this.scene.remove(this.embers);
      this.embers.geometry.dispose();
      (this.embers.material as THREE.Material).dispose();
      this.embers = null;
    }
    if (this.glowLight) {
      this.scene.remove(this.glowLight);
      this.glowLight = null;
    }
  }
}
