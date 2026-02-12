/**
 * Offline Indicator Service
 * Displays connection status with pending actions counter and smooth transitions
 */

import { Storage } from '../utils/storage.js'

// State
let indicatorElement = null
let isInitialized = false
let currentOnlineStatus = true
let connectionChangeCallbacks = []
let updateIntervalId = null

// Constants
const STORAGE_KEY = 'pendingOfflineActions'
const UPDATE_INTERVAL_MS = 5000

/**
 * Initialize the offline indicator
 * Sets up event listeners and creates the UI element
 * @returns {boolean} - Whether initialization was successful
 */
export function initOfflineIndicator() {
  if (isInitialized) {
    console.warn('[OfflineIndicator] Already initialized')
    return true
  }

  // Check initial connection status
  currentOnlineStatus = typeof navigator !== 'undefined' ? navigator.onLine : true

  // Create indicator element
  createIndicatorElement()

  // Set up event listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnlineEvent)
    window.addEventListener('offline', handleOfflineEvent)
  }

  // Start update interval for pending actions counter
  startUpdateInterval()

  // Show offline bar if currently offline
  if (!currentOnlineStatus) {
    showOfflineBar()
  }

  isInitialized = true
  return true
}

/**
 * Destroy the offline indicator
 * Cleans up event listeners and removes the UI element
 */
export function destroyOfflineIndicator() {
  if (!isInitialized) {
    return
  }

  // Remove event listeners
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', handleOnlineEvent)
    window.removeEventListener('offline', handleOfflineEvent)
  }

  // Clear update interval
  stopUpdateInterval()

  // Remove indicator element
  if (indicatorElement && indicatorElement.parentNode) {
    indicatorElement.parentNode.removeChild(indicatorElement)
  }
  indicatorElement = null

  // Clear callbacks
  connectionChangeCallbacks = []

  isInitialized = false
}

/**
 * Check if currently online
 * @returns {boolean} - True if online, false if offline
 */
export function isOnline() {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine
  }
  return currentOnlineStatus
}

/**
 * Check if currently offline
 * @returns {boolean} - True if offline, false if online
 */
export function isOffline() {
  return !isOnline()
}

/**
 * Register a callback for connection status changes
 * @param {Function} callback - Function to call when connection changes (receives isOnline boolean)
 * @returns {Function} - Unsubscribe function
 */
export function onConnectionChange(callback) {
  if (typeof callback !== 'function') {
    console.warn('[OfflineIndicator] onConnectionChange requires a function')
    return () => {}
  }

  connectionChangeCallbacks.push(callback)

  // Return unsubscribe function
  return () => {
    const index = connectionChangeCallbacks.indexOf(callback)
    if (index > -1) {
      connectionChangeCallbacks.splice(index, 1)
    }
  }
}

/**
 * Render the offline bar HTML
 * @param {number} pendingCount - Number of pending actions
 * @returns {string} - HTML string for the offline bar
 */
export function renderOfflineBar(pendingCount = 0) {
  const pendingText = pendingCount > 0
    ? `<span class="offline-pending-count">${pendingCount} action${pendingCount > 1 ? 's' : ''} en attente</span>`
    : ''

  return `
    <div class="offline-bar" role="alert" aria-live="assertive" data-testid="offline-bar">
      <div class="offline-bar-content">
        <span class="offline-bar-icon" aria-hidden="true">📡</span>
        <span class="offline-bar-message">Mode hors-ligne</span>
        ${pendingText}
      </div>
      <button
        class="offline-bar-retry"
        onclick="window.retryConnection && window.retryConnection()"
        aria-label="Retenter la connexion"
      >
        <span aria-hidden="true">🔄</span> Retenter
      </button>
    </div>
  `
}

/**
 * Render the online bar HTML (briefly shown when reconnected)
 * @returns {string} - HTML string for the online bar
 */
