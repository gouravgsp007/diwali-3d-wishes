# Project Research Summary

**Project:** Diwali 3D Wishes (Shubh Deepavali Interactive Experience)  
**Domain:** Mobile-First 3D Web Application / Interactive Festive E-Commerce Greeting (Instagram & WhatsApp Funnel)  
**Researched:** 2026-11-03  
**Confidence:** HIGH  

---

## Executive Summary

Diwali 3D Wishes is a mobile-first, zero-friction 3D festive greeting micro-web application engineered specifically for direct-to-consumer sales via Instagram DMs and WhatsApp. Instead of static e-cards or generic forwarded video clips, the product delivers an intimate, luxury digital gift ritual: a recipient receives a personalized link accompanied by a secret passcode from a loved one, unlocks the atmospheric portal, and personally lights a realistic 3D earthen lamp (*mitti ka diya*) using a touch-and-drag gesture. This triggers an explosive celebratory burst of golden sparklers, organic flickering GLSL flames, and dynamic warm illumination, soundtracked by authentic Indian bansuri flute and sitar melodies, culminating in an elegant reveal of the sender's personalized festive wish.

Industry research reveals that building this in heavy component frameworks like React with React-Three-Fiber (`@react-three/fiber` / `@react-three/drei`) is a critical architectural trap. In-app browsers (Instagram IAB, WhatsApp WebView) on mobile hardware face severe constraints: cellular cold-start latency, memory-induced WebGL context drops, aggressive audio autoplay sandboxes, and GPU fragment fill-rate saturation on Retina displays. The winning architecture couples a lean **Vite + Vanilla TypeScript + Standalone Three.js** engine (~185 KB gzipped total) with **zero-backend cryptographic URL resolution (AES-GCM via Web Crypto + `lz-string`)**, delivering instant sub-1.5s loads, $0 hosting infrastructure overhead, zero database maintenance, and 100% end-to-end recipient privacy.

The primary engineering risks are mobile-specific: (1) the iOS hardware silent switch muting Web Audio API streams, mitigated via an HTML5 `<audio>` background track combined with a 1-sample silent unlock buffer; (2) mobile GPU thermal throttling from unconstrained device pixel ratios and full-screen bloom post-processing, mitigated by hard-capping DPR at `<= 1.75` and implementing single-pass additive GLSL billboard halos; (3) first-strike shader compilation stutters during wick ignition, prevented by pre-compiling all shader variants and keeping flame lights in the scene graph at near-zero intensity prior to lighting; and (4) Instagram webview pull-to-refresh conflicts, handled via strict viewport locking (`100svh`, `touch-action: none`, `overscroll-behavior: none`).

---

## Key Findings

### Recommended Stack

The application uses a lightweight, zero-backend, vanilla web stack engineered to minimize bundle footprint and maximize frame rate on constrained mobile cellular networks.

