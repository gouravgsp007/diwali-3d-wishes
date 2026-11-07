import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FirecrackerWindow } from '../../src/fx/firecrackers/firecracker-window';
import type { AudioEngine } from '../../src/audio/audio-engine';

vi.mock('canvas-confetti', () => {
  const mockConfetti = vi.fn();
  (mockConfetti as any).reset = vi.fn();
  return { default: mockConfetti };
});

describe('Interactive Firecracker Window (Card-Free 3D Ceremony HUD)', () => {
  let container: HTMLDivElement;
  let mockAudioEngine: AudioEngine;
  let onCompleteSpy: () => void;
  let onSkipSpy: () => void;
  let onRocketTriggeredSpy: (id: number) => void;
  let firecrackerWindow: FirecrackerWindow;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);

    mockAudioEngine = {
      playRocketLaunch: vi.fn(),
      playFireworksBurst: vi.fn(),
      playSparklerSizzle: vi.fn(),
    } as unknown as AudioEngine;

    onCompleteSpy = vi.fn();
    onSkipSpy = vi.fn();
    onRocketTriggeredSpy = vi.fn();

    firecrackerWindow = new FirecrackerWindow({
      container,
      audioEngine: mockAudioEngine,
      onComplete: onCompleteSpy,
      onSkip: onSkipSpy,
      onRocketTriggered: onRocketTriggeredSpy,
    });
  });

  afterEach(() => {
    firecrackerWindow.dispose();
    container.remove();
    vi.restoreAllMocks();
  });

  it('mounts the overlay with status pill, guidance banner, and initial count 0/3 (no bulky card dock)', () => {
    firecrackerWindow.mount();

    const overlay = container.querySelector('#firecracker-window-overlay');
    expect(overlay).not.toBeNull();

    const countEl = container.querySelector('#cracker-launched-count');
    expect(countEl?.textContent).toBe('0');

    // Verify card dock does NOT exist in DOM (satisfying user requirement for no cards)
    expect(container.querySelector('#firecracker-card')).toBeNull();
    expect(container.querySelector('#rocket-card-1')).toBeNull();

    // Verify guidance toast exists
    const guidance = container.querySelector('#firecracker-guidance-pill');
    expect(guidance?.textContent).toContain('Tap any 3D Rocket');
  });

  it('launchRocket(id) notifies 3D scene, updates guidance, and increments launched count', () => {
    firecrackerWindow.mount();

    const launched = firecrackerWindow.launchRocket(1);
    expect(launched).toBe(true);
    expect(onRocketTriggeredSpy).toHaveBeenCalledWith(1);

    const countEl = container.querySelector('#cracker-launched-count');
    expect(countEl?.textContent).toBe('1');
    expect(firecrackerWindow.getLaunchedCount()).toBe(1);

    // Clicking again should be ignored (idempotent)
    const duplicate = firecrackerWindow.launchRocket(1);
    expect(duplicate).toBe(false);
    expect(firecrackerWindow.getLaunchedCount()).toBe(1);
  });

  it('supports keyboard shortcuts 1, 2, 3 to launch rockets', () => {
    firecrackerWindow.mount();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
    expect(firecrackerWindow.getLaunchedCount()).toBe(1);
    expect(onRocketTriggeredSpy).toHaveBeenCalledWith(1);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '3' }));
    expect(firecrackerWindow.getLaunchedCount()).toBe(2);
    expect(onRocketTriggeredSpy).toHaveBeenCalledWith(3);
  });

  it('automatically triggers onComplete after launching all 3 rockets', () => {
    firecrackerWindow.mount();

    firecrackerWindow.launchRocket(1);
    firecrackerWindow.launchRocket(2);
    firecrackerWindow.launchRocket(3);

    expect(firecrackerWindow.getLaunchedCount()).toBe(3);

    // Verify centered announcement card is displayed for user excitement
    const announcement = container.querySelector('#firecracker-reveal-announcement');
    expect(announcement).not.toBeNull();
    expect(announcement?.textContent).toContain('Revealing Your Magical Diwali Wish');

    // Fast-forward completion delay (2800ms) + dismiss animation (400ms)
    vi.advanceTimersByTime(3300);

    expect(onCompleteSpy).toHaveBeenCalledTimes(1);
    expect(container.querySelector('#firecracker-window-overlay')).toBeNull();
  });

  it('clicking skip button immediately dismisses overlay and calls onSkip', () => {
    firecrackerWindow.mount();

    const skipBtn = container.querySelector('#firecracker-skip-btn') as HTMLElement;
    expect(skipBtn).not.toBeNull();

    skipBtn.click();

    // Fast-forward dismiss animation (400ms)
    vi.advanceTimersByTime(500);

    expect(onSkipSpy).toHaveBeenCalledTimes(1);
    expect(container.querySelector('#firecracker-window-overlay')).toBeNull();
  });

  it('dispose() removes DOM elements safely', () => {
    firecrackerWindow.mount();
    expect(container.querySelector('#firecracker-window-overlay')).not.toBeNull();

    firecrackerWindow.dispose();
    expect(container.querySelector('#firecracker-window-overlay')).toBeNull();
  });
});
