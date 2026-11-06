import * as THREE from 'three';
import type { ThemeVisualConfig, ThemeAudioConfig } from '../experience-theme.interface';

export const WEDDING_VISUAL_CONFIG: ThemeVisualConfig = {
  accentColor: '#e11d48', // Royal Rose Crimson
  primaryGradient: 'from-rose-500 via-pink-400 to-amber-300',
  cardBorderColor: 'border-rose-500/40',
  floatingMotesColor: 0xfb7185,
  cameraBasePos: new THREE.Vector3(0, 2.3, 3.7),
  cameraLookAt: new THREE.Vector3(0, 0.40, 0),
  revealedCameraPos: new THREE.Vector3(0, 2.5, 4.3),
  revealedCameraLookAt: new THREE.Vector3(0, -0.90, 0),
};

export const WEDDING_AUDIO_CONFIG: ThemeAudioConfig = {
  defaultTrackId: 'wedding_shehnai',
  actionSfx: 'temple_bell',
  celebrationSfx: 'wedding_shehnai_crescendo',
  tracks: [
    { id: 'wedding_shehnai', label: 'Royal Shehnai & Sitar (Auspicious Wedding Raag)', url: '/audio/track2.mp3' },
    { id: 'wedding_romantic', label: 'Devotional Flute & Santoor Romance', url: '/audio/track1.mp3' },
  ],
};
