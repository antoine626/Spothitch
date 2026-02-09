/**
 * Message Replies Service (#184)
 * Reply to messages with quoted content and navigation to original
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { showToast } from './notifications.js';
import { escapeHTML } from '../utils/sanitize.js';
import { t } from '../i18n/index.js';

// Storage key
const REPLIES_STORAGE_KEY = 'spothitch_message_replies';
const MESSAGES_STORAGE_KEY = 'spothitch_chat_messages';

// Reply state
let replyingToMessage = null;

// ==================== STORAGE ====================

/**
 * Get replies storage from localStorage
 * @returns {Object} Replies storage object
 */
function getRepliesStorage() {
  try {
    return Storage.get(REPLIES_STORAGE_KEY) || {};
  } catch (error) {
    console.error('[MessageReplies] Error reading storage:', error);
    return {};
  }
}

/**
 * Save replies storage to localStorage
 * @param {Object} data - Replies data to save
 */
function saveRepliesStorage(data) {
  try {
    Storage.set(REPLIES_STORAGE_KEY, data);
  } catch (error) {
    console.error('[MessageReplies] Error saving storage:', error);
  }
}

/**
 * Get messages storage (for looking up original messages)
 * @returns {Object} Messages storage object
 */
function getMessagesStorage() {
  try {
    return Storage.get(MESSAGES_STORAGE_KEY) || {};
  } catch (error) {
    console.error('[MessageReplies] Error reading messages storage:', error);
    return {};
  }
}

/**
 * Save messages storage
 * @param {Object} data - Messages data to save
 */
function saveMessagesStorage(data) {
  try {
    Storage.set(MESSAGES_STORAGE_KEY, data);
  } catch (error) {
    console.error('[MessageReplies] Error saving messages storage:', error);
  }
}

// ==================== REPLY TO MESSAGE ====================

/**
 * Set the message being replied to
 * @param {Object} message - Message object { id, text, userName, userId, createdAt }
 * @returns {Object} Result { success }
 */
export function setReplyingTo(message) {
  if (!message) {
    replyingToMessage = null;
    updateReplyState();
    return { success: true };
  }

  if (!message.id) {
    return { success: false, error: 'message_id_required' };
  }

  replyingToMessage = {
    id: message.id,
    text: message.text || '',
    userName: message.userName || 'Utilisateur',
    userId: message.userId || '',
    createdAt: message.createdAt || new Date().toISOString(),
  };

  updateReplyState();
  return { success: true };
}

/**
 * Clear the current reply
 * @returns {Object} Result { success }
 */
export function clearReply() {
  replyingToMessage = null;
  updateReplyState();
  return { success: true };
}

/**
 * Get the message currently being replied to
 * @returns {Object|null} Message object or null
 */
export function getReplyingTo() {
  return replyingToMessage;
}

/**
 * Check if currently replying to a message
 * @returns {boolean}
 */
export function isReplying() {
  return replyingToMessage !== null;
}

/**
 * Update reply state in global state
 */
function updateReplyState() {
  setState({ replyingToMessage: replyingToMessage });
}

// ==================== SEND REPLY ====================

/**
 * Reply to a message
 * @param {string} messageId - Original message ID
 * @param {string} content - Reply content
 * @param {Object} options - Optional { room, recipientId }
 * @returns {Object} Result { success, error?, reply? }
 */
