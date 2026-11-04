import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { SceneManager } from '../../src/graphics/scene-manager';
import { AppStateMachine } from '../../src/app/state-machine';
import { AudioEngine } from '../../src/audio/audio-engine';

describe('SceneManager Foundation', () => {
  let container: HTMLElement;
  let fsm: AppStateMachine;
  let sceneManager: SceneManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '<div id="app" style="width: 800px; height: 600px;"></div>';
    container = document.getElementById('app')!;
    fsm = new AppStateMachine();

    // Reset AudioEngine
    AudioEngine.getInstance().dispose();
  });

  afterEach(() => {
    vi.useRealTimers();
    sceneManager?.dispose();
    AudioEngine.getInstance().dispose();
  });

  it('instantiates WebGLRenderer with clamped pixel ratio Math.min(DPR, 1.75) (D-16, T-02-02)', () => {
    // Simulate Retina 3.0x device pixel ratio
    window.devicePixelRatio = 3.0;

    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    expect(sceneManager.getPixelRatio()).toBe(1.75);
  });

  it('preserves standard 1.0 DPR without scaling up on low-DPI screens', () => {
    window.devicePixelRatio = 1.0;

    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    expect(sceneManager.getPixelRatio()).toBe(1.0);
  });

  it('enforces PCFSoftShadowMap on renderer per D-12', () => {
    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    const renderer = sceneManager.getRenderer();
    expect(renderer.shadowMap.enabled).toBe(true);
    expect(renderer.shadowMap.type).toBe(THREE.PCFSoftShadowMap);
  });

  it('mounts canvas element into the provided container with z-index 0 and touch-action none', () => {
    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect(canvas?.style.touchAction).toBe('none');
    expect(canvas?.style.zIndex).toBe('0');
    expect(canvas?.classList.contains('touch-none')).toBe(true);
    expect(canvas?.classList.contains('-z-0')).toBe(true);
  });

  it('pauses render loop on document visibilitychange to hidden and resumes when visible (D-16)', () => {
    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    expect(sceneManager.isRenderLoopActive()).toBe(true);

    // Simulate tab backgrounding
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(sceneManager.isRenderLoopActive()).toBe(false);

    // Simulate tab foregrounding
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(sceneManager.isRenderLoopActive()).toBe(true);
  });

  it('intercepts webglcontextlost event, calls preventDefault(), and handles webglcontextrestored safely (D-16)', () => {
    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    const canvas = container.querySelector('canvas')!;
    const lostEvent = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(lostEvent);

    expect(lostEvent.defaultPrevented).toBe(true);
    expect(sceneManager.isRenderLoopActive()).toBe(false);

    // Restore context
    const restoreEvent = new Event('webglcontextrestored');
    expect(() => canvas.dispatchEvent(restoreEvent)).not.toThrow();
    expect(sceneManager.isRenderLoopActive()).toBe(true);
  });

  it('updates CameraRig and forwards pointer events from container', () => {
    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    const cameraRig = sceneManager.getCameraRig();
    const pointerMoveSpy = vi.spyOn(cameraRig, 'onPointerMove');
    const pointerUpSpy = vi.spyOn(cameraRig, 'onPointerUp');

    const moveEvent = new MouseEvent('pointermove', { clientX: 100, clientY: 100 });
    container.dispatchEvent(moveEvent);
    expect(pointerMoveSpy).toHaveBeenCalled();

    const upEvent = new MouseEvent('pointerup');
    container.dispatchEvent(upEvent);
    expect(pointerUpSpy).toHaveBeenCalled();
  });

  it('cleans up event listeners, cancels RAF, and disposes GPU resources on dispose()', () => {
    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();

    sceneManager.dispose();

    expect(sceneManager.isRenderLoopActive()).toBe(false);
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('instantiates DiyaMesh, brass thali, lighting rig, bokeh motes, and FlameController into scene graph on start()', () => {
    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    expect(sceneManager.getDiyaMesh()).toBeDefined();
    expect(sceneManager.getThaliMesh()).toBeDefined();
    expect(sceneManager.getLightingRig()).toBeDefined();
    expect(sceneManager.getBokehMotes()).toBeDefined();
    expect(sceneManager.getFlameController()).toBeDefined();

    const scene = sceneManager.getScene();
    const flameController = sceneManager.getFlameController()!;
    expect(scene.children).toContain(flameController.group);
    expect(scene.children.length).toBeGreaterThanOrEqual(5);
  });

  it('instantiates TouchController, TouchHint, and match follower into scene on start() per D-01, D-03', () => {
    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    expect(sceneManager.getTouchController()).toBeDefined();
    expect(sceneManager.getTouchHint()).toBeDefined();
    expect(sceneManager.getMatchFollower()).toBeDefined();

    const matchFollower = sceneManager.getMatchFollower()!;
    expect(matchFollower.visible).toBe(false);
    expect(sceneManager.getScene().children).toContain(matchFollower);

    // TouchHint prompt mounted into DOM
    expect(container.querySelector('#touch-hint-prompt')).not.toBeNull();
  });

  it('starts BGM on UNLOCKED_INTRO and transitions FSM to INTERACTIVE_UNLIT when camera dolly completes per D-05, D-08', async () => {
    const bgmSpy = vi.spyOn(AudioEngine.getInstance(), 'startBgm').mockImplementation(() => {});

    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    const cameraRig = sceneManager.getCameraRig();
    const dollySpy = vi.spyOn(cameraRig, 'dollyTo');

    fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });
    fsm.transition({
      type: 'UNLOCK_SUCCESS',
      payload: {
        recipient: 'Priya',
        sender: 'Aarav',
        message: 'Happy Diwali',
        templateId: 'diya-classic',
        createdAt: Date.now(),
      },
    });

    expect(fsm.getState()).toBe('UNLOCKED_INTRO');
    expect(bgmSpy).toHaveBeenCalledOnce();
    expect(dollySpy).toHaveBeenCalledWith(expect.any(THREE.Vector3), 1200);

    // Advance TWEEN time past 1200ms dolly duration
    TWEEN.update(performance.now() + 1300);

    // Wait for promise resolution to transition to INTERACTIVE_UNLIT
    await vi.waitFor(() => {
      expect(fsm.getState()).toBe('INTERACTIVE_UNLIT');
    });

    // TouchHint should now be visible
    const hintEl = container.querySelector('#touch-hint-prompt');
    expect(hintEl?.classList.contains('opacity-100')).toBe(true);
  });

  it('fires match strike and flame crackle SFX when wick proximity is crossed and transitions FSM to IGNITING per D-02, D-06, D-08', async () => {
    const matchStrikeSpy = vi.spyOn(AudioEngine.getInstance(), 'playMatchStrike').mockImplementation(() => {});
    const crackleSpy = vi.spyOn(AudioEngine.getInstance(), 'playFlameCrackle').mockImplementation(() => {});

    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    // Transition to INTERACTIVE_UNLIT
    fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });
    fsm.transition({
      type: 'UNLOCK_SUCCESS',
      payload: {
        recipient: 'Priya',
        sender: 'Aarav',
        message: 'Happy Diwali',
        templateId: 'diya-classic',
        createdAt: Date.now(),
      },
    });
    fsm.transition({ type: 'INTRO_COMPLETE' });
    expect(fsm.getState()).toBe('INTERACTIVE_UNLIT');

    // Simulate proximity trigger via TouchController's proximity detector
    const touchController = sceneManager.getTouchController()!;
    vi.spyOn(touchController.proximityDetector, 'isNearWick').mockReturnValue(true);

    // Pointer move triggering updatePosition and onIgnite callback
    touchController.updatePosition(400, 300);

    expect(matchStrikeSpy).toHaveBeenCalled();
    expect(crackleSpy).toHaveBeenCalled();
    expect(fsm.getState()).toBe('IGNITING');
  });

  it('hides TouchHint and match follower on IGNITING per D-03, D-08', () => {
    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });
    fsm.transition({
      type: 'UNLOCK_SUCCESS',
      payload: {
        recipient: 'Priya',
        sender: 'Aarav',
        message: 'Happy Diwali',
        templateId: 'diya-classic',
        createdAt: Date.now(),
      },
    });
    fsm.transition({ type: 'INTRO_COMPLETE' });

    const matchFollower = sceneManager.getMatchFollower()!;
    matchFollower.visible = true;

    // Transition to IGNITING
    fsm.transition({ type: 'WICK_TOUCHED' });

    expect(fsm.getState()).toBe('IGNITING');
    expect(matchFollower.visible).toBe(false);

    const hintEl = container.querySelector('#touch-hint-prompt');
    expect(hintEl?.classList.contains('opacity-0')).toBe(true);
  });

  it('triggers camera panTargetTo and flame ignition on IGNITING, completing to LIT_CELEBRATION', async () => {
    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    const cameraRig = sceneManager.getCameraRig();
    const flameController = sceneManager.getFlameController()!;
    const panSpy = vi.spyOn(cameraRig, 'panTargetTo');
    const igniteSpy = vi.spyOn(flameController, 'ignite');

    fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });
    fsm.transition({
      type: 'UNLOCK_SUCCESS',
      payload: {
        recipient: 'Priya',
        sender: 'Aarav',
        message: 'Happy Diwali',
        templateId: 'diya-classic',
        createdAt: Date.now(),
      },
    });
    fsm.transition({ type: 'INTRO_COMPLETE' });
    fsm.transition({ type: 'WICK_TOUCHED' });

    expect(fsm.getState()).toBe('IGNITING');
    expect(panSpy).toHaveBeenCalledWith(expect.any(THREE.Vector3), 1000);
    expect(igniteSpy).toHaveBeenCalledOnce();

    // Advance TWEEN time past 750ms ignition duration
    TWEEN.update(performance.now() + 850);

    await vi.waitFor(() => {
      expect(fsm.getState()).toBe('LIT_CELEBRATION');
    });
  });

  it('disposes and cleans up TouchController, TouchHint, and match follower on dispose() per D-09, ASVS V14', () => {
    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    const touchController = sceneManager.getTouchController()!;
    const touchHint = sceneManager.getTouchHint()!;
    const touchCtrlDisposeSpy = vi.spyOn(touchController, 'dispose');
    const touchHintDisposeSpy = vi.spyOn(touchHint, 'dispose');

    expect(container.querySelector('#touch-hint-prompt')).not.toBeNull();

    sceneManager.dispose();

    expect(touchCtrlDisposeSpy).toHaveBeenCalledOnce();
    expect(touchHintDisposeSpy).toHaveBeenCalledOnce();
    expect(sceneManager.getTouchController()).toBeNull();
    expect(sceneManager.getTouchHint()).toBeNull();
    expect(sceneManager.getMatchFollower()).toBeNull();
    expect(container.querySelector('#touch-hint-prompt')).toBeNull();
  });

  it('instantiates GreetingModal and CelebrationManager on start() and mounts GreetingModal to container per D-01, D-07', () => {
    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    expect(sceneManager.getGreetingModal()).not.toBeNull();
    expect(sceneManager.getCelebrationManager()).not.toBeNull();
    expect(container.querySelector('#greeting-modal-overlay')).not.toBeNull();
  });

  it('automatically advances LIT_CELEBRATION to GREETING_REVEAL after 1500ms delay per D-01', () => {
    vi.useFakeTimers();

    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    // Advance to LIT_CELEBRATION
    fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });
    fsm.transition({
      type: 'UNLOCK_SUCCESS',
      payload: { recipient: 'Priya', sender: 'Aarav', message: 'Happy Diwali' },
    });
    fsm.transition({ type: 'INTRO_COMPLETE' });
    fsm.transition({ type: 'WICK_TOUCHED' });
    fsm.transition({ type: 'IGNITION_COMPLETE' });

    expect(fsm.getState()).toBe('LIT_CELEBRATION');

    // 1499ms: Still in LIT_CELEBRATION
    vi.advanceTimersByTime(1499);
    expect(fsm.getState()).toBe('LIT_CELEBRATION');

    // 1500ms: Advances to GREETING_REVEAL
    vi.advanceTimersByTime(1);
    expect(fsm.getState()).toBe('GREETING_REVEAL');

    vi.useRealTimers();
  });

  it('cancels pending celebration timer on dispose() or state replay per D-07, T-05-04', () => {
    vi.useFakeTimers();

    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });
    fsm.transition({
      type: 'UNLOCK_SUCCESS',
      payload: { recipient: 'Priya', sender: 'Aarav', message: 'Happy Diwali' },
    });
    fsm.transition({ type: 'INTRO_COMPLETE' });
    fsm.transition({ type: 'WICK_TOUCHED' });
    fsm.transition({ type: 'IGNITION_COMPLETE' });

    expect(fsm.getState()).toBe('LIT_CELEBRATION');

    // Dispose before timer fires
    sceneManager.dispose();

    vi.advanceTimersByTime(2000);
    // State remains LIT_CELEBRATION because timer was cleared
    expect(fsm.getState()).toBe('LIT_CELEBRATION');

    vi.useRealTimers();
  });

  it('coordinates camera pan, confetti burst, greeting modal unfurl, and tap sparkles on GREETING_REVEAL per D-01, D-02, D-04, D-05', () => {
    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    const panSpy = vi.spyOn(sceneManager.getCameraRig(), 'panTargetTo');
    const burstSpy = vi.spyOn(sceneManager.getCelebrationManager()!, 'fireCelebrationBurst');
    const setActiveSpy = vi.spyOn(sceneManager.getCelebrationManager()!, 'setActive');
    const showSpy = vi.spyOn(sceneManager.getGreetingModal()!, 'show');

    const greetingPayload = { recipient: 'Aarav', sender: 'Diya', message: 'Festive wishes' };
    fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });
    fsm.transition({ type: 'UNLOCK_SUCCESS', payload: greetingPayload });
    fsm.transition({ type: 'INTRO_COMPLETE' });
    fsm.transition({ type: 'WICK_TOUCHED' });
    fsm.transition({ type: 'IGNITION_COMPLETE' });
    fsm.transition({ type: 'CELEBRATION_COMPLETE' });

    expect(fsm.getState()).toBe('GREETING_REVEAL');
    expect(panSpy).toHaveBeenCalledWith(expect.objectContaining({ x: 0, y: 0.85, z: 0 }), 1200);
    expect(burstSpy).toHaveBeenCalledOnce();
    expect(showSpy).toHaveBeenCalledWith(greetingPayload);
    expect(setActiveSpy).toHaveBeenCalledWith(true);
    expect(sceneManager.getCelebrationManager()!.getActive()).toBe(true);
  });

  it('disposes GreetingModal, CelebrationManager, and clears celebrationTimeoutId on dispose() per D-07, ASVS V14, T-05-05', () => {
    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    const greetingModal = sceneManager.getGreetingModal()!;
    const celebrationManager = sceneManager.getCelebrationManager()!;
    const modalDisposeSpy = vi.spyOn(greetingModal, 'dispose');
    const celebDisposeSpy = vi.spyOn(celebrationManager, 'dispose');

    expect(container.querySelector('#greeting-modal-overlay')).not.toBeNull();

    sceneManager.dispose();

    expect(modalDisposeSpy).toHaveBeenCalledOnce();
    expect(celebDisposeSpy).toHaveBeenCalledOnce();
    expect(sceneManager.getGreetingModal()).toBeNull();
    expect(sceneManager.getCelebrationManager()).toBeNull();
    expect(container.querySelector('#greeting-modal-overlay')).toBeNull();
  });
});
