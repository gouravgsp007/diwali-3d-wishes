import type { GreetingPayload } from '../crypto/types';

export type AppState =
  | 'BOOT'
  | 'LOCKED'
  | 'UNLOCKED_INTRO'
  | 'INTERACTIVE_UNLIT'
  | 'IGNITING'
  | 'RANGOLI_CEREMONY'
  | 'LIT_CELEBRATION'
  | 'GREETING_REVEAL';

export type AppEvent =
  | { type: 'BOOT_COMPLETE'; hasCiphertext: boolean }
  | { type: 'UNLOCK_SUCCESS'; payload: GreetingPayload }
  | { type: 'INTRO_COMPLETE' }
  | { type: 'WICK_TOUCHED' }
  | { type: 'ACTION_TRIGGERED' }
  | { type: 'IGNITION_COMPLETE' }
  | { type: 'ACTION_COMPLETE' }
  | { type: 'START_RANGOLI' }
  | { type: 'RANGOLI_COMPLETE' }
  | { type: 'SKIP_RANGOLI' }
  | { type: 'CELEBRATION_COMPLETE' }
  | { type: 'REPLAY' };

export class AppStateMachine {
  private currentState: AppState = 'BOOT';
  private subscribers: Array<(state: AppState, payload?: GreetingPayload) => void> = [];
  private greetingData: GreetingPayload | null = null;

  public getState(): AppState {
    return this.currentState;
  }

  public get state(): AppState {
    return this.currentState;
  }

  public getGreeting(): GreetingPayload | null {
    return this.greetingData;
  }

  public get payload(): GreetingPayload | null {
    return this.greetingData;
  }

  public transition(event: AppEvent): AppState {
    if (event.type === 'UNLOCK_SUCCESS' && this.currentState !== 'BOOT') {
      this.greetingData = event.payload;
      this.currentState = 'UNLOCKED_INTRO';
      this.notify(this.currentState, this.greetingData ?? undefined);
      return this.currentState;
    }

    const prev = this.currentState;

    switch (this.currentState) {
      case 'BOOT':
        if (event.type === 'BOOT_COMPLETE') {
          this.currentState = 'LOCKED';
        }
        break;
      case 'LOCKED':
        // UNLOCK_SUCCESS is handled globally above
        break;
      case 'UNLOCKED_INTRO':
        if (event.type === 'INTRO_COMPLETE') {
          this.currentState = 'INTERACTIVE_UNLIT';
        }
        break;
      case 'INTERACTIVE_UNLIT':
        if (event.type === 'WICK_TOUCHED' || event.type === 'ACTION_TRIGGERED') {
          this.currentState = 'IGNITING';
        }
        break;
      case 'IGNITING':
        if (event.type === 'START_RANGOLI' || event.type === 'IGNITION_COMPLETE') {
          this.currentState = 'RANGOLI_CEREMONY';
        } else if (event.type === 'ACTION_COMPLETE') {
          this.currentState = 'LIT_CELEBRATION';
        }
        break;
      case 'RANGOLI_CEREMONY':
        if (event.type === 'RANGOLI_COMPLETE' || event.type === 'SKIP_RANGOLI') {
          this.currentState = 'LIT_CELEBRATION';
        }
        break;
      case 'LIT_CELEBRATION':
        if (event.type === 'CELEBRATION_COMPLETE') {
          this.currentState = 'GREETING_REVEAL';
        }
        break;
      case 'GREETING_REVEAL':
        if (event.type === 'REPLAY') {
          this.currentState = 'INTERACTIVE_UNLIT';
        }
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
    for (const sub of this.subscribers) {
      sub(state, payload);
    }
  }
}
