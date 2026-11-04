# Phase 6: Creator Portal & Delivery Message Generator Tool - Research

**Researched:** 2026-11-04
**Domain:** Creator Generator UI, Client-Side Cryptographic URL Synthesis, Clipboard Fallbacks & Viral WhatsApp Copy

---

## 1. Executive Summary

Phase 6 delivers the customer-facing creation tool that enables the entire business model: empowering users to craft personalized, encrypted 3D Diwali greetings for their loved ones in under 30 seconds with zero signup friction, zero database overhead ($0/month hosting cost), and 100% end-to-end privacy.

Requirements addressed:
- **CREATOR-01**: Creator/buyer inputs recipient name, sender name, custom wish message, and secret passcode to generate a self-contained encrypted URL hash (`#d=...`).
- **CREATOR-02**: Creator/buyer can 1-click copy a pre-formatted, emoji-rich WhatsApp & Instagram DM delivery template containing the encrypted link and recipient unlock instructions.

---

## 2. Technical Architecture & Component Design

### 2.1 Routing & Trigger Integration

The Creator Portal needs to be easily accessible both from the greeting card ("Create Your Own Wish ✨" link created in Phase 5) and via direct URL navigation:
- Trigger 1: Visiting `https://domain/#create` directly opens the Creator Portal.
- Trigger 2: Clicking the `#creator-badge` in `GreetingModal` triggers a `hashchange` event.
- Trigger 3: Header or footer access link.

```typescript
// Hash change listener pattern
window.addEventListener('hashchange', () => {
  if (window.location.hash.startsWith('#create')) {
    creatorPortal.show();
  } else if (!window.location.hash.startsWith('#create') && creatorPortal.isOpen()) {
    creatorPortal.hide();
  }
});
```

When closing the portal, the URL hash can be cleared cleanly via:
```typescript
if (window.location.hash.startsWith('#create')) {
  history.replaceState(null, '', window.location.pathname + window.location.search);
}
```

### 2.2 Form Validation & Security Architecture

1. **Input Fields**:
   - `Recipient Name`: 1–50 characters. Stripped of control characters.
   - `Sender Name`: 1–50 characters. Stripped of control characters.
   - `Custom Wish Message`: 1–300 characters. Live character counter display (`${charsLeft} characters remaining`).
   - `Passcode`: 4–6 characters/digits. Case-insensitive normalization (converted to uppercase for display and encryption consistency).

2. **XSS Protection**:
   - The creator portal generates payloads that are encrypted and placed in the URL hash.
   - All preview elements and message containers in the creator portal must also render text via `textContent` or safe DOM text nodes to preserve strict ASVS V5 compliance.

### 2.3 Cryptographic Synthesis via GreetingCodec

In Phase 1, `GreetingCodec.encrypt(payload: GreetingPayload, passcode: string): Promise<string>` was created and thoroughly verified:
- Algorithm: AES-GCM 256-bit with PBKDF2 (100,000 SHA-256 iterations).
- Token format: `lz-string` compressed base64 containing `{ salt, iv, ciphertext }`.
- Deterministic round-trip: Entering the exact same passcode into `PasscodeGate` / `GreetingCodec.decrypt()` yields the identical `GreetingPayload`.

```typescript
const payload: GreetingPayload = {
  recipient: recipientInput.value.trim(),
  sender: senderInput.value.trim(),
  message: messageInput.value.trim(),
  timestamp: Date.now()
};

const token = await GreetingCodec.encrypt(payload, passcode.trim().toUpperCase());
const shareableUrl = `${window.location.origin}${window.location.pathname}#d=${token}`;
```

### 2.4 Resilient Multi-Platform Clipboard Strategy

Inside Instagram, Facebook, and WhatsApp in-app WebViews, `navigator.clipboard.writeText()` can fail due to permission delegation restrictions or secure-context anomalies. A resilient dual-tier copy utility is essential:

```typescript
export async function copyToClipboard(text: string): Promise<boolean> {
  // Strategy 1: Modern Async Clipboard API
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // Strategy 2: Legacy textarea execCommand fallback
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.select();
    const successful = document.execCommand('copy');
    textarea.remove();
    return successful;
  } catch {
    return false;
  }
}
```

### 2.5 Delivery Message Formatting

The message template must be visually inviting, culturally celebratory, and crystal clear about how to unlock the gift:

```text
🪔✨ *A Special Diwali Surprise for you, {recipient}!* ✨🪔

{sender} has sent you a magical interactive 3D Diwali Diya wish! 

Light your ceremonial Diya and unlock your personalized festive greeting here:
👉 {shareableUrl}

🔑 *Your Secret Unlock Passcode:* *{passcode}*

Wishing you a joyous and luminous Deepavali! 🪔✨
```

Features:
- WhatsApp bolding syntax `*word*` works natively across WhatsApp, Telegram, and Signal.
- Direct link with pointing hand emoji `👉` draws immediate attention.
- Clear passcode callout with key emoji `🔑` ensures the recipient knows what to enter immediately upon landing.
- Universal WhatsApp Web / Mobile deep link generator (`https://wa.me/?text=${encodeURIComponent(deliveryText)}`).

---

## 3. Threat Modeling & Risk Mitigation

| Risk | Mitigation |
|------|------------|
| In-App Browser Clipboard Restriction | Resilient fallback to `document.execCommand('copy')` if `navigator.clipboard` rejects. |
| Passcode Mismatch / Typing Error | Passcode field provides an eye toggle ("Show/Hide") and trims leading/trailing whitespace. Form enforces 4-6 chars. |
| Long Wish Messages Exceeding URL Limits | Limit custom message to 300 characters. Compressed with `lz-string` (<400 bytes), safe for all mobile URL limits (<2000 chars). |
| Accidental Navigation Data Loss | Form warns or preserves draft state if user accidentally taps backdrop. |

---

## 4. Open Questions (RESOLVED)

### RESOLVED: Should Creator Portal be a separate HTML page or a modal in the SPA?
- **Decision:** Modal within the single-page application mounted to `#app` and routed via `#create`.
- **Rationale:** Keeps the single-bundle architecture, avoids duplicate Three.js/Tailwind asset loading, maintains instant transitions without page refreshes, and complies with zero-backend deployment.

---

## 5. Phase Plan Breakdown

- **Plan 06-01**: Clipboard Utility & Delivery Message Formatter with unit tests.
- **Plan 06-02**: CreatorPortal Glassmorphic UI Controller, form validation, client-side encryption, link generation, `#create` hash routing, and full integration tests.
