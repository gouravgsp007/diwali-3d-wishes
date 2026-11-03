---
phase: 03-procedural-glsl-flame-shader-additive-bloom-particle-fx
plan: 01
subsystem: graphics
tags: [three, glsl, shader, flame, noise, pointlight, bloom, halo, vitest]

requires:
  - phase: 02-webgl-scene-engine-camera-rig-3d-diya-mesh
    provides: WickAnchor coordinate (0.0, 0.68, 1.38), dual-tier lighting rig, SceneManager
provides:
  - FlameShader with Stefan Gustavson 2D simplex noise vertex waft and 3-color ramp
  - FlameMesh teardrop ConeGeometry anchored at wickAnchor (0.0, 0.68, 1.38)
  - computeFlameLightIntensity harmonic jitter with 14.0 rad/s and 27.0 rad/s angular frequencies
  - GlowHalo single-pass additive billboard sprite with 128x128 radial gradient canvas texture
affects:
  - 03-procedural-glsl-flame-shader-additive-bloom-particle-fx
  - 04-audio-web-audio-api-soundtrack-sfx-haptic-engine

actuals:
  tokens: 5928
  tasks: 3
  commits: 3
  plan_head_before: 50e2a4ef3c5d9d083f04e8bc8270b337566c6b07
  plan_head_after: 7f0518fff26cc73809b0ce84ec1817b7ce543be5

tech-stack:
  added: []
  patterns:
    - Procedural GLSL ShaderMaterial with Stefan Gustavson 2D simplex noise and smoothstep base pinning
    - Multi-frequency sinusoidal harmonic jitter for PointLight convection flicker
    - Single-pass additive billboard sprite with procedural offscreen canvas radial gradient for zero-FBO bloom

key-files:
  created:
    - src/graphics/fx/flame-shader.ts
    - src/graphics/fx/flame-mesh.ts
    - src/graphics/fx/glow-halo.ts
    - tests/graphics/fx/flame-mesh.test.ts
    - tests/graphics/fx/flame-lighting.test.ts
    - tests/graphics/fx/glow-halo.test.ts
  modified:
    - src/graphics/lighting-rig.ts
    - tests/graphics/lighting-and-particles.test.ts

key-decisions:
  - "D-01/D-02: Used ConeGeometry(0.16, 0.45, 24, 16, true) translated upward by height/2 (0.225) to anchor pivot at base; pinned base vertices with smoothstep(0.05, 0.9, uv.y)"
  - "D-05/D-06: Positioned flamePointLight 0.15 units above wickAnchor at (0.0, 0.83, 1.38) with castShadow=false to avoid mobile cubemap thermal collapse, animated via multi-frequency harmonic jitter (14.0 and 27.0 rad/s)"
  - "D-07/D-08: Replaced expensive post-processing UnrealBloomPass with a single-pass additive billboard sprite using a 128x128 radial gradient CanvasTexture"

patterns-established:
  - "Flame vertex waft pins base vertices firmly to the cotton wick using smoothstep height attenuation"
  - "PointLight candle flicker evaluates dual incommensurate frequencies without random jumps or allocations"
  - "Single-pass additive billboard halo provides luminous bloom aesthetics at zero FBO render pass cost"

requirements-completed:
  - VFX-01
  - VFX-02
  - VFX-03

coverage:
  - id: D1
    description: "FlameShader procedural GLSL material and FlameMesh teardrop geometry"
    requirement: VFX-01
    verification:
      - kind: unit
        ref: "tests/graphics/fx/flame-mesh.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Dynamic flame PointLight illumination and harmonic jitter"
    requirement: VFX-02
    verification:
      - kind: unit
        ref: "tests/graphics/fx/flame-lighting.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Single-pass additive glow billboard halo sprite"
    requirement: VFX-03
    verification:
      - kind: unit
        ref: "tests/graphics/fx/glow-halo.test.ts"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-11-04
status: complete
---

# Phase 03 Plan 01: Procedural GLSL Flame Shader, Additive Bloom & Lighting Summary

**Procedural GLSL flame shader with 2D simplex noise vertex wafting, dynamic harmonic PointLight jitter, and zero-FBO additive glow billboard halo sprite**

## Performance

- **Duration:** 6 min
- **Started:** 2026-11-04T03:41:30Z
- **Completed:** 2026-11-04T03:47:30Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Implemented `FlameShader` in `src/graphics/fx/flame-shader.ts` with Stefan Gustavson 2D simplex noise displacement, smoothstep height base pinning (`smoothstep(0.05, 0.9, uv.y)`), and 3-color fragment ramp (deep indigo `#1d2440` to festive golden amber `#ff8800` to incandescent yellow `#fff4cc`) with edge and tip alpha dissolve.
- Implemented `FlameMesh` in `src/graphics/fx/flame-mesh.ts` using `ConeGeometry(0.16, 0.45, 24, 16, true)` translated upward along Y by 0.225 so local origin is anchored at the base, positioned atop `wickAnchor` `(0.0, 0.68, 1.38)`.
- Enhanced `LightingRig` with `computeFlameLightIntensity` pure function calculating non-repeating candle convection flicker using irrational angular frequencies (14.0 rad/s and 27.0 rad/s), positioned `flamePointLight` 0.15 units above `wickAnchor` at `(0.0, 0.83, 1.38)`, and maintained `castShadow = false` to eliminate 6-pass cubemap overhead on mobile devices.
- Implemented `GlowHalo` in `src/graphics/fx/glow-halo.ts` with 128x128 5-stop radial gradient canvas texture and `THREE.Sprite` with `AdditiveBlending` and breathing scale oscillation, bypassing multi-pass `UnrealBloomPass` to protect solid 60 FPS mobile performance.
- Added comprehensive unit test suites covering all components (`flame-mesh.test.ts`, `flame-lighting.test.ts`, `glow-halo.test.ts`) with 100% pass rate (77 total tests passing).

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement Procedural GLSL Flame Shader and Teardrop FlameMesh** - `0cf6f3d` (feat)
2. **Task 2: Implement Dynamic Flame PointLight Illumination and Multi-Frequency Harmonic Jitter** - `70bad1e` (feat)
3. **Task 3: Implement Single-Pass Additive Glow Billboard Halo Sprite** - `7f0518f` (feat)

