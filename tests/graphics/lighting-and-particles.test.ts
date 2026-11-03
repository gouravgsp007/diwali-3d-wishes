import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createBrassThaliMesh } from '../../src/graphics/meshes/thali-mesh';
import { createLightingRig } from '../../src/graphics/lighting-rig';
import { BokehMotes } from '../../src/graphics/particles/bokeh-motes';

describe('Brass Thali Platter', () => {
  it('creates dark antique brass thali platter with correct dimensions, shadows, and materials', () => {
    const thali = createBrassThaliMesh();

    expect(thali).toBeInstanceOf(THREE.Mesh);
    expect(thali.name).toBe('brass-thali');
    expect(thali.position.y).toBeCloseTo(-0.02, 2);
    expect(thali.receiveShadow).toBe(true);
    expect(thali.castShadow).toBe(false);

    const mat = thali.material as THREE.MeshStandardMaterial;
    expect(mat).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(mat.metalness).toBeCloseTo(0.88, 2);
    expect(mat.roughness).toBeCloseTo(0.38, 2);
    expect(mat.bumpMap).toBeDefined();
    expect(mat.bumpScale).toBeCloseTo(0.015, 3);
  });
});

describe('Dual-Tier Lighting Rig', () => {
  it('configures nocturnal ambient fill, golden rim light with shadow map, and pre-warmed flame PointLight', () => {
    const wickAnchor = new THREE.Vector3(0.0, 0.68, 1.38);
    const rig = createLightingRig(wickAnchor);

    // 1. Ambient Light
    expect(rig.ambientLight).toBeInstanceOf(THREE.AmbientLight);
    expect(rig.ambientLight.color.getHex()).toBe(0x140c2e);
    expect(rig.ambientLight.intensity).toBeCloseTo(0.55, 2);

    // 2. Rim Directional Light
    expect(rig.rimLight).toBeInstanceOf(THREE.DirectionalLight);
    expect(rig.rimLight.color.getHex()).toBe(0xffb255);
    expect(rig.rimLight.intensity).toBeCloseTo(1.8, 2);
    expect(rig.rimLight.castShadow).toBe(true);
    expect(rig.rimLight.shadow.mapSize.width).toBe(1024);
    expect(rig.rimLight.shadow.mapSize.height).toBe(1024);
    expect(rig.rimLight.shadow.bias).toBeCloseTo(-0.001, 3);

    // 3. Pre-warmed PointLight
    expect(rig.flamePointLight).toBeInstanceOf(THREE.PointLight);
    expect(rig.flamePointLight.intensity).toBeCloseTo(0.0001, 4);
    expect(rig.flamePointLight.castShadow).toBe(false);
    expect(rig.flamePointLight.position.x).toBeCloseTo(wickAnchor.x, 2);
    expect(rig.flamePointLight.position.y).toBeCloseTo(wickAnchor.y + 0.15, 2);
    expect(rig.flamePointLight.position.z).toBeCloseTo(wickAnchor.z, 2);
  });
});

describe('Golden Bokeh Motes', () => {
  it('instantiates 50 drifting particles with AdditiveBlending and updates over time', () => {
    const motes = new BokehMotes();

    expect(motes.points).toBeInstanceOf(THREE.Points);
    expect(motes.points.name).toBe('bokeh-motes');

    const posAttr = motes.points.geometry.getAttribute('position');
    expect(posAttr).toBeDefined();
    expect(posAttr.count).toBe(50);

    const mat = motes.points.material as THREE.PointsMaterial;
    expect(mat.blending).toBe(THREE.AdditiveBlending);
    expect(mat.depthWrite).toBe(false);
    expect(mat.transparent).toBe(true);

    const initialY0 = posAttr.getY(0);
    // Tick 0.1 seconds forward
    motes.update(0.1, 0.1);
    const updatedY0 = posAttr.getY(0);
    expect(updatedY0).toBeGreaterThan(initialY0);

    // Dispose
    expect(() => motes.dispose()).not.toThrow();
  });
});
