/**
 * Notification Preferences Service
 * Manages user notification preferences with localStorage persistence
 * Supports i18n for FR, EN, ES, DE
 */

import { getState, setState } from '../stores/state.js'

// Storage key for localStorage
const STORAGE_KEY = 'spothitch_notification_prefs'
const OLD_STORAGE_KEY = 'spothitch_notifications' // Legacy key for migration

/**
 * All supported notification types
 */
export const NOTIFICATION_TYPES = {
  NEW_FRIEND: 'new_friend',
  NEW_MESSAGE: 'new_message',
  BADGE_UNLOCKED: 'badge_unlocked',
  LEVEL_UP: 'level_up',
  SPOT_NEARBY: 'spot_nearby',
  FRIEND_NEARBY: 'friend_nearby',
  STREAK_REMINDER: 'streak_reminder',
  WEEKLY_DIGEST: 'weekly_digest',
  SPOT_UPDATE: 'spot_update',
  CHALLENGE_UPDATE: 'challenge_update'
}

/**
 * Translations for notification types
 */
const translations = {
  fr: {
    labels: {
      new_friend: 'Nouvelle demande d\'ami',
      new_message: 'Nouveau message prive',
      badge_unlocked: 'Badge debloque',
      level_up: 'Montee de niveau',
      spot_nearby: 'Spot a proximite',
      friend_nearby: 'Ami a proximite',
      streak_reminder: 'Rappel de serie',
      weekly_digest: 'Resume hebdomadaire',
      spot_update: 'Mise a jour de spot',
      challenge_update: 'Mise a jour de defi'
    },
    descriptions: {
      new_friend: 'Recevoir une notification quand quelqu\'un veut devenir votre ami',
      new_message: 'Recevoir une notification pour les nouveaux messages prives',
      badge_unlocked: 'Recevoir une notification quand vous debloquez un badge',
      level_up: 'Recevoir une notification quand vous montez de niveau',
      spot_nearby: 'Recevoir une notification quand un spot est proche (mode voyage)',
      friend_nearby: 'Recevoir une notification quand un ami est a proximite',
      streak_reminder: 'Recevoir un rappel pour maintenir votre serie',
      weekly_digest: 'Recevoir un resume hebdomadaire de votre activite',
      spot_update: 'Recevoir des mises a jour sur vos spots crees ou evalues',
      challenge_update: 'Recevoir des notifications sur vos defis en cours'
    }
  },
  en: {
    labels: {
      new_friend: 'New friend request',
      new_message: 'New private message',
      badge_unlocked: 'Badge unlocked',
      level_up: 'Level up',
      spot_nearby: 'Spot nearby',
      friend_nearby: 'Friend nearby',
      streak_reminder: 'Streak reminder',
      weekly_digest: 'Weekly summary',
      spot_update: 'Spot update',
      challenge_update: 'Challenge update'
    },
    descriptions: {
      new_friend: 'Get notified when someone wants to be your friend',
      new_message: 'Get notified for new private messages',
      badge_unlocked: 'Get notified when you unlock a badge',
      level_up: 'Get notified when you level up',
      spot_nearby: 'Get notified when a spot is nearby (travel mode)',
      friend_nearby: 'Get notified when a friend is nearby',
      streak_reminder: 'Get a reminder to maintain your streak',
      weekly_digest: 'Receive a weekly summary of your activity',
      spot_update: 'Get updates on spots you created or reviewed',
      challenge_update: 'Get notifications about your ongoing challenges'
    }
  },
  es: {
    labels: {
      new_friend: 'Nueva solicitud de amistad',
      new_message: 'Nuevo mensaje privado',
      badge_unlocked: 'Insignia desbloqueada',
      level_up: 'Subida de nivel',
      spot_nearby: 'Spot cercano',
      friend_nearby: 'Amigo cercano',
      streak_reminder: 'Recordatorio de racha',
      weekly_digest: 'Resumen semanal',
      spot_update: 'Actualizacion de spot',
      challenge_update: 'Actualizacion de desafio'
    },
    descriptions: {
      new_friend: 'Recibir notificacion cuando alguien quiere ser tu amigo',
      new_message: 'Recibir notificacion para nuevos mensajes privados',
      badge_unlocked: 'Recibir notificacion cuando desbloqueas una insignia',
      level_up: 'Recibir notificacion cuando subes de nivel',
      spot_nearby: 'Recibir notificacion cuando hay un spot cerca (modo viaje)',
      friend_nearby: 'Recibir notificacion cuando un amigo esta cerca',
      streak_reminder: 'Recibir recordatorio para mantener tu racha',
      weekly_digest: 'Recibir un resumen semanal de tu actividad',
      spot_update: 'Recibir actualizaciones de spots que creaste o evaluaste',
      challenge_update: 'Recibir notificaciones sobre tus desafios en curso'
    }
  },
  de: {
    labels: {
      new_friend: 'Neue Freundschaftsanfrage',
      new_message: 'Neue private Nachricht',
      badge_unlocked: 'Abzeichen freigeschaltet',
      level_up: 'Level aufgestiegen',
      spot_nearby: 'Spot in der Nahe',
      friend_nearby: 'Freund in der Nahe',
      streak_reminder: 'Serie-Erinnerung',
      weekly_digest: 'Wochentliche Zusammenfassung',
      spot_update: 'Spot-Aktualisierung',
      challenge_update: 'Herausforderungs-Update'
    },
    descriptions: {
      new_friend: 'Benachrichtigung erhalten, wenn jemand dein Freund sein mochte',
      new_message: 'Benachrichtigung fur neue private Nachrichten erhalten',
      badge_unlocked: 'Benachrichtigung erhalten, wenn du ein Abzeichen freischaltest',
      level_up: 'Benachrichtigung erhalten, wenn du ein Level aufsteigst',
      spot_nearby: 'Benachrichtigung erhalten, wenn ein Spot in der Nahe ist (Reisemodus)',
      friend_nearby: 'Benachrichtigung erhalten, wenn ein Freund in der Nahe ist',
      streak_reminder: 'Erinnerung erhalten, um deine Serie beizubehalten',
      weekly_digest: 'Eine wochentliche Zusammenfassung deiner Aktivitaten erhalten',
      spot_update: 'Updates zu Spots erhalten, die du erstellt oder bewertet hast',
      challenge_update: 'Benachrichtigungen uber deine laufenden Herausforderungen erhalten'
    }
  }
}

