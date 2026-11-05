import type { GreetingPayload } from '../crypto/types';
import { createWhatsAppReplyUrl } from './whatsapp-link';

/**
 * Opulent Glassmorphic Greeting Card Modal component.
 *
 * Displays personalized Diwali greetings with shimmering gold typography,
 * traditional Indian filigree motifs, and a pre-filled WhatsApp reciprocation link.
 *
 * Security & Reliability:
 * - Recipient, message, and sender text nodes are written strictly via textContent (ASVS V5).
 * - Safe fallback defaults for empty or missing payload fields (D-02).
 * - Proper cleanup on dispose() without leaking DOM nodes or event references (D-07, ASVS V14).
 */
export class GreetingModal {
  private overlayEl: HTMLElement | null = null;
  private cardEl: HTMLElement | null = null;
  private pillEl: HTMLElement | null = null;
  private pillTextEl: HTMLElement | null = null;
  private toggleBtnEl: HTMLButtonElement | null = null;
  private recipientEl: HTMLElement | null = null;
  private messageEl: HTMLElement | null = null;
  private senderEl: HTMLElement | null = null;
  private whatsappBtnEl: HTMLAnchorElement | null = null;
  private creatorBadgeEl: HTMLAnchorElement | null = null;

  /**
   * Mounts the modal overlay and static card skeleton into the container.
   */
  public mount(parentContainer: HTMLElement): void {
    if (this.overlayEl) return;

    this.overlayEl = document.createElement('div');
    this.overlayEl.id = 'greeting-modal-overlay';
    this.overlayEl.className =
      'fixed inset-0 z-10 hidden items-end justify-center pb-20 sm:pb-16 p-3 sm:p-4 pointer-events-none select-none';

    // Static HTML skeleton without dynamic string interpolation (ASVS V5)
    this.overlayEl.innerHTML = `
      <!-- Minimized Greeting Pill (Toggleable) -->
      <div
        id="greeting-pill"
        class="hidden items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-black/75 backdrop-blur-xl border border-amber-500/50 text-amber-200 text-xs font-semibold shadow-xl cursor-pointer hover:border-amber-400 pointer-events-auto transition-all active:scale-95 z-30"
      >
        <span class="text-amber-400">✉️</span>
        <span id="greeting-pill-text">View Wish</span>
        <span class="text-[10px] text-amber-400/90 uppercase tracking-widest bg-amber-500/25 px-2 py-0.5 rounded-full font-bold">Open</span>
      </div>

      <!-- Expanded Festive Greeting Card -->
      <div
        id="greeting-card"
        class="w-full max-w-sm sm:max-w-md rounded-3xl p-4 sm:p-6 bg-black/40 backdrop-blur-xl border border-amber-500/40 shadow-2xl shadow-amber-950/50 text-center transition-all duration-500 ease-out opacity-0 scale-95 translate-y-4 pointer-events-none"
      >
        <div class="flex items-center justify-between pb-1.5 mb-1.5 border-b border-amber-500/20">
          <p class="text-[11px] font-semibold tracking-widest uppercase text-amber-400/90">
            ✨ Shubh Deepavali ✨
          </p>
          <button
            id="card-toggle-btn"
            type="button"
            class="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
            title="Minimize wish to view full 3D Diya"
          >
            <span>View Diya</span>
            <span>🪔</span>
          </button>
        </div>

        <h2 class="text-xl sm:text-2xl font-serif font-bold bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent mb-1">
          Happy Diwali
        </h2>
        <div class="flex items-center justify-center my-2 text-amber-400/50">
          <svg class="w-32 h-4 fill-none stroke-current stroke-1.5" viewBox="0 0 160 20">
            <path d="M10 10 Q 40 18, 70 10 Q 75 4, 80 1 Q 85 4, 90 10 Q 120 18, 150 10" />
            <circle cx="80" cy="5" r="2.5" class="fill-amber-400" />
            <circle cx="65" cy="10" r="1.5" class="fill-amber-400/80" />
            <circle cx="95" cy="10" r="1.5" class="fill-amber-400/80" />
          </svg>
        </div>
        <p id="greeting-recipient" class="text-xs sm:text-sm font-semibold text-amber-200/90 tracking-wide mb-1"></p>
        <div class="my-2 max-h-28 sm:max-h-36 overflow-y-auto px-1">
          <p id="greeting-message" class="text-xs sm:text-sm italic text-amber-100/95 leading-relaxed font-serif"></p>
        </div>
        <p id="greeting-sender" class="text-xs sm:text-sm font-semibold text-amber-300 tracking-wide mt-1 mb-3"></p>
        <a
          id="whatsapp-reply-btn"
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full py-2.5 px-5 rounded-xl font-semibold text-xs sm:text-sm tracking-wider uppercase bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-amber-950 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer no-underline pointer-events-none"
        >
          <span>Reply Happy Diwali on WhatsApp</span>
          <span class="text-base">✨</span>
        </a>
        <div class="mt-3">
          <a
            id="creator-badge"
            href="#create"
            class="text-[11px] font-medium text-amber-400/70 hover:text-amber-300 underline underline-offset-4 transition-colors cursor-pointer pointer-events-none"
          >
            Create Your Own Wish ✨
          </a>
        </div>
      </div>
    `;

    parentContainer.appendChild(this.overlayEl);
    this.cardEl = this.overlayEl.querySelector('#greeting-card');
    this.pillEl = this.overlayEl.querySelector('#greeting-pill');
    this.pillTextEl = this.overlayEl.querySelector('#greeting-pill-text');
    this.toggleBtnEl = this.overlayEl.querySelector('#card-toggle-btn');
    this.recipientEl = this.overlayEl.querySelector('#greeting-recipient');
    this.messageEl = this.overlayEl.querySelector('#greeting-message');
    this.senderEl = this.overlayEl.querySelector('#greeting-sender');
    this.whatsappBtnEl = this.overlayEl.querySelector('#whatsapp-reply-btn');
    this.creatorBadgeEl = this.overlayEl.querySelector('#creator-badge');

    // Wire minimize/maximize toggles
    this.toggleBtnEl?.addEventListener('click', () => {
      this.minimizeCard();
    });

    this.pillEl?.addEventListener('click', () => {
      this.expandCard();
    });
  }

