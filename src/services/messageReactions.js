/**
 * Message Reactions Service (#183)
 * Add, remove, and display emoji reactions on chat messages
 */

import { getState, setState } from '../stores/state.js';
import { Storage } from '../utils/storage.js';
import { showToast } from './notifications.js';
import { escapeHTML } from '../utils/sanitize.js';
import { t } from '../i18n/index.js';
import { icon } from '../utils/icons.js'

// Storage key
const REACTIONS_STORAGE_KEY = 'spothitch_message_reactions';

// Available reaction emojis
export const AVAILABLE_REACTIONS = [
  { emoji: '👍', name: 'like', label: 'J\'aime' },
  { emoji: '❤️', name: 'love', label: 'Adore' },
  { emoji: '😂', name: 'haha', label: 'Haha' },
  { emoji: '😮', name: 'wow', label: 'Wow' },
  { emoji: '😢', name: 'sad', label: 'Triste' },
  { emoji: '🔥', name: 'fire', label: 'Feu' },
];

// ==================== STORAGE ====================

/**
 * Get reactions storage from localStorage
 * @returns {Object} Reactions storage object
 */
function getReactionsStorage() {
  try {
    return Storage.get(REACTIONS_STORAGE_KEY) || {};
  } catch (error) {
    console.error('[MessageReactions] Error reading storage:', error);
    return {};
  }
}

/**
 * Save reactions storage to localStorage
 * @param {Object} data - Reactions data to save
 */
function saveReactionsStorage(data) {
  try {
    Storage.set(REACTIONS_STORAGE_KEY, data);
  } catch (error) {
    console.error('[MessageReactions] Error saving storage:', error);
  }
}

// ==================== REACTIONS CRUD ====================

/**
 * Add a reaction to a message
 * @param {string} messageId - Message ID
 * @param {string} emoji - Emoji to add (must be in AVAILABLE_REACTIONS)
 * @returns {Object} Result { success, error?, reaction? }
 */
export function addReaction(messageId, emoji) {
  if (!messageId) {
    return { success: false, error: 'message_id_required' };
  }

  if (!emoji) {
    return { success: false, error: 'emoji_required' };
  }

  // Validate emoji is in available list
  const validReaction = AVAILABLE_REACTIONS.find(r => r.emoji === emoji);
  if (!validReaction) {
    return { success: false, error: 'invalid_emoji' };
  }

  // Get current user
  const state = getState();
  const userId = state.user?.uid || 'anonymous';
  const userName = state.username || state.user?.displayName || 'Anonyme';

  const storage = getReactionsStorage();

  // Initialize message reactions if needed
  if (!storage[messageId]) {
    storage[messageId] = [];
  }

  // Remove any existing reaction from this user on this message
  storage[messageId] = storage[messageId].filter(r => r.userId !== userId);

  // Add new reaction
  const reaction = {
    userId,
    userName,
    emoji,
    name: validReaction.name,
    createdAt: new Date().toISOString(),
  };

  storage[messageId].push(reaction);
  saveReactionsStorage(storage);

  return { success: true, reaction };
}

/**
 * Remove a reaction from a message
 * @param {string} messageId - Message ID
 * @param {string} emoji - Optional: specific emoji to remove. If not provided, removes user's reaction
 * @returns {Object} Result { success, error? }
 */
export function removeReaction(messageId, emoji = null) {
  if (!messageId) {
    return { success: false, error: 'message_id_required' };
  }

  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const storage = getReactionsStorage();

  if (!storage[messageId] || storage[messageId].length === 0) {
    return { success: false, error: 'no_reactions_found' };
  }

  const originalLength = storage[messageId].length;

  if (emoji) {
    // Remove specific emoji from user
    storage[messageId] = storage[messageId].filter(
      r => !(r.userId === userId && r.emoji === emoji)
    );
  } else {
    // Remove all reactions from user on this message
    storage[messageId] = storage[messageId].filter(r => r.userId !== userId);
  }

  // Clean up empty arrays
  if (storage[messageId].length === 0) {
    delete storage[messageId];
  }

  saveReactionsStorage(storage);

  const removed = originalLength !== (storage[messageId]?.length || 0);
  return { success: removed, error: removed ? null : 'reaction_not_found' };
}

/**
 * Toggle a reaction (add if not present, remove if present)
 * @param {string} messageId - Message ID
 * @param {string} emoji - Emoji to toggle
 * @returns {Object} Result { success, added, removed }
 */
export function toggleReaction(messageId, emoji) {
  const myReaction = getMyReaction(messageId);

  if (myReaction === emoji) {
    // Remove reaction
    const result = removeReaction(messageId, emoji);
    return { ...result, added: false, removed: true };
  } else {
    // Add reaction (replaces any existing)
    const result = addReaction(messageId, emoji);
    return { ...result, added: true, removed: false };
  }
}

// ==================== GETTERS ====================

