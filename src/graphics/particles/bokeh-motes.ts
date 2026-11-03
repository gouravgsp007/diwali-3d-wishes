import * as THREE from 'three';

/**
 * 50 drifting golden bokeh motes wafting behind and around the Diya in a single draw call.
 *
 * Implements:
 * - Single-pass THREE.Points with AdditiveBlending and depthWrite = false (D-11)
 * - Continuous upward drift with horizontal sinusoidal waft
 * - Resource cleanup via dispose() (T-02-05)
 */
export class BokehMotes {
  public points: THREE.Points;
  private particleCount = 50;
  private speeds: Float32Array;
  private phases: Float32Array;
  private texture: THREE.CanvasTexture | null = null;

  constructor() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    this.speeds = new Float32Array(this.particleCount);
    this.phases = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      // Disperse behind and around the Diya: x: [-2.5, 2.5], y: [-0.5, 3.5], z: [-2.2, 1.2]
      positions[i * 3 + 0] = (Math.random() - 0.5) * 5.0;
      positions[i * 3 + 1] = Math.random() * 4.0 - 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3.4 - 0.5;

      this.speeds[i] = 0.15 + Math.random() * 0.25; // Slow upward drift (0.15 to 0.40 units/s)
      this.phases[i] = Math.random() * Math.PI * 2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Procedural circular bokeh texture with soft radial glow
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
      grad.addColorStop(0, 'rgba(255, 240, 190, 1.0)');
      grad.addColorStop(0.35, 'rgba(240, 180, 50, 0.6)');
      grad.addColorStop(1, 'rgba(240, 180, 50, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    this.texture = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      size: 0.16,
      map: this.texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xffd27d,
    });

    this.points = new THREE.Points(geo, mat);
    this.points.name = 'bokeh-motes';
  }

  /**
   * Updates particle positions with vertical upward drift and subtle horizontal waft.
   */
  public update(dt: number, time: number): void {
    const posAttr = this.points.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < this.particleCount; i++) {
      // Upward drift
      arr[i * 3 + 1] += this.speeds[i] * dt;
      // Gentle horizontal waft
      arr[i * 3 + 0] += Math.sin(time + this.phases[i]) * 0.002;

      // Wrap around if risen too high
      if (arr[i * 3 + 1] > 3.8) {
        arr[i * 3 + 1] = -0.5;
        arr[i * 3 + 0] = (Math.random() - 0.5) * 5.0;
      }
    }
    posAttr.needsUpdate = true;
  }

  /**
   * Disposes geometry, material, and canvas texture to prevent GPU memory leaks (T-02-05).
   */
  public dispose(): void {
    this.points.geometry.dispose();
    if (Array.isArray(this.points.material)) {
      this.points.material.forEach((m) => m.dispose());
    } else {
      this.points.material.dispose();
    }
    if (this.texture) {
      this.texture.dispose();
      this.texture = null;
    }
  }
}
