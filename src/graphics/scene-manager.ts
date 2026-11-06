import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import type { AppStateMachine, AppState } from '../app/state-machine';
import { CameraRig } from './camera-rig';
import { DiyaMesh } from './meshes/diya-mesh';
import { createBrassThaliMesh } from './meshes/thali-mesh';
import { createRangoliMesh } from './meshes/rangoli-mesh';
import { createMarigoldRingMesh } from './meshes/marigold-mesh';
import { createFestiveLanterns, type FestiveLanternsHolder } from './meshes/lantern-mesh';
import { createLightingRig, type LightingRigResult } from './lighting-rig';
import { BokehMotes } from './particles/bokeh-motes';
import { FlameController } from './fx/flame-controller';
import { TouchController } from '../interaction/touch-controller';
import { WickProximityDetector } from '../interaction/proximity-detector';
import { TouchHint } from '../interaction/touch-hint';
import { AudioEngine } from '../audio/audio-engine';
import { GreetingModal } from '../ui/greeting-modal';
import { CelebrationManager } from '../fx/celebration-manager';
import { Starfield } from './fx/starfield';
import { InteractiveSparkler } from './fx/interactive-sparkler';
import { SkyLanternsManager } from './fx/sky-lanterns-manager';
import { FlowerShower } from './fx/flower-shower';
import { SweetBox } from './meshes/sweet-box';
import type { ExperienceTheme } from '../themes/experience-theme.interface';
import { ThemeRegistry } from '../themes/theme-registry';

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
  private rangoliMesh: THREE.Mesh | null = null;
  private marigoldMesh: THREE.Group | null = null;
  private lanterns: FestiveLanternsHolder | null = null;
  private lightingRig: LightingRigResult | null = null;
  private bokehMotes: BokehMotes | null = null;
  private flameController: FlameController | null = null;
  private touchController: TouchController | null = null;
  private touchHint: TouchHint | null = null;
  private matchFollower: THREE.Object3D | null = null;
  private celebrationTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private celebrationManager: CelebrationManager | null = null;
  private greetingModal: GreetingModal | null = null;
  private headerFireworksBtn: HTMLElement | null = null;
  private onHeaderFireworksClick: (() => void) | null = null;

  private starfield: Starfield | null = null;
  private sparkler: InteractiveSparkler | null = null;
  private onSparklerStateChange?: (active: boolean) => void;
  private skyLanternsManager: SkyLanternsManager | null = null;
  private flowerShower: FlowerShower | null = null;
  private sweetBox: SweetBox | null = null;
  private onSweetBoxToggled?: (isOpen: boolean) => void;
  private tapRaycaster = new THREE.Raycaster();
  private tapPointerNdc = new THREE.Vector2();
  private tapStartPos = { x: 0, y: 0, time: 0 };
  private theme: ExperienceTheme | null = null;

  constructor(
    private container: HTMLElement,
    private fsm?: AppStateMachine,
    private activeTheme?: ExperienceTheme
  ) {}

  /**
   * Initializes WebGL scene graph, camera rig, renderer, meshes, lights, and lifecycle event listeners.
   */
  public start(): void {
    this.scene = new THREE.Scene();

    // 0. Resolve active theme (from constructor, URL query, or greeting payload)
    const greeting = this.fsm?.getGreeting();
    const queryTheme = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('theme') : null;
    this.theme = this.activeTheme || ThemeRegistry.getInstance().resolve(greeting?.templateId, queryTheme);

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
    if (!this.theme || this.theme.id === 'diwali') {
      // 1. Procedural Diya Mesh (D-01, D-02, D-04)
      this.diyaMesh = new DiyaMesh();
      this.scene.add(this.diyaMesh.group);

      // 2. Antique Brass Thali Platter (D-09, D-12)
      this.thaliMesh = createBrassThaliMesh();
      this.scene.add(this.thaliMesh);

      // 2b. Sacred Golden & Crimson Rangoli Floor Mandala
      this.rangoliMesh = createRangoliMesh();
      this.scene.add(this.rangoliMesh);

      // 2c. Fresh 3D Marigold Garland (Genda Phool) Ring
      this.marigoldMesh = createMarigoldRingMesh();
      this.scene.add(this.marigoldMesh);

      // 2d. Floating Indian Festive Lanterns (Akash Kandil)
      this.lanterns = createFestiveLanterns();
      this.scene.add(this.lanterns.group);

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

      // 12. Celestial Twinkling Starfield with Shooting Stars
      this.starfield = new Starfield();
      this.scene.add(this.starfield.group);

      // 13. Akash Kandil (Sky Lanterns) Ceremony Manager
      this.skyLanternsManager = new SkyLanternsManager();
      this.scene.add(this.skyLanternsManager.group);

      // 14. Royal Flower Petal Shower (Pushpa Vrishti)
      this.flowerShower = new FlowerShower();
      this.scene.add(this.flowerShower.group);

      // 15. Handheld Phuljhadi (Diwali Sparkler) System
      this.sparkler = new InteractiveSparkler((pos) => {
        if (this.fsm?.getState() === 'INTERACTIVE_UNLIT') {
          const dist = pos.distanceTo(this.diyaMesh?.wickAnchor || new THREE.Vector3(0, 0.68, 1.38));
          if (dist < 1.2) {
            AudioEngine.getInstance().playMatchStrike();
            AudioEngine.getInstance().playFlameCrackle();
            this.fsm?.transition({ type: 'WICK_TOUCHED' });
          }
        }
      });
      this.scene.add(this.sparkler.group);

      // 16. Royal Mithai / Gift Sweet Box
      this.sweetBox = new SweetBox();
      this.scene.add(this.sweetBox.group);
    } else {
      // Non-Diwali Theme: Mount procedural 3D centerpiece & theme components
      this.theme.init(this.scene, this.cameraRig);

      const target = this.theme.getInteractionTarget();
      const anchor = target?.hintPosition || new THREE.Vector3(0, 0.5, 0);

      this.lightingRig = createLightingRig(anchor);
      this.scene.add(this.lightingRig.ambientLight);
      this.scene.add(this.lightingRig.rimLight);
      this.scene.add(this.lightingRig.flamePointLight);

      this.bokehMotes = new BokehMotes();
      this.scene.add(this.bokehMotes.points);

      this.starfield = new Starfield();
      this.scene.add(this.starfield.group);

      this.sweetBox = new SweetBox();
      this.scene.add(this.sweetBox.group);
    }

    const proximityAnchor = (this.theme && this.theme.id !== 'diwali')
      ? (this.theme.getInteractionTarget()?.hintPosition || new THREE.Vector3(0, 0.6, 0))
      : (this.diyaMesh?.wickAnchor || new THREE.Vector3(0, 0.68, 1.38));

    // 6. Interactive Touch Hint Prompt with 1-Tap Action Fallback (D-03)
    this.touchHint = new TouchHint(() => {
      if (!this.theme || this.theme.id === 'diwali') {
        AudioEngine.getInstance().playMatchStrike();
        AudioEngine.getInstance().playFlameCrackle();
      }
      this.fsm?.transition({ type: 'WICK_TOUCHED' });
    });
    this.touchHint.mount(this.container);
    if (this.theme) {
      this.touchHint.updatePrompt(
        this.theme.getActionButtonText(),
        this.theme.getPromptText(),
        this.theme.emoji
      );
    }

    // 7. Virtual Match Follower 3D Mesh (D-01)
    this.matchFollower = this.createMatchFollower();

    // 8. Screen-to-World Touch Gesture Controller (D-01, D-02)
    this.touchController = new TouchController(
      this.container,
      this.cameraRig,
      this.matchFollower,
      () => {
        if (!this.theme || this.theme.id === 'diwali') {
          AudioEngine.getInstance().playMatchStrike();
          AudioEngine.getInstance().playFlameCrackle();
        }
        this.fsm?.transition({ type: 'WICK_TOUCHED' });
      },
      () => {
        this.touchHint?.hide();
      },
      new WickProximityDetector(proximityAnchor, 1.20)
    );
    this.touchController.setEnabled(this.fsm?.getState() === 'INTERACTIVE_UNLIT');

    // 9. Opulent Glassmorphic Greeting Modal (D-01, D-02)
    this.greetingModal = new GreetingModal();
    this.greetingModal.mount(this.container);

    // 10. Festive Celebration Manager with dual cannons & tap-to-sparkle (D-04, D-05)
    this.celebrationManager = new CelebrationManager();

    // 11. Wire interactive fireworks trigger in top header
    this.headerFireworksBtn = document.getElementById('header-fireworks-btn');
    if (this.headerFireworksBtn) {
      this.onHeaderFireworksClick = () => {
        this.celebrationManager?.fireCelebrationBurst();
      };
      this.headerFireworksBtn.addEventListener('click', this.onHeaderFireworksClick);
    }
  }

  /**
   * Builds virtual festive match follower stick with glowing ember tip and warm light (D-01).
   */
  private createMatchFollower(): THREE.Object3D {
    const group = new THREE.Group();

    // Slender wooden matchstick cylinder (radius: 0.02, height: 0.40, radialSegments: 12)
    const stickGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.40, 12);
    const stickMat = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      roughness: 0.8,
    });
    const stick = new THREE.Mesh(stickGeo, stickMat);
    stick.position.set(0, -0.20, 0); // Tip aligns with group origin (0, 0, 0)
    group.add(stick);

    // Glowing ember tip sphere (radius: 0.06, widthSegments: 16, heightSegments: 16)
    const tipGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const tipMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
    });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    group.add(tip);

    // Outer golden flame aura (radius: 0.12)
    const haloGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffaa22,
      transparent: true,
      opacity: 0.5,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    group.add(halo);

    // Warm luminescent point light
    const light = new THREE.PointLight(0xffaa33, 1.2, 1.8);
    group.add(light);

    group.visible = false;
    this.scene.add(group);
    return group;
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

    // Update floating background lanterns sway
    if (this.lanterns) {
      this.lanterns.update(this.elapsedTime);
    }

    // Update flame controller (shader waft, halo breathing, sparkler kinematics, light jitter) (D-12)
    if (this.flameController) {
      this.flameController.update(dt, this.elapsedTime);
    }

    // Update celestial starfield & shooting stars
    if (this.starfield) {
      this.starfield.update(dt, this.elapsedTime);
    }

    // Update ascending sky lanterns
    if (this.skyLanternsManager) {
      this.skyLanternsManager.update(dt, this.elapsedTime);
    }

    // Update flower petal shower
    if (this.flowerShower) {
      this.flowerShower.update(dt, this.elapsedTime);
    }

    // Update interactive sparkler
    if (this.sparkler) {
      this.sparkler.update(dt, this.elapsedTime);
    }

    // Update active theme if non-Diwali
    if (this.theme && this.theme.id !== 'diwali') {
      this.theme.update(dt, this.elapsedTime);
    }

    // Update camera rig with breathing sway and parallax damping
    if (this.cameraRig) {
      this.cameraRig.update(dt);
      this.renderer.render(this.scene, this.cameraRig.camera);
    }

    this.animationFrameId = requestAnimationFrame(this.render);
  };

  /**
   * Handles FSM state transitions to orchestrate camera cinematography and interaction (D-03, D-05, D-07, D-08, D-15).
   */
  private handleStateChange(state: AppState): void {
    if (state !== 'LIT_CELEBRATION' && this.celebrationTimeoutId) {
      clearTimeout(this.celebrationTimeoutId);
      this.celebrationTimeoutId = null;
    }

    if (state === 'UNLOCKED_INTRO') {
      this.touchController?.setEnabled(false);
      this.greetingModal?.hide();
      this.celebrationManager?.stopAutoFireworks();
      this.celebrationManager?.setActive(false);

      // Check if greeting payload dictates theme switch
      const templateId = this.fsm?.getGreeting()?.templateId;
      if (templateId) {
        const resolved = ThemeRegistry.getInstance().resolve(templateId);
        if (resolved.id !== this.theme?.id) {
          this.switchTheme(resolved);
        }
      }

      // Start BGM playback with 2-second volume fade-in (D-05)
      AudioEngine.getInstance().startBgm();

      // Cinematic dolly forward upon passcode unlock (D-15)
      const targetPos = this.theme ? this.theme.visualConfig.cameraBasePos : new THREE.Vector3(0, 2.0, 3.2);
      this.cameraRig?.dollyTo(targetPos, 1200)?.then(() => {
        this.fsm?.transition({ type: 'INTRO_COMPLETE' });
      });
    } else if (state === 'INTERACTIVE_UNLIT') {
      // Enable touch drag and show touch hint prompt (D-01, D-03)
      this.touchController?.reset();
      this.touchController?.setEnabled(true);
      if (this.theme) {
        this.touchHint?.updatePrompt(
          this.theme.getActionButtonText(),
          this.theme.getPromptText(),
          this.theme.emoji
        );
      }
      this.touchHint?.show();
    } else if (state === 'IGNITING') {
      this.touchController?.setEnabled(false);
      // Hide touch hint and ensure match follower is hidden (D-03, D-08)
      this.touchHint?.hide();
      if (this.matchFollower) {
        this.matchFollower.visible = false;
      }

      // Smooth upward target pan to frame flame + greeting card (D-07)
      const panTarget = this.theme ? this.theme.visualConfig.cameraLookAt : new THREE.Vector3(0, 0.65, 0);
      this.cameraRig?.panTargetTo(panTarget, 1000);

      const actionPromise = (!this.theme || this.theme.id === 'diwali')
        ? this.flameController?.ignite()
        : this.theme.triggerAction();

      actionPromise?.then(() => {
        this.fsm?.transition({ type: 'IGNITION_COMPLETE' });
      });
    } else if (state === 'LIT_CELEBRATION') {
      // Automatically burst fireworks every 2-3 seconds continuously once the diya lights up!
      this.celebrationManager?.startAutoFireworks(2500);

      this.theme?.onCelebrationStart();

      // 1500ms celebratory pause before transitioning to GREETING_REVEAL per D-01
      if (this.celebrationTimeoutId) {
        clearTimeout(this.celebrationTimeoutId);
      }
      this.celebrationTimeoutId = setTimeout(() => {
        this.celebrationTimeoutId = null;
        this.fsm?.transition({ type: 'CELEBRATION_COMPLETE' });
      }, 1500);
    } else if (state === 'GREETING_REVEAL') {
      if (this.celebrationTimeoutId) {
        clearTimeout(this.celebrationTimeoutId);
        this.celebrationTimeoutId = null;
      }

      // Smooth camera dolly and pan target to frame centerpiece in upper half so it remains gloriously visible above greeting card
      const revPos = this.theme ? this.theme.visualConfig.revealedCameraPos : new THREE.Vector3(0, 2.5, 4.4);
      const revLook = this.theme ? this.theme.visualConfig.revealedCameraLookAt : new THREE.Vector3(0, -1.0, 0);
      this.cameraRig?.dollyTo(revPos, 1200);
      this.cameraRig?.panTargetTo(revLook, 1200);

      // Launch celebratory golden confetti cannons (D-04)
      this.celebrationManager?.fireCelebrationBurst();

      // Ensure recurring fireworks continue every 2-3s
      if (!this.celebrationManager?.isAutoFireworksActive()) {
        this.celebrationManager?.startAutoFireworks(2500);
      }

      // Reveal greeting modal with decrypted payload (D-01, D-02)
      this.greetingModal?.show(this.fsm?.getGreeting() ?? null);

      // Enable interactive background screen tap sparkles (D-05, VFX-05)
      this.celebrationManager?.setActive(true);
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

    this.container.addEventListener('pointerdown', this.onPointerDown);
    this.container.addEventListener('pointermove', this.onPointerMove);
    this.container.addEventListener('pointerup', this.onPointerUp);
    this.container.addEventListener('pointercancel', this.onPointerCancel);
    window.addEventListener('pointermove', this.onWindowPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerCancel);
  }

  private onResize = (): void => {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / height;

    // Maintain clamped DPR on resize (D-03, DIYA-03)
    this.clampedDpr = Math.min(window.devicePixelRatio || 1, 1.75);
    if (this.renderer) {
      this.renderer.setPixelRatio(this.clampedDpr);
      this.renderer.setSize(width, height);
    }
    if (this.cameraRig) {
      this.cameraRig.updateFov(aspect);
    }
  };

  private onVisibilityChange = (): void => {
    if (document.hidden) {
      this.pauseRenderLoop();
      this.celebrationManager?.stopAutoFireworks();
    } else {
      this.resumeRenderLoop();
      const state = this.fsm?.getState();
      if (state === 'LIT_CELEBRATION' || state === 'GREETING_REVEAL') {
        this.celebrationManager?.startAutoFireworks(2500);
      }
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

  private onPointerDown = (event: PointerEvent | MouseEvent | TouchEvent): void => {
    let clientX = 0;
    let clientY = 0;
    if ('touches' in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if ('clientX' in event) {
      clientX = (event as MouseEvent).clientX;
      clientY = (event as MouseEvent).clientY;
    }
    this.tapStartPos = { x: clientX, y: clientY, time: Date.now() };
    this.onPointerMove(event);
  };

  private onWindowPointerMove = (event: PointerEvent | MouseEvent | TouchEvent): void => {
    // If target is inside container, container's own pointermove already handled it
    if (event.target && this.container.contains(event.target as Node)) {
      return;
    }
    if (this.sparkler?.getActive() && this.cameraRig) {
      this.onPointerMove(event);
    }
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

    if (this.sparkler?.getActive()) {
      this.sparkler.updatePointer(clientX, clientY, this.container, this.cameraRig);
    }
  };

  private onPointerCancel = (): void => {
    this.cameraRig?.onPointerUp();
    if (this.sparkler?.getActive()) {
      this.setSparklerActive(false);
    }
    this.tapStartPos = { x: 0, y: 0, time: 0 };
  };

  private onPointerUp = (event?: PointerEvent | MouseEvent | TouchEvent): void => {
    this.cameraRig?.onPointerUp();
    if (this.sparkler?.getActive()) {
      this.setSparklerActive(false);
    }

    // Direct 3D tap interaction on the sweet box
    if (event && this.sweetBox && this.cameraRig?.camera) {
      // Disregard tap if event originated from a UI element overlaying the canvas
      if (event.target && event.target !== this.canvas && event.target !== this.container) {
        this.tapStartPos = { x: 0, y: 0, time: 0 };
        return;
      }

      let clientX = 0;
      let clientY = 0;
      if ('changedTouches' in event && event.changedTouches.length > 0) {
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
      } else if ('clientX' in event) {
        clientX = (event as MouseEvent).clientX;
        clientY = (event as MouseEvent).clientY;
      }

      const elapsed = this.tapStartPos.time > 0 ? Date.now() - this.tapStartPos.time : 999999;
      const dist = Math.hypot(clientX - this.tapStartPos.x, clientY - this.tapStartPos.y);

      // Immediately clear tap tracking to prevent duplicate bubbling invocations
      this.tapStartPos = { x: 0, y: 0, time: 0 };

      if (elapsed < 400 && dist < 16) {
        const rect = this.container.getBoundingClientRect();
        const width = rect.width || window.innerWidth || 1;
        const height = rect.height || window.innerHeight || 1;
        this.tapPointerNdc.x = ((clientX - rect.left) / width) * 2 - 1;
        this.tapPointerNdc.y = -(((clientY - rect.top) / height) * 2 - 1);

        this.tapRaycaster.setFromCamera(this.tapPointerNdc, this.cameraRig.camera);
        const hits = this.tapRaycaster.intersectObjects(this.sweetBox.getRaycastTargets(), true);
        if (hits.length > 0) {
          const isOpen = this.triggerSweetBox();
          this.onSweetBoxToggled?.(isOpen);
        }
      }
    }
  };

  /**
   * Forwards pointer moves from overlay UI buttons (e.g. sparkler hold-and-drag).
   */
  public handlePointerMove(event: PointerEvent | MouseEvent | TouchEvent): void {
    this.onPointerMove(event);
  }

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
   * State-aware: restores lit flame, halo, point light, and modal state
   * if context loss occurred while the diya was lit (D-04, DIYA-04).
   */
  public rebuildScene(): void {
    if (!this.scene) return;

    const currentState = this.fsm?.getState();

    this.disposeSceneComponents();
    this.buildSceneComponents();

    // State-aware restoration (DIYA-04)
    if (currentState === 'LIT_CELEBRATION' || currentState === 'GREETING_REVEAL') {
      // Restore lit flame and halo
      this.flameController?.ignite();
      this.touchHint?.hide();
      if (this.matchFollower) {
        this.matchFollower.visible = false;
      }

      if (currentState === 'GREETING_REVEAL') {
        this.cameraRig?.panTargetTo(new THREE.Vector3(0, 0.85, 0), 0);
        this.greetingModal?.show(this.fsm?.getGreeting() ?? null);
        this.celebrationManager?.setActive(true);
      }
    } else if (currentState === 'INTERACTIVE_UNLIT') {
      this.touchHint?.show();
    } else if (currentState === 'IGNITING') {
      this.flameController?.ignite().then(() => {
        this.fsm?.transition({ type: 'IGNITION_COMPLETE' });
      });
    }

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

    if (this.rangoliMesh) {
      this.scene.remove(this.rangoliMesh);
      this.rangoliMesh.geometry.dispose();
      if (Array.isArray(this.rangoliMesh.material)) {
        this.rangoliMesh.material.forEach((m) => m.dispose());
      } else {
        this.rangoliMesh.material.dispose();
      }
      this.rangoliMesh = null;
    }

    if (this.marigoldMesh) {
      this.scene.remove(this.marigoldMesh);
      this.marigoldMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
      this.marigoldMesh = null;
    }

    if (this.lanterns) {
      this.scene.remove(this.lanterns.group);
      this.lanterns.dispose();
      this.lanterns = null;
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

    if (this.touchController) {
      this.touchController.dispose();
      this.touchController = null;
    }

    if (this.touchHint) {
      this.touchHint.dispose();
      this.touchHint = null;
    }

    if (this.matchFollower) {
      this.scene.remove(this.matchFollower);
      this.matchFollower.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
      });
      this.matchFollower = null;
    }

    if (this.celebrationTimeoutId) {
      clearTimeout(this.celebrationTimeoutId);
      this.celebrationTimeoutId = null;
    }

    if (this.greetingModal) {
      this.greetingModal.dispose();
      this.greetingModal = null;
    }

    if (this.celebrationManager) {
      this.celebrationManager.dispose();
      this.celebrationManager = null;
    }

    if (this.headerFireworksBtn && this.onHeaderFireworksClick) {
      this.headerFireworksBtn.removeEventListener('click', this.onHeaderFireworksClick);
      this.headerFireworksBtn = null;
      this.onHeaderFireworksClick = null;
    }

    if (this.starfield) {
      this.scene.remove(this.starfield.group);
      this.starfield.dispose();
      this.starfield = null;
    }

    if (this.skyLanternsManager) {
      this.scene.remove(this.skyLanternsManager.group);
      this.skyLanternsManager.dispose();
      this.skyLanternsManager = null;
    }

    if (this.flowerShower) {
      this.scene.remove(this.flowerShower.group);
      this.flowerShower.dispose();
      this.flowerShower = null;
    }

    if (this.sparkler) {
      this.scene.remove(this.sparkler.group);
      this.sparkler.dispose();
      this.sparkler = null;
    }

    if (this.sweetBox) {
      this.scene.remove(this.sweetBox.group);
      this.sweetBox.dispose();
      this.sweetBox = null;
    }

    if (this.theme && this.theme.id !== 'diwali') {
      this.scene.remove(this.theme.group);
      this.theme.dispose();
    }
  }

  public getActiveTheme(): ExperienceTheme | null {
    return this.theme;
  }

  public switchTheme(newTheme: ExperienceTheme, force = false): void {
    if (!force && this.theme?.id === newTheme.id) return;
    this.disposeSceneComponents();
    this.theme = newTheme;
    this.buildSceneComponents();
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

  public getRangoliMesh(): THREE.Mesh | null {
    return this.rangoliMesh;
  }

  public getMarigoldMesh(): THREE.Group | null {
    return this.marigoldMesh;
  }

  public getLanterns(): FestiveLanternsHolder | null {
    return this.lanterns;
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

  public getTouchController(): TouchController | null {
    return this.touchController;
  }

  public getTouchHint(): TouchHint | null {
    return this.touchHint;
  }

  public getMatchFollower(): THREE.Object3D | null {
    return this.matchFollower;
  }

  public getGreetingModal(): GreetingModal | null {
    return this.greetingModal;
  }

  public getCelebrationManager(): CelebrationManager | null {
    return this.celebrationManager;
  }

  public triggerSkyLantern(): void {
    this.skyLanternsManager?.releaseCluster(5);
  }

  public triggerFlowerShower(): void {
    this.flowerShower?.triggerFlowerShower();
  }

  public setOnSweetBoxToggled(cb: (isOpen: boolean) => void): void {
    this.onSweetBoxToggled = cb;
  }

  public triggerSweetBox(): boolean {
    if (!this.sweetBox) return false;
    const isOpen = this.sweetBox.toggle();
    if (isOpen) {
      this.celebrationManager?.fireCelebrationBurst();
    }
    return isOpen;
  }

  public getSweetBox(): SweetBox | null {
    return this.sweetBox;
  }

  public setOnSparklerStateChange(cb: (active: boolean) => void): void {
    this.onSparklerStateChange = cb;
  }

  public setSparklerActive(active: boolean): void {
    if (!this.sparkler) return;
    this.sparkler.setActive(active);
    this.onSparklerStateChange?.(active);
  }

  public toggleSparkler(): boolean {
    if (!this.sparkler) return false;
    const next = !this.sparkler.getActive();
    this.setSparklerActive(next);
    return next;
  }

  public isSparklerActive(): boolean {
    return !!this.sparkler?.getActive();
  }

  public getSkyLanternsManager(): SkyLanternsManager | null {
    return this.skyLanternsManager;
  }

  public getFlowerShower(): FlowerShower | null {
    return this.flowerShower;
  }

  public getSparkler(): InteractiveSparkler | null {
    return this.sparkler;
  }

  public getStarfield(): Starfield | null {
    return this.starfield;
  }

  public getTheme(): ExperienceTheme | null {
    return this.theme;
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

    this.container.removeEventListener('pointerdown', this.onPointerDown);
    this.container.removeEventListener('pointermove', this.onPointerMove);
    this.container.removeEventListener('pointerup', this.onPointerUp);
    this.container.removeEventListener('pointercancel', this.onPointerCancel);
    window.removeEventListener('pointermove', this.onWindowPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerCancel);

    this.disposeSceneComponents();

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
