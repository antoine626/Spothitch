/**
 * Chat Position Share Service
 * Feature #186 - Partager position dans chat
 * Allows sharing GPS position in chat conversations with automatic expiration for privacy
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { getCurrentUser } from './firebase.js';
import { showToast } from './notifications.js';
import { escapeHTML } from '../utils/sanitize.js';

// Storage key for shared positions
const SHARED_POSITIONS_KEY = 'spothitch_shared_positions';

// Position expiration time (1 hour in ms)
const POSITION_EXPIRATION_MS = 60 * 60 * 1000;

// Cleanup interval (every 5 minutes)
let cleanupIntervalId = null;

// ==================== STORAGE HELPERS ====================

/**
 * Get shared positions from storage
 * @returns {Object} Shared positions organized by chatRoomId
 */
function getPositionsStorage() {
  try {
    return Storage.get(SHARED_POSITIONS_KEY) || {};
  } catch {
    return {};
  }
}

/**
 * Save shared positions to storage
 * @param {Object} data - Positions data
 */
function savePositionsStorage(data) {
  Storage.set(SHARED_POSITIONS_KEY, data);
}

// ==================== MAIN FUNCTIONS ====================

/**
 * Share current GPS position in a chat room
 * @param {string} chatRoomId - The chat room ID (e.g., 'general', 'regional', 'private_userId')
 * @param {Object} coords - GPS coordinates { lat, lng, accuracy? }
 * @param {Object} options - Optional settings { message?, expiresIn? }
 * @returns {Object} Result with success status and position data
 */
export function sharePositionInChat(chatRoomId, coords, options = {}) {
  // Validate inputs
  if (!chatRoomId || typeof chatRoomId !== 'string') {
    return { success: false, error: 'invalid_chat_room' };
  }

  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return { success: false, error: 'invalid_coordinates' };
  }

  // Validate coordinate ranges
  if (coords.lat < -90 || coords.lat > 90) {
    return { success: false, error: 'invalid_latitude' };
  }

  if (coords.lng < -180 || coords.lng > 180) {
    return { success: false, error: 'invalid_longitude' };
  }

  // Get current user
  const user = getCurrentUser();
  const state = getState();

  // Get user info (use state as fallback for demo/testing)
  const userId = user?.uid || state.user?.uid || 'anonymous';
  const userName = user?.displayName || state.username || 'Voyageur';
  const userAvatar = state.avatar || '🤙';

  // Calculate expiration time
  const expiresIn = options.expiresIn || POSITION_EXPIRATION_MS;
  const now = Date.now();
  const expiresAt = now + expiresIn;

  // Create position data
  const positionData = {
    id: `pos_${now}_${Math.random().toString(36).substring(2, 9)}`,
    chatRoomId,
    userId,
    userName,
    userAvatar,
    lat: coords.lat,
    lng: coords.lng,
    accuracy: coords.accuracy || null,
    message: options.message || null,
    sharedAt: new Date(now).toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
    timestamp: now,
  };

  // Save to storage
  const storage = getPositionsStorage();
  if (!storage[chatRoomId]) {
    storage[chatRoomId] = [];
  }
  storage[chatRoomId].push(positionData);
  savePositionsStorage(storage);

  // Update state
  const currentSharedPositions = state.sharedPositions || {};
  setState({
    sharedPositions: {
      ...currentSharedPositions,
      [chatRoomId]: [...(currentSharedPositions[chatRoomId] || []), positionData],
    },
  });

  // Show success toast
  showToast('Position partagee !', 'success');

  return { success: true, position: positionData };
}

/**
 * Render a shared position as HTML
 * @param {Object} positionData - Position data to render
 * @returns {string} HTML string
 */
