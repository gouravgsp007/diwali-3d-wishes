import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { bootstrap } from '../src/main';

describe('Application Bootstrap', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"><div id="passcode-card"><form id="passcode-form"><input id="passcode-input" /><button id="unlock-btn"></button><p id="error-feedback"></p></form></div></div>';
  });

  it('initializes FSM, SceneManager, and PasscodeGate, mounting them to DOM', () => {
    const { fsm, passcodeGate, sceneManager } = bootstrap();

    expect(fsm).toBeDefined();
    expect(passcodeGate).toBeDefined();
    expect(sceneManager).toBeDefined();

    expect(fsm.getState()).toBe('LOCKED');

    // Canvas should be mounted in #app
    const canvas = document.querySelector('#app canvas');
    expect(canvas).not.toBeNull();

    sceneManager.dispose();
  });
});
