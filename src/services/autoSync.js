/**
 * Auto Sync Service
 * Automatically synchronizes data when coming back online
 *
 * Features:
 * - Enable/disable auto sync
 * - Manual sync trigger
 * - Sync status tracking
 * - Callback on sync complete
 * - Sync history logging
 * - Conflict resolution (server wins / client wins)
 * - UI indicator rendering
 */

import { Storage, SpotHitchDB } from '../utils/storage.js'
import { getState, setState } from '../stores/state.js'
import { showToast, showInfo } from './notifications.js'

// Sync configuration
const SYNC_CONFIG = {
  // Types of data to sync
  dataTypes: ['spots', 'checkins', 'messages', 'favorites', 'profile'],
  // Conflict resolution strategy: 'server' or 'client'
  conflictStrategy: 'server',
  // Sync batch size
  batchSize: 50,
  // Retry delay in ms
  retryDelay: 3000,
  // Max retries
  maxRetries: 3,
}

// Sync state
let autoSyncEnabled = true
let isSyncing = false
let lastSyncTime = null
let syncCallbacks = []
let syncHistory = []

// Storage keys
const STORAGE_KEYS = {
  enabled: 'autoSyncEnabled',
  history: 'autoSyncHistory',
  lastSync: 'autoSyncLastTime',
  pendingData: 'autoSyncPending',
  conflictStrategy: 'autoSyncConflictStrategy',
}

// Maximum history entries
const MAX_HISTORY_ENTRIES = 100

/**
 * Initialize auto sync service
 * @returns {object} Service instance
 */
export function initAutoSync() {
  // Load persisted state
  loadSyncState()

  // Setup online/offline listeners
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  console.log('[AutoSync] Initialized, enabled:', autoSyncEnabled)

  return {
    enabled: autoSyncEnabled,
    lastSync: lastSyncTime,
  }
}

/**
 * Load persisted sync state from storage
 */
function loadSyncState() {
  const enabled = Storage.get(STORAGE_KEYS.enabled)
  if (enabled !== null) {
    autoSyncEnabled = enabled
  }

  const history = Storage.get(STORAGE_KEYS.history)
  if (history && Array.isArray(history)) {
    syncHistory = history
  }

  const lastSync = Storage.get(STORAGE_KEYS.lastSync)
  if (lastSync) {
    lastSyncTime = lastSync
  }

  const strategy = Storage.get(STORAGE_KEYS.conflictStrategy)
  if (strategy) {
    SYNC_CONFIG.conflictStrategy = strategy
  }
}

/**
 * Save sync state to storage
 */
function saveSyncState() {
  Storage.set(STORAGE_KEYS.enabled, autoSyncEnabled)
  Storage.set(STORAGE_KEYS.history, syncHistory.slice(0, MAX_HISTORY_ENTRIES))
  Storage.set(STORAGE_KEYS.lastSync, lastSyncTime)
  Storage.set(STORAGE_KEYS.conflictStrategy, SYNC_CONFIG.conflictStrategy)
}

/**
 * Enable auto sync
 * @returns {boolean} New enabled state
 */
export function enableAutoSync() {
  autoSyncEnabled = true
  saveSyncState()
  console.log('[AutoSync] Enabled')

  // If currently online with pending data, sync now
  if (navigator.onLine && hasPendingData()) {
    syncNow()
  }

  return autoSyncEnabled
}

/**
 * Disable auto sync
 * @returns {boolean} New enabled state
 */
export function disableAutoSync() {
  autoSyncEnabled = false
  saveSyncState()
  console.log('[AutoSync] Disabled')
  return autoSyncEnabled
}

/**
 * Check if auto sync is enabled
 * @returns {boolean}
 */
export function isAutoSyncEnabled() {
  return autoSyncEnabled
}

/**
 * Handle coming back online
 */
async function handleOnline() {
  console.log('[AutoSync] Connection restored')

  if (!autoSyncEnabled) {
    console.log('[AutoSync] Auto sync disabled, skipping')
    return
  }

  // Small delay to ensure connection is stable
  await new Promise(resolve => setTimeout(resolve, 500))

  if (navigator.onLine && hasPendingData()) {
    await syncNow()
  }
}

/**
 * Handle going offline
 */
