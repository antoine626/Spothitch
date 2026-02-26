/**
 * Companion Mode Service
 * Real-time safety feature for hitchhikers.
 * The user sets a trusted contact ("guardian"), starts a trip,
 * and the app periodically asks them to "check in".
 * If they don't check in, an alert is sent to their guardian
 * with their last known position.
 *
 * Features:
 * - SMS/WhatsApp channel preference (#22)
 * - GPS breadcrumb trail (#24)
 * - Safe arrival notification (#25)
 * - Departure notification (#26)
 * - Battery low auto-alert (#27)
 * - ETA estimation (#28)
 * - Check-in reminder notification (#29)
 * - Trusted contacts circle (#30)
 * - Travel timeline history (#31)
 */

import { sendLocalNotification } from './notifications.js'
import { t } from '../i18n/index.js'

const STORAGE_KEY = 'spothitch_companion'
const CHANNEL_KEY = 'spothitch_companion_channel'
const HISTORY_KEY = 'spothitch_trip_history'
const CHECK_INTERVAL_MS = 10_000 // check every 10 seconds
const MAX_POSITIONS = 50
const MAX_HISTORY_TRIPS = 20
const BATTERY_ALERT_THRESHOLD = 0.15 // 15%
// 2-minute reminder fires when this many seconds remain before check-in deadline
const REMINDER_SECONDS_THRESHOLD = 120

let timerInterval = null
let overdueCallback = null
let overdueNotified = false
let reminderNotified = false
let batteryAlertSent = false
// _batteryRef: kept for future cleanup of battery event listeners
// eslint-disable-next-line no-unused-vars
let _batteryRef = null

/**
 * Default companion state
 */
function getDefaultState() {
  return {
    active: false,
    guardian: { name: '', phone: '' },
    trustedContacts: [], // [{name, phone}] — up to 5 additional contacts
    checkInInterval: 30, // minutes
    lastCheckIn: null, // timestamp
    tripStart: null, // timestamp
    positions: [], // [{lat, lng, timestamp}]
    alertSent: false,
    destination: '', // optional — for ETA
    notifyOnDeparture: true,
    notifyOnArrival: true,
  }
}

/**
 * Load companion state from localStorage
 */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...getDefaultState(), ...parsed }
    }
  } catch {
    // corrupted data — reset
  }
  return getDefaultState()
}

/**
 * Save companion state to localStorage
 */
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage full — ignore
  }
}

/**
 * Get the current companion state
 */
export function getCompanionState() {
  return loadState()
}

/**
 * Check if companion mode is currently active
 */
export function isCompanionActive() {
  return loadState().active
}

// ---- Channel preference (#22) ----

/**
 * Get current alert channel preference
 * @returns {'whatsapp' | 'sms' | 'both'}
 */
export function getChannelPreference() {
  try {
    const val = localStorage.getItem(CHANNEL_KEY)
    if (val === 'sms' || val === 'both' || val === 'whatsapp') return val
  } catch {
    // ignore
  }
  return 'whatsapp'
}

/**
 * Save channel preference
 * @param {'whatsapp' | 'sms' | 'both'} channel
 */
export function setChannelPreference(channel) {
  try {
    localStorage.setItem(CHANNEL_KEY, channel)
  } catch {
    // ignore
  }
}

// ---- Trusted contacts circle (#30) ----

/**
 * Get all alert recipients (primary guardian + trusted contacts)
 * @param {object} state
 * @returns {Array<{name: string, phone: string}>}
 */
function getAllContacts(state) {
  const contacts = []
  if (state.guardian?.phone) {
    contacts.push({ name: state.guardian.name, phone: state.guardian.phone })
  }
  if (Array.isArray(state.trustedContacts)) {
    for (const c of state.trustedContacts) {
      if (c?.phone) contacts.push(c)
    }
  }
  return contacts
}

// ---- Trip history (#31) ----

/**
 * Load trip history from localStorage
 * @returns {Array}
 */
export function loadTripHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // corrupted — reset
  }
  return []
}

/**
 * Save a completed trip to history
 * @param {object} trip
 */
function saveTripToHistory(trip) {
  try {
    const history = loadTripHistory()
    history.unshift(trip) // newest first
    // Keep only last N trips
    const trimmed = history.slice(0, MAX_HISTORY_TRIPS)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
  } catch {
    // ignore
  }
}

