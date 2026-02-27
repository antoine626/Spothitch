/**
 * Tests for EmptyState component
 */

import { describe, it, expect } from 'vitest'
import { renderEmptyState, getEmptyStateTypes } from '../src/components/EmptyState.js'

describe('EmptyState Component', () => {
  describe('renderEmptyState', () => {
    it('should render conversations empty state with emoji and CTA', () => {
      const result = renderEmptyState('conversations')
      expect(result).toContain('💬')
      expect(result).toContain('btn-primary')
      expect(result).toContain('showAddFriend()')
    })

    it('should render friends empty state', () => {
      const result = renderEmptyState('friends')
      expect(result).toContain('🚗')
      expect(result).toContain('btn-primary')
    })

    it('should render trips empty state with CTA', () => {
      const result = renderEmptyState('trips')
      expect(result).toContain('🗺️')
      expect(result).toContain('btn-primary')
      expect(result).toContain("changeTab('challenges')")
    })

    it('should render badges empty state', () => {
      const result = renderEmptyState('badges')
      expect(result).toContain('🏆')
      expect(result).toContain("changeTab('challenges')")
    })

    it('should render spots empty state with CTA', () => {
      const result = renderEmptyState('spots')
      expect(result).toContain('📍')
      expect(result).toContain('openAddSpot()')
    })

    it('should render events empty state', () => {
      const result = renderEmptyState('events')
      expect(result).toContain('📅')
      expect(result).toContain('openCreateEvent()')
    })

    it('should render companion empty state without CTA button', () => {
      const result = renderEmptyState('companion')
      expect(result).toContain('🤝')
      expect(result).not.toContain('btn-primary')
    })

    it('should render friendTrips empty state without CTA button', () => {
      const result = renderEmptyState('friendTrips')
      expect(result).toContain('👥')
      expect(result).not.toContain('btn-primary')
    })

    it('should render fallback for unknown type', () => {
      const result = renderEmptyState('unknown-type')
      expect(result).toContain('🤷')
      expect(result).not.toContain('btn-primary')
    })

    it('should support compact mode with smaller padding', () => {
      const normal = renderEmptyState('friends')
      const compact = renderEmptyState('friends', { compact: true })
      expect(normal).toContain('py-12')
      expect(compact).toContain('py-6')
    })

    it('should have correct emoji for each type', () => {
      expect(renderEmptyState('conversations')).toContain('💬')
      expect(renderEmptyState('friends')).toContain('🚗')
      expect(renderEmptyState('feed')).toContain('📰')
      expect(renderEmptyState('events')).toContain('📅')
      expect(renderEmptyState('companion')).toContain('🤝')
      expect(renderEmptyState('trips')).toContain('🗺️')
      expect(renderEmptyState('pastTrips')).toContain('📔')
      expect(renderEmptyState('friendTrips')).toContain('👥')
      expect(renderEmptyState('spots')).toContain('📍')
      expect(renderEmptyState('mySpots')).toContain('📍')
      expect(renderEmptyState('favorites')).toContain('⭐')
      expect(renderEmptyState('badges')).toContain('🏆')
      expect(renderEmptyState('references')).toContain('✍️')
      expect(renderEmptyState('chat')).toContain('👋')
    })
  })

  describe('getEmptyStateTypes', () => {
    it('should return all available empty state types', () => {
      const types = getEmptyStateTypes()
      expect(types).toContain('conversations')
      expect(types).toContain('friends')
      expect(types).toContain('feed')
      expect(types).toContain('events')
      expect(types).toContain('companion')
      expect(types).toContain('trips')
      expect(types).toContain('pastTrips')
      expect(types).toContain('friendTrips')
      expect(types).toContain('spots')
      expect(types).toContain('mySpots')
      expect(types).toContain('favorites')
      expect(types).toContain('badges')
      expect(types).toContain('references')
      expect(types).toContain('chat')
    })

    it('should return exactly 14 types', () => {
      const types = getEmptyStateTypes()
      expect(types).toHaveLength(14)
    })
  })
})
