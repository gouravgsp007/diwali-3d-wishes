# Phase 5: Festive Greeting Reveal, Typography & Celebration Polish - Pattern Map

**Mapped:** 2026-11-04  
**Files analyzed:** 10  
**Analogs found:** 10 / 10  

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/ui/greeting-modal.ts` | component | request-response | `src/interaction/touch-hint.ts` & `src/ui/passcode-gate.ts` | exact |
| `src/ui/whatsapp-link.ts` | utility | transform | `src/ui/url-resolver.ts` & `src/crypto/greeting-codec.ts` | exact |
| `src/fx/celebration-manager.ts` | service | event-driven | `src/interaction/touch-controller.ts` & `src/audio/sfx-synthesizer.ts` | exact |
| `src/graphics/scene-manager.ts` | controller | event-driven | `src/graphics/scene-manager.ts` (self) | exact |
| `src/main.ts` | config | lifecycle | `src/main.ts` (self) | exact |
| `tests/ui/greeting-modal.test.ts` | test | assertions | `tests/interaction/touch-hint.test.ts` & `tests/ui/passcode-gate.test.ts` | exact |
| `tests/ui/whatsapp-link.test.ts` | test | assertions | `tests/ui/url-resolver.test.ts` | exact |
| `tests/fx/celebration-manager.test.ts` | test | assertions | `tests/interaction/touch-controller.test.ts` | exact |
| `tests/graphics/scene-manager.test.ts` | test | assertions | `tests/graphics/scene-manager.test.ts` (self) | exact |
| `tests/main.test.ts` | test | assertions | `tests/main.test.ts` (self) | exact |

---

## Pattern Assignments

### 1. `src/ui/greeting-modal.ts` (component, request-response)

**Analog:** `src/interaction/touch-hint.ts` & `src/ui/passcode-gate.ts`

**Imports Pattern:**
Copy from `src/ui/passcode-gate.ts` (lines 1-6) and `src/interaction/touch-hint.ts` (lines 1-10):
```typescript
import type { GreetingPayload } from '../crypto/types';
import { createWhatsAppReplyUrl } from './whatsapp-link';
```

**Auth/Guard & Security Pattern (ASVS V5 Output Encoding):**
Copy strict DOM property assignment pattern from `src/ui/passcode-gate.ts` (lines 102-106):
```typescript
// Render text strictly via textContent to prevent stored XSS (T-01-04, ASVS V5)
if (this.recipientEl) this.recipientEl.textContent = `To: ${recipient}`;
if (this.messageEl) this.messageEl.textContent = `“${message}”`;
if (this.senderEl) this.senderEl.textContent = `— With love, ${sender}`;
```

**Core Component Lifecycle Pattern:**
Copy DOM instantiation, mounting, and transition toggling from `src/interaction/touch-hint.ts` (lines 18-59):
```typescript
export class GreetingModal {
  private overlayEl: HTMLElement | null = null;
  private cardEl: HTMLElement | null = null;
  private recipientEl: HTMLElement | null = null;
  private messageEl: HTMLElement | null = null;
  private senderEl: HTMLElement | null = null;
  private whatsappBtnEl: HTMLAnchorElement | null = null;
  private creatorBadgeEl: HTMLAnchorElement | null = null;

