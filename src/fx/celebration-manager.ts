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
  private autoFireworksInterval: ReturnType<typeof setInterval> | null = null;

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
   * Starts automatic recurring fireworks bursts every 2-3 seconds on screen.
   *
   * @param intervalMs Base interval between fireworks in milliseconds (default: 2500ms)
   */
  public startAutoFireworks(intervalMs = 2500): void {
    if (this.autoFireworksInterval !== null) return;

    this.autoFireworksInterval = setInterval(() => {
      // Alternate between dual flank cannons and celestial sky bursts
      if (Math.random() > 0.45) {
        this.fireRandomSkyFirework();
      } else {
        this.fireCelebrationBurst();
      }
    }, intervalMs);
  }

  /**
   * Stops recurring automatic fireworks.
   */
  public stopAutoFireworks(): void {
    if (this.autoFireworksInterval !== null) {
      clearInterval(this.autoFireworksInterval);
      this.autoFireworksInterval = null;
    }
  }

  /**
   * Returns whether recurring auto-fireworks are currently firing.
   */
  public isAutoFireworksActive(): boolean {
    return this.autoFireworksInterval !== null;
  }

  /**
   * Fires a vibrant spherical sky firework burst at a random celestial position.
   */
  public fireRandomSkyFirework(): void {
    const festivePalettes = [
      ['#ffd700', '#ffa500', '#ff4500', '#ffffff', '#ffeb3b'], // Golden Amber
      ['#ff007f', '#ff69b4', '#ffd700', '#ffffff', '#ff1493'], // Royal Magenta
      ['#00ffcc', '#00e5ff', '#ffd700', '#ffffff', '#76ff03'], // Emerald Spark
      ['#e040fb', '#7c4dff', '#ffd700', '#ffffff', '#ff9100'], // Radiant Violet
    ];

    const colors = festivePalettes[Math.floor(Math.random() * festivePalettes.length)];
    const originX = 0.15 + Math.random() * 0.7; // Avoid extreme screen edges
    const originY = 0.12 + Math.random() * 0.35; // Upper celestial sky

    confetti({
      origin: { x: originX, y: originY },
      particleCount: 55,
      spread: 360,
      startVelocity: 35,
      ticks: 180,
      gravity: 0.8,
      scalar: 0.85,
      colors,
      disableForReducedMotion: true,
    });

    try {
      AudioEngine.getInstance().playSparklerSizzle();
    } catch {
      // Graceful no-op in headless test environment
    }
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
    this.stopAutoFireworks();
    this.isActive = false;
    window.removeEventListener('pointerdown', this.onPointerDownBound);
    try {
      confetti.reset();
    } catch {
      // Ignored if canvas not mounted
    }
  }
}
