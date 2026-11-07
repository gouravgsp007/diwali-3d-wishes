import { GreetingCodec } from '../crypto/greeting-codec';
import type { GreetingPayload } from '../crypto/types';
import type { OccasionId } from '../themes/experience-theme.interface';
import { copyToClipboard } from '../utils/clipboard';
import { formatDeliveryMessage, createDeliveryWhatsAppUrl } from './delivery-message';
import { OrderHistoryStore } from '../storage/order-history-store';
import { getRestoredGreetingHash } from './url-resolver';

export interface CreatorPortalOptions {
  container: HTMLElement;
  sellerPin?: string;
  bypassPin?: boolean;
  enforcePin?: boolean;
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
  private selectedOccasion: OccasionId = 'diwali';
  private selectedMusicChoice = 'track1';
  private customAudioFile: File | null = null;
  private customAudioObjectUrl: string | null = null;
  private customAudioUrlInput: HTMLInputElement | null = null;
  private audioFileInput: HTMLInputElement | null = null;
  private fileNameEl: HTMLElement | null = null;
  private customAudioPanel: HTMLElement | null = null;
  private previewSoundBtn: HTMLButtonElement | null = null;
  private previewAudioEl: HTMLAudioElement | null = null;
  private isPreviewPlaying = false;
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
  private sellerPin: string;

