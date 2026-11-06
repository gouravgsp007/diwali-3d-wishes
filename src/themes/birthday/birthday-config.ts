import * as THREE from 'three';
import type { ThemeVisualConfig, ThemeAudioConfig } from '../experience-theme.interface';

export const BIRTHDAY_VISUAL_CONFIG: ThemeVisualConfig = {
  accentColor: '#ec4899', // Hot Pink / Rose
  primaryGradient: 'from-pink-500 via-rose-400 to-amber-400',
  cardBorderColor: 'border-pink-500/40',
  floatingMotesColor: 0xf472b6,
  cameraBasePos: new THREE.Vector3(0, 2.2, 3.6),
  cameraLookAt: new THREE.Vector3(0, 0.45, 0),
  revealedCameraPos: new THREE.Vector3(0, 2.4, 4.2),
  revealedCameraLookAt: new THREE.Vector3(0, -0.85, 0),
};

export const BIRTHDAY_AUDIO_CONFIG: ThemeAudioConfig = {
  defaultTrackId: 'bday_acoustic',
  actionSfx: 'whoosh_blowout',
  celebrationSfx: 'party_horn',
  tracks: [
    { id: 'bday_acoustic', label: 'Happy Birthday Melody (Acoustic Acoustic & Bells)', url: '/audio/track1.mp3' },
    { id: 'bday_celebration', label: 'Celebration Cheer & Pop Party', url: '/audio/track3.mp3' },
  ],
};
