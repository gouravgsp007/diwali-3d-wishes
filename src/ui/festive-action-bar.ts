import type { SceneManager } from '../graphics/scene-manager';
import type { MusicModal } from './music-modal';

/**
 * Opulent festive action bar floating dock.
 * Grants immediate 1-tap access to Diwali festive celebrations:
 * - ✨ Interactive Phuljhadi (Sparkler)
 * - 🏮 Akash Kandil (Sky Lantern Release)
 * - 🌸 Pushpa Vrishti (Flower Petal Shower)
 * - 🎆 Aatishbaazi (Diwali Fireworks)
 */
export class FestiveActionBar {
  private element: HTMLElement | null = null;
  private sparklerBtn: HTMLButtonElement | null = null;
  private toastEl: HTMLElement | null = null;
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly container: HTMLElement,
    private readonly sceneManager: SceneManager,
    _musicModal?: MusicModal
  ) {}

  public mount(): void {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.id = 'festive-action-bar';
    this.element.className =
      'fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 ' +
      'rounded-full bg-black/70 backdrop-blur-xl border border-amber-500/40 shadow-2xl shadow-amber-950/70 select-none pointer-events-auto';

    this.element.innerHTML = `
      <!-- 1. Interactive Sparkler (Phuljhadi) -->
      <button
        id="action-sparkler-btn"
        type="button"
        title="Light Handheld Sparkler (Touch to Draw Sparks)"
        class="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 border border-amber-400/30 text-amber-200 text-xs font-semibold tracking-wide transition-all cursor-pointer"
      >
        <span>✨</span>
        <span class="hidden xs:inline sm:inline">Sparkler</span>
      </button>

      <!-- 2. Sky Lantern Release (Akash Kandil) -->
      <button
        id="action-lantern-btn"
        type="button"
        title="Release Akash Kandil (Sky Lantern) with a Wish"
        class="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 border border-amber-400/30 text-amber-200 text-xs font-semibold tracking-wide transition-all cursor-pointer"
      >
        <span>🏮</span>
        <span class="hidden xs:inline sm:inline">Sky Lantern</span>
      </button>

      <!-- 3. Royal Flower Shower (Pushpa Vrishti) -->
      <button
        id="action-flowers-btn"
        type="button"
        title="Shower Marigold and Rose Petals"
        class="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 border border-amber-400/30 text-amber-200 text-xs font-semibold tracking-wide transition-all cursor-pointer"
      >
        <span>🌸</span>
        <span class="hidden xs:inline sm:inline">Flowers</span>
      </button>

      <!-- 4. Fireworks Burst -->
      <button
        id="action-fireworks-btn"
        type="button"
        title="Burst Golden Diwali Fireworks"
        class="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/25 to-yellow-500/30 hover:from-amber-500/35 hover:to-yellow-500/40 active:scale-95 border border-amber-400/40 text-amber-100 text-xs font-bold tracking-wide transition-all cursor-pointer shadow-sm"
      >
        <span>🎆</span>
        <span class="hidden xs:inline sm:inline">Fireworks</span>
      </button>
    `;

    this.container.appendChild(this.element);

    // Toast element for feedback
    this.toastEl = document.createElement('div');
    this.toastEl.id = 'festive-toast';
    this.toastEl.className =
      'fixed bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-md border border-amber-400/40 text-amber-200 text-xs font-medium shadow-2xl transition-all duration-300 opacity-0 pointer-events-none select-none text-center max-w-xs';
    this.container.appendChild(this.toastEl);

    this.attachEvents();
  }

  private attachEvents(): void {
    if (!this.element) return;

    // 1. Sparkler
    this.sparklerBtn = this.element.querySelector('#action-sparkler-btn') as HTMLButtonElement | null;
    this.sparklerBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = this.sceneManager.toggleSparkler();
      if (isActive) {
        this.sparklerBtn?.classList.add('bg-amber-400', 'text-stone-950', 'font-bold', 'border-amber-300');
        this.sparklerBtn?.classList.remove('bg-amber-500/15', 'text-amber-200');
        this.showToast('✨ Sparkler lit! Touch & drag anywhere to draw golden sparks!');
      } else {
        this.sparklerBtn?.classList.remove('bg-amber-400', 'text-stone-950', 'font-bold', 'border-amber-300');
        this.sparklerBtn?.classList.add('bg-amber-500/15', 'text-amber-200');
        this.showToast('Sparkler extinguished ✨');
      }
    });

    // 3. Sky Lantern
    const lanternBtn = this.element.querySelector('#action-lantern-btn');
    lanternBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sceneManager.triggerSkyLantern();
      this.showToast('🏮 Akash Kandil released! May your wishes illuminate the sky ✨');
    });

    // 4. Flowers
    const flowersBtn = this.element.querySelector('#action-flowers-btn');
    flowersBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sceneManager.triggerFlowerShower();
      this.showToast('🌸 Sacred Pushpa Vrishti offered upon the Diya thali!');
    });

    // 5. Fireworks
    const fireworksBtn = this.element.querySelector('#action-fireworks-btn');
    fireworksBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sceneManager.getCelebrationManager()?.fireCelebrationBurst();
      this.showToast('🎆 Happy Diwali! Celebrating with golden fireworks!');
    });
  }

  public showToast(message: string): void {
    if (!this.toastEl) return;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastEl.textContent = message;
    this.toastEl.classList.remove('opacity-0', 'pointer-events-none');
    this.toastEl.classList.add('opacity-100');

    this.toastTimeout = setTimeout(() => {
      this.toastEl?.classList.remove('opacity-100');
      this.toastEl?.classList.add('opacity-0', 'pointer-events-none');
      this.toastTimeout = null;
    }, 2800);
  }

  public dispose(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
    this.element?.remove();
    this.toastEl?.remove();
    this.element = null;
    this.toastEl = null;
    this.sparklerBtn = null;
  }
}
