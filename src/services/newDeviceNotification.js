/**
 * New Device Notification Service
 * Detects new device logins and notifies users
 * Task #17 from SUIVI.md
 */

import { showToast, sendLocalNotification } from './notifications.js'
import { t } from '../i18n/index.js'

// Storage key for known devices
const KNOWN_DEVICES_KEY = 'spothitch_known_devices'

// Maximum number of devices to store
const MAX_DEVICES = 10

/**
 * Generate a device fingerprint based on browser and device characteristics
 * Uses a combination of userAgent, screen dimensions, and timezone
 * @returns {string} Device fingerprint hash
 */
export function generateDeviceFingerprint() {
  const components = []

  // User agent
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    components.push(navigator.userAgent)
  }

  // Screen dimensions
  if (typeof screen !== 'undefined') {
    components.push(`${screen.width}x${screen.height}`)
    components.push(`${screen.colorDepth}`)
    if (screen.pixelRatio) {
      components.push(`${screen.pixelRatio}`)
    }
  }

  // Timezone
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      components.push(timezone)
    } catch {
      // Timezone not available
    }
  }

  // Language
  if (typeof navigator !== 'undefined' && navigator.language) {
    components.push(navigator.language)
  }

  // Platform
  if (typeof navigator !== 'undefined' && navigator.platform) {
    components.push(navigator.platform)
  }

  // Create a simple hash from the components
  const fingerprintString = components.join('|')
  return simpleHash(fingerprintString)
}

/**
 * Simple hash function for fingerprint
 * @param {string} str - String to hash
 * @returns {string} Hashed string
 */
function simpleHash(str) {
  let hash = 0
  if (str.length === 0) return hash.toString(36)

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  // Convert to base36 for shorter representation and ensure positive
  return Math.abs(hash).toString(36)
}

/**
 * Get device info object with metadata
 * @returns {Object} Device info with fingerprint and metadata
 */
export function getDeviceInfo() {
  const fingerprint = generateDeviceFingerprint()

  // Parse user agent for friendly device name
  let deviceName = 'Appareil inconnu'
  let deviceType = 'unknown'

  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    const ua = navigator.userAgent

    // Detect device type
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
      deviceType = 'mobile'
      if (/iPhone/i.test(ua)) {
        deviceName = 'iPhone'
      } else if (/iPad/i.test(ua)) {
        deviceName = 'iPad'
      } else if (/Android/i.test(ua)) {
        deviceName = 'Android'
      } else {
        deviceName = 'Mobile'
      }
    } else if (/Tablet/i.test(ua)) {
      deviceType = 'tablet'
      deviceName = 'Tablette'
    } else {
      deviceType = 'desktop'
      // Detect browser
      if (/Chrome/i.test(ua)) {
        deviceName = 'Chrome'
      } else if (/Firefox/i.test(ua)) {
        deviceName = 'Firefox'
      } else if (/Safari/i.test(ua)) {
        deviceName = 'Safari'
      } else if (/Edge/i.test(ua)) {
        deviceName = 'Edge'
      } else {
        deviceName = 'Navigateur'
      }
    }
  }

  // Add OS info
  let os = 'Unknown'
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    const ua = navigator.userAgent
    if (/Windows/i.test(ua)) os = 'Windows'
    else if (/Mac/i.test(ua)) os = 'macOS'
    else if (/Linux/i.test(ua)) os = 'Linux'
    else if (/Android/i.test(ua)) os = 'Android'
    else if (/iOS|iPhone|iPad|iPod/i.test(ua)) os = 'iOS'
  }

  return {
    id: fingerprint,
    fingerprint,
    name: deviceName,
    type: deviceType,
    os,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    screenResolution: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '',
    timezone: getTimezone(),
    language: typeof navigator !== 'undefined' ? navigator.language : '',
    lastSeen: new Date().toISOString(),
    registeredAt: null,
    isCurrent: true,
  }
}

/**
 * Get current timezone
 * @returns {string} Timezone string
 */
