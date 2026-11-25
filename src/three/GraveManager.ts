import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Grave, GraveStyle } from '../types/grave';
import type { AssetLoader } from './AssetLoader';
import { InscriptionTextureCache } from './InscriptionTexture';
import { getTerrainHeight } from './terrain';
import { createTombstoneGeometries, type TombstoneGeometries } from './Tombstone';

interface PlaqueSlot {
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
}

function createRoseGeometries(): { stemGeo: THREE.BufferGeometry; bloomGeo: THREE.BufferGeometry } {
  const toFlat = (g: THREE.BufferGeometry) => {
    const out = g.index ? g.toNonIndexed() : g;
    if (out !== g) g.dispose();
    return out;
  };

  const stemPart = toFlat(new THREE.CylinderGeometry(0.012, 0.015, 0.29, 6));
  stemPart.translate(0, 0.145, 0);

  const calyx = toFlat(new THREE.ConeGeometry(0.04, 0.055, 6));
  calyx.rotateX(Math.PI);
  calyx.translate(0, 0.28, 0);

  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.04, 0.032, 0, 0.095);
  leafShape.quadraticCurveTo(-0.04, 0.032, 0, 0);
  const leafL = toFlat(new THREE.ShapeGeometry(leafShape, 2));
  leafL.rotateX(-0.75);
  leafL.rotateZ(0.68);
  leafL.translate(-0.014, 0.14, 0.012);

  const leafR = toFlat(new THREE.ShapeGeometry(leafShape, 2));
  leafR.rotateX(-0.75);
  leafR.rotateZ(-0.68);
  leafR.translate(0.014, 0.18, -0.012);

  const stemGeo = mergeGeometries([stemPart, calyx, leafL, leafR], false);
  stemPart.dispose();
  calyx.dispose();
  leafL.dispose();
  leafR.dispose();

  // Multi-layered rose bloom: outer cupped petals + inner spiral rose bud (vividly sized)
  const bloomParts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    const petal = toFlat(new THREE.SphereGeometry(0.054, 7, 5));
    petal.scale(1.18, 0.96, 0.44);
    petal.rotateY(a);
    petal.rotateX(0.38);
    petal.translate(Math.sin(a) * 0.042, 0.315, Math.cos(a) * 0.042);
    bloomParts.push(petal);
  }
  const innerBud = toFlat(new THREE.DodecahedronGeometry(0.048, 0));
  innerBud.scale(1.0, 1.25, 1.0);
  innerBud.translate(0, 0.332, 0);
  bloomParts.push(innerBud);

  const bloomGeo = mergeGeometries(bloomParts, false);
  bloomParts.forEach((p) => p.dispose());
  return { stemGeo, bloomGeo };
}

export class GraveManager {
  private readonly root = new THREE.Group();
  private readonly roseRoot = new THREE.Group();
  private graves: Grave[] = [];
  private hitboxes: THREE.Mesh[] = [];
  private instancedMeshes: THREE.InstancedMesh[] = [];
  private roseMeshes: THREE.InstancedMesh[] = [];
  private plaquePool: PlaqueSlot[] = [];
  private geos: TombstoneGeometries;
  private roseGeos: { stemGeo: THREE.BufferGeometry; bloomGeo: THREE.BufferGeometry };
  private stoneMat: THREE.MeshStandardMaterial;
  private plinthMat: THREE.MeshStandardMaterial;
  private moundMat: THREE.MeshStandardMaterial;
  private roseStemMat: THREE.MeshStandardMaterial;
  private roseBloomMat: THREE.MeshStandardMaterial;
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
    this.scene.add(this.roseRoot);
    this.geos = createTombstoneGeometries();
    this.roseGeos = createRoseGeometries();
    this.plaqueCache = new InscriptionTextureCache(renderer);

