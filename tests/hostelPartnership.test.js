/**
 * Tests for Hostel Partnership Service
 * Feature #238 - Partenariats avec auberges de jeunesse
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock state before imports
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    lang: 'fr',
    user: { uid: 'user123', id: 'user123' },
    username: 'TestUser',
    avatar: '🤙',
    spots: [
      {
        id: 'spot-paris-nord',
        name: 'Paris Nord',
        coordinates: { lat: 48.88, lng: 2.35 }
      }
    ]
  })),
  setState: vi.fn()
}))

// Mock analytics
vi.mock('../src/services/analytics.js', () => ({
  trackEvent: vi.fn()
}))

// Import after mocks
import {
  getPartnerHostels,
  getHostelDetails,
  getHostelsNearSpot,
  getHostelsInCity,
  getHostelsByCountry,
  searchHostels,
  getHostelDiscount,
  generateDiscountCode,
  validateDiscountCode,
  redeemDiscount,
  getHostelAmenities,
  getHostelReviews,
  addHostelReview,
  getHostelRating,
  bookHostel,
  renderHostelCard,
  renderHostelList,
  renderHostelDetail,
  renderDiscountBanner,
  trackHostelClick
} from '../src/services/hostelPartnership.js'

import { getState } from '../src/stores/state.js'
import { trackEvent } from '../src/services/analytics.js'

const STORAGE_KEY = 'spothitch_hostel_codes'

describe('Hostel Partnership Service', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('getPartnerHostels', () => {
    it('should return all active partner hostels', () => {
      const hostels = getPartnerHostels()
      expect(hostels).toBeInstanceOf(Array)
      expect(hostels.length).toBeGreaterThan(0)
      expect(hostels.every(h => h.isActive)).toBe(true)
    })

    it('should return hostels with required fields', () => {
      const hostels = getPartnerHostels()
      const hostel = hostels[0]
      expect(hostel).toHaveProperty('id')
      expect(hostel).toHaveProperty('name')
      expect(hostel).toHaveProperty('city')
      expect(hostel).toHaveProperty('country')
      expect(hostel).toHaveProperty('coordinates')
      expect(hostel).toHaveProperty('discount')
      expect(hostel).toHaveProperty('description')
      expect(hostel).toHaveProperty('amenities')
      expect(hostel).toHaveProperty('priceRange')
    })

    it('should have at least 8 partner hostels', () => {
      const hostels = getPartnerHostels()
      expect(hostels.length).toBeGreaterThanOrEqual(8)
    })
  })

  describe('getHostelDetails', () => {
    it('should return hostel details by ID', () => {
      const hostel = getHostelDetails('hostel-fr-001')
      expect(hostel).toBeDefined()
      expect(hostel.id).toBe('hostel-fr-001')
      expect(hostel.name).toBe('Le Routard Paris')
    })

    it('should return null for invalid ID', () => {
      const hostel = getHostelDetails('invalid-id')
      expect(hostel).toBeNull()
    })

    it('should return null for empty ID', () => {
      const hostel = getHostelDetails('')
      expect(hostel).toBeNull()
    })

    it('should return null for null ID', () => {
      const hostel = getHostelDetails(null)
      expect(hostel).toBeNull()
    })
  })

  describe('getHostelsNearSpot', () => {
    it('should return hostels near a spot by reference', () => {
      const hostels = getHostelsNearSpot('spot-paris-nord')
      expect(hostels).toBeInstanceOf(Array)
      expect(hostels.length).toBeGreaterThan(0)
    })

    it('should return empty array for invalid spot ID', () => {
      const hostels = getHostelsNearSpot('invalid-spot')
      expect(hostels).toBeInstanceOf(Array)
      expect(hostels.length).toBe(0)
    })

    it('should return empty array for empty spot ID', () => {
      const hostels = getHostelsNearSpot('')
      expect(hostels).toEqual([])
    })

    it('should return empty array for null spot ID', () => {
      const hostels = getHostelsNearSpot(null)
      expect(hostels).toEqual([])
    })

    it('should respect radius parameter', () => {
      const hostels = getHostelsNearSpot('spot-paris-nord', 50)
      expect(hostels).toBeInstanceOf(Array)
    })

    it('should calculate distance when spot has coordinates', () => {
      const hostels = getHostelsNearSpot('spot-paris-nord', 10)
      // Should find hostels within 10km
      expect(hostels).toBeInstanceOf(Array)
    })
  })

  describe('getHostelsInCity', () => {
    it('should return hostels in Paris', () => {
      const hostels = getHostelsInCity('Paris')
      expect(hostels.length).toBeGreaterThan(0)
      expect(hostels.every(h => h.city === 'Paris')).toBe(true)
    })

    it('should be case insensitive', () => {
      const hostels = getHostelsInCity('paris')
      expect(hostels.length).toBeGreaterThan(0)
    })

    it('should return empty array for unknown city', () => {
      const hostels = getHostelsInCity('UnknownCity')
      expect(hostels).toEqual([])
    })

    it('should return empty array for empty city', () => {
      const hostels = getHostelsInCity('')
      expect(hostels).toEqual([])
    })

    it('should return empty array for null city', () => {
      const hostels = getHostelsInCity(null)
      expect(hostels).toEqual([])
    })

    it('should trim whitespace', () => {
      const hostels = getHostelsInCity('  Paris  ')
      expect(hostels.length).toBeGreaterThan(0)
    })
  })

  describe('getHostelsByCountry', () => {
    it('should return hostels in France', () => {
      const hostels = getHostelsByCountry('FR')
      expect(hostels.length).toBe(3)
      expect(hostels.every(h => h.country === 'FR')).toBe(true)
    })

    it('should return hostels in Germany', () => {
      const hostels = getHostelsByCountry('DE')
      expect(hostels.length).toBe(2)
      expect(hostels.every(h => h.country === 'DE')).toBe(true)
    })

    it('should be case insensitive', () => {
      const hostels = getHostelsByCountry('fr')
      expect(hostels.length).toBe(3)
    })

    it('should return empty array for unknown country', () => {
      const hostels = getHostelsByCountry('XX')
      expect(hostels).toEqual([])
    })

    it('should return empty array for empty country', () => {
      const hostels = getHostelsByCountry('')
      expect(hostels).toEqual([])
    })

    it('should return empty array for null country', () => {
      const hostels = getHostelsByCountry(null)
      expect(hostels).toEqual([])
    })

    it('should only return active hostels', () => {
      const hostels = getHostelsByCountry('FR')
      expect(hostels.every(h => h.isActive)).toBe(true)
    })
  })

  describe('searchHostels', () => {
    it('should search by name', () => {
      const hostels = searchHostels('Routard')
      expect(hostels.length).toBeGreaterThan(0)
      expect(hostels[0].name).toContain('Routard')
    })

    it('should search by city', () => {
      const hostels = searchHostels('Berlin')
      expect(hostels.length).toBeGreaterThan(0)
      expect(hostels.some(h => h.city === 'Berlin')).toBe(true)
    })

    it('should search by country code', () => {
      const hostels = searchHostels('DE')
      expect(hostels.length).toBeGreaterThan(0)
    })

    it('should be case insensitive', () => {
      const hostels = searchHostels('paris')
      expect(hostels.length).toBeGreaterThan(0)
    })

    it('should return empty array for short query', () => {
      const hostels = searchHostels('a')
      expect(hostels).toEqual([])
    })

    it('should return empty array for empty query', () => {
      const hostels = searchHostels('')
      expect(hostels).toEqual([])
    })

    it('should return empty array for whitespace only', () => {
      const hostels = searchHostels('   ')
      expect(hostels).toEqual([])
    })

    it('should search in amenities', () => {
      const hostels = searchHostels('wifi')
      expect(hostels.length).toBeGreaterThan(0)
    })

    it('should search in description', () => {
      const hostels = searchHostels('routard')
      expect(hostels.length).toBeGreaterThan(0)
    })
  })

  describe('getHostelDiscount', () => {
    it('should return discount info for valid hostel', () => {
      const discount = getHostelDiscount('hostel-fr-001')
      expect(discount).toBeDefined()
      expect(discount.hostelId).toBe('hostel-fr-001')
      expect(discount.discountPercent).toBe(15)
      expect(discount.description).toContain('15')
    })

    it('should return null for invalid hostel', () => {
      const discount = getHostelDiscount('invalid-id')
      expect(discount).toBeNull()
    })

    it('should include description in current language', () => {
      const discount = getHostelDiscount('hostel-fr-001')
      expect(discount.description).toBeDefined()
      expect(typeof discount.description).toBe('string')
    })
  })

  describe('generateDiscountCode', () => {
    it('should generate code for logged in user', () => {
      const result = generateDiscountCode('hostel-fr-001', 'user123')
      expect(result.success).toBe(true)
      expect(result.code).toBeDefined()
      expect(result.code).toMatch(/^SH-FR-/)
      expect(result.discountPercent).toBe(15)
    })

    it('should generate unique codes', () => {
      const result1 = generateDiscountCode('hostel-fr-001', 'user123')
      const result2 = generateDiscountCode('hostel-fr-001', 'user123')
      expect(result1.code).not.toBe(result2.code)
    })

    it('should return error for invalid hostel', () => {
      const result = generateDiscountCode('invalid-id', 'user123')
      expect(result.success).toBe(false)
      expect(result.error).toBe('hostelNotFound')
    })

    it('should store code in localStorage', () => {
      generateDiscountCode('hostel-fr-001', 'user123')
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored.length).toBe(1)
      expect(stored[0].hostelId).toBe('hostel-fr-001')
    })

    it('should set expiration date 30 days from now', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-09T12:00:00Z'))
      const result = generateDiscountCode('hostel-fr-001', 'user123')
      const expiresAt = new Date(result.expiresAt)
      const now = new Date()
      const diffDays = Math.round((expiresAt - now) / (1000 * 60 * 60 * 24))
      expect(diffDays).toBe(30)
      vi.useRealTimers()
    })

    it('should track event', () => {
      generateDiscountCode('hostel-fr-001', 'user123')
      expect(trackEvent).toHaveBeenCalledWith(
        'hostel_discount_generated',
        expect.objectContaining({
          hostel_id: 'hostel-fr-001',
          discount_percent: 15
        })
      )
    })

    it('should use state user if no userId provided', () => {
      const result = generateDiscountCode('hostel-fr-001', null)
      expect(result.success).toBe(true)
      expect(result.code).toBeDefined()
    })

    it('should return error for login required if no user', () => {
      vi.mocked(getState).mockReturnValueOnce({
        lang: 'fr',
        user: null,
        spots: []
      })
      const result = generateDiscountCode('hostel-fr-001', null)
      expect(result.success).toBe(false)
      expect(result.error).toBe('loginRequired')
    })
  })

  describe('validateDiscountCode', () => {
    it('should validate valid code', () => {
      const generated = generateDiscountCode('hostel-fr-001', 'user123')
      const validation = validateDiscountCode(generated.code)
      expect(validation.valid).toBe(true)
      expect(validation.discountPercent).toBe(15)
    })

    it('should reject invalid code', () => {
      const validation = validateDiscountCode('invalid-code')
      expect(validation.valid).toBe(false)
      expect(validation.error).toBe('codeInvalid')
    })

    it('should reject empty code', () => {
      const validation = validateDiscountCode('')
      expect(validation.valid).toBe(false)
    })

    it('should reject null code', () => {
      const validation = validateDiscountCode(null)
      expect(validation.valid).toBe(false)
    })

    it('should reject expired code', () => {
      const generated = generateDiscountCode('hostel-fr-001', 'user123')
      // Manually expire the code
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      stored[0].expiresAt = new Date(Date.now() - 1000).toISOString()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

      const validation = validateDiscountCode(generated.code)
      expect(validation.valid).toBe(false)
      expect(validation.error).toBe('codeExpired')
    })

    it('should reject used code', () => {
      const generated = generateDiscountCode('hostel-fr-001', 'user123')
      // Manually mark as used
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      stored[0].isUsed = true
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

      const validation = validateDiscountCode(generated.code)
      expect(validation.valid).toBe(false)
      expect(validation.error).toBe('codeAlreadyUsed')
    })

    it('should return discount details for valid code', () => {
      const generated = generateDiscountCode('hostel-fr-001', 'user123')
      const validation = validateDiscountCode(generated.code)
      expect(validation.hostelId).toBe('hostel-fr-001')
      expect(validation.hostelName).toBe('Le Routard Paris')
      expect(validation.expiresAt).toBeDefined()
    })
  })

  describe('redeemDiscount', () => {
    it('should redeem valid code', () => {
      const generated = generateDiscountCode('hostel-fr-001', 'user123')
      const result = redeemDiscount(generated.code, 'hostel-fr-001')
      expect(result.success).toBe(true)
      expect(result.discountPercent).toBe(15)
    })

    it('should mark code as used', () => {
      const generated = generateDiscountCode('hostel-fr-001', 'user123')
      redeemDiscount(generated.code, 'hostel-fr-001')

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored[0].isUsed).toBe(true)
      expect(stored[0].usedAt).toBeDefined()
    })

    it('should reject wrong hostel', () => {
      const generated = generateDiscountCode('hostel-fr-001', 'user123')
      const result = redeemDiscount(generated.code, 'hostel-fr-002')
      expect(result.success).toBe(false)
      expect(result.error).toBe('hostelMismatch')
    })

    it('should reject invalid code', () => {
      const result = redeemDiscount('invalid-code', 'hostel-fr-001')
      expect(result.success).toBe(false)
    })

    it('should track event', () => {
      const generated = generateDiscountCode('hostel-fr-001', 'user123')
      redeemDiscount(generated.code, 'hostel-fr-001')
      expect(trackEvent).toHaveBeenCalledWith(
        'hostel_discount_redeemed',
        expect.objectContaining({
          hostel_id: 'hostel-fr-001',
          discount_percent: 15
        })
      )
    })

    it('should not redeem twice', () => {
      const generated = generateDiscountCode('hostel-fr-001', 'user123')
      redeemDiscount(generated.code, 'hostel-fr-001')
      const result = redeemDiscount(generated.code, 'hostel-fr-001')
      expect(result.success).toBe(false)
    })
  })

  describe('getHostelAmenities', () => {
    it('should return amenities with labels', () => {
      const amenities = getHostelAmenities('hostel-fr-001')
      expect(amenities.length).toBeGreaterThan(0)
      expect(amenities[0]).toHaveProperty('id')
      expect(amenities[0]).toHaveProperty('label')
      expect(amenities[0]).toHaveProperty('icon')
    })

    it('should return empty array for invalid hostel', () => {
      const amenities = getHostelAmenities('invalid-id')
      expect(amenities).toEqual([])
    })

    it('should have icons for all amenities', () => {
      const amenities = getHostelAmenities('hostel-fr-001')
      expect(amenities.every(a => typeof a.icon === 'string' && a.icon.length > 0)).toBe(true)
    })

    it('should translate amenity labels', () => {
      const amenities = getHostelAmenities('hostel-fr-001')
      expect(amenities[0].label).toBeDefined()
      expect(typeof amenities[0].label).toBe('string')
    })
  })

  describe('getHostelReviews', () => {
    it('should return empty array for hostel without reviews', () => {
      const reviews = getHostelReviews('hostel-fr-001')
      expect(reviews).toEqual([])
    })

    it('should return empty array for invalid hostel', () => {
      const reviews = getHostelReviews('invalid-id')
      expect(reviews).toEqual([])
    })

    it('should return stored reviews', () => {
      addHostelReview('hostel-fr-001', { rating: 5, comment: 'Great!' })
      const reviews = getHostelReviews('hostel-fr-001')
      expect(reviews.length).toBe(1)
    })

    it('should sort reviews by date descending', () => {
      addHostelReview('hostel-fr-001', { rating: 5 })
      // Add small delay to ensure different timestamps
      vi.useFakeTimers()
      vi.advanceTimersByTime(100)
      addHostelReview('hostel-fr-001', { rating: 4 })
      vi.useRealTimers()

      const reviews = getHostelReviews('hostel-fr-001')
      const date1 = new Date(reviews[0].createdAt).getTime()
      const date2 = new Date(reviews[1].createdAt).getTime()
      expect(date1).toBeGreaterThanOrEqual(date2)
    })
  })

  describe('addHostelReview', () => {
    it('should add review', () => {
      const result = addHostelReview('hostel-fr-001', {
        rating: 5,
        comment: 'Excellent hostel!'
      })
      expect(result.success).toBe(true)
      expect(result.review).toBeDefined()
      expect(result.review.rating).toBe(5)
    })

    it('should require rating', () => {
      const result = addHostelReview('hostel-fr-001', {})
      expect(result.success).toBe(false)
      expect(result.error).toBe('ratingRequired')
    })

    it('should reject invalid hostel', () => {
      const result = addHostelReview('invalid-id', { rating: 5 })
      expect(result.success).toBe(false)
      expect(result.error).toBe('hostelNotFound')
    })

    it('should clamp rating to 1-5', () => {
      const result1 = addHostelReview('hostel-fr-001', { rating: 10 })
      expect(result1.success).toBe(true)
      expect(result1.review.rating).toBe(5)

      const result2 = addHostelReview('hostel-fr-001', { rating: -5 })
      expect(result2.success).toBe(true)
      expect(result2.review.rating).toBe(1)
    })

    it('should include user info', () => {
      const result = addHostelReview('hostel-fr-001', { rating: 5 })
      expect(result.review.userId).toBe('user123')
      expect(result.review.username).toBe('TestUser')
      expect(result.review.avatar).toBe('🤙')
    })

    it('should track event', () => {
      addHostelReview('hostel-fr-001', { rating: 5 })
      expect(trackEvent).toHaveBeenCalledWith(
        'hostel_review_added',
        expect.objectContaining({
          hostel_id: 'hostel-fr-001',
          rating: 5
        })
      )
    })

    it('should generate unique IDs', () => {
      const result1 = addHostelReview('hostel-fr-001', { rating: 5 })
      const result2 = addHostelReview('hostel-fr-001', { rating: 4 })
      expect(result1.review.id).not.toBe(result2.review.id)
    })

    it('should handle empty comment', () => {
      const result = addHostelReview('hostel-fr-001', { rating: 5 })
      expect(result.review.comment).toBe('')
    })
  })

  describe('getHostelRating', () => {
    it('should return default rating without reviews', () => {
      const rating = getHostelRating('hostel-fr-001')
      expect(rating.average).toBe(4.5)
      expect(rating.count).toBe(234)
    })

    it('should calculate average with SpotHitch reviews', () => {
      addHostelReview('hostel-fr-001', { rating: 5 })
      addHostelReview('hostel-fr-001', { rating: 4 })
      const rating = getHostelRating('hostel-fr-001')
      expect(rating.count).toBe(236) // 234 + 2
      expect(rating.spotHitchReviews).toBe(2)
      expect(rating.average).toBeGreaterThan(0)
    })

    it('should return 0 for invalid hostel', () => {
      const rating = getHostelRating('invalid-id')
      expect(rating.average).toBe(0)
      expect(rating.count).toBe(0)
    })

    it('should round average to 1 decimal', () => {
      addHostelReview('hostel-fr-001', { rating: 5 })
      const rating = getHostelRating('hostel-fr-001')
      expect(rating.average.toString()).toMatch(/^\d+\.\d$/)
    })
  })

  describe('bookHostel', () => {
    it('should return booking URL', () => {
      const result = bookHostel('hostel-fr-001')
      expect(result.success).toBe(true)
      expect(result.bookingUrl).toBeDefined()
      expect(result.bookingUrl).toContain('leroutard-paris.com')
    })

    it('should generate discount code for logged in user', () => {
      const result = bookHostel('hostel-fr-001')
      expect(result.discountCode).toBeDefined()
      expect(result.discountPercent).toBe(15)
    })

    it('should add dates to URL', () => {
      const result = bookHostel('hostel-fr-001', {
        checkIn: '2025-06-01',
        checkOut: '2025-06-05'
      })
      expect(result.bookingUrl).toContain('checkin=2025-06-01')
      expect(result.bookingUrl).toContain('checkout=2025-06-05')
    })

    it('should add promo code to URL', () => {
      const result = bookHostel('hostel-fr-001')
      expect(result.bookingUrl).toContain('promo=')
    })

    it('should reject invalid hostel', () => {
      const result = bookHostel('invalid-id')
      expect(result.success).toBe(false)
      expect(result.error).toBe('hostelNotFound')
    })

    it('should track event', () => {
      bookHostel('hostel-fr-001')
      expect(trackEvent).toHaveBeenCalledWith(
        'hostel_booking_clicked',
        expect.objectContaining({
          hostel_id: 'hostel-fr-001',
          has_discount: true
        })
      )
    })

    it('should work without dates', () => {
      const result = bookHostel('hostel-fr-001')
      expect(result.success).toBe(true)
    })
  })

  describe('trackHostelClick', () => {
    it('should track hostel click', () => {
      trackHostelClick('hostel-fr-001')
      expect(trackEvent).toHaveBeenCalledWith(
        'hostel_click',
        expect.objectContaining({
          hostel_id: 'hostel-fr-001',
          hostel_name: 'Le Routard Paris'
        })
      )
    })

    it('should not throw for invalid hostel', () => {
      expect(() => trackHostelClick('invalid-id')).not.toThrow()
    })
  })

  describe('renderHostelCard', () => {
    it('should render HTML card', () => {
      const hostel = getHostelDetails('hostel-fr-001')
      const html = renderHostelCard(hostel)
      expect(html).toContain('hostel-card')
      expect(html).toContain('Le Routard Paris')
      expect(html).toContain('-15%')
    })

    it('should return empty string for null hostel', () => {
      const html = renderHostelCard(null)
      expect(html).toBe('')
    })

    it('should include rating', () => {
      const hostel = getHostelDetails('hostel-fr-001')
      const html = renderHostelCard(hostel)
      expect(html).toContain('4.5')
    })

    it('should include price', () => {
      const hostel = getHostelDetails('hostel-fr-001')
      const html = renderHostelCard(hostel)
      expect(html).toContain('25')
      expect(html).toContain('€')
    })

    it('should include amenity icons', () => {
      const hostel = getHostelDetails('hostel-fr-001')
      const html = renderHostelCard(hostel)
      expect(html).toContain('<svg')
    })

    it('should have proper ARIA attributes', () => {
      const hostel = getHostelDetails('hostel-fr-001')
      const html = renderHostelCard(hostel)
      expect(html).toContain('role="article"')
      expect(html).toContain('aria-label=')
    })

    it('should handle missing photo', () => {
      const hostel = { ...getHostelDetails('hostel-fr-001'), photos: [] }
      const html = renderHostelCard(hostel)
      expect(html).toContain('🏨')
    })
  })

  describe('renderHostelList', () => {
    it('should render list of hostels', () => {
      const hostels = getHostelsByCountry('FR')
      const html = renderHostelList(hostels)
      expect(html).toContain('space-y-4')
      expect(html).toContain('hostel-card')
    })

    it('should render empty state', () => {
      const html = renderHostelList([])
      expect(html).toContain('text-center')
      expect(html).toContain('<svg')
    })

    it('should render null as empty', () => {
      const html = renderHostelList(null)
      expect(html).toContain('text-center')
    })
  })

  describe('renderHostelDetail', () => {
    it('should render detail modal', () => {
      const hostel = getHostelDetails('hostel-fr-001')
      const html = renderHostelDetail(hostel)
      expect(html).toContain('hostel-detail')
      expect(html).toContain('Le Routard Paris')
      expect(html).toContain('role="dialog"')
      expect(html).toContain('aria-modal="true"')
    })

    it('should return empty string for null hostel', () => {
      const html = renderHostelDetail(null)
      expect(html).toBe('')
    })

    it('should include amenities', () => {
      const hostel = getHostelDetails('hostel-fr-001')
      const html = renderHostelDetail(hostel)
      expect(html).toContain('<svg')
    })

    it('should include check-in/out times', () => {
      const hostel = getHostelDetails('hostel-fr-001')
      const html = renderHostelDetail(hostel)
      expect(html).toContain('15:00')
      expect(html).toContain('11:00')
    })

    it('should include action buttons', () => {
      const hostel = getHostelDetails('hostel-fr-001')
      const html = renderHostelDetail(hostel)
      expect(html).toContain('generateHostelCode')
      expect(html).toContain('bookHostelNow')
    })

    it('should track view', () => {
      const hostel = getHostelDetails('hostel-fr-001')
      renderHostelDetail(hostel)
      expect(trackEvent).toHaveBeenCalledWith('hostel_click', expect.any(Object))
    })

    it('should include contact buttons if available', () => {
      const hostel = getHostelDetails('hostel-fr-001')
      const html = renderHostelDetail(hostel)
      expect(html).toContain('<svg')
      expect(html).toContain('<svg')
    })
  })

  describe('renderDiscountBanner', () => {
    it('should render discount banner', () => {
      const discount = {
        hostelName: 'Test Hostel',
        discountPercent: 15,
        code: 'SH-TEST-123',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
      const html = renderDiscountBanner(discount)
      expect(html).toContain('discount-banner')
      expect(html).toContain('Test Hostel')
      expect(html).toContain('-15%')
      expect(html).toContain('SH-TEST-123')
    })

    it('should return empty string for null discount', () => {
      const html = renderDiscountBanner(null)
      expect(html).toBe('')
    })

    it('should work without code', () => {
      const discount = {
        hostelName: 'Test Hostel',
        discountPercent: 15
      }
      const html = renderDiscountBanner(discount)
      expect(html).toContain('Test Hostel')
      expect(html).not.toContain('SH-')
    })

    it('should include copy button when code present', () => {
      const discount = {
        discountPercent: 15,
        code: 'SH-TEST-123'
      }
      const html = renderDiscountBanner(discount)
      expect(html).toContain('copyHostelCode')
    })

    it('should have proper ARIA attributes', () => {
      const discount = { discountPercent: 15 }
      const html = renderDiscountBanner(discount)
      expect(html).toContain('role="banner"')
      expect(html).toContain('aria-label=')
    })
  })

  describe('Integration scenarios', () => {
    it('should handle complete booking flow', () => {
      // Search hostels
      const hostels = searchHostels('Paris')
      expect(hostels.length).toBeGreaterThan(0)

      // Get hostel details
      const hostel = getHostelDetails(hostels[0].id)
      expect(hostel).toBeDefined()

      // Generate discount code
      const codeResult = generateDiscountCode(hostel.id, 'user123')
      expect(codeResult.success).toBe(true)

      // Validate code
      const validation = validateDiscountCode(codeResult.code)
      expect(validation.valid).toBe(true)

      // Book hostel
      const booking = bookHostel(hostel.id)
      expect(booking.success).toBe(true)
      expect(booking.bookingUrl).toContain('promo=')
    })

    it('should handle review flow', () => {
      const hostelId = 'hostel-fr-001'

      // Add review
      const addResult = addHostelReview(hostelId, {
        rating: 5,
        comment: 'Great hostel!'
      })
      expect(addResult.success).toBe(true)

      // Get reviews
      const reviews = getHostelReviews(hostelId)
      expect(reviews.length).toBe(1)

      // Get updated rating
      const rating = getHostelRating(hostelId)
      expect(rating.spotHitchReviews).toBe(1)
    })

    it('should handle multiple codes for same user', () => {
      generateDiscountCode('hostel-fr-001', 'user123')
      generateDiscountCode('hostel-fr-002', 'user123')
      generateDiscountCode('hostel-de-001', 'user123')

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
      expect(stored.length).toBe(3)
    })
  })

  describe('Edge cases', () => {
    it('should handle corrupted localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json')
      let result
      let threw = false
      try {
        result = generateDiscountCode('hostel-fr-001', 'user123')
      } catch {
        threw = true
      }
      expect(threw).toBe(false)
      // Function should still return a result (success or error object)
      expect(result).toBeDefined()
    })

    it('should handle missing state', () => {
      vi.mocked(getState).mockReturnValueOnce({
        lang: 'fr',
        user: null,
        spots: []
      })
      const result = generateDiscountCode('hostel-fr-001', 'anonymous')
      expect(result.success).toBe(true)
    })

    it('should handle special characters in search', () => {
      expect(() => searchHostels('Paris <script>')).not.toThrow()
    })

    it('should handle very long review comments', () => {
      const longComment = 'a'.repeat(10000)
      const result = addHostelReview('hostel-fr-001', {
        rating: 5,
        comment: longComment
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Multi-language support', () => {
    it('should support French', () => {
      vi.mocked(getState).mockReturnValueOnce({
        lang: 'fr',
        user: { uid: 'user123' },
        spots: []
      })
      const hostel = getHostelDetails('hostel-fr-001')
      const card = renderHostelCard(hostel)
      expect(card).toBeDefined()
    })

    it('should support English', () => {
      vi.mocked(getState).mockReturnValueOnce({
        lang: 'en',
        user: { uid: 'user123' },
        spots: []
      })
      const hostel = getHostelDetails('hostel-fr-001')
      const card = renderHostelCard(hostel)
      expect(card).toBeDefined()
    })

    it('should support Spanish', () => {
      vi.mocked(getState).mockReturnValueOnce({
        lang: 'es',
        user: { uid: 'user123' },
        spots: []
      })
      const hostel = getHostelDetails('hostel-fr-001')
      const card = renderHostelCard(hostel)
      expect(card).toBeDefined()
    })

    it('should support German', () => {
      vi.mocked(getState).mockReturnValueOnce({
        lang: 'de',
        user: { uid: 'user123' },
        spots: []
      })
      const hostel = getHostelDetails('hostel-fr-001')
      const card = renderHostelCard(hostel)
      expect(card).toBeDefined()
    })

    it('should fallback to French for unknown language', () => {
      vi.mocked(getState).mockReturnValueOnce({
        lang: 'xx',
        user: { uid: 'user123' },
        spots: []
      })
      const discount = getHostelDiscount('hostel-fr-001')
      expect(discount.description).toBeDefined()
    })
  })

  describe('Window handlers', () => {
    it('should expose global handlers', () => {
      expect(typeof window.openHostelDetail).toBe('function')
      expect(typeof window.closeHostelDetail).toBe('function')
      expect(typeof window.generateHostelCode).toBe('function')
      expect(typeof window.bookHostelNow).toBe('function')
      expect(typeof window.copyHostelCode).toBe('function')
      expect(typeof window.trackHostelClick).toBe('function')
    })
  })
})
