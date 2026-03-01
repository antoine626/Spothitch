/**
 * Auto Offline Sync Service
 * Automatically downloads offline data when on WiFi/4G
 * Uses spotLoader (IDB-first) for spot data instead of localStorage
 */

import { showToast } from './notifications.js'
import { getState } from '../stores/state.js'
import { t } from '../i18n/index.js'

const STORAGE_PREFIX = 'spothitch_offline_'
const SYNC_INTERVAL = 60 * 60 * 1000 // 1 hour

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
 * Uses spotLoader (IDB-first) for spot downloads
 * @returns {Promise<Object>}
 */
export async function performAutoSync() {
  try {
    const startTime = Date.now()
    const syncedData = {
      countries: [],
      spotsCount: 0,
      guidesCount: 0,
    }

    // Get relevant countries from trips, location, checkins
    const countries = await getRelevantCountries()

    if (countries.length === 0) {
      return { success: true, synced: syncedData }
    }

    // Download spot data via spotLoader (auto-caches in IDB)
    const { loadCountrySpots } = await import('./spotLoader.js')
    const { markCountryDownloaded } = await import('./offlineDownload.js')

    for (const countryCode of countries) {
      try {
        const spots = await loadCountrySpots(countryCode)
        syncedData.countries.push(countryCode)
        syncedData.spotsCount += spots.length
        markCountryDownloaded(countryCode, spots.length)
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
        const { autoDownloadUserCountry } = await import('./spotLoader.js')
        // autoDownloadUserCountry returns the country code
        const code = await autoDownloadUserCountry(state.userLocation.lat, state.userLocation.lng)
        if (code) countries.add(code)
      } catch (err) {
        console.warn('[AutoOfflineSync] Could not determine country from location:', err.message)
      }
    }

    // 3. Get countries from recent checkins
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
 * Download guide data for a country
 * @param {string} countryCode - Country code
 */
async function downloadCountryGuide(countryCode) {
  try {
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
 * Get offline sync status (reads from IDB via spotLoader data)
 * @returns {Object} Status object with countries, last sync
 */
export function getOfflineStatus() {
  const guides = []
  let totalSize = 0

  // Scan localStorage for guide data only (spots are in IDB now)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(STORAGE_PREFIX)) {
      const value = localStorage.getItem(key)
      if (value) {
        totalSize += value.length
        if (key.includes('_guide_')) {
          const countryCode = key.replace(`${STORAGE_PREFIX}guide_`, '')
          guides.push(countryCode.toUpperCase())
        }
      }
    }
  }

  // Get downloaded countries from offlineDownload tracking
  let countries = []
  try {
    countries = JSON.parse(localStorage.getItem('spothitch_offline_countries') || '[]').map(c => c.code)
  } catch { /* empty */ }

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
 * Clear all offline data (guides in localStorage, spots via IDB)
 */
export async function clearOfflineData() {
  // Clear localStorage guide caches
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

  // Clear IDB spots + tiles metadata
  try {
    const { clear } = await import('../utils/idb.js')
    await clear('spots')
    await clear('tiles')
  } catch { /* optional */ }

  // Clear tile cache (Cache API)
  try {
    await caches.delete('openfreemap-tiles')
  } catch { /* optional */ }

  // Clear downloaded countries tracking
  localStorage.removeItem('spothitch_offline_countries')

  lastSyncTime = null
}

// ============================================
// Helper functions
// ============================================

function getSavedTrips() {
  try {
    const saved = localStorage.getItem('spothitch_saved_trips')
    if (saved) return JSON.parse(saved)
  } catch { /* empty */ }
  return []
}

function extractCountryCode(step) {
  if (step.fullName && typeof step.fullName === 'string') {
    const parts = step.fullName.split(',').map(s => s.trim())
    if (parts.length >= 2) {
      const country = parts[parts.length - 1]
      const countryMap = {
        France: 'FR', Germany: 'DE', Spain: 'ES', Italy: 'IT',
        Belgium: 'BE', Netherlands: 'NL', Portugal: 'PT', Poland: 'PL',
        Austria: 'AT', Switzerland: 'CH', 'Czech Republic': 'CZ',
        Sweden: 'SE', Denmark: 'DK', Norway: 'NO', Finland: 'FI',
      }
      return countryMap[country] || null
    }
  }
  if (step.country) return step.country
  return null
}

function getRecentCheckins() {
  try {
    const checkins = localStorage.getItem('spothitch_checkin_history')
    if (checkins) return JSON.parse(checkins).slice(-10)
  } catch { /* empty */ }
  return []
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (syncInterval) clearInterval(syncInterval)
  })

  // Expose force sync globally
  window.forceOfflineSync = forceOfflineSync
}

export default {
  initAutoOfflineSync,
  performAutoSync,
  getOfflineStatus,
  forceOfflineSync,
  clearOfflineData,
}
