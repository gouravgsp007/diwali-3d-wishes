import * as THREE from 'three';
import { createFlameMaterial, type FlameUniforms } from './flame-shader';

export class FlameMesh {
  public mesh: THREE.Mesh;
  public uniforms: FlameUniforms;
  public geometry: THREE.ConeGeometry;
  public material: THREE.ShaderMaterial;

  constructor(wickAnchor: THREE.Vector3) {
    const height = 0.45;
    const radius = 0.16;

    // 24 radial segments, 16 height segments, open-ended
    this.geometry = new THREE.ConeGeometry(radius, height, 24, 16, true);

    // Translate geometry upward so local origin (0, 0, 0) is at the cone's base
    this.geometry.translate(0, height / 2, 0);

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
