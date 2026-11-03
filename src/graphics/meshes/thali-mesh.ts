import * as THREE from 'three';

/**
 * Creates the circular dark antique brass thali platter with concentric radial engravings
 * positioned directly beneath the Diya to receive real-time soft shadows (D-09, D-12).
 */
export function createBrassThaliMesh(): THREE.Mesh {
  // Circular thali platter (radius 2.35, height 0.10 with raised outer decorative lip)
  const platterPoints: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),   // Center bottom
    new THREE.Vector2(2.1, 0.0),   // Flat floor of thali
    new THREE.Vector2(2.25, 0.05), // Angled outer wall
    new THREE.Vector2(2.35, 0.10), // Raised decorative lip
    new THREE.Vector2(2.30, 0.11), // Upper edge
    new THREE.Vector2(2.20, 0.03), // Bottom outer edge
    new THREE.Vector2(0.0, -0.01), // Bottom center
  ];

  const geometry = new THREE.LatheGeometry(platterPoints, 64);

  // Generate subtle concentric radial engraving bump map on canvas
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    // Concentric decorative circles
    ctx.strokeStyle = '#a0a0a0';
    ctx.lineWidth = 3;
    for (let r = 40; r < 240; r += 25) {
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  const bumpTex = new THREE.CanvasTexture(canvas);

  const brassMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a461e,    // Rich dark antique brass
    roughness: 0.38,    // Brushed metal finish
    metalness: 0.88,    // Highly metallic
    bumpMap: bumpTex,
    bumpScale: 0.015,
  });

  const mesh = new THREE.Mesh(geometry, brassMaterial);
  mesh.name = 'brass-thali';
  mesh.position.set(0, -0.02, 0); // Positioned directly beneath Diya
  mesh.receiveShadow = true;
  mesh.castShadow = false;

  return mesh;
}
