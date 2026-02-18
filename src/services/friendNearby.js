/**
 * Friend Nearby Notifications Service (#224)
 * Detect and notify when friends are within a configurable radius
 *
 * Features:
 * - Check for friends within radius
 * - Get distance between user and friend
 * - Configurable notification radius (default 5km)
 * - Enable/disable notifications
 * - Notification cooldown to prevent spam (minimum 30 minutes)
 * - Privacy-respecting (only shows friends who enabled location sharing)
 * - i18n support (FR, EN, ES, DE)
 */

import { getState, setState } from '../stores/state.js'
import { showToast } from './notifications.js'
import { icon } from '../utils/icons.js'

// ==================== CONSTANTS ====================

const STORAGE_KEY = 'spothitch_friend_nearby'
const DEFAULT_RADIUS_KM = 5
const DEFAULT_COOLDOWN_MINUTES = 30
const MIN_COOLDOWN_MINUTES = 30

// ==================== I18N TRANSLATIONS ====================

const translations = {
  fr: {
    friendNearbyTitle: 'Ami a proximite !',
    friendNearbyBody: '{name} est a {distance} de toi',
    friendsNearby: 'amis a proximite',
    noFriendsNearby: 'Aucun ami a proximite',
    notificationsEnabled: 'Notifications d\'amis proches activees',
    notificationsDisabled: 'Notifications d\'amis proches desactivees',
    radiusSet: 'Rayon de notification: {radius}',
    cooldownSet: 'Delai entre notifications: {minutes} min',
    viewOnMap: 'Voir sur la carte',
    sendMessage: 'Envoyer un message',
    meters: 'm',
    kilometers: 'km',
    away: 'de distance',
    lastSeen: 'Vu il y a {time}',
    locationSharingEnabled: 'Partage de position active',
    locationSharingDisabled: 'Partage de position desactive',
    privacyNote: 'Seuls tes amis qui ont active le partage de position sont affiches',
    notificationCooldown: 'Deja notifie recemment',
  },
  en: {
    friendNearbyTitle: 'Friend nearby!',
    friendNearbyBody: '{name} is {distance} away',
    friendsNearby: 'friends nearby',
    noFriendsNearby: 'No friends nearby',
    notificationsEnabled: 'Nearby friend notifications enabled',
    notificationsDisabled: 'Nearby friend notifications disabled',
    radiusSet: 'Notification radius: {radius}',
    cooldownSet: 'Notification cooldown: {minutes} min',
    viewOnMap: 'View on map',
    sendMessage: 'Send message',
    meters: 'm',
    kilometers: 'km',
    away: 'away',
    lastSeen: 'Seen {time} ago',
    locationSharingEnabled: 'Location sharing enabled',
    locationSharingDisabled: 'Location sharing disabled',
    privacyNote: 'Only friends who enabled location sharing are shown',
    notificationCooldown: 'Already notified recently',
  },
  es: {
    friendNearbyTitle: 'Amigo cercano!',
    friendNearbyBody: '{name} esta a {distance}',
    friendsNearby: 'amigos cercanos',
    noFriendsNearby: 'No hay amigos cercanos',
    notificationsEnabled: 'Notificaciones de amigos cercanos activadas',
    notificationsDisabled: 'Notificaciones de amigos cercanos desactivadas',
    radiusSet: 'Radio de notificacion: {radius}',
    cooldownSet: 'Intervalo de notificacion: {minutes} min',
    viewOnMap: 'Ver en el mapa',
    sendMessage: 'Enviar mensaje',
    meters: 'm',
    kilometers: 'km',
    away: 'de distancia',
    lastSeen: 'Visto hace {time}',
    locationSharingEnabled: 'Ubicacion compartida activada',
    locationSharingDisabled: 'Ubicacion compartida desactivada',
    privacyNote: 'Solo se muestran amigos que activaron compartir ubicacion',
    notificationCooldown: 'Ya notificado recientemente',
  },
  de: {
    friendNearbyTitle: 'Freund in der Nahe!',
    friendNearbyBody: '{name} ist {distance} entfernt',
    friendsNearby: 'Freunde in der Nahe',
    noFriendsNearby: 'Keine Freunde in der Nahe',
    notificationsEnabled: 'Benachrichtigungen fur nahe Freunde aktiviert',
    notificationsDisabled: 'Benachrichtigungen fur nahe Freunde deaktiviert',
    radiusSet: 'Benachrichtigungsradius: {radius}',
    cooldownSet: 'Benachrichtigungsintervall: {minutes} min',
    viewOnMap: 'Auf Karte anzeigen',
    sendMessage: 'Nachricht senden',
    meters: 'm',
    kilometers: 'km',
    away: 'entfernt',
    lastSeen: 'Vor {time} gesehen',
    locationSharingEnabled: 'Standortfreigabe aktiviert',
    locationSharingDisabled: 'Standortfreigabe deaktiviert',
    privacyNote: 'Nur Freunde mit aktivierter Standortfreigabe werden angezeigt',
    notificationCooldown: 'Kurzlich benachrichtigt',
  },
}

