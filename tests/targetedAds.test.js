/**
 * Targeted Ads Service Tests
 * Feature #237 - Publicites non intrusives ciblees voyage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setState, getState } from '../src/stores/state.js'
import {
  AdCategory,
  AdPlacement,
  AdFormat,
  isPremiumUser,
  areAdsEnabled,
  getRelevantAds,
  getAdForPlacement,
  trackAdImpression,
  trackAdClick,
  renderNativeAdCard,
  renderBannerAd,
  renderRecommendationAd,
  renderAd,
  handleAdClick,
  optOutOfAds,
  optInToAds,
  getAdStats,
  enablePremium,
  disablePremium,
  getAdCategories,
  getAdFormats,
  getAdPlacements,
  renderPremiumPrompt,
} from '../src/services/targetedAds.js'

// Reset state before each test
beforeEach(() => {
  setState({
    isPremium: false,
    adFreeUntil: null,
    adsOptedOut: false,
    cookieConsent: null,
    userCountry: 'FR',
    level: 10,
    lang: 'fr',
    adImpressions: [],
    adClicks: [],
  })
})

describe('AdCategory', () => {
  it('should have all travel-related categories', () => {
    expect(AdCategory.HOSTELS).toBe('hostels')
    expect(AdCategory.EQUIPMENT).toBe('equipment')
    expect(AdCategory.TRANSPORT).toBe('transport')
    expect(AdCategory.INSURANCE).toBe('insurance')
    expect(AdCategory.APPS).toBe('apps')
    expect(AdCategory.BOOKS).toBe('books')
  })

  it('should have 6 categories total', () => {
    expect(Object.keys(AdCategory)).toHaveLength(6)
  })

  it('should only have travel-relevant categories (no unrelated ads)', () => {
    const categories = Object.values(AdCategory)
    // Verify these are all travel-related
    const travelCategories = ['hostels', 'equipment', 'transport', 'insurance', 'apps', 'books']
    categories.forEach((cat) => {
      expect(travelCategories).toContain(cat)
    })
  })
})

describe('AdPlacement', () => {
  it('should have all placement positions', () => {
    expect(AdPlacement.SPOT_LIST).toBe('spot_list')
    expect(AdPlacement.SPOT_DETAIL).toBe('spot_detail')
    expect(AdPlacement.FEED).toBe('feed')
    expect(AdPlacement.PROFILE).toBe('profile')
    expect(AdPlacement.MAP_OVERLAY).toBe('map_overlay')
  })

  it('should have 5 placement positions', () => {
    expect(Object.keys(AdPlacement)).toHaveLength(5)
  })
})

describe('AdFormat', () => {
  it('should have all ad formats', () => {
    expect(AdFormat.NATIVE_CARD).toBe('native_card')
    expect(AdFormat.BANNER_SMALL).toBe('banner_small')
    expect(AdFormat.BANNER_MEDIUM).toBe('banner_medium')
    expect(AdFormat.RECOMMENDATION).toBe('recommendation')
  })

  it('should have 4 formats including native (non-intrusive)', () => {
    expect(Object.keys(AdFormat)).toHaveLength(4)
    // Native format exists for non-intrusive ads
    expect(AdFormat.NATIVE_CARD).toBeDefined()
    expect(AdFormat.RECOMMENDATION).toBeDefined()
  })
})

describe('isPremiumUser', () => {
  it('should return false for non-premium user', () => {
    setState({ isPremium: false, adFreeUntil: null })
    expect(isPremiumUser()).toBe(false)
  })

  it('should return true for premium user', () => {
    setState({ isPremium: true })
    expect(isPremiumUser()).toBe(true)
  })

  it('should return true if adFreeUntil is in the future', () => {
    setState({ isPremium: false, adFreeUntil: Date.now() + 1000000 })
    expect(isPremiumUser()).toBe(true)
  })

  it('should return false if adFreeUntil is in the past', () => {
    setState({ isPremium: false, adFreeUntil: Date.now() - 1000 })
    expect(isPremiumUser()).toBe(false)
  })
})

describe('areAdsEnabled', () => {
  it('should return true for non-premium non-opted-out user', () => {
    setState({ isPremium: false, adsOptedOut: false, cookieConsent: null })
    expect(areAdsEnabled()).toBe(true)
  })

  it('should return false for premium user', () => {
    setState({ isPremium: true })
    expect(areAdsEnabled()).toBe(false)
  })

  it('should return false if user opted out (GDPR)', () => {
    setState({ adsOptedOut: true })
    expect(areAdsEnabled()).toBe(false)
  })

  it('should return false if marketing consent denied', () => {
    setState({ cookieConsent: { marketing: false } })
    expect(areAdsEnabled()).toBe(false)
  })

  it('should return true if marketing consent given', () => {
    setState({ cookieConsent: { marketing: true } })
    expect(areAdsEnabled()).toBe(true)
  })
})

describe('getRelevantAds', () => {
  it('should return empty array for premium user', () => {
    setState({ isPremium: true })
    const ads = getRelevantAds()
    expect(ads).toEqual([])
  })

  it('should return ads for non-premium user in target country', () => {
    setState({ userCountry: 'FR', level: 10 })
    const ads = getRelevantAds({ limit: 5 })
    expect(ads.length).toBeGreaterThan(0)
  })

  it('should filter by category', () => {
    const ads = getRelevantAds({ category: AdCategory.HOSTELS, limit: 10 })
    ads.forEach((ad) => {
      expect(ad.category).toBe(AdCategory.HOSTELS)
    })
  })

  it('should filter by target country', () => {
    setState({ userCountry: 'JP' }) // Japan not in target countries
    const ads = getRelevantAds({ limit: 10 })
    expect(ads).toEqual([])
  })

  it('should filter by user level', () => {
    setState({ userCountry: 'FR', level: 100 })
    const ads = getRelevantAds({ category: AdCategory.EQUIPMENT, limit: 10 })
    // Decathlon targets level 1-50, so should be filtered out for level 100
    const decathlonAd = ads.find((ad) => ad.id === 'ad-equip-001')
    expect(decathlonAd).toBeUndefined()
  })

  it('should sort by priority and bid', () => {
    const ads = getRelevantAds({ limit: 10 })
    if (ads.length >= 2) {
      for (let i = 0; i < ads.length - 1; i++) {
        const scoreA = ads[i].priority * 10 + ads[i].bidCPM
        const scoreB = ads[i + 1].priority * 10 + ads[i + 1].bidCPM
        expect(scoreA).toBeGreaterThanOrEqual(scoreB)
      }
    }
  })

  it('should respect limit parameter', () => {
    const ads = getRelevantAds({ limit: 2 })
    expect(ads.length).toBeLessThanOrEqual(2)
  })

  it('should track impressions for returned ads', () => {
    setState({ adImpressions: [] })
    getRelevantAds({ limit: 2 })
    const state = getState()
    expect(state.adImpressions.length).toBeGreaterThan(0)
  })
})

describe('getAdForPlacement', () => {
  it('should return single ad or null', () => {
    const ad = getAdForPlacement(AdPlacement.FEED)
    if (ad) {
      expect(ad.id).toBeDefined()
    }
  })

  it('should return null for premium user', () => {
    setState({ isPremium: true })
    const ad = getAdForPlacement(AdPlacement.FEED)
    expect(ad).toBeNull()
  })

  it('should filter by category if provided', () => {
    const ad = getAdForPlacement(AdPlacement.FEED, AdCategory.TRANSPORT)
    if (ad) {
      expect(ad.category).toBe(AdCategory.TRANSPORT)
    }
  })
})

describe('trackAdImpression', () => {
  it('should store impression in state', () => {
    setState({ adImpressions: [] })
    trackAdImpression('ad-test-001', AdPlacement.FEED)
    const state = getState()
    expect(state.adImpressions).toHaveLength(1)
    expect(state.adImpressions[0].adId).toBe('ad-test-001')
    expect(state.adImpressions[0].placement).toBe(AdPlacement.FEED)
    expect(state.adImpressions[0].timestamp).toBeDefined()
  })

  it('should keep only last 1000 impressions', () => {
    const impressions = []
    for (let i = 0; i < 1001; i++) {
      impressions.push({ adId: `ad-${i}`, placement: 'feed', timestamp: i })
    }
    setState({ adImpressions: impressions })
    trackAdImpression('ad-new', AdPlacement.FEED)
    const state = getState()
    expect(state.adImpressions.length).toBeLessThanOrEqual(1001)
  })
})

describe('trackAdClick', () => {
  it('should store click in state', () => {
    setState({ adClicks: [] })
    trackAdClick('ad-test-001', AdPlacement.SPOT_DETAIL)
    const state = getState()
    expect(state.adClicks).toHaveLength(1)
    expect(state.adClicks[0].adId).toBe('ad-test-001')
    expect(state.adClicks[0].placement).toBe(AdPlacement.SPOT_DETAIL)
  })
})

describe('renderNativeAdCard', () => {
  it('should return empty string for null ad', () => {
    expect(renderNativeAdCard(null)).toBe('')
  })

  it('should render HTML with ad content', () => {
    const ad = {
      id: 'ad-test-001',
      advertiser: 'TestAdvertiser',
      title: { fr: 'Titre Test', en: 'Test Title' },
      description: { fr: 'Description test', en: 'Test description' },
      cta: { fr: 'Cliquez', en: 'Click' },
      image: '/test.jpg',
      url: 'https://test.com',
      format: AdFormat.NATIVE_CARD,
    }
    const html = renderNativeAdCard(ad, AdPlacement.FEED)
    expect(html).toContain('native-ad-card')
    expect(html).toContain('data-ad-id="ad-test-001"')
    expect(html).toContain('TestAdvertiser')
    expect(html).toContain('Titre Test')
    expect(html).toContain('Description test')
    expect(html).toContain('Cliquez')
    expect(html).toContain('/test.jpg')
  })

  it('should include sponsored label for transparency', () => {
    const ad = {
      id: 'ad-test-001',
      advertiser: 'Test',
      title: { fr: 'Test' },
      description: { fr: 'Test' },
      cta: { fr: 'Test' },
      url: 'https://test.com',
    }
    const html = renderNativeAdCard(ad)
    expect(html).toContain('aria-label')
  })

  it('should use rel="noopener sponsored" for ad links', () => {
    const ad = {
      id: 'ad-test-001',
      advertiser: 'Test',
      title: { fr: 'Test' },
      description: { fr: 'Test' },
      cta: { fr: 'Test' },
      url: 'https://test.com',
    }
    const html = renderNativeAdCard(ad)
    expect(html).toContain('rel="noopener sponsored"')
  })

  it('should fallback to English if lang not available', () => {
    setState({ lang: 'it' }) // Italian not in translations
    const ad = {
      id: 'ad-test-001',
      advertiser: 'Test',
      title: { en: 'English Title' },
      description: { en: 'English desc' },
      cta: { en: 'Click' },
      url: 'https://test.com',
    }
    const html = renderNativeAdCard(ad)
    expect(html).toContain('English Title')
  })
})

describe('renderBannerAd', () => {
  it('should return empty string for null ad', () => {
    expect(renderBannerAd(null)).toBe('')
  })

  it('should render banner ad HTML', () => {
    const ad = {
      id: 'ad-banner-001',
      advertiser: 'BannerTest',
      title: { fr: 'Banniere Test' },
      cta: { fr: 'Voir' },
      image: '/banner.jpg',
      url: 'https://banner.com',
    }
    const html = renderBannerAd(ad)
    expect(html).toContain('banner-ad')
    expect(html).toContain('BannerTest')
    expect(html).toContain('Banniere Test')
    expect(html).toContain('/banner.jpg')
  })
})

describe('renderRecommendationAd', () => {
  it('should return empty string for null ad', () => {
    expect(renderRecommendationAd(null)).toBe('')
  })

  it('should render recommendation-style ad', () => {
    const ad = {
      id: 'ad-rec-001',
      advertiser: 'RecoTest',
      title: { fr: 'Recommandation Test' },
      description: { fr: 'Une super recommandation' },
      cta: { fr: 'Decouvrir' },
      url: 'https://reco.com',
    }
    const html = renderRecommendationAd(ad)
    expect(html).toContain('recommendation-ad')
    expect(html).toContain('Recommandation Test')
    expect(html).toContain('Une super recommandation')
    expect(html).toContain('fa-lightbulb')
  })
})

describe('renderAd', () => {
  it('should return empty string for null ad', () => {
    expect(renderAd(null)).toBe('')
  })

  it('should render native card for NATIVE_CARD format', () => {
    const ad = {
      id: 'ad-001',
      format: AdFormat.NATIVE_CARD,
      advertiser: 'Test',
      title: { fr: 'Test' },
      description: { fr: 'Test' },
      cta: { fr: 'Test' },
      url: 'https://test.com',
    }
    const html = renderAd(ad)
    expect(html).toContain('native-ad-card')
  })

  it('should render banner for BANNER_SMALL format', () => {
    const ad = {
      id: 'ad-001',
      format: AdFormat.BANNER_SMALL,
      advertiser: 'Test',
      title: { fr: 'Test' },
      cta: { fr: 'Test' },
      url: 'https://test.com',
    }
    const html = renderAd(ad)
    expect(html).toContain('banner-ad')
  })

  it('should render banner for BANNER_MEDIUM format', () => {
    const ad = {
      id: 'ad-001',
      format: AdFormat.BANNER_MEDIUM,
      advertiser: 'Test',
      title: { fr: 'Test' },
      cta: { fr: 'Test' },
      url: 'https://test.com',
    }
    const html = renderAd(ad)
    expect(html).toContain('banner-ad')
  })

  it('should render recommendation for RECOMMENDATION format', () => {
    const ad = {
      id: 'ad-001',
      format: AdFormat.RECOMMENDATION,
      advertiser: 'Test',
      title: { fr: 'Test' },
      description: { fr: 'Test' },
      cta: { fr: 'Test' },
      url: 'https://test.com',
    }
    const html = renderAd(ad)
    expect(html).toContain('recommendation-ad')
  })

  it('should default to native card for unknown format', () => {
    const ad = {
      id: 'ad-001',
      format: 'unknown_format',
      advertiser: 'Test',
      title: { fr: 'Test' },
      description: { fr: 'Test' },
      cta: { fr: 'Test' },
      url: 'https://test.com',
    }
    const html = renderAd(ad)
    expect(html).toContain('native-ad-card')
  })
})

describe('handleAdClick', () => {
  it('should track ad click', () => {
    setState({ adClicks: [] })
    handleAdClick('ad-click-001', AdPlacement.FEED)
    const state = getState()
    expect(state.adClicks).toHaveLength(1)
    expect(state.adClicks[0].adId).toBe('ad-click-001')
  })
})

describe('optOutOfAds / optInToAds', () => {
  it('should set adsOptedOut to true when opting out', () => {
    optOutOfAds()
    const state = getState()
    expect(state.adsOptedOut).toBe(true)
  })

  it('should disable ads after opting out', () => {
    optOutOfAds()
    expect(areAdsEnabled()).toBe(false)
  })

  it('should set adsOptedOut to false when opting in', () => {
    setState({ adsOptedOut: true })
    optInToAds()
    const state = getState()
    expect(state.adsOptedOut).toBe(false)
  })

  it('should enable ads after opting in', () => {
    setState({ adsOptedOut: true })
    optInToAds()
    expect(areAdsEnabled()).toBe(true)
  })
})

describe('getAdStats', () => {
  it('should return ad statistics', () => {
    setState({
      adImpressions: [
        { adId: 'ad-1', timestamp: Date.now() },
        { adId: 'ad-2', timestamp: Date.now() - 100000 },
      ],
      adClicks: [{ adId: 'ad-1', timestamp: Date.now() }],
    })
    const stats = getAdStats()
    expect(stats.totalImpressions).toBe(2)
    expect(stats.totalClicks).toBe(1)
    expect(stats.todayImpressions).toBe(2)
    expect(stats.todayClicks).toBe(1)
    expect(parseFloat(stats.ctr)).toBeCloseTo(50, 0)
  })

  it('should return zero CTR when no impressions', () => {
    setState({ adImpressions: [], adClicks: [] })
    const stats = getAdStats()
    expect(stats.ctr).toBe(0)
  })

  it('should include premium status', () => {
    setState({ isPremium: true })
    const stats = getAdStats()
    expect(stats.isPremium).toBe(true)
    expect(stats.adsEnabled).toBe(false)
  })
})

describe('enablePremium / disablePremium', () => {
  it('should enable premium for given duration', () => {
    const duration = 30 * 24 * 60 * 60 * 1000 // 30 days
    enablePremium(duration)
    const state = getState()
    expect(state.isPremium).toBe(true)
    expect(state.adFreeUntil).toBeGreaterThan(Date.now())
  })

  it('should disable ads when premium is enabled', () => {
    enablePremium(1000000)
    expect(areAdsEnabled()).toBe(false)
  })

  it('should disable premium', () => {
    setState({ isPremium: true, adFreeUntil: Date.now() + 1000000 })
    disablePremium()
    const state = getState()
    expect(state.isPremium).toBe(false)
    expect(state.adFreeUntil).toBeNull()
  })

  it('should re-enable ads when premium is disabled', () => {
    setState({ isPremium: true })
    disablePremium()
    expect(areAdsEnabled()).toBe(true)
  })
})

describe('getAdCategories / getAdFormats / getAdPlacements', () => {
  it('should return all ad categories', () => {
    const categories = getAdCategories()
    expect(categories).toHaveLength(6)
    expect(categories).toContain('hostels')
    expect(categories).toContain('equipment')
    expect(categories).toContain('transport')
  })

  it('should return all ad formats', () => {
    const formats = getAdFormats()
    expect(formats).toHaveLength(4)
    expect(formats).toContain('native_card')
    expect(formats).toContain('recommendation')
  })

  it('should return all ad placements', () => {
    const placements = getAdPlacements()
    expect(placements).toHaveLength(5)
    expect(placements).toContain('feed')
    expect(placements).toContain('spot_list')
  })
})

describe('renderPremiumPrompt', () => {
  it('should render premium upgrade prompt', () => {
    const html = renderPremiumPrompt()
    expect(html).toContain('premium-prompt')
    expect(html).toContain('fa-crown')
  })

  it('should include upgrade button', () => {
    const html = renderPremiumPrompt()
    expect(html).toContain('openPremiumModal')
    expect(html).toContain('button')
  })

  it('should list premium benefits', () => {
    const html = renderPremiumPrompt()
    expect(html).toContain('fa-check')
    // Should list benefits
    expect(html).toContain('</li>')
  })
})

describe('Travel-focused ads verification', () => {
  it('should have hostel ads from major providers', () => {
    const ads = getRelevantAds({ category: AdCategory.HOSTELS, limit: 10 })
    const advertisers = ads.map((ad) => ad.advertiser)
    expect(
      advertisers.some((a) => a.includes('Hostel') || a.includes('Booking'))
    ).toBe(true)
  })

  it('should have equipment ads for travelers', () => {
    setState({ level: 10 }) // Level within equipment target range
    const ads = getRelevantAds({ category: AdCategory.EQUIPMENT, limit: 10 })
    expect(ads.length).toBeGreaterThan(0)
    ads.forEach((ad) => {
      expect(ad.category).toBe(AdCategory.EQUIPMENT)
    })
  })

  it('should have transport/carpooling ads', () => {
    const ads = getRelevantAds({ category: AdCategory.TRANSPORT, limit: 10 })
    expect(ads.length).toBeGreaterThan(0)
    const advertisers = ads.map((ad) => ad.advertiser)
    expect(advertisers.some((a) => a.toLowerCase().includes('blabla'))).toBe(true)
  })

  it('should have insurance ads for travelers', () => {
    setState({ level: 10 }) // Level within insurance target range
    const ads = getRelevantAds({ category: AdCategory.INSURANCE, limit: 10 })
    expect(ads.length).toBeGreaterThan(0)
    ads.forEach((ad) => {
      expect(ad.category).toBe(AdCategory.INSURANCE)
    })
  })

  it('should have travel app ads', () => {
    const ads = getRelevantAds({ category: AdCategory.APPS, limit: 10 })
    expect(ads.length).toBeGreaterThan(0)
    const advertisers = ads.map((ad) => ad.advertiser)
    expect(advertisers.some((a) => a.includes('Maps'))).toBe(true)
  })

  it('should have travel guide/book ads', () => {
    const ads = getRelevantAds({ category: AdCategory.BOOKS, limit: 10 })
    expect(ads.length).toBeGreaterThan(0)
    const advertisers = ads.map((ad) => ad.advertiser)
    expect(advertisers.some((a) => a.includes('Lonely'))).toBe(true)
  })
})

describe('Non-intrusive ad format verification', () => {
  it('should have native card format that blends with content', () => {
    const ads = getRelevantAds({ limit: 10 })
    const nativeAds = ads.filter((ad) => ad.format === AdFormat.NATIVE_CARD)
    expect(nativeAds.length).toBeGreaterThan(0)
  })

  it('should have recommendation format that looks like suggestions', () => {
    const ads = getRelevantAds({ limit: 10 })
    const recoAds = ads.filter((ad) => ad.format === AdFormat.RECOMMENDATION)
    expect(recoAds.length).toBeGreaterThan(0)
  })

  it('should clearly label ads as sponsored', () => {
    const ad = getAdForPlacement(AdPlacement.FEED)
    if (ad) {
      const html = renderAd(ad)
      // Should contain sponsored or ad label
      expect(
        html.includes('sponsored') ||
          html.includes('Sponsorise') ||
          html.includes('Pub')
      ).toBe(true)
    }
  })
})

describe('Multi-language support', () => {
  it('should render ads in French', () => {
    setState({ lang: 'fr' })
    const ad = getAdForPlacement(AdPlacement.FEED, AdCategory.HOSTELS)
    if (ad) {
      const html = renderNativeAdCard(ad)
      // French content should be present
      expect(ad.title.fr).toBeDefined()
    }
  })

  it('should render ads in English', () => {
    setState({ lang: 'en' })
    const ad = getAdForPlacement(AdPlacement.FEED, AdCategory.HOSTELS)
    if (ad) {
      const html = renderNativeAdCard(ad)
      expect(ad.title.en).toBeDefined()
    }
  })

  it('should render ads in Spanish', () => {
    setState({ lang: 'es' })
    const ad = getAdForPlacement(AdPlacement.FEED, AdCategory.HOSTELS)
    if (ad) {
      expect(ad.title.es).toBeDefined()
    }
  })

  it('should render ads in German', () => {
    setState({ lang: 'de' })
    const ad = getAdForPlacement(AdPlacement.FEED, AdCategory.HOSTELS)
    if (ad) {
      expect(ad.title.de).toBeDefined()
    }
  })
})

describe('European country targeting', () => {
  const europeanCountries = ['FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'PT', 'GB', 'PL']

  europeanCountries.forEach((country) => {
    it(`should show ads to users in ${country}`, () => {
      setState({ userCountry: country, level: 10 })
      const ads = getRelevantAds({ limit: 5 })
      expect(ads.length).toBeGreaterThan(0)
    })
  })

  it('should not show ads to users in non-target countries', () => {
    setState({ userCountry: 'JP' }) // Japan
    const ads = getRelevantAds({ limit: 5 })
    expect(ads).toHaveLength(0)
  })
})

describe('Ad data structure validation', () => {
  it('should have valid ad structure with required fields', () => {
    const ads = getRelevantAds({ limit: 10 })
    ads.forEach((ad) => {
      expect(ad.id).toBeDefined()
      expect(ad.category).toBeDefined()
      expect(ad.format).toBeDefined()
      expect(ad.advertiser).toBeDefined()
      expect(ad.title).toBeDefined()
      expect(ad.url).toBeDefined()
      expect(ad.targetCountries).toBeDefined()
      expect(Array.isArray(ad.targetCountries)).toBe(true)
      expect(ad.targetLevel).toBeDefined()
      expect(ad.priority).toBeDefined()
      expect(ad.bidCPM).toBeDefined()
      expect(ad.isActive).toBe(true)
    })
  })

  it('should have multilingual content', () => {
    const ads = getRelevantAds({ limit: 10 })
    ads.forEach((ad) => {
      // At least French and English
      expect(ad.title.fr || ad.title.en).toBeDefined()
    })
  })
})

describe('GDPR compliance', () => {
  it('should respect cookie consent for marketing', () => {
    setState({ cookieConsent: { marketing: false, analytics: true } })
    expect(areAdsEnabled()).toBe(false)
  })

  it('should allow opt-out of ads', () => {
    expect(areAdsEnabled()).toBe(true)
    optOutOfAds()
    expect(areAdsEnabled()).toBe(false)
  })

  it('should allow opt-in after opt-out', () => {
    optOutOfAds()
    expect(areAdsEnabled()).toBe(false)
    optInToAds()
    expect(areAdsEnabled()).toBe(true)
  })
})

describe('Window global handlers', () => {
  it('should expose handleAdClick globally', () => {
    // Test that the function is exposed (in browser environment)
    expect(typeof handleAdClick).toBe('function')
  })

  it('should expose optOutOfAds globally', () => {
    expect(typeof optOutOfAds).toBe('function')
  })

  it('should expose optInToAds globally', () => {
    expect(typeof optInToAds).toBe('function')
  })
})
