import confetti from 'canvas-confetti';
import { AudioEngine } from '../audio/audio-engine';

/**
 * CelebrationManager coordinates dual-cannon golden celebration showers and
 * interactive touch tap-to-sparkle physics with click filtering and robust cleanup.
 *
 * VFX-05 & D-04/D-05/D-07:
 * - Dual-cannon golden confetti bursts on celebration reveal.
 * - Localized micro-sparkler bursts at pointer touch coordinates outside interactive card UI.
 * - Tactile (vibrate) and audio (flame crackle) multisensory feedback.
 * - Complete teardown on dispose() removing window listeners and resetting canvas state.
 */
export class CelebrationManager {
  private isActive = false;
  private readonly onPointerDownBound: (e: PointerEvent) => void;

  constructor() {
    this.onPointerDownBound = this.handlePointerDown.bind(this);
    window.addEventListener('pointerdown', this.onPointerDownBound, { passive: true });
  }

  /**
   * Enables or disables interactive tap-to-sparkle pointer handling.
   *
   * @param active Whether tap-to-sparkle is active
   */
  public setActive(active: boolean): void {
    this.isActive = active;
  }

  /**
   * Returns whether tap-to-sparkle is currently active.
   */
  public getActive(): boolean {
    return this.isActive;
  }

  /**
   * Fires festive dual-cannon celebratory confetti bursts from screen flanks.
   */
  public fireCelebrationBurst(): void {
    const festiveColors = ['#ffd700', '#ffa500', '#ff8c00', '#fff8dc', '#b8860b'];

    // Left flank cannon
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 70,
      origin: { x: 0.05, y: 0.85 },
      colors: festiveColors,
      startVelocity: 55,
      gravity: 0.9,
      ticks: 250,
      disableForReducedMotion: true,
    });

    // Right flank cannon
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 70,
      origin: { x: 0.95, y: 0.85 },
      colors: festiveColors,
      startVelocity: 55,
      gravity: 0.9,
      ticks: 250,
      disableForReducedMotion: true,
    });
  }

  /**
   * Handles pointerdown events on the screen outside of card interactive elements.
   */
  private handlePointerDown(e: PointerEvent): void {
    if (!this.isActive) return;

    // Click delegation: Ignore clicks on modal card, buttons, links, inputs, textareas per D-05, T-05-03
    const target = e.target as HTMLElement | null;
    if (typeof target?.closest === 'function' && target.closest('#greeting-card, button, a, input, textarea')) {
      return;
    }

    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    const originX = Math.max(0, Math.min(1, e.clientX / width));
    const originY = Math.max(0, Math.min(1, e.clientY / height));

    confetti({
      origin: { x: originX, y: originY },
      particleCount: 25,
      spread: 45,
      startVelocity: 18,
      scalar: 0.65,
      ticks: 100,
      colors: ['#ffd700', '#ff9900', '#ffffff', '#ffcc00', '#ffa500'],
      disableForReducedMotion: true,
    });

    // Multisensory tactile and audio feedback (defensive in test environments)
    try {
      AudioEngine.getInstance().playFlameCrackle();
    } catch {
      // Graceful no-op in headless test environment
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // Graceful no-op
      }
    }
  }

  /**
   * Cleans up window listener, resets confetti canvas, and resets active flag per ASVS V14.
   */
  public dispose(): void {
    this.isActive = false;
    window.removeEventListener('pointerdown', this.onPointerDownBound);
    try {
      confetti.reset();
    } catch {
      // Ignored if canvas not mounted
    }
  }
}
