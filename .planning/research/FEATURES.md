# Feature Research: Diwali 3D Interactive Greeting

**Domain:** Premium Interactive 3D Festive Web Experiences & Digital Social Gifting  
**Researched:** 2026-11-03  
**Confidence:** HIGH  

---

## Executive Overview

The interactive digital greeting market is shifting from static e-cards and generic WhatsApp video forwards to **hyper-personalized micro-web experiences**. For a product sold direct-to-consumer via Instagram, success hinges on two distinct emotional peaks:
1. **The Creator/Buyer Experience:** High perceived value, premium luxury aesthetic, and frictionless creation of customized wishes they feel proud gifting.
2. **The Recipient Experience:** Instant mobile loading in Instagram/WhatsApp webviews, an intimate passcode-unlock ritual, a tactile 3D diya-lighting interaction that honors traditional festive symbolism (bringing light into darkness), and a heartfelt personalized reveal that triggers genuine emotional delight.

To stand out in Instagram feeds, the experience must be visually hypnotic in short-form video reels (5–10 seconds of flame ignition, golden sparkler showers, glowing dark-room illumination), while remaining rock-solid on mobile browsers under constrained cellular bandwidth.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these makes the product feel broken, unpolished, or incomplete.

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|----------------------|
| **Passcode / Secret Key Unlock Screen** | Establishes the "private gift" expectation set in Instagram DMs. Without it, the link feels like a public webpage rather than a personal gift. | LOW | Clean festive PIN pad or numeric/alphanumeric input modal with subtle golden glow, shake animation on error, and smooth entrance animation on success. |
| **Interactive 3D Earthen Diya (*Mitti ka Diya*)** | Centerpiece of Diwali tradition. The lamp must feel grounded, authentic, and tactile—not a flat 2D sticker or generic cartoon. | MEDIUM | Three.js low-poly mesh (<15k triangles) with terracotta/brass PBR material, textured clay surface, cotton wick (*baati*), and warm ambient occlusion. |
| **Intuitive Touch/Drag Lighting Gesture** | The core celebratory metaphor is *lighting the lamp yourself*. Passive auto-playing animations kill the magic. | MEDIUM | Mobile touch-drag or tap gesture bringing a virtual sparkler/flame to the diya wick. Clear visual affordance ("Swipe to light" / pulsing wick highlight). |
| **Dynamic Flame Ignition & Illumination** | When the wick lights, the dark environment must instantly warm up with dynamic light casting. | MEDIUM | Dynamic Three.js `PointLight` scaling up from 0 to full intensity (golden/amber #ff9900), illuminating the diya rim and ground surface with soft falloff. |
| **Personalized Typography Reveal** | The emotional core of the gift: recipient name, sender name, and custom festive greeting text. | LOW | Elegant typography (e.g. *Cinzel* / *Playfair Display* + *Poppins*) transitioning with staggered fade-in + gold shimmer once the diya is lit. |
| **Festive Indian Instrumental Audio & SFX** | Diwali without festive sound feels sterile. Sound provides 50% of the emotional immersion. | MEDIUM | Authentic Indian classical score (soothing Bansuri flute or Sitar melody) + realistic sound effects (match strike, gentle whoosh, soft flame crackle). |
| **Audio Controls & Autoplay Compliance** | Mobile browsers (iOS Safari, Android Chrome) strictly block unprompted audio playback. Users also need a quick mute toggle. | LOW | Audio context is initialized cleanly on the recipient's first tap (unlock passcode button). Floating unobtrusive mute/unmute icon in corner. |
| **Mobile-First Responsive WebGL Viewport** | 98% of users open the link on smartphones directly inside Instagram DM or WhatsApp in-app browsers. | MEDIUM | Fixed 100dvh viewport, dynamic canvas resize handling, DPI capping at `Math.min(window.devicePixelRatio, 2)` to prevent mobile GPU throttling. |
| **Creator Link & Passcode Generator Tool** | The Instagram seller needs a zero-friction way to mint unique links/passcodes and copy formatted customer DM messages in under 30 seconds. | LOW | Simple internal generator UI (or query-string hash generator) that outputs ready-to-paste WhatsApp/Instagram DM templates with recipient link & passcode. |

---

### Differentiators (Competitive Advantage)

Features that elevate the experience from "cool student project" to a luxury, viral digital product worth paying for.

| Feature | Value Proposition | Complexity | Implementation Notes |
|---------|-------------------|------------|----------------------|
| **Organic Flame Flickering Shader (GLSL)** | Standard Three.js point lights look artificial. A custom noise-distorted GLSL flame shader creates mesmerizing organic life. | HIGH | Procedural vertex & fragment shader with 2D Perlin noise simplex displacement, dual-core color ramp (blue base, vibrant yellow center, deep orange tip). |
| **Sparkler Celebration Particle Bursts (*Phuljhadi*)** | Sparks emotional euphoria the moment the flame catches—mimicking festive sparklers and fireworks. | MEDIUM | GPU particle system emitting 300–500 golden ember sparks with gravity, drag, velocity randomness, and additive alpha blending. |
| **Interactive Tap-to-Burst Sparklers** | Transforms passive reading into playful celebration. Recipients can tap anywhere on the screen to trigger cascading spark showers. | MEDIUM | Raycasting / screen-space particle spawner on touch points, triggering micro-bursts of golden and crimson celebratory sparks. |
| **Sacred Rangoli & Warm Floor Glow** | Culturally rich environmental storytelling. An intricate illuminated Rangoli underneath the diya emphasizes authenticity. | LOW | Alpha-blended circular floor plane with high-contrast floral Rangoli decal, illuminated radially by the diya’s flickering point light. |
| **Floating Sky Lanterns (*Akash Kandil*) in Backdrop** | Adds breathtaking visual depth. Distant warm lanterns slowly ascending through a starry midnight sky create cinematic wonder. | MEDIUM | Instanced mesh particles with gentle sinusoidal drift and soft glowing shader moving vertically in the far background. |
| **One-Tap WhatsApp "Send Warm Hug / Thank You" Loop** | Closes the social loop. Recipients immediately tap one button to send a heartfelt pre-filled response to the sender on WhatsApp. | LOW | Pre-formatted `https://api.whatsapp.com/send?phone=...&text=...` URI encoding a sweet thank-you note ("I just lit the diya you sent! It was magical..."). |
| **Device Tilt / Gyroscopic 3D Parallax** | Holding the phone feels like holding a physical brass thali with a real flame shifting with device tilt. | MEDIUM | Mobile `DeviceOrientationEvent` mapped smoothly (with lerp dampening) to camera rotation and light bounce offsets. Graceful fallback on desktop. |
| **Tactile Haptic Feedback** | Haptic vibrations trigger physical realism when striking the sparkler and igniting the flame on mobile devices. | LOW | `navigator.vibrate([40, 60, 100])` sequenced precisely with the match strike and flame ignition moments (supported on Android/Chrome). |
| **Discreet Viral Acquisition CTA** | Turns every delighted recipient into a potential customer for the creator's Instagram service. | LOW | Subtle, tasteful badge at footer: *"Craft your own custom 3D festive surprise → @CreatorHandle"*. Non-intrusive, appearing only after greeting reveal. |

---

### Anti-Features (What to Deliberately NOT Build)

Features that seem appealing in brainstorming but actively degrade conversion, user delight, and technical reliability.

| Anti-Feature | Why Requested | Why Problematic | Alternative / Better Approach |
|--------------|---------------|-----------------|-------------------------------|
| **Complex User Accounts & OAuth Sign-in** | "Security" or "user profiles" | Recipients will bounce immediately if forced to register, verify email, or sign in via Google just to read a holiday wish from a friend. | **Passcode or URL Token Unlock:** Zero friction, preserves surprise and privacy without signup. |
| **In-App Paywalls or Upsell Modals Inside Greeting** | "Monetize recipients" | Tacky and disrespectful. Ruins the emotional intimacy of receiving a festive gift from a loved one. | **Keep payments outside in creator DMs (UPI/Stripe).** Place only a discreet, tasteful link at the very end. |
| **Heavy 3D Models (>15MB GLTF / 4K Textures)** | "Ultra-photorealism" | 5–10 second loading screens over mobile 4G/5G cause 60%+ bounce rates. In-app browsers often crash with high memory. | **Procedural meshes & baked lightweight textures (<3MB total package).** Loads in under 1.5 seconds. |
| **Full 3D Minigame / Arcade Mechanics** | "Gamification" | Complex controls (joysticks, physics puzzles) confuse non-tech-savvy recipients (parents, grandparents). | **Single satisfying tactile gesture:** One intuitive swipe or tap to light the diya, followed by celebratory visual payoff. |
| **Cluttered Banner Ads or Floating Watermarks** | "Ad revenue" | Makes the product look like cheap greeting spam from 2005, destroying the premium gift aesthetic. | **Pristine, luxury boutique aesthetic.** The buyer paid for a high-end experience. |
| **Forced Native App Download (iOS/Android App)** | "Push notifications & app store presence" | Kills instant Instagram DM sharing. Nobody downloads a 50MB app just to view a single holiday card. | **100% WebGL Web App.** Runs directly in browser or inside Instagram/WhatsApp in-app webviews. |
| **Forced Audio Autoplay on Initial Page Load** | "Instant festive mood" | Modern mobile browsers actively block audio without preceding user gestures; leads to console errors and broken audio states. | **Initialize and trigger audio seamlessly on the unlock passcode tap.** Satisfies browser policy naturally. |
| **Heavy Multi-Page Navigation / Bloated UI** | "More content sections" | Distracts from the dramatic ritual: Unlock → Light Diya → Read Custom Wish. | **Single-Screen Immersive Canvas:** Everything unfolds smoothly through camera transitions and layered UI overlays. |

---

## Feature Dependencies

```
[Passcode / Token Unlock]
      │
      ├──unlocks──> [AudioContext & Festive Music Playback]
      │
      └──transitions-to──> [3D Diya Scene Rendering]
                                 │
                                 ├──requires──> [Touch/Gesture Interaction]
                                 │                    │
                                 │                    └──triggers──> [Wick Ignition Event]
                                 │                                         │
                                 │                                         ├──activates──> [Organic GLSL Flame Shader]
                                 │                                         ├──activates──> [Warm Dynamic Point Light]
                                 │                                         ├──triggers───> [Sparkler Particle FX & Sound]
                                 │                                         ├──triggers───> [Haptic Vibration]
                                 │                                         │
                                 │                                         └──reveals────> [Personalized Greeting Typography]
                                 │                                                               │
                                 │                                                               ├──enables──> [Interactive Tap-to-Sparkle]
                                 │                                                               ├──enables──> [WhatsApp Response Loop]
                                 │                                                               └──enables──> [Discreet Viral Footer CTA]
```

### Dependency Notes

- **[Passcode Unlock] unlocks [AudioContext]:** Browser security prevents audio from playing until user interaction. Entering or submitting the passcode provides the mandatory user gesture to activate audio playback seamlessly.
- **[Wick Ignition Event] activates [Dynamic Light & Flame]:** The flame shader and expanding point light depend on the ignition event trigger to animate from unlit to a radiant golden bloom.
- **[Wick Ignition Event] reveals [Personalized Greeting Typography]:** The emotional payoff requires the diya to be lit *first*. The message smoothly transitions in with glowing typography only after the diya ignites.
- **[Greeting Reveal] enables [Interactive Tap-to-Sparkle & WhatsApp Reaction]:** Secondary celebratory interactions and response buttons unlock once the primary greeting experience is achieved.

---

## MVP Definition

### Launch With (v1 - Core Delight & Commercial Viability)

The minimum viable experience required to sell custom wishes on Instagram and delight recipients:

- [x] **Atmospheric Passcode Unlock Portal:** Elegant festive landing screen accepting 4-character secret passcode.
- [x] **Interactive 3D Diya Scene:** Realistic terracotta diya with cotton wick rendered in Three.js at 60fps on mobile.
- [x] **Touch-to-Light Interaction:** Intuitive swipe or tap to light the diya wick with instant visual feedback.
- [x] **Dynamic Flame Shader & Point Light:** Warm flickering flame with glowing radial illumination casting onto the scene.
- [x] **Sparkler Particle Burst:** Golden celebratory sparks erupting upon successful diya lighting.
- [x] **Ambient Festive Soundtrack & SFX:** High-quality sitar/flute melody and flame ignition sound effects with floating mute toggle.
- [x] **Personalized Greeting Reveal:** Smooth animation revealing Recipient Name, Sender Name, and custom festive wish message.
- [x] **Creator Generator / Data Config:** Simple, fast system for the seller to create passcodes and customized greetings, outputting ready-to-send Instagram/WhatsApp copy.
- [x] **Mobile-Optimized Layout:** Flawless rendering inside Instagram/WhatsApp in-app browsers on iOS and Android.

### Add After Validation (v1.x - Enhanced Delight & Virality)

Features to add once initial sales validate buyer interest:

- [ ] **Interactive Tap-to-Sparkle Playground:** Tapping anywhere on the lit scene creates cascading festive spark showers.
- [ ] **One-Tap WhatsApp "Send Thank You" Reaction Button:** Recipient can send an instant pre-filled thank-you message back to sender.
- [ ] **Sacred Rangoli Base:** Detailed illuminated floor pattern glowing around the diya base.
- [ ] **Floating Sky Lanterns:** Ambient background lanterns drifting gently into the night sky.
- [ ] **Mobile Device Tilt / Gyroscope Parallax:** Subtle 3D scene tilt responsive to phone movement.
- [ ] **Tactile Mobile Haptics:** Micro-vibration pulses on ignition for supported mobile browsers.

### Future Consideration (v2+ - Scale & Product Expansion)

Features to consider if scaling into an automated greeting platform:

- [ ] **Self-Service Buyer Customization Portal:** Automated web portal where buyers can enter their wish and pay via Stripe/Razorpay without creator manual intervention.
- [ ] **Multiple Diya / Festive Themes:** Options to select Brass Diya, Silver Pooja Thali, or Grand Royal Palace Courtyard.
- [ ] **Multi-Festive Expansion:** Adapting the engine for New Year (champagne/countdown), Eid (crescent moon/lanterns), and Christmas (snow globe/tree).

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Target Phase |
|---------|------------|---------------------|----------|--------------|
| Passcode Unlock Screen | HIGH | LOW | **P1** | Phase 1 (Foundation) |
| Three.js 3D Diya Model & Scene | HIGH | MEDIUM | **P1** | Phase 2 (3D Core) |
| Touch / Swipe Lighting Interaction | HIGH | MEDIUM | **P1** | Phase 2 (3D Core) |
| Dynamic Flame & Point Light | HIGH | MEDIUM | **P1** | Phase 2 (3D Core) |
| Festive Instrumental Music & SFX | HIGH | LOW | **P1** | Phase 3 (Audio & FX) |
| Sparkler Particle FX | HIGH | MEDIUM | **P1** | Phase 3 (Audio & FX) |
| Personalized Greeting Reveal | HIGH | LOW | **P1** | Phase 4 (UI & Reveal) |
| Creator Generator & Greeting Store | HIGH | LOW | **P1** | Phase 4 (UI & Generator) |
| Mobile Viewport & Performance Capping | HIGH | MEDIUM | **P1** | Phase 1 & Continuous |
| Tap-to-Burst Sparkler Interaction | MEDIUM | LOW | **P2** | Phase 5 (Polish) |
| One-Tap WhatsApp Reaction Loop | HIGH | LOW | **P2** | Phase 5 (Polish) |
| Sacred Rangoli & Floor Illumination | MEDIUM | LOW | **P2** | Phase 5 (Polish) |
| Floating Sky Lanterns Backdrop | MEDIUM | MEDIUM | **P2** | Phase 5 (Polish) |
| Gyroscope Parallax & Haptic Feedback | MEDIUM | LOW | **P3** | Phase 5 (Polish) |
| Automated Self-Service Payment Flow | LOW (for MVP) | HIGH | **P3** | Future (v2) |

---

## Competitor & Alternative Analysis

| Solution Type | Typical Experience | Strengths | Critical Weaknesses | How Our Product Wins |
|---------------|-------------------|-----------|---------------------|----------------------|
| **WhatsApp Video / GIF Forwards** | 10-second compressed video with loud music, forwarded dozens of times. | Easy to share, zero setup. | Impersonal, spammy, ignored immediately; recipient feels zero individual connection. | **Interactive & Exclusive:** The recipient enters a secret passcode and physically lights their own diya, making it deeply personal. |
| **Traditional E-Cards (e.g. 123Greetings, Paperless Post)** | Flat 2D vector graphic, flippable envelope, ad-heavy page. | Established format, easy to email. | Feels dated, corporatized, covered in banner ads; no real-time tactile 3D immersion. | **Immersive 3D WebGL:** Cinematic dark festive atmosphere, realistic lighting, and zero ads or corporate branding. |
| **Instagram AR Filters** | Face filter or camera-space 3D diya overlay. | Native to Instagram app, fun selfie mechanics. | Cannot be customized with intimate secret messages; requires specific app version; difficult to monetize directly as a gift package. | **Frictionless Web App:** Custom secret passcode, long-form emotional greeting, works on any browser without needing Instagram installed. |
| **Heavy 3D Web Demos (Awwwards style)** | Gorgeous 50MB Three.js/WebGL showcases. | Visually stunning on high-end M3 Macs. | Fails completely on mid-range phones; crashes Instagram in-app browser; 15-second loading bar. | **Hyper-Optimized Micro-App (<3MB):** Instant loading (<1.5s), 60fps on mobile smartphones, designed specifically for in-app browsers. |

---

## Key Cultural & Emotional Insights

1. **The Symbolism of "Tamasoma Jyotirgamaya" (From Darkness to Light):**  
   Diwali’s core cultural power lies in igniting light amidst complete darkness. The greeting should begin in a moody, dim midnight scene with only faint celestial embers. When the user lights the diya, the explosion of warm golden light, gentle sitar melodies, and floating sparks mimics the profound psychological uplift of Diwali night.
2. **The "Secret Code" Gift Ritual:**  
   Receiving a link accompanied by a secret passcode creates an immediate sense of exclusivity and anticipation. It transforms a standard URL into an unopened digital gift box.
3. **Closing the Loop with Gratitude:**  
   In Indian festive culture, receiving a heartfelt wish requires acknowledging it with warmth. Providing a one-tap WhatsApp reaction button ("I loved the diya! Thank you so much 🙏✨") removes friction for the recipient to reciprocate immediately.

---

## Sources & Industry References

- [Three.js Official Documentation & WebGL Particle Shaders](https://threejs.org/)
- [Google Web Vitals & WebGL Mobile Optimization Guidelines](https://web.dev/)
- [W3C Web Audio API Autoplay Policy Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [Viral Micro-Web Apps & WhatsApp Share Mechanics Analysis](https://api.whatsapp.com/send)
- [Digital Social Gifting & Interactive Card Benchmarks (Paperless Post, Jacquie Lawson, Awwwards Holiday Experiences)]()
