# Phase 1: Core Architecture, State Machine & Cryptographic Codec - Pattern Map

**Mapped:** 2026-11-03  
**Phase:** 01 - Core Architecture, State Machine & Cryptographic Codec  
**Files analyzed:** 18  
**Analogs found:** 18 / 18 (Canonical specifications from 01-RESEARCH.md, ARCHITECTURE.md, and 01-CONTEXT.md for greenfield architecture)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog / Canonical Spec | Match Quality |
|---|---|---|---|---|
| `package.json` | config | file-I/O | `01-RESEARCH.md:107-126` (NPM Scaffolding Specs) | canonical-spec |
| `tsconfig.json` | config | file-I/O | `01-RESEARCH.md:88-92, 183` (Strict ES2022 Config) | canonical-spec |
| `vite.config.ts` | config | file-I/O | `01-RESEARCH.md:563-581` (Vite + Tailwind v4 Specs) | canonical-spec |
| `vitest.config.ts` | config | file-I/O | `01-RESEARCH.md:695-702` (Vitest Test Runner Specs) | canonical-spec |
| `index.html` | component | request-response | `01-RESEARCH.md:450-503` (Mobile Viewport Shell) | canonical-spec |
| `src/style.css` | utility | transform | `01-RESEARCH.md:583-598` (Tailwind v4 + Shake Keyframes) | canonical-spec |
| `src/crypto/types.ts` | model | transform | `01-RESEARCH.md:224-230` (`GreetingPayload` Interface) | canonical-spec |
| `src/crypto/greeting-codec.ts` | service | transform | `01-RESEARCH.md:307-413` (AES-GCM PBKDF2 Codec) | canonical-spec |
| `src/crypto/demo-greeting.ts` | model | CRUD | `01-RESEARCH.md:631-651` (Built-in Demo Greetings) | canonical-spec |
| `src/app/state-machine.ts` | store | event-driven | `01-RESEARCH.md:212-301` (`AppStateMachine` Implementation) | canonical-spec |
| `src/app/event-bus.ts` | service | pub-sub | `01-RESEARCH.md:290-300` (Pub/Sub Event Bus) | canonical-spec |
| `src/ui/url-resolver.ts` | utility | transform | `01-RESEARCH.md:415-444` (Dual URL Token Resolver) | canonical-spec |
| `src/audio/audio-unlock.ts` | service | event-driven | `01-RESEARCH.md:599-628` (Synchronous Audio Primer) | canonical-spec |
| `src/ui/passcode-gate.ts` | controller | event-driven | `01-RESEARCH.md:150-175, 450-503` (Passcode Modal Controller) | canonical-spec |
| `src/main.ts` | controller | event-driven | `01-RESEARCH.md:185-187` (Application Bootstrap Entry) | canonical-spec |
| `tests/crypto/greeting-codec.test.ts` | test | transform | `01-RESEARCH.md:707-708` (Crypto Codec Roundtrip Test) | canonical-spec |
| `tests/state/state-machine.test.ts` | test | event-driven | `01-RESEARCH.md:709, 719` (FSM Lifecycle Test) | canonical-spec |
| `tests/ui/url-resolver.test.ts` | test | transform | `01-RESEARCH.md:710, 720` (URL Parsing & Sanitization Test) | canonical-spec |

---

## Pattern Assignments

### 1. `package.json` (config, file-I/O)

**Analog Reference:** `01-RESEARCH.md` lines 107-126

**Core Configuration Pattern:**
```json
{
  "name": "diwali-3d-wishes",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "lz-string": "^1.5.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/lz-string": "^1.5.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.2.0",
    "vitest": "^3.0.0"
  }
}
```

---

### 2. `tsconfig.json` (config, file-I/O)

**Analog Reference:** `01-RESEARCH.md` lines 88-92, 183