  constructor(private readonly options: CreatorPortalOptions) {
    this.sellerPin = options.sellerPin || '2026';
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
      'fixed inset-0 z-30 hidden items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto transition-opacity duration-300 opacity-0 pointer-events-none select-none';

    this.overlayEl.innerHTML = `
      <div
        id="creator-card"
        class="relative w-full max-w-lg my-auto rounded-3xl p-6 sm:p-8 bg-neutral-950/90 border border-amber-500/40 shadow-2xl shadow-amber-950/50 text-amber-100 flex flex-col gap-5 pointer-events-none transform transition-all duration-300 scale-95"
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
          <div id="creator-header-emoji" class="text-2xl mb-1">🪔</div>
          <h2 id="creator-header-title" class="text-2xl sm:text-3xl font-serif font-bold tracking-wide bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            Diwali Wish Generator
          </h2>
          <p id="creator-header-desc" class="text-xs sm:text-sm text-amber-200/70 mt-1">
            Create an intimate, encrypted 3D Diya wish for your loved ones in seconds.
          </p>
        </div>

        <!-- Occasion Selector Tabs -->
        <div class="flex flex-wrap gap-2 justify-center items-center py-1">
          <button
            type="button"
            data-occasion="diwali"
            class="occasion-tab px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer bg-amber-500/25 text-amber-200 border-amber-400 shadow-sm shadow-amber-500/30"
          >
            🪔 Diwali
          </button>
          <button
            type="button"
            data-occasion="birthday"
            class="occasion-tab px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer bg-black/40 text-neutral-400 border-neutral-700 hover:border-pink-500/40 hover:text-pink-300"
          >
            🎂 Birthday
          </button>
          <button
            type="button"
            data-occasion="wedding"
            class="occasion-tab px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer bg-black/40 text-neutral-400 border-neutral-700 hover:border-rose-500/40 hover:text-rose-300"
          >
            💍 Wedding
          </button>
          <button
            type="button"
            data-occasion="newyear"
            class="occasion-tab px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer bg-black/40 text-neutral-400 border-neutral-700 hover:border-purple-500/40 hover:text-purple-300"
          >
            🥂 New Year
          </button>
        </div>

        <!-- Seller PIN Protection Gate -->
        <div id="creator-auth-gate" class="hidden flex-col items-center gap-4 py-4 text-center">
          <div class="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-xl text-amber-300">
            🔐
          </div>
          <div>
            <h3 class="text-lg font-serif font-bold text-amber-200">Seller Admin Access</h3>
            <p class="text-xs text-amber-300/70 mt-1 max-w-xs leading-relaxed">
              This generator is reserved for authorized sellers to generate custom client packages. Enter your Master PIN to unlock.
            </p>
          </div>
          <form id="seller-pin-form" class="w-full max-w-xs flex flex-col gap-2" onsubmit="return false;">
            <input
              id="seller-pin-input"
              type="password"
              placeholder="ENTER SELLER PIN"
              autocomplete="off"
              class="w-full text-center tracking-[0.2em] font-mono font-bold text-base py-2.5 px-4 rounded-xl bg-black/60 border border-amber-500/30 text-amber-200 focus:outline-none focus:border-amber-400 uppercase"
            />
            <button
              id="seller-pin-submit-btn"
              type="submit"
              class="w-full py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wider uppercase bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              Unlock Generator 🔓
            </button>
            <p id="seller-pin-error" class="hidden text-xs text-rose-400 font-medium"></p>
          </form>
          <div class="pt-2 text-[11px] text-amber-400/60">
            Want to order a custom wish? <a href="#order" class="underline text-amber-300">DM @thecodeverse09 on Instagram</a>
          </div>
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

          <!-- Festive Soundtrack & Audio Selection (Admin/Seller Exclusive) -->
          <div class="p-3.5 rounded-2xl bg-black/60 border border-amber-500/30 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <label class="block text-xs uppercase tracking-wider font-semibold text-amber-400">
                Festive Soundtrack 🎶 <span class="text-[10px] text-amber-400/60 font-normal">(Admin Only)</span>
              </label>
              <button
                id="creator-preview-sound-btn"
                type="button"
                class="px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-400/40 text-amber-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                title="Preview selected soundtrack"
              >
                <span id="creator-preview-icon">▶</span>
                <span id="creator-preview-text">Preview Sound</span>
              </button>
            </div>

            <!-- Radio Options for the 3 Tracks -->
            <div class="grid grid-cols-1 gap-2">
              <label class="creator-sound-card relative flex items-center p-2.5 rounded-xl border border-amber-400/50 bg-amber-500/20 cursor-pointer transition-all hover:bg-amber-500/25 text-left">
                <input
                  type="radio"
                  name="creator-music-choice"
                  value="track1"
                  checked
                  class="mr-2.5 accent-amber-400"
                />
                <div class="flex flex-col">
                  <span class="text-xs font-bold text-amber-100 flex items-center gap-1">
                    <span>🎵</span> 1. Happy Wali Feeling
                  </span>
                  <span class="text-[10px] text-amber-300/70">Aayi Hai Diwali Festive Beat</span>
                </div>
              </label>

              <label class="creator-sound-card relative flex items-center p-2.5 rounded-xl border border-amber-500/20 bg-black/40 cursor-pointer transition-all hover:bg-amber-500/10 text-left">
                <input
                  type="radio"
                  name="creator-music-choice"
                  value="track2"
                  class="mr-2.5 accent-amber-400"
                />
                <div class="flex flex-col">
                  <span class="text-xs font-bold text-amber-100 flex items-center gap-1">
                    <span>🪔</span> 2. Mere Tumhare Sabke Liye
                  </span>
                  <span class="text-[10px] text-amber-300/70">Happy Diwali Classic Song</span>
                </div>
              </label>

              <label class="creator-sound-card relative flex items-center p-2.5 rounded-xl border border-amber-500/20 bg-black/40 cursor-pointer transition-all hover:bg-amber-500/10 text-left">
                <input
                  type="radio"
                  name="creator-music-choice"
                  value="track3"
                  class="mr-2.5 accent-amber-400"
                />
                <div class="flex flex-col">
                  <span class="text-xs font-bold text-amber-100 flex items-center gap-1">
                    <span>🕉️</span> 3. Shree Lakshmi Aarti
                  </span>
                  <span class="text-[10px] text-amber-300/70">Devotional Aarti & Chants</span>
                </div>
              </label>

              <!-- Option 4: Custom MP3 Upload -->
              <label class="creator-sound-card relative flex items-center justify-between p-2.5 rounded-xl border border-amber-500/20 bg-black/40 cursor-pointer transition-all hover:bg-amber-500/10 text-left">
                <div class="flex items-center">
                  <input
                    type="radio"
                    name="creator-music-choice"
                    value="custom"
                    class="mr-2.5 accent-amber-400"
                  />
                  <div class="flex flex-col">
                    <span class="text-xs font-bold text-amber-100 flex items-center gap-1">
                      <span>📁</span> 4. Upload Custom MP3 / Audio
                    </span>
                    <span class="text-[10px] text-amber-300/70">Upload your client's custom song or paste audio URL</span>
                  </div>
                </div>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono">Custom</span>
              </label>
            </div>

            <!-- Custom Audio Upload Panel (revealed when Custom is selected) -->
            <div id="creator-custom-audio-panel" class="hidden flex-col gap-2 p-2.5 rounded-xl bg-neutral-900/80 border border-amber-500/30">
              <div class="flex items-center gap-2">
                <label
                  for="creator-audio-file-input"
                  class="flex-1 py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 text-center"
                >
                  <span>📤 Choose MP3 File</span>
                </label>
                <input
                  id="creator-audio-file-input"
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a"
                  class="hidden"
                />
                <span id="creator-audio-file-name" class="text-[11px] text-amber-300/70 truncate max-w-[150px] italic">No file chosen</span>
              </div>
              <input
                id="creator-audio-url-input"
                type="url"
                placeholder="Or paste direct MP3 stream URL (e.g. https://.../song.mp3)"
                class="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-amber-500/30 text-amber-100 placeholder-amber-400/30 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
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

        <!-- Admin Order History & Passcode Log Section (Visible to Seller) -->
        <div id="creator-history-section" class="mt-1 pt-3 border-t border-amber-500/20 flex flex-col gap-2">
          <div class="flex items-center justify-between flex-wrap gap-1.5">
            <button
              id="creator-history-toggle-btn"
              type="button"
              class="text-xs font-semibold text-amber-300 hover:text-amber-100 flex items-center gap-1.5 cursor-pointer py-1 select-none"
            >
              <span>📋</span>
              <span id="creator-history-toggle-label">Orders & Codes (<span id="creator-history-count">0</span>)</span>
              <span id="creator-history-toggle-arrow" class="text-[10px] transition-transform">▼</span>
            </button>
            <div class="flex items-center gap-1.5 flex-wrap">
              <button
                id="creator-cloud-toggle-btn"
                type="button"
                class="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-200 flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                title="Configure Google Sheets Cloud Backup Webhook"
              >
                <span>☁️ Cloud Backup</span>
              </button>
              <button
                id="creator-export-csv-btn"
                type="button"
                class="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-200 flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                title="Download spreadsheet of all client orders and secret passcodes (Excel compatible)"
              >
                <span>📥 Export Excel</span>
              </button>
            </div>
          </div>

          <!-- Cloud Backup Settings Drawer (Collapsible) -->
          <div id="creator-cloud-drawer" class="hidden flex-col gap-2.5 p-3 rounded-2xl bg-black/70 border border-sky-500/30 text-xs text-sky-100">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-sky-300 flex items-center gap-1">
                <span>☁️</span> Google Sheets Cloud Backup
              </span>
              <span id="creator-cloud-status" class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Local Only
              </span>
            </div>
            <p class="text-[11px] text-sky-200/70 leading-relaxed">
              Auto-saves every wish to your Google Sheet in real-time so your orders & passcodes are accessible on phone, laptop, or desktop without a paid database.
            </p>
            <div class="flex flex-col gap-1.5">
              <input
                id="creator-webhook-url-input"
                type="url"
                placeholder="https://script.google.com/macros/s/.../exec"
                class="w-full px-2.5 py-1.5 rounded-lg bg-black/80 border border-sky-500/30 text-sky-200 text-xs font-mono focus:outline-none focus:border-sky-400"
              />
              <div class="flex gap-1.5 flex-wrap">
                <button
                  id="creator-save-webhook-btn"
                  type="button"
                  class="flex-1 py-1.5 px-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors text-center"
                >
                  Save Webhook
                </button>
                <button
                  id="creator-copy-script-btn"
                  type="button"
                  class="py-1.5 px-2 bg-white/10 hover:bg-white/15 text-sky-200 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                  title="Copy ready-to-paste Google Apps Script code"
                >
                  📋 Copy Apps Script
                </button>
                <button
                  id="creator-sync-all-btn"
                  type="button"
                  class="py-1.5 px-2 bg-white/10 hover:bg-white/15 text-sky-200 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                  title="Push all saved local orders to Google Sheet"
                >
                  🔄 Sync All Orders
                </button>
              </div>
            </div>
            <!-- Backup JSON & Restore -->
            <div class="pt-2 border-t border-sky-500/20 flex items-center justify-between">
              <span class="text-[10px] text-neutral-400">Manual Device Transfer:</span>
              <div class="flex items-center gap-2">
                <button
                  id="creator-export-json-btn"
                  type="button"
                  class="text-[10px] text-sky-300 hover:text-sky-100 underline cursor-pointer"
                >
                  Download JSON
                </button>
                <label
                  for="creator-import-file-input"
                  class="text-[10px] text-sky-300 hover:text-sky-100 underline cursor-pointer"
                >
                  Restore JSON
                </label>
                <input
                  id="creator-import-file-input"
                  type="file"
                  accept=".json,application/json"
                  class="hidden"
                />
              </div>
            </div>
          </div>

          <div id="creator-history-drawer" class="hidden flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            <div id="creator-history-list" class="flex flex-col gap-2">
              <!-- Dynamically populated order records -->
            </div>
            <div class="flex justify-end pt-1">
              <button
                id="creator-clear-history-btn"
                type="button"
                class="text-[10px] text-rose-400/80 hover:text-rose-300 underline cursor-pointer"
              >
                Clear All Orders
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
    if (typeof window !== 'undefined' && (window.location.hash.startsWith('#create') || window.location.hash.startsWith('#admin'))) {
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
    this.customAudioUrlInput = this.overlayEl.querySelector('#creator-audio-url-input');
    this.audioFileInput = this.overlayEl.querySelector('#creator-audio-file-input');
    this.fileNameEl = this.overlayEl.querySelector('#creator-audio-file-name');
    this.customAudioPanel = this.overlayEl.querySelector('#creator-custom-audio-panel');
    this.previewSoundBtn = this.overlayEl.querySelector('#creator-preview-sound-btn');
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

    // Occasion tab selection listener
    const occasionTabs = this.overlayEl.querySelectorAll('.occasion-tab');
    occasionTabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const occ = (e.currentTarget as HTMLElement).getAttribute('data-occasion') as OccasionId;
        if (occ) {
          this.selectOccasion(occ);
        }
      });
    });

    // Character counter listener
    this.messageInput?.addEventListener('input', () => this.updateCharCount());

    // Passcode uppercase transformation
    this.passcodeInput?.addEventListener('input', () => {
      if (this.passcodeInput) {
        this.passcodeInput.value = this.passcodeInput.value.toUpperCase();
      }
    });

    // Radio button changes for soundtrack selection
    const radioInputs = this.overlayEl.querySelectorAll('input[name="creator-music-choice"]');
    radioInputs.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        const val = (e.target as HTMLInputElement).value;
        this.selectedMusicChoice = val;
        this.updateMusicCardsHighlight();
        if (val === 'custom') {
          this.customAudioPanel?.classList.remove('hidden');
          this.customAudioPanel?.classList.add('flex');
        } else {
          this.customAudioPanel?.classList.add('hidden');
          this.customAudioPanel?.classList.remove('flex');
        }
        if (this.isPreviewPlaying) {
          this.playSoundPreview();
        }
      });
    });

    // Custom audio file input
    this.audioFileInput?.addEventListener('change', (e) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (file) {
        this.customAudioFile = file;
        if (this.customAudioObjectUrl) {
          URL.revokeObjectURL(this.customAudioObjectUrl);
        }
        this.customAudioObjectUrl = URL.createObjectURL(file);
        if (this.fileNameEl) {
          this.fileNameEl.textContent = file.name;
        }
        if (this.isPreviewPlaying) {
          this.playSoundPreview();
        }
      }
    });

    // Audio preview button
    this.previewSoundBtn?.addEventListener('click', () => {
      if (this.isPreviewPlaying) {
        this.stopSoundPreview();
      } else {
        this.playSoundPreview();
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

    // Seller PIN authentication listener (Admin Passcode strictly 2026)
    const pinInput = this.overlayEl.querySelector('#seller-pin-input') as HTMLInputElement | null;
    const pinSubmitBtn = this.overlayEl.querySelector('#seller-pin-submit-btn') as HTMLButtonElement | null;
    const pinError = this.overlayEl.querySelector('#seller-pin-error') as HTMLElement | null;

    const handlePinCheck = () => {
      const entered = pinInput?.value.trim() || '';
      const expected = (this.sellerPin || '2026').trim();
      if (entered === expected || entered === '2026') {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('diwali_seller_unlocked', 'true');
        }
        this.updateAuthGateVisibility(true);
        this.renderOrderHistory();
        if (pinError) pinError.classList.add('hidden');
        if (pinInput) pinInput.value = '';
      } else {
        if (pinError) {
          pinError.textContent = 'Incorrect Admin PIN. Access denied.';
          pinError.classList.remove('hidden');
        }
      }
    };

    pinSubmitBtn?.addEventListener('click', handlePinCheck);
    pinInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handlePinCheck();
      }
    });

    // Order History & Passcodes Drawer listeners
    const historyToggleBtn = this.overlayEl.querySelector('#creator-history-toggle-btn');
    const historyDrawer = this.overlayEl.querySelector('#creator-history-drawer');
    const historyArrow = this.overlayEl.querySelector('#creator-history-toggle-arrow');
    const exportCsvBtn = this.overlayEl.querySelector('#creator-export-csv-btn');
    const clearHistoryBtn = this.overlayEl.querySelector('#creator-clear-history-btn');

    historyToggleBtn?.addEventListener('click', () => {
      const isHidden = historyDrawer?.classList.contains('hidden');
      if (isHidden) {
        historyDrawer?.classList.remove('hidden');
        historyDrawer?.classList.add('flex');
        if (historyArrow) historyArrow.textContent = '▲';
        this.renderOrderHistory();
      } else {
        historyDrawer?.classList.add('hidden');
        historyDrawer?.classList.remove('flex');
        if (historyArrow) historyArrow.textContent = '▼';
      }
    });

    exportCsvBtn?.addEventListener('click', () => {
      OrderHistoryStore.downloadCsv();
      this.showFeedback('Excel Spreadsheet Exported! 📥');
    });

    clearHistoryBtn?.addEventListener('click', () => {
      OrderHistoryStore.clearAll();
      this.renderOrderHistory();
      this.showFeedback('Order history cleared');
    });

    // Cloud Backup & Device Sync listeners
    const cloudToggleBtn = this.overlayEl.querySelector('#creator-cloud-toggle-btn');
    const cloudDrawer = this.overlayEl.querySelector('#creator-cloud-drawer');
    const webhookInput = this.overlayEl.querySelector('#creator-webhook-url-input') as HTMLInputElement | null;
    const saveWebhookBtn = this.overlayEl.querySelector('#creator-save-webhook-btn');
    const copyScriptBtn = this.overlayEl.querySelector('#creator-copy-script-btn');
    const syncAllBtn = this.overlayEl.querySelector('#creator-sync-all-btn');
    const exportJsonBtn = this.overlayEl.querySelector('#creator-export-json-btn');
    const importFileInput = this.overlayEl.querySelector('#creator-import-file-input') as HTMLInputElement | null;

    cloudToggleBtn?.addEventListener('click', () => {
      const isHidden = cloudDrawer?.classList.contains('hidden');
      if (isHidden) {
        cloudDrawer?.classList.remove('hidden');
        cloudDrawer?.classList.add('flex');
        this.updateCloudStatus();
      } else {
        cloudDrawer?.classList.add('hidden');
        cloudDrawer?.classList.remove('flex');
      }
    });

    saveWebhookBtn?.addEventListener('click', () => {
      const val = webhookInput?.value.trim() || '';
      OrderHistoryStore.setCloudWebhookUrl(val);
      this.updateCloudStatus();
      this.showFeedback(val ? 'Cloud Webhook Saved! ☁️' : 'Cloud Webhook Cleared');
    });

    copyScriptBtn?.addEventListener('click', async () => {
      const script = OrderHistoryStore.getGoogleAppsScriptTemplate();
      const success = await copyToClipboard(script);
      if (success) {
        this.showFeedback('Google Apps Script Copied! 📋');
      }
    });

    syncAllBtn?.addEventListener('click', async () => {
      const webhook = OrderHistoryStore.getCloudWebhookUrl();
      if (!webhook) {
        this.showFeedback('Please enter Webhook URL first! ⚠️');
        return;
      }
      this.showFeedback('Syncing to Google Sheets... ⏳');
      const res = await OrderHistoryStore.syncAllOrdersToCloud(webhook);
      if (res.success) {
        this.showFeedback(`Synced ${res.count} orders to Sheets! ☁️`);
      } else {
        this.showFeedback('Sync failed. Check Webhook URL.');
      }
    });

    exportJsonBtn?.addEventListener('click', () => {
      OrderHistoryStore.downloadJsonBackup();
      this.showFeedback('JSON Backup Exported! 💾');
    });

    importFileInput?.addEventListener('change', () => {
      const file = importFileInput.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        this.showFeedback('File too large (max 5MB) ❌');
        importFileInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || '');
        const res = OrderHistoryStore.importFromJson(text);
        this.renderOrderHistory();
        this.showFeedback(`Imported ${res.importedCount} new orders! ✅`);
        importFileInput.value = '';
      };
      reader.onerror = () => {
        this.showFeedback('Failed to read backup file ❌');
        importFileInput.value = '';
      };
      reader.readAsText(file);
    });
  }

  private updateCloudStatus(): void {
    const statusEl = this.overlayEl?.querySelector('#creator-cloud-status');
    const inputEl = this.overlayEl?.querySelector('#creator-webhook-url-input') as HTMLInputElement | null;
    const url = OrderHistoryStore.getCloudWebhookUrl();
    if (inputEl && !inputEl.value) {
      inputEl.value = url;
    }
    if (statusEl) {
      if (url) {
        statusEl.textContent = 'Active ☁️';
        statusEl.className = 'text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30';
      } else {
        statusEl.textContent = 'Local Only';
        statusEl.className = 'text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30';
      }
    }
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
      this.stopSoundPreview();

      if (this.generateBtn) {
        this.generateBtn.disabled = true;
        this.generateBtn.textContent = 'Encrypting Wish... ✨';
      }

      const musicTheme = this.selectedMusicChoice || 'track1';
      let customMusicUrl: string | undefined = undefined;
      if (this.selectedMusicChoice === 'custom') {
        const inputUrl = this.customAudioUrlInput?.value.trim();
        customMusicUrl = inputUrl || this.customAudioObjectUrl || undefined;
      }

      const payload: GreetingPayload = {
        recipient,
        sender,
        message,
        musicTheme,
        customMusicUrl,
        templateId: this.selectedOccasion,
        createdAt: Date.now(),
      };

      const ciphertext = await GreetingCodec.encrypt(payload, passcode);
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://diwali.app';
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
      const themeQuery = this.selectedOccasion !== 'diwali' ? `?theme=${this.selectedOccasion}` : '';
      const shareUrl = `${origin}${pathname}${themeQuery}#d=${ciphertext}`;

      const deliveryCopy = formatDeliveryMessage({
        recipient,
        sender,
        passcode,
        url: shareUrl,
        occasion: this.selectedOccasion,
      });

      const whatsappUrl = createDeliveryWhatsAppUrl({
        recipient,
        sender,
        passcode,
        url: shareUrl,
        occasion: this.selectedOccasion,
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

      // Persist in OrderHistoryStore for Admin tracking
      OrderHistoryStore.saveOrder({
        recipient,
        sender,
        occasion: this.selectedOccasion,
        passcode,
        shareUrl,
        musicChoice: this.selectedMusicChoice,
        createdAt: Date.now(),
      });
      this.renderOrderHistory();

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
    this.stopSoundPreview();
    if (this.recipientInput) this.recipientInput.value = '';
    if (this.passcodeInput) this.passcodeInput.value = '';
    this.selectedMusicChoice = 'track1';

    if (this.overlayEl) {
      const track1Radio = this.overlayEl.querySelector('input[value="track1"]') as HTMLInputElement | null;
      if (track1Radio) track1Radio.checked = true;
      this.updateMusicCardsHighlight();
    }
    this.customAudioPanel?.classList.add('hidden');
    this.customAudioPanel?.classList.remove('flex');
    if (this.customAudioUrlInput) this.customAudioUrlInput.value = '';
    if (this.audioFileInput) this.audioFileInput.value = '';
    if (this.fileNameEl) this.fileNameEl.textContent = 'No file chosen';
    if (this.customAudioObjectUrl) {
      URL.revokeObjectURL(this.customAudioObjectUrl);
      this.customAudioObjectUrl = null;
    }
    this.customAudioFile = null;

    this.updateCharCount();

    this.resultSection?.classList.add('hidden');
    this.resultSection?.classList.remove('flex');
    this.formEl?.classList.remove('hidden');
  }

  private updateMusicCardsHighlight(): void {
    if (!this.overlayEl) return;
    const cards = this.overlayEl.querySelectorAll('.creator-sound-card');
    cards.forEach((card) => {
      const radio = card.querySelector('input[type="radio"]') as HTMLInputElement | null;
      if (radio?.checked) {
        card.classList.add('border-amber-400/50', 'bg-amber-500/20');
        card.classList.remove('border-amber-500/20', 'bg-black/40');
      } else {
        card.classList.remove('border-amber-400/50', 'bg-amber-500/20');
        card.classList.add('border-amber-500/20', 'bg-black/40');
      }
    });
  }

  public playSoundPreview(): void {
    if (!this.previewAudioEl) {
      this.previewAudioEl = new Audio();
      this.previewAudioEl.addEventListener('ended', () => {
        this.stopSoundPreview();
      });
    }

    let src = '/audio/diwali-track-1.mp3';
    if (this.selectedMusicChoice === 'track2') {
      src = '/audio/diwali-track-2.mp3';
    } else if (this.selectedMusicChoice === 'track3') {
      src = '/audio/diwali-track-3.mp3';
    } else if (this.selectedMusicChoice === 'custom') {
      src = this.customAudioObjectUrl || this.customAudioUrlInput?.value.trim() || '/audio/diwali-track-1.mp3';
    }

    this.previewAudioEl.src = src;
    this.previewAudioEl.currentTime = 0;
    this.previewAudioEl.volume = 0.8;
    this.previewAudioEl.play().catch((err) => {
      console.warn('Sound preview playback failed:', err);
    });

    this.isPreviewPlaying = true;
    if (this.previewSoundBtn) {
      const icon = this.previewSoundBtn.querySelector('#creator-preview-icon');
      const text = this.previewSoundBtn.querySelector('#creator-preview-text');
      if (icon) icon.textContent = '⏸';
      if (text) text.textContent = 'Pause';
      this.previewSoundBtn.classList.add('bg-amber-400', 'text-stone-950', 'font-bold');
      this.previewSoundBtn.classList.remove('bg-amber-500/20', 'text-amber-300');
    }
  }

  public stopSoundPreview(): void {
    if (this.previewAudioEl) {
      this.previewAudioEl.pause();
    }
    this.isPreviewPlaying = false;
    if (this.previewSoundBtn) {
      const icon = this.previewSoundBtn.querySelector('#creator-preview-icon');
      const text = this.previewSoundBtn.querySelector('#creator-preview-text');
      if (icon) icon.textContent = '▶';
      if (text) text.textContent = 'Preview Sound';
      this.previewSoundBtn.classList.remove('bg-amber-400', 'text-stone-950', 'font-bold');
      this.previewSoundBtn.classList.add('bg-amber-500/20', 'text-amber-300');
    }
  }

  private isSellerUnlocked(): boolean {
    if (this.options.bypassPin) return true;
    if (this.options.enforcePin) {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('diwali_seller_unlocked') === 'true') {
        return true;
      }
      return false;
    }
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') return true;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('diwali_seller_unlocked') === 'true') {
      return true;
    }
    return false;
  }

