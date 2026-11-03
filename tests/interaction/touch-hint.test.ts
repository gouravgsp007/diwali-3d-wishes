import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TouchHint } from '../../src/interaction/touch-hint';

describe('TouchHint UI Component', () => {
  let container: HTMLElement;
  let touchHint: TouchHint;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
    touchHint = new TouchHint();
  });

  afterEach(() => {
    touchHint.dispose();
    container.remove();
  });

  it('mounts floating element with id touch-hint-prompt, role status, and aria-live polite per D-03', () => {
    touchHint.mount(container);
    const el = document.getElementById('touch-hint-prompt');

    expect(el).not.toBeNull();
    expect(el?.getAttribute('role')).toBe('status');
    expect(el?.getAttribute('aria-live')).toBe('polite');
    expect(container.contains(el)).toBe(true);
  });

  it('has glassmorphic Tailwind styling matching festive theme per D-03', () => {
    touchHint.mount(container);
    const el = document.getElementById('touch-hint-prompt');

    expect(el?.className).toContain('fixed');
    expect(el?.className).toContain('bottom-12');
    expect(el?.className).toContain('left-1/2');
    expect(el?.className).toContain('-translate-x-1/2');
    expect(el?.className).toContain('z-20');
    expect(el?.className).toContain('pointer-events-none');
    expect(el?.className).toContain('rounded-full');
    expect(el?.className).toContain('bg-amber-950/80');
    expect(el?.className).toContain('backdrop-blur-md');
    expect(el?.className).toContain('border-amber-400/40');
    expect(el?.className).toContain('text-amber-200');
    expect(el?.className).toContain('opacity-0');
    expect(el?.className).toContain('scale-95');
  });

  it('renders static safe markup with pulsing gold dot and prompt text without unsanitized HTML interpolation per D-03, ASVS V5', () => {
    touchHint.mount(container);
    const el = document.getElementById('touch-hint-prompt');

    expect(el?.textContent).toContain('Touch & drag the flame to light your Diya');
    const pingDot = el?.querySelector('.animate-ping');
    expect(pingDot).not.toBeNull();
    expect(pingDot?.className).toContain('bg-amber-400');
  });

  it('does not re-mount or create duplicate elements if mount is called multiple times', () => {
    touchHint.mount(container);
    touchHint.mount(container);

    const elements = document.querySelectorAll('#touch-hint-prompt');
    expect(elements.length).toBe(1);
  });

  it('transitions from opacity-0 scale-95 to opacity-100 scale-100 on show() per D-03', () => {
    touchHint.mount(container);
    const el = document.getElementById('touch-hint-prompt');

    expect(touchHint.isVisible()).toBe(false);
    expect(el?.classList.contains('opacity-0')).toBe(true);

    touchHint.show();
    expect(touchHint.isVisible()).toBe(true);
    expect(el?.classList.contains('opacity-0')).toBe(false);
    expect(el?.classList.contains('scale-95')).toBe(false);
    expect(el?.classList.contains('opacity-100')).toBe(true);
    expect(el?.classList.contains('scale-100')).toBe(true);
  });

  it('transitions back to opacity-0 scale-95 on hide() per D-03', () => {
    touchHint.mount(container);
    const el = document.getElementById('touch-hint-prompt');

    touchHint.show();
    expect(touchHint.isVisible()).toBe(true);

    touchHint.hide();
    expect(touchHint.isVisible()).toBe(false);
    expect(el?.classList.contains('opacity-100')).toBe(false);
    expect(el?.classList.contains('scale-100')).toBe(false);
    expect(el?.classList.contains('opacity-0')).toBe(true);
    expect(el?.classList.contains('scale-95')).toBe(true);
  });

  it('safely handles show() and hide() calls when not mounted', () => {
    expect(() => touchHint.show()).not.toThrow();
    expect(touchHint.isVisible()).toBe(false);
    expect(() => touchHint.hide()).not.toThrow();
    expect(touchHint.isVisible()).toBe(false);
  });

  it('removes element from DOM and resets internal state on dispose() per D-09, ASVS V14', () => {
    touchHint.mount(container);
    touchHint.show();
    expect(document.getElementById('touch-hint-prompt')).not.toBeNull();

    touchHint.dispose();
    expect(document.getElementById('touch-hint-prompt')).toBeNull();
    expect(touchHint.isVisible()).toBe(false);
  });
});
