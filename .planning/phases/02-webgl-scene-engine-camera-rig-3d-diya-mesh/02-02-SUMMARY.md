---
phase: 02-webgl-scene-engine-camera-rig-3d-diya-mesh
plan: 02
subsystem: graphics-engine
tags:
  - three.js
  - procedural-diya
  - lathe-geometry
  - soft-shadows
  - pcf-shadows
  - lighting-rig
  - bokeh-motes
  - camera-dolly
dependency_graph:
  requires:
    - 02-01
  provides:
    - ProceduralDiyaGeometry
    - DiyaMesh
    - BrassThaliMesh
    - DualTierLightingRig
    - BokehMotes
    - SceneManagerBootstrap
  affects:
    - 03-01
tech_stack:
  added: []
  patterns:
    - Procedural LatheGeometry with CPU +Z Spout & Harmonic Scallop Displacement
    - Cotton Wick Tube leading to normalized WickAnchor
    - Dark Antique Brass Platter with Concentric Radial Engravings
    - Dual-Tier Lighting with Nocturnal Ambient Fill & PCFSoftShadowMap
    - Pre-warmed PointLight with Shader Pre-compilation (T-02-04)
    - Single Draw-Call Additive Golden Bokeh Motes
    - FSM-Driven Cinematic Camera Dolly and Upward Tilt Pan
key_files:
  created:
    - src/graphics/meshes/procedural-diya-geometry.ts
    - src/graphics/meshes/diya-mesh.ts
    - src/graphics/meshes/diya-loader.ts
    - src/graphics/meshes/thali-mesh.ts
    - src/graphics/lighting-rig.ts
    - src/graphics/particles/bokeh-motes.ts
    - tests/graphics/procedural-diya.test.ts
    - tests/graphics/lighting-and-particles.test.ts
    - tests/main.test.ts
  modified:
    - src/graphics/scene-manager.ts
    - src/main.ts
    - index.html
    - tests/graphics/scene-manager.test.ts
decisions:
  - "Procedural LatheGeometry generates an authentic terracotta diya bowl with pinched pouring spout (+Z displacement) and 14-harmonic scalloped rim at boot with zero network downloads"
  - "Exported normalized WickAnchor coordinate at (0.0, 0.68, 1.38) providing exact placement for pre-warmed PointLight and Phase 3 flame shader"
  - "Created circular dark antique brass thali platter positioned at y: -0.02 receiving PCFSoftShadowMap directional contact shadows"
  - "Dual-tier lighting rig establishes nocturnal indigo ambient fill (0x140c2e, 0.55), warm golden rim directional light (0xffb255, 1.8), and unlit flame PointLight (0.0001) pre-compiled via renderer.compile() to avoid ignition stutters"
  - "Wafted 50 golden bokeh motes in single draw call using AdditiveBlending and depthWrite = false"
  - "Wired SceneManager into application bootstrap in main.ts with FSM transitions triggering camera dolly forward on UNLOCKED_INTRO and upward pan on IGNITING"
metrics:
  duration: 8m
  completed_date: "2026-11-04"
status: complete
actuals:
  tokens: 9670
  tasks: 3
  commits: 3
  plan_head_before: 1a6e3d3e90cf0eea53377bb84a0a49036f228f94
  plan_head_after: 6411b438aef66606cf0262197bdeb0289fa91ee9
---

# Phase 2 Plan 2: Procedural Earthen Diya, Brass Thali, Lighting Rig & Scene Integration Summary

Authentic 3D terracotta Diya mesh with pinched spout displacement, 14-harmonic scalloped rim, glossy oil pool, cotton wick with normalized WickAnchor, circular dark brass thali platter with soft shadows, dual-tier nocturnal lighting with pre-warmed PointLight, 50 drifting golden bokeh motes, and seamless application bootstrap with state-driven camera dolly transitions.

## Overview of Work

Plan 02-02 realized the authentic ceremonial centerpiece of the Diwali 3D interactive greeting experience:

1. **Procedural Terracotta Diya & Cotton Wick**:
   - Implemented `createProceduralDiyaGeometry` in `src/graphics/meshes/procedural-diya-geometry.ts` generating a 64-segment `LatheGeometry` bowl. Applied single-pass CPU vertex displacement pulling the pouring spout forward along `+Z` (>1.5 units) with cosine angular falloff and upward lip tilt, and modulated outer rim vertices with a 14-harmonic sine wave scallop pattern.
   - Implemented `DiyaMesh` in `src/graphics/meshes/diya-mesh.ts` aggregating the displaced bowl mesh with baked clay textures, a glossy amber oil pool disc (`roughness: 0.06`, `opacity: 0.90`), and a charred cotton wick tube following a 3D curve through the spout to the exported `WickAnchor` coordinate `(0.0, 0.68, 1.38)` for Phase 3 flame shader alignment.
   - Implemented `loadDiyaModelWithFallback` in `src/graphics/meshes/diya-loader.ts` to seamlessly fallback to procedural geometry if `/models/diya.glb` is absent.

2. **Circular Antique Brass Thali Platter**:
   - Implemented `createBrassThaliMesh` in `src/graphics/meshes/thali-mesh.ts` generating a circular platter (`radius: 2.35`, `height: 0.10` with raised lip) textured with a procedural 512x512 concentric engraving bump map, antique brass `MeshStandardMaterial` (`metalness: 0.88`, `roughness: 0.38`), and configured to receive real-time directional soft shadows beneath the Diya.

