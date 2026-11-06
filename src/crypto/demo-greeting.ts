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
    templateId: 'diwali',
    createdAt: 1730635200000,
  },
  BDAY: {
    recipient: 'Birthday Star',
    sender: 'Your Best Friend',
    message: 'Happy Birthday! May your day be as radiant, sweet, and unforgettable as you are. Make a wish and blow out the candles! 🎂🎈✨',
    templateId: 'birthday',
    createdAt: 1730635200000,
  },
  BIRTHDAY: {
    recipient: 'Dearest Friend',
    sender: 'With Lots of Love',
    message: 'Wishing you a magical year ahead filled with happiness, grand adventures, and sweet dreams come true! Happy Birthday! 🎉🎂',
    templateId: 'birthday',
    createdAt: 1730635200000,
  },
  WEDDING: {
    recipient: 'The Blessed Couple',
    sender: 'Well Wishers',
    message: 'Two souls, one beautiful journey. May your love bloom brighter with each passing day. Heartiest congratulations on your auspicious union! 💍💐✨',
    templateId: 'wedding',
    createdAt: 1730635200000,
  },
  LOVE: {
    recipient: 'My Forever',
    sender: 'With All My Heart',
    message: 'From this day forward, and for all our tomorrows. You are my greatest adventure and deepest joy. Happy Anniversary & Engagement! 💍🌹',
    templateId: 'wedding',
    createdAt: 1730635200000,
  },
  NEWYEAR: {
    recipient: 'Dear Friend',
    sender: 'Celebration Crew',
    message: '365 new days, 365 new chances! Here’s to laughter, good health, and incredible milestones ahead. Happy New Year! 🥂🎆✨',
    templateId: 'newyear',
    createdAt: 1730635200000,
  },
  NY2026: {
    recipient: 'Everyone',
    sender: 'DreamRoutes Family',
    message: 'Midnight has struck! May this New Year bring golden success, radiant joy, and sparkling blessings into your life! 🥂🎆',
    templateId: 'newyear',
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
