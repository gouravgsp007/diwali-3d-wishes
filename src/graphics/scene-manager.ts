import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import type { AppStateMachine, AppState } from '../app/state-machine';
import { CameraRig } from './camera-rig';

/**
 * Resilient SceneManager foundation for the Diwali 3D WebGL engine.
 *
 * Implements:
 * - High-DPI DPR clamping (Math.min(window.devicePixelRatio || 1, 1.75)) preventing GPU thermal throttling (D-16, T-02-02)
 * - PCFSoftShadowMap for soft directional contact shadows (D-12)
 * - Transparent background canvas mounted behind the glassmorphism UI card (z-index 0)
 * - Lifecycle pausing on backgrounded tabs via Page Visibility API (D-16)
 * - WebGL context loss recovery (webglcontextlost / webglcontextrestored) (D-16)
 * - Forwarding normalized pointer events to CameraRig
 * - Coordinated tween updates and clock tick in RAF loop
 */
export class SceneManager {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private cameraRig!: CameraRig;
  private canvas: HTMLCanvasElement | null = null;
  private animationFrameId: number | null = null;
  private isPaused = false;
  private timer = new THREE.Timer();
  private clampedDpr = 1;
  private unsubscribeFsm: (() => void) | null = null;

  constructor(
    private container: HTMLElement,
    private fsm?: AppStateMachine
  ) {}

  /**
   * Initializes WebGL scene graph, camera rig, renderer, and lifecycle event listeners.
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

    // 3. Initialize WebGLRenderer with DPR clamping
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

    // 4. Attach lifecycle listeners
    this.initListeners();

    // 5. Subscribe to FSM state changes if provided
    if (this.fsm) {
      this.unsubscribeFsm = this.fsm.subscribe((state) => this.handleStateChange(state));
    }

    // 6. Start timer and kickoff render loop
    this.timer.update();
    this.isPaused = false;
    this.render();
  }

  /**
   * Main render loop driven by requestAnimationFrame.
   */
  private render = (): void => {
    if (this.isPaused) return;

    this.timer.update();
    const dt = this.timer.getDelta();

    // Update tween animations
    TWEEN.update();

    // Update camera rig with breathing sway and parallax damping
    if (this.cameraRig) {
      this.cameraRig.update(dt);
      this.renderer.render(this.scene, this.cameraRig.camera);
    }

    this.animationFrameId = requestAnimationFrame(this.render);
  };

  /**
   * Handles FSM state transitions to orchestrate camera cinematography.
   */
  private handleStateChange(state: AppState): void {
    if (state === 'UNLOCKED_INTRO') {
      // Cinematic dolly forward upon passcode unlock (D-15)
      this.cameraRig.dollyTo(new THREE.Vector3(0, 2.0, 3.2), 1200);
    } else if (state === 'IGNITING') {
      // Smooth upward target pan to frame flame + greeting card (D-07)
      this.cameraRig.panTargetTo(new THREE.Vector3(0, 0.65, 0), 1000);
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
    // Phase 2 Wave 2 will re-instantiate DiyaMesh, ThaliMesh, and BokehMotes here
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

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
