/**
 * Generates an RFC 3986 compliant universal WhatsApp deep link URL (https://wa.me/?text=...).
 * Safely falls back to generic festive text when senderName is empty, whitespace, or default ('A Well-Wisher').
 *
 * @param senderName Optional sender name to personalize the reciprocation message
 * @returns Fully encoded WhatsApp deep link URL
 */
export function createWhatsAppReplyUrl(senderName?: string, occasion?: string): string {
  const cleanSender = senderName?.trim();
  const occ = (occasion || 'diwali').toLowerCase();

  let baseMessage = '';
  if (occ === 'birthday') {
    baseMessage = cleanSender && cleanSender !== 'A Well-Wisher'
      ? `Thank you ${cleanSender} so much for the wonderful 3D Birthday wish! 🎂🎉`
      : `Thank you so much for the wonderful 3D Birthday wish! 🎂🎉`;
  } else if (occ === 'wedding') {
    baseMessage = cleanSender && cleanSender !== 'A Well-Wisher'
      ? `Thank you ${cleanSender} so much for the auspicious 3D wedding blessings! 💍🌹`
      : `Thank you so much for the auspicious 3D wedding blessings! 💍🌹`;
  } else if (occ === 'newyear') {
    baseMessage = cleanSender && cleanSender !== 'A Well-Wisher'
      ? `Thank you ${cleanSender} so much for the sparkling 3D New Year celebration! Wishing you a fantastic 2026 too! 🥂🎆`
      : `Thank you so much for the sparkling 3D New Year celebration! Wishing you a fantastic 2026 too! 🥂🎆`;
  } else {
    baseMessage = cleanSender && cleanSender !== 'A Well-Wisher'
      ? `Thank you ${cleanSender} so much for the beautiful Diwali Diya greeting! Wishing you and your family a very Happy Diwali too! 🪔✨`
      : `Thank you so much for the beautiful Diwali Diya greeting! Wishing you and your family a very Happy Diwali too! 🪔✨`;
  }

  return `https://wa.me/?text=${encodeURIComponent(baseMessage)}`;
}
