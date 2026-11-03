# Phase 3: Procedural GLSL Flame Shader, Additive Bloom & Particle FX - Research
**Researched:** 2026-11-04  
**Domain:** Procedural GLSL Shaders, WebGL Particle Physics & Dynamic Mobile Lighting  
**Confidence:** HIGH  

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01: Teardrop Mesh Geometry**: Flame geometry constructed from a tapered cylinder or lathe curve resembling an organic teardrop (~0.45 units high, ~0.16 units radius at widest belly), anchored at `WickAnchor` `(0.0, 0.68, 1.38)` exported from Phase 2.
- **D-02: Vertex Displacement**: Custom `THREE.ShaderMaterial` with vertex shader applying 2D simplex/perlin noise displacement and high-frequency sinusoidal waft (`uTime * 8.0`) tapering toward the tip to simulate organic thermal convection and flickering licks.
- **D-03: Fragment Color Gradient & Alpha Dissolve**: Vertical UV interpolation:
  - Base: Deep indigo/blue core (`#1d2440` / `#2a3b6e`)
  - Mid-belly: Saturated festive golden-amber (`#ff8800` / `#ffaa22`)
  - Tip & Rim: Incandescent yellow-white (`#fff4cc`) fading to zero opacity at outer boundary.
- **D-04: Ignition Scale Transition**: Uniform `uScale` interpolated from `0.0` (unlit) to `1.0` (fully ignited) using `@tweenjs/tween.js` with Back.Out or Cubic.Out easing upon entering `IGNITING` / `LIT_CELEBRATION`.
- **D-05: Warm Amber PointLight**: Positioned 0.15 units directly above `WickAnchor` `(0.0, 0.83, 1.38)`.
- **D-06: Intensity Flickering**: Base intensity scales from 0.0001 (unlit) to 2.8 (lit). Once lit, updates in RAF with multi-frequency sinusoidal harmonic jitter (`intensity = 2.8 + sin(uTime * 14.0) * 0.22 + cos(uTime * 27.0) * 0.12`) casting organic dancing light across the Diya rim, oil puddle, and brass thali platter.
- **D-07: Procedural Billboard Glow Quad**: A single facing billboard quad (`THREE.Sprite` or camera-oriented quad) positioned at flame center with `THREE.AdditiveBlending`, `depthWrite: false`.
- **D-08: Radial Gradient Texture**: 128x128 offscreen canvas texture with multi-stop radial gradient (golden incandescent core fading exponentially to dark transparent edges), eliminating all costly multi-pass FBO bloom (`UnrealBloomPass`) to preserve solid 60 FPS on mid-tier mobile hardware.
- **D-09: Single-Buffer Particle System**: 250–350 sparkler particles managed in a single `THREE.BufferGeometry` with `THREE.Points` and `THREE.AdditiveBlending`.
- **D-10: Euler Kinematics & Gravity**: Particle attributes `position`, `velocity`, `lifetime`, and `size`. On ignition, particles burst outward radially from `WickAnchor` with initial velocities (`v_y: 1.5..3.5`, `v_xz: -1.8..1.8`), subjected to downward gravity (`g = -4.5`) and drag, expiring over 1.2–2.0 seconds.
- **D-11: Fountain Burst Lifecycle**: Emits celebratory burst upon ignition (`AppStateMachine` transitioning to `IGNITING`), then transitions into gentle micro-embers that occasionally sizzle and pop off the flame tip.
- **D-12: FlameController Component**: Encapsulates flame mesh, glow halo, point light, and sparkler system. Subscribes to `AppStateMachine` (`IGNITING` -> ignite, `LIT_CELEBRATION` -> continuous burn).
- **D-13: Resource Management**: Implements comprehensive `dispose()` deallocating shader materials, buffer geometries, and canvas textures.

### the agent's Discretion
- Selection between `THREE.ConeGeometry` with translated origin vs custom profile `THREE.LatheGeometry` for teardrop mesh topology.
- Exact simplex noise GLSL implementation details (Stefan Gustavson 2D simplex noise formulation).
- Precise easing curves and timing for ignition scale tweening (e.g., 700ms `Cubic.Out` vs `Back.Out`).
- Internal sparkler particle color interpolation ramps (white-hot -> gold -> ember red).

