---
phase: 02-webgl-scene-engine-camera-rig-3d-diya-mesh
plan: 01
subsystem: graphics-engine
tags:
  - three.js
  - camera-rig
  - webgl
  - procedural-textures
  - dpr-clamping
  - tween.js
dependency_graph:
  requires:
    - 01-01
    - 01-02
  provides:
    - ProceduralTextures
    - CameraRig
    - SceneManager
  affects:
    - 02-02
tech_stack:
  added:
    - three@^0.187.0
    - "@tweenjs/tween.js@^25.0.0"
    - "@types/three@^0.187.0"
  patterns:
    - Procedural Offscreen CanvasTexture Generation
    - Trigonometric Portrait vFOV Compensation
    - Lissajous Figure-8 Breathing Sway
    - DPR Clamping (<= 1.75) for Mobile GPU Safety
    - WebGL Context Recovery Lifecycle
key_files:
  created:
    - src/graphics/materials/procedural-textures.ts
    - src/graphics/materials/material-palette.ts
    - src/graphics/camera-rig.ts
    - src/graphics/scene-manager.ts
    - tests/graphics/procedural-textures.test.ts
    - tests/graphics/camera-rig.test.ts
    - tests/graphics/scene-manager.test.ts
  modified:
    - package.json
    - package-lock.json
decisions:
  - "Installed three@0.187.0 and @tweenjs/tween.js@25.0.0 as verified production dependencies"
  - "Used offscreen CanvasTextures for 512x512 micro-porous clay bump, roughness, and color with zero network downloads"
  - "Preserved base 45° FOV on landscape viewports and mathematically expanded vertical FOV on portrait viewports (aspect < 1.0) to maintain constant horizontal framing"
  - "Clamped pointer parallax to ±15° yaw and ±10° pitch with spring auto-return and 8-second Lissajous breathing sway"
  - "Clamped devicePixelRatio to Math.min(window.devicePixelRatio || 1, 1.75) and paused render loop on document.hidden"
metrics:
  duration: 10m
  completed_date: "2026-11-04"
status: complete
actuals:
  tokens: 42000
  tasks: 3
  commits: 3
  plan_head_before: c862a1af4aa1c7d0bc4ecd0ef1dc3662141e3d48
  plan_head_after: 46373cbb16a1657daa7187e387abdedeb8c7f793
---

# Phase 2 Plan 1: WebGL Scene Engine Foundation & Responsive Camera Rig Summary

Zero-network procedural clay CanvasTexture generator, portrait-compensated 3D CameraRig with Lissajous breathing sway, and resilient WebGL SceneManager foundation with DPR clamping and context recovery.

## Overview of Work

Plan 02-01 established the foundational WebGL graphics runtime for the Diwali 3D interactive greeting experience:

1. **3D Engine Dependencies & Procedural Texturing**: Installed `three@^0.187.0` and `@tweenjs/tween.js@^25.0.0` along with `@types/three@^0.187.0`. Implemented `generateProceduralClayTextures()` in `src/graphics/materials/procedural-textures.ts` which bakes 512x512 bump, roughness, and diffuse color onto offscreen canvas elements at boot in <8ms with zero external network downloads. Implemented `createMaterialPalette()` in `src/graphics/materials/material-palette.ts` defining PBR materials for terracotta, oil pool, cotton wick, and antique brass thali.
2. **Responsive Mobile CameraRig**: Implemented `CameraRig` in `src/graphics/camera-rig.ts` supporting cinematic 3/4 elevated angle (0, 2.3, 3.8) pointing at (0, 0.25, 0). Implemented trigonometric portrait vertical FOV compensation (`vFov = 2 * atan(tan(baseFov / 2) / aspect)`) preserving consistent horizontal Diya bowl width across iPhone SE, tall Android smartphones, and tablets. Implemented damped pointer parallax clamped to ±15° yaw and ±10° pitch (ASVS V5 input boundary safety), spring auto-return to center upon touch release, an 8-second Lissajous figure-8 breathing sway, and tweened dolly/pan helpers.
3. **Resilient SceneManager Engine Foundation**: Implemented `SceneManager` in `src/graphics/scene-manager.ts` creating a transparent WebGL canvas mounted behind the UI overlay (z-index 0) with `touch-action: none`. Clamped `devicePixelRatio` to `Math.min(window.devicePixelRatio || 1, 1.75)` to eliminate Retina GPU fill-rate overheating. Enabled `PCFSoftShadowMap` for directional contact shadows. Integrated the Page Visibility API (`document.visibilitychange`) to pause the render loop on backgrounded tabs and resume on return. Implemented WebGL context loss recovery (`webglcontextlost` and `webglcontextrestored`).

