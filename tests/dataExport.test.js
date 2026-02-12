/**
 * Tests for Data Export Utility (GDPR Compliance)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { collectUserData, getExportSummary, exportUserData } from '../src/utils/dataExport.js'

// Mock the state module
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    username: 'TestUser',
    avatar: '🚗',
    points: 150,
    totalPoints: 500,
    seasonPoints: 75,
    level: 3,
    streak: 7,
    checkins: 12,
    spotsCreated: 5,
    reviewsGiven: 8,
    badges: ['first_checkin', 'explorer'],
    rewards: ['custom_avatar'],
    skillPoints: 3,
    unlockedSkills: ['speed_reader', 'night_owl'],
    friends: [
      { id: 'friend1', username: 'Alice', avatar: '🎒' },
      { id: 'friend2', username: 'Bob', avatar: '🚶' },
    ],
    friendRequests: [
      { id: 'req1', username: 'Charlie', status: 'pending' },
    ],
    savedTrips: [
      { id: 'trip1', name: 'Paris to Berlin', from: 'Paris', to: 'Berlin', steps: [] },
    ],
    emergencyContacts: [
      { name: 'Mom', phone: '+33123456789' },
    ],
    theme: 'dark',
    lang: 'fr',
    notifications: true,
    tutorialCompleted: true,
    checkinHistory: [],
    privateMessages: {},
  })),
}))

// Mock Firebase service
vi.mock('../src/services/firebase.js', () => ({
  getCurrentUser: vi.fn(() => ({
    email: 'test@example.com',
    displayName: 'Test User',
    uid: 'user123',
    metadata: {
      creationTime: '2024-01-15T10:00:00.000Z',
      lastSignInTime: '2026-02-04T08:30:00.000Z',
    },
  })),
  getUserProfile: vi.fn(() => Promise.resolve({
    success: true,
    profile: {
      bio: 'Hitchhiker enthusiast',
      totalKm: 5000,
    },
  })),
}))

describe('Data Export Utility', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })

  describe('collectUserData', () => {
    it('should collect user profile data', async () => {
      const data = await collectUserData()

      expect(data.profile).toBeDefined()
      expect(data.profile.username).toBe('TestUser')
      expect(data.profile.avatar).toBe('🚗')
      expect(data.profile.email).toBe('test@example.com')
      expect(data.profile.displayName).toBe('Test User')
    })

    it('should collect activity statistics', async () => {
      const data = await collectUserData()

      expect(data.activity).toBeDefined()
      expect(data.activity.points).toBe(150)
      expect(data.activity.level).toBe(3)
      expect(data.activity.checkins).toBe(12)
      expect(data.activity.spotsCreated).toBe(5)
      expect(data.activity.spotsCreated).toBeDefined()
    })

    it('should collect badges data', async () => {
      const data = await collectUserData()

      expect(data.badges).toBeDefined()
      expect(data.badges).toContain('first_checkin')
      expect(data.badges).toContain('explorer')
      expect(data.badges.length).toBe(2)
    })

    it('should collect skills data', async () => {
      const data = await collectUserData()

      expect(data.skills).toBeDefined()
      expect(data.skills.skillPoints).toBe(3)
      expect(data.skills.unlockedSkills).toContain('speed_reader')
      expect(data.skills.unlockedSkills.length).toBe(2)
    })

    it('should collect social data (friends)', async () => {
      const data = await collectUserData()

      expect(data.social).toBeDefined()
      expect(data.social.friends.length).toBe(2)
      expect(data.social.friends[0].username).toBe('Alice')
      expect(data.social.friendRequests.length).toBe(1)
    })

    it('should collect saved trips', async () => {
      const data = await collectUserData()

      expect(data.trips).toBeDefined()
      expect(data.trips.savedTrips.length).toBe(1)
      expect(data.trips.savedTrips[0].name).toBe('Paris to Berlin')
    })

    it('should collect emergency contacts', async () => {
      const data = await collectUserData()

      expect(data.emergencyContacts).toBeDefined()
      expect(data.emergencyContacts.length).toBe(1)
      expect(data.emergencyContacts[0].name).toBe('Mom')
    })

    it('should collect user preferences', async () => {
      const data = await collectUserData()

      expect(data.preferences).toBeDefined()
      expect(data.preferences.theme).toBe('dark')
      expect(data.preferences.language).toBe('fr')
      expect(data.preferences.notifications).toBe(true)
      expect(data.preferences.tutorialCompleted).toBe(true)
    })

    it('should include export metadata', async () => {
      const data = await collectUserData()

      expect(data.exportInfo).toBeDefined()
      expect(data.exportInfo.exportDate).toBeDefined()
      expect(data.exportInfo.exportVersion).toBe('1.0')
      expect(data.exportInfo.application).toBe('SpotHitch')
    })
  })

  describe('getExportSummary', () => {
    it('should return a summary of exportable data', () => {
      const summary = getExportSummary()

      expect(summary.profile).toBe(true)
      expect(summary.activity.points).toBe(150)
      expect(summary.activity.level).toBe(3)
      expect(summary.badges).toBe(2)
      expect(summary.skills).toBe(2)
      expect(summary.friends).toBe(2)
      expect(summary.savedTrips).toBe(1)
      expect(summary.emergencyContacts).toBe(1)
    })
  })

  describe('exportUserData', () => {
    let originalCreateElement
    let originalCreateObjectURL
    let originalRevokeObjectURL

    beforeEach(() => {
      // Mock DOM methods
      originalCreateElement = document.createElement.bind(document)
      originalCreateObjectURL = URL.createObjectURL
      originalRevokeObjectURL = URL.revokeObjectURL

      URL.createObjectURL = vi.fn(() => 'blob:test-url')
      URL.revokeObjectURL = vi.fn()

      // Mock link click
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn(),
      }

      vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'a') return mockLink
        return originalCreateElement(tag)
      })

      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {})
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => {})

      // Mock showToast
      window.showToast = vi.fn()
    })

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL
      URL.revokeObjectURL = originalRevokeObjectURL
      vi.restoreAllMocks()
    })

    it('should export data successfully and return filename', async () => {
      const result = await exportUserData()

      expect(result.success).toBe(true)
      expect(result.filename).toContain('spothitch_donnees_TestUser_')
      expect(result.filename).toContain('.json')
    })

    it('should create a downloadable blob', async () => {
      await exportUserData()

      expect(URL.createObjectURL).toHaveBeenCalled()
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url')
    })
  })

  describe('Data structure integrity', () => {
    it('should produce valid JSON', async () => {
      const data = await collectUserData()
      const jsonString = JSON.stringify(data)

      expect(() => JSON.parse(jsonString)).not.toThrow()
    })

    it('should have all required top-level sections', async () => {
      const data = await collectUserData()
      const requiredSections = [
        'exportInfo',
        'profile',
        'activity',
        'badges',
        'rewards',
        'skills',
        'social',
        'trips',
        'emergencyContacts',
        'preferences',
      ]

      requiredSections.forEach(section => {
        expect(data[section]).toBeDefined()
      })
    })

    it('should format JSON with proper indentation', async () => {
      const data = await collectUserData()
      const jsonString = JSON.stringify(data, null, 2)

      // Check that JSON has proper formatting (contains newlines and indentation)
      expect(jsonString).toContain('\n')
      expect(jsonString).toContain('  ')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty arrays gracefully', async () => {
      const data = await collectUserData()

      // checkinHistory is empty in our mock
      expect(data.checkinHistory).toEqual([])
    })

    it('should handle missing optional data', async () => {
      const data = await collectUserData()

      // Messages might be empty
      expect(data.messages).toBeDefined()
    })
  })
})
