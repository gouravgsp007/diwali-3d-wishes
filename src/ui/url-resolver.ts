export interface ResolvedToken {
  token: string | null;
  isDemo: boolean;
}

/**
 * Extracts ciphertext tokens from either the URL hash fragment or query string,
 * sanitizing tracking parameters injected by Meta / Instagram (e.g., fbclid, igsh).
 *
 * Hash fragment (#d=...) is the primary path because hash fragments never enter
 * server HTTP access logs, preserving recipient privacy (D-06).
 */
export function resolveGreetingToken(): ResolvedToken {
  // 1. Check URL hash fragment (#d=...) - Primary path (never touches server logs)
  const hash = window.location.hash;
  if (hash.startsWith('#d=')) {
    const rawToken = hash.slice(3).split('&')[0];
    const cleanToken = decodeURIComponent(rawToken).trim();
    if (cleanToken.length > 0) {
      return { token: cleanToken, isDemo: false };
    }
  }

  // 2. Query parameter fallback (?c=..., ?d=..., or ?code=...)
  // URLSearchParams automatically isolates named params and ignores Meta tracking tags
  const params = new URLSearchParams(window.location.search);
  const queryToken = params.get('c') || params.get('d') || params.get('code');
  if (queryToken) {
    const cleanToken = queryToken.trim();
    if (cleanToken.length > 0) {
      return { token: cleanToken, isDemo: false };
    }
  }

  // 3. Direct visit / demo fallback (D-07)
  return { token: null, isDemo: true };
}
