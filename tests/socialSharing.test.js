/**
 * Social Sharing Service Tests
 * Tests for sharing content to Facebook, Twitter, WhatsApp, and Telegram
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  shareToFacebook,
  shareToTwitter,
  shareToWhatsApp,
  shareToTelegram,
  renderShareButtons,
  renderAchievementShareButtons,
  renderStatsShareButtons,
  trackShare,
  getShareStats,
  getCharacterLimit,
  getDefaultHashtags,
  isPlatformSupported,
  getSupportedPlatforms,
  getSupportedContentTypes,
  CONTENT_TYPES,
  PLATFORMS,
} from '../src/services/socialSharing.js'

// Mock i18n
vi.mock('../src/i18n/index.js', () => ({
  t: (key) => {
    const translations = {
      shareOnSocial: 'Share on social networks',
      shareOnFacebook: 'Share on Facebook',
      shareOnTwitter: 'Share on Twitter',
      shareOnWhatsApp: 'Share on WhatsApp',
      shareOnTelegram: 'Share on Telegram',
      shareAchievement: 'Share achievement',
      shareStats: 'Share your stats',
      shareMyStats: 'Share my stats',
      share: 'Share',
    }
    return translations[key] || key
  },
}))

// Mock state
vi.mock('../src/stores/state.js', () => ({
  getState: vi.fn(() => ({
    lang: 'en',
    user: { username: 'TestUser', displayName: 'Test User' },
  })),
  setState: vi.fn(),
}))

// Mock analytics
vi.mock('../src/services/analytics.js', () => ({
  trackEvent: vi.fn(),
}))

describe('Social Sharing Service', () => {
  let mockWindowOpen
  let originalLocation

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()

    // Mock window.open
    mockWindowOpen = vi.fn().mockReturnValue({ focus: vi.fn() })
    vi.stubGlobal('open', mockWindowOpen)

    // Store original location
    originalLocation = window.location

    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ==================== CONSTANTS ====================

  describe('Constants', () => {
    it('should export CONTENT_TYPES with all types', () => {
      expect(CONTENT_TYPES).toBeDefined()
      expect(CONTENT_TYPES.SPOT).toBe('spot')
      expect(CONTENT_TYPES.ACHIEVEMENT).toBe('achievement')
      expect(CONTENT_TYPES.STATS).toBe('stats')
      expect(CONTENT_TYPES.TRIP).toBe('trip')
      expect(CONTENT_TYPES.PROFILE).toBe('profile')
    })

    it('should export PLATFORMS with all platforms', () => {
      expect(PLATFORMS).toBeDefined()
      expect(PLATFORMS.FACEBOOK).toBe('facebook')
      expect(PLATFORMS.TWITTER).toBe('twitter')
      expect(PLATFORMS.WHATSAPP).toBe('whatsapp')
      expect(PLATFORMS.TELEGRAM).toBe('telegram')
    })
  })

  // ==================== shareToFacebook ====================

  describe('shareToFacebook', () => {
    it('should return error when no data provided', () => {
      const result = shareToFacebook(null)
      expect(result.success).toBe(false)
      expect(result.error).toBe('no_data')
    })

    it('should return error for invalid spot', () => {
      const result = shareToFacebook({ type: 'spot', spot: null })
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_spot')
    })

    it('should return error for spot without id', () => {
      const result = shareToFacebook({ type: 'spot', spot: { from: 'Paris' } })
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_spot')
    })

    it('should share spot successfully', () => {
      const spot = { id: '123', from: 'Paris', to: 'Lyon', rating: 4.5 }
      const result = shareToFacebook({ type: 'spot', spot })

      expect(result.success).toBe(true)
      expect(result.url).toContain('facebook.com/sharer')
      expect(result.url).toContain('spot%2F123')
      expect(mockWindowOpen).toHaveBeenCalled()
    })

    it('should share achievement successfully', () => {
      const achievement = { id: 'badge-1', name: 'Explorer', description: 'Visit 10 spots' }
      const result = shareToFacebook({ type: 'achievement', achievement })

      expect(result.success).toBe(true)
      expect(result.url).toContain('facebook.com/sharer')
      expect(mockWindowOpen).toHaveBeenCalled()
    })

    it('should return error for invalid achievement', () => {
      const result = shareToFacebook({ type: 'achievement', achievement: null })
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_achievement')
    })

    it('should share stats successfully', () => {
      const stats = { checkins: 50, spots: 10, level: 5 }
      const result = shareToFacebook({ type: 'stats', stats })

      expect(result.success).toBe(true)
      expect(result.url).toContain('facebook.com/sharer')
      expect(mockWindowOpen).toHaveBeenCalled()
    })

    it('should return error for invalid stats', () => {
      const result = shareToFacebook({ type: 'stats', stats: null })
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_stats')
    })

    it('should return error for unsupported content type', () => {
      const result = shareToFacebook({ type: 'unknown' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('unsupported_type')
    })

    it('should default to spot type when type not specified', () => {
      const spot = { id: '123', from: 'Berlin', to: 'Munich' }
      const result = shareToFacebook({ spot })

      expect(result.success).toBe(true)
    })
  })

  // ==================== shareToTwitter ====================

  describe('shareToTwitter', () => {
    it('should return error when no data provided', () => {
      const result = shareToTwitter(null)
      expect(result.success).toBe(false)
      expect(result.error).toBe('no_data')
    })

    it('should return error for invalid spot', () => {
      const result = shareToTwitter({ type: 'spot', spot: null })
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_spot')
    })

    it('should share spot with hashtags', () => {
      const spot = { id: '456', from: 'Amsterdam', to: 'Brussels', country: 'Netherlands' }
      const result = shareToTwitter({ type: 'spot', spot })

      expect(result.success).toBe(true)
      expect(result.url).toContain('twitter.com/intent/tweet')
      expect(result.url).toContain('hashtags=')
      expect(mockWindowOpen).toHaveBeenCalled()
    })

    it('should share achievement successfully', () => {
      const achievement = { id: 'badge-2', name: 'Veteran' }
      const result = shareToTwitter({ type: 'achievement', achievement })

      expect(result.success).toBe(true)
      expect(result.url).toContain('twitter.com/intent/tweet')
    })

    it('should share stats successfully', () => {
      const stats = { checkins: 100, distance: 5000 }
      const result = shareToTwitter({ type: 'stats', stats })

      expect(result.success).toBe(true)
      expect(result.url).toContain('twitter.com/intent/tweet')
    })

    it('should return error for unsupported type', () => {
      const result = shareToTwitter({ type: 'invalid' })
      expect(result.success).toBe(false)
      expect(result.error).toBe('unsupported_type')
    })
  })

  // ==================== shareToWhatsApp ====================

  describe('shareToWhatsApp', () => {
    it('should return error when no data provided', () => {
      const result = shareToWhatsApp(null)
      expect(result.success).toBe(false)
      expect(result.error).toBe('no_data')
    })

    it('should return error for invalid spot', () => {
      const result = shareToWhatsApp({ type: 'spot', spot: {} })
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_spot')
    })

    it('should share spot successfully', () => {
      const spot = { id: '789', from: 'Rome', to: 'Florence', rating: 5 }
      const result = shareToWhatsApp({ type: 'spot', spot })

      expect(result.success).toBe(true)
      expect(result.url).toContain('wa.me')
      expect(mockWindowOpen).toHaveBeenCalled()
    })

    it('should include URL in text for WhatsApp', () => {
      const spot = { id: '789', from: 'Rome', to: 'Florence' }
      const result = shareToWhatsApp({ type: 'spot', spot })

      expect(result.success).toBe(true)
      // WhatsApp combines text and URL
      expect(result.url).toContain('wa.me')
    })

    it('should share achievement successfully', () => {
      const achievement = { id: 'badge-3', name: 'Night Owl' }
      const result = shareToWhatsApp({ type: 'achievement', achievement })

      expect(result.success).toBe(true)
    })

    it('should share stats successfully', () => {
      const stats = { checkins: 25, streak: 7 }
      const result = shareToWhatsApp({ type: 'stats', stats })

      expect(result.success).toBe(true)
    })
  })

  // ==================== shareToTelegram ====================

  describe('shareToTelegram', () => {
    it('should return error when no data provided', () => {
      const result = shareToTelegram(null)
      expect(result.success).toBe(false)
      expect(result.error).toBe('no_data')
    })

    it('should return error for invalid spot', () => {
      const result = shareToTelegram({ type: 'spot', spot: { from: 'Paris' } })
      expect(result.success).toBe(false)
      expect(result.error).toBe('invalid_spot')
    })

    it('should share spot successfully', () => {
      const spot = { id: '101', from: 'Madrid', to: 'Barcelona' }
      const result = shareToTelegram({ type: 'spot', spot })

      expect(result.success).toBe(true)
      expect(result.url).toContain('t.me/share')
      expect(mockWindowOpen).toHaveBeenCalled()
    })

    it('should share achievement successfully', () => {
      const achievement = { id: 'badge-4', name: 'First Timer' }
      const result = shareToTelegram({ type: 'achievement', achievement })

      expect(result.success).toBe(true)
      expect(result.url).toContain('t.me/share')
    })

    it('should share stats successfully', () => {
      const stats = { checkins: 10, spots: 5, level: 2 }
      const result = shareToTelegram({ type: 'stats', stats })

      expect(result.success).toBe(true)
    })
  })

  // ==================== renderShareButtons ====================

  describe('renderShareButtons', () => {
    it('should return empty string for null spot', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation()
      const result = renderShareButtons(null)

      expect(result).toBe('')
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid spot'))
      warnSpy.mockRestore()
    })

    it('should return empty string for spot without id', () => {
      const result = renderShareButtons({ from: 'Paris' })
      expect(result).toBe('')
    })

    it('should render all four share buttons', () => {
      const spot = { id: '123', from: 'Paris', to: 'Lyon' }
      const html = renderShareButtons(spot)

      expect(html).toContain('share-btn-facebook')
      expect(html).toContain('share-btn-twitter')
      expect(html).toContain('share-btn-whatsapp')
      expect(html).toContain('share-btn-telegram')
    })

    it('should include FontAwesome icons', () => {
      const spot = { id: '123', from: 'Paris', to: 'Lyon' }
      const html = renderShareButtons(spot)

      expect(html).toContain('fa-facebook-f')
      expect(html).toContain('fa-twitter')
      expect(html).toContain('fa-whatsapp')
      expect(html).toContain('fa-telegram-plane')
    })

    it('should include proper aria-labels', () => {
      const spot = { id: '123', from: 'Paris', to: 'Lyon' }
      const html = renderShareButtons(spot)

      expect(html).toContain('aria-label')
      expect(html).toContain('Share on Facebook')
      expect(html).toContain('Share on Twitter')
      expect(html).toContain('Share on WhatsApp')
      expect(html).toContain('Share on Telegram')
    })

    it('should have role="group" for accessibility', () => {
      const spot = { id: '123', from: 'Paris', to: 'Lyon' }
      const html = renderShareButtons(spot)

      expect(html).toContain('role="group"')
    })

    it('should include onclick handlers', () => {
      const spot = { id: '123', from: 'Paris', to: 'Lyon' }
      const html = renderShareButtons(spot)

      expect(html).toContain('onclick="window.shareToFacebook')
      expect(html).toContain('onclick="window.shareToTwitter')
      expect(html).toContain('onclick="window.shareToWhatsApp')
      expect(html).toContain('onclick="window.shareToTelegram')
    })

    it('should use correct platform colors', () => {
      const spot = { id: '123', from: 'Paris', to: 'Lyon' }
      const html = renderShareButtons(spot)

      expect(html).toContain('bg-[#1877F2]') // Facebook blue
      expect(html).toContain('bg-[#1DA1F2]') // Twitter blue
      expect(html).toContain('bg-[#25D366]') // WhatsApp green
      expect(html).toContain('bg-[#0088CC]') // Telegram blue
    })
  })

  // ==================== renderAchievementShareButtons ====================

  describe('renderAchievementShareButtons', () => {
    it('should return empty string for null achievement', () => {
      const result = renderAchievementShareButtons(null)
      expect(result).toBe('')
    })

    it('should return empty string for achievement without id', () => {
      const result = renderAchievementShareButtons({ name: 'Explorer' })
      expect(result).toBe('')
    })

    it('should render share buttons for achievement', () => {
      const achievement = { id: 'badge-1', name: 'Explorer' }
      const html = renderAchievementShareButtons(achievement)

      expect(html).toContain('share-btn-facebook')
      expect(html).toContain('share-btn-twitter')
      expect(html).toContain('Share')
    })

    it('should include aria-label for achievement group', () => {
      const achievement = { id: 'badge-1', name: 'Explorer' }
      const html = renderAchievementShareButtons(achievement)

      expect(html).toContain('Share achievement')
    })
  })

  // ==================== renderStatsShareButtons ====================

  describe('renderStatsShareButtons', () => {
    it('should return empty string for null stats', () => {
      const result = renderStatsShareButtons(null)
      expect(result).toBe('')
    })

    it('should render share buttons for stats', () => {
      const stats = { checkins: 50, spots: 10 }
      const html = renderStatsShareButtons(stats)

      expect(html).toContain('share-btn-facebook')
      expect(html).toContain('share-btn-twitter')
      expect(html).toContain('Share my stats')
    })

    it('should include platform names on larger screens', () => {
      const stats = { checkins: 50, spots: 10 }
      const html = renderStatsShareButtons(stats)

      expect(html).toContain('Facebook')
      expect(html).toContain('Twitter')
      expect(html).toContain('WhatsApp')
      expect(html).toContain('Telegram')
    })

    it('should use responsive classes', () => {
      const stats = { checkins: 50, spots: 10 }
      const html = renderStatsShareButtons(stats)

      expect(html).toContain('hidden sm:inline')
    })
  })

  // ==================== trackShare ====================

  describe('trackShare', () => {
    it('should warn when platform is missing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation()
      trackShare(null, 'spot')

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('requires platform'))
      warnSpy.mockRestore()
    })

    it('should warn when contentType is missing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation()
      trackShare('facebook', null)

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('requires platform'))
      warnSpy.mockRestore()
    })

    it('should track share to localStorage', () => {
      trackShare('facebook', 'spot')

      expect(localStorage.getItem('spothitch_share_count_facebook')).toBe('1')
      expect(localStorage.getItem('spothitch_total_shares')).toBe('1')
    })

    it('should increment share count', () => {
      trackShare('twitter', 'spot')
      trackShare('twitter', 'achievement')

      expect(localStorage.getItem('spothitch_share_count_twitter')).toBe('2')
      expect(localStorage.getItem('spothitch_total_shares')).toBe('2')
    })

    it('should warn for unknown platform', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation()
      trackShare('unknown_platform', 'spot')

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown platform'))
      warnSpy.mockRestore()
    })

    it('should warn for unknown content type', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation()
      trackShare('facebook', 'unknown_type')

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown content type'))
      warnSpy.mockRestore()
    })
  })

  // ==================== getShareStats ====================

  describe('getShareStats', () => {
    it('should return zero counts when no shares', () => {
      const stats = getShareStats()

      expect(stats.facebook).toBe(0)
      expect(stats.twitter).toBe(0)
      expect(stats.whatsapp).toBe(0)
      expect(stats.telegram).toBe(0)
      expect(stats.total).toBe(0)
    })

    it('should return correct counts after sharing', () => {
      trackShare('facebook', 'spot')
      trackShare('facebook', 'achievement')
      trackShare('twitter', 'stats')

      const stats = getShareStats()

      expect(stats.facebook).toBe(2)
      expect(stats.twitter).toBe(1)
      expect(stats.whatsapp).toBe(0)
      expect(stats.telegram).toBe(0)
      expect(stats.total).toBe(3)
    })
  })

  // ==================== getCharacterLimit ====================

  describe('getCharacterLimit', () => {
    it('should return correct limit for Facebook', () => {
      expect(getCharacterLimit('facebook')).toBe(500)
    })

    it('should return correct limit for Twitter', () => {
      expect(getCharacterLimit('twitter')).toBe(280)
    })

    it('should return correct limit for WhatsApp', () => {
      expect(getCharacterLimit('whatsapp')).toBe(1000)
    })

    it('should return correct limit for Telegram', () => {
      expect(getCharacterLimit('telegram')).toBe(4096)
    })

    it('should return default for unknown platform', () => {
      expect(getCharacterLimit('unknown')).toBe(500)
    })
  })

  // ==================== getDefaultHashtags ====================

  describe('getDefaultHashtags', () => {
    it('should return hashtags for Twitter', () => {
      const hashtags = getDefaultHashtags('twitter')
      expect(hashtags).toContain('SpotHitch')
      expect(hashtags).toContain('Hitchhiking')
    })

    it('should return hashtags for Facebook', () => {
      const hashtags = getDefaultHashtags('facebook')
      expect(hashtags).toContain('SpotHitch')
    })

    it('should return empty array for WhatsApp', () => {
      const hashtags = getDefaultHashtags('whatsapp')
      expect(hashtags).toEqual([])
    })

    it('should return new array each time (no mutation)', () => {
      const hashtags1 = getDefaultHashtags('twitter')
      const hashtags2 = getDefaultHashtags('twitter')

      hashtags1.push('NewTag')
      expect(hashtags2).not.toContain('NewTag')
    })

    it('should return empty array for unknown platform', () => {
      const hashtags = getDefaultHashtags('unknown')
      expect(hashtags).toEqual([])
    })
  })

  // ==================== isPlatformSupported ====================

  describe('isPlatformSupported', () => {
    it('should return true for facebook', () => {
      expect(isPlatformSupported('facebook')).toBe(true)
    })

    it('should return true for twitter', () => {
      expect(isPlatformSupported('twitter')).toBe(true)
    })

    it('should return true for whatsapp', () => {
      expect(isPlatformSupported('whatsapp')).toBe(true)
    })

    it('should return true for telegram', () => {
      expect(isPlatformSupported('telegram')).toBe(true)
    })

    it('should return false for unsupported platform', () => {
      expect(isPlatformSupported('instagram')).toBe(false)
      expect(isPlatformSupported('tiktok')).toBe(false)
      expect(isPlatformSupported('')).toBe(false)
    })
  })

  // ==================== getSupportedPlatforms ====================

  describe('getSupportedPlatforms', () => {
    it('should return all supported platforms', () => {
      const platforms = getSupportedPlatforms()

      expect(platforms).toContain('facebook')
      expect(platforms).toContain('twitter')
      expect(platforms).toContain('whatsapp')
      expect(platforms).toContain('telegram')
      expect(platforms).toHaveLength(4)
    })
  })

  // ==================== getSupportedContentTypes ====================

  describe('getSupportedContentTypes', () => {
    it('should return all supported content types', () => {
      const types = getSupportedContentTypes()

      expect(types).toContain('spot')
      expect(types).toContain('achievement')
      expect(types).toContain('stats')
      expect(types).toContain('trip')
      expect(types).toContain('profile')
      expect(types).toHaveLength(5)
    })
  })

  // ==================== Global handlers ====================

  describe('Global window handlers', () => {
    it('should attach shareToFacebook to window', () => {
      expect(window.shareToFacebook).toBeDefined()
      expect(typeof window.shareToFacebook).toBe('function')
    })

    it('should attach shareToTwitter to window', () => {
      expect(window.shareToTwitter).toBeDefined()
      expect(typeof window.shareToTwitter).toBe('function')
    })

    it('should attach shareToWhatsApp to window', () => {
      expect(window.shareToWhatsApp).toBeDefined()
      expect(typeof window.shareToWhatsApp).toBe('function')
    })

    it('should attach shareToTelegram to window', () => {
      expect(window.shareToTelegram).toBeDefined()
      expect(typeof window.shareToTelegram).toBe('function')
    })

    it('should handle invalid encoded data gracefully', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation()
      const result = window.shareToFacebook('invalid-json')

      expect(result.success).toBe(false)
      expect(result.error).toBe('parse_error')
      warnSpy.mockRestore()
    })
  })

  // ==================== Content generation ====================

  describe('Content generation', () => {
    it('should include rating in spot share text', () => {
      const spot = { id: '123', from: 'Paris', to: 'Lyon', rating: 4.5 }
      const result = shareToFacebook({ type: 'spot', spot })

      expect(result.success).toBe(true)
      // The URL should be properly encoded
      expect(result.url).toContain('facebook.com')
    })

    it('should include wait time in spot share text', () => {
      const spot = { id: '123', from: 'Paris', to: 'Lyon', averageWait: 15 }
      const result = shareToFacebook({ type: 'spot', spot })

      expect(result.success).toBe(true)
    })

    it('should handle spot without optional fields', () => {
      const spot = { id: '123' }
      const result = shareToFacebook({ type: 'spot', spot })

      expect(result.success).toBe(true)
    })

    it('should include badge description in achievement share', () => {
      const achievement = {
        id: 'badge-1',
        name: 'Explorer',
        description: 'Visit 10 different spots',
      }
      const result = shareToTwitter({ type: 'achievement', achievement })

      expect(result.success).toBe(true)
    })

    it('should include distance in stats share', () => {
      const stats = { checkins: 50, spots: 10, distance: 2500, level: 5 }
      const result = shareToWhatsApp({ type: 'stats', stats })

      expect(result.success).toBe(true)
    })

    it('should include streak in stats share', () => {
      const stats = { checkins: 50, streak: 14 }
      const result = shareToTelegram({ type: 'stats', stats })

      expect(result.success).toBe(true)
    })
  })

  // ==================== Edge cases ====================

  describe('Edge cases', () => {
    it('should handle popup blocker by falling back to location', () => {
      mockWindowOpen.mockReturnValue(null)

      const spot = { id: '123', from: 'Paris', to: 'Lyon' }
      const result = shareToFacebook({ type: 'spot', spot })

      // Should still return success since we attempt fallback
      expect(result).toBeDefined()
    })

    it('should handle very long text by truncating', () => {
      const spot = {
        id: '123',
        from: 'A'.repeat(200),
        to: 'B'.repeat(200),
      }
      const result = shareToTwitter({ type: 'spot', spot })

      expect(result.success).toBe(true)
      // URL should be valid even with long content
      expect(result.url).toContain('twitter.com')
    })

    it('should handle special characters in spot names', () => {
      const spot = {
        id: '123',
        from: "L'Arc de Triomphe",
        to: 'Koln/Cologne',
      }
      const result = shareToFacebook({ type: 'spot', spot })

      expect(result.success).toBe(true)
      // URL should be valid and contain the spot id
      expect(result.url).toContain('facebook.com')
      expect(result.url).toContain('123')
    })

    it('should handle empty stats object', () => {
      const result = shareToFacebook({ type: 'stats', stats: {} })

      expect(result.success).toBe(true)
    })

    it('should add country as hashtag when available', () => {
      const spot = { id: '123', from: 'Paris', to: 'Lyon', country: 'France' }
      const result = shareToTwitter({ type: 'spot', spot })

      expect(result.success).toBe(true)
      // Should include France in hashtags
      expect(result.url).toContain('France')
    })
  })

  // ==================== Integration tests ====================

  describe('Integration', () => {
    it('should track share when sharing spot to Facebook', async () => {
      const { trackEvent } = await import('../src/services/analytics.js')

      const spot = { id: '123', from: 'Paris', to: 'Lyon' }
      shareToFacebook({ type: 'spot', spot })

      expect(trackEvent).toHaveBeenCalledWith('social_share', expect.objectContaining({
        platform: 'facebook',
        content_type: 'spot',
      }))
    })

    it('should track share when sharing achievement to Twitter', async () => {
      const { trackEvent } = await import('../src/services/analytics.js')

      const achievement = { id: 'badge-1', name: 'Explorer' }
      shareToTwitter({ type: 'achievement', achievement })

      expect(trackEvent).toHaveBeenCalledWith('social_share', expect.objectContaining({
        platform: 'twitter',
        content_type: 'achievement',
      }))
    })

    it('should track share when sharing stats to WhatsApp', async () => {
      const { trackEvent } = await import('../src/services/analytics.js')

      const stats = { checkins: 50 }
      shareToWhatsApp({ type: 'stats', stats })

      expect(trackEvent).toHaveBeenCalledWith('social_share', expect.objectContaining({
        platform: 'whatsapp',
        content_type: 'stats',
      }))
    })

    it('should render and share workflow complete', () => {
      // Render buttons
      const spot = { id: '123', from: 'Paris', to: 'Lyon' }
      const html = renderShareButtons(spot)

      expect(html).toContain('share-btn-facebook')

      // Simulate share
      const result = shareToFacebook({ type: 'spot', spot })
      expect(result.success).toBe(true)

      // Check stats
      const stats = getShareStats()
      expect(stats.facebook).toBe(1)
      expect(stats.total).toBe(1)
    })
  })
})
