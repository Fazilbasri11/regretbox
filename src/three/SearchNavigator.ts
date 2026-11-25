import type { Grave } from '../types/grave';
import type { CameraController } from './CameraController';
import type { GraveManager } from './GraveManager';

export class SearchNavigator {
  constructor(
    private cameraCtrl: CameraController,
    private graveManager: GraveManager,
  ) {}

  public focusGrave(grave: Grave, onComplete?: () => void): void {
    this.graveManager.setSelectedGrave(grave);
    this.cameraCtrl.flyToGrave(grave, onComplete);
  }
}
