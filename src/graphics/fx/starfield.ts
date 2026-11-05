import * as THREE from 'three';

/**
 * Atmospheric nocturnal starfield with twinkling celestial stars
 * and luminous shooting star (Ulka) streaks.
 */
export class Starfield {
  public readonly group: THREE.Group;
  private starsPoints: THREE.Points;
  private shootingStarLine: THREE.Line;
  private shootingStarActive = false;
  private shootingStarProgress = 0;
  private shootingStarStart = new THREE.Vector3();
  private shootingStarEnd = new THREE.Vector3();
  private shootingStarNextTime = 3.5;
  private shootingStarGeo: THREE.BufferGeometry;

  constructor(count = 250) {
    this.group = new THREE.Group();

    // 1. Static Twinkling Celestial Starfield
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const phases = new Float32Array(count);

    const goldColor = new THREE.Color(0xffd57e);
    const whiteColor = new THREE.Color(0xffffff);
    const amberColor = new THREE.Color(0xffaa44);

    for (let i = 0; i < count; i++) {
      // Distribute on an inverted upper dome
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0) * 0.45; // Upper dome hemisphere
      const radius = 18 + Math.random() * 12;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) + 2.0; // Elevated sky
      const z = radius * Math.sin(phi) * Math.sin(theta) - 4.0; // Pushed slightly back

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      phases[i] = Math.random() * Math.PI * 2;

      // Color variation: 60% warm gold, 30% diamond white, 10% amber
      const choice = Math.random();
      const c = choice < 0.6 ? goldColor : choice < 0.9 ? whiteColor : amberColor;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    const starMat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.starsPoints = new THREE.Points(starGeo, starMat);
    this.group.add(this.starsPoints);

    // 2. Dynamic Shooting Star Streak Line
    this.shootingStarGeo = new THREE.BufferGeometry();
    const linePos = new Float32Array(6); // 2 points (head, tail)
    this.shootingStarGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));

    const lineMat = new THREE.LineBasicMaterial({
      color: 0xfff0bb,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      linewidth: 2,
    });

    this.shootingStarLine = new THREE.Line(this.shootingStarGeo, lineMat);
    this.group.add(this.shootingStarLine);
  }

  /**
   * Updates star twinkle pulsation and shooting star trajectories.
   */
  public update(dt: number, elapsed: number): void {
    // 1. Subtle Twinkle Pulsation
    const mat = this.starsPoints.material as THREE.PointsMaterial;
    mat.opacity = 0.72 + Math.sin(elapsed * 2.5) * 0.18;

    // 2. Shooting Star System
    if (!this.shootingStarActive) {
      if (elapsed > this.shootingStarNextTime) {
        this.triggerShootingStar(elapsed);
      }
    } else {
      this.shootingStarProgress += dt * 1.8; // Speed of streak
      const p = this.shootingStarProgress;

      const posAttr = this.shootingStarGeo.getAttribute('position') as THREE.BufferAttribute;
      const head = new THREE.Vector3().lerpVectors(this.shootingStarStart, this.shootingStarEnd, Math.min(p, 1.0));
      const tail = new THREE.Vector3().lerpVectors(
        this.shootingStarStart,
        this.shootingStarEnd,
        Math.max(p - 0.22, 0.0)
      );

      posAttr.setXYZ(0, tail.x, tail.y, tail.z);
      posAttr.setXYZ(1, head.x, head.y, head.z);
      posAttr.needsUpdate = true;

      const lineMat = this.shootingStarLine.material as THREE.LineBasicMaterial;
      if (p < 0.2) {
        lineMat.opacity = p / 0.2;
      } else if (p > 0.8) {
        lineMat.opacity = Math.max((1.0 - p) / 0.2, 0.0);
      } else {
        lineMat.opacity = 0.95;
      }

      if (p >= 1.0) {
        this.shootingStarActive = false;
        lineMat.opacity = 0.0;
        this.shootingStarNextTime = elapsed + 5.0 + Math.random() * 6.0;
      }
    }
  }

  private triggerShootingStar(elapsed: number): void {
    this.shootingStarActive = true;
    this.shootingStarProgress = 0;

    // Pick a high trajectory across the sky dome
    const startX = (Math.random() - 0.5) * 16;
    const startY = 12 + Math.random() * 4;
    const startZ = -10 - Math.random() * 8;

    this.shootingStarStart.set(startX, startY, startZ);
    this.shootingStarEnd.set(startX + (Math.random() > 0.5 ? 8 : -8), startY - 3 - Math.random() * 2, startZ + 2);

    const lineMat = this.shootingStarLine.material as THREE.LineBasicMaterial;
    lineMat.opacity = 0.0;
    this.shootingStarNextTime = elapsed + 6.0;
  }

  public dispose(): void {
    this.starsPoints.geometry.dispose();
    (this.starsPoints.material as THREE.Material).dispose();
    this.shootingStarGeo.dispose();
    (this.shootingStarLine.material as THREE.Material).dispose();
    this.group.remove(this.starsPoints);
    this.group.remove(this.shootingStarLine);
  }
}
