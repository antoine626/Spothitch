/**
 * SEO Utilities Tests
 * Complete test coverage for meta tags, hreflang, resource hints, and schemas
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getOrganizationSchema,
  getWebAppSchema,
  getSpotSchema,
  getBreadcrumbSchema,
  getFAQSchema,
  injectSchema,
  updateMetaTags,
  generateSitemapXML,
  trackPageView,
  setHreflangTags,
  getHreflangTags,
  setGeoMetaTags,
  getGeoMetaTags,
  setRobotsDirectives,
  getRobotsDirectives,
  addPreload,
  addPrefetch,
  addDnsPrefetch,
  addPreconnect,
  getResourceHints,
  setPinterestMeta,
  setLinkedInMeta,
  setPWAMetaTags,
  getPWAMetaTags,
  updatePageMeta,
  getPageMetaConfig,
  getSupportedLanguages,
  getLanguageLocale,
  setViewportMeta,
  getViewportMeta,
  setReferrerPolicy,
  cleanupSEO,
  initSEO,
} from '../src/utils/seo.js'

describe('SEO Utilities', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.title = ''
  })

  afterEach(() => {
    cleanupSEO()
  })

  // =========================================
  // SCHEMA TESTS
  // =========================================

  describe('getOrganizationSchema', () => {
    it('should return valid Organization schema', () => {
      const schema = getOrganizationSchema()

      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('Organization')
      expect(schema.name).toBe('SpotHitch')
      expect(schema.url).toContain('spothitch')
      expect(schema.logo).toContain('icon-512.png')
      expect(schema.sameAs).toBeInstanceOf(Array)
      expect(schema.contactPoint).toBeDefined()
    })
  })

  describe('getWebAppSchema', () => {
    it('should return valid WebApplication schema', () => {
      const schema = getWebAppSchema()

      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('WebApplication')
      expect(schema.name).toBe('SpotHitch')
      expect(schema.applicationCategory).toBe('TravelApplication')
      expect(schema.offers.price).toBe('0')
      expect(schema.featureList).toBeInstanceOf(Array)
      expect(schema.featureList.length).toBeGreaterThan(0)
    })
  })

  describe('getSpotSchema', () => {
    it('should return valid Place schema for spot', () => {
      const spot = {
        from: 'Paris',
        to: 'Lyon',
        description: 'Great spot',
        coordinates: { lat: 48.8566, lng: 2.3522 },
        country: 'FR',
        globalRating: 4.5,
        totalReviews: 10,
      }

      const schema = getSpotSchema(spot)

      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('Place')
      expect(schema.name).toContain('Paris')
      expect(schema.name).toContain('Lyon')
      expect(schema.description).toBe('Great spot')
      expect(schema.geo.latitude).toBe(48.8566)
      expect(schema.geo.longitude).toBe(2.3522)
      expect(schema.aggregateRating.ratingValue).toBe('4.5')
    })

    it('should handle spot without rating', () => {
      const spot = {
        from: 'Paris',
        to: 'Lyon',
        description: 'Test',
        coordinates: { lat: 48, lng: 2 },
        country: 'FR',
      }

      const schema = getSpotSchema(spot)

      expect(schema.aggregateRating).toBeUndefined()
    })
  })

  describe('getBreadcrumbSchema', () => {
    it('should return valid BreadcrumbList schema', () => {
      const items = [
        { name: 'Home', url: 'https://example.com' },
        { name: 'Spots', url: 'https://example.com/spots' },
      ]

      const schema = getBreadcrumbSchema(items)

      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('BreadcrumbList')
      expect(schema.itemListElement).toHaveLength(2)
      expect(schema.itemListElement[0].position).toBe(1)
      expect(schema.itemListElement[0].name).toBe('Home')
      expect(schema.itemListElement[1].position).toBe(2)
    })
  })

  describe('getFAQSchema', () => {
    it('should return valid FAQPage schema', () => {
      const schema = getFAQSchema()

      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('FAQPage')
      expect(schema.mainEntity).toBeInstanceOf(Array)
      expect(schema.mainEntity.length).toBeGreaterThan(0)
      expect(schema.mainEntity[0]['@type']).toBe('Question')
      expect(schema.mainEntity[0].acceptedAnswer['@type']).toBe('Answer')
    })
  })

  describe('injectSchema', () => {
    it('should create script element with schema', () => {
      const schema = { '@type': 'Test' }
      injectSchema(schema, 'test-schema')

      const script = document.getElementById('test-schema')
      expect(script).not.toBeNull()
      expect(script.type).toBe('application/ld+json')
      expect(script.textContent).toBe(JSON.stringify(schema))
    })

    it('should update existing script element', () => {
      const schema1 = { '@type': 'Test1' }
      const schema2 = { '@type': 'Test2' }

      injectSchema(schema1, 'test-schema')
      injectSchema(schema2, 'test-schema')

      const scripts = document.querySelectorAll('#test-schema')
      expect(scripts).toHaveLength(1)
      expect(scripts[0].textContent).toBe(JSON.stringify(schema2))
    })
  })

  // =========================================
  // META TAGS TESTS
  // =========================================

  describe('updateMetaTags', () => {
    it('should update title', () => {
      updateMetaTags({ title: 'Test Page' })

      expect(document.title).toBe('Test Page | SpotHitch')
    })

    it('should update description meta tag', () => {
      updateMetaTags({ description: 'Test description' })

      const meta = document.querySelector('meta[name="description"]')
      expect(meta).not.toBeNull()
      expect(meta.content).toBe('Test description')
    })

    it('should update Open Graph meta tags', () => {
      updateMetaTags({
        title: 'Test',
        description: 'Test desc',
        image: 'https://example.com/image.png',
      })

      const ogTitle = document.querySelector('meta[property="og:title"]')
      const ogDesc = document.querySelector('meta[property="og:description"]')
      const ogImage = document.querySelector('meta[property="og:image"]')

      expect(ogTitle.content).toBe('Test')
      expect(ogDesc.content).toBe('Test desc')
      expect(ogImage.content).toBe('https://example.com/image.png')
    })

    it('should update Twitter meta tags', () => {
      updateMetaTags({
        title: 'Test',
        description: 'Test desc',
      })

      const twitterTitle = document.querySelector('meta[property="twitter:title"]')
      const twitterDesc = document.querySelector('meta[property="twitter:description"]')

      expect(twitterTitle.content).toBe('Test')
      expect(twitterDesc.content).toBe('Test desc')
    })

    it('should create canonical link', () => {
      updateMetaTags({ url: 'https://example.com/page' })

      const canonical = document.querySelector('link[rel="canonical"]')
      expect(canonical).not.toBeNull()
      expect(canonical.href).toBe('https://example.com/page')
    })

    it('should update keywords meta tag', () => {
      updateMetaTags({ keywords: 'autostop, voyage, europe' })

      const meta = document.querySelector('meta[name="keywords"]')
      expect(meta).not.toBeNull()
      expect(meta.content).toBe('autostop, voyage, europe')
    })

    it('should update author meta tag', () => {
      updateMetaTags({ author: 'SpotHitch Team' })

      const meta = document.querySelector('meta[name="author"]')
      expect(meta).not.toBeNull()
      expect(meta.content).toBe('SpotHitch Team')
    })

    it('should update robots meta tag', () => {
      updateMetaTags({ robots: 'noindex, nofollow' })

      const meta = document.querySelector('meta[name="robots"]')
      expect(meta).not.toBeNull()
      expect(meta.content).toBe('noindex, nofollow')
    })
  })

  // =========================================
  // HREFLANG TESTS
  // =========================================

  describe('setHreflangTags', () => {
    it('should create hreflang links for all supported languages', () => {
      setHreflangTags('fr', '/')

      const links = document.querySelectorAll('link[rel="alternate"][hreflang]')
      expect(links.length).toBeGreaterThanOrEqual(4) // fr, en, es, de + x-default
    })

    it('should include x-default hreflang', () => {
      setHreflangTags('fr', '/')

      const xDefault = document.querySelector('link[hreflang="x-default"]')
      expect(xDefault).not.toBeNull()
    })

    it('should use correct locale format', () => {
      setHreflangTags('fr', '/')

      const frLink = document.querySelector('link[hreflang="fr-FR"]')
      expect(frLink).not.toBeNull()
    })

    it('should remove existing hreflang links before adding new ones', () => {
      setHreflangTags('fr', '/')
      setHreflangTags('en', '/spots')

      // Should not have duplicate links
      const links = document.querySelectorAll('link[rel="alternate"][hreflang]')
      const hrefs = Array.from(links).map(l => l.href)
      const uniqueHrefs = [...new Set(hrefs)]
      expect(hrefs.length).toBe(uniqueHrefs.length)
    })

    it('should handle path with query params', () => {
      setHreflangTags('fr', '/?tab=spots')

      const frLink = document.querySelector('link[hreflang="fr-FR"]')
      expect(frLink.href).toContain('&lang=fr')
    })
  })

  describe('getHreflangTags', () => {
    it('should return all hreflang links', () => {
      setHreflangTags('fr', '/')

      const tags = getHreflangTags()
      expect(tags.length).toBeGreaterThan(0)
      expect(tags[0]).toHaveProperty('hreflang')
      expect(tags[0]).toHaveProperty('href')
    })

    it('should return empty array when no hreflang links', () => {
      const tags = getHreflangTags()
      expect(tags).toEqual([])
    })
  })

  // =========================================
  // GEO META TAGS TESTS
  // =========================================

  describe('setGeoMetaTags', () => {
    it('should set geo position meta tag', () => {
      setGeoMetaTags({ lat: 48.8566, lng: 2.3522 })

      const position = document.querySelector('meta[name="geo.position"]')
      expect(position).not.toBeNull()
      expect(position.content).toBe('48.8566;2.3522')
    })

    it('should set ICBM meta tag', () => {
      setGeoMetaTags({ lat: 48.8566, lng: 2.3522 })

      const icbm = document.querySelector('meta[name="ICBM"]')
      expect(icbm).not.toBeNull()
      expect(icbm.content).toBe('48.8566, 2.3522')
    })

    it('should set region meta tag', () => {
      setGeoMetaTags({ region: 'FR-IDF' })

      const region = document.querySelector('meta[name="geo.region"]')
      expect(region).not.toBeNull()
      expect(region.content).toBe('FR-IDF')
    })

    it('should set placename meta tag', () => {
      setGeoMetaTags({ placename: 'Paris' })

      const placename = document.querySelector('meta[name="geo.placename"]')
      expect(placename).not.toBeNull()
      expect(placename.content).toBe('Paris')
    })

    it('should set country meta tag', () => {
      setGeoMetaTags({ country: 'France' })

      const country = document.querySelector('meta[name="geo.country"]')
      expect(country).not.toBeNull()
      expect(country.content).toBe('France')
    })

    it('should handle null geo data', () => {
      expect(() => setGeoMetaTags(null)).not.toThrow()
    })
  })

  describe('getGeoMetaTags', () => {
    it('should return geo meta data', () => {
      setGeoMetaTags({
        lat: 48.8566,
        lng: 2.3522,
        region: 'FR-IDF',
        placename: 'Paris',
        country: 'France'
      })

      const geo = getGeoMetaTags()
      expect(geo.lat).toBe(48.8566)
      expect(geo.lng).toBe(2.3522)
      expect(geo.region).toBe('FR-IDF')
      expect(geo.placename).toBe('Paris')
      expect(geo.country).toBe('France')
    })

    it('should return empty object when no geo meta tags', () => {
      const geo = getGeoMetaTags()
      expect(geo).toEqual({})
    })
  })

  // =========================================
  // ROBOTS DIRECTIVES TESTS
  // =========================================

  describe('setRobotsDirectives', () => {
    it('should set default index, follow directives', () => {
      const result = setRobotsDirectives()

      expect(result).toContain('index')
      expect(result).toContain('follow')
    })

    it('should set noindex directive', () => {
      const result = setRobotsDirectives({ index: false })

      expect(result).toContain('noindex')
    })

    it('should set nofollow directive', () => {
      const result = setRobotsDirectives({ follow: false })

      expect(result).toContain('nofollow')
    })

    it('should set noarchive directive', () => {
      const result = setRobotsDirectives({ noarchive: true })

      expect(result).toContain('noarchive')
    })

    it('should set max-snippet directive', () => {
      const result = setRobotsDirectives({ maxSnippet: 160 })

      expect(result).toContain('max-snippet:160')
    })

    it('should set max-image-preview directive', () => {
      const result = setRobotsDirectives({ maxImagePreview: 'large' })

      expect(result).toContain('max-image-preview:large')
    })

    it('should set max-video-preview directive', () => {
      const result = setRobotsDirectives({ maxVideoPreview: 30 })

      expect(result).toContain('max-video-preview:30')
    })

    it('should combine multiple directives', () => {
      const result = setRobotsDirectives({
        index: false,
        follow: false,
        noarchive: true,
        nosnippet: true
      })

      expect(result).toContain('noindex')
      expect(result).toContain('nofollow')
      expect(result).toContain('noarchive')
      expect(result).toContain('nosnippet')
    })
  })

  describe('getRobotsDirectives', () => {
    it('should return current robots content', () => {
      setRobotsDirectives({ index: false, follow: true })

      const result = getRobotsDirectives()
      expect(result).toContain('noindex')
      expect(result).toContain('follow')
    })

    it('should return empty string when no robots meta', () => {
      const result = getRobotsDirectives()
      expect(result).toBe('')
    })
  })

  // =========================================
  // RESOURCE HINTS TESTS
  // =========================================

  describe('addPreload', () => {
    it('should create preload link', () => {
      const link = addPreload('https://example.com/font.woff2', 'font')

      expect(link.rel).toBe('preload')
      expect(link.href).toBe('https://example.com/font.woff2')
      expect(link.as).toBe('font')
    })

    it('should set crossorigin attribute', () => {
      const link = addPreload('https://example.com/font.woff2', 'font', { crossorigin: 'anonymous' })

      expect(link.crossOrigin).toBe('anonymous')
    })

    it('should set type attribute', () => {
      const link = addPreload('https://example.com/font.woff2', 'font', { type: 'font/woff2' })

      expect(link.type).toBe('font/woff2')
    })

    it('should not create duplicate preload', () => {
      addPreload('https://example.com/font.woff2', 'font')
      addPreload('https://example.com/font.woff2', 'font')

      const links = document.querySelectorAll('link[rel="preload"]')
      expect(links.length).toBe(1)
    })
  })

  describe('addPrefetch', () => {
    it('should create prefetch link', () => {
      const link = addPrefetch('https://example.com/page.html')

      expect(link.rel).toBe('prefetch')
      expect(link.href).toBe('https://example.com/page.html')
    })

    it('should set as attribute', () => {
      const link = addPrefetch('https://example.com/script.js', 'script')

      expect(link.as).toBe('script')
    })

    it('should not create duplicate prefetch', () => {
      addPrefetch('https://example.com/page.html')
      addPrefetch('https://example.com/page.html')

      const links = document.querySelectorAll('link[rel="prefetch"]')
      expect(links.length).toBe(1)
    })
  })

  describe('addDnsPrefetch', () => {
    it('should create dns-prefetch link', () => {
      const link = addDnsPrefetch('https://api.example.com')

      expect(link.rel).toBe('dns-prefetch')
      expect(link.href).toBe('https://api.example.com/')
    })

    it('should not create duplicate dns-prefetch', () => {
      addDnsPrefetch('https://api.example.com')
      addDnsPrefetch('https://api.example.com')

      const links = document.querySelectorAll('link[rel="dns-prefetch"]')
      expect(links.length).toBe(1)
    })
  })

  describe('addPreconnect', () => {
    it('should create preconnect link', () => {
      const link = addPreconnect('https://fonts.googleapis.com')

      expect(link.rel).toBe('preconnect')
      expect(link.href).toBe('https://fonts.googleapis.com/')
    })

    it('should set crossorigin attribute when enabled', () => {
      const link = addPreconnect('https://fonts.gstatic.com', true)

      expect(link.crossOrigin).toBe('anonymous')
    })

    it('should not create duplicate preconnect', () => {
      addPreconnect('https://fonts.googleapis.com')
      addPreconnect('https://fonts.googleapis.com')

      const links = document.querySelectorAll('link[rel="preconnect"]')
      expect(links.length).toBe(1)
    })
  })

  describe('getResourceHints', () => {
    it('should return all resource hints', () => {
      addPreload('https://example.com/font.woff2', 'font')
      addPrefetch('https://example.com/page.html')
      addPreconnect('https://api.example.com')
      addDnsPrefetch('https://cdn.example.com')

      const hints = getResourceHints()

      expect(hints.preload.length).toBe(1)
      expect(hints.prefetch.length).toBe(1)
      expect(hints.preconnect.length).toBe(1)
      expect(hints.dnsPrefetch.length).toBe(1)
    })

    it('should return empty arrays when no hints', () => {
      const hints = getResourceHints()

      expect(hints.preload).toEqual([])
      expect(hints.prefetch).toEqual([])
      expect(hints.preconnect).toEqual([])
      expect(hints.dnsPrefetch).toEqual([])
    })
  })

  // =========================================
  // SOCIAL MEDIA META TESTS
  // =========================================

  describe('setPinterestMeta', () => {
    it('should set nopin meta tag', () => {
      setPinterestMeta({ nopin: true })

      const meta = document.querySelector('meta[name="pinterest"]')
      expect(meta.content).toBe('nopin')
    })

    it('should set pinterest description', () => {
      setPinterestMeta({ description: 'Test description' })

      const meta = document.querySelector('meta[name="pinterest:description"]')
      expect(meta.content).toBe('Test description')
    })

    it('should set rich pin meta', () => {
      setPinterestMeta({ richPin: true })

      const meta = document.querySelector('meta[name="pinterest-rich-pin"]')
      expect(meta.content).toBe('true')
    })
  })

  describe('setLinkedInMeta', () => {
    it('should set article author', () => {
      setLinkedInMeta({ author: 'John Doe' })

      const meta = document.querySelector('meta[name="article:author"]')
      expect(meta.content).toBe('John Doe')
    })

    it('should set published time', () => {
      setLinkedInMeta({ publishedTime: '2024-01-01T12:00:00Z' })

      const meta = document.querySelector('meta[name="article:published_time"]')
      expect(meta.content).toBe('2024-01-01T12:00:00Z')
    })

    it('should set article section', () => {
      setLinkedInMeta({ section: 'Travel' })

      const meta = document.querySelector('meta[name="article:section"]')
      expect(meta.content).toBe('Travel')
    })

    it('should set article tags', () => {
      setLinkedInMeta({ tag: ['hitchhiking', 'travel'] })

      const meta = document.querySelector('meta[name="article:tag"]')
      expect(meta).not.toBeNull()
    })
  })

  // =========================================
  // PWA META TAGS TESTS
  // =========================================

  describe('setPWAMetaTags', () => {
    it('should set theme color', () => {
      setPWAMetaTags({ themeColor: '#ff0000' })

      const meta = document.querySelector('meta[name="theme-color"]')
      expect(meta.content).toBe('#ff0000')
    })

    it('should set apple mobile web app capable', () => {
      setPWAMetaTags()

      const meta = document.querySelector('meta[name="apple-mobile-web-app-capable"]')
      expect(meta.content).toBe('yes')
    })

    it('should set apple status bar style', () => {
      setPWAMetaTags({ statusBarStyle: 'default' })

      const meta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
      expect(meta.content).toBe('default')
    })

    it('should set application name', () => {
      setPWAMetaTags({ appName: 'TestApp' })

      const meta = document.querySelector('meta[name="application-name"]')
      expect(meta.content).toBe('TestApp')
    })

    it('should set msapplication meta tags', () => {
      setPWAMetaTags({ themeColor: '#0ea5e9' })

      const tileColor = document.querySelector('meta[name="msapplication-TileColor"]')
      expect(tileColor.content).toBe('#0ea5e9')
    })

    it('should return config object', () => {
      const config = setPWAMetaTags({ themeColor: '#ff0000', appName: 'Test' })

      expect(config.themeColor).toBe('#ff0000')
      expect(config.appName).toBe('Test')
    })
  })

  describe('getPWAMetaTags', () => {
    it('should return current PWA meta tags', () => {
      setPWAMetaTags({ themeColor: '#ff0000', appName: 'TestApp' })

      const pwa = getPWAMetaTags()
      expect(pwa.themeColor).toBe('#ff0000')
      expect(pwa.appName).toBe('TestApp')
      expect(pwa.appleAppCapable).toBe('yes')
    })

    it('should return undefined for missing tags', () => {
      const pwa = getPWAMetaTags()
      expect(pwa.themeColor).toBeUndefined()
    })
  })

  // =========================================
  // PAGE META TESTS
  // =========================================

  describe('updatePageMeta', () => {
    it('should update meta for home page', () => {
      const result = updatePageMeta('home', 'fr')

      expect(result).toBe(true)
      expect(document.title).toContain('SpotHitch')
    })

    it('should update meta for spots page', () => {
      const result = updatePageMeta('spots', 'en')

      expect(result).toBe(true)
      expect(document.title).toContain('Hitchhiking Spots')
    })

    it('should fallback to default language for unknown lang', () => {
      const result = updatePageMeta('home', 'xx')

      expect(result).toBe(true)
      // Should use French as default
    })

    it('should return false for unknown page type', () => {
      const result = updatePageMeta('unknown')

      expect(result).toBe(false)
    })

    it('should set hreflang tags', () => {
      updatePageMeta('spots', 'en')

      const hreflangs = getHreflangTags()
      expect(hreflangs.length).toBeGreaterThan(0)
    })
  })

  describe('getPageMetaConfig', () => {
    it('should return config for valid page type', () => {
      const config = getPageMetaConfig('home', 'fr')

      expect(config).not.toBeNull()
      expect(config.title).toBeDefined()
      expect(config.description).toBeDefined()
    })

    it('should return English config', () => {
      const config = getPageMetaConfig('home', 'en')

      expect(config.title).toContain('Hitchhiking Community')
    })

    it('should return null for unknown page type', () => {
      const config = getPageMetaConfig('unknown')

      expect(config).toBeNull()
    })

    it('should return keywords when available', () => {
      const config = getPageMetaConfig('home', 'fr')

      expect(config.keywords).toBeDefined()
      expect(config.keywords).toContain('autostop')
    })
  })

  describe('getSupportedLanguages', () => {
    it('should return array of supported languages', () => {
      const langs = getSupportedLanguages()

      expect(langs).toContain('fr')
      expect(langs).toContain('en')
      expect(langs).toContain('es')
      expect(langs).toContain('de')
    })

    it('should return a copy of the array', () => {
      const langs1 = getSupportedLanguages()
      const langs2 = getSupportedLanguages()

      expect(langs1).not.toBe(langs2)
    })
  })

  describe('getLanguageLocale', () => {
    it('should return correct locale for French', () => {
      expect(getLanguageLocale('fr')).toBe('fr-FR')
    })

    it('should return correct locale for English', () => {
      expect(getLanguageLocale('en')).toBe('en-GB')
    })

    it('should return correct locale for Spanish', () => {
      expect(getLanguageLocale('es')).toBe('es-ES')
    })

    it('should return correct locale for German', () => {
      expect(getLanguageLocale('de')).toBe('de-DE')
    })

    it('should return lang code for unknown language', () => {
      expect(getLanguageLocale('xx')).toBe('xx')
    })
  })

  // =========================================
  // VIEWPORT META TESTS
  // =========================================

  describe('setViewportMeta', () => {
    it('should set default viewport', () => {
      const result = setViewportMeta()

      expect(result).toContain('width=device-width')
      expect(result).toContain('initial-scale=1')
    })

    it('should set custom viewport', () => {
      const result = setViewportMeta({
        width: '1024',
        initialScale: 0.5,
        maximumScale: 2.0,
        userScalable: 'yes'
      })

      expect(result).toContain('width=1024')
      expect(result).toContain('initial-scale=0.5')
      expect(result).toContain('maximum-scale=2')
      expect(result).toContain('user-scalable=yes')
    })

    it('should set viewport-fit', () => {
      const result = setViewportMeta({ viewportFit: 'contain' })

      expect(result).toContain('viewport-fit=contain')
    })
  })

  describe('getViewportMeta', () => {
    it('should return current viewport settings', () => {
      setViewportMeta({ width: 'device-width', initialScale: 1.0 })

      const viewport = getViewportMeta()
      expect(viewport.width).toBe('device-width')
      expect(viewport['initial-scale']).toBe('1')
    })

    it('should return null when no viewport meta', () => {
      const viewport = getViewportMeta()
      expect(viewport).toBeNull()
    })
  })

  // =========================================
  // REFERRER POLICY TESTS
  // =========================================

  describe('setReferrerPolicy', () => {
    it('should set default referrer policy', () => {
      const result = setReferrerPolicy()

      expect(result).toBe('strict-origin-when-cross-origin')
    })

    it('should set custom referrer policy', () => {
      const result = setReferrerPolicy('no-referrer')

      expect(result).toBe('no-referrer')
      const meta = document.querySelector('meta[name="referrer"]')
      expect(meta.content).toBe('no-referrer')
    })
  })

  // =========================================
  // SITEMAP TESTS
  // =========================================

  describe('generateSitemapXML', () => {
    it('should generate valid sitemap XML', () => {
      const spots = [
        { id: 'spot1', lastUsed: '2024-01-01' },
        { id: 'spot2', lastUsed: '2024-01-02' },
      ]

      const xml = generateSitemapXML(spots)

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
      expect(xml).toContain('</urlset>')
      expect(xml).toContain('<loc>')
      expect(xml).toContain('<priority>')
      expect(xml).toContain('spot=spot1')
      expect(xml).toContain('spot=spot2')
    })

    it('should include base URLs', () => {
      const xml = generateSitemapXML([])

      expect(xml).toContain('tab=spots')
      expect(xml).toContain('tab=chat')
      expect(xml).toContain('<priority>1.0</priority>')
    })
  })

  // =========================================
  // TRACK PAGE VIEW TESTS
  // =========================================

  describe('trackPageView', () => {
    beforeEach(() => {
      window.gtag = vi.fn()
    })

    afterEach(() => {
      delete window.gtag
    })

    it('should update canonical URL', () => {
      trackPageView('spots')

      const canonical = document.querySelector('link[rel="canonical"]')
      expect(canonical.href).toContain('tab=spots')
    })

    it('should call gtag if available', () => {
      trackPageView('home')

      expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', expect.any(Object))
    })

    it('should not throw if gtag not available', () => {
      delete window.gtag

      expect(() => trackPageView('home')).not.toThrow()
    })
  })

  // =========================================
  // CLEANUP TESTS
  // =========================================

  describe('cleanupSEO', () => {
    it('should remove schemas', () => {
      injectSchema({ '@type': 'Test' }, 'test-schema')
      cleanupSEO()

      const script = document.getElementById('test-schema')
      expect(script).toBeNull()
    })

    it('should remove hreflang links', () => {
      setHreflangTags('fr', '/')
      cleanupSEO()

      const links = document.querySelectorAll('link[rel="alternate"][hreflang]')
      expect(links.length).toBe(0)
    })

    it('should remove preload/prefetch links', () => {
      addPreload('https://example.com/font.woff2', 'font')
      addPrefetch('https://example.com/page.html')
      cleanupSEO()

      const preloads = document.querySelectorAll('link[rel="preload"]')
      const prefetches = document.querySelectorAll('link[rel="prefetch"]')
      expect(preloads.length).toBe(0)
      expect(prefetches.length).toBe(0)
    })
  })

  // =========================================
  // INIT SEO TESTS
  // =========================================

  describe('initSEO', () => {
    it('should inject app schema', () => {
      initSEO()

      const script = document.getElementById('app-schema')
      expect(script).not.toBeNull()
    })

    it('should set default meta tags', () => {
      initSEO()

      expect(document.title).toContain('SpotHitch')
    })

    it('should set robots directives', () => {
      initSEO()

      const robots = getRobotsDirectives()
      expect(robots).toContain('index')
      expect(robots).toContain('follow')
    })

    it('should set hreflang tags', () => {
      initSEO()

      const hreflangs = getHreflangTags()
      expect(hreflangs.length).toBeGreaterThan(0)
    })

    it('should set PWA meta tags', () => {
      initSEO()

      const pwa = getPWAMetaTags()
      expect(pwa.themeColor).toBeDefined()
    })

    it('should add preconnects', () => {
      initSEO()

      const hints = getResourceHints()
      expect(hints.preconnect.length).toBeGreaterThan(0)
    })

    it('should set referrer policy', () => {
      initSEO()

      const meta = document.querySelector('meta[name="referrer"]')
      expect(meta).not.toBeNull()
    })
  })

  // =========================================
  // INTEGRATION TESTS
  // =========================================

  describe('Integration tests', () => {
    it('should work together for a full page setup', () => {
      // Initialize SEO
      initSEO()

      // Update for specific page
      updatePageMeta('spots', 'en')

      // Add geo meta for a spot
      setGeoMetaTags({
        lat: 48.8566,
        lng: 2.3522,
        placename: 'Paris',
        country: 'France'
      })

      // Add Pinterest meta
      setPinterestMeta({ description: 'Find the best hitchhiking spots' })

      // Verify everything is set
      expect(document.title).toContain('Hitchhiking Spots')
      expect(getHreflangTags().length).toBeGreaterThan(0)
      expect(getGeoMetaTags().lat).toBe(48.8566)
    })

    it('should handle rapid updates without duplicates', () => {
      for (let i = 0; i < 10; i++) {
        updatePageMeta('home', 'fr')
        setHreflangTags('fr', '/')
      }

      // Should not have duplicate hreflang links
      const hreflangs = document.querySelectorAll('link[rel="alternate"][hreflang]')
      const hrefs = Array.from(hreflangs).map(l => l.hreflang)
      const uniqueHreflangs = [...new Set(hrefs)]
      expect(hrefs.length).toBe(uniqueHreflangs.length)
    })

    it('should support all page types', () => {
      const pageTypes = ['home', 'spots', 'map', 'profile', 'chat']
      const languages = ['fr', 'en', 'es', 'de']

      pageTypes.forEach(pageType => {
        languages.forEach(lang => {
          const result = updatePageMeta(pageType, lang)
          expect(result).toBe(true)
        })
      })
    })
  })
})
