/**
 * Tests for Spot Freshness/Reliability Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getSpotFreshness, renderFreshnessBadge, getFreshnessColor } from '../src/services/spotFreshness.js'
import { getState, setState } from '../src/stores/state.js'

describe('spotFreshness', () => {
  beforeEach(() => {
    setState({ lang: 'fr' })
  })

  describe('getSpotFreshness', () => {
    it('should return RED for dangerous spots', () => {
      const spot = { dangerous: true, globalRating: 4.0 }
      const result = getSpotFreshness(spot)

      expect(result.color).toBe('red')
      expect(result.label).toBe('Déconseillé')
      expect(result.labelEn).toBe('Not recommended')
      expect(result.icon).toBe('times-circle')
    })

    it('should return RED for reported spots', () => {
      const spot = { reported: true, globalRating: 4.0 }
      const result = getSpotFreshness(spot)

      expect(result.color).toBe('red')
      expect(result.label).toBe('Déconseillé')
    })

    it('should return RED for very low rating (< 2.5)', () => {
      const spot = { globalRating: 2.3, lastUsed: '2024-12-01' }
      const result = getSpotFreshness(spot)

      expect(result.color).toBe('red')
      expect(result.label).toBe('Déconseillé')
    })

    it('should return GREEN for recent review (< 6 months)', () => {
      const now = new Date()
      const threeMonthsAgo = new Date(now)
      threeMonthsAgo.setMonth(now.getMonth() - 3)

      const spot = {
        globalRating: 3.0,
        lastUsed: threeMonthsAgo.toISOString().split('T')[0]
      }
      const result = getSpotFreshness(spot)

      expect(result.color).toBe('emerald')
      expect(result.label).toBe('Fiable')
      expect(result.labelEn).toBe('Reliable')
      expect(result.icon).toBe('check-circle')
    })

    it('should return GREEN for high rating (>= 3.5) regardless of date', () => {
      const spot = { globalRating: 4.5, lastUsed: '2022-01-01' }
      const result = getSpotFreshness(spot)

      expect(result.color).toBe('emerald')
      expect(result.label).toBe('Fiable')
    })

    it('should return ORANGE for old spot (18+ months)', () => {
      const now = new Date()
      const twentyMonthsAgo = new Date(now)
      twentyMonthsAgo.setMonth(now.getMonth() - 20)

      const spot = {
        globalRating: 2.8,
        lastUsed: twentyMonthsAgo.toISOString().split('T')[0]
      }
      const result = getSpotFreshness(spot)

      expect(result.color).toBe('orange')
      expect(result.label).toBe('Ancien')
      expect(result.labelEn).toBe('Outdated')
      expect(result.icon).toBe('clock')
    })

    it('should return YELLOW for spots between 6-18 months', () => {
      const now = new Date()
      const tenMonthsAgo = new Date(now)
      tenMonthsAgo.setMonth(now.getMonth() - 10)

      const spot = {
        globalRating: 3.0,
        lastUsed: tenMonthsAgo.toISOString().split('T')[0]
      }
      const result = getSpotFreshness(spot)

      expect(result.color).toBe('amber')
      expect(result.label).toBe('À vérifier')
      expect(result.labelEn).toBe('Needs verification')
      expect(result.icon).toBe('exclamation-circle')
    })

    it('should return YELLOW for spots with no date', () => {
      const spot = { globalRating: 3.0 }
      const result = getSpotFreshness(spot)

      expect(result.color).toBe('amber')
      expect(result.label).toBe('À vérifier')
    })

    it('should handle null spot gracefully', () => {
      const result = getSpotFreshness(null)

      expect(result.color).toBe('amber')
      expect(result.labelEn).toBe('Unknown')
      expect(result.icon).toBe('question-circle')
    })

    it('should check lastReview and lastCheckin fields', () => {
      const now = new Date()
      const twoMonthsAgo = new Date(now)
      twoMonthsAgo.setMonth(now.getMonth() - 2)

      const spot1 = {
        globalRating: 3.0,
        lastReview: twoMonthsAgo.toISOString().split('T')[0]
      }
      const result1 = getSpotFreshness(spot1)
      expect(result1.color).toBe('emerald')

      const spot2 = {
        globalRating: 3.0,
        lastCheckin: twoMonthsAgo.toISOString().split('T')[0]
      }
      const result2 = getSpotFreshness(spot2)
      expect(result2.color).toBe('emerald')
    })

    it('should include all CSS classes', () => {
      const spot = { globalRating: 4.0 }
      const result = getSpotFreshness(spot)

      expect(result.bgClass).toBeDefined()
      expect(result.textClass).toBeDefined()
      expect(result.borderClass).toBeDefined()
    })
  })

  describe('renderFreshnessBadge', () => {
    it('should render HTML badge for reliable spot', () => {
      const spot = { globalRating: 4.0 }
      const html = renderFreshnessBadge(spot)

      expect(html).toContain('Fiable')
      expect(html).toContain('fa-check-circle')
      expect(html).toContain('bg-emerald-500/20')
      expect(html).toContain('text-emerald-400')
    })

    it('should render HTML badge for dangerous spot', () => {
      const spot = { dangerous: true }
      const html = renderFreshnessBadge(spot)

      expect(html).toContain('Déconseillé')
      expect(html).toContain('fa-times-circle')
      expect(html).toContain('bg-red-500/20')
    })

    it('should respect language setting', () => {
      setState({ lang: 'en' })
      const spot = { globalRating: 4.0 }
      const html = renderFreshnessBadge(spot)

      expect(html).toContain('Reliable')
      expect(html).not.toContain('Fiable')
    })

    it('should support Spanish language', () => {
      setState({ lang: 'es' })
      const spot = { dangerous: true }
      const html = renderFreshnessBadge(spot)

      expect(html).toContain('No recomendado')
    })

    it('should support German language', () => {
      setState({ lang: 'de' })
      const spot = { globalRating: 4.0 }
      const html = renderFreshnessBadge(spot)

      expect(html).toContain('Zuverlässig')
    })

    it('should support different sizes', () => {
      const spot = { globalRating: 4.0 }

      const htmlSm = renderFreshnessBadge(spot, 'sm')
      const htmlMd = renderFreshnessBadge(spot, 'md')
      const htmlLg = renderFreshnessBadge(spot, 'lg')

      expect(htmlSm).toContain('text-xs px-1.5 py-0.5')
      expect(htmlMd).toContain('text-xs px-2 py-1')
      expect(htmlLg).toContain('text-sm px-3 py-1.5')
    })

    it('should default to md size', () => {
      const spot = { globalRating: 4.0 }
      const html = renderFreshnessBadge(spot)

      expect(html).toContain('text-xs px-2 py-1')
    })
  })

  describe('getFreshnessColor', () => {
    it('should return emerald hex for reliable spots', () => {
      const spot = { globalRating: 4.0 }
      const color = getFreshnessColor(spot)

      expect(color).toBe('#10b981')
    })

    it('should return red hex for dangerous spots', () => {
      const spot = { dangerous: true }
      const color = getFreshnessColor(spot)

      expect(color).toBe('#ef4444')
    })

    it('should return orange hex for outdated spots', () => {
      const now = new Date()
      const twentyMonthsAgo = new Date(now)
      twentyMonthsAgo.setMonth(now.getMonth() - 20)

      const spot = {
        globalRating: 2.8,
        lastUsed: twentyMonthsAgo.toISOString().split('T')[0]
      }
      const color = getFreshnessColor(spot)

      expect(color).toBe('#f97316')
    })

    it('should return amber hex for needs-verification spots', () => {
      const spot = { globalRating: 3.0 }
      const color = getFreshnessColor(spot)

      expect(color).toBe('#f59e0b')
    })
  })

  describe('Priority rules', () => {
    it('RED should override GREEN even with recent review', () => {
      const now = new Date()
      const oneMonthAgo = new Date(now)
      oneMonthAgo.setMonth(now.getMonth() - 1)

      const spot = {
        dangerous: true,
        globalRating: 4.5,
        lastUsed: oneMonthAgo.toISOString().split('T')[0]
      }
      const result = getSpotFreshness(spot)

      expect(result.color).toBe('red')
    })

    it('Recent review should make spot GREEN even with low rating (>= 2.5)', () => {
      const now = new Date()
      const oneMonthAgo = new Date(now)
      oneMonthAgo.setMonth(now.getMonth() - 1)

      const spot = {
        globalRating: 2.8,
        lastUsed: oneMonthAgo.toISOString().split('T')[0]
      }
      const result = getSpotFreshness(spot)

      expect(result.color).toBe('emerald')
    })

    it('Good rating should override old date', () => {
      const spot = {
        globalRating: 4.5,
        lastUsed: '2020-01-01'
      }
      const result = getSpotFreshness(spot)

      expect(result.color).toBe('emerald')
    })
  })

  describe('Edge cases', () => {
    it('should handle rating exactly 2.5 (not red)', () => {
      const spot = { globalRating: 2.5 }
      const result = getSpotFreshness(spot)

      expect(result.color).not.toBe('red')
      expect(result.color).toBe('amber')
    })

    it('should handle rating exactly 3.5 (green)', () => {
      const spot = { globalRating: 3.5 }
      const result = getSpotFreshness(spot)

      expect(result.color).toBe('emerald')
    })

    it('should handle date exactly 6 months ago (green)', () => {
      const now = new Date()
      const sixMonthsAgo = new Date(now)
      sixMonthsAgo.setMonth(now.getMonth() - 6)
      sixMonthsAgo.setDate(sixMonthsAgo.getDate() + 1) // Just under 6 months

      const spot = {
        globalRating: 3.0,
        lastUsed: sixMonthsAgo.toISOString().split('T')[0]
      }
      const result = getSpotFreshness(spot)

      expect(result.color).toBe('emerald')
    })

    it('should handle invalid date format gracefully', () => {
      const spot = {
        globalRating: 3.0,
        lastUsed: 'invalid-date'
      }
      const result = getSpotFreshness(spot)

      expect(result.color).toBe('amber')
    })

    it('should handle both dangerous and reported flags', () => {
      const spot = { dangerous: true, reported: true }
      const result = getSpotFreshness(spot)

      expect(result.color).toBe('red')
    })
  })
})
