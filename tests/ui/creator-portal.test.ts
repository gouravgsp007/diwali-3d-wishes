import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CreatorPortal } from '../../src/ui/creator-portal';
import { GreetingCodec } from '../../src/crypto/greeting-codec';
import * as clipboardModule from '../../src/utils/clipboard';
import { OrderHistoryStore } from '../../src/storage/order-history-store';

describe('CreatorPortal UI Controller', () => {
  let container: HTMLElement;
  let portal: CreatorPortal;

  beforeEach(() => {
    vi.restoreAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    window.location.hash = '';
  });

  afterEach(() => {
    portal?.dispose();
    container?.remove();
    window.location.hash = '';
  });

  it('mounts into container with initial hidden state', () => {
    portal = new CreatorPortal({ container });
    portal.mount();

    const overlay = portal.getOverlayElement();
    expect(overlay).not.toBeNull();
    expect(container.contains(overlay)).toBe(true);
    expect(portal.isOpen()).toBe(false);
    expect(overlay?.classList.contains('pointer-events-none')).toBe(true);
  });

  it('updates live character count as user inputs custom wish message', () => {
    portal = new CreatorPortal({ container });
    portal.mount();

    const messageInput = portal.getMessageInput();
    const charCount = container.querySelector('#creator-char-count');
    expect(messageInput).not.toBeNull();
    expect(charCount).not.toBeNull();

    if (messageInput) {
      messageInput.value = 'Short wish';
      messageInput.dispatchEvent(new Event('input'));
      expect(charCount?.textContent).toBe('290 left');
    }
  });

  it('normalizes passcode input to uppercase', () => {
    portal = new CreatorPortal({ container });
    portal.mount();

    const passcodeInput = portal.getPasscodeInput();
    expect(passcodeInput).not.toBeNull();

    if (passcodeInput) {
      passcodeInput.value = 'diy88';
      passcodeInput.dispatchEvent(new Event('input'));
      expect(passcodeInput.value).toBe('DIY88');
    }
  });

  it('displays validation error if recipient is missing', async () => {
    portal = new CreatorPortal({ container });
    portal.mount();

    const form = portal.getFormElement();
    const recipient = portal.getRecipientInput();
    const errorEl = container.querySelector('#creator-error-msg');

    if (recipient) recipient.value = '';
    form?.dispatchEvent(new Event('submit'));

    expect(errorEl?.classList.contains('hidden')).toBe(false);
    expect(errorEl?.textContent).toContain('Please enter recipient name');
  });

  it('displays validation error if passcode is less than 4 characters', async () => {
    portal = new CreatorPortal({ container });
    portal.mount();

    const form = portal.getFormElement();
    const recipient = portal.getRecipientInput();
    const sender = portal.getSenderInput();
    const passcode = portal.getPasscodeInput();
    const errorEl = container.querySelector('#creator-error-msg');

    if (recipient) recipient.value = 'Aarav';
    if (sender) sender.value = 'Pooja';
    if (passcode) passcode.value = '12';

    form?.dispatchEvent(new Event('submit'));

    expect(errorEl?.classList.contains('hidden')).toBe(false);
    expect(errorEl?.textContent).toContain('Passcode must be between 4 and 6 characters');
  });

  it('encrypts wish via GreetingCodec and displays generated share URL and delivery copy', async () => {
    const onWishCreatedMock = vi.fn();
    portal = new CreatorPortal({ container, onWishCreated: onWishCreatedMock });
    portal.mount();

    const recipient = portal.getRecipientInput();
    const sender = portal.getSenderInput();
    const message = portal.getMessageInput();
    const passcode = portal.getPasscodeInput();
    const form = portal.getFormElement();

    if (recipient) recipient.value = 'Priya';
    if (sender) sender.value = 'Rahul';
    if (message) message.value = 'Happy Diwali from our family to yours!';
    if (passcode) passcode.value = 'SHUBH';

    const encryptSpy = vi.spyOn(GreetingCodec, 'encrypt').mockResolvedValue('test-cipher-token-xyz');

    await form?.dispatchEvent(new Event('submit'));

    expect(encryptSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: 'Priya',
        sender: 'Rahul',
        message: 'Happy Diwali from our family to yours!',
        musicTheme: 'track1',
      }),
      'SHUBH'
    );

    const shareUrlInput = portal.getShareUrlInput();
    const messagePreview = portal.getMessagePreviewElement();
    const shareWhatsApp = portal.getShareWhatsAppButton();

    expect(shareUrlInput?.value).toContain('#d=test-cipher-token-xyz');
    expect(messagePreview?.value).toContain('A Special Diwali Surprise for you, Priya!');
    expect(messagePreview?.value).toContain('Rahul has sent you a magical interactive 3D Diwali Diya wish!');
    expect(messagePreview?.value).toContain('🔑 *Your Secret Unlock Passcode:* *SHUBH*');
    expect(shareWhatsApp?.href).toContain('https://wa.me/?text=');

    expect(onWishCreatedMock).toHaveBeenCalledWith(
      expect.stringContaining('#d=test-cipher-token-xyz'),
      'SHUBH'
    );

    // Form should be hidden, result section visible
    expect(form?.classList.contains('hidden')).toBe(true);
    expect(container.querySelector('#creator-result-section')?.classList.contains('hidden')).toBe(false);
  });

  it('triggers clipboard copy and displays feedback badge on Copy buttons', async () => {
    const copySpy = vi.spyOn(clipboardModule, 'copyToClipboard').mockResolvedValue(true);

    portal = new CreatorPortal({ container });
    portal.mount();

    const recipient = portal.getRecipientInput();
    const sender = portal.getSenderInput();
    const passcode = portal.getPasscodeInput();
    const form = portal.getFormElement();

    if (recipient) recipient.value = 'Rohan';
    if (sender) sender.value = 'Maya';
    if (passcode) passcode.value = '2026';

    vi.spyOn(GreetingCodec, 'encrypt').mockResolvedValue('token-123');
    await form?.dispatchEvent(new Event('submit'));

    const copyMsgBtn = portal.getCopyMessageButton();
    const feedback = container.querySelector('#creator-feedback-badge');

    await copyMsgBtn?.dispatchEvent(new Event('click'));
    expect(copySpy).toHaveBeenCalledWith(expect.stringContaining('Rohan'));
    expect(feedback?.classList.contains('hidden')).toBe(false);
    expect(feedback?.textContent).toContain('Delivery message copied!');
  });

  it('responds to #create hash changes by showing/hiding modal', () => {
    portal = new CreatorPortal({ container });
    portal.mount();

    expect(portal.isOpen()).toBe(false);

    window.location.hash = '#create';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(portal.isOpen()).toBe(true);

    window.location.hash = '';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(portal.isOpen()).toBe(false);
  });

  it('resets form when "Create Another" is clicked', async () => {
    portal = new CreatorPortal({ container });
    portal.mount();

    const recipient = portal.getRecipientInput();
    const passcode = portal.getPasscodeInput();
    const form = portal.getFormElement();

    if (recipient) recipient.value = 'Deepak';
    if (passcode) passcode.value = 'DIYA';

    vi.spyOn(GreetingCodec, 'encrypt').mockResolvedValue('token-abc');
    await form?.dispatchEvent(new Event('submit'));

    const resetBtn = container.querySelector('#creator-reset-btn') as HTMLButtonElement;
    resetBtn?.click();

    expect(form?.classList.contains('hidden')).toBe(false);
    expect(recipient?.value).toBe('');
    expect(passcode?.value).toBe('');
    expect(container.querySelector('#creator-result-section')?.classList.contains('hidden')).toBe(true);
  });

  it('allows admin/seller to choose between the 3 official tracks or custom audio with live preview', async () => {
    portal = new CreatorPortal({ container });
    portal.mount();

    expect(portal.getSelectedMusicChoice()).toBe('track1');

    // Switch to track 2
    portal.setSelectedMusicChoice('track2');
    expect(portal.getSelectedMusicChoice()).toBe('track2');

    // Switch to custom
    portal.setSelectedMusicChoice('custom');
    expect(portal.getSelectedMusicChoice()).toBe('custom');
    const customPanel = container.querySelector('#creator-custom-audio-panel');
    expect(customPanel?.classList.contains('hidden')).toBe(false);

    // Audio preview
    const previewBtn = portal.getPreviewButton();
    expect(previewBtn).not.toBeNull();
    previewBtn?.click();

    const previewText = previewBtn?.querySelector('#creator-preview-text');
    expect(previewText?.textContent).toBe('Pause');

    // Pause preview
    previewBtn?.click();
    expect(previewText?.textContent).toBe('Preview Sound');
  });

  it('enforces Admin PIN strictly as 2026 and rejects previous codes like SHUBH2026 or 7777', () => {
    sessionStorage.clear();
    portal = new CreatorPortal({ container, enforcePin: true });
    portal.mount();
    portal.show();

    const authGate = container.querySelector('#creator-auth-gate');
    const form = container.querySelector('#creator-form');
    const pinInput = container.querySelector('#seller-pin-input') as HTMLInputElement;
    const submitBtn = container.querySelector('#seller-pin-submit-btn') as HTMLButtonElement;
    const pinError = container.querySelector('#seller-pin-error') as HTMLElement;

    expect(authGate?.classList.contains('hidden')).toBe(false);
    expect(form?.classList.contains('hidden')).toBe(true);

    // Try old passcodes (SHUBH2026, 7777)
    pinInput.value = 'SHUBH2026';
    submitBtn.click();
    expect(pinError.classList.contains('hidden')).toBe(false);
    expect(pinError.textContent).toContain('Incorrect Admin PIN');
    expect(form?.classList.contains('hidden')).toBe(true);

    pinInput.value = '7777';
    submitBtn.click();
    expect(pinError.classList.contains('hidden')).toBe(false);
    expect(form?.classList.contains('hidden')).toBe(true);

    // Enter strictly valid PIN: 2026
    pinInput.value = '2026';
    submitBtn.click();
    expect(pinError.classList.contains('hidden')).toBe(true);
    expect(authGate?.classList.contains('hidden')).toBe(true);
    expect(form?.classList.contains('hidden')).toBe(false);
    expect(sessionStorage.getItem('diwali_seller_unlocked')).toBe('true');
  });

  it('automatically logs generated wish with secret passcode into OrderHistoryStore and renders it in Admin history', async () => {
    localStorage.clear();
    portal = new CreatorPortal({ container, bypassPin: true });
    portal.mount();
    portal.show();

    const recipient = container.querySelector('#creator-recipient') as HTMLInputElement;
    const sender = container.querySelector('#creator-sender') as HTMLInputElement;
    const message = container.querySelector('#creator-message') as HTMLTextAreaElement;
    const passcode = container.querySelector('#creator-passcode') as HTMLInputElement;
    const form = container.querySelector('#creator-form') as HTMLFormElement;

    recipient.value = 'Meera';
    sender.value = 'Vikram';
    message.value = 'Wishing you joy and light!';
    passcode.value = 'DIVINE';

    vi.spyOn(GreetingCodec, 'encrypt').mockResolvedValue('encrypted-token-xyz');
    await form.dispatchEvent(new Event('submit'));

    const orders = OrderHistoryStore.getOrders();
    expect(orders.length).toBe(1);
    expect(orders[0].recipient).toBe('Meera');
    expect(orders[0].passcode).toBe('DIVINE');

    const historySection = container.querySelector('#creator-history-section');
    expect(historySection).not.toBeNull();
    const countEl = container.querySelector('#creator-history-count');
    expect(countEl?.textContent).toBe('1');

    const historyList = container.querySelector('#creator-history-list');
    expect(historyList?.innerHTML).toContain('Meera');
    expect(historyList?.innerHTML).toContain('DIVINE');
  });

  it('supports exporting orders and passcodes to CSV', () => {
    portal = new CreatorPortal({ container, bypassPin: true });
    portal.mount();

    const downloadSpy = vi.spyOn(OrderHistoryStore, 'downloadCsv').mockImplementation(() => {});
    const exportBtn = container.querySelector('#creator-export-csv-btn') as HTMLButtonElement;
    expect(exportBtn).not.toBeNull();

    exportBtn.click();
    expect(downloadSpy).toHaveBeenCalledTimes(1);
  });

  it('cleans up DOM and listeners on dispose() without leaking memory per ASVS V14', () => {
    portal = new CreatorPortal({ container });
    portal.mount();

    expect(container.children.length).toBeGreaterThan(0);
    portal.dispose();

    expect(container.children.length).toBe(0);
    expect(portal.getOverlayElement()).toBeNull();
  });
});
