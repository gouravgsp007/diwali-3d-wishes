import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import {
  createFlameMaterial,
  FLAME_VERTEX_SHADER,
  FLAME_FRAGMENT_SHADER,
} from '../../../src/graphics/fx/flame-shader';
import { FlameMesh } from '../../../src/graphics/fx/flame-mesh';

describe('FlameShader & FlameMesh', () => {
  it('createFlameMaterial returns ShaderMaterial with transparent true, DoubleSide, AdditiveBlending, depthWrite false, and uniforms uTime and uScale', () => {
    const { material, uniforms } = createFlameMaterial();

    expect(material).toBeInstanceOf(THREE.ShaderMaterial);
    expect(material.transparent).toBe(true);
    expect(material.side).toBe(THREE.DoubleSide);
    expect(material.blending).toBe(THREE.AdditiveBlending);
    expect(material.depthWrite).toBe(false);
    expect(uniforms.uTime).toBeDefined();
    expect(uniforms.uTime.value).toBe(0.0);
    expect(uniforms.uScale).toBeDefined();
    expect(uniforms.uScale.value).toBe(0.0);
  });

  it('Flame vertex shader implements 2D simplex noise convection displacement with smoothstep height attenuation', () => {
    // Inspect vertex shader code properties
    expect(FLAME_VERTEX_SHADER).toContain('snoise');
    expect(FLAME_VERTEX_SHADER).toContain('smoothstep(0.06, 0.95, uv.y)');
    expect(FLAME_VERTEX_SHADER).toContain('uTime * 5.0');
    expect(FLAME_VERTEX_SHADER).toContain('vNormal = normalMatrix * normal');
    expect(FLAME_VERTEX_SHADER).toContain('pos *= uScale');

    // Ensure built-in attributes are not re-declared (prevents GLSL compile errors)
    expect(FLAME_VERTEX_SHADER).not.toMatch(/attribute\s+vec3\s+position/);
    expect(FLAME_VERTEX_SHADER).not.toMatch(/attribute\s+vec2\s+uv/);
    expect(FLAME_VERTEX_SHADER).not.toMatch(/uniform\s+mat4\s+projectionMatrix/);
  });

  it('Flame fragment shader evaluates authentic blue collar, saffron mantle, and view-independent fresnel falloff', () => {
    // Royal blue wick collar base: vec3(0.08, 0.35, 0.98)
    expect(FLAME_FRAGMENT_SHADER).toContain('0.08, 0.35, 0.98');
    // Vibrant Indian saffron mantle: vec3(1.0, 0.45, 0.04)
    expect(FLAME_FRAGMENT_SHADER).toContain('1.0, 0.45, 0.04');
    // Golden amber: vec3(1.0, 0.75, 0.12)
    expect(FLAME_FRAGMENT_SHADER).toContain('1.0, 0.75, 0.12');
    // Incandescent yellow tip: vec3(1.0, 0.94, 0.40)
    expect(FLAME_FRAGMENT_SHADER).toContain('1.0, 0.94, 0.40');

    // View-independent fresnel normal dot product
    expect(FLAME_FRAGMENT_SHADER).toContain('dot(norm, viewDir)');

    // Fragment discards and alpha falloff
    expect(FLAME_FRAGMENT_SHADER).toContain('if (uScale <= 0.001) discard;');
    expect(FLAME_FRAGMENT_SHADER).toContain('if (alpha < 0.01) discard;');
  });

  it('FlameMesh builds authentic teardrop LatheGeometry with base anchored at wick base', () => {
    const wickAnchor = new THREE.Vector3(0.0, 0.68, 1.38);
    const flameMesh = new FlameMesh(wickAnchor);

    expect(flameMesh.geometry).toBeInstanceOf(THREE.LatheGeometry);

    // Verify bounding box: base Y should be ~0.0 and tip Y should be ~0.52
    flameMesh.geometry.computeBoundingBox();
    const bbox = flameMesh.geometry.boundingBox!;
    expect(bbox.min.y).toBeCloseTo(0.0, 2);
    expect(bbox.max.y).toBeCloseTo(0.52, 2);

    flameMesh.dispose();
  });

  it('FlameMesh positions mesh at provided wickAnchor and exposes setScale and updateTime', () => {
    const wickAnchor = new THREE.Vector3(0.0, 0.68, 1.38);
    const flameMesh = new FlameMesh(wickAnchor);

    expect(flameMesh.mesh.name).toBe('flame-mesh');
    expect(flameMesh.mesh.position.x).toBeCloseTo(0.0);
    expect(flameMesh.mesh.position.y).toBeCloseTo(0.68);
    expect(flameMesh.mesh.position.z).toBeCloseTo(1.38);
    expect(flameMesh.mesh.castShadow).toBe(false);
    expect(flameMesh.mesh.receiveShadow).toBe(false);

    // Test setScale and clamping (0.0 to 1.5)
    flameMesh.setScale(0.8);
    expect(flameMesh.uniforms.uScale.value).toBeCloseTo(0.8);

    flameMesh.setScale(2.5); // Clamped to 1.5
    expect(flameMesh.uniforms.uScale.value).toBe(1.5);

    flameMesh.setScale(-0.5); // Clamped to 0.0
    expect(flameMesh.uniforms.uScale.value).toBe(0.0);

    // Test updateTime
    flameMesh.updateTime(2.45);
    expect(flameMesh.uniforms.uTime.value).toBeCloseTo(2.45);

    flameMesh.dispose();
  });

  it('dispose() deallocates geometry and material cleanly', () => {
    const flameMesh = new FlameMesh(new THREE.Vector3());
    const geoSpy = vi.spyOn(flameMesh.geometry, 'dispose');
    const matSpy = vi.spyOn(flameMesh.material, 'dispose');

    flameMesh.dispose();
    expect(geoSpy).toHaveBeenCalled();
    expect(matSpy).toHaveBeenCalled();
  });
});
