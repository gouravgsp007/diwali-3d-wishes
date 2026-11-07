import type { AudioEngine } from '../../audio/audio-engine';

export interface FirecrackerWindowOptions {
  container: HTMLElement;
  audioEngine: AudioEngine;
  onComplete: () => void;
  onSkip?: () => void;
  onRocketTriggered?: (id: number) => void;
}

export interface RocketItemDef {
  id: number;
  name: string;
  hindiName: string;
  desc: string;
  tag: string;
  icon: string;
  accentClass: string;
  badgeBg: string;
  buttonClass: string;
  colors: string[];
}

export const ROCKETS: RocketItemDef[] = [
  {
    id: 1,
    name: 'Swarna Baan',
    hindiName: 'स्वर्ण बाण',
    desc: 'Golden Willow',
    tag: '#1 Golden',
    icon: '🚀',
    accentClass: 'border-amber-500/40 bg-amber-950/40 hover:border-amber-400',
    badgeBg: 'bg-amber-500 text-stone-950',
    buttonClass: 'bg-amber-500/25 text-amber-200 border-amber-400/50 hover:bg-amber-500 hover:text-stone-950',
    colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#D97706', '#FEF08A'],
  },
  {
    id: 2,
    name: 'Taramandal',
    hindiName: 'तारामंडल',
    desc: 'Ruby & Emerald Starburst',
    tag: '#2 Starlight',
    icon: '🎇',
    accentClass: 'border-rose-500/40 bg-rose-950/40 hover:border-rose-400',
    badgeBg: 'bg-rose-500 text-stone-950',
    buttonClass: 'bg-rose-500/25 text-rose-200 border-rose-400/50 hover:bg-rose-500 hover:text-stone-950',
    colors: ['#EF4444', '#10B981', '#34D399', '#FCA5A5', '#FDE047'],
  },
  {
    id: 3,
    name: 'Dhamaaka',
    hindiName: 'धमाका',
    desc: 'Multi-Ring Flash',
    tag: '#3 Thunder',
    icon: '✨',
    accentClass: 'border-indigo-500/40 bg-indigo-950/40 hover:border-indigo-400',
    badgeBg: 'bg-indigo-500 text-stone-950',
    buttonClass: 'bg-indigo-500/25 text-indigo-200 border-indigo-400/50 hover:bg-indigo-500 hover:text-stone-950',
    colors: ['#38BDF8', '#818CF8', '#C084FC', '#FDE047', '#FFFFFF'],
  },
];

/**
 * Minimalist, Card-Less Firecracker Ceremony HUD.
 *
 * Replaces the heavy, opaque modal card with transparent floating festive pills.
 * The glowing 3D Diya and 3D in-scene rockets remain completely unobstructed.
 * Users can tap directly on the 3D rockets in the scene or use the floating
 * quick-launcher chips at the bottom.
 */
export class FirecrackerWindow {
  private overlayEl: HTMLElement | null = null;
  private launchedRockets = new Set<number>();
  private isDisposed = false;
  private hasTriggeredCompletion = false;
  private completeTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private dismissTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  constructor(private readonly options: FirecrackerWindowOptions) {}

  public mount(): void {
    if (this.overlayEl) return;

    this.overlayEl = document.createElement('div');
    this.overlayEl.id = 'firecracker-window-overlay';
    this.overlayEl.className =
      'fixed inset-0 z-40 flex flex-col justify-between p-3 sm:p-6 bg-transparent pointer-events-none select-none transition-opacity duration-500 opacity-0';

    this.overlayEl.innerHTML = `
      <!-- Top Floating Status Pill -->
      <div class="w-full flex items-center justify-between pointer-events-auto">
        <div class="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-stone-950/80 backdrop-blur-md border border-amber-500/30 text-xs shadow-lg">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span class="font-serif font-bold text-amber-200">Shubh Deepotsav</span>
          <span class="text-amber-500/50">•</span>
          <span class="font-mono text-yellow-300 font-bold">🚀 <span id="cracker-launched-count">0</span> / 3</span>
        </div>

        <button
          id="firecracker-skip-btn"
          type="button"
          class="text-xs px-3.5 py-1.5 rounded-full bg-stone-950/80 backdrop-blur-md hover:bg-stone-900 text-amber-200/80 hover:text-amber-100 border border-amber-500/30 transition-all cursor-pointer shadow-lg flex items-center gap-1.5"
          title="Skip firecrackers to view personal wish"
        >
          <span>Skip to Wish</span>
          <span>→</span>
        </button>
      </div>

      <!-- Floating Guidance Toast (Highlighted, High-Contrast Festive Glow) -->
      <div class="w-full flex justify-center pointer-events-none pb-6 sm:pb-10">
        <div
          id="firecracker-guidance-pill"
          class="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-950/90 via-stone-950/95 to-amber-950/90 backdrop-blur-xl border-2 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.55)] text-xs sm:text-sm text-amber-100 font-bold text-center tracking-wide animate-pulse pointer-events-auto select-none"
        >
          <span class="text-base sm:text-lg">✨</span>
          <span>Tap any 3D Rocket to Launch! 🚀</span>
        </div>
      </div>
    `;

    this.options.container.appendChild(this.overlayEl);

    // Fade-in animation
    requestAnimationFrame(() => {
      if (this.overlayEl) {
        this.overlayEl.classList.remove('opacity-0');
        this.overlayEl.classList.add('opacity-100');
      }
    });

    this.initEvents();
  }

