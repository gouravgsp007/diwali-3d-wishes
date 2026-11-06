import * as THREE from 'three';

interface ActiveLantern {
  group: THREE.Group;
  light?: THREE.PointLight;
  speed: number;
  swayFreq: number;
  swayPhase: number;
  rotSpeed: number;
  altitude: number;
}

/**
 * Akash Kandil (Sky Lantern) Release Ceremony manager.
 * Launches authentic glowing 3D paper lanterns that drift up into the heavens.
 * Uses shared geometries & materials for zero-leak 60fps mobile WebGL rendering.
 */
export class SkyLanternsManager {
  public readonly group: THREE.Group;
  private lanterns: ActiveLantern[] = [];
  private maxLanterns = 16;
  private maxDynamicLights = 3;

  // Shared Flyweight Geometries (reused across all lanterns to prevent GPU leaks & allocations)
  private bodyGeo: THREE.CylinderGeometry;
  private bottomRingGeo: THREE.TorusGeometry;
  private topRingGeo: THREE.TorusGeometry;
  private tasselGeo: THREE.CylinderGeometry;

  // Shared Flyweight Materials
  private orangeBodyMat: THREE.MeshStandardMaterial;
  private redBodyMat: THREE.MeshStandardMaterial;
  private ringMat: THREE.MeshStandardMaterial;
  private tasselMat: THREE.MeshBasicMaterial;