**Core Configuration Pattern:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "tests"]
}
```

---

### 3. `vite.config.ts` (config, file-I/O)

**Analog Reference:** `01-RESEARCH.md` lines 563-581

**Imports & Plugin Pattern:**
```typescript
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'es2022',
  },
});
```

---

### 4. `vitest.config.ts` (config, file-I/O)

**Analog Reference:** `01-RESEARCH.md` lines 695-702

**Core Configuration Pattern:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
```

---

### 5. `index.html` (component, request-response)

**Analog Reference:** `01-RESEARCH.md` lines 450-503

**Mobile Viewport & Passcode Shell Pattern:**
```html
<!DOCTYPE html>
<html lang="en" class="w-full h-full overflow-hidden select-none">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <title>Shubh Deepavali ✨ 3D Interactive Wishes</title>
  <link rel="stylesheet" href="/src/style.css" />
</head>
<body class="w-full h-full overflow-hidden bg-[#0d0208] text-amber-100 font-sans antialiased overscroll-none touch-none">
  <div id="app" class="fixed inset-0 w-screen h-[100svh] overflow-hidden flex flex-col items-center justify-center p-4 overscroll-none touch-manipulation">
    <!-- Atmospheric background gradient -->
    <div class="absolute inset-0 bg-gradient-to-b from-[#0d0208] via-[#1a0614] to-[#080105] pointer-events-none -z-10"></div>
    
    <!-- Passcode Modal Card -->
    <div id="passcode-card" class="w-full max-w-sm rounded-3xl p-6 bg-white/[0.04] backdrop-blur-xl border border-amber-500/20 shadow-2xl shadow-amber-950/40 text-center transition-all duration-300">
      <div class="text-3xl mb-2 select-none">🪔</div>
      <p class="text-xs font-semibold tracking-widest uppercase text-amber-400/80 mb-1">✨ Shubh Deepavali ✨</p>
      <h1 class="text-xl font-bold text-amber-100 mb-2">Unlock Your Diwali Surprise</h1>
      <p class="text-xs text-amber-200/70 mb-6 leading-relaxed">Enter the secret passcode sent by your loved one</p>

      <form id="passcode-form" class="space-y-4">
        <div>
          <input
            id="passcode-input"
            type="text"
            inputmode="text"
            maxlength="6"
            minlength="4"
            required
            pattern="[A-Za-z0-9]{4,6}"
            placeholder="e.g. PRIYA"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            class="w-full text-center tracking-[0.3em] font-mono font-bold text-2xl py-3 px-4 rounded-xl bg-black/40 border border-amber-500/30 text-amber-200 placeholder:text-amber-500/30 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40 transition-all uppercase"
          />
        </div>

        <button
          type="submit"
          id="unlock-btn"
          class="w-full py-3.5 px-6 rounded-xl font-semibold text-sm tracking-wider uppercase bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-amber-950 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          Open Festive Wish 🪔
        </button>
      </form>

      <p id="error-feedback" class="hidden mt-4 text-xs font-medium text-rose-400/90 leading-tight"></p>
    </div>
  </div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

---

### 6. `src/style.css` (utility, transform)

**Analog Reference:** `01-RESEARCH.md` lines 583-598

**Tailwind v4 & Keyframe Pattern:**
```css
@import "tailwindcss";

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-8px); }
  40%, 80% { transform: translateX(8px); }
}