  private updateAuthGateVisibility(unlocked: boolean): void {
    const gate = this.overlayEl?.querySelector('#creator-auth-gate');
    const historySection = this.overlayEl?.querySelector('#creator-history-section');
    if (unlocked) {
      gate?.classList.add('hidden');
      gate?.classList.remove('flex');
      historySection?.classList.remove('hidden');
      if (this.resultSection?.classList.contains('hidden')) {
        this.formEl?.classList.remove('hidden');
      }
      this.renderOrderHistory();
    } else {
      gate?.classList.remove('hidden');
      gate?.classList.add('flex');
      historySection?.classList.add('hidden');
      this.formEl?.classList.add('hidden');
    }
  }

  private handleHashChange(): void {
    if (typeof window === 'undefined') return;
    if (window.location.hash.startsWith('#create') || window.location.hash.startsWith('#admin')) {
      this.show();
    } else if (this.isVisible) {
      this.hide(false);
    }
  }

  public getSelectedOccasion(): OccasionId {
    return this.selectedOccasion;
  }

  public selectOccasion(occasion: OccasionId): void {
    this.selectedOccasion = occasion;
    this.updateOccasionTabsUI();
    this.updateOccasionPrefills();
  }

  private updateOccasionTabsUI(): void {
    if (!this.overlayEl) return;
    const tabs = this.overlayEl.querySelectorAll('.occasion-tab');
    tabs.forEach((tab) => {
      const occ = tab.getAttribute('data-occasion');
      if (occ === this.selectedOccasion) {
        tab.className =
          'occasion-tab px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer bg-amber-500/25 text-amber-200 border-amber-400 shadow-sm shadow-amber-500/30';
      } else {
        tab.className =
          'occasion-tab px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer bg-black/40 text-neutral-400 border-neutral-700 hover:border-amber-400/40 hover:text-amber-300';
      }
    });
  }

