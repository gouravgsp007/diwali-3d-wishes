---
phase: 04-touch-interaction-controller-dual-tier-audio-architecture
plan: 02
subsystem: interaction-and-audio
tags: [web-audio-api, procedural-sfx, audio-toggle, three, touch-interaction, glassmorphism, vitest]

requires:
  - phase: 04-touch-interaction-controller-dual-tier-audio-architecture
    plan: 01
    provides: TouchController, TouchHint, WickProximityDetector, foundational AudioEngine
provides:
  - SfxSynthesizer generating sample-accurate procedural match strike (120ms bandpass friction noise) and flame crackle (sine rumble + highpass micro-clicks)
  - AudioToggle floating glassmorphic button (fixed top-4 right-4 z-20) with live SVG icon toggling and 200ms linear gain ramp
  - PasscodeGate synchronous audio context unlock integration
  - SceneManager full lifecycle orchestration across UNLOCKED_INTRO, INTERACTIVE_UNLIT, IGNITING, and LIT_CELEBRATION with 3D match follower mesh
affects:
  - 05-custom-greeting-reveal-confetti-burst-audio-synchronization

actuals:
  tokens: 11733
  tasks: 3
  commits: 3
  plan_head_before: 60679477ec532a393e87834571f25f23439b1a20
  plan_head_after: 6cd0ff5f8bfde9576c8699501f07207ff1c2993e

tech-stack:
  added: []
  patterns:
    - Zero-download procedural sound synthesis with sweeping bandpass (2200Hz -> 1400Hz, Q = 2.5) and dual-component flame crackle
    - Gain level clamping <= 1.0 to eliminate acoustic clipping and hearing hazards per ASVS V5
    - Floating glassmorphic top-right pill control with event stopPropagation preventing 3D scene raycast interference
    - Synchronous AudioEngine.unlock() before async microtasks to guarantee mobile WebKit/Blink autoplay compliance
    - Coordinated 3D scene lifecycle tying camera dolly, BGM stream fade, touch hint, haptics, and procedural SFX

key-files:
  created:
    - src/audio/sfx-synthesizer.ts
    - src/ui/audio-toggle.ts
    - tests/audio/sfx-synthesizer.test.ts
    - tests/ui/audio-toggle.test.ts
  modified:
    - src/audio/audio-engine.ts
    - src/graphics/scene-manager.ts
    - src/main.ts
    - src/ui/passcode-gate.ts
    - tests/graphics/scene-manager.test.ts
    - tests/main.test.ts
    - tests/ui/passcode-gate.test.ts

key-decisions:
  - "D-06: Synthesized 120ms friction match strike with sweeping bandpass (2200Hz -> 1400Hz, Q = 2.5) and dual-component flame crackle (120Hz -> 45Hz sine rumble over 450ms + 1200Hz highpass sporadic micro-clicks over 600ms) with zero network overhead"
  - "D-07: Mounted floating glassmorphic pill button (fixed top-4 right-4 z-20) with static SVG icons (acoustic waves vs diagonal stroke slash), stopping event propagation and controlling global audio mute with 200ms linear gain ramp"
  - "D-04: Placed AudioEngine.getInstance().unlock() in PasscodeGate.handleUnlock() synchronously before any await microtask tick, satisfying WebKit and Blink autoplay restrictions"
  - "D-08: Integrated TouchController, TouchHint, and AudioEngine across AppStateMachine lifecycle in SceneManager: starting BGM and dollies camera on UNLOCKED_INTRO, showing TouchHint on INTERACTIVE_UNLIT, firing match strike & flame crackle SFX and transitioning to IGNITING when wick proximity is crossed, and hiding interaction UI on IGNITING"
  - "D-09: Explicitly disposed all 3D geometries, materials, audio contexts, DOM buttons, and event listeners in dispose() to eliminate memory leaks per ASVS V14"

patterns-established:
  - "Procedural Web Audio API sound synthesis produces crisp, low-latency tactile audio feedback with 0 KB asset weight"
  - "Floating HUD controls utilize stopPropagation() to isolate pointer raycasting between 2D UI elements and 3D WebGL scene graphs"
  - "Synchronous audio priming during user gestures unblocks media elements and AudioContexts across iOS Safari and Android Chrome"

