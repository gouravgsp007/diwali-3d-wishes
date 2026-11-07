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
  initVelocity: THREE.Vector3;
  acceleration: number;
  lateralCurve: THREE.Vector3;
}

export type RocketFlightState = 'IDLE' | 'FUSE_IGNITING' | 'ASCENDING' | 'DETONATED';

const ROCKET_CONFIGS: RocketConfig[] = [
  {
    id: 1,
    name: 'Swarna Baan',
    hindi: 'स्वर्ण बाण',
    position: new THREE.Vector3(-1.35, -0.05, 0.35),
    tilt: new THREE.Vector3(0, 0, 0.10),
    bodyColor: 0xd97706, // Saffron amber
    bandColor: 0xfef08a, // Light gold
    coneColor: 0xf59e0b, // Amber gold
    trailColorHex: '#FBBF24',
    initVelocity: new THREE.Vector3(-0.9, 4.2, 0.0),
    acceleration: 11.5,
    lateralCurve: new THREE.Vector3(-1.1, 0.0, 0.0),
  },
  {
    id: 2,
    name: 'Taramandal',
    hindi: 'तारामंडल',
    position: new THREE.Vector3(0.0, -0.05, -0.85),
    tilt: new THREE.Vector3(-0.06, 0, 0),
    bodyColor: 0x059669, // Emerald green
    bandColor: 0xdc2626, // Ruby red
    coneColor: 0x10b981, // Bright emerald
    trailColorHex: '#34D399',
    initVelocity: new THREE.Vector3(0.1, 4.4, -0.7),
    acceleration: 12.0,
    lateralCurve: new THREE.Vector3(0.1, 0.0, -0.8),
  },
  {
    id: 3,
    name: 'Dhamaaka',
    hindi: 'धमाका',
    position: new THREE.Vector3(1.35, -0.05, 0.35),
    tilt: new THREE.Vector3(0, 0, -0.10),
    bodyColor: 0x2563eb, // Royal sapphire
    bandColor: 0x9333ea, // Purple
    coneColor: 0x38bdf8, // Electric blue
    trailColorHex: '#818CF8',
    initVelocity: new THREE.Vector3(0.9, 4.2, 0.0),
    acceleration: 11.5,
    lateralCurve: new THREE.Vector3(1.1, 0.0, 0.0),
  },
];

interface RocketItem {
  config: RocketConfig;
  standGroup: THREE.Group;
  rocketMeshGroup: THREE.Group;
  hitProxy: THREE.Mesh;
  wickEmber: THREE.Mesh;
  floorGlow: THREE.Mesh;
  state: RocketFlightState;
  fuseTime: number;
  maxFuseTime: number;
  flightTime: number;
  maxFlightTime: number;
  localPos: THREE.Vector3;
  velocity: THREE.Vector3;
  onDetonate?: (pos: THREE.Vector3, typeId: number) => void;
}