  /**
   * Minimizes the greeting card to a compact bottom pill, freeing the 3D Diya view.
   */
  public minimizeCard(): void {
    if (this.cardEl && this.pillEl) {
      this.cardEl.classList.add('hidden');
      this.pillEl.classList.remove('hidden');
      this.pillEl.classList.add('flex');
    }
  }

  /**
   * Expands the greeting card from the minimized pill.
   */
  public expandCard(): void {
    if (this.cardEl && this.pillEl) {
      this.pillEl.classList.add('hidden');
      this.pillEl.classList.remove('flex');
      this.cardEl.classList.remove('hidden');
    }
  }

  /**
   * Injects greeting text safely via textContent and animates the card into view.
   *
   * @param payload Decrypted greeting payload or null
   */
  public show(payload: GreetingPayload | null): void {
    const recipient = payload?.recipient?.trim() || 'Dear Friend';
    const message =
      payload?.message?.trim() ||
      'Wishing you and your loved ones a joyous, prosperous, and luminous Diwali! May this festival of lights illuminate your path with happiness and success.';
    const sender = payload?.sender?.trim() || 'A Well-Wisher';

    // Strict textContent assignment guarantees mathematical immunity to XSS (ASVS V5)
    if (this.recipientEl) this.recipientEl.textContent = `To: ${recipient}`;
    if (this.messageEl) this.messageEl.textContent = `“${message}”`;
    if (this.senderEl) this.senderEl.textContent = `— With love, ${sender}`;
    if (this.pillTextEl) this.pillTextEl.textContent = `View Wish from ${sender}`;

    if (this.pillEl) {
      this.pillEl.classList.add('hidden');
      this.pillEl.classList.remove('flex');
    }
    if (this.cardEl) {
      this.cardEl.classList.remove('hidden');
    }

    if (this.whatsappBtnEl) {
      this.whatsappBtnEl.href = createWhatsAppReplyUrl(sender);
      this.whatsappBtnEl.classList.remove('pointer-events-none');
      this.whatsappBtnEl.classList.add('pointer-events-auto');
    }

    if (this.creatorBadgeEl) {
      this.creatorBadgeEl.classList.remove('pointer-events-none');
      this.creatorBadgeEl.classList.add('pointer-events-auto');
    }

    if (this.overlayEl) {
      this.overlayEl.classList.remove('hidden', 'pointer-events-none');
      this.overlayEl.classList.add('flex', 'pointer-events-auto');
    }

    if (this.cardEl) {
      requestAnimationFrame(() => {
        this.cardEl?.classList.remove('opacity-0', 'scale-95', 'translate-y-4', 'pointer-events-none');
        this.cardEl?.classList.add('opacity-100', 'scale-100', 'translate-y-0', 'pointer-events-auto');
      });
    }
  }

