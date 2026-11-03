import * as THREE from 'three';

/**
 * Detects 3D Euclidean proximity between the match follower tip and the
 * Diya cotton wick anchor point per D-02.
 */
export class WickProximityDetector {
  public readonly wickAnchor: THREE.Vector3;
  public readonly threshold: number;

  constructor(
    wickAnchor: THREE.Vector3 = new THREE.Vector3(0.0, 0.68, 1.38),
    threshold: number = 0.35
  ) {
    this.wickAnchor = wickAnchor.clone();
    this.threshold = threshold;
  }

  /**
   * Calculates the 3D Euclidean distance between the given position and the wick anchor.
   */
  public getDistance(position: THREE.Vector3): number {
    return position.distanceTo(this.wickAnchor);
  }

  /**
   * Returns true if the position is strictly within the proximity threshold distance (< 0.35 units).
   */
  public isNearWick(position: THREE.Vector3): boolean {
    return this.getDistance(position) < this.threshold;
  }
}
