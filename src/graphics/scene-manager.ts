import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import type { AppStateMachine, AppState } from '../app/state-machine';
import { CameraRig } from './camera-rig';
import { DiyaMesh } from './meshes/diya-mesh';
import { createBrassThaliMesh } from './meshes/thali-mesh';
import { createLightingRig, type LightingRigResult } from './lighting-rig';
import { BokehMotes } from './particles/bokeh-motes';
import { FlameController } from './fx/flame-controller';

/**
 * Resilient SceneManager foundation for the Diwali 3D WebGL engine.
 *
 * Implements:
 * - High-DPI DPR clamping (Math.min(window.devicePixelRatio || 1, 1.75)) preventing GPU thermal throttling (D-16, T-02-02)
 * - PCFSoftShadowMap for soft directional contact shadows (D-12)
 * - Transparent background canvas mounted behind the glassmorphism UI card (z-index 0)
 * - Authentic 3D DiyaMesh, brass thali platter, and 50 drifting golden bokeh motes (D-01, D-09, D-11)
 * - Dual-tier nocturnal lighting baseline with pre-warmed flame PointLight (D-10, T-02-04)
 * - Lifecycle pausing on backgrounded tabs via Page Visibility API (D-16)
 * - WebGL context loss recovery (webglcontextlost / webglcontextrestored) (D-16)
 * - Forwarding normalized pointer events to CameraRig
 * - Coordinated tween updates and clock tick in RAF loop
 * - Camera dolly on UNLOCKED_INTRO and upward pan on IGNITING (D-07, D-15)
 */
export class SceneManager {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private cameraRig!: CameraRig;
  private canvas: HTMLCanvasElement | null = null;
  private animationFrameId: number | null = null;
  private isPaused = false;
  private timer = new THREE.Timer();
  private elapsedTime = 0;
  private clampedDpr = 1;
  private unsubscribeFsm: (() => void) | null = null;

  private diyaMesh: DiyaMesh | null = null;
  private thaliMesh: THREE.Mesh | null = null;
  private lightingRig: LightingRigResult | null = null;
  private bokehMotes: BokehMotes | null = null;
  private flameController: FlameController | null = null;

  constructor(
    private container: HTMLElement,
    private fsm?: AppStateMachine
  ) {}

  /**
   * Initializes WebGL scene graph, camera rig, renderer, meshes, lights, and lifecycle event listeners.
   */
  public start(): void {
    this.scene = new THREE.Scene();

    // 1. Mount canvas into container behind UI
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'absolute inset-0 w-full h-full pointer-events-auto touch-none -z-0';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.zIndex = '0';
    this.canvas.style.touchAction = 'none';
    this.container.appendChild(this.canvas);

    // 2. Initialize CameraRig
    const width = this.container.clientWidth || window.innerWidth || 800;
    const height = this.container.clientHeight || window.innerHeight || 600;
    this.cameraRig = new CameraRig(width, height);

    // 3. Initialize WebGLRenderer with DPR clamping (D-16, T-02-02)
    this.clampedDpr = Math.min(window.devicePixelRatio || 1, 1.75);

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      // Headless / Happy-DOM fallback for test environments lacking WebGL
      let currentRatio = this.clampedDpr;
      this.renderer = {
        domElement: this.canvas,
        shadowMap: { enabled: false, type: THREE.BasicShadowMap },
        setPixelRatio: (r: number) => {
          currentRatio = r;
        },
        getPixelRatio: () => currentRatio,
        setSize: () => {},
        render: () => {},
        dispose: () => {},
        compile: () => {},
      } as unknown as THREE.WebGLRenderer;
    }

    this.renderer.setPixelRatio(this.clampedDpr);
    this.renderer.setSize(width, height);

    // Enable soft PCF shadows (D-12)
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Build 3D scene elements: DiyaMesh, Thali, LightingRig, BokehMotes
    this.buildSceneComponents();

    // 5. Pre-warm WebGL shader compilation (T-02-04)
    try {
      if (typeof this.renderer?.compile === 'function') {
        this.renderer.compile(this.scene, this.cameraRig.camera);
      }
    } catch {
      // Ignored in test/headless environments lacking WebGL context
    }

    // 6. Attach lifecycle listeners
    this.initListeners();

