---
phase: "4"
slug: "touch-interaction-controller-dual-tier-audio-architecture"
status: draft
nyquist_compliant: true
wave_0_complete: true
created: "2026-11-04"
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest v3.0.0 + Happy-DOM |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/interaction/ tests/audio/ --reporter=verbose` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~3.5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/interaction/ tests/audio/`
- **After every plan wave:** Run `npm test && npx vite build`
- **Before `/gsd-verify-work`:** Full suite must be green (91+ existing tests + audio/interaction tests)
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | DIYA-02 | T-04-01 | Raycaster horizontal plane projection and proximity check (<0.35) | unit | `npx vitest run tests/interaction/touch-controller.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | DIYA-02 | T-04-02 | Touch hint UI appears in INTERACTIVE_UNLIT and dissolves on touch | unit | `npx vitest run tests/interaction/touch-hint.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | AUDIO-01, 02 | T-04-03 | Synchronous unlock handshake and HTML5 audio silent-switch streaming | unit | `npx vitest run tests/audio/audio-engine.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | AUDIO-03 | T-04-04 | Synthesized Web Audio API match-strike and flame crackle sound effects | unit | `npx vitest run tests/audio/sfx-synthesizer.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | AUDIO-04 | T-04-05 | Floating glassmorphic audio toggle with smooth gain mute/unmute | unit | `npx vitest run tests/ui/audio-toggle.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 2 | DIYA-02, AUDIO-01..04 | T-04-06 | SceneManager, PasscodeGate, and main.ts integration with production build | build | `npm test && npx vite build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing Three.js and Vitest test runner
- [ ] `tests/interaction/touch-controller.test.ts` — stubs for Raycaster projection, proximity calculation, and auto-ignition
- [ ] `tests/interaction/touch-hint.test.ts` — stubs for floating hint DOM lifecycle and fadeout
- [ ] `tests/audio/audio-engine.test.ts` — stubs for audio unlock, volume fading, and tab visibility pause
- [ ] `tests/audio/sfx-synthesizer.test.ts` — stubs for Web Audio API match strike and crackle sound generators
- [ ] `tests/ui/audio-toggle.test.ts` — stubs for floating mute/unmute pill and master gain ramp

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| iOS Physical Silent Switch Bypass | AUDIO-02 | iOS hardware mute switch physical behavior cannot be simulated in desktop headless Chrome | Open on real iPhone with side silent switch engaged; verify sitar/flute soundtrack plays upon unlock |
| Touch Drag Ergonomics & Haptics | DIYA-02 | Touch latency, finger tracking feel, and physical vibration motor require real hardware | Drag virtual flame toward wick on physical smartphone; verify haptic pulse and crisp snap ignition |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** 2026-11-04
