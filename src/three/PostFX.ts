import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from 'postprocessing';
import * as THREE from 'three';
import type { QualityTier } from './PerformanceManager';

export class PostFX {
  private composer: EffectComposer | null = null;
  private bloom: BloomEffect | null = null;
  private tier: QualityTier;

  constructor(
    private renderer: THREE.WebGLRenderer,
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera,
    tier: QualityTier,
  ) {
    this.tier = tier;
    this.rebuild(tier);
  }

  public rebuild(tier: QualityTier): void {
    this.tier = tier;
    this.composer?.dispose();
    this.composer = null;
    this.bloom = null;

    if (tier === 'low') {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.28;
      return;
    }

    // NoToneMapping on renderer when ToneMappingEffect handles ACES inside EffectComposer
    this.renderer.toneMapping = THREE.NoToneMapping;

    const composer = new EffectComposer(this.renderer, {
      frameBufferType: THREE.HalfFloatType,
      multisampling: tier === 'high' ? 2 : 0,
    });
    composer.addPass(new RenderPass(this.scene, this.camera));

    // Lightweight Bloom + Vignette + ACES (DepthOfField removed so clicked stones stay razor sharp & FPS stays high)
    const bloom = new BloomEffect({
      luminanceThreshold: 0.82,
      intensity: tier === 'high' ? 0.65 : 0.48,
      mipmapBlur: true,
      radius: 0.55,
    });
    this.bloom = bloom;

    const vignette = new VignetteEffect({
      eskil: false,
      offset: 0.22,
      darkness: 0.3,
    });

    const toneMapping = new ToneMappingEffect({
      mode: ToneMappingMode.ACES_FILMIC,
    });

    composer.addPass(new EffectPass(this.camera, bloom, vignette, toneMapping));
    this.composer = composer;
  }

  public pulseBurialBloom(): void {
    if (!this.bloom) return;
    const orig = this.bloom.intensity;
    this.bloom.intensity = orig * 1.65;
    window.setTimeout(() => {
      if (this.bloom) this.bloom.intensity = orig;
    }, 900);
  }

  public setSize(width: number, height: number): void {
    this.composer?.setSize(width, height);
  }

  public render(): void {
    if (this.composer && this.tier !== 'low') {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  public dispose(): void {
    this.composer?.dispose();
  }
}