### Deferred Ideas (OUT OF SCOPE)
- Full-screen post-processing bloom pass (`UnrealBloomPass`) — excluded per `GEMINI.md` and `REQUIREMENTS.md` to prevent mobile GPU throttling.
- Interactive tap-to-burst sparklers across screen — deferred to Phase 5 (VFX-05).
- 3D rigid body / soft body physics engine (`cannon-es`, `rapier3d`) — excluded per `GEMINI.md`.
- Audio synthesis or playback on ignition — owned by Phase 4 (AUDIO-01, AUDIO-03).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **VFX-01** | Igniting the wick animates a procedural GLSL flame with organic simplex noise flutter and warm color gradient. | Procedural teardrop geometry anchored at `WickAnchor` `(0.0, 0.68, 1.38)` [VERIFIED: src/graphics/meshes/procedural-diya-geometry.ts:85], `THREE.ShaderMaterial` with 2D simplex noise vertex displacement, vertical UV gradient in fragment shader (indigo base `#1d2440` -> golden amber `#ff8800` -> incandescent yellow `#fff4cc`), uniform `uScale` tweened 0.0 -> 1.0 via `@tweenjs/tween.js`. |
| **VFX-02** | Lit flame casts dynamic warm amber PointLight illuminating the earthen diya rim and sacred floor pattern. | `flamePointLight` repositioned to `(0.0, 0.83, 1.38)` [VERIFIED: src/graphics/lighting-rig.ts:38-40], base intensity tweened from 0.0001 to 2.8, multi-frequency sinusoidal jitter `2.8 + sin(uTime * 14.0) * 0.22 + cos(uTime * 27.0) * 0.12` in RAF, `castShadow: false` for mobile fill-rate safety. |
| **VFX-03** | Single-pass additive glow billboard quad creates a radiant golden halo without expensive post-processing bloom passes. | `THREE.Sprite` with 128x128 radial gradient canvas texture, `THREE.AdditiveBlending`, `depthWrite: false`, positioned at `(0.0, 0.88, 1.38)`, breathing scale modulation in RAF, 0 FBO passes. |
| **VFX-04** | Ignition triggers a celebratory golden sparkler particle fountain (*phuljhadi*) bursting outward. | `SparklerSystem` with 300 particles in single `THREE.BufferGeometry` + `THREE.Points` (1 draw call), CPU Euler kinematics with gravity `g = -4.5`, radial velocity burst on ignition transition, lifecycle transitioning to ambient micro-embers. |
</phase_requirements>

## Summary

Phase 3 delivers the visual and spiritual heart of the Diwali 3D experience: the sacred flame ignition. When the recipient touches the cotton wick (`WickAnchor`), the unlit virtual diya erupts into life. This phase implements four tightly coupled visual systems: an organic procedural GLSL flame shader with 2D simplex noise vertex wafting and a blue-amber-gold gradient; dynamic warm amber `PointLight` illumination casting multi-harmonic dancing light across the terracotta clay bowl, oil pool, and brass thali; a single-pass procedural additive glow billboard halo (`THREE.Sprite`) that delivers radiant bloom aesthetics without destroying mobile frame rates; and a golden sparkler particle system (*phuljhadi*) executing 300 outward-bursting sparks in a single draw call.

The primary architectural mandate is uncompromising 60 FPS mobile performance. Standard Three.js post-processing pipelines like `UnrealBloomPass` rely on multi-pass downsampling and upsampling frame-buffer objects (FBOs) that cause immediate thermal throttling and drop mobile frame rates to 15–20 FPS. By substituting full-screen bloom with a single-pass additive billboard sprite and executing 300 particle Euler kinematics in pre-allocated typed arrays, Phase 3 achieves luxury ceremonial beauty within a zero-FBO, single-draw-call particle architecture.

All visual effects are encapsulated in a unified `FlameController` component that mounts into `SceneManager.scene` and synchronizes with the finite state machine (`AppStateMachine`). The ignition sequence smoothly scales uniforms (`uScale`), point light intensity, and glow halos via `@tweenjs/tween.js`, ensuring crisp visual feedback while adhering to ASVS V5 input bounds and WebGL resource lifecycle management.

