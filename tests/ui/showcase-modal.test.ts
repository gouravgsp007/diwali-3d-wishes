import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ShowcaseModal } from '../../src/ui/showcase-modal';

describe('ShowcaseModal UI Controller', () => {
  let container: HTMLElement;
  let modal: ShowcaseModal;

  beforeEach(() => {
    vi.restoreAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    window.location.hash = '';
  });

  afterEach(() => {
    modal?.dispose();
    container?.remove();
    window.location.hash = '';
  });

  it('mounts into container and defaults to hidden state', () => {
    modal = new ShowcaseModal({ container });
    modal.mount();

    const overlay = modal.getOverlayElement();
    expect(overlay).not.toBeNull();
    expect(modal.isOpen()).toBe(false);
    expect(overlay?.classList.contains('pointer-events-none')).toBe(true);
  });

  it('opens and closes via show() and hide()', () => {
    modal = new ShowcaseModal({ container });
    modal.mount();

    modal.show();
    expect(modal.isOpen()).toBe(true);
    expect(modal.getOverlayElement()?.classList.contains('opacity-100')).toBe(true);

    modal.hide();
    expect(modal.isOpen()).toBe(false);
    expect(modal.getOverlayElement()?.classList.contains('opacity-0')).toBe(true);
  });

  it('fires onSelectOccasion callback when clicking an occasion preview card', () => {
    const onSelectSpy = vi.fn();
    modal = new ShowcaseModal({ container, onSelectOccasion: onSelectSpy });
    modal.mount();

    modal.show();

    const birthdayBtn = container.querySelector('[data-preview-occasion="birthday"]') as HTMLElement;
    expect(birthdayBtn).not.toBeNull();

    birthdayBtn.click();
    expect(onSelectSpy).toHaveBeenCalledWith('birthday');
    expect(modal.isOpen()).toBe(false);
  });

  it('listens for #showcase hash change', () => {
    modal = new ShowcaseModal({ container });
    modal.mount();

    window.location.hash = '#showcase';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(modal.isOpen()).toBe(true);
  });

  it('contains Instagram DM order button with correct link', () => {
    modal = new ShowcaseModal({ container, instagramHandle: 'thecodeverse09' });
    modal.mount();

    const orderBtn = container.querySelector('#showcase-order-btn') as HTMLAnchorElement;
    expect(orderBtn).not.toBeNull();
    expect(orderBtn.href).toContain('instagram.com/thecodeverse09');
  });

  it('displays the festive offer pricing of ₹49 with original ₹99 struck through', () => {
    modal = new ShowcaseModal({ container });
    modal.mount();

    const overlay = modal.getOverlayElement();
    expect(overlay?.textContent).toContain('₹49');
    expect(overlay?.textContent).toContain('₹99');
    expect(overlay?.innerHTML).toContain('line-through');
  });
});
