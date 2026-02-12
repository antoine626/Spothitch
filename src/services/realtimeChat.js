/**
 * Realtime Chat Service
 * Feature #178 - Chat temps reel
 *
 * Gestion du chat en temps reel avec Firebase Realtime/Firestore
 * Inclut: envoi de messages, abonnement aux rooms, indicateur de frappe, utilisateurs en ligne
 */

import { getState, setState } from '../stores/state.js'
import { Storage } from '../utils/storage.js'
import { showToast } from './notifications.js'
import { t } from '../i18n/index.js'
import { isUserBlocked, canInteractWith } from './userBlocking.js'

// Storage keys
const CHAT_ROOMS_KEY = 'spothitch_chat_rooms'
const TYPING_INDICATORS_KEY = 'spothitch_typing_indicators'
const ONLINE_USERS_KEY = 'spothitch_online_users'
const MESSAGES_CACHE_KEY = 'spothitch_messages_cache'

// Constants
export const MESSAGE_MAX_LENGTH = 2000
export const TYPING_TIMEOUT_MS = 3000
export const ONLINE_TIMEOUT_MS = 60000
export const MAX_MESSAGES_PER_ROOM = 100

/**
 * Message status enum
 */
export const MessageStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
}

/**
 * Room types enum
 */
export const RoomType = {
  GENERAL: 'general',
  COUNTRY: 'country',
  CITY: 'city',
  TRIP: 'trip',
  SPOT: 'spot',
  PRIVATE: 'private',
}

// In-memory stores for realtime data
let typingIndicators = {}
let onlineUsers = {}
let roomSubscriptions = new Map()
let typingTimeouts = new Map()
let onlineCheckInterval = null

/**
 * Initialize realtime chat service
 * @returns {Object} Result with success status
 */