  public mount(parentContainer: HTMLElement): void {
    if (this.overlayEl) return;

    this.overlayEl = document.createElement('div');
    this.overlayEl.id = 'greeting-modal-overlay';
    this.overlayEl.className =
      'fixed inset-0 z-10 flex items-center justify-center p-4 pointer-events-none select-none';

    // Static HTML skeleton without dynamic string interpolation (ASVS V5)
    this.overlayEl.innerHTML = `
      <div
        id="greeting-card"
        class="w-full max-w-sm sm:max-w-md rounded-3xl p-6 sm:p-8 bg-black/40 backdrop-blur-xl border border-amber-500/40 shadow-2xl shadow-amber-950/50 text-center transition-all duration-700 ease-out opacity-0 scale-95 translate-y-4 pointer-events-none"
      >
        <div class="text-3xl sm:text-4xl mb-1 select-none">🪔</div>
        <p class="text-xs font-semibold tracking-widest uppercase text-amber-400/80 mb-1">
          ✨ Shubh Deepavali ✨
        </p>
        <h2 class="text-2xl sm:text-3xl font-serif font-bold bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent mb-2">
          Happy Diwali
        </h2>
        <div class="flex items-center justify-center my-3 text-amber-400/50">
          <svg class="w-36 h-5 fill-none stroke-current stroke-1.5" viewBox="0 0 160 20">
            <path d="M10 10 Q 40 18, 70 10 Q 75 4, 80 1 Q 85 4, 90 10 Q 120 18, 150 10" />
            <circle cx="80" cy="5" r="2.5" class="fill-amber-400" />
            <circle cx="65" cy="10" r="1.5" class="fill-amber-400/80" />
            <circle cx="95" cy="10" r="1.5" class="fill-amber-400/80" />
          </svg>
        </div>
        <p id="greeting-recipient" class="text-sm font-semibold text-amber-200/90 tracking-wide mb-2"></p>
        <div class="my-3 max-h-44 sm:max-h-52 overflow-y-auto px-2">
          <p id="greeting-message" class="text-sm sm:text-base italic text-amber-100/95 leading-relaxed font-serif"></p>
        </div>
        <p id="greeting-sender" class="text-sm font-semibold text-amber-300 tracking-wide mt-2 mb-6"></p>
        <a
          id="whatsapp-reply-btn"
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full py-3.5 px-6 rounded-xl font-semibold text-xs sm:text-sm tracking-wider uppercase bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-amber-950 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer no-underline"
        >
          <span>Reply Happy Diwali on WhatsApp</span>
          <span class="text-base">✨</span>
        </a>
        <div class="mt-4">
          <a
            id="creator-badge"
            href="#create"
            class="text-xs font-medium text-amber-400/70 hover:text-amber-300 underline underline-offset-4 transition-colors cursor-pointer"
          >
            Create Your Own Wish ✨
          </a>
        </div>
      </div>
    `;

    parentContainer.appendChild(this.overlayEl);
    this.cardEl = this.overlayEl.querySelector('#greeting-card');
    this.recipientEl = this.overlayEl.querySelector('#greeting-recipient');
    this.messageEl = this.overlayEl.querySelector('#greeting-message');
    this.senderEl = this.overlayEl.querySelector('#greeting-sender');
    this.whatsappBtnEl = this.overlayEl.querySelector('#whatsapp-reply-btn');
    this.creatorBadgeEl = this.overlayEl.querySelector('#creator-badge');
  }

  public show(payload: GreetingPayload | null): void {
    const recipient = payload?.recipient?.trim() || 'Dear Friend';
    const message = payload?.message?.trim() ||
      'Wishing you and your loved ones a joyous, prosperous, and luminous Diwali! May this festival of lights illuminate your path with happiness and success.';
    const sender = payload?.sender?.trim() || 'A Well-Wisher';

    if (this.recipientEl) this.recipientEl.textContent = `To: ${recipient}`;
    if (this.messageEl) this.messageEl.textContent = `“${message}”`;
    if (this.senderEl) this.senderEl.textContent = `— With love, ${sender}`;

    if (this.whatsappBtnEl) {
      this.whatsappBtnEl.href = createWhatsAppReplyUrl(sender);
    }

    if (this.cardEl) {
      requestAnimationFrame(() => {
        this.cardEl?.classList.remove('opacity-0', 'scale-95', 'translate-y-4', 'pointer-events-none');
        this.cardEl?.classList.add('opacity-100', 'scale-100', 'translate-y-0', 'pointer-events-auto');
      });
    }
  }

  public hide(): void {
    if (this.cardEl) {
      this.cardEl.classList.remove('opacity-100', 'scale-100', 'translate-y-0', 'pointer-events-auto');
      this.cardEl.classList.add('opacity-0', 'scale-95', 'translate-y-4', 'pointer-events-none');
    }
  }

  public dispose(): void {
    this.overlayEl?.remove();
    this.overlayEl = null;
    this.cardEl = null;
    this.recipientEl = null;
    this.messageEl = null;
    this.senderEl = null;
    this.whatsappBtnEl = null;
    this.creatorBadgeEl = null;
  }
}
```

**Teardown Pattern (ASVS V14):**
Copy element removal and nullification from `src/interaction/touch-hint.ts` (lines 78-83).

---

### 2. `src/ui/whatsapp-link.ts` (utility, transform)

**Analog:** `src/ui/url-resolver.ts` & `src/crypto/greeting-codec.ts`

**Imports Pattern:**
Zero external imports; uses native JavaScript global APIs:
```typescript
/**
 * Generates an RFC 3986 compliant universal WhatsApp deep link URL.
 */
