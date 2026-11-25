import gsap from 'gsap';
import * as THREE from 'three';
import type { Grave } from '../types/grave';

export class CameraController {
  public yaw = 0;
  public pitch = -0.07;
  private isFlying = false;
  private activeTween: gsap.core.Tween | null = null;
  private homePos = new THREE.Vector3(0.45, 1.5, 4.65);
  private homeYaw = 0.04;
  private homePitch = -0.07;
  private baseDesktopFov = 46;

  constructor(public readonly camera: THREE.PerspectiveCamera) {
    this.updateResponsiveFov();
    this.applyRotation();
  }

  public updateResponsiveFov(): void {
    const aspect = this.camera.aspect || window.innerWidth / Math.max(1, window.innerHeight);
    if (aspect < 1) {
      // Portrait mobile: keep horizontal FOV >= 70° so hero stone + gate stay in frame
      const minHorizRad = THREE.MathUtils.degToRad(72);
      const vFovRad = 2 * Math.atan(Math.tan(minHorizRad / 2) / aspect);
      this.camera.fov = Math.min(82, Math.max(54, THREE.MathUtils.radToDeg(vFovRad)));
    } else {
      this.camera.fov = this.baseDesktopFov;
    }
    this.camera.updateProjectionMatrix();
  }

  /**
   * Computes initial camera vantage relative to the newest (frontier) grave
   * so the newest gravestone sits at the hero position (x ≈ 42%, base y ≈ 82%).
   */
  public configureHomeRelativeToHero(heroGrave: Grave | null): void {
    const hx = heroGrave ? heroGrave.pos_x : -0.62;
    const hz = heroGrave ? heroGrave.pos_z : 1.35;
    const isPortrait = (window.innerWidth / Math.max(1, window.innerHeight)) < 1;

    this.homePos.set(hx + (isPortrait ? 0.55 : 0.85), isPortrait ? 1.65 : 1.52, hz + (isPortrait ? 4.15 : 3.55));
    this.homeYaw = isPortrait ? 0.04 : 0.05;
    this.homePitch = -0.065;
  }

  public playIntroDolly(reducedMotion: boolean, onDone?: () => void): void {
    this.stopFlight();
    this.updateResponsiveFov();

    if (reducedMotion) {
      this.camera.position.copy(this.homePos);
      this.yaw = this.homeYaw;
      this.pitch = this.homePitch;
      this.applyRotation();
      onDone?.();
      return;
    }

    // Start 2.4m back and glide smoothly in over 2.8s
    this.camera.position.set(this.homePos.x + 0.15, this.homePos.y + 0.25, this.homePos.z + 2.4);
    this.yaw = this.homeYaw;
    this.pitch = this.homePitch - 0.02;
    this.applyRotation();

    this.isFlying = true;
    const state = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
      pitch: this.pitch,
    };

