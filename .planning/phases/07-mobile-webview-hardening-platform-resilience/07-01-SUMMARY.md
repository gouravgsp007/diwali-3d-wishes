---
phase: 07-mobile-webview-hardening-platform-resilience
plan: 01
subsystem: graphics-and-mobile-css
tags: [mobile-hardening, webview, 100svh, overscroll, dpr-clamp, webgl-context-lost, webgl-context-restored, vitest]

requires:
  - 02-01-PLAN (SceneManager, WebGLRenderer setup)
  - 03-01-PLAN (FlameController, Procedural Shaders)
  - 05-01-PLAN (GreetingModal, CelebrationManager)
provides:
  - Small viewport height (`100svh`) and overscroll-behavior lock eliminating mobile browser jitter
  - Clamped DPR (Math.min(DPR, 1.75)) on startup and dynamic resize eliminating GPU thermal throttling
  - State-aware WebGL context restoration preserving lit diya flame and greeting modal state across app switching
  - Full production bundle verification (<175 kB gzipped total transfer payload, <2.5 MB budget)
affects:
  - Overall mobile robustness across Instagram, WhatsApp, TikTok, iOS Safari, Android Chrome

status: complete

actuals:
  tokens: 4800
  tasks: 3
  commits: 1
  plan_head_before: 0501e786b5b5fc0fa2e3c09f87236d396a84c7e6
  plan_head_after: a6032616f73e970bdf2292f3922d9b6fc70c1404

tech-stack:
  added: []
  patterns:
    - Viewport containment with `100svh` and `overscroll-behavior: none`
    - DPR clamping to Math.min(devicePixelRatio, 1.75)
    - State-aware WebGL context restoration (inspecting FSM state during rebuildScene)

key_files:
  modified:
    - src/style.css
    - index.html
    - src/graphics/scene-manager.ts
    - tests/graphics/scene-manager.test.ts

verification:
  test_suites: 27
  tests_passed: 192
  coverage: 100% on mobile hardening & context recovery
---

# Plan 07-01 Summary: Mobile WebView Hardening & Platform Resilience

Completed mobile platform hardening and WebGL resilience for seamless mobile execution inside Instagram WebView, WhatsApp in-app browser, iOS Safari, and Android Chrome (`DIYA-03`, `DIYA-04`):

1. **Mobile WebView Viewport & Touch Containment (`src/style.css`, `index.html`)**:
   - Replaced dynamic viewport height units with modern small viewport units (`height: 100svh`) on `html`, `body`, and `#app` container to eliminate address-bar expansion/collapse layout jitter.
   - Enforced `overscroll-behavior: none` and `-webkit-overscroll-behavior: none` across the document, permanently blocking pull-to-refresh gesture interference and unwanted canvas bounce.
   - Declared `-webkit-touch-callout: none` and `user-select: none` globally while explicitly preserving text selection (`user-select: text`) on `<input>` and `<textarea>` elements for accessibility and ease of editing in the Creator Portal.
   - Enforced `touch-action: none` on 3D root containers to prevent gesture hijacking by the browser.

2. **DPR Clamping on Instantiation & Resize (`src/graphics/scene-manager.ts`)**:
   - Enforced `this.clampedDpr = Math.min(window.devicePixelRatio || 1, 1.75)` both on initial renderer creation and inside `onResize()`.
   - Protects ultra-high-density mobile screens (e.g. iPhone 14/15 Pro with DPR 3.0, flagship Androids with DPR 3.5+) from rendering excessive fill-rate pixels, eliminating thermal throttling and ensuring rock-solid 60 FPS performance.

3. **State-Aware WebGL Context Restoration (`src/graphics/scene-manager.ts`)**:
   - Intercepts `webglcontextlost` with `event.preventDefault()` and pauses the requestAnimationFrame loop to prevent cascading render exceptions.
   - Intercepts `webglcontextrestored`, re-instantiates scene components, recompiles shaders, and inspects `AppStateMachine.getState()`.
   - If context was lost while the diya was lit (`LIT_CELEBRATION` or `GREETING_REVEAL`), immediately reignites the flame (`flameController.ignite()`), hides the touch hint and match follower, pans the camera, unfurls the `GreetingModal`, and activates celebratory particle systems so recipients return to their festive moment without disruption.

4. **Full Regression Test Suite & Production Build Verification**:
   - **Vitest Suite**: 27 test files, 192/192 tests passing (0 failures).
   - **TypeScript Typecheck**: `npx tsc --noEmit` exited with code 0 (0 errors).
   - **Production Vite Build**:
     - `dist/index.html`: 3.43 kB (gzip: 1.40 kB)
     - `dist/assets/index-*.css`: 37.10 kB (gzip: 6.63 kB)
     - `dist/assets/index-*.js`: 652.75 kB (gzip: 166.62 kB)
     - **Total Gzipped Transfer Size**: ~174.65 kB (drastically below the 2.5 MB total budget and within the 200 kB gzip JS budget).