function getTimezone() {
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      return 'Unknown'
    }
  }
  return 'Unknown'
}

/**
 * Load known devices from localStorage
 * @returns {Array} Array of known device objects
 */
function loadKnownDevices() {
  try {
    const stored = localStorage.getItem(KNOWN_DEVICES_KEY)
    if (stored) {
      const devices = JSON.parse(stored)
      return Array.isArray(devices) ? devices : []
    }
  } catch (e) {
    console.warn('Failed to load known devices:', e)
  }
  return []
}

/**
 * Save known devices to localStorage
 * @param {Array} devices - Array of device objects
 */
function saveKnownDevices(devices) {
  try {
    // Limit to MAX_DEVICES, keeping most recent
    const limitedDevices = devices
      .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
      .slice(0, MAX_DEVICES)

    localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(limitedDevices))
    return true
  } catch (e) {
    console.warn('Failed to save known devices:', e)
    return false
  }
}

/**
 * Check if current device is a new/unknown device
 * @returns {Object} Result with isNew boolean and device info
 */
export function checkNewDevice() {
  const currentDevice = getDeviceInfo()
  const knownDevices = loadKnownDevices()

  const isKnown = knownDevices.some(
    device => device.fingerprint === currentDevice.fingerprint
  )

  return {
    isNew: !isKnown,
    device: currentDevice,
    knownDevicesCount: knownDevices.length,
  }
}

/**
 * Register the current device as known
 * Called after successful login
 * @param {Object} options - Optional registration options
 * @param {string} options.customName - Custom name for the device
 * @param {boolean} options.silent - Don't show notifications
 * @returns {Object} Registration result with device info
 */
export function registerDevice(options = {}) {
  const { customName, silent = false } = options
  const currentDevice = getDeviceInfo()
  const knownDevices = loadKnownDevices()

  // Check if device is already registered
  const existingIndex = knownDevices.findIndex(
    device => device.fingerprint === currentDevice.fingerprint
  )

  const now = new Date().toISOString()
  let isNewDevice = false
  let updatedDevice

  if (existingIndex >= 0) {
    // Update existing device
    updatedDevice = {
      ...knownDevices[existingIndex],
      lastSeen: now,
      name: customName || knownDevices[existingIndex].name,
      isCurrent: true,
    }
    knownDevices[existingIndex] = updatedDevice
  } else {
    // Register new device
    isNewDevice = true
    updatedDevice = {
      ...currentDevice,
      name: customName || currentDevice.name,
      registeredAt: now,
      lastSeen: now,
      isCurrent: true,
    }
    knownDevices.push(updatedDevice)

    // Notify about new device if not silent
    if (!silent && knownDevices.length > 1) {
      notifyNewDeviceLogin(updatedDevice)
    }
  }

  // Mark all other devices as not current
  knownDevices.forEach(device => {
    if (device.fingerprint !== currentDevice.fingerprint) {
      device.isCurrent = false
    }
  })

  saveKnownDevices(knownDevices)

  return {
    success: true,
    isNew: isNewDevice,
    device: updatedDevice,
    totalDevices: knownDevices.length,
  }
}

/**
 * Get all known devices
 * @returns {Array} Array of known device objects
 */
export function getKnownDevices() {
  const devices = loadKnownDevices()
  const currentFingerprint = generateDeviceFingerprint()

  // Mark current device
  return devices.map(device => ({
    ...device,
    isCurrent: device.fingerprint === currentFingerprint,
  }))
}

/**
 * Remove a device from known devices list
 * @param {string} deviceId - Device fingerprint/id to remove
 * @returns {Object} Result with success status
 */
