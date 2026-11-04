import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CreatorPortal } from '../../src/ui/creator-portal';
import { PasscodeGate } from '../../src/ui/passcode-gate';
import { AppStateMachine } from '../../src/app/state-machine';
import { resolveGreetingToken } from '../../src/ui/url-resolver';
import { AudioEngine } from '../../src/audio/audio-engine';

describe('Creator-to-Recipient Cryptographic E2E Round-Trip', () => {
  let container: HTMLElement;
  let portal: CreatorPortal;

  beforeEach(() => {
    vi.restoreAllMocks();
    // AudioEngine unlock mock for headless environment
    vi.spyOn(AudioEngine.getInstance(), 'unlock').mockImplementation(() => {});

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

    container = document.getElementById('app')!;
    window.location.hash = '';
  });

  afterEach(() => {
    portal?.dispose();
    window.location.hash = '';
  });

  it('generates an encrypted link in CreatorPortal that unlocks seamlessly in recipient PasscodeGate', async () => {
    // ─── STEP 1: Creator Experience ───────────────────────────────────────────
    let generatedUrl = '';
    let generatedPasscode = '';

    portal = new CreatorPortal({
      container,
      onWishCreated: (url, passcode) => {
        generatedUrl = url;
        generatedPasscode = passcode;
      },
    });
    portal.mount();

    const recipientInput = portal.getRecipientInput()!;
    const senderInput = portal.getSenderInput()!;
    const messageInput = portal.getMessageInput()!;
    const passcodeInput = portal.getPasscodeInput()!;

    recipientInput.value = 'Ananya';
    senderInput.value = 'Vikram & Radhika';
    messageInput.value =
      'May the divine glow of Diwali diyas illuminate your life with infinite joy, good health, and abundant prosperity!';
    passcodeInput.value = 'DIY26';

    // Call generate() on CreatorPortal
    const shareUrl = await portal.generate();

    expect(shareUrl).toContain('#d=');
    expect(generatedUrl).toBe(shareUrl);
    expect(generatedPasscode).toBe('DIY26');

    // ─── STEP 2: Simulated Recipient Journey ──────────────────────────────────
    // Extract the hash token from the generated URL
    const urlHash = generatedUrl.split('#')[1];
    window.location.hash = `#${urlHash}`;

    const tokenInfo = resolveGreetingToken();
    expect(tokenInfo.isDemo).toBe(false);
    expect(tokenInfo.token).toBeDefined();

    // Instantiate recipient application state machine
    const recipientFsm = new AppStateMachine();
    recipientFsm.transition({
      type: 'BOOT_COMPLETE',
      hasCiphertext: true,
    });
    expect(recipientFsm.getState()).toBe('LOCKED');

    // Mount recipient PasscodeGate
    const passcodeGate = new PasscodeGate(recipientFsm, tokenInfo);
    passcodeGate.mount();

    // ─── STEP 3: Recipient Unlocks with Passcode ──────────────────────────────
    const passcodeForm = document.querySelector('#passcode-form') as HTMLFormElement;
    const passcodeField = document.querySelector('#passcode-input') as HTMLInputElement;

    passcodeField.value = 'diy26'; // Case-insensitive entry
    passcodeField.dispatchEvent(new Event('input'));

    passcodeForm.dispatchEvent(new Event('submit', { cancelable: true }));

    // Allow PBKDF2 key derivation and AES-GCM decryption to settle
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Verify successful FSM transition
    expect(recipientFsm.getState()).toBe('UNLOCKED_INTRO');

    // Verify decrypted GreetingPayload matches creator's input with 100% fidelity
    const greeting = recipientFsm.getGreeting();
    expect(greeting).not.toBeNull();
    expect(greeting?.recipient).toBe('Ananya');
    expect(greeting?.sender).toBe('Vikram & Radhika');
    expect(greeting?.message).toBe(
      'May the divine glow of Diwali diyas illuminate your life with infinite joy, good health, and abundant prosperity!'
    );
  });

  it('rejects decryption when recipient enters an invalid passcode without leaking ciphertext', async () => {
    portal = new CreatorPortal({ container });
    portal.mount();

    portal.getRecipientInput()!.value = 'Pooja';
    portal.getSenderInput()!.value = 'Aman';
    portal.getMessageInput()!.value = 'Happy Diwali!';
    portal.getPasscodeInput()!.value = 'GOOD';

    const shareUrl = await portal.generate();
    expect(shareUrl).toContain('#d=');

    const urlHash = shareUrl.split('#')[1];
    window.location.hash = `#${urlHash}`;

    const tokenInfo = resolveGreetingToken();
    const recipientFsm = new AppStateMachine();
    recipientFsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });

    const passcodeGate = new PasscodeGate(recipientFsm, tokenInfo);
    passcodeGate.mount();

    const passcodeForm = document.querySelector('#passcode-form') as HTMLFormElement;
    const passcodeField = document.querySelector('#passcode-input') as HTMLInputElement;
    const errorFeedback = document.querySelector('#error-feedback') as HTMLElement;

    // Wrong passcode
    passcodeField.value = 'WRONG';
    passcodeField.dispatchEvent(new Event('input'));
    passcodeForm.dispatchEvent(new Event('submit', { cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 600));

    // State remains LOCKED and no greeting payload is decrypted
    expect(recipientFsm.getState()).toBe('LOCKED');
    expect(recipientFsm.getGreeting()).toBeNull();
    expect(errorFeedback.classList.contains('hidden')).toBe(false);
    expect(errorFeedback.textContent).toContain("Passcode doesn't match this greeting");
  });
});
