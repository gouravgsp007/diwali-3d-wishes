import './style.css';
import { AppStateMachine } from './app/state-machine';
import { resolveGreetingToken } from './ui/url-resolver';
import { PasscodeGate } from './ui/passcode-gate';
import { SceneManager } from './graphics/scene-manager';
import { AudioToggle } from './ui/audio-toggle';
import { CreatorPortal } from './ui/creator-portal';
import { OrderModal } from './ui/order-modal';
import { FestiveActionBar } from './ui/festive-action-bar';
import { ShowcaseModal } from './ui/showcase-modal';
import { ThemeRegistry } from './themes/theme-registry';

/**
 * Main application bootstrap for Diwali 3D Wishes.
 *
 * Initializes the finite state machine, resolves token from URL hash/query
 * with Meta link-shim sanitization, starts the 3D WebGL SceneManager,
 * mounts the PasscodeGate controller, attaches the floating AudioToggle,
 * mounts the CreatorPortal modal generator (with Admin exclusive soundtrack selector),
 * attaches the OrderModal, mounts the FestiveActionBar, and mounts the ShowcaseModal.
 */
export function bootstrap(): {
  fsm: AppStateMachine;
  passcodeGate: PasscodeGate;
  sceneManager: SceneManager;
  audioToggle: AudioToggle;
  creatorPortal: CreatorPortal;
  orderModal: OrderModal;
  festiveActionBar: FestiveActionBar;
  showcaseModal: ShowcaseModal;
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

  const orderModal = new OrderModal(sceneContainer, 'dreamroutes07');
  orderModal.mount();

  const festiveActionBar = new FestiveActionBar(sceneContainer, sceneManager);
  festiveActionBar.mount();

  // Show festive action bar only during GREETING_REVEAL for free exploration; hide during ceremony
  fsm.subscribe((state) => {
    if (state === 'GREETING_REVEAL') {
      festiveActionBar.show();
    } else {
      festiveActionBar.hide();
    }
  });

  const showcaseModal = new ShowcaseModal({
    container: sceneContainer,
    instagramHandle: 'dreamroutes07',
    onSelectOccasion: (occasion) => {
      const theme = ThemeRegistry.getInstance().get(occasion);
      if (theme) {
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('theme', occasion);
          url.hash = '';
          history.replaceState(null, '', url.toString());
        }

        sceneManager.switchTheme(theme, true);
        festiveActionBar.updateForTheme(theme);
        passcodeGate.updateThemeContent(occasion);
        passcodeGate.hideModal();

        fsm.transition({
          type: 'UNLOCK_SUCCESS',
          payload: {
            recipient: 'You',
            sender: 'dreamroutes07',
            message: theme.subtitle,
            templateId: occasion,
            createdAt: Date.now(),
          },
        });
      }
    },
  });
  showcaseModal.mount();

  fsm.transition({
    type: 'BOOT_COMPLETE',
    hasCiphertext: !tokenInfo.isDemo && !!tokenInfo.token,
  });

  return { fsm, passcodeGate, sceneManager, audioToggle, creatorPortal, orderModal, festiveActionBar, showcaseModal };
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
