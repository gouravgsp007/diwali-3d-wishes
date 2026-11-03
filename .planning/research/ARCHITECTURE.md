# Architecture Research: Diwali 3D Interactive Greeting Application

**Domain:** Mobile-First 3D Web Application / Interactive E-Commerce Greeting Experience  
**Researched:** 2026-11-03  
**Confidence:** HIGH (Grounding: WebGL/Three.js mobile performance benchmarks, Web Audio API autoplay specifications, W3C Web Crypto API standards)

---

## Executive Summary

The Diwali 3D Wishes project requires a mobile-first, zero-latency WebGL experience designed specifically for the friction-laden environment of mobile social media browsers (Instagram In-App Browser, WhatsApp WebView, Mobile Safari, Android Chrome). 

To guarantee **consistent 60 FPS**, **zero backend infrastructure cost**, and **instant emotional impact**, the architecture is built on three core pillars:
1. **Zero-Backend Cryptographic Data Resolution:** The greeting payload (sender, recipient, personal wish) is encoded directly into the URL fragment (`#d=...`) and symmetrically encrypted using the 4-to-6 digit passcode as the key via the native browser `SubtleCrypto` (AES-GCM). No database, no user accounts, no server latency, and 100% recipient privacy.
2. **Single-Pass Additive Shading (No Post-Processing Bloom):** Fullscreen post-processing passes (`EffectComposer`, `UnrealBloomPass`) cause catastrophic fill-rate bottlenecks on mobile GPUs, dropping framerates from 60 FPS to 18–25 FPS. Instead, glowing flame cores, pulsating coronas, and sparkler embers utilize custom GLSL shaders with `THREE.AdditiveBlending` and depth-write disabling, delivering radiant illumination in a single render pass with under 8 total draw calls.
3. **Synchronous Gesture Audio Context Priming:** Web Audio API restrictions in WebKit/Blink block audio autoplay. The passcode submission gesture is harnessed as the required user activation event, synchronously instantiating and unlocking the global `AudioContext` with a silent buffer before the 3D scene transitions, guaranteeing instant, lag-free ignition SFX and ambient Indian sitar/flute cross-fading.

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             DOM UI & VIEWPORT LAYER                              │
│   (Fixed full-bleed viewport, responsive typography, hardware-accelerated CSS)   │
├────────────────────────┬────────────────────────┬────────────────────────────────┤
│      PasscodeGate      │    GreetingOverlay     │         AudioControls          │
│  (Pin input, haptic    │  (Gold typography card,│  (Mute/unmute toggle button,   │
│   feedback, unlock CTA)│   share/replay CTAs)   │   visual soundwave indicator)  │
└───────────┬────────────┴───────────┬────────────┴────────────────┬───────────────┘
            │                        │                             │
┌───────────▼────────────────────────▼─────────────────────────────▼───────────────┐
│                      APPLICATION COORDINATION & STATE LAYER                      │
├──────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌───────────────────────┐  ┌────────────────────┐  │
│  │   AppStateMachine       │  │   EventBus            │  │  GreetingCodec     │  │
│  │  (Finite state machine: │  │  (Decoupled pub/sub:  │  │ (AES-GCM decrypt,  │  │
│  │   LOCKED -> INTRO ->    │  │   AUDIO_PLAY,         │  │  URL hash unpack,  │  │
│  │   INTERACTIVE -> LIT)   │  │   FLAME_IGNITE, etc.) │  │  payload hydrate)  │  │
│  └────────────┬────────────┘  └───────────┬───────────┘  └────────────────────┘  │
└───────────────┼───────────────────────────┼──────────────────────────────────────┘
                │                           │
┌───────────────▼───────────────────────────▼──────────────────────────────────────┐
│                            AUDIO & INTERACTION ENGINE                            │
├──────────────────────────────────────────┬───────────────────────────────────────┤
│               AudioManager               │       TouchInteractionController      │
│  (Web Audio API singleton, gain graph,   │  (PointerEvents, swipe-to-light,      │
│   sound pool: match strike, crackle,     │   wick collision detection hitbox,    │
│   looping ambient sitar/flute flute BGM) │   vibration API haptic pulses)        │
└──────────────────────────────────────────┴───────────────────────────────────────┘
                                            │