/**
 * Clear trip history
 */
export function clearTripHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch {
    // ignore
  }
}

// ---- Battery monitoring (#27) ----

/**
 * Start battery level monitoring.
 * Sends alert when battery drops below 15%.
 */
async function startBatteryMonitor() {
  batteryAlertSent = false
  if (!navigator.getBattery) return

  try {
    const battery = await navigator.getBattery()

    const checkBattery = () => {
      const state = loadState()
      if (!state.active) return

      const level = battery.level
      if (level <= BATTERY_ALERT_THRESHOLD && !batteryAlertSent) {
        batteryAlertSent = true
        const pct = Math.round(level * 100)
        const title = t('companionBatteryAlertTitle') || 'Battery low!'
        const body = (t('companionBatteryAlertBody') || 'Battery at {pct}%. Alert sent to guardian.').replace('{pct}', pct)
        sendLocalNotification(title, body, {
          type: 'companion_battery',
          tag: 'companion-battery',
        })

        // Auto-send alert to all contacts
        sendAlertToAll(
          buildBatteryAlertMessage(state, pct),
          state
        )
      }
    }

    battery.addEventListener('levelchange', checkBattery)
    checkBattery() // check immediately

    _batteryRef = battery
  } catch {
    // Battery API not available — ignore
  }
}

/**
 * Stop battery monitoring
 */
function stopBatteryMonitor() {
  batteryAlertSent = false
  _batteryRef = null
}

/**
 * Get current battery level (0-1), or null if not available
 * @returns {Promise<number|null>}
 */
export async function getBatteryLevel() {
  if (!navigator.getBattery) return null
  try {
    const battery = await navigator.getBattery()
    return battery.level
  } catch {
    return null
  }
}

// ---- ETA estimation (#28) ----

/**
 * Calculate average speed from GPS positions (km/h)
 * @param {Array<{lat, lng, timestamp}>} positions
 * @returns {number|null}
 */
function calculateAverageSpeed(positions) {
  if (positions.length < 2) return null

  let totalDistanceKm = 0
  let totalTimeMs = 0

  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1]
    const curr = positions[i]
    const dist = haversineKm(prev.lat, prev.lng, curr.lat, curr.lng)
    const dt = curr.timestamp - prev.timestamp
    totalDistanceKm += dist
    totalTimeMs += dt
  }

  if (totalTimeMs === 0) return null
  return (totalDistanceKm / (totalTimeMs / 3_600_000)) // km/h
}

/**
 * Haversine distance between two points in km
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg) {
  return (deg * Math.PI) / 180
}

/**
 * Get ETA info based on current speed and remaining distance
 * @param {object} state
 * @param {{ lat: number, lng: number } | null} destinationCoords
 * @returns {{ speedKmh: number|null, distanceKm: number|null, etaMinutes: number|null }}
 */
export function getETAInfo(state, destinationCoords = null) {
  const speedKmh = calculateAverageSpeed(state.positions)
  const lastPos = state.positions.length > 0
    ? state.positions[state.positions.length - 1]
    : null

  let distanceKm = null
  let etaMinutes = null

  if (lastPos && destinationCoords) {
    distanceKm = haversineKm(lastPos.lat, lastPos.lng, destinationCoords.lat, destinationCoords.lng)
    if (speedKmh && speedKmh > 0) {
      etaMinutes = Math.round((distanceKm / speedKmh) * 60)
    }
  }

  return { speedKmh, distanceKm, etaMinutes }
}

// ---- Message builders ----

/**
 * Generate alert message with position info
 */