export function removeDevice(deviceId) {
  if (!deviceId) {
    return {
      success: false,
      error: 'Device ID is required',
    }
  }

  const knownDevices = loadKnownDevices()
  const currentFingerprint = generateDeviceFingerprint()

  // Don't allow removing current device
  if (deviceId === currentFingerprint) {
    return {
      success: false,
      error: 'Cannot remove current device',
    }
  }

  const initialCount = knownDevices.length
  const filteredDevices = knownDevices.filter(
    device => device.fingerprint !== deviceId && device.id !== deviceId
  )

  if (filteredDevices.length === initialCount) {
    return {
      success: false,
      error: 'Device not found',
    }
  }

  saveKnownDevices(filteredDevices)

  return {
    success: true,
    removedDeviceId: deviceId,
    remainingDevices: filteredDevices.length,
  }
}

/**
 * Remove all devices except current
 * @returns {Object} Result with count of removed devices
 */
export function removeAllOtherDevices() {
  const currentFingerprint = generateDeviceFingerprint()
  const knownDevices = loadKnownDevices()

  const currentDevice = knownDevices.find(
    device => device.fingerprint === currentFingerprint
  )

  const newDevices = currentDevice ? [currentDevice] : []
  const removedCount = knownDevices.length - newDevices.length

  saveKnownDevices(newDevices)

  return {
    success: true,
    removedCount,
    remainingDevices: newDevices.length,
  }
}

/**
 * Update device name
 * @param {string} deviceId - Device fingerprint/id
 * @param {string} newName - New name for the device
 * @returns {Object} Result with success status
 */
export function updateDeviceName(deviceId, newName) {
  if (!deviceId || !newName) {
    return {
      success: false,
      error: 'Device ID and name are required',
    }
  }

  const knownDevices = loadKnownDevices()
  const deviceIndex = knownDevices.findIndex(
    device => device.fingerprint === deviceId || device.id === deviceId
  )

  if (deviceIndex < 0) {
    return {
      success: false,
      error: 'Device not found',
    }
  }

  knownDevices[deviceIndex].name = newName
  saveKnownDevices(knownDevices)

  return {
    success: true,
    device: knownDevices[deviceIndex],
  }
}

/**
 * Send notification about new device login
 * @param {Object} device - Device info object
 */
export function notifyNewDeviceLogin(device) {
  const title = t('newDeviceLoginDetected') || 'New login detected'
  const body = `${t('loginFromNewDevice') || 'Login from new device'}: ${device.name} (${device.os})`

  // Show toast notification
  showToast(`${t('newDeviceConnected') || 'New device connected'}: ${device.name}`, 'warning', 6000)

  // Send local notification if available
  sendLocalNotification(title, body, {
    type: 'new_device_login',
    deviceId: device.fingerprint,
    url: '/?tab=profile&security=devices',
  })
}

/**
 * Get device by ID
 * @param {string} deviceId - Device fingerprint/id
 * @returns {Object|null} Device object or null if not found
 */
export function getDeviceById(deviceId) {
  if (!deviceId) return null

  const knownDevices = loadKnownDevices()
  return knownDevices.find(
    device => device.fingerprint === deviceId || device.id === deviceId
  ) || null
}

/**
 * Check if a specific device is known
 * @param {string} deviceId - Device fingerprint/id
 * @returns {boolean} True if device is known
 */
export function isDeviceKnown(deviceId) {
  return getDeviceById(deviceId) !== null
}

/**
 * Get the current device info with isCurrent flag
 * @returns {Object} Current device info
 */
export function getCurrentDevice() {
  const currentFingerprint = generateDeviceFingerprint()
  const knownDevices = loadKnownDevices()

  const registeredDevice = knownDevices.find(
    device => device.fingerprint === currentFingerprint
  )

  if (registeredDevice) {
    return { ...registeredDevice, isCurrent: true }
  }

  // Return device info even if not registered yet
  return { ...getDeviceInfo(), isCurrent: true, isRegistered: false }
}

/**
 * Clear all known devices (for logout/reset)
 * @returns {Object} Result with success status
 */
export function clearAllDevices() {
  try {
    localStorage.removeItem(KNOWN_DEVICES_KEY)
    return { success: true }
  } catch (e) {
    console.warn('Failed to clear devices:', e)
    return { success: false, error: e.message }
  }
}

