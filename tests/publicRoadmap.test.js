/**
 * Tests for Public Roadmap Service
 * Displays upcoming features and allows users to vote for priorities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock state
vi.mock('../src/stores/state.js', () => ({
  getState: () => ({
    lang: 'fr',
  }),
  setState: vi.fn(),
}))

// Mock analytics
vi.mock('../src/services/analytics.js', () => ({
  trackEvent: vi.fn(),
}))

import {
  RoadmapStatus,
  getRoadmapItems,
  getRoadmapByStatus,
  getRoadmapByCategory,
  getRoadmapItem,
  voteForFeature,
  unvoteFeature,
  hasVotedFor,
  getUserVotes,
  getStatusConfig,
  getAllStatuses,
  getCategories,
  getRoadmapStats,
  renderFeatureCard,
  renderRoadmap,
  addRoadmapItem,
  updateRoadmapStatus,
  updateRoadmapProgress,
  resetRoadmap,
} from '../src/services/publicRoadmap.js'

describe('Public Roadmap Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset roadmap to default state before each test
    resetRoadmap()
  })

  describe('RoadmapStatus', () => {
    it('should have all four statuses defined', () => {
      expect(RoadmapStatus.PLANNED).toBe('planned')
      expect(RoadmapStatus.IN_PROGRESS).toBe('in-progress')
      expect(RoadmapStatus.COMPLETED).toBe('completed')
      expect(RoadmapStatus.CONSIDERING).toBe('considering')
    })

    it('should have exactly four statuses', () => {
      const statusCount = Object.keys(RoadmapStatus).length
      expect(statusCount).toBe(4)
    })
  })

  describe('getRoadmapItems', () => {
    it('should return array of roadmap items', () => {
      const items = getRoadmapItems()
      expect(Array.isArray(items)).toBe(true)
      expect(items.length).toBeGreaterThan(0)
    })

    it('should sort items by votes descending', () => {
      const items = getRoadmapItems()
      for (let i = 1; i < items.length; i++) {
        expect(items[i - 1].votes).toBeGreaterThanOrEqual(items[i].votes)
      }
    })

    it('should return items with required properties', () => {
      const items = getRoadmapItems()
      const item = items[0]
      expect(item.id).toBeDefined()
      expect(item.title).toBeDefined()
      expect(item.description).toBeDefined()
      expect(item.status).toBeDefined()
      expect(item.votes).toBeDefined()
    })

    it('should return items with multilingual titles', () => {
      const items = getRoadmapItems()
      const item = items[0]
      expect(item.title.fr).toBeDefined()
      expect(item.title.en).toBeDefined()
    })

    it('should return items with multilingual descriptions', () => {
      const items = getRoadmapItems()
      const item = items[0]
      expect(item.description.fr).toBeDefined()
      expect(item.description.en).toBeDefined()
    })
  })

  describe('getRoadmapByStatus', () => {
    it('should return only planned items when filtered', () => {
      const items = getRoadmapByStatus(RoadmapStatus.PLANNED)
      expect(items.every((i) => i.status === RoadmapStatus.PLANNED)).toBe(true)
    })

    it('should return only in-progress items when filtered', () => {
      const items = getRoadmapByStatus(RoadmapStatus.IN_PROGRESS)
      expect(items.every((i) => i.status === RoadmapStatus.IN_PROGRESS)).toBe(true)
    })

    it('should return only completed items when filtered', () => {
      const items = getRoadmapByStatus(RoadmapStatus.COMPLETED)
      expect(items.every((i) => i.status === RoadmapStatus.COMPLETED)).toBe(true)
    })

    it('should return only considering items when filtered', () => {
      const items = getRoadmapByStatus(RoadmapStatus.CONSIDERING)
      expect(items.every((i) => i.status === RoadmapStatus.CONSIDERING)).toBe(true)
    })

    it('should return empty array for invalid status', () => {
      const items = getRoadmapByStatus('invalid-status')
      expect(items).toEqual([])
    })

    it('should return empty array for null status', () => {
      const items = getRoadmapByStatus(null)
      expect(items).toEqual([])
    })

    it('should sort filtered items by votes', () => {
      const items = getRoadmapByStatus(RoadmapStatus.PLANNED)
      for (let i = 1; i < items.length; i++) {
        expect(items[i - 1].votes).toBeGreaterThanOrEqual(items[i].votes)
      }
    })
  })

  describe('getRoadmapByCategory', () => {
    it('should return items filtered by feature category', () => {
      const items = getRoadmapByCategory('feature')
      expect(items.every((i) => i.category === 'feature')).toBe(true)
    })

    it('should return items filtered by i18n category', () => {
      const items = getRoadmapByCategory('i18n')
      expect(items.every((i) => i.category === 'i18n')).toBe(true)
    })

    it('should return empty array for invalid category', () => {
      const items = getRoadmapByCategory('nonexistent')
      expect(items).toEqual([])
    })

    it('should return empty array for null category', () => {
      const items = getRoadmapByCategory(null)
      expect(items).toEqual([])
    })
  })

  describe('getRoadmapItem', () => {
    it('should return item by ID', () => {
      const item = getRoadmapItem('feature-offline-maps')
      expect(item).not.toBeNull()
      expect(item.id).toBe('feature-offline-maps')
    })

    it('should return null for unknown ID', () => {
      const item = getRoadmapItem('unknown-feature')
      expect(item).toBeNull()
    })

    it('should return null for null ID', () => {
      const item = getRoadmapItem(null)
      expect(item).toBeNull()
    })

    it('should return complete item object', () => {
      const item = getRoadmapItem('feature-offline-maps')
      expect(item.title).toBeDefined()
      expect(item.description).toBeDefined()
      expect(item.status).toBeDefined()
      expect(item.category).toBeDefined()
      expect(item.votes).toBeDefined()
    })
  })

  describe('voteForFeature', () => {
    it('should successfully vote for a feature', () => {
      const result = voteForFeature('feature-weather-alerts')
      expect(result.success).toBe(true)
      expect(result.votes).toBeDefined()
    })

    it('should increment vote count', () => {
      const itemBefore = getRoadmapItem('feature-weather-alerts')
      const votesBefore = itemBefore.votes
      voteForFeature('feature-weather-alerts')
      const itemAfter = getRoadmapItem('feature-weather-alerts')
      expect(itemAfter.votes).toBe(votesBefore + 1)
    })

    it('should prevent double voting', () => {
      voteForFeature('feature-weather-alerts')
      const result = voteForFeature('feature-weather-alerts')
      expect(result.success).toBe(false)
      expect(result.error).toBe('already_voted')
    })

    it('should return error for unknown feature', () => {
      const result = voteForFeature('unknown-feature')
      expect(result.success).toBe(false)
      expect(result.error).toBe('not_found')
    })

    it('should return error for null feature ID', () => {
      const result = voteForFeature(null)
      expect(result.success).toBe(false)
      expect(result.error).toBe('no_feature_id')
    })

    it('should not allow voting for completed features', () => {
      const result = voteForFeature('feature-dark-mode-v2')
      expect(result.success).toBe(false)
      expect(result.error).toBe('completed')
    })

    it('should return current vote count on error', () => {
      voteForFeature('feature-weather-alerts')
      const result = voteForFeature('feature-weather-alerts')
      expect(result.votes).toBeDefined()
    })
  })

  describe('unvoteFeature', () => {
    it('should successfully remove vote', () => {
      voteForFeature('feature-weather-alerts')
      const result = unvoteFeature('feature-weather-alerts')
      expect(result.success).toBe(true)
    })

    it('should decrement vote count', () => {
      voteForFeature('feature-weather-alerts')
      const itemBefore = getRoadmapItem('feature-weather-alerts')
      const votesBefore = itemBefore.votes
      unvoteFeature('feature-weather-alerts')
      const itemAfter = getRoadmapItem('feature-weather-alerts')
      expect(itemAfter.votes).toBe(votesBefore - 1)
    })

    it('should return error if not voted', () => {
      const result = unvoteFeature('feature-weather-alerts')
      expect(result.success).toBe(false)
      expect(result.error).toBe('not_voted')
    })

    it('should return error for unknown feature', () => {
      const result = unvoteFeature('unknown-feature')
      expect(result.success).toBe(false)
      expect(result.error).toBe('not_found')
    })

    it('should return error for null feature ID', () => {
      const result = unvoteFeature(null)
      expect(result.success).toBe(false)
      expect(result.error).toBe('no_feature_id')
    })
  })

  describe('hasVotedFor', () => {
    it('should return false before voting', () => {
      expect(hasVotedFor('feature-weather-alerts')).toBe(false)
    })

    it('should return true after voting', () => {
      voteForFeature('feature-weather-alerts')
      expect(hasVotedFor('feature-weather-alerts')).toBe(true)
    })

    it('should return false after unvoting', () => {
      voteForFeature('feature-weather-alerts')
      unvoteFeature('feature-weather-alerts')
      expect(hasVotedFor('feature-weather-alerts')).toBe(false)
    })
  })

  describe('getUserVotes', () => {
    it('should return empty array initially', () => {
      const votes = getUserVotes()
      expect(votes).toEqual([])
    })

    it('should return voted feature IDs', () => {
      voteForFeature('feature-weather-alerts')
      voteForFeature('feature-apple-watch')
      const votes = getUserVotes()
      expect(votes).toContain('feature-weather-alerts')
      expect(votes).toContain('feature-apple-watch')
    })

    it('should return array of strings', () => {
      voteForFeature('feature-weather-alerts')
      const votes = getUserVotes()
      expect(votes.every((v) => typeof v === 'string')).toBe(true)
    })
  })

  describe('getStatusConfig', () => {
    it('should return config for planned status', () => {
      const config = getStatusConfig(RoadmapStatus.PLANNED)
      expect(config).not.toBeNull()
      expect(config.color).toBe('blue')
      expect(config.icon).toBeDefined()
    })

    it('should return config for in-progress status', () => {
      const config = getStatusConfig(RoadmapStatus.IN_PROGRESS)
      expect(config).not.toBeNull()
      expect(config.color).toBe('yellow')
    })

    it('should return config for completed status', () => {
      const config = getStatusConfig(RoadmapStatus.COMPLETED)
      expect(config).not.toBeNull()
      expect(config.color).toBe('green')
    })

    it('should return config for considering status', () => {
      const config = getStatusConfig(RoadmapStatus.CONSIDERING)
      expect(config).not.toBeNull()
      expect(config.color).toBe('purple')
    })

    it('should return null for invalid status', () => {
      const config = getStatusConfig('invalid')
      expect(config).toBeNull()
    })

    it('should have multilingual labels', () => {
      const config = getStatusConfig(RoadmapStatus.PLANNED)
      expect(config.label.fr).toBeDefined()
      expect(config.label.en).toBeDefined()
    })
  })

  describe('getAllStatuses', () => {
    it('should return array of status objects', () => {
      const statuses = getAllStatuses()
      expect(Array.isArray(statuses)).toBe(true)
      expect(statuses.length).toBe(4)
    })

    it('should have key and label for each status', () => {
      const statuses = getAllStatuses()
      statuses.forEach((s) => {
        expect(s.key).toBeDefined()
        expect(s.label).toBeDefined()
      })
    })

    it('should include all four statuses', () => {
      const statuses = getAllStatuses()
      const keys = statuses.map((s) => s.key)
      expect(keys).toContain(RoadmapStatus.PLANNED)
      expect(keys).toContain(RoadmapStatus.IN_PROGRESS)
      expect(keys).toContain(RoadmapStatus.COMPLETED)
      expect(keys).toContain(RoadmapStatus.CONSIDERING)
    })
  })

  describe('getCategories', () => {
    it('should return array of categories', () => {
      const categories = getCategories()
      expect(Array.isArray(categories)).toBe(true)
      expect(categories.length).toBeGreaterThan(0)
    })

    it('should include feature category', () => {
      const categories = getCategories()
      expect(categories).toContain('feature')
    })

    it('should return unique categories', () => {
      const categories = getCategories()
      const uniqueCategories = [...new Set(categories)]
      expect(categories.length).toBe(uniqueCategories.length)
    })
  })

  describe('getRoadmapStats', () => {
    it('should return total count', () => {
      const stats = getRoadmapStats()
      expect(stats.total).toBeGreaterThan(0)
    })

    it('should return counts by status', () => {
      const stats = getRoadmapStats()
      expect(stats.byStatus).toBeDefined()
      expect(typeof stats.byStatus).toBe('object')
    })

    it('should return counts by category', () => {
      const stats = getRoadmapStats()
      expect(stats.byCategory).toBeDefined()
      expect(typeof stats.byCategory).toBe('object')
    })

    it('should return total votes', () => {
      const stats = getRoadmapStats()
      expect(stats.totalVotes).toBeGreaterThan(0)
    })

    it('should return average votes', () => {
      const stats = getRoadmapStats()
      expect(stats.averageVotes).toBeDefined()
      expect(stats.averageVotes).toBeGreaterThanOrEqual(0)
    })

    it('should return most voted item', () => {
      const stats = getRoadmapStats()
      expect(stats.mostVoted).not.toBeNull()
      expect(stats.mostVoted.id).toBeDefined()
    })

    it('should return recently completed items', () => {
      const stats = getRoadmapStats()
      expect(Array.isArray(stats.recentlyCompleted)).toBe(true)
    })
  })

  describe('renderFeatureCard', () => {
    it('should return empty string for null feature', () => {
      const html = renderFeatureCard(null)
      expect(html).toBe('')
    })

    it('should render HTML for valid feature', () => {
      const item = getRoadmapItem('feature-offline-maps')
      const html = renderFeatureCard(item)
      expect(html).toContain('feature-card')
    })

    it('should include feature title', () => {
      const item = getRoadmapItem('feature-offline-maps')
      const html = renderFeatureCard(item)
      expect(html).toContain('Cartes hors ligne')
    })

    it('should include status badge', () => {
      const item = getRoadmapItem('feature-offline-maps')
      const html = renderFeatureCard(item)
      expect(html).toContain('En cours')
    })

    it('should include vote button', () => {
      const item = getRoadmapItem('feature-offline-maps')
      const html = renderFeatureCard(item)
      expect(html).toContain('vote-button')
    })

    it('should include vote count', () => {
      const item = getRoadmapItem('feature-offline-maps')
      const html = renderFeatureCard(item)
      expect(html).toContain(String(item.votes))
    })

    it('should include data-feature-id attribute', () => {
      const item = getRoadmapItem('feature-offline-maps')
      const html = renderFeatureCard(item)
      expect(html).toContain('data-feature-id="feature-offline-maps"')
    })

    it('should have accessible ARIA labels', () => {
      const item = getRoadmapItem('feature-offline-maps')
      const html = renderFeatureCard(item)
      expect(html).toContain('role="article"')
      expect(html).toContain('aria-label')
    })

    it('should show progress bar for in-progress items', () => {
      const item = getRoadmapItem('feature-offline-maps')
      const html = renderFeatureCard(item)
      expect(html).toContain('width:')
    })

    it('should show target quarter if available', () => {
      const item = getRoadmapItem('feature-offline-maps')
      const html = renderFeatureCard(item)
      expect(html).toContain('Q1 2026')
    })

    it('should indicate if user has voted', () => {
      voteForFeature('feature-weather-alerts')
      const item = getRoadmapItem('feature-weather-alerts')
      const html = renderFeatureCard(item)
      expect(html).toContain('aria-pressed="true"')
    })

    it('should disable vote button for completed features', () => {
      const item = getRoadmapItem('feature-dark-mode-v2')
      const html = renderFeatureCard(item)
      expect(html).toContain('disabled')
    })
  })

  describe('renderRoadmap', () => {
    it('should render complete roadmap container', () => {
      const html = renderRoadmap()
      expect(html).toContain('roadmap-container')
    })

    it('should include header with title', () => {
      const html = renderRoadmap()
      expect(html).toContain('Roadmap publique')
    })

    it('should include subtitle', () => {
      const html = renderRoadmap()
      expect(html).toContain('Votez pour les fonctionnalités')
    })

    it('should include stats section by default', () => {
      const html = renderRoadmap()
      expect(html).toContain('roadmap-stats')
    })

    it('should include filter buttons by default', () => {
      const html = renderRoadmap()
      expect(html).toContain('roadmap-filters')
    })

    it('should hide stats when showStats is false', () => {
      const html = renderRoadmap({ showStats: false })
      expect(html).not.toContain('roadmap-stats')
    })

    it('should hide filters when showFilters is false', () => {
      const html = renderRoadmap({ showFilters: false })
      expect(html).not.toContain('roadmap-filters')
    })

    it('should render feature cards', () => {
      const html = renderRoadmap()
      expect(html).toContain('feature-card')
    })

    it('should filter by status when filter option provided', () => {
      const html = renderRoadmap({ filter: RoadmapStatus.COMPLETED })
      expect(html).toContain('feature-dark-mode-v2')
    })

    it('should show empty state message when no items match filter', () => {
      const html = renderRoadmap({ filter: 'nonexistent' })
      expect(html).toContain('Aucune fonctionnalité trouvée')
    })

    it('should have accessible region role', () => {
      const html = renderRoadmap()
      expect(html).toContain('role="region"')
    })

    it('should include filter tab buttons with ARIA', () => {
      const html = renderRoadmap()
      expect(html).toContain('role="tablist"')
      expect(html).toContain('role="tab"')
    })
  })

  describe('addRoadmapItem', () => {
    it('should add new item successfully', () => {
      const newItem = {
        id: 'test-feature',
        title: { fr: 'Test', en: 'Test' },
        description: { fr: 'Description test', en: 'Test description' },
      }
      const result = addRoadmapItem(newItem)
      expect(result.success).toBe(true)
    })

    it('should return error for invalid item', () => {
      const result = addRoadmapItem(null)
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_item')
    })

    it('should return error for item without ID', () => {
      const result = addRoadmapItem({ title: { en: 'Test' }, description: { en: 'Desc' } })
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_item')
    })

    it('should return error for duplicate ID', () => {
      addRoadmapItem({
        id: 'test-feature-2',
        title: { en: 'Test' },
        description: { en: 'Desc' },
      })
      const result = addRoadmapItem({
        id: 'test-feature-2',
        title: { en: 'Test 2' },
        description: { en: 'Desc 2' },
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('duplicate_id')
    })

    it('should set default values for new item', () => {
      const result = addRoadmapItem({
        id: 'test-feature-3',
        title: { en: 'Test' },
        description: { en: 'Desc' },
      })
      expect(result.item.votes).toBe(0)
      expect(result.item.status).toBe(RoadmapStatus.CONSIDERING)
    })
  })

  describe('updateRoadmapStatus', () => {
    it('should update status successfully', () => {
      const result = updateRoadmapStatus('feature-weather-alerts', RoadmapStatus.PLANNED)
      expect(result.success).toBe(true)
    })

    it('should return error for unknown feature', () => {
      const result = updateRoadmapStatus('unknown', RoadmapStatus.PLANNED)
      expect(result.success).toBe(false)
      expect(result.error).toBe('not_found')
    })

    it('should return error for invalid status', () => {
      const result = updateRoadmapStatus('feature-weather-alerts', 'invalid')
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_status')
    })

    it('should return error for null feature ID', () => {
      const result = updateRoadmapStatus(null, RoadmapStatus.PLANNED)
      expect(result.success).toBe(false)
      expect(result.error).toBe('no_feature_id')
    })

    it('should set progress to 100 when completing', () => {
      updateRoadmapStatus('feature-weather-alerts', RoadmapStatus.COMPLETED)
      const item = getRoadmapItem('feature-weather-alerts')
      expect(item.progress).toBe(100)
    })

    it('should set completedAt when completing', () => {
      updateRoadmapStatus('feature-weather-alerts', RoadmapStatus.COMPLETED)
      const item = getRoadmapItem('feature-weather-alerts')
      expect(item.completedAt).toBeDefined()
    })
  })

  describe('updateRoadmapProgress', () => {
    it('should update progress successfully', () => {
      const result = updateRoadmapProgress('feature-offline-maps', 75)
      expect(result.success).toBe(true)
      expect(result.item.progress).toBe(75)
    })

    it('should return error for unknown feature', () => {
      const result = updateRoadmapProgress('unknown', 50)
      expect(result.success).toBe(false)
      expect(result.error).toBe('not_found')
    })

    it('should return error for invalid progress value', () => {
      const result = updateRoadmapProgress('feature-offline-maps', 150)
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_progress')
    })

    it('should return error for negative progress', () => {
      const result = updateRoadmapProgress('feature-offline-maps', -10)
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_progress')
    })

    it('should return error for null feature ID', () => {
      const result = updateRoadmapProgress(null, 50)
      expect(result.success).toBe(false)
      expect(result.error).toBe('no_feature_id')
    })

    it('should auto-complete when progress reaches 100', () => {
      updateRoadmapProgress('feature-weather-alerts', 100)
      const item = getRoadmapItem('feature-weather-alerts')
      expect(item.status).toBe(RoadmapStatus.COMPLETED)
    })
  })

  describe('resetRoadmap', () => {
    it('should reset all votes', () => {
      voteForFeature('feature-weather-alerts')
      resetRoadmap()
      expect(hasVotedFor('feature-weather-alerts')).toBe(false)
    })

    it('should reset vote counts to defaults', () => {
      const itemBefore = getRoadmapItem('feature-weather-alerts')
      const originalVotes = itemBefore.votes
      voteForFeature('feature-weather-alerts')
      resetRoadmap()
      const itemAfter = getRoadmapItem('feature-weather-alerts')
      expect(itemAfter.votes).toBe(originalVotes)
    })

    it('should remove added items', () => {
      addRoadmapItem({
        id: 'temp-feature',
        title: { en: 'Temp' },
        description: { en: 'Desc' },
      })
      resetRoadmap()
      const item = getRoadmapItem('temp-feature')
      expect(item).toBeNull()
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete vote workflow', () => {
      const featureId = 'feature-weather-alerts'
      const itemBefore = getRoadmapItem(featureId)
      const votesBefore = itemBefore.votes

      // Vote
      const voteResult = voteForFeature(featureId)
      expect(voteResult.success).toBe(true)
      expect(hasVotedFor(featureId)).toBe(true)

      // Unvote
      const unvoteResult = unvoteFeature(featureId)
      expect(unvoteResult.success).toBe(true)
      expect(hasVotedFor(featureId)).toBe(false)

      const itemAfter = getRoadmapItem(featureId)
      expect(itemAfter.votes).toBe(votesBefore)
    })

    it('should render roadmap with all statuses', () => {
      const html = renderRoadmap()
      expect(html).toContain('Planifié')
      expect(html).toContain('En cours')
      expect(html).toContain('Terminé')
      expect(html).toContain('En réflexion')
    })

    it('should track votes across multiple features', () => {
      voteForFeature('feature-weather-alerts')
      voteForFeature('feature-apple-watch')
      voteForFeature('feature-android-widget')

      const votes = getUserVotes()
      expect(votes.length).toBe(3)
      expect(votes).toContain('feature-weather-alerts')
      expect(votes).toContain('feature-apple-watch')
      expect(votes).toContain('feature-android-widget')
    })

    it('should maintain item order after voting', () => {
      const itemsBefore = getRoadmapItems()
      voteForFeature('feature-weather-alerts')
      const itemsAfter = getRoadmapItems()

      // Items should still be sorted by votes
      for (let i = 1; i < itemsAfter.length; i++) {
        expect(itemsAfter[i - 1].votes).toBeGreaterThanOrEqual(itemsAfter[i].votes)
      }
    })
  })
})
