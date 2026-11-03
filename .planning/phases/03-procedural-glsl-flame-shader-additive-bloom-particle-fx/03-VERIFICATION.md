---
phase: 03-procedural-glsl-flame-shader-additive-bloom-particle-fx
verified: 2026-11-04T04:15:00Z
status: passed
score: 13/13 must-haves verified
covered_files:
  - .planning/phases/03-procedural-glsl-flame-shader-additive-bloom-particle-fx/03-01-PLAN.md
  - .planning/phases/03-procedural-glsl-flame-shader-additive-bloom-particle-fx/03-01-SUMMARY.md
  - .planning/phases/03-procedural-glsl-flame-shader-additive-bloom-particle-fx/03-02-PLAN.md
  - .planning/phases/03-procedural-glsl-flame-shader-additive-bloom-particle-fx/03-02-SUMMARY.md
  - src/graphics/fx/flame-controller.ts
  - src/graphics/fx/flame-mesh.ts
  - src/graphics/fx/flame-shader.ts
  - src/graphics/fx/glow-halo.ts
  - src/graphics/fx/sparkler-system.ts
  - src/graphics/lighting-rig.ts
  - src/graphics/scene-manager.ts
  - src/main.ts
  - tests/graphics/fx/flame-controller.test.ts
  - tests/graphics/fx/flame-lighting.test.ts
  - tests/graphics/fx/flame-mesh.test.ts
  - tests/graphics/fx/glow-halo.test.ts
  - tests/graphics/fx/sparkler-system.test.ts
  - tests/graphics/lighting-and-particles.test.ts
  - tests/graphics/scene-manager.test.ts
covered_digest: "v4:sha256:6e976c168d75b2d39ab2d066f28da820cace3db11a7eeadf9724f17158c772f3"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Open http://localhost:3000 in mobile viewport emulation or physical smartphone, enter DIWALI to unlock, and trigger ceremonial flame ignition"
    expected: "Teardrop flame wafts organically with 2D simplex noise thermal convection, golden glow halo breathes smoothly, and warm amber PointLight illuminates the diya rim and thali platter without frame stutter"
    why_human: "Organic aesthetic feel of procedural GLSL noise shaders, additive halo luminance, and 60 FPS mobile visual comfort require physical display observation"
  - test: "Observe celebratory 300-particle sparkler fountain (phuljhadi) erupting on ignition"
    expected: "Golden sparks burst outward in an upward fountain, arc downwards under gravity, and smoothly transition across 3 color stages (white-hot to golden amber to ember red) over ~1.5 seconds in a single draw call"
    why_human: "Kinematic arc aesthetics, particle density, and celebratory burst impact are best evaluated interactively"
---

# Phase 3: Procedural GLSL Flame Shader, Additive Bloom & Particle FX Verification Report

**Phase Goal:** Implement organic procedural GLSL flame shaders, warm dynamic point lighting, single-pass additive glow halo, and golden sparkler fountain.  
**Verified:** 2026-11-04T04:15:00Z  
**Status:** passed  
**Score:** 13/13 must-haves verified (0 present, behavior-unverified)  
**Re-verification:** No — initial verification  

---

## User Flow Coverage

**User Story:** *«As a Diwali greeting recipient, I want to experience a photorealistic procedural 3D flame that wafts organically atop the cotton wick, casts warm flickering amber light, and radiates a golden halo bloom, so that the ceremonial lamp feels living and divine without causing mobile GPU lag or battery drain.»*

