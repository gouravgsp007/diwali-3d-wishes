---
phase: 04-touch-interaction-controller-dual-tier-audio-architecture
plan: 01
subsystem: interaction-and-audio
tags: [three, raycasting, touch, haptics, audio, web-audio-api, ios-audio-session, vitest]

requires:
  - phase: 02-webgl-scene-engine-camera-rig-3d-diya-mesh
    provides: CameraRig, WickAnchor coordinates (0.0, 0.68, 1.38), SceneManager
  - phase: 03-procedural-glsl-flame-shader-additive-bloom-particle-fx
    provides: WickAnchor alignment and FlameController lifecycle
provides:
  - WickProximityDetector calculating Euclidean distance to WickAnchor (0.0, 0.68, 1.38) with threshold < 0.35
  - TouchController translating touch/drag gestures onto horizontal plane y = 0.68 with boundary radius clamping <= 3.2
  - TouchHint floating glassmorphic instruction prompt with pulsing gold indicator and smooth opacity/scale transitions
  - AudioEngine singleton with synchronous gesture unlock(), W3C Audio Session playback intent, HTML5 BGM streaming, and visibility suspension
affects:
  - 04-touch-interaction-controller-dual-tier-audio-architecture
  - 05-custom-greeting-reveal-confetti-burst-audio-synchronization

actuals:
  tokens: 10306
  tasks: 3
  commits: 3
  plan_head_before: a8e7e20494c90003e1cf76dfe52ed4ab62f5c5ab
  plan_head_after: b947bad168200f393409fb162476fd8459801af1

tech-stack:
  added: []
  patterns:
    - Screen-to-world horizontal plane raycasting (THREE.Plane y = 0.68) with ASVS V5 radius boundary clamping
    - Safe feature-detected mobile haptic vibration pulse (navigator.vibrate([30, 50, 40]))
    - Ethereal floating glassmorphic DOM prompt with static verified HTML and ARIA status polite
    - Dual-tier audio architecture combining native HTML5 <audio> streaming (iOS physical silent switch bypass) and low-latency Web Audio API
    - Synchronous user-gesture unlock handshake avoiding microtask autoplay blocks

key-files:
  created:
    - src/interaction/proximity-detector.ts
    - src/interaction/touch-controller.ts
    - src/interaction/touch-hint.ts
    - src/audio/audio-engine.ts
    - tests/interaction/touch-controller.test.ts
    - tests/interaction/touch-hint.test.ts
    - tests/audio/audio-engine.test.ts
  modified: []

key-decisions:
  - "D-01: Projected pointer NDC coordinates onto infinite horizontal plane y = 0.68 with ASVS V5 boundary clamping (Math.hypot(x, z) <= 3.2) to prevent horizon ray runaway or NaN positions"
  - "D-02: Detected proximity when distance between match follower and WickAnchor (0.0, 0.68, 1.38) < 0.35, triggering navigator.vibrate([30, 50, 40]) and ignition callback"
  - "D-03: Rendered TouchHint as fixed glassmorphic pill prompt (bg-amber-950/80, backdrop-blur-md) with pulsing gold indicator, hiding upon initial pointerdown"
  - "D-04/D-05: Implemented synchronous AudioEngine.unlock() during user gesture, setting navigator.audioSession.type = 'playback' (iOS 16.4+ silent switch bypass) and priming HTML5 audio and 1-sample silent Web Audio buffer"
  - "D-07: Added toggleMute() with 200ms linear gain ramp on master SFX GainNode and native HTML5 audio muting"
  - "D-09: Suspended AudioContext and paused HTML5 BGM stream on tab visibilitychange to hidden, resuming automatically on visible"

patterns-established:
  - "Horizontal plane raycasting with ASVS V5 radius clamping ensures robust touch-to-3D coordinates without camera pitch distortion"
  - "Synchronous gesture unlock executes in the immediate native event stack frame before any async tick to satisfy mobile browser autoplay policies"
  - "Page Visibility API integration guarantees zero background audio runaway and mobile battery preservation"

requirements-completed:
  - DIYA-02
  - AUDIO-01
  - AUDIO-02

coverage:
  - id: D1
    description: "WickProximityDetector and TouchController screen-to-world raycasting and haptics"
    requirement: DIYA-02
    verification:
      - kind: unit
        ref: "tests/interaction/touch-controller.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Floating glassmorphic TouchHint instruction prompt"
    requirement: DIYA-02
    verification:
      - kind: unit
        ref: "tests/interaction/touch-hint.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Dual-tier AudioEngine foundation with synchronous unlock and iOS silent switch bypass"
    requirement: AUDIO-01, AUDIO-02
    verification:
      - kind: unit
        ref: "tests/audio/audio-engine.test.ts"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-11-04
status: complete
---

# Phase 04 Plan 01: Touch Interaction Controller & Dual-Tier Audio Engine Foundation Summary

**Interactive 3D touch-and-drag match controller on horizontal plane y = 0.68 with Euclidean WickAnchor proximity detection, floating glassmorphic touch hint UI, and foundational dual-tier AudioEngine with iOS silent switch bypass and synchronous gesture unlock**

## Performance

