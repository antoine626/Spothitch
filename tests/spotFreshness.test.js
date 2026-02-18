/**
 * Tests for Spot Freshness/Reliability Service
 * New system: user validations (not HitchWiki globalRating)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { getSpotFreshness, getSpotAge, renderFreshnessBadge, renderAgeBadge, getFreshnessColor } from '../src/services/spotFreshness.js'
import { setState } from '../src/stores/state.js'

describe('spotFreshness', () => {
  beforeEach(() => {
    setState({ lang: 'fr' })
  })

  describe('getSpotFreshness — reliability by user validations', () => {
    it('should return SLATE for null spot', () => {
      const result = getSpotFreshness(null)
      expect(result.color).toBe('slate')
      expect(result.labelKey).toBe('unverifiedSpot')
      expect(result.icon).toBe('help-circle')
    })

    it('should return SLATE for unverified spot (0 validations)', () => {
      const spot = { userValidations: 0 }
      const result = getSpotFreshness(spot)
      expect(result.color).toBe('slate')
      expect(result.labelKey).toBe('unverifiedSpot')
    })

    it('should return SLATE for spot with no userValidations field', () => {
      const spot = { globalRating: 4.5 }
      const result = getSpotFreshness(spot)
      expect(result.color).toBe('slate')
    })

    it('should return AMBER for 1 validation', () => {
      const spot = { userValidations: 1 }
      const result = getSpotFreshness(spot)
      expect(result.color).toBe('amber')
      expect(result.labelKey).toBe('partiallyVerified')
      expect(result.icon).toBe('circle-alert')
    })

    it('should return AMBER for 2 validations', () => {
      const spot = { userValidations: 2 }
      const result = getSpotFreshness(spot)
      expect(result.color).toBe('amber')
    })

    it('should return EMERALD for 3 validations', () => {
      const spot = { userValidations: 3 }
      const result = getSpotFreshness(spot)
      expect(result.color).toBe('emerald')
      expect(result.labelKey).toBe('reliableSpot')
      expect(result.icon).toBe('circle-check')
    })

    it('should return EMERALD for 4 validations', () => {
      const spot = { userValidations: 4 }
      const result = getSpotFreshness(spot)
      expect(result.color).toBe('emerald')
    })

    it('should return BLUE for 5 validations (very reliable)', () => {
      const spot = { userValidations: 5 }
      const result = getSpotFreshness(spot)
      expect(result.color).toBe('blue')
      expect(result.labelKey).toBe('veryReliableSpot')
      expect(result.icon).toBe('shield-check')
    })

    it('should return BLUE for 10+ validations', () => {
      const spot = { userValidations: 10 }
      const result = getSpotFreshness(spot)
      expect(result.color).toBe('blue')
    })

    it('should return RED for dangerous spot', () => {
      const spot = { dangerous: true, userValidations: 5 }
      const result = getSpotFreshness(spot)
      expect(result.color).toBe('red')
      expect(result.labelKey).toBe('dangerousSpot')
      expect(result.icon).toBe('triangle-alert')
    })

    it('should return RED for reported spot', () => {
      const spot = { reported: true, userValidations: 3 }
      const result = getSpotFreshness(spot)
      expect(result.color).toBe('red')
    })

    it('should return PURPLE for ambassador-verified spot', () => {
      const spot = { ambassadorVerified: true, userValidations: 2 }
      const result = getSpotFreshness(spot)
      expect(result.color).toBe('purple')
      expect(result.labelKey).toBe('ambassadorVerified')
      expect(result.icon).toBe('badge-check')
    })

    it('should include all CSS classes', () => {
      const spot = { userValidations: 3 }
      const result = getSpotFreshness(spot)
      expect(result.bgClass).toBeDefined()
      expect(result.textClass).toBeDefined()
      expect(result.borderClass).toBeDefined()
    })
  })

  describe('Priority rules', () => {
    it('RED overrides BLUE even with 10 validations', () => {
      const spot = { dangerous: true, userValidations: 10 }
      expect(getSpotFreshness(spot).color).toBe('red')
    })

    it('RED overrides PURPLE', () => {
      const spot = { dangerous: true, ambassadorVerified: true, userValidations: 5 }
      expect(getSpotFreshness(spot).color).toBe('red')
    })

    it('PURPLE overrides BLUE', () => {
      const spot = { ambassadorVerified: true, userValidations: 10 }
      expect(getSpotFreshness(spot).color).toBe('purple')
    })

    it('Both dangerous and reported gives RED', () => {
      const spot = { dangerous: true, reported: true }
      expect(getSpotFreshness(spot).color).toBe('red')
    })
  })

  describe('getSpotAge — freshness by date', () => {
    it('should return unknownAge for spot with no dates', () => {
      const spot = {}
      const age = getSpotAge(spot)
      expect(age.labelKey).toBe('unknownAge')
    })

    it('should return freshSpot for spot < 1 year old', () => {
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      const spot = { lastCheckin: threeMonthsAgo.toISOString() }
      const age = getSpotAge(spot)
      expect(age.labelKey).toBe('freshSpot')
      expect(age.icon).toBe('sparkles')
    })

    it('should return agingSpot for spot 1-3 years old', () => {
      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
      const spot = { lastUsed: twoYearsAgo.toISOString() }
      const age = getSpotAge(spot)
      expect(age.labelKey).toBe('agingSpot')
    })

    it('should return oldSpot for spot 3-5 years old', () => {
      const fourYearsAgo = new Date()
      fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4)
      const spot = { lastUsed: fourYearsAgo.toISOString() }
      const age = getSpotAge(spot)
      expect(age.labelKey).toBe('oldSpot')
    })

    it('should use createdAt as fallback', () => {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      const spot = { createdAt: sixMonthsAgo.toISOString() }
      const age = getSpotAge(spot)
      expect(age.labelKey).toBe('freshSpot')
    })
  })

  describe('renderFreshnessBadge', () => {
    it('should render HTML badge for reliable spot', () => {
      const spot = { userValidations: 3 }
      const html = renderFreshnessBadge(spot)
      expect(html).toContain('<svg')
      expect(html).toContain('bg-emerald-500/20')
      expect(html).toContain('text-emerald-400')
    })

    it('should render HTML badge for dangerous spot', () => {
      const spot = { dangerous: true }
      const html = renderFreshnessBadge(spot)
      expect(html).toContain('<svg')
      expect(html).toContain('bg-red-500/20')
    })

    it('should render badge for unverified spot', () => {
      const spot = { userValidations: 0 }
      const html = renderFreshnessBadge(spot)
      expect(html).toContain('bg-slate-500/20')
    })

    it('should show validation count in badge', () => {
      const spot = { userValidations: 7 }
      const html = renderFreshnessBadge(spot)
      expect(html).toContain('(7)')
    })

    it('should not show count for 0 validations', () => {
      const spot = { userValidations: 0 }
      const html = renderFreshnessBadge(spot)
      expect(html).not.toContain('(0)')
    })

    it('should support different sizes', () => {
      const spot = { userValidations: 3 }

      const htmlSm = renderFreshnessBadge(spot, 'sm')
      const htmlMd = renderFreshnessBadge(spot, 'md')
      const htmlLg = renderFreshnessBadge(spot, 'lg')

      expect(htmlSm).toContain('text-xs px-1.5 py-0.5')
      expect(htmlMd).toContain('text-xs px-2 py-1')
      expect(htmlLg).toContain('text-sm px-3 py-1.5')
    })

    it('should default to md size', () => {
      const spot = { userValidations: 3 }
      const html = renderFreshnessBadge(spot)
      expect(html).toContain('text-xs px-2 py-1')
    })
  })

  describe('renderAgeBadge', () => {
    it('should render age badge', () => {
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      const spot = { lastCheckin: threeMonthsAgo.toISOString() }
      const html = renderAgeBadge(spot)
      expect(html).toContain('<svg')
      expect(html).toContain('bg-emerald-500/20')
    })

    it('should default to sm size', () => {
      const spot = { lastCheckin: new Date().toISOString() }
      const html = renderAgeBadge(spot)
      expect(html).toContain('text-xs px-1.5 py-0.5')
    })
  })

  describe('getFreshnessColor — hex colors for markers', () => {
    it('should return slate hex for unverified spots', () => {
      const spot = { userValidations: 0 }
      expect(getFreshnessColor(spot)).toBe('#94a3b8')
    })

    it('should return amber hex for partially verified spots', () => {
      const spot = { userValidations: 1 }
      expect(getFreshnessColor(spot)).toBe('#f59e0b')
    })

    it('should return emerald hex for reliable spots', () => {
      const spot = { userValidations: 3 }
      expect(getFreshnessColor(spot)).toBe('#10b981')
    })

    it('should return blue hex for very reliable spots', () => {
      const spot = { userValidations: 5 }
      expect(getFreshnessColor(spot)).toBe('#3b82f6')
    })

    it('should return purple hex for ambassador-verified spots', () => {
      const spot = { ambassadorVerified: true }
      expect(getFreshnessColor(spot)).toBe('#a855f7')
    })

    it('should return red hex for dangerous spots', () => {
      const spot = { dangerous: true }
      expect(getFreshnessColor(spot)).toBe('#ef4444')
    })
  })
})
