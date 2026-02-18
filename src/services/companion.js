/**
 * Companion Mode Service
 * Real-time safety feature for hitchhikers.
 * The user sets a trusted contact ("guardian"), starts a trip,
 * and the app periodically asks them to "check in".
 * If they don't check in, an alert is sent to their guardian
 * with their last known position.
 */

import { sendLocalNotification } from './notifications.js'
import { t } from '../i18n/index.js'

const STORAGE_KEY = 'spothitch_companion'
const CHECK_INTERVAL_MS = 10_000 // check every 10 seconds

let timerInterval = null
let overdueCallback = null
let overdueNotified = false

/**
 * Default companion state
 */
function getDefaultState() {
  return {
    active: false,
    guardian: { name: '', phone: '' },
    checkInInterval: 30, // minutes
    lastCheckIn: null, // timestamp
    tripStart: null, // timestamp
    positions: [], // [{lat, lng, timestamp}]
    alertSent: false,
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

/**
 * Start companion mode with a guardian and check-in interval
 * @param {{ name: string, phone: string }} guardian
 * @param {number} interval - check-in interval in minutes
 */
export function startCompanionMode(guardian, interval = 30) {
  const now = Date.now()
  const state = {
    active: true,
    guardian: {
      name: guardian.name || '',
      phone: cleanPhone(guardian.phone || ''),
    },
    checkInInterval: interval,
    lastCheckIn: now,
    tripStart: now,
    positions: [],
    alertSent: false,
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
        // Keep only last 50 positions
        if (current.positions.length > 50) {
          current.positions = current.positions.slice(-50)
        }
        saveState(current)
      },
      () => { /* ignore error */ },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  saveState(state)
  startTimer()
  return state
}

/**
 * Stop companion mode
 */
export function stopCompanionMode() {
  stopTimer()
  const state = getDefaultState()
  saveState(state)
  return state
}

/**
 * User confirms they are safe — resets the timer
 */
export function checkIn() {
  const state = loadState()
  if (!state.active) return state

  state.lastCheckIn = Date.now()
  state.alertSent = false
  overdueNotified = false

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
        if (current.positions.length > 50) {
          current.positions = current.positions.slice(-50)
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
 * Returns 0 if overdue, negative if past due
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

  // Keep only last 50 positions
  if (state.positions.length > 50) {
    state.positions = state.positions.slice(-50)
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
 * Generate an alert message with position info
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

  // Bilingual alert message (user's language + English fallback for clarity)
  const guardianName = state.guardian.name ? state.guardian.name + ', ' : ''
  const alertIntro = t('companionAlertIntro') || "I haven't checked in on SpotHitch."
  const alertHelp = t('companionAlertHelp') || 'I may need help.'
  const alertTrip = t('companionAlertTrip') || 'Trip duration'
  const alertPosition = t('companionAlertPosition') || 'My last known position'
  const alertFooter = t('companionAlertFooter') || 'Sent automatically by SpotHitch Companion Mode.'

  let msg = `🆘 SpotHitch Safety Alert\n\n`
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
 * Send alert to guardian via WhatsApp or SMS
 * Returns the URL to open (WhatsApp or SMS fallback)
 */
export function sendAlert() {
  const state = loadState()
  if (!state.guardian.phone) return null

  const message = getAlertMessage(state)
  const encodedMessage = encodeURIComponent(message)
  const phone = state.guardian.phone.replace(/[^0-9+]/g, '')

  // Mark alert as sent
  state.alertSent = true
  saveState(state)

  // Try WhatsApp first
  const whatsappUrl = `https://wa.me/${phone.replace('+', '')}?text=${encodedMessage}`

  return whatsappUrl
}

/**
 * Get SMS fallback URL
 */
export function getSMSLink() {
  const state = loadState()
  if (!state.guardian.phone) return null

  const message = getAlertMessage(state)
  const encodedMessage = encodeURIComponent(message)
  const phone = state.guardian.phone.replace(/[^0-9+]/g, '')

  return `sms:${phone}?body=${encodedMessage}`
}

/**
 * Register a callback for when check-in is overdue
 */
export function onOverdue(callback) {
  overdueCallback = callback
}

/**
 * Start the periodic timer that checks if check-in is overdue
 */
export function startTimer() {
  stopTimer()

  overdueNotified = false

  timerInterval = setInterval(() => {
    const state = loadState()
    if (!state.active) {
      stopTimer()
      return
    }

    if (isCheckInOverdue() && !state.alertSent) {
      // Vibrate the phone if supported
      try {
        if (navigator.vibrate) {
          navigator.vibrate([500, 200, 500, 200, 500])
        }
      } catch {
        // vibration not supported
      }

      // Send push notification (works even when tab not focused)
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

      // Notify via callback
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
  const cleaned = phone.replace(/[^0-9+]/g, '')
  return cleaned
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
}
