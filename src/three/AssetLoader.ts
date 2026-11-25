import * as THREE from 'three';

function heightToNormalTexture(
  heightCanvas: HTMLCanvasElement,
  strength = 2.2,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const ctx = heightCanvas.getContext('2d')!;
  const src = ctx.getImageData(0, 0, w, h).data;

  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = w;
  normalCanvas.height = h;
  const nCtx = normalCanvas.getContext('2d')!;
  const dst = nCtx.createImageData(w, h);

  const sample = (x: number, y: number) => {
    const cx = (x + w) % w;
    const cy = (y + h) % h;
    return src[(cy * w + cx) * 4] / 255;
  };

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const dx = (sample(x + 1, y) - sample(x - 1, y)) * strength;
      const dy = (sample(x, y + 1) - sample(x, y - 1)) * strength;
      const nz = 1.0;
      const len = Math.hypot(dx, dy, nz);
      const idx = (y * w + x) * 4;
      dst.data[idx] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      dst.data[idx + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      dst.data[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      dst.data[idx + 3] = 255;
    }
  }
  nCtx.putImageData(dst, 0, 0);

  const tex = new THREE.CanvasTexture(normalCanvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  return tex;
}

export interface PBRMapSet {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

export class AssetLoader {
  public readonly stonePBR: PBRMapSet;
  public readonly cobblePBR: PBRMapSet;
  public readonly woodPBR: PBRMapSet;
  public readonly grassMap: THREE.CanvasTexture;
  public readonly moonMap: THREE.CanvasTexture;
  public readonly glowMap: THREE.CanvasTexture;
  public readonly mistMap: THREE.CanvasTexture;
  public readonly signTextMap: THREE.CanvasTexture;
  public readonly signEmissiveMap: THREE.CanvasTexture;
  public readonly envMap: THREE.Texture;

  constructor(renderer: THREE.WebGLRenderer) {
    const maxAniso = Math.min(16, renderer.capabilities.getMaxAnisotropy());
    this.stonePBR = this.buildStonePBR(maxAniso);
    this.cobblePBR = this.buildCobblePBR(maxAniso);
    this.woodPBR = this.buildWoodPBR(maxAniso);
    this.grassMap = this.buildGrassMap(maxAniso);
    this.moonMap = this.buildMoonMap();
    this.glowMap = this.buildGlowMap();
    this.mistMap = this.buildMistMap();
    const { textMap, emissiveMap } = this.buildSignMaps(maxAniso);
    this.signTextMap = textMap;
    this.signEmissiveMap = emissiveMap;
    this.envMap = this.buildNightPMREM(renderer);
  }

  private buildStonePBR(aniso: number): PBRMapSet {
    const size = 512;
    const albedoC = document.createElement('canvas');
    const heightC = document.createElement('canvas');
    const roughC = document.createElement('canvas');
    albedoC.width = heightC.width = roughC.width = size;
    albedoC.height = heightC.height = roughC.height = size;

    const aCtx = albedoC.getContext('2d')!;
    const hCtx = heightC.getContext('2d')!;
    const rCtx = roughC.getContext('2d')!;

    const grad = aCtx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#858583');
    grad.addColorStop(0.65, '#70747d');
    grad.addColorStop(1, '#4d5b49');
    aCtx.fillStyle = grad;
    aCtx.fillRect(0, 0, size, size);

    hCtx.fillStyle = '#808080';
    hCtx.fillRect(0, 0, size, size);
    rCtx.fillStyle = '#e0e0e0';
    rCtx.fillRect(0, 0, size, size);

    for (let i = 0; i < 65; i += 1) {
      const x = (i * 89) % size;
      const w = 4 + (i % 9);
      const len = 140 + ((i * 37) % 260);
      aCtx.fillStyle = 'rgba(28, 32, 40, 0.14)';
      aCtx.fillRect(x, 0, w, len);
      hCtx.fillStyle = 'rgba(95, 95, 95, 0.35)';
      hCtx.fillRect(x, 0, w, len);
    }

    for (let i = 0; i < 8000; i += 1) {
      const x = (i * 73) % size;
      const y = (i * 139) % size;
      const v = 90 + ((i * 29) % 70);
      aCtx.fillStyle = `rgba(${v}, ${v + 2}, ${v + 5}, 0.25)`;
      aCtx.fillRect(x, y, 2, 2);

      const hv = 105 + ((i * 41) % 55);
      hCtx.fillStyle = `rgb(${hv}, ${hv}, ${hv})`;
      hCtx.fillRect(x, y, 2, 2);
    }

    for (let i = 0; i < 320; i += 1) {
      const x = (i * 47) % size;
      const y = size * 0.72 + ((i * 61) % (size * 0.28));
      const r = 3 + (i % 7);
      aCtx.fillStyle = 'rgba(63, 90, 58, 0.32)';
      aCtx.beginPath();
      aCtx.arc(x, y, r, 0, Math.PI * 2);
      aCtx.fill();
      rCtx.fillStyle = '#f2f2f2';
      rCtx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    const map = new THREE.CanvasTexture(albedoC);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = aniso;

    const normalMap = heightToNormalTexture(heightC, 2.4, 1, 1);
    normalMap.anisotropy = aniso;

    const roughnessMap = new THREE.CanvasTexture(roughC);
    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.anisotropy = aniso;

    return { map, normalMap, roughnessMap };
  }

  private buildCobblePBR(aniso: number): PBRMapSet {
    const size = 512;
    const albedoC = document.createElement('canvas');
    const heightC = document.createElement('canvas');
    const roughC = document.createElement('canvas');
    albedoC.width = heightC.width = roughC.width = size;
    albedoC.height = heightC.height = roughC.height = size;

    const aCtx = albedoC.getContext('2d')!;
    const hCtx = heightC.getContext('2d')!;
    const rCtx = roughC.getContext('2d')!;

    aCtx.fillStyle = '#18211a';
    aCtx.fillRect(0, 0, size, size);
    hCtx.fillStyle = '#202020';
    hCtx.fillRect(0, 0, size, size);
    rCtx.fillStyle = '#dcdcdc';
    rCtx.fillRect(0, 0, size, size);

    const rows = 9;
    const cols = 7;
    const cellW = size / cols;
    const cellH = size / rows;

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const seed = r * 31 + c * 17;
        const offset = (r % 2) * (cellW * 0.48);
        const cx = ((c * cellW + offset) % size) + ((seed % 5) - 2) * 2;
        const cy = r * cellH + ((seed % 7) - 3) * 1.5;
        const w = cellW * (0.78 + (seed % 3) * 0.05);
        const h = cellH * (0.74 + (seed % 4) * 0.04);

        const shade = 98 + (seed % 46);
        aCtx.fillStyle = `rgb(${shade}, ${shade + 6}, ${shade + 16})`;
        aCtx.beginPath();
        aCtx.roundRect(cx + 4, cy + 4, w, h, 14);
        aCtx.fill();

        const heightVal = 185 + (seed % 65);
        hCtx.fillStyle = `rgb(${heightVal}, ${heightVal}, ${heightVal})`;
        hCtx.beginPath();
        hCtx.roundRect(cx + 5, cy + 5, w - 2, h - 2, 14);
        hCtx.fill();

        const roughVal = 56 + (seed % 34);
        rCtx.fillStyle = `rgb(${roughVal}, ${roughVal}, ${roughVal})`;
        rCtx.beginPath();
        rCtx.roundRect(cx + 6, cy + 6, w - 4, h - 4, 14);
        rCtx.fill();
      }
    }

    const repeatX = 1.6;
    const repeatY = 18;
    const map = new THREE.CanvasTexture(albedoC);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(repeatX, repeatY);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = aniso;

    const normalMap = heightToNormalTexture(heightC, 3.6, repeatX, repeatY);
    normalMap.anisotropy = aniso;

    const roughnessMap = new THREE.CanvasTexture(roughC);
    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(repeatX, repeatY);
    roughnessMap.anisotropy = aniso;

    return { map, normalMap, roughnessMap };
  }

  private buildWoodPBR(aniso: number): PBRMapSet {
    const size = 512;
    const albedoC = document.createElement('canvas');
    const heightC = document.createElement('canvas');
    const roughC = document.createElement('canvas');
    albedoC.width = heightC.width = roughC.width = size;
    albedoC.height = heightC.height = roughC.height = size;

    const aCtx = albedoC.getContext('2d')!;
    const hCtx = heightC.getContext('2d')!;
    const rCtx = roughC.getContext('2d')!;

    aCtx.fillStyle = '#3d2a1c';
    aCtx.fillRect(0, 0, size, size);
    hCtx.fillStyle = '#888888';
    hCtx.fillRect(0, 0, size, size);
    rCtx.fillStyle = '#d4d4d4';
    rCtx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += 3) {
      const wave = Math.sin(y * 0.08) * 14;
      const shade = 42 + ((y * 13) % 24);
      aCtx.strokeStyle = `rgba(${shade + 18}, ${shade + 4}, ${shade - 8}, 0.55)`;
      aCtx.lineWidth = 2;
      aCtx.beginPath();
      aCtx.moveTo(0, y);
      aCtx.bezierCurveTo(size * 0.33, y + wave, size * 0.66, y - wave, size, y);
      aCtx.stroke();

      const hVal = 110 + ((y * 17) % 50);
      hCtx.strokeStyle = `rgb(${hVal}, ${hVal}, ${hVal})`;
      hCtx.beginPath();
      hCtx.moveTo(0, y);
      hCtx.lineTo(size, y);
      hCtx.stroke();
    }

    const map = new THREE.CanvasTexture(albedoC);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = aniso;
    const normalMap = heightToNormalTexture(heightC, 2.0, 1, 1);
    normalMap.anisotropy = aniso;
    const roughnessMap = new THREE.CanvasTexture(roughC);
    roughnessMap.anisotropy = aniso;

    return { map, normalMap, roughnessMap };
  }

  private buildGrassMap(aniso: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#152319';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 9500; i += 1) {
      const x = (i * 53) % 512;
      const y = (i * 97) % 512;
      const g = 24 + ((i * 19) % 30);
      ctx.fillStyle = `rgba(${Math.round(g * 0.58)}, ${g + 12}, ${Math.round(g * 0.6)}, 0.45)`;
      ctx.fillRect(x, y, 2, 4);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(28, 28);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = aniso;
    return tex;
  }

  private buildMoonMap(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 250);
    grad.addColorStop(0, '#fdfeff');
    grad.addColorStop(0.72, '#dce6ff');
    grad.addColorStop(1, '#b6c6ec');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const maria = [
      [178, 175, 68, 0.16],
      [310, 148, 48, 0.13],
      [330, 286, 74, 0.17],
      [196, 336, 56, 0.14],
      [250, 240, 36, 0.11],
      [130, 255, 42, 0.12],
    ];
    for (const [cx, cy, r, a] of maria) {
      ctx.fillStyle = `rgba(116, 134, 172, ${a})`;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private buildGlowMap(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(128, 128, 2, 128, 128, 102);
    g.addColorStop(0, 'rgba(255, 224, 168, 0.95)');
    g.addColorStop(0.22, 'rgba(255, 180, 90, 0.55)');
    g.addColorStop(0.55, 'rgba(255, 150, 60, 0.16)');
    g.addColorStop(1, 'rgba(255, 140, 40, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private buildMistMap(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 512);

    for (let i = 0; i < 36; i += 1) {
      const ang = (i * 2.399) % (Math.PI * 2);
      const dist = 30 + ((i * 37) % 110);
      const x = 256 + Math.cos(ang) * dist;
      const y = 256 + Math.sin(ang) * dist;
      const r = 55 + (i % 4) * 20;
      const g = ctx.createRadialGradient(x, y, 2, x, y, r);
      g.addColorStop(0, 'rgba(205, 220, 255, 0.16)');
      g.addColorStop(1, 'rgba(205, 220, 255, 0.0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Smooth radial edge fade so sprite bounds are completely invisible
    ctx.globalCompositeOperation = 'destination-in';
    const mask = ctx.createRadialGradient(256, 256, 40, 256, 256, 236);
    mask.addColorStop(0, 'rgba(255, 255, 255, 1)');
    mask.addColorStop(0.65, 'rgba(255, 255, 255, 0.6)');
    mask.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, 512, 512);
    ctx.globalCompositeOperation = 'source-over';

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private buildSignMaps(aniso: number): {
    textMap: THREE.CanvasTexture;
    emissiveMap: THREE.CanvasTexture;
  } {
    const w = 1024;
    const h = 512;
    const c = document.createElement('canvas');
    const e = document.createElement('canvas');
    c.width = e.width = w;
    c.height = e.height = h;

    const cCtx = c.getContext('2d')!;
    const eCtx = e.getContext('2d')!;

    cCtx.fillStyle = '#3b281a';
    cCtx.fillRect(0, 0, w, h);
    for (let y = 8; y < h; y += 14) {
      cCtx.strokeStyle = 'rgba(18, 10, 4, 0.38)';
      cCtx.lineWidth = 3;
      cCtx.beginPath();
      cCtx.moveTo(0, y);
      cCtx.lineTo(w, y + (y % 28 === 0 ? 5 : -4));
      cCtx.stroke();
    }

    eCtx.fillStyle = '#000000';
    eCtx.fillRect(0, 0, w, h);

    const drawSignText = (ctx: CanvasRenderingContext2D, color: string) => {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.font = '600 84px "Cormorant Garamond", Georgia, serif';
      ctx.fillText('Add Your', 450, 198);
      ctx.fillText('Regret', 450, 304);

      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(790, 256, 52, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(766, 256);
      ctx.lineTo(814, 256);
      ctx.moveTo(790, 232);
      ctx.lineTo(790, 280);
      ctx.stroke();
    };

    drawSignText(cCtx, '#ffd9a0');
    drawSignText(eCtx, '#ffb45a');

    const textMap = new THREE.CanvasTexture(c);
    textMap.colorSpace = THREE.SRGBColorSpace;
    textMap.anisotropy = aniso;

    const emissiveMap = new THREE.CanvasTexture(e);
    emissiveMap.colorSpace = THREE.SRGBColorSpace;
    emissiveMap.anisotropy = aniso;

    return { textMap, emissiveMap };
  }

  private buildNightPMREM(renderer: THREE.WebGLRenderer): THREE.Texture {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(20, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x162244, side: THREE.BackSide }),
    );
    envScene.add(dome);

    const moonSpot = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xdce6ff }),
    );
    moonSpot.position.set(8, 10, -14);
    envScene.add(moonSpot);

    const lanternSpot = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffb45a }),
    );
    lanternSpot.position.set(-4, 1.5, 4);
    envScene.add(lanternSpot);

    const rt = pmrem.fromScene(envScene, 0.04);
    pmrem.dispose();
    return rt.texture;
  }

  public dispose(): void {
    [this.stonePBR, this.cobblePBR, this.woodPBR].forEach((set) => {
      set.map.dispose();
      set.normalMap.dispose();
      set.roughnessMap.dispose();
    });
    this.grassMap.dispose();
    this.moonMap.dispose();
    this.glowMap.dispose();
    this.mistMap.dispose();
    this.signTextMap.dispose();
    this.signEmissiveMap.dispose();
    this.envMap.dispose();
  }
}
