/**
 * Resilient multi-tier clipboard utility.
 *
 * Designed to work across modern desktop browsers, mobile Safari/Chrome,
 * and restricted in-app WebViews (Instagram, Facebook, WhatsApp) where
 * navigator.clipboard might throw NotAllowedError or lack permission delegation.
 *
 * @param text The string to copy to the system clipboard
 * @returns Promise resolving to true if copy succeeded, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Strategy 1: Modern Asynchronous Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy fallback on permission rejection or restricted context
    }
  }

  // Strategy 2: Legacy textarea execCommand fallback
  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      textarea.setAttribute('readonly', '');
      textarea.setAttribute('aria-hidden', 'true');
      document.body.appendChild(textarea);

      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      const successful = document.execCommand('copy');
      textarea.remove();
      return successful;
    } catch {
      return false;
    }
  }

  return false;
}
