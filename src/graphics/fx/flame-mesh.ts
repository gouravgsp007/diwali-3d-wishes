import * as THREE from 'three';
import { createFlameMaterial, type FlameUniforms } from './flame-shader';

export class FlameMesh {
  public mesh: THREE.Mesh;
  public uniforms: FlameUniforms;
  public geometry: THREE.BufferGeometry;
  public material: THREE.ShaderMaterial;

  constructor(wickAnchor: THREE.Vector3) {
    const totalHeight = 0.52;
    const segments = 24;
    const profilePoints: THREE.Vector2[] = [];

    // Authentic Indian Diya teardrop flame profile:
    // Tight collar at wick base, bulbous glowing belly at ~35% height, tapering to a sharp apex.
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = t * totalHeight;
      const r = t === 0 ? 0.02 : (0.175 * Math.sin(Math.PI * Math.pow(t, 0.62)) * (1.0 - 0.45 * t));
      profilePoints.push(new THREE.Vector2(Math.max(0, r), y));
    }

    // 32 radial segments for a silky-smooth 3D revolution
    this.geometry = new THREE.LatheGeometry(profilePoints, 32);

    const { material, uniforms } = createFlameMaterial();
    this.material = material;
    this.uniforms = uniforms;

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.name = 'flame-mesh';
    this.mesh.position.copy(wickAnchor);
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
  }

  public setScale(scale: number): void {
    this.uniforms.uScale.value = Math.max(0.0, Math.min(scale, 1.5));
  }

  public updateTime(elapsedTime: number): void {
    this.uniforms.uTime.value = elapsedTime;
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
