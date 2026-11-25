import * as THREE from 'three';
import type { Grave } from '../types/grave';
import { AssetLoader } from './AssetLoader';
import { Atmosphere } from './Atmosphere';
import { BurialAnimation } from './BurialAnimation';
import { CameraController } from './CameraController';
import { DesktopControls } from './DesktopControls';
import { Environment } from './Environment';
import { GraveManager } from './GraveManager';
import { computeLanternPositions, Lanterns } from './Lanterns';
import { Lighting } from './Lighting';
import { MobileControls } from './MobileControls';
import { PerformanceManager, type QualitySetting, type QualityTier } from './PerformanceManager';
import { PostFX } from './PostFX';
import { SearchNavigator } from './SearchNavigator';
import { SignBoard } from './SignBoard';
import { Sky } from './Sky';

export interface CemeteryEngineCallbacks {
  onSelectGrave: (grave: Grave) => void;
  onOpenBury: () => void;
  onEscape: () => void;
  onUserMoved: () => void;
  onTierChanged?: (tier: QualityTier) => void;
  onReady?: () => void;
}

export class CemeteryScene {
  public readonly scene = new THREE.Scene();
  public readonly camera: THREE.PerspectiveCamera;
  public readonly renderer: THREE.WebGLRenderer;
  public readonly perf: PerformanceManager;
  public readonly cameraCtrl: CameraController;
  public readonly graveMgr: GraveManager;
  public readonly searchNav: SearchNavigator;
  public readonly burialAnim: BurialAnimation;
  public readonly signBoard: SignBoard;

  private assets: AssetLoader;
  private sky: Sky;
  private atmosphere: Atmosphere;
  private lighting: Lighting;
  private lanterns: Lanterns;
  private env: Environment;
  private postFx: PostFX;
  private desktopCtrl: DesktopControls;
  private mobileCtrl: MobileControls;
  private rafId = 0;
  private disposed = false;

  constructor(
    private container: HTMLElement,
    initialSetting: QualitySetting,
    initialGraves: Grave[],
    private callbacks: CemeteryEngineCallbacks,
  ) {
    this.perf = new PerformanceManager(initialSetting, (downgraded) => {
      this.applyQualityTier(downgraded);
      this.callbacks.onTierChanged?.(downgraded);
    });

    const w = Math.max(container.clientWidth, 320);
    const h = Math.max(container.clientHeight, 320);

    this.camera = new THREE.PerspectiveCamera(46, w / h, 0.2, 360);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.domElement.id = 'scene';
    this.renderer.domElement.setAttribute('role', 'img');
    this.renderer.domElement.setAttribute(
      'aria-label',
      'Interactive 3D moonlit gothic cemetery containing public regret gravestones.',
    );
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(this.perf.getMaxPixelRatio());
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = this.perf.activeTier !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    const tier = this.perf.activeTier;
    this.assets = new AssetLoader(this.renderer);
    this.sky = new Sky(this.scene, this.assets);
    this.atmosphere = new Atmosphere(this.scene, this.assets, tier);
    this.lighting = new Lighting(this.scene, tier);

    const sorted = [...initialGraves].sort((a, b) => b.slot_index - a.slot_index);
    const heroGrave = sorted[0] || null;
    const leftGrave = sorted[1] || null;
    const rightGrave = sorted[2] || null;
    const maxZ = heroGrave ? heroGrave.pos_z : 1.65;

    this.env = new Environment(this.scene, this.assets, tier, maxZ);

    const lanternPositions = computeLanternPositions(heroGrave, leftGrave, rightGrave);
    this.lanterns = new Lanterns(this.scene, this.assets, tier, lanternPositions);

    this.signBoard = new SignBoard(this.scene, this.assets);
    this.signBoard.setPositionRelativeToHero(heroGrave?.pos_x ?? -0.75, heroGrave?.pos_z ?? 1.65);

    this.graveMgr = new GraveManager(this.scene, this.renderer, this.assets);
    this.graveMgr.setGraves(initialGraves);

    this.cameraCtrl = new CameraController(this.camera);
    this.cameraCtrl.configureHomeRelativeToHero(heroGrave);

    this.postFx = new PostFX(this.renderer, this.scene, this.camera, tier);
    this.searchNav = new SearchNavigator(this.cameraCtrl, this.graveMgr);
    this.burialAnim = new BurialAnimation(this.scene, this.cameraCtrl, this.postFx);

    this.desktopCtrl = new DesktopControls(
      this.renderer.domElement,
      this.cameraCtrl,
      this.graveMgr,
      this.signBoard,
      {
        onSelectGrave: callbacks.onSelectGrave,
        onOpenBurySign: callbacks.onOpenBury,
        onEscape: callbacks.onEscape,
        onUserMoved: callbacks.onUserMoved,
      },
    );

    this.mobileCtrl = new MobileControls(
      this.renderer.domElement,
      this.cameraCtrl,
      this.graveMgr,
      this.signBoard,
      {
        onSelectGrave: callbacks.onSelectGrave,
        onOpenBurySign: callbacks.onOpenBury,
        onUserMoved: callbacks.onUserMoved,
      },
    );

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.atmosphere.setTier(tier, reducedMotion);
    this.graveMgr.updateNearbyPlaques(this.camera.position);

    this.cameraCtrl.playIntroDolly(reducedMotion, () => {
      this.callbacks.onReady?.();
    });

    this.startLoop();
  }

