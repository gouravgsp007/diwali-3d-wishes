import type { SfxPlayer } from './audio-engine';

/**
 * Procedural Web Audio API sound effect synthesizer for the Diwali experience.
 *
 * Implements:
 * - 120ms friction match-strike noise burst with sweeping bandpass filter (2200Hz -> 1400Hz, Q = 2.5) (D-06)
 * - Flame crackle featuring low-frequency sine rumble (120Hz -> 45Hz over 450ms) and sporadic highpass micro-clicks (highpass 1200Hz over 600ms) (D-06)
 * - AudioContext suspension check and resume handling (D-06)
 * - Gain level clamping <= 1.0 to prevent acoustic clipping and protect hearing (ASVS V5, T-04-04)
 * - Zero external audio file payload (0 KB download, 0ms latency)
 */
export class SfxSynthesizer implements SfxPlayer {
  constructor(
    private readonly audioCtx: AudioContext,
    private readonly masterGain: GainNode
  ) {}

  /**
   * Synthesizes 120ms friction match strike swish with dynamic bandpass filtering.
   */
  public playMatchStrike(): void {
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    const t = this.audioCtx.currentTime;
    const duration = 0.12;
    const sampleRate = this.audioCtx.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = this.audioCtx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate white noise with exponential decay envelope (friction scrape)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp((-i / bufferSize) * 3);
    }

    const noiseSource = this.audioCtx.createBufferSource();
    noiseSource.buffer = buffer;

    // Bandpass filter sweeping downward: 2200Hz -> 1400Hz, Q = 2.5
    const bandpass = this.audioCtx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(2200, t);
    bandpass.frequency.exponentialRampToValueAtTime(1400, t + duration);
    bandpass.Q.setValueAtTime(2.5, t);

    // Gain envelope clamped to <= 1.0 (ASVS V5, T-04-04)
    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    // Audio routing
    noiseSource.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start(t);
  }

  /**
   * Synthesizes dual-component flame crackle: warm low rumble + sporadic micro-clicks.
   */
  public playFlameCrackle(): void {
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    const t = this.audioCtx.currentTime;

    // 1. Warm low rumble (sine 120Hz -> 45Hz over 450ms)
    const osc = this.audioCtx.createOscillator();
    const oscGain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.45);

    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.45);

    // 2. High-frequency sporadic micro-clicks (highpass 1200Hz over 600ms)
    const crackleDuration = 0.6;
    const bufferSize = Math.floor(this.audioCtx.sampleRate * crackleDuration);
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Gentle organic micro-pop bursts (cozy oil lamp crackle instead of harsh spikes)
      if (Math.random() < 0.008 && i + 8 < bufferSize) {
        const amp = (Math.random() * 2 - 1) * 0.35;
        for (let j = 0; j < 8; j++) {
          data[i + j] += amp * Math.exp(-j * 0.6);
        }
        i += 7;
      }
    }

    const crackleSource = this.audioCtx.createBufferSource();
    crackleSource.buffer = buffer;

    const highpass = this.audioCtx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(1200, t);

    const crackleGain = this.audioCtx.createGain();
    crackleGain.gain.setValueAtTime(0.6, t);
    crackleGain.gain.exponentialRampToValueAtTime(0.01, t + crackleDuration);

    crackleSource.connect(highpass);
    highpass.connect(crackleGain);
    crackleGain.connect(this.masterGain);

    crackleSource.start(t);
  }

  /**
   * Synthesizes resonant, spiritual temple bell / chime with natural harmonic decay.
   */
  public playTempleBell(): void {
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    const t = this.audioCtx.currentTime;
    const duration = 2.2;

    // Harmonic frequencies of Indian brass temple bell (Fundamental 880Hz + overtones)
    const freqs = [880, 1760, 2640];
    const gains = [0.4, 0.25, 0.15];

    freqs.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const oscGain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      oscGain.gain.setValueAtTime(gains[idx], t);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + duration);
    });
  }

  /**
   * Synthesizes sparkling sizzle and crackle for handheld Phuljhadi sparkler.
   */
  public playSparklerSizzle(): void {
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    const t = this.audioCtx.currentTime;
    const duration = 0.16;
    const sampleRate = this.audioCtx.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = this.audioCtx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3000, t);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(t);
  }

  /**
   * Synthesizes magical sweet box gift opening chime and velvet lid release sound.
   */
  public playSweetBoxOpen(): void {
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    const t = this.audioCtx.currentTime;

    // 1. Gentle wooden / velvet box lid opening resonance (soft low frequencies)
    const thudOsc = this.audioCtx.createOscillator();
    const thudGain = this.audioCtx.createGain();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(120, t);
    thudOsc.frequency.exponentialRampToValueAtTime(45, t + 0.18);
    thudGain.gain.setValueAtTime(0.22, t);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    thudOsc.connect(thudGain);
    thudGain.connect(this.masterGain);
    thudOsc.onended = () => {
      try {
        thudOsc.disconnect();
        thudGain.disconnect();
      } catch {
        // Disposed
      }
    };
    thudOsc.start(t);
    thudOsc.stop(t + 0.18);

    // 2. Auspicious celestial harp chime (pentatonic celebratory arpeggio: C6, E6, G6, C7)
    const notes = [1046.5, 1318.5, 1567.98, 2093.0];
    notes.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const noteTime = t + 0.04 + idx * 0.055;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.18 / (idx + 1), noteTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.85);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Disposed
        }
      };

      osc.start(noteTime);
      osc.stop(noteTime + 0.9);
    });
  }
}