```

**Core Transformation Pattern:**
Copy sanitization and URI encoding pattern from `src/ui/url-resolver.ts` (lines 13-33):
```typescript
export function createWhatsAppReplyUrl(senderName?: string): string {
  const cleanSender = senderName?.trim();
  const baseMessage = cleanSender && cleanSender !== 'A Well-Wisher'
    ? `Thank you ${cleanSender} so much for the beautiful Diwali Diya greeting! Wishing you and your family a very Happy Diwali too! 🪔✨`
    : `Thank you so much for the beautiful Diwali Diya greeting! Wishing you and your family a very Happy Diwali too! 🪔✨`;

  return `https://wa.me/?text=${encodeURIComponent(baseMessage)}`;
}
```

**Validation & Fallback Pattern:**
Empty, whitespace-only, or default sender strings safely fall back to the generic heartfelt message, guaranteeing no undefined or trailing spacing issues in the generated URL.

---

### 3. `src/fx/celebration-manager.ts` (service, event-driven)

**Analog:** `src/interaction/touch-controller.ts` & `src/audio/sfx-synthesizer.ts`

**Imports Pattern:**
Copy library import pattern and internal service integration:
```typescript
import confetti from 'canvas-confetti';
import { AudioEngine } from '../audio/audio-engine';
```

**Pointer Event Binding & Coordinate Normalization Pattern:**
Copy listener setup, viewport ratio calculations, and bound handler references from `src/interaction/touch-controller.ts` (lines 60-69, 101-110):
```typescript
export class CelebrationManager {
  private isActive = false;
  private readonly onPointerDownBound: (e: PointerEvent) => void;

  constructor() {
    this.onPointerDownBound = this.handlePointerDown.bind(this);
    window.addEventListener('pointerdown', this.onPointerDownBound, { passive: true });
  }

  public setActive(active: boolean): void {
    this.isActive = active;
  }
```

**Click Delegation & Sparkle Trigger Pattern:**
Filter clicks targeting interactive elements (modal card, buttons, links), normalize pointer coordinates to `[0, 1]`, and trigger multisensory feedback:
```typescript
  public fireCelebrationBurst(): void {
    const festiveColors = ['#ffd700', '#ffa500', '#ff8c00', '#fff8dc', '#b8860b'];

    // Left cannon
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 70,
      origin: { x: 0.05, y: 0.85 },
      colors: festiveColors,
      startVelocity: 55,
      gravity: 0.9,
      ticks: 250,
      disableForReducedMotion: true,
    });

    // Right cannon
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 70,
      origin: { x: 0.95, y: 0.85 },
      colors: festiveColors,
      startVelocity: 55,
      gravity: 0.9,
      ticks: 250,
      disableForReducedMotion: true,
    });
  }

  private handlePointerDown(e: PointerEvent): void {
    if (!this.isActive) return;

    // Click delegation: Ignore clicks on card buttons, inputs, links
    const target = e.target as HTMLElement | null;
    if (target?.closest('#greeting-card, button, a, input, textarea')) {
      return;
    }

    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    const originX = Math.max(0, Math.min(1, e.clientX / width));
    const originY = Math.max(0, Math.min(1, e.clientY / height));

    confetti({
      origin: { x: originX, y: originY },
      particleCount: 25,
      spread: 45,
      startVelocity: 18,
      scalar: 0.65,
      ticks: 100,
      colors: ['#ffd700', '#ff9900', '#ffffff', '#ffcc00', '#ffa500'],
      disableForReducedMotion: true,
    });

    // Multisensory tactile and audio feedback (ASVS V5 safe fallback)
    try {
      AudioEngine.getInstance().playFlameCrackle();
    } catch {
      // Graceful no-op in headless test environment
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // Graceful no-op
      }
    }
  }

  public dispose(): void {
    this.isActive = false;
    window.removeEventListener('pointerdown', this.onPointerDownBound);
    try {
      confetti.reset();
    } catch {
      // Ignored if canvas not mounted
    }
  }
}
```

---

### 4. `src/graphics/scene-manager.ts` (controller, event-driven)

**Analog:** `src/graphics/scene-manager.ts` (self)

**State Transition Hook Pattern:**
Extend `handleStateChange` from `src/graphics/scene-manager.ts` (lines 256-280) to orchestrate `LIT_CELEBRATION` and `GREETING_REVEAL`:
```typescript
    } else if (state === 'LIT_CELEBRATION') {
      // 1500ms celebratory pause before transitioning to GREETING_REVEAL per D-01
      if (this.celebrationTimeoutId) clearTimeout(this.celebrationTimeoutId);
      this.celebrationTimeoutId = setTimeout(() => {
        this.fsm?.transition({ type: 'CELEBRATION_COMPLETE' });
      }, 1500);
    } else if (state === 'GREETING_REVEAL') {
      // Smooth camera tilt up by +0.20 units framing diya in lower third (D-01)
      this.cameraRig?.panTargetTo(new THREE.Vector3(0, 0.85, 0), 1200);

      // Launch celebratory golden confetti cannons (D-04)
      this.celebrationManager?.fireCelebrationBurst();

      // Unfurl glassmorphic greeting card with decrypted payload (D-01, D-02)
      this.greetingModal?.show(this.fsm?.getGreeting() ?? null);

      // Enable interactive tap-to-sparkle listener (D-05, VFX-05)
      this.celebrationManager?.setActive(true);
    }
