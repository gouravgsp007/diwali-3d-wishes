import * as THREE from 'three';
import type { CameraRig } from '../graphics/camera-rig';
import { WickProximityDetector } from './proximity-detector';

/**
 * Translates mobile pointer and touch drag gestures into 3D world coordinates
 * projected onto an elevated horizontal plane (y = 0.68) passing through the WickAnchor.
 *
 * Implements:
 * - Raycaster screen-to-world projection on plane y = 0.68 (D-01)
 * - ASVS V5 boundary clamping (Math.hypot(x, z) <= 3.2) preventing horizon runaway (T-04-01)
 * - Proximity detection to WickAnchor (0.0, 0.68, 1.38) (< 0.35 threshold) (D-02)
 * - Haptic feedback pulse navigator.vibrate([30, 50, 40]) upon ignition (D-02)
 * - Full listener and 3D resource cleanup on dispose() (D-09, ASVS V14)
 */
export class TouchController {
  private container: HTMLElement;
  private cameraRig: CameraRig;
  private matchFollower: THREE.Object3D;
  private onIgniteTrigger: () => void;
  private onTouchStart?: () => void;

  private raycaster: THREE.Raycaster;
  private plane: THREE.Plane;
  private intersectionPoint: THREE.Vector3;
  private isDragging = false;
  private isIgnited = false;
  public readonly proximityDetector: WickProximityDetector;

  private onPointerDownBound: (e: PointerEvent) => void;
  private onPointerMoveBound: (e: PointerEvent) => void;
  private onPointerUpBound: (e: PointerEvent) => void;
  private onPointerCancelBound: (e: PointerEvent) => void;

  constructor(
    container: HTMLElement,
    cameraRig: CameraRig,
    matchFollower: THREE.Object3D,
    onIgniteTrigger: () => void,
    onTouchStart?: () => void,
    proximityDetector: WickProximityDetector = new WickProximityDetector()
  ) {
    this.container = container;
    this.cameraRig = cameraRig;
    this.matchFollower = matchFollower;
    this.onIgniteTrigger = onIgniteTrigger;
    this.onTouchStart = onTouchStart;
    this.proximityDetector = proximityDetector;

    this.raycaster = new THREE.Raycaster();
    // Plane equation: n · p + d = 0 -> (0, 1, 0) · (x, 0.68, z) + (-0.68) = 0
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.68);
    this.intersectionPoint = new THREE.Vector3();

    // Ensure match follower starts hidden
    this.matchFollower.visible = false;

    this.onPointerDownBound = this.onPointerDown.bind(this);
    this.onPointerMoveBound = this.onPointerMove.bind(this);
    this.onPointerUpBound = this.onPointerUp.bind(this);
    this.onPointerCancelBound = this.onPointerCancel.bind(this);

    this.container.addEventListener('pointerdown', this.onPointerDownBound, { passive: false });
    window.addEventListener('pointermove', this.onPointerMoveBound, { passive: false });
    window.addEventListener('pointerup', this.onPointerUpBound);
    window.addEventListener('pointercancel', this.onPointerCancelBound);
  }

  private onPointerDown(e: PointerEvent): void {
    if (this.isIgnited) return;

    this.isDragging = true;
    this.onTouchStart?.();
    this.matchFollower.visible = true;
    this.updatePosition(e.clientX, e.clientY);
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isDragging || this.isIgnited) return;

    this.updatePosition(e.clientX, e.clientY);
  }

  private onPointerUp(_e: PointerEvent): void {
    if (this.isIgnited) return;

    this.isDragging = false;
    this.matchFollower.visible = false;
  }

  private onPointerCancel(e: PointerEvent): void {
    this.onPointerUp(e);
  }

  /**
   * Projects 2D screen client coordinates to 3D world space onto the horizontal plane y = 0.68.
   * Clamps distance from the origin to a max radius of 3.2 units to prevent runaway towards horizon.
   */
  public updatePosition(clientX: number, clientY: number): void {
    const rect = this.container.getBoundingClientRect();
    const width = rect.width || window.innerWidth || 1;
    const height = rect.height || window.innerHeight || 1;

    // Normalized Device Coordinates [-1, 1]
    const ndcX = ((clientX - rect.left) / width) * 2 - 1;
    const ndcY = -(((clientY - rect.top) / height) * 2 - 1);

    this.raycaster.setFromCamera({ x: ndcX, y: ndcY }, this.cameraRig.camera);

    const hit = this.raycaster.ray.intersectPlane(this.plane, this.intersectionPoint);
    if (hit) {
      // ASVS V5 Boundary Clamping (preventing horizon runaway / NaN coordinates)
      const maxRadius = 3.2;
      const radius = Math.hypot(this.intersectionPoint.x, this.intersectionPoint.z);
      if (radius > maxRadius && radius > 0) {
        this.intersectionPoint.x = (this.intersectionPoint.x / radius) * maxRadius;
        this.intersectionPoint.z = (this.intersectionPoint.z / radius) * maxRadius;
      }

      this.matchFollower.position.copy(this.intersectionPoint);

      if (this.proximityDetector.isNearWick(this.intersectionPoint)) {
        this.triggerIgnition();
      }
    }
  }

  /**
   * Triggers Diya ignition sequence and fires haptic vibration pulse if supported.
   */
  private triggerIgnition(): void {
    if (this.isIgnited) return;

    this.isIgnited = true;
    this.isDragging = false;
    this.matchFollower.visible = false;

    // Feature-detected Vibration API pulse per D-02
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([30, 50, 40]);
      } catch {
        // Safe no-op on platforms where vibrate is restricted or throws
      }
    }

    this.onIgniteTrigger();
  }

  public isDraggingActive(): boolean {
    return this.isDragging;
  }

  public isIgnitionTriggered(): boolean {
    return this.isIgnited;
  }

  public reset(): void {
    this.isIgnited = false;
    this.isDragging = false;
    this.matchFollower.visible = false;
  }

  public dispose(): void {
    this.container.removeEventListener('pointerdown', this.onPointerDownBound);
    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('pointerup', this.onPointerUpBound);
    window.removeEventListener('pointercancel', this.onPointerCancelBound);

    if (this.matchFollower.parent) {
      this.matchFollower.parent.remove(this.matchFollower);
    }

    this.isDragging = false;
  }
}
