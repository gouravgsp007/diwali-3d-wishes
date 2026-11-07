import * as THREE from 'three';

export interface FlameUniforms {
  uTime: { value: number };
  uScale: { value: number };
  [uniform: string]: THREE.IUniform;
}

export const FLAME_VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform float uScale;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

// Stefan Gustavson 2D Simplex Noise
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vUv = uv;
  vec3 pos = position;

  // Pin base firmly to cotton wick (zero displacement at base uv.y <= 0.06)
  float heightWeight = smoothstep(0.06, 0.95, uv.y);

  // Upward convection noise sampling
  float noiseX = snoise(vec2(pos.x * 4.0, pos.y * 3.5 - uTime * 5.0));
  float noiseZ = snoise(vec2(pos.z * 4.0 + 3.14, pos.y * 3.5 - uTime * 4.8));
  float flutter = sin(uTime * 7.0 + pos.y * 10.0) * 0.025;

  // Gentle convection waft, stronger at flame tip
  pos.x += (noiseX * 0.035 + flutter) * heightWeight;
  pos.z += (noiseZ * 0.035) * heightWeight;

  pos *= uScale;
  vPosition = pos;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vViewPosition = -mvPosition.xyz;
  vNormal = normalMatrix * normal;

  gl_Position = projectionMatrix * mvPosition;
}
`;

export const FLAME_FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;
uniform float uScale;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  if (uScale <= 0.001) discard;

  float h = clamp(vUv.y, 0.0, 1.0);

  // View-independent 3D Fresnel / normal falloff
  vec3 norm = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float nDotV = abs(dot(norm, viewDir));

  // Authentic Color Palette:
  // 1. Oxygen-rich royal blue wick collar (h < 0.12)
  vec3 colorBlue = vec3(0.08, 0.35, 0.98);    // Luminous royal blue
  // 2. Warm Indian saffron-amber mantle (0.12 <= h <= 0.65)
  vec3 colorSaffron = vec3(1.0, 0.45, 0.04); // Vibrant saffron
  vec3 colorAmber = vec3(1.0, 0.75, 0.12);   // Golden amber
  // 3. Incandescent golden-yellow tip (h > 0.65)
  vec3 colorYellow = vec3(1.0, 0.94, 0.40);  // Bright yellow tip
  // 4. White-hot interior core
  vec3 colorWhiteCore = vec3(1.0, 0.99, 0.95);

  vec3 color;
  if (h < 0.12) {
    float blueFactor = smoothstep(0.12, 0.0, h);
    color = mix(colorSaffron, colorBlue, blueFactor * 0.9);
  } else if (h < 0.65) {
    color = mix(colorSaffron, colorAmber, smoothstep(0.12, 0.65, h));
  } else {
    color = mix(colorAmber, colorYellow, smoothstep(0.65, 1.0, h));
  }

  // Additive incandescent center core (strongest when looking directly at flame center)
  float coreIntensity = pow(nDotV, 1.6) * (1.0 - smoothstep(0.65, 0.98, h)) * smoothstep(0.04, 0.20, h);
  color = mix(color, colorWhiteCore, coreIntensity * 0.75);

  // Soft edge dissolve: smooth grazing rim and gentle fade at top tip
  float alphaRim = pow(nDotV, 0.45); // Soft translucent edges
  float alphaTip = 1.0 - smoothstep(0.82, 1.0, h); // Smooth tapered apex fade
  float alpha = alphaRim * alphaTip * min(uScale, 1.0);

  // Base transparency for smooth wick blend
  float baseAlpha = smoothstep(0.0, 0.06, h);
  alpha *= baseAlpha;

  if (alpha < 0.01) discard;
  gl_FragColor = vec4(color, alpha);
}
`;

export function createFlameMaterial(): {
  material: THREE.ShaderMaterial;
  uniforms: FlameUniforms;
} {
  const uniforms: FlameUniforms = {
    uTime: { value: 0.0 },
    uScale: { value: 0.0 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: FLAME_VERTEX_SHADER,
    fragmentShader: FLAME_FRAGMENT_SHADER,
    transparent: true,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return { material, uniforms };
}
