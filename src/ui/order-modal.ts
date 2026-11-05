/**
 * OrderModal UI Controller
 *
 * Displays a high-converting, festive glassmorphic order modal for Instagram
 * visitors explaining the 3D Diya wish package and directing them to DM on
 * Instagram to purchase their custom wish.
 */
export class OrderModal {
  private overlayEl: HTMLElement | null = null;
  private isVisible = false;
  private readonly onHashChangeBound: () => void;
  private instagramUrl = 'https://instagram.com/';

  constructor(private container: HTMLElement, instagramHandle?: string) {
    if (instagramHandle) {
      const cleanHandle = instagramHandle.replace('@', '');
      this.instagramUrl = `https://ig.me/m/${cleanHandle}`;
    }
    this.onHashChangeBound = this.handleHashChange.bind(this);
    window.addEventListener('hashchange', this.onHashChangeBound);
  }

  public mount(): void {
    if (this.overlayEl) return;

    this.overlayEl = document.createElement('div');
    this.overlayEl.id = 'order-modal-overlay';
    this.overlayEl.className =
      'fixed inset-0 z-30 hidden items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto transition-opacity duration-300 opacity-0 pointer-events-none select-none';

    this.overlayEl.innerHTML = `
      <div
        id="order-card"
        class="relative w-full max-w-md my-auto rounded-3xl p-6 sm:p-8 bg-neutral-950/95 border border-amber-500/40 shadow-2xl shadow-amber-950/60 text-amber-100 flex flex-col gap-5 pointer-events-none transform transition-all duration-300 scale-95"
      >
        <!-- Close Button -->
        <button
          id="order-close-btn"
          type="button"
          aria-label="Close Order Modal"
          class="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-amber-400/80 hover:text-amber-200 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <!-- Header -->
        <div class="text-center">
          <div class="text-3xl mb-1 select-none">🪔</div>
          <p class="text-xs font-semibold tracking-widest uppercase text-amber-400/80 mb-1">
            ✨ SHUBH DEEPAVALI ✨
          </p>
          <h2 class="text-xl sm:text-2xl font-serif font-bold tracking-wide bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            Get Your Custom 3D Diwali Wish
          </h2>
          <p class="text-xs text-amber-200/70 mt-1 leading-relaxed">
            Send an unforgettable ceremonial 3D Diya that your loved one unlocks with a secret passcode!
          </p>
        </div>

        <!-- Features Showcase -->
        <div class="space-y-2.5 bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20 text-xs">
          <div class="flex items-start gap-2.5">
            <span class="text-amber-400 text-sm">🔑</span>
            <div>
              <strong class="text-amber-200">Custom Secret Passcode:</strong>
              <p class="text-amber-300/70">Unlocked only with their name, nickname, or special word you choose.</p>
            </div>
          </div>
          <div class="flex items-start gap-2.5">
            <span class="text-amber-400 text-sm">🪔</span>
            <div>
              <strong class="text-amber-200">Interactive 3D Ceremony:</strong>
              <p class="text-amber-300/70">They light the ceremonial diya on touch with golden sparks & flame.</p>
            </div>
          </div>
          <div class="flex items-start gap-2.5">
            <span class="text-amber-400 text-sm">🎶</span>
            <div>
              <strong class="text-amber-200">Acoustic Sitar & Confetti:</strong>
              <p class="text-amber-300/70">Plays real classical Indian instruments with celebratory fireworks.</p>
            </div>
          </div>
          <div class="flex items-start gap-2.5">
            <span class="text-amber-400 text-sm">💌</span>
            <div>
              <strong class="text-amber-200">Personalized Heartfelt Card:</strong>
              <p class="text-amber-300/70">Reveals your custom note with an instant "Reply on WhatsApp" button.</p>
            </div>
          </div>
        </div>

        <!-- 3-Step Process -->
        <div class="space-y-2 text-center text-xs">
          <p class="font-semibold text-amber-300 uppercase tracking-wider text-[11px]">How To Order (Takes 1 Minute)</p>
          <div class="grid grid-cols-3 gap-2 text-[11px] text-amber-200/80">
            <div class="bg-black/40 p-2.5 rounded-xl border border-amber-500/15 flex flex-col items-center">
              <span class="text-base mb-1">1️⃣</span>
              <span>DM Us on Instagram</span>
            </div>
            <div class="bg-black/40 p-2.5 rounded-xl border border-amber-500/15 flex flex-col items-center">
              <span class="text-base mb-1">2️⃣</span>
              <span>Send Message & Passcode</span>
            </div>
            <div class="bg-black/40 p-2.5 rounded-xl border border-amber-500/15 flex flex-col items-center">
              <span class="text-base mb-1">3️⃣</span>
              <span>Get Your Link & Share!</span>
            </div>
          </div>
        </div>

        <!-- Call to Action Button -->
        <a
          id="order-instagram-btn"
          href="${this.instagramUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 shadow-lg shadow-amber-500/30 active:scale-[0.98] hover:brightness-110 transition-all flex items-center justify-center gap-2 no-underline cursor-pointer"
        >
          <span>💬 DM on Instagram to Order ✨</span>
        </a>

        <!-- Footer / Seller Login link -->
        <div class="text-center pt-1 border-t border-amber-500/15">
          <a
            id="order-seller-login-btn"
            href="#create"
            class="text-[11px] text-amber-400/60 hover:text-amber-300 underline underline-offset-4 transition-colors cursor-pointer"
          >
            Seller Portal / Admin Access 🔐
          </a>
        </div>
      </div>
    `;

    this.container.appendChild(this.overlayEl);

    const closeBtn = this.overlayEl.querySelector('#order-close-btn');
    closeBtn?.addEventListener('click', () => this.hide());

    const sellerLoginBtn = this.overlayEl.querySelector('#order-seller-login-btn');
    sellerLoginBtn?.addEventListener('click', () => {
      this.hide(false);
      window.location.hash = '#create';
    });

    this.overlayEl.addEventListener('click', (e) => {
      if (e.target === this.overlayEl) {
        this.hide();
      }
    });

    // Check if initial hash is #order
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#order')) {
      this.show();
    }
  }

  public show(): void {
    this.isVisible = true;
    if (this.overlayEl) {
      this.overlayEl.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      this.overlayEl.classList.add('flex', 'opacity-100', 'pointer-events-auto');
      const card = this.overlayEl.querySelector('#order-card');
      card?.classList.remove('scale-95', 'pointer-events-none');
      card?.classList.add('scale-100', 'pointer-events-auto');
    }
  }

  public hide(updateHash = true): void {
    this.isVisible = false;
    if (this.overlayEl) {
      this.overlayEl.classList.remove('flex', 'opacity-100', 'pointer-events-auto');
      this.overlayEl.classList.add('hidden', 'opacity-0', 'pointer-events-none');
      const card = this.overlayEl.querySelector('#order-card');
      card?.classList.remove('scale-100', 'pointer-events-auto');
      card?.classList.add('scale-95', 'pointer-events-none');
    }

    if (updateHash && typeof window !== 'undefined' && window.location.hash.startsWith('#order')) {
      if (typeof history !== 'undefined' && typeof history.replaceState === 'function') {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      } else {
        window.location.hash = '';
      }
    }
  }

  public isOpen(): boolean {
    return this.isVisible;
  }

  public setInstagramHandle(handle: string): void {
    const cleanHandle = handle.replace('@', '');
    this.instagramUrl = `https://ig.me/m/${cleanHandle}`;
    const btn = this.overlayEl?.querySelector('#order-instagram-btn') as HTMLAnchorElement | null;
    if (btn) btn.href = this.instagramUrl;
  }

  private handleHashChange(): void {
    if (typeof window === 'undefined') return;
    if (window.location.hash.startsWith('#order')) {
      this.show();
    } else if (this.isVisible) {
      this.hide(false);
    }
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