.animate-shake {
  animation: shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
```

---

### 7. `src/crypto/types.ts` (model, transform)

**Analog Reference:** `01-RESEARCH.md` lines 224-230

**Contract & Interface Pattern:**
```typescript
export interface GreetingPayload {
  recipient: string;
  sender: string;
  message: string;
  templateId?: string;
  createdAt?: number;
}

export function isValidGreetingPayload(obj: unknown): obj is GreetingPayload {
  if (!obj || typeof obj !== 'object') return false;
  const candidate = obj as Record<string, unknown>;
  return (
    typeof candidate.recipient === 'string' &&
    typeof candidate.sender === 'string' &&
    typeof candidate.message === 'string'
  );
}
```

---

### 8. `src/crypto/greeting-codec.ts` (service, transform)

**Analog Reference:** `01-RESEARCH.md` lines 307-413

**Imports & Codec Pattern:**
```typescript
import LZString from 'lz-string';
import type { GreetingPayload } from './types';
import { isValidGreetingPayload } from './types';

export class GreetingCodec {
  private static readonly SALT = new TextEncoder().encode('ShubhDiwali2026Salt');
  private static readonly ITERATIONS = 100000;

  private static async deriveKey(passcode: string): Promise<CryptoKey> {
    const normalizedCode = passcode.trim().toUpperCase();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(normalizedCode),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.SALT,
        iterations: this.ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  public static async encrypt(payload: GreetingPayload, passcode: string): Promise<string> {
    const key = await this.deriveKey(passcode);
    const jsonStr = JSON.stringify(payload);
    const compressedBytes = LZString.compressToUint8Array(jsonStr);

    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      compressedBytes
    );

    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuffer), iv.length);

    let binary = '';
    for (let i = 0; i < combined.length; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  public static async decrypt(token: string, passcode: string): Promise<GreetingPayload> {
    const key = await this.deriveKey(passcode);

    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';

    const binary = atob(base64);
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    if (combined.length < 28) {
      throw new Error('Invalid ciphertext: token too short');
    }

    const iv = combined.slice(0, 12);
    const cipherData = combined.slice(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherData
    );

    const jsonStr = LZString.decompressFromUint8Array(new Uint8Array(decryptedBuffer));
    if (!jsonStr) {
      throw new Error('Decompression failed');
    }

    const parsed = JSON.parse(jsonStr);
    if (!isValidGreetingPayload(parsed)) {
      throw new Error('Invalid payload schema');
    }

    return parsed;
  }
}
```

**Error Handling:** Catches AES-GCM `OperationError` when the authentication tag fails (wrong passcode) or ciphertext is corrupted; throws clean error without exposing plaintext.

---

### 9. `src/crypto/demo-greeting.ts` (model, CRUD)

**Analog Reference:** `01-RESEARCH.md` lines 631-651

**Demo Data Pattern:**
```typescript
import type { GreetingPayload } from './types';

export const DEMO_GREETINGS: Record<string, GreetingPayload> = {
  DIWALI: {
    recipient: 'Beloved Friend',
    sender: 'Diwali Wishes Team',
    message: 'May the divine light of Diwali illuminate your home with happiness, peace, and eternal prosperity! Happy Diwali! ✨🪔',
    templateId: 'diya-classic',
    createdAt: 1730635200000,
  },
  HAPPY: {
    recipient: 'Dear Friend',
    sender: 'Your Loved One',
    message: 'Wishing you a joyful, sparkling, and blessed Diwali filled with love, laughter, and sweet memories! 🪔✨',
    templateId: 'diya-classic',
    createdAt: 1730635200000,
  },
};
```

---

### 10. `src/app/state-machine.ts` (store, event-driven)

**Analog Reference:** `01-RESEARCH.md` lines 212-301

**State Machine Pattern:**
```typescript
import type { GreetingPayload } from '../crypto/types';

export type AppState =
  | 'BOOT'
  | 'LOCKED'
  | 'UNLOCKED_INTRO'
  | 'INTERACTIVE_UNLIT'
  | 'IGNITING'
  | 'LIT_CELEBRATION'
  | 'GREETING_REVEAL';

export type AppEvent =
  | { type: 'BOOT_COMPLETE'; hasCiphertext: boolean }
  | { type: 'UNLOCK_SUCCESS'; payload: GreetingPayload }
  | { type: 'INTRO_COMPLETE' }
  | { type: 'WICK_TOUCHED' }
  | { type: 'IGNITION_COMPLETE' }
  | { type: 'CELEBRATION_COMPLETE' }
  | { type: 'REPLAY' };

export class AppStateMachine {
  private currentState: AppState = 'BOOT';
  private subscribers: Array<(state: AppState, payload?: GreetingPayload) => void> = [];
  private greetingData: GreetingPayload | null = null;

  public getState(): AppState {
    return this.currentState;
  }

  public getGreeting(): GreetingPayload | null {
    return this.greetingData;
  }

  public transition(event: AppEvent): AppState {
    const prev = this.currentState;

    switch (this.currentState) {
      case 'BOOT':
        if (event.type === 'BOOT_COMPLETE') this.currentState = 'LOCKED';
        break;
      case 'LOCKED':
        if (event.type === 'UNLOCK_SUCCESS') {
          this.greetingData = event.payload;
          this.currentState = 'UNLOCKED_INTRO';
        }
        break;
      case 'UNLOCKED_INTRO':
        if (event.type === 'INTRO_COMPLETE') this.currentState = 'INTERACTIVE_UNLIT';
        break;
      case 'INTERACTIVE_UNLIT':
        if (event.type === 'WICK_TOUCHED') this.currentState = 'IGNITING';
        break;
      case 'IGNITING':
        if (event.type === 'IGNITION_COMPLETE') this.currentState = 'LIT_CELEBRATION';
        break;
      case 'LIT_CELEBRATION':
        if (event.type === 'CELEBRATION_COMPLETE') this.currentState = 'GREETING_REVEAL';
        break;
      case 'GREETING_REVEAL':
        if (event.type === 'REPLAY') this.currentState = 'INTERACTIVE_UNLIT';
        break;
    }

    if (prev !== this.currentState) {
      this.notify(this.currentState, this.greetingData ?? undefined);
    }
    return this.currentState;
  }

  public subscribe(fn: (state: AppState, payload?: GreetingPayload) => void): () => void {
    this.subscribers.push(fn);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== fn);
    };
  }

  private notify(state: AppState, payload?: GreetingPayload): void {
    for (const sub of this.subscribers) sub(state, payload);
  }
}
```

---

### 11. `src/app/event-bus.ts` (service, pub-sub)

**Analog Reference:** `01-RESEARCH.md` lines 188-190, `ARCHITECTURE.md` lines 98-101

**Typed Pub/Sub Event Bus Pattern:**
```typescript
type EventCallback<T = unknown> = (data: T) => void;

