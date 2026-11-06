import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FirecrackerWindow } from '../../src/fx/firecrackers/firecracker-window';
import type { AudioEngine } from '../../src/audio/audio-engine';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('Interactive Firecracker Window (3 Rockets)', () => {
  let container: HTMLDivElement;
  let mockAudioEngine: AudioEngine;
  let onCompleteSpy: () => void;
  let onSkipSpy: () => void;
  let firecrackerWindow: FirecrackerWindow;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);

    mockAudioEngine = {
      playRocketLaunch: vi.fn(),
      playFireworksBurst: vi.fn(),
    } as unknown as AudioEngine;

    onCompleteSpy = vi.fn();
    onSkipSpy = vi.fn();

    firecrackerWindow = new FirecrackerWindow({
      container,
      audioEngine: mockAudioEngine,
      onComplete: onCompleteSpy,
      onSkip: onSkipSpy,
    });
  });

  afterEach(() => {
    firecrackerWindow.dispose();
    container.remove();
    vi.restoreAllMocks();
  });

  it('mounts the overlay with 3 rocket launch cards, guidance banner, and initial count 0/3', () => {
    firecrackerWindow.mount();

    const overlay = container.querySelector('#firecracker-window-overlay');
    expect(overlay).not.toBeNull();

    const countEl = container.querySelector('#cracker-launched-count');
    expect(countEl?.textContent).toBe('0');

    // Verify all 3 rockets exist in the DOM
    const rocket1 = container.querySelector('#rocket-card-1');
    const rocket2 = container.querySelector('#rocket-card-2');
    const rocket3 = container.querySelector('#rocket-card-3');
    expect(rocket1).not.toBeNull();
    expect(rocket2).not.toBeNull();
    expect(rocket3).not.toBeNull();

    // Verify rocket titles
    expect(rocket1?.textContent).toContain('Swarna Baan');
    expect(rocket2?.textContent).toContain('Taramandal');
    expect(rocket3?.textContent).toContain('Dhamaaka');
  });

  it('tapping a rocket plays audio launch, updates button label to LAUNCHED, and increments count', () => {
    firecrackerWindow.mount();

    const rocket1 = container.querySelector('#rocket-card-1') as HTMLElement;
    rocket1.click();

    expect(mockAudioEngine.playRocketLaunch).toHaveBeenCalledTimes(1);

    const btn1 = container.querySelector('#rocket-btn-1');
    expect(btn1?.textContent).toBe('✓ LAUNCHED');

    const countEl = container.querySelector('#cracker-launched-count');
    expect(countEl?.textContent).toBe('1');
    expect(firecrackerWindow.getLaunchedCount()).toBe(1);

    // Clicking again should be ignored (idempotent)
    rocket1.click();
    expect(mockAudioEngine.playRocketLaunch).toHaveBeenCalledTimes(1);
    expect(firecrackerWindow.getLaunchedCount()).toBe(1);
  });

  it('triggers fireworks burst audio and confetti after launch delay', () => {
    firecrackerWindow.mount();

    const rocket2 = container.querySelector('#rocket-card-2') as HTMLElement;
    rocket2.click();

    expect(mockAudioEngine.playFireworksBurst).not.toHaveBeenCalled();

    // Advance 600ms for rocket ascent
    vi.advanceTimersByTime(650);

    expect(mockAudioEngine.playFireworksBurst).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard shortcuts 1, 2, 3 to launch rockets', () => {
    firecrackerWindow.mount();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
    expect(firecrackerWindow.getLaunchedCount()).toBe(1);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '3' }));
    expect(firecrackerWindow.getLaunchedCount()).toBe(2);
  });

  it('automatically triggers onComplete after launching all 3 rockets', () => {
    firecrackerWindow.mount();

    (container.querySelector('#rocket-card-1') as HTMLElement).click();
    (container.querySelector('#rocket-card-2') as HTMLElement).click();
    (container.querySelector('#rocket-card-3') as HTMLElement).click();

    expect(firecrackerWindow.getLaunchedCount()).toBe(3);

    // Fast-forward ascent (600ms) + celebration (500ms) + dismiss (900ms + 400ms)
    vi.advanceTimersByTime(2500);

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
