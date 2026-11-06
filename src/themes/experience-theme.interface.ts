import * as THREE from 'three';
import type { CameraRig } from '../graphics/camera-rig';

export type OccasionId = 'diwali' | 'birthday' | 'wedding' | 'newyear';

export interface ThemeVisualConfig {
  accentColor: string; // e.g. '#f59e0b', '#ec4899', '#e11d48', '#8b5cf6'
  primaryGradient: string;
  cardBorderColor: string;
  floatingMotesColor: number;
  cameraBasePos: THREE.Vector3;
  cameraLookAt: THREE.Vector3;
  revealedCameraPos: THREE.Vector3;
  revealedCameraLookAt: THREE.Vector3;
}

export interface ThemeAudioConfig {
  defaultTrackId: string;
  actionSfx: string;
  celebrationSfx: string;
  tracks: { id: string; label: string; url: string }[];
}

export interface InteractiveActionTarget {
  object: THREE.Object3D;
  hintPosition: THREE.Vector3;
}

/**
 * Universal Experience Theme Interface.
 * Every celebratory occasion (Diwali, Birthday, Wedding, New Year) implements this contract.
 */
export interface ExperienceTheme {
  readonly id: OccasionId;
  readonly title: string;
  readonly subtitle: string;
  readonly emoji: string;
  readonly visualConfig: ThemeVisualConfig;
  readonly audioConfig: ThemeAudioConfig;
  readonly group: THREE.Group;

  /**
   * Initializes theme meshes, lights, and particle systems into its internal group.
   */
  init(scene: THREE.Scene, cameraRig: CameraRig): Promise<void> | void;

  /**
   * Per-frame simulation tick (swaying particles, flickering flames, drifting motes).
   */
  update(deltaTime: number, elapsedTime: number): void;

  /**
   * Primary celebratory user interaction:
   * - Diwali: Light flame on wick
   * - Birthday: Blow out candles
   * - Wedding: Open velvet jewelry box
   * - New Year: Pop champagne cork
   */
  triggerAction(): Promise<void>;

  /**
   * Celebratory sequence triggered upon action completion.
   */
  onCelebrationStart(): void;

  /**
   * Returns touch hint instruction (e.g. "Tap to light Diya", "Tap to blow out candles").
   */
  getPromptText(): string;

  /**
   * Returns action button label.
   */
  getActionButtonText(): string;

  /**
   * Returns object to hit-test for touch/pointer interactions, or null.
   */
  getInteractionTarget(): InteractiveActionTarget | null;

  /**
   * Frees GPU geometries, textures, materials, and listeners.
   */
  dispose(): void;
}
