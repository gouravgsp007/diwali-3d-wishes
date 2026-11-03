# Diwali 3D Wishes (Shubh Deepavali Interactive Experience)

## What This Is

A responsive, high-fidelity 3D web application designed to deliver magical, personalized Diwali greetings sold via Instagram. Buyers purchase a custom wish package and provide their loved one with a secret passcode, which unlocks an immersive celebratory experience featuring an interactive 3D Diya (oil lamp) that lights up on touch, atmospheric sparkler particle physics, ambient Indian festive instrumental music, and a custom greeting reveal.

## Core Value

Delivering an emotional, jaw-dropping 3D festive experience where lighting a virtual diya unlocks an intimate, personalized Diwali greeting with zero technical friction for buyers and recipients.

## Business Context

- **Customer**: People on Instagram looking to send high-touch, memorable, interactive festive greetings to partners, family, friends, or clients.
- **Revenue model**: Direct-to-consumer sales on Instagram (pay per custom greeting package / secret access code).
- **Success metric**: Smooth passcode unlock and high emotional engagement (delighted recipients lighting the diya and sharing reactions).
- **Strategy notes**: Instagram marketing with video screen recordings of the interactive 3D diya lighting sequence and festive audio.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **Passcode Unlock Portal**: Atmospheric festive landing screen with passcode input to unlock recipient's specific greeting.
- [ ] **Interactive 3D Diya Scene**: Realistic 3D earthen diya (mitti ka diya) with wick, modeled/rendered in WebGL/Three.js.
- [ ] **Interactive Lighting Interaction**: Intuitive mobile-touch / desktop click-and-drag interaction to ignite the diya wick with sparkler effects.
- [ ] **Dynamic Flame & Lighting**: Realistic glowing flame shader/animation with organic flicker and warm light casting onto surroundings.
- [ ] **Festive Particle FX**: Surrounding celebration effects (bursting sparklers, floating golden embers, optional sky lanterns/fireworks).
- [ ] **Festive Audio System**: Soothing ambient Indian classical instrumental melody (sitar/flute) with audio toggle (mute/unmute) and realistic flame crackling / lighting sound effects.
- [ ] **Personalized Greeting Reveal**: Elegant celebratory typography revealing Sender Name, Recipient Name, and personal festive message once diya is lit.
- [ ] **Zero-Tech Creator Management**: Lightweight, hassle-free method (such as an embedded creator tool or local data config) to generate passcodes and pre-formatted Instagram/WhatsApp delivery messages in seconds without technical hurdles.
- [ ] **Flawless Mobile Responsiveness**: Optimized WebGL performance, responsive touch controls, fast load times, and universal browser compatibility (iOS Safari, Android Chrome, desktop).

### Out of Scope

- [ ] **Complex user account login / OAuth system** — Unnecessary friction; lightweight passcode unlock is instant and matches the Instagram sales model.
- [ ] **In-app payment gateway processing** — Payments are handled directly via Instagram DMs (UPI, PayPal, Stripe link, etc.) to keep overhead zero.
- [ ] **Heavy 3D asset downloads (>15MB)** — Must maintain instant mobile loading on cellular data; all 3D assets/procedural meshes must be lightweight and performant.

## Context

- The product will be promoted heavily on Instagram via short-form reels/stories showing the 3D diya being lit and the customized reveal.
- Recipients will almost exclusively open the link on mobile devices directly from Instagram DMs or WhatsApp.
- The interaction must feel tactile, magical, and culturally authentic, honoring traditional Diwali symbolism (light overcoming darkness).

## Constraints

- **Performance**: High frame rate (60fps) on mid-tier mobile smartphones without draining battery or causing lag.
- **Simplicity**: No complex onboarding, app download, or backend maintenance required for either creator or recipient.
- **Responsive Web**: Clean layout adapting seamlessly across mobile viewports, tablets, and desktop displays.
- **Audio Autoplay Policies**: Modern mobile browsers block audio autoplay before user interaction; audio must start seamlessly upon entering passcode or interacting with the page.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Passcode-based Greeting Unlock | Fits the Instagram DM commercial model: seller sells access code to buyer, recipient unlocks surprise without signup | — Pending |
| Interactive 3D Diya as Star Hero | Lighting a diya is the quintessential Diwali tradition; making it an interactive 3D centerpiece provides high emotional value | — Pending |
| Ambient Indian Instrumental + SFX | Traditional flute/sitar creates an authentic, heartwarming festive ambiance, paired with realistic flame crackle SFX | — Pending |
| Lightweight / Zero-Tech Creator Flow | Creator needs to mint and issue customized links/passcodes in seconds without managing servers or complex databases | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Business Context check (if present) — customer, revenue model, success metric still accurate?
4. Audit Out of Scope — reasons still valid?
5. Update Context with current state

---
*Last updated: 2026-11-03 after initialization*