function handleOffline() {
  console.log('[AutoSync] Connection lost')

  // If syncing, mark as interrupted
  if (isSyncing) {
    addToHistory({
      type: 'interrupted',
      message: 'Sync interrupted - connection lost',
      timestamp: Date.now(),
    })
    isSyncing = false
  }
}

/**
 * Trigger sync manually
 * @returns {Promise<object>} Sync result
 */
export async function syncNow() {
  if (!navigator.onLine) {
    const result = {
      success: false,
      error: 'offline',
      message: 'Cannot sync while offline',
    }
    return result
  }

  if (isSyncing) {
    const result = {
      success: false,
      error: 'already_syncing',
      message: 'Sync already in progress',
    }
    return result
  }

  isSyncing = true
  const syncStartTime = Date.now()

  const result = {
    success: true,
    synced: {},
    errors: [],
    conflicts: [],
    timestamp: syncStartTime,
    duration: 0,
  }

  try {
    console.log('[AutoSync] Starting sync...')

    // Get pending data
    const pendingData = getPendingData()

    // Sync each data type
    for (const dataType of SYNC_CONFIG.dataTypes) {
      if (pendingData[dataType] && pendingData[dataType].length > 0) {
        try {
          const typeResult = await syncDataType(dataType, pendingData[dataType])
          result.synced[dataType] = typeResult.synced
          if (typeResult.errors.length > 0) {
            result.errors.push(...typeResult.errors)
          }
          if (typeResult.conflicts.length > 0) {
            result.conflicts.push(...typeResult.conflicts)
          }
        } catch (error) {
          result.errors.push({
            type: dataType,
            error: error.message,
          })
        }
      }
    }

    // Calculate duration
    result.duration = Date.now() - syncStartTime

    // Update last sync time
    lastSyncTime = syncStartTime

    // Clear synced data
    clearSyncedData(result.synced)

    // Add to history
    addToHistory({
      type: 'complete',
      result,
      timestamp: syncStartTime,
    })

    // Notify callbacks
    notifyCallbacks(result)

    // Show toast notification
    const totalSynced = Object.values(result.synced).reduce((sum, count) => sum + count, 0)
    if (totalSynced > 0) {
      showToast(`${totalSynced} element(s) synchronise(s)`, 'success')
    }

    console.log('[AutoSync] Sync complete:', result)

  } catch (error) {
    result.success = false
    result.error = error.message

    addToHistory({
      type: 'error',
      error: error.message,
      timestamp: syncStartTime,
    })

    console.error('[AutoSync] Sync failed:', error)
  } finally {
    isSyncing = false
    saveSyncState()
  }

  return result
}

/**
 * Sync a specific data type
 * @param {string} dataType - Type of data to sync
 * @param {Array} items - Items to sync
 * @returns {Promise<object>}
 */
async function syncDataType(dataType, items) {
  const result = {
    synced: 0,
    errors: [],
    conflicts: [],
  }

  for (const item of items) {
    try {
      // Check for conflicts
      const conflict = await checkConflict(dataType, item)

      if (conflict) {
        if (SYNC_CONFIG.conflictStrategy === 'server') {
          // Server wins - discard local changes
          result.conflicts.push({
            type: dataType,
            item,
            resolution: 'server_wins',
          })
        } else {
          // Client wins - push local changes
          await pushToServer(dataType, item)
          result.conflicts.push({
            type: dataType,
            item,
            resolution: 'client_wins',
          })
        }
      } else {
        // No conflict, sync normally
        await pushToServer(dataType, item)
      }

      result.synced++
    } catch (error) {
      result.errors.push({
        type: dataType,
        item: item.id,
        error: error.message,
      })
    }
  }

  return result
}

/**
 * Check for conflict with server data
 * @param {string} dataType - Type of data
 * @param {object} item - Local item
 * @returns {Promise<boolean>}
 */
async function checkConflict(dataType, item) {
  // In a real implementation, this would compare timestamps
  // with server data to detect conflicts
  try {
    const serverVersion = await fetchServerVersion(dataType, item.id)
    if (serverVersion && serverVersion.updatedAt > item.updatedAt) {
      return true
    }
  } catch {
    // No server version found, no conflict
  }
  return false
}

/**
 * Fetch server version of an item
 * @param {string} dataType - Type of data
 * @param {string} itemId - Item ID
 * @returns {Promise<object|null>}
 */
async function fetchServerVersion(dataType, itemId) {
  // Mock implementation - in real app, this would call Firebase
  // For demo purposes, return null (no server version)
  return null
}

