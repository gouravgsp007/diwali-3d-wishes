import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PowderParticlePool } from '../../src/fx/rangoli/powder-particle-pool';
import { RangoliCompletionDetector } from '../../src/fx/rangoli/rangoli-completion-detector';
import { RangoliCeremonyOverlay } from '../../src/fx/rangoli/rangoli-ceremony-overlay';

vi.mock('canvas-confetti', () => {
  const mockConfetti = vi.fn();
  (mockConfetti as any).reset = vi.fn();
  return { default: mockConfetti };
});

describe('Interactive Glow Rangoli Ceremony', () => {
  describe('PowderParticlePool', () => {
    let pool: PowderParticlePool;

    beforeEach(() => {
      pool = new PowderParticlePool();
    });

    afterEach(() => {
      pool.clear();
    });

    it('initializes with 0 active particles in pre-allocated pool', () => {
      expect(pool.getActiveCount()).toBe(0);
    });

    it('emits particles on touch point with velocity and life', () => {
      pool.emit(100, 100, '#FF7A00', 6);
      expect(pool.getActiveCount()).toBe(6);
    });

    it('updates particle simulation and expires dead particles', () => {
      pool.emit(100, 100, '#FF7A00', 4);
      expect(pool.getActiveCount()).toBe(4);

      // Fast-forward simulation past maxLife (> 800ms)
      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillStyle: '',
        globalAlpha: 1,
        globalCompositeOperation: '',
      } as unknown as CanvasRenderingContext2D;

      pool.updateAndDraw(mockCtx, 1.0);
      expect(pool.getActiveCount()).toBe(0);
    });
  });

  describe('RangoliCompletionDetector', () => {
    let detector: RangoliCompletionDetector;

    beforeEach(() => {
      detector = new RangoliCompletionDetector(200, 200, 100);
    });

    it('starts with 0 progress', () => {
      expect(detector.getProgress()).toBe(0);
      expect(detector.isComplete()).toBe(false);
    });

    it('records stroke points in radial sectors around the center', () => {
      // Simulate drawing points around a circle of radius 80
      for (let i = 0; i < 16; i++) {
        const angle = (i * Math.PI * 2) / 16;
        const x = 200 + Math.cos(angle) * 80;
        const y = 200 + Math.sin(angle) * 80;
        detector.registerPoint(x, y);
      }

      expect(detector.getProgress()).toBeGreaterThan(0.65);
      expect(detector.isComplete()).toBe(true);
    });

    it('resets progress cleanly', () => {
      detector.registerPoint(280, 200);
      expect(detector.getProgress()).toBeGreaterThan(0);

      detector.reset();
      expect(detector.getProgress()).toBe(0);
      expect(detector.isComplete()).toBe(false);
    });
  });

  describe('RangoliCeremonyOverlay UI', () => {
    let container: HTMLElement;
    let overlay: RangoliCeremonyOverlay;
    let onCompleteSpy: ReturnType<typeof vi.fn>;
    let onSkipSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
      onCompleteSpy = vi.fn();
      onSkipSpy = vi.fn();

      overlay = new RangoliCeremonyOverlay({
        container,
        onComplete: onCompleteSpy,
        onSkip: onSkipSpy,
      });
    });

    afterEach(() => {
      overlay.dispose();
      container.remove();
      vi.restoreAllMocks();
    });

    it('mounts fullscreen overlay with invitation headline and skip button', () => {
      overlay.mount();
      const el = container.querySelector('#rangoli-ceremony-overlay');
      expect(el).not.toBeNull();

      expect(el?.textContent).toContain("Let's create something beautiful this Diwali!");
      expect(el?.textContent).toContain('दीपावली के इस पावन अवसर पर, आइए कुछ सुंदर बनाएं');

      const skipBtn = container.querySelector('#rangoli-skip-btn');
      expect(skipBtn).not.toBeNull();

      const completeBtn = container.querySelector('#rangoli-complete-btn');
      expect(completeBtn).not.toBeNull();
    });

    it('triggers skip callback when skip button is clicked', () => {
      vi.useFakeTimers();
      overlay.mount();
      const skipBtn = container.querySelector('#rangoli-skip-btn') as HTMLButtonElement;
      skipBtn.click();

      // Fade-out transition timeout is 700ms
      vi.advanceTimersByTime(750);
      expect(onSkipSpy).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('triggers celebration and completion callback on finish()', () => {
      vi.useFakeTimers();
      overlay.mount();
      overlay.finish();

      vi.advanceTimersByTime(750);
      expect(onCompleteSpy).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });
  });
});
