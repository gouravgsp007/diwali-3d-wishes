import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

export interface BirthdayCakeHolder {
  group: THREE.Group;
  candlesLit: boolean;
  blowOut: () => Promise<void>;
  update: (elapsed: number) => void;
  dispose: () => void;
}

/**
 * Procedural 3D Birthday Cake with frosting and 3 interactive candles.
 */
export function createBirthdayCake(): BirthdayCakeHolder {
  const group = new THREE.Group();
  group.name = 'birthday-cake-group';

  const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  // 1. Scalloped Golden Cake Stand / Platter
  const standGeo = new THREE.CylinderGeometry(1.25, 1.35, 0.08, 32);
  const standMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.8,
    roughness: 0.25,
  });
  disposables.push(standGeo, standMat);
  const stand = new THREE.Mesh(standGeo, standMat);
  stand.position.y = -0.04;
  stand.receiveShadow = true;
  group.add(stand);

  // 2. Bottom Cake Tier (Warm Rose Vanilla Sponge)
  const tier1Geo = new THREE.CylinderGeometry(0.95, 0.95, 0.45, 32);
  const tier1Mat = new THREE.MeshStandardMaterial({
    color: 0xfdf2f8, // Soft blush cream
    roughness: 0.6,
  });
  disposables.push(tier1Geo, tier1Mat);
  const tier1 = new THREE.Mesh(tier1Geo, tier1Mat);
  tier1.position.y = 0.20;
  tier1.castShadow = true;
  tier1.receiveShadow = true;
  group.add(tier1);

  // 3. Frosting Ribbon on Bottom Tier
  const ribbonGeo = new THREE.TorusGeometry(0.96, 0.025, 8, 32);
  const ribbonMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6, // Rose pink frosting
    roughness: 0.3,
  });
  disposables.push(ribbonGeo, ribbonMat);
  const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
  ribbon.rotation.x = Math.PI / 2;
  ribbon.position.y = 0.20;
  group.add(ribbon);

  // 4. Top Cake Tier (Pastel Strawberry Lavender)
  const tier2Geo = new THREE.CylinderGeometry(0.65, 0.65, 0.38, 32);
  const tier2Mat = new THREE.MeshStandardMaterial({
    color: 0xffedd5, // Peach cream
    roughness: 0.5,
  });
  disposables.push(tier2Geo, tier2Mat);
  const tier2 = new THREE.Mesh(tier2Geo, tier2Mat);
  tier2.position.y = 0.60;
  tier2.castShadow = true;
  tier2.receiveShadow = true;
  group.add(tier2);

  // 5. Frosting Pearls along the upper rim
  const pearlGeo = new THREE.SphereGeometry(0.045, 8, 8);
  const pearlMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24, // Gold edible pearls
    metalness: 0.5,
    roughness: 0.2,
  });
  disposables.push(pearlGeo, pearlMat);

  const pearlCount = 14;
  for (let i = 0; i < pearlCount; i++) {
    const angle = (i / pearlCount) * Math.PI * 2;
    const pearl = new THREE.Mesh(pearlGeo, pearlMat);
    pearl.position.set(Math.cos(angle) * 0.64, 0.78, Math.sin(angle) * 0.64);
    group.add(pearl);
  }

  // 6. Three Festive Birthday Candles
  const candleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.26, 12);
  const candleMat = new THREE.MeshStandardMaterial({
    color: 0xec4899,
    roughness: 0.4,
  });
  disposables.push(candleGeo, candleMat);

  const flameGeo = new THREE.ConeGeometry(0.028, 0.08, 8);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
  });
  disposables.push(flameGeo, flameMat);

  const candlePositions = [
    new THREE.Vector3(-0.24, 0.79, 0),
    new THREE.Vector3(0, 0.79, 0.16),
    new THREE.Vector3(0.24, 0.79, 0),
  ];

  const flames: THREE.Mesh[] = [];
  const candleLights: THREE.PointLight[] = [];

  candlePositions.forEach((pos) => {
    // Candle wax stem
    const candle = new THREE.Mesh(candleGeo, candleMat);
    candle.position.copy(pos);
    candle.position.y += 0.13;
    candle.castShadow = true;
    group.add(candle);

    // Candle flame tip
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(pos.x, pos.y + 0.30, pos.z);
    group.add(flame);
    flames.push(flame);

    // Warm glow light
    const candleLight = new THREE.PointLight(0xffaa22, 0.8, 1.8);
    candleLight.position.set(pos.x, pos.y + 0.32, pos.z);
    group.add(candleLight);
    candleLights.push(candleLight);
  });

  // 7. Smoke Wisp Particles (Spawn on blow out)
  const smokeCount = 16;
  const smokeGeo = new THREE.BufferGeometry();
  const smokePositions = new Float32Array(smokeCount * 3);
  smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
  const smokeMat = new THREE.PointsMaterial({
    color: 0xd1d5db,
    size: 0.06,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  disposables.push(smokeGeo, smokeMat);
  const smokeParticles = new THREE.Points(smokeGeo, smokeMat);
  group.add(smokeParticles);

  let candlesLit = true;
  let smokeActive = false;
  let smokeTime = 0;

  return {
    group,
    get candlesLit() {
      return candlesLit;
    },
    blowOut: (): Promise<void> => {
      return new Promise((resolve) => {
        if (!candlesLit) {
          resolve();
          return;
        }
        candlesLit = false;

        // Animate flames scaling down to 0
        flames.forEach((flame) => {
          new TWEEN.Tween(flame.scale, true)
            .to({ x: 0.01, y: 0.01, z: 0.01 }, 300)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(() => {
              flame.visible = false;
            })
            .start();
        });

        // Dim candle lights
        candleLights.forEach((light) => {
          new TWEEN.Tween(light, true)
            .to({ intensity: 0 }, 300)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();
        });

        // Trigger smoke puff
        smokeActive = true;
        smokeMat.opacity = 0.85;

        // Initialize smoke positions around the candles
        const posAttr = smokeGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < smokeCount; i++) {
          const c = candlePositions[i % candlePositions.length];
          posAttr.setXYZ(
            i,
            c.x + (Math.random() - 0.5) * 0.08,
            c.y + 0.32,
            c.z + (Math.random() - 0.5) * 0.08
          );
        }
        posAttr.needsUpdate = true;

        new TWEEN.Tween(smokeMat, true)
          .to({ opacity: 0 }, 1200)
          .easing(TWEEN.Easing.Cubic.Out)
          .onComplete(() => {
            smokeActive = false;
            resolve();
          })
          .start();
      });
    },
    update: (elapsed: number) => {
      // Gentle flame flicker while lit
      if (candlesLit) {
        flames.forEach((flame, idx) => {
          const flick = 1.0 + Math.sin(elapsed * 12.0 + idx * 2.1) * 0.15;
          flame.scale.set(flick, 1.0 + Math.cos(elapsed * 15.0 + idx) * 0.2, flick);
        });
      }

      // Smoke rising animation
      if (smokeActive) {
        smokeTime += 0.016;
        const posAttr = smokeGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < smokeCount; i++) {
          const y = posAttr.getY(i) + 0.008;
          const x = posAttr.getX(i) + Math.sin(smokeTime * 4.0 + i) * 0.002;
          posAttr.setXYZ(i, x, y, posAttr.getZ(i));
        }
        posAttr.needsUpdate = true;
      }
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
      group.clear();
    },
  };
}
