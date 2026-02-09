/**
 * Smart Preload Service
 * Intelligently preloads content based on network conditions
 * Supports multiple strategies: aggressive, moderate, minimal, none
 */

import { Storage } from '../utils/storage.js'

// Preload strategies
export const PreloadStrategy = {
  AGGRESSIVE: 'aggressive', // WiFi - preload everything
  MODERATE: 'moderate',     // 4G - preload essential content
  MINIMAL: 'minimal',       // 3G/2G - preload only critical data
  NONE: 'none',             // Data saver - no preloading
}

// Connection type to strategy mapping
const CONNECTION_STRATEGY_MAP = {
  wifi: PreloadStrategy.AGGRESSIVE,
  '4g': PreloadStrategy.MODERATE,
  '3g': PreloadStrategy.MINIMAL,
  '2g': PreloadStrategy.MINIMAL,
  'slow-2g': PreloadStrategy.NONE,
  unknown: PreloadStrategy.MODERATE,
}

// Strategy configuration
const STRATEGY_CONFIG = {
  [PreloadStrategy.AGGRESSIVE]: {
    maxSpots: 100,
    preloadImages: true,
    preloadRoutes: true,
    preloadUserProfiles: true,
    maxConcurrent: 5,
    cacheExpiry: 60 * 60 * 1000, // 1 hour
  },
  [PreloadStrategy.MODERATE]: {
    maxSpots: 50,
    preloadImages: true,
    preloadRoutes: true,
    preloadUserProfiles: false,
    maxConcurrent: 3,
    cacheExpiry: 30 * 60 * 1000, // 30 minutes
  },
  [PreloadStrategy.MINIMAL]: {
    maxSpots: 20,
    preloadImages: false,
    preloadRoutes: false,
    preloadUserProfiles: false,
    maxConcurrent: 1,
    cacheExpiry: 15 * 60 * 1000, // 15 minutes
  },
  [PreloadStrategy.NONE]: {
    maxSpots: 0,
    preloadImages: false,
    preloadRoutes: false,
    preloadUserProfiles: false,
    maxConcurrent: 0,
    cacheExpiry: 0,
  },
}

// Internal state
let currentStrategy = null
let isInitialized = false
let activePreloads = new Map()
let preloadQueue = []
let preloadStats = {
  spotsPreloaded: 0,
  routesPreloaded: 0,
  usersPreloaded: 0,
  bytesPreloaded: 0,
  errors: 0,
  cancelled: 0,
}
let preloadCache = new Map()
let connectionType = 'unknown'
let isDataSaverEnabled = false

// AbortController for cancellation
let abortController = null

/**
 * Initialize the smart preload service
 * Auto-detects network connection and sets appropriate strategy
 * @returns {Object} Initial preload status
 */
export function initSmartPreload() {
  if (isInitialized) {
    return getPreloadStatus()
  }

  // Detect connection type
  detectConnectionType()

  // Set initial strategy based on connection
  if (!currentStrategy) {
    currentStrategy = getStrategyForConnection(connectionType)
  }

  // Check for data saver mode
  checkDataSaver()

  // Listen for connection changes
  if (typeof navigator !== 'undefined' && navigator.connection) {
    navigator.connection.addEventListener('change', handleConnectionChange)
  }

  // Listen for online/offline
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  }

  // Load cached stats
  loadCachedStats()

  isInitialized = true
  console.log(`[SmartPreload] Initialized with strategy: ${currentStrategy}`)

  return getPreloadStatus()
}

/**
 * Detect current connection type using Network Information API
 * @returns {string} Connection type
 */
export function detectConnectionType() {
  if (typeof navigator === 'undefined') {
    connectionType = 'unknown'
    return connectionType
  }

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

  if (connection) {
    // Check effective type (4g, 3g, 2g, slow-2g)
    connectionType = connection.effectiveType || 'unknown'

    // Override if on WiFi
    if (connection.type === 'wifi') {
      connectionType = 'wifi'
    }
  } else {
    // Fallback: assume moderate connection
    connectionType = 'unknown'
  }

  return connectionType
}

