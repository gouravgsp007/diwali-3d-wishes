import type { OccasionId } from '../themes/experience-theme.interface';

export interface ShowcaseModalOptions {
  container: HTMLElement;
  instagramHandle?: string;
  onSelectOccasion?: (occasion: OccasionId) => void;
  onClose?: () => void;
}

/**
 * ShowcaseModal UI Controller
 *
 * provides an Instagram Bio link showcase allowing prospective buyers
 * to preview all 4 festive experiences (Diwali, Birthday, Wedding, New Year)
 * in real-time 3D, and directly order their custom personalized package
 * via Instagram DM (@dreamroutes07) for festive offer of ₹49 (original ₹99).
 */
export class ShowcaseModal {
  private overlayEl: HTMLElement | null = null;
  private isVisible = false;
  private readonly onHashChangeBound: () => void;
  private instagramUrl: string;

  constructor(private readonly options: ShowcaseModalOptions) {
    const handle = options.instagramHandle || 'dreamroutes07';
    this.instagramUrl = `https://www.instagram.com/${handle}?vrfl=MWhxb282aGZoYWpoeA==`;
    this.onHashChangeBound = this.handleHashChange.bind(this);
    window.addEventListener('hashchange', this.onHashChangeBound);
  }

  public mount(): void {
    if (this.overlayEl) return;

    this.overlayEl = document.createElement('div');
    this.overlayEl.id = 'showcase-modal-overlay';
    this.overlayEl.className =
      'fixed inset-0 z-30 hidden items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto transition-opacity duration-300 opacity-0 pointer-events-none select-none';

    this.overlayEl.innerHTML = `
      <div
        id="showcase-card"
        class="relative w-full max-w-xl my-auto rounded-3xl p-6 sm:p-8 bg-neutral-950/95 border border-amber-500/40 shadow-2xl shadow-amber-950/70 text-amber-100 flex flex-col gap-6 pointer-events-none transform transition-all duration-300 scale-95"
      >
        <!-- Close Button -->
        <button
          id="showcase-close-btn"
          type="button"
          aria-label="Close Showcase Modal"
          class="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-amber-400/80 hover:text-amber-200 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <!-- Header -->
        <div class="text-center">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-[11px] font-semibold text-amber-300 uppercase tracking-widest mb-2">
            ✨ Interactive 3D Celebrations ✨
          </div>
          <h2 class="text-2xl sm:text-3xl font-serif font-bold tracking-wide bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            Choose Your Occasion
          </h2>
          <p class="text-xs sm:text-sm text-amber-200/70 mt-1 max-w-md mx-auto">
            Tap any celebration to test the 3D interaction. Order a personalized surprise for your loved one for special festive offer ₹49 (Original ₹99 - 50% OFF)!
          </p>
        </div>

        <!-- 4 Occasions Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <!-- 1. Diwali -->
          <button
            type="button"
            data-preview-occasion="diwali"
            class="showcase-card-btn group text-left p-4 rounded-2xl bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-lg"
          >
            <div>
              <div class="flex items-center justify-between">
                <span class="text-3xl group-hover:scale-110 transition-transform">🪔</span>
                <span class="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">Diwali</span>
              </div>
              <h3 class="text-base font-serif font-bold text-amber-100 mt-2 group-hover:text-amber-300 transition-colors">
                Shubh Deepavali Diya
              </h3>
              <p class="text-xs text-amber-200/70 mt-1 leading-relaxed">
                Ceremonial terracotta diya, touch-to-light flame, marigold garland, and sky lanterns.
              </p>
            </div>
            <div class="text-xs font-semibold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Preview Diya 3D</span>
              <span>→</span>
            </div>
          </button>

          <!-- 2. Birthday -->
          <button
            type="button"
            data-preview-occasion="birthday"
            class="showcase-card-btn group text-left p-4 rounded-2xl bg-pink-950/30 hover:bg-pink-900/40 border border-pink-500/30 hover:border-pink-400 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-lg"
          >
            <div>
              <div class="flex items-center justify-between">
                <span class="text-3xl group-hover:scale-110 transition-transform">🎂</span>
                <span class="text-[10px] uppercase font-bold tracking-wider text-pink-400 bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-400/30">Birthday</span>
              </div>
              <h3 class="text-base font-serif font-bold text-pink-100 mt-2 group-hover:text-pink-300 transition-colors">
                Birthday Cake & Candles
              </h3>
              <p class="text-xs text-pink-200/70 mt-1 leading-relaxed">
                Tiered celebratory cake with lit candles. Tap to blow out candles & release helium balloons.
              </p>
            </div>
            <div class="text-xs font-semibold text-pink-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Preview Birthday 3D</span>
              <span>→</span>
            </div>
          </button>

          <!-- 3. Wedding & Engagement -->
          <button
            type="button"
            data-preview-occasion="wedding"
            class="showcase-card-btn group text-left p-4 rounded-2xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 hover:border-rose-400 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-lg"
          >
            <div>
              <div class="flex items-center justify-between">
                <span class="text-3xl group-hover:scale-110 transition-transform">💍</span>
                <span class="text-[10px] uppercase font-bold tracking-wider text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-400/30">Wedding</span>
              </div>
              <h3 class="text-base font-serif font-bold text-rose-100 mt-2 group-hover:text-rose-300 transition-colors">
                Royal Jewelry Box Reveal
              </h3>
              <p class="text-xs text-rose-200/70 mt-1 leading-relaxed">
                Golden filigree velvet box. Tap the clasp to reveal diamond rings and cascading rose petals.
              </p>
            </div>
            <div class="text-xs font-semibold text-rose-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Preview Wedding 3D</span>
              <span>→</span>
            </div>
          </button>

          <!-- 4. Happy New Year -->
          <button
            type="button"
            data-preview-occasion="newyear"
            class="showcase-card-btn group text-left p-4 rounded-2xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 hover:border-purple-400 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-lg"
          >
            <div>
              <div class="flex items-center justify-between">
                <span class="text-3xl group-hover:scale-110 transition-transform">🥂</span>
                <span class="text-[10px] uppercase font-bold tracking-wider text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-400/30">New Year</span>
              </div>
              <h3 class="text-base font-serif font-bold text-purple-100 mt-2 group-hover:text-purple-300 transition-colors">
                Midnight Champagne Pop
              </h3>
              <p class="text-xs text-purple-200/70 mt-1 leading-relaxed">
                Midnight Roman numeral clock striking 12, popping champagne cork & golden fireworks show.
              </p>
            </div>
            <div class="text-xs font-semibold text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Preview New Year 3D</span>
              <span>→</span>
            </div>
          </button>
        </div>

        <!-- Order Call to Action -->
        <div class="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <div class="text-xs font-bold text-amber-200 flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
              <span>Special Festive Offer:</span>
              <span class="text-yellow-300 font-extrabold text-sm">₹49</span>
              <span class="line-through text-neutral-400 font-normal">₹99</span>
              <span class="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded font-bold">50% OFF</span>
            </div>
            <div class="text-[11px] text-amber-300/70">Custom passcode, intimate personal message & custom music.</div>
          </div>
          <a
            id="showcase-order-btn"
            href="${this.instagramUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full sm:w-auto px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all text-center"
          >
            Order via Instagram DM 💬
          </a>
        </div>

        <!-- Footer Direct Order Link -->
        <div class="text-center text-[11px] text-amber-400/70">
          Want your own custom personalized celebration? <a href="${this.instagramUrl}" target="_blank" rel="noopener noreferrer" class="underline text-amber-300 hover:text-amber-100">DM @dreamroutes07 on Instagram</a>
        </div>
      </div>
    `;

    this.options.container.appendChild(this.overlayEl);
    this.initListeners();
    this.handleHashChange();
  }

