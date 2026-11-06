import { describe, it, expect, vi } from 'vitest';
import { AppStateMachine } from '../../src/app/state-machine';
import { EventBus, globalEventBus } from '../../src/app/event-bus';
import type { GreetingPayload } from '../../src/crypto/types';

describe('AppStateMachine', () => {
  const mockPayload: GreetingPayload = {
    recipient: 'Aarav',
    sender: 'Priya',
    message: 'Wishing you a joyful and luminous Diwali!',
    templateId: 'diya-classic',
    createdAt: 1730635200000,
  };

  it('starts in BOOT state upon instantiation', () => {
    const fsm = new AppStateMachine();
    expect(fsm.getState()).toBe('BOOT');
    expect(fsm.getGreeting()).toBeNull();
  });

  it('transitions from BOOT to LOCKED on BOOT_COMPLETE event', () => {
    const fsm = new AppStateMachine();
    const nextState = fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });
    expect(nextState).toBe('LOCKED');
    expect(fsm.getState()).toBe('LOCKED');
  });

  it('transitions from LOCKED to UNLOCKED_INTRO on UNLOCK_SUCCESS and stores payload', () => {
    const fsm = new AppStateMachine();
    fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });
    const nextState = fsm.transition({ type: 'UNLOCK_SUCCESS', payload: mockPayload });
    expect(nextState).toBe('UNLOCKED_INTRO');
    expect(fsm.getState()).toBe('UNLOCKED_INTRO');
    expect(fsm.getGreeting()).toEqual(mockPayload);
  });

  it('sequentially advances through UNLOCKED_INTRO -> INTERACTIVE_UNLIT -> IGNITING -> LIT_CELEBRATION -> GREETING_REVEAL -> INTERACTIVE_UNLIT', () => {
    const fsm = new AppStateMachine();
    fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });
    fsm.transition({ type: 'UNLOCK_SUCCESS', payload: mockPayload });

    expect(fsm.transition({ type: 'INTRO_COMPLETE' })).toBe('INTERACTIVE_UNLIT');
    expect(fsm.getState()).toBe('INTERACTIVE_UNLIT');

    expect(fsm.transition({ type: 'WICK_TOUCHED' })).toBe('IGNITING');
    expect(fsm.getState()).toBe('IGNITING');

    expect(fsm.transition({ type: 'IGNITION_COMPLETE' })).toBe('RANGOLI_CEREMONY');
    expect(fsm.getState()).toBe('RANGOLI_CEREMONY');

    expect(fsm.transition({ type: 'RANGOLI_COMPLETE' })).toBe('LIT_CELEBRATION');
    expect(fsm.getState()).toBe('LIT_CELEBRATION');

    expect(fsm.transition({ type: 'CELEBRATION_COMPLETE' })).toBe('GREETING_REVEAL');
    expect(fsm.getState()).toBe('GREETING_REVEAL');

    expect(fsm.transition({ type: 'REPLAY' })).toBe('INTERACTIVE_UNLIT');
    expect(fsm.getState()).toBe('INTERACTIVE_UNLIT');
  });

  it('seamlessly transitions to UNLOCKED_INTRO on UNLOCK_SUCCESS when already in INTERACTIVE_UNLIT or GREETING_REVEAL', () => {
    const fsm = new AppStateMachine();
    fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });
    fsm.transition({ type: 'UNLOCK_SUCCESS', payload: mockPayload });
    fsm.transition({ type: 'INTRO_COMPLETE' });
    expect(fsm.getState()).toBe('INTERACTIVE_UNLIT');

    const birthdayPayload: GreetingPayload = {
      recipient: 'Birthday Star',
      sender: 'Friends',
      message: 'Happy Birthday!',
      templateId: 'birthday',
      createdAt: Date.now(),
    };

    const next = fsm.transition({ type: 'UNLOCK_SUCCESS', payload: birthdayPayload });
    expect(next).toBe('UNLOCKED_INTRO');
    expect(fsm.getState()).toBe('UNLOCKED_INTRO');
    expect(fsm.getGreeting()?.templateId).toBe('birthday');
  });

  it('rejects invalid transitions and remains in current state without notification', () => {
    const fsm = new AppStateMachine();
    const listener = vi.fn();
    fsm.subscribe(listener);

    // Cannot jump from BOOT to LIT_CELEBRATION
    const state = fsm.transition({ type: 'IGNITION_COMPLETE' });
    expect(state).toBe('BOOT');
    expect(fsm.getState()).toBe('BOOT');
    expect(listener).not.toHaveBeenCalled();

    // Move to LOCKED
    fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: true });
    expect(listener).toHaveBeenCalledWith('LOCKED', undefined);
    listener.mockClear();

    // Cannot jump from LOCKED to CELEBRATION_COMPLETE
    const invalidState = fsm.transition({ type: 'CELEBRATION_COMPLETE' });
    expect(invalidState).toBe('LOCKED');
    expect(fsm.getState()).toBe('LOCKED');
    expect(listener).not.toHaveBeenCalled();
  });

  it('notifies registered subscribers on state transitions and provides unsubscribe cleanup', () => {
    const fsm = new AppStateMachine();
    const listenerA = vi.fn();
    const listenerB = vi.fn();

    const unsubscribeA = fsm.subscribe(listenerA);
    fsm.subscribe(listenerB);

    fsm.transition({ type: 'BOOT_COMPLETE', hasCiphertext: false });
    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerA).toHaveBeenCalledWith('LOCKED', undefined);
    expect(listenerB).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledWith('LOCKED', undefined);

    unsubscribeA();

    fsm.transition({ type: 'UNLOCK_SUCCESS', payload: mockPayload });
    expect(listenerA).toHaveBeenCalledTimes(1); // Unsubscribed, not called again
    expect(listenerB).toHaveBeenCalledTimes(2); // Still subscribed
    expect(listenerB).toHaveBeenLastCalledWith('UNLOCKED_INTRO', mockPayload);
  });
});

describe('EventBus', () => {
  it('emits typed events and executes registered handlers', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on<string>('greet', handler);
    bus.emit('greet', 'Namaste');

    expect(handler).toHaveBeenCalledWith('Namaste');
  });

  it('allows unregistering event handlers', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    const unsubscribe = bus.on<number>('count', handler);
    bus.emit('count', 1);
    expect(handler).toHaveBeenCalledWith(1);

    unsubscribe();
    bus.emit('count', 2);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('provides working globalEventBus singleton', () => {
    const handler = vi.fn();
    const unsub = globalEventBus.on('test-global', handler);
    globalEventBus.emit('test-global', { ok: true });
    expect(handler).toHaveBeenCalledWith({ ok: true });
    unsub();
  });
});
