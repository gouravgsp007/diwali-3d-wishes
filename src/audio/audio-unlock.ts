let audioContext: AudioContext | null = null;

/**
 * Returns the primed singleton AudioContext instance, or null if uninitialized.
 */
export function getAudioContext(): AudioContext | null {
  return audioContext;
}

/**
 * Synchronously primes the Web Audio API context during a direct user gesture.
 *
 * Essential for iOS Safari WebKit audio policy compliance (D-11):
 * Calling this synchronously inside a pointer or submit event handler wakes the
 * AVAudioSession before any asynchronous microtask ticks (such as PBKDF2 / AES-GCM decryption).
 */
export function primeAudioContext(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }

    // Play 1-sample silent buffer to unlock iOS Safari WebKit audio session
    const silentBuffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = silentBuffer;
    source.connect(audioContext.destination);
    source.start(0);
  } catch (err) {
    console.warn('Audio priming skipped:', err);
  }
}