/**
 * Procedural 3D In-Scene Rocket Launchpad.
 *
 * Places 3 authentic festive Diwali rockets standing in decorative holders around
 * the glowing Diya. Supports raycast tap detection, realistic fuse sizzle sparks,
 * natural accelerating flight curves with velocity-tangent tilting, and high-altitude
 * fireworks detonation.
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

      // 1. Brass / Glass Bottle Stand Base on Floor
      const baseGeo = new THREE.CylinderGeometry(0.10, 0.15, 0.18, 16);
      this.disposedGeometries.push(baseGeo);
      const standBase = new THREE.Mesh(baseGeo, brassMaterial);
      standBase.position.y = 0.09;
      standGroup.add(standBase);

      // 2. Floor Pulsing Glow Ring
      const ringGeo = new THREE.RingGeometry(0.14, 0.28, 24);
      this.disposedGeometries.push(ringGeo);
      const standGlowMat = glowMaterial.clone();
      this.disposedMaterials.push(standGlowMat);
      const floorGlow = new THREE.Mesh(ringGeo, standGlowMat);
      floorGlow.rotation.x = -Math.PI / 2;
      floorGlow.position.y = 0.005;
      standGroup.add(floorGlow);

      // 3. Rocket Body Group (Can lift off separately)
      const rocketMeshGroup = new THREE.Group();
      rocketMeshGroup.position.set(0, 0.12, 0);
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

      // Glowing Wick Ember at Tip
      const emberMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
      });
      this.disposedMaterials.push(emberMat);

      const emberGeo = new THREE.SphereGeometry(0.018, 8, 8);
      this.disposedGeometries.push(emberGeo);
      const wickEmber = new THREE.Mesh(emberGeo, emberMat);
      wickEmber.position.y = 0.70;
      rocketMeshGroup.add(wickEmber);

      standGroup.add(rocketMeshGroup);

      // 4. Invisible Large Hit Proxy for Comfortable Mobile Touch Raycasting
      const proxyGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.4, 8);
      this.disposedGeometries.push(proxyGeo);
      const proxyMat = new THREE.MeshBasicMaterial({
        visible: false,
      });
      this.disposedMaterials.push(proxyMat);

      const hitProxy = new THREE.Mesh(proxyGeo, proxyMat);
      hitProxy.position.y = 0.65;
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
        state: 'IDLE',
        fuseTime: 0,
        maxFuseTime: 0.35,
        flightTime: 0,
        maxFlightTime: 1.05 + Math.random() * 0.12,
        localPos: new THREE.Vector3(0, 0.12, 0),
        velocity: config.initVelocity.clone(),
      });
    });
  }

  public getInteractiveMeshes(): THREE.Object3D[] {
    return this.interactiveMeshes;
  }

  public isLaunched(id: number): boolean {
    const item = this.rockets.find((r) => r.config.id === id);
    return item ? item.state !== 'IDLE' : false;
  }

  public getLaunchedCount(): number {
    return this.rockets.filter((r) => r.state !== 'IDLE').length;
  }

  public setOnTrailEmit(cb: (pos: THREE.Vector3, colorHex: string) => void): void {
    this.onTrailEmit = cb;
  }

  public setOnAllCompleted(cb: () => void): void {
    this.onAllCompleted = cb;
  }

  /**
   * Initiates rocket launch sequence: fuse ignition (350ms) -> flight -> detonation.
   */
  public launch(id: number, onDetonate?: (pos: THREE.Vector3, typeId: number) => void): boolean {
    const item = this.rockets.find((r) => r.config.id === id);
    if (!item || item.state !== 'IDLE') return false;

    item.state = 'FUSE_IGNITING';
    item.fuseTime = 0;
    item.onDetonate = onDetonate;

    // Dim floor glow ring
    if (item.floorGlow.material instanceof THREE.MeshBasicMaterial) {
      item.floorGlow.material.opacity = 0.05;
    }

    return true;
  }

  /**
   * Updates flight kinematics, fuse sizzle, and detonation checks.
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
    const tempWorldPos = new THREE.Vector3();

    this.rockets.forEach((item) => {
      // 1. IDLE: Gentle wick ember flicker
      if (item.state === 'IDLE') {
        const flicker = 0.8 + Math.sin(Date.now() * 0.015 + item.config.id) * 0.35;
        item.wickEmber.scale.setScalar(flicker);
        return;
      }

      // 2. FUSE_IGNITING: Rapid fuse sparks & combustion quiver (350ms)
      if (item.state === 'FUSE_IGNITING') {
        item.fuseTime += dt;
        item.wickEmber.scale.setScalar(1.5 + Math.random() * 0.9);

        // Subtle rocket combustion jitter
        item.rocketMeshGroup.position.x = (Math.random() - 0.5) * 0.015;

        // Emit fuse crackle sparks at wick tip
        item.wickEmber.getWorldPosition(tempWorldPos);
        this.onTrailEmit?.(tempWorldPos, '#FFF4CC');

        if (item.fuseTime >= item.maxFuseTime) {
          item.state = 'ASCENDING';
          item.flightTime = 0;
          item.localPos.set(0, 0.12, 0);
          item.rocketMeshGroup.position.copy(item.localPos);
        }
        return;
      }

      // 3. ASCENDING: Accelerating curved rocket flight into the night sky
      if (item.state === 'ASCENDING') {
        item.flightTime += dt;

        // Kinematic acceleration: v(t) = v0 + a * t
        item.velocity.y += item.config.acceleration * dt;
        item.velocity.x += item.config.lateralCurve.x * dt;
        item.velocity.z += item.config.lateralCurve.z * dt;

        // Position update in stand local space
        item.localPos.addScaledVector(item.velocity, dt);
        item.rocketMeshGroup.position.copy(item.localPos);

        // Tilt rocket mesh along flight velocity tangent
        const vx = item.velocity.x;
        const vy = item.velocity.y;
        const vz = item.velocity.z;
        item.rocketMeshGroup.rotation.z = -Math.atan2(vx, vy);
        item.rocketMeshGroup.rotation.x = Math.atan2(vz, vy);

        // Emit sparkling golden exhaust plume at rocket nozzle base
        item.rocketMeshGroup.getWorldPosition(tempWorldPos);
        tempWorldPos.y -= 0.12; // At nozzle base
        this.onTrailEmit?.(tempWorldPos, item.config.trailColorHex);

        // Detonation condition at peak apogee
        if (item.flightTime >= item.maxFlightTime || item.localPos.y >= 9.2) {
          item.state = 'DETONATED';
          item.rocketMeshGroup.visible = false;

          item.rocketMeshGroup.getWorldPosition(tempWorldPos);
          item.onDetonate?.(tempWorldPos, item.config.id);
          this.checkAllCompleted();
        }
      }
    });
  }

  private checkAllCompleted(): void {
    if (this.allCompletedTriggered) return;
    const allDetonated = this.rockets.every((r) => r.state === 'DETONATED');
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
