import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { NewYearTheme } from '../../src/themes/newyear/newyear-theme';

describe('NewYearTheme Implementation', () => {
  let scene: THREE.Scene;
  let theme: NewYearTheme;

  beforeEach(() => {
    TWEEN.removeAll();
    scene = new THREE.Scene();
    theme = new NewYearTheme();
  });

  afterEach(() => {
    theme.dispose();
  });

  it('exposes contract properties for Happy New Year', () => {
    expect(theme.id).toBe('newyear');
    expect(theme.title).toContain('New Year');
    expect(theme.emoji).toBe('🥂');
    expect(theme.visualConfig.accentColor).toBe('#8b5cf6');
    expect(theme.getPromptText()).toContain('champagne');
    expect(theme.getActionButtonText()).toContain('Pop');
  });

  it('initializes clock champagne mesh and foam system', () => {
    theme.init(scene);

    expect(scene.children).toContain(theme.group);
    expect(theme.getClockChampagne()).toBeDefined();
    expect(theme.getFoam()).toBeDefined();
    expect(theme.getClockChampagne()?.group.children.length).toBeGreaterThan(0);
  });

  it('provides interaction target at champagne cork', () => {
    theme.init(scene);
    const target = theme.getInteractionTarget();
    expect(target).not.toBeNull();
    expect(target?.object).toBe(theme.getClockChampagne()?.group);
  });

  it('triggers cork popping and bubbly foam action', async () => {
    theme.init(scene);
    const promise = theme.triggerAction();
    const now = performance.now();
    TWEEN.update(now + 1500);
    await expect(promise).resolves.toBeUndefined();
  });

  it('triggers foam burst on celebration start', () => {
    theme.init(scene);
    expect(() => theme.onCelebrationStart()).not.toThrow();
  });

  it('disposes resources cleanly', () => {
    theme.init(scene);
    theme.dispose();
    expect(theme.group.children.length).toBe(0);
  });
});
