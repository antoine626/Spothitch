/**
 * Background Sync Service
 * Synchronizes data in the background using Background Sync API with localStorage fallback
 *
 * Features:
 * - Register sync tasks with tags and data
 * - Process pending syncs when online
 * - Queue management (add, get, clear)
 * - Callbacks for sync completion
 * - Automatic retry with exponential backoff
 * - Support for spots, check-ins, messages, and favorites
 */

import { Storage } from '../utils/storage.js'

// Storage key for sync queue
const SYNC_QUEUE_KEY = 'backgroundSyncQueue'

// Sync types
export const SyncType = {
  SPOT_CREATED: 'spot-created',
  CHECKIN: 'checkin',
  MESSAGE: 'message',
  FAVORITE: 'favorite',
  RATING: 'rating',
  PROFILE_UPDATE: 'profile-update',
  REPORT: 'report',
  SOS_ALERT: 'sos-alert',
}

// Sync status
export const SyncStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRYING: 'retrying',
}

// Default configuration
const DEFAULT_CONFIG = {
  maxRetries: 5,
  retryDelayBase: 1000, // 1 second base delay
  retryDelayMax: 60000, // 1 minute max delay
  batchSize: 10,
  syncInterval: 30000, // 30 seconds
}

// Internal state
let syncQueue = []
let isProcessing = false
let syncCallbacks = new Map()
let completionCallbacks = []
let config = { ...DEFAULT_CONFIG }
let syncInterval = null
let isInitialized = false
let backgroundSyncSupported = false

/**
 * Initialize the background sync service
 * @param {Object} options - Configuration options
 * @returns {boolean} Whether initialization was successful
 */
export function initBackgroundSync(options = {}) {
  if (isInitialized) {
    console.log('[BackgroundSync] Already initialized')
    return true
  }

  // Merge configuration
  config = { ...DEFAULT_CONFIG, ...options }

  // Load queue from storage
  loadQueue()

  // Check for Background Sync API support
  backgroundSyncSupported = 'serviceWorker' in navigator && 'SyncManager' in window

  // Listen for online/offline events
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Start periodic sync check if online
  if (navigator.onLine) {
    startPeriodicSync()
  }

  // Register service worker sync event if supported
  if (backgroundSyncSupported) {
    registerServiceWorkerSync()
  }

  isInitialized = true
  console.log('[BackgroundSync] Initialized', {
    queueLength: syncQueue.length,
    backgroundSyncSupported,
  })

  return true
}

/**
 * Destroy the background sync service
 */
export function destroyBackgroundSync() {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  stopPeriodicSync()
  syncCallbacks.clear()
  completionCallbacks = []
  syncQueue = []
  isInitialized = false
  isProcessing = false
  console.log('[BackgroundSync] Destroyed')
}

/**
 * Register a sync task
 * @param {string} tag - Sync type tag (e.g., 'spot-created', 'checkin')
 * @param {Object} data - Data to sync
 * @param {Object} options - Additional options
 * @returns {string} Sync item ID
 */
export function registerSync(tag, data, options = {}) {
  if (!tag) {
    console.warn('[BackgroundSync] Tag is required for registerSync')
    return null
  }

  if (!data) {
    console.warn('[BackgroundSync] Data is required for registerSync')
    return null
  }

  const syncItem = {
    id: generateSyncId(),
    tag,
    data,
    status: SyncStatus.PENDING,
    retries: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    priority: options.priority !== undefined ? options.priority : getPriorityForTag(tag),
    metadata: options.metadata || {},
  }

  syncQueue.push(syncItem)
  sortQueueByPriority()
  saveQueue()

  console.log('[BackgroundSync] Registered sync:', syncItem.id, tag)

  // Try to sync immediately if online
  if (navigator.onLine && !isProcessing) {
    processPendingSync()
  } else if (backgroundSyncSupported) {
    // Request background sync
    requestBackgroundSync(tag)
  }

  return syncItem.id
}

/**
 * Process all pending sync items
 * @returns {Promise<Object>} Result with success and failed counts
 */