/**
 * Get default notification preferences
 * @returns {Object} Default preferences object
 */
export function getDefaultPreferences() {
  return {
    enabled: true, // Master toggle
    types: {
      [NOTIFICATION_TYPES.NEW_FRIEND]: true,
      [NOTIFICATION_TYPES.NEW_MESSAGE]: true,
      [NOTIFICATION_TYPES.BADGE_UNLOCKED]: true,
      [NOTIFICATION_TYPES.LEVEL_UP]: true,
      [NOTIFICATION_TYPES.SPOT_NEARBY]: true,
      [NOTIFICATION_TYPES.FRIEND_NEARBY]: true,
      [NOTIFICATION_TYPES.STREAK_REMINDER]: true,
      [NOTIFICATION_TYPES.WEEKLY_DIGEST]: false, // Off by default (can be spammy)
      [NOTIFICATION_TYPES.SPOT_UPDATE]: true,
      [NOTIFICATION_TYPES.CHALLENGE_UPDATE]: true
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    sound: true,
    vibration: true,
    version: 2 // For future migrations
  }
}

/**
 * Get localStorage safely
 * @returns {Storage|null}
 */
function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage
    }
    return null
  } catch (e) {
    return null
  }
}

/**
 * Load preferences from localStorage
 * @returns {Object|null}
 */
function loadFromStorage() {
  const storage = getStorage()
  if (!storage) return null

  try {
    const data = storage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
    return null
  } catch (e) {
    console.error('Error loading notification preferences:', e)
    return null
  }
}

/**
 * Save preferences to localStorage
 * @param {Object} prefs - Preferences to save
 */
function saveToStorage(prefs) {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch (e) {
    console.error('Error saving notification preferences:', e)
  }
}

/**
 * Get current notification preferences
 * @returns {Object} Current preferences (from storage or defaults)
 */
export function getNotificationPreferences() {
  // Try to load from storage
  const stored = loadFromStorage()

  if (stored && validatePreferences(stored)) {
    return stored
  }

  // Try to migrate old preferences
  const migrated = migrateOldPreferences()
  if (migrated) {
    return migrated
  }

  // Return defaults
  return getDefaultPreferences()
}

/**
 * Set notification preferences
 * @param {Object} prefs - New preferences object
 * @returns {Object} Updated preferences
 * @throws {Error} If preferences are invalid
 */