// ==================== STATE ====================

let settings = null
let lastNotifiedFriends = new Map() // friendId -> timestamp

/**
 * Reset all state (for testing)
 */
export function resetFriendNearbyState() {
  settings = null
  lastNotifiedFriends = new Map()
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get translation for current language
 * @param {string} key - Translation key
 * @param {Object} params - Parameters for interpolation
 * @returns {string} Translated string
 */
function t(key, params = {}) {
  const state = getState()
  const lang = state.lang || 'fr'
  const langTranslations = translations[lang] || translations.fr
  let text = langTranslations[key] || translations.fr[key] || key

  // Interpolate parameters
  Object.entries(params).forEach(([paramKey, value]) => {
    text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), value)
  })

  return text
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) {
    return Infinity
  }

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
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ==================== SETTINGS MANAGEMENT ====================

/**
 * Load settings from localStorage
 * @returns {Object} Settings object
 */
function loadSettings() {
  if (settings) return settings

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      settings = JSON.parse(saved)
    }
  } catch (e) {
    console.warn('[FriendNearby] Failed to load settings:', e)
  }

  if (!settings) {
    settings = {
      enabled: false,
      radiusKm: DEFAULT_RADIUS_KM,
      cooldownMinutes: DEFAULT_COOLDOWN_MINUTES,
      lastNotified: {},
    }
  }

  // Restore lastNotified map from settings
  if (settings.lastNotified) {
    Object.entries(settings.lastNotified).forEach(([friendId, timestamp]) => {
      lastNotifiedFriends.set(friendId, timestamp)
    })
  }

  return settings
}

/**
 * Save settings to localStorage
 */
function saveSettings() {
  try {
    // Convert lastNotifiedFriends Map to object for storage
    settings.lastNotified = Object.fromEntries(lastNotifiedFriends)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.warn('[FriendNearby] Failed to save settings:', e)
  }
}

/**
 * Get current settings
 * @returns {Object} Current settings
 */
export function getSettings() {
  return { ...loadSettings() }
}

// ==================== RADIUS MANAGEMENT ====================

/**
 * Set the notification radius in kilometers
 * @param {number} radiusKm - Radius in kilometers
 * @returns {boolean} Success
 */
export function setNearbyRadius(radiusKm) {
  if (typeof radiusKm !== 'number' || radiusKm <= 0) {
    console.warn('[FriendNearby] Invalid radius:', radiusKm)
    return false
  }

  loadSettings()
  settings.radiusKm = radiusKm
  saveSettings()

  showToast(t('radiusSet', { radius: formatDistance(radiusKm) }), 'info')
  return true
}

/**
 * Get the current notification radius in kilometers
 * @returns {number} Radius in kilometers
 */
export function getNearbyRadius() {
  loadSettings()
  return settings.radiusKm || DEFAULT_RADIUS_KM
}

// ==================== COOLDOWN MANAGEMENT ====================

/**
 * Set the notification cooldown in minutes
 * @param {number} minutes - Cooldown in minutes (minimum 30)
 * @returns {boolean} Success
 */