export async function processPendingSync() {
  if (isProcessing) {
    console.log('[BackgroundSync] Already processing, skipping')
    return { success: 0, failed: 0, skipped: true }
  }

  if (!navigator.onLine) {
    console.log('[BackgroundSync] Offline, cannot process sync')
    return { success: 0, failed: 0, offline: true }
  }

  const pending = syncQueue.filter(item => item.status === SyncStatus.PENDING || item.status === SyncStatus.RETRYING)

  if (pending.length === 0) {
    console.log('[BackgroundSync] No pending items to sync')
    return { success: 0, failed: 0 }
  }

  isProcessing = true
  console.log('[BackgroundSync] Processing', pending.length, 'pending items')

  let successCount = 0
  let failedCount = 0

  // Process in batches
  const batches = chunkArray(pending, config.batchSize)

  for (const batch of batches) {
    if (!navigator.onLine) {
      console.log('[BackgroundSync] Lost connection during processing')
      break
    }

    const results = await Promise.allSettled(
      batch.map(item => processItem(item))
    )

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        successCount++
      } else {
        failedCount++
      }
    })
  }

  isProcessing = false
  saveQueue()

  // Notify completion callbacks
  notifyCompletion({ success: successCount, failed: failedCount })

  console.log('[BackgroundSync] Processing complete:', { successCount, failedCount })

  return { success: successCount, failed: failedCount }
}

/**
 * Process a single sync item
 * @param {Object} item - Sync item to process
 * @returns {Promise<Object>} Result
 */
async function processItem(item) {
  item.status = SyncStatus.IN_PROGRESS
  item.updatedAt = Date.now()

  try {
    // Get the sync handler for this tag
    const handler = getSyncHandler(item.tag)

    if (!handler) {
      console.warn('[BackgroundSync] No handler for tag:', item.tag)
      item.status = SyncStatus.FAILED
      item.error = 'No handler registered'
      return { success: false, error: 'No handler' }
    }

    // Execute the sync handler
    await handler(item.data, item.metadata)

    // Success - remove from queue
    item.status = SyncStatus.COMPLETED
    removeFromQueue(item.id)

    // Call item-specific callback
    const callback = syncCallbacks.get(item.id)
    if (callback) {
      callback(null, item)
      syncCallbacks.delete(item.id)
    }

    console.log('[BackgroundSync] Synced successfully:', item.id, item.tag)
    return { success: true, item }

  } catch (error) {
    console.error('[BackgroundSync] Sync failed:', item.id, error)

    item.retries++
    item.lastError = error.message
    item.updatedAt = Date.now()

    if (item.retries >= config.maxRetries) {
      // Max retries reached
      item.status = SyncStatus.FAILED

      // Call item-specific callback with error
      const callback = syncCallbacks.get(item.id)
      if (callback) {
        callback(error, item)
        syncCallbacks.delete(item.id)
      }
    } else {
      // Schedule retry
      item.status = SyncStatus.RETRYING
      item.nextRetryAt = Date.now() + calculateRetryDelay(item.retries)
    }

    return { success: false, error: error.message, item }
  }
}

/**
 * Get the current sync queue
 * @param {Object} options - Filter options
 * @returns {Array} Sync queue items
 */
export function getSyncQueue(options = {}) {
  let queue = [...syncQueue]

  // Filter by status
  if (options.status) {
    queue = queue.filter(item => item.status === options.status)
  }

  // Filter by tag
  if (options.tag) {
    queue = queue.filter(item => item.tag === options.tag)
  }

  // Filter by time range
  if (options.since) {
    queue = queue.filter(item => item.createdAt >= options.since)
  }

  return queue
}

/**
 * Get sync queue count
 * @param {string} status - Optional status filter
 * @returns {number} Queue count
 */
export function getSyncQueueCount(status = null) {
  if (status) {
    return syncQueue.filter(item => item.status === status).length
  }
  return syncQueue.length
}

/**
 * Clear the sync queue
 * @param {Object} options - Options for clearing
 * @returns {number} Number of items cleared
 */
export function clearSyncQueue(options = {}) {
  const initialCount = syncQueue.length

  if (options.status) {
    // Clear only items with specific status
    syncQueue = syncQueue.filter(item => item.status !== options.status)
  } else if (options.tag) {
    // Clear only items with specific tag
    syncQueue = syncQueue.filter(item => item.tag !== options.tag)
  } else if (options.olderThan) {
    // Clear items older than specified timestamp
    syncQueue = syncQueue.filter(item => item.createdAt >= options.olderThan)
  } else {
    // Clear all
    syncQueue = []
  }

  const clearedCount = initialCount - syncQueue.length
  saveQueue()

  console.log('[BackgroundSync] Cleared', clearedCount, 'items from queue')
  return clearedCount
}

/**
 * Register a callback for sync completion
 * @param {Function} callback - Callback function (result) => void
 * @returns {Function} Unsubscribe function
 */
