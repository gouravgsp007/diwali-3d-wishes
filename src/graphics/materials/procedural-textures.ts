import * as THREE from 'three';

export interface BakedClayTextures {
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  colorMap: THREE.CanvasTexture;
}

/**
 * Generates 512x512 procedural micro-porous clay bump, roughness, and color textures
 * using offscreen HTMLCanvasElement instances at boot (<8ms CPU cost, 0 KB network download).
 */
export function generateProceduralClayTextures(): BakedClayTextures {
  const size = 512;

  const canvasBump = document.createElement('canvas');
  canvasBump.width = size;
  canvasBump.height = size;
  const ctxBump = canvasBump.getContext('2d');

  const canvasRough = document.createElement('canvas');
  canvasRough.width = size;
  canvasRough.height = size;
  const ctxRough = canvasRough.getContext('2d');

  const canvasColor = document.createElement('canvas');
  canvasColor.width = size;
  canvasColor.height = size;
  const ctxColor = canvasColor.getContext('2d');

  if (ctxBump && ctxRough && ctxColor) {
    const imgDataBump = ctxBump.createImageData(size, size);
    const imgDataRough = ctxRough.createImageData(size, size);
    const imgDataColor = ctxColor.createImageData(size, size);

    const bumpData = imgDataBump.data;
    const roughData = imgDataRough.data;
    const colorData = imgDataColor.data;

    // Base terracotta RGB: warm Indian red clay (185, 78, 39)
    const baseR = 185;
    const baseG = 78;
    const baseB = 39;

    for (let y = 0; y < size; y++) {
      // Horizontal wheel-thrown pottery striations
      const ringBand = Math.sin(y * 0.18) * 12 + Math.sin(y * 0.45) * 6;

      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;

        // Micro-porous clay grain noise (-18 to +18) centered at mid-gray 128
        const noise = (Math.random() - 0.5) * 36;
        const bumpVal = Math.max(0, Math.min(255, Math.round(128 + ringBand + noise)));

        bumpData[idx] = bumpVal;
        bumpData[idx + 1] = bumpVal;
        bumpData[idx + 2] = bumpVal;
        bumpData[idx + 3] = 255;

        // Matte earthenware roughness: clamped between 195 and 235 (0.75 - 0.92)
        const roughNoise = (Math.random() - 0.5) * 30;
        const roughVal = Math.max(195, Math.min(235, Math.round(215 + roughNoise)));

        roughData[idx] = roughVal;
        roughData[idx + 1] = roughVal;
        roughData[idx + 2] = roughVal;
        roughData[idx + 3] = 255;

        // Base color map with organic color jitter and subtle pottery striation mottling
        const colorJitter = (Math.random() - 0.5) * 14 + ringBand * 0.5;
        colorData[idx] = Math.max(0, Math.min(255, Math.round(baseR + colorJitter)));
        colorData[idx + 1] = Math.max(0, Math.min(255, Math.round(baseG + colorJitter * 0.7)));
        colorData[idx + 2] = Math.max(0, Math.min(255, Math.round(baseB + colorJitter * 0.5)));
        colorData[idx + 3] = 255;
      }
    }

    ctxBump.putImageData(imgDataBump, 0, 0);
    ctxRough.putImageData(imgDataRough, 0, 0);
    ctxColor.putImageData(imgDataColor, 0, 0);
  }

  const bumpMap = new THREE.CanvasTexture(canvasBump);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3, 2);

  const roughnessMap = new THREE.CanvasTexture(canvasRough);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(3, 2);

  const colorMap = new THREE.CanvasTexture(canvasColor);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.RepeatWrapping;
  colorMap.repeat.set(3, 2);

  return { bumpMap, roughnessMap, colorMap };
}

let cachedSparkTexture: THREE.CanvasTexture | null = null;

/**
 * Generates a 64x64 procedural circular Gaussian radial spark texture with an
 * incandescent white core, golden luminous halo, and soft alpha falloff.
 * Cached as a singleton (0 KB network payload, single GPU upload).
 * Eliminates square pixel boxes across all WebGL particle systems.
 */
export function getSparkTexture(): THREE.CanvasTexture {
  if (cachedSparkTexture) {
    return cachedSparkTexture;
  }

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const center = size / 2;
    const radius = size / 2;
    const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');     // Incandescent white core
    grad.addColorStop(0.2, 'rgba(255, 240, 180, 0.95)');    // Brilliant golden white
    grad.addColorStop(0.45, 'rgba(255, 180, 50, 0.65)');    // Warm amber glow
    grad.addColorStop(0.75, 'rgba(255, 90, 15, 0.20)');     // Soft fading ember edge
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');            // Fully transparent border
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  cachedSparkTexture = new THREE.CanvasTexture(canvas);
  cachedSparkTexture.generateMipmaps = false;
  cachedSparkTexture.minFilter = THREE.LinearFilter;
  cachedSparkTexture.magFilter = THREE.LinearFilter;
  cachedSparkTexture.needsUpdate = true;

  return cachedSparkTexture;
}

/**
 * Resets cached spark texture (useful for tests and memory cleanup).
 */
export function resetSparkTextureCache(): void {
  if (cachedSparkTexture) {
    cachedSparkTexture.dispose();
    cachedSparkTexture = null;
  }
}