export function initRealtimeChat() {
  try {
    // Load cached data
    const cachedTyping = Storage.get(TYPING_INDICATORS_KEY)
    if (cachedTyping) typingIndicators = cachedTyping

    const cachedOnline = Storage.get(ONLINE_USERS_KEY)
    if (cachedOnline) onlineUsers = cachedOnline

    // Start online status check
    startOnlineStatusCheck()

    // Set current user as online
    const state = getState()
    if (state.user?.uid) {
      setUserOnline(state.user.uid)
    }

    return { success: true }
  } catch (error) {
    console.error('[RealtimeChat] Init error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Destroy realtime chat service (cleanup)
 */
export function destroyRealtimeChat() {
  // Clear all subscriptions
  roomSubscriptions.forEach((unsub, roomId) => {
    if (typeof unsub === 'function') unsub()
  })
  roomSubscriptions.clear()

  // Clear typing timeouts
  typingTimeouts.forEach((timeout) => clearTimeout(timeout))
  typingTimeouts.clear()

  // Stop online check
  if (onlineCheckInterval) {
    clearInterval(onlineCheckInterval)
    onlineCheckInterval = null
  }

  // Set current user as offline
  const state = getState()
  if (state.user?.uid) {
    setUserOffline(state.user.uid)
  }

}

// ==================== MESSAGE FUNCTIONS ====================

/**
 * Send a message to a chat room
 * @param {string} roomId - ID of the room
 * @param {string} content - Message content
 * @param {Object} options - Additional options (type, replyTo, metadata)
 * @returns {Object} Result with success status and message data
 */
export function sendMessage(roomId, content, options = {}) {
  if (!roomId) {
    return { success: false, error: 'invalid_room_id' }
  }

  if (!content || typeof content !== 'string') {
    return { success: false, error: 'invalid_content' }
  }

  const trimmedContent = content.trim()
  if (trimmedContent.length === 0) {
    return { success: false, error: 'empty_content' }
  }

  if (trimmedContent.length > MESSAGE_MAX_LENGTH) {
    showToast(t('messageTooLong') || `Message trop long (max ${MESSAGE_MAX_LENGTH} caracteres)`, 'warning')
    return { success: false, error: 'content_too_long' }
  }

  const state = getState()
  const userId = state.user?.uid || 'anonymous'
  const userName = state.username || state.user?.displayName || 'Anonyme'
  const userAvatar = state.avatar || '🤙'

  // Create message object
  const message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    roomId,
    content: trimmedContent,
    userId,
    userName,
    userAvatar,
    timestamp: new Date().toISOString(),
    status: MessageStatus.SENT,
    type: options.type || 'text',
    replyTo: options.replyTo || null,
    metadata: options.metadata || null,
    edited: false,
    editedAt: null,
  }

  // Add to local messages
  addMessageToRoom(roomId, message)

  // Clear typing indicator for this user
  clearTypingIndicator(roomId, userId)

  // Notify subscribers
  notifyRoomSubscribers(roomId)

  return { success: true, message }
}

/**
 * Get messages for a chat room
 * @param {string} roomId - ID of the room
 * @param {Object} options - Options (limit, before, after)
 * @returns {Array} Array of messages
 */
export function getMessages(roomId, options = {}) {
  if (!roomId) return []

  const state = getState()
  const messages = state.messages || []
  const roomMessages = messages.filter((m) => m.roomId === roomId)

  // Filter out messages from blocked users
  const filteredMessages = roomMessages.filter((m) => {
    if (m.userId === state.user?.uid) return true
    return canInteractWith(m.userId)
  })

  // Apply limit
  const limit = options.limit || MAX_MESSAGES_PER_ROOM
  let result = filteredMessages.slice(-limit)

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
 * Get a single message by ID
 * @param {string} messageId - ID of the message
 * @returns {Object|null} Message object or null
 */
export function getMessage(messageId) {
  if (!messageId) return null

  const state = getState()
  const messages = state.messages || []
  return messages.find((m) => m.id === messageId) || null
}

/**
 * Edit a message
 * @param {string} messageId - ID of the message
 * @param {string} newContent - New content
 * @returns {Object} Result with success status
 */
export function editMessage(messageId, newContent) {
  if (!messageId) {
    return { success: false, error: 'invalid_message_id' }
  }

  if (!newContent || typeof newContent !== 'string') {
    return { success: false, error: 'invalid_content' }
  }

  const trimmedContent = newContent.trim()
  if (trimmedContent.length === 0) {
    return { success: false, error: 'empty_content' }
  }

  if (trimmedContent.length > MESSAGE_MAX_LENGTH) {
    return { success: false, error: 'content_too_long' }
  }

  const state = getState()
  const messages = state.messages || []
  const messageIndex = messages.findIndex((m) => m.id === messageId)

  if (messageIndex === -1) {
    return { success: false, error: 'message_not_found' }
  }

  const message = messages[messageIndex]
  const currentUserId = state.user?.uid

  // Check ownership
  if (message.userId !== currentUserId) {
    return { success: false, error: 'not_message_owner' }
  }

  // Update message
  const updatedMessages = [...messages]
  updatedMessages[messageIndex] = {
    ...message,
    content: trimmedContent,
    edited: true,
    editedAt: new Date().toISOString(),
  }

  setState({ messages: updatedMessages })

  // Notify subscribers
  notifyRoomSubscribers(message.roomId)

  return { success: true }
}

/**
 * Delete a message
 * @param {string} messageId - ID of the message
 * @returns {Object} Result with success status
 */
export function deleteMessage(messageId) {
  if (!messageId) {
    return { success: false, error: 'invalid_message_id' }
  }

  const state = getState()
  const messages = state.messages || []
  const message = messages.find((m) => m.id === messageId)

  if (!message) {
    return { success: false, error: 'message_not_found' }
  }

  const currentUserId = state.user?.uid

  // Check ownership
  if (message.userId !== currentUserId) {
    return { success: false, error: 'not_message_owner' }
  }

  // Remove message
  const updatedMessages = messages.filter((m) => m.id !== messageId)
  setState({ messages: updatedMessages })

  // Notify subscribers
  notifyRoomSubscribers(message.roomId)

  return { success: true }
}

// ==================== ROOM SUBSCRIPTION ====================

/**
 * Subscribe to a chat room for realtime updates
 * @param {string} roomId - ID of the room
 * @param {Function} callback - Callback function when messages change
 * @returns {Function} Unsubscribe function
 */
export function subscribeToRoom(roomId, callback) {
  if (!roomId || typeof callback !== 'function') {
    console.warn('[RealtimeChat] Invalid subscription params')
    return () => {}
  }

  // Store subscription
  const subscriptions = roomSubscriptions.get(roomId) || []
  subscriptions.push(callback)
  roomSubscriptions.set(roomId, subscriptions)

  // Call immediately with current messages
  const messages = getMessages(roomId)
  callback(messages)

  // Return unsubscribe function
  return () => {
    const subs = roomSubscriptions.get(roomId) || []
    const index = subs.indexOf(callback)
    if (index > -1) {
      subs.splice(index, 1)
      if (subs.length === 0) {
        roomSubscriptions.delete(roomId)
      } else {
        roomSubscriptions.set(roomId, subs)
      }
    }
  }
}

/**
 * Notify all subscribers of a room
 * @param {string} roomId - ID of the room
 */
function notifyRoomSubscribers(roomId) {
  const subscriptions = roomSubscriptions.get(roomId)
  if (!subscriptions || subscriptions.length === 0) return

  const messages = getMessages(roomId)
  subscriptions.forEach((callback) => {
    try {
      callback(messages)
    } catch (error) {
      console.error('[RealtimeChat] Subscriber error:', error)
    }
  })
}

/**
 * Add message to room (local state)
 * @param {string} roomId - ID of the room
 * @param {Object} message - Message object
 */
function addMessageToRoom(roomId, message) {
  const state = getState()
  const messages = state.messages || []

  // Check for duplicate
  if (messages.some((m) => m.id === message.id)) {
    return
  }

  // Add message
  const updatedMessages = [...messages, message]

  // Trim to max messages
  const roomMessages = updatedMessages.filter((m) => m.roomId === roomId)
  if (roomMessages.length > MAX_MESSAGES_PER_ROOM) {
    const toRemove = roomMessages.slice(0, roomMessages.length - MAX_MESSAGES_PER_ROOM)
    const idsToRemove = new Set(toRemove.map((m) => m.id))
    const trimmedMessages = updatedMessages.filter((m) => !idsToRemove.has(m.id))
    setState({ messages: trimmedMessages })
  } else {
    setState({ messages: updatedMessages })
  }
}

// ==================== TYPING INDICATORS ====================

/**
 * Set typing indicator for current user in a room
 * @param {string} roomId - ID of the room
 */
export function setTypingIndicator(roomId) {
  if (!roomId) return

  const state = getState()
  const userId = state.user?.uid
  if (!userId) return

  const userName = state.username || state.user?.displayName || 'Anonyme'

  // Set typing indicator
  if (!typingIndicators[roomId]) {
    typingIndicators[roomId] = {}
  }

  typingIndicators[roomId][userId] = {
    userName,
    timestamp: Date.now(),
  }

  // Save to storage
  Storage.set(TYPING_INDICATORS_KEY, typingIndicators)

  // Clear existing timeout for this user
  const timeoutKey = `${roomId}_${userId}`
  if (typingTimeouts.has(timeoutKey)) {
    clearTimeout(typingTimeouts.get(timeoutKey))
  }

  // Set new timeout to clear typing
  const timeout = setTimeout(() => {
    clearTypingIndicator(roomId, userId)
  }, TYPING_TIMEOUT_MS)

  typingTimeouts.set(timeoutKey, timeout)
}

/**
 * Clear typing indicator for a user
 * @param {string} roomId - ID of the room
 * @param {string} userId - ID of the user
 */
export function clearTypingIndicator(roomId, userId) {
  if (!roomId || !userId) return

  if (typingIndicators[roomId]) {
    delete typingIndicators[roomId][userId]
    if (Object.keys(typingIndicators[roomId]).length === 0) {
      delete typingIndicators[roomId]
    }
    Storage.set(TYPING_INDICATORS_KEY, typingIndicators)
  }

  // Clear timeout
  const timeoutKey = `${roomId}_${userId}`
  if (typingTimeouts.has(timeoutKey)) {
    clearTimeout(typingTimeouts.get(timeoutKey))
    typingTimeouts.delete(timeoutKey)
  }
}

/**
 * Get users currently typing in a room
 * @param {string} roomId - ID of the room
 * @returns {Array} Array of typing users (excluding blocked users)
 */
export function getTypingUsers(roomId) {
  if (!roomId || !typingIndicators[roomId]) return []

  const state = getState()
  const currentUserId = state.user?.uid
  const now = Date.now()

  const typingUsers = []
  Object.entries(typingIndicators[roomId]).forEach(([userId, data]) => {
    // Exclude self
    if (userId === currentUserId) return

    // Exclude blocked users
    if (isUserBlocked(userId)) return

    // Exclude expired typing indicators
    if (now - data.timestamp > TYPING_TIMEOUT_MS) return

    typingUsers.push({
      userId,
      userName: data.userName,
    })
  })

  return typingUsers
}

/**
 * Check if anyone is typing in a room
 * @param {string} roomId - ID of the room
 * @returns {boolean} True if someone is typing
 */
export function isAnyoneTyping(roomId) {
  return getTypingUsers(roomId).length > 0
}

// ==================== ONLINE USERS ====================

/**
 * Set user as online
 * @param {string} userId - ID of the user
 */
export function setUserOnline(userId) {
  if (!userId) return

  const state = getState()
  const userName = state.username || state.user?.displayName || 'Anonyme'

  onlineUsers[userId] = {
    userName,
    lastSeen: Date.now(),
  }

  Storage.set(ONLINE_USERS_KEY, onlineUsers)
}

/**
 * Set user as offline
 * @param {string} userId - ID of the user
 */
export function setUserOffline(userId) {
  if (!userId) return

  if (onlineUsers[userId]) {
    onlineUsers[userId].lastSeen = Date.now()
    onlineUsers[userId].offline = true
    Storage.set(ONLINE_USERS_KEY, onlineUsers)
  }
}

/**
 * Check if a user is online
 * @param {string} userId - ID of the user
 * @returns {boolean} True if online
 */
export function isUserOnline(userId) {
  if (!userId || !onlineUsers[userId]) return false

  const user = onlineUsers[userId]
  if (user.offline) return false

  // Check if last seen is within timeout
  return Date.now() - user.lastSeen < ONLINE_TIMEOUT_MS
}

/**
 * Get all online users
 * @returns {Array} Array of online user objects
 */
export function getOnlineUsers() {
  const state = getState()
  const currentUserId = state.user?.uid
  const result = []

  Object.entries(onlineUsers).forEach(([userId, data]) => {
    // Exclude self
    if (userId === currentUserId) return

    // Exclude blocked users
    if (isUserBlocked(userId)) return

    // Check if online
    if (!data.offline && Date.now() - data.lastSeen < ONLINE_TIMEOUT_MS) {
      result.push({
        id: userId,
        userName: data.userName,
        lastSeen: data.lastSeen,
      })
    }
  })

  return result
}

/**
 * Get online user count for a room
 * @param {string} roomId - ID of the room (optional, for future room-specific tracking)
 * @returns {number} Number of online users
 */
export function getOnlineUserCount(roomId = null) {
  return getOnlineUsers().length
}

/**
 * Start periodic online status check
 */
function startOnlineStatusCheck() {
  if (onlineCheckInterval) return

  onlineCheckInterval = setInterval(() => {
    const state = getState()
    if (state.user?.uid) {
      // Refresh own online status
      setUserOnline(state.user.uid)
    }

    // Clean up expired typing indicators
    const now = Date.now()
    Object.keys(typingIndicators).forEach((roomId) => {
      Object.keys(typingIndicators[roomId] || {}).forEach((userId) => {
        if (now - typingIndicators[roomId][userId].timestamp > TYPING_TIMEOUT_MS) {
          clearTypingIndicator(roomId, userId)
        }
      })
    })
  }, 30000) // Every 30 seconds
}

// ==================== ROOM MANAGEMENT ====================

/**
 * Get available chat rooms
 * @returns {Array} Array of room objects
 */
export function getChatRooms() {
  const defaultRooms = [
    { id: 'general', name: 'General', type: RoomType.GENERAL, icon: '💬' },
    { id: 'france', name: 'France', type: RoomType.COUNTRY, icon: '🇫🇷' },
    { id: 'spain', name: 'Espana', type: RoomType.COUNTRY, icon: '🇪🇸' },
    { id: 'germany', name: 'Deutschland', type: RoomType.COUNTRY, icon: '🇩🇪' },
    { id: 'italy', name: 'Italia', type: RoomType.COUNTRY, icon: '🇮🇹' },
    { id: 'tips', name: 'Conseils', type: RoomType.GENERAL, icon: '💡' },
    { id: 'meetups', name: 'Rencontres', type: RoomType.GENERAL, icon: '🤝' },
  ]

  const customRooms = Storage.get(CHAT_ROOMS_KEY) || []
  return [...defaultRooms, ...customRooms]
}

/**
 * Get room by ID
 * @param {string} roomId - ID of the room
 * @returns {Object|null} Room object or null
 */
export function getRoom(roomId) {
  if (!roomId) return null
  return getChatRooms().find((r) => r.id === roomId) || null
}

/**
 * Join a chat room
 * @param {string} roomId - ID of the room
 * @returns {Object} Result with success status
 */
export function joinRoom(roomId) {
  if (!roomId) {
    return { success: false, error: 'invalid_room_id' }
  }

  const room = getRoom(roomId)
  if (!room) {
    return { success: false, error: 'room_not_found' }
  }

  setState({ chatRoom: roomId })
  return { success: true, room }
}

/**
 * Leave a chat room
 * @param {string} roomId - ID of the room
 * @returns {Object} Result with success status
 */
export function leaveRoom(roomId) {
  if (!roomId) {
    return { success: false, error: 'invalid_room_id' }
  }

  const state = getState()
  const userId = state.user?.uid

  // Clear typing indicator
  if (userId) {
    clearTypingIndicator(roomId, userId)
  }

  // Unsubscribe from room
  const subscriptions = roomSubscriptions.get(roomId) || []
  subscriptions.forEach((unsub) => {
    if (typeof unsub === 'function') unsub()
  })
  roomSubscriptions.delete(roomId)

  return { success: true }
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
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

/**
 * Render a single message
 * @param {Object} message - Message object
 * @returns {string} HTML string
 */
export function renderMessage(message) {
  if (!message) return ''

  const state = getState()
  const isOwn = message.userId === state.user?.uid

  const editedLabel = message.edited ? `<span class="text-xs text-slate-500 ml-1">(modifie)</span>` : ''

  return `
    <div
      class="message ${isOwn ? 'message-own ml-auto' : 'message-other mr-auto'} max-w-[80%] mb-3"
      data-message-id="${escapeHTML(message.id)}"
      data-user-id="${escapeHTML(message.userId)}"
    >
      <div class="flex items-start gap-2 ${isOwn ? 'flex-row-reverse' : ''}">
        <div class="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-lg flex-shrink-0">
          ${escapeHTML(message.userAvatar)}
        </div>
        <div class="${isOwn ? 'bg-primary-500' : 'bg-white/10'} rounded-2xl px-4 py-2">
          <div class="text-xs ${isOwn ? 'text-primary-200' : 'text-slate-400'} mb-1">
            ${escapeHTML(message.userName)}
          </div>
          <div class="text-white text-sm">${escapeHTML(message.content)}${editedLabel}</div>
          <div class="text-xs ${isOwn ? 'text-primary-200' : 'text-slate-500'} mt-1 text-right">
            ${formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Render typing indicator
 * @param {string} roomId - ID of the room
 * @returns {string} HTML string
 */
export function renderTypingIndicator(roomId) {
  const typingUsers = getTypingUsers(roomId)
  if (typingUsers.length === 0) return ''

  let text = ''
  if (typingUsers.length === 1) {
    text = `${typingUsers[0].userName} ${t('isTyping') || 'ecrit...'}`
  } else if (typingUsers.length === 2) {
    text = `${typingUsers[0].userName} ${t('and') || 'et'} ${typingUsers[1].userName} ${t('areTyping') || 'ecrivent...'}`
  } else {
    text = t('severalPeopleTyping') || 'Plusieurs personnes ecrivent...'
  }

  return `
    <div class="typing-indicator flex items-center gap-2 px-4 py-2 text-slate-400 text-sm animate-pulse">
      <div class="typing-dots flex gap-1">
        <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
        <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
        <span class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
      </div>
      <span>${escapeHTML(text)}</span>
    </div>
  `
}

/**
 * Render online users badge
 * @returns {string} HTML string
 */
export function renderOnlineUsersBadge() {
  const count = getOnlineUserCount()

  return `
    <div class="online-users-badge flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full">
      <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
      <span class="text-green-400 text-sm">${count} ${t('online') || 'en ligne'}</span>
    </div>
  `
}

/**
 * Render chat room list
 * @returns {string} HTML string
 */
export function renderChatRoomList() {
  const rooms = getChatRooms()
  const state = getState()
  const currentRoom = state.chatRoom || 'general'

  const roomItems = rooms
    .map(
      (room) => `
    <button
      onclick="joinChatRoom('${escapeHTML(room.id)}')"
      class="room-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        room.id === currentRoom ? 'bg-primary-500/20 border border-primary-500/50' : 'bg-white/5 hover:bg-white/10'
      }"
      aria-pressed="${room.id === currentRoom}"
    >
      <span class="text-2xl">${room.icon || '💬'}</span>
      <div class="flex-1 text-left">
        <div class="font-medium text-white">${escapeHTML(room.name)}</div>
        <div class="text-xs text-slate-400">${escapeHTML(room.type)}</div>
      </div>
    </button>
  `
    )
    .join('')

  return `
    <div class="chat-room-list space-y-2" role="listbox" aria-label="${t('chatRooms') || 'Salons de chat'}">
      ${roomItems}
    </div>
  `
}

// ==================== GLOBAL HANDLERS ====================

window.joinChatRoom = (roomId) => {
  const result = joinRoom(roomId)
  if (result.success) {
    showToast(`${t('joinedRoom') || 'Rejoint'}: ${result.room.name}`, 'success')
  }
}

window.sendChatMessage = (roomId, content) => {
  return sendMessage(roomId, content)
}

window.setTyping = (roomId) => {
  setTypingIndicator(roomId)
}

// Export default with all functions
export default {
  // Constants
  MESSAGE_MAX_LENGTH,
  TYPING_TIMEOUT_MS,
  ONLINE_TIMEOUT_MS,
  MAX_MESSAGES_PER_ROOM,
  MessageStatus,
  RoomType,
  // Init/Destroy
  initRealtimeChat,
  destroyRealtimeChat,
  // Messages
  sendMessage,
  getMessages,
  getMessage,
  editMessage,
  deleteMessage,
  // Subscriptions
  subscribeToRoom,
  // Typing
  setTypingIndicator,
  clearTypingIndicator,
  getTypingUsers,
  isAnyoneTyping,
  // Online
  setUserOnline,
  setUserOffline,
  isUserOnline,
  getOnlineUsers,
  getOnlineUserCount,
  // Rooms
  getChatRooms,
  getRoom,
  joinRoom,
  leaveRoom,
  // Rendering
  renderMessage,
  renderTypingIndicator,
  renderOnlineUsersBadge,
  renderChatRoomList,
}
