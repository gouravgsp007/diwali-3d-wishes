<!-- GSD:project-start source:PROJECT.md -->

## Project

**Diwali 3D Wishes (Shubh Deepavali Interactive Experience)**

A responsive, high-fidelity 3D web application designed to deliver magical, personalized Diwali greetings sold via Instagram. Buyers purchase a custom wish package and provide their loved one with a secret passcode, which unlocks an immersive celebratory experience featuring an interactive 3D Diya (oil lamp) that lights up on touch, atmospheric sparkler particle physics, ambient Indian festive instrumental music, and a custom greeting reveal.

**Core Value:** Delivering an emotional, jaw-dropping 3D festive experience where lighting a virtual diya unlocks an intimate, personalized Diwali greeting with zero technical friction for buyers and recipients.

### Constraints

- **Performance**: High frame rate (60fps) on mid-tier mobile smartphones without draining battery or causing lag.
- **Simplicity**: No complex onboarding, app download, or backend maintenance required for either creator or recipient.
- **Responsive Web**: Clean layout adapting seamlessly across mobile viewports, tablets, and desktop displays.
- **Audio Autoplay Policies**: Modern mobile browsers block audio autoplay before user interaction; audio must start seamlessly upon entering passcode or interacting with the page.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Executive Architectural Verdict

### Why Not React / React-Three-Fiber (R3F)?

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Three.js** | `^0.187.0` | Core 3D WebGL/WebGPU Scene Graph & Renderer | Industry standard for WebGL rendering. Highly stable, comprehensive shader support (`ShaderMaterial`, `RawShaderMaterial`), modular imports (`three/addons`), and battle-tested across iOS WebKit and Android Chrome. |
| **Vite** | `^6.2.0` / `^8.3.5` | Bundler & Development Server | Near-instant hot module replacement (HMR), zero-config tree-shaking via Rollup/Rolldown, native ES module support, and aggressive production minification essential for fast mobile loading. |
| **TypeScript** | `^5.7.0` | Type Safety & Vector/State Contracts | Strict typing for 3D vector coordinates, shader uniform dictionaries, greeting payload interfaces, and Web Audio state transitions without any runtime footprint (0 KB). |
| **Tailwind CSS** | `^4.0.0` (`@tailwindcss/vite`) | Mobile-first Glassmorphism UI & Passcode Overlay | Zero-runtime CSS engine with the new native Vite plugin. Compiles down to <6 KB of utility CSS for responsive touch modals, passcode keypad, warm festive typography, and dynamic viewport units (`100dvh`). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@tweenjs/tween.js** | `^25.0.0` | Lightweight Property Interpolation (Tweening) | Animating flame ignition scale (0 to 1), camera dolly/pan on unlock, warm PointLight intensity flicker, and greeting card fade-in. **Only ~3.5 KB gzipped** vs GSAP (~27 KB gz). Hooks directly into the `requestAnimationFrame` loop. |
| **Native Web Audio API + HTML5 Audio** | Native (W3C Standard) | Ambient Sitar/Flute Music & Flame Ignition SFX | Primary audio architecture. Zero bundle size (0 KB). Streaming ambient loop via `<audio preload="none">` combined with Web Audio `AudioContext` for gain fading and low-latency flame crackle/match strike SFX. Unlocked on passcode tap gesture. |
| **canvas-confetti** | `^1.9.4` | Festive Greeting Reveal Celebration Burst | Firing celebratory golden sparklers/confetti upon lighting the diya. Uses an isolated, highly optimized 2D canvas overlay (~6 KB gzipped) without burdening the WebGL 3D render pipeline. |
| **lz-string** | `^1.5.0` | Client-Side Greeting URL Token Compression | Compressing custom greeting text, sender/recipient names, and metadata into URL hash fragments (`#d=...`). Only **1.4 KB gzipped** with zero dependencies. Decrypted client-side with passcode. |
| **three/addons (GLTFLoader)** | Modular (Three.js) | Loading the 3D Diya Mesh (.glb) | Modular import from `three/addons/loaders/GLTFLoader.js`. Tree-shakeable; only loads the GLTF parsing logic required for the earthen diya asset. |

### Development & Optimization Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **gltf-transform** | CLI tool for 3D asset compression | Run on the earthen diya 3D model (`gltf-transform optimize diya.glb diya-opt.glb --draco.compress` or `--meshopt`). Keeps the total 3D asset under 150 KB. |
| **vite-plugin-mkcert** | Local HTTPS development | Essential for mobile debugging! Mobile browsers enforce strict Web Audio API policies and touch permissions only on secure contexts (`https://` or `localhost`). |