export class EventBus {
  private listeners: Map<string, Set<EventCallback<any>>> = new Map();

  public on<T>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public emit<T>(event: string, data: T): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(data);
      }
    }
  }
}

export const globalEventBus = new EventBus();
```

---

### 12. `src/ui/url-resolver.ts` (utility, transform)

**Analog Reference:** `01-RESEARCH.md` lines 415-444

**URL Hash & Query Parsing Pattern:**
```typescript
export interface ResolvedToken {
  token: string | null;
  isDemo: boolean;
}

export function resolveGreetingToken(): ResolvedToken {
  // 1. Check URL hash fragment (#d=...) - Primary path (never touches server logs)
  const hash = window.location.hash;
  if (hash.startsWith('#d=')) {
    const rawToken = hash.slice(3).split('&')[0];
    const cleanToken = decodeURIComponent(rawToken).trim();
    if (cleanToken) return { token: cleanToken, isDemo: false };
  }

  // 2. Query parameter fallback (?c=... or ?d=...)
  const params = new URLSearchParams(window.location.search);
  const queryToken = params.get('c') || params.get('d') || params.get('code');
  if (queryToken) {
    const cleanToken = queryToken.trim();
    if (cleanToken) return { token: cleanToken, isDemo: false };
  }

  // 3. Direct visit / demo fallback (D-07)
  return { token: null, isDemo: true };
}
```

---

### 13. `src/audio/audio-unlock.ts` (service, event-driven)

**Analog Reference:** `01-RESEARCH.md` lines 599-628

**Synchronous AudioContext Priming Pattern:**
```typescript
let audioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  return audioContext;
}

