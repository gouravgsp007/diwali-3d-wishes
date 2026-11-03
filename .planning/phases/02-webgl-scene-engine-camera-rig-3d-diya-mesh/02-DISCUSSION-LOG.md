# Phase 2: WebGL Scene Engine, Camera Rig & 3D Diya Mesh - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-04
**Phase:** 2-WebGL Scene Engine, Camera Rig & 3D Diya Mesh
**Areas discussed:** Diya 3D Asset & Sourcing, Camera Perspective & Framing, Scene Ambience & Ground Surface, Camera Idle Motion & Parallax

---

## Diya 3D Asset & Sourcing

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid Procedural + GLB fallback | High-fidelity Three.js procedural Diya (terracotta bowl, cotton wick, oil pool) with optional GLB override (0 KB extra transfer, instant 60fps load, zero missing-asset risk) | ✓ |
| Pure Procedural Geometry | Lightweight lathe/curve geometry with procedural clay/terracotta PBR materials | |
| Strict GLB 3D Asset | Load a 3D model file (e.g. diya.glb) with a festive loader animation | |

**User's choice:** Hybrid Procedural + GLB fallback
**Notes:** Ensures resilient, instant rendering without asset-load failures on mobile connections while enabling custom .glb replacement.

---

## Visual Style & Detailing

| Option | Description | Selected |
|--------|-------------|----------|
| Traditional Ornate Earthen Diya | Warm terracotta clay with decorative scalloped rim ridges, glossy golden-amber oil puddle, and a realistic organic cotton wick tip angled at the spout | ✓ |
| Rustic Handcrafted Terracotta | Matte raw clay with natural kiln gradient shading and simple traditional cotton wick | |
| Royal Brass-Trimmed Diya | Terracotta bowl accented with metallic gold/brass filigree rim and polished oil reflection | |

**User's choice:** Traditional Ornate Earthen Diya

---

## Texture Generation & Surface Realism

| Option | Description | Selected |
|--------|-------------|----------|
| Procedural Canvas PBR Textures | Dynamically bake micro-porous clay bump maps and oil sheen onto CanvasTextures at boot (realistic clay grain, 0 KB image downloads, instant FCP) | ✓ |
| Mathematical Three.js Materials | Standard PBR with color gradients, roughness, and subtle normal perturbation without canvas baking | |
| External PBR Image Maps | Load static PNG/WebP textures for high-frequency normal and displacement details | |

**User's choice:** Procedural Canvas PBR Textures

---

## World Coordinates & Flame Anchor

| Option | Description | Selected |
|--------|-------------|----------|
| Normalized Unit Scale with Fixed Wick Anchor | Diya scaled to ~2.5 units wide, centered at origin, with an explicit exported WickAnchor coordinate for lighting/flame shaders in Phase 3 | ✓ |
| Auto-Normalized Bounding Box | Automatically scales any imported GLB or procedural mesh to fit a 2.0 unit sphere | |
| Real-world Metric Scale | 1 unit = 1 meter, Diya sized to 0.12m with physical camera distance | |

**User's choice:** Normalized Unit Scale with Fixed Wick Anchor

---

## Camera Viewing Angle & Pitch

| Option | Description | Selected |
|--------|-------------|----------|
| Cinematic 3/4 Elevated Angle (~30° pitch) | Showcases the ornate terracotta bowl, glistening oil pool, and cotton wick, while leaving ample vertical space for the tall flame and lower greeting card | ✓ |
| Top-Down Decorative Angle (~45° pitch) | Emphasizes circular bowl geometry and floor patterns, giving an overhead celebratory view | |
| Dramatic Low Eye-Level Angle (~12° pitch) | Theatrical perspective highlighting the terracotta lamp silhouette against the dark night sky | |

**User's choice:** Cinematic 3/4 Elevated Angle (~30° pitch)

---

## Responsive Mobile Framing

| Option | Description | Selected |
|--------|-------------|----------|
| Mathematical vFOV Compensation | Dynamically expands vertical field-of-view on narrow portrait screens (aspect < 1.0) so the Diya retains identical visual width without cropping or perspective distortion | ✓ |
| Camera Dolly (Z-Distance scaling) | Moves camera farther back on mobile portrait to keep the Diya in frame while preserving a constant 45° FOV | |
| Adaptive Camera Target Y-Offset | Shifts camera lookAt target slightly upward on mobile to make room for bottom touch prompts | |

**User's choice:** Mathematical vFOV Compensation

---

## Vertical Screen Positioning & Dolly

| Option | Description | Selected |
|--------|-------------|----------|
| State-Driven Dynamic Camera Dolly | Centers Diya during passcode unlock, then smoothly tweens camera target upward (+0.4 units) on ignition via Tween.js so the flame and greeting card both have room | ✓ |
| Upper-Third Biased Framing | Permanently positions the Diya slightly above screen midpoint | |
| Dead-Center Geometric Framing | Diya stays strictly at viewport center | |

**User's choice:** State-Driven Dynamic Camera Dolly

---

## Camera Lens Focal Perspective

