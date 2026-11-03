# Phase 1: Core Architecture, State Machine & Cryptographic Codec - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-03  
**Phase:** 01-Core Architecture, State Machine & Cryptographic Codec  
**Areas discussed:** Builder discretion (user skipped questioning)  

---

## Gray Areas Presented

| Option | Description | Selected |
|---|---|---|
| Passcode Gate UI & Input Style | 4-6 digit PIN boxes vs stylish alphanumeric input with gold festive accents | Discretion |
| Direct Visit Fallback | What to display if someone opens the site directly without a customized link (Demo greeting vs Creator link) | Discretion |
| Unlock Animation & Transition | Visual dissolve/camera push when correct passcode is entered | Discretion |
| Error & Rejection Feedback | How the portal responds when an incorrect passcode is typed | Discretion |

**User's choice:** "leave skip this phase"  
**Notes:** User chose to skip interactive questioning and defer to research-backed architecture and implementation decisions.

---

## Builder's Discretion

All implementation decisions for Phase 1 are locked based on comprehensive domain research (`SUMMARY.md`, `ARCHITECTURE.md`, `STACK.md`):
- Single auto-capitalizing passcode input with gold Diwali aesthetic.
- Native `SubtleCrypto` AES-GCM (256-bit) + PBKDF2 + `lz-string` URL hash codec.
- Direct visit fallback featuring built-in demo greeting + creator mode link.
- Friendly shake animation and alert for invalid passcode.
- Strongly-typed `AppStateMachine` and `100svh` touch-contained viewport.

## Deferred Ideas

None — discussion remained strictly within Phase 1 scope.
