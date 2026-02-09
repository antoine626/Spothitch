/**
 * Data Encryption Service Tests
 * Tests for GDPR-compliant encryption of sensitive user data
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  // Constants
  SensitiveDataTypes,
  PublicDataTypes,
  ENCRYPTION_CONFIG,
  // Utility functions
  isCryptoAvailable,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  // Data type checks
  shouldEncrypt,
  isPublicData,
  getSensitiveDataTypes,
  getPublicDataTypes,
  // Metadata
  getEncryptionMetadata,
  setEncryptionMetadata,
  clearEncryptionMetadata,
} from '../src/services/dataEncryption.js';

describe('Data Encryption Service', () => {
  // Mock localStorage
  let mockStore = {};

  beforeEach(() => {
    mockStore = {};
    localStorage.getItem.mockImplementation((key) => mockStore[key] || null);
    localStorage.setItem.mockImplementation((key, value) => {
      mockStore[key] = value;
    });
    localStorage.removeItem.mockImplementation((key) => {
      delete mockStore[key];
    });
    localStorage.clear.mockImplementation(() => {
      mockStore = {};
    });
    vi.clearAllMocks();
  });

  describe('Constants', () => {
    it('should define SensitiveDataTypes', () => {
      expect(SensitiveDataTypes).toBeDefined();
      expect(SensitiveDataTypes.PRECISE_LOCATION).toBe('precise_location');
      expect(SensitiveDataTypes.PHONE_NUMBER).toBe('phone_number');
      expect(SensitiveDataTypes.IDENTITY_DOCUMENT).toBe('identity_document');
      expect(SensitiveDataTypes.EMERGENCY_CONTACT).toBe('emergency_contact');
    });

    it('should define PublicDataTypes', () => {
      expect(PublicDataTypes).toBeDefined();
      expect(PublicDataTypes.USERNAME).toBe('username');
      expect(PublicDataTypes.AVATAR).toBe('avatar');
      expect(PublicDataTypes.SPOTS).toBe('spots');
      expect(PublicDataTypes.BADGES).toBe('badges');
      expect(PublicDataTypes.LEVEL).toBe('level');
    });

    it('should define ENCRYPTION_CONFIG', () => {
      expect(ENCRYPTION_CONFIG).toBeDefined();
      expect(ENCRYPTION_CONFIG.ALGORITHM).toBe('AES-GCM');
      expect(ENCRYPTION_CONFIG.KEY_LENGTH).toBe(256);
      expect(ENCRYPTION_CONFIG.IV_LENGTH).toBe(12);
    });

    it('should have 4 sensitive data types', () => {
      const types = Object.values(SensitiveDataTypes);
      expect(types.length).toBe(4);
    });

    it('should have 5 public data types', () => {
      const types = Object.values(PublicDataTypes);
      expect(types.length).toBe(5);
    });
  });

  describe('isCryptoAvailable', () => {
    it('should return a boolean', () => {
      const result = isCryptoAvailable();
      expect(typeof result).toBe('boolean');
    });

    it('should return true in happy-dom environment', () => {
      // happy-dom provides window.crypto
      const result = isCryptoAvailable();
      expect(result).toBe(true);
    });
  });

  describe('arrayBufferToBase64', () => {
    it('should convert ArrayBuffer to Base64', () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer; // "Hello"
      const result = arrayBufferToBase64(buffer);
      expect(result).toBe('SGVsbG8=');
    });

    it('should handle empty buffer', () => {
      const buffer = new Uint8Array([]).buffer;
      const result = arrayBufferToBase64(buffer);
      expect(result).toBe('');
    });

    it('should handle binary data', () => {
      const buffer = new Uint8Array([0, 128, 255]).buffer;
      const result = arrayBufferToBase64(buffer);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should produce valid base64', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;
      const result = arrayBufferToBase64(buffer);
      // Should only contain valid base64 characters
      expect(result).toMatch(/^[A-Za-z0-9+/=]*$/);
    });
  });

  describe('base64ToArrayBuffer', () => {
    it('should convert Base64 to ArrayBuffer', () => {
      const base64 = 'SGVsbG8='; // "Hello"
      const result = base64ToArrayBuffer(base64);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    it('should handle empty string', () => {
      const result = base64ToArrayBuffer('');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });

    it('should roundtrip correctly', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5]);
      const base64 = arrayBufferToBase64(original.buffer);
      const result = base64ToArrayBuffer(base64);
      expect(Array.from(result)).toEqual(Array.from(original));
    });

    it('should handle complex binary data roundtrip', () => {
      const original = new Uint8Array([0, 64, 128, 192, 255]);
      const base64 = arrayBufferToBase64(original.buffer);
      const result = base64ToArrayBuffer(base64);
      expect(Array.from(result)).toEqual(Array.from(original));
    });
  });

  describe('shouldEncrypt', () => {
    it('should return true for precise_location', () => {
      expect(shouldEncrypt('precise_location')).toBe(true);
    });

    it('should return true for phone_number', () => {
      expect(shouldEncrypt('phone_number')).toBe(true);
    });

    it('should return true for identity_document', () => {
      expect(shouldEncrypt('identity_document')).toBe(true);
    });

    it('should return true for emergency_contact', () => {
      expect(shouldEncrypt('emergency_contact')).toBe(true);
    });

    it('should return false for username', () => {
      expect(shouldEncrypt('username')).toBe(false);
    });

    it('should return false for avatar', () => {
      expect(shouldEncrypt('avatar')).toBe(false);
    });

    it('should return false for spots', () => {
      expect(shouldEncrypt('spots')).toBe(false);
    });

    it('should return false for unknown types', () => {
      expect(shouldEncrypt('unknown')).toBe(false);
      expect(shouldEncrypt('')).toBe(false);
      expect(shouldEncrypt(null)).toBe(false);
    });

    it('should use SensitiveDataTypes constants', () => {
      expect(shouldEncrypt(SensitiveDataTypes.PRECISE_LOCATION)).toBe(true);
      expect(shouldEncrypt(SensitiveDataTypes.PHONE_NUMBER)).toBe(true);
      expect(shouldEncrypt(SensitiveDataTypes.IDENTITY_DOCUMENT)).toBe(true);
      expect(shouldEncrypt(SensitiveDataTypes.EMERGENCY_CONTACT)).toBe(true);
    });
  });

  describe('isPublicData', () => {
    it('should return true for username', () => {
      expect(isPublicData('username')).toBe(true);
    });

    it('should return true for avatar', () => {
      expect(isPublicData('avatar')).toBe(true);
    });

    it('should return true for spots', () => {
      expect(isPublicData('spots')).toBe(true);
    });

    it('should return true for badges', () => {
      expect(isPublicData('badges')).toBe(true);
    });

    it('should return true for level', () => {
      expect(isPublicData('level')).toBe(true);
    });

    it('should return false for sensitive types', () => {
      expect(isPublicData('precise_location')).toBe(false);
      expect(isPublicData('phone_number')).toBe(false);
      expect(isPublicData('identity_document')).toBe(false);
    });

    it('should return false for unknown types', () => {
      expect(isPublicData('unknown')).toBe(false);
      expect(isPublicData('')).toBe(false);
    });

    it('should use PublicDataTypes constants', () => {
      expect(isPublicData(PublicDataTypes.USERNAME)).toBe(true);
      expect(isPublicData(PublicDataTypes.AVATAR)).toBe(true);
      expect(isPublicData(PublicDataTypes.SPOTS)).toBe(true);
      expect(isPublicData(PublicDataTypes.BADGES)).toBe(true);
      expect(isPublicData(PublicDataTypes.LEVEL)).toBe(true);
    });
  });

  describe('getSensitiveDataTypes', () => {
    it('should return all sensitive data types', () => {
      const types = getSensitiveDataTypes();
      expect(types).toContain('precise_location');
      expect(types).toContain('phone_number');
      expect(types).toContain('identity_document');
      expect(types).toContain('emergency_contact');
      expect(types.length).toBe(4);
    });

    it('should return an array', () => {
      const types = getSensitiveDataTypes();
      expect(Array.isArray(types)).toBe(true);
    });

    it('should not contain public types', () => {
      const types = getSensitiveDataTypes();
      expect(types).not.toContain('username');
      expect(types).not.toContain('avatar');
      expect(types).not.toContain('spots');
    });
  });

  describe('getPublicDataTypes', () => {
    it('should return all public data types', () => {
      const types = getPublicDataTypes();
      expect(types).toContain('username');
      expect(types).toContain('avatar');
      expect(types).toContain('spots');
      expect(types).toContain('badges');
      expect(types).toContain('level');
      expect(types.length).toBe(5);
    });

    it('should return an array', () => {
      const types = getPublicDataTypes();
      expect(Array.isArray(types)).toBe(true);
    });

    it('should not contain sensitive types', () => {
      const types = getPublicDataTypes();
      expect(types).not.toContain('precise_location');
      expect(types).not.toContain('phone_number');
      expect(types).not.toContain('identity_document');
    });
  });

  describe('Encryption Metadata', () => {
    it('should store encryption metadata', () => {
      setEncryptionMetadata({ keyId: 'key123', createdAt: Date.now() });

      expect(localStorage.setItem).toHaveBeenCalled();
      const stored = JSON.parse(mockStore['spothitch_encryption_meta']);
      expect(stored.keyId).toBe('key123');
      expect(stored.updatedAt).toBeDefined();
    });

    it('should retrieve encryption metadata', () => {
      mockStore['spothitch_encryption_meta'] = JSON.stringify({ keyId: 'key123' });

      const result = getEncryptionMetadata();

      expect(result.keyId).toBe('key123');
    });

    it('should return null for missing metadata', () => {
      const result = getEncryptionMetadata();
      expect(result).toBeNull();
    });

    it('should clear encryption metadata', () => {
      mockStore['spothitch_encryption_meta'] = JSON.stringify({ keyId: 'key123' });

      clearEncryptionMetadata();

      expect(localStorage.removeItem).toHaveBeenCalledWith('spothitch_encryption_meta');
    });

    it('should handle invalid JSON gracefully', () => {
      mockStore['spothitch_encryption_meta'] = 'not-valid-json';

      const result = getEncryptionMetadata();
      expect(result).toBeNull();
    });

    it('should preserve existing metadata fields', () => {
      setEncryptionMetadata({ keyId: 'key1', extra: 'data' });

      const stored = JSON.parse(mockStore['spothitch_encryption_meta']);
      expect(stored.keyId).toBe('key1');
      expect(stored.extra).toBe('data');
      expect(stored.updatedAt).toBeDefined();
    });
  });

  describe('Data categorization consistency', () => {
    it('should have no overlap between sensitive and public types', () => {
      const sensitive = getSensitiveDataTypes();
      const publicTypes = getPublicDataTypes();

      for (const type of sensitive) {
        expect(publicTypes).not.toContain(type);
      }

      for (const type of publicTypes) {
        expect(sensitive).not.toContain(type);
      }
    });

    it('should correctly categorize all sensitive types', () => {
      const sensitive = getSensitiveDataTypes();
      for (const type of sensitive) {
        expect(shouldEncrypt(type)).toBe(true);
        expect(isPublicData(type)).toBe(false);
      }
    });

    it('should correctly categorize all public types', () => {
      const publicTypes = getPublicDataTypes();
      for (const type of publicTypes) {
        expect(shouldEncrypt(type)).toBe(false);
        expect(isPublicData(type)).toBe(true);
      }
    });
  });

  describe('ENCRYPTION_CONFIG values', () => {
    it('should use AES-GCM algorithm', () => {
      expect(ENCRYPTION_CONFIG.ALGORITHM).toBe('AES-GCM');
    });

    it('should use 256-bit key length', () => {
      expect(ENCRYPTION_CONFIG.KEY_LENGTH).toBe(256);
    });

    it('should use 12-byte IV (96 bits)', () => {
      expect(ENCRYPTION_CONFIG.IV_LENGTH).toBe(12);
    });

    it('should have correct storage key', () => {
      expect(ENCRYPTION_CONFIG.STORAGE_KEY).toBe('spothitch_encryption_meta');
    });
  });

  describe('Base64 encoding edge cases', () => {
    it('should handle all byte values 0-255', () => {
      const allBytes = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        allBytes[i] = i;
      }

      const encoded = arrayBufferToBase64(allBytes.buffer);
      const decoded = base64ToArrayBuffer(encoded);

      expect(decoded.length).toBe(256);
      for (let i = 0; i < 256; i++) {
        expect(decoded[i]).toBe(i);
      }
    });

    it('should handle large buffers', () => {
      const largeBuffer = new Uint8Array(10000);
      for (let i = 0; i < largeBuffer.length; i++) {
        largeBuffer[i] = i % 256;
      }

      const encoded = arrayBufferToBase64(largeBuffer.buffer);
      const decoded = base64ToArrayBuffer(encoded);

      expect(decoded.length).toBe(10000);
    });

    it('should produce consistent output', () => {
      const buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;
      const encoded1 = arrayBufferToBase64(buffer);
      const encoded2 = arrayBufferToBase64(buffer);

      expect(encoded1).toBe(encoded2);
    });
  });

  describe('Decision validation - what to encrypt', () => {
    // These tests validate the decisions made:
    // - Encrypt: precise location, phone, ID document
    // - NOT encrypt: username, avatar, spots (public)

    it('should encrypt precise user location', () => {
      expect(shouldEncrypt(SensitiveDataTypes.PRECISE_LOCATION)).toBe(true);
    });

    it('should encrypt phone number', () => {
      expect(shouldEncrypt(SensitiveDataTypes.PHONE_NUMBER)).toBe(true);
    });

    it('should encrypt identity document', () => {
      expect(shouldEncrypt(SensitiveDataTypes.IDENTITY_DOCUMENT)).toBe(true);
    });

    it('should NOT encrypt username (public)', () => {
      expect(shouldEncrypt(PublicDataTypes.USERNAME)).toBe(false);
      expect(isPublicData(PublicDataTypes.USERNAME)).toBe(true);
    });

    it('should NOT encrypt avatar (public)', () => {
      expect(shouldEncrypt(PublicDataTypes.AVATAR)).toBe(false);
      expect(isPublicData(PublicDataTypes.AVATAR)).toBe(true);
    });

    it('should NOT encrypt spots (public)', () => {
      expect(shouldEncrypt(PublicDataTypes.SPOTS)).toBe(false);
      expect(isPublicData(PublicDataTypes.SPOTS)).toBe(true);
    });
  });

  describe('Default export', () => {
    it('should export all functions', async () => {
      const { default: dataEncryption } = await import('../src/services/dataEncryption.js');

      // Constants
      expect(dataEncryption.SensitiveDataTypes).toBeDefined();
      expect(dataEncryption.PublicDataTypes).toBeDefined();
      expect(dataEncryption.ENCRYPTION_CONFIG).toBeDefined();

      // Functions
      expect(typeof dataEncryption.isCryptoAvailable).toBe('function');
      expect(typeof dataEncryption.generateEncryptionKey).toBe('function');
      expect(typeof dataEncryption.generateIV).toBe('function');
      expect(typeof dataEncryption.exportKey).toBe('function');
      expect(typeof dataEncryption.importKey).toBe('function');
      expect(typeof dataEncryption.arrayBufferToBase64).toBe('function');
      expect(typeof dataEncryption.base64ToArrayBuffer).toBe('function');
      expect(typeof dataEncryption.encryptData).toBe('function');
      expect(typeof dataEncryption.decryptData).toBe('function');
      expect(typeof dataEncryption.shouldEncrypt).toBe('function');
      expect(typeof dataEncryption.isPublicData).toBe('function');
      expect(typeof dataEncryption.encryptLocation).toBe('function');
      expect(typeof dataEncryption.decryptLocation).toBe('function');
      expect(typeof dataEncryption.encryptPhoneNumber).toBe('function');
      expect(typeof dataEncryption.decryptPhoneNumber).toBe('function');
      expect(typeof dataEncryption.encryptIdentityDocument).toBe('function');
      expect(typeof dataEncryption.decryptIdentityDocument).toBe('function');
      expect(typeof dataEncryption.encryptEmergencyContact).toBe('function');
      expect(typeof dataEncryption.decryptEmergencyContact).toBe('function');
      expect(typeof dataEncryption.encryptSensitiveFields).toBe('function');
      expect(typeof dataEncryption.decryptSensitiveFields).toBe('function');
      expect(typeof dataEncryption.hashData).toBe('function');
      expect(typeof dataEncryption.verifyHash).toBe('function');
      expect(typeof dataEncryption.getEncryptionMetadata).toBe('function');
      expect(typeof dataEncryption.setEncryptionMetadata).toBe('function');
      expect(typeof dataEncryption.clearEncryptionMetadata).toBe('function');
      expect(typeof dataEncryption.getSensitiveDataTypes).toBe('function');
      expect(typeof dataEncryption.getPublicDataTypes).toBe('function');
    });
  });
});

// Separate describe block for tests that use actual Web Crypto API
describe('Data Encryption Service - Crypto Functions', () => {
  // Only run these tests if crypto is available
  const cryptoAvailable = typeof window !== 'undefined' && window.crypto && window.crypto.subtle;

  describe.runIf(cryptoAvailable)('generateIV', () => {
    it('should generate IV of correct length', async () => {
      const { generateIV } = await import('../src/services/dataEncryption.js');
      const iv = generateIV();
      expect(iv).toBeInstanceOf(Uint8Array);
      expect(iv.length).toBe(12); // 96 bits
    });

    it('should generate unique IVs', async () => {
      const { generateIV } = await import('../src/services/dataEncryption.js');
      const iv1 = generateIV();
      const iv2 = generateIV();
      // Very unlikely to be equal with random values
      const areEqual = iv1.every((val, i) => val === iv2[i]);
      expect(areEqual).toBe(false);
    });
  });

  describe.runIf(cryptoAvailable)('generateEncryptionKey', () => {
    it('should generate a CryptoKey', async () => {
      const { generateEncryptionKey } = await import('../src/services/dataEncryption.js');
      const key = await generateEncryptionKey();
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
    });

    it('should generate extractable key', async () => {
      const { generateEncryptionKey } = await import('../src/services/dataEncryption.js');
      const key = await generateEncryptionKey();
      expect(key.extractable).toBe(true);
    });

    it('should support encrypt and decrypt', async () => {
      const { generateEncryptionKey } = await import('../src/services/dataEncryption.js');
      const key = await generateEncryptionKey();
      expect(key.usages).toContain('encrypt');
      expect(key.usages).toContain('decrypt');
    });
  });

  describe.runIf(cryptoAvailable)('exportKey and importKey', () => {
    it('should export key to Base64', async () => {
      const { generateEncryptionKey, exportKey } = await import('../src/services/dataEncryption.js');
      const key = await generateEncryptionKey();
      const exported = await exportKey(key);

      expect(typeof exported).toBe('string');
      expect(exported.length).toBeGreaterThan(0);
    });

    it('should import key from Base64', async () => {
      const { generateEncryptionKey, exportKey, importKey } = await import('../src/services/dataEncryption.js');
      const originalKey = await generateEncryptionKey();
      const exported = await exportKey(originalKey);
      const imported = await importKey(exported);

      expect(imported).toBeDefined();
      expect(imported.type).toBe('secret');
    });

    it('should roundtrip key correctly', async () => {
      const { generateEncryptionKey, exportKey, importKey, encryptData, decryptData } = await import('../src/services/dataEncryption.js');

      const key = await generateEncryptionKey();
      const exported = await exportKey(key);
      const imported = await importKey(exported);

      // Encrypt with original, decrypt with imported
      const plaintext = 'Test message for roundtrip';
      const encrypted = await encryptData(plaintext, key);
      const decrypted = await decryptData(encrypted.ciphertext, encrypted.iv, imported);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe.runIf(cryptoAvailable)('encryptData and decryptData', () => {
    it('should encrypt and decrypt text correctly', async () => {
      const { generateEncryptionKey, encryptData, decryptData } = await import('../src/services/dataEncryption.js');

      const key = await generateEncryptionKey();
      const plaintext = 'Hello, World!';

      const encrypted = await encryptData(plaintext, key);
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.algorithm).toBe('AES-GCM');
      expect(encrypted.encryptedAt).toBeDefined();

      const decrypted = await decryptData(encrypted.ciphertext, encrypted.iv, key);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext each time (unique IV)', async () => {
      const { generateEncryptionKey, encryptData } = await import('../src/services/dataEncryption.js');

      const key = await generateEncryptionKey();
      const plaintext = 'Same message';

      const encrypted1 = await encryptData(plaintext, key);
      const encrypted2 = await encryptData(plaintext, key);

      // IVs should be different
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      // Ciphertexts should also be different due to different IVs
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
    });

    it('should handle Unicode text', async () => {
      const { generateEncryptionKey, encryptData, decryptData } = await import('../src/services/dataEncryption.js');

      const key = await generateEncryptionKey();
      const plaintext = 'Bonjour le monde! 日本語 emoji: 🚀';

      const encrypted = await encryptData(plaintext, key);
      const decrypted = await decryptData(encrypted.ciphertext, encrypted.iv, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle long text', async () => {
      const { generateEncryptionKey, encryptData, decryptData } = await import('../src/services/dataEncryption.js');

      const key = await generateEncryptionKey();
      const plaintext = 'A'.repeat(10000);

      const encrypted = await encryptData(plaintext, key);
      const decrypted = await decryptData(encrypted.ciphertext, encrypted.iv, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw for empty plaintext', async () => {
      const { generateEncryptionKey, encryptData } = await import('../src/services/dataEncryption.js');
      const key = await generateEncryptionKey();

      await expect(encryptData('', key)).rejects.toThrow('Invalid plaintext');
    });

    it('should throw for null plaintext', async () => {
      const { generateEncryptionKey, encryptData } = await import('../src/services/dataEncryption.js');
      const key = await generateEncryptionKey();

      await expect(encryptData(null, key)).rejects.toThrow('Invalid plaintext');
    });

    it('should throw for missing key', async () => {
      const { encryptData } = await import('../src/services/dataEncryption.js');

      await expect(encryptData('test', null)).rejects.toThrow('Encryption key is required');
    });
  });

  describe.runIf(cryptoAvailable)('encryptLocation and decryptLocation', () => {
    it('should encrypt location with approximate coordinates', async () => {
      const { generateEncryptionKey, encryptLocation, decryptLocation } = await import('../src/services/dataEncryption.js');

      const key = await generateEncryptionKey();
      const location = { latitude: 48.8566, longitude: 2.3522, accuracy: 10 };

      const encrypted = await encryptLocation(location, key);

      expect(encrypted.type).toBe('precise_location');
      expect(encrypted.encrypted).toBe(true);
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      // Approximate should be rounded
      expect(encrypted.approximate.latitude).toBe(48.9);
      expect(encrypted.approximate.longitude).toBe(2.4);

      const decrypted = await decryptLocation(encrypted, key);
      expect(decrypted.latitude).toBe(48.8566);
      expect(decrypted.longitude).toBe(2.3522);
    });

    it('should throw for invalid location', async () => {
      const { generateEncryptionKey, encryptLocation } = await import('../src/services/dataEncryption.js');
      const key = await generateEncryptionKey();

      await expect(encryptLocation(null, key)).rejects.toThrow('Invalid location');
      await expect(encryptLocation({}, key)).rejects.toThrow('Invalid location');
      await expect(encryptLocation({ latitude: 'abc' }, key)).rejects.toThrow('Invalid location');
    });
  });

  describe.runIf(cryptoAvailable)('encryptPhoneNumber and decryptPhoneNumber', () => {
    it('should encrypt phone number with preview', async () => {
      const { generateEncryptionKey, encryptPhoneNumber, decryptPhoneNumber } = await import('../src/services/dataEncryption.js');

      const key = await generateEncryptionKey();
      const phone = '+33612345678';

      const encrypted = await encryptPhoneNumber(phone, key);

      expect(encrypted.type).toBe('phone_number');
      expect(encrypted.encrypted).toBe(true);
      expect(encrypted.preview).toBe('***5678');
      expect(encrypted.countryCode).toBe('+33');

      const decrypted = await decryptPhoneNumber(encrypted, key);
      expect(decrypted).toBe('+33612345678');
    });

    it('should handle phone without country code', async () => {
      const { generateEncryptionKey, encryptPhoneNumber } = await import('../src/services/dataEncryption.js');

      const key = await generateEncryptionKey();
      const phone = '0612345678';

      const encrypted = await encryptPhoneNumber(phone, key);

      expect(encrypted.preview).toBe('***5678');
      expect(encrypted.countryCode).toBeNull();
    });
  });

  describe.runIf(cryptoAvailable)('encryptIdentityDocument and decryptIdentityDocument', () => {
    it('should encrypt document with metadata', async () => {
      const { generateEncryptionKey, encryptIdentityDocument, decryptIdentityDocument } = await import('../src/services/dataEncryption.js');

      const key = await generateEncryptionKey();
      const doc = {
        type: 'passport',
        number: 'AB123456',
        expiryDate: '2030-01-01',
        issuingCountry: 'FR',
      };

      const encrypted = await encryptIdentityDocument(doc, key);

      expect(encrypted.type).toBe('identity_document');
      expect(encrypted.encrypted).toBe(true);
      expect(encrypted.metadata.documentType).toBe('passport');
      expect(encrypted.metadata.issuingCountry).toBe('FR');
      expect(encrypted.metadata.isVerified).toBe(true);

      const decrypted = await decryptIdentityDocument(encrypted, key);
      expect(decrypted.type).toBe('passport');
      expect(decrypted.number).toBe('AB123456');
    });
  });

  describe.runIf(cryptoAvailable)('encryptEmergencyContact and decryptEmergencyContact', () => {
    it('should encrypt contact with preview', async () => {
      const { generateEncryptionKey, encryptEmergencyContact, decryptEmergencyContact } = await import('../src/services/dataEncryption.js');

      const key = await generateEncryptionKey();
      const contact = {
        name: 'John Doe',
        phone: '+33612345678',
        relationship: 'parent',
      };

      const encrypted = await encryptEmergencyContact(contact, key);

      expect(encrypted.type).toBe('emergency_contact');
      expect(encrypted.encrypted).toBe(true);
      expect(encrypted.preview.relationship).toBe('parent');
      expect(encrypted.preview.hasPhone).toBe(true);

      const decrypted = await decryptEmergencyContact(encrypted, key);
      expect(decrypted.name).toBe('John Doe');
      expect(decrypted.phone).toBe('+33612345678');
    });
  });

  describe.runIf(cryptoAvailable)('hashData and verifyHash', () => {
    it('should hash data using SHA-256', async () => {
      const { hashData } = await import('../src/services/dataEncryption.js');

      const hash = await hashData('Hello, World!');

      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 = 256 bits = 64 hex chars
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it('should produce consistent hashes', async () => {
      const { hashData } = await import('../src/services/dataEncryption.js');

      const hash1 = await hashData('test');
      const hash2 = await hashData('test');

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', async () => {
      const { hashData } = await import('../src/services/dataEncryption.js');

      const hash1 = await hashData('test1');
      const hash2 = await hashData('test2');

      expect(hash1).not.toBe(hash2);
    });

    it('should verify hash correctly', async () => {
      const { hashData, verifyHash } = await import('../src/services/dataEncryption.js');

      const data = 'My secret data';
      const hash = await hashData(data);

      const isValid = await verifyHash(data, hash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyHash('Different data', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe.runIf(cryptoAvailable)('encryptSensitiveFields and decryptSensitiveFields', () => {
    it('should encrypt specified fields only', async () => {
      const { generateEncryptionKey, encryptSensitiveFields, decryptSensitiveFields } = await import('../src/services/dataEncryption.js');

      const key = await generateEncryptionKey();
      const data = {
        name: 'John',
        phone: '+33612345678',
        email: 'john@example.com',
        public: 'visible',
      };

      const encrypted = await encryptSensitiveFields(data, key, ['phone', 'email']);

      expect(encrypted.name).toBe('John');
      expect(encrypted.public).toBe('visible');
      expect(encrypted.phone.ciphertext).toBeDefined();
      expect(encrypted.email.ciphertext).toBeDefined();

      const decrypted = await decryptSensitiveFields(encrypted, key, ['phone', 'email']);

      expect(decrypted.name).toBe('John');
      expect(decrypted.public).toBe('visible');
      expect(decrypted.phone).toBe('+33612345678');
      expect(decrypted.email).toBe('john@example.com');
    });

    it('should handle non-existent fields gracefully', async () => {
      const { generateEncryptionKey, encryptSensitiveFields } = await import('../src/services/dataEncryption.js');

      const key = await generateEncryptionKey();
      const data = { name: 'John' };

      const encrypted = await encryptSensitiveFields(data, key, ['nonexistent']);

      expect(encrypted.name).toBe('John');
      expect(encrypted.nonexistent).toBeUndefined();
    });

    it('should handle null data', async () => {
      const { generateEncryptionKey, encryptSensitiveFields, decryptSensitiveFields } = await import('../src/services/dataEncryption.js');

      const key = await generateEncryptionKey();

      const encryptedNull = await encryptSensitiveFields(null, key, ['phone']);
      expect(encryptedNull).toBeNull();

      const decryptedNull = await decryptSensitiveFields(null, key, ['phone']);
      expect(decryptedNull).toBeNull();
    });
  });

  describe.runIf(cryptoAvailable)('Integration - Full encryption flow', () => {
    it('should handle complete user data encryption scenario', async () => {
      const {
        generateEncryptionKey,
        exportKey,
        importKey,
        encryptLocation,
        decryptLocation,
        encryptPhoneNumber,
        decryptPhoneNumber,
        shouldEncrypt,
        isPublicData,
      } = await import('../src/services/dataEncryption.js');

      // 1. Generate key (would be stored server-side in Firebase)
      const key = await generateEncryptionKey();
      const exportedKey = await exportKey(key);

      // 2. User profile data
      const userProfile = {
        username: 'traveler42',  // Public
        avatar: 'avatar.jpg',    // Public
        phone: '+33612345678',   // Sensitive
        location: { latitude: 48.8566, longitude: 2.3522 }, // Sensitive
      };

      // 3. Verify data classification
      expect(isPublicData('username')).toBe(true);
      expect(isPublicData('avatar')).toBe(true);
      expect(shouldEncrypt('phone_number')).toBe(true);
      expect(shouldEncrypt('precise_location')).toBe(true);

      // 4. Encrypt sensitive data
      const encryptedPhone = await encryptPhoneNumber(userProfile.phone, key);
      const encryptedLocation = await encryptLocation(userProfile.location, key);

      // 5. Store encrypted profile (simulate)
      const storedProfile = {
        username: userProfile.username,
        avatar: userProfile.avatar,
        phone: encryptedPhone,
        location: encryptedLocation,
      };

      // Public data is readable
      expect(storedProfile.username).toBe('traveler42');
      expect(storedProfile.avatar).toBe('avatar.jpg');

      // Encrypted data shows preview only
      expect(storedProfile.phone.preview).toBe('***5678');
      expect(storedProfile.location.approximate).toBeDefined();

      // 6. Decrypt with key from server
      const serverKey = await importKey(exportedKey);
      const decryptedPhone = await decryptPhoneNumber(storedProfile.phone, serverKey);
      const decryptedLocation = await decryptLocation(storedProfile.location, serverKey);

      expect(decryptedPhone).toBe('+33612345678');
      expect(decryptedLocation.latitude).toBe(48.8566);
    });
  });
});
