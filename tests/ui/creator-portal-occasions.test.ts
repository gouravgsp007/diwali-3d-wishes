import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CreatorPortal } from '../../src/ui/creator-portal';
import { GreetingCodec } from '../../src/crypto/greeting-codec';

describe('CreatorPortal Multi-Occasion Switching', () => {
  let container: HTMLElement;
  let portal: CreatorPortal;

  beforeEach(() => {
    vi.restoreAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    portal?.dispose();
    container?.remove();
  });

  it('defaults to diwali occasion and updates upon tab click', () => {
    portal = new CreatorPortal({ container, bypassPin: true });
    portal.mount();

    expect(portal.getSelectedOccasion()).toBe('diwali');

    portal.selectOccasion('birthday');
    expect(portal.getSelectedOccasion()).toBe('birthday');

    const msg = portal.getMessageInput()?.value;
    expect(msg).toContain('Birthday');
    expect(portal.getPasscodeInput()?.placeholder).toContain('BDAY');
  });

  it('encrypts payload with templateId matching selected occasion', async () => {
    portal = new CreatorPortal({ container, bypassPin: true });
    portal.mount();

    portal.selectOccasion('wedding');

    const recipient = portal.getRecipientInput()!;
    const sender = portal.getSenderInput()!;
    const passcode = portal.getPasscodeInput()!;

    recipient.value = 'Rohan & Ananya';
    sender.value = 'Vikram';
    passcode.value = 'LOVE';

    const url = await portal.generate();
    expect(url).toContain('?theme=wedding#d=');

    // Extract ciphertext
    const hashIndex = url.indexOf('#d=');
    const ciphertext = url.substring(hashIndex + 3);

    const decrypted = await GreetingCodec.decrypt(ciphertext, 'LOVE');
    expect(decrypted.templateId).toBe('wedding');
    expect(decrypted.recipient).toBe('Rohan & Ananya');
    expect(decrypted.sender).toBe('Vikram');
  });

  it('updates prefilled copy for Happy New Year', () => {
    portal = new CreatorPortal({ container, bypassPin: true });
    portal.mount();

    portal.selectOccasion('newyear');
    expect(portal.getSelectedOccasion()).toBe('newyear');
    expect(portal.getMessageInput()?.value).toContain('New Year 2026');
    expect(portal.getPasscodeInput()?.placeholder).toContain('NY2026');
  });
});
