import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { Fireworks3D } from '../../../src/graphics/fx/fireworks-3d';

describe('Fireworks3D Particle Engine', () => {
  let scene: THREE.Scene;
  let fireworks: Fireworks3D;

  beforeEach(() => {
    scene = new THREE.Scene();
    fireworks = new Fireworks3D();
    scene.add(fireworks.group);
  });

  afterEach(() => {
    fireworks.dispose();
  });

  it('initializes with points mesh added to group and zero active particles', () => {
    expect(fireworks.group).toBeInstanceOf(THREE.Group);
    expect(fireworks.getActiveParticleCount()).toBe(0);
    expect(fireworks.getFlashLight()).toBeInstanceOf(THREE.PointLight);

    const points = fireworks.group.children.find((c) => c instanceof THREE.Points) as THREE.Points;
    expect(points).toBeDefined();
    const mat = points.material as THREE.PointsMaterial;
    expect(mat.map).toBeDefined();
    expect(mat.blending).toBe(THREE.AdditiveBlending);
    expect(mat.size).toBeCloseTo(0.28, 2);
  });

  it('triggers 3D spherical burst for Swarna Baan (ID 1) with golden willow colors', () => {
    const burstPos = new THREE.Vector3(0, 10, 0);
    fireworks.triggerBurst(burstPos, 1, 200);

    expect(fireworks.getActiveParticleCount()).toBeGreaterThanOrEqual(180);
    expect(fireworks.getFlashLight().intensity).toBeGreaterThan(0);
    expect(fireworks.getFlashLight().position.y).toBeCloseTo(10);
  });

  it('triggers 3D spherical burst for Taramandal (ID 2) and Dhamaaka (ID 3)', () => {
    fireworks.triggerBurst(new THREE.Vector3(-2, 12, 1), 2, 150);
    const count2 = fireworks.getActiveParticleCount();
    expect(count2).toBeGreaterThanOrEqual(140);

    fireworks.triggerBurst(new THREE.Vector3(2, 11, -1), 3, 150);
    const count3 = fireworks.getActiveParticleCount();
    expect(count3).toBeGreaterThan(count2);
  });

  it('emits rocket ascent trailing sparks', () => {
    const trailPos = new THREE.Vector3(0, 4, 0);
    fireworks.emitTrail(trailPos, '#F59E0B', 10);

    expect(fireworks.getActiveParticleCount()).toBeGreaterThanOrEqual(10);
  });

  it('updates particle physics (velocity, drag, gravity, decay) and reduces active count over time', () => {
    fireworks.triggerBurst(new THREE.Vector3(0, 8, 0), 1, 100);
    const initialCount = fireworks.getActiveParticleCount();

    // Advance 0.5s
    fireworks.update(0.5);
    expect(fireworks.getActiveParticleCount()).toBeLessThanOrEqual(initialCount);

    // Flash light should decay over time
    const light = fireworks.getFlashLight();
    expect(light.intensity).toBeLessThan(3.5);

    // Advance 3.0s (particles should decay and be recycled)
    fireworks.update(3.0);
    expect(fireworks.getActiveParticleCount()).toBe(0);
    expect(light.intensity).toBe(0);
  });

  it('cleans up GPU resources safely on dispose()', () => {
    fireworks.triggerBurst(new THREE.Vector3(0, 8, 0), 1, 100);
    fireworks.dispose();

    expect(fireworks.getActiveParticleCount()).toBe(0);
    expect(fireworks.group.children.length).toBe(0);
  });
});
