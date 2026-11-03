---
phase: "5"
slug: "festive-greeting-reveal-typography-celebration-polish"
status: draft
nyquist_compliant: true
wave_0_complete: true
created: "2026-11-04"
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest v3.0.0 + Happy-DOM |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/ui/greeting-modal.test.ts tests/fx/celebration-manager.test.ts --reporter=verbose` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~3.5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/ui/ tests/fx/`
- **After every plan wave:** Run `npm test && npx vite build`
- **Before `/gsd-verify-work`:** Full suite must be green (135+ existing tests + greeting/celebration tests)
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | WISH-01, 02 | T-05-01 | Injects recipient, message, sender strictly via textContent (XSS immune) | unit | `npx vitest run tests/ui/greeting-modal.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | WISH-03 | T-05-02 | Generates safe https://wa.me/?text= URI encoding for WhatsApp reply | unit | `npx vitest run tests/ui/whatsapp-reciprocation.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | VFX-05 | T-05-03 | Celebratory golden confetti and touch tap-to-sparkle execution | unit | `npx vitest run tests/fx/celebration-manager.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | WISH-01..03, VFX-05 | T-05-04 | FSM LIT_CELEBRATION -> GREETING_REVEAL auto-transition and camera pan | unit | `npx vitest run tests/graphics/scene-manager.test.ts` | ✅ | ⬜ pending |
| 05-02-02 | 02 | 2 | WISH-01..03, VFX-05 | — | PasscodeGate payload handoff to GreetingModal, bootstrap integration | unit | `npx vitest run tests/main.test.ts` | ✅ | ⬜ pending |
| 05-02-03 | 02 | 2 | All Phase 5 | — | Full regression test suite passes and production build bundles cleanly | build | `npm test; npx vite build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing Vitest test runner
- [ ] `npm install canvas-confetti && npm install -D @types/canvas-confetti`
- [ ] `tests/ui/greeting-modal.test.ts` — stubs for GreetingModal DOM mounting, textContent injection, and entrance CSS
- [ ] `tests/ui/whatsapp-reciprocation.test.ts` — stubs for WhatsApp URL formation and parameter sanitization
- [ ] `tests/fx/celebration-manager.test.ts` — stubs for dual-cannon confetti bursts and tap-to-sparkle origin calculation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Gold Shimmer Typography Visual Quality | WISH-02 | Gradient text clipping and font rendering aesthetics require human visual check | Unlock greeting on mobile, verify gold serif text shimmer and filigree divider clarity |
| Tap-to-Sparkle Touch Feel | VFX-05 | Multi-touch response and interactive delight | Tap anywhere on mobile screen in celebration mode; verify golden micro-fireworks spawn under finger |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** 2026-11-04