## Installation

# Core 3D engine and build tools

# Optional helper if using Draco-compressed glTF assets

# (draco decoder files can be copied to public/draco/)

## Audio Architecture: Web Audio API vs Howler.js

### The Mobile & Instagram WebView Challenge

### Evaluation Matrix

| Metric / Feature | Native Web Audio API + `<audio>` | Howler.js (`v2.2.4`) |
|------------------|----------------------------------|----------------------|
| **Bundle Impact** | **0 KB** (Built-in) | ~7.2 KB gzipped (35 KB unminified) |
| **Maintenance** | Living W3C standard, constantly updated by browser vendors | Last major release Sept 2023 (`v2.2.4`) |
| **Memory Footprint** | Extremely low (streams audio from disk via `<audio>`) | Loads entire audio buffers into JS memory unless forced to HTML5 Audio mode |
| **Gain / Fade Control** | Native `GainNode.linearRampToValueAtTime()` for cinematic fades | `howler.fade()` built on Web Audio |
| **Gesture Unlock Reliability** | Deterministic: `audioCtx.resume()` inside the Passcode Submit / "Tap to Light" event handler | Handles unlock internally, but can fail in restricted WebViews if called outside direct event callback |

### Recommendation

- Ambient Festive Music (Sitar/Flute, ~1.2 MB MP3): Streamed via `<audio id="bgm" loop preload="none">`. Connected to `audioCtx.createMediaElementSource()` with a `GainNode` for smooth 2-second volume fade-in upon unlocking.
- Flame Ignition & Crackle SFX: 200ms synthesized noise burst or pre-decoded tiny audio buffer for instant, zero-latency touch response.
- **Gesture Unlock Handshake:**

## Zero-Tech Passcode & Greeting Storage Architecture

### Strategy Comparison

| Strategy | Architecture | Server Cost / Month | Setup Complexity | Maintenance | Privacy & Security |
|----------|--------------|---------------------|------------------|-------------|--------------------|
| **1. Cryptographic Client Hash (Recommended)** | URL Fragment (`#d=<encrypted_payload>`) + Passcode Key | **$0** (Static hosting) | **Zero** (1 day build) | **Zero** (No DB to monitor) | 100% End-to-end encrypted; payload never touches server |
| **2. Serverless KV (Cloudflare Workers KV)** | Key-Value Lookup: `passcode` ➔ JSON Greeting | $0 (Free tier) to $5 | Low (Requires API deployment) | Low (Token/key management) | Server stores all buyer greeting messages |
| **3. Full Database (Supabase / Firebase)** | PostgreSQL / Firestore table | $0 (Free tier) | Medium (Schema, migrations, RLS) | Medium (Connection limits, cold starts) | Requires API keys & network requests |

### Prescriptive Recommendation: Client-Side URL Hash Encryption (Zero-Backend)

## 3D Asset & Shader Pipeline

### 1. 3D Diya Asset Specs

- **Format:** glTF 2.0 Binary (`.glb`).
- **Geometry Budget:** 1,200 – 2,500 triangles (earthen diya bowl, cotton wick, and shallow oil puddle).
- **Textures:** Single packed 1024x1024 PBR texture map (Base Color, Roughness/Metallic packed, Normal map).
- **Target Size:** **< 150 KB compressed** with Draco or Meshopt.

### 2. Procedural Flame Shader (`THREE.ShaderMaterial`)

- **Vertex Shader:** Displaces vertices upward with 2D simplex noise and a `sin(uTime * frequency)` wave to create organic, flickering flame lick physics.
- **Fragment Shader:** Vertical UV gradient:
- **Lighting Cast:** A `THREE.PointLight` positioned 0.1 units above the wick:

### 3. Sparkler Particle System

- Constructed using `THREE.Points` with a single `THREE.BufferGeometry` (300 particles).
- Particle attributes: `position`, `velocity`, `lifetime`, `color`.
- Blending: `THREE.AdditiveBlending` with `depthWrite: false` for brilliant golden sparks that erupt on touch and drift downwards with gravity.

