/**
 * Review Replies Service
 * Feature #80 - Repondre aux avis
 *
 * Permet de repondre aux avis sur les spots avec fil de discussion.
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { showToast } from './notifications.js';
import { t } from '../i18n/index.js';
import { getReviewById } from './detailedReviews.js';

// Storage key for replies
const REVIEW_REPLIES_KEY = 'spothitch_review_replies';

/**
 * Reply type enum
 */
export const ReplyType = {
  SPOT_CREATOR: 'spot_creator', // Response from spot creator
  COMMUNITY: 'community',       // Response from community member
  AUTHOR: 'author',             // Response from review author
};

/**
 * Reply status enum
 */
export const ReplyStatus = {
  ACTIVE: 'active',
  EDITED: 'edited',
  DELETED: 'deleted',
  REPORTED: 'reported',
};

/**
 * Get replies from storage
 * @returns {Array} Array of reply objects
 */
function getRepliesFromStorage() {
  try {
    const data = Storage.get(REVIEW_REPLIES_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[ReviewReplies] Error reading replies:', error);
    return [];
  }
}

/**
 * Save replies to storage
 * @param {Array} replies - Array of reply objects
 */
function saveRepliesToStorage(replies) {
  try {
    Storage.set(REVIEW_REPLIES_KEY, replies);
    setState({ reviewReplies: replies });
  } catch (error) {
    console.error('[ReviewReplies] Error saving replies:', error);
  }
}

/**
 * Generate unique reply ID
 * @returns {string} Unique reply ID
 */
function generateReplyId() {
  return `reply_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get reply type for current user on a review
 * @param {string} reviewId - ID of the review
 * @param {string} spotCreatorId - ID of the spot creator
 * @returns {string} Reply type
 */
export function getReplyType(reviewId, spotCreatorId) {
  const state = getState();
  const currentUserId = state.user?.uid;
  const review = getReviewById(reviewId);

  if (!currentUserId || !review) {
    return ReplyType.COMMUNITY;
  }

  if (review.userId === currentUserId) {
    return ReplyType.AUTHOR;
  }

  if (spotCreatorId && spotCreatorId === currentUserId) {
    return ReplyType.SPOT_CREATOR;
  }

  return ReplyType.COMMUNITY;
}

/**
 * Create a new reply to a review
 * @param {string} reviewId - ID of the review to reply to
 * @param {string} content - Reply content text
 * @param {string} spotCreatorId - ID of the spot creator (optional)
 * @param {string} parentReplyId - ID of parent reply for nested replies (optional)
 * @returns {Object} Result object with success status and reply data
 */
export function createReply(reviewId, content, spotCreatorId = null, parentReplyId = null) {
  if (!reviewId) {
    return { success: false, error: 'review_id_required' };
  }

  if (!content || content.trim().length === 0) {
    return { success: false, error: 'content_required' };
  }

  if (content.trim().length > 500) {
    return { success: false, error: 'content_too_long' };
  }

  const state = getState();
  const currentUserId = state.user?.uid;

  if (!currentUserId) {
    showToast(t('loginRequired') || 'Connecte-toi pour repondre', 'warning');
    return { success: false, error: 'not_authenticated' };
  }

  // Verify review exists
  const review = getReviewById(reviewId);
  if (!review) {
    return { success: false, error: 'review_not_found' };
  }

  // Verify parent reply if provided
  if (parentReplyId) {
    const parentReply = getReplyById(parentReplyId);
    if (!parentReply || parentReply.reviewId !== reviewId) {
      return { success: false, error: 'parent_reply_not_found' };
    }
  }

  const replies = getRepliesFromStorage();

  // Determine reply type
  const replyType = getReplyType(reviewId, spotCreatorId);

  // Create reply entry
  const reply = {
    id: generateReplyId(),
    reviewId,
    parentReplyId: parentReplyId || null,
    userId: currentUserId,
    username: state.username || 'Anonyme',
    avatar: state.avatar || '🤙',
    content: content.trim(),
    type: replyType,
    status: ReplyStatus.ACTIVE,
    likeCount: 0,
    likedBy: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add to replies list
  replies.push(reply);
  saveRepliesToStorage(replies);

  showToast(t('replySubmitted') || 'Reponse publiee !', 'success');

  return { success: true, reply };
}

/**
 * Edit an existing reply
 * @param {string} replyId - ID of the reply to edit
 * @param {string} newContent - New content for the reply
 * @returns {Object} Result object with success status
 */
export function editReply(replyId, newContent) {
  if (!replyId) {
    return { success: false, error: 'reply_id_required' };
  }

  if (!newContent || newContent.trim().length === 0) {
    return { success: false, error: 'content_required' };
  }

  if (newContent.trim().length > 500) {
    return { success: false, error: 'content_too_long' };
  }

  const replies = getRepliesFromStorage();
  const replyIndex = replies.findIndex(r => r.id === replyId);

  if (replyIndex === -1) {
    return { success: false, error: 'reply_not_found' };
  }

  const reply = replies[replyIndex];
  const state = getState();
  const currentUserId = state.user?.uid;

  // Check if current user is the author
  if (reply.userId !== currentUserId) {
    showToast(t('cannotEditOthersReply') || 'Tu ne peux pas modifier cette reponse', 'error');
    return { success: false, error: 'not_author' };
  }

  reply.content = newContent.trim();
  reply.status = ReplyStatus.EDITED;
  reply.updatedAt = new Date().toISOString();

  replies[replyIndex] = reply;
  saveRepliesToStorage(replies);

  showToast(t('replyUpdated') || 'Reponse mise a jour !', 'success');

  return { success: true, reply };
}

/**
 * Delete a reply (soft delete)
 * @param {string} replyId - ID of the reply to delete
 * @returns {Object} Result object with success status
 */
export function deleteReply(replyId) {
  if (!replyId) {
    return { success: false, error: 'reply_id_required' };
  }

  const replies = getRepliesFromStorage();
  const replyIndex = replies.findIndex(r => r.id === replyId);

  if (replyIndex === -1) {
    return { success: false, error: 'reply_not_found' };
  }

  const reply = replies[replyIndex];
  const state = getState();
  const currentUserId = state.user?.uid;

  // Check if current user is the author
  if (reply.userId !== currentUserId) {
    showToast(t('cannotDeleteOthersReply') || 'Tu ne peux pas supprimer cette reponse', 'error');
    return { success: false, error: 'not_author' };
  }

  // Soft delete
  reply.status = ReplyStatus.DELETED;
  reply.updatedAt = new Date().toISOString();

  replies[replyIndex] = reply;
  saveRepliesToStorage(replies);

  showToast(t('replyDeleted') || 'Reponse supprimee', 'success');

  return { success: true };
}

/**
 * Get all replies for a specific review
 * @param {string} reviewId - ID of the review
 * @param {boolean} includeDeleted - Include deleted replies (default: false)
 * @returns {Array} Array of reply objects organized in threads
 */
export function getReviewReplies(reviewId, includeDeleted = false) {
  if (!reviewId) return [];

  const replies = getRepliesFromStorage();

  return replies
    .filter(r => r.reviewId === reviewId &&
      (includeDeleted || r.status !== ReplyStatus.DELETED))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

/**
 * Get replies organized as threads (top-level with nested children)
 * @param {string} reviewId - ID of the review
 * @returns {Array} Array of reply objects with nested children
 */
export function getReviewRepliesThreaded(reviewId) {
  if (!reviewId) return [];

  const allReplies = getReviewReplies(reviewId);

  // Separate top-level and nested replies
  const topLevel = allReplies.filter(r => !r.parentReplyId);
  const nested = allReplies.filter(r => r.parentReplyId);

  // Attach children to parents
  topLevel.forEach(parent => {
    parent.children = nested.filter(child => child.parentReplyId === parent.id);
  });

  return topLevel;
}

/**
 * Get reply count for a review
 * @param {string} reviewId - ID of the review
 * @returns {number} Number of active replies
 */
export function getReplyCount(reviewId) {
  if (!reviewId) return 0;

  const replies = getReviewReplies(reviewId);
  return replies.length;
}

/**
 * Get a specific reply by ID
 * @param {string} replyId - ID of the reply
 * @returns {Object|null} Reply object or null if not found
 */
export function getReplyById(replyId) {
  if (!replyId) return null;

  const replies = getRepliesFromStorage();
  return replies.find(r => r.id === replyId) || null;
}

/**
 * Like/unlike a reply
 * @param {string} replyId - ID of the reply
 * @returns {Object} Result object with success status
 */
export function toggleReplyLike(replyId) {
  if (!replyId) {
    return { success: false, error: 'reply_id_required' };
  }

  const state = getState();
  const currentUserId = state.user?.uid || 'anonymous';

  const replies = getRepliesFromStorage();
  const replyIndex = replies.findIndex(r => r.id === replyId);

  if (replyIndex === -1) {
    return { success: false, error: 'reply_not_found' };
  }

  const reply = replies[replyIndex];

  // Cannot like own reply
  if (reply.userId === currentUserId) {
    return { success: false, error: 'cannot_like_own_reply' };
  }

  // Toggle like
  if (reply.likedBy.includes(currentUserId)) {
    reply.likedBy = reply.likedBy.filter(id => id !== currentUserId);
    reply.likeCount = Math.max(0, reply.likeCount - 1);
  } else {
    reply.likedBy.push(currentUserId);
    reply.likeCount++;
  }

  replies[replyIndex] = reply;
  saveRepliesToStorage(replies);

  return { success: true, likeCount: reply.likeCount };
}

/**
 * Get replies made by current user
 * @returns {Array} Array of reply objects
 */
export function getMyReplies() {
  const state = getState();
  const currentUserId = state.user?.uid;

  if (!currentUserId) return [];

  const replies = getRepliesFromStorage();

  return replies
    .filter(r => r.userId === currentUserId && r.status !== ReplyStatus.DELETED)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('justNow') || 'A l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

/**
 * Get reply type badge HTML
 * @param {string} type - Reply type
 * @returns {string} HTML string of badge
 */
function getReplyTypeBadge(type) {
  const badges = {
    [ReplyType.SPOT_CREATOR]: {
      label: t('spotCreator') || 'Createur du spot',
      class: 'bg-primary-500/20 text-primary-400',
      icon: 'fa-map-marker-alt',
    },
    [ReplyType.AUTHOR]: {
      label: t('reviewAuthor') || 'Auteur de l\'avis',
      class: 'bg-blue-500/20 text-blue-400',
      icon: 'fa-user',
    },
    [ReplyType.COMMUNITY]: null, // No badge for community members
  };

  const badge = badges[type];
  if (!badge) return '';

  return `
    <span class="px-2 py-0.5 rounded-full text-xs font-medium ${badge.class}">
      <i class="fas ${badge.icon} mr-1"></i>
      ${escapeHTML(badge.label)}
    </span>
  `;
}

/**
 * Render a single reply HTML
 * @param {Object} reply - Reply object
 * @param {boolean} isNested - Whether this is a nested reply
 * @returns {string} HTML string of reply
 */
export function renderReply(reply, isNested = false) {
  if (!reply) return '';

  const state = getState();
  const currentUserId = state.user?.uid;
  const isAuthor = reply.userId === currentUserId;
  const hasLiked = reply.likedBy?.includes(currentUserId || 'anonymous');

  return `
    <div
      class="reply ${isNested ? 'ml-8 border-l-2 border-white/10 pl-4' : ''} py-3"
      data-reply-id="${escapeHTML(reply.id)}"
      role="article"
    >
      <!-- Header -->
      <div class="flex items-start gap-3">
        <div class="avatar text-xl">${escapeHTML(reply.avatar)}</div>
        <div class="flex-1">
          <div class="flex items-center flex-wrap gap-2 mb-1">
            <span class="font-medium text-white">${escapeHTML(reply.username)}</span>
            ${getReplyTypeBadge(reply.type)}
            <span class="text-xs text-slate-500">${escapeHTML(formatDate(reply.createdAt))}</span>
            ${reply.status === ReplyStatus.EDITED ? `
              <span class="text-xs text-slate-500">(${escapeHTML(t('edited') || 'modifie')})</span>
            ` : ''}
          </div>

          <!-- Content -->
          <p class="text-white text-sm mb-2">${escapeHTML(reply.content)}</p>

          <!-- Actions -->
          <div class="flex items-center gap-4 text-xs">
            <button
              onclick="toggleReplyLikeHandler('${escapeHTML(reply.id)}')"
              class="flex items-center gap-1 ${hasLiked ? 'text-red-400' : 'text-slate-400'} hover:text-red-300 transition-colors"
              ${isAuthor ? 'disabled' : ''}
            >
              <i class="fas fa-heart"></i>
              <span>${reply.likeCount || 0}</span>
            </button>

            ${!isNested ? `
              <button
                onclick="replyToReply('${escapeHTML(reply.id)}')"
                class="text-slate-400 hover:text-white transition-colors"
              >
                <i class="fas fa-reply mr-1"></i>
                ${escapeHTML(t('reply') || 'Repondre')}
              </button>
            ` : ''}

            ${isAuthor ? `
              <button
                onclick="editReplyModal('${escapeHTML(reply.id)}')"
                class="text-blue-400 hover:text-blue-300 transition-colors"
              >
                <i class="fas fa-edit mr-1"></i>
                ${escapeHTML(t('edit') || 'Modifier')}
              </button>
              <button
                onclick="deleteReplyConfirm('${escapeHTML(reply.id)}')"
                class="text-red-400 hover:text-red-300 transition-colors"
              >
                <i class="fas fa-trash mr-1"></i>
                ${escapeHTML(t('delete') || 'Supprimer')}
              </button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Nested replies -->
      ${reply.children && reply.children.length > 0 ? `
        <div class="nested-replies mt-2">
          ${reply.children.map(child => renderReply(child, true)).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render the reply form HTML
 * @param {string} reviewId - ID of the review to reply to
 * @param {string} parentReplyId - ID of parent reply (optional)
 * @returns {string} HTML string of reply form
 */
export function renderReplyForm(reviewId, parentReplyId = null) {
  if (!reviewId) return '';

  const state = getState();

  if (!state.user?.uid) {
    return `
      <div class="reply-form-login p-4 bg-white/5 rounded-lg text-center">
        <p class="text-slate-400">${escapeHTML(t('loginToReply') || 'Connecte-toi pour repondre')}</p>
        <button
          onclick="setState({ showAuth: true })"
          class="btn btn-sm bg-primary-500 hover:bg-primary-600 text-white mt-2"
        >
          ${escapeHTML(t('login') || 'Connexion')}
        </button>
      </div>
    `;
  }

  return `
    <div
      class="reply-form p-4 bg-white/5 rounded-lg"
      data-review-id="${escapeHTML(reviewId)}"
      data-parent-reply-id="${parentReplyId ? escapeHTML(parentReplyId) : ''}"
    >
      <div class="flex gap-3">
        <div class="avatar text-xl">${escapeHTML(state.avatar || '🤙')}</div>
        <div class="flex-1">
          <textarea
            class="reply-input w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows="2"
            maxlength="500"
            placeholder="${escapeHTML(t('writeReply') || 'Ecris ta reponse...')}"
          ></textarea>
          <div class="flex items-center justify-between mt-2">
            <span class="text-xs text-slate-500">
              <span class="reply-chars-count">0</span>/500
            </span>
            <div class="flex gap-2">
              ${parentReplyId ? `
                <button
                  onclick="cancelNestedReply()"
                  class="btn btn-sm bg-white/10 hover:bg-white/20 text-white"
                >
                  ${escapeHTML(t('cancel') || 'Annuler')}
                </button>
              ` : ''}
              <button
                onclick="submitReply('${escapeHTML(reviewId)}', ${parentReplyId ? `'${escapeHTML(parentReplyId)}'` : 'null'})"
                class="btn btn-sm bg-primary-500 hover:bg-primary-600 text-white"
              >
                <i class="fas fa-paper-plane mr-1"></i>
                ${escapeHTML(t('reply') || 'Repondre')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render replies section for a review
 * @param {string} reviewId - ID of the review
 * @param {string} spotCreatorId - ID of the spot creator (optional)
 * @returns {string} HTML string of replies section
 */
export function renderRepliesSection(reviewId, spotCreatorId = null) {
  if (!reviewId) return '';

  const replies = getReviewRepliesThreaded(reviewId);
  const replyCount = getReplyCount(reviewId);

  return `
    <div class="replies-section mt-4 border-t border-white/10 pt-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-sm font-medium text-white">
          <i class="fas fa-comments mr-2 text-slate-400"></i>
          ${escapeHTML(t('replies') || 'Reponses')} (${replyCount})
        </h4>
      </div>

      <!-- Replies list -->
      ${replies.length > 0 ? `
        <div class="replies-list space-y-2 mb-4" role="list">
          ${replies.map(reply => renderReply(reply, false)).join('')}
        </div>
      ` : ''}

      <!-- Reply form -->
      <div id="reply-form-container-${escapeHTML(reviewId)}">
        ${renderReplyForm(reviewId)}
      </div>
    </div>
  `;
}

/**
 * Clear all replies (for testing)
 * @returns {Object} Result object with success status
 */
export function clearAllReplies() {
  saveRepliesToStorage([]);
  showToast(t('allRepliesCleared') || 'Toutes les reponses ont ete supprimees', 'success');
  return { success: true };
}

// Global handlers for onclick events
window.submitReply = (reviewId, parentReplyId = null) => {
  const form = document.querySelector(`[data-review-id="${reviewId}"]`);
  const textarea = form?.querySelector('.reply-input');
  const content = textarea?.value || '';

  if (!content.trim()) {
    showToast(t('replyContentRequired') || 'Ecris quelque chose !', 'warning');
    return;
  }

  // Get spot creator ID from data attribute if available
  const spotCreatorId = form?.dataset?.spotCreatorId || null;

  const result = createReply(reviewId, content, spotCreatorId, parentReplyId);
  if (result.success) {
    if (textarea) textarea.value = '';
    // Refresh replies display
    setState({ refreshReplies: Date.now() });
  }
};

window.toggleReplyLikeHandler = (replyId) => {
  toggleReplyLike(replyId);
  setState({ refreshReplies: Date.now() });
};

window.replyToReply = (parentReplyId) => {
  const reply = getReplyById(parentReplyId);
  if (!reply) return;

  // Show nested reply form
  const container = document.getElementById(`reply-form-container-${reply.reviewId}`);
  if (container) {
    container.innerHTML = renderReplyForm(reply.reviewId, parentReplyId);
    const textarea = container.querySelector('.reply-input');
    if (textarea) textarea.focus();
  }
};

window.cancelNestedReply = () => {
  setState({ refreshReplies: Date.now() });
};

window.editReplyModal = (replyId) => {
  setState({ showEditReplyModal: true, editReplyId: replyId });
};

window.deleteReplyConfirm = (replyId) => {
  if (confirm(t('confirmDeleteReply') || 'Supprimer cette reponse ?')) {
    deleteReply(replyId);
    setState({ refreshReplies: Date.now() });
  }
};

window.openReplyModal = (reviewId) => {
  setState({ showReplyModal: true, replyReviewId: reviewId });
};

// Export default with all functions
export default {
  ReplyType,
  ReplyStatus,
  getReplyType,
  createReply,
  editReply,
  deleteReply,
  getReviewReplies,
  getReviewRepliesThreaded,
  getReplyCount,
  getReplyById,
  toggleReplyLike,
  getMyReplies,
  renderReply,
  renderReplyForm,
  renderRepliesSection,
  clearAllReplies,
};
