import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { AudioEngine } from '../../audio/audio-engine';

/**
 * Procedural Royal Indian Mithai (Sweet) Box.
 * An ornate crimson and gold octagonal gift box containing golden Boondi Laddus
 * and silver vark Kaju Katli that opens with smooth physics and celebratory radiance.
 */
export class SweetBox {
  public readonly group: THREE.Group;
  private lidGroup: THREE.Group;
  private innerLight: THREE.PointLight;
  private isOpen = false;
  private currentTween: TWEEN.Tween<any> | null = null;
  private raycastTargets: THREE.Object3D[] = [];

  // Track GPU resources for leak-free disposal
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'royal-sweet-box';

    // 1. Shared Materials
    const crimsonLacquerMat = new THREE.MeshStandardMaterial({
      color: 0x8a1020,
      roughness: 0.32,
      metalness: 0.35,
    });
    this.materials.push(crimsonLacquerMat);

    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.88,
      roughness: 0.22,
    });
    this.materials.push(goldTrimMat);

    const velvetLiningMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.75,
      metalness: 0.10,
    });
    this.materials.push(velvetLiningMat);

    // 2. Octagonal Box Base
    const boxBaseGeo = new THREE.CylinderGeometry(0.25, 0.28, 0.14, 8);
    this.geometries.push(boxBaseGeo);
    const boxBase = new THREE.Mesh(boxBaseGeo, crimsonLacquerMat);
    boxBase.position.y = 0.07;
    boxBase.castShadow = true;
    boxBase.receiveShadow = true;
    this.group.add(boxBase);
    this.raycastTargets.push(boxBase);

    // Gold Rim on Box Base
    const baseRimGeo = new THREE.TorusGeometry(0.282, 0.008, 6, 16);
    this.geometries.push(baseRimGeo);
    const baseRim = new THREE.Mesh(baseRimGeo, goldTrimMat);
    baseRim.rotation.x = Math.PI / 2;
    baseRim.position.y = 0.138;
    this.group.add(baseRim);

    // Velvet Cushion Bed Inside
    const bedGeo = new THREE.CylinderGeometry(0.245, 0.245, 0.02, 8);
    this.geometries.push(bedGeo);
    const bedMesh = new THREE.Mesh(bedGeo, velvetLiningMat);
    bedMesh.position.y = 0.125;
    this.group.add(bedMesh);

    // 3. Hinged Lid & Rear Pivot
    // Pivot located at top rear edge: y = 0.14, z = -0.24
    this.lidGroup = new THREE.Group();
    this.lidGroup.position.set(0, 0.14, -0.24);
    this.group.add(this.lidGroup);

    // Lid geometry (offset forward by 0.24 relative to rear hinge pivot)
    const lidGeo = new THREE.CylinderGeometry(0.285, 0.265, 0.038, 8);
    this.geometries.push(lidGeo);
    const lidMesh = new THREE.Mesh(lidGeo, crimsonLacquerMat);
    lidMesh.position.set(0, 0.019, 0.24);
    lidMesh.castShadow = true;
    this.lidGroup.add(lidMesh);
    this.raycastTargets.push(lidMesh);

    // Gold Trim on Lid
    const lidRimGeo = new THREE.TorusGeometry(0.288, 0.007, 6, 16);
    this.geometries.push(lidRimGeo);
    const lidRim = new THREE.Mesh(lidRimGeo, goldTrimMat);
    lidRim.rotation.x = Math.PI / 2;
    lidRim.position.set(0, 0.035, 0.24);
    this.lidGroup.add(lidRim);

    // Ornamental Golden Knob on top of Lid
    const knobGeo = new THREE.SphereGeometry(0.028, 12, 12);
    this.geometries.push(knobGeo);
    const knobMesh = new THREE.Mesh(knobGeo, goldTrimMat);
    knobMesh.position.set(0, 0.055, 0.24);
    this.lidGroup.add(knobMesh);

    // 4. Festive Delights Inside
    this.populateSweets();

    // 5. Warm Inner Luminescence Light
    this.innerLight = new THREE.PointLight(0xffaa22, 0.0, 1.4);
    this.innerLight.position.set(0, 0.18, 0);
    this.group.add(this.innerLight);

    // Initial position: sitting on the front-right of the thali
    this.group.position.set(0.85, 0.02, 0.55);
    this.group.rotation.y = -Math.PI / 5;
    this.group.scale.set(0.82, 0.82, 0.82);
  }

  /**
   * Constructs delicious 3D Boondi Laddus and silver vark Kaju Katli inside the box.
   */
  private populateSweets(): void {
    // Saffron-gold Boondi Laddu Material with sugar crystal sheen
    const ladduMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.65,
      emissive: 0x78350f,
      emissiveIntensity: 0.25,
      metalness: 0.12,
    });
    this.materials.push(ladduMat);

    // Edible Silver Vark Foil Kaju Katli Material
    const kajuKatliMat = new THREE.MeshStandardMaterial({
      color: 0xe5e7eb,
      metalness: 0.88,
      roughness: 0.20,
    });
    this.materials.push(kajuKatliMat);

    // 4 Saffron Boondi Laddus
    const ladduGeo = new THREE.SphereGeometry(0.046, 12, 10);
    this.geometries.push(ladduGeo);

    const ladduPositions = [
      [-0.08, 0.155, -0.08],
      [0.08, 0.155, -0.08],
      [-0.08, 0.155, 0.08],
      [0.08, 0.155, 0.08],
    ];

    ladduPositions.forEach(([x, y, z]) => {
      const laddu = new THREE.Mesh(ladduGeo, ladduMat);
      laddu.position.set(x, y, z);
      laddu.scale.set(1.0, 0.88, 1.0); // Slight natural squish
      laddu.castShadow = true;
      this.group.add(laddu);
      this.raycastTargets.push(laddu);
    });

    // 3 Diamond-shaped Kaju Katli
    const diamondShape = new THREE.Shape();
    diamondShape.moveTo(0, 0.052);
    diamondShape.lineTo(0.038, 0);
    diamondShape.lineTo(0, -0.052);
    diamondShape.lineTo(-0.038, 0);
    diamondShape.closePath();

    const katliGeo = new THREE.ExtrudeGeometry(diamondShape, {
      depth: 0.016,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: 0.003,
      bevelThickness: 0.003,
    });
    this.geometries.push(katliGeo);

    const katliOffsets = [
      { pos: [0, 0.15, 0], rot: [Math.PI / 2, 0, 0] },
      { pos: [-0.05, 0.16, 0.01], rot: [Math.PI / 2, 0.12, -0.2] },
      { pos: [0.05, 0.16, -0.01], rot: [Math.PI / 2, -0.12, 0.2] },
    ];

    katliOffsets.forEach(({ pos, rot }) => {
      const katli = new THREE.Mesh(katliGeo, kajuKatliMat);
      katli.position.set(pos[0], pos[1], pos[2]);
      katli.rotation.set(rot[0], rot[1], rot[2]);
      katli.castShadow = true;
      this.group.add(katli);
      this.raycastTargets.push(katli);
    });
  }

  /**
   * Toggles the sweet box between open and closed.
   */
  public toggle(): boolean {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
    return this.isOpen;
  }

  /**
   * Smoothly tweens open the box lid and illuminates the festive treats.
   */
  public open(): void {
    if (this.isOpen) return;
    this.isOpen = true;

    if (this.currentTween) {
      this.currentTween.stop();
    }

    AudioEngine.getInstance().playSweetBoxOpen();

    const targetAngle = -Math.PI * 0.62; // ~112 degrees backward rotation
    const animObj = { rot: this.lidGroup.rotation.x, light: this.innerLight.intensity };

    this.currentTween = new TWEEN.Tween(animObj)
      .to({ rot: targetAngle, light: 1.3 }, 820)
      .easing(TWEEN.Easing.Back.Out)
      .onUpdate(() => {
        this.lidGroup.rotation.x = animObj.rot;
        this.innerLight.intensity = animObj.light;
      })
      .onComplete(() => {
        this.currentTween = null;
      })
      .start();
  }

  /**
   * Smoothly closes the box lid.
   */
  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;

    if (this.currentTween) {
      this.currentTween.stop();
    }

    const animObj = { rot: this.lidGroup.rotation.x, light: this.innerLight.intensity };

    this.currentTween = new TWEEN.Tween(animObj)
      .to({ rot: 0, light: 0.0 }, 550)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        this.lidGroup.rotation.x = animObj.rot;
        this.innerLight.intensity = animObj.light;
      })
      .onComplete(() => {
        this.currentTween = null;
      })
      .start();
  }

  public getIsOpen(): boolean {
    return this.isOpen;
  }

  public getRaycastTargets(): THREE.Object3D[] {
    return this.raycastTargets;
  }

  public dispose(): void {
    if (this.currentTween) {
      this.currentTween.stop();
      this.currentTween = null;
    }

    this.geometries.forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
    this.geometries = [];
    this.materials = [];
    this.raycastTargets = [];
    this.lidGroup.clear();
    this.group.clear();
  }
}