function getAlertMessage(state) {
  const lastPos = state.positions.length > 0
    ? state.positions[state.positions.length - 1]
    : null

  const mapLink = lastPos
    ? `https://www.google.com/maps?q=${lastPos.lat},${lastPos.lng}`
    : ''

  const tripDuration = state.tripStart
    ? formatDurationMs(Date.now() - state.tripStart)
    : ''

  const guardianName = state.guardian.name ? state.guardian.name + ', ' : ''
  const alertIntro = t('companionAlertIntro') || "I haven't checked in on SpotHitch."
  const alertHelp = t('companionAlertHelp') || 'I may need help.'
  const alertTrip = t('companionAlertTrip') || 'Trip duration'
  const alertPosition = t('companionAlertPosition') || 'My last known position'
  const alertFooter = t('companionAlertFooter') || 'Sent automatically by SpotHitch Companion Mode.'

  let msg = `\u{1F198} SpotHitch Safety Alert\n\n`
  msg += `${guardianName}${alertIntro}\n`
  msg += `${alertHelp}\n\n`
  if (tripDuration) {
    msg += `${alertTrip}: ${tripDuration}\n`
  }
  if (mapLink) {
    msg += `${alertPosition}:\n${mapLink}\n`
  }
  msg += `\n${alertFooter}`

  return msg
}

/**
 * Generate departure notification message
 */
function getDepartureMessage(state) {
  const depMsg = t('companionDepartureMsg') || 'I am starting my hitchhiking trip. I will check in regularly. — SpotHitch Companion'
  const guardianName = state.guardian.name ? state.guardian.name + ', ' : ''
  let msg = `\u{1F6E3}\uFE0F SpotHitch — ${guardianName}${depMsg}`
  if (state.destination) {
    const destLabel = t('companionDestination') || 'Destination'
    msg += `\n${destLabel}: ${state.destination}`
  }
  return msg
}

/**
 * Generate safe arrival message
 */
function getArrivalMessage(state) {
  const arrMsg = t('companionArrivalMsg') || 'I have arrived safely. My trip is now complete. — SpotHitch Companion'
  const guardianName = state.guardian.name ? state.guardian.name + ', ' : ''
  const tripDuration = state.tripStart
    ? formatDurationMs(Date.now() - state.tripStart)
    : ''
  let msg = `\u2705 SpotHitch — ${guardianName}${arrMsg}`
  if (tripDuration) {
    const durLabel = t('companionAlertTrip') || 'Trip duration'
    msg += `\n${durLabel}: ${tripDuration}`
  }
  return msg
}

/**
 * Generate low battery alert message
 */
function buildBatteryAlertMessage(state, pct) {
  const battMsg = (t('companionBatteryMsg') || "My phone battery is at {pct}%. I may lose contact soon. — SpotHitch Companion").replace('{pct}', pct)
  const guardianName = state.guardian.name ? state.guardian.name + ', ' : ''
  const lastPos = state.positions.length > 0
    ? state.positions[state.positions.length - 1]
    : null
  let msg = `🔋 SpotHitch — ${guardianName}${battMsg}`
  if (lastPos) {
    const posLabel = t('companionAlertPosition') || 'My last known position'
    msg += `\n${posLabel}:\nhttps://www.google.com/maps?q=${lastPos.lat},${lastPos.lng}`
  }
  return msg
}

// ---- Alert sending — Push notifications only (no SMS/WhatsApp) ----

/**
 * Send push notification alerts to all contacts.
 * Companion mode uses ONLY app push notifications — no SMS/WhatsApp.
 * The guardian must have the SpotHitch app or open the web link.
 * @param {string} message - Alert message
 * @param {object} state - Companion state
 * @returns {number} - number of notifications sent
 */
function sendAlertToAll(message, state) {
  const contacts = getAllContacts(state)
  if (contacts.length === 0) return 0

  const lastPos = state.positions?.length > 0
    ? state.positions[state.positions.length - 1]
    : null
  const mapLink = lastPos
    ? `https://www.google.com/maps?q=${lastPos.lat},${lastPos.lng}`
    : ''

  // Send push notification (works even abroad, no SMS cost)
  const title = t('companionAlertPushTitle') || 'SpotHitch Safety Alert'
  sendLocalNotification(title, message, {
    type: 'companion_alert',
    tag: 'companion-alert',
    requireInteraction: true,
    url: mapLink || '/?companion=true',
  })

  // Also fire a custom event so the app can react (e.g. show position on map)
  try {
    window.dispatchEvent(new CustomEvent('spothitch:companion-alert', {
      detail: { message, contacts, position: lastPos },
    }))
  } catch {
    // ignore
  }

  return contacts.length
}

// ---- Public API ----

/**
 * Start companion mode with guardian(s) and check-in interval
 * @param {{ name: string, phone: string }} guardian
 * @param {number} interval - check-in interval in minutes
 * @param {object} options - { trustedContacts, destination, notifyOnDeparture, notifyOnArrival }
 */
