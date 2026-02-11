/**
 * Offline Service
 * Handles offline detection, UI feedback, and data syncing
 */

import { Storage } from '../utils/storage.js';
import { t } from '../i18n/index.js';

// Offline state
let isOffline = !navigator.onLine;
let offlineIndicator = null;
let pendingActions = [];

/**
 * Initialize offline handling
 */
export function initOfflineHandler() {
  // Create offline indicator
  createOfflineIndicator();

  // Listen for online/offline events
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Initial state check
  if (isOffline) {
    showOfflineIndicator();
  }

  // Load pending actions from storage
  loadPendingActions();

  console.log('📡 Offline handler initialized');
}

/**
 * Create offline indicator element
 */
function createOfflineIndicator() {
  offlineIndicator = document.createElement('div');
  offlineIndicator.className = 'offline-indicator hidden';
  offlineIndicator.setAttribute('role', 'alert');
  offlineIndicator.setAttribute('aria-live', 'assertive');
  offlineIndicator.innerHTML = `
    <span>📡 ${t('offlineMode') || 'Mode hors-ligne - Certaines fonctionnalités sont limitées'}</span>
  `;
  document.body.prepend(offlineIndicator);
}

/**
 * Handle going online
 */
function handleOnline() {
  isOffline = false;
  hideOfflineIndicator();
  syncPendingActions();

  // Announce to screen readers
  announceToSR(t('offlineConnectionRestored') || 'Connexion rétablie');
}

/**
 * Handle going offline
 */
function handleOffline() {
  isOffline = true;
  showOfflineIndicator();

  // Announce to screen readers
  announceToSR(t('offlineModeActivated') || 'Mode hors-ligne activé');
}

/**
 * Show offline indicator
 */
function showOfflineIndicator() {
  if (offlineIndicator) {
    offlineIndicator.classList.remove('hidden');
    document.body.style.paddingTop = '40px';
  }
}

/**
 * Hide offline indicator
 */
function hideOfflineIndicator() {
  if (offlineIndicator) {
    offlineIndicator.classList.add('hidden');
    document.body.style.paddingTop = '0';
  }
}

/**
 * Check if currently offline
 * @returns {boolean}
 */
export function isCurrentlyOffline() {
  return isOffline;
}

/**
 * Queue an action for when online
 * @param {Object} action - Action to queue
 */
export function queueOfflineAction(action) {
  pendingActions.push({
    ...action,
    timestamp: Date.now(),
  });
  savePendingActions();
}

/**
 * Load pending actions from storage
 */
function loadPendingActions() {
  const stored = Storage.get('pendingActions');
  if (stored && Array.isArray(stored)) {
    pendingActions = stored;
  }
}

/**
 * Save pending actions to storage
 */
function savePendingActions() {
  Storage.set('pendingActions', pendingActions);
}

/**
 * Sync pending actions when online
 */
async function syncPendingActions() {
  if (pendingActions.length === 0) return;

  console.log(`🔄 Syncing ${pendingActions.length} pending actions...`);

  const actionsToSync = [...pendingActions];
  pendingActions = [];
  savePendingActions();

  for (const action of actionsToSync) {
    try {
      await processAction(action);
      console.log(`✅ Synced action: ${action.type}`);
    } catch (error) {
      console.error(`❌ Failed to sync action: ${action.type}`, error);
      // Re-queue failed action
      pendingActions.push(action);
    }
  }

  savePendingActions();
}

/**
 * Process a queued action
 * @param {Object} action - Action to process
 */
async function processAction(action) {
  switch (action.type) {
    case 'ADD_SPOT':
      // Would integrate with firebase service
      console.log('Would sync spot:', action.data);
      break;
    case 'ADD_RATING':
      console.log('Would sync rating:', action.data);
      break;
    case 'SEND_MESSAGE':
      console.log('Would sync message:', action.data);
      break;
    default:
      console.warn('Unknown action type:', action.type);
  }
}

/**
 * Announce message to screen readers
 * @param {string} message
 */
function announceToSR(message) {
  const region = document.getElementById('aria-live-assertive');
  if (region) {
    region.textContent = '';
    setTimeout(() => {
      region.textContent = message;
    }, 100);
  }
}

/**
 * Cache spots data for offline use
 * @param {Array} spots - Spots to cache
 */
export function cacheSpots(spots) {
  Storage.set('cachedSpots', {
    data: spots,
    timestamp: Date.now(),
  });
}

/**
 * Get cached spots
 * @returns {Array|null}
 */
export function getCachedSpots() {
  const cached = Storage.get('cachedSpots');
  if (cached && cached.data) {
    // Check if cache is less than 24 hours old
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - cached.timestamp < maxAge) {
      return cached.data;
    }
  }
  return null;
}

/**
 * Check if data is cached and fresh
 * @param {string} key - Cache key
 * @param {number} maxAge - Max age in ms
 * @returns {boolean}
 */
export function isCacheFresh(key, maxAge = 3600000) {
  const cached = Storage.get(key);
  if (!cached || !cached.timestamp) return false;
  return Date.now() - cached.timestamp < maxAge;
}

export default {
  initOfflineHandler,
  isCurrentlyOffline,
  queueOfflineAction,
  cacheSpots,
  getCachedSpots,
  isCacheFresh,
};
