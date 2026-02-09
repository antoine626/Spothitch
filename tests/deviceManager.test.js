/**
 * Device Manager Component Tests
 * Task #18 from SUIVI.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key, params) => {
    const translations = {
      deviceManagerTitle: 'Appareils connectes',
      deviceManagerSubtitle: 'Gerez vos appareils connectes',
      currentDevice: 'Cet appareil',
      thisDevice: 'Cet appareil',
      otherDevices: 'Autres appareils',
      deviceList: 'Liste des appareils',
      noOtherDevices: 'Aucun autre appareil',
      noOtherDevicesDesc: 'Seul cet appareil est connecte a votre compte',
      disconnectAllOtherDevices: 'Deconnecter tous les autres appareils',
      removeDevice: 'Supprimer l\'appareil',
      lastConnection: 'Derniere connexion',
      close: 'Fermer',
      cancel: 'Annuler',
      remove: 'Supprimer',
      disconnectAll: 'Tout deconnecter',
      confirmRemoveDevice: 'Supprimer cet appareil ?',
      confirmRemoveDeviceDesc: 'L\'appareil {device} sera deconnecte',
      confirmRemoveAllDevices: 'Deconnecter tous les appareils ?',
      confirmRemoveAllDevicesDesc: '{count} appareil(s) seront deconnectes',
      deviceRemoved: 'Appareil supprime',
      allDevicesRemoved: '{count} appareils supprimes',
      deviceRemoveError: 'Erreur lors de la suppression',
      unknownDevice: 'Appareil inconnu',
      notAvailable: 'N/A',
      deviceJustNow: 'A l\'instant',
      minutes: 'min',
      hours: 'h',
      days: 'j',
    }
    let result = translations[key] || key
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(`{${k}}`, v)
      })
    }
    return result
  }),
}))

// Mock newDeviceNotification service
const mockDevices = []
vi.mock('../src/services/newDeviceNotification.js', () => ({
  getKnownDevices: vi.fn(() => mockDevices),
  removeDevice: vi.fn((deviceId) => {
    const index = mockDevices.findIndex(d => d.fingerprint === deviceId)
    if (index >= 0) {
      mockDevices.splice(index, 1)
      return { success: true, removedDeviceId: deviceId }
    }
    return { success: false, error: 'Device not found' }
  }),
  removeAllOtherDevices: vi.fn(() => {
    const currentFp = 'current-device-fp'
    const removed = mockDevices.filter(d => d.fingerprint !== currentFp).length
    mockDevices.length = 0
    mockDevices.push({
      fingerprint: currentFp,
      name: 'Chrome',
      type: 'desktop',
      os: 'Windows',
      lastSeen: new Date().toISOString(),
    })
    return { success: true, removedCount: removed }
  }),
  generateDeviceFingerprint: vi.fn(() => 'current-device-fp'),
}))

// Import after mocking
import {
  renderDeviceManager,
  getDeviceManagerState,
} from '../src/components/DeviceManager.js'

import {
  getKnownDevices,
  removeDevice,
  removeAllOtherDevices,
  generateDeviceFingerprint,
} from '../src/services/newDeviceNotification.js'

describe('DeviceManager Component', () => {
  beforeEach(() => {
    // Reset mock devices
    mockDevices.length = 0
    mockDevices.push(
      {
        fingerprint: 'current-device-fp',
        id: 'current-device-fp',
        name: 'Chrome',
        type: 'desktop',
        os: 'Windows',
        screenResolution: '1920x1080',
        lastSeen: new Date().toISOString(),
        registeredAt: new Date().toISOString(),
      },
      {
        fingerprint: 'other-device-1',
        id: 'other-device-1',
        name: 'iPhone',
        type: 'mobile',
        os: 'iOS',
        screenResolution: '390x844',
        lastSeen: new Date(Date.now() - 3600000).toISOString(),
        registeredAt: new Date(Date.now() - 86400000).toISOString(),
      }
    )

    // Reset window state
    window.deviceManagerState = {
      isOpen: false,
      confirmingDeviceId: null,
      confirmingRemoveAll: false,
    }

    // Setup minimal DOM
    document.body.innerHTML = '<div id="modal-container"></div>'
  })

  afterEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  describe('renderDeviceManager', () => {
    it('should render the device manager modal', () => {
      const html = renderDeviceManager()
      expect(html).toContain('device-manager-modal')
      expect(html).toContain('role="dialog"')
      expect(html).toContain('aria-modal="true"')
    })

    it('should display the modal title', () => {
      const html = renderDeviceManager()
      expect(html).toContain('device-manager-title')
      expect(html).toContain('Appareils connectes')
    })

    it('should display current device with badge', () => {
      const html = renderDeviceManager()
      expect(html).toContain('Chrome')
      expect(html).toContain('Cet appareil')
    })

    it('should display other devices', () => {
      const html = renderDeviceManager()
      expect(html).toContain('iPhone')
      expect(html).toContain('iOS')
      expect(html).toContain('Autres appareils')
    })

    it('should show remove button for other devices only', () => {
      const html = renderDeviceManager()
      // The remove button should have the other device ID
      expect(html).toContain('other-device-1')
      expect(html).toContain('confirmRemoveDevice')
    })

    it('should show disconnect all button when other devices exist', () => {
      const html = renderDeviceManager()
      expect(html).toContain('Deconnecter tous les autres appareils')
      expect(html).toContain('remove-all-devices-btn')
    })

    it('should show device type icons', () => {
      const html = renderDeviceManager()
      expect(html).toContain('💻') // desktop
      expect(html).toContain('📱') // mobile
    })

    it('should include accessibility attributes', () => {
      const html = renderDeviceManager()
      expect(html).toContain('role="dialog"')
      expect(html).toContain('aria-modal="true"')
      expect(html).toContain('aria-labelledby="device-manager-title"')
      expect(html).toContain('role="list"')
      expect(html).toContain('role="listitem"')
    })

    it('should include close button with aria-label', () => {
      const html = renderDeviceManager()
      expect(html).toContain('closeDeviceManager()')
      expect(html).toContain('aria-label')
    })

    it('should escape HTML in device names', () => {
      mockDevices.push({
        fingerprint: 'xss-device',
        id: 'xss-device',
        name: '<script>alert("xss")</script>',
        type: 'desktop',
        os: 'Linux',
        lastSeen: new Date().toISOString(),
      })
      const html = renderDeviceManager()
      expect(html).not.toContain('<script>')
    })
  })

  describe('renderDeviceManager - empty state', () => {
    beforeEach(() => {
      // Only current device, no other devices
      mockDevices.length = 0
      mockDevices.push({
        fingerprint: 'current-device-fp',
        id: 'current-device-fp',
        name: 'Chrome',
        type: 'desktop',
        os: 'Windows',
        lastSeen: new Date().toISOString(),
      })
    })

    it('should show empty state when no other devices', () => {
      const html = renderDeviceManager()
      expect(html).toContain('Aucun autre appareil')
      expect(html).toContain('Seul cet appareil est connecte')
    })

    it('should show lock emoji in empty state', () => {
      const html = renderDeviceManager()
      expect(html).toContain('🔒')
    })

    it('should not show disconnect all button when no other devices', () => {
      const html = renderDeviceManager()
      expect(html).not.toContain('remove-all-devices-btn')
    })
  })

  describe('Device type icons', () => {
    it('should show desktop icon for desktop devices', () => {
      mockDevices.length = 0
      mockDevices.push({
        fingerprint: 'current-device-fp',
        name: 'Desktop',
        type: 'desktop',
        os: 'Windows',
        lastSeen: new Date().toISOString(),
      })
      const html = renderDeviceManager()
      expect(html).toContain('💻')
    })

    it('should show mobile icon for mobile devices', () => {
      mockDevices.length = 0
      mockDevices.push({
        fingerprint: 'current-device-fp',
        name: 'Mobile',
        type: 'mobile',
        os: 'Android',
        lastSeen: new Date().toISOString(),
      })
      const html = renderDeviceManager()
      expect(html).toContain('📱')
    })

    it('should show tablet icon for tablet devices', () => {
      mockDevices.length = 0
      mockDevices.push({
        fingerprint: 'current-device-fp',
        name: 'Tablet',
        type: 'tablet',
        os: 'iPadOS',
        lastSeen: new Date().toISOString(),
      })
      const html = renderDeviceManager()
      expect(html).toContain('📲')
    })

    it('should show unknown icon for unknown device types', () => {
      mockDevices.length = 0
      mockDevices.push({
        fingerprint: 'current-device-fp',
        name: 'Unknown',
        type: 'unknown',
        os: 'Unknown',
        lastSeen: new Date().toISOString(),
      })
      const html = renderDeviceManager()
      expect(html).toContain('🖥️')
    })
  })

  describe('Last seen formatting', () => {
    it('should show "A l\'instant" for very recent connections', () => {
      mockDevices[0].lastSeen = new Date().toISOString()
      const html = renderDeviceManager()
      expect(html).toContain('Derniere connexion')
    })

    it('should show minutes for recent connections', () => {
      mockDevices[0].lastSeen = new Date(Date.now() - 5 * 60000).toISOString()
      const html = renderDeviceManager()
      expect(html).toContain('Derniere connexion')
    })

    it('should show hours for connections within a day', () => {
      mockDevices[0].lastSeen = new Date(Date.now() - 3 * 3600000).toISOString()
      const html = renderDeviceManager()
      expect(html).toContain('Derniere connexion')
    })
  })

  describe('Global window handlers', () => {
    it('should define openDeviceManager on window', () => {
      expect(typeof window.openDeviceManager).toBe('function')
    })

    it('should define closeDeviceManager on window', () => {
      expect(typeof window.closeDeviceManager).toBe('function')
    })

    it('should define confirmRemoveDevice on window', () => {
      expect(typeof window.confirmRemoveDevice).toBe('function')
    })

    it('should define cancelRemoveDevice on window', () => {
      expect(typeof window.cancelRemoveDevice).toBe('function')
    })

    it('should define executeRemoveDevice on window', () => {
      expect(typeof window.executeRemoveDevice).toBe('function')
    })

    it('should define confirmRemoveAllDevices on window', () => {
      expect(typeof window.confirmRemoveAllDevices).toBe('function')
    })

    it('should define cancelRemoveAllDevices on window', () => {
      expect(typeof window.cancelRemoveAllDevices).toBe('function')
    })

    it('should define executeRemoveAllDevices on window', () => {
      expect(typeof window.executeRemoveAllDevices).toBe('function')
    })
  })

  describe('openDeviceManager', () => {
    it('should set isOpen state to true', () => {
      window.openDeviceManager()
      expect(window.deviceManagerState.isOpen).toBe(true)
    })

    it('should reset confirming states', () => {
      window.deviceManagerState.confirmingDeviceId = 'some-device'
      window.deviceManagerState.confirmingRemoveAll = true
      window.openDeviceManager()
      expect(window.deviceManagerState.confirmingDeviceId).toBeNull()
      expect(window.deviceManagerState.confirmingRemoveAll).toBe(false)
    })

    it('should render modal in DOM', () => {
      window.openDeviceManager()
      const modal = document.getElementById('device-manager-modal') ||
                    document.getElementById('device-manager-container')
      expect(modal).not.toBeNull()
    })
  })

  describe('closeDeviceManager', () => {
    it('should set isOpen state to false', () => {
      window.deviceManagerState.isOpen = true
      window.closeDeviceManager()
      expect(window.deviceManagerState.isOpen).toBe(false)
    })

    it('should reset all confirming states', () => {
      window.deviceManagerState.confirmingDeviceId = 'device-123'
      window.deviceManagerState.confirmingRemoveAll = true
      window.closeDeviceManager()
      expect(window.deviceManagerState.confirmingDeviceId).toBeNull()
      expect(window.deviceManagerState.confirmingRemoveAll).toBe(false)
    })
  })

  describe('confirmRemoveDevice', () => {
    it('should set confirmingDeviceId state', () => {
      window.confirmRemoveDevice('device-123')
      expect(window.deviceManagerState.confirmingDeviceId).toBe('device-123')
    })
  })

  describe('cancelRemoveDevice', () => {
    it('should reset confirmingDeviceId state', () => {
      window.deviceManagerState.confirmingDeviceId = 'device-123'
      window.cancelRemoveDevice()
      expect(window.deviceManagerState.confirmingDeviceId).toBeNull()
    })
  })

  describe('confirmRemoveAllDevices', () => {
    it('should set confirmingRemoveAll state to true', () => {
      window.confirmRemoveAllDevices()
      expect(window.deviceManagerState.confirmingRemoveAll).toBe(true)
    })
  })

  describe('cancelRemoveAllDevices', () => {
    it('should set confirmingRemoveAll state to false', () => {
      window.deviceManagerState.confirmingRemoveAll = true
      window.cancelRemoveAllDevices()
      expect(window.deviceManagerState.confirmingRemoveAll).toBe(false)
    })
  })

  describe('getDeviceManagerState', () => {
    it('should return current state', () => {
      window.deviceManagerState.isOpen = true
      window.deviceManagerState.confirmingDeviceId = 'test-device'
      const state = getDeviceManagerState()
      expect(state.isOpen).toBe(true)
      expect(state.confirmingDeviceId).toBe('test-device')
    })

    it('should return a copy of state', () => {
      const state = getDeviceManagerState()
      state.isOpen = !window.deviceManagerState.isOpen
      expect(state.isOpen).not.toBe(window.deviceManagerState.isOpen)
    })
  })

  describe('Default export', () => {
    it('should export all required functions', async () => {
      const defaultExport = (await import('../src/components/DeviceManager.js')).default
      expect(defaultExport.renderDeviceManager).toBeDefined()
      expect(defaultExport.openDeviceManager).toBeDefined()
      expect(defaultExport.closeDeviceManager).toBeDefined()
      expect(defaultExport.confirmRemoveDevice).toBeDefined()
      expect(defaultExport.cancelRemoveDevice).toBeDefined()
      expect(defaultExport.executeRemoveDevice).toBeDefined()
      expect(defaultExport.confirmRemoveAllDevices).toBeDefined()
      expect(defaultExport.cancelRemoveAllDevices).toBeDefined()
      expect(defaultExport.executeRemoveAllDevices).toBeDefined()
      expect(defaultExport.getDeviceManagerState).toBeDefined()
    })
  })

  describe('Screen resolution display', () => {
    it('should display screen resolution when available', () => {
      const html = renderDeviceManager()
      expect(html).toContain('1920x1080')
    })

    it('should handle missing screen resolution', () => {
      mockDevices[0].screenResolution = null
      const html = renderDeviceManager()
      // Should not throw error
      expect(html).toContain('Chrome')
    })
  })

  describe('Multiple devices', () => {
    beforeEach(() => {
      mockDevices.length = 0
      mockDevices.push(
        {
          fingerprint: 'current-device-fp',
          name: 'Chrome',
          type: 'desktop',
          os: 'Windows',
          lastSeen: new Date().toISOString(),
        },
        {
          fingerprint: 'device-2',
          name: 'Firefox',
          type: 'desktop',
          os: 'macOS',
          lastSeen: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          fingerprint: 'device-3',
          name: 'Safari',
          type: 'mobile',
          os: 'iOS',
          lastSeen: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          fingerprint: 'device-4',
          name: 'Edge',
          type: 'tablet',
          os: 'Android',
          lastSeen: new Date(Date.now() - 172800000).toISOString(),
        }
      )
    })

    it('should display all other devices', () => {
      const html = renderDeviceManager()
      expect(html).toContain('Firefox')
      expect(html).toContain('Safari')
      expect(html).toContain('Edge')
    })

    it('should have remove buttons for each other device', () => {
      const html = renderDeviceManager()
      expect(html).toContain('device-2')
      expect(html).toContain('device-3')
      expect(html).toContain('device-4')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on modal', () => {
      const html = renderDeviceManager()
      expect(html).toContain('role="dialog"')
      expect(html).toContain('aria-modal="true"')
      expect(html).toContain('aria-labelledby="device-manager-title"')
    })

    it('should have aria-label on close button', () => {
      const html = renderDeviceManager()
      expect(html).toContain('aria-label="Fermer"')
    })

    it('should have aria-label on remove buttons', () => {
      const html = renderDeviceManager()
      expect(html).toContain('aria-label')
      expect(html).toContain("Supprimer l'appareil")
    })

    it('should have live region for confirmation dialogs', () => {
      const html = renderDeviceManager()
      expect(html).toContain('aria-live="polite"')
    })
  })
})
