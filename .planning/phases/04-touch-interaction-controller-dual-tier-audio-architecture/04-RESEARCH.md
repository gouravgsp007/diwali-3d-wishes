# Phase 4: Touch Interaction Controller & Dual-Tier Audio Architecture - Research
**Researched:** 2026-11-04  
**Domain:** Mobile Touch Gestures, 3D Raycasting, Proximity Detection, Web Audio API, HTML5 Audio Streaming, iOS WebKit Audio Session Policies  
**Confidence:** HIGH  

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 1. Touch-and-Drag Match Controller
- **D-01: Raycaster / Screen-to-World Projection**: Recipient touches screen in `INTERACTIVE_UNLIT` state; a virtual match stick with a glowing ember/flame follower tracks touch/pointer in 3D world space projected onto an elevated horizontal plane passing through `WickAnchor` `(y ~ 0.68)`.
- **D-02: Proximity Detection Threshold**: Calculates Euclidean distance in 3D space between match tip and `WickAnchor` `(0.0, 0.68, 1.38)`. When distance drops below `< 0.35` units:
  - Triggers phone haptic feedback (`navigator.vibrate([30, 50, 40])` where supported).
  - Fires match-strike & crackle sound effect via Web Audio API.
  - Transitions `AppStateMachine` from `INTERACTIVE_UNLIT` to `IGNITING`.
  - Hides virtual match follower smoothly.
- **D-03: Subtle Touch Hint UI**: When entering `INTERACTIVE_UNLIT`, displays an ethereal animated floating prompt: *"Touch and drag the flame to light your Diya"* with a pulsing gold shimmer chevron/icon. Fades out immediately upon initial touch.

#### 2. Dual-Tier Audio Engine (iOS Silent Switch & Autoplay Compliant)
- **D-04: Gesture Unlock Handshake**: During passcode submit button tap in `PasscodeGate`, synchronously calls `audioEngine.unlock()` which executes `audioContext.resume()` and preps the streaming audio element within the direct user gesture stack frame to satisfy WebKit & Blink autoplay security policies.
- **D-05: HTML5 Audio BGM Streaming (Bypassing iOS Silent Switch)**: Uses native `<audio id="festive-bgm" loop preload="none">` playing royalty-free / authentic festive Indian bansuri & sitar instrumental track. HTML5 `<audio>` streams directly from network/disk without loading large MBs into JS memory, and routes through media channel rather than ambient sound channel, playing even when iOS hardware mute switch is turned on. Fades in smoothly over 2 seconds (`volume: 0.0 -> 0.7`) upon entering `UNLOCKED_INTRO`.
- **D-06: Web Audio API Low-Latency SFX**: Implements synthesized procedural audio or ultra-compact sound buffers (<30 KB) for:
  - Match strike / friction swish: Bandpass-filtered white noise burst (120ms).
  - Flame crackle: Sporadic micro-clicks and low-frequency rumble (40-120Hz).
  - Zero network delay, instant touch feedback.
- **D-07: Floating Glassmorphic Audio Toggle**: A fixed floating pill button in the top-right corner (`z-index: 20`) displaying speaker icon (waves when unmuted, stroke when muted). Tapping toggles global mute state across both HTML5 BGM and Web Audio SFX with smooth 200ms gain ramp.

#### 3. State Machine & Lifecycle Integration
- **D-08: State Coordination**:
  - `LOCKED` -> Passcode tap: Audio unlocked, primed.
  - `UNLOCKED_INTRO` -> Camera dollies forward, BGM fades in. Intro ends -> transitions to `INTERACTIVE_UNLIT`.
  - `INTERACTIVE_UNLIT` -> Match follower active, touch hint visible. Proximity crossed -> transitions to `IGNITING`, match SFX fires, haptics vibrate.
  - `IGNITING` -> Flame ignites, camera pans, sparklers burst. On completion -> transitions to `LIT_CELEBRATION`.
- **D-09: Resource & Battery Resilience**: Pauses audio context and HTML5 streaming when `document.hidden` is true (Page Visibility API); resumes when tab regains focus. Complete cleanup on `dispose()`.

### the agent's Discretion
- Virtual matchstick 3D mesh geometry and glowing ember styling (e.g., slender cylinder with warm emissive sphere tip and subtle glow billboard sprite).
- Touch hint styling, positioning, and CSS keyframe animations.
- Specific Web Audio synthesis node graph parameters (oscillator frequencies, filter cutoffs, noise buffer lengths, Q values).
- Glassmorphic mute button SVG icon geometry and exact micro-interaction hover/active states.

### Deferred Ideas (OUT OF SCOPE)
- Interactive 3D sparkler tap bursts in lit state (deferred to Phase 5: VFX-05).
- Custom audio upload or selection by sender (deferred to v2 / post-MVP).
- Positional 3D spatialized audio (`PannerNode`) for the diya flame (deferred to avoid mobile HRTF panning distortion on mono phone speakers).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **DIYA-02** | Recipient can drag a virtual flame/match toward the cotton wick with responsive mobile touch gesture tracking and proximity collision detection. | Unifies Pointer Events (`pointerdown`, `pointermove`, `pointerup`), Three.js `Raycaster` with infinite horizontal plane `Plane(Vector3(0, 1, 0), -0.68)`, 3D match follower tracking, Euclidean distance proximity check (<0.35) against `WickAnchor` `(0.0, 0.68, 1.38)`, and `navigator.vibrate` haptic pulse. |
| **AUDIO-01** | Passcode submit tap synchronously unlocks and primes Web Audio API and HTML5 audio context to guarantee compliance with mobile autoplay policies. | Synchronous gesture unlock hook inside `PasscodeGate.handleUnlock()` calling `AudioEngine.unlock()` before any async `await` microtask, invoking `audioContext.resume()`, 1-sample silent Web Audio buffer playback, and HTML5 audio prime-and-pause to satisfy WebKit & Blink autoplay restrictions. |
| **AUDIO-02** | System streams continuous ambient Indian classical sitar/flute soundtrack using HTML5 audio to bypass the iOS hardware silent switch. | Leverages iOS 16.4+ `navigator.audioSession.type = 'playback'` and standalone HTML5 `<audio>` element media channel routing (`AVAudioSessionCategoryPlayback`), preventing the physical iPhone silent/mute switch from muting the festive soundtrack, with smooth 2-second volume fade-in upon `UNLOCKED_INTRO`. |
| **AUDIO-03** | System plays low-latency match-strike and flame crackle sound effects via Web Audio API upon ignition. | Fully procedural Web Audio API synthesis generating bandpass-filtered noise burst (120ms) for match friction and randomized impulse micro-clicks with low-frequency rumble (40-120Hz) for crackle. Delivers 0ms latency and 0 KB network payload with no external audio file downloads. |
| **AUDIO-04** | Recipient can toggle sound on/off at any time using a floating glassmorphic mute/unmute control. | Floating glassmorphic pill button (`fixed top-4 right-4 z-20`) with animated speaker SVG icon. Controls global mute state with smooth 200ms linear gain ramping for both HTML5 BGM stream and Web Audio SFX bus. |
</phase_requirements>

