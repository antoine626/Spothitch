/**
 * Offline Queue Service
 * Manages pending actions when offline with priority and retry logic
 *
 * Features:
 * - Queue actions when offline
 * - Persist queue to IndexedDB
 * - Auto-sync when back online (Background Sync API)
 * - Retry with exponential backoff
 * - Priority-based execution
 */

import { Storage, SpotHitchDB } from '../utils/storage.js'
import { showToast, showInfo } from './notifications.js'

// Queue state
let queue = []
let isProcessing = false
let retryTimeouts = new Map()

// Action types with priorities (lower = higher priority)
const ACTION_PRIORITIES = {
  SOS_ALERT: 0,        // Emergency - highest priority
  CHECKIN: 1,          // User validation
  ADD_SPOT: 2,         // New spot creation
  ADD_RATING: 3,       // Rating submission
  ADD_COMMENT: 4,      // Comment submission
  SEND_MESSAGE: 5,     // Chat message
  UPDATE_PROFILE: 6,   // Profile update
  FAVORITE: 7,         // Add/remove favorite
  REPORT: 8,           // Report spot
}

// Maximum retry attempts per action
const MAX_RETRIES = 5

// Exponential backoff base (ms)
const BACKOFF_BASE = 1000

/**
 * Initialize offline queue
 */
export async function initOfflineQueue() {
  // Load queue from storage
  await loadQueue()

  // Listen for online/offline events
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Register for Background Sync if supported
  registerBackgroundSync()

  console.log('📋 Offline queue initialized with', queue.length, 'pending actions')
}

/**
 * Load queue from IndexedDB
 */
async function loadQueue() {
  try {
    const pending = await SpotHitchDB.getPendingSync()
    queue = pending.map(item => ({
      ...item,
      priority: ACTION_PRIORITIES[item.type] ?? 10,
    }))
    // Sort by priority
    queue.sort((a, b) => a.priority - b.priority)
  } catch (e) {
    console.warn('Failed to load offline queue:', e)
    // Fallback to localStorage
    const stored = Storage.get('offlineQueue')
    if (stored && Array.isArray(stored)) {
      queue = stored
    }
  }
}

/**
 * Save queue to storage
 */
async function saveQueue() {
  try {
    // Clear and re-add all items
    await SpotHitchDB.clearPendingSync()
    for (const item of queue) {
      await SpotHitchDB.addPendingSync(item)
    }
  } catch (e) {
    console.warn('Failed to save to IndexedDB, using localStorage:', e)
    Storage.set('offlineQueue', queue)
  }
}

/**
 * Add action to queue
 * @param {string} type - Action type (ADD_SPOT, CHECKIN, etc.)
 * @param {object} data - Action data
 * @param {object} options - Additional options
 * @returns {string} Action ID
 */
