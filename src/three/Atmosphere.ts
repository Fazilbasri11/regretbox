import * as THREE from 'three';
import type { AssetLoader } from './AssetLoader';
import type { QualityTier } from './PerformanceManager';
import { getTerrainHeight } from './terrain';

interface LeafMotion {
  x0: number;
  yBase: number;
  z0: number;
  speedX: number;
  speedZ: number;
  swirlAmp: number;
  swirlFreq: number;
  phase: number;
  scale: number;
  spinSpeed: number;
}

interface BatFlight {
  cx: number;
  cy: number;
  cz: number;
  rx: number;
  rz: number;
  ry: number;
  speed: number;
  phase: number;
  dir: number;
  scale: number;
}

const MAX_FIREFLIES = 56;
const MAX_LEAVES = 128;
const MAX_WISPS = 14;
const MAX_BATS = 16;

function createWindStreakTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 32;
  const ctx = c.getContext('2d')!;
  const gradX = ctx.createLinearGradient(0, 0, 128, 0);
  gradX.addColorStop(0, 'rgba(200, 220, 255, 0)');
  gradX.addColorStop(0.28, 'rgba(200, 220, 255, 0.35)');
  gradX.addColorStop(0.55, 'rgba(210, 228, 255, 0.55)');
  gradX.addColorStop(1, 'rgba(200, 220, 255, 0)');
  ctx.fillStyle = gradX;
  ctx.fillRect(0, 0, 128, 32);

  // Soft vertical fade mask
  ctx.globalCompositeOperation = 'destination-in';
  const gradY = ctx.createLinearGradient(0, 0, 0, 32);
  gradY.addColorStop(0, 'rgba(0,0,0,0)');
  gradY.addColorStop(0.5, 'rgba(0,0,0,1)');
  gradY.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradY;
  ctx.fillRect(0, 0, 128, 32);
  return new THREE.CanvasTexture(c);
}

export class Atmosphere {
  private fog: THREE.FogExp2;
  private mistPlanes: THREE.Mesh[] = [];
  private fireflies: THREE.Points;
  private fireflyPositions: Float32Array;
  private fireflyBase: Float32Array;

  private leavesMesh: THREE.InstancedMesh;
  private leafData: LeafMotion[] = [];

  private wispsMesh: THREE.InstancedMesh;
  private wispData: Array<{ x0: number; y0: number; z0: number; speed: number; phase: number; len: number }> = [];

  private batsMesh: THREE.InstancedMesh;
  private batData: BatFlight[] = [];
  private batUniforms = { uTime: { value: 0 } };

  private dummy = new THREE.Object3D();

