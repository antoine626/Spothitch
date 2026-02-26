/**
 * Trip History Service
 * Private log of travel events and spot visits
 *
 * Features:
 * - Log trip events (start, checkin, ride, arrive)
 * - Store with timestamps and GPS coordinates
 * - View timeline of recent activity
 * - Export capability for personal records
 */

import { getState } from '../stores/state.js'
import { showToast } from './notifications.js'
import { t } from '../i18n/index.js'

// ==================== CONFIGURATION ====================

const CONFIG = {
  storageKey: 'spothitch_trip_history',
  maxEvents: 500, // Maximum events to store
}

// ==================== EVENT TYPES ====================

const EVENT_TYPES = {
  start_trip: { icon: '🚀', labelKey: 'tripEventStartTrip' },
  checkin: { icon: '📍', labelKey: 'tripEventCheckin' },
  ride_start: { icon: '🚗', labelKey: 'tripEventRideStart' },
  ride_end: { icon: '🏁', labelKey: 'tripEventRideEnd' },
  arrive: { icon: '🎉', labelKey: 'tripEventArrive' },
  spot_visited: { icon: '👁️', labelKey: 'tripEventSpotVisited' },
}

// Get translated label for event type
function getEventLabel(eventType) {
  const type = EVENT_TYPES[eventType];
  if (!type) return eventType;
  return t(type.labelKey) || type.labelKey;
}

// ==================== STORAGE ====================

/**
 * Get trip history from localStorage
 * @returns {Array} Array of events
 */
function getHistory() {
  try {
    const saved = localStorage.getItem(CONFIG.storageKey)
    return saved ? JSON.parse(saved) : []
  } catch (e) {
    console.warn('[TripHistory] Failed to load history:', e)
    return []
  }
}

/**
 * Save trip history to localStorage
 * @param {Array} history - Array of events
 */
function saveHistory(history) {
  try {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(history))
  } catch (e) {
    console.warn('[TripHistory] Failed to save history:', e)
  }
}

// ==================== LOGGING ====================

/**
 * Log a trip event
 * @param {string} type - Event type (start_trip, checkin, ride_start, etc.)
 * @param {Object} data - Event data (spotId, details, etc.)
 * @returns {boolean} Success
 */
function logTripEvent(type, data = {}) {
  try {
    // Validate type
    if (!EVENT_TYPES[type]) {
      console.warn('[TripHistory] Invalid event type:', type)
      return false
    }

    const history = getHistory()

    // Get current location if available
    const state = getState()
    const location = state.userLocation || state.proximityUserLocation || state.travelModeLocation

    // Create event
    const event = {
      id: Date.now() + crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296,
      type,
      timestamp: Date.now(),
      lat: location?.lat || data.lat || null,
      lng: location?.lng || data.lng || null,
      spotId: data.spotId || null,
      details: data.details || data,
    }

    // Add to history
    history.unshift(event) // Add to beginning

    // Trim to max size
    if (history.length > CONFIG.maxEvents) {
      history.length = CONFIG.maxEvents
    }

    // Save
    saveHistory(history)

    return true
  } catch (e) {
    console.error('[TripHistory] Failed to log event:', e)
    return false
  }
}

/**
 * Get trip history
 * @param {number} limit - Maximum number of events (default 50)
 * @returns {Array} Array of events
 */
function getTripHistory(limit = 50) {
  const history = getHistory()
  return history.slice(0, limit)
}

/**
 * Clear all trip history
 * @returns {boolean} Success
 */
export function clearTripHistory() {
  try {
    localStorage.removeItem(CONFIG.storageKey)
    showToast(t('tripHistoryCleared') || 'Historique effacé', 'success')
    return true
  } catch (e) {
    console.error('[TripHistory] Failed to clear history:', e)
    showToast(t('tripHistoryClearError') || 'Erreur lors de l\'effacement', 'error')
    return false
  }
}

// ==================== RENDERING ====================

