import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioEngine } from '../../src/audio/audio-engine';

describe('AudioEngine Track Switching & Custom Audio', () => {
  let mockAudioContext: {
    state: string;
    currentTime: number;
    sampleRate: number;
    destination: Record<string, unknown>;
    resume: ReturnType<typeof vi.fn>;
    suspend: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    createGain: ReturnType<typeof vi.fn>;
    createBuffer: ReturnType<typeof vi.fn>;
    createBufferSource: ReturnType<typeof vi.fn>;
    createOscillator: ReturnType<typeof vi.fn>;
    createBiquadFilter: ReturnType<typeof vi.fn>;
  };
  let mockGainNode: {
    gain: {
      value: number;
      setValueAtTime: ReturnType<typeof vi.fn>;
      linearRampToValueAtTime: ReturnType<typeof vi.fn>;
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
    connect: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    const existing = AudioEngine.getInstance();
    existing.dispose();

    mockGainNode = {
      gain: {
        value: 1.0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    mockAudioContext = {
      state: 'running',
      currentTime: 0,
      sampleRate: 44100,
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      suspend: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      createGain: vi.fn().mockReturnValue(mockGainNode),
      createBuffer: vi.fn().mockReturnValue({
        getChannelData: vi.fn().mockReturnValue(new Float32Array(100)),
      }),
      createBufferSource: vi.fn().mockReturnValue({
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
      }),
      createOscillator: vi.fn().mockReturnValue({
        type: 'sine',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }),
      createBiquadFilter: vi.fn().mockReturnValue({
        type: 'lowpass',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
      }),
    };

    vi.stubGlobal('AudioContext', vi.fn().mockImplementation(() => mockAudioContext));
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  });

  afterEach(() => {
    const engine = AudioEngine.getInstance();
    engine.dispose();
    document.getElementById('festive-bgm')?.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('provides available preset festive tracks including Happy Wali Feeling, Mere Tumhare, and Lakshmi Aarti', () => {
    const engine = AudioEngine.getInstance();
    const tracks = engine.getAvailableTracks();

    expect(tracks.length).toBe(3);
    const trackIds = tracks.map((t) => t.id);
    expect(trackIds).toContain('track1');
    expect(trackIds).toContain('track2');
    expect(trackIds).toContain('track3');
  });

  it('defaults current track to Happy Wali Feeling (Track 1)', () => {
    const engine = AudioEngine.getInstance();
    expect(engine.getCurrentTrack().id).toBe('track1');
    expect(engine.getCurrentTrack().name).toContain('Happy Wali Feeling');
    expect(engine.getCurrentTrack().src).toBe('/audio/diwali-track-1.mp3');
  });

  it('switches to Mere Tumhare Sabke Liye track on setTrack("track2")', async () => {
    const engine = AudioEngine.getInstance();
    engine.unlock();
    await engine.setTrack('track2');

    expect(engine.getCurrentTrack().id).toBe('track2');
    expect(engine.getCurrentTrack().name).toContain('Mere Tumhare');
    expect(engine.getCurrentTrack().src).toBe('/audio/diwali-track-2.mp3');
  });

  it('switches to Shree Lakshmi Aarti track on setTrack("track3")', async () => {
    const engine = AudioEngine.getInstance();
    engine.unlock();
    await engine.setTrack('track3');

    expect(engine.getCurrentTrack().id).toBe('track3');
    expect(engine.getCurrentTrack().name).toContain('Lakshmi Aarti');
    expect(engine.getCurrentTrack().src).toBe('/audio/diwali-track-3.mp3');
  });

  it('maps legacy track IDs (sitar, flute, temple) cleanly for backwards compatibility', async () => {
    const engine = AudioEngine.getInstance();
    engine.unlock();
    await engine.setTrack('sitar');
    expect(engine.getCurrentTrack().id).toBe('track1');

    await engine.setTrack('flute');
    expect(engine.getCurrentTrack().id).toBe('track2');

    await engine.setTrack('temple');
    expect(engine.getCurrentTrack().id).toBe('track3');
  });

  it('supports custom user-uploaded soundtrack via setTrack("custom", url, title)', async () => {
    const engine = AudioEngine.getInstance();
    engine.unlock();
    const customUrl = 'blob:http://localhost:3000/custom-uuid';
    await engine.setTrack('custom', customUrl, 'My Diwali Aarti');

    expect(engine.getCurrentTrack().id).toBe('custom');
    expect(engine.getCurrentTrack().name).toBe('My Diwali Aarti');
    expect(engine.getCurrentTrack().src).toBe(customUrl);

    // Verify it appears in getAvailableTracks()
    const tracks = engine.getAvailableTracks();
    const customInList = tracks.find((t) => t.id === 'custom');
    expect(customInList).toBeDefined();
    expect(customInList?.name).toBe('My Diwali Aarti');
  });

  it('triggers playTempleBell() and playSparklerSizzle() without errors', () => {
    const engine = AudioEngine.getInstance();
    engine.unlock();

    expect(() => engine.playTempleBell()).not.toThrow();
    expect(() => engine.playSparklerSizzle()).not.toThrow();
  });
});