| Option | Description | Selected |
|--------|-------------|----------|
| Natural 45° Focal Length | Balanced 35mm equivalent perspective that preserves natural circular bowl proportions with pleasing three-dimensional depth | ✓ |
| Cinematic Wide-Angle (58° FOV) | Exaggerates depth and perspective, making the oil lamp feel larger | |
| Tight Telephoto Feel (28° FOV) | Subtle perspective compression giving a handcrafted miniature product showcase aesthetic | |

**User's choice:** Natural 45° Focal Length

---

## Ground Surface & Platform

| Option | Description | Selected |
|--------|-------------|----------|
| Circular Brass Thali / Festive Platter | A decorative circular dark brass dish beneath the Diya with subtle radial engravings that catch warm golden reflections upon lighting | ✓ |
| Dark Marble Ground with Rangoli Inlay | A soft floor plane with traditional golden rangoli geometric patterns radiating outward | |
| Floating Void with Contact Shadow | Diya hovers serenely in nocturnal space with a soft radial ambient occlusion shadow beneath it | |

**User's choice:** Circular Brass Thali / Festive Platter

---

## Baseline Lighting Ambiance

| Option | Description | Selected |
|--------|-------------|----------|
| Dual-Tier Festive Atmosphere | Soft indigo ambient baseline + warm golden rim light from top-rear to silhouette the unlit terracotta rim, ready for the warm PointLight ignition in Phase 3 | ✓ |
| Warm Studio Key & Fill | Balanced warm lighting so the earthen bowl and brass thali details are vividly visible even before the flame is lit | |
| Moody Cinematic Silhouette | Near-dark mysterious scene where only the outer clay profile is faintly glinting until touched | |

**User's choice:** Dual-Tier Festive Atmosphere

---

## Scene Depth & Background Elements

| Option | Description | Selected |
|--------|-------------|----------|
| Drifting Golden Bokeh Motes | 50 slow-drifting, out-of-focus golden dust particles floating upwards in 3D space, adding magical festive depth behind the Diya | ✓ |
| Clean Nocturnal Canvas | Keep Three.js background transparent, letting the pure HTML/CSS nocturnal gradient shine through with zero extra draw calls | |
| Subtle Marigold Flower Petals | A few scattered orange and yellow marigold petals resting decoratively on the brass platter | |

**User's choice:** Drifting Golden Bokeh Motes

---

## WebGL Shadow Rendering & Quality

| Option | Description | Selected |
|--------|-------------|----------|
| Real-time Directional Shadow Maps | Enables Three.js PCFSoftShadowMap for dynamic cast shadows across the thali rim and floor | ✓ |
| Clamped DPR + Baked Radial Contact Shadow | Disables heavy real-time depth shadow maps, using a soft contact shadow plane beneath the thali | |
| Adaptive Dynamic Resolution | Dynamically toggles shadow maps and drops DPR from 1.75 to 1.0 if frame times exceed 16ms | |

**User's choice:** Real-time Directional Shadow Maps

---

## Idle Camera Animation

| Option | Description | Selected |
|--------|-------------|----------|
| Harmonic Breathing Sway | Gentle organic Lissajous figure-8 drift (yaw ±1.5°, 8s cycle) creating a breathing, cinematic handheld presence | ✓ |
| Slow 360° Turntable Rotation | Continuous elegant orbit around the Diya showing off the 3D terracotta carvings from all angles | |
| Static Anchor with Gyroscope | Perfectly motionless until the user physically tilts their mobile device | |

**User's choice:** Harmonic Breathing Sway

---

## Interactive Parallax & Controls

| Option | Description | Selected |
|--------|-------------|----------|
| Damped Clamped Parallax with Auto-Return | Mouse movement / touch drag shifts angle up to ±15°, smoothly springing back to cinematic home framing when released | ✓ |
| Free OrbitControls Drag | Allows full rotational control so users can inspect the Diya from any angle | |
| Device Gyroscope Only | Parallax reacts purely to physical smartphone tilting via DeviceOrientationAPI | |

**User's choice:** Damped Clamped Parallax with Auto-Return

---

## Entrance Unlock Transition

| Option | Description | Selected |
|--------|-------------|----------|
| Cinematic Dolly Sweep on Unlock | Camera sweeps smoothly forward (1.2s cubic ease-out) from a wide view into the intimate Diya closeup as the passcode modal dissolves | ✓ |
| Instant Fade Transition | Camera is already stationed at the optimal angle; only the HTML glassmorphic modal fades away | |
| Dramatic Spiral Pan | Camera spirals 90° around the Diya while dollying inward | |

**User's choice:** Cinematic Dolly Sweep on Unlock

---

## Render Loop Lifecycle & Power

| Option | Description | Selected |
|--------|-------------|----------|
| Smart Visibility & Context Resilience | Pause render loop on backgrounded tabs (document.hidden) to conserve mobile battery, with automatic WebGL context restoration | ✓ |
| Continuous Unthrottled Loop | Always runs requestAnimationFrame regardless of tab visibility | |
| Demand-Driven On-Dirty Rendering | Only renders frames when camera moves or particles animate | |

**User's choice:** Smart Visibility & Context Resilience
