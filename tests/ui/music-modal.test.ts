import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MusicModal } from '../../src/ui/music-modal';
import { AudioEngine } from '../../src/audio/audio-engine';

describe('MusicModal UI', () => {
  let container: HTMLDivElement;
  let modal: MusicModal;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    modal = new MusicModal(container);
  });

  afterEach(() => {
    modal.dispose();
    container.remove();
    vi.restoreAllMocks();
  });

  it('mounts into DOM with expected elements', () => {
    modal.mount();
    const overlay = container.querySelector('#music-modal-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay?.classList.contains('hidden')).toBe(true);

    const closeBtn = overlay?.querySelector('#music-close-btn');
    expect(closeBtn).not.toBeNull();

    const trackButtons = overlay?.querySelectorAll('[data-track-id]');
    expect(trackButtons?.length).toBeGreaterThanOrEqual(3);

    const fileInput = overlay?.querySelector('#music-file-input');
    expect(fileInput).not.toBeNull();

    const urlInput = overlay?.querySelector('#music-url-input');
    expect(urlInput).not.toBeNull();
  });

  it('shows and hides properly', () => {
    modal.mount();
    expect(modal.isOpen()).toBe(false);

    modal.show();
    expect(modal.isOpen()).toBe(true);
    const overlay = container.querySelector('#music-modal-overlay');
    expect(overlay?.classList.contains('hidden')).toBe(false);

    modal.hide();
    expect(modal.isOpen()).toBe(false);
    expect(overlay?.classList.contains('hidden')).toBe(true);
  });

  it('switches track on button click', async () => {
    modal.mount();
    const audioEngine = AudioEngine.getInstance();
    const setTrackSpy = vi.spyOn(audioEngine, 'setTrack').mockResolvedValue();

    const fluteBtn = container.querySelector('[data-track-id="flute"]') as HTMLButtonElement;
    expect(fluteBtn).not.toBeNull();
    fluteBtn.click();

    expect(setTrackSpy).toHaveBeenCalledWith('flute');
  });

  it('handles custom audio file selection', async () => {
    modal.mount();
    const audioEngine = AudioEngine.getInstance();
    const loadSpy = vi.spyOn(audioEngine, 'loadCustomAudioFile').mockResolvedValue('blob:test');

    const fileInput = container.querySelector('#music-file-input') as HTMLInputElement;
    const mockFile = new File(['dummy audio content'], 'festive-custom.mp3', { type: 'audio/mp3' });

    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      configurable: true,
    });

    fileInput.dispatchEvent(new Event('change'));

    expect(loadSpy).toHaveBeenCalledWith(mockFile);
  });

  it('handles custom stream URL submission', async () => {
    modal.mount();
    const audioEngine = AudioEngine.getInstance();
    const setTrackSpy = vi.spyOn(audioEngine, 'setTrack').mockResolvedValue();

    const urlInput = container.querySelector('#music-url-input') as HTMLInputElement;
    const applyBtn = container.querySelector('#music-url-apply-btn') as HTMLButtonElement;

    urlInput.value = 'https://example.com/festive-ragas.mp3';
    applyBtn.click();

    expect(setTrackSpy).toHaveBeenCalledWith('custom', 'https://example.com/festive-ragas.mp3', 'Custom Stream');
  });

  it('cleans up DOM on dispose', () => {
    modal.mount();
    expect(container.querySelector('#music-modal-overlay')).not.toBeNull();

    modal.dispose();
    expect(container.querySelector('#music-modal-overlay')).toBeNull();
  });
});