/**
 * Push item to server
 * @param {string} dataType - Type of data
 * @param {object} item - Item to push
 * @returns {Promise<void>}
 */
async function pushToServer(dataType, item) {
  // Mock implementation - in real app, this would call Firebase
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 50))

  console.log(`[AutoSync] Pushed ${dataType}:`, item.id)
}

/**
 * Get current sync status
 * @returns {object}
 */
export function getSyncStatus() {
  const pending = getPendingData()
  const pendingCount = Object.values(pending).reduce(
    (sum, items) => sum + (items?.length || 0),
    0
  )

  return {
    enabled: autoSyncEnabled,
    syncing: isSyncing,
    lastSync: lastSyncTime,
    pendingCount,
    pendingByType: Object.fromEntries(
      Object.entries(pending).map(([type, items]) => [type, items?.length || 0])
    ),
    isOnline: navigator.onLine,
    conflictStrategy: SYNC_CONFIG.conflictStrategy,
  }
}

/**
 * Register callback for sync completion
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export function onSyncComplete(callback) {
  if (typeof callback !== 'function') {
    console.warn('[AutoSync] Invalid callback provided')
    return () => {}
  }

  syncCallbacks.push(callback)

  // Return unsubscribe function
  return () => {
    syncCallbacks = syncCallbacks.filter(cb => cb !== callback)
  }
}

/**
 * Notify all registered callbacks
 * @param {object} result - Sync result
 */
function notifyCallbacks(result) {
  syncCallbacks.forEach(callback => {
    try {
      callback(result)
    } catch (error) {
      console.error('[AutoSync] Callback error:', error)
    }
  })
}

/**
 * Get sync history
 * @param {number} limit - Maximum entries to return
 * @returns {Array}
 */
export function getSyncHistory(limit = 50) {
  return syncHistory.slice(0, limit)
}

/**
 * Add entry to sync history
 * @param {object} entry - History entry
 */
function addToHistory(entry) {
  syncHistory.unshift(entry)

  // Trim history to max size
  if (syncHistory.length > MAX_HISTORY_ENTRIES) {
    syncHistory = syncHistory.slice(0, MAX_HISTORY_ENTRIES)
  }

  saveSyncState()
}

/**
 * Clear sync history
 */
export function clearSyncHistory() {
  syncHistory = []
  saveSyncState()
}

/**
 * Get pending data to sync
 * @returns {object}
 */
function getPendingData() {
  const pending = Storage.get(STORAGE_KEYS.pendingData) || {}

  return {
    spots: pending.spots || [],
    checkins: pending.checkins || [],
    messages: pending.messages || [],
    favorites: pending.favorites || [],
    profile: pending.profile || [],
  }
}

/**
 * Check if there is pending data
 * @returns {boolean}
 */
function hasPendingData() {
  const pending = getPendingData()
  return Object.values(pending).some(items => items && items.length > 0)
}

/**
 * Add data to pending sync queue
 * @param {string} dataType - Type of data
 * @param {object} data - Data to queue
 */
