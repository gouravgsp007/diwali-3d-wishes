import { describe, it, expect } from 'vitest';
import { formatDeliveryMessage, createDeliveryWhatsAppUrl } from '../../src/ui/delivery-message';

describe('formatDeliveryMessage', () => {
  it('formats an emoji-rich delivery message with all supplied parameters', () => {
    const text = formatDeliveryMessage({
      recipient: 'Priya',
      sender: 'Rahul & Family',
      passcode: 'DIY88',
      url: 'https://diwali.app/#d=cipher123',
    });

    expect(text).toContain('A Special Diwali Surprise for you, Priya!');
    expect(text).toContain('Rahul & Family has sent you a magical interactive 3D Diwali Diya wish!');
    expect(text).toContain('👉 https://diwali.app/#d=cipher123');
    expect(text).toContain('🔑 *Your Secret Unlock Passcode:* *DIY88*');
    expect(text).toContain('🪔✨');
  });

  it('normalizes lowercase passcode to uppercase for recipient readability', () => {
    const text = formatDeliveryMessage({
      recipient: 'Aarav',
      sender: 'Kavita',
      passcode: 'diwali',
      url: 'https://diwali.app/#d=token',
    });

    expect(text).toContain('*Your Secret Unlock Passcode:* *DIWALI*');
  });

  it('falls back to "Someone special" when sender is empty, whitespace, or "A Well-Wisher"', () => {
    const textDefault = formatDeliveryMessage({
      recipient: 'Sita',
      passcode: '1234',
      url: 'https://diwali.app/#d=token',
    });
    expect(textDefault).toContain('Someone special has sent you a magical interactive 3D Diwali Diya wish!');

    const textWellWisher = formatDeliveryMessage({
      recipient: 'Sita',
      sender: 'A Well-Wisher',
      passcode: '1234',
      url: 'https://diwali.app/#d=token',
    });
    expect(textWellWisher).toContain('Someone special has sent you a magical interactive 3D Diwali Diya wish!');

    const textWhitespace = formatDeliveryMessage({
      recipient: 'Sita',
      sender: '   ',
      passcode: '1234',
      url: 'https://diwali.app/#d=token',
    });
    expect(textWhitespace).toContain('Someone special has sent you a magical interactive 3D Diwali Diya wish!');
  });

  it('falls back to "Friend" when recipient is empty or whitespace', () => {
    const text = formatDeliveryMessage({
      recipient: '   ',
      passcode: '1234',
      url: 'https://diwali.app/#d=token',
    });
    expect(text).toContain('A Special Diwali Surprise for you, Friend!');
  });
});

describe('createDeliveryWhatsAppUrl', () => {
  it('returns an RFC 3986 universal WhatsApp link encoding the message', () => {
    const url = createDeliveryWhatsAppUrl({
      recipient: 'Rohan',
      sender: 'Sneha',
      passcode: '2026',
      url: 'https://diwali.app/#d=abc',
    });

    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    // Decodes cleanly
    const encodedPayload = url.replace('https://wa.me/?text=', '');
    const decodedMessage = decodeURIComponent(encodedPayload);
    expect(decodedMessage).toContain('A Special Diwali Surprise for you, Rohan!');
    expect(decodedMessage).toContain('Sneha has sent you a magical interactive 3D Diwali Diya wish!');
    expect(decodedMessage).toContain('👉 https://diwali.app/#d=abc');
    expect(decodedMessage).toContain('🔑 *Your Secret Unlock Passcode:* *2026*');
    expect(decodedMessage).toContain('🪔✨');
  });
});