export function renderSharedPosition(positionData) {
  if (!positionData) {
    return '';
  }

  const { userName, userAvatar, lat, lng, accuracy, message, sharedAt, expiresAt } = positionData;

  // Calculate time remaining
  const now = Date.now();
  const expiresTime = new Date(expiresAt).getTime();
  const isExpired = now >= expiresTime;
  const remainingMs = Math.max(0, expiresTime - now);
  const remainingMinutes = Math.floor(remainingMs / 60000);

  // Format shared time
  const sharedDate = new Date(sharedAt);
  const timeStr = sharedDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // Generate map link
  const mapLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
  const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

  // Build HTML
  return `
    <div class="shared-position ${isExpired ? 'expired' : ''}"
         data-position-id="${escapeHTML(positionData.id)}"
         aria-label="Position partagee par ${escapeHTML(userName)}">
      <div class="shared-position-header">
        <span class="user-avatar">${escapeHTML(userAvatar || '🤙')}</span>
        <span class="user-name">${escapeHTML(userName || 'Voyageur')}</span>
        <span class="position-icon">📍</span>
        <span class="shared-time">${timeStr}</span>
      </div>

      <div class="shared-position-content">
        <div class="position-coords">
          <span class="coord-label">Lat:</span> ${lat.toFixed(6)},
          <span class="coord-label">Lng:</span> ${lng.toFixed(6)}
          ${accuracy ? `<span class="accuracy">(+/- ${Math.round(accuracy)}m)</span>` : ''}
        </div>

        ${message ? `<div class="position-message">${escapeHTML(message)}</div>` : ''}

        <div class="position-actions">
          <a href="${mapLink}" target="_blank" rel="noopener noreferrer"
             class="btn-map-link" aria-label="Voir sur OpenStreetMap">
            🗺️ Voir sur la carte
          </a>
          <a href="${googleMapsLink}" target="_blank" rel="noopener noreferrer"
             class="btn-map-link google" aria-label="Voir sur Google Maps">
            📍 Google Maps
          </a>
        </div>
      </div>

      <div class="shared-position-footer">
        ${isExpired
          ? '<span class="expired-label">⏰ Position expiree</span>'
          : `<span class="expires-label">⏱️ Expire dans ${remainingMinutes} min</span>`
        }
      </div>
    </div>
  `;
}

/**
 * Get all shared positions for a chat room
 * @param {string} chatRoomId - The chat room ID
 * @param {Object} options - { includeExpired?: boolean }
 * @returns {Array} Array of position data objects
 */
export function getSharedPositions(chatRoomId, options = {}) {
  if (!chatRoomId) {
    return [];
  }

  const storage = getPositionsStorage();
  const positions = storage[chatRoomId] || [];

  // Filter expired positions unless includeExpired is true
  if (!options.includeExpired) {
    const now = Date.now();
    return positions.filter(pos => {
      const expiresTime = new Date(pos.expiresAt).getTime();
      return now < expiresTime;
    });
  }

  return positions;
}

/**
 * Expire old positions across all chat rooms
 * @returns {Object} Result with count of expired positions
 */
export function expireOldPositions() {
  const storage = getPositionsStorage();
  const now = Date.now();
  let expiredCount = 0;

  // Iterate through all chat rooms
  Object.keys(storage).forEach(chatRoomId => {
    const positions = storage[chatRoomId] || [];
    const validPositions = [];

    positions.forEach(pos => {
      const expiresTime = new Date(pos.expiresAt).getTime();
      if (now < expiresTime) {
        validPositions.push(pos);
      } else {
        expiredCount++;
      }
    });

    // Update or remove chat room
    if (validPositions.length > 0) {
      storage[chatRoomId] = validPositions;
    } else {
      delete storage[chatRoomId];
    }
  });

  // Save updated storage
  savePositionsStorage(storage);

  // Update state
  const state = getState();
  const updatedSharedPositions = {};
  Object.keys(storage).forEach(chatRoomId => {
    updatedSharedPositions[chatRoomId] = storage[chatRoomId];
  });
  setState({ sharedPositions: updatedSharedPositions });

  return { success: true, expiredCount };
}

// ==================== ADDITIONAL UTILITIES ====================

/**
 * Get position by ID
 * @param {string} positionId - Position ID
 * @returns {Object|null} Position data or null
 */
export function getPositionById(positionId) {
  if (!positionId) return null;

  const storage = getPositionsStorage();

  for (const chatRoomId of Object.keys(storage)) {
    const positions = storage[chatRoomId] || [];
    const found = positions.find(pos => pos.id === positionId);
    if (found) return found;
  }

  return null;
}

/**
 * Delete a shared position
 * @param {string} positionId - Position ID to delete
 * @returns {Object} Result with success status
 */
export function deleteSharedPosition(positionId) {
  if (!positionId) {
    return { success: false, error: 'invalid_position_id' };
  }

  const user = getCurrentUser();
  const state = getState();
  const currentUserId = user?.uid || state.user?.uid;

  const storage = getPositionsStorage();
  let deleted = false;

  for (const chatRoomId of Object.keys(storage)) {
    const positions = storage[chatRoomId] || [];
    const posIndex = positions.findIndex(pos => pos.id === positionId);

    if (posIndex !== -1) {
      const pos = positions[posIndex];

      // Only allow deleting own positions
      if (pos.userId !== currentUserId) {
        return { success: false, error: 'not_owner' };
      }

      positions.splice(posIndex, 1);

      if (positions.length > 0) {
        storage[chatRoomId] = positions;
      } else {
        delete storage[chatRoomId];
      }

      deleted = true;
      break;
    }
  }

  if (deleted) {
    savePositionsStorage(storage);
    showToast('Position supprimee', 'info');
    return { success: true };
  }

  return { success: false, error: 'position_not_found' };
}