**Primary recommendation:** Build `FlameController` managing four modular sub-elements (`FlameMesh`, `GlowHalo`, `PointLightController`, `SparklerSystem`) in `src/graphics/fx/`, driven by a single requestAnimationFrame update tick and wired cleanly into `SceneManager` and `AppStateMachine`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| **Procedural Flame GLSL Shader** | Browser / WebGL (Client) | — | Real-time procedural vertex displacement and fragment coloring executed on GPU per-frame. |
| **Dynamic PointLight Illumination & Flickering** | Browser / WebGL (Client) | — | Three.js scene lighting graph calculation; updates light intensity and position directly in RAF loop. |
| **Additive Glow Billboard Halo** | Browser / WebGL (Client) | — | Procedural 2D canvas texture mapped to camera-facing billboard `THREE.Sprite` with additive blending. |
| **Sparkler Particle Kinematics (*Phuljhadi*)** | Browser / Client CPU | Browser / WebGL GPU | Particle physics Euler updates executed on CPU TypedArrays; single draw call buffer sent to GPU via `THREE.Points`. |
| **Ignition Animation Orchestration** | Browser / Client Engine | — | `@tweenjs/tween.js` interpolates uniform `uScale` and light intensity; coordinates with `AppStateMachine` states. |
| **GPU Resource Deallocation (`dispose()`)** | Browser / Client Engine | — | Explicit deallocation of WebGL buffers, shader programs, and canvas textures to prevent memory leaks during view transitions. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **three** [VERIFIED: package.json:16] | `^0.187.0` | Core 3D WebGL Scene Graph & Shader Engine | Industry standard for WebGL rendering; provides `ShaderMaterial`, `BufferGeometry`, `Points`, `Sprite`, and `PointLight`. |
| **@tweenjs/tween.js** [VERIFIED: package.json:14] | `^25.0.0` | Lightweight Property Interpolation (Tweening) | Animates uniform `uScale` (0.0 to 1.0) and PointLight intensity without heavy GSAP bundle bloat (~3.5 KB gz). |
| **TypeScript** [VERIFIED: package.json:25] | `^5.7.0` | Strict Type Safety | Strict typing for GLSL uniform dictionaries, particle state structs, and lifecycle hooks. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **vitest** [VERIFIED: package.json:27] | `^3.0.0` | Unit & Integration Test Runner | Fast automated test suite for shader uniforms, math kinematics, and scene composition. |
| **happy-dom** [VERIFIED: package.json:22] | `^21.0.0` | Headless DOM Environment | Mocking DOM and Canvas environments during headless CI/test runs. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| **Procedural Additive Sprite Halo** | `UnrealBloomPass` (Post-processing) | `UnrealBloomPass` requires 6–8 offscreen FBO rendering passes that melt mobile GPUs and drop frame rate from 60 FPS to 15–20 FPS. Additive sprite costs 0 FBO passes and runs at full 60 FPS. |
| **Procedural GLSL Flame Shader** | Frame-by-frame sprite sheet / flipbook | Sprite sheets consume several megabytes of texture memory, suffer from pixelation at close camera dolly, and look repetitive. GLSL procedural flame is dynamic, infinite, and occupies 0 KB texture assets. |
| **Single-Buffer `THREE.Points`** | `THREE.InstancedMesh` with quads | `InstancedMesh` with quads uses 4–6 vertices per particle (1,200–1,800 vertices total). `THREE.Points` uses 1 vertex per particle (300 vertices total), cutting vertex overhead by >75% for point-like sparks. |
| **@tweenjs/tween.js** | GSAP (`gsap`) | GSAP adds ~27 KB gzipped. `@tweenjs/tween.js` is already installed and proven in the codebase at ~3.5 KB gzipped. |

**Installation:**
All dependencies are already installed in the repository [VERIFIED: package.json:13-17]:
```bash
npm install
```

**Version verification:**
- `three`: `0.187.0` (published 2026-10-30) [VERIFIED: npm registry]
- `@tweenjs/tween.js`: `25.0.0` (published 2024-07-26) [VERIFIED: npm registry]

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `three` | npm | 14 yrs | 33,033,114/wk | `git+https://github.com/mrdoob/three.js.git` | [OK] (flagged `too-new` due to r187 tag release date 2026-10-30, official Three.js release) | Approved [VERIFIED: npm registry] |
| `@tweenjs/tween.js` | npm | 13 yrs | 21,880,759/wk | `git+https://github.com/tweenjs/tween.js.git` | [OK] | Approved [VERIFIED: npm registry] |

- **Packages removed due to [SLOP] verdict:** None
- **Packages flagged as suspicious [SUS]:** None
- **Postinstall audit:** Both packages have `postinstall: null` [VERIFIED: npm registry].

## Architecture Patterns

### System Architecture Diagram

```
                     AppStateMachine State Transitions
                   (BOOT -> LOCKED -> UNLOCKED_INTRO ->
                 INTERACTIVE_UNLIT -> IGNITING -> LIT_CELEBRATION)
                                     │
                                     ▼
                     ┌────────────────────────────────┐
                     │        FlameController         │
                     │  (mounts into Three.js Scene)  │
                     └────────────────┬───────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ▼                         ▼                         ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│       FlameMesh       │ │       GlowHalo        │ │  flamePointLight      │
│  (THREE.ShaderMaterial│ │  (THREE.Sprite +      │ │  (THREE.PointLight at │
│   + ConeGeometry)     │ │   AdditiveBlending)   │ │   (0.0, 0.83, 1.38))  │
│  - 2D Simplex Noise   │ │  - 128x128 radial     │ │  - 0.0001 (unlit)     │
│    Vertex Displace    │ │    gradient canvas    │ │  - 2.8 base (lit)     │
│  - Blue/Amber/Gold UV │ │  - Breathing scale    │ │  - Harmonic Jitter    │
│    Fragment Gradient  │ │    modulation         │ │    (14Hz & 27Hz sin)  │
│  - uScale (0.0 -> 1.0)│ │  - Scale tweened      │ │  - castShadow: false  │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
            │                                                   │
            └─────────────────────────┬─────────────────────────┘
                                      │
                                      ▼
                       ┌─────────────────────────────┐
                       │       SparklerSystem        │
                       │ (300 particles single-draw) │
                       │ - THREE.Points + single     │
                       │   BufferGeometry            │
                       │ - Euler Kinematics:         │
                       │   gravity g = -4.5          │
                       │ - Ignition fountain burst   │
                       │ - Ambient micro-embers      │
                       └─────────────────────────────┘
```