/**
 * Format time of day
 * @param {number} timestamp - Timestamp in ms
 * @returns {string} Time string
 */
function formatTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get location name for an event (if available)
 * @param {Object} event - Event object
 * @returns {string} Location description
 */
function getLocationText(event) {
  if (event.spotId) {
    const state = getState()
    const spot = state.spots?.find(s => s.id === event.spotId)
    if (spot) {
      return `${spot.from || 'Spot'} ${spot.to ? '→ ' + spot.to : ''}`
    }
  }

  if (event.lat && event.lng) {
    return `${event.lat.toFixed(4)}, ${event.lng.toFixed(4)}`
  }

  return t('tripLocationUnknown') || 'Position inconnue'
}

/**
 * Render trip history as HTML timeline
 * @param {number} limit - Maximum events to show
 * @returns {string} HTML string
 */
export function renderTripHistory(limit = 50) {
  const history = getTripHistory(limit)

  if (history.length === 0) {
    return `
      <div class="text-center py-12 text-slate-400">
        <div class="text-4xl mb-3">📋</div>
        <p>${t('tripHistoryEmpty') || 'Aucun événement enregistré'}</p>
        <p class="text-sm mt-2">${t('tripHistoryEmptyDesc') || 'Tes futurs voyages seront enregistrés ici'}</p>
      </div>
    `
  }

  // Group by date
  const groupedByDate = {}
  history.forEach(event => {
    const date = new Date(event.timestamp).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    if (!groupedByDate[date]) {
      groupedByDate[date] = []
    }
    groupedByDate[date].push(event)
  })

  let html = '<div class="space-y-6">'

  // Render each date group
  for (const [date, events] of Object.entries(groupedByDate)) {
    html += `
      <div>
        <div class="text-sm font-medium text-slate-400 mb-3 sticky top-0 bg-dark-bg py-2">
          ${date}
        </div>
        <div class="space-y-3">
    `

    events.forEach(event => {
      const eventType = EVENT_TYPES[event.type] || { icon: '📌', labelKey: event.type }
      const eventLabel = getEventLabel(event.type)
      const locationText = getLocationText(event)
      const timeText = formatTime(event.timestamp)

      html += `
        <div class="flex gap-3 items-start">
          <!-- Timeline dot -->
          <div class="shrink-0 w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-xl border border-primary-500/30">
            ${eventType.icon}
          </div>

          <!-- Event content -->
          <div class="flex-1 bg-white/5 rounded-xl p-3 border border-white/10">
            <div class="flex items-start justify-between mb-1">
              <div class="font-medium text-white">${eventLabel}</div>
              <div class="text-xs text-slate-400">${timeText}</div>
            </div>
            <div class="text-sm text-slate-400">${locationText}</div>
            ${event.details && typeof event.details === 'object' && Object.keys(event.details).length > 0 ? `
              <div class="text-xs text-slate-400 mt-1">
                ${JSON.stringify(event.details)}
              </div>
            ` : ''}
          </div>
        </div>
      `
    })

    html += `
        </div>
      </div>
    `
  }

  html += '</div>'

  return html
}

/**
 * Get trip statistics
 * @returns {Object} Statistics
 */
function getTripStats() {
  const history = getHistory()

  const stats = {
    totalEvents: history.length,
    checkins: history.filter(e => e.type === 'checkin').length,
    rides: history.filter(e => e.type === 'ride_start').length,
    trips: history.filter(e => e.type === 'start_trip').length,
    spotsVisited: new Set(history.filter(e => e.spotId).map(e => e.spotId)).size,
    firstEvent: history.length > 0 ? history[history.length - 1].timestamp : null,
    lastEvent: history.length > 0 ? history[0].timestamp : null,
  }

  return stats
}

// ==================== EXPORTS ====================

export default {
  logTripEvent,
  getTripHistory,
  clearTripHistory,
  renderTripHistory,
  getTripStats,
}
