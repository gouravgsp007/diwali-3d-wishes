import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FestiveActionBar } from '../../src/ui/festive-action-bar';
import type { SceneManager } from '../../src/graphics/scene-manager';
import type { MusicModal } from '../../src/ui/music-modal';

describe('FestiveActionBar UI', () => {
  let container: HTMLDivElement;
  let actionBar: FestiveActionBar;
  let mockSceneManager: Partial<SceneManager>;
  let mockMusicModal: Partial<MusicModal>;
  let mockCelebrationManager: { fireCelebrationBurst: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    mockCelebrationManager = {
      fireCelebrationBurst: vi.fn(),
    };

    mockSceneManager = {
      toggleSparkler: vi.fn().mockReturnValue(true),
      triggerSkyLantern: vi.fn(),
      triggerFlowerShower: vi.fn(),
      getCelebrationManager: vi.fn().mockReturnValue(mockCelebrationManager as unknown),
    };

    mockMusicModal = {
      show: vi.fn(),
    };

    actionBar = new FestiveActionBar(
      container,
      mockSceneManager as unknown as SceneManager,
      mockMusicModal as unknown as MusicModal
    );
  });

  afterEach(() => {
    actionBar.dispose();
    container.remove();
    vi.restoreAllMocks();
  });

  it('mounts toolbar and toast into container with 4 celebration action triggers', () => {
    actionBar.mount();
    const bar = container.querySelector('#festive-action-bar');
    expect(bar).not.toBeNull();

    const toast = container.querySelector('#festive-toast');
    expect(toast).not.toBeNull();

    expect(container.querySelector('#action-sparkler-btn')).not.toBeNull();
    expect(container.querySelector('#action-lantern-btn')).not.toBeNull();
    expect(container.querySelector('#action-flowers-btn')).not.toBeNull();
    expect(container.querySelector('#action-fireworks-btn')).not.toBeNull();
  });

  it('toggles sparkler and shows feedback toast', () => {
    actionBar.mount();
    const sparklerBtn = container.querySelector('#action-sparkler-btn') as HTMLButtonElement;

    sparklerBtn.click();
    expect(mockSceneManager.toggleSparkler).toHaveBeenCalledTimes(1);

    const toast = container.querySelector('#festive-toast');
    expect(toast?.textContent).toContain('Sparkler lit');
    expect(toast?.classList.contains('opacity-100')).toBe(true);

    // Toggle off
    (mockSceneManager.toggleSparkler as ReturnType<typeof vi.fn>).mockReturnValue(false);
    sparklerBtn.click();
    expect(toast?.textContent).toContain('extinguished');
  });

  it('releases sky lantern and shows blessing toast', () => {
    actionBar.mount();
    const lanternBtn = container.querySelector('#action-lantern-btn') as HTMLButtonElement;
    lanternBtn.click();

    expect(mockSceneManager.triggerSkyLantern).toHaveBeenCalledTimes(1);
    const toast = container.querySelector('#festive-toast');
    expect(toast?.textContent).toContain('Akash Kandil');
  });

  it('triggers royal flower shower and shows toast', () => {
    actionBar.mount();
    const flowersBtn = container.querySelector('#action-flowers-btn') as HTMLButtonElement;
    flowersBtn.click();

    expect(mockSceneManager.triggerFlowerShower).toHaveBeenCalledTimes(1);
    const toast = container.querySelector('#festive-toast');
    expect(toast?.textContent).toContain('Pushpa Vrishti');
  });

  it('triggers fireworks burst and shows celebration toast', () => {
    actionBar.mount();
    const fireworksBtn = container.querySelector('#action-fireworks-btn') as HTMLButtonElement;
    fireworksBtn.click();

    expect(mockCelebrationManager.fireCelebrationBurst).toHaveBeenCalledTimes(1);
    const toast = container.querySelector('#festive-toast');
    expect(toast?.textContent).toContain('Happy Diwali');
  });

  it('cleans up elements and timers on dispose', () => {
    actionBar.mount();
    actionBar.showToast('Test Toast');
    expect(container.querySelector('#festive-action-bar')).not.toBeNull();
    expect(container.querySelector('#festive-toast')).not.toBeNull();

    actionBar.dispose();
    expect(container.querySelector('#festive-action-bar')).toBeNull();
    expect(container.querySelector('#festive-toast')).toBeNull();
  });
});
