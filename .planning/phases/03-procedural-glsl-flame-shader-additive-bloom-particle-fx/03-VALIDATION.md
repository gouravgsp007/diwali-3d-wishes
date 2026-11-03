---
phase: "3"
slug: "procedural-glsl-flame-shader-additive-bloom-particle-fx"
status: draft
nyquist_compliant: true
wave_0_complete: true
created: "2026-11-04"
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest v3.0.0 + Happy-DOM |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/graphics/fx/ --reporter=verbose` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~3.5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/graphics/fx/`
- **After every plan wave:** Run `npm test && npx vite build`
- **Before `/gsd-verify-work`:** Full suite must be green (60+ existing tests + FX tests)
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | VFX-01 | T-03-01 | Teardrop ConeGeometry created with base translation and ShaderMaterial | unit | `npx vitest run tests/graphics/fx/flame-mesh.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | VFX-02 | T-03-02 | PointLight harmonic intensity jitter without cubemap shadow overhead | unit | `npx vitest run tests/graphics/fx/flame-lighting.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | VFX-03 | T-03-03 | Additive glow billboard halo with offscreen radial gradient canvas texture | unit | `npx vitest run tests/graphics/fx/glow-halo.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | VFX-04 | T-03-04 | Single draw-call sparkler particle buffer with Euler gravity kinematics | unit | `npx vitest run tests/graphics/fx/sparkler-system.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | VFX-01..04 | T-03-05 | FlameController orchestrates ignite/burn lifecycle and full GPU disposal | unit | `npx vitest run tests/graphics/fx/flame-controller.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 2 | VFX-01..04 | — | SceneManager integration, FSM IGNITING trigger, production build passes | build | `npm test && npx vite build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing Three.js test runner in `vitest.config.ts`
- [ ] `tests/graphics/fx/flame-mesh.test.ts` — stubs for ConeGeometry, ShaderMaterial uniforms, and scale tween
- [ ] `tests/graphics/fx/flame-lighting.test.ts` — stubs for PointLight position at (0, 0.83, 1.38) and harmonic jitter
- [ ] `tests/graphics/fx/glow-halo.test.ts` — stubs for additive Sprite and radial gradient CanvasTexture
- [ ] `tests/graphics/fx/sparkler-system.test.ts` — stubs for BufferGeometry particles, radial burst, and gravity update
- [ ] `tests/graphics/fx/flame-controller.test.ts` — stubs for ignite(), update(), and dispose()

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Organic flame teardrop flutter & gradient aesthetics | VFX-01 | GLSL vertex displacement and fragment color blending visual quality cannot be asserted in headless DOM | Open `http://localhost:3000/`, unlock with `DIWALI`, trigger ignition, verify golden-amber flame flutter |
| Sparkler golden burst brilliance | VFX-04 | Particle animation fluidity on physical mobile screen | Observe sparkler explosion on touch, verify smooth 60 FPS drift without frame hitching |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** 2026-11-04
