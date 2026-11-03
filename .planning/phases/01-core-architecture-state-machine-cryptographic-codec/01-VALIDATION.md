---
phase: "01"
slug: "core-architecture-state-machine-cryptographic-codec"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-03"
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest `^5.1.0` |
| **Config file** | `vitest.config.ts` (Wave 0 installs) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | PASS-01..04 | — | Wave 0 setup (Vite, TS, Tailwind v4, Vitest) | infra | `npm test` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | PASS-02 | T-01-01, T-01-02 | AES-GCM 256-bit + PBKDF2 encryption/decryption roundtrip | unit | `npx vitest run tests/crypto/greeting-codec.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | PASS-03 | T-01-02 | Invalid passcode throws authentication error without leaking payload | unit | `npx vitest run tests/crypto/greeting-codec.test.ts -t "rejection"` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | PASS-04 | T-01-01 | Extracts hash fragment `#d=...` and query `?c=...` while stripping `fbclid`/`igsh` | unit | `npx vitest run tests/ui/url-resolver.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | PASS-01 | T-01-03 | FSM state transitions and passcode input handling | unit / DOM | `npx vitest run tests/state/state-machine.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | PASS-01 | T-01-03 | PasscodeGate UI modal rendering, shake animation on error | DOM | `npx vitest run tests/ui/passcode-gate.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts` — test and build configuration
- [ ] `tests/crypto/greeting-codec.test.ts` — test suites for PASS-02 and PASS-03
- [ ] `tests/ui/url-resolver.test.ts` — test suite for PASS-04
- [ ] `tests/state/state-machine.test.ts` — test suite for FSM lifecycle
- [ ] `tests/ui/passcode-gate.test.ts` — test suite for PASS-01 DOM interaction

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Atmospheric glassmorphic visual aesthetics & gold glowing border | PASS-01 | Subjective visual appeal across high-DPI screens | Open in mobile browser viewport; verify backdrop blur, gold festive text, and centered layout |
| Mobile touch scroll suppression (`100svh`) | PASS-01 | Requires touch hardware gesture | In touch emulation / phone, swipe down vigorously; verify no pull-to-refresh reload |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 3s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
