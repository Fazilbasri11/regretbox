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

export class PerformanceManager {
  public lowGraphics = false;
  private frames = 0;
  private lastSample = performance.now();
  private currentFps = 60;

  constructor(initialLowGraphics = false) {
    this.lowGraphics = initialLowGraphics;
  }

  public recordFrame(): number {
    this.frames += 1;
    const now = performance.now();
    const elapsed = now - this.lastSample;
    if (elapsed >= 1000) {
      this.currentFps = Math.round((this.frames * 1000) / elapsed);
      this.frames = 0;
      this.lastSample = now;
    }
    return this.currentFps;
  }

  public getFps(): number {
    return this.currentFps;
  }

  public getMaxPixelRatio(): number {
    if (this.lowGraphics) return 1;
    return Math.min(window.devicePixelRatio || 1, 1.75);
  }
}
