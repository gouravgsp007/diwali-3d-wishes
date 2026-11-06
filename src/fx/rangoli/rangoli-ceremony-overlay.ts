import confetti from 'canvas-confetti';
import { RangoliCanvas } from './rangoli-canvas';
import { AudioEngine } from '../../audio/audio-engine';

export interface RangoliCeremonyOptions {
  container: HTMLElement;
  onComplete: () => void;
  onSkip: () => void;
}

export class RangoliCeremonyOverlay {
  private element: HTMLElement | null = null;
  private canvasHost: HTMLElement | null = null;
  private rangoliCanvas: RangoliCanvas | null = null;
  private progressFillCircle: SVGCircleElement | null = null;
  private progressText: HTMLElement | null = null;
  private completeBtn: HTMLButtonElement | null = null;

  private isCompleted = false;
  private autoTriggered = false;
  private autoTriggerTimer: ReturnType<typeof setTimeout> | null = null;
  private confettiTimer: ReturnType<typeof setTimeout> | null = null;
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: RangoliCeremonyOptions) {}

  public mount(): void {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.id = 'rangoli-ceremony-overlay';
    this.element.className =
      'fixed inset-0 z-40 flex flex-col items-center justify-between p-4 sm:p-6 bg-stone-950/85 backdrop-blur-md transition-opacity duration-700 opacity-0 pointer-events-auto select-none';

    this.element.innerHTML = `
      <!-- Top Navigation & Headline Bar -->
      <div class="w-full max-w-xl flex items-start justify-between gap-4 z-10 pt-2">
        <div class="flex-1 text-center sm:text-left">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>🪔</span> Sacred Rangoli Ritual
          </div>
          <h2 class="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 bg-clip-text text-transparent drop-shadow">
            Let's create something beautiful this Diwali!
          </h2>
          <p class="text-xs sm:text-sm text-amber-200/70 mt-0.5 font-medium">
            दीपावली के इस पावन अवसर पर, आइए कुछ सुंदर बनाएं ✨
          </p>
        </div>

        <!-- Skip to Wish Button -->
        <button
          id="rangoli-skip-btn"
          type="button"
          class="shrink-0 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-stone-200 text-xs font-medium tracking-wide transition-all cursor-pointer shadow"
          title="Skip to Greeting Card"
        >
          Skip to Wish →
        </button>
      </div>

      <!-- Center Interactive Drawing Canvas Container -->
      <div id="rangoli-canvas-host" class="relative w-full max-w-lg aspect-square flex-1 flex items-center justify-center my-2 sm:my-4">
        <!-- Live Circular Progress Ring (Subtle perimeter) -->
        <svg class="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-10" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="47"
            class="stroke-amber-500/15 fill-none"
            stroke-width="1.5"
          />
          <circle
            id="rangoli-progress-circle"
            cx="50"
            cy="50"
            r="47"
            class="stroke-amber-400 fill-none transition-all duration-150 ease-out"
            stroke-width="2.5"
            stroke-dasharray="295.3"
            stroke-dashoffset="295.3"
            stroke-linecap="round"
          />
        </svg>
      </div>

      <!-- Bottom Hint & Complete Action Controls -->
      <div class="w-full max-w-sm flex flex-col items-center gap-2.5 z-10 pb-2 sm:pb-4">
        <div class="flex items-center gap-2 text-xs font-medium text-amber-200/80 bg-black/40 px-3.5 py-1.5 rounded-full border border-amber-400/20 backdrop-blur-sm">
          <span>🎨</span>
          <span>Trace or draw freely inside the glowing mandala</span>
          <span id="rangoli-progress-text" class="text-amber-300 font-bold ml-1">0%</span>
        </div>

        <button
          id="rangoli-complete-btn"
          type="button"
          class="w-full py-2.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-stone-950 text-sm font-bold tracking-wide shadow-lg shadow-amber-500/25 transition-all opacity-50 pointer-events-none active:scale-95 cursor-pointer"
        >
          Complete Blessing ✨
        </button>
      </div>
    `;

    this.options.container.appendChild(this.element);

    this.canvasHost = this.element.querySelector('#rangoli-canvas-host');
    this.progressFillCircle = this.element.querySelector('#rangoli-progress-circle');
    this.progressText = this.element.querySelector('#rangoli-progress-text');
    this.completeBtn = this.element.querySelector('#rangoli-complete-btn');

    if (this.canvasHost) {
      this.rangoliCanvas = new RangoliCanvas(this.canvasHost);
      this.rangoliCanvas.setOnProgress((progress) => this.handleProgress(progress));
    }

    const skipBtn = this.element.querySelector('#rangoli-skip-btn');
    skipBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.skip();
    });

    this.completeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.finish();
    });

    // Fade in smoothly
    requestAnimationFrame(() => {
      this.element?.classList.remove('opacity-0');
      this.element?.classList.add('opacity-100');
    });
  }

  private handleProgress(progress: number): void {
    if (this.isCompleted) return;

    const percent = Math.min(100, Math.floor(progress * 100));
    if (this.progressText) {
      this.progressText.textContent = `${percent}%`;
    }

    // 2 * PI * r = 2 * PI * 47 = ~295.3
    const maxOffset = 295.3;
    const offset = maxOffset * (1 - progress);
    if (this.progressFillCircle) {
      this.progressFillCircle.style.strokeDashoffset = offset.toFixed(1);
    }

    if (progress >= 0.70) {
      if (this.completeBtn) {
        this.completeBtn.classList.remove('opacity-50', 'pointer-events-none');
        this.completeBtn.classList.add('opacity-100', 'animate-pulse');
      }

      // Auto-complete gracefully after achieving 90% coverage
      if (progress >= 0.90 && !this.autoTriggered) {
        this.autoTriggered = true;
        if (this.autoTriggerTimer) clearTimeout(this.autoTriggerTimer);
        this.autoTriggerTimer = setTimeout(() => {
          this.autoTriggerTimer = null;
          if (!this.isCompleted) {
            this.finish();
          }
        }, 600);
      }
    }
  }

  /**
   * Triggers the golden sparkle animation, audio chime, and transitions to the greeting reveal.
   */
  public finish(): void {
    if (this.isCompleted) return;
    this.isCompleted = true;
    if (this.autoTriggerTimer) {
      clearTimeout(this.autoTriggerTimer);
      this.autoTriggerTimer = null;
    }

    // 1. Auspicious celestial harp chime
    AudioEngine.getInstance().playRangoliChime();

    // 2. Dual celebratory golden sparkle confetti burst
    confetti({
      particleCount: 85,
      spread: 90,
      origin: { y: 0.55 },
      colors: ['#FFD700', '#FFA500', '#FF4500', '#FFFFFF', '#00CED1'],
      disableForReducedMotion: true,
    });

    if (this.confettiTimer) clearTimeout(this.confettiTimer);
    this.confettiTimer = setTimeout(() => {
      this.confettiTimer = null;
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 70,
        origin: { x: 0.2, y: 0.6 },
        colors: ['#FFD700', '#FFE4B5', '#FF69B4'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 70,
        origin: { x: 0.8, y: 0.6 },
        colors: ['#FFD700', '#FFE4B5', '#00FA9A'],
      });
    }, 250);

    // 3. Smooth fade out and clean unmount
    this.fadeOutAndDismiss(() => {
      this.options.onComplete();
    });
  }

  public skip(): void {
    if (this.isCompleted) return;
    this.isCompleted = true;
    if (this.autoTriggerTimer) {
      clearTimeout(this.autoTriggerTimer);
      this.autoTriggerTimer = null;
    }

    this.fadeOutAndDismiss(() => {
      this.options.onSkip();
    });
  }

  private fadeOutAndDismiss(callback: () => void): void {
    if (!this.element) {
      callback();
      return;
    }

    this.element.classList.remove('opacity-100');
    this.element.classList.add('opacity-0', 'pointer-events-none');

    if (this.dismissTimer) clearTimeout(this.dismissTimer);
    this.dismissTimer = setTimeout(() => {
      this.dismissTimer = null;
      this.dispose();
      callback();
    }, 700);
  }

  public dispose(): void {
    if (this.autoTriggerTimer) {
      clearTimeout(this.autoTriggerTimer);
      this.autoTriggerTimer = null;
    }
    if (this.confettiTimer) {
      clearTimeout(this.confettiTimer);
      this.confettiTimer = null;
    }
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
    this.rangoliCanvas?.dispose();
    this.rangoliCanvas = null;
    this.element?.remove();
    this.element = null;
  }
}
