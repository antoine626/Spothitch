/**
 * Data Encryption Service
 * Encrypts sensitive user data for GDPR compliance and privacy protection
 *
 * ENCRYPTED DATA:
 * - Precise location (GPS coordinates)
 * - Phone number
 * - Identity document references
 *
 * NOT ENCRYPTED (public data):
 * - Username/pseudo
 * - Avatar
 * - Spots (public)
 *
 * IMPORTANT: Decryption key is stored server-side on Firebase only
 * Client-side encryption uses Web Crypto API with AES-GCM
 */

// Storage key for encrypted data metadata
const ENCRYPTION_STORAGE_KEY = 'spothitch_encryption_meta';

// Encryption algorithm configuration
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Types of sensitive data that should be encrypted
 */
export const SensitiveDataTypes = {
  PRECISE_LOCATION: 'precise_location',
  PHONE_NUMBER: 'phone_number',
  IDENTITY_DOCUMENT: 'identity_document',
  EMERGENCY_CONTACT: 'emergency_contact',
};

/**
 * Data types that should NOT be encrypted (public)
 */
export const PublicDataTypes = {
  USERNAME: 'username',
  AVATAR: 'avatar',
  SPOTS: 'spots',
  BADGES: 'badges',
  LEVEL: 'level',
};

/**
 * Check if Web Crypto API is available
 * @returns {boolean}
 */
export function isCryptoAvailable() {
  return typeof window !== 'undefined' &&
    window.crypto &&
    window.crypto.subtle !== undefined;
}

/**
 * Generate a random encryption key
 * @returns {Promise<CryptoKey>}
 */
export async function generateEncryptionKey() {
  if (!isCryptoAvailable()) {
    throw new Error('Web Crypto API not available');
  }

  const key = await window.crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Generate a random initialization vector (IV)
 * @returns {Uint8Array}
 */
export function generateIV() {
  if (!isCryptoAvailable()) {
    throw new Error('Web Crypto API not available');
  }

  return window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Convert ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 * @param {string} base64
 * @returns {Uint8Array}
 */
export function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Export CryptoKey to raw bytes (for storage on server)
 * @param {CryptoKey} key
 * @returns {Promise<string>} Base64 encoded key
 */
export async function exportKey(key) {
  if (!isCryptoAvailable()) {
    throw new Error('Web Crypto API not available');
  }

  const rawKey = await window.crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(rawKey);
}

/**
 * Import raw key bytes to CryptoKey
 * @param {string} keyBase64 - Base64 encoded key
 * @returns {Promise<CryptoKey>}
 */
export async function importKey(keyBase64) {
  if (!isCryptoAvailable()) {
    throw new Error('Web Crypto API not available');
  }

  const keyData = base64ToArrayBuffer(keyBase64);
  return window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: ALGORITHM, length: KEY_LENGTH },
    false, // not extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM
 * @param {string} plaintext - Data to encrypt
 * @param {CryptoKey} key - Encryption key
 * @returns {Promise<Object>} { ciphertext, iv } both as Base64
 */
export async function encryptData(plaintext, key) {
  if (!isCryptoAvailable()) {
    throw new Error('Web Crypto API not available');
  }

  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Invalid plaintext: must be a non-empty string');
  }

  if (!key) {
    throw new Error('Encryption key is required');
  }

  const iv = generateIV();
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    data
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
    algorithm: ALGORITHM,
    encryptedAt: Date.now(),
  };
}

/**
 * Decrypt data using AES-GCM
 * @param {string} ciphertextBase64 - Base64 encoded ciphertext
 * @param {string} ivBase64 - Base64 encoded IV
 * @param {CryptoKey} key - Decryption key
 * @returns {Promise<string>} Decrypted plaintext
 */
export async function decryptData(ciphertextBase64, ivBase64, key) {
  if (!isCryptoAvailable()) {
    throw new Error('Web Crypto API not available');
  }

  if (!ciphertextBase64 || !ivBase64) {
    throw new Error('Ciphertext and IV are required');
  }

  if (!key) {
    throw new Error('Decryption key is required');
  }

  const ciphertext = base64ToArrayBuffer(ciphertextBase64);
  const iv = base64ToArrayBuffer(ivBase64);

  try {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error('Decryption failed: invalid key or corrupted data');
  }
}

/**
 * Check if a data type should be encrypted
 * @param {string} dataType
 * @returns {boolean}
 */
export function shouldEncrypt(dataType) {
  return Object.values(SensitiveDataTypes).includes(dataType);
}

/**
 * Check if a data type is public (should NOT be encrypted)
 * @param {string} dataType
 * @returns {boolean}
 */
export function isPublicData(dataType) {
  return Object.values(PublicDataTypes).includes(dataType);
}

/**
 * Encrypt location data (latitude, longitude)
 * @param {Object} location - { latitude, longitude }
 * @param {CryptoKey} key - Encryption key
 * @returns {Promise<Object>} Encrypted location object
 */
