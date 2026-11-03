# Phase 4: Touch Interaction Controller & Dual-Tier Audio Architecture - Pattern Map

**Mapped:** 2026-11-04  
**Files analyzed:** 13 (6 new implementation files, 4 new test files, 3 modified files)  
**Analogs found:** 13 / 13 (100% codebase pattern coverage)  

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/interaction/touch-controller.ts` | controller | event-driven | `src/graphics/camera-rig.ts` & `src/graphics/scene-manager.ts` | role-match |
| `src/interaction/proximity-detector.ts` | utility | transform | `src/graphics/meshes/procedural-diya-geometry.ts` | role-match |
| `src/interaction/touch-hint.ts` | component (UI) | DOM / event-driven | `src/ui/passcode-gate.ts` | role-match |
| `src/audio/audio-engine.ts` | service (singleton) | event-driven / streaming | `src/audio/audio-unlock.ts` & `src/graphics/scene-manager.ts` | exact |
| `src/audio/sfx-synthesizer.ts` | service / utility | procedural synthesis | `src/audio/audio-unlock.ts` & `src/graphics/materials/procedural-textures.ts` | role-match |
| `src/ui/audio-toggle.ts` | component (UI) | DOM / event-driven | `src/ui/passcode-gate.ts` | role-match |
| `src/ui/passcode-gate.ts` (mod) | component (UI) | event-driven / request-response | `src/ui/passcode-gate.ts` (lines 57-66) | exact |
| `src/graphics/scene-manager.ts` (mod) | controller | event-driven / RAF loop | `src/graphics/scene-manager.ts` (lines 195-207) | exact |
| `src/main.ts` (mod) | entry / bootstrap | orchestration | `src/main.ts` (lines 14-35) | exact |
| `tests/interaction/touch-controller.test.ts` | test | event-driven | `tests/graphics/camera-rig.test.ts` & `tests/graphics/scene-manager.test.ts` | role-match |
| `tests/audio/audio-engine.test.ts` | test | event-driven / streaming | `tests/ui/passcode-gate.test.ts` & `tests/graphics/scene-manager.test.ts` | role-match |
| `tests/audio/sfx-synthesizer.test.ts` | test | procedural | `tests/graphics/fx/flame-controller.test.ts` | role-match |
| `tests/ui/audio-toggle.test.ts` | test | DOM / event-driven | `tests/ui/passcode-gate.test.ts` | exact |

---

## Pattern Assignments

### 1. `src/interaction/touch-controller.ts` (controller, event-driven)

Translates mobile pointer/touch events into 3D world coordinates projected on an elevated horizontal plane (`y = 0.68`), moves the match follower mesh, clamps horizon rays, calculates Euclidean proximity to `WickAnchor` `(0.0, 0.68, 1.38)`, triggers haptics (`navigator.vibrate`), and fires ignition callback.

**Analogs:**
- `src/graphics/camera-rig.ts` (lines 56-71 for pointer handling, ASVS V5 input clamping, auto-reset)
- `src/graphics/scene-manager.ts` (lines 57-64, 256-277 for canvas touch configuration and NDC normalization)
- `src/graphics/fx/flame-controller.ts` (lines 30-50, 139-152 for 3D group hierarchies and GPU resource cleanup)

**Imports pattern:**
```typescript
// Copy from src/graphics/camera-rig.ts lines 1-2 & src/graphics/scene-manager.ts lines 1-4
import * as THREE from 'three';
import type { CameraRig } from '../graphics/camera-rig';
import { WickProximityDetector } from './proximity-detector';
```

**Pointer NDC & Plane Projection pattern:**
```typescript
// Copy coordinate normalization from src/graphics/scene-manager.ts lines 268-275
private updatePosition(clientX: number, clientY: number): void {
  const rect = this.container.getBoundingClientRect();
  const width = rect.width || window.innerWidth || 1;
  const height = rect.height || window.innerHeight || 1;

  // Normalized Device Coordinates [-1, 1]
  const ndcX = ((clientX - rect.left) / width) * 2 - 1;
  const ndcY = -(((clientY - rect.top) / height) * 2 - 1);

  this.raycaster.setFromCamera({ x: ndcX, y: ndcY }, this.cameraRig.camera);

  // Horizontal plane passing through WickAnchor.y (0.68): n · p + d = 0 => 1*(0.68) + (-0.68) = 0
  if (this.raycaster.ray.intersectPlane(this.plane, this.intersectionPoint)) {
    // ASVS V5 Boundary Clamping (preventing horizon runaway / NaN coordinates)
    const maxRadius = 3.2;
    const radius = Math.hypot(this.intersectionPoint.x, this.intersectionPoint.z);
    if (radius > maxRadius) {
      this.intersectionPoint.x = (this.intersectionPoint.x / radius) * maxRadius;
      this.intersectionPoint.z = (this.intersectionPoint.z / radius) * maxRadius;
    }

    this.matchFollower.position.copy(this.intersectionPoint);

    if (this.proximityDetector.isNearWick(this.intersectionPoint)) {
      this.triggerIgnition();
    }
  }
}
```

**Haptic Feedback & Trigger pattern:**
```typescript
// Triggering ignition with feature-detected Vibration API pulse
private triggerIgnition(): void {
  if (this.isIgnited) return;
  this.isIgnited = true;
  this.isDragging = false;
  this.matchFollower.visible = false;

  // Safe feature-detected haptic feedback (Android Chrome / mobile browsers)
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([30, 50, 40]);
    } catch {
      // Graceful no-op on unsupported browsers / iOS Safari
    }
  }

  this.onIgniteTrigger();
}
```

**Disposal & Event Cleanup pattern:**
```typescript
// Copy listener cleanup from src/graphics/scene-manager.ts lines 411-424
public dispose(): void {
  this.container.removeEventListener('pointerdown', this.onPointerDown);
  window.removeEventListener('pointermove', this.onPointerMove);
  window.removeEventListener('pointerup', this.onPointerUp);
  window.removeEventListener('pointercancel', this.onPointerUp);

  if (this.matchFollower.parent) {
    this.matchFollower.parent.remove(this.matchFollower);
  }
}
```

---

### 2. `src/interaction/proximity-detector.ts` (utility, transform)

Computes Euclidean distance between the 3D matchstick tip and `WickAnchor` `(0.0, 0.68, 1.38)` with an adjustable threshold (`default: 0.35`).

**Analog:**
- `src/graphics/meshes/procedural-diya-geometry.ts` (lines 85 & 182 for `wickAnchor` coordinates)

**Core pattern:**
```typescript
// Copy wickAnchor coordinates from src/graphics/meshes/procedural-diya-geometry.ts line 182
import * as THREE from 'three';

