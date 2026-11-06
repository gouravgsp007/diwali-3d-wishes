import confetti from 'canvas-confetti';
import type { AudioEngine } from '../../audio/audio-engine';

export interface FirecrackerWindowOptions {
  container: HTMLElement;
  audioEngine?: AudioEngine | null;
  onComplete: () => void;
  onSkip?: () => void;
}

interface RocketDef {
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

const ROCKETS: RocketDef[] = [
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
    colors: ['#FDE047', '#F59E0B', '#D97706', '#FEF08A', '#FFFFFF'],
  },
  {
    id: 2,
    name: 'Taramandal',
    hindiName: 'तारामंडल',
    desc: 'Ruby & Emerald',
    tag: '#2 Stars',
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
 * Interactive Firecracker Ceremony Window
 *
 * Replaces the Rangoli drawing canvas with an authentic 3-firecracker launchpad.
 * After the 3-second lit Diya reverence pause, the user taps 3 celebratory Indian
 * festive rockets. Each rocket shoots smoothly into the night sky with acoustic
 * whoosh SFX and explodes into high-altitude aerial fireworks before revealing
 * the personalized wish greeting card.
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
      'fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-hidden transition-opacity duration-500 opacity-0 select-none pointer-events-auto';

    this.overlayEl.innerHTML = `
      <div
        id="firecracker-card"
        class="relative w-full max-w-lg my-auto rounded-3xl p-5 sm:p-7 bg-stone-950/95 border border-amber-500/40 shadow-2xl shadow-amber-950/80 text-amber-100 flex flex-col gap-4 sm:gap-5 transform transition-all duration-300 scale-95"
      >
        <!-- Skip Button -->
        <button
          id="firecracker-skip-btn"
          type="button"
          class="absolute top-4 right-4 text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-amber-200/80 hover:text-amber-100 border border-amber-400/20 transition-all cursor-pointer flex items-center gap-1"
          title="Skip firecrackers to view personal wish"
        >
          <span>Skip to Wish</span>
          <span>→</span>
        </button>

        <!-- Header -->
        <div class="text-center pt-2 sm:pt-0">
          <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-[10px] font-bold text-amber-300 uppercase tracking-widest mb-1.5">
            ✨ Shubh Deepotsav Crackers ✨
          </div>
          <h2 class="text-xl sm:text-2xl font-serif font-bold tracking-wide bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            🎆 Burst The Festive Crackers!
          </h2>
          <p class="text-xs text-amber-200/80 mt-1 max-w-sm mx-auto leading-relaxed">
            Tap each rocket to light the fuse and launch it into the night sky!
          </p>

          <!-- Launch Progress Tracker -->
          <div class="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-lg bg-black/60 border border-amber-500/30 text-xs font-mono">
            <span class="text-yellow-300 font-bold">🚀 <span id="cracker-launched-count">0</span> / 3 Launched</span>
          </div>
        </div>

        <!-- 3 Rockets Grid -->
        <div class="grid grid-cols-3 gap-2.5 sm:gap-3.5 my-1">
          ${ROCKETS.map(
            (r) => `
            <div
              id="rocket-card-${r.id}"
              data-rocket-id="${r.id}"
              class="rocket-launch-card group relative flex flex-col items-center justify-between p-3 sm:p-4 rounded-2xl border ${r.accentClass} active:scale-95 transition-all cursor-pointer shadow-lg text-center min-h-[145px] sm:min-h-[165px]"
            >
              <div class="absolute -top-2.5 px-2 py-0.5 rounded-full ${r.badgeBg} font-bold text-[9px] uppercase tracking-wider shadow">
                ${r.tag}
              </div>

              <!-- Animated Rocket Icon -->
              <div id="rocket-icon-${r.id}" class="text-3xl sm:text-4xl my-1.5 sm:my-2 transition-transform duration-300 group-hover:-translate-y-1">
                ${r.icon}
              </div>

              <div>
                <h3 class="text-xs sm:text-sm font-serif font-bold text-amber-100 leading-tight">
                  ${r.name}
                </h3>
                <div class="text-[10px] text-amber-300/70 mt-0.5 font-sans">
                  ${r.desc}
                </div>
              </div>

              <button
                type="button"
                id="rocket-btn-${r.id}"
                class="mt-2.5 px-2.5 py-1 sm:py-1.5 rounded-xl border text-[10px] sm:text-xs font-bold tracking-wider uppercase transition-all w-full cursor-pointer pointer-events-none ${r.buttonClass}"
              >
                TAP TO LIGHT
              </button>
            </div>
          `
          ).join('')}
        </div>

        <!-- Footer Guidance & Keyboard Shortcut -->
        <div class="text-center text-[11px] text-amber-300/60 pt-1">
          <span class="hidden sm:inline">Tip: Press keys 1, 2, or 3 to launch • </span>
          <span>Each rocket bursts into real 3D fireworks!</span>
        </div>
      </div>
    `;

    this.options.container.appendChild(this.overlayEl);

    // Fade in
    requestAnimationFrame(() => {
      if (this.overlayEl) {
        this.overlayEl.classList.remove('opacity-0');
        const card = this.overlayEl.querySelector('#firecracker-card');
        card?.classList.remove('scale-95');
      }
    });

    // Wire clicks on cards
    ROCKETS.forEach((r) => {
      const card = this.overlayEl?.querySelector(`#rocket-card-${r.id}`);
      card?.addEventListener('click', () => {
        this.launchRocket(r.id);
      });
    });

    // Wire skip button
    const skipBtn = this.overlayEl.querySelector('#firecracker-skip-btn');
    skipBtn?.addEventListener('click', () => {
      this.handleSkip();
    });

    // Keyboard shortcuts (1, 2, 3)
    this.keydownListener = (e: KeyboardEvent) => {
      if (e.key === '1') this.launchRocket(1);
      if (e.key === '2') this.launchRocket(2);
      if (e.key === '3') this.launchRocket(3);
    };
    window.addEventListener('keydown', this.keydownListener);
  }

