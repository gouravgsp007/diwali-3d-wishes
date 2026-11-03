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
          this.bgmAudio?.pause();
          if (this.bgmAudio) this.bgmAudio.currentTime = 0;
        })
        .catch(() => {});
    } catch (err) {
      console.warn('HTML5 Audio priming skipped:', err);
    }
  }

  /**
   * Begins HTML5 BGM soundtrack playback and smoothly ramps volume 0.0 -> 0.7 over 2.0s per D-05.
   */
  public startBgm(): void {
    if (!this.bgmAudio || this.isMuted) return;

    this.bgmAudio.currentTime = 0;
    this.bgmAudio.volume = 0;
    this.bgmAudio.play().catch(() => {});

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
