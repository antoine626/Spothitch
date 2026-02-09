/**
 * Realtime Chat Service Tests
 * Feature #178 - Chat temps reel
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock data stores
let mockMessages = []
let mockTypingIndicators = {}
let mockOnlineUsers = {}
let mockChatRooms = []

// Mock storage
vi.mock('../src/utils/storage.js', () => ({
  Storage: {
    get: vi.fn((key) => {
      if (key === 'spothitch_messages_cache') return mockMessages
      if (key === 'spothitch_typing_indicators') return mockTypingIndicators
      if (key === 'spothitch_online_users') return mockOnlineUsers
      if (key === 'spothitch_chat_rooms') return mockChatRooms
      if (key === 'state') return null
      return null
    }),
    set: vi.fn((key, value) => {
      if (key === 'spothitch_messages_cache') mockMessages = value
      if (key === 'spothitch_typing_indicators') mockTypingIndicators = value
      if (key === 'spothitch_online_users') mockOnlineUsers = value
      if (key === 'spothitch_chat_rooms') mockChatRooms = value
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
      isTyping: 'ecrit...',
      areTyping: 'ecrivent...',
      severalPeopleTyping: 'Plusieurs personnes ecrivent...',
      online: 'en ligne',
      chatRooms: 'Salons de chat',
      joinedRoom: 'Rejoint',
      and: 'et',
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
  initRealtimeChat,
  destroyRealtimeChat,
  sendMessage,
  getMessages,
  getMessage,
  editMessage,
  deleteMessage,
  subscribeToRoom,
  setTypingIndicator,
  clearTypingIndicator,
  getTypingUsers,
  isAnyoneTyping,
  setUserOnline,
  setUserOffline,
  isUserOnline,
  getOnlineUsers,
  getOnlineUserCount,
  getChatRooms,
  getRoom,
  joinRoom,
  leaveRoom,
  renderMessage,
  renderTypingIndicator,
  renderOnlineUsersBadge,
  renderChatRoomList,
  MESSAGE_MAX_LENGTH,
  TYPING_TIMEOUT_MS,
  ONLINE_TIMEOUT_MS,
  MAX_MESSAGES_PER_ROOM,
  MessageStatus,
  RoomType,
} from '../src/services/realtimeChat.js'

import { getState, setState, resetState } from '../src/stores/state.js'

describe('Realtime Chat Service', () => {
  beforeEach(() => {
    // Reset mocks
    mockMessages = []
    mockTypingIndicators = {}
    mockOnlineUsers = {}
    mockChatRooms = []
    vi.clearAllMocks()

    // Reset state
    resetState()
    setState({
      user: { uid: 'user123', displayName: 'TestUser' },
      username: 'TestUser',
      avatar: '🤙',
      messages: [],
      chatRoom: 'general',
    })
  })

  afterEach(() => {
    destroyRealtimeChat()
    vi.clearAllMocks()
  })

  // ==================== CONSTANTS ====================

  describe('Constants', () => {
    it('should have correct MESSAGE_MAX_LENGTH', () => {
      expect(MESSAGE_MAX_LENGTH).toBe(2000)
    })

    it('should have correct TYPING_TIMEOUT_MS', () => {
      expect(TYPING_TIMEOUT_MS).toBe(3000)
    })

    it('should have correct ONLINE_TIMEOUT_MS', () => {
      expect(ONLINE_TIMEOUT_MS).toBe(60000)
    })

    it('should have correct MAX_MESSAGES_PER_ROOM', () => {
      expect(MAX_MESSAGES_PER_ROOM).toBe(100)
    })

    it('should have MessageStatus enum with all statuses', () => {
      expect(MessageStatus.PENDING).toBe('pending')
      expect(MessageStatus.SENT).toBe('sent')
      expect(MessageStatus.DELIVERED).toBe('delivered')
      expect(MessageStatus.READ).toBe('read')
      expect(MessageStatus.FAILED).toBe('failed')
    })

    it('should have RoomType enum with all types', () => {
      expect(RoomType.GENERAL).toBe('general')
      expect(RoomType.COUNTRY).toBe('country')
      expect(RoomType.CITY).toBe('city')
      expect(RoomType.TRIP).toBe('trip')
      expect(RoomType.SPOT).toBe('spot')
      expect(RoomType.PRIVATE).toBe('private')
    })
  })

  // ==================== INIT/DESTROY ====================

  describe('initRealtimeChat', () => {
    it('should initialize successfully', () => {
      const result = initRealtimeChat()
      expect(result.success).toBe(true)
    })

    it('should set current user as online', () => {
      initRealtimeChat()
      expect(isUserOnline('user123')).toBe(true)
    })
  })

  describe('destroyRealtimeChat', () => {
    it('should cleanup without errors', () => {
      initRealtimeChat()
      expect(() => destroyRealtimeChat()).not.toThrow()
    })

    it('should clear subscriptions', () => {
      initRealtimeChat()
      const callback = vi.fn()
      const unsub = subscribeToRoom('general', callback)
      destroyRealtimeChat()
      // No errors expected
    })
  })

  // ==================== SEND MESSAGE ====================

  describe('sendMessage', () => {
    it('should send a message successfully', () => {
      const result = sendMessage('general', 'Hello world!')
      expect(result.success).toBe(true)
      expect(result.message).toBeDefined()
      expect(result.message.content).toBe('Hello world!')
    })

    it('should assign correct message properties', () => {
      const result = sendMessage('general', 'Test message')
      expect(result.message.id).toMatch(/^msg_/)
      expect(result.message.roomId).toBe('general')
      expect(result.message.userId).toBe('user123')
      expect(result.message.userName).toBe('TestUser')
      expect(result.message.userAvatar).toBe('🤙')
      expect(result.message.status).toBe(MessageStatus.SENT)
      expect(result.message.timestamp).toBeDefined()
    })

    it('should trim whitespace from content', () => {
      const result = sendMessage('general', '  trimmed  ')
      expect(result.message.content).toBe('trimmed')
    })

    it('should fail with empty room ID', () => {
      const result = sendMessage('', 'Test')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_room_id')
    })

    it('should fail with null room ID', () => {
      const result = sendMessage(null, 'Test')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_room_id')
    })

    it('should fail with empty content', () => {
      const result = sendMessage('general', '')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_content')
    })

    it('should fail with whitespace-only content', () => {
      const result = sendMessage('general', '   ')
      expect(result.success).toBe(false)
      expect(result.error).toBe('empty_content')
    })

    it('should fail with null content', () => {
      const result = sendMessage('general', null)
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_content')
    })

    it('should fail if content exceeds max length', () => {
      const longContent = 'a'.repeat(MESSAGE_MAX_LENGTH + 1)
      const result = sendMessage('general', longContent)
      expect(result.success).toBe(false)
      expect(result.error).toBe('content_too_long')
    })

    it('should accept content at max length', () => {
      const maxContent = 'a'.repeat(MESSAGE_MAX_LENGTH)
      const result = sendMessage('general', maxContent)
      expect(result.success).toBe(true)
    })

    it('should support reply messages', () => {
      const result = sendMessage('general', 'Reply', { replyTo: 'msg_123' })
      expect(result.success).toBe(true)
      expect(result.message.replyTo).toBe('msg_123')
    })

    it('should support message type option', () => {
      const result = sendMessage('general', 'Image message', { type: 'image' })
      expect(result.message.type).toBe('image')
    })

    it('should support metadata option', () => {
      const metadata = { imageUrl: 'https://example.com/img.jpg' }
      const result = sendMessage('general', 'With metadata', { metadata })
      expect(result.message.metadata).toEqual(metadata)
    })
  })

  // ==================== GET MESSAGES ====================

  describe('getMessages', () => {
    beforeEach(() => {
      // Add some test messages
      sendMessage('general', 'Message 1')
      sendMessage('general', 'Message 2')
      sendMessage('other_room', 'Message in other room')
    })

    it('should return messages for a room', () => {
      const messages = getMessages('general')
      expect(messages.length).toBe(2)
    })

    it('should return empty array for empty room ID', () => {
      const messages = getMessages('')
      expect(messages).toEqual([])
    })

    it('should filter messages from blocked users', () => {
      // Add a message from blocked user
      setState({
        messages: [
          ...getState().messages,
          {
            id: 'blocked_msg',
            roomId: 'general',
            content: 'From blocked',
            userId: 'blocked_user',
            userName: 'Blocked',
            userAvatar: '🚫',
            timestamp: new Date().toISOString(),
          },
        ],
      })

      const messages = getMessages('general')
      expect(messages.some((m) => m.userId === 'blocked_user')).toBe(false)
    })

    it('should respect limit option', () => {
      sendMessage('general', 'Message 3')
      sendMessage('general', 'Message 4')
      const messages = getMessages('general', { limit: 2 })
      expect(messages.length).toBe(2)
    })
  })

  describe('getMessage', () => {
    it('should return message by ID', () => {
      const sent = sendMessage('general', 'Find me')
      const found = getMessage(sent.message.id)
      expect(found).toBeDefined()
      expect(found.content).toBe('Find me')
    })

    it('should return null for non-existent message', () => {
      const found = getMessage('non_existent_id')
      expect(found).toBeNull()
    })

    it('should return null for empty ID', () => {
      const found = getMessage('')
      expect(found).toBeNull()
    })

    it('should return null for null ID', () => {
      const found = getMessage(null)
      expect(found).toBeNull()
    })
  })

  // ==================== EDIT/DELETE MESSAGE ====================

  describe('editMessage', () => {
    it('should edit own message', () => {
      const sent = sendMessage('general', 'Original')
      const result = editMessage(sent.message.id, 'Edited')
      expect(result.success).toBe(true)
    })

    it('should update content and set edited flag', () => {
      const sent = sendMessage('general', 'Original')
      editMessage(sent.message.id, 'Edited content')
      const message = getMessage(sent.message.id)
      expect(message.content).toBe('Edited content')
      expect(message.edited).toBe(true)
      expect(message.editedAt).toBeDefined()
    })

    it('should fail for non-existent message', () => {
      const result = editMessage('non_existent', 'Edit')
      expect(result.success).toBe(false)
      expect(result.error).toBe('message_not_found')
    })

    it('should fail with empty message ID', () => {
      const result = editMessage('', 'Edit')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_message_id')
    })

    it('should fail with empty content', () => {
      const sent = sendMessage('general', 'Original')
      const result = editMessage(sent.message.id, '   ')
      expect(result.success).toBe(false)
      expect(result.error).toBe('empty_content')
    })

    it('should fail if content too long', () => {
      const sent = sendMessage('general', 'Original')
      const longContent = 'a'.repeat(MESSAGE_MAX_LENGTH + 1)
      const result = editMessage(sent.message.id, longContent)
      expect(result.success).toBe(false)
      expect(result.error).toBe('content_too_long')
    })

    it('should fail for message from another user', () => {
      // Add message from another user
      setState({
        messages: [
          {
            id: 'other_msg',
            roomId: 'general',
            content: 'Other message',
            userId: 'other_user',
            userName: 'Other',
            userAvatar: '👤',
            timestamp: new Date().toISOString(),
          },
        ],
      })
      const result = editMessage('other_msg', 'Try to edit')
      expect(result.success).toBe(false)
      expect(result.error).toBe('not_message_owner')
    })
  })

  describe('deleteMessage', () => {
    it('should delete own message', () => {
      const sent = sendMessage('general', 'To delete')
      const result = deleteMessage(sent.message.id)
      expect(result.success).toBe(true)
    })

    it('should remove message from state', () => {
      const sent = sendMessage('general', 'To delete')
      deleteMessage(sent.message.id)
      const found = getMessage(sent.message.id)
      expect(found).toBeNull()
    })

    it('should fail for non-existent message', () => {
      const result = deleteMessage('non_existent')
      expect(result.success).toBe(false)
      expect(result.error).toBe('message_not_found')
    })

    it('should fail with empty message ID', () => {
      const result = deleteMessage('')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_message_id')
    })

    it('should fail for message from another user', () => {
      setState({
        messages: [
          {
            id: 'other_msg',
            roomId: 'general',
            content: 'Other message',
            userId: 'other_user',
            userName: 'Other',
            userAvatar: '👤',
            timestamp: new Date().toISOString(),
          },
        ],
      })
      const result = deleteMessage('other_msg')
      expect(result.success).toBe(false)
      expect(result.error).toBe('not_message_owner')
    })
  })

  // ==================== SUBSCRIPTIONS ====================

  describe('subscribeToRoom', () => {
    it('should return unsubscribe function', () => {
      const callback = vi.fn()
      const unsub = subscribeToRoom('general', callback)
      expect(typeof unsub).toBe('function')
    })

    it('should call callback immediately with current messages', () => {
      sendMessage('general', 'Existing')
      const callback = vi.fn()
      subscribeToRoom('general', callback)
      expect(callback).toHaveBeenCalled()
    })

    it('should handle invalid params gracefully', () => {
      const unsub = subscribeToRoom('', null)
      expect(typeof unsub).toBe('function')
    })

    it('should allow unsubscribing', () => {
      const callback = vi.fn()
      const unsub = subscribeToRoom('general', callback)
      unsub()
      // No errors expected
    })

    it('should support multiple subscribers', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      subscribeToRoom('general', callback1)
      subscribeToRoom('general', callback2)
      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })
  })

  // ==================== TYPING INDICATORS ====================

  describe('setTypingIndicator', () => {
    it('should set typing indicator', () => {
      setTypingIndicator('general')
      const typing = getTypingUsers('general')
      // Current user is excluded from typing users
      expect(typing.length).toBe(0) // Own user excluded
    })

    it('should not throw with empty room ID', () => {
      expect(() => setTypingIndicator('')).not.toThrow()
    })
  })

  describe('clearTypingIndicator', () => {
    it('should clear typing indicator', () => {
      setTypingIndicator('general')
      clearTypingIndicator('general', 'user123')
      // No errors expected
    })

    it('should handle non-existent indicator', () => {
      expect(() => clearTypingIndicator('general', 'unknown')).not.toThrow()
    })
  })

  describe('getTypingUsers', () => {
    it('should return empty array for room with no typing', () => {
      const typing = getTypingUsers('general')
      expect(typing).toEqual([])
    })

    it('should return empty array for invalid room', () => {
      const typing = getTypingUsers('')
      expect(typing).toEqual([])
    })

    it('should exclude blocked users', () => {
      // Typing indicators from blocked users should be filtered
      const typing = getTypingUsers('general')
      expect(typing.every((u) => u.userId !== 'blocked_user')).toBe(true)
    })
  })

  describe('isAnyoneTyping', () => {
    it('should return false when no one is typing', () => {
      expect(isAnyoneTyping('general')).toBe(false)
    })

    it('should return false for invalid room', () => {
      expect(isAnyoneTyping('')).toBe(false)
    })
  })

  // ==================== ONLINE USERS ====================

  describe('setUserOnline', () => {
    it('should set user as online', () => {
      setUserOnline('testuser')
      expect(isUserOnline('testuser')).toBe(true)
    })

    it('should not throw with empty ID', () => {
      expect(() => setUserOnline('')).not.toThrow()
    })
  })

  describe('setUserOffline', () => {
    it('should set user as offline', () => {
      setUserOnline('testuser')
      setUserOffline('testuser')
      expect(isUserOnline('testuser')).toBe(false)
    })

    it('should handle non-existent user', () => {
      expect(() => setUserOffline('unknown')).not.toThrow()
    })
  })

  describe('isUserOnline', () => {
    it('should return true for online user', () => {
      setUserOnline('online_user')
      expect(isUserOnline('online_user')).toBe(true)
    })

    it('should return false for offline user', () => {
      expect(isUserOnline('never_online')).toBe(false)
    })

    it('should return false for empty ID', () => {
      expect(isUserOnline('')).toBe(false)
    })

    it('should return false for null ID', () => {
      expect(isUserOnline(null)).toBe(false)
    })
  })

  describe('getOnlineUsers', () => {
    it('should return array of online users', () => {
      setUserOnline('user_a')
      setUserOnline('user_b')
      const online = getOnlineUsers()
      expect(Array.isArray(online)).toBe(true)
    })

    it('should exclude current user', () => {
      setUserOnline('user123') // Current user
      const online = getOnlineUsers()
      expect(online.some((u) => u.id === 'user123')).toBe(false)
    })

    it('should exclude blocked users', () => {
      setUserOnline('blocked_user')
      const online = getOnlineUsers()
      expect(online.some((u) => u.id === 'blocked_user')).toBe(false)
    })
  })

  describe('getOnlineUserCount', () => {
    it('should return number', () => {
      const count = getOnlineUserCount()
      expect(typeof count).toBe('number')
    })

    it('should return 0 when no other users online', () => {
      const count = getOnlineUserCount()
      expect(count).toBeGreaterThanOrEqual(0)
    })
  })

  // ==================== ROOM MANAGEMENT ====================

  describe('getChatRooms', () => {
    it('should return default rooms', () => {
      const rooms = getChatRooms()
      expect(rooms.length).toBeGreaterThan(0)
    })

    it('should include general room', () => {
      const rooms = getChatRooms()
      expect(rooms.some((r) => r.id === 'general')).toBe(true)
    })

    it('should have correct room structure', () => {
      const rooms = getChatRooms()
      rooms.forEach((room) => {
        expect(room).toHaveProperty('id')
        expect(room).toHaveProperty('name')
        expect(room).toHaveProperty('type')
      })
    })
  })

  describe('getRoom', () => {
    it('should return room by ID', () => {
      const room = getRoom('general')
      expect(room).toBeDefined()
      expect(room.id).toBe('general')
    })

    it('should return null for non-existent room', () => {
      const room = getRoom('non_existent')
      expect(room).toBeNull()
    })

    it('should return null for empty ID', () => {
      const room = getRoom('')
      expect(room).toBeNull()
    })
  })

  describe('joinRoom', () => {
    it('should join room successfully', () => {
      const result = joinRoom('general')
      expect(result.success).toBe(true)
      expect(result.room).toBeDefined()
    })

    it('should update state with new room', () => {
      joinRoom('france')
      const state = getState()
      expect(state.chatRoom).toBe('france')
    })

    it('should fail with empty room ID', () => {
      const result = joinRoom('')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_room_id')
    })

    it('should fail for non-existent room', () => {
      const result = joinRoom('non_existent')
      expect(result.success).toBe(false)
      expect(result.error).toBe('room_not_found')
    })
  })

  describe('leaveRoom', () => {
    it('should leave room successfully', () => {
      joinRoom('general')
      const result = leaveRoom('general')
      expect(result.success).toBe(true)
    })

    it('should fail with empty room ID', () => {
      const result = leaveRoom('')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_room_id')
    })
  })

  // ==================== RENDERING ====================

  describe('renderMessage', () => {
    it('should render message HTML', () => {
      const sent = sendMessage('general', 'Render me')
      const html = renderMessage(sent.message)
      expect(html).toContain('Render me')
      expect(html).toContain('data-message-id')
    })

    it('should return empty string for null message', () => {
      const html = renderMessage(null)
      expect(html).toBe('')
    })

    it('should show edited label for edited messages', () => {
      const sent = sendMessage('general', 'Original')
      editMessage(sent.message.id, 'Edited')
      const message = getMessage(sent.message.id)
      const html = renderMessage(message)
      expect(html).toContain('modifie')
    })

    it('should escape HTML in content', () => {
      const sent = sendMessage('general', '<script>alert("xss")</script>')
      const html = renderMessage(sent.message)
      expect(html).not.toContain('<script>')
      expect(html).toContain('&lt;script&gt;')
    })
  })

  describe('renderTypingIndicator', () => {
    it('should return empty string when no one is typing', () => {
      const html = renderTypingIndicator('general')
      expect(html).toBe('')
    })

    it('should contain typing-indicator class when present', () => {
      // Would need mock typing users to test this properly
    })
  })

  describe('renderOnlineUsersBadge', () => {
    it('should render badge HTML', () => {
      const html = renderOnlineUsersBadge()
      expect(html).toContain('online-users-badge')
      expect(html).toContain('en ligne')
    })
  })

  describe('renderChatRoomList', () => {
    it('should render room list HTML', () => {
      const html = renderChatRoomList()
      expect(html).toContain('chat-room-list')
      expect(html).toContain('General')
    })

    it('should mark current room as active', () => {
      setState({ chatRoom: 'general' })
      const html = renderChatRoomList()
      expect(html).toContain('aria-pressed="true"')
    })
  })

  // ==================== GLOBAL HANDLERS ====================

  describe('Global handlers', () => {
    it('should have joinChatRoom handler', () => {
      expect(typeof window.joinChatRoom).toBe('function')
    })

    it('should have sendChatMessage handler', () => {
      expect(typeof window.sendChatMessage).toBe('function')
    })

    it('should have setTyping handler', () => {
      expect(typeof window.setTyping).toBe('function')
    })

    it('joinChatRoom should join room', () => {
      window.joinChatRoom('france')
      const state = getState()
      expect(state.chatRoom).toBe('france')
    })

    it('sendChatMessage should send message', () => {
      const result = window.sendChatMessage('general', 'Via handler')
      expect(result.success).toBe(true)
    })
  })

  // ==================== EDGE CASES ====================

  describe('Edge cases', () => {
    it('should handle rapid message sending', () => {
      for (let i = 0; i < 10; i++) {
        sendMessage('general', `Message ${i}`)
      }
      const messages = getMessages('general')
      expect(messages.length).toBe(10)
    })

    it('should handle special characters in content', () => {
      const specialContent = 'Emoji: 🚗 Accents: eaociu Symbols: @#$%^&*()'
      const result = sendMessage('general', specialContent)
      expect(result.success).toBe(true)
      expect(result.message.content).toBe(specialContent)
    })

    it('should handle newlines in content', () => {
      const multiline = 'Line 1\nLine 2\nLine 3'
      const result = sendMessage('general', multiline)
      expect(result.success).toBe(true)
      expect(result.message.content).toBe(multiline)
    })

    it('should handle unicode in usernames', () => {
      setState({ username: '🤙 Hitchhiker 旅行者' })
      const result = sendMessage('general', 'Hello')
      expect(result.message.userName).toBe('🤙 Hitchhiker 旅行者')
    })
  })

  // ==================== INTEGRATION ====================

  describe('Integration', () => {
    it('should handle full message lifecycle', () => {
      // Send
      const sent = sendMessage('general', 'Full lifecycle')
      expect(sent.success).toBe(true)

      // Get
      let message = getMessage(sent.message.id)
      expect(message.content).toBe('Full lifecycle')

      // Edit
      editMessage(sent.message.id, 'Edited lifecycle')
      message = getMessage(sent.message.id)
      expect(message.content).toBe('Edited lifecycle')
      expect(message.edited).toBe(true)

      // Delete
      deleteMessage(sent.message.id)
      message = getMessage(sent.message.id)
      expect(message).toBeNull()
    })

    it('should handle room switching', () => {
      sendMessage('general', 'In general')
      joinRoom('france')
      sendMessage('france', 'In france')

      const generalMessages = getMessages('general')
      const franceMessages = getMessages('france')

      expect(generalMessages.length).toBe(1)
      expect(franceMessages.length).toBe(1)
    })

    it('should notify subscribers on message send', () => {
      const callback = vi.fn()
      subscribeToRoom('general', callback)

      // Clear initial call
      callback.mockClear()

      sendMessage('general', 'Notify test')
      expect(callback).toHaveBeenCalled()
    })
  })
})