export function replyToMessage(messageId, content, options = {}) {
  if (!messageId) {
    return { success: false, error: 'message_id_required' };
  }

  if (!content || !content.trim()) {
    return { success: false, error: 'content_required' };
  }

  const state = getState();
  const userId = state.user?.uid || 'anonymous';
  const userName = state.username || state.user?.displayName || 'Anonyme';

  // Get original message info
  const originalMessage = getMessageById(messageId);

  // Create reply object
  const reply = {
    id: `reply_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    text: content.trim(),
    userId,
    userName,
    createdAt: new Date().toISOString(),
    replyTo: {
      messageId,
      text: originalMessage?.text || '',
      userName: originalMessage?.userName || 'Utilisateur',
      userId: originalMessage?.userId || '',
    },
    room: options.room || state.chatRoom || 'general',
  };

  // Store the reply
  const storage = getRepliesStorage();
  if (!storage[messageId]) {
    storage[messageId] = [];
  }
  storage[messageId].push(reply);
  saveRepliesStorage(storage);

  // Also store in messages storage for later retrieval
  const messagesStorage = getMessagesStorage();
  messagesStorage[reply.id] = reply;
  saveMessagesStorage(messagesStorage);

  // Clear reply state
  clearReply();

  return { success: true, reply };
}

// ==================== GET REPLIES ====================

/**
 * Get all replies to a message
 * @param {string} messageId - Message ID
 * @returns {Array} Array of reply objects
 */
export function getReplies(messageId) {
  if (!messageId) {
    return [];
  }

  const storage = getRepliesStorage();
  return storage[messageId] || [];
}

/**
 * Get reply count for a message
 * @param {string} messageId - Message ID
 * @returns {number}
 */
export function getReplyCount(messageId) {
  return getReplies(messageId).length;
}

/**
 * Check if a message has replies
 * @param {string} messageId - Message ID
 * @returns {boolean}
 */
export function hasReplies(messageId) {
  return getReplyCount(messageId) > 0;
}

/**
 * Get message by ID (from storage)
 * @param {string} messageId - Message ID
 * @returns {Object|null} Message object or null
 */
export function getMessageById(messageId) {
  if (!messageId) {
    return null;
  }

  // Check messages storage
  const messagesStorage = getMessagesStorage();
  if (messagesStorage[messageId]) {
    return messagesStorage[messageId];
  }

  // Check replies storage (in case it's a reply)
  const repliesStorage = getRepliesStorage();
  for (const replies of Object.values(repliesStorage)) {
    const found = replies.find(r => r.id === messageId);
    if (found) {
      return found;
    }
  }

  // Check state messages
  const state = getState();
  const stateMessage = (state.messages || []).find(m => m.id === messageId);
  if (stateMessage) {
    return stateMessage;
  }

  return null;
}

/**
 * Get the original message that a reply is responding to
 * @param {string} replyId - Reply message ID
 * @returns {Object|null} Original message or null
 */
export function getOriginalMessage(replyId) {
  const reply = getMessageById(replyId);
  if (!reply || !reply.replyTo) {
    return null;
  }

  return getMessageById(reply.replyTo.messageId);
}

/**
 * Check if a message is a reply
 * @param {string} messageId - Message ID
 * @returns {boolean}
 */
export function isReply(messageId) {
  const message = getMessageById(messageId);
  return message?.replyTo != null;
}

// ==================== NAVIGATION ====================

/**
 * Navigate to the original message
 * @param {string} originalMessageId - Original message ID
 * @returns {Object} Result { success, error? }
 */
export function navigateToOriginalMessage(originalMessageId) {
  if (!originalMessageId) {
    return { success: false, error: 'message_id_required' };
  }

  // Find the message element in DOM
  const messageElement = document.querySelector(`[data-message-id="${originalMessageId}"]`);

  if (messageElement) {
    // Scroll to message
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Highlight temporarily
    messageElement.classList.add('highlight-message');
    setTimeout(() => {
      messageElement.classList.remove('highlight-message');
    }, 2000);

    return { success: true };
  }

  // Message not in current view - may need to load more messages
  showToast(t('messageNotFound'), 'info');
  return { success: false, error: 'message_not_in_view' };
}

/**
 * Navigate to replies of a message
 * @param {string} messageId - Message ID
 * @returns {Object} Result { success, replies }
 */
export function navigateToReplies(messageId) {
  if (!messageId) {
    return { success: false, error: 'message_id_required' };
  }

  const replies = getReplies(messageId);
  if (replies.length === 0) {
    return { success: false, error: 'no_replies' };
  }

  // Find first reply element
  const firstReply = replies[0];
  const replyElement = document.querySelector(`[data-message-id="${firstReply.id}"]`);

  if (replyElement) {
    replyElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return { success: true, replies };
  }

  return { success: false, error: 'replies_not_in_view', replies };
}

// ==================== RENDER ====================

/**
 * Render the reply preview (shown when composing a reply)
 * @returns {string} HTML string
 */
export function renderReplyPreview() {
  if (!replyingToMessage) {
    return '';
  }

  const truncatedText = replyingToMessage.text.length > 100
    ? replyingToMessage.text.substring(0, 100) + '...'
    : replyingToMessage.text;

  return `
    <div class="reply-preview flex items-center gap-2 p-2 bg-dark-secondary border-l-4 border-primary-500 rounded-r-lg mb-2"
         role="status"
         aria-label="${t('replyingTo')} ${escapeHTML(replyingToMessage.userName)}">
      <div class="flex-1 min-w-0">
        <div class="text-xs font-medium text-primary-400">
          <i class="fas fa-reply mr-1" aria-hidden="true"></i>
          ${t('replyingTo')} ${escapeHTML(replyingToMessage.userName)}
        </div>
        <div class="text-xs text-slate-400 truncate">
          ${escapeHTML(truncatedText)}
        </div>
      </div>
      <button
        type="button"
        class="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-all"
        onclick="window.cancelReply()"
        aria-label="${t('cancelReply')}"
        title="${t('cancel')}"
      >
        <i class="fas fa-times" aria-hidden="true"></i>
      </button>
    </div>
  `;
}

/**
 * Render the quoted message in a reply
 * @param {Object} replyTo - Reply to object { messageId, text, userName }
 * @returns {string} HTML string
 */
export function renderQuotedMessage(replyTo) {
  if (!replyTo) {
    return '';
  }

  const truncatedText = replyTo.text && replyTo.text.length > 80
    ? replyTo.text.substring(0, 80) + '...'
    : replyTo.text || '';

  return `
    <div class="quoted-message p-2 mb-2 bg-white/5 border-l-2 border-slate-500 rounded-r cursor-pointer hover:bg-white/10 transition-colors"
         onclick="window.navigateToMessage('${escapeHTML(replyTo.messageId)}')"
         role="button"
         tabindex="0"
         aria-label="${t('viewOriginalMessage')}">
      <div class="text-xs font-medium text-slate-400 mb-0.5">
        <i class="fas fa-reply fa-flip-horizontal mr-1" aria-hidden="true"></i>
        ${escapeHTML(replyTo.userName || 'Utilisateur')}
      </div>
      <div class="text-xs text-slate-500 truncate">
        ${escapeHTML(truncatedText)}
      </div>
    </div>
  `;
}

/**
 * Render reply button for a message
 * @param {Object} message - Message object
 * @returns {string} HTML string
 */
export function renderReplyButton(message) {
  if (!message || !message.id) {
    return '';
  }

  return `
    <button
      type="button"
      class="reply-btn p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-all"
      onclick="window.startReply('${escapeHTML(message.id)}', '${escapeHTML(message.text || '')}', '${escapeHTML(message.userName || 'Utilisateur')}', '${escapeHTML(message.userId || '')}')"
      aria-label="${t('replyToMessage')}"
      title="${t('reply')}"
    >
      <i class="fas fa-reply" aria-hidden="true"></i>
    </button>
  `;
}

/**
 * Render reply count indicator
 * @param {string} messageId - Message ID
 * @returns {string} HTML string
 */
export function renderReplyCount(messageId) {
  const count = getReplyCount(messageId);
  if (count === 0) {
    return '';
  }

  return `
    <button
      type="button"
      class="reply-count text-xs text-primary-400 hover:text-primary-300 cursor-pointer"
      onclick="window.navigateToReplies('${escapeHTML(messageId)}')"
      aria-label="${count} ${count > 1 ? t('replies') : t('reply')}"
    >
      <i class="fas fa-comment-dots mr-1" aria-hidden="true"></i>
      ${count} ${count > 1 ? t('replies') : t('reply')}
    </button>
  `;
}

/**
 * Render thread view for replies
 * @param {string} messageId - Original message ID
 * @returns {string} HTML string
 */
export function renderThreadView(messageId) {
  const replies = getReplies(messageId);
  const originalMessage = getMessageById(messageId);

  if (!originalMessage) {
    return '';
  }

  return `
    <div class="thread-view p-4 bg-dark-secondary rounded-lg"
         role="region"
         aria-label="${t('threadView')}">
      <div class="thread-header flex items-center justify-between mb-4">
        <h3 class="text-sm font-medium">
          <i class="fas fa-comments mr-2" aria-hidden="true"></i>
          ${t('thread')} (${replies.length} ${replies.length > 1 ? t('replies') : t('reply')})
        </h3>
        <button
          type="button"
          class="text-slate-400 hover:text-white"
          onclick="window.closeThreadView()"
          aria-label="${t('close')}"
        >
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>

      <!-- Original message -->
      <div class="original-message p-3 bg-white/5 rounded-lg mb-4 border-l-4 border-primary-500">
        <div class="flex items-center gap-2 mb-1">
          <span class="font-medium text-sm">${escapeHTML(originalMessage.userName)}</span>
          <span class="text-xs text-slate-500">${formatMessageTime(originalMessage.createdAt)}</span>
        </div>
        <p class="text-sm">${escapeHTML(originalMessage.text)}</p>
      </div>

      <!-- Replies -->
      <div class="replies-list space-y-3 ml-4 border-l-2 border-slate-700 pl-4">
        ${replies.map(reply => `
          <div class="reply p-2 bg-white/5 rounded-lg" data-message-id="${escapeHTML(reply.id)}">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-xs">${escapeHTML(reply.userName)}</span>
              <span class="text-xs text-slate-500">${formatMessageTime(reply.createdAt)}</span>
            </div>
            <p class="text-sm">${escapeHTML(reply.text)}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ==================== UTILITIES ====================

/**
 * Format message timestamp
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time
 */
function formatMessageTime(timestamp) {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t('justNow');
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}j`;

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * Clear all replies for a message
 * @param {string} messageId - Message ID
 * @returns {Object} Result { success }
 */
export function clearMessageReplies(messageId) {
  if (!messageId) {
    return { success: false, error: 'message_id_required' };
  }

  const storage = getRepliesStorage();
  delete storage[messageId];
  saveRepliesStorage(storage);

  return { success: true };
}

/**
 * Clear all replies (for testing/reset)
 * @returns {Object} Result { success }
 */
export function clearAllReplies() {
  saveRepliesStorage({});
  return { success: true };
}

/**
 * Get reply statistics
 * @returns {Object} Stats { totalReplies, messagesWithReplies, topRepliedMessage }
 */
export function getReplyStats() {
  const storage = getRepliesStorage();
  const messageIds = Object.keys(storage);

  let totalReplies = 0;
  let topRepliedMessageId = null;
  let maxReplies = 0;

  messageIds.forEach(messageId => {
    const replies = storage[messageId] || [];
    totalReplies += replies.length;

    if (replies.length > maxReplies) {
      maxReplies = replies.length;
      topRepliedMessageId = messageId;
    }
  });

  return {
    totalReplies,
    messagesWithReplies: messageIds.length,
    topRepliedMessageId,
    topRepliedMessageCount: maxReplies,
  };
}

/**
 * Store a message for later retrieval
 * @param {Object} message - Message object
 * @returns {Object} Result { success }
 */
export function storeMessage(message) {
  if (!message || !message.id) {
    return { success: false, error: 'invalid_message' };
  }

  const storage = getMessagesStorage();
  storage[message.id] = message;
  saveMessagesStorage(storage);

  return { success: true };
}

/**
 * Store multiple messages
 * @param {Array} messages - Array of message objects
 * @returns {Object} Result { success, stored }
 */
export function storeMessages(messages) {
  if (!Array.isArray(messages)) {
    return { success: false, error: 'invalid_messages' };
  }

  const storage = getMessagesStorage();
  let stored = 0;

  messages.forEach(message => {
    if (message && message.id) {
      storage[message.id] = message;
      stored++;
    }
  });

  saveMessagesStorage(storage);
  return { success: true, stored };
}

// ==================== GLOBAL HANDLERS ====================

// Expose handlers to window
if (typeof window !== 'undefined') {
  window.startReply = (messageId, text, userName, userId) => {
    setReplyingTo({
      id: messageId,
      text: text || '',
      userName: userName || 'Utilisateur',
      userId: userId || '',
    });

    // Focus the input
    const input = document.getElementById('chat-input');
    if (input) {
      input.focus();
    }

    // Update UI
    const replyPreviewContainer = document.getElementById('reply-preview-container');
    if (replyPreviewContainer) {
      replyPreviewContainer.innerHTML = renderReplyPreview();
    }
  };

  window.cancelReply = () => {
    clearReply();

    // Update UI
    const replyPreviewContainer = document.getElementById('reply-preview-container');
    if (replyPreviewContainer) {
      replyPreviewContainer.innerHTML = '';
    }
  };

  window.navigateToMessage = (messageId) => {
    navigateToOriginalMessage(messageId);
  };

  window.navigateToReplies = (messageId) => {
    navigateToReplies(messageId);
  };

  window.closeThreadView = () => {
    const threadView = document.querySelector('.thread-view');
    if (threadView) {
      threadView.remove();
    }
  };

  window.showThread = (messageId) => {
    const threadHtml = renderThreadView(messageId);
    const container = document.getElementById('thread-container');
    if (container) {
      container.innerHTML = threadHtml;
    }
  };
}

// Export default
export default {
  setReplyingTo,
  clearReply,
  getReplyingTo,
  isReplying,
  replyToMessage,
  getReplies,
  getReplyCount,
  hasReplies,
  getMessageById,
  getOriginalMessage,
  isReply,
  navigateToOriginalMessage,
  navigateToReplies,
  renderReplyPreview,
  renderQuotedMessage,
  renderReplyButton,
  renderReplyCount,
  renderThreadView,
  clearMessageReplies,
  clearAllReplies,
  getReplyStats,
  storeMessage,
  storeMessages,
};