```

**Component Instantiation & Teardown Pattern:**
In `buildSceneComponents` (lines 142-180), instantiate `GreetingModal` and `CelebrationManager`.  
In `disposeSceneComponents` & `dispose` (lines 397-458, 515-542), clean up the timeout, call `dispose()` on `GreetingModal` and `CelebrationManager`, and nullify references:
```typescript
    if (this.celebrationTimeoutId) {
      clearTimeout(this.celebrationTimeoutId);
      this.celebrationTimeoutId = null;
    }

    if (this.greetingModal) {
      this.greetingModal.dispose();
      this.greetingModal = null;
    }

    if (this.celebrationManager) {
      this.celebrationManager.dispose();
      this.celebrationManager = null;
    }
```

---

### 5. `src/main.ts` (config, lifecycle)

**Analog:** `src/main.ts` (self)

**Bootstrap Extension Pattern:**
Copy bootstrap return signature from `src/main.ts` (lines 15-40):
```typescript
export function bootstrap(): {
  fsm: AppStateMachine;
  passcodeGate: PasscodeGate;
  sceneManager: SceneManager;
  audioToggle: AudioToggle;
}
```
`SceneManager` self-encapsulates `GreetingModal` and `CelebrationManager` within its scene graph and container lifecycle, maintaining backward compatibility with the existing bootstrap export signature while exposing getters (`sceneManager.getGreetingModal()`, `sceneManager.getCelebrationManager()`) for testing.

---

### 6. `tests/ui/greeting-modal.test.ts` (test, assertions)

**Analog:** `tests/interaction/touch-hint.test.ts` & `tests/ui/passcode-gate.test.ts`

**Imports Pattern:**
Copy testing structure from `tests/interaction/touch-hint.test.ts` (lines 1-7):
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GreetingModal } from '../../src/ui/greeting-modal';
import type { GreetingPayload } from '../../src/crypto/types';
```

