import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import confetti from 'canvas-confetti';
import { CelebrationManager } from '../../src/fx/celebration-manager';
import { AudioEngine } from '../../src/audio/audio-engine';

vi.mock('canvas-confetti', () => {
  const mockConfetti = vi.fn();
  (mockConfetti as any).reset = vi.fn();
  return { default: mockConfetti };
});

describe('CelebrationManager Service', () => {
  let manager: CelebrationManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new CelebrationManager();
  });

  afterEach(() => {
    manager.dispose();
    document.body.innerHTML = '';
  });

  it('Test 1: Instantiates CelebrationManager and binds passive window pointerdown listener with bound reference per D-05, D-07', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const newManager = new CelebrationManager();

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'pointerdown',
      expect.any(Function),
      { passive: true }
    );

    newManager.dispose();
    addEventListenerSpy.mockRestore();
  });

  it('Test 2 & 3: fireCelebrationBurst() invokes canvas-confetti twice (left & right cannons) with festive gold/amber palette and disableForReducedMotion per D-04', () => {
    manager.fireCelebrationBurst();

    expect(confetti).toHaveBeenCalledTimes(2);

    const festiveColors = ['#ffd700', '#ffa500', '#ff8c00', '#fff8dc', '#b8860b'];

    // Left cannon
    expect(confetti).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        particleCount: 80,
        angle: 60,
        spread: 70,
        origin: { x: 0.05, y: 0.85 },
        colors: festiveColors,
        startVelocity: 55,
        gravity: 0.9,
        ticks: 250,
        disableForReducedMotion: true,
      })
    );

    // Right cannon
    expect(confetti).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        particleCount: 80,
        angle: 120,
        spread: 70,
        origin: { x: 0.95, y: 0.85 },
        colors: festiveColors,
        startVelocity: 55,
        gravity: 0.9,
        ticks: 250,
        disableForReducedMotion: true,
      })
    );
  });

  it('Test 4: setActive(true) enables tap-to-sparkle handling on pointerdown; setActive(false) suppresses tap sparkles per D-05', () => {
    // When inactive (default):
    window.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: 200,
        clientY: 300,
        bubbles: true,
      })
    );
    expect(confetti).not.toHaveBeenCalled();

    // When activated:
    manager.setActive(true);
    window.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: 200,
        clientY: 300,
        bubbles: true,
      })
    );
    expect(confetti).toHaveBeenCalledTimes(4); // 4 simultaneous sparkle points
  });

  it('Test 5 & 7: handlePointerDown normalizes client coordinates to [0, 1] range and triggers multi-point sparkles per D-05, VFX-05', () => {
    manager.setActive(true);

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });

    window.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: 500,
        clientY: 400,
        bubbles: true,
      })
    );

    // Primary point at touch coordinate
    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: { x: 0.5, y: 0.5 },
        particleCount: 20,
        spread: 50,
        scalar: 0.65,
        ticks: 90,
        disableForReducedMotion: true,
      })
    );
    // Total 4 coordinated points fired simultaneously
    expect(confetti).toHaveBeenCalledTimes(4);
  });

  it('clamps coordinates to [0, 1] if client coordinates fall outside viewport bounds', () => {
    manager.setActive(true);

    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });

    window.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: -100,
        clientY: 1000,
        bubbles: true,
      })
    );

    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: { x: 0, y: 1 },
      })
    );
  });

  it('Test 6: allows sparkles over greeting card, while filtering actionable buttons, links, inputs, and textareas', () => {
    manager.setActive(true);

    const card = document.createElement('div');
    card.id = 'greeting-card';
    const button = document.createElement('button');
    button.textContent = 'Reply on WhatsApp';
    const link = document.createElement('a');
    link.href = '#create';
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');

    card.appendChild(button);
    card.appendChild(link);
    card.appendChild(input);
    card.appendChild(textarea);
    document.body.appendChild(card);

    // 1. Click directly on card container: NOW triggers sparkles over the wish card!
    card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(confetti).toHaveBeenCalledTimes(4);

    vi.clearAllMocks();

    // 2. Click on button inside card: filtered so button click works without interference
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(confetti).not.toHaveBeenCalled();

    // 3. Click on anchor link: filtered
    link.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(confetti).not.toHaveBeenCalled();

    // 4. Click on input: filtered
    input.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(confetti).not.toHaveBeenCalled();

    // 5. Click on textarea: filtered
    textarea.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(confetti).not.toHaveBeenCalled();
  });

  it('fireCardSparkleSalute() fires 4 coordinated sparkling bursts around card perimeter', () => {
    manager.fireCardSparkleSalute();
    expect(confetti).toHaveBeenCalledTimes(4);
  });

  it('Test 8: handlePointerDown invokes AudioEngine.getInstance().playFlameCrackle() safely within try/catch per D-05', () => {
    manager.setActive(true);
    const playCrackleSpy = vi.spyOn(AudioEngine.getInstance(), 'playFlameCrackle').mockImplementation(() => {});

    window.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: 200,
        clientY: 200,
        bubbles: true,
      })
    );

    expect(playCrackleSpy).toHaveBeenCalled();
    playCrackleSpy.mockRestore();
  });

  it('Test 9: handlePointerDown triggers navigator.vibrate(15) defensively when supported per D-05', () => {
    manager.setActive(true);
    const vibrateMock = vi.fn();
    (navigator as any).vibrate = vibrateMock;

    window.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: 200,
        clientY: 200,
        bubbles: true,
      })
    );

    expect(vibrateMock).toHaveBeenCalledWith(15);
  });

  it('Test 11: startAutoFireworks() starts recurring fireworks every 2-3s, and stopAutoFireworks() halts it', () => {
    vi.useFakeTimers();
    expect(manager.isAutoFireworksActive()).toBe(false);

    manager.startAutoFireworks(2500);
    expect(manager.isAutoFireworksActive()).toBe(true);

    // Fast forward 2.5 seconds
    vi.advanceTimersByTime(2500);
    expect(confetti).toHaveBeenCalled();

    // Fast forward another 2.5 seconds
    const countBefore = (confetti as any).mock.calls.length;
    vi.advanceTimersByTime(2500);
    expect((confetti as any).mock.calls.length).toBeGreaterThan(countBefore);

    manager.stopAutoFireworks();
    expect(manager.isAutoFireworksActive()).toBe(false);

    // Ensure no more calls after stop
    const countAfter = (confetti as any).mock.calls.length;
    vi.advanceTimersByTime(5000);
    expect((confetti as any).mock.calls.length).toBe(countAfter);

    vi.useRealTimers();
  });

  it('Test 12: fireRandomSkyFirework() creates celebratory celestial fireworks with audio effect', () => {
    const sizzleSpy = vi.spyOn(AudioEngine.getInstance(), 'playSparklerSizzle').mockImplementation(() => {});

    manager.fireRandomSkyFirework();
    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        spread: 360,
        disableForReducedMotion: true,
      })
    );
    expect(sizzleSpy).toHaveBeenCalled();
    sizzleSpy.mockRestore();
  });

  it('Test 10: dispose() removes window pointerdown listener, invokes confetti.reset(), and sets isActive to false per D-07, ASVS V14, and T-05-05', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    manager.setActive(true);
    manager.dispose();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    expect((confetti as any).reset).toHaveBeenCalled();

    // Subsequent events should not trigger confetti
    window.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: 200,
        clientY: 200,
        bubbles: true,
      })
    );
    expect(confetti).not.toHaveBeenCalled();

    removeEventListenerSpy.mockRestore();
  });
});
