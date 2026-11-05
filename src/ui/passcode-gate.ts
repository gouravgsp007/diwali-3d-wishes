import { GreetingCodec } from '../crypto/greeting-codec';
import { getDemoGreeting } from '../crypto/demo-greeting';
import { AudioEngine } from '../audio/audio-engine';
import type { AppStateMachine } from '../app/state-machine';
import type { ResolvedToken } from './url-resolver';

/**
 * Controller for the festive glassmorphic Passcode Gate UI.
 *
 * Manages uppercase normalization, synchronous audio context priming during
 * user gesture, cryptographic or demo passcode verification, and festive
 * shake feedback upon authentication rejection (D-01, D-02, D-08, D-11, PASS-01, PASS-03).
 */
export class PasscodeGate {
  private formEl: HTMLFormElement | null = null;
  private inputEl: HTMLInputElement | null = null;
  private cardEl: HTMLElement | null = null;
  private errorEl: HTMLElement | null = null;
  private createWishBtn: HTMLElement | null = null;

  constructor(
    private stateMachine: AppStateMachine,
    private tokenInfo: ResolvedToken
  ) {}

  public mount(): void {
    this.formEl = document.getElementById('passcode-form') as HTMLFormElement | null;
    this.inputEl = document.getElementById('passcode-input') as HTMLInputElement | null;
    this.cardEl = document.getElementById('passcode-card');
    this.errorEl = document.getElementById('error-feedback');
    this.createWishBtn = document.getElementById('create-wish-btn');

    if (!this.formEl || !this.inputEl) return;

    // Real-time uppercase normalization and error clearing
    this.inputEl.addEventListener('input', () => {
      if (this.inputEl) {
        this.inputEl.value = this.inputEl.value.toUpperCase();
      }
      this.hideError();
    });

    // Secondary action: "Order Your Own Wish" routes to #order hash
    if (this.createWishBtn) {
      this.createWishBtn.addEventListener('click', () => {
        if (typeof window !== 'undefined') {
          window.location.hash = '#order';
        }
        this.showCreateWishNotice();
      });
    }

    // Submit handler
    this.formEl.addEventListener('submit', async (e: Event) => {
      e.preventDefault();
      await this.handleUnlock();
    });
  }

  private async handleUnlock(): Promise<void> {
    const passcode = this.inputEl?.value.trim().toUpperCase() || '';
    if (passcode.length < 4 || passcode.length > 6) {
      return;
    }

    // 1. Synchronously prime Web Audio API and HTML5 audio during the user gesture callback (D-04, D-11)
    // Must be invoked prior to any await microtask tick to satisfy mobile WebKit policies
    AudioEngine.getInstance().unlock();

    try {
      let payload;

      if (this.tokenInfo.isDemo || !this.tokenInfo.token) {
        // Built-in demo fallback (D-07)
        const demo = getDemoGreeting(passcode);
        if (!demo) {
          throw new Error('Invalid demo passcode');
        }
        payload = demo;
      } else {
        // Cryptographic decryption via AES-GCM 256-bit PBKDF2 (D-04)
        payload = await GreetingCodec.decrypt(this.tokenInfo.token, passcode);
      }

      // Success: advance FSM to UNLOCKED_INTRO
      this.stateMachine.transition({
        type: 'UNLOCK_SUCCESS',
        payload,
      });

      this.hideModal();
    } catch {
      // Rejection feedback: trigger shake animation and safe error message (D-08, T-01-04)
      this.triggerRejection();
    }
  }

  private triggerRejection(): void {
    if (this.cardEl) {
      this.cardEl.classList.remove('animate-shake');
      void this.cardEl.offsetWidth; // Force CSS reflow to restart animation
      this.cardEl.classList.add('animate-shake');
    }

    if (this.errorEl) {
      // Render text strictly via textContent to prevent stored XSS (T-01-04)
      this.errorEl.textContent = "Passcode doesn't match this greeting. Please check your message!";
      this.errorEl.classList.remove('hidden');
    }

    if (this.inputEl) {
      this.inputEl.select();
    }
  }

  private hideError(): void {
    if (this.errorEl) {
      this.errorEl.classList.add('hidden');
    }
  }

  private hideModal(): void {
    if (this.cardEl) {
      this.cardEl.style.pointerEvents = 'none';
      this.cardEl.classList.remove('pointer-events-auto');
      this.cardEl.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
      if (this.inputEl) {
        this.inputEl.style.pointerEvents = 'none';
        this.inputEl.classList.remove('pointer-events-auto');
        this.inputEl.classList.add('pointer-events-none');
      }
      setTimeout(() => {
        this.cardEl?.classList.add('hidden');
      }, 300);
    }
  }

  private showCreateWishNotice(): void {
    let toast = document.getElementById('create-wish-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'create-wish-toast';
      toast.className =
        'fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-amber-950/90 border border-amber-400/40 text-amber-200 text-xs font-medium shadow-2xl backdrop-blur-md transition-all duration-300 z-50 text-center max-w-xs';
      document.body.appendChild(toast);
    }
    // Strictly textContent to avoid XSS
    toast.textContent =
      '✨ Create Your Own Wish will be available soon! You will be able to share personalized 3D greetings.';
    toast.classList.remove('opacity-0', 'pointer-events-none');

    setTimeout(() => {
      toast?.classList.add('opacity-0', 'pointer-events-none');
    }, 3500);
  }
}