/**
 * Check if data saver mode is enabled
 * @returns {boolean} True if data saver is enabled
 */
export function checkDataSaver() {
  if (typeof navigator === 'undefined') {
    return false
  }

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

  if (connection && connection.saveData) {
    isDataSaverEnabled = true
    currentStrategy = PreloadStrategy.NONE
    return true
  }

  isDataSaverEnabled = false
  return false
}

/**
 * Get the appropriate strategy for a connection type
 * @param {string} connType - Connection type
 * @returns {string} Preload strategy
 */
export function getStrategyForConnection(connType) {
  if (isDataSaverEnabled) {
    return PreloadStrategy.NONE
  }
  return CONNECTION_STRATEGY_MAP[connType] || PreloadStrategy.MODERATE
}

/**
 * Set preload strategy manually
 * @param {string} strategy - One of PreloadStrategy values
 * @returns {boolean} True if strategy was set successfully
 */
export function setPreloadStrategy(strategy) {
  if (!Object.values(PreloadStrategy).includes(strategy)) {
    console.warn(`[SmartPreload] Invalid strategy: ${strategy}`)
    return false
  }

  const previousStrategy = currentStrategy
  currentStrategy = strategy

  // Cancel active preloads if switching to NONE
  if (strategy === PreloadStrategy.NONE && previousStrategy !== PreloadStrategy.NONE) {
    cancelPreload()
  }

  console.log(`[SmartPreload] Strategy changed: ${previousStrategy} -> ${strategy}`)
  return true
}

/**
 * Get current preload strategy
 * @returns {string} Current strategy
 */
export function getPreloadStrategy() {
  return currentStrategy || PreloadStrategy.MODERATE
}

/**
 * Get strategy configuration
 * @param {string} strategy - Strategy name (optional, defaults to current)
 * @returns {Object} Strategy configuration
 */
export function getStrategyConfig(strategy = null) {
  const strat = strategy || currentStrategy || PreloadStrategy.MODERATE
  return { ...STRATEGY_CONFIG[strat] }
}

/**
 * Preload spots within given bounds
 * @param {Object} bounds - Geographic bounds { north, south, east, west }
 * @returns {Promise<Object>} Preload result with spots data
 */
export async function preloadSpots(bounds) {
  if (!isInitialized) {
    initSmartPreload()
  }

  if (currentStrategy === PreloadStrategy.NONE) {
    return { success: false, reason: 'preload_disabled', spots: [] }
  }

  if (!bounds || typeof bounds.north !== 'number' || typeof bounds.south !== 'number' ||
      typeof bounds.east !== 'number' || typeof bounds.west !== 'number') {
    return { success: false, reason: 'invalid_bounds', spots: [] }
  }

  // Check if offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, reason: 'offline', spots: [] }
  }

  const config = getStrategyConfig()
  const cacheKey = `spots_${bounds.north.toFixed(2)}_${bounds.south.toFixed(2)}_${bounds.east.toFixed(2)}_${bounds.west.toFixed(2)}`

  // Check cache first
  const cached = preloadCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < config.cacheExpiry) {
    return { success: true, reason: 'cached', spots: cached.data, fromCache: true }
  }

  // Create abort controller for this operation
  abortController = new AbortController()
  const preloadId = `spots_${Date.now()}`
  activePreloads.set(preloadId, { type: 'spots', bounds, startTime: Date.now() })

  try {
    // Simulate fetching spots (in real app, would call Firebase or API)
    const spots = await fetchSpotsInBounds(bounds, config.maxSpots, abortController.signal)

    // Preload images if strategy allows
    if (config.preloadImages && spots.length > 0) {
      await preloadSpotImages(spots, abortController.signal)
    }

    // Cache the result
    preloadCache.set(cacheKey, { data: spots, timestamp: Date.now() })
    preloadStats.spotsPreloaded += spots.length
    saveCachedStats()

    activePreloads.delete(preloadId)
    return { success: true, reason: 'preloaded', spots, count: spots.length }
  } catch (error) {
    activePreloads.delete(preloadId)
    if (error.name === 'AbortError') {
      preloadStats.cancelled++
      return { success: false, reason: 'cancelled', spots: [] }
    }
    preloadStats.errors++
    console.error('[SmartPreload] Error preloading spots:', error)
    return { success: false, reason: 'error', error: error.message, spots: [] }
  }
}

