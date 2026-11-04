# Phase 7: Mobile WebView Hardening & Platform Resilience - Context

**Gathered:** 2026-11-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Harden the complete application against real-world mobile operating system and in-app browser quirks (Instagram, WhatsApp, TikTok, Facebook WebViews):
1. `DIYA-03`: Strictly enforce DPR thermal clamping (`Math.min(window.devicePixelRatio, 1.75)`) and viewport stability (`100svh`), eliminating GPU thermal throttling, mobile battery drain, and browser pull-to-refresh jitter.
2. `DIYA-04`: Bulletproof `webglcontextlost` and `webglcontextrestored` lifecycle listeners with state-aware scene graph reconstruction (restoring lit diya flame, glowing halo, and modal visibility when returning from background app switching).
3. Final performance & payload budget audit: 60 FPS frame rate target on mid-tier mobile hardware within a <2.5 MB total transfer payload budget.

</domain>

<decisions>
## Implementation Decisions

### 1. Viewport & Overscroll Containment (`DIYA-03`)
- **D-01:** **100svh Small Viewport Height & Fixed Shell**:
  - Enforce `height: 100svh` and `height: 100%` across `html`, `body`, and `#app` container.
  - Apply `overscroll-behavior: none` and `touch-action: none` to completely eliminate rubber-band bouncing, pull-to-refresh reload interruptions, and address-bar layout shift inside mobile Safari and Chrome WebViews.
- **D-02:** **Touch Ergonomics & Selection Lock**:
  - Apply `-webkit-touch-callout: none` and `user-select: none` across the 3D canvas and UI chrome, preventing native callout magnifier bubbles or text highlight rectangles from disrupting interactive touch gestures.

### 2. Device Pixel Ratio (DPR) Thermal Clamping (`DIYA-03`)
- **D-03:** **Strict DPR Clamping ($\le 1.75$)**:
  - Maintain `Math.min(window.devicePixelRatio || 1, 1.75)` on `WebGLRenderer`.
  - Ensures ultra-high density displays (iPhone 14/15 Pro with DPR 3.0, flagship Androids with DPR 3.5–4.0) do not suffer GPU fill-rate thermal collapse, preserving 60 FPS while rendering crisp visuals.

### 3. State-Aware WebGL Context Restoration (`DIYA-04`)
- **D-04:** **Graceful Background Recovery & Scene Reconstruction**:
  - `webglcontextlost`: `event.preventDefault()` to signal recovery intent to browser and pause render loop.
  - `webglcontextrestored`: Rebuilds scene graph, re-compiles shaders, and inspects `AppStateMachine` current state:
    - If in `LIT_CELEBRATION` or `GREETING_REVEAL`, immediately restores lit flame mesh scale (`uScale: 1.0`), halo intensity, and warm light.
    - If in `GREETING_REVEAL`, unfurls decrypted greeting card and reactivates tap sparkles.
    - If in `INTERACTIVE_UNLIT`, displays touch hint.

### 4. Transfer Payload & Performance Verification
- **D-05:** **Transfer Payload Compliance (<2.5 MB)**:
  - Verify complete production build transfers under 2.5 MB over network (currently ~166 kB gzipped JS/CSS).
  - Procedural geometries and shaders eliminate external 3D model/texture HTTP network requests.

</decisions>

<canonical_refs>
## Canonical References

- `GEMINI.md` § Mobile Web & Instagram WebView Critical Guidelines
- `.planning/REQUIREMENTS.md` § DIYA-03, DIYA-04
- `.planning/ROADMAP.md` § Phase 7: Mobile WebView Hardening & Platform Resilience
</canonical_refs>

<code_context>
## Existing Code Insights

- `src/graphics/scene-manager.ts`: Has initial DPR clamping and context lost/restored stubs.
- `index.html`: Has initial `100svh` and viewport meta tags.
- `src/style.css`: Contains animation rules; will be enhanced with global overscroll containment rules.

</code_context>
