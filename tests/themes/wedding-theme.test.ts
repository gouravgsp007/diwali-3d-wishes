import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { WeddingTheme } from '../../src/themes/wedding/wedding-theme';

describe('WeddingTheme Implementation', () => {
  let scene: THREE.Scene;
  let theme: WeddingTheme;

  beforeEach(() => {
    TWEEN.removeAll();
    scene = new THREE.Scene();
    theme = new WeddingTheme();
  });

  afterEach(() => {
    theme.dispose();
  });

  it('exposes contract properties for Wedding / Engagement', () => {
    expect(theme.id).toBe('wedding');
    expect(theme.title).toContain('Wedding');
    expect(theme.emoji).toBe('💍');
    expect(theme.visualConfig.accentColor).toBe('#e11d48');
    expect(theme.getPromptText()).toContain('clasp');
    expect(theme.getActionButtonText()).toContain('Royal Box');
  });

  it('initializes royal jewelry box and rose petal shower', () => {
    theme.init(scene);

    expect(scene.children).toContain(theme.group);
    expect(theme.getBox()).toBeDefined();
    expect(theme.getPetalShower()).toBeDefined();
    expect(theme.getBox()?.group.children.length).toBeGreaterThan(0);
  });

  it('provides interaction target at jewelry box clasp', () => {
    theme.init(scene);
    const target = theme.getInteractionTarget();
    expect(target).not.toBeNull();
    expect(target?.object).toBe(theme.getBox()?.group);
  });

  it('triggers box opening action smoothly', async () => {
    theme.init(scene);
    const promise = theme.triggerAction();
    const now = performance.now();
    TWEEN.update(now + 1500);
    await expect(promise).resolves.toBeUndefined();
  });

  it('triggers rose petal shower on celebration start', () => {
    theme.init(scene);
    expect(() => theme.onCelebrationStart()).not.toThrow();
  });

  it('disposes resources cleanly', () => {
    theme.init(scene);
    theme.dispose();
    expect(theme.group.children.length).toBe(0);
  });
});
