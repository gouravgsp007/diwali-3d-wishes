import * as THREE from 'three';

interface FoamBubble {
  velX: number;
  velY: number;
  velZ: number;
  lifetime: number;
  maxLife: number;
}

export class ChampagneFoamSystem {
  public readonly group: THREE.Group;
  private particleCount = 120;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private particles: THREE.Points;
  private bubbles: FoamBubble[] = [];
  private isActive = false;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'champagne-foam-group';

    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.material = new THREE.PointsMaterial({
      color: 0xfef08a, // Sparkling golden champagne fizz
      size: 0.05,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.group.add(this.particles);

    for (let i = 0; i < this.particleCount; i++) {
      this.bubbles.push({
        velX: 0,
        velY: 0,
        velZ: 0,
        lifetime: 0,
        maxLife: 1.0,
      });
    }
  }

  public triggerFoamBurst(): void {
    this.isActive = true;
    this.material.opacity = 0.9;

    const pos = this.geometry.attributes.position as THREE.BufferAttribute;
    const origin = new THREE.Vector3(0.08, 1.45, 0.1);

    for (let i = 0; i < this.particleCount; i++) {
      pos.setXYZ(i, origin.x, origin.y, origin.z);

      const spread = 0.45;
      this.bubbles[i] = {
        velX: (Math.random() - 0.5) * spread + 0.15,
        velY: 2.2 + Math.random() * 1.8,
        velZ: (Math.random() - 0.5) * spread,
        lifetime: 0,
        maxLife: 1.2 + Math.random() * 0.8,
      };
    }
    pos.needsUpdate = true;
  }

  public update(dt: number): void {
    if (!this.isActive) return;

    const pos = this.geometry.attributes.position as THREE.BufferAttribute;
    let anyAlive = false;

    for (let i = 0; i < this.particleCount; i++) {
      const b = this.bubbles[i];
      b.lifetime += dt;

      if (b.lifetime < b.maxLife) {
        anyAlive = true;
        b.velY -= 3.8 * dt; // Gravity
        b.velX *= 0.98;
        b.velZ *= 0.98;

        const curX = pos.getX(i) + b.velX * dt;
        const curY = pos.getY(i) + b.velY * dt;
        const curZ = pos.getZ(i) + b.velZ * dt;

        pos.setXYZ(i, curX, curY, curZ);
      }
    }
    pos.needsUpdate = true;

    if (!anyAlive) {
      this.isActive = false;
      this.material.opacity = 0;
    }
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.group.clear();
  }
}
