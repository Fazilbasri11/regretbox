import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { getPathCenterX } from '../../api/_lib/graveGrid';
import type { AssetLoader } from './AssetLoader';
import type { QualityTier } from './PerformanceManager';

function buildPathGeometry(zStart: number, zEnd: number): THREE.BufferGeometry {
  const segments = 56;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const z = zStart + (zEnd - zStart) * t;
    const cx = getPathCenterX(z);
    const halfW = 1.55 + Math.sin(t * Math.PI) * 0.22;

    positions.push(cx - halfW, 0.025, z);
    positions.push(cx + halfW, 0.025, z);
    uvs.push(0, t * 14);
    uvs.push(1, t * 14);

    if (i < segments) {
      const b = i * 2;
      indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildBareTreeBranchGroup(material: THREE.Material): THREE.Group {
  const tree = new THREE.Group();
  const curves: Array<[THREE.Vector3[], number, number]> = [
    [[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.4, 2.2, 0.1), new THREE.Vector3(1.5, 4.2, 0.4)], 0.34, 0.16],
    [[new THREE.Vector3(1.5, 4.2, 0.4), new THREE.Vector3(3.1, 5.2, 0.8), new THREE.Vector3(5.2, 5.6, 1.3)], 0.16, 0.04],
    [[new THREE.Vector3(1.2, 3.6, 0.3), new THREE.Vector3(2.4, 4.6, -0.4), new THREE.Vector3(4.1, 4.4, -0.6)], 0.13, 0.03],
    [[new THREE.Vector3(2.6, 4.9, 0.6), new THREE.Vector3(3.6, 5.9, 0.4), new THREE.Vector3(4.7, 6.2, 0.9)], 0.09, 0.02],
    [[new THREE.Vector3(0.9, 2.9, 0.2), new THREE.Vector3(-0.4, 4.1, 0.5), new THREE.Vector3(-1.4, 5.1, 0.8)], 0.15, 0.04],
  ];

  for (const [pts, rStart, rEnd] of curves) {
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.TubeGeometry(curve, 14, rStart, 7, false);
    const pos = tube.getAttribute('position');
    for (let i = 0; i < pos.count; i += 1) {
      const p = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
      const t = Math.min(1, Math.max(0, (i / pos.count)));
      const scale = (rStart * (1 - t) + rEnd * t) / rStart;
      const center = curve.getPointAt(t);
      p.sub(center).multiplyScalar(scale).add(center);
      pos.setXYZ(i, p.x, p.y, p.z);
    }
    tube.computeVertexNormals();
    const m = new THREE.Mesh(tube, material);
    m.castShadow = true;
    tree.add(m);
  }
  return tree;
}

export class Environment {
  public grassMaterial: THREE.MeshStandardMaterial | null = null;
  private grassUniforms = { uTime: { value: 0 } };

  constructor(scene: THREE.Scene, assets: AssetLoader, tier: QualityTier, maxZ: number) {
    // 1. Ground Terrain with subtle undulation
    const groundGeo = new THREE.PlaneGeometry(150, 160, 48, 48);
    const gPos = groundGeo.getAttribute('position');
    for (let i = 0; i < gPos.count; i += 1) {
      const x = gPos.getX(i);
      const y = gPos.getY(i);
      const bump = Math.sin(x * 0.18) * Math.cos(y * 0.14) * 0.08;
      gPos.setZ(i, bump);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      map: assets.grassMap,
      color: 0x263529,
      roughness: 0.94,
      metalness: 0.02,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -28);
    ground.receiveShadow = true;
    scene.add(ground);

    // 2. Wet Cobblestone Path
    const pathGeo = buildPathGeometry(-54, Math.max(18, maxZ + 18));
    const pathMat = new THREE.MeshStandardMaterial({
      map: assets.cobblePBR.map,
      normalMap: assets.cobblePBR.normalMap,
      roughnessMap: assets.cobblePBR.roughnessMap,
      color: 0x9aa2b2,
      roughness: 0.72,
      metalness: 0.16,
      envMap: assets.envMap,
      envMapIntensity: tier === 'low' ? 0.65 : 1.65,
    });
    const pathMesh = new THREE.Mesh(pathGeo, pathMat);
    pathMesh.receiveShadow = true;
    scene.add(pathMesh);

    // 3. Grand Wrought-Iron Gate + Stone Pillars + Medallion 'R' + Iron Fence (z = -34)
    this.buildGateAndFence(scene, assets);

    // 4. Gothic Stone Chapel (right midground, x = 13.5, z = -22)
    this.buildGothicChapel(scene, assets, tier);

    // 5. Bare Overhanging Tree (top-left foreground) + Background Silhouette Trees
    this.buildTrees(scene, assets, tier);

    // 6. Instanced Grass Blades + Hydrangea & Daisy Flowers
    this.buildGrassAndFlowers(scene, tier);
  }

  private buildGateAndFence(scene: THREE.Scene, assets: AssetLoader): void {
    const gate = new THREE.Group();
    gate.position.set(0, 0, -34);

    const stoneMat = new THREE.MeshStandardMaterial({
      map: assets.stonePBR.map,
      normalMap: assets.stonePBR.normalMap,
      roughnessMap: assets.stonePBR.roughnessMap,
      color: 0x6f7480,
      roughness: 0.9,
    });
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x161a23,
      roughness: 0.35,
      metalness: 0.85,
      envMap: assets.envMap,
    });

    // Stepped Gate Pillars
    for (const side of [-1, 1]) {
      const px = side * 3.45;
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 1.5), stoneMat);
      base.position.set(px, 0.3, 0);
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.18, 4.4, 1.18), stoneMat);
      shaft.position.set(px, 2.8, 0);
      shaft.castShadow = true;
      const cornice = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.32, 1.42), stoneMat);
      cornice.position.set(px, 5.15, 0);
      gate.add(base, shaft, cornice);
    }

    // Iron Arch + Scrollwork + 'R' Medallion
    const arch = new THREE.Mesh(new THREE.TorusGeometry(3.45, 0.11, 10, 36, Math.PI), ironMat);
    arch.position.set(0, 4.2, 0);
    gate.add(arch);

    const innerArch = new THREE.Mesh(new THREE.TorusGeometry(2.95, 0.06, 8, 32, Math.PI), ironMat);
    innerArch.position.set(0, 4.2, 0);
    gate.add(innerArch);

    // Circular R Medallion at apex
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.08, 10, 28), ironMat);
    ring.position.set(0, 7.85, 0);
    gate.add(ring);

    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 256;
    const bCtx = badgeCanvas.getContext('2d')!;
    bCtx.fillStyle = '#181e2c';
    bCtx.beginPath();
    bCtx.arc(128, 128, 122, 0, Math.PI * 2);
    bCtx.fill();
    bCtx.fillStyle = '#E9E4D8';
    bCtx.font = '700 148px "Cormorant Garamond", Georgia, serif';
    bCtx.textAlign = 'center';
    bCtx.textBaseline = 'middle';
    bCtx.fillText('R', 128, 134);
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    badgeTex.colorSpace = THREE.SRGBColorSpace;

    const plate = new THREE.Mesh(
      new THREE.CircleGeometry(0.62, 24),
      new THREE.MeshStandardMaterial({ map: badgeTex, roughness: 0.5, metalness: 0.3 }),
    );
    plate.position.set(0, 7.85, 0.05);
    gate.add(plate);

    // Ajar iron gate leaves with spear finials
    for (const side of [-1, 1]) {
      const leaf = new THREE.Group();
      leaf.position.set(side * 2.8, 0, 0);
      leaf.rotation.y = side * -0.35;
      for (let i = 0; i < 6; i += 1) {
        const bx = -side * (0.28 + i * 0.42);
        const h = 3.5 + Math.sin((i / 5) * Math.PI) * 0.8;
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, h, 6), ironMat);
        bar.position.set(bx, h / 2, 0);
        const finial = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 5), ironMat);
        finial.position.set(bx, h + 0.11, 0);
        leaf.add(bar, finial);
      }
      gate.add(leaf);
    }

    // Iron fence wings curving into mist
    const barGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.2, 5);
    const finialGeo = new THREE.ConeGeometry(0.06, 0.18, 5);
    const fenceUnit = mergeGeometries([barGeo, finialGeo.translate(0, 1.19, 0)], false);
    const totalBars = 64;
    const fenceMesh = new THREE.InstancedMesh(fenceUnit, ironMat, totalBars);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < totalBars; i += 1) {
      const side = i < 32 ? -1 : 1;
      const idx = i % 32;
      const x = side * (4.4 + idx * 0.72);
      const zCurve = Math.pow(idx / 32, 2) * 3.5;
      dummy.position.set(x, 1.1, zCurve);
      dummy.updateMatrix();
      fenceMesh.setMatrixAt(i, dummy.matrix);
    }
    fenceMesh.instanceMatrix.needsUpdate = true;
    gate.add(fenceMesh);

    // Subtle moonlit mist backlight plane behind gate so iron silhouette pops
    const backlight = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 12),
      new THREE.MeshBasicMaterial({
        map: assets.mistMap,
        color: 0x5f74ab,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
    );
    backlight.position.set(0, 4.5, -5.5);
    gate.add(backlight);

    scene.add(gate);
  }

  private buildGothicChapel(scene: THREE.Scene, assets: AssetLoader, tier: QualityTier): void {
    const chapel = new THREE.Group();
    chapel.position.set(12.2, 0, -24.5);
    chapel.rotation.y = -0.42;

    const wallMat = new THREE.MeshStandardMaterial({
      map: assets.stonePBR.map,
      normalMap: assets.stonePBR.normalMap,
      roughnessMap: assets.stonePBR.roughnessMap,
      color: 0x5c6475,
      roughness: 0.9,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x262e3d,
      roughness: 0.35,
      metalness: 0.15,
      envMap: assets.envMap,
    });
    const glowWinMat = new THREE.MeshStandardMaterial({
      color: 0xffd28c,
      emissive: new THREE.Color('#FFB45A'),
      emissiveIntensity: 1.55,
      roughness: 0.2,
    });

    // Extruded gabled chapel body (no plain box!)
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-3.2, 0);
    gableShape.lineTo(-3.2, 4.4);
    gableShape.lineTo(0, 8.2);
    gableShape.lineTo(3.2, 4.4);
    gableShape.lineTo(3.2, 0);
    gableShape.closePath();

    const naveGeo = new THREE.ExtrudeGeometry(gableShape, {
      depth: 8.6,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 2,
    });
    naveGeo.translate(0, 0, -4.3);
    const nave = new THREE.Mesh(naveGeo, wallMat);
    nave.castShadow = true;
    nave.receiveShadow = true;
    chapel.add(nave);

    // Steep pitched slate roof overhang
    const roofShape = new THREE.Shape();
    roofShape.moveTo(-3.65, 4.2);
    roofShape.lineTo(0, 8.55);
    roofShape.lineTo(3.65, 4.2);
    roofShape.lineTo(3.35, 4.0);
    roofShape.lineTo(0, 8.1);
    roofShape.lineTo(-3.35, 4.0);
    roofShape.closePath();
    const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 9.2, bevelEnabled: false });
    roofGeo.translate(0, 0, -4.6);
    chapel.add(new THREE.Mesh(roofGeo, roofMat));

    // Side stone buttresses
    for (const side of [-1, 1]) {
      for (const bz of [-2.8, 0, 2.8]) {
        const buttress = new THREE.Mesh(new THREE.BoxGeometry(0.65, 3.8, 0.75), wallMat);
        buttress.position.set(side * 3.35, 1.9, bz);
        buttress.castShadow = true;
        chapel.add(buttress);
      }
    }

    // Pointed-arch Gothic glowing front window + doorway
    const archWin = new THREE.Shape();
    archWin.moveTo(-0.68, 0);
    archWin.lineTo(-0.68, 1.65);
    archWin.quadraticCurveTo(-0.68, 2.55, 0, 2.95);
    archWin.quadraticCurveTo(0.68, 2.55, 0.68, 1.65);
    archWin.lineTo(0.68, 0);
    archWin.closePath();

    const winGeo = new THREE.ShapeGeometry(archWin, 16);
    const frontWindow = new THREE.Mesh(winGeo, glowWinMat);
    frontWindow.position.set(0, 2.8, 4.4);
    chapel.add(frontWindow);

    // Gothic window tracery mullions over front window
    const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.6, 0.08), roofMat);
    mullionV.position.set(0, 4.1, 4.43);
    const mullionH1 = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.06, 0.08), roofMat);
    mullionH1.position.set(0, 3.6, 4.43);
    const mullionH2 = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.06, 0.08), roofMat);
    mullionH2.position.set(0, 4.45, 4.43);
    chapel.add(mullionV, mullionH1, mullionH2);

    const doorWin = new THREE.Mesh(winGeo, glowWinMat);
    doorWin.scale.set(0.85, 0.75, 1);
    doorWin.position.set(0, 0.2, 4.4);
    chapel.add(doorWin);

    // Side pointed windows facing the path
    for (const wz of [-1.6, 1.6]) {
      const sw = new THREE.Mesh(winGeo, glowWinMat);
      sw.scale.set(0.62, 0.68, 1);
      sw.rotation.y = -Math.PI / 2;
      sw.position.set(-3.32, 1.9, wz);
      chapel.add(sw);
    }

    // Roof stone cross finial
    const finialV = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.95, 0.14), wallMat);
    finialV.position.set(0, 8.95, 4.1);
    const finialH = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.14, 0.14), wallMat);
    finialH.position.set(0, 9.1, 4.1);
    chapel.add(finialV, finialH);

    // Warm window light spill
    if (tier !== 'low') {
      const chapelLight = new THREE.PointLight('#FFB45A', 1.6, 11, 2);
      chapelLight.position.set(0, 2.4, 5.4);
      chapel.add(chapelLight);
    }

    scene.add(chapel);
  }

  private buildTrees(scene: THREE.Scene, assets: AssetLoader, tier: QualityTier): void {
    const barkMat = new THREE.MeshStandardMaterial({
      map: assets.woodPBR.map,
      normalMap: assets.woodPBR.normalMap,
      color: 0x1e1918,
      roughness: 0.94,
    });

    // Foreground gnarled bare tree reaching in from top-left (x 0..35%, y 0..45%)
    const fgTree = buildBareTreeBranchGroup(barkMat);
    fgTree.position.set(-3.35, 0, 2.1);
    fgTree.rotation.y = 0.35;
    fgTree.scale.set(0.88, 0.88, 0.88);
    scene.add(fgTree);

    // Instanced organic background woodland silhouettes in 2 horizon layers
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x0e1622, roughness: 0.96 });
    const c1 = new THREE.IcosahedronGeometry(1.55, 1);
    c1.scale(1.15, 1.35, 1.0);
    c1.translate(0, 4.0, 0);
    const c2 = new THREE.IcosahedronGeometry(1.25, 1);
    c2.scale(1.2, 1.05, 1.0);
    c2.translate(-0.85, 3.2, 0.3);
    const c3 = new THREE.IcosahedronGeometry(1.15, 1);
    c3.scale(1.1, 1.15, 1.0);
    c3.translate(0.9, 3.3, -0.2);
    const trunkIndexed = new THREE.CylinderGeometry(0.18, 0.32, 2.8, 6);
    trunkIndexed.translate(0, 1.4, 0);
    const trunk = trunkIndexed.toNonIndexed();
    trunkIndexed.dispose();
    const treeGeo = mergeGeometries([trunk, c1, c2, c3], false);
    c1.dispose();
    c2.dispose();
    c3.dispose();
    trunk.dispose();

    const treeCoords: Array<[number, number, number]> = [
      [-14, -18, 1.15], [-17, -28, 1.35], [-13, -38, 1.55], [-21, -40, 1.7],
      [-8, -46, 1.4], [9, -45, 1.45], [18, -36, 1.6], [21, -26, 1.35],
      [17, -12, 1.2], [-15, -6, 1.25], [23, -44, 1.75], [-25, -24, 1.5],
    ];
    const count = tier === 'low' ? 8 : treeCoords.length;
    const trees = new THREE.InstancedMesh(treeGeo, foliageMat, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i += 1) {
      const [tx, tz, ts] = treeCoords[i];
      dummy.position.set(tx, 0, tz);
      dummy.rotation.y = i * 1.1;
      dummy.scale.set(ts, ts, ts);
      dummy.updateMatrix();
      trees.setMatrixAt(i, dummy.matrix);
    }
    trees.instanceMatrix.needsUpdate = true;
    scene.add(trees);
  }

  private buildGrassAndFlowers(scene: THREE.Scene, tier: QualityTier): void {
    // Tapered triangular grass blades swaying in wind
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(-0.022, 0);
    bladeShape.lineTo(0.022, 0);
    bladeShape.lineTo(0.002, 0.32);
    bladeShape.closePath();
    const bladeGeo = new THREE.ShapeGeometry(bladeShape, 1);

    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x223b2a,
      roughness: 0.85,
      side: THREE.DoubleSide,
    });
    grassMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.grassUniforms.uTime;
      shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float sway = sin(uTime * 1.6 + instanceMatrix[3][0] * 0.9 + instanceMatrix[3][2] * 0.7) * 0.07 * (position.y * 2.5);
         transformed.x += sway;`,
      );
    };
    this.grassMaterial = grassMat;

    const grassCount = tier === 'high' ? 1800 : tier === 'medium' ? 1000 : 450;
    const grassMesh = new THREE.InstancedMesh(bladeGeo, grassMat, grassCount);
    const dummy = new THREE.Object3D();

    let placed = 0;
    for (let i = 0; i < grassCount * 2 && placed < grassCount; i += 1) {
      const gx = (((i * 73) % 1000) / 1000 - 0.5) * 24;
      const gz = 4.5 - (((i * 197) % 1000) / 1000) * 40;
      if (Math.abs(gx - getPathCenterX(gz)) < 1.75) continue;

      dummy.position.set(gx, 0, gz);
      dummy.rotation.y = (i * 0.9) % Math.PI;
      dummy.scale.set(1, 0.65 + (i % 5) * 0.16, 1);
      dummy.updateMatrix();
      grassMesh.setMatrixAt(placed, dummy.matrix);
      placed += 1;
    }
    grassMesh.count = placed;
    grassMesh.instanceMatrix.needsUpdate = true;
    scene.add(grassMesh);

    // Delicate multi-floret hydrangea & daisy clusters with foliage base
    const floretGeo = new THREE.SphereGeometry(0.036, 6, 5);
    const leafClusterGeo = new THREE.SphereGeometry(0.14, 7, 5);
    leafClusterGeo.scale(1.4, 0.55, 1.3);
    const foliageLeafMat = new THREE.MeshStandardMaterial({ color: 0x182b1e, roughness: 0.9 });
    const violetMat = new THREE.MeshStandardMaterial({ color: '#6E5BB8', roughness: 0.78 });
    const blueMat = new THREE.MeshStandardMaterial({ color: '#4D6FD1', roughness: 0.78 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: '#F4F1E8', roughness: 0.65 });

    const hydrangeaSpots: Array<[number, number]> = [
      [-2.35, 3.2], [-2.75, 2.7], [-1.95, 3.5], [-3.1, 2.2],
      [-3.85, -0.4], [-3.15, -0.7],
    ];
    const leafBase = new THREE.InstancedMesh(leafClusterGeo, foliageLeafMat, hydrangeaSpots.length + 2);
    const hMesh = new THREE.InstancedMesh(floretGeo, violetMat, hydrangeaSpots.length * 14);
    const bMesh = new THREE.InstancedMesh(floretGeo, blueMat, hydrangeaSpots.length * 10);
    let hIdx = 0;
    let bIdx = 0;

    hydrangeaSpots.forEach(([hx, hz], idx) => {
      dummy.position.set(hx + 0.05, 0.07, hz + 0.05);
      dummy.scale.setScalar(1.2);
      dummy.updateMatrix();
      leafBase.setMatrixAt(idx, dummy.matrix);

      for (let k = 0; k < 14; k += 1) {
        const a = (k / 14) * Math.PI * 2;
        const r = 0.06 + (k % 3) * 0.055;
        dummy.position.set(hx + Math.cos(a) * r, 0.14 + (k % 3) * 0.04, hz + Math.sin(a) * r);
        dummy.scale.setScalar(0.85 + (k % 3) * 0.2);
        dummy.updateMatrix();
        hMesh.setMatrixAt(hIdx++, dummy.matrix);
      }
      for (let k = 0; k < 10; k += 1) {
        const a = (k / 10) * Math.PI * 2 + 0.4;
        const r = 0.05 + (k % 2) * 0.065;
        dummy.position.set(hx + 0.14 + Math.cos(a) * r, 0.13 + (k % 2) * 0.04, hz + 0.09 + Math.sin(a) * r);
        dummy.scale.setScalar(0.8 + (k % 2) * 0.18);
        dummy.updateMatrix();
        bMesh.setMatrixAt(bIdx++, dummy.matrix);
      }
    });

    // Leaf base for hero grave daisy bouquet
    dummy.position.set(-0.62, 0.05, 1.72);
    dummy.scale.set(1.5, 0.8, 1.1);
    dummy.updateMatrix();
    leafBase.setMatrixAt(hydrangeaSpots.length, dummy.matrix);
    dummy.position.set(-0.46, 0.05, 1.69);
    dummy.scale.set(1.2, 0.7, 1.0);
    dummy.updateMatrix();
    leafBase.setMatrixAt(hydrangeaSpots.length + 1, dummy.matrix);

    leafBase.instanceMatrix.needsUpdate = true;
    hMesh.instanceMatrix.needsUpdate = true;
    bMesh.instanceMatrix.needsUpdate = true;
    scene.add(leafBase, hMesh, bMesh);

    // White daisy bouquet at hero grave (#00291 at -0.62, 1.35)
    const daisyMesh = new THREE.InstancedMesh(floretGeo, whiteMat, 28);
    for (let i = 0; i < 28; i += 1) {
      const ang = (i / 28) * Math.PI * 2;
      const rad = 0.07 + (i % 4) * 0.06;
      dummy.position.set(-0.62 + Math.cos(ang) * rad, 0.1 + (i % 3) * 0.03, 1.72 + Math.sin(ang) * rad * 0.65);
      dummy.scale.setScalar(0.65 + (i % 3) * 0.14);
      dummy.updateMatrix();
      daisyMesh.setMatrixAt(i, dummy.matrix);
    }
    daisyMesh.instanceMatrix.needsUpdate = true;
    scene.add(daisyMesh);
  }

  public update(elapsedSec: number, reducedMotion: boolean): void {
    if (!reducedMotion) {
      this.grassUniforms.uTime.value = elapsedSec;
    }
  }
}
