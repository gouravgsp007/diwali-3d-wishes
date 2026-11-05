import * as THREE from 'three';
import { AudioEngine } from '../../audio/audio-engine';

interface Petal {
  mesh: THREE.Mesh;
  velY: number;
  rotVel: THREE.Vector3;
  flutterFreq: number;
  flutterPhase: number;
  restY: number;
  isResting: boolean;
  restTimer: number;
}

/**
 * Royal Flower Petal Shower (Pushpa Vrishti) Particle System.
 * Cascades vibrant Marigold and Rose petals that flutter down and settle on the Brass Thali.
 */
export class FlowerShower {
  public readonly group: THREE.Group;
  private petals: Petal[] = [];
  private maxPetals = 160;

  // Shared Geometries & Materials for high performance (0 lag, 60fps)
  private petalGeo: THREE.PlaneGeometry;
  private marigoldYellowMat: THREE.MeshStandardMaterial;
  private marigoldOrangeMat: THREE.MeshStandardMaterial;
  private roseCrimsonMat: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();

    // Curved petal-like plane (slight rounded aspect ratio)
    this.petalGeo = new THREE.PlaneGeometry(0.08, 0.12, 2, 2);

    this.marigoldYellowMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });
    this.marigoldOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });
    this.roseCrimsonMat = new THREE.MeshStandardMaterial({
      color: 0xcc1133,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Triggers a royal cascade of fresh festive petals.
   */
  public triggerFlowerShower(count = 75): void {
    AudioEngine.getInstance().playTempleBell();

    const materials = [this.marigoldYellowMat, this.marigoldOrangeMat, this.roseCrimsonMat];

    for (let i = 0; i < count; i++) {
      if (this.petals.length >= this.maxPetals) {
        const oldest = this.petals.shift();
        if (oldest) {
          this.group.remove(oldest.mesh);
        }
      }

      const mat = materials[Math.floor(Math.random() * materials.length)];
      const mesh = new THREE.Mesh(this.petalGeo, mat);

      // Random starting position above the Diya and thali
      const x = (Math.random() - 0.5) * 2.8;
      const y = 3.5 + Math.random() * 2.5;
      const z = 0.4 + (Math.random() - 0.5) * 2.0;

      mesh.position.set(x, y, z);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      // Random scale for natural variety
      const scale = 0.7 + Math.random() * 0.6;
      mesh.scale.set(scale, scale, scale);

      // Target resting elevation on the brass thali or table
      const distFromCenter = Math.hypot(x, z - 1.2);
      const restY = distFromCenter < 1.1 ? 0.05 + Math.random() * 0.02 : 0.02;

      this.petals.push({
        mesh,
        velY: 0.8 + Math.random() * 0.7,
        rotVel: new THREE.Vector3(
          (Math.random() - 0.5) * 4.0,
          (Math.random() - 0.5) * 4.0,
          (Math.random() - 0.5) * 4.0
        ),
        flutterFreq: 3.0 + Math.random() * 3.0,
        flutterPhase: Math.random() * Math.PI * 2,
        restY,
        isResting: false,
        restTimer: 0,
      });

      this.group.add(mesh);
    }
  }

  /**
   * Updates aerodynamic flutter kinematics and settling on the brass platter.
   */
  public update(dt: number, elapsed: number): void {
    for (let i = this.petals.length - 1; i >= 0; i--) {
      const p = this.petals[i];

      if (!p.isResting) {
        p.mesh.position.y -= p.velY * dt;

        // Aerodynamic fluttering horizontal sway
        p.mesh.position.x += Math.sin(elapsed * p.flutterFreq + p.flutterPhase) * 0.008;
        p.mesh.position.z += Math.cos(elapsed * p.flutterFreq + p.flutterPhase) * 0.006;

        // Tumbling rotation
        p.mesh.rotation.x += p.rotVel.x * dt;
        p.mesh.rotation.y += p.rotVel.y * dt;
        p.mesh.rotation.z += p.rotVel.z * dt;

        // Check if landed
        if (p.mesh.position.y <= p.restY) {
          p.mesh.position.y = p.restY;
          p.isResting = true;
          // Flatten slightly onto surface
          p.mesh.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.2;
        }
      } else {
        p.restTimer += dt;
        // Fade out rested petals after 12 seconds
        if (p.restTimer > 12.0) {
          this.group.remove(p.mesh);
          this.petals.splice(i, 1);
        }
      }
    }
  }

  public getPetalsCount(): number {
    return this.petals.length;
  }

  public dispose(): void {
    this.petals.forEach((p) => this.group.remove(p.mesh));
    this.petals = [];
    this.petalGeo.dispose();
    this.marigoldYellowMat.dispose();
    this.marigoldOrangeMat.dispose();
    this.roseCrimsonMat.dispose();
    this.group.clear();
  }
}
