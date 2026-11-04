import { GreetingCodec } from '../crypto/greeting-codec';
import type { GreetingPayload } from '../crypto/types';
import { copyToClipboard } from '../utils/clipboard';
import { formatDeliveryMessage, createDeliveryWhatsAppUrl } from './delivery-message';

export interface CreatorPortalOptions {
  container: HTMLElement;
  onWishCreated?: (url: string, passcode: string) => void;
  onClose?: () => void;
}

/**
 * CreatorPortal UI Controller
 *
 * Provides a dedicated, mobile-optimized glassmorphic creator generator modal
 * allowing sellers and gifters to customize wishes, encrypt them client-side
 * via GreetingCodec ($0 backend cost), and 1-click copy formatted WhatsApp /
 * Instagram DM delivery messages with clear recipient unlock instructions.
 */
export class CreatorPortal {
  private overlayEl: HTMLElement | null = null;
  private formEl: HTMLFormElement | null = null;
  private recipientInput: HTMLInputElement | null = null;
  private senderInput: HTMLInputElement | null = null;
  private messageInput: HTMLTextAreaElement | null = null;
  private passcodeInput: HTMLInputElement | null = null;
  private charCountEl: HTMLElement | null = null;
  private errorMsgEl: HTMLElement | null = null;
  private generateBtn: HTMLButtonElement | null = null;

  private resultSection: HTMLElement | null = null;
  private shareUrlInput: HTMLInputElement | null = null;
  private copyLinkBtn: HTMLButtonElement | null = null;
  private copyMessageBtn: HTMLButtonElement | null = null;
  private messagePreviewEl: HTMLTextAreaElement | null = null;
  private shareWhatsAppBtn: HTMLAnchorElement | null = null;
  private testLinkBtn: HTMLAnchorElement | null = null;
  private resetBtn: HTMLButtonElement | null = null;
  private closeBtn: HTMLButtonElement | null = null;
  private feedbackBadge: HTMLElement | null = null;

