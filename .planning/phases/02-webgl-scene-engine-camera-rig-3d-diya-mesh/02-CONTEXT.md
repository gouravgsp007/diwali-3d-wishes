# Phase 2: WebGL Scene Engine, Camera Rig & 3D Diya Mesh - Context

**Gathered:** 2026-11-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Construct the mobile-optimized Three.js WebGL scene engine, responsive vertical-FOV camera rig, and authentic 3D earthen diya mesh (terracotta oil lamp with cotton wick, glossy oil pool, brass thali platter, and drifting golden bokeh motes) matching the nocturnal Diwali aesthetic.

</domain>

<decisions>
## Implementation Decisions

### Diya 3D Asset & Sourcing
- **D-01:** **Hybrid Procedural Geometry + Optional GLB Override**: Primary earthen diya mesh is constructed with Three.js procedural `LatheGeometry` / parametric curves (terracotta bowl, cotton wick tip, glossy oil pool) with PBR materials, supporting optional external `.glb` loading if present in `public/models/diya.glb`. Ensures zero download delay, instant rendering, and zero asset-missing crashes on slow mobile connections.
- **D-02:** **Traditional Ornate Earthen Diya Visuals**: Warm terracotta clay with decorative scalloped rim ridges, glossy golden-amber oil puddle, and a realistic organic cotton wick tip angled at the spout.
- **D-03:** **Procedural Canvas PBR Textures**: Dynamically bake micro-porous clay bump maps and oil surface gloss onto offscreen CanvasTextures at boot (realistic clay grain, 0 KB image downloads, instant FCP).
- **D-04:** **Normalized Unit Scale & Explicit Flame Anchor**: Diya is scaled to ~2.5 units wide, centered at origin `(0, 0, 0)`, with an explicitly exported `WickAnchor` coordinate for lighting and GLSL flame shaders in Phase 3.

### Camera Perspective & Framing
- **D-05:** **Cinematic 3/4 Elevated Angle (~30° pitch)**: Showcases the ornate terracotta bowl, glistening oil pool, and cotton wick, while leaving ample vertical space for the tall flame and lower greeting card.
- **D-06:** **Mathematical vFOV Compensation**: Dynamically expands vertical field-of-view on narrow portrait screens (`aspect < 1.0`) via `camera.fov = 2 * Math.atan(Math.tan(baseFov / 2) / aspect) * (180 / Math.PI)` so the Diya retains identical visual width without cropping or perspective distortion across all mobile viewport heights (`100svh`).
- **D-07:** **State-Driven Dynamic Camera Dolly**: Centers Diya during passcode unlock, then smoothly tweens camera target upward (+0.4 units) on ignition via `@tweenjs/tween.js` so the flame and greeting card both have room.
- **D-08:** **Natural 45° Focal Length**: Balanced 35mm equivalent perspective preserving natural circular bowl proportions with pleasing three-dimensional depth.

### Scene Ambience & Ground Surface
- **D-09:** **Circular Brass Thali / Festive Platter**: A decorative circular dark brass dish beneath the Diya with subtle radial engravings that catch warm golden reflections upon lighting.
- **D-10:** **Dual-Tier Festive Atmosphere**: Soft indigo ambient baseline + warm golden rim light from top-rear to silhouette the unlit terracotta rim, ready for the warm PointLight ignition in Phase 3.
- **D-11:** **Drifting Golden Bokeh Motes**: 50 slow-drifting, out-of-focus golden dust particles floating upwards in 3D space, adding magical festive depth behind the Diya.
- **D-12:** **Real-time Directional Shadow Maps**: Enables Three.js `PCFSoftShadowMap` (`renderer.shadowMap.enabled = true`) for dynamic cast shadows across the thali rim and floor.

### Camera Idle Motion & Parallax
- **D-13:** **Harmonic Breathing Sway**: Gentle organic Lissajous figure-8 drift (yaw ±1.5°, 8s cycle) creating a breathing, cinematic handheld presence.
- **D-14:** **Damped Clamped Parallax with Auto-Return**: Mouse movement / touch drag shifts angle up to ±15°, smoothly springing back to cinematic home framing when released.
- **D-15:** **Cinematic Dolly Sweep on Unlock**: Camera sweeps smoothly forward (1.2s cubic ease-out) from a wide view into the intimate Diya closeup as the passcode modal dissolves.
- **D-16:** **Smart Visibility & Context Resilience**: Pause render loop on backgrounded tabs (`document.hidden`) to conserve mobile battery, with automatic WebGL context restoration (`webglcontextlost` / `webglcontextrestored`).

### Builder Discretion
- Three.js version: Vanilla `three@^0.187.0` (modular imports `three` and `three/addons/*`).
- DPR clamp: Clamped to `Math.min(window.devicePixelRatio, 1.75)` to prevent Retina fill-rate bottlenecking while maintaining sharp shadows and texturing.
- Scene mounting: WebGL canvas mounted inside `#app` behind the UI overlay (z-index 0), rendering behind the glassmorphic passcode card until unlock.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Specs
- `.planning/research/STACK.md` — Three.js vanilla bundle guidelines, GLTFLoader, no R3F
- `.planning/research/ARCHITECTURE.md` — Single-pass forward rendering, canvas layering, lighting setup
- `.planning/research/PITFALLS.md` — DPR fill-rate clamping (<= 1.75), iOS WebKit context preservation
- `.planning/REQUIREMENTS.md` § DIYA-01 — 3D earthen diya requirement specification

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/state-machine.ts`: `AppStateMachine` manages states (`BOOT`, `LOCKED`, `UNLOCKED_INTRO`, `INTERACTIVE_UNLIT`, `IGNITING`, `LIT_CELEBRATION`, `GREETING_REVEAL`). The camera rig and scene manager subscribe to state changes to trigger camera dollying and lighting changes.
- `src/app/event-bus.ts`: Decoupled `EventBus` for cross-component triggers (e.g. `DIYA_TOUCH`, `CAMERA_DOLLY_COMPLETE`).
- `src/ui/passcode-gate.ts`: Fades modal on unlock with `opacity-0 scale-95 pointer-events-none`.

### Established Patterns
- Strongly typed TypeScript contracts with no runtime footprint.
- Client-side zero-backend architecture.
- Mobile viewport locking (`100svh`, `overscroll-behavior: none`, `touch-action: manipulation`).

### Integration Points
- `src/main.ts`: Initializes the 3D Scene Manager upon bootstrap and connects it with `AppStateMachine`.
- `index.html`: Canvas container mounted inside `#app` before the glassmorphic card modal.

</code_context>

<specifics>
## Specific Ideas

- Earthen Diya should have that authentic warm terracotta glow and organic clay feel, with a brass platter beneath reflecting the scene.
- Golden bokeh motes floating upwards in the dark background should evoke the magical celebratory mood of Diwali night.
- Unlock sequence should feel like a cinematic transition: as the secret passcode unlocks, the camera glides gracefully closer to the lamp, welcoming the recipient to touch and ignite it.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope.

</deferred>

---

*Phase: 2-WebGL Scene Engine, Camera Rig & 3D Diya Mesh*
*Context gathered: 2026-11-04*
