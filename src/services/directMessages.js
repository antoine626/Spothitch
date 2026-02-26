/**
 * Direct Messages Service
 * 1-to-1 private DM conversations (WhatsApp-style)
 * localStorage-backed with conversation list, unread tracking, and message management
 */

import { getState, setState } from '../stores/state.js'
import { Storage } from '../utils/storage.js'
import { t } from '../i18n/index.js'

// Storage keys
const DM_KEY = 'spothitch_direct_messages'
const DM_READ_KEY = 'spothitch_dm_read_status'

/**
 * Get all DM conversations from storage
 * @returns {Object} { conversationId: [messages] }
 */
function getDMStorage() {
  try {
    return Storage.get(DM_KEY) || {}
  } catch {
    return {}
  }
}

/**
 * Save DM storage
 * @param {Object} data
 */
function saveDMStorage(data) {
  try {
    Storage.set(DM_KEY, data)
  } catch (e) {
    console.error('[DirectMessages] Storage error:', e)
  }
}

/**
 * Get read status storage
 * @returns {Object} { conversationId: lastReadTimestamp }
 */
function getReadStatus() {
  try {
    return Storage.get(DM_READ_KEY) || {}
  } catch {
    return {}
  }
}

/**
 * Save read status
 * @param {Object} data
 */
function saveReadStatus(data) {
  try {
    Storage.set(DM_READ_KEY, data)
  } catch (e) {
    console.error('[DirectMessages] Read status error:', e)
  }
}

/**
 * Generate a conversation ID from two user IDs
 * @param {string} userId1
 * @param {string} userId2
 * @returns {string}
 */
function getConversationId(userId1, userId2) {
  return [userId1, userId2].sort().join('_dm_')
}

/**
 * Send a direct message
 * @param {string} recipientId - Recipient user ID
 * @param {string} text - Message text
 * @param {Object} options - { type: 'text'|'spot_share'|'location_share', spot, location }
 * @returns {Object} { success, message }
 */
function sendDirectMessage(recipientId, text, options = {}) {
  const state = getState()
  const userId = state.user?.uid || 'local-user'

  if (!recipientId) {
    return { success: false, error: 'no_recipient' }
  }

  if (!text || !text.trim()) {
    return { success: false, error: 'empty_message' }
  }

  const storage = getDMStorage()
  const convId = getConversationId(userId, recipientId)

  if (!storage[convId]) {
    storage[convId] = []
  }

  const message = {
    id: `dm_${Date.now()}_${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`,
    text: text.trim(),
    senderId: userId,
    senderName: state.username || t('traveler') || 'Voyageur',
    senderAvatar: state.avatar || '🤙',
    recipientId,
    createdAt: new Date().toISOString(),
    read: false,
    type: options.type || 'text',
  }

  if (options.spot) {
    message.spot = options.spot
  }

  if (options.location) {
    message.location = options.location
  }

  storage[convId].push(message)

  // Keep max 200 messages per conversation
  if (storage[convId].length > 200) {
    storage[convId] = storage[convId].slice(-200)
  }

  saveDMStorage(storage)

  return { success: true, message }
}

/**
 * Get messages for a conversation
 * @param {string} recipientId - The other user's ID
 * @returns {Array} messages
 */
export function getConversationMessages(recipientId) {
  const state = getState()
  const userId = state.user?.uid || 'local-user'
  const storage = getDMStorage()
  const convId = getConversationId(userId, recipientId)
  return storage[convId] || []
}

/**
 * Mark a conversation as read
 * @param {string} recipientId
 */
function markConversationRead(recipientId) {
  const state = getState()
  const userId = state.user?.uid || 'local-user'
  const convId = getConversationId(userId, recipientId)

  const readStatus = getReadStatus()
  readStatus[convId] = new Date().toISOString()
  saveReadStatus(readStatus)

  // Also mark messages as read
  const storage = getDMStorage()
  if (storage[convId]) {
    storage[convId] = storage[convId].map(msg => {
      if (msg.recipientId === userId && !msg.read) {
        return { ...msg, read: true }
      }
      return msg
    })
    saveDMStorage(storage)
  }
}

/**
 * Get unread count for a conversation
 * @param {string} recipientId
 * @returns {number}
 */
function getUnreadCount(recipientId) {
  const state = getState()
  const userId = state.user?.uid || 'local-user'
  const storage = getDMStorage()
  const convId = getConversationId(userId, recipientId)
  const messages = storage[convId] || []

  return messages.filter(m => m.recipientId === userId && !m.read).length
}

/**
 * Get total unread DM count across all conversations
 * @returns {number}
 */
function getTotalUnreadCount() {
  const state = getState()
  const userId = state.user?.uid || 'local-user'
  const storage = getDMStorage()
  let total = 0

  Object.values(storage).forEach(messages => {
    messages.forEach(msg => {
      if (msg.recipientId === userId && !msg.read) {
        total++
      }
    })
  })

  return total
}

/**
 * Get list of all conversations sorted by most recent
 * @returns {Array} [{ recipientId, recipientName, recipientAvatar, lastMessage, lastMessageTime, unreadCount, online }]
 */
