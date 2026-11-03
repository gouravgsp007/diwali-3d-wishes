import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioToggle } from '../../src/ui/audio-toggle';
import { AudioEngine } from '../../src/audio/audio-engine';

describe('AudioToggle Floating Glassmorphic Control', () => {
  let container: HTMLDivElement;
  let audioEngine: AudioEngine;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    audioEngine = AudioEngine.getInstance();
    audioEngine.dispose(); // Reset singleton state
    audioEngine = AudioEngine.getInstance();
  });

  afterEach(() => {
    audioEngine.dispose();
    container.remove();
  });

  it('mounts button element with id audio-toggle-btn, type button, and aria-label "Toggle Sound" per D-07', () => {
    const toggle = new AudioToggle();
    toggle.mount(container);

    const btn = toggle.getElement();
    expect(btn).not.toBeNull();
    expect(btn?.id).toBe('audio-toggle-btn');
    expect(btn?.getAttribute('type')).toBe('button');
    expect(btn?.getAttribute('aria-label')).toBe('Toggle Sound');
    expect(container.contains(btn!)).toBe(true);
  });

  it('applies floating glassmorphic Tailwind classes per D-07', () => {
    const toggle = new AudioToggle();
    toggle.mount(container);

    const btn = toggle.getElement()!;
    const classList = btn.className;

    expect(classList).toContain('fixed');
    expect(classList).toContain('top-4');
    expect(classList).toContain('right-4');
    expect(classList).toContain('z-20');
    expect(classList).toContain('rounded-full');
    expect(classList).toContain('backdrop-blur-md');
    expect(classList).toContain('border-amber-500/30');
    expect(classList).toContain('text-amber-200');
  });

  it('displays unmuted speaker SVG with acoustic sound waves when AudioEngine is unmuted per D-07', () => {
    const toggle = new AudioToggle();
    toggle.mount(container);

    expect(toggle.isMutedState()).toBe(false);
    const html = toggle.getElement()!.innerHTML;
    expect(html).toContain('M15.54 8.46a5 5 0 010 7.07');
    expect(html).toContain('M19.07 4.93a10 10 0 010 14.14');
  });

  it('clicking button invokes AudioEngine.toggleMute(), updates icon to muted speaker with slash, and calls stopPropagation per D-07', () => {
    const toggle = new AudioToggle();
    toggle.mount(container);

    const btn = toggle.getElement()!;
    const toggleSpy = vi.spyOn(audioEngine, 'toggleMute');

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

    btn.dispatchEvent(clickEvent);

    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(toggleSpy).toHaveBeenCalledTimes(1);
    expect(toggle.isMutedState()).toBe(true);

    const html = btn.innerHTML;
    // Muted icon has line stroke elements
    expect(html).toContain('<line');
    expect(html).not.toContain('M19.07 4.93a10 10 0 010 14.14');
  });

  it('clicking button again un-mutes AudioEngine and restores unmuted speaker icon per D-07', () => {
    const toggle = new AudioToggle();
    toggle.mount(container);

    const btn = toggle.getElement()!;

    // First click: mute
    btn.click();
    expect(toggle.isMutedState()).toBe(true);

    // Second click: unmute
    btn.click();
    expect(toggle.isMutedState()).toBe(false);

    const html = btn.innerHTML;
    expect(html).toContain('M15.54 8.46a5 5 0 010 7.07');
    expect(html).toContain('M19.07 4.93a10 10 0 010 14.14');
  });

  it('calling mount() multiple times is idempotent and does not create duplicate buttons', () => {
    const toggle = new AudioToggle();
    toggle.mount(container);
    toggle.mount(container);

    const buttons = container.querySelectorAll('#audio-toggle-btn');
    expect(buttons.length).toBe(1);
  });

  it('dispose() removes button element from DOM and cleans up references per D-09, ASVS V14', () => {
    const toggle = new AudioToggle();
    toggle.mount(container);

    const btn = toggle.getElement();
    expect(container.contains(btn!)).toBe(true);

    toggle.dispose();
    expect(container.contains(btn!)).toBe(false);
    expect(toggle.getElement()).toBeNull();
  });
});
