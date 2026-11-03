# Phase 2: WebGL Scene Engine, Camera Rig & 3D Diya Mesh - Pattern Map

**Mapped:** 2026-11-04  
**Phase:** 02 - WebGL Scene Engine, Camera Rig & 3D Diya Mesh  
**Files analyzed:** 16 (12 source files + 4 test files)  
**Analogs found:** 16 / 16 (Tracked repository analogs with verified git-tracked paths)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `package.json` | config | file-I/O | `package.json` | exact |
| `src/main.ts` | controller | event-driven | `src/main.ts` | exact |
| `src/graphics/scene-manager.ts` | controller | event-driven | `src/audio/audio-unlock.ts` / `src/ui/passcode-gate.ts` | role-match |
| `src/graphics/camera-rig.ts` | controller | event-driven | `src/app/state-machine.ts` / `src/ui/passcode-gate.ts` | role-match |
| `src/graphics/lighting-rig.ts` | service | transform | `src/audio/audio-unlock.ts` | role-match |
| `src/graphics/materials/procedural-textures.ts` | utility | transform | `src/crypto/greeting-codec.ts` | role-match |
| `src/graphics/materials/material-palette.ts` | model | transform | `src/crypto/types.ts` | role-match |
| `src/graphics/meshes/procedural-diya-geometry.ts` | utility | transform | `src/crypto/greeting-codec.ts` | role-match |
| `src/graphics/meshes/diya-mesh.ts` | component | lifecycle | `src/ui/passcode-gate.ts` | role-match |
| `src/graphics/meshes/thali-mesh.ts` | component | transform | `src/ui/passcode-gate.ts` | role-match |
| `src/graphics/meshes/diya-loader.ts` | service | file-I/O | `src/ui/url-resolver.ts` | role-match |
| `src/graphics/particles/bokeh-motes.ts` | component | transform | `src/crypto/greeting-codec.ts` / `src/app/state-machine.ts` | role-match |
| `tests/graphics/scene-manager.test.ts` | test | event-driven | `tests/ui/passcode-gate.test.ts` | role-match |
| `tests/graphics/camera-rig.test.ts` | test | event-driven | `tests/state/state-machine.test.ts` | role-match |
| `tests/graphics/procedural-diya.test.ts` | test | transform | `tests/crypto/greeting-codec.test.ts` | role-match |
| `tests/graphics/procedural-textures.test.ts` | test | transform | `tests/crypto/greeting-codec.test.ts` | role-match |

---

## Pattern Assignments

### 1. `package.json` (config, file-I/O)

**Analog:** `package.json` (lines 13-26)

**Dependency Declaration Pattern:**
Follows existing semver locking and devDependency separation established in Phase 1. Add `three` and `@tweenjs/tween.js` as production dependencies, and `@types/three` as devDependency.

```json
  "dependencies": {
    "@tweenjs/tween.js": "^25.0.0",
    "lz-string": "^1.5.0",
    "three": "^0.187.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/lz-string": "^1.5.0",
    "@types/three": "^0.187.0",
    "happy-dom": "^21.0.0",
    "puppeteer-core": "^25.16.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.2.0",
    "vitest": "^3.0.0"
  }
```

---

### 2. `src/main.ts` (controller, event-driven)

**Analog:** `src/main.ts` (lines 1-35)

**Imports Pattern** (`src/main.ts:1-5`):
```typescript
import './style.css';
import { AppStateMachine } from './app/state-machine';
import { resolveGreetingToken } from './ui/url-resolver';
import { PasscodeGate } from './ui/passcode-gate';
```

**Bootstrap Orchestration Pattern** (`src/main.ts:12-25`):
Extend `bootstrap()` to initialize `SceneManager`, mount the WebGL canvas into `#app` before `#passcode-card` (preserving z-index 0 background layering), and connect state machine transitions to camera/lighting transitions:

```typescript
export function bootstrap(): { fsm: AppStateMachine; passcodeGate: PasscodeGate; sceneManager: SceneManager } {
  const fsm = new AppStateMachine();
  const tokenInfo = resolveGreetingToken();

  const sceneContainer = document.getElementById('app') ?? document.body;
  const sceneManager = new SceneManager(sceneContainer, fsm);
  sceneManager.start();

  const passcodeGate = new PasscodeGate(fsm, tokenInfo);
  passcodeGate.mount();

  fsm.transition({
    type: 'BOOT_COMPLETE',
    hasCiphertext: !tokenInfo.isDemo && !!tokenInfo.token,
  });

  return { fsm, passcodeGate, sceneManager };
}
```

**DOM Readiness Guard** (`src/main.ts:27-34`):
```typescript
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => bootstrap());
  } else {
    // Already loaded
    bootstrap();
  }
}
```

---

### 3. `src/graphics/scene-manager.ts` (controller, event-driven)

**Analogs:**
- `src/audio/audio-unlock.ts:17-41` (Web API hardware initialization, context recovery, and safe error handling)
- `src/ui/passcode-gate.ts:26-55` (DOM element caching, event listener registration, and lifecycle cleanup)

