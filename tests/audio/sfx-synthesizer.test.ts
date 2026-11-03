import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SfxSynthesizer } from '../../src/audio/sfx-synthesizer';

describe('SfxSynthesizer Procedural Audio Synthesis', () => {
  let mockGainNodes: Array<{
    gain: {
      value: number;
      setValueAtTime: ReturnType<typeof vi.fn>;
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
      linearRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
  }>;

  let mockFilters: Array<{
    type: string;
    frequency: {
      setValueAtTime: ReturnType<typeof vi.fn>;
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
    Q: {
      setValueAtTime: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
  }>;

  let mockOscillators: Array<{
    type: string;
    frequency: {
      setValueAtTime: ReturnType<typeof vi.fn>;
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  }>;

  let mockBufferSources: Array<{
    buffer: unknown;
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
  }>;

  let mockAudioContext: {
    state: string;
    currentTime: number;
    sampleRate: number;
    destination: Record<string, unknown>;
    resume: ReturnType<typeof vi.fn>;
    createGain: ReturnType<typeof vi.fn>;
    createBuffer: ReturnType<typeof vi.fn>;
    createBufferSource: ReturnType<typeof vi.fn>;
    createBiquadFilter: ReturnType<typeof vi.fn>;
    createOscillator: ReturnType<typeof vi.fn>;
  };

  let mockMasterGain: {
    gain: { value: number };
    connect: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockGainNodes = [];
    mockFilters = [];
    mockOscillators = [];
    mockBufferSources = [];

    mockMasterGain = {
      gain: { value: 1.0 },
      connect: vi.fn(),
    };

    mockAudioContext = {
      state: 'running',
      currentTime: 10.0,
      sampleRate: 44100,
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      createGain: vi.fn().mockImplementation(() => {
        const gainNode = {
          gain: {
            value: 1.0,
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        };
        mockGainNodes.push(gainNode);
        return gainNode;
      }),
      createBuffer: vi.fn().mockImplementation((channels: number, length: number, sampleRate: number) => {
        const data = new Float32Array(length);
        return {
          numberOfChannels: channels,
          length,
          sampleRate,
          getChannelData: vi.fn().mockReturnValue(data),
        };
      }),
      createBufferSource: vi.fn().mockImplementation(() => {
        const src = {
          buffer: null,
          connect: vi.fn(),
          start: vi.fn(),
        };
        mockBufferSources.push(src);
        return src;
      }),
      createBiquadFilter: vi.fn().mockImplementation(() => {
        const filter = {
          type: 'lowpass',
          frequency: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          Q: {
            setValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        };
        mockFilters.push(filter);
        return filter;
      }),
      createOscillator: vi.fn().mockImplementation(() => {
        const osc = {
          type: 'sine',
          frequency: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        };
        mockOscillators.push(osc);
        return osc;
      }),
    };
  });

  it('accepts AudioContext and master GainNode in constructor and implements SfxPlayer interface per D-06', () => {
    const synth = new SfxSynthesizer(mockAudioContext as unknown as AudioContext, mockMasterGain as unknown as GainNode);
    expect(synth).toBeDefined();
    expect(typeof synth.playMatchStrike).toBe('function');
    expect(typeof synth.playFlameCrackle).toBe('function');
  });

  it('playMatchStrike() synthesizes 120ms friction noise burst with bandpass sweeping 2200Hz to 1400Hz (Q = 2.5) per D-06', () => {
    const synth = new SfxSynthesizer(mockAudioContext as unknown as AudioContext, mockMasterGain as unknown as GainNode);
    synth.playMatchStrike();

    // Buffer allocation
    expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, Math.floor(44100 * 0.12), 44100);
    expect(mockBufferSources.length).toBe(1);
    expect(mockBufferSources[0].start).toHaveBeenCalledWith(10.0);

    // Bandpass filter
    expect(mockFilters.length).toBe(1);
    const bandpass = mockFilters[0];
    expect(bandpass.type).toBe('bandpass');
    expect(bandpass.frequency.setValueAtTime).toHaveBeenCalledWith(2200, 10.0);
    expect(bandpass.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(1400, 10.0 + 0.12);
    expect(bandpass.Q.setValueAtTime).toHaveBeenCalledWith(2.5, 10.0);

    // Gain node envelope
    expect(mockGainNodes.length).toBe(1);
    const gainNode = mockGainNodes[0];
    expect(gainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.7, 10.0);
    expect(gainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 10.0 + 0.12);

    // Graph routing: noiseSource -> bandpass -> gain -> masterGain
    expect(mockBufferSources[0].connect).toHaveBeenCalledWith(bandpass);
    expect(bandpass.connect).toHaveBeenCalledWith(gainNode);
    expect(gainNode.connect).toHaveBeenCalledWith(mockMasterGain);
  });

  it('playFlameCrackle() synthesizes warm low-frequency rumble via sine oscillator (120Hz -> 45Hz over 450ms) per D-06', () => {
    const synth = new SfxSynthesizer(mockAudioContext as unknown as AudioContext, mockMasterGain as unknown as GainNode);
    synth.playFlameCrackle();

    // Low rumble oscillator
    expect(mockOscillators.length).toBe(1);
    const osc = mockOscillators[0];
    expect(osc.type).toBe('sine');
    expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(120, 10.0);
    expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(45, 10.0 + 0.45);
    expect(osc.start).toHaveBeenCalledWith(10.0);
    expect(osc.stop).toHaveBeenCalledWith(10.0 + 0.45);

    // Oscillator gain node envelope
    const oscGain = mockGainNodes[0];
    expect(oscGain.gain.setValueAtTime).toHaveBeenCalledWith(0.5, 10.0);
    expect(oscGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 10.0 + 0.45);
    expect(osc.connect).toHaveBeenCalledWith(oscGain);
    expect(oscGain.connect).toHaveBeenCalledWith(mockMasterGain);
  });

  it('playFlameCrackle() synthesizes highpass-filtered sporadic micro-click impulses (highpass 1200Hz over 600ms) per D-06', () => {
    const synth = new SfxSynthesizer(mockAudioContext as unknown as AudioContext, mockMasterGain as unknown as GainNode);
    synth.playFlameCrackle();

    // Highpass filter for micro-clicks
    expect(mockFilters.length).toBe(1);
    const highpass = mockFilters[0];
    expect(highpass.type).toBe('highpass');
    expect(highpass.frequency.setValueAtTime).toHaveBeenCalledWith(1200, 10.0);

    // High frequency buffer
    expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, Math.floor(44100 * 0.60), 44100);
    expect(mockBufferSources.length).toBe(1);
    expect(mockBufferSources[0].start).toHaveBeenCalledWith(10.0);

    // Crackle gain node envelope
    const crackleGain = mockGainNodes[1];
    expect(crackleGain.gain.setValueAtTime).toHaveBeenCalledWith(0.6, 10.0);
    expect(crackleGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, 10.0 + 0.60);

    // Graph routing: crackleSource -> highpass -> crackleGain -> masterGain
    expect(mockBufferSources[0].connect).toHaveBeenCalledWith(highpass);
    expect(highpass.connect).toHaveBeenCalledWith(crackleGain);
    expect(crackleGain.connect).toHaveBeenCalledWith(mockMasterGain);
  });

  it('resumes AudioContext if currently suspended prior to scheduling audio graphs per D-06', () => {
    mockAudioContext.state = 'suspended';
    const synth = new SfxSynthesizer(mockAudioContext as unknown as AudioContext, mockMasterGain as unknown as GainNode);

    synth.playMatchStrike();
    expect(mockAudioContext.resume).toHaveBeenCalledTimes(1);

    synth.playFlameCrackle();
    expect(mockAudioContext.resume).toHaveBeenCalledTimes(2);
  });

  it('clamps all synthesized gain node values to <= 1.0 to eliminate acoustic clipping per ASVS V5 and T-04-04', () => {
    const synth = new SfxSynthesizer(mockAudioContext as unknown as AudioContext, mockMasterGain as unknown as GainNode);
    synth.playMatchStrike();
    synth.playFlameCrackle();

    for (const gainNode of mockGainNodes) {
      const calls = gainNode.gain.setValueAtTime.mock.calls;
      for (const call of calls) {
        const gainVal = call[0] as number;
        expect(gainVal).toBeLessThanOrEqual(1.0);
        expect(gainVal).toBeGreaterThanOrEqual(0.0);
      }
    }
  });
});