## Project Constraints (from GEMINI.md)

- **Performance**: High frame rate (60fps) on mid-tier mobile smartphones without draining battery or causing lag.
- **Audio Autoplay Policies**: Modern mobile browsers block audio autoplay before user interaction; audio must start seamlessly upon entering passcode or interacting with the page.
- **No Heavy Physics Engines**: No `cannon-es`, `rapier3d`, or `ammo.js`. Use procedural math inside `requestAnimationFrame` or simple Euclidean distance calculations.
- **No Bloated Audio Libraries**: No Howler.js (~7.2 KB gz, 35 KB unminified). Use native Web Audio API + HTML5 Audio (0 KB runtime footprint).
- **Glassmorphism UI**: Tailwind CSS v4 utility classes (`backdrop-blur-md`, `bg-white/[0.08]`, `border-amber-500/20`, dynamic viewport units `100svh`).

## Summary

Phase 4 bridges the sensory divide of the Diwali 3D Wishes experience by introducing tactile interactivity and atmospheric sound. The phase delivers two cohesive systems:
1. **Touch-and-Drag Match Controller**: A mobile-first 3D interaction system that translates user touches on the screen into a 3D virtual matchstick with a glowing ember tip that glides smoothly across an elevated horizontal plane (`y = 0.68`) intersecting the cotton wick. When dragged within `< 0.35` units of `WickAnchor` `(0.0, 0.68, 1.38)`, it triggers an immediate haptic pulse (`navigator.vibrate([30, 50, 40])`), fires ignition SFX, hides the match follower, and advances the FSM from `INTERACTIVE_UNLIT` to `IGNITING`.
2. **Dual-Tier Mobile Audio Architecture**: A zero-bundle-overhead (0 KB external library) audio engine addressing the infamous WebKit iOS Safari audio constraints:
   - **Autoplay Compliance**: Synchronously primes both `AudioContext` and HTML5 `<audio>` during the passcode submit tap in `PasscodeGate` before any `await` microtask ticks.
   - **iOS Silent Switch Bypass**: Configures `navigator.audioSession.type = 'playback'` (iOS 16.4+) and preserves direct HTML5 `<audio>` media-channel streaming so the bansuri/sitar soundtrack plays even when an iPhone's physical side mute switch is engaged.
   - **Zero-Latency Procedural SFX**: Synthesizes match-strike friction and flame crackle sound effects procedurally via Web Audio API nodes (`BiquadFilterNode`, `AudioBufferSourceNode`, `GainNode`, `OscillatorNode`), eliminating network delay, asset loading errors, and bandwidth costs.
   - **Global Control & Battery Resilience**: Provides a floating glassmorphic mute/unmute toggle (`z-20`) with 200ms gain ramps, and automatically pauses all audio and rendering when `document.hidden` is true via the Page Visibility API.

**Primary recommendation:** Build `TouchController` with infinite horizontal plane raycasting (`THREE.Plane(new THREE.Vector3(0, 1, 0), -0.68)`) and procedural Web Audio synthesis for SFX combined with native HTML5 `<audio>` for BGM streaming, managed by a centralized `AudioEngine` singleton.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| **Touch Gesture Capture** | Browser / DOM | Client 3D Scene | Pointer events (`pointerdown`, `pointermove`, `pointerup`) captured on `#app` container with unified mobile touch and mouse handling. |
| **Screen-to-3D Projection** | Client 3D Scene (`Three.js`) | Browser / DOM | `Raycaster.ray.intersectPlane()` projects 2D normalized device coordinates onto infinite horizontal plane `y = 0.68`. |
| **Proximity Collision Detection** | Client 3D Controller | Client FSM | Vector Euclidean distance calculation (`matchTip.distanceTo(wickAnchor) < 0.35`) evaluated on pointer move; triggers FSM state transition. |
| **Haptic Feedback** | Browser / Device Hardware | — | `navigator.vibrate` called directly on mobile devices that support the Vibration API. |
| **Floating Touch Hint UI** | Browser / DOM (`Tailwind CSS`) | Client FSM | Glassmorphic floating banner showing animated instruction, fading out on initial user touch. |
| **Gesture Unlock Handshake** | Browser / DOM Event Loop | Audio Engine | Synchronous execution inside `PasscodeGate` submit button handler before Promise tick. |
| **Ambient BGM Streaming** | Native HTML5 Audio Element | Browser Media Channel | Direct `<audio>` playback streaming MP3 over media category, bypassing iOS silent switch. |
| **Match Strike & Crackle SFX** | Native Web Audio API | Client Audio Synthesis | In-memory procedural node graph execution for 0ms latency and 0 KB network payload. |
| **Audio Session Management** | Browser / W3C Audio Session API | Device Audio Engine | `navigator.audioSession.type = 'playback'` ensures iOS treats web session as native media. |
| **Floating Glassmorphic Mute UI** | Browser / DOM (`Tailwind CSS`) | Audio Engine | Top-right floating button toggling master gain with smooth 200ms ramp. |
| **Tab Suspension & Resume** | Browser Page Visibility API | Audio Engine & SceneManager | Halts Web Audio clock and pauses BGM stream on tab hide; resumes gracefully on focus. |

## Standard Stack

### Core
| Library / API | Version | Purpose | Why Standard |
|---------------|---------|---------|--------------|
| **Three.js** | `^0.187.0` [VERIFIED: npm registry] | 3D Raycasting, Plane Intersection, Match Mesh | Industry standard WebGL math library; provides battle-tested `THREE.Raycaster` and `THREE.Plane`. |
| **Native Web Audio API** | Living Standard (W3C) [VERIFIED: MDN] | Procedural SFX Synthesis & Low-Latency Playback | 0 KB bundle weight; sample-accurate timing; zero network delay for touch feedback. |
| **HTML5 Audio Element** | Living Standard (HTML Living Standard) [VERIFIED: MDN] | Continuous Streaming BGM Loop | Streams audio without buffering full file into RAM; routes to iOS media playback channel. |
| **W3C Audio Session API** | iOS 16.4+ / Modern WebKit [VERIFIED: WebKit] | Hardware Silent Switch Bypass | `navigator.audioSession.type = 'playback'` provides native `AVAudioSessionCategoryPlayback` behavior. |
| **@tweenjs/tween.js** | `^25.0.0` [VERIFIED: npm registry] | Camera Dolly Timing & Audio Gain Interpolation | Ultra-lightweight (~3.5 KB gz); synchronizes with Three.js RAF loop. |
| **Tailwind CSS** | `^4.0.0` [VERIFIED: npm registry] | Floating Glassmorphic UI & Touch Hint Styling | Zero-runtime utility classes for glassmorphic cards, z-index layering, and shimmer animations. |

