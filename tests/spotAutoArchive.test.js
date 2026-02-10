/**
 * Tests for Spot Auto-Archive Service
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock state
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({ lang: 'fr' })),
  setState: vi.fn(),
}))

vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}))

import {
  ArchiveReasons,
  getArchivedSpots,
  shouldArchiveSpot,
  getLastActivityDate,
  archiveSpot,
  reactivateSpot,
  isSpotArchived,
  runAutoArchiveScan,
  filterArchivedSpots,
  getArchiveStats,
  getYearsSinceLastActivity,
  renderArchiveBadge,
  clearArchiveData,
} from '../src/services/spotAutoArchive.js'

// Mock localStorage
let mockStore = {}
const mockLocalStorage = {
  getItem: vi.fn(key => mockStore[key] || null),
  setItem: vi.fn((key, value) => { mockStore[key] = value }),
  removeItem: vi.fn(key => { delete mockStore[key] }),
}

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

// Helper: create date N years ago
function yearsAgo(n) {
  const d = new Date()
  d.setFullYear(d.getFullYear() - n)
  return d.toISOString()
}

// Helper: create date N months ago
function monthsAgo(n) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d.toISOString()
}

describe('spotAutoArchive', () => {
  beforeEach(() => {
    mockStore = {}
    vi.clearAllMocks()
  })

  // --- ArchiveReasons ---
  describe('ArchiveReasons', () => {
    it('should have all expected reasons', () => {
      expect(ArchiveReasons.INACTIVITY).toBe('inactivity')
      expect(ArchiveReasons.MANUAL).toBe('manual')
      expect(ArchiveReasons.DUPLICATE).toBe('duplicate')
      expect(ArchiveReasons.INVALID_LOCATION).toBe('invalid_location')
    })

    it('should have exactly 4 reasons', () => {
      expect(Object.keys(ArchiveReasons)).toHaveLength(4)
    })
  })

  // --- getArchivedSpots ---
  describe('getArchivedSpots', () => {
    it('should return empty object when no data', () => {
      expect(getArchivedSpots()).toEqual({})
    })

    it('should return parsed data from storage', () => {
      const data = { '123': { spotId: '123', reason: 'inactivity' } }
      mockStore.spothitch_archived_spots = JSON.stringify(data)
      expect(getArchivedSpots()).toEqual(data)
    })

    it('should handle corrupted storage gracefully', () => {
      mockStore.spothitch_archived_spots = 'not-json{'
      expect(getArchivedSpots()).toEqual({})
    })
  })

  // --- getLastActivityDate ---
  describe('getLastActivityDate', () => {
    it('should return null for null spot', () => {
      expect(getLastActivityDate(null)).toBeNull()
    })

    it('should return null for spot with no dates', () => {
      expect(getLastActivityDate({ id: 1 })).toBeNull()
    })

    it('should return the most recent date', () => {
      const spot = {
        lastUsed: '2023-01-01',
        lastReview: '2024-06-15',
        createdAt: '2020-01-01',
      }
      const result = getLastActivityDate(spot)
      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(5) // June
    })

    it('should handle single date field', () => {
      const spot = { lastUsed: '2022-03-15' }
      const result = getLastActivityDate(spot)
      expect(result.getFullYear()).toBe(2022)
    })

    it('should prefer lastCheckin over createdAt', () => {
      const spot = {
        createdAt: '2020-01-01',
        lastCheckin: '2025-01-01',
      }
      const result = getLastActivityDate(spot)
      expect(result.getFullYear()).toBe(2025)
    })
  })

  // --- shouldArchiveSpot ---
  describe('shouldArchiveSpot', () => {
    it('should return false for null', () => {
      expect(shouldArchiveSpot(null)).toBe(false)
    })

    it('should return false for spot with no dates', () => {
      expect(shouldArchiveSpot({ id: 1 })).toBe(false)
    })

    it('should return true for spot inactive 4 years', () => {
      const spot = { id: 1, lastUsed: yearsAgo(4) }
      expect(shouldArchiveSpot(spot)).toBe(true)
    })

    it('should return true for spot inactive exactly 3 years', () => {
      const spot = { id: 1, lastUsed: yearsAgo(3.01) }
      expect(shouldArchiveSpot(spot)).toBe(true)
    })

    it('should return false for spot inactive 2 years', () => {
      const spot = { id: 1, lastUsed: yearsAgo(2) }
      expect(shouldArchiveSpot(spot)).toBe(false)
    })

    it('should return false for spot with recent checkin', () => {
      const spot = { id: 1, lastUsed: yearsAgo(5), lastCheckin: monthsAgo(6) }
      expect(shouldArchiveSpot(spot)).toBe(false)
    })

    it('should return false for recently created spot with no reviews', () => {
      const spot = { id: 1, createdAt: monthsAgo(1) }
      expect(shouldArchiveSpot(spot)).toBe(false)
    })

    it('should return true for spot with all old dates', () => {
      const spot = {
        id: 1,
        lastUsed: yearsAgo(4),
        lastReview: yearsAgo(3.5),
        createdAt: yearsAgo(6),
      }
      expect(shouldArchiveSpot(spot)).toBe(true)
    })
  })

  // --- archiveSpot ---
  describe('archiveSpot', () => {
    it('should create archive record', () => {
      const result = archiveSpot(42, ArchiveReasons.INACTIVITY)
      expect(result.spotId).toBe(42)
      expect(result.reason).toBe('inactivity')
      expect(result.archivedBy).toBe('system')
      expect(result.reactivated).toBe(false)
      expect(result.archivedAt).toBeTruthy()
    })

    it('should save to localStorage', () => {
      archiveSpot(42)
      const stored = JSON.parse(mockStore.spothitch_archived_spots)
      expect(stored['42']).toBeDefined()
    })

    it('should not duplicate if already archived', () => {
      const first = archiveSpot(42)
      const second = archiveSpot(42)
      expect(first.archivedAt).toBe(second.archivedAt)
    })

    it('should support manual reason', () => {
      const result = archiveSpot(99, ArchiveReasons.MANUAL, 'user123')
      expect(result.reason).toBe('manual')
      expect(result.archivedBy).toBe('user123')
    })

    it('should archive multiple spots independently', () => {
      archiveSpot(1)
      archiveSpot(2)
      archiveSpot(3)
      const archived = getArchivedSpots()
      expect(Object.keys(archived)).toHaveLength(3)
    })
  })

  // --- reactivateSpot ---
  describe('reactivateSpot', () => {
    it('should reactivate an archived spot', () => {
      archiveSpot(42)
      expect(isSpotArchived(42)).toBe(true)
      const result = reactivateSpot(42)
      expect(result).toBe(true)
      expect(isSpotArchived(42)).toBe(false)
    })

    it('should return false for non-archived spot', () => {
      expect(reactivateSpot(999)).toBe(false)
    })

    it('should remove spot from archive map', () => {
      archiveSpot(42)
      reactivateSpot(42)
      const archived = getArchivedSpots()
      expect(archived['42']).toBeUndefined()
    })
  })

  // --- isSpotArchived ---
  describe('isSpotArchived', () => {
    it('should return false for non-archived spot', () => {
      expect(isSpotArchived(999)).toBe(false)
    })

    it('should return true for archived spot', () => {
      archiveSpot(42)
      expect(isSpotArchived(42)).toBe(true)
    })

    it('should return false after reactivation', () => {
      archiveSpot(42)
      reactivateSpot(42)
      expect(isSpotArchived(42)).toBe(false)
    })
  })

  // --- runAutoArchiveScan ---
  describe('runAutoArchiveScan', () => {
    it('should return empty results for empty array', () => {
      const result = runAutoArchiveScan([])
      expect(result.archived).toEqual([])
      expect(result.total).toBe(0)
    })

    it('should return empty results for non-array', () => {
      const result = runAutoArchiveScan(null)
      expect(result.archived).toEqual([])
    })

    it('should archive old spots', () => {
      const spots = [
        { id: 1, lastUsed: yearsAgo(4) },
        { id: 2, lastUsed: monthsAgo(6) },
        { id: 3, lastUsed: yearsAgo(5) },
      ]
      const result = runAutoArchiveScan(spots)
      expect(result.archived).toEqual([1, 3])
      expect(result.archived).toHaveLength(2)
    })

    it('should skip already archived spots', () => {
      archiveSpot(1)
      const spots = [
        { id: 1, lastUsed: yearsAgo(4) },
        { id: 2, lastUsed: yearsAgo(5) },
      ]
      const result = runAutoArchiveScan(spots)
      expect(result.archived).toEqual([2])
      expect(result.skipped).toEqual([1])
    })

    it('should handle spots without id', () => {
      const spots = [{ lastUsed: yearsAgo(4) }]
      const result = runAutoArchiveScan(spots)
      expect(result.archived).toEqual([])
    })

    it('should handle spots with spotId instead of id', () => {
      const spots = [{ spotId: 77, lastUsed: yearsAgo(4) }]
      const result = runAutoArchiveScan(spots)
      expect(result.archived).toEqual([77])
    })

    it('should not archive recent spots', () => {
      const spots = [
        { id: 1, lastUsed: monthsAgo(1) },
        { id: 2, lastUsed: monthsAgo(12) },
        { id: 3, lastUsed: yearsAgo(2) },
      ]
      const result = runAutoArchiveScan(spots)
      expect(result.archived).toEqual([])
    })
  })

  // --- filterArchivedSpots ---
  describe('filterArchivedSpots', () => {
    it('should filter out archived spots', () => {
      archiveSpot(2)
      const spots = [{ id: 1 }, { id: 2 }, { id: 3 }]
      const result = filterArchivedSpots(spots)
      expect(result).toHaveLength(2)
      expect(result.map(s => s.id)).toEqual([1, 3])
    })

    it('should return all spots if showArchived is true', () => {
      archiveSpot(2)
      const spots = [{ id: 1 }, { id: 2 }, { id: 3 }]
      const result = filterArchivedSpots(spots, true)
      expect(result).toHaveLength(3)
    })

    it('should return empty array for non-array input', () => {
      expect(filterArchivedSpots(null)).toEqual([])
    })

    it('should handle spots with spotId field', () => {
      archiveSpot(2)
      const spots = [{ spotId: 1 }, { spotId: 2 }, { spotId: 3 }]
      const result = filterArchivedSpots(spots)
      expect(result).toHaveLength(2)
    })
  })

  // --- getArchiveStats ---
  describe('getArchiveStats', () => {
    it('should return zero stats when empty', () => {
      const stats = getArchiveStats()
      expect(stats.totalArchived).toBe(0)
      expect(stats.byReason).toEqual({})
      expect(stats.oldestArchive).toBeNull()
    })

    it('should count archived spots correctly', () => {
      archiveSpot(1, ArchiveReasons.INACTIVITY)
      archiveSpot(2, ArchiveReasons.INACTIVITY)
      archiveSpot(3, ArchiveReasons.MANUAL, 'admin')
      const stats = getArchiveStats()
      expect(stats.totalArchived).toBe(3)
      expect(stats.byReason.inactivity).toBe(2)
      expect(stats.byReason.manual).toBe(1)
    })

    it('should track oldest and newest archive dates', () => {
      archiveSpot(1)
      archiveSpot(2)
      const stats = getArchiveStats()
      expect(stats.oldestArchive).toBeTruthy()
      expect(stats.newestArchive).toBeTruthy()
    })
  })

  // --- getYearsSinceLastActivity ---
  describe('getYearsSinceLastActivity', () => {
    it('should return null for spot with no dates', () => {
      expect(getYearsSinceLastActivity({ id: 1 })).toBeNull()
    })

    it('should return approximately correct years', () => {
      const spot = { lastUsed: yearsAgo(2) }
      const years = getYearsSinceLastActivity(spot)
      expect(years).toBeGreaterThan(1.9)
      expect(years).toBeLessThan(2.1)
    })

    it('should return less than 1 for recent spot', () => {
      const spot = { lastUsed: monthsAgo(3) }
      const years = getYearsSinceLastActivity(spot)
      expect(years).toBeLessThan(1)
      expect(years).toBeGreaterThan(0)
    })
  })

  // --- renderArchiveBadge ---
  describe('renderArchiveBadge', () => {
    it('should return empty string for non-archived spot', () => {
      expect(renderArchiveBadge(999)).toBe('')
    })

    it('should return badge HTML for archived spot (FR)', () => {
      archiveSpot(42)
      const html = renderArchiveBadge(42, 'fr')
      expect(html).toContain('Archivé')
      expect(html).toContain('fa-archive')
    })

    it('should return badge in English', () => {
      archiveSpot(42)
      const html = renderArchiveBadge(42, 'en')
      expect(html).toContain('Archived')
    })

    it('should return badge in Spanish', () => {
      archiveSpot(42)
      const html = renderArchiveBadge(42, 'es')
      expect(html).toContain('Archivado')
    })

    it('should return badge in German', () => {
      archiveSpot(42)
      const html = renderArchiveBadge(42, 'de')
      expect(html).toContain('Archiviert')
    })

    it('should default to French for unknown lang', () => {
      archiveSpot(42)
      const html = renderArchiveBadge(42, 'zh')
      expect(html).toContain('Archivé')
    })
  })

  // --- clearArchiveData ---
  describe('clearArchiveData', () => {
    it('should clear all archive data', () => {
      archiveSpot(1)
      archiveSpot(2)
      clearArchiveData()
      expect(getArchivedSpots()).toEqual({})
    })
  })

  // --- Integration tests ---
  describe('Integration', () => {
    it('should handle full lifecycle: scan → archive → filter → reactivate', () => {
      const spots = [
        { id: 1, lastUsed: yearsAgo(4), name: 'Old spot' },
        { id: 2, lastUsed: monthsAgo(6), name: 'Recent spot' },
        { id: 3, lastUsed: yearsAgo(10), name: 'Very old spot' },
      ]

      // Scan
      const scan = runAutoArchiveScan(spots)
      expect(scan.archived).toEqual([1, 3])

      // Filter
      const visible = filterArchivedSpots(spots)
      expect(visible).toHaveLength(1)
      expect(visible[0].id).toBe(2)

      // Stats
      const stats = getArchiveStats()
      expect(stats.totalArchived).toBe(2)

      // Reactivate
      reactivateSpot(1)
      const visibleAfter = filterArchivedSpots(spots)
      expect(visibleAfter).toHaveLength(2)
    })

    it('should not re-archive a reactivated spot in same scan', () => {
      const spots = [{ id: 1, lastUsed: yearsAgo(4) }]

      runAutoArchiveScan(spots)
      expect(isSpotArchived(1)).toBe(true)

      reactivateSpot(1)
      expect(isSpotArchived(1)).toBe(false)

      // Second scan should archive again since spot is still old
      const result = runAutoArchiveScan(spots)
      expect(result.archived).toEqual([1])
    })

    it('should work with large number of spots', () => {
      const spots = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        lastUsed: i % 3 === 0 ? yearsAgo(4) : monthsAgo(6),
      }))

      const result = runAutoArchiveScan(spots)
      expect(result.archived.length).toBeGreaterThan(300)
      expect(result.total).toBe(1000)

      const visible = filterArchivedSpots(spots)
      expect(visible.length).toBeLessThan(700)
    })
  })

  // --- Default export ---
  describe('default export', () => {
    it('should export all functions', async () => {
      const mod = await import('../src/services/spotAutoArchive.js')
      expect(mod.default).toBeDefined()
      expect(mod.default.archiveSpot).toBeDefined()
      expect(mod.default.reactivateSpot).toBeDefined()
      expect(mod.default.shouldArchiveSpot).toBeDefined()
      expect(mod.default.runAutoArchiveScan).toBeDefined()
      expect(mod.default.filterArchivedSpots).toBeDefined()
      expect(mod.default.getArchiveStats).toBeDefined()
      expect(mod.default.clearArchiveData).toBeDefined()
    })
  })
})
