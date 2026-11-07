import * as THREE from 'three';
import { getSparkTexture } from '../materials/procedural-textures';

export interface Fireworks3DOptions {
  maxParticles?: number;
}

interface ParticleState {
  active: boolean;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  drag: number;
  gravity: number;
  baseR: number;
  baseG: number;
  baseB: number;
  isFlicker: boolean;
}

const ROCKET_PALETTES: Record<number, THREE.Color[]> = {
  1: [
    new THREE.Color('#FBBF24'), // Gold
    new THREE.Color('#F59E0B'), // Saffron Amber
    new THREE.Color('#FEF08A'), // Light Gold
    new THREE.Color('#D97706'), // Deep Amber
    new THREE.Color('#FFFBEB'), // Pure warm white spark
  ],
  2: [
    new THREE.Color('#EF4444'), // Ruby red
    new THREE.Color('#10B981'), // Emerald green
    new THREE.Color('#F43F5E'), // Rose
    new THREE.Color('#34D399'), // Mint green
    new THREE.Color('#FDE047'), // Star yellow
  ],
  3: [
    new THREE.Color('#38BDF8'), // Sky blue
    new THREE.Color('#818CF8'), // Indigo / violet
    new THREE.Color('#FFFFFF'), // Pure diamond white flash
    new THREE.Color('#C084FC'), // Purple
    new THREE.Color('#FDE047'), // Electric spark
  ],
};

/**
 * High-performance, zero-allocation 3D particle fireworks engine in WebGL.
 *
 * Simulates spherical explosive shells, atmospheric drag, gravitational descent,
 * trailing rocket sparks, and dynamic explosion illumination.
 */
export class Fireworks3D {
  public readonly group = new THREE.Group();

  private readonly maxParticles: number;
  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.PointsMaterial;
  private readonly points: THREE.Points;

  private readonly positionAttr: THREE.BufferAttribute;
  private readonly colorAttr: THREE.BufferAttribute;

  private readonly particles: ParticleState[];
  private activeCount = 0;

  private readonly flashLight: THREE.PointLight;
  private flashDecayRate = 14.0; // Rapid ~250ms decay