**Imports Pattern:**
```typescript
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import type { AppStateMachine, AppState } from '../app/state-machine';
import { CameraRig } from './camera-rig';
import { createLightingRig, type LightingRigResult } from './lighting-rig';
import { DiyaMesh } from './meshes/diya-mesh';
import { createBrassThaliMesh } from './meshes/thali-mesh';
import { BokehMotes } from './particles/bokeh-motes';
```

**Context Resilience & Hardware Safety Pattern** (copying `src/audio/audio-unlock.ts:17-41` try/catch & fallback style):
- Clamp DPR to `Math.min(window.devicePixelRatio || 1, 1.75)` (Pitfall 1, D-16).
- Enable `PCFSoftShadowMap` for soft contact shadows under the Diya bowl.
- Pre-warm shader pipeline with `renderer.compile(scene, camera)` (Pitfall 3).
- Listen to `webglcontextlost` (call `event.preventDefault()` to signal restoration intent) and `webglcontextrestored`.
- Listen to `visibilitychange`: pause `requestAnimationFrame` when `document.hidden` is true (D-16).

```typescript
export class SceneManager {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private cameraRig!: CameraRig;
  private lightingRig!: LightingRigResult;
  private diyaMesh!: DiyaMesh;
  private thaliMesh!: THREE.Mesh;
  private bokehMotes!: BokehMotes;

  private canvas: HTMLCanvasElement | null = null;
  private animationFrameId: number | null = null;
  private isPaused = false;
  private clock = new THREE.Clock();
  private unsubscribeFsm: (() => void) | null = null;

  constructor(
    private container: HTMLElement,
    private fsm: AppStateMachine
  ) {}

  public start(): void {
    this.initScene();
    this.initListeners();
    this.clock.start();
    this.render();
  }
}
```

**State Transition Handler Pattern** (copying `src/app/state-machine.ts:90-95` subscriber pattern):
```typescript
  private handleStateChange(state: AppState): void {
    if (state === 'UNLOCKED_INTRO') {
      // Cinematic dolly forward upon passcode unlock
      this.cameraRig.dollyTo(new THREE.Vector3(0, 2.0, 3.2), 1200);
    } else if (state === 'IGNITING') {
      // Smooth upward target pan to frame flame + greeting card
      this.cameraRig.panTargetTo(new THREE.Vector3(0, 0.65, 0), 1000);
    }
  }
```

**Disposal & Cleanup Pattern** (resource lifecycle):
```typescript
  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.unsubscribeFsm) {
      this.unsubscribeFsm();
    }
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    this.diyaMesh.dispose();
    this.bokehMotes.dispose();
    this.thaliMesh.geometry.dispose();
    (this.thaliMesh.material as THREE.Material).dispose();
    this.renderer.dispose();
    this.canvas?.remove();
  }
```

---

### 4. `src/graphics/camera-rig.ts` (controller, event-driven)

**Analogs:**
- `src/app/state-machine.ts:42-88` (State-driven transitions, decoupled observation)
- `src/ui/passcode-gate.ts:36-41` (Pointer event handling, input normalization, and boundary clamping)

**Imports Pattern:**
```typescript
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
```

**Mathematical vFOV Compensation Pattern** (D-06, D-08):
Calculates expanded portrait vertical FOV using standard trigonometric projection:
`vFov = 2 * Math.atan(Math.tan(baseFov / 2) / aspect) * (180 / Math.PI)` when `aspect < 1.0`. Preserves base 45° FOV on landscape/square displays.

```typescript
export class CameraRig {
  public camera: THREE.PerspectiveCamera;
  private readonly baseFov: number = 45;
  private basePosition = new THREE.Vector3(0, 2.3, 3.8); // 30° elevated pitch
  private currentTarget = new THREE.Vector3(0, 0.25, 0);

  // Parallax tracking
  private targetParallax = new THREE.Vector2(0, 0);
  private currentParallax = new THREE.Vector2(0, 0);

  // Lissajous breathing sway state
  private swayTime = 0;

  constructor(width: number, height: number) {
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(this.baseFov, aspect, 0.1, 50);
    this.updateFov(aspect);
    this.camera.position.copy(this.basePosition);
    this.camera.lookAt(this.currentTarget);
  }

  public updateFov(aspect: number): void {
    if (aspect < 1.0) {
      const baseFovRad = THREE.MathUtils.degToRad(this.baseFov);
      const vFovRad = 2 * Math.atan(Math.tan(baseFovRad / 2) / aspect);
      this.camera.fov = THREE.MathUtils.radToDeg(vFovRad);
    } else {
      this.camera.fov = this.baseFov;
    }
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
```

