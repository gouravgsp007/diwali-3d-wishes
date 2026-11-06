import { describe, it, expect, beforeEach } from 'vitest';
import { resolveGreetingToken, sanitizeToken, getRestoredGreetingHash, ACTIVE_TOKEN_STORAGE_KEY } from '../../src/ui/url-resolver';

describe('resolveGreetingToken', () => {
  beforeEach(() => {
    window.location.hash = '';
    window.location.search = '';
    sessionStorage.clear();
  });

  it('extracts token from URL hash fragment (#d=...) as primary path', () => {
    window.location.hash = '#d=eyJhbGciOiJIUzI1NiJ9';
    const result = resolveGreetingToken();
    expect(result.isDemo).toBe(false);
    expect(result.token).toBe('eyJhbGciOiJIUzI1NiJ9');
    expect(sessionStorage.getItem(ACTIVE_TOKEN_STORAGE_KEY)).toBe('eyJhbGciOiJIUzI1NiJ9');
  });

  it('handles hash fragment with trailing parameters and URI decoding', () => {
    window.location.hash = '#d=sample%20token%2B123&other=param';
    const result = resolveGreetingToken();
    expect(result.isDemo).toBe(false);
    expect(result.token).toBe('sample token+123');
  });

  it('strips trailing slashes appended by mobile browsers and messaging apps', () => {
    window.location.hash = '#d=SampleValidToken123/';
    const result = resolveGreetingToken();
    expect(result.isDemo).toBe(false);
    expect(result.token).toBe('SampleValidToken123');
  });

  it('strips Meta/Instagram tracking query parameters appended to hash (#d=TOKEN?igsh=123)', () => {
    window.location.hash = '#d=SampleValidToken123?igsh=MWhxb282aGZoYWpoeA==&fbclid=IwAR999';
    const result = resolveGreetingToken();
    expect(result.isDemo).toBe(false);
    expect(result.token).toBe('SampleValidToken123');
  });

  it('extracts token when preceded by other hash parameters (#theme=birthday&d=SampleToken)', () => {
    window.location.hash = '#theme=birthday&d=BirthdayToken999';
    const result = resolveGreetingToken();
    expect(result.isDemo).toBe(false);
    expect(result.token).toBe('BirthdayToken999');
  });

  it('does not confuse parameters ending in d with token parameter d (#sound=high&id=123&d=TargetToken)', () => {
    window.location.hash = '#sound=high&id=123&d=TargetToken';
    const result = resolveGreetingToken();
    expect(result.isDemo).toBe(false);
    expect(result.token).toBe('TargetToken');
  });

  it('falls back to query parameter ?c=... and ignores Instagram link shim params (fbclid, igsh)', () => {
    window.location.hash = '';
    window.location.search = '?c=SampleCiphertextToken&fbclid=IwAR123456&igsh=abcdef';
    const result = resolveGreetingToken();
    expect(result.isDemo).toBe(false);
    expect(result.token).toBe('SampleCiphertextToken');
  });

  it('extracts token from query parameter ?d=... or ?code=... as secondary fallbacks', () => {
    window.location.hash = '';
    window.location.search = '?d=FallbackDToken';
    expect(resolveGreetingToken()).toEqual({ token: 'FallbackDToken', isDemo: false });

    window.location.search = '?code=FallbackCodeToken';
    expect(resolveGreetingToken()).toEqual({ token: 'FallbackCodeToken', isDemo: false });
  });

  it('recovers token from sessionStorage if URL hash was cleared by modal or navigation', () => {
    sessionStorage.setItem(ACTIVE_TOKEN_STORAGE_KEY, 'PersistedSessionToken');
    window.location.hash = '';
    window.location.search = '';

    const result = resolveGreetingToken();
    expect(result.isDemo).toBe(false);
    expect(result.token).toBe('PersistedSessionToken');
  });

  it('identifies demo mode when neither hash, query, nor session token is present', () => {
    window.location.hash = '';
    window.location.search = '';
    sessionStorage.clear();
    const result = resolveGreetingToken();
    expect(result.isDemo).toBe(true);
    expect(result.token).toBeNull();
  });

  it('falls back to demo mode if hash or query parameters are empty strings', () => {
    window.location.hash = '#d=   ';
    window.location.search = '';
    sessionStorage.clear();
    expect(resolveGreetingToken()).toEqual({ token: null, isDemo: true });

    window.location.hash = '';
    window.location.search = '?c=   ';
    expect(resolveGreetingToken()).toEqual({ token: null, isDemo: true });
  });

  describe('sanitizeToken helper', () => {
    it('cleans trailing slashes, periods, and parameter tails', () => {
      expect(sanitizeToken('Token123/')).toBe('Token123');
      expect(sanitizeToken('Token123///')).toBe('Token123');
      expect(sanitizeToken('Token123. ')).toBe('Token123');
      expect(sanitizeToken('Token123?fbclid=abc')).toBe('Token123');
      expect(sanitizeToken('Token123&utm_source=wa')).toBe('Token123');
    });
  });

  describe('getRestoredGreetingHash helper', () => {
    it('returns empty string when no token in sessionStorage', () => {
      sessionStorage.clear();
      expect(getRestoredGreetingHash()).toBe('');
    });

    it('returns #d=TOKEN when active token is in sessionStorage', () => {
      sessionStorage.setItem(ACTIVE_TOKEN_STORAGE_KEY, 'RestoredTokenABC');
      expect(getRestoredGreetingHash()).toBe('#d=RestoredTokenABC');
    });
  });
});
