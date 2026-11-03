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
};