export class WickProximityDetector {
  public readonly wickAnchor: THREE.Vector3;
  public readonly threshold: number;

  constructor(
    wickAnchor: THREE.Vector3 = new THREE.Vector3(0.0, 0.68, 1.38),
    threshold: number = 0.35
  ) {
    this.wickAnchor = wickAnchor.clone();
    this.threshold = threshold;
  }

  public getDistance(position: THREE.Vector3): number {
    return position.distanceTo(this.wickAnchor);
  }

  public isNearWick(position: THREE.Vector3): boolean {
    return this.getDistance(position) < this.threshold;
  }
}
```

---

### 3. `src/interaction/touch-hint.ts` (component, DOM / event-driven)

Displays an ethereal glassmorphic floating prompt: *"Touch and drag the flame to light your Diya"* with a pulsing gold shimmer chevron. Fades out immediately upon initial touch.

**Analog:**
- `src/ui/passcode-gate.ts` (lines 125-142 for dynamic toast creation, Tailwind glassmorphic styling, and safe DOM manipulation; lines 119-123 for fade transitions)

**Core pattern:**
```typescript
// Copy DOM mounting and Tailwind glassmorphism styling from src/ui/passcode-gate.ts lines 125-142
export class TouchHint {
  private element: HTMLElement | null = null;
  private isVisible = false;

  public mount(parentContainer: HTMLElement): void {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.id = 'touch-hint-prompt';
    this.element.setAttribute('role', 'status');
    this.element.setAttribute('aria-live', 'polite');
    this.element.className =
      'fixed bottom-12 md:bottom-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none ' +
      'flex items-center gap-2 px-5 py-2.5 rounded-full ' +
      'bg-amber-950/80 backdrop-blur-md border border-amber-400/40 text-amber-200 text-xs md:text-sm font-medium ' +
      'shadow-xl shadow-black/50 transition-all duration-500 opacity-0 scale-95 select-none';

    // Strictly static safe template with pulsing indicator
    this.element.innerHTML = `
      <span class="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
      <span>Touch &amp; drag the flame to light your Diya</span>
      <span class="text-amber-400 font-bold select-none">&rarr;</span>
    `;

    parentContainer.appendChild(this.element);
  }