### Supporting
| Library / API | Version | Purpose | When to Use |
|---------------|---------|---------|-------------|
| **Vibration API** (`navigator.vibrate`) | W3C Standard [VERIFIED: MDN] | Haptic pulse upon wick proximity crossing | Supported on Android Chrome and modern mobile browsers (`[30, 50, 40]` ms pulse). |
| **Page Visibility API** (`document.visibilitychange`) | Living Standard [VERIFIED: MDN] | Suspend audio and RAF when tab is hidden | Prevents battery drain and background audio runaway. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| **Native Web Audio + HTML5 Audio** | Howler.js (`v2.2.4`) | Howler adds ~7.2 KB gz (35 KB raw), lacks native `navigator.audioSession` control, and forces HTML5 audio into memory buffers unless explicitly degraded. |
| **Infinite Horizontal Plane Raycast** | Mesh Raycasting (`diyaMesh`) | Raycasting against displaced LatheGeometry geometry causes depth jitter, edge misses, and pointer snagging. Plane `y = 0.68` guarantees smooth 60fps tracking. |
| **Procedural SFX Synthesis** | Audio MP3/WAV Asset Files | Asset files require network fetching (~20-50 KB), risk 404/loading lag, and can stutter on slow 3G/4G connections. Procedural synthesis is 0 KB and instant. |
| **`navigator.vibrate`** | Custom haptic libraries | Browser-native API is zero overhead and gracefully no-ops on unsupported platforms (like iOS Safari). |

**Installation:**
No new external npm packages required. All dependencies are already installed in `package.json`:
```bash
# Existing in repo:
# "three": "^0.187.0"
# "@tweenjs/tween.js": "^25.0.0"
# "tailwindcss": "^4.0.0"
```

## Package Legitimacy Audit

No new external npm packages are introduced in Phase 4. All features are built using native browser APIs (Web Audio API, HTML5 Audio, Vibration API, Page Visibility API) and existing, verified workspace dependencies:

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `three` | npm | 14 yrs | 33M/wk | github.com/mrdoob/three.js | [OK] [VERIFIED: npm registry] | Approved (existing) |
| `@tweenjs/tween.js` | npm | 14 yrs | 21M/wk | github.com/tweenjs/tween.js | [OK] [VERIFIED: npm registry] | Approved (existing) |
| `tailwindcss` | npm | 7 yrs | 14M/wk | github.com/tailwindlabs/tailwindcss | [OK] [VERIFIED: npm registry] | Approved (existing) |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none  

## In-Repo Discrete Value Citations

Per the in-repo value provenance rule, the following discrete values were opened and verified directly from the source-of-truth files during this session:

1. **State Machine States and Events** [VERIFIED: src/app/state-machine.ts:3-19]
   Verbatim quote:
   ```ts
   export type AppState =
     | 'BOOT'
     | 'LOCKED'
     | 'UNLOCKED_INTRO'
     | 'INTERACTIVE_UNLIT'
     | 'IGNITING'
     | 'LIT_CELEBRATION'
     | 'GREETING_REVEAL';

   export type AppEvent =
     | { type: 'BOOT_COMPLETE'; hasCiphertext: boolean }
     | { type: 'UNLOCK_SUCCESS'; payload: GreetingPayload }
     | { type: 'INTRO_COMPLETE' }
     | { type: 'WICK_TOUCHED' }
     | { type: 'IGNITION_COMPLETE' }
     | { type: 'CELEBRATION_COMPLETE' }
     | { type: 'REPLAY' };
   ```
   Verbatim quote of transition in `INTERACTIVE_UNLIT` [VERIFIED: src/app/state-machine.ts:62-66]:
   ```ts
         case 'INTERACTIVE_UNLIT':
           if (event.type === 'WICK_TOUCHED') {
             this.currentState = 'IGNITING';
           }
           break;
   ```

2. **WickAnchor Coordinates** [VERIFIED: src/graphics/meshes/procedural-diya-geometry.ts:85]
   Verbatim quote:
   ```ts
     const wickAnchor = new THREE.Vector3(0.0, 0.68, 1.38);
   ```

3. **Passcode Unlock Synchronous Priming** [VERIFIED: src/ui/passcode-gate.ts:63-66]
   Verbatim quote:
   ```ts
       // 1. Synchronously prime Web Audio API context during the user gesture callback (D-11)
       // Must be invoked prior to any await microtask tick to satisfy mobile WebKit policies
       primeAudioContext();
   ```

4. **SceneManager State Change Camera Transitions** [VERIFIED: src/graphics/scene-manager.ts:195-206]
   Verbatim quote:
   ```ts
     private handleStateChange(state: AppState): void {
       if (state === 'UNLOCKED_INTRO') {
         // Cinematic dolly forward upon passcode unlock (D-15)
         this.cameraRig?.dollyTo(new THREE.Vector3(0, 2.0, 3.2), 1200);
       } else if (state === 'IGNITING') {
         // Smooth upward target pan to frame flame + greeting card (D-07)
         this.cameraRig?.panTargetTo(new THREE.Vector3(0, 0.65, 0), 1000);
         this.flameController?.ignite().then(() => {
           this.fsm?.transition({ type: 'IGNITION_COMPLETE' });
         });
       }
     }
   ```

## Architecture Patterns

### System Architecture Diagram

