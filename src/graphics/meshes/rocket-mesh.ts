import * as THREE from 'three';

export interface RocketConfig {
  id: number;
  name: string;
  hindi: string;
  position: THREE.Vector3;
  tilt: THREE.Vector3;
  bodyColor: number;
  bandColor: number;
  coneColor: number;
  trailColorHex: string;
}

const ROCKET_CONFIGS: RocketConfig[] = [
  {
    id: 1,
    name: 'Swarna Baan',
    hindi: 'स्वर्ण बाण',
    position: new THREE.Vector3(-1.25, -0.05, 0.85),
    tilt: new THREE.Vector3(0, 0, 0.08),
    bodyColor: 0xd97706, // Saffron amber
    bandColor: 0xfef08a, // Light gold
    coneColor: 0xf59e0b, // Amber gold
    trailColorHex: '#FBBF24',
  },
  {
    id: 2,
    name: 'Taramandal',
    hindi: 'तारामंडल',
    position: new THREE.Vector3(0.0, -0.05, 1.35),
    tilt: new THREE.Vector3(0.08, 0, 0),
    bodyColor: 0x059669, // Emerald green
    bandColor: 0xdc2626, // Ruby red
    coneColor: 0x10b981, // Bright emerald
    trailColorHex: '#34D399',
  },
  {
    id: 3,
    name: 'Dhamaaka',
    hindi: 'धमाका',
    position: new THREE.Vector3(1.25, -0.05, 0.85),
    tilt: new THREE.Vector3(0, 0, -0.08),
    bodyColor: 0x2563eb, // Royal sapphire
    bandColor: 0x9333ea, // Purple
    coneColor: 0x38bdf8, // Electric blue
    trailColorHex: '#818CF8',
  },
];

interface RocketItem {
  config: RocketConfig;
  standGroup: THREE.Group;
  rocketMeshGroup: THREE.Group;
  hitProxy: THREE.Mesh;
  wickEmber: THREE.Mesh;
  floorGlow: THREE.Mesh;
  isLaunched: boolean;
  isDetonated: boolean;
  isAscending: boolean;
  flightTime: number;
  maxFlightTime: number;
  velocity: THREE.Vector3;
  currentPos: THREE.Vector3;
  onDetonate?: (pos: THREE.Vector3, typeId: number) => void;
}

/**
 * Procedural 3D In-Scene Rocket Launchpad.
 *
 * Places 3 authentic festive Diwali rockets standing in brass holders around
 * the glowing Diya. Supports raycast tap detection, realistic flight ascent,
 * trailing spark emission, and high-altitude detonation callbacks.
 */
export class RocketStandManager {
  public readonly group = new THREE.Group();

  private rockets: RocketItem[] = [];
  private interactiveMeshes: THREE.Object3D[] = [];
  private onTrailEmit?: (pos: THREE.Vector3, colorHex: string) => void;
  private onAllCompleted?: () => void;
  private allCompletedTriggered = false;

  private disposedGeometries: THREE.BufferGeometry[] = [];
  private disposedMaterials: THREE.Material[] = [];

  constructor() {
    this.buildRockets();
  }

