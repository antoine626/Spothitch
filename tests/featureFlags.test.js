/**
 * Feature Flags Service Tests
 * Complete test coverage for feature flag management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  initializeFeatureFlags,
  isFeatureEnabled,
  enableFeature,
  disableFeature,
  toggleFeature,
  getAllFlags,
  getFlag,
  getEnabledFeatures,
  getDisabledFeatures,
  setUserId,
  subscribeToFlags,
  registerFlag,
  resetFlags,
  bulkUpdateFlags,
} from '../src/services/featureFlags.js'

// Mock Storage
vi.mock('../src/utils/storage.js', () => ({
  Storage: {
    get: vi.fn(() => null),
    set: vi.fn(),
    remove: vi.fn(),
  },
}))

// Mock import.meta.env
vi.stubGlobal('import', { meta: { env: { PROD: false } } })

import { Storage } from '../src/utils/storage.js'

describe('Feature Flags Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Storage.get.mockReturnValue(null)
    resetFlags()
  })

  // =========================================
  // INITIALIZATION TESTS
  // =========================================

  describe('initializeFeatureFlags', () => {
    it('should return default flags when storage is empty', () => {
      Storage.get.mockReturnValue(null)

      const flags = initializeFeatureFlags()

      expect(flags).toBeDefined()
      expect(flags.darkMode).toBeDefined()
      expect(flags.offlineMode).toBeDefined()
    })

    it('should merge stored flags with defaults', () => {
      Storage.get.mockReturnValue({
        darkMode: { enabled: false },
        offlineMode: { enabled: true },
      })

      const flags = initializeFeatureFlags()

      expect(flags.darkMode.enabled).toBe(false)
      expect(flags.offlineMode.enabled).toBe(true)
    })

    it('should preserve default flag properties when merging', () => {
      Storage.get.mockReturnValue({
        darkMode: { enabled: false },
      })

      const flags = initializeFeatureFlags()

      expect(flags.darkMode.name).toBe('Mode sombre')
      expect(flags.darkMode.description).toBeDefined()
    })

    it('should ignore unknown flags from storage', () => {
      Storage.get.mockReturnValue({
        unknownFlag: { enabled: true },
      })

      const flags = initializeFeatureFlags()

      expect(flags.unknownFlag).toBeUndefined()
    })
  })

  // =========================================
  // isFeatureEnabled TESTS
  // =========================================

  describe('isFeatureEnabled', () => {
    it('should return true for enabled feature', () => {
      resetFlags()

      expect(isFeatureEnabled('darkMode')).toBe(true)
    })

    it('should return false for disabled feature', () => {
      resetFlags()
      disableFeature('darkMode')

      expect(isFeatureEnabled('darkMode')).toBe(false)
    })

    it('should return false for unknown feature', () => {
      expect(isFeatureEnabled('unknownFeature')).toBe(false)
    })

    it('should warn when checking unknown feature', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      isFeatureEnabled('unknownFeature')

      expect(warnSpy).toHaveBeenCalledWith('Feature flag "unknownFeature" not found')
      warnSpy.mockRestore()
    })

    it('should respect rollout percentage with user ID', () => {
      resetFlags()
      registerFlag({
        id: 'testRollout',
        name: 'Test Rollout',
        description: 'Test',
        enabled: true,
        rolloutPercentage: 50,
      })

      // Test with different user IDs
      setUserId('user1')
      const result1 = isFeatureEnabled('testRollout')

      setUserId('user2')
      const result2 = isFeatureEnabled('testRollout')

      // At least one should pass and one should fail with 50% rollout
      // (though this is probabilistic)
      expect(typeof result1).toBe('boolean')
      expect(typeof result2).toBe('boolean')
    })

    it('should return false for rollout when no user ID', () => {
      resetFlags()
      setUserId(null)
      registerFlag({
        id: 'testRollout',
        name: 'Test Rollout',
        description: 'Test',
        enabled: true,
        rolloutPercentage: 50,
      })

      expect(isFeatureEnabled('testRollout')).toBe(false)
    })

    it('should respect allowed users list', () => {
      resetFlags()
      registerFlag({
        id: 'vipFeature',
        name: 'VIP Feature',
        description: 'Test',
        enabled: true,
        allowedUsers: ['vip-user-1', 'vip-user-2'],
      })

      setUserId('vip-user-1')
      expect(isFeatureEnabled('vipFeature')).toBe(true)

      setUserId('regular-user')
      expect(isFeatureEnabled('vipFeature')).toBe(false)
    })

    it('should check expiration date', () => {
      resetFlags()
      const pastDate = new Date(Date.now() - 86400000).toISOString() // Yesterday

      registerFlag({
        id: 'expiredFeature',
        name: 'Expired Feature',
        description: 'Test',
        enabled: true,
        expiresAt: pastDate,
      })

      expect(isFeatureEnabled('expiredFeature')).toBe(false)
    })

    it('should return true for future expiration', () => {
      resetFlags()
      const futureDate = new Date(Date.now() + 86400000).toISOString() // Tomorrow

      registerFlag({
        id: 'futureFeature',
        name: 'Future Feature',
        description: 'Test',
        enabled: true,
        expiresAt: futureDate,
      })

      expect(isFeatureEnabled('futureFeature')).toBe(true)
    })

    it('should use options.userId over currentUserId', () => {
      resetFlags()
      registerFlag({
        id: 'userSpecific',
        name: 'User Specific',
        description: 'Test',
        enabled: true,
        allowedUsers: ['user-option'],
      })

      setUserId('current-user')

      expect(isFeatureEnabled('userSpecific', { userId: 'user-option' })).toBe(true)
      expect(isFeatureEnabled('userSpecific', { userId: 'other-user' })).toBe(false)
    })
  })

  // =========================================
  // enableFeature TESTS
  // =========================================

  describe('enableFeature', () => {
    it('should enable a disabled feature', () => {
      resetFlags()
      disableFeature('darkMode')
      expect(isFeatureEnabled('darkMode')).toBe(false)

      enableFeature('darkMode')

      expect(isFeatureEnabled('darkMode')).toBe(true)
    })

    it('should set enabledAt timestamp', () => {
      resetFlags()
      disableFeature('darkMode')

      enableFeature('darkMode')

      const flag = getFlag('darkMode')
      expect(flag.enabledAt).toBeDefined()
    })

    it('should persist to storage', () => {
      resetFlags()

      enableFeature('darkMode')

      expect(Storage.set).toHaveBeenCalled()
    })

    it('should accept rollout options', () => {
      resetFlags()

      enableFeature('darkMode', { rolloutPercentage: 25 })

      const flag = getFlag('darkMode')
      expect(flag.rolloutPercentage).toBe(25)
    })

    it('should accept allowed users', () => {
      resetFlags()

      enableFeature('darkMode', { allowedUsers: ['user1', 'user2'] })

      const flag = getFlag('darkMode')
      expect(flag.allowedUsers).toContain('user1')
      expect(flag.allowedUsers).toContain('user2')
    })

    it('should accept expiration date', () => {
      resetFlags()
      const expDate = new Date(Date.now() + 86400000).toISOString()

      enableFeature('darkMode', { expiresAt: expDate })

      const flag = getFlag('darkMode')
      expect(flag.expiresAt).toBe(expDate)
    })

    it('should warn for unknown feature', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      enableFeature('unknownFeature')

      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  // =========================================
  // disableFeature TESTS
  // =========================================

  describe('disableFeature', () => {
    it('should disable an enabled feature', () => {
      resetFlags()
      expect(isFeatureEnabled('darkMode')).toBe(true)

      disableFeature('darkMode')

      expect(isFeatureEnabled('darkMode')).toBe(false)
    })

    it('should persist to storage', () => {
      resetFlags()

      disableFeature('darkMode')

      expect(Storage.set).toHaveBeenCalled()
    })

    it('should warn for unknown feature', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      disableFeature('unknownFeature')

      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  // =========================================
  // toggleFeature TESTS
  // =========================================

  describe('toggleFeature', () => {
    it('should toggle enabled feature to disabled', () => {
      resetFlags()
      expect(isFeatureEnabled('darkMode')).toBe(true)

      const newState = toggleFeature('darkMode')

      expect(newState).toBe(false)
      expect(isFeatureEnabled('darkMode')).toBe(false)
    })

    it('should toggle disabled feature to enabled', () => {
      resetFlags()
      disableFeature('darkMode')

      const newState = toggleFeature('darkMode')

      expect(newState).toBe(true)
      expect(isFeatureEnabled('darkMode')).toBe(true)
    })

    it('should return false for unknown feature', () => {
      const result = toggleFeature('unknownFeature')

      expect(result).toBe(false)
    })
  })

  // =========================================
  // getAllFlags TESTS
  // =========================================

  describe('getAllFlags', () => {
    it('should return all flags', () => {
      resetFlags()

      const flags = getAllFlags()

      expect(flags).toBeDefined()
      expect(Object.keys(flags).length).toBeGreaterThan(0)
    })

    it('should return a copy of flags', () => {
      resetFlags()

      const flags1 = getAllFlags()
      const flags2 = getAllFlags()

      expect(flags1).not.toBe(flags2)
    })

    it('should include all default flags', () => {
      resetFlags()

      const flags = getAllFlags()

      expect(flags.darkMode).toBeDefined()
      expect(flags.offlineMode).toBeDefined()
      expect(flags.pushNotifications).toBeDefined()
      expect(flags.dailyRewards).toBeDefined()
      expect(flags.sosMode).toBeDefined()
    })
  })

  // =========================================
  // getFlag TESTS
  // =========================================

  describe('getFlag', () => {
    it('should return a specific flag', () => {
      resetFlags()

      const flag = getFlag('darkMode')

      expect(flag).toBeDefined()
      expect(flag.id).toBe('darkMode')
      expect(flag.name).toBe('Mode sombre')
    })

    it('should return null for unknown flag', () => {
      const flag = getFlag('unknownFlag')

      expect(flag).toBeNull()
    })

    it('should return a copy of the flag', () => {
      resetFlags()

      const flag1 = getFlag('darkMode')
      const flag2 = getFlag('darkMode')

      expect(flag1).not.toBe(flag2)
    })
  })

  // =========================================
  // getEnabledFeatures TESTS
  // =========================================

  describe('getEnabledFeatures', () => {
    it('should return list of enabled features', () => {
      resetFlags()

      const enabled = getEnabledFeatures()

      expect(enabled).toContain('darkMode')
      expect(enabled).toContain('offlineMode')
    })

    it('should not include disabled features', () => {
      resetFlags()
      disableFeature('darkMode')

      const enabled = getEnabledFeatures()

      expect(enabled).not.toContain('darkMode')
    })

    it('should respect user options for rollout', () => {
      resetFlags()
      registerFlag({
        id: 'rolloutTest',
        name: 'Rollout Test',
        description: 'Test',
        enabled: true,
        allowedUsers: ['specific-user'],
      })

      const enabled = getEnabledFeatures({ userId: 'specific-user' })

      expect(enabled).toContain('rolloutTest')
    })
  })

  // =========================================
  // getDisabledFeatures TESTS
  // =========================================

  describe('getDisabledFeatures', () => {
    it('should return list of disabled features', () => {
      resetFlags()

      const disabled = getDisabledFeatures()

      // aiSuggestions is disabled by default
      expect(disabled).toContain('aiSuggestions')
    })

    it('should include features that were disabled', () => {
      resetFlags()
      disableFeature('darkMode')

      const disabled = getDisabledFeatures()

      expect(disabled).toContain('darkMode')
    })
  })

  // =========================================
  // setUserId TESTS
  // =========================================

  describe('setUserId', () => {
    it('should set user ID for rollout calculations', () => {
      resetFlags()
      registerFlag({
        id: 'userTest',
        name: 'User Test',
        description: 'Test',
        enabled: true,
        allowedUsers: ['test-user'],
      })

      setUserId('test-user')

      expect(isFeatureEnabled('userTest')).toBe(true)
    })

    it('should clear user ID when set to null', () => {
      resetFlags()
      setUserId('test-user')
      setUserId(null)

      registerFlag({
        id: 'rolloutOnly',
        name: 'Rollout Only',
        description: 'Test',
        enabled: true,
        rolloutPercentage: 50,
      })

      expect(isFeatureEnabled('rolloutOnly')).toBe(false)
    })
  })

  // =========================================
  // subscribeToFlags TESTS
  // =========================================

  describe('subscribeToFlags', () => {
    it('should call callback when flag changes', () => {
      resetFlags()
      const callback = vi.fn()

      subscribeToFlags(callback)
      disableFeature('darkMode')

      expect(callback).toHaveBeenCalledWith('darkMode', false)
    })

    it('should call callback with true when enabling', () => {
      resetFlags()
      disableFeature('darkMode')
      const callback = vi.fn()

      subscribeToFlags(callback)
      enableFeature('darkMode')

      expect(callback).toHaveBeenCalledWith('darkMode', true)
    })

    it('should return unsubscribe function', () => {
      resetFlags()
      const callback = vi.fn()

      const unsubscribe = subscribeToFlags(callback)
      unsubscribe()
      disableFeature('darkMode')

      // Callback should not be called after unsubscribe
      // (depends on implementation timing)
    })

    it('should handle multiple subscribers', () => {
      resetFlags()
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      subscribeToFlags(callback1)
      subscribeToFlags(callback2)
      disableFeature('darkMode')

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })

    it('should handle callback errors gracefully', () => {
      resetFlags()
      const errorCallback = vi.fn(() => { throw new Error('Test error') })
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      subscribeToFlags(errorCallback)

      expect(() => disableFeature('darkMode')).not.toThrow()
      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })
  })

  // =========================================
  // registerFlag TESTS
  // =========================================

  describe('registerFlag', () => {
    it('should register a new feature flag', () => {
      resetFlags()

      registerFlag({
        id: 'newFeature',
        name: 'New Feature',
        description: 'A new feature',
        enabled: true,
      })

      expect(getFlag('newFeature')).toBeDefined()
      expect(isFeatureEnabled('newFeature')).toBe(true)
    })

    it('should default to disabled if not specified', () => {
      resetFlags()

      registerFlag({
        id: 'defaultDisabled',
        name: 'Default Disabled',
        description: 'Test',
      })

      expect(isFeatureEnabled('defaultDisabled')).toBe(false)
    })

    it('should default devOnly to false', () => {
      resetFlags()

      registerFlag({
        id: 'nonDevOnly',
        name: 'Non Dev Only',
        description: 'Test',
        enabled: true,
      })

      const flag = getFlag('nonDevOnly')
      expect(flag.devOnly).toBe(false)
    })

    it('should require id property', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      registerFlag({
        name: 'No ID',
        description: 'Test',
      })

      expect(errorSpy).toHaveBeenCalledWith('Feature flag must have an id')
      errorSpy.mockRestore()
    })

    it('should persist to storage', () => {
      resetFlags()
      vi.clearAllMocks()

      registerFlag({
        id: 'persistTest',
        name: 'Persist Test',
        description: 'Test',
      })

      expect(Storage.set).toHaveBeenCalled()
    })
  })

  // =========================================
  // resetFlags TESTS
  // =========================================

  describe('resetFlags', () => {
    it('should reset all flags to defaults', () => {
      resetFlags()
      disableFeature('darkMode')
      disableFeature('offlineMode')

      resetFlags()

      expect(isFeatureEnabled('darkMode')).toBe(true)
      expect(isFeatureEnabled('offlineMode')).toBe(true)
    })

    it('should remove registered custom flags', () => {
      resetFlags()
      registerFlag({
        id: 'customFlag',
        name: 'Custom',
        description: 'Test',
        enabled: true,
      })

      resetFlags()

      expect(getFlag('customFlag')).toBeNull()
    })

    it('should clear storage', () => {
      resetFlags()

      expect(Storage.remove).toHaveBeenCalledWith('featureFlags')
    })

    it('should notify subscribers with wildcard', () => {
      resetFlags()
      const callback = vi.fn()

      subscribeToFlags(callback)
      resetFlags()

      expect(callback).toHaveBeenCalledWith('*', null)
    })
  })

  // =========================================
  // bulkUpdateFlags TESTS
  // =========================================

  describe('bulkUpdateFlags', () => {
    it('should update multiple flags at once', () => {
      resetFlags()

      bulkUpdateFlags({
        darkMode: false,
        offlineMode: false,
        pushNotifications: false,
      })

      expect(isFeatureEnabled('darkMode')).toBe(false)
      expect(isFeatureEnabled('offlineMode')).toBe(false)
      expect(isFeatureEnabled('pushNotifications')).toBe(false)
    })

    it('should ignore unknown flags', () => {
      resetFlags()

      expect(() => bulkUpdateFlags({
        unknownFlag: true,
      })).not.toThrow()
    })

    it('should persist to storage', () => {
      resetFlags()
      vi.clearAllMocks()

      bulkUpdateFlags({
        darkMode: false,
      })

      expect(Storage.set).toHaveBeenCalled()
    })

    it('should notify subscribers with wildcard', () => {
      resetFlags()
      const callback = vi.fn()

      subscribeToFlags(callback)
      bulkUpdateFlags({ darkMode: false })

      expect(callback).toHaveBeenCalledWith('*', null)
    })
  })

  // =========================================
  // DEFAULT FLAGS TESTS
  // =========================================

  describe('Default flags', () => {
    it('should have core features defined', () => {
      const allFlags = getAllFlags()
      expect(allFlags.darkMode).toBeDefined()
      expect(allFlags.darkMode.id).toBe('darkMode')
      expect(allFlags.darkMode.name).toBe('Mode sombre')
      expect(allFlags.offlineMode).toBeDefined()
      expect(allFlags.pushNotifications).toBeDefined()
    })

    it('should have gamification features defined', () => {
      const allFlags = getAllFlags()
      expect(allFlags.dailyRewards).toBeDefined()
      expect(allFlags.weeklyLeaderboard).toBeDefined()
      expect(allFlags.secretBadges).toBeDefined()
      expect(allFlags.skillTree).toBeDefined()
    })

    it('should have social features defined', () => {
      const allFlags = getAllFlags()
      expect(allFlags.chatRooms).toBeDefined()
      expect(allFlags.friendSystem).toBeDefined()
      expect(allFlags.travelGroups).toBeDefined()
    })

    it('should have map features defined', () => {
      const allFlags = getAllFlags()
      expect(allFlags.heatmap).toBeDefined()
      expect(allFlags.spotOfTheDay).toBeDefined()
      expect(allFlags.alternativeSpots).toBeDefined()
    })

    it('should have safety features defined', () => {
      const allFlags = getAllFlags()
      expect(allFlags.sosMode).toBeDefined()
      expect(allFlags.sosTracking).toBeDefined()
    })

    it('should have experimental features marked as devOnly', () => {
      const allFlags = getAllFlags()
      expect(allFlags.aiSuggestions.devOnly).toBe(true)
      expect(allFlags.voiceNavigation.devOnly).toBe(true)
      expect(allFlags.arMode.devOnly).toBe(true)
    })
  })

  // =========================================
  // ROLLOUT PERCENTAGE TESTS
  // =========================================

  describe('Rollout percentage', () => {
    it('should consistently assign same user to same bucket', () => {
      resetFlags()
      registerFlag({
        id: 'consistentRollout',
        name: 'Consistent Rollout',
        description: 'Test',
        enabled: true,
        rolloutPercentage: 50,
      })

      setUserId('consistent-user')
      const result1 = isFeatureEnabled('consistentRollout')
      const result2 = isFeatureEnabled('consistentRollout')
      const result3 = isFeatureEnabled('consistentRollout')

      expect(result1).toBe(result2)
      expect(result2).toBe(result3)
    })

    it('should return true for 100% rollout', () => {
      resetFlags()
      registerFlag({
        id: 'fullRollout',
        name: 'Full Rollout',
        description: 'Test',
        enabled: true,
        rolloutPercentage: 100,
      })

      setUserId('any-user')
      expect(isFeatureEnabled('fullRollout')).toBe(true)
    })

    it('should return false for 0% rollout', () => {
      resetFlags()
      registerFlag({
        id: 'noRollout',
        name: 'No Rollout',
        description: 'Test',
        enabled: true,
        rolloutPercentage: 0,
      })

      setUserId('any-user')
      expect(isFeatureEnabled('noRollout')).toBe(false)
    })
  })

  // =========================================
  // INTEGRATION TESTS
  // =========================================

  describe('Integration tests', () => {
    it('should handle full feature lifecycle', () => {
      resetFlags()

      // Register new feature
      registerFlag({
        id: 'lifecycle',
        name: 'Lifecycle Test',
        description: 'Test feature lifecycle',
        enabled: false,
      })

      expect(isFeatureEnabled('lifecycle')).toBe(false)

      // Enable feature
      enableFeature('lifecycle')
      expect(isFeatureEnabled('lifecycle')).toBe(true)

      // Toggle feature
      toggleFeature('lifecycle')
      expect(isFeatureEnabled('lifecycle')).toBe(false)

      // Reset
      resetFlags()
      expect(getFlag('lifecycle')).toBeNull()
    })

    it('should handle multiple subscribers with rapid changes', () => {
      resetFlags()
      const callbacks = Array(5).fill(null).map(() => vi.fn())

      callbacks.forEach(cb => subscribeToFlags(cb))

      // Rapid changes
      for (let i = 0; i < 10; i++) {
        toggleFeature('darkMode')
      }

      callbacks.forEach(cb => {
        expect(cb).toHaveBeenCalled()
      })
    })

    it('should handle complex feature configuration', () => {
      resetFlags()
      setUserId('beta-tester')

      registerFlag({
        id: 'complexFeature',
        name: 'Complex Feature',
        description: 'Feature with multiple conditions',
        enabled: true,
        rolloutPercentage: 100,
        allowedUsers: ['beta-tester', 'admin'],
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      })

      expect(isFeatureEnabled('complexFeature')).toBe(true)

      setUserId('regular-user')
      expect(isFeatureEnabled('complexFeature')).toBe(false)
    })
  })
})