export function primeAudioContext(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
```

---

### 14. `src/ui/passcode-gate.ts` (controller, event-driven)

**Analog Reference:** `01-RESEARCH.md` lines 150-175, 450-503

**Passcode Modal Controller Pattern:**
```typescript
import { GreetingCodec } from '../crypto/greeting-codec';
import { DEMO_GREETINGS } from '../crypto/demo-greeting';
import { primeAudioContext } from '../audio/audio-unlock';
import type { AppStateMachine } from '../app/state-machine';
import type { ResolvedToken } from './url-resolver';

export class PasscodeGate {
  private formEl: HTMLFormElement | null = null;
  private inputEl: HTMLInputElement | null = null;
  private cardEl: HTMLElement | null = null;
  private errorEl: HTMLElement | null = null;

  constructor(
    private stateMachine: AppStateMachine,
    private tokenInfo: ResolvedToken
  ) {}

  public mount(): void {
    this.formEl = document.getElementById('passcode-form') as HTMLFormElement;
    this.inputEl = document.getElementById('passcode-input') as HTMLInputElement;
    this.cardEl = document.getElementById('passcode-card');
    this.errorEl = document.getElementById('error-feedback');

    if (!this.formEl || !this.inputEl) return;

    // Auto-uppercase normalization
    this.inputEl.addEventListener('input', () => {
      this.inputEl!.value = this.inputEl!.value.toUpperCase();
      this.hideError();
    });

    this.formEl.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleUnlock();
    });
  }

  private async handleUnlock(): Promise<void> {
    const passcode = this.inputEl?.value.trim().toUpperCase() || '';
    if (passcode.length < 4 || passcode.length > 6) return;

    // 1. Synchronously prime Web Audio API context during the user gesture callback
    primeAudioContext();

    try {
      let payload;

      if (this.tokenInfo.isDemo || !this.tokenInfo.token) {
        // Built-in demo fallback
        const demo = DEMO_GREETINGS[passcode];
        if (!demo) {
          throw new Error('Invalid demo code');
        }
        payload = demo;
      } else {
        // Cryptographic decryption via AES-GCM
        payload = await GreetingCodec.decrypt(this.tokenInfo.token, passcode);
      }

      // Success: advance FSM
      this.stateMachine.transition({
        type: 'UNLOCK_SUCCESS',
        payload,
      });

      this.hideModal();
    } catch {
      // Rejection feedback: trigger shake animation and user-friendly error message
      this.triggerRejection();
    }
  }

  private triggerRejection(): void {
    if (this.cardEl) {
      this.cardEl.classList.remove('animate-shake');
      void this.cardEl.offsetWidth; // Force CSS reflow
      this.cardEl.classList.add('animate-shake');
    }

    if (this.errorEl) {
      this.errorEl.textContent = "Passcode doesn't match this greeting. Please check your message!";
      this.errorEl.classList.remove('hidden');
    }

    if (this.inputEl) {
      this.inputEl.select();
    }
  }

  private hideError(): void {
    if (this.errorEl) {
      this.errorEl.classList.add('hidden');
    }
  }

  private hideModal(): void {
    if (this.cardEl) {
      this.cardEl.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
    }
  }
}
```

---

### 15. `src/main.ts` (controller, event-driven)

**Analog Reference:** `01-RESEARCH.md` lines 185-187

**Bootstrap Pattern:**
```typescript
import './style.css';
import { AppStateMachine } from './app/state-machine';
import { resolveGreetingToken } from './ui/url-resolver';
import { PasscodeGate } from './ui/passcode-gate';

function bootstrap(): void {
  const fsm = new AppStateMachine();
  const tokenInfo = resolveGreetingToken();

  const passcodeGate = new PasscodeGate(fsm, tokenInfo);
  passcodeGate.mount();

  fsm.transition({
    type: 'BOOT_COMPLETE',
    hasCiphertext: !tokenInfo.isDemo && !!tokenInfo.token,
  });
}

