import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { FlameController } from '../../../src/graphics/fx/flame-controller';

describe('FlameController', () => {
  const wickAnchor = new THREE.Vector3(0.0, 0.68, 1.38);
  let flamePointLight: THREE.PointLight;

  beforeEach(() => {
    TWEEN.removeAll();
    flamePointLight = new THREE.PointLight(0xff9922, 0.0001, 6.0);
  });

  it('groups FlameMesh, GlowHalo, and SparklerSystem into a single THREE.Group per D-12', () => {
    const controller = new FlameController(wickAnchor, flamePointLight);

    expect(controller.group).toBeInstanceOf(THREE.Group);
    expect(controller.group.name).toBe('flame-controller-group');

    // Should contain FlameMesh, GlowHalo sprite, and SparklerSystem points
    const childNames = controller.group.children.map((c) => c.name);
    expect(childNames).toContain('flame-mesh');
    expect(childNames).toContain('glow-halo');
    expect(childNames).toContain('sparkler-particles');

    controller.dispose();
  });

  it('positions flamePointLight 0.15 units directly above wickAnchor per D-05', () => {
    const controller = new FlameController(wickAnchor, flamePointLight);

    expect(flamePointLight.position.x).toBeCloseTo(wickAnchor.x, 3);
    expect(flamePointLight.position.y).toBeCloseTo(wickAnchor.y + 0.15, 3);
    expect(flamePointLight.position.z).toBeCloseTo(wickAnchor.z, 3);

    controller.dispose();
  });

  it('ignite() initiates sparkler burst and tweens flame scale, glow intensity, and point light intensity over 750ms per D-04, D-06, D-11', async () => {
    const controller = new FlameController(wickAnchor, flamePointLight);
    const sparklerSystem = controller.getSparklerSystem();
    const burstSpy = vi.spyOn(sparklerSystem, 'burst');

    expect(controller.isIgnited()).toBe(false);

    const promise = controller.ignite();
    expect(burstSpy).toHaveBeenCalledOnce();
    expect(controller.isIgnited()).toBe(true);

    // Initial values before tween updates
    const flameMesh = controller.getFlameMesh();
    expect(flameMesh.uniforms.uScale.value).toBe(0.0);

    // Advance TWEEN time by 750ms
    const now = performance.now();
    TWEEN.update(now + 375); // Halfway
    expect(flameMesh.uniforms.uScale.value).toBeGreaterThan(0.0);

    TWEEN.update(now + 850); // Past 750ms completion
    await promise;

    expect(flameMesh.uniforms.uScale.value).toBeCloseTo(1.0, 2);
    expect(controller.getBaseLightIntensity()).toBeCloseTo(2.8, 2);

    controller.dispose();
  });

  it('ignite() is idempotent: subsequent calls while lit or igniting return existing promise without double-triggering bursts per D-12', async () => {
    const controller = new FlameController(wickAnchor, flamePointLight);
    const sparklerSystem = controller.getSparklerSystem();
    const burstSpy = vi.spyOn(sparklerSystem, 'burst');

    const promise1 = controller.ignite();
    const promise2 = controller.ignite();

    expect(promise1).toBe(promise2);
    expect(burstSpy).toHaveBeenCalledTimes(1);

    const now = performance.now();
    TWEEN.update(now + 850);
    await promise1;

    // After completed ignition, calling again still returns resolved promise and does not re-burst
    const promise3 = controller.ignite();
    await promise3;
    expect(burstSpy).toHaveBeenCalledTimes(1);

    controller.dispose();
  });

  it('update(dt, elapsedTime) delegates updates to FlameMesh, GlowHalo, SparklerSystem, and applies harmonic PointLight jitter per D-06, D-12', async () => {
    const controller = new FlameController(wickAnchor, flamePointLight);
    const flameMesh = controller.getFlameMesh();
    const glowHalo = controller.getGlowHalo();
    const sparklerSystem = controller.getSparklerSystem();

    const flameMeshSpy = vi.spyOn(flameMesh, 'updateTime');
    const glowHaloSpy = vi.spyOn(glowHalo, 'update');
    const sparklerSpy = vi.spyOn(sparklerSystem, 'update');

    // Run ignite and finish tween so light jitter is active
    const promise = controller.ignite();
    const now = performance.now();
    TWEEN.update(now + 850);
    await promise;

    controller.update(0.016, 2.5);

    expect(flameMeshSpy).toHaveBeenCalledWith(2.5);
    expect(glowHaloSpy).toHaveBeenCalledWith(2.5);
    expect(sparklerSpy).toHaveBeenCalledWith(0.016);

    // Point light intensity should be non-zero and jittered around 2.8
    expect(flamePointLight.intensity).toBeGreaterThan(2.0);
    expect(flamePointLight.intensity).toBeLessThan(3.5);

    controller.dispose();
  });

  it('dispose() cascades deallocation across FlameMesh, GlowHalo, SparklerSystem, and clears group children per D-13', () => {
    const controller = new FlameController(wickAnchor, flamePointLight);
    const flameMesh = controller.getFlameMesh();
    const glowHalo = controller.getGlowHalo();
    const sparklerSystem = controller.getSparklerSystem();

    const flameDisposeSpy = vi.spyOn(flameMesh, 'dispose');
    const haloDisposeSpy = vi.spyOn(glowHalo, 'dispose');
    const sparklerDisposeSpy = vi.spyOn(sparklerSystem, 'dispose');
    const groupClearSpy = vi.spyOn(controller.group, 'clear');

    controller.dispose();

    expect(flameDisposeSpy).toHaveBeenCalledOnce();
    expect(haloDisposeSpy).toHaveBeenCalledOnce();
    expect(sparklerDisposeSpy).toHaveBeenCalledOnce();
    expect(groupClearSpy).toHaveBeenCalledOnce();
    expect(controller.isIgnited()).toBe(false);
  });
});
