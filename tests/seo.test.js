/**
 * SEO Utilities Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
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
} from '../src/utils/seo.js'

describe('SEO Utilities', () => {
  describe('getOrganizationSchema', () => {
    it('should return valid Organization schema', () => {
      const schema = getOrganizationSchema()

      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('Organization')
      expect(schema.name).toBe('SpotHitch')
      expect(schema.url).toContain('Spothitch')
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
    beforeEach(() => {
      document.head.innerHTML = ''
    })

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

  describe('updateMetaTags', () => {
    beforeEach(() => {
      document.head.innerHTML = ''
      document.title = ''
    })

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
  })

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

  describe('trackPageView', () => {
    beforeEach(() => {
      document.head.innerHTML = ''
      window.gtag = vi.fn()
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
})
