# Phase 5: Festive Greeting Reveal, Typography & Celebration Polish - Context

**Gathered:** 2026-11-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the emotional climax of the experience: transitioning from `LIT_CELEBRATION` into `GREETING_REVEAL`, unfurling an opulent glassmorphic greeting card with warm golden festive typography (recipient name, personal message, sender name), launching celebratory golden confetti/sparkler showers via `canvas-confetti`, providing an interactive screen-tap sparkle effect (`VFX-05`), and completing the viral loop with a 1-tap WhatsApp reciprocation button (`WISH-03`).

</domain>

<decisions>
## Implementation Decisions

### 1. Opulent Glassmorphic Greeting Card Modal
- **D-01:** **Card Staging & Motion Transition**: Upon transitioning from `LIT_CELEBRATION` to `GREETING_REVEAL` (1.5s after flame ignition):
  - Camera tilts/pans up smoothly (`panTargetTo(new THREE.Vector3(0, 0.85, 0), 1200)`).
  - The greeting card floats in with glassmorphic backdrop (`backdrop-blur-xl bg-black/40 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/50`).
  - Smooth CSS entrance animation (`opacity-0 scale-95 translate-y-4` -> `opacity-100 scale-100 translate-y-0` with 800ms cubic-bezier transition).
- **D-02:** **Safe DOM Rendering (ASVS V5 XSS Protection)**:
  - Recipient name (`payload.recipient`), sender name (`payload.sender`), and custom wish message (`payload.message`) are injected strictly using `element.textContent = ...` (never `innerHTML`) to prevent stored XSS attacks via encrypted payload injection.
  - Fallback defaults if payload is empty: Recipient: "Dear Friend", Sender: "A Well-Wisher", Message: "Wishing you and your loved ones a joyous, prosperous, and luminous Diwali! May this festival of lights illuminate your path with happiness and success."

### 2. Festive Typography & Cultural Ornamentation
- **D-03:** **Gold Shimmer Serif Typography**:
  - Festive heading: *"Shubh Deepavali"* (or *"Happy Diwali"*) in warm shimmering gold gradient (`bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent font-serif`).
  - Traditional Indian decorative motifs: Subtle SVG lotus or diya filigree divider accentuating the card.
  - Message styling: Elegant italicized quote with warm ivory/amber text (`text-amber-100/90`).

### 3. Celebratory Particle Explosion & Interactive Tap Sparkles
- **D-04:** **Celebratory Golden Confetti**:
  - Install `canvas-confetti@^1.9.4` (isolated 2D canvas overlay, ~6 KB gzipped, zero WebGL pipeline burden).
  - Fires dual-cannon golden/amber festive confetti bursts upon greeting reveal:
    - Colors: `['#ffd700', '#ffa500', '#ff8c00', '#fff8dc', '#b8860b']`
    - High-velocity spread (angle 60 and 120, spread 70, particleCount 80 per cannon).
- **D-05:** **Interactive Tap-to-Sparkle (`VFX-05`)**:
  - While in `GREETING_REVEAL` or `LIT_CELEBRATION`, tapping or clicking on the background screen outside the card triggers an instant celebratory sparkle burst at the touch coordinate:
    - Uses `canvas-confetti({ origin: { x: clientX/width, y: clientY/height }, particleCount: 25, spread: 45, startVelocity: 15, scalar: 0.6, colors: ['#ffd700', '#ff9900', '#fff'] })`.
    - Delights recipients by letting them celebrate actively with micro-fireworks.

### 4. Viral WhatsApp Reciprocation Loop
- **D-06:** **1-Tap WhatsApp Reply Button**:
  - Prominent gold-accented button: *"Reply Happy Diwali on WhatsApp ✨"*.
  - Encodes URI message: `https://wa.me/?text=Thank%20you%20so%20much%20for%20the%20beautiful%20Diwali%20Diya%20greeting!%20Wishing%20you%20and%20your%20family%20a%20very%20Happy%20Diwali%20too!%20%F0%9F%AA%94%E2%9C%A8`.
  - Opens WhatsApp in new tab / app directly.

### 5. Architectural & Resource Cleanup
- **D-07:** **Component Encapsulation & Teardown**:
  - `GreetingModal` component manages card DOM, text injection, and WhatsApp link.
  - `CelebrationManager` manages confetti cannons and tap-to-sparkle listener.
  - Strict `dispose()` methods removing event listeners, canvas overlays, and DOM nodes.

</decisions>

<canonical_refs>
## Canonical References

- `GEMINI.md` § Technology Stack — `canvas-confetti@^1.9.4` recommendation
- `.planning/ROADMAP.md` § Phase 5: VFX-05, WISH-01, WISH-02, WISH-03
- `.planning/phases/01-core-architecture-state-machine-cryptographic-codec/01-01-SUMMARY.md` — `GreetingPayload` interface (`recipient`, `sender`, `message`)
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/crypto/types.ts`: `GreetingPayload` interface (`recipient: string; sender: string; message: string; timestamp?: number`).
- `src/ui/passcode-gate.ts`: Successfully extracts and passes `GreetingPayload` on unlock.
- `src/app/state-machine.ts`: `AppStateMachine` states `LIT_CELEBRATION` and `GREETING_REVEAL`.

</code_context>
