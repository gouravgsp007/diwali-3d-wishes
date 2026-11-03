import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { FlameMesh } from './flame-mesh';
import { GlowHalo } from './glow-halo';
import { SparklerSystem } from './sparkler-system';
import { computeFlameLightIntensity } from '../lighting-rig';

/**
 * Top-level flame FX orchestrator.
 *
 * Implements:
 * - Aggregates FlameMesh, GlowHalo, SparklerSystem, and PointLight into a single group (D-12)
 * - Cubic.Out 750ms ignition tweening for scale, glow, and point light illumination (D-04, D-06, D-11)
 * - Multi-frequency harmonic PointLight jitter in RAF loop (D-06, D-12)
 * - Safe dt clamping [0.0, 0.1] protecting against physics runaway per ASVS V5 (T-03-04)
 * - Cascading GPU resource deallocation via dispose() (D-13, T-03-05)
 * - Idempotent ignition preventing concurrent triggers (T-03-06)
 */
export class FlameController {
  public group: THREE.Group;
  private flameMesh: FlameMesh;
  private glowHalo: GlowHalo;
  private sparklerSystem: SparklerSystem;
  private flamePointLight: THREE.PointLight;
  private isLit = false;
  private baseLightIntensity = 0.0001;
  private ignitionPromise: Promise<void> | null = null;
  private activeTween: TWEEN.Tween<{ scale: number; lightIntensity: number; haloIntensity: number }> | null = null;

  constructor(wickAnchor: THREE.Vector3, flamePointLight: THREE.PointLight) {
    this.group = new THREE.Group();
    this.group.name = 'flame-controller-group';

    this.flamePointLight = flamePointLight;
    // Align flame point light 0.15 units directly above wick anchor (D-05)
    this.flamePointLight.position.set(wickAnchor.x, wickAnchor.y + 0.15, wickAnchor.z);

    // 1. Procedural GLSL Flame Mesh anchored at wick
    this.flameMesh = new FlameMesh(wickAnchor);
    this.group.add(this.flameMesh.mesh);

    // 2. Additive Glow Halo Sprite positioned at flame belly (~0.20 units above wick) (D-07, D-08)
    const haloPosition = new THREE.Vector3(wickAnchor.x, wickAnchor.y + 0.20, wickAnchor.z);
    this.glowHalo = new GlowHalo(haloPosition);
    this.group.add(this.glowHalo.sprite);

    // 3. Single-Buffer 300-Particle Sparkler Fountain System (D-09, D-10)
    this.sparklerSystem = new SparklerSystem(wickAnchor);
    this.group.add(this.sparklerSystem.points);
  }

  /**
   * Initiates celebratory sparkler burst and smoothly tweens flame scale, halo glow,
   * and PointLight intensity using Cubic.Out easing over 750ms (D-04, D-06, D-11).
   * Idempotent: returns existing promise if already igniting or lit.
   */
  public ignite(): Promise<void> {
    if (this.ignitionPromise) {
      return this.ignitionPromise;
    }
    if (this.isLit) {
      return Promise.resolve();
    }

    this.isLit = true;

    // Immediately trigger celebratory sparkler fountain burst
    this.sparklerSystem.burst();

    this.ignitionPromise = new Promise<void>((resolve) => {
      const animState = { scale: 0.0, lightIntensity: 0.0001, haloIntensity: 0.001 };

      this.activeTween = new TWEEN.Tween(animState, true)
        .to({ scale: 1.0, lightIntensity: 2.8, haloIntensity: 1.0 }, 750)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate(() => {
          this.flameMesh.setScale(animState.scale);
          this.glowHalo.setIntensity(animState.haloIntensity);
          this.baseLightIntensity = animState.lightIntensity;
          if (this.baseLightIntensity <= 0.01) {
            this.flamePointLight.intensity = this.baseLightIntensity;
          }
        })
        .onComplete(() => {
          this.activeTween = null;
          resolve();
        })
        .start();

      TWEEN.add(this.activeTween);
    });

    return this.ignitionPromise;
  }

  /**
   * Advances the flame shader simulation, breathing halo oscillation,
   * particle Euler kinematics, and dynamic PointLight harmonic flicker.
   */
  public update(dt: number, elapsedTime: number): void {
    const safeDt = Number.isFinite(dt) ? Math.min(Math.max(dt, 0.0), 0.1) : 0.0;

    this.flameMesh.updateTime(elapsedTime);
    this.glowHalo.update(elapsedTime);
    this.sparklerSystem.update(safeDt);

    if (this.baseLightIntensity > 0.01) {
      this.flamePointLight.intensity = computeFlameLightIntensity(this.baseLightIntensity, elapsedTime);
    }
  }

  public isIgnited(): boolean {
    return this.isLit;
  }

  public getBaseLightIntensity(): number {
    return this.baseLightIntensity;
  }

  public getFlameMesh(): FlameMesh {
    return this.flameMesh;
  }

  public getGlowHalo(): GlowHalo {
    return this.glowHalo;
  }

  public getSparklerSystem(): SparklerSystem {
    return this.sparklerSystem;
  }

  public getPointLight(): THREE.PointLight {
    return this.flamePointLight;
  }

  /**
   * Cascades deallocation across all children and resets state to prevent memory leaks (D-13).
   */
  public dispose(): void {
    if (this.activeTween) {
      this.activeTween.stop();
      this.activeTween = null;
    }
    this.flameMesh.dispose();
    this.glowHalo.dispose();
    this.sparklerSystem.dispose();
    this.group.clear();

    this.isLit = false;
    this.ignitionPromise = null;
    this.baseLightIntensity = 0.0001;
    this.flamePointLight.intensity = 0.0001;
  }
}
