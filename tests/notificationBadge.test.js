/**
 * Notification Badge Service Tests
 * Tests for badge count management, PWA app badge, and favicon badge rendering
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  initNotificationBadge,
  setBadgeCount,
  incrementBadge,
  decrementBadge,
  clearBadge,
  getBadgeCount,
  subscribeToBadge,
  renderBadge,
  renderDotBadge,
  isAppBadgeSupported,
  syncBadgeWithNotifications,
  getBadgeStats,
  resetBadgeService
} from '../src/services/notificationBadge.js'

// Mock state
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    unreadFriendMessages: 0,
    pendingChallenges: [],
    friendRequests: []
  })),
  setState: vi.fn(),
  subscribe: vi.fn((callback) => {
    callback({
      unreadFriendMessages: 0,
      pendingChallenges: [],
      friendRequests: []
    })
    return () => {}
  })
}))

// Import mocked state for test control
import { getState } from '../src/stores/state.js'

describe('Notification Badge Service', () => {
  beforeEach(() => {
    // Reset badge service before each test
    resetBadgeService()

    // Clear localStorage
    localStorage.clear()

    // Setup DOM
    document.head.innerHTML = ''
    document.body.innerHTML = ''

    // Reset mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    resetBadgeService()
  })

  // ==================== initNotificationBadge ====================
  describe('initNotificationBadge()', () => {
    it('should initialize with count 0 by default', () => {
      const count = initNotificationBadge()
      expect(count).toBe(0)
    })

    it('should load persisted badge count from localStorage', () => {
      localStorage.setItem('spothitch_notification_badge_count', '5')
      const count = initNotificationBadge()
      expect(count).toBe(5)
    })

    it('should handle invalid localStorage value', () => {
      localStorage.setItem('spothitch_notification_badge_count', 'invalid')
      const count = initNotificationBadge()
      expect(count).toBe(0)
    })

    it('should store original favicon reference', () => {
      const faviconLink = document.createElement('link')
      faviconLink.rel = 'icon'
      faviconLink.href = '/test-favicon.png'
      document.head.appendChild(faviconLink)

      initNotificationBadge()
      // Badge service should have stored the favicon reference
      expect(getBadgeCount()).toBe(0)
    })

    it('should return current count after initialization', () => {
      localStorage.setItem('spothitch_notification_badge_count', '10')
      const count = initNotificationBadge()
      expect(count).toBe(10)
      expect(getBadgeCount()).toBe(10)
    })
  })

  // ==================== setBadgeCount ====================
  describe('setBadgeCount()', () => {
    beforeEach(() => {
      initNotificationBadge()
    })

    it('should set badge count to specified value', () => {
      const result = setBadgeCount(5)
      expect(result).toBe(5)
      expect(getBadgeCount()).toBe(5)
    })

    it('should not allow negative counts', () => {
      const result = setBadgeCount(-10)
      expect(result).toBe(0)
    })

    it('should round decimal values', () => {
      const result = setBadgeCount(3.7)
      expect(result).toBe(3)
    })

    it('should handle 0 count', () => {
      setBadgeCount(5)
      const result = setBadgeCount(0)
      expect(result).toBe(0)
    })

    it('should persist count to localStorage', () => {
      setBadgeCount(7)
      expect(localStorage.getItem('spothitch_notification_badge_count')).toBe('7')
    })

    it('should return same count if unchanged', () => {
      setBadgeCount(5)
      const result = setBadgeCount(5)
      expect(result).toBe(5)
    })

    it('should handle large numbers', () => {
      const result = setBadgeCount(999)
      expect(result).toBe(999)
    })

    it('should handle NaN as 0', () => {
      const result = setBadgeCount(NaN)
      expect(result).toBe(0)
    })
  })

  // ==================== incrementBadge ====================
  describe('incrementBadge()', () => {
    beforeEach(() => {
      initNotificationBadge()
    })

    it('should increment by 1 by default', () => {
      const result = incrementBadge()
      expect(result).toBe(1)
    })

    it('should increment by specified amount', () => {
      setBadgeCount(5)
      const result = incrementBadge(3)
      expect(result).toBe(8)
    })

    it('should handle multiple increments', () => {
      incrementBadge()
      incrementBadge()
      incrementBadge()
      expect(getBadgeCount()).toBe(3)
    })

    it('should treat negative increment as 1', () => {
      setBadgeCount(5)
      const result = incrementBadge(-2)
      expect(result).toBe(6) // Increments by 1
    })

    it('should round decimal increments', () => {
      setBadgeCount(5)
      const result = incrementBadge(2.9)
      expect(result).toBe(7) // 5 + 2
    })
  })

  // ==================== decrementBadge ====================
  describe('decrementBadge()', () => {
    beforeEach(() => {
      initNotificationBadge()
    })

    it('should decrement by 1 by default', () => {
      setBadgeCount(5)
      const result = decrementBadge()
      expect(result).toBe(4)
    })

    it('should decrement by specified amount', () => {
      setBadgeCount(10)
      const result = decrementBadge(3)
      expect(result).toBe(7)
    })

    it('should not go below 0', () => {
      setBadgeCount(2)
      const result = decrementBadge(5)
      expect(result).toBe(0)
    })

    it('should stay at 0 when already 0', () => {
      const result = decrementBadge()
      expect(result).toBe(0)
    })

    it('should handle multiple decrements', () => {
      setBadgeCount(5)
      decrementBadge()
      decrementBadge()
      expect(getBadgeCount()).toBe(3)
    })
  })

  // ==================== clearBadge ====================
  describe('clearBadge()', () => {
    beforeEach(() => {
      initNotificationBadge()
    })

    it('should set count to 0', () => {
      setBadgeCount(10)
      const result = clearBadge()
      expect(result).toBe(0)
    })

    it('should return 0 when already clear', () => {
      const result = clearBadge()
      expect(result).toBe(0)
    })

    it('should persist 0 to localStorage', () => {
      setBadgeCount(5)
      clearBadge()
      expect(localStorage.getItem('spothitch_notification_badge_count')).toBe('0')
    })
  })

  // ==================== getBadgeCount ====================
  describe('getBadgeCount()', () => {
    beforeEach(() => {
      initNotificationBadge()
    })

    it('should return 0 initially', () => {
      expect(getBadgeCount()).toBe(0)
    })

    it('should return current count after set', () => {
      setBadgeCount(15)
      expect(getBadgeCount()).toBe(15)
    })

    it('should reflect changes after increment', () => {
      incrementBadge()
      incrementBadge()
      expect(getBadgeCount()).toBe(2)
    })

    it('should reflect changes after decrement', () => {
      setBadgeCount(5)
      decrementBadge(2)
      expect(getBadgeCount()).toBe(3)
    })
  })

  // ==================== subscribeToBadge ====================
  describe('subscribeToBadge()', () => {
    beforeEach(() => {
      initNotificationBadge()
    })

    it('should call callback immediately with current count', () => {
      setBadgeCount(5)
      const callback = vi.fn()
      subscribeToBadge(callback)
      expect(callback).toHaveBeenCalledWith(5)
    })

    it('should call callback on badge count change', () => {
      const callback = vi.fn()
      subscribeToBadge(callback)
      callback.mockClear()

      setBadgeCount(10)
      expect(callback).toHaveBeenCalledWith(10)
    })

    it('should return unsubscribe function', () => {
      const callback = vi.fn()
      const unsubscribe = subscribeToBadge(callback)
      expect(typeof unsubscribe).toBe('function')
    })

    it('should not call callback after unsubscribe', () => {
      const callback = vi.fn()
      const unsubscribe = subscribeToBadge(callback)
      callback.mockClear()

      unsubscribe()
      setBadgeCount(20)

      expect(callback).not.toHaveBeenCalled()
    })

    it('should support multiple subscribers', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      subscribeToBadge(callback1)
      subscribeToBadge(callback2)

      callback1.mockClear()
      callback2.mockClear()

      setBadgeCount(7)

      expect(callback1).toHaveBeenCalledWith(7)
      expect(callback2).toHaveBeenCalledWith(7)
    })
  })

  // ==================== renderBadge ====================
  describe('renderBadge()', () => {
    it('should return empty string for count 0', () => {
      const result = renderBadge(0)
      expect(result).toBe('')
    })

    it('should return empty string for negative count', () => {
      const result = renderBadge(-5)
      expect(result).toBe('')
    })

    it('should render badge with count', () => {
      const result = renderBadge(5)
      expect(result).toContain('5')
      expect(result).toContain('span')
    })

    it('should include aria-label for accessibility', () => {
      const result = renderBadge(3)
      expect(result).toContain('aria-label')
      expect(result).toContain('3 notifications non lues')
    })

    it('should have role="status"', () => {
      const result = renderBadge(1)
      expect(result).toContain('role="status"')
    })

    it('should apply size classes', () => {
      const smResult = renderBadge(1, { size: 'sm' })
      const lgResult = renderBadge(1, { size: 'lg' })

      expect(smResult).toContain('w-4 h-4')
      expect(lgResult).toContain('w-6 h-6')
    })

    it('should apply position classes', () => {
      const topRight = renderBadge(1, { position: 'top-right' })
      const bottomLeft = renderBadge(1, { position: 'bottom-left' })

      expect(topRight).toContain('-top-1 -right-1')
      expect(bottomLeft).toContain('-bottom-1 -left-1')
    })

    it('should apply custom color', () => {
      const result = renderBadge(1, { color: 'bg-blue-500' })
      expect(result).toContain('bg-blue-500')
    })

    it('should apply pulse animation when enabled', () => {
      const result = renderBadge(1, { pulse: true })
      expect(result).toContain('animate-pulse')
    })

    it('should not apply pulse by default', () => {
      const result = renderBadge(1)
      expect(result).not.toContain('animate-pulse')
    })

    it('should truncate count above maxDisplay', () => {
      const result = renderBadge(150, { maxDisplay: 99 })
      expect(result).toContain('99+')
    })

    it('should show exact count below maxDisplay', () => {
      const result = renderBadge(50, { maxDisplay: 99 })
      expect(result).toContain('50')
      expect(result).not.toContain('+')
    })

    it('should use default maxDisplay of 99', () => {
      const result = renderBadge(100)
      expect(result).toContain('99+')
    })
  })

  // ==================== renderDotBadge ====================
  describe('renderDotBadge()', () => {
    it('should render a dot badge', () => {
      const result = renderDotBadge()
      expect(result).toContain('span')
      expect(result).toContain('rounded-full')
    })

    it('should have aria-hidden by default', () => {
      const result = renderDotBadge()
      expect(result).toContain('aria-hidden="true"')
    })

    it('should apply size classes', () => {
      const smResult = renderDotBadge({ size: 'sm' })
      const lgResult = renderDotBadge({ size: 'lg' })

      expect(smResult).toContain('w-2 h-2')
      expect(lgResult).toContain('w-4 h-4')
    })

    it('should apply pulse by default', () => {
      const result = renderDotBadge()
      expect(result).toContain('animate-pulse')
    })

    it('should not apply pulse when disabled', () => {
      const result = renderDotBadge({ pulse: false })
      expect(result).not.toContain('animate-pulse')
    })

    it('should apply position classes', () => {
      const topLeft = renderDotBadge({ position: 'top-left' })
      expect(topLeft).toContain('-top-0.5 -left-0.5')
    })

    it('should apply custom color', () => {
      const result = renderDotBadge({ color: 'bg-green-500' })
      expect(result).toContain('bg-green-500')
    })
  })

  // ==================== isAppBadgeSupported ====================
  describe('isAppBadgeSupported()', () => {
    it('should return false when API not available', () => {
      delete navigator.setAppBadge
      delete navigator.clearAppBadge
      expect(isAppBadgeSupported()).toBe(false)
    })

    it('should return true when API is available', () => {
      navigator.setAppBadge = vi.fn()
      navigator.clearAppBadge = vi.fn()
      expect(isAppBadgeSupported()).toBe(true)
    })

    it('should return false when only setAppBadge is available', () => {
      navigator.setAppBadge = vi.fn()
      delete navigator.clearAppBadge
      expect(isAppBadgeSupported()).toBe(false)
    })
  })

  // ==================== syncBadgeWithNotifications ====================
  describe('syncBadgeWithNotifications()', () => {
    beforeEach(() => {
      initNotificationBadge()
    })

    it('should set badge to 0 when no unread notifications', () => {
      getState.mockReturnValue({
        unreadFriendMessages: 0,
        pendingChallenges: [],
        friendRequests: []
      })

      const result = syncBadgeWithNotifications()
      expect(result).toBe(0)
    })

    it('should count unread messages', () => {
      getState.mockReturnValue({
        unreadFriendMessages: 5,
        pendingChallenges: [],
        friendRequests: []
      })

      const result = syncBadgeWithNotifications()
      expect(result).toBe(5)
    })

    it('should count pending challenges', () => {
      getState.mockReturnValue({
        unreadFriendMessages: 0,
        pendingChallenges: [{ id: 1 }, { id: 2 }],
        friendRequests: []
      })

      const result = syncBadgeWithNotifications()
      expect(result).toBe(2)
    })

    it('should count friend requests', () => {
      getState.mockReturnValue({
        unreadFriendMessages: 0,
        pendingChallenges: [],
        friendRequests: [{ id: 1 }, { id: 2 }, { id: 3 }]
      })

      const result = syncBadgeWithNotifications()
      expect(result).toBe(3)
    })

    it('should sum all notification types', () => {
      getState.mockReturnValue({
        unreadFriendMessages: 3,
        pendingChallenges: [{ id: 1 }, { id: 2 }],
        friendRequests: [{ id: 1 }]
      })

      const result = syncBadgeWithNotifications()
      expect(result).toBe(6) // 3 + 2 + 1
    })

    it('should handle missing state properties', () => {
      getState.mockReturnValue({})

      const result = syncBadgeWithNotifications()
      expect(result).toBe(0)
    })
  })

  // ==================== getBadgeStats ====================
  describe('getBadgeStats()', () => {
    beforeEach(() => {
      initNotificationBadge()
    })

    it('should return current badge count', () => {
      setBadgeCount(7)
      const stats = getBadgeStats()
      expect(stats.currentCount).toBe(7)
    })

    it('should return unread messages count', () => {
      getState.mockReturnValue({
        unreadFriendMessages: 4,
        pendingChallenges: [],
        friendRequests: []
      })

      const stats = getBadgeStats()
      expect(stats.unreadMessages).toBe(4)
    })

    it('should return pending challenges count', () => {
      getState.mockReturnValue({
        unreadFriendMessages: 0,
        pendingChallenges: [{ id: 1 }],
        friendRequests: []
      })

      const stats = getBadgeStats()
      expect(stats.pendingChallenges).toBe(1)
    })

    it('should return friend requests count', () => {
      getState.mockReturnValue({
        unreadFriendMessages: 0,
        pendingChallenges: [],
        friendRequests: [{ id: 1 }, { id: 2 }]
      })

      const stats = getBadgeStats()
      expect(stats.friendRequests).toBe(2)
    })

    it('should include isAppBadgeSupported', () => {
      const stats = getBadgeStats()
      expect(typeof stats.isAppBadgeSupported).toBe('boolean')
    })

    it('should include lastUpdated timestamp', () => {
      const stats = getBadgeStats()
      expect(stats.lastUpdated).toBeDefined()
      expect(typeof stats.lastUpdated).toBe('string')
    })
  })

  // ==================== resetBadgeService ====================
  describe('resetBadgeService()', () => {
    it('should reset badge count to 0', () => {
      initNotificationBadge()
      setBadgeCount(10)
      resetBadgeService()
      expect(getBadgeCount()).toBe(0)
    })

    it('should clear localStorage', () => {
      initNotificationBadge()
      setBadgeCount(5)
      resetBadgeService()
      expect(localStorage.getItem('spothitch_notification_badge_count')).toBeNull()
    })

    it('should clear all subscribers', () => {
      initNotificationBadge()
      const callback = vi.fn()
      subscribeToBadge(callback)
      callback.mockClear()

      resetBadgeService()
      setBadgeCount(10)

      expect(callback).not.toHaveBeenCalled()
    })
  })

  // ==================== Integration tests ====================
  describe('Integration', () => {
    beforeEach(() => {
      initNotificationBadge()
    })

    it('should handle full workflow: init -> set -> increment -> decrement -> clear', () => {
      expect(getBadgeCount()).toBe(0)

      setBadgeCount(5)
      expect(getBadgeCount()).toBe(5)

      incrementBadge(3)
      expect(getBadgeCount()).toBe(8)

      decrementBadge(2)
      expect(getBadgeCount()).toBe(6)

      clearBadge()
      expect(getBadgeCount()).toBe(0)
    })

    it('should persist and restore badge count across init calls', () => {
      setBadgeCount(15)
      resetBadgeService()

      localStorage.setItem('spothitch_notification_badge_count', '15')
      initNotificationBadge()

      expect(getBadgeCount()).toBe(15)
    })

    it('should notify subscribers throughout lifecycle', () => {
      const callback = vi.fn()
      subscribeToBadge(callback)

      expect(callback).toHaveBeenCalledWith(0)
      callback.mockClear()

      setBadgeCount(5)
      expect(callback).toHaveBeenCalledWith(5)
      callback.mockClear()

      incrementBadge()
      expect(callback).toHaveBeenCalledWith(6)
      callback.mockClear()

      clearBadge()
      expect(callback).toHaveBeenCalledWith(0)
    })

    it('should render badge correctly at different counts', () => {
      const badge1 = renderBadge(1)
      const badge50 = renderBadge(50)
      const badge100 = renderBadge(100)

      expect(badge1).toContain('>1<')
      expect(badge50).toContain('>50<')
      expect(badge100).toContain('>99+<')
    })
  })

  // ==================== Edge cases ====================
  describe('Edge Cases', () => {
    beforeEach(() => {
      initNotificationBadge()
    })

    it('should handle very large numbers', () => {
      const result = setBadgeCount(Number.MAX_SAFE_INTEGER)
      expect(result).toBe(Number.MAX_SAFE_INTEGER)
    })

    it('should handle rapid successive calls', () => {
      for (let i = 0; i < 100; i++) {
        incrementBadge()
      }
      expect(getBadgeCount()).toBe(100)
    })

    it('should handle undefined options in renderBadge', () => {
      const result = renderBadge(5, undefined)
      expect(result).toContain('5')
    })

    it('should handle empty options object in renderBadge', () => {
      const result = renderBadge(5, {})
      expect(result).toContain('5')
    })

    it('should handle subscriber errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Subscriber error')
      })
      const normalCallback = vi.fn()

      subscribeToBadge(errorCallback)
      subscribeToBadge(normalCallback)

      errorCallback.mockClear()
      normalCallback.mockClear()

      // Should not throw
      expect(() => setBadgeCount(5)).not.toThrow()

      // Normal callback should still be called
      expect(normalCallback).toHaveBeenCalledWith(5)
    })
  })
})
