import * as THREE from 'three';
import { APP_CONFIG } from '../app/config';
import type { Grave } from '../types/grave';
import { formatBurialDate, formatGraveNumber } from '../utils/graves';

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

export class InscriptionTextureCache {
  private cache = new Map<string, THREE.CanvasTexture>();
  private maxAniso: number;

  constructor(renderer: THREE.WebGLRenderer) {
    this.maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  }

  public get(grave: Grave, resolution = 512): THREE.CanvasTexture {
    const key = `${grave.id}:${resolution}:${grave.inscription}`;
    const existing = this.cache.get(key);
    if (existing) {
      this.cache.delete(key);
      this.cache.set(key, existing);
      return existing;
    }

    const created = this.renderPlaque(grave, resolution);
    this.cache.set(key, created);

    while (this.cache.size > APP_CONFIG.maxPlaqueCache) {
      const oldestKey = this.cache.keys().next().value;
      if (!oldestKey) break;
      this.cache.get(oldestKey)?.dispose();
      this.cache.delete(oldestKey);
    }

    return created;
  }

  private renderPlaque(grave: Grave, width: number): THREE.CanvasTexture {
    const height = Math.round(width * 1.25);
    const scale = width / 1024;

    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d')!;

    // Moonlit weathered slate face with bright contrast against #F5ECD7 ivory
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#6c717d');
    grad.addColorStop(0.6, '#585e6a');
    grad.addColorStop(1, '#434c49');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle recessed border bevel
    ctx.strokeStyle = 'rgba(20, 24, 32, 0.52)';
    ctx.lineWidth = 10 * scale;
    ctx.strokeRect(24 * scale, 24 * scale, width - 48 * scale, height - 48 * scale);

    ctx.strokeStyle = 'rgba(240, 230, 206, 0.28)';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(36 * scale, 36 * scale, width - 72 * scale, height - 72 * scale);

    const drawCarved = (
      text: string,
      y: number,
      font: string,
      color = '#F7EFE0',
    ) => {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = font;

      ctx.fillStyle = 'rgba(10, 12, 18, 0.9)';
      ctx.fillText(text, width / 2 + 2 * scale, y + 2.5 * scale);

      ctx.fillStyle = color;
      ctx.fillText(text, width / 2, y);
    };

    drawCarved('R. I. P.', height * 0.145, `700 ${Math.round(58 * scale)}px "Cormorant Garamond", Georgia, serif`, '#F5ECD8');

    drawCarved(
      `Regret ${formatGraveNumber(grave.grave_number)}`,
      height * 0.27,
      `700 ${Math.round(62 * scale)}px "Cormorant Garamond", Georgia, serif`,
      '#FAF2E2',
    );

    const div1Y = height * 0.365;
    ctx.strokeStyle = 'rgba(240, 230, 206, 0.4)';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(width * 0.22, div1Y);
    ctx.lineTo(width * 0.78, div1Y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(240, 230, 206, 0.65)';
    ctx.save();
    ctx.translate(width / 2, div1Y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-5 * scale, -5 * scale, 10 * scale, 10 * scale);
    ctx.restore();

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
      drawCarved(line, startY + idx * lineHeight, quoteFont, '#FBF5E8');
    });

    const div2Y = height * 0.765;
    ctx.strokeStyle = 'rgba(240, 230, 206, 0.3)';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(width * 0.28, div2Y);
    ctx.lineTo(width * 0.72, div2Y);
    ctx.stroke();

    drawCarved(
      `${APP_CONFIG.graveDateLabel} ${formatBurialDate(grave.created_at)}`,
      height * 0.855,
      `600 ${Math.round(42 * scale)}px "Cormorant Garamond", Georgia, serif`,
      'rgba(240, 230, 208, 0.92)',
    );

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAniso;
    return tex;
  }

  public dispose(): void {
    this.cache.forEach((tex) => tex.dispose());
    this.cache.clear();
  }
}
