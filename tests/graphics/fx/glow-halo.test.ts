import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { GlowHalo } from '../../../src/graphics/fx/glow-halo';

describe('GlowHalo Single-Pass Additive Billboard Sprite', () => {
  it('creates 128x128 offscreen canvas with 5-stop radial gradient and CanvasTexture', () => {
    const flameCenter = new THREE.Vector3(0.0, 0.83, 1.38);
    const halo = new GlowHalo(flameCenter);

    expect(halo.sprite).toBeInstanceOf(THREE.Sprite);
    const mat = halo.sprite.material as THREE.SpriteMaterial;
    expect(mat).toBeInstanceOf(THREE.SpriteMaterial);
    expect(mat.map).toBeInstanceOf(THREE.CanvasTexture);

    const image = mat.map!.image as HTMLCanvasElement;
    expect(image.width).toBe(128);
    expect(image.height).toBe(128);

    halo.dispose();
  });

  it('instantiates THREE.Sprite with THREE.SpriteMaterial, AdditiveBlending, depthWrite false, and golden tint 0xffaa33', () => {
    const flameCenter = new THREE.Vector3(0.0, 0.83, 1.38);
    const halo = new GlowHalo(flameCenter);

    const mat = halo.sprite.material as THREE.SpriteMaterial;
    expect(mat.blending).toBe(THREE.AdditiveBlending);
    expect(mat.depthWrite).toBe(false);
    expect(mat.transparent).toBe(true);
    expect(mat.color.getHex()).toBe(0xffaa33);

    halo.dispose();
  });

  it('positions sprite at provided flameCenter coordinate and initializes scale to unlit size (0.001, 0.001, 1.0)', () => {
    const flameCenter = new THREE.Vector3(0.0, 0.83, 1.38);
    const halo = new GlowHalo(flameCenter);

    expect(halo.sprite.name).toBe('glow-halo');
    expect(halo.sprite.position.x).toBeCloseTo(0.0);
    expect(halo.sprite.position.y).toBeCloseTo(0.83);
    expect(halo.sprite.position.z).toBeCloseTo(1.38);

    expect(halo.sprite.scale.x).toBeCloseTo(0.001);
    expect(halo.sprite.scale.y).toBeCloseTo(0.001);
    expect(halo.sprite.scale.z).toBeCloseTo(1.0);

    halo.dispose();
  });

  it('GlowHalo.setIntensity scales sprite proportionally with baseScale 1.8 clamped between safe bounds (ASVS V5)', () => {
    const flameCenter = new THREE.Vector3(0.0, 0.83, 1.38);
    const halo = new GlowHalo(flameCenter);

    // Normal factor: 1.0 => baseScale * 1.0 = 1.8
    halo.setIntensity(1.0);
    expect(halo.sprite.scale.x).toBeCloseTo(1.8);
    expect(halo.sprite.scale.y).toBeCloseTo(1.8);
    expect(halo.sprite.scale.z).toBeCloseTo(1.0);

    // Half factor: 0.5 => 1.8 * 0.5 = 0.9
    halo.setIntensity(0.5);
    expect(halo.sprite.scale.x).toBeCloseTo(0.9);
    expect(halo.sprite.scale.y).toBeCloseTo(0.9);

    // Upper clamp: 3.0 => clamped to 1.5 => 1.8 * 1.5 = 2.7
    halo.setIntensity(3.0);
    expect(halo.sprite.scale.x).toBeCloseTo(2.7);
    expect(halo.sprite.scale.y).toBeCloseTo(2.7);

    // Lower clamp: -0.5 => clamped to 0.001 => 1.8 * 0.001 = 0.0018
    halo.setIntensity(-0.5);
    expect(halo.sprite.scale.x).toBeCloseTo(0.0018);
    expect(halo.sprite.scale.y).toBeCloseTo(0.0018);

    halo.dispose();
  });

  it('GlowHalo.update applies subtle breathing scale oscillation (+/- 4%) without mutating position', () => {
    const flameCenter = new THREE.Vector3(0.0, 0.83, 1.38);
    const halo = new GlowHalo(flameCenter);

    // When unlit (currentScale <= 0.01), update is a no-op
    halo.setIntensity(0.001);
    const unlitScaleX = halo.sprite.scale.x;
    halo.update(1.0);
    expect(halo.sprite.scale.x).toBe(unlitScaleX);

    // When lit (intensity 1.0, base scale 1.8)
    halo.setIntensity(1.0);
    const baseS = 1.8;

    // Test across several timestamps: breathing breath factor = 1.0 + Math.sin(t * 5.0) * 0.04
    for (let t = 0; t < 3; t += 0.5) {
      halo.update(t);
      const expectedBreath = 1.0 + Math.sin(t * 5.0) * 0.04;
      expect(halo.sprite.scale.x).toBeCloseTo(baseS * expectedBreath, 4);
      expect(halo.sprite.scale.y).toBeCloseTo(baseS * expectedBreath, 4);
      expect(halo.sprite.scale.z).toBe(1.0);
      // Position must remain constant
      expect(halo.sprite.position.x).toBeCloseTo(0.0);
      expect(halo.sprite.position.y).toBeCloseTo(0.83);
      expect(halo.sprite.position.z).toBeCloseTo(1.38);
    }

    halo.dispose();
  });

  it('GlowHalo.dispose cleanly deallocates material and canvas texture GPU memory', () => {
    const flameCenter = new THREE.Vector3(0.0, 0.83, 1.38);
    const halo = new GlowHalo(flameCenter);

    const mat = halo.sprite.material as THREE.SpriteMaterial;
    const tex = mat.map!;

    const matSpy = vi.spyOn(mat, 'dispose');
    const texSpy = vi.spyOn(tex, 'dispose');

    halo.dispose();

    expect(matSpy).toHaveBeenCalledOnce();
    expect(texSpy).toHaveBeenCalledOnce();
  });
});
