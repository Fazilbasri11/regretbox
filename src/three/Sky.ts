import * as THREE from 'three';
import type { AssetLoader } from './AssetLoader';

export class Sky {
  private group = new THREE.Group();
  private clouds: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene, assets: AssetLoader) {
    scene.add(this.group);

    // Brighter luminous moonlit indigo sky (#0D1530 -> #1F2E5C -> #384E82)
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        zenith: { value: new THREE.Color('#0D1530') },
        mid: { value: new THREE.Color('#1F2E5C') },
        horizon: { value: new THREE.Color('#384E82') },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 zenith;
        uniform vec3 mid;
        uniform vec3 horizon;
        varying vec3 vWorldPos;
        void main() {
          float h = clamp(normalize(vWorldPos).y, 0.0, 1.0);
          vec3 col = mix(horizon, mid, smoothstep(0.0, 0.25, h));
          col = mix(col, zenith, smoothstep(0.22, 0.85, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.group.add(new THREE.Mesh(new THREE.SphereGeometry(145, 24, 16), skyMat));

    // Subtle stars
    const starCount = 240;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      const theta = (i * 2.39996) % (Math.PI * 2);
      const phi = Math.acos(0.2 + ((i * 0.61803) % 0.78));
      const r = 120;
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
          size: 0.42,
          transparent: true,
          opacity: 0.52,
          fog: false,
        }),
      ),
    );

    // Full Moon back-right matching reference (x ≈ 62%, y ≈ 12%)
    const moonPos = new THREE.Vector3(16.5, 28.5, -88);
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(5.0, 24, 24),
      new THREE.MeshBasicMaterial({
        map: assets.moonMap,
        color: 0xf4f7ff,
        fog: false,
      }),
    );
    moonMesh.position.copy(moonPos);
    this.group.add(moonMesh);

    const innerHalo = new THREE.Sprite(
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
    innerHalo.position.copy(moonPos);
    innerHalo.scale.set(20, 20, 1);
    this.group.add(innerHalo);

    const outerHalo = new THREE.Sprite(
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
    outerHalo.position.copy(moonPos);
    outerHalo.scale.set(42, 42, 1);
    this.group.add(outerHalo);

    // Illuminated drifting cloud wisps
    const cloudConfigs: Array<[number, number, number, number, number, number]> = [
      [12, 23.5, -80, 52, 14, 0.46],
      [-16, 26.5, -82, 58, 16, 0.34],
      [26, 19.5, -76, 46, 12, 0.36],
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
      cloud.userData = { baseX: cx };
      this.group.add(cloud);
      this.clouds.push(cloud);
    }
  }

  public update(elapsedSec: number, reducedMotion: boolean): void {
    if (reducedMotion) return;
    this.clouds.forEach((cloud, idx) => {
      const baseX = Number(cloud.userData.baseX || 0);
      cloud.position.x = baseX + Math.sin(elapsedSec * 0.025 + idx * 1.9) * 5.5;
    });
  }
}