export function onSyncComplete(callback) {
  if (typeof callback !== 'function') {
    console.warn('[BackgroundSync] onSyncComplete requires a function callback')
    return () => {}
  }

  completionCallbacks.push(callback)

  // Return unsubscribe function
  return () => {
    const index = completionCallbacks.indexOf(callback)
    if (index > -1) {
      completionCallbacks.splice(index, 1)
    }
  }
}

/**
 * Register a callback for a specific sync item
 * @param {string} syncId - Sync item ID
 * @param {Function} callback - Callback function (error, result) => void
 */
export function onItemSyncComplete(syncId, callback) {
  if (typeof callback !== 'function') {
    console.warn('[BackgroundSync] onItemSyncComplete requires a function callback')
    return
  }
  syncCallbacks.set(syncId, callback)
}

/**
 * Get a specific sync item by ID
 * @param {string} syncId - Sync item ID
 * @returns {Object|null} Sync item or null
 */
export function getSyncItem(syncId) {
  return syncQueue.find(item => item.id === syncId) || null
}

/**
 * Remove a specific sync item
 * @param {string} syncId - Sync item ID
 * @returns {boolean} Whether item was removed
 */
export function removeSyncItem(syncId) {
  const initialLength = syncQueue.length
  syncQueue = syncQueue.filter(item => item.id !== syncId)

  if (syncQueue.length < initialLength) {
    saveQueue()
    syncCallbacks.delete(syncId)
    console.log('[BackgroundSync] Removed item:', syncId)
    return true
  }
  return false
}

/**
 * Retry a failed sync item
 * @param {string} syncId - Sync item ID
 * @returns {boolean} Whether retry was initiated
 */
export function retrySyncItem(syncId) {
  const item = syncQueue.find(i => i.id === syncId)

  if (!item) {
    console.warn('[BackgroundSync] Item not found for retry:', syncId)
    return false
  }

  if (item.status !== SyncStatus.FAILED) {
    console.warn('[BackgroundSync] Item is not in failed state:', syncId)
    return false
  }

  item.status = SyncStatus.PENDING
  item.retries = 0
  item.updatedAt = Date.now()
  saveQueue()

  // Try to process immediately
  if (navigator.onLine && !isProcessing) {
    processPendingSync()
  }

  console.log('[BackgroundSync] Retry initiated for:', syncId)
  return true
}

/**
 * Check if Background Sync API is supported
 * @returns {boolean}
 */
export function isBackgroundSyncSupported() {
  return backgroundSyncSupported
}

/**
 * Check if service is currently processing
 * @returns {boolean}
 */
export function isSyncing() {
  return isProcessing
}

/**
 * Get sync statistics
 * @returns {Object} Statistics
 */
export function getSyncStats() {
  const stats = {
    total: syncQueue.length,
    pending: 0,
    inProgress: 0,
    completed: 0,
    failed: 0,
    retrying: 0,
    byTag: {},
    oldestItem: null,
    newestItem: null,
  }

  syncQueue.forEach(item => {
    // Count by status
    switch (item.status) {
      case SyncStatus.PENDING:
        stats.pending++
        break
      case SyncStatus.IN_PROGRESS:
        stats.inProgress++
        break
      case SyncStatus.COMPLETED:
        stats.completed++
        break
      case SyncStatus.FAILED:
        stats.failed++
        break
      case SyncStatus.RETRYING:
        stats.retrying++
        break
    }

    // Count by tag
    stats.byTag[item.tag] = (stats.byTag[item.tag] || 0) + 1

    // Track oldest/newest
    if (!stats.oldestItem || item.createdAt < stats.oldestItem.createdAt) {
      stats.oldestItem = item
    }
    if (!stats.newestItem || item.createdAt > stats.newestItem.createdAt) {
      stats.newestItem = item
    }
  })

  return stats
}

/**
 * Force an immediate sync attempt
 * @returns {Promise<Object>} Sync result
 */
export async function forceSync() {
  console.log('[BackgroundSync] Force sync requested')
  return processPendingSync()
}

// ============================================
// Internal helper functions
// ============================================

/**
 * Load queue from storage
 */
function loadQueue() {
  const stored = Storage.get(SYNC_QUEUE_KEY)
  if (stored && Array.isArray(stored)) {
    syncQueue = stored
    console.log('[BackgroundSync] Loaded', syncQueue.length, 'items from storage')
  }
}

/**
 * Save queue to storage
 */
function saveQueue() {
  Storage.set(SYNC_QUEUE_KEY, syncQueue)
}

/**
 * Remove item from queue by ID
 * @param {string} syncId - Sync item ID
 */
function removeFromQueue(syncId) {
  syncQueue = syncQueue.filter(item => item.id !== syncId)
}

