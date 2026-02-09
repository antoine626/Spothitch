/**
 * Offline Indicator Service Tests
 * Tests for connection status display and pending actions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  initOfflineIndicator,
  destroyOfflineIndicator,
  isOnline,
  isOffline,
  onConnectionChange,
  renderOfflineBar,
  renderOnlineBar,
  getPendingActionsCount,
  addPendingAction,
  clearPendingActions,
  getPendingActions,
  retryConnection,
  getStatus,
  updateIndicator
} from '../src/services/offlineIndicator.js'

describe('Offline Indicator Service', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = ''
    document.body.style.paddingTop = '0'

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
      writable: true
    })

    // Clear localStorage
    localStorage.clear()

    // Destroy any existing instance
    destroyOfflineIndicator()
  })

  afterEach(() => {
    destroyOfflineIndicator()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('initOfflineIndicator', () => {
    it('should initialize successfully', () => {
      const result = initOfflineIndicator()
      expect(result).toBe(true)
    })

    it('should create indicator container element', () => {
      initOfflineIndicator()
      const container = document.getElementById('offline-indicator-container')
      expect(container).not.toBeNull()
    })

    it('should add ARIA attributes to container', () => {
      initOfflineIndicator()
      const container = document.getElementById('offline-indicator-container')
      expect(container.getAttribute('role')).toBe('region')
      expect(container.getAttribute('aria-label')).toBe('Indicateur de connexion')
    })

    it('should return true when already initialized', () => {
      initOfflineIndicator()
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation()
      const result = initOfflineIndicator()
      expect(result).toBe(true)
      expect(warnSpy).toHaveBeenCalledWith('[OfflineIndicator] Already initialized')
    })

    it('should show offline bar if initially offline', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      initOfflineIndicator()
      const container = document.getElementById('offline-indicator-container')
      expect(container.classList.contains('offline-indicator-visible')).toBe(true)
    })

    it('should set up online event listener', () => {
      const addEventSpy = vi.spyOn(window, 'addEventListener')
      initOfflineIndicator()
      expect(addEventSpy).toHaveBeenCalledWith('online', expect.any(Function))
    })

    it('should set up offline event listener', () => {
      const addEventSpy = vi.spyOn(window, 'addEventListener')
      initOfflineIndicator()
      expect(addEventSpy).toHaveBeenCalledWith('offline', expect.any(Function))
    })
  })

  describe('destroyOfflineIndicator', () => {
    it('should remove indicator element from DOM', () => {
      initOfflineIndicator()
      destroyOfflineIndicator()
      const container = document.getElementById('offline-indicator-container')
      expect(container).toBeNull()
    })

    it('should remove event listeners', () => {
      const removeEventSpy = vi.spyOn(window, 'removeEventListener')
      initOfflineIndicator()
      destroyOfflineIndicator()
      expect(removeEventSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(removeEventSpy).toHaveBeenCalledWith('offline', expect.any(Function))
    })

    it('should do nothing if not initialized', () => {
      // Should not throw
      expect(() => destroyOfflineIndicator()).not.toThrow()
    })

    it('should allow re-initialization after destroy', () => {
      initOfflineIndicator()
      destroyOfflineIndicator()
      const result = initOfflineIndicator()
      expect(result).toBe(true)
    })
  })

  describe('isOnline', () => {
    it('should return true when navigator.onLine is true', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
      expect(isOnline()).toBe(true)
    })

    it('should return false when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      expect(isOnline()).toBe(false)
    })
  })

  describe('isOffline', () => {
    it('should return false when online', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
      expect(isOffline()).toBe(false)
    })

    it('should return true when offline', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      expect(isOffline()).toBe(true)
    })
  })

  describe('onConnectionChange', () => {
    it('should register callback', () => {
      initOfflineIndicator()
      const callback = vi.fn()
      const unsubscribe = onConnectionChange(callback)
      expect(typeof unsubscribe).toBe('function')
    })

    it('should call callback when going offline', () => {
      initOfflineIndicator()
      const callback = vi.fn()
      onConnectionChange(callback)

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      window.dispatchEvent(new Event('offline'))

      expect(callback).toHaveBeenCalledWith(false)
    })

    it('should call callback when going online', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      initOfflineIndicator()

      const callback = vi.fn()
      onConnectionChange(callback)

      // Simulate going online
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
      window.dispatchEvent(new Event('online'))

      expect(callback).toHaveBeenCalledWith(true)
    })

    it('should allow unsubscribing', () => {
      initOfflineIndicator()
      const callback = vi.fn()
      const unsubscribe = onConnectionChange(callback)

      unsubscribe()

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      window.dispatchEvent(new Event('offline'))

      expect(callback).not.toHaveBeenCalled()
    })

    it('should handle multiple callbacks', () => {
      initOfflineIndicator()
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      onConnectionChange(callback1)
      onConnectionChange(callback2)

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      window.dispatchEvent(new Event('offline'))

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })

    it('should warn if callback is not a function', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation()
      const result = onConnectionChange('not a function')
      expect(warnSpy).toHaveBeenCalledWith('[OfflineIndicator] onConnectionChange requires a function')
      expect(typeof result).toBe('function') // Returns noop unsubscribe
    })
  })

  describe('renderOfflineBar', () => {
    it('should render offline bar HTML', () => {
      const html = renderOfflineBar()
      expect(html).toContain('offline-bar')
      expect(html).toContain('Mode hors-ligne')
    })

    it('should include offline icon', () => {
      const html = renderOfflineBar()
      expect(html).toContain('offline-bar-icon')
    })

    it('should include retry button', () => {
      const html = renderOfflineBar()
      expect(html).toContain('offline-bar-retry')
      expect(html).toContain('Retenter')
    })

    it('should show pending count when actions are pending', () => {
      const html = renderOfflineBar(5)
      expect(html).toContain('5 actions en attente')
    })

    it('should use singular for 1 action', () => {
      const html = renderOfflineBar(1)
      expect(html).toContain('1 action en attente')
    })

    it('should not show count when 0 pending', () => {
      const html = renderOfflineBar(0)
      expect(html).not.toContain('action en attente')
    })

    it('should have role="alert" for accessibility', () => {
      const html = renderOfflineBar()
      expect(html).toContain('role="alert"')
    })

    it('should have aria-live="assertive"', () => {
      const html = renderOfflineBar()
      expect(html).toContain('aria-live="assertive"')
    })

    it('should have data-testid for testing', () => {
      const html = renderOfflineBar()
      expect(html).toContain('data-testid="offline-bar"')
    })
  })

  describe('renderOnlineBar', () => {
    it('should render online bar HTML', () => {
      const html = renderOnlineBar()
      expect(html).toContain('online-bar')
      expect(html).toContain('Connexion retablie')
    })

    it('should include checkmark icon', () => {
      const html = renderOnlineBar()
      expect(html).toContain('online-bar-icon')
    })

    it('should have role="status"', () => {
      const html = renderOnlineBar()
      expect(html).toContain('role="status"')
    })

    it('should have aria-live="polite"', () => {
      const html = renderOnlineBar()
      expect(html).toContain('aria-live="polite"')
    })

    it('should have data-testid for testing', () => {
      const html = renderOnlineBar()
      expect(html).toContain('data-testid="online-bar"')
    })
  })

  describe('getPendingActionsCount', () => {
    it('should return 0 when no pending actions', () => {
      expect(getPendingActionsCount()).toBe(0)
    })

    it('should return count of pending actions', () => {
      addPendingAction({ type: 'TEST', data: {} })
      addPendingAction({ type: 'TEST2', data: {} })
      expect(getPendingActionsCount()).toBe(2)
    })
  })

  describe('addPendingAction', () => {
    it('should add action to queue', () => {
      addPendingAction({ type: 'ADD_SPOT', data: { name: 'Test' } })
      expect(getPendingActionsCount()).toBe(1)
    })

    it('should return new count', () => {
      const count = addPendingAction({ type: 'ADD_SPOT', data: {} })
      expect(count).toBe(1)
    })

    it('should add timestamp to action', () => {
      addPendingAction({ type: 'TEST', data: {} })
      const actions = getPendingActions()
      expect(actions[0].timestamp).toBeDefined()
      expect(typeof actions[0].timestamp).toBe('number')
    })

    it('should add unique id to action', () => {
      addPendingAction({ type: 'TEST', data: {} })
      const actions = getPendingActions()
      expect(actions[0].id).toBeDefined()
    })

    it('should warn if action is invalid', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation()
      addPendingAction(null)
      expect(warnSpy).toHaveBeenCalledWith('[OfflineIndicator] Invalid action object')
    })

    it('should preserve existing actions', () => {
      addPendingAction({ type: 'ACTION1', data: {} })
      addPendingAction({ type: 'ACTION2', data: {} })
      const actions = getPendingActions()
      expect(actions).toHaveLength(2)
      expect(actions[0].type).toBe('ACTION1')
      expect(actions[1].type).toBe('ACTION2')
    })
  })

  describe('clearPendingActions', () => {
    it('should clear all pending actions', () => {
      addPendingAction({ type: 'TEST', data: {} })
      addPendingAction({ type: 'TEST2', data: {} })
      clearPendingActions()
      expect(getPendingActionsCount()).toBe(0)
    })

    it('should return true on success', () => {
      addPendingAction({ type: 'TEST', data: {} })
      const result = clearPendingActions()
      expect(result).toBe(true)
    })
  })

  describe('getPendingActions', () => {
    it('should return empty array when no actions', () => {
      const actions = getPendingActions()
      expect(actions).toEqual([])
    })

    it('should return all pending actions', () => {
      addPendingAction({ type: 'ACTION1', data: { a: 1 } })
      addPendingAction({ type: 'ACTION2', data: { b: 2 } })
      const actions = getPendingActions()
      expect(actions).toHaveLength(2)
      expect(actions[0].type).toBe('ACTION1')
      expect(actions[1].type).toBe('ACTION2')
    })
  })

  describe('retryConnection', () => {
    it('should be a function', () => {
      expect(typeof retryConnection).toBe('function')
    })

    it('should return a promise', () => {
      const result = retryConnection()
      expect(result instanceof Promise).toBe(true)
    })

    it('should return true if navigator.onLine is true after fetch fails', async () => {
      // Mock fetch to reject
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })

      initOfflineIndicator()
      const result = await retryConnection()
      expect(result).toBe(true)
    })

    it('should return false if still offline', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })

      initOfflineIndicator()
      const result = await retryConnection()
      expect(result).toBe(false)
    })
  })

  describe('getStatus', () => {
    it('should return status object', () => {
      const status = getStatus()
      expect(status).toHaveProperty('isOnline')
      expect(status).toHaveProperty('pendingCount')
      expect(status).toHaveProperty('isInitialized')
    })

    it('should reflect current online status', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
      expect(getStatus().isOnline).toBe(true)

      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      expect(getStatus().isOnline).toBe(false)
    })

    it('should reflect initialization state', () => {
      expect(getStatus().isInitialized).toBe(false)
      initOfflineIndicator()
      expect(getStatus().isInitialized).toBe(true)
    })

    it('should reflect pending count', () => {
      expect(getStatus().pendingCount).toBe(0)
      addPendingAction({ type: 'TEST', data: {} })
      expect(getStatus().pendingCount).toBe(1)
    })
  })

  describe('updateIndicator', () => {
    it('should do nothing if not initialized', () => {
      // Should not throw
      expect(() => updateIndicator()).not.toThrow()
    })

    it('should show offline bar when offline', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      initOfflineIndicator()
      updateIndicator()
      const container = document.getElementById('offline-indicator-container')
      expect(container.innerHTML).toContain('offline-bar')
    })

    it('should hide bar when online', () => {
      initOfflineIndicator()
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
      updateIndicator()
      const container = document.getElementById('offline-indicator-container')
      expect(container.innerHTML).toBe('')
    })

    it('should update pending count in offline bar', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      initOfflineIndicator()
      addPendingAction({ type: 'TEST', data: {} })
      updateIndicator()
      const container = document.getElementById('offline-indicator-container')
      expect(container.innerHTML).toContain('1 action en attente')
    })
  })

  describe('Connection Events', () => {
    it('should update UI when going offline', () => {
      initOfflineIndicator()
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      window.dispatchEvent(new Event('offline'))

      const container = document.getElementById('offline-indicator-container')
      expect(container.classList.contains('offline-indicator-visible')).toBe(true)
    })

    it('should update UI when going online', () => {
      vi.useFakeTimers()
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      initOfflineIndicator()

      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
      window.dispatchEvent(new Event('online'))

      const container = document.getElementById('offline-indicator-container')
      expect(container.innerHTML).toContain('online-bar')
    })

    it('should add body padding when offline', () => {
      initOfflineIndicator()
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      window.dispatchEvent(new Event('offline'))

      expect(document.body.style.paddingTop).toBe('48px')
    })

    it('should remove body padding when online after timeout', () => {
      vi.useFakeTimers()
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      initOfflineIndicator()

      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
      window.dispatchEvent(new Event('online'))

      vi.advanceTimersByTime(3000)

      // Can be '0' or '0px' depending on browser
      expect(['0', '0px']).toContain(document.body.style.paddingTop)
    })
  })

  describe('Screen Reader Announcements', () => {
    it('should create aria-live region if not exists', () => {
      initOfflineIndicator()
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      window.dispatchEvent(new Event('offline'))

      const region = document.getElementById('aria-live-assertive')
      expect(region).not.toBeNull()
    })

    it('should announce offline status', async () => {
      vi.useFakeTimers()
      initOfflineIndicator()
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      window.dispatchEvent(new Event('offline'))

      vi.advanceTimersByTime(150)

      const region = document.getElementById('aria-live-assertive')
      expect(region.textContent).toBe('Mode hors-ligne active')
    })

    it('should announce online status', async () => {
      vi.useFakeTimers()
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      initOfflineIndicator()

      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
      window.dispatchEvent(new Event('online'))

      vi.advanceTimersByTime(150)

      const region = document.getElementById('aria-live-assertive')
      expect(region.textContent).toBe('Connexion retablie')
    })
  })

  describe('Window Global Handler', () => {
    it('should expose retryConnection on window', () => {
      expect(typeof window.retryConnection).toBe('function')
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid online/offline toggles', () => {
      initOfflineIndicator()

      // Go offline
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      window.dispatchEvent(new Event('offline'))

      // Go online immediately
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
      window.dispatchEvent(new Event('online'))

      // Go offline again
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      window.dispatchEvent(new Event('offline'))

      const container = document.getElementById('offline-indicator-container')
      expect(container.classList.contains('offline-indicator-visible')).toBe(true)
    })

    it('should not call callbacks when going online while already online', () => {
      initOfflineIndicator()
      const callback = vi.fn()
      onConnectionChange(callback)

      // Already online, dispatch online event
      window.dispatchEvent(new Event('online'))

      expect(callback).not.toHaveBeenCalled()
    })

    it('should not call callbacks when going offline while already offline', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      initOfflineIndicator()
      const callback = vi.fn()
      onConnectionChange(callback)

      // Already offline, dispatch offline event
      window.dispatchEvent(new Event('offline'))

      expect(callback).not.toHaveBeenCalled()
    })

    it('should handle callback errors gracefully', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation()
      initOfflineIndicator()

      const badCallback = () => { throw new Error('Callback error') }
      onConnectionChange(badCallback)

      // Should not throw
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      expect(() => window.dispatchEvent(new Event('offline'))).not.toThrow()
      expect(errorSpy).toHaveBeenCalled()
    })
  })
})
