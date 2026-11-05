import * as THREE from 'three';
import { AudioEngine } from '../../audio/audio-engine';

interface ActiveLantern {
  group: THREE.Group;
  light: THREE.PointLight;
  speed: number;
  swayFreq: number;
  swayPhase: number;
  rotSpeed: number;
  altitude: number;
}

/**
 * Akash Kandil (Sky Lantern) Release Ceremony manager.
 * Launches authentic glowing 3D paper lanterns that drift up into the heavens.
 */
export class SkyLanternsManager {
  public readonly group: THREE.Group;
  private lanterns: ActiveLantern[] = [];
  private maxLanterns = 15;

  constructor() {
    this.group = new THREE.Group();
  }

  /**
   * Releases a glowing 3D Diwali paper lantern that floats toward the stars.
   */
  public releaseLantern(): void {
    if (this.lanterns.length >= this.maxLanterns) {
      // Remove oldest lantern
      const oldest = this.lanterns.shift();
      if (oldest) {
        this.group.remove(oldest.group);
      }
    }

    const lanternGroup = this.createLanternMesh();

    // Start position: lower foreground/mid-ground
    const startX = (Math.random() - 0.5) * 2.8;
    const startY = 0.4 + Math.random() * 0.3;
    const startZ = 0.8 + Math.random() * 1.2;

    lanternGroup.position.set(startX, startY, startZ);

    const light = lanternGroup.getObjectByName('lanternLight') as THREE.PointLight;

    const lantern: ActiveLantern = {
      group: lanternGroup,
      light,
      speed: 0.55 + Math.random() * 0.35,
      swayFreq: 1.2 + Math.random() * 0.8,
      swayPhase: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.4,
      altitude: startY,
    };

    this.lanterns.push(lantern);
    this.group.add(lanternGroup);

    // Audio chime on release
    AudioEngine.getInstance().playTempleBell();
  }

  /**
   * Constructs an authentic polygonal Indian festive lantern with warm inner flame.
   */
  private createLanternMesh(): THREE.Group {
    const lantern = new THREE.Group();

    // 1. Tapered Paper Lantern Body (Cylinder with 8 segments)
    const bodyGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.45, 8, 1, true);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.4 ? 0xff7722 : 0xee2244,
      emissive: 0xffaa22,
      emissiveIntensity: 0.75,
      roughness: 0.4,
      side: THREE.DoubleSide,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    lantern.add(body);

    // 2. Golden Bamboo Base & Top Rings
    const ringGeo = new THREE.TorusGeometry(0.24, 0.015, 8, 16);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.6, roughness: 0.3 });
    const bottomRing = new THREE.Mesh(ringGeo, ringMat);
    bottomRing.rotation.x = Math.PI / 2;
    bottomRing.position.y = -0.22;
    lantern.add(bottomRing);

    const topRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.015, 8, 16), ringMat);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.y = 0.22;
    lantern.add(topRing);

    // 3. Floating Base Tassels (Akash Kandil frills)
    const tasselCount = 4;
    for (let i = 0; i < tasselCount; i++) {
      const angle = (i / tasselCount) * Math.PI * 2;
      const tasselGeo = new THREE.CylinderGeometry(0.008, 0.012, 0.18, 4);
      const tasselMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
      const tassel = new THREE.Mesh(tasselGeo, tasselMat);
      tassel.position.set(Math.cos(angle) * 0.20, -0.31, Math.sin(angle) * 0.20);
      lantern.add(tassel);
    }

    // 4. Warm Luminescent Inner PointLight
    const light = new THREE.PointLight(0xffaa33, 1.2, 3.2);
    light.name = 'lanternLight';
    lantern.add(light);

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

      // Soft light breathing flicker
      l.light.intensity = 1.0 + Math.sin(elapsed * 8.0 + l.swayPhase) * 0.35;

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
  }
}
