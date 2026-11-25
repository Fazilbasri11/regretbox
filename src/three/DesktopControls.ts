import * as THREE from 'three';
import type { Grave } from '../types/grave';
import type { CameraController } from './CameraController';
import type { GraveManager } from './GraveManager';

export interface DesktopControlsCallbacks {
  onSelectGrave: (grave: Grave) => void;
  onOpenBurySign: () => void;
  onEscape: () => void;
}

export class DesktopControls {
  private keys = new Set<string>();
  private isDragging = false;
  private dragMoved = false;
  private lastX = 0;
  private lastY = 0;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();

  constructor(
    private domElement: HTMLElement,
    private cameraCtrl: CameraController,
    private graveManager: GraveManager,
    private signMesh: THREE.Mesh,
    private callbacks: DesktopControlsCallbacks,
  ) {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.domElement.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    this.domElement.addEventListener('wheel', this.handleWheel, { passive: false });
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.isTypingTarget(e.target)) return;
    if (e.key === 'Escape') {
      this.callbacks.onEscape();
      return;
    }
    this.keys.add(e.key.toLowerCase());
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };

  private handlePointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    this.isDragging = true;
    this.dragMoved = false;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isDragging || e.pointerType === 'touch') return;
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      this.dragMoved = true;
    }
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.cameraCtrl.lookBy(-dx * 0.0032, -dy * 0.0026);
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const wasClick = this.isDragging && !this.dragMoved;
    this.isDragging = false;
    if (!wasClick) return;

    const rect = this.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.cameraCtrl.camera);
    const targets: THREE.Object3D[] = [this.signMesh, ...this.graveManager.getHitboxes()];
    const hits = this.raycaster.intersectObjects(targets, false);
    if (hits.length === 0) return;

    const hitObj = hits[0].object;
    if (hitObj.userData?.isBurySign) {
      this.callbacks.onOpenBurySign();
      return;
    }
    const grave = hitObj.userData?.grave as Grave | undefined;
    if (grave) {
      this.callbacks.onSelectGrave(grave);
    }
  };

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const step = -Math.sign(e.deltaY) * 1.4;
    this.cameraCtrl.moveLocal(step, 0);
  };

  public update(dt: number): void {
    const sprint = this.keys.has('shift') ? 1.8 : 1.0;
    const speed = 7.2 * sprint * dt;
    let forward = 0;
    let right = 0;

    if (this.keys.has('w') || this.keys.has('arrowup')) forward += speed;
    if (this.keys.has('s') || this.keys.has('arrowdown')) forward -= speed;
    if (this.keys.has('d') || this.keys.has('arrowright')) right += speed;
    if (this.keys.has('a') || this.keys.has('arrowleft')) right -= speed;

    if (forward !== 0 || right !== 0) {
      this.cameraCtrl.moveLocal(forward, right);
    }
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    this.domElement.removeEventListener('wheel', this.handleWheel);
  }
}
