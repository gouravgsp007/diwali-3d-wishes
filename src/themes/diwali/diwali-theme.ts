import * as THREE from 'three';
import type {
  ExperienceTheme,
  OccasionId,
  ThemeVisualConfig,
  ThemeAudioConfig,
  InteractiveActionTarget,
} from '../experience-theme.interface';
import { DIWALI_VISUAL_CONFIG, DIWALI_AUDIO_CONFIG } from './diwali-config';
import { DiyaMesh } from '../../graphics/meshes/diya-mesh';
import { createBrassThaliMesh } from '../../graphics/meshes/thali-mesh';
import { createRangoliMesh } from '../../graphics/meshes/rangoli-mesh';
import { createMarigoldRingMesh } from '../../graphics/meshes/marigold-mesh';
import { createFestiveLanterns, type FestiveLanternsHolder } from '../../graphics/meshes/lantern-mesh';
import { FlameController } from '../../graphics/fx/flame-controller';
import { SkyLanternsManager } from '../../graphics/fx/sky-lanterns-manager';
import { FlowerShower } from '../../graphics/fx/flower-shower';
import { InteractiveSparkler } from '../../graphics/fx/interactive-sparkler';
import type { CameraRig } from '../../graphics/camera-rig';

export class DiwaliTheme implements ExperienceTheme {
  public readonly id: OccasionId = 'diwali';
  public readonly title = 'Shubh Deepavali';
  public readonly subtitle = 'Festival of Lights';
  public readonly emoji = '🪔';
  public readonly visualConfig: ThemeVisualConfig = DIWALI_VISUAL_CONFIG;
  public readonly audioConfig: ThemeAudioConfig = DIWALI_AUDIO_CONFIG;
  public readonly group: THREE.Group = new THREE.Group();

  private diyaMesh: DiyaMesh | null = null;
  private thaliMesh: THREE.Mesh | null = null;
  private rangoliMesh: THREE.Mesh | null = null;
  private marigoldRing: THREE.Group | null = null;
  private lanterns: FestiveLanternsHolder | null = null;
  private flamePointLight: THREE.PointLight | null = null;
  private flameController: FlameController | null = null;
  private skyLanternsManager: SkyLanternsManager | null = null;
  private flowerShower: FlowerShower | null = null;
  private interactiveSparkler: InteractiveSparkler | null = null;

  constructor() {
    this.group.name = 'diwali-experience-theme';
  }

  public init(scene: THREE.Scene, _cameraRig?: CameraRig): void {
    // 1. Festive Rangoli Mat at floor base
    this.rangoliMesh = createRangoliMesh();
    this.group.add(this.rangoliMesh);

    // 2. Ornate Hand-Carved Brass Thali (Plate)
    this.thaliMesh = createBrassThaliMesh();
    this.group.add(this.thaliMesh);

    // 3. Sacred Marigold Flower Ring
    this.marigoldRing = createMarigoldRingMesh();
    this.group.add(this.marigoldRing);

    // 4. Floating Indian Festive Lanterns (Akash Kandil)
    this.lanterns = createFestiveLanterns();
    this.group.add(this.lanterns.group);

    // 5. Authentic Terracotta Diya with procedural cotton wick & oil puddle
    this.diyaMesh = new DiyaMesh();
    this.group.add(this.diyaMesh.group);

    // 6. Pre-warmed Flame Point Light & Procedural Multi-layer Flame Controller
    this.flamePointLight = new THREE.PointLight(0xffaa22, 0.0001, 3.5);
    this.flamePointLight.castShadow = true;
    this.group.add(this.flamePointLight);

    this.flameController = new FlameController(this.diyaMesh.wickAnchor, this.flamePointLight);
    this.group.add(this.flameController.group);

    // 7. Akash Kandil (Sky Lanterns) Ceremony Manager
    this.skyLanternsManager = new SkyLanternsManager();
    this.group.add(this.skyLanternsManager.group);

    // 8. Sacred Marigold & Rose Petal Shower
    this.flowerShower = new FlowerShower();
    this.group.add(this.flowerShower.group);

    // 9. Interactive Touch Sparkler Trail
    this.interactiveSparkler = new InteractiveSparkler();
    this.group.add(this.interactiveSparkler.group);

    scene.add(this.group);
  }

  public update(dt: number, elapsed: number): void {
    this.lanterns?.update(elapsed);
    this.flameController?.update(dt, elapsed);
    this.skyLanternsManager?.update(dt, elapsed);
    this.flowerShower?.update(dt, elapsed);
    this.interactiveSparkler?.update(dt, elapsed);
  }

  public async triggerAction(): Promise<void> {
    if (this.flameController) {
      await this.flameController.ignite();
    }
  }

  public onCelebrationStart(): void {
    this.flowerShower?.triggerFlowerShower();
  }

  public getPromptText(): string {
    return 'Touch & drag the flame to light your Diya';
  }

  public getActionButtonText(): string {
    return 'Tap to Light Diya ✨';
  }

  public getInteractionTarget(): InteractiveActionTarget | null {
    if (!this.diyaMesh) return null;
    return {
      object: this.diyaMesh.group,
      hintPosition: new THREE.Vector3(0, 0.25, 0),
    };
  }

  public triggerSkyLantern(): void {
    this.skyLanternsManager?.releaseLantern();
  }

  public triggerFlowerShower(): void {
    this.flowerShower?.triggerFlowerShower();
  }

  public getFlameController(): FlameController | null {
    return this.flameController;
  }

  public getSkyLanternsManager(): SkyLanternsManager | null {
    return this.skyLanternsManager;
  }

  public getFlowerShower(): FlowerShower | null {
    return this.flowerShower;
  }

  public getInteractiveSparkler(): InteractiveSparkler | null {
    return this.interactiveSparkler;
  }

  public getDiyaMesh(): DiyaMesh | null {
    return this.diyaMesh;
  }

  public getThaliMesh(): THREE.Mesh | null {
    return this.thaliMesh;
  }

  public getRangoliMesh(): THREE.Mesh | null {
    return this.rangoliMesh;
  }

  public getMarigoldRing(): THREE.Group | null {
    return this.marigoldRing;
  }

  public getLanterns(): FestiveLanternsHolder | null {
    return this.lanterns;
  }

  public dispose(): void {
    this.flameController?.dispose();
    this.skyLanternsManager?.dispose();
    this.flowerShower?.dispose();
    this.interactiveSparkler?.dispose();
    this.diyaMesh?.dispose();
    this.lanterns?.dispose();

    if (this.rangoliMesh) {
      this.rangoliMesh.geometry.dispose();
      if (Array.isArray(this.rangoliMesh.material)) {
        this.rangoliMesh.material.forEach((m) => m.dispose());
      } else {
        this.rangoliMesh.material.dispose();
      }
      this.rangoliMesh = null;
    }

    if (this.thaliMesh) {
      this.thaliMesh.geometry.dispose();
      if (Array.isArray(this.thaliMesh.material)) {
        this.thaliMesh.material.forEach((m) => m.dispose());
      } else {
        this.thaliMesh.material.dispose();
      }
      this.thaliMesh = null;
    }

    if (this.marigoldRing) {
      this.marigoldRing.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
      this.marigoldRing = null;
    }

    if (this.flamePointLight) {
      this.group.remove(this.flamePointLight);
      this.flamePointLight.dispose();
      this.flamePointLight = null;
    }

    this.group.clear();
  }
}
