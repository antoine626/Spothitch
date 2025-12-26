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

/**
 * IndexedDB helper for larger data storage
 */
export const SpotHitchDB = {
  dbName: 'spothitch-cache',
  version: 1,
  db: null,
  
  /**
   * Initialize IndexedDB
   */
  async init() {
    if (this.db) return this.db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Spots store
        if (!db.objectStoreNames.contains('spots')) {
          const spotsStore = db.createObjectStore('spots', { keyPath: 'id' });
          spotsStore.createIndex('country', 'country', { unique: false });
          spotsStore.createIndex('rating', 'rating', { unique: false });
        }
        
        // Pending sync store
        if (!db.objectStoreNames.contains('pending-sync')) {
          db.createObjectStore('pending-sync', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  },
  
  /**
   * Save spots to IndexedDB
   * @param {Array} spots - Spots to save
   */
  async saveSpots(spots) {
    const db = await this.init();
    const tx = db.transaction('spots', 'readwrite');
    const store = tx.objectStore('spots');
    
    for (const spot of spots) {
      store.put({ ...spot, cachedAt: Date.now() });
    }
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  
  /**
   * Get all spots from IndexedDB
   */
  async getSpots() {
    const db = await this.init();
    const tx = db.transaction('spots', 'readonly');
    const store = tx.objectStore('spots');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Add pending sync operation
   */
  async addPendingSync(operation) {
    const db = await this.init();
    const tx = db.transaction('pending-sync', 'readwrite');
    const store = tx.objectStore('pending-sync');
    
    return new Promise((resolve, reject) => {
      const request = store.add({ ...operation, createdAt: Date.now() });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Get all pending sync operations
   */
  async getPendingSync() {
    const db = await this.init();
    const tx = db.transaction('pending-sync', 'readonly');
    const store = tx.objectStore('pending-sync');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },
  
  /**
   * Clear pending sync operations
   */
  async clearPendingSync() {
    const db = await this.init();
    const tx = db.transaction('pending-sync', 'readwrite');
    const store = tx.objectStore('pending-sync');
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
};
