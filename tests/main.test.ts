import { describe, it, expect, beforeEach } from 'vitest';
import { bootstrap } from '../src/main';

describe('Application Bootstrap', () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<div id="app"><div id="passcode-card"><form id="passcode-form"><input id="passcode-input" /><button id="unlock-btn"></button><p id="error-feedback"></p></form></div></div>';
  });

  it('initializes FSM, SceneManager, PasscodeGate, AudioToggle, CreatorPortal, FestiveActionBar, and ShowcaseModal', () => {
    const { fsm, passcodeGate, sceneManager, audioToggle, creatorPortal, festiveActionBar, showcaseModal } = bootstrap();

    expect(fsm).toBeDefined();
    expect(passcodeGate).toBeDefined();
    expect(sceneManager).toBeDefined();
    expect(audioToggle).toBeDefined();
    expect(creatorPortal).toBeDefined();
    expect(festiveActionBar).toBeDefined();
    expect(showcaseModal).toBeDefined();

    expect(fsm.getState()).toBe('LOCKED');

    // Canvas should be mounted in #app
    const canvas = document.querySelector('#app canvas');
    expect(canvas).not.toBeNull();

    // Audio toggle button should be mounted in #app
    const audioBtn = document.querySelector('#audio-toggle-btn');
    expect(audioBtn).not.toBeNull();

    // SceneManager should create GreetingModal and CelebrationManager (Phase 5)
    expect(sceneManager.getGreetingModal()).not.toBeNull();
    expect(sceneManager.getCelebrationManager()).not.toBeNull();

    // GreetingModal overlay mounted into DOM container
    const greetingOverlay = document.querySelector('#greeting-modal-overlay');
    expect(greetingOverlay).not.toBeNull();

    // CreatorPortal overlay mounted into DOM container
    const creatorOverlay = document.querySelector('#creator-portal-overlay');
    expect(creatorOverlay).not.toBeNull();

    // FestiveActionBar dock mounted into DOM container
    const actionBar = document.querySelector('#festive-action-bar');
    expect(actionBar).not.toBeNull();

    // ShowcaseModal overlay mounted into DOM container
    const showcaseOverlay = document.querySelector('#showcase-modal-overlay');
    expect(showcaseOverlay).not.toBeNull();

    // Selecting Birthday from ShowcaseModal switches theme and hides passcode gate
    const birthdayBtn = document.querySelector('[data-preview-occasion="birthday"]') as HTMLElement;
    birthdayBtn?.click();

    expect(sceneManager.getActiveTheme()?.id).toBe('birthday');
    expect(fsm.getState()).toBe('UNLOCKED_INTRO');
    const passcodeCard = document.querySelector('#passcode-card');
    expect(passcodeCard?.classList.contains('opacity-0')).toBe(true);

    showcaseModal.dispose();
    passcodeGate.dispose();
    festiveActionBar.dispose();
    creatorPortal.dispose();
    audioToggle.dispose();
    sceneManager.dispose();
  });
});
