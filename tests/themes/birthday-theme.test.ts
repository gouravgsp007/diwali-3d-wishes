import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { BirthdayTheme } from '../../src/themes/birthday/birthday-theme';

describe('BirthdayTheme Implementation', () => {
  let scene: THREE.Scene;
  let theme: BirthdayTheme;

  beforeEach(() => {
    TWEEN.removeAll();
    scene = new THREE.Scene();
    theme = new BirthdayTheme();
  });

  afterEach(() => {
    theme.dispose();
  });

  it('exposes contract properties for Birthday', () => {
    expect(theme.id).toBe('birthday');
    expect(theme.title).toContain('Birthday');
    expect(theme.emoji).toBe('🎂');
    expect(theme.visualConfig.accentColor).toBe('#ec4899');
    expect(theme.getPromptText()).toContain('blow');
    expect(theme.getActionButtonText()).toContain('Blow Out');
  });

  it('initializes cake mesh and balloon system', () => {
    theme.init(scene);

    expect(scene.children).toContain(theme.group);
    expect(theme.getCake()).toBeDefined();
    expect(theme.getBalloons()).toBeDefined();
    expect(theme.getCake()?.group.children.length).toBeGreaterThan(0);
  });

  it('provides interaction target at cake candles', () => {
    theme.init(scene);
    const target = theme.getInteractionTarget();
    expect(target).not.toBeNull();
    expect(target?.object).toBe(theme.getCake()?.group);
  });

  it('triggers blow out action with candle extinguishing', async () => {
    theme.init(scene);
    const promise = theme.triggerAction();
    const now = performance.now();
    TWEEN.update(now + 1500);
    await expect(promise).resolves.toBeUndefined();
  });

  it('releases balloons on celebration start', () => {
    theme.init(scene);
    const balloons = theme.getBalloons();
    expect(balloons).toBeDefined();
    expect(() => theme.onCelebrationStart()).not.toThrow();
  });

  it('disposes resources cleanly', () => {
    theme.init(scene);
    theme.dispose();
    expect(theme.group.children.length).toBe(0);
  });
});