**Clamped Parallax with Auto-Return Pattern** (copying clamping and damping conventions):
```typescript
  public onPointerMove(normalizedX: number, normalizedY: number): void {
    // Clamped parallax: max ±15° yaw (~0.26 rad), ±10° pitch (~0.17 rad)
    this.targetParallax.set(
      Math.max(-0.26, Math.min(0.26, normalizedX * 0.26)),
      Math.max(-0.17, Math.min(0.17, normalizedY * 0.17))
    );
  }

  public onPointerUp(): void {
    this.targetParallax.set(0, 0);
  }

  public dollyTo(targetPos: THREE.Vector3, durationMs: number = 1200): Promise<void> {
    return new Promise((resolve) => {
      new TWEEN.Tween(this.camera.position)
        .to({ x: targetPos.x, y: targetPos.y, z: targetPos.z }, durationMs)
        .easing(TWEEN.Easing.Cubic.Out)
        .onComplete(() => resolve())
        .start();
    });
  }

  public panTargetTo(targetLook: THREE.Vector3, durationMs: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      new TWEEN.Tween(this.currentTarget)
        .to({ x: targetLook.x, y: targetLook.y, z: targetLook.z }, durationMs)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => resolve())
        .start();
    });
  }

  public update(deltaTimeSeconds: number): void {
    // Damped auto-return
    this.currentParallax.lerp(this.targetParallax, 0.08);

    // Lissajous figure-8 breathing sway (8s cycle)
    this.swayTime += deltaTimeSeconds;
    const swayX = Math.sin(this.swayTime * (2 * Math.PI / 8.0)) * 0.08;
    const swayY = Math.sin(this.swayTime * (4 * Math.PI / 8.0)) * 0.04;

    this.camera.position.x = this.basePosition.x + swayX + Math.sin(this.currentParallax.x) * 2.0;
    this.camera.position.y = this.basePosition.y + swayY + Math.sin(this.currentParallax.y) * 1.0;
    this.camera.position.z = this.basePosition.z;

    this.camera.lookAt(this.currentTarget);
  }
}
```

---

### 5. `src/graphics/lighting-rig.ts` (service, transform)

**Analog:** `src/audio/audio-unlock.ts:17-41` (Pre-warming hardware resources at boot)

**Pre-Warmed Light Setup Pattern:**
```typescript
import * as THREE from 'three';

export interface LightingRigResult {
  ambientLight: THREE.AmbientLight;
  rimLight: THREE.DirectionalLight;
  flamePointLight: THREE.PointLight;
}

export function createLightingRig(wickAnchor: THREE.Vector3): LightingRigResult {
  // 1. Nocturnal indigo ambient baseline (D-10)
  const ambientLight = new THREE.AmbientLight(0x140c2e, 0.55);

  // 2. Warm golden rim light (top-rear-right) casting soft shadows (D-10, D-12)
  const rimLight = new THREE.DirectionalLight(0xffb255, 1.8);
  rimLight.position.set(2.0, 4.5, -2.5);
  rimLight.castShadow = true;

  // Optimized mobile shadow frustum
  rimLight.shadow.mapSize.width = 1024;
  rimLight.shadow.mapSize.height = 1024;
  rimLight.shadow.camera.near = 1.0;
  rimLight.shadow.camera.far = 12.0;
  rimLight.shadow.camera.left = -2.5;
  rimLight.shadow.camera.right = 2.5;
  rimLight.shadow.camera.top = 2.5;
  rimLight.shadow.camera.bottom = -2.5;
  rimLight.shadow.bias = -0.001;

  // 3. Pre-warmed unlit flame point light (Pitfall 3: prevents 500ms shader stutter on Phase 3 strike)
  const flamePointLight = new THREE.PointLight(0xff9922, 0.0001, 6.0);
  flamePointLight.position.copy(wickAnchor);
  flamePointLight.castShadow = false;

  return { ambientLight, rimLight, flamePointLight };
}
```

---

### 6. `src/graphics/materials/procedural-textures.ts` (utility, transform)

**Analog:** `src/crypto/greeting-codec.ts:307-332` (Procedural byte buffer generation and array operations)

**CanvasTexture PBR Baking Pattern:**
Creates 512x512 CanvasTextures for clay bump, roughness, and diffuse color directly on offscreen `<canvas>` elements at boot (<8ms CPU cost, 0 KB network download).

