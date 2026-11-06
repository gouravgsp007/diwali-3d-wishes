import * as THREE from 'three';

interface ActivePetal {
  mesh: THREE.Mesh;
  rotSpeedX: number;
  rotSpeedY: number;
  rotSpeedZ: number;
  driftFreq: number;
  driftPhase: number;
  fallSpeed: number;
  isSettled: boolean;
}

export class RosePetalShower {
  public readonly group: THREE.Group;
  private petals: ActivePetal[] = [];
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'rose-petal-shower-group';
  }

  public triggerShower(count = 45): void {
    const petalGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.015, 6);
    this.disposables.push(petalGeo);

    const petalColors = [
      0xbe123c, // Rose Red
      0x9f1239, // Deep Crimson
      0xf43f5e, // Coral Pink
      0xfb7185, // Soft Blush
    ];

    for (let i = 0; i < count; i++) {
      const color = petalColors[Math.floor(Math.random() * petalColors.length)];
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        side: THREE.DoubleSide,
      });
      this.disposables.push(mat);

      const mesh = new THREE.Mesh(petalGeo, mat);
      const startX = (Math.random() - 0.5) * 2.6;
      const startY = 2.4 + Math.random() * 2.0;
      const startZ = (Math.random() - 0.5) * 2.2;
      mesh.position.set(startX, startY, startZ);
      mesh.scale.set(1.0, 0.4, 1.4);

      this.group.add(mesh);

      this.petals.push({
        mesh,
        rotSpeedX: (Math.random() - 0.5) * 3.5,
        rotSpeedY: (Math.random() - 0.5) * 2.5,
        rotSpeedZ: (Math.random() - 0.5) * 3.0,
        driftFreq: 1.5 + Math.random() * 2.0,
        driftPhase: Math.random() * Math.PI * 2,
        fallSpeed: 0.45 + Math.random() * 0.35,
        isSettled: false,
      });
    }
  }

  public update(dt: number, elapsed: number): void {
    for (let i = this.petals.length - 1; i >= 0; i--) {
      const p = this.petals[i];
      if (p.isSettled) continue;

      p.mesh.position.y -= p.fallSpeed * dt;
      p.mesh.position.x += Math.sin(elapsed * p.driftFreq + p.driftPhase) * 0.006;
      p.mesh.position.z += Math.cos(elapsed * p.driftFreq + p.driftPhase) * 0.004;

      p.mesh.rotation.x += p.rotSpeedX * dt;
      p.mesh.rotation.y += p.rotSpeedY * dt;
      p.mesh.rotation.z += p.rotSpeedZ * dt;

      // Settle gently on platter
      if (p.mesh.position.y <= 0.02) {
        p.mesh.position.y = 0.02;
        p.isSettled = true;
      }
    }
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.group.clear();
    this.petals = [];
  }
}