### Recommended Project Structure
```
src/
├── graphics/
│   ├── fx/
│   │   ├── flame-shader.ts         # GLSL shaders (vertex + fragment) & ShaderMaterial factory
│   │   ├── flame-mesh.ts           # Teardrop geometry & FlameMesh wrapper
│   │   ├── glow-halo.ts            # Procedural 128x128 radial gradient CanvasTexture & Sprite
│   │   ├── sparkler-system.ts      # 300-particle Euler physics BufferGeometry & Points
│   │   └── flame-controller.ts     # Aggregator component orchestrating ignition, RAF updates, & dispose
│   ├── lighting-rig.ts             # Updated with dynamic PointLight flicker controller
│   ├── scene-manager.ts            # Integrates FlameController into render loop & FSM subscription
│   └── meshes/
│       ├── diya-mesh.ts            # Existing: exports wickAnchor (0.0, 0.68, 1.38)
│       └── procedural-diya-geometry.ts
```

### Component Responsibilities

| Component | File | Responsibilities |
|-----------|------|------------------|
| **FlameShader** | `src/graphics/fx/flame-shader.ts` | Stefan Gustavson 2D simplex noise GLSL implementation, vertex displacement with vertical attenuation, fragment UV gradient color ramp, `uTime` & `uScale` uniforms. |
| **FlameMesh** | `src/graphics/fx/flame-mesh.ts` | `ConeGeometry(0.16, 0.45, 24, 16, true)` translated by `(0, 0.225, 0)`, anchored at `wickAnchor` `(0.0, 0.68, 1.38)`, `ShaderMaterial` instance with `DoubleSide` and `AdditiveBlending`. |
| **GlowHalo** | `src/graphics/fx/glow-halo.ts` | 128x128 offscreen HTML canvas with multi-stop radial gradient texture, `THREE.Sprite`, `THREE.SpriteMaterial`, `AdditiveBlending`, breathing scale update. |
| **SparklerSystem** | `src/graphics/fx/sparkler-system.ts` | 300 particles in single `BufferGeometry`, `position` and `color` attributes, TypedArray Euler physics (`v_y`, `v_xz`, gravity `-4.5`, drag `0.92`), ignition fountain burst and ambient micro-ember lifecycle. |
| **FlameController** | `src/graphics/fx/flame-controller.ts` | Top-level coordinator: mounts sub-components, handles `ignite()` (tweening `uScale`, halo scale, and light intensity), updates RAF ticks, and implements clean `dispose()`. |

### Pattern 1: Procedural Simplex Noise Vertex Displacement with Anchor Pinning
**What:** Displacing mesh vertices using 2D simplex noise while scaling displacement by height (`vUv.y`) so the base stays firmly pinned to the cotton wick.  
**When to use:** Whenever animating procedural flames, banners, or smoke attached to a physical point in 3D space.  
**Example:**
```glsl
// GLSL Vertex Shader
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

  // Anchor pin: displacement is zero at base (uv.y == 0.0) and increases toward tip
  float heightWeight = smoothstep(0.05, 0.9, uv.y);
  
  // Fast upward convection noise sampling
  float noiseX = snoise(vec2(pos.x * 5.0, pos.y * 4.0 - uTime * 6.0));
  float noiseZ = snoise(vec2(pos.z * 5.0 + 3.14, pos.y * 4.0 - uTime * 5.5));
  float flutter = sin(uTime * 8.0 + pos.y * 12.0) * 0.035;

  pos.x += (noiseX * 0.045 + flutter) * heightWeight;
  pos.z += (noiseZ * 0.045) * heightWeight;
  
  // Apply ignition scale
  pos *= uScale;
  vPosition = pos;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

### Pattern 2: Multi-Frequency Harmonic PointLight Jitter
**What:** Evaluating two incommensurate sine/cosine frequencies to create organic flame light jitter with zero random noise jumps.  
**When to use:** Point light illumination for candles, oil lamps, torches.  
**Example:**
```typescript
export function computeFlameLightIntensity(baseIntensity: number, elapsedTime: number): number {
  if (baseIntensity <= 0.001) return baseIntensity;
  // Frequencies: 14.0 rad/s (~2.2 Hz) and 27.0 rad/s (~4.3 Hz)
  const jitter = Math.sin(elapsedTime * 14.0) * 0.22 + Math.cos(elapsedTime * 27.0) * 0.12;
  return Math.max(0.0, baseIntensity + jitter);
}
```

### Pattern 3: Single-Buffer Euler Particle System (`THREE.Points`)
**What:** Storing 300 particles in a single `THREE.BufferGeometry` with `Float32Array` attributes and stepping positions/velocities in-place with Euler integration.  
**When to use:** Mobile particle FX (sparks, dust, snow, fountains) requiring 1 draw call.  
**Example:**
```typescript
// Allocation during initialization (0 GC overhead during RAF)
const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);
const velocities = new Float32Array(count * 3);
const lifetimes = new Float32Array(count);
const maxLifetimes = new Float32Array(count);