export function setNotificationPreferences(prefs) {
  if (!prefs || typeof prefs !== 'object') {
    throw new Error('Preferences must be an object')
  }

  // Merge with current preferences
  const current = getNotificationPreferences()
  const merged = {
    ...current,
    ...prefs,
    types: {
      ...current.types,
      ...(prefs.types || {})
    },
    quietHours: {
      ...current.quietHours,
      ...(prefs.quietHours || {})
    },
    version: current.version
  }

  // Validate merged preferences
  if (!validatePreferences(merged)) {
    throw new Error('Invalid preferences format')
  }

  // Save to storage
  saveToStorage(merged)

  // Update global state if available
  try {
    setState({ notificationPreferences: merged })
  } catch (e) {
    // State may not be available in tests
  }

  return merged
}

/**
 * Toggle a specific notification type
 * @param {string} type - Notification type to toggle
 * @returns {boolean} New state of the notification type
 * @throws {Error} If type is invalid
 */
export function toggleNotificationType(type) {
  if (!isValidNotificationType(type)) {
    throw new Error(`Invalid notification type: ${type}`)
  }

  const prefs = getNotificationPreferences()
  const newState = !prefs.types[type]

  prefs.types[type] = newState
  saveToStorage(prefs)

  // Update global state
  try {
    setState({ notificationPreferences: prefs })
  } catch (e) {
    // State may not be available in tests
  }

  return newState
}

/**
 * Check if a notification type is enabled
 * @param {string} type - Notification type to check
 * @returns {boolean} Whether the notification type is enabled
 */
export function isNotificationEnabled(type) {
  if (!isValidNotificationType(type)) {
    return false
  }

  const prefs = getNotificationPreferences()

  // Check master toggle first
  if (!prefs.enabled) {
    return false
  }

  // Check quiet hours
  if (isInQuietHours(prefs)) {
    return false
  }

  return prefs.types[type] === true
}

/**
 * Check if currently in quiet hours
 * @param {Object} prefs - Preferences object
 * @returns {boolean}
 */
function isInQuietHours(prefs) {
  if (!prefs.quietHours || !prefs.quietHours.enabled) {
    return false
  }

  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const { start, end } = prefs.quietHours

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (start > end) {
    return currentTime >= start || currentTime < end
  }

  // Normal range (e.g., 12:00 to 14:00)
  return currentTime >= start && currentTime < end
}

/**
 * Reset preferences to defaults
 * @returns {Object} Default preferences
 */
export function resetToDefaults() {
  const defaults = getDefaultPreferences()
  saveToStorage(defaults)

  // Update global state
  try {
    setState({ notificationPreferences: defaults })
  } catch (e) {
    // State may not be available in tests
  }

  return defaults
}

/**
 * Get all notification types
 * @returns {string[]} Array of notification type keys
 */
export function getNotificationTypes() {
  return Object.values(NOTIFICATION_TYPES)
}

/**
 * Check if a notification type is valid
 * @param {string} type - Type to check
 * @returns {boolean}
 */
function isValidNotificationType(type) {
  return Object.values(NOTIFICATION_TYPES).includes(type)
}

/**
 * Get translated label for a notification type
 * @param {string} type - Notification type
 * @param {string} lang - Language code (fr, en, es, de)
 * @returns {string} Translated label
 */
export function getNotificationTypeLabel(type, lang = 'fr') {
  const language = translations[lang] || translations.fr
  return language.labels[type] || type
}

/**
 * Get translated description for a notification type
 * @param {string} type - Notification type
 * @param {string} lang - Language code (fr, en, es, de)
 * @returns {string} Translated description
 */
export function getNotificationTypeDescription(type, lang = 'fr') {
  const language = translations[lang] || translations.de
  return language.descriptions[type] || ''
}

/**
 * Export preferences as JSON string
 * @returns {string} JSON string of preferences
 */
export function exportPreferences() {
  const prefs = getNotificationPreferences()
  return JSON.stringify(prefs, null, 2)
}

/**
 * Import preferences from JSON string
 * @param {string} json - JSON string of preferences
 * @returns {Object} Imported preferences
 * @throws {Error} If JSON is invalid or preferences are invalid
 */
export function importPreferences(json) {
  if (typeof json !== 'string') {
    throw new Error('Input must be a JSON string')
  }

  let parsed
  try {
    parsed = JSON.parse(json)
  } catch (e) {
    throw new Error('Invalid JSON format')
  }

  if (!validatePreferences(parsed)) {
    throw new Error('Invalid preferences structure')
  }

  saveToStorage(parsed)

  // Update global state
  try {
    setState({ notificationPreferences: parsed })
  } catch (e) {
    // State may not be available in tests
  }

  return parsed
}

