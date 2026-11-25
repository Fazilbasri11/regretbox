import * as THREE from 'three';
import { APP_CONFIG } from '../app/config';
import type { Grave } from '../types/grave';
import { formatBurialDate, formatGraveNumber } from '../utils/graves';

interface CachedPlaque {
  colorMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  resolution: number;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function buildTextNormalMap(heightCanvas: HTMLCanvasElement): THREE.CanvasTexture {
  const w = 512;
  const h = 640;
  const scaled = document.createElement('canvas');
  scaled.width = w;
  scaled.height = h;
  const sCtx = scaled.getContext('2d')!;
  sCtx.drawImage(heightCanvas, 0, 0, w, h);

  const src = sCtx.getImageData(0, 0, w, h).data;
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = w;
  normalCanvas.height = h;
  const nCtx = normalCanvas.getContext('2d')!;
  const dst = nCtx.createImageData(w, h);

  const at = (x: number, y: number) => {
    const cx = Math.max(0, Math.min(w - 1, x));
    const cy = Math.max(0, Math.min(h - 1, y));
    return src[(cy * w + cx) * 4] / 255;
  };

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 2.4;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 2.4;
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
  tex.anisotropy = 8;
  return tex;
}

export class InscriptionTextureCache {
  private cache = new Map<string, CachedPlaque>();
  private maxAniso: number;

  constructor(renderer: THREE.WebGLRenderer) {
    this.maxAniso = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  }

  public get(grave: Grave, resolution = 1024): {
    colorMap: THREE.CanvasTexture;
    normalMap: THREE.CanvasTexture;
  } {
    const key = `${grave.id}:${resolution}:${grave.inscription}`;
    const existing = this.cache.get(key);
    if (existing) {
      // Refresh LRU position
      this.cache.delete(key);
      this.cache.set(key, existing);
      return { colorMap: existing.colorMap, normalMap: existing.normalMap };
    }

    const created = this.renderPlaque(grave, resolution);
    this.cache.set(key, created);

    // LRU eviction (max 48)
    while (this.cache.size > APP_CONFIG.maxPlaqueCache) {
      const oldestKey = this.cache.keys().next().value;
      if (!oldestKey) break;
      const oldest = this.cache.get(oldestKey);
      oldest?.colorMap.dispose();
      oldest?.normalMap.dispose();
      this.cache.delete(oldestKey);
    }

    return { colorMap: created.colorMap, normalMap: created.normalMap };
  }