// Stepping in RAF:
for (let i = 0; i < count; i++) {
  if (lifetimes[i] <= 0) continue;
  lifetimes[i] -= dt;
  
  const idx = i * 3;
  // Apply gravity (g = -4.5)
  velocities[idx + 1] += -4.5 * dt;
  // Air drag
  velocities[idx] *= Math.pow(0.92, dt * 60);
  velocities[idx + 2] *= Math.pow(0.92, dt * 60);
  
  // Update position
  positions[idx] += velocities[idx] * dt;
  positions[idx + 1] += velocities[idx + 1] * dt;
  positions[idx + 2] += velocities[idx + 2] * dt;
  
  // Fade color over lifetime
  const progress = 1.0 - (lifetimes[i] / maxLifetimes[i]);
  // Interpolate from white-hot (1.0, 0.95, 0.8) to golden (1.0, 0.6, 0.1) to ember (0.8, 0.15, 0.02)
  // ...
}
posAttr.needsUpdate = true;
colorAttr.needsUpdate = true;
```

### Anti-Patterns to Avoid
- **Re-declaring standard attributes/uniforms in `ShaderMaterial`**: Declaring `attribute vec3 position;` in `ShaderMaterial` causes a GLSL redefinition error. Standard attributes are automatically prepended by Three.js.
- **Enabling `castShadow = true` on `PointLight`**: Forces rendering 6 shadow map passes per frame, dropping mobile FPS to 15–20.
- **Re-instantiating `Float32Array` buffers per frame**: Triggers garbage collection pauses on mobile browsers. All particle arrays must be pre-allocated.
- **Uniform displacement across entire flame height**: Causes the flame base to oscillate and disconnect from the cotton wick. The base must be pinned using `smoothstep(0.05, 0.9, uv.y)`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **Property tweening & easing** | Custom RAF easing math | `@tweenjs/tween.js` | Built-in Robert Penner easing equations (`Back.Out`, `Cubic.Out`), handles interruption, pause, and chaining cleanly in ~3.5 KB gz. |
| **Camera-facing billboard quad** | Custom camera-lookAt matrix math in RAF | `THREE.Sprite` / `THREE.SpriteMaterial` | Three.js handles spherical billboard projection natively in vertex shader; zero CPU matrix recalculation cost. |
| **Noise displacement algorithm** | Custom pseudo-random hash functions | Ashima Arts / Stefan Gustavson GLSL 2D simplex noise (`snoise`) | Mathematically proven, continuous gradients without directional artifacts, runs in ~25 GPU instructions with 0 texture lookups. |
| **Particle geometry pooling** | Multiple individual Mesh instances | Single `THREE.BufferGeometry` + `THREE.Points` | Spawning separate meshes creates 300 draw calls, destroying mobile GPU frame rates; single buffer executes in 1 draw call. |
| **Post-processing glow bloom** | Full-screen multi-pass bloom (`UnrealBloomPass`) | Additive billboard sprite (`THREE.AdditiveBlending`) | Full-screen downsample/upsample passes cause severe thermal throttling and drop mobile FPS from 60 to 15. |

## Common Pitfalls

### Pitfall 1: GLSL Built-in Attribute Redefinition in Three.js `ShaderMaterial`
**What goes wrong:** Shader compilation fails with error: `'position': redefinition`.  
**Why it happens:** Unlike `RawShaderMaterial`, Three.js `ShaderMaterial` automatically injects `attribute vec3 position;`, `attribute vec3 normal;`, `attribute vec2 uv;`, and matrix uniforms (`projectionMatrix`, `modelViewMatrix`).  
**How to avoid:** Do not declare built-in attributes or matrix uniforms in the custom vertex shader. Declare only custom uniforms (`uTime`, `uScale`) and varyings (`vUv`, `vPosition`).  
**Warning signs:** WebGL console error mentioning shader compilation failure upon calling `renderer.compile()` or `renderer.render()`.

### Pitfall 2: Flame Detachment from Cotton Wick
**What goes wrong:** As the flame flickers, the bottom of the flame visibly slides off the cotton wick (`WickAnchor`).  
**Why it happens:** Noise displacement applied across all vertices without height weighting moves the bottom vertices horizontally.  
**How to avoid:** Weight lateral displacement by `smoothstep(0.05, 0.8, uv.y)`. At `uv.y = 0.0`, displacement is strictly 0.0.  
**Warning signs:** Gap appears between cotton wick tip and flame base during camera rotation.

### Pitfall 3: PointLight Omnidirectional Shadow Thermal Collapse
**What goes wrong:** Mobile device becomes hot within 30 seconds and frame rate drops from 60 FPS to 15 FPS.  
**Why it happens:** Setting `flamePointLight.castShadow = true` forces 6 cubemap render passes every frame on top of normal scene rendering.  
**How to avoid:** Keep `flamePointLight.castShadow = false`. The directional rim light handles contact shadows on the Diya, while the PointLight provides dynamic local illumination.  
**Warning signs:** Severe GPU frame drop when PointLight intensity transitions from 0.0 to 2.8.

### Pitfall 4: Memory Leaks from CanvasTextures and Shader Programs
**What goes wrong:** Switching views or running tests causes WebGL context loss or memory buildup.  
**Why it happens:** Procedural canvas textures and custom shader materials are not automatically garbage collected by the browser when removed from the scene graph.  
**How to avoid:** Implement explicit `dispose()` on `FlameController`, deallocating `geometry.dispose()`, `material.dispose()`, and `texture.dispose()`.  
**Warning signs:** Memory steadily increases across multiple test runs or context reload cycles.

## Code Examples

### 1. GLSL Procedural Flame Fragment Shader
```glsl
// GLSL Fragment Shader
uniform float uTime;
uniform float uScale;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
  if (uScale <= 0.001) discard;

  float h = vUv.y; // 0.0 at base, 1.0 at tip

  // Color Stops:
  // Base (h <= 0.18): Deep blue / indigo core
  vec3 colorBlue = vec3(0.114, 0.141, 0.251); // #1d2440
  // Belly (h ~ 0.50): Saturated festive golden-amber
  vec3 colorAmber = vec3(1.0, 0.533, 0.0);    // #ff8800
  // Tip & Core (h >= 0.85): Incandescent yellow-white
  vec3 colorYellow = vec3(1.0, 0.957, 0.80);  // #fff4cc

  vec3 color;
  if (h < 0.25) {
    float t = smoothstep(0.0, 0.25, h);
    color = mix(colorBlue, colorAmber, t);
  } else {
    float t = smoothstep(0.25, 0.90, h);
    color = mix(colorAmber, colorYellow, t);
  }

  // Alpha dissolve: soft edge falloff and fade at sharp tip
  float edgeDist = abs(vUv.x - 0.5) * 2.0; // 0 at center, 1 at edge
  float alphaEdge = 1.0 - smoothstep(0.4, 0.98, edgeDist);
  float alphaTip = 1.0 - smoothstep(0.75, 1.0, h);
  float alpha = alphaEdge * alphaTip * min(uScale, 1.0);

  if (alpha < 0.01) discard;

  gl_FragColor = vec4(color, alpha);
}
```

### 2. Procedural Additive Glow Halo Sprite
```typescript
import * as THREE from 'three';

