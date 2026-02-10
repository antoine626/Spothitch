/**
 * Client-side Rate Limiting
 * Prevents accidental API abuse and protects external services
 * Tracks request counts per key with sliding window
 */

const windows = new Map() // key → { timestamps: number[], blocked: boolean }

/**
 * Default rate limits per service
 */
const DEFAULT_LIMITS = {
  nominatim: { max: 1, windowMs: 1000 },      // 1 req/sec (Nominatim policy)
  osrm: { max: 5, windowMs: 1000 },           // 5 req/sec
  firebase_read: { max: 50, windowMs: 60000 }, // 50 reads/min
  firebase_write: { max: 10, windowMs: 60000 }, // 10 writes/min
  general: { max: 30, windowMs: 60000 },       // 30 req/min default
}

/**
 * Check if a request is allowed (does NOT consume a slot)
 * @param {string} key - Rate limit key (e.g., 'nominatim')
 * @param {Object} [limit] - { max, windowMs }
 * @returns {boolean}
 */
export function canRequest(key, limit) {
  const config = limit || DEFAULT_LIMITS[key] || DEFAULT_LIMITS.general
  const now = Date.now()

  if (!windows.has(key)) {
    windows.set(key, { timestamps: [], blocked: false })
  }

  const window = windows.get(key)
  // Clean old timestamps
  window.timestamps = window.timestamps.filter(t => now - t < config.windowMs)

  return window.timestamps.length < config.max
}

/**
 * Record a request (consume a rate limit slot)
 * @param {string} key - Rate limit key
 * @returns {boolean} true if allowed, false if rate limited
 */
export function recordRequest(key, limit) {
  const config = limit || DEFAULT_LIMITS[key] || DEFAULT_LIMITS.general
  const now = Date.now()

  if (!windows.has(key)) {
    windows.set(key, { timestamps: [], blocked: false })
  }

  const window = windows.get(key)
  window.timestamps = window.timestamps.filter(t => now - t < config.windowMs)

  if (window.timestamps.length >= config.max) {
    window.blocked = true
    return false
  }

  window.timestamps.push(now)
  window.blocked = false
  return true
}

/**
 * Wrap an async function with rate limiting
 * Returns null if rate limited
 * @param {string} key - Rate limit key
 * @param {Function} fn - Async function to wrap
 * @param {Object} [limit] - { max, windowMs }
 * @returns {Function} Rate-limited function
 */
export function withRateLimit(key, fn, limit) {
  return async (...args) => {
    if (!recordRequest(key, limit)) {
      console.warn(`[RateLimit] ${key}: request blocked (limit reached)`)
      return null
    }
    return fn(...args)
  }
}

/**
 * Get time until next slot is available
 * @param {string} key
 * @returns {number} milliseconds until a slot opens, 0 if available now
 */
export function getWaitTime(key, limit) {
  const config = limit || DEFAULT_LIMITS[key] || DEFAULT_LIMITS.general
  const now = Date.now()

  if (!windows.has(key)) return 0

  const window = windows.get(key)
  window.timestamps = window.timestamps.filter(t => now - t < config.windowMs)

  if (window.timestamps.length < config.max) return 0

  // Oldest timestamp + windowMs = when it expires
  const oldest = Math.min(...window.timestamps)
  return Math.max(0, oldest + config.windowMs - now)
}

/**
 * Get rate limit stats for debugging
 * @returns {Object}
 */
export function getRateLimitStats() {
  const stats = {}
  for (const [key, win] of windows.entries()) {
    const config = DEFAULT_LIMITS[key] || DEFAULT_LIMITS.general
    const now = Date.now()
    const active = win.timestamps.filter(t => now - t < config.windowMs)
    stats[key] = {
      used: active.length,
      max: config.max,
      blocked: win.blocked,
      windowMs: config.windowMs,
    }
  }
  return stats
}

/**
 * Reset rate limit for a key
 * @param {string} key
 */
export function resetRateLimit(key) {
  windows.delete(key)
}

/**
 * Reset all rate limits
 */
export function resetAllRateLimits() {
  windows.clear()
}

export default {
  canRequest,
  recordRequest,
  withRateLimit,
  getWaitTime,
  getRateLimitStats,
  resetRateLimit,
  resetAllRateLimits,
}
