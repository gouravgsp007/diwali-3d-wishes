import * as THREE from 'three';
import type { ThemeVisualConfig, ThemeAudioConfig } from '../experience-theme.interface';

export const DIWALI_VISUAL_CONFIG: ThemeVisualConfig = {
  accentColor: '#f59e0b',
  primaryGradient: 'from-amber-400 via-yellow-300 to-amber-500',
  cardBorderColor: 'border-amber-500/40',
  floatingMotesColor: 0xffaa22,
  cameraBasePos: new THREE.Vector3(0, 2.0, 3.2),
  cameraLookAt: new THREE.Vector3(0, 0.65, 0),
  revealedCameraPos: new THREE.Vector3(0, 2.5, 4.4),
  revealedCameraLookAt: new THREE.Vector3(0, -1.0, 0),
};

export const DIWALI_AUDIO_CONFIG: ThemeAudioConfig = {
  defaultTrackId: 'track1',
  actionSfx: 'match_strike',
  celebrationSfx: 'temple_bell',
  tracks: [
    { id: 'track1', label: 'Festive Sitar & Flute (Classic)', url: '/audio/track1.mp3' },
    { id: 'track2', label: 'Devotional Raag (Deepavali Aarti)', url: '/audio/track2.mp3' },
    { id: 'track3', label: 'Joyous Celebration Beats (Dhol & Shehnai)', url: '/audio/track3.mp3' },
  ],
};