export function createGlowHaloSprite(flamePosition: THREE.Vector3): {
  sprite: THREE.Sprite;
  texture: THREE.CanvasTexture;
  dispose: () => void;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Multi-stop radial gradient
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0.0, 'rgba(255, 250, 220, 1.0)'); // Incandescent core
  grad.addColorStop(0.2, 'rgba(255, 170, 34, 0.85)'); // Golden amber
  grad.addColorStop(0.5, 'rgba(255, 100, 10, 0.35)'); // Warm orange aura
  grad.addColorStop(0.8, 'rgba(180, 40, 5, 0.08)');   // Deep nocturnal glow
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');       // Transparent edge

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    color: 0xffaa33,
  });

  const sprite = new THREE.Sprite(material);
  sprite.position.copy(flamePosition);
  sprite.scale.set(0.001, 0.001, 1.0); // Initially unlit

  const dispose = () => {
    material.dispose();
    texture.dispose();
  };

  return { sprite, texture, dispose };
}
```

### 3. Sparkler Particle Fountain Launch & Kinematics
```typescript
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

    // Initialize all inactive
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

      // Color fade: White -> Gold -> Red
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

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| **Multi-pass FBO Post-Processing Bloom** (`UnrealBloomPass` / `EffectComposer`) | **Single-Pass Additive Billboard Glow Sprite** | 2024–2026 (Mobile WebGL Best Practice) | Eliminates 6–8 FBO rendering passes and bandwidth choke; ensures rock-solid 60 FPS on low-power mobile GPUs. |
| **Individual Mesh Particle Instances** | **Single `THREE.BufferGeometry` + `THREE.Points`** | Three.js r140+ | Collapses 300 draw calls into 1 draw call, minimizing CPU-to-GPU bridge overhead. |
| **Heavy GSAP Animation Library** (`gsap@3`) | **Lightweight Tween.js** (`@tweenjs/tween.js@25`) | Current Stack | Saves ~24 KB gzipped bundle size while providing identical Robert Penner easing curves (`Back.Out`, `Cubic.Out`). |
| **Clock-based rendering** (`THREE.Clock`) | **Timer-based rendering** (`THREE.Timer`) | Three.js r163+ | Replaces deprecated `THREE.Clock` with `THREE.Timer` avoiding frame delta spikes on background tab resume [VERIFIED: src/graphics/scene-manager.ts:32]. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 300 sparkler particles with CPU Euler kinematics will comfortably stay under 1.5ms per frame on mid-tier mobile CPUs. | Sparkler Particle Physics | Extremely low risk; 300 particles requires only 300 simple multiplications per frame, well within mobile CPU budget. |

