# Phase 3: Procedural GLSL Flame Shader, Additive Bloom & Particle FX - Context

**Gathered:** 2026-11-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the visual effects core for the ceremonial Diya ignition: an organic procedural GLSL flame shader atop the cotton wick (`WickAnchor`), real-time flickering warm amber `PointLight` illumination, a single-pass additive glow billboard halo (avoiding expensive full-screen bloom passes), and an atmospheric golden sparkler (*phuljhadi*) particle burst that erupts on ignition.

</domain>

<decisions>
## Implementation Decisions

### 1. Procedural Flame Mesh & GLSL Shader
- **D-01:** **Teardrop Mesh Geometry**: Flame geometry constructed from a tapered cylinder or lathe curve resembling an organic teardrop (~0.45 units high, ~0.16 units radius at widest belly), anchored at `WickAnchor` `(0.0, 0.68, 1.38)` exported from Phase 2.
- **D-02:** **Vertex Displacement**: Custom `THREE.ShaderMaterial` with vertex shader applying 2D simplex/perlin noise displacement and high-frequency sinusoidal waft (`uTime * 8.0`) tapering toward the tip to simulate organic thermal convection and flickering licks.
- **D-03:** **Fragment Color Gradient & Alpha Dissolve**: Vertical UV interpolation:
  - Base: Deep indigo/blue core (`#1d2440` / `#2a3b6e`)
  - Mid-belly: Saturated festive golden-amber (`#ff8800` / `#ffaa22`)
  - Tip & Rim: Incandescent yellow-white (`#fff4cc`) fading to zero opacity at outer boundary.
- **D-04:** **Ignition Scale Transition**: Uniform `uScale` interpolated from `0.0` (unlit) to `1.0` (fully ignited) using `@tweenjs/tween.js` with Back.Out or Cubic.Out easing upon entering `IGNITING` / `LIT_CELEBRATION`.

### 2. Dynamic PointLight Illumination
- **D-05:** **Warm Amber PointLight**: Positioned 0.15 units directly above `WickAnchor` `(0.0, 0.83, 1.38)`.
- **D-06:** **Intensity Flickering**: Base intensity scales from 0.0001 (unlit) to 2.8 (lit). Once lit, updates in RAF with multi-frequency sinusoidal harmonic jitter (`intensity = 2.8 + sin(uTime * 14.0) * 0.22 + cos(uTime * 27.0) * 0.12`) casting organic dancing light across the Diya rim, oil puddle, and brass thali platter.

### 3. Mobile Additive Glow Halo (Zero Post-Processing Overhead)
- **D-07:** **Procedural Billboard Glow Quad**: A single facing billboard quad (`THREE.Sprite` or camera-oriented quad) positioned at flame center with `THREE.AdditiveBlending`, `depthWrite: false`.
- **D-08:** **Radial Gradient Texture**: 128x128 offscreen canvas texture with multi-stop radial gradient (golden incandescent core fading exponentially to dark transparent edges), eliminating all costly multi-pass FBO bloom (`UnrealBloomPass`) to preserve solid 60 FPS on mid-tier mobile hardware.

### 4. Sparkler Particle Physics (*Phuljhadi*)
- **D-09:** **Single-Buffer Particle System**: 250–350 sparkler particles managed in a single `THREE.BufferGeometry` with `THREE.Points` and `THREE.AdditiveBlending`.
- **D-10:** **Euler Kinematics & Gravity**: Particle attributes `position`, `velocity`, `lifetime`, and `size`. On ignition, particles burst outward radially from `WickAnchor` with initial velocities (`v_y: 1.5..3.5`, `v_xz: -1.8..1.8`), subjected to downward gravity (`g = -4.5`) and drag, expiring over 1.2–2.0 seconds.
- **D-11:** **Fountain Burst Lifecycle**: Emits celebratory burst upon ignition (`AppStateMachine` transitioning to `IGNITING`), then transitions into gentle micro-embers that occasionally sizzle and pop off the flame tip.

### 5. Architectural Integration & State Synchronization
- **D-12:** **FlameController Component**: Encapsulates flame mesh, glow halo, point light, and sparkler system. Subscribes to `AppStateMachine` (`IGNITING` -> ignite, `LIT_CELEBRATION` -> continuous burn).
- **D-13:** **Resource Management**: Implements comprehensive `dispose()` deallocating shader materials, buffer geometries, and canvas textures.

</decisions>

<canonical_refs>
## Canonical References

- `GEMINI.md` § 3D Asset & Shader Pipeline — Procedural flame shader and sparkler system specs
- `GEMINI.md` § What NOT to Use — Avoid full-screen post-processing bloom; use additive billboard halo
- `.planning/ROADMAP.md` § Phase 3 — VFX-01, VFX-02, VFX-03, VFX-04
- `.planning/phases/02-webgl-scene-engine-camera-rig-3d-diya-mesh/02-VERIFICATION.md` — Verified `WickAnchor` at `(0.0, 0.68, 1.38)` and pre-warmed PointLight
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/graphics/scene-manager.ts`: Core render loop, camera rig, and scene graph. `FlameController` will mount directly into `sceneManager.scene`.
- `src/app/state-machine.ts`: `AppStateMachine` triggers `IGNITING` and `LIT_CELEBRATION`.
- `src/graphics/lighting-rig.ts`: Pre-warmed unlit flame `PointLight` already exists at `wickAnchor` (intensity: 0.0001); `FlameController` can take ownership or update it.
- `src/graphics/meshes/diya-mesh.ts`: Exports `wickAnchor` `(0.0, 0.68, 1.38)`.

</code_context>
