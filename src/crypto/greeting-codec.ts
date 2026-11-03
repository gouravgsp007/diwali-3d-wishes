import LZString from 'lz-string';
import type { GreetingPayload } from './types';
import { isValidGreetingPayload } from './types';

export class GreetingCodec {
  private static readonly SALT = new TextEncoder().encode('ShubhDiwali2026Salt');
  private static readonly ITERATIONS = 100000;

  private static getCrypto(): SubtleCrypto {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      return window.crypto.subtle;
    }
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
      return globalThis.crypto.subtle;
    }
    throw new Error('Web Crypto API (SubtleCrypto) is not available');
  }

  private static getRandomValues(array: Uint8Array): Uint8Array {
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      return window.crypto.getRandomValues(array);
    }
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
      return globalThis.crypto.getRandomValues(array);
    }
    throw new Error('Web Crypto API (getRandomValues) is not available');
  }

  private static async deriveKey(passcode: string): Promise<CryptoKey> {
    const subtle = this.getCrypto();
    const normalizedCode = passcode.trim().toUpperCase();
    const keyMaterial = await subtle.importKey(
      'raw',
      new TextEncoder().encode(normalizedCode),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.SALT,
        iterations: this.ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  public static async encrypt(payload: GreetingPayload, passcode: string): Promise<string> {
    const key = await this.deriveKey(passcode);
    const subtle = this.getCrypto();
    const jsonStr = JSON.stringify(payload);
    const lzBytes = LZString.compressToUint8Array(jsonStr);
    const compressedBytes = new Uint8Array(new ArrayBuffer(lzBytes.length));
    compressedBytes.set(lzBytes);

    const iv = this.getRandomValues(new Uint8Array(12));

    const cipherBuffer = await subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      compressedBytes as unknown as BufferSource
    );

    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuffer), iv.length);

    let binary = '';
    for (let i = 0; i < combined.length; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  public static async decrypt(token: string, passcode: string): Promise<GreetingPayload> {
    const key = await this.deriveKey(passcode);
    const subtle = this.getCrypto();

    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    let binary: string;
    try {
      binary = atob(base64);
    } catch {
      throw new Error('Invalid ciphertext: decoding failed');
    }

    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    if (combined.length < 28) {
      throw new Error('Invalid ciphertext: token too short');
    }

    const iv = combined.slice(0, 12);
    const cipherData = combined.slice(12);

    let decryptedBuffer: ArrayBuffer;
    try {
      decryptedBuffer = await subtle.decrypt(
        { name: 'AES-GCM', iv: iv as unknown as BufferSource },
        key,
        cipherData as unknown as BufferSource
      );
    } catch {
      throw new Error('Decryption failed: passcode mismatch or corrupted ciphertext');
    }

    const jsonStr = LZString.decompressFromUint8Array(new Uint8Array(decryptedBuffer));
    if (!jsonStr) {
      throw new Error('Decompression failed');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error('Invalid payload JSON');
    }

    if (!isValidGreetingPayload(parsed)) {
      throw new Error('Invalid payload schema');
    }

    return parsed;
  }
}
