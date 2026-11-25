import * as THREE from 'three';
import type { AssetLoader } from './AssetLoader';

export class Sky {
  private group = new THREE.Group();
  private skyDome: THREE.Mesh;
  private innerHalo: THREE.Sprite;
  private outerHalo: THREE.Sprite;
  private clouds: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene, assets: AssetLoader) {
    scene.background = new THREE.Color('#0D1530');
    scene.add(this.group);

    // Large sky dome centered dynamically on camera so zooming out NEVER clips it
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        zenith: { value: new THREE.Color('#0D1530') },
        mid: { value: new THREE.Color('#1F2E5C') },
        horizon: { value: new THREE.Color('#384E82') },
      },
      vertexShader: `
        varying vec3 vLocalDir;
        void main() {
          vLocalDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 zenith;
        uniform vec3 mid;
        uniform vec3 horizon;
        varying vec3 vLocalDir;
        void main() {
          float h = clamp(vLocalDir.y, 0.0, 1.0);
          vec3 col = mix(horizon, mid, smoothstep(0.0, 0.25, h));
          col = mix(col, zenith, smoothstep(0.22, 0.85, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.skyDome = new THREE.Mesh(new THREE.SphereGeometry(210, 28, 18), skyMat);
    this.skyDome.renderOrder = -10;
    this.group.add(this.skyDome);

    // Subtle stars
    const starCount = 260;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      const theta = (i * 2.39996) % (Math.PI * 2);
      const phi = Math.acos(0.18 + ((i * 0.61803) % 0.8));
      const r = 175;
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi);
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.group.add(
      new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({
          color: 0xe6efff,
          size: 0.52,
          transparent: true,
          opacity: 0.55,
          fog: false,
        }),
      ),
    );

    // Full Moon positioned back-right (x ≈ 62%, y ≈ 12%)
    const moonPos = new THREE.Vector3(24, 42, -135);
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(7.2, 24, 24),
      new THREE.MeshBasicMaterial({
        map: assets.moonMap,
        color: 0xf4f7ff,
        fog: false,
      }),
    );
    moonMesh.position.copy(moonPos);
    this.group.add(moonMesh);

    this.innerHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: assets.mistMap,
        color: 0xc2d5ff,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    this.innerHalo.position.copy(moonPos);
    this.innerHalo.scale.set(28, 28, 1);
    this.group.add(this.innerHalo);

    this.outerHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: assets.mistMap,
        color: 0x99b3eb,
        transparent: true,
        opacity: 0.36,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    this.outerHalo.position.copy(moonPos);
    this.outerHalo.scale.set(58, 58, 1);
    this.group.add(this.outerHalo);

    // Drifting moonlit clouds
    const cloudConfigs: Array<[number, number, number, number, number, number]> = [
      [18, 34, -120, 74, 18, 0.45],
      [-24, 38, -124, 82, 22, 0.34],
      [38, 28, -112, 66, 16, 0.35],
    ];
    for (const [cx, cy, cz, w, h, opacity] of cloudConfigs) {
      const cloud = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({
          map: assets.mistMap,
          color: 0xc5d4f7,
          transparent: true,
          opacity,
          depthWrite: false,
          fog: false,
        }),
      );
      cloud.position.set(cx, cy, cz);
      cloud.userData = { baseX: cx, baseY: cy, baseOpacity: opacity };
      this.group.add(cloud);
      this.clouds.push(cloud);
    }
  }

  public update(elapsedSec: number, cameraPos: THREE.Vector3, reducedMotion: boolean): void {
    // Keep entire sky sphere, stars, and moon anchored around camera XZ so zooming out never clips
    this.group.position.set(cameraPos.x, 0, cameraPos.z);

    if (reducedMotion) return;

    this.innerHalo.material.opacity = 0.62 + Math.sin(elapsedSec * 0.8) * 0.05;
    this.outerHalo.material.opacity = 0.34 + Math.cos(elapsedSec * 0.55) * 0.04;

    this.clouds.forEach((cloud, idx) => {
      const baseX = Number(cloud.userData.baseX || 0);
      const baseY = Number(cloud.userData.baseY || 0);
      const baseOp = Number(cloud.userData.baseOpacity || 0.35);
      cloud.position.x = baseX + Math.sin(elapsedSec * 0.04 + idx * 1.9) * 8.5;
      cloud.position.y = baseY + Math.cos(elapsedSec * 0.03 + idx) * 0.9;
      (cloud.material as THREE.MeshBasicMaterial).opacity =
        baseOp * (0.9 + Math.sin(elapsedSec * 0.25 + idx) * 0.1);
    });
  }
}
