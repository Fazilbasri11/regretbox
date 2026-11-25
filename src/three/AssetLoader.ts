import * as THREE from 'three';
import type { Grave } from '../types/grave';
import { formatBurialDate, formatGraveNumber } from '../utils/graves';

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 5);
}

export class AssetLoader {
  public readonly stoneTexture: THREE.CanvasTexture;
  public readonly cobbleTexture: THREE.CanvasTexture;
  public readonly grassTexture: THREE.CanvasTexture;
  public readonly moonTexture: THREE.CanvasTexture;
  public readonly signTexture: THREE.CanvasTexture;
  private plaqueCache = new Map<string, THREE.CanvasTexture>();

  constructor() {
    this.stoneTexture = this.buildStoneTexture();
    this.cobbleTexture = this.buildCobbleTexture();
    this.grassTexture = this.buildGrassTexture();
    this.moonTexture = this.buildMoonTexture();
    this.signTexture = this.buildSignTexture('Bury a Regret  +');
  }

  private buildStoneTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#5b616b';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 4200; i += 1) {
      const x = (i * 73) % 256;
      const y = (i * 139) % 256;
      const shade = 65 + ((i * 29) % 45);
      ctx.fillStyle = `rgba(${shade}, ${shade + 3}, ${shade + 7}, 0.28)`;
      ctx.fillRect(x, y, 2, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private buildCobbleTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1b1f26';
    ctx.fillRect(0, 0, 512, 512);

    const rows = 10;
    const cols = 8;
    const w = 512 / cols;
    const h = 512 / rows;

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const offset = (r % 2) * (w * 0.45);
        const x = (c * w + offset) % 512;
        const y = r * h;
        const v = 42 + ((r * 13 + c * 19) % 26);
        ctx.fillStyle = `rgb(${v + 4}, ${v + 5}, ${v + 9})`;
        ctx.beginPath();
        ctx.roundRect(x + 3, y + 3, w - 7, h - 7, 8);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 22);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private buildGrassTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#172319';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 3600; i += 1) {
      const x = (i * 53) % 256;
      const y = (i * 97) % 256;
      const g = 28 + ((i * 17) % 30);
      ctx.fillStyle = `rgba(${Math.round(g * 0.65)}, ${g + 12}, ${Math.round(g * 0.62)}, 0.45)`;
      ctx.fillRect(x, y, 2, 3);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(36, 36);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private buildMoonTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(128, 128, 18, 128, 128, 124);
    grad.addColorStop(0, '#fffdf5');
    grad.addColorStop(0.8, '#dce5f2');
    grad.addColorStop(1, '#b9c6db');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const craters = [
      [88, 92, 26],
      [152, 74, 18],
      [165, 146, 30],
      [98, 168, 22],
      [124, 122, 14],
    ];
    for (const [cx, cy, r] of craters) {
      ctx.fillStyle = 'rgba(130, 145, 168, 0.28)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private buildSignTexture(label: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 220;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#332419';
    ctx.fillRect(0, 0, 512, 220);

    // Wood grain lines
    ctx.strokeStyle = 'rgba(20, 12, 6, 0.42)';
    ctx.lineWidth = 3;
    for (let y = 14; y < 220; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y + (y % 40 === 0 ? 4 : -4));
      ctx.stroke();
    }

    ctx.strokeStyle = '#e09f3e';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 492, 200);

    ctx.fillStyle = '#f2e6cf';
    ctx.font = '600 44px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 256, 112);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  public getPlaqueTexture(grave: Grave): THREE.CanvasTexture {
    const key = `${grave.id}:${grave.grave_number}:${grave.inscription}`;
    const cached = this.plaqueCache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 640;
    const ctx = canvas.getContext('2d')!;

    // Stone face background
    const grad = ctx.createLinearGradient(0, 0, 0, 640);
    grad.addColorStop(0, '#4f5561');
    grad.addColorStop(1, '#393e47');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 640);

    // Subtle stone border
    ctx.strokeStyle = 'rgba(22, 25, 31, 0.65)';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 472, 600);

    ctx.strokeStyle = 'rgba(237, 232, 220, 0.22)';
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 32, 448, 576);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8e2d5';
    ctx.font = '700 36px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('R.I.P.', 256, 98);

    ctx.fillStyle = '#e5b869';
    ctx.font = '600 34px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(`Regret ${formatGraveNumber(grave.grave_number)}`, 256, 152);

    // Divider
    ctx.strokeStyle = 'rgba(229, 184, 105, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(116, 184);
    ctx.lineTo(396, 184);
    ctx.stroke();

    // Engraved sentence
    ctx.fillStyle = '#f2ede2';
    ctx.font = 'italic 500 34px "Cormorant Garamond", Georgia, serif';
    const lines = wrapLines(ctx, `“${grave.inscription}”`, 390);
    const startY = 262 - ((lines.length - 1) * 20);
    lines.forEach((line, idx) => {
      ctx.fillText(line, 256, startY + idx * 46);
    });

    ctx.fillStyle = '#b9c0cc';
    ctx.font = '500 24px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(`Buried: ${formatBurialDate(grave.created_at)}`, 256, 535);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    this.plaqueCache.set(key, tex);
    return tex;
  }

  public dispose(): void {
    this.stoneTexture.dispose();
    this.cobbleTexture.dispose();
    this.grassTexture.dispose();
    this.moonTexture.dispose();
    this.signTexture.dispose();
    this.plaqueCache.forEach((tex) => tex.dispose());
    this.plaqueCache.clear();
  }
}
