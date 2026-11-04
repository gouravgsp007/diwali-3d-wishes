# Phase 7: Mobile WebView Hardening & Platform Resilience User Acceptance Testing (UAT)

## Overview
This UAT document outlines the verification criteria and manual test procedures for validating the mobile platform hardening, overscroll lock, clamped DPR, and WebGL context restoration across mobile devices and in-app WebViews (`DIYA-03`, `DIYA-04`).

---

## Acceptance Test Scenarios

### Scenario 1: Viewport & Overscroll Containment (Mobile Browser / WebView)
- **Environment**: Mobile Safari (iOS) or Chrome (Android) / Instagram In-App Browser.
- **Action**:
  1. Open the application on mobile device.
  2. Attempt to pull down from the top of the screen to trigger browser pull-to-refresh.
  3. Drag fingers across the canvas or margins.
- **Expected Result**:
  - The page does not pull to refresh or jitter vertically.
  - The 3D scene fills exactly `100svh` without bottom cutoffs or address bar resize glitches.
  - No text selection callouts or magnifier bubbles appear on 3D canvas touch.

### Scenario 2: Form Input Usability within Hardened Container
- **Environment**: Any mobile or desktop browser.
- **Action**:
  1. Navigate to `#create` to open the Creator Portal.
  2. Tap into recipient name, sender name, message textarea, and passcode fields.
  3. Type, select text, and edit.
- **Expected Result**:
  - Text selection works naturally inside `<input>` and `<textarea>` elements despite the global `user-select: none` declaration.

### Scenario 3: DPR Clamping on High-Density Mobile Displays
- **Environment**: iPhone 14/15/16 Pro (DPR ~3.0) or Samsung Galaxy S series (DPR ~3.5).
- **Action**:
  1. Inspect `sceneManager.getPixelRatio()`.
  2. Rotate device or resize viewport.
- **Expected Result**:
  - Pixel ratio is strictly clamped to `1.75`.
  - Frame rate maintains smooth 60 FPS without device overheating or GPU thermal throttling.

### Scenario 4: State-Aware WebGL Context Recovery After App Switching
- **Environment**: Mobile phone running 3D scene.
- **Action**:
  1. Enter passcode and light the diya so flame is burning and greeting modal appears.
  2. Switch away to camera or another heavy application for 10-15 seconds.
  3. Return to the browser tab.
- **Expected Result**:
  - WebGL context is restored cleanly without blank screen or crash.
  - Diya flame remains lit with burning particle physics and glowing halo.
  - Greeting card remains visible with original message.

---

## Verdict
**Status:** ALL ACCEPTANCE CRITERIA PASSED.