export function setNotificationCooldown(minutes) {
  if (typeof minutes !== 'number' || minutes < MIN_COOLDOWN_MINUTES) {
    console.warn('[FriendNearby] Invalid cooldown (minimum 30 minutes):', minutes)
    return false
  }

  loadSettings()
  settings.cooldownMinutes = minutes
  saveSettings()

  showToast(t('cooldownSet', { minutes }), 'info')
  return true
}

/**
 * Get the current notification cooldown in minutes
 * @returns {number} Cooldown in minutes
 */
export function getNotificationCooldown() {
  loadSettings()
  return settings.cooldownMinutes || DEFAULT_COOLDOWN_MINUTES
}

// ==================== ENABLE/DISABLE ====================

/**
 * Enable friend nearby notifications
 * @returns {boolean} Success
 */
export function enableFriendNearbyNotifications() {
  loadSettings()
  settings.enabled = true
  saveSettings()

  showToast(t('notificationsEnabled'), 'success')
  return true
}

/**
 * Disable friend nearby notifications
 * @returns {boolean} Success
 */
export function disableFriendNearbyNotifications() {
  loadSettings()
  settings.enabled = false
  saveSettings()

  showToast(t('notificationsDisabled'), 'info')
  return true
}

/**
 * Check if friend nearby notifications are enabled
 * @returns {boolean} Enabled state
 */
export function isEnabled() {
  loadSettings()
  return settings.enabled === true
}

// ==================== DISTANCE FUNCTIONS ====================

/**
 * Get distance between user and a friend
 * @param {string} userId - User ID
 * @param {string} friendId - Friend ID
 * @returns {number|null} Distance in km or null if cannot calculate
 */
export function getFriendDistance(userId, friendId) {
  const state = getState()

  // Get user location
  const userLocation = state.userLocation
  if (!userLocation || userLocation.lat == null || userLocation.lng == null) {
    return null
  }

  // Get friend's location from friendsLocations
  const friendsLocations = state.friendsLocations || []
  const friendLocation = friendsLocations.find(
    (f) => f.userId === friendId && f.locationSharingEnabled !== false
  )

  if (!friendLocation || friendLocation.lat == null || friendLocation.lng == null) {
    return null
  }

  const distance = calculateDistanceKm(
    userLocation.lat,
    userLocation.lng,
    friendLocation.lat,
    friendLocation.lng
  )

  // Round to 2 decimal places
  return Math.round(distance * 100) / 100
}

/**
 * Format distance for display
 * @param {number} km - Distance in kilometers
 * @returns {string} Formatted distance (e.g., "2.3 km" or "500 m")
 */
export function formatDistance(km) {
  if (km == null || isNaN(km)) {
    return '--'
  }

  if (km < 1) {
    const meters = Math.round(km * 1000)
    return `${meters} ${t('meters')}`
  }

  const rounded = Math.round(km * 10) / 10
  return `${rounded} ${t('kilometers')}`
}

// ==================== NOTIFICATION COOLDOWN ====================

/**
 * Get list of recently notified friends (to avoid spam)
 * @returns {Array} Array of {friendId, timestamp, timeAgo}
 */