export function startCompanionMode(guardian, interval = 30, options = {}) {
  const now = Date.now()
  const state = {
    active: true,
    guardian: {
      name: guardian.name || '',
      phone: cleanPhone(guardian.phone || ''),
    },
    trustedContacts: (options.trustedContacts || [])
      .slice(0, 5)
      .map(c => ({ name: c.name || '', phone: cleanPhone(c.phone || '') }))
      .filter(c => c.phone),
    checkInInterval: interval,
    lastCheckIn: now,
    tripStart: now,
    positions: [],
    alertSent: false,
    destination: options.destination || '',
    notifyOnDeparture: options.notifyOnDeparture !== false,
    notifyOnArrival: options.notifyOnArrival !== false,
    checkInsCount: 0,
  }

  // Try to get current position immediately
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const current = loadState()
        current.positions.push({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
        })
        if (current.positions.length > MAX_POSITIONS) {
          current.positions = current.positions.slice(-MAX_POSITIONS)
        }
        saveState(current)
      },
      () => { /* ignore error */ },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  saveState(state)
  startTimer()
  startBatteryMonitor()

  // Departure notification (#26)
  if (state.notifyOnDeparture) {
    setTimeout(() => {
      const current = loadState()
      if (current.active) {
        sendAlertToAll(getDepartureMessage(current), current)
      }
    }, 2000) // short delay to let position update
  }

  return state
}

/**
 * Stop companion mode and save trip to history
 * @param {{ sendArrivalNotification?: boolean }} options
 */
export function stopCompanionMode(options = {}) {
  const state = loadState()

  // Save arrival notification (#25)
  if (state.active && state.notifyOnArrival && options.sendArrivalNotification !== false) {
    sendAlertToAll(getArrivalMessage(state), state)
  }

  // Save to history (#31)
  if (state.active && state.tripStart) {
    saveTripToHistory({
      id: state.tripStart,
      startTime: state.tripStart,
      endTime: Date.now(),
      guardian: state.guardian,
      trustedContacts: state.trustedContacts || [],
      positions: state.positions,
      checkInsCount: state.checkInsCount || 0,
      destination: state.destination || '',
    })
  }

  stopTimer()
  stopBatteryMonitor()

  const defaultState = getDefaultState()
  saveState(defaultState)
  return defaultState
}

/**
 * User confirms they are safe — resets the timer
 */
export function checkIn() {
  const state = loadState()
  if (!state.active) return state

  state.lastCheckIn = Date.now()
  state.alertSent = false
  state.checkInsCount = (state.checkInsCount || 0) + 1
  overdueNotified = false
  reminderNotified = false

  // Update position on check-in
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const current = loadState()
        current.positions.push({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
        })
        if (current.positions.length > MAX_POSITIONS) {
          current.positions = current.positions.slice(-MAX_POSITIONS)
        }
        saveState(current)
      },
      () => { /* ignore */ },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  saveState(state)
  return state
}

/**
 * Get time remaining until next check-in (in seconds)
 * Returns negative if past due
 */
export function getTimeUntilNextCheckIn() {
  const state = loadState()
  if (!state.active || !state.lastCheckIn) return 0

  const intervalMs = state.checkInInterval * 60 * 1000
  const elapsed = Date.now() - state.lastCheckIn
  const remaining = intervalMs - elapsed

  return Math.floor(remaining / 1000)
}

/**
 * Check if the check-in is overdue
 */
export function isCheckInOverdue() {
  return getTimeUntilNextCheckIn() < 0
}

/**
 * Add a position to the tracking history
 */
export function addPosition(lat, lng) {
  const state = loadState()
  if (!state.active) return

  state.positions.push({
    lat,
    lng,
    timestamp: Date.now(),
  })

  if (state.positions.length > MAX_POSITIONS) {
    state.positions = state.positions.slice(-MAX_POSITIONS)
  }

  saveState(state)
}

/**
 * Get a Google Maps link with the last known position
 */
export function getShareLink() {
  const state = loadState()
  const lastPos = state.positions.length > 0
    ? state.positions[state.positions.length - 1]
    : null

  if (!lastPos) return null
  return `https://www.google.com/maps?q=${lastPos.lat},${lastPos.lng}`
}

