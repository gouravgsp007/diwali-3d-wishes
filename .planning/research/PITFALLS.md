# Pitfalls Research: Mobile WebGL & Instagram 3D Greetings

**Domain:** Mobile WebGL 3D Interactive Greeting Web Application sold via Instagram (Three.js, Web Audio API, iOS WKWebView / Android WebView, Touch Ergonomics)  
**Researched:** 2026-11-03  
**Confidence:** HIGH  

---

## Critical Pitfalls

### Pitfall 1: iOS Hardware Silent Switch Silencing Web Audio (The Mute Switch Trap)

**What goes wrong:**  
When an iOS recipient opens their custom Diwali greeting link from an Instagram DM, enters their passcode, and taps to start, the ambient Indian flute/sitar music and diya lighting sound effects are completely silent—even though their media volume slider is at 100%. Over 80% of iPhone users keep their hardware ring/silent switch on orange (silent mode). The recipient assumes the greeting has no sound or is broken, destroying the emotional atmosphere of the personalized wish.

**Why it happens:**  
iOS Safari and WKWebView (Instagram's in-app browser) route Web Audio API (`AudioContext`) streams through the system's "Ambient / Ringer" audio session category. In this category, the OS hardware mute switch completely silences the audio. In contrast, standard HTML5 `<audio>` elements are categorized under "Media Playback", which bypasses the silent switch if media volume is up. A developer testing exclusively on desktop Chrome, Android, or an iPhone with the silent switch set to loud will never experience this issue.

**How to avoid:**  
1. For continuous ambient background music (sitar/flute), use an HTML5 `<audio>` element (or configure Howler.js with `{ html5: true }`), which natively routes through the iOS Media Playback category and ignores the silent switch.
2. For Web Audio API sound effects (match strike, diya crackle, sparkler burst), employ the proven "silent HTML5 audio unlock" trick: on the recipient's first tap (passcode submission or "Unlock Greeting"), play a tiny, looping 1-sample silent HTML5 audio WAV (`data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAAAAAAAA==`). This forces iOS `AVAudioSession` to switch the entire webview's audio routing to the Media Playback channel, allowing Web Audio SFX to play through silent mode.
3. Include an explicit, animated audio visualizer or mute/unmute button in the UI, accompanied by a subtle hint ("Tap for festive music 🎵") if audio fails to initialize.

**Warning signs:**  
- Sound works on desktop and Android but is dead silent on an iPhone when the side switch shows orange.
- Console logs show `AudioContext` is in `running` state with gain set to 1.0, yet zero audible output occurs.

**Phase to address:**  
Phase 1 (Audio Architecture & Core Interaction)

---

### Pitfall 2: Instagram In-App Browser (IAB) Autoplay Quarantine & Context Suspension

**What goes wrong:**  
The application attempts to play the festive instrumental track immediately upon page load or immediately upon reading a valid passcode from the URL parameters (`?code=...`). The browser throws `DOMException: play() failed because the user didn't interact with the document first`, or the `AudioContext` remains frozen in `state === 'suspended'`. The recipient lands in an awkward, silent visual scene.

**Why it happens:**  
Instagram operates inside an embedded `WKWebView` (iOS) or Android WebView container. Meta applies strict autoplay sandbox policies. Unlike standalone Safari, which may grant autoplay privileges based on user engagement history with a domain, an embedded webview treats every launch as an isolated, untrusted session. No audio can be started or resumed without a synchronous user gesture (pointerdown/click/touchend) originating inside that specific webview DOM tree.

**How to avoid:**  
- Treat audio activation as an explicit, user-initiated gate. Design the initial landing portal so the user MUST take an explicit action:
  - Entering a passcode and tapping "Unlock Greeting".
  - If auto-unlocked via URL, presenting an elegant "Open Festive Wish 🪔" or "Tap to Light Diya" CTA.
- Inside that direct tap/click handler:
  ```javascript
  // Synchronous unlock in touch event
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  bgMusicElement.play().catch(err => console.warn('Autoplay blocked:', err));
  ```
- Never attempt to trigger audio from a deferred `setTimeout`, a resolved async network fetch, or inside a WebGL render loop tick without prior user interaction.

**Warning signs:**  
- Console error: `The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.`
- Audio only kicks in randomly on the second or third time a user touches the screen.

**Phase to address:**  
Phase 1 (Passcode Unlock Portal & Audio Foundation)

---

### Pitfall 3: Retina Fill-Rate Choke: Unconstrained `devicePixelRatio` on Mobile GPUs

**What goes wrong:**  
On flagship and mid-range mobile phones (iPhone 13–16 Pro, Samsung Galaxy S23/S24, Google Pixel), the web app causes the phone to heat up within 45 seconds, the battery percentage visibly drops, and the frame rate drops precipitously from 60fps to 15–20fps with stuttering animations.

**Why it happens:**  
Modern mobile devices feature ultra-high pixel density displays with a `window.devicePixelRatio` of 3.0 or 4.0. Setting `renderer.setPixelRatio(window.devicePixelRatio)` commands Three.js to render a canvas with a resolution of 1170 × 2532 × 3 = ~26.7 million fragment calculations per frame at 60fps! Combined with glowing diya flame shaders, translucent particle blends, and lighting calculations, mobile tile-based deferred renderers (TBDR) suffer catastrophic fragment fill-rate saturation and aggressively throttle the GPU.

**How to avoid:**  
- Strictly cap the pixel ratio on mobile devices:
  ```javascript
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75); // Never exceed 1.75 or 2.0 max
  renderer.setPixelRatio(dpr);
  ```
- On devices identified as mobile or low-power, cap `dpr` to `1.5`. The visual difference on a 6-inch phone screen between 1.5x and 3.0x is imperceptible to the human eye, but saving 4x to 6x fragment fill operations keeps the device cool at a steady 60fps.
- Use `precision mediump float;` instead of `highp float;` in all custom GLSL shaders (flame, sparkles).

**Warning signs:**  
- Frame rate is 120fps on desktop M-series Macs or gaming PCs, but stutters immediately on an iPhone 14 Pro or budget Xiaomi/Samsung phone.
- Device becomes physically warm to the touch within 60 seconds.

**Phase to address:**  
Phase 2 (3D Scene Engine & Rendering Pipeline)

---

### Pitfall 4: Full-Screen Post-Processing Bloom on Mobile (UnrealBloomPass Framebuffer Meltdown)

**What goes wrong:**  
Developers wanting the diya flame and sparklers to glow majestically add Three.js `UnrealBloomPass` or `EffectComposer`. On mobile devices, the greeting immediately stutters, drops to 18fps, or crashes with a black screen due to WebGL out-of-memory (OOM) errors.

**Why it happens:**  
`UnrealBloomPass` creates 5+ downsampled/upsampled intermediate WebGL render targets and executes multiple Gaussian blur passes every frame across the entire screen buffer. Mobile GPUs have limited memory bandwidth and small on-chip tile caches. Constantly blitting full-screen buffers in and out of VRAM kills mobile performance.

**How to avoid:**  
- Avoid full-screen post-processing bloom passes entirely for mobile web greeting experiences.
- Implement festive glow using **Additive Blended Sprites (`THREE.AdditiveBlending`)** and billboard planes:
  ```javascript
  const glowMaterial = new THREE.SpriteMaterial({
    map: radialGlowTexture,
    color: 0xffaa33,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const glowSprite = new THREE.Sprite(glowMaterial);
  glowSprite.scale.set(1.5, 1.5, 1.0);
  flameMesh.add(glowSprite);
  ```
- Additive blending calculates color saturation in the existing forward render pass with native hardware blending (`glBlendFunc(GL_SRC_ALPHA, GL_ONE)`). It produces a warm, radiant festive halo with **zero extra render passes, zero intermediate framebuffers, and 60fps performance on budget mobile hardware**.

**Warning signs:**  
- DevTools timeline shows high GPU rasterization time and multiple render passes per frame.
- Budget Android phones crash or drop frames drastically whenever the flame lights up.

**Phase to address:**  
Phase 2 (Flame Lighting & Visual Effects Pipeline)

---

### Pitfall 5: First-Ignition Shader Compilation Freeze (The Stutter on Strike)

**What goes wrong:**  
The recipient enters the passcode, watches the unlit diya in anticipation, and drags their finger to light the wick. Right at the magical crescendo—when the sparkler should ignite and the flame should burst to life—the screen completely freezes for 500ms to 1.5 seconds. The audio stutters, the swipe jerks, and the emotional climax is ruined.

**Why it happens:**  
WebGL/Three.js compiles GLSL shaders lazily upon the very first draw call of a material/mesh variant. When the user ignites the diya, new lights turn on (e.g. a dynamic `PointLight` for flame illumination), new particle materials are rendered, and the flame shader is drawn for the first time. The mobile GPU driver halts the main UI thread to compile and link these new shader programs synchronously.

**How to avoid:**  
- Pre-warm and compile all materials, lights, and particle systems during the initial loading phase or while the user is typing their passcode:
  ```javascript
  // Ensure all lights and particle systems are part of the scene graph (even if scale=0 or opacity=0)
  renderer.compile(scene, camera);
  // Warm all textures into GPU memory
  renderer.initTexture(diyaTexture);
  renderer.initTexture(glowTexture);
  ```
- Keep the diya flame light enabled in the scene at `intensity: 0.0001` before ignition, rather than dynamically adding a new `PointLight` on ignition. Adding or removing a light changes the Three.js shader program signature, triggering a costly re-compilation on the first strike.

**Warning signs:**  
- A noticeable hitch or frame drop recorded in Chrome DevTools Performance Profiler specifically on the exact frame the user ignites the diya.
- Console messages indicating shader program compilation during active user interaction.

**Phase to address:**  
Phase 2 (Diya Lighting & Particle Physics)

---

### Pitfall 6: Instagram Viewport Jitter & Touch Gesture Collisions (Pull-to-Refresh & `100dvh`)

**What goes wrong:**  
As the recipient tries to touch and swipe to ignite the diya or orbit the camera, the Instagram in-app browser hijacks the gesture:
1. Swiping downward triggers the browser's native pull-to-refresh spinner, resetting the greeting.
2. Swiping near the screen edge triggers the swipe-to-back/dismiss gesture, throwing the user back into Instagram DMs.
3. As the user touches the screen, Instagram's dynamic header and bottom toolbar show and hide, causing `100dvh` to expand and contract erratically. The 3D canvas jumps violently, and the camera aspect ratio distorts.

**Why it happens:**  
`WKWebView` and Android WebView bind default touch gestures to native browser navigation unless explicitly suppressed in CSS and event listeners. Furthermore, `100dvh` resizes every time the toolbar transitions, firing `window.resize` events that recalculate camera projection matrices.

**How to avoid:**  
1. Prevent rubber-banding and pull-to-refresh on the root container:
   ```css
   html, body {
     width: 100%;
     height: 100%;
     overflow: hidden;
     overscroll-behavior: none;
     touch-action: none; /* Prevents browser scroll and pinch-zoom on canvas */
     user-select: none;
     -webkit-user-select: none;
   }
   ```
2. Avoid `100dvh` for the primary 3D viewport canvas. Use `100svh` (small viewport height) or capture `window.innerHeight` once on initial load to establish a fixed, rock-solid coordinate frame:
   ```css
   .canvas-container {
     position: fixed;
     top: 0;
     left: 0;
     width: 100vw;
     height: 100svh;
   }
   ```
3. In JavaScript touch listeners on the canvas, add `{ passive: false }` and invoke `event.preventDefault()` for touchstart and touchmove when interacting with the 3D diya.
4. Position all interactive DOM UI elements (passcode box, audio toggle, greeting reveal card) within safe boundaries using `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);`.

**Warning signs:**  
- Swiping the 3D scene on a phone causes the entire web page to bounce or reload.
- Canvas height abruptly jumps by 60px when Instagram's top/bottom bars slide into view.

**Phase to address:**  
Phase 1 (Responsive Shell & Viewport Management)

---

### Pitfall 7: WebGL Context Loss on Backgrounding & App Switching

**What goes wrong:**  
The recipient opens the greeting in Instagram, receives an incoming WhatsApp message, switches apps for 15 seconds to reply, and returns to Instagram. The greeting screen is now a lifeless black rectangle, or the page freezes with an uncaught `WebGL: CONTEXT_LOST_WEBGL` error in the console.

**Why it happens:**  
Mobile operating systems (especially iOS) aggressively revoke WebGL contexts from backgrounded webviews to free up unified VRAM for active foreground applications. If the application does not listen for `webglcontextlost` and `webglcontextrestored`, the Three.js animation loop continues attempting to issue draw calls against a dead context, crashing the render pipeline permanently.

**How to avoid:**  
- Attach event handlers to the WebGL canvas:
  ```javascript
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault(); // Informs the browser that the app wants to restore
    cancelAnimationFrame(animationFrameId);
    showRecoveryOverlay(); // Display friendly "Diwali Wishes Paused" UI
  }, false);

  canvas.addEventListener('webglcontextrestored', () => {
    reinitializeScene(); // Reload textures, re-compile shaders, resume render loop
    hideRecoveryOverlay();
  }, false);
  ```
- Pause the animation loop whenever `document.visibilityState === 'hidden'` and resume on `visible` to reduce background GPU activity before the OS decides to kill the context.

**Warning signs:**  
- Locking the phone or switching to another app while the diya is burning causes the canvas to stay black upon returning.
- Console errors repeating hundreds of times per second: `WebGL: INVALID_OPERATION`.

**Phase to address:**  
Phase 1 / Phase 2 (WebGL Lifecycle & State Management)

---

### Pitfall 8: Instagram Link Shim & URL Parameter Stripping / Truncation

**What goes wrong:**  
The seller generates a custom link for the buyer to send their loved one (e.g. `diwaliwishes.app/?code=A8K9`). When clicked in an Instagram DM or story link sticker, the recipient lands on the page, but the app says "Passcode Required" or "Wish Not Found".

**Why it happens:**  
Instagram routes outbound links through Meta's link shim (`l.instagram.com/?u=...`) and appends aggressive tracking parameters (`?fbclid=...`, `?igsh=...`, `?utm_source=...`). If the web app uses naive string splitting or expects hash fragments (which are never transmitted through HTTP redirects and are often stripped by in-app browser handlers), the custom wish identifier is lost or corrupted.

**How to avoid:**  
1. Never rely solely on URL hash fragments (`#code=...`) for the passcodes. Use standard query parameters: `?w=WISH_ID` or `?c=PASSCODE`.
2. Parse query parameters using the standard `URLSearchParams` API:
   ```javascript
   const params = new URLSearchParams(window.location.search);
   const passcode = params.get('c') || params.get('code') || '';
   ```
3. Always provide a dual-entry flow: if the query parameter is missing, stripped, or invalid, gracefully present the atmospheric Passcode Input Form so the recipient can simply type the 4–6 digit passcode provided in the DM message.

**Warning signs:**  
- Links work when pasted into Safari or Chrome, but fail when clicked directly within Instagram DMs.
- Naive regex extracting query params breaks when `&fbclid=...` or `&igsh=...` is appended.

**Phase to address:**  
Phase 1 (Passcode Portal & URL Routing)

---

### Pitfall 9: Cellular Asset Bloat (>10MB) Killing D2C Engagement & Conversion

**What goes wrong:**  
The buyer sends a gift link to their family in India. The recipient taps the link on a 4G/3G mobile data connection, but the page takes 8–15 seconds to load because it downloads a 12MB uncompressed 3D model, 4K textures, and a 8MB uncompressed WAV audio track. The recipient loses patience and exits before seeing anything.

**Why it happens:**  
3D assets exported straight out of 3D software (Blender/Maya) contain dense mesh topologies, duplicate vertices, uncompressed 2048x2048 PNG textures, and embedded uncompressed audio.

**How to avoid:**  
- Strict total transfer budget: **Under 2.5 MB total** across all assets (HTML, JS, CSS, 3D model, textures, audio).
- Diya 3D Model: Low-to-medium poly (< 10,000 polygons, < 100 KB GLB file) with Draco/Meshopt compression or procedural geometry.
- Textures: 1024x1024 max, encoded in modern WebP or KTX2 formats (under 150 KB each).
- Audio: High-efficiency AAC or MP3 compressed at 64–96 kbps. Ambient sitar/flute loop under 800 KB; SFX under 60 KB.
- Instant Splash Screen: Render a lightweight festive SVG/CSS diya loader in the first 300ms while Three.js assets stream asynchronously in the background.

**Warning signs:**  
- Network tab in Chrome DevTools shows transfer size > 5 MB.
- Lighthouse mobile performance score drops below 80.
- Load time on "Fast 3G" throttling exceeds 3.5 seconds.

**Phase to address:**  
Phase 1 / Phase 2 (Asset Optimization & Performance Budget)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|:---|:---|:---|:---|
| **Using `window.devicePixelRatio` directly without clamp** | Crisp rendering on high-end monitors during local development | Mobile devices overheat, throttle to 15fps, and drain battery within 1 minute | **Never acceptable.** Always clamp to `Math.min(devicePixelRatio, 1.75)`. |
| **Using raw uncompressed WAV audio files** | Zero compression setup; instant local playback | 5MB–10MB download per audio file; unacceptable mobile load latency | **Never acceptable.** Encode all audio to 64–96kbps MP3/AAC. |
| **Full-screen `UnrealBloomPass` for flame glow** | Fast 3-line setup in Three.js | Severe mobile GPU fill-rate drop and memory crashes | Only acceptable on desktop-only builds; **never** on mobile web. Use additive sprites instead. |
| **Storing personalized wishes in client-side hardcoded JS objects** | No database setup required; works with static hosting (Vercel/Netlify) | Inspecting source reveals other people's secret wishes; bundle size grows with every customer | Acceptable **only** for proof-of-concept with <10 demo wishes. Use a lightweight serverless key-value store (e.g. Supabase, Upstash Redis, or encrypted URL payloads) for launch. |
| **Encoding entire wish payload in URL query parameter** | Completely serverless, zero database maintenance | URL becomes 200+ characters long, looks like spam/phishing in Instagram DMs, easily truncated | Acceptable if compressed with LZ-String/Base64 and paired with clean link shortener; otherwise use lightweight short passcode lookups. |
| **Spawning individual Mesh objects for sparkler particles** | Trivial to code with `new THREE.Mesh()` | Hundreds of draw calls choke mobile CPU/GPU render loop | **Never acceptable.** Use `THREE.Points` or `THREE.InstancedMesh` with buffer attributes. |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|:---|:---|:---|
| **Instagram In-App Browser (WKWebView)** | Assuming Safari standard viewport behavior (`100vh` or `100dvh`) | Use `100svh` or fixed `window.innerHeight` locked on initial load; wrap canvas in `position: fixed` and set `overscroll-behavior: none` to prevent pull-to-refresh collapse. |
| **iOS Silent Switch & Web Audio** | Relying on `AudioContext` alone for background music | iOS hardware mute switch silences Web Audio. Play ambient background music via HTML5 `<audio>` and unlock Web Audio SFX with a 1-sample silent HTML5 audio loop. |
| **WhatsApp / Instagram Link Previews** | Missing OpenGraph tags or using non-HTTPS image links | Provide explicit `<meta property="og:title">`, `<meta property="og:description">`, and `<meta property="og:image">` pointing to a warm, festive 1200x630px preview image of the glowing 3D diya with sender/recipient branding. |
| **Three.js OrbitControls on Mobile** | Allowing orbit controls to consume all touch events, breaking UI button clicks | Set `controls.enableDamping = true;` and restrict polar angles (`maxPolarAngle = Math.PI / 2 + 0.1`) so user cannot look awkwardly underneath the diya table; isolate canvas pointer events from HTML UI overlays. |
| **URL Query Parameters & Link Shims** | Using regex to extract passcode parameters from `window.location.href` | Use `new URLSearchParams(window.location.search)` which cleanly handles trailing slashes, Instagram `fbclid`, and `igsh` tracking query parameters. |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|:---|:---|:---|:---|
| **Unclamped Device Pixel Ratio** | Stutter, phone overheating, battery drain | Clamp: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))` | Immediate on any iPhone 12–16 or flagship Android with 3x retina screen. |
| **CPU Particle Updating Loop** | Javascript execution time spikes to 20ms+ per frame; erratic 40fps | Update particle positions on the GPU via vertex shader attributes or `InstancedMesh` matrix buffers; never loop 1,000 meshes on CPU. | Breaks with > 300 active sparkler particles. |
| **Transparent Particle Sorting & Overdraw** | Severe frame drop when looking directly down the diya flame | Set `depthWrite: false`, `blending: THREE.AdditiveBlending`, and keep particle count controlled (< 500 sparks). | Breaks when large overlapping transparent sprites occupy > 60% of screen area. |
| **Un-Disposed Three.js Assets** | Memory steadily rises on each restart/reset until browser reloads tab | Manually call `geometry.dispose()`, `material.dispose()`, and `texture.dispose()` when cleaning or switching scenes. | Breaks after 3–5 greeting replays or context resets on devices with < 3GB RAM. |
| **Continuous Unthrottled Render Loop** | Device draws 60fps even when user is stationary or reading the revealed message | Throttle or pause render loop when scene is static, or reduce frame rate to 30fps after flame settles if battery is low. | Ongoing battery drain across all mobile devices. |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|:---|:---|:---|
| **Exposing All Customer Wishes in a Single Client-Side JSON Bundle** | Any tech-savvy recipient or competitor can inspect `wishes.json` in DevTools network tab and view hundreds of private romantic or family greetings and buyer names. | Store wishes in a lightweight backend/database and only return the specific wish matching the authenticated 6-character passcode, OR encrypt client-side payloads with the passcode as the AES decryption key. |
| **XSS via Unsanitized Personalized Greeting Text** | Malicious buyer enters `<script>` or `<img>` payload in "Recipient Name" or "Message", executing arbitrary code in the recipient's browser. | Sanitize all custom user text using `textContent` instead of `innerHTML`, or run text through DOMPurify before rendering into the festive reveal card. |
| **Predictable / Sequential Passcodes (e.g. 0001, 0002)** | Anyone can guess or scrape greetings by iterating integers. | Generate cryptographically secure, friendly alphanumeric passcodes (e.g. `DIY-7X9K`, `SHUBH-42M`) with at least 24 bits of entropy. |
| **Exposing Admin / Creator Passcode Generation API** | Unauthenticated visitors can mint free greetings without paying on Instagram. | Protect the creator link generation portal with a master secret key / authentication token; never expose creation endpoints publicly without authorization. |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|:---|:---|:---|
| **Eerie Silence on Initial Page Load** | Recipient doesn't realize there is festive audio and misses the emotional sitar/flute music. | Display an atmospheric, pulsing "Tap to Light & Listen 🪔" prompt that initiates audio immediately upon first interaction. |
| **Ambiguous Lighting Interaction** | Recipient does not know they need to drag/tap the match or wick to ignite the diya; stares at a static screen. | Provide an intuitive visual cue: a sparkling golden aura around the wick with a floating animated prompt: *"Swipe or tap to light the sacred diya"* which fades away once ignited. |
| **Greeting Text Clipping on Small Screens** | On iPhone SE or small Android screens, personalized greeting card overflows or covers the 3D diya awkwardly. | Responsive card overlay with CSS flexbox/grid, clamped typography (`font-size: clamp(1rem, 4vw, 1.5rem)`), and smooth scrollable text container if the buyer wrote a heartfelt, long message. |
| **Accidental Webview Exit on Swipe** | Recipient accidentally swipes from the left edge while orbiting the diya, triggering Instagram's swipe-back gesture and losing their place. | Keep 3D interactive orbit radius bounded and leave a 24px non-interactive margin on horizontal viewport edges. |
| **Jarring Instant Snap to Greeting Text** | The diya ignites and text abruptly flashes onto the screen without ceremony. | Stage the emotional reveal in cinematic beats: (1) Match strikes and sparks fly, (2) Diya flame expands with warm amber light, (3) Celebration particles float upward, (4) Sitar melody swells, (5) Elegant golden typography softly fades in after 1.5 seconds. |

---

## "Looks Done But Isn't" Checklist

- [ ] **iOS Silent Switch Test:** Verified that the ambient background music plays audibly on an actual iPhone with the physical hardware mute switch toggled to silent/orange.
- [ ] **Instagram In-App Browser Test:** Verified full functionality by sending the link to an actual Instagram account via DM and opening it directly inside the Instagram iOS and Android in-app browsers.
- [ ] **Pull-to-Refresh Suppression:** Verified that dragging downwards on the canvas inside mobile Safari and Instagram Webview does NOT trigger the page refresh spinner.
- [ ] **Shader Warm-Up Check:** Verified that there is zero frame stutter or micro-freeze at the exact moment the match strikes and the diya flame ignites on a mobile device.
- [ ] **Device Pixel Ratio Clamping:** Confirmed that `renderer.getPixelRatio()` returns `<= 1.75` on 3x retina devices, keeping thermal load minimal.
- [ ] **Query Parameter Robustness:** Verified that the link auto-populates the passcode even when Instagram appends `?igsh=...` or `?fbclid=...` tracking garbage.
- [ ] **Manual Passcode Fallback:** Confirmed that if the query parameter is stripped or missing, the recipient can manually type the passcode on the landing screen and unlock their wish.
- [ ] **Long Message Layout Test:** Verified that a 300-word custom message does not break layout or clip outside the viewport on an iPhone SE (375px width).
- [ ] **WebGL Context Recovery Test:** Verified that minimizing the mobile browser for 30 seconds and reopening it either smoothly resumes the scene or displays a clean "Tap to resume" button without a black screen or console crash.
- [ ] **Total Payload Under 2.5 MB:** Verified in network tab that total uncompressed transfer of all assets is under 2.5 MB.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|:---|:---|:---|
| **Audio Silenced by iOS Mute Switch** | MEDIUM | Switch ambient background music architecture to an HTML5 `<audio>` element; add silent audio loop hack to unlock Web Audio SFX on the initial unlock tap. |
| **Mobile GPU Overheating / Stutter** | LOW | Clamp `devicePixelRatio` to `Math.min(window.devicePixelRatio, 1.75)` in renderer initialization; replace any full-screen post-processing bloom passes with additive sprites. |
| **Shader Compilation Stutter on Ignition** | LOW | Add `renderer.compile(scene, camera)` in loader callback; initialize textures with `renderer.initTexture()`; keep the flame light in scene graph with zero intensity before strike. |
| **Instagram Pull-to-Refresh Hijacking Canvas** | LOW | Add `overscroll-behavior: none` and `touch-action: none` to CSS; set `{ passive: false }` on canvas touch listeners with `e.preventDefault()`. |
| **Passcode Query String Mismatch from Link Shim** | LOW | Replace naive query regex with `new URLSearchParams(window.location.search)`; ensure fallback input field is always accessible on the landing view. |
| **Customer Data Leak via Client-Side Bundle** | HIGH | Migrate wish data off static client bundle into a lightweight encrypted payload or serverless key-value lookup (Supabase / Upstash / Cloudflare Worker). |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|:---|:---|:---|
| **Instagram Webview Autoplay Quarantine & iOS Silent Switch** | **Phase 1: Foundation & Audio Shell** | Test audio playback on an iPhone in Instagram DM with silent switch set to orange; verify audio starts cleanly on passcode submit tap. |
| **Viewport Jitter (`100svh`), Pull-to-Refresh & Touch Conflicts** | **Phase 1: Foundation & Audio Shell** | Swipe aggressively across the canvas in Instagram IAB; verify zero pull-to-refresh reload and zero viewport height jumping. |
| **Passcode Routing & Instagram Link Shim Truncation** | **Phase 1: Foundation & Audio Shell** | Send test wish URL with query params through an Instagram DM and verify auto-unlock and manual fallback entry. |
| **Device Pixel Ratio Overheating & GPU Fill-rate Saturation** | **Phase 2: 3D Diya Scene & Shaders** | Run 5-minute continuous test on iPhone 13–15; verify device remains cool and frame rate maintains steady 60fps with DPR <= 1.75. |
| **First-Ignition Shader Compilation Freeze** | **Phase 2: 3D Diya Scene & Shaders** | Profile frame times during ignition gesture using Chrome DevTools Performance tab; verify no frame drop > 16ms during flame spawn. |
| **Full-Screen Bloom Performance Destruction** | **Phase 2: 3D Diya Scene & Shaders** | Implement flame glow using `THREE.AdditiveBlending` sprites instead of `UnrealBloomPass`; confirm single forward render pass. |
| **Cellular Asset Bloat (>2.5 MB Payload)** | **Phase 2: 3D Diya Scene & Shaders** | Audit bundle size and network transfer; ensure GLB < 100 KB, audio < 1 MB, textures < 300 KB, total < 2.5 MB. |
| **Personalized Greeting Reveal Overflow & Typography Jitter** | **Phase 3: Greeting Reveal & Polish** | Test long recipient messages and diverse name lengths on 320px–414px mobile viewports; verify smooth cinematic fade-in timing. |
| **Creator Flow Passcode Collision & Data Security** | **Phase 4: Creator Tool & Delivery Flow** | Verify cryptographically random passcodes and ensure wish messages are not scraped or exposed in plaintext bundles. |

---

## Sources

- **Apple WebKit Audio Guidelines:** WebKit Autoplay Policies & AudioContext lifecycle in iOS WKWebView (`webkit.org`)
- **Howler.js iOS Audio Session Workaround:** HTML5 Audio routing vs Web Audio API silent hardware switch bypass (`github.com/goldfire/howler.js`)
- **Three.js Mobile Optimization Standards:** `devicePixelRatio` constraints and TBDR GPU fill-rate mitigation (`threejs.org/docs`)
- **Meta / Instagram In-App Browser Specs:** WKWebView navigation, pull-to-refresh handling, and link-shim (`l.instagram.com`) query handling
- **Web.dev Mobile Touch Guidelines:** `touch-action`, `overscroll-behavior: none`, and CSS dynamic viewport units (`100svh` vs `100dvh`)
- **WebGL Context Lifecycle Specification:** `WEBGL_lose_context` and event handling best practices for mobile app switching

---
*Pitfalls research for: Diwali 3D Interactive Greeting Web Application*  
*Researched: 2026-11-03*