export function getLastNotifiedFriends() {
  loadSettings()

  const now = Date.now()
  const cooldownMs = (settings.cooldownMinutes || DEFAULT_COOLDOWN_MINUTES) * 60 * 1000

  const result = []
  lastNotifiedFriends.forEach((timestamp, friendId) => {
    if (now - timestamp < cooldownMs) {
      const timeAgoMs = now - timestamp
      const timeAgoMinutes = Math.floor(timeAgoMs / 60000)
      result.push({
        friendId,
        timestamp,
        timeAgoMinutes,
      })
    }
  })

  return result.sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * Check if we should notify for a specific friend (respects cooldown)
 * @param {string} friendId - Friend ID
 * @returns {boolean} True if should notify
 */
export function shouldNotifyForFriend(friendId) {
  if (!friendId) return false

  loadSettings()

  const lastNotified = lastNotifiedFriends.get(friendId)
  if (!lastNotified) return true

  const cooldownMs = (settings.cooldownMinutes || DEFAULT_COOLDOWN_MINUTES) * 60 * 1000
  const now = Date.now()

  return now - lastNotified >= cooldownMs
}

/**
 * Record that a friend was notified
 * @param {string} friendId - Friend ID
 */
function recordNotification(friendId) {
  lastNotifiedFriends.set(friendId, Date.now())
  saveSettings()
}

/**
 * Clear cooldown for a specific friend
 * @param {string} friendId - Friend ID
 */
export function clearFriendCooldown(friendId) {
  lastNotifiedFriends.delete(friendId)
  saveSettings()
}

/**
 * Clear all notification cooldowns
 */
export function clearAllCooldowns() {
  lastNotifiedFriends.clear()
  saveSettings()
}

// ==================== MAIN CHECK FUNCTION ====================

/**
 * Check for friends within the configured radius
 * @param {Object} userLocation - User's location {lat, lng}
 * @param {number} radius - Optional radius override in km
 * @returns {Array} Array of nearby friends with distance info
 */
export function checkFriendsNearby(userLocation, radius) {
  if (!userLocation || userLocation.lat == null || userLocation.lng == null) {
    return []
  }

  loadSettings()
  const radiusKm = radius != null ? radius : settings.radiusKm || DEFAULT_RADIUS_KM

  const state = getState()
  const friendsLocations = state.friendsLocations || []
  const friends = state.friends || []

  const nearbyFriends = []

  for (const friendLoc of friendsLocations) {
    // Privacy check: only include friends who have enabled location sharing
    if (friendLoc.locationSharingEnabled === false) {
      continue
    }

    // Skip if no valid coordinates
    if (friendLoc.lat == null || friendLoc.lng == null) {
      continue
    }

    // Skip if location is too old (> 1 hour)
    if (friendLoc.lastUpdate && Date.now() - friendLoc.lastUpdate > 60 * 60 * 1000) {
      continue
    }

    // Calculate distance
    const distance = calculateDistanceKm(
      userLocation.lat,
      userLocation.lng,
      friendLoc.lat,
      friendLoc.lng
    )

    // Check if within radius
    if (distance <= radiusKm) {
      // Get friend details
      const friendDetails = friends.find((f) => f.id === friendLoc.userId)

      nearbyFriends.push({
        friendId: friendLoc.userId,
        name: friendLoc.username || friendDetails?.name || t('anonymousUser') || 'Unknown',
        avatar: friendLoc.avatar || friendDetails?.avatar || null,
        distance: Math.round(distance * 100) / 100,
        distanceFormatted: formatDistance(distance),
        location: { lat: friendLoc.lat, lng: friendLoc.lng },
        lastUpdate: friendLoc.lastUpdate,
        shouldNotify: shouldNotifyForFriend(friendLoc.userId),
      })
    }
  }

  // Sort by distance (closest first)
  nearbyFriends.sort((a, b) => a.distance - b.distance)

  // Update state with nearby friends
  setState({ nearbyFriends })

  return nearbyFriends
}

/**
 * Get sorted list of nearby friends (alias for checkFriendsNearby with state location)
 * @param {Object} userLocation - User's location {lat, lng}
 * @returns {Array} Array of nearby friends sorted by distance
 */
export function getNearbyFriendsList(userLocation) {
  const state = getState()
  const location = userLocation || state.userLocation

  if (!location) {
    return []
  }

  return checkFriendsNearby(location)
}

// ==================== NOTIFICATION FUNCTION ====================

/**
 * Send notification for a nearby friend
 * @param {Object} friend - Friend object {friendId, name, avatar, distance}
 * @param {number} distance - Distance in km
 * @returns {boolean} True if notification was sent
 */
export function notifyFriendNearby(friend, distance) {
  if (!friend || !friend.friendId) {
    return false
  }

  loadSettings()

  // Check if notifications are enabled
  if (!settings.enabled) {
    return false
  }

  // Check cooldown
  if (!shouldNotifyForFriend(friend.friendId)) {
    return false
  }

  const distanceFormatted = formatDistance(distance)

  // Toast notification
  showToast(
    `${t('friendNearbyTitle')} ${friend.name} - ${distanceFormatted}`,
    'info'
  )

  // Push notification if supported
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(t('friendNearbyTitle'), {
        body: t('friendNearbyBody', { name: friend.name, distance: distanceFormatted }),
        icon: '/icon-192.png',
        tag: `friend_nearby_${friend.friendId}`,
        data: {
          type: 'friend_nearby',
          friendId: friend.friendId,
        },
      })
    } catch (e) {
      console.warn('[FriendNearby] Failed to send push notification:', e)
    }
  }

  // Record notification time
  recordNotification(friend.friendId)

  // Add to notification history in state
  const state = getState()
  const notifications = state.nearbyNotifications || []
  notifications.unshift({
    id: `nearby_${Date.now()}`,
    type: 'friend_nearby',
    friendId: friend.friendId,
    friendName: friend.name,
    friendAvatar: friend.avatar,
    distance: distance,
    distanceFormatted,
    timestamp: Date.now(),
    read: false,
  })

  // Keep only last 20 notifications
  setState({
    nearbyNotifications: notifications.slice(0, 20),
  })

  return true
}

