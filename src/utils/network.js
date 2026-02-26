/**
 * Network Utilities
 * Handles online/offline state and data sync
 */

import { getState, setState } from '../stores/state.js';
import { showToast } from '../services/notifications.js';
import { t } from '../i18n/index.js';
import { Storage } from './storage.js';

// Network state
let wasOffline = false;
const OFFLINE_QUEUE_KEY = 'spothitch_offline_queue';
const CACHE_TIMESTAMP_KEY = 'spothitch_cache_timestamp';
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Initialize network monitoring
 */
export function initNetworkMonitor() {
  // Set initial state
  updateNetworkStatus();

  // Listen for online/offline events
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Periodic connectivity check
  setInterval(checkConnectivity, 30000); // Every 30 seconds
}

/**
 * Update network status in state
 */
function updateNetworkStatus() {
  const isOnline = navigator.onLine;
  const state = getState();

  if (state.isOnline !== isOnline) {
    setState({ isOnline });
  }

  return isOnline;
}

/**
 * Handle coming online
 */
function handleOnline() {
  setState({ isOnline: true });

  if (wasOffline) {
    showToast(t('connectionRestored') || 'Connexion rétablie', 'success');
    syncOfflineQueue();
  }

  wasOffline = false;
}

/**
 * Handle going offline
 */
function handleOffline() {
  setState({ isOnline: false });
  wasOffline = true;
  showToast(t('offlineModeActivated') || 'Mode hors-ligne activé', 'warning');
}

/**
 * Check actual connectivity (not just navigator.onLine)
 */
async function checkConnectivity() {
  try {
    const response = await fetch('/manifest.json', {
      method: 'HEAD',
      cache: 'no-store',
    });
    const isOnline = response.ok;
    setState({ isOnline });
    return isOnline;
  } catch {
    setState({ isOnline: false });
    return false;
  }
}

/**
 * Add action to offline queue
 * @param {Object} action - Action to queue
 */
function queueOfflineAction(action) {
  const queue = getOfflineQueue();
  queue.push({
    ...action,
    timestamp: Date.now(),
    id: `${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`,
  });
  Storage.set(OFFLINE_QUEUE_KEY, queue);
}

/**
 * Get offline queue
 */
function getOfflineQueue() {
  return Storage.get(OFFLINE_QUEUE_KEY) || [];
}

/**
 * Sync offline queue when back online
 */
async function syncOfflineQueue() {
  const queue = getOfflineQueue();

  if (queue.length === 0) return;

  showToast(t('syncingActions') || `Synchronisation de ${queue.length} action(s)...`, 'info');

  const failedActions = [];

  for (const action of queue) {
    try {
      await processOfflineAction(action);
    } catch (error) {
      console.error('Failed to sync action:', action, error);
      failedActions.push(action);
    }
  }

  // Save failed actions back to queue
  Storage.set(OFFLINE_QUEUE_KEY, failedActions);

  if (failedActions.length === 0) {
    showToast(t('syncComplete') || 'Synchronisation terminée !', 'success');
  } else {
    showToast(t('syncFailed') || `${failedActions.length} action(s) non synchronisée(s)`, 'warning');
  }
}

/**
 * Process a single offline action
 * @param {Object} action - Action to process
 */
async function processOfflineAction(action) {
  switch (action.type) {
    case 'ADD_SPOT': {
      const { saveSpotToFirebase } = await import('../services/firebase.js');
      await saveSpotToFirebase(action.data);
      break;
    }

    case 'CHECKIN': {
      const { saveValidationToFirebase } = await import('../services/firebase.js');
      await saveValidationToFirebase(action.spotId, action.userId);
      break;
    }

    case 'REVIEW': {
      const { saveCommentToFirebase } = await import('../services/firebase.js');
      await saveCommentToFirebase(action.data);
      break;
    }

    case 'CHAT_MESSAGE': {
      const { sendChatMessage } = await import('../services/firebase.js');
      await sendChatMessage(action.room, action.text);
      break;
    }

    default:
      console.warn('Unknown offline action type:', action.type);
  }
}

/**
 * Clear offline queue
 */
function clearOfflineQueue() {
  Storage.remove(OFFLINE_QUEUE_KEY);
}

/**
 * Clean up old cached data
 */
export function cleanupOldData() {
  const timestamp = Storage.get(CACHE_TIMESTAMP_KEY);
  const now = Date.now();

  if (!timestamp || now - timestamp > MAX_CACHE_AGE) {
    // Clear old caches
    const keysToClean = [
      'spothitch_spots_cache',
      'spothitch_messages_cache',
      'spothitch_route_cache',
    ];

    keysToClean.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('Failed to clear cache:', key, e);
      }
    });

    // Update timestamp
    Storage.set(CACHE_TIMESTAMP_KEY, now);
  }
}

/**
 * Get network status info
 */
function getNetworkInfo() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  return {
    online: navigator.onLine,
    type: connection?.type || 'unknown',
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || null,
    rtt: connection?.rtt || null,
    saveData: connection?.saveData || false,
  };
}

/**
 * Check if we should use low bandwidth mode
 */
function shouldUseLowBandwidth() {
  const info = getNetworkInfo();

  // Use low bandwidth on slow connections or save-data mode
  return info.saveData ||
         info.effectiveType === 'slow-2g' ||
         info.effectiveType === '2g';
}

/**
 * Prefetch critical resources when online
 */
function prefetchResources() {
  if (!navigator.onLine) return;

  const criticalUrls = [
    '/manifest.json',
    '/icon-192.png',
  ];

  criticalUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Render offline indicator
 */
function renderOfflineIndicator() {
  const { isOnline } = getState();

  if (isOnline) return '';

  return `
    <div class="offline-indicator fixed top-0 left-0 right-0 bg-amber-500 text-amber-900
                text-center py-1 text-xs font-medium z-50">
      <span class="inline-flex items-center gap-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
        </svg>
        ${t('offlineMode') || 'Mode hors-ligne'}
      </span>
    </div>
  `;
}

export default {
  initNetworkMonitor,
  updateNetworkStatus,
  checkConnectivity,
  queueOfflineAction,
  getOfflineQueue,
  syncOfflineQueue,
  clearOfflineQueue,
  cleanupOldData,
  getNetworkInfo,
  shouldUseLowBandwidth,
  prefetchResources,
  renderOfflineIndicator,
};
