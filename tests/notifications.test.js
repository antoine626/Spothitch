/**
 * Notifications Service Tests
 * Note: Some functions depend on internal module state (toastContainer)
 * that is initialized by initNotifications(). We test what we can without
 * fully initializing the notification system.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  announce,
  scheduleNotification,
} from '../src/services/notifications.js'

// Mock firebase imports
vi.mock('../src/services/firebase.js', () => ({
  requestNotificationPermission: vi.fn().mockResolvedValue('mock-token'),
  onForegroundMessage: vi.fn(),
}))

describe('Notifications Service', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="aria-live-polite" aria-live="polite"></div>
      <div id="aria-live-assertive" aria-live="assertive"></div>
    `
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('announce', () => {
    it('should update polite aria-live region', () => {
      announce('Hello', 'polite')
      vi.advanceTimersByTime(100)

      const region = document.getElementById('aria-live-polite')
      expect(region.textContent).toBe('Hello')
    })

    it('should update assertive aria-live region', () => {
      announce('Urgent!', 'assertive')
      vi.advanceTimersByTime(100)

      const region = document.getElementById('aria-live-assertive')
      expect(region.textContent).toBe('Urgent!')
    })

    it('should clear before setting message', () => {
      const region = document.getElementById('aria-live-polite')
      region.textContent = 'Old message'

      announce('New message', 'polite')

      expect(region.textContent).toBe('')

      vi.advanceTimersByTime(100)
      expect(region.textContent).toBe('New message')
    })

    it('should not throw if region does not exist', () => {
      document.body.innerHTML = ''
      expect(() => announce('Test', 'polite')).not.toThrow()
    })
  })

  describe('scheduleNotification', () => {
    it('should return null for past times', () => {
      const pastTime = Date.now() - 1000
      const result = scheduleNotification('Title', 'Body', pastTime)
      expect(result).toBeNull()
    })

    it('should return timeout ID for future times', () => {
      // Mock Notification to avoid actual calls
      const mockNotification = vi.fn()
      global.Notification = mockNotification
      global.Notification.permission = 'granted'

      const futureTime = Date.now() + 5000
      const timeoutId = scheduleNotification('Title', 'Body', futureTime)

      expect(timeoutId).not.toBeNull()
      expect(timeoutId).toBeDefined()

      // Cleanup
      clearTimeout(timeoutId)
    })

    it('should calculate correct delay', () => {
      const mockNotification = vi.fn()
      global.Notification = mockNotification
      global.Notification.permission = 'granted'

      const delay = 2000
      const futureTime = Date.now() + delay
      const timeoutId = scheduleNotification('Title', 'Body', futureTime)

      // Notification should not be called yet
      expect(mockNotification).not.toHaveBeenCalled()

      // Advance time
      vi.advanceTimersByTime(delay)

      // Now it should be called
      expect(mockNotification).toHaveBeenCalledWith(
        'Title',
        expect.objectContaining({ body: 'Body' })
      )

      clearTimeout(timeoutId)
    })
  })
})
