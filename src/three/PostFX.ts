import {
  BlendFunction,
  BloomEffect,
  DepthOfFieldEffect,
  EffectComposer,
  EffectPass,
  NoiseEffect,
  RenderPass,
  SMAAEffect,
  SMAAPreset,
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
      // Low tier skips EffectComposer so sprite glows handle bloom cheaply
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.08;
      return;
    }

    this.renderer.toneMapping = THREE.NoToneMapping;

    const composer = new EffectComposer(this.renderer, {
      frameBufferType: THREE.HalfFloatType,
    });
    composer.addPass(new RenderPass(this.scene, this.camera));

    const bloom = new BloomEffect({
      luminanceThreshold: 0.85,
      intensity: tier === 'high' ? 0.78 : 0.58,
      mipmapBlur: true,
      radius: 0.6,
    });
    this.bloom = bloom;

    const dof = new DepthOfFieldEffect(this.camera, {
      focusDistance: 0.032,
      focalLength: 0.04,
      bokehScale: tier === 'high' ? 1.5 : 1.1,
    });

    const vignette = new VignetteEffect({
      eskil: false,
      offset: 0.2,
      darkness: 0.35,
    });

    const noise = new NoiseEffect({
      blendFunction: BlendFunction.SOFT_LIGHT,
    });
    noise.blendMode.opacity.value = 0.03;

    const toneMapping = new ToneMappingEffect({
      mode: ToneMappingMode.ACES_FILMIC,
    });

    const smaa = new SMAAEffect({ preset: SMAAPreset.MEDIUM });

    composer.addPass(new EffectPass(this.camera, dof, bloom, vignette, noise, toneMapping, smaa));
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
