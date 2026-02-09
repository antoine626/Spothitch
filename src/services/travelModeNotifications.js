/**
 * Travel Mode Notifications Service (#61)
 * Notifies users when nearby spots are detected while in travel mode
 *
 * Features:
 * - Disabled by default (opt-in)
 * - "Travel Mode" toggle to enable/disable
 * - Notification when spot < 2km away
 * - Cooldown to avoid notification spam
 * - Battery-friendly location tracking
 */

import { getState, setState } from '../stores/state.js'
import { showToast, sendLocalNotification } from './notifications.js'

// ==================== CONFIGURATION ====================

const CONFIG = {
  // Distance threshold in kilometers
  proximityThreshold: 2,
  // Minimum time between notifications for the same spot (30 minutes)
  notificationCooldown: 30 * 60 * 1000,
  // Location update interval when travel mode is active (1 minute)
  locationUpdateInterval: 60 * 1000,
  // Maximum age for location data (5 minutes)
  locationMaxAge: 5 * 60 * 1000,
  // Location timeout (30 seconds)
  locationTimeout: 30000,
  // Storage key for travel mode settings
  storageKey: 'spothitch_travel_mode',
  // Days without check-in before switching to sedentary mode (7 days)
  sedentaryThresholdDays: 7,
}

// ==================== STATE ====================

// Watch ID for geolocation
let locationWatchId = null

// Interval ID for periodic checks
let checkIntervalId = null

// Map of spotId -> last notification timestamp
const notifiedSpots = new Map()

// Current user location
let currentLocation = null

// ==================== STORAGE ====================

/**
 * Get travel mode settings from localStorage
 * @returns {Object} Settings object
 */
export function getTravelModeSettings() {
  try {
    const saved = localStorage.getItem(CONFIG.storageKey)
    return saved
      ? JSON.parse(saved)
      : {
          enabled: false, // Disabled by default
          proximityThreshold: CONFIG.proximityThreshold,
          notificationsEnabled: true,
          soundEnabled: true,
          vibrationEnabled: true,
          lastActivated: null,
          totalSpotsNotified: 0,
          mode: null, // null = auto-detect, 'travel' = forced travel, 'sedentary' = forced sedentary
        }
  } catch {
    return {
      enabled: false,
      proximityThreshold: CONFIG.proximityThreshold,
      notificationsEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      lastActivated: null,
      totalSpotsNotified: 0,
      mode: null,
    }
  }
}

/**
 * Save travel mode settings to localStorage
 * @param {Object} settings - Settings to save
 */
function saveTravelModeSettings(settings) {
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(settings))
  } catch (e) {
    console.warn('[TravelMode] Failed to save settings:', e)
  }
}

// ==================== LOCATION ====================

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371 // Earth's radius in km
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

/**
 * Start watching user location
 */
function startLocationWatch() {
  if (!navigator.geolocation) {
    console.warn('[TravelMode] Geolocation not available')
    return false
  }

  // Clear existing watch if any
  stopLocationWatch()

  locationWatchId = navigator.geolocation.watchPosition(
    (position) => {
      currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
      }

      // Update state for UI
      setState({ travelModeLocation: currentLocation })

      // Check for nearby spots
      checkNearbySpots()
    },
    (error) => {
      console.warn('[TravelMode] Location error:', error.message)
      // Don't disable travel mode on error, just log it
    },
    {
      enableHighAccuracy: false, // Battery friendly
      maximumAge: CONFIG.locationMaxAge,
      timeout: CONFIG.locationTimeout,
    }
  )

  // Also set up periodic checks in case watchPosition doesn't fire
  checkIntervalId = setInterval(checkNearbySpots, CONFIG.locationUpdateInterval)

  return true
}

/**
 * Stop watching user location
 */
function stopLocationWatch() {
  if (locationWatchId !== null) {
    navigator.geolocation.clearWatch(locationWatchId)
    locationWatchId = null
  }

  if (checkIntervalId !== null) {
    clearInterval(checkIntervalId)
    checkIntervalId = null
  }

  currentLocation = null
}

/**
 * Get current user location (one-time request)
 * @returns {Promise<Object|null>} Location object or null
 */
export function getCurrentLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        })
      },
      () => {
        resolve(null)
      },
      {
        enableHighAccuracy: false,
        maximumAge: CONFIG.locationMaxAge,
        timeout: CONFIG.locationTimeout,
      }
    )
  })
}