/**
 * Get user's own shared positions
 * @param {string} userId - User ID (optional, defaults to current user)
 * @returns {Array} Array of position data objects
 */
export function getUserSharedPositions(userId) {
  const user = getCurrentUser();
  const state = getState();
  const targetUserId = userId || user?.uid || state.user?.uid;

  if (!targetUserId) return [];

  const storage = getPositionsStorage();
  const userPositions = [];

  Object.keys(storage).forEach(chatRoomId => {
    const positions = storage[chatRoomId] || [];
    positions.forEach(pos => {
      if (pos.userId === targetUserId) {
        userPositions.push({ ...pos, chatRoomId });
      }
    });
  });

  // Sort by timestamp descending (newest first)
  userPositions.sort((a, b) => b.timestamp - a.timestamp);

  return userPositions;
}

/**
 * Check if user can share position (has valid location permission)
 * @returns {boolean} Whether user can share position
 */
export function canSharePosition() {
  const state = getState();
  const locationPermission = state.locationPermissionChoice;
  return locationPermission === 'granted';
}

/**
 * Get sharing statistics for a chat room
 * @param {string} chatRoomId - Chat room ID
 * @returns {Object} Statistics object
 */
export function getChatRoomPositionStats(chatRoomId) {
  if (!chatRoomId) {
    return { totalShared: 0, activePositions: 0, uniqueUsers: 0 };
  }

  const storage = getPositionsStorage();
  const positions = storage[chatRoomId] || [];
  const now = Date.now();

  const activePositions = positions.filter(pos => {
    const expiresTime = new Date(pos.expiresAt).getTime();
    return now < expiresTime;
  });

  const uniqueUserIds = new Set(positions.map(pos => pos.userId));

  return {
    totalShared: positions.length,
    activePositions: activePositions.length,
    uniqueUsers: uniqueUserIds.size,
    latestPosition: positions.length > 0 ? positions[positions.length - 1] : null,
  };
}

/**
 * Start automatic cleanup of expired positions
 * @param {number} intervalMs - Cleanup interval in ms (default: 5 minutes)
 */
export function startPositionCleanup(intervalMs = 5 * 60 * 1000) {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
  }

  // Run immediately
  expireOldPositions();

  // Then run at interval
  cleanupIntervalId = setInterval(() => {
    expireOldPositions();
  }, intervalMs);

  return cleanupIntervalId;
}

/**
 * Stop automatic cleanup of expired positions
 */
export function stopPositionCleanup() {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
}

/**
 * Get expiration time constant
 * @returns {number} Expiration time in milliseconds
 */
export function getPositionExpirationTime() {
  return POSITION_EXPIRATION_MS;
}

/**
 * Format remaining time for display
 * @param {string} expiresAt - ISO date string
 * @returns {string} Formatted time string
 */
export function formatRemainingTime(expiresAt) {
  const now = Date.now();
  const expiresTime = new Date(expiresAt).getTime();
  const remainingMs = Math.max(0, expiresTime - now);

  if (remainingMs === 0) {
    return 'Expire';
  }

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes} min`;
  }

  return `${seconds} sec`;
}

/**
 * Check if a position is expired
 * @param {Object} positionData - Position data
 * @returns {boolean} Whether position is expired
 */
export function isPositionExpired(positionData) {
  if (!positionData || !positionData.expiresAt) {
    return true;
  }

  const now = Date.now();
  const expiresTime = new Date(positionData.expiresAt).getTime();
  return now >= expiresTime;
}

/**
 * Clear all shared positions (for testing/debugging)
 * @returns {Object} Result with success status
 */
export function clearAllSharedPositions() {
  Storage.remove(SHARED_POSITIONS_KEY);
  setState({ sharedPositions: {} });
  return { success: true };
}

// Export default object
export default {
  sharePositionInChat,
  renderSharedPosition,
  getSharedPositions,
  expireOldPositions,
  getPositionById,
  deleteSharedPosition,
  getUserSharedPositions,
  canSharePosition,
  getChatRoomPositionStats,
  startPositionCleanup,
  stopPositionCleanup,
  getPositionExpirationTime,
  formatRemainingTime,
  isPositionExpired,
  clearAllSharedPositions,
};