## Key Changes by File

- `package.json`: Added `three`, `@tweenjs/tween.js` to `dependencies` and `@types/three` to `devDependencies`.
- `src/graphics/materials/procedural-textures.ts`: Offscreen 512x512 procedural canvas texture generator with horizontal pottery striations, micro-porous noise, earthenware roughness (195-235), and Indian red clay diffuse color.
- `src/graphics/materials/material-palette.ts`: Factory creating `terracotta`, `oilPool`, `wick`, and `brassThali` `MeshStandardMaterial` instances.
- `src/graphics/camera-rig.ts`: Responsive perspective camera rig with portrait vFOV compensation, damped parallax, Lissajous breathing sway, and Tween.js transitions.
- `src/graphics/scene-manager.ts`: Core WebGL scene lifecycle manager with clamped DPR, shadow maps, tab visibility suspension, and context loss resilience.
- `tests/graphics/procedural-textures.test.ts`: Automated unit test suite verifying 512x512 canvas texture dimensions, RepeatWrapping, pixel ranges, and material palette generation.
- `tests/graphics/camera-rig.test.ts`: Unit tests validating base landscape FOV, portrait vFOV expansion, parallax clamping, auto-return, Lissajous sway, and Tween.js dolly/pan.
- `tests/graphics/scene-manager.test.ts`: Unit tests covering DPR clamping (1.75 on 3.0x Retina), PCFSoftShadowMap, canvas styling, visibility pausing, and context loss recovery.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Tween.js v25 Group Binding**
- **Found during:** Task 2 (CameraRig)
- **Issue:** `@tweenjs/tween.js` v25 default constructor `new TWEEN.Tween(obj)` does not add the instance to `mainGroup` unless explicitly passed `group: true` or registered with `TWEEN.add(tween)`. Calling `TWEEN.update()` without this left tweens un-updated.
- **Fix:** Initialized tweens with `new TWEEN.Tween(obj, true)` and called `TWEEN.add(tween)` to guarantee updates via `TWEEN.update()`.
- **Files modified:** `src/graphics/camera-rig.ts`, `tests/graphics/camera-rig.test.ts`
- **Commit:** `cd4d3a7`

**2. [Rule 1 - Modernization] THREE.Timer Migration**
- **Found during:** Task 3 (SceneManager)
- **Issue:** Three.js v0.187.0 deprecated `THREE.Clock` in favor of `THREE.Timer`, emitting console deprecation warnings during testing.
- **Fix:** Replaced `THREE.Clock` with `THREE.Timer` using `timer.update()` and `timer.getDelta()`.
- **Files modified:** `src/graphics/scene-manager.ts`
- **Commit:** `46373cb`

## Threat Flags

None — all pointer inputs and lifecycle events conform to ASVS V5 input boundary validation and T-02-01 / T-02-02 mitigations.

## Self-Check: PASSED

1. Created files exist on disk:
   - `src/graphics/materials/procedural-textures.ts`: FOUND
   - `src/graphics/materials/material-palette.ts`: FOUND
   - `src/graphics/camera-rig.ts`: FOUND
   - `src/graphics/scene-manager.ts`: FOUND
   - `tests/graphics/procedural-textures.test.ts`: FOUND
   - `tests/graphics/camera-rig.test.ts`: FOUND
   - `tests/graphics/scene-manager.test.ts`: FOUND
2. Task commits verified in git history:
   - `22c06f1`: FOUND
   - `cd4d3a7`: FOUND
   - `46373cb`: FOUND
3. Full test suite passing:
   - 47 passed across 7 test files (`npm test`)