// ==================== SPOT CHECKING ====================

/**
 * Find spots within the proximity threshold
 * @param {Object} location - User location {lat, lng}
 * @param {Array} spots - Array of spots
 * @param {number} threshold - Distance threshold in km
 * @returns {Array} Array of nearby spots with distance
 */
export function findNearbySpots(location, spots, threshold = CONFIG.proximityThreshold) {
  if (!location || !spots || !Array.isArray(spots)) {
    return []
  }

  const nearbySpots = []

  for (const spot of spots) {
    // Skip spots without coordinates
    if (!spot.coordinates || !spot.coordinates.lat || !spot.coordinates.lng) {
      continue
    }

    const distance = calculateDistance(
      location.lat,
      location.lng,
      spot.coordinates.lat,
      spot.coordinates.lng
    )

    if (distance <= threshold) {
      nearbySpots.push({
        ...spot,
        distance: Math.round(distance * 1000) / 1000, // Round to 3 decimals
        distanceText: formatDistance(distance),
      })
    }
  }

  // Sort by distance (closest first)
  nearbySpots.sort((a, b) => a.distance - b.distance)

  return nearbySpots
}

/**
 * Format distance for display
 * @param {number} distance - Distance in km
 * @returns {string} Formatted distance
 */
export function formatDistance(distance) {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  return `${distance.toFixed(1)}km`
}

/**
 * Check for nearby spots and send notifications
 */
export function checkNearbySpots() {
  const settings = getTravelModeSettings()

  // Don't check if travel mode is disabled
  if (!settings.enabled) {
    return []
  }

  // Need location to check
  if (!currentLocation) {
    return []
  }

  const state = getState()
  const spots = state.spots || []

  // Find nearby spots
  const nearbySpots = findNearbySpots(
    currentLocation,
    spots,
    settings.proximityThreshold
  )

  // Update state with nearby spots for UI
  setState({ travelModeNearbySpots: nearbySpots })

  // Send notifications for new nearby spots
  if (settings.notificationsEnabled) {
    notifyNearbySpots(nearbySpots)
  }

  return nearbySpots
}

/**
 * Send notifications for nearby spots
 * @param {Array} nearbySpots - Array of nearby spots
 */
function notifyNearbySpots(nearbySpots) {
  const now = Date.now()
  const settings = getTravelModeSettings()

  for (const spot of nearbySpots) {
    // Check cooldown
    const lastNotified = notifiedSpots.get(spot.id)
    if (lastNotified && now - lastNotified < CONFIG.notificationCooldown) {
      continue // Skip, already notified recently
    }

    // Send notification
    sendSpotNotification(spot)

    // Record notification time
    notifiedSpots.set(spot.id, now)

    // Update total count
    settings.totalSpotsNotified = (settings.totalSpotsNotified || 0) + 1
    saveTravelModeSettings(settings)
  }
}

/**
 * Send notification for a single spot
 * @param {Object} spot - Spot object with distance
 */
function sendSpotNotification(spot) {
  const settings = getTravelModeSettings()
  const spotName = spot.from || 'Spot'
  const direction = spot.to || ''
  const distance = spot.distanceText || formatDistance(spot.distance)

  const title = 'Spot proche !'
  const body = direction
    ? `${spotName} vers ${direction} - ${distance}`
    : `${spotName} - ${distance}`

  // Show toast notification
  showToast(`${spotName} a ${distance}`, 'info', 5000)

  // Send system notification
  sendLocalNotification(title, body, {
    type: 'nearby_spot',
    spotId: spot.id,
    url: `/Spothitch/?spot=${spot.id}`,
  })

  // Vibrate if enabled and supported
  if (settings.vibrationEnabled && navigator.vibrate) {
    navigator.vibrate([100, 50, 100])
  }

  // Update state with last notified spot
  setState({
    travelModeLastNotifiedSpot: {
      ...spot,
      notifiedAt: Date.now(),
    },
  })
}

// ==================== TRAVEL MODE CONTROL ====================

/**
 * Check if travel mode is currently enabled
 * @returns {boolean}
 */
export function isTravelModeEnabled() {
  const settings = getTravelModeSettings()
  return settings.enabled === true
}

/**
 * Enable travel mode
 * @returns {boolean} Success
 */
