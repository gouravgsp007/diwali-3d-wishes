import './style.css';
import { AppStateMachine } from './app/state-machine';
import { resolveGreetingToken } from './ui/url-resolver';
import { PasscodeGate } from './ui/passcode-gate';

/**
 * Main application bootstrap for Diwali 3D Wishes.
 *
 * Initializes the finite state machine, resolves token from URL hash/query
 * with Meta link-shim sanitization, and mounts the PasscodeGate controller.
 */
export function bootstrap(): { fsm: AppStateMachine; passcodeGate: PasscodeGate } {
  const fsm = new AppStateMachine();
  const tokenInfo = resolveGreetingToken();

  const passcodeGate = new PasscodeGate(fsm, tokenInfo);
  passcodeGate.mount();

  fsm.transition({
    type: 'BOOT_COMPLETE',
    hasCiphertext: !tokenInfo.isDemo && !!tokenInfo.token,
  });

  return { fsm, passcodeGate };
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => bootstrap());
  } else {
    // Already loaded
    bootstrap();
  }
}
