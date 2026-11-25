import * as THREE from 'three';
import type { Grave } from '../types/grave';
import type { CameraController } from './CameraController';
import type { Environment } from './Environment';
import type { GraveManager } from './GraveManager';
import type { SignBoard } from './SignBoard';

export interface MobileControlsCallbacks {
  onSelectGrave: (grave: Grave) => void;
  onOpenBurySign: () => void;
  onOpenAbout: () => void;
  onUserMoved: () => void;
}

export class MobileControls {
  private touchId: number | null = null;
  private startX = 0;
  private startY = 0;
  private lastX = 0;
  private lastY = 0;
  private moved = false;
  private joyX = 0;
  private joyY = 0;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();

  constructor(
    private domElement: HTMLElement,
    private cameraCtrl: CameraController,
    private graveManager: GraveManager,
    private signBoard: SignBoard,
    private env: Environment,
    private callbacks: MobileControlsCallbacks,
  ) {
    this.domElement.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    this.domElement.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.domElement.addEventListener('touchend', this.handleTouchEnd, { passive: true });
  }

  public setJoystickVector(dx: number, dy: number): void {
    if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
      this.callbacks.onUserMoved();
    }
    this.joyX = dx;
    this.joyY = dy;
  }

  private handleTouchStart = (e: TouchEvent) => {
    if (this.touchId !== null || e.changedTouches.length === 0) return;
    const t = e.changedTouches[0];
    this.touchId = t.identifier;
    this.startX = t.clientX;
    this.startY = t.clientY;
    this.lastX = t.clientX;
    this.lastY = t.clientY;
    this.moved = false;
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (this.touchId === null) return;
    const t = Array.from(e.changedTouches).find((item) => item.identifier === this.touchId);
    if (!t) return;
    e.preventDefault();

    const dx = t.clientX - this.lastX;
    const dy = t.clientY - this.lastY;
    if (Math.hypot(t.clientX - this.startX, t.clientY - this.startY) > 8) {
      this.moved = true;
      this.callbacks.onUserMoved();
    }
    this.lastX = t.clientX;
    this.lastY = t.clientY;
    this.cameraCtrl.lookBy(-dx * 0.0042, -dy * 0.0034);
  };

  private handleTouchEnd = (e: TouchEvent) => {
    if (this.touchId === null) return;
    const t = Array.from(e.changedTouches).find((item) => item.identifier === this.touchId);
    if (!t) return;
    this.touchId = null;

    if (this.moved) return;

    const rect = this.domElement.getBoundingClientRect();
    this.pointer.x = ((t.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((t.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.cameraCtrl.camera);
    const hits = this.raycaster.intersectObjects(
      [this.signBoard.hitMesh, this.env.doorHitMesh, ...this.graveManager.getHitboxes()],
      false,
    );
    if (hits.length === 0) return;

    const hitObj = hits[0].object;
    if (hitObj.userData?.isBurySign) {
      this.callbacks.onOpenBurySign();
      return;
    }
    if (hitObj.userData?.isAboutDoor) {
      this.callbacks.onOpenAbout();
      return;
    }
    const grave = hitObj.userData?.grave as Grave | undefined;
    if (grave) {
      this.callbacks.onSelectGrave(grave);
    }
  };

  public update(dt: number): void {
    if (Math.abs(this.joyX) < 0.05 && Math.abs(this.joyY) < 0.05) return;
    const speed = 5.8 * dt;
    this.cameraCtrl.moveLocal(-this.joyY * speed, this.joyX * speed);
  }

  public dispose(): void {
    this.domElement.removeEventListener('touchstart', this.handleTouchStart);
    this.domElement.removeEventListener('touchmove', this.handleTouchMove);
    this.domElement.removeEventListener('touchend', this.handleTouchEnd);
  }
}
