import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { WickProximityDetector } from '../../src/interaction/proximity-detector';
import { TouchController } from '../../src/interaction/touch-controller';
import { CameraRig } from '../../src/graphics/camera-rig';

describe('WickProximityDetector', () => {
  it('initializes with default WickAnchor (0.0, 0.68, 1.38) and threshold 0.35 per D-02', () => {
    const detector = new WickProximityDetector();
    expect(detector.wickAnchor.x).toBeCloseTo(0.0, 2);
    expect(detector.wickAnchor.y).toBeCloseTo(0.68, 2);
    expect(detector.wickAnchor.z).toBeCloseTo(1.38, 2);
    expect(detector.threshold).toBe(0.35);
  });

  it('calculates 3D Euclidean distance accurately to the wick anchor', () => {
    const detector = new WickProximityDetector();
    const posAtWick = new THREE.Vector3(0.0, 0.68, 1.38);
    expect(detector.getDistance(posAtWick)).toBeCloseTo(0.0, 4);

    const posOffset = new THREE.Vector3(0.0, 0.68, 1.58); // offset by 0.2 along Z
    expect(detector.getDistance(posOffset)).toBeCloseTo(0.2, 4);
  });

  it('isNearWick returns true only when distance is strictly less than threshold (< 0.35) per D-02', () => {
    const detector = new WickProximityDetector();

    // 0.2 units away -> < 0.35
    expect(detector.isNearWick(new THREE.Vector3(0.0, 0.68, 1.58))).toBe(true);

    // 0.34 units away -> < 0.35
    expect(detector.isNearWick(new THREE.Vector3(0.0, 0.68, 1.72))).toBe(true);

    // 0.35 units away -> exactly threshold -> false
    expect(detector.isNearWick(new THREE.Vector3(0.0, 0.68, 1.73))).toBe(false);

    // 1.0 unit away -> false
    expect(detector.isNearWick(new THREE.Vector3(0.0, 0.68, 2.38))).toBe(false);
  });
});

