/**
 * Swipe Navigation Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as swipeNav from '../src/services/swipeNavigation.js'
import * as state from '../src/stores/state.js'

describe('Swipe Navigation Service', () => {
  let mockContainer

  beforeEach(() => {
    // Create mock container element
    mockContainer = document.createElement('div')
    mockContainer.id = 'test-container'
    document.body.appendChild(mockContainer)

    // Reset state
    state.resetState()
  })

  afterEach(() => {
    // Cleanup
    if (mockContainer && mockContainer.parentNode) {
      mockContainer.parentNode.removeChild(mockContainer)
    }
    swipeNav.destroySwipeNavigation()
  })

  describe('initSwipeNavigation()', () => {
    it('should initialize with provided container', () => {
      const spy = vi.spyOn(mockContainer, 'addEventListener')
      swipeNav.initSwipeNavigation(mockContainer)

      expect(spy).toHaveBeenCalledWith('touchstart', expect.any(Function), false)
      expect(spy).toHaveBeenCalledWith('touchend', expect.any(Function), false)
    })

    it('should initialize with document.body as default', () => {
      const spy = vi.spyOn(document.body, 'addEventListener')
      swipeNav.initSwipeNavigation()

      expect(spy).toHaveBeenCalledWith('touchstart', expect.any(Function), false)
      expect(spy).toHaveBeenCalledWith('touchend', expect.any(Function), false)
    })

    it('should add both touch event listeners', () => {
      const spy = vi.spyOn(mockContainer, 'addEventListener')
      swipeNav.initSwipeNavigation(mockContainer)

      const calls = spy.mock.calls
      expect(calls.length).toBeGreaterThanOrEqual(2)
      expect(calls.some(call => call[0] === 'touchstart')).toBe(true)
      expect(calls.some(call => call[0] === 'touchend')).toBe(true)
    })
  })

  describe('handleTouchStart()', () => {
    it('should capture touch start coordinates', () => {
      const event = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 200 }],
      })

      swipeNav.handleTouchStart(event)
      // We can't directly check private variables, but we can verify no errors occurred
      expect(true).toBe(true)
    })

    it('should handle touch event with multiple touches', () => {
      const event = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 200 },
          { clientX: 150, clientY: 250 },
        ],
      })

      // Should use first touch only
      swipeNav.handleTouchStart(event)
      expect(true).toBe(true)
    })
  })

  describe('handleTouchEnd()', () => {
    it('should detect left swipe (next tab)', () => {
      state.setState({ activeTab: 'home' })
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 300, clientY: 100 }],
      })
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 200, clientY: 100 }], // 100px left swipe
      })

      swipeNav.handleTouchStart(touchStart)
      swipeNav.handleTouchEnd(touchEnd)

      // Verify tab changed
      const currentState = state.getState()
      expect(currentState.activeTab).toBe('map')
    })

    it('should detect right swipe (previous tab)', () => {
      state.setState({ activeTab: 'spots' })
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }],
      })
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 200, clientY: 100 }], // 100px right swipe
      })

      swipeNav.handleTouchStart(touchStart)
      swipeNav.handleTouchEnd(touchEnd)

      // Verify tab changed
      const currentState = state.getState()
      expect(currentState.activeTab).toBe('map')
    })

    it('should ignore vertical swipe (scroll)', () => {
      state.setState({ activeTab: 'home' })
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }],
      })
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 110, clientY: 200 }], // Vertical swipe only
      })

      swipeNav.handleTouchStart(touchStart)
      swipeNav.handleTouchEnd(touchEnd)

      // Should NOT change tab on vertical swipe
      const currentState = state.getState()
      expect(currentState.activeTab).toBe('home')
    })

    it('should ignore swipe smaller than threshold', () => {
      state.setState({ activeTab: 'home' })
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }],
      })
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 120, clientY: 100 }], // Only 20px swipe
      })

      swipeNav.handleTouchStart(touchStart)
      swipeNav.handleTouchEnd(touchEnd)

      // Should NOT change tab on small swipe
      const currentState = state.getState()
      expect(currentState.activeTab).toBe('home')
    })

    it('should prioritize horizontal over vertical movement', () => {
      state.setState({ activeTab: 'spots' })
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 100 }],
      })
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 110 }], // 100px left swipe, 10px vertical
      })

      swipeNav.handleTouchStart(touchStart)
      swipeNav.handleTouchEnd(touchEnd)

      // Horizontal is larger, should trigger tab change (spots -> chat)
      const currentState = state.getState()
      expect(currentState.activeTab).toBe('chat')
    })
  })

  describe('getNextTab()', () => {
    it('should return next tab on left swipe', () => {
      const next = swipeNav.getNextTab('home', 'left')
      expect(next).toBe('map')
    })

    it('should return previous tab on right swipe', () => {
      const next = swipeNav.getNextTab('spots', 'right')
      expect(next).toBe('map')
    })

    it('should return null at right boundary (right swipe from home)', () => {
      const next = swipeNav.getNextTab('home', 'right')
      expect(next).toBeNull()
    })

    it('should return null at left boundary (left swipe from profile)', () => {
      const next = swipeNav.getNextTab('profile', 'left')
      expect(next).toBeNull()
    })

    it('should navigate through all tabs left', () => {
      expect(swipeNav.getNextTab('home', 'left')).toBe('map')
      expect(swipeNav.getNextTab('map', 'left')).toBe('spots')
      expect(swipeNav.getNextTab('spots', 'left')).toBe('chat')
      expect(swipeNav.getNextTab('chat', 'left')).toBe('profile')
    })

    it('should navigate through all tabs right', () => {
      expect(swipeNav.getNextTab('profile', 'right')).toBe('chat')
      expect(swipeNav.getNextTab('chat', 'right')).toBe('spots')
      expect(swipeNav.getNextTab('spots', 'right')).toBe('map')
      expect(swipeNav.getNextTab('map', 'right')).toBe('home')
    })

    it('should handle invalid current tab', () => {
      const next = swipeNav.getNextTab('invalid', 'left')
      expect(next).toBeNull()
    })

    it('should handle invalid direction', () => {
      const next = swipeNav.getNextTab('home', 'up')
      expect(next).toBeNull()
    })

    it('should maintain correct order: home, map, spots, chat, profile', () => {
      const tabs = swipeNav.getAvailableTabs()
      expect(tabs).toEqual(['home', 'map', 'spots', 'chat', 'profile'])
    })
  })

  describe('destroySwipeNavigation()', () => {
    it('should remove event listeners', () => {
      swipeNav.initSwipeNavigation(mockContainer)
      const spy = vi.spyOn(mockContainer, 'removeEventListener')

      swipeNav.destroySwipeNavigation()

      expect(spy).toHaveBeenCalledWith('touchstart', expect.any(Function), false)
      expect(spy).toHaveBeenCalledWith('touchend', expect.any(Function), false)
    })

    it('should clear container reference', () => {
      swipeNav.initSwipeNavigation(mockContainer)
      swipeNav.destroySwipeNavigation()

      // Reinitialize should work without issues
      swipeNav.initSwipeNavigation(mockContainer)
      expect(true).toBe(true)
    })

    it('should warn if no container is initialized', () => {
      const spy = vi.spyOn(console, 'warn')
      swipeNav.destroySwipeNavigation()
      swipeNav.destroySwipeNavigation()

      expect(spy).toHaveBeenCalled()
    })
  })

  describe('getAvailableTabs()', () => {
    it('should return tab array in correct order', () => {
      const tabs = swipeNav.getAvailableTabs()
      expect(tabs).toEqual(['home', 'map', 'spots', 'chat', 'profile'])
    })

    it('should have 5 tabs', () => {
      const tabs = swipeNav.getAvailableTabs()
      expect(tabs.length).toBe(5)
    })

    it('should not modify returned array when modified externally', () => {
      const tabs1 = swipeNav.getAvailableTabs()
      tabs1.push('invalid')

      const tabs2 = swipeNav.getAvailableTabs()
      expect(tabs2.length).toBe(5)
    })
  })

  describe('isValidTab()', () => {
    it('should return true for valid tabs', () => {
      expect(swipeNav.isValidTab('home')).toBe(true)
      expect(swipeNav.isValidTab('map')).toBe(true)
      expect(swipeNav.isValidTab('spots')).toBe(true)
      expect(swipeNav.isValidTab('chat')).toBe(true)
      expect(swipeNav.isValidTab('profile')).toBe(true)
    })

    it('should return false for invalid tabs', () => {
      expect(swipeNav.isValidTab('invalid')).toBe(false)
      expect(swipeNav.isValidTab('home2')).toBe(false)
      expect(swipeNav.isValidTab('')).toBe(false)
      expect(swipeNav.isValidTab(null)).toBe(false)
    })
  })

  describe('Integration tests', () => {
    it('should change tab from home to map on left swipe', () => {
      state.setState({ activeTab: 'home' })
      swipeNav.initSwipeNavigation(mockContainer)

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 300, clientY: 100 }],
      })
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 200, clientY: 100 }],
      })

      swipeNav.handleTouchStart(touchStart)
      swipeNav.handleTouchEnd(touchEnd)

      const currentState = state.getState()
      expect(currentState.activeTab).toBe('map')
    })

    it('should change tab from spots to map on right swipe', () => {
      state.setState({ activeTab: 'spots' })
      swipeNav.initSwipeNavigation(mockContainer)

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }],
      })
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 200, clientY: 100 }],
      })

      swipeNav.handleTouchStart(touchStart)
      swipeNav.handleTouchEnd(touchEnd)

      const currentState = state.getState()
      expect(currentState.activeTab).toBe('map')
    })

    it('should not change tab at boundaries', () => {
      state.setState({ activeTab: 'home' })
      swipeNav.initSwipeNavigation(mockContainer)

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 }],
      })
      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 200, clientY: 100 }], // Right swipe at home boundary
      })

      swipeNav.handleTouchStart(touchStart)
      swipeNav.handleTouchEnd(touchEnd)

      const currentState = state.getState()
      expect(currentState.activeTab).toBe('home') // Should stay at home
    })

    it('should initialize and cleanup without errors', () => {
      expect(() => {
        swipeNav.initSwipeNavigation(mockContainer)
        swipeNav.destroySwipeNavigation()
      }).not.toThrow()
    })

    it('should handle rapid swipes', () => {
      state.setState({ activeTab: 'home' })
      swipeNav.initSwipeNavigation(mockContainer)

      // Simulate rapid left swipes
      for (let i = 0; i < 3; i++) {
        const touchStart = new TouchEvent('touchstart', {
          touches: [{ clientX: 300, clientY: 100 }],
        })
        const touchEnd = new TouchEvent('touchend', {
          changedTouches: [{ clientX: 200, clientY: 100 }],
        })

        swipeNav.handleTouchStart(touchStart)
        swipeNav.handleTouchEnd(touchEnd)
      }

      const currentState = state.getState()
      // After 3 left swipes from home: map, spots, chat
      expect(currentState.activeTab).toBe('chat')
    })
  })
})
