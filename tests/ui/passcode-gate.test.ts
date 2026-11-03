import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PasscodeGate } from '../../src/ui/passcode-gate';
import { AppStateMachine } from '../../src/app/state-machine';
import * as audioUnlock from '../../src/audio/audio-unlock';
import { GreetingCodec } from '../../src/crypto/greeting-codec';
import type { GreetingPayload } from '../../src/crypto/types';

describe('PasscodeGate UI Controller', () => {
  let fsm: AppStateMachine;
  let formEl: HTMLFormElement;
  let inputEl: HTMLInputElement;
  let cardEl: HTMLElement;
  let errorEl: HTMLElement;
  let createWishBtn: HTMLButtonElement;

  beforeEach(() => {
    vi.restoreAllMocks();

    document.body.innerHTML = `
      <div id="app">
        <div id="passcode-card" class="card-base">
          <form id="passcode-form">
            <input id="passcode-input" type="text" />
            <button id="unlock-btn" type="submit">Open Festive Wish 🪔</button>
            <p id="error-feedback" class="hidden"></p>
          </form>
          <button id="create-wish-btn" type="button">Create Your Own Wish ✨</button>
        </div>
      </div>
    `;

    formEl = document.getElementById('passcode-form') as HTMLFormElement;
    inputEl = document.getElementById('passcode-input') as HTMLInputElement;
    cardEl = document.getElementById('passcode-card') as HTMLElement;
    errorEl = document.getElementById('error-feedback') as HTMLElement;
    createWishBtn = document.getElementById('create-wish-btn') as HTMLButtonElement;

    fsm = new AppStateMachine();
    fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: false });
  });

  it('automatically normalizes user input value to uppercase and hides error upon input event', () => {
    const gate = new PasscodeGate(fsm, { token: null, isDemo: true });
    gate.mount();

    errorEl.classList.remove('hidden');
    inputEl.value = 'diwali';
    inputEl.dispatchEvent(new Event('input'));

    expect(inputEl.value).toBe('DIWALI');
    expect(errorEl.classList.contains('hidden')).toBe(true);
  });

  it('synchronously invokes primeAudioContext during form submission event before async decryption', async () => {
    const primeAudioSpy = vi.spyOn(audioUnlock, 'primeAudioContext').mockImplementation(() => {});

    const gate = new PasscodeGate(fsm, { token: null, isDemo: true });
    gate.mount();

    inputEl.value = 'DIWALI';
    formEl.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(primeAudioSpy).toHaveBeenCalledTimes(1);
  });

  it('transitions AppStateMachine to UNLOCKED_INTRO and fades passcode modal on valid demo passcode', async () => {
    vi.spyOn(audioUnlock, 'primeAudioContext').mockImplementation(() => {});

    const gate = new PasscodeGate(fsm, { token: null, isDemo: true });
    gate.mount();

    inputEl.value = 'DIWALI';
    formEl.dispatchEvent(new Event('submit', { cancelable: true }));

    // Wait for async unlock handler to finish
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(fsm.state).toBe('UNLOCKED_INTRO');
    expect(fsm.payload).not.toBeNull();
    expect(fsm.payload?.recipient).toBe('Beloved Friend');
    expect(cardEl.classList.contains('opacity-0')).toBe(true);
    expect(cardEl.classList.contains('scale-95')).toBe(true);
    expect(cardEl.classList.contains('pointer-events-none')).toBe(true);
  });

  it('transitions AppStateMachine and decrypts ciphertext on valid encrypted token', async () => {
    vi.spyOn(audioUnlock, 'primeAudioContext').mockImplementation(() => {});

    const testPayload: GreetingPayload = {
      recipient: 'Ananya',
      sender: 'Karan',
      message: 'Happy Diwali with lots of love and light!',
      templateId: 'diya-classic',
    };
    const token = await GreetingCodec.encrypt(testPayload, 'KARAN');

    const encryptedFsm = new AppStateMachine();
    encryptedFsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });

    const gate = new PasscodeGate(encryptedFsm, { token, isDemo: false });
    gate.mount();

    inputEl.value = 'karan'; // lowercase input to verify normalization
    inputEl.dispatchEvent(new Event('input'));
    formEl.dispatchEvent(new Event('submit', { cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(encryptedFsm.state).toBe('UNLOCKED_INTRO');
    expect(encryptedFsm.payload?.recipient).toBe('Ananya');
    expect(encryptedFsm.payload?.sender).toBe('Karan');
  });

  it('triggers animate-shake CSS class, reflow, and friendly textContent error on wrong passcode', async () => {
    vi.spyOn(audioUnlock, 'primeAudioContext').mockImplementation(() => {});
    const selectSpy = vi.spyOn(inputEl, 'select');

    const gate = new PasscodeGate(fsm, { token: null, isDemo: true });
    gate.mount();

    inputEl.value = 'WRONG';
    formEl.dispatchEvent(new Event('submit', { cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(fsm.state).toBe('LOCKED');
    expect(cardEl.classList.contains('animate-shake')).toBe(true);
    expect(errorEl.classList.contains('hidden')).toBe(false);
    expect(errorEl.textContent).toBe("Passcode doesn't match this greeting. Please check your message!");
    expect(selectSpy).toHaveBeenCalled();
  });

  it('re-selects input text on rejection to facilitate quick user correction', async () => {
    vi.spyOn(audioUnlock, 'primeAudioContext').mockImplementation(() => {});
    const selectSpy = vi.spyOn(inputEl, 'select');

    const gate = new PasscodeGate(fsm, { token: null, isDemo: true });
    gate.mount();

    inputEl.value = '1234';
    formEl.dispatchEvent(new Event('submit', { cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(selectSpy).toHaveBeenCalled();
  });

  it('does not attempt unlock if passcode length is less than 4 or greater than 6', async () => {
    const primeAudioSpy = vi.spyOn(audioUnlock, 'primeAudioContext').mockImplementation(() => {});

    const gate = new PasscodeGate(fsm, { token: null, isDemo: true });
    gate.mount();

    inputEl.value = 'ABC'; // 3 characters
    formEl.dispatchEvent(new Event('submit', { cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(primeAudioSpy).not.toHaveBeenCalled();
    expect(fsm.state).toBe('LOCKED');
  });

  it('clicking "Create Your Own Wish" button triggers friendly modal or toast stub without altering FSM', () => {
    const gate = new PasscodeGate(fsm, { token: null, isDemo: true });
    gate.mount();

    createWishBtn.click();

    const toast = document.getElementById('create-wish-toast');
    expect(toast).not.toBeNull();
    expect(toast?.textContent).toContain('Create Your Own Wish');
    expect(fsm.state).toBe('LOCKED');
  });
});