export function enableTravelMode() {
  const settings = getTravelModeSettings()

  // Check if geolocation is available
  if (!navigator.geolocation) {
    showToast('La geolocalisation n\'est pas disponible', 'error')
    return false
  }

  // Start location tracking
  const started = startLocationWatch()
  if (!started) {
    showToast('Impossible d\'activer le mode voyage', 'error')
    return false
  }

  // Update settings
  settings.enabled = true
  settings.lastActivated = Date.now()
  saveTravelModeSettings(settings)

  // Update state
  setState({
    travelModeEnabled: true,
    travelModeActivatedAt: settings.lastActivated,
  })

  // Show success message
  showToast('Mode voyage active - Notifications spots proches', 'success')

  console.log('[TravelMode] Enabled')
  return true
}

/**
 * Disable travel mode
 */
export function disableTravelMode() {
  const settings = getTravelModeSettings()

  // Stop location tracking
  stopLocationWatch()

  // Clear notified spots
  notifiedSpots.clear()

  // Update settings
  settings.enabled = false
  saveTravelModeSettings(settings)

  // Update state
  setState({
    travelModeEnabled: false,
    travelModeLocation: null,
    travelModeNearbySpots: [],
  })

  // Show message
  showToast('Mode voyage desactive', 'info')

  console.log('[TravelMode] Disabled')
}

/**
 * Toggle travel mode on/off
 * @returns {boolean} New state (true = enabled)
 */
export function toggleTravelMode() {
  if (isTravelModeEnabled()) {
    disableTravelMode()
    return false
  } else {
    return enableTravelMode()
  }
}

/**
 * Set the proximity threshold
 * @param {number} distance - Distance in kilometers (default 2km)
 */
export function setProximityThreshold(distance) {
  const settings = getTravelModeSettings()
  settings.proximityThreshold = distance
  saveTravelModeSettings(settings)

  // Re-check with new threshold
  if (settings.enabled) {
    checkNearbySpots()
  }

  showToast(`Seuil de proximite: ${distance}km`, 'info')
}

/**
 * Get the current proximity threshold
 * @returns {number} Distance in kilometers
 */
export function getProximityThreshold() {
  const settings = getTravelModeSettings()
  return settings.proximityThreshold || CONFIG.proximityThreshold
}

/**
 * Toggle notifications within travel mode
 * @param {boolean} enabled
 */
export function setNotificationsEnabled(enabled) {
  const settings = getTravelModeSettings()
  settings.notificationsEnabled = enabled
  saveTravelModeSettings(settings)
}

/**
 * Toggle sound for notifications
 * @param {boolean} enabled
 */
export function setSoundEnabled(enabled) {
  const settings = getTravelModeSettings()
  settings.soundEnabled = enabled
  saveTravelModeSettings(settings)
}

/**
 * Toggle vibration for notifications
 * @param {boolean} enabled
 */
export function setVibrationEnabled(enabled) {
  const settings = getTravelModeSettings()
  settings.vibrationEnabled = enabled
  saveTravelModeSettings(settings)
}

/**
 * Clear notification cooldown for a specific spot
 * @param {number|string} spotId
 */
export function clearSpotCooldown(spotId) {
  notifiedSpots.delete(spotId)
}

/**
 * Clear all notification cooldowns
 */
export function clearAllCooldowns() {
  notifiedSpots.clear()
}

/**
 * Get statistics about travel mode usage
 * @returns {Object} Statistics
 */
export function getTravelModeStats() {
  const settings = getTravelModeSettings()
  const state = getState()

  return {
    enabled: settings.enabled,
    lastActivated: settings.lastActivated,
    totalSpotsNotified: settings.totalSpotsNotified || 0,
    proximityThreshold: settings.proximityThreshold,
    currentLocation: currentLocation,
    nearbySpots: state.travelModeNearbySpots || [],
    notifiedSpotsCount: notifiedSpots.size,
  }
}

// ==================== TRAVEL VS SEDENTARY MODE ====================

/**
 * Detect travel mode based on last check-in date
 * @param {string} userId - User ID
 * @param {Date|number|null} lastCheckinDate - Last check-in date (Date object, timestamp, or null)
 * @returns {'travel'|'sedentary'} Detected mode
 */
