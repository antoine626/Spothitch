/**
 * Private Messages Service
 * Feature #179 - Messages prives
 *
 * Gestion des conversations privees entre utilisateurs
 * Inclut: envoi de messages, liste des conversations, notifications, blocage
 */

import { getState, setState } from '../stores/state.js'
import { Storage } from '../utils/storage.js'
import { showToast } from './notifications.js'
import { t } from '../i18n/index.js'
import { isUserBlocked, canInteractWith } from './userBlocking.js'
import { icon } from '../utils/icons.js'

// Storage keys
const CONVERSATIONS_KEY = 'spothitch_conversations'
const PRIVATE_MESSAGES_KEY = 'spothitch_private_messages'
const UNREAD_COUNTS_KEY = 'spothitch_unread_counts'
const MUTED_CONVERSATIONS_KEY = 'spothitch_muted_conversations'

// Constants
export const PM_MAX_LENGTH = 5000
export const MAX_CONVERSATIONS = 100
export const MAX_MESSAGES_PER_CONVERSATION = 200

/**
 * Message status enum
 */
export const PMStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
}

/**
 * Conversation status enum
 */
export const ConversationStatus = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
}

// In-memory storage
let conversations = []
let privateMessages = {}
let unreadCounts = {}
let mutedConversations = new Set()

/**
 * Initialize private messages service
 * @returns {Object} Result with success status
 */