```mermaid
flowchart TD
    subgraph UI_Layer ["UI Layer (DOM)"]
        PG["PasscodeGate (#passcode-form)"]
        TH["TouchHintUI ('Touch & drag flame to light Diya')"]
        AT["AudioToggle (Floating Glassmorphic Pill z-20)"]
    end

    subgraph FSM_Layer ["Application FSM"]
        FSM["AppStateMachine"]
    end

    subgraph Touch_System ["Touch & 3D Interaction"]
        PE["Pointer Events (pointerdown, pointermove, pointerup)"]
        RC["Raycaster Projection (y = 0.68 Plane)"]
        MF["Virtual Match Follower Tip (3D Mesh + Ember)"]
        PD{"Distance to WickAnchor (0.0, 0.68, 1.38) < 0.35?"}
        HAP["Haptic Pulse (navigator.vibrate)"]
    end

    subgraph Audio_Architecture ["Dual-Tier Audio Engine"]
        AE["AudioEngine Singleton"]
        subgraph Tier1 ["Tier 1: HTML5 Audio BGM"]
            AS["navigator.audioSession.type = 'playback'"]
            HA["HTML5 <audio id='festive-bgm' loop>"]
            VOL["2s Volume Fade-In (0.0 -> 0.7)"]
        end
        subgraph Tier2 ["Tier 2: Web Audio API Procedural SFX"]
            AC["AudioContext (Primed & Running)"]
            SFX_SWISH["Match Strike Bandpass Burst (120ms)"]
            SFX_CRACKLE["Flame Crackle Noise & Low Rumble"]
            MG["Master SFX GainNode"]
        end
    end

    subgraph Graphics_Engine ["3D Scene & FX"]
        FC["FlameController.ignite()"]
        CR["CameraRig (dollyTo, panTargetTo)"]
    end

    PG -- "1. Submit Tap: primeAudioContext() & audioEngine.unlock()" --> AE
    PG -- "2. Decrypt Success: UNLOCK_SUCCESS" --> FSM
    FSM -- "state: UNLOCKED_INTRO" --> CR
    FSM -- "state: UNLOCKED_INTRO" --> VOL
    CR -- "1200ms Dolly Complete -> INTRO_COMPLETE" --> FSM
    FSM -- "state: INTERACTIVE_UNLIT" --> TH
    FSM -- "state: INTERACTIVE_UNLIT" --> PE

    PE -- "Touch / Drag Event" --> TH
    TH -- "Fades Out on 1st Touch" --> TH
    PE -- "Pointer Coordinates (x, y)" --> RC
    RC -- "Projects to 3D World Space" --> MF
    MF -- "Calculate Distance" --> PD

    PD -- "Yes (dist < 0.35)" --> HAP
    PD -- "Yes" --> SFX_SWISH
    PD -- "Yes" --> SFX_CRACKLE
    PD -- "Yes: transition({ type: 'WICK_TOUCHED' })" --> FSM

    FSM -- "state: IGNITING" --> FC
    FC -- "Ignition Complete -> IGNITION_COMPLETE" --> FSM

    AT -- "Tap Toggle" --> AE
    AE -- "Smooth 200ms Mute/Unmute Ramp" --> HA
    AE -- "Smooth 200ms Mute/Unmute Ramp" --> MG
```

### Recommended Project Structure
```
src/
├── app/
│   ├── event-bus.ts
│   └── state-machine.ts              # Existing FSM
├── audio/
│   ├── audio-engine.ts               # Central coordinator: BGM stream, AudioContext, mute, visibility
│   ├── audio-unlock.ts               # Synchronous gesture unlock routines
│   └── sfx-synthesizer.ts            # Procedural Web Audio synthesis (match strike, flame crackle)
├── interaction/
│   ├── proximity-detector.ts         # Euclidean distance check against WickAnchor (0.0, 0.68, 1.38)
│   ├── touch-controller.ts           # Pointer event listeners, horizontal plane raycaster, match follower
│   └── touch-hint.ts                 # Floating glassmorphic animated touch instruction
├── ui/
│   ├── audio-toggle.ts               # Floating glassmorphic mute/unmute button controller
│   ├── passcode-gate.ts              # Enhanced with audioEngine.unlock() hook
│   └── url-resolver.ts
└── graphics/
    ├── scene-manager.ts              # Connects TouchController to render loop and CameraRig
    └── fx/
        └── flame-controller.ts
```

### Pattern 1: Infinite Horizontal Plane Raycaster (`Plane(Vector3(0, 1, 0), -0.68)`)
**What:** Rather than raycasting against 3D geometries or a finite quad, create a mathematical `THREE.Plane` aligned horizontally with `WickAnchor.y` (`0.68`).  
**When to use:** Projecting screen touches to world space in `INTERACTIVE_UNLIT`.  
**Implementation Details:**
- A plane perpendicular to the Y axis passing through `y = 0.68` is defined by normal `Vector3(0, 1, 0)` and constant `-0.68` (`n · p + constant = 0 => 1*(0.68) + (-0.68) = 0`).
- Convert pointer coordinates to NDC `[-1, 1]`.
- Call `raycaster.setFromCamera(ndc, camera)`.
- Call `raycaster.ray.intersectPlane(plane, targetVector)`.
- Guard against parallel rays (returns `null`).
- Clamp target vector `(x, z)` within a safe boundary radius (e.g., `radius <= 3.0`) around the origin to prevent extreme values when dragging near the horizon.

### Pattern 2: Dual-Tier Audio Architecture with Silent Switch Bypass
**What:** Distribute audio duties across two distinct web APIs:
1. **HTML5 Audio Element (`<audio id="festive-bgm">`)**: Streams ambient instrumental music (bansuri/sitar). Because it is not connected through Web Audio's `createMediaElementSource()` (which iOS WebKit downgrades to ambient ringer category), it routes directly through the native media playback channel (`AVAudioSessionCategoryPlayback`), playing even when the user's iPhone hardware silent switch is set to Silent.
2. **Web Audio API (`AudioContext`)**: Used exclusively for low-latency, real-time procedural sound effects (match strike and crackle).
3. **W3C Audio Session API (`navigator.audioSession.type = 'playback'`)**: Explicitly declares media playback intent to WebKit on iOS 16.4+, unifying both tiers.

### Pattern 3: Synchronous Unlock Handshake inside User Event Loop
**What:** WebKit (iOS Safari) and Blink (Chrome/Android) will block `AudioContext.resume()` and `HTMLAudioElement.play()` if called after any asynchronous microtask (such as `await` for cryptographic key derivation or network fetch).  
**When to use:** In `PasscodeGate.mount()` form submit listener.  
**Execution Order:**
1. User taps "Open Festive Wish" submit button.
2. Form submit event fires.
3. Synchronously invoke `audioEngine.unlock()` before any `await`:
   - Set `navigator.audioSession.type = 'playback'` if available.
   - Call `audioContext.resume()`.
   - Play a 1-sample silent buffer on Web Audio API to satisfy iOS audio session priming.
   - Prime the HTML5 `<audio>` element with `play().then(() => pause())` or start with volume 0.
4. Execute `await GreetingCodec.decrypt(...)`.
5. Upon successful unlock, transition FSM to `UNLOCKED_INTRO` and fade in BGM over 2 seconds.

