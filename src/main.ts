import './style.css';
import { AppStateMachine } from './app/state-machine';
import { resolveGreetingToken } from './ui/url-resolver';
import { PasscodeGate } from './ui/passcode-gate';
import { SceneManager } from './graphics/scene-manager';

/**
 * Main application bootstrap for Diwali 3D Wishes.
 *
 * Initializes the finite state machine, resolves token from URL hash/query
 * with Meta link-shim sanitization, starts the 3D WebGL SceneManager,
 * and mounts the PasscodeGate controller.
 */
export function bootstrap(): {
  fsm: AppStateMachine;
  passcodeGate: PasscodeGate;
  sceneManager: SceneManager;
} {
  const fsm = new AppStateMachine();
  const tokenInfo = resolveGreetingToken();

  const sceneContainer = document.getElementById('app') ?? document.body;
  const sceneManager = new SceneManager(sceneContainer, fsm);
  sceneManager.start();

  const passcodeGate = new PasscodeGate(fsm, tokenInfo);
  passcodeGate.mount();

  fsm.transition({
    type: 'BOOT_COMPLETE',
    hasCiphertext: !tokenInfo.isDemo && !!tokenInfo.token,
  });

  return { fsm, passcodeGate, sceneManager };
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => bootstrap());
  } else {
    // Already loaded
    bootstrap();
  }
}
