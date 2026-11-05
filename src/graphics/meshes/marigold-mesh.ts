import * as THREE from 'three';

/**
 * Creates a garland ring of 16 fresh 3D marigold flowers (Genda Phool)
 * arranged radially around the rim of the brass thali platter.
 */
export function createMarigoldRingMesh(): THREE.Group {
  const ringGroup = new THREE.Group();
  ringGroup.name = 'marigold-garland';

  const flowerCount = 16;
  const radius = 2.15;
  const flowerBaseY = 0.08;

  // Shared geometries and materials for optimal performance (zero memory waste)
  const petalGeo = new THREE.DodecahedronGeometry(0.12, 1);
  const centerGeo = new THREE.SphereGeometry(0.08, 8, 8);

  const orangeMat = new THREE.MeshStandardMaterial({
    color: 0xea580c, // Vibrant festive saffron orange
    roughness: 0.85,
    metalness: 0.05,
  });

  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15, // Auspicious golden yellow
    roughness: 0.85,
    metalness: 0.05,
  });

  const deepOrangeMat = new THREE.MeshStandardMaterial({
    color: 0xc2410c, // Deep marigold core
    roughness: 0.9,
    metalness: 0.05,
  });

  for (let i = 0; i < flowerCount; i++) {
    const angle = (i * Math.PI * 2) / flowerCount;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const flower = new THREE.Group();
    flower.position.set(x, flowerBaseY, z);

    // Subtle natural rotation & tilt
    flower.rotation.y = angle + Math.sin(i * 3) * 0.2;
    flower.rotation.x = Math.sin(i * 5) * 0.15;
    flower.rotation.z = Math.cos(i * 5) * 0.15;

    const isOrange = i % 2 === 0;
    const outerMat = isOrange ? orangeMat : yellowMat;
    const innerMat = isOrange ? deepOrangeMat : orangeMat;

    // Center core
    const core = new THREE.Mesh(centerGeo, innerMat);
    core.scale.set(1.1, 0.7, 1.1);
    core.castShadow = true;
    flower.add(core);

    // 5 clustered ruffled petals
    const petalSubCount = 5;
    for (let p = 0; p < petalSubCount; p++) {
      const pAngle = (p * Math.PI * 2) / petalSubCount;
      const petal = new THREE.Mesh(petalGeo, outerMat);
      petal.position.set(Math.cos(pAngle) * 0.08, 0.02, Math.sin(pAngle) * 0.08);
      petal.scale.set(0.9, 0.7, 0.9);
      petal.castShadow = true;
      flower.add(petal);
    }

    // Top crown petal
    const crown = new THREE.Mesh(petalGeo, outerMat);
    crown.position.set(0, 0.06, 0);
    crown.scale.set(0.7, 0.6, 0.7);
    crown.castShadow = true;
    flower.add(crown);

    ringGroup.add(flower);
  }

  return ringGroup;
}
