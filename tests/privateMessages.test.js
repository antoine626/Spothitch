/**
 * Private Messages Service Tests
 * Feature #179 - Messages prives
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock data stores
let mockConversations = []
let mockPrivateMessages = {}
let mockUnreadCounts = {}
let mockMutedConversations = []

// Mock storage
vi.mock('../src/utils/storage.js', () => ({
  Storage: {
    get: vi.fn((key) => {
      if (key === 'spothitch_conversations') return mockConversations
      if (key === 'spothitch_private_messages') return mockPrivateMessages
      if (key === 'spothitch_unread_counts') return mockUnreadCounts
      if (key === 'spothitch_muted_conversations') return mockMutedConversations
      if (key === 'state') return null
      return null
    }),
    set: vi.fn((key, value) => {
      if (key === 'spothitch_conversations') mockConversations = value
      if (key === 'spothitch_private_messages') mockPrivateMessages = value
      if (key === 'spothitch_unread_counts') mockUnreadCounts = value
      if (key === 'spothitch_muted_conversations') mockMutedConversations = value
    }),
    remove: vi.fn(),
    clear: vi.fn(),
  },
}))

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}))

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key) => {
    const translations = {
      messageTooLong: 'Message trop long',
      loginRequired: 'Connexion requise',
      userIsBlocked: 'Cet utilisateur est bloque',
      cannotSendMessage: 'Impossible d\'envoyer le message',
      conversationMuted: 'Conversation en sourdine',
      conversationUnmuted: 'Notifications reactivees',
      conversationArchived: 'Conversation archivee',
      conversationUnarchived: 'Conversation restauree',
      conversationDeleted: 'Conversation supprimee',
      noConversations: 'Aucune conversation',
      noConversationsDesc: 'Envoie un message a un ami pour commencer',
      conversations: 'Conversations',
      conversationWith: 'Conversation avec',
      newMessageFrom: 'Nouveau message de',
      noMessages: 'Aucun message',
      muted: 'Sourdine',
    }
    return translations[key] || key
  }),
}))

// Mock userBlocking
vi.mock('../src/services/userBlocking.js', () => ({
  isUserBlocked: vi.fn((userId) => userId === 'blocked_user'),
  canInteractWith: vi.fn((userId) => userId !== 'blocked_user' && userId !== 'blocked_by_user'),
}))

import {
  initPrivateMessages,
  getConversationId,
  sendPrivateMessage,
  getConversation,
  getConversationById,
  getPrivateMessage,
  getConversations,
  getActiveConversations,
  getArchivedConversations,
  getConversationDetails,
  markConversationAsRead,
  markAsRead,
  incrementUnread,
  getTotalUnreadCount,
  getUnreadCount,
  muteConversation,
  unmuteConversation,
  isConversationMuted,
  archiveConversation,
  unarchiveConversation,
  deleteConversation,
  deletePrivateMessage,
  editPrivateMessage,
  canSendMessageTo,
  getOtherParticipant,
  renderPrivateMessage,
  renderConversationItem,
  renderConversationList,
  renderUnreadBadge,
  PM_MAX_LENGTH,
  MAX_CONVERSATIONS,
  MAX_MESSAGES_PER_CONVERSATION,
  PMStatus,
  ConversationStatus,
} from '../src/services/privateMessages.js'

import { getState, setState, resetState } from '../src/stores/state.js'
import { showToast } from '../src/services/notifications.js'

describe('Private Messages Service', () => {
  beforeEach(() => {
    // Reset mocks
    mockConversations = []
    mockPrivateMessages = {}
    mockUnreadCounts = {}
    mockMutedConversations = []
    vi.clearAllMocks()

    // Reset state
    resetState()
    setState({
      user: { uid: 'user123', displayName: 'TestUser' },
      username: 'TestUser',
      avatar: '🤙',
      friends: [
        { id: 'friend1', name: 'Friend One', avatar: '👤' },
        { id: 'friend2', name: 'Friend Two', avatar: '😎' },
      ],
      unreadFriendMessages: 0,
    })

    // Initialize service
    initPrivateMessages()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ==================== CONSTANTS ====================

  describe('Constants', () => {
    it('should have correct PM_MAX_LENGTH', () => {
      expect(PM_MAX_LENGTH).toBe(5000)
    })

    it('should have correct MAX_CONVERSATIONS', () => {
      expect(MAX_CONVERSATIONS).toBe(100)
    })

    it('should have correct MAX_MESSAGES_PER_CONVERSATION', () => {
      expect(MAX_MESSAGES_PER_CONVERSATION).toBe(200)
    })

    it('should have PMStatus enum with all statuses', () => {
      expect(PMStatus.PENDING).toBe('pending')
      expect(PMStatus.SENT).toBe('sent')
      expect(PMStatus.DELIVERED).toBe('delivered')
      expect(PMStatus.READ).toBe('read')
      expect(PMStatus.FAILED).toBe('failed')
    })

    it('should have ConversationStatus enum', () => {
      expect(ConversationStatus.ACTIVE).toBe('active')
      expect(ConversationStatus.ARCHIVED).toBe('archived')
      expect(ConversationStatus.DELETED).toBe('deleted')
    })
  })

  // ==================== INIT ====================

  describe('initPrivateMessages', () => {
    it('should initialize successfully', () => {
      const result = initPrivateMessages()
      expect(result.success).toBe(true)
    })
  })

  // ==================== CONVERSATION ID ====================

  describe('getConversationId', () => {
    it('should generate consistent ID regardless of order', () => {
      const id1 = getConversationId('user_a', 'user_b')
      const id2 = getConversationId('user_b', 'user_a')
      expect(id1).toBe(id2)
    })

    it('should return null for empty user ID', () => {
      expect(getConversationId('', 'user_b')).toBeNull()
      expect(getConversationId('user_a', '')).toBeNull()
    })

    it('should return null for null user ID', () => {
      expect(getConversationId(null, 'user_b')).toBeNull()
      expect(getConversationId('user_a', null)).toBeNull()
    })

    it('should include conv_ prefix', () => {
      const id = getConversationId('user_a', 'user_b')
      expect(id).toMatch(/^conv_/)
    })
  })

  // ==================== SEND MESSAGE ====================

  describe('sendPrivateMessage', () => {
    it('should send a message successfully', () => {
      const result = sendPrivateMessage('friend1', 'Hello!')
      expect(result.success).toBe(true)
      expect(result.message).toBeDefined()
      expect(result.message.content).toBe('Hello!')
    })

    it('should assign correct message properties', () => {
      const result = sendPrivateMessage('friend1', 'Test')
      expect(result.message.id).toMatch(/^pm_/)
      expect(result.message.senderId).toBe('user123')
      expect(result.message.senderName).toBe('TestUser')
      expect(result.message.senderAvatar).toBe('🤙')
      expect(result.message.recipientId).toBe('friend1')
      expect(result.message.status).toBe(PMStatus.SENT)
      expect(result.message.timestamp).toBeDefined()
    })

    it('should trim whitespace from content', () => {
      const result = sendPrivateMessage('friend1', '  trimmed  ')
      expect(result.message.content).toBe('trimmed')
    })

    it('should fail with empty user ID', () => {
      const result = sendPrivateMessage('', 'Test')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_user_id')
    })

    it('should fail with null user ID', () => {
      const result = sendPrivateMessage(null, 'Test')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_user_id')
    })

    it('should fail with empty content', () => {
      const result = sendPrivateMessage('friend1', '')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_content')
    })

    it('should fail with whitespace-only content', () => {
      const result = sendPrivateMessage('friend1', '   ')
      expect(result.success).toBe(false)
      expect(result.error).toBe('empty_content')
    })

    it('should fail with null content', () => {
      const result = sendPrivateMessage('friend1', null)
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_content')
    })

    it('should fail if content exceeds max length', () => {
      const longContent = 'a'.repeat(PM_MAX_LENGTH + 1)
      const result = sendPrivateMessage('friend1', longContent)
      expect(result.success).toBe(false)
      expect(result.error).toBe('content_too_long')
    })

    it('should accept content at max length', () => {
      const maxContent = 'a'.repeat(PM_MAX_LENGTH)
      const result = sendPrivateMessage('friend1', maxContent)
      expect(result.success).toBe(true)
    })

    it('should fail when not authenticated', () => {
      setState({ user: null })
      const result = sendPrivateMessage('friend1', 'Test')
      expect(result.success).toBe(false)
      expect(result.error).toBe('not_authenticated')
    })

    it('should fail when trying to message self', () => {
      const result = sendPrivateMessage('user123', 'To myself')
      expect(result.success).toBe(false)
      expect(result.error).toBe('cannot_message_self')
    })

    it('should fail when user is blocked', () => {
      const result = sendPrivateMessage('blocked_user', 'Test')
      expect(result.success).toBe(false)
      expect(result.error).toBe('user_blocked')
    })

    it('should fail when blocked by user', () => {
      const result = sendPrivateMessage('blocked_by_user', 'Test')
      expect(result.success).toBe(false)
      expect(result.error).toBe('cannot_interact')
    })

    it('should create conversation on first message', () => {
      sendPrivateMessage('friend1', 'First message')
      const convs = getActiveConversations()
      expect(convs.length).toBe(1)
    })

    it('should support replyTo option', () => {
      const result = sendPrivateMessage('friend1', 'Reply', { replyTo: 'pm_123' })
      expect(result.message.replyTo).toBe('pm_123')
    })

    it('should support type option', () => {
      const result = sendPrivateMessage('friend1', 'Image', { type: 'image' })
      expect(result.message.type).toBe('image')
    })

    it('should support metadata option', () => {
      const metadata = { location: 'Paris' }
      const result = sendPrivateMessage('friend1', 'With data', { metadata })
      expect(result.message.metadata).toEqual(metadata)
    })
  })

  // ==================== GET MESSAGES ====================

  describe('getConversation', () => {
    beforeEach(() => {
      sendPrivateMessage('friend1', 'Message 1')
      sendPrivateMessage('friend1', 'Message 2')
      sendPrivateMessage('friend2', 'Message to friend2')
    })

    it('should return messages for a user', () => {
      const messages = getConversation('friend1')
      expect(messages.length).toBe(2)
    })

    it('should return empty array for empty user ID', () => {
      const messages = getConversation('')
      expect(messages).toEqual([])
    })

    it('should return empty array when not authenticated', () => {
      setState({ user: null })
      const messages = getConversation('friend1')
      expect(messages).toEqual([])
    })

    it('should respect limit option', () => {
      sendPrivateMessage('friend1', 'Message 3')
      sendPrivateMessage('friend1', 'Message 4')
      const messages = getConversation('friend1', { limit: 2 })
      expect(messages.length).toBe(2)
    })
  })

  describe('getConversationById', () => {
    it('should return messages by conversation ID', () => {
      sendPrivateMessage('friend1', 'Test')
      const convId = getConversationId('user123', 'friend1')
      const messages = getConversationById(convId)
      expect(messages.length).toBe(1)
    })

    it('should return empty array for invalid ID', () => {
      const messages = getConversationById('')
      expect(messages).toEqual([])
    })
  })

  describe('getPrivateMessage', () => {
    it('should return message by ID', () => {
      const sent = sendPrivateMessage('friend1', 'Find me')
      const convId = sent.message.conversationId
      const found = getPrivateMessage(convId, sent.message.id)
      expect(found).toBeDefined()
      expect(found.content).toBe('Find me')
    })

    it('should return null for invalid conversation ID', () => {
      const found = getPrivateMessage('', 'msg_id')
      expect(found).toBeNull()
    })

    it('should return null for invalid message ID', () => {
      const found = getPrivateMessage('conv_id', '')
      expect(found).toBeNull()
    })

    it('should return null for non-existent message', () => {
      sendPrivateMessage('friend1', 'Test')
      const convId = getConversationId('user123', 'friend1')
      const found = getPrivateMessage(convId, 'non_existent')
      expect(found).toBeNull()
    })
  })

  // ==================== CONVERSATION LIST ====================

  describe('getConversations', () => {
    beforeEach(() => {
      sendPrivateMessage('friend1', 'To friend1')
      sendPrivateMessage('friend2', 'To friend2')
    })

    it('should return list of conversations', () => {
      const convs = getConversations()
      expect(convs.length).toBe(2)
    })

    it('should include unread counts', () => {
      const convs = getConversations()
      expect(convs[0]).toHaveProperty('unreadCount')
    })

    it('should include muted status', () => {
      const convs = getConversations()
      expect(convs[0]).toHaveProperty('isMuted')
    })

    it('should return empty array when not authenticated', () => {
      setState({ user: null })
      const convs = getConversations()
      expect(convs).toEqual([])
    })

    it('should filter out deleted conversations by default', () => {
      const convId = getConversationId('user123', 'friend1')
      deleteConversation(convId)
      const convs = getConversations()
      expect(convs.some((c) => c.id === convId)).toBe(false)
    })

    it('should respect limit option', () => {
      const convs = getConversations({ limit: 1 })
      expect(convs.length).toBe(1)
    })

    it('should sort by most recent', () => {
      const convs = getConversations()
      const dates = convs.map((c) => new Date(c.updatedAt))
      expect(dates[0] >= dates[1]).toBe(true)
    })
  })

  describe('getActiveConversations', () => {
    it('should return only active conversations', () => {
      sendPrivateMessage('friend1', 'Test')
      const convId = getConversationId('user123', 'friend1')
      archiveConversation(convId)

      sendPrivateMessage('friend2', 'Test2')
      const active = getActiveConversations()
      expect(active.length).toBe(1)
    })
  })

  describe('getArchivedConversations', () => {
    it('should return only archived conversations', () => {
      sendPrivateMessage('friend1', 'Test')
      const convId = getConversationId('user123', 'friend1')
      archiveConversation(convId)

      const archived = getArchivedConversations()
      expect(archived.length).toBe(1)
    })
  })

  describe('getConversationDetails', () => {
    it('should return conversation with messages', () => {
      sendPrivateMessage('friend1', 'Test')
      const convId = getConversationId('user123', 'friend1')
      const details = getConversationDetails(convId)
      expect(details).toBeDefined()
      expect(details.messages).toBeDefined()
      expect(details.unreadCount).toBeDefined()
    })

    it('should return null for invalid ID', () => {
      const details = getConversationDetails('')
      expect(details).toBeNull()
    })

    it('should return null for non-existent conversation', () => {
      const details = getConversationDetails('non_existent')
      expect(details).toBeNull()
    })
  })

  // ==================== UNREAD ====================

  describe('markConversationAsRead', () => {
    it('should mark conversation as read', () => {
      sendPrivateMessage('friend1', 'Test')
      const convId = getConversationId('user123', 'friend1')
      incrementUnread(convId)

      const result = markConversationAsRead(convId)
      expect(result.success).toBe(true)
      expect(getUnreadCount(convId)).toBe(0)
    })

    it('should fail with invalid ID', () => {
      const result = markConversationAsRead('')
      expect(result.success).toBe(false)
    })
  })

  describe('markAsRead', () => {
    it('should mark by user ID', () => {
      sendPrivateMessage('friend1', 'Test')
      incrementUnread(getConversationId('user123', 'friend1'))

      const result = markAsRead('friend1')
      expect(result.success).toBe(true)
    })

    it('should fail with invalid user ID', () => {
      const result = markAsRead('')
      expect(result.success).toBe(false)
    })

    it('should fail when not authenticated', () => {
      setState({ user: null })
      const result = markAsRead('friend1')
      expect(result.success).toBe(false)
    })
  })

  describe('incrementUnread', () => {
    it('should increment unread count', () => {
      const convId = getConversationId('user123', 'friend1')
      incrementUnread(convId)
      expect(getUnreadCount(convId)).toBe(1)
      incrementUnread(convId)
      expect(getUnreadCount(convId)).toBe(2)
    })

    it('should not throw for invalid ID', () => {
      expect(() => incrementUnread('')).not.toThrow()
    })
  })

  describe('getTotalUnreadCount', () => {
    it('should return total unread', () => {
      const convId1 = getConversationId('user123', 'friend1')
      const convId2 = getConversationId('user123', 'friend2')
      incrementUnread(convId1)
      incrementUnread(convId1)
      incrementUnread(convId2)
      expect(getTotalUnreadCount()).toBe(3)
    })

    it('should return 0 when no unread', () => {
      expect(getTotalUnreadCount()).toBe(0)
    })
  })

  describe('getUnreadCount', () => {
    it('should return unread count for conversation', () => {
      const convId = getConversationId('user123', 'friend1')
      incrementUnread(convId)
      expect(getUnreadCount(convId)).toBe(1)
    })

    it('should return 0 for invalid ID', () => {
      expect(getUnreadCount('')).toBe(0)
    })

    it('should return 0 for new conversation', () => {
      expect(getUnreadCount('new_conv')).toBe(0)
    })
  })

  // ==================== MUTE ====================

  describe('muteConversation', () => {
    it('should mute conversation', () => {
      sendPrivateMessage('friend1', 'Test')
      const convId = getConversationId('user123', 'friend1')
      const result = muteConversation(convId)
      expect(result.success).toBe(true)
      expect(isConversationMuted(convId)).toBe(true)
    })

    it('should fail with invalid ID', () => {
      const result = muteConversation('')
      expect(result.success).toBe(false)
    })

    it('should show toast on success', () => {
      const convId = getConversationId('user123', 'friend1')
      muteConversation(convId)
      expect(showToast).toHaveBeenCalled()
    })
  })

  describe('unmuteConversation', () => {
    it('should unmute conversation', () => {
      sendPrivateMessage('friend1', 'Test')
      const convId = getConversationId('user123', 'friend1')
      muteConversation(convId)
      const result = unmuteConversation(convId)
      expect(result.success).toBe(true)
      expect(isConversationMuted(convId)).toBe(false)
    })

    it('should fail with invalid ID', () => {
      const result = unmuteConversation('')
      expect(result.success).toBe(false)
    })
  })

  describe('isConversationMuted', () => {
    it('should return true for muted conversation', () => {
      const convId = getConversationId('user123', 'friend1')
      muteConversation(convId)
      expect(isConversationMuted(convId)).toBe(true)
    })

    it('should return false for unmuted conversation', () => {
      const convId = getConversationId('user123', 'friend1')
      expect(isConversationMuted(convId)).toBe(false)
    })

    it('should return false for invalid ID', () => {
      expect(isConversationMuted('')).toBe(false)
    })
  })

  // ==================== ARCHIVE/DELETE ====================

  describe('archiveConversation', () => {
    it('should archive conversation', () => {
      sendPrivateMessage('friend1', 'Test')
      const convId = getConversationId('user123', 'friend1')
      const result = archiveConversation(convId)
      expect(result.success).toBe(true)
    })

    it('should remove from active conversations', () => {
      sendPrivateMessage('friend1', 'Test')
      const convId = getConversationId('user123', 'friend1')
      archiveConversation(convId)
      const active = getActiveConversations()
      expect(active.some((c) => c.id === convId)).toBe(false)
    })

    it('should fail with invalid ID', () => {
      const result = archiveConversation('')
      expect(result.success).toBe(false)
    })

    it('should fail for non-existent conversation', () => {
      const result = archiveConversation('non_existent')
      expect(result.success).toBe(false)
    })
  })

  describe('unarchiveConversation', () => {
    it('should unarchive conversation', () => {
      sendPrivateMessage('friend1', 'Test')
      const convId = getConversationId('user123', 'friend1')
      archiveConversation(convId)
      const result = unarchiveConversation(convId)
      expect(result.success).toBe(true)
    })

    it('should return to active conversations', () => {
      sendPrivateMessage('friend1', 'Test')
      const convId = getConversationId('user123', 'friend1')
      archiveConversation(convId)
      unarchiveConversation(convId)
      const active = getActiveConversations()
      expect(active.some((c) => c.id === convId)).toBe(true)
    })

    it('should fail with invalid ID', () => {
      const result = unarchiveConversation('')
      expect(result.success).toBe(false)
    })
  })

  describe('deleteConversation', () => {
    it('should delete conversation', () => {
      sendPrivateMessage('friend1', 'Test')
      const convId = getConversationId('user123', 'friend1')
      const result = deleteConversation(convId)
      expect(result.success).toBe(true)
    })

    it('should remove from all conversation lists', () => {
      sendPrivateMessage('friend1', 'Test')
      const convId = getConversationId('user123', 'friend1')
      deleteConversation(convId)
      const convs = getConversations()
      expect(convs.some((c) => c.id === convId)).toBe(false)
    })

    it('should clear unread count', () => {
      sendPrivateMessage('friend1', 'Test')
      const convId = getConversationId('user123', 'friend1')
      incrementUnread(convId)
      deleteConversation(convId)
      expect(getUnreadCount(convId)).toBe(0)
    })

    it('should fail with invalid ID', () => {
      const result = deleteConversation('')
      expect(result.success).toBe(false)
    })

    it('should fail for non-existent conversation', () => {
      const result = deleteConversation('non_existent')
      expect(result.success).toBe(false)
    })
  })

  describe('deletePrivateMessage', () => {
    it('should delete own message', () => {
      const sent = sendPrivateMessage('friend1', 'To delete')
      const result = deletePrivateMessage(sent.message.conversationId, sent.message.id)
      expect(result.success).toBe(true)
    })

    it('should remove message from conversation', () => {
      const sent = sendPrivateMessage('friend1', 'To delete')
      deletePrivateMessage(sent.message.conversationId, sent.message.id)
      const messages = getConversation('friend1')
      expect(messages.some((m) => m.id === sent.message.id)).toBe(false)
    })

    it('should fail with invalid params', () => {
      const result = deletePrivateMessage('', '')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_params')
    })

    it('should fail for non-existent conversation', () => {
      const result = deletePrivateMessage('non_existent', 'msg_id')
      expect(result.success).toBe(false)
      expect(result.error).toBe('conversation_not_found')
    })

    it('should fail for non-existent message', () => {
      sendPrivateMessage('friend1', 'Test')
      const convId = getConversationId('user123', 'friend1')
      const result = deletePrivateMessage(convId, 'non_existent')
      expect(result.success).toBe(false)
      expect(result.error).toBe('message_not_found')
    })
  })

  describe('editPrivateMessage', () => {
    it('should edit own message', () => {
      const sent = sendPrivateMessage('friend1', 'Original')
      const result = editPrivateMessage(sent.message.conversationId, sent.message.id, 'Edited')
      expect(result.success).toBe(true)
    })

    it('should update content and set edited flag', () => {
      const sent = sendPrivateMessage('friend1', 'Original')
      editPrivateMessage(sent.message.conversationId, sent.message.id, 'Edited content')
      const message = getPrivateMessage(sent.message.conversationId, sent.message.id)
      expect(message.content).toBe('Edited content')
      expect(message.edited).toBe(true)
      expect(message.editedAt).toBeDefined()
    })

    it('should fail with invalid params', () => {
      const result = editPrivateMessage('', '', 'Edit')
      expect(result.success).toBe(false)
    })

    it('should fail with empty content', () => {
      const sent = sendPrivateMessage('friend1', 'Original')
      const result = editPrivateMessage(sent.message.conversationId, sent.message.id, '   ')
      expect(result.success).toBe(false)
      expect(result.error).toBe('empty_content')
    })

    it('should fail if content too long', () => {
      const sent = sendPrivateMessage('friend1', 'Original')
      const longContent = 'a'.repeat(PM_MAX_LENGTH + 1)
      const result = editPrivateMessage(sent.message.conversationId, sent.message.id, longContent)
      expect(result.success).toBe(false)
      expect(result.error).toBe('content_too_long')
    })
  })

  // ==================== BLOCKED USERS ====================

  describe('canSendMessageTo', () => {
    it('should return true for normal user', () => {
      expect(canSendMessageTo('friend1')).toBe(true)
    })

    it('should return false for blocked user', () => {
      expect(canSendMessageTo('blocked_user')).toBe(false)
    })

    it('should return false for self', () => {
      expect(canSendMessageTo('user123')).toBe(false)
    })

    it('should return false for empty ID', () => {
      expect(canSendMessageTo('')).toBe(false)
    })

    it('should return false when not authenticated', () => {
      setState({ user: null })
      expect(canSendMessageTo('friend1')).toBe(false)
    })
  })

  describe('getOtherParticipant', () => {
    it('should return other participant', () => {
      sendPrivateMessage('friend1', 'Test')
      const convId = getConversationId('user123', 'friend1')
      const other = getOtherParticipant(convId)
      expect(other).toBeDefined()
      expect(other.id).toBe('friend1')
    })

    it('should return null for invalid ID', () => {
      expect(getOtherParticipant('')).toBeNull()
    })

    it('should return null for non-existent conversation', () => {
      expect(getOtherParticipant('non_existent')).toBeNull()
    })
  })

  // ==================== RENDERING ====================

  describe('renderPrivateMessage', () => {
    it('should render message HTML', () => {
      const sent = sendPrivateMessage('friend1', 'Render me')
      const html = renderPrivateMessage(sent.message)
      expect(html).toContain('Render me')
      expect(html).toContain('data-message-id')
    })

    it('should return empty string for null message', () => {
      const html = renderPrivateMessage(null)
      expect(html).toBe('')
    })

    it('should show edited label', () => {
      const sent = sendPrivateMessage('friend1', 'Original')
      editPrivateMessage(sent.message.conversationId, sent.message.id, 'Edited')
      const message = getPrivateMessage(sent.message.conversationId, sent.message.id)
      const html = renderPrivateMessage(message)
      expect(html).toContain('modifie')
    })

    it('should escape HTML in content', () => {
      const sent = sendPrivateMessage('friend1', '<script>alert("xss")</script>')
      const html = renderPrivateMessage(sent.message)
      expect(html).not.toContain('<script>')
      expect(html).toContain('&lt;script&gt;')
    })
  })

  describe('renderConversationItem', () => {
    it('should render conversation item HTML', () => {
      sendPrivateMessage('friend1', 'Test')
      const convs = getActiveConversations()
      const html = renderConversationItem(convs[0])
      expect(html).toContain('conversation-item')
      expect(html).toContain('data-conversation-id')
    })

    it('should return empty string for null', () => {
      const html = renderConversationItem(null)
      expect(html).toBe('')
    })

    it('should show unread badge when unread', () => {
      sendPrivateMessage('friend1', 'Test')
      const convId = getConversationId('user123', 'friend1')
      incrementUnread(convId)
      const convs = getActiveConversations()
      const html = renderConversationItem(convs[0])
      expect(html).toContain('unread-badge')
    })

    it('should show muted icon when muted', () => {
      sendPrivateMessage('friend1', 'Test')
      const convId = getConversationId('user123', 'friend1')
      muteConversation(convId)
      const convs = getActiveConversations()
      const html = renderConversationItem(convs[0])
      expect(html).toContain('fa-bell-slash')
    })
  })

  describe('renderConversationList', () => {
    it('should render empty state when no conversations', () => {
      const html = renderConversationList()
      expect(html).toContain('empty-state')
      expect(html).toContain('Aucune conversation')
    })

    it('should render list when conversations exist', () => {
      sendPrivateMessage('friend1', 'Test')
      const html = renderConversationList()
      expect(html).toContain('conversation-list')
    })
  })

  describe('renderUnreadBadge', () => {
    it('should return empty string when no unread', () => {
      const html = renderUnreadBadge()
      expect(html).toBe('')
    })

    it('should render badge when unread', () => {
      const convId = getConversationId('user123', 'friend1')
      incrementUnread(convId)
      const html = renderUnreadBadge()
      expect(html).toContain('unread-badge')
    })

    it('should show 99+ for large counts', () => {
      const convId = getConversationId('user123', 'friend1')
      for (let i = 0; i < 100; i++) {
        incrementUnread(convId)
      }
      const html = renderUnreadBadge()
      expect(html).toContain('99+')
    })
  })

  // ==================== GLOBAL HANDLERS ====================

  describe('Global handlers', () => {
    it('should have openConversation handler', () => {
      expect(typeof window.openConversation).toBe('function')
    })

    it('should have sendPrivateMessageTo handler', () => {
      expect(typeof window.sendPrivateMessageTo).toBe('function')
    })

    it('should have muteConvo handler', () => {
      expect(typeof window.muteConvo).toBe('function')
    })

    it('should have unmuteConvo handler', () => {
      expect(typeof window.unmuteConvo).toBe('function')
    })

    it('should have archiveConvo handler', () => {
      expect(typeof window.archiveConvo).toBe('function')
    })

    it('should have deleteConvo handler', () => {
      expect(typeof window.deleteConvo).toBe('function')
    })
  })

  // ==================== EDGE CASES ====================

  describe('Edge cases', () => {
    it('should handle rapid message sending', () => {
      for (let i = 0; i < 10; i++) {
        sendPrivateMessage('friend1', `Message ${i}`)
      }
      const messages = getConversation('friend1')
      expect(messages.length).toBe(10)
    })

    it('should handle special characters in content', () => {
      const specialContent = 'Emoji: 🚗 Accents: eaociu Symbols: @#$%^&*()'
      const result = sendPrivateMessage('friend1', specialContent)
      expect(result.success).toBe(true)
      expect(result.message.content).toBe(specialContent)
    })

    it('should handle newlines in content', () => {
      const multiline = 'Line 1\nLine 2\nLine 3'
      const result = sendPrivateMessage('friend1', multiline)
      expect(result.success).toBe(true)
      expect(result.message.content).toBe(multiline)
    })

    it('should handle very long conversations', () => {
      for (let i = 0; i < 50; i++) {
        sendPrivateMessage('friend1', `Message ${i}`)
      }
      const messages = getConversation('friend1')
      expect(messages.length).toBeLessThanOrEqual(MAX_MESSAGES_PER_CONVERSATION)
    })
  })

  // ==================== INTEGRATION ====================

  describe('Integration', () => {
    it('should handle full message lifecycle', () => {
      // Send
      const sent = sendPrivateMessage('friend1', 'Full lifecycle')
      expect(sent.success).toBe(true)

      // Get
      let message = getPrivateMessage(sent.message.conversationId, sent.message.id)
      expect(message.content).toBe('Full lifecycle')

      // Edit
      editPrivateMessage(sent.message.conversationId, sent.message.id, 'Edited lifecycle')
      message = getPrivateMessage(sent.message.conversationId, sent.message.id)
      expect(message.content).toBe('Edited lifecycle')

      // Delete
      deletePrivateMessage(sent.message.conversationId, sent.message.id)
      message = getPrivateMessage(sent.message.conversationId, sent.message.id)
      expect(message == null).toBe(true) // undefined or null
    })

    it('should handle conversation lifecycle', () => {
      // Create via message
      sendPrivateMessage('friend1', 'Create conv')
      let convs = getActiveConversations()
      expect(convs.length).toBe(1)

      const convId = convs[0].id

      // Archive
      archiveConversation(convId)
      convs = getActiveConversations()
      expect(convs.length).toBe(0)
      expect(getArchivedConversations().length).toBe(1)

      // Unarchive
      unarchiveConversation(convId)
      convs = getActiveConversations()
      expect(convs.length).toBe(1)

      // Delete
      deleteConversation(convId)
      convs = getConversations()
      expect(convs.some((c) => c.id === convId)).toBe(false)
    })

    it('should update unread state correctly', () => {
      const convId = getConversationId('user123', 'friend1')

      // Increment
      incrementUnread(convId)
      incrementUnread(convId)
      expect(getState().unreadFriendMessages).toBe(2)

      // Mark as read
      markConversationAsRead(convId)
      expect(getState().unreadFriendMessages).toBe(0)
    })
  })
})