export function detectTravelMode(userId, lastCheckinDate) {
  // No check-in date = sedentary (new user or never checked in)
  if (!lastCheckinDate) {
    return 'sedentary'
  }

  const now = Date.now()
  let lastCheckinTimestamp

  // Handle Date object
  if (lastCheckinDate instanceof Date) {
    lastCheckinTimestamp = lastCheckinDate.getTime()
  }
  // Handle timestamp
  else if (typeof lastCheckinDate === 'number') {
    lastCheckinTimestamp = lastCheckinDate
  }
  // Invalid input
  else {
    return 'sedentary'
  }

  const daysSinceLastCheckin = (now - lastCheckinTimestamp) / (1000 * 60 * 60 * 24)

  // If more than 7 days without check-in → sedentary
  if (daysSinceLastCheckin >= CONFIG.sedentaryThresholdDays) {
    return 'sedentary'
  }

  // Recent check-in → travel
  return 'travel'
}

/**
 * Get the current travel mode for a user
 * @param {string} userId - User ID
 * @param {Date|number|null} lastCheckinDate - Optional last check-in date for auto-detection
 * @returns {'travel'|'sedentary'} Current mode
 */
export function getTravelMode(userId, lastCheckinDate = null) {
  const settings = getTravelModeSettings()

  // If manually set, use that
  if (settings.mode === 'travel' || settings.mode === 'sedentary') {
    return settings.mode
  }

  // Otherwise auto-detect based on last check-in
  return detectTravelMode(userId, lastCheckinDate)
}

/**
 * Set travel mode manually (override auto-detection)
 * @param {string} userId - User ID
 * @param {'travel'|'sedentary'|null} mode - Mode to set (null = auto-detect)
 */
export function setTravelMode(userId, mode) {
  const settings = getTravelModeSettings()

  // Validate mode
  if (mode !== 'travel' && mode !== 'sedentary' && mode !== null) {
    console.warn('[TravelMode] Invalid mode:', mode)
    return
  }

  settings.mode = mode
  saveTravelModeSettings(settings)

  const modeText = mode === null ? 'auto' : mode === 'travel' ? 'voyage' : 'sédentaire'
  showToast(`Mode ${modeText} activé`, 'info')
}

/**
 * Check if a notification is essential (always shown, even in sedentary mode)
 * @param {Object} notification - Notification object with type property
 * @returns {boolean} True if essential
 */
export function isEssentialNotification(notification) {
  if (!notification || !notification.type) {
    return false
  }

  const essentialTypes = [
    'private_message',     // Direct messages
    'reply',               // Replies to user's posts/reviews
    'security_alert',      // Security alerts
    'mention',             // User mentions
    'account_update',      // Important account updates
    'system_alert',        // Critical system messages
  ]

  return essentialTypes.includes(notification.type)
}

/**
 * Filter notifications based on travel mode
 * @param {Array} notifications - Array of notification objects
 * @param {'travel'|'sedentary'} travelMode - Current travel mode
 * @returns {Array} Filtered notifications
 */
export function filterNotifications(notifications, travelMode) {
  if (!Array.isArray(notifications)) {
    return []
  }

  // Travel mode: receive ALL notifications
  if (travelMode === 'travel') {
    return notifications
  }

  // Sedentary mode: ONLY essential notifications
  if (travelMode === 'sedentary') {
    return notifications.filter(notification => isEssentialNotification(notification))
  }

  // Fallback: return all
  return notifications
}

// ==================== UI RENDERING ====================

/**
 * Render travel mode toggle button
 * @returns {string} HTML
 */
export function renderTravelModeToggle() {
  const enabled = isTravelModeEnabled()

  return `
    <button
      onclick="window.toggleTravelMode()"
      class="flex items-center gap-3 w-full p-3 rounded-xl transition-colors ${
        enabled ? 'bg-primary-500/20 border border-primary-500/50' : 'bg-white/5 hover:bg-white/10'
      }"
      role="switch"
      aria-checked="${enabled}"
      aria-label="Mode voyage"
    >
      <div class="w-10 h-10 rounded-lg ${enabled ? 'bg-primary-500' : 'bg-white/10'} flex items-center justify-center">
        <i class="fas fa-route ${enabled ? 'text-white' : 'text-slate-400'}" aria-hidden="true"></i>
      </div>
      <div class="flex-1 text-left">
        <div class="font-medium">Mode voyage</div>
        <div class="text-xs text-slate-400">Notifie si un spot est a moins de 2km</div>
      </div>
      <div class="w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-primary-500' : 'bg-white/20'}">
        <div class="w-5 h-5 rounded-full bg-white shadow-md transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}" style="margin-top: 2px"></div>
      </div>
    </button>
  `
}