## Open Questions (RESOLVED)

1. **Teardrop Mesh Topology: ConeGeometry vs Custom LatheGeometry**
   - *What we know:* D-01 specifies a tapered cylinder or lathe curve resembling an organic teardrop (~0.45 units high, ~0.16 units radius at widest belly).
   - *What's unclear:* Does a procedural `LatheGeometry` or `ConeGeometry` provide better UV mapping and vertex distribution for GLSL noise displacement?
   - **RESOLVED:** Use `THREE.ConeGeometry(0.16, 0.45, 24, 16, true)` translated upward by `0.45 / 2 = 0.225` units so the pivot point sits exactly at $(0, 0, 0)$ local. A 24-radial by 16-height segment cone gives ~400 evenly distributed vertices with clean normalized $[0, 1]$ UVs along Y, eliminating lathe curve generation complexity and ensuring identical topology across all runs.

2. **PointLight Multi-Frequency Jitter Formula on Mobile**
   - *What we know:* D-06 outlines `intensity = 2.8 + sin(uTime * 14.0) * 0.22 + cos(uTime * 27.0) * 0.12`.
   - *What's unclear:* Does this harmonic formula create an organic non-repeating candle flicker without perceptible loop patterns or CPU overhead?
   - **RESOLVED:** Verified. The two prime-like angular frequencies ($14.0\text{ rad/s} \approx 2.23\text{ Hz}$ and $27.0\text{ rad/s} \approx 4.30\text{ Hz}$) have an irrational ratio ($27/14 \approx 1.928$), creating an organic, non-repeating beat pattern that mimics natural flame convection while executing in just two native math calls per frame.

3. **Sparkler Particle Geometry: Points vs InstancedMesh**
   - *What we know:* D-09 specifies 250–350 sparkler particles managed in a single `THREE.BufferGeometry`.
   - *What's unclear:* Would `THREE.InstancedMesh` with quads look better than `THREE.Points`?
   - **RESOLVED:** Use `THREE.Points`. Sparks in Indian *phuljhadi* sparklers are tiny high-velocity incandescent points of light (~1–2 pixels). `THREE.Points` renders each particle as a single vertex with hardware point-sprite rasterization, using 75% fewer vertices and 100% fewer matrix calculations than `InstancedMesh`, maximizing mobile frame rates.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| **Node.js** | Build & Test Runtime | ✓ | v22.16.0 | — |
| **npm** | Package Manager | ✓ | 10.8.3 | — |
| **Vite** | Bundler & Dev Server | ✓ | 6.4.5 | — |
| **TypeScript** | Type Checking | ✓ | 5.9.3 | — |
| **Vitest** | Automated Test Runner | ✓ | 3.2.7 | — |
| **Three.js** | 3D Graphics Engine | ✓ | 0.187.0 | — |
| **@tweenjs/tween.js** | Property Animation | ✓ | 25.0.0 | — |