export function renderOnlineBar() {
  return `
    <div class="online-bar" role="status" aria-live="polite" data-testid="online-bar">
      <div class="online-bar-content">
        <span class="online-bar-icon" aria-hidden="true">✅</span>
        <span class="online-bar-message">Connexion retablie</span>
      </div>
    </div>
  `
}

/**
 * Get the number of pending offline actions
 * @returns {number} - Number of pending actions
 */
export function getPendingActionsCount() {
  const pending = Storage.get(STORAGE_KEY)
  if (Array.isArray(pending)) {
    return pending.length
  }

  // Also check the legacy pendingActions key from offline.js
  const legacyPending = Storage.get('pendingActions')
  if (Array.isArray(legacyPending)) {
    return legacyPending.length
  }

  return 0
}

/**
 * Add a pending action to the queue
 * @param {Object} action - Action object with type and data
 * @returns {number} - New count of pending actions
 */
export function addPendingAction(action) {
  if (!action || typeof action !== 'object') {
    console.warn('[OfflineIndicator] Invalid action object')
    return getPendingActionsCount()
  }

  const pending = Storage.get(STORAGE_KEY) || []
  pending.push({
    ...action,
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    timestamp: Date.now()
  })
  Storage.set(STORAGE_KEY, pending)

  // Update UI
  updateIndicator()

  return pending.length
}

/**
 * Clear all pending actions
 * @returns {boolean} - Whether clearing was successful
 */
export function clearPendingActions() {
  const result = Storage.set(STORAGE_KEY, [])
  updateIndicator()
  return result
}

/**
 * Get all pending actions
 * @returns {Array} - Array of pending action objects
 */
export function getPendingActions() {
  return Storage.get(STORAGE_KEY) || []
}

/**
 * Manually trigger connection retry
 * @returns {Promise<boolean>} - Whether connection was restored
 */
export async function retryConnection() {
  // First, check actual connection status
  try {
    const response = await fetch('/ping', { method: 'HEAD', cache: 'no-store' })
    if (response.ok) {
      handleOnlineEvent()
      return true
    }
  } catch {
    // Could not connect
  }

  // Fallback to navigator.onLine
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    handleOnlineEvent()
    return true
  }

  return false
}

/**
 * Get the current status object
 * @returns {Object} - Status object with isOnline, pendingCount, isInitialized
 */
export function getStatus() {
  return {
    isOnline: isOnline(),
    pendingCount: getPendingActionsCount(),
    isInitialized
  }
}

/**
 * Force update the indicator UI
 */
export function updateIndicator() {
  if (!indicatorElement) {
    return
  }

  const online = isOnline()
  const pendingCount = getPendingActionsCount()

  if (online) {
    indicatorElement.innerHTML = ''
    indicatorElement.classList.remove('offline-indicator-visible')
    indicatorElement.classList.add('offline-indicator-hidden')
  } else {
    indicatorElement.innerHTML = renderOfflineBar(pendingCount)
    indicatorElement.classList.remove('offline-indicator-hidden')
    indicatorElement.classList.add('offline-indicator-visible')
  }
}

// Private functions

/**
 * Create the indicator DOM element
 */
function createIndicatorElement() {
  if (typeof document === 'undefined') {
    return
  }

  // Check if element already exists
  const existing = document.getElementById('offline-indicator-container')
  if (existing) {
    indicatorElement = existing
    return
  }

  indicatorElement = document.createElement('div')
  indicatorElement.id = 'offline-indicator-container'
  indicatorElement.className = 'offline-indicator-container offline-indicator-hidden'
  indicatorElement.setAttribute('role', 'region')
  indicatorElement.setAttribute('aria-label', 'Indicateur de connexion')

  // Insert at the top of body
  if (document.body) {
    document.body.insertBefore(indicatorElement, document.body.firstChild)
  }
}

/**
 * Handle going online
 */
