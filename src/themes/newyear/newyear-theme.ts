import * as THREE from 'three';
import type {
  ExperienceTheme,
  OccasionId,
  ThemeVisualConfig,
  ThemeAudioConfig,
  InteractiveActionTarget,
} from '../experience-theme.interface';
import { NEWYEAR_VISUAL_CONFIG, NEWYEAR_AUDIO_CONFIG } from './newyear-config';
import { createClockChampagne, type ClockChampagneHolder } from './clock-champagne-mesh';
import { ChampagneFoamSystem } from './champagne-foam-system';
import { AudioEngine } from '../../audio/audio-engine';

export class NewYearTheme implements ExperienceTheme {
  public readonly id: OccasionId = 'newyear';
  public readonly title = 'Happy New Year';
  public readonly subtitle = 'Countdown to Midnight & New Beginnings';
  public readonly emoji = '🥂';
  public readonly visualConfig: ThemeVisualConfig = NEWYEAR_VISUAL_CONFIG;
  public readonly audioConfig: ThemeAudioConfig = NEWYEAR_AUDIO_CONFIG;
  public readonly group: THREE.Group = new THREE.Group();

  private clockChampagne: ClockChampagneHolder | null = null;
  private foam: ChampagneFoamSystem | null = null;

  constructor() {
    this.group.name = 'newyear-experience-theme';
  }

  public init(scene: THREE.Scene): void {
    // 1. Procedural 3D Midnight Clock & Champagne Bottle
    this.clockChampagne = createClockChampagne();
    this.group.add(this.clockChampagne.group);

    // 2. Bubbly Effervescent Foam Particle System
    this.foam = new ChampagneFoamSystem();
    this.group.add(this.foam.group);

    scene.add(this.group);
  }

  public update(dt: number, elapsed: number): void {
    this.clockChampagne?.update(elapsed);
    this.foam?.update(dt);
  }

  public async triggerAction(): Promise<void> {
    if (this.clockChampagne) {
      try {
        AudioEngine.getInstance().playSparklerSizzle();
      } catch {
        // Safe audio fallback
      }
      await this.clockChampagne.popCork();
      this.foam?.triggerFoamBurst();
    }
  }

  public onCelebrationStart(): void {
    this.foam?.triggerFoamBurst();
  }

  public getPromptText(): string {
    return 'Tap the champagne cork to pop into the New Year!';
  }

  public getActionButtonText(): string {
    return 'Pop the Champagne 🍾✨';
  }

  public getInteractionTarget(): InteractiveActionTarget | null {
    if (!this.clockChampagne) return null;
    return {
      object: this.clockChampagne.group,
      hintPosition: new THREE.Vector3(0, 1.35, 0.1),
    };
  }

  public getClockChampagne(): ClockChampagneHolder | null {
    return this.clockChampagne;
  }

  public getFoam(): ChampagneFoamSystem | null {
    return this.foam;
  }

  public dispose(): void {
    this.clockChampagne?.dispose();
    this.foam?.dispose();
    this.group.clear();
  }
}
