# Phase 3: Procedural GLSL Flame Shader, Additive Bloom & Particle FX - Pattern Map

**Mapped:** 2026-11-04  
**Files analyzed:** 12 (7 source files, 5 test suites)  
**Analogs found:** 12 / 12 (100% codebase pattern coverage)  

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/graphics/fx/flame-shader.ts` | utility | transform | `src/graphics/materials/material-palette.ts` & `src/graphics/materials/procedural-textures.ts` | role-match |
| `src/graphics/fx/flame-mesh.ts` | component | transform | `src/graphics/meshes/diya-mesh.ts` | exact |
| `src/graphics/fx/glow-halo.ts` | component | transform / event-driven | `src/graphics/particles/bokeh-motes.ts` | exact |
| `src/graphics/fx/sparkler-system.ts` | component | batch / streaming | `src/graphics/particles/bokeh-motes.ts` | exact |
| `src/graphics/fx/flame-controller.ts` | controller | event-driven | `src/graphics/scene-manager.ts` & `src/graphics/camera-rig.ts` | exact |
| `src/graphics/lighting-rig.ts` *(modified)* | component | transform / request-response | `src/graphics/lighting-rig.ts` *(self)* | exact |
| `src/graphics/scene-manager.ts` *(modified)* | controller | event-driven / transform | `src/graphics/scene-manager.ts` *(self)* | exact |
| `tests/graphics/flame-shader.test.ts` | test | request-response | `tests/graphics/procedural-diya.test.ts` | exact |
| `tests/graphics/flame-lighting.test.ts` | test | request-response | `tests/graphics/lighting-and-particles.test.ts` | exact |
| `tests/graphics/glow-halo.test.ts` | test | request-response | `tests/graphics/lighting-and-particles.test.ts` | exact |
| `tests/graphics/sparkler-particles.test.ts` | test | batch / request-response | `tests/graphics/lighting-and-particles.test.ts` | exact |
| `tests/graphics/flame-controller.test.ts` | test | event-driven | `tests/graphics/scene-manager.test.ts` & `tests/graphics/camera-rig.test.ts` | exact |

---

## Pattern Assignments

### 1. `src/graphics/fx/flame-shader.ts` (utility, transform)

Creates GLSL vertex and fragment shaders and instantiates `THREE.ShaderMaterial` with 2D simplex noise vertex displacement, height-based anchor pinning, vertical UV color gradient, and `uTime`/`uScale` uniforms.

**Analog:** `src/graphics/materials/material-palette.ts` (lines 1–51) and `src/graphics/materials/procedural-textures.ts` (lines 1–101)

**Imports pattern:**
```typescript
// From src/graphics/materials/material-palette.ts (lines 1-3)
import * as THREE from 'three';
```

**ShaderMaterial factory pattern:**
```typescript
// Pattern adapted from src/graphics/materials/material-palette.ts (lines 15-51)
export interface FlameUniforms {
  uTime: { value: number };
  uScale: { value: number };
}

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
```

**GLSL shader pattern (Anchor Pinning & Gradient Dissolve):**
```glsl
// Vertex Shader: Stefan Gustavson 2D Simplex Noise with smoothstep height pinning
uniform float uTime;
uniform float uScale;

varying vec2 vUv;
varying vec3 vPosition;

// Stefan Gustavson snoise(vec2) function here...