```typescript
import * as THREE from 'three';

export interface BakedClayTextures {
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  colorMap: THREE.CanvasTexture;
}

export function generateProceduralClayTextures(): BakedClayTextures {
  const size = 512;
  const canvasBump = document.createElement('canvas');
  canvasBump.width = size;
  canvasBump.height = size;
  const ctxBump = canvasBump.getContext('2d')!;

  const canvasRough = document.createElement('canvas');
  canvasRough.width = size;
  canvasRough.height = size;
  const ctxRough = canvasRough.getContext('2d')!;

  const canvasColor = document.createElement('canvas');
  canvasColor.width = size;
  canvasColor.height = size;
  const ctxColor = canvasColor.getContext('2d')!;

  const imgDataBump = ctxBump.createImageData(size, size);
  const imgDataRough = ctxRough.createImageData(size, size);
  const imgDataColor = ctxColor.createImageData(size, size);

  const bumpData = imgDataBump.data;
  const roughData = imgDataRough.data;
  const colorData = imgDataColor.data;

  // Base terracotta RGB: warm Indian red clay
  const baseR = 185;
  const baseG = 78;
  const baseB = 39;

  for (let y = 0; y < size; y++) {
    // Wheel-thrown pottery striations
    const ringBand = Math.sin(y * 0.18) * 12 + Math.sin(y * 0.45) * 6;

    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Clay grain noise
      const noise = (Math.random() - 0.5) * 36;
      const bumpVal = Math.max(0, Math.min(255, 128 + ringBand + noise));

      bumpData[idx] = bumpVal;
      bumpData[idx + 1] = bumpVal;
      bumpData[idx + 2] = bumpVal;
      bumpData[idx + 3] = 255;

      // Matte earthenware roughness: 0.75 - 0.92
      const roughVal = Math.max(0, Math.min(255, 195 + (Math.random() - 0.5) * 30));
      roughData[idx] = roughVal;
      roughData[idx + 1] = roughVal;
      roughData[idx + 2] = roughVal;
      roughData[idx + 3] = 255;

      // Subtle organic color mottling
      const colorJitter = (Math.random() - 0.5) * 14 + ringBand * 0.5;
      colorData[idx] = Math.max(0, Math.min(255, baseR + colorJitter));
      colorData[idx + 1] = Math.max(0, Math.min(255, baseG + colorJitter * 0.7));
      colorData[idx + 2] = Math.max(0, Math.min(255, baseB + colorJitter * 0.5));
      colorData[idx + 3] = 255;
    }
  }

  ctxBump.putImageData(imgDataBump, 0, 0);
  ctxRough.putImageData(imgDataRough, 0, 0);
  ctxColor.putImageData(imgDataColor, 0, 0);

  const bumpMap = new THREE.CanvasTexture(canvasBump);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3, 2);

  const roughnessMap = new THREE.CanvasTexture(canvasRough);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(3, 2);

  const colorMap = new THREE.CanvasTexture(canvasColor);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.RepeatWrapping;
  colorMap.repeat.set(3, 2);

  return { bumpMap, roughnessMap, colorMap };
}
```

---

### 7. `src/graphics/materials/material-palette.ts` (model, transform)

**Analog:** `src/crypto/types.ts:1-7` (Typed contracts, strict types, and factories)

**Material Factory Pattern:**
```typescript
import * as THREE from 'three';
import type { BakedClayTextures } from './procedural-textures';

export interface DiyaMaterialPalette {
  terracotta: THREE.MeshStandardMaterial;
  oilPool: THREE.MeshStandardMaterial;
  wick: THREE.MeshStandardMaterial;
  brassThali: THREE.MeshStandardMaterial;
}

export function createMaterialPalette(clayTextures: BakedClayTextures, brassBumpTex: THREE.CanvasTexture): DiyaMaterialPalette {
  const terracotta = new THREE.MeshStandardMaterial({
    map: clayTextures.colorMap,
    bumpMap: clayTextures.bumpMap,
    bumpScale: 0.035,
    roughnessMap: clayTextures.roughnessMap,
    roughness: 0.85,
    metalness: 0.04,
  });

  const oilPool = new THREE.MeshStandardMaterial({
    color: 0xb5781a, // Golden amber oil
    roughness: 0.06,  // Mirror-gloss liquid
    metalness: 0.15,
    transparent: true,
    opacity: 0.90,
  });

  const wick = new THREE.MeshStandardMaterial({
    color: 0x221c16, // Charred cotton wick tip
    roughness: 0.95,
    metalness: 0.0,
  });

  const brassThali = new THREE.MeshStandardMaterial({
    color: 0x5a461e,    // Rich dark antique brass
    roughness: 0.38,    // Brushed metal finish
    metalness: 0.88,    // Highly metallic
    bumpMap: brassBumpTex,
    bumpScale: 0.015,
  });

  return { terracotta, oilPool, wick, brassThali };
}
```

---

### 8. `src/graphics/meshes/procedural-diya-geometry.ts` (utility, transform)

**Analog:** `src/crypto/greeting-codec.ts:295-318` (Data buffer array manipulation and deterministic transformations)

**Procedural Lathe & CPU Displacement Pattern:**
Generates `THREE.LatheGeometry` and modifies the `BufferAttribute` positions in a single pass at boot:

```typescript
import * as THREE from 'three';

export interface DiyaGeometryResult {
  geometry: THREE.BufferGeometry;
  wickAnchor: THREE.Vector3;
}

export function createProceduralDiyaGeometry(): DiyaGeometryResult {
  // 1. Cross-section profile (x = radius, y = height)
  const profilePoints: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.5, 0.0),
    new THREE.Vector2(0.8, 0.1),
    new THREE.Vector2(1.2, 0.35),
    new THREE.Vector2(1.25, 0.65),
    new THREE.Vector2(1.15, 0.70),
    new THREE.Vector2(1.05, 0.65),
    new THREE.Vector2(0.95, 0.30),
    new THREE.Vector2(0.4, 0.15),
    new THREE.Vector2(0.0, 0.15)
  ];

  const segments = 64;
  const geometry = new THREE.LatheGeometry(profilePoints, segments);

  const posAttr = geometry.attributes.position;
  const vertex = new THREE.Vector3();

  const spoutAngle = Math.PI / 2; // +Z axis
  const spoutSpread = 0.55;
  const spoutHeightMin = 0.35;
  const spoutHeightMax = 0.72;
  const spoutStretch = 0.45;

  const numScallops = 14;
  const scallopAmplitude = 0.035;
  const rimHeightMin = 0.58;

  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);

    const angle = Math.atan2(vertex.z, vertex.x);
    let angleDiff = Math.abs(angle - spoutAngle);
    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

    // Pinched spout displacement along +Z
    if (angleDiff < spoutSpread && vertex.y >= spoutHeightMin && vertex.y <= spoutHeightMax) {
      const angularFalloff = Math.cos((angleDiff / spoutSpread) * (Math.PI / 2));
      const heightFactor = (vertex.y - spoutHeightMin) / (spoutHeightMax - spoutHeightMin);
      const push = spoutStretch * angularFalloff * heightFactor;

      vertex.z += push;
      vertex.y += push * 0.15;
      vertex.x *= (1.0 - angularFalloff * 0.2);
    }

    // Scalloped outer rim ridges
    if (vertex.y >= rimHeightMin && angleDiff >= spoutSpread * 0.8) {
      const radius = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);
      if (radius > 1.0) {
        const scallop = Math.sin(angle * numScallops) * scallopAmplitude;
        vertex.x += (vertex.x / radius) * scallop;
        vertex.z += (vertex.z / radius) * scallop;
      }
    }

    posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  posAttr.needsUpdate = true;
  geometry.computeVertexNormals();

  // Exported WickAnchor coordinate (D-04)
  const wickAnchor = new THREE.Vector3(0.0, 0.68, 1.38);

  return { geometry, wickAnchor };
}
```

---

### 9. `src/graphics/meshes/diya-mesh.ts` (component, lifecycle)

**Analog:** `src/ui/passcode-gate.ts:26-55` (Component construction, sub-element assembly, and cleanup)

**Hierarchical Mesh Assembly Pattern:**
Combines procedural clay bowl, glossy oil pool disc, and cotton wick tube with explicit GPU resource disposal.

```typescript
import * as THREE from 'three';
import { createProceduralDiyaGeometry } from './procedural-diya-geometry';
import { generateProceduralClayTextures } from '../materials/procedural-textures';

export class DiyaMesh {
  public group: THREE.Group;
  public wickAnchor: THREE.Vector3;
  private bowlMesh: THREE.Mesh;
  private oilMesh: THREE.Mesh;
  private wickMesh: THREE.Mesh;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'diya-group';

    // 1. Procedural Bowl
    const { geometry, wickAnchor } = createProceduralDiyaGeometry();
    this.wickAnchor = wickAnchor;

    const clayTextures = generateProceduralClayTextures();
    const clayMaterial = new THREE.MeshStandardMaterial({
      map: clayTextures.colorMap,
      bumpMap: clayTextures.bumpMap,
      bumpScale: 0.035,
      roughnessMap: clayTextures.roughnessMap,
      roughness: 0.85,
      metalness: 0.04,
    });

    this.bowlMesh = new THREE.Mesh(geometry, clayMaterial);
    this.bowlMesh.castShadow = true;
    this.bowlMesh.receiveShadow = false;
    this.group.add(this.bowlMesh);

    // 2. Glossy Oil Pool
    const oilGeo = new THREE.CircleGeometry(0.92, 48);
    const oilMat = new THREE.MeshStandardMaterial({
      color: 0xb5781a,
      roughness: 0.06,
      metalness: 0.15,
      transparent: true,
      opacity: 0.90,
    });
    this.oilMesh = new THREE.Mesh(oilGeo, oilMat);
    this.oilMesh.rotation.x = -Math.PI / 2;
    this.oilMesh.position.set(0, 0.32, 0.05);
    this.oilMesh.receiveShadow = true;
    this.group.add(this.oilMesh);

    // 3. Cotton Wick Tip
    const wickCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.28, 0.4),
      new THREE.Vector3(0, 0.45, 0.9),
      wickAnchor.clone().sub(new THREE.Vector3(0, 0.08, 0.1)),
      wickAnchor.clone(),
    ]);
    const wickGeo = new THREE.TubeGeometry(wickCurve, 20, 0.045, 12, false);
    const wickMat = new THREE.MeshStandardMaterial({
      color: 0x221c16,
      roughness: 0.95,
      metalness: 0.0,
    });
    this.wickMesh = new THREE.Mesh(wickGeo, wickMat);
    this.wickMesh.castShadow = true;
    this.group.add(this.wickMesh);
  }

  public dispose(): void {
    this.bowlMesh.geometry.dispose();
    (this.bowlMesh.material as THREE.Material).dispose();
    this.oilMesh.geometry.dispose();
    (this.oilMesh.material as THREE.Material).dispose();
    this.wickMesh.geometry.dispose();
    (this.wickMesh.material as THREE.Material).dispose();
  }
}
```

