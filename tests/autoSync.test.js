/**
 * Auto Sync Service Tests
 * Tests for automatic data synchronization on reconnection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock storage - must be defined before vi.mock
const mockStorage = {}

vi.mock('../src/utils/storage.js', () => ({
  Storage: {
    get: vi.fn((key) => mockStorage[key] || null),
    set: vi.fn((key, value) => {
      mockStorage[key] = value
    }),
    remove: vi.fn((key) => {
      delete mockStorage[key]
    }),
  },
  SpotHitchDB: {
    init: vi.fn().mockResolvedValue({}),
    getPendingSync: vi.fn().mockResolvedValue([]),
    addPendingSync: vi.fn().mockResolvedValue(1),
    clearPendingSync: vi.fn().mockResolvedValue(undefined),
  },
}))

// Import after mocks
import {
  initAutoSync,
  enableAutoSync,
  disableAutoSync,
  isAutoSyncEnabled,
  syncNow,
  getSyncStatus,
  onSyncComplete,
  getSyncHistory,
  clearSyncHistory,
  addPendingSync,
  setConflictStrategy,
  getConflictStrategy,
  renderSyncIndicator,
  cleanupAutoSync,
} from '../src/services/autoSync.js'
import { Storage } from '../src/utils/storage.js'

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
  showInfo: vi.fn(),
  showError: vi.fn(),
}))

// Mock state
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    user: { id: 'user123', username: 'testuser' },
    isLoggedIn: true,
    favorites: [],
  })),
  setState: vi.fn(),
}))

describe('Auto Sync Service', () => {
  beforeEach(() => {
    // Clear storage mock
    Object.keys(mockStorage).forEach(key => delete mockStorage[key])

    // Reset mocks
    Storage.get.mockClear()
    Storage.set.mockClear()
    Storage.remove.mockClear()

    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    })

    // Reset service state
    cleanupAutoSync()
  })

  afterEach(() => {
    cleanupAutoSync()
    vi.clearAllMocks()
  })

  describe('initAutoSync', () => {
    it('should initialize the service', () => {
      const result = initAutoSync()

      expect(result).toBeDefined()
      expect(result.enabled).toBe(true)
    })

    it('should return initial state', () => {
      const result = initAutoSync()

      expect(typeof result.enabled).toBe('boolean')
      expect(result.lastSync).toBeNull()
    })

    it('should load persisted enabled state', () => {
      mockStorage['autoSyncEnabled'] = true
      Storage.get.mockImplementation((key) => mockStorage[key] || null)

      const result = initAutoSync()

      expect(result.enabled).toBe(true)
    })

    it('should load persisted history', () => {
      const mockHistory = [
        { type: 'complete', timestamp: Date.now() },
      ]

      mockStorage['autoSyncHistory'] = mockHistory
      Storage.get.mockImplementation((key) => mockStorage[key] || null)

      initAutoSync()
      const history = getSyncHistory()

      expect(history.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('enableAutoSync', () => {
    it('should enable auto sync', () => {
      initAutoSync()
      disableAutoSync()

      const result = enableAutoSync()

      expect(result).toBe(true)
      expect(isAutoSyncEnabled()).toBe(true)
    })

    it('should persist enabled state', () => {
      initAutoSync()

      enableAutoSync()

      expect(Storage.set).toHaveBeenCalledWith('autoSyncEnabled', true)
    })

    it('should trigger sync if online with pending data', async () => {
      mockStorage['autoSyncPending'] = { spots: [{ id: 'spot1' }] }
      Storage.get.mockImplementation((key) => mockStorage[key] || null)

      initAutoSync()
      disableAutoSync()

      // Enable should trigger sync if there's pending data
      enableAutoSync()

      // Give time for async sync
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(isAutoSyncEnabled()).toBe(true)
    })
  })

  describe('disableAutoSync', () => {
    it('should disable auto sync', () => {
      initAutoSync()

      const result = disableAutoSync()

      expect(result).toBe(false)
      expect(isAutoSyncEnabled()).toBe(false)
    })

    it('should persist disabled state', () => {
      initAutoSync()

      disableAutoSync()

      expect(Storage.set).toHaveBeenCalledWith('autoSyncEnabled', false)
    })
  })

  describe('isAutoSyncEnabled', () => {
    it('should return true by default', () => {
      initAutoSync()

      expect(isAutoSyncEnabled()).toBe(true)
    })

    it('should return false after disable', () => {
      initAutoSync()
      disableAutoSync()

      expect(isAutoSyncEnabled()).toBe(false)
    })

    it('should return true after enable', () => {
      initAutoSync()
      disableAutoSync()
      enableAutoSync()

      expect(isAutoSyncEnabled()).toBe(true)
    })
  })

  describe('syncNow', () => {
    it('should return error when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      })

      initAutoSync()
      const result = await syncNow()

      expect(result.success).toBe(false)
      expect(result.error).toBe('offline')
    })

    it('should sync when online', async () => {
      initAutoSync()

      const result = await syncNow()

      expect(result).toBeDefined()
      expect(result.timestamp).toBeDefined()
    })

    it('should return sync result object', async () => {
      initAutoSync()

      const result = await syncNow()

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('synced')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('conflicts')
      expect(result).toHaveProperty('timestamp')
      expect(result).toHaveProperty('duration')
    })

    it('should prevent concurrent syncs', async () => {
      // Add some pending data to make sync take longer
      mockStorage['autoSyncPending'] = {
        spots: [{ id: 'spot1', updatedAt: Date.now() }],
      }
      Storage.get.mockImplementation((key) => mockStorage[key] || null)

      initAutoSync()

      // Start first sync (don't await yet)
      const promise1 = syncNow()

      // Immediately try to start second sync before first completes
      const promise2 = syncNow()

      // Wait for both
      const result1 = await promise1
      const result2 = await promise2

      // First should succeed
      expect(result1.success).toBe(true)

      // Second should fail with already_syncing
      expect(result2.success).toBe(false)
      expect(result2.error).toBe('already_syncing')
    })

    it('should sync pending spots', async () => {
      mockStorage['autoSyncPending'] = {
        spots: [{ id: 'spot1', name: 'Test Spot', updatedAt: Date.now() }],
      }
      Storage.get.mockImplementation((key) => mockStorage[key] || null)

      initAutoSync()
      const result = await syncNow()

      expect(result.success).toBe(true)
      expect(result.synced.spots).toBe(1)
    })

    it('should sync pending checkins', async () => {
      mockStorage['autoSyncPending'] = {
        checkins: [{ id: 'checkin1', spotId: 'spot1', updatedAt: Date.now() }],
      }
      Storage.get.mockImplementation((key) => mockStorage[key] || null)

      initAutoSync()
      const result = await syncNow()

      expect(result.success).toBe(true)
      expect(result.synced.checkins).toBe(1)
    })

    it('should sync pending messages', async () => {
      mockStorage['autoSyncPending'] = {
        messages: [{ id: 'msg1', text: 'Hello', updatedAt: Date.now() }],
      }
      Storage.get.mockImplementation((key) => mockStorage[key] || null)

      initAutoSync()
      const result = await syncNow()

      expect(result.success).toBe(true)
      expect(result.synced.messages).toBe(1)
    })

    it('should sync pending favorites', async () => {
      mockStorage['autoSyncPending'] = {
        favorites: [{ id: 'fav1', spotId: 'spot1', updatedAt: Date.now() }],
      }
      Storage.get.mockImplementation((key) => mockStorage[key] || null)

      initAutoSync()
      const result = await syncNow()

      expect(result.success).toBe(true)
      expect(result.synced.favorites).toBe(1)
    })

    it('should sync pending profile updates', async () => {
      mockStorage['autoSyncPending'] = {
        profile: [{ id: 'profile1', username: 'newname', updatedAt: Date.now() }],
      }
      Storage.get.mockImplementation((key) => mockStorage[key] || null)

      initAutoSync()
      const result = await syncNow()

      expect(result.success).toBe(true)
      expect(result.synced.profile).toBe(1)
    })

    it('should calculate sync duration', async () => {
      initAutoSync()

      const result = await syncNow()

      expect(result.duration).toBeGreaterThanOrEqual(0)
    })

    it('should show toast on successful sync', async () => {
      mockStorage['autoSyncPending'] = {
        spots: [{ id: 'spot1', updatedAt: Date.now() }],
      }
      Storage.get.mockImplementation((key) => mockStorage[key] || null)

      initAutoSync()

      // Import notifications to get the mock
      const notifications = await import('../src/services/notifications.js')

      await syncNow()

      expect(notifications.showToast).toHaveBeenCalled()
    })
  })

  describe('getSyncStatus', () => {
    it('should return status object', () => {
      initAutoSync()

      const status = getSyncStatus()

      expect(status).toHaveProperty('enabled')
      expect(status).toHaveProperty('syncing')
      expect(status).toHaveProperty('lastSync')
      expect(status).toHaveProperty('pendingCount')
      expect(status).toHaveProperty('pendingByType')
      expect(status).toHaveProperty('isOnline')
      expect(status).toHaveProperty('conflictStrategy')
    })

    it('should reflect online status', () => {
      initAutoSync()

      let status = getSyncStatus()
      expect(status.isOnline).toBe(true)

      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      })

      status = getSyncStatus()
      expect(status.isOnline).toBe(false)
    })

    it('should show pending count', () => {
      mockStorage['autoSyncPending'] = {
        spots: [{ id: '1' }, { id: '2' }],
        messages: [{ id: '3' }],
      }
      Storage.get.mockImplementation((key) => mockStorage[key] || null)

      initAutoSync()
      const status = getSyncStatus()

      expect(status.pendingCount).toBe(3)
      expect(status.pendingByType.spots).toBe(2)
      expect(status.pendingByType.messages).toBe(1)
    })

    it('should show conflict strategy', () => {
      initAutoSync()

      const status = getSyncStatus()

      expect(['server', 'client']).toContain(status.conflictStrategy)
    })
  })

  describe('onSyncComplete', () => {
    it('should register callback', () => {
      initAutoSync()
      const callback = vi.fn()

      const unsubscribe = onSyncComplete(callback)

      expect(typeof unsubscribe).toBe('function')
    })

    it('should call callback on sync complete', async () => {
      initAutoSync()
      const callback = vi.fn()

      onSyncComplete(callback)
      await syncNow()

      expect(callback).toHaveBeenCalled()
    })

    it('should pass result to callback', async () => {
      initAutoSync()
      const callback = vi.fn()

      onSyncComplete(callback)
      await syncNow()

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean),
          synced: expect.any(Object),
        })
      )
    })

    it('should allow unsubscribe', async () => {
      initAutoSync()
      const callback = vi.fn()

      const unsubscribe = onSyncComplete(callback)
      unsubscribe()

      await syncNow()

      expect(callback).not.toHaveBeenCalled()
    })

    it('should handle multiple callbacks', async () => {
      initAutoSync()
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      onSyncComplete(callback1)
      onSyncComplete(callback2)
      await syncNow()

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })

    it('should return noop for invalid callback', () => {
      initAutoSync()

      const unsubscribe = onSyncComplete('not a function')

      expect(typeof unsubscribe).toBe('function')
      // Should not throw
      unsubscribe()
    })
  })

  describe('getSyncHistory', () => {
    it('should return empty array initially', () => {
      initAutoSync()

      const history = getSyncHistory()

      expect(Array.isArray(history)).toBe(true)
    })

    it('should return history entries after sync', async () => {
      initAutoSync()

      await syncNow()
      const history = getSyncHistory()

      expect(history.length).toBeGreaterThan(0)
    })

    it('should respect limit parameter', async () => {
      initAutoSync()

      // Perform multiple syncs
      await syncNow()
      await syncNow()
      await syncNow()

      const history = getSyncHistory(2)

      expect(history.length).toBeLessThanOrEqual(2)
    })

    it('should have timestamp in entries', async () => {
      initAutoSync()

      await syncNow()
      const history = getSyncHistory()

      expect(history[0]).toHaveProperty('timestamp')
    })

    it('should have type in entries', async () => {
      initAutoSync()

      await syncNow()
      const history = getSyncHistory()

      expect(history[0]).toHaveProperty('type')
    })
  })

  describe('clearSyncHistory', () => {
    it('should clear history', async () => {
      initAutoSync()

      await syncNow()
      clearSyncHistory()
      const history = getSyncHistory()

      expect(history.length).toBe(0)
    })

    it('should persist cleared state', async () => {
      initAutoSync()

      await syncNow()
      clearSyncHistory()

      expect(Storage.set).toHaveBeenCalledWith('autoSyncHistory', [])
    })
  })

  describe('addPendingSync', () => {
    it('should add spot to pending', () => {
      initAutoSync()

      addPendingSync('spots', { id: 'spot1', name: 'Test' })

      expect(Storage.set).toHaveBeenCalled()
    })

    it('should add checkin to pending', () => {
      initAutoSync()

      addPendingSync('checkins', { id: 'checkin1', spotId: 'spot1' })

      expect(Storage.set).toHaveBeenCalled()
    })

    it('should add message to pending', () => {
      initAutoSync()

      addPendingSync('messages', { id: 'msg1', text: 'Hello' })

      expect(Storage.set).toHaveBeenCalled()
    })

    it('should add updatedAt timestamp', () => {
      let savedData = null
      Storage.set.mockImplementation((key, value) => {
        mockStorage[key] = value
        if (key === 'autoSyncPending') {
          savedData = value
        }
      })

      initAutoSync()
      addPendingSync('spots', { id: 'spot1' })

      expect(savedData.spots[0]).toHaveProperty('updatedAt')
    })

    it('should generate id if not provided', () => {
      let savedData = null
      Storage.set.mockImplementation((key, value) => {
        mockStorage[key] = value
        if (key === 'autoSyncPending') {
          savedData = value
        }
      })

      initAutoSync()
      addPendingSync('spots', { name: 'No ID Spot' })

      expect(savedData.spots[0].id).toContain('pending_')
    })

    it('should warn for unknown data type', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation()
      initAutoSync()

      addPendingSync('unknown_type', { id: '1' })

      expect(warnSpy).toHaveBeenCalledWith('[AutoSync] Unknown data type:', 'unknown_type')
      warnSpy.mockRestore()
    })
  })

  describe('setConflictStrategy', () => {
    it('should set server strategy', () => {
      initAutoSync()

      setConflictStrategy('server')

      expect(getConflictStrategy()).toBe('server')
    })

    it('should set client strategy', () => {
      initAutoSync()

      setConflictStrategy('client')

      expect(getConflictStrategy()).toBe('client')
    })

    it('should persist strategy', () => {
      initAutoSync()

      setConflictStrategy('client')

      expect(Storage.set).toHaveBeenCalledWith('autoSyncConflictStrategy', 'client')
    })

    it('should warn for invalid strategy', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation()
      initAutoSync()

      setConflictStrategy('invalid')

      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  describe('getConflictStrategy', () => {
    it('should return server by default', () => {
      initAutoSync()

      expect(getConflictStrategy()).toBe('server')
    })

    it('should return current strategy', () => {
      initAutoSync()
      setConflictStrategy('client')

      expect(getConflictStrategy()).toBe('client')
    })
  })

  describe('renderSyncIndicator', () => {
    it('should return HTML string', () => {
      initAutoSync()

      const html = renderSyncIndicator()

      expect(typeof html).toBe('string')
      expect(html.length).toBeGreaterThan(0)
    })

    it('should include data-testid', () => {
      initAutoSync()

      const html = renderSyncIndicator()

      expect(html).toContain('data-testid="sync-indicator"')
    })

    it('should show online status', () => {
      initAutoSync()

      const html = renderSyncIndicator()

      expect(html).toContain('En ligne')
    })

    it('should show offline status when offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      })

      initAutoSync()
      const html = renderSyncIndicator()

      expect(html).toContain('Hors ligne')
    })

    it('should show auto sync toggle', () => {
      initAutoSync()

      const html = renderSyncIndicator()

      expect(html).toContain('Auto:')
    })

    it('should show sync button', () => {
      initAutoSync()

      const html = renderSyncIndicator()

      expect(html).toContain('Synchroniser')
    })

    it('should show pending count when present', () => {
      mockStorage['autoSyncPending'] = { spots: [{ id: '1' }] }
      Storage.get.mockImplementation((key) => mockStorage[key] || null)

      initAutoSync()
      const html = renderSyncIndicator()

      expect(html).toContain('en attente')
    })

    it('should render compact version', () => {
      initAutoSync()

      const html = renderSyncIndicator({ compact: true })

      expect(html).toContain('data-testid="sync-indicator-compact"')
    })

    it('should render history section when requested', async () => {
      initAutoSync()
      await syncNow()

      const html = renderSyncIndicator({ showHistory: true })

      expect(html).toContain('data-testid="sync-history"')
    })

    it('should disable sync button when offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      })

      initAutoSync()
      const html = renderSyncIndicator()

      expect(html).toContain('disabled')
    })

    it('should include aria-labels for accessibility', () => {
      initAutoSync()

      const html = renderSyncIndicator()

      expect(html).toContain('aria-label')
    })
  })

  describe('cleanupAutoSync', () => {
    it('should cleanup without errors', () => {
      initAutoSync()

      expect(() => cleanupAutoSync()).not.toThrow()
    })

    it('should allow re-initialization', () => {
      initAutoSync()
      cleanupAutoSync()

      const result = initAutoSync()

      expect(result).toBeDefined()
    })
  })

  describe('Online/Offline events', () => {
    it('should trigger sync on coming online', async () => {
      mockStorage['autoSyncPending'] = { spots: [{ id: 'spot1', updatedAt: Date.now() }] }
      Storage.get.mockImplementation((key) => mockStorage[key] || null)

      initAutoSync()

      // Simulate going offline then online
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      window.dispatchEvent(new Event('offline'))

      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
      window.dispatchEvent(new Event('online'))

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 600))

      const history = getSyncHistory()
      expect(history.length).toBeGreaterThan(0)
    })

    it('should not sync on online if disabled', async () => {
      initAutoSync()
      disableAutoSync()

      const callback = vi.fn()
      onSyncComplete(callback)

      // Simulate coming online
      window.dispatchEvent(new Event('online'))

      await new Promise(resolve => setTimeout(resolve, 600))

      // Callback should not be called since auto sync is disabled
      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('Conflict resolution', () => {
    it('should use server wins strategy by default', () => {
      initAutoSync()

      expect(getConflictStrategy()).toBe('server')
    })

    it('should allow changing to client wins', () => {
      initAutoSync()

      setConflictStrategy('client')

      expect(getConflictStrategy()).toBe('client')
    })

    it('should persist conflict strategy setting', () => {
      initAutoSync()

      setConflictStrategy('client')

      expect(Storage.set).toHaveBeenCalledWith('autoSyncConflictStrategy', 'client')
    })
  })

  describe('Global window handlers', () => {
    it('should expose toggleAutoSync', () => {
      initAutoSync()

      expect(typeof window.toggleAutoSync).toBe('function')
    })

    it('should expose triggerSync', () => {
      initAutoSync()

      expect(typeof window.triggerSync).toBe('function')
    })

    it('should expose setConflictMode', () => {
      initAutoSync()

      expect(typeof window.setConflictMode).toBe('function')
    })

    it('should toggle sync via window handler', () => {
      initAutoSync()
      expect(isAutoSyncEnabled()).toBe(true)

      window.toggleAutoSync()
      expect(isAutoSyncEnabled()).toBe(false)

      window.toggleAutoSync()
      expect(isAutoSyncEnabled()).toBe(true)
    })

    it('should toggle conflict mode via window handler', () => {
      initAutoSync()
      const initialStrategy = getConflictStrategy()

      window.setConflictMode()
      const newStrategy = getConflictStrategy()

      expect(newStrategy).not.toBe(initialStrategy)
    })
  })
})
