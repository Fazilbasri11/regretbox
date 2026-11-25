export type QualityTier = 'high' | 'medium' | 'low';
export type QualitySetting = 'auto' | QualityTier;

export function detectWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}

export function detectInitialTier(): QualityTier {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
  const cores = navigator.hardwareConcurrency || 4;
  if (isMobile && cores <= 4) return 'low';
  if (isMobile) return 'medium';
  return 'high';
}

export class PerformanceManager {
  public setting: QualitySetting = 'auto';
  public activeTier: QualityTier;
  private frameTimes: number[] = [];
  private sampleStart = performance.now();
  private onTierDowngrade?: (tier: QualityTier) => void;

  constructor(initialSetting: QualitySetting = 'auto', onTierDowngrade?: (tier: QualityTier) => void) {
    this.setting = initialSetting;
    this.activeTier = initialSetting === 'auto' ? detectInitialTier() : initialSetting;
    this.onTierDowngrade = onTierDowngrade;
  }

  public setSetting(setting: QualitySetting): QualityTier {
    this.setting = setting;
    this.activeTier = setting === 'auto' ? detectInitialTier() : setting;
    this.frameTimes = [];
    this.sampleStart = performance.now();
    return this.activeTier;
  }

  public recordFrameTime(ms: number): void {
    if (this.setting !== 'auto' || this.activeTier === 'low') return;
    this.frameTimes.push(ms);
    const now = performance.now();
    if (now - this.sampleStart < 2000) return;

    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / Math.max(1, this.frameTimes.length);
    this.frameTimes = [];
    this.sampleStart = now;

    // Budget: ~28ms (~35fps floor) on High, ~42ms (~24fps floor) on Medium
    if (this.activeTier === 'high' && avg > 34) {
      this.activeTier = 'medium';
      this.onTierDowngrade?.('medium');
    } else if (this.activeTier === 'medium' && avg > 48) {
      this.activeTier = 'low';
      this.onTierDowngrade?.('low');
    }
  }

  public getMaxPixelRatio(): number {
    const isMobile = window.innerWidth < 768;
    if (this.activeTier === 'low') return 1;
    if (this.activeTier === 'medium') return Math.min(window.devicePixelRatio || 1, 1.5);
    return Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  }
}
