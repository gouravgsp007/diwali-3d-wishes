import type { GreetingPayload } from './types';

export const DEMO_GREETINGS: Record<string, GreetingPayload> = {
  DIWALI: {
    recipient: 'Beloved Friend',
    sender: 'Diwali Wishes Team',
    message: 'May the divine light of Diwali illuminate your home with happiness, peace, and eternal prosperity! Happy Diwali! ✨🪔',
    templateId: 'diya-classic',
    createdAt: 1730635200000,
  },
  HAPPY: {
    recipient: 'Dear Friend',
    sender: 'Your Loved One',
    message: 'Wishing you a joyful, sparkling, and blessed Diwali filled with love, laughter, and sweet memories! 🪔✨',
    templateId: 'diya-classic',
    createdAt: 1730635200000,
  },
  PRIYA: {
    recipient: 'Priya',
    sender: 'A Loved One',
    message: 'Wishing you radiant joy, prosperity, and endless sparkle this Diwali! May your year ahead be blessed with light, laughter, and abundance. 🪔✨',
    templateId: 'diya-classic',
    createdAt: 1730635200000,
  },
  SHUBH: {
    recipient: 'Dear Friend',
    sender: 'Shubh Deepavali',
    message: 'May this auspicious festival of lights illuminate your life with infinite joy, harmony, and everlasting blessings! ✨🪔',
    templateId: 'diya-classic',
    createdAt: 1730635200000,
  },
  DIYA: {
    recipient: 'Beloved Family',
    sender: 'With Warmth & Love',
    message: 'May the sacred flame of the Diwali diya bring warmth, good fortune, and peace into your home today and always. 🪔✨',
    templateId: 'diya-classic',
    createdAt: 1730635200000,
  },
};

/**
 * Returns a matching demo greeting or null if not a recognized demo passcode.
 */
export function getDemoGreeting(passcode: string): GreetingPayload | null {
  const normalized = passcode.trim().toUpperCase();
  return DEMO_GREETINGS[normalized] || null;
}