  public show(): void {
    if (!this.element || this.isVisible) return;
    this.isVisible = true;
    this.element.classList.remove('opacity-0', 'scale-95');
    this.element.classList.add('opacity-100', 'scale-100');
  }

  public hide(): void {
    if (!this.element || !this.isVisible) return;
    this.isVisible = false;
    this.element.classList.remove('opacity-100', 'scale-100');
    this.element.classList.add('opacity-0', 'scale-95');
  }

  public dispose(): void {
    this.element?.remove();
    this.element = null;
    this.isVisible = false;
  }
}
```

---

### 4. `src/audio/audio-engine.ts` (service, singleton, streaming / event-driven)

Coordinates the dual-tier audio architecture:
1. Native HTML5 `<audio id="festive-bgm">` for sitar/flute streaming, routed directly to media channels to bypass the iOS physical silent switch, with 2-second volume fade-in (`0.0 -> 0.7`) on `UNLOCKED_INTRO`.
2. Web Audio API `AudioContext` with silent buffer priming and procedural SFX for match strike and crackle.
3. Synchronous `unlock()` handshake called directly within the passcode submit gesture stack frame.
4. Visibility API tab pause/resume and master mute/unmute with 200ms gain ramps.

**Analogs:**
- `src/audio/audio-unlock.ts` (lines 1-41 for AudioContext creation, 1-sample silent buffer priming, and iOS WebKit compatibility)
- `src/graphics/scene-manager.ts` (lines 238-244 for `visibilitychange` listener; lines 403-430 for `dispose()`)

**Synchronous Unlock & iOS Silent Switch Handshake pattern:**
```typescript
// Copy WebKit priming from src/audio/audio-unlock.ts lines 17-41 & add W3C Audio Session API
public unlock(): void {
  if (this.isUnlocked) return;
  this.isUnlocked = true;

  // 1. W3C Audio Session API (iOS 16.4+ silent switch bypass)
  if ('audioSession' in navigator) {
    try {
      (navigator as unknown as { audioSession: { type: string } }).audioSession.type = 'playback';
    } catch {}
  }

  // 2. Web Audio API initialization with silent buffer priming
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass && !this.audioCtx) {
      this.audioCtx = new AudioContextClass();
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
  } catch (err) {
    console.warn('Web Audio init skipped:', err);
  }

  // 3. Prime HTML5 Audio element on direct user gesture
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
      this.bgmAudio?.pause();
      if (this.bgmAudio) this.bgmAudio.currentTime = 0;
    }).catch(() => {});
  } catch (err) {
    console.warn('HTML5 Audio priming skipped:', err);
  }
}
```

**Visibility API & Resource Resilience pattern:**
```typescript
// Copy visibilitychange handling from src/graphics/scene-manager.ts lines 238-244
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
```

---

### 5. `src/audio/sfx-synthesizer.ts` (service / utility, procedural synthesis)

Generates real-time, low-latency match friction swish (120ms bandpass noise burst) and flame crackle (sporadic highpass impulses + low rumble) via native Web Audio API nodes with 0 KB network payload and 0ms latency.

**Analogs:**
- `src/audio/audio-unlock.ts` (lines 33-37 for AudioBuffer and AudioBufferSourceNode instantiation)
- `src/graphics/materials/procedural-textures.ts` (lines 50-60 for algorithmic noise math and decay loops)

**Imports & Architecture pattern:**
```typescript
// Pure Web Audio API synthesis without external dependencies
export class SfxSynthesizer {
  constructor(
    private audioCtx: AudioContext,
    private masterGain: GainNode
  ) {}
```

**Match-Strike Procedural Bandpass Synthesis pattern:**
```typescript
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

