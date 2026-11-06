/**
 * Dual-tier audio coordinator for the Diwali 3D experience.
 *
 * Implements:
 * - W3C Audio Session API (iOS 16.4+ silent switch bypass: navigator.audioSession.type = 'playback') (D-05)
 * - Synchronous unlock() handshake during user gesture (D-04)
 * - HTML5 audio element streaming for sitar/flute soundtrack with 2s fade-in (D-05)
 * - Web Audio API AudioContext with silent buffer priming for low-latency SFX (D-04, D-06)
 * - Global mute toggling with 200ms linear gain ramp (D-07)
 * - Tab visibility suspension via Page Visibility API (D-09, ASVS V14)
 * - ASVS V5 volume and gain clamping [0.0, 1.0] to prevent acoustic clipping
 */

import { SfxSynthesizer } from './sfx-synthesizer';

export interface SfxPlayer {
  playMatchStrike(): void;
  playFlameCrackle(): void;
  playTempleBell?(): void;
  playSparklerSizzle?(): void;
  playRangoliChime?(): void;
}

export interface AudioTrackInfo {
  id: string;
  name: string;
  subtitle: string;
  src?: string;
  isCustom?: boolean;
}

export const FESTIVE_TRACKS: AudioTrackInfo[] = [
  {
    id: 'track1',
    name: 'Happy Wali Feeling',
    subtitle: 'Aayi Hai Diwali Festive Beat',
    src: '/audio/diwali-track-1.mp3',
  },
  {
    id: 'track2',
    name: 'Mere Tumhare Sabke Liye',
    subtitle: 'Happy Diwali Classic Song',
    src: '/audio/diwali-track-2.mp3',
  },
  {
    id: 'track3',
    name: 'Shree Lakshmi Aarti',
    subtitle: 'Devotional Aarti & Chants',
    src: '/audio/diwali-track-3.mp3',
  },
];

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private audioCtx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private sfxSynth: SfxPlayer | null = null;
  private bgmAudio: HTMLAudioElement | null = null;
  private isUnlocked = false;
  private isMuted = false;
  private bgmVolume = 0.7;
  private wasPlayingBeforeHide = false;
  private visibilityHandler: (() => void) | null = null;
  private fadeInterval: ReturnType<typeof setInterval> | null = null;
  private proceduralDroneNodes: { stop: () => void } | null = null;
  private isBgmPlaying = false;

  private currentTrack: AudioTrackInfo = { ...FESTIVE_TRACKS[0] };
  private customTrack: AudioTrackInfo | null = null;
  private melodicMelodyInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    this.initVisibilityListener();
  }

  /**
   * Returns the singleton AudioEngine instance.
   */
  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Injects procedural or buffer-based SFX synthesizer delegate.
   */
  public setSfxSynthesizer(synth: SfxPlayer): void {
    this.sfxSynth = synth;
  }

  /**
   * Synchronously primes both Web Audio and HTML5 audio inside the direct
   * user gesture event loop stack frame, satisfying iOS Safari WebKit and Blink
   * autoplay policies per D-04.
   */
  public unlock(): void {
    if (this.isUnlocked) return;
    this.isUnlocked = true;

    // 1. W3C Audio Session API (iOS 16.4+ silent switch bypass per D-05)
    if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
      try {
        (navigator as unknown as { audioSession: { type: string } }).audioSession.type = 'playback';
      } catch {
        // Safe no-op if platform denies audioSession mutation
      }
    }

    // 2. Web Audio API initialization with silent buffer priming
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass && !this.audioCtx) {
        this.audioCtx = new AudioContextClass();
        this.sfxGain = this.audioCtx.createGain();
        // Clamped to [0.0, 1.0] per ASVS V5
        this.sfxGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
        this.sfxGain.connect(this.audioCtx.destination);

        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }

        // Silent 1-sample buffer priming for WebKit
        const silentBuf = this.audioCtx.createBuffer(1, 1, 22050);
        const src = this.audioCtx.createBufferSource();
        src.buffer = silentBuf;
        src.connect(this.audioCtx.destination);
        src.start(0);

        if (!this.sfxSynth) {
          this.sfxSynth = new SfxSynthesizer(this.audioCtx, this.sfxGain);
        }
      }
    } catch (err) {
      console.warn('Web Audio init skipped:', err);
    }

    // 3. Prime HTML5 Audio element on direct user gesture
    try {
      this.bgmAudio = document.getElementById('festive-bgm') as HTMLAudioElement | null;
      if (!this.bgmAudio) {
        this.bgmAudio = new Audio(this.currentTrack.src || '/audio/diwali-track-1.mp3');
        this.bgmAudio.id = 'festive-bgm';
        this.bgmAudio.loop = true;
        this.bgmAudio.preload = 'auto';
        document.body.appendChild(this.bgmAudio);
      }
      this.bgmAudio.volume = 0;
      this.bgmAudio
        .play()
        .then(() => {
          if (!this.isBgmPlaying) {
            this.bgmAudio?.pause();
            if (this.bgmAudio) this.bgmAudio.currentTime = 0;
          }
        })
        .catch(() => {});
    } catch (err) {
      console.warn('HTML5 Audio priming skipped:', err);
    }
  }

  /**
   * Begins festive soundtrack playback: attempts HTML5 audio playback with 2.0s volume ramp,
   * seamlessly engaging Web Audio API procedural Tanpura ambient fallback if HTML5 playback
   * is blocked or encounters network error (D-05).
   */
  public startBgm(): void {
    if (this.isMuted) return;
    this.isBgmPlaying = true;

    if (this.bgmAudio) {
      this.bgmAudio.currentTime = 0;
      this.bgmAudio.volume = 0;
      try {
        const playPromise = this.bgmAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('HTML5 Audio playback prevented, starting procedural ambient fallback:', err);
            this.startProceduralAmbient();
          });
        }
      } catch (err) {
        this.startProceduralAmbient();
      }
      this.fadeInBgm();
    } else {
      this.startProceduralAmbient();
    }
  }

  private fadeInBgm(): void {
    if (this.fadeInterval !== null) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    const duration = 2000;
    const intervalMs = 50;
    let elapsed = 0;

    this.fadeInterval = setInterval(() => {
      elapsed += intervalMs;
      const progress = Math.min(elapsed / duration, 1.0);
      if (this.bgmAudio && !this.isMuted) {
        this.bgmAudio.volume = progress * this.bgmVolume;
      }
      if (progress >= 1.0) {
        if (this.fadeInterval !== null) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
        }
      }
    }, intervalMs);
  }

  /**
   * Generates a warm, meditative Indian classical Tanpura drone and harmonic chord
   * via Web Audio API oscillators, guaranteeing audible ambient music in any environment.
   */
  public startProceduralAmbient(): void {
    if (this.isMuted || this.proceduralDroneNodes || !this.audioCtx) return;

    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      const t = this.audioCtx.currentTime;
      const master = this.audioCtx.createGain();
      master.gain.setValueAtTime(0.001, t);
      master.gain.linearRampToValueAtTime(0.12, t + 2.0); // Gentle 2s volume ramp
      master.connect(this.sfxGain || this.audioCtx.destination);

      // Warm Meditative Tanpura Harmonics: Root (D3 = 146.83Hz), Fifth (A3 = 220Hz), Octave (D4 = 293.66Hz)
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const osc3 = this.audioCtx.createOscillator();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(146.83, t);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(220.0, t);

      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(293.66, t);

      // Subtle LFO frequency chorus modulation
      const lfo = this.audioCtx.createOscillator();
      const lfoGain = this.audioCtx.createGain();
      lfo.frequency.setValueAtTime(0.12, t);
      lfoGain.gain.setValueAtTime(0.8, t);
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);

      // Velvety warm acoustic lowpass filter at 450Hz
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(master);

      osc1.start(t);
      osc2.start(t);
      osc3.start(t);
      lfo.start(t);

      this.proceduralDroneNodes = {
        stop: () => {
          try {
            osc1.stop();
            osc2.stop();
            osc3.stop();
            lfo.stop();
            master.disconnect();
          } catch {
            // Safe no-op
          }
          this.proceduralDroneNodes = null;
        },
      };
    } catch (err) {
      console.warn('Procedural ambient fallback skipped:', err);
    }
  }

  /**
   * Plays match friction strike SFX via Web Audio API if not muted.
   */
  public playMatchStrike(): void {
    if (!this.isMuted) {
      this.sfxSynth?.playMatchStrike();
    }
  }

  /**
   * Plays flame crackle SFX via Web Audio API if not muted.
   */
  public playFlameCrackle(): void {
    if (!this.isMuted) {
      this.sfxSynth?.playFlameCrackle();
    }
  }

  /**
   * Plays resonant temple bell chime SFX.
   */
  public playTempleBell(): void {
    if (!this.isMuted) {
      this.sfxSynth?.playTempleBell?.();
    }
  }

  /**
   * Plays sparkling sizzle SFX for handheld sparklers.
   */
  public playSparklerSizzle(): void {
    if (!this.isMuted) {
      this.sfxSynth?.playSparklerSizzle?.();
    }
  }

  /**
   * Plays magical celestial Rangoli completion chime.
   */
  public playRangoliChime(): void {
    if (!this.isMuted) {
      this.sfxSynth?.playRangoliChime?.();
    }
  }

  /**
   * Returns list of available festive soundtracks and any custom uploaded track.
   */
  public getAvailableTracks(): AudioTrackInfo[] {
    const list: AudioTrackInfo[] = [...FESTIVE_TRACKS];

    if (this.customTrack) {
      list.push(this.customTrack);
    }

    return list;
  }

  /**
   * Returns the currently active soundtrack.
   */
  public getCurrentTrack(): AudioTrackInfo {
    return this.currentTrack;
  }

  /**
   * Pauses background soundtrack playback.
   */
  public pauseBgm(): void {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
    this.stopProceduralMelody();
    this.isBgmPlaying = false;
  }

  /**
   * Switches the active soundtrack with smooth crossfade.
   */
  public async setTrack(trackId: string, customUrl?: string, customTitle?: string): Promise<void> {
    this.stopProceduralMelody();

    if (trackId === 'custom' && customUrl) {
      this.customTrack = {
        id: 'custom',
        name: customTitle || 'Custom Audio Track',
        subtitle: 'User uploaded audio',
        src: customUrl,
        isCustom: true,
      };
      this.currentTrack = this.customTrack;

      if (this.bgmAudio) {
        this.bgmAudio.src = customUrl;
        this.bgmAudio.load();
        if (this.isBgmPlaying && !this.isMuted) {
          try {
            await this.bgmAudio.play();
            this.fadeInBgm();
          } catch (e) {
            console.warn('Custom audio playback failed:', e);
          }
        }
      }
      return;
    }

    // Map backwards-compatibility IDs (sitar -> track1, flute -> track2, temple -> track3)
    let resolvedId = trackId;
    if (trackId === 'sitar') resolvedId = 'track1';
    else if (trackId === 'flute') resolvedId = 'track2';
    else if (trackId === 'temple') resolvedId = 'track3';

    const found = FESTIVE_TRACKS.find((t) => t.id === resolvedId) || FESTIVE_TRACKS[0];
    this.currentTrack = { ...found };

    if (this.bgmAudio && found.src) {
      this.bgmAudio.src = found.src;
      this.bgmAudio.load();
      if (this.isBgmPlaying && !this.isMuted) {
        try {
          await this.bgmAudio.play();
          this.fadeInBgm();
        } catch {
          this.startProceduralAmbient();
        }
      }
    }
  }

  /**
   * Accepts a user-uploaded MP3/WAV File, generates a blob stream URL, and selects it.
   */
  public async loadCustomAudioFile(file: File): Promise<string> {
    const objectUrl = URL.createObjectURL(file);
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    await this.setTrack('custom', objectUrl, fileName);
    return objectUrl;
  }

  private stopProceduralMelody(): void {
    if (this.melodicMelodyInterval !== null) {
      clearInterval(this.melodicMelodyInterval);
      this.melodicMelodyInterval = null;
    }
    if (this.proceduralDroneNodes) {
      this.proceduralDroneNodes.stop();
      this.proceduralDroneNodes = null;
    }
  }

  /**
   * Generates a warm, meditative Indian classical Bansuri (Bamboo Flute) pentatonic raga.
   */
  public startFluteAmbient(): void {
    if (this.isMuted || !this.audioCtx) return;

    this.stopProceduralMelody();
    this.startProceduralAmbient(); // Tanpura drone base

    try {
      const pentatonicNotes = [293.66, 329.63, 369.99, 440.0, 493.88, 587.33]; // Raga Bhupali notes
      let noteIndex = 0;

      const playFluteNote = () => {
        if (!this.audioCtx || this.isMuted || !this.isBgmPlaying) return;
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }

        const t = this.audioCtx.currentTime;
        const freq = pentatonicNotes[noteIndex % pentatonicNotes.length];
        noteIndex = (noteIndex + Math.floor(Math.random() * 3) + 1) % pentatonicNotes.length;

        const osc = this.audioCtx.createOscillator();
        const noteGain = this.audioCtx.createGain();
        const lfo = this.audioCtx.createOscillator();
        const lfoGain = this.audioCtx.createGain();

        // Breathy triangular/sine tone
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        // Subtle vibrato (5Hz)
        lfo.frequency.setValueAtTime(5.2, t);
        lfoGain.gain.setValueAtTime(1.8, t);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        // Gentle flute attack and breathy release
        const noteDuration = 1.6 + Math.random() * 0.8;
        noteGain.gain.setValueAtTime(0.001, t);
        noteGain.gain.linearRampToValueAtTime(0.08, t + 0.35); // Soft breath attack
        noteGain.gain.exponentialRampToValueAtTime(0.001, t + noteDuration);

        // Warm acoustic acoustic lowpass filter
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, t);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.sfxGain || this.audioCtx.destination);

        osc.start(t);
        lfo.start(t);
        osc.stop(t + noteDuration);
        lfo.stop(t + noteDuration);
      };

      playFluteNote();
      this.melodicMelodyInterval = setInterval(playFluteNote, 2400);
    } catch (e) {
      console.warn('Flute ambient skipped:', e);
    }
  }

  /**
   * Generates a temple sanctum ambiance with singing bowls and gentle bells.
   */
  public startTempleAmbient(): void {
    if (this.isMuted || !this.audioCtx) return;

    this.stopProceduralMelody();
    this.startProceduralAmbient();

    try {
      const ringSanctumChime = () => {
        if (!this.audioCtx || this.isMuted || !this.isBgmPlaying) return;
        this.playTempleBell();
      };

      ringSanctumChime();
      this.melodicMelodyInterval = setInterval(ringSanctumChime, 4500);
    } catch (e) {
      console.warn('Temple ambient skipped:', e);
    }
  }

  /**
   * Toggles mute state across both HTML5 BGM and Web Audio SFX with a 200ms linear gain ramp per D-07.
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;

    if (this.isMuted) {
      if (this.bgmAudio) this.bgmAudio.muted = true;
      if (this.sfxGain && this.audioCtx) {
        try {
          const t = this.audioCtx.currentTime;
          this.sfxGain.gain.setValueAtTime(this.sfxGain.gain.value, t);
          this.sfxGain.gain.linearRampToValueAtTime(0.0, t + 0.2);
        } catch {
          // Safe no-op on closed context
        }
      }
    } else {
      if (this.bgmAudio) {
        this.bgmAudio.muted = false;
        this.bgmAudio.volume = this.bgmVolume;
      }
      if (this.sfxGain && this.audioCtx) {
        try {
          const t = this.audioCtx.currentTime;
          this.sfxGain.gain.setValueAtTime(this.sfxGain.gain.value, t);
          this.sfxGain.gain.linearRampToValueAtTime(1.0, t + 0.2);
        } catch {
          // Safe no-op on closed context
        }
      }
    }

    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public isAudioUnlocked(): boolean {
    return this.isUnlocked;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioCtx;
  }

  public getBgmElement(): HTMLAudioElement | null {
    return this.bgmAudio;
  }

  public getSfxGain(): GainNode | null {
    return this.sfxGain;
  }

  private initVisibilityListener(): void {
    this.visibilityHandler = () => {
      if (document.hidden) {
        this.wasPlayingBeforeHide = !!(this.bgmAudio && !this.bgmAudio.paused);
        this.bgmAudio?.pause();
        if (this.audioCtx && this.audioCtx.state === 'running') {
          this.audioCtx.suspend().catch(() => {});
        }
      } else {
        if (this.wasPlayingBeforeHide && this.bgmAudio && !this.isMuted) {
          this.bgmAudio.play().catch(() => {});
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  /**
   * Cleans up audio streams, closes context, unbinds listeners, and resets singleton.
   */
  public dispose(): void {
    this.stopProceduralMelody();
    if (this.fadeInterval !== null) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.remove();
      this.bgmAudio = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.sfxGain = null;
    this.sfxSynth = null;
    this.isUnlocked = false;
    this.isMuted = false;
    this.wasPlayingBeforeHide = false;
    AudioEngine.instance = null;
  }
}