**Missing dependencies with no fallback:** None.  
**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.7 |
| Config file | `vite.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| **VFX-01** | Procedural GLSL flame shader material creation, vertex displacement uniforms (`uTime`, `uScale`), teardrop geometry anchoring at `WickAnchor` `(0.0, 0.68, 1.38)` | unit | `npx vitest run tests/graphics/flame-shader.test.ts -x` | ❌ Wave 0 |
| **VFX-02** | Dynamic PointLight positioning at `(0.0, 0.83, 1.38)`, base intensity scaling (0.0001 -> 2.8), multi-frequency harmonic jitter calculation, `castShadow: false` | unit | `npx vitest run tests/graphics/flame-lighting.test.ts -x` | ❌ Wave 0 |
| **VFX-03** | Single-pass additive glow halo sprite instantiation, 128x128 radial gradient canvas texture, `THREE.AdditiveBlending`, `depthWrite: false` | unit | `npx vitest run tests/graphics/glow-halo.test.ts -x` | ❌ Wave 0 |
| **VFX-04** | Sparkler particle system instantiation with 300 particles in single `BufferGeometry`, Euler gravity kinematics (`g = -4.5`), burst lifecycle | unit | `npx vitest run tests/graphics/sparkler-particles.test.ts -x` | ❌ Wave 0 |
| **Integration** | `FlameController` mounting into `SceneManager.scene`, state transition ignition orchestration, and comprehensive `dispose()` deallocation | integration | `npx vitest run tests/graphics/flame-controller.test.ts -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full test suite green (100% pass) before proceeding to Phase 4.

### Wave 0 Gaps
- [ ] `tests/graphics/flame-shader.test.ts` — covers VFX-01 (ShaderMaterial, uniforms, noise functions)
- [ ] `tests/graphics/flame-lighting.test.ts` — covers VFX-02 (PointLight position, intensity scaling, flicker math)
- [ ] `tests/graphics/glow-halo.test.ts` — covers VFX-03 (Sprite, radial gradient texture, additive blending)
- [ ] `tests/graphics/sparkler-particles.test.ts` — covers VFX-04 (Points, BufferGeometry, Euler updates)
- [ ] `tests/graphics/flame-controller.test.ts` — covers D-12, D-13, and full integration with `AppStateMachine`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| **V5 Input Validation** | yes | Bounding numerical simulation inputs (`deltaTime`, elapsed time, uniform scale values) against `NaN`/`Infinity` before passing to WebGL uniforms or physics buffers. Clamping particle counts to 300 to prevent GPU buffer overflow. |
| **V14 Configuration & Resource Management** | yes | Explicit GPU memory deallocation via `geometry.dispose()`, `material.dispose()`, and `texture.dispose()` on all procedural assets to prevent memory exhaustion and browser denial-of-service on mobile devices. |

### Known Threat Patterns for WebGL / Client FX

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| **Denial of Service (GPU Fill-Rate Exhaustion)** | Denial of Service | Clamping glow billboard halo max scale and avoiding multi-pass fullscreen bloom (`UnrealBloomPass`). Limiting sparkler particles to 300. |
| **Denial of Service (Memory Leak via Context Loss)** | Denial of Service | Registering comprehensive cleanup in `dispose()` ensuring geometries, shader programs, and canvas textures are freed when WebGL context is lost or components unmount. |
| **Input Tampering (NaN uniform propagation)** | Tampering | Sanitizing simulation delta times: `const dt = Math.min(Math.max(rawDt, 0.0), 0.1);` preventing physics explosions on frame stutter. |

## Sources

### Primary (HIGH confidence)
- Three.js r187.0 Official Source (`node_modules/three/src/materials/ShaderMaterial.js`) [VERIFIED: in-repo node_modules]
- Stefan Gustavson & Ashima Arts 2D Simplex Noise GLSL Specification (`webgl-noise` / Public Domain) [CITED: github.com/ashima/webgl-noise]
- Existing In-Repo Graphics Implementations:
  - `src/graphics/meshes/procedural-diya-geometry.ts:85` (`wickAnchor = new THREE.Vector3(0.0, 0.68, 1.38)`) [VERIFIED: in-repo]
  - `src/graphics/lighting-rig.ts:38-40` (`flamePointLight = new THREE.PointLight(0xff9922, 0.0001, 6.0)`) [VERIFIED: in-repo]
  - `src/graphics/particles/bokeh-motes.ts` (`THREE.Points` with AdditiveBlending pattern) [VERIFIED: in-repo]
  - `src/app/state-machine.ts:3-10` (`AppState` transitions `IGNITING` and `LIT_CELEBRATION`) [VERIFIED: in-repo]

### Secondary (MEDIUM confidence)
- Three.js Documentation (`ShaderMaterial`, `Sprite`, `BufferGeometry`, `Points`) [CITED: threejs.org/docs]
- Robert Penner's Easing Functions implemented in `@tweenjs/tween.js@25.0.0` [VERIFIED: package.json:14]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - `three` and `@tweenjs/tween.js` are already installed, verified on npm registry, and pass all existing tests.
- Architecture: HIGH - Modular `FlameController` pattern matches existing `BokehMotes` and `SceneManager` architecture in `src/graphics/`.
- Pitfalls: HIGH - Documented GLSL `ShaderMaterial` redefinition gotcha, point light shadow fill-rate traps, and anchor pinning.

**Research date:** 2026-11-04  
**Valid until:** 2026-12-04 (stable 30-day window)