    this.activeTween = gsap.to(state, {
      x: this.homePos.x,
      y: this.homePos.y,
      z: this.homePos.z,
      pitch: this.homePitch,
      duration: 2.8,
      ease: 'power2.out',
      onUpdate: () => {
        this.camera.position.set(state.x, state.y, state.z);
        this.pitch = state.pitch;
        this.applyRotation();
      },
      onComplete: () => {
        this.isFlying = false;
        onDone?.();
      },
    });
  }

  public skipIntro(): void {
    if (!this.isFlying) return;
    this.stopFlight();
    this.camera.position.copy(this.homePos);
    this.yaw = this.homeYaw;
    this.pitch = this.homePitch;
    this.applyRotation();
  }

  public applyRotation(): void {
    this.pitch = Math.max(-0.55, Math.min(0.6, this.pitch));
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  public lookBy(deltaYaw: number, deltaPitch: number): void {
    if (this.isFlying) this.skipIntro();
    this.yaw += deltaYaw;
    this.pitch += deltaPitch;
    this.applyRotation();
  }

  public moveLocal(forwardAmount: number, rightAmount: number): void {
    if (this.isFlying) this.skipIntro();
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    this.camera.position.addScaledVector(forward, forwardAmount);
    this.camera.position.addScaledVector(right, rightAmount);
    this.clampPosition();
  }

  public clampPosition(): void {
    this.camera.position.y = Math.max(1.1, Math.min(9.5, this.camera.position.y));
    this.camera.position.x = Math.max(-28, Math.min(28, this.camera.position.x));
    this.camera.position.z = Math.max(-48, Math.min(this.homePos.z + 14, this.camera.position.z));

    // Guard chapel walls
    if (
      this.camera.position.x > 8.2 &&
      this.camera.position.x < 17 &&
      this.camera.position.z > -30 &&
      this.camera.position.z < -19
    ) {
      this.camera.position.x = 8.2;
    }
  }

  public flyToGrave(grave: Grave, onComplete?: () => void): void {
    this.stopFlight();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sin = Math.sin(grave.rotation_y);
    const cos = Math.cos(grave.rotation_y);

    // 1.8m in front of gravestone, eye height 1.1m, FOV narrowed to 38°
    const targetPos = new THREE.Vector3(grave.pos_x + sin * 2.05, 1.12, grave.pos_z + cos * 2.05);
    const lookAt = new THREE.Vector3(grave.pos_x, 0.85, grave.pos_z);
    const temp = this.camera.clone();
    temp.position.copy(targetPos);
    temp.lookAt(lookAt);
    const targetEuler = new THREE.Euler().setFromQuaternion(temp.quaternion, 'YXZ');

    if (reduced) {
      this.camera.position.copy(targetPos);
      this.yaw = targetEuler.y;
      this.pitch = targetEuler.x;
      this.camera.fov = 38;
      this.camera.updateProjectionMatrix();
      this.applyRotation();
      onComplete?.();
      return;
    }

    let deltaYaw = targetEuler.y - this.yaw;
    while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
    while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;

    this.isFlying = true;
    const state = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
      yaw: this.yaw,
      pitch: this.pitch,
      fov: this.camera.fov,
    };

    this.activeTween = gsap.to(state, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      yaw: this.yaw + deltaYaw,
      pitch: targetEuler.x,
      fov: 38,
      duration: 1.25,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.camera.position.set(state.x, state.y, state.z);
        this.yaw = state.yaw;
        this.pitch = state.pitch;
        this.camera.fov = state.fov;
        this.camera.updateProjectionMatrix();
        this.applyRotation();
      },
      onComplete: () => {
        this.isFlying = false;
        onComplete?.();
      },
    });
  }

  public resetView(): void {
    this.stopFlight();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.updateResponsiveFov();
    const targetFov = this.camera.fov;

    if (reduced) {
      this.camera.position.copy(this.homePos);
      this.yaw = this.homeYaw;
      this.pitch = this.homePitch;
      this.applyRotation();
      return;
    }

    let deltaYaw = this.homeYaw - this.yaw;
    while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
    while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;

    this.isFlying = true;
    const state = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
      yaw: this.yaw,
      pitch: this.pitch,
      fov: this.camera.fov,
    };

    this.activeTween = gsap.to(state, {
      x: this.homePos.x,
      y: this.homePos.y,
      z: this.homePos.z,
      yaw: this.yaw + deltaYaw,
      pitch: this.homePitch,
      fov: targetFov,
      duration: 1.0,
      ease: 'power2.out',
      onUpdate: () => {
        this.camera.position.set(state.x, state.y, state.z);
        this.yaw = state.yaw;
        this.pitch = state.pitch;
        this.camera.fov = state.fov;
        this.camera.updateProjectionMatrix();
        this.applyRotation();
      },
      onComplete: () => {
        this.isFlying = false;
      },
    });
  }

  public stopFlight(): void {
    if (this.activeTween) {
      this.activeTween.kill();
      this.activeTween = null;
    }
    this.isFlying = false;
  }
}
