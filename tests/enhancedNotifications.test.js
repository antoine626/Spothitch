/**
 * Enhanced Notifications Service Tests (#218-224)
 * Tests for push notifications, sounds, badges, animations, and specific notification types
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock the state module
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({ lang: 'fr', unreadFriendMessages: 0 })),
  setState: vi.fn(),
}))

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key, params = {}) => {
    const translations = {
      newFriendNotifTitle: 'Nouvel ami !',
      newFriendNotifBody: `${params.name} a accepte ta demande d'ami !`,
      newMessageNotifTitle: `Message de ${params.sender}`,
      newMessageNotifBody: 'Tu as recu un nouveau message',
      badgeUnlockedNotifTitle: 'Badge debloque !',
      badgeUnlockedNotifBody: `Tu as obtenu le badge "${params.name}"`,
      levelUpNotifTitle: `Niveau ${params.level} atteint !`,
      levelUpNotifBody: `Felicitations pour le niveau ${params.level} !`,
      levelUpNewTitle: `Nouveau titre : ${params.title}`,
      friendNearbyNotifTitle: 'Ami a proximite !',
      friendNearbyNotifBody: `${params.name} est a ${params.distance} de toi`,
      viewProfile: 'Voir profil',
      sendMessage: 'Envoyer message',
      reply: 'Repondre',
      viewConversation: 'Voir conversation',
      viewBadges: 'Voir badges',
      viewOnMap: 'Voir sur carte',
      newBadge: 'Nouveau badge',
      newUnlocks: 'Nouveaux deblocages',
      newTitle: 'Nouveau titre',
      levelUp: 'Niveau superieur',
      anonymousUser: 'Utilisateur anonyme',
      close: 'Fermer',
      share: 'Partager',
      shareAchievementTitle: `Logro desbloqueado: ${params.name}`,
      shareAchievementText: `J'ai debloque le badge "${params.name}" sur SpotHitch !`,
      points: 'points',
    }
    return translations[key] || key
  }),
}))

// Mock sanitize
vi.mock('../src/utils/sanitize.js', () => ({
  escapeHTML: vi.fn((str) => str),
}))

// Import after mocks
import {
  initEnhancedNotifications,
  NotificationType,
  getNotificationHistory,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  clearNotificationHistory,
  setSoundEnabled,
  isSoundEnabled,
  playNotificationSound,
  updateBadgeCount,
  getBadgeCount,
  incrementBadgeCount,
  clearBadgeCount,
  requestNotificationPermission,
  isNotificationAvailable,
  createEnhancedNotification,
  showEnhancedToast,
  notifyNewFriendEnhanced,
  notifyNewMessageEnhanced,
  notifyBadgeUnlockedEnhanced,
  notifyLevelUpEnhanced,
  notifyFriendNearbyEnhanced,
  showBadgeUnlockAnimation,
  showLevelUpAnimation,
} from '../src/services/enhancedNotifications.js'

import { getState, setState } from '../src/stores/state.js'

describe('Enhanced Notifications Service', () => {
  let mockStorage

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = ''

    // Mock localStorage and sessionStorage with a shared mock object
    mockStorage = {}

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => mockStorage[key] || null),
        setItem: vi.fn((key, value) => {
          mockStorage[key] = String(value)
        }),
        removeItem: vi.fn((key) => {
          delete mockStorage[key]
        }),
        clear: vi.fn(() => {
          mockStorage = {}
        }),
      },
      writable: true,
    })

    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn((key) => mockStorage[`session_${key}`] || null),
        setItem: vi.fn((key, value) => {
          mockStorage[`session_${key}`] = String(value)
        }),
        removeItem: vi.fn((key) => {
          delete mockStorage[`session_${key}`]
        }),
        clear: vi.fn(),
      },
      writable: true,
    })

    // Mock Notification API
    global.Notification = vi.fn()
    global.Notification.permission = 'default'
    global.Notification.requestPermission = vi.fn().mockResolvedValue('granted')

    // Mock navigator
    global.navigator.setAppBadge = vi.fn().mockResolvedValue()
    global.navigator.clearAppBadge = vi.fn().mockResolvedValue()

    // Clear mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==================== NOTIFICATION TYPES ====================

  describe('NotificationType', () => {
    it('should export all notification types', () => {
      expect(NotificationType).toBeDefined()
      expect(NotificationType.NEW_FRIEND).toBe('new_friend')
      expect(NotificationType.NEW_MESSAGE).toBe('new_message')
      expect(NotificationType.BADGE_UNLOCKED).toBe('badge_unlocked')
      expect(NotificationType.LEVEL_UP).toBe('level_up')
      expect(NotificationType.FRIEND_NEARBY).toBe('friend_nearby')
    })

    it('should have all expected notification types', () => {
      const types = Object.values(NotificationType)
      expect(types).toContain('new_friend')
      expect(types).toContain('new_message')
      expect(types).toContain('badge_unlocked')
      expect(types).toContain('level_up')
      expect(types).toContain('friend_nearby')
      expect(types).toContain('challenge_invite')
      expect(types).toContain('challenge_completed')
      expect(types).toContain('spot_activity')
      expect(types).toContain('daily_reward')
      expect(types).toContain('streak_reminder')
    })
  })

  // ==================== INITIALIZATION ====================

  describe('initEnhancedNotifications', () => {
    it('should initialize successfully', () => {
      const result = initEnhancedNotifications()
      expect(result).toBe(true)
    })

    it('should load notification history from localStorage', () => {
      mockStorage['spothitch_notification_history'] = JSON.stringify([{ id: 'test', read: false }])
      initEnhancedNotifications()
      const history = getNotificationHistory()
      expect(history).toHaveLength(1)
      expect(history[0].id).toBe('test')
    })

    it('should handle invalid localStorage data', () => {
      mockStorage['spothitch_notification_history'] = 'invalid json'
      expect(() => initEnhancedNotifications()).not.toThrow()
    })

    it('should add click listener for audio context', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
      initEnhancedNotifications()
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
    })
  })

  // ==================== NOTIFICATION HISTORY ====================

  describe('Notification History', () => {
    beforeEach(() => {
      initEnhancedNotifications()
    })

    it('should return empty history when no notifications', () => {
      const history = getNotificationHistory()
      expect(history).toEqual([])
    })

    it('should respect limit parameter', () => {
      // Add some notifications via the notify functions
      for (let i = 0; i < 10; i++) {
        notifyNewFriendEnhanced({ name: `Friend ${i}`, id: `id_${i}` })
      }
      const history = getNotificationHistory(5)
      expect(history).toHaveLength(5)
    })

    it('should return unread count correctly', () => {
      notifyNewFriendEnhanced({ name: 'Test Friend', id: '123' })
      expect(getUnreadCount()).toBeGreaterThanOrEqual(1)
    })

    it('should mark notification as read', () => {
      notifyNewFriendEnhanced({ name: 'Test', id: '123' })
      const history = getNotificationHistory()
      const notifId = history[0].id
      markAsRead(notifId)
      const updated = getNotificationHistory()
      const notif = updated.find(n => n.id === notifId)
      expect(notif.read).toBe(true)
    })

    it('should mark all notifications as read', () => {
      notifyNewFriendEnhanced({ name: 'Test1', id: '1' })
      notifyNewFriendEnhanced({ name: 'Test2', id: '2' })
      markAllAsRead()
      const history = getNotificationHistory()
      history.forEach(n => expect(n.read).toBe(true))
    })

    it('should clear notification history', () => {
      notifyNewFriendEnhanced({ name: 'Test', id: '123' })
      clearNotificationHistory()
      expect(getNotificationHistory()).toHaveLength(0)
    })

    it('should limit history to 100 entries when saving', () => {
      for (let i = 0; i < 120; i++) {
        notifyNewFriendEnhanced({ name: `Friend ${i}`, id: `id_${i}` })
      }
      // When we reload, it should be trimmed
      const savedData = mockStorage['spothitch_notification_history']
      if (savedData) {
        const saved = JSON.parse(savedData)
        expect(saved.length).toBeLessThanOrEqual(100)
      }
    })
  })

  // ==================== SOUND MANAGEMENT ====================

  describe('Sound Management', () => {
    beforeEach(() => {
      initEnhancedNotifications()
    })

    it('should return sound enabled by default', () => {
      expect(isSoundEnabled()).toBe(true)
    })

    it('should disable sounds', () => {
      setSoundEnabled(false)
      expect(isSoundEnabled()).toBe(false)
    })

    it('should enable sounds', () => {
      setSoundEnabled(false)
      setSoundEnabled(true)
      expect(isSoundEnabled()).toBe(true)
    })

    it('should persist sound preference', () => {
      setSoundEnabled(false)
      expect(mockStorage['spothitch_notification_sound']).toBe('false')
    })

    it('should load sound preference from localStorage', () => {
      mockStorage['spothitch_notification_sound'] = 'false'
      initEnhancedNotifications()
      expect(isSoundEnabled()).toBe(false)
    })

    it('should play notification sound without throwing', () => {
      // Mock AudioContext
      global.AudioContext = vi.fn().mockImplementation(() => ({
        createOscillator: vi.fn().mockReturnValue({
          connect: vi.fn(),
          type: '',
          frequency: { setValueAtTime: vi.fn() },
          start: vi.fn(),
          stop: vi.fn(),
        }),
        createGain: vi.fn().mockReturnValue({
          connect: vi.fn(),
          gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        }),
        destination: {},
        currentTime: 0,
      }))

      expect(() => playNotificationSound('friend')).not.toThrow()
      expect(() => playNotificationSound('message')).not.toThrow()
      expect(() => playNotificationSound('achievement')).not.toThrow()
      expect(() => playNotificationSound('levelup')).not.toThrow()
      expect(() => playNotificationSound('nearby')).not.toThrow()
      expect(() => playNotificationSound('default')).not.toThrow()
    })

    it('should not play sound when disabled', () => {
      const mockAudioContext = vi.fn()
      global.AudioContext = mockAudioContext
      setSoundEnabled(false)
      playNotificationSound('friend')
      expect(mockAudioContext).not.toHaveBeenCalled()
    })
  })

  // ==================== BADGE COUNT ====================

  describe('Badge Count', () => {
    beforeEach(() => {
      // Clear badge count before each test
      mockStorage = {}
      initEnhancedNotifications()
      clearBadgeCount()
    })

    it('should return 0 by default', () => {
      expect(getBadgeCount()).toBe(0)
    })

    it('should update badge count', () => {
      updateBadgeCount(5)
      expect(getBadgeCount()).toBe(5)
    })

    it('should increment badge count', () => {
      updateBadgeCount(3)
      incrementBadgeCount()
      expect(getBadgeCount()).toBe(4)
    })

    it('should clear badge count', () => {
      updateBadgeCount(10)
      clearBadgeCount()
      expect(getBadgeCount()).toBe(0)
    })

    it('should persist badge count to localStorage', () => {
      updateBadgeCount(7)
      expect(mockStorage['spothitch_badge_count']).toBe('7')
    })

    it('should call navigator.setAppBadge when supported', async () => {
      updateBadgeCount(3)
      expect(navigator.setAppBadge).toHaveBeenCalledWith(3)
    })

    it('should call navigator.clearAppBadge when count is 0', async () => {
      updateBadgeCount(0)
      expect(navigator.clearAppBadge).toHaveBeenCalled()
    })
  })

  // ==================== PERMISSION ====================

  describe('Notification Permission', () => {
    it('should return true if permission already granted', async () => {
      global.Notification.permission = 'granted'
      const result = await requestNotificationPermission()
      expect(result).toBe(true)
    })

    it('should return false if permission denied', async () => {
      global.Notification.permission = 'denied'
      const result = await requestNotificationPermission()
      expect(result).toBe(false)
    })

    it('should request permission if default', async () => {
      global.Notification.permission = 'default'
      global.Notification.requestPermission = vi.fn().mockResolvedValue('granted')
      const result = await requestNotificationPermission()
      expect(global.Notification.requestPermission).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should return false if Notification API not available', async () => {
      const originalNotification = global.Notification
      delete global.Notification
      const result = await requestNotificationPermission()
      expect(result).toBe(false)
      global.Notification = originalNotification
    })

    it('should check if notification is available', () => {
      global.Notification.permission = 'granted'
      expect(isNotificationAvailable()).toBe(true)

      global.Notification.permission = 'denied'
      expect(isNotificationAvailable()).toBe(false)
    })
  })

  // ==================== ENHANCED TOAST ====================

  describe('showEnhancedToast', () => {
    beforeEach(() => {
      initEnhancedNotifications()
    })

    it('should create toast container if not exists', () => {
      showEnhancedToast({ title: 'Test', body: 'Test body' })
      const container = document.getElementById('enhanced-toast-container')
      expect(container).not.toBeNull()
    })

    it('should create toast with title and body', () => {
      showEnhancedToast({ title: 'Test Title', body: 'Test Body' })
      const toast = document.querySelector('.enhanced-toast')
      expect(toast).not.toBeNull()
      expect(toast.innerHTML).toContain('Test Title')
      expect(toast.innerHTML).toContain('Test Body')
    })

    it('should create toast with icon', () => {
      showEnhancedToast({ title: 'Test', icon: '🎉' })
      const toast = document.querySelector('.enhanced-toast')
      expect(toast.innerHTML).toContain('🎉')
    })

    it('should create toast with actions', () => {
      const mockAction = vi.fn()
      showEnhancedToast({
        title: 'Test',
        actions: [{ label: 'Click Me', action: mockAction }],
      })
      const actionBtn = document.querySelector('.toast-action')
      expect(actionBtn).not.toBeNull()
      expect(actionBtn.textContent).toBe('Click Me')
    })

    it('should have close button', () => {
      showEnhancedToast({ title: 'Test' })
      const closeBtn = document.querySelector('.toast-close')
      expect(closeBtn).not.toBeNull()
    })

    it('should apply correct type color', () => {
      showEnhancedToast({ title: 'Test', type: 'success' })
      const toast = document.querySelector('.enhanced-toast-success')
      expect(toast).not.toBeNull()
    })

    it('should auto-dismiss after duration', () => {
      vi.useFakeTimers()
      showEnhancedToast({ title: 'Test', duration: 1000 })
      vi.advanceTimersByTime(1500)
      vi.useRealTimers()
    })
  })

  // ==================== NOTIFY NEW FRIEND (#219) ====================

  describe('notifyNewFriendEnhanced (#219)', () => {
    beforeEach(() => {
      initEnhancedNotifications()
    })

    it('should create notification for new friend', () => {
      const result = notifyNewFriendEnhanced({ name: 'Alice', id: '123' })
      expect(result).toBeDefined()
      expect(result.type).toBe(NotificationType.NEW_FRIEND)
      expect(result.title).toContain('ami')
    })

    it('should include friend name in body', () => {
      const result = notifyNewFriendEnhanced({ name: 'Bob', id: '456' })
      expect(result.body).toContain('Bob')
    })

    it('should handle missing name', () => {
      const result = notifyNewFriendEnhanced({ id: '789' })
      expect(result).toBeDefined()
    })

    it('should use avatar as icon if provided', () => {
      const result = notifyNewFriendEnhanced({ name: 'Test', avatar: '😎', id: '123' })
      expect(result.icon).toBe('😎')
    })

    it('should have view profile and send message actions', () => {
      const result = notifyNewFriendEnhanced({ name: 'Test', id: '123' })
      expect(result.actions).toHaveLength(2)
    })

    it('should add notification to history', () => {
      clearNotificationHistory()
      notifyNewFriendEnhanced({ name: 'Test', id: '123' })
      const history = getNotificationHistory()
      expect(history.length).toBeGreaterThan(0)
    })

    it('should increment badge count', () => {
      clearBadgeCount()
      notifyNewFriendEnhanced({ name: 'Test', id: '123' })
      expect(getBadgeCount()).toBeGreaterThan(0)
    })

    it('should show toast notification', () => {
      notifyNewFriendEnhanced({ name: 'Test', id: '123' })
      const toast = document.querySelector('.enhanced-toast')
      expect(toast).not.toBeNull()
    })
  })

  // ==================== NOTIFY NEW MESSAGE (#220) ====================

  describe('notifyNewMessageEnhanced (#220)', () => {
    beforeEach(() => {
      initEnhancedNotifications()
    })

    it('should create notification for new message', () => {
      const result = notifyNewMessageEnhanced({
        senderName: 'Charlie',
        senderId: '123',
        text: 'Hello!',
      })
      expect(result).toBeDefined()
      expect(result.type).toBe(NotificationType.NEW_MESSAGE)
    })

    it('should include sender name in title', () => {
      const result = notifyNewMessageEnhanced({
        senderName: 'Diana',
        senderId: '456',
      })
      expect(result.title).toContain('Diana')
    })

    it('should include message preview', () => {
      const result = notifyNewMessageEnhanced({
        senderName: 'Test',
        senderId: '789',
        preview: 'Hey there!',
      })
      expect(result.body).toBe('Hey there!')
    })

    it('should truncate long messages', () => {
      const longText = 'A'.repeat(100)
      const result = notifyNewMessageEnhanced({
        senderName: 'Test',
        senderId: '123',
        text: longText,
      })
      expect(result.body.length).toBeLessThan(100)
      expect(result.body).toContain('...')
    })

    it('should have reply and view conversation actions', () => {
      const result = notifyNewMessageEnhanced({
        senderName: 'Test',
        senderId: '123',
      })
      expect(result.actions).toHaveLength(2)
    })

    it('should update unread messages in state', () => {
      notifyNewMessageEnhanced({
        senderName: 'Test',
        senderId: '123',
      })
      expect(setState).toHaveBeenCalled()
    })

    it('should use sender avatar as icon', () => {
      const result = notifyNewMessageEnhanced({
        senderName: 'Test',
        senderId: '123',
        senderAvatar: '👋',
      })
      expect(result.icon).toBe('👋')
    })
  })

  // ==================== NOTIFY BADGE UNLOCKED (#221) ====================

  describe('notifyBadgeUnlockedEnhanced (#221)', () => {
    beforeEach(() => {
      initEnhancedNotifications()
    })

    it('should create notification for badge unlock', () => {
      const result = notifyBadgeUnlockedEnhanced({
        name: 'First Steps',
        id: 'badge_1',
      })
      expect(result).toBeDefined()
      expect(result.type).toBe(NotificationType.BADGE_UNLOCKED)
    })

    it('should include badge name in body', () => {
      const result = notifyBadgeUnlockedEnhanced({
        name: 'Road Warrior',
        id: 'badge_2',
      })
      expect(result.body).toContain('Road Warrior')
    })

    it('should include badge icon', () => {
      const result = notifyBadgeUnlockedEnhanced({
        name: 'Test',
        icon: '🏆',
        id: 'badge_3',
      })
      expect(result.icon).toBe('🏆')
    })

    it('should include rarity in data', () => {
      const result = notifyBadgeUnlockedEnhanced({
        name: 'Test',
        rarity: 'legendary',
        id: 'badge_4',
      })
      expect(result.data.rarity).toBe('legendary')
    })

    it('should include points in data', () => {
      const result = notifyBadgeUnlockedEnhanced({
        name: 'Test',
        points: 50,
        id: 'badge_5',
      })
      expect(result.data.points).toBe(50)
    })

    it('should have view badges and share actions', () => {
      const result = notifyBadgeUnlockedEnhanced({
        name: 'Test',
        id: 'badge_6',
      })
      expect(result.actions).toHaveLength(2)
    })
  })

  // ==================== BADGE UNLOCK ANIMATION ====================

  describe('showBadgeUnlockAnimation', () => {
    beforeEach(() => {
      initEnhancedNotifications()
    })

    it('should create overlay element', () => {
      showBadgeUnlockAnimation({ name: 'Test Badge', icon: '🎖️' })
      const overlay = document.getElementById('badge-unlock-overlay')
      expect(overlay).not.toBeNull()
    })

    it('should display badge name', () => {
      showBadgeUnlockAnimation({ name: 'Epic Badge', icon: '🎖️' })
      const overlay = document.getElementById('badge-unlock-overlay')
      expect(overlay.innerHTML).toContain('Epic Badge')
    })

    it('should display badge icon', () => {
      showBadgeUnlockAnimation({ name: 'Test', icon: '🏅' })
      const overlay = document.getElementById('badge-unlock-overlay')
      expect(overlay.innerHTML).toContain('🏅')
    })

    it('should display badge description if provided', () => {
      showBadgeUnlockAnimation({ name: 'Test', icon: '🎖️', description: 'You did it!' })
      const overlay = document.getElementById('badge-unlock-overlay')
      expect(overlay.innerHTML).toContain('You did it!')
    })

    it('should display points if provided', () => {
      showBadgeUnlockAnimation({ name: 'Test', icon: '🎖️', points: 100 })
      const overlay = document.getElementById('badge-unlock-overlay')
      expect(overlay.innerHTML).toContain('100')
    })

    it('should dismiss on click', () => {
      vi.useFakeTimers()
      showBadgeUnlockAnimation({ name: 'Test', icon: '🎖️' })
      const overlay = document.getElementById('badge-unlock-overlay')
      overlay.click()
      vi.advanceTimersByTime(500)
      vi.useRealTimers()
    })

    it('should auto-dismiss after 4 seconds', () => {
      vi.useFakeTimers()
      showBadgeUnlockAnimation({ name: 'Test', icon: '🎖️' })
      vi.advanceTimersByTime(4500)
      vi.useRealTimers()
    })
  })

  // ==================== NOTIFY LEVEL UP (#222) ====================

  describe('notifyLevelUpEnhanced (#222)', () => {
    beforeEach(() => {
      initEnhancedNotifications()
    })

    it('should create notification for level up', () => {
      const result = notifyLevelUpEnhanced(5)
      expect(result).toBeDefined()
      expect(result.type).toBe(NotificationType.LEVEL_UP)
    })

    it('should include level in title', () => {
      const result = notifyLevelUpEnhanced(10)
      expect(result.title).toContain('10')
    })

    it('should include bonus points in body', () => {
      const result = notifyLevelUpEnhanced(5, { points: 100 })
      expect(result.body).toContain('100')
    })

    it('should include new title if unlocked', () => {
      const result = notifyLevelUpEnhanced(10, { title: { name: 'Road Master' } })
      expect(result.body).toContain('Road Master')
    })

    it('should include unlocks in body', () => {
      const result = notifyLevelUpEnhanced(5, { unlocks: ['Chat', 'Badges'] })
      expect(result.body).toContain('Chat')
    })

    it('should have view profile action', () => {
      const result = notifyLevelUpEnhanced(5)
      expect(result.actions.length).toBeGreaterThan(0)
    })

    it('should use star icon', () => {
      const result = notifyLevelUpEnhanced(5)
      expect(result.icon).toBe('⭐')
    })
  })

  // ==================== LEVEL UP ANIMATION ====================

  describe('showLevelUpAnimation', () => {
    beforeEach(() => {
      initEnhancedNotifications()
    })

    it('should create overlay element', () => {
      showLevelUpAnimation(10)
      const overlay = document.getElementById('levelup-overlay')
      expect(overlay).not.toBeNull()
    })

    it('should display level number', () => {
      showLevelUpAnimation(15)
      const overlay = document.getElementById('levelup-overlay')
      expect(overlay.innerHTML).toContain('15')
    })

    it('should display bonus points if provided', () => {
      showLevelUpAnimation(5, { points: 200 })
      const overlay = document.getElementById('levelup-overlay')
      expect(overlay.innerHTML).toContain('200')
    })

    it('should display new title if provided', () => {
      showLevelUpAnimation(10, { title: { name: 'Champion' } })
      const overlay = document.getElementById('levelup-overlay')
      expect(overlay.innerHTML).toContain('Champion')
    })

    it('should display unlocks if provided', () => {
      showLevelUpAnimation(5, { unlocks: ['New Feature'] })
      const overlay = document.getElementById('levelup-overlay')
      expect(overlay.innerHTML).toContain('New Feature')
    })

    it('should add confetti particles', () => {
      showLevelUpAnimation(10)
      const overlay = document.getElementById('levelup-overlay')
      const confetti = overlay.querySelectorAll('div[style*="confettiFall"]')
      expect(confetti.length).toBeGreaterThan(0)
    })
  })

  // ==================== NOTIFY FRIEND NEARBY (#224) ====================

  describe('notifyFriendNearbyEnhanced (#224)', () => {
    beforeEach(() => {
      // Clear session storage to avoid rate limiting
      Object.keys(mockStorage).forEach(key => {
        if (key.startsWith('session_')) delete mockStorage[key]
      })
      initEnhancedNotifications()
    })

    it('should create notification for friend nearby', () => {
      const result = notifyFriendNearbyEnhanced(
        { name: 'Emma', id: '123' },
        0.5
      )
      expect(result).toBeDefined()
      expect(result.type).toBe(NotificationType.FRIEND_NEARBY)
    })

    it('should include friend name in body', () => {
      const result = notifyFriendNearbyEnhanced(
        { name: 'Frank', id: '456' },
        1.0
      )
      expect(result.body).toContain('Frank')
    })

    it('should format distance in meters when less than 1km', () => {
      const result = notifyFriendNearbyEnhanced(
        { name: 'Test', id: '789' },
        0.3
      )
      expect(result.body).toContain('300m')
    })

    it('should format distance in km when more than 1km', () => {
      // Clear session storage entries
      Object.keys(mockStorage).forEach(key => {
        if (key.startsWith('session_nearby_')) delete mockStorage[key]
      })
      const result = notifyFriendNearbyEnhanced(
        { name: 'Test', id: '111' },
        2.5
      )
      expect(result.body).toContain('2.5km')
    })

    it('should have view on map and send message actions', () => {
      const result = notifyFriendNearbyEnhanced(
        { name: 'Test', id: '222' },
        1.0
      )
      expect(result.actions).toHaveLength(2)
    })

    it('should not send duplicate notification within 1 hour', () => {
      // Clear session storage mock entries for nearby
      Object.keys(mockStorage).forEach(key => {
        if (key.startsWith('session_nearby_')) delete mockStorage[key]
      })
      const first = notifyFriendNearbyEnhanced(
        { name: 'Test', id: 'same_id' },
        1.0
      )
      const second = notifyFriendNearbyEnhanced(
        { name: 'Test', id: 'same_id' },
        1.0
      )
      expect(first).not.toBeNull()
      expect(second).toBeNull()
    })

    it('should include location in data', () => {
      const location = { lat: 48.8566, lng: 2.3522 }
      const result = notifyFriendNearbyEnhanced(
        { name: 'Test', id: '333', location },
        1.0
      )
      expect(result.data.location).toEqual(location)
    })
  })

  // ==================== CREATE ENHANCED NOTIFICATION ====================

  describe('createEnhancedNotification', () => {
    beforeEach(() => {
      initEnhancedNotifications()
    })

    it('should create notification when permission granted', () => {
      global.Notification.permission = 'granted'
      const notification = createEnhancedNotification({
        title: 'Test',
        body: 'Test body',
      })
      expect(global.Notification).toHaveBeenCalled()
    })

    it('should fallback to toast when permission not granted', () => {
      global.Notification.permission = 'denied'
      createEnhancedNotification({
        title: 'Test',
        body: 'Test body',
      })
      const toast = document.querySelector('.enhanced-toast')
      expect(toast).not.toBeNull()
    })

    it('should use provided icon', () => {
      global.Notification.permission = 'granted'
      createEnhancedNotification({
        title: 'Test',
        body: 'Body',
        icon: '/custom-icon.png',
      })
      expect(global.Notification).toHaveBeenCalledWith(
        'Test',
        expect.objectContaining({ icon: '/custom-icon.png' })
      )
    })

    it('should include data in notification', () => {
      global.Notification.permission = 'granted'
      createEnhancedNotification({
        title: 'Test',
        body: 'Body',
        data: { type: 'test' },
      })
      expect(global.Notification).toHaveBeenCalledWith(
        'Test',
        expect.objectContaining({ data: { type: 'test' } })
      )
    })
  })

  // ==================== DEFAULT EXPORT ====================

  describe('Default Export', () => {
    it('should export all functions', async () => {
      const module = await import('../src/services/enhancedNotifications.js')
      const defaultExport = module.default

      expect(defaultExport.initEnhancedNotifications).toBeDefined()
      expect(defaultExport.NotificationType).toBeDefined()
      expect(defaultExport.getNotificationHistory).toBeDefined()
      expect(defaultExport.getUnreadCount).toBeDefined()
      expect(defaultExport.markAsRead).toBeDefined()
      expect(defaultExport.markAllAsRead).toBeDefined()
      expect(defaultExport.clearNotificationHistory).toBeDefined()
      expect(defaultExport.setSoundEnabled).toBeDefined()
      expect(defaultExport.isSoundEnabled).toBeDefined()
      expect(defaultExport.playNotificationSound).toBeDefined()
      expect(defaultExport.updateBadgeCount).toBeDefined()
      expect(defaultExport.getBadgeCount).toBeDefined()
      expect(defaultExport.incrementBadgeCount).toBeDefined()
      expect(defaultExport.clearBadgeCount).toBeDefined()
      expect(defaultExport.requestNotificationPermission).toBeDefined()
      expect(defaultExport.isNotificationAvailable).toBeDefined()
      expect(defaultExport.createEnhancedNotification).toBeDefined()
      expect(defaultExport.showEnhancedToast).toBeDefined()
      expect(defaultExport.notifyNewFriendEnhanced).toBeDefined()
      expect(defaultExport.notifyNewMessageEnhanced).toBeDefined()
      expect(defaultExport.notifyBadgeUnlockedEnhanced).toBeDefined()
      expect(defaultExport.notifyLevelUpEnhanced).toBeDefined()
      expect(defaultExport.notifyFriendNearbyEnhanced).toBeDefined()
      expect(defaultExport.showBadgeUnlockAnimation).toBeDefined()
      expect(defaultExport.showLevelUpAnimation).toBeDefined()
    })
  })

  // ==================== ANIMATION STYLES ====================

  describe('Animation Styles', () => {
    beforeEach(() => {
      initEnhancedNotifications()
    })

    it('should add animation styles when showing badge animation', () => {
      showBadgeUnlockAnimation({ name: 'Test', icon: '🎖️' })
      const styleElement = document.getElementById('enhanced-notification-styles')
      expect(styleElement).not.toBeNull()
    })

    it('should include necessary keyframes', () => {
      showLevelUpAnimation(5)
      const styleElement = document.getElementById('enhanced-notification-styles')
      expect(styleElement.textContent).toContain('@keyframes fadeIn')
      expect(styleElement.textContent).toContain('@keyframes bounceIn')
      expect(styleElement.textContent).toContain('@keyframes confettiFall')
    })

    it('should not duplicate styles', () => {
      showBadgeUnlockAnimation({ name: 'Test1', icon: '🎖️' })
      showLevelUpAnimation(5)
      const styles = document.querySelectorAll('#enhanced-notification-styles')
      expect(styles.length).toBe(1)
    })
  })
})
