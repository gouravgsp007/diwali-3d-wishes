import * as THREE from 'three';
import type {
  ExperienceTheme,
  OccasionId,
  ThemeVisualConfig,
  ThemeAudioConfig,
  InteractiveActionTarget,
} from '../experience-theme.interface';
import { WEDDING_VISUAL_CONFIG, WEDDING_AUDIO_CONFIG } from './wedding-config';
import { createJewelryBox, type JewelryBoxHolder } from './jewelry-box-mesh';
import { RosePetalShower } from './rose-petal-shower';
import { AudioEngine } from '../../audio/audio-engine';

export class WeddingTheme implements ExperienceTheme {
  public readonly id: OccasionId = 'wedding';
  public readonly title = 'Wedding & Engagement';
  public readonly subtitle = 'Auspicious Union & Eternal Love';
  public readonly emoji = '💍';
  public readonly visualConfig: ThemeVisualConfig = WEDDING_VISUAL_CONFIG;
  public readonly audioConfig: ThemeAudioConfig = WEDDING_AUDIO_CONFIG;
  public readonly group: THREE.Group = new THREE.Group();

  private box: JewelryBoxHolder | null = null;
  private petalShower: RosePetalShower | null = null;

  constructor() {
    this.group.name = 'wedding-experience-theme';
  }

  public init(scene: THREE.Scene): void {
    // 1. Procedural Royal Velvet & Gold Jewelry Box
    this.box = createJewelryBox();
    this.group.add(this.box.group);

    // Warm golden spotlight highlighting the velvet ring box
    const spot = new THREE.SpotLight(0xffedd5, 1.8, 10, Math.PI / 4, 0.4, 1.0);
    spot.position.set(0, 3.5, 1.5);
    spot.target = this.box.group;
    this.group.add(spot);

    // 2. Cascading 3D Rose Petal Shower
    this.petalShower = new RosePetalShower();
    this.group.add(this.petalShower.group);

    scene.add(this.group);
  }

  public update(dt: number, elapsed: number): void {
    this.box?.update(elapsed);
    this.petalShower?.update(dt, elapsed);
  }

  public async triggerAction(): Promise<void> {
    if (this.box) {
      try {
        AudioEngine.getInstance().playTempleBell();
      } catch {
        // Safe fallback
      }
      await this.box.openBox();
    }
  }

  public onCelebrationStart(): void {
    this.petalShower?.triggerShower(50);
  }

  public getPromptText(): string {
    return 'Tap the royal golden clasp to reveal the blessings';
  }

  public getActionButtonText(): string {
    return 'Open Royal Box 💍✨';
  }

  public getInteractionTarget(): InteractiveActionTarget | null {
    if (!this.box) return null;
    return {
      object: this.box.group,
      hintPosition: new THREE.Vector3(0, 0.55, 0.2),
    };
  }

  public getBox(): JewelryBoxHolder | null {
    return this.box;
  }

  public getPetalShower(): RosePetalShower | null {
    return this.petalShower;
  }

  public dispose(): void {
    this.box?.dispose();
    this.petalShower?.dispose();
    this.group.clear();
  }
}
