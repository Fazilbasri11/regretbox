import * as THREE from 'three';
import type { Grave, GraveStyle } from '../types/grave';
import type { AssetLoader } from './AssetLoader';
import { InscriptionTextureCache } from './InscriptionTexture';
import { getTerrainHeight } from './terrain';
import { createTombstoneGeometries, type TombstoneGeometries } from './Tombstone';

interface PlaqueSlot {
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
}

export class GraveManager {
  private readonly root = new THREE.Group();
  private graves: Grave[] = [];
  private hitboxes: THREE.Mesh[] = [];
  private instancedMeshes: THREE.InstancedMesh[] = [];
  private plaquePool: PlaqueSlot[] = [];
  private geos: TombstoneGeometries;
  private stoneMat: THREE.MeshStandardMaterial;
  private plinthMat: THREE.MeshStandardMaterial;
  private moundMat: THREE.MeshStandardMaterial;
  private plaqueCache: InscriptionTextureCache;
  private selectedGraveId: string | null = null;
  private highlightRing: THREE.Mesh;
  private highlightLight: THREE.PointLight;

  constructor(
    private scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    assets: AssetLoader,
  ) {
    this.scene.add(this.root);
    this.geos = createTombstoneGeometries();
    this.plaqueCache = new InscriptionTextureCache(renderer);

    this.stoneMat = new THREE.MeshStandardMaterial({
      map: assets.stonePBR.map,
      normalMap: assets.stonePBR.normalMap,
      roughnessMap: assets.stonePBR.roughnessMap,
      color: 0xc8cdd6,
      roughness: 0.85,
      metalness: 0.04,
      envMap: assets.envMap,
      envMapIntensity: 0.72,
    });

    this.plinthMat = new THREE.MeshStandardMaterial({
      map: assets.stonePBR.map,
      normalMap: assets.stonePBR.normalMap,
      color: 0x828894,
      roughness: 0.9,
    });

    this.moundMat = new THREE.MeshStandardMaterial({
      color: 0x1e241c,
      roughness: 0.96,
    });

    this.highlightRing = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1.12, 28),
      new THREE.MeshBasicMaterial({
        color: 0xffb45a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
      }),
    );
    this.highlightRing.rotation.x = -Math.PI / 2;
    this.highlightRing.visible = false;
    this.scene.add(this.highlightRing);

    this.highlightLight = new THREE.PointLight('#FFB45A', 1.6, 5.5, 2);
    this.highlightLight.visible = false;
    this.scene.add(this.highlightLight);

    const plaqueGeo = new THREE.PlaneGeometry(0.84, 1.05);
    for (let i = 0; i < 20; i += 1) {
      const mat = new THREE.MeshStandardMaterial({
        normalMap: assets.stonePBR.normalMap,
        normalScale: new THREE.Vector2(0.35, 0.35),
        roughness: 0.84,
        metalness: 0.04,
        envMap: assets.envMap,
        envMapIntensity: 0.45,
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
  }

  private getGroundY(g: Grave): number {
    return typeof g.pos_y === 'number' && g.pos_y !== 0
      ? g.pos_y
      : getTerrainHeight(g.pos_x, g.pos_z);
  }

  private resolveStyle(style: string): GraveStyle {
    if (style === 'slim' || style === 'pillar' || style === 'scroll') return style;
    if (style === 'cross') return 'pillar';
    return 'arched';
  }

  private clearInstances(): void {
    for (const im of this.instancedMeshes) {
      this.root.remove(im);
    }
    this.instancedMeshes = [];

    for (const hb of this.hitboxes) {
      this.root.remove(hb);
      hb.geometry.dispose();
      (hb.material as THREE.Material).dispose();
    }
    this.hitboxes = [];
  }

  private rebuildInstances(): void {
    this.clearInstances();
    if (this.graves.length === 0) return;

    const dummy = new THREE.Object3D();
    const tintColor = new THREE.Color();

    const plinths = new THREE.InstancedMesh(this.geos.plinth, this.plinthMat, this.graves.length);
    const mounds = new THREE.InstancedMesh(this.geos.mound, this.moundMat, this.graves.length);
    plinths.receiveShadow = true;
    plinths.castShadow = true;
    mounds.receiveShadow = true;

    this.graves.forEach((g, idx) => {
      const gy = this.getGroundY(g);
      const scaleVar = g.slot_index >= 38 ? 1.0 : 0.92 + ((g.grave_number * 13) % 16) * 0.01;
      const tiltZ = g.slot_index >= 38 ? 0 : (((g.grave_number % 7) - 3) * 0.012);

      dummy.position.set(g.pos_x, gy, g.pos_z);
      dummy.rotation.set(0, g.rotation_y, tiltZ);
      dummy.scale.set(scaleVar, scaleVar, scaleVar);
      dummy.updateMatrix();
      plinths.setMatrixAt(idx, dummy.matrix);
      mounds.setMatrixAt(idx, dummy.matrix);

      const hb = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 1.9, 0.9),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      hb.position.set(g.pos_x, gy + 0.95, g.pos_z);
      hb.rotation.y = g.rotation_y;
      hb.userData = { grave: g };
      this.root.add(hb);
      this.hitboxes.push(hb);
    });

    plinths.instanceMatrix.needsUpdate = true;
    mounds.instanceMatrix.needsUpdate = true;
    this.root.add(plinths, mounds);
    this.instancedMeshes.push(plinths, mounds);

    const styles: GraveStyle[] = ['arched', 'slim', 'pillar', 'scroll'];
    for (const style of styles) {
      const nearItems = this.graves.filter(
        (g) => this.resolveStyle(g.grave_style) === style && g.slot_index >= 29,
      );
      const farItems = this.graves.filter(
        (g) => this.resolveStyle(g.grave_style) === style && g.slot_index < 29,
      );

      for (const [items, geo] of [
        [nearItems, this.geos.lod0[style]],
        [farItems, this.geos.lod1[style]],
      ] as Array<[Grave[], THREE.BufferGeometry]>) {
        if (items.length === 0) continue;
        const mesh = new THREE.InstancedMesh(geo, this.stoneMat, items.length);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        items.forEach((g, idx) => {
          const gy = this.getGroundY(g);
          const scaleVar = g.slot_index >= 38 ? 1.0 : 0.92 + ((g.grave_number * 13) % 16) * 0.01;
          const tiltZ = g.slot_index >= 38 ? 0 : (((g.grave_number % 7) - 3) * 0.012);

          dummy.position.set(g.pos_x, gy + 0.14, g.pos_z);
          dummy.rotation.set(0, g.rotation_y, tiltZ);
          dummy.scale.set(scaleVar, scaleVar, scaleVar);
          dummy.updateMatrix();
          mesh.setMatrixAt(idx, dummy.matrix);

          const tint = 0.94 + ((g.grave_number * 17) % 13) * 0.01;
          tintColor.setRGB(tint, tint * 0.99, tint * 0.97);
          mesh.setColorAt(idx, tintColor);
        });

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        this.root.add(mesh);
        this.instancedMeshes.push(mesh);
      }
    }
  }

  public updateNearbyPlaques(cameraPos: THREE.Vector3): void {
    const sorted = this.graves
      .map((g) => {
        const dx = g.pos_x - cameraPos.x;
        const dz = g.pos_z - cameraPos.z;
        return { grave: g, distSq: dx * dx + dz * dz };
      })
      .filter((entry) => entry.distSq <= 26 * 26 || entry.grave.id === this.selectedGraveId)
      .sort((a, b) => a.distSq - b.distSq)
      .slice(0, this.plaquePool.length);

    this.plaquePool.forEach((slot, idx) => {
      const entry = sorted[idx];
      if (!entry) {
        slot.mesh.visible = false;
        return;
      }

      const g = entry.grave;
      const isSelected = g.id === this.selectedGraveId;
      const isForeground = g.slot_index >= 38;
      const resolution = isSelected || isForeground ? 1024 : 512;
      const colorMap = this.plaqueCache.get(g, resolution);

      if (slot.mat.map !== colorMap) {
        slot.mat.map = colorMap;
        slot.mat.needsUpdate = true;
      }

      const gy = this.getGroundY(g);
      const scaleVar = g.slot_index >= 38 ? 1.0 : 0.92 + ((g.grave_number * 13) % 16) * 0.01;
      const tiltZ = g.slot_index >= 38 ? 0 : (((g.grave_number % 7) - 3) * 0.012);
      const forwardOffset = 0.192 * scaleVar;
      const sin = Math.sin(g.rotation_y);
      const cos = Math.cos(g.rotation_y);

      slot.mesh.position.set(
        g.pos_x + sin * forwardOffset,
        gy + 0.14 + 0.66 * scaleVar,
        g.pos_z + cos * forwardOffset,
      );
      slot.mesh.rotation.set(0, g.rotation_y, tiltZ);
      slot.mesh.scale.setScalar(scaleVar);
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

    const gy = this.getGroundY(grave);
    this.highlightRing.position.set(grave.pos_x, gy + 0.05, grave.pos_z);
    this.highlightRing.visible = true;
    this.highlightLight.position.set(grave.pos_x, gy + 1.1, grave.pos_z + 0.9);
    this.highlightLight.visible = true;
  }

  public getHitboxes(): THREE.Object3D[] {
    return this.hitboxes;
  }

  public findClosestGraveInView(camera: THREE.Camera, maxDistance = 14): Grave | null {
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

  public update(elapsedSec: number, reducedMotion: boolean): void {
    if (!this.highlightRing.visible || reducedMotion) return;
    const pulse = 1 + Math.sin(elapsedSec * 2.6) * 0.05;
    this.highlightRing.scale.setScalar(pulse);
    (this.highlightRing.material as THREE.MeshBasicMaterial).opacity =
      0.55 + Math.sin(elapsedSec * 2.6) * 0.18;
    this.highlightLight.intensity = 1.45 + Math.sin(elapsedSec * 3.8) * 0.25;
  }

  public dispose(): void {
    this.clearInstances();
    this.plaqueCache.dispose();
    Object.values(this.geos.lod0).forEach((g) => g.dispose());
    Object.values(this.geos.lod1).forEach((g) => g.dispose());
    this.geos.plinth.dispose();
    this.geos.mound.dispose();
    this.stoneMat.dispose();
    this.plinthMat.dispose();
    this.moundMat.dispose();
    this.plaquePool.forEach((slot) => {
      slot.mesh.geometry.dispose();
      slot.mat.dispose();
    });
  }
}
