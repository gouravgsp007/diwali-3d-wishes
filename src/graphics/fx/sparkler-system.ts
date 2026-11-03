import * as THREE from 'three';

/**
 * 300-particle single-buffer sparkler system (phuljhadi) running in 1 draw call.
 *
 * Implements:
 * - Single BufferGeometry with Float32Array typed arrays allocated once (0 GC during RAF) (D-09)
 * - CPU Euler kinematics with downward gravity (g = -4.5) and air drag (0.92) (D-10)
 * - 3-stage color transition from white-hot to golden-amber to ember-red (D-10, D-11)
 * - ASVS V5 simulation delta time clamping [0.0, 0.1] (T-03-04)
 * - GPU resource cleanup via dispose() (D-13, T-03-05)
 */
export class SparklerSystem {
  public points: THREE.Points;
  private particleCount = 300;
  private positions: Float32Array;
  private colors: Float32Array;
  private velocities: Float32Array;
  private lifetimes: Float32Array;
  private maxLifetimes: Float32Array;
  private wickAnchor: THREE.Vector3;

  constructor(wickAnchor: THREE.Vector3) {
    this.wickAnchor = wickAnchor.clone();
    const geo = new THREE.BufferGeometry();

    this.positions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.lifetimes = new Float32Array(this.particleCount);
    this.maxLifetimes = new Float32Array(this.particleCount);

    // Initial state: all inactive at wick anchor
    for (let i = 0; i < this.particleCount; i++) {
      this.positions[i * 3 + 0] = wickAnchor.x;
      this.positions[i * 3 + 1] = wickAnchor.y;
      this.positions[i * 3 + 2] = wickAnchor.z;

      this.colors[i * 3 + 0] = 1.0;
      this.colors[i * 3 + 1] = 0.95;
      this.colors[i * 3 + 2] = 0.8;

      this.lifetimes[i] = 0.0;
      this.maxLifetimes[i] = 1.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.075,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    });

    this.points = new THREE.Points(geo, mat);
    this.points.name = 'sparkler-particles';
  }

  /**
   * Triggers a celebratory golden sparkler fountain burst.
   * Initializes 300 particles at wickAnchor with upward fountain velocities.
   */
  public burst(): void {
    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      // Position around wick with small horizontal jitter and +0.05 elevation
      this.positions[idx + 0] = this.wickAnchor.x + (Math.random() - 0.5) * 0.04;
      this.positions[idx + 1] = this.wickAnchor.y + 0.05;
      this.positions[idx + 2] = this.wickAnchor.z + (Math.random() - 0.5) * 0.04;

      // Radial horizontal direction with 0.6..1.8 horizontal speed
      const angle = Math.random() * Math.PI * 2;
      const speedHoriz = 0.6 + Math.random() * 1.2;
      this.velocities[idx + 0] = Math.cos(angle) * speedHoriz;
      // Upward erupting velocity 1.8..3.6 units/s
      this.velocities[idx + 1] = 1.8 + Math.random() * 1.8;
      this.velocities[idx + 2] = Math.sin(angle) * speedHoriz;

      // Random lifespan between 1.0 and 2.0 seconds
      const lifespan = 1.0 + Math.random() * 1.0;
      this.lifetimes[i] = lifespan;
      this.maxLifetimes[i] = lifespan;

      // Reset initial color to white-hot
      this.colors[idx + 0] = 1.0;
      this.colors[idx + 1] = 0.95;
      this.colors[idx + 2] = 0.8;
    }

    const posAttr = this.points.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.points.geometry.attributes.color as THREE.BufferAttribute;
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  /**
   * Advances the particle simulation by delta time using CPU Euler integration.
   * Sanitizes dt to [0.0, 0.1] per ASVS V5 to prevent velocity runaway on frame drops.
   */
  public update(dt: number): void {
    const safeDt = Number.isFinite(dt) ? Math.min(Math.max(dt, 0.0), 0.1) : 0.0;
    if (safeDt <= 0.0) return;

    const posAttr = this.points.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.points.geometry.attributes.color as THREE.BufferAttribute;
    const drag = Math.pow(0.92, safeDt * 60.0);

    let anyActive = false;

    for (let i = 0; i < this.particleCount; i++) {
      if (this.lifetimes[i] <= 0.0) continue;
      anyActive = true;

      this.lifetimes[i] -= safeDt;

      const idx = i * 3;
      // Gravity acceleration (g = -4.5 units/s^2)
      this.velocities[idx + 1] += -4.5 * safeDt;
      // Air drag on horizontal velocities
      this.velocities[idx + 0] *= drag;
      this.velocities[idx + 2] *= drag;

      // Update positions
      this.positions[idx + 0] += this.velocities[idx + 0] * safeDt;
      this.positions[idx + 1] += this.velocities[idx + 1] * safeDt;
      this.positions[idx + 2] += this.velocities[idx + 2] * safeDt;

      // Color fade: White-hot -> Golden-amber -> Ember-red
      const progress = 1.0 - Math.max(0.0, this.lifetimes[i] / this.maxLifetimes[i]);
      if (progress < 0.4) {
        // White-hot
        this.colors[idx + 0] = 1.0;
        this.colors[idx + 1] = 0.95;
        this.colors[idx + 2] = 0.8;
      } else if (progress < 0.8) {
        // Golden amber
        this.colors[idx + 0] = 1.0;
        this.colors[idx + 1] = 0.65;
        this.colors[idx + 2] = 0.1;
      } else {
        // Ember red
        this.colors[idx + 0] = 0.85;
        this.colors[idx + 1] = 0.2;
        this.colors[idx + 2] = 0.05;
      }
    }

    if (anyActive) {
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
    }
  }

  /**
   * Deallocates GPU buffers and material to prevent memory leaks (D-13).
   */
  public dispose(): void {
    this.points.geometry.dispose();
    if (Array.isArray(this.points.material)) {
      this.points.material.forEach((m) => m.dispose());
    } else {
      this.points.material.dispose();
    }
  }
}
