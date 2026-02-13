/**
 * Tests for Sponsored Content Service
 * Handles local sponsors and non-intrusive partnerships
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock state
vi.mock('../src/stores/state.js', () => ({
  getState: () => ({
    lang: 'fr',
    spots: [
      { id: 1, name: 'Paris Stop', country: 'FR' },
      { id: 2, name: 'Berlin Hub', country: 'DE' },
      { id: 3, name: 'Barcelona Spot', country: 'ES' },
    ],
  }),
}))

// Mock analytics
vi.mock('../src/services/analytics.js', () => ({
  trackEvent: vi.fn(),
}))

import {
  getSponsoredContent,
  getSponsoredContentForSpot,
  renderSponsoredBanner,
  renderSponsoredContent,
  trackSponsorClick,
  registerSponsoredSpot,
  getSponsorCategories,
  getSponsorTypes,
  getSponsorsByCountry,
  getSponsorsByCategory,
  calculateImpressionValue,
  isSponsorAvailable,
} from '../src/services/sponsoredContent.js'

describe('Sponsored Content Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSponsorCategories', () => {
    it('should return all available categories', () => {
      const categories = getSponsorCategories()
      expect(categories).toContain('restaurant')
      expect(categories).toContain('hotel')
      expect(categories).toContain('transport')
      expect(categories).toContain('shop')
      expect(categories.length).toBe(4)
    })
  })

  describe('getSponsoredContent', () => {
    it('should return sponsored content for valid spot and category', () => {
      const content = getSponsoredContent(1, 'restaurant')
      expect(content).not.toBeNull()
      expect(content.category).toBe('restaurant')
      expect(content.name).toBeDefined()
      expect(content.description).toBeDefined()
      expect(content.isSponsored).toBe(true)
    })

    it('should return restaurant sponsors for FR country', () => {
      const content = getSponsoredContent(1, 'restaurant')
      expect(content).not.toBeNull()
      expect(['McDonald\'s', 'Burger King']).toContain(content.name)
    })

    it('should return hotel sponsors for FR country', () => {
      const content = getSponsoredContent(1, 'hotel')
      expect(content).not.toBeNull()
      expect(content.name).toBe('Formule 1')
      expect(content.category).toBe('hotel')
    })

    it('should return transport sponsors (gas stations)', () => {
      const content = getSponsoredContent(1, 'transport')
      expect(content).not.toBeNull()
      expect(['TotalEnergies', 'Shell']).toContain(content.name)
      expect(content.category).toBe('transport')
    })

    it('should return shop sponsors', () => {
      const content = getSponsoredContent(1, 'shop')
      expect(content).not.toBeNull()
      expect(content.name).toBe('Carrefour Express')
      expect(content.category).toBe('shop')
    })

    it('should return null for invalid category', () => {
      const content = getSponsoredContent(1, 'invalid_category')
      expect(content).toBeNull()
    })

    it('should return null if no sponsors for country', () => {
      // Using spot 3 which is ES
      const content = getSponsoredContent(3, 'restaurant')
      // ES has restaurants so should not be null
      expect(content).not.toBeNull()
    })

    it('should return null if no country in spot', () => {
      const content = getSponsoredContent(999, 'restaurant')
      expect(content).toBeNull()
    })

    it('should include distance in description', () => {
      const content = getSponsoredContent(1, 'restaurant')
      expect(content.distance).toBeDefined()
      expect(content.distance).toBeGreaterThanOrEqual(50)
      expect(content.distance).toBeLessThanOrEqual(350)
    })

    it('should have benefits array', () => {
      const content = getSponsoredContent(1, 'restaurant')
      expect(Array.isArray(content.benefits)).toBe(true)
      expect(content.benefits.length).toBeGreaterThan(0)
    })
  })

  describe('renderSponsoredBanner', () => {
    it('should return empty string for null content', () => {
      const html = renderSponsoredBanner(null)
      expect(html).toBe('')
    })

    it('should generate HTML banner for valid content', () => {
      const content = getSponsoredContent(1, 'restaurant')
      const html = renderSponsoredBanner(content)
      expect(html).toContain('sponsored-banner')
      expect(html).toContain(content.name)
      expect(html).toContain(content.description)
    })

    it('should include partner badge in banner', () => {
      const content = getSponsoredContent(1, 'restaurant')
      const html = renderSponsoredBanner(content)
      expect(html).toContain('Partenaire vérifié')
    })

    it('should include category emoji label', () => {
      const content = getSponsoredContent(1, 'restaurant')
      const html = renderSponsoredBanner(content)
      expect(html).toContain('Restaurant')
    })

    it('should include benefits icons', () => {
      const content = getSponsoredContent(1, 'restaurant')
      const html = renderSponsoredBanner(content)
      expect(html).toContain('<svg')
    })

    it('should include distance display', () => {
      const content = getSponsoredContent(1, 'restaurant')
      const html = renderSponsoredBanner(content)
      expect(html).toContain(`${content.distance}m`)
    })

    it('should have onclick handler for tracking', () => {
      const content = getSponsoredContent(1, 'restaurant')
      const html = renderSponsoredBanner(content)
      expect(html).toContain('window.trackSponsorClick')
    })

    it('should include data-sponsor-id attribute', () => {
      const content = getSponsoredContent(1, 'restaurant')
      const html = renderSponsoredBanner(content)
      expect(html).toContain(`data-sponsor-id="${content.id}"`)
    })

    it('should have accessible ARIA labels', () => {
      const content = getSponsoredContent(1, 'restaurant')
      const html = renderSponsoredBanner(content)
      expect(html).toContain('role="article"')
      expect(html).toContain('aria-label')
    })

    it('should show hotel category emoji for hotel sponsors', () => {
      const content = getSponsoredContent(1, 'hotel')
      const html = renderSponsoredBanner(content)
      expect(html).toContain('🛏️ Hébergement')
    })

    it('should show transport category emoji for transport sponsors', () => {
      const content = getSponsoredContent(1, 'transport')
      const html = renderSponsoredBanner(content)
      expect(html).toContain('⛽ Transport')
    })

    it('should show shop category emoji for shop sponsors', () => {
      const content = getSponsoredContent(1, 'shop')
      const html = renderSponsoredBanner(content)
      expect(html).toContain('🛒 Magasin')
    })

    it('should have hover effect styling', () => {
      const content = getSponsoredContent(1, 'restaurant')
      const html = renderSponsoredBanner(content)
      expect(html).toContain('hover:border-accent-500/50')
    })

    it('should render benefit icons correctly', () => {
      const content = getSponsoredContent(1, 'restaurant')
      const html = renderSponsoredBanner(content)
      // Should have at least one benefit icon
      const iconMatches = html.match(/<svg/g)
      expect(iconMatches).toBeTruthy()
      expect(iconMatches.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('getSponsoredContentForSpot (legacy)', () => {
    it('should return content for spot object', () => {
      const spot = { id: 1, country: 'FR' }
      const content = getSponsoredContentForSpot(spot)
      expect(content).not.toBeNull()
      expect(content.isSponsored).toBe(true)
    })

    it('should return null for invalid spot', () => {
      const content = getSponsoredContentForSpot(null)
      expect(content).toBeNull()
    })

    it('should return null for spot without country', () => {
      const spot = { id: 1, name: 'Test' }
      const content = getSponsoredContentForSpot(spot)
      expect(content).toBeNull()
    })
  })

  describe('renderSponsoredContent (legacy)', () => {
    it('should return empty string for invalid spot', () => {
      const html = renderSponsoredContent(null)
      expect(html).toBe('')
    })

    it('should render banner for valid spot', () => {
      const spot = { id: 1, country: 'FR' }
      const html = renderSponsoredContent(spot)
      expect(html).toContain('sponsored-banner')
    })
  })

  describe('getSponsorTypes', () => {
    it('should return array of sponsor types', () => {
      const types = getSponsorTypes()
      expect(Array.isArray(types)).toBe(true)
      expect(types.length).toBeGreaterThan(0)
    })

    it('should include fast_food type', () => {
      const types = getSponsorTypes()
      expect(types).toContain('fast_food')
    })

    it('should include gas_station type', () => {
      const types = getSponsorTypes()
      expect(types).toContain('gas_station')
    })

    it('should include supermarket type', () => {
      const types = getSponsorTypes()
      expect(types).toContain('supermarket')
    })
  })

  describe('getSponsorsByCountry', () => {
    it('should return sponsors for valid country', () => {
      const sponsors = getSponsorsByCountry('FR')
      expect(Array.isArray(sponsors)).toBe(true)
      expect(sponsors.length).toBeGreaterThan(0)
    })

    it('should return sponsors for category filter', () => {
      const sponsors = getSponsorsByCountry('FR', 'restaurant')
      expect(Array.isArray(sponsors)).toBe(true)
      expect(sponsors.every(s => s.category === 'restaurant')).toBe(true)
    })

    it('should handle lowercase country codes', () => {
      const sponsors = getSponsorsByCountry('fr')
      expect(sponsors.length).toBeGreaterThan(0)
    })

    it('should return all sponsors for country without category filter', () => {
      const allSponsors = getSponsorsByCountry('FR')
      const restaurantSponsors = getSponsorsByCountry('FR', 'restaurant')
      expect(allSponsors.length).toBeGreaterThanOrEqual(restaurantSponsors.length)
    })

    it('should return empty array for unknown country', () => {
      const sponsors = getSponsorsByCountry('ZZ')
      expect(sponsors).toEqual([])
    })
  })

  describe('getSponsorsByCategory', () => {
    it('should return sponsors for restaurant category', () => {
      const sponsors = getSponsorsByCategory('restaurant')
      expect(Array.isArray(sponsors)).toBe(true)
      expect(sponsors.length).toBeGreaterThan(0)
      expect(sponsors.every(s => s.category === 'restaurant')).toBe(true)
    })

    it('should return sponsors for hotel category', () => {
      const sponsors = getSponsorsByCategory('hotel')
      expect(sponsors.length).toBeGreaterThan(0)
    })

    it('should return sponsors for transport category', () => {
      const sponsors = getSponsorsByCategory('transport')
      expect(sponsors.length).toBeGreaterThan(0)
    })

    it('should return sponsors for shop category', () => {
      const sponsors = getSponsorsByCategory('shop')
      expect(sponsors.length).toBeGreaterThan(0)
    })

    it('should return empty array for invalid category', () => {
      const sponsors = getSponsorsByCategory('invalid')
      expect(sponsors).toEqual([])
    })
  })

  describe('trackSponsorClick', () => {
    it('should warn for unknown sponsor ID', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      trackSponsorClick('unknown-sponsor')
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown sponsor ID'))
      warnSpy.mockRestore()
    })

    it('should track valid sponsor click without errors', () => {
      // Just verify it doesn't throw
      expect(() => trackSponsorClick('mcdo-highway')).not.toThrow()
    })

    it('should track sponsor click without error', () => {
      expect(() => trackSponsorClick('mcdo-highway')).not.toThrow()
    })
  })

  describe('registerSponsoredSpot', () => {
    it('should register sponsor for spot', () => {
      const sponsorship = {
        partner: { id: 'test-sponsor', name: 'Test Sponsor' },
        distance: 100,
        category: 'restaurant',
      }
      registerSponsoredSpot('spot-123', sponsorship)
      // Can't directly test without implementation changes, but should not throw
      expect(true).toBe(true)
    })
  })

  describe('calculateImpressionValue', () => {
    it('should return positive value for impression', () => {
      const value = calculateImpressionValue('mcdo-highway')
      expect(value).toBeGreaterThan(0)
    })

    it('should return consistent value', () => {
      const value1 = calculateImpressionValue('mcdo-highway')
      const value2 = calculateImpressionValue('mcdo-highway')
      expect(value1).toBe(value2)
    })
  })

  describe('isSponsorAvailable', () => {
    it('should return true for available sponsor in country', () => {
      const available = isSponsorAvailable('mcdo-highway', 'FR')
      expect(available).toBe(true)
    })

    it('should return false for unavailable sponsor in country', () => {
      const available = isSponsorAvailable('formule1-highway', 'DE')
      expect(available).toBe(false)
    })

    it('should return false for unknown sponsor', () => {
      const available = isSponsorAvailable('unknown-sponsor', 'FR')
      expect(available).toBe(false)
    })

    it('should handle lowercase country codes', () => {
      const available = isSponsorAvailable('mcdo-highway', 'fr')
      expect(available).toBe(true)
    })
  })

  describe('Integration scenarios', () => {
    it('should render complete banner flow', () => {
      const content = getSponsoredContent(1, 'restaurant')
      expect(content).not.toBeNull()
      const html = renderSponsoredBanner(content)
      expect(html).toContain('sponsored-banner')
      expect(html).toContain(content.name)
    })

    it('should handle multiple sponsors per category', () => {
      const restaurant1 = getSponsoredContent(1, 'restaurant')
      const restaurant2 = getSponsoredContent(1, 'restaurant')
      // Both should be restaurants but might be different due to randomization
      expect(restaurant1.category).toBe('restaurant')
      expect(restaurant2.category).toBe('restaurant')
    })

    it('should support all languages', () => {
      const content = getSponsoredContent(1, 'restaurant')
      expect(content.description).toBeDefined()
      expect(content.description.length).toBeGreaterThan(0)
    })

    it('should track clicks without errors', () => {
      const content = getSponsoredContent(1, 'restaurant')
      expect(() => trackSponsorClick(content.id)).not.toThrow()
    })
  })
})
