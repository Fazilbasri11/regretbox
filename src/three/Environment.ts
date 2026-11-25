import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { AssetLoader } from './AssetLoader';
import type { QualityTier } from './PerformanceManager';
import { getPathCenterX, getTerrainHeight, PATH_HALF_WIDTH } from './terrain';

function buildPathGeometry(zStart: number, zEnd: number): THREE.BufferGeometry {
  const segments = 60;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const z = zStart + (zEnd - zStart) * t;
    const cx = getPathCenterX(z);
    const halfW = PATH_HALF_WIDTH + Math.sin(t * Math.PI) * 0.18;
    const yCenter = getTerrainHeight(cx, z) + 0.035;

    positions.push(cx - halfW, yCenter, z);
    positions.push(cx + halfW, yCenter, z);
    uvs.push(0, t * 18);
    uvs.push(1, t * 18);

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
    [[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.4, 2.2, 0.1), new THREE.Vector3(1.5, 4.2, 0.4)], 0.32, 0.14],
    [[new THREE.Vector3(1.5, 4.2, 0.4), new THREE.Vector3(3.1, 5.2, 0.8), new THREE.Vector3(5.2, 5.6, 1.3)], 0.14, 0.04],
    [[new THREE.Vector3(1.2, 3.6, 0.3), new THREE.Vector3(2.4, 4.6, -0.4), new THREE.Vector3(4.1, 4.4, -0.6)], 0.12, 0.03],
    [[new THREE.Vector3(2.6, 4.9, 0.6), new THREE.Vector3(3.6, 5.9, 0.4), new THREE.Vector3(4.7, 6.2, 0.9)], 0.08, 0.02],
    [[new THREE.Vector3(0.9, 2.9, 0.2), new THREE.Vector3(-0.4, 4.1, 0.5), new THREE.Vector3(-1.4, 5.1, 0.8)], 0.14, 0.04],
  ];

  for (const [pts, rStart, rEnd] of curves) {
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.TubeGeometry(curve, 10, rStart, 6, false);
    const pos = tube.getAttribute('position');
    for (let i = 0; i < pos.count; i += 1) {
      const p = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
      const t = Math.min(1, Math.max(0, i / pos.count));
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
  public doorHitMesh!: THREE.Mesh;
  private grassUniforms = { uTime: { value: 0 } };
  private fgTree: THREE.Group | null = null;
  private chapelLight: THREE.PointLight | null = null;
  private doorMat: THREE.MeshStandardMaterial | null = null;
  private backgroundTrees: THREE.InstancedMesh | null = null;

  constructor(scene: THREE.Scene, assets: AssetLoader, tier: QualityTier, maxZ: number) {
    // 1. Rolling-hill terrain ("pundak-pundak bukit kecil")
    const groundGeo = new THREE.PlaneGeometry(160, 170, 56, 56);
    groundGeo.rotateX(-Math.PI / 2);
    groundGeo.translate(0, 0, -28);
    const gPos = groundGeo.getAttribute('position');
    for (let i = 0; i < gPos.count; i += 1) {
      gPos.setY(i, getTerrainHeight(gPos.getX(i), gPos.getZ(i)));
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      map: assets.grassMap,
      color: 0x3b5441,
      roughness: 0.92,
      metalness: 0.02,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    scene.add(ground);

    // 2. Wet Cobblestone Path hugging terrain slope
    const pathGeo = buildPathGeometry(-58, Math.max(20, maxZ + 18));
    const pathMat = new THREE.MeshStandardMaterial({
      map: assets.cobblePBR.map,
      normalMap: assets.cobblePBR.normalMap,
      roughnessMap: assets.cobblePBR.roughnessMap,
      color: 0xc2cad9,
      roughness: 0.65,
      metalness: 0.16,
      envMap: assets.envMap,
      envMapIntensity: tier === 'low' ? 0.8 : 1.85,
    });
    const pathMesh = new THREE.Mesh(pathGeo, pathMat);
    pathMesh.receiveShadow = true;
    scene.add(pathMesh);

    // 3. Grand Wrought-Iron Gate + Fence (z = -46)
    this.buildGateAndFence(scene, assets);

    // 4. Neutral Gothic Stone Pavilion (right midground, NO cross)
    this.buildStonePavilion(scene, assets, tier);

    // 5. Bare Overhanging Tree + Background Woodland Silhouettes
    this.buildTrees(scene, assets, tier);

    // 6. Optimized Foreground Grass & Flower Clusters
    this.buildGrassAndFlowers(scene, tier);
  }

  private buildGateAndFence(scene: THREE.Scene, assets: AssetLoader): void {
    const gateZ = -46;
    const gateY = getTerrainHeight(0, gateZ);
    const gate = new THREE.Group();
    gate.position.set(0, gateY, gateZ);

    const stoneMat = new THREE.MeshStandardMaterial({
      map: assets.stonePBR.map,
      normalMap: assets.stonePBR.normalMap,
      roughnessMap: assets.stonePBR.roughnessMap,
      color: 0x8d93a1,
      roughness: 0.88,
    });
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x1b202b,
      roughness: 0.35,
      metalness: 0.82,
      envMap: assets.envMap,
    });

    for (const side of [-1, 1]) {
      const px = side * 3.6;
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.7, 1.55), stoneMat);
      base.position.set(px, 0.35, 0);
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.22, 4.6, 1.22), stoneMat);
      shaft.position.set(px, 2.95, 0);
      shaft.castShadow = true;
      const cornice = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.34, 1.48), stoneMat);
      cornice.position.set(px, 5.4, 0);
      gate.add(base, shaft, cornice);
    }

    const arch = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.12, 8, 32, Math.PI), ironMat);
    arch.position.set(0, 4.4, 0);
    const innerArch = new THREE.Mesh(new THREE.TorusGeometry(3.05, 0.06, 6, 28, Math.PI), ironMat);
    innerArch.position.set(0, 4.4, 0);
    gate.add(arch, innerArch);

    // Circular R Medallion
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.08, 8, 24), ironMat);
    ring.position.set(0, 8.2, 0);
    gate.add(ring);

    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 128;
    badgeCanvas.height = 128;
    const bCtx = badgeCanvas.getContext('2d')!;
    bCtx.fillStyle = '#1b2336';
    bCtx.beginPath();
    bCtx.arc(64, 64, 60, 0, Math.PI * 2);
    bCtx.fill();
    bCtx.fillStyle = '#E9E4D8';
    bCtx.font = '700 74px "Cormorant Garamond", Georgia, serif';
    bCtx.textAlign = 'center';
    bCtx.textBaseline = 'middle';
    bCtx.fillText('R', 64, 68);
    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    badgeTex.colorSpace = THREE.SRGBColorSpace;

    const plate = new THREE.Mesh(
      new THREE.CircleGeometry(0.66, 20),
      new THREE.MeshStandardMaterial({ map: badgeTex, roughness: 0.45, metalness: 0.3 }),
    );
    plate.position.set(0, 8.2, 0.06);
    gate.add(plate);

    // Ajar gate leaves
    for (const side of [-1, 1]) {
      const leaf = new THREE.Group();
      leaf.position.set(side * 2.95, 0, 0);
      leaf.rotation.y = side * -0.34;
      for (let i = 0; i < 6; i += 1) {
        const bx = -side * (0.28 + i * 0.44);
        const h = 3.6 + Math.sin((i / 5) * Math.PI) * 0.8;
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, h, 5), ironMat);
        bar.position.set(bx, h / 2, 0);
        const finial = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 5), ironMat);
        finial.position.set(bx, h + 0.11, 0);
        leaf.add(bar, finial);
      }
      gate.add(leaf);
    }

    // Iron fence wings following terrain contours
    const barGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.3, 5);
    const finialGeo = new THREE.ConeGeometry(0.06, 0.18, 5);
    const fenceUnit = mergeGeometries([barGeo, finialGeo.translate(0, 1.24, 0)], false);
    const totalBars = 60;
    const fenceMesh = new THREE.InstancedMesh(fenceUnit, ironMat, totalBars);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < totalBars; i += 1) {
      const side = i < 30 ? -1 : 1;
      const idx = i % 30;
      const x = side * (4.6 + idx * 0.78);
      const zCurve = Math.pow(idx / 30, 2) * 3.8;
      const localY = getTerrainHeight(x, gateZ + zCurve) - gateY;
      dummy.position.set(x, localY + 1.15, zCurve);
      dummy.updateMatrix();
      fenceMesh.setMatrixAt(i, dummy.matrix);
    }
    fenceMesh.instanceMatrix.needsUpdate = true;
    gate.add(fenceMesh);

    const backlight = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 13),
      new THREE.MeshBasicMaterial({
        map: assets.mistMap,
        color: 0x7189c4,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
      }),
    );
    backlight.position.set(0, 4.8, -6);
    gate.add(backlight);

    scene.add(gate);
  }

  private buildStonePavilion(scene: THREE.Scene, assets: AssetLoader, tier: QualityTier): void {
    const cx = 13.8;
    const cz = -33.5;
    const cy = getTerrainHeight(cx, cz);
    const pavilion = new THREE.Group();
    pavilion.position.set(cx, cy + 0.45, cz);
    pavilion.rotation.y = -0.38;

    const wallMat = new THREE.MeshStandardMaterial({
      map: assets.stonePBR.map,
      normalMap: assets.stonePBR.normalMap,
      roughnessMap: assets.stonePBR.roughnessMap,
      color: 0x7b8499,
      roughness: 0.88,
    });

    // Raised stone terrace foundation so the chapel doorway sits clearly above mid-ground hills
    const plinthFoundation = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.3, 10.6), wallMat);
    plinthFoundation.position.set(0, -0.6, 0.2);
    plinthFoundation.receiveShadow = true;
    pavilion.add(plinthFoundation);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x2f384a,
      roughness: 0.35,
      metalness: 0.15,
      envMap: assets.envMap,
    });
    const glowWinMat = new THREE.MeshStandardMaterial({
      color: 0xffd996,
      emissive: new THREE.Color('#FFB45A'),
      emissiveIntensity: 1.65,
      roughness: 0.2,
    });

    const gableShape = new THREE.Shape();
    gableShape.moveTo(-3.4, 0);
    gableShape.lineTo(-3.4, 4.6);
    gableShape.lineTo(0, 8.6);
    gableShape.lineTo(3.4, 4.6);
    gableShape.lineTo(3.4, 0);
    gableShape.closePath();

    const naveGeo = new THREE.ExtrudeGeometry(gableShape, {
      depth: 8.8,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 2,
    });
    naveGeo.translate(0, 0, -4.4);
    const nave = new THREE.Mesh(naveGeo, wallMat);
    nave.castShadow = true;
    nave.receiveShadow = true;
    pavilion.add(nave);

    const roofShape = new THREE.Shape();
    roofShape.moveTo(-3.85, 4.4);
    roofShape.lineTo(0, 8.95);
    roofShape.lineTo(3.85, 4.4);
    roofShape.lineTo(3.55, 4.2);
    roofShape.lineTo(0, 8.48);
    roofShape.lineTo(-3.55, 4.2);
    roofShape.closePath();
    const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 9.4, bevelEnabled: false });
    roofGeo.translate(0, 0, -4.7);
    pavilion.add(new THREE.Mesh(roofGeo, roofMat));

    for (const side of [-1, 1]) {
      for (const bz of [-2.8, 0, 2.8]) {
        const buttress = new THREE.Mesh(new THREE.BoxGeometry(0.65, 3.9, 0.75), wallMat);
        buttress.position.set(side * 3.55, 1.95, bz);
        buttress.castShadow = true;
        pavilion.add(buttress);
      }
    }

    // Pointed-arch window with neutral vertical tracery mullions (NO cross)
    const archWin = new THREE.Shape();
    archWin.moveTo(-0.7, 0);
    archWin.lineTo(-0.7, 1.7);
    archWin.quadraticCurveTo(-0.7, 2.65, 0, 3.05);
    archWin.quadraticCurveTo(0.7, 2.65, 0.7, 1.7);
    archWin.lineTo(0.7, 0);
    archWin.closePath();

    const winGeo = new THREE.ShapeGeometry(archWin, 14);
    const frontWindow = new THREE.Mesh(winGeo, glowWinMat);
    frontWindow.position.set(0, 2.9, 4.5);
    pavilion.add(frontWindow);

    const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.75, 0.08), roofMat);
    mullionV.position.set(0, 4.25, 4.53);
    const mullionL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.9, 0.08), roofMat);
    mullionL.position.set(-0.34, 3.85, 4.53);
    const mullionR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.9, 0.08), roofMat);
    mullionR.position.set(0.34, 3.85, 4.53);
    pavilion.add(mullionV, mullionL, mullionR);

    const doorMat = glowWinMat.clone();
    this.doorMat = doorMat;
    const doorWin = new THREE.Mesh(winGeo, doorMat);
    doorWin.scale.set(0.88, 0.78, 1);
    doorWin.position.set(0, 0.25, 4.5);
    pavilion.add(doorWin);

    // Door surround mullions + handle so the chapel door clearly invites clicking ("About")
    const doorBarL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.15, 0.14), roofMat);
    doorBarL.position.set(-0.62, 1.25, 4.52);
    const doorBarR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.15, 0.14), roofMat);
    doorBarR.position.set(0.62, 1.25, 4.52);
    const doorRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.09, 0.025, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0xe8a84b, roughness: 0.35, metalness: 0.7 }),
    );
    doorRing.position.set(0.32, 1.22, 4.58);
    pavilion.add(doorBarL, doorBarR, doorRing);

    const doorHit = new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 3.0, 1.2),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    doorHit.position.set(0, 1.45, 4.65);
    doorHit.userData = { isAboutDoor: true };
    pavilion.add(doorHit);
    this.doorHitMesh = doorHit;

    for (const wz of [-1.6, 1.6]) {
      const sw = new THREE.Mesh(winGeo, glowWinMat);
      sw.scale.set(0.62, 0.68, 1);
      sw.rotation.y = -Math.PI / 2;
      sw.position.set(-3.52, 2.0, wz);
      pavilion.add(sw);
    }

    // Neutral stone apex spire finial (NO cross)
    const finialBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.45, 6), wallMat);
    finialBase.position.set(0, 9.05, 4.2);
    const finialTip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.55, 6), wallMat);
    finialTip.position.set(0, 9.52, 4.2);
    pavilion.add(finialBase, finialTip);

    if (tier !== 'low') {
      this.chapelLight = new THREE.PointLight('#FFB45A', 1.75, 12, 2);
      this.chapelLight.position.set(0, 2.6, 5.6);
      pavilion.add(this.chapelLight);
    }

    scene.add(pavilion);
  }

  private buildTrees(scene: THREE.Scene, assets: AssetLoader, tier: QualityTier): void {
    const barkMat = new THREE.MeshStandardMaterial({
      map: assets.woodPBR.map,
      normalMap: assets.woodPBR.normalMap,
      color: 0x26201f,
      roughness: 0.92,
    });

    const fgX = -3.85;
    const fgZ = 2.4;
    const fgTree = buildBareTreeBranchGroup(barkMat);
    fgTree.position.set(fgX, getTerrainHeight(fgX, fgZ) - 0.1, fgZ);
    fgTree.rotation.y = 0.35;
    fgTree.scale.set(0.95, 0.95, 0.95);
    scene.add(fgTree);
    this.fgTree = fgTree;

    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x162230, roughness: 0.94 });
    foliageMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.grassUniforms.uTime;
      shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float treeSway = sin(uTime * 0.75 + instanceMatrix[3][0] * 0.3) * 0.045 * max(0.0, position.y - 1.5);
         transformed.x += treeSway;`,
      );
    };
    const c1 = new THREE.IcosahedronGeometry(1.55, 1);
    c1.scale(1.15, 1.35, 1.0);
    c1.translate(0, 4.0, 0);
    const c2 = new THREE.IcosahedronGeometry(1.25, 1);
    c2.scale(1.2, 1.05, 1.0);
    c2.translate(-0.85, 3.2, 0.3);
    const c3 = new THREE.IcosahedronGeometry(1.15, 1);
    c3.scale(1.1, 1.15, 1.0);
    c3.translate(0.9, 3.3, -0.2);
    const trunkIdx = new THREE.CylinderGeometry(0.18, 0.32, 2.8, 6);
    trunkIdx.translate(0, 1.4, 0);
    const trunk = trunkIdx.toNonIndexed();
    trunkIdx.dispose();
    const treeGeo = mergeGeometries([trunk, c1, c2, c3], false);
    c1.dispose();
    c2.dispose();
    c3.dispose();
    trunk.dispose();

    const treeCoords: Array<[number, number, number]> = [
      [-17, -22, 1.2], [-21, -34, 1.4], [-15, -48, 1.6], [-24, -52, 1.7],
      [-9, -58, 1.45], [10, -56, 1.5], [22, -46, 1.65], [26, -32, 1.4],
      [21, -16, 1.25], [-18, -8, 1.3], [27, -56, 1.75], [-28, -28, 1.55],
    ];
    const count = tier === 'low' ? 8 : treeCoords.length;
    const trees = new THREE.InstancedMesh(treeGeo, foliageMat, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i += 1) {
      const [tx, tz, ts] = treeCoords[i];
      dummy.position.set(tx, getTerrainHeight(tx, tz) - 0.1, tz);
      dummy.rotation.y = i * 1.1;
      dummy.scale.set(ts, ts, ts);
      dummy.updateMatrix();
      trees.setMatrixAt(i, dummy.matrix);
    }
    trees.instanceMatrix.needsUpdate = true;
    scene.add(trees);
    this.backgroundTrees = trees;
  }

  private buildGrassAndFlowers(scene: THREE.Scene, tier: QualityTier): void {
    // Organic clumped wild grass ("ilalang") with abundant tall & medium blades
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(-0.026, 0);
    bladeShape.lineTo(0.026, 0);
    bladeShape.lineTo(0.015, 0.16);
    bladeShape.lineTo(0.007, 0.31);
    bladeShape.lineTo(0.0, 0.44);
    bladeShape.closePath();
    const bladeGeo = new THREE.ShapeGeometry(bladeShape, 2);

    const grassMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.84,
      side: THREE.DoubleSide,
    });
    grassMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.grassUniforms.uTime;
      shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float wx = instanceMatrix[3][0];
         float wz = instanceMatrix[3][2];
         float wave = sin(uTime * 1.7 - wx * 0.38 + wz * 0.28) * 0.72
                    + cos(uTime * 2.65 - wx * 0.85 + wz * 0.6) * 0.38
                    + sin(uTime * 0.65 - wx * 0.14) * 0.45;
         float hFactor = clamp(position.y / 0.44, 0.0, 1.0);
         float bend = hFactor * hFactor;
         transformed.x += (0.028 + wave * 0.072) * bend;
         transformed.z += cos(uTime * 1.25 + wz * 0.55) * 0.03 * bend;`,
      );
    };
    this.grassMaterial = grassMat;

    const grassCount = tier === 'high' ? 4800 : tier === 'medium' ? 2600 : 1000;
    const grassMesh = new THREE.InstancedMesh(bladeGeo, grassMat, grassCount);
    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();

    // Seeded Mulberry32 PRNG for completely organic, non-grid placement
    let seed = 48271;
    const rand = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    let placed = 0;
    let guard = 0;
    while (placed < grassCount && guard < 5800) {
      guard += 1;
      // Pick a random tuft/clump center biased toward visible foreground & mid-ground hills
      const cx = (rand() - 0.5) * 38;
      const cz = 8.5 - Math.pow(rand(), 1.25) * 48;
      const distFromPath = Math.abs(cx - getPathCenterX(cz));
      if (distFromPath < PATH_HALF_WIDTH + 0.12) continue;

      // Avoid tall blades right in front of the hero grave inscription (-0.75, 1.65)
      const nearHeroFront = Math.abs(cx + 0.75) < 1.2 && cz > 1.3 && cz < 3.0;

      const bladesInTuft = 6 + Math.floor(rand() * 8); // 6-13 blades per natural clump
      const isTallClump = !nearHeroFront && rand() > 0.52;
      const clumpHeightBase = isTallClump
        ? 1.6 + rand() * 1.55 // Tall ilalang (~0.7m to ~1.4m+)
        : 0.58 + rand() * 0.95; // Medium wild grass

      for (let b = 0; b < bladesInTuft && placed < grassCount; b += 1) {
        const angle = rand() * Math.PI * 2;
        const radius = rand() * (isTallClump ? 0.52 : 0.4);
        const gx = cx + Math.cos(angle) * radius;
        const gz = cz + Math.sin(angle) * radius;
        if (Math.abs(gx - getPathCenterX(gz)) < PATH_HALF_WIDTH + 0.1) continue;

        const hScale = clumpHeightBase * (0.68 + rand() * 0.68);
        const wScale = (isTallClump ? 0.95 : 0.7) + rand() * 0.75;

        dummy.position.set(gx, getTerrainHeight(gx, gz) - 0.03, gz);
        dummy.rotation.set(
          (rand() - 0.5) * 0.42, // organic forward/back lean
          rand() * Math.PI * 2,
          (rand() - 0.5) * 0.34, // organic side bend
        );
        dummy.scale.set(wScale, hScale, 1);
        dummy.updateMatrix();
        grassMesh.setMatrixAt(placed, dummy.matrix);

        // Varied forest green -> moonlit sage/olive tint per blade
        const gVal = 0.24 + rand() * 0.2;
        const oliveShift = rand() * 0.05;
        tint.setRGB(gVal * 0.56 + oliveShift, gVal, gVal * 0.7);
        grassMesh.setColorAt(placed, tint);
        placed += 1;
      }
    }

    grassMesh.count = placed;
    grassMesh.instanceMatrix.needsUpdate = true;
    if (grassMesh.instanceColor) grassMesh.instanceColor.needsUpdate = true;
    scene.add(grassMesh);

    const floretGeo = new THREE.SphereGeometry(0.036, 5, 4);
    const leafClusterGeo = new THREE.SphereGeometry(0.14, 6, 4);
    leafClusterGeo.scale(1.4, 0.55, 1.3);
    const foliageLeafMat = new THREE.MeshStandardMaterial({ color: 0x203827, roughness: 0.88 });
    const violetMat = new THREE.MeshStandardMaterial({ color: '#7866C7', roughness: 0.75 });
    const blueMat = new THREE.MeshStandardMaterial({ color: '#587BE0', roughness: 0.75 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: '#F6F3EB', roughness: 0.65 });

    const hydrangeaSpots: Array<[number, number]> = [
      [-2.75, 3.6], [-3.15, 3.0], [-2.35, 3.9], [-3.55, 2.5],
      [-5.1, -1.1], [-4.2, -1.3],
    ];
    const leafBase = new THREE.InstancedMesh(leafClusterGeo, foliageLeafMat, hydrangeaSpots.length + 2);
    const hMesh = new THREE.InstancedMesh(floretGeo, violetMat, hydrangeaSpots.length * 12);
    const bMesh = new THREE.InstancedMesh(floretGeo, blueMat, hydrangeaSpots.length * 8);
    let hIdx = 0;
    let bIdx = 0;

    hydrangeaSpots.forEach(([hx, hz], idx) => {
      const hy = getTerrainHeight(hx, hz);
      dummy.position.set(hx + 0.05, hy + 0.06, hz + 0.05);
      dummy.scale.setScalar(1.2);
      dummy.updateMatrix();
      leafBase.setMatrixAt(idx, dummy.matrix);

      for (let k = 0; k < 12; k += 1) {
        const a = (k / 12) * Math.PI * 2;
        const r = 0.06 + (k % 3) * 0.055;
        dummy.position.set(hx + Math.cos(a) * r, hy + 0.13 + (k % 3) * 0.04, hz + Math.sin(a) * r);
        dummy.scale.setScalar(0.85 + (k % 3) * 0.2);
        dummy.updateMatrix();
        hMesh.setMatrixAt(hIdx++, dummy.matrix);
      }
      for (let k = 0; k < 8; k += 1) {
        const a = (k / 8) * Math.PI * 2 + 0.4;
        const r = 0.05 + (k % 2) * 0.065;
        dummy.position.set(hx + 0.14 + Math.cos(a) * r, hy + 0.12 + (k % 2) * 0.04, hz + 0.09 + Math.sin(a) * r);
        dummy.scale.setScalar(0.8 + (k % 2) * 0.18);
        dummy.updateMatrix();
        bMesh.setMatrixAt(bIdx++, dummy.matrix);
      }
    });

    // Daisy bouquet at hero grave (-0.75, 1.65)
    const heroX = -0.75;
    const heroZ = 1.65;
    const heroY = getTerrainHeight(heroX, heroZ);
    dummy.position.set(heroX, heroY + 0.05, heroZ + 0.36);
    dummy.scale.set(1.5, 0.8, 1.1);
    dummy.updateMatrix();
    leafBase.setMatrixAt(hydrangeaSpots.length, dummy.matrix);
    dummy.position.set(heroX + 0.16, heroY + 0.05, heroZ + 0.33);
    dummy.scale.set(1.2, 0.7, 1.0);
    dummy.updateMatrix();
    leafBase.setMatrixAt(hydrangeaSpots.length + 1, dummy.matrix);

    leafBase.instanceMatrix.needsUpdate = true;
    hMesh.instanceMatrix.needsUpdate = true;
    bMesh.instanceMatrix.needsUpdate = true;
    scene.add(leafBase, hMesh, bMesh);

    const daisyMesh = new THREE.InstancedMesh(floretGeo, whiteMat, 24);
    for (let i = 0; i < 24; i += 1) {
      const ang = (i / 24) * Math.PI * 2;
      const rad = 0.07 + (i % 4) * 0.06;
      dummy.position.set(heroX + Math.cos(ang) * rad, heroY + 0.1 + (i % 3) * 0.03, heroZ + 0.36 + Math.sin(ang) * rad * 0.65);
      dummy.scale.setScalar(0.65 + (i % 3) * 0.14);
      dummy.updateMatrix();
      daisyMesh.setMatrixAt(i, dummy.matrix);
    }
    daisyMesh.instanceMatrix.needsUpdate = true;
    scene.add(daisyMesh);
  }

  public setDoorHovered(hovered: boolean): void {
    if (this.doorMat) {
      this.doorMat.emissiveIntensity = hovered ? 2.35 : 1.65;
    }
  }

  public update(elapsedSec: number, reducedMotion: boolean): void {
    if (reducedMotion) return;
    this.grassUniforms.uTime.value = elapsedSec;
    if (this.fgTree) {
      this.fgTree.rotation.z = Math.sin(elapsedSec * 0.65) * 0.014;
      this.fgTree.rotation.x = Math.cos(elapsedSec * 0.48) * 0.008;
    }
    if (this.chapelLight) {
      this.chapelLight.intensity = 1.65 + Math.sin(elapsedSec * 3.1) * 0.14;
    }
    if (this.backgroundTrees) {
      this.backgroundTrees.rotation.z = Math.sin(elapsedSec * 0.4) * 0.002;
    }
  }
}
