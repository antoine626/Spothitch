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
 *
 * Supported actions: create_spot, checkin, review, message, favorite
 */

import { Storage, SpotHitchDB } from '../utils/storage.js'
import { showToast, showInfo } from './notifications.js'

// Queue state
let queue = []
let isProcessing = false
let retryTimeouts = new Map()
let isInitialized = false
let onlineListenerAdded = false

// Action types with priorities (lower = higher priority)
// Supports both legacy (uppercase) and new (lowercase) action names
const ACTION_PRIORITIES = {
  // Legacy uppercase action types
  SOS_ALERT: 0,        // Emergency - highest priority
  CHECKIN: 1,          // User validation
  ADD_SPOT: 2,         // New spot creation
  ADD_RATING: 3,       // Rating submission
  ADD_COMMENT: 4,      // Comment submission
  SEND_MESSAGE: 5,     // Chat message
  UPDATE_PROFILE: 6,   // Profile update
  FAVORITE: 7,         // Add/remove favorite
  REPORT: 8,           // Report spot
  // New lowercase action types (task requirements)
  create_spot: 2,      // New spot creation
  checkin: 1,          // User validation / check-in
  review: 3,           // Review submission
  message: 5,          // Chat message
  favorite: 7,         // Add/remove favorite
}

// Valid action types
export const VALID_ACTIONS = [
  'create_spot',
  'checkin',
  'review',
  'message',
  'favorite',
  // Legacy types
  'SOS_ALERT',
  'CHECKIN',
  'ADD_SPOT',
  'ADD_RATING',
  'ADD_COMMENT',
  'SEND_MESSAGE',
  'UPDATE_PROFILE',
  'FAVORITE',
  'REPORT',
]

// Maximum retry attempts per action
const MAX_RETRIES = 5

// Exponential backoff base (ms)
const BACKOFF_BASE = 1000

/**
 * Initialize offline queue
 * @param {Object} options - Options for initialization
 * @param {boolean} options.force - Force re-initialization
 * @returns {Promise<void>}
 */
export async function initOfflineQueue(options = {}) {
  if (isInitialized && !options.force) {
    return
  }

  // Load queue from storage
  await loadQueue()

  // Listen for online/offline events (only add once)
  if (!onlineListenerAdded && typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    onlineListenerAdded = true
  }

  // Register for Background Sync if supported
  registerBackgroundSync()

  isInitialized = true
  console.log('📋 Offline queue initialized with', queue.length, 'pending actions')
}

/**
 * Reset offline queue (for testing)
 */