3. **Dual-Tier Nocturnal Lighting Rig**:
   - Implemented `createLightingRig` in `src/graphics/lighting-rig.ts` setting a soft nocturnal indigo ambient fill (`0x140c2e`, intensity 0.55), a warm golden rim directional light (`0xffb255`, intensity 1.8) at `(2.0, 4.5, -2.5)` with a 1024x1024 `PCFSoftShadowMap` (bias `-0.001`), and an unlit flame `PointLight` (`intensity: 0.0001`) placed at `WickAnchor`. Pre-warmed via `renderer.compile(scene, camera)` to eliminate ignition shader compilation stutters (T-02-04).

4. **Drifting Golden Bokeh Motes**:
   - Implemented `BokehMotes` in `src/graphics/particles/bokeh-motes.ts` dispersing 50 particles in a single draw call around and behind the Diya using `THREE.Points` with soft circular radial glow canvas textures, `THREE.AdditiveBlending`, and `depthWrite: false`.

5. **App Bootstrap & FSM Camera Integration**:
   - Integrated `SceneManager` into `src/main.ts` bootstrap, mounting the WebGL canvas into `#app` behind the `#passcode-card` modal (`relative z-10`).
   - Connected `SceneManager` to `AppStateMachine` transitions: triggering `cameraRig.dollyTo(new THREE.Vector3(0, 2.0, 3.2), 1200)` on `UNLOCKED_INTRO` for a smooth celebratory push-in as the passcode card fades, and `cameraRig.panTargetTo(new THREE.Vector3(0, 0.65, 0), 1000)` on `IGNITING` to tilt upward framing the tall flame and greeting reveal.

## Key Changes by File

- `src/graphics/meshes/procedural-diya-geometry.ts`: Procedural `LatheGeometry` with CPU spout displacement (+Z > 1.5), 14-harmonic scalloped rim, and exported `WickAnchor` coordinate `(0.0, 0.68, 1.38)`.
- `src/graphics/meshes/diya-mesh.ts`: Assembly class grouping terracotta bowl, glossy amber oil pool, and cotton wick tube with complete GPU resource disposal.
- `src/graphics/meshes/diya-loader.ts`: Hybrid loader attempting `/models/diya.glb` with silent fallback to procedural geometry.
- `src/graphics/meshes/thali-mesh.ts`: Circular dark antique brass thali platter with concentric circular engraving bump map receiving soft shadows at `y: -0.02`.
- `src/graphics/lighting-rig.ts`: Dual-tier lighting rig with nocturnal ambient fill, golden rim light with 1024x1024 soft shadow map, and pre-warmed PointLight.
- `src/graphics/particles/bokeh-motes.ts`: Single draw-call 50-particle drifting golden bokeh system with `AdditiveBlending`.
- `src/graphics/scene-manager.ts`: Integrated meshes, lighting, bokeh motes, shader pre-warming (`renderer.compile`), context restoration rebuild, and FSM dolly/pan transitions.
- `src/main.ts`: Mounted `SceneManager` at bootstrap and updated return signature to `{ fsm, passcodeGate, sceneManager }`.
- `index.html`: Layered `#passcode-card` with `relative z-10` above canvas `z-0`.
- `tests/graphics/procedural-diya.test.ts`: Unit tests validating geometry, +Z spout stretch, scalloped rim harmonics, WickAnchor, DiyaMesh grouping, and fallback loader.
- `tests/graphics/lighting-and-particles.test.ts`: Unit tests for thali dimensions and materials, lighting rig shadow config, and bokeh motes particle drift.
- `tests/graphics/scene-manager.test.ts`: Expanded tests for scene component mounting and FSM-driven camera transitions (`dollyTo`, `panTargetTo`).
- `tests/main.test.ts`: Bootstrap integration test asserting FSM, SceneManager, and PasscodeGate mounting.

## Deviations from Plan

None - plan executed exactly as written.

## Threat Flags

None - all user interactions and rendering components comply with ASVS V5 input boundary validation and mitigations T-02-03 (DOM API canvas attachment), T-02-04 (pre-warmed PointLight and shader pre-compilation), and T-02-05 (explicit GPU buffer disposal).

## Self-Check: PASSED

1. Created files exist on disk:
   - `src/graphics/meshes/procedural-diya-geometry.ts`: FOUND
   - `src/graphics/meshes/diya-mesh.ts`: FOUND
   - `src/graphics/meshes/diya-loader.ts`: FOUND
   - `src/graphics/meshes/thali-mesh.ts`: FOUND
   - `src/graphics/lighting-rig.ts`: FOUND
   - `src/graphics/particles/bokeh-motes.ts`: FOUND
   - `tests/graphics/procedural-diya.test.ts`: FOUND
   - `tests/graphics/lighting-and-particles.test.ts`: FOUND
   - `tests/main.test.ts`: FOUND
2. Task commits verified in git history:
   - `f19672a`: FOUND
   - `a19d3f2`: FOUND
   - `6411b43`: FOUND
3. Full test suite passing:
   - 60 passed across 10 test files (`npm test`)
4. Production bundle builds with 0 errors:
   - `npx vite build` succeeded (147.06 kB gzip JS)
