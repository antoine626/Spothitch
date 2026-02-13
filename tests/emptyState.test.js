/**
 * Tests for EmptyState component
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderEmptyState, getEmptyStateTypes } from '../src/components/EmptyState.js'

describe('EmptyState Component', () => {
  describe('renderEmptyState', () => {
    it('should render friends empty state with correct message and button', () => {
      const result = renderEmptyState('friends')

      expect(result).toContain('Même les meilleurs routards ont besoin de compagnons')
      expect(result).toContain('Trouver des compagnons')
      expect(result).toContain('<svg')
      expect(result).toContain("changeTab('social')")
    })

    it('should render checkins empty state with correct message and button', () => {
      const result = renderEmptyState('checkins')

      expect(result).toContain("Ton pouce n'a pas encore travaillé")
      expect(result).toContain('Voir la carte')
      expect(result).toContain('<svg')
      expect(result).toContain("changeTab('map')")
    })

    it('should render favorites empty state with correct message and button', () => {
      const result = renderEmptyState('favorites')

      expect(result).toContain("Ta liste de favoris est plus vide qu'une aire d'autoroute à 3h du mat'")
      expect(result).toContain('Découvrir des spots')
      expect(result).toContain('<svg')
      expect(result).toContain("changeTab('spots')")
    })

    it('should render trips empty state with correct message and button', () => {
      const result = renderEmptyState('trips')

      expect(result).toContain("Aucun voyage prévu ? La route t'appelle")
      expect(result).toContain('Planifier un voyage')
      expect(result).toContain('<svg')
      expect(result).toContain("changeTab('planner')")
    })

    it('should render messages empty state with correct message and button', () => {
      const result = renderEmptyState('messages')

      expect(result).toContain("C'est calme ici... Trop calme")
      expect(result).toContain('Aller au chat')
      expect(result).toContain('<svg')
      expect(result).toContain("changeTab('social')")
    })

    it('should render badges empty state with correct message and button', () => {
      const result = renderEmptyState('badges')

      expect(result).toContain("Zéro badge ? Même mon grand-père en a plus que toi")
      expect(result).toContain('Voir les défis')
      expect(result).toContain('<svg')
      expect(result).toContain("changeTab('challenges')")
    })

    it('should render fallback for unknown type', () => {
      const result = renderEmptyState('unknown-type')

      expect(result).toContain('Rien à afficher ici')
      expect(result).not.toContain('btn-primary')
    })

    it('should include proper HTML structure with accessibility attributes', () => {
      const result = renderEmptyState('friends')

      expect(result).toContain('aria-hidden="true"')
      expect(result).toContain('class="btn-primary')
    })

    it('should include animation class for emoji', () => {
      const result = renderEmptyState('friends')

      expect(result).toContain('animate-bounce-slow')
    })

    it('should have correct emoji for each type', () => {
      expect(renderEmptyState('friends')).toContain('🚗')
      expect(renderEmptyState('checkins')).toContain('👍')
      expect(renderEmptyState('favorites')).toContain('⭐')
      expect(renderEmptyState('trips')).toContain('🗺️')
      expect(renderEmptyState('messages')).toContain('💬')
      expect(renderEmptyState('badges')).toContain('🏆')
    })
  })

  describe('getEmptyStateTypes', () => {
    it('should return all available empty state types', () => {
      const types = getEmptyStateTypes()

      expect(types).toContain('friends')
      expect(types).toContain('checkins')
      expect(types).toContain('favorites')
      expect(types).toContain('trips')
      expect(types).toContain('messages')
      expect(types).toContain('badges')
    })

    it('should return exactly 6 types', () => {
      const types = getEmptyStateTypes()

      expect(types).toHaveLength(6)
    })
  })
})
