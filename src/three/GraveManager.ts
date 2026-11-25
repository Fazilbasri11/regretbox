import * as THREE from 'three';
import type { Grave, GraveStyle } from '../types/grave';
import type { AssetLoader } from './AssetLoader';

interface PlaqueSlot {
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
}

export class GraveManager {
  private readonly root = new THREE.Group();
  private graves: Grave[] = [];
  private hitboxes: THREE.Mesh[] = [];
  private instancedBodies: THREE.InstancedMesh[] = [];
  private instancedBases: THREE.InstancedMesh | null = null;
  private plaquePool: PlaqueSlot[] = [];
  private highlightRing: THREE.Mesh;
  private highlightLight: THREE.PointLight;
  private selectedGraveId: string | null = null;
  private stoneMat: THREE.MeshStandardMaterial;
  private baseMat: THREE.MeshStandardMaterial;

  constructor(
    private scene: THREE.Scene,
    private assets: AssetLoader,
  ) {
    this.scene.add(this.root);

    this.stoneMat = new THREE.MeshStandardMaterial({
      map: assets.stoneTexture,
      color: 0x808792,
      roughness: 0.88,
      metalness: 0.06,
    });

    this.baseMat = new THREE.MeshStandardMaterial({
      color: 0x3b4048,
      roughness: 0.95,
    });

    // Selection glow ring + lantern highlight
    this.highlightRing = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1.18, 28),
      new THREE.MeshBasicMaterial({
        color: 0xe09f3e,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      }),
    );
    this.highlightRing.rotation.x = -Math.PI / 2;
    this.highlightRing.visible = false;
    this.scene.add(this.highlightRing);

    this.highlightLight = new THREE.PointLight(0xffb54d, 1.8, 7, 1.6);
    this.highlightLight.visible = false;
    this.scene.add(this.highlightLight);

    // Pre-allocate 28 LOD plaque meshes for nearby gravestones
    const plaqueGeo = new THREE.PlaneGeometry(1.02, 1.24);
    for (let i = 0; i < 28; i += 1) {
      const mat = new THREE.MeshStandardMaterial({
        roughness: 0.84,
        metalness: 0.04,
      });
      const mesh = new THREE.Mesh(plaqueGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.plaquePool.push({ mesh, mat });
    }
  }

  public setGraves(graves: Grave[]): void {
    this.graves = graves;
    this.rebuildInstances();
    this.updateNearbyPlaques(new THREE.Vector3(0, 2.35, 9.5));
  }

  private clearInstances(): void {
    for (const im of this.instancedBodies) {
      this.root.remove(im);
      im.geometry.dispose();
    }
    this.instancedBodies = [];

    if (this.instancedBases) {
      this.root.remove(this.instancedBases);
      this.instancedBases.geometry.dispose();
      this.instancedBases = null;
    }

    for (const hb of this.hitboxes) {
      this.root.remove(hb);
      hb.geometry.dispose();
      (hb.material as THREE.Material).dispose();
    }
    this.hitboxes = [];
  }

  private createStyleGeometry(style: GraveStyle): THREE.BufferGeometry {
    switch (style) {
      case 'obelisk':
        return new THREE.CylinderGeometry(0.18, 0.44, 2.3, 4);
      case 'slab':
        return new THREE.BoxGeometry(1.25, 0.36, 1.8);
      case 'cross_arch':
        return new THREE.BoxGeometry(1.1, 1.85, 0.34);
      case 'mossy_stone':
        return new THREE.DodecahedronGeometry(0.88, 0);
      case 'classic':
      default:
        return new THREE.BoxGeometry(1.2, 1.68, 0.34);
    }
  }

  private rebuildInstances(): void {
    this.clearInstances();
    if (this.graves.length === 0) return;

    const dummy = new THREE.Object3D();

    // Shared bases via InstancedMesh
    const baseGeo = new THREE.BoxGeometry(1.52, 0.26, 0.85);
    const bases = new THREE.InstancedMesh(baseGeo, this.baseMat, this.graves.length);
    bases.receiveShadow = true;
    bases.castShadow = true;

    this.graves.forEach((g, idx) => {
      dummy.position.set(g.pos_x, 0.13, g.pos_z);
      dummy.rotation.set(0, g.rotation_y, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      bases.setMatrixAt(idx, dummy.matrix);

      // Raycast hitbox
      const hb = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 2.2, 1.1),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      hb.position.set(g.pos_x, 1.05, g.pos_z);
      hb.rotation.y = g.rotation_y;
      hb.userData = { grave: g };
      this.root.add(hb);
      this.hitboxes.push(hb);
    });
    bases.instanceMatrix.needsUpdate = true;
    this.root.add(bases);
    this.instancedBases = bases;

    // Group stones by style using InstancedMesh
    const grouped = new Map<GraveStyle, Grave[]>();
    for (const g of this.graves) {
      const list = grouped.get(g.grave_style) || [];
      list.push(g);
      grouped.set(g.grave_style, list);
    }

    for (const [style, items] of grouped.entries()) {
      const geo = this.createStyleGeometry(style);
      const mesh = new THREE.InstancedMesh(geo, this.stoneMat, items.length);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      items.forEach((g, idx) => {
        const yCenter =
          style === 'obelisk'
            ? 1.25
            : style === 'slab'
              ? 0.36
              : style === 'mossy_stone'
                ? 0.9
                : 1.04;
        dummy.position.set(g.pos_x, yCenter, g.pos_z);
        dummy.rotation.set(0, g.rotation_y, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      this.root.add(mesh);
      this.instancedBodies.push(mesh);
    }
  }

  /**
   * LOD Plaque updater: renders crisp engraved text plaques on the nearest 28 gravestones.
   */
  public updateNearbyPlaques(cameraPos: THREE.Vector3): void {
    const sorted = this.graves
      .map((g) => {
        const dx = g.pos_x - cameraPos.x;
        const dz = g.pos_z - cameraPos.z;
        return { grave: g, distSq: dx * dx + dz * dz };
      })
      .filter((entry) => entry.distSq <= 42 * 42)
      .sort((a, b) => a.distSq - b.distSq)
      .slice(0, this.plaquePool.length);

    this.plaquePool.forEach((slot, idx) => {
      const item = sorted[idx];
      if (!item) {
        slot.mesh.visible = false;
        return;
      }

      const g = item.grave;
      const tex = this.assets.getPlaqueTexture(g);
      if (slot.mat.map !== tex) {
        slot.mat.map = tex;
        slot.mat.needsUpdate = true;
      }

      const forwardOffset = g.grave_style === 'slab' ? 0.0 : 0.24;
      const yOffset = g.grave_style === 'slab' ? 0.56 : 1.08;
      const sin = Math.sin(g.rotation_y);
      const cos = Math.cos(g.rotation_y);

      slot.mesh.position.set(g.pos_x + sin * forwardOffset, yOffset, g.pos_z + cos * forwardOffset);
      if (g.grave_style === 'slab') {
        slot.mesh.rotation.set(-Math.PI / 2 + 0.12, g.rotation_y, 0);
      } else {
        slot.mesh.rotation.set(0, g.rotation_y, 0);
      }
      slot.mesh.visible = true;
    });
  }

  public setSelectedGrave(grave: Grave | null): void {
    this.selectedGraveId = grave?.id || null;
    if (!grave) {
      this.highlightRing.visible = false;
      this.highlightLight.visible = false;
      return;
    }

    this.highlightRing.position.set(grave.pos_x, 0.06, grave.pos_z);
    this.highlightRing.visible = true;

    this.highlightLight.position.set(grave.pos_x, 1.5, grave.pos_z + 1.1);
    this.highlightLight.visible = true;
  }

  public getSelectedGraveId(): string | null {
    return this.selectedGraveId;
  }

  public getHitboxes(): THREE.Object3D[] {
    return this.hitboxes;
  }

  public findClosestGraveInView(camera: THREE.Camera, maxDistance = 12): Grave | null {
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    let best: Grave | null = null;
    let bestScore = Infinity;

    for (const g of this.graves) {
      const toGrave = new THREE.Vector3(g.pos_x - camera.position.x, 0, g.pos_z - camera.position.z);
      const dist = toGrave.length();
      if (dist > maxDistance) continue;
      toGrave.normalize();
      const dot = camDir.dot(toGrave);
      if (dot < 0.45) continue;
      const score = dist * (1.5 - dot);
      if (score < bestScore) {
        bestScore = score;
        best = g;
      }
    }
    return best;
  }

  public dispose(): void {
    this.clearInstances();
    this.stoneMat.dispose();
    this.baseMat.dispose();
    this.highlightRing.geometry.dispose();
    (this.highlightRing.material as THREE.Material).dispose();
    this.plaquePool.forEach((slot) => {
      slot.mesh.geometry.dispose();
      slot.mat.dispose();
    });
  }
}
