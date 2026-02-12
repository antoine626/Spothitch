/**
 * Friends List Service
 * Feature #195 - Service pour la liste d'amis
 *
 * Gestion des amis, demandes d'ami, et interactions sociales
 * avec stockage local et synchronisation Firebase quand connecte.
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';
import { icon } from '../utils/icons.js'

// Storage keys
const FRIENDS_KEY = 'spothitch_friends';
const PENDING_REQUESTS_KEY = 'spothitch_friend_requests_pending';
const SENT_REQUESTS_KEY = 'spothitch_friend_requests_sent';

/**
 * Friend request/relationship status enum
 */
export const FriendStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
};

/**
 * Get friends from storage
 * @returns {Array} Array of friend objects
 */
function getFriendsFromStorage() {
  try {
    const data = Storage.get(FRIENDS_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[FriendsList] Error reading friends:', error);
    return [];
  }
}

/**
 * Save friends to storage
 * @param {Array} friends - Array of friend objects
 */
function saveFriendsToStorage(friends) {
  try {
    Storage.set(FRIENDS_KEY, friends);
    setState({ friends });
  } catch (error) {
    console.error('[FriendsList] Error saving friends:', error);
  }
}

/**
 * Get pending friend requests (received) from storage
 * @returns {Array} Array of pending request objects
 */
function getPendingRequestsFromStorage() {
  try {
    const data = Storage.get(PENDING_REQUESTS_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[FriendsList] Error reading pending requests:', error);
    return [];
  }
}

/**
 * Save pending requests to storage
 * @param {Array} requests - Array of pending request objects
 */
function savePendingRequestsToStorage(requests) {
  try {
    Storage.set(PENDING_REQUESTS_KEY, requests);
    setState({ friendRequests: requests });
  } catch (error) {
    console.error('[FriendsList] Error saving pending requests:', error);
  }
}

/**
 * Get sent friend requests from storage
 * @returns {Array} Array of sent request objects
 */
function getSentRequestsFromStorage() {
  try {
    const data = Storage.get(SENT_REQUESTS_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[FriendsList] Error reading sent requests:', error);
    return [];
  }
}

/**
 * Save sent requests to storage
 * @param {Array} requests - Array of sent request objects
 */
function saveSentRequestsToStorage(requests) {
  try {
    Storage.set(SENT_REQUESTS_KEY, requests);
  } catch (error) {
    console.error('[FriendsList] Error saving sent requests:', error);
  }
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
 * Format date for display
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Format relative time (e.g., "il y a 2 heures")
 * @param {string} dateStr - ISO date string
 * @returns {string} Relative time string
 */
function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('justNow') || 'A l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    return formatDate(dateStr);
  } catch {
    return '';
  }
}

/**
 * Send a friend request to a user
 * @param {string} userId - ID of the user to send request to
 * @param {string} username - Optional display name
 * @param {string} avatar - Optional avatar emoji
 * @returns {Object} Result object with success status
 */
export function sendFriendRequest(userId, username = '', avatar = '') {
  if (!userId) {
    return { success: false, error: 'invalid_user_id' };
  }

  const state = getState();
  const currentUserId = state.user?.uid;

  // Cannot send request to yourself
  if (currentUserId && userId === currentUserId) {
    showToast(t('cannotAddSelf') || 'Tu ne peux pas t\'ajouter toi-meme', 'warning');
    return { success: false, error: 'cannot_add_self' };
  }

  // Check if already friends
  const friends = getFriendsFromStorage();
  if (friends.some(f => f.id === userId)) {
    showToast(t('alreadyFriends') || 'Vous etes deja amis', 'warning');
    return { success: false, error: 'already_friends' };
  }

  // Check if request already sent
  const sentRequests = getSentRequestsFromStorage();
  if (sentRequests.some(r => r.id === userId)) {
    showToast(t('requestAlreadySent') || 'Demande deja envoyee', 'warning');
    return { success: false, error: 'request_already_sent' };
  }

  // Check if there's a pending request from this user
  const pendingRequests = getPendingRequestsFromStorage();
  if (pendingRequests.some(r => r.id === userId)) {
    // Auto-accept if they already sent us a request
    return acceptFriendRequest(userId);
  }

  // Create the request
  const request = {
    id: userId,
    username: username || userId,
    avatar: avatar || '',
    status: FriendStatus.PENDING,
    sentAt: new Date().toISOString(),
    sentBy: currentUserId || 'anonymous',
  };

  // Add to sent requests
  sentRequests.push(request);
  saveSentRequestsToStorage(sentRequests);

  showToast(t('friendRequestSent') || 'Demande d\'ami envoyee !', 'success');

  return { success: true, request };
}

/**
 * Accept a friend request
 * @param {string} requestId - ID of the request/user to accept
 * @returns {Object} Result object with success status
 */
export function acceptFriendRequest(requestId) {
  if (!requestId) {
    return { success: false, error: 'invalid_request_id' };
  }

  const pendingRequests = getPendingRequestsFromStorage();
  const requestIndex = pendingRequests.findIndex(r => r.id === requestId);

  // Also check sent requests (in case of mutual request)
  const sentRequests = getSentRequestsFromStorage();
  const sentIndex = sentRequests.findIndex(r => r.id === requestId);

  // Find the request in either list
  let request = null;
  if (requestIndex !== -1) {
    request = pendingRequests[requestIndex];
    pendingRequests.splice(requestIndex, 1);
    savePendingRequestsToStorage(pendingRequests);
  } else if (sentIndex !== -1) {
    request = sentRequests[sentIndex];
    sentRequests.splice(sentIndex, 1);
    saveSentRequestsToStorage(sentRequests);
  } else {
    showToast(t('requestNotFound') || 'Demande introuvable', 'warning');
    return { success: false, error: 'request_not_found' };
  }

  // Add to friends
  const friends = getFriendsFromStorage();
  const newFriend = {
    id: request.id,
    username: request.username || request.id,
    avatar: request.avatar || '',
    friendsSince: new Date().toISOString(),
    lastSeen: null,
    status: FriendStatus.ACCEPTED,
  };

  friends.push(newFriend);
  saveFriendsToStorage(friends);

  showToast(t('friendRequestAccepted') || 'Demande acceptee ! Vous etes maintenant amis.', 'success');

  return { success: true, friend: newFriend };
}

/**
 * Decline a friend request
 * @param {string} requestId - ID of the request/user to decline
 * @returns {Object} Result object with success status
 */
export function declineFriendRequest(requestId) {
  if (!requestId) {
    return { success: false, error: 'invalid_request_id' };
  }

  const pendingRequests = getPendingRequestsFromStorage();
  const requestIndex = pendingRequests.findIndex(r => r.id === requestId);

  if (requestIndex === -1) {
    showToast(t('requestNotFound') || 'Demande introuvable', 'warning');
    return { success: false, error: 'request_not_found' };
  }

  // Remove from pending
  pendingRequests.splice(requestIndex, 1);
  savePendingRequestsToStorage(pendingRequests);

  showToast(t('friendRequestDeclined') || 'Demande refusee', 'info');

  return { success: true };
}

/**
 * Cancel a sent friend request
 * @param {string} requestId - ID of the request/user to cancel
 * @returns {Object} Result object with success status
 */
export function cancelFriendRequest(requestId) {
  if (!requestId) {
    return { success: false, error: 'invalid_request_id' };
  }

  const sentRequests = getSentRequestsFromStorage();
  const requestIndex = sentRequests.findIndex(r => r.id === requestId);

  if (requestIndex === -1) {
    return { success: false, error: 'request_not_found' };
  }

  // Remove from sent
  sentRequests.splice(requestIndex, 1);
  saveSentRequestsToStorage(sentRequests);

  showToast(t('friendRequestCancelled') || 'Demande annulee', 'info');

  return { success: true };
}

/**
 * Remove a friend
 * @param {string} userId - ID of the friend to remove
 * @returns {Object} Result object with success status
 */
export function removeFriend(userId) {
  if (!userId) {
    return { success: false, error: 'invalid_user_id' };
  }

  const friends = getFriendsFromStorage();
  const friendIndex = friends.findIndex(f => f.id === userId);

  if (friendIndex === -1) {
    showToast(t('notFriends') || 'Cette personne n\'est pas dans vos amis', 'warning');
    return { success: false, error: 'not_friends' };
  }

  // Remove from friends
  const removedFriend = friends[friendIndex];
  friends.splice(friendIndex, 1);
  saveFriendsToStorage(friends);

  showToast(t('friendRemoved') || 'Ami supprime', 'info');

  return { success: true, removedFriend };
}

/**
 * Get list of friends
 * @returns {Array} Array of friend objects
 */
export function getFriends() {
  return getFriendsFromStorage();
}

/**
 * Get pending friend requests (received)
 * @returns {Array} Array of pending request objects
 */
export function getPendingRequests() {
  return getPendingRequestsFromStorage();
}

/**
 * Get sent friend requests
 * @returns {Array} Array of sent request objects
 */
export function getSentRequests() {
  return getSentRequestsFromStorage();
}

/**
 * Check if a user is a friend
 * @param {string} userId - ID of the user to check
 * @returns {boolean} True if the user is a friend
 */
export function isFriend(userId) {
  if (!userId) return false;
  const friends = getFriendsFromStorage();
  return friends.some(f => f.id === userId);
}

/**
 * Get number of friends
 * @returns {number} Number of friends
 */
export function getFriendCount() {
  const friends = getFriendsFromStorage();
  return friends.length;
}

/**
 * Get a friend by ID
 * @param {string} userId - ID of the friend
 * @returns {Object|null} Friend object or null
 */
export function getFriendById(userId) {
  if (!userId) return null;
  const friends = getFriendsFromStorage();
  return friends.find(f => f.id === userId) || null;
}

/**
 * Update friend's last seen time
 * @param {string} userId - ID of the friend
 * @param {string} lastSeen - ISO date string
 * @returns {Object} Result object with success status
 */
export function updateFriendLastSeen(userId, lastSeen = null) {
  if (!userId) {
    return { success: false, error: 'invalid_user_id' };
  }

  const friends = getFriendsFromStorage();
  const friendIndex = friends.findIndex(f => f.id === userId);

  if (friendIndex === -1) {
    return { success: false, error: 'not_friends' };
  }

  friends[friendIndex].lastSeen = lastSeen || new Date().toISOString();
  saveFriendsToStorage(friends);

  return { success: true };
}

/**
 * Search friends by name
 * @param {string} query - Search query
 * @returns {Array} Matching friends
 */
export function searchFriends(query) {
  if (!query) return getFriendsFromStorage();

  const friends = getFriendsFromStorage();
  const lowerQuery = query.toLowerCase();

  return friends.filter(f =>
    f.username?.toLowerCase().includes(lowerQuery) ||
    f.id?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get friendship statistics
 * @returns {Object} Statistics object
 */
export function getFriendshipStats() {
  const friends = getFriendsFromStorage();
  const pendingRequests = getPendingRequestsFromStorage();
  const sentRequests = getSentRequestsFromStorage();

  // Find oldest friend
  const oldestFriend = friends.length > 0
    ? friends.reduce((oldest, f) =>
        new Date(f.friendsSince) < new Date(oldest.friendsSince) ? f : oldest
      )
    : null;

  // Find newest friend
  const newestFriend = friends.length > 0
    ? friends.reduce((newest, f) =>
        new Date(f.friendsSince) > new Date(newest.friendsSince) ? f : newest
      )
    : null;

  return {
    totalFriends: friends.length,
    pendingRequestsCount: pendingRequests.length,
    sentRequestsCount: sentRequests.length,
    oldestFriend,
    newestFriend,
  };
}

/**
 * Add a mock friend request (for testing/demo)
 * @param {Object} requestData - Request data
 * @returns {Object} Result object
 */
export function addMockFriendRequest(requestData) {
  if (!requestData?.id) {
    return { success: false, error: 'invalid_request_data' };
  }

  const pendingRequests = getPendingRequestsFromStorage();

  // Check if already exists
  if (pendingRequests.some(r => r.id === requestData.id)) {
    return { success: false, error: 'request_exists' };
  }

  const request = {
    id: requestData.id,
    username: requestData.username || requestData.id,
    avatar: requestData.avatar || '',
    status: FriendStatus.PENDING,
    sentAt: requestData.sentAt || new Date().toISOString(),
  };

  pendingRequests.push(request);
  savePendingRequestsToStorage(pendingRequests);

  return { success: true, request };
}

/**
 * Clear all friends data (for testing or reset)
 * @returns {Object} Result object
 */
export function clearAllFriendsData() {
  saveFriendsToStorage([]);
  savePendingRequestsToStorage([]);
  saveSentRequestsToStorage([]);

  showToast(t('friendsDataCleared') || 'Donnees d\'amis effacees', 'info');

  return { success: true };
}

/**
 * Render a friend card HTML
 * @param {Object} friend - Friend object
 * @returns {string} HTML string
 */
export function renderFriendCard(friend) {
  if (!friend || !friend.id) return '';

  const avatar = friend.avatar || '';
  const username = escapeHTML(friend.username || friend.id);
  const friendsSince = formatDate(friend.friendsSince);
  const lastSeen = friend.lastSeen ? formatRelativeTime(friend.lastSeen) : null;

  return `
    <div
      class="friend-card flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
      data-friend-id="${escapeHTML(friend.id)}"
      role="listitem"
    >
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-2xl">
          ${avatar ? escapeHTML(avatar) : icon('user', 'w-5 h-5 text-white')}
        </div>
        <div>
          <div class="font-medium text-white">${username}</div>
          <div class="text-xs text-slate-400 flex items-center gap-2">
            ${icon('calendar-alt', 'w-5 h-5')}
            <span>${t('friendsSince') || 'Amis depuis'} ${escapeHTML(friendsSince)}</span>
            ${lastSeen ? `
              <span class="text-slate-500">|</span>
              ${icon('clock', 'w-5 h-5')}
              <span>${escapeHTML(lastSeen)}</span>
            ` : ''}
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          onclick="openFriendChat('${escapeHTML(friend.id)}')"
          class="btn btn-sm bg-primary-500/20 hover:bg-primary-500/30 text-primary-400"
          aria-label="${t('sendMessage') || 'Envoyer un message'}"
        >
          ${icon('comment', 'w-5 h-5')}
        </button>
        <button
          onclick="openFriendProfile('${escapeHTML(friend.id)}')"
          class="btn btn-sm bg-white/10 hover:bg-white/20 text-white"
          aria-label="${t('viewProfile') || 'Voir le profil'}"
        >
          ${icon('user', 'w-5 h-5')}
        </button>
        <button
          onclick="confirmRemoveFriend('${escapeHTML(friend.id)}', '${username}')"
          class="btn btn-sm bg-danger-500/20 hover:bg-danger-500/30 text-danger-400"
          aria-label="${t('removeFriend') || 'Supprimer'}"
        >
          ${icon('user-minus', 'w-5 h-5')}
        </button>
      </div>
    </div>
  `;
}

/**
 * Render a friend request card HTML
 * @param {Object} request - Request object
 * @param {string} type - 'received' or 'sent'
 * @returns {string} HTML string
 */
export function renderFriendRequestCard(request, type = 'received') {
  if (!request || !request.id) return '';

  const avatar = request.avatar || '';
  const username = escapeHTML(request.username || request.id);
  const sentAt = formatRelativeTime(request.sentAt);

  if (type === 'sent') {
    return `
      <div
        class="friend-request-card flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
        data-request-id="${escapeHTML(request.id)}"
        role="listitem"
      >
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-2xl">
            ${avatar ? escapeHTML(avatar) : icon('user-clock', 'w-5 h-5 text-white')}
          </div>
          <div>
            <div class="font-medium text-white">${username}</div>
            <div class="text-xs text-slate-400 flex items-center gap-2">
              ${icon('paper-plane', 'w-5 h-5')}
              <span>${t('requestSent') || 'Envoyee'} ${escapeHTML(sentAt)}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
            ${t('pending') || 'En attente'}
          </span>
          <button
            onclick="cancelFriendRequestHandler('${escapeHTML(request.id)}')"
            class="btn btn-sm bg-white/10 hover:bg-white/20 text-white"
            aria-label="${t('cancelRequest') || 'Annuler'}"
          >
            ${icon('times', 'w-5 h-5')}
          </button>
        </div>
      </div>
    `;
  }

  // Received request
  return `
    <div
      class="friend-request-card flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
      data-request-id="${escapeHTML(request.id)}"
      role="listitem"
    >
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-2xl">
          ${avatar ? escapeHTML(avatar) : icon('user-plus', 'w-5 h-5 text-white')}
        </div>
        <div>
          <div class="font-medium text-white">${username}</div>
          <div class="text-xs text-slate-400 flex items-center gap-2">
            ${icon('inbox', 'w-5 h-5')}
            <span>${t('receivedAt') || 'Recue'} ${escapeHTML(sentAt)}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          onclick="acceptFriendRequestHandler('${escapeHTML(request.id)}')"
          class="btn btn-sm btn-primary"
          aria-label="${t('acceptRequest') || 'Accepter'}"
        >
          ${icon('check', 'w-5 h-5 mr-1')}
          ${t('accept') || 'Accepter'}
        </button>
        <button
          onclick="declineFriendRequestHandler('${escapeHTML(request.id)}')"
          class="btn btn-sm bg-white/10 hover:bg-white/20 text-white"
          aria-label="${t('declineRequest') || 'Refuser'}"
        >
          ${icon('times', 'w-5 h-5')}
        </button>
      </div>
    </div>
  `;
}

/**
 * Render the friends list HTML
 * @param {Object} options - Render options
 * @returns {string} HTML string
 */
export function renderFriendsList(options = {}) {
  const { showRequests = true, searchQuery = '' } = options;

  const friends = searchQuery ? searchFriends(searchQuery) : getFriendsFromStorage();
  const pendingRequests = getPendingRequestsFromStorage();
  const sentRequests = getSentRequestsFromStorage();

  let html = '';

  // Pending requests section (received)
  if (showRequests && pendingRequests.length > 0) {
    html += `
      <div class="pending-requests-section mb-6">
        <h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          ${icon('user-plus', 'w-5 h-5 text-primary-400')}
          ${t('pendingRequests') || 'Demandes recues'}
          <span class="ml-auto px-2 py-1 text-xs bg-primary-500/20 text-primary-400 rounded-full">
            ${pendingRequests.length}
          </span>
        </h3>
        <div class="space-y-2" role="list" aria-label="${t('pendingRequests') || 'Demandes recues'}">
          ${pendingRequests.map(r => renderFriendRequestCard(r, 'received')).join('')}
        </div>
      </div>
    `;
  }

  // Sent requests section
  if (showRequests && sentRequests.length > 0) {
    html += `
      <div class="sent-requests-section mb-6">
        <h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          ${icon('paper-plane', 'w-5 h-5 text-yellow-400')}
          ${t('sentRequests') || 'Demandes envoyees'}
          <span class="ml-auto px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
            ${sentRequests.length}
          </span>
        </h3>
        <div class="space-y-2" role="list" aria-label="${t('sentRequests') || 'Demandes envoyees'}">
          ${sentRequests.map(r => renderFriendRequestCard(r, 'sent')).join('')}
        </div>
      </div>
    `;
  }

  // Friends list
  if (friends.length === 0) {
    html += `
      <div class="empty-state p-8 text-center" role="status" aria-live="polite">
        <div class="text-6xl mb-4">🤝</div>
        <h3 class="text-lg font-semibold text-white mb-2">${escapeHTML(t('noFriends') || 'Pas encore d\'amis')}</h3>
        <p class="text-slate-400 text-sm mb-4">${escapeHTML(t('noFriendsDesc') || 'Commence a ajouter des compagnons de route !')}</p>
        <button
          onclick="openFindFriends()"
          class="btn btn-primary"
        >
          ${icon('search', 'w-5 h-5 mr-2')}
          ${t('findFriends') || 'Trouver des amis'}
        </button>
      </div>
    `;
  } else {
    html += `
      <div class="friends-section">
        <h3 class="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          ${icon('users', 'w-5 h-5 text-primary-400')}
          ${t('myFriends') || 'Mes amis'}
          <span class="ml-auto px-2 py-1 text-xs bg-primary-500/20 text-primary-400 rounded-full">
            ${friends.length}
          </span>
        </h3>
        <div class="space-y-2" role="list" aria-label="${t('myFriends') || 'Mes amis'}">
          ${friends.map(f => renderFriendCard(f)).join('')}
        </div>
      </div>
    `;
  }

  return `
    <div class="friends-list-container">
      ${html}
    </div>
  `;
}

// Global handlers for onclick events
window.acceptFriendRequestHandler = (requestId) => {
  acceptFriendRequest(requestId);
};

window.declineFriendRequestHandler = (requestId) => {
  declineFriendRequest(requestId);
};

window.cancelFriendRequestHandler = (requestId) => {
  cancelFriendRequest(requestId);
};

window.confirmRemoveFriend = (userId, username) => {
  const confirmed = window.confirm(
    `${t('confirmRemoveFriend') || 'Supprimer'} ${username} ${t('fromFriends') || 'de vos amis'} ?`
  );
  if (confirmed) {
    removeFriend(userId);
  }
};

window.openFriendChat = (userId) => {
  setState({
    selectedFriendChat: userId,
    activeTab: 'chat',
    socialSubTab: 'friends',
  });
};

window.openFriendProfile = (userId) => {
  setState({
    selectedProfile: userId,
    showProfileModal: true,
  });
};

window.openFindFriends = () => {
  setState({
    showFindFriends: true,
  });
};

window.sendFriendRequestHandler = (userId, username, avatar) => {
  sendFriendRequest(userId, username, avatar);
};

// Export default with all functions
export default {
  FriendStatus,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
  getSentRequests,
  isFriend,
  getFriendCount,
  getFriendById,
  updateFriendLastSeen,
  searchFriends,
  getFriendshipStats,
  addMockFriendRequest,
  clearAllFriendsData,
  renderFriendCard,
  renderFriendRequestCard,
  renderFriendsList,
};