export async function encryptLocation(location, key) {
  if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    throw new Error('Invalid location: must have latitude and longitude numbers');
  }

  const locationString = JSON.stringify({
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    timestamp: location.timestamp || Date.now(),
  });

  const encrypted = await encryptData(locationString, key);

  return {
    type: SensitiveDataTypes.PRECISE_LOCATION,
    encrypted: true,
    ...encrypted,
    // Include approximate location (city-level) for display without decryption
    approximate: {
      latitude: Math.round(location.latitude * 10) / 10, // ~11km precision
      longitude: Math.round(location.longitude * 10) / 10,
    },
  };
}

/**
 * Decrypt location data
 * @param {Object} encryptedLocation
 * @param {CryptoKey} key
 * @returns {Promise<Object>} Decrypted location
 */
export async function decryptLocation(encryptedLocation, key) {
  if (!encryptedLocation || !encryptedLocation.encrypted) {
    throw new Error('Invalid encrypted location object');
  }

  const decrypted = await decryptData(
    encryptedLocation.ciphertext,
    encryptedLocation.iv,
    key
  );

  return JSON.parse(decrypted);
}

/**
 * Encrypt phone number
 * @param {string} phoneNumber
 * @param {CryptoKey} key
 * @returns {Promise<Object>} Encrypted phone object
 */
export async function encryptPhoneNumber(phoneNumber, key) {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    throw new Error('Invalid phone number');
  }

  // Clean phone number
  const cleanPhone = phoneNumber.replace(/\s/g, '').trim();

  const encrypted = await encryptData(cleanPhone, key);

  return {
    type: SensitiveDataTypes.PHONE_NUMBER,
    encrypted: true,
    ...encrypted,
    // Include last 4 digits for display
    preview: `***${cleanPhone.slice(-4)}`,
    countryCode: cleanPhone.startsWith('+') ? cleanPhone.substring(0, 3) : null,
  };
}

/**
 * Decrypt phone number
 * @param {Object} encryptedPhone
 * @param {CryptoKey} key
 * @returns {Promise<string>} Decrypted phone number
 */
export async function decryptPhoneNumber(encryptedPhone, key) {
  if (!encryptedPhone || !encryptedPhone.encrypted) {
    throw new Error('Invalid encrypted phone object');
  }

  return decryptData(
    encryptedPhone.ciphertext,
    encryptedPhone.iv,
    key
  );
}

/**
 * Encrypt identity document reference
 * @param {Object} documentData - { type, number, expiryDate, issuingCountry }
 * @param {CryptoKey} key
 * @returns {Promise<Object>} Encrypted document object
 */
export async function encryptIdentityDocument(documentData, key) {
  if (!documentData || typeof documentData !== 'object') {
    throw new Error('Invalid document data');
  }

  const docString = JSON.stringify({
    type: documentData.type,
    number: documentData.number,
    expiryDate: documentData.expiryDate,
    issuingCountry: documentData.issuingCountry,
    verifiedAt: documentData.verifiedAt || Date.now(),
  });

  const encrypted = await encryptData(docString, key);

  return {
    type: SensitiveDataTypes.IDENTITY_DOCUMENT,
    encrypted: true,
    ...encrypted,
    // Only include non-sensitive metadata
    metadata: {
      documentType: documentData.type,
      issuingCountry: documentData.issuingCountry,
      isVerified: true,
    },
  };
}

/**
 * Decrypt identity document
 * @param {Object} encryptedDoc
 * @param {CryptoKey} key
 * @returns {Promise<Object>} Decrypted document data
 */
export async function decryptIdentityDocument(encryptedDoc, key) {
  if (!encryptedDoc || !encryptedDoc.encrypted) {
    throw new Error('Invalid encrypted document object');
  }

  const decrypted = await decryptData(
    encryptedDoc.ciphertext,
    encryptedDoc.iv,
    key
  );

  return JSON.parse(decrypted);
}

/**
 * Encrypt emergency contact
 * @param {Object} contact - { name, phone, relationship }
 * @param {CryptoKey} key
 * @returns {Promise<Object>} Encrypted contact object
 */
export async function encryptEmergencyContact(contact, key) {
  if (!contact || typeof contact !== 'object') {
    throw new Error('Invalid contact data');
  }

  const contactString = JSON.stringify({
    name: contact.name,
    phone: contact.phone,
    relationship: contact.relationship,
    addedAt: contact.addedAt || Date.now(),
  });

  const encrypted = await encryptData(contactString, key);

  return {
    type: SensitiveDataTypes.EMERGENCY_CONTACT,
    encrypted: true,
    ...encrypted,
    // Include relationship type for UI display
    preview: {
      relationship: contact.relationship,
      hasPhone: !!contact.phone,
    },
  };
}

/**
 * Decrypt emergency contact
 * @param {Object} encryptedContact
 * @param {CryptoKey} key
 * @returns {Promise<Object>} Decrypted contact
 */
