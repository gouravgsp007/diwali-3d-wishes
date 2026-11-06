import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

export interface JewelryBoxHolder {
  group: THREE.Group;
  isOpen: boolean;
  openBox: () => Promise<void>;
  update: (elapsed: number) => void;
  dispose: () => void;
}

/**
 * Procedural 3D Royal Indian Velvet & Gold Ring Box with hinged opening lid.
 */
export function createJewelryBox(): JewelryBoxHolder {
  const group = new THREE.Group();
  group.name = 'jewelry-box-group';

  const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  // 1. Ornate Circular Royal Platter / Silk Mat
  const matGeo = new THREE.CylinderGeometry(1.3, 1.4, 0.05, 32);
  const matMat = new THREE.MeshStandardMaterial({
    color: 0x881337, // Royal deep crimson silk
    roughness: 0.7,
  });
  disposables.push(matGeo, matMat);
  const matMesh = new THREE.Mesh(matGeo, matMat);
  matMesh.position.y = -0.025;
  matMesh.receiveShadow = true;
  group.add(matMesh);

  // 2. Gold Floral Rim around Silk Mat
  const goldBorderGeo = new THREE.TorusGeometry(1.35, 0.03, 8, 32);
  const goldBorderMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.85,
    roughness: 0.2,
  });
  disposables.push(goldBorderGeo, goldBorderMat);
  const goldBorder = new THREE.Mesh(goldBorderGeo, goldBorderMat);
  goldBorder.rotation.x = Math.PI / 2;
  goldBorder.position.y = -0.01;
  group.add(goldBorder);

  // 3. Lower Velvet Box Base
  const boxBaseGeo = new THREE.BoxGeometry(0.9, 0.45, 0.8);
  const velvetMat = new THREE.MeshStandardMaterial({
    color: 0x9f1239, // Deep burgundy velvet
    roughness: 0.85,
  });
  disposables.push(boxBaseGeo, velvetMat);
  const boxBase = new THREE.Mesh(boxBaseGeo, velvetMat);
  boxBase.position.y = 0.225;
  boxBase.castShadow = true;
  boxBase.receiveShadow = true;
  group.add(boxBase);

  // 4. Gold Corners & Borders on Box Base
  const cornerMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.9,
    roughness: 0.2,
  });
  disposables.push(cornerMat);

  const trimGeo = new THREE.BoxGeometry(0.92, 0.04, 0.82);
  disposables.push(trimGeo);
  const baseTrim = new THREE.Mesh(trimGeo, cornerMat);
  baseTrim.position.y = 0.44;
  group.add(baseTrim);

  // 5. Inner White Silk Ring Cushion
  const cushionGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16);
  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0xfff1f2, // Creamy ivory satin
    roughness: 0.4,
  });
  disposables.push(cushionGeo, cushionMat);
  const cushion = new THREE.Mesh(cushionGeo, cushionMat);
  cushion.position.set(0, 0.45, 0);
  group.add(cushion);

  // 6. Glistening Engagement Rings & Solitaire Diamond
  const ringGeo = new THREE.TorusGeometry(0.09, 0.018, 8, 24);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.95,
    roughness: 0.15,
  });
  disposables.push(ringGeo, ringMat);

  const diamondGeo = new THREE.OctahedronGeometry(0.045, 0);
  const diamondMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.05,
    emissive: 0x93c5fd,
    emissiveIntensity: 0.6,
  });
  disposables.push(diamondGeo, diamondMat);

  // Ring 1
  const ring1 = new THREE.Mesh(ringGeo, ringMat);
  ring1.position.set(-0.08, 0.53, 0);
  ring1.rotation.y = Math.PI / 6;
  group.add(ring1);

  // Ring 2 with Diamond Solitaire
  const ring2 = new THREE.Mesh(ringGeo, ringMat);
  ring2.position.set(0.08, 0.53, 0);
  ring2.rotation.y = -Math.PI / 6;

  const diamond = new THREE.Mesh(diamondGeo, diamondMat);
  diamond.position.y = 0.095;
  ring2.add(diamond);
  group.add(ring2);

  // Sparkle point light on diamond
  const ringGlow = new THREE.PointLight(0xfff7ed, 0.9, 2.0);
  ringGlow.position.set(0.08, 0.65, 0);
  group.add(ringGlow);

  // 7. Hinged Box Lid (Rotates backward around hinge at z = -0.40, y = 0.45)
  const hingePivot = new THREE.Group();
  hingePivot.position.set(0, 0.45, -0.40);
  group.add(hingePivot);

  const lidGeo = new THREE.BoxGeometry(0.92, 0.35, 0.82);
  disposables.push(lidGeo);
  const lid = new THREE.Mesh(lidGeo, velvetMat);
  lid.position.set(0, 0.175, 0.41);
  lid.castShadow = true;
  hingePivot.add(lid);

  // Lid golden filigree badge
  const claspGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 8);
  disposables.push(claspGeo);
  const clasp = new THREE.Mesh(claspGeo, cornerMat);
  clasp.rotation.x = Math.PI / 2;
  clasp.position.set(0, 0.18, 0.83);
  hingePivot.add(clasp);

  let isOpen = false;

  return {
    group,
    get isOpen() {
      return isOpen;
    },
    openBox: (): Promise<void> => {
      return new Promise((resolve) => {
        if (isOpen) {
          resolve();
          return;
        }
        isOpen = true;

        // Swing lid open backwards 115 degrees
        new TWEEN.Tween(hingePivot.rotation, true)
          .to({ x: -1.9 }, 900)
          .easing(TWEEN.Easing.Back.Out)
          .onComplete(() => {
            resolve();
          })
          .start();
      });
    },
    update: (elapsed: number) => {
      // Shimmering diamond light
      ringGlow.intensity = 0.7 + Math.sin(elapsed * 6.0) * 0.3;
      diamond.rotation.y = elapsed * 1.5;
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
      group.clear();
    },
  };
}