    // 7. Subscribe to FSM state changes if provided
    if (this.fsm) {
      this.unsubscribeFsm = this.fsm.subscribe((state) => this.handleStateChange(state));
    }

    // 8. Start timer and kickoff render loop
    this.timer.update();
    this.elapsedTime = 0;
    this.isPaused = false;
    this.render();
  }

  /**
   * Instantiates and adds DiyaMesh, brass thali, dual-tier lighting, and bokeh motes to scene graph.
   */
  private buildSceneComponents(): void {
    // 1. Procedural Diya Mesh (D-01, D-02, D-04)
    this.diyaMesh = new DiyaMesh();
    this.scene.add(this.diyaMesh.group);

    // 2. Antique Brass Thali Platter (D-09, D-12)
    this.thaliMesh = createBrassThaliMesh();
    this.scene.add(this.thaliMesh);

    // 3. Dual-Tier Lighting Rig with pre-warmed PointLight (D-10, T-02-04)
    this.lightingRig = createLightingRig(this.diyaMesh.wickAnchor);
    this.scene.add(this.lightingRig.ambientLight);
    this.scene.add(this.lightingRig.rimLight);
    this.scene.add(this.lightingRig.flamePointLight);

    // 4. Drifting Golden Bokeh Motes (D-11)
    this.bokehMotes = new BokehMotes();
    this.scene.add(this.bokehMotes.points);

    // 5. Procedural GLSL Flame Controller & Particle Systems (D-12)
    this.flameController = new FlameController(this.diyaMesh.wickAnchor, this.lightingRig.flamePointLight);
    this.scene.add(this.flameController.group);
  }

  /**
   * Main render loop driven by requestAnimationFrame.
   */
  private render = (): void => {
    if (this.isPaused) return;

    this.timer.update();
    const dt = this.timer.getDelta();
    this.elapsedTime += dt;

    // Update tween animations
    TWEEN.update();

    // Update bokeh motes particle drift (D-11)
    if (this.bokehMotes) {
      this.bokehMotes.update(dt, this.elapsedTime);
    }

    // Update flame controller (shader waft, halo breathing, sparkler kinematics, light jitter) (D-12)
    if (this.flameController) {
      this.flameController.update(dt, this.elapsedTime);
    }

    // Update camera rig with breathing sway and parallax damping
    if (this.cameraRig) {
      this.cameraRig.update(dt);
      this.renderer.render(this.scene, this.cameraRig.camera);
    }

    this.animationFrameId = requestAnimationFrame(this.render);
  };

  /**
   * Handles FSM state transitions to orchestrate camera cinematography (D-07, D-15).
   */
  private handleStateChange(state: AppState): void {
    if (state === 'UNLOCKED_INTRO') {
      // Cinematic dolly forward upon passcode unlock (D-15)
      this.cameraRig?.dollyTo(new THREE.Vector3(0, 2.0, 3.2), 1200);
    } else if (state === 'IGNITING') {
      // Smooth upward target pan to frame flame + greeting card (D-07)
      this.cameraRig?.panTargetTo(new THREE.Vector3(0, 0.65, 0), 1000);
      this.flameController?.ignite().then(() => {
        this.fsm?.transition({ type: 'IGNITION_COMPLETE' });
      });
    }
  }

  /**
   * Wires viewport resize, visibility change, WebGL context, and pointer interaction listeners.
   */
  private initListeners(): void {
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    if (this.canvas) {
      this.canvas.addEventListener('webglcontextlost', this.onContextLost);
      this.canvas.addEventListener('webglcontextrestored', this.onContextRestored);
    }

    this.container.addEventListener('pointermove', this.onPointerMove);
    this.container.addEventListener('pointerup', this.onPointerUp);
    this.container.addEventListener('pointercancel', this.onPointerUp);
  }

  private onResize = (): void => {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / height;

    if (this.cameraRig) {
      this.cameraRig.updateFov(aspect);
    }
    if (this.renderer) {
      this.renderer.setSize(width, height);
    }
  };

  private onVisibilityChange = (): void => {
    if (document.hidden) {
      this.pauseRenderLoop();
    } else {
      this.resumeRenderLoop();
    }
  };

  private onContextLost = (event: Event): void => {
    event.preventDefault(); // Informs the browser we intend to restore context
    this.pauseRenderLoop();
  };

  private onContextRestored = (): void => {
    this.rebuildScene();
    this.resumeRenderLoop();
  };

  private onPointerMove = (event: PointerEvent | MouseEvent | TouchEvent): void => {
    let clientX = 0;
    let clientY = 0;

    if ('touches' in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if ('clientX' in event) {
      clientX = (event as MouseEvent).clientX;
      clientY = (event as MouseEvent).clientY;
    }

    const rect = this.container.getBoundingClientRect();
    const width = rect.width || window.innerWidth || 1;
    const height = rect.height || window.innerHeight || 1;

    // Normalize coordinates to [-1, 1] range
    const normalizedX = ((clientX - rect.left) / width) * 2 - 1;
    const normalizedY = -(((clientY - rect.top) / height) * 2 - 1);

    this.cameraRig?.onPointerMove(normalizedX, normalizedY);
  };

  private onPointerUp = (): void => {
    this.cameraRig?.onPointerUp();
  };

  /**
   * Pauses requestAnimationFrame rendering loop to conserve battery/GPU.
   */
  public pauseRenderLoop(): void {
    this.isPaused = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Resumes requestAnimationFrame rendering loop.
   */
  public resumeRenderLoop(): void {
    if (!this.isPaused && this.animationFrameId !== null) return;
    this.isPaused = false;
    this.timer.update();
    this.render();
  }

  /**
   * Reconstructs scene graph assets upon WebGL context restoration.
   */
  public rebuildScene(): void {
    if (!this.scene) return;

    this.disposeSceneComponents();
    this.buildSceneComponents();

    try {
      if (typeof this.renderer?.compile === 'function') {
        this.renderer.compile(this.scene, this.cameraRig.camera);
      }
    } catch {
      // Ignored in test/headless environments
    }
  }

  private disposeSceneComponents(): void {
    if (this.diyaMesh) {
      this.scene.remove(this.diyaMesh.group);
      this.diyaMesh.dispose();
      this.diyaMesh = null;
    }

    if (this.thaliMesh) {
      this.scene.remove(this.thaliMesh);
      this.thaliMesh.geometry.dispose();
      if (Array.isArray(this.thaliMesh.material)) {
        this.thaliMesh.material.forEach((m) => m.dispose());
      } else {
        this.thaliMesh.material.dispose();
      }
      this.thaliMesh = null;
    }

    if (this.lightingRig) {
      this.scene.remove(this.lightingRig.ambientLight);
      this.scene.remove(this.lightingRig.rimLight);
      this.scene.remove(this.lightingRig.flamePointLight);
      this.lightingRig = null;
    }

    if (this.bokehMotes) {
      this.scene.remove(this.bokehMotes.points);
      this.bokehMotes.dispose();
      this.bokehMotes = null;
    }

    if (this.flameController) {
      this.scene.remove(this.flameController.group);
      this.flameController.dispose();
      this.flameController = null;
    }
  }

  public getPixelRatio(): number {
    return this.clampedDpr;
  }

  public isRenderLoopActive(): boolean {
    return !this.isPaused && this.animationFrameId !== null;
  }

  public getCameraRig(): CameraRig {
    return this.cameraRig;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getDiyaMesh(): DiyaMesh | null {
    return this.diyaMesh;
  }

  public getThaliMesh(): THREE.Mesh | null {
    return this.thaliMesh;
  }

  public getLightingRig(): LightingRigResult | null {
    return this.lightingRig;
  }

  public getBokehMotes(): BokehMotes | null {
    return this.bokehMotes;
  }

  public getFlameController(): FlameController | null {
    return this.flameController;
  }

  /**
   * Cleans up event listeners, stops animation loops, and disposes GPU resources.
   */
  public dispose(): void {
    this.pauseRenderLoop();

    if (this.unsubscribeFsm) {
      this.unsubscribeFsm();
      this.unsubscribeFsm = null;
    }

    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    if (this.canvas) {
      this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
      this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
      this.canvas.remove();
      this.canvas = null;
    }

    this.container.removeEventListener('pointermove', this.onPointerMove);
    this.container.removeEventListener('pointerup', this.onPointerUp);
    this.container.removeEventListener('pointercancel', this.onPointerUp);

    this.disposeSceneComponents();

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