  /**
   * Reverses the entrance animation to hide the card.
   */
  public hide(): void {
    if (this.pillEl) {
      this.pillEl.classList.add('hidden');
      this.pillEl.classList.remove('flex');
    }
    if (this.cardEl) {
      this.cardEl.classList.remove('hidden');
      this.cardEl.classList.remove('opacity-100', 'scale-100', 'translate-y-0', 'pointer-events-auto');
      this.cardEl.classList.add('opacity-0', 'scale-95', 'translate-y-4', 'pointer-events-none');
    }
    if (this.whatsappBtnEl) {
      this.whatsappBtnEl.classList.remove('pointer-events-auto');
      this.whatsappBtnEl.classList.add('pointer-events-none');
    }
    if (this.creatorBadgeEl) {
      this.creatorBadgeEl.classList.remove('pointer-events-auto');
      this.creatorBadgeEl.classList.add('pointer-events-none');
    }
    if (this.overlayEl) {
      this.overlayEl.classList.remove('flex', 'pointer-events-auto');
      this.overlayEl.classList.add('hidden', 'pointer-events-none');
    }
  }

  /**
   * Returns overlay root element or null if not mounted.
   */
  public getOverlayElement(): HTMLElement | null {
    return this.overlayEl;
  }

  /**
   * Returns card element or null if not mounted.
   */
  public getCardElement(): HTMLElement | null {
    return this.cardEl;
  }

  /**
   * Returns minimized pill element or null if not mounted.
   */
  public getPillElement(): HTMLElement | null {
    return this.pillEl;
  }

  /**
   * Returns creator badge link element or null if not mounted.
   */
  public getCreatorBadgeElement(): HTMLAnchorElement | null {
    return this.creatorBadgeEl;
  }

  /**
   * Returns WhatsApp reply button element or null if not mounted.
   */
  public getWhatsAppButtonElement(): HTMLAnchorElement | null {
    return this.whatsappBtnEl;
  }

  /**
   * Returns recipient paragraph element or null if not mounted.
   */
  public getRecipientElement(): HTMLElement | null {
    return this.recipientEl;
  }

  /**
   * Returns message paragraph element or null if not mounted.
   */
  public getMessageElement(): HTMLElement | null {
    return this.messageEl;
  }

  /**
   * Returns sender paragraph element or null if not mounted.
   */
  public getSenderElement(): HTMLElement | null {
    return this.senderEl;
  }

  /**
   * Cleans up DOM elements and nullifies references per ASVS V14.
   */
  public dispose(): void {
    this.overlayEl?.remove();
    this.overlayEl = null;
    this.cardEl = null;
    this.pillEl = null;
    this.pillTextEl = null;
    this.toggleBtnEl = null;
    this.recipientEl = null;
    this.messageEl = null;
    this.senderEl = null;
    this.whatsappBtnEl = null;
    this.creatorBadgeEl = null;
  }
}
