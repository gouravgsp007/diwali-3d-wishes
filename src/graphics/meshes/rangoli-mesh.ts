import * as THREE from 'three';

/**
 * Creates an ornate sacred golden Rangoli mandala floor under the brass thali.
 *
 * Traditional Diwali Rangoli elements:
 * - 8-pointed geometric yantra star
 * - 16 radiating sacred lotus petals (turmeric yellow & vermillion crimson)
 * - Concentric golden bead rings and festive floral flourishes
 */
export function createRangoliMesh(): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const cx = 512;
    const cy = 512;

    // Clear background
    ctx.clearRect(0, 0, 1024, 1024);

    // 1. Outer radiating halo glow
    const radialGrad = ctx.createRadialGradient(cx, cy, 180, cx, cy, 500);
    radialGrad.addColorStop(0, 'rgba(217, 119, 6, 0.45)');
    radialGrad.addColorStop(0.65, 'rgba(180, 83, 9, 0.25)');
    radialGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radialGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 500, 0, Math.PI * 2);
    ctx.fill();

    // 2. Outer decorative scalloped border
    const petals = 32;
    ctx.strokeStyle = '#f59e0b'; // Amber-500
    ctx.lineWidth = 4;
    for (let i = 0; i < petals; i++) {
      const angle = (i * Math.PI * 2) / petals;
      const px = cx + Math.cos(angle) * 440;
      const py = cy + Math.sin(angle) * 440;
      ctx.beginPath();
      ctx.arc(px, py, 26, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#b91c1c' : '#d97706'; // Crimson / Gold
      ctx.fill();
      ctx.stroke();
    }

    // 3. Middle floral ring (16 Lotus Petals)
    const lotusCount = 16;
    for (let i = 0; i < lotusCount; i++) {
      const angle = (i * Math.PI * 2) / lotusCount;
      const nextAngle = ((i + 1) * Math.PI * 2) / lotusCount;
      const midAngle = (angle + nextAngle) / 2;

      const p1x = cx + Math.cos(angle) * 320;
      const p1y = cy + Math.sin(angle) * 320;
      const tipX = cx + Math.cos(midAngle) * 400;
      const tipY = cy + Math.sin(midAngle) * 400;
      const p2x = cx + Math.cos(nextAngle) * 320;
      const p2y = cy + Math.sin(nextAngle) * 320;

      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.quadraticCurveTo(tipX, tipY, p2x, p2y);
      ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // 4. Sacred concentric gold rings
    const rings = [320, 270, 220, 160];
    rings.forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = idx % 2 === 0 ? '#fbbf24' : '#f59e0b';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Bead dots along the ring
      const dotCount = Math.floor(r / 6);
      for (let j = 0; j < dotCount; j++) {
        const da = (j * Math.PI * 2) / dotCount;
        const dx = cx + Math.cos(da) * r;
        const dy = cy + Math.sin(da) * r;
        ctx.beginPath();
        ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fffbeb';
        ctx.fill();
      }
    });

    // 5. Central 8-pointed star yantra
    const starPoints = 8;
    ctx.beginPath();
    for (let i = 0; i < starPoints * 2; i++) {
      const angle = (i * Math.PI) / starPoints;
      const radius = i % 2 === 0 ? 150 : 80;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#b45309';
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;

  const geometry = new THREE.PlaneGeometry(8.2, 8.2);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    opacity: 0.92,
    roughness: 0.65,
    metalness: 0.25,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'rangoli-floor';
  mesh.rotation.x = -Math.PI / 2; // Flat horizontal plane
  mesh.position.set(0, -0.035, 0); // Directly beneath brass thali
  mesh.receiveShadow = true;

  return mesh;
}
