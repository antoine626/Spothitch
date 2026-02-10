/**
 * Request Cache with SWR (Stale-While-Revalidate) pattern
 * Deduplicates concurrent requests and caches results
 */

const cache = new Map()
const pending = new Map()

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
const DEFAULT_STALE_TTL = 30 * 60 * 1000 // 30 minutes stale allowed

/**
 * Fetch with SWR caching and request deduplication
 * @param {string} key - Cache key (usually the URL)
 * @param {Function} fetcher - Async function that returns data
 * @param {Object} options - { ttl, staleTtl, forceRefresh }
 * @returns {Promise<any>} Cached or fresh data
 */
export async function cachedFetch(key, fetcher, options = {}) {
  const { ttl = DEFAULT_TTL, staleTtl = DEFAULT_STALE_TTL, forceRefresh = false } = options

  // Return cached data if fresh
  const cached = cache.get(key)
  if (cached && !forceRefresh) {
    const age = Date.now() - cached.timestamp
    if (age < ttl) {
      return cached.data
    }
    // Stale but usable - return stale and revalidate in background
    if (age < staleTtl) {
      revalidate(key, fetcher, ttl)
      return cached.data
    }
  }

  // Deduplicate: if same request is already in-flight, wait for it
  if (pending.has(key)) {
    return pending.get(key)
  }

  // Fresh fetch
  const promise = fetcher()
    .then(data => {
      cache.set(key, { data, timestamp: Date.now() })
      pending.delete(key)
      return data
    })
    .catch(err => {
      pending.delete(key)
      // Return stale data on error if available
      if (cached) return cached.data
      throw err
    })

  pending.set(key, promise)
  return promise
}

/**
 * Background revalidation (doesn't block caller)
 */
function revalidate(key, fetcher) {
  if (pending.has(key)) return // Already revalidating

  const promise = fetcher()
    .then(data => {
      cache.set(key, { data, timestamp: Date.now() })
      pending.delete(key)
    })
    .catch(() => {
      pending.delete(key)
    })

  pending.set(key, promise)
}

/**
 * Invalidate a cache entry
 */
export function invalidateCache(key) {
  cache.delete(key)
}

/**
 * Clear all cache
 */
export function clearCache() {
  cache.clear()
  pending.clear()
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  return {
    entries: cache.size,
    pending: pending.size,
    keys: [...cache.keys()],
  }
}

export default { cachedFetch, invalidateCache, clearCache, getCacheStats }