  constructor(options: Fireworks3DOptions = {}) {
    this.maxParticles = options.maxParticles ?? 1200;

    const positions = new Float32Array(this.maxParticles * 3);
    const colors = new Float32Array(this.maxParticles * 3);

    // Initialize all offscreen with zero color
    for (let i = 0; i < this.maxParticles; i++) {
      positions[i * 3 + 1] = -9999;
      colors[i * 3 + 0] = 0;
      colors[i * 3 + 1] = 0;
      colors[i * 3 + 2] = 0;
    }

    this.geometry = new THREE.BufferGeometry();
    this.positionAttr = new THREE.BufferAttribute(positions, 3);
    this.colorAttr = new THREE.BufferAttribute(colors, 3);

    this.geometry.setAttribute('position', this.positionAttr);
    this.geometry.setAttribute('color', this.colorAttr);

    this.material = new THREE.PointsMaterial({
      size: 0.28,
      map: getSparkTexture(),
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 1.0,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.group.add(this.points);

    // Dynamic 3D Flash PointLight
    this.flashLight = new THREE.PointLight(0xffecd1, 0, 30, 2);
    this.flashLight.castShadow = false;
    this.group.add(this.flashLight);

    // Initialize state objects once (zero GC allocation in game loop)
    this.particles = new Array<ParticleState>(this.maxParticles);
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles[i] = {
        active: false,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 1,
        drag: 0.96,
        gravity: -2.8,
        baseR: 1,
        baseG: 1,
        baseB: 1,
        isFlicker: false,
      };
    }
  }

  /**
   * Triggers a true 3D spherical fireworks explosion.
   *
   * @param pos 3D world origin of the detonation
   * @param typeId Rocket ID (1: Swarna Baan, 2: Taramandal, 3: Dhamaaka)
   * @param count Number of shell sparks to spawn
   */
  public triggerBurst(pos: THREE.Vector3, typeId: number, count = 220): void {
    const palette = ROCKET_PALETTES[typeId] || ROCKET_PALETTES[1];
    const isWillow = typeId === 1;
    const isDhamaaka = typeId === 3;

    // Trigger dynamic 3D explosion flash
    const flashColor = palette[0] || new THREE.Color(0xfff0c2);
    this.flashLight.color.copy(flashColor);
    this.flashLight.position.copy(pos);
    this.flashLight.intensity = 4.2;

    const positions = this.positionAttr.array as Float32Array;
    const colors = this.colorAttr.array as Float32Array;

    let spawned = 0;
    for (let i = 0; i < this.maxParticles && spawned < count; i++) {
      const p = this.particles[i];
      if (p.active) continue;

      p.active = true;
      p.life = 0;
      p.maxLife = isWillow ? 1.8 + Math.random() * 0.8 : 1.2 + Math.random() * 0.6;
      p.gravity = isWillow ? -3.8 : -2.4;
      p.drag = isDhamaaka ? 0.92 : 0.955;
      p.isFlicker = Math.random() > 0.4;

      // 3D Spherical Coordinate mapping
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = isDhamaaka
        ? 3.5 + Math.random() * 6.5
        : isWillow
          ? 2.0 + Math.random() * 4.2
          : 2.8 + Math.random() * 5.0;

      p.vx = speed * Math.sin(phi) * Math.cos(theta);
      p.vy = speed * Math.sin(phi) * Math.sin(theta);
      p.vz = speed * Math.cos(phi);

      const color = palette[Math.floor(Math.random() * palette.length)];
      p.baseR = color.r;
      p.baseG = color.g;
      p.baseB = color.b;

      const idx = i * 3;
      positions[idx] = pos.x;
      positions[idx + 1] = pos.y;
      positions[idx + 2] = pos.z;

      colors[idx] = color.r;
      colors[idx + 1] = color.g;
      colors[idx + 2] = color.b;

      spawned++;
    }

    this.activeCount += spawned;
    this.positionAttr.needsUpdate = true;
    this.colorAttr.needsUpdate = true;
  }

  /**
   * Emits spark particles along an ascending rocket's trajectory.
   */
  public emitTrail(pos: THREE.Vector3, colorHex = '#F59E0B', count = 6): void {
    const col = new THREE.Color(colorHex);
    const positions = this.positionAttr.array as Float32Array;
    const colors = this.colorAttr.array as Float32Array;

    let spawned = 0;
    for (let i = 0; i < this.maxParticles && spawned < count; i++) {
      const p = this.particles[i];
      if (p.active) continue;

      p.active = true;
      p.life = 0;
      p.maxLife = 0.35 + Math.random() * 0.25;
      p.gravity = -1.2;
      p.drag = 0.88;
      p.isFlicker = true;

      // Slight spray cone downward
      p.vx = (Math.random() - 0.5) * 0.6;
      p.vy = -1.5 - Math.random() * 1.8;
      p.vz = (Math.random() - 0.5) * 0.6;

      p.baseR = col.r;
      p.baseG = col.g;
      p.baseB = col.b;

      const idx = i * 3;
      positions[idx] = pos.x + (Math.random() - 0.5) * 0.08;
      positions[idx + 1] = pos.y - 0.15;
      positions[idx + 2] = pos.z + (Math.random() - 0.5) * 0.08;

      colors[idx] = col.r;
      colors[idx + 1] = col.g;
      colors[idx + 2] = col.b;

      spawned++;
    }

    this.activeCount += spawned;
    this.positionAttr.needsUpdate = true;
    this.colorAttr.needsUpdate = true;
  }

  /**
   * Advances the 3D particle physics simulation.
   */
  public update(deltaTime: number): void {
    const maxSubStep = 0.1;
    let remaining = Math.min(deltaTime, 5.0); // Bound large time leaps

    while (remaining > 0) {
      const dt = Math.min(remaining, maxSubStep);
      this.step(dt);
      remaining -= dt;
      if (this.activeCount === 0 && this.flashLight.intensity <= 0) break;
    }
  }

  private step(dt: number): void {
    // 1. Decay Flash PointLight
    if (this.flashLight.intensity > 0) {
      this.flashLight.intensity = Math.max(0, this.flashLight.intensity - this.flashDecayRate * dt);
    }

    if (this.activeCount === 0) return;

    const positions = this.positionAttr.array as Float32Array;
    const colors = this.colorAttr.array as Float32Array;
    let currentlyActive = 0;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        positions[i * 3 + 1] = -9999; // Move offscreen
        colors[i * 3 + 0] = 0;
        colors[i * 3 + 1] = 0;
        colors[i * 3 + 2] = 0;
        continue;
      }

      currentlyActive++;

      // Euler integration
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy *= Math.pow(p.drag, dt * 60);
      p.vz *= Math.pow(p.drag, dt * 60);
      p.vy += p.gravity * dt;

      const idx = i * 3;
      positions[idx] += p.vx * dt;
      positions[idx + 1] += p.vy * dt;
      positions[idx + 2] += p.vz * dt;

      // Alpha decay & twinkling
      const progress = p.life / p.maxLife;
      const alpha = Math.max(0, 1.0 - progress);
      const twinkle = p.isFlicker ? (Math.sin(p.life * 30 + i) > 0 ? 1.0 : 0.4) : 1.0;
      const mult = alpha * twinkle;

      colors[idx] = p.baseR * mult;
      colors[idx + 1] = p.baseG * mult;
      colors[idx + 2] = p.baseB * mult;
    }

    this.activeCount = currentlyActive;
    this.positionAttr.needsUpdate = true;
    this.colorAttr.needsUpdate = true;
  }

  public getActiveParticleCount(): number {
    return this.activeCount;
  }

  public getFlashLight(): THREE.PointLight {
    return this.flashLight;
  }

  public dispose(): void {
    this.activeCount = 0;
    this.group.remove(this.points);
    this.group.remove(this.flashLight);
    this.geometry.dispose();
    this.material.dispose();
    this.particles.length = 0;
  }
}