window.addEventListener('DOMContentLoaded', bootstrap);
```

---

### 16. `tests/crypto/greeting-codec.test.ts` (test, transform)

**Analog Reference:** `01-RESEARCH.md` lines 707-708

**Vitest Cryptographic Round-Trip Test Pattern:**
```typescript
import { describe, it, expect } from 'vitest';
import { GreetingCodec } from '../../src/crypto/greeting-codec';
import type { GreetingPayload } from '../../src/crypto/types';

describe('GreetingCodec', () => {
  const samplePayload: GreetingPayload = {
    recipient: 'Priya',
    sender: 'Aarav',
    message: 'Wishing you radiant joy and prosperous Diwali!',
    templateId: 'diya-classic',
    createdAt: 1730635200000,
  };

  it('encrypts and decrypts payload successfully with matching passcode', async () => {
    const passcode = 'PRIYA8';
    const ciphertext = await GreetingCodec.encrypt(samplePayload, passcode);

    expect(typeof ciphertext).toBe('string');
    expect(ciphertext.length).toBeGreaterThan(28);

    const decrypted = await GreetingCodec.decrypt(ciphertext, passcode);
    expect(decrypted).toEqual(samplePayload);
  });

  it('handles lowercase/uppercase passcodes transparently via normalization', async () => {
    const ciphertext = await GreetingCodec.encrypt(samplePayload, 'DIYA99');
    const decrypted = await GreetingCodec.decrypt(ciphertext, 'diya99');
    expect(decrypted.recipient).toBe('Priya');
  });

  it('throws OperationError / rejection when wrong passcode is provided', async () => {
    const ciphertext = await GreetingCodec.encrypt(samplePayload, 'CORRECT');
    await expect(GreetingCodec.decrypt(ciphertext, 'WRONGG')).rejects.toThrow();
  });

  it('throws error when ciphertext is tampered or truncated', async () => {
    const ciphertext = await GreetingCodec.encrypt(samplePayload, 'SECURE');
    const corrupted = ciphertext.slice(0, 10) + 'xyz' + ciphertext.slice(13);
    await expect(GreetingCodec.decrypt(corrupted, 'SECURE')).rejects.toThrow();
  });
});
```

---

### 17. `tests/state/state-machine.test.ts` (test, event-driven)

**Analog Reference:** `01-RESEARCH.md` lines 709, 719

**Vitest FSM Lifecycle Test Pattern:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { AppStateMachine } from '../../src/app/state-machine';
import type { GreetingPayload } from '../../src/crypto/types';

describe('AppStateMachine', () => {
  const mockPayload: GreetingPayload = {
    recipient: 'Aarav',
    sender: 'Priya',
    message: 'Happy Diwali!',
  };

  it('initializes in BOOT state', () => {
    const fsm = new AppStateMachine();
    expect(fsm.getState()).toBe('BOOT');
  });

  it('transitions from BOOT to LOCKED on BOOT_COMPLETE', () => {
    const fsm = new AppStateMachine();
    const next = fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });
    expect(next).toBe('LOCKED');
    expect(fsm.getState()).toBe('LOCKED');
  });

  it('transitions from LOCKED to UNLOCKED_INTRO on UNLOCK_SUCCESS and stores payload', () => {
    const fsm = new AppStateMachine();
    fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });
    const next = fsm.transition({ type: 'UNLOCK_SUCCESS', payload: mockPayload });
    expect(next).toBe('UNLOCKED_INTRO');
    expect(fsm.getGreeting()).toEqual(mockPayload);
  });

  it('notifies subscribers upon state transition', () => {
    const fsm = new AppStateMachine();
    const listener = vi.fn();
    const unsubscribe = fsm.subscribe(listener);

    fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: false });
    expect(listener).toHaveBeenCalledWith('LOCKED', undefined);

    unsubscribe();
    fsm.transition({ type: 'UNLOCK_SUCCESS', payload: mockPayload });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
```

---

### 18. `tests/ui/url-resolver.test.ts` (test, transform)

**Analog Reference:** `01-RESEARCH.md` lines 710, 720

