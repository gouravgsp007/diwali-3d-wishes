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
        <div class="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-stone-950/75 backdrop-blur-md border border-amber-500/30 text-xs shadow-lg">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span class="font-serif font-bold text-amber-200">Shubh Deepotsav</span>
          <span class="text-amber-500/50">•</span>
          <span class="font-mono text-yellow-300 font-bold">🚀 <span id="cracker-launched-count">0</span> / 3</span>
        </div>

        <button
          id="firecracker-skip-btn"
          type="button"
          class="text-xs px-3.5 py-1.5 rounded-full bg-stone-950/75 backdrop-blur-md hover:bg-stone-900 text-amber-200/80 hover:text-amber-100 border border-amber-500/30 transition-all cursor-pointer shadow-lg flex items-center gap-1.5"
          title="Skip firecrackers to view personal wish"
        >
          <span>Skip to Wish</span>
          <span>→</span>
        </button>
      </div>

      <!-- Bottom Floating Launcher Strip & Guidance (Replaces bulky card modal) -->
      <div
        id="firecracker-card"
        class="w-full max-w-lg mx-auto flex flex-col items-center gap-2 pointer-events-auto transform transition-all duration-300"
      >
        <!-- Floating Prompt Pill -->
        <div class="px-4 py-1 rounded-full bg-stone-950/80 backdrop-blur-md border border-amber-500/25 text-[11px] sm:text-xs text-amber-200 font-medium text-center shadow-lg">
          ✨ Tap any 3D rocket in the scene or launcher below
        </div>

        <!-- 3 Quick Launcher Chips -->
        <div class="w-full flex items-center justify-center gap-2 sm:gap-3">
          ${ROCKETS.map(
            (r) => `
            <div
              id="rocket-card-${r.id}"
              data-rocket-id="${r.id}"
              role="button"
              tabindex="0"
              aria-label="Launch ${r.name} rocket (${r.hindiName})"
              class="group relative flex-1 flex flex-col items-center p-2 sm:p-2.5 rounded-2xl bg-stone-950/85 backdrop-blur-md border ${r.accentClass} active:scale-95 transition-all cursor-pointer shadow-xl text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <div class="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-amber-100">
                <span id="rocket-icon-${r.id}" class="text-sm">${r.icon}</span>
                <span class="truncate">${r.name}</span>
              </div>
              <div class="text-[9px] text-amber-300/70 font-serif">${r.hindiName}</div>

              <button
                id="rocket-btn-${r.id}"
                type="button"
                tabindex="-1"
                class="mt-1.5 w-full py-0.5 px-2 text-[10px] font-bold rounded-lg border ${r.buttonClass} transition-all pointer-events-none"
              >
                Launch
              </button>
            </div>
          `
          ).join('')}
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

    // 3 Rocket Launcher Chips
    ROCKETS.forEach((r) => {
      const card = this.overlayEl?.querySelector(`#rocket-card-${r.id}`);
      card?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.launchRocket(r.id);
      });
      card?.addEventListener('keydown', (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          this.launchRocket(r.id);
        }
      });
    });

    // Desktop keyboard shortcuts (1, 2, 3)
    this.keydownListener = (e: KeyboardEvent) => {
      if (this.isDisposed) return;
      if (e.key === '1') this.launchRocket(1);
      if (e.key === '2') this.launchRocket(2);
      if (e.key === '3') this.launchRocket(3);
    };
    window.addEventListener('keydown', this.keydownListener);
  }

  /**
   * Triggers the launch of a rocket by ID (1, 2, or 3).
   * Can be called programmatically from 3D scene raycast or from HUD chip click.
   */
  public launchRocket(id: number): boolean {
    if (this.isDisposed || this.launchedRockets.has(id)) return false;

    this.launchedRockets.add(id);

    // 1. Play rising rocket whistle launch sound
    this.options.audioEngine.playRocketLaunch();

    // 2. Notify external 3D scene manager (to launch in-engine 3D rocket & fireworks)
    this.options.onRocketTriggered?.(id);

    // 3. Update HUD card state
    this.updateCardState(id);

    // 4. Update launch counter
    this.updateCounter();

    // 5. Schedule detonation sound (synced with peak 3D rocket ascent)
    setTimeout(() => {
      if (this.isDisposed) return;
      this.options.audioEngine.playFireworksBurst();
    }, 600);

    // 6. Check if all 3 rockets have launched
    if (this.launchedRockets.size === 3) {
      this.handleAllLaunched();
    }

    return true;
  }

  private updateCardState(id: number): void {
    if (!this.overlayEl) return;

    const card = this.overlayEl.querySelector(`#rocket-card-${id}`);
    const btn = this.overlayEl.querySelector(`#rocket-btn-${id}`);
    const icon = this.overlayEl.querySelector(`#rocket-icon-${id}`);

    if (btn) {
      btn.textContent = '✓ LAUNCHED';
      btn.className =
        'mt-1.5 w-full py-0.5 px-2 text-[10px] font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 pointer-events-none';
    }

    if (card) {
      card.classList.remove('cursor-pointer', 'active:scale-95');
      card.classList.add('opacity-70', 'pointer-events-none');
    }

    if (icon) {
      icon.classList.add('-translate-y-1', 'scale-110');
    }
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
      const card = this.overlayEl.querySelector('#firecracker-card');
      card?.classList.add('scale-95');

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