  private updateOccasionPrefills(): void {
    if (!this.overlayEl) return;
    const emojiEl = this.overlayEl.querySelector('#creator-header-emoji');
    const titleEl = this.overlayEl.querySelector('#creator-header-title');
    const descEl = this.overlayEl.querySelector('#creator-header-desc');

    if (this.selectedOccasion === 'birthday') {
      if (emojiEl) emojiEl.textContent = '🎂';
      if (titleEl) titleEl.textContent = 'Birthday Wish Generator';
      if (descEl) descEl.textContent = 'Create a magical 3D Cake & Candle blowout experience for someone special.';
      if (this.messageInput) {
        this.messageInput.value =
          'Happy Birthday! May your day be filled with endless laughter, sweet surprises, and all the love in the world. Blow out your candles and make a magical wish! 🎂🎉✨';
      }
      if (this.passcodeInput) this.passcodeInput.placeholder = 'e.g. BDAY or PRIYA';
    } else if (this.selectedOccasion === 'wedding') {
      if (emojiEl) emojiEl.textContent = '💍';
      if (titleEl) titleEl.textContent = 'Wedding & Engagement Generator';
      if (descEl) descEl.textContent = 'Create an auspicious royal 3D jewelry box reveal with rose petals.';
      if (this.messageInput) {
        this.messageInput.value =
          'Wishing you both a lifetime of eternal love, unwavering friendship, and boundless joy! May this sacred union bring endless prosperity and harmony to your lives. 💍🌹✨';
      }
      if (this.passcodeInput) this.passcodeInput.placeholder = 'e.g. LOVE or WED26';
    } else if (this.selectedOccasion === 'newyear') {
      if (emojiEl) emojiEl.textContent = '🥂';
      if (titleEl) titleEl.textContent = 'New Year 2026 Generator';
      if (descEl) descEl.textContent = 'Create a festive 3D midnight champagne celebration with fireworks.';
      if (this.messageInput) {
        this.messageInput.value =
          'Happy New Year 2026! May this coming year bring new adventures, grand milestones, peace, and abundance to you and your family. Cheers to 2026! 🥂🍾🎆';
      }
      if (this.passcodeInput) this.passcodeInput.placeholder = 'e.g. NY2026 or CHEERS';
    } else {
      if (emojiEl) emojiEl.textContent = '🪔';
      if (titleEl) titleEl.textContent = 'Diwali Wish Generator';
      if (descEl) descEl.textContent = 'Create an intimate, encrypted 3D Diya wish for your loved ones in seconds.';
      if (this.messageInput) {
        this.messageInput.value =
          'Wishing you and your loved ones a joyous, prosperous, and luminous Diwali! May this festival of lights illuminate your path with boundless happiness and success. 🪔✨';
      }
      if (this.passcodeInput) this.passcodeInput.placeholder = 'e.g. 2026 or SHUBH';
    }
    this.updateCharCount();
  }

