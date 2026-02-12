/**
 * Auto Offline Sync Service
 * Automatically downloads offline data when on WiFi/4G
 * Syncs spots, guides, and map data for user's saved trips
 */

import { showToast } from './notifications.js'
import { getState } from '../stores/state.js'
import { t } from '../i18n/index.js'

const STORAGE_PREFIX = 'spothitch_offline_'
const SYNC_INTERVAL = 60 * 60 * 1000 // 1 hour
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

let isInitialized = false
let syncInterval = null
let lastSyncTime = null

/**
 * Initialize auto offline sync
 * Listens to network status and triggers sync on WiFi/4G
 */
export function initAutoOfflineSync() {
  if (isInitialized) {
    return
  }

  try {
    // Load last sync time
    const savedSync = localStorage.getItem(`${STORAGE_PREFIX}last_sync`)
    if (savedSync) {
      lastSyncTime = parseInt(savedSync, 10)
    }

    // Listen for online event
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
    }

    // Check if we should sync now
    if (shouldAutoSync()) {
      setTimeout(() => {
        performAutoSync().catch(err => {
          console.warn('[AutoOfflineSync] Initial sync failed:', err.message)
        })
      }, 5000) // Wait 5 seconds after init
    }

    // Set up periodic sync check
    syncInterval = setInterval(() => {
      if (shouldAutoSync()) {
        performAutoSync().catch(err => {
          console.warn('[AutoOfflineSync] Periodic sync failed:', err.message)
        })
      }
    }, SYNC_INTERVAL)

    isInitialized = true
  } catch (err) {
    console.error('[AutoOfflineSync] Initialization failed:', err)
  }
}

/**
 * Handle coming back online
 */
function handleOnline() {
  if (shouldAutoSync()) {
    setTimeout(() => {
      performAutoSync().catch(err => {
        console.warn('[AutoOfflineSync] Online sync failed:', err.message)
      })
    }, 2000)
  }
}

/**
 * Check if we should auto-sync
 * @returns {boolean}
 */
function shouldAutoSync() {
  // Check if online
  if (typeof navigator === 'undefined' || !navigator.onLine) {
    return false
  }

  // Check connection type
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

  if (connection) {
    // Don't sync if data saver is enabled
    if (connection.saveData) {
      return false
    }

    // Only sync on WiFi or 4G
    const effectiveType = connection.effectiveType
    const type = connection.type

    if (type === 'wifi' || effectiveType === '4g') {
      // Check if enough time has passed since last sync
      if (!lastSyncTime || Date.now() - lastSyncTime > SYNC_INTERVAL) {
        return true
      }
    }
  } else {
    // If no connection API, assume we can sync if online
    if (!lastSyncTime || Date.now() - lastSyncTime > SYNC_INTERVAL) {
      return true
    }
  }

  return false
}

/**
 * Perform auto sync
 * Downloads spots, guides, and map data for relevant countries
 * @returns {Promise<Object>}
 */