| Step | Action | Expected Outcome | Evidence in Codebase | Status |
|------|--------|------------------|----------------------|--------|
| 1. Scene Graph Assembly | Application boots and mounts `SceneManager` into `#app` | `FlameController` aggregates `FlameMesh`, `GlowHalo`, `SparklerSystem`, and `flamePointLight` at `wickAnchor` `(0.0, 0.68, 1.38)` in unlit state (`uScale: 0.0`, halo scale: 0.001, light intensity: 0.0001) | [`src/graphics/scene-manager.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/graphics/scene-manager.ts#L155-L158), [`src/graphics/fx/flame-controller.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/graphics/fx/flame-controller.ts#L30-L50) | ✓ VERIFIED |
| 2. Ignition Trigger | FSM transitions to `IGNITING` | `FlameController.ignite()` erupts 300 sparkler particles and smoothly tweens flame scale ($0 \to 1$), halo glow ($0.001 \to 1.0$), and PointLight ($0.0001 \to 2.8$) over 750ms with `Cubic.Out` easing | [`src/graphics/fx/flame-controller.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/graphics/fx/flame-controller.ts#L57-L94), [`src/graphics/scene-manager.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/graphics/scene-manager.ts#L199-L205) | ✓ VERIFIED |
| 3. Procedural Flame Flutter | Continuous render loop during lit state | 2D simplex noise waft displaces vertices along +X/+Z while smoothstep height attenuation pins base vertices to cotton wick; 3-color ramp blends indigo base to golden amber to incandescent yellow tip | [`src/graphics/fx/flame-shader.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/graphics/fx/flame-shader.ts#L41-L94), [`src/graphics/fx/flame-mesh.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/graphics/fx/flame-mesh.ts#L10-L38) | ✓ VERIFIED |
| 4. Dynamic Lighting & Halo | Ambient illumination updates each RAF frame | Warm amber `PointLight` at `(0.0, 0.83, 1.38)` modulates intensity via dual harmonic frequencies (14.0 and 27.0 rad/s) without shadow overhead; 128x128 radial gradient sprite breathes $\pm 4\%$ with 0 FBO bloom passes | [`src/graphics/lighting-rig.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/graphics/lighting-rig.ts#L38-L55), [`src/graphics/fx/glow-halo.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/graphics/fx/glow-halo.ts#L11-L61) | ✓ VERIFIED |
| 5. Sparkler Fountain Eruption | Sparkler particles burst and dissipate | 300 particles in 1 draw call accelerate under gravity ($g = -4.5$), experience horizontal air drag ($0.92$), and transition colors (white-hot $\to$ golden $\to$ ember red) over 1.0–2.0s with 0 GC overhead | [`src/graphics/fx/sparkler-system.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/graphics/fx/sparkler-system.ts#L66-L155) | ✓ VERIFIED |
| 6. Transition to Lit Celebration | Ignition tween resolves | `FlameController.ignite()` promise resolves, prompting `SceneManager` to emit `IGNITION_COMPLETE`, transitioning FSM to `LIT_CELEBRATION` for greeting card reveal | [`src/graphics/scene-manager.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/graphics/scene-manager.ts#L202-L205), [`src/app/state-machine.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/app/state-machine.ts#L67-L71) | ✓ VERIFIED |
| 7. Cascading Resource Cleanup | Scene or app unmounts via `dispose()` | Geometries, shader materials, canvas textures, and tween animations deallocate cleanly, preventing GPU memory leaks | [`src/graphics/fx/flame-controller.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/graphics/fx/flame-controller.ts#L139-L153), [`src/graphics/scene-manager.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/graphics/scene-manager.ts#L353-L357) | ✓ VERIFIED |

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | FlameShader compiles procedural GLSL material with 2D simplex noise vertex waft and 3-color fragment gradient (indigo base to golden amber to incandescent yellow) per D-02, D-03 | ✓ VERIFIED | `src/graphics/fx/flame-shader.ts` implements Stefan Gustavson 2D simplex noise `snoise`, smoothstep base pinning `smoothstep(0.05, 0.9, uv.y)`, and 3-stop vertical color ramp (`#1d2440` to `#ff8800` to `#fff4cc`) with edge and tip alpha dissolve. Verified in `tests/graphics/fx/flame-mesh.test.ts`. |
| 2 | FlameMesh builds teardrop ConeGeometry anchored at wickAnchor (0.0, 0.68, 1.38) with base-translated origin per D-01 | ✓ VERIFIED | `src/graphics/fx/flame-mesh.ts` constructs `THREE.ConeGeometry(0.16, 0.45, 24, 16, true)` translated upward along Y by 0.225 so the local origin is at the base, and positions mesh at `wickAnchor` `(0.0, 0.68, 1.38)`. Verified in `tests/graphics/fx/flame-mesh.test.ts`. |
| 3 | Dynamic flame PointLight is positioned 0.15 units directly above wickAnchor at (0.0, 0.83, 1.38) with castShadow disabled per D-05, D-06 | ✓ VERIFIED | `src/graphics/lighting-rig.ts` lines 38–40 sets `flamePointLight.position` to `(wickAnchor.x, wickAnchor.y + 0.15, wickAnchor.z)` which equals `(0.0, 0.83, 1.38)`, and disables `castShadow` to eliminate mobile cubemap thermal collapse. Verified in `tests/graphics/fx/flame-lighting.test.ts`. |
| 4 | computeFlameLightIntensity computes multi-frequency sinusoidal harmonic jitter (14.0 rad/s and 27.0 rad/s) producing non-repeating candle convection per D-06 | ✓ VERIFIED | `computeFlameLightIntensity` computes `sin(elapsedTime * 14.0) * 0.22 + cos(elapsedTime * 27.0) * 0.12`, clamped to `>= 0.0`. Verified in `tests/graphics/fx/flame-lighting.test.ts`. |
| 5 | GlowHalo generates 128x128 offscreen radial gradient CanvasTexture and displays an additive billboard Sprite with breathing scale oscillation per D-07, D-08 | ✓ VERIFIED | `src/graphics/fx/glow-halo.ts` bakes 128x128 5-stop radial gradient canvas texture, wraps it in `THREE.SpriteMaterial` with `THREE.AdditiveBlending`, `depthWrite: false`, and `color: 0xffaa33`. Applies $\pm 4\%$ breathing oscillation. Verified in `tests/graphics/fx/glow-halo.test.ts`. |
| 6 | SparklerSystem executes 300 sparkler particles in a single BufferGeometry with THREE.Points in 1 draw call per D-09 | ✓ VERIFIED | `src/graphics/fx/sparkler-system.ts` instantiates single `THREE.BufferGeometry` with pre-allocated Float32Array typed arrays for 300 particles (900 position floats, 900 color floats), rendered via `THREE.Points` (1 draw call, 0 GC during RAF). Verified in `tests/graphics/fx/sparkler-system.test.ts`. |
| 7 | SparklerSystem implements CPU Euler kinematics with downward gravity (g = -4.5), air drag (0.92), and outward radial velocity burst per D-10 | ✓ VERIFIED | `SparklerSystem.burst()` initializes particles with upward velocities (`1.8..3.6`) and radial horizontal velocities (`0.6..1.8`). `update(dt)` applies downward gravity ($g = -4.5$) and horizontal drag ($0.92^{dt \cdot 60}$) with clamped $dt \in [0.0, 0.1]$. Verified in `tests/graphics/fx/sparkler-system.test.ts`. |
| 8 | Sparkler particles transition from white-hot to golden amber to ember red over their 1.0-2.0s lifespans per D-10, D-11 | ✓ VERIFIED | `SparklerSystem.update()` evaluates lifetime progress: progress $< 0.4 \implies$ white-hot `[1.0, 0.95, 0.8]`, $0.4 \le \text{progress} < 0.8 \implies$ golden amber `[1.0, 0.65, 0.1]`, $\text{progress} \ge 0.8 \implies$ ember red `[0.85, 0.2, 0.05]`. Verified in `tests/graphics/fx/sparkler-system.test.ts`. |
| 9 | FlameController encapsulates FlameMesh, GlowHalo, SparklerSystem, and flamePointLight into a single coordinated group per D-12 | ✓ VERIFIED | `src/graphics/fx/flame-controller.ts` coordinates all 4 primitives inside `THREE.Group` (`flame-controller-group`), synchronizing updates and positioning them at `wickAnchor`. Verified in `tests/graphics/fx/flame-controller.test.ts`. |
| 10 | FlameController.ignite() initiates sparkler fountain burst and smoothly interpolates flame scale, glow intensity, and point light intensity using Cubic.Out easing over 750ms per D-04, D-06, D-11 | ✓ VERIFIED | `FlameController.ignite()` triggers `sparklerSystem.burst()`, tweens scale ($0 \to 1$), halo intensity ($0.001 \to 1.0$), and light intensity ($0.0001 \to 2.8$) over 750ms via `@tweenjs/tween.js` `Cubic.Out`. Idempotent guard prevents concurrent re-triggering. Verified in `tests/graphics/fx/flame-controller.test.ts`. |
| 11 | SceneManager integrates FlameController, updates it in the render loop, and triggers ignition when AppStateMachine transitions to IGNITING per D-12 | ✓ VERIFIED | `src/graphics/scene-manager.ts` builds `FlameController` during scene initialization, advances simulation in RAF, listens to FSM `IGNITING` transition, and triggers `IGNITION_COMPLETE` upon resolution. Verified in `tests/graphics/scene-manager.test.ts` and automated Chrome headless test. |
| 12 | All FX components implement comprehensive dispose() methods preventing GPU resource and memory leaks per D-13 | ✓ VERIFIED | `flameMesh.dispose()`, `glowHalo.dispose()`, `sparklerSystem.dispose()`, and `flameController.dispose()` deallocate geometries, shader materials, canvas textures, and clear groups. Verified in `tests/graphics/fx/flame-mesh.test.ts`, `glow-halo.test.ts`, `sparkler-system.test.ts`, `flame-controller.test.ts`, and `scene-manager.test.ts`. |
| 13 | Automated tests (91/91 passing) and production build clean (152 kB gz JS) | ✓ VERIFIED | Full Vitest test suite passes (15 test files, 91 tests). Production build (`tsc && vite build`) passes with 0 errors and generates minified bundle `dist/assets/index-Dm0dn0_Q.js` (599.12 kB / 152.04 kB gzip), within the <200 kB budget. |

**Score:** 13/13 truths verified (0 present, behavior-unverified)

---

## Required Artifacts

| Artifact | Expected Purpose | Exists | Substantive | Wired | Data Flows | Status | Details |
|----------|------------------|--------|-------------|-------|------------|--------|---------|
| [`src/graphics/fx/flame-shader.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/graphics/fx/flame-shader.ts) | Procedural GLSL vertex/fragment shaders and material factory | ✓ | ✓ | ✓ | ✓ | ✓ VERIFIED | Implements Stefan Gustavson 2D simplex noise, smoothstep base pinning, 3-color ramp, and uniform contracts |
| [`src/graphics/fx/flame-mesh.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/graphics/fx/flame-mesh.ts) | Teardrop ConeGeometry anchored at wickAnchor | ✓ | ✓ | ✓ | ✓ | ✓ VERIFIED | Builds `ConeGeometry(0.16, 0.45, 24, 16, true)` with base pivot translation and scale/time mutators |
| [`src/graphics/fx/glow-halo.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/graphics/fx/glow-halo.ts) | Single-pass additive billboard glow halo sprite | ✓ | ✓ | ✓ | ✓ | ✓ VERIFIED | Offscreen 128x128 radial gradient canvas texture, `AdditiveBlending`, depthWrite false, breathing scale update |
| [`src/graphics/fx/sparkler-system.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/graphics/fx/sparkler-system.ts) | Single-buffer 300-particle Euler kinematics sparkler fountain | ✓ | ✓ | ✓ | ✓ | ✓ VERIFIED | 300 particles in single `BufferGeometry`, pre-allocated typed arrays (0 GC), gravity $g = -4.5$, 3-stage color fade |
| [`src/graphics/fx/flame-controller.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/graphics/fx/flame-controller.ts) | Unified flame orchestrator with 750ms Cubic.Out tweening | ✓ | ✓ | ✓ | ✓ | ✓ VERIFIED | Aggregates all FX primitives, coordinates ignition tween, drives harmonic light jitter, and cascades disposal |
| [`src/graphics/lighting-rig.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/graphics/lighting-rig.ts) | Dual-tier nocturnal lighting with harmonic PointLight flicker | ✓ | ✓ | ✓ | ✓ | ✓ VERIFIED | Positions PointLight at `(0.0, 0.83, 1.38)` with `castShadow = false` and multi-frequency harmonic jitter calculation |
| [`src/graphics/scene-manager.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/src/graphics/scene-manager.ts) | WebGL engine integrating FlameController and FSM events | ✓ | ✓ | ✓ | ✓ | ✓ VERIFIED | Mounts controller group, drives RAF updates, handles `IGNITING` state transition, emits `IGNITION_COMPLETE` |
| [`tests/graphics/fx/flame-mesh.test.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/tests/graphics/fx/flame-mesh.test.ts) | Unit tests for FlameShader and FlameMesh | ✓ | ✓ | ✓ | N/A | ✓ VERIFIED | 6 passing unit tests asserting shader compilation, noise displacement, color stops, and geometry |
| [`tests/graphics/fx/flame-lighting.test.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/tests/graphics/fx/flame-lighting.test.ts) | Unit tests for flame PointLight position and harmonic flicker | ✓ | ✓ | ✓ | N/A | ✓ VERIFIED | 5 passing unit tests asserting position `(0.0, 0.83, 1.38)`, shadow settings, and harmonic jitter math |
| [`tests/graphics/fx/glow-halo.test.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/tests/graphics/fx/glow-halo.test.ts) | Unit tests for additive glow halo billboard sprite | ✓ | ✓ | ✓ | N/A | ✓ VERIFIED | 6 passing unit tests asserting 128x128 radial texture, additive blending, breathing scale, and disposal |
| [`tests/graphics/fx/sparkler-system.test.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/tests/graphics/fx/sparkler-system.test.ts) | Unit tests for 300-particle single-buffer sparkler system | ✓ | ✓ | ✓ | N/A | ✓ VERIFIED | 7 passing unit tests asserting 1 draw call, Euler kinematics, downward gravity, color stages, and cleanup |
| [`tests/graphics/fx/flame-controller.test.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/tests/graphics/fx/flame-controller.test.ts) | Unit tests for FlameController ignition orchestrator | ✓ | ✓ | ✓ | N/A | ✓ VERIFIED | 6 passing unit tests asserting primitive encapsulation, 750ms Cubic.Out tweening, idempotency, and disposal |
| [`tests/graphics/scene-manager.test.ts`](file:///c:/Users/Gourav/OneDrive/Desktop/Antigravity%20Projects/Diwali/tests/graphics/scene-manager.test.ts) | Integration tests for SceneManager FX lifecycle | ✓ | ✓ | ✓ | N/A | ✓ VERIFIED | 11 passing tests asserting scene composition, RAF forwarding, FSM ignition triggers, and cleanup |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `FlameMesh` | `DiyaMesh.wickAnchor` | Position vector copy `(0.0, 0.68, 1.38)` | ✓ WIRED | Anchored at tip of cotton wick; base vertices firmly pinned via `smoothstep(0.05, 0.9, uv.y)` |
| `flamePointLight` | `WickAnchor` | Position offset `(wickAnchor.x, wickAnchor.y + 0.15, wickAnchor.z)` | ✓ WIRED | Positioned at `(0.0, 0.83, 1.38)` with `castShadow = false` to eliminate mobile cubemap thermal collapse |
| `GlowHalo` | Post-Processing Pipeline | Direct `THREE.Sprite` additive billboard quad | ✓ WIRED | Replaces multi-pass `UnrealBloomPass` with 128x128 radial gradient canvas texture at 0 FBO pass overhead |
| `SparklerSystem` | Scene Graph | Single `THREE.Points` with 300 particles | ✓ WIRED | Single draw call with Float32Array buffers allocated once at construction; zero GC allocations in RAF |
| `FlameController` | `@tweenjs/tween.js` | `TWEEN.Tween` with `Cubic.Out` easing | ✓ WIRED | Smoothly animates flame scale ($0 \to 1$), halo ($0.001 \to 1.0$), and light ($0.0001 \to 2.8$) over 750ms |
| `SceneManager` | `AppStateMachine` | FSM subscription and event dispatch | ✓ WIRED | Subscribes to `IGNITING`, invokes `flameController.ignite()`, and emits `IGNITION_COMPLETE` upon resolution |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `FlameShader` | `uTime`, `uScale` | `FlameController.update(dt, elapsedTime)` and `ignite()` tween | Real simulation elapsed seconds and tween progress $[0.0, 1.0]$ | ✓ FLOWING |
| `flamePointLight` | `intensity` | `computeFlameLightIntensity(baseLightIntensity, elapsedTime)` | Multi-frequency harmonic jitter $[2.46, 3.14]$ modulating dynamic light | ✓ FLOWING |
| `GlowHalo` | `sprite.scale` | `setIntensity(factor)` and `update(elapsedTime)` | Real scale breathing factor $\pm 4\%$ centered around $1.8 \times \text{factor}$ | ✓ FLOWING |
| `SparklerSystem` | `positions`, `colors` | `update(dt)` Euler kinematics | Real numerical integration of gravity ($g = -4.5$), air drag ($0.92$), and color fade | ✓ FLOWING |
| `SceneManager` | `fsm.transition()` | `FlameController.ignite()` Promise resolution | Real asynchronous FSM transition `IGNITING` $\to$ `LIT_CELEBRATION` | ✓ FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Procedural GLSL Flame Shader & Teardrop Mesh | `npx vitest run tests/graphics/fx/flame-mesh.test.ts` | 6 passed (40ms) | ✓ PASS |
| PointLight Position & Harmonic Jitter | `npx vitest run tests/graphics/fx/flame-lighting.test.ts` | 5 passed (26ms) | ✓ PASS |
| Additive Glow Billboard Halo Sprite | `npx vitest run tests/graphics/fx/glow-halo.test.ts` | 6 passed (38ms) | ✓ PASS |
| 300-Particle Single-Buffer Sparkler System | `npx vitest run tests/graphics/fx/sparkler-system.test.ts` | 7 passed (207ms) | ✓ PASS |
| FlameController Ignition & Lifecycle | `npx vitest run tests/graphics/fx/flame-controller.test.ts` | 6 passed (128ms) | ✓ PASS |
| Full FX Suite | `npx vitest run tests/graphics/fx/ --reporter=verbose` | 30 passed in 5 files (4.01s) | ✓ PASS |
| SceneManager Integration | `npx vitest run tests/graphics/scene-manager.test.ts` | 11 passed (433ms) | ✓ PASS |
| Complete Test Suite | `npm test` | 91 passed in 15 files (13.63s) | ✓ PASS |
| Production Build Compilation | `npm run build` (`tsc && vite build`) | Built in 2.80s; JS bundle 152.04 kB gzip | ✓ PASS |
| Headless Chrome Ignition Flow | `node scripts/verify-flame.js` | Transitioned `UNLOCKED_INTRO` $\to$ `INTERACTIVE_UNLIT` $\to$ `IGNITING` $\to$ `LIT_CELEBRATION`, `finalLit: true`, light intensity 2.48, saved `mobile_ignited.png` | ✓ PASS |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| **VFX-01** | `03-01-PLAN.md` | Igniting the wick animates a procedural GLSL flame with organic simplex noise flutter and warm color gradient | ✓ SATISFIED | `FlameShader` implements Stefan Gustavson 2D simplex noise vertex waft, smoothstep base pinning to `wickAnchor`, and 3-color ramp from indigo to golden amber to incandescent yellow. `FlameMesh` builds teardrop cone geometry anchored at `(0.0, 0.68, 1.38)`. |
| **VFX-02** | `03-01-PLAN.md` | Lit flame casts dynamic warm amber PointLight illuminating the earthen diya rim and sacred floor pattern | ✓ SATISFIED | `createLightingRig` establishes `flamePointLight` at `(0.0, 0.83, 1.38)` with `castShadow = false`. `computeFlameLightIntensity` computes non-repeating candle convection via 14.0 and 27.0 rad/s frequencies. |
| **VFX-03** | `03-01-PLAN.md` | Single-pass additive glow billboard quad creates a radiant golden halo without expensive post-processing bloom passes | ✓ SATISFIED | `GlowHalo` generates 128x128 radial gradient canvas texture and renders an additive billboard `THREE.Sprite` with breathing scale oscillation, bypassing multi-pass `UnrealBloomPass` to preserve 60 FPS on mobile. |
| **VFX-04** | `03-02-PLAN.md` | Ignition triggers a celebratory golden sparkler particle fountain (*phuljhadi*) bursting outward | ✓ SATISFIED | `SparklerSystem` simulates 300 particles in a single `BufferGeometry` and 1 draw call, updating Float32Array typed arrays via Euler kinematics ($g = -4.5$, drag $0.92$) and 3-stage color transitions (white-hot $\to$ golden $\to$ ember red). |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | None | — | Zero blocker debt markers (`TBD`, `FIXME`, `TODO`, `HACK`) or empty stub patterns detected across modified source files. |

---

## Human Verification Required

### 1. Visual Verification of Organic Flame Flutter & Gradient Ramp

**Test:** Open http://localhost:3000 in Chrome mobile device emulation (e.g., iPhone 14) or on a physical smartphone. Unlock with passcode `DIWALI`. Trigger ignition to observe the flame.  
**Expected:** The flame rises smoothly with organic 2D simplex noise convection waves. The base remains anchored to the wick tip without detachment. The vertical color gradient exhibits deep nocturnal indigo at the bottom, rich golden amber in the mid-belly, and bright incandescent yellow-white at the tip with soft edge alpha dissolve.  
**Why human:** Visual aesthetic balance, noise turbulence naturalness, and subjective festive atmosphere require human eye evaluation on display hardware.

### 2. Single-Pass Additive Glow Halo & Mobile Performance Feel

**Test:** Observe the golden halo surrounding the flame on a mobile device and gently pan around the diya.  
**Expected:** The halo radiates an ethereal golden aura with smooth radial falloff and subtle breathing oscillation, maintaining 60 FPS without frame drops, thermal throttling, or clipping artifacts.  
**Why human:** Visual perception of bloom luminescence and mobile rendering fluidity cannot be measured purely through headless DOM assertions.

### 3. Sparkler Fountain (Phuljhadi) Burst Dynamics

**Test:** Observe the sparkler burst erupting at the instant of ignition.  
**Expected:** 300 golden sparks spray upward in a festive conical fountain, arc downward with convincing gravity kinematics, and transition smoothly through white-hot, golden-amber, and ember-red before extinguishing naturally over ~1.5 seconds.  
**Why human:** Celebratory timing, spark density balance, and physical motion feel are best validated interactively.

---

## Gaps Summary

No gaps found. All 13 must-haves verified, all 4 phase requirements (`VFX-01`, `VFX-02`, `VFX-03`, `VFX-04`) satisfied, all 91 automated unit and integration tests passing, and production build compiles with zero TypeScript errors into a compact 152 kB gzipped JavaScript bundle.

---

_Verified: 2026-11-04T04:15:00Z_  
_Verifier: the agent (gsd-verifier)_