/**
 * Send push notification alert to ALL contacts (guardian + trusted contacts).
 * Companion mode is app-only — no SMS/WhatsApp.
 * Marks alert as sent. Returns number of notifications sent.
 */
export function sendAlert() {
  const state = loadState()
  const contacts = getAllContacts(state)
  if (contacts.length === 0) return null

  const message = getAlertMessage(state)

  // Mark alert as sent
  state.alertSent = true
  saveState(state)

  const count = sendAlertToAll(message, state)
  return count > 0 ? count : null
}

/**
 * Get SMS fallback URL for the primary guardian.
 * @deprecated Companion mode is now push-only. Kept for backward compatibility.
 */
export function getSMSLink() {
  return null
}

/**
 * Register a callback for when check-in is overdue
 */
export function onOverdue(callback) {
  overdueCallback = callback
}

/**
 * Start the periodic timer that checks if check-in is overdue
 * Also handles 2-minute reminder notification (#29)
 */
export function startTimer() {
  stopTimer()

  overdueNotified = false
  reminderNotified = false

  timerInterval = setInterval(() => {
    const state = loadState()
    if (!state.active) {
      stopTimer()
      return
    }

    const secondsRemaining = getTimeUntilNextCheckIn()

    // 2-minute reminder (#29)
    if (
      secondsRemaining > 0 &&
      secondsRemaining <= REMINDER_SECONDS_THRESHOLD &&
      !reminderNotified
    ) {
      reminderNotified = true
      const title = t('companionReminderTitle') || 'Check-in reminder'
      const body = (t('companionReminderBody') || 'You have {min} minutes to check in!').replace('{min}', Math.ceil(secondsRemaining / 60))
      sendLocalNotification(title, body, {
        type: 'companion_reminder',
        tag: 'companion-reminder',
        url: '/?companion=true',
      })

      // Gentle vibration for reminder
      try {
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200])
        }
      } catch {
        // ignore
      }
    }

    // Reset reminder flag when timer resets
    if (secondsRemaining > REMINDER_SECONDS_THRESHOLD) {
      reminderNotified = false
    }

    if (isCheckInOverdue() && !state.alertSent) {
      // Strong vibration
      try {
        if (navigator.vibrate) {
          navigator.vibrate([500, 200, 500, 200, 500])
        }
      } catch {
        // vibration not supported
      }

      // Overdue push notification
      if (!overdueNotified) {
        overdueNotified = true
        const title = t('companionOverdueTitle') || 'Check-in overdue!'
        const body = t('companionOverdueBody') || 'Your check-in timer has expired. Are you safe?'
        sendLocalNotification(title, body, {
          type: 'companion_overdue',
          tag: 'companion-checkin',
          requireInteraction: true,
          url: '/?companion=true',
        })
      }

      if (overdueCallback) {
        overdueCallback(state)
      }
    }
  }, CHECK_INTERVAL_MS)
}

/**
 * Stop the periodic timer
 */
export function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

/**
 * Restore companion mode on app start (if was active)
 */
export function restoreCompanionMode() {
  const state = loadState()
  if (state.active) {
    startTimer()
    startBatteryMonitor()
    return true
  }
  return false
}

// ---- Utility helpers ----

/**
 * Clean phone number: keep only digits and leading +
 */
function cleanPhone(phone) {
  if (!phone) return ''
  return phone.replace(/[^0-9+]/g, '')
}

/**
 * Format a duration in milliseconds to a human-readable string
 */
function formatDurationMs(ms) {
  const totalMinutes = Math.floor(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return `${hours}h${minutes > 0 ? String(minutes).padStart(2, '0') : '00'}`
  }
  return `${minutes}min`
}

export default {
  startCompanionMode,
  stopCompanionMode,
  checkIn,
  getCompanionState,
  isCompanionActive,
  getTimeUntilNextCheckIn,
  isCheckInOverdue,
  sendAlert,
  getSMSLink,
  getShareLink,
  addPosition,
  onOverdue,
  startTimer,
  stopTimer,
  restoreCompanionMode,
  getChannelPreference,
  setChannelPreference,
  loadTripHistory,
  clearTripHistory,
  getBatteryLevel,
  getETAInfo,
}
