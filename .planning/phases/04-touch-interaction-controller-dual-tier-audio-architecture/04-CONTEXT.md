# Phase 4: Touch Interaction Controller & Dual-Tier Audio Architecture - Context

**Gathered:** 2026-11-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the interactive touch gesture controller (dragging a virtual festive match/flame to the cotton wick with Raycaster proximity detection, haptic feedback, and auto-ignition) and the dual-tier mobile audio engine (HTML5 audio streaming for ambient sitar/flute soundtrack bypassing the iOS physical silent switch, plus low-latency Web Audio API synthesis/buffers for match-strike and crackle SFX, unlocked deterministically during passcode submission with a floating glassmorphic mute/unmute control).

</domain>

<decisions>
## Implementation Decisions

### 1. Touch-and-Drag Match Controller
- **D-01:** **Raycaster / Screen-to-World Projection**: Recipient touches screen in `INTERACTIVE_UNLIT` state; a virtual match stick with a glowing ember/flame follower tracks touch/pointer in 3D world space projected onto an elevated horizontal plane passing through `WickAnchor` `(y ~ 0.68)`.
- **D-02:** **Proximity Detection Threshold**: Calculates Euclidean distance in 3D space between match tip and `WickAnchor` `(0.0, 0.68, 1.38)`. When distance drops below `< 0.35` units:
  - Triggers phone haptic feedback (`navigator.vibrate([30, 50, 40])` where supported).
  - Fires match-strike & crackle sound effect via Web Audio API.
  - Transitions `AppStateMachine` from `INTERACTIVE_UNLIT` to `IGNITING`.
  - Hides virtual match follower smoothly.
- **D-03:** **Subtle Touch Hint UI**: When entering `INTERACTIVE_UNLIT`, displays an ethereal animated floating prompt: *"Touch and drag the flame to light your Diya"* with a pulsing gold shimmer chevron/icon. Fades out immediately upon initial touch.

### 2. Dual-Tier Audio Engine (iOS Silent Switch & Autoplay Compliant)
- **D-04:** **Gesture Unlock Handshake**: During passcode submit button tap in `PasscodeGate`, synchronously calls `audioEngine.unlock()` which executes `audioContext.resume()` and preps the streaming audio element within the direct user gesture stack frame to satisfy WebKit & Blink autoplay security policies.
- **D-05:** **HTML5 Audio BGM Streaming (Bypassing iOS Silent Switch)**: Uses native `<audio id="festive-bgm" loop preload="none">` playing royalty-free / authentic festive Indian bansuri & sitar instrumental track. HTML5 `<audio>` streams directly from network/disk without loading large MBs into JS memory, and routes through media channel rather than ambient sound channel, playing even when iOS hardware mute switch is turned on. Fades in smoothly over 2 seconds (`volume: 0.0 -> 0.7`) upon entering `UNLOCKED_INTRO`.
- **D-06:** **Web Audio API Low-Latency SFX**: Implements synthesized procedural audio or ultra-compact sound buffers (<30 KB) for:
  - Match strike / friction swish: Bandpass-filtered white noise burst (120ms).
  - Flame crackle: Sporadic micro-clicks and low-frequency rumble (40-120Hz).
  - Zero network delay, instant touch feedback.
- **D-07:** **Floating Glassmorphic Audio Toggle**: A fixed floating pill button in the top-right corner (`z-index: 20`) displaying speaker icon (waves when unmuted, stroke when muted). Tapping toggles global mute state across both HTML5 BGM and Web Audio SFX with smooth 200ms gain ramp.

### 3. State Machine & Lifecycle Integration
- **D-08:** **State Coordination**:
  - `LOCKED` -> Passcode tap: Audio unlocked, primed.
  - `UNLOCKED_INTRO` -> Camera dollies forward, BGM fades in. Intro ends -> transitions to `INTERACTIVE_UNLIT`.
  - `INTERACTIVE_UNLIT` -> Match follower active, touch hint visible. Proximity crossed -> transitions to `IGNITING`, match SFX fires, haptics vibrate.
  - `IGNITING` -> Flame ignites, camera pans, sparklers burst. On completion -> transitions to `LIT_CELEBRATION`.
- **D-09:** **Resource & Battery Resilience**: Pauses audio context and HTML5 streaming when `document.hidden` is true (Page Visibility API); resumes when tab regains focus. Complete cleanup on `dispose()`.

</decisions>

<canonical_refs>
## Canonical References

- `GEMINI.md` § Audio Architecture: Web Audio API vs Howler.js
- `GEMINI.md` § Gesture Unlock Handshake
- `.planning/ROADMAP.md` § Phase 4: DIYA-02, AUDIO-01, AUDIO-02, AUDIO-03, AUDIO-04
- `.planning/phases/03-procedural-glsl-flame-shader-additive-bloom-particle-fx/03-VERIFICATION.md` — Verified `FlameController` and `WickAnchor` at `(0.0, 0.68, 1.38)`
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/state-machine.ts`: States `INTERACTIVE_UNLIT`, `IGNITING`, `LIT_CELEBRATION`.
- `src/ui/passcode-gate.ts`: Handles passcode submission where synchronous audio unlock must be hooked.
- `src/graphics/scene-manager.ts`: Manages camera, canvas, raycaster projection, and render loop.
- `src/graphics/meshes/procedural-diya-geometry.ts`: `WickAnchor` at `(0.0, 0.68, 1.38)`.

</code_context>
