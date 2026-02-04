/**
 * New Device Notification Service Tests
 * Task #17 from SUIVI.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock the notifications module before importing the service
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
  sendLocalNotification: vi.fn(),
}))

// Mock the state store
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    username: 'TestUser',
    isLoggedIn: true,
  })),
}))

import {
  generateDeviceFingerprint,
  getDeviceInfo,
  checkNewDevice,
  registerDevice,
  getKnownDevices,
  removeDevice,
  removeAllOtherDevices,
  updateDeviceName,
  notifyNewDeviceLogin,
  getDeviceById,
  isDeviceKnown,
  getCurrentDevice,
  clearAllDevices,
  getDeviceStats,
  renderDeviceList,
} from '../src/services/newDeviceNotification.js'

import { showToast, sendLocalNotification } from '../src/services/notifications.js'
import { getState } from '../src/stores/state.js'

// Storage key for known devices (same as in service)
const KNOWN_DEVICES_KEY = 'spothitch_known_devices'

describe('New Device Notification Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.removeItem(KNOWN_DEVICES_KEY)

    // Clear notification mocks
    vi.mocked(showToast).mockClear()
    vi.mocked(sendLocalNotification).mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
    localStorage.removeItem(KNOWN_DEVICES_KEY)
  })

  // ==================== generateDeviceFingerprint ====================

  describe('generateDeviceFingerprint', () => {
    it('should return a non-empty string', () => {
      const fingerprint = generateDeviceFingerprint()
      expect(fingerprint).toBeDefined()
      expect(typeof fingerprint).toBe('string')
      expect(fingerprint.length).toBeGreaterThan(0)
    })

    it('should return consistent fingerprint for same environment', () => {
      const fp1 = generateDeviceFingerprint()
      const fp2 = generateDeviceFingerprint()
      expect(fp1).toBe(fp2)
    })

    it('should generate fingerprint based on browser characteristics', () => {
      const fingerprint = generateDeviceFingerprint()
      // Should be a base36 hash string
      expect(/^[a-z0-9]+$/i.test(fingerprint)).toBe(true)
    })
  })

  // ==================== getDeviceInfo ====================

  describe('getDeviceInfo', () => {
    it('should return device info object with required properties', () => {
      const info = getDeviceInfo()

      expect(info).toHaveProperty('id')
      expect(info).toHaveProperty('fingerprint')
      expect(info).toHaveProperty('name')
      expect(info).toHaveProperty('type')
      expect(info).toHaveProperty('os')
      expect(info).toHaveProperty('lastSeen')
      expect(info).toHaveProperty('isCurrent')
    })

    it('should have fingerprint matching id', () => {
      const info = getDeviceInfo()
      expect(info.id).toBe(info.fingerprint)
    })

    it('should mark device as current', () => {
      const info = getDeviceInfo()
      expect(info.isCurrent).toBe(true)
    })

    it('should include screen resolution', () => {
      const info = getDeviceInfo()
      expect(info.screenResolution).toMatch(/^\d+x\d+$/)
    })

    it('should have a valid lastSeen ISO timestamp', () => {
      const info = getDeviceInfo()
      expect(() => new Date(info.lastSeen)).not.toThrow()
    })

    it('should detect device type (mobile/desktop/tablet)', () => {
      const info = getDeviceInfo()
      expect(['mobile', 'desktop', 'tablet', 'unknown']).toContain(info.type)
    })
  })

  // ==================== checkNewDevice ====================

  describe('checkNewDevice', () => {
    it('should return isNew: true for unknown device', () => {
      const result = checkNewDevice()

      expect(result.isNew).toBe(true)
      expect(result.device).toBeDefined()
      expect(result.knownDevicesCount).toBe(0)
    })

    it('should return isNew: false for known device', () => {
      const deviceInfo = getDeviceInfo()
      const knownDevices = [{ fingerprint: deviceInfo.fingerprint, name: 'Test' }]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(knownDevices))

      const result = checkNewDevice()

      expect(result.isNew).toBe(false)
      expect(result.knownDevicesCount).toBe(1)
    })

    it('should include current device info in result', () => {
      const result = checkNewDevice()

      expect(result.device).toHaveProperty('fingerprint')
      expect(result.device).toHaveProperty('name')
      expect(result.device).toHaveProperty('type')
    })
  })

  // ==================== registerDevice ====================

  describe('registerDevice', () => {
    it('should register a new device', () => {
      const result = registerDevice({ silent: true })

      expect(result.success).toBe(true)
      expect(result.isNew).toBe(true)
      expect(result.device).toBeDefined()

      // Verify it was stored
      const stored = JSON.parse(localStorage.getItem(KNOWN_DEVICES_KEY))
      expect(stored).toHaveLength(1)
    })

    it('should update existing device on re-registration', () => {
      const deviceInfo = getDeviceInfo()
      const existingDevices = [{
        fingerprint: deviceInfo.fingerprint,
        name: 'Old Name',
        registeredAt: '2024-01-01T00:00:00.000Z',
        lastSeen: '2024-01-01T00:00:00.000Z',
      }]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(existingDevices))

      const result = registerDevice({ silent: true })

      expect(result.success).toBe(true)
      expect(result.isNew).toBe(false)
    })

    it('should allow custom device name', () => {
      const result = registerDevice({ customName: 'Mon PC', silent: true })

      expect(result.device.name).toBe('Mon PC')
    })

    it('should notify about new device when not silent and other devices exist', () => {
      const otherDevice = {
        fingerprint: 'other-device-fp',
        name: 'Other Device',
        registeredAt: '2024-01-01T00:00:00.000Z',
      }
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify([otherDevice]))

      registerDevice({ silent: false })

      expect(showToast).toHaveBeenCalled()
      expect(sendLocalNotification).toHaveBeenCalled()
    })

    it('should not notify when registering first device', () => {
      registerDevice({ silent: false })

      expect(showToast).not.toHaveBeenCalled()
    })

    it('should mark other devices as not current', () => {
      const otherDevice = {
        fingerprint: 'other-device-fp',
        name: 'Other Device',
        isCurrent: true,
      }
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify([otherDevice]))

      registerDevice({ silent: true })

      // Check that saved devices have correct isCurrent values
      const savedDevices = JSON.parse(localStorage.getItem(KNOWN_DEVICES_KEY))
      const otherSaved = savedDevices.find(d => d.fingerprint === 'other-device-fp')
      expect(otherSaved.isCurrent).toBe(false)
    })

    it('should return total device count', () => {
      const otherDevice = { fingerprint: 'other-device-fp', name: 'Other' }
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify([otherDevice]))

      const result = registerDevice({ silent: true })

      expect(result.totalDevices).toBe(2)
    })
  })

  // ==================== getKnownDevices ====================

  describe('getKnownDevices', () => {
    it('should return empty array when no devices stored', () => {
      const devices = getKnownDevices()

      expect(devices).toEqual([])
    })

    it('should return stored devices', () => {
      const storedDevices = [
        { fingerprint: 'fp1', name: 'Device 1' },
        { fingerprint: 'fp2', name: 'Device 2' },
      ]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(storedDevices))

      const devices = getKnownDevices()

      expect(devices).toHaveLength(2)
      expect(devices[0].name).toBe('Device 1')
    })

    it('should mark current device correctly', () => {
      const currentFp = generateDeviceFingerprint()
      const storedDevices = [
        { fingerprint: currentFp, name: 'Current' },
        { fingerprint: 'other-fp', name: 'Other' },
      ]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(storedDevices))

      const devices = getKnownDevices()

      const currentDevice = devices.find(d => d.fingerprint === currentFp)
      const otherDevice = devices.find(d => d.fingerprint === 'other-fp')

      expect(currentDevice.isCurrent).toBe(true)
      expect(otherDevice.isCurrent).toBe(false)
    })

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem(KNOWN_DEVICES_KEY, 'invalid json')

      const devices = getKnownDevices()

      expect(devices).toEqual([])
    })
  })

  // ==================== removeDevice ====================

  describe('removeDevice', () => {
    it('should remove device by ID', () => {
      const devices = [
        { fingerprint: 'fp1', id: 'fp1', name: 'Device 1' },
        { fingerprint: 'fp2', id: 'fp2', name: 'Device 2' },
      ]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      const result = removeDevice('fp1')

      expect(result.success).toBe(true)
      expect(result.removedDeviceId).toBe('fp1')
      expect(result.remainingDevices).toBe(1)
    })

    it('should not allow removing current device', () => {
      const currentFp = generateDeviceFingerprint()
      const devices = [{ fingerprint: currentFp, name: 'Current' }]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      const result = removeDevice(currentFp)

      expect(result.success).toBe(false)
      expect(result.error).toContain('current device')
    })

    it('should return error for non-existent device', () => {
      const devices = [{ fingerprint: 'fp1', name: 'Device 1' }]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      const result = removeDevice('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should return error when deviceId is empty', () => {
      const result = removeDevice('')

      expect(result.success).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should return error when deviceId is null', () => {
      const result = removeDevice(null)

      expect(result.success).toBe(false)
    })
  })

  // ==================== removeAllOtherDevices ====================

  describe('removeAllOtherDevices', () => {
    it('should remove all devices except current', () => {
      const currentFp = generateDeviceFingerprint()
      const devices = [
        { fingerprint: currentFp, name: 'Current' },
        { fingerprint: 'other1', name: 'Other 1' },
        { fingerprint: 'other2', name: 'Other 2' },
      ]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      const result = removeAllOtherDevices()

      expect(result.success).toBe(true)
      expect(result.removedCount).toBe(2)
      expect(result.remainingDevices).toBe(1)
    })

    it('should keep only current device', () => {
      const currentFp = generateDeviceFingerprint()
      const devices = [
        { fingerprint: currentFp, name: 'Current' },
        { fingerprint: 'other', name: 'Other' },
      ]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      removeAllOtherDevices()

      const savedDevices = JSON.parse(localStorage.getItem(KNOWN_DEVICES_KEY))
      expect(savedDevices).toHaveLength(1)
      expect(savedDevices[0].fingerprint).toBe(currentFp)
    })

    it('should handle when current device is not registered', () => {
      const devices = [{ fingerprint: 'other', name: 'Other' }]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      const result = removeAllOtherDevices()

      expect(result.success).toBe(true)
      expect(result.remainingDevices).toBe(0)
    })
  })

  // ==================== updateDeviceName ====================

  describe('updateDeviceName', () => {
    it('should update device name', () => {
      const devices = [{ fingerprint: 'fp1', id: 'fp1', name: 'Old Name' }]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      const result = updateDeviceName('fp1', 'New Name')

      expect(result.success).toBe(true)
      expect(result.device.name).toBe('New Name')
    })

    it('should return error for missing deviceId', () => {
      const result = updateDeviceName('', 'New Name')

      expect(result.success).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should return error for missing name', () => {
      const result = updateDeviceName('fp1', '')

      expect(result.success).toBe(false)
      expect(result.error).toContain('required')
    })

    it('should return error for non-existent device', () => {
      const devices = [{ fingerprint: 'fp1', name: 'Device' }]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      const result = updateDeviceName('non-existent', 'New Name')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })
  })

  // ==================== notifyNewDeviceLogin ====================

  describe('notifyNewDeviceLogin', () => {
    it('should show toast notification', () => {
      const device = { name: 'iPhone', os: 'iOS', fingerprint: 'test-fp' }

      notifyNewDeviceLogin(device)

      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining('iPhone'),
        'warning',
        6000
      )
    })

    it('should send local notification', () => {
      const device = { name: 'Chrome', os: 'Windows', fingerprint: 'test-fp' }

      notifyNewDeviceLogin(device)

      expect(sendLocalNotification).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Chrome'),
        expect.objectContaining({
          type: 'new_device_login',
          deviceId: 'test-fp',
        })
      )
    })

    it('should include device name and OS in notification', () => {
      const device = { name: 'Firefox', os: 'Linux', fingerprint: 'fp' }

      notifyNewDeviceLogin(device)

      expect(sendLocalNotification).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Linux'),
        expect.any(Object)
      )
    })
  })

  // ==================== getDeviceById ====================

  describe('getDeviceById', () => {
    it('should return device by fingerprint', () => {
      const devices = [
        { fingerprint: 'fp1', id: 'fp1', name: 'Device 1' },
        { fingerprint: 'fp2', id: 'fp2', name: 'Device 2' },
      ]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      const device = getDeviceById('fp1')

      expect(device).not.toBeNull()
      expect(device.name).toBe('Device 1')
    })

    it('should return null for non-existent device', () => {
      const devices = [{ fingerprint: 'fp1', name: 'Device 1' }]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      const device = getDeviceById('non-existent')

      expect(device).toBeNull()
    })

    it('should return null for empty ID', () => {
      const device = getDeviceById('')
      expect(device).toBeNull()
    })

    it('should return null for null ID', () => {
      const device = getDeviceById(null)
      expect(device).toBeNull()
    })
  })

  // ==================== isDeviceKnown ====================

  describe('isDeviceKnown', () => {
    it('should return true for known device', () => {
      const devices = [{ fingerprint: 'fp1', name: 'Device 1' }]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      expect(isDeviceKnown('fp1')).toBe(true)
    })

    it('should return false for unknown device', () => {
      const devices = [{ fingerprint: 'fp1', name: 'Device 1' }]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      expect(isDeviceKnown('unknown')).toBe(false)
    })

    it('should return false for empty list', () => {
      expect(isDeviceKnown('fp1')).toBe(false)
    })
  })

  // ==================== getCurrentDevice ====================

  describe('getCurrentDevice', () => {
    it('should return current device with isCurrent: true', () => {
      const device = getCurrentDevice()

      expect(device.isCurrent).toBe(true)
    })

    it('should return registered device if exists', () => {
      const currentFp = generateDeviceFingerprint()
      const devices = [{
        fingerprint: currentFp,
        name: 'My Registered Device',
        registeredAt: '2024-01-01T00:00:00.000Z',
      }]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      const device = getCurrentDevice()

      expect(device.name).toBe('My Registered Device')
    })

    it('should return unregistered device info if not registered', () => {
      const device = getCurrentDevice()

      expect(device).toHaveProperty('fingerprint')
      expect(device.isCurrent).toBe(true)
    })
  })

  // ==================== clearAllDevices ====================

  describe('clearAllDevices', () => {
    it('should clear all devices from storage', () => {
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify([{ fingerprint: 'fp1' }]))

      clearAllDevices()

      expect(localStorage.getItem(KNOWN_DEVICES_KEY)).toBeNull()
    })

    it('should return success status', () => {
      const result = clearAllDevices()

      expect(result.success).toBe(true)
    })
  })

  // ==================== getDeviceStats ====================

  describe('getDeviceStats', () => {
    it('should return correct device statistics', () => {
      const devices = [
        { fingerprint: 'fp1', type: 'mobile', registeredAt: '2024-01-01T00:00:00.000Z' },
        { fingerprint: 'fp2', type: 'desktop', registeredAt: '2024-02-01T00:00:00.000Z' },
        { fingerprint: 'fp3', type: 'desktop', registeredAt: '2024-03-01T00:00:00.000Z' },
      ]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      const stats = getDeviceStats()

      expect(stats.total).toBe(3)
      expect(stats.mobile).toBe(1)
      expect(stats.desktop).toBe(2)
    })

    it('should detect if current device is registered', () => {
      const currentFp = generateDeviceFingerprint()
      const devices = [{ fingerprint: currentFp, type: 'desktop', registeredAt: '2024-01-01' }]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      const stats = getDeviceStats()

      expect(stats.currentDeviceRegistered).toBe(true)
    })

    it('should return zeros for empty device list', () => {
      const stats = getDeviceStats()

      expect(stats.total).toBe(0)
      expect(stats.mobile).toBe(0)
      expect(stats.desktop).toBe(0)
      expect(stats.currentDeviceRegistered).toBe(false)
    })

    it('should track oldest and newest devices', () => {
      const devices = [
        { fingerprint: 'oldest', type: 'mobile', registeredAt: '2023-01-01T00:00:00.000Z' },
        { fingerprint: 'newest', type: 'desktop', registeredAt: '2024-06-01T00:00:00.000Z' },
      ]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      const stats = getDeviceStats()

      expect(stats.oldestDevice.fingerprint).toBe('oldest')
      expect(stats.newestDevice.fingerprint).toBe('newest')
    })

    it('should count unknown device types', () => {
      const devices = [{ fingerprint: 'fp1', type: 'unknown', registeredAt: '2024-01-01' }]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      const stats = getDeviceStats()

      expect(stats.unknown).toBe(1)
    })
  })

  // ==================== renderDeviceList ====================

  describe('renderDeviceList', () => {
    it('should render empty state when no devices', () => {
      const html = renderDeviceList()

      expect(html).toContain('Aucun appareil')
    })

    it('should render device list with items', () => {
      const devices = [
        { fingerprint: 'fp1', name: 'Mon PC', type: 'desktop', os: 'Windows', screenResolution: '1920x1080', lastSeen: new Date().toISOString() },
      ]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      const html = renderDeviceList()

      expect(html).toContain('Mon PC')
      expect(html).toContain('Windows')
      expect(html).toContain('1920x1080')
    })

    it('should mark current device in UI', () => {
      const currentFp = generateDeviceFingerprint()
      const devices = [
        { fingerprint: currentFp, name: 'Current', type: 'desktop', os: 'Test', screenResolution: '1920x1080', lastSeen: new Date().toISOString() },
      ]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      const html = renderDeviceList()

      expect(html).toContain('Cet appareil')
    })

    it('should include delete button for non-current devices', () => {
      const devices = [
        { fingerprint: 'other-fp', name: 'Other', type: 'mobile', os: 'Android', screenResolution: '1080x1920', lastSeen: new Date().toISOString() },
      ]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      const html = renderDeviceList()

      expect(html).toContain('removeKnownDevice')
      expect(html).toContain('Supprimer cet appareil')
    })

    it('should display correct icon for device type', () => {
      const devices = [
        { fingerprint: 'fp1', name: 'Mobile', type: 'mobile', os: 'iOS', screenResolution: '414x896', lastSeen: new Date().toISOString() },
      ]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      const html = renderDeviceList()

      // Mobile icon is a phone emoji
      expect(html).toContain('text-2xl')
    })
  })

  // ==================== Integration Tests ====================

  describe('Integration Tests', () => {
    it('should handle complete device registration flow', () => {
      // Initially no devices
      expect(checkNewDevice().isNew).toBe(true)

      // Register device
      const registerResult = registerDevice({ customName: 'Mon Appareil', silent: true })
      expect(registerResult.success).toBe(true)
      expect(registerResult.isNew).toBe(true)

      // Now device should be known
      expect(checkNewDevice().isNew).toBe(false)
    })

    it('should handle device removal and statistics update', () => {
      const currentFp = generateDeviceFingerprint()
      const devices = [
        { fingerprint: currentFp, type: 'desktop', name: 'Current', registeredAt: '2024-01-01' },
        { fingerprint: 'other', type: 'mobile', name: 'Other', registeredAt: '2024-02-01' },
      ]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      // Get initial stats
      const initialStats = getDeviceStats()
      expect(initialStats.total).toBe(2)

      // Remove other device
      const removeResult = removeDevice('other')
      expect(removeResult.success).toBe(true)
      expect(removeResult.remainingDevices).toBe(1)
    })
  })

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle corrupted localStorage data', () => {
      localStorage.setItem(KNOWN_DEVICES_KEY, 'not valid json')

      const devices = getKnownDevices()
      expect(devices).toEqual([])
    })

    it('should handle non-array stored data', () => {
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify({ not: 'array' }))

      const devices = getKnownDevices()
      expect(devices).toEqual([])
    })

    it('should limit stored devices to maximum', () => {
      // Create 15 devices (more than MAX_DEVICES which is 10)
      const manyDevices = Array.from({ length: 15 }, (_, i) => ({
        fingerprint: `fp${i}`,
        name: `Device ${i}`,
        lastSeen: new Date(Date.now() - i * 1000000).toISOString(),
        registeredAt: new Date(Date.now() - i * 1000000).toISOString(),
      }))
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(manyDevices))

      registerDevice({ silent: true })

      // Check that saved devices are limited
      const savedDevices = JSON.parse(localStorage.getItem(KNOWN_DEVICES_KEY))
      expect(savedDevices.length).toBeLessThanOrEqual(10)
    })

    it('should handle empty fingerprint in devices list', () => {
      const devices = [
        { fingerprint: '', name: 'Empty FP' },
        { fingerprint: 'valid', name: 'Valid' },
      ]
      localStorage.setItem(KNOWN_DEVICES_KEY, JSON.stringify(devices))

      const result = getKnownDevices()
      expect(result).toHaveLength(2)
    })
  })

  // ==================== Default Export ====================

  describe('Default Export', () => {
    it('should export all functions', async () => {
      const defaultExport = (await import('../src/services/newDeviceNotification.js')).default

      expect(defaultExport.generateDeviceFingerprint).toBeDefined()
      expect(defaultExport.getDeviceInfo).toBeDefined()
      expect(defaultExport.checkNewDevice).toBeDefined()
      expect(defaultExport.registerDevice).toBeDefined()
      expect(defaultExport.getKnownDevices).toBeDefined()
      expect(defaultExport.removeDevice).toBeDefined()
      expect(defaultExport.removeAllOtherDevices).toBeDefined()
      expect(defaultExport.updateDeviceName).toBeDefined()
      expect(defaultExport.notifyNewDeviceLogin).toBeDefined()
      expect(defaultExport.getDeviceById).toBeDefined()
      expect(defaultExport.isDeviceKnown).toBeDefined()
      expect(defaultExport.getCurrentDevice).toBeDefined()
      expect(defaultExport.clearAllDevices).toBeDefined()
      expect(defaultExport.getDeviceStats).toBeDefined()
      expect(defaultExport.renderDeviceList).toBeDefined()
    })
  })
})
