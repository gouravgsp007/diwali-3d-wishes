# Phase 1: Core Architecture, State Machine & Cryptographic Codec - Context

**Gathered:** 2026-11-03  
**Status:** Ready for planning  

<domain>
## Phase Boundary

Phase 1 establishes the foundational TypeScript application structure, the typed Finite State Machine (`AppStateMachine`), the zero-backend client-side cryptographic codec (`GreetingCodec`), the mobile-first responsive viewport container (`100svh`), and the festive glassmorphic Passcode Gate UI modal. It delivers the end-to-end mechanism to unlock encrypted greetings via a 4-to-6 character secret passcode before the 3D WebGL scene is rendered.

</domain>

<decisions>
## Implementation Decisions

### Passcode Gate UI & Input Mechanics
- **D-01:** Single responsive input field with auto-capitalization, letter-spacing, and gold glowing festive border focus. Supports 4-to-6 alphanumeric characters (e.g. `PRIYA`, `DIY88`, `LOVE26`).
- **D-02:** Glassmorphic card styling (Tailwind CSS with backdrop-blur, deep nocturnal festive maroon/amber background gradient `#0d0208` to `#1f0b18`, golden Diwali motifs).
- **D-03:** Clear festive copy: "✨ Shubh Deepavali ✨" header, "Unlock Your Diwali Surprise" title, and "Enter the secret passcode sent by your loved one".

### Cryptographic Codec & URL Fragment Resolution
- **D-04:** Symmetrical AES-GCM (256-bit) encryption with PBKDF2 key derivation using the native browser `window.crypto.subtle` API — **Reversibility:** costly — payload format and crypto primitives must remain backward-compatible with links shared on Instagram and WhatsApp.
- **D-05:** Compression of JSON greeting payload `{ recipient, sender, message, templateId }` via `lz-string` before encryption to ensure compact URL tokens.
- **D-06:** Dual URL parsing strategy:
  1. Primary: URL hash fragment (`#d=<ciphertext>`), which never touches server logs and preserves 100% end-to-end recipient privacy.
  2. Query fallback: `?c=<ciphertext>` with automatic sanitization of Instagram/Meta link shim tracking tokens (`fbclid`, `igsh`).
- **D-07:** Direct visit / demo fallback: When visiting without `#d=...`, the app loads a built-in joyful demo wish unlockable with passcode `DIWALI` or `HAPPY`, alongside a button to "Create Your Own Wish".

### Passcode Validation & Rejection Feedback
- **D-08:** Decryption failure (AES-GCM authentication tag mismatch) is caught client-side, triggering a festive card shake animation (`animate-shake`) and friendly feedback: *"Passcode doesn't match this greeting. Please check your message!"*.
- **D-09:** Zero server API calls or database lookups required for validation.

### Application State Machine Contracts
- **D-10:** Strongly-typed finite state machine (`AppStateMachine`):
  `BOOT` → `LOCKED` → `UNLOCKED_INTRO` → `INTERACTIVE_UNLIT` → `IGNITING` → `LIT_CELEBRATION` → `GREETING_REVEAL`.
- **D-11:** Passcode submit button tap serves as the synchronous user gesture required to prime the Web Audio context and HTML5 media element (Audio primes in Phase 1 stub, fully wired in Phase 4).

### Mobile Viewport & Touch Containment
- **D-12:** Use `100svh` (small viewport height) with `overscroll-behavior: none` and `touch-action: manipulation` on the root container to prevent Instagram and iOS WebKit pull-to-refresh jitter and toolbar jump.

### Builder's Discretion
- User deferred explicit questioning ("leave skip this phase"). Standard high-performance, mobile-first architectural patterns from research are adopted across state handling, crypto contracts, and UI scaffolding.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Crypto Standards
- `.planning/research/ARCHITECTURE.md` § Core Architecture Pillars — FSM lifecycle, zero-backend Web Crypto AES-GCM codec, and decoupled DOM/WebGL layering.
- `.planning/research/STACK.md` § Technology Stack — Vite, TypeScript, Tailwind CSS v4, `lz-string`, and Web Crypto specs.
- `.planning/research/PITFALLS.md` § Instagram Link Shim & Viewport Jitter — Defense against Meta `l.instagram.com` link stripping and viewport bounce.
- `.planning/research/SUMMARY.md` § Phase 1 Implications — Required deliverables and quality gates.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet (greenfield project). Phase 1 establishes the root Vite + TypeScript + Tailwind CSS structure.

### Established Patterns
- Modularity: Separation of concerns between crypto codec (`src/crypto/`), state machine (`src/state/`), UI overlays (`src/ui/`), and future 3D/audio managers.

### Integration Points
- Root entry point `index.html` and `src/main.ts`.
- `AppStateMachine` event bus dispatching state change events consumed by PasscodeGate now, and by SceneManager/AudioManager in later phases.

</code_context>

<specifics>
## Specific Ideas

- Luxurious, warm festive aesthetics honoring Diwali (glowing gold, deep night skies, elegant typography).
- Zero technical friction: no logins, no app downloads, zero waiting.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed strictly within Phase 1 scope.

</deferred>

---

*Phase: 01-Core Architecture, State Machine & Cryptographic Codec*  
*Context gathered: 2026-11-03*