export function initPrivateMessages() {
  try {
    // Load from storage
    const cachedConversations = Storage.get(CONVERSATIONS_KEY)
    if (Array.isArray(cachedConversations)) {
      conversations = cachedConversations
    }

    const cachedMessages = Storage.get(PRIVATE_MESSAGES_KEY)
    if (cachedMessages && typeof cachedMessages === 'object') {
      privateMessages = cachedMessages
    }

    const cachedUnread = Storage.get(UNREAD_COUNTS_KEY)
    if (cachedUnread && typeof cachedUnread === 'object') {
      unreadCounts = cachedUnread
    }

    const cachedMuted = Storage.get(MUTED_CONVERSATIONS_KEY)
    if (Array.isArray(cachedMuted)) {
      mutedConversations = new Set(cachedMuted)
    }

    // Update state with total unread
    updateUnreadState()

    return { success: true }
  } catch (error) {
    console.error('[PrivateMessages] Init error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Save all data to storage
 */
function persistData() {
  Storage.set(CONVERSATIONS_KEY, conversations)
  Storage.set(PRIVATE_MESSAGES_KEY, privateMessages)
  Storage.set(UNREAD_COUNTS_KEY, unreadCounts)
  Storage.set(MUTED_CONVERSATIONS_KEY, Array.from(mutedConversations))
}

/**
 * Update unread count in global state
 */
function updateUnreadState() {
  const total = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)
  setState({ unreadFriendMessages: total })
}

/**
 * Get conversation ID for two users (consistent ordering)
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {string} Conversation ID
 */
export function getConversationId(userId1, userId2) {
  if (!userId1 || !userId2) return null
  const sorted = [userId1, userId2].sort()
  return `conv_${sorted[0]}_${sorted[1]}`
}

// ==================== SEND MESSAGE ====================

/**
 * Send a private message to a user
 * @param {string} userId - ID of the recipient
 * @param {string} content - Message content
 * @param {Object} options - Additional options (replyTo, type, metadata)
 * @returns {Object} Result with success status and message data
 */
export function sendPrivateMessage(userId, content, options = {}) {
  if (!userId) {
    return { success: false, error: 'invalid_user_id' }
  }

  if (!content || typeof content !== 'string') {
    return { success: false, error: 'invalid_content' }
  }

  const trimmedContent = content.trim()
  if (trimmedContent.length === 0) {
    return { success: false, error: 'empty_content' }
  }

  if (trimmedContent.length > PM_MAX_LENGTH) {
    showToast(t('messageTooLong') || `Message trop long (max ${PM_MAX_LENGTH} caracteres)`, 'warning')
    return { success: false, error: 'content_too_long' }
  }

  const state = getState()
  const currentUserId = state.user?.uid

  if (!currentUserId) {
    showToast(t('loginRequired') || 'Connexion requise', 'warning')
    return { success: false, error: 'not_authenticated' }
  }

  // Cannot message yourself
  if (userId === currentUserId) {
    return { success: false, error: 'cannot_message_self' }
  }

  // Check if user is blocked
  if (isUserBlocked(userId)) {
    showToast(t('userIsBlocked') || 'Cet utilisateur est bloque', 'warning')
    return { success: false, error: 'user_blocked' }
  }

  // Check if we can interact (not blocked by them)
  if (!canInteractWith(userId)) {
    showToast(t('cannotSendMessage') || 'Impossible d\'envoyer le message', 'warning')
    return { success: false, error: 'cannot_interact' }
  }

  const conversationId = getConversationId(currentUserId, userId)
  const userName = state.username || state.user?.displayName || 'Anonyme'
  const userAvatar = state.avatar || '🤙'

  // Create message object
  const message = {
    id: `pm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    conversationId,
    senderId: currentUserId,
    senderName: userName,
    senderAvatar: userAvatar,
    recipientId: userId,
    content: trimmedContent,
    timestamp: new Date().toISOString(),
    status: PMStatus.SENT,
    type: options.type || 'text',
    replyTo: options.replyTo || null,
    metadata: options.metadata || null,
    edited: false,
    editedAt: null,
  }

  // Ensure conversation exists
  ensureConversation(userId)

  // Add message to conversation
  if (!privateMessages[conversationId]) {
    privateMessages[conversationId] = []
  }
  privateMessages[conversationId].push(message)

  // Trim if too many messages
  if (privateMessages[conversationId].length > MAX_MESSAGES_PER_CONVERSATION) {
    privateMessages[conversationId] = privateMessages[conversationId].slice(-MAX_MESSAGES_PER_CONVERSATION)
  }

  // Update conversation last message
  updateConversationLastMessage(conversationId, message)

  // Persist
  persistData()

  return { success: true, message }
}

/**
 * Ensure a conversation exists with a user
 * @param {string} userId - ID of the other user
 */
function ensureConversation(userId) {
  const state = getState()
  const currentUserId = state.user?.uid
  const conversationId = getConversationId(currentUserId, userId)

  // Check if conversation already exists
  const existing = conversations.find((c) => c.id === conversationId)
  if (existing) return

  // Get user info from friends list if available
  const friends = state.friends || []
  const friend = friends.find((f) => f.id === userId)

  // Create new conversation
  const conversation = {
    id: conversationId,
    participantIds: [currentUserId, userId],
    participants: [
      {
        id: currentUserId,
        name: state.username || state.user?.displayName || 'Moi',
        avatar: state.avatar || '🤙',
      },
      {
        id: userId,
        name: friend?.name || friend?.username || 'Utilisateur',
        avatar: friend?.avatar || '👤',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastMessage: null,
    status: ConversationStatus.ACTIVE,
  }

  conversations.push(conversation)

  // Initialize unread count
  if (unreadCounts[conversationId] === undefined) {
    unreadCounts[conversationId] = 0
  }
}

/**
 * Update conversation's last message
 * @param {string} conversationId - Conversation ID
 * @param {Object} message - Last message object
 */
function updateConversationLastMessage(conversationId, message) {
  const convIndex = conversations.findIndex((c) => c.id === conversationId)
  if (convIndex === -1) return

  conversations[convIndex].lastMessage = {
    content: message.content.substring(0, 100),
    timestamp: message.timestamp,
    senderId: message.senderId,
  }
  conversations[convIndex].updatedAt = message.timestamp
}

// ==================== GET MESSAGES ====================

/**
 * Get conversation with a user
 * @param {string} userId - ID of the other user
 * @param {Object} options - Options (limit, before, after)
 * @returns {Array} Array of messages
 */
export function getConversation(userId, options = {}) {
  if (!userId) return []

  const state = getState()
  const currentUserId = state.user?.uid
  if (!currentUserId) return []

  const conversationId = getConversationId(currentUserId, userId)
  const messages = privateMessages[conversationId] || []

  // Apply limit
  const limit = options.limit || MAX_MESSAGES_PER_CONVERSATION
  let result = messages.slice(-limit)

  // Apply before filter
  if (options.before) {
    result = result.filter((m) => new Date(m.timestamp) < new Date(options.before))
  }

  // Apply after filter
  if (options.after) {
    result = result.filter((m) => new Date(m.timestamp) > new Date(options.after))
  }

  return result
}

/**
 * Get conversation by ID
 * @param {string} conversationId - Conversation ID
 * @returns {Array} Array of messages
 */
export function getConversationById(conversationId) {
  if (!conversationId) return []
  return privateMessages[conversationId] || []
}

/**
 * Get a single message by ID
 * @param {string} conversationId - Conversation ID
 * @param {string} messageId - Message ID
 * @returns {Object|null} Message object or null
 */
export function getPrivateMessage(conversationId, messageId) {
  if (!conversationId || !messageId) return null

  const messages = privateMessages[conversationId] || []
  return messages.find((m) => m.id === messageId) || null
}

// ==================== CONVERSATION LIST ====================

/**
 * Get list of all conversations
 * @param {Object} options - Options (status, limit)
 * @returns {Array} Array of conversation objects
 */
export function getConversations(options = {}) {
  const state = getState()
  const currentUserId = state.user?.uid
  if (!currentUserId) return []

  let result = conversations.filter((c) => c.participantIds.includes(currentUserId))

  // Filter by status
  if (options.status) {
    result = result.filter((c) => c.status === options.status)
  } else {
    // By default, exclude deleted
    result = result.filter((c) => c.status !== ConversationStatus.DELETED)
  }

  // Filter out conversations with blocked users
  result = result.filter((c) => {
    const otherUserId = c.participantIds.find((id) => id !== currentUserId)
    return canInteractWith(otherUserId)
  })

  // Sort by last update (most recent first)
  result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

  // Apply limit
  if (options.limit) {
    result = result.slice(0, options.limit)
  }

  // Add unread counts
  result = result.map((conv) => ({
    ...conv,
    unreadCount: unreadCounts[conv.id] || 0,
    isMuted: mutedConversations.has(conv.id),
  }))

  return result
}

/**
 * Get active conversations
 * @returns {Array} Array of active conversation objects
 */
export function getActiveConversations() {
  return getConversations({ status: ConversationStatus.ACTIVE })
}

/**
 * Get archived conversations
 * @returns {Array} Array of archived conversation objects
 */
export function getArchivedConversations() {
  return getConversations({ status: ConversationStatus.ARCHIVED })
}

/**
 * Get conversation details
 * @param {string} conversationId - Conversation ID
 * @returns {Object|null} Conversation object or null
 */
export function getConversationDetails(conversationId) {
  if (!conversationId) return null

  const conv = conversations.find((c) => c.id === conversationId)
  if (!conv) return null

  return {
    ...conv,
    unreadCount: unreadCounts[conversationId] || 0,
    isMuted: mutedConversations.has(conversationId),
    messages: privateMessages[conversationId] || [],
  }
}

// ==================== UNREAD & NOTIFICATIONS ====================

/**
 * Mark conversation as read
 * @param {string} conversationId - Conversation ID
 * @returns {Object} Result with success status
 */
export function markConversationAsRead(conversationId) {
  if (!conversationId) {
    return { success: false, error: 'invalid_conversation_id' }
  }

  unreadCounts[conversationId] = 0
  updateUnreadState()
  persistData()

  return { success: true }
}

/**
 * Mark conversation as read by user ID
 * @param {string} userId - ID of the other user
 * @returns {Object} Result with success status
 */
export function markAsRead(userId) {
  if (!userId) {
    return { success: false, error: 'invalid_user_id' }
  }

  const state = getState()
  const currentUserId = state.user?.uid
  if (!currentUserId) {
    return { success: false, error: 'not_authenticated' }
  }

  const conversationId = getConversationId(currentUserId, userId)
  return markConversationAsRead(conversationId)
}

/**
 * Increment unread count for a conversation (called when receiving a message)
 * @param {string} conversationId - Conversation ID
 */
export function incrementUnread(conversationId) {
  if (!conversationId) return

  unreadCounts[conversationId] = (unreadCounts[conversationId] || 0) + 1
  updateUnreadState()
  persistData()

  // Show notification if not muted
  if (!mutedConversations.has(conversationId)) {
    const conv = conversations.find((c) => c.id === conversationId)
    if (conv) {
      const state = getState()
      const currentUserId = state.user?.uid
      const otherParticipant = conv.participants.find((p) => p.id !== currentUserId)
      showToast(
        `${t('newMessageFrom') || 'Nouveau message de'} ${otherParticipant?.name || 'Utilisateur'}`,
        'info'
      )
    }
  }
}

/**
 * Get total unread count
 * @returns {number} Total unread messages
 */
export function getTotalUnreadCount() {
  return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)
}

/**
 * Get unread count for a specific conversation
 * @param {string} conversationId - Conversation ID
 * @returns {number} Unread count
 */
export function getUnreadCount(conversationId) {
  if (!conversationId) return 0
  return unreadCounts[conversationId] || 0
}

// ==================== MUTE CONVERSATIONS ====================

/**
 * Mute a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Object} Result with success status
 */
export function muteConversation(conversationId) {
  if (!conversationId) {
    return { success: false, error: 'invalid_conversation_id' }
  }

  mutedConversations.add(conversationId)
  persistData()

  showToast(t('conversationMuted') || 'Conversation en sourdine', 'success')
  return { success: true }
}

/**
 * Unmute a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Object} Result with success status
 */
export function unmuteConversation(conversationId) {
  if (!conversationId) {
    return { success: false, error: 'invalid_conversation_id' }
  }

  mutedConversations.delete(conversationId)
  persistData()

  showToast(t('conversationUnmuted') || 'Notifications reactivees', 'success')
  return { success: true }
}

/**
 * Check if a conversation is muted
 * @param {string} conversationId - Conversation ID
 * @returns {boolean} True if muted
 */
export function isConversationMuted(conversationId) {
  if (!conversationId) return false
  return mutedConversations.has(conversationId)
}

// ==================== CONVERSATION MANAGEMENT ====================

/**
 * Archive a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Object} Result with success status
 */
export function archiveConversation(conversationId) {
  if (!conversationId) {
    return { success: false, error: 'invalid_conversation_id' }
  }

  const convIndex = conversations.findIndex((c) => c.id === conversationId)
  if (convIndex === -1) {
    return { success: false, error: 'conversation_not_found' }
  }

  conversations[convIndex].status = ConversationStatus.ARCHIVED
  persistData()

  showToast(t('conversationArchived') || 'Conversation archivee', 'success')
  return { success: true }
}

/**
 * Unarchive a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Object} Result with success status
 */
export function unarchiveConversation(conversationId) {
  if (!conversationId) {
    return { success: false, error: 'invalid_conversation_id' }
  }

  const convIndex = conversations.findIndex((c) => c.id === conversationId)
  if (convIndex === -1) {
    return { success: false, error: 'conversation_not_found' }
  }

  conversations[convIndex].status = ConversationStatus.ACTIVE
  persistData()

  showToast(t('conversationUnarchived') || 'Conversation restauree', 'success')
  return { success: true }
}

/**
 * Delete a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Object} Result with success status
 */
export function deleteConversation(conversationId) {
  if (!conversationId) {
    return { success: false, error: 'invalid_conversation_id' }
  }

  const convIndex = conversations.findIndex((c) => c.id === conversationId)
  if (convIndex === -1) {
    return { success: false, error: 'conversation_not_found' }
  }

  // Mark as deleted (soft delete)
  conversations[convIndex].status = ConversationStatus.DELETED

  // Clear unread
  delete unreadCounts[conversationId]

  // Remove from muted
  mutedConversations.delete(conversationId)

  updateUnreadState()
  persistData()

  showToast(t('conversationDeleted') || 'Conversation supprimee', 'success')
  return { success: true }
}

/**
 * Delete a message
 * @param {string} conversationId - Conversation ID
 * @param {string} messageId - Message ID
 * @returns {Object} Result with success status
 */
export function deletePrivateMessage(conversationId, messageId) {
  if (!conversationId || !messageId) {
    return { success: false, error: 'invalid_params' }
  }

  const messages = privateMessages[conversationId]
  if (!messages) {
    return { success: false, error: 'conversation_not_found' }
  }

  const messageIndex = messages.findIndex((m) => m.id === messageId)
  if (messageIndex === -1) {
    return { success: false, error: 'message_not_found' }
  }

  const state = getState()
  const currentUserId = state.user?.uid

  // Check ownership
  if (messages[messageIndex].senderId !== currentUserId) {
    return { success: false, error: 'not_message_owner' }
  }

  // Remove message
  messages.splice(messageIndex, 1)
  privateMessages[conversationId] = messages

  persistData()
  return { success: true }
}

/**
 * Edit a private message
 * @param {string} conversationId - Conversation ID
 * @param {string} messageId - Message ID
 * @param {string} newContent - New content
 * @returns {Object} Result with success status
 */
export function editPrivateMessage(conversationId, messageId, newContent) {
  if (!conversationId || !messageId) {
    return { success: false, error: 'invalid_params' }
  }

  if (!newContent || typeof newContent !== 'string') {
    return { success: false, error: 'invalid_content' }
  }

  const trimmedContent = newContent.trim()
  if (trimmedContent.length === 0) {
    return { success: false, error: 'empty_content' }
  }

  if (trimmedContent.length > PM_MAX_LENGTH) {
    return { success: false, error: 'content_too_long' }
  }

  const messages = privateMessages[conversationId]
  if (!messages) {
    return { success: false, error: 'conversation_not_found' }
  }

  const messageIndex = messages.findIndex((m) => m.id === messageId)
  if (messageIndex === -1) {
    return { success: false, error: 'message_not_found' }
  }

  const state = getState()
  const currentUserId = state.user?.uid

  // Check ownership
  if (messages[messageIndex].senderId !== currentUserId) {
    return { success: false, error: 'not_message_owner' }
  }

  // Update message
  messages[messageIndex].content = trimmedContent
  messages[messageIndex].edited = true
  messages[messageIndex].editedAt = new Date().toISOString()

  privateMessages[conversationId] = messages
  persistData()

  return { success: true }
}

// ==================== BLOCKED USERS ====================

/**
 * Check if can send message to user
 * @param {string} userId - ID of the user
 * @returns {boolean} True if can send
 */
export function canSendMessageTo(userId) {
  if (!userId) return false

  const state = getState()
  const currentUserId = state.user?.uid
  if (!currentUserId) return false
  if (userId === currentUserId) return false

  return canInteractWith(userId)
}

/**
 * Get other participant from conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Object|null} Participant object or null
 */
export function getOtherParticipant(conversationId) {
  if (!conversationId) return null

  const conv = conversations.find((c) => c.id === conversationId)
  if (!conv) return null

  const state = getState()
  const currentUserId = state.user?.uid

  return conv.participants.find((p) => p.id !== currentUserId) || null
}

// ==================== RENDERING ====================

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

/**
 * Format timestamp for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time
 */
function formatTime(timestamp) {
  if (!timestamp) return ''
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    // Less than 24h: show time
    if (diff < 86400000) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }

    // Less than 7 days: show day name
    if (diff < 604800000) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' })
    }

    // Otherwise: show date
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

/**
 * Render a private message
 * @param {Object} message - Message object
 * @returns {string} HTML string
 */
export function renderPrivateMessage(message) {
  if (!message) return ''

  const state = getState()
  const isOwn = message.senderId === state.user?.uid

  const editedLabel = message.edited ? `<span class="text-xs text-slate-400 ml-1">(modifie)</span>` : ''

  return `
    <div
      class="private-message ${isOwn ? 'ml-auto' : 'mr-auto'} max-w-[80%] mb-3"
      data-message-id="${escapeHTML(message.id)}"
    >
      <div class="flex items-start gap-2 ${isOwn ? 'flex-row-reverse' : ''}">
        <div class="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-lg shrink-0">
          ${escapeHTML(message.senderAvatar)}
        </div>
        <div class="${isOwn ? 'bg-primary-500' : 'bg-white/10'} rounded-2xl px-4 py-2">
          <div class="text-white text-sm">${escapeHTML(message.content)}${editedLabel}</div>
          <div class="text-xs ${isOwn ? 'text-primary-200' : 'text-slate-400'} mt-1 text-right">
            ${formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Render conversation list item
 * @param {Object} conversation - Conversation object
 * @returns {string} HTML string
 */
export function renderConversationItem(conversation) {
  if (!conversation) return ''

  const state = getState()
  const currentUserId = state.user?.uid
  const otherParticipant = conversation.participants.find((p) => p.id !== currentUserId)

  const unreadBadge =
    conversation.unreadCount > 0
      ? `<span class="unread-badge ml-2 px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">${conversation.unreadCount}</span>`
      : ''

  const mutedIcon = conversation.isMuted
    ? `<span class="text-slate-400 ml-2" aria-label="${t('muted') || 'Sourdine'}">${icon('bell-off', 'w-4 h-4')}</span>`
    : ''

  const lastMessage = conversation.lastMessage
    ? escapeHTML(conversation.lastMessage.content)
    : t('noMessages') || 'Aucun message'

  return `
    <div
      class="conversation-item flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-all"
      data-conversation-id="${escapeHTML(conversation.id)}"
      onclick="openConversation('${escapeHTML(conversation.id)}')"
      role="button"
      aria-label="${t('conversationWith') || 'Conversation avec'} ${escapeHTML(otherParticipant?.name || 'Utilisateur')}"
    >
      <div class="relative">
        <div class="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center text-2xl">
          ${escapeHTML(otherParticipant?.avatar || '👤')}
        </div>
        ${unreadBadge ? '<span class="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full"></span>' : ''}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center">
          <span class="font-medium text-white truncate">${escapeHTML(otherParticipant?.name || 'Utilisateur')}</span>
          ${mutedIcon}
          ${unreadBadge}
        </div>
        <div class="text-sm text-slate-400 truncate">${lastMessage}</div>
      </div>
      <div class="text-xs text-slate-400">
        ${formatTime(conversation.updatedAt)}
      </div>
    </div>
  `
}

/**
 * Render conversation list
 * @returns {string} HTML string
 */
export function renderConversationList() {
  const convs = getActiveConversations()

  if (convs.length === 0) {
    return `
      <div class="empty-state p-8 text-center" role="status">
        <div class="text-6xl mb-4">💬</div>
        <h3 class="text-lg font-semibold text-white mb-2">${escapeHTML(t('noConversations') || 'Aucune conversation')}</h3>
        <p class="text-slate-400 text-sm">${escapeHTML(t('noConversationsDesc') || 'Envoie un message a un ami pour commencer')}</p>
      </div>
    `
  }

  return `
    <div class="conversation-list space-y-2" role="list" aria-label="${t('conversations') || 'Conversations'}">
      ${convs.map((c) => renderConversationItem(c)).join('')}
    </div>
  `
}

/**
 * Render unread badge for navigation
 * @returns {string} HTML string
 */
export function renderUnreadBadge() {
  const total = getTotalUnreadCount()
  if (total === 0) return ''

  return `
    <span class="unread-badge absolute -top-1 -right-1 px-1.5 py-0.5 bg-primary-500 text-white text-xs rounded-full min-w-[20px] text-center">
      ${total > 99 ? '99+' : total}
    </span>
  `
}

// ==================== GLOBAL HANDLERS ====================

window.openConversation = (conversationId) => {
  const conv = conversations.find((c) => c.id === conversationId)
  if (conv) {
    setState({
      selectedFriendChat: conversationId,
      showPrivateChat: true,
    })
    markConversationAsRead(conversationId)
  }
}

window.sendPrivateMessageTo = (userId, content) => {
  return sendPrivateMessage(userId, content)
}

window.muteConvo = (conversationId) => {
  return muteConversation(conversationId)
}

window.unmuteConvo = (conversationId) => {
  return unmuteConversation(conversationId)
}

window.archiveConvo = (conversationId) => {
  return archiveConversation(conversationId)
}

window.deleteConvo = (conversationId) => {
  return deleteConversation(conversationId)
}

// Export default with all functions
export default {
  // Constants
  PM_MAX_LENGTH,
  MAX_CONVERSATIONS,
  MAX_MESSAGES_PER_CONVERSATION,
  PMStatus,
  ConversationStatus,
  // Init
  initPrivateMessages,
  // Conversation ID
  getConversationId,
  // Send/Get
  sendPrivateMessage,
  getConversation,
  getConversationById,
  getPrivateMessage,
  // Conversation list
  getConversations,
  getActiveConversations,
  getArchivedConversations,
  getConversationDetails,
  // Unread
  markConversationAsRead,
  markAsRead,
  incrementUnread,
  getTotalUnreadCount,
  getUnreadCount,
  // Mute
  muteConversation,
  unmuteConversation,
  isConversationMuted,
  // Management
  archiveConversation,
  unarchiveConversation,
  deleteConversation,
  deletePrivateMessage,
  editPrivateMessage,
  // Blocked users
  canSendMessageTo,
  getOtherParticipant,
  // Rendering
  renderPrivateMessage,
  renderConversationItem,
  renderConversationList,
  renderUnreadBadge,
}