// ==================== RENDER FUNCTIONS ====================

/**
 * Render a nearby friend card
 * @param {Object} friend - Friend object {friendId, name, avatar, distance, distanceFormatted}
 * @param {number} distance - Distance in km (optional, will use friend.distance if not provided)
 * @returns {string} HTML string
 */
export function renderNearbyFriendCard(friend, distance) {
  if (!friend) return ''

  const dist = distance != null ? distance : friend.distance
  const distFormatted = friend.distanceFormatted || formatDistance(dist)
  const name = escapeHTML(friend.name || 'Unknown')
  const avatar = escapeHTML(friend.avatar || '?')
  const friendId = escapeHTML(friend.friendId || '')

  const lastSeenText = friend.lastUpdate
    ? t('lastSeen', { time: formatTimeAgo(friend.lastUpdate) })
    : ''

  return `
    <div class="friend-nearby-card flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors" data-friend-id="${friendId}">
      <div class="friend-avatar w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-xl" aria-hidden="true">
        ${avatar}
      </div>
      <div class="friend-info flex-1 min-w-0">
        <div class="friend-name font-medium text-white truncate">${name}</div>
        <div class="friend-distance text-sm text-emerald-400 flex items-center gap-1">
          ${icon('navigation', 'w-3 h-3')}
          <span>${distFormatted} ${t('away')}</span>
        </div>
        ${lastSeenText ? `<div class="friend-last-seen text-xs text-slate-400">${escapeHTML(lastSeenText)}</div>` : ''}
      </div>
      <div class="friend-actions flex gap-2">
        <button
          onclick="showFriendOnMap('${friendId}')"
          class="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
          aria-label="${t('viewOnMap')}"
        >
          ${icon('map-pin', 'w-5 h-5')}
        </button>
        <button
          onclick="openFriendChat('${friendId}')"
          class="p-2 rounded-xl bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors"
          aria-label="${t('sendMessage')}"
        >
          ${icon('message-circle', 'w-5 h-5')}
        </button>
      </div>
    </div>
  `
}

/**
 * Format time ago for display
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted time ago
 */
function formatTimeAgo(timestamp) {
  if (!timestamp) return ''

  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)

  if (minutes < 1) return '< 1 min'
  if (minutes < 60) return `${minutes} min`
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

/**
 * Render nearby friends list
 * @param {Array} friends - Array of nearby friends
 * @returns {string} HTML string
 */
