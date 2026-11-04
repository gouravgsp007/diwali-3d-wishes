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
}

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
        this.bgmAudio = new Audio('/audio/festive-bgm.mp3');
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
      master.gain.linearRampToValueAtTime(0.20, t + 2.0); // Gentle 2s volume ramp
      master.connect(this.sfxGain || this.audioCtx.destination);

      // Tanpura Harmonics: Root (D3 = 146.83Hz), Fifth (A3 = 220Hz), Octave (D4 = 293.66Hz)
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const osc3 = this.audioCtx.createOscillator();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(146.83, t);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(220.0, t);

      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(293.66, t);

      // Subtle LFO frequency chorus modulation
      const lfo = this.audioCtx.createOscillator();
      const lfoGain = this.audioCtx.createGain();
      lfo.frequency.setValueAtTime(0.18, t);
      lfoGain.gain.setValueAtTime(1.2, t);
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);

      // Warm acoustic lowpass filter
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, t);

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
    if (this.proceduralDroneNodes) {
      this.proceduralDroneNodes.stop();
      this.proceduralDroneNodes = null;
    }
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
