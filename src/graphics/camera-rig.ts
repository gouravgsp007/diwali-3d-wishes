import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

/**
 * Responsive CameraRig for the Diwali Diya 3D scene.
 *
 * Provides:
 * - Elevated ~30° cinematic pitch pointing at the Diya origin (D-05)
 * - Trigonometric portrait vFOV compensation preserving horizontal framing (D-06, D-08)
 * - Damped touch/pointer parallax clamped to ±15° yaw and ±10° pitch (D-14, T-02-01)
 * - Spring auto-return to center upon pointer release (D-14)
 * - Subtle harmonic Lissajous figure-8 breathing sway on an 8s cycle (D-13)
 * - Dynamic dolly & pan target transitions via Tween.js (D-07)
 */
export class CameraRig {
  public camera: THREE.PerspectiveCamera;
  private readonly baseFov: number = 45; // 45° vertical FOV for landscape / square viewports
  private basePosition = new THREE.Vector3(0, 2.3, 3.8); // 30° elevated pitch
  private currentTarget = new THREE.Vector3(0, 0.25, 0);

  // Parallax tracking
  private targetParallax = new THREE.Vector2(0, 0);
  private currentParallax = new THREE.Vector2(0, 0);

  // Lissajous breathing sway state
  private swayTime = 0;

  constructor(width: number, height: number) {
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(this.baseFov, aspect, 0.1, 50);
    this.updateFov(aspect);
    this.camera.position.copy(this.basePosition);
    this.camera.lookAt(this.currentTarget);
  }

  /**
   * Updates vertical FOV and projection matrix according to aspect ratio.
   * On portrait screens (aspect < 1.0), expands vFOV to maintain constant horizontal framing.
   */
  public updateFov(aspect: number): void {
    if (aspect < 1.0) {
      const baseFovRad = THREE.MathUtils.degToRad(this.baseFov);
      const vFovRad = 2 * Math.atan(Math.tan(baseFovRad / 2) / aspect);
      this.camera.fov = THREE.MathUtils.radToDeg(vFovRad);
    } else {
      this.camera.fov = this.baseFov;
    }
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Updates target parallax from normalized pointer coordinates [-1, 1].
   * Clamped to ±0.26 rad (±15° yaw) and ±0.17 rad (±10° pitch) for ASVS V5 input safety.
   */
  public onPointerMove(normalizedX: number, normalizedY: number): void {
    const safeX = typeof normalizedX === 'number' && !Number.isNaN(normalizedX) ? normalizedX : 0;
    const safeY = typeof normalizedY === 'number' && !Number.isNaN(normalizedY) ? normalizedY : 0;

    this.targetParallax.set(
      Math.max(-0.26, Math.min(0.26, safeX * 0.26)),
      Math.max(-0.17, Math.min(0.17, safeY * 0.17))
    );
  }

  /**
   * Resets parallax target to origin for spring auto-return upon pointer release.
   */
  public onPointerUp(): void {
    this.targetParallax.set(0, 0);
  }

  /**
   * Tweens base position towards target coordinates via Cubic.Out easing.
   */
  public dollyTo(targetPos: THREE.Vector3, durationMs: number = 1200): Promise<void> {
    return new Promise((resolve) => {
      const tween = new TWEEN.Tween(this.basePosition, true)
        .to({ x: targetPos.x, y: targetPos.y, z: targetPos.z }, durationMs)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate(() => {
          this.camera.position.z = this.basePosition.z;
        })
        .onComplete(() => {
          this.camera.position.z = this.basePosition.z;
          resolve();
        })
        .start();
      TWEEN.add(tween);
    });
  }

  /**
   * Tweens look-at target towards target coordinates via Quadratic.Out easing.
   */
  public panTargetTo(targetLook: THREE.Vector3, durationMs: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      const tween = new TWEEN.Tween(this.currentTarget, true)
        .to({ x: targetLook.x, y: targetLook.y, z: targetLook.z }, durationMs)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => resolve())
        .start();
      TWEEN.add(tween);
    });
  }

  /**
   * Advances simulation frame:
   * - Lerps parallax towards target
   * - Computes Lissajous figure-8 breathing sway
   * - Recomputes camera position and lookAt
   */
  public update(deltaTimeSeconds: number): void {
    // 1. Damped auto-return
    this.currentParallax.lerp(this.targetParallax, 0.08);

    // 2. Harmonic Lissajous breathing sway (8s cycle)
    this.swayTime += deltaTimeSeconds;
    const swayX = Math.sin(this.swayTime * ((2 * Math.PI) / 8.0)) * 0.08;
    const swayY = Math.sin(this.swayTime * ((4 * Math.PI) / 8.0)) * 0.04;

    this.camera.position.x = this.basePosition.x + swayX + Math.sin(this.currentParallax.x) * 2.0;
    this.camera.position.y = this.basePosition.y + swayY + Math.sin(this.currentParallax.y) * 1.0;
    this.camera.position.z = this.basePosition.z;

    this.camera.lookAt(this.currentTarget);
  }
}
