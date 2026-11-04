/**
 * Parameters for formatting a personalized Diwali greeting delivery message.
 */
export interface DeliveryMessageParams {
  recipient: string;
  sender?: string;
  passcode: string;
  url: string;
}

/**
 * Formats an emoji-rich, markdown-bolded delivery copy optimized for
 * WhatsApp, Instagram DMs, Telegram, and SMS.
 *
 * @param params Details containing recipient, sender, URL, and secret passcode
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
