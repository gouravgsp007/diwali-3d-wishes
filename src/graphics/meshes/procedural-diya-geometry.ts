import * as THREE from 'three';

export interface DiyaGeometryResult {
  geometry: THREE.BufferGeometry;
  wickAnchor: THREE.Vector3;
}

/**
 * Creates procedural earthen Diya geometry using LatheGeometry with CPU-displaced
 * pinched pouring spout (+Z axis) and 14-harmonic scalloped rim per D-01, D-02, and D-04.
 */
export function createProceduralDiyaGeometry(): DiyaGeometryResult {
  // 1. Define 2D cross-section profile points (x = radius, y = height)
  // Scale: Diya is ~2.5 units wide (radius ~1.25), height ~0.7
  const profilePoints: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),   // Base center
    new THREE.Vector2(0.5, 0.0),   // Flat bottom edge
    new THREE.Vector2(0.8, 0.1),   // Lower base flare
    new THREE.Vector2(1.2, 0.35),  // Outer bowl bulge
    new THREE.Vector2(1.25, 0.65), // Outer rim lip
    new THREE.Vector2(1.15, 0.70), // Top rim crest
    new THREE.Vector2(1.05, 0.65), // Inner rim lip
    new THREE.Vector2(0.95, 0.30), // Inner bowl wall
    new THREE.Vector2(0.4, 0.15),  // Inner bottom floor
    new THREE.Vector2(0.0, 0.15),  // Inner center floor
  ];

  // 64 segments around circumference ensure smooth spout & scallop definition
  const segments = 64;
  const geometry = new THREE.LatheGeometry(profilePoints, segments);

  const posAttr = geometry.attributes.position;
  const vertex = new THREE.Vector3();

  // Spout configuration (pointing towards +Z axis: targetAngle = Math.PI / 2)
  const spoutAngle = Math.PI / 2;
  const spoutSpread = 0.55; // Angular width of spout (~31 degrees)
  const spoutHeightMin = 0.35;
  const spoutHeightMax = 0.72;
  const spoutStretch = 0.45; // How far the beak pulls forward

  // Scalloped rim configuration
  const numScallops = 14;
  const scallopAmplitude = 0.035;
  const rimHeightMin = 0.58;

  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);

    const angle = Math.atan2(vertex.z, vertex.x);
    let angleDiff = Math.abs(angle - spoutAngle);
    if (angleDiff > Math.PI) {
      angleDiff = Math.PI * 2 - angleDiff;
    }

    // A. Apply pinched spout displacement along +Z
    if (angleDiff < spoutSpread && vertex.y >= spoutHeightMin && vertex.y <= spoutHeightMax) {
      const angularFalloff = Math.cos((angleDiff / spoutSpread) * (Math.PI / 2));
      const heightFactor = (vertex.y - spoutHeightMin) / (spoutHeightMax - spoutHeightMin);
      const push = spoutStretch * angularFalloff * heightFactor;

      vertex.z += push;
      vertex.y += push * 0.15; // Subtle upward tilt of the spout lip
      // Narrow the spout width slightly to create the pinched beak
      vertex.x *= (1.0 - angularFalloff * 0.2);
    }

    // B. Apply decorative scalloped ridges to outer rim outside spout
    if (vertex.y >= rimHeightMin && angleDiff >= spoutSpread * 0.8) {
      const radius = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);
      if (radius > 1.0) {
        const scallop = Math.sin(angle * numScallops) * scallopAmplitude;
        vertex.x += (vertex.x / radius) * scallop;
        vertex.z += (vertex.z / radius) * scallop;
      }
    }

    posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  posAttr.needsUpdate = true;
  geometry.computeVertexNormals();

  // WickAnchor: positioned at the tip of the pinched spout, ready for Phase 3 flame shader (D-04)
  const wickAnchor = new THREE.Vector3(0.0, 0.68, 1.38);

  return { geometry, wickAnchor };
}
