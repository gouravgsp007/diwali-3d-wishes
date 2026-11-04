# Phase 7: Mobile WebView Hardening & Platform Resilience - Patterns

**Mapped:** 2026-11-04
**Domain:** Codebase Conventions, Analogous Components & Implementation Contracts

---

## 1. Architectural Patterns

| Component | Target Location | Pattern |
|-----------|-----------------|---------|
| Viewport & Overscroll Lock | `src/style.css`, `index.html` | Enforce `height: 100svh`, `overscroll-behavior: none`, `touch-action: none`, `user-select: none`. |
| State-Aware Scene Restoration | `src/graphics/scene-manager.ts` | On `webglcontextrestored`, inspect `fsm.getState()` and restore lit flame scale, halo, and UI state appropriately. |
| Clamped DPR Guarantee | `src/graphics/scene-manager.ts` | `Math.min(window.devicePixelRatio || 1, 1.75)` applied both on initial instantiation and window resize. |
| Verification Audit Script | `scripts/verify-mobile-resilience.js` | Headless Chrome Puppeteer verification of viewport size, DPR clamping, and context recovery. |
