import * as THREE from 'three';
import type { AssetLoader } from './AssetLoader';
import { getPathCenterX, getTerrainHeight, PATH_HALF_WIDTH } from './terrain';

function createArrowBoardGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-1.05, 0.0);
  shape.lineTo(-0.62, 0.44);
  shape.lineTo(0.86, 0.44);
  shape.lineTo(0.86, -0.44);
  shape.lineTo(-0.62, -0.44);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -0.04);

  const pos = geo.getAttribute('position');
  const uv = geo.getAttribute('uv');
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    uv.setXY(i, (x + 1.07) / 1.95, (y + 0.46) / 0.92);
  }
  uv.needsUpdate = true;
  return geo;
}

export class SignBoard {
  public readonly group = new THREE.Group();
  public readonly hitMesh: THREE.Mesh;
  private boardMat: THREE.MeshStandardMaterial;
  private hovered = false;

  constructor(scene: THREE.Scene, assets: AssetLoader) {
    scene.add(this.group);

    const postMat = new THREE.MeshStandardMaterial({
      map: assets.woodPBR.map,
      normalMap: assets.woodPBR.normalMap,
      roughnessMap: assets.woodPBR.roughnessMap,
      roughness: 0.9,
    });

    const postGeo = new THREE.CylinderGeometry(0.085, 0.11, 1.35, 8);
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(0.05, 0.66, -0.11);
    post.castShadow = true;
    this.group.add(post);

    this.boardMat = new THREE.MeshStandardMaterial({
      map: assets.signTextMap,
      normalMap: assets.woodPBR.normalMap,
      roughnessMap: assets.woodPBR.roughnessMap,
      emissive: new THREE.Color('#FFB45A'),
      emissiveMap: assets.signEmissiveMap,
      emissiveIntensity: 1.15,
      roughness: 0.85,
    });

    const boardGeo = createArrowBoardGeometry();
    const board = new THREE.Mesh(boardGeo, this.boardMat);
    board.position.set(0, 0.96, 0);
    board.rotation.z = 0.08;
    board.castShadow = true;
    board.userData = { isBurySign: true };
    this.group.add(board);

    this.hitMesh = board;
  }

  public setPositionRelativeToHero(_heroX: number, heroZ: number): void {
    const sz = heroZ - 1.35;
    const sx = getPathCenterX(sz) + PATH_HALF_WIDTH + 0.52;
    const sy = getTerrainHeight(sx, sz);
    this.group.position.set(sx, sy, sz);
    this.group.rotation.y = -0.22;
    this.group.scale.setScalar(0.56);
  }

  public setHovered(hover: boolean): void {
    if (this.hovered === hover) return;
    this.hovered = hover;
    this.boardMat.emissiveIntensity = hover ? 1.55 : 1.15;
    this.hitMesh.scale.setScalar(hover ? 1.03 : 1.0);
  }

  public update(elapsedSec: number, reducedMotion: boolean): void {
    if (reducedMotion || this.hovered) return;
    this.boardMat.emissiveIntensity = 1.12 + Math.sin(elapsedSec * 2.1) * 0.12;
    this.hitMesh.rotation.z = 0.08 + Math.sin(elapsedSec * 1.15) * 0.008;
  }
}
