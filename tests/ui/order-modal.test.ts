import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OrderModal } from '../../src/ui/order-modal';

describe('OrderModal UI Component', () => {
  let container: HTMLElement;
  let orderModal: OrderModal;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
    window.location.hash = '';
  });

  afterEach(() => {
    orderModal?.dispose();
    container.remove();
    document.body.innerHTML = '';
    window.location.hash = '';
    vi.restoreAllMocks();
  });

  it('mounts order modal overlay (#order-modal-overlay) into container as hidden initially', () => {
    orderModal = new OrderModal(container, 'thecodeverse09');
    orderModal.mount();

    const overlay = document.getElementById('order-modal-overlay');
    expect(overlay).not.toBeNull();
    expect(container.contains(overlay)).toBe(true);
    expect(overlay?.classList.contains('hidden')).toBe(true);
    expect(overlay?.classList.contains('opacity-0')).toBe(true);
    expect(overlay?.classList.contains('pointer-events-none')).toBe(true);
  });

  it('configures direct Instagram DM link and profile link for thecodeverse09', () => {
    orderModal = new OrderModal(container, 'thecodeverse09');
    orderModal.mount();

    const dmBtn = document.getElementById('order-instagram-btn') as HTMLAnchorElement | null;
    const profileLink = document.getElementById('order-instagram-profile-link') as HTMLAnchorElement | null;

    expect(dmBtn).not.toBeNull();
    expect(dmBtn?.href).toContain('thecodeverse09');
    expect(dmBtn?.textContent).toContain('@thecodeverse09');

    expect(profileLink).not.toBeNull();
    expect(profileLink?.href).toContain('thecodeverse09');
    expect(profileLink?.textContent).toContain('thecodeverse09');
  });

  it('transitions from hidden to visible on show() and back on hide()', () => {
    orderModal = new OrderModal(container, 'thecodeverse09');
    orderModal.mount();

    const overlay = document.getElementById('order-modal-overlay');
    expect(orderModal.isOpen()).toBe(false);

    orderModal.show();
    expect(orderModal.isOpen()).toBe(true);
    expect(overlay?.classList.contains('hidden')).toBe(false);
    expect(overlay?.classList.contains('opacity-100')).toBe(true);

    orderModal.hide();
    expect(orderModal.isOpen()).toBe(false);
    expect(overlay?.classList.contains('hidden')).toBe(true);
    expect(overlay?.classList.contains('opacity-0')).toBe(true);
  });

  it('updates Instagram handle dynamically via setInstagramHandle()', () => {
    orderModal = new OrderModal(container, 'thecodeverse09');
    orderModal.mount();

    orderModal.setInstagramHandle('@custom_seller');

    const dmBtn = document.getElementById('order-instagram-btn') as HTMLAnchorElement | null;
    const profileLink = document.getElementById('order-instagram-profile-link') as HTMLAnchorElement | null;

    expect(dmBtn?.href).toBe('https://ig.me/m/custom_seller');
    expect(dmBtn?.textContent).toContain('@custom_seller');
    expect(profileLink?.href).toBe('https://www.instagram.com/custom_seller');
  });

  it('opens on hashchange to #order', () => {
    orderModal = new OrderModal(container, 'thecodeverse09');
    orderModal.mount();

    expect(orderModal.isOpen()).toBe(false);

    window.location.hash = '#order';
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(orderModal.isOpen()).toBe(true);
  });

  it('removes overlay element and event listener on dispose()', () => {
    orderModal = new OrderModal(container, 'thecodeverse09');
    orderModal.mount();

    expect(document.getElementById('order-modal-overlay')).not.toBeNull();

    orderModal.dispose();
    expect(document.getElementById('order-modal-overlay')).toBeNull();
  });

  it('renders the festive offer pricing of ₹49 with original ₹99 struck through', () => {
    orderModal = new OrderModal(container, 'thecodeverse09');
    orderModal.mount();

    const overlay = document.getElementById('order-modal-overlay');
    expect(overlay?.textContent).toContain('₹49');
    expect(overlay?.textContent).toContain('₹99');
    expect(overlay?.innerHTML).toContain('line-through');
  });
});