**Vitest URL Resolver Test Pattern:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { resolveGreetingToken } from '../../src/ui/url-resolver';

describe('resolveGreetingToken', () => {
  beforeEach(() => {
    window.location.hash = '';
    window.location.search = '';
  });

  it('extracts token from URL hash fragment (#d=...) as primary path', () => {
    window.location.hash = '#d=eyJhbGciOiJIUzI1NiJ9';
    const result = resolveGreetingToken();
    expect(result.isDemo).toBe(false);
    expect(result.token).toBe('eyJhbGciOiJIUzI1NiJ9');
  });

  it('falls back to query parameter ?c=... and ignores Instagram link shim params', () => {
    window.location.hash = '';
    window.location.search = '?c=SampleCiphertextToken&fbclid=IwAR123456&igsh=abcdef';
    const result = resolveGreetingToken();
    expect(result.isDemo).toBe(false);
    expect(result.token).toBe('SampleCiphertextToken');
  });

  it('identifies demo mode when neither hash nor query token is present', () => {
    window.location.hash = '';
    window.location.search = '';
    const result = resolveGreetingToken();
    expect(result.isDemo).toBe(true);
    expect(result.token).toBeNull();
  });
});
```

---

## Shared Patterns

### 1. Zero-Backend Web Crypto AES-GCM Key Derivation Pattern
**Source:** `src/crypto/greeting-codec.ts`  
**Apply to:** Recipient decryption runtime, future Creator Portal generator  
**Concrete Excerpt:**
```typescript
// Symmetrical PBKDF2 derivation with SHA-256 and constant salt
const normalizedCode = passcode.trim().toUpperCase();
const keyMaterial = await window.crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode(normalizedCode),
  { name: 'PBKDF2' },
  false,
  ['deriveKey']
);

const key = await window.crypto.subtle.deriveKey(
  {
    name: 'PBKDF2',
    salt: new TextEncoder().encode('ShubhDiwali2026Salt'),
    iterations: 100000,
    hash: 'SHA-256',
  },
  keyMaterial,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);
```

### 2. Synchronous User Gesture Audio Activation Pattern
**Source:** `src/audio/audio-unlock.ts`  
**Apply to:** All DOM buttons initiating media playback or state transitions before WebGL loading  
**Rule:** MUST execute synchronously at the top of the event callback before any async `await` microtask tick.
```typescript
// Call synchronously at the top of the submit/click handler
primeAudioContext();
// Now safe to await asynchronous decryption or asset loading
await GreetingCodec.decrypt(token, passcode);
```

### 3. Safe DOM Rendering & Input Validation Pattern
**Source:** `src/ui/passcode-gate.ts`  
**Apply to:** All UI components handling user input and decrypted text  
**Rules:**
- Render user-provided text exclusively via `.textContent` or attribute bindings, NEVER via `.innerHTML`.
- Defer invalid state display until submission or blur (`:user-invalid` styling).
- Enforce 4-to-6 alphanumeric input constraints (`pattern="[A-Za-z0-9]{4,6}"`).

### 4. Mobile Viewport & Touch Containment Pattern
**Source:** `index.html` & `src/style.css`  
**Apply to:** Root application container  
**Rules:**
- Container must use `fixed inset-0 w-screen h-[100svh] overflow-hidden`.
- Touch handling must be locked to `overscroll-none touch-manipulation` to prevent Instagram/iOS pull-to-refresh bounce and address bar jitter.

---

## No Analog Found

Greenfield repository — all 18 files are newly created in Phase 1 according to the verified specifications in `01-RESEARCH.md`, `ARCHITECTURE.md`, and `01-CONTEXT.md`. Zero files lack architectural blueprints.

---

## Metadata

**Analog search scope:** `.planning/research/`, `.planning/phases/01-core-architecture-state-machine-cryptographic-codec/`  
**Files scanned:** 18 proposed Phase 1 project files  
**Pattern extraction date:** 2026-11-03  
