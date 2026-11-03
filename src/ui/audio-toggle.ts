import { AudioEngine } from '../audio/audio-engine';

/**
 * Floating glassmorphic audio toggle UI button control.
 *
 * Implements:
 * - Fixed top-right floating pill button (fixed top-4 right-4 z-20) (D-07)
 * - Glassmorphic Tailwind styling with amber border accent and blur (D-07)
 * - Real-time icon switching between acoustic waves and stroke slash (D-07)
 * - Click event stopPropagation preventing unwanted 3D scene raycast interference (D-07)
 * - Smooth 200ms master gain mute/unmute toggling via AudioEngine (D-07)
 * - Memory leak prevention via explicit dispose() cleanup (D-09, ASVS V14, T-04-05)
 */
export class AudioToggle {
  private buttonEl: HTMLButtonElement | null = null;
  private readonly audioEngine = AudioEngine.getInstance();

  /**
   * Mounts the floating button element into the specified parent container.
   */
  public mount(parentContainer: HTMLElement): void {
    if (this.buttonEl) return;

    this.buttonEl = document.createElement('button');
    this.buttonEl.id = 'audio-toggle-btn';
    this.buttonEl.type = 'button';
    this.buttonEl.setAttribute('aria-label', 'Toggle Sound');
    this.buttonEl.className =
      'fixed top-4 right-4 z-20 flex items-center justify-center w-11 h-11 rounded-full ' +
      'bg-white/[0.08] backdrop-blur-md border border-amber-500/30 text-amber-200 ' +
      'shadow-lg shadow-black/40 hover:bg-white/[0.14] active:scale-95 transition-all cursor-pointer';

    this.renderIcon(this.audioEngine.getMuted());

    this.buttonEl.addEventListener('click', (e: MouseEvent) => {
      // Stop propagation to prevent 3D canvas raycasting underneath (D-07)
      e.stopPropagation();
      const isMuted = this.audioEngine.toggleMute();
      this.renderIcon(isMuted);
    });

    parentContainer.appendChild(this.buttonEl);
  }

  /**
   * Renders static, verified SVGs based on mute state (T-04-05).
   */
  private renderIcon(isMuted: boolean): void {
    if (!this.buttonEl) return;

    if (isMuted) {
      // Muted speaker with diagonal slash stroke
      this.buttonEl.innerHTML =
        '<svg class="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" d="M11 5L6 9H2v6h4l5 4V5z"/>' +
        '<line x1="23" y1="9" x2="17" y2="15" stroke-linecap="round"/>' +
        '<line x1="17" y1="9" x2="23" y2="15" stroke-linecap="round"/>' +
        '</svg>';
    } else {
      // Unmuted active speaker with dual acoustic wave arcs
      this.buttonEl.innerHTML =
        '<svg class="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">' +
        '<path stroke-linecap="round" stroke-linejoin="round" d="M11 5L6 9H2v6h4l5 4V5z"/>' +
        '<path stroke-linecap="round" stroke-linejoin="round" d="M15.54 8.46a5 5 0 010 7.07"/>' +
        '<path stroke-linecap="round" stroke-linejoin="round" d="M19.07 4.93a10 10 0 010 14.14"/>' +
        '</svg>';
    }
  }

  /**
   * Returns current mute state from AudioEngine.
   */
  public isMutedState(): boolean {
    return this.audioEngine.getMuted();
  }

  /**
   * Returns the underlying button DOM element.
   */
  public getElement(): HTMLButtonElement | null {
    return this.buttonEl;
  }

  /**
   * Deallocates DOM elements and clears references per D-09, ASVS V14.
   */
  public dispose(): void {
    this.buttonEl?.remove();
    this.buttonEl = null;
  }
}
