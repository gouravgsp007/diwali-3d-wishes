import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GreetingModal } from '../../src/ui/greeting-modal';
import type { GreetingPayload } from '../../src/crypto/types';

describe('GreetingModal UI Component', () => {
  let container: HTMLElement;
  let modal: GreetingModal;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
    modal = new GreetingModal();
  });

  afterEach(() => {
    modal.dispose();
    container.remove();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('mount() creates fixed fullscreen overlay (#greeting-modal-overlay) with pointer-events-none and appends it to container per D-01', () => {
    modal.mount(container);

    const overlay = document.getElementById('greeting-modal-overlay');
    expect(overlay).not.toBeNull();
    expect(container.contains(overlay)).toBe(true);
    expect(overlay?.className).toContain('fixed');
    expect(overlay?.className).toContain('inset-0');
    expect(overlay?.className).toContain('pointer-events-none');
    expect(overlay?.className).toContain('select-none');
  });

  it('mount() ignores subsequent calls if already mounted', () => {
    modal.mount(container);
    const initialOverlay = document.getElementById('greeting-modal-overlay');

    modal.mount(container);
    const overlays = document.querySelectorAll('#greeting-modal-overlay');
    expect(overlays.length).toBe(1);
    expect(overlays[0]).toBe(initialOverlay);
  });

  it('mount() creates card element (#greeting-card) with glassmorphic styles, gold shimmer heading, SVG filigree, and initial opacity-0 translate-y-4 per D-01, D-03', () => {
    modal.mount(container);

    const card = document.getElementById('greeting-card');
    expect(card).not.toBeNull();
    expect(card?.className).toContain('backdrop-blur-xl');
    expect(card?.className).toContain('bg-black/40');
    expect(card?.className).toContain('border-amber-500/40');
    expect(card?.className).toContain('rounded-3xl');
    expect(card?.className).toContain('opacity-0');
    expect(card?.className).toContain('scale-95');
    expect(card?.className).toContain('translate-y-4');
    expect(card?.className).toContain('pointer-events-none');

    // Heading & motifs
    expect(card?.textContent).toContain('Happy Diwali');
    expect(card?.textContent).toContain('Shubh Deepavali');
    expect(card?.querySelector('svg')).not.toBeNull();
  });

  it('show() injects recipient, message, and sender strictly via textContent (never innerHTML), verifying XSS immunity per D-02 and ASVS V5', () => {
    modal.mount(container);

    const maliciousPayload: GreetingPayload = {
      recipient: '<script>alert("xss")</script>Priya',
      sender: '<img src="x" onerror="evil()"/>Aarav',
      message: '<b>Bold</b> wishing <iframe src="javascript:evil()"></iframe>',
    };

    modal.show(maliciousPayload);

    const recipientEl = document.getElementById('greeting-recipient');
    const senderEl = document.getElementById('greeting-sender');
    const messageEl = document.getElementById('greeting-message');

    expect(recipientEl).not.toBeNull();
    expect(senderEl).not.toBeNull();
    expect(messageEl).not.toBeNull();

    // Verifying textContent matches string literal exactly
    expect(recipientEl?.textContent).toBe('To: <script>alert("xss")</script>Priya');
    expect(senderEl?.textContent).toBe('— With love, <img src="x" onerror="evil()"/>Aarav');
    expect(messageEl?.textContent).toBe('“<b>Bold</b> wishing <iframe src="javascript:evil()"></iframe>”');

    // Asserts no actual script or iframe elements are rendered into the DOM
    expect(document.querySelector('script[src]')).toBeNull();
    expect(document.querySelector('iframe')).toBeNull();
    expect(document.querySelector('img[onerror]')).toBeNull();
  });

  it('show() applies fallback values when payload attributes are null, undefined, or empty per D-02', () => {
    modal.mount(container);
    modal.show(null);

    const recipientEl = document.getElementById('greeting-recipient');
    const senderEl = document.getElementById('greeting-sender');
    const messageEl = document.getElementById('greeting-message');

    expect(recipientEl?.textContent).toBe('To: Dear Friend');
    expect(senderEl?.textContent).toBe('— With love, A Well-Wisher');
    expect(messageEl?.textContent).toBe(
      '“Wishing you and your loved ones a joyous, prosperous, and luminous Diwali! May this festival of lights illuminate your path with happiness and success.”'
    );
  });

  it('show() applies fallback values when payload attributes are whitespace strings', () => {
    modal.mount(container);
    modal.show({
      recipient: '   ',
      sender: '',
      message: '  \n  ',
    });

    const recipientEl = document.getElementById('greeting-recipient');
    const senderEl = document.getElementById('greeting-sender');
    const messageEl = document.getElementById('greeting-message');

    expect(recipientEl?.textContent).toBe('To: Dear Friend');
    expect(senderEl?.textContent).toBe('— With love, A Well-Wisher');
    expect(messageEl?.textContent).toBe(
      '“Wishing you and your loved ones a joyous, prosperous, and luminous Diwali! May this festival of lights illuminate your path with happiness and success.”'
    );
  });

  it('show() updates WhatsApp reply button href with createWhatsAppReplyUrl(sender) per D-06 and WISH-02', () => {
    modal.mount(container);
    modal.show({
      recipient: 'Anjali',
      sender: 'Dev',
      message: 'Happy festive days!',
    });

    const whatsappBtn = document.getElementById('whatsapp-reply-btn') as HTMLAnchorElement | null;
    expect(whatsappBtn).not.toBeNull();
    expect(whatsappBtn?.href).toContain('https://wa.me/?text=');

    const decoded = decodeURIComponent(whatsappBtn!.href.replace('https://wa.me/?text=', ''));
    expect(decoded).toContain('Thank you Dev so much');
  });

  it('card includes creator footer badge (#creator-badge) linking to #create per D-03 and WISH-03', () => {
    modal.mount(container);

    const badge = document.getElementById('creator-badge') as HTMLAnchorElement | null;
    expect(badge).not.toBeNull();
    expect(badge?.getAttribute('href')).toBe('#create');
    expect(badge?.textContent).toContain('Create Your Own Wish');
  });

  it('show() toggles card classes removing opacity-0, scale-95, translate-y-4, pointer-events-none and adding opacity-100, scale-100, translate-y-0, pointer-events-auto per D-01', () => {
    // Mock requestAnimationFrame to execute synchronously
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    modal.mount(container);
    modal.show(null);

    const card = document.getElementById('greeting-card');
    expect(card?.className).toContain('opacity-100');
    expect(card?.className).toContain('scale-100');
    expect(card?.className).toContain('translate-y-0');
    expect(card?.className).toContain('pointer-events-auto');

    expect(card?.className).not.toContain('opacity-0');
    expect(card?.className).not.toContain('scale-95');
    expect(card?.className).not.toContain('translate-y-4');
    expect(card?.className).not.toContain('pointer-events-none');

    rafSpy.mockRestore();
  });

  it('hide() reverses entrance classes restoring opacity-0, scale-95, translate-y-4, pointer-events-none', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    modal.mount(container);
    modal.show(null);

    const card = document.getElementById('greeting-card');
    expect(card?.className).toContain('opacity-100');

    modal.hide();

    expect(card?.className).toContain('opacity-0');
    expect(card?.className).toContain('scale-95');
    expect(card?.className).toContain('translate-y-4');
    expect(card?.className).toContain('pointer-events-none');
    expect(card?.className).not.toContain('opacity-100');
    expect(card?.className).not.toContain('pointer-events-auto');
  });

  it('provides public element getters returning corresponding DOM references', () => {
    modal.mount(container);

    expect(modal.getOverlayElement()).toBe(document.getElementById('greeting-modal-overlay'));
    expect(modal.getCardElement()).toBe(document.getElementById('greeting-card'));
    expect(modal.getRecipientElement()).toBe(document.getElementById('greeting-recipient'));
    expect(modal.getMessageElement()).toBe(document.getElementById('greeting-message'));
    expect(modal.getSenderElement()).toBe(document.getElementById('greeting-sender'));
    expect(modal.getWhatsAppButtonElement()).toBe(document.getElementById('whatsapp-reply-btn'));
    expect(modal.getCreatorBadgeElement()).toBe(document.getElementById('creator-badge'));
  });

  it('dispose() removes overlay element from DOM and nullifies all element references per D-07, ASVS V14, and T-05-05', () => {
    modal.mount(container);
    expect(document.getElementById('greeting-modal-overlay')).not.toBeNull();

    modal.dispose();
    expect(document.getElementById('greeting-modal-overlay')).toBeNull();
    expect(modal.getOverlayElement()).toBeNull();
    expect(modal.getCardElement()).toBeNull();
    expect(modal.getRecipientElement()).toBeNull();
    expect(modal.getMessageElement()).toBeNull();
    expect(modal.getSenderElement()).toBeNull();
    expect(modal.getWhatsAppButtonElement()).toBeNull();
    expect(modal.getCreatorBadgeElement()).toBeNull();

    // Calling show or hide after dispose should not throw
    expect(() => modal.show(null)).not.toThrow();
    expect(() => modal.hide()).not.toThrow();
    expect(() => modal.dispose()).not.toThrow();
  });
});
