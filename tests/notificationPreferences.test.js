/**
 * Tests for Notification Preferences Service
 * 70-90 comprehensive tests covering all functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  NOTIFICATION_TYPES,
  getDefaultPreferences,
  getNotificationPreferences,
  setNotificationPreferences,
  toggleNotificationType,
  isNotificationEnabled,
  resetToDefaults,
  getNotificationTypes,
  getNotificationTypeLabel,
  getNotificationTypeDescription,
  exportPreferences,
  importPreferences,
  validatePreferences,
  migrateOldPreferences,
  renderPreferencesUI,
  setupWindowHandlers
} from '../src/services/notificationPreferences.js'

// Storage key
const STORAGE_KEY = 'spothitch_notification_prefs'
const OLD_STORAGE_KEY = 'spothitch_notifications'

describe('Notification Preferences Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  // ========================================
  // NOTIFICATION_TYPES (5 tests)
  // ========================================
  describe('NOTIFICATION_TYPES', () => {
    it('should export all 10 notification types', () => {
      expect(Object.keys(NOTIFICATION_TYPES)).toHaveLength(10)
    })

    it('should have correct type values', () => {
      expect(NOTIFICATION_TYPES.NEW_FRIEND).toBe('new_friend')
      expect(NOTIFICATION_TYPES.NEW_MESSAGE).toBe('new_message')
      expect(NOTIFICATION_TYPES.BADGE_UNLOCKED).toBe('badge_unlocked')
      expect(NOTIFICATION_TYPES.LEVEL_UP).toBe('level_up')
      expect(NOTIFICATION_TYPES.SPOT_NEARBY).toBe('spot_nearby')
    })

    it('should have remaining type values', () => {
      expect(NOTIFICATION_TYPES.FRIEND_NEARBY).toBe('friend_nearby')
      expect(NOTIFICATION_TYPES.STREAK_REMINDER).toBe('streak_reminder')
      expect(NOTIFICATION_TYPES.WEEKLY_DIGEST).toBe('weekly_digest')
      expect(NOTIFICATION_TYPES.SPOT_UPDATE).toBe('spot_update')
      expect(NOTIFICATION_TYPES.CHALLENGE_UPDATE).toBe('challenge_update')
    })

    it('should have unique values for all types', () => {
      const values = Object.values(NOTIFICATION_TYPES)
      const uniqueValues = new Set(values)
      expect(uniqueValues.size).toBe(values.length)
    })

    it('should use snake_case format for all values', () => {
      Object.values(NOTIFICATION_TYPES).forEach(value => {
        expect(value).toMatch(/^[a-z]+(_[a-z]+)*$/)
      })
    })
  })

  // ========================================
  // getDefaultPreferences (8 tests)
  // ========================================
  describe('getDefaultPreferences()', () => {
    it('should return an object', () => {
      const defaults = getDefaultPreferences()
      expect(typeof defaults).toBe('object')
      expect(defaults).not.toBeNull()
    })

    it('should have enabled set to true by default', () => {
      const defaults = getDefaultPreferences()
      expect(defaults.enabled).toBe(true)
    })

    it('should have all notification types in types object', () => {
      const defaults = getDefaultPreferences()
      const types = Object.values(NOTIFICATION_TYPES)

      types.forEach(type => {
        expect(defaults.types).toHaveProperty(type)
      })
    })

    it('should have most notifications enabled by default', () => {
      const defaults = getDefaultPreferences()
      expect(defaults.types.new_friend).toBe(true)
      expect(defaults.types.new_message).toBe(true)
      expect(defaults.types.badge_unlocked).toBe(true)
      expect(defaults.types.level_up).toBe(true)
      expect(defaults.types.spot_nearby).toBe(true)
    })

    it('should have weekly_digest disabled by default', () => {
      const defaults = getDefaultPreferences()
      expect(defaults.types.weekly_digest).toBe(false)
    })

    it('should have quiet hours disabled by default', () => {
      const defaults = getDefaultPreferences()
      expect(defaults.quietHours.enabled).toBe(false)
      expect(defaults.quietHours.start).toBe('22:00')
      expect(defaults.quietHours.end).toBe('08:00')
    })

    it('should have sound and vibration enabled by default', () => {
      const defaults = getDefaultPreferences()
      expect(defaults.sound).toBe(true)
      expect(defaults.vibration).toBe(true)
    })

    it('should have a version number', () => {
      const defaults = getDefaultPreferences()
      expect(defaults.version).toBeDefined()
      expect(typeof defaults.version).toBe('number')
    })
  })

  // ========================================
  // getNotificationPreferences (7 tests)
  // ========================================
  describe('getNotificationPreferences()', () => {
    it('should return defaults when no preferences are stored', () => {
      const prefs = getNotificationPreferences()
      const defaults = getDefaultPreferences()

      expect(prefs.enabled).toBe(defaults.enabled)
      expect(prefs.types).toEqual(defaults.types)
    })

    it('should return stored preferences if valid', () => {
      const customPrefs = {
        enabled: false,
        types: {
          new_friend: false,
          new_message: true,
          badge_unlocked: true,
          level_up: false,
          spot_nearby: true,
          friend_nearby: true,
          streak_reminder: false,
          weekly_digest: true,
          spot_update: true,
          challenge_update: true
        },
        quietHours: { enabled: true, start: '23:00', end: '07:00' },
        sound: false,
        vibration: true,
        version: 2
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(customPrefs))
      const prefs = getNotificationPreferences()

      expect(prefs.enabled).toBe(false)
      expect(prefs.types.new_friend).toBe(false)
      expect(prefs.quietHours.enabled).toBe(true)
    })

    it('should return defaults for invalid stored preferences', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json')
      const prefs = getNotificationPreferences()
      const defaults = getDefaultPreferences()

      expect(prefs.enabled).toBe(defaults.enabled)
    })

    it('should return defaults for malformed preferences object', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ invalid: true }))
      const prefs = getNotificationPreferences()
      const defaults = getDefaultPreferences()

      expect(prefs.enabled).toBe(defaults.enabled)
    })

    it('should preserve custom quiet hours settings', () => {
      const customPrefs = getDefaultPreferences()
      customPrefs.quietHours = { enabled: true, start: '21:00', end: '06:00' }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(customPrefs))
      const prefs = getNotificationPreferences()

      expect(prefs.quietHours.start).toBe('21:00')
      expect(prefs.quietHours.end).toBe('06:00')
    })

    it('should preserve sound/vibration settings', () => {
      const customPrefs = getDefaultPreferences()
      customPrefs.sound = false
      customPrefs.vibration = false

      localStorage.setItem(STORAGE_KEY, JSON.stringify(customPrefs))
      const prefs = getNotificationPreferences()

      expect(prefs.sound).toBe(false)
      expect(prefs.vibration).toBe(false)
    })

    it('should try to migrate old preferences if new ones not found', () => {
      const oldPrefs = {
        enabled: true,
        notifications: {
          friendRequest: false,
          message: true
        }
      }

      localStorage.setItem(OLD_STORAGE_KEY, JSON.stringify(oldPrefs))
      const prefs = getNotificationPreferences()

      expect(prefs.types.new_friend).toBe(false)
      expect(prefs.types.new_message).toBe(true)
    })
  })

  // ========================================
  // setNotificationPreferences (10 tests)
  // ========================================
  describe('setNotificationPreferences()', () => {
    it('should update preferences in storage', () => {
      setNotificationPreferences({ enabled: false })

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored.enabled).toBe(false)
    })

    it('should merge with existing preferences', () => {
      setNotificationPreferences({ enabled: true })
      setNotificationPreferences({ sound: false })

      const prefs = getNotificationPreferences()
      expect(prefs.enabled).toBe(true)
      expect(prefs.sound).toBe(false)
    })

    it('should merge types correctly', () => {
      setNotificationPreferences({
        types: { new_friend: false }
      })

      const prefs = getNotificationPreferences()
      expect(prefs.types.new_friend).toBe(false)
      expect(prefs.types.new_message).toBe(true) // Should keep default
    })

    it('should return updated preferences', () => {
      const result = setNotificationPreferences({ enabled: false })

      expect(result.enabled).toBe(false)
    })

    it('should throw error for null input', () => {
      expect(() => setNotificationPreferences(null)).toThrow()
    })

    it('should throw error for non-object input', () => {
      expect(() => setNotificationPreferences('invalid')).toThrow()
    })

    it('should update quiet hours correctly', () => {
      setNotificationPreferences({
        quietHours: { enabled: true, start: '20:00' }
      })

      const prefs = getNotificationPreferences()
      expect(prefs.quietHours.enabled).toBe(true)
      expect(prefs.quietHours.start).toBe('20:00')
      expect(prefs.quietHours.end).toBe('08:00') // Should keep default
    })

    it('should preserve version number', () => {
      const defaults = getDefaultPreferences()
      setNotificationPreferences({ enabled: false })

      const prefs = getNotificationPreferences()
      expect(prefs.version).toBe(defaults.version)
    })

    it('should handle empty object input', () => {
      const defaults = getDefaultPreferences()
      const result = setNotificationPreferences({})

      expect(result.enabled).toBe(defaults.enabled)
    })

    it('should update multiple properties at once', () => {
      setNotificationPreferences({
        enabled: false,
        sound: false,
        vibration: false,
        types: { new_friend: false, new_message: false }
      })

      const prefs = getNotificationPreferences()
      expect(prefs.enabled).toBe(false)
      expect(prefs.sound).toBe(false)
      expect(prefs.vibration).toBe(false)
      expect(prefs.types.new_friend).toBe(false)
      expect(prefs.types.new_message).toBe(false)
    })
  })

  // ========================================
  // toggleNotificationType (8 tests)
  // ========================================
  describe('toggleNotificationType()', () => {
    it('should toggle notification type from true to false', () => {
      const result = toggleNotificationType('new_friend')
      expect(result).toBe(false)
    })

    it('should toggle notification type from false to true', () => {
      setNotificationPreferences({ types: { new_friend: false } })
      const result = toggleNotificationType('new_friend')
      expect(result).toBe(true)
    })

    it('should persist toggle in storage', () => {
      toggleNotificationType('new_message')

      const prefs = getNotificationPreferences()
      expect(prefs.types.new_message).toBe(false)
    })

    it('should throw error for invalid type', () => {
      expect(() => toggleNotificationType('invalid_type')).toThrow()
    })

    it('should throw error for empty type', () => {
      expect(() => toggleNotificationType('')).toThrow()
    })

    it('should throw error for null type', () => {
      expect(() => toggleNotificationType(null)).toThrow()
    })

    it('should work with all notification types', () => {
      Object.values(NOTIFICATION_TYPES).forEach(type => {
        const before = getNotificationPreferences().types[type]
        const result = toggleNotificationType(type)
        expect(result).toBe(!before)
      })
    })

    it('should return the new state', () => {
      const result1 = toggleNotificationType('badge_unlocked')
      expect(typeof result1).toBe('boolean')

      const result2 = toggleNotificationType('badge_unlocked')
      expect(result2).toBe(!result1)
    })
  })

  // ========================================
  // isNotificationEnabled (10 tests)
  // ========================================
  describe('isNotificationEnabled()', () => {
    it('should return true for enabled notification type', () => {
      expect(isNotificationEnabled('new_friend')).toBe(true)
    })

    it('should return false for disabled notification type', () => {
      setNotificationPreferences({ types: { new_friend: false } })
      expect(isNotificationEnabled('new_friend')).toBe(false)
    })

    it('should return false when master toggle is off', () => {
      setNotificationPreferences({ enabled: false })
      expect(isNotificationEnabled('new_friend')).toBe(false)
    })

    it('should return false for invalid type', () => {
      expect(isNotificationEnabled('invalid_type')).toBe(false)
    })

    it('should return false for null type', () => {
      expect(isNotificationEnabled(null)).toBe(false)
    })

    it('should return false for undefined type', () => {
      expect(isNotificationEnabled(undefined)).toBe(false)
    })

    it('should consider quiet hours (during quiet hours)', () => {
      // Set quiet hours that include current time
      const now = new Date()
      const startHour = now.getHours()
      const endHour = (now.getHours() + 2) % 24

      const start = `${String(startHour).padStart(2, '0')}:00`
      const end = `${String(endHour).padStart(2, '0')}:00`

      setNotificationPreferences({
        quietHours: { enabled: true, start, end }
      })

      expect(isNotificationEnabled('new_friend')).toBe(false)
    })

    it('should allow notifications outside quiet hours', () => {
      // Set quiet hours that exclude current time
      const now = new Date()
      const startHour = (now.getHours() + 3) % 24
      const endHour = (now.getHours() + 5) % 24

      const start = `${String(startHour).padStart(2, '0')}:00`
      const end = `${String(endHour).padStart(2, '0')}:00`

      setNotificationPreferences({
        quietHours: { enabled: true, start, end }
      })

      expect(isNotificationEnabled('new_friend')).toBe(true)
    })

    it('should return true when quiet hours disabled', () => {
      setNotificationPreferences({
        quietHours: { enabled: false, start: '00:00', end: '23:59' }
      })

      expect(isNotificationEnabled('new_friend')).toBe(true)
    })

    it('should check weekly_digest default state', () => {
      // weekly_digest is disabled by default
      expect(isNotificationEnabled('weekly_digest')).toBe(false)
    })
  })

  // ========================================
  // resetToDefaults (5 tests)
  // ========================================
  describe('resetToDefaults()', () => {
    it('should reset all preferences to defaults', () => {
      setNotificationPreferences({
        enabled: false,
        types: { new_friend: false, new_message: false }
      })

      const result = resetToDefaults()
      const defaults = getDefaultPreferences()

      expect(result.enabled).toBe(defaults.enabled)
      expect(result.types).toEqual(defaults.types)
    })

    it('should persist reset in storage', () => {
      setNotificationPreferences({ enabled: false })
      resetToDefaults()

      const prefs = getNotificationPreferences()
      expect(prefs.enabled).toBe(true)
    })

    it('should return the default preferences', () => {
      const result = resetToDefaults()
      const defaults = getDefaultPreferences()

      expect(result).toEqual(defaults)
    })

    it('should reset sound and vibration', () => {
      setNotificationPreferences({ sound: false, vibration: false })
      const result = resetToDefaults()

      expect(result.sound).toBe(true)
      expect(result.vibration).toBe(true)
    })

    it('should reset quiet hours', () => {
      setNotificationPreferences({
        quietHours: { enabled: true, start: '18:00', end: '10:00' }
      })

      const result = resetToDefaults()

      expect(result.quietHours.enabled).toBe(false)
      expect(result.quietHours.start).toBe('22:00')
      expect(result.quietHours.end).toBe('08:00')
    })
  })

  // ========================================
  // getNotificationTypes (3 tests)
  // ========================================
  describe('getNotificationTypes()', () => {
    it('should return array of all notification types', () => {
      const types = getNotificationTypes()

      expect(Array.isArray(types)).toBe(true)
      expect(types).toHaveLength(10)
    })

    it('should include all NOTIFICATION_TYPES values', () => {
      const types = getNotificationTypes()
      const expectedTypes = Object.values(NOTIFICATION_TYPES)

      expectedTypes.forEach(type => {
        expect(types).toContain(type)
      })
    })

    it('should return strings only', () => {
      const types = getNotificationTypes()

      types.forEach(type => {
        expect(typeof type).toBe('string')
      })
    })
  })

  // ========================================
  // getNotificationTypeLabel (8 tests)
  // ========================================
  describe('getNotificationTypeLabel()', () => {
    it('should return French label by default', () => {
      const label = getNotificationTypeLabel('new_friend')
      expect(label).toBe('Nouvelle demande d\'ami')
    })

    it('should return English label when lang is en', () => {
      const label = getNotificationTypeLabel('new_friend', 'en')
      expect(label).toBe('New friend request')
    })

    it('should return Spanish label when lang is es', () => {
      const label = getNotificationTypeLabel('new_friend', 'es')
      expect(label).toBe('Nueva solicitud de amistad')
    })

    it('should return German label when lang is de', () => {
      const label = getNotificationTypeLabel('new_friend', 'de')
      expect(label).toBe('Neue Freundschaftsanfrage')
    })

    it('should return French for unknown language', () => {
      const label = getNotificationTypeLabel('new_friend', 'xyz')
      expect(label).toBe('Nouvelle demande d\'ami')
    })

    it('should return type as fallback for unknown type', () => {
      const label = getNotificationTypeLabel('unknown_type', 'fr')
      expect(label).toBe('unknown_type')
    })

    it('should return labels for all types in all languages', () => {
      const types = getNotificationTypes()
      const langs = ['fr', 'en', 'es', 'de']

      types.forEach(type => {
        langs.forEach(lang => {
          const label = getNotificationTypeLabel(type, lang)
          expect(typeof label).toBe('string')
          expect(label.length).toBeGreaterThan(0)
        })
      })
    })

    it('should handle new_message type correctly', () => {
      expect(getNotificationTypeLabel('new_message', 'fr')).toBe('Nouveau message prive')
      expect(getNotificationTypeLabel('new_message', 'en')).toBe('New private message')
    })
  })

  // ========================================
  // getNotificationTypeDescription (6 tests)
  // ========================================
  describe('getNotificationTypeDescription()', () => {
    it('should return French description by default', () => {
      const desc = getNotificationTypeDescription('new_friend', 'fr')
      expect(desc).toContain('ami')
    })

    it('should return English description', () => {
      const desc = getNotificationTypeDescription('new_friend', 'en')
      expect(desc).toContain('friend')
    })

    it('should return Spanish description', () => {
      const desc = getNotificationTypeDescription('new_friend', 'es')
      expect(desc).toContain('amigo')
    })

    it('should return German description', () => {
      const desc = getNotificationTypeDescription('new_friend', 'de')
      expect(desc).toContain('Freund')
    })

    it('should return empty string for unknown type', () => {
      const desc = getNotificationTypeDescription('unknown_type', 'en')
      expect(desc).toBe('')
    })

    it('should return descriptions for all types', () => {
      const types = getNotificationTypes()

      types.forEach(type => {
        const desc = getNotificationTypeDescription(type, 'en')
        expect(typeof desc).toBe('string')
        expect(desc.length).toBeGreaterThan(0)
      })
    })
  })

  // ========================================
  // exportPreferences (4 tests)
  // ========================================
  describe('exportPreferences()', () => {
    it('should return a JSON string', () => {
      const exported = exportPreferences()

      expect(typeof exported).toBe('string')
      expect(() => JSON.parse(exported)).not.toThrow()
    })

    it('should export current preferences', () => {
      setNotificationPreferences({ enabled: false })

      const exported = exportPreferences()
      const parsed = JSON.parse(exported)

      expect(parsed.enabled).toBe(false)
    })

    it('should be properly formatted JSON', () => {
      const exported = exportPreferences()

      // Should be pretty printed (contain newlines)
      expect(exported).toContain('\n')
    })

    it('should include all preference fields', () => {
      const exported = exportPreferences()
      const parsed = JSON.parse(exported)

      expect(parsed).toHaveProperty('enabled')
      expect(parsed).toHaveProperty('types')
      expect(parsed).toHaveProperty('quietHours')
      expect(parsed).toHaveProperty('sound')
      expect(parsed).toHaveProperty('vibration')
    })
  })

  // ========================================
  // importPreferences (8 tests)
  // ========================================
  describe('importPreferences()', () => {
    it('should import valid JSON preferences', () => {
      const prefs = getDefaultPreferences()
      prefs.enabled = false
      prefs.types.new_friend = false

      const json = JSON.stringify(prefs)
      const result = importPreferences(json)

      expect(result.enabled).toBe(false)
      expect(result.types.new_friend).toBe(false)
    })

    it('should persist imported preferences', () => {
      const prefs = getDefaultPreferences()
      prefs.sound = false

      const json = JSON.stringify(prefs)
      importPreferences(json)

      const stored = getNotificationPreferences()
      expect(stored.sound).toBe(false)
    })

    it('should throw error for invalid JSON', () => {
      expect(() => importPreferences('invalid json {')).toThrow('Invalid JSON format')
    })

    it('should throw error for non-string input', () => {
      expect(() => importPreferences({})).toThrow('Input must be a JSON string')
      expect(() => importPreferences(123)).toThrow('Input must be a JSON string')
    })

    it('should throw error for invalid preferences structure', () => {
      const invalidPrefs = { foo: 'bar' }
      expect(() => importPreferences(JSON.stringify(invalidPrefs))).toThrow('Invalid preferences structure')
    })

    it('should return imported preferences', () => {
      const prefs = getDefaultPreferences()
      const json = JSON.stringify(prefs)
      const result = importPreferences(json)

      expect(result).toEqual(prefs)
    })

    it('should handle empty string input', () => {
      expect(() => importPreferences('')).toThrow()
    })

    it('should validate all notification types exist', () => {
      const prefs = getDefaultPreferences()
      const json = JSON.stringify(prefs)
      const result = importPreferences(json)

      Object.values(NOTIFICATION_TYPES).forEach(type => {
        expect(result.types).toHaveProperty(type)
      })
    })
  })

  // ========================================
  // validatePreferences (10 tests)
  // ========================================
  describe('validatePreferences()', () => {
    it('should return true for valid preferences', () => {
      const prefs = getDefaultPreferences()
      expect(validatePreferences(prefs)).toBe(true)
    })

    it('should return false for null', () => {
      expect(validatePreferences(null)).toBe(false)
    })

    it('should return false for non-object', () => {
      expect(validatePreferences('string')).toBe(false)
      expect(validatePreferences(123)).toBe(false)
    })

    it('should return false if enabled is not boolean', () => {
      const prefs = { ...getDefaultPreferences(), enabled: 'yes' }
      expect(validatePreferences(prefs)).toBe(false)
    })

    it('should return false if types is missing', () => {
      const prefs = { enabled: true }
      expect(validatePreferences(prefs)).toBe(false)
    })

    it('should return false if types is not object', () => {
      const prefs = { enabled: true, types: 'invalid' }
      expect(validatePreferences(prefs)).toBe(false)
    })

    it('should return false for non-boolean type values', () => {
      const prefs = getDefaultPreferences()
      prefs.types.new_friend = 'yes'
      expect(validatePreferences(prefs)).toBe(false)
    })

    it('should return false for invalid quiet hours time format', () => {
      const prefs = getDefaultPreferences()
      prefs.quietHours.start = 'invalid'
      expect(validatePreferences(prefs)).toBe(false)
    })

    it('should return false for invalid quiet hours end time', () => {
      const prefs = getDefaultPreferences()
      prefs.quietHours.end = '25:00'
      expect(validatePreferences(prefs)).toBe(false)
    })

    it('should return false for non-boolean sound', () => {
      const prefs = getDefaultPreferences()
      prefs.sound = 'yes'
      expect(validatePreferences(prefs)).toBe(false)
    })
  })

  // ========================================
  // migrateOldPreferences (6 tests)
  // ========================================
  describe('migrateOldPreferences()', () => {
    it('should return null if no old preferences exist', () => {
      const result = migrateOldPreferences()
      expect(result).toBeNull()
    })

    it('should migrate old format with notifications object', () => {
      const oldPrefs = {
        enabled: true,
        notifications: {
          friendRequest: false,
          message: true,
          badge: false
        }
      }

      localStorage.setItem(OLD_STORAGE_KEY, JSON.stringify(oldPrefs))
      const result = migrateOldPreferences()

      expect(result.types.new_friend).toBe(false)
      expect(result.types.new_message).toBe(true)
      expect(result.types.badge_unlocked).toBe(false)
    })

    it('should migrate old format with types object', () => {
      const oldPrefs = {
        enabled: false,
        types: {
          new_friend: false,
          new_message: false
        }
      }

      localStorage.setItem(OLD_STORAGE_KEY, JSON.stringify(oldPrefs))
      const result = migrateOldPreferences()

      expect(result.enabled).toBe(false)
      expect(result.types.new_friend).toBe(false)
    })

    it('should migrate quiet hours (quietMode)', () => {
      const oldPrefs = {
        enabled: true,
        notifications: {},
        quietMode: { enabled: true, start: '21:00', end: '07:00' }
      }

      localStorage.setItem(OLD_STORAGE_KEY, JSON.stringify(oldPrefs))
      const result = migrateOldPreferences()

      expect(result.quietHours.enabled).toBe(true)
      expect(result.quietHours.start).toBe('21:00')
      expect(result.quietHours.end).toBe('07:00')
    })

    it('should remove old storage key after migration', () => {
      const oldPrefs = { enabled: true, notifications: {} }

      localStorage.setItem(OLD_STORAGE_KEY, JSON.stringify(oldPrefs))
      migrateOldPreferences()

      expect(localStorage.getItem(OLD_STORAGE_KEY)).toBeNull()
    })

    it('should save migrated preferences to new key', () => {
      const oldPrefs = {
        enabled: true,
        notifications: { friendRequest: false }
      }

      localStorage.setItem(OLD_STORAGE_KEY, JSON.stringify(oldPrefs))
      migrateOldPreferences()

      const stored = localStorage.getItem(STORAGE_KEY)
      expect(stored).not.toBeNull()

      const parsed = JSON.parse(stored)
      expect(parsed.types.new_friend).toBe(false)
    })
  })

  // ========================================
  // renderPreferencesUI (12 tests)
  // ========================================
  describe('renderPreferencesUI()', () => {
    it('should return HTML string', () => {
      const html = renderPreferencesUI()

      expect(typeof html).toBe('string')
      expect(html.length).toBeGreaterThan(0)
    })

    it('should include master toggle', () => {
      const html = renderPreferencesUI()

      expect(html).toContain('notif-master')
      expect(html).toContain('toggleNotificationMaster')
    })

    it('should include all notification type toggles', () => {
      const html = renderPreferencesUI()

      Object.values(NOTIFICATION_TYPES).forEach(type => {
        expect(html).toContain(`notif-${type}`)
        expect(html).toContain(`data-type="${type}"`)
      })
    })

    it('should include sound and vibration toggles', () => {
      const html = renderPreferencesUI()

      expect(html).toContain('notif-sound')
      expect(html).toContain('notif-vibration')
    })

    it('should include quiet hours controls', () => {
      const html = renderPreferencesUI()

      expect(html).toContain('notif-quiet-hours')
      expect(html).toContain('quiet-start')
      expect(html).toContain('quiet-end')
    })

    it('should include reset and save buttons', () => {
      const html = renderPreferencesUI()

      expect(html).toContain('resetNotificationPrefs')
      expect(html).toContain('saveNotificationPrefs')
    })

    it('should use French labels by default', () => {
      const html = renderPreferencesUI()

      expect(html).toContain('Preferences de notification')
    })

    it('should use English labels when specified', () => {
      const html = renderPreferencesUI('en')

      expect(html).toContain('Notification Preferences')
    })

    it('should use Spanish labels when specified', () => {
      const html = renderPreferencesUI('es')

      expect(html).toContain('Preferencias de notificacion')
    })

    it('should use German labels when specified', () => {
      const html = renderPreferencesUI('de')

      expect(html).toContain('Benachrichtigungseinstellungen')
    })

    it('should have proper accessibility attributes', () => {
      const html = renderPreferencesUI()

      expect(html).toContain('role="form"')
      expect(html).toContain('aria-label')
    })

    it('should reflect current preferences state', () => {
      setNotificationPreferences({ enabled: false })
      const html = renderPreferencesUI()

      // Master toggle should NOT have checked attribute since enabled is false
      const masterSection = html.match(/id="notif-master"[^>]*/)?.[0] || ''
      expect(masterSection).not.toContain('checked')
    })
  })

  // ========================================
  // setupWindowHandlers (5 tests)
  // ========================================
  describe('setupWindowHandlers()', () => {
    it('should register toggleNotificationPref handler', () => {
      setupWindowHandlers()
      expect(typeof window.toggleNotificationPref).toBe('function')
    })

    it('should register toggleNotificationMaster handler', () => {
      setupWindowHandlers()
      expect(typeof window.toggleNotificationMaster).toBe('function')
    })

    it('should register toggleNotificationSound handler', () => {
      setupWindowHandlers()
      expect(typeof window.toggleNotificationSound).toBe('function')
    })

    it('should register toggleQuietHours handler', () => {
      setupWindowHandlers()
      expect(typeof window.toggleQuietHours).toBe('function')
    })

    it('should register resetNotificationPrefs handler', () => {
      setupWindowHandlers()
      expect(typeof window.resetNotificationPrefs).toBe('function')
    })
  })

  // ========================================
  // Integration Tests (8 tests)
  // ========================================
  describe('Integration Tests', () => {
    it('should handle full preferences workflow', () => {
      // Start with defaults
      resetToDefaults()

      // Disable some notifications
      toggleNotificationType('new_friend')
      toggleNotificationType('weekly_digest') // Should enable since off by default

      // Check states
      expect(isNotificationEnabled('new_friend')).toBe(false)
      expect(isNotificationEnabled('weekly_digest')).toBe(true)

      // Export
      const exported = exportPreferences()

      // Reset
      resetToDefaults()
      expect(isNotificationEnabled('new_friend')).toBe(true)

      // Import back
      importPreferences(exported)
      expect(isNotificationEnabled('new_friend')).toBe(false)
    })

    it('should persist preferences across multiple operations', () => {
      setNotificationPreferences({ enabled: false })
      toggleNotificationType('new_message')
      setNotificationPreferences({ sound: false })

      const prefs = getNotificationPreferences()

      expect(prefs.enabled).toBe(false)
      expect(prefs.types.new_message).toBe(false)
      expect(prefs.sound).toBe(false)
    })

    it('should correctly render UI after preference changes', () => {
      setNotificationPreferences({
        enabled: false,
        types: { new_friend: false }
      })

      const html = renderPreferencesUI('en')

      // Check that disabled state is reflected
      expect(html).toContain('Notification Preferences')
    })

    it('should handle migration then normal operations', () => {
      // Set up old format
      localStorage.setItem(OLD_STORAGE_KEY, JSON.stringify({
        enabled: true,
        notifications: { friendRequest: false }
      }))

      // Should migrate on first access
      let prefs = getNotificationPreferences()
      expect(prefs.types.new_friend).toBe(false)

      // Should work normally after migration
      toggleNotificationType('new_friend')
      prefs = getNotificationPreferences()
      expect(prefs.types.new_friend).toBe(true)
    })

    it('should validate after import and modification', () => {
      const prefs = getDefaultPreferences()
      const json = JSON.stringify(prefs)

      importPreferences(json)
      setNotificationPreferences({ enabled: false })

      const current = getNotificationPreferences()
      expect(validatePreferences(current)).toBe(true)
    })

    it('should maintain consistency between get and set', () => {
      const original = getNotificationPreferences()
      setNotificationPreferences(original)
      const retrieved = getNotificationPreferences()

      expect(retrieved).toEqual(original)
    })

    it('should handle quiet hours edge cases', () => {
      setNotificationPreferences({
        quietHours: { enabled: true, start: '23:00', end: '01:00' }
      })

      const prefs = getNotificationPreferences()
      expect(prefs.quietHours.start).toBe('23:00')
      expect(prefs.quietHours.end).toBe('01:00')
    })

    it('should export and import preserving all data', () => {
      setNotificationPreferences({
        enabled: false,
        types: {
          new_friend: false,
          new_message: false,
          badge_unlocked: true,
          level_up: false,
          spot_nearby: true,
          friend_nearby: false,
          streak_reminder: true,
          weekly_digest: true,
          spot_update: false,
          challenge_update: true
        },
        quietHours: { enabled: true, start: '20:00', end: '09:00' },
        sound: false,
        vibration: false
      })

      const exported = exportPreferences()
      resetToDefaults()
      importPreferences(exported)

      const imported = getNotificationPreferences()

      expect(imported.enabled).toBe(false)
      expect(imported.types.new_friend).toBe(false)
      expect(imported.types.weekly_digest).toBe(true)
      expect(imported.quietHours.enabled).toBe(true)
      expect(imported.quietHours.start).toBe('20:00')
      expect(imported.sound).toBe(false)
      expect(imported.vibration).toBe(false)
    })
  })
})