export async function performAutoSync() {
  try {
    const startTime = Date.now()
    const syncedData = {
      countries: [],
      spotsCount: 0,
      guidesCount: 0,
      size: 0,
    }

    // Get relevant countries from:
    // 1. Saved trips
    // 2. User location (if available)
    // 3. Recent spots visited
    const countries = await getRelevantCountries()

    if (countries.length === 0) {
      return { success: true, synced: syncedData }
    }

    // Download spot data for each country
    for (const countryCode of countries) {
      try {
        await downloadCountrySpots(countryCode)
        syncedData.countries.push(countryCode)
        syncedData.spotsCount += await getOfflineSpotsCount(countryCode)
      } catch (err) {
        console.warn(`[AutoOfflineSync] Failed to download spots for ${countryCode}:`, err.message)
      }
    }

    // Download guide data
    for (const countryCode of countries) {
      try {
        await downloadCountryGuide(countryCode)
        syncedData.guidesCount++
      } catch (err) {
        console.warn(`[AutoOfflineSync] Failed to download guide for ${countryCode}:`, err.message)
      }
    }

    // Calculate total cache size
    syncedData.size = calculateOfflineStorageSize()

    // Update last sync time
    lastSyncTime = Date.now()
    localStorage.setItem(`${STORAGE_PREFIX}last_sync`, lastSyncTime.toString())

    const duration = Date.now() - startTime

    // Show subtle notification
    if (syncedData.countries.length > 0) {
      showToast(`📥 ${t('autoOfflineSyncUpdated') || 'Données hors-ligne mises à jour'} (${syncedData.countries.length} ${t('autoOfflineSyncCountries') || 'pays'})`, 'success')
    }

    return { success: true, synced: syncedData, duration }
  } catch (err) {
    console.error('[AutoOfflineSync] Sync failed:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get relevant countries to sync based on user's trips and location
 * @returns {Promise<string[]>} Array of country codes
 */
async function getRelevantCountries() {
  const countries = new Set()

  try {
    // 1. Get countries from saved trips
    const savedTrips = getSavedTrips()
    for (const trip of savedTrips) {
      if (trip.steps && Array.isArray(trip.steps)) {
        for (const step of trip.steps) {
          // Extract country code from step location (if available)
          const countryCode = extractCountryCode(step)
          if (countryCode) {
            countries.add(countryCode)
          }
        }
      }
    }

    // 2. Get current user location and determine country
    const state = getState()
    if (state.userLocation && state.userLocation.lat && state.userLocation.lng) {
      try {
        const countryCode = await getCountryFromCoords(state.userLocation.lat, state.userLocation.lng)
        if (countryCode) {
          countries.add(countryCode)
        }
      } catch (err) {
        console.warn('[AutoOfflineSync] Could not determine country from location:', err.message)
      }
    }

    // 3. Get countries from recent checkins (stored in localStorage)
    const recentCheckins = getRecentCheckins()
    for (const checkin of recentCheckins) {
      if (checkin.country) {
        countries.add(checkin.country)
      }
    }

    return Array.from(countries).slice(0, 5) // Limit to 5 countries max
  } catch (err) {
    console.warn('[AutoOfflineSync] Error getting relevant countries:', err)
    return []
  }
}

/**
 * Download spot data for a country
 * @param {string} countryCode - Country code (e.g., 'FR', 'DE')
 * @returns {Promise<void>}
 */
async function downloadCountrySpots(countryCode) {
  try {
    // Check if file exists at public/data/spots/{country}.json
    const url = `/data/spots/${countryCode.toLowerCase()}.json`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const spots = await response.json()

    // Store in localStorage
    const key = `${STORAGE_PREFIX}spots_${countryCode}`
    localStorage.setItem(key, JSON.stringify({
      countryCode,
      spots,
      cachedAt: Date.now(),
    }))

  } catch (err) {
    console.warn(`[AutoOfflineSync] Could not download spots for ${countryCode}:`, err.message)
    throw err
  }
}

/**
 * Download guide data for a country
 * @param {string} countryCode - Country code
 * @returns {Promise<void>}
 */
async function downloadCountryGuide(countryCode) {
  try {
    // Import guides dynamically
    const { getGuideByCode } = await import('../data/guides.js')
    const guide = getGuideByCode(countryCode)

    if (guide) {
      const key = `${STORAGE_PREFIX}guide_${countryCode}`
      localStorage.setItem(key, JSON.stringify({
        countryCode,
        guide,
        cachedAt: Date.now(),
      }))
    }
  } catch (err) {
    console.warn(`[AutoOfflineSync] Could not cache guide for ${countryCode}:`, err.message)
    throw err
  }
}

/**
 * Get offline spots for a country
 * @param {string} countryCode - Country code
 * @returns {Array} Array of spots
 */
export function getOfflineSpots(countryCode) {
  try {
    const key = `${STORAGE_PREFIX}spots_${countryCode}`
    const cached = localStorage.getItem(key)

    if (!cached) return []

    const data = JSON.parse(cached)

    // Check if cache is still valid
    if (Date.now() - data.cachedAt > MAX_CACHE_AGE) {
      localStorage.removeItem(key)
      return []
    }

    return data.spots || []
  } catch (err) {
    console.warn(`[AutoOfflineSync] Error reading offline spots for ${countryCode}:`, err)
    return []
  }
}

/**
 * Get offline spots count for a country
 * @param {string} countryCode - Country code
 * @returns {Promise<number>}
 */
async function getOfflineSpotsCount(countryCode) {
  const spots = getOfflineSpots(countryCode)
  return spots.length
}

/**
 * Check if offline data is available for a country
 * @param {string} countryCode - Country code
 * @returns {boolean}
 */
export function isOfflineDataAvailable(countryCode) {
  const spots = getOfflineSpots(countryCode)
  return spots.length > 0
}

/**
 * Get offline sync status
 * @returns {Object} Status object with countries, size, last sync
 */
export function getOfflineStatus() {
  const countries = []
  const guides = []
  let totalSize = 0

  // Scan localStorage for offline data
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(STORAGE_PREFIX)) {
      const value = localStorage.getItem(key)
      if (value) {
        totalSize += value.length

        // Extract country code
        if (key.includes('_spots_')) {
          const countryCode = key.replace(`${STORAGE_PREFIX}spots_`, '')
          countries.push(countryCode.toUpperCase())
        } else if (key.includes('_guide_')) {
          const countryCode = key.replace(`${STORAGE_PREFIX}guide_`, '')
          guides.push(countryCode.toUpperCase())
        }
      }
    }
  }

  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2)

  return {
    countries: [...new Set(countries)],
    guides: [...new Set(guides)],
    totalSize: `${totalSizeMB} MB`,
    lastSync: lastSyncTime ? new Date(lastSyncTime).toLocaleString() : (t('autoOfflineSyncNever') || 'Jamais'),
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  }
}

