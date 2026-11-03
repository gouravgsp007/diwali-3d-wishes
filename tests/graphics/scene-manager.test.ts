import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { SceneManager } from '../../src/graphics/scene-manager';
import { AppStateMachine } from '../../src/app/state-machine';

describe('SceneManager Foundation', () => {
  let container: HTMLElement;
  let fsm: AppStateMachine;
  let sceneManager: SceneManager;

  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '<div id="app" style="width: 800px; height: 600px;"></div>';
    container = document.getElementById('app')!;
    fsm = new AppStateMachine();
  });

  afterEach(() => {
    sceneManager?.dispose();
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
});