**Core Test Structure:**
Copy mounting, textContent verification, and CSS class assertions:
```typescript
describe('GreetingModal Component', () => {
  let container: HTMLElement;
  let modal: GreetingModal;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
    modal = new GreetingModal();
  });

  afterEach(() => {
    modal.dispose();
    container.remove();
  });

  it('mounts glassmorphic overlay with id greeting-modal-overlay and card skeleton', () => {
    modal.mount(container);
    const card = document.getElementById('greeting-card');
    expect(card).not.toBeNull();
    expect(card?.className).toContain('backdrop-blur-xl');
    expect(card?.className).toContain('opacity-0');
  });

  it('safely injects recipient, message, and sender strictly via textContent per ASVS V5', () => {
    modal.mount(container);
    const xssPayload: GreetingPayload = {
      recipient: '<script>alert("xss")</script>Priya',
      sender: '<img src=x onerror=alert(1)>Aarav',
      message: '<b>Bold</b> wishing <iframe src="evil.com"></iframe>',
    };

    modal.show(xssPayload);

    const recipientEl = document.getElementById('greeting-recipient');
    const senderEl = document.getElementById('greeting-sender');
    const messageEl = document.getElementById('greeting-message');

    // Plain text verification — no tags rendered into DOM
    expect(recipientEl?.textContent).toContain('<script>alert("xss")</script>Priya');
    expect(senderEl?.textContent).toContain('<img src=x onerror=alert(1)>Aarav');
    expect(messageEl?.textContent).toContain('<b>Bold</b> wishing <iframe src="evil.com"></iframe>');
    expect(document.querySelector('script[src]')).toBeNull();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('applies fallback defaults when payload attributes are empty or null', () => {
    modal.mount(container);
    modal.show(null);

    const recipientEl = document.getElementById('greeting-recipient');
    const senderEl = document.getElementById('greeting-sender');

    expect(recipientEl?.textContent).toContain('Dear Friend');
    expect(senderEl?.textContent).toContain('A Well-Wisher');
  });

  it('cleans up DOM and references on dispose()', () => {
    modal.mount(container);
    expect(document.getElementById('greeting-modal-overlay')).not.toBeNull();

    modal.dispose();
    expect(document.getElementById('greeting-modal-overlay')).toBeNull();
  });
});
```

---

### 7. `tests/ui/whatsapp-link.test.ts` (test, assertions)

**Analog:** `tests/ui/url-resolver.test.ts`

**Imports Pattern:**
```typescript
import { describe, it, expect } from 'vitest';
import { createWhatsAppReplyUrl } from '../../src/ui/whatsapp-link';
```

**Core Assertions Pattern:**
Verify RFC 3986 encoding and emoji safety:
```typescript
describe('createWhatsAppReplyUrl', () => {
  it('generates wa.me URL with sender name and encoded festive emojis', () => {
    const url = createWhatsAppReplyUrl('Aarav');
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);

    const decoded = decodeURIComponent(url.replace('https://wa.me/?text=', ''));
    expect(decoded).toContain('Thank you Aarav so much for the beautiful Diwali Diya greeting!');
    expect(decoded).toContain('🪔✨');
  });

  it('falls back to generic text when sender name is empty or default', () => {
    const urlDefault = createWhatsAppReplyUrl('A Well-Wisher');
    const decoded = decodeURIComponent(urlDefault.replace('https://wa.me/?text=', ''));
    expect(decoded).toContain('Thank you so much for the beautiful Diwali Diya greeting!');
    expect(decoded).not.toContain('A Well-Wisher');
  });
});
```

---

### 8. `tests/fx/celebration-manager.test.ts` (test, assertions)

**Analog:** `tests/interaction/touch-controller.test.ts` & `tests/graphics/fx/sparkler-system.test.ts`

**Imports & Mock Pattern:**
Mock `canvas-confetti` since Happy-DOM lacks a full 2D Canvas context:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import confetti from 'canvas-confetti';
import { CelebrationManager } from '../../src/fx/celebration-manager';
import { AudioEngine } from '../../src/audio/audio-engine';

