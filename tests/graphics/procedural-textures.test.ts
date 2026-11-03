import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { generateProceduralClayTextures } from '../../src/graphics/materials/procedural-textures';
import { createMaterialPalette } from '../../src/graphics/materials/material-palette';

describe('ProceduralTextures & MaterialPalette', () => {
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;
  let putImageDataSpy: ReturnType<typeof vi.fn>;
  let createdImageDataList: ImageData[];

  beforeEach(() => {
    createdImageDataList = [];
    putImageDataSpy = vi.fn();
    originalGetContext = HTMLCanvasElement.prototype.getContext;

    // Provide mock 2D canvas context for happy-dom / test environment
    HTMLCanvasElement.prototype.getContext = function (type: string) {
      if (type === '2d') {
        return {
          createImageData: (w: number, h: number) => {
            const imgData = {
              width: w,
              height: h,
              data: new Uint8ClampedArray(w * h * 4),
            } as unknown as ImageData;
            createdImageDataList.push(imgData);
            return imgData;
          },
          putImageData: putImageDataSpy,
        } as unknown as CanvasRenderingContext2D;
      }
      return null;
    } as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it('generates 512x512 bump, roughness, and color CanvasTexture instances with RepeatWrapping', () => {
    const textures = generateProceduralClayTextures();

    // Verify all 3 maps exist and are CanvasTextures
    expect(textures.bumpMap).toBeInstanceOf(THREE.CanvasTexture);
    expect(textures.roughnessMap).toBeInstanceOf(THREE.CanvasTexture);
    expect(textures.colorMap).toBeInstanceOf(THREE.CanvasTexture);

    // Verify canvas dimensions
    const bumpCanvas = textures.bumpMap.image as HTMLCanvasElement;
    const roughCanvas = textures.roughnessMap.image as HTMLCanvasElement;
    const colorCanvas = textures.colorMap.image as HTMLCanvasElement;

    expect(bumpCanvas.width).toBe(512);
    expect(bumpCanvas.height).toBe(512);
    expect(roughCanvas.width).toBe(512);
    expect(roughCanvas.height).toBe(512);
    expect(colorCanvas.width).toBe(512);
    expect(colorCanvas.height).toBe(512);

    // Verify RepeatWrapping and repeat factor (3, 2)
    expect(textures.bumpMap.wrapS).toBe(THREE.RepeatWrapping);
    expect(textures.bumpMap.wrapT).toBe(THREE.RepeatWrapping);
    expect(textures.bumpMap.repeat.x).toBe(3);
    expect(textures.bumpMap.repeat.y).toBe(2);

    expect(textures.roughnessMap.wrapS).toBe(THREE.RepeatWrapping);
    expect(textures.roughnessMap.wrapT).toBe(THREE.RepeatWrapping);
    expect(textures.roughnessMap.repeat.x).toBe(3);
    expect(textures.roughnessMap.repeat.y).toBe(2);

    expect(textures.colorMap.wrapS).toBe(THREE.RepeatWrapping);
    expect(textures.colorMap.wrapT).toBe(THREE.RepeatWrapping);
    expect(textures.colorMap.repeat.x).toBe(3);
    expect(textures.colorMap.repeat.y).toBe(2);

    // Verify SRGBColorSpace on color map
    expect(textures.colorMap.colorSpace).toBe(THREE.SRGBColorSpace);
  });

  it('populates pixel data for bump, roughness, and color with appropriate ranges', () => {
    generateProceduralClayTextures();

    expect(putImageDataSpy).toHaveBeenCalledTimes(3);
    expect(createdImageDataList.length).toBe(3);

    const [bumpImg, roughImg, colorImg] = createdImageDataList;

    // Check samples of bump data (grayscale, alpha 255)
    expect(bumpImg.data[3]).toBe(255); // Alpha
    expect(bumpImg.data[0]).toBe(bumpImg.data[1]); // R == G == B
    expect(bumpImg.data[1]).toBe(bumpImg.data[2]);

    // Check roughness data (earthenware 195 - 235)
    const roughVal = roughImg.data[0];
    expect(roughVal).toBeGreaterThanOrEqual(195);
    expect(roughVal).toBeLessThanOrEqual(235);
    expect(roughImg.data[3]).toBe(255);

    // Check color data (warm Indian red clay base ~ 185, 78, 39)
    const r = colorImg.data[0];
    const g = colorImg.data[1];
    const b = colorImg.data[2];
    expect(r).toBeGreaterThan(150);
    expect(g).toBeGreaterThan(50);
    expect(b).toBeGreaterThan(20);
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b);
  });

  it('createMaterialPalette returns strongly typed MeshStandardMaterial instances', () => {
    const textures = generateProceduralClayTextures();
    const mockBrassBump = new THREE.CanvasTexture(document.createElement('canvas'));

    const palette = createMaterialPalette(textures, mockBrassBump);

    expect(palette.terracotta).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(palette.oilPool).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(palette.wick).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(palette.brassThali).toBeInstanceOf(THREE.MeshStandardMaterial);

    // Terracotta checks
    expect(palette.terracotta.map).toBe(textures.colorMap);
    expect(palette.terracotta.bumpMap).toBe(textures.bumpMap);
    expect(palette.terracotta.bumpScale).toBe(0.035);
    expect(palette.terracotta.roughness).toBe(0.85);

    // Oil pool checks
    expect(palette.oilPool.transparent).toBe(true);
    expect(palette.oilPool.opacity).toBe(0.9);
    expect(palette.oilPool.roughness).toBe(0.06);

    // Wick checks
    expect(palette.wick.roughness).toBe(0.95);

    // Brass thali checks
    expect(palette.brassThali.metalness).toBe(0.88);
    expect(palette.brassThali.bumpMap).toBe(mockBrassBump);
  });
});
