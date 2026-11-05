import { AudioEngine } from '../audio/audio-engine';

/**
 * Festive Music Jukebox Modal UI.
 * Allows visitors to pick festive instrumental ragas or upload/paste their own music.
 */
export class MusicModal {
  private overlayEl: HTMLElement | null = null;
  private isVisible = false;
  private readonly audioEngine = AudioEngine.getInstance();

  constructor(private readonly container: HTMLElement) {}

  public mount(): void {
    if (this.overlayEl) return;

    this.overlayEl = document.createElement('div');
    this.overlayEl.id = 'music-modal-overlay';
    this.overlayEl.className =
      'fixed inset-0 z-40 hidden items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto transition-opacity duration-300 opacity-0 pointer-events-none select-none';

    this.render();
    this.container.appendChild(this.overlayEl);
    this.attachListeners();
  }

  private render(): void {
    if (!this.overlayEl) return;

    const currentTrack = this.audioEngine.getCurrentTrack();
    const tracks = this.audioEngine.getAvailableTracks();

    this.overlayEl.innerHTML = `
      <div
        id="music-card"
        class="relative w-full max-w-sm sm:max-w-md my-auto rounded-3xl p-6 sm:p-7 bg-neutral-950/95 border border-amber-500/40 shadow-2xl shadow-amber-950/60 text-amber-100 flex flex-col gap-4 pointer-events-auto transform transition-all duration-300 scale-95"
      >
        <!-- Close Button -->
        <button
          id="music-close-btn"
          type="button"
          aria-label="Close Music Modal"
          class="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-amber-400/80 hover:text-amber-200 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <!-- Header -->
        <div class="text-center">
          <div class="text-2xl mb-1 select-none">🎶</div>
          <h2 class="text-xl sm:text-2xl font-serif font-bold tracking-wide bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            Festive Music Jukebox
          </h2>
          <p class="text-xs text-amber-200/70 mt-1">
            Choose your festive soundtrack or play your own custom music!
          </p>
        </div>

        <!-- Currently Playing Indicator Card -->
        <div class="p-3 bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🪕</span>
            <div>
              <p class="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">Currently Playing</p>
              <h4 id="music-current-title" class="text-sm font-bold text-amber-100">${currentTrack.name}</h4>
              <p id="music-current-sub" class="text-xs text-amber-200/70">${currentTrack.subtitle}</p>
            </div>
          </div>
          <div class="flex items-end gap-1 h-5 px-2">
            <span class="w-1 h-3 bg-amber-400 rounded-full animate-bounce"></span>
            <span class="w-1 h-5 bg-amber-300 rounded-full animate-pulse"></span>
            <span class="w-1 h-2 bg-amber-500 rounded-full animate-bounce"></span>
          </div>
        </div>

        <!-- Track Presets List -->
        <div class="space-y-2">
          <p class="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">Festive Melodies</p>
          <div class="space-y-1.5" id="music-track-list">
            ${tracks
              .map(
                (track) => `
              <button
                type="button"
                data-track-id="${track.id}"
                class="music-track-btn w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  track.id === currentTrack.id
                    ? 'bg-amber-500/25 border-amber-400 text-amber-100 shadow-md shadow-amber-500/20'
                    : 'bg-black/40 border-amber-500/20 text-amber-200/80 hover:bg-white/5 hover:border-amber-400/40'
                }"
              >
                <div>
                  <div class="text-xs sm:text-sm font-bold">${track.name}</div>
                  <div class="text-[11px] text-amber-300/60">${track.subtitle}</div>
                </div>
                <span class="text-xs">${track.id === currentTrack.id ? '▶ Playing' : 'Select'}</span>
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Custom Upload Section -->
        <div class="p-3 bg-black/40 border border-amber-500/20 rounded-2xl flex flex-col gap-2">
          <p class="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">Play Your Own Song</p>
          <div class="flex flex-col gap-2">
            <label
              for="music-file-input"
              class="w-full py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wider uppercase bg-gradient-to-r from-amber-500/20 to-amber-600/30 hover:from-amber-500/30 border border-amber-400/40 text-amber-200 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <span>📁 Upload Audio File (MP3 / WAV)</span>
            </label>
            <input
              id="music-file-input"
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
              class="hidden"
            />
          </div>
          <div class="flex gap-2 items-center text-xs">
            <input
              id="music-url-input"
              type="url"
              placeholder="Or paste audio URL (.mp3)"
              class="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/30 text-amber-200 placeholder-amber-500/30 text-xs focus:outline-none focus:border-amber-400"
            />
            <button
              id="music-url-apply-btn"
              type="button"
              class="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider cursor-pointer hover:brightness-110 active:scale-95 transition-all"
            >
              Play
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private attachListeners(): void {
    if (!this.overlayEl) return;

    // Close button
    const closeBtn = this.overlayEl.querySelector('#music-close-btn');
    closeBtn?.addEventListener('click', () => this.hide());

    // Backdrop click
    this.overlayEl.addEventListener('click', (e) => {
      if (e.target === this.overlayEl) {
        this.hide();
      }
    });

    // Track selection clicks
    this.overlayEl.querySelectorAll('.music-track-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const target = (e.currentTarget as HTMLElement).getAttribute('data-track-id');
        if (target) {
          this.audioEngine.unlock();
          await this.audioEngine.setTrack(target);
          this.render();
          this.attachListeners();
        }
      });
    });

    // File upload handler
    const fileInput = this.overlayEl.querySelector('#music-file-input') as HTMLInputElement | null;
    fileInput?.addEventListener('change', async () => {
      if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        this.audioEngine.unlock();
        await this.audioEngine.loadCustomAudioFile(file);
        this.render();
        this.attachListeners();
      }
    });

    // Custom URL handler
    const urlInput = this.overlayEl.querySelector('#music-url-input') as HTMLInputElement | null;
    const urlBtn = this.overlayEl.querySelector('#music-url-apply-btn');
    urlBtn?.addEventListener('click', async () => {
      const url = urlInput?.value.trim();
      if (url) {
        this.audioEngine.unlock();
        await this.audioEngine.setTrack('custom', url, 'Custom Stream');
        this.render();
        this.attachListeners();
      }
    });
  }

  public show(): void {
    this.isVisible = true;
    if (this.overlayEl) {
      this.render();
      this.attachListeners();
      this.overlayEl.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
      this.overlayEl.classList.add('flex', 'opacity-100', 'pointer-events-auto');
      const card = this.overlayEl.querySelector('#music-card');
      card?.classList.remove('scale-95');
      card?.classList.add('scale-100');
    }
  }

  public hide(): void {
    this.isVisible = false;
    if (this.overlayEl) {
      this.overlayEl.classList.remove('flex', 'opacity-100', 'pointer-events-auto');
      this.overlayEl.classList.add('hidden', 'opacity-0', 'pointer-events-none');
      const card = this.overlayEl.querySelector('#music-card');
      card?.classList.remove('scale-100');
      card?.classList.add('scale-95');
    }
  }

  public isOpen(): boolean {
    return this.isVisible;
  }

  public dispose(): void {
    this.overlayEl?.remove();
    this.overlayEl = null;
    this.isVisible = false;
  }
}
