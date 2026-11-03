import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { CameraRig } from '../../src/graphics/camera-rig';

describe('CameraRig', () => {
  beforeEach(() => {
    TWEEN.removeAll();
  });

  it('sets camera base position to (0, 2.3, 3.8) at ~30° elevated pitch pointing at (0, 0.25, 0) (D-05)', () => {
    const rig = new CameraRig(1920, 1080);

    expect(rig.camera.position.x).toBeCloseTo(0, 2);
    expect(rig.camera.position.y).toBeCloseTo(2.3, 2);
    expect(rig.camera.position.z).toBeCloseTo(3.8, 2);
  });

  it('preserves base 45° FOV for landscape viewports (aspect >= 1.0) (D-08)', () => {
    const rig = new CameraRig(1920, 1080); // aspect = 1.777
    expect(rig.camera.fov).toBeCloseTo(45, 1);

    const squareRig = new CameraRig(800, 800); // aspect = 1.0
    expect(squareRig.camera.fov).toBeCloseTo(45, 1);
  });

  it('dynamically expands vertical FOV for portrait viewports (aspect < 1.0) using mathematical compensation (D-06)', () => {
    // iPhone 14 aspect = 390 / 844 = ~0.462
    const width = 390;
    const height = 844;
    const aspect = width / height;

    const rig = new CameraRig(width, height);

    // Theoretical expected: 2 * Math.atan(Math.tan(22.5 deg) / aspect) in degrees
    const baseFovRad = THREE.MathUtils.degToRad(45);
    const expectedVFovRad = 2 * Math.atan(Math.tan(baseFovRad / 2) / aspect);
    const expectedVFovDeg = THREE.MathUtils.radToDeg(expectedVFovRad);

    expect(rig.camera.fov).toBeCloseTo(expectedVFovDeg, 1);
    expect(rig.camera.fov).toBeGreaterThan(75);
    expect(rig.camera.fov).toBeLessThan(90);
  });

  it('clamps parallax movement within safety bounds (±15° yaw, ±10° pitch) (T-02-01, ASVS V5)', () => {
    const rig = new CameraRig(390, 844);

    // Extreme pointer input far outside [-1, 1]
    rig.onPointerMove(10.0, -10.0);
    rig.update(0.016);

    // Offset in X is Math.sin(clampedYaw) * 2.0 where clampedYaw <= 0.26 rad
    // Offset in Y is Math.sin(clampedPitch) * 1.0 where clampedPitch <= 0.17 rad
    const maxExpectedXOffset = Math.sin(0.26) * 2.0 + 0.1; // with sway
    const maxExpectedYOffset = Math.sin(0.17) * 1.0 + 0.1; // with sway

    expect(Math.abs(rig.camera.position.x)).toBeLessThanOrEqual(maxExpectedXOffset);
    expect(Math.abs(rig.camera.position.y - 2.3)).toBeLessThanOrEqual(maxExpectedYOffset);
  });

  it('handles NaN/undefined pointer input gracefully without propagating invalid numbers (T-02-01)', () => {
    const rig = new CameraRig(390, 844);
    rig.onPointerMove(NaN, undefined as unknown as number);
    rig.update(0.016);

    expect(Number.isNaN(rig.camera.position.x)).toBe(false);
    expect(Number.isNaN(rig.camera.position.y)).toBe(false);
    expect(Number.isNaN(rig.camera.position.z)).toBe(false);
  });

  it('springs back to center upon pointer up event (auto-return) (D-14)', () => {
    const rig = new CameraRig(390, 844);
    rig.onPointerMove(1.0, 1.0);
    rig.update(0.016);
    rig.onPointerUp();

    // After 60 simulation frames with lerp factor 0.08, parallax returns to center
    for (let i = 0; i < 60; i++) {
      rig.update(0.016);
    }

    // Centered around 0 x (within Lissajous sway bounds ±0.08)
    expect(Math.abs(rig.camera.position.x)).toBeLessThan(0.09);
  });

  it('applies gentle Lissajous figure-8 breathing sway over time (D-13)', () => {
    const rig = new CameraRig(1920, 1080);

    const initialX = rig.camera.position.x;
    const initialY = rig.camera.position.y;

    // Advance 1.0 second (where both swayX and swayY are non-zero)
    rig.update(1.0);

    const midCycleX = rig.camera.position.x;
    const midCycleY = rig.camera.position.y;

    // Movement should have occurred due to sway
    expect(midCycleX).not.toBe(initialX);
    expect(midCycleY).not.toBe(initialY);

    // Advance to 8.0 seconds total (full 8s cycle)
    rig.update(7.0);

    // Full 8s cycle of sine waves returns close to origin offset
    expect(rig.camera.position.x).toBeCloseTo(initialX, 2);
    expect(rig.camera.position.y).toBeCloseTo(initialY, 2);
  });

  it('exposes tweened dollyTo and panTargetTo helpers using Tween.js (D-07)', async () => {
    const rig = new CameraRig(1920, 1080);
    const targetPos = new THREE.Vector3(0, 2.0, 3.2);
    const targetLook = new THREE.Vector3(0, 0.65, 0);

    const dollyPromise = rig.dollyTo(targetPos, 500);
    const panPromise = rig.panTargetTo(targetLook, 500);

    // Advance tween engine by current timestamp + duration
    TWEEN.update(performance.now() + 600);

    await Promise.all([dollyPromise, panPromise]);

    expect(rig.camera.position.z).toBeCloseTo(3.2, 1);
  });
});
