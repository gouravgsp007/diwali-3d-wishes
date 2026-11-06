import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { SweetBox } from '../../src/graphics/meshes/sweet-box';

describe('SweetBox 3D Procedural Mithai & Gift Box', () => {
  let sweetBox: SweetBox;

  beforeEach(() => {
    sweetBox = new SweetBox();
  });

  afterEach(() => {
    sweetBox.dispose();
    vi.restoreAllMocks();
  });

  it('constructs procedural royal sweet box with base, lid, inner light, and sweets', () => {
    expect(sweetBox.group).toBeInstanceOf(THREE.Group);
    expect(sweetBox.group.name).toBe('royal-sweet-box');

    // Should have multiple raycast targets (base, lid, laddus, katli)
    const targets = sweetBox.getRaycastTargets();
    expect(targets.length).toBeGreaterThan(5);

    // Initial state is closed
    expect(sweetBox.getIsOpen()).toBe(false);
  });

  it('toggles open and closed states smoothly', () => {
    expect(sweetBox.getIsOpen()).toBe(false);

    // 1. Open box
    const opened = sweetBox.toggle();
    expect(opened).toBe(true);
    expect(sweetBox.getIsOpen()).toBe(true);

    // 2. Calling open() again when already open is a no-op
    sweetBox.open();
    expect(sweetBox.getIsOpen()).toBe(true);

    // 3. Close box
    const closed = sweetBox.toggle();
    expect(closed).toBe(false);
    expect(sweetBox.getIsOpen()).toBe(false);

    // 4. Calling close() again when already closed is a no-op
    sweetBox.close();
    expect(sweetBox.getIsOpen()).toBe(false);
  });

  it('provides raycast targets for direct 3D scene tap interactions', () => {
    const targets = sweetBox.getRaycastTargets();
    targets.forEach((target) => {
      expect(target).toBeInstanceOf(THREE.Object3D);
    });
  });

  it('cleans up and disposes all geometries, materials, and groups on dispose()', () => {
    sweetBox.open();
    sweetBox.dispose();

    expect(sweetBox.group.children.length).toBe(0);
    expect(sweetBox.getRaycastTargets().length).toBe(0);
  });
});
