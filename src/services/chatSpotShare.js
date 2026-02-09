/**
 * Chat Spot Share Service
 * Feature #185 - Partager spot dans chat
 *
 * Service to share spots in chat conversations with rich preview cards
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { getCurrentUser } from './firebase.js';
import { showToast } from './notifications.js';
import { sampleSpots } from '../data/spots.js';

// Storage key for shared spots
const SHARED_SPOTS_KEY = 'spothitch_shared_spots';

// Message types
export const MessageType = {
  SPOT_SHARE: 'spot_share',
  SPOT_RECOMMENDATION: 'spot_recommendation',
  SPOT_QUESTION: 'spot_question',
};

/**
 * Get shared spots storage
 * @returns {Object} Shared spots by chat room
 */
function getSharedSpotsStorage() {
  try {
    return Storage.get(SHARED_SPOTS_KEY) || {};
  } catch {
    return {};
  }
}

/**
 * Save shared spots storage
 * @param {Object} data - Data to save
 */
function saveSharedSpotsStorage(data) {
  Storage.set(SHARED_SPOTS_KEY, data);
}

/**
 * Get spot data by ID (from state or sample spots)
 * @param {string|number} spotId - Spot ID
 * @returns {Object|null} Spot data or null
 */
function getSpotById(spotId) {
  const state = getState();

  // Try to find in state spots first
  let spot = state.spots?.find(s => s.id === spotId || s.id === String(spotId) || String(s.id) === String(spotId));

  // If not found, try sample spots
  if (!spot) {
    spot = sampleSpots.find(s => s.id === spotId || s.id === Number(spotId) || String(s.id) === String(spotId));
  }

  return spot || null;
}

/**
 * Validate chat room ID
 * @param {string} chatRoomId - Chat room identifier
 * @returns {boolean} True if valid
 */
function isValidChatRoomId(chatRoomId) {
  if (!chatRoomId || typeof chatRoomId !== 'string') {
    return false;
  }
  return chatRoomId.trim().length > 0;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Format rating as stars
 * @param {number} rating - Rating value (0-5)
 * @returns {string} Star HTML
 */
function formatRatingStars(rating) {
  if (!rating || rating < 0) rating = 0;
  if (rating > 5) rating = 5;

  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  let stars = '';
  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star text-yellow-400"></i>';
  }
  if (hasHalf) {
    stars += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
  }
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star text-gray-400"></i>';
  }

  return stars;
}

/**
 * Share a spot in a chat room
 * @param {string|number} spotId - ID of the spot to share
 * @param {string} chatRoomId - ID of the chat room (e.g., 'general', 'france', 'user123')
 * @param {Object} options - Optional settings
 * @param {string} options.message - Custom message to include
 * @param {string} options.messageType - Type of share (spot_share, spot_recommendation, spot_question)
 * @returns {Object} Result with success status and share data
 */
