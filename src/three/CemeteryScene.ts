import * as THREE from 'three';
import { TIME_THEMES, type TimeOfDay } from '../utils/timeTheme';
import type { AssetLoader } from './AssetLoader';
import type { PerformanceManager } from './PerformanceManager';

interface LanternItem {
  light: THREE.PointLight | null;
  bulbMat: THREE.MeshStandardMaterial;
  basePhase: number;
}

export class CemeteryScene {
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly renderer: THREE.WebGLRenderer;
  public readonly signMesh: THREE.Mesh;

  private skyMat: THREE.ShaderMaterial;
  private fog: THREE.FogExp2;
  private hemiLight: THREE.HemisphereLight;
  private keyLight: THREE.DirectionalLight;
  private celestialMesh: THREE.Mesh;
  private celestialMat: THREE.MeshBasicMaterial;
  private starsPoints: THREE.Points;
  private lanterns: LanternItem[] = [];
  private chapelWindowMat: THREE.MeshStandardMaterial;
  private currentThemeId: TimeOfDay = 'night';

  constructor(
    container: HTMLElement,
    assets: AssetLoader,
    private perf: PerformanceManager,
    initialTimeOfDay: TimeOfDay,
  ) {
    this.scene = new THREE.Scene();
    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);

    this.camera = new THREE.PerspectiveCamera(54, width / height, 0.2, 260);
    this.camera.position.set(0, 2.35, 9.5);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !perf.lowGraphics,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(perf.getMaxPixelRatio());
    this.renderer.shadowMap.enabled = !perf.lowGraphics;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    const theme = TIME_THEMES[initialTimeOfDay];
    this.fog = new THREE.FogExp2(theme.fogColor, theme.fogDensity);
    this.scene.fog = this.fog;

