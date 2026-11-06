import * as THREE from 'three';

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
  private petalGeo: THREE.BufferGeometry;
  private petalTexture: THREE.CanvasTexture | null = null;
  private marigoldYellowMat: THREE.MeshStandardMaterial;
  private marigoldOrangeMat: THREE.MeshStandardMaterial;
  private roseCrimsonMat: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();

    // Authentic organic curved petal geometry with natural spoon cupping
    this.petalGeo = this.createPetalGeometry();
    this.petalTexture = this.createPetalTexture();

    this.marigoldYellowMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      map: this.petalTexture,
      roughness: 0.42,
      side: THREE.DoubleSide,
    });
    this.marigoldOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      map: this.petalTexture,
      roughness: 0.42,
      side: THREE.DoubleSide,
    });
    this.roseCrimsonMat = new THREE.MeshStandardMaterial({
      color: 0xcc1133,
      map: this.petalTexture,
      roughness: 0.38,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Constructs an authentic organic curved petal shape with natural 3D cupped curvature.
   * Replaces flat rectangular paper pieces with realistic floral contours.
   */
  private createPetalGeometry(): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    // Narrow base at bottom
    shape.moveTo(0, -0.06);
    // Left curved belly
    shape.bezierCurveTo(-0.042, -0.035, -0.048, 0.015, -0.026, 0.052);
    // Rounded tip
    shape.bezierCurveTo(-0.010, 0.068, 0.010, 0.068, 0.026, 0.052);
    // Right curved belly returning to base
    shape.bezierCurveTo(0.048, 0.015, 0.042, -0.035, 0, -0.06);

    const geo = new THREE.ShapeGeometry(shape, 8);

    // Cup the petal into a realistic 3D scooped bowl/spoon shape
    const pos = geo.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const cup = -(x * x * 2.2) + (0.003 - (y + 0.01) * (y + 0.01) * 0.8);
      pos.setZ(i, cup);
    }
    geo.computeVertexNormals();
    return geo;
  }

  /**
   * Generates a delicate procedural canvas texture with subtle micro-veins and velvety shading.
   */
  private createPetalTexture(): THREE.CanvasTexture {
    if (typeof document === 'undefined') {
      return new THREE.CanvasTexture(null as unknown as HTMLCanvasElement);
    }
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return new THREE.CanvasTexture(canvas);
    }

    // Soft organic radial glow
    const grad = ctx.createRadialGradient(64, 75, 4, 64, 64, 62);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.65, 'rgba(240, 240, 240, 0.95)');
    grad.addColorStop(1.0, 'rgba(215, 215, 215, 0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    // Delicate petal micro-veins radiating from stem
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.07)';
    ctx.lineWidth = 1.2;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(64, 120);
      ctx.quadraticCurveTo(64 + i * 14, 60, 64 + i * 18, 15);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * Triggers a royal cascade of fresh festive petals.
   */
  public triggerFlowerShower(count = 75): void {
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
    this.petalTexture?.dispose();
    this.marigoldYellowMat.dispose();
    this.marigoldOrangeMat.dispose();
    this.roseCrimsonMat.dispose();
    this.group.clear();
  }
}