  public setGraves(graves: Grave[]): void {
    const sorted = [...graves].sort((a, b) => b.slot_index - a.slot_index);
    const hero = sorted[0] || null;
    this.graveMgr.setGraves(graves);
    this.cameraCtrl.configureHomeRelativeToHero(hero);
    this.signBoard.setPositionRelativeToHero(hero?.pos_x ?? -0.75, hero?.pos_z ?? 1.65);
    this.graveMgr.updateNearbyPlaques(this.camera.position);
  }

  public setQualitySetting(setting: QualitySetting): QualityTier {
    const tier = this.perf.setSetting(setting);
    this.applyQualityTier(tier);
    return tier;
  }

  private applyQualityTier(tier: QualityTier): void {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderer.setPixelRatio(this.perf.getMaxPixelRatio());
    this.renderer.shadowMap.enabled = tier !== 'low';
    this.lighting.setTier(tier);
    this.atmosphere.setTier(tier, reduced);
    this.postFx.rebuild(tier);
  }

  public setJoystickVector(dx: number, dy: number): void {
    this.mobileCtrl.setJoystickVector(dx, dy);
  }

  public resize(width: number, height: number): void {
    const w = Math.max(width, 320);
    const h = Math.max(height, 320);
    this.camera.aspect = w / h;
    this.cameraCtrl.updateResponsiveFov();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(this.perf.getMaxPixelRatio());
    this.postFx.setSize(w, h);
  }

  private startLoop(): void {
    let last = performance.now();
    let plaqueTimer = 0;

    const tick = (now: number) => {
      if (this.disposed) return;
      this.rafId = requestAnimationFrame(tick);

      const dtMs = now - last;
      const dt = Math.min(0.05, dtMs / 1000);
      last = now;
      const elapsedSec = now / 1000;

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.desktopCtrl.update(dt);
      this.mobileCtrl.update(dt);
      this.sky.update(elapsedSec, this.camera.position, reduced);
      this.atmosphere.update(elapsedSec, reduced);
      this.lanterns.update(elapsedSec, reduced);
      this.env.update(elapsedSec, reduced);
      this.graveMgr.update(elapsedSec, reduced);
      this.signBoard.update(elapsedSec, reduced);

      plaqueTimer += dt;
      if (plaqueTimer >= 0.25) {
        plaqueTimer = 0;
        this.graveMgr.updateNearbyPlaques(this.camera.position);
      }

      this.postFx.render();
      this.perf.recordFrameTime(dtMs);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    this.desktopCtrl.dispose();
    this.mobileCtrl.dispose();
    this.burialAnim.stop();
    this.graveMgr.dispose();
    this.postFx.dispose();
    this.assets.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