/**
 * Render travel mode settings panel
 * @returns {string} HTML
 */
export function renderTravelModeSettings() {
  const settings = getTravelModeSettings()
  const enabled = settings.enabled
  const stats = getTravelModeStats()

  return `
    <div class="bg-dark-card rounded-xl p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
          <i class="fas fa-route text-xl text-primary-400" aria-hidden="true"></i>
        </div>
        <div class="flex-1">
          <h3 class="font-bold text-lg">Mode voyage</h3>
          <p class="text-sm text-slate-400">Notifications spots proches</p>
        </div>
        <button
          onclick="window.toggleTravelMode()"
          class="w-14 h-7 rounded-full transition-colors ${enabled ? 'bg-primary-500' : 'bg-white/20'}"
          role="switch"
          aria-checked="${enabled}"
          aria-label="Activer le mode voyage"
        >
          <div class="w-6 h-6 rounded-full bg-white shadow-md transition-transform ${enabled ? 'translate-x-7' : 'translate-x-0.5'}" style="margin-top: 2px"></div>
        </button>
      </div>

      ${enabled ? `
        <!-- Status -->
        <div class="bg-primary-500/10 rounded-lg p-3 text-sm">
          <div class="flex items-center gap-2 text-primary-400">
            <i class="fas fa-check-circle" aria-hidden="true"></i>
            <span>Mode voyage actif</span>
          </div>
          ${stats.nearbySpots.length > 0 ? `
            <div class="mt-2 text-white">
              ${stats.nearbySpots.length} spot${stats.nearbySpots.length > 1 ? 's' : ''} a proximite
            </div>
          ` : ''}
        </div>

        <!-- Settings -->
        <div class="space-y-3 pt-2">
          <div class="flex items-center justify-between">
            <span class="text-sm">Distance de notification</span>
            <select
              onchange="window.setTravelModeProximity(Number(this.value))"
              class="bg-white/10 rounded-lg px-3 py-1.5 text-sm"
              aria-label="Distance de notification"
            >
              <option value="0.5" ${settings.proximityThreshold === 0.5 ? 'selected' : ''}>500m</option>
              <option value="1" ${settings.proximityThreshold === 1 ? 'selected' : ''}>1 km</option>
              <option value="2" ${settings.proximityThreshold === 2 || !settings.proximityThreshold ? 'selected' : ''}>2 km</option>
              <option value="5" ${settings.proximityThreshold === 5 ? 'selected' : ''}>5 km</option>
            </select>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-sm">Vibration</span>
            <button
              onclick="window.toggleTravelModeVibration()"
              class="w-10 h-5 rounded-full transition-colors ${settings.vibrationEnabled ? 'bg-primary-500' : 'bg-white/20'}"
              role="switch"
              aria-checked="${settings.vibrationEnabled}"
              aria-label="Vibration"
            >
              <div class="w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.vibrationEnabled ? 'translate-x-5' : 'translate-x-0.5'}" style="margin-top: 2px"></div>
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div class="pt-2 border-t border-white/10 text-xs text-slate-500">
          <div>Spots notifies: ${stats.totalSpotsNotified}</div>
          ${stats.lastActivated ? `
            <div>Dernier usage: ${new Date(stats.lastActivated).toLocaleDateString('fr-FR')}</div>
          ` : ''}
        </div>
      ` : `
        <!-- Disabled state info -->
        <div class="text-sm text-slate-400">
          <p>Active ce mode pendant tes trajets pour etre notifie quand tu passes pres d'un spot de stop.</p>
          <ul class="mt-2 space-y-1">
            <li class="flex items-center gap-2">
              <i class="fas fa-bell text-primary-400" aria-hidden="true"></i>
              Notification si spot a moins de 2km
            </li>
            <li class="flex items-center gap-2">
              <i class="fas fa-battery-half text-primary-400" aria-hidden="true"></i>
              Optimise pour la batterie
            </li>
            <li class="flex items-center gap-2">
              <i class="fas fa-shield-alt text-primary-400" aria-hidden="true"></i>
              Position jamais partagee
            </li>
          </ul>
        </div>
      `}
    </div>
  `
}

