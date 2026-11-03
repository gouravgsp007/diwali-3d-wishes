---
phase: 01-core-architecture-state-machine-cryptographic-codec
plan: 02
subsystem: ui-passcode-gate
tags:
  - passcode-gate
  - url-resolver
  - audio-unlock
  - glassmorphism
  - webkit-audio
  - vitest
  - tailwindcss
requires:
  - 01-01
provides:
  - PasscodeGate
  - resolveGreetingToken
  - ResolvedToken
  - primeAudioContext
  - getAudioContext
affects:
  - Phase 2 (3D scene manager mount)
  - Phase 4 (audio soundtrack wiring)
  - Phase 5 (greeting reveal & confetti)
tech-stack:
  added: []
  patterns:
    - glassmorphic-modal
    - dual-url-resolver
    - synchronous-audio-priming
    - css-shake-reflow
key-files:
  created:
    - src/ui/url-resolver.ts
    - tests/ui/url-resolver.test.ts
    - src/audio/audio-unlock.ts
    - index.html
    - src/ui/passcode-gate.ts
    - tests/ui/passcode-gate.test.ts
  modified:
    - src/main.ts
    - src/app/state-machine.ts
decisions:
  - D-01-03: Dual URL token extraction prioritizes private URL hash fragment (#d=...) over query parameters (?c=...), automatically stripping Meta/Instagram link shim tracking parameters (fbclid, igsh).
  - D-01-04: AudioContext is primed synchronously inside the form submission gesture before async Web Crypto decryption microtask ticks, satisfying mobile WebKit user activation policies.
  - D-01-05: PasscodeGate enforces real-time uppercase normalization, triggers CSS shake rejection with reflow restart, and renders error messages strictly via textContent to prevent stored XSS.
metrics:
  duration: 6m
  completed: 2026-11-04
status: complete
actuals:
  tokens: 45000
  tasks: 3
  commits: 3
  plan_head_before: 459e02a
  plan_head_after: 6f270bb
---

# Phase 01 Plan 02: Passcode Gate UI, URL Token Resolver & Audio Priming Summary

Responsive glassmorphic Passcode Gate UI modal, dual URL hash/query resolver with Meta link-shim sanitization, and synchronous Web Audio context priming bridge for iOS Safari.

## What Was Delivered

1. **Dual URL Token Resolver (`src/ui/url-resolver.ts`)**:
   - Primary path extracts ciphertext token from URL hash fragment (`#d=...`), ensuring encrypted payloads never reach server HTTP access logs (D-06).
   - Secondary fallback parses `?c=...`, `?d=...`, or `?code=...` query parameters using `URLSearchParams`, automatically discarding Instagram/Meta tracking parameters (`fbclid`, `igsh`) without corrupting ciphertext tokens (PASS-04).
   - Gracefully falls back to demo mode (`{ token: null, isDemo: true }`) for direct visits without tokens (D-07).

2. **Synchronous Audio Priming Bridge (`src/audio/audio-unlock.ts`)**:
   - Implemented `primeAudioContext()` to synchronously wake the Web Audio API context (`AudioContext` / `webkitAudioContext`) during user tap/submit gestures.
   - Plays a 1-sample silent buffer to unlock the iOS Safari `AVAudioSession` before asynchronous microtask ticks (PBKDF2/AES-GCM decryption) begin (D-11).

3. **Mobile Viewport Shell (`index.html`)**:
   - Locked root container to `100svh` (`fixed inset-0 w-screen h-[100svh]`) with `overscroll-behavior: none` and `touch-action: manipulation` to prevent iOS and Instagram in-app browser toolbar jump and pull-to-refresh jitter (D-12).
   - Designed nocturnal Diwali background gradient (`#0d0208` to `#1a0614`) with glassmorphic modal card styling, festive gold typography, and Diya motifs (D-02, D-03).
   - Styled passcode input with monospace tracking, real-time auto-capitalization, and gold focus rings (D-01).

4. **PasscodeGate UI Controller & App Bootstrap (`src/ui/passcode-gate.ts`, `src/main.ts`)**:
   - Enforces uppercase input normalization and error clearing on input events.
   - Integrates with `AppStateMachine` and `GreetingCodec`: decrypts ciphertext tokens or verifies demo codes (`DIWALI`, `HAPPY`), transitioning the state machine to `UNLOCKED_INTRO` and fading the modal card on success.
   - On rejection: restarts CSS `.animate-shake` animation via forced reflow (`void cardEl.offsetWidth`), displays safe error copy via `textContent` (T-01-04), and auto-selects input text for rapid re-entry (D-08).
   - Includes friendly toast stub notification for "Create Your Own Wish" action (D-07).
   - Wires the full application entry point in `src/main.ts` on `DOMContentLoaded`.

## Test Verification

- `tests/ui/url-resolver.test.ts`: 6/6 tests passing covering hash extraction, trailing parameter parsing, URI decoding, Meta tracking tag sanitization, and demo fallback.
- `tests/ui/passcode-gate.test.ts`: 8/8 tests passing covering input normalization, synchronous audio priming, demo code unlock, AES-GCM ciphertext unlock, shake rejection, text selection, length validation, and Create Wish notice.
- Full test suite: `npx vitest run` passes 28/28 tests across all 4 test files.
- TypeScript compiler: `npx tsc --noEmit` passes with 0 errors.
- Production build: `npx vite build` builds cleanly in <500ms with a total JS bundle size of 12.87 kB (4.57 kB gzipped).

## Threat Mitigations Applied

| Threat ID | Threat Category | Component | Disposition | Mitigation Result |
|-----------|-----------------|-----------|-------------|-------------------|
| T-01-04 | Tampering / XSS | `src/ui/passcode-gate.ts` | Mitigate | All dynamic messages and error feedback are rendered strictly via `textContent`, eliminating stored XSS risks. |
| T-01-05 | Information Disclosure | `src/ui/url-resolver.ts` | Mitigate | Hash fragment (`#d=...`) prioritized over query parameters; query parameters parsed through `URLSearchParams` stripping `fbclid` and `igsh` link shims. |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Convenience Accessors] Added `state` and `payload` getters to `AppStateMachine`**
- **Found during:** Task 3 test execution
- **Issue:** Test assertions and controllers accessing `fsm.state` and `fsm.payload` directly returned undefined because only `fsm.getState()` and `fsm.getGreeting()` were initially exposed.
- **Fix:** Added `public get state(): AppState` and `public get payload(): GreetingPayload | null` accessors to `AppStateMachine` while preserving existing `getState()` and `getGreeting()` methods.
- **Files modified:** `src/app/state-machine.ts`
- **Commit:** `6f270bb`

## Known Stubs

| File | Line | Reason |
|------|------|--------|
| `src/ui/passcode-gate.ts` | 134-142 | "Create Your Own Wish" displays a temporary toast stub explaining the creator will open in Phase 6. This is intentional per D-07. |

## Self-Check: PASSED

- FOUND: `src/ui/url-resolver.ts`
- FOUND: `tests/ui/url-resolver.test.ts`
- FOUND: `src/audio/audio-unlock.ts`
- FOUND: `index.html`
- FOUND: `src/ui/passcode-gate.ts`
- FOUND: `tests/ui/passcode-gate.test.ts`
- FOUND: `src/main.ts`
- FOUND commit `be1e579`: feat(01-02): implement dual url token resolver with meta link-shim sanitization
- FOUND commit `295fee8`: feat(01-02): implement synchronous audio priming stub, mobile viewport html shell, and bootstrap stub
- FOUND commit `6f270bb`: feat(01-02): implement passcodegate ui controller, shake rejection, and application bootstrap