/**
 * Preload route between two points
 * @param {Object} origin - Origin point { lat, lng }
 * @param {Object} dest - Destination point { lat, lng }
 * @returns {Promise<Object>} Preload result with route data
 */
export async function preloadRoute(origin, dest) {
  if (!isInitialized) {
    initSmartPreload()
  }

  const config = getStrategyConfig()

  if (currentStrategy === PreloadStrategy.NONE || !config.preloadRoutes) {
    return { success: false, reason: 'preload_disabled', route: null }
  }

  if (!origin || !dest || typeof origin.lat !== 'number' || typeof origin.lng !== 'number' ||
      typeof dest.lat !== 'number' || typeof dest.lng !== 'number') {
    return { success: false, reason: 'invalid_coordinates', route: null }
  }

  // Check if offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, reason: 'offline', route: null }
  }

  const cacheKey = `route_${origin.lat.toFixed(3)}_${origin.lng.toFixed(3)}_${dest.lat.toFixed(3)}_${dest.lng.toFixed(3)}`

  // Check cache first
  const cached = preloadCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < config.cacheExpiry) {
    return { success: true, reason: 'cached', route: cached.data, fromCache: true }
  }

  // Create abort controller for this operation
  abortController = new AbortController()
  const preloadId = `route_${Date.now()}`
  activePreloads.set(preloadId, { type: 'route', origin, dest, startTime: Date.now() })

  try {
    // Simulate fetching route (in real app, would call OSRM)
    const route = await fetchRoute(origin, dest, abortController.signal)

    // Cache the result
    preloadCache.set(cacheKey, { data: route, timestamp: Date.now() })
    preloadStats.routesPreloaded++
    saveCachedStats()

    activePreloads.delete(preloadId)
    return { success: true, reason: 'preloaded', route }
  } catch (error) {
    activePreloads.delete(preloadId)
    if (error.name === 'AbortError') {
      preloadStats.cancelled++
      return { success: false, reason: 'cancelled', route: null }
    }
    preloadStats.errors++
    console.error('[SmartPreload] Error preloading route:', error)
    return { success: false, reason: 'error', error: error.message, route: null }
  }
}

/**
 * Preload user data
 * @param {string} userId - User ID to preload
 * @returns {Promise<Object>} Preload result with user data
 */
export async function preloadUserData(userId) {
  if (!isInitialized) {
    initSmartPreload()
  }

  const config = getStrategyConfig()

  if (currentStrategy === PreloadStrategy.NONE || !config.preloadUserProfiles) {
    return { success: false, reason: 'preload_disabled', user: null }
  }

  if (!userId || typeof userId !== 'string') {
    return { success: false, reason: 'invalid_user_id', user: null }
  }

  // Check if offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, reason: 'offline', user: null }
  }

  const cacheKey = `user_${userId}`

  // Check cache first
  const cached = preloadCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < config.cacheExpiry) {
    return { success: true, reason: 'cached', user: cached.data, fromCache: true }
  }

  // Create abort controller for this operation
  abortController = new AbortController()
  const preloadId = `user_${Date.now()}`
  activePreloads.set(preloadId, { type: 'user', userId, startTime: Date.now() })

  try {
    // Simulate fetching user data (in real app, would call Firebase)
    const userData = await fetchUserData(userId, abortController.signal)

    // Cache the result
    preloadCache.set(cacheKey, { data: userData, timestamp: Date.now() })
    preloadStats.usersPreloaded++
    saveCachedStats()

    activePreloads.delete(preloadId)
    return { success: true, reason: 'preloaded', user: userData }
  } catch (error) {
    activePreloads.delete(preloadId)
    if (error.name === 'AbortError') {
      preloadStats.cancelled++
      return { success: false, reason: 'cancelled', user: null }
    }
    preloadStats.errors++
    console.error('[SmartPreload] Error preloading user data:', error)
    return { success: false, reason: 'error', error: error.message, user: null }
  }
}