## Files Created/Modified

- `src/graphics/fx/flame-shader.ts` - GLSL vertex and fragment shaders with 2D simplex noise and 3-color ramp, factory for `ShaderMaterial`
- `src/graphics/fx/flame-mesh.ts` - `FlameMesh` class with teardrop cone geometry, base translation, anchor positioning, scale bounds clamping, and GPU disposal
- `src/graphics/lighting-rig.ts` - `computeFlameLightIntensity` pure function with harmonic jitter calculation and updated `flamePointLight` positioning
- `src/graphics/fx/glow-halo.ts` - `GlowHalo` class with 128x128 radial gradient canvas texture, `THREE.Sprite`, `AdditiveBlending`, and breathing scale animation
- `tests/graphics/fx/flame-mesh.test.ts` - Unit tests for `createFlameMaterial`, GLSL shader strings, and `FlameMesh`
- `tests/graphics/fx/flame-lighting.test.ts` - Unit tests for `computeFlameLightIntensity`, bounds, clamping, and `createLightingRig` positioning
- `tests/graphics/fx/glow-halo.test.ts` - Unit tests for `GlowHalo` texture, sprite material, positioning, intensity scaling, and disposal
- `tests/graphics/lighting-and-particles.test.ts` - Updated `flamePointLight.position.y` expectation to match D-05 position (`wickAnchor.y + 0.15`)

## Decisions Made

- [D-01, D-02] Translated `ConeGeometry` upward by `height / 2 = 0.225` so the mesh pivot is directly at the cone base, and pinned base vertices with `smoothstep(0.05, 0.9, uv.y)` to avoid flame disconnection from the wick.
- [D-05, D-06] Positioned `flamePointLight` at `(0.0, 0.83, 1.38)`, 0.15 units above the cotton wick tip, keeping `castShadow = false` to eliminate 6-pass cubemap shadow rendering on mobile chipsets.
- [D-07, D-08] Procedural 128x128 offscreen canvas texture mapped to an additive billboard quad provides warm golden bloom without post-processing downsampling passes (`UnrealBloomPass`).
- [D-13] Provided explicit `dispose()` methods on `FlameMesh` and `GlowHalo` deallocating geometry, materials, and canvas textures to prevent WebGL memory leaks.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated lighting-and-particles.test.ts flamePointLight Y position expectation to wickAnchor.y + 0.15**
- **Found during:** Task 2 (Dynamic flame PointLight illumination)
- **Issue:** Phase 2 test `tests/graphics/lighting-and-particles.test.ts` asserted `flamePointLight.position.y` was at `wickAnchor.y` (0.68). In Phase 3, D-05 elevated the light 0.15 units above the wick tip to (0.0, 0.83, 1.38).
- **Fix:** Updated the expectation to `expect(rig.flamePointLight.position.y).toBeCloseTo(wickAnchor.y + 0.15, 2)`.
- **Files modified:** `tests/graphics/lighting-and-particles.test.ts`
- **Verification:** `npx vitest run tests/graphics/lighting-and-particles.test.ts` passed.
- **Committed in:** `70bad1e` (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 bug fix in existing test assertion)  
**Impact on plan:** Essential alignment with D-05 specification. Zero regressions or scope creep.

## Issues Encountered

None. All GLSL vertex and fragment shaders compiled cleanly, and all 77 test cases across 13 test files passed without regressions.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `FlameMesh`, `GlowHalo`, and `computeFlameLightIntensity` are complete and verified.
- Wave 2 (`03-02-PLAN.md`) can proceed with `SparklerSystem` particle burst and `FlameController` top-level orchestration integrating with `AppStateMachine` and `SceneManager`.

## Self-Check: PASSED
- `src/graphics/fx/flame-shader.ts`: FOUND
- `src/graphics/fx/flame-mesh.ts`: FOUND
- `src/graphics/lighting-rig.ts`: FOUND
- `src/graphics/fx/glow-halo.ts`: FOUND
- `tests/graphics/fx/flame-mesh.test.ts`: FOUND
- `tests/graphics/fx/flame-lighting.test.ts`: FOUND
- `tests/graphics/fx/glow-halo.test.ts`: FOUND
- Commit 0cf6f3d: FOUND
- Commit 70bad1e: FOUND
- Commit 7f0518f: FOUND

---
*Phase: 03-procedural-glsl-flame-shader-additive-bloom-particle-fx*
*Completed: 2026-11-04*
