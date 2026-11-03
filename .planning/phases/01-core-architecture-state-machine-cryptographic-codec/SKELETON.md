# Walking Skeleton — Diwali 3D Wishes

**Phase:** 1  
**Generated:** 2026-11-03  

## Capability Proven End-to-End

A festive greeting recipient can enter a 4-to-6 character passcode on an atmospheric mobile screen, decrypt their personalized Diwali wish locally via Web Crypto AES-GCM without server infrastructure, advance the application state machine, and synchronously prime the audio engine for subsequent celebration.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Vanilla Three.js + TypeScript + Vite + Tailwind CSS v4 (`@tailwindcss/vite`) | 0 KB virtual DOM overhead, instant HMR, fast mobile loading, and direct shader/WebGL control without React bundle penalty. |
| Data layer | Zero-backend client-side cryptographic URL hash fragments (`#d=<ciphertext>`) compressed with `lz-string` and encrypted with AES-GCM 256-bit (PBKDF2 100k iterations) | $0 server hosting cost, 100% recipient privacy, infinite viral scalability, and zero database maintenance. |
| Auth / Access Gate | Symmetric client-side PBKDF2 key derivation and AES-GCM authenticated tag validation on 4-to-6 alphanumeric passcodes (`[A-Za-z0-9]{4,6}`) | Zero onboarding friction for gift recipients, instant offline verification, and cryptographic data integrity. |
| Deployment target | 100% Static Web Hosting (Cloudflare Pages or Vercel static) | $0 hosting cost, global CDN edge delivery under 1.5s, no server runtimes or cold starts. |
| Directory layout | Modular feature architecture (`src/app/` for FSM and events, `src/crypto/` for AES-GCM codec and demo wishes, `src/ui/` for DOM controllers and URL resolver, `src/audio/` for audio priming, `tests/` for Vitest specs) | Strict separation of concerns, testability, and clean layering for upcoming 3D scene engine (Phase 2). |

## Stack Touched in Phase 1

- [x] Project scaffold (Vite 6/8, TypeScript strict ES2022, Tailwind CSS v4, Vitest runner)
- [x] Client Routing & URL Parsing — URL hash fragment (`#d=...`) and query fallback (`?c=...`) with Meta link shim protection (`fbclid`, `igsh`)
- [x] Cryptographic Data Layer — Client-side AES-GCM 256-bit encryption/decryption with PBKDF2 key derivation and `lz-string` compression/decompression
- [x] UI & Viewport Shell — Responsive mobile viewport (`100svh`), festive glassmorphic PasscodeGate modal with auto-capitalized input and shake animation
- [x] Audio Engine Priming — Synchronous user-gesture stub (`primeAudioContext()`) unlocking Web Audio API context for iOS Safari WebKit
- [x] State Management — Strongly-typed Finite State Machine (`AppStateMachine`) managing transitions (`BOOT` → `LOCKED` → `UNLOCKED_INTRO`)
- [x] Local Execution & Test Verification — Documented local dev command (`npm run dev`) and automated test suite (`npx vitest run`)

## Out of Scope (Deferred to Later Slices)

Anything that is not in the Phase 1 skeleton. Explicitly deferred to prevent re-litigating Phase 1 minimalism:
- 3D WebGL scene graph, camera rig, and earthen diya mesh (Phase 2)
- Procedural GLSL flame shader, warm dynamic point lighting, additive glow billboard halo, and sparkler particle fountain (Phase 3)
- Interactive touch-and-drag match ignition, proximity detection, haptics, and dual-tier audio playback (Phase 4)
- Glassmorphic greeting reveal card, gold shimmer typography, confetti bursts, and WhatsApp reaction loop (Phase 5)
- Creator portal link generator and 1-click DM copy tool (Phase 6)
- DPR clamping, WebGL context lost/restored handlers, and mobile webview hardening (Phase 7)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Authentic 3D terracotta earthen diya (*mitti ka diya*) and cotton wick rendered in Three.js at 60 FPS with responsive portrait/landscape camera framing
- Phase 3: Procedural GLSL flickering flame with simplex noise, dynamic amber point light casting, single-pass additive glow halo, and phuljhadi sparkler fountain
- Phase 4: Touch-and-drag match ignition with proximity threshold detection (<0.35 units), dual-tier HTML5 ambient sitar/flute soundtrack bypassing iOS silent switch, and low-latency match strike SFX
- Phase 5: Glassmorphic greeting card reveal with staggered gold shimmer typography, tap-anywhere sparkler bursts, and 1-tap WhatsApp reciprocation loop
- Phase 6: Creator portal generator for sellers to create encrypted wishes, set passcodes, and 1-click copy pre-formatted Instagram DM / WhatsApp delivery copy
- Phase 7: DPR clamping (`Math.min(window.devicePixelRatio, 1.75)`), `webglcontextlost` / `webglcontextrestored` recovery, and Instagram/WhatsApp webview hardening