export async function decryptEmergencyContact(encryptedContact, key) {
  if (!encryptedContact || !encryptedContact.encrypted) {
    throw new Error('Invalid encrypted contact object');
  }

  const decrypted = await decryptData(
    encryptedContact.ciphertext,
    encryptedContact.iv,
    key
  );

  return JSON.parse(decrypted);
}

/**
 * Encrypt multiple sensitive fields in an object
 * @param {Object} data - Object with potentially sensitive fields
 * @param {CryptoKey} key - Encryption key
 * @param {string[]} fieldsToEncrypt - List of field names to encrypt
 * @returns {Promise<Object>} Object with encrypted fields
 */
export async function encryptSensitiveFields(data, key, fieldsToEncrypt) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const result = { ...data };

  for (const field of fieldsToEncrypt) {
    if (result[field] !== undefined && result[field] !== null) {
      const valueString = typeof result[field] === 'string'
        ? result[field]
        : JSON.stringify(result[field]);

      result[field] = await encryptData(valueString, key);
    }
  }

  return result;
}

/**
 * Decrypt multiple encrypted fields in an object
 * @param {Object} data - Object with encrypted fields
 * @param {CryptoKey} key - Decryption key
 * @param {string[]} fieldsToDecrypt - List of field names to decrypt
 * @returns {Promise<Object>} Object with decrypted fields
 */
export async function decryptSensitiveFields(data, key, fieldsToDecrypt) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const result = { ...data };

  for (const field of fieldsToDecrypt) {
    const encryptedField = result[field];
    // Check for encrypted flag OR algorithm+ciphertext (set by encryptData)
    if (encryptedField && encryptedField.ciphertext && (encryptedField.encrypted || encryptedField.algorithm)) {
      try {
        const decrypted = await decryptData(
          encryptedField.ciphertext,
          encryptedField.iv,
          key
        );
        // Try to parse as JSON, fallback to string
        try {
          result[field] = JSON.parse(decrypted);
        } catch {
          result[field] = decrypted;
        }
      } catch (error) {
        console.warn(`Failed to decrypt field ${field}:`, error);
        result[field] = null;
      }
    }
  }

  return result;
}

/**
 * Generate a secure hash of data (for verification without encryption)
 * @param {string} data
 * @returns {Promise<string>} SHA-256 hash as hex string
 */
export async function hashData(data) {
  if (!isCryptoAvailable()) {
    throw new Error('Web Crypto API not available');
  }

  if (!data || typeof data !== 'string') {
    throw new Error('Invalid data: must be a non-empty string');
  }

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Verify data against a hash
 * @param {string} data
 * @param {string} expectedHash
 * @returns {Promise<boolean>}
 */
export async function verifyHash(data, expectedHash) {
  const computedHash = await hashData(data);
  return computedHash === expectedHash;
}

/**
 * Get encryption metadata (for debugging/audit)
 * @returns {Object}
 */
export function getEncryptionMetadata() {
  try {
    const stored = localStorage.getItem(ENCRYPTION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Store encryption metadata
 * @param {Object} metadata
 */
export function setEncryptionMetadata(metadata) {
  try {
    localStorage.setItem(ENCRYPTION_STORAGE_KEY, JSON.stringify({
      ...metadata,
      updatedAt: Date.now(),
    }));
  } catch (error) {
    console.warn('Failed to store encryption metadata:', error);
  }
}

/**
 * Clear encryption metadata (for logout/account deletion)
 */
export function clearEncryptionMetadata() {
  try {
    localStorage.removeItem(ENCRYPTION_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear encryption metadata:', error);
  }
}

/**
 * Get list of sensitive data types
 * @returns {string[]}
 */
export function getSensitiveDataTypes() {
  return Object.values(SensitiveDataTypes);
}

/**
 * Get list of public data types
 * @returns {string[]}
 */
export function getPublicDataTypes() {
  return Object.values(PublicDataTypes);
}

/**
 * Encryption configuration for export
 */
export const ENCRYPTION_CONFIG = {
  ALGORITHM,
  KEY_LENGTH,
  IV_LENGTH,
  STORAGE_KEY: ENCRYPTION_STORAGE_KEY,
};

export default {
  // Constants
  SensitiveDataTypes,
  PublicDataTypes,
  ENCRYPTION_CONFIG,
  // Utility functions
  isCryptoAvailable,
  generateEncryptionKey,
  generateIV,
  exportKey,
  importKey,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  // Core encryption
  encryptData,
  decryptData,
  // Data type checks
  shouldEncrypt,
  isPublicData,
  getSensitiveDataTypes,
  getPublicDataTypes,
  // Specific data encryption
  encryptLocation,
  decryptLocation,
  encryptPhoneNumber,
  decryptPhoneNumber,
  encryptIdentityDocument,
  decryptIdentityDocument,
  encryptEmergencyContact,
  decryptEmergencyContact,
  // Bulk operations
  encryptSensitiveFields,
  decryptSensitiveFields,
  // Hashing
  hashData,
  verifyHash,
  // Metadata
  getEncryptionMetadata,
  setEncryptionMetadata,
  clearEncryptionMetadata,
};
