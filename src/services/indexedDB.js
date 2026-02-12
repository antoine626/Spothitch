/**
 * IndexedDB Service
 * Persistent offline storage for spots, trips, and user data
 */

const DB_NAME = 'SpotHitchDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  SPOTS: 'spots',
  TRIPS: 'trips',
  MESSAGES: 'messages',
  USER_DATA: 'userData',
  PENDING_ACTIONS: 'pendingActions',
  CACHE: 'cache',
};

let db = null;

/**
 * Initialize IndexedDB
 */
export async function initDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Spots store
      if (!database.objectStoreNames.contains(STORES.SPOTS)) {
        const spotsStore = database.createObjectStore(STORES.SPOTS, { keyPath: 'id' });
        spotsStore.createIndex('country', 'country', { unique: false });
        spotsStore.createIndex('rating', 'globalRating', { unique: false });
        spotsStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      }

      // Trips store
      if (!database.objectStoreNames.contains(STORES.TRIPS)) {
        const tripsStore = database.createObjectStore(STORES.TRIPS, { keyPath: 'id' });
        tripsStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Messages store
      if (!database.objectStoreNames.contains(STORES.MESSAGES)) {
        const messagesStore = database.createObjectStore(STORES.MESSAGES, { keyPath: 'id', autoIncrement: true });
        messagesStore.createIndex('room', 'room', { unique: false });
        messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // User data store
      if (!database.objectStoreNames.contains(STORES.USER_DATA)) {
        database.createObjectStore(STORES.USER_DATA, { keyPath: 'key' });
      }

      // Pending actions store (for offline sync)
      if (!database.objectStoreNames.contains(STORES.PENDING_ACTIONS)) {
        const pendingStore = database.createObjectStore(STORES.PENDING_ACTIONS, { keyPath: 'id', autoIncrement: true });
        pendingStore.createIndex('type', 'type', { unique: false });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Generic cache store
      if (!database.objectStoreNames.contains(STORES.CACHE)) {
        const cacheStore = database.createObjectStore(STORES.CACHE, { keyPath: 'key' });
        cacheStore.createIndex('expiry', 'expiry', { unique: false });
      }
    };
  });
}

/**
 * Get database instance
 */
async function getDB() {
  if (!db) {
    await initDB();
  }
  return db;
}

// ==================== SPOTS ====================

/**
 * Save spots to IndexedDB
 * @param {Array} spots - Array of spot objects
 */
