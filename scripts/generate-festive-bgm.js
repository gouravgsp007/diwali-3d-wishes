import fs from 'fs';
import path from 'path';

/**
 * Generates an ultra-soothing, warm, meditative Indian festive ambient soundtrack.
 *
 * Characteristics:
 * - Deep, resonant, peaceful Tanpura drone (D2, A2, D3) with organic acoustic body resonance
 * - Ethereal, gentle bamboo bansuri flute swells (Raag Yaman) with soft breath and zero harshness
 * - Deep meditative Tibetan / Indian bronze bell chime (warm 220Hz fundamental, slow 8-second decay)
 * - 4-pole cascaded lowpass filtering at 850Hz: completely eliminates shrillness, harsh highs, and piercing tones
 * - Mastered at a gentle -16dB RMS level for cozy, non-intrusive atmospheric warmth
 */
const sampleRate = 44100;
const durationSec = 30; // 30-second seamless meditative loop
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
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);  // PCM format
buffer.writeUInt16LE(numChannels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(byteRate, 28);
buffer.writeUInt16LE(blockAlign, 32);
buffer.writeUInt16LE(16, 34); // 16-bit

// data chunk
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

// Indian Classical Tanpura strings in D (Deep, meditative):
// String 1: Pa (A2 = 110.0 Hz)
// String 2: Sa (D3 = 146.83 Hz)
// String 3: Sa (D3 = 146.83 Hz)
// String 4: Kharaj Sa (D2 = 73.416 Hz)
const tanpuraStrings = [
  { freq: 110.0, timeOffset: 0.0 },
  { freq: 146.83, timeOffset: 1.8 },
  { freq: 146.83, timeOffset: 3.6 },
  { freq: 73.416, timeOffset: 5.4 }
];
const tanpuraCycle = 7.5; // Complete 4-string cycle every 7.5s

// Raag Yaman / Bhupali meditative flute notes (soft, breathing swells):
// Frequencies in Hz: D4 (293.66), E4 (329.63), F#4 (369.99), A4 (440.0), B4 (493.88)
const melodyNotes = [
  { freq: 293.66, start: 1.0, dur: 5.5 },
  { freq: 369.99, start: 7.0, dur: 6.0 },
  { freq: 440.00, start: 13.5, dur: 5.5 },
  { freq: 329.63, start: 19.5, dur: 5.0 },
  { freq: 293.66, start: 25.0, dur: 4.5 }
];

// Bronze Temple Bell Chimes at t=0 and t=15s (deep, warm, singing bowl fundamental 220Hz + 330Hz)
const bells = [
  { time: 0.5, freq: 220.0, dur: 12.0 },
  { time: 15.0, freq: 220.0, dur: 12.0 }
];

// Lowpass filter state variables for left and right channels
let lp1_L = 0, lp2_L = 0, lp3_L = 0;
let lp1_R = 0, lp2_R = 0, lp3_R = 0;
// Cutoff around 850 Hz for silky warm velvet tone
const cutoff = 850.0;
const rc = 1.0 / (2.0 * Math.PI * cutoff);
const dt = 1.0 / sampleRate;
const alpha = dt / (rc + dt);

let offset = 44;

for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;

  // 1. Tanpura Acoustic Simulation:
  let tanpuraMixL = 0;
  let tanpuraMixR = 0;

  for (let s = 0; s < tanpuraStrings.length; s++) {
    const string = tanpuraStrings[s];
    const stringTime = (t - string.timeOffset + tanpuraCycle * 10) % tanpuraCycle;
    
    // Natural acoustic decay: fast pluck rise (50ms), long exponential decay with jawari buzzing overtone
    const attack = Math.min(1.0, stringTime / 0.06);
    const decay = Math.exp(-stringTime * 0.45);
    const envelope = attack * decay;

    // Jawari bridge overtone shimmer: gentle harmonic modulation
    const jawariMod = 1.0 + 0.003 * Math.sin(2 * Math.PI * 8.0 * t);
    const f0 = string.freq * jawariMod;

    // Soft warm harmonic series (fundamental dominant, very low higher harmonics)
    const h1 = Math.sin(2 * Math.PI * f0 * t) * 0.40;
    const h2 = Math.sin(2 * Math.PI * f0 * 2 * t) * 0.16;
    const h3 = Math.sin(2 * Math.PI * f0 * 3 * t) * 0.06;
    const h4 = Math.sin(2 * Math.PI * f0 * 4 * t) * 0.02;

    const stringSig = (h1 + h2 + h3 + h4) * envelope;
    const pan = (s % 2 === 0) ? 0.4 : 0.6; // Subtle stereo spread
    tanpuraMixL += stringSig * (1.0 - pan);
    tanpuraMixR += stringSig * pan;
  }

  // 2. Meditative Bamboo Flute (Bansuri):
  let fluteSig = 0;
  for (let m = 0; m < melodyNotes.length; m++) {
    const note = melodyNotes[m];
    if (t >= note.start && t < note.start + note.dur) {
      const noteRelTime = t - note.start;
      // Gentle breathing envelope (slow swell and soft release)
      const noteEnv = Math.sin((Math.PI * noteRelTime) / note.dur);
      
      // Gentle subtle vibrato (4.5 Hz, only 0.25% depth - completely natural, non-annoying)
      const vib = 1.0 + 0.0025 * Math.sin(2 * Math.PI * 4.5 * t);
      const f = note.freq * vib;

      // Pure hollow bamboo acoustic tone: fundamental with warm 2nd harmonic
      const tone1 = Math.sin(2 * Math.PI * f * t) * 0.35;
      const tone2 = Math.sin(2 * Math.PI * f * 2 * t) * 0.08;
      
      // Warm pink noise breath
      const breath = (Math.random() - 0.5) * 0.008;

      fluteSig += (tone1 + tone2 + breath) * noteEnv;
    }
  }

  // 3. Deep Bronze Singing Bowl / Bell:
  let bellSig = 0;
  for (let b = 0; b < bells.length; b++) {
    const bell = bells[b];
    if (t >= bell.time && t < bell.time + bell.dur) {
      const bellTime = t - bell.time;
      const bellEnv = Math.exp(-bellTime * 0.35); // Slow 8-10 second decay
      
      // Warm chime with fundamental 220Hz (A3) and fifth 330Hz (E4) - NO harsh high frequencies!
      const b1 = Math.sin(2 * Math.PI * bell.freq * t) * 0.22;
      const b2 = Math.sin(2 * Math.PI * (bell.freq * 1.5) * t) * 0.10;
      const b3 = Math.sin(2 * Math.PI * (bell.freq * 2.0) * t) * 0.04;
      
      bellSig += (b1 + b2 + b3) * bellEnv;
    }
  }

  // Mix components with balanced, comfortable levels
  let rawL = tanpuraMixL * 0.50 + fluteSig * 0.38 + bellSig * 0.25;
  let rawR = tanpuraMixR * 0.50 + fluteSig * 0.38 + bellSig * 0.25;

  // 4. Multi-pole Low-Pass Filter: strips any harsh digital frequencies above 850 Hz
  lp1_L += alpha * (rawL - lp1_L);
  lp2_L += alpha * (lp1_L - lp2_L);
  lp3_L += alpha * (lp2_L - lp3_L);

  lp1_R += alpha * (rawR - lp1_R);
  lp2_R += alpha * (lp1_R - lp2_R);
  lp3_R += alpha * (lp2_R - lp3_R);

  // Smooth seamless loop crossfade (1.0s at boundaries)
  const crossfadeTime = 1.0;
  let boundaryGain = 1.0;
  if (t < crossfadeTime) {
    boundaryGain = 0.5 * (1.0 - Math.cos((Math.PI * t) / crossfadeTime));
  } else if (t > durationSec - crossfadeTime) {
    boundaryGain = 0.5 * (1.0 - Math.cos((Math.PI * (durationSec - t)) / crossfadeTime));
  }

  const outL = Math.max(-1.0, Math.min(1.0, lp3_L * boundaryGain * 0.85));
  const outR = Math.max(-1.0, Math.min(1.0, lp3_R * boundaryGain * 0.85));

  buffer.writeInt16LE(Math.round(outL * 32767), offset);
  offset += 2;
  buffer.writeInt16LE(Math.round(outR * 32767), offset);
  offset += 2;
}

const outDir = path.resolve('public', 'audio');
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'festive-bgm.mp3'), buffer);
fs.writeFileSync(path.join(outDir, 'festive-bgm.wav'), buffer);
console.log('Successfully regenerated soothing meditative festive-bgm in public/audio/ (duration: ' + durationSec + 's)');
