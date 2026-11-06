import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { DiwaliTheme } from '../../src/themes/diwali/diwali-theme';

describe('DiwaliTheme Implementation', () => {
  let scene: THREE.Scene;
  let theme: DiwaliTheme;

  beforeEach(() => {
    TWEEN.removeAll();
    scene = new THREE.Scene();
    theme = new DiwaliTheme();
  });

  afterEach(() => {
    theme.dispose();
  });

  it('exposes contract properties for Diwali', () => {
    expect(theme.id).toBe('diwali');
    expect(theme.title).toContain('Deepavali');
    expect(theme.emoji).toBe('🪔');
    expect(theme.visualConfig.accentColor).toBe('#f59e0b');
    expect(theme.getPromptText()).toContain('light');
    expect(theme.getActionButtonText()).toContain('Light');
  });

  it('initializes 3D meshes into internal group and scene', () => {
    theme.init(scene);

    expect(scene.children).toContain(theme.group);
    expect(theme.getDiyaMesh()).toBeDefined();
    expect(theme.getThaliMesh()).toBeDefined();
    expect(theme.getRangoliMesh()).toBeDefined();
    expect(theme.getMarigoldRing()).toBeDefined();
    expect(theme.getLanterns()).toBeDefined();
    expect(theme.getFlameController()).toBeDefined();
  });

  it('provides interaction target at Diya wick', () => {
    theme.init(scene);
    const target = theme.getInteractionTarget();
    expect(target).not.toBeNull();
    expect(target?.object).toBe(theme.getDiyaMesh()?.group);
  });

  it('triggers ignition action successfully', async () => {
    theme.init(scene);
    const promise = theme.triggerAction();
    const now = performance.now();
    TWEEN.update(now + 1000);
    await expect(promise).resolves.toBeUndefined();
  });

  it('updates procedural components during render tick', () => {
    theme.init(scene);
    expect(() => theme.update(0.016, 1.0)).not.toThrow();
  });

  it('disposes resources cleanly', () => {
    theme.init(scene);
    theme.dispose();
    expect(theme.group.children.length).toBe(0);
  });
});