function handleOnlineEvent() {
  if (currentOnlineStatus) {
    return // Already online
  }

  currentOnlineStatus = true

  // Show reconnected message briefly
  showOnlineBar()

  // Notify callbacks
  notifyCallbacks(true)

  // Announce to screen readers
  announceToScreenReader('Connexion retablie')

}

/**
 * Handle going offline
 */
function handleOfflineEvent() {
  if (!currentOnlineStatus) {
    return // Already offline
  }

  currentOnlineStatus = false

  // Show offline bar
  showOfflineBar()

  // Notify callbacks
  notifyCallbacks(false)

  // Announce to screen readers
  announceToScreenReader('Mode hors-ligne active')

}

/**
 * Show the offline bar
 */
function showOfflineBar() {
  if (!indicatorElement) {
    return
  }

  const pendingCount = getPendingActionsCount()
  indicatorElement.innerHTML = renderOfflineBar(pendingCount)
  indicatorElement.classList.remove('offline-indicator-hidden')
  indicatorElement.classList.add('offline-indicator-visible')

  // Add body padding to prevent content being hidden
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.paddingTop = '48px'
  }
}

/**
 * Show the online bar briefly then hide
 */
function showOnlineBar() {
  if (!indicatorElement) {
    return
  }

  indicatorElement.innerHTML = renderOnlineBar()
  indicatorElement.classList.remove('offline-indicator-hidden')
  indicatorElement.classList.add('offline-indicator-visible', 'online-bar-visible')

  // Hide after 3 seconds
  setTimeout(() => {
    if (indicatorElement && currentOnlineStatus) {
      indicatorElement.innerHTML = ''
      indicatorElement.classList.remove('offline-indicator-visible', 'online-bar-visible')
      indicatorElement.classList.add('offline-indicator-hidden')

      // Remove body padding
      if (typeof document !== 'undefined' && document.body) {
        document.body.style.paddingTop = '0'
      }
    }
  }, 3000)
}

/**
 * Notify all registered callbacks
 * @param {boolean} online - Whether connection is online
 */
function notifyCallbacks(online) {
  for (const callback of connectionChangeCallbacks) {
    try {
      callback(online)
    } catch (error) {
      console.error('[OfflineIndicator] Callback error:', error)
    }
  }
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 */
function announceToScreenReader(message) {
  if (typeof document === 'undefined') {
    return
  }

  // Look for existing aria-live region
  let region = document.getElementById('aria-live-assertive')

  if (!region) {
    // Create one if it doesn't exist
    region = document.createElement('div')
    region.id = 'aria-live-assertive'
    region.setAttribute('role', 'status')
    region.setAttribute('aria-live', 'assertive')
    region.setAttribute('aria-atomic', 'true')
    region.className = 'sr-only'
    document.body.appendChild(region)
  }

  // Clear and set message with delay for screen reader to pick up
  region.textContent = ''
  setTimeout(() => {
    region.textContent = message
  }, 100)
}

/**
 * Start the update interval for pending count
 */
function startUpdateInterval() {
  if (updateIntervalId) {
    return
  }

  updateIntervalId = setInterval(() => {
    if (!currentOnlineStatus && indicatorElement) {
      updateIndicator()
    }
  }, UPDATE_INTERVAL_MS)
}

/**
 * Stop the update interval
 */
function stopUpdateInterval() {
  if (updateIntervalId) {
    clearInterval(updateIntervalId)
    updateIntervalId = null
  }
}

// Global handlers for onclick
if (typeof window !== 'undefined') {
  window.retryConnection = retryConnection
}

export default {
  initOfflineIndicator,
  destroyOfflineIndicator,
  isOnline,
  isOffline,
  onConnectionChange,
  renderOfflineBar,
  renderOnlineBar,
  getPendingActionsCount,
  addPendingAction,
  clearPendingActions,
  getPendingActions,
  retryConnection,
  getStatus,
  updateIndicator
}
