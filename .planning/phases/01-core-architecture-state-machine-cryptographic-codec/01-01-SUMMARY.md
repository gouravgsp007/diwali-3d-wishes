---
phase: 01-core-architecture-state-machine-cryptographic-codec
plan: 01
subsystem: crypto-state-infra
tags:
  - fsm
  - aes-gcm
  - pbkdf2
  - lz-string
  - vitest
  - tailwindcss
requires: []
provides:
  - AppStateMachine
  - EventBus
  - globalEventBus
  - GreetingCodec
  - DEMO_GREETINGS
  - GreetingPayload
  - isValidGreetingPayload
affects:
  - 01-02-PLAN.md
tech-stack:
  added:
    - lz-string
    - vitest
    - happy-dom
    - tailwindcss
    - "@tailwindcss/vite"
    - typescript
    - vite
  patterns:
    - finite-state-machine
    - aes-gcm-pbkdf2-codec
    - typed-event-bus
key-files:
  created:
    - package.json
    - tsconfig.json
    - vite.config.ts
    - vitest.config.ts
    - src/style.css
    - src/app/state-machine.ts
    - src/app/event-bus.ts
    - src/crypto/types.ts
    - src/crypto/greeting-codec.ts
    - src/crypto/demo-greeting.ts
    - tests/state/state-machine.test.ts
    - tests/crypto/greeting-codec.test.ts
  modified:
    - .planning/config.json
decisions:
  - D-01-01: Used native Web Crypto API (SubtleCrypto) for AES-GCM 256-bit encryption with PBKDF2 100k iterations and lz-string compression with zero server dependencies.
  - D-01-02: AppStateMachine implements deterministic transitions across all 7 lifecycle states (BOOT to GREETING_REVEAL) with event subscriber callbacks and payload retention.
metrics:
  duration: 8m
  completed: 2026-11-04
status: complete
actuals:
  tokens: 42000
  tasks: 3
  commits: 3
  plan_head_before: 55e1f32
  plan_head_after: 5320cca
---

# Phase 01 Plan 01: Core Architecture, State Machine & Cryptographic Codec Summary

Foundational build/test infrastructure, 7-state deterministic lifecycle FSM, and zero-backend client-side AES-GCM PBKDF2 cryptographic engine.

## What Was Delivered

1. **Project Infrastructure & Tooling**:
   - Initialized ES module workspace with Vite, TypeScript 5.7+ (strict ES2022 DOM), Tailwind CSS v4 (`@tailwindcss/vite`), and Vitest with `happy-dom`.
   - Added global stylesheet `src/style.css` defining `@keyframes shake` and `.animate-shake` utility for passcode rejection feedback.
   - Configured `.gitignore` to protect against tracking `node_modules` and build outputs.

2. **Strongly-Typed Finite State Machine (`AppStateMachine`) & EventBus**:
   - Defined `AppState` union covering all 7 lifecycle states: `'BOOT' | 'LOCKED' | 'UNLOCKED_INTRO' | 'INTERACTIVE_UNLIT' | 'IGNITING' | 'LIT_CELEBRATION' | 'GREETING_REVEAL'`.
   - Defined strictly-typed `AppEvent` discriminated unions (`BOOT_COMPLETE`, `UNLOCK_SUCCESS`, `INTRO_COMPLETE`, `WICK_TOUCHED`, `IGNITION_COMPLETE`, `CELEBRATION_COMPLETE`, `REPLAY`).
   - Implemented `AppStateMachine` managing deterministic state progression, payload retention on unlock, and observer subscription callbacks with cleanup.
   - Implemented typed `EventBus` and exported `globalEventBus` singleton.

3. **Zero-Backend Cryptographic Codec (`GreetingCodec`) & Demo Wishes**:
   - Implemented `GreetingCodec` utilizing native `window.crypto.subtle` with PBKDF2 key derivation (100,000 iterations, SHA-256) and AES-GCM 256-bit authenticated encryption.
   - Compressed JSON payloads via `lz-string` (`compressToUint8Array` / `decompressFromUint8Array`) before encryption to generate compact URL-safe Base64 tokens.
   - Normalizes passcodes (trim + uppercase) ensuring case-insensitive passcode entry.
   - Implemented `DEMO_GREETINGS` fallback dictionary for passcodes `'DIWALI'` and `'HAPPY'`.
   - Decryption failure cleanly rejects on authentication tag mismatch or token tampering without exposing internal traces.

## Test Verification

- `tests/state/state-machine.test.ts`: 9/9 unit tests passing covering state transitions, payload retention, subscriber notifications, and event bus pub/sub.
- `tests/crypto/greeting-codec.test.ts`: 5/5 unit tests passing covering roundtrip encryption/decryption, passcode case normalization, authentication tag rejection, corrupted token handling, and demo greetings dictionary validation.
- Full suite verification: `npx vitest run` passes 14/14 tests.
- TypeScript compiler verification: `npx tsc --noEmit` passes with 0 errors.

## Threat Mitigations Applied

| Threat ID | Threat Category | Component | Disposition | Mitigation Result |
|-----------|-----------------|-----------|-------------|-------------------|
| T-01-01 | Information Disclosure | `src/crypto/greeting-codec.ts` | Mitigate | Symmetrical AES-GCM 256-bit encryption with PBKDF2 key derivation (100,000 iterations, SHA-256). Payload is compressed with `lz-string` and stored in URL fragment without hitting server endpoints. |
| T-01-02 | Tampering | `src/crypto/greeting-codec.ts` | Mitigate | AES-GCM 128-bit authentication tag verification on decryption; tampered tokens or corrupted bytes cause immediate rejection. |
| T-01-03 | Elevation of Privilege | `src/crypto/greeting-codec.ts` | Mitigate | PBKDF2 derivation with 100,000 SHA-256 iterations imposes computational work factor against brute-force attacks on 4-to-6 character passcodes. |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Type Incompatibility] Satisfied TypeScript 5.7+ BufferSource typing for Web Crypto**
- **Found during:** Task 3
- **Issue:** In TypeScript 5.7+, typed arrays default to `Uint8Array<ArrayBufferLike>`, which is not assignable to DOM `BufferSource` (`ArrayBufferView<ArrayBuffer> | ArrayBuffer`) due to `SharedArrayBuffer` inclusion in `ArrayBufferLike`.
- **Fix:** Explicitly cast `iv`, `compressedBytes`, and `cipherData` as `BufferSource` for `subtle.encrypt` and `subtle.decrypt`.
- **Files modified:** `src/crypto/greeting-codec.ts`
- **Commit:** `5320cca`

## Self-Check: PASSED

- FOUND: `package.json`
- FOUND: `tsconfig.json`
- FOUND: `vite.config.ts`
- FOUND: `vitest.config.ts`
- FOUND: `src/style.css`
- FOUND: `src/app/state-machine.ts`
- FOUND: `src/app/event-bus.ts`
- FOUND: `src/crypto/types.ts`
- FOUND: `src/crypto/greeting-codec.ts`
- FOUND: `src/crypto/demo-greeting.ts`
- FOUND: `tests/state/state-machine.test.ts`
- FOUND: `tests/crypto/greeting-codec.test.ts`
- FOUND commit `3f13b86`: chore(01-01): scaffold project infrastructure, tailwind css v4, and vitest environment
- FOUND commit `cd095f8`: feat(01-01): implement strongly-typed finite state machine and event bus
- FOUND commit `5320cca`: feat(01-01): implement zero-backend aes-gcm pbkdf2 greeting codec and demo wishes
