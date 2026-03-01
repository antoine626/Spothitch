/**
 * IndexedDB Wrapper
 * Lightweight async API for large data storage
 * Replaces localStorage for: spots offline, messages, photos, trip data
 *
 * Stores:
 * - spots: offline spots cache (37K+ items)
 * - messages: chat messages for offline access
 * - photos: photo blobs for check-ins
 * - trips: saved trip data
 * - cache: generic cache store (SWR pattern)
 */

const DB_NAME = 'spothitch'
const DB_VERSION = 2

const STORES = {
  spots: { keyPath: 'id', indexes: ['country', 'rating', 'lastActivity'] },
  messages: { keyPath: 'id', indexes: ['conversationId', 'timestamp'] },
  photos: { keyPath: 'id', indexes: ['spotId', 'timestamp'] },
  trips: { keyPath: 'id', indexes: ['created'] },
  cache: { keyPath: 'key', indexes: ['expires'] },
  tiles: { keyPath: 'key', indexes: ['country', 'zoom'] },
}

let dbPromise = null
let worker = null

/**
 * Open/create the database
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      for (const [name, config] of Object.entries(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: config.keyPath })
          for (const idx of config.indexes || []) {
            store.createIndex(idx, idx, { unique: false })
          }
        }
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return dbPromise
}

/**
 * Get a transaction store
 */
async function getStore(storeName, mode = 'readonly') {
  const db = await openDB()
  const tx = db.transaction(storeName, mode)
  return tx.objectStore(storeName)
}

/**
 * Wrap an IDB request in a Promise
 */
function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ==================== CRUD API ====================

/**
 * Get a single item by key
 * @param {string} storeName
 * @param {string|number} key
 * @returns {Promise<any>}
 */
export async function get(storeName, key) {
  try {
    const store = await getStore(storeName)
    return promisify(store.get(key))
  } catch (e) {
    console.warn(`[IDB] get(${storeName}, ${key}) failed:`, e)
    return null
  }
}

/**
 * Get all items from a store
 * @param {string} storeName
 * @returns {Promise<Array>}
 */
export async function getAll(storeName) {
  try {
    const store = await getStore(storeName)
    return promisify(store.getAll())
  } catch (e) {
    console.warn(`[IDB] getAll(${storeName}) failed:`, e)
    return []
  }
}

/**
 * Get items by index value
 * @param {string} storeName
 * @param {string} indexName
 * @param {any} value
 * @returns {Promise<Array>}
 */
export async function getByIndex(storeName, indexName, value) {
  try {
    const store = await getStore(storeName)
    const index = store.index(indexName)
    return promisify(index.getAll(value))
  } catch (e) {
    console.warn(`[IDB] getByIndex(${storeName}, ${indexName}) failed:`, e)
    return []
  }
}

/**
 * Put (insert or update) an item
 * @param {string} storeName
 * @param {Object} item - Must have the keyPath field
 * @returns {Promise<any>} The key
 */
export async function put(storeName, item) {
  try {
    const store = await getStore(storeName, 'readwrite')
    return promisify(store.put(item))
  } catch (e) {
    console.warn(`[IDB] put(${storeName}) failed:`, e)
    return null
  }
}

/**
 * Put multiple items in a single transaction (bulk insert)
 * @param {string} storeName
 * @param {Array} items
 * @returns {Promise<void>}
 */
export async function putAll(storeName, items) {
  try {
    const db = await openDB()
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)

    for (const item of items) {
      store.put(item)
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn(`[IDB] putAll(${storeName}, ${items.length} items) failed:`, e)
  }
}

/**
 * Delete an item by key
 * @param {string} storeName
 * @param {string|number} key
 */
export async function remove(storeName, key) {
  try {
    const store = await getStore(storeName, 'readwrite')
    return promisify(store.delete(key))
  } catch (e) {
    console.warn(`[IDB] remove(${storeName}, ${key}) failed:`, e)
  }
}

/**
 * Clear all items from a store
 * @param {string} storeName
 */
export async function clear(storeName) {
  try {
    const store = await getStore(storeName, 'readwrite')
    return promisify(store.clear())
  } catch (e) {
    console.warn(`[IDB] clear(${storeName}) failed:`, e)
  }
}

/**
 * Count items in a store
 * @param {string} storeName
 * @returns {Promise<number>}
 */
export async function count(storeName) {
  try {
    const store = await getStore(storeName)
    return promisify(store.count())
  } catch (e) {
    return 0
  }
}

// ==================== CACHE API ====================

/**
 * Get from cache with TTL check
 * @param {string} key
 * @returns {Promise<any>} Data or null if expired/missing
 */
export async function cacheGet(key) {
  const item = await get('cache', key)
  if (!item) return null
  if (item.expires && item.expires < Date.now()) {
    await remove('cache', key)
    return null
  }
  return item.data
}

/**
 * Set cache with TTL
 * @param {string} key
 * @param {any} data
 * @param {number} [ttlMs=300000] - TTL in milliseconds (default 5min)
 */
export async function cacheSet(key, data, ttlMs = 300000) {
  await put('cache', {
    key,
    data,
    expires: Date.now() + ttlMs,
    created: Date.now(),
  })
}

/**
 * Clear expired cache entries
 */
export async function cacheCleanup() {
  try {
    const all = await getAll('cache')
    const now = Date.now()
    const expired = all.filter(item => item.expires && item.expires < now)
    for (const item of expired) {
      await remove('cache', item.key)
    }
    return expired.length
  } catch (e) {
    return 0
  }
}

// ==================== SPOTS API ====================

/**
 * Save spots for offline use (bulk)
 * @param {Array} spots
 */
export async function saveOfflineSpots(spots) {
  await putAll('spots', spots)
}

/**
 * Get all offline spots
 * @returns {Promise<Array>}
 */
export async function getOfflineSpots() {
  return getAll('spots')
}

/**
 * Get spots by country
 * @param {string} country
 * @returns {Promise<Array>}
 */
export async function getSpotsByCountry(country) {
  return getByIndex('spots', 'country', country)
}

// ==================== STORAGE STATS ====================

/**
 * Get database storage usage
 * @returns {Promise<Object>}
 */
export async function getStorageStats() {
  const stats = {}
  for (const name of Object.keys(STORES)) {
    stats[name] = await count(name)
  }

  // Estimate total size if StorageManager available
  if (navigator.storage?.estimate) {
    const est = await navigator.storage.estimate()
    stats.usedBytes = est.usage || 0
    stats.quotaBytes = est.quota || 0
    stats.usedMB = Math.round((est.usage || 0) / 1024 / 1024 * 10) / 10
    stats.quotaMB = Math.round((est.quota || 0) / 1024 / 1024)
  }

  return stats
}

/**
 * Delete the entire database
 */
export async function deleteDatabase() {
  if (worker) {
    worker = null
  }
  dbPromise = null
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export default {
  get, getAll, getByIndex, put, putAll, remove, clear, count,
  cacheGet, cacheSet, cacheCleanup,
  saveOfflineSpots, getOfflineSpots, getSpotsByCountry,
  getStorageStats, deleteDatabase,
}
