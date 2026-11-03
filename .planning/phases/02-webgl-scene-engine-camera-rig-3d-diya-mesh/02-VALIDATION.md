---
phase: "2"
slug: "webgl-scene-engine-camera-rig-3d-diya-mesh"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-04"
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest v3.0.0 + Happy-DOM |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/graphics/ --reporter=verbose` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~3.5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/graphics/`
- **After every plan wave:** Run `npm test && npx tsc --noEmit`
- **Before `/gsd-verify-work`:** Full suite must be green (28+ existing tests + graphics tests)
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | DIYA-01 | T-02-02 | Clamps DPR <= 1.75 to prevent GPU denial of service | unit | `npx vitest run tests/graphics/scene-manager.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | DIYA-01 | T-02-01 | Mathematical vFOV compensation keeps Diya framed on portrait mobile | unit | `npx vitest run tests/graphics/camera-rig.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | DIYA-01 | — | Procedural CanvasTexture generates bump & roughness maps | unit | `npx vitest run tests/graphics/procedural-textures.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | DIYA-01 | — | Procedural Diya generates displaced spout, scalloped rim & WickAnchor | unit | `npx vitest run tests/graphics/procedural-diya.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | DIYA-01 | T-02-03 | Canvas mounted into `#app` cleanly without XSS; lifecycle visibility pause | unit | `npx vitest run tests/graphics/scene-manager.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 2 | DIYA-01 | — | Integration build test passing with Three.js bundle size within budget | build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install three @tweenjs/tween.js && npm install -D @types/three` — Core 3D engine and tweening libraries
- [ ] `tests/graphics/scene-manager.test.ts` — stubs for SceneManager, DPR clamp, context restoration, and visibility API
- [ ] `tests/graphics/camera-rig.test.ts` — stubs for vFOV compensation, parallax damping, and dolly tweening
- [ ] `tests/graphics/procedural-textures.test.ts` — stubs for CanvasTexture bump and roughness map generation
- [ ] `tests/graphics/procedural-diya.test.ts` — stubs for LatheGeometry displacement, scalloped rim, and WickAnchor

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual quality of clay terracotta grain and golden rim glint | DIYA-01 | WebGL shader visual aesthetics cannot be asserted in headless DOM | Run `npm run dev`, open mobile view, verify terracotta clay texture and golden lighting |
| Touch drag parallax fluidity on mobile | DIYA-01 | Hardware touch event latency and gyro response require real device | Drag across smartphone screen, observe smooth ±15° camera tilt and spring auto-return |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter (set post-validation)

**Approval:** pending 2026-11-04