  /**
   * Opens the creator portal modal.
   */
  public show(): void {
    this.isVisible = true;
    if (this.overlayEl) {
      this.updateAuthGateVisibility(this.isSellerUnlocked());
      this.overlayEl.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      this.overlayEl.classList.add('flex', 'opacity-100', 'pointer-events-auto');
      const card = this.overlayEl.querySelector('#creator-card');
      card?.classList.remove('scale-95', 'pointer-events-none');
      card?.classList.add('scale-100', 'pointer-events-auto');
    }
  }

  /**
   * Hides the creator portal modal and cleans up the URL hash if needed.
   */
  public hide(updateHash = true): void {
    this.stopSoundPreview();
    this.isVisible = false;
    if (this.overlayEl) {
      this.overlayEl.classList.remove('flex', 'opacity-100', 'pointer-events-auto');
      this.overlayEl.classList.add('hidden', 'opacity-0', 'pointer-events-none');
      const card = this.overlayEl.querySelector('#creator-card');
      card?.classList.remove('scale-100', 'pointer-events-auto');
      card?.classList.add('scale-95', 'pointer-events-none');
    }

    if (updateHash && typeof window !== 'undefined' && (window.location.hash.startsWith('#create') || window.location.hash.startsWith('#admin'))) {
      const restoredHash = getRestoredGreetingHash();
      if (typeof history !== 'undefined' && typeof history.replaceState === 'function') {
        history.replaceState(null, '', window.location.pathname + window.location.search + restoredHash);
      } else {
        window.location.hash = restoredHash;
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

  public getSelectedMusicChoice(): string {
    return this.selectedMusicChoice;
  }

  public setSelectedMusicChoice(choice: string): void {
    this.selectedMusicChoice = choice;
    if (this.overlayEl) {
      const radio = this.overlayEl.querySelector(`input[value="${choice}"]`) as HTMLInputElement | null;
      if (radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change'));
      }
    }
  }

  public getCustomAudioFileInput(): HTMLInputElement | null {
    return this.audioFileInput;
  }

  public getCustomAudioFile(): File | null {
    return this.customAudioFile;
  }

  public getCustomAudioUrlInput(): HTMLInputElement | null {
    return this.customAudioUrlInput;
  }

  public getPreviewButton(): HTMLButtonElement | null {
    return this.previewSoundBtn;
  }

  /**
   * Renders saved order history and secret passcodes from OrderHistoryStore.
   */
  public renderOrderHistory(): void {
    const historyList = this.overlayEl?.querySelector('#creator-history-list');
    const historyCount = this.overlayEl?.querySelector('#creator-history-count');
    if (!historyList) return;

    const orders = OrderHistoryStore.getOrders();
    if (historyCount) historyCount.textContent = String(orders.length);

    if (orders.length === 0) {
      historyList.innerHTML = `
        <div class="p-3 rounded-xl bg-black/40 border border-amber-500/15 text-center text-xs text-amber-300/60 italic">
          No generated orders saved yet. Create your first wish above!
        </div>
      `;
      return;
    }

    const occasionEmojis: Record<string, string> = {
      diwali: '🪔 Diwali',
      birthday: '🎂 Birthday',
      wedding: '💍 Wedding',
      newyear: '🥂 New Year',
    };

    const escapeHtml = (str: string): string =>
      str.replace(/[&<>"']/g, (m) => {
        switch (m) {
          case '&': return '&amp;';
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '"': return '&quot;';
          case "'": return '&#39;';
          default: return m;
        }
      });

    historyList.innerHTML = orders
      .map((o) => {
        const occLabel = escapeHtml(occasionEmojis[o.occasion] || o.occasion);
        const dateStr = new Date(o.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const recipientSafe = escapeHtml(o.recipient);
        const senderSafe = escapeHtml(o.sender);
        const passcodeSafe = escapeHtml(o.passcode);
        const urlSafe = escapeHtml(o.shareUrl);
        const idSafe = escapeHtml(o.id);

        return `
          <div class="p-3 rounded-xl bg-black/50 border border-amber-500/20 text-xs flex flex-col gap-2 hover:border-amber-400/40 transition-colors" data-order-id="${idSafe}">
            <div class="flex items-center justify-between">
              <span class="font-bold text-amber-200">To: ${recipientSafe} <span class="font-normal text-amber-300/70">(from ${senderSafe})</span></span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold border border-amber-400/20">${occLabel}</span>
            </div>
            <div class="flex items-center justify-between bg-black/40 px-2 py-1.5 rounded-lg border border-amber-500/10">
              <div class="flex items-center gap-2">
                <span class="text-[10px] uppercase text-amber-400/80 font-semibold tracking-wider">Passcode:</span>
                <span class="font-mono font-bold text-amber-300 tracking-wider text-xs">${passcodeSafe}</span>
              </div>
              <button
                type="button"
                class="copy-passcode-btn text-[10px] text-amber-300 hover:text-amber-100 underline cursor-pointer"
                data-passcode="${passcodeSafe}"
              >
                Copy Code 📋
              </button>
            </div>
            <div class="flex items-center justify-between pt-1 border-t border-amber-500/10 text-[10px] text-amber-400/60">
              <span>${dateStr}</span>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="copy-order-link-btn text-amber-300 hover:text-amber-100 underline cursor-pointer"
                  data-url="${urlSafe}"
                >
                  Copy Link 🔗
                </button>
                <button
                  type="button"
                  class="delete-order-btn text-rose-400/80 hover:text-rose-300 underline cursor-pointer"
                  data-order-id="${idSafe}"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    // Attach listeners to copy / delete buttons in the history list
    historyList.querySelectorAll('.copy-passcode-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const code = (e.currentTarget as HTMLElement).getAttribute('data-passcode') || '';
        if (code) {
          copyToClipboard(code);
          this.showFeedback('Passcode Copied: ' + code);
        }
      });
    });

    historyList.querySelectorAll('.copy-order-link-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const url = (e.currentTarget as HTMLElement).getAttribute('data-url') || '';
        if (url) {
          copyToClipboard(url);
          this.showFeedback('Delivery Link Copied! 🔗');
        }
      });
    });

    historyList.querySelectorAll('.delete-order-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-order-id') || '';
        if (id) {
          OrderHistoryStore.deleteOrder(id);
          this.renderOrderHistory();
          this.showFeedback('Order Deleted');
        }
      });
    });
  }

  /**
   * Cleans up event listeners and deallocates DOM elements per ASVS V14.
   */
  public dispose(): void {
    this.stopSoundPreview();
    if (this.customAudioObjectUrl) {
      URL.revokeObjectURL(this.customAudioObjectUrl);
      this.customAudioObjectUrl = null;
    }
    this.previewAudioEl = null;
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
    this.customAudioUrlInput = null;
    this.audioFileInput = null;
    this.fileNameEl = null;
    this.customAudioPanel = null;
    this.previewSoundBtn = null;
  }
}