  private buildRockets(): void {
    // Shared Materials
    const brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.35,
      metalness: 0.85,
    });
    this.disposedMaterials.push(brassMaterial);

    const stickMaterial = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.8,
      metalness: 0.1,
    });
    this.disposedMaterials.push(stickMaterial);

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    this.disposedMaterials.push(glowMaterial);

    ROCKET_CONFIGS.forEach((config) => {
      const standGroup = new THREE.Group();
      standGroup.position.copy(config.position);

      // 1. Brass Stand Base on Floor
      const baseGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.14, 16);
      this.disposedGeometries.push(baseGeo);
      const standBase = new THREE.Mesh(baseGeo, brassMaterial);
      standBase.position.y = 0.07;
      standGroup.add(standBase);

      // 2. Floor Pulsing Glow Ring (Clone per stand to avoid shared mutation)
      const ringGeo = new THREE.RingGeometry(0.16, 0.32, 24);
      this.disposedGeometries.push(ringGeo);
      const standGlowMat = glowMaterial.clone();
      this.disposedMaterials.push(standGlowMat);
      const floorGlow = new THREE.Mesh(ringGeo, standGlowMat);
      floorGlow.rotation.x = -Math.PI / 2;
      floorGlow.position.y = 0.005;
      standGroup.add(floorGlow);

      // 3. Rocket Body Group (Can lift off separately)
      const rocketMeshGroup = new THREE.Group();
      rocketMeshGroup.position.y = 0.1;
      rocketMeshGroup.rotation.x = config.tilt.x;
      rocketMeshGroup.rotation.z = config.tilt.z;

      // Wooden Stick
      const stickGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.55, 8);
      this.disposedGeometries.push(stickGeo);
      const stick = new THREE.Mesh(stickGeo, stickMaterial);
      stick.position.y = 0.22;
      rocketMeshGroup.add(stick);

      // Decorated Cylindrical Fuselage
      const bodyMat = new THREE.MeshStandardMaterial({
        color: config.bodyColor,
        roughness: 0.4,
        metalness: 0.5,
      });
      this.disposedMaterials.push(bodyMat);

      const bodyGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.32, 16);
      this.disposedGeometries.push(bodyGeo);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.38;
      rocketMeshGroup.add(body);

      // Festive Gold/Ruby Foil Ring Trim
      const bandMat = new THREE.MeshStandardMaterial({
        color: config.bandColor,
        roughness: 0.2,
        metalness: 0.9,
      });
      this.disposedMaterials.push(bandMat);

      const bandGeo = new THREE.CylinderGeometry(0.047, 0.047, 0.06, 16);
      this.disposedGeometries.push(bandGeo);
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.y = 0.38;
      rocketMeshGroup.add(band);

      // Conical Warhead Tip
      const coneMat = new THREE.MeshStandardMaterial({
        color: config.coneColor,
        roughness: 0.25,
        metalness: 0.8,
      });
      this.disposedMaterials.push(coneMat);

      const coneGeo = new THREE.ConeGeometry(0.056, 0.15, 16);
      this.disposedGeometries.push(coneGeo);
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.y = 0.61;
      rocketMeshGroup.add(cone);

      // Glowing Wick Ember
      const emberMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
      });
      this.disposedMaterials.push(emberMat);

      const emberGeo = new THREE.SphereGeometry(0.015, 8, 8);
      this.disposedGeometries.push(emberGeo);
      const wickEmber = new THREE.Mesh(emberGeo, emberMat);
      wickEmber.position.y = 0.7;
      rocketMeshGroup.add(wickEmber);

      standGroup.add(rocketMeshGroup);

      // 4. Invisible Large Hit Proxy for Comfortable Mobile Tap / Raycasting
      const proxyGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.1, 8);
      this.disposedGeometries.push(proxyGeo);
      const proxyMat = new THREE.MeshBasicMaterial({
        visible: false,
      });
      this.disposedMaterials.push(proxyMat);

      const hitProxy = new THREE.Mesh(proxyGeo, proxyMat);
      hitProxy.position.y = 0.55;
      hitProxy.userData = {
        rocketId: config.id,
        rocketName: config.name,
      };
      standGroup.add(hitProxy);
      this.interactiveMeshes.push(hitProxy);

      this.group.add(standGroup);

      this.rockets.push({
        config,
        standGroup,
        rocketMeshGroup,
        hitProxy,
        wickEmber,
        floorGlow,
        isLaunched: false,
        isDetonated: false,
        isAscending: false,
        flightTime: 0,
        maxFlightTime: 1.05 + Math.random() * 0.15,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5 + config.tilt.z * 4.0,
          9.8,
          (Math.random() - 0.5) * 0.5 - config.tilt.x * 4.0
        ),
        currentPos: new THREE.Vector3().copy(config.position).add(new THREE.Vector3(0, 0.1, 0)),
      });
    });
  }

  public getInteractiveMeshes(): THREE.Object3D[] {
    return this.interactiveMeshes;
  }

  public isLaunched(id: number): boolean {
    const item = this.rockets.find((r) => r.config.id === id);
    return item ? item.isLaunched : false;
  }

  public getLaunchedCount(): number {
    return this.rockets.filter((r) => r.isLaunched).length;
  }

  public setOnTrailEmit(cb: (pos: THREE.Vector3, colorHex: string) => void): void {
    this.onTrailEmit = cb;
  }

  public setOnAllCompleted(cb: () => void): void {
    this.onAllCompleted = cb;
  }

  /**
   * Initiates rocket launch sequence.
   */
  public launch(id: number, onDetonate?: (pos: THREE.Vector3, typeId: number) => void): boolean {
    const item = this.rockets.find((r) => r.config.id === id);
    if (!item || item.isLaunched) return false;

    item.isLaunched = true;
    item.isAscending = true;
    item.onDetonate = onDetonate;

    // Dim floor glow ring
    if (item.floorGlow.material instanceof THREE.MeshBasicMaterial) {
      item.floorGlow.material.opacity = 0.05;
    }

    return true;
  }

  /**
   * Updates flight kinematics, wick flickers, and detonation checks.
   */
  public update(deltaTime: number): void {
    const maxSubStep = 0.05;
    let remaining = Math.min(deltaTime, 5.0);

    while (remaining > 0) {
      const dt = Math.min(remaining, maxSubStep);
      this.step(dt);
      remaining -= dt;
    }
  }

  private step(dt: number): void {
    this.rockets.forEach((item) => {
      // 1. Wick Ember Flicker for unlaunched rockets
      if (!item.isLaunched) {
        const flicker = 0.8 + Math.sin(Date.now() * 0.015 + item.config.id) * 0.4;
        item.wickEmber.scale.setScalar(flicker);
        return;
      }

      // 2. Ascending Rocket Physics
      if (item.isAscending && !item.isDetonated) {
        item.flightTime += dt;

        // Position update
        item.currentPos.addScaledVector(item.velocity, dt);
        item.rocketMeshGroup.position.copy(item.currentPos);

        // Emit fizzy trail sparks
        this.onTrailEmit?.(item.currentPos, item.config.trailColorHex);

        // Check for peak altitude or flight time
        if (item.flightTime >= item.maxFlightTime || item.currentPos.y >= 10.5) {
          item.isAscending = false;
          item.isDetonated = true;
          item.rocketMeshGroup.visible = false;

          item.onDetonate?.(item.currentPos, item.config.id);
          this.checkAllCompleted();
        }
      }
    });
  }

  private checkAllCompleted(): void {
    if (this.allCompletedTriggered) return;
    const allDetonated = this.rockets.every((r) => r.isDetonated);
    if (allDetonated) {
      this.allCompletedTriggered = true;
      this.onAllCompleted?.();
    }
  }

  public dispose(): void {
    this.interactiveMeshes.length = 0;
    this.rockets.length = 0;

    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
    }

    this.disposedGeometries.forEach((g) => g.dispose());
    this.disposedMaterials.forEach((m) => m.dispose());
    this.disposedGeometries.length = 0;
    this.disposedMaterials.length = 0;
  }
}
