import * as THREE from 'three';
import { AudioEngine } from '../../audio/audio-engine';
import type { CameraRig } from '../camera-rig';

interface SparkParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
}

// Reusable color instances to prevent GC allocations inside requestAnimationFrame
const SPARK_GOLD = new THREE.Color(0xffd54f);
const SPARK_ORANGE = new THREE.Color(0xff7043);
const SPARK_WHITE = new THREE.Color(0xffffff);

/**
 * Handheld Diwali Phuljhadi (Sparkler) particle system.
 * Allows visitors to paint with sizzling golden sparks across the 3D scene.
 */
export class InteractiveSparkler {
  public readonly group: THREE.Group;
  private points: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private tipLight: THREE.PointLight;
  private tipMesh: THREE.Mesh;

  private particles: SparkParticle[] = [];
  private maxParticles = 320;
  private tipPosition = new THREE.Vector3(0, 0.75, 1.4);
  private isSparkling = false;
  private raycaster = new THREE.Raycaster();
  private pointerNdc = new THREE.Vector2();
  private lastSizzleTime = 0;

  // Scratch objects for pointer raycasting (reused to prevent GC churn)
  private static readonly _cameraDir = new THREE.Vector3();
  private static readonly _planeNormal = new THREE.Vector3();
  private static readonly _planePoint = new THREE.Vector3(0, 0.75, 1.2);
  private static readonly _cameraPlane = new THREE.Plane();
  private static readonly _hit = new THREE.Vector3();
  private static readonly _projected = new THREE.Vector3();

  constructor(private readonly onNearWick?: (pos: THREE.Vector3) => void) {
    this.group = new THREE.Group();

    // 1. Tip glowing ember sphere
    const tipGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0xffeedd });
    this.tipMesh = new THREE.Mesh(tipGeo, tipMat);
    this.tipMesh.visible = false;
    this.group.add(this.tipMesh);

    // 2. Dynamic warm light cast
    this.tipLight = new THREE.PointLight(0xffaa22, 0.0, 2.5);
    this.group.add(this.tipLight);

    // 3. Particle system
    const positions = new Float32Array(this.maxParticles * 3);
    const colors = new Float32Array(this.maxParticles * 3);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.material = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.group.add(this.points);
  }

  public setActive(active: boolean): void {
    this.isSparkling = active;
    this.tipMesh.visible = active;
    this.tipLight.intensity = active ? 1.8 : 0.0;
    if (active) {
      AudioEngine.getInstance().playSparklerSizzle();
    }
  }

  public getActive(): boolean {
    return this.isSparkling;
  }

  /**
   * Updates tip 3D position from 2D screen coordinate raycast.
   * Uses camera-facing hero plane so touches across the entire screen (including upper sky)
   * reliably position the sparkler wand tip.
   */
  public updatePointer(clientX: number, clientY: number, container: HTMLElement, cameraRig: CameraRig): void {
    if (!this.isSparkling || !cameraRig?.camera) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width || window.innerWidth || 1;
    const height = rect.height || window.innerHeight || 1;

    this.pointerNdc.x = ((clientX - rect.left) / width) * 2 - 1;
    this.pointerNdc.y = -(((clientY - rect.top) / height) * 2 - 1);

    this.raycaster.setFromCamera(this.pointerNdc, cameraRig.camera);

    // Dynamic camera-facing plane perpendicular to camera direction passing through hero focal point
    cameraRig.camera.getWorldDirection(InteractiveSparkler._cameraDir);
    InteractiveSparkler._planeNormal.copy(InteractiveSparkler._cameraDir).negate();
    InteractiveSparkler._cameraPlane.setFromNormalAndCoplanarPoint(
      InteractiveSparkler._planeNormal,
      InteractiveSparkler._planePoint
    );

    const hasHit = this.raycaster.ray.intersectPlane(
      InteractiveSparkler._cameraPlane,
      InteractiveSparkler._hit
    );

    if (hasHit) {
      // Clamping within visible arena radius
      const maxR = 3.2;
      const hit = InteractiveSparkler._hit;
      const r = Math.hypot(hit.x, hit.z - 1.2);
      if (r > maxR && r > 0) {
        hit.x = (hit.x / r) * maxR;
        hit.z = 1.2 + ((hit.z - 1.2) / r) * maxR;
      }
      this.tipPosition.copy(hit);
    } else {
      // Fallback projection along ray at standard comfortable viewing depth
      InteractiveSparkler._projected
        .copy(this.raycaster.ray.origin)
        .addScaledVector(this.raycaster.ray.direction, 2.4);
      this.tipPosition.copy(InteractiveSparkler._projected);
    }

    this.tipMesh.position.copy(this.tipPosition);
    this.tipLight.position.copy(this.tipPosition);
    this.onNearWick?.(this.tipPosition);
  }

  /**
   * Spawns new sparks and updates physics.
   */
  public update(dt: number, elapsed: number): void {
    // Zero CPU/GPU overhead when sparkler is inactive and all sparks have settled
    if (!this.isSparkling && this.particles.length === 0) {
      return;
    }

    if (this.isSparkling) {
      // Light flicker
      this.tipLight.intensity = 1.4 + Math.sin(elapsed * 28.0) * 0.6 + (Math.random() - 0.5) * 0.4;

      // Sizzle SFX throttle every ~250ms
      if (elapsed - this.lastSizzleTime > 0.25) {
        AudioEngine.getInstance().playSparklerSizzle();
        this.lastSizzleTime = elapsed;
      }

      // Spawn new sparkling sparks from tip
      const spawnCount = 9;
      for (let i = 0; i < spawnCount; i++) {
        if (this.particles.length < this.maxParticles) {
          // Conical / spherical burst velocity with forward bias
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const speed = 1.6 + Math.random() * 2.8;

          const vel = new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta) * speed,
            (Math.cos(phi) * speed) + 0.9,
            Math.sin(phi) * Math.sin(theta) * speed
          );

          this.particles.push({
            position: this.tipPosition.clone().add(
              new THREE.Vector3(
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05
              )
            ),
            velocity: vel,
            life: 0,
            maxLife: 0.35 + Math.random() * 0.45,
            size: 0.08 + Math.random() * 0.08,
          });
        }
      }
    }

    // Update alive particles
    const positions = (this.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
    const colors = (this.geometry.getAttribute('color') as THREE.BufferAttribute).array as Float32Array;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // Gravity and velocity Euler integration
      p.velocity.y -= 4.2 * dt;
      p.velocity.x *= 0.96;
      p.velocity.z *= 0.96;

      p.position.addScaledVector(p.velocity, dt);

      // Bounce off floor if y < 0.02
      if (p.position.y < 0.02) {
        p.position.y = 0.02;
        p.velocity.y = -p.velocity.y * 0.4;
      }

      const progress = p.life / p.maxLife;
      // Particle color shifts white -> brilliant gold -> incandescent orange
      const col = progress < 0.25 ? SPARK_WHITE : progress < 0.7 ? SPARK_GOLD : SPARK_ORANGE;

      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;

      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    // Hide remaining buffer slots
    for (let i = this.particles.length; i < this.maxParticles; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -9999;
      positions[i * 3 + 2] = 0;
    }

    (this.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.tipMesh.geometry.dispose();
    (this.tipMesh.material as THREE.Material).dispose();
    this.group.clear();
    this.particles = [];
  }
}
