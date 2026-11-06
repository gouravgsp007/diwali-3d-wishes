import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

export interface ClockChampagneHolder {
  group: THREE.Group;
  isPopped: boolean;
  popCork: () => Promise<void>;
  update: (elapsed: number) => void;
  dispose: () => void;
}

/**
 * Procedural 3D Midnight Clock & Festive Champagne Bottle with popping cork.
 */
export function createClockChampagne(): ClockChampagneHolder {
  const group = new THREE.Group();
  group.name = 'newyear-clock-champagne-group';

  const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  // 1. Midnight Roman Numeral Clock Face (Background backdrop disc)
  const clockGeo = new THREE.CylinderGeometry(1.2, 1.25, 0.08, 32);
  const clockMat = new THREE.MeshStandardMaterial({
    color: 0x09090b, // Midnight obsidian black
    metalness: 0.8,
    roughness: 0.3,
  });
  disposables.push(clockGeo, clockMat);
  const clockMesh = new THREE.Mesh(clockGeo, clockMat);
  clockMesh.rotation.x = Math.PI / 2;
  clockMesh.position.set(0, 1.4, -0.6);
  group.add(clockMesh);

  // Gold clock rim
  const rimGeo = new THREE.TorusGeometry(1.22, 0.04, 8, 32);
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.9,
    roughness: 0.2,
  });
  disposables.push(rimGeo, goldMat);
  const rim = new THREE.Mesh(rimGeo, goldMat);
  rim.position.set(0, 1.4, -0.55);
  group.add(rim);

  // Clock hands (Hour and Minute hands)
  const handMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
  disposables.push(handMat);

  const hourHandGeo = new THREE.BoxGeometry(0.04, 0.45, 0.02);
  disposables.push(hourHandGeo);
  const hourHand = new THREE.Mesh(hourHandGeo, handMat);
  hourHand.position.set(0, 1.6, -0.52);
  group.add(hourHand);

  const minHandGeo = new THREE.BoxGeometry(0.03, 0.65, 0.02);
  disposables.push(minHandGeo);
  const minHand = new THREE.Mesh(minHandGeo, handMat);
  minHand.position.set(-0.04, 1.68, -0.51);
  minHand.rotation.z = -0.15; // Set at 11:58
  group.add(minHand);

  // 2. Chilled Champagne Silver Bucket Base
  const bucketGeo = new THREE.CylinderGeometry(0.55, 0.45, 0.55, 24);
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.9,
    roughness: 0.15,
  });
  disposables.push(bucketGeo, silverMat);
  const bucket = new THREE.Mesh(bucketGeo, silverMat);
  bucket.position.set(0, 0.25, 0.1);
  bucket.castShadow = true;
  group.add(bucket);

  // 3. Emerald Green Champagne Bottle
  const bottleGroup = new THREE.Group();
  bottleGroup.position.set(0, 0.35, 0.1);
  bottleGroup.rotation.z = 0.12; // Slight celebratory tilt
  group.add(bottleGroup);

  const bottleBodyGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.7, 24);
  const bottleNeckGeo = new THREE.CylinderGeometry(0.08, 0.22, 0.4, 24);
  const bottleLipGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.22, 24);
  const bottleMat = new THREE.MeshStandardMaterial({
    color: 0x064e3b, // Deep emerald glass
    roughness: 0.2,
    metalness: 0.1,
  });
  disposables.push(bottleBodyGeo, bottleNeckGeo, bottleLipGeo, bottleMat);

  const bottleBody = new THREE.Mesh(bottleBodyGeo, bottleMat);
  bottleBody.position.y = 0.35;
  bottleGroup.add(bottleBody);

  const bottleNeck = new THREE.Mesh(bottleNeckGeo, bottleMat);
  bottleNeck.position.y = 0.85;
  bottleGroup.add(bottleNeck);

  const bottleLip = new THREE.Mesh(bottleLipGeo, goldMat); // Golden foil neck wrapper
  bottleLip.position.y = 1.05;
  bottleGroup.add(bottleLip);

  // 4. Champagne Cork at bottle mouth
  const corkGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.15, 12);
  const corkMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Natural cork tan
    roughness: 0.9,
  });
  disposables.push(corkGeo, corkMat);
  const cork = new THREE.Mesh(corkGeo, corkMat);
  cork.position.set(0, 1.20, 0);
  bottleGroup.add(cork);

  let isPopped = false;

  return {
    group,
    get isPopped() {
      return isPopped;
    },
    popCork: (): Promise<void> => {
      return new Promise((resolve) => {
        if (isPopped) {
          resolve();
          return;
        }
        isPopped = true;

        // Animate clock minute hand to strike exactly 12:00
        new TWEEN.Tween(minHand.rotation, true)
          .to({ z: 0 }, 500)
          .easing(TWEEN.Easing.Back.Out)
          .start();

        // Animate cork flying out of bottle
        new TWEEN.Tween(cork.position, true)
          .to({ y: 3.5, x: 0.6, z: 0.4 }, 650)
          .easing(TWEEN.Easing.Cubic.Out)
          .onUpdate(() => {
            cork.rotation.x += 0.2;
            cork.rotation.z += 0.15;
          })
          .onComplete(() => {
            cork.visible = false;
            resolve();
          })
          .start();
      });
    },
    update: (elapsed: number) => {
      // Subtle ticking sway on clock hands before midnight
      if (!isPopped) {
        minHand.rotation.z = -0.15 + Math.sin(elapsed * 2.0) * 0.015;
      }
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
      group.clear();
    },
  };
}
