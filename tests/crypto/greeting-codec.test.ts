import { describe, it, expect } from 'vitest';
import { GreetingCodec } from '../../src/crypto/greeting-codec';
import { DEMO_GREETINGS } from '../../src/crypto/demo-greeting';
import type { GreetingPayload } from '../../src/crypto/types';
import { isValidGreetingPayload } from '../../src/crypto/types';

describe('GreetingCodec', () => {
  const samplePayload: GreetingPayload = {
    recipient: 'Priya',
    sender: 'Aarav',
    message: 'Wishing you radiant joy and prosperous Diwali!',
    templateId: 'diya-classic',
    createdAt: 1730635200000,
  };

  it('encrypts a GreetingPayload and decrypts it back to identical object with matching passcode', async () => {
    const passcode = 'PRIYA8';
    const ciphertext = await GreetingCodec.encrypt(samplePayload, passcode);

    expect(typeof ciphertext).toBe('string');
    expect(ciphertext.length).toBeGreaterThan(28);

    const decrypted = await GreetingCodec.decrypt(ciphertext, passcode);
    expect(decrypted).toEqual(samplePayload);
  });

  it('normalizes passcodes so case variations decrypt the identical ciphertext', async () => {
    const ciphertext = await GreetingCodec.encrypt(samplePayload, 'DIYA99');

    const decryptedUpper = await GreetingCodec.decrypt(ciphertext, 'DIYA99');
    const decryptedLower = await GreetingCodec.decrypt(ciphertext, 'diya99');
    const decryptedMixed = await GreetingCodec.decrypt(ciphertext, '  DiYa99  ');

    expect(decryptedUpper).toEqual(samplePayload);
    expect(decryptedLower).toEqual(samplePayload);
    expect(decryptedMixed).toEqual(samplePayload);
  });

  it('throws error when attempting to decrypt with incorrect passcode (AES-GCM authentication tag failure)', async () => {
    const ciphertext = await GreetingCodec.encrypt(samplePayload, 'CORRECT');

    await expect(GreetingCodec.decrypt(ciphertext, 'WRONGG')).rejects.toThrow();
  });

  it('throws error when ciphertext token is truncated or corrupted', async () => {
    const ciphertext = await GreetingCodec.encrypt(samplePayload, 'SECURE');

    // Truncated token (< 28 bytes equivalent)
    await expect(GreetingCodec.decrypt('abc', 'SECURE')).rejects.toThrow();

    // Corrupted token bytes
    const corrupted = ciphertext.slice(0, 10) + 'xyz' + ciphertext.slice(13);
    await expect(GreetingCodec.decrypt(corrupted, 'SECURE')).rejects.toThrow();
  });
});

describe('DEMO_GREETINGS', () => {
  it('contains valid festive payloads for passcodes DIWALI and HAPPY', () => {
    expect(DEMO_GREETINGS.DIWALI).toBeDefined();
    expect(isValidGreetingPayload(DEMO_GREETINGS.DIWALI)).toBe(true);
    expect(DEMO_GREETINGS.DIWALI.templateId).toBe('diya-classic');

    expect(DEMO_GREETINGS.HAPPY).toBeDefined();
    expect(isValidGreetingPayload(DEMO_GREETINGS.HAPPY)).toBe(true);
    expect(DEMO_GREETINGS.HAPPY.templateId).toBe('diya-classic');
  });
});
