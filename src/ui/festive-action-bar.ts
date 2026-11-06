import type { SceneManager } from '../graphics/scene-manager';
import type { MusicModal } from './music-modal';
import type { ExperienceTheme } from '../themes/experience-theme.interface';

/**
 * Opulent festive action bar floating dock.
 * Grants immediate 1-tap access to festive celebrations:
 * - ✨ Interactive Sparkler (Phuljhadi)
 * - 🏮 Sky Lantern / Wish Release
 * - 🌸 Flower / Petal / Confetti Shower
 * - 🎆 Festive Fireworks
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
        <span class="action-icon">✨</span>
        <span class="action-text hidden xs:inline sm:inline">Sparkler</span>
      </button>

      <!-- 2. Sky Lantern Release (Akash Kandil) -->
      <button
        id="action-lantern-btn"
        type="button"
        title="Release Akash Kandil (Sky Lantern) with a Wish"
        class="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 border border-amber-400/30 text-amber-200 text-xs font-semibold tracking-wide transition-all cursor-pointer"
      >
        <span class="action-icon">🏮</span>
        <span class="action-text hidden xs:inline sm:inline">Sky Lantern</span>
      </button>

      <!-- 3. Royal Flower Shower (Pushpa Vrishti) -->
      <button
        id="action-flowers-btn"
        type="button"
        title="Shower Marigold and Rose Petals"
        class="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 border border-amber-400/30 text-amber-200 text-xs font-semibold tracking-wide transition-all cursor-pointer"
      >
        <span class="action-icon">🌸</span>
        <span class="action-text hidden xs:inline sm:inline">Flowers</span>
      </button>

      <!-- 4. Fireworks Burst -->
      <button
        id="action-fireworks-btn"
        type="button"
        title="Burst Golden Diwali Fireworks"
        class="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/25 to-yellow-500/30 hover:from-amber-500/35 hover:to-yellow-500/40 active:scale-95 border border-amber-400/40 text-amber-100 text-xs font-bold tracking-wide transition-all cursor-pointer shadow-sm"
      >
        <span class="action-icon">🎆</span>
        <span class="action-text hidden xs:inline sm:inline">Fireworks</span>
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

    const currentTheme = this.sceneManager.getTheme?.();
    if (currentTheme) {
      this.updateForTheme(currentTheme);
    }
  }

  public updateForTheme(theme: ExperienceTheme): void {
    if (!this.element) return;
    const lanternBtn = this.element.querySelector('#action-lantern-btn') as HTMLButtonElement | null;
    const flowersBtn = this.element.querySelector('#action-flowers-btn') as HTMLButtonElement | null;
    const fireworksBtn = this.element.querySelector('#action-fireworks-btn') as HTMLButtonElement | null;

    if (theme.id === 'birthday') {
      if (lanternBtn) {
        lanternBtn.title = 'Release Helium Birthday Balloons';
        const icon = lanternBtn.querySelector('.action-icon');
        const text = lanternBtn.querySelector('.action-text');
        if (icon) icon.textContent = '🎈';
        if (text) text.textContent = 'Balloons';
      }
      if (flowersBtn) {
        flowersBtn.title = 'Shower Confetti & Party Ribbons';
        const icon = flowersBtn.querySelector('.action-icon');
        const text = flowersBtn.querySelector('.action-text');
        if (icon) icon.textContent = '🎉';
        if (text) text.textContent = 'Confetti';
      }
      if (fireworksBtn) {
        fireworksBtn.title = 'Burst Birthday Party Fireworks';
        const icon = fireworksBtn.querySelector('.action-icon');
        const text = fireworksBtn.querySelector('.action-text');
        if (icon) icon.textContent = '🎆';
        if (text) text.textContent = 'Celebration';
      }
    } else if (theme.id === 'wedding') {
      if (lanternBtn) {
        lanternBtn.title = 'Release Auspicious Wish Lanterns';
        const icon = lanternBtn.querySelector('.action-icon');
        const text = lanternBtn.querySelector('.action-text');
        if (icon) icon.textContent = '🕊️';
        if (text) text.textContent = 'Wishes';
      }
      if (flowersBtn) {
        flowersBtn.title = 'Shower Royal Crimson Rose Petals';
        const icon = flowersBtn.querySelector('.action-icon');
        const text = flowersBtn.querySelector('.action-text');
        if (icon) icon.textContent = '🌹';
        if (text) text.textContent = 'Rose Petals';
      }
      if (fireworksBtn) {
        fireworksBtn.title = 'Celebrate Union with Fireworks';
        const icon = fireworksBtn.querySelector('.action-icon');
        const text = fireworksBtn.querySelector('.action-text');
        if (icon) icon.textContent = '🎆';
        if (text) text.textContent = 'Celebration';
      }
    } else if (theme.id === 'newyear') {
      if (lanternBtn) {
        lanternBtn.title = 'Release Midnight New Year Lanterns';
        const icon = lanternBtn.querySelector('.action-icon');
        const text = lanternBtn.querySelector('.action-text');
        if (icon) icon.textContent = '🏮';
        if (text) text.textContent = 'Lantern';
      }
      if (flowersBtn) {
        flowersBtn.title = 'Shower Golden Sparkles';
        const icon = flowersBtn.querySelector('.action-icon');
        const text = flowersBtn.querySelector('.action-text');
        if (icon) icon.textContent = '✨';
        if (text) text.textContent = 'Gold Shower';
      }
      if (fireworksBtn) {
        fireworksBtn.title = 'Burst Grand 2026 Midnight Fireworks';
        const icon = fireworksBtn.querySelector('.action-icon');
        const text = fireworksBtn.querySelector('.action-text');
        if (icon) icon.textContent = '🎆';
        if (text) text.textContent = '2026 Fireworks';
      }
    } else {
      if (lanternBtn) {
        lanternBtn.title = 'Release Akash Kandil (Sky Lantern) with a Wish';
        const icon = lanternBtn.querySelector('.action-icon');
        const text = lanternBtn.querySelector('.action-text');
        if (icon) icon.textContent = '🏮';
        if (text) text.textContent = 'Sky Lantern';
      }
      if (flowersBtn) {
        flowersBtn.title = 'Shower Marigold and Rose Petals';
        const icon = flowersBtn.querySelector('.action-icon');
        const text = flowersBtn.querySelector('.action-text');
        if (icon) icon.textContent = '🌸';
        if (text) text.textContent = 'Flowers';
      }
      if (fireworksBtn) {
        fireworksBtn.title = 'Burst Golden Diwali Fireworks';
        const icon = fireworksBtn.querySelector('.action-icon');
        const text = fireworksBtn.querySelector('.action-text');
        if (icon) icon.textContent = '🎆';
        if (text) text.textContent = 'Fireworks';
      }
    }
  }

  private attachEvents(): void {
    if (!this.element) return;

    // 1. Sparkler
    this.sparklerBtn = this.element.querySelector('#action-sparkler-btn') as HTMLButtonElement | null;

    // Synchronize button UI whenever SceneManager changes sparkler state (e.g. on pointerup)
    this.sceneManager.setOnSparklerStateChange?.((active) => {
      this.updateSparklerButtonUI(active);
    });

    let pointerStarted = false;
    let lastPointerReleaseTime = 0;

    // Press down with thumb: activate sparkler immediately and start tracking
    this.sparklerBtn?.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      pointerStarted = true;
      if (this.sparklerBtn && 'setPointerCapture' in this.sparklerBtn) {
        try {
          this.sparklerBtn.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
      if (!this.sceneManager.isSparklerActive()) {
        this.sceneManager.setSparklerActive(true);
        this.updateSparklerButtonUI(true);
        this.showSparklerLitToast();
      }
      this.sceneManager.handlePointerMove?.(e);
    });

    // Dragging thumb while pressed: forward coordinates so sparks follow thumb
    this.sparklerBtn?.addEventListener('pointermove', (e) => {
      if (pointerStarted && this.sceneManager.isSparklerActive()) {
        this.sceneManager.handlePointerMove?.(e);
      }
    });

    // Release thumb (pointerup / pointercancel / lostpointercapture): extinguish immediately
    const onThumbRelease = (e: Event) => {
      if (pointerStarted) {
        pointerStarted = false;
        lastPointerReleaseTime = Date.now();
        e.stopPropagation();
        this.sceneManager.setSparklerActive(false);
        this.updateSparklerButtonUI(false);
        this.showToast('Sparkler extinguished ✨');
      }
    };

    this.sparklerBtn?.addEventListener('pointerup', onThumbRelease);
    this.sparklerBtn?.addEventListener('pointercancel', onThumbRelease);
    this.sparklerBtn?.addEventListener('lostpointercapture', onThumbRelease);

    // Fallback click handler (supports keyboard Enter / programmatic click in unit tests)
    this.sparklerBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      // Suppress trailing click event synthesized by browser after pointer release
      if (Date.now() - lastPointerReleaseTime < 450) {
        return;
      }
      if (pointerStarted) {
        pointerStarted = false;
        return;
      }
      const isActive = this.sceneManager.toggleSparkler();
      this.updateSparklerButtonUI(isActive);
      if (isActive) {
        this.showSparklerLitToast();
      } else {
        this.showToast('Sparkler extinguished ✨');
      }
    });

    // 2. Sky Lantern / Wish
    const lanternBtn = this.element.querySelector('#action-lantern-btn');
    lanternBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sceneManager.triggerSkyLantern();
      const themeId = this.sceneManager.getTheme?.()?.id;
      if (themeId === 'birthday') {
        this.showToast('🎈 Colorful party balloons floating to the sky! Happy Birthday! ✨');
      } else if (themeId === 'wedding') {
        this.showToast('🕊️ Golden wish lanterns released for the lovely couple! 🏮');
      } else if (themeId === 'newyear') {
        this.showToast('🏮 Midnight lanterns rising to welcome a prosperous 2026! ✨');
      } else {
        this.showToast('🏮 Akash Kandil released! May your wishes illuminate the sky ✨');
      }
    });

    // 3. Flowers / Petals / Confetti
    const flowersBtn = this.element.querySelector('#action-flowers-btn');
    flowersBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sceneManager.triggerFlowerShower();
      const themeId = this.sceneManager.getTheme?.()?.id;
      if (themeId === 'birthday') {
        this.showToast('🎉 Birthday confetti & festive flowers showered! 🌸');
      } else if (themeId === 'wedding') {
        this.showToast('🌹 Royal crimson rose petals blessed upon the couple! 🌹');
      } else if (themeId === 'newyear') {
        this.showToast('✨ Golden celebration sparkle shower welcoming 2026! 🥂');
      } else {
        this.showToast('🌸 Sacred Pushpa Vrishti offered upon the Diya thali!');
      }
    });

    // 4. Fireworks
    const fireworksBtn = this.element.querySelector('#action-fireworks-btn');
    fireworksBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sceneManager.getCelebrationManager()?.fireCelebrationBurst();
      const themeId = this.sceneManager.getTheme?.()?.id;
      if (themeId === 'birthday') {
        this.showToast('🎂 Happy Birthday! Celebrating with bright fireworks! 🎆');
      } else if (themeId === 'wedding') {
        this.showToast('💍 Congratulations! Celebrating eternal love with fireworks! 🎆');
      } else if (themeId === 'newyear') {
        this.showToast('🥂 Happy New Year 2026! Grand fireworks celebration! 🎆');
      } else {
        this.showToast('🎆 Happy Diwali! Celebrating with golden fireworks!');
      }
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

  public updateSparklerButtonUI(active: boolean): void {
    if (!this.sparklerBtn) return;
    if (active) {
      this.sparklerBtn.classList.add('bg-amber-400', 'text-stone-950', 'font-bold', 'border-amber-300');
      this.sparklerBtn.classList.remove('bg-amber-500/15', 'text-amber-200');
    } else {
      this.sparklerBtn.classList.remove('bg-amber-400', 'text-stone-950', 'font-bold', 'border-amber-300');
      this.sparklerBtn.classList.add('bg-amber-500/15', 'text-amber-200');
    }
  }

  private showSparklerLitToast(): void {
    const themeId = this.sceneManager.getTheme?.()?.id;
    if (themeId === 'birthday') {
      this.showToast('✨ Sparkler lit! Draw magic birthday sparkles in the air!');
    } else if (themeId === 'wedding') {
      this.showToast('✨ Golden sparkler lit! Draw love sparkles for the couple!');
    } else if (themeId === 'newyear') {
      this.showToast('✨ 2026 Celebration sparkler lit! Draw fireworks in the air!');
    } else {
      this.showToast('✨ Sparkler lit! Touch & drag anywhere to draw golden sparks!');
    }
  }

  public dispose(): void {
    this.sceneManager.setOnSparklerStateChange?.(() => {});
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