void main() {
  vUv = uv;
  vec3 pos = position;

  // Pin base firmly to cotton wick (zero displacement at base uv.y <= 0.05)
  float heightWeight = smoothstep(0.05, 0.9, uv.y);
  
  float noiseX = snoise(vec2(pos.x * 5.0, pos.y * 4.0 - uTime * 6.0));
  float noiseZ = snoise(vec2(pos.z * 5.0 + 3.14, pos.y * 4.0 - uTime * 5.5));
  float flutter = sin(uTime * 8.0 + pos.y * 12.0) * 0.035;

  pos.x += (noiseX * 0.045 + flutter) * heightWeight;
  pos.z += (noiseZ * 0.045) * heightWeight;
  
  pos *= uScale;
  vPosition = pos;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

```glsl
// Fragment Shader: Indigo Base -> Golden Amber Belly -> Incandescent Yellow Tip
uniform float uTime;
uniform float uScale;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
  if (uScale <= 0.001) discard;

  float h = vUv.y;
  vec3 colorBlue = vec3(0.114, 0.141, 0.251); // #1d2440
  vec3 colorAmber = vec3(1.0, 0.533, 0.0);    // #ff8800
  vec3 colorYellow = vec3(1.0, 0.957, 0.80);  // #fff4cc

  vec3 color;
  if (h < 0.25) {
    color = mix(colorBlue, colorAmber, smoothstep(0.0, 0.25, h));
  } else {
    color = mix(colorAmber, colorYellow, smoothstep(0.25, 0.90, h));
  }

  float edgeDist = abs(vUv.x - 0.5) * 2.0;
  float alphaEdge = 1.0 - smoothstep(0.4, 0.98, edgeDist);
  float alphaTip = 1.0 - smoothstep(0.75, 1.0, h);
  float alpha = alphaEdge * alphaTip * min(uScale, 1.0);

  if (alpha < 0.01) discard;
  gl_FragColor = vec4(color, alpha);
}
```

**Critical Pitfall Avoidance:**
- Do NOT declare standard Three.js attributes (`attribute vec3 position;`, `attribute vec2 uv;`) or standard transformation matrices (`projectionMatrix`, `modelViewMatrix`). Three.js `ShaderMaterial` automatically prepends these declarations; redefining them triggers WebGL compile errors.

---

### 2. `src/graphics/fx/flame-mesh.ts` (component, transform)

Builds the teardrop geometry (`THREE.ConeGeometry`), anchors it atop `wickAnchor` `(0.0, 0.68, 1.38)`, applies `THREE.ShaderMaterial`, and provides clean GPU disposal.

**Analog:** `src/graphics/meshes/diya-mesh.ts` (lines 11–99)

**Imports pattern:**
```typescript
// From src/graphics/meshes/diya-mesh.ts (lines 1-3)
import * as THREE from 'three';
import { createFlameMaterial, type FlameUniforms } from './flame-shader';
```

**Teardrop mesh assembly and anchor positioning:**
```typescript
// Adapted from src/graphics/meshes/diya-mesh.ts (lines 11-40)
export class FlameMesh {
  public mesh: THREE.Mesh;
  public uniforms: FlameUniforms;
  private geometry: THREE.ConeGeometry;
  private material: THREE.ShaderMaterial;

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
```

---

### 3. `src/graphics/fx/glow-halo.ts` (component, transform / event-driven)

Procedural 128x128 radial gradient canvas texture mapped onto camera-facing `THREE.Sprite` with `THREE.AdditiveBlending`, delivering bloom aesthetics with zero multi-pass FBO post-processing overhead.

**Analog:** `src/graphics/particles/bokeh-motes.ts` (lines 36–62, 89–100)

**Imports pattern:**
```typescript
import * as THREE from 'three';
```

**Offscreen CanvasTexture & Sprite creation:**
```typescript
// Adapted from src/graphics/particles/bokeh-motes.ts (lines 36-62)
export class GlowHalo {
  public sprite: THREE.Sprite;
  private texture: THREE.CanvasTexture | null = null;
  private material: THREE.SpriteMaterial;
  private baseScale = 1.8;
  private currentScale = 0.001;

  constructor(flameCenter: THREE.Vector3) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0.0, 'rgba(255, 250, 220, 1.0)'); // Incandescent core
      grad.addColorStop(0.2, 'rgba(255, 170, 34, 0.85)'); // Golden amber
      grad.addColorStop(0.5, 'rgba(255, 100, 10, 0.35)'); // Warm orange aura
      grad.addColorStop(0.8, 'rgba(180, 40, 5, 0.08)');   // Deep nocturnal glow
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');       // Fully transparent edge
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }

    this.texture = new THREE.CanvasTexture(canvas);

    this.material = new THREE.SpriteMaterial({
      map: this.texture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      color: 0xffaa33,
    });

    this.sprite = new THREE.Sprite(this.material);
    this.sprite.name = 'glow-halo';
    this.sprite.position.copy(flameCenter);
    this.sprite.scale.set(0.001, 0.001, 1.0); // Initially unlit
  }

  public setIntensity(factor: number): void {
    this.currentScale = this.baseScale * Math.max(0.001, Math.min(factor, 1.5));
    this.sprite.scale.set(this.currentScale, this.currentScale, 1.0);
  }

  public update(elapsedTime: number): void {
    if (this.currentScale <= 0.01) return;
    // Subtle breathing pulse (+/- 4%)
    const breath = 1.0 + Math.sin(elapsedTime * 5.0) * 0.04;
    const s = this.currentScale * breath;
    this.sprite.scale.set(s, s, 1.0);
  }

  public dispose(): void {
    this.material.dispose();
    if (this.texture) {
      this.texture.dispose();
      this.texture = null;
    }
  }
}
```

---

### 4. `src/graphics/fx/sparkler-system.ts` (component, batch / streaming)

Manages 300 sparkler particles (*phuljhadi*) in a single `THREE.BufferGeometry` with `THREE.Points` (1 draw call). Evaluates CPU Euler kinematics (radial initial velocities, gravity $g = -4.5$, drag $0.92$) in pre-allocated `Float32Array` buffers with zero garbage collection overhead.

**Analog:** `src/graphics/particles/bokeh-motes.ts` (lines 11–35, 67–100)

**Imports pattern:**
```typescript
import * as THREE from 'three';
```

**Single-buffer particle system & kinematics update:**
```typescript
// Adapted from src/graphics/particles/bokeh-motes.ts (lines 11-35, 67-84)
export class SparklerSystem {
  public points: THREE.Points;
  private particleCount = 300;
  private positions: Float32Array;
  private colors: Float32Array;
  private velocities: Float32Array;
  private lifetimes: Float32Array;
  private maxLifetimes: Float32Array;
  private wickAnchor: THREE.Vector3;

  constructor(wickAnchor: THREE.Vector3) {
    this.wickAnchor = wickAnchor.clone();
    const geo = new THREE.BufferGeometry();

    this.positions = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.lifetimes = new Float32Array(this.particleCount);
    this.maxLifetimes = new Float32Array(this.particleCount);

    // Initial state: all inactive at wick anchor
    for (let i = 0; i < this.particleCount; i++) {
      this.positions[i * 3 + 0] = wickAnchor.x;
      this.positions[i * 3 + 1] = wickAnchor.y;
      this.positions[i * 3 + 2] = wickAnchor.z;
      this.lifetimes[i] = 0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.075,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    });

    this.points = new THREE.Points(geo, mat);
    this.points.name = 'sparkler-particles';
  }

  public burst(): void {
    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      this.positions[idx + 0] = this.wickAnchor.x + (Math.random() - 0.5) * 0.04;
      this.positions[idx + 1] = this.wickAnchor.y + 0.05;
      this.positions[idx + 2] = this.wickAnchor.z + (Math.random() - 0.5) * 0.04;

      const angle = Math.random() * Math.PI * 2;
      const speedHoriz = 0.6 + Math.random() * 1.2;
      this.velocities[idx + 0] = Math.cos(angle) * speedHoriz;
      this.velocities[idx + 1] = 1.8 + Math.random() * 1.8; // Erupting upward
      this.velocities[idx + 2] = Math.sin(angle) * speedHoriz;

      const lifespan = 1.0 + Math.random() * 1.0;
      this.lifetimes[i] = lifespan;
      this.maxLifetimes[i] = lifespan;
    }
  }

  public update(dt: number): void {
    const posAttr = this.points.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.points.geometry.attributes.color as THREE.BufferAttribute;

    for (let i = 0; i < this.particleCount; i++) {
      if (this.lifetimes[i] <= 0) continue;
      this.lifetimes[i] -= dt;

      const idx = i * 3;
      this.velocities[idx + 1] += -4.5 * dt; // Gravity
      this.velocities[idx + 0] *= Math.pow(0.92, dt * 60);
      this.velocities[idx + 2] *= Math.pow(0.92, dt * 60);

      this.positions[idx + 0] += this.velocities[idx + 0] * dt;
      this.positions[idx + 1] += this.velocities[idx + 1] * dt;
      this.positions[idx + 2] += this.velocities[idx + 2] * dt;

      // Color fade: White-hot -> Gold -> Red
      const progress = 1.0 - Math.max(0, this.lifetimes[i] / this.maxLifetimes[i]);
      if (progress < 0.4) {
        this.colors[idx + 0] = 1.0;
        this.colors[idx + 1] = 0.95;
        this.colors[idx + 2] = 0.8;
      } else if (progress < 0.8) {
        this.colors[idx + 0] = 1.0;
        this.colors[idx + 1] = 0.65;
        this.colors[idx + 2] = 0.1;
      } else {
        this.colors[idx + 0] = 0.85;
        this.colors[idx + 1] = 0.2;
        this.colors[idx + 2] = 0.05;
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  public dispose(): void {
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
```

---

### 5. `src/graphics/fx/flame-controller.ts` (controller, event-driven)

Top-level orchestrator encapsulating `FlameMesh`, `GlowHalo`, `SparklerSystem`, and `flamePointLight`. Coordinates the ignition sequence with `@tweenjs/tween.js`, drives per-frame harmonic jitter, and guarantees full GPU resource disposal.

**Analog:** `src/graphics/scene-manager.ts` (lines 25–45, 134–179, 308–338) and `src/graphics/camera-rig.ts` (lines 110–125)

**Imports pattern:**
```typescript
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { FlameMesh } from './flame-mesh';
import { GlowHalo } from './glow-halo';
import { SparklerSystem } from './sparkler-system';
import { computeFlameLightIntensity } from '../lighting-rig';
```

**Controller orchestration & tweening pattern:**
```typescript
// Adapted from src/graphics/camera-rig.ts (lines 110-125) & src/graphics/scene-manager.ts
export class FlameController {
  public group: THREE.Group;
  private flameMesh: FlameMesh;
  private glowHalo: GlowHalo;
  private sparklerSystem: SparklerSystem;
  private flamePointLight: THREE.PointLight;
  private isLit = false;
  private baseLightIntensity = 0.0001;

  constructor(wickAnchor: THREE.Vector3, flamePointLight: THREE.PointLight) {
    this.group = new THREE.Group();
    this.group.name = 'flame-controller-group';

    this.flamePointLight = flamePointLight;
    // Align light 0.15 units above wick anchor
    this.flamePointLight.position.set(wickAnchor.x, wickAnchor.y + 0.15, wickAnchor.z);

    // 1. Flame Mesh
    this.flameMesh = new FlameMesh(wickAnchor);
    this.group.add(this.flameMesh.mesh);

    // 2. Glow Halo centered around flame belly (~0.2 units above wick)
    const haloPos = new THREE.Vector3(wickAnchor.x, wickAnchor.y + 0.20, wickAnchor.z);
    this.glowHalo = new GlowHalo(haloPos);
    this.group.add(this.glowHalo.sprite);

    // 3. Sparkler System
    this.sparklerSystem = new SparklerSystem(wickAnchor);
    this.group.add(this.sparklerSystem.points);
  }

  public ignite(): Promise<void> {
    if (this.isLit) return Promise.resolve();
    this.isLit = true;

    // Trigger sparkler celebratory fountain burst immediately
    this.sparklerSystem.burst();

    return new Promise((resolve) => {
      const animState = { scale: 0.0, lightIntensity: 0.0001, haloIntensity: 0.001 };

      new TWEEN.Tween(animState)
        .to({ scale: 1.0, lightIntensity: 2.8, haloIntensity: 1.0 }, 750)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate(() => {
          this.flameMesh.setScale(animState.scale);
          this.glowHalo.setIntensity(animState.haloIntensity);
          this.baseLightIntensity = animState.lightIntensity;
        })
        .onComplete(() => resolve())
        .start();
    });
  }

  public update(dt: number, elapsedTime: number): void {
    // ASVS V5 input bounds check: clamp dt to prevent physics explosion on frame stutter
    const safeDt = Math.min(Math.max(dt, 0.0), 0.1);

    this.flameMesh.updateTime(elapsedTime);
    this.glowHalo.update(elapsedTime);
    this.sparklerSystem.update(safeDt);

    // Apply harmonic jitter to PointLight
    if (this.baseLightIntensity > 0.01) {
      this.flamePointLight.intensity = computeFlameLightIntensity(this.baseLightIntensity, elapsedTime);
    }
  }

  public dispose(): void {
    this.flameMesh.dispose();
    this.glowHalo.dispose();
    this.sparklerSystem.dispose();
    this.group.clear();
  }
}
```

---

### 6. `src/graphics/lighting-rig.ts` (component, transform / request-response)

Enhanced with `computeFlameLightIntensity` pure helper and positioned at `(0.0, 0.83, 1.38)` (0.15 above `wickAnchor`).

**Analog:** `src/graphics/lighting-rig.ts` (lines 38–41)

**Harmonic jitter function export:**
```typescript
// To add to src/graphics/lighting-rig.ts
/**
 * Calculates dynamic flame flicker using two incommensurate sine/cosine frequencies
 * (14.0 rad/s and 27.0 rad/s) producing organic non-repeating candle convection.
 */
export function computeFlameLightIntensity(baseIntensity: number, elapsedTime: number): number {
  if (baseIntensity <= 0.001) return baseIntensity;
  const jitter = Math.sin(elapsedTime * 14.0) * 0.22 + Math.cos(elapsedTime * 27.0) * 0.12;
  return Math.max(0.0, baseIntensity + jitter);
}
```

---

### 7. `src/graphics/scene-manager.ts` (controller, event-driven / transform)

Integrates `FlameController` into scene instantiation, per-frame RAF loop, FSM state listener (`IGNITING`), and WebGL context restoration/disposal.

**Analog:** `src/graphics/scene-manager.ts` (lines 134–153, 157–179, 184–192, 308–338)

**Integration pattern:**
```typescript
// 1. Property addition:
private flameController: FlameController | null = null;

// 2. In buildSceneComponents() (lines 134-153):
if (this.diyaMesh && this.lightingRig) {
  this.flameController = new FlameController(this.diyaMesh.wickAnchor, this.lightingRig.flamePointLight);
  this.scene.add(this.flameController.group);
}

// 3. In render() loop (lines 157-179):
if (this.flameController) {
  this.flameController.update(dt, this.elapsedTime);
}

// 4. In handleStateChange(state) (lines 184-192):
if (state === 'IGNITING') {
  this.cameraRig?.panTargetTo(new THREE.Vector3(0, 0.65, 0), 1000);
  this.flameController?.ignite().then(() => {
    this.fsm?.transition({ type: 'IGNITION_COMPLETE' });
  });
}

// 5. In disposeSceneComponents() (lines 308-338):
if (this.flameController) {
  this.scene.remove(this.flameController.group);
  this.flameController.dispose();
  this.flameController = null;
}
```

---

### 8. Graphics Test Suites (`tests/graphics/*.test.ts`)

Unit and integration tests for GLSL shader uniforms, dynamic lighting flicker, additive glow sprite, sparkler particle physics, and state transitions.

**Analog:** `tests/graphics/lighting-and-particles.test.ts` (lines 1–81), `tests/graphics/scene-manager.test.ts` (lines 1–175), and `tests/graphics/camera-rig.test.ts` (lines 1–125)

**Test suite pattern:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

describe('VFX Test Suite', () => {
  beforeEach(() => {
    TWEEN.removeAll();
  });

  it('validates component instantiation, attributes, and AdditiveBlending', () => {
    // Assert geometry attributes, blending modes, and dispose() methods
  });
});
```

---

## Shared Patterns

### 1. WebGL & GPU Resource Lifecycle Management (`dispose()`)
**Source:** `src/graphics/particles/bokeh-motes.ts` (lines 89–100), `src/graphics/meshes/diya-mesh.ts` (lines 77–98)  
**Apply to:** All FX components (`FlameMesh`, `GlowHalo`, `SparklerSystem`, `FlameController`, `SceneManager`)  
```typescript
public dispose(): void {
  this.geometry.dispose();
  if (Array.isArray(this.material)) {
    this.material.forEach((m) => m.dispose());
  } else {
    this.material.dispose();
  }
  if (this.texture) {
    this.texture.dispose();
    this.texture = null;
  }
}
```

### 2. ASVS V5 Input Sanitization & NaN Protection
**Source:** `src/graphics/camera-rig.ts` (lines 45–69)  
**Apply to:** Simulation delta times, particle velocities, and shader uniforms  
```typescript
// Clamp delta time to avoid physics explosion or NaN propagation during background tab resume
const safeDt = Math.min(Math.max(dt, 0.0), 0.1);
const safeScale = Number.isFinite(scale) ? Math.max(0.0, Math.min(scale, 1.5)) : 0.0;
```

### 3. Pre-allocated TypedArray Buffers (0 GC in RAF)
**Source:** `src/graphics/particles/bokeh-motes.ts` (lines 19–23)  
**Apply to:** `SparklerSystem`  
- All `Float32Array` buffers (`positions`, `colors`, `velocities`, `lifetimes`) MUST be allocated during constructor execution.
- NEVER allocate `new Float32Array(...)` inside `update(dt)` to prevent mobile garbage collection pauses.

### 4. Property Interpolation via `@tweenjs/tween.js`
**Source:** `src/graphics/camera-rig.ts` (lines 110–125), `src/graphics/scene-manager.ts` (line 165)  
**Apply to:** `FlameController.ignite()`  
- Interpolates uniforms and intensity smoothly with `TWEEN.Easing.Cubic.Out`.
- Driven synchronously within the RAF loop by calling `TWEEN.update()`.

### 5. Headless WebGL / Test Environment Fallbacks
**Source:** `src/graphics/scene-manager.ts` (lines 80–95)  
**Apply to:** Tests running under `vitest` / `happy-dom`  
- Wrap WebGL-specific calls (`renderer.compile`) in try/catch to maintain headless CI test greenness.

---

## No Analog Found

Every file and feature in Phase 3 maps cleanly to proven in-repo analogs established in Phase 2:

| File / Component | Closest Analog | Status |
|------------------|----------------|--------|
| GLSL Shaders & Uniforms | `src/graphics/materials/material-palette.ts` | Fully mapped |
| Teardrop Cone Mesh | `src/graphics/meshes/diya-mesh.ts` | Fully mapped |
| Canvas Radial Glow Sprite | `src/graphics/particles/bokeh-motes.ts` | Fully mapped |
| Euler Particle Kinematics | `src/graphics/particles/bokeh-motes.ts` | Fully mapped |
| Orchestrator & Tweening | `src/graphics/scene-manager.ts` & `src/graphics/camera-rig.ts` | Fully mapped |

---

## Metadata

**Analog search scope:** `src/graphics/`, `src/app/`, `tests/graphics/`  
**Files scanned:** 20 source files, 10 test suites  
**Tracked source gate verification:** All analog paths verified via `git ls-files` (zero gitignored mirror references)  
**Pattern extraction date:** 2026-11-04  