  constructor() {
    this.group = new THREE.Group();

    // 1. Shared Geometries
    this.bodyGeo = new THREE.CylinderGeometry(0.09, 0.12, 0.22, 8, 1, true);
    this.bottomRingGeo = new THREE.TorusGeometry(0.12, 0.007, 8, 16);
    this.topRingGeo = new THREE.TorusGeometry(0.09, 0.007, 8, 16);
    this.tasselGeo = new THREE.CylinderGeometry(0.004, 0.006, 0.09, 4);

    // 2. Shared Materials with high emissive brilliance
    this.orangeBodyMat = new THREE.MeshStandardMaterial({
      color: 0xff7722,
      emissive: 0xffaa22,
      emissiveIntensity: 0.95,
      roughness: 0.4,
      side: THREE.DoubleSide,
    });
    this.redBodyMat = new THREE.MeshStandardMaterial({
      color: 0xee2244,
      emissive: 0xff4433,
      emissiveIntensity: 0.95,
      roughness: 0.4,
      side: THREE.DoubleSide,
    });
    this.ringMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.6,
      roughness: 0.3,
    });
    this.tasselMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
    });
  }

  /**
   * Releases one or more glowing 3D Diwali paper lanterns that float toward the stars.
   * Completely silent on tap per user requirement.
   *
   * @param count Number of mini lanterns to spawn in this cluster (default: 1)
   */
  public releaseLantern(count = 1): void {
    for (let i = 0; i < count; i++) {
      this.spawnSingleLantern(i, count);
    }
  }

  /**
   * Releases a cluster of 4-5 mini glowing lanterns ascending together into the celestial sky.
   */
  public releaseCluster(clusterCount = 5): void {
    this.releaseLantern(clusterCount);
  }

  private spawnSingleLantern(index: number, total: number): void {
    if (this.lanterns.length >= this.maxLanterns) {
      // Remove oldest lantern to maintain 60fps budget
      const oldest = this.lanterns.shift();
      if (oldest) {
        this.group.remove(oldest.group);
      }
    }

    // Limit dynamic point lights to avoid mobile forward shader over-saturation
    const currentLightsCount = this.lanterns.reduce((acc, l) => acc + (l.light ? 1 : 0), 0);
    const attachLight = currentLightsCount < this.maxDynamicLights;

    const lanternGroup = this.createLanternMesh(attachLight);

    // Staggered miniature scale (0.45 to 0.72)
    const scale = 0.45 + Math.random() * 0.28;
    lanternGroup.scale.set(scale, scale, scale);

    // Start position: spread in open celestial sky above wish card
    // Staggered horizontally and in elevation so mini-lanterns form a natural floating flock
    const clusterSpread = total > 1 ? 2.6 : 1.8;
    const startX = (Math.random() - 0.5) * clusterSpread;
    const startY = 0.50 + Math.random() * 0.30 + (index * 0.09);
    const startZ = -0.2 + (Math.random() - 0.5) * 0.9;

    lanternGroup.position.set(startX, startY, startZ);

    const light = lanternGroup.getObjectByName('lanternLight') as THREE.PointLight | undefined;

    const lantern: ActiveLantern = {
      group: lanternGroup,
      light,
      speed: 0.32 + Math.random() * 0.24,
      swayFreq: 1.1 + Math.random() * 0.9,
      swayPhase: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.35,
      altitude: startY,
    };

    this.lanterns.push(lantern);
    this.group.add(lanternGroup);
  }

  /**
   * Constructs an authentic, delicate polygonal Indian festive lantern with warm inner flame.
   * Uses shared geometries and materials for optimal performance.
   */
  private createLanternMesh(attachLight: boolean): THREE.Group {
    const lantern = new THREE.Group();

    // 1. Delicate Tapered Paper Lantern Body
    const bodyMat = Math.random() > 0.4 ? this.orangeBodyMat : this.redBodyMat;
    const body = new THREE.Mesh(this.bodyGeo, bodyMat);
    lantern.add(body);

    // 2. Golden Bamboo Base & Top Rings
    const bottomRing = new THREE.Mesh(this.bottomRingGeo, this.ringMat);
    bottomRing.rotation.x = Math.PI / 2;
    bottomRing.position.y = -0.11;
    lantern.add(bottomRing);

    const topRing = new THREE.Mesh(this.topRingGeo, this.ringMat);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.y = 0.11;
    lantern.add(topRing);

    // 3. Floating Base Tassels (Akash Kandil frills)
    const tasselCount = 4;
    for (let i = 0; i < tasselCount; i++) {
      const angle = (i / tasselCount) * Math.PI * 2;
      const tassel = new THREE.Mesh(this.tasselGeo, this.tasselMat);
      tassel.position.set(Math.cos(angle) * 0.10, -0.155, Math.sin(angle) * 0.10);
      lantern.add(tassel);
    }

    // 4. Warm Luminescent Inner PointLight (attached only to closest lanterns)
    if (attachLight) {
      const light = new THREE.PointLight(0xffaa33, 0.8, 2.2);
      light.name = 'lanternLight';
      lantern.add(light);
    }

    return lantern;
  }

  /**
   * Updates flight physics and swaying motions.
   */
  public update(dt: number, elapsed: number): void {
    for (let i = this.lanterns.length - 1; i >= 0; i--) {
      const l = this.lanterns[i];
      l.altitude += l.speed * dt;
      l.group.position.y = l.altitude;

      // Gentle wind sinusoidal sway
      l.group.position.x += Math.sin(elapsed * l.swayFreq + l.swayPhase) * 0.008;
      l.group.position.z += Math.cos(elapsed * l.swayFreq + l.swayPhase) * 0.005;

      // Slow festive rotation
      l.group.rotation.y += l.rotSpeed * dt;

      // Soft light breathing flicker if point light is present
      if (l.light) {
        l.light.intensity = 1.0 + Math.sin(elapsed * 8.0 + l.swayPhase) * 0.35;
      }

      // Recycle if vanished high into the stratosphere
      if (l.altitude > 24.0) {
        this.group.remove(l.group);
        this.lanterns.splice(i, 1);
      }
    }
  }

  public getLanternsCount(): number {
    return this.lanterns.length;
  }

  public dispose(): void {
    this.lanterns.forEach((l) => this.group.remove(l.group));
    this.lanterns = [];
    this.group.clear();

    // Release shared flyweight GPU buffers
    this.bodyGeo.dispose();
    this.bottomRingGeo.dispose();
    this.topRingGeo.dispose();
    this.tasselGeo.dispose();
    this.orangeBodyMat.dispose();
    this.redBodyMat.dispose();
    this.ringMat.dispose();
    this.tasselMat.dispose();
  }
}