requirements-completed:
  - AUDIO-03
  - AUDIO-04
  - DIYA-02
  - AUDIO-01
  - AUDIO-02

coverage:
  - id: D6
    description: "Procedural Web Audio API match-strike friction burst and dual-component flame crackle synthesis"
    requirement: AUDIO-03, AUDIO-04
    verification:
      - kind: unit
        ref: "tests/audio/sfx-synthesizer.test.ts"
        status: pass
    human_judgment: false
  - id: D7
    description: "Floating glassmorphic AudioToggle UI button with mute state icon switching and stopPropagation"
    requirement: AUDIO-04
    verification:
      - kind: unit
        ref: "tests/ui/audio-toggle.test.ts"
        status: pass
    human_judgment: false
  - id: D8
    description: "End-to-end integration across SceneManager, PasscodeGate, and bootstrap lifecycle"
    requirement: DIYA-02, AUDIO-01, AUDIO-02
    verification:
      - kind: unit
        ref: "tests/graphics/scene-manager.test.ts"
        status: pass
      - kind: unit
        ref: "tests/ui/passcode-gate.test.ts"
        status: pass
      - kind: unit
        ref: "tests/main.test.ts"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-11-04
status: complete
---

# Phase 04 Plan 02: Procedural SFX Synthesizer, Glassmorphic Audio Toggle, and Scene Lifecycle Integration Summary

**Real-time procedural Web Audio API match-strike and flame crackle sound synthesizer (`SfxSynthesizer`), floating glassmorphic sound toggle control (`AudioToggle`), synchronous user-gesture audio unlock in `PasscodeGate`, and full 3D match follower interaction lifecycle coordination in `SceneManager` and `main.ts`**

## Performance

- **Duration:** 15 min
- **Started:** 2026-11-04T04:53:30Z
- **Completed:** 2026-11-04T05:08:30Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Implemented procedural `SfxSynthesizer` in `src/audio/sfx-synthesizer.ts` generating real-time match friction sound effects (120ms bandpass-filtered noise burst sweeping 2200Hz -> 1400Hz with Q = 2.5) and dual-component flame crackle (low-frequency 120Hz -> 45Hz sine rumble over 450ms combined with 1200Hz highpass sporadic micro-clicks over 600ms) with 0 KB asset download overhead per D-06, ASVS V5, and T-04-04.
- Implemented floating glassmorphic `AudioToggle` in `src/ui/audio-toggle.ts` mounting a fixed top-right pill button (`fixed top-4 right-4 z-20`) with SVG acoustic waves vs diagonal stroke slash icons, `e.stopPropagation()` to prevent unwanted 3D scene raycast interference, and smooth 200ms linear gain ramp muting per D-07, D-09, ASVS V14, and T-04-05.
- Integrated synchronous audio unlock into `PasscodeGate.handleUnlock()` before async cryptographic key derivation, satisfying strict mobile WebKit and Blink autoplay policies per D-04.
- Integrated `TouchController`, `TouchHint`, and virtual 3D match follower mesh (`cylinder stick + glowing ember sphere + point light`) into `SceneManager`:
  - Starts HTML5 BGM stream on `UNLOCKED_INTRO` with 2-second volume fade-in and triggers `INTRO_COMPLETE` when camera dolly finishes.
  - Displays `TouchHint` prompt on `INTERACTIVE_UNLIT`.
  - Upon dragging match follower within `< 0.35` units of `WickAnchor` `(0.0, 0.68, 1.38)`, fires match strike SFX, flame crackle SFX, and transitions FSM to `IGNITING`.
  - Hides `TouchHint` and match follower mesh on `IGNITING`, frames the Diya, and executes flame ignition.
- Updated `main.ts` bootstrap to mount `AudioToggle` into the UI container and return it in the bootstrap result object.
- Thoroughly cleaned up all touch interaction, DOM elements, and 3D resources on `dispose()`.
- Verified 100% test pass rate across 20 test files (135 tests passing) and clean production bundling with `npx vite build`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement Procedural Web Audio API SfxSynthesizer for Match Strike and Flame Crackle** - `a26b957` (feat)
2. **Task 2: Implement Floating Glassmorphic AudioToggle UI Button Control** - `7f37c05` (feat)
3. **Task 3: Integrate TouchController, AudioEngine, and AudioToggle into SceneManager, PasscodeGate, and main.ts** - `6cd0ff5` (feat)