**Core technologies:**
- **Three.js (`^0.187.0`):** Core 3D WebGL scene graph, procedural geometry, and custom GLSL shader materials. Provides deterministic imperative control over WebGL contexts, draw calls, and asset disposal without framework overhead.
- **Vite (`^6.2.0` / `^8.3.5`):** High-speed bundler and dev server. Produces lean, tree-shaken production bundles with native ES module support and instant HMR.
- **TypeScript (`^5.7.0`):** Type safety and state machine contracts across vector math, shader uniforms, greeting payloads, and Web Audio state transitions with zero runtime footprint.
- **Tailwind CSS (`^4.0.0` with `@tailwindcss/vite`):** High-performance utility CSS engine compiling down to `<6 KB` for glassmorphic mobile modals, passcode inputs, responsive typography, and dynamic safe-area insets.
- **`@tweenjs/tween.js` (`^25.0.0`):** Featherweight property interpolation (~3.5 KB gzipped vs GSAP's 27 KB) for smooth camera dollies, flame scale ignition, and light intensity lerping.
- **Native Web Audio API + HTML5 Audio:** Zero-bundle hybrid audio architecture. HTML5 audio plays continuous background sitar/flute loops bypassing iOS silent switches; Web Audio API handles zero-latency match strike and crackle sound effects.
- **Native Web Crypto (`SubtleCrypto`) + `lz-string` (`^1.5.0`):** Client-side AES-GCM 256-bit encryption with PBKDF2 key derivation for personalized greeting payloads in URL fragments (`#d=...`), eliminating server databases entirely.
- **`canvas-confetti` (`^1.9.4`):** Isolated 2D celebratory particle burst overlay (~6 KB gzipped) executed outside the WebGL 3D render pipeline to keep frame times locked at 60 FPS.

---

### Expected Features

Features are divided strictly into MVP table stakes, high-value differentiators that drive Instagram sales, and anti-features to avoid.

**Must have (table stakes):**
- **Atmospheric Passcode Gate:** Secret PIN/passcode unlock screen setting the "private gift" ritual expectation.
- **Interactive 3D Earthen Diya (*Mitti ka Diya*):** Realistic clay lamp mesh with cotton wick rendered in WebGL at 60 FPS.
- **Tactile Drag/Touch-to-Light Gesture:** Intuitive mobile gesture bringing virtual flame/match to wick with proximity detection.
- **Dynamic Flame Ignition & Warm Illumination:** Procedural flickering flame with amber PointLight warming the dark scene.
- **Personalized Festive Typography Reveal:** Staggered golden shimmer card displaying Recipient Name, Sender Name, and custom wish.
- **Festive Indian Instrumental Audio & SFX:** Sitar/bansuri background soundtrack, match strike SFX, flame crackle, and floating mute control.
- **Autoplay Compliance & Gesture Primer:** Synchronous audio context initialization hooked into the passcode unlock tap.
- **Mobile-First Responsive Shell:** 100svh viewport, DPR clamping, and pull-to-refresh suppression for Instagram/WhatsApp in-app browsers.
- **Creator Link & Template Generator:** Frictionless tool for Instagram sellers to mint links/passcodes and copy ready-to-send DM copy.

**Should have (competitive differentiators):**
- **Organic Simplex Noise GLSL Flame Shader:** Stylized dual-core teardrop flame with procedural wind flicker.
- **Celebratory Sparkler Bursts (*Phuljhadi*):** Golden particle emitter showering ember sparks upon ignition.
- **Interactive Tap-to-Burst Sparklers:** Tapping anywhere on the screen after lighting spawns cascading spark showers.
- **Sacred Rangoli Base:** Floor plane decal illuminated radially by the diya’s warm point light.
- **One-Tap WhatsApp "Send Warm Hug" Reaction:** Pre-formatted response link allowing recipient to instantly thank the sender.
- **Mobile Haptic Feedback:** Gentle tactile vibration pulses on match strike and ignition (`navigator.vibrate`).
- **Discreet Viral Acquisition CTA:** Subtle footer link inviting recipients to craft their own custom greeting via the creator's Instagram.

**Defer (v2+):**
- **Automated Self-Service Payment Portal:** Keep payments outside in Instagram DMs (UPI/Stripe) for MVP.
- **Multiple Pooja Themes / 3D Vessels:** Brass lamps, silver thalis, and royal courtyard backdrops.
- **Multi-Festive Expansion:** Adapting engine for New Year, Christmas, and Eid greetings.

**Anti-features (deliberately avoided):**
- Complex user accounts / OAuth (kills recipient conversion).
- Full-screen post-processing bloom (`UnrealBloomPass` melts mobile GPUs).
- Heavy 3D models (>15 MB) and uncompressed WAV audio.
- Native mobile app wrapper (kills 1-click DM link sharing).

---

### Architecture Approach

The architecture adopts a decoupled, layered approach with zero server-side dependencies:

1. **DOM UI & Viewport Layer (Foreground):** High-DPI HTML/CSS overlay (`position: fixed; inset: 0; pointer-events: none;`) rendering the PasscodeGate, GreetingOverlay card, and audio toggle. Child interactive elements set `pointer-events: auto`, allowing gestures to fall through to the canvas when not interacting with UI.
2. **State Coordination Layer:** A strongly typed Finite State Machine (`AppStateMachine`) governing deterministic progression (`BOOT` → `LOCKED` → `UNLOCKED_INTRO` → `INTERACTIVE_UNLIT` → `IGNITING` → `LIT_CELEBRATION` → `GREETING_REVEAL`), decoupled from graphics via an `EventBus`.
3. **Zero-Backend Cryptographic Codec (`GreetingCodec`):** Symmetrically encrypts/decrypts the greeting payload into a URL fragment using native browser `SubtleCrypto` AES-GCM (256-bit) and PBKDF2 key derivation from the 4-to-6 digit passcode. Incorrect passcode fails decryption via authenticated AES-GCM tag check without network calls.
4. **Single-Pass 3D Graphics Engine (`SceneManager`):** Three.js scene capped at `Math.min(window.devicePixelRatio, 1.75)`, running antialias: false, rendering low-poly procedural/lathe Diya geometry, custom GLSL flame shader with additive blending, camera-facing radial glow billboard sprite, and instanced sparkler particles in a single forward pass (<8 draw calls).
5. **Two-Tier Audio Engine (`AudioManager`):** Passcode unlock button synchronously calls `audioCtx.resume()` and plays a 1-sample silent HTML5 audio buffer to route WebKit `AVAudioSession` into Media Playback, unmuting both ambient music and Web Audio SFX even if the phone's physical hardware silent switch is set to orange.
6. **Creator Portal Tooling (`CreatorPortal`):** Standalone route sharing the exact same `GreetingCodec` to encode payloads, mint passcodes, and format pre-filled WhatsApp/Instagram DM messages in under 30 seconds.

---

### Critical Pitfalls

1. **iOS Hardware Silent Switch Trap:** iOS WKWebView routes Web Audio to the ambient ringer category, muting it when the phone is on orange silent mode.  
   *Prevention:* Play ambient background music via an HTML5 `<audio>` element and prime the audio stack on first tap using a 1-sample silent HTML5 audio loop to force `AVAudioSession` to Media Playback.
2. **Instagram In-App Browser Autoplay Sandbox:** Meta blocks all audio without a synchronous user gesture originating inside the webview DOM tree.  
   *Prevention:* Never autoplay on load; gate experience behind the Passcode Unlock CTA and synchronously call `audioCtx.resume()` and `<audio>.play()` in the direct touch event handler.
3. **Retina Fill-Rate Choke & Thermal Throttling:** Flagship phones with DPR 3.0+ render over 26 million fragments per frame, causing phones to overheat within 60 seconds and drop to 15 FPS.  
   *Prevention:* Strictly clamp DPR to `Math.min(window.devicePixelRatio, 1.75)` (or 1.5 on mobile) and use `precision mediump float;` in all GLSL shaders.
4. **Full-Screen Bloom Framebuffer Meltdown:** Three.js `UnrealBloomPass` requires multiple offscreen FBO blur passes, causing severe stutter or WebGL out-of-memory crashes on mobile.  
   *Prevention:* Implement flame halos using `THREE.AdditiveBlending` billboard quads/sprites and modulated PointLights in the forward pass.
5. **First-Ignition Shader Compilation Freeze:** Three.js lazily compiles shaders on the first frame a material or light is drawn, causing a 500ms–1.5s freeze right as the wick ignites.  
   *Prevention:* Pre-compile all scene materials at startup with `renderer.compile(scene, camera)`, warm textures with `renderer.initTexture()`, and keep dynamic lights in the scene at `intensity: 0.0001` prior to strike.
6. **Instagram Viewport Jitter & Touch Conflicts:** Swiping the 3D scene triggers Instagram's native pull-to-refresh or back gestures, while dynamic toolbars resize `100dvh`.  
   *Prevention:* Set `overscroll-behavior: none; touch-action: none;` on HTML/body; use `100svh` or fixed `window.innerHeight` coordinates for canvas.

---

## Implications for Roadmap

The research dictates a 7-phase build order structured strictly around dependency constraints (state & crypto foundation → 3D rendering → custom shaders & VFX → touch interaction & audio → celebratory UI & polish → creator automation → mobile webview hardening).

### Phase 1: Core Architecture, State Machine & Cryptographic Codec
**Rationale:** The application state machine (`AppStateMachine`), cryptographic codec (`GreetingCodec`), and mobile viewport container must exist before building graphics or UI, ensuring all subsequent modules adhere to typed contracts and mobile touch constraints.  
**Delivers:** Vite + TypeScript scaffolding, responsive `100svh` viewport container with pull-to-refresh suppression, AES-GCM encryption/decryption engine with `lz-string`, robust URL parser handling both hash fragments (`#d=...`) and query parameters (`?c=...`) with Instagram link shim protection, and initial festive PasscodeGate DOM modal.  
**Addresses:** Passcode Unlock Screen, Mobile-First Viewport shell, URL token resolution.  
**Avoids:** Instagram link shim parameter stripping (Pitfall 8), viewport jumping / pull-to-refresh reloading (Pitfall 6), client-side data leakage (Security Pitfall).

### Phase 2: WebGL Scene Engine, Camera Rig & 3D Diya Mesh
**Rationale:** The 3D scene environment, camera framing, and foundational earthen lamp geometry must be established before attaching custom GLSL shaders, point lights, or touch hitboxes.  
**Delivers:** `SceneManager` with clamped DPR (`<= 1.75`), antialiasing disabled for mobile performance, responsive vertical-FOV `CameraRig` with cinematic waypoints, low-poly procedural/lathe terracotta Diya mesh with cotton wick, baked ambient occlusion and clay PBR materials, RAF loop with `visibilitychange` background pause, and WebGL context loss/recovery listeners (`webglcontextlost` / `webglcontextrestored`).  
**Addresses:** Interactive 3D Earthen Diya, 60 FPS mobile WebGL foundation.  
**Avoids:** Retina fill-rate GPU choke (Pitfall 3), WebGL context loss crashes during app switching (Pitfall 7), asset bloat over 2.5 MB (Pitfall 9).

### Phase 3: Procedural GLSL Flame Shader, Additive Bloom & Particle FX
**Rationale:** Visual lighting and particle physics must be pre-warmed and verified in forward rendering before wiring user touch interactions to avoid ignition stutter.  
**Delivers:** Custom procedural vertex/fragment GLSL flame shader with simplex noise wind flutter, additive halo glow billboard sprite (`THREE.AdditiveBlending`), single dynamic amber `PointLight` with Perlin intensity jitter, and instanced golden sparkler particle system (`THREE.InstancedMesh` / `THREE.Points`) executing in a single draw call. Implements `renderer.compile(scene, camera)` warm-up.  
**Addresses:** Organic flame flickering shader, warm dynamic point lighting, sparkler celebration particle bursts (*Phuljhadi*), Rangoli illuminated base.  
**Avoids:** Full-screen bloom meltdown (Pitfall 4), first-strike shader compilation freeze (Pitfall 5), CPU particle loop lag.

### Phase 4: Touch Interaction Controller & Dual-Tier Audio Architecture
**Rationale:** Touch gesture tracking and audio activation must be coupled together: the passcode unlock tap primes the audio hardware, and finger dragging to the wick hitbox triggers the ignition sequence.  
**Delivers:** `TouchInteractionController` with mobile PointerEvents, raycasting to wick bounding sphere hitbox (`< 0.35` units), tactile haptic feedback pulses (`navigator.vibrate`), and `AudioManager` singleton. Implements dual-tier audio: HTML5 `<audio>` for streaming ambient sitar/flute music (bypassing iOS silent switch) + Web Audio API for low-latency match strike and crackle SFX, primed synchronously on passcode submit tap, with top-right floating mute/unmute control.  
**Addresses:** Touch-to-light interaction, festive instrumental soundtrack, match strike & crackle SFX, audio controls & autoplay compliance, tactile haptics.  
**Avoids:** iOS hardware silent switch trap (Pitfall 1), Instagram in-app browser autoplay quarantine (Pitfall 2).

### Phase 5: Festive Greeting Reveal, Typography & Celebration Polish
**Rationale:** The emotional climax of the product occurs after the diya ignites. Typography, celebration animations, and viral loops belong in this layer.  
**Delivers:** `GreetingOverlay` glassmorphic festive card with staggered gold shimmer typography (Recipient, Message, Sender), responsive mobile card layout with safe-area insets, celebratory `canvas-confetti` golden sparkler explosion, interactive tap-to-burst sparkler playground on the lit scene, one-tap WhatsApp "Thank You" reaction URL generator, and discreet viral creator CTA footer.  
**Addresses:** Personalized typography reveal, tap-to-burst sparkler interaction, WhatsApp reciprocation loop, discreet viral acquisition badge.  
**Avoids:** Greeting text clipping on small phone screens, jarring instant snap to text (UX Pitfall).

### Phase 6: Creator Portal & Delivery Message Generator Tool
**Rationale:** Built upon the validated `GreetingCodec`, the seller requires a friction-free internal generator to mint greeting packages and formatted copy in seconds.  
**Delivers:** Standalone creator interface (`/create` or admin drawer) allowing the seller to input recipient name, sender name, custom message, and secret passcode; client-side AES-GCM encryption into shareable URL; and 1-click clipboard formatting for ready-to-send WhatsApp and Instagram DM copy with emojis and instructions.  
**Addresses:** Zero-Tech Creator Management tool, pre-formatted DM delivery templates.  
**Avoids:** Server database operational overhead and hosting bills (Anti-Pattern 3), customer privacy leaks.

### Phase 7: Mobile WebView Hardening, End-to-End Verification & Performance Audit
**Rationale:** Final comprehensive verification across actual physical devices and constrained social in-app browsers before launching marketing campaigns.  
**Delivers:** Physical device validation on iOS (Instagram DM WKWebView with silent switch orange and loud) and Android (Instagram, WhatsApp, Chrome), 60 FPS performance profiling, Lighthouse mobile audit confirmation (total uncompressed transfer `< 2.5 MB`), XSS sanitization checks, and full user journey validation from link click to diya lighting to WhatsApp reaction.  
**Addresses:** Universal mobile responsiveness, commercial launch readiness.  
**Avoids:** All critical mobile edge cases and silent audio regressions.

---

### Phase Ordering Rationale

- **Foundation Before Visuals:** Cryptographic decoding and application state machines must precede 3D rendering so all components share immutable state contracts and can be tested headlessly.
- **Scene & Shaders Before Interaction:** The 3D diya, flame shaders, and particle systems must be in place and compiled before building touch controllers, allowing precise raycast hitbox calibration and zero-stutter ignition profiling.
- **Audio Coupled with Passcode Touch:** The audio subsystem must be wired directly to the passcode submit interaction to comply with WebKit/Blink autoplay activation windows and iOS silent switch workarounds.
- **Creator Portal Reuses Proven Codec:** The creator generation tool is built after the recipient decoding flow is solidified, guaranteeing 100% cryptographic compatibility.
- **Hardening as Final Gate:** Testing inside actual Instagram in-app browser webviews ensures all mobile edge cases (gesture collisions, link shim tracking parameters, silent switches) are verified on hardware.

---

### Research Flags

**Phases needing deeper research / spike during planning:**
- **Phase 4 (Audio Architecture & Touch Controller):** Precise implementation and device testing of the 1-sample silent HTML5 audio trick to force iOS `AVAudioSession` into Media Playback mode under Instagram WKWebView; fine-tuning touch hitbox thresholds on compact mobile displays.
- **Phase 3 (Flame Shader & Additive Glow):** Tuning GLSL simplex noise parameters in `mediump float` and billboard sprite scaling to look luminous across OLED and LCD mobile screens without banding.

**Phases with standard, well-documented patterns (skip research-phase):**
- **Phase 1 (App Foundation, FSM & Crypto):** Standard TypeScript FSM and W3C Web Crypto AES-GCM + PBKDF2 APIs.
- **Phase 2 (Three.js Scene Setup & Diya Mesh):** Standard Three.js canvas setup, DPR clamping, and procedural lathe geometry.
- **Phase 5 (Greeting Card UI & Confetti):** Standard Tailwind CSS responsive glassmorphism and `canvas-confetti` integration.
- **Phase 6 (Creator Form & Clipboard):** Standard HTML form handling and `navigator.clipboard.writeText`.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | Verified current npm packages (`three@0.187.0`, `vite`, `tailwindcss@4`, `@tweenjs/tween.js@25.0.0`), bundle sizes via Bundlephobia, and zero-backend Web Crypto standards. |
| **Features** | HIGH | Exhaustive feature classification (table stakes, differentiators, anti-features) aligned with Instagram D2C sales funnel and cultural Diwali traditions. |
| **Architecture** | HIGH | Clear component boundaries, typed FSM lifecycle, single-pass additive shading strategy, and decoupled dual-layer (WebGL + DOM) design. |
| **Pitfalls** | HIGH | Deep technical grounding in mobile WebGL failure modes, iOS WKWebView hardware silent switch quirks, Instagram autoplay quarantine, and DPR fill-rate throttling. |

**Overall confidence:** HIGH

### Gaps to Address

- **Draco vs Procedural Diya Geometry:** Research suggests procedural `THREE.LatheGeometry` has 0 KB download overhead, while a Draco-compressed GLTF offers slightly higher clay texturing fidelity (~30 KB). Decide between procedural lathe or compressed GLB during Phase 2 implementation.
- **Audio Asset Sourcing & Licensing:** Requires sourcing royalty-free or custom-composed authentic Indian classical sitar/bansuri instrumental loops (<800 KB encoded at 64kbps MP3) and crisp match-strike SFX.
- **Android Haptic Variations:** `navigator.vibrate` is supported on Android Chrome/WebViews but ignored on iOS Safari/WebKit. Graceful degradation must be ensured so iOS users experience no errors.

---

## Sources

### Primary (HIGH confidence)
- **Three.js Official Documentation & Manual:** WebGLRenderer mobile optimization, `ShaderMaterial`, `setPixelRatio`, instanced rendering (`threejs.org`).
- **W3C Web Cryptography API Specification:** `SubtleCrypto` AES-GCM 256-bit authenticated encryption and PBKDF2 key derivation (`w3.org/TR/WebCryptoAPI`).
- **Apple WebKit Audio Specifications:** iOS WKWebView autoplay policies, `AudioContext` suspension states, and `AVAudioSession` routing (`webkit.org`).
- **MDN Web Docs:** Web Audio API best practices, PointerEvents touch handling, CSS `100svh` and dynamic viewport units.
- **Bundlephobia:** Bundle size metrics for Three.js, R3F, Drei, GSAP, `@tweenjs/tween.js`, and `lz-string`.

### Secondary (MEDIUM confidence)
- **Howler.js Issue Tracker & Community Workarounds:** iOS hardware mute switch bypass mechanisms and HTML5 audio session escalation (`github.com/goldfire/howler.js`).
- **Meta / Instagram Developer Guidelines:** In-app browser link shimming (`l.instagram.com`), query parameter passing (`fbclid`, `igsh`), and WKWebView gesture hijacking.
- **Google Web.dev Guidelines:** Mobile WebGL performance budgets, Core Web Vitals, and `overscroll-behavior: none` touch control.

---
*Research completed: 2026-11-03*  
*Ready for roadmap: yes*
