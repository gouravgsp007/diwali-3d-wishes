# Roadmap: Diwali 3D Wishes

## Overview

Diwali 3D Wishes delivers an immersive, luxury digital festive ritual sold directly through Instagram DMs and WhatsApp. Recipients receive a secret passcode and personalized link, opening an atmospheric web portal that loads instantly with zero server infrastructure. Upon entering the passcode, the audio engine is primed and a photorealistic 3D earthen diya (*mitti ka diya*) is presented. Dragging a virtual flame to the cotton wick ignites an organic GLSL flickering flame, casting warm dynamic illumination across a sacred floor pattern while showering golden sparkler particles (*phuljhadi*). Synchronous bansuri and sitar melodies bypass the iOS hardware silent switch, culminating in a celebratory reveal of a personalized glassmorphic greeting card with a 1-tap WhatsApp reciprocation loop.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Core Architecture, State Machine & Cryptographic Codec** - Establish foundational state machine, mobile viewport container, and zero-backend AES-GCM passcode unlock gate
- [x] **Phase 2: WebGL Scene Engine, Camera Rig & 3D Diya Mesh** - Build mobile-optimized Three.js scene, responsive camera rig, and procedural/low-poly terracotta diya model
- [ ] **Phase 3: Procedural GLSL Flame Shader, Additive Bloom & Particle FX** - Implement organic flickering flame shader, warm amber point light, additive glow halo, and bursting sparklers
- [ ] **Phase 4: Touch Interaction Controller & Dual-Tier Audio Architecture** - Add touch-and-drag match ignition, proximity detection, haptics, and dual-tier audio bypassing iOS silent switch
- [ ] **Phase 5: Festive Greeting Reveal, Typography & Celebration Polish** - Deliver glassmorphic greeting card with gold shimmer typography, confetti celebration, tap sparklers, and WhatsApp reaction
- [ ] **Phase 6: Creator Portal & Delivery Message Generator Tool** - Create standalone generator for sellers to encrypt wishes, set passcodes, and 1-click copy pre-formatted DM delivery text
- [ ] **Phase 7: Mobile WebView Hardening & Platform Resilience** - Harden against mobile in-app browser quirks, DPR thermal throttling, and WebGL context restoration across app switches

## Phase Details

### Phase 1: Core Architecture, State Machine & Cryptographic Codec
**Goal:** Establish the application state machine, mobile viewport container, and zero-backend client-side AES-GCM encryption/decryption engine with passcode unlock gate.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: PASS-01, PASS-02, PASS-03, PASS-04
**Success Criteria** (what must be TRUE):
  1. Recipient can enter a 4-to-6 digit passcode on an atmospheric landing screen to unlock their private greeting.
  2. System decrypts encrypted payload locally using Web Crypto AES-GCM (PBKDF2 key derivation) without any server calls.
  3. Entering an incorrect passcode triggers an elegant festive shake/rejection animation without leaking plaintext data.
  4. System cleanly parses encrypted greeting data from both URL hash fragments (`#d=...`) and query parameters (`?c=...`) with Instagram link shim protection.
**Plans**: 2/2 plans executed

Plans:
**Wave 1**
- [x] 01-01-PLAN.md — Scaffold project infra, test setup, typed FSM, and Web Crypto AES-GCM + lz-string GreetingCodec

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 01-02-PLAN.md — PasscodeGate glassmorphic UI, responsive 100svh viewport, shake error animations, URL hash/query resolution with Instagram link shim stripping, and synchronous audio unlock stub

**UI hint**: yes

### Phase 2: WebGL Scene Engine, Camera Rig & 3D Diya Mesh
**Goal:** Construct the mobile-optimized Three.js scene, responsive vertical-FOV camera rig, and authentic 3D earthen diya mesh.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: DIYA-01
**Success Criteria** (what must be TRUE):
  1. Recipient views an authentic 3D terracotta earthen diya (*mitti ka diya*) with cotton wick rendered in Three.js at 60 FPS on mobile.
  2. Camera framing automatically adapts to mobile portrait, tablet, and desktop viewports, keeping the diya centered without clipping.
  3. Diya material displays realistic baked clay ambient occlusion and subtle earthen roughness under neutral ambient lighting.
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Dependencies, procedural CanvasTextures, responsive portrait vFOV CameraRig, and resilient SceneManager engine
- [ ] 02-02-PLAN.md — Procedural Diya mesh, brass thali platter, dual-tier lighting baseline, golden bokeh motes, and FSM bootstrap integration
**UI hint**: yes