### Anti-Patterns to Avoid
- **Piping HTML5 BGM through `createMediaElementSource` on iOS**: WebKit treats Web Audio graphs as ambient system sounds. Piping the `<audio>` element into an `AudioContext` causes the physical iPhone silent switch to completely mute the background music [CITED: webkit.org].
- **Calling `audioContext.resume()` after `await`**: Violates user gesture activation window. The browser throws `AutoplayPolicy` warnings and silences audio until the next user tap.
- **Raycasting against high-poly Diya meshes**: Complex geometry raycasting causes CPU spikes, frame drops on mobile, and erratic depth jumping as the pointer moves across concave surfaces.
- **Unbounded Raycast intersections**: Touching near the top of the screen where the ray points near the horizon can project the point tens of thousands of units away, causing the match follower to disappear. Always clamp to a bounding circle.
- **Relying solely on `navigator.vibrate`**: iOS Safari does not implement the Vibration API. All haptic calls must be safely wrapped in feature detection (`if ('vibrate' in navigator)`) to prevent runtime crashes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **Audio Framework** | Custom audio playback wrapper | Native `AudioContext` + HTML5 `<audio>` | Living W3C standard; 0 KB bundle; Howler.js adds 35 KB and breaks on iOS silent switch. |
| **3D Screen Projection** | Custom camera inverse projection matrix math | `THREE.Raycaster` & `THREE.Plane` | Three.js handles perspective camera vertical FOV, aspect ratio, and view-projection inversions accurately. |
| **Haptic Triggers** | Complex WebAssembly or polyfills | `navigator.vibrate([30, 50, 40])` | Native browser API; simple array of vibration/pause durations in milliseconds. |
| **Volume Easing** | Custom `setInterval` volume steps | Web Audio `GainNode.linearRampToValueAtTime()` & `@tweenjs/tween.js` | Prevents audio popping/clicking; sample-accurate volume interpolation; cancels cleanly on dispose. |

**Key insight:** Audio and touch interaction on mobile browsers are fraught with platform-specific security and hardware quirks (iOS silent switch, autoplay restrictions, gesture window expiration, touch-action scrolling conflicts). Hand-rolling complex abstractions exacerbates these issues; using direct W3C primitives with platform feature guards is cleaner, smaller, and more reliable.

## Common Pitfalls

### Pitfall 1: iOS Hardware Silent Switch Silencing Music
**What goes wrong:** User opens the greeting on an iPhone with the side silent switch enabled; no background sitar/flute music plays.  
**Why it happens:** Web Audio API graphs default to the iOS ambient/ringer audio session (`AVAudioSessionCategoryAmbient`). If the background music is routed through `AudioContext.createMediaElementSource()`, iOS mutes it in silent mode.  
**How to avoid:**
1. Leave HTML5 `<audio>` playing on its own native media channel without piping through Web Audio API.
2. In `audioEngine.unlock()`, set `navigator.audioSession.type = 'playback'` (supported on iOS 16.4+) to force WebKit to use `AVAudioSessionCategoryPlayback`.

### Pitfall 2: HTML5 `audio.volume` Ignored on iOS Safari
**What goes wrong:** Setting `audio.volume = 0.5` has no audible effect on iOS Safari; music plays at 100% device volume or stays silent.  
**Why it happens:** Apple intentionally made `HTMLMediaElement.volume` read-only on iOS devices to delegate volume control strictly to physical volume buttons.  
**How to avoid:**
1. In `AudioEngine`, implement volume fading via JavaScript interpolation of `audio.volume` for desktop and Android browsers.
2. For iOS Safari, rely on `audio.muted = true/false` for instant muting, while setting `navigator.audioSession.type = 'playback'` ensures proper media-channel volume management.

### Pitfall 3: Autoplay Security Policy Rejection
**What goes wrong:** `audioContext.resume()` or `audio.play()` rejects with `NotAllowedError: play() failed because the user didn't interact with the document first`.  
**Why it happens:** The call was deferred past an `await` statement (such as PBKDF2 key derivation), which browser engines consider outside the synchronous user gesture call stack.  
**How to avoid:** Prime and unlock both `AudioContext` and `<audio>` synchronously on the very first line of the form submit event listener before calling `GreetingCodec.decrypt()`.

### Pitfall 4: Horizon Raycast Disconnect
**What goes wrong:** Dragging the finger near the upper third of the screen causes the virtual matchstick to vanish or jump to coordinates millions of units away.  
**Why it happens:** When the camera looks at a downward angle, rays cast toward the upper screen approach the horizon and become parallel to the horizontal plane `y = 0.68`, causing the plane intersection distance to approach infinity.  
**How to avoid:**
```ts
if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
  const maxRadius = 3.2;
  const distFromCenter = Math.hypot(intersectionPoint.x, intersectionPoint.z);
  if (distFromCenter > maxRadius) {
    intersectionPoint.x = (intersectionPoint.x / distFromCenter) * maxRadius;
    intersectionPoint.z = (intersectionPoint.z / distFromCenter) * maxRadius;
  }
  matchFollower.position.copy(intersectionPoint);
}
```

### Pitfall 5: Touch-to-Scroll Page Drag Snag
**What goes wrong:** Touching and dragging the match causes the mobile browser to trigger page scrolling or pull-to-refresh instead of moving the match.  
**Why it happens:** The canvas or touch container lacks `touch-action: none`.  
**How to avoid:** Ensure the interaction container and canvas explicitly specify `touch-action: none` (already established in `index.html:12,15` and `scene-manager.ts:64`).

## Code Examples

### 1. Infinite Horizontal Plane Raycaster & Proximity Detector
```typescript
// Source: Three.js official Raycaster docs & verified WickAnchor coordinates
import * as THREE from 'three';
import type { CameraRig } from '../graphics/camera-rig';

export class TouchController {
  private raycaster = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.68); // Horizontal plane at y = 0.68
  private wickAnchor = new THREE.Vector3(0.0, 0.68, 1.38);
  private proximityThreshold = 0.35;
  private intersectionPoint = new THREE.Vector3();
  private isDragging = false;
  private isIgnited = false;

  constructor(
    private container: HTMLElement,
    private cameraRig: CameraRig,
    private matchFollower: THREE.Object3D,
    private onIgniteTrigger: () => void,
    private onTouchStart?: () => void
  ) {
    this.initListeners();
  }

  private initListeners(): void {
    this.container.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    window.addEventListener('pointermove', this.onPointerMove, { passive: false });
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (this.isIgnited) return;
    this.isDragging = true;
    this.onTouchStart?.();
    this.matchFollower.visible = true;
    this.updatePosition(e.clientX, e.clientY);
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.isDragging || this.isIgnited) return;
    this.updatePosition(e.clientX, e.clientY);
  };

  private onPointerUp = (): void => {
    if (this.isIgnited) return;
    this.isDragging = false;
    this.matchFollower.visible = false;
  };

  private updatePosition(clientX: number, clientY: number): void {
    const rect = this.container.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);

    this.raycaster.setFromCamera({ x: ndcX, y: ndcY }, this.cameraRig.camera);

    if (this.raycaster.ray.intersectPlane(this.plane, this.intersectionPoint)) {
      // Clamp boundary to prevent horizon overflow
      const maxRadius = 3.2;
      const radius = Math.hypot(this.intersectionPoint.x, this.intersectionPoint.z);
      if (radius > maxRadius) {
        this.intersectionPoint.x = (this.intersectionPoint.x / radius) * maxRadius;
        this.intersectionPoint.z = (this.intersectionPoint.z / radius) * maxRadius;
      }

      this.matchFollower.position.copy(this.intersectionPoint);

      // Check proximity to WickAnchor (0.0, 0.68, 1.38)
      const dist = this.intersectionPoint.distanceTo(this.wickAnchor);
      if (dist < this.proximityThreshold) {
        this.triggerIgnition();
      }
    }
  }

  private triggerIgnition(): void {
    this.isIgnited = true;
    this.isDragging = false;
    this.matchFollower.visible = false;

    // Haptic feedback
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([30, 50, 40]);
      } catch {}
    }

    this.onIgniteTrigger();
  }

  public dispose(): void {
    this.container.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
  }
}
```

