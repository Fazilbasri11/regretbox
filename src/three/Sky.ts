import * as THREE from 'three';
import type { AssetLoader } from './AssetLoader';

export class Sky {
  private group = new THREE.Group();
  private clouds: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene, assets: AssetLoader) {
    scene.add(this.group);

    // 1. Night Sky Gradient Dome (#0B1026 -> #1B2650 -> #2A3A66)
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        zenith: { value: new THREE.Color('#0B1026') },
        mid: { value: new THREE.Color('#1B2650') },
        horizon: { value: new THREE.Color('#2A3A66') },
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
    this.group.add(new THREE.Mesh(new THREE.SphereGeometry(140, 32, 20), skyMat));

    // 2. Sparse Stars
    const starCount = 320;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      const theta = (i * 2.39996) % (Math.PI * 2);
      const phi = Math.acos(0.18 + ((i * 0.61803) % 0.81));
      const r = 115;
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
          color: 0xdce6ff,
          size: 0.45,
          transparent: true,
          opacity: 0.55,
          fog: false,
        }),
      ),
    );

    // 3. Full Moon positioned back-right matching reference (x ≈ 62%, y ≈ 12%)
    const moonPos = new THREE.Vector3(14.5, 25.5, -78);
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(4.4, 32, 32),
      new THREE.MeshBasicMaterial({
        map: assets.moonMap,
        color: 0xeaf0ff,
        fog: false,
      }),
    );
    moonMesh.position.copy(moonPos);
    this.group.add(moonMesh);

    // 2-Layer Moon Halo (#AFC4FF)
    const innerHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: assets.mistMap,
        color: 0xafc4ff,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    innerHalo.position.copy(moonPos);
    innerHalo.scale.set(17, 17, 1);
    this.group.add(innerHalo);

    const outerHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: assets.mistMap,
        color: 0x8fa6d9,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    outerHalo.position.copy(moonPos);
    outerHalo.scale.set(36, 36, 1);
    this.group.add(outerHalo);

    // 4. Drifting Cloud Bands with Silver Rim (#B9C8F0) near moon lower edge
    const cloudConfigs: Array<[number, number, number, number, number, number]> = [
      [10, 21.8, -72, 46, 12, 0.34],
      [-14, 24.5, -74, 52, 14, 0.24],
      [22, 18.2, -68, 40, 10, 0.26],
    ];
    for (const [cx, cy, cz, w, h, opacity] of cloudConfigs) {
      const cloud = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({
          map: assets.mistMap,
          color: 0xb9c8f0,
          transparent: true,
          opacity,
          depthWrite: false,
          fog: false,
        }),
      );
      cloud.position.set(cx, cy, cz);
      cloud.userData = { baseX: cx, speed: 0.16 + Math.abs(cx) * 0.005 };
      this.group.add(cloud);
      this.clouds.push(cloud);
    }
  }

  public update(elapsedSec: number, reducedMotion: boolean): void {
    if (reducedMotion) return;
    this.clouds.forEach((cloud, idx) => {
      const baseX = Number(cloud.userData.baseX || 0);
      const offset = Math.sin(elapsedSec * 0.025 + idx * 1.9) * 5.5;
      cloud.position.x = baseX + offset;
    });
  }
}
