# Phase 7: Mobile WebView Hardening & Platform Resilience - Validation

**Defined:** 2026-11-04
**Status:** Active

---

## 1. Automated Verification Checks

1. **DPR Clamping Tests (`tests/graphics/scene-manager.test.ts`)**:
   - Asserts renderer pixel ratio is strictly clamped $\le 1.75$ even when `window.devicePixelRatio = 3.0` or `3.5`.
   - Asserts standard 1.0 DPR is preserved without artificially upscaling on standard displays.

2. **WebGL Context Lost & Restoration Tests (`tests/graphics/scene-manager.test.ts`)**:
   - Asserts `onContextLost` calls `event.preventDefault()` and pauses requestAnimationFrame loop.
   - Asserts `onContextRestored` invokes `rebuildScene()` and resumes rendering loop.
   - Asserts state-aware restoration: if FSM was in `LIT_CELEBRATION` or `GREETING_REVEAL`, flame and halo are restored in lit state.

3. **Viewport CSS & Mobile Hardening Audit**:
   - Verifies `100svh`, `overscroll-behavior: none`, `touch-action: none`, and `-webkit-touch-callout: none` in `src/style.css` and `index.html`.

4. **Network Payload Budget Verification**:
   - Verifies total production build transfer size < 2.5 MB (current: ~175 kB gzipped, ~93% under budget).

5. **Full Regression Suite**:
   - All test files across all 7 phases pass with 0 errors.
   - TypeScript strict compile passes with 0 errors.
   - Production Vite build completes with 0 errors.
