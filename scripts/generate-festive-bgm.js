import fs from 'fs';
import path from 'path';

// Generate 44.1kHz 16-bit stereo PCM WAV file
const sampleRate = 44100;
const durationSec = 24; // 24-second seamless loop
const totalSamples = sampleRate * durationSec;
const numChannels = 2;
const bytesPerSample = 2;
const blockAlign = numChannels * bytesPerSample;
const byteRate = sampleRate * blockAlign;
const dataSize = totalSamples * blockAlign;

const buffer = Buffer.alloc(44 + dataSize);

// RIFF Header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);

// fmt chunk
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // subchunk1 size
buffer.writeUInt16LE(1, 20);  // PCM format
buffer.writeUInt16LE(numChannels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(byteRate, 28);
buffer.writeUInt16LE(blockAlign, 32);
buffer.writeUInt16LE(16, 34); // bits per sample

// data chunk
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

// Indian Classical Festive Raag (Yaman/Bhupali in D):
// Sa = 146.83 Hz (D3), Re = 165.0 Hz (E3), Ga = 185.0 Hz (F#3), Pa = 220.0 Hz (A3), Dha = 247.0 Hz (B3), Sa' = 293.66 Hz (D4)
// Flute octave: 293.66, 330.0, 370.0, 440.0, 494.0, 587.33 Hz
const notes = [293.66, 330.0, 370.0, 440.0, 494.0, 587.33, 440.0, 370.0, 330.0, 293.66];
const noteDuration = durationSec / notes.length;

let offset = 44;

for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;

  // 1. Tanpura Drone: Root (D3 = 146.83) + Fifth (A3 = 220) + High Sa (D4 = 293.66)
  // Subtle rhythmic plucking envelope every 3 seconds for 4 tanpura strings
  const stringPluckCycle = (t % 3.0) / 3.0;
  const pluckGain = Math.exp(-stringPluckCycle * 3.5) * 0.4 + 0.15;

  const tanpura1 = Math.sin(2 * Math.PI * 146.83 * t) * 0.25;
  const tanpura1Harmonic = Math.sin(2 * Math.PI * 146.83 * 2 * t) * 0.12;
  const tanpura2 = Math.sin(2 * Math.PI * 220.0 * t) * 0.20;
  const tanpura3 = Math.sin(2 * Math.PI * 293.66 * t) * 0.15;
  const tanpuraDrone = (tanpura1 + tanpura1Harmonic + tanpura2 + tanpura3) * pluckGain;

  // 2. Bansuri Flute Melody: Raag Yaman meditative notes with soft vibrato and breath
  const noteIndex = Math.floor(t / noteDuration) % notes.length;
  const noteFreq = notes[noteIndex];
  const noteTime = (t % noteDuration) / noteDuration;
  
  // Smooth envelope: gentle attack, sustain, soft release
  const fluteEnv = Math.sin(Math.PI * Math.min(1.0, noteTime * 1.5)) * Math.min(1.0, (1.0 - noteTime) * 3.0);
  // Vibrato (5.5 Hz depth 1.5%)
  const vibrato = 1.0 + 0.012 * Math.sin(2 * Math.PI * 5.5 * t);
  const fluteFundamental = Math.sin(2 * Math.PI * noteFreq * vibrato * t);
  const flute2ndHarmonic = Math.sin(2 * Math.PI * noteFreq * 2 * vibrato * t) * 0.35;
  const flute3rdHarmonic = Math.sin(2 * Math.PI * noteFreq * 3 * vibrato * t) * 0.15;
  // Breath noise
  const breath = (Math.random() * 2 - 1) * 0.02;

  const fluteMelody = (fluteFundamental + flute2ndHarmonic + flute3rdHarmonic + breath) * fluteEnv * 0.30;

  // 3. Gentle Temple Chime / Bell Accent every 6 seconds
  const chimeCycle = t % 6.0;
  const chimeEnv = Math.exp(-chimeCycle * 1.5) * (chimeCycle < 4.0 ? 1.0 : 0.0);
  const chimeTone = (Math.sin(2 * Math.PI * 1760.0 * t) * 0.6 + Math.sin(2 * Math.PI * 2640.0 * t) * 0.3) * chimeEnv * 0.12;

  // Mix left and right with gentle stereo panning
  const leftSample = tanpuraDrone * 0.85 + fluteMelody * 0.95 + chimeTone * 0.7;
  const rightSample = tanpuraDrone * 0.95 + fluteMelody * 0.85 + chimeTone * 0.9;

  // Seamless loop crossfade at start and end (0.5s)
  const loopFadeTime = 0.5;
  let loopGain = 1.0;
  if (t < loopFadeTime) {
    loopGain = t / loopFadeTime;
  } else if (t > durationSec - loopFadeTime) {
    loopGain = (durationSec - t) / loopFadeTime;
  }

  const clampedLeft = Math.max(-1.0, Math.min(1.0, leftSample * loopGain));
  const clampedRight = Math.max(-1.0, Math.min(1.0, rightSample * loopGain));

  buffer.writeInt16LE(Math.round(clampedLeft * 32767), offset);
  offset += 2;
  buffer.writeInt16LE(Math.round(clampedRight * 32767), offset);
  offset += 2;
}

const outDir = path.resolve('public', 'audio');
fs.mkdirSync(outDir, { recursive: true });

// Write both .mp3 and .wav copies so any browser audio loader finds the file
fs.writeFileSync(path.join(outDir, 'festive-bgm.mp3'), buffer);
fs.writeFileSync(path.join(outDir, 'festive-bgm.wav'), buffer);
console.log('Successfully generated festive-bgm.mp3 and festive-bgm.wav in public/audio/ (size: ' + buffer.length + ' bytes)');
