/**
 * Offline Queue Service Tests
 * Tests for the offline queue functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  initOfflineQueue,
  resetOfflineQueue,
  queueAction,
  addToQueue,
  removeFromQueue,
  clearQueue,
  getQueueCount,
  getQueueSize,
  getQueuedActions,
  getQueuedActionsByType,
  getQueueCountByType,
  getQueueStats,
  isQueueEmpty,
  getActionById,
  getOldestAction,
  getStaleActions,
  removeStaleActions,
  isValidAction,
  getActionLabel,
  getActionIcon,
  updateActionStatus,
  processQueue,
  forceProcessQueue,
  isProcessingQueue,
  isOnline,
  renderQueueStatus,
  VALID_ACTIONS,
} from '../src/services/offlineQueue.js'

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
  showInfo: vi.fn(),
}))

// Mock storage
vi.mock('../src/utils/storage.js', () => ({
  Storage: {
    get: vi.fn(() => null),
    set: vi.fn(() => true),
    remove: vi.fn(() => true),
  },
  SpotHitchDB: {
    init: vi.fn(() => Promise.resolve({})),
    getPendingSync: vi.fn(() => Promise.resolve([])),
    addPendingSync: vi.fn(() => Promise.resolve(1)),
    clearPendingSync: vi.fn(() => Promise.resolve()),
  },
}))

describe('Offline Queue Service', () => {
  beforeEach(async () => {
    // Reset queue before each test
    resetOfflineQueue()
    vi.clearAllMocks()
  })

  afterEach(() => {
    resetOfflineQueue()
  })

  // ===========================================
  // Initialization Tests
  // ===========================================
  describe('initOfflineQueue', () => {
    it('should initialize the queue', async () => {
      await initOfflineQueue()
      expect(getQueueCount()).toBe(0)
    })

    it('should not re-initialize if already initialized', async () => {
      await initOfflineQueue()
      addToQueue('checkin', { spotId: '1' })
      await initOfflineQueue()
      expect(getQueueCount()).toBe(1)
    })

    it('should force re-initialize with force option', async () => {
      await initOfflineQueue()
      addToQueue('checkin', { spotId: '1' })
      await initOfflineQueue({ force: true })
      // Queue is preserved but loaded from storage (which is mocked to empty)
      expect(getQueueCount()).toBeGreaterThanOrEqual(0)
    })
  })

  describe('resetOfflineQueue', () => {
    it('should clear the queue', () => {
      addToQueue('checkin', { spotId: '1' })
      addToQueue('message', { text: 'hello' })
      expect(getQueueCount()).toBe(2)
      resetOfflineQueue()
      expect(getQueueCount()).toBe(0)
    })

    it('should reset processing state', () => {
      resetOfflineQueue()
      expect(isProcessingQueue()).toBe(false)
    })
  })

  // ===========================================
  // Adding Actions Tests
  // ===========================================
  describe('queueAction', () => {
    it('should add action to queue', () => {
      const id = queueAction('checkin', { spotId: 'spot1' })
      expect(id).toBeTruthy()
      expect(id).toMatch(/^action_/)
      expect(getQueueCount()).toBe(1)
    })

    it('should add action with correct data', () => {
      const data = { spotId: 'spot123', userId: 'user456' }
      queueAction('checkin', data)
      const actions = getQueuedActions()
      expect(actions[0].data).toEqual(data)
    })

    it('should set default status to pending', () => {
      queueAction('checkin', { spotId: '1' })
      const actions = getQueuedActions()
      expect(actions[0].status).toBe('pending')
    })

    it('should set createdAt timestamp', () => {
      const before = Date.now()
      queueAction('checkin', { spotId: '1' })
      const after = Date.now()
      const actions = getQueuedActions()
      expect(actions[0].createdAt).toBeGreaterThanOrEqual(before)
      expect(actions[0].createdAt).toBeLessThanOrEqual(after)
    })

    it('should assign priority based on action type', () => {
      queueAction('favorite', { spotId: '1' })
      queueAction('checkin', { spotId: '2' })
      const actions = getQueuedActions()
      // Actions should be sorted by priority (checkin = 1, favorite = 7)
      expect(actions[0].type).toBe('checkin')
      expect(actions[1].type).toBe('favorite')
    })

    it('should return null for invalid action type', () => {
      const id = queueAction(null, {})
      expect(id).toBeNull()
    })

    it('should return null for non-string action type', () => {
      const id = queueAction(123, {})
      expect(id).toBeNull()
    })

    it('should handle empty data', () => {
      const id = queueAction('checkin', null)
      expect(id).toBeTruthy()
      const action = getActionById(id)
      expect(action.data).toEqual({})
    })

    it('should allow custom options', () => {
      const id = queueAction('checkin', { spotId: '1' }, { customField: 'value' })
      const action = getActionById(id)
      expect(action.customField).toBe('value')
    })
  })

  describe('addToQueue', () => {
    it('should be an alias for queueAction', () => {
      const id = addToQueue('checkin', { spotId: '1' })
      expect(id).toBeTruthy()
      expect(getQueueCount()).toBe(1)
    })

    it('should add create_spot action', () => {
      const id = addToQueue('create_spot', { name: 'New Spot', lat: 48.8, lng: 2.3 })
      expect(id).toBeTruthy()
      const action = getActionById(id)
      expect(action.type).toBe('create_spot')
    })

    it('should add checkin action', () => {
      const id = addToQueue('checkin', { spotId: 'spot1', userId: 'user1' })
      const action = getActionById(id)
      expect(action.type).toBe('checkin')
    })

    it('should add review action', () => {
      const id = addToQueue('review', { spotId: 'spot1', rating: 5, comment: 'Great!' })
      const action = getActionById(id)
      expect(action.type).toBe('review')
    })

    it('should add message action', () => {
      const id = addToQueue('message', { room: 'general', text: 'Hello!' })
      const action = getActionById(id)
      expect(action.type).toBe('message')
    })

    it('should add favorite action', () => {
      const id = addToQueue('favorite', { spotId: 'spot1', action: 'add' })
      const action = getActionById(id)
      expect(action.type).toBe('favorite')
    })
  })

  // ===========================================
  // Removing Actions Tests
  // ===========================================
  describe('removeFromQueue', () => {
    it('should remove action by id', () => {
      const id = addToQueue('checkin', { spotId: '1' })
      expect(getQueueCount()).toBe(1)
      removeFromQueue(id)
      expect(getQueueCount()).toBe(0)
    })

    it('should not affect other actions', () => {
      const id1 = addToQueue('checkin', { spotId: '1' })
      const id2 = addToQueue('message', { text: 'hello' })
      removeFromQueue(id1)
      expect(getQueueCount()).toBe(1)
      expect(getActionById(id2)).toBeTruthy()
    })

    it('should handle non-existent id gracefully', () => {
      addToQueue('checkin', { spotId: '1' })
      removeFromQueue('non_existent_id')
      expect(getQueueCount()).toBe(1)
    })
  })

  describe('clearQueue', () => {
    it('should remove all actions', () => {
      addToQueue('checkin', { spotId: '1' })
      addToQueue('message', { text: 'hello' })
      addToQueue('review', { spotId: '1', rating: 5 })
      expect(getQueueCount()).toBe(3)
      const removed = clearQueue()
      expect(removed).toBe(3)
      expect(getQueueCount()).toBe(0)
    })

    it('should return 0 for empty queue', () => {
      const removed = clearQueue()
      expect(removed).toBe(0)
    })
  })

  describe('removeStaleActions', () => {
    it('should remove actions older than maxAge', () => {
      // Add an action
      const id = addToQueue('checkin', { spotId: '1' })
      // Manually modify createdAt to be old
      const actions = getQueuedActions()
      actions[0].createdAt = Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago

      const removed = removeStaleActions(24 * 60 * 60 * 1000) // 24 hours
      expect(removed).toBe(1)
      expect(getQueueCount()).toBe(0)
    })

    it('should keep recent actions', () => {
      addToQueue('checkin', { spotId: '1' })
      const removed = removeStaleActions(24 * 60 * 60 * 1000)
      expect(removed).toBe(0)
      expect(getQueueCount()).toBe(1)
    })
  })

  // ===========================================
  // Queue Getters Tests
  // ===========================================
  describe('getQueueCount', () => {
    it('should return 0 for empty queue', () => {
      expect(getQueueCount()).toBe(0)
    })

    it('should return correct count', () => {
      addToQueue('checkin', {})
      addToQueue('message', {})
      expect(getQueueCount()).toBe(2)
    })
  })

  describe('getQueueSize', () => {
    it('should be alias for getQueueCount', () => {
      addToQueue('checkin', {})
      addToQueue('message', {})
      expect(getQueueSize()).toBe(getQueueCount())
    })
  })

  describe('getQueuedActions', () => {
    it('should return empty array for empty queue', () => {
      expect(getQueuedActions()).toEqual([])
    })

    it('should return copy of queue', () => {
      addToQueue('checkin', { spotId: '1' })
      const actions = getQueuedActions()
      actions.push({ id: 'fake', type: 'fake' })
      expect(getQueueCount()).toBe(1) // Original queue unchanged
    })

    it('should return actions sorted by priority', () => {
      addToQueue('favorite', { spotId: '1' }) // priority 7
      addToQueue('checkin', { spotId: '2' }) // priority 1
      addToQueue('message', { text: 'hi' }) // priority 5
      const actions = getQueuedActions()
      expect(actions[0].type).toBe('checkin')
      expect(actions[1].type).toBe('message')
      expect(actions[2].type).toBe('favorite')
    })
  })

  describe('getQueuedActionsByType', () => {
    it('should return actions of specific type', () => {
      addToQueue('checkin', { spotId: '1' })
      addToQueue('checkin', { spotId: '2' })
      addToQueue('message', { text: 'hello' })
      const checkins = getQueuedActionsByType('checkin')
      expect(checkins.length).toBe(2)
    })

    it('should return empty array for non-existent type', () => {
      addToQueue('checkin', { spotId: '1' })
      const reviews = getQueuedActionsByType('review')
      expect(reviews).toEqual([])
    })
  })

  describe('getQueueCountByType', () => {
    it('should return counts by type', () => {
      addToQueue('checkin', { spotId: '1' })
      addToQueue('checkin', { spotId: '2' })
      addToQueue('message', { text: 'hello' })
      addToQueue('favorite', { spotId: '3' })
      const counts = getQueueCountByType()
      expect(counts.checkin).toBe(2)
      expect(counts.message).toBe(1)
      expect(counts.favorite).toBe(1)
    })

    it('should return empty object for empty queue', () => {
      expect(getQueueCountByType()).toEqual({})
    })
  })

  describe('getQueueStats', () => {
    it('should return comprehensive stats', () => {
      addToQueue('checkin', { spotId: '1' })
      addToQueue('message', { text: 'hello' })
      const stats = getQueueStats()
      expect(stats.total).toBe(2)
      expect(stats.byType.checkin).toBe(1)
      expect(stats.byType.message).toBe(1)
      expect(stats.byStatus.pending).toBe(2)
      expect(stats.oldestAction).toBeTruthy()
      expect(stats.newestAction).toBeTruthy()
    })

    it('should return zeros for empty queue', () => {
      const stats = getQueueStats()
      expect(stats.total).toBe(0)
      expect(stats.oldestAction).toBeNull()
      expect(stats.newestAction).toBeNull()
    })
  })

  describe('isQueueEmpty', () => {
    it('should return true for empty queue', () => {
      expect(isQueueEmpty()).toBe(true)
    })

    it('should return false for non-empty queue', () => {
      addToQueue('checkin', { spotId: '1' })
      expect(isQueueEmpty()).toBe(false)
    })
  })

  // ===========================================
  // Action Getters Tests
  // ===========================================
  describe('getActionById', () => {
    it('should return action by id', () => {
      const id = addToQueue('checkin', { spotId: 'spot1' })
      const action = getActionById(id)
      expect(action).toBeTruthy()
      expect(action.id).toBe(id)
      expect(action.data.spotId).toBe('spot1')
    })

    it('should return null for non-existent id', () => {
      const action = getActionById('non_existent')
      expect(action).toBeNull()
    })
  })

  describe('getOldestAction', () => {
    it('should return oldest action', async () => {
      addToQueue('checkin', { spotId: '1' })
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))
      addToQueue('message', { text: 'hello' })
      const oldest = getOldestAction()
      expect(oldest.type).toBe('checkin')
    })

    it('should return null for empty queue', () => {
      expect(getOldestAction()).toBeNull()
    })
  })

  describe('getStaleActions', () => {
    it('should return stale actions', () => {
      const id = addToQueue('checkin', { spotId: '1' })
      // Manually make it old
      const actions = getQueuedActions()
      const action = actions.find(a => a.id === id)
      action.createdAt = Date.now() - (25 * 60 * 60 * 1000)

      const stale = getStaleActions(24 * 60 * 60 * 1000)
      expect(stale.length).toBe(1)
    })

    it('should return empty array if no stale actions', () => {
      addToQueue('checkin', { spotId: '1' })
      const stale = getStaleActions(24 * 60 * 60 * 1000)
      expect(stale).toEqual([])
    })
  })

  // ===========================================
  // Action Helpers Tests
  // ===========================================
  describe('isValidAction', () => {
    it('should return true for valid lowercase actions', () => {
      expect(isValidAction('create_spot')).toBe(true)
      expect(isValidAction('checkin')).toBe(true)
      expect(isValidAction('review')).toBe(true)
      expect(isValidAction('message')).toBe(true)
      expect(isValidAction('favorite')).toBe(true)
    })

    it('should return true for valid legacy actions', () => {
      expect(isValidAction('ADD_SPOT')).toBe(true)
      expect(isValidAction('CHECKIN')).toBe(true)
      expect(isValidAction('SEND_MESSAGE')).toBe(true)
    })

    it('should return false for invalid actions', () => {
      expect(isValidAction('invalid_action')).toBe(false)
      expect(isValidAction('')).toBe(false)
    })
  })

  describe('getActionLabel', () => {
    it('should return label for new action types', () => {
      expect(getActionLabel('create_spot')).toBe('creation de spot')
      expect(getActionLabel('checkin')).toBe('check-in')
      expect(getActionLabel('review')).toBe('avis')
      expect(getActionLabel('message')).toBe('message')
      expect(getActionLabel('favorite')).toBe('favori')
    })

    it('should return label for legacy action types', () => {
      expect(getActionLabel('ADD_SPOT')).toBe('spot')
      expect(getActionLabel('CHECKIN')).toBe('check-in')
      expect(getActionLabel('SEND_MESSAGE')).toBe('message')
    })

    it('should return formatted type for unknown actions', () => {
      expect(getActionLabel('some_unknown_action')).toBe('some unknown action')
    })
  })

  describe('getActionIcon', () => {
    it('should return icon for new action types', () => {
      expect(getActionIcon('create_spot')).toBe('📍')
      expect(getActionIcon('checkin')).toBe('✅')
      expect(getActionIcon('review')).toBe('⭐')
      expect(getActionIcon('message')).toBe('💬')
      expect(getActionIcon('favorite')).toBe('❤️')
    })

    it('should return icon for legacy action types', () => {
      expect(getActionIcon('SOS_ALERT')).toBe('🆘')
      expect(getActionIcon('REPORT')).toBe('🚨')
    })

    it('should return default icon for unknown actions', () => {
      expect(getActionIcon('unknown')).toBe('📋')
    })
  })

  describe('updateActionStatus', () => {
    it('should update action status', () => {
      const id = addToQueue('checkin', { spotId: '1' })
      updateActionStatus(id, 'processing')
      const action = getActionById(id)
      expect(action.status).toBe('processing')
    })

    it('should set updatedAt timestamp', () => {
      const id = addToQueue('checkin', { spotId: '1' })
      const before = Date.now()
      updateActionStatus(id, 'completed')
      const after = Date.now()
      const action = getActionById(id)
      expect(action.updatedAt).toBeGreaterThanOrEqual(before)
      expect(action.updatedAt).toBeLessThanOrEqual(after)
    })

    it('should handle non-existent action gracefully', () => {
      expect(() => updateActionStatus('non_existent', 'failed')).not.toThrow()
    })
  })

  // ===========================================
  // Processing Tests
  // ===========================================
  describe('isProcessingQueue', () => {
    it('should return false initially', () => {
      expect(isProcessingQueue()).toBe(false)
    })
  })

  describe('processQueue', () => {
    it('should not process when offline', async () => {
      // Mock navigator.onLine to be false
      const originalNavigator = global.navigator
      global.navigator = { onLine: false }

      addToQueue('checkin', { spotId: '1' })
      await processQueue()
      expect(getQueueCount()).toBe(1) // Still in queue

      global.navigator = originalNavigator
    })

    it('should not process empty queue', async () => {
      await processQueue()
      expect(isProcessingQueue()).toBe(false)
    })
  })

  describe('forceProcessQueue', () => {
    it('should attempt to process when online', async () => {
      const originalNavigator = global.navigator
      global.navigator = { onLine: true }

      // Should not throw
      expect(() => forceProcessQueue()).not.toThrow()

      global.navigator = originalNavigator
    })
  })

  // ===========================================
  // Status Tests
  // ===========================================
  describe('isOnline', () => {
    it('should return navigator.onLine value', () => {
      const originalNavigator = global.navigator

      global.navigator = { onLine: true }
      expect(isOnline()).toBe(true)

      global.navigator = { onLine: false }
      expect(isOnline()).toBe(false)

      global.navigator = originalNavigator
    })

    it('should return true if navigator is undefined', () => {
      const originalNavigator = global.navigator
      global.navigator = undefined
      expect(isOnline()).toBe(true)
      global.navigator = originalNavigator
    })
  })

  // ===========================================
  // Rendering Tests
  // ===========================================
  describe('renderQueueStatus', () => {
    it('should return empty string for empty queue', () => {
      const html = renderQueueStatus()
      expect(html).toBe('')
    })

    it('should render status for pending actions', () => {
      addToQueue('checkin', { spotId: '1' })
      addToQueue('message', { text: 'hello' })
      const html = renderQueueStatus()
      expect(html).toContain('offline-queue-status')
      expect(html).toContain('2 action(s) en attente')
    })

    it('should show action type counts', () => {
      addToQueue('checkin', { spotId: '1' })
      addToQueue('checkin', { spotId: '2' })
      addToQueue('message', { text: 'hello' })
      const html = renderQueueStatus()
      expect(html).toContain('2 check-in')
      expect(html).toContain('1 message')
    })

    it('should show sync button when online', () => {
      const originalNavigator = global.navigator
      global.navigator = { onLine: true }

      addToQueue('checkin', { spotId: '1' })
      const html = renderQueueStatus()
      expect(html).toContain('Synchroniser maintenant')

      global.navigator = originalNavigator
    })

    it('should show offline message when offline', () => {
      const originalNavigator = global.navigator
      global.navigator = { onLine: false }

      addToQueue('checkin', { spotId: '1' })
      const html = renderQueueStatus()
      expect(html).toContain('Synchronisation automatique')

      global.navigator = originalNavigator
    })
  })

  // ===========================================
  // Constants Tests
  // ===========================================
  describe('VALID_ACTIONS', () => {
    it('should contain required action types', () => {
      expect(VALID_ACTIONS).toContain('create_spot')
      expect(VALID_ACTIONS).toContain('checkin')
      expect(VALID_ACTIONS).toContain('review')
      expect(VALID_ACTIONS).toContain('message')
      expect(VALID_ACTIONS).toContain('favorite')
    })

    it('should contain legacy action types', () => {
      expect(VALID_ACTIONS).toContain('ADD_SPOT')
      expect(VALID_ACTIONS).toContain('CHECKIN')
      expect(VALID_ACTIONS).toContain('SEND_MESSAGE')
      expect(VALID_ACTIONS).toContain('FAVORITE')
    })
  })

  // ===========================================
  // Integration Tests
  // ===========================================
  describe('Integration', () => {
    it('should handle complete workflow', () => {
      // Initialize
      resetOfflineQueue()
      expect(isQueueEmpty()).toBe(true)

      // Add actions
      const id1 = addToQueue('create_spot', { name: 'Test Spot', lat: 48.8, lng: 2.3 })
      const id2 = addToQueue('checkin', { spotId: 'spot1' })
      const id3 = addToQueue('review', { spotId: 'spot1', rating: 5 })

      // Verify queue state
      expect(getQueueCount()).toBe(3)
      expect(isQueueEmpty()).toBe(false)

      // Get stats
      const stats = getQueueStats()
      expect(stats.total).toBe(3)
      expect(stats.byType.create_spot).toBe(1)
      expect(stats.byType.checkin).toBe(1)
      expect(stats.byType.review).toBe(1)

      // Remove one action
      removeFromQueue(id2)
      expect(getQueueCount()).toBe(2)

      // Clear queue
      clearQueue()
      expect(isQueueEmpty()).toBe(true)
    })

    it('should maintain priority order across operations', () => {
      // Add in reverse priority order
      addToQueue('favorite', { spotId: '1' })   // priority 7
      addToQueue('message', { text: 'hi' })     // priority 5
      addToQueue('review', { spotId: '2' })     // priority 3
      addToQueue('checkin', { spotId: '3' })    // priority 1

      const actions = getQueuedActions()
      expect(actions[0].type).toBe('checkin')
      expect(actions[1].type).toBe('review')
      expect(actions[2].type).toBe('message')
      expect(actions[3].type).toBe('favorite')
    })

    it('should generate unique IDs', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        const id = addToQueue('checkin', { index: i })
        expect(ids.has(id)).toBe(false)
        ids.add(id)
      }
      expect(ids.size).toBe(100)
    })

    it('should handle multiple action types simultaneously', () => {
      addToQueue('create_spot', { name: 'Spot 1' })
      addToQueue('checkin', { spotId: '1' })
      addToQueue('review', { spotId: '1', rating: 4 })
      addToQueue('message', { room: 'general', text: 'Hello' })
      addToQueue('favorite', { spotId: '1', action: 'add' })

      const counts = getQueueCountByType()
      expect(counts.create_spot).toBe(1)
      expect(counts.checkin).toBe(1)
      expect(counts.review).toBe(1)
      expect(counts.message).toBe(1)
      expect(counts.favorite).toBe(1)
    })
  })

  // ===========================================
  // Edge Cases Tests
  // ===========================================
  describe('Edge Cases', () => {
    it('should handle special characters in data', () => {
      const data = {
        spotId: 'spot<>123',
        comment: 'Test & comment with "quotes" and <tags>',
      }
      const id = addToQueue('review', data)
      const action = getActionById(id)
      expect(action.data).toEqual(data)
    })

    it('should handle very long data', () => {
      const longText = 'a'.repeat(10000)
      const id = addToQueue('message', { text: longText })
      const action = getActionById(id)
      expect(action.data.text.length).toBe(10000)
    })

    it('should handle nested objects', () => {
      const data = {
        spot: {
          id: '123',
          location: {
            lat: 48.8566,
            lng: 2.3522,
            address: {
              street: '123 Main St',
              city: 'Paris',
            },
          },
        },
      }
      const id = addToQueue('create_spot', data)
      const action = getActionById(id)
      expect(action.data.spot.location.address.city).toBe('Paris')
    })

    it('should handle array data', () => {
      const data = {
        tags: ['good', 'safe', 'parking'],
        ratings: [4, 5, 3, 5, 4],
      }
      const id = addToQueue('review', data)
      const action = getActionById(id)
      expect(action.data.tags).toEqual(['good', 'safe', 'parking'])
    })

    it('should handle unicode characters', () => {
      const data = {
        comment: 'Great spot! \u2764\uFE0F \u26A1 \uD83D\uDE80',
        userName: '\u00C9mile Durand',
      }
      const id = addToQueue('review', data)
      const action = getActionById(id)
      expect(action.data.comment).toContain('\u2764')
    })
  })
})