---

### 10. `src/graphics/meshes/thali-mesh.ts` (component, transform)

**Analog:** `src/ui/passcode-gate.ts:125-142` (Dynamic DOM/canvas asset creation with fallback styling)

**Brass Thali Platter Pattern:**
```typescript
import * as THREE from 'three';

export function createBrassThaliMesh(): THREE.Mesh {
  const platterPoints: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(2.1, 0.0),
    new THREE.Vector2(2.25, 0.05),
    new THREE.Vector2(2.35, 0.10),
    new THREE.Vector2(2.30, 0.11),
    new THREE.Vector2(2.20, 0.03),
    new THREE.Vector2(0.0, -0.01)
  ];

  const geometry = new THREE.LatheGeometry(platterPoints, 64);

  // Concentric radial engraving bump map on canvas
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#a0a0a0';
  ctx.lineWidth = 3;
  for (let r = 40; r < 240; r += 25) {
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  const bumpTex = new THREE.CanvasTexture(canvas);

  const brassMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a461e,
    roughness: 0.38,
    metalness: 0.88,
    bumpMap: bumpTex,
    bumpScale: 0.015,
  });

  const mesh = new THREE.Mesh(geometry, brassMaterial);
  mesh.name = 'brass-thali';
  mesh.position.set(0, -0.02, 0);
  mesh.receiveShadow = true;
  mesh.castShadow = false;

  return mesh;
}
```

---

### 11. `src/graphics/meshes/diya-loader.ts` (service, file-I/O)

**Analog:** `src/ui/url-resolver.ts:7-22` (Hierarchical fallback resolution strategy)

**Hybrid GLTF / Procedural Fallback Pattern (D-01):**
Performs a silent background fetch for `/models/diya.glb`. If present and valid, loads the external model; if missing or fails, seamlessly falls back to procedural geometry with zero user-facing errors.

```typescript
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DiyaMesh } from './diya-mesh';

export async function loadDiyaModelWithFallback(): Promise<{ group: THREE.Group; wickAnchor: THREE.Vector3; dispose: () => void }> {
  const procedural = new DiyaMesh();

  try {
    const loader = new GLTFLoader();
    const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
      loader.load(
        '/models/diya.glb',
        (loaded) => resolve(loaded),
        undefined,
        (err) => reject(err)
      );
    });

    const anchorObj = gltf.scene.getObjectByName('WickAnchor');
    const wickAnchor = anchorObj ? anchorObj.position.clone() : new THREE.Vector3(0.0, 0.68, 1.38);

    // Clean up unused procedural instance
    procedural.dispose();

    return {
      group: gltf.scene,
      wickAnchor,
      dispose: () => {
        gltf.scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material?.dispose();
            }
          }
        });
      },
    };
  } catch {
    // Silent fallback to procedural geometry
    return {
      group: procedural.group,
      wickAnchor: procedural.wickAnchor,
      dispose: () => procedural.dispose(),
    };
  }
}
```

---

### 12. `src/graphics/particles/bokeh-motes.ts` (component, transform)

**Analogs:**
- `src/crypto/greeting-codec.ts:307-310` (Typed `Float32Array` buffer allocations)
- `src/app/state-machine.ts:42-88` (Deterministic state update ticks)

**Single-Pass Additive Points Pattern (D-11):**
50 drifting golden points rendered in a single draw call with additive blending and depth-write disabled.

```typescript
import * as THREE from 'three';

export class BokehMotes {
  public points: THREE.Points;
  private particleCount = 50;
  private speeds: Float32Array;
  private phases: Float32Array;

  constructor() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    this.speeds = new Float32Array(this.particleCount);
    this.phases = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 5.0; // x: [-2.5, 2.5]
      positions[i * 3 + 1] = Math.random() * 4.0 - 0.5;   // y: [-0.5, 3.5]
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3.5 - 0.5; // z: behind Diya

      this.speeds[i] = 0.15 + Math.random() * 0.25;
      this.phases[i] = Math.random() * Math.PI * 2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Circular soft radial glow bokeh texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 240, 190, 1.0)');
    grad.addColorStop(0.35, 'rgba(240, 180, 50, 0.6)');
    grad.addColorStop(1, 'rgba(240, 180, 50, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      size: 0.16,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xffd27d,
    });

    this.points = new THREE.Points(geo, mat);
  }

  public update(dt: number, time: number): void {
    const posAttr = this.points.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < this.particleCount; i++) {
      arr[i * 3 + 1] += this.speeds[i] * dt;
      arr[i * 3 + 0] += Math.sin(time + this.phases[i]) * 0.002;

      if (arr[i * 3 + 1] > 3.8) {
        arr[i * 3 + 1] = -0.5;
        arr[i * 3 + 0] = (Math.random() - 0.5) * 5.0;
      }
    }
    posAttr.needsUpdate = true;
  }

  public dispose(): void {
    this.points.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
```

