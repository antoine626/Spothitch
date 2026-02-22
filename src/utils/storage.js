/**
 * Storage utilities for localStorage with fallback
 */

const STORAGE_PREFIX = 'spothitch_v4_';

export const Storage = {
  /**
   * Get item from localStorage
   * @param {string} key - Storage key
   * @returns {any} Parsed value or null
   */
  get(key) {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn(`Storage.get error for ${key}:`, e);
      return null;
    }
  },

  /**
   * Set item in localStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {boolean} Success status
   */
  set(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`Storage.set error for ${key}:`, e);
      return false;
    }
  },

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  remove(key) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
      return true;
    } catch (e) {
      console.warn(`Storage.remove error for ${key}:`, e);
      return false;
    }
  },

  /**
   * Clear all SpotHitch data from localStorage
   */
  clear() {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(STORAGE_PREFIX))
        .forEach(key => localStorage.removeItem(key));
      return true;
    } catch (e) {
      console.warn('Storage.clear error:', e);
      return false;
    }
  },
};
