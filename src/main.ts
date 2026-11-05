import './style.css';
import { AppStateMachine } from './app/state-machine';
import { resolveGreetingToken } from './ui/url-resolver';
import { PasscodeGate } from './ui/passcode-gate';
import { SceneManager } from './graphics/scene-manager';
import { AudioToggle } from './ui/audio-toggle';
import { CreatorPortal } from './ui/creator-portal';
import { OrderModal } from './ui/order-modal';

/**
 * Main application bootstrap for Diwali 3D Wishes.
 *
 * Initializes the finite state machine, resolves token from URL hash/query
 * with Meta link-shim sanitization, starts the 3D WebGL SceneManager,
 * mounts the PasscodeGate controller, attaches the floating AudioToggle,
 * mounts the CreatorPortal modal generator, and attaches the OrderModal.
 */
export function bootstrap(): {
  fsm: AppStateMachine;
  passcodeGate: PasscodeGate;
  sceneManager: SceneManager;
  audioToggle: AudioToggle;
  creatorPortal: CreatorPortal;
  orderModal: OrderModal;
} {
  const fsm = new AppStateMachine();
  const tokenInfo = resolveGreetingToken();

  const sceneContainer = document.getElementById('app') ?? document.body;
  const sceneManager = new SceneManager(sceneContainer, fsm);
  sceneManager.start();

  const passcodeGate = new PasscodeGate(fsm, tokenInfo);
  passcodeGate.mount();

  const audioToggle = new AudioToggle();
  audioToggle.mount(sceneContainer);

  const creatorPortal = new CreatorPortal({ container: sceneContainer });
  creatorPortal.mount();

  const orderModal = new OrderModal(sceneContainer);
  orderModal.mount();

  fsm.transition({
    type: 'BOOT_COMPLETE',
    hasCiphertext: !tokenInfo.isDemo && !!tokenInfo.token,
  });

  return { fsm, passcodeGate, sceneManager, audioToggle, creatorPortal, orderModal };
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
      (window as unknown as { __DIWALI__: ReturnType<typeof bootstrap> }).__DIWALI__ = bootstrap();
    });
  } else {
    // Already loaded
    (window as unknown as { __DIWALI__: ReturnType<typeof bootstrap> }).__DIWALI__ = bootstrap();
  }
}