/**
 * Cancel all active preloads
 * @returns {number} Number of preloads cancelled
 */
export function cancelPreload() {
  const count = activePreloads.size

  // Abort any ongoing fetch requests
  if (abortController) {
    abortController.abort()
    abortController = null
  }

  // Clear active preloads
  activePreloads.clear()

  // Clear queue
  preloadQueue = []

  preloadStats.cancelled += count
  console.log(`[SmartPreload] Cancelled ${count} preload(s)`)

  return count
}

/**
 * Get current preload status
 * @returns {Object} Preload status object
 */
export function getPreloadStatus() {
  return {
    initialized: isInitialized,
    strategy: currentStrategy || PreloadStrategy.MODERATE,
    connectionType,
    isDataSaverEnabled,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    activePreloads: activePreloads.size,
    queuedPreloads: preloadQueue.length,
    cacheSize: preloadCache.size,
    stats: { ...preloadStats },
    config: getStrategyConfig(),
  }
}

/**
 * Get preload statistics
 * @returns {Object} Statistics object
 */
export function getPreloadStats() {
  return { ...preloadStats }
}

/**
 * Clear preload cache
 * @param {string} type - Optional type to clear ('spots', 'routes', 'users', or all if undefined)
 * @returns {number} Number of items cleared
 */
export function clearPreloadCache(type = null) {
  let count = 0

  if (!type) {
    count = preloadCache.size
    preloadCache.clear()
  } else {
    for (const [key, value] of preloadCache.entries()) {
      if (key.startsWith(type)) {
        preloadCache.delete(key)
        count++
      }
    }
  }

  console.log(`[SmartPreload] Cleared ${count} cached item(s)`)
  return count
}

/**
 * Get cached data
 * @param {string} cacheKey - Cache key
 * @returns {Object|null} Cached data or null
 */
export function getCachedData(cacheKey) {
  const cached = preloadCache.get(cacheKey)
  if (!cached) return null

  const config = getStrategyConfig()
  if (Date.now() - cached.timestamp > config.cacheExpiry) {
    preloadCache.delete(cacheKey)
    return null
  }

  return cached.data
}

/**
 * Check if preload is currently active
 * @returns {boolean} True if preloading is in progress
 */
export function isPreloading() {
  return activePreloads.size > 0
}

/**
 * Reset preload service to initial state
 */
export function resetSmartPreload() {
  cancelPreload()
  preloadCache.clear()
  preloadStats = {
    spotsPreloaded: 0,
    routesPreloaded: 0,
    usersPreloaded: 0,
    bytesPreloaded: 0,
    errors: 0,
    cancelled: 0,
  }
  currentStrategy = null
  isInitialized = false
  connectionType = 'unknown'
  isDataSaverEnabled = false
  Storage.remove('preloadStats')
  console.log('[SmartPreload] Service reset')
}

// ============================================
// Internal helper functions
// ============================================

/**
 * Handle connection type change
 * @private
 */
function handleConnectionChange() {
  const previousType = connectionType
  detectConnectionType()

  if (previousType !== connectionType) {
    const newStrategy = getStrategyForConnection(connectionType)
    console.log(`[SmartPreload] Connection changed: ${previousType} -> ${connectionType}`)

    // Auto-adjust strategy if not manually set
    if (currentStrategy !== newStrategy) {
      setPreloadStrategy(newStrategy)
    }
  }
}

