import * as THREE from 'three';
import type { ThemeVisualConfig, ThemeAudioConfig } from '../experience-theme.interface';

export const NEWYEAR_VISUAL_CONFIG: ThemeVisualConfig = {
  accentColor: '#8b5cf6', // Electric Violet & Champagne Gold
  primaryGradient: 'from-violet-500 via-indigo-400 to-amber-300',
  cardBorderColor: 'border-violet-500/40',
  floatingMotesColor: 0xfde047,
  cameraBasePos: new THREE.Vector3(0, 2.2, 3.8),
  cameraLookAt: new THREE.Vector3(0, 0.65, 0),
  revealedCameraPos: new THREE.Vector3(0, 2.4, 4.3),
  revealedCameraLookAt: new THREE.Vector3(0, -0.80, 0),
};

export const NEWYEAR_AUDIO_CONFIG: ThemeAudioConfig = {
  defaultTrackId: 'ny_celebration',
  actionSfx: 'cork_pop',
  celebrationSfx: 'fireworks_burst',
  tracks: [
    { id: 'ny_celebration', label: 'Happy New Year Countdown & Midnight Party', url: '/audio/track3.mp3' },
    { id: 'ny_auld_lang_syne', label: 'Acoustic Midnight Serenade (Auld Lang Syne)', url: '/audio/track1.mp3' },
  ],
};