---

### 13. `tests/graphics/scene-manager.test.ts` (test, event-driven)

**Analog:** `tests/ui/passcode-gate.test.ts:1-40`

**Vitest WebGL Scene Engine Test Pattern:**
```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SceneManager } from '../../src/graphics/scene-manager';
import { AppStateMachine } from '../../src/app/state-machine';

describe('SceneManager', () => {
  let container: HTMLElement;
  let fsm: AppStateMachine;
  let sceneManager: SceneManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '<div id="app"></div>';
    container = document.getElementById('app')!;
    fsm = new AppStateMachine();
  });

  afterEach(() => {
    sceneManager?.dispose();
  });

  it('clamps devicePixelRatio to maximum of 1.75 on high-DPI displays (T-02-02)', () => {
    window.devicePixelRatio = 3.0; // Retina display simulation
    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    // Verify clamped pixel ratio
    expect(sceneManager.getPixelRatio()).toBe(1.75);
  });

  it('pauses render loop on document visibilitychange to hidden and resumes when visible', () => {
    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    // Simulate tab switch to background
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(sceneManager.isRenderLoopActive()).toBe(false);

    // Simulate returning to tab
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(sceneManager.isRenderLoopActive()).toBe(true);
  });

  it('restores WebGL context on webglcontextrestored event without unhandled crash', () => {
    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    const canvas = container.querySelector('canvas')!;
    const lostEvent = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(lostEvent);
    expect(lostEvent.defaultPrevented).toBe(true);

    const restoreEvent = new Event('webglcontextrestored');
    expect(() => canvas.dispatchEvent(restoreEvent)).not.toThrow();
  });
});
```

---

### 14. `tests/graphics/camera-rig.test.ts` (test, event-driven)

**Analog:** `tests/state/state-machine.test.ts:1-56`

**Vitest Camera Rig & FOV Compensation Test Pattern:**
```typescript
import { describe, it, expect } from 'vitest';
import { CameraRig } from '../../src/graphics/camera-rig';

describe('CameraRig', () => {
  it('preserves base 45 degree FOV for landscape viewports (aspect >= 1.0)', () => {
    const rig = new CameraRig(1920, 1080); // aspect = 1.777
    expect(rig.camera.fov).toBeCloseTo(45, 1);
  });

  it('dynamically expands vertical FOV for portrait viewports (aspect < 1.0) to preserve horizontal framing', () => {
    const rig = new CameraRig(390, 844); // iPhone 14 aspect = 0.462
    // vFov = 2 * atan(tan(22.5 deg) / 0.462) rad -> deg (~83.8 deg)
    expect(rig.camera.fov).toBeGreaterThan(75);
    expect(rig.camera.fov).toBeLessThan(90);
  });

  it('clamps parallax movement within safety bounds (±15 deg yaw, ±10 deg pitch)', () => {
    const rig = new CameraRig(390, 844);
    // Extreme input outside [-1, 1]
    rig.onPointerMove(5.0, 5.0);
    rig.update(0.016);

    // Camera rotation/position offsets should remain strictly bounded
    expect(Math.abs(rig.camera.position.x)).toBeLessThan(3.0);
    expect(Math.abs(rig.camera.position.y - 2.3)).toBeLessThan(2.0);
  });

  it('springs back to center upon pointer up event (auto-return)', () => {
    const rig = new CameraRig(390, 844);
    rig.onPointerMove(1.0, 1.0);
    rig.update(0.016);
    rig.onPointerUp();

    // After several update ticks, target parallax returns to 0
    for (let i = 0; i < 60; i++) {
      rig.update(0.016);
    }
    expect(rig.camera.position.x).toBeCloseTo(0, 0.1);
  });
});
```

---

### 15. `tests/graphics/procedural-diya.test.ts` (test, transform)

**Analog:** `tests/crypto/greeting-codec.test.ts:740-781`

**Vitest Diya Geometry & Anchor Verification Pattern:**
```typescript
import { describe, it, expect } from 'vitest';
import { createProceduralDiyaGeometry } from '../../src/graphics/meshes/procedural-diya-geometry';

describe('Procedural Diya Geometry', () => {
  it('generates a valid BufferGeometry with position and normal attributes', () => {
    const { geometry, wickAnchor } = createProceduralDiyaGeometry();
    expect(geometry.getAttribute('position')).toBeDefined();
    expect(geometry.getAttribute('normal')).toBeDefined();
    expect(geometry.getAttribute('position').count).toBeGreaterThan(500);
  });

  it('displaces vertex along +Z axis creating the pinched pouring spout', () => {
    const { geometry } = createProceduralDiyaGeometry();
    const pos = geometry.getAttribute('position');

    let maxZ = -Infinity;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      if (z > maxZ) maxZ = z;
    }

    // Unmodified base radius is ~1.25. Spout extends to >1.5 units
    expect(maxZ).toBeGreaterThan(1.5);
  });

  it('exports valid normalized WickAnchor coordinate for Phase 3 flame shader placement', () => {
    const { wickAnchor } = createProceduralDiyaGeometry();
    expect(wickAnchor.x).toBeCloseTo(0.0, 2);
    expect(wickAnchor.y).toBeGreaterThan(0.5); // Elevated above bowl floor
    expect(wickAnchor.z).toBeGreaterThan(1.2); // Pointing forward at the spout tip
  });
});
```

