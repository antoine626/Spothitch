/**
 * Proximity Alerts Service
 * Notifies users when they are near a hitchhiking spot
 *
 * Features:
 * - Real-time geolocation tracking
 * - Notifications when within 500m of a spot (configurable)
 * - Once-per-session alerts to avoid spam
 * - Integrates with travel mode
 */

import { getState, setState } from '../stores/state.js'
import { showToast } from './notifications.js'
import { t } from '../i18n/index.js'

// ==================== CONFIGURATION ====================

const CONFIG = {
  defaultRadius: 500, // meters
  storageKey: 'spothitch_proximity_alerts',
}

// ==================== STATE ====================

let watchId = null
let alertedSpots = new Set()
let proximityRadius = CONFIG.defaultRadius
let isEnabled = false

// ==================== STORAGE ====================

/**
 * Get proximity alerts settings from localStorage
 * @returns {Object} Settings object
 */
function getSettings() {
  try {
    const saved = localStorage.getItem(CONFIG.storageKey)
    return saved
      ? JSON.parse(saved)
      : {
          enabled: true,
          radius: CONFIG.defaultRadius,
        }
  } catch {
    return {
      enabled: true,
      radius: CONFIG.defaultRadius,
    }
  }
}

/**
 * Save proximity alerts settings to localStorage
 * @param {Object} settings - Settings to save
 */
function saveSettings(settings) {
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(settings))
  } catch (e) {
    console.warn('[ProximityAlerts] Failed to save settings:', e)
  }
}

// ==================== DISTANCE CALCULATION ====================

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000 // Earth's radius in meters
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Convert degrees to radians
 * @param {number} deg - Degrees
 * @returns {number} Radians
 */
function toRad(deg) {
  return deg * (Math.PI / 180)
}

// ==================== SPOT CHECKING ====================

/**
 * Check nearby spots and send notifications
 * @param {number} lat - User latitude
 * @param {number} lng - User longitude
 */
export function checkNearbySpots(lat, lng) {
  if (!isEnabled) return

  const state = getState()
  const spots = state.spots || []

  for (const spot of spots) {
    // Skip spots without coordinates
    if (!spot.coordinates || !spot.coordinates.lat || !spot.coordinates.lng) {
      continue
    }

    // Skip if already alerted for this spot
    if (alertedSpots.has(spot.id)) {
      continue
    }

    const distance = calculateDistance(
      lat,
      lng,
      spot.coordinates.lat,
      spot.coordinates.lng
    )

    // Check if within radius
    if (distance <= proximityRadius) {
      // Send notification
      const distanceText = Math.round(distance) + 'm'
      const rating = spot.globalRating || spot.rating || 0
      const ratingText = rating > 0 ? ` ${t('proximityAlertsRating') || 'Note'}: ${rating.toFixed(1)} ⭐` : ''
      const message = `📍 ${t('proximityAlertsSpotAt') || 'Spot d\'autostop à'} ${distanceText} !${ratingText}`

      showToast(message, 'info', 6000)

      // Mark as alerted
      alertedSpots.add(spot.id)

      console.log('[ProximityAlerts] Alert sent:', spot.from || spot.name, distanceText)
    }
  }
}

// ==================== GEOLOCATION ====================

/**
 * Initialize proximity alerts
 * Starts watching user position
 * @returns {boolean} Success
 */
export function initProximityAlerts() {
  try {
    const settings = getSettings()
    proximityRadius = settings.radius || CONFIG.defaultRadius
    isEnabled = settings.enabled !== false

    // Don't auto-start, only start when in travel mode
    const state = getState()
    if (state.travelModeEnabled && isEnabled) {
      startWatching()
    }

    console.log('[ProximityAlerts] Initialized. Enabled:', isEnabled, 'Radius:', proximityRadius + 'm')
    return true
  } catch (e) {
    console.warn('[ProximityAlerts] Init failed:', e)
    return false
  }
}

/**
 * Start watching user position
 */
function startWatching() {
  if (!navigator.geolocation) {
    console.warn('[ProximityAlerts] Geolocation not available')
    return false
  }

  // Stop any existing watch
  stopWatching()

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const lat = position.coords.latitude
      const lng = position.coords.longitude

      // Update state
      setState({ proximityUserLocation: { lat, lng } })

      // Check nearby spots
      checkNearbySpots(lat, lng)
    },
    (error) => {
      console.warn('[ProximityAlerts] Location error:', error.message)
    },
    {
      enableHighAccuracy: false, // Battery friendly
      maximumAge: 60000, // 1 minute
      timeout: 30000, // 30 seconds
    }
  )

  console.log('[ProximityAlerts] Started watching position')
  return true
}

/**
 * Stop watching user position
 */
function stopWatching() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId)
    watchId = null
    console.log('[ProximityAlerts] Stopped watching position')
  }
}

/**
 * Stop proximity alerts
 */
export function stopProximityAlerts() {
  stopWatching()
  isEnabled = false
  const settings = getSettings()
  settings.enabled = false
  saveSettings(settings)
}

// ==================== PUBLIC API ====================

/**
 * Set proximity radius
 * @param {number} meters - Radius in meters (default 500m)
 */
export function setProximityRadius(meters) {
  proximityRadius = Math.max(100, Math.min(5000, meters)) // Between 100m and 5km
  const settings = getSettings()
  settings.radius = proximityRadius
  saveSettings(settings)
  showToast(`${t('proximityAlertsRadius') || 'Rayon de proximité'}: ${proximityRadius}m`, 'info')
  console.log('[ProximityAlerts] Radius set to', proximityRadius + 'm')
}

/**
 * Toggle proximity alerts on/off
 * @returns {boolean} New state
 */
export function toggleProximityAlerts() {
  isEnabled = !isEnabled
  const settings = getSettings()
  settings.enabled = isEnabled
  saveSettings(settings)

  if (isEnabled) {
    startWatching()
    showToast(t('proximityAlertsEnabled') || 'Alertes de proximité activées', 'success')
  } else {
    stopWatching()
    showToast(t('proximityAlertsDisabled') || 'Alertes de proximité désactivées', 'info')
  }

  return isEnabled
}

/**
 * Check if proximity alerts are enabled
 * @returns {boolean}
 */
export function isProximityAlertsEnabled() {
  return isEnabled
}

/**
 * Clear alerted spots (for testing or manual reset)
 */
export function clearAlertedSpots() {
  alertedSpots.clear()
  console.log('[ProximityAlerts] Alerted spots cleared')
}

/**
 * Get current settings
 * @returns {Object} Settings
 */
export function getProximitySettings() {
  return {
    enabled: isEnabled,
    radius: proximityRadius,
    alertedSpotsCount: alertedSpots.size,
  }
}

// ==================== EXPORTS ====================

export default {
  initProximityAlerts,
  stopProximityAlerts,
  checkNearbySpots,
  setProximityRadius,
  toggleProximityAlerts,
  isProximityAlertsEnabled,
  clearAlertedSpots,
  getProximitySettings,
}
