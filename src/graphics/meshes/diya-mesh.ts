import * as THREE from 'three';
import { createProceduralDiyaGeometry } from './procedural-diya-geometry';
import { generateProceduralClayTextures } from '../materials/procedural-textures';

/**
 * Authentic earthenware Diya mesh assembly aggregating the pinched terracotta bowl,
 * glossy amber oil pool disc, and cotton wick tube pointing toward the WickAnchor coordinate.
 *
 * Implements D-01, D-02, D-04, and T-02-05 GPU resource disposal.
 */
export class DiyaMesh {
  public group: THREE.Group;
  public wickAnchor: THREE.Vector3;
  private bowlMesh: THREE.Mesh;
  private oilMesh: THREE.Mesh;
  private wickMesh: THREE.Mesh;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'diya-group';

    // 1. Procedural Bowl Geometry & Textures (D-01, D-02, D-04)
    const { geometry, wickAnchor } = createProceduralDiyaGeometry();
    this.wickAnchor = wickAnchor;

    const clayTextures = generateProceduralClayTextures();
    const clayMaterial = new THREE.MeshStandardMaterial({
      map: clayTextures.colorMap,
      bumpMap: clayTextures.bumpMap,
      bumpScale: 0.035,
      roughnessMap: clayTextures.roughnessMap,
      roughness: 0.85,
      metalness: 0.04,
    });

    this.bowlMesh = new THREE.Mesh(geometry, clayMaterial);
    this.bowlMesh.castShadow = true;
    this.bowlMesh.receiveShadow = false;
    this.group.add(this.bowlMesh);

    // 2. Glossy Amber Oil Pool Disc (D-01)
    const oilGeo = new THREE.CircleGeometry(0.92, 48);
    const oilMat = new THREE.MeshStandardMaterial({
      color: 0xb5781a, // Golden amber oil
      roughness: 0.06,  // Mirror-gloss liquid
      metalness: 0.15,
      transparent: true,
      opacity: 0.90,
    });
    this.oilMesh = new THREE.Mesh(oilGeo, oilMat);
    this.oilMesh.rotation.x = -Math.PI / 2;
    this.oilMesh.position.set(0, 0.32, 0.05); // Level with inner basin
    this.oilMesh.receiveShadow = true;
    this.group.add(this.oilMesh);

    // 3. Cotton Wick Tube through Spout to WickAnchor (D-02, D-04)
    const wickCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.28, 0.4),
      new THREE.Vector3(0, 0.45, 0.9),
      wickAnchor.clone().sub(new THREE.Vector3(0, 0.08, 0.1)),
      wickAnchor.clone(),
    ]);
    const wickGeo = new THREE.TubeGeometry(wickCurve, 20, 0.045, 12, false);
    const wickMat = new THREE.MeshStandardMaterial({
      color: 0x221c16, // Charred dark cotton tip
      roughness: 0.95,
      metalness: 0.0,
    });
    this.wickMesh = new THREE.Mesh(wickGeo, wickMat);
    this.wickMesh.castShadow = true;
    this.group.add(this.wickMesh);
  }

  /**
   * Disposes geometries and materials to prevent WebGL memory leaks (T-02-05).
   */
  public dispose(): void {
    this.bowlMesh.geometry.dispose();
    if (Array.isArray(this.bowlMesh.material)) {
      this.bowlMesh.material.forEach((m) => m.dispose());
    } else {
      this.bowlMesh.material.dispose();
    }

    this.oilMesh.geometry.dispose();
    if (Array.isArray(this.oilMesh.material)) {
      this.oilMesh.material.forEach((m) => m.dispose());
    } else {
      this.oilMesh.material.dispose();
    }

    this.wickMesh.geometry.dispose();
    if (Array.isArray(this.wickMesh.material)) {
      this.wickMesh.material.forEach((m) => m.dispose());
    } else {
      this.wickMesh.material.dispose();
    }
  }
}