export function resetOfflineQueue() {
  queue = []
  isProcessing = false
  retryTimeouts.forEach(timeout => clearTimeout(timeout))
  retryTimeouts.clear()
  isInitialized = false
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
 * @param {string} type - Action type (ADD_SPOT, CHECKIN, create_spot, checkin, review, message, favorite, etc.)
 * @param {object} data - Action data
 * @param {object} options - Additional options
 * @returns {string} Action ID
 */
export function queueAction(type, data, options = {}) {
  // Validate action type
  if (!type || typeof type !== 'string') {
    console.error('Invalid action type:', type)
    return null
  }

  const action = {
    id: `action_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type,
    data: data || {},
    priority: ACTION_PRIORITIES[type] ?? 10,
    retries: 0,
    createdAt: Date.now(),
    status: 'pending',
    ...options,
  }

  queue.push(action)
  queue.sort((a, b) => a.priority - b.priority)

  saveQueue()

  // Update UI indicator
  updateQueueIndicator()

  // Show feedback to user
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    try {
      showInfo(`Action en attente (${getQueueCount()} dans la file)`)
    } catch (e) {
      // Ignore notification errors in tests
    }
  }

  console.log('📋 Queued action:', type, action.id)

  return action.id
}

/**
 * Add action to queue (alias for queueAction)
 * @param {string} action - Action type (create_spot, checkin, review, message, favorite)
 * @param {object} data - Action data
 * @returns {string} Action ID
 */
export function addToQueue(action, data) {
  return queueAction(action, data)
}

/**
 * Check if an action type is valid
 * @param {string} type - Action type to check
 * @returns {boolean}
 */
export function isValidAction(type) {
  return VALID_ACTIONS.includes(type)
}

/**
 * Get action by ID
 * @param {string} actionId - Action ID
 * @returns {object|null}
 */
export function getActionById(actionId) {
  return queue.find(a => a.id === actionId) || null
}

/**
 * Update action status
 * @param {string} actionId - Action ID
 * @param {string} status - New status (pending, processing, completed, failed)
 */
export function updateActionStatus(actionId, status) {
  const action = queue.find(a => a.id === actionId)
  if (action) {
    action.status = status
    action.updatedAt = Date.now()
    saveQueue()
  }
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
 * Get queue size (alias for getQueueCount)
 * @returns {number}
 */
export function getQueueSize() {
  return queue.length
}

/**
 * Check if queue is empty
 * @returns {boolean}
 */
export function isQueueEmpty() {
  return queue.length === 0
}

/**
 * Get queue statistics
 * @returns {object} Queue stats
 */
export function getQueueStats() {
  const stats = {
    total: queue.length,
    byType: {},
    byStatus: {},
    oldestAction: null,
    newestAction: null,
  }

  queue.forEach(action => {
    // Count by type
    stats.byType[action.type] = (stats.byType[action.type] || 0) + 1
    // Count by status
    const status = action.status || 'pending'
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1
  })

  if (queue.length > 0) {
    const sorted = [...queue].sort((a, b) => a.createdAt - b.createdAt)
    stats.oldestAction = sorted[0]
    stats.newestAction = sorted[sorted.length - 1]
  }

  return stats
}

/**
 * Clear entire queue
 * @returns {number} Number of actions removed
 */
export function clearQueue() {
  const count = queue.length
  queue = []
  saveQueue()
  updateQueueIndicator()
  return count
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
    // New lowercase action types (task requirements)
    case 'create_spot':
      await firebase.saveSpotToFirebase(data)
      break

    case 'checkin':
      await firebase.saveValidationToFirebase(data.spotId, data.userId, data.details)
      break

    case 'review':
      await firebase.saveRatingToFirebase(data.spotId, data.rating, data.userId)
      if (data.comment) {
        await firebase.saveCommentToFirebase({
          spotId: data.spotId,
          userId: data.userId,
          text: data.comment,
        })
      }
      break

    case 'message':
      await firebase.sendChatMessage(data.room || data.channel, data.text || data.content)
      break

    case 'favorite':
      if (data.action === 'add' || data.add) {
        await firebase.addFavorite(data.spotId)
      } else {
        await firebase.removeFavorite(data.spotId)
      }
      break

    // Legacy uppercase action types
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
export function getActionLabel(type) {
  const labels = {
    // Legacy uppercase types
    SOS_ALERT: 'alerte SOS',
    CHECKIN: 'check-in',
    ADD_SPOT: 'spot',
    ADD_RATING: 'note',
    ADD_COMMENT: 'commentaire',
    SEND_MESSAGE: 'message',
    UPDATE_PROFILE: 'profil',
    FAVORITE: 'favori',
    REPORT: 'signalement',
    // New lowercase types
    create_spot: 'creation de spot',
    checkin: 'check-in',
    review: 'avis',
    message: 'message',
    favorite: 'favori',
  }
  return labels[type] || type.toLowerCase().replace(/_/g, ' ')
}

/**
 * Get action icon
 * @param {string} type - Action type
 * @returns {string}
 */
export function getActionIcon(type) {
  const icons = {
    create_spot: '📍',
    checkin: '✅',
    review: '⭐',
    message: '💬',
    favorite: '❤️',
    ADD_SPOT: '📍',
    CHECKIN: '✅',
    ADD_RATING: '⭐',
    ADD_COMMENT: '💬',
    SEND_MESSAGE: '💬',
    UPDATE_PROFILE: '👤',
    FAVORITE: '❤️',
    REPORT: '🚨',
    SOS_ALERT: '🆘',
  }
  return icons[type] || '📋'
}

/**
 * Get pending actions count by type
 * @returns {object} Count by type
 */
export function getQueueCountByType() {
  const counts = {}
  queue.forEach(action => {
    counts[action.type] = (counts[action.type] || 0) + 1
  })
  return counts
}

/**
 * Get oldest pending action
 * @returns {object|null}
 */
export function getOldestAction() {
  if (queue.length === 0) return null
  return [...queue].sort((a, b) => a.createdAt - b.createdAt)[0]
}

/**
 * Get actions older than a certain time
 * @param {number} maxAgeMs - Maximum age in milliseconds
 * @returns {Array}
 */
export function getStaleActions(maxAgeMs = 24 * 60 * 60 * 1000) {
  const cutoff = Date.now() - maxAgeMs
  return queue.filter(action => action.createdAt < cutoff)
}

/**
 * Remove stale actions from queue
 * @param {number} maxAgeMs - Maximum age in milliseconds
 * @returns {number} Number of actions removed
 */
export function removeStaleActions(maxAgeMs = 24 * 60 * 60 * 1000) {
  const cutoff = Date.now() - maxAgeMs
  const initialCount = queue.length
  queue = queue.filter(action => action.createdAt >= cutoff)
  const removed = initialCount - queue.length
  if (removed > 0) {
    saveQueue()
    updateQueueIndicator()
  }
  return removed
}

/**
 * Check if currently processing
 * @returns {boolean}
 */
export function isProcessingQueue() {
  return isProcessing
}

/**
 * Check if online
 * @returns {boolean}
 */
export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
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
if (typeof window !== 'undefined') {
  window.forceProcessQueue = forceProcessQueue
}

export default {
  // Initialization
  initOfflineQueue,
  resetOfflineQueue,
  // Adding to queue
  queueAction,
  addToQueue,
  // Removing from queue
  removeFromQueue,
  clearQueue,
  removeStaleActions,
  // Queue getters
  getQueueCount,
  getQueueSize,
  getQueuedActions,
  getQueuedActionsByType,
  getQueueCountByType,
  getQueueStats,
  isQueueEmpty,
  // Action getters
  getActionById,
  getOldestAction,
  getStaleActions,
  // Action helpers
  isValidAction,
  getActionLabel,
  getActionIcon,
  updateActionStatus,
  // Processing
  processQueue,
  forceProcessQueue,
  isProcessingQueue,
  // Status
  isOnline,
  // Rendering
  renderQueueStatus,
  // Constants
  VALID_ACTIONS,
}
