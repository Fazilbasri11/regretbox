import * as THREE from 'three';

function heightToNormalTexture(
  heightCanvas: HTMLCanvasElement,
  strength = 2.0,
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
    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
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
    const size = 256;
    const albedoC = document.createElement('canvas');
    const heightC = document.createElement('canvas');
    const roughC = document.createElement('canvas');
    albedoC.width = heightC.width = roughC.width = size;
    albedoC.height = heightC.height = roughC.height = size;

    const aCtx = albedoC.getContext('2d')!;
    const hCtx = heightC.getContext('2d')!;
    const rCtx = roughC.getContext('2d')!;

    const grad = aCtx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#9e9f9d');
    grad.addColorStop(0.65, '#868b96');
    grad.addColorStop(1, '#5d6e58');
    aCtx.fillStyle = grad;
    aCtx.fillRect(0, 0, size, size);

    hCtx.fillStyle = '#808080';
    hCtx.fillRect(0, 0, size, size);
    rCtx.fillStyle = '#dcdcdc';
    rCtx.fillRect(0, 0, size, size);

    for (let i = 0; i < 36; i += 1) {
      const x = (i * 47) % size;
      const w = 2 + (i % 5);
      const len = 70 + ((i * 23) % 130);
      aCtx.fillStyle = 'rgba(30, 34, 42, 0.14)';
      aCtx.fillRect(x, 0, w, len);
      hCtx.fillStyle = 'rgba(98, 98, 98, 0.35)';
      hCtx.fillRect(x, 0, w, len);
    }

    for (let i = 0; i < 2400; i += 1) {
      const x = (i * 53) % size;
      const y = (i * 97) % size;
      const v = 105 + ((i * 29) % 70);
      aCtx.fillStyle = `rgba(${v}, ${v + 2}, ${v + 5}, 0.24)`;
      aCtx.fillRect(x, y, 2, 2);

      const hv = 110 + ((i * 37) % 50);
      hCtx.fillStyle = `rgb(${hv}, ${hv}, ${hv})`;
      hCtx.fillRect(x, y, 2, 2);
    }

    for (let i = 0; i < 90; i += 1) {
      const x = (i * 37) % size;
      const y = size * 0.78 + ((i * 43) % (size * 0.22));
      const r = 3 + (i % 6);
      aCtx.fillStyle = 'rgba(72, 98, 66, 0.14)';
      aCtx.beginPath();
      aCtx.arc(x, y, r, 0, Math.PI * 2);
      aCtx.fill();
    }

    const map = new THREE.CanvasTexture(albedoC);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = aniso;

    const normalMap = heightToNormalTexture(heightC, 2.0, 1, 1);
    normalMap.anisotropy = aniso;

    const roughnessMap = new THREE.CanvasTexture(roughC);
    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.anisotropy = aniso;

    return { map, normalMap, roughnessMap };
  }

  private buildCobblePBR(aniso: number): PBRMapSet {
    const size = 256;
    const albedoC = document.createElement('canvas');
    const heightC = document.createElement('canvas');
    const roughC = document.createElement('canvas');
    albedoC.width = heightC.width = roughC.width = size;
    albedoC.height = heightC.height = roughC.height = size;

    const aCtx = albedoC.getContext('2d')!;
    const hCtx = heightC.getContext('2d')!;
    const rCtx = roughC.getContext('2d')!;

    aCtx.fillStyle = '#243225';
    aCtx.fillRect(0, 0, size, size);
    hCtx.fillStyle = '#202020';
    hCtx.fillRect(0, 0, size, size);
    rCtx.fillStyle = '#dadada';
    rCtx.fillRect(0, 0, size, size);

    const rows = 7;
    const cols = 6;
    const cellW = size / cols;
    const cellH = size / rows;

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const seed = r * 31 + c * 17;
        const offset = (r % 2) * (cellW * 0.48);
        const cx = ((c * cellW + offset) % size) + ((seed % 3) - 1) * 1.5;
        const cy = r * cellH + ((seed % 5) - 2);
        const w = cellW * 0.78;
        const h = cellH * 0.74;

        const shade = 108 + (seed % 46);
        aCtx.fillStyle = `rgb(${shade}, ${shade + 7}, ${shade + 18})`;
        aCtx.beginPath();
        aCtx.roundRect(cx + 2, cy + 2, w, h, 8);
        aCtx.fill();

        const heightVal = 185 + (seed % 65);
        hCtx.fillStyle = `rgb(${heightVal}, ${heightVal}, ${heightVal})`;
        hCtx.beginPath();
        hCtx.roundRect(cx + 2, cy + 2, w - 1, h - 1, 8);
        hCtx.fill();

        const roughVal = 52 + (seed % 32);
        rCtx.fillStyle = `rgb(${roughVal}, ${roughVal}, ${roughVal})`;
        rCtx.beginPath();
        rCtx.roundRect(cx + 3, cy + 3, w - 2, h - 2, 8);
        rCtx.fill();
      }
    }

    const repeatX = 1.6;
    const repeatY = 20;
    const map = new THREE.CanvasTexture(albedoC);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(repeatX, repeatY);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = aniso;

    const normalMap = heightToNormalTexture(heightC, 3.0, repeatX, repeatY);
    normalMap.anisotropy = aniso;

    const roughnessMap = new THREE.CanvasTexture(roughC);
    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(repeatX, repeatY);
    roughnessMap.anisotropy = aniso;

    return { map, normalMap, roughnessMap };
  }

  private buildWoodPBR(aniso: number): PBRMapSet {
    const size = 256;
    const albedoC = document.createElement('canvas');
    const heightC = document.createElement('canvas');
    const roughC = document.createElement('canvas');
    albedoC.width = heightC.width = roughC.width = size;
    albedoC.height = heightC.height = roughC.height = size;

    const aCtx = albedoC.getContext('2d')!;
    const hCtx = heightC.getContext('2d')!;
    const rCtx = roughC.getContext('2d')!;

    aCtx.fillStyle = '#4a3322';
    aCtx.fillRect(0, 0, size, size);
    hCtx.fillStyle = '#888888';
    hCtx.fillRect(0, 0, size, size);
    rCtx.fillStyle = '#d4d4d4';
    rCtx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += 3) {
      const wave = Math.sin(y * 0.14) * 8;
      const shade = 52 + ((y * 13) % 24);
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
    const normalMap = heightToNormalTexture(heightC, 1.8, 1, 1);
    normalMap.anisotropy = aniso;
    const roughnessMap = new THREE.CanvasTexture(roughC);
    roughnessMap.anisotropy = aniso;

    return { map, normalMap, roughnessMap };
  }

  private buildGrassMap(aniso: number): THREE.CanvasTexture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#243a29';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 3200; i += 1) {
      const x = (i * 53) % size;
      const y = (i * 97) % size;
      const g = 38 + ((i * 19) % 36);
      ctx.fillStyle = `rgba(${Math.round(g * 0.62)}, ${g + 14}, ${Math.round(g * 0.64)}, 0.45)`;
      ctx.fillRect(x, y, 2, 3);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(30, 30);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = aniso;
    return tex;
  }

  private buildMoonMap(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(128, 128, 15, 128, 128, 125);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.72, '#e4ecff');
    grad.addColorStop(1, '#c0cff2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const maria = [
      [89, 88, 34, 0.16],
      [155, 74, 24, 0.13],
      [165, 143, 37, 0.17],
      [98, 168, 28, 0.14],
      [125, 120, 18, 0.11],
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
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(64, 64, 1, 64, 64, 52);
    g.addColorStop(0, 'rgba(255, 224, 168, 0.95)');
    g.addColorStop(0.25, 'rgba(255, 180, 90, 0.55)');
    g.addColorStop(0.6, 'rgba(255, 150, 60, 0.15)');
    g.addColorStop(1, 'rgba(255, 140, 40, 0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private buildMistMap(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 256);

    for (let i = 0; i < 24; i += 1) {
      const ang = (i * 2.399) % (Math.PI * 2);
      const dist = 16 + ((i * 19) % 54);
      const x = 128 + Math.cos(ang) * dist;
      const y = 128 + Math.sin(ang) * dist;
      const r = 28 + (i % 4) * 10;
      const g = ctx.createRadialGradient(x, y, 2, x, y, r);
      g.addColorStop(0, 'rgba(220, 232, 255, 0.22)');
      g.addColorStop(1, 'rgba(220, 232, 255, 0.0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'destination-in';
    const mask = ctx.createRadialGradient(128, 128, 20, 128, 128, 118);
    mask.addColorStop(0, 'rgba(255, 255, 255, 1)');
    mask.addColorStop(0.65, 'rgba(255, 255, 255, 0.6)');
    mask.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, 256, 256);
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

    cCtx.fillStyle = '#4c3422';
    cCtx.fillRect(0, 0, w, h);
    for (let y = 8; y < h; y += 14) {
      cCtx.strokeStyle = 'rgba(22, 12, 5, 0.38)';
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

    drawSignText(cCtx, '#ffe2b0');
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
      new THREE.SphereGeometry(20, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0x263766, side: THREE.BackSide }),
    );
    envScene.add(dome);

    const moonSpot = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xecf3ff }),
    );
    moonSpot.position.set(8, 10, -14);
    envScene.add(moonSpot);

    const lanternSpot = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 8, 8),
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
