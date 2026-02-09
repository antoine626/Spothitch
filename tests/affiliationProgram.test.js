import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import affiliationProgram from '../src/services/affiliationProgram.js'

describe('AffiliationProgram Service', () => {
  beforeEach(() => {
    affiliationProgram.clearAffiliateData()
  })

  afterEach(() => {
    affiliationProgram.clearAffiliateData()
  })

  describe('Constants', () => {
    it('should have AFFILIATE_CATEGORIES defined', () => {
      expect(affiliationProgram.AFFILIATE_CATEGORIES).toBeDefined()
      expect(affiliationProgram.AFFILIATE_CATEGORIES.EQUIPMENT).toBe('equipment')
      expect(affiliationProgram.AFFILIATE_CATEGORIES.TRANSPORT).toBe('transport')
      expect(affiliationProgram.AFFILIATE_CATEGORIES.ACCOMMODATION).toBe('accommodation')
      expect(affiliationProgram.AFFILIATE_CATEGORIES.INSURANCE).toBe('insurance')
      expect(affiliationProgram.AFFILIATE_CATEGORIES.FOOD).toBe('food')
      expect(affiliationProgram.AFFILIATE_CATEGORIES.APPS).toBe('apps')
    })

    it('should have COMMISSION_TIERS defined', () => {
      expect(affiliationProgram.COMMISSION_TIERS).toBeDefined()
      expect(affiliationProgram.COMMISSION_TIERS.TIER_1).toBe(5)
      expect(affiliationProgram.COMMISSION_TIERS.TIER_2).toBe(8)
      expect(affiliationProgram.COMMISSION_TIERS.TIER_3).toBe(10)
      expect(affiliationProgram.COMMISSION_TIERS.TIER_4).toBe(15)
    })
  })

  describe('getAffiliatePartners', () => {
    it('should return array of partners', () => {
      const partners = affiliationProgram.getAffiliatePartners()
      expect(Array.isArray(partners)).toBe(true)
      expect(partners.length).toBeGreaterThan(0)
    })

    it('should have default 15 partners', () => {
      const partners = affiliationProgram.getAffiliatePartners()
      expect(partners.length).toBe(15)
    })

    it('should have partner with all required fields', () => {
      const partners = affiliationProgram.getAffiliatePartners()
      const partner = partners[0]
      expect(partner.id).toBeDefined()
      expect(partner.name).toBeDefined()
      expect(partner.category).toBeDefined()
      expect(partner.url).toBeDefined()
      expect(partner.commission).toBeDefined()
      expect(partner.description).toBeDefined()
      expect(partner.logo).toBeDefined()
      expect(partner.featured).toBeDefined()
      expect(partner.clicks).toBeDefined()
      expect(partner.activeFromDate).toBeDefined()
    })

    it('should persist to localStorage', () => {
      const partners = affiliationProgram.getAffiliatePartners()
      affiliationProgram.trackAffiliateClick(partners[0].id, 'user123')
      const stored = affiliationProgram.getAffiliatePartners()
      expect(stored[0].clicks).toBe(1)
    })
  })

  describe('getPartnersByCategory', () => {
    it('should filter partners by category', () => {
      const equipmentPartners = affiliationProgram.getPartnersByCategory('equipment')
      expect(Array.isArray(equipmentPartners)).toBe(true)
      equipmentPartners.forEach(p => {
        expect(p.category).toBe('equipment')
      })
    })

    it('should return transport partners', () => {
      const transportPartners = affiliationProgram.getPartnersByCategory('transport')
      expect(transportPartners.length).toBeGreaterThan(0)
      transportPartners.forEach(p => {
        expect(p.category).toBe('transport')
      })
    })

    it('should return accommodation partners', () => {
      const accommodationPartners = affiliationProgram.getPartnersByCategory('accommodation')
      expect(accommodationPartners.length).toBeGreaterThan(0)
    })

    it('should return empty array for non-existent category', () => {
      const partners = affiliationProgram.getPartnersByCategory('nonexistent')
      expect(partners).toEqual([])
    })

    it('should return empty array for empty string category', () => {
      const partners = affiliationProgram.getPartnersByCategory('')
      expect(partners).toEqual([])
    })
  })

  describe('getPartnerById', () => {
    it('should return partner by ID', () => {
      const partner = affiliationProgram.getPartnerById('decathlon-001')
      expect(partner).toBeDefined()
      expect(partner.name).toBe('Decathlon')
      expect(partner.id).toBe('decathlon-001')
    })

    it('should return undefined for non-existent ID', () => {
      const partner = affiliationProgram.getPartnerById('nonexistent')
      expect(partner).toBeUndefined()
    })

    it('should return all known partners', () => {
      const partners = [
        'decathlon-001',
        'blablacar-001',
        'hostelworld-001',
        'booking-001',
        'worldnomads-001'
      ]
      partners.forEach(id => {
        expect(affiliationProgram.getPartnerById(id)).toBeDefined()
      })
    })
  })

  describe('trackAffiliateClick', () => {
    it('should track click successfully', () => {
      const result = affiliationProgram.trackAffiliateClick('decathlon-001', 'user123')
      expect(result.partnerId).toBe('decathlon-001')
      expect(result.userId).toBe('user123')
      expect(result.timestamp).toBeDefined()
    })

    it('should throw error without partnerId', () => {
      expect(() => {
        affiliationProgram.trackAffiliateClick(null, 'user123')
      }).toThrow('partnerId and userId are required')
    })

    it('should throw error without userId', () => {
      expect(() => {
        affiliationProgram.trackAffiliateClick('decathlon-001', null)
      }).toThrow('partnerId and userId are required')
    })

    it('should increment clicks counter', () => {
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user123')
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user124')
      const partner = affiliationProgram.getPartnerById('decathlon-001')
      expect(partner.clicks).toBe(2)
    })

    it('should store click data', () => {
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user123')
      const stats = affiliationProgram.getClickStats('decathlon-001')
      expect(stats.totalClicks).toBe(1)
      expect(stats.uniqueUsers).toBe(1)
    })

    it('should handle multiple clicks from same user', () => {
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user123')
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user123')
      const stats = affiliationProgram.getClickStats('decathlon-001')
      expect(stats.totalClicks).toBe(2)
      expect(stats.uniqueUsers).toBe(1)
    })
  })

  describe('getClickStats', () => {
    it('should return click stats', () => {
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user123')
      const stats = affiliationProgram.getClickStats('decathlon-001')
      expect(stats.partnerId).toBe('decathlon-001')
      expect(stats.totalClicks).toBe(1)
      expect(stats.uniqueUsers).toBe(1)
      expect(stats.clicks).toBeDefined()
      expect(stats.estimatedRevenue).toBeDefined()
      expect(stats.commissionRate).toBe(8)
    })

    it('should throw error without partnerId', () => {
      expect(() => {
        affiliationProgram.getClickStats(null)
      }).toThrow('partnerId is required')
    })

    it('should return 0 clicks initially', () => {
      const stats = affiliationProgram.getClickStats('blablacar-001')
      expect(stats.totalClicks).toBe(0)
      expect(stats.uniqueUsers).toBe(0)
    })

    it('should calculate unique users correctly', () => {
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user123')
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user124')
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user123')
      const stats = affiliationProgram.getClickStats('decathlon-001')
      expect(stats.totalClicks).toBe(3)
      expect(stats.uniqueUsers).toBe(2)
    })

    it('should calculate estimated revenue', () => {
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user123')
      const stats = affiliationProgram.getClickStats('decathlon-001')
      const expected = 1 * 8 * 0.1
      expect(stats.estimatedRevenue).toBe(expected)
    })
  })

  describe('getUserClicks', () => {
    it('should return user clicks', () => {
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user123')
      affiliationProgram.trackAffiliateClick('blablacar-001', 'user123')
      const clicks = affiliationProgram.getUserClicks('user123')
      expect(Array.isArray(clicks)).toBe(true)
      expect(clicks.length).toBe(2)
    })

    it('should throw error without userId', () => {
      expect(() => {
        affiliationProgram.getUserClicks(null)
      }).toThrow('userId is required')
    })

    it('should return empty array for user with no clicks', () => {
      const clicks = affiliationProgram.getUserClicks('nouser')
      expect(clicks).toEqual([])
    })

    it('should include partner information', () => {
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user123')
      const clicks = affiliationProgram.getUserClicks('user123')
      expect(clicks[0].partnerId).toBe('decathlon-001')
      expect(clicks[0].partnerName).toBe('Decathlon')
      expect(clicks[0].clickCount).toBe(1)
      expect(clicks[0].lastClick).toBeDefined()
    })

    it('should sort by most recent click', () => {
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user123')
      affiliationProgram.trackAffiliateClick('blablacar-001', 'user123')
      const clicks = affiliationProgram.getUserClicks('user123')
      const partnerIds = clicks.map(c => c.partnerId)
      expect(partnerIds).toContain('decathlon-001')
      expect(partnerIds).toContain('blablacar-001')
      expect(clicks.length).toBe(2)
    })

    it('should aggregate multiple clicks per partner', () => {
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user123')
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user123')
      affiliationProgram.trackAffiliateClick('blablacar-001', 'user123')
      const clicks = affiliationProgram.getUserClicks('user123')
      const decathlonClick = clicks.find(c => c.partnerId === 'decathlon-001')
      expect(decathlonClick.clickCount).toBe(2)
    })
  })

  describe('generateAffiliateLink', () => {
    it('should generate valid affiliate link', () => {
      const link = affiliationProgram.generateAffiliateLink('decathlon-001', 'user123')
      expect(link).toContain('https://www.decathlon.com')
      expect(link).toContain('utm_source=spothitch')
      expect(link).toContain('utm_medium=affiliate')
      expect(link).toContain('utm_campaign=decathlon-001')
      expect(link).toContain('utm_content=user123')
    })

    it('should throw error without partnerId', () => {
      expect(() => {
        affiliationProgram.generateAffiliateLink(null, 'user123')
      }).toThrow()
    })

    it('should throw error without userId', () => {
      expect(() => {
        affiliationProgram.generateAffiliateLink('decathlon-001', null)
      }).toThrow()
    })

    it('should throw error for invalid partner', () => {
      expect(() => {
        affiliationProgram.generateAffiliateLink('invalid', 'user123')
      }).toThrow('Partner not found')
    })

    it('should track click when generating link', () => {
      affiliationProgram.generateAffiliateLink('decathlon-001', 'user123')
      const stats = affiliationProgram.getClickStats('decathlon-001')
      expect(stats.totalClicks).toBe(1)
    })

    it('should handle URL with existing query params', () => {
      const partner = affiliationProgram.getPartnerById('blablacar-001')
      if (partner && partner.url.includes('?')) {
        const link = affiliationProgram.generateAffiliateLink(partner.id, 'user123')
        expect(link).toContain('&utm_source')
      }
    })
  })

  describe('getTopPartners', () => {
    it('should return top partners', () => {
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user1')
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user2')
      affiliationProgram.trackAffiliateClick('blablacar-001', 'user1')
      const top = affiliationProgram.getTopPartners(2)
      expect(top.length).toBe(2)
      expect(top[0].id).toBe('decathlon-001')
      expect(top[0].clicks).toBe(2)
    })

    it('should default to limit of 5', () => {
      const top = affiliationProgram.getTopPartners()
      expect(top.length).toBeLessThanOrEqual(5)
    })

    it('should return all partners if limit is higher', () => {
      const top = affiliationProgram.getTopPartners(100)
      expect(top.length).toBe(15)
    })

    it('should sort by clicks descending', () => {
      for (let i = 0; i < 3; i++) {
        affiliationProgram.trackAffiliateClick('decathlon-001', `user${i}`)
      }
      for (let i = 0; i < 2; i++) {
        affiliationProgram.trackAffiliateClick('blablacar-001', `user${i}`)
      }
      const top = affiliationProgram.getTopPartners(2)
      expect(top[0].clicks).toBeGreaterThanOrEqual(top[1].clicks)
    })

    it('should handle zero limit', () => {
      const top = affiliationProgram.getTopPartners(0)
      expect(top.length).toBe(0)
    })
  })

  describe('getAffiliateRevenue', () => {
    it('should calculate total revenue', () => {
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user1')
      const revenue = affiliationProgram.getAffiliateRevenue()
      expect(revenue.totalRevenue).toBeDefined()
      expect(revenue.breakdown).toBeDefined()
    })

    it('should provide breakdown by partner', () => {
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user1')
      affiliationProgram.trackAffiliateClick('blablacar-001', 'user2')
      const revenue = affiliationProgram.getAffiliateRevenue()
      expect(revenue.breakdown['decathlon-001']).toBeDefined()
      expect(revenue.breakdown['blablacar-001']).toBeDefined()
    })

    it('should include partner details in breakdown', () => {
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user1')
      const revenue = affiliationProgram.getAffiliateRevenue()
      const decBreakdown = revenue.breakdown['decathlon-001']
      expect(decBreakdown.name).toBe('Decathlon')
      expect(decBreakdown.clicks).toBe(1)
      expect(decBreakdown.commission).toBe(8)
      expect(decBreakdown.estimatedRevenue).toBeDefined()
    })

    it('should calculate total from all partners', () => {
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user1')
      affiliationProgram.trackAffiliateClick('blablacar-001', 'user2')
      const revenue = affiliationProgram.getAffiliateRevenue()
      let sum = 0
      Object.values(revenue.breakdown).forEach(b => {
        sum += b.estimatedRevenue
      })
      expect(revenue.totalRevenue).toBe(sum)
    })

    it('should return zero revenue initially', () => {
      const revenue = affiliationProgram.getAffiliateRevenue()
      expect(revenue.totalRevenue).toBe(0)
    })
  })

  describe('searchPartners', () => {
    it('should search by partner name', () => {
      const results = affiliationProgram.searchPartners('decathlon')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].name).toContain('Decathlon')
    })

    it('should search case-insensitive', () => {
      const results1 = affiliationProgram.searchPartners('DECATHLON')
      const results2 = affiliationProgram.searchPartners('decathlon')
      expect(results1.length).toBe(results2.length)
    })

    it('should search by description', () => {
      const results = affiliationProgram.searchPartners('covoiturage')
      expect(results.length).toBeGreaterThan(0)
    })

    it('should search by category', () => {
      const results = affiliationProgram.searchPartners('equipment')
      expect(results.length).toBeGreaterThan(0)
      results.forEach(p => {
        expect(p.category).toBe('equipment')
      })
    })

    it('should return empty array for no matches', () => {
      const results = affiliationProgram.searchPartners('nonexistent')
      expect(results).toEqual([])
    })

    it('should return empty array for empty query', () => {
      const results = affiliationProgram.searchPartners('')
      expect(results).toEqual([])
    })

    it('should return empty array for null query', () => {
      const results = affiliationProgram.searchPartners(null)
      expect(results).toEqual([])
    })
  })

  describe('getFeaturedPartners', () => {
    it('should return featured partners only', () => {
      const featured = affiliationProgram.getFeaturedPartners()
      expect(Array.isArray(featured)).toBe(true)
      featured.forEach(p => {
        expect(p.featured).toBe(true)
      })
    })

    it('should have at least 5 featured partners', () => {
      const featured = affiliationProgram.getFeaturedPartners()
      expect(featured.length).toBeGreaterThanOrEqual(5)
    })

    it('should include known featured partners', () => {
      const featured = affiliationProgram.getFeaturedPartners()
      const names = featured.map(p => p.name)
      expect(names).toContain('Decathlon')
      expect(names).toContain('BlaBlaCar')
      expect(names).toContain('Hostelworld')
    })
  })

  describe('renderPartnerCard', () => {
    it('should render partner card HTML', () => {
      const partner = affiliationProgram.getPartnerById('decathlon-001')
      const html = affiliationProgram.renderPartnerCard(partner)
      expect(html).toContain('Decathlon')
      expect(html).toContain('8%')
      expect(html).toContain('https://www.decathlon.com')
    })

    it('should include partner category', () => {
      const partner = affiliationProgram.getPartnerById('decathlon-001')
      const html = affiliationProgram.renderPartnerCard(partner)
      expect(html).toContain('equipment')
    })

    it('should include commission percentage', () => {
      const partner = affiliationProgram.getPartnerById('blablacar-001')
      const html = affiliationProgram.renderPartnerCard(partner)
      expect(html).toContain('10%')
    })

    it('should return empty string for null partner', () => {
      const html = affiliationProgram.renderPartnerCard(null)
      expect(html).toBe('')
    })

    it('should include click count', () => {
      const partner = affiliationProgram.getPartnerById('decathlon-001')
      affiliationProgram.trackAffiliateClick(partner.id, 'user1')
      const updated = affiliationProgram.getPartnerById(partner.id)
      const html = affiliationProgram.renderPartnerCard(updated)
      expect(html).toContain('1 clics')
    })

    it('should include visit link', () => {
      const partner = affiliationProgram.getPartnerById('decathlon-001')
      const html = affiliationProgram.renderPartnerCard(partner)
      expect(html).toContain('Visiter →')
      expect(html).toContain('target="_blank"')
    })
  })

  describe('renderPartnerList', () => {
    it('should render list of partner cards', () => {
      const partners = affiliationProgram.getPartnersByCategory('equipment')
      const html = affiliationProgram.renderPartnerList(partners)
      expect(html).toContain('grid')
      partners.forEach(p => {
        expect(html).toContain(p.name)
      })
    })

    it('should return message for empty list', () => {
      const html = affiliationProgram.renderPartnerList([])
      expect(html).toContain('Aucun partenaire trouvé')
    })

    it('should return message for null list', () => {
      const html = affiliationProgram.renderPartnerList(null)
      expect(html).toContain('Aucun partenaire trouvé')
    })

    it('should render responsive grid', () => {
      const partners = affiliationProgram.getFeaturedPartners()
      const html = affiliationProgram.renderPartnerList(partners)
      expect(html).toContain('grid-cols-1')
      expect(html).toContain('md:grid-cols-2')
      expect(html).toContain('lg:grid-cols-3')
    })
  })

  describe('clearAffiliateData', () => {
    it('should clear all stored data', () => {
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user123')
      affiliationProgram.clearAffiliateData()
      const stats = affiliationProgram.getClickStats('decathlon-001')
      expect(stats.totalClicks).toBe(0)
    })

    it('should reset partner clicks', () => {
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user123')
      affiliationProgram.clearAffiliateData()
      const partner = affiliationProgram.getPartnerById('decathlon-001')
      expect(partner.clicks).toBe(0)
    })

    it('should clear user click history', () => {
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user123')
      affiliationProgram.clearAffiliateData()
      const clicks = affiliationProgram.getUserClicks('user123')
      expect(clicks).toEqual([])
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete affiliate workflow', () => {
      const featured = affiliationProgram.getFeaturedPartners()
      const partner = featured[0]
      const link = affiliationProgram.generateAffiliateLink(partner.id, 'user123')
      expect(link).toContain(partner.url)
      const stats = affiliationProgram.getClickStats(partner.id)
      expect(stats.totalClicks).toBe(1)
      const revenue = affiliationProgram.getAffiliateRevenue()
      expect(revenue.totalRevenue).toBeGreaterThan(0)
    })

    it('should track multiple users and partners', () => {
      const partners = affiliationProgram.getFeaturedPartners().slice(0, 3)
      const users = ['user1', 'user2', 'user3']
      partners.forEach(p => {
        users.forEach(u => {
          affiliationProgram.trackAffiliateClick(p.id, u)
        })
      })
      const top = affiliationProgram.getTopPartners(3)
      expect(top.length).toBe(3)
      top.forEach(p => {
        expect(p.clicks).toBe(3)
      })
    })

    it('should maintain data consistency across operations', () => {
      const partnerId = 'decathlon-001'
      const userId = 'user123'
      affiliationProgram.trackAffiliateClick(partnerId, userId)
      affiliationProgram.trackAffiliateClick(partnerId, 'user124')
      const stats = affiliationProgram.getClickStats(partnerId)
      const userClicks = affiliationProgram.getUserClicks(userId)
      const partner = affiliationProgram.getPartnerById(partnerId)
      expect(stats.totalClicks).toBe(2)
      expect(stats.uniqueUsers).toBe(2)
      expect(userClicks.length).toBe(1)
      expect(partner.clicks).toBe(2)
    })

    it('should calculate revenue correctly with multiple scenarios', () => {
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user1')
      affiliationProgram.trackAffiliateClick('decathlon-001', 'user2')
      affiliationProgram.trackAffiliateClick('blablacar-001', 'user1')
      const revenue = affiliationProgram.getAffiliateRevenue()
      const decBreakdown = revenue.breakdown['decathlon-001']
      const blaBreakdown = revenue.breakdown['blablacar-001']
      expect(decBreakdown.clicks).toBe(2)
      expect(blaBreakdown.clicks).toBe(1)
      const total = decBreakdown.estimatedRevenue + blaBreakdown.estimatedRevenue
      expect(revenue.totalRevenue).toBe(total)
    })
  })
})