  constructor(
    scene: THREE.Scene,
    assets: AssetLoader,
    tier: QualityTier,
  ) {
    // Lighter moonlit mist fog so background stones & gate silhouettes stay vivid
    this.fog = new THREE.FogExp2('#1D2848', 0.0155);
    scene.fog = this.fog;

    const mistCount = tier === 'low' ? 2 : 4;
    for (let i = 0; i < mistCount; i += 1) {
      const mist = new THREE.Mesh(
        new THREE.PlaneGeometry(26, 18),
        new THREE.MeshBasicMaterial({
          map: assets.mistMap,
          color: 0x7185b8,
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      mist.rotation.x = -Math.PI / 2;
      const baseX = (i - 1.5) * 6.5;
      const baseZ = -8 - i * 9.5;
      mist.position.set(baseX, 0.55 + (i % 2) * 0.25, baseZ);
      mist.userData = { baseX, phase: i * 1.4 };
      scene.add(mist);
      this.mistPlanes.push(mist);
    }

    this.fireflyPositions = new Float32Array(MAX_FIREFLIES * 3);
    this.fireflyBase = new Float32Array(MAX_FIREFLIES * 3);

    for (let i = 0; i < MAX_FIREFLIES; i += 1) {
      const x = (((i * 37) % 100) / 100 - 0.5) * 20;
      const y = 0.6 + ((i * 29) % 100) / 100 * 2.4;
      const z = 3.5 - ((i * 53) % 100) / 100 * 42;
      this.fireflyBase[i * 3] = this.fireflyPositions[i * 3] = x;
      this.fireflyBase[i * 3 + 1] = this.fireflyPositions[i * 3 + 1] = y;
      this.fireflyBase[i * 3 + 2] = this.fireflyPositions[i * 3 + 2] = z;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.fireflyPositions, 3));

    this.fireflies = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        map: assets.glowMap,
        color: 0xffd9a0,
        size: 0.24,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(this.fireflies);

    this.leavesMesh = this.buildWindLeaves(scene);
    this.wispsMesh = this.buildWindWisps(scene);
    this.batsMesh = this.buildFlyingBats(scene);

    this.applyBudgets(tier, false);
    this.updateLeaves(0);
    this.updateWisps(0);
    this.updateBats(0);
  }

  private buildWindLeaves(scene: THREE.Scene): THREE.InstancedMesh {
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, -0.09);
    leafShape.quadraticCurveTo(0.058, -0.02, 0.038, 0.055);
    leafShape.quadraticCurveTo(0.016, 0.095, 0, 0.115);
    leafShape.quadraticCurveTo(-0.016, 0.095, -0.038, 0.055);
    leafShape.quadraticCurveTo(-0.058, -0.02, 0, -0.09);
    const leafGeo = new THREE.ShapeGeometry(leafShape, 2);

    const leafMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      emissive: new THREE.Color('#1a2218'),
      emissiveIntensity: 0.45,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.InstancedMesh(leafGeo, leafMat, MAX_LEAVES);
    const tint = new THREE.Color();
    const palette = [0x9e7a52, 0x7f6244, 0x677d56, 0x8f714e, 0x5d725b];

    for (let i = 0; i < MAX_LEAVES; i += 1) {
      const r1 = ((i * 73 + 17) % 1000) / 1000;
      const r2 = ((i * 137 + 43) % 1000) / 1000;
      const r3 = ((i * 223 + 89) % 1000) / 1000;
      const r4 = ((i * 311 + 19) % 1000) / 1000;
      this.leafData.push({
        x0: (r1 - 0.5) * 40,
        yBase: 0.45 + r2 * 4.2,
        z0: 7.5 - r3 * 42,
        speedX: 1.65 + r4 * 2.25,
        speedZ: (r2 - 0.45) * 0.45,
        swirlAmp: 0.38 + r1 * 0.85,
        swirlFreq: 1.25 + r4 * 1.95,
        phase: r3 * Math.PI * 2,
        scale: 0.95 + r2 * 0.95,
        spinSpeed: 1.9 + r1 * 3.4,
      });

      tint.setHex(palette[i % palette.length]);
      mesh.setColorAt(i, tint);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);
    return mesh;
  }

  private buildWindWisps(scene: THREE.Scene): THREE.InstancedMesh {
    const wispGeo = new THREE.PlaneGeometry(4.4, 0.22);
    const wispMat = new THREE.MeshBasicMaterial({
      map: createWindStreakTexture(),
      color: 0xa6bcf0,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.InstancedMesh(wispGeo, wispMat, MAX_WISPS);

    for (let i = 0; i < MAX_WISPS; i += 1) {
      const r1 = ((i * 97 + 11) % 1000) / 1000;
      const r2 = ((i * 193 + 37) % 1000) / 1000;
      this.wispData.push({
        x0: (r1 - 0.5) * 42,
        y0: 0.9 + r2 * 3.8,
        z0: 4.5 - (i / MAX_WISPS) * 44,
        speed: 3.4 + r1 * 2.6,
        phase: i * 1.3,
        len: 0.85 + r2 * 0.95,
      });
    }
    scene.add(mesh);
    return mesh;
  }

  private buildFlyingBats(scene: THREE.Scene): THREE.InstancedMesh {
    // Gothic bat silhouette along XZ plane (wings span along +/- X, head toward +Z)
    const batShape = new THREE.Shape();
    // Head + ears at +Y in 2D shape (rotated to +Z in 3D)
    batShape.moveTo(0, 0.14);
    batShape.lineTo(0.035, 0.21); // right ear
    batShape.lineTo(0.055, 0.12);
    batShape.quadraticCurveTo(0.24, 0.2, 0.56, 0.1); // right upper wing
    batShape.quadraticCurveTo(0.41, 0.01, 0.34, -0.06); // outer scallop
    batShape.quadraticCurveTo(0.22, -0.02, 0.15, -0.1); // inner scallop
    batShape.quadraticCurveTo(0.06, -0.05, 0.025, -0.14); // tail flank
    batShape.lineTo(0, -0.19); // tail tip
    batShape.lineTo(-0.025, -0.14);
    batShape.quadraticCurveTo(-0.06, -0.05, -0.15, -0.1);
    batShape.quadraticCurveTo(-0.22, -0.02, -0.34, -0.06);
    batShape.quadraticCurveTo(-0.41, 0.01, -0.56, 0.1); // left upper wing
    batShape.quadraticCurveTo(-0.24, 0.2, -0.055, 0.12);
    batShape.lineTo(-0.035, 0.21); // left ear
    batShape.closePath();

    const batGeo = new THREE.ShapeGeometry(batShape, 3);
    batGeo.rotateX(Math.PI / 2);

    const wingPhases = new Float32Array(MAX_BATS);
    const wingSpeeds = new Float32Array(MAX_BATS);
    for (let i = 0; i < MAX_BATS; i += 1) {
      wingPhases[i] = i * 1.45;
      wingSpeeds[i] = 9.5 + (i % 5) * 1.35;

      const r1 = ((i * 109 + 29) % 1000) / 1000;
      const r2 = ((i * 181 + 53) % 1000) / 1000;
      const r3 = ((i * 271 + 71) % 1000) / 1000;
      const highFlock = i < 10;
      this.batData.push({
        cx: highFlock ? (r1 - 0.5) * 26 : (r1 - 0.5) * 14,
        cy: highFlock ? 7.8 + r2 * 7.0 : 4.2 + r2 * 2.8,
        cz: highFlock ? -18 - r3 * 30 : -7 - r3 * 16,
        rx: 5.5 + r1 * 8.5,
        rz: 3.5 + r3 * 6.5,
        ry: 0.7 + r2 * 1.3,
        speed: (0.24 + r3 * 0.28) * (i % 2 === 0 ? 1 : -1),
        phase: r1 * Math.PI * 2,
        dir: i % 2 === 0 ? 1 : -1,
        scale: highFlock ? 0.78 + r2 * 0.55 : 0.62 + r2 * 0.35,
      });
    }

    batGeo.setAttribute('aWingPhase', new THREE.InstancedBufferAttribute(wingPhases, 1));
    batGeo.setAttribute('aWingSpeed', new THREE.InstancedBufferAttribute(wingSpeeds, 1));

    const batMat = new THREE.MeshBasicMaterial({
      color: 0x0e1320,
      side: THREE.DoubleSide,
    });
    batMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.batUniforms.uTime;
      shader.vertexShader = `uniform float uTime;\nattribute float aWingPhase;\nattribute float aWingSpeed;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         float wingSpan = abs(position.x);
         float flap = sin(uTime * aWingSpeed + aWingPhase) * 0.92;
         float fold = clamp((wingSpan - 0.05) / 0.51, 0.0, 1.0);
         transformed.y += (sin(flap) * wingSpan * 0.88) * fold;
         transformed.x *= 1.0 - (1.0 - cos(flap)) * 0.22 * fold;`,
      );
    };

    const batsMesh = new THREE.InstancedMesh(batGeo, batMat, MAX_BATS);
    batsMesh.frustumCulled = false;
    scene.add(batsMesh);
    return batsMesh;
  }

  public setTier(tier: QualityTier, reducedMotion: boolean): void {
    this.applyBudgets(tier, reducedMotion);
    this.mistPlanes.forEach((m, idx) => {
      m.visible = tier !== 'low' || idx < 2;
    });
  }

  private applyBudgets(tier: QualityTier, reducedMotion: boolean): void {
    const fireflyCount = tier === 'high' ? MAX_FIREFLIES : tier === 'medium' ? 32 : 16;
    const leafCount = tier === 'high' ? MAX_LEAVES : tier === 'medium' ? 72 : 36;
    const wispCount = tier === 'high' ? MAX_WISPS : tier === 'medium' ? 8 : 4;
    const batCount = tier === 'high' ? MAX_BATS : tier === 'medium' ? 10 : 6;

    this.fireflies.geometry.setDrawRange(0, fireflyCount);
    this.fireflies.visible = !reducedMotion;

    this.leavesMesh.count = leafCount;
    this.leavesMesh.visible = !reducedMotion;

    this.wispsMesh.count = wispCount;
    this.wispsMesh.visible = !reducedMotion;

    this.batsMesh.count = batCount;
    this.batsMesh.visible = !reducedMotion;
  }

  public update(elapsedSec: number, reducedMotion: boolean): void {
    if (reducedMotion) return;

    this.batUniforms.uTime.value = elapsedSec;

    this.mistPlanes.forEach((mist) => {
      const baseX = Number(mist.userData.baseX || 0);
      const phase = Number(mist.userData.phase || 0);
      mist.position.x = baseX + Math.sin(elapsedSec * 0.09 + phase) * 2.2;
      (mist.material as THREE.MeshBasicMaterial).opacity =
        0.19 + Math.sin(elapsedSec * 0.35 + phase) * 0.05;
    });

    (this.fireflies.material as THREE.PointsMaterial).opacity =
      0.75 + Math.sin(elapsedSec * 1.9) * 0.18;

    const attr = this.fireflies.geometry.getAttribute('position') as THREE.BufferAttribute;
    const count = this.fireflies.geometry.drawRange.count;
    for (let i = 0; i < count; i += 1) {
      const bx = this.fireflyBase[i * 3];
      const by = this.fireflyBase[i * 3 + 1];
      const bz = this.fireflyBase[i * 3 + 2];
      this.fireflyPositions[i * 3] = bx + Math.sin(elapsedSec * 0.65 + i) * 0.48;
      this.fireflyPositions[i * 3 + 1] = by + Math.cos(elapsedSec * 0.85 + i * 1.3) * 0.32;
      this.fireflyPositions[i * 3 + 2] = bz + Math.sin(elapsedSec * 0.52 + i * 0.8) * 0.42;
    }
    attr.needsUpdate = true;

    this.updateLeaves(elapsedSec);
    this.updateWisps(elapsedSec);
    this.updateBats(elapsedSec);
  }

  private updateLeaves(elapsedSec: number): void {
    const gust = 1.0 + 0.45 * Math.sin(elapsedSec * 0.48) + 0.22 * Math.cos(elapsedSec * 1.12);
    const activeCount = this.leavesMesh.count;

    for (let i = 0; i < activeCount; i += 1) {
      const d = this.leafData[i];
      // Continuous left-to-right wind drift wrapping seamlessly over [-20, +20]
      const spanX = 40;
      const rawX = d.x0 + elapsedSec * d.speedX * 1.15 + Math.sin(elapsedSec * 0.5 + d.phase) * 0.9 * gust;
      const x = ((((rawX + 20) % spanX) + spanX) % spanX) - 20;

      const spanZ = 48;
      const rawZ = d.z0 + elapsedSec * d.speedZ + Math.cos(elapsedSec * d.swirlFreq * 0.5 + d.phase) * d.swirlAmp;
      const z = 8 - ((((8 - rawZ) % spanZ) + spanZ) % spanZ);

      const groundY = getTerrainHeight(x, z);
      const lift = Math.sin(elapsedSec * d.swirlFreq + d.phase) * 0.55 + 0.35 * Math.cos(elapsedSec * 0.7 + i);
      const y = Math.max(groundY + 0.22, d.yBase + lift * gust * 0.55);

      this.dummy.position.set(x, y, z);
      this.dummy.rotation.set(
        elapsedSec * d.spinSpeed + d.phase,
        elapsedSec * d.spinSpeed * 0.72 + i,
        Math.sin(elapsedSec * d.swirlFreq + d.phase) * 1.3,
      );
      this.dummy.scale.setScalar(d.scale);
      this.dummy.updateMatrix();
      this.leavesMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.leavesMesh.instanceMatrix.needsUpdate = true;
  }

  private updateWisps(elapsedSec: number): void {
    const activeCount = this.wispsMesh.count;
    const spanX = 44;
    for (let i = 0; i < activeCount; i += 1) {
      const w = this.wispData[i];
      const rawX = w.x0 + elapsedSec * w.speed;
      const x = ((((rawX + 22) % spanX) + spanX) % spanX) - 22;
      const y = w.y0 + Math.sin(elapsedSec * 0.9 + w.phase) * 0.25;
      const z = w.z0 + Math.cos(elapsedSec * 0.6 + w.phase) * 0.45;

      this.dummy.position.set(x, y, z);
      this.dummy.rotation.set(0.15, 0, Math.sin(elapsedSec * 0.8 + w.phase) * 0.08);
      this.dummy.scale.set(w.len, 1, 1);
      this.dummy.updateMatrix();
      this.wispsMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.wispsMesh.instanceMatrix.needsUpdate = true;
  }

  private updateBats(elapsedSec: number): void {
    const activeCount = this.batsMesh.count;
    const windShift = Math.sin(elapsedSec * 0.35) * 1.4;

    for (let i = 0; i < activeCount; i += 1) {
      const b = this.batData[i];
      const t = elapsedSec * b.speed + b.phase;

      // Figure-8 / sweeping elliptical flight path
      const x = b.cx + Math.cos(t) * b.rx + Math.sin(t * 2) * 1.1 + windShift * 0.4;
      const z = b.cz + Math.sin(t) * b.rz;
      const y = b.cy + Math.sin(t * 2.1 + b.phase) * b.ry;

      // Analytic velocity tangent for natural heading & banking
      const vx = (-Math.sin(t) * b.rx + Math.cos(t * 2) * 2.2) * b.speed;
      const vz = Math.cos(t) * b.rz * b.speed;
      const vy = Math.cos(t * 2.1 + b.phase) * b.ry * b.speed * 2.1;

      const heading = Math.atan2(vx, vz);
      const bank = Math.sin(t) * 0.28 * b.dir;
      const pitch = -Math.atan2(vy, Math.hypot(vx, vz) + 0.001) * 0.55;

      this.dummy.position.set(x, y, z);
      this.dummy.rotation.set(pitch, heading, bank);
      this.dummy.scale.setScalar(b.scale);
      this.dummy.updateMatrix();
      this.batsMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.batsMesh.instanceMatrix.needsUpdate = true;
  }
}