export async function saveSpots(spots) {
  const database = await getDB();
  const tx = database.transaction(STORES.SPOTS, 'readwrite');
  const store = tx.objectStore(STORES.SPOTS);

  for (const spot of spots) {
    store.put({ ...spot, lastUpdated: Date.now() });
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get all spots from IndexedDB
 */
export async function getSpots() {
  const database = await getDB();
  const tx = database.transaction(STORES.SPOTS, 'readonly');
  const store = tx.objectStore(STORES.SPOTS);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get spot by ID
 */
export async function getSpotById(id) {
  const database = await getDB();
  const tx = database.transaction(STORES.SPOTS, 'readonly');
  const store = tx.objectStore(STORES.SPOTS);

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get spots by country
 */
export async function getSpotsByCountry(country) {
  const database = await getDB();
  const tx = database.transaction(STORES.SPOTS, 'readonly');
  const store = tx.objectStore(STORES.SPOTS);
  const index = store.index('country');

  return new Promise((resolve, reject) => {
    const request = index.getAll(country);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// ==================== TRIPS ====================

/**
 * Save trip to IndexedDB
 */
export async function saveTrip(trip) {
  const database = await getDB();
  const tx = database.transaction(STORES.TRIPS, 'readwrite');
  const store = tx.objectStore(STORES.TRIPS);

  store.put({ ...trip, lastUpdated: Date.now() });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get all trips
 */
export async function getTrips() {
  const database = await getDB();
  const tx = database.transaction(STORES.TRIPS, 'readonly');
  const store = tx.objectStore(STORES.TRIPS);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete trip
 */
export async function deleteTrip(id) {
  const database = await getDB();
  const tx = database.transaction(STORES.TRIPS, 'readwrite');
  const store = tx.objectStore(STORES.TRIPS);

  store.delete(id);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// ==================== MESSAGES ====================

/**
 * Save messages
 */
export async function saveMessages(messages, room) {
  const database = await getDB();
  const tx = database.transaction(STORES.MESSAGES, 'readwrite');
  const store = tx.objectStore(STORES.MESSAGES);

  for (const msg of messages) {
    store.put({ ...msg, room, timestamp: msg.timestamp || Date.now() });
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get messages by room
 */
export async function getMessagesByRoom(room, limit = 100) {
  const database = await getDB();
  const tx = database.transaction(STORES.MESSAGES, 'readonly');
  const store = tx.objectStore(STORES.MESSAGES);
  const index = store.index('room');

  return new Promise((resolve, reject) => {
    const request = index.getAll(room);
    request.onsuccess = () => {
      const messages = request.result || [];
      // Sort by timestamp and limit
      messages.sort((a, b) => b.timestamp - a.timestamp);
      resolve(messages.slice(0, limit));
    };
    request.onerror = () => reject(request.error);
  });
}

// ==================== USER DATA ====================

/**
 * Save user data
 */
export async function saveUserData(key, value) {
  const database = await getDB();
  const tx = database.transaction(STORES.USER_DATA, 'readwrite');
  const store = tx.objectStore(STORES.USER_DATA);

  store.put({ key, value, updatedAt: Date.now() });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get user data
 */
export async function getUserData(key) {
  const database = await getDB();
  const tx = database.transaction(STORES.USER_DATA, 'readonly');
  const store = tx.objectStore(STORES.USER_DATA);

  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result?.value);
    request.onerror = () => reject(request.error);
  });
}

// ==================== PENDING ACTIONS ====================

/**
 * Queue action for later sync
 */
export async function queuePendingAction(type, data) {
  const database = await getDB();
  const tx = database.transaction(STORES.PENDING_ACTIONS, 'readwrite');
  const store = tx.objectStore(STORES.PENDING_ACTIONS);

  store.add({
    type,
    data,
    timestamp: Date.now(),
    retries: 0,
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get pending actions
 */
export async function getPendingActions() {
  const database = await getDB();
  const tx = database.transaction(STORES.PENDING_ACTIONS, 'readonly');
  const store = tx.objectStore(STORES.PENDING_ACTIONS);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove pending action
 */
export async function removePendingAction(id) {
  const database = await getDB();
  const tx = database.transaction(STORES.PENDING_ACTIONS, 'readwrite');
  const store = tx.objectStore(STORES.PENDING_ACTIONS);

  store.delete(id);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Sync pending actions when online
 */
export async function syncPendingActions(syncHandler) {
  const actions = await getPendingActions();

  for (const action of actions) {
    try {
      await syncHandler(action);
      await removePendingAction(action.id);
    } catch (error) {
      console.error('Failed to sync action:', action, error);
      // Increment retry count
      const database = await getDB();
      const tx = database.transaction(STORES.PENDING_ACTIONS, 'readwrite');
      const store = tx.objectStore(STORES.PENDING_ACTIONS);
      store.put({ ...action, retries: (action.retries || 0) + 1 });
    }
  }
}

// ==================== CACHE ====================

/**
 * Set cache item with expiry
 */
export async function setCacheItem(key, value, ttlMs = 3600000) {
  const database = await getDB();
  const tx = database.transaction(STORES.CACHE, 'readwrite');
  const store = tx.objectStore(STORES.CACHE);

  store.put({
    key,
    value,
    expiry: Date.now() + ttlMs,
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get cache item (returns null if expired)
 */
export async function getCacheItem(key) {
  const database = await getDB();
  const tx = database.transaction(STORES.CACHE, 'readonly');
  const store = tx.objectStore(STORES.CACHE);

  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => {
      const item = request.result;
      if (!item) {
        resolve(null);
      } else if (item.expiry < Date.now()) {
        // Expired, clean up
        deleteCacheItem(key);
        resolve(null);
      } else {
        resolve(item.value);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete cache item
 */
export async function deleteCacheItem(key) {
  const database = await getDB();
  const tx = database.transaction(STORES.CACHE, 'readwrite');
  const store = tx.objectStore(STORES.CACHE);

  store.delete(key);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Clear expired cache items
 */
export async function clearExpiredCache() {
  const database = await getDB();
  const tx = database.transaction(STORES.CACHE, 'readwrite');
  const store = tx.objectStore(STORES.CACHE);
  const index = store.index('expiry');
  const now = Date.now();

  return new Promise((resolve, reject) => {
    const range = IDBKeyRange.upperBound(now);
    const request = index.openCursor(range);

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// ==================== UTILITIES ====================

/**
 * Clear all data
 */
export async function clearAllData() {
  const database = await getDB();

  const stores = Object.values(STORES);
  const tx = database.transaction(stores, 'readwrite');

  for (const storeName of stores) {
    tx.objectStore(storeName).clear();
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get database stats
 */
export async function getDBStats() {
  const database = await getDB();
  const stats = {};

  for (const storeName of Object.values(STORES)) {
    const tx = database.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const count = await new Promise((resolve) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
    });
    stats[storeName] = count;
  }

  return stats;
}

// Initialize on import
if (typeof indexedDB !== 'undefined') {
  initDB().catch(console.error);
}

export default {
  initDB,
  saveSpots,
  getSpots,
  getSpotById,
  getSpotsByCountry,
  saveTrip,
  getTrips,
  deleteTrip,
  saveMessages,
  getMessagesByRoom,
  saveUserData,
  getUserData,
  queuePendingAction,
  getPendingActions,
  removePendingAction,
  syncPendingActions,
  setCacheItem,
  getCacheItem,
  deleteCacheItem,
  clearExpiredCache,
  clearAllData,
  getDBStats,
};
