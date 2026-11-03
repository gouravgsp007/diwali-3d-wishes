import * as THREE from 'three';

export interface LightingRigResult {
  ambientLight: THREE.AmbientLight;
  rimLight: THREE.DirectionalLight;
  flamePointLight: THREE.PointLight;
}

/**
 * Creates the dual-tier festive nocturnal lighting rig with pre-warmed flame PointLight.
 *
 * Implements:
 * - Nocturnal indigo ambient baseline fill (D-10)
 * - Warm golden rim light with optimized 1024x1024 directional shadow map (D-10, D-12)
 * - Pre-warmed unlit flame PointLight at WickAnchor to avoid shader compilation stutters (T-02-04, D-10)
 */
export function createLightingRig(wickAnchor: THREE.Vector3): LightingRigResult {
  // 1. Soft nocturnal indigo ambient baseline
  const ambientLight = new THREE.AmbientLight(0x140c2e, 0.55);

  // 2. Warm golden rim light (top-rear-right)
  const rimLight = new THREE.DirectionalLight(0xffb255, 1.8);
  rimLight.position.set(2.0, 4.5, -2.5);
  rimLight.castShadow = true;

  // Optimized mobile shadow map settings (1024x1024, tight frustum, acne bias)
  rimLight.shadow.mapSize.width = 1024;
  rimLight.shadow.mapSize.height = 1024;
  rimLight.shadow.camera.near = 1.0;
  rimLight.shadow.camera.far = 12.0;
  rimLight.shadow.camera.left = -2.5;
  rimLight.shadow.camera.right = 2.5;
  rimLight.shadow.camera.top = 2.5;
  rimLight.shadow.camera.bottom = -2.5;
  rimLight.shadow.bias = -0.001; // Prevents shadow acne on clay rim

  // 3. Pre-warmed unlit flame light (positioned 0.15 units above wickAnchor per D-05)
  const flamePointLight = new THREE.PointLight(0xff9922, 0.0001, 6.0);
  flamePointLight.position.set(wickAnchor.x, wickAnchor.y + 0.15, wickAnchor.z);
  flamePointLight.castShadow = false; // Point light shadows avoided on mobile for fill-rate safety

  return { ambientLight, rimLight, flamePointLight };
}

/**
 * Calculates organic multi-frequency harmonic flame light flicker.
 * Uses irrational frequency ratio 27/14 (~1.928) for non-repeating candle convection
 * without random noise jumps, clamped to non-negative intensity.
 */
export function computeFlameLightIntensity(baseIntensity: number, elapsedTime: number): number {
  if (baseIntensity <= 0.001) return baseIntensity;
  // Frequencies: 14.0 rad/s (~2.2 Hz) and 27.0 rad/s (~4.3 Hz)
  const jitter = Math.sin(elapsedTime * 14.0) * 0.22 + Math.cos(elapsedTime * 27.0) * 0.12;
  return Math.max(0.0, baseIntensity + jitter);
}
