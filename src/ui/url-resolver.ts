export interface ResolvedToken {
  token: string | null;
  isDemo: boolean;
}

export const ACTIVE_TOKEN_STORAGE_KEY = 'diwali_active_token';

/**
 * Sanitizes a raw ciphertext token by:
 * 1. Isolating the token from query tails ('?') or parameter separators ('&')
 * 2. URL decoding any encoded characters
 * 3. Stripping trailing slashes ('/'), dots ('.'), or spaces appended by messaging apps
 */
export function sanitizeToken(raw: string): string {
  if (!raw) return '';
  // Cut off any URL query or fragment tail
  let cleaned = raw.split('&')[0].split('?')[0];

  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {
    // If malformed URI encoding, proceed with raw string
  }

  // Strip trailing slashes, dots, and whitespace common in WhatsApp / Instagram link unfurls
  return cleaned.trim().replace(/[\/\.\s]+$/, '');
}

/**
 * Extracts ciphertext tokens from the URL hash fragment, query string, or active session storage.
 *
 * 1. URL Hash fragment (#d=... or #...&d=...) - Primary path (never touches server logs)
 * 2. Query parameters (?c=..., ?d=..., or ?code=...) - Secondary fallback
 * 3. SessionStorage (diwali_active_token) - Recovers token if user navigates or modal resets hash
 * 4. Demo fallback - Direct visit without greeting payload
 */
export function resolveGreetingToken(): ResolvedToken {
  // Check if deliberate demo or admin view is requested
  const hash = typeof window !== 'undefined' ? window.location.hash || '' : '';
  const search = typeof window !== 'undefined' ? window.location.search || '' : '';
  const params = new URLSearchParams(search);

  // 1. Primary path: Hash fragment containing 'd='
  // Use regex matching start of hash (#) or parameter boundary (&) before 'd=' to avoid matching 'sound=', 'id=', etc.
  const hashMatch = hash.match(/(?:^|[#&])d=([^&?]*)/);
  if (hashMatch && hashMatch[1]) {
    const cleanToken = sanitizeToken(hashMatch[1]);
    if (cleanToken.length > 0) {
      persistSessionToken(cleanToken);
      return { token: cleanToken, isDemo: false };
    }
  }

  // 2. Secondary path: Query parameters (?c=..., ?d=..., or ?code=...)
  const queryToken = params.get('c') || params.get('d') || params.get('code');
  if (queryToken) {
    const cleanToken = sanitizeToken(queryToken);
    if (cleanToken.length > 0) {
      persistSessionToken(cleanToken);
      return { token: cleanToken, isDemo: false };
    }
  }

  // 3. SessionStorage fallback: Recovers token if URL hash was wiped by modal interaction or page reload
  if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
    const isExplicitAdmin = hash.startsWith('#admin') || hash.startsWith('#create');
    const isExplicitDemo = hash.startsWith('#demo') || params.get('demo') === 'true';

    if (!isExplicitAdmin && !isExplicitDemo) {
      try {
        const savedToken = sessionStorage.getItem(ACTIVE_TOKEN_STORAGE_KEY);
        if (savedToken && savedToken.trim().length > 0) {
          return { token: savedToken.trim(), isDemo: false };
        }
      } catch {
        // Storage access may be blocked in some private browsing modes
      }
    }
  }

  // 4. Direct visit / demo fallback (D-07)
  return { token: null, isDemo: true };
}

export function getRestoredGreetingHash(): string {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return '';
  try {
    const savedToken = sessionStorage.getItem(ACTIVE_TOKEN_STORAGE_KEY);
    if (savedToken && savedToken.trim().length > 0) {
      return `#d=${savedToken.trim()}`;
    }
  } catch {
    // Storage access may be blocked in some private browsing modes
  }
  return '';
}

function persistSessionToken(token: string): void {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(ACTIVE_TOKEN_STORAGE_KEY, token);
  } catch {
    // Graceful degradation when sessionStorage is quota-exceeded or restricted
  }
}