/**
 * Get all reactions for a message
 * @param {string} messageId - Message ID
 * @returns {Array} Array of reactions grouped by emoji
 */
export function getReactions(messageId) {
  if (!messageId) {
    return [];
  }

  const storage = getReactionsStorage();
  const reactions = storage[messageId] || [];

  // Group reactions by emoji
  const grouped = {};
  reactions.forEach(r => {
    if (!grouped[r.emoji]) {
      grouped[r.emoji] = {
        emoji: r.emoji,
        name: r.name,
        count: 0,
        users: [],
        userIds: [],
      };
    }
    grouped[r.emoji].count++;
    grouped[r.emoji].users.push(r.userName);
    grouped[r.emoji].userIds.push(r.userId);
  });

  return Object.values(grouped);
}

/**
 * Get raw reactions (not grouped)
 * @param {string} messageId - Message ID
 * @returns {Array} Array of individual reactions
 */
export function getRawReactions(messageId) {
  if (!messageId) {
    return [];
  }

  const storage = getReactionsStorage();
  return storage[messageId] || [];
}

/**
 * Get the current user's reaction on a message
 * @param {string} messageId - Message ID
 * @returns {string|null} Emoji or null if no reaction
 */
export function getMyReaction(messageId) {
  if (!messageId) {
    return null;
  }

  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const storage = getReactionsStorage();
  const reactions = storage[messageId] || [];

  const myReaction = reactions.find(r => r.userId === userId);
  return myReaction?.emoji || null;
}

/**
 * Check if user has reacted to a message
 * @param {string} messageId - Message ID
 * @returns {boolean}
 */
export function hasReacted(messageId) {
  return getMyReaction(messageId) !== null;
}

/**
 * Get total reaction count for a message
 * @param {string} messageId - Message ID
 * @returns {number}
 */
export function getReactionCount(messageId) {
  if (!messageId) {
    return 0;
  }

  const storage = getReactionsStorage();
  return (storage[messageId] || []).length;
}

/**
 * Get users who reacted with a specific emoji
 * @param {string} messageId - Message ID
 * @param {string} emoji - Emoji to filter by
 * @returns {Array} Array of user names
 */
export function getUsersForReaction(messageId, emoji) {
  if (!messageId || !emoji) {
    return [];
  }

  const storage = getReactionsStorage();
  const reactions = storage[messageId] || [];

  return reactions
    .filter(r => r.emoji === emoji)
    .map(r => r.userName);
}

// ==================== RENDER ====================

/**
 * Render reactions picker UI
 * @param {string} messageId - Message ID
 * @returns {string} HTML string
 */
export function renderReactionsPicker(messageId) {
  const myReaction = getMyReaction(messageId);

  return `
    <div class="reactions-picker flex gap-1 p-2 bg-dark-secondary rounded-xl shadow-lg"
         role="group"
         aria-label="${t('selectReaction')}">
      ${AVAILABLE_REACTIONS.map(r => `
        <button
          type="button"
          class="reaction-btn p-2 text-xl rounded-lg hover:bg-white/10 transition-all ${myReaction === r.emoji ? 'bg-primary-500/20 ring-2 ring-primary-500' : ''}"
          onclick="window.toggleMessageReaction('${escapeHTML(messageId)}', '${r.emoji}')"
          aria-label="${r.label}"
          aria-pressed="${myReaction === r.emoji}"
          title="${r.label}"
        >
          ${r.emoji}
        </button>
      `).join('')}
    </div>
  `;
}

/**
 * Render reactions display for a message
 * @param {string} messageId - Message ID
 * @param {Object} options - { showCount: boolean, interactive: boolean }
 * @returns {string} HTML string
 */
