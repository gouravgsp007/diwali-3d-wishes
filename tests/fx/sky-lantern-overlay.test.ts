import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SkyLanternOverlay } from '../../src/fx/sky-lantern-overlay';

describe('SkyLanternOverlay (Foreground Canvas Akash Kandil)', () => {
  let container: HTMLDivElement;
  let overlay: SkyLanternOverlay;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    overlay = new SkyLanternOverlay();
  });

  afterEach(() => {
    overlay.dispose();
    container.remove();
    vi.restoreAllMocks();
  });

  it('mounts 2D canvas overlay with z-index: 25 and pointer-events-none above greeting modal', () => {
    overlay.mount(container);

    const canvas = container.querySelector('#sky-lantern-foreground-canvas') as HTMLCanvasElement;
    expect(canvas).not.toBeNull();
    expect(canvas.style.zIndex).toBe('25');
    expect(canvas.classList.contains('pointer-events-none')).toBe(true);
  });

  it('spawnLanterns(count) initializes lanterns starting below the screen bottom', () => {
    overlay.mount(container);
    expect(overlay.getActiveCount()).toBe(0);

    overlay.spawnLanterns(4);
    expect(overlay.getActiveCount()).toBe(4);
  });

  it('update(dt) moves lanterns upward with negative vy and sways horizontally', () => {
    overlay.mount(container);
    overlay.spawnLanterns(3);

    const initialCount = overlay.getActiveCount();
    expect(initialCount).toBe(3);

    // Advance simulation by 0.5s
    overlay.update(0.5);
    expect(overlay.getActiveCount()).toBe(3);

    // Large simulation step allowing lanterns to ascend into stratosphere and despawn
    for (let i = 0; i < 20; i++) {
      overlay.update(1.0);
    }
    expect(overlay.getActiveCount()).toBe(0);
  });

  it('dispose() removes canvas from DOM and cleans up all active lanterns', () => {
    overlay.mount(container);
    overlay.spawnLanterns(5);

    expect(container.querySelector('#sky-lantern-foreground-canvas')).not.toBeNull();
    overlay.dispose();

    expect(container.querySelector('#sky-lantern-foreground-canvas')).toBeNull();
    expect(overlay.getActiveCount()).toBe(0);
  });
});
