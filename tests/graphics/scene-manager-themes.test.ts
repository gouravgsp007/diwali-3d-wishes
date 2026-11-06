import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as TWEEN from '@tweenjs/tween.js';
import { SceneManager } from '../../src/graphics/scene-manager';
import { AppStateMachine } from '../../src/app/state-machine';
import { BirthdayTheme } from '../../src/themes/birthday/birthday-theme';
import { WeddingTheme } from '../../src/themes/wedding/wedding-theme';
import { NewYearTheme } from '../../src/themes/newyear/newyear-theme';

describe('SceneManager Multi-Occasion Themes Integration', () => {
  let container: HTMLElement;
  let fsm: AppStateMachine;
  let sceneManager: SceneManager;

  beforeEach(() => {
    TWEEN.removeAll();
    document.body.innerHTML = '<div id="app" style="width: 800px; height: 600px;"></div>';
    container = document.getElementById('app')!;
    fsm = new AppStateMachine();
  });

  afterEach(() => {
    sceneManager?.dispose();
  });

  it('initializes with Birthday theme when passed directly or resolved from query', () => {
    const birthday = new BirthdayTheme();
    sceneManager = new SceneManager(container, fsm, birthday);
    sceneManager.start();

    expect(sceneManager.getActiveTheme()?.id).toBe('birthday');
    expect(sceneManager.getScene().children.length).toBeGreaterThan(0);
    expect(sceneManager.getTouchHint()).toBeDefined();

    const hintEl = container.querySelector('#touch-hint-prompt');
    expect(hintEl?.textContent).toContain('Blow Out');
  });

  it('triggers Birthday theme action on IGNITING state', async () => {
    const birthday = new BirthdayTheme();
    const actionSpy = vi.spyOn(birthday, 'triggerAction');

    sceneManager = new SceneManager(container, fsm, birthday);
    sceneManager.start();

    fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });
    fsm.transition({
      type: 'UNLOCK_SUCCESS',
      payload: {
        recipient: 'Priya',
        sender: 'Aarav',
        message: 'Happy Birthday!',
        templateId: 'birthday',
        createdAt: Date.now(),
      },
    });
    fsm.transition({ type: 'INTRO_COMPLETE' });
    fsm.transition({ type: 'WICK_TOUCHED' });

    expect(fsm.getState()).toBe('IGNITING');
    expect(actionSpy).toHaveBeenCalledOnce();

    TWEEN.update(performance.now() + 1500);

    await vi.waitFor(() => {
      expect(fsm.getState()).toBe('LIT_CELEBRATION');
    });
  });

  it('dynamically switches active theme via switchTheme()', () => {
    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();
    expect(sceneManager.getActiveTheme()?.id).toBe('diwali');

    const wedding = new WeddingTheme();
    sceneManager.switchTheme(wedding);
    expect(sceneManager.getActiveTheme()?.id).toBe('wedding');

    const ny = new NewYearTheme();
    sceneManager.switchTheme(ny);
    expect(sceneManager.getActiveTheme()?.id).toBe('newyear');
  });

  it('automatically switches theme when decrypted payload has different templateId on UNLOCKED_INTRO', () => {
    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();
    expect(sceneManager.getActiveTheme()?.id).toBe('diwali');

    fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });
    fsm.transition({
      type: 'UNLOCK_SUCCESS',
      payload: {
        recipient: 'Sneha',
        sender: 'Vikram',
        message: 'Happy New Year 2026!',
        templateId: 'newyear',
        createdAt: Date.now(),
      },
    });

    expect(sceneManager.getActiveTheme()?.id).toBe('newyear');
  });
});
