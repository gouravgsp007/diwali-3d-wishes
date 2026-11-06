import * as THREE from 'three';
import type {
  ExperienceTheme,
  OccasionId,
  ThemeVisualConfig,
  ThemeAudioConfig,
  InteractiveActionTarget,
} from '../experience-theme.interface';
import { BIRTHDAY_VISUAL_CONFIG, BIRTHDAY_AUDIO_CONFIG } from './birthday-config';
import { createBirthdayCake, type BirthdayCakeHolder } from './birthday-cake-mesh';
import { BalloonSystem } from './balloon-system';
import { AudioEngine } from '../../audio/audio-engine';

export class BirthdayTheme implements ExperienceTheme {
  public readonly id: OccasionId = 'birthday';
  public readonly title = 'Happy Birthday';
  public readonly subtitle = 'Make a Wish & Blow the Candles';
  public readonly emoji = '🎂';
  public readonly visualConfig: ThemeVisualConfig = BIRTHDAY_VISUAL_CONFIG;
  public readonly audioConfig: ThemeAudioConfig = BIRTHDAY_AUDIO_CONFIG;
  public readonly group: THREE.Group = new THREE.Group();

  private cake: BirthdayCakeHolder | null = null;
  private balloons: BalloonSystem | null = null;

  constructor() {
    this.group.name = 'birthday-experience-theme';
  }

  public init(scene: THREE.Scene): void {
    // 1. Procedural 3D Tiered Cake with 3 Candles
    this.cake = createBirthdayCake();
    this.group.add(this.cake.group);

    // 2. Floating Helium Balloon Canopy
    this.balloons = new BalloonSystem();
    this.group.add(this.balloons.group);

    scene.add(this.group);
  }

  public update(dt: number, elapsed: number): void {
    this.cake?.update(elapsed);
    this.balloons?.update(dt, elapsed);
  }

  public async triggerAction(): Promise<void> {
    if (this.cake) {
      try {
        AudioEngine.getInstance().playTempleBell();
      } catch {
        // Safe audio fallback
      }
      await this.cake.blowOut();
    }
  }

  public onCelebrationStart(): void {
    this.balloons?.releaseBalloons();
  }

  public getPromptText(): string {
    return 'Make a wish & tap the candles to blow them out';
  }

  public getActionButtonText(): string {
    return 'Blow Out Candles 🎂✨';
  }

  public getInteractionTarget(): InteractiveActionTarget | null {
    if (!this.cake) return null;
    return {
      object: this.cake.group,
      hintPosition: new THREE.Vector3(0, 0.85, 0),
    };
  }

  public getCake(): BirthdayCakeHolder | null {
    return this.cake;
  }

  public getBalloons(): BalloonSystem | null {
    return this.balloons;
  }

  public dispose(): void {
    this.cake?.dispose();
    this.balloons?.dispose();
    this.group.clear();
  }
}
