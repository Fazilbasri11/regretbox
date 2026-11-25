import gsap from 'gsap';
import * as THREE from 'three';
import type { Grave } from '../types/grave';

export class CameraController {
  public yaw = 0;
  public pitch = -0.06;
  private isFlying = false;
  private activeTween: gsap.core.Tween | null = null;

  constructor(public readonly camera: THREE.PerspectiveCamera) {
    this.applyRotation();
  }

  public applyRotation(): void {
    this.pitch = Math.max(-0.55, Math.min(0.6, this.pitch));
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  public lookBy(deltaYaw: number, deltaPitch: number): void {
    if (this.isFlying) return;
    this.yaw += deltaYaw;
    this.pitch += deltaPitch;
    this.applyRotation();
  }

  public moveLocal(forwardAmount: number, rightAmount: number): void {
    if (this.isFlying) return;
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    this.camera.position.addScaledVector(forward, forwardAmount);
    this.camera.position.addScaledVector(right, rightAmount);
    this.clampPosition();
  }

  public clampPosition(): void {
    // Keep camera above ground and inside cemetery boundaries
    this.camera.position.y = Math.max(1.55, Math.min(10, this.camera.position.y));
    this.camera.position.x = Math.max(-44, Math.min(44, this.camera.position.x));
    this.camera.position.z = Math.max(-92, Math.min(16, this.camera.position.z));

    // Prevent clipping into Gothic chapel walls (approx [14.5..24.5, -22.5..-10.5])
    if (
      this.camera.position.x > 14.2 &&
      this.camera.position.x < 24.8 &&
      this.camera.position.z > -22.8 &&
      this.camera.position.z < -10.2
    ) {
      this.camera.position.x = 14.2;
    }
  }

  public flyToGrave(grave: Grave, onComplete?: () => void): void {
    this.stopFlight();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Stand politely in front of the gravestone face
    const sin = Math.sin(grave.rotation_y);
    const cos = Math.cos(grave.rotation_y);
    const targetPos = new THREE.Vector3(
      grave.pos_x + sin * 3.4,
      1.85,
      grave.pos_z + cos * 3.4,
    );

    const lookAtTarget = new THREE.Vector3(grave.pos_x, 1.05, grave.pos_z);
    const tempCam = this.camera.clone();
    tempCam.position.copy(targetPos);
    tempCam.lookAt(lookAtTarget);
    const targetEuler = new THREE.Euler().setFromQuaternion(tempCam.quaternion, 'YXZ');

    if (reduced) {
      this.camera.position.copy(targetPos);
      this.yaw = targetEuler.y;
      this.pitch = targetEuler.x;
      this.applyRotation();
      onComplete?.();
      return;
    }

    this.isFlying = true;
    const state = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
      yaw: this.yaw,
      pitch: this.pitch,
    };

    // Shortest angular path for yaw
    let deltaYaw = targetEuler.y - this.yaw;
    while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
    while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;

    this.activeTween = gsap.to(state, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      yaw: this.yaw + deltaYaw,
      pitch: targetEuler.x,
      duration: 1.35,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.camera.position.set(state.x, state.y, state.z);
        this.yaw = state.yaw;
        this.pitch = state.pitch;
        this.applyRotation();
      },
      onComplete: () => {
        this.isFlying = false;
        this.clampPosition();
        onComplete?.();
      },
    });
  }

  public resetView(): void {
    this.stopFlight();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      this.camera.position.set(0, 2.35, 9.5);
      this.yaw = 0;
      this.pitch = -0.06;
      this.applyRotation();
      return;
    }

    this.isFlying = true;
    const state = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
      yaw: this.yaw,
      pitch: this.pitch,
    };

    this.activeTween = gsap.to(state, {
      x: 0,
      y: 2.35,
      z: 9.5,
      yaw: 0,
      pitch: -0.06,
      duration: 1.0,
      ease: 'power2.out',
      onUpdate: () => {
        this.camera.position.set(state.x, state.y, state.z);
        this.yaw = state.yaw;
        this.pitch = state.pitch;
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
