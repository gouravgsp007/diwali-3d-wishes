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
   * Fires festive multi-point golden sparkles across 3-4 coordinated points at once
   * over the screen and greeting card.
   *
   * @param originX Normalized horizontal coordinate [0, 1]
   * @param originY Normalized vertical coordinate [0, 1]
   */
  public fireMultiPointSparkle(originX: number, originY: number): void {
    const festiveColors = ['#ffd700', '#ff9900', '#ffffff', '#ffcc00', '#ffa500', '#fff3b0'];

    // 4 coordinated burst coordinates surrounding the tap/trigger point
    const points = [
      { x: originX, y: originY, count: 20, spread: 50 },
      {
        x: Math.max(0.04, Math.min(0.96, originX - 0.10)),
        y: Math.max(0.04, Math.min(0.96, originY - 0.08)),
        count: 14,
        spread: 40,
      },
      {
        x: Math.max(0.04, Math.min(0.96, originX + 0.12)),
        y: Math.max(0.04, Math.min(0.96, originY - 0.06)),
        count: 14,
        spread: 40,
      },
      {
        x: Math.max(0.04, Math.min(0.96, originX - 0.04)),
        y: Math.max(0.04, Math.min(0.96, originY + 0.09)),
        count: 12,
        spread: 35,
      },
    ];

    points.forEach((pt) => {
      confetti({
        origin: { x: pt.x, y: pt.y },
        particleCount: pt.count,
        spread: pt.spread,
        startVelocity: 16,
        scalar: 0.65,
        ticks: 90,
        colors: festiveColors,
        disableForReducedMotion: true,
      });
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
   * Fires 4 coordinated sparkling bursts around the perimeter and corners of the wish message card.
   */
  public fireCardSparkleSalute(): void {
    const festiveColors = ['#ffd700', '#ffaa00', '#ffffff', '#ff8800', '#fff3b0'];
    const cardCorners = [
      { x: 0.28, y: 0.62 }, // Upper-left corner
      { x: 0.72, y: 0.62 }, // Upper-right corner
      { x: 0.32, y: 0.82 }, // Lower-left flank
      { x: 0.68, y: 0.82 }, // Lower-right flank
    ];

    cardCorners.forEach((pt) => {
      confetti({
        origin: { x: pt.x, y: pt.y },
        particleCount: 18,
        spread: 45,
        startVelocity: 17,
        scalar: 0.68,
        ticks: 85,
        colors: festiveColors,
        disableForReducedMotion: true,
      });
    });

    try {
      AudioEngine.getInstance().playSparklerSizzle();
    } catch {
      // Graceful no-op
    }
  }

  /**
   * Handles pointerdown events on the screen outside of card interactive elements.
   * Tapping directly on the greeting card triggers sparkles OVER the card!
   */
  private handlePointerDown(e: PointerEvent): void {
    if (!this.isActive) return;

    // Click delegation: Ignore clicks on actionable controls (buttons, links, inputs, textareas)
    // Taps directly on #greeting-card trigger sparkles OVER the card!
    const target = e.target as HTMLElement | null;
    if (typeof target?.closest === 'function' && target.closest('button, a, input, textarea')) {
      return;
    }

    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    const originX = Math.max(0, Math.min(1, e.clientX / width));
    const originY = Math.max(0, Math.min(1, e.clientY / height));

    this.fireMultiPointSparkle(originX, originY);
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
