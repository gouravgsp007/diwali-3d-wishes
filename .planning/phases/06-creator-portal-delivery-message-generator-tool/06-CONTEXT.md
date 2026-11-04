# Phase 6: Creator Portal & Delivery Message Generator Tool - Context

**Gathered:** 2026-11-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the seller/creator-side experience enabling effortless creation of personalized, encrypted Diwali wishes:
1. `CREATOR-01`: Standalone creator/buyer web generator modal/route allowing users to input Recipient Name, Sender Name, Custom Festive Message, and Secret Passcode (4-6 chars), encrypting locally via `GreetingCodec.encrypt()` to generate a self-contained shareable URL (`#d=...`).
2. `CREATOR-02`: 1-click clipboard copy of pre-formatted, emoji-rich WhatsApp & Instagram DM delivery template containing the encrypted wish URL and clear unlock instructions for the recipient.
3. Complete end-to-end cryptographic round-trip: the URL and passcode produced in the Creator Portal unlock seamlessly in the recipient view.

</domain>

<decisions>
## Implementation Decisions

### 1. Dedicated Creator Portal Interface & Routing
- **D-01:** **Hash Routing & Direct Access**:
  - Accessible via URL hash fragment `#create` (e.g., `https://domain.com/#create`).
  - Automatically triggered when user taps the "Create Your Own Wish ✨" badge in the greeting reveal modal or visits `#create` directly.
  - Listens to `window.addEventListener('hashchange', ...)` to open/close dynamically without full-page reloads.
  - Close button (`✕`) and backdrop tap safely clear `#create` from the URL and return to the main view.

### 2. Glassmorphic Creator Modal UI
- **D-02:** **Visual Design & Typography**:
  - Full-screen glassmorphic overlay (`fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto`).
  - Card container with warm festive gold accents (`bg-neutral-950/90 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl shadow-amber-950/40`).
  - Header: *"Diwali Wish Generator 🪔"* with gold shimmer serif gradient.
  - Subtitle: *"Craft an intimate 3D Diya wish for your loved ones in seconds. 100% free, private & encrypted."*

### 3. Interactive Input Fields & Validation
- **D-03:** **Form Fields & Validation**:
  - `Recipient Name`: Required text input, max 50 chars (e.g., "Priya").
  - `Sender Name`: Required text input, max 50 chars (e.g., "Rahul & Family").
  - `Custom Wish Message`: Textarea with live character counter (max 300 chars), with a high-converting default festive message pre-filled.
  - `Secret Passcode`: Text input, min 4, max 6 chars, auto-trimmed and normalized to uppercase.
  - Client-side validation: Clear error hints below inputs if fields are empty or passcode is under 4 characters.

### 4. Client-Side Encryption & Link Generation (`CREATOR-01`)
- **D-04:** **Zero-Backend Link Generation**:
  - Uses existing `GreetingCodec.encrypt(payload, passcode)` (AES-GCM 256-bit + PBKDF2 100k iterations + `lz-string` compression).
  - Formats canonical shareable link: `${window.location.origin}${window.location.pathname}#d=${ciphertext}`.
  - Instant generation with zero network latency, zero database dependencies, and $0 server cost.

### 5. Delivery Message Template & 1-Click Clipboard Actions (`CREATOR-02`)
- **D-05:** **Formatted WhatsApp / Instagram DM Template**:
  - Pre-formatted emoji-rich delivery message:
    ```text
    🪔✨ *A Special Diwali Surprise for you, {recipient}!* ✨🪔

    {sender} has sent you a magical interactive 3D Diwali Diya wish! 

    Light your ceremonial Diya and unlock your personalized festive greeting here:
    👉 {generatedUrl}

    🔑 *Your Secret Unlock Passcode:* *{passcode}*

    Wishing you a joyous and luminous Deepavali! 🪔✨
    ```
- **D-06:** **1-Click Copy & Direct WhatsApp Share**:
  - Dual action buttons:
    1. "Copy Message 📋" button with robust clipboard fallback (`navigator.clipboard.writeText` + `document.execCommand('copy')`) and animated "Copied to Clipboard! ✅" feedback badge.
    2. "Share on WhatsApp 💬" button opening universal deep link `https://wa.me/?text=...` directly.
    3. "Test Wish ↗" button opening the generated link in a new tab to test recipient view immediately.

### 6. Component Encapsulation & Teardown
- **D-07:** **Lifecycle & Memory Management**:
  - `CreatorPortal` class in `src/ui/creator-portal.ts` mounts to parent container.
  - Clean `dispose()` method removing event listeners, hashchange handler, and DOM nodes per ASVS V14.
  - Full automated Vitest test suite for form validation, link generation, message formatting, and clipboard operations.

</decisions>

<canonical_refs>
## Canonical References

- `GEMINI.md` § Zero-Tech Passcode & Greeting Storage Architecture
- `.planning/REQUIREMENTS.md` § CREATOR-01, CREATOR-02
- `.planning/phases/01-core-architecture-state-machine-cryptographic-codec/01-01-SUMMARY.md` — `GreetingCodec.encrypt()`
- `.planning/phases/05-festive-greeting-reveal-typography-celebration-polish/05-01-SUMMARY.md` — `#create` anchor link in `GreetingModal`
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Utilities
- `src/crypto/greeting-codec.ts`: `GreetingCodec.encrypt(payload, passcode)` returns compressed ciphertext token.
- `src/crypto/types.ts`: `GreetingPayload` interface (`recipient`, `sender`, `message`, `timestamp`).
- `src/ui/whatsapp-link.ts`: RFC 3986 encoding patterns with 4-byte UTF-8 emojis.
- `src/ui/greeting-modal.ts`: Creator badge link `#create`.
- `src/main.ts`: Bootstrap lifecycle into which `CreatorPortal` will be mounted.

</code_context>
