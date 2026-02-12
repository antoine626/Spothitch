/**
 * User Blocking Service
 * Feature #193 - Service pour bloquer un utilisateur
 *
 * Gestion du blocage/deblocage des utilisateurs avec stockage local
 * et synchronisation Firebase quand connecté.
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';
import { icon } from '../utils/icons.js'

// Storage key for blocked users
const BLOCKED_USERS_KEY = 'spothitch_blocked_users';
const BLOCKED_BY_KEY = 'spothitch_blocked_by';

/**
 * Block reasons enum
 */
export const BlockReasons = {
  HARASSMENT: { id: 'harassment', label: 'Harcelement', icon: 'fa-user-slash' },
  SPAM: { id: 'spam', label: 'Spam', icon: 'fa-ad' },
  INAPPROPRIATE: { id: 'inappropriate', label: 'Contenu inapproprie', icon: 'fa-ban' },
  FAKE_PROFILE: { id: 'fake_profile', label: 'Faux profil', icon: 'fa-user-secret' },
  SCAM: { id: 'scam', label: 'Arnaque', icon: 'fa-hand-holding-usd' },
  DANGEROUS: { id: 'dangerous', label: 'Comportement dangereux', icon: 'fa-exclamation-triangle' },
  PERSONAL: { id: 'personal', label: 'Raison personnelle', icon: 'fa-user-times' },
  OTHER: { id: 'other', label: 'Autre', icon: 'fa-question-circle' },
};

/**
 * Get blocked users from storage
 * @returns {Array} Array of blocked user objects
 */
