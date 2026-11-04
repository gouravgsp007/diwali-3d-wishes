import { describe, it, expect, beforeEach } from 'vitest';
import { bootstrap } from '../src/main';

describe('Application Bootstrap', () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<div id="app"><div id="passcode-card"><form id="passcode-form"><input id="passcode-input" /><button id="unlock-btn"></button><p id="error-feedback"></p></form></div></div>';
  });

  it('initializes FSM, SceneManager, PasscodeGate, and AudioToggle, mounting them to DOM', () => {
    const { fsm, passcodeGate, sceneManager, audioToggle } = bootstrap();

    expect(fsm).toBeDefined();
    expect(passcodeGate).toBeDefined();
    expect(sceneManager).toBeDefined();
    expect(audioToggle).toBeDefined();

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

    audioToggle.dispose();
    sceneManager.dispose();
  });
});