/**
 * Handle going online
 * @private
 */
function handleOnline() {
  console.log('[SmartPreload] Network online')
  detectConnectionType()
}

/**
 * Handle going offline
 * @private
 */
function handleOffline() {
  console.log('[SmartPreload] Network offline')
  cancelPreload()
}

/**
 * Simulate fetching spots in bounds
 * @private
 */
async function fetchSpotsInBounds(bounds, maxSpots, signal) {
  // Check for abort
  if (signal && signal.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  // In a real implementation, this would call Firebase or an API
  // For now, we simulate with a delay
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, 50)
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeout)
        reject(new DOMException('Aborted', 'AbortError'))
      })
    }
  })

  // Return mock spots based on bounds
  const spots = []
  const latRange = bounds.north - bounds.south
  const lngRange = bounds.east - bounds.west

  for (let i = 0; i < Math.min(maxSpots, 10); i++) {
    spots.push({
      id: `spot_${i}`,
      lat: bounds.south + (latRange * Math.random()),
      lng: bounds.west + (lngRange * Math.random()),
      name: `Spot ${i + 1}`,
      rating: 3 + (Math.random() * 2),
    })
  }

  return spots
}

/**
 * Simulate fetching route
 * @private
 */
async function fetchRoute(origin, dest, signal) {
  // Check for abort
  if (signal && signal.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  // In a real implementation, this would call OSRM
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, 50)
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeout)
        reject(new DOMException('Aborted', 'AbortError'))
      })
    }
  })

  // Calculate approximate distance using Haversine formula
  const R = 6371 // Earth radius in km
  const dLat = (dest.lat - origin.lat) * Math.PI / 180
  const dLng = (dest.lng - origin.lng) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(origin.lat * Math.PI / 180) * Math.cos(dest.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c * 1000 // Convert to meters

  return {
    distance,
    duration: distance / 15, // Assume 15 m/s average speed (54 km/h)
    geometry: [
      [origin.lng, origin.lat],
      [dest.lng, dest.lat],
    ],
  }
}

/**
 * Simulate fetching user data
 * @private
 */
async function fetchUserData(userId, signal) {
  // Check for abort
  if (signal && signal.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, 50)
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeout)
        reject(new DOMException('Aborted', 'AbortError'))
      })
    }
  })

  return {
    id: userId,
    username: `User_${userId.substring(0, 6)}`,
    avatar: '🤙',
    level: Math.floor(Math.random() * 10) + 1,
    checkins: Math.floor(Math.random() * 100),
  }
}

/**
 * Preload images for spots
 * @private
 */
async function preloadSpotImages(spots, signal) {
  const imagePromises = spots
    .filter(spot => spot.imageUrl)
    .map(spot => {
      return new Promise((resolve) => {
        if (signal && signal.aborted) {
          resolve()
          return
        }

        const img = new Image()
        img.onload = () => {
          preloadStats.bytesPreloaded += 50000 // Estimate
          resolve()
        }
        img.onerror = resolve
        img.src = spot.imageUrl
      })
    })

  await Promise.all(imagePromises)
}

/**
 * Load cached stats from storage
 * @private
 */
function loadCachedStats() {
  const saved = Storage.get('preloadStats')
  if (saved) {
    preloadStats = { ...preloadStats, ...saved }
  }
}

/**
 * Save stats to storage
 * @private
 */
function saveCachedStats() {
  Storage.set('preloadStats', preloadStats)
}

// Default export
export default {
  PreloadStrategy,
  initSmartPreload,
  detectConnectionType,
  checkDataSaver,
  getStrategyForConnection,
  setPreloadStrategy,
  getPreloadStrategy,
  getStrategyConfig,
  preloadSpots,
  preloadRoute,
  preloadUserData,
  cancelPreload,
  getPreloadStatus,
  getPreloadStats,
  clearPreloadCache,
  getCachedData,
  isPreloading,
  resetSmartPreload,
}