  // White noise with exponential decay envelope (friction sound)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp((-i / bufferSize) * 3);
  }

  const noiseSource = this.audioCtx.createBufferSource();
  noiseSource.buffer = buffer;

  // Bandpass filter sweeping down (2200Hz -> 1400Hz, Q = 2.5)
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
```

---

### 6. `src/ui/audio-toggle.ts` (component, DOM / event-driven)

Fixed floating glassmorphic pill button in the top-right corner (`fixed top-4 right-4 z-20`) controlling the global audio mute state with animated speaker SVG icons.

**Analog:**
- `src/ui/passcode-gate.ts` (lines 14-55 for component structure, mounting, and button event wiring; lines 125-133 for Tailwind glassmorphism)

**DOM Mounting & Glassmorphic Styling pattern:**
```typescript
// Copy Tailwind glassmorphic button conventions from src/ui/passcode-gate.ts
import { AudioEngine } from '../audio/audio-engine';

export class AudioToggle {
  private buttonEl: HTMLButtonElement | null = null;
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

    this.renderIcon(this.audioEngine.getMuted());

    this.buttonEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const isMuted = this.audioEngine.toggleMute();
      this.renderIcon(isMuted);
    });

    parentContainer.appendChild(this.buttonEl);
  }

  private renderIcon(isMuted: boolean): void {
    if (!this.buttonEl) return;
    this.buttonEl.innerHTML = isMuted
      ? `<svg class="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" d="M11 5L6 9H2v6h4l5 4V5z"/>
           <line x1="23" y1="9" x2="17" y2="15" stroke-linecap="round"/>
           <line x1="17" y1="9" x2="23" y2="15" stroke-linecap="round"/>
         </svg>`
      : `<svg class="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" d="M11 5L6 9H2v6h4l5 4V5z"/>
           <path stroke-linecap="round" stroke-linejoin="round" d="M15.54 8.46a5 5 0 010 7.07"/>
           <path stroke-linecap="round" stroke-linejoin="round" d="M19.07 4.93a10 10 0 010 14.14"/>
         </svg>`;
  }

  public dispose(): void {
    this.buttonEl?.remove();
    this.buttonEl = null;
  }
}
```

---

### 7. Modifications to Existing Files

#### `src/ui/passcode-gate.ts` (component, event-driven)
- **Target lines:** 3, 63-66 in `handleUnlock()`
- **Modification:** Replace `primeAudioContext()` with `AudioEngine.getInstance().unlock()`.
```typescript
// Replace:
// primeAudioContext();
// With:
AudioEngine.getInstance().unlock();
```

#### `src/graphics/scene-manager.ts` (controller, RAF loop / state transitions)
- **Target lines:** 195-207 in `handleStateChange()`
- **Modification:**
  1. On `UNLOCKED_INTRO`: trigger `AudioEngine.getInstance().startBgm()`, and chain `cameraRig.dollyTo(...).then(() => this.fsm?.transition({ type: 'INTRO_COMPLETE' }))`.
  2. On `INTERACTIVE_UNLIT`: show `TouchHint` and enable `TouchController`.
  3. On proximity ignition trigger: call `AudioEngine.getInstance().playMatchStrike()` and `playFlameCrackle()`, then transition FSM: `this.fsm?.transition({ type: 'WICK_TOUCHED' })`.
  4. On `IGNITING`: hide `TouchHint` and match follower mesh.
  5. In `dispose()`: dispose `TouchController`, `TouchHint`, and unbind listeners.

#### `src/main.ts` (bootstrap, orchestration)
- **Target lines:** 20-35
- **Modification:** Instantiate and mount `AudioToggle` into the UI container (`document.getElementById('app')`).

---

## Testing Patterns

### 1. `tests/interaction/touch-controller.test.ts`
**Analog:** `tests/graphics/camera-rig.test.ts` (lines 45-71) & `tests/graphics/scene-manager.test.ts` (lines 97-113)  
**Patterns:**
- Mock container element with `getBoundingClientRect()`.
- Dispatch synthetic `PointerEvent` (`pointerdown`, `pointermove`, `pointerup`).
- Verify Euclidean distance check against `WickAnchor` `(0.0, 0.68, 1.38)` with `< 0.35` threshold.
- Verify boundary clamping when raycasting toward horizon.
- Spy on `navigator.vibrate` with `vi.spyOn(navigator, 'vibrate')`.

### 2. `tests/audio/audio-engine.test.ts`
**Analog:** `tests/ui/passcode-gate.test.ts` (lines 54-64) & `tests/graphics/scene-manager.test.ts` (lines 63-78)  
**Patterns:**
- Mock `AudioContext` and `HTMLAudioElement` with Vitest `vi.fn()` methods (`play`, `pause`, `resume`, `createBuffer`, `createGain`).
- Verify `unlock()` executes synchronously inside user gesture callback.
- Test `document.visibilitychange` event pausing/resuming audio.
- Test `toggleMute()` toggling mute state and updating master gain value.

### 3. `tests/audio/sfx-synthesizer.test.ts`
**Analog:** `tests/graphics/fx/flame-controller.test.ts` (lines 40-70)  
**Patterns:**
- Mock Web Audio node graph creation: `createBufferSource`, `createBiquadFilter`, `createGain`, `createOscillator`.
- Assert `playMatchStrike()` constructs bandpass filter with frequencies 2200Hz -> 1400Hz and connects to master gain.
- Assert `playFlameCrackle()` triggers sine oscillator and highpass micro-click buffer.

### 4. `tests/ui/audio-toggle.test.ts`
**Analog:** `tests/ui/passcode-gate.test.ts` (lines 16-52)  
**Patterns:**
- Mount `AudioToggle` to mock DOM container.
- Verify element has `fixed top-4 right-4 z-20` classes and initial unmuted speaker SVG.
- Simulate `click` event, verify `AudioEngine.getInstance().toggleMute()` called, and icon updates to muted slash SVG.
- Call `dispose()` and assert button is removed from DOM.

---

## Shared Patterns

### 1. Synchronous User-Gesture Audio Priming
**Source:** `src/audio/audio-unlock.ts` lines 17-41 & `src/ui/passcode-gate.ts` lines 63-66  
**Apply to:** `PasscodeGate`, `AudioEngine`  
**Rule:** Any call to `audioCtx.resume()`, `audioCtx.createBuffer()`, or `audio.play()` MUST occur synchronously within the native DOM gesture stack frame before any `await` keyword or Promise microtask.

### 2. Glassmorphic Tailwind UI & Safe DOM Manipulation
**Source:** `src/ui/passcode-gate.ts` lines 102-106, 125-142  
**Apply to:** `AudioToggle`, `TouchHint`  
**Rule:**
- Use glassmorphism token classes: `backdrop-blur-md`, `bg-white/[0.08]`, `border border-amber-500/30`, `text-amber-200`, `shadow-lg shadow-black/40`.
- All user-facing text must be set via `textContent` or fixed, trusted static HTML templates. Never interpolate unvalidated strings into `innerHTML`.

### 3. Screen-to-World Raycasting & ASVS V5 Boundary Clamping
**Source:** `src/graphics/camera-rig.ts` lines 56-64 & `src/graphics/scene-manager.ts` lines 268-275  
**Apply to:** `TouchController`  
**Rule:**
- Map `(clientX, clientY)` to NDC `[-1, 1]`.
- Intersect with infinite horizontal plane `y = 0.68`.
- Always clamp intersection point radius (`Math.hypot(x, z) <= 3.2`) to protect against floating point overflow/infinity when pointing toward the horizon.

### 4. Tab Visibility Suspension & Resource Cleanup
**Source:** `src/graphics/scene-manager.ts` lines 238-244, 403-430  
**Apply to:** `AudioEngine`, `TouchController`, `TouchHint`, `SceneManager`  
**Rule:**
- Listen to `document.addEventListener('visibilitychange')` to halt audio streams and clocks on hidden tabs.
- Every class must implement a clean `dispose()` method removing all attached DOM nodes, window event listeners, and GPU/Audio resources.

---

## No Analog Found

All features have solid analogs in the codebase. The following two sub-patterns have no exact predecessor in the existing code, but are fully specified in `04-RESEARCH.md`:

| Feature | Role | Data Flow | Guidance |
|---|---|---|---|
| `navigator.audioSession.type = 'playback'` | browser API | system intent | W3C Audio Session API (iOS 16.4+). Wrap in `if ('audioSession' in navigator)` feature check inside `AudioEngine.unlock()` per `04-RESEARCH.md` Pattern 2. |
| Procedural Bandpass White Noise Synthesis | Web Audio | algorithmic synthesis | Synthesized directly in memory using `audioCtx.createBuffer` and `BiquadFilterNode` per `04-RESEARCH.md` Code Example 2. Analogous to canvas texture synthesis in `src/graphics/materials/procedural-textures.ts`. |

---

## Metadata

- **Analog search scope:** `src/`, `tests/`
- **Files scanned:** 34 source files, 20 test files
- **Pattern extraction date:** 2026-11-04