### Phase 3: Procedural GLSL Flame Shader, Additive Bloom & Particle FX
**Goal:** Implement organic procedural GLSL flame shaders, warm dynamic point lighting, single-pass additive glow halo, and golden sparkler fountain.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: VFX-01, VFX-02, VFX-03, VFX-04
**Success Criteria** (what must be TRUE):
  1. Igniting the wick animates a procedural GLSL flame with organic simplex noise flutter, teardrop geometry, and warm color gradient.
  2. Lit flame casts dynamic warm amber PointLight illuminating the earthen diya rim and sacred floor pattern with subtle intensity jitter.
  3. A single-pass additive glow billboard quad creates a radiant golden halo around the flame without full-screen bloom passes.
  4. Flame ignition triggers an outward-bursting golden sparkler particle fountain (*phuljhadi*) in a single draw call.
**Plans**: TBD

### Phase 4: Touch Interaction Controller & Dual-Tier Audio Architecture
**Goal:** Implement responsive mobile touch-and-drag match ignition, proximity detection, haptic feedback, and dual-tier audio engine bypassing iOS silent switches.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: DIYA-02, AUDIO-01, AUDIO-02, AUDIO-03, AUDIO-04
**Success Criteria** (what must be TRUE):
  1. Recipient can drag a virtual flame/match toward the cotton wick with smooth touch tracking and automatic ignition upon crossing proximity threshold (<0.35 units).
  2. Submitting the passcode synchronously unlocks and primes Web Audio API and HTML5 audio, ensuring immediate playback without mobile autoplay blocking.
  3. Continuous ambient Indian classical sitar/flute soundtrack plays via HTML5 audio even when an iOS device has its physical hardware switch set to silent.
  4. Match-strike and flame crackle sound effects trigger with zero perceptible latency upon wick ignition via Web Audio API.
  5. Recipient can mute or unmute all sound at any moment via a floating glassmorphic audio toggle.
**Plans**: TBD
**UI hint**: yes

### Phase 5: Festive Greeting Reveal, Typography & Celebration Polish
**Goal:** Deliver glassmorphic greeting card reveal with gold shimmer typography, celebratory confetti explosion, tap-to-burst sparklers, and WhatsApp reciprocation loop.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: VFX-05, WISH-01, WISH-02, WISH-03
**Success Criteria** (what must be TRUE):
  1. Successful diya ignition smoothly transitions camera into an elegant glassmorphic card with staggered gold shimmer typography displaying Recipient Name, Sender Name, and Personal Message.
  2. Recipient can tap anywhere on the lit 3D canvas to trigger celebratory interactive sparkler showers.
  3. Recipient can tap a WhatsApp button to send a pre-filled warm "Thank You / Happy Diwali" reaction back to the sender.
  4. Greeting displays a discreet festive footer badge linking to the creator's Instagram profile for recipients to order custom greetings.
**Plans**: TBD
**UI hint**: yes

### Phase 6: Creator Portal & Delivery Message Generator Tool
**Goal:** Build a zero-tech standalone creator generator for sellers to create encrypted wishes, set passcodes, and 1-click copy formatted DM delivery text.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: CREATOR-01, CREATOR-02
**Success Criteria** (what must be TRUE):
  1. Seller can input recipient name, sender name, message, and 4-to-6 digit passcode into an intuitive generator and produce an encrypted URL in seconds.
  2. Seller can 1-click copy pre-formatted Instagram DM / WhatsApp delivery copy with festive emojis and clear unlock instructions.
  3. Generated encrypted links unlock seamlessly in recipient view when the matching passcode is entered.
**Plans**: TBD
**UI hint**: yes

### Phase 7: Mobile WebView Hardening & Platform Resilience
**Goal:** Ensure rock-solid mobile webview performance, DPR thermal safety, and WebGL state restoration across Instagram and WhatsApp in-app browsers.
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: DIYA-03, DIYA-04
**Success Criteria** (what must be TRUE):
  1. System strictly clamps device pixel ratio (`Math.min(window.devicePixelRatio, 1.75)`) and viewport (`100svh`), eliminating GPU overheating and browser pull-to-refresh jitter.
  2. System listens to `webglcontextlost` and `webglcontextrestored` to seamlessly recover 3D scene state without crashes when switching between mobile apps.
  3. Full interactive experience maintains stable 60 FPS on mid-tier mobile hardware within a <2.5 MB total transfer budget.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Architecture, State Machine & Cryptographic Codec | 2/2 | Complete | 2026-11-04 |
| 2. WebGL Scene Engine, Camera Rig & 3D Diya Mesh | 2/2 | Complete | 2026-11-04 |
| 3. Procedural GLSL Flame Shader, Additive Bloom & Particle FX | 0/TBD | Not started | - |
| 4. Touch Interaction Controller & Dual-Tier Audio Architecture | 0/TBD | Not started | - |
| 5. Festive Greeting Reveal, Typography & Celebration Polish | 0/TBD | Not started | - |
| 6. Creator Portal & Delivery Message Generator Tool | 0/TBD | Not started | - |
| 7. Mobile WebView Hardening & Platform Resilience | 0/TBD | Not started | - |