  private initListeners(): void {
    if (!this.overlayEl) return;

    // Close button
    const closeBtn = this.overlayEl.querySelector('#showcase-close-btn');
    closeBtn?.addEventListener('click', () => this.hide());

    // Backdrop click
    this.overlayEl.addEventListener('click', (e) => {
      if (e.target === this.overlayEl) {
        this.hide();
      }
    });

    // Preview occasion buttons
    const previewBtns = this.overlayEl.querySelectorAll('.showcase-card-btn');
    previewBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const occ = (e.currentTarget as HTMLElement).getAttribute('data-preview-occasion') as OccasionId;
        if (occ) {
          this.options.onSelectOccasion?.(occ);
          this.hide();
        }
      });
    });
  }

  private handleHashChange(): void {
    if (typeof window === 'undefined') return;
    if (window.location.hash.startsWith('#showcase') || window.location.hash.startsWith('#explore')) {
      this.show();
    } else if (this.isVisible) {
      this.hide(false);
    }
  }

  public show(): void {
    this.isVisible = true;
    if (this.overlayEl) {
      this.overlayEl.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      this.overlayEl.classList.add('flex', 'opacity-100', 'pointer-events-auto');

      const card = this.overlayEl.querySelector('#showcase-card');
      card?.classList.remove('scale-95', 'pointer-events-none');
      card?.classList.add('scale-100', 'pointer-events-auto');
    }
  }

  public hide(updateHash = true): void {
    this.isVisible = false;
    if (this.overlayEl) {
      this.overlayEl.classList.remove('opacity-100', 'pointer-events-auto');
      this.overlayEl.classList.add('opacity-0', 'pointer-events-none');

      const card = this.overlayEl.querySelector('#showcase-card');
      card?.classList.remove('scale-100', 'pointer-events-auto');
      card?.classList.add('scale-95', 'pointer-events-none');

      setTimeout(() => {
        if (!this.isVisible && this.overlayEl) {
          this.overlayEl.classList.remove('flex');
          this.overlayEl.classList.add('hidden');
        }
      }, 300);
    }

    if (updateHash && typeof window !== 'undefined' && (window.location.hash.startsWith('#showcase') || window.location.hash.startsWith('#explore'))) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    this.options.onClose?.();
  }

  public isOpen(): boolean {
    return this.isVisible;
  }

  public getOverlayElement(): HTMLElement | null {
    return this.overlayEl;
  }

  public dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('hashchange', this.onHashChangeBound);
    }
    this.overlayEl?.remove();
    this.overlayEl = null;
    this.isVisible = false;
  }
}