/**
 * Render floating travel mode indicator (when active)
 * @returns {string} HTML
 */
export function renderTravelModeIndicator() {
  if (!isTravelModeEnabled()) {
    return ''
  }

  const stats = getTravelModeStats()
  const nearbyCount = stats.nearbySpots.length

  return `
    <div
      class="fixed bottom-20 left-4 z-40"
      role="status"
      aria-label="Mode voyage actif"
    >
      <button
        onclick="window.openTravelModePanel()"
        class="flex items-center gap-2 px-3 py-2 rounded-full bg-primary-500 text-white shadow-lg hover:bg-primary-600 transition-colors"
      >
        <i class="fas fa-route animate-pulse" aria-hidden="true"></i>
        <span class="text-sm font-medium">Mode voyage</span>
        ${nearbyCount > 0 ? `
          <span class="w-5 h-5 rounded-full bg-white text-primary-500 text-xs font-bold flex items-center justify-center">
            ${nearbyCount}
          </span>
        ` : ''}
      </button>
    </div>
  `
}

/**
 * Render nearby spots list (when travel mode is active)
 * @returns {string} HTML
 */
export function renderNearbySpotsNotification() {
  const state = getState()
  const nearbySpots = state.travelModeNearbySpots || []

  if (!isTravelModeEnabled() || nearbySpots.length === 0) {
    return ''
  }

  return `
    <div class="bg-dark-card rounded-xl p-4 mb-4 border border-primary-500/30">
      <div class="flex items-center gap-2 mb-3">
        <i class="fas fa-map-marker-alt text-primary-400" aria-hidden="true"></i>
        <span class="font-medium">Spots a proximite</span>
        <span class="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">${nearbySpots.length}</span>
      </div>
      <div class="space-y-2">
        ${nearbySpots
          .slice(0, 3)
          .map(
            (spot) => `
          <button
            onclick="window.openSpotDetail(${spot.id})"
            class="w-full flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
          >
            <div class="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <i class="fas fa-thumbs-up text-primary-400" aria-hidden="true"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium truncate">${spot.from || 'Spot'}</div>
              <div class="text-xs text-slate-400">${spot.to || ''}</div>
            </div>
            <div class="text-sm text-primary-400 font-medium">${spot.distanceText}</div>
          </button>
        `
          )
          .join('')}
      </div>
      ${nearbySpots.length > 3 ? `
        <button
          onclick="window.openTravelModePanel()"
          class="w-full mt-2 text-center text-sm text-primary-400 hover:text-primary-300"
        >
          Voir les ${nearbySpots.length - 3} autres spots
        </button>
      ` : ''}
    </div>
  `
}

// ==================== GLOBAL HANDLERS ====================

// Register global handlers for onclick usage
window.toggleTravelMode = toggleTravelMode
window.enableTravelMode = enableTravelMode
window.disableTravelMode = disableTravelMode
window.setTravelModeProximity = setProximityThreshold
window.toggleTravelModeVibration = () => {
  const settings = getTravelModeSettings()
  setVibrationEnabled(!settings.vibrationEnabled)
}
window.openTravelModePanel = () => {
  setState({ showTravelModePanel: true })
}
window.closeTravelModePanel = () => {
  setState({ showTravelModePanel: false })
}

// ==================== EXPORTS ====================

export default {
  // Settings
  getTravelModeSettings,
  // Location
  calculateDistance,
  getCurrentLocation,
  formatDistance,
  // Spot checking
  findNearbySpots,
  checkNearbySpots,
  // Travel mode control
  isTravelModeEnabled,
  enableTravelMode,
  disableTravelMode,
  toggleTravelMode,
  setProximityThreshold,
  getProximityThreshold,
  setNotificationsEnabled,
  setSoundEnabled,
  setVibrationEnabled,
  clearSpotCooldown,
  clearAllCooldowns,
  getTravelModeStats,
  // Travel vs Sedentary
  getTravelMode,
  setTravelMode,
  detectTravelMode,
  filterNotifications,
  isEssentialNotification,
  // UI
  renderTravelModeToggle,
  renderTravelModeSettings,
  renderTravelModeIndicator,
  renderNearbySpotsNotification,
}
