import * as THREE from 'three';

export class GlowHalo {
  public sprite: THREE.Sprite;
  public material: THREE.SpriteMaterial;
  public texture: THREE.CanvasTexture | null = null;
  private baseScale = 1.8;
  private currentScale = 0.001;

  constructor(flameCenter: THREE.Vector3) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // 5-stop radial gradient from incandescent core to fully transparent edge
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0.0, 'rgba(255, 250, 220, 1.0)'); // Incandescent core
      grad.addColorStop(0.2, 'rgba(255, 170, 34, 0.85)'); // Golden amber
      grad.addColorStop(0.5, 'rgba(255, 100, 10, 0.35)'); // Warm orange aura
      grad.addColorStop(0.8, 'rgba(180, 40, 5, 0.08)');   // Nocturnal glow
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');       // Fully transparent edge
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }

    this.texture = new THREE.CanvasTexture(canvas);

    this.material = new THREE.SpriteMaterial({
      map: this.texture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      color: 0xffaa33,
    });

    this.sprite = new THREE.Sprite(this.material);
    this.sprite.name = 'glow-halo';
    this.sprite.position.copy(flameCenter);
    this.sprite.scale.set(0.001, 0.001, 1.0); // Initially unlit
  }

  /**
   * Sets halo glow intensity factor [0.001..1.5], scaling the billboard sprite proportionally.
   */
  public setIntensity(factor: number): void {
    const clamped = Math.max(0.001, Math.min(factor, 1.5));
    this.currentScale = this.baseScale * clamped;
    this.sprite.scale.set(this.currentScale, this.currentScale, 1.0);
  }

  /**
   * Applies subtle sinusoidal breathing scale modulation (+/- 4%) without mutating position.
   */
  public update(elapsedTime: number): void {
    if (this.currentScale <= 0.01) return;
    const breath = 1.0 + Math.sin(elapsedTime * 5.0) * 0.04;
    const s = this.currentScale * breath;
    this.sprite.scale.set(s, s, 1.0);
  }

  /**
   * Deallocates GPU material and texture resources to prevent memory leaks per D-13.
   */
  public dispose(): void {
    this.material.dispose();
    if (this.texture) {
      this.texture.dispose();
      this.texture = null;
    }
  }
}