---

### 16. `tests/graphics/procedural-textures.test.ts` (test, transform)

**Analog:** `tests/crypto/greeting-codec.test.ts:740-781`

**Vitest Canvas PBR Texture Verification Pattern:**
```typescript
import { describe, it, expect } from 'vitest';
import { generateProceduralClayTextures } from '../../src/graphics/materials/procedural-textures';

describe('Procedural Textures Generator', () => {
  it('generates valid CanvasTexture instances for bump, roughness, and color maps', () => {
    const textures = generateProceduralClayTextures();

    expect(textures.bumpMap).toBeDefined();
    expect(textures.roughnessMap).toBeDefined();
    expect(textures.colorMap).toBeDefined();

    expect(textures.bumpMap.image).toBeInstanceOf(HTMLCanvasElement);
    expect(textures.bumpMap.image.width).toBe(512);
    expect(textures.bumpMap.image.height).toBe(512);
  });
});
```

---

## Shared Patterns

### 1. State Machine Subscription & Observer Teardown
**Source:** `src/app/state-machine.ts` (lines 90-101)  
**Apply to:** `src/graphics/scene-manager.ts`, `src/graphics/camera-rig.ts`  

All graphics subsystems that react to state changes (`UNLOCKED_INTRO`, `IGNITING`, `REPLAY`) MUST subscribe to `AppStateMachine` and return/retain an explicit unsubscription callback for teardown:

```typescript
const unsubscribe = this.fsm.subscribe((state: AppState) => {
  this.handleStateChange(state);
});
// When disposing:
unsubscribe();
```

---

### 2. Device Pixel Ratio (DPR) Clamping & GPU DoS Protection
**Source:** `02-RESEARCH.md` (lines 56-57, Pitfall 1) / `02-VALIDATION.md` (lines 41, 54)  
**Apply to:** `src/graphics/scene-manager.ts`  

To prevent GPU overheating, fill-rate bottlenecking, and thermal throttling on mobile Retina displays (e.g. 3.0x on iPhone Pro):

```typescript
const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
this.renderer.setPixelRatio(dpr);
```

---

### 3. GPU Resource Disposal Lifecycle
**Source:** `02-RESEARCH.md` (lines 683-688, Pitfall 5)  
**Apply to:** `src/graphics/scene-manager.ts`, `src/graphics/meshes/diya-mesh.ts`, `src/graphics/particles/bokeh-motes.ts`  

Every class allocating Three.js GPU resources (`BufferGeometry`, `Material`, `Texture`) must implement an explicit `.dispose()` method:

```typescript
public dispose(): void {
  this.geometry.dispose();
  if (Array.isArray(this.material)) {
    this.material.forEach(m => m.dispose());
  } else {
    this.material.dispose();
  }
}
```

---

### 4. Visibility API Battery & Power Resilience
**Source:** `02-RESEARCH.md` (lines 640-642, 921-922, D-16)  
**Apply to:** `src/graphics/scene-manager.ts`  

Listen for `document.visibilitychange` to halt `requestAnimationFrame` when the user leaves the tab, preventing battery exhaustion and background GPU usage on mobile:

```typescript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    this.pauseRenderLoop();
  } else {
    this.resumeRenderLoop();
  }
});
```

---

### 5. WebGL Context Loss & Restoration Handlers
**Source:** `02-RESEARCH.md` (lines 665-670, Pitfall 2)  
**Apply to:** `src/graphics/scene-manager.ts`  

```typescript
canvas.addEventListener('webglcontextlost', (event: Event) => {
  event.preventDefault(); // Tells browser we plan to restore context
  this.pauseRenderLoop();
});

canvas.addEventListener('webglcontextrestored', () => {
  this.rebuildScene();
  this.resumeRenderLoop();
});
```

---

## No Analog Found

Every new and modified file in Phase 2 has a concrete analog in the git-tracked codebase or established Phase 1 patterns. Where domain-specific Three.js constructs are introduced (such as `THREE.LatheGeometry` and `CanvasTexture`), their structural patterns (buffers, event handling, lifecycle hooks, and testing) follow the existing paradigms in `src/crypto/greeting-codec.ts`, `src/audio/audio-unlock.ts`, and `src/ui/passcode-gate.ts`.

---

## Metadata

**Analog search scope:** `src/**/*.ts`, `tests/**/*.test.ts`, `package.json`, `index.html`  
**Files scanned:** 19  
**Pattern extraction date:** 2026-11-04  