- **Duration:** 9 min
- **Started:** 2026-11-04T04:42:00Z
- **Completed:** 2026-11-04T04:51:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Implemented `WickProximityDetector` in `src/interaction/proximity-detector.ts` calculating 3D Euclidean distance to `WickAnchor` `(0.0, 0.68, 1.38)` with proximity threshold `< 0.35` units per D-02.
- Implemented `TouchController` in `src/interaction/touch-controller.ts` with Raycaster projection onto infinite horizontal plane `y = 0.68`, ASVS V5 boundary clamping (`Math.hypot(x, z) <= 3.2`) to prevent horizon ray runaway (T-04-01), match follower visibility lifecycle, and haptic feedback (`navigator.vibrate([30, 50, 40])`) upon crossing proximity threshold.
- Implemented `TouchHint` in `src/interaction/touch-hint.ts` mounting a floating glassmorphic pill prompt (`id="touch-hint-prompt"`, `role="status"`, `aria-live="polite"`, `bg-amber-950/80`, `backdrop-blur-md`) with a pulsing gold indicator dot and smooth opacity/scale transitions without dynamic HTML interpolation (T-04-02).
- Implemented foundational `AudioEngine` singleton in `src/audio/audio-engine.ts` with synchronous `unlock()` handshake, W3C Audio Session API (`navigator.audioSession.type = 'playback'`) for iOS 16.4+ silent switch bypass, 1-sample silent Web Audio buffer priming, HTML5 BGM streaming with 2s fade-in (`0.0 -> 0.7`), 200ms linear gain ramp mute toggling, and Page Visibility API suspension (T-04-03).
- Added comprehensive unit test suites across all components with 100% pass rate (27 new unit tests, 118 total tests across 18 test files in project passing).

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement WickProximityDetector and TouchController with Horizontal Plane Raycasting** - `bf78a61` (feat)
2. **Task 2: Implement Floating Glassmorphic TouchHint UI Component** - `aec2fe2` (feat)
3. **Task 3: Implement Dual-Tier AudioEngine Foundation, Gesture Unlock, and HTML5 BGM Streaming** - `b947bad` (feat)

## Files Created/Modified

- `src/interaction/proximity-detector.ts` - `WickProximityDetector` class calculating 3D distance to `WickAnchor` `(0.0, 0.68, 1.38)` with `< 0.35` threshold
- `src/interaction/touch-controller.ts` - `TouchController` class handling pointer events, plane raycasting, radius clamping, haptic pulse, and ignition callback
- `src/interaction/touch-hint.ts` - `TouchHint` glassmorphic prompt component with pulsing indicator and ARIA status
- `src/audio/audio-engine.ts` - `AudioEngine` singleton coordinator with synchronous unlock, iOS silent switch bypass, HTML5 BGM streaming, and visibility suspension
- `tests/interaction/touch-controller.test.ts` - Unit tests for proximity detector, plane raycasting, boundary clamping, drag lifecycle, and haptics
- `tests/interaction/touch-hint.test.ts` - Unit tests for DOM mounting, glassmorphic Tailwind classes, visibility transitions, and disposal
- `tests/audio/audio-engine.test.ts` - Unit tests for singleton pattern, synchronous unlock, silent switch intent, volume fade, mute toggling, and visibility suspension

## Decisions Made

- [D-01] Intersected pointer NDC coordinates against `THREE.Plane(new THREE.Vector3(0, 1, 0), -0.68)` and clamped coordinates to `Math.hypot(x, z) <= 3.2` to eliminate horizon runaway and NaN values.
- [D-02] Triggered haptic feedback `navigator.vibrate([30, 50, 40])` wrapped in try-catch for graceful no-op on iOS Safari and restricted WebViews.
- [D-03] Rendered `TouchHint` with static verified HTML containing right arrow entity and pulsing indicator, ensuring zero dynamic unsanitized string interpolation.
- [D-04, D-05] Synchronously unlocked Web Audio `AudioContext` and primed HTML5 `<audio id="festive-bgm">` in the user gesture stack frame with `navigator.audioSession.type = 'playback'`, enabling audio even on hardware-muted iPhones.
- [D-07] Provided smooth 200ms linear gain ramp (`linearRampToValueAtTime`) on master SFX GainNode during mute/unmute transitions.
- [D-09] Implemented `document.addEventListener('visibilitychange')` on `AudioEngine` to suspend Web Audio and pause HTML5 BGM on hidden tabs, resuming on tab focus.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. All 27 new tests and 118 total project tests passed with zero regressions.

## User Setup Required

None - no external services or API keys required.

## Next Phase Readiness

- Foundation ready for Wave 2 (`04-02-PLAN.md`): procedural match-strike and flame crackle synthesizer (`SfxSynthesizer`), floating glassmorphic audio toggle button (`AudioToggle`), and full integration into `PasscodeGate`, `SceneManager`, and `main.ts`.

## Self-Check: PASSED
- `src/interaction/proximity-detector.ts`: FOUND
- `src/interaction/touch-controller.ts`: FOUND
- `src/interaction/touch-hint.ts`: FOUND
- `src/audio/audio-engine.ts`: FOUND
- `tests/interaction/touch-controller.test.ts`: FOUND
- `tests/interaction/touch-hint.test.ts`: FOUND
- `tests/audio/audio-engine.test.ts`: FOUND
- Commit bf78a61: FOUND
- Commit aec2fe2: FOUND
- Commit b947bad: FOUND

---
*Phase: 04-touch-interaction-controller-dual-tier-audio-architecture*
*Plan: 01*
*Completed: 2026-11-04*