  private readonly onHashChangeBound: () => void;
  private isVisible = false;
  private feedbackTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: CreatorPortalOptions) {
    this.onHashChangeBound = this.handleHashChange.bind(this);
    window.addEventListener('hashchange', this.onHashChangeBound);
  }

  /**
   * Mounts the modal overlay and DOM skeleton into the container.
   */
  public mount(): void {
    if (this.overlayEl) return;

    this.overlayEl = document.createElement('div');
    this.overlayEl.id = 'creator-portal-overlay';
    this.overlayEl.className =
      'fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto transition-opacity duration-300 opacity-0 pointer-events-none select-none';

    this.overlayEl.innerHTML = `
      <div
        id="creator-card"
        class="relative w-full max-w-lg my-auto rounded-3xl p-6 sm:p-8 bg-neutral-950/90 border border-amber-500/40 shadow-2xl shadow-amber-950/50 text-amber-100 flex flex-col gap-5 pointer-events-auto transform transition-all duration-300 scale-95"
      >
        <!-- Close Button -->
        <button
          id="creator-close-btn"
          type="button"
          aria-label="Close Creator Portal"
          class="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-amber-400/80 hover:text-amber-200 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <!-- Header -->
        <div class="text-center">
          <div class="text-2xl mb-1">🪔</div>
          <h2 class="text-2xl sm:text-3xl font-serif font-bold tracking-wide bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            Diwali Wish Generator
          </h2>
          <p class="text-xs sm:text-sm text-amber-200/70 mt-1">
            Create an intimate, encrypted 3D Diya wish for your loved ones in seconds.
          </p>
        </div>

        <!-- Input Form Section -->
        <form id="creator-form" class="flex flex-col gap-4">
          <!-- Recipient Name -->
          <div>
            <label for="creator-recipient" class="block text-xs uppercase tracking-wider font-semibold text-amber-400 mb-1">
              Recipient Name *
            </label>
            <input
              id="creator-recipient"
              type="text"
              maxlength="50"
              placeholder="e.g. Priya"
              required
              class="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-amber-500/30 text-amber-100 placeholder-amber-400/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition-all"
            />
          </div>

          <!-- Sender Name -->
          <div>
            <label for="creator-sender" class="block text-xs uppercase tracking-wider font-semibold text-amber-400 mb-1">
              Your Name / Sender *
            </label>
            <input
              id="creator-sender"
              type="text"
              maxlength="50"
              placeholder="e.g. Rahul & Family"
              required
              class="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-amber-500/30 text-amber-100 placeholder-amber-400/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition-all"
            />
          </div>

          <!-- Custom Wish Message -->
          <div>
            <div class="flex justify-between items-center mb-1">
              <label for="creator-message" class="text-xs uppercase tracking-wider font-semibold text-amber-400">
                Festive Wish Message *
              </label>
              <span id="creator-char-count" class="text-[11px] text-amber-400/60 font-mono">
                300 left
              </span>
            </div>
            <textarea
              id="creator-message"
              rows="3"
              maxlength="300"
              placeholder="Wishing you a luminous Diwali..."
              required
              class="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-amber-500/30 text-amber-100 placeholder-amber-400/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition-all resize-none"
            >Wishing you and your loved ones a joyous, prosperous, and luminous Diwali! May this festival of lights illuminate your path with boundless happiness and success. 🪔✨</textarea>
          </div>

          <!-- Passcode -->
          <div>
            <label for="creator-passcode" class="block text-xs uppercase tracking-wider font-semibold text-amber-400 mb-1">
              Secret Passcode (4-6 chars) *
            </label>
            <input
              id="creator-passcode"
              type="text"
              minlength="4"
              maxlength="6"
              placeholder="e.g. 2026 or SHUBH"
              required
              autocomplete="off"
              class="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-amber-500/30 text-amber-100 placeholder-amber-400/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm uppercase tracking-widest font-mono transition-all"
            />
            <p class="text-[11px] text-amber-400/60 mt-1">
              The recipient will enter this passcode to unlock their 3D greeting.
            </p>
          </div>

          <!-- Validation Error Alert -->
          <div id="creator-error-msg" class="hidden text-xs text-rose-400 bg-rose-950/40 border border-rose-500/30 rounded-lg p-2.5">
          </div>

          <!-- Submit Button -->
          <button
            id="creator-generate-btn"
            type="submit"
            class="w-full mt-2 py-3.5 px-6 rounded-xl font-semibold text-xs sm:text-sm tracking-wider uppercase bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-amber-950 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Generate Magical Wish</span>
            <span>✨</span>
          </button>
        </form>

        <!-- Result Section (Revealed upon generation) -->
        <div id="creator-result-section" class="hidden flex-col gap-4">
          <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
            <span class="text-sm font-semibold text-amber-300">🎉 Wish Created & Encrypted!</span>
            <p class="text-xs text-amber-200/80 mt-0.5">
              Copy the delivery template or send directly via WhatsApp.
            </p>
          </div>

          <!-- Shareable Link Box -->
          <div>
            <label class="block text-xs uppercase tracking-wider font-semibold text-amber-400 mb-1">
              Encrypted Shareable Link
            </label>
            <div class="flex gap-2">
              <input
                id="creator-share-url"
                type="text"
                readonly
                class="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/30 text-amber-200 text-xs font-mono select-all focus:outline-none"
              />
              <button
                id="creator-copy-link-btn"
                type="button"
                class="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-semibold whitespace-nowrap active:scale-95 transition-all cursor-pointer"
              >
                Copy Link
              </button>
            </div>
          </div>

          <!-- Formatted Delivery Message Preview -->
          <div>
            <label class="block text-xs uppercase tracking-wider font-semibold text-amber-400 mb-1">
              Delivery Copy (WhatsApp / Instagram DM)
            </label>
            <textarea
              id="creator-message-preview"
              rows="5"
              readonly
              class="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-amber-500/30 text-amber-100 text-xs font-mono leading-relaxed select-all focus:outline-none resize-none"
            ></textarea>
          </div>

          <!-- Copy and Share Actions -->
          <div class="flex flex-col gap-2">
            <button
              id="creator-copy-message-btn"
              type="button"
              class="w-full py-3 px-4 rounded-xl font-semibold text-xs tracking-wider uppercase bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-amber-950 shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Copy Full Message</span>
              <span>📋</span>
            </button>

            <a
              id="creator-whatsapp-share-btn"
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full py-3 px-4 rounded-xl font-semibold text-xs tracking-wider uppercase bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer no-underline text-center"
            >
              <span>Send via WhatsApp</span>
              <span>💬</span>
            </a>

            <div class="flex gap-2 mt-1">
              <a
                id="creator-test-link-btn"
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 text-xs font-medium text-center no-underline transition-colors"
              >
                Test Wish ↗
              </a>
              <button
                id="creator-reset-btn"
                type="button"
                class="flex-1 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 text-xs font-medium text-center transition-colors cursor-pointer"
              >
                Create Another ➕
              </button>
            </div>
          </div>
        </div>

        <!-- Temporary Feedback Toast -->
        <div
          id="creator-feedback-badge"
          class="hidden absolute bottom-4 left-1/2 -translate-x-1/2 py-2 px-4 rounded-full bg-emerald-950/90 border border-emerald-400 text-emerald-200 text-xs font-medium shadow-xl backdrop-blur-md pointer-events-none"
        >
          Copied to Clipboard! ✅
        </div>
      </div>
    `;

    this.options.container.appendChild(this.overlayEl);
    this.initElements();
    this.initListeners();

    // Check initial hash
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#create')) {
      this.show();
    }
  }

  private initElements(): void {
    if (!this.overlayEl) return;
    this.formEl = this.overlayEl.querySelector('#creator-form');
    this.recipientInput = this.overlayEl.querySelector('#creator-recipient');
    this.senderInput = this.overlayEl.querySelector('#creator-sender');
    this.messageInput = this.overlayEl.querySelector('#creator-message');
    this.passcodeInput = this.overlayEl.querySelector('#creator-passcode');
    this.charCountEl = this.overlayEl.querySelector('#creator-char-count');
    this.errorMsgEl = this.overlayEl.querySelector('#creator-error-msg');
    this.generateBtn = this.overlayEl.querySelector('#creator-generate-btn');

    this.resultSection = this.overlayEl.querySelector('#creator-result-section');
    this.shareUrlInput = this.overlayEl.querySelector('#creator-share-url');
    this.copyLinkBtn = this.overlayEl.querySelector('#creator-copy-link-btn');
    this.copyMessageBtn = this.overlayEl.querySelector('#creator-copy-message-btn');
    this.messagePreviewEl = this.overlayEl.querySelector('#creator-message-preview');
    this.shareWhatsAppBtn = this.overlayEl.querySelector('#creator-whatsapp-share-btn');
    this.testLinkBtn = this.overlayEl.querySelector('#creator-test-link-btn');
    this.resetBtn = this.overlayEl.querySelector('#creator-reset-btn');
    this.closeBtn = this.overlayEl.querySelector('#creator-close-btn');
    this.feedbackBadge = this.overlayEl.querySelector('#creator-feedback-badge');

    // Initialize character count
    this.updateCharCount();
  }

  private initListeners(): void {
    if (!this.overlayEl) return;

    // Character counter listener
    this.messageInput?.addEventListener('input', () => this.updateCharCount());

    // Passcode uppercase transformation
    this.passcodeInput?.addEventListener('input', () => {
      if (this.passcodeInput) {
        this.passcodeInput.value = this.passcodeInput.value.toUpperCase();
      }
    });

    // Form submission
    this.formEl?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.generate();
    });

    // Copy actions
    this.copyLinkBtn?.addEventListener('click', async () => {
      if (this.shareUrlInput?.value) {
        const success = await copyToClipboard(this.shareUrlInput.value);
        if (success) this.showFeedback('Link copied to clipboard! 🔗');
      }
    });

    this.copyMessageBtn?.addEventListener('click', async () => {
      if (this.messagePreviewEl?.value) {
        const success = await copyToClipboard(this.messagePreviewEl.value);
        if (success) this.showFeedback('Delivery message copied! 📋');
      }
    });

    // Reset button
    this.resetBtn?.addEventListener('click', () => {
      this.resetForm();
    });

    // Close button & backdrop dismiss
    this.closeBtn?.addEventListener('click', () => this.hide());
    this.overlayEl.addEventListener('click', (e) => {
      if (e.target === this.overlayEl) {
        this.hide();
      }
    });
  }

  private updateCharCount(): void {
    if (!this.messageInput || !this.charCountEl) return;
    const remaining = 300 - this.messageInput.value.length;
    this.charCountEl.textContent = `${remaining} left`;
    if (remaining < 0) {
      this.charCountEl.classList.add('text-rose-400');
    } else {
      this.charCountEl.classList.remove('text-rose-400');
    }
  }

  /**
   * Validates inputs, encrypts greeting payload via GreetingCodec,
   * updates the result section, and returns the generated shareable URL.
   */
  public async generate(): Promise<string> {
    this.clearError();

    const recipient = this.recipientInput?.value.trim() || '';
    const sender = this.senderInput?.value.trim() || '';
    const message = this.messageInput?.value.trim() || '';
    const passcode = this.passcodeInput?.value.trim().toUpperCase() || '';

    // Validation checks
    if (!recipient) {
      this.showError('Please enter recipient name.');
      return '';
    }
    if (!sender) {
      this.showError('Please enter your name as the sender.');
      return '';
    }
    if (!message) {
      this.showError('Please enter a festive wish message.');
      return '';
    }
    if (passcode.length < 4 || passcode.length > 6) {
      this.showError('Passcode must be between 4 and 6 characters.');
      return '';
    }

    try {
      if (this.generateBtn) {
        this.generateBtn.disabled = true;
        this.generateBtn.textContent = 'Encrypting Wish... ✨';
      }

      const payload: GreetingPayload = {
        recipient,
        sender,
        message,
        createdAt: Date.now(),
      };

      const ciphertext = await GreetingCodec.encrypt(payload, passcode);
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://diwali.app';
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
      const shareUrl = `${origin}${pathname}#d=${ciphertext}`;

      const deliveryCopy = formatDeliveryMessage({
        recipient,
        sender,
        passcode,
        url: shareUrl,
      });

      const whatsappUrl = createDeliveryWhatsAppUrl({
        recipient,
        sender,
        passcode,
        url: shareUrl,
      });

      // Update Result Elements
      if (this.shareUrlInput) this.shareUrlInput.value = shareUrl;
      if (this.messagePreviewEl) this.messagePreviewEl.value = deliveryCopy;
      if (this.shareWhatsAppBtn) this.shareWhatsAppBtn.href = whatsappUrl;
      if (this.testLinkBtn) this.testLinkBtn.href = shareUrl;

      // Show result section, hide form
      this.formEl?.classList.add('hidden');
      this.resultSection?.classList.remove('hidden');
      this.resultSection?.classList.add('flex');

      this.options.onWishCreated?.(shareUrl, passcode);
      return shareUrl;
    } catch {
      this.showError('Failed to encrypt wish. Please check inputs and try again.');
      return '';
    } finally {
      if (this.generateBtn) {
        this.generateBtn.disabled = false;
        this.generateBtn.innerHTML = `<span>Generate Magical Wish</span><span>✨</span>`;
      }
    }
  }

  private showError(msg: string): void {
    if (this.errorMsgEl) {
      this.errorMsgEl.textContent = msg;
      this.errorMsgEl.classList.remove('hidden');
    }
  }

  private clearError(): void {
    if (this.errorMsgEl) {
      this.errorMsgEl.textContent = '';
      this.errorMsgEl.classList.add('hidden');
    }
  }

  private showFeedback(msg: string): void {
    if (!this.feedbackBadge) return;
    if (this.feedbackTimeoutId) clearTimeout(this.feedbackTimeoutId);

    this.feedbackBadge.textContent = msg;
    this.feedbackBadge.classList.remove('hidden');

    this.feedbackTimeoutId = setTimeout(() => {
      this.feedbackBadge?.classList.add('hidden');
      this.feedbackTimeoutId = null;
    }, 2500);
  }

  private resetForm(): void {
    this.clearError();
    if (this.recipientInput) this.recipientInput.value = '';
    if (this.passcodeInput) this.passcodeInput.value = '';
    this.updateCharCount();

    this.resultSection?.classList.add('hidden');
    this.resultSection?.classList.remove('flex');
    this.formEl?.classList.remove('hidden');
  }

  private handleHashChange(): void {
    if (typeof window === 'undefined') return;
    if (window.location.hash.startsWith('#create')) {
      this.show();
    } else if (this.isVisible) {
      this.hide(false);
    }
  }

  /**
   * Opens the creator portal modal.
   */
  public show(): void {
    this.isVisible = true;
    if (this.overlayEl) {
      this.overlayEl.classList.remove('opacity-0', 'pointer-events-none');
      this.overlayEl.classList.add('opacity-100', 'pointer-events-auto');
      const card = this.overlayEl.querySelector('#creator-card');
      card?.classList.remove('scale-95');
      card?.classList.add('scale-100');
    }
  }

  /**
   * Hides the creator portal modal and cleans up the URL hash if needed.
   */
  public hide(updateHash = true): void {
    this.isVisible = false;
    if (this.overlayEl) {
      this.overlayEl.classList.remove('opacity-100', 'pointer-events-auto');
      this.overlayEl.classList.add('opacity-0', 'pointer-events-none');
      const card = this.overlayEl.querySelector('#creator-card');
      card?.classList.remove('scale-100');
      card?.classList.add('scale-95');
    }

    if (updateHash && typeof window !== 'undefined' && window.location.hash.startsWith('#create')) {
      if (typeof history !== 'undefined' && typeof history.replaceState === 'function') {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      } else {
        window.location.hash = '';
      }
    }

    this.options.onClose?.();
  }

  public isOpen(): boolean {
    return this.isVisible;
  }

  // Getters for testing and inspection
  public getOverlayElement(): HTMLElement | null {
    return this.overlayEl;
  }

  public getFormElement(): HTMLFormElement | null {
    return this.formEl;
  }

  public getRecipientInput(): HTMLInputElement | null {
    return this.recipientInput;
  }

  public getSenderInput(): HTMLInputElement | null {
    return this.senderInput;
  }

  public getMessageInput(): HTMLTextAreaElement | null {
    return this.messageInput;
  }

  public getPasscodeInput(): HTMLInputElement | null {
    return this.passcodeInput;
  }

  public getShareUrlInput(): HTMLInputElement | null {
    return this.shareUrlInput;
  }

  public getMessagePreviewElement(): HTMLTextAreaElement | null {
    return this.messagePreviewEl;
  }

  public getCopyMessageButton(): HTMLButtonElement | null {
    return this.copyMessageBtn;
  }

  public getCopyLinkButton(): HTMLButtonElement | null {
    return this.copyLinkBtn;
  }

  public getShareWhatsAppButton(): HTMLAnchorElement | null {
    return this.shareWhatsAppBtn;
  }

  /**
   * Cleans up event listeners and deallocates DOM elements per ASVS V14.
   */
  public dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('hashchange', this.onHashChangeBound);
    }
    if (this.feedbackTimeoutId) {
      clearTimeout(this.feedbackTimeoutId);
      this.feedbackTimeoutId = null;
    }
    this.overlayEl?.remove();
    this.overlayEl = null;
    this.formEl = null;
    this.recipientInput = null;
    this.senderInput = null;
    this.messageInput = null;
    this.passcodeInput = null;
    this.charCountEl = null;
    this.errorMsgEl = null;
    this.generateBtn = null;
    this.resultSection = null;
    this.shareUrlInput = null;
    this.copyLinkBtn = null;
    this.copyMessageBtn = null;
    this.messagePreviewEl = null;
    this.shareWhatsAppBtn = null;
    this.testLinkBtn = null;
    this.resetBtn = null;
    this.closeBtn = null;
    this.feedbackBadge = null;
  }
}
