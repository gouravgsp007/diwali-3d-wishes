import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  createLightingRig,
  computeFlameLightIntensity,
} from '../../../src/graphics/lighting-rig';

describe('Flame PointLight Illumination & Harmonic Jitter', () => {
  it('returns base intensity unchanged when baseIntensity is <= 0.001 (unlit state)', () => {
    expect(computeFlameLightIntensity(0.0001, 1.5)).toBe(0.0001);
    expect(computeFlameLightIntensity(0.0, 10.0)).toBe(0.0);
    expect(computeFlameLightIntensity(0.001, 5.0)).toBe(0.001);
  });

  it('calculates multi-frequency sinusoidal harmonic jitter using 14.0 rad/s and 27.0 rad/s angular frequencies when lit', () => {
    const base = 2.8;
    const t = 1.25;
    const expectedJitter = Math.sin(t * 14.0) * 0.22 + Math.cos(t * 27.0) * 0.12;
    const expectedIntensity = base + expectedJitter;

    const result = computeFlameLightIntensity(base, t);
    expect(result).toBeCloseTo(expectedIntensity, 5);

    // Verify bounded variation within [base - 0.34, base + 0.34] over multiple samples
    for (let time = 0; time < 5; time += 0.25) {
      const val = computeFlameLightIntensity(base, time);
      expect(val).toBeGreaterThanOrEqual(base - 0.34 - 1e-4);
      expect(val).toBeLessThanOrEqual(base + 0.34 + 1e-4);
    }
  });

  it('strictly clamps minimum intensity to >= 0.0 to prevent negative light values (ASVS V5)', () => {
    // If base is 0.1 and jitter could reach -0.34, value must not be negative
    const lowBase = 0.05;
    // Find a time where sin and cos are negative
    for (let time = 0; time < 10; time += 0.1) {
      const val = computeFlameLightIntensity(lowBase, time);
      expect(val).toBeGreaterThanOrEqual(0.0);
    }
  });

  it('positions flamePointLight 0.15 units directly above wickAnchor at (0.0, 0.83, 1.38)', () => {
    const wickAnchor = new THREE.Vector3(0.0, 0.68, 1.38);
    const rig = createLightingRig(wickAnchor);

    expect(rig.flamePointLight.position.x).toBeCloseTo(0.0, 3);
    expect(rig.flamePointLight.position.y).toBeCloseTo(0.68 + 0.15, 3);
    expect(rig.flamePointLight.position.y).toBeCloseTo(0.83, 3);
    expect(rig.flamePointLight.position.z).toBeCloseTo(1.38, 3);
  });

  it('flamePointLight keeps castShadow = false to prevent mobile cubemap render pass thermal collapse', () => {
    const wickAnchor = new THREE.Vector3(0.0, 0.68, 1.38);
    const rig = createLightingRig(wickAnchor);

    expect(rig.flamePointLight.castShadow).toBe(false);
  });
});