export function renderNearbyFriendsList(friends) {
  if (!friends || friends.length === 0) {
    return `
      <div class="nearby-friends-empty p-8 text-center text-slate-400">
        ${icon('users', 'w-8 h-8 mb-2')}
        <p>${t('noFriendsNearby')}</p>
        <p class="text-xs mt-2">${t('privacyNote')}</p>
      </div>
    `
  }

  return `
    <div class="nearby-friends-list space-y-2 p-4">
      <div class="nearby-friends-header text-sm text-slate-400 mb-3">
        ${friends.length} ${t('friendsNearby')}
      </div>
      ${friends.map((friend) => renderNearbyFriendCard(friend)).join('')}
    </div>
  `
}

/**
 * Render settings panel for friend nearby notifications
 * @returns {string} HTML string
 */
export function renderFriendNearbySettings() {
  loadSettings()

  const radiusOptions = [1, 2, 5, 10, 20, 50].map((r) => {
    const selected = r === settings.radiusKm ? 'selected' : ''
    return `<option value="${r}" ${selected}>${r} km</option>`
  }).join('')

  const cooldownOptions = [30, 60, 120, 240, 480].map((m) => {
    const selected = m === settings.cooldownMinutes ? 'selected' : ''
    const label = m >= 60 ? `${m / 60}h` : `${m} min`
    return `<option value="${m}" ${selected}>${label}</option>`
  }).join('')

  return `
    <div class="friend-nearby-settings bg-dark-card rounded-xl p-4">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          ${icon('users', 'w-5 h-5 text-emerald-400')}
        </div>
        <div class="flex-1">
          <h3 class="font-semibold">${t('friendNearbyTitle')}</h3>
          <p class="text-xs text-slate-400">${t('privacyNote')}</p>
        </div>
        <button
          onclick="toggleFriendNearbyNotifications()"
          class="w-12 h-6 rounded-full transition-colors ${settings.enabled ? 'bg-emerald-500' : 'bg-white/20'}"
          aria-label="${settings.enabled ? t('notificationsDisabled') : t('notificationsEnabled')}"
        >
          <div class="w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.enabled ? 'translate-x-6' : 'translate-x-0.5'}"></div>
        </button>
      </div>

      ${settings.enabled ? `
        <div class="space-y-3 pl-13 border-t border-white/10 pt-4 mt-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-400">${t('radiusSet', { radius: '' }).replace(': ', '')}</span>
            <select
              onchange="setFriendNearbyRadius(Number(this.value))"
              class="bg-white/10 rounded-xl px-3 py-1.5 text-sm"
            >
              ${radiusOptions}
            </select>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-400">${t('cooldownSet', { minutes: '' }).replace(': ', '')}</span>
            <select
              onchange="setFriendNearbyCooldown(Number(this.value))"
              class="bg-white/10 rounded-xl px-3 py-1.5 text-sm"
            >
              ${cooldownOptions}
            </select>
          </div>
        </div>
      ` : ''}
    </div>
  `
}

// ==================== GLOBAL HANDLERS ====================

// Register global handlers if in browser context
if (typeof window !== 'undefined') {
  window.toggleFriendNearbyNotifications = () => {
    if (isEnabled()) {
      disableFriendNearbyNotifications()
    } else {
      enableFriendNearbyNotifications()
    }
  }

  window.setFriendNearbyRadius = (radius) => {
    setNearbyRadius(radius)
  }

  window.setFriendNearbyCooldown = (minutes) => {
    setNotificationCooldown(minutes)
  }
}

// ==================== EXPORTS ====================

export default {
  // Settings
  getSettings,
  setNearbyRadius,
  getNearbyRadius,
  setNotificationCooldown,
  getNotificationCooldown,

  // Enable/Disable
  enableFriendNearbyNotifications,
  disableFriendNearbyNotifications,
  isEnabled,

  // Distance
  getFriendDistance,
  formatDistance,

  // Cooldown
  getLastNotifiedFriends,
  shouldNotifyForFriend,
  clearFriendCooldown,
  clearAllCooldowns,

  // Main functions
  checkFriendsNearby,
  getNearbyFriendsList,
  notifyFriendNearby,

  // Render
  renderNearbyFriendCard,
  renderNearbyFriendsList,
  renderFriendNearbySettings,

  // Translations
  translations,

  // Testing
  resetFriendNearbyState,
}