export function shareSpotInChat(spotId, chatRoomId, options = {}) {
  // Validate spotId
  if (!spotId) {
    return { success: false, error: 'missing_spot_id', message: 'ID du spot requis' };
  }

  // Validate chatRoomId
  if (!isValidChatRoomId(chatRoomId)) {
    return { success: false, error: 'invalid_chat_room', message: 'Salon de chat invalide' };
  }

  // Get current user
  const currentUser = getCurrentUser();
  const state = getState();
  const userId = currentUser?.uid || state.user?.uid || 'anonymous';
  const userName = currentUser?.displayName || state.username || 'Anonyme';

  // Get spot data
  const spot = getSpotById(spotId);
  if (!spot) {
    return { success: false, error: 'spot_not_found', message: 'Spot non trouve' };
  }

  // Build shared spot data
  const sharedSpot = {
    id: `share_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    spotId: spot.id,
    chatRoomId: chatRoomId,
    sharedBy: {
      id: userId,
      name: userName,
      avatar: state.avatar || '🤙',
    },
    sharedAt: new Date().toISOString(),
    messageType: options.messageType || MessageType.SPOT_SHARE,
    customMessage: options.message || null,
    spotData: {
      id: spot.id,
      from: spot.from || '',
      to: spot.to || '',
      description: spot.description || '',
      photoUrl: spot.photoUrl || spot.photo || null,
      coordinates: spot.coordinates || { lat: spot.lat, lng: spot.lng },
      globalRating: spot.globalRating || spot.rating || 0,
      totalReviews: spot.totalReviews || 0,
      avgWaitTime: spot.avgWaitTime || null,
      country: spot.country || '',
      verified: spot.verified || false,
      checkins: spot.checkins || 0,
    },
  };

  // Save to storage
  const storage = getSharedSpotsStorage();
  if (!storage[chatRoomId]) {
    storage[chatRoomId] = [];
  }
  storage[chatRoomId].push(sharedSpot);
  saveSharedSpotsStorage(storage);

  // Update state
  const currentSharedSpots = state.sharedSpots || {};
  const updatedSharedSpots = {
    ...currentSharedSpots,
    [chatRoomId]: storage[chatRoomId],
  };
  setState({ sharedSpots: updatedSharedSpots });

  // Show success toast
  showToast('Spot partage dans le chat !', 'success');

  return {
    success: true,
    share: sharedSpot,
    spotData: sharedSpot.spotData,
  };
}

/**
 * Render a shared spot card for display in chat
 * @param {Object} spotData - Spot data to render
 * @param {Object} options - Render options
 * @param {string} options.size - Card size ('compact', 'normal', 'large')
 * @param {boolean} options.showActions - Whether to show action buttons
 * @param {string} options.sharedBy - Name of person who shared
 * @param {string} options.customMessage - Custom message from sharer
 * @returns {string} HTML string for the card
 */
export function renderSharedSpot(spotData, options = {}) {
  if (!spotData) {
    return '<div class="shared-spot-error text-gray-500 text-sm">Spot non disponible</div>';
  }

  const size = options.size || 'normal';
  const showActions = options.showActions !== false;
  const sharedBy = options.sharedBy || null;
  const customMessage = options.customMessage || null;

  // Determine card classes based on size
  let cardClasses = 'shared-spot-card bg-dark-secondary rounded-lg overflow-hidden border border-dark-border';
  let imageClasses = 'w-full object-cover';

  switch (size) {
    case 'compact':
      cardClasses += ' p-2';
      imageClasses += ' h-20';
      break;
    case 'large':
      cardClasses += ' p-4';
      imageClasses += ' h-48';
      break;
    default: // normal
      cardClasses += ' p-3';
      imageClasses += ' h-32';
  }

  // Build route info
  const routeInfo = spotData.from && spotData.to
    ? `${escapeHTML(spotData.from)} → ${escapeHTML(spotData.to)}`
    : escapeHTML(spotData.from || spotData.to || 'Spot');

  // Build rating display
  const rating = spotData.globalRating || spotData.rating || 0;
  const ratingDisplay = rating > 0
    ? `<div class="flex items-center gap-1">
        ${formatRatingStars(rating)}
        <span class="text-sm text-gray-400">(${rating.toFixed(1)})</span>
      </div>`
    : '<span class="text-sm text-gray-400">Pas encore note</span>';

  // Build stats
  const statsHtml = [];
  if (spotData.avgWaitTime) {
    statsHtml.push(`<span class="text-xs text-gray-400"><i class="fas fa-clock mr-1"></i>${spotData.avgWaitTime} min</span>`);
  }
  if (spotData.checkins > 0) {
    statsHtml.push(`<span class="text-xs text-gray-400"><i class="fas fa-check-circle mr-1"></i>${spotData.checkins} check-ins</span>`);
  }
  if (spotData.totalReviews > 0) {
    statsHtml.push(`<span class="text-xs text-gray-400"><i class="fas fa-comment mr-1"></i>${spotData.totalReviews} avis</span>`);
  }

  // Country flag
  const countryFlag = spotData.country
    ? `<span class="inline-block px-2 py-0.5 bg-dark-primary rounded text-xs">${escapeHTML(spotData.country)}</span>`
    : '';

  // Verified badge
  const verifiedBadge = spotData.verified
    ? '<span class="text-green-400 text-xs"><i class="fas fa-check-circle"></i> Verifie</span>'
    : '';

  // Image section
  const imageSection = spotData.photoUrl
    ? `<img src="${escapeHTML(spotData.photoUrl)}" alt="Photo du spot" class="${imageClasses}" loading="lazy" />`
    : `<div class="${imageClasses} bg-dark-primary flex items-center justify-center text-4xl">📍</div>`;

  // Action buttons
  const actionsHtml = showActions
    ? `<div class="flex gap-2 mt-3">
        <button onclick="window.viewSharedSpot('${spotData.id}')"
                class="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-sm py-1.5 px-3 rounded transition-colors"
                aria-label="Voir le spot">
          <i class="fas fa-eye mr-1"></i> Voir
        </button>
        <button onclick="window.navigateToSpot('${spotData.id}')"
                class="flex-1 bg-dark-primary hover:bg-dark-border text-white text-sm py-1.5 px-3 rounded transition-colors"
                aria-label="Y aller">
          <i class="fas fa-route mr-1"></i> Y aller
        </button>
      </div>`
    : '';

  // Shared by header
  const sharedByHtml = sharedBy
    ? `<div class="text-xs text-gray-400 mb-2">
        <i class="fas fa-share-alt mr-1"></i> Partage par ${escapeHTML(sharedBy)}
      </div>`
    : '';

  // Custom message
  const customMessageHtml = customMessage
    ? `<div class="text-sm text-gray-300 mb-2 italic">"${escapeHTML(customMessage)}"</div>`
    : '';

  return `
    <div class="${cardClasses}" data-spot-id="${spotData.id}" role="article" aria-label="Spot partage: ${escapeHTML(routeInfo)}">
      ${sharedByHtml}
      ${customMessageHtml}
      ${imageSection}
      <div class="mt-2">
        <div class="flex items-center justify-between">
          <h4 class="font-semibold text-white text-sm truncate flex-1">${routeInfo}</h4>
          ${countryFlag}
        </div>
        ${size !== 'compact' ? `<p class="text-xs text-gray-400 mt-1 line-clamp-2">${escapeHTML(spotData.description || '')}</p>` : ''}
        <div class="flex items-center justify-between mt-2">
          ${ratingDisplay}
          ${verifiedBadge}
        </div>
        ${statsHtml.length > 0 ? `<div class="flex gap-3 mt-2">${statsHtml.join('')}</div>` : ''}
        ${actionsHtml}
      </div>
    </div>
  `;
}

/**
 * Get all shared spots for a chat room
 * @param {string} chatRoomId - Chat room identifier
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of spots to return
 * @param {number} options.offset - Number of spots to skip
 * @param {string} options.sortBy - Sort field ('date', 'rating')
 * @param {string} options.sortOrder - Sort order ('asc', 'desc')
 * @returns {Array} Array of shared spot objects
 */
export function getSharedSpots(chatRoomId, options = {}) {
  // Validate chatRoomId
  if (!isValidChatRoomId(chatRoomId)) {
    return [];
  }

  const storage = getSharedSpotsStorage();
  let spots = storage[chatRoomId] || [];

  // Apply sorting
  const sortBy = options.sortBy || 'date';
  const sortOrder = options.sortOrder || 'desc';

  spots = [...spots].sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'date') {
      comparison = new Date(a.sharedAt) - new Date(b.sharedAt);
    } else if (sortBy === 'rating') {
      const ratingA = a.spotData?.globalRating || 0;
      const ratingB = b.spotData?.globalRating || 0;
      comparison = ratingA - ratingB;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Apply pagination
  const offset = options.offset || 0;
  const limit = options.limit || spots.length;

  return spots.slice(offset, offset + limit);
}

/**
 * Get shared spot by share ID
 * @param {string} shareId - The share ID
 * @returns {Object|null} Shared spot object or null
 */
export function getSharedSpotById(shareId) {
  if (!shareId) return null;

  const storage = getSharedSpotsStorage();

  for (const chatRoomId of Object.keys(storage)) {
    const found = storage[chatRoomId].find(s => s.id === shareId);
    if (found) return found;
  }

  return null;
}

/**
 * Get count of shared spots for a chat room
 * @param {string} chatRoomId - Chat room identifier
 * @returns {number} Count of shared spots
 */
export function getSharedSpotCount(chatRoomId) {
  if (!isValidChatRoomId(chatRoomId)) {
    return 0;
  }

  const storage = getSharedSpotsStorage();
  return (storage[chatRoomId] || []).length;
}

/**
 * Remove a shared spot
 * @param {string} shareId - The share ID to remove
 * @param {string} chatRoomId - The chat room ID
 * @returns {Object} Result with success status
 */
export function removeSharedSpot(shareId, chatRoomId) {
  if (!shareId || !isValidChatRoomId(chatRoomId)) {
    return { success: false, error: 'invalid_params' };
  }

  const storage = getSharedSpotsStorage();

  if (!storage[chatRoomId]) {
    return { success: false, error: 'chat_room_not_found' };
  }

  const currentUser = getCurrentUser();
  const state = getState();
  const userId = currentUser?.uid || state.user?.uid;

  const shareIndex = storage[chatRoomId].findIndex(s => s.id === shareId);

  if (shareIndex === -1) {
    return { success: false, error: 'share_not_found' };
  }

  // Check if user is the one who shared
  const share = storage[chatRoomId][shareIndex];
  if (share.sharedBy.id !== userId && userId !== 'admin') {
    return { success: false, error: 'not_authorized' };
  }

  // Remove the share
  storage[chatRoomId].splice(shareIndex, 1);
  saveSharedSpotsStorage(storage);

  // Update state
  const currentSharedSpots = state.sharedSpots || {};
  const updatedSharedSpots = {
    ...currentSharedSpots,
    [chatRoomId]: storage[chatRoomId],
  };
  setState({ sharedSpots: updatedSharedSpots });

  return { success: true };
}

/**
 * Get spots shared by a specific user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Array} Array of shared spots
 */
export function getSpotsByUser(userId, options = {}) {
  if (!userId) return [];

  const storage = getSharedSpotsStorage();
  let allShares = [];

  // Collect all shares from all chat rooms
  for (const chatRoomId of Object.keys(storage)) {
    const userShares = storage[chatRoomId].filter(s => s.sharedBy.id === userId);
    allShares = allShares.concat(userShares);
  }

  // Sort by date descending
  allShares.sort((a, b) => new Date(b.sharedAt) - new Date(a.sharedAt));

  // Apply limit
  const limit = options.limit || allShares.length;
  return allShares.slice(0, limit);
}

/**
 * Get unique spots shared in a chat room (no duplicates)
 * @param {string} chatRoomId - Chat room identifier
 * @returns {Array} Array of unique spot data
 */
export function getUniqueSharedSpots(chatRoomId) {
  if (!isValidChatRoomId(chatRoomId)) {
    return [];
  }

  const storage = getSharedSpotsStorage();
  const spots = storage[chatRoomId] || [];

  // Use Map to deduplicate by spotId
  const uniqueMap = new Map();
  spots.forEach(share => {
    if (!uniqueMap.has(share.spotId)) {
      uniqueMap.set(share.spotId, share);
    }
  });

  return Array.from(uniqueMap.values());
}

/**
 * Check if a spot has been shared in a chat room
 * @param {string|number} spotId - Spot ID
 * @param {string} chatRoomId - Chat room identifier
 * @returns {boolean} True if spot was shared
 */
export function isSpotSharedInRoom(spotId, chatRoomId) {
  if (!spotId || !isValidChatRoomId(chatRoomId)) {
    return false;
  }

  const storage = getSharedSpotsStorage();
  const spots = storage[chatRoomId] || [];

  return spots.some(s =>
    s.spotId === spotId ||
    s.spotId === String(spotId) ||
    String(s.spotId) === String(spotId)
  );
}

/**
 * Get most shared spots across all chat rooms
 * @param {number} limit - Maximum number to return
 * @returns {Array} Array of { spotId, spotData, shareCount }
 */
export function getMostSharedSpots(limit = 10) {
  const storage = getSharedSpotsStorage();
  const spotCounts = {};
  const spotDataMap = {};

  // Count shares per spot
  for (const chatRoomId of Object.keys(storage)) {
    storage[chatRoomId].forEach(share => {
      const spotId = share.spotId;
      spotCounts[spotId] = (spotCounts[spotId] || 0) + 1;
      if (!spotDataMap[spotId]) {
        spotDataMap[spotId] = share.spotData;
      }
    });
  }

  // Convert to array and sort
  const result = Object.entries(spotCounts)
    .map(([spotId, count]) => ({
      spotId,
      spotData: spotDataMap[spotId],
      shareCount: count,
    }))
    .sort((a, b) => b.shareCount - a.shareCount)
    .slice(0, limit);

  return result;
}

/**
 * Clear all shared spots for a chat room
 * @param {string} chatRoomId - Chat room identifier
 * @returns {Object} Result with success status
 */
export function clearChatRoomShares(chatRoomId) {
  if (!isValidChatRoomId(chatRoomId)) {
    return { success: false, error: 'invalid_chat_room' };
  }

  const storage = getSharedSpotsStorage();
  delete storage[chatRoomId];
  saveSharedSpotsStorage(storage);

  // Update state
  const state = getState();
  const currentSharedSpots = state.sharedSpots || {};
  delete currentSharedSpots[chatRoomId];
  setState({ sharedSpots: currentSharedSpots });

  return { success: true };
}

/**
 * Render a compact spot share preview for message input
 * @param {Object} spotData - Spot data
 * @returns {string} HTML string for preview
 */
export function renderSpotSharePreview(spotData) {
  if (!spotData) return '';

  const routeInfo = spotData.from && spotData.to
    ? `${escapeHTML(spotData.from)} → ${escapeHTML(spotData.to)}`
    : escapeHTML(spotData.from || spotData.to || 'Spot');

  return `
    <div class="spot-share-preview flex items-center gap-2 p-2 bg-dark-primary rounded border border-dark-border" data-spot-id="${spotData.id}">
      ${spotData.photoUrl
        ? `<img src="${escapeHTML(spotData.photoUrl)}" alt="" class="w-10 h-10 rounded object-cover" />`
        : '<div class="w-10 h-10 rounded bg-dark-secondary flex items-center justify-center">📍</div>'
      }
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-white truncate">${routeInfo}</div>
        <div class="text-xs text-gray-400">${spotData.country || ''} ${spotData.verified ? '✓' : ''}</div>
      </div>
      <button onclick="window.clearSpotSharePreview()" class="text-gray-400 hover:text-white p-1" aria-label="Retirer">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
}

/**
 * Search shared spots by query
 * @param {string} chatRoomId - Chat room identifier
 * @param {string} query - Search query
 * @returns {Array} Matching shared spots
 */
export function searchSharedSpots(chatRoomId, query) {
  if (!isValidChatRoomId(chatRoomId) || !query) {
    return [];
  }

  const storage = getSharedSpotsStorage();
  const spots = storage[chatRoomId] || [];
  const lowerQuery = query.toLowerCase();

  return spots.filter(share => {
    const spotData = share.spotData;
    return (
      (spotData.from && spotData.from.toLowerCase().includes(lowerQuery)) ||
      (spotData.to && spotData.to.toLowerCase().includes(lowerQuery)) ||
      (spotData.description && spotData.description.toLowerCase().includes(lowerQuery)) ||
      (spotData.country && spotData.country.toLowerCase().includes(lowerQuery)) ||
      (share.customMessage && share.customMessage.toLowerCase().includes(lowerQuery)) ||
      (share.sharedBy.name && share.sharedBy.name.toLowerCase().includes(lowerQuery))
    );
  });
}

/**
 * Get share statistics for a chat room
 * @param {string} chatRoomId - Chat room identifier
 * @returns {Object} Statistics object
 */
export function getChatRoomShareStats(chatRoomId) {
  if (!isValidChatRoomId(chatRoomId)) {
    return { totalShares: 0, uniqueSpots: 0, uniqueSharers: 0, avgRating: 0 };
  }

  const storage = getSharedSpotsStorage();
  const spots = storage[chatRoomId] || [];

  if (spots.length === 0) {
    return { totalShares: 0, uniqueSpots: 0, uniqueSharers: 0, avgRating: 0 };
  }

  const uniqueSpotIds = new Set(spots.map(s => s.spotId));
  const uniqueSharerIds = new Set(spots.map(s => s.sharedBy.id));

  const ratings = spots
    .map(s => s.spotData?.globalRating)
    .filter(r => r && r > 0);

  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
    : 0;

  return {
    totalShares: spots.length,
    uniqueSpots: uniqueSpotIds.size,
    uniqueSharers: uniqueSharerIds.size,
    avgRating: Math.round(avgRating * 100) / 100,
  };
}

// Register global handlers for onclick events
if (typeof window !== 'undefined') {
  window.viewSharedSpot = (spotId) => {
    const state = getState();
    const spot = getSpotById(spotId);
    if (spot) {
      setState({ selectedSpot: spot, activeTab: 'map' });
    }
  };

  window.navigateToSpot = (spotId) => {
    const spot = getSpotById(spotId);
    if (spot && spot.coordinates) {
      const { lat, lng } = spot.coordinates;
      if (lat && lng) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
      }
    }
  };

  window.clearSpotSharePreview = () => {
    const preview = document.querySelector('.spot-share-preview');
    if (preview) {
      preview.remove();
    }
    setState({ pendingSpotShare: null });
  };
}

// Export default object
export default {
  MessageType,
  shareSpotInChat,
  renderSharedSpot,
  getSharedSpots,
  getSharedSpotById,
  getSharedSpotCount,
  removeSharedSpot,
  getSpotsByUser,
  getUniqueSharedSpots,
  isSpotSharedInRoom,
  getMostSharedSpots,
  clearChatRoomShares,
  renderSpotSharePreview,
  searchSharedSpots,
  getChatRoomShareStats,
};