vi.mock('canvas-confetti', () => {
  const mockConfetti = vi.fn();
  (mockConfetti as any).reset = vi.fn();
  return { default: mockConfetti };
});
```

**Core Assertions Pattern:**
Verify dual-cannon parameters, click delegation, coordinate normalization, and teardown:
```typescript
describe('CelebrationManager', () => {
  let manager: CelebrationManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new CelebrationManager();
  });

  afterEach(() => {
    manager.dispose();
  });

  it('fireCelebrationBurst invokes confetti twice with left and right cannon origins', () => {
    manager.fireCelebrationBurst();
    expect(confetti).toHaveBeenCalledTimes(2);

    expect(confetti).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        angle: 60,
        particleCount: 80,
        origin: { x: 0.05, y: 0.85 },
      })
    );

    expect(confetti).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        angle: 120,
        particleCount: 80,
        origin: { x: 0.95, y: 0.85 },
      })
    );
  });

  it('normalizes pointerdown coordinates to [0, 1] origin and triggers tap sparkle when active', () => {
    manager.setActive(true);

    window.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: 200,
        clientY: 300,
        bubbles: true,
      })
    );

    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 25,
        spread: 45,
        origin: {
          x: expect.any(Number),
          y: expect.any(Number),
        },
      })
    );
  });

  it('ignores pointerdown events targeting the greeting card or interactive buttons', () => {
    manager.setActive(true);
    const card = document.createElement('div');
    card.id = 'greeting-card';
    const button = document.createElement('button');
    card.appendChild(button);
    document.body.appendChild(card);

    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

    expect(confetti).not.toHaveBeenCalled();
    card.remove();
  });
});
```

---

### 9. `tests/graphics/scene-manager.test.ts` (test, assertions)

**Analog:** `tests/graphics/scene-manager.test.ts` (self)

**State Machine Transition & Timer Test Pattern:**
Copy timer and FSM advancement pattern from `tests/graphics/scene-manager.test.ts` (lines 266-299):
```typescript
  it('automatically advances LIT_CELEBRATION to GREETING_REVEAL after 1500ms delay per D-01', async () => {
    vi.useFakeTimers();

    sceneManager = new SceneManager(container, fsm);
    sceneManager.start();

    // Advance to LIT_CELEBRATION
    fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });
    fsm.transition({
      type: 'UNLOCK_SUCCESS',
      payload: { recipient: 'Priya', sender: 'Aarav', message: 'Happy Diwali' },
    });
    fsm.transition({ type: 'INTRO_COMPLETE' });
    fsm.transition({ type: 'WICK_TOUCHED' });
    fsm.transition({ type: 'IGNITION_COMPLETE' });

    expect(fsm.getState()).toBe('LIT_CELEBRATION');

    // Fast-forward 1500ms celebratory delay
    vi.advanceTimersByTime(1500);

    expect(fsm.getState()).toBe('GREETING_REVEAL');

    vi.useRealTimers();
  });
```

---

## Shared Patterns

### 1. ASVS V5 Output Encoding / XSS Immunity
**Source:** `src/ui/passcode-gate.ts` (lines 102-106)  
**Apply to:** `src/ui/greeting-modal.ts` and all user-facing text nodes.  
Never concatenate user payload strings into `innerHTML`. Static layout structures (cards, SVG motifs, button containers) are declared once as safe static templates; user payload values (`recipient`, `sender`, `message`) are set exclusively through `element.textContent = value`.

### 2. Normalized Screen-to-Viewport Coordinate Mapping & Click Delegation
**Source:** `src/interaction/touch-controller.ts` (lines 101-115)  
**Apply to:** `src/fx/celebration-manager.ts`  
Convert pointer pixels to unitless `[0, 1]` coordinates:
```typescript
const originX = Math.max(0, Math.min(1, clientX / window.innerWidth));
const originY = Math.max(0, Math.min(1, clientY / window.innerHeight));
```
Click delegation inspects `e.target.closest('#greeting-card, button, a')` to ensure celebration particles never fire when clicking interactive buttons or links.

### 3. Graceful Degradation / Headless Environment Shielding
**Source:** `src/audio/sfx-synthesizer.ts` (lines 23-26) & `src/graphics/scene-manager.ts` (lines 88-103)  
**Apply to:** `src/fx/celebration-manager.ts`, `src/graphics/scene-manager.ts`  
Surround Web Audio (`AudioEngine.getInstance().playFlameCrackle()`), Confetti resets (`confetti.reset()`), and haptic vibrations (`navigator.vibrate`) with try/catch blocks or defensive feature checks (`'vibrate' in navigator`), ensuring zero crashes in headless Vitest + Happy-DOM test runs.

### 4. Component Lifecycle & Teardown Protocol
**Source:** `src/interaction/touch-hint.ts` (lines 78-83) & `src/graphics/scene-manager.ts` (lines 515-542)  
**Apply to:** All components (`GreetingModal`, `CelebrationManager`, `SceneManager`)  
Every component provides a strict `dispose()` method:
1. Deactivates operational flags (`isActive = false`)
2. Removes registered event listeners (`removeEventListener(...)`) using exact bound references
3. Clears pending timers (`clearTimeout(...)`)
4. Resets 2D/3D canvas states (`confetti.reset()`)
5. Removes DOM nodes (`element.remove()`) and nullifies references

---

## No Analog Found

None. All Phase 5 components and utilities have exact, battle-tested analogs in the existing repository.

---

## Metadata

**Analog search scope:** `src/`, `tests/`  
**Files scanned:** 68 (41 src, 27 tests)  
**Pattern extraction date:** 2026-11-04  
