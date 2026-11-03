import * as THREE from 'three';
import type { BakedClayTextures } from './procedural-textures';

export interface DiyaMaterialPalette {
  terracotta: THREE.MeshStandardMaterial;
  oilPool: THREE.MeshStandardMaterial;
  wick: THREE.MeshStandardMaterial;
  brassThali: THREE.MeshStandardMaterial;
}

/**
 * Creates strongly typed MeshStandardMaterial instances for the Diya components
 * using baked procedural clay textures and optional brass thali bump texture.
 */
export function createMaterialPalette(
  clayTextures: BakedClayTextures,
  brassBumpTex?: THREE.CanvasTexture
): DiyaMaterialPalette {
  const terracotta = new THREE.MeshStandardMaterial({
    map: clayTextures.colorMap,
    bumpMap: clayTextures.bumpMap,
    bumpScale: 0.035,
    roughnessMap: clayTextures.roughnessMap,
    roughness: 0.85,
    metalness: 0.04,
  });

  const oilPool = new THREE.MeshStandardMaterial({
    color: 0xb5781a, // Golden amber oil
    roughness: 0.06,  // Mirror-gloss liquid
    metalness: 0.15,
    transparent: true,
    opacity: 0.90,
  });

  const wick = new THREE.MeshStandardMaterial({
    color: 0x221c16, // Charred cotton wick tip
    roughness: 0.95,
    metalness: 0.0,
  });

  const brassThali = new THREE.MeshStandardMaterial({
    color: 0x5a461e,    // Rich dark antique brass
    roughness: 0.38,    // Brushed metal finish
    metalness: 0.88,    // Highly metallic
    bumpMap: brassBumpTex ?? null,
    bumpScale: 0.015,
  });

  return { terracotta, oilPool, wick, brassThali };
}