export function addPendingSync(dataType, data) {
  if (!SYNC_CONFIG.dataTypes.includes(dataType)) {
    console.warn('[AutoSync] Unknown data type:', dataType)
    return
  }

  const pending = Storage.get(STORAGE_KEYS.pendingData) || {}

  if (!pending[dataType]) {
    pending[dataType] = []
  }

  // Add item with metadata
  pending[dataType].push({
    ...data,
    id: data.id || `pending_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    updatedAt: Date.now(),
    syncAttempts: 0,
  })

  Storage.set(STORAGE_KEYS.pendingData, pending)
  console.log(`[AutoSync] Added pending ${dataType}:`, data.id || 'new')
}

/**
 * Clear synced data from pending queue
 * @param {object} synced - Object with synced counts per type
 */
function clearSyncedData(synced) {
  const pending = Storage.get(STORAGE_KEYS.pendingData) || {}

  // For each type that was synced, clear the items
  for (const [dataType, count] of Object.entries(synced)) {
    if (count > 0 && pending[dataType]) {
      // Remove synced items (first N items)
      pending[dataType] = pending[dataType].slice(count)
    }
  }

  Storage.set(STORAGE_KEYS.pendingData, pending)
}

/**
 * Set conflict resolution strategy
 * @param {'server' | 'client'} strategy - Resolution strategy
 */
export function setConflictStrategy(strategy) {
  if (strategy !== 'server' && strategy !== 'client') {
    console.warn('[AutoSync] Invalid conflict strategy:', strategy)
    return
  }

  SYNC_CONFIG.conflictStrategy = strategy
  saveSyncState()
  console.log('[AutoSync] Conflict strategy set to:', strategy)
}

/**
 * Get conflict resolution strategy
 * @returns {'server' | 'client'}
 */
export function getConflictStrategy() {
  return SYNC_CONFIG.conflictStrategy
}

/**
 * Render sync status indicator
 * @param {object} options - Rendering options
 * @returns {string} HTML string
 */
export function renderSyncIndicator(options = {}) {
  const status = getSyncStatus()
  const { compact = false, showHistory = false } = options

  if (compact) {
    return renderCompactIndicator(status)
  }

  const historyHtml = showHistory ? renderHistorySection() : ''

  const statusClass = status.syncing
    ? 'text-blue-400'
    : status.isOnline
      ? 'text-green-400'
      : 'text-red-400'

  const statusIcon = status.syncing
    ? '🔄'
    : status.isOnline
      ? '🟢'
      : '🔴'

  const statusText = status.syncing
    ? 'Synchronisation en cours...'
    : status.isOnline
      ? 'En ligne'
      : 'Hors ligne'

  const lastSyncText = status.lastSync
    ? formatRelativeTime(status.lastSync)
    : 'Jamais'

  return `
    <div class="sync-indicator bg-dark-secondary rounded-lg p-4" data-testid="sync-indicator">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-lg" aria-hidden="true">${statusIcon}</span>
          <span class="${statusClass} font-medium">${statusText}</span>
        </div>
        <button
          onclick="window.toggleAutoSync && window.toggleAutoSync()"
          class="text-sm px-2 py-1 rounded ${status.enabled ? 'bg-green-600' : 'bg-gray-600'}"
          aria-label="${status.enabled ? 'Desactiver la sync auto' : 'Activer la sync auto'}"
        >
          ${status.enabled ? 'Auto: ON' : 'Auto: OFF'}
        </button>
      </div>

      <div class="text-sm text-gray-400 mb-3">
        <div>Derniere sync: ${lastSyncText}</div>
        ${status.pendingCount > 0 ? `
          <div class="text-yellow-400 mt-1">
            ${status.pendingCount} element(s) en attente
          </div>
        ` : ''}
      </div>

      ${status.pendingCount > 0 ? `
        <div class="mb-3">
          <div class="text-xs text-gray-500 mb-1">En attente:</div>
          <div class="flex flex-wrap gap-2">
            ${Object.entries(status.pendingByType)
              .filter(([_, count]) => count > 0)
              .map(([type, count]) => `
                <span class="text-xs bg-dark-primary px-2 py-1 rounded">
                  ${getDataTypeLabel(type)}: ${count}
                </span>
              `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="flex gap-2">
        <button
          onclick="window.triggerSync && window.triggerSync()"
          class="flex-1 bg-primary-600 hover:bg-primary-500 text-white px-3 py-2 rounded-lg text-sm transition-colors ${!status.isOnline || status.syncing ? 'opacity-50 cursor-not-allowed' : ''}"
          ${!status.isOnline || status.syncing ? 'disabled' : ''}
          aria-label="Synchroniser maintenant"
        >
          Synchroniser
        </button>
        <button
          onclick="window.setConflictMode && window.setConflictMode()"
          class="px-3 py-2 bg-dark-primary hover:bg-dark-primary/80 text-gray-300 rounded-lg text-sm transition-colors"
          aria-label="Changer le mode de conflit"
          title="Mode actuel: ${status.conflictStrategy === 'server' ? 'Serveur gagne' : 'Client gagne'}"
        >
          ⚙️
        </button>
      </div>

      ${historyHtml}
    </div>
  `
}

/**
 * Render compact sync indicator
 * @param {object} status - Sync status
 * @returns {string} HTML string
 */
function renderCompactIndicator(status) {
  const icon = status.syncing
    ? '🔄'
    : status.isOnline
      ? '🟢'
      : '🔴'

  const badgeClass = status.pendingCount > 0
    ? 'bg-yellow-500 text-white'
    : 'hidden'

  return `
    <div class="sync-indicator-compact flex items-center gap-1" data-testid="sync-indicator-compact">
      <span aria-hidden="true">${icon}</span>
      <span class="text-xs ${badgeClass} px-1 rounded-full" aria-label="${status.pendingCount} en attente">
        ${status.pendingCount}
      </span>
    </div>
  `
}

/**
 * Render sync history section
 * @returns {string} HTML string
 */
function renderHistorySection() {
  const history = getSyncHistory(5)

  if (history.length === 0) {
    return `
      <div class="mt-4 pt-4 border-t border-dark-primary">
        <div class="text-sm text-gray-500">Aucun historique de sync</div>
      </div>
    `
  }

  return `
    <div class="mt-4 pt-4 border-t border-dark-primary" data-testid="sync-history">
      <div class="text-sm text-gray-400 mb-2">Historique recent</div>
      <div class="space-y-2 max-h-32 overflow-y-auto">
        ${history.map(entry => `
          <div class="text-xs flex items-center gap-2">
            <span>${getHistoryIcon(entry.type)}</span>
            <span class="text-gray-500">${formatRelativeTime(entry.timestamp)}</span>
            <span class="text-gray-400 truncate flex-1">${getHistoryMessage(entry)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

/**
 * Get icon for history entry type
 * @param {string} type - Entry type
 * @returns {string}
 */
function getHistoryIcon(type) {
  const icons = {
    complete: '✅',
    error: '❌',
    interrupted: '⚠️',
  }
  return icons[type] || '📝'
}

/**
 * Get message for history entry
 * @param {object} entry - History entry
 * @returns {string}
 */
function getHistoryMessage(entry) {
  if (entry.type === 'complete' && entry.result) {
    const total = Object.values(entry.result.synced || {}).reduce((sum, n) => sum + n, 0)
    return `${total} element(s) synchronise(s)`
  }
  if (entry.type === 'error') {
    return entry.error || 'Erreur inconnue'
  }
  return entry.message || 'Sync'
}

/**
 * Get label for data type
 * @param {string} type - Data type
 * @returns {string}
 */
function getDataTypeLabel(type) {
  const labels = {
    spots: 'Spots',
    checkins: 'Check-ins',
    messages: 'Messages',
    favorites: 'Favoris',
    profile: 'Profil',
  }
  return labels[type] || type
}

/**
 * Format timestamp as relative time
 * @param {number} timestamp - Timestamp in ms
 * @returns {string}
 */
function formatRelativeTime(timestamp) {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `il y a ${days}j`
  if (hours > 0) return `il y a ${hours}h`
  if (minutes > 0) return `il y a ${minutes}min`
  return 'A l\'instant'
}

/**
 * Cleanup service
 */
export function cleanupAutoSync() {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  syncCallbacks = []

  // Reset internal state for tests
  autoSyncEnabled = true
  isSyncing = false
  lastSyncTime = null
  syncHistory = []
  SYNC_CONFIG.conflictStrategy = 'server'

  console.log('[AutoSync] Cleaned up')
}

// Expose global handlers for UI
if (typeof window !== 'undefined') {
  window.toggleAutoSync = () => {
    if (autoSyncEnabled) {
      disableAutoSync()
      showInfo('Sync automatique desactivee')
    } else {
      enableAutoSync()
      showInfo('Sync automatique activee')
    }
    // Trigger UI refresh
    window.dispatchEvent(new CustomEvent('autoSyncStateChange', {
      detail: getSyncStatus()
    }))
  }

  window.triggerSync = async () => {
    const result = await syncNow()
    window.dispatchEvent(new CustomEvent('autoSyncComplete', {
      detail: result
    }))
  }

  window.setConflictMode = () => {
    const current = getConflictStrategy()
    const newStrategy = current === 'server' ? 'client' : 'server'
    setConflictStrategy(newStrategy)
    showInfo(`Mode conflit: ${newStrategy === 'server' ? 'Serveur gagne' : 'Client gagne'}`)
    window.dispatchEvent(new CustomEvent('autoSyncStateChange', {
      detail: getSyncStatus()
    }))
  }
}

export default {
  initAutoSync,
  enableAutoSync,
  disableAutoSync,
  isAutoSyncEnabled,
  syncNow,
  getSyncStatus,
  onSyncComplete,
  getSyncHistory,
  clearSyncHistory,
  addPendingSync,
  setConflictStrategy,
  getConflictStrategy,
  renderSyncIndicator,
  cleanupAutoSync,
}