export function getConversationsList() {
  const state = getState()
  const userId = state.user?.uid || 'local-user'
  const storage = getDMStorage()
  const friends = state.friends || []
  const conversations = []

  // Build conversation list from friends who have messages
  const friendMap = {}
  friends.forEach(f => {
    friendMap[f.id] = f
  })

  // Collect all conversations
  Object.entries(storage).forEach(([convId, messages]) => {
    if (!messages || messages.length === 0) return

    // Find the other user ID from the conversation
    const parts = convId.split('_dm_')
    const otherId = parts[0] === userId ? parts[1] : parts[0]
    if (!otherId) return

    const friend = friendMap[otherId]
    const lastMsg = messages[messages.length - 1]
    const unread = messages.filter(m => m.recipientId === userId && !m.read).length

    conversations.push({
      recipientId: otherId,
      recipientName: friend?.name || lastMsg?.senderName || t('traveler') || 'Voyageur',
      recipientAvatar: friend?.avatar || lastMsg?.senderAvatar || '🤙',
      lastMessage: lastMsg?.text || '',
      lastMessageTime: lastMsg?.createdAt || '',
      lastMessageSenderId: lastMsg?.senderId || '',
      unreadCount: unread,
      online: friend?.online || false,
    })
  })

  // Also add friends without messages
  friends.forEach(friend => {
    const convId = getConversationId(userId, friend.id)
    if (!storage[convId] || storage[convId].length === 0) {
      // Don't add friends without messages to the conversation list
      // They appear in the friends tab
    }
  })

  // Sort by most recent message
  conversations.sort((a, b) => {
    if (!a.lastMessageTime) return 1
    if (!b.lastMessageTime) return -1
    return b.lastMessageTime.localeCompare(a.lastMessageTime)
  })

  return conversations
}

/**
 * Delete a conversation
 * @param {string} recipientId
 * @returns {Object} { success }
 */
function deleteConversation(recipientId) {
  const state = getState()
  const userId = state.user?.uid || 'local-user'
  const storage = getDMStorage()
  const convId = getConversationId(userId, recipientId)

  delete storage[convId]
  saveDMStorage(storage)

  return { success: true }
}

/**
 * Share a spot in DM
 * @param {string} recipientId
 * @param {Object} spot - { id, name, city, country, rating, lat, lng }
 * @returns {Object}
 */
function shareSpotInDM(recipientId, spot) {
  return sendDirectMessage(recipientId, t('checkThisSpot') || 'Check ce spot !', {
    type: 'spot_share',
    spot: {
      id: spot.id,
      name: spot.name,
      city: spot.city,
      country: spot.country,
      rating: spot.rating,
      lat: spot.lat,
      lng: spot.lng,
    },
  })
}

/**
 * Share position in DM
 * @param {string} recipientId
 * @param {Object} location - { lat, lng, address }
 * @returns {Object}
 */
function sharePositionInDM(recipientId, location) {
  return sendDirectMessage(recipientId, t('hereIsMyPosition') || 'Voici ma position', {
    type: 'location_share',
    location,
  })
}

// Global handlers
window.openConversation = (recipientId) => {
  markConversationRead(recipientId)
  setState({ activeDMConversation: recipientId })
}

window.closeConversation = () => {
  setState({ activeDMConversation: null })
}

window.sendDM = (recipientId) => {
  const input = document.getElementById('dm-input')
  if (!input?.value?.trim()) return

  const text = input.value.trim()
  input.value = ''

  const result = sendDirectMessage(recipientId, text)
  if (result.success) {
    // Re-render by triggering state update
    setState({ dmLastSent: Date.now() })

    // Scroll to bottom
    setTimeout(() => {
      const chatEl = document.getElementById('dm-messages')
      if (chatEl) chatEl.scrollTop = chatEl.scrollHeight
    }, 50)
  }
}

window.shareDMSpot = (recipientId) => {
  const state = getState()
  if (state.selectedSpot) {
    shareSpotInDM(recipientId, state.selectedSpot)
    setState({ dmLastSent: Date.now() })
  }
}

window.shareDMPosition = async (recipientId) => {
  if (!navigator.geolocation) return

  navigator.geolocation.getCurrentPosition(
    (position) => {
      sharePositionInDM(recipientId, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        address: t('sharedPosition') || 'Position partagee',
      })
      setState({ dmLastSent: Date.now() })
    },
    () => {
      window.showToast?.(t('positionFailed') || 'Impossible de recuperer la position', 'error')
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

window.deleteDMConversation = (recipientId) => {
  if (window.confirm(t('confirmDeleteConversation') || 'Supprimer cette conversation ?')) {
    deleteConversation(recipientId)
    setState({ activeDMConversation: null, dmLastSent: Date.now() })
    window.showToast?.(t('conversationDeleted') || 'Conversation supprimee', 'info')
  }
}

export default {
  sendDirectMessage,
  getConversationMessages,
  markConversationRead,
  getUnreadCount,
  getTotalUnreadCount,
  getConversationsList,
  deleteConversation,
  shareSpotInDM,
  sharePositionInDM,
}
