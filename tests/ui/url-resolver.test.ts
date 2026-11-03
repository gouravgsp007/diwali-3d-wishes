import { describe, it, expect, beforeEach } from 'vitest';
import { resolveGreetingToken } from '../../src/ui/url-resolver';

describe('resolveGreetingToken', () => {
  beforeEach(() => {
    window.location.hash = '';
    window.location.search = '';
  });

  it('extracts token from URL hash fragment (#d=...) as primary path', () => {
    window.location.hash = '#d=eyJhbGciOiJIUzI1NiJ9';
    const result = resolveGreetingToken();
    expect(result.isDemo).toBe(false);
    expect(result.token).toBe('eyJhbGciOiJIUzI1NiJ9');
  });

  it('handles hash fragment with trailing parameters and URI decoding', () => {
    window.location.hash = '#d=sample%20token%2B123&other=param';
    const result = resolveGreetingToken();
    expect(result.isDemo).toBe(false);
    expect(result.token).toBe('sample token+123');
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

  it('identifies demo mode when neither hash nor query token is present', () => {
    window.location.hash = '';
    window.location.search = '';
    const result = resolveGreetingToken();
    expect(result.isDemo).toBe(true);
    expect(result.token).toBeNull();
  });

  it('falls back to demo mode if hash or query parameters are empty strings', () => {
    window.location.hash = '#d=   ';
    window.location.search = '';
    expect(resolveGreetingToken()).toEqual({ token: null, isDemo: true });

    window.location.hash = '';
    window.location.search = '?c=   ';
    expect(resolveGreetingToken()).toEqual({ token: null, isDemo: true });
  });
});