    this.roseStemMat = new THREE.MeshStandardMaterial({
      color: 0x2d4e31,
      roughness: 0.78,
      side: THREE.DoubleSide,
    });
    this.roseBloomMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.48,
      metalness: 0.04,
    });
    // Self-illuminate each rose gently in its own red/white instance color so it pops under moonlight
    this.roseBloomMat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         #ifdef USE_INSTANCING_COLOR
           totalEmissiveRadiance += vColor * 0.28;
         #endif`,
      );
    };

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

    this.rebuildRoses();
  }

  private clearRoses(): void {
    for (const im of this.roseMeshes) {
      this.roseRoot.remove(im);
    }
    this.roseMeshes = [];
  }

  private rebuildRoses(): void {
    this.clearRoses();
    // At most ONE visual rose per gravestone even if flower_count > 1
    const withRose = this.graves.filter((g) => (g.flower_count ?? 0) >= 1);
    if (withRose.length === 0) return;

    const stems = new THREE.InstancedMesh(this.roseGeos.stemGeo, this.roseStemMat, withRose.length);
    const blooms = new THREE.InstancedMesh(this.roseGeos.bloomGeo, this.roseBloomMat, withRose.length);
    stems.castShadow = true;
    blooms.castShadow = true;

    const dummy = new THREE.Object3D();
    const bloomTint = new THREE.Color();

    withRose.forEach((g, idx) => {
      const gy = this.getGroundY(g);
      const scaleVar = g.slot_index >= 38 ? 1.0 : 0.92 + ((g.grave_number * 13) % 16) * 0.01;
      const sin = Math.sin(g.rotation_y);
      const cos = Math.cos(g.rotation_y);

      // Place single rose neatly resting on the front-right edge of the plinth, tilted toward the viewer
      const localX = 0.34 * scaleVar;
      const localZ = 0.28 * scaleVar;
      const wx = g.pos_x + localX * cos + localZ * sin;
      const wz = g.pos_z - localX * sin + localZ * cos;

      dummy.position.set(wx, gy + 0.14 * scaleVar, wz);
      dummy.rotation.set(0.36, g.rotation_y + 0.22, -0.18);
      dummy.scale.setScalar(1.38 * scaleVar);
      dummy.updateMatrix();
      stems.setMatrixAt(idx, dummy.matrix);
      blooms.setMatrixAt(idx, dummy.matrix);

      const isRed = g.flower_color === 'red';
      bloomTint.setHex(isRed ? 0xe0283b : 0xfaf6ee);
      blooms.setColorAt(idx, bloomTint);
    });

    stems.instanceMatrix.needsUpdate = true;
    blooms.instanceMatrix.needsUpdate = true;
    if (blooms.instanceColor) blooms.instanceColor.needsUpdate = true;

    this.roseRoot.add(stems, blooms);
    this.roseMeshes.push(stems, blooms);
  }

  public updateGraveFlower(updated: Grave): void {
    const idx = this.graves.findIndex((g) => g.id === updated.id);
    if (idx !== -1) {
      this.graves[idx] = updated;
    }
    const hb = this.hitboxes.find((h) => (h.userData?.grave as Grave | undefined)?.id === updated.id);
    if (hb) {
      hb.userData.grave = updated;
    }
    this.rebuildRoses();
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
    this.clearRoses();
    this.plaqueCache.dispose();
    Object.values(this.geos.lod0).forEach((g) => g.dispose());
    Object.values(this.geos.lod1).forEach((g) => g.dispose());
    this.geos.plinth.dispose();
    this.geos.mound.dispose();
    this.roseGeos.stemGeo.dispose();
    this.roseGeos.bloomGeo.dispose();
    this.stoneMat.dispose();
    this.plinthMat.dispose();
    this.moundMat.dispose();
    this.roseStemMat.dispose();
    this.roseBloomMat.dispose();
    this.plaquePool.forEach((slot) => {
      slot.mesh.geometry.dispose();
      slot.mat.dispose();
    });
  }
}
