/**
 * Push Notifications Service
 * Handles FCM push notifications with opt-in permission
 * Integrates with proximity alerts to notify nearby hitchhikers
 */

import { requestNotificationPermission, onForegroundMessage } from './firebase.js'

const STORAGE_KEY = 'spothitch_push_config'
const TOKEN_KEY = 'spothitch_fcm_token'

/**
 * Get push notification config
 */
function getConfig() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

/**
 * Save push notification config
 */
function saveConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

/**
 * Check if push notifications are enabled
 * @returns {boolean}
 */
export function isPushEnabled() {
  return getConfig().enabled === true
}

/**
 * Check if user has been asked for push permission
 * @returns {boolean}
 */
export function hasBeenAsked() {
  return getConfig().asked === true
}

/**
 * Request push notification permission (opt-in)
 * Only call this after user explicitly enables notifications
 * @returns {Promise<{success: boolean, token: string|null}>}
 */
export async function enablePushNotifications() {
  try {
    const token = await requestNotificationPermission()

    if (token) {
      saveConfig({
        enabled: true,
        asked: true,
        enabledAt: Date.now(),
      })
      localStorage.setItem(TOKEN_KEY, token)

      // Start listening for foreground messages
      startForegroundListener()

      return { success: true, token }
    }

    // Permission denied
    saveConfig({
      enabled: false,
      asked: true,
      deniedAt: Date.now(),
    })
    return { success: false, token: null }
  } catch (error) {
    console.error('[Push] Enable failed:', error)
    return { success: false, token: null }
  }
}

/**
 * Disable push notifications
 */
export function disablePushNotifications() {
  saveConfig({
    enabled: false,
    asked: true,
    disabledAt: Date.now(),
  })
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Get stored FCM token
 * @returns {string|null}
 */
export function getFCMToken() {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Start listening for foreground push messages
 */
export function startForegroundListener() {
  if (!isPushEnabled()) return

  onForegroundMessage((payload) => {
    const { title, body, data } = payload.notification || {}

    // Show in-app notification
    if (typeof window.showToast === 'function') {
      window.showToast(`${title}: ${body}`, 'info')
    }

    // Handle specific notification types
    if (data?.type === 'proximity_alert') {
      handleProximityPush(data)
    }
  })
}

/**
 * Handle proximity alert push notification
 * "Un autostoppeur est à 2km de toi"
 */
function handleProximityPush(data) {
  const { distance, username, spotId } = data || {}

  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification('SpotHitch', {
      body: `${username || 'Un autostoppeur'} est à ${distance || '~2'}km de toi`,
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      tag: 'proximity-alert',
      data: { spotId },
    })

    notification.onclick = () => {
      window.focus()
      if (spotId && window.selectSpot) {
        window.selectSpot(spotId)
      }
      notification.close()
    }
  }
}

/**
 * Send a local proximity notification (for when user is in the app)
 * @param {Object} params
 * @param {string} params.username - Name of nearby user
 * @param {number} params.distance - Distance in km
 * @param {string} [params.spotId] - Optional spot ID
 */
export function showProximityNotification({ username, distance, spotId }) {
  if (!isPushEnabled()) return

  // In-app toast
  if (typeof window.showToast === 'function') {
    window.showToast(
      `${username || 'Un autostoppeur'} est à ${distance.toFixed(1)}km de toi`,
      'info'
    )
  }

  // Browser notification if app is in background
  if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
    handleProximityPush({ username, distance: distance.toFixed(1), spotId })
  }
}

/**
 * Render push notification settings section (for Settings page)
 * @returns {string} HTML
 */
export function renderPushSettings() {
  const enabled = isPushEnabled()
  const asked = hasBeenAsked()

  return `
    <div class="p-4 bg-dark-secondary/50 rounded-xl border border-white/5">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="font-medium text-white text-sm">Notifications push</h4>
          <p class="text-xs text-slate-400 mt-0.5">
            ${enabled ? 'Activées' : asked ? 'Désactivées' : 'Recevez des alertes quand un autostoppeur est proche'}
          </p>
        </div>
        <button
          onclick="togglePushNotifications()"
          class="relative w-12 h-7 rounded-full transition-colors ${enabled ? 'bg-primary-500' : 'bg-slate-600'}"
          role="switch"
          aria-checked="${enabled}"
          aria-label="Notifications push"
        >
          <span class="absolute top-0.5 ${enabled ? 'right-0.5' : 'left-0.5'} w-6 h-6 rounded-full bg-white transition-colors shadow"></span>
        </button>
      </div>
    </div>
  `
}

/**
 * Initialize push notifications on app start (if already enabled)
 */
export function initPushNotifications() {
  if (isPushEnabled()) {
    startForegroundListener()
  }
}

export default {
  isPushEnabled,
  hasBeenAsked,
  enablePushNotifications,
  disablePushNotifications,
  getFCMToken,
  startForegroundListener,
  showProximityNotification,
  renderPushSettings,
  initPushNotifications,
}