function getBlockedUsersFromStorage() {
  try {
    const data = Storage.get(BLOCKED_USERS_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error reading blocked users:', error);
    return [];
  }
}

/**
 * Save blocked users to storage
 * @param {Array} blockedUsers - Array of blocked user objects
 */
function saveBlockedUsersToStorage(blockedUsers) {
  try {
    Storage.set(BLOCKED_USERS_KEY, blockedUsers);
    setState({ blockedUsers });
  } catch (error) {
    console.error('Error saving blocked users:', error);
  }
}

/**
 * Get count of users who blocked us (for moderation)
 * @returns {Array} Array of user IDs who blocked us
 */
function getBlockedByFromStorage() {
  try {
    const data = Storage.get(BLOCKED_BY_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error reading blocked by data:', error);
    return [];
  }
}

/**
 * Block a user
 * @param {string} userId - ID of the user to block
 * @param {string} reason - Optional reason for blocking (BlockReasons id)
 * @returns {Object} Result object with success status and blocked user data
 */
export function blockUser(userId, reason = null) {
  if (!userId) {
    return { success: false, error: 'invalid_user_id' };
  }

  const state = getState();
  const currentUserId = state.user?.uid;

  // Cannot block yourself
  if (currentUserId && userId === currentUserId) {
    showToast(t('cannotBlockSelf') || 'Tu ne peux pas te bloquer toi-meme', 'warning');
    return { success: false, error: 'cannot_block_self' };
  }

  const blockedUsers = getBlockedUsersFromStorage();

  // Check if already blocked
  if (blockedUsers.some(b => b.id === userId)) {
    showToast(t('userAlreadyBlocked') || 'Cet utilisateur est deja bloque', 'warning');
    return { success: false, error: 'already_blocked' };
  }

  // Create blocked user entry
  const blockedUser = {
    id: userId,
    reason: reason || null,
    blockedAt: new Date().toISOString(),
    blockedBy: currentUserId || 'anonymous',
  };

  // Add to blocked list
  blockedUsers.push(blockedUser);
  saveBlockedUsersToStorage(blockedUsers);

  // Remove from friends if present
  const friends = state.friends || [];
  const updatedFriends = friends.filter(f => f.id !== userId);
  if (friends.length !== updatedFriends.length) {
    setState({ friends: updatedFriends });
  }

  // Remove from friend requests if present
  const friendRequests = state.friendRequests || [];
  const updatedRequests = friendRequests.filter(r => r.id !== userId);
  if (friendRequests.length !== updatedRequests.length) {
    setState({ friendRequests: updatedRequests });
  }

  showToast(t('userBlocked') || 'Utilisateur bloque', 'success');

  return { success: true, blockedUser };
}

/**
 * Unblock a user
 * @param {string} userId - ID of the user to unblock
 * @returns {Object} Result object with success status
 */
export function unblockUser(userId) {
  if (!userId) {
    return { success: false, error: 'invalid_user_id' };
  }

  const blockedUsers = getBlockedUsersFromStorage();

  // Check if user is blocked
  const blockedIndex = blockedUsers.findIndex(b => b.id === userId);
  if (blockedIndex === -1) {
    showToast(t('userNotBlocked') || 'Cet utilisateur n\'est pas bloque', 'warning');
    return { success: false, error: 'not_blocked' };
  }

  // Remove from blocked list
  blockedUsers.splice(blockedIndex, 1);
  saveBlockedUsersToStorage(blockedUsers);

  showToast(t('userUnblocked') || 'Utilisateur debloque', 'success');

  return { success: true };
}

/**
 * Check if a user is blocked
 * @param {string} userId - ID of the user to check
 * @returns {boolean} True if the user is blocked
 */
export function isUserBlocked(userId) {
  if (!userId) return false;

  const blockedUsers = getBlockedUsersFromStorage();
  return blockedUsers.some(b => b.id === userId);
}

/**
 * Get list of blocked users
 * @returns {Array} Array of blocked user objects with id, reason, blockedAt
 */
export function getBlockedUsers() {
  return getBlockedUsersFromStorage();
}

/**
 * Get count of people who blocked us (for moderation/trust score)
 * Note: In a real app, this would come from Firebase
 * @returns {number} Number of users who blocked us
 */
export function getBlockedByCount() {
  const blockedByList = getBlockedByFromStorage();
  return blockedByList.length;
}

/**
 * Check if we can interact with a user (not blocked mutually)
 * @param {string} userId - ID of the user to check
 * @returns {boolean} True if we can interact with the user
 */
export function canInteractWith(userId) {
  if (!userId) return false;

  // Check if we blocked them
  if (isUserBlocked(userId)) {
    return false;
  }

  // Check if they blocked us (would come from Firebase in real app)
  const blockedByList = getBlockedByFromStorage();
  if (blockedByList.includes(userId)) {
    return false;
  }

  return true;
}

/**
 * Get blocked user details by ID
 * @param {string} userId - ID of the blocked user
 * @returns {Object|null} Blocked user details or null if not found
 */
export function getBlockedUserDetails(userId) {
  if (!userId) return null;

  const blockedUsers = getBlockedUsersFromStorage();
  return blockedUsers.find(b => b.id === userId) || null;
}

/**
 * Update block reason for a user
 * @param {string} userId - ID of the blocked user
 * @param {string} newReason - New reason for blocking
 * @returns {Object} Result object with success status
 */
export function updateBlockReason(userId, newReason) {
  if (!userId) {
    return { success: false, error: 'invalid_user_id' };
  }

  const blockedUsers = getBlockedUsersFromStorage();
  const blockedIndex = blockedUsers.findIndex(b => b.id === userId);

  if (blockedIndex === -1) {
    return { success: false, error: 'not_blocked' };
  }

  blockedUsers[blockedIndex].reason = newReason;
  blockedUsers[blockedIndex].updatedAt = new Date().toISOString();
  saveBlockedUsersToStorage(blockedUsers);

  return { success: true };
}

/**
 * Get all block reasons
 * @returns {Array} Array of block reason objects
 */
export function getBlockReasons() {
  return Object.values(BlockReasons);
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
 * Get reason label by ID
 * @param {string} reasonId - Reason ID
 * @returns {string} Reason label
 */
function getReasonLabel(reasonId) {
  if (!reasonId) return t('noReasonSpecified') || 'Aucune raison specifiee';
  const reason = Object.values(BlockReasons).find(r => r.id === reasonId);
  return reason ? reason.label : reasonId;
}

/**
 * Get reason icon by ID
 * @param {string} reasonId - Reason ID
 * @returns {string} FontAwesome icon class
 */
function getReasonIcon(reasonId) {
  if (!reasonId) return 'fa-question';
  const reason = Object.values(BlockReasons).find(r => r.id === reasonId);
  return reason ? reason.icon : 'fa-question-circle';
}

/**
 * Render the blocked users list HTML
 * @returns {string} HTML string of blocked users list
 */
export function renderBlockedUsersList() {
  const blockedUsers = getBlockedUsersFromStorage();

  if (blockedUsers.length === 0) {
    return `
      <div class="empty-state p-8 text-center" role="status" aria-live="polite">
        <div class="text-6xl mb-4">🤝</div>
        <h3 class="text-lg font-semibold text-white mb-2">${escapeHTML(t('noBlockedUsers') || 'Aucun utilisateur bloque')}</h3>
        <p class="text-slate-400 text-sm">${escapeHTML(t('noBlockedUsersDesc') || 'Tu n\'as bloque personne pour le moment')}</p>
      </div>
    `;
  }

  const listItems = blockedUsers.map(user => `
    <div
      class="blocked-user-item flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
      data-user-id="${escapeHTML(user.id)}"
      role="listitem"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-danger-500/20 flex items-center justify-center">
          ${icon('user-slash', 'w-5 h-5 text-danger-400')}
        </div>
        <div>
          <div class="font-medium text-white">${escapeHTML(user.id)}</div>
          <div class="text-xs text-slate-400 flex items-center gap-2">
            ${icon(escapeHTML(getReasonIcon(user.reason)), 'w-5 h-5')}
            <span>${escapeHTML(getReasonLabel(user.reason))}</span>
            <span class="text-slate-500">•</span>
            <span>${escapeHTML(formatDate(user.blockedAt))}</span>
          </div>
        </div>
      </div>
      <button
        onclick="unblockUserById('${escapeHTML(user.id)}')"
        class="btn btn-sm bg-white/10 hover:bg-white/20 text-white"
        aria-label="${escapeHTML(t('unblockUser') || 'Debloquer')} ${escapeHTML(user.id)}"
      >
        ${icon('unlock', 'w-5 h-5 mr-1')}
        ${escapeHTML(t('unblockUser') || 'Debloquer')}
      </button>
    </div>
  `).join('');

  return `
    <div class="blocked-users-list space-y-3" role="list" aria-label="${escapeHTML(t('blockedUsers') || 'Utilisateurs bloques')}">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">
          ${icon('ban', 'w-5 h-5 mr-2 text-danger-400')}
          ${escapeHTML(t('blockedUsers') || 'Utilisateurs bloques')}
          <span class="text-sm font-normal text-slate-400 ml-2">(${blockedUsers.length})</span>
        </h3>
      </div>
      ${listItems}
    </div>
  `;
}

/**
 * Render block/unblock button for a user
 * @param {string} userId - ID of the user
 * @param {string} username - Display name of the user
 * @returns {string} HTML string of block/unblock button
 */
export function renderBlockButton(userId, username = '') {
  if (!userId) return '';

  const state = getState();
  const currentUserId = state.user?.uid;

  // Don't show block button for self
  if (currentUserId && userId === currentUserId) {
    return '';
  }

  const isBlocked = isUserBlocked(userId);
  const displayName = username || userId;

  if (isBlocked) {
    return `
      <button
        onclick="unblockUserById('${escapeHTML(userId)}')"
        class="btn btn-sm bg-primary-500/20 hover:bg-primary-500/30 text-primary-400"
        aria-label="${escapeHTML(t('unblockUser') || 'Debloquer')} ${escapeHTML(displayName)}"
        data-user-id="${escapeHTML(userId)}"
        data-action="unblock"
      >
        ${icon('unlock', 'w-5 h-5 mr-1')}
        ${escapeHTML(t('unblockUser') || 'Debloquer')}
      </button>
    `;
  }

  return `
    <button
      onclick="openBlockModal('${escapeHTML(userId)}', '${escapeHTML(displayName)}')"
      class="btn btn-sm bg-danger-500/20 hover:bg-danger-500/30 text-danger-400"
      aria-label="${escapeHTML(t('blockUser') || 'Bloquer')} ${escapeHTML(displayName)}"
      data-user-id="${escapeHTML(userId)}"
      data-action="block"
    >
      ${icon('ban', 'w-5 h-5 mr-1')}
      ${escapeHTML(t('blockUser') || 'Bloquer')}
    </button>
  `;
}

/**
 * Render block confirmation modal
 * @param {string} userId - ID of the user to block
 * @param {string} username - Display name of the user
 * @returns {string} HTML string of block modal
 */
export function renderBlockModal(userId, username = '') {
  if (!userId) return '';

  const displayName = username || userId;
  const reasons = getBlockReasons();

  return `
    <div
      class="block-modal fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onclick="if(event.target===this)closeBlockModal()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="block-modal-title"
    >
      <div class="modal-panel w-full max-w-md rounded-2xl overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-danger-500 to-orange-500 p-6">
          <div class="flex justify-between items-start">
            <div>
              <h2 id="block-modal-title" class="text-xl font-bold text-white">
                ${icon('ban', 'w-5 h-5 mr-2')}
                ${escapeHTML(t('confirmBlock') || 'Bloquer cet utilisateur ?')}
              </h2>
              <p class="text-white/80 text-sm mt-1">${escapeHTML(displayName)}</p>
            </div>
            <button
              onclick="closeBlockModal()"
              class="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-all"
              aria-label="${escapeHTML(t('close') || 'Fermer')}"
            >
              ${icon('times', 'w-5 h-5')}
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <p class="text-slate-300 mb-4">
            ${escapeHTML(t('blockWarning') || 'En bloquant cet utilisateur, vous ne pourrez plus voir ses messages et il ne pourra plus vous contacter.')}
          </p>

          <!-- Reason selection -->
          <div class="mb-4">
            <label class="block text-sm text-slate-400 mb-2">
              ${escapeHTML(t('blockReason') || 'Raison du blocage (optionnel)')}
            </label>
            <select
              id="block-reason-select"
              class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">${escapeHTML(t('selectReason') || 'Selectionner une raison...')}</option>
              ${reasons.map(r => `
                <option value="${escapeHTML(r.id)}">${escapeHTML(r.label)}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-4 border-t border-white/10 flex gap-3">
          <button
            onclick="closeBlockModal()"
            class="btn flex-1 bg-white/10 hover:bg-white/20 text-white"
          >
            ${escapeHTML(t('cancel') || 'Annuler')}
          </button>
          <button
            onclick="confirmBlockUser('${escapeHTML(userId)}')"
            class="btn flex-1 btn-danger"
          >
            ${icon('ban', 'w-5 h-5 mr-2')}
            ${escapeHTML(t('blockUser') || 'Bloquer')}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render unblock confirmation modal
 * @param {string} userId - ID of the user to unblock
 * @param {string} username - Display name of the user
 * @returns {string} HTML string of unblock modal
 */
export function renderUnblockModal(userId, username = '') {
  if (!userId) return '';

  const displayName = username || userId;

  return `
    <div
      class="unblock-modal fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onclick="if(event.target===this)closeUnblockModal()"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unblock-modal-title"
    >
      <div class="modal-panel w-full max-w-md rounded-2xl overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-primary-500 to-teal-500 p-6">
          <div class="flex justify-between items-start">
            <div>
              <h2 id="unblock-modal-title" class="text-xl font-bold text-white">
                ${icon('unlock', 'w-5 h-5 mr-2')}
                ${escapeHTML(t('confirmUnblock') || 'Debloquer cet utilisateur ?')}
              </h2>
              <p class="text-white/80 text-sm mt-1">${escapeHTML(displayName)}</p>
            </div>
            <button
              onclick="closeUnblockModal()"
              class="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-all"
              aria-label="${escapeHTML(t('close') || 'Fermer')}"
            >
              ${icon('times', 'w-5 h-5')}
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <p class="text-slate-300">
            ${escapeHTML(t('unblockWarning') || 'Cet utilisateur pourra a nouveau vous contacter et voir votre profil.')}
          </p>
        </div>

        <!-- Actions -->
        <div class="p-4 border-t border-white/10 flex gap-3">
          <button
            onclick="closeUnblockModal()"
            class="btn flex-1 bg-white/10 hover:bg-white/20 text-white"
          >
            ${escapeHTML(t('cancel') || 'Annuler')}
          </button>
          <button
            onclick="confirmUnblockUser('${escapeHTML(userId)}')"
            class="btn flex-1 btn-primary"
          >
            ${icon('unlock', 'w-5 h-5 mr-2')}
            ${escapeHTML(t('unblockUser') || 'Debloquer')}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Clear all blocked users (for testing or reset)
 * @returns {Object} Result object with success status
 */
export function clearAllBlockedUsers() {
  saveBlockedUsersToStorage([]);
  showToast(t('allUsersUnblocked') || 'Tous les utilisateurs ont ete debloques', 'success');
  return { success: true };
}

/**
 * Get blocking statistics
 * @returns {Object} Statistics object
 */
export function getBlockingStats() {
  const blockedUsers = getBlockedUsersFromStorage();
  const blockedByCount = getBlockedByCount();

  // Group by reason
  const reasonCounts = {};
  blockedUsers.forEach(user => {
    const reason = user.reason || 'none';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  });

  return {
    totalBlocked: blockedUsers.length,
    blockedByCount: blockedByCount,
    reasonBreakdown: reasonCounts,
    mostRecentBlock: blockedUsers.length > 0
      ? blockedUsers.sort((a, b) => new Date(b.blockedAt) - new Date(a.blockedAt))[0]
      : null,
  };
}

// Global handlers for onclick events
window.unblockUserById = (userId) => {
  unblockUser(userId);
};

window.openBlockModal = (userId, username) => {
  setState({
    showBlockModal: true,
    blockTargetId: userId,
    blockTargetName: username,
  });
};

window.closeBlockModal = () => {
  setState({
    showBlockModal: false,
    blockTargetId: null,
    blockTargetName: null,
  });
};

window.confirmBlockUser = (userId) => {
  const reasonSelect = document.getElementById('block-reason-select');
  const reason = reasonSelect?.value || null;
  blockUser(userId, reason);
  window.closeBlockModal();
};

window.openUnblockModal = (userId, username) => {
  setState({
    showUnblockModal: true,
    unblockTargetId: userId,
    unblockTargetName: username,
  });
};

window.closeUnblockModal = () => {
  setState({
    showUnblockModal: false,
    unblockTargetId: null,
    unblockTargetName: null,
  });
};

window.confirmUnblockUser = (userId) => {
  unblockUser(userId);
  window.closeUnblockModal();
};

// Export default with all functions
export default {
  BlockReasons,
  blockUser,
  unblockUser,
  isUserBlocked,
  getBlockedUsers,
  getBlockedByCount,
  canInteractWith,
  getBlockedUserDetails,
  updateBlockReason,
  getBlockReasons,
  renderBlockedUsersList,
  renderBlockButton,
  renderBlockModal,
  renderUnblockModal,
  clearAllBlockedUsers,
  getBlockingStats,
};
