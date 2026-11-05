import * as THREE from 'three';

export interface FestiveLanternsHolder {
  group: THREE.Group;
  update: (elapsedTime: number) => void;
  dispose: () => void;
}

/**
 * Creates floating Diwali Akash Kandil (paper lanterns) in the background.
 * Features:
 * - Diamond-faceted lantern bodies in festive Indian jewel tones (crimson, gold, turquoise, violet)
 * - Trailing golden hanging tassel ribbons
 * - Soft inner glow
 * - Gentle floating bob and rotational sway in update()
 */
export function createFestiveLanterns(): FestiveLanternsHolder {
  const group = new THREE.Group();
  group.name = 'festive-lanterns';

  const lanternConfigs = [
    { x: -2.6, y: 2.2, z: -1.2, scale: 0.55, color: 0xe11d48, goldColor: 0xfbbf24, phase: 0 },
    { x: 2.7, y: 2.5, z: -1.4, scale: 0.58, color: 0xf59e0b, goldColor: 0xfde047, phase: 1.8 },
    { x: -1.8, y: 3.2, z: -2.5, scale: 0.45, color: 0x9333ea, goldColor: 0xfbbf24, phase: 3.4 },
    { x: 2.0, y: 3.4, z: -2.8, scale: 0.48, color: 0x059669, goldColor: 0xfde047, phase: 4.9 },
  ];

  const bodyGeo = new THREE.OctahedronGeometry(0.35, 0);
  const coreGlowGeo = new THREE.SphereGeometry(0.18, 12, 12);
  const tasselGeo = new THREE.CylinderGeometry(0.015, 0.01, 0.45, 6);

  const disposables: (THREE.BufferGeometry | THREE.Material)[] = [
    bodyGeo,
    coreGlowGeo,
    tasselGeo,
  ];

  const lanternNodes: { obj: THREE.Group; baseY: number; phase: number }[] = [];

  lanternConfigs.forEach((cfg) => {
    const lantern = new THREE.Group();
    lantern.position.set(cfg.x, cfg.y, cfg.z);
    lantern.scale.setScalar(cfg.scale);

    // 1. Faceted paper lantern body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: 0.4,
      metalness: 0.3,
      emissive: cfg.color,
      emissiveIntensity: 0.35,
    });
    disposables.push(bodyMat);

    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.scale.set(1.0, 1.4, 1.0);
    lantern.add(bodyMesh);

    // 2. Inner warm glowing heart
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xfff7ed,
      transparent: true,
      opacity: 0.85,
    });
    disposables.push(coreMat);

    const coreMesh = new THREE.Mesh(coreGlowGeo, coreMat);
    lantern.add(coreMesh);

    // 3. Hanging golden tassel streamers
    const tasselMat = new THREE.MeshStandardMaterial({
      color: cfg.goldColor,
      roughness: 0.3,
      metalness: 0.7,
      emissive: cfg.goldColor,
      emissiveIntensity: 0.2,
    });
    disposables.push(tasselMat);

    const streamerCount = 4;
    for (let s = 0; s < streamerCount; s++) {
      const sAngle = (s * Math.PI * 2) / streamerCount;
      const tassel = new THREE.Mesh(tasselGeo, tasselMat);
      tassel.position.set(
        Math.cos(sAngle) * 0.12,
        -0.55,
        Math.sin(sAngle) * 0.12
      );
      lantern.add(tassel);
    }

    // Central long golden pendant
    const centerTassel = new THREE.Mesh(tasselGeo, tasselMat);
    centerTassel.position.set(0, -0.62, 0);
    centerTassel.scale.set(1.2, 1.3, 1.2);
    lantern.add(centerTassel);

    // Warm subtle localized point light
    const pointLight = new THREE.PointLight(cfg.goldColor, 0.4, 3.0);
    pointLight.position.set(0, 0, 0);
    lantern.add(pointLight);

    group.add(lantern);
    lanternNodes.push({ obj: lantern, baseY: cfg.y, phase: cfg.phase });
  });

  return {
    group,
    update: (elapsedTime: number) => {
      lanternNodes.forEach((node) => {
        // Subtle floating bob
        node.obj.position.y = node.baseY + Math.sin(elapsedTime * 1.5 + node.phase) * 0.08;
        // Gentle rotational sway
        node.obj.rotation.y = elapsedTime * 0.25 + node.phase;
        node.obj.rotation.z = Math.sin(elapsedTime * 0.8 + node.phase) * 0.04;
      });
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
