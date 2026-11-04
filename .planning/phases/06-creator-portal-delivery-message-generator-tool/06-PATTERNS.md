# Phase 6: Creator Portal & Delivery Message Generator Tool - Patterns

**Mapped:** 2026-11-04
**Domain:** Codebase Conventions, Analogous Components & Implementation Contracts

---

## 1. Architectural Analogs in Codebase

| New Component | Closest Existing Analog | Pattern to Mirror |
|---------------|-------------------------|-------------------|
| `src/ui/creator-portal.ts` | `src/ui/passcode-gate.ts`, `src/ui/greeting-modal.ts` | DOM mounting into parent container, Tailwind CSS glassmorphic overlay, clean separation of static markup and dynamic DOM nodes, strict `element.textContent` or form value manipulation, full `dispose()` deallocation. |
| `src/utils/clipboard.ts` | `src/ui/whatsapp-link.ts` | Pure utility functions with zero side effects, browser feature detection, graceful fallback paths, full unit test coverage. |
| `src/ui/delivery-message.ts` | `src/ui/whatsapp-link.ts` | RFC 3986 encoding, UTF-8 4-byte emoji handling, string formatting with defensive fallbacks. |

---

## 2. Component Design Contract: `CreatorPortal`

```typescript
export interface CreatorPortalOptions {
  container: HTMLElement;
  onWishCreated?: (url: string, passcode: string) => void;
  onClose?: () => void;
}

export class CreatorPortal {
  private overlayEl: HTMLElement | null = null;
  private formEl: HTMLFormElement | null = null;
  private recipientInput: HTMLInputElement | null = null;
  private senderInput: HTMLInputElement | null = null;
  private messageInput: HTMLTextAreaElement | null = null;
  private passcodeInput: HTMLInputElement | null = null;
  private charCountEl: HTMLElement | null = null;
  private generateBtn: HTMLButtonElement | null = null;
  private resultSection: HTMLElement | null = null;
  private shareUrlInput: HTMLInputElement | null = null;
  private copyLinkBtn: HTMLButtonElement | null = null;
  private copyMessageBtn: HTMLButtonElement | null = null;
  private shareWhatsAppBtn: HTMLAnchorElement | null = null;
  private testLinkBtn: HTMLAnchorElement | null = null;
  private closeBtn: HTMLButtonElement | null = null;
  private onHashChangeBound: () => void;

  constructor(private readonly options: CreatorPortalOptions) {
    this.onHashChangeBound = this.handleHashChange.bind(this);
    window.addEventListener('hashchange', this.onHashChangeBound);
  }

  public mount(): void;
  public show(): void;
  public hide(): void;
  public isOpen(): boolean;
  public dispose(): void;
}
```

---

## 3. Formatting & Security Patterns

1. **ASVS V5 XSS Prevention**:
   - Preview boxes use `element.textContent` or `<textarea readonly>` elements.
   - Text inputs enforce length attributes (`maxlength="50"`, `maxlength="300"`).
2. **ASVS V14 Cleanup**:
   - `dispose()` removes `hashchange` listener, cleans up DOM nodes, and clears input references.
3. **Responsive Glassmorphism**:
   - `max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 bg-neutral-950/90 border border-amber-500/40 shadow-2xl` ensures optimal fit across iPhone SE, iPhone 14 Pro, Samsung Galaxy, and desktop viewports.
