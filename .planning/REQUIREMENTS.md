# Requirements: Diwali 3D Wishes (Shubh Deepavali Interactive Experience)

**Defined:** 2026-11-03  
**Core Value:** Delivering an emotional, jaw-dropping 3D festive experience where lighting a virtual diya unlocks an intimate, personalized Diwali greeting with zero technical friction for buyers and recipients.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Passcode & Gateway (PASS)

- [ ] **PASS-01**: Recipient can enter a 4-to-6 digit passcode on an atmospheric landing screen to unlock their greeting.
- [ ] **PASS-02**: System decrypts the encrypted greeting payload locally via client-side Web Crypto AES-GCM (PBKDF2 key derivation) without server round-trips.
- [ ] **PASS-03**: System displays an elegant festive rejection feedback animation on invalid passcode without leaking plaintext data.
- [ ] **PASS-04**: System parses greeting data from both URL hash fragment (`#d=...`) and query fallback with Instagram link shim protection.

### 3D Scene & Diya Core (DIYA)

- [ ] **DIYA-01**: Recipient views an authentic 3D earthen diya (*mitti ka diya*) with cotton wick rendered in Three.js at 60 FPS on mobile.
- [ ] **DIYA-02**: Recipient can drag a virtual flame/match toward the cotton wick with responsive mobile touch gesture tracking and proximity collision detection.
- [ ] **DIYA-03**: System strictly clamps device pixel ratio (`Math.min(window.devicePixelRatio, 1.75)`) and viewport (`100svh`) to eliminate GPU overheating and browser pull-to-refresh jitter.
- [ ] **DIYA-04**: System listens to `webglcontextlost` and `webglcontextrestored` to seamlessly recover 3D scene state if the mobile OS switches apps.

### Flame Shader & Visual FX (VFX)

- [ ] **VFX-01**: Igniting the wick animates a procedural GLSL flame with organic simplex noise flutter and warm color gradient.
- [ ] **VFX-02**: Lit flame casts dynamic warm amber PointLight illuminating the earthen diya rim and sacred floor pattern.
- [ ] **VFX-03**: Single-pass additive glow billboard quad creates a radiant golden halo without expensive post-processing bloom passes.
- [ ] **VFX-04**: Ignition triggers a celebratory golden sparkler particle fountain (*phuljhadi*) bursting outward.
- [ ] **VFX-05**: Recipient can tap anywhere on the lit 3D canvas to trigger celebratory interactive sparkler showers.

### Festive Audio System (AUDIO)

- [ ] **AUDIO-01**: Passcode submit tap synchronously unlocks and primes Web Audio API and HTML5 audio context to guarantee compliance with mobile autoplay policies.
- [ ] **AUDIO-02**: System streams continuous ambient Indian classical sitar/flute soundtrack using HTML5 audio to bypass the iOS hardware silent switch.
- [ ] **AUDIO-03**: System plays low-latency match-strike and flame crackle sound effects via Web Audio API upon ignition.
- [ ] **AUDIO-04**: Recipient can toggle sound on/off at any time using a floating glassmorphic mute/unmute control.

### Personalized Greeting & Social Loops (WISH)

- [ ] **WISH-01**: Successful diya ignition transitions into an elegant glassmorphic greeting card with staggered gold shimmer typography (Recipient, Sender, Personal Message).
- [ ] **WISH-02**: Recipient can tap a WhatsApp button to send a pre-filled warm "Thank You / Happy Diwali" reaction back to the sender.
- [ ] **WISH-03**: Greeting displays a discreet festive footer badge linking to the creator's Instagram profile for recipients to order custom greetings.

### Creator Management & Sharing (CREATOR)

- [ ] **CREATOR-01**: Seller can use an embedded creator generator to input recipient name, sender name, message, and passcode, producing an encrypted URL in seconds.
- [ ] **CREATOR-02**: Seller can 1-click copy pre-formatted Instagram DM / WhatsApp delivery copy with festive emojis and unlock instructions.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### E-Commerce & Themes

- **ECOMM-01**: Automated in-app payment gateway checkout (Stripe / Razorpay) for instant passcode purchase without manual DM messaging.
- **THEME-01**: Selectable festive Pooja vessels (brass diya, royal silver thali, clay lamp varieties) and background courtyards.
- **MEDIA-01**: Support for custom personal photo/portrait attachment inside the greeting reveal card.
- **SEASON-01**: Expansion packs for other festive occasions (New Year, Holi, Eid, Christmas).

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User Account / OAuth Sign-up | Friction that destroys conversion; gift recipients expect immediate gratification via passcode. |
| Server Database & Backend APIs | Unnecessary hosting costs and maintenance; client-side AES-GCM URL hash encryption scales infinitely for $0. |
| Full-Screen Post-Processing Bloom (`UnrealBloomPass`) | Melts mobile GPUs down to 15 FPS; replaced with single-pass additive GLSL billboard halos. |
| Heavy 3D Asset Downloads (>2.5 MB) | Slows initial load on mobile 4G/5G connections; procedural geometry and compressed low-poly models keep load under 1.5s. |
| In-App Payment Paywalls in Recipient View | Degrades the recipient's emotional experience; commercial transactions belong exclusively in creator sales channels. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PASS-01 | Phase 1 | Pending |
| PASS-02 | Phase 1 | Pending |
| PASS-03 | Phase 1 | Pending |
| PASS-04 | Phase 1 | Pending |
| DIYA-01 | Phase 2 | Pending |
| DIYA-02 | Phase 4 | Pending |
| DIYA-03 | Phase 2 | Pending |
| DIYA-04 | Phase 2 | Pending |
| VFX-01 | Phase 3 | Pending |
| VFX-02 | Phase 3 | Pending |
| VFX-03 | Phase 3 | Pending |
| VFX-04 | Phase 3 | Pending |
| VFX-05 | Phase 5 | Pending |
| AUDIO-01 | Phase 4 | Pending |
| AUDIO-02 | Phase 4 | Pending |
| AUDIO-03 | Phase 4 | Pending |
| AUDIO-04 | Phase 4 | Pending |
| WISH-01 | Phase 5 | Pending |
| WISH-02 | Phase 5 | Pending |
| WISH-03 | Phase 5 | Pending |
| CREATOR-01 | Phase 6 | Pending |
| CREATOR-02 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-11-03*  
*Last updated: 2026-11-03 after initial definition*
