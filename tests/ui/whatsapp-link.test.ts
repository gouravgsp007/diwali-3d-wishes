import { describe, it, expect } from 'vitest';
import { createWhatsAppReplyUrl } from '../../src/ui/whatsapp-link';

describe('createWhatsAppReplyUrl Utility', () => {
  it('returns a valid URI starting with https://wa.me/?text= per D-06 and WISH-02', () => {
    const url = createWhatsAppReplyUrl('Aarav');
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(() => new URL(url)).not.toThrow();
  });

  it('formats personal thanks with sender name and encodes 4-byte UTF-8 emojis via encodeURIComponent per D-06 and T-05-02', () => {
    const url = createWhatsAppReplyUrl('Priya');
    const queryText = url.replace('https://wa.me/?text=', '');
    
    // Check percent-encoding for emojis: 🪔 (%F0%9F%AA%94), ✨ (%E2%9C%A8)
    expect(queryText).toContain('%F0%9F%AA%94');
    expect(queryText).toContain('%E2%9C%A8');

    const decoded = decodeURIComponent(queryText);
    expect(decoded).toBe(
      'Thank you Priya so much for the beautiful Diwali Diya greeting! Wishing you and your family a very Happy Diwali too! 🪔✨'
    );
  });

  it('falls back to generic festive text when senderName is undefined, empty string, or whitespace per D-06', () => {
    const cases = [undefined, '', '   ', '\t\n'];
    for (const sender of cases) {
      const url = createWhatsAppReplyUrl(sender);
      const decoded = decodeURIComponent(url.replace('https://wa.me/?text=', ''));
      expect(decoded).toBe(
        'Thank you so much for the beautiful Diwali Diya greeting! Wishing you and your family a very Happy Diwali too! 🪔✨'
      );
    }
  });

  it('falls back to generic festive text when senderName is "A Well-Wisher" per D-06', () => {
    const url = createWhatsAppReplyUrl('A Well-Wisher');
    const decoded = decodeURIComponent(url.replace('https://wa.me/?text=', ''));
    expect(decoded).toBe(
      'Thank you so much for the beautiful Diwali Diya greeting! Wishing you and your family a very Happy Diwali too! 🪔✨'
    );
    expect(decoded).not.toContain('A Well-Wisher');
  });

  it('handles special characters, quotes, and punctuation safely without breaking URI syntax', () => {
    const specialSender = 'Rohan & Ananya (Didi "Rockstar") <Special>?#';
    const url = createWhatsAppReplyUrl(specialSender);

    expect(() => new URL(url)).not.toThrow();
    const queryText = url.replace('https://wa.me/?text=', '');
    const decoded = decodeURIComponent(queryText);

    expect(decoded).toContain(specialSender);
    // & and ? and # in query parameter value should be encoded
    expect(queryText).toContain('%26');
    expect(queryText).toContain('%3F');
    expect(queryText).toContain('%23');
  });
});
