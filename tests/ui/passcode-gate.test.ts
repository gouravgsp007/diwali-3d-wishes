import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PasscodeGate } from '../../src/ui/passcode-gate';
import { AppStateMachine } from '../../src/app/state-machine';
import { AudioEngine } from '../../src/audio/audio-engine';
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
          <div class="text-3xl">🪔</div>
          <p class="uppercase">✨ Shubh Deepavali ✨</p>
          <h1>Unlock Your Diwali Surprise</h1>
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

  it('synchronously invokes AudioEngine.getInstance().unlock during form submission event before async decryption', async () => {
    const unlockSpy = vi.spyOn(AudioEngine.getInstance(), 'unlock').mockImplementation(() => {});

    const gate = new PasscodeGate(fsm, { token: null, isDemo: true });
    gate.mount();

    inputEl.value = 'DIWALI';
    formEl.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(unlockSpy).toHaveBeenCalledTimes(1);
  });

  it('transitions AppStateMachine to UNLOCKED_INTRO and fades passcode modal on valid demo passcode', async () => {
    vi.spyOn(AudioEngine.getInstance(), 'unlock').mockImplementation(() => {});

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
    vi.spyOn(AudioEngine.getInstance(), 'unlock').mockImplementation(() => {});

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

    await vi.waitFor(() => expect(encryptedFsm.state).toBe('UNLOCKED_INTRO'), { timeout: 3000 });

    expect(encryptedFsm.payload?.recipient).toBe('Ananya');
    expect(encryptedFsm.payload?.sender).toBe('Karan');
  });

  it('triggers animate-shake CSS class, reflow, and friendly textContent error on wrong passcode', async () => {
    vi.spyOn(AudioEngine.getInstance(), 'unlock').mockImplementation(() => {});
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
    vi.spyOn(AudioEngine.getInstance(), 'unlock').mockImplementation(() => {});
    const selectSpy = vi.spyOn(inputEl, 'select');

    const gate = new PasscodeGate(fsm, { token: null, isDemo: true });
    gate.mount();

    inputEl.value = '1234';
    formEl.dispatchEvent(new Event('submit', { cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(selectSpy).toHaveBeenCalled();
  });

  it('does not attempt unlock if passcode length is less than 4 or greater than 6', async () => {
    const unlockSpy = vi.spyOn(AudioEngine.getInstance(), 'unlock').mockImplementation(() => {});

    const gate = new PasscodeGate(fsm, { token: null, isDemo: true });
    gate.mount();

    inputEl.value = 'ABC'; // 3 characters
    formEl.dispatchEvent(new Event('submit', { cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(unlockSpy).not.toHaveBeenCalled();
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

  it('delivers valid GreetingPayload (recipient, sender, message) to AppStateMachine upon UNLOCK_SUCCESS accessible via fsm.getGreeting() per D-02', async () => {
    vi.spyOn(AudioEngine.getInstance(), 'unlock').mockImplementation(() => {});

    const testPayload: GreetingPayload = {
      recipient: 'Rohan',
      sender: 'Meera',
      message: 'Wishing you sparkling joy and auspicious blessings!',
      templateId: 'diya-classic',
    };
    const token = await GreetingCodec.encrypt(testPayload, 'MEERA');

    const encryptedFsm = new AppStateMachine();
    encryptedFsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });

    const gate = new PasscodeGate(encryptedFsm, { token, isDemo: false });
    gate.mount();

    inputEl.value = 'MEERA';
    formEl.dispatchEvent(new Event('submit', { cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(encryptedFsm.state).toBe('UNLOCKED_INTRO');
    const greeting = encryptedFsm.getGreeting();
    expect(greeting).not.toBeNull();
    expect(greeting?.recipient).toBe('Rohan');
    expect(greeting?.sender).toBe('Meera');
    expect(greeting?.message).toBe('Wishing you sparkling joy and auspicious blessings!');
  });

  it('preserves error rejection on invalid passcode without populating or leaking fsm.getGreeting() per T-01-04', async () => {
    vi.spyOn(AudioEngine.getInstance(), 'unlock').mockImplementation(() => {});

    const testPayload: GreetingPayload = {
      recipient: 'Secret',
      sender: 'Sender',
      message: 'Top secret Diwali wish!',
      templateId: 'diya-classic',
    };
    const token = await GreetingCodec.encrypt(testPayload, 'VALID');

    const encryptedFsm = new AppStateMachine();
    encryptedFsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });

    const gate = new PasscodeGate(encryptedFsm, { token, isDemo: false });
    gate.mount();

    inputEl.value = 'WRONG';
    formEl.dispatchEvent(new Event('submit', { cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(encryptedFsm.state).toBe('LOCKED');
    expect(encryptedFsm.getGreeting()).toBeNull();
    expect(errorEl.classList.contains('hidden')).toBe(false);
  });

  it('automatically hides passcode modal when AppStateMachine transitions to UNLOCKED_INTRO', () => {
    const gate = new PasscodeGate(fsm, { token: null, isDemo: true });
    gate.mount();

    expect(cardEl.classList.contains('opacity-0')).toBe(false);

    fsm.transition({
      type: 'UNLOCK_SUCCESS',
      payload: {
        recipient: 'You',
        sender: 'Bestie',
        message: 'Happy Birthday!',
        templateId: 'birthday',
      },
    });

    expect(cardEl.classList.contains('opacity-0')).toBe(true);
    expect(cardEl.classList.contains('pointer-events-none')).toBe(true);
  });

  it('updates title, badge, emoji, submit button, and placeholder for each theme and restores Diwali', () => {
    const gate = new PasscodeGate(fsm, { token: null, isDemo: true });
    gate.mount();

    // 1. Birthday
    gate.updateThemeContent('birthday');
    expect(cardEl.textContent).toContain('HAPPY BIRTHDAY');
    expect(cardEl.textContent).toContain('Unlock Your Birthday Surprise');
    expect(inputEl.placeholder).toBe('ENTER BDAY');

    // 2. Wedding
    gate.updateThemeContent('wedding');
    expect(cardEl.textContent).toContain('WEDDING & ENGAGEMENT');
    expect(cardEl.textContent).toContain('Unlock Your Sacred Blessings');
    expect(inputEl.placeholder).toBe('ENTER LOVE');

    // 3. New Year
    gate.updateThemeContent('newyear');
    expect(cardEl.textContent).toContain('HAPPY NEW YEAR 2026');
    expect(cardEl.textContent).toContain('Unlock Your New Year Surprise');
    expect(inputEl.placeholder).toBe('ENTER NY2026');

    // 4. Diwali restore
    gate.updateThemeContent('diwali');
    expect(cardEl.textContent).toContain('SHUBH DEEPAVALI');
    expect(cardEl.textContent).toContain('Unlock Your Diwali Surprise');
    expect(inputEl.placeholder).toBe('ENTER PASSCODE');
  });

  it('shows friendly validation feedback when passcode is shorter than 4 or longer than 6', async () => {
    const gate = new PasscodeGate(fsm, { token: null, isDemo: true });
    gate.mount();

    inputEl.value = 'ABC'; // 3 characters
    formEl.dispatchEvent(new Event('submit', { cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fsm.state).toBe('LOCKED');
    expect(errorEl.textContent).toContain('between 4 and 6 characters');
    expect(cardEl.classList.contains('animate-shake')).toBe(true);
  });

  it('dynamically re-resolves encrypted token from URL hash or sessionStorage on submit', async () => {
    const payload = {
      recipient: 'Rohan',
      sender: 'Kavya',
      message: 'Happy Deepavali!',
      templateId: 'diwali',
      createdAt: 1730635200000,
    };
    const token = await GreetingCodec.encrypt(payload, 'ROHAN');

    // Mount initially in demo mode (e.g. user loaded page without hash)
    const gate = new PasscodeGate(fsm, { token: null, isDemo: true });
    gate.mount();

    // User pastes or receives hash without page reload
    window.location.hash = `#d=${token}`;
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    inputEl.value = 'ROHAN';
    formEl.dispatchEvent(new Event('submit', { cancelable: true }));

    await vi.waitFor(() => expect(fsm.state).toBe('UNLOCKED_INTRO'), { timeout: 3000 });
    expect(fsm.payload?.recipient).toBe('Rohan');
  });
});
