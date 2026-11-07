/**
 * Parameters for formatting a personalized Diwali greeting delivery message.
 */
export interface DeliveryMessageParams {
  recipient: string;
  sender?: string;
  passcode: string;
  url: string;
  occasion?: string;
}

/**
 * Formats an emoji-rich, markdown-bolded delivery copy optimized for
 * WhatsApp, Instagram DMs, Telegram, and SMS.
 *
 * @param params Details containing recipient, sender, URL, secret passcode, and occasion
 * @returns Formatted multi-line text string with festive styling
 */
export function formatDeliveryMessage(params: DeliveryMessageParams): string {
  const recipient = params.recipient?.trim() || 'Friend';
  const rawSender = params.sender?.trim();
  const senderText =
    rawSender && rawSender !== 'A Well-Wisher'
      ? `${rawSender}`
      : 'Someone special';
  const passcode = params.passcode?.trim().toUpperCase() || 'DIWALI';
  const url = params.url?.trim() || '';
  const occ = (params.occasion || 'diwali').toLowerCase();

  if (occ === 'birthday') {
    return [
      `🎂🎉 *A Special Birthday Surprise for you, ${recipient}!* 🎉🎂`,
      '',
      `${senderText} has sent you a magical interactive 3D Birthday Cake wish!`,
      '',
      'Make a wish, blow out the candles on your 3D cake, and unlock your special greeting here:',
      `👉 ${url}`,
      '',
      `🔑 *Your Secret Unlock Passcode:* *${passcode}*`,
      '',
      'Wishing you a fantastic year filled with happiness and success! 🎂✨',
      '— Handcrafted with love via @thecodeverse09',
    ].join('\n');
  }

  if (occ === 'wedding') {
    return [
      `💍🌹 *A Royal Wedding & Engagement Greeting for ${recipient}!* 🌹💍`,
      '',
      `${senderText} has sent you an auspicious royal 3D celebration greeting!`,
      '',
      'Tap the royal golden clasp to reveal your sacred blessings and eternal love:',
      `👉 ${url}`,
      '',
      `🔑 *Your Secret Unlock Passcode:* *${passcode}*`,
      '',
      'Wishing the lovely couple a lifetime of joy and togetherness! 💍✨',
      '— Handcrafted with love via @thecodeverse09',
    ].join('\n');
  }

  if (occ === 'newyear') {
    return [
      `🥂🍾 *Happy New Year 2026 Surprise for ${recipient}!* 🍾🥂`,
      '',
      `${senderText} has sent you a festive interactive 3D New Year celebration!`,
      '',
      'Pop the midnight champagne cork and celebrate into the New Year here:',
      `👉 ${url}`,
      '',
      `🔑 *Your Secret Unlock Passcode:* *${passcode}*`,
      '',
      'Cheers to new beginnings, sparkling dreams, and endless joy! 🥂🎆',
      '— Handcrafted with love via @thecodeverse09',
    ].join('\n');
  }

  // Default: Diwali
  return [
    `🪔✨ *A Special Diwali Surprise for you, ${recipient}!* ✨🪔`,
    '',
    `${senderText} has sent you a magical interactive 3D Diwali Diya wish!`,
    '',
    'Light your ceremonial Diya and unlock your personalized festive greeting here:',
    `👉 ${url}`,
    '',
    `🔑 *Your Secret Unlock Passcode:* *${passcode}*`,
    '',
    'Wishing you a joyous and luminous Deepavali! 🪔✨',
  ].join('\n');
}

/**
 * Generates an RFC 3986 compliant universal WhatsApp deep link URL (https://wa.me/?text=...)
 * encoding the complete formatted delivery message.
 *
 * @param params Delivery message parameters
 * @returns Fully encoded universal WhatsApp link
 */
export function createDeliveryWhatsAppUrl(params: DeliveryMessageParams): string {
  const message = formatDeliveryMessage(params);
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