    // Sky dome gradient shader
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(theme.skyTop) },
        bottomColor: { value: new THREE.Color(theme.skyHorizon) },
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
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos).y;
          float t = clamp(pow(max(h, 0.0), 0.55), 0.0, 1.0);
          gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
        }
      `,
    });
    const skyGeo = new THREE.SphereGeometry(180, 24, 16);
    this.scene.add(new THREE.Mesh(skyGeo, this.skyMat));

    // Celestial disc (Moon / Sun)
    this.celestialMat = new THREE.MeshBasicMaterial({
      map: assets.moonTexture,
      color: new THREE.Color(theme.celestialColor),
      fog: false,
    });
    this.celestialMesh = new THREE.Mesh(new THREE.SphereGeometry(6.8, 24, 24), this.celestialMat);
    this.scene.add(this.celestialMesh);

    // Starfield
    const starCount = 480;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      const theta = (i * 2.39996) % (Math.PI * 2);
      const phi = Math.acos(0.15 + ((i * 0.61803) % 0.84));
      const r = 155;
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi);
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.starsPoints = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xe6edf8, size: 0.7, fog: false, transparent: true, opacity: 0.85 }),
    );
    this.scene.add(this.starsPoints);

    // Lights
    this.hemiLight = new THREE.HemisphereLight(
      theme.ambientSky,
      theme.ambientGround,
      theme.ambientIntensity,
    );
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(theme.keyLightColor, theme.keyLightIntensity);
    this.keyLight.castShadow = !perf.lowGraphics;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 2;
    this.keyLight.shadow.camera.far = 140;
    this.keyLight.shadow.camera.left = -36;
    this.keyLight.shadow.camera.right = 36;
    this.keyLight.shadow.camera.top = 36;
    this.keyLight.shadow.camera.bottom = -36;
    this.scene.add(this.keyLight);

    // Ground & Winding Cobblestone Path
    const groundMat = new THREE.MeshStandardMaterial({
      map: assets.grassTexture,
      roughness: 0.95,
      metalness: 0.04,
    });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 180), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -40);
    ground.receiveShadow = true;
    this.scene.add(ground);

    const pathMat = new THREE.MeshStandardMaterial({
      map: assets.cobbleTexture,
      roughness: 0.72,
      metalness: 0.08,
    });
    const pathMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 130), pathMat);
    pathMesh.rotation.x = -Math.PI / 2;
    pathMesh.position.set(0, 0.02, -45);
    pathMesh.receiveShadow = true;
    this.scene.add(pathMesh);

    // Build landmarks
    this.buildGrandGate(assets);
    this.chapelWindowMat = this.buildGothicChapel(assets);
    this.signMesh = this.buildWoodenSignpost(assets);
    this.buildLanterns();
    this.buildTreesAndFoliage();
    this.buildZoneMarkers();

    this.applyTimeTheme(initialTimeOfDay);
  }

  private buildGrandGate(assets: AssetLoader): void {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, -26);

    const stoneMat = new THREE.MeshStandardMaterial({
      map: assets.stoneTexture,
      color: 0x6c727c,
      roughness: 0.9,
    });
    const ironMat = new THREE.MeshStandardMaterial({
      color: 0x1a1e26,
      roughness: 0.45,
      metalness: 0.72,
    });

    // Two tall gate pillars
    for (const x of [-4.1, 4.1]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 5.4, 1.5), stoneMat);
      pillar.position.set(x, 2.7, 0);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      gateGroup.add(pillar);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.9, 4), stoneMat);
      cap.position.set(x, 5.85, 0);
      cap.rotation.y = Math.PI / 4;
      gateGroup.add(cap);
    }

    // Iron Archway
    const arch = new THREE.Mesh(new THREE.TorusGeometry(4.1, 0.14, 8, 28, Math.PI), ironMat);
    arch.position.set(0, 4.6, 0);
    gateGroup.add(arch);

    // Central 'R' Medallion
    const crestRing = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.09, 8, 24), ironMat);
    crestRing.position.set(0, 8.7, 0);
    gateGroup.add(crestRing);

    const crestMat = new THREE.MeshStandardMaterial({
      color: 0xe09f3e,
      emissive: 0x8a5814,
      emissiveIntensity: 0.6,
      roughness: 0.4,
    });
    const crestPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.08, 24), crestMat);
    crestPlate.rotation.x = Math.PI / 2;
    crestPlate.position.set(0, 8.7, 0);
    gateGroup.add(crestPlate);

    // Open double iron gates angled slightly welcomingly
    for (const side of [-1, 1]) {
      const leaf = new THREE.Group();
      leaf.position.set(side * 3.3, 0, 0);
      leaf.rotation.y = side * -0.45;
      for (let b = 0; b < 6; b += 1) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 3.8, 6), ironMat);
        bar.position.set(-side * (0.3 + b * 0.48), 1.9, 0);
        leaf.add(bar);
      }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 0.12), ironMat);
      rail.position.set(-side * 1.45, 2.8, 0);
      leaf.add(rail);
      gateGroup.add(leaf);
    }

    // Low stone & iron perimeter fence wings
    for (const side of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(36, 1.3, 0.65), stoneMat);
      wall.position.set(side * 22.8, 0.65, 0);
      wall.receiveShadow = true;
      gateGroup.add(wall);
    }

    this.scene.add(gateGroup);
  }

  private buildGothicChapel(assets: AssetLoader): THREE.MeshStandardMaterial {
    const chapel = new THREE.Group();
    chapel.position.set(19.5, 0, -16.5);
    chapel.rotation.y = -0.35;

    const stoneMat = new THREE.MeshStandardMaterial({
      map: assets.stoneTexture,
      color: 0x5c626d,
      roughness: 0.92,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x222833,
      roughness: 0.85,
    });
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0xffcf7d,
      emissive: 0xff9a2e,
      emissiveIntensity: 2.0,
      roughness: 0.2,
    });

    // Main nave
    const body = new THREE.Mesh(new THREE.BoxGeometry(7.2, 5.2, 10.5), stoneMat);
    body.position.set(0, 2.6, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    chapel.add(body);

    // Pitched roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(6.2, 4.4, 4), roofMat);
    roof.position.set(0, 7.2, 0);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(0.85, 1, 1.35);
    roof.castShadow = true;
    chapel.add(roof);

    // Arched glowing front window & doorway
    const frontWindow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.2), windowMat);
    frontWindow.position.set(0, 2.4, 5.28);
    chapel.add(frontWindow);

    const sideWin1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.9, 1.1), windowMat);
    sideWin1.position.set(-3.62, 2.5, 2.2);
    chapel.add(sideWin1);

    const sideWin2 = sideWin1.clone();
    sideWin2.position.set(-3.62, 2.5, -2.0);
    chapel.add(sideWin2);

    this.scene.add(chapel);
    return windowMat;
  }

  private buildWoodenSignpost(assets: AssetLoader): THREE.Mesh {
    const group = new THREE.Group();
    group.position.set(4.5, 0, 3.2);
    group.rotation.y = -0.35;

    const postMat = new THREE.MeshStandardMaterial({ color: 0x36261a, roughness: 0.92 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 1.65, 8), postMat);
    post.position.y = 0.82;
    post.castShadow = true;
    group.add(post);

    const boardMat = new THREE.MeshStandardMaterial({
      map: assets.signTexture,
      roughness: 0.85,
    });
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.78, 0.12), boardMat);
    board.position.set(0, 1.28, 0);
    board.castShadow = true;
    board.userData = { isBurySign: true };
    group.add(board);

    this.scene.add(group);
    return board;
  }

  private buildLanterns(): void {
    const coords: Array<[number, number, boolean]> = [
      [-3.1, 2.2, true],
      [3.1, -3.5, true],
      [-3.1, -11.5, true],
      [3.1, -18.5, false],
      [-4.1, -26.0, true],
      [4.1, -26.0, true],
      [-3.2, -36.0, false],
      [3.2, -46.0, false],
    ];

    const postMat = new THREE.MeshStandardMaterial({ color: 0x2c323b, roughness: 0.85 });

    coords.forEach(([x, z, hasDynamicLight], idx) => {
      const isGateLantern = Math.abs(z + 26) < 0.2;
      const baseH = isGateLantern ? 5.9 : 1.05;

      if (!isGateLantern) {
        const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.75, 0.45), postMat);
        pedestal.position.set(x, 0.37, z);
        pedestal.castShadow = true;
        this.scene.add(pedestal);
      }

      const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xffd28a,
        emissive: 0xff9d2e,
        emissiveIntensity: 2.2,
      });

      const lanternCage = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.44, 0.32), bulbMat);
      lanternCage.position.set(x, baseH, z);
      this.scene.add(lanternCage);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.25, 4), postMat);
      cap.position.set(x, baseH + 0.32, z);
      cap.rotation.y = Math.PI / 4;
      this.scene.add(cap);

      let light: THREE.PointLight | null = null;
      if (hasDynamicLight && (!this.perf.lowGraphics || idx < 2)) {
        light = new THREE.PointLight(0xffa742, 2.2, 14, 1.7);
        light.position.set(x, baseH + 0.1, z);
        this.scene.add(light);
      }

      this.lanterns.push({
        light,
        bulbMat,
        basePhase: idx * 1.37,
      });
    });
  }

  private buildTreesAndFoliage(): void {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x201b19, roughness: 0.96 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x16241b, roughness: 0.92 });
    const blossomWhite = new THREE.MeshStandardMaterial({ color: 0xd9d5ca, roughness: 0.8 });
    const blossomPurple = new THREE.MeshStandardMaterial({ color: 0x5c5b91, roughness: 0.8 });

    const treePositions: Array<[number, number, number]> = [
      [-14, 5, 1.3],
      [-21, -8, 1.5],
      [-23, -22, 1.2],
      [15, -3, 1.1],
      [25, -24, 1.4],
      [-18, -38, 1.45],
      [17, -40, 1.35],
      [-22, -56, 1.6],
      [21, -58, 1.5],
    ];

    for (const [x, z, s] of treePositions) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * s, 0.42 * s, 4.4 * s, 7), trunkMat);
      trunk.position.set(x, 2.2 * s, z);
      trunk.castShadow = !this.perf.lowGraphics;
      this.scene.add(trunk);

      const canopy1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.1 * s, 1), leafMat);
      canopy1.position.set(x, 4.8 * s, z);
      canopy1.castShadow = !this.perf.lowGraphics;
      this.scene.add(canopy1);

      const canopy2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.55 * s, 1), leafMat);
      canopy2.position.set(x + 1.1 * s, 4.2 * s, z - 0.6 * s);
      this.scene.add(canopy2);
    }

    // Flower clusters along foreground path
    const flowerSpots: Array<[number, number, boolean]> = [
      [-3.9, 2.6, true],
      [-5.2, 0.4, false],
      [4.0, -2.5, true],
      [-4.2, -5.8, false],
      [5.4, -5.2, true],
    ];
    for (const [x, z, isWhite] of flowerSpots) {
      const cluster = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.32, 0),
        isWhite ? blossomWhite : blossomPurple,
      );
      cluster.scale.set(1.4, 0.65, 1.2);
      cluster.position.set(x, 0.16, z);
      this.scene.add(cluster);
    }
  }

  private buildZoneMarkers(): void {
    const markerMat = new THREE.MeshStandardMaterial({ color: 0x3a414c, roughness: 0.9 });
    const zones: Array<[number, number]> = [
      [-4.4, -22],
      [-4.4, -33],
      [11.5, -39],
    ];
    for (const [x, z] of zones) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.25, 0.22), markerMat);
      post.position.set(x, 0.62, z);
      this.scene.add(post);
    }
  }

  public applyTimeTheme(timeOfDay: TimeOfDay): void {
    this.currentThemeId = timeOfDay;
    const theme = TIME_THEMES[timeOfDay];

    this.skyMat.uniforms.topColor.value.set(theme.skyTop);
    this.skyMat.uniforms.bottomColor.value.set(theme.skyHorizon);
    this.fog.color.set(theme.fogColor);
    this.fog.density = this.perf.lowGraphics ? theme.fogDensity * 0.85 : theme.fogDensity;

    this.hemiLight.color.set(theme.ambientSky);
    this.hemiLight.groundColor.set(theme.ambientGround);
    this.hemiLight.intensity = theme.ambientIntensity;

    this.keyLight.color.set(theme.keyLightColor);
    this.keyLight.intensity = theme.keyLightIntensity;
    this.keyLight.position.set(...theme.keyLightPos);

    this.celestialMat.color.set(theme.celestialColor);
    this.celestialMesh.position.set(...theme.celestialPos);
    this.starsPoints.visible = theme.showStars;

    this.chapelWindowMat.emissiveIntensity = theme.chapelWindowIntensity;
    for (const l of this.lanterns) {
      l.bulbMat.emissiveIntensity = theme.lanternIntensity;
      if (l.light) l.light.intensity = theme.lanternIntensity;
    }
  }

  public update(elapsedSec: number): void {
    const baseIntensity = TIME_THEMES[this.currentThemeId].lanternIntensity;
    if (baseIntensity <= 0.3) return;
    for (const l of this.lanterns) {
      const flicker = Math.sin(elapsedSec * 2.6 + l.basePhase) * 0.14;
      if (l.light) {
        l.light.intensity = Math.max(0.1, baseIntensity + flicker);
      }
      l.bulbMat.emissiveIntensity = Math.max(0.2, baseIntensity + flicker * 0.8);
    }
  }

  public resize(width: number, height: number): void {
    const w = Math.max(width, 320);
    const h = Math.max(height, 320);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(this.perf.getMaxPixelRatio());
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.renderer.dispose();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}