/**
 * Validate preferences object structure
 * @param {Object} prefs - Preferences to validate
 * @returns {boolean} Whether preferences are valid
 */
export function validatePreferences(prefs) {
  if (!prefs || typeof prefs !== 'object') {
    return false
  }

  // Check required fields
  if (typeof prefs.enabled !== 'boolean') {
    return false
  }

  if (!prefs.types || typeof prefs.types !== 'object') {
    return false
  }

  // Check that all notification types have boolean values
  const validTypes = Object.values(NOTIFICATION_TYPES)
  for (const type of validTypes) {
    if (prefs.types[type] !== undefined && typeof prefs.types[type] !== 'boolean') {
      return false
    }
  }

  // Check quiet hours if present
  if (prefs.quietHours) {
    if (typeof prefs.quietHours !== 'object') {
      return false
    }

    if (prefs.quietHours.enabled !== undefined && typeof prefs.quietHours.enabled !== 'boolean') {
      return false
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (prefs.quietHours.start && !timeRegex.test(prefs.quietHours.start)) {
      return false
    }
    if (prefs.quietHours.end && !timeRegex.test(prefs.quietHours.end)) {
      return false
    }
  }

  // Check sound and vibration if present
  if (prefs.sound !== undefined && typeof prefs.sound !== 'boolean') {
    return false
  }
  if (prefs.vibration !== undefined && typeof prefs.vibration !== 'boolean') {
    return false
  }

  return true
}

/**
 * Migrate from old preferences format if needed
 * @returns {Object|null} Migrated preferences or null if not found
 */
export function migrateOldPreferences() {
  const storage = getStorage()
  if (!storage) return null

  try {
    const oldData = storage.getItem(OLD_STORAGE_KEY)
    if (!oldData) return null

    const old = JSON.parse(oldData)

    // Map old format to new format
    const migrated = getDefaultPreferences()

    // Old format might have different structure
    if (old.enabled !== undefined) {
      migrated.enabled = old.enabled
    }

    // Map old notification keys to new ones if they exist
    if (old.notifications) {
      for (const [key, value] of Object.entries(old.notifications)) {
        // Try to map old key names
        const mappedKey = mapOldKey(key)
        if (mappedKey && isValidNotificationType(mappedKey)) {
          migrated.types[mappedKey] = Boolean(value)
        }
      }
    }

    // Copy individual old settings if they exist
    if (old.types) {
      for (const [key, value] of Object.entries(old.types)) {
        if (isValidNotificationType(key)) {
          migrated.types[key] = Boolean(value)
        }
      }
    }

    // Migrate quiet hours
    if (old.quietMode || old.quietHours) {
      const quietSource = old.quietHours || old.quietMode
      migrated.quietHours.enabled = Boolean(quietSource.enabled)
      if (quietSource.start) migrated.quietHours.start = quietSource.start
      if (quietSource.end) migrated.quietHours.end = quietSource.end
    }

    // Migrate sound/vibration settings
    if (old.sound !== undefined) migrated.sound = Boolean(old.sound)
    if (old.vibration !== undefined) migrated.vibration = Boolean(old.vibration)

    // Save migrated preferences
    saveToStorage(migrated)

    // Remove old storage key
    storage.removeItem(OLD_STORAGE_KEY)

    return migrated
  } catch (e) {
    console.error('Error migrating old preferences:', e)
    return null
  }
}

/**
 * Map old notification key names to new ones
 * @param {string} oldKey - Old key name
 * @returns {string|null} New key name or null
 */
function mapOldKey(oldKey) {
  const mapping = {
    'friendRequest': NOTIFICATION_TYPES.NEW_FRIEND,
    'friend_request': NOTIFICATION_TYPES.NEW_FRIEND,
    'message': NOTIFICATION_TYPES.NEW_MESSAGE,
    'pm': NOTIFICATION_TYPES.NEW_MESSAGE,
    'badge': NOTIFICATION_TYPES.BADGE_UNLOCKED,
    'badges': NOTIFICATION_TYPES.BADGE_UNLOCKED,
    'level': NOTIFICATION_TYPES.LEVEL_UP,
    'levelup': NOTIFICATION_TYPES.LEVEL_UP,
    'nearbySpot': NOTIFICATION_TYPES.SPOT_NEARBY,
    'nearby_spot': NOTIFICATION_TYPES.SPOT_NEARBY,
    'nearbyFriend': NOTIFICATION_TYPES.FRIEND_NEARBY,
    'nearby_friend': NOTIFICATION_TYPES.FRIEND_NEARBY,
    'streak': NOTIFICATION_TYPES.STREAK_REMINDER,
    'streaks': NOTIFICATION_TYPES.STREAK_REMINDER,
    'digest': NOTIFICATION_TYPES.WEEKLY_DIGEST,
    'weekly': NOTIFICATION_TYPES.WEEKLY_DIGEST,
    'spotUpdates': NOTIFICATION_TYPES.SPOT_UPDATE,
    'spot_updates': NOTIFICATION_TYPES.SPOT_UPDATE,
    'challenge': NOTIFICATION_TYPES.CHALLENGE_UPDATE,
    'challenges': NOTIFICATION_TYPES.CHALLENGE_UPDATE
  }

  return mapping[oldKey] || null
}

/**
 * Render the notification preferences UI
 * @param {string} lang - Language code
 * @returns {string} HTML string
 */
export function renderPreferencesUI(lang = 'fr') {
  const prefs = getNotificationPreferences()
  const types = getNotificationTypes()

  const masterToggleChecked = prefs.enabled ? 'checked' : ''
  const soundChecked = prefs.sound ? 'checked' : ''
  const vibrationChecked = prefs.vibration ? 'checked' : ''
  const quietHoursChecked = prefs.quietHours?.enabled ? 'checked' : ''

  const uiLabels = {
    fr: {
      title: 'Preferences de notification',
      masterToggle: 'Activer les notifications',
      sound: 'Son',
      vibration: 'Vibration',
      quietHours: 'Heures calmes',
      quietStart: 'Debut',
      quietEnd: 'Fin',
      reset: 'Reinitialiser',
      save: 'Enregistrer'
    },
    en: {
      title: 'Notification Preferences',
      masterToggle: 'Enable notifications',
      sound: 'Sound',
      vibration: 'Vibration',
      quietHours: 'Quiet hours',
      quietStart: 'Start',
      quietEnd: 'End',
      reset: 'Reset',
      save: 'Save'
    },
    es: {
      title: 'Preferencias de notificacion',
      masterToggle: 'Habilitar notificaciones',
      sound: 'Sonido',
      vibration: 'Vibracion',
      quietHours: 'Horas de silencio',
      quietStart: 'Inicio',
      quietEnd: 'Fin',
      reset: 'Restablecer',
      save: 'Guardar'
    },
    de: {
      title: 'Benachrichtigungseinstellungen',
      masterToggle: 'Benachrichtigungen aktivieren',
      sound: 'Ton',
      vibration: 'Vibration',
      quietHours: 'Ruhezeiten',
      quietStart: 'Start',
      quietEnd: 'Ende',
      reset: 'Zurucksetzen',
      save: 'Speichern'
    }
  }

  const labels = uiLabels[lang] || uiLabels.fr

  const typeToggles = types.map(type => {
    const checked = prefs.types[type] ? 'checked' : ''
    const label = getNotificationTypeLabel(type, lang)
    const description = getNotificationTypeDescription(type, lang)

    return `
      <div class="notification-pref-item flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700" data-type="${type}">
        <div class="flex-1">
          <label for="notif-${type}" class="font-medium text-gray-900 dark:text-white cursor-pointer">
            ${label}
          </label>
          <p class="text-sm text-gray-500 dark:text-gray-400">${description}</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" id="notif-${type}" name="${type}" class="sr-only peer notification-type-toggle" ${checked}
            onchange="window.toggleNotificationPref('${type}')" aria-label="${label}">
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
        </label>
      </div>
    `
  }).join('')

  return `
    <div class="notification-preferences p-4 bg-white dark:bg-gray-800 rounded-lg shadow" role="form" aria-label="${labels.title}">
      <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">${labels.title}</h2>

      <!-- Master Toggle -->
      <div class="master-toggle flex items-center justify-between py-3 mb-4 border-b-2 border-primary-500">
        <span class="font-semibold text-gray-900 dark:text-white">${labels.masterToggle}</span>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" id="notif-master" class="sr-only peer" ${masterToggleChecked}
            onchange="window.toggleNotificationMaster()" aria-label="${labels.masterToggle}">
          <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
        </label>
      </div>

      <!-- Notification Types -->
      <div class="notification-types mb-6">
        ${typeToggles}
      </div>

      <!-- Sound & Vibration -->
      <div class="sound-vibration flex gap-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" id="notif-sound" class="w-4 h-4 text-primary-600 rounded" ${soundChecked}
            onchange="window.toggleNotificationSound()" aria-label="${labels.sound}">
          <span class="text-gray-700 dark:text-gray-300">${labels.sound}</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" id="notif-vibration" class="w-4 h-4 text-primary-600 rounded" ${vibrationChecked}
            onchange="window.toggleNotificationVibration()" aria-label="${labels.vibration}">
          <span class="text-gray-700 dark:text-gray-300">${labels.vibration}</span>
        </label>
      </div>

      <!-- Quiet Hours -->
      <div class="quiet-hours py-3 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-2">
          <span class="font-medium text-gray-900 dark:text-white">${labels.quietHours}</span>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="notif-quiet-hours" class="sr-only peer" ${quietHoursChecked}
              onchange="window.toggleQuietHours()" aria-label="${labels.quietHours}">
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
          </label>
        </div>
        <div class="flex gap-4 mt-2">
          <div class="flex items-center gap-2">
            <label for="quiet-start" class="text-sm text-gray-600 dark:text-gray-400">${labels.quietStart}</label>
            <input type="time" id="quiet-start" value="${prefs.quietHours?.start || '22:00'}"
              onchange="window.setQuietHoursStart(this.value)"
              class="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
          </div>
          <div class="flex items-center gap-2">
            <label for="quiet-end" class="text-sm text-gray-600 dark:text-gray-400">${labels.quietEnd}</label>
            <input type="time" id="quiet-end" value="${prefs.quietHours?.end || '08:00'}"
              onchange="window.setQuietHoursEnd(this.value)"
              class="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions flex gap-4 mt-6">
        <button onclick="window.resetNotificationPrefs()"
          class="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label="${labels.reset}">
          ${labels.reset}
        </button>
        <button onclick="window.saveNotificationPrefs()"
          class="px-4 py-2 text-white bg-primary-600 rounded hover:bg-primary-700 transition-colors"
          aria-label="${labels.save}">
          ${labels.save}
        </button>
      </div>
    </div>
  `
}

/**
 * Set up global window handlers for the UI
 */
export function setupWindowHandlers() {
  if (typeof window === 'undefined') return

  window.toggleNotificationPref = (type) => {
    toggleNotificationType(type)
  }

  window.toggleNotificationMaster = () => {
    const prefs = getNotificationPreferences()
    setNotificationPreferences({ enabled: !prefs.enabled })
  }

  window.toggleNotificationSound = () => {
    const prefs = getNotificationPreferences()
    setNotificationPreferences({ sound: !prefs.sound })
  }

  window.toggleNotificationVibration = () => {
    const prefs = getNotificationPreferences()
    setNotificationPreferences({ vibration: !prefs.vibration })
  }

  window.toggleQuietHours = () => {
    const prefs = getNotificationPreferences()
    setNotificationPreferences({
      quietHours: { ...prefs.quietHours, enabled: !prefs.quietHours.enabled }
    })
  }

  window.setQuietHoursStart = (time) => {
    const prefs = getNotificationPreferences()
    setNotificationPreferences({
      quietHours: { ...prefs.quietHours, start: time }
    })
  }

  window.setQuietHoursEnd = (time) => {
    const prefs = getNotificationPreferences()
    setNotificationPreferences({
      quietHours: { ...prefs.quietHours, end: time }
    })
  }

  window.resetNotificationPrefs = () => {
    resetToDefaults()
  }

  window.saveNotificationPrefs = () => {
    // Preferences are already saved on each change
    // This is for explicit save action (can show toast)
    try {
      const { showToast } = require('../services/notifications.js')
      showToast('Preferences saved!', 'success')
    } catch (e) {
      // Toast not available
    }
  }
}

// Export default object with all functions
export default {
  NOTIFICATION_TYPES,
  getDefaultPreferences,
  getNotificationPreferences,
  setNotificationPreferences,
  toggleNotificationType,
  isNotificationEnabled,
  resetToDefaults,
  getNotificationTypes,
  getNotificationTypeLabel,
  getNotificationTypeDescription,
  exportPreferences,
  importPreferences,
  validatePreferences,
  migrateOldPreferences,
  renderPreferencesUI,
  setupWindowHandlers
}
