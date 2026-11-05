/**
 * Floating glassmorphic touch hint prompt component per D-03.
 *
 * Displays an ethereal floating pill prompt ("Touch & drag the flame to light your Diya")
 * with a pulsing gold indicator, explicit instruction, and a 1-tap "Tap to Light Diya" fallback button.
 *
 * Security & Reliability:
 * - Strictly static DOM template without dynamic unsanitized string interpolation (ASVS V5, T-04-02).
 * - Full DOM node removal and state reset on dispose() (D-09, ASVS V14).
 */
export class TouchHint {
  private element: HTMLElement | null = null;
  private isPromptVisible = false;
  private tapButtonListener: ((e: MouseEvent) => void) | null = null;

  constructor(private onTapLight?: () => void) {}

  /**
   * Updates or sets the 1-tap ignition callback.
   */
  public setOnTapLight(callback: () => void): void {
    this.onTapLight = callback;
  }

  /**
   * Mounts the floating hint element into the parent DOM container.
   */
  public mount(parentContainer: HTMLElement): void {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.id = 'touch-hint-prompt';
    this.element.setAttribute('role', 'status');
    this.element.setAttribute('aria-live', 'polite');
    this.element.className =
      'fixed bottom-12 md:bottom-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none ' +
      'flex flex-col items-center gap-2 px-5 py-2.5 rounded-full ' +
      'bg-amber-950/80 backdrop-blur-md border border-amber-400/40 text-amber-200 text-xs md:text-sm font-medium ' +
      'shadow-xl shadow-black/50 transition-all duration-500 opacity-0 scale-95 select-none';

    // Strictly static safe template with pulsing indicator per T-04-02
    this.element.innerHTML = `
      <button
        type="button"
        id="tap-to-light-btn"
        class="w-full py-2.5 px-6 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-stone-950 font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-95 transition-all pointer-events-auto cursor-pointer flex items-center justify-center gap-2"
      >
        <span>✨ Tap to Light Diya</span>
        <span class="text-base">🪔</span>
      </button>
      <div class="flex items-center gap-1.5 text-[11px] sm:text-xs text-amber-200/80">
        <span class="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
        <span>Touch &amp; drag the flame to light your Diya</span>
      </div>
    `;

    const btn = this.element.querySelector('#tap-to-light-btn');
    if (btn) {
      this.tapButtonListener = (e: MouseEvent) => {
        e.stopPropagation();
        this.onTapLight?.();
      };
      btn.addEventListener('click', this.tapButtonListener as EventListener);
    }

    parentContainer.appendChild(this.element);
  }

  /**
   * Fades in the touch hint prompt with smooth opacity and scale transition.
   */
  public show(): void {
    if (!this.element || this.isPromptVisible) return;
    this.isPromptVisible = true;
    this.element.classList.remove('opacity-0', 'scale-95');
    this.element.classList.add('opacity-100', 'scale-100');
  }

  /**
   * Fades out the touch hint prompt.
   */
  public hide(): void {
    if (!this.element || !this.isPromptVisible) return;
    this.isPromptVisible = false;
    this.element.classList.remove('opacity-100', 'scale-100');
    this.element.classList.add('opacity-0', 'scale-95');
  }

  /**
   * Returns whether the touch hint prompt is currently visible.
   */
  public isVisible(): boolean {
    return this.isPromptVisible;
  }

  /**
   * Returns the underlying DOM element or null if unmounted.
   */
  public getElement(): HTMLElement | null {
    return this.element;
  }

  /**
   * Removes element from DOM and cleans up state per D-09, ASVS V14.
   */
  public dispose(): void {
    if (this.element && this.tapButtonListener) {
      const btn = this.element.querySelector('#tap-to-light-btn');
      btn?.removeEventListener('click', this.tapButtonListener as EventListener);
      this.tapButtonListener = null;
    }
    this.element?.remove();
    this.element = null;
    this.isPromptVisible = false;
  }
}