### 2. Procedural Web Audio API SFX Synthesizer
```typescript
// Source: MDN Web Audio API synthesis patterns (zero external audio files required)
export class SfxSynthesizer {
  constructor(private audioCtx: AudioContext, private masterGain: GainNode) {}

  /**
   * Synthesizes 120ms friction match strike swish.
   */
  public playMatchStrike(): void {
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    const t = this.audioCtx.currentTime;
    const duration = 0.12;
    const sampleRate = this.audioCtx.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = this.audioCtx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate white noise with random decay
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp((-i / bufferSize) * 3);
    }

    const noiseSource = this.audioCtx.createBufferSource();
    noiseSource.buffer = buffer;

    // Bandpass filter for friction scraping character
    const bandpass = this.audioCtx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(2200, t);
    bandpass.frequency.exponentialRampToValueAtTime(1400, t + duration);
    bandpass.Q.setValueAtTime(2.5, t);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noiseSource.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start(t);
  }

  /**
   * Synthesizes flame ignition woosh and sporadic micro-crackle.
   */
  public playFlameCrackle(): void {
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    const t = this.audioCtx.currentTime;

    // 1. Warm low rumble (whoosh)
    const osc = this.audioCtx.createOscillator();
    const oscGain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.45);

    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.45);

    // 2. High frequency sporadic crackles
    const crackleDuration = 0.6;
    const bufferSize = Math.floor(this.audioCtx.sampleRate * crackleDuration);
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // 1% probability of micro-burst impulse
      if (Math.random() < 0.015) {
        data[i] = (Math.random() * 2 - 1) * 0.9;
      } else {
        data[i] = 0;
      }
    }

    const crackleSource = this.audioCtx.createBufferSource();
    crackleSource.buffer = buffer;

    const highpass = this.audioCtx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(1200, t);

    const crackleGain = this.audioCtx.createGain();
    crackleGain.gain.setValueAtTime(0.6, t);
    crackleGain.gain.exponentialRampToValueAtTime(0.01, t + crackleDuration);

    crackleSource.connect(highpass);
    highpass.connect(crackleGain);
    crackleGain.connect(this.masterGain);

    crackleSource.start(t);
  }
}
```

### 3. Dual-Tier AudioEngine with Silent Switch Bypass & Visibility Suspension
```typescript
// Source: Web Audio API & HTML5 Audio streaming best practices
import { SfxSynthesizer } from './sfx-synthesizer';

export class AudioEngine {
  private static instance: AudioEngine | null = null;
  private audioCtx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private sfxSynth: SfxSynthesizer | null = null;
  private bgmAudio: HTMLAudioElement | null = null;
  private isUnlocked = false;
  private isMuted = false;
  private wasPlayingBeforeHide = false;
  private bgmVolume = 0.7;

  private constructor() {
    this.initVisibilityListener();
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Synchronously executed within user gesture stack (Passcode submit tap).
   */
  public unlock(): void {
    if (this.isUnlocked) return;
    this.isUnlocked = true;

    // 1. Set W3C Audio Session to playback (iOS 16.4+ silent switch bypass)
    if ('audioSession' in navigator) {
      try {
        (navigator as unknown as { audioSession: { type: string } }).audioSession.type = 'playback';
      } catch {}
    }

    // 2. Initialize Web Audio API
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.sfxGain = this.audioCtx.createGain();
        this.sfxGain.connect(this.audioCtx.destination);
        this.sfxSynth = new SfxSynthesizer(this.audioCtx, this.sfxGain);

        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }

        // Silent 1-sample buffer priming for WebKit
        const silentBuf = this.audioCtx.createBuffer(1, 1, 22050);
        const src = this.audioCtx.createBufferSource();
        src.buffer = silentBuf;
        src.connect(this.audioCtx.destination);
        src.start(0);
      }
    } catch (e) {
      console.warn('Web Audio init skipped:', e);
    }

    // 3. Prime HTML5 Audio element
    try {
      this.bgmAudio = document.getElementById('festive-bgm') as HTMLAudioElement | null;
      if (!this.bgmAudio) {
        this.bgmAudio = new Audio('/audio/festive-bgm.mp3');
        this.bgmAudio.id = 'festive-bgm';
        this.bgmAudio.loop = true;
        this.bgmAudio.preload = 'auto';
        document.body.appendChild(this.bgmAudio);
      }
      this.bgmAudio.volume = 0;
      this.bgmAudio.play().then(() => {
        if (this.bgmAudio) {
          this.bgmAudio.pause();
          this.bgmAudio.currentTime = 0;
        }
      }).catch(() => {});
    } catch (e) {
      console.warn('HTML5 Audio priming skipped:', e);
    }
  }

  /**
   * Fades in BGM over 2.0 seconds upon entering UNLOCKED_INTRO.
   */
  public startBgm(): void {
    if (!this.bgmAudio || this.isMuted) return;

    this.bgmAudio.currentTime = 0;
    this.bgmAudio.volume = 0;
    this.bgmAudio.play().then(() => {
      // 2-second volume ramp
      const startTime = performance.now();
      const targetVolume = this.bgmVolume;
      const duration = 2000;

      const fade = (currentTime: number) => {
        if (!this.bgmAudio || this.isMuted) return;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1.0);
        this.bgmAudio.volume = progress * targetVolume;
        if (progress < 1.0) {
          requestAnimationFrame(fade);
        }
      };
      requestAnimationFrame(fade);
    }).catch((err) => console.warn('BGM play deferred:', err));
  }

  public playMatchStrike(): void {
    if (this.isMuted) return;
    this.sfxSynth?.playMatchStrike();
  }

  public playFlameCrackle(): void {
    if (this.isMuted) return;
    this.sfxSynth?.playFlameCrackle();
  }

  /**
   * Toggles global mute state with 200ms gain ramp.
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;

    if (this.isMuted) {
      if (this.bgmAudio) {
        this.bgmAudio.muted = true;
      }
      if (this.sfxGain && this.audioCtx) {
        this.sfxGain.gain.setValueAtTime(this.sfxGain.gain.value, this.audioCtx.currentTime);
        this.sfxGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.2);
      }
    } else {
      if (this.bgmAudio) {
        this.bgmAudio.muted = false;
        this.bgmAudio.volume = this.bgmVolume;
      }
      if (this.sfxGain && this.audioCtx) {
        this.sfxGain.gain.setValueAtTime(this.sfxGain.gain.value, this.audioCtx.currentTime);
        this.sfxGain.gain.linearRampToValueAtTime(1.0, this.audioCtx.currentTime + 0.2);
      }
    }

    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private initVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.bgmAudio && !this.bgmAudio.paused) {
          this.wasPlayingBeforeHide = true;
          this.bgmAudio.pause();
        } else {
          this.wasPlayingBeforeHide = false;
        }
        if (this.audioCtx && this.audioCtx.state === 'running') {
          this.audioCtx.suspend().catch(() => {});
        }
      } else {
        if (this.wasPlayingBeforeHide && this.bgmAudio && !this.isMuted) {
          this.bgmAudio.play().catch(() => {});
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
      }
    });
  }

  public dispose(): void {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.remove();
      this.bgmAudio = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    AudioEngine.instance = null;
  }
}
```

