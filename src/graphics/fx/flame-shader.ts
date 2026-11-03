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

  // Pin base firmly to cotton wick (zero displacement at base uv.y <= 0.05)
  float heightWeight = smoothstep(0.05, 0.9, uv.y);

  // Upward convection noise sampling
  float noiseX = snoise(vec2(pos.x * 5.0, pos.y * 4.0 - uTime * 6.0));
  float noiseZ = snoise(vec2(pos.z * 5.0 + 3.14, pos.y * 4.0 - uTime * 5.5));
  float flutter = sin(uTime * 8.0 + pos.y * 12.0) * 0.035;

  pos.x += (noiseX * 0.045 + flutter) * heightWeight;
  pos.z += (noiseZ * 0.045) * heightWeight;

  pos *= uScale;
  vPosition = pos;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const FLAME_FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;
uniform float uScale;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
  if (uScale <= 0.001) discard;

  float h = vUv.y;
  vec3 colorBlue = vec3(0.114, 0.141, 0.251); // #1d2440 deep indigo base
  vec3 colorAmber = vec3(1.0, 0.533, 0.0);    // #ff8800 golden amber belly
  vec3 colorYellow = vec3(1.0, 0.957, 0.80);  // #fff4cc incandescent yellow tip

  vec3 color;
  if (h < 0.25) {
    color = mix(colorBlue, colorAmber, smoothstep(0.0, 0.25, h));
  } else {
    color = mix(colorAmber, colorYellow, smoothstep(0.25, 0.90, h));
  }

  // Alpha dissolve: soft edge falloff and fade at sharp tip
  float edgeDist = abs(vUv.x - 0.5) * 2.0;
  float alphaEdge = 1.0 - smoothstep(0.4, 0.98, edgeDist);
  float alphaTip = 1.0 - smoothstep(0.75, 1.0, h);
  float alpha = alphaEdge * alphaTip * min(uScale, 1.0);

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