/**
 * Sort queue by priority (lower = higher priority)
 */
function sortQueueByPriority() {
  syncQueue.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority
    }
    return a.createdAt - b.createdAt
  })
}

/**
 * Generate unique sync ID
 * @returns {string}
 */
function generateSyncId() {
  return `sync_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Get priority for a sync tag
 * @param {string} tag - Sync tag
 * @returns {number} Priority (lower = higher priority)
 */
function getPriorityForTag(tag) {
  const priorities = {
    [SyncType.SOS_ALERT]: 0,
    [SyncType.CHECKIN]: 1,
    [SyncType.SPOT_CREATED]: 2,
    [SyncType.RATING]: 3,
    [SyncType.MESSAGE]: 4,
    [SyncType.FAVORITE]: 5,
    [SyncType.PROFILE_UPDATE]: 6,
    [SyncType.REPORT]: 7,
  }
  return priorities[tag] ?? 10
}

/**
 * Calculate retry delay with exponential backoff
 * @param {number} retryCount - Current retry count
 * @returns {number} Delay in milliseconds
 */
function calculateRetryDelay(retryCount) {
  const delay = config.retryDelayBase * Math.pow(2, retryCount)
  return Math.min(delay, config.retryDelayMax)
}

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array} Array of chunks
 */
function chunkArray(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Notify completion callbacks
 * @param {Object} result - Sync result
 */
function notifyCompletion(result) {
  completionCallbacks.forEach(callback => {
    try {
      callback(result)
    } catch (error) {
      console.error('[BackgroundSync] Completion callback error:', error)
    }
  })
}

/**
 * Handle coming back online
 */
function handleOnline() {
  console.log('[BackgroundSync] Back online')
  startPeriodicSync()

  // Process pending items
  setTimeout(() => {
    processPendingSync()
  }, 1000)
}

/**
 * Handle going offline
 */
function handleOffline() {
  console.log('[BackgroundSync] Went offline')
  stopPeriodicSync()
}

/**
 * Start periodic sync check
 */
function startPeriodicSync() {
  if (syncInterval) return

  syncInterval = setInterval(() => {
    if (navigator.onLine && !isProcessing) {
      // Check for items that need retry
      const now = Date.now()
      const needsRetry = syncQueue.some(item =>
        item.status === SyncStatus.RETRYING &&
        item.nextRetryAt &&
        item.nextRetryAt <= now
      )

      if (needsRetry || syncQueue.some(item => item.status === SyncStatus.PENDING)) {
        processPendingSync()
      }
    }
  }, config.syncInterval)
}

/**
 * Stop periodic sync check
 */
function stopPeriodicSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}

/**
 * Request background sync via service worker
 * @param {string} tag - Sync tag
 */
async function requestBackgroundSync(tag) {
  if (!backgroundSyncSupported) return

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.sync.register(`spothitch-sync-${tag}`)
    console.log('[BackgroundSync] Background sync registered for:', tag)
  } catch (error) {
    console.warn('[BackgroundSync] Failed to register background sync:', error)
  }
}

/**
 * Register service worker sync event handler
 */
async function registerServiceWorkerSync() {
  if (!('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.ready

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'SYNC_REQUESTED') {
        processPendingSync()
      }
    })

    console.log('[BackgroundSync] Service worker sync registered')
  } catch (error) {
    console.warn('[BackgroundSync] Failed to register service worker sync:', error)
  }
}

// ============================================
// Sync handlers registry
// ============================================

const syncHandlers = new Map()

/**
 * Register a sync handler for a tag
 * @param {string} tag - Sync tag
 * @param {Function} handler - Handler function (data, metadata) => Promise
 */
export function registerSyncHandler(tag, handler) {
  if (typeof handler !== 'function') {
    console.warn('[BackgroundSync] Handler must be a function')
    return
  }
  syncHandlers.set(tag, handler)
  console.log('[BackgroundSync] Handler registered for:', tag)
}

/**
 * Unregister a sync handler
 * @param {string} tag - Sync tag
 */
export function unregisterSyncHandler(tag) {
  syncHandlers.delete(tag)
}

/**
 * Get sync handler for a tag
 * @param {string} tag - Sync tag
 * @returns {Function|null}
 */
function getSyncHandler(tag) {
  return syncHandlers.get(tag) || getDefaultHandler(tag)
}

/**
 * Get default handler for common sync types
 * @param {string} tag - Sync tag
 * @returns {Function|null}
 */
function getDefaultHandler(tag) {
  // Default handlers that simulate Firebase operations
  const defaultHandlers = {
    [SyncType.SPOT_CREATED]: async (data) => {
      // Would call firebase.saveSpotToFirebase(data)
      console.log('[BackgroundSync] Default handler: saving spot', data)
      return { success: true }
    },
    [SyncType.CHECKIN]: async (data) => {
      // Would call firebase.saveValidationToFirebase(...)
      console.log('[BackgroundSync] Default handler: saving checkin', data)
      return { success: true }
    },
    [SyncType.MESSAGE]: async (data) => {
      // Would call firebase.sendChatMessage(...)
      console.log('[BackgroundSync] Default handler: sending message', data)
      return { success: true }
    },
    [SyncType.FAVORITE]: async (data) => {
      // Would call firebase.addFavorite/removeFavorite(...)
      console.log('[BackgroundSync] Default handler: updating favorite', data)
      return { success: true }
    },
    [SyncType.RATING]: async (data) => {
      console.log('[BackgroundSync] Default handler: saving rating', data)
      return { success: true }
    },
    [SyncType.PROFILE_UPDATE]: async (data) => {
      console.log('[BackgroundSync] Default handler: updating profile', data)
      return { success: true }
    },
    [SyncType.REPORT]: async (data) => {
      console.log('[BackgroundSync] Default handler: submitting report', data)
      return { success: true }
    },
    [SyncType.SOS_ALERT]: async (data) => {
      console.log('[BackgroundSync] Default handler: sending SOS alert', data)
      return { success: true }
    },
  }

  return defaultHandlers[tag] || null
}

/**
 * Render sync status widget
 * @returns {string} HTML string
 */
export function renderSyncStatus() {
  const stats = getSyncStats()

  if (stats.total === 0) {
    return ''
  }

  const pendingCount = stats.pending + stats.retrying
  const statusClass = stats.failed > 0 ? 'border-red-700 bg-red-900/50' : 'border-yellow-700 bg-yellow-900/50'
  const textClass = stats.failed > 0 ? 'text-red-200' : 'text-yellow-200'
  const icon = stats.failed > 0 ? '⚠️' : '🔄'

  return `
    <div class="background-sync-status ${statusClass} border rounded-lg p-3 mb-4" role="status" aria-live="polite">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg">${icon}</span>
        <span class="${textClass} font-medium">
          ${pendingCount} action(s) en attente de synchronisation
        </span>
      </div>
      ${stats.failed > 0 ? `
        <div class="text-sm text-red-300/70 mb-2">
          ${stats.failed} echec(s) - Reessai automatique
        </div>
      ` : ''}
      <div class="text-sm text-gray-400">
        ${Object.entries(stats.byTag)
          .map(([tag, count]) => `${count} ${getTagLabel(tag)}`)
          .join(' | ')}
      </div>
      ${navigator.onLine ? `
        <button
          onclick="window.forceBackgroundSync()"
          class="mt-2 px-3 py-1 bg-primary-600 hover:bg-primary-500 text-white text-sm rounded-lg transition-colors"
        >
          Synchroniser maintenant
        </button>
      ` : `
        <div class="mt-2 text-xs text-gray-500">
          Synchronisation automatique au retour en ligne
        </div>
      `}
    </div>
  `
}

/**
 * Get human-readable label for sync tag
 * @param {string} tag - Sync tag
 * @returns {string} Label
 */
function getTagLabel(tag) {
  const labels = {
    [SyncType.SPOT_CREATED]: 'spot(s)',
    [SyncType.CHECKIN]: 'check-in(s)',
    [SyncType.MESSAGE]: 'message(s)',
    [SyncType.FAVORITE]: 'favori(s)',
    [SyncType.RATING]: 'note(s)',
    [SyncType.PROFILE_UPDATE]: 'profil',
    [SyncType.REPORT]: 'signalement(s)',
    [SyncType.SOS_ALERT]: 'alerte(s) SOS',
  }
  return labels[tag] || tag
}

// Expose for global access
if (typeof window !== 'undefined') {
  window.forceBackgroundSync = forceSync
}

// Default export
export default {
  initBackgroundSync,
  destroyBackgroundSync,
  registerSync,
  processPendingSync,
  getSyncQueue,
  getSyncQueueCount,
  clearSyncQueue,
  onSyncComplete,
  onItemSyncComplete,
  getSyncItem,
  removeSyncItem,
  retrySyncItem,
  isBackgroundSyncSupported,
  isSyncing,
  getSyncStats,
  forceSync,
  registerSyncHandler,
  unregisterSyncHandler,
  renderSyncStatus,
  SyncType,
  SyncStatus,
}