export function queueAction(type, data, options = {}) {
  const action = {
    id: `action_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type,
    data,
    priority: ACTION_PRIORITIES[type] ?? 10,
    retries: 0,
    createdAt: Date.now(),
    ...options,
  }

  queue.push(action)
  queue.sort((a, b) => a.priority - b.priority)

  saveQueue()

  // Update UI indicator
  updateQueueIndicator()

  // Show feedback to user
  if (!navigator.onLine) {
    showInfo(`Action en attente (${getQueueCount()} dans la file)`)
  }

  console.log('📋 Queued action:', type, action.id)

  return action.id
}

/**
 * Remove action from queue
 * @param {string} actionId - Action ID to remove
 */
export function removeFromQueue(actionId) {
  queue = queue.filter(a => a.id !== actionId)
  saveQueue()
  updateQueueIndicator()
}

/**
 * Get queue count
 * @returns {number}
 */
export function getQueueCount() {
  return queue.length
}

/**
 * Get pending actions by type
 * @param {string} type - Action type
 * @returns {Array}
 */
export function getQueuedActionsByType(type) {
  return queue.filter(a => a.type === type)
}

/**
 * Get all queued actions
 * @returns {Array}
 */
export function getQueuedActions() {
  return [...queue]
}

/**
 * Handle coming back online
 */
async function handleOnline() {
  console.log('📶 Back online - processing queue...')

  // Request background sync if supported
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register('sync-offline-queue')
    } catch (e) {
      // Fall back to immediate processing
      processQueue()
    }
  } else {
    processQueue()
  }
}

/**
 * Handle going offline
 */
function handleOffline() {
  console.log('📴 Went offline - pausing queue processing')
  isProcessing = false

  // Clear any pending retry timeouts
  retryTimeouts.forEach(timeout => clearTimeout(timeout))
  retryTimeouts.clear()
}

/**
 * Process the offline queue
 */
export async function processQueue() {
  if (isProcessing || queue.length === 0 || !navigator.onLine) {
    return
  }

  isProcessing = true
  console.log('🔄 Processing', queue.length, 'queued actions...')

  const successCount = { count: 0 }
  const failedActions = []

  for (const action of [...queue]) {
    if (!navigator.onLine) {
      console.log('📴 Lost connection during processing')
      break
    }

    try {
      await processAction(action)
      removeFromQueue(action.id)
      successCount.count++
      console.log('✅ Processed:', action.type, action.id)
    } catch (error) {
      console.error('❌ Failed to process:', action.type, error)

      // Increment retry count
      action.retries = (action.retries || 0) + 1

      if (action.retries >= MAX_RETRIES) {
        // Max retries reached - remove and notify
        removeFromQueue(action.id)
        failedActions.push(action)
      } else {
        // Schedule retry with exponential backoff
        const delay = BACKOFF_BASE * Math.pow(2, action.retries)
        scheduleRetry(action, delay)
      }
    }
  }

  isProcessing = false

  // Show summary toast
  if (successCount.count > 0) {
    showToast(`${successCount.count} action(s) synchronisee(s)`, 'success')
  }

  if (failedActions.length > 0) {
    showToast(`${failedActions.length} action(s) echouee(s)`, 'error')
  }

  updateQueueIndicator()
}

/**
 * Process a single action
 * @param {object} action - Action to process
 */
async function processAction(action) {
  const { type, data } = action

  // Dynamic import to avoid circular dependencies
  const firebase = await import('./firebase.js')

  switch (type) {
    case 'ADD_SPOT':
      await firebase.saveSpotToFirebase(data)
      break

    case 'CHECKIN':
      await firebase.saveValidationToFirebase(data.spotId, data.userId, data.details)
      break

    case 'ADD_RATING':
      await firebase.saveRatingToFirebase(data.spotId, data.rating, data.userId)
      break

    case 'ADD_COMMENT':
      await firebase.saveCommentToFirebase(data)
      break

    case 'SEND_MESSAGE':
      await firebase.sendChatMessage(data.room, data.text)
      break

    case 'UPDATE_PROFILE':
      await firebase.updateUserProfile(data)
      break

    case 'FAVORITE':
      if (data.action === 'add') {
        await firebase.addFavorite(data.spotId)
      } else {
        await firebase.removeFavorite(data.spotId)
      }
      break

    case 'REPORT':
      await firebase.reportSpot(data.spotId, data.reason)
      break

    case 'SOS_ALERT':
      await firebase.sendSOSAlert(data)
      break

    default:
      console.warn('Unknown action type:', type)
      throw new Error(`Unknown action type: ${type}`)
  }
}

/**
 * Schedule a retry for failed action
 * @param {object} action - Action to retry
 * @param {number} delay - Delay in ms
 */
function scheduleRetry(action, delay) {
  // Clear existing timeout if any
  if (retryTimeouts.has(action.id)) {
    clearTimeout(retryTimeouts.get(action.id))
  }

  const timeout = setTimeout(() => {
    retryTimeouts.delete(action.id)
    if (navigator.onLine) {
      processQueue()
    }
  }, delay)

  retryTimeouts.set(action.id, timeout)
  console.log(`⏰ Retry scheduled for ${action.type} in ${delay}ms`)
}

/**
 * Register for Background Sync
 */
async function registerBackgroundSync() {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.log('Background Sync not supported')
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready

    // Register periodic sync if available
    if ('periodicSync' in registration) {
      try {
        await registration.periodicSync.register('sync-offline-queue-periodic', {
          minInterval: 60 * 60 * 1000, // 1 hour
        })
        console.log('✅ Periodic Background Sync registered')
      } catch (e) {
        console.log('Periodic sync not available:', e)
      }
    }
  } catch (e) {
    console.warn('Failed to register background sync:', e)
  }
}

/**
 * Update queue indicator in UI
 */
function updateQueueIndicator() {
  const count = queue.length

  // Update any queue indicators in the UI
  const indicators = document.querySelectorAll('[data-queue-count]')
  indicators.forEach(el => {
    el.textContent = count
    el.classList.toggle('hidden', count === 0)
  })

  // Dispatch custom event for components
  window.dispatchEvent(new CustomEvent('offlineQueueUpdate', {
    detail: { count, queue: getQueuedActions() }
  }))
}

/**
 * Render queue status widget
 * @returns {string} HTML string
 */
export function renderQueueStatus() {
  const count = queue.length

  if (count === 0) {
    return ''
  }

  const actionTypes = {}
  queue.forEach(a => {
    actionTypes[a.type] = (actionTypes[a.type] || 0) + 1
  })

  return `
    <div class="offline-queue-status bg-yellow-900/50 border border-yellow-700 rounded-lg p-3 mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-yellow-500 text-lg">📋</span>
        <span class="text-yellow-200 font-medium">${count} action(s) en attente</span>
      </div>
      <div class="text-sm text-yellow-300/70">
        ${Object.entries(actionTypes)
          .map(([type, c]) => `${c} ${getActionLabel(type)}`)
          .join(' | ')}
      </div>
      ${navigator.onLine ? `
        <button
          onclick="window.forceProcessQueue()"
          class="mt-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded-lg transition-colors"
        >
          Synchroniser maintenant
        </button>
      ` : `
        <div class="mt-2 text-xs text-yellow-400/60">
          Synchronisation automatique au retour en ligne
        </div>
      `}
    </div>
  `
}

/**
 * Get human-readable action label
 * @param {string} type - Action type
 * @returns {string}
 */
function getActionLabel(type) {
  const labels = {
    SOS_ALERT: 'alerte SOS',
    CHECKIN: 'check-in',
    ADD_SPOT: 'spot',
    ADD_RATING: 'note',
    ADD_COMMENT: 'commentaire',
    SEND_MESSAGE: 'message',
    UPDATE_PROFILE: 'profil',
    FAVORITE: 'favori',
    REPORT: 'signalement',
  }
  return labels[type] || type.toLowerCase()
}

/**
 * Force process queue (for manual sync button)
 */
export function forceProcessQueue() {
  if (!navigator.onLine) {
    showToast('Impossible de synchroniser hors ligne', 'warning')
    return
  }
  processQueue()
}

// Expose for global access
window.forceProcessQueue = forceProcessQueue

export default {
  initOfflineQueue,
  queueAction,
  removeFromQueue,
  getQueueCount,
  getQueuedActions,
  getQueuedActionsByType,
  processQueue,
  forceProcessQueue,
  renderQueueStatus,
}
