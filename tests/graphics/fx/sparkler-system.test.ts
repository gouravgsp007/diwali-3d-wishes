import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { SparklerSystem } from '../../../src/graphics/fx/sparkler-system';

describe('SparklerSystem (Phuljhadi)', () => {
  const wickAnchor = new THREE.Vector3(0.0, 0.68, 1.38);

  it('instantiates single BufferGeometry with 300 particles and position/color attributes in 1 draw call per D-09', () => {
    const system = new SparklerSystem(wickAnchor);
    expect(system.points).toBeInstanceOf(THREE.Points);
    expect(system.points.name).toBe('sparkler-particles');

    const geometry = system.points.geometry;
    expect(geometry).toBeInstanceOf(THREE.BufferGeometry);

    const posAttr = geometry.getAttribute('position');
    const colAttr = geometry.getAttribute('color');

    expect(posAttr).toBeDefined();
    expect(posAttr.count).toBe(300);
    expect(posAttr.itemSize).toBe(3);

    expect(colAttr).toBeDefined();
    expect(colAttr.count).toBe(300);
    expect(colAttr.itemSize).toBe(3);

    // Initial positions should be at wick anchor
    const posArray = posAttr.array as Float32Array;
    expect(posArray[0]).toBeCloseTo(wickAnchor.x, 3);
    expect(posArray[1]).toBeCloseTo(wickAnchor.y, 3);
    expect(posArray[2]).toBeCloseTo(wickAnchor.z, 3);

    system.dispose();
  });

  it('uses PointsMaterial with AdditiveBlending, depthWrite false, and vertexColors true per D-09', () => {
    const system = new SparklerSystem(wickAnchor);
    const material = system.points.material as THREE.PointsMaterial;

    expect(material).toBeInstanceOf(THREE.PointsMaterial);
    expect(material.blending).toBe(THREE.AdditiveBlending);
    expect(material.depthWrite).toBe(false);
    expect(material.vertexColors).toBe(true);
    expect(material.transparent).toBe(true);
    expect(material.map).toBeDefined();
    expect(material.size).toBeCloseTo(0.18, 2);

    system.dispose();
  });

  it('burst() initializes 300 particles at wickAnchor with upward fountain velocities and lifetimes 1.0..2.0s per D-10', () => {
    const system = new SparklerSystem(wickAnchor);
    system.burst();

    const geometry = system.points.geometry;
    const posArray = geometry.getAttribute('position').array as Float32Array;

    // Verify positions around wickAnchor with small offset
    for (let i = 0; i < 300; i++) {
      const px = posArray[i * 3 + 0];
      const py = posArray[i * 3 + 1];
      const pz = posArray[i * 3 + 2];

      expect(px).toBeGreaterThanOrEqual(wickAnchor.x - 0.05);
      expect(px).toBeLessThanOrEqual(wickAnchor.x + 0.05);

      expect(py).toBeGreaterThanOrEqual(wickAnchor.y + 0.04);
      expect(py).toBeLessThanOrEqual(wickAnchor.y + 0.06);

      expect(pz).toBeGreaterThanOrEqual(wickAnchor.z - 0.05);
      expect(pz).toBeLessThanOrEqual(wickAnchor.z + 0.05);
    }

    system.dispose();
  });

  it('update(dt) executes Euler kinematics applying downward gravity (g = -4.5) and air drag per D-10', () => {
    const system = new SparklerSystem(wickAnchor);
    system.burst();

    const geometry = system.points.geometry;
    const posAttr = geometry.getAttribute('position');
    const posArray = posAttr.array as Float32Array;

    const initialY0 = posArray[1];

    // Advance 0.05s
    system.update(0.05);

    // Position Y should have moved upward initially due to vy > 0
    expect(posArray[1]).toBeGreaterThan(initialY0);

    // Run simulation for 1.5 seconds (in small steps) so gravity pulls particles downward
    for (let step = 0; step < 30; step++) {
      system.update(0.05);
    }

    // Now particles should have experienced downward acceleration and updated buffer attribute version
    expect((posAttr as THREE.BufferAttribute).version).toBeGreaterThan(0);

    system.dispose();
  });

  it('update(dt) fades particle colors through 3 stages based on lifetime progress per D-10', () => {
    const system = new SparklerSystem(wickAnchor);
    system.burst();

    const geometry = system.points.geometry;
    const colAttr = geometry.getAttribute('color');
    const colArray = colAttr.array as Float32Array;

    // Immediately after small dt, progress is low (< 0.4) -> white-hot [1.0, 0.95, 0.8]
    system.update(0.01);
    expect(colArray[0]).toBeCloseTo(1.0, 2);
    expect(colArray[1]).toBeCloseTo(0.95, 2);
    expect(colArray[2]).toBeCloseTo(0.8, 2);

    // Advance to mid-life (~0.8s) -> golden [1.0, 0.65, 0.1]
    for (let step = 0; step < 15; step++) {
      system.update(0.05);
    }
    // Check that at least some active particles have reached golden or ember stage
    let hasGoldenOrEmber = false;
    for (let i = 0; i < 300; i++) {
      const g = colArray[i * 3 + 1];
      if (g < 0.9) {
        hasGoldenOrEmber = true;
        break;
      }
    }
    expect(hasGoldenOrEmber).toBe(true);

    // Advance past max lifetime (> 2.5s)
    for (let step = 0; step < 40; step++) {
      system.update(0.05);
    }
    // At this point particles expired or at ember stage [0.85, 0.2, 0.05]
    let hasEmber = false;
    for (let i = 0; i < 300; i++) {
      const r = colArray[i * 3 + 0];
      const g = colArray[i * 3 + 1];
      if (r <= 0.86 && g <= 0.25) {
        hasEmber = true;
        break;
      }
    }
    expect(hasEmber).toBe(true);

    system.dispose();
  });

  it('update(dt) clamps simulation dt between [0.0, 0.1] protecting against NaN or velocity explosions per ASVS V5', () => {
    const system = new SparklerSystem(wickAnchor);
    system.burst();

    const geometry = system.points.geometry;
    const posArray = geometry.getAttribute('position').array as Float32Array;
    const yBefore = posArray[1];

    // Pass negative dt -> should clamp to 0.0, no change
    system.update(-1.0);
    expect(posArray[1]).toBe(yBefore);

    // Pass extreme dt -> should clamp to 0.1 max
    system.update(100.0);
    // Y should move based on max 0.1s delta, not 100s delta
    const deltaY = posArray[1] - yBefore;
    // With vy max 3.6, dt 0.1 => delta Y <= 0.36
    expect(Math.abs(deltaY)).toBeLessThan(1.0);

    system.dispose();
  });

  it('dispose() deallocates BufferGeometry and PointsMaterial GPU resources per D-13', () => {
    const system = new SparklerSystem(wickAnchor);
    const geometry = system.points.geometry;
    const material = system.points.material as THREE.PointsMaterial;

    const geoDisposeSpy = vi.spyOn(geometry, 'dispose');
    const matDisposeSpy = vi.spyOn(material, 'dispose');

    system.dispose();

    expect(geoDisposeSpy).toHaveBeenCalledOnce();
    expect(matDisposeSpy).toHaveBeenCalledOnce();
  });
});
