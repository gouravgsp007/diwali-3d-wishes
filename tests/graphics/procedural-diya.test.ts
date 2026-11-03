import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createProceduralDiyaGeometry } from '../../src/graphics/meshes/procedural-diya-geometry';
import { DiyaMesh } from '../../src/graphics/meshes/diya-mesh';
import { loadDiyaModelWithFallback } from '../../src/graphics/meshes/diya-loader';

describe('Procedural Diya Geometry & Mesh', () => {
  it('generates a valid BufferGeometry with position and normal attributes', () => {
    const { geometry, wickAnchor } = createProceduralDiyaGeometry();
    expect(geometry).toBeInstanceOf(THREE.BufferGeometry);
    expect(geometry.getAttribute('position')).toBeDefined();
    expect(geometry.getAttribute('normal')).toBeDefined();
    expect(geometry.getAttribute('position').count).toBeGreaterThan(500);
    expect(wickAnchor).toBeInstanceOf(THREE.Vector3);
  });

  it('displaces vertices at spout angle (+Z axis) pulling the pouring spout forward (>1.5 units)', () => {
    const { geometry } = createProceduralDiyaGeometry();
    const pos = geometry.getAttribute('position');

    let maxZ = -Infinity;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      if (z > maxZ) maxZ = z;
    }

    // Base profile radius max is 1.25. Pinched spout displacement pulls forward to > 1.5 units
    expect(maxZ).toBeGreaterThan(1.5);
  });

  it('applies 14-harmonic sine wave scallop displacements along outer rim lip', () => {
    const { geometry } = createProceduralDiyaGeometry();
    const pos = geometry.getAttribute('position');

    // Collect outer rim vertices away from the spout (e.g. angle around -PI/2 or opposite side)
    const rimDistances: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      // Check top rim height
      if (y >= 0.64 && y <= 0.72) {
        const angle = Math.atan2(z, x);
        // Look in region opposite the spout (spout is at PI/2)
        if (Math.abs(angle - (-Math.PI / 2)) < 0.5) {
          const r = Math.sqrt(x * x + z * z);
          rimDistances.push(r);
        }
      }
    }

    expect(rimDistances.length).toBeGreaterThan(0);
    const minR = Math.min(...rimDistances);
    const maxR = Math.max(...rimDistances);
    // There should be scallop modulation along the rim radius
    expect(maxR - minR).toBeGreaterThan(0.01);
  });

  it('exports normalized WickAnchor coordinate located at (0.0, 0.68, 1.38)', () => {
    const { wickAnchor } = createProceduralDiyaGeometry();
    expect(wickAnchor.x).toBeCloseTo(0.0, 2);
    expect(wickAnchor.y).toBeCloseTo(0.68, 2);
    expect(wickAnchor.z).toBeCloseTo(1.38, 2);
  });

  it('DiyaMesh aggregates bowl mesh, glossy amber oil pool disc, and cotton wick into a single Group', () => {
    const diya = new DiyaMesh();
    expect(diya.group).toBeInstanceOf(THREE.Group);
    expect(diya.group.name).toBe('diya-group');

    // Should contain bowlMesh, oilMesh, wickMesh
    expect(diya.group.children.length).toBe(3);

    const children = diya.group.children as THREE.Mesh[];
    const bowl = children.find(c => (c.material as THREE.MeshStandardMaterial).roughness >= 0.8 && c.castShadow);
    const oil = children.find(c => (c.material as THREE.MeshStandardMaterial).transparent && (c.material as THREE.MeshStandardMaterial).opacity === 0.9);
    const wick = children.find(c => (c.material as THREE.MeshStandardMaterial).color.getHex() === 0x221c16);

    expect(bowl).toBeDefined();
    expect(bowl?.castShadow).toBe(true);

    expect(oil).toBeDefined();
    const oilMat = oil?.material as THREE.MeshStandardMaterial;
    expect(oilMat.roughness).toBeCloseTo(0.06, 2);
    expect(oilMat.opacity).toBe(0.9);
    expect(oil?.receiveShadow).toBe(true);

    expect(wick).toBeDefined();
    expect(wick?.castShadow).toBe(true);

    // WickAnchor matches coordinate
    expect(diya.wickAnchor.x).toBeCloseTo(0.0, 2);
    expect(diya.wickAnchor.y).toBeCloseTo(0.68, 2);
    expect(diya.wickAnchor.z).toBeCloseTo(1.38, 2);
  });

  it('DiyaMesh implements dispose() releasing geometries and materials without throwing', () => {
    const diya = new DiyaMesh();
    expect(() => diya.dispose()).not.toThrow();
  });

  it('loadDiyaModelWithFallback seamlessly returns procedural geometry when /models/diya.glb is absent', async () => {
    const result = await loadDiyaModelWithFallback();
    expect(result.group).toBeInstanceOf(THREE.Group);
    expect(result.wickAnchor.x).toBeCloseTo(0.0, 2);
    expect(result.wickAnchor.y).toBeCloseTo(0.68, 2);
    expect(result.wickAnchor.z).toBeCloseTo(1.38, 2);
    expect(typeof result.dispose).toBe('function');
    expect(() => result.dispose()).not.toThrow();
  });
});
