import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeRegistry } from '../../src/themes/theme-registry';
import type { ExperienceTheme } from '../../src/themes/experience-theme.interface';
import * as THREE from 'three';

function createMockTheme(id: any, title: string): ExperienceTheme {
  return {
    id,
    title,
    subtitle: 'Subtitle for ' + title,
    emoji: '🎉',
    visualConfig: {
      accentColor: '#fbbf24',
      primaryGradient: 'from-amber-400 to-amber-600',
      cardBorderColor: 'border-amber-500/40',
      floatingMotesColor: 0xffaa22,
      cameraBasePos: new THREE.Vector3(0, 2.3, 3.8),
      cameraLookAt: new THREE.Vector3(0, 0.25, 0),
      revealedCameraPos: new THREE.Vector3(0, 2.5, 4.4),
      revealedCameraLookAt: new THREE.Vector3(0, -1.0, 0),
    },
    audioConfig: {
      defaultTrackId: 'track1',
      actionSfx: 'action',
      celebrationSfx: 'celebrate',
      tracks: [{ id: 'track1', label: 'Preset', url: '/audio/track1.mp3' }],
    },
    group: new THREE.Group(),
    init: () => {},
    update: () => {},
    triggerAction: async () => {},
    onCelebrationStart: () => {},
    getPromptText: () => 'Tap to celebrate',
    getActionButtonText: () => 'Celebrate',
    getInteractionTarget: () => null,
    dispose: () => {},
  };
}

describe('ThemeRegistry Service', () => {
  let registry: ThemeRegistry;

  beforeEach(() => {
    registry = ThemeRegistry.getInstance();
    registry.clear();
  });

  it('registers and retrieves themes by OccasionId', () => {
    const diwali = createMockTheme('diwali', 'Diwali');
    const birthday = createMockTheme('birthday', 'Birthday');

    registry.register(diwali);
    registry.register(birthday);

    expect(registry.get('diwali')).toBe(diwali);
    expect(registry.get('birthday')).toBe(birthday);
    expect(registry.getAll().length).toBe(2);
  });

  it('resolves theme from templateId with fallback to diwali', () => {
    const diwali = createMockTheme('diwali', 'Diwali');
    const birthday = createMockTheme('birthday', 'Birthday');
    const wedding = createMockTheme('wedding', 'Wedding');
    const newyear = createMockTheme('newyear', 'New Year');

    registry.register(diwali);
    registry.register(birthday);
    registry.register(wedding);
    registry.register(newyear);

    expect(registry.resolve('birthday').id).toBe('birthday');
    expect(registry.resolve('wedding').id).toBe('wedding');
    expect(registry.resolve('newyear').id).toBe('newyear');
    expect(registry.resolve('diya-classic').id).toBe('diwali');
    expect(registry.resolve(undefined, 'bday').id).toBe('birthday');
    expect(registry.resolve(null, null).id).toBe('diwali');
  });
});
