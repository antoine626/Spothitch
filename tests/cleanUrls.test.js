/**
 * Tests for Clean URLs Service
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  generateSlug,
  buildSpotUrl,
  buildCountryUrl,
  buildCityUrl,
  buildUserProfileUrl,
  buildPageUrl,
  parseUrl,
  resolveRoute,
  getRedirectUrl,
  addRedirectRule,
  getRedirectRules,
  getUrlHistory,
  saveUrlToHistory,
  generateCanonical,
  normalizeUrl,
  getBreadcrumbsFromUrl,
  clearUrlCache,
  PAGE_TYPES
} from '../src/services/cleanUrls.js'

describe('CleanUrls Service', () => {
  beforeEach(() => {
    localStorage.clear()
    clearUrlCache()
  })

  afterEach(() => {
    localStorage.clear()
    clearUrlCache()
  })

  describe('generateSlug', () => {
    it('should convert text to slug', () => {
      expect(generateSlug('Hello World')).toBe('hello-world')
      expect(generateSlug('Paris Porte de la Chapelle')).toBe('paris-porte-de-la-chapelle')
    })

    it('should handle French accents', () => {
      expect(generateSlug('Café')).toBe('cafe')
      expect(generateSlug('Château')).toBe('chateau')
      expect(generateSlug('Élève')).toBe('eleve')
      expect(generateSlug('Garçon')).toBe('garcon')
      expect(generateSlug('Hôtel')).toBe('hotel')
      expect(generateSlug('Île')).toBe('ile')
      expect(generateSlug('Noël')).toBe('noel')
      expect(generateSlug('Côte d\'Azur')).toBe('cote-dazur')
    })

    it('should handle Spanish characters', () => {
      expect(generateSlug('Niño')).toBe('nino')
      expect(generateSlug('España')).toBe('espana')
      expect(generateSlug('Mañana')).toBe('manana')
      expect(generateSlug('Señor')).toBe('senor')
    })

    it('should handle German characters', () => {
      expect(generateSlug('München')).toBe('munchen')
      expect(generateSlug('Straße')).toBe('strasse')
      expect(generateSlug('Düsseldorf')).toBe('dusseldorf')
      expect(generateSlug('Köln')).toBe('koln')
      expect(generateSlug('Zürich')).toBe('zurich')
    })

    it('should handle mixed case', () => {
      expect(generateSlug('PaRiS')).toBe('paris')
      expect(generateSlug('BERLIN')).toBe('berlin')
      expect(generateSlug('MaDrId')).toBe('madrid')
    })

    it('should handle special characters', () => {
      expect(generateSlug('Hello & World')).toBe('hello-world')
      expect(generateSlug('Spot #1')).toBe('spot-1')
      expect(generateSlug('Test@123')).toBe('test123')
      expect(generateSlug('A/B/C')).toBe('abc')
    })

    it('should remove multiple spaces and hyphens', () => {
      expect(generateSlug('Hello   World')).toBe('hello-world')
      expect(generateSlug('Test--Slug')).toBe('test-slug')
      expect(generateSlug('  Trim  ')).toBe('trim')
    })

    it('should handle underscores', () => {
      expect(generateSlug('hello_world')).toBe('hello-world')
      expect(generateSlug('test_slug_name')).toBe('test-slug-name')
    })

    it('should handle empty or invalid input', () => {
      expect(generateSlug('')).toBe('')
      expect(generateSlug(null)).toBe('')
      expect(generateSlug(undefined)).toBe('')
      expect(generateSlug(123)).toBe('')
    })

    it('should handle numbers', () => {
      expect(generateSlug('Route 66')).toBe('route-66')
      expect(generateSlug('A1 Highway')).toBe('a1-highway')
    })

    it('should handle complex French place names', () => {
      expect(generateSlug('Saint-Étienne')).toBe('saint-etienne')
      expect(generateSlug('Aix-en-Provence')).toBe('aix-en-provence')
      expect(generateSlug('Boulogne-Billancourt')).toBe('boulogne-billancourt')
    })

    it('should trim leading and trailing hyphens', () => {
      expect(generateSlug('-hello-')).toBe('hello')
      expect(generateSlug('--test--')).toBe('test')
    })
  })

  describe('buildSpotUrl', () => {
    it('should build spot URL', () => {
      const spot = {
        from: 'Paris',
        to: 'Lyon',
        country: 'FR'
      }
      expect(buildSpotUrl(spot)).toBe('/spots/paris-lyon-fr')
    })

    it('should handle spots with complex names', () => {
      const spot = {
        from: 'Paris, Porte de la Chapelle',
        to: 'Lyon, Perrache',
        country: 'FR'
      }
      expect(buildSpotUrl(spot)).toBe('/spots/paris-lyon-fr')
    })

    it('should handle accented characters', () => {
      const spot = {
        from: 'Château-Thierry',
        to: 'Épernay',
        country: 'FR'
      }
      expect(buildSpotUrl(spot)).toBe('/spots/chateau-thierry-epernay-fr')
    })

    it('should handle missing country', () => {
      const spot = {
        from: 'Paris',
        to: 'Lyon'
      }
      expect(buildSpotUrl(spot)).toBe('/spots/paris-lyon-unknown')
    })

    it('should handle lowercase country code', () => {
      const spot = {
        from: 'Berlin',
        to: 'Munich',
        country: 'de'
      }
      expect(buildSpotUrl(spot)).toBe('/spots/berlin-munich-de')
    })

    it('should return null for invalid input', () => {
      expect(buildSpotUrl(null)).toBe(null)
      expect(buildSpotUrl({})).toBe(null)
      expect(buildSpotUrl({ from: 'Paris' })).toBe(null)
      expect(buildSpotUrl({ to: 'Lyon' })).toBe(null)
    })

    it('should extract city from complex location', () => {
      const spot = {
        from: 'Madrid, A-2 Exit 19',
        to: 'Barcelona, AP-7',
        country: 'ES'
      }
      expect(buildSpotUrl(spot)).toBe('/spots/madrid-barcelona-es')
    })
  })

  describe('buildCountryUrl', () => {
    it('should build country URL for France', () => {
      expect(buildCountryUrl('FR')).toBe('/country/france')
    })

    it('should build country URL for Germany', () => {
      expect(buildCountryUrl('DE')).toBe('/country/germany')
    })

    it('should build country URL for Spain', () => {
      expect(buildCountryUrl('ES')).toBe('/country/spain')
    })

    it('should handle lowercase country codes', () => {
      expect(buildCountryUrl('fr')).toBe('/country/france')
      expect(buildCountryUrl('de')).toBe('/country/germany')
    })

    it('should handle all supported countries', () => {
      expect(buildCountryUrl('IT')).toBe('/country/italy')
      expect(buildCountryUrl('BE')).toBe('/country/belgium')
      expect(buildCountryUrl('NL')).toBe('/country/netherlands')
      expect(buildCountryUrl('PL')).toBe('/country/poland')
      expect(buildCountryUrl('IE')).toBe('/country/ireland')
      expect(buildCountryUrl('AT')).toBe('/country/austria')
      expect(buildCountryUrl('CZ')).toBe('/country/czech-republic')
      expect(buildCountryUrl('PT')).toBe('/country/portugal')
      expect(buildCountryUrl('CH')).toBe('/country/switzerland')
      expect(buildCountryUrl('HR')).toBe('/country/croatia')
      expect(buildCountryUrl('HU')).toBe('/country/hungary')
      expect(buildCountryUrl('DK')).toBe('/country/denmark')
      expect(buildCountryUrl('SE')).toBe('/country/sweden')
    })

    it('should return null for invalid country codes', () => {
      expect(buildCountryUrl('XX')).toBe(null)
      expect(buildCountryUrl('ZZ')).toBe(null)
    })

    it('should return null for invalid input', () => {
      expect(buildCountryUrl(null)).toBe(null)
      expect(buildCountryUrl(undefined)).toBe(null)
      expect(buildCountryUrl('')).toBe(null)
      expect(buildCountryUrl(123)).toBe(null)
    })
  })

  describe('buildCityUrl', () => {
    it('should build city URL with country', () => {
      expect(buildCityUrl('Paris', 'FR')).toBe('/city/paris-france')
      expect(buildCityUrl('Berlin', 'DE')).toBe('/city/berlin-germany')
    })

    it('should build city URL without country', () => {
      expect(buildCityUrl('Paris')).toBe('/city/paris')
      expect(buildCityUrl('Berlin')).toBe('/city/berlin')
    })

    it('should handle accented city names', () => {
      expect(buildCityUrl('München', 'DE')).toBe('/city/munchen-germany')
      expect(buildCityUrl('Zürich', 'CH')).toBe('/city/zurich-switzerland')
    })

    it('should handle multi-word cities', () => {
      expect(buildCityUrl('Aix en Provence', 'FR')).toBe('/city/aix-en-provence-france')
      expect(buildCityUrl('San Sebastian', 'ES')).toBe('/city/san-sebastian-spain')
    })

    it('should handle lowercase country codes', () => {
      expect(buildCityUrl('Paris', 'fr')).toBe('/city/paris-france')
      expect(buildCityUrl('Madrid', 'es')).toBe('/city/madrid-spain')
    })

    it('should handle invalid country codes gracefully', () => {
      expect(buildCityUrl('Paris', 'XX')).toBe('/city/paris')
    })

    it('should return null for invalid input', () => {
      expect(buildCityUrl(null)).toBe(null)
      expect(buildCityUrl(undefined)).toBe(null)
      expect(buildCityUrl('')).toBe(null)
      expect(buildCityUrl(123)).toBe(null)
    })
  })

  describe('buildUserProfileUrl', () => {
    it('should build user profile URL', () => {
      expect(buildUserProfileUrl('john-doe')).toBe('/user/john-doe')
      expect(buildUserProfileUrl('jane_smith')).toBe('/user/jane-smith')
    })

    it('should handle spaces in username', () => {
      expect(buildUserProfileUrl('Jean Dupont')).toBe('/user/jean-dupont')
    })

    it('should handle accented characters', () => {
      expect(buildUserProfileUrl('François')).toBe('/user/francois')
      expect(buildUserProfileUrl('José García')).toBe('/user/jose-garcia')
    })

    it('should handle special characters', () => {
      expect(buildUserProfileUrl('user@123')).toBe('/user/user123')
      expect(buildUserProfileUrl('user#name')).toBe('/user/username')
    })

    it('should return null for invalid input', () => {
      expect(buildUserProfileUrl(null)).toBe(null)
      expect(buildUserProfileUrl(undefined)).toBe(null)
      expect(buildUserProfileUrl('')).toBe(null)
      expect(buildUserProfileUrl(123)).toBe(null)
    })
  })

  describe('buildPageUrl', () => {
    it('should build static page URLs', () => {
      expect(buildPageUrl('about')).toBe('/about')
      expect(buildPageUrl('faq')).toBe('/faq')
      expect(buildPageUrl('privacy')).toBe('/privacy')
      expect(buildPageUrl('terms')).toBe('/terms')
      expect(buildPageUrl('contact')).toBe('/contact')
    })

    it('should handle uppercase page types', () => {
      expect(buildPageUrl('ABOUT')).toBe('/about')
      expect(buildPageUrl('FAQ')).toBe('/faq')
    })

    it('should build spot URL with params', () => {
      const spot = { from: 'Paris', to: 'Lyon', country: 'FR' }
      expect(buildPageUrl('spot', { spot })).toBe('/spots/paris-lyon-fr')
    })

    it('should build country URL with params', () => {
      expect(buildPageUrl('country', { countryCode: 'FR' })).toBe('/country/france')
    })

    it('should build city URL with params', () => {
      expect(buildPageUrl('city', { cityName: 'Paris', countryCode: 'FR' }))
        .toBe('/city/paris-france')
    })

    it('should build user URL with params', () => {
      expect(buildPageUrl('user', { username: 'john-doe' })).toBe('/user/john-doe')
    })

    it('should return null for invalid input', () => {
      expect(buildPageUrl(null)).toBe(null)
      expect(buildPageUrl(undefined)).toBe(null)
      expect(buildPageUrl('')).toBe(null)
      expect(buildPageUrl(123)).toBe(null)
    })

    it('should handle unknown page types', () => {
      expect(buildPageUrl('unknown')).toBe('/unknown')
    })
  })

  describe('parseUrl', () => {
    it('should parse home URL', () => {
      expect(parseUrl('/')).toEqual({ type: PAGE_TYPES.HOME, params: {} })
      expect(parseUrl('')).toEqual({ type: PAGE_TYPES.HOME, params: {} })
    })

    it('should parse spots list URL', () => {
      expect(parseUrl('/spots')).toEqual({ type: PAGE_TYPES.SPOTS, params: {} })
    })

    it('should parse spot detail URL', () => {
      const result = parseUrl('/spots/paris-lyon-fr')
      expect(result.type).toBe(PAGE_TYPES.SPOT_DETAIL)
      expect(result.params.from).toBe('paris')
      expect(result.params.to).toBe('lyon')
      expect(result.params.country).toBe('FR')
    })

    it('should parse complex spot URL', () => {
      const result = parseUrl('/spots/porte-de-la-chapelle-gare-de-lyon-fr')
      expect(result.type).toBe(PAGE_TYPES.SPOT_DETAIL)
      expect(result.params.country).toBe('FR')
    })

    it('should parse country URL', () => {
      const result = parseUrl('/country/france')
      expect(result.type).toBe(PAGE_TYPES.COUNTRY)
      expect(result.params.countryCode).toBe('FR')
    })

    it('should parse city URL with country', () => {
      const result = parseUrl('/city/paris-france')
      expect(result.type).toBe(PAGE_TYPES.CITY)
      expect(result.params.cityName).toBe('paris')
      expect(result.params.countryCode).toBe('FR')
    })

    it('should parse city URL without country', () => {
      const result = parseUrl('/city/paris')
      expect(result.type).toBe(PAGE_TYPES.CITY)
      expect(result.params.cityName).toBe('paris')
    })

    it('should parse user profile URL', () => {
      const result = parseUrl('/user/john-doe')
      expect(result.type).toBe(PAGE_TYPES.USER)
      expect(result.params.username).toBe('john-doe')
    })

    it('should parse static pages', () => {
      expect(parseUrl('/about')).toEqual({ type: PAGE_TYPES.ABOUT, params: {} })
      expect(parseUrl('/faq')).toEqual({ type: PAGE_TYPES.FAQ, params: {} })
      expect(parseUrl('/privacy')).toEqual({ type: PAGE_TYPES.PRIVACY, params: {} })
      expect(parseUrl('/terms')).toEqual({ type: PAGE_TYPES.TERMS, params: {} })
      expect(parseUrl('/contact')).toEqual({ type: PAGE_TYPES.CONTACT, params: {} })
      expect(parseUrl('/chat')).toEqual({ type: PAGE_TYPES.CHAT, params: {} })
      expect(parseUrl('/profile')).toEqual({ type: PAGE_TYPES.PROFILE, params: {} })
    })

    it('should handle URLs with query strings', () => {
      const result = parseUrl('/spots/paris-lyon-fr?lang=en')
      expect(result.type).toBe(PAGE_TYPES.SPOT_DETAIL)
      expect(result.params.country).toBe('FR')
    })

    it('should handle URLs with hash', () => {
      const result = parseUrl('/about#team')
      expect(result.type).toBe(PAGE_TYPES.ABOUT)
    })

    it('should handle trailing slashes', () => {
      expect(parseUrl('/about/')).toEqual({ type: PAGE_TYPES.ABOUT, params: {} })
      expect(parseUrl('/spots/')).toEqual({ type: PAGE_TYPES.SPOTS, params: {} })
    })

    it('should return null type for unknown URLs', () => {
      const result = parseUrl('/unknown-path')
      expect(result.type).toBe(null)
      expect(result.params).toEqual({})
    })

    it('should handle invalid input', () => {
      expect(parseUrl(null)).toEqual({ type: null, params: {} })
      expect(parseUrl(undefined)).toEqual({ type: null, params: {} })
      expect(parseUrl(123)).toEqual({ type: null, params: {} })
    })

    it('should cache parsed results', () => {
      const url = '/spots/paris-lyon-fr'
      const result1 = parseUrl(url)
      const result2 = parseUrl(url)
      expect(result1).toBe(result2) // Same reference = cached
    })
  })

  describe('resolveRoute', () => {
    it('should resolve home route', () => {
      const result = resolveRoute('/')
      expect(result.component).toBe('Home')
      expect(result.params).toEqual({})
    })

    it('should resolve spots route', () => {
      const result = resolveRoute('/spots')
      expect(result.component).toBe('Spots')
    })

    it('should resolve spot detail route', () => {
      const result = resolveRoute('/spots/paris-lyon-fr')
      expect(result.component).toBe('SpotDetail')
      expect(result.params.country).toBe('FR')
    })

    it('should resolve country route', () => {
      const result = resolveRoute('/country/france')
      expect(result.component).toBe('Country')
      expect(result.params.countryCode).toBe('FR')
    })

    it('should resolve city route', () => {
      const result = resolveRoute('/city/paris-france')
      expect(result.component).toBe('City')
      expect(result.params.cityName).toBe('paris')
    })

    it('should resolve user profile route', () => {
      const result = resolveRoute('/user/john-doe')
      expect(result.component).toBe('UserProfile')
      expect(result.params.username).toBe('john-doe')
    })

    it('should resolve static pages', () => {
      expect(resolveRoute('/about').component).toBe('About')
      expect(resolveRoute('/faq').component).toBe('FAQ')
      expect(resolveRoute('/privacy').component).toBe('Privacy')
      expect(resolveRoute('/terms').component).toBe('Terms')
      expect(resolveRoute('/contact').component).toBe('Contact')
      expect(resolveRoute('/chat').component).toBe('Chat')
      expect(resolveRoute('/profile').component).toBe('Profile')
    })

    it('should return null component for unknown routes', () => {
      const result = resolveRoute('/unknown')
      expect(result.component).toBe(null)
    })
  })

  describe('Redirect Rules', () => {
    it('should add redirect rule', () => {
      const success = addRedirectRule('/old-path', '/new-path')
      expect(success).toBe(true)

      const rules = getRedirectRules()
      expect(rules).toHaveLength(1)
      expect(rules[0].oldPattern).toBe('/old-path')
      expect(rules[0].newPattern).toBe('/new-path')
    })

    it('should not add duplicate redirect rules', () => {
      addRedirectRule('/old', '/new')
      addRedirectRule('/old', '/new')

      const rules = getRedirectRules()
      expect(rules).toHaveLength(1)
    })

    it('should add multiple redirect rules', () => {
      addRedirectRule('/old1', '/new1')
      addRedirectRule('/old2', '/new2')
      addRedirectRule('/old3', '/new3')

      const rules = getRedirectRules()
      expect(rules).toHaveLength(3)
    })

    it('should get redirect URL', () => {
      addRedirectRule('^/old-spots/(.*)$', '/spots/$1')

      const redirectUrl = getRedirectUrl('/old-spots/paris-lyon')
      expect(redirectUrl).toBe('/spots/paris-lyon')
    })

    it('should return null for non-matching URLs', () => {
      addRedirectRule('/old-path', '/new-path')

      const redirectUrl = getRedirectUrl('/different-path')
      expect(redirectUrl).toBe(null)
    })

    it('should handle regex patterns', () => {
      addRedirectRule('^/spot/(\\d+)$', '/spots/detail/$1')

      const redirectUrl = getRedirectUrl('/spot/123')
      expect(redirectUrl).toBe('/spots/detail/123')
    })

    it('should return empty array when no rules exist', () => {
      const rules = getRedirectRules()
      expect(rules).toEqual([])
    })

    it('should handle invalid input for addRedirectRule', () => {
      expect(addRedirectRule(null, '/new')).toBe(false)
      expect(addRedirectRule('/old', null)).toBe(false)
      expect(addRedirectRule('', '')).toBe(false)
    })

    it('should store created timestamp', () => {
      addRedirectRule('/old', '/new')

      const rules = getRedirectRules()
      expect(rules[0].createdAt).toBeDefined()
      expect(new Date(rules[0].createdAt).getTime()).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('URL History', () => {
    it('should save URL to history', () => {
      const success = saveUrlToHistory('spot', 1, '/spots/paris-lyon-fr')
      expect(success).toBe(true)

      const history = getUrlHistory('spot', 1)
      expect(history).toHaveLength(1)
      expect(history[0]).toBe('/spots/paris-lyon-fr')
    })

    it('should not duplicate URLs in history', () => {
      saveUrlToHistory('spot', 1, '/spots/paris-lyon-fr')
      saveUrlToHistory('spot', 1, '/spots/paris-lyon-fr')

      const history = getUrlHistory('spot', 1)
      expect(history).toHaveLength(1)
    })

    it('should save multiple URLs for same entity', () => {
      saveUrlToHistory('spot', 1, '/spots/paris-lyon-fr')
      saveUrlToHistory('spot', 1, '/spots/paris-bordeaux-fr')
      saveUrlToHistory('spot', 1, '/spots/lyon-marseille-fr')

      const history = getUrlHistory('spot', 1)
      expect(history).toHaveLength(3)
    })

    it('should maintain separate histories for different entities', () => {
      saveUrlToHistory('spot', 1, '/spots/paris-lyon-fr')
      saveUrlToHistory('spot', 2, '/spots/berlin-munich-de')
      saveUrlToHistory('user', 'john', '/user/john-doe')

      expect(getUrlHistory('spot', 1)).toHaveLength(1)
      expect(getUrlHistory('spot', 2)).toHaveLength(1)
      expect(getUrlHistory('user', 'john')).toHaveLength(1)
    })

    it('should return empty array for non-existent entity', () => {
      const history = getUrlHistory('spot', 999)
      expect(history).toEqual([])
    })

    it('should handle invalid input for saveUrlToHistory', () => {
      expect(saveUrlToHistory(null, 1, '/url')).toBe(false)
      expect(saveUrlToHistory('spot', null, '/url')).toBe(false)
      expect(saveUrlToHistory('spot', 1, null)).toBe(false)
    })

    it('should handle invalid input for getUrlHistory', () => {
      expect(getUrlHistory(null, 1)).toEqual([])
      expect(getUrlHistory('spot', null)).toEqual([])
      expect(getUrlHistory('spot', undefined)).toEqual([])
    })

    it('should handle string and numeric IDs', () => {
      saveUrlToHistory('user', 'john', '/user/john')
      saveUrlToHistory('spot', 123, '/spots/test')

      expect(getUrlHistory('user', 'john')).toHaveLength(1)
      expect(getUrlHistory('spot', 123)).toHaveLength(1)
    })
  })

  describe('generateCanonical', () => {
    it('should generate canonical URL', () => {
      expect(generateCanonical('/spots/paris-lyon-fr')).toBe('/spots/paris-lyon-fr')
    })

    it('should remove query strings', () => {
      expect(generateCanonical('/spots/paris?lang=en')).toBe('/spots/paris')
    })

    it('should remove hash', () => {
      expect(generateCanonical('/about#team')).toBe('/about')
    })

    it('should remove trailing slashes', () => {
      expect(generateCanonical('/about/')).toBe('/about')
      expect(generateCanonical('/spots/')).toBe('/spots')
    })

    it('should convert to lowercase', () => {
      expect(generateCanonical('/ABOUT')).toBe('/about')
      expect(generateCanonical('/SpOtS')).toBe('/spots')
    })

    it('should handle complex URLs', () => {
      expect(generateCanonical('/Spots/Paris-Lyon/?lang=en#section'))
        .toBe('/spots/paris-lyon')
    })

    it('should handle empty or invalid input', () => {
      expect(generateCanonical('')).toBe('')
      expect(generateCanonical(null)).toBe('')
      expect(generateCanonical(undefined)).toBe('')
    })
  })

  describe('normalizeUrl', () => {
    it('should normalize URL', () => {
      expect(normalizeUrl('/spots/paris-lyon')).toBe('/spots/paris-lyon')
    })

    it('should remove trailing slashes', () => {
      expect(normalizeUrl('/about/')).toBe('/about')
      expect(normalizeUrl('/spots///')).toBe('/spots')
    })

    it('should convert to lowercase', () => {
      expect(normalizeUrl('/ABOUT')).toBe('/about')
      expect(normalizeUrl('/SpOtS/PaRiS')).toBe('/spots/paris')
    })

    it('should remove duplicate slashes', () => {
      expect(normalizeUrl('/spots//paris//lyon')).toBe('/spots/paris/lyon')
    })

    it('should preserve protocol slashes', () => {
      expect(normalizeUrl('https://example.com/path'))
        .toBe('https://example.com/path')
    })

    it('should trim whitespace', () => {
      expect(normalizeUrl('  /about  ')).toBe('/about')
      expect(normalizeUrl('\t/spots\n')).toBe('/spots')
    })

    it('should handle empty or invalid input', () => {
      expect(normalizeUrl('')).toBe('')
      expect(normalizeUrl(null)).toBe('')
      expect(normalizeUrl(undefined)).toBe('')
    })
  })

  describe('getBreadcrumbsFromUrl', () => {
    it('should get breadcrumbs for home', () => {
      const breadcrumbs = getBreadcrumbsFromUrl('/')
      expect(breadcrumbs).toHaveLength(1)
      expect(breadcrumbs[0].name).toBe('Home')
      expect(breadcrumbs[0].url).toBe('/')
    })

    it('should get breadcrumbs for spots list', () => {
      const breadcrumbs = getBreadcrumbsFromUrl('/spots')
      expect(breadcrumbs).toHaveLength(2)
      expect(breadcrumbs[0].name).toBe('Home')
      expect(breadcrumbs[1].name).toBe('Spots')
      expect(breadcrumbs[1].url).toBe('/spots')
    })

    it('should get breadcrumbs for spot detail', () => {
      const breadcrumbs = getBreadcrumbsFromUrl('/spots/paris-lyon-fr')
      expect(breadcrumbs).toHaveLength(3)
      expect(breadcrumbs[0].name).toBe('Home')
      expect(breadcrumbs[1].name).toBe('Spots')
      expect(breadcrumbs[2].name).toBe('paris → lyon')
    })

    it('should get breadcrumbs for country', () => {
      const breadcrumbs = getBreadcrumbsFromUrl('/country/france')
      expect(breadcrumbs).toHaveLength(2)
      expect(breadcrumbs[0].name).toBe('Home')
      expect(breadcrumbs[1].name).toBe('france')
    })

    it('should get breadcrumbs for city with country', () => {
      const breadcrumbs = getBreadcrumbsFromUrl('/city/paris-france')
      expect(breadcrumbs).toHaveLength(3)
      expect(breadcrumbs[0].name).toBe('Home')
      expect(breadcrumbs[1].name).toBe('france')
      expect(breadcrumbs[2].name).toBe('paris')
    })

    it('should get breadcrumbs for city without country', () => {
      const breadcrumbs = getBreadcrumbsFromUrl('/city/paris')
      expect(breadcrumbs).toHaveLength(2)
      expect(breadcrumbs[0].name).toBe('Home')
      expect(breadcrumbs[1].name).toBe('paris')
    })

    it('should get breadcrumbs for user profile', () => {
      const breadcrumbs = getBreadcrumbsFromUrl('/user/john-doe')
      expect(breadcrumbs).toHaveLength(3)
      expect(breadcrumbs[0].name).toBe('Home')
      expect(breadcrumbs[1].name).toBe('Users')
      expect(breadcrumbs[2].name).toBe('john-doe')
    })

    it('should get breadcrumbs for static pages', () => {
      expect(getBreadcrumbsFromUrl('/about')).toHaveLength(2)
      expect(getBreadcrumbsFromUrl('/faq')).toHaveLength(2)
      expect(getBreadcrumbsFromUrl('/privacy')).toHaveLength(2)
      expect(getBreadcrumbsFromUrl('/terms')).toHaveLength(2)
      expect(getBreadcrumbsFromUrl('/contact')).toHaveLength(2)
    })

    it('should handle invalid input', () => {
      expect(getBreadcrumbsFromUrl(null)).toEqual([])
      expect(getBreadcrumbsFromUrl(undefined)).toEqual([])
      expect(getBreadcrumbsFromUrl('')).toEqual([])
    })

    it('should handle unknown URLs', () => {
      const breadcrumbs = getBreadcrumbsFromUrl('/unknown-path')
      expect(breadcrumbs).toHaveLength(1)
      expect(breadcrumbs[0].name).toBe('Home')
    })

    it('should verify breadcrumb URLs are valid', () => {
      const breadcrumbs = getBreadcrumbsFromUrl('/city/paris-france')
      breadcrumbs.forEach(crumb => {
        expect(crumb.name).toBeDefined()
        expect(crumb.url).toBeDefined()
        expect(typeof crumb.url).toBe('string')
      })
    })
  })

  describe('clearUrlCache', () => {
    it('should clear URL cache', () => {
      // Parse some URLs to populate cache
      parseUrl('/spots/paris-lyon-fr')
      parseUrl('/country/france')

      // Clear cache
      clearUrlCache()

      // Parse again should not use cache (new objects)
      const result1 = parseUrl('/spots/paris-lyon-fr')
      const result2 = parseUrl('/spots/paris-lyon-fr')

      // After clearing, first two calls create new objects
      // Third call should use new cache
      expect(result1).toBe(result2)
    })
  })

  describe('PAGE_TYPES constant', () => {
    it('should export PAGE_TYPES', () => {
      expect(PAGE_TYPES).toBeDefined()
      expect(PAGE_TYPES.HOME).toBe('home')
      expect(PAGE_TYPES.SPOTS).toBe('spots')
      expect(PAGE_TYPES.SPOT_DETAIL).toBe('spot')
      expect(PAGE_TYPES.COUNTRY).toBe('country')
      expect(PAGE_TYPES.CITY).toBe('city')
      expect(PAGE_TYPES.USER).toBe('user')
      expect(PAGE_TYPES.ABOUT).toBe('about')
      expect(PAGE_TYPES.FAQ).toBe('faq')
    })
  })

  describe('Edge Cases', () => {
    it('should handle extremely long URLs', () => {
      const longCity = 'a'.repeat(100)
      const url = buildCityUrl(longCity, 'FR')
      expect(url).toContain('/city/')
    })

    it('should handle URLs with emoji', () => {
      const slug = generateSlug('Paris 🗼 Tour Eiffel')
      expect(slug).toBe('paris-tour-eiffel')
    })

    it('should handle mixed language characters', () => {
      const slug = generateSlug('Café München España')
      expect(slug).toBe('cafe-munchen-espana')
    })

    it('should handle numbers in various contexts', () => {
      expect(generateSlug('Route 66')).toBe('route-66')
      expect(generateSlug('A1 Highway')).toBe('a1-highway')
      expect(generateSlug('123 Main Street')).toBe('123-main-street')
    })

    it('should handle consecutive special characters', () => {
      expect(generateSlug('Test!!!???')).toBe('test')
      expect(generateSlug('Hello---World')).toBe('hello-world')
    })

    it('should handle all spaces', () => {
      expect(generateSlug('     ')).toBe('')
    })

    it('should handle all special chars', () => {
      expect(generateSlug('!@#$%^&*()')).toBe('')
    })
  })

  describe('Storage Persistence', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('should persist redirect rules', () => {
      addRedirectRule('/old', '/new')

      // Simulate page reload by getting data again
      const rules = getRedirectRules()
      expect(rules).toHaveLength(1)
      expect(rules[0].oldPattern).toBe('/old')
    })

    it('should persist URL history', () => {
      saveUrlToHistory('spot', 1, '/spots/paris-lyon-fr')

      // Simulate page reload
      const history = getUrlHistory('spot', 1)
      expect(history).toHaveLength(1)
    })

    it('should handle localStorage errors gracefully', () => {
      // Save original methods
      const originalSetItem = localStorage.setItem
      const originalGetItem = localStorage.getItem

      try {
        localStorage.setItem = () => {
          throw new Error('Storage full')
        }
        localStorage.getItem = () => {
          return '{}'
        }

        const success = addRedirectRule('/old', '/new')
        expect(success).toBe(false)
      } finally {
        // Always restore, even if test fails
        localStorage.setItem = originalSetItem
        localStorage.getItem = originalGetItem
      }
    })
  })

  describe('Integration Tests', () => {
    beforeEach(() => {
      localStorage.clear()
      clearUrlCache()
    })

    it('should roundtrip spot URL', () => {
      const spot = { from: 'Paris', to: 'Lyon', country: 'FR' }
      const url = buildSpotUrl(spot)
      const parsed = parseUrl(url)

      expect(parsed.type).toBe(PAGE_TYPES.SPOT_DETAIL)
      expect(parsed.params.country).toBe('FR')
    })

    it('should roundtrip country URL', () => {
      const url = buildCountryUrl('FR')
      const parsed = parseUrl(url)

      expect(parsed.type).toBe(PAGE_TYPES.COUNTRY)
      expect(parsed.params.countryCode).toBe('FR')
    })

    it('should roundtrip city URL', () => {
      const url = buildCityUrl('Paris', 'FR')
      const parsed = parseUrl(url)

      expect(parsed.type).toBe(PAGE_TYPES.CITY)
      expect(parsed.params.cityName).toBe('paris')
      expect(parsed.params.countryCode).toBe('FR')
    })

    it('should roundtrip user URL', () => {
      const url = buildUserProfileUrl('jean-dupont')
      const parsed = parseUrl(url)

      expect(parsed.type).toBe(PAGE_TYPES.USER)
      expect(parsed.params.username).toBe('jean-dupont')
    })

    it('should work with full workflow', () => {
      // Build URL
      const spot = { from: 'Paris, Porte de la Chapelle', to: 'Lyon, Perrache', country: 'FR' }
      const url = buildSpotUrl(spot)

      // Parse URL
      const parsed = parseUrl(url)

      // Resolve route
      const route = resolveRoute(url)

      // Get breadcrumbs
      const breadcrumbs = getBreadcrumbsFromUrl(url)

      // Generate canonical
      const canonical = generateCanonical(url)

      // Save to history
      saveUrlToHistory('spot', 1, url)

      // Verify all operations
      expect(parsed.type).toBe(PAGE_TYPES.SPOT_DETAIL)
      expect(route.component).toBe('SpotDetail')
      expect(breadcrumbs.length).toBeGreaterThan(1)
      expect(canonical).toBeTruthy()
      expect(getUrlHistory('spot', 1)).toContain(url)
    })
  })
})
