import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioEngine } from '../../src/audio/audio-engine';

describe('AudioEngine Dual-Tier Foundation', () => {
  let mockAudioContext: {
    state: string;
    currentTime: number;
    destination: Record<string, unknown>;
    resume: ReturnType<typeof vi.fn>;
    suspend: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    createGain: ReturnType<typeof vi.fn>;
    createBuffer: ReturnType<typeof vi.fn>;
    createBufferSource: ReturnType<typeof vi.fn>;
  };
  let mockGainNode: {
    gain: {
      value: number;
      setValueAtTime: ReturnType<typeof vi.fn>;
      linearRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
  };
  let mockSourceNode: {
    buffer: unknown;
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Reset AudioEngine singleton before each test
    const existing = AudioEngine.getInstance();
    existing.dispose();

    mockGainNode = {
      gain: {
        value: 1.0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    mockSourceNode = {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
    };

    mockAudioContext = {
      state: 'suspended',
      currentTime: 0,
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      suspend: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      createGain: vi.fn().mockReturnValue(mockGainNode),
      createBuffer: vi.fn().mockReturnValue({}),
      createBufferSource: vi.fn().mockReturnValue(mockSourceNode),
    };

    // Mock window.AudioContext
    vi.stubGlobal('AudioContext', vi.fn().mockImplementation(() => mockAudioContext));

    // Mock HTMLMediaElement.prototype.play and pause
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLAudioElement) {
      return Promise.resolve();
    });
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (this: HTMLAudioElement) {
      // Mock pause
    });
  });

  afterEach(() => {
    const engine = AudioEngine.getInstance();
    engine.dispose();
    document.getElementById('festive-bgm')?.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('getInstance() returns identical singleton instance across multiple calls per D-04', () => {
    const instance1 = AudioEngine.getInstance();
    const instance2 = AudioEngine.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('unlock() executes synchronously, sets audioSession.type = playback, resumes AudioContext, and primes silent buffer per D-04, D-05', () => {
    const audioSessionMock = { type: 'ambient' };
    Object.defineProperty(navigator, 'audioSession', {
      value: audioSessionMock,
      configurable: true,
      writable: true,
    });

    const engine = AudioEngine.getInstance();
    expect(engine.isAudioUnlocked()).toBe(false);

    engine.unlock();

    expect(engine.isAudioUnlocked()).toBe(true);
    // iOS 16.4+ silent switch bypass intent
    expect(audioSessionMock.type).toBe('playback');

    // Web Audio primed
    expect(mockAudioContext.resume).toHaveBeenCalled();
    expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, 1, 22050);
    expect(mockSourceNode.start).toHaveBeenCalledWith(0);
    expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);

    // HTML5 Audio element primed
    const bgm = document.getElementById('festive-bgm') as HTMLAudioElement;
    expect(bgm).not.toBeNull();
    expect(bgm.loop).toBe(true);
  });

  it('calling unlock() multiple times is idempotent and does not recreate AudioContext or BGM elements', () => {
    const engine = AudioEngine.getInstance();
    engine.unlock();
    const ctx1 = engine.getAudioContext();
    const bgm1 = engine.getBgmElement();

    engine.unlock();
    expect(engine.getAudioContext()).toBe(ctx1);
    expect(engine.getBgmElement()).toBe(bgm1);

    const bgmElements = document.querySelectorAll('#festive-bgm');
    expect(bgmElements.length).toBe(1);
  });

  it('startBgm() starts playback and ramps volume from 0.0 to 0.7 over 2.0s upon UNLOCKED_INTRO per D-05', () => {
    vi.useFakeTimers();

    const engine = AudioEngine.getInstance();
    engine.unlock();

    const bgm = engine.getBgmElement()!;
    const playSpy = vi.spyOn(bgm, 'play');

    engine.startBgm();

    expect(playSpy).toHaveBeenCalled();
    expect(bgm.volume).toBeCloseTo(0.0, 2);

    // Advance 1000ms (halfway)
    vi.advanceTimersByTime(1000);
    expect(bgm.volume).toBeGreaterThan(0.2);
    expect(bgm.volume).toBeLessThan(0.6);

    // Advance remaining 1000ms (complete 2000ms)
    vi.advanceTimersByTime(1000);
    expect(bgm.volume).toBeCloseTo(0.7, 2);

    vi.useRealTimers();
  });

  it('toggleMute() toggles isMuted state, mutes/unmutes HTML5 audio, and ramps master SFX gain per D-07', () => {
    const engine = AudioEngine.getInstance();
    engine.unlock();
    const bgm = engine.getBgmElement()!;

    expect(engine.getMuted()).toBe(false);

    // Toggle to MUTE
    const muted = engine.toggleMute();
    expect(muted).toBe(true);
    expect(engine.getMuted()).toBe(true);
    expect(bgm.muted).toBe(true);
    expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.0, expect.any(Number));

    // Toggle to UNMUTE
    const unmuted = engine.toggleMute();
    expect(unmuted).toBe(false);
    expect(engine.getMuted()).toBe(false);
    expect(bgm.muted).toBe(false);
    expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1.0, expect.any(Number));
  });

  it('suspends AudioContext and pauses BGM on visibilitychange to hidden, and resumes on visible per D-09, ASVS V14', () => {
    const engine = AudioEngine.getInstance();
    engine.unlock();
    const bgm = engine.getBgmElement()!;

    // Simulate BGM currently playing
    Object.defineProperty(bgm, 'paused', { value: false, configurable: true });
    mockAudioContext.state = 'running';

    const pauseSpy = vi.spyOn(bgm, 'pause');
    const playSpy = vi.spyOn(bgm, 'play');

    // 1. Hide tab
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(pauseSpy).toHaveBeenCalled();
    expect(mockAudioContext.suspend).toHaveBeenCalled();

    // 2. Return to tab
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    mockAudioContext.state = 'suspended';
    document.dispatchEvent(new Event('visibilitychange'));

    expect(playSpy).toHaveBeenCalled();
    expect(mockAudioContext.resume).toHaveBeenCalled();
  });

  it('clamps SFX master gain between [0.0, 1.0] to prevent acoustic clipping per ASVS V5', () => {
    const engine = AudioEngine.getInstance();
    engine.unlock();

    const gainNode = engine.getSfxGain();
    expect(gainNode).not.toBeNull();
    expect(gainNode?.gain.setValueAtTime).toHaveBeenCalledWith(1.0, 0);
  });

  it('delegates SFX triggers to injected SfxPlayer if unmuted, and suppresses when muted', () => {
    const engine = AudioEngine.getInstance();
    const mockSfx = {
      playMatchStrike: vi.fn(),
      playFlameCrackle: vi.fn(),
    };
    engine.setSfxSynthesizer(mockSfx);

    engine.playMatchStrike();
    engine.playFlameCrackle();

    expect(mockSfx.playMatchStrike).toHaveBeenCalledTimes(1);
    expect(mockSfx.playFlameCrackle).toHaveBeenCalledTimes(1);

    // Mute engine
    engine.toggleMute();

    engine.playMatchStrike();
    engine.playFlameCrackle();

    // Still only 1 call
    expect(mockSfx.playMatchStrike).toHaveBeenCalledTimes(1);
    expect(mockSfx.playFlameCrackle).toHaveBeenCalledTimes(1);
  });

  it('dispose() closes AudioContext, removes BGM element, removes visibility listener, and resets singleton per D-09, ASVS V14', () => {
    const engine = AudioEngine.getInstance();
    engine.unlock();

    expect(document.getElementById('festive-bgm')).not.toBeNull();

    engine.dispose();

    expect(document.getElementById('festive-bgm')).toBeNull();
    expect(mockAudioContext.close).toHaveBeenCalled();
    expect(engine.getAudioContext()).toBeNull();
    expect(engine.getBgmElement()).toBeNull();

    // Getting instance again creates a fresh un-unlocked singleton
    const newEngine = AudioEngine.getInstance();
    expect(newEngine.isAudioUnlocked()).toBe(false);
  });
});