  private initEvents(): void {
    if (!this.overlayEl) return;

    // Skip button
    const skipBtn = this.overlayEl.querySelector('#firecracker-skip-btn');
    skipBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleSkip();
    });

    // Desktop keyboard shortcuts (1, 2, 3) for accessibility
    this.keydownListener = (e: KeyboardEvent) => {
      if (this.isDisposed) return;
      if (e.key === '1') this.launchRocket(1);
      if (e.key === '2') this.launchRocket(2);
      if (e.key === '3') this.launchRocket(3);
      if (e.key === 'Escape') this.handleSkip();
    };
    window.addEventListener('keydown', this.keydownListener);
  }

  /**
   * Triggers the launch of a rocket by ID (1, 2, or 3).
   * Can be called programmatically from 3D scene raycast or keyboard shortcut.
   */
  public launchRocket(id: number): boolean {
    if (this.isDisposed || this.launchedRockets.has(id)) return false;

    this.launchedRockets.add(id);

    // 1. Notify external 3D scene manager (to ignite in-engine 3D rocket & fireworks)
    this.options.onRocketTriggered?.(id);

    // 2. Update status counter and guidance
    this.updateCounter();

    // 4. Update guidance text
    if (this.overlayEl) {
      const guidance = this.overlayEl.querySelector('#firecracker-guidance-pill');
      if (guidance) {
        if (this.launchedRockets.size < 3) {
          guidance.innerHTML = `<span class="text-base sm:text-lg">✨</span><span>Tap another 3D Rocket! 🚀 (${this.launchedRockets.size}/3)</span>`;
        } else {
          guidance.innerHTML = `<span class="text-base sm:text-lg">🎇</span><span>Shubh Deepotsav! Revealing your festive wish...</span>`;
        }
      }
    }

    // 5. Check if all 3 rockets have launched
    if (this.launchedRockets.size === 3) {
      this.handleAllLaunched();
    }

    return true;
  }

  private updateCounter(): void {
    if (!this.overlayEl) return;
    const countEl = this.overlayEl.querySelector('#cracker-launched-count');
    if (countEl) {
      countEl.textContent = String(this.launchedRockets.size);
    }
  }

  private handleAllLaunched(): void {
    if (this.hasTriggeredCompletion) return;
    this.hasTriggeredCompletion = true;

    // Allow fireworks to burst, then cleanly dismiss and reveal wish
    this.completeTimeoutId = setTimeout(() => {
      this.dismissAndComplete(false);
    }, 1500);
  }

  private handleSkip(): void {
    if (this.isDisposed) return;
    this.dismissAndComplete(true);
  }

  private dismissAndComplete(skipped = false): void {
    if (this.isDisposed) return;

    if (this.overlayEl) {
      this.overlayEl.classList.add('opacity-0', 'pointer-events-none');

      this.dismissTimeoutId = setTimeout(() => {
        this.dismissTimeoutId = null;
        if (this.isDisposed) return;
        this.dispose();
        if (skipped) {
          this.options.onSkip?.();
        } else {
          this.options.onComplete();
        }
      }, 400);
    } else {
      this.dispose();
      if (skipped) {
        this.options.onSkip?.();
      } else {
        this.options.onComplete();
      }
    }
  }

  public getLaunchedCount(): number {
    return this.launchedRockets.size;
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    if (this.completeTimeoutId) {
      clearTimeout(this.completeTimeoutId);
      this.completeTimeoutId = null;
    }

    if (this.dismissTimeoutId) {
      clearTimeout(this.dismissTimeoutId);
      this.dismissTimeoutId = null;
    }

    if (this.keydownListener) {
      window.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }

    if (this.overlayEl && this.overlayEl.parentNode) {
      this.overlayEl.parentNode.removeChild(this.overlayEl);
      this.overlayEl = null;
    }
  }
}