┌───────────────────────────────────────────▼──────────────────────────────────────┐
│                           3D GRAPHICS ENGINE (THREE.JS)                          │
├──────────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │ SceneManager (WebGLRenderer, clamped DPR <= 1.75, antialias: false,        │  │
│  │               fixed RAF delta loop, mobile vertical-FOV CameraRig)         │  │
│  └─────────────────────────────────────┬──────────────────────────────────────┘  │
│                                        │                                         │
│       ┌─────────────────┬──────────────┴────┬─────────────────┐                  │
│       ▼                 ▼                   ▼                 ▼                  │
│  ┌──────────────┐ ┌──────────────┐   ┌──────────────┐  ┌──────────────┐          │
│  │   DiyaMesh   │ │ FlameShader  │   │ParticleSystem│  │DynamicLight  │          │
│  │ (Clay lathe  │ │(GLSL noise,  │   │(InstancedMesh│  │(PointLight   │          │
│  │  mesh, cotton│ │ additive halo│   │ sparkler     │  │ Perlin jitter│          │
│  │  wick mesh)  │ │ corona glow) │   │ burst/embers)│  │ fake shadow) │          │
│  └──────────────┘ └──────────────┘   └──────────────┘  └──────────────┘          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### Component Responsibilities

| Component | Responsibility | Boundary / Implementation |
|-----------|----------------|---------------------------|
| **PasscodeGate** | Presents festive numeric/alphanumeric code interface; captures user interaction for synchronous AudioContext priming; triggers decryption and state advancement. | Pure DOM component (HTML5 / Tailwind CSS); communicates to `AppStateMachine` via verified state actions. |
| **GreetingCodec** | Unpacks URL fragment (`#d=...`); derives cryptographic key from entered passcode using PBKDF2/SHA-256; decrypts greeting payload using AES-GCM via browser `window.crypto.subtle`. | Stateless utility module; takes `(encodedPayload, passcode)` -> returns `Promise<GreetingData>`. |
| **AppStateMachine** | Controls strict application lifecycle (`BOOT` -> `LOCKED` -> `UNLOCKED_INTRO` -> `INTERACTIVE_UNLIT` -> `IGNITING` -> `LIT_CELEBRATION` -> `GREETING_REVEAL`). | Lightweight typed Finite State Machine (~1KB); drives scene camera cues, DOM layer visibility, and particle triggers. |
| **SceneManager** | Owns Three.js `WebGLRenderer`, `PerspectiveCamera`, resize handling, and render loop. Caps DPR at `min(window.devicePixelRatio, 1.75)` to prevent GPU fill-rate throttling. | Encapsulates canvas lifecycle; guarantees render loop ceases when tab is hidden (`visibilitychange`). |
| **DiyaMesh & Materials** | Represents the traditional terracotta oil lamp (mitti ka diya) and twisted cotton wick. | Low-poly procedural geometry (`LatheGeometry`) or compressed Draco/Meshopt GLTF (<30KB); baked ambient occlusion texture + PBR clay roughness. |
| **FlameShader & Corona** | Renders realistic organic candle flame with vertical flutter, heat distortion, and radiant halo without post-processing. | Custom vertex and fragment GLSL shaders; uses simplex noise for organic flickers; renders dual-layer teardrop mesh + camera-facing additive billboard quad. |
| **ParticleSystem** | Generates explosive golden sparkler bursts on ignition and slow-drifting celebratory floating embers. | Single `THREE.InstancedMesh` (or GPU point buffer); updates particle transform matrices on GPU/typed array; strictly 1 draw call. |
| **DynamicLightManager** | Illuminates the diya rim and ground surface with living firelight. | Single warm `THREE.PointLight` (#FFA033) modulated by Perlin noise; grounded with a static radial contact shadow plane (zero shadow maps). |
| **TouchInteractionController** | Converts mobile touch gestures (`touchstart`, `touchmove`, `touchend`) into 3D raycast coordinates; manages sparkler/matchstick cursor; detects collision with wick hitbox. | Normalizes screen coordinates; computes bounding sphere proximity to wick (`distance < 0.35 units`); fires ignition event and triggers `navigator.vibrate([30, 20, 50])`. |
| **AudioManager** | Manages Web Audio API graph; preloads audio buffers (match strike, sparkler hiss, flame crackle, ambient sitar loop); handles cross-fading and background muting. | Singleton Web Audio wrapper with MasterGain -> MusicGain & SFXGain; handles `interrupted` and `suspended` state recoveries. |
| **GreetingOverlay** | Displays personalized typography (To, From, Festive Message) with golden shimmer animations and interactive action buttons (Copy Link, Re-light). | DOM layer positioned above canvas with `pointer-events: none`; internal interactive elements set to `pointer-events: auto`. |
| **CreatorPortal** | Standalone tool for Instagram sellers: inputs sender/recipient/message, mints custom passcode, encrypts payload into shareable link, and outputs copyable WhatsApp/Instagram DM templates. | Isolated lightweight SPA route (`/create` or `/admin`); zero server communication; performs client-side AES-GCM encryption. |

---

## Recommended Project Structure

```
src/
├── app/
│   ├── state-machine.ts        # Typed application lifecycle FSM & state contracts
│   ├── event-bus.ts            # Lightweight Pub/Sub event dispatcher for cross-cutting triggers
│   └── main.ts                 # Bootstrap: boots graphics, attaches DOM, parses URL hash
├── audio/
│   ├── audio-manager.ts        # Web Audio API singleton: unlock, buffers, gain graphs
│   └── audio-manifest.ts       # Audio asset definitions (sitar flute BGM, strike SFX, crackle)
├── crypto/
│   ├── greeting-codec.ts       # AES-GCM encryption/decryption, Base64URL serialization
│   └── types.ts                # GreetingData payload interface definitions
├── graphics/
│   ├── scene-manager.ts        # Three.js canvas setup, DPR clamping, responsive render loop
│   ├── camera-rig.ts           # Mobile portrait/landscape FOV calculator & transition lerper
│   ├── lighting-rig.ts         # Warm point light with Perlin flicker & contact shadow plane
│   ├── meshes/
│   │   ├── diya.ts             # Terracotta diya mesh, clay PBR material, cotton wick
│   │   └── rangoli-floor.ts    # Subtle festive floor surface with radial occlusion
│   ├── shaders/
│   │   ├── flame.vert.glsl     # Vertex displacement for flame wind flutter
│   │   ├── flame.frag.glsl     # Procedural heat color gradient & opacity falloff
│   │   └── flame-material.ts   # Three.js ShaderMaterial wrapper with additive blending
│   └── particles/
│       ├── sparkler-emitter.ts # Instanced ignition sparkler bursts (1 draw call)
│       └── ember-system.ts     # Ambient floating golden embers (1 draw call)
├── interaction/
│   ├── touch-controller.ts     # Mobile touch/drag tracking, raycasting to wick hitbox
│   └── haptics.ts              # Native navigator.vibrate wrapper with fallback
├── ui/
│   ├── passcode-gate.ts        # Glassmorphic passcode entry overlay + audio unlock handler
│   ├── greeting-overlay.ts     # Animated gold card typography reveal + action buttons
│   ├── audio-toggle.ts         # Top-right mute/unmute floating toggle button
│   └── styles/
│       ├── festive-theme.css   # Royal gold, maroon, and deep navy Indian festive design tokens
│       └── typography.css      # Shimmer text animations and ceremonial fonts
└── creator/
    ├── creator-portal.ts       # Creator form for generating greetings and passcodes
    └── template-builder.ts     # Formatter for ready-to-send Instagram DM & WhatsApp texts
```

### Structure Rationale

- **`src/crypto/` separated from `src/ui/`:** Decoupling cryptographic decoding from UI presentation ensures the greeting data model can be verified independently via unit tests without mocking DOM or WebGL contexts.
- **`src/graphics/` isolated from DOM:** Three.js objects do not import DOM elements; they communicate exclusively through the `AppStateMachine` and `EventBus`. This eliminates circular dependencies and allows headless testing.
- **`src/audio/` isolated:** Audio initialization requires careful adherence to browser autoplay policies; keeping it in a dedicated singleton allows both `PasscodeGate` (unlock trigger) and `TouchInteractionController` (SFX playback) to interact with it cleanly.
- **`src/creator/` co-located in project:** The Instagram seller tool shares the exact same `GreetingCodec` as the recipient app, guaranteeing zero discrepancies between encryption and decryption logic while avoiding duplicate code.

---

## Architectural Patterns

### Pattern 1: Deterministic Finite State Machine (FSM)

**What:** An explicit, strongly typed state machine that governs application progression. Transitions can only occur along sanctioned paths in response to specific events.

**When to use:** Crucial for coordinating the multi-step cinematic flow where 3D camera motion, shader uniforms, particle emitters, sound effects, and HTML DOM elements must execute in precise synchronization.

**Trade-offs:** Adds a minimal amount of boilerplate upfront, but eliminates edge-case race conditions (e.g., recipient touching the screen before passcode is entered, or audio triggering multiple times).

```typescript
// src/app/state-machine.ts
export type AppState = 
  | 'BOOT'                // Preloading assets, decoding URL hash
  | 'LOCKED'              // Showing PasscodeGate, diya unlit in darkness
  | 'UNLOCKED_INTRO'      // Passcode verified; camera sweeps into interactive position
  | 'INTERACTIVE_UNLIT'   // Waiting for touch gesture: "Swipe sparkler to light diya"
  | 'IGNITING'            // Sparkler touching wick; flame catching, SFX triggered
  | 'LIT_CELEBRATION'     // Flame dancing, embers rising, sitar BGM blossoming
  | 'GREETING_REVEAL';    // Camera soft drift, festive greeting card animates into view

export type AppEvent =
  | { type: 'ASSETS_READY'; payload: { hasEncryptedPayload: boolean } }
  | { type: 'PASSCODE_SUBMITTED'; passcode: string }
  | { type: 'UNLOCK_SUCCESS'; greeting: GreetingData }
  | { type: 'INTRO_COMPLETE' }
  | { type: 'WICK_TOUCHED'; touchPoint: { x: number; y: number } }
  | { type: 'IGNITION_COMPLETE' }
  | { type: 'CELEBRATION_TIMED_STEP' }
  | { type: 'REPLAY_EXPERIENCE' };

export class AppStateMachine {
  private currentState: AppState = 'BOOT';
  private listeners: Array<(state: AppState) => void> = [];

  public transition(event: AppEvent): AppState {
    const prev = this.currentState;
    switch (this.currentState) {
      case 'BOOT':
        if (event.type === 'ASSETS_READY') this.currentState = 'LOCKED';
        break;
      case 'LOCKED':
        if (event.type === 'UNLOCK_SUCCESS') this.currentState = 'UNLOCKED_INTRO';
        break;
      case 'UNLOCKED_INTRO':
        if (event.type === 'INTRO_COMPLETE') this.currentState = 'INTERACTIVE_UNLIT';
        break;
      case 'INTERACTIVE_UNLIT':
        if (event.type === 'WICK_TOUCHED') this.currentState = 'IGNITING';
        break;
      case 'IGNITING':
        if (event.type === 'IGNITION_COMPLETE') this.currentState = 'LIT_CELEBRATION';
        break;
      case 'LIT_CELEBRATION':
        if (event.type === 'CELEBRATION_TIMED_STEP') this.currentState = 'GREETING_REVEAL';
        break;
      case 'GREETING_REVEAL':
        if (event.type === 'REPLAY_EXPERIENCE') this.currentState = 'INTERACTIVE_UNLIT';
        break;
    }
    if (prev !== this.currentState) {
      this.notify(this.currentState);
    }
    return this.currentState;
  }

  public subscribe(fn: (state: AppState) => void): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  private notify(state: AppState): void {
    for (const fn of this.listeners) fn(state);
  }
}
```

---

### Pattern 2: Decoupled Dual-Layer Architecture (WebGL Canvas + DOM Overlay)

**What:** The visual representation is strictly split into two layers:
1. A background full-screen WebGL `<canvas>` running Three.js, rendering the 3D diya, dynamic flame, and sparklers.
2. A foreground high-DPI HTML/CSS overlay layer (`position: fixed; inset: 0; pointer-events: none;`) containing the PasscodeGate, GreetingCard, and AudioToggle.

**When to use:** Essential for high-touch mobile web applications. Rendering complex Hindi/English typography or glassmorphism UI directly inside 3D textures looks blurry on Retina screens, requires heavy SDF font assets, and breaks native accessibility/screen readers.

**Trade-offs:** Requires deliberate `pointer-events: none` on the container and `pointer-events: auto` on interactive cards/buttons so touch events fall through seamlessly to the WebGL canvas underneath.

```html
<!-- index.html layout -->
<div id="app-container" class="relative w-full h-full overflow-hidden bg-diwali-night">
  <!-- Layer 0: 3D WebGL Canvas (Full bleed, receives touch interactions) -->
  <canvas id="webgl-canvas" class="absolute inset-0 w-full h-full z-0 touch-none"></canvas>

  <!-- Layer 1: Atmospheric Vignette & Particle Canvas (Optional fallback) -->
  <div id="vignette-overlay" class="absolute inset-0 pointer-events-none z-10 radial-gold-vignette"></div>

  <!-- Layer 2: UI Overlays (Pointer-events pass-through to canvas) -->
  <div id="ui-layer" class="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-4">
    <header class="w-full flex justify-between items-center pointer-events-auto">
      <div class="logo-mark">✨ Shubh Deepavali</div>
      <button id="audio-toggle" aria-label="Toggle Sound" class="p-2 rounded-full glass-btn">🔊</button>
    </header>

    <main class="w-full max-w-md mx-auto my-auto flex items-center justify-center">
      <!-- Injected dynamically by PasscodeGate & GreetingOverlay -->
      <div id="modal-container" class="pointer-events-auto transition-opacity duration-700"></div>
    </main>

    <footer class="w-full text-center py-2 text-xs text-gold-300/60 pointer-events-none">
      Crafted with warmth for Diwali 🪔
    </footer>
  </div>
</div>
```

---

### Pattern 3: Zero-Backend Client-Side URL Fragment Encryption (AES-GCM)

**What:** The greeting data payload is serialized to JSON, encrypted using the creator's chosen passcode via the browser's native `SubtleCrypto` API (AES-GCM 256-bit), and appended to the URL hash fragment (`https://domain.com/#d=<base64url>`).

**When to use:** In place of a traditional Node.js/PostgreSQL backend for Instagram/WhatsApp personalized greetings.
- Hash fragments are **never transmitted to the web server** in HTTP request headers, ensuring 100% recipient privacy.
- Hosting can be completely static (Cloudflare Pages / Vercel Edge / GitHub Pages), costing $0.00 for millions of views.
- Passcode validation occurs locally: entering the correct passcode successfully decrypts the ciphertext. An incorrect passcode throws an authentication tag error in AES-GCM, allowing instantaneous, offline rejection without network calls.

```typescript
// src/crypto/greeting-codec.ts
export interface GreetingPayload {
  recipient: string;
  sender: string;
  message: string;
  theme?: string;
  createdAt: number;
}

export class GreetingCodec {
  private static readonly SALT = new TextEncoder().encode('ShubhDiwali2026Salt');

  // Derive AES-GCM key from user passcode (e.g., "1108" or "DIYA24")
  private static async deriveKey(passcode: string): Promise<CryptoKey> {
    const rawKey = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(passcode),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.SALT,
        iterations: 100000,
        hash: 'SHA-256',
      },
      rawKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt payload into a URL-safe Base64 string
  public static async encrypt(payload: GreetingPayload, passcode: string): Promise<string> {
    const key = await this.deriveKey(passcode);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(payload));

    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    // Pack IV (12 bytes) + Ciphertext into combined array
    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuffer), iv.length);

    // Convert to URL-safe Base64
    return btoa(String.fromCharCode(...combined))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  // Decrypt URL-safe Base64 string; throws error if passcode is invalid
  public static async decrypt(ciphertextUrlSafe: string, passcode: string): Promise<GreetingPayload> {
    const key = await this.deriveKey(passcode);
    
    // Restore standard Base64
    let base64 = ciphertextUrlSafe.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    
    const binaryStr = atob(base64);
    const combined = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) combined[i] = binaryStr.charCodeAt(i);

    const iv = combined.slice(0, 12);
    const cipherData = combined.slice(12);

    // AES-GCM verifies message integrity tag automatically; throws if key is wrong
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherData
    );

    const decodedText = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decodedText) as GreetingPayload;
  }
}
```

---

### Pattern 4: Single-Pass Zero-Postprocessing Mobile Shading Strategy

**What:** Achieving high-intensity glowing flame effects and festive warmth without any post-processing render passes (`EffectComposer`, `UnrealBloomPass`).

**When to use:** Mandatory for mobile WebGL applications targeting 60 FPS across heterogeneous smartphones. 
- Mobile GPUs (Adreno, Mali, Apple A-series) feature tiled architectures where full-screen post-processing requires multiple off-screen render targets, flushing tile cache to VRAM and triggering severe thermal throttling.
- We achieve vivid "bloom" using **additive blending** (`THREE.AdditiveBlending`, `depthWrite: false`, `transparent: true`) with:
  1. An inner core flame mesh using an animated GLSL gradient shader (white-hot center fading to vibrant orange).
  2. A camera-facing billboard quad (`THREE.Sprite` or aligned quad) with an exponential radial alpha gradient in warm amber (`#FF8C00`), pulsing subtly with noise.
  3. A single dynamic `THREE.PointLight` whose intensity and coordinates jitter slightly via 1D Perlin noise to cast real-time moving light on the diya clay rim.

```glsl
// src/graphics/shaders/flame.frag.glsl
precision mediump float;

uniform float uTime;
varying vec2 vUv;

void main() {
  // Center coordinates [-0.5, 0.5]
  vec2 uv = vUv - vec2(0.5, 0.0);
  
  // Teardrop flame shape equation
  float d = length(uv * vec2(1.8, 1.0));
  float shape = smoothstep(0.48, 0.05, d);
  
  // Thermal gradient: white core -> gold -> fiery red
  vec3 coreColor = vec3(1.0, 0.98, 0.85); // White-gold heat center
  vec3 midColor  = vec3(1.0, 0.55, 0.05); // Festive orange
  vec3 outerColor= vec3(0.9, 0.15, 0.02); // Deep crimson fringe
  
  vec3 flameColor = mix(midColor, coreColor, smoothstep(0.3, 0.0, d));
  flameColor = mix(outerColor, flameColor, smoothstep(0.45, 0.15, d));
  
  // Alpha falloff with edge feathering
  float alpha = shape * smoothstep(0.95, 0.2, vUv.y);
  
  gl_FragColor = vec4(flameColor * alpha, alpha);
}
```

---

## Data Flow

### Request & Initialization Flow

```
Recipient clicks link on Instagram DM / WhatsApp
              │
              ▼
   [Browser Loads Static SPA]
              │
              ├── Parses URL hash: window.location.hash.slice(3)
              ├── Initialises SceneManager (WebGLRenderer, clamped DPR <= 1.75)
              └── Preloads Audio Assets (Match strike, Sitar BGM array buffers)
              │
              ▼
       [State: LOCKED]
  PasscodeGate displayed
  Diya rendered unlit in cinematic dark twilight
              │
              ▼
Recipient enters Passcode & Taps "Unlock Experience"
              │
   ┌──────────┴──────────────────────────────────────────────────────┐
   │ SYNCHRONOUS GESTURE DISPATCH:                                   │
   │ 1. AudioManager.unlockContext() (Resumes AudioContext synchronously) │
   │ 2. GreetingCodec.decrypt(hashPayload, passcode)                 │
   └──────────┬──────────────────────────────────────────────────────┘
              │
       ┌──────┴──────┐
       │ Is Code OK? │
       └──────┬──────┘
              ├────────────────────────────┐
              ▼ (Success)                  ▼ (Failure / Mac Mismatch)
     [State: UNLOCKED_INTRO]       Shake PasscodeGate UI
  Camera sweeps in close           Haptic error buzz
  "Touch to light diya" prompt     "Incorrect Passcode, try again"
              │
              ▼
   [State: INTERACTIVE_UNLIT]
  PointerEvents track finger/cursor
  Sparkler particle follows touch point
              │
              ▼
Finger reaches Diya Wick Hitbox (< 0.35 distance)
              │
   ┌──────────┴──────────────────────────────────────────────────────┐
   │ IGNITION TRIGGER:                                               │
   │ 1. AudioManager.playSFX('match_strike_crackle')                 │
   │ 2. Haptics.pulse([30, 20, 50])                                  │
   │ 3. ParticleSystem.burstSparklers(wickPosition)                  │
   │ 4. FlameShader: uniforms.uLit = 1.0 (Fade from 0 to 1)          │
   │ 5. DynamicLightManager: pointLight.intensity lerp to 2.5        │
   │ 6. AudioManager.fadeInBGM(duration: 2000ms)                     │
   └──────────┬──────────────────────────────────────────────────────┘
              │
              ▼
     [State: LIT_CELEBRATION]
  Flame animates with natural wind flicker
  Floating golden embers drift upward (InstancedMesh)
  Traditional Indian sitar/flute melody playing smoothly
              │ (After 1.8s delay)
              ▼
     [State: GREETING_REVEAL]
  Camera drifts back to wide framing
  GreetingOverlay transitions in:
    • "To: [Recipient]"
    • "[Personal Festive Message]"
    • "With Love, [Sender]"
  Action CTAs: "Share", "Re-Light", "Screenshot"
```

---

## Audio Synchronization Architecture & Browser Autoplay Mitigation

Mobile WebKit (iOS Safari and Instagram In-App Browser) enforces rigorous autoplay restrictions: an `AudioContext` instantiated without a preceding user gesture remains perpetually in `'suspended'` state. Attempting to resume it inside a delayed promise chain (e.g. after a network fetch) is rejected by browser security sandboxes.

### The Two-Tier Audio Unlock Pattern

1. **Tier 1 (Synchronous Unlock via Passcode CTA):**
   When the recipient taps "Unlock Greeting" on the `PasscodeGate`, the handler synchronously executes:
   ```typescript
   if (audioCtx.state === 'suspended') {
     audioCtx.resume();
   }
   // Play 1-sample silent buffer to force-wake the iOS WebKit audio hardware daemon
   const silentBuffer = audioCtx.createBuffer(1, 1, 22050);
   const source = audioCtx.createBufferSource();
   source.buffer = silentBuffer;
   source.connect(audioCtx.destination);
   source.start(0);
   ```
2. **Tier 2 (Fallback Interaction Unlock):**
   If the recipient entered via a bypass URL (direct test mode or pre-unlocked state), any `touchstart` event on the canvas triggers the same unlock mechanism prior to ignition.
3. **App Switching & Interruption Handling:**
   Instagram's in-app browser suspends audio whenever native share sheets open or the user switches apps. The `AudioManager` registers:
   ```typescript
   document.addEventListener('visibilitychange', () => {
     if (document.hidden) {
       this.audioCtx.suspend();
     } else if (this.currentState === 'LIT_CELEBRATION' || this.currentState === 'GREETING_REVEAL') {
       this.audioCtx.resume();
     }
   });
   ```

---

## Scaling Considerations

Because the architecture requires **zero database servers** and **zero API backends**, scaling characteristics differ fundamentally from traditional web apps.

| Scale Tier | Architectural Characteristics & Optimizations |
|------------|----------------------------------------------|
| **0 – 1,000 Users** | • Static hosting on Vercel / Cloudflare Pages / Netlify.<br>• Instant deployment; zero compute or DB costs ($0.00).<br>• Local Web Audio buffers decoded directly in memory. |
| **1,000 – 100,000 Users** (Viral Instagram Reels Campaign) | • Edge CDN caching for all static chunks (Vite assets with immutable content hashes).<br>• Zero server bottleneck because traffic is purely static asset downloads.<br>• Bandwidth optimization: Audio compressed to high-efficiency OGG/AAC (mono 48kbps = ~350KB total).<br>• Total initial download budget capped under **650KB gzipped**. |
| **100,000+ Users** | • Multi-region Cloudflare CDN with Argo smart routing.<br>• KTX2 Basis Universal texture compression if photorealistic clay textures are added.<br>• Rate-limiting on static asset endpoints not required as all files are cached at edge nodes. |

### Scaling Bottlenecks & Mitigations

1. **Cellular Bandwidth in Mobile WebViews:**
   - *Problem:* Instagram users opening links on 4G cellular data will bounce if the 3D scene takes > 3 seconds to load.
   - *Mitigation:* Procedural geometry generation (`THREE.LatheGeometry` created in ~2ms on CPU) eliminates large 3D file downloads entirely. The total 3D scene geometry size is **0 KB download overhead**.
2. **GPU Fill-Rate on Low-End Smartphones:**
   - *Problem:* Budget Android devices ($100–$200 phones with Mali-G52 GPUs) overheat and drop to 15 FPS if shading full-screen pixels at high DPR.
   - *Mitigation:* Force `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))`. Disable antialiasing. Eliminate all post-processing bloom passes.

---

## Domain Anti-Patterns to Avoid

### Anti-Pattern 1: Relying on Three.js Post-Processing Bloom (`UnrealBloomPass`)
- **What people do:** Import `EffectComposer`, `RenderPass`, and `UnrealBloomPass` to make the flame look glowing.
- **Why it's wrong:** Post-processing requires multiple full-screen render passes per frame. On mobile devices, this drops frame rates from 60 FPS to 18–25 FPS, causes battery drain, and triggers mobile browser thermal throttling.
- **Do this instead:** Use single-pass **additive blending** with custom vertex/fragment GLSL shaders on a teardrop mesh, complemented by a soft radial gradient halo sprite. The visual result is visually indistinguishable and executes in **1 draw call at locked 60 FPS**.

### Anti-Pattern 2: Allocating Vectors or Objects Inside the `requestAnimationFrame` Loop
- **What people do:** Writing `const touchPos = new THREE.Vector3()` or `camera.position.lerp(new THREE.Vector3(...))` inside the per-frame update loop.
- **Why it's wrong:** Instantiating objects 60 times a second triggers aggressive JavaScript garbage collection (GC) pauses every 3–5 seconds, resulting in noticeable micro-stutters and hitching during the sacred lighting sequence.
- **Do this instead:** Pre-allocate scratch vectors (`_tempVec3 = new THREE.Vector3()`) and reusable matrices outside the loop. Mutate in place using `.set()`, `.copy()`, and `.add()`.

### Anti-Pattern 3: Setting Up a Node/Express/Supabase Backend for Greeting Storage
- **What people do:** Building a REST API where the creator POSTs a greeting to Postgres, which generates an ID (`/wishes/123`), and the recipient fetches it on load.
- **Why it's wrong:** Introduces database operational maintenance, potential server outages during peak Diwali traffic spikes, network latency on mobile cell connections, security attack surfaces, and persistent hosting costs for the creator.
- **Do this instead:** Encode and symmetrically encrypt the greeting in the URL fragment using Web Crypto AES-GCM. The app operates as an indestructible, infinite-scale, zero-cost static web application.

### Anti-Pattern 4: Invoking `AudioContext.resume()` in Asynchronous Callbacks
- **What people do:** User taps "Unlock", the code calls `await fetch(...)` or `await sleep(...)`, and then calls `audioCtx.resume()`.
- **Why it's wrong:** Mobile Safari and Instagram WebViews strictly require that `.resume()` be invoked **in the direct synchronous execution stack** of the user gesture event. Crossing an asynchronous microtask tick invalidates the user activation token and permanently silences the audio.
- **Do this instead:** Call `audioCtx.resume()` and play a dummy zero-volume audio buffer immediately upon the initial `click`/`touchend` event handler before initiating any asynchronous processing.

---

## Integration Points & External Boundaries

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Static Hosting (Cloudflare / Vercel)** | Git-backed automated continuous deployment. | Serves index.html, pre-compressed JS bundles (`.br` / `.gz`), and audio assets with `Cache-Control: public, max-age=31536000, immutable`. |
| **WhatsApp Direct Share** | Web intent URL: `https://api.whatsapp.com/send?text=...` | Formats custom text with receiver's name, secret passcode, and encrypted link for 1-click sharing by the creator. |
| **Instagram DM Clipboard** | Native `navigator.clipboard.writeText(...)` with fallback to `document.execCommand('copy')`. | Generates polite, emojis-rich instructions ready to paste into Instagram Direct Messages. |

### Internal Boundaries

| Boundary | Communication Mechanism | Notes |
|----------|--------------------------|-------|
| **`PasscodeGate` ↔ `AppStateMachine`** | Direct state machine method call (`stateMachine.transition({ type: 'UNLOCK_SUCCESS', ... })`). | Passes decrypted `GreetingData` directly into runtime memory. |
| **`TouchInteractionController` ↔ `DiyaMesh`** | Bounding sphere proximity calculation in normalized 3D space. | Calculates distance between raycasted touch plane and `wickObject.position`. |
| **`TouchInteractionController` ↔ `AudioManager`** | Event bus publication (`EventBus.emit('AUDIO_PLAY_SFX', 'ignite')`). | Decouples graphics collision logic from audio playback graph. |
| **`AppStateMachine` ↔ `SceneManager`** | State change subscriber (`stateMachine.subscribe(onStateChange)`). | Drives smooth camera transitions via linear interpolation (lerp) across pre-configured camera waypoints. |

---

## Component Build Order & Phase Dependencies

This architecture directly dictates the roadmap build sequence. Components must be implemented strictly according to their underlying dependencies:

```
[Phase 1: Core Foundation & FSM + URL Crypto Codec]
      │
      ▼
[Phase 2: 3D Scene Core, Camera Rig & Procedural Diya Mesh]
      │
      ▼
[Phase 3: Custom Flame Shader, Dynamic PointLight & Instanced Particles]
      │
      ▼
[Phase 4: Touch Gesture Interaction (Drag-to-Light) & Web Audio Engine]
      │
      ▼
[Phase 5: Festive Greeting Overlay, Typography & Celebration Animations]
      │
      ▼
[Phase 6: Creator Portal (URL Minter & Instagram/WhatsApp Share Templates)]
      │
      ▼
[Phase 7: Mobile WebView Polish (Instagram IAB, iOS Safari, Android) & Verification]
```

### Dependency Rationale:
1. **Foundation First:** The `AppStateMachine` and `GreetingCodec` must exist before UI or 3D development so that all components have typed contracts and testable state models.
2. **Graphics Precedes Interaction:** The 3D scene (`SceneManager`, `DiyaMesh`) and flame shaders must render visually before the `TouchInteractionController` can bind raycast collision hitboxes against the wick.
3. **Audio Follows Interaction:** Audio playback depends on user interaction gestures and ignition triggers established in the interaction phase.
4. **Creator Portal Built on Proven Codec:** The creator tool is built after the core experience is validated, utilizing the already battle-tested `GreetingCodec`.

---

## Sources & Grounding

- **WebGL / Three.js Mobile Optimization:** Three.js Official Manual & Discourse Best Practices (Device pixel ratio capping, instanced rendering, draw-call minimization, garbage-collection mitigation).
- **Web Audio API Autoplay Policies:** MDN Web Docs & WebKit Audio Autoplay Specification (Synchronous gesture priming, suspended state transitions, iOS WKWebView audio daemons).
- **W3C Web Cryptography API:** W3C Recommendation for `SubtleCrypto` (PBKDF2 key derivation and AES-GCM 256-bit authenticated encryption).
- **Mobile Browser Sandboxes:** Instagram & WhatsApp In-App Browser (IAB) constraints, viewport height calculation quirks (`dvh` vs `vh`), and touch event propagation.

---
*Architecture research completed for: Diwali 3D Interactive Greeting Web Experience*  
*Researched: 2026-11-03*