## Files Created/Modified

- `src/audio/sfx-synthesizer.ts` - `SfxSynthesizer` class generating procedural match friction noise burst and dual-component flame crackle
- `src/ui/audio-toggle.ts` - `AudioToggle` floating glassmorphic button component controlling global mute state
- `src/audio/audio-engine.ts` - Wired default `SfxSynthesizer` instantiation during `unlock()`
- `src/ui/passcode-gate.ts` - Synchronous `AudioEngine.getInstance().unlock()` invocation during submit event stack frame
- `src/graphics/scene-manager.ts` - Integrated `TouchController`, `TouchHint`, 3D match follower, BGM start, dolly transition, and proximity ignition
- `src/main.ts` - Instantiated and mounted `AudioToggle` in `bootstrap()`
- `tests/audio/sfx-synthesizer.test.ts` - Unit tests for procedural noise synthesis, filter sweeps, gain envelopes, and safety bounds
- `tests/ui/audio-toggle.test.ts` - Unit tests for button mounting, ARIA attributes, glassmorphic styles, icon toggling, and disposal
- `tests/graphics/scene-manager.test.ts` - Integration tests for BGM trigger, dolly transition, hint display, proximity SFX trigger, and resource disposal
- `tests/ui/passcode-gate.test.ts` - Updated unit tests verifying synchronous `AudioEngine.unlock()`
- `tests/main.test.ts` - Unit tests verifying `AudioToggle` mounting and bootstrap export

## Decisions Made

- [D-06] Synthesized match strike friction and flame crackle procedurally via native Web Audio API oscillators, noise buffers, and biquad filters, achieving 0ms latency and 0 KB network payload.
- [D-07] Used `e.stopPropagation()` on the `AudioToggle` button click event to ensure tapping the sound control never projects rays or disrupts pointer tracking on the 3D canvas underneath.
- [D-04] Placed `AudioEngine.getInstance().unlock()` inside `PasscodeGate.handleUnlock()` on the synchronous stack before any async PBKDF2/AES-GCM decryption tick, ensuring full compliance with mobile browser autoplay policies.
- [D-08] Coordinated state transitions in `SceneManager`: `UNLOCKED_INTRO` dollies forward and starts BGM; completion advances to `INTERACTIVE_UNLIT` showing `TouchHint`; dragging match follower to `WickAnchor` `< 0.35` units triggers match & crackle SFX and advances to `IGNITING`.
- [D-09] Explicitly removed event listeners, disposed geometries/materials, and detached DOM elements on `dispose()`, preventing memory leaks per ASVS V14.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All 135 unit and integration tests passed across all 20 test files, and production build succeeded without warnings or errors.

## User Setup Required

None - no external audio files or backend APIs needed.

## Next Phase Readiness

- Phase 4 is fully complete with all interactive touch gesture and dual-tier audio requirements satisfied.
- Ready for Phase 5: Custom Greeting Reveal, Confetti Burst, and Audio Synchronization (`05-custom-greeting-reveal-confetti-burst-audio-synchronization`).

## Self-Check: PASSED
- `src/audio/sfx-synthesizer.ts`: FOUND
- `src/ui/audio-toggle.ts`: FOUND
- `src/ui/passcode-gate.ts`: FOUND
- `src/graphics/scene-manager.ts`: FOUND
- `src/main.ts`: FOUND
- `tests/audio/sfx-synthesizer.test.ts`: FOUND
- `tests/ui/audio-toggle.test.ts`: FOUND
- `tests/graphics/scene-manager.test.ts`: FOUND
- `tests/ui/passcode-gate.test.ts`: FOUND
- `tests/main.test.ts`: FOUND
- Commit a26b957: FOUND
- Commit 7f37c05: FOUND
- Commit 6cd0ff5: FOUND

---
*Phase: 04-touch-interaction-controller-dual-tier-audio-architecture*
*Plan: 02*
*Completed: 2026-11-04*