  public launchRocket(id: number): void {
    if (this.launchedRockets.has(id) || this.isDisposed) return;
    this.launchedRockets.add(id);

    const rocketDef = ROCKETS.find((r) => r.id === id);
    if (!rocketDef) return;

    // Play whoosh SFX
    this.options.audioEngine?.playRocketLaunch();

    // DOM animation on the rocket
    const card = this.overlayEl?.querySelector(`#rocket-card-${id}`) as HTMLElement | null;
    const icon = this.overlayEl?.querySelector(`#rocket-icon-${id}`) as HTMLElement | null;
    const btn = this.overlayEl?.querySelector(`#rocket-btn-${id}`) as HTMLElement | null;

    if (card && icon && btn) {
      card.classList.add('pointer-events-none', 'opacity-50');
      btn.textContent = '✓ LAUNCHED';
      btn.className =
        'mt-2.5 px-2.5 py-1 sm:py-1.5 rounded-xl border border-neutral-700 bg-neutral-800 text-neutral-400 text-[10px] sm:text-xs font-bold w-full';

      // Rocket ascent CSS animation
      icon.style.transition = 'transform 0.75s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.75s ease-in';
      icon.style.transform = 'translateY(-260px) scale(0.3)';
      icon.style.opacity = '0';
    }

    // Update count in UI
    const countEl = this.overlayEl?.querySelector('#cracker-launched-count');
    if (countEl) {
      countEl.textContent = String(this.launchedRockets.size);
    }

    // Trigger Aerial Fireworks Burst after ascent (600ms)
    setTimeout(() => {
      if (this.isDisposed) return;

      this.options.audioEngine?.playFireworksBurst();

      try {
        confetti({
          particleCount: 55,
          angle: 90,
          spread: 80,
          origin: {
            x: 0.25 + id * 0.22,
            y: 0.35,
          },
          colors: rocketDef.colors,
          ticks: 200,
          gravity: 0.8,
          scalar: 1.15,
        });
      } catch {
        // Confetti fallback
      }

      // Check if all 3 rockets launched
      if (this.launchedRockets.size === ROCKETS.length) {
        this.handleAllLaunched();
      }
    }, 600);
  }

  private handleAllLaunched(): void {
    if (this.isDisposed || this.hasTriggeredCompletion) return;
    this.hasTriggeredCompletion = true;

    // Play Grand Celebration Burst
    setTimeout(() => {
      if (this.isDisposed) return;

      try {
        confetti({
          particleCount: 100,
          spread: 120,
          origin: { y: 0.4 },
          colors: ['#FDE047', '#F59E0B', '#EF4444', '#10B981', '#38BDF8'],
        });
      } catch {
        // Safe fallback
      }

      // Smoothly dismiss overlay after celebration
      this.completeTimeoutId = setTimeout(() => {
        this.dismissAndComplete();
      }, 900);
    }, 500);
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