### 4. Floating Glassmorphic Audio Toggle UI
```typescript
// Source: Tailwind CSS v4 glassmorphic overlay controller
import { AudioEngine } from '../audio/audio-engine';

export class AudioToggle {
  private buttonEl: HTMLButtonElement | null = null;
  private iconEl: HTMLElement | null = null;
  private audioEngine = AudioEngine.getInstance();

  public mount(parentContainer: HTMLElement): void {
    this.buttonEl = document.createElement('button');
    this.buttonEl.id = 'audio-toggle-btn';
    this.buttonEl.type = 'button';
    this.buttonEl.setAttribute('aria-label', 'Toggle Sound');
    this.buttonEl.className =
      'fixed top-4 right-4 z-20 flex items-center justify-center w-11 h-11 rounded-full ' +
      'bg-white/[0.08] backdrop-blur-md border border-amber-500/30 text-amber-200 ' +
      'shadow-lg shadow-black/40 hover:bg-white/[0.14] active:scale-95 transition-all cursor-pointer';

    this.renderIcon(false);

    this.buttonEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const isMuted = this.audioEngine.toggleMute();
      this.renderIcon(isMuted);
    });

    parentContainer.appendChild(this.buttonEl);
  }

  private renderIcon(isMuted: boolean): void {
    if (!this.buttonEl) return;
    if (isMuted) {
      // Speaker with slash
      this.buttonEl.innerHTML = `
        <svg class="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5L6 9H2v6h4l5 4V5z"/>
          <line x1="23" y1="9" x2="17" y2="15" stroke-linecap="round"/>
          <line x1="17" y1="9" x2="23" y2="15" stroke-linecap="round"/>
        </svg>`;
    } else {
      // Speaker with acoustic waves
      this.buttonEl.innerHTML = `
        <svg class="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5L6 9H2v6h4l5 4V5z"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.54 8.46a5 5 0 010 7.07"/>
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.07 4.93a10 10 0 010 14.14"/>
        </svg>`;
    }
  }

  public dispose(): void {
    this.buttonEl?.remove();
    this.buttonEl = null;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| **Howler.js (`v2.2.4`)** | **Native Web Audio API + HTML5 Audio** | 2023–2026 | Eliminates 35 KB JS bundle; fixes iOS silent switch mute trap; zero external audio library maintenance. |
| **`createMediaElementSource()` for all audio** | **Dual-Tier Audio Separation** | Safari 16.4+ (2023) | Prevents HTML5 audio from being downgraded to ambient ringer category on iOS; allows music in Silent mode. |
| **No audio session intent** | **`navigator.audioSession.type = 'playback'`** | iOS 16.4 (March 2023) | Gives web apps native `AVAudioSessionCategoryPlayback` parity on iPhone. |
| **High-poly mesh raycasting** | **Horizontal Plane Intersection (`THREE.Plane`)** | Three.js Best Practice | Eliminates vertex snapping, depth anomalies, and raycast performance degradation on mobile. |
| **Prerendered MP3 files for SFX** | **Procedural Web Audio Synthesis** | Web Audio API standard | 0 KB asset transfer, offline readiness, and 0ms latency for touch-and-drag match response. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Android and desktop devices support `audio.volume` programmatic volume ramping smoothly. | Standard Stack & Pitfalls | Low: If a platform ignores `audio.volume`, it simply plays at device master volume, and `muted` property still provides binary mute control. |
| A2 | Background Indian instrumental sitar/flute music can be loaded from `/audio/festive-bgm.mp3` or bundled royalty-free asset. | Standard Stack & Code Examples | Low: In offline/test environments, `AudioEngine` handles missing files gracefully without throwing unhandled exceptions. |

## Open Questions (RESOLVED)

1. **Horizontal Plane Raycasting vs Diya Mesh Raycasting**
   - RESOLVED: Raycasting directly against complex 3D meshes (LatheGeometry with displaced spout vertices) can produce jagged/erratic depth jitter, especially at glancing camera angles or if the finger misses the mesh. Projecting onto an infinite horizontal plane `THREE.Plane(new THREE.Vector3(0, 1, 0), -0.68)` provides buttery smooth 60fps 2D-to-3D screen mapping with constant Y elevation aligned with `WickAnchor` `(y = 0.68)`.
2. **Volume Fading on iOS Safari vs Web Audio**
   - RESOLVED: On iOS Safari, `audio.volume` is read-only / ignored by WebKit (delegated entirely to physical hardware buttons). Setting `navigator.audioSession.type = 'playback'` (iOS 16.4+) declares media playback intent. For volume control, `audio.volume` ramping is executed for platforms that support it, while `audio.muted = true/false` provides deterministic mute toggling across all iOS versions, and Web Audio SFX smoothly ramps via `GainNode.linearRampToValueAtTime()`.
3. **iOS Hardware Silent/Mute Switch Bypass**
   - RESOLVED: In iOS WebKit, routing audio through `AudioContext.createMediaElementSource()` subjects it to `AVAudioSessionCategoryAmbient` (muted by silent switch). Keeping the HTML5 `<audio>` element on its native playback channel without piping it into `AudioContext`, coupled with `navigator.audioSession.type = 'playback'` (iOS 16.4+), guarantees that the festive soundtrack plays even when an iPhone user has flipped their hardware mute switch to Silent.
4. **Procedural Audio Synthesis vs Audio Asset Files**
   - RESOLVED: Match-strike and flame crackle sound effects are synthesized purely using Web Audio API nodes (`BiquadFilterNode`, `AudioBufferSourceNode`, `GainNode`, `OscillatorNode`). This guarantees 0ms playback latency, 0 KB network payload, and 100% offline resilience with no network 404 risks.
5. **FSM Transition from UNLOCKED_INTRO to INTERACTIVE_UNLIT**
   - RESOLVED: In `SceneManager.handleStateChange('UNLOCKED_INTRO')`, the camera dollies forward over 1200ms. Upon completion of this camera transition, the system fires `fsm.transition({ type: 'INTRO_COMPLETE' })`, transitioning to `INTERACTIVE_UNLIT`, which displays the floating touch hint UI and activates `TouchController`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| **Node.js** | Build & Test runner | ✓ | v22.16.0 | — |
| **npm** | Package management | ✓ | 10.9.2 | — |
| **Three.js** | 3D Raycasting, Plane, Math | ✓ | ^0.187.0 | — |
| **@tweenjs/tween.js** | Easing & Animations | ✓ | ^25.0.0 | — |
| **Web Audio API** | Procedural SFX & Priming | ✓ | Browser Native | Graceful silent fallback in headless test runners |
| **HTML5 Audio** | BGM Streaming | ✓ | Browser Native | Mocked in happy-dom |
| **Vibration API** | Haptic Feedback | ✓ | Browser Native | Optional feature-detected; no-ops on iOS/desktop |

**Missing dependencies with no fallback:** None.  
**Missing dependencies with fallback:** None.  

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `^3.0.0` (v3.2.7 running in project) |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| **DIYA-02** | Raycaster projects touch to horizontal plane y=0.68; detects distance to WickAnchor <0.35 and fires trigger; clamps horizon bounds. | Unit / Integration | `npx vitest run tests/interaction/touch-controller.test.ts` | ❌ Wave 0 Gap |
| **AUDIO-01** | `AudioEngine.unlock()` executes synchronously inside user gesture, resumes AudioContext, and primes HTML5 audio. | Unit | `npx vitest run tests/audio/audio-unlock.test.ts` | ❌ Wave 0 Gap |
| **AUDIO-02** | HTML5 audio element streams BGM, bypasses silent switch with audioSession, and starts 2s volume fade on UNLOCKED_INTRO. | Unit | `npx vitest run tests/audio/audio-engine.test.ts` | ❌ Wave 0 Gap |
| **AUDIO-03** | Procedural Web Audio SFX generates bandpass noise burst for match strike and crackle impulses without external file dependencies. | Unit | `npx vitest run tests/audio/sfx-synthesizer.test.ts` | ❌ Wave 0 Gap |
| **AUDIO-04** | Floating glassmorphic AudioToggle toggles global mute state across both BGM and Web Audio SFX with 200ms gain ramp. | Unit / DOM | `npx vitest run tests/ui/audio-toggle.test.ts` | ❌ Wave 0 Gap |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green (all existing 91 tests + Phase 4 tests) before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `tests/interaction/touch-controller.test.ts` — covers DIYA-02 (raycasting projection, proximity threshold <0.35, haptic trigger, bound clamping).
- [ ] `tests/audio/audio-engine.test.ts` — covers AUDIO-01, AUDIO-02 (gesture unlock handshake, BGM streaming, visibility change suspension).
- [ ] `tests/audio/sfx-synthesizer.test.ts` — covers AUDIO-03 (procedural match strike and crackle generation).
- [ ] `tests/ui/audio-toggle.test.ts` — covers AUDIO-04 (glassmorphic button mounting, click toggle, icon swapping, master gain ramp).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| **V5 Input Validation** | yes | Clamp pointer coordinates and plane intersection distance (`Math.hypot(x, z) <= 3.2`) to eliminate `NaN` / infinity coordinates in 3D physics loops. Safe dt clamping `[0.0, 0.1]` already implemented in `FlameController`. |
| **V14 Resource Management** | yes | Page Visibility API cleanly suspends `AudioContext` and HTML5 streaming when tab is hidden, preventing resource exhaustion and background battery drain. Complete cleanup in `dispose()` methods. |

### Known Threat Patterns for Web Audio & Pointer Interaction

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| **Horizon Projection Runaway** | Denial of Service | Clamping plane intersection radius (`maxRadius = 3.2`) prevents floating point overflow and rendering freeze when dragging near horizon. |
| **Audio Loop Runaway** | Denial of Service | Halting AudioContext and pausing `<audio>` on `document.visibilitychange` prevents battery exhaustion on backgrounded mobile tabs. |
| **Unbounded Event Listener Accumulation** | Denial of Service / Memory Leak | Explicit `dispose()` methods unbinding window and container listeners (`pointerdown`, `pointermove`, `pointerup`, `visibilitychange`). |

## Sources

### Primary (HIGH confidence)
- Three.js r187 Documentation: `THREE.Raycaster`, `THREE.Plane.intersectPlane()` [VERIFIED: threejs.org]
- MDN Web Docs: Web Audio API `AudioContext`, `BiquadFilterNode`, `GainNode` [VERIFIED: developer.mozilla.org]
- WebKit Specification & Blog: W3C Audio Session API (`navigator.audioSession.type = 'playback'`) [VERIFIED: webkit.org]
- MDN Web Docs: HTMLMediaElement Autoplay Policy & User Gesture Requirements [VERIFIED: developer.mozilla.org]
- W3C Recommendation: Vibration API (`navigator.vibrate`) [VERIFIED: w3.org]

### Secondary (MEDIUM confidence)
- WebKit Bugzilla & StackOverflow: Web Audio vs HTML5 Audio on iOS Silent Switch behavior [CITED: webkit.org/b/170942, stackoverflow.com]
- iOS Safari Media Volume Read-Only Quirks [CITED: developer.apple.com]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Pure native Web Audio API + HTML5 Audio + Three.js r187; verified zero extra npm dependencies needed.
- Architecture: HIGH — Clear separation of dual-tier audio, synchronous gesture priming, and horizontal plane raycasting verified with existing FSM and WickAnchor `(0.0, 0.68, 1.38)`.
- Pitfalls: HIGH — iOS silent switch trap, autoplay gesture expiration, and horizon projection math analyzed with proven mitigations.

**Research date:** 2026-11-04  
**Valid until:** 2026-12-04 (30 days for stable Web APIs)  
