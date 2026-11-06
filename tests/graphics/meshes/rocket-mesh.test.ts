import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { RocketStandManager } from '../../../src/graphics/meshes/rocket-mesh';

describe('RocketStandManager (3D In-Scene Rockets)', () => {
  let scene: THREE.Scene;
  let manager: RocketStandManager;

  beforeEach(() => {
    scene = new THREE.Scene();
    manager = new RocketStandManager();
    scene.add(manager.group);
  });

  afterEach(() => {
    manager.dispose();
  });

  it('creates 3 ceremonial rockets with stands and hit proxies', () => {
    expect(manager.group).toBeInstanceOf(THREE.Group);
    expect(manager.getLaunchedCount()).toBe(0);

    const interactiveMeshes = manager.getInteractiveMeshes();
    expect(interactiveMeshes.length).toBe(3);

    // Verify IDs on interactive meshes
    const ids = interactiveMeshes.map((m) => m.userData.rocketId);
    expect(ids).toEqual([1, 2, 3]);
  });

  it('launch(id) begins upward rocket ascent and marks rocket as launched', () => {
    const onDetonateSpy = vi.fn();
    const launched = manager.launch(1, onDetonateSpy);

    expect(launched).toBe(true);
    expect(manager.isLaunched(1)).toBe(true);
    expect(manager.getLaunchedCount()).toBe(1);

    // Duplicate launch on same rocket should return false
    const duplicate = manager.launch(1, onDetonateSpy);
    expect(duplicate).toBe(false);
    expect(manager.getLaunchedCount()).toBe(1);
  });

  it('animates flying rocket and triggers onDetonate callback at peak altitude', () => {
    const onDetonateSpy = vi.fn();
    manager.launch(2, onDetonateSpy);

    // Initial update - ascending
    manager.update(0.3);
    expect(onDetonateSpy).not.toHaveBeenCalled();

    // Advance to peak altitude (~1.2s total flight)
    manager.update(1.2);
    expect(onDetonateSpy).toHaveBeenCalledTimes(1);

    const [detonatePos, rocketId] = onDetonateSpy.mock.calls[0];
    expect(detonatePos).toBeInstanceOf(THREE.Vector3);
    expect(detonatePos.y).toBeGreaterThanOrEqual(8.0);
    expect(rocketId).toBe(2);
  });

  it('emits trailing sparks via callback during flight', () => {
    const trailSpy = vi.fn();
    manager.setOnTrailEmit(trailSpy);

    manager.launch(3);
    manager.update(0.1);

    expect(trailSpy).toHaveBeenCalled();
  });

  it('tracks completion when all 3 rockets are launched and detonated', () => {
    const allDoneSpy = vi.fn();
    manager.setOnAllCompleted(allDoneSpy);

    manager.launch(1);
    manager.launch(2);
    manager.launch(3);
    expect(manager.getLaunchedCount()).toBe(3);

    manager.update(1.8);
    expect(allDoneSpy).toHaveBeenCalledTimes(1);
  });

  it('disposes all geometries and materials safely on dispose()', () => {
    manager.launch(1);
    manager.dispose();

    expect(manager.group.children.length).toBe(0);
    expect(manager.getInteractiveMeshes().length).toBe(0);
  });
});
