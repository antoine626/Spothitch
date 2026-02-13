/**
 * Device Manager Component
 * Displays and manages connected devices for the user
 * Task #18 from SUIVI.md
 */

import { t } from '../i18n/index.js'
import { icon } from '../utils/icons.js'
import {
  getKnownDevices,
  removeDevice,
  removeAllOtherDevices,
  generateDeviceFingerprint,
} from '../services/newDeviceNotification.js'

// State for device manager modal
window.deviceManagerState = {
  isOpen: false,
  confirmingDeviceId: null,
  confirmingRemoveAll: false,
}

/**
 * Format last seen date
 * @param {string} isoDate - ISO date string
 * @returns {string} Formatted date
 */
function formatLastSeen(isoDate) {
  if (!isoDate) return t('notAvailable')

  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return t('deviceJustNow') || 'A l\'instant'
  if (diffMins < 60) return `${diffMins} ${t('minutes') || 'min'}`
  if (diffHours < 24) return `${diffHours} ${t('hours') || 'h'}`
  if (diffDays < 7) return `${diffDays} ${t('days') || 'j'}`

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get device icon based on type
 * @param {string} type - Device type (mobile, desktop, tablet)
 * @returns {string} Emoji icon
 */
function getDeviceIcon(type) {
  const icons = {
    mobile: '📱',
    desktop: '💻',
    tablet: '📲',
    unknown: '🖥️',
  }
  return icons[type] || icons.unknown
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

/**
 * Render device manager modal
 * @returns {string} HTML for device manager modal
 */
export function renderDeviceManager() {
  const devices = getKnownDevices()
  const currentFingerprint = generateDeviceFingerprint()
  const currentDevice = devices.find(d => d.fingerprint === currentFingerprint)
  const otherDevices = devices.filter(d => d.fingerprint !== currentFingerprint)

  return `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      id="device-manager-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="device-manager-title"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
        onclick="closeDeviceManager()"
      ></div>

      <!-- Modal -->
      <div
        class="relative modal-panel rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden slide-up"
        onclick="event.stopPropagation()"
      >
        <!-- Close Button -->
        <button
          onclick="closeDeviceManager()"
          class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          aria-label="${t('close')}"
          type="button"
        >
          ${icon('times', 'w-5 h-5')}
        </button>

        <!-- Header -->
        <div class="p-6 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
              ${icon('laptop', 'w-6 h-6 text-primary-400')}
            </div>
            <div>
              <h2 id="device-manager-title" class="text-xl font-bold text-white">
                ${t('deviceManagerTitle')}
              </h2>
              <p class="text-slate-400 text-sm">
                ${t('deviceManagerSubtitle')}
              </p>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto max-h-[60vh]" role="list" aria-label="${t('deviceList')}">
          ${currentDevice ? renderCurrentDevice(currentDevice) : ''}

          ${otherDevices.length > 0 ? `
            <div class="mt-6">
              <h3 class="text-sm font-medium text-slate-400 mb-3">${t('otherDevices')}</h3>
              <div class="space-y-3" role="list" aria-label="${t('otherDevices')}">
                ${otherDevices.map(device => renderDeviceItem(device, false)).join('')}
              </div>
            </div>
          ` : renderEmptyState()}

          <!-- Confirmation dialogs -->
          <div id="device-confirm-dialog" aria-live="polite"></div>
        </div>

        <!-- Footer with Remove All button -->
        ${otherDevices.length > 0 ? `
          <div class="p-6 border-t border-white/10">
            <button
              type="button"
              onclick="confirmRemoveAllDevices()"
              class="btn btn-danger w-full"
              id="remove-all-devices-btn"
              aria-label="${t('disconnectAllOtherDevices')}"
            >
              ${icon('sign-out-alt', 'w-5 h-5 mr-2')}
              ${t('disconnectAllOtherDevices')}
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `
}

/**
 * Render current device section
 * @param {Object} device - Device object
 * @returns {string} HTML for current device
 */
function renderCurrentDevice(device) {
  return `
    <div class="mb-4">
      <h3 class="text-sm font-medium text-slate-400 mb-3">${t('currentDevice')}</h3>
      ${renderDeviceItem(device, true)}
    </div>
  `
}

/**
 * Render a single device item
 * @param {Object} device - Device object
 * @param {boolean} isCurrent - Whether this is the current device
 * @returns {string} HTML for device item
 */
function renderDeviceItem(device, isCurrent) {
  const deviceEmoji = getDeviceIcon(device.type)
  const deviceName = escapeHTML(device.name)
  const deviceOS = escapeHTML(device.os)
  const deviceId = escapeHTML(device.fingerprint || device.id)
  const lastSeen = formatLastSeen(device.lastSeen)
  const screenRes = escapeHTML(device.screenResolution || '')

  return `
    <div
      class="device-item flex items-center justify-between p-4 bg-dark-secondary rounded-xl ${isCurrent ? 'border-2 border-primary-500' : 'border border-white/5'}"
      role="listitem"
      data-device-id="${deviceId}"
      aria-label="${deviceName} - ${deviceOS}"
    >
      <div class="flex items-center gap-4">
        <span class="text-3xl" aria-hidden="true">${deviceEmoji}</span>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-medium text-white truncate">${deviceName}</span>
            ${isCurrent ? `
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-500/20 text-primary-400">
                ${t('thisDevice')}
              </span>
            ` : ''}
          </div>
          <div class="text-sm text-slate-400">
            ${deviceOS}${screenRes ? ` - ${screenRes}` : ''}
          </div>
          <div class="text-xs text-slate-500 flex items-center gap-1 mt-1">
            ${icon('clock', 'w-5 h-5')}
            <span>${t('lastConnection')}: ${lastSeen}</span>
          </div>
        </div>
      </div>
      ${!isCurrent ? `
        <button
          type="button"
          onclick="confirmRemoveDevice('${deviceId}')"
          class="shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors text-red-400"
          aria-label="${t('removeDevice')} ${deviceName}"
        >
          ${icon('trash-alt', 'w-5 h-5')}
        </button>
      ` : ''}
    </div>
  `
}

/**
 * Render empty state when no other devices
 * @returns {string} HTML for empty state
 */
function renderEmptyState() {
  return `
    <div class="mt-6 text-center py-8">
      <div class="text-5xl mb-4" aria-hidden="true">🔒</div>
      <h3 class="text-lg font-medium text-white mb-2">${t('noOtherDevices')}</h3>
      <p class="text-slate-400 text-sm">${t('noOtherDevicesDesc')}</p>
    </div>
  `
}

/**
 * Render confirmation dialog for removing a device
 * @param {string} deviceId - Device ID to remove
 * @returns {string} HTML for confirmation dialog
 */
function renderRemoveConfirmation(deviceId) {
  const devices = getKnownDevices()
  const device = devices.find(d => d.fingerprint === deviceId || d.id === deviceId)
  const deviceName = device ? escapeHTML(device.name) : t('unknownDevice')

  return `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4" id="remove-device-confirm">
      <div class="absolute inset-0 bg-black/40" onclick="cancelRemoveDevice()"></div>
      <div class="relative bg-dark-secondary border border-white/10 rounded-2xl p-6 max-w-sm w-full slide-up" onclick="event.stopPropagation()">
        <div class="text-center">
          <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            ${icon('exclamation-triangle', 'w-7 h-7 text-red-400')}
          </div>
          <h3 class="text-lg font-bold text-white mb-2">${t('confirmRemoveDevice')}</h3>
          <p class="text-slate-400 text-sm mb-6">
            ${t('confirmRemoveDeviceDesc').replace('{device}', deviceName)}
          </p>
          <div class="flex gap-3">
            <button
              type="button"
              onclick="cancelRemoveDevice()"
              class="btn btn-ghost flex-1"
            >
              ${t('cancel')}
            </button>
            <button
              type="button"
              onclick="executeRemoveDevice('${deviceId}')"
              class="btn btn-danger flex-1"
            >
              ${t('remove')}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Render confirmation dialog for removing all other devices
 * @returns {string} HTML for confirmation dialog
 */
function renderRemoveAllConfirmation() {
  const devices = getKnownDevices()
  const currentFingerprint = generateDeviceFingerprint()
  const otherDevicesCount = devices.filter(d => d.fingerprint !== currentFingerprint).length

  return `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4" id="remove-all-confirm">
      <div class="absolute inset-0 bg-black/40" onclick="cancelRemoveAllDevices()"></div>
      <div class="relative bg-dark-secondary border border-white/10 rounded-2xl p-6 max-w-sm w-full slide-up" onclick="event.stopPropagation()">
        <div class="text-center">
          <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            ${icon('sign-out-alt', 'w-7 h-7 text-red-400')}
          </div>
          <h3 class="text-lg font-bold text-white mb-2">${t('confirmRemoveAllDevices')}</h3>
          <p class="text-slate-400 text-sm mb-6">
            ${t('confirmRemoveAllDevicesDesc').replace('{count}', otherDevicesCount)}
          </p>
          <div class="flex gap-3">
            <button
              type="button"
              onclick="cancelRemoveAllDevices()"
              class="btn btn-ghost flex-1"
            >
              ${t('cancel')}
            </button>
            <button
              type="button"
              onclick="executeRemoveAllDevices()"
              class="btn btn-danger flex-1"
            >
              ${t('disconnectAll')}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Open device manager modal
 */
window.openDeviceManager = () => {
  window.deviceManagerState.isOpen = true
  window.deviceManagerState.confirmingDeviceId = null
  window.deviceManagerState.confirmingRemoveAll = false

  const modalContainer = document.getElementById('modal-container')
  if (modalContainer) {
    modalContainer.innerHTML = renderDeviceManager()
  } else {
    // Create modal container if it doesn't exist
    const container = document.createElement('div')
    container.id = 'device-manager-container'
    container.innerHTML = renderDeviceManager()
    document.body.appendChild(container)
  }
}

/**
 * Close device manager modal
 */
window.closeDeviceManager = () => {
  window.deviceManagerState.isOpen = false
  window.deviceManagerState.confirmingDeviceId = null
  window.deviceManagerState.confirmingRemoveAll = false

  const modal = document.getElementById('device-manager-modal')
  if (modal) {
    modal.classList.add('fade-out')
    setTimeout(() => {
      modal.remove()
      // Also remove the container if we created it
      const container = document.getElementById('device-manager-container')
      if (container) container.remove()
    }, 300)
  }
}

/**
 * Show confirmation dialog for removing a device
 * @param {string} deviceId - Device ID to remove
 */
window.confirmRemoveDevice = (deviceId) => {
  window.deviceManagerState.confirmingDeviceId = deviceId

  const dialogContainer = document.getElementById('device-confirm-dialog')
  if (dialogContainer) {
    dialogContainer.innerHTML = renderRemoveConfirmation(deviceId)
  }
}

/**
 * Cancel device removal
 */
window.cancelRemoveDevice = () => {
  window.deviceManagerState.confirmingDeviceId = null

  const confirmDialog = document.getElementById('remove-device-confirm')
  if (confirmDialog) {
    confirmDialog.remove()
  }
}

/**
 * Execute device removal
 * @param {string} deviceId - Device ID to remove
 */
window.executeRemoveDevice = async (deviceId) => {
  try {
    const result = removeDevice(deviceId)

    if (result.success) {
      const { showSuccess } = await import('../services/notifications.js')
      showSuccess(t('deviceRemoved'))

      // Refresh the device manager
      window.cancelRemoveDevice()
      refreshDeviceList()
    } else {
      const { showError } = await import('../services/notifications.js')
      showError(result.error || t('deviceRemoveError'))
    }
  } catch (error) {
    console.error('Error removing device:', error)
    const { showError } = await import('../services/notifications.js')
    showError(t('deviceRemoveError'))
  }
}

/**
 * Show confirmation dialog for removing all other devices
 */
window.confirmRemoveAllDevices = () => {
  window.deviceManagerState.confirmingRemoveAll = true

  const dialogContainer = document.getElementById('device-confirm-dialog')
  if (dialogContainer) {
    dialogContainer.innerHTML = renderRemoveAllConfirmation()
  }
}

/**
 * Cancel remove all devices
 */
window.cancelRemoveAllDevices = () => {
  window.deviceManagerState.confirmingRemoveAll = false

  const confirmDialog = document.getElementById('remove-all-confirm')
  if (confirmDialog) {
    confirmDialog.remove()
  }
}

/**
 * Execute removal of all other devices
 */
window.executeRemoveAllDevices = async () => {
  try {
    const result = removeAllOtherDevices()

    if (result.success) {
      const { showSuccess } = await import('../services/notifications.js')
      showSuccess(t('allDevicesRemoved').replace('{count}', result.removedCount))

      // Refresh the device manager
      window.cancelRemoveAllDevices()
      refreshDeviceList()
    } else {
      const { showError } = await import('../services/notifications.js')
      showError(t('deviceRemoveError'))
    }
  } catch (error) {
    console.error('Error removing all devices:', error)
    const { showError } = await import('../services/notifications.js')
    showError(t('deviceRemoveError'))
  }
}

/**
 * Refresh the device list in the modal
 */
function refreshDeviceList() {
  const modal = document.getElementById('device-manager-modal')
  if (modal) {
    // Re-render the entire modal content
    const modalContainer = modal.parentElement
    if (modalContainer) {
      modalContainer.innerHTML = renderDeviceManager()
    }
  }
}

/**
 * Get device manager state
 * @returns {Object} Current state
 */
export function getDeviceManagerState() {
  return { ...window.deviceManagerState }
}

export default {
  renderDeviceManager,
  openDeviceManager: window.openDeviceManager,
  closeDeviceManager: window.closeDeviceManager,
  confirmRemoveDevice: window.confirmRemoveDevice,
  cancelRemoveDevice: window.cancelRemoveDevice,
  executeRemoveDevice: window.executeRemoveDevice,
  confirmRemoveAllDevices: window.confirmRemoveAllDevices,
  cancelRemoveAllDevices: window.cancelRemoveAllDevices,
  executeRemoveAllDevices: window.executeRemoveAllDevices,
  getDeviceManagerState,
}