  private renderPlaque(grave: Grave, width: number): CachedPlaque {
    const height = Math.round(width * 1.25);
    const scale = width / 1024;

    const c = document.createElement('canvas');
    const hC = document.createElement('canvas');
    c.width = hC.width = width;
    c.height = hC.height = height;

    const ctx = c.getContext('2d')!;
    const hCtx = hC.getContext('2d')!;

    // Weathered slate-gray stone face (#5A5F6B -> #424752) for > 5:1 ivory text contrast
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#5d626e');
    grad.addColorStop(0.6, '#4c515c');
    grad.addColorStop(1, '#3b4244');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle stone grain
    for (let i = 0; i < 4500; i += 1) {
      const x = (i * 97) % width;
      const y = (i * 173) % height;
      const shade = 55 + ((i * 29) % 42);
      ctx.fillStyle = `rgba(${shade}, ${shade + 2}, ${shade + 5}, 0.22)`;
      ctx.fillRect(x, y, 2 * scale, 2 * scale);
    }

    // Recessed frame bevel border
    ctx.strokeStyle = 'rgba(28, 32, 38, 0.52)';
    ctx.lineWidth = 10 * scale;
    ctx.strokeRect(24 * scale, 24 * scale, width - 48 * scale, height - 48 * scale);

    ctx.strokeStyle = 'rgba(230, 217, 189, 0.22)';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(36 * scale, 36 * scale, width - 72 * scale, height - 72 * scale);

    // Heightmap background for carved normal map
    hCtx.fillStyle = '#909090';
    hCtx.fillRect(0, 0, width, height);

    const drawCarved = (
      text: string,
      y: number,
      font: string,
      color = '#F5ECD7',
    ) => {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = font;

      // Subtle engraved recess shadow
      ctx.fillStyle = 'rgba(12, 14, 20, 0.92)';
      ctx.fillText(text, width / 2 + 1.5 * scale, y + 2 * scale);

      // Crisp warm ivory lettering
      ctx.fillStyle = color;
      ctx.fillText(text, width / 2, y);

      // Indented heightmap
      hCtx.textAlign = 'center';
      hCtx.textBaseline = 'middle';
      hCtx.font = font;
      hCtx.fillStyle = '#484848';
      hCtx.fillText(text, width / 2, y);
    };

    // 1. R.I.P. (12–18%)
    drawCarved('R. I. P.', height * 0.145, `700 ${Math.round(58 * scale)}px "Cormorant Garamond", Georgia, serif`, '#F3E9D2');

    // 2. Regret #00291 (24–32%)
    drawCarved(
      `Regret ${formatGraveNumber(grave.grave_number)}`,
      height * 0.27,
      `700 ${Math.round(62 * scale)}px "Cormorant Garamond", Georgia, serif`,
      '#F8EFE0',
    );

    // 3. Thin ornament divider (~37%)
    const div1Y = height * 0.365;
    ctx.strokeStyle = 'rgba(230, 217, 189, 0.35)';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(width * 0.22, div1Y);
    ctx.lineTo(width * 0.78, div1Y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(230, 217, 189, 0.55)';
    ctx.save();
    ctx.translate(width / 2, div1Y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-5 * scale, -5 * scale, 10 * scale, 10 * scale);
    ctx.restore();

    // 4. Sentence auto-fit (42–72%, max 5 lines)
    const quoted = `“${grave.inscription}”`;
    let fontSize = Math.round(72 * scale);
    let lines: string[] = [];
    const maxTextWidth = width * 0.78;

    while (fontSize >= Math.round(36 * scale)) {
      ctx.font = `italic 600 ${fontSize}px "Cormorant Garamond", Georgia, serif`;
      lines = wrapText(ctx, quoted, maxTextWidth);
      if (lines.length <= 5) break;
      fontSize -= Math.round(4 * scale);
    }
    lines = lines.slice(0, 5);

    const lineHeight = fontSize * 1.24;
    const centerQuoteY = height * 0.57;
    const startY = centerQuoteY - ((lines.length - 1) * lineHeight) / 2;
    const quoteFont = `italic 600 ${fontSize}px "Cormorant Garamond", Georgia, serif`;

    lines.forEach((line, idx) => {
      drawCarved(line, startY + idx * lineHeight, quoteFont, 'rgba(246, 239, 220, 0.96)');
    });

    // 5. Lower divider (~77%)
    const div2Y = height * 0.765;
    ctx.strokeStyle = 'rgba(230, 217, 189, 0.26)';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(width * 0.28, div2Y);
    ctx.lineTo(width * 0.72, div2Y);
    ctx.stroke();

    // 6. Burial date (82–90%)
    drawCarved(
      `${APP_CONFIG.graveDateLabel} ${formatBurialDate(grave.created_at)}`,
      height * 0.855,
      `600 ${Math.round(42 * scale)}px "Cormorant Garamond", Georgia, serif`,
      'rgba(232, 222, 200, 0.88)',
    );

    const colorMap = new THREE.CanvasTexture(c);
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.anisotropy = this.maxAniso;

    const normalMap = buildTextNormalMap(hC);
    normalMap.anisotropy = this.maxAniso;

    return { colorMap, normalMap, resolution: width };
  }

  public dispose(): void {
    this.cache.forEach((entry) => {
      entry.colorMap.dispose();
      entry.normalMap.dispose();
    });
    this.cache.clear();
  }
}
