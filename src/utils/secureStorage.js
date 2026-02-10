/**
 * Secure Storage - Encrypted localStorage for sensitive data
 * Uses AES-GCM via Web Crypto API
 * Falls back to base64 obfuscation if Web Crypto unavailable
 */

const ALGO = 'AES-GCM'
const KEY_NAME = 'spothitch_crypto_key'
let cryptoKey = null

/**
 * Generate or retrieve the encryption key
 * Key is stored in sessionStorage (cleared on browser close)
 */
async function getKey() {
  if (cryptoKey) return cryptoKey

  if (!window.crypto?.subtle) return null

  // Try to restore from session
  const stored = sessionStorage.getItem(KEY_NAME)
  if (stored) {
    try {
      const raw = Uint8Array.from(atob(stored), c => c.charCodeAt(0))
      cryptoKey = await crypto.subtle.importKey('raw', raw, ALGO, true, ['encrypt', 'decrypt'])
      return cryptoKey
    } catch (e) { /* regenerate */ }
  }

  // Generate new key
  cryptoKey = await crypto.subtle.generateKey(
    { name: ALGO, length: 256 },
    true,
    ['encrypt', 'decrypt']
  )

  // Store in session (survives page refreshes but not browser close)
  const exported = await crypto.subtle.exportKey('raw', cryptoKey)
  sessionStorage.setItem(KEY_NAME, btoa(String.fromCharCode(...new Uint8Array(exported))))

  return cryptoKey
}

/**
 * Encrypt a string value
 * @param {string} plaintext
 * @returns {Promise<string>} Base64-encoded ciphertext
 */
async function encrypt(plaintext) {
  const key = await getKey()
  if (!key) {
    // Fallback: base64 obfuscation (not secure, but better than plaintext)
    return 'b64:' + btoa(unescape(encodeURIComponent(plaintext)))
  }

  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = encoder.encode(plaintext)

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    data
  )

  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)

  return 'enc:' + btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt a string value
 * @param {string} ciphertext - Base64-encoded
 * @returns {Promise<string>} Decrypted plaintext
 */
async function decrypt(ciphertext) {
  // Base64 fallback
  if (ciphertext.startsWith('b64:')) {
    return decodeURIComponent(escape(atob(ciphertext.slice(4))))
  }

  if (!ciphertext.startsWith('enc:')) return ciphertext // Plain text (legacy)

  const key = await getKey()
  if (!key) return null

  const combined = Uint8Array.from(atob(ciphertext.slice(4)), c => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGO, iv },
    key,
    data
  )

  return new TextDecoder().decode(decrypted)
}

/**
 * Set an encrypted value in localStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to encrypt and store
 */
export async function setSecure(key, value) {
  try {
    const json = JSON.stringify(value)
    const encrypted = await encrypt(json)
    localStorage.setItem(key, encrypted)
  } catch (e) {
    console.warn('[SecureStorage] Encryption failed, storing plain:', e)
    localStorage.setItem(key, JSON.stringify(value))
  }
}

/**
 * Get a decrypted value from localStorage
 * @param {string} key - Storage key
 * @returns {Promise<any>} Decrypted value or null
 */
export async function getSecure(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null

    // Check if encrypted
    if (raw.startsWith('enc:') || raw.startsWith('b64:')) {
      const decrypted = await decrypt(raw)
      return decrypted ? JSON.parse(decrypted) : null
    }

    // Plain text (legacy data)
    return JSON.parse(raw)
  } catch (e) {
    console.warn('[SecureStorage] Decryption failed:', e)
    return null
  }
}

/**
 * Remove a secure value
 * @param {string} key
 */
export function removeSecure(key) {
  localStorage.removeItem(key)
}

/**
 * Check if Web Crypto is available
 * @returns {boolean}
 */
export function isCryptoAvailable() {
  return !!(window.crypto?.subtle)
}

export default { setSecure, getSecure, removeSecure, isCryptoAvailable }
