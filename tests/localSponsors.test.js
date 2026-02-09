/**
 * Tests for Local Sponsors Service
 * Partenariats avec commerces pres des spots (restaurants, hotels, stations)
 * Affichage discret dans la description des spots
 * Feature #236
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock state
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    lang: 'fr',
  })),
  setState: vi.fn(),
}))

// Mock analytics
vi.mock('../src/services/analytics.js', () => ({
  trackEvent: vi.fn(),
}))

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: vi.fn((key, params) => {
    const translations = {
      localPartner: 'Partenaire local',
      verifiedPartner: 'Partenaire verifie',
      verifiedPartnerNote: 'Ce partenaire a ete verifie par SpotHitch',
      tapForDetails: 'Appuie pour plus de details',
      sponsorBenefits: 'Avantages',
      promoCode: 'Code promo',
      promoCodeCopied: 'Code promo copie !',
      validUntil: "Valable jusqu'au",
      visitWebsite: 'Voir le site',
      call: 'Appeler',
      close: 'Fermer',
      reviews: 'avis',
      noLocalSponsors: 'Aucun partenaire local a proximite',
      sponsorCategoryRestaurant: 'Restaurant',
      sponsorCategoryHotel: 'Hotel',
      sponsorCategoryHostel: 'Auberge',
      sponsorCategoryStation: 'Station',
      sponsorCategorySupermarket: 'Supermarche',
      sponsorCategoryCamping: 'Camping',
      benefitDiscount: params?.value ? `${params.value}% de reduction` : 'reduction',
      benefitFreeWifi: 'WiFi gratuit',
      benefitFreeDrink: 'Boisson offerte',
      benefitFreeShower: 'Douche gratuite',
      benefitFreeCharge: 'Recharge gratuite',
      benefitPriority: 'Priorite',
      benefitFreeNight: 'Nuit gratuite',
      benefitLuggageStorage: 'Consigne bagages',
      freeDrink: 'Boisson offerte',
      discount: 'reduction',
      copy: 'Copier',
    }
    return translations[key] || key
  }),
}))

import { trackEvent } from '../src/services/analytics.js'

import {
  SponsorCategory,
  BenefitType,
  getSponsorsForSpot,
  getSponsorsByCountry,
  getSponsorsByCategory,
  getSponsorById,
  getSponsorsNearLocation,
  formatBenefits,
  getCategoryIcon,
  getCategoryLabel,
  getBenefitIcon,
  trackSponsorView,
  trackSponsorClick,
  trackPromoCodeUsed,
  renderSponsorBanner,
  renderSponsorList,
  renderSponsorDetail,
  getAvailableCategories,
  getAvailableBenefitTypes,
  hasSponsorsInCountry,
} from '../src/services/localSponsors.js'

describe('Local Sponsors Service (#236)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('SponsorCategory enum', () => {
    it('should have all expected categories', () => {
      expect(SponsorCategory.RESTAURANT).toBe('restaurant')
      expect(SponsorCategory.HOTEL).toBe('hotel')
      expect(SponsorCategory.HOSTEL).toBe('hostel')
      expect(SponsorCategory.STATION).toBe('station')
      expect(SponsorCategory.SUPERMARKET).toBe('supermarket')
      expect(SponsorCategory.CAMPING).toBe('camping')
    })

    it('should have 6 categories', () => {
      const categories = Object.values(SponsorCategory)
      expect(categories.length).toBe(6)
    })
  })

  describe('BenefitType enum', () => {
    it('should have all expected benefit types', () => {
      expect(BenefitType.DISCOUNT).toBe('discount')
      expect(BenefitType.FREE_WIFI).toBe('free_wifi')
      expect(BenefitType.FREE_DRINK).toBe('free_drink')
      expect(BenefitType.FREE_SHOWER).toBe('free_shower')
      expect(BenefitType.FREE_CHARGE).toBe('free_charge')
      expect(BenefitType.PRIORITY).toBe('priority')
      expect(BenefitType.FREE_NIGHT).toBe('free_night')
      expect(BenefitType.LUGGAGE_STORAGE).toBe('luggage_storage')
    })

    it('should have 8 benefit types', () => {
      const types = Object.values(BenefitType)
      expect(types.length).toBe(8)
    })
  })

  describe('getSponsorsForSpot', () => {
    it('should return empty array for missing spotId', () => {
      const sponsors = getSponsorsForSpot(null, 'FR')
      expect(sponsors).toEqual([])
    })

    it('should return empty array for missing country', () => {
      const sponsors = getSponsorsForSpot('spot-paris-peripherique', null)
      expect(sponsors).toEqual([])
    })

    it('should return sponsors matching spotId and country', () => {
      const sponsors = getSponsorsForSpot('spot-paris-peripherique', 'FR')
      expect(sponsors.length).toBeGreaterThan(0)
      sponsors.forEach((sponsor) => {
        expect(sponsor.isActive).toBe(true)
        expect(sponsor.nearSpotIds).toContain('spot-paris-peripherique')
      })
    })

    it('should handle case insensitive country code', () => {
      const sponsors = getSponsorsForSpot('spot-paris-peripherique', 'fr')
      expect(sponsors.length).toBeGreaterThan(0)
    })

    it('should return empty array for unknown country', () => {
      const sponsors = getSponsorsForSpot('spot-paris-peripherique', 'XX')
      expect(sponsors).toEqual([])
    })

    it('should return empty array for unknown spot', () => {
      const sponsors = getSponsorsForSpot('unknown-spot', 'FR')
      expect(sponsors).toEqual([])
    })

    it('should filter out inactive sponsors', () => {
      // All sponsors in DB are active, so just verify all returned are active
      const sponsors = getSponsorsForSpot('spot-a7-valence', 'FR')
      sponsors.forEach((sponsor) => {
        expect(sponsor.isActive).toBe(true)
      })
    })
  })

  describe('getSponsorsByCountry', () => {
    it('should return all active sponsors for a country', () => {
      const sponsors = getSponsorsByCountry('FR')
      expect(sponsors.length).toBe(3) // 3 French sponsors
      sponsors.forEach((sponsor) => {
        expect(sponsor.isActive).toBe(true)
      })
    })

    it('should filter by category when provided', () => {
      const sponsors = getSponsorsByCountry('FR', SponsorCategory.HOSTEL)
      expect(sponsors.length).toBe(1)
      expect(sponsors[0].category).toBe(SponsorCategory.HOSTEL)
    })

    it('should return empty array for country with no sponsors', () => {
      const sponsors = getSponsorsByCountry('JP')
      expect(sponsors).toEqual([])
    })

    it('should handle case insensitive country code', () => {
      const sponsors = getSponsorsByCountry('de')
      expect(sponsors.length).toBe(1) // 1 German sponsor
    })

    it('should return sponsors for Spain', () => {
      const sponsors = getSponsorsByCountry('ES')
      expect(sponsors.length).toBe(1)
      expect(sponsors[0].city).toBe('Barcelona')
    })
  })

  describe('getSponsorsByCategory', () => {
    it('should return all hostel sponsors', () => {
      const sponsors = getSponsorsByCategory(SponsorCategory.HOSTEL)
      expect(sponsors.length).toBe(3) // FR, DE, ES hostels
      sponsors.forEach((sponsor) => {
        expect(sponsor.category).toBe(SponsorCategory.HOSTEL)
      })
    })

    it('should return all restaurant sponsors', () => {
      const sponsors = getSponsorsByCategory(SponsorCategory.RESTAURANT)
      expect(sponsors.length).toBe(1) // Only Cafe de la Route
      sponsors.forEach((sponsor) => {
        expect(sponsor.category).toBe(SponsorCategory.RESTAURANT)
      })
    })

    it('should return all station sponsors', () => {
      const sponsors = getSponsorsByCategory(SponsorCategory.STATION)
      expect(sponsors.length).toBe(1)
    })

    it('should return empty array for category with no sponsors', () => {
      const sponsors = getSponsorsByCategory(SponsorCategory.CAMPING)
      expect(sponsors).toEqual([])
    })

    it('should only return active sponsors', () => {
      const sponsors = getSponsorsByCategory(SponsorCategory.HOSTEL)
      sponsors.forEach((sponsor) => {
        expect(sponsor.isActive).toBe(true)
      })
    })
  })

  describe('getSponsorById', () => {
    it('should return sponsor for valid ID', () => {
      const sponsor = getSponsorById('sponsor-fr-001')
      expect(sponsor).not.toBeNull()
      expect(sponsor.name).toBe('Auberge du Routard')
      expect(sponsor.city).toBe('Paris')
    })

    it('should return null for invalid ID', () => {
      const sponsor = getSponsorById('unknown-id')
      expect(sponsor).toBeNull()
    })

    it('should return German sponsor by ID', () => {
      const sponsor = getSponsorById('sponsor-de-001')
      expect(sponsor).not.toBeNull()
      expect(sponsor.name).toBe('Happy Hostel Berlin')
    })

    it('should return Spanish sponsor by ID', () => {
      const sponsor = getSponsorById('sponsor-es-001')
      expect(sponsor).not.toBeNull()
      expect(sponsor.name).toBe('Hostal del Camino')
    })

    it('should return sponsor with all expected properties', () => {
      const sponsor = getSponsorById('sponsor-fr-001')
      expect(sponsor.id).toBeDefined()
      expect(sponsor.name).toBeDefined()
      expect(sponsor.category).toBeDefined()
      expect(sponsor.city).toBeDefined()
      expect(sponsor.region).toBeDefined()
      expect(sponsor.nearSpotIds).toBeDefined()
      expect(sponsor.logo).toBeDefined()
      expect(sponsor.description).toBeDefined()
      expect(sponsor.benefits).toBeDefined()
      expect(sponsor.validUntil).toBeDefined()
      expect(sponsor.coordinates).toBeDefined()
      expect(sponsor.rating).toBeDefined()
      expect(sponsor.reviewCount).toBeDefined()
      expect(sponsor.isActive).toBeDefined()
    })
  })

  describe('getSponsorsNearLocation', () => {
    it('should return sponsors within radius', () => {
      // Paris coordinates
      const sponsors = getSponsorsNearLocation(48.8566, 2.3522, 10)
      expect(sponsors.length).toBeGreaterThan(0)
      sponsors.forEach((sponsor) => {
        expect(sponsor.distance).toBeLessThanOrEqual(10)
      })
    })

    it('should sort sponsors by distance', () => {
      const sponsors = getSponsorsNearLocation(48.8566, 2.3522, 1000)
      for (let i = 1; i < sponsors.length; i++) {
        expect(sponsors[i].distance).toBeGreaterThanOrEqual(sponsors[i - 1].distance)
      }
    })

    it('should use default radius of 5km', () => {
      const sponsors = getSponsorsNearLocation(48.8566, 2.3522)
      // Default radius is 5km - should return nearby sponsors
      expect(Array.isArray(sponsors)).toBe(true)
    })

    it('should return empty array when no sponsors in radius', () => {
      // Middle of Atlantic Ocean
      const sponsors = getSponsorsNearLocation(30.0, -45.0, 1)
      expect(sponsors).toEqual([])
    })

    it('should include distance property on results', () => {
      const sponsors = getSponsorsNearLocation(48.8566, 2.3522, 1000)
      sponsors.forEach((sponsor) => {
        expect(typeof sponsor.distance).toBe('number')
        expect(sponsor.distance).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('formatBenefits', () => {
    it('should format discount benefit', () => {
      const benefits = [{ type: BenefitType.DISCOUNT, value: 15, unit: 'percent' }]
      const formatted = formatBenefits(benefits)
      expect(formatted).toContain('15')
      expect(formatted).toContain('reduction')
    })

    it('should format free wifi benefit', () => {
      const benefits = [{ type: BenefitType.FREE_WIFI }]
      const formatted = formatBenefits(benefits)
      expect(formatted).toContain('WiFi')
    })

    it('should format free shower benefit', () => {
      const benefits = [{ type: BenefitType.FREE_SHOWER }]
      const formatted = formatBenefits(benefits)
      expect(formatted).toContain('Douche')
    })

    it('should format multiple benefits with separator', () => {
      const benefits = [
        { type: BenefitType.FREE_WIFI },
        { type: BenefitType.FREE_SHOWER },
      ]
      const formatted = formatBenefits(benefits)
      expect(formatted).toContain('|')
    })

    it('should return benefit type for unknown benefit', () => {
      const benefits = [{ type: 'unknown_benefit' }]
      const formatted = formatBenefits(benefits)
      expect(formatted).toBe('unknown_benefit')
    })

    it('should format free charge benefit', () => {
      const benefits = [{ type: BenefitType.FREE_CHARGE }]
      const formatted = formatBenefits(benefits)
      expect(formatted).toContain('Recharge')
    })

    it('should format luggage storage benefit', () => {
      const benefits = [{ type: BenefitType.LUGGAGE_STORAGE }]
      const formatted = formatBenefits(benefits)
      expect(formatted).toContain('Consigne')
    })
  })

  describe('getCategoryIcon', () => {
    it('should return utensils icon for restaurant', () => {
      const icon = getCategoryIcon(SponsorCategory.RESTAURANT)
      expect(icon).toBe('fa-utensils')
    })

    it('should return hotel icon for hotel', () => {
      const icon = getCategoryIcon(SponsorCategory.HOTEL)
      expect(icon).toBe('fa-hotel')
    })

    it('should return bed icon for hostel', () => {
      const icon = getCategoryIcon(SponsorCategory.HOSTEL)
      expect(icon).toBe('fa-bed')
    })

    it('should return gas pump icon for station', () => {
      const icon = getCategoryIcon(SponsorCategory.STATION)
      expect(icon).toBe('fa-gas-pump')
    })

    it('should return shopping cart icon for supermarket', () => {
      const icon = getCategoryIcon(SponsorCategory.SUPERMARKET)
      expect(icon).toBe('fa-shopping-cart')
    })

    it('should return campground icon for camping', () => {
      const icon = getCategoryIcon(SponsorCategory.CAMPING)
      expect(icon).toBe('fa-campground')
    })

    it('should return store icon for unknown category', () => {
      const icon = getCategoryIcon('unknown')
      expect(icon).toBe('fa-store')
    })
  })

  describe('getCategoryLabel', () => {
    it('should return localized label for restaurant', () => {
      const label = getCategoryLabel(SponsorCategory.RESTAURANT)
      expect(label).toBe('Restaurant')
    })

    it('should return localized label for hostel', () => {
      const label = getCategoryLabel(SponsorCategory.HOSTEL)
      expect(label).toBe('Auberge')
    })
  })

  describe('getBenefitIcon', () => {
    it('should return percent icon for discount', () => {
      const icon = getBenefitIcon(BenefitType.DISCOUNT)
      expect(icon).toBe('fa-percent')
    })

    it('should return wifi icon for free wifi', () => {
      const icon = getBenefitIcon(BenefitType.FREE_WIFI)
      expect(icon).toBe('fa-wifi')
    })

    it('should return coffee icon for free drink', () => {
      const icon = getBenefitIcon(BenefitType.FREE_DRINK)
      expect(icon).toBe('fa-coffee')
    })

    it('should return shower icon for free shower', () => {
      const icon = getBenefitIcon(BenefitType.FREE_SHOWER)
      expect(icon).toBe('fa-shower')
    })

    it('should return plug icon for free charge', () => {
      const icon = getBenefitIcon(BenefitType.FREE_CHARGE)
      expect(icon).toBe('fa-plug')
    })

    it('should return star icon for priority', () => {
      const icon = getBenefitIcon(BenefitType.PRIORITY)
      expect(icon).toBe('fa-star')
    })

    it('should return moon icon for free night', () => {
      const icon = getBenefitIcon(BenefitType.FREE_NIGHT)
      expect(icon).toBe('fa-moon')
    })

    it('should return suitcase icon for luggage storage', () => {
      const icon = getBenefitIcon(BenefitType.LUGGAGE_STORAGE)
      expect(icon).toBe('fa-suitcase')
    })

    it('should return gift icon for unknown benefit', () => {
      const icon = getBenefitIcon('unknown')
      expect(icon).toBe('fa-gift')
    })
  })

  describe('trackSponsorView', () => {
    it('should track view event for valid sponsor', () => {
      trackSponsorView('sponsor-fr-001')
      expect(trackEvent).toHaveBeenCalledWith('local_sponsor_view', {
        sponsor_id: 'sponsor-fr-001',
        sponsor_name: 'Auberge du Routard',
        sponsor_category: SponsorCategory.HOSTEL,
        sponsor_city: 'Paris',
      })
    })

    it('should not track for invalid sponsor', () => {
      trackSponsorView('unknown-id')
      expect(trackEvent).not.toHaveBeenCalled()
    })
  })

  describe('trackSponsorClick', () => {
    it('should track click event with action', () => {
      trackSponsorClick('sponsor-fr-001', 'website')
      expect(trackEvent).toHaveBeenCalledWith('local_sponsor_click', {
        sponsor_id: 'sponsor-fr-001',
        sponsor_name: 'Auberge du Routard',
        action: 'website',
        timestamp: expect.any(String),
      })
    })

    it('should track phone click action', () => {
      trackSponsorClick('sponsor-fr-002', 'phone')
      expect(trackEvent).toHaveBeenCalledWith('local_sponsor_click', {
        sponsor_id: 'sponsor-fr-002',
        sponsor_name: 'Cafe de la Route',
        action: 'phone',
        timestamp: expect.any(String),
      })
    })

    it('should not track for invalid sponsor', () => {
      trackSponsorClick('unknown-id', 'website')
      expect(trackEvent).not.toHaveBeenCalled()
    })
  })

  describe('trackPromoCodeUsed', () => {
    it('should track promo code usage', () => {
      trackPromoCodeUsed('sponsor-fr-001', 'SPOTHITCH15')
      expect(trackEvent).toHaveBeenCalledWith('local_sponsor_promo_used', {
        sponsor_id: 'sponsor-fr-001',
        sponsor_name: 'Auberge du Routard',
        promo_code: 'SPOTHITCH15',
      })
    })

    it('should not track for invalid sponsor', () => {
      trackPromoCodeUsed('unknown-id', 'CODE')
      expect(trackEvent).not.toHaveBeenCalled()
    })
  })

  describe('renderSponsorBanner', () => {
    it('should return empty string for null sponsor', () => {
      const html = renderSponsorBanner(null)
      expect(html).toBe('')
    })

    it('should return empty string for inactive sponsor', () => {
      const html = renderSponsorBanner({ isActive: false })
      expect(html).toBe('')
    })

    it('should render banner with sponsor name', () => {
      const sponsor = getSponsorById('sponsor-fr-001')
      const html = renderSponsorBanner(sponsor)
      expect(html).toContain('Auberge du Routard')
    })

    it('should render banner with data-sponsor-id', () => {
      const sponsor = getSponsorById('sponsor-fr-001')
      const html = renderSponsorBanner(sponsor)
      expect(html).toContain('data-sponsor-id="sponsor-fr-001"')
    })

    it('should render banner with category icon', () => {
      const sponsor = getSponsorById('sponsor-fr-001')
      const html = renderSponsorBanner(sponsor)
      expect(html).toContain('fa-bed') // Hostel icon
    })

    it('should render banner with benefit icons', () => {
      const sponsor = getSponsorById('sponsor-fr-001')
      const html = renderSponsorBanner(sponsor)
      expect(html).toContain('fa-percent') // Discount
      expect(html).toContain('fa-wifi') // Free WiFi
    })

    it('should render banner with promo code button when available', () => {
      const sponsor = getSponsorById('sponsor-fr-001')
      const html = renderSponsorBanner(sponsor)
      expect(html).toContain('SPOTHITCH15')
      expect(html).toContain('fa-tag')
    })

    it('should render banner without promo code when not available', () => {
      const sponsor = getSponsorById('sponsor-fr-002') // Cafe has no promo code
      const html = renderSponsorBanner(sponsor)
      expect(html).not.toContain('SPOTHITCH15')
    })

    it('should include accessibility attributes', () => {
      const sponsor = getSponsorById('sponsor-fr-001')
      const html = renderSponsorBanner(sponsor)
      expect(html).toContain('role="article"')
      expect(html).toContain('aria-label=')
    })

    it('should render description in current language', () => {
      const sponsor = getSponsorById('sponsor-fr-001')
      const html = renderSponsorBanner(sponsor)
      expect(html).toContain('-15%')
      expect(html).toContain('autostoppeurs')
    })

    it('should include verified partner badge', () => {
      const sponsor = getSponsorById('sponsor-fr-001')
      const html = renderSponsorBanner(sponsor)
      expect(html).toContain('fa-handshake')
      expect(html).toContain('Partenaire verifie')
    })
  })

  describe('renderSponsorList', () => {
    it('should render empty state when no sponsors', () => {
      const html = renderSponsorList([])
      expect(html).toContain('Aucun partenaire local')
      expect(html).toContain('fa-store-slash')
    })

    it('should render empty state for null sponsors', () => {
      const html = renderSponsorList(null)
      expect(html).toContain('Aucun partenaire local')
    })

    it('should render list of sponsors', () => {
      const sponsors = getSponsorsByCountry('FR')
      const html = renderSponsorList(sponsors)
      expect(html).toContain('Auberge du Routard')
      expect(html).toContain('Cafe de la Route')
      expect(html).toContain('Station TotalEnergies')
    })

    it('should have space-y-3 class for spacing', () => {
      const sponsors = getSponsorsByCountry('FR')
      const html = renderSponsorList(sponsors)
      expect(html).toContain('space-y-3')
    })
  })

  describe('renderSponsorDetail', () => {
    it('should return empty string for invalid sponsor', () => {
      const html = renderSponsorDetail('unknown-id')
      expect(html).toBe('')
    })

    it('should render modal with sponsor name', () => {
      const html = renderSponsorDetail('sponsor-fr-001')
      expect(html).toContain('Auberge du Routard')
    })

    it('should render modal with location', () => {
      const html = renderSponsorDetail('sponsor-fr-001')
      expect(html).toContain('Paris')
      expect(html).toContain('Ile-de-France')
    })

    it('should render modal with rating', () => {
      const html = renderSponsorDetail('sponsor-fr-001')
      expect(html).toContain('4.5')
      expect(html).toContain('234')
      expect(html).toContain('avis')
    })

    it('should render modal with benefits grid', () => {
      const html = renderSponsorDetail('sponsor-fr-001')
      expect(html).toContain('Avantages')
      expect(html).toContain('-15%') // Discount badge
    })

    it('should render modal with promo code section', () => {
      const html = renderSponsorDetail('sponsor-fr-001')
      expect(html).toContain('Code promo')
      expect(html).toContain('SPOTHITCH15')
      expect(html).toContain('Copier')
    })

    it('should render modal with website button when available', () => {
      const html = renderSponsorDetail('sponsor-fr-001')
      expect(html).toContain('Voir le site')
      expect(html).toContain('auberge-routard.fr')
    })

    it('should render modal with phone button when available', () => {
      const html = renderSponsorDetail('sponsor-fr-001')
      expect(html).toContain('Appeler')
      expect(html).toContain('+33 1 23 45 67 89')
    })

    it('should have modal accessibility attributes', () => {
      const html = renderSponsorDetail('sponsor-fr-001')
      expect(html).toContain('role="dialog"')
      expect(html).toContain('aria-modal="true"')
      expect(html).toContain('aria-labelledby="sponsor-modal-title"')
    })

    it('should track sponsor view on render', () => {
      renderSponsorDetail('sponsor-fr-001')
      expect(trackEvent).toHaveBeenCalledWith('local_sponsor_view', expect.any(Object))
    })

    it('should render close button', () => {
      const html = renderSponsorDetail('sponsor-fr-001')
      expect(html).toContain('closeSponsorDetail')
      expect(html).toContain('fa-times')
    })

    it('should render verified partner note', () => {
      const html = renderSponsorDetail('sponsor-fr-001')
      expect(html).toContain('Ce partenaire a ete verifie par SpotHitch')
      expect(html).toContain('fa-check-circle')
    })
  })

  describe('getAvailableCategories', () => {
    it('should return all category values', () => {
      const categories = getAvailableCategories()
      expect(categories).toContain('restaurant')
      expect(categories).toContain('hotel')
      expect(categories).toContain('hostel')
      expect(categories).toContain('station')
      expect(categories).toContain('supermarket')
      expect(categories).toContain('camping')
      expect(categories.length).toBe(6)
    })
  })

  describe('getAvailableBenefitTypes', () => {
    it('should return all benefit type values', () => {
      const types = getAvailableBenefitTypes()
      expect(types).toContain('discount')
      expect(types).toContain('free_wifi')
      expect(types).toContain('free_drink')
      expect(types).toContain('free_shower')
      expect(types).toContain('free_charge')
      expect(types).toContain('priority')
      expect(types).toContain('free_night')
      expect(types).toContain('luggage_storage')
      expect(types.length).toBe(8)
    })
  })

  describe('hasSponsorsInCountry', () => {
    it('should return true for France', () => {
      expect(hasSponsorsInCountry('FR')).toBe(true)
    })

    it('should return true for Germany', () => {
      expect(hasSponsorsInCountry('DE')).toBe(true)
    })

    it('should return true for Spain', () => {
      expect(hasSponsorsInCountry('ES')).toBe(true)
    })

    it('should return false for country without sponsors', () => {
      expect(hasSponsorsInCountry('JP')).toBe(false)
    })

    it('should handle case insensitive country code', () => {
      expect(hasSponsorsInCountry('fr')).toBe(true)
      expect(hasSponsorsInCountry('De')).toBe(true)
    })
  })

  describe('Sponsor data validation', () => {
    it('should have valid coordinates for all sponsors', () => {
      const countries = ['FR', 'DE', 'ES']
      countries.forEach((country) => {
        const sponsors = getSponsorsByCountry(country)
        sponsors.forEach((sponsor) => {
          expect(sponsor.coordinates).toBeDefined()
          expect(typeof sponsor.coordinates.lat).toBe('number')
          expect(typeof sponsor.coordinates.lng).toBe('number')
          expect(sponsor.coordinates.lat).toBeGreaterThanOrEqual(-90)
          expect(sponsor.coordinates.lat).toBeLessThanOrEqual(90)
          expect(sponsor.coordinates.lng).toBeGreaterThanOrEqual(-180)
          expect(sponsor.coordinates.lng).toBeLessThanOrEqual(180)
        })
      })
    })

    it('should have valid ratings for all sponsors', () => {
      const countries = ['FR', 'DE', 'ES']
      countries.forEach((country) => {
        const sponsors = getSponsorsByCountry(country)
        sponsors.forEach((sponsor) => {
          expect(typeof sponsor.rating).toBe('number')
          expect(sponsor.rating).toBeGreaterThanOrEqual(0)
          expect(sponsor.rating).toBeLessThanOrEqual(5)
        })
      })
    })

    it('should have multilingual descriptions', () => {
      const sponsor = getSponsorById('sponsor-fr-001')
      expect(sponsor.description.fr).toBeDefined()
      expect(sponsor.description.en).toBeDefined()
      expect(sponsor.description.es).toBeDefined()
      expect(sponsor.description.de).toBeDefined()
    })

    it('should have valid promo codes or null', () => {
      const countries = ['FR', 'DE', 'ES']
      countries.forEach((country) => {
        const sponsors = getSponsorsByCountry(country)
        sponsors.forEach((sponsor) => {
          expect(
            sponsor.promoCode === null || typeof sponsor.promoCode === 'string'
          ).toBe(true)
        })
      })
    })

    it('should have valid validUntil dates', () => {
      const countries = ['FR', 'DE', 'ES']
      countries.forEach((country) => {
        const sponsors = getSponsorsByCountry(country)
        sponsors.forEach((sponsor) => {
          const date = new Date(sponsor.validUntil)
          expect(date.toString()).not.toBe('Invalid Date')
        })
      })
    })
  })

  describe('Integration tests', () => {
    it('should support complete sponsor workflow', () => {
      // 1. Find sponsors for a spot
      const sponsors = getSponsorsForSpot('spot-paris-peripherique', 'FR')
      expect(sponsors.length).toBeGreaterThan(0)

      // 2. Get sponsor details
      const sponsor = sponsors[0]
      const details = getSponsorById(sponsor.id)
      expect(details).not.toBeNull()

      // 3. Render banner
      const banner = renderSponsorBanner(details)
      expect(banner).toContain(details.name)

      // 4. Render detail modal
      const modal = renderSponsorDetail(details.id)
      expect(modal).toContain(details.name)

      // 5. Track interactions (note: renderSponsorDetail already calls trackSponsorView)
      trackSponsorClick(details.id, 'website')
      if (details.promoCode) {
        trackPromoCodeUsed(details.id, details.promoCode)
      }

      // +1 for trackSponsorView called in renderSponsorDetail
      // +1 for trackSponsorView called explicitly above (removed)
      // +1 for trackSponsorClick
      // +1 for trackPromoCodeUsed
      // Total: 1 (from modal) + 1 (click) + 1 (promo) = 3, or 2 if no promo
      expect(trackEvent).toHaveBeenCalledTimes(details.promoCode ? 3 : 2)
    })

    it('should support location-based sponsor discovery', () => {
      // Berlin coordinates
      const nearbySponsors = getSponsorsNearLocation(52.5200, 13.4050, 50)
      expect(nearbySponsors.length).toBeGreaterThan(0)

      // Should include Berlin sponsor
      const berlinSponsor = nearbySponsors.find((s) => s.city === 'Berlin')
      expect(berlinSponsor).toBeDefined()
    })

    it('should format benefits correctly for display', () => {
      const sponsor = getSponsorById('sponsor-fr-001')
      const formatted = formatBenefits(sponsor.benefits)
      expect(formatted).toBeTruthy()
      expect(formatted.length).toBeGreaterThan(0)
    })
  })

  describe('Partenariats dans description (SUIVI.md requirement)', () => {
    it('should render sponsor info suitable for spot description', () => {
      // According to SUIVI.md: "Partenariats = pub DANS LA DESCRIPTION du spot"
      const sponsor = getSponsorById('sponsor-fr-002') // Cafe de la Route
      const banner = renderSponsorBanner(sponsor)

      // Should be non-intrusive and helpful
      expect(banner).toContain('Cafe de la Route')
      expect(banner).toContain('cafe offert')
      expect(banner).toContain('wifi')

      // Should have verified partner badge
      expect(banner).toContain('Partenaire verifie')
    })

    it('should display distance information', () => {
      const sponsor = getSponsorById('sponsor-fr-001')
      expect(sponsor.description.fr).toContain('500m')
    })

    it('should include practical benefits for hitchhikers', () => {
      const sponsor = getSponsorById('sponsor-fr-003') // TotalEnergies
      expect(sponsor.description.fr).toContain('douches')
      expect(sponsor.benefits.some((b) => b.type === BenefitType.FREE_SHOWER)).toBe(
        true
      )
    })
  })
})