## What NOT to Use (And Why)

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **React-Three-Fiber (`@react-three/fiber`) & `@react-three/drei`** | Bloats JS bundle by 250 KB – 500 KB+ gzipped. Adds virtual DOM reconciliation overhead and severe cold-start lag inside Instagram in-app browsers. | **Vanilla Three.js (`three`)** with modular ES imports. |
| **Heavy 3D Physics Engines (`cannon-es`, `rapier3d`, `ammo.js`)** | Adds 50 KB – 300 KB gzipped. The Diya is a stationary showcase; the flame is procedural shader math; sparkler sparks are simple velocity/gravity Euler integration. | Procedural math inside `requestAnimationFrame` (`pos += vel * dt`). |
| **Full-Screen Post-Processing Bloom (`UnrealBloomPass`)** | Requires multiple offscreen frame-buffer rendering passes (FBO downsampling/upsampling). Kills frame rates (dropping from 60fps to 15–20fps) and causes severe thermal throttling on mid-tier mobile chipsets. | **Procedural Billboard Glow Sprite** with additive blending (`THREE.AdditiveBlending`) + CSS backdrop filters for UI. |
| **Relational Database / Backend Auth (PostgreSQL, Supabase Auth, Firebase Auth)** | Massive operational overhead. Requires user accounts, login forms, schema migrations, API secrets, and server maintenance for a simple greeting unlock. | **Client-Side Cryptographic URL Hash (`#d=...`)** with zero backend infrastructure. |
| **GSAP (`gsap`) Core + Plugins** | Core bundle is ~27 KB gzipped. Excellent for complex timeline UI websites, but 8x heavier than necessary for 3D property tweening. | **`@tweenjs/tween.js` (~3.5 KB gz)**. |
| **CSS-in-JS Libraries (`styled-components`, `emotion`)** | Runtime style injection overhead, hydration cost, and significant bundle penalty. | **Tailwind CSS v4** (`@tailwindcss/vite`) for zero-runtime utility styling. |

## Stack Patterns by Variant

### Primary Variant: Pure Zero-Backend (Default / Recommended)

- **Deployment:** 100% Static Web Hosting (Cloudflare Pages or Vercel).
- **Passcode Storage:** Embedded in URL Hash (`#d=<encrypted_payload>`).
- **Creator Flow:** Embedded web generator generates the link and WhatsApp message in 1 click.
- **Pros:** 0 server costs, 0 maintenance, instant viral scaling, 100% privacy.

### Secondary Variant: Short-Code Serverless Edge Lookup (If Short Numeric Codes Are Mandated)

- **If the business strictly requires a short 5-character code** (e.g., recipient visits `diwali.app` with no link hash and enters `DIY88`):

## Mobile Web & Instagram WebView Critical Guidelines

## Version Compatibility Matrix

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| `three` | `^0.187.0` | `@types/three@^0.187.0` | Uses modern ES module exports (`three/addons/*`). Works seamlessly with Vite. |
| `vite` | `^6.2.0` / `^8.3.5` | `typescript@^5.7.0` | Fast build target `esnext` or `es2022`. |
| `@tweenjs/tween.js` | `^25.0.0` | `three@^0.187.0` | Updates synchronously within Three.js `requestAnimationFrame` loop via `TWEEN.update()`. |
| `tailwindcss` | `^4.0.0` | `@tailwindcss/vite@^4.0.0` | Uses native Vite integration without PostCSS config. |
| `lz-string` | `^1.5.0` | Native Web Crypto API | Works in all modern browsers (iOS Safari 12+, Chrome 60+). |

## Sources

- **NPM Registry**: Verified current versions for `three` (0.187.0), `vite` (8.3.5/6.2.0), `@tweenjs/tween.js` (25.0.0), `canvas-confetti` (1.9.4), `howler` (2.2.4).
- **Bundlephobia**: Verified bundle footprints (`three` ~181 KB gz, `r3f` ~56 KB gz + `three`, `@react-three/drei` ~509 KB gz, `gsap` ~26.7 KB gz, `@tweenjs/tween.js` ~3.5 KB gz, `lz-string` ~1.4 KB gz).
- **MDN Web Docs**: Web Audio API Autoplay Guide, Web Audio `AudioContext.resume()`, `window.crypto.subtle` AES-GCM standards.
- **Chrome / WebKit Developer Guidelines**: Viewport height (`100dvh`), `devicePixelRatio` mobile optimization, and WebGL context restoration best practices.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agents/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-fast` for a trivial task inline, with no subagents and no PLAN.md
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