export function renderReactionsDisplay(messageId, options = {}) {
  const { showCount = true, interactive = true } = options;
  const reactions = getReactions(messageId);
  const myReaction = getMyReaction(messageId);

  if (reactions.length === 0) {
    return '';
  }

  return `
    <div class="reactions-display flex flex-wrap gap-1 mt-1"
         role="group"
         aria-label="${t('messageReactions')}">
      ${reactions.map(r => {
        const isMine = r.userIds.some(id => {
          const state = getState();
          return id === (state.user?.uid || 'anonymous');
        });
        const usersText = r.users.slice(0, 3).join(', ') + (r.users.length > 3 ? ` +${r.users.length - 3}` : '');

        return `
          <button
            type="button"
            class="reaction-badge flex items-center gap-1 px-2 py-0.5 text-xs rounded-full transition-all
                   ${isMine ? 'bg-primary-500/30 text-primary-300' : 'bg-white/10 text-slate-300'}
                   ${interactive ? 'hover:bg-white/20 cursor-pointer' : 'cursor-default'}"
            ${interactive ? `onclick="window.toggleMessageReaction('${escapeHTML(messageId)}', '${r.emoji}')"` : ''}
            title="${usersText}"
            aria-label="${r.emoji} ${r.count} ${r.count > 1 ? 'reactions' : 'reaction'} - ${usersText}"
          >
            <span aria-hidden="true">${r.emoji}</span>
            ${showCount ? `<span class="font-medium">${r.count}</span>` : ''}
          </button>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Render a compact reactions summary
 * @param {string} messageId - Message ID
 * @returns {string} HTML string
 */
export function renderReactionsSummary(messageId) {
  const reactions = getReactions(messageId);

  if (reactions.length === 0) {
    return '';
  }

  const totalCount = reactions.reduce((sum, r) => sum + r.count, 0);
  const emojis = reactions.map(r => r.emoji).slice(0, 3).join('');

  return `
    <span class="reactions-summary text-xs text-slate-400" aria-label="${totalCount} reactions">
      ${emojis} ${totalCount}
    </span>
  `;
}

/**
 * Render add reaction button
 * @param {string} messageId - Message ID
 * @returns {string} HTML string
 */
export function renderAddReactionButton(messageId) {
  return `
    <button
      type="button"
      class="add-reaction-btn p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-all"
      onclick="window.showReactionPicker('${escapeHTML(messageId)}')"
      aria-label="${t('addReaction')}"
      title="${t('addReaction')}"
    >
      ${icon('smile', 'w-5 h-5')}
    </button>
  `;
}

// ==================== UTILITIES ====================

/**
 * Clear all reactions for a message
 * @param {string} messageId - Message ID
 * @returns {Object} Result { success }
 */
export function clearMessageReactions(messageId) {
  if (!messageId) {
    return { success: false, error: 'message_id_required' };
  }

  const storage = getReactionsStorage();
  delete storage[messageId];
  saveReactionsStorage(storage);

  return { success: true };
}

/**
 * Clear all reactions (for testing/reset)
 * @returns {Object} Result { success }
 */
export function clearAllReactions() {
  saveReactionsStorage({});
  return { success: true };
}

/**
 * Get reaction statistics
 * @returns {Object} Stats { totalReactions, uniqueMessages, topEmoji }
 */
export function getReactionStats() {
  const storage = getReactionsStorage();
  const messageIds = Object.keys(storage);

  let totalReactions = 0;
  const emojiCounts = {};

  messageIds.forEach(messageId => {
    const reactions = storage[messageId] || [];
    totalReactions += reactions.length;

    reactions.forEach(r => {
      emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1;
    });
  });

  // Find top emoji
  let topEmoji = null;
  let maxCount = 0;
  Object.entries(emojiCounts).forEach(([emoji, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topEmoji = emoji;
    }
  });

  return {
    totalReactions,
    uniqueMessages: messageIds.length,
    topEmoji,
    emojiCounts,
  };
}

/**
 * Get available reactions list
 * @returns {Array} Available reactions
 */
export function getAvailableReactions() {
  return [...AVAILABLE_REACTIONS];
}

/**
 * Check if an emoji is a valid reaction
 * @param {string} emoji - Emoji to check
 * @returns {boolean}
 */
export function isValidReaction(emoji) {
  return AVAILABLE_REACTIONS.some(r => r.emoji === emoji);
}

// ==================== GLOBAL HANDLERS ====================

// Expose handlers to window
if (typeof window !== 'undefined') {
  window.toggleMessageReaction = (messageId, emoji) => {
    const result = toggleReaction(messageId, emoji);
    if (result.success) {
      // Trigger re-render
      const state = getState();
      setState({ ...state, lastReactionUpdate: Date.now() });
    }
  };

  window.showReactionPicker = (messageId) => {
    // Store current message ID for picker
    window.currentReactionMessageId = messageId;

    // Show picker (implementation depends on UI framework)
    const existingPicker = document.getElementById('reaction-picker-popup');
    if (existingPicker) {
      existingPicker.remove();
    }

    const picker = document.createElement('div');
    picker.id = 'reaction-picker-popup';
    picker.className = 'fixed z-50';
    picker.innerHTML = renderReactionsPicker(messageId);

    // Position near the button that triggered it
    const event = window.event;
    if (event && event.target) {
      const rect = event.target.getBoundingClientRect();
      picker.style.left = `${rect.left}px`;
      picker.style.top = `${rect.bottom + 5}px`;
    }

    document.body.appendChild(picker);

    // Close on click outside
    const closeHandler = (e) => {
      if (!picker.contains(e.target)) {
        picker.remove();
        document.removeEventListener('click', closeHandler);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', closeHandler);
    }, 100);
  };
}

// Export default
export default {
  AVAILABLE_REACTIONS,
  addReaction,
  removeReaction,
  toggleReaction,
  getReactions,
  getRawReactions,
  getMyReaction,
  hasReacted,
  getReactionCount,
  getUsersForReaction,
  renderReactionsPicker,
  renderReactionsDisplay,
  renderReactionsSummary,
  renderAddReactionButton,
  clearMessageReactions,
  clearAllReactions,
  getReactionStats,
  getAvailableReactions,
  isValidReaction,
};