/**
 * Force a manual offline sync
 * @returns {Promise<Object>}
 */
export async function forceOfflineSync() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    showToast(t('autoOfflineSyncNoInternet') || 'Pas de connexion internet', 'error')
    return { success: false, error: 'offline' }
  }

  showToast(t('autoOfflineSyncInProgress') || 'Synchronisation en cours...', 'info')
  const result = await performAutoSync()

  if (result.success) {
    showToast(`✅ ${t('autoOfflineSyncComplete') || 'Synchronisation terminée !'}`, 'success')
  } else {
    showToast(t('autoOfflineSyncError') || 'Erreur lors de la synchronisation', 'error')
  }

  return result
}

/**
 * Clear all offline data
 */
export function clearOfflineData() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keys.push(key)
    }
  }

  for (const key of keys) {
    localStorage.removeItem(key)
  }

  lastSyncTime = null
}

// ============================================
// Helper functions
// ============================================

/**
 * Get saved trips from planner
 * @returns {Array}
 */
function getSavedTrips() {
  try {
    const saved = localStorage.getItem('spothitch_saved_trips')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (err) {
    console.warn('[AutoOfflineSync] Error reading saved trips:', err)
  }
  return []
}

/**
 * Extract country code from trip step
 * @param {Object} step - Trip step object
 * @returns {string|null}
 */
function extractCountryCode(step) {
  // Try to extract from fullName (e.g., "Paris, France")
  if (step.fullName && typeof step.fullName === 'string') {
    const parts = step.fullName.split(',').map(s => s.trim())
    if (parts.length >= 2) {
      const country = parts[parts.length - 1]
      // Map country names to codes (simplified)
      const countryMap = {
        France: 'FR',
        Germany: 'DE',
        Spain: 'ES',
        Italy: 'IT',
        Belgium: 'BE',
        Netherlands: 'NL',
        Portugal: 'PT',
        Poland: 'PL',
        Austria: 'AT',
        Switzerland: 'CH',
        'Czech Republic': 'CZ',
        Sweden: 'SE',
        Denmark: 'DK',
        Norway: 'NO',
        Finland: 'FI',
      }
      return countryMap[country] || null
    }
  }

  // Try to extract from country field
  if (step.country) {
    return step.country
  }

  return null
}

/**
 * Get country code from GPS coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string|null>}
 */
async function getCountryFromCoords(lat, lng) {
  // Simple bbox check for major European countries
  // In production, you'd use reverse geocoding API

  // France
  if (lat >= 41 && lat <= 51 && lng >= -5 && lng <= 10) return 'FR'

  // Germany
  if (lat >= 47 && lat <= 55 && lng >= 5 && lng <= 15) return 'DE'

  // Spain
  if (lat >= 36 && lat <= 44 && lng >= -10 && lng <= 4) return 'ES'

  // Italy
  if (lat >= 36 && lat <= 47 && lng >= 6 && lng <= 19) return 'IT'

  // UK
  if (lat >= 50 && lat <= 59 && lng >= -8 && lng <= 2) return 'GB'

  // Default: try to use OSRM reverse geocoding if available
  try {
    const { reverseGeocode } = await import('./osrm.js')
    const result = await reverseGeocode(lat, lng)
    if (result && result.country) {
      return result.country
    }
  } catch (err) {
    console.warn('[AutoOfflineSync] Could not reverse geocode:', err.message)
  }

  return null
}

/**
 * Get recent checkins from localStorage
 * @returns {Array}
 */
function getRecentCheckins() {
  try {
    const checkins = localStorage.getItem('spothitch_checkin_history')
    if (checkins) {
      const parsed = JSON.parse(checkins)
      // Return last 10 checkins
      return parsed.slice(-10)
    }
  } catch (err) {
    console.warn('[AutoOfflineSync] Error reading checkin history:', err)
  }
  return []
}

/**
 * Calculate total offline storage size
 * @returns {number} Size in bytes
 */
function calculateOfflineStorageSize() {
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(STORAGE_PREFIX)) {
      const value = localStorage.getItem(key)
      if (value) {
        total += value.length
      }
    }
  }
  return total
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (syncInterval) {
      clearInterval(syncInterval)
    }
  })

  // Expose force sync globally
  window.forceOfflineSync = forceOfflineSync
}

export default {
  initAutoOfflineSync,
  performAutoSync,
  getOfflineSpots,
  isOfflineDataAvailable,
  getOfflineStatus,
  forceOfflineSync,
  clearOfflineData,
}
