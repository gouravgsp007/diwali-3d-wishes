import * as THREE from 'three';

interface ActiveBalloon {
  group: THREE.Group;
  baseX: number;
  baseY: number;
  baseZ: number;
  phase: number;
  speed: number;
  isAscending: boolean;
}

export class BalloonSystem {
  public readonly group: THREE.Group;
  private balloons: ActiveBalloon[] = [];
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'birthday-balloons-group';
    this.initBalloons();
  }

  private initBalloons(): void {
    const balloonPalette = [
      0xf43f5e, // Rose
      0xec4899, // Pink
      0x8b5cf6, // Purple
      0x06b6d4, // Cyan
      0xfbbf24, // Gold
      0x10b981, // Emerald
      0xf97316, // Orange
    ];

    const balloonGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const knotGeo = new THREE.ConeGeometry(0.04, 0.05, 8);
    this.disposables.push(balloonGeo, knotGeo);

    const balloonConfigs = [
      { x: -1.8, y: 1.8, z: -1.2, color: balloonPalette[0] },
      { x: -1.3, y: 2.3, z: -1.5, color: balloonPalette[1] },
      { x: 1.5, y: 2.0, z: -1.1, color: balloonPalette[2] },
      { x: 1.9, y: 2.4, z: -1.4, color: balloonPalette[3] },
      { x: -2.2, y: 2.6, z: -2.0, color: balloonPalette[4] },
      { x: 2.2, y: 2.7, z: -2.2, color: balloonPalette[5] },
      { x: 0.8, y: 3.1, z: -2.5, color: balloonPalette[6] },
      { x: -0.9, y: 3.0, z: -2.4, color: balloonPalette[0] },
    ];

    balloonConfigs.forEach((cfg, idx) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(cfg.x, cfg.y, cfg.z);

      // 1. Balloon Body
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.25,
        metalness: 0.35,
        emissive: cfg.color,
        emissiveIntensity: 0.2,
      });
      this.disposables.push(mat);

      const bMesh = new THREE.Mesh(balloonGeo, mat);
      bMesh.scale.set(1.0, 1.25, 1.0);
      bGroup.add(bMesh);

      // 2. Knot at base
      const kMesh = new THREE.Mesh(knotGeo, mat);
      kMesh.position.y = -0.31;
      kMesh.rotation.x = Math.PI;
      bGroup.add(kMesh);

      // 3. String trailing down
      const stringPoints = [
        new THREE.Vector3(0, -0.33, 0),
        new THREE.Vector3(0.03, -0.55, 0),
        new THREE.Vector3(-0.02, -0.85, 0),
        new THREE.Vector3(0.01, -1.15, 0),
      ];
      const stringGeo = new THREE.BufferGeometry().setFromPoints(stringPoints);
      const stringMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
      this.disposables.push(stringGeo, stringMat);
      const stringLine = new THREE.Line(stringGeo, stringMat);
      bGroup.add(stringLine);

      this.group.add(bGroup);

      this.balloons.push({
        group: bGroup,
        baseX: cfg.x,
        baseY: cfg.y,
        baseZ: cfg.z,
        phase: idx * 1.3,
        speed: 0.4 + Math.random() * 0.3,
        isAscending: false,
      });
    });
  }

  public releaseBalloons(): void {
    this.balloons.forEach((b) => {
      b.isAscending = true;
    });
  }

  public update(dt: number, elapsed: number): void {
    this.balloons.forEach((b) => {
      if (b.isAscending) {
        b.group.position.y += b.speed * dt;
        b.group.position.x += Math.sin(elapsed * 2.0 + b.phase) * 0.005;
      } else {
        // Idle gentle floating sway
        b.group.position.y = b.baseY + Math.sin(elapsed * 1.5 + b.phase) * 0.08;
        b.group.position.x = b.baseX + Math.cos(elapsed * 1.1 + b.phase) * 0.04;
        b.group.rotation.z = Math.sin(elapsed * 0.8 + b.phase) * 0.05;
      }
    });
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.group.clear();
    this.balloons = [];
  }
}