describe('TouchController', () => {
  let container: HTMLElement;
  let cameraRig: CameraRig;
  let matchFollower: THREE.Object3D;
  let onIgniteTrigger: ReturnType<typeof vi.fn>;
  let onTouchStart: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Mock getBoundingClientRect
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    cameraRig = new CameraRig(800, 600);
    matchFollower = new THREE.Object3D();
    onIgniteTrigger = vi.fn();
    onTouchStart = vi.fn();
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  it('projects client pointer coordinates to NDC and intersects with horizontal plane y = 0.68 per D-01', () => {
    const controller = new TouchController(
      container,
      cameraRig,
      matchFollower,
      onIgniteTrigger,
      onTouchStart
    );

    // Dispatch pointerdown in the lower center of the screen
    container.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 400, clientY: 450, bubbles: true })
    );

    expect(controller.isDraggingActive()).toBe(true);
    expect(matchFollower.visible).toBe(true);
    expect(onTouchStart).toHaveBeenCalledTimes(1);
    // Y coordinate must be locked to the horizontal plane y = 0.68
    expect(matchFollower.position.y).toBeCloseTo(0.68, 2);

    controller.dispose();
  });

  it('clamps plane intersection coordinates to maximum boundary radius (Math.hypot(x, z) <= 3.2) per ASVS V5 and T-04-01', () => {
    const controller = new TouchController(
      container,
      cameraRig,
      matchFollower,
      onIgniteTrigger,
      onTouchStart
    );

    // High client Y (towards horizon) that would project far away in Z
    container.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 400, clientY: 200, bubbles: true })
    );

    const radius = Math.hypot(matchFollower.position.x, matchFollower.position.z);
    expect(radius).toBeLessThanOrEqual(3.2001);

    controller.dispose();
  });

  it('updates matchFollower position and visibility on drag lifecycle (visible on drag, hidden on release) per D-01', () => {
    const controller = new TouchController(
      container,
      cameraRig,
      matchFollower,
      onIgniteTrigger,
      onTouchStart
    );

    expect(matchFollower.visible).toBe(false);

    // Pointer down -> visible
    container.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 400, clientY: 500, bubbles: true })
    );
    expect(controller.isDraggingActive()).toBe(true);
    expect(matchFollower.visible).toBe(true);

    const initialZ = matchFollower.position.z;

    // Pointer move -> updates position
    window.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 440, clientY: 530, bubbles: true })
    );
    expect(matchFollower.position.z).not.toBe(initialZ);
    expect(matchFollower.position.x).not.toBe(0);

    // Pointer up -> hidden and inactive
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    expect(controller.isDraggingActive()).toBe(false);
    expect(matchFollower.visible).toBe(false);

    controller.dispose();
  });

  it('triggers ignition callback and executes navigator.vibrate([30, 50, 40]) when match tip approaches WickAnchor (< 0.35) per D-02', () => {
    const vibrateSpy = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateSpy,
      configurable: true,
      writable: true,
    });

    const controller = new TouchController(
      container,
      cameraRig,
      matchFollower,
      onIgniteTrigger,
      onTouchStart
    );

    // Direct update position to simulate dragging right into wick proximity
    // We can call updatePosition directly or move to coordinates where ray intersects near (0, 0.68, 1.38)
    // Let's spy on proximityDetector.isNearWick to return true on next move
    vi.spyOn(controller.proximityDetector, 'isNearWick').mockReturnValue(true);

    container.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 400, clientY: 400, bubbles: true })
    );

    expect(controller.isIgnitionTriggered()).toBe(true);
    expect(onIgniteTrigger).toHaveBeenCalledTimes(1);
    expect(vibrateSpy).toHaveBeenCalledWith([30, 50, 40]);
    expect(matchFollower.visible).toBe(false);
    expect(controller.isDraggingActive()).toBe(false);

    controller.dispose();
  });

  it('gracefully handles missing or throwing navigator.vibrate without errors per D-02', () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: () => {
        throw new Error('Permission denied');
      },
      configurable: true,
      writable: true,
    });

    const controller = new TouchController(
      container,
      cameraRig,
      matchFollower,
      onIgniteTrigger,
      onTouchStart
    );

    vi.spyOn(controller.proximityDetector, 'isNearWick').mockReturnValue(true);

    expect(() => {
      container.dispatchEvent(
        new PointerEvent('pointerdown', { clientX: 400, clientY: 400, bubbles: true })
      );
    }).not.toThrow();

    expect(controller.isIgnitionTriggered()).toBe(true);
    expect(onIgniteTrigger).toHaveBeenCalledTimes(1);

    controller.dispose();
  });

  it('resets ignition and dragging state on reset()', () => {
    const controller = new TouchController(
      container,
      cameraRig,
      matchFollower,
      onIgniteTrigger,
      onTouchStart
    );

    vi.spyOn(controller.proximityDetector, 'isNearWick').mockReturnValue(true);
    container.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 400, clientY: 400, bubbles: true })
    );
    expect(controller.isIgnitionTriggered()).toBe(true);

    controller.reset();
    expect(controller.isIgnitionTriggered()).toBe(false);
    expect(controller.isDraggingActive()).toBe(false);
    expect(matchFollower.visible).toBe(false);

    controller.dispose();
  });

  it('unbinds listeners and detaches match follower on dispose() per D-09, ASVS V14', () => {
    const parent = new THREE.Group();
    parent.add(matchFollower);
    expect(matchFollower.parent).toBe(parent);

    const controller = new TouchController(
      container,
      cameraRig,
      matchFollower,
      onIgniteTrigger,
      onTouchStart
    );

    controller.dispose();

    expect(matchFollower.parent).toBeNull();

    // After dispose, pointer events should not trigger onTouchStart or drag
    container.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 400, clientY: 400, bubbles: true })
    );
    expect(onTouchStart).not.toHaveBeenCalled();
    expect(controller.isDraggingActive()).toBe(false);
  });
});