/**
 * Get device statistics
 * @returns {Object} Statistics about known devices
 */
export function getDeviceStats() {
  const devices = loadKnownDevices()
  const currentFingerprint = generateDeviceFingerprint()

  const stats = {
    total: devices.length,
    mobile: 0,
    desktop: 0,
    tablet: 0,
    unknown: 0,
    currentDeviceRegistered: false,
    oldestDevice: null,
    newestDevice: null,
  }

  devices.forEach(device => {
    // Count by type
    switch (device.type) {
      case 'mobile':
        stats.mobile++
        break
      case 'desktop':
        stats.desktop++
        break
      case 'tablet':
        stats.tablet++
        break
      default:
        stats.unknown++
    }

    // Check if current device is registered
    if (device.fingerprint === currentFingerprint) {
      stats.currentDeviceRegistered = true
    }

    // Track oldest and newest
    if (!stats.oldestDevice || new Date(device.registeredAt) < new Date(stats.oldestDevice.registeredAt)) {
      stats.oldestDevice = device
    }
    if (!stats.newestDevice || new Date(device.registeredAt) > new Date(stats.newestDevice.registeredAt)) {
      stats.newestDevice = device
    }
  })

  return stats
}

/**
 * Render device list HTML for UI
 * @returns {string} HTML string of device list
 */
export function renderDeviceList() {
  const devices = getKnownDevices()
  const currentFingerprint = generateDeviceFingerprint()

  if (devices.length === 0) {
    return `
      <div class="text-center text-slate-400 py-8">
        <p>Aucun appareil enregistre</p>
      </div>
    `
  }

  const deviceIcons = {
    mobile: '📱',
    desktop: '💻',
    tablet: '📲',
    unknown: '🖥️',
  }

  return `
    <div class="space-y-3">
      ${devices.map(device => {
        const isCurrent = device.fingerprint === currentFingerprint
        const icon = deviceIcons[device.type] || deviceIcons.unknown
        const lastSeenDate = new Date(device.lastSeen).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })

        return `
          <div class="device-item flex items-center justify-between p-3 bg-dark-secondary rounded-xl ${isCurrent ? 'border border-primary-500' : ''}">
            <div class="flex items-center gap-3">
              <span class="text-2xl">${icon}</span>
              <div>
                <div class="font-medium text-white">
                  ${device.name}
                  ${isCurrent ? '<span class="text-xs text-primary-400 ml-2">(Cet appareil)</span>' : ''}
                </div>
                <div class="text-sm text-slate-400">
                  ${device.os} - ${device.screenResolution}
                </div>
                <div class="text-xs text-slate-400">
                  Derniere connexion: ${lastSeenDate}
                </div>
              </div>
            </div>
            ${!isCurrent ? `
              <button
                onclick="window.removeKnownDevice('${device.fingerprint}')"
                class="text-red-400 hover:text-red-300 p-2"
                aria-label="Supprimer cet appareil"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            ` : ''}
          </div>
        `
      }).join('')}
    </div>
  `
}

// Window handler for device removal from UI
window.removeKnownDevice = (fingerprint) => {
  const result = removeDevice(fingerprint)
  if (result.success) {
    showToast(t('deviceRemoved') || 'Device removed', 'success')
    // Re-render the device list if visible
    const container = document.getElementById('known-devices-list')
    if (container) {
      container.innerHTML = renderDeviceList()
    }
  } else {
    showToast(result.error || t('deviceRemoveFailed') || 'Could not remove device', 'error')
  }
}

// Export all functions as default object
export default {
  generateDeviceFingerprint,
  getDeviceInfo,
  checkNewDevice,
  registerDevice,
  getKnownDevices,
  removeDevice,
  removeAllOtherDevices,
  updateDeviceName,
  notifyNewDeviceLogin,
  getDeviceById,
  isDeviceKnown,
  getCurrentDevice,
  clearAllDevices,
  getDeviceStats,
  renderDeviceList,
}
