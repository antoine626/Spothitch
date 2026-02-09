import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  generateStaticPage,
  getPageMetadata,
  generateCountryPage,
  generateCityPage,
  generateSpotLandingPage,
  generateFaqPage,
  generateAboutPage,
  getCanonicalUrl,
  generateBreadcrumbs,
  getAlternateLinks,
  generateStaticRoutes,
  prerenderPage,
  savePrerenderedPage,
  loadPrerenderedPage,
  clearCache
} from '../src/services/staticSeoPages.js'

describe('StaticSeoPages Service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('generateStaticPage', () => {
    it('should generate about page', () => {
      const page = generateStaticPage('about', { locale: 'fr' })
      expect(page).toBeDefined()
      expect(page.type).toBe('about')
      expect(page.locale).toBe('fr')
      expect(page.content).toBeDefined()
      expect(page.content.mission).toBeDefined()
    })

    it('should generate faq page', () => {
      const page = generateStaticPage('faq', { locale: 'en' })
      expect(page).toBeDefined()
      expect(page.type).toBe('faq')
      expect(page.locale).toBe('en')
      expect(page.faqs).toBeDefined()
      expect(Array.isArray(page.faqs)).toBe(true)
    })

    it('should generate country page', () => {
      const page = generateStaticPage('country', { countryCode: 'FR', locale: 'fr' })
      expect(page).toBeDefined()
      expect(page.type).toBe('country')
      expect(page.countryCode).toBe('FR')
      expect(page.countryName).toBe('France')
    })

    it('should generate city page', () => {
      const page = generateStaticPage('city', { cityName: 'Paris', countryCode: 'FR', locale: 'fr' })
      expect(page).toBeDefined()
      expect(page.type).toBe('city')
      expect(page.cityName).toBe('Paris')
    })

    it('should generate spot page', () => {
      const page = generateStaticPage('spot', { spotId: 1, locale: 'fr' })
      expect(page).toBeDefined()
      expect(page.type).toBe('spot')
      expect(page.spot).toBeDefined()
      expect(page.spot.id).toBe(1)
    })

    it('should return null for unknown page type', () => {
      const page = generateStaticPage('unknown', {})
      expect(page).toBeNull()
    })

    it('should generate pages in different locales', () => {
      const pageFr = generateStaticPage('about', { locale: 'fr' })
      const pageEn = generateStaticPage('about', { locale: 'en' })
      const pageEs = generateStaticPage('about', { locale: 'es' })
      const pageDe = generateStaticPage('about', { locale: 'de' })

      expect(pageFr.locale).toBe('fr')
      expect(pageEn.locale).toBe('en')
      expect(pageEs.locale).toBe('es')
      expect(pageDe.locale).toBe('de')
    })
  })

  describe('getPageMetadata', () => {
    it('should get about page metadata', () => {
      const metadata = getPageMetadata('about', { locale: 'fr' })
      expect(metadata).toBeDefined()
      expect(metadata.title).toBe('À propos de SpotHitch')
      expect(metadata.description).toBeDefined()
      expect(metadata.canonical).toBeDefined()
      expect(metadata.alternates).toBeDefined()
      expect(metadata.breadcrumbs).toBeDefined()
      expect(metadata.robots).toBe('index, follow')
    })

    it('should get faq page metadata', () => {
      const metadata = getPageMetadata('faq', { locale: 'en' })
      expect(metadata.title).toBe('Frequently Asked Questions - SpotHitch')
      expect(metadata.description).toContain('questions')
    })

    it('should get country page metadata', () => {
      const metadata = getPageMetadata('country', { countryCode: 'FR', locale: 'fr' })
      expect(metadata.title).toContain('France')
      expect(metadata.description).toContain('spots')
    })

    it('should get city page metadata', () => {
      const metadata = getPageMetadata('city', { cityName: 'Paris', locale: 'fr' })
      expect(metadata.title).toContain('Paris')
      expect(metadata.description).toBeDefined()
    })

    it('should get spot page metadata', () => {
      const metadata = getPageMetadata('spot', { spotId: '1', locale: 'fr' })
      expect(metadata.title).toBeDefined()
      expect(metadata.description).toBeDefined()
    })

    it('should return metadata with all required fields', () => {
      const metadata = getPageMetadata('about', { locale: 'fr' })
      expect(metadata).toHaveProperty('locale')
      expect(metadata).toHaveProperty('canonical')
      expect(metadata).toHaveProperty('alternates')
      expect(metadata).toHaveProperty('breadcrumbs')
      expect(metadata).toHaveProperty('robots')
      expect(metadata).toHaveProperty('title')
      expect(metadata).toHaveProperty('description')
    })

    it('should handle different locales correctly', () => {
      const metadataFr = getPageMetadata('faq', { locale: 'fr' })
      const metadataEn = getPageMetadata('faq', { locale: 'en' })
      const metadataEs = getPageMetadata('faq', { locale: 'es' })
      const metadataDe = getPageMetadata('faq', { locale: 'de' })

      expect(metadataFr.title).toContain('Questions fréquentes')
      expect(metadataEn.title).toContain('Frequently Asked Questions')
      expect(metadataEs.title).toContain('Preguntas frecuentes')
      expect(metadataDe.title).toContain('Häufig gestellte Fragen')
    })

    it('should include spot count in country metadata', () => {
      const metadata = getPageMetadata('country', { countryCode: 'FR', locale: 'fr' })
      expect(metadata.description).toMatch(/\d+/)
    })

    it('should handle invalid country code', () => {
      const metadata = getPageMetadata('country', { countryCode: 'XX', locale: 'fr' })
      expect(metadata.title).toBeUndefined()
    })

    it('should handle invalid spot id', () => {
      const metadata = getPageMetadata('spot', { spotId: '9999', locale: 'fr' })
      expect(metadata.title).toBeUndefined()
    })
  })

  describe('generateCountryPage', () => {
    it('should generate France country page', () => {
      const page = generateCountryPage('FR', 'fr')
      expect(page).toBeDefined()
      expect(page.type).toBe('country')
      expect(page.countryCode).toBe('FR')
      expect(page.countryName).toBe('France')
      expect(page.locale).toBe('fr')
      expect(page.spots).toBeDefined()
      expect(Array.isArray(page.spots)).toBe(true)
      expect(page.spots.length).toBeGreaterThan(0)
      expect(page.totalSpots).toBe(page.spots.length)
    })

    it('should generate Germany country page in English', () => {
      const page = generateCountryPage('DE', 'en')
      expect(page.countryCode).toBe('DE')
      expect(page.countryName).toBe('Germany')
      expect(page.locale).toBe('en')
    })

    it('should include top rated spots', () => {
      const page = generateCountryPage('FR', 'fr')
      expect(page.topSpots).toBeDefined()
      expect(Array.isArray(page.topSpots)).toBe(true)
      expect(page.topSpots.length).toBeLessThanOrEqual(5)

      // Check that spots are sorted by rating
      for (let i = 0; i < page.topSpots.length - 1; i++) {
        expect(page.topSpots[i].globalRating).toBeGreaterThanOrEqual(
          page.topSpots[i + 1].globalRating
        )
      }
    })

    it('should calculate average rating', () => {
      const page = generateCountryPage('FR', 'fr')
      expect(page.avgRating).toBeDefined()
      expect(typeof page.avgRating).toBe('number')
      expect(page.avgRating).toBeGreaterThan(0)
      expect(page.avgRating).toBeLessThanOrEqual(5)
    })

    it('should include metadata', () => {
      const page = generateCountryPage('FR', 'fr')
      expect(page.metadata).toBeDefined()
      expect(page.metadata.title).toBeDefined()
      expect(page.metadata.description).toBeDefined()
    })

    it('should return null for invalid country code', () => {
      const page = generateCountryPage('XX', 'fr')
      expect(page).toBeNull()
    })

    it('should return null for missing country code', () => {
      const page = generateCountryPage(null, 'fr')
      expect(page).toBeNull()
    })

    it('should default to French locale', () => {
      const page = generateCountryPage('FR')
      expect(page.locale).toBe('fr')
      expect(page.countryName).toBe('France')
    })

    it('should handle all supported countries', () => {
      const countryCodes = ['FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'PL', 'IE', 'AT', 'CZ', 'PT', 'CH', 'HR', 'HU', 'DK', 'SE']
      countryCodes.forEach(code => {
        const page = generateCountryPage(code, 'fr')
        if (page) {
          expect(page.countryCode).toBe(code)
          expect(page.countryName).toBeDefined()
        }
      })
    })
  })

  describe('generateCityPage', () => {
    it('should generate Paris city page', () => {
      const page = generateCityPage('Paris', 'FR', 'fr')
      expect(page).toBeDefined()
      expect(page.type).toBe('city')
      expect(page.cityName).toBe('Paris')
      expect(page.countryCode).toBe('FR')
      expect(page.locale).toBe('fr')
      expect(page.spots).toBeDefined()
      expect(Array.isArray(page.spots)).toBe(true)
    })

    it('should find spots related to city', () => {
      const page = generateCityPage('Paris', 'FR', 'fr')
      expect(page.spots.length).toBeGreaterThan(0)
      page.spots.forEach(spot => {
        const cityInName = spot.from.toLowerCase().includes('paris') ||
                          spot.to.toLowerCase().includes('paris')
        expect(cityInName).toBe(true)
      })
    })

    it('should calculate average rating for city', () => {
      const page = generateCityPage('Paris', 'FR', 'fr')
      expect(page.avgRating).toBeDefined()
      expect(typeof page.avgRating).toBe('number')
    })

    it('should handle city with no spots', () => {
      const page = generateCityPage('NonexistentCity', 'FR', 'fr')
      expect(page).toBeDefined()
      expect(page.spots.length).toBe(0)
      expect(page.avgRating).toBe(0)
    })

    it('should return null for missing city name', () => {
      const page = generateCityPage(null, 'FR', 'fr')
      expect(page).toBeNull()
    })

    it('should include metadata', () => {
      const page = generateCityPage('Paris', 'FR', 'fr')
      expect(page.metadata).toBeDefined()
      expect(page.metadata.title).toContain('Paris')
    })

    it('should be case insensitive', () => {
      const pageLower = generateCityPage('paris', 'FR', 'fr')
      const pageUpper = generateCityPage('PARIS', 'FR', 'fr')
      expect(pageLower.spots.length).toBe(pageUpper.spots.length)
    })

    it('should default to French locale', () => {
      const page = generateCityPage('Paris', 'FR')
      expect(page.locale).toBe('fr')
    })
  })

  describe('generateSpotLandingPage', () => {
    it('should generate spot landing page', () => {
      const page = generateSpotLandingPage(1, 'fr')
      expect(page).toBeDefined()
      expect(page.type).toBe('spot')
      expect(page.spot).toBeDefined()
      expect(page.spot.id).toBe(1)
      expect(page.locale).toBe('fr')
    })

    it('should include nearby spots from same country', () => {
      const page = generateSpotLandingPage(1, 'fr')
      expect(page.nearbySpots).toBeDefined()
      expect(Array.isArray(page.nearbySpots)).toBe(true)
      expect(page.nearbySpots.length).toBeLessThanOrEqual(3)

      page.nearbySpots.forEach(spot => {
        expect(spot.id).not.toBe(1)
        expect(spot.country).toBe(page.spot.country)
      })
    })

    it('should include metadata', () => {
      const page = generateSpotLandingPage(1, 'fr')
      expect(page.metadata).toBeDefined()
      expect(page.metadata.title).toBeDefined()
      expect(page.metadata.description).toBeDefined()
    })

    it('should include schema.org structured data', () => {
      const page = generateSpotLandingPage(1, 'fr')
      expect(page.schema).toBeDefined()
      expect(page.schema['@context']).toBe('https://schema.org')
      expect(page.schema['@type']).toBe('Place')
      expect(page.schema.geo).toBeDefined()
      expect(page.schema.geo['@type']).toBe('GeoCoordinates')
    })

    it('should include aggregate rating in schema', () => {
      const page = generateSpotLandingPage(1, 'fr')
      expect(page.schema.aggregateRating).toBeDefined()
      expect(page.schema.aggregateRating['@type']).toBe('AggregateRating')
      expect(page.schema.aggregateRating.ratingValue).toBeDefined()
      expect(page.schema.aggregateRating.ratingCount).toBeDefined()
    })

    it('should return null for invalid spot id', () => {
      const page = generateSpotLandingPage(9999, 'fr')
      expect(page).toBeNull()
    })

    it('should handle string spot id', () => {
      const page = generateSpotLandingPage('1', 'fr')
      expect(page).toBeDefined()
      expect(page.spot.id).toBe(1)
    })

    it('should default to French locale', () => {
      const page = generateSpotLandingPage(1)
      expect(page.locale).toBe('fr')
    })
  })

  describe('generateFaqPage', () => {
    it('should generate FAQ page in French', () => {
      const page = generateFaqPage('fr')
      expect(page).toBeDefined()
      expect(page.type).toBe('faq')
      expect(page.locale).toBe('fr')
      expect(page.faqs).toBeDefined()
      expect(Array.isArray(page.faqs)).toBe(true)
      expect(page.faqs.length).toBeGreaterThan(0)
    })

    it('should include questions and answers', () => {
      const page = generateFaqPage('fr')
      page.faqs.forEach(faq => {
        expect(faq).toHaveProperty('question')
        expect(faq).toHaveProperty('answer')
        expect(typeof faq.question).toBe('string')
        expect(typeof faq.answer).toBe('string')
      })
    })

    it('should generate FAQ in different languages', () => {
      const pageFr = generateFaqPage('fr')
      const pageEn = generateFaqPage('en')
      const pageEs = generateFaqPage('es')
      const pageDe = generateFaqPage('de')

      expect(pageFr.faqs[0].question).toContain('Comment')
      expect(pageEn.faqs[0].question).toContain('How')
      expect(pageEs.faqs[0].question).toContain('Cómo')
      expect(pageDe.faqs[0].question).toContain('Wie')
    })

    it('should include metadata', () => {
      const page = generateFaqPage('fr')
      expect(page.metadata).toBeDefined()
      expect(page.metadata.title).toBeDefined()
    })

    it('should include FAQPage schema', () => {
      const page = generateFaqPage('fr')
      expect(page.schema).toBeDefined()
      expect(page.schema['@context']).toBe('https://schema.org')
      expect(page.schema['@type']).toBe('FAQPage')
      expect(page.schema.mainEntity).toBeDefined()
      expect(Array.isArray(page.schema.mainEntity)).toBe(true)
    })

    it('should have schema entries for each FAQ', () => {
      const page = generateFaqPage('fr')
      expect(page.schema.mainEntity.length).toBe(page.faqs.length)

      page.schema.mainEntity.forEach(entity => {
        expect(entity['@type']).toBe('Question')
        expect(entity.name).toBeDefined()
        expect(entity.acceptedAnswer).toBeDefined()
        expect(entity.acceptedAnswer['@type']).toBe('Answer')
        expect(entity.acceptedAnswer.text).toBeDefined()
      })
    })

    it('should default to French when locale not found', () => {
      const page = generateFaqPage('unknown')
      expect(page.locale).toBe('unknown')
      expect(page.faqs).toBeDefined()
      // Should fallback to French FAQs
      expect(page.faqs[0].question).toContain('Comment')
    })

    it('should default to French locale', () => {
      const page = generateFaqPage()
      expect(page.locale).toBe('fr')
    })
  })

  describe('generateAboutPage', () => {
    it('should generate About page in French', () => {
      const page = generateAboutPage('fr')
      expect(page).toBeDefined()
      expect(page.type).toBe('about')
      expect(page.locale).toBe('fr')
      expect(page.content).toBeDefined()
    })

    it('should include mission, vision and features', () => {
      const page = generateAboutPage('fr')
      expect(page.content).toHaveProperty('mission')
      expect(page.content).toHaveProperty('vision')
      expect(page.content).toHaveProperty('features')
      expect(Array.isArray(page.content.features)).toBe(true)
      expect(page.content.features.length).toBeGreaterThan(0)
    })

    it('should generate About page in different languages', () => {
      const pageFr = generateAboutPage('fr')
      const pageEn = generateAboutPage('en')
      const pageEs = generateAboutPage('es')
      const pageDe = generateAboutPage('de')

      expect(pageFr.content.mission).toContain('SpotHitch')
      expect(pageEn.content.mission).toContain('SpotHitch')
      expect(pageEs.content.mission).toContain('SpotHitch')
      expect(pageDe.content.mission).toContain('SpotHitch')
    })

    it('should include metadata', () => {
      const page = generateAboutPage('fr')
      expect(page.metadata).toBeDefined()
      expect(page.metadata.title).toBeDefined()
    })

    it('should include AboutPage schema', () => {
      const page = generateAboutPage('fr')
      expect(page.schema).toBeDefined()
      expect(page.schema['@context']).toBe('https://schema.org')
      expect(page.schema['@type']).toBe('AboutPage')
      expect(page.schema.name).toBe('About SpotHitch')
      expect(page.schema.description).toBeDefined()
    })

    it('should default to French content when locale not found', () => {
      const page = generateAboutPage('unknown')
      expect(page.content.mission).toContain('SpotHitch')
    })

    it('should default to French locale', () => {
      const page = generateAboutPage()
      expect(page.locale).toBe('fr')
    })
  })

  describe('getCanonicalUrl', () => {
    it('should generate canonical URL for about page', () => {
      const url = getCanonicalUrl('about', { locale: 'fr' })
      expect(url).toBe('https://antoine626.github.io/Spothitch/about?lang=fr')
    })

    it('should generate canonical URL for FAQ page', () => {
      const url = getCanonicalUrl('faq', { locale: 'en' })
      expect(url).toBe('https://antoine626.github.io/Spothitch/faq?lang=en')
    })

    it('should generate canonical URL for country page', () => {
      const url = getCanonicalUrl('country', { countryCode: 'FR', locale: 'fr' })
      expect(url).toBe('https://antoine626.github.io/Spothitch/country/FR?lang=fr')
    })

    it('should generate canonical URL for city page', () => {
      const url = getCanonicalUrl('city', { cityName: 'Paris', locale: 'fr' })
      expect(url).toBe('https://antoine626.github.io/Spothitch/city/Paris?lang=fr')
    })

    it('should generate canonical URL for spot page', () => {
      const url = getCanonicalUrl('spot', { spotId: 1, locale: 'fr' })
      expect(url).toBe('https://antoine626.github.io/Spothitch/spot/1?lang=fr')
    })

    it('should encode special characters in city names', () => {
      const url = getCanonicalUrl('city', { cityName: 'São Paulo', locale: 'pt' })
      expect(url).toContain(encodeURIComponent('São Paulo'))
    })

    it('should default to French locale', () => {
      const url = getCanonicalUrl('about', {})
      expect(url).toContain('lang=fr')
    })

    it('should handle unknown page type', () => {
      const url = getCanonicalUrl('unknown', { locale: 'fr' })
      expect(url).toBe('https://antoine626.github.io/Spothitch/?lang=fr')
    })
  })

  describe('generateBreadcrumbs', () => {
    it('should generate breadcrumbs for about page', () => {
      const breadcrumbs = generateBreadcrumbs('about', { locale: 'fr' })
      expect(breadcrumbs).toBeDefined()
      expect(Array.isArray(breadcrumbs)).toBe(true)
      expect(breadcrumbs.length).toBe(2)
      expect(breadcrumbs[0].name).toBe('SpotHitch')
      expect(breadcrumbs[1].name).toBe('À propos')
    })

    it('should generate breadcrumbs for FAQ page', () => {
      const breadcrumbs = generateBreadcrumbs('faq', { locale: 'en' })
      expect(breadcrumbs.length).toBe(2)
      expect(breadcrumbs[1].name).toBe('FAQ')
    })

    it('should generate breadcrumbs for country page', () => {
      const breadcrumbs = generateBreadcrumbs('country', { countryCode: 'FR', locale: 'fr' })
      expect(breadcrumbs.length).toBe(2)
      expect(breadcrumbs[1].name).toBe('France')
    })

    it('should generate breadcrumbs for city page', () => {
      const breadcrumbs = generateBreadcrumbs('city', { cityName: 'Paris', locale: 'fr' })
      expect(breadcrumbs.length).toBe(2)
      expect(breadcrumbs[1].name).toBe('Paris')
    })

    it('should generate breadcrumbs for spot page', () => {
      const breadcrumbs = generateBreadcrumbs('spot', { spotId: '1', locale: 'fr' })
      expect(breadcrumbs.length).toBe(3)
      expect(breadcrumbs[0].name).toBe('SpotHitch')
      expect(breadcrumbs[1].name).toBe('France')
      expect(breadcrumbs[2].name).toContain('→')
    })

    it('should include URLs in breadcrumbs', () => {
      const breadcrumbs = generateBreadcrumbs('about', { locale: 'fr' })
      breadcrumbs.forEach(crumb => {
        expect(crumb).toHaveProperty('name')
        expect(crumb).toHaveProperty('url')
        expect(typeof crumb.url).toBe('string')
        expect(crumb.url).toContain('https://')
      })
    })

    it('should handle invalid country code', () => {
      const breadcrumbs = generateBreadcrumbs('country', { countryCode: 'XX', locale: 'fr' })
      expect(breadcrumbs.length).toBe(1)
    })

    it('should handle invalid spot id', () => {
      const breadcrumbs = generateBreadcrumbs('spot', { spotId: '9999', locale: 'fr' })
      expect(breadcrumbs.length).toBe(1)
    })

    it('should translate breadcrumbs based on locale', () => {
      const breadcrumbsFr = generateBreadcrumbs('about', { locale: 'fr' })
      const breadcrumbsEn = generateBreadcrumbs('about', { locale: 'en' })

      expect(breadcrumbsFr[1].name).toBe('À propos')
      expect(breadcrumbsEn[1].name).toBe('About')
    })
  })

  describe('getAlternateLinks', () => {
    it('should generate alternate links for all languages', () => {
      const alternates = getAlternateLinks('about', {})
      expect(alternates).toBeDefined()
      expect(Array.isArray(alternates)).toBe(true)
      expect(alternates.length).toBe(5) // 4 languages + x-default
    })

    it('should include x-default link', () => {
      const alternates = getAlternateLinks('about', {})
      const xDefault = alternates.find(a => a.hreflang === 'x-default')
      expect(xDefault).toBeDefined()
      expect(xDefault.href).toContain('lang=fr')
    })

    it('should include links for all supported languages', () => {
      const alternates = getAlternateLinks('about', {})
      const languages = ['fr', 'en', 'es', 'de']

      languages.forEach(lang => {
        const link = alternates.find(a => a.hreflang === lang)
        expect(link).toBeDefined()
        expect(link.href).toContain(`lang=${lang}`)
      })
    })

    it('should generate alternates for different page types', () => {
      const aboutAlternates = getAlternateLinks('about', {})
      const faqAlternates = getAlternateLinks('faq', {})
      const countryAlternates = getAlternateLinks('country', { countryCode: 'FR' })

      expect(aboutAlternates[0].href).toContain('/about')
      expect(faqAlternates[0].href).toContain('/faq')
      expect(countryAlternates[0].href).toContain('/country/FR')
    })

    it('should include all parameters in alternate links', () => {
      const alternates = getAlternateLinks('spot', { spotId: 1 })
      alternates.forEach(alt => {
        expect(alt.href).toContain('/spot/1')
        if (alt.hreflang !== 'x-default') {
          expect(alt.href).toContain('lang=')
        }
      })
    })

    it('should have correct structure', () => {
      const alternates = getAlternateLinks('about', {})
      alternates.forEach(alt => {
        expect(alt).toHaveProperty('hreflang')
        expect(alt).toHaveProperty('href')
        expect(typeof alt.hreflang).toBe('string')
        expect(typeof alt.href).toBe('string')
      })
    })
  })

  describe('generateStaticRoutes', () => {
    it('should generate routes for all page types', () => {
      const routes = generateStaticRoutes()
      expect(routes).toBeDefined()
      expect(Array.isArray(routes)).toBe(true)
      expect(routes.length).toBeGreaterThan(0)
    })

    it('should include about and faq pages for all languages', () => {
      const routes = generateStaticRoutes()
      const aboutRoutes = routes.filter(r => r.type === 'about')
      const faqRoutes = routes.filter(r => r.type === 'faq')

      expect(aboutRoutes.length).toBe(4) // 4 languages
      expect(faqRoutes.length).toBe(4)
    })

    it('should include country pages', () => {
      const routes = generateStaticRoutes()
      const countryRoutes = routes.filter(r => r.type === 'country')
      expect(countryRoutes.length).toBeGreaterThan(0)
    })

    it('should include spot pages', () => {
      const routes = generateStaticRoutes()
      const spotRoutes = routes.filter(r => r.type === 'spot')
      expect(spotRoutes.length).toBeGreaterThan(0)
    })

    it('should have valid route structure', () => {
      const routes = generateStaticRoutes()
      routes.forEach(route => {
        expect(route).toHaveProperty('path')
        expect(route).toHaveProperty('type')
        expect(route).toHaveProperty('locale')
        expect(route).toHaveProperty('priority')
        expect(route).toHaveProperty('changefreq')
        expect(typeof route.path).toBe('string')
        expect(route.path).toContain('https://')
      })
    })

    it('should have appropriate priorities', () => {
      const routes = generateStaticRoutes()
      routes.forEach(route => {
        expect(route.priority).toBeGreaterThan(0)
        expect(route.priority).toBeLessThanOrEqual(1)
      })
    })

    it('should have valid changefreq values', () => {
      const routes = generateStaticRoutes()
      const validFreqs = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']

      routes.forEach(route => {
        expect(validFreqs).toContain(route.changefreq)
      })
    })

    it('should generate routes for multiple countries', () => {
      const routes = generateStaticRoutes()
      const countryRoutes = routes.filter(r => r.type === 'country')
      const uniqueCountries = new Set(countryRoutes.map(r => r.countryCode))

      expect(uniqueCountries.size).toBeGreaterThan(1)
    })

    it('should generate routes for multiple spots', () => {
      const routes = generateStaticRoutes()
      const spotRoutes = routes.filter(r => r.type === 'spot')
      const uniqueSpots = new Set(spotRoutes.map(r => r.spotId))

      expect(uniqueSpots.size).toBeGreaterThan(1)
    })
  })

  describe('prerenderPage', () => {
    it('should pre-render about page', () => {
      const page = prerenderPage('about', { locale: 'fr' })
      expect(page).toBeDefined()
      expect(page.type).toBe('about')
      expect(page.prerendered).toBe(true)
      expect(page.timestamp).toBeDefined()
    })

    it('should include metadata in pre-rendered page', () => {
      const page = prerenderPage('faq', { locale: 'fr' })
      expect(page.metadata).toBeDefined()
      expect(page.metadata.title).toBeDefined()
    })

    it('should return null for invalid page', () => {
      const page = prerenderPage('spot', { spotId: 9999 })
      expect(page).toBeNull()
    })

    it('should have valid timestamp', () => {
      const page = prerenderPage('about', { locale: 'fr' })
      const timestamp = new Date(page.timestamp)
      expect(timestamp.toString()).not.toBe('Invalid Date')
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('should pre-render all page types', () => {
      const aboutPage = prerenderPage('about', { locale: 'fr' })
      const faqPage = prerenderPage('faq', { locale: 'fr' })
      const countryPage = prerenderPage('country', { countryCode: 'FR', locale: 'fr' })
      const cityPage = prerenderPage('city', { cityName: 'Paris', countryCode: 'FR', locale: 'fr' })
      const spotPage = prerenderPage('spot', { spotId: 1, locale: 'fr' })

      expect(aboutPage.prerendered).toBe(true)
      expect(faqPage.prerendered).toBe(true)
      expect(countryPage.prerendered).toBe(true)
      expect(cityPage.prerendered).toBe(true)
      expect(spotPage.prerendered).toBe(true)
    })
  })

  describe('savePrerenderedPage and loadPrerenderedPage', () => {
    it('should save and load pre-rendered page', () => {
      const pageData = { type: 'about', content: 'test' }
      const saved = savePrerenderedPage('about', { locale: 'fr' }, pageData)
      expect(saved).toBe(true)

      const loaded = loadPrerenderedPage('about', { locale: 'fr' })
      expect(loaded).toEqual(pageData)
    })

    it('should return null for non-existent page', () => {
      const loaded = loadPrerenderedPage('nonexistent', { locale: 'fr' })
      expect(loaded).toBeNull()
    })

    it('should overwrite existing page', () => {
      const pageData1 = { type: 'about', content: 'test1' }
      const pageData2 = { type: 'about', content: 'test2' }

      savePrerenderedPage('about', { locale: 'fr' }, pageData1)
      savePrerenderedPage('about', { locale: 'fr' }, pageData2)

      const loaded = loadPrerenderedPage('about', { locale: 'fr' })
      expect(loaded.content).toBe('test2')
    })

    it('should save multiple pages independently', () => {
      const aboutData = { type: 'about', content: 'about' }
      const faqData = { type: 'faq', content: 'faq' }

      savePrerenderedPage('about', { locale: 'fr' }, aboutData)
      savePrerenderedPage('faq', { locale: 'fr' }, faqData)

      const loadedAbout = loadPrerenderedPage('about', { locale: 'fr' })
      const loadedFaq = loadPrerenderedPage('faq', { locale: 'fr' })

      expect(loadedAbout.content).toBe('about')
      expect(loadedFaq.content).toBe('faq')
    })

    it('should include timestamp when saving', () => {
      const pageData = { type: 'about', content: 'test' }
      savePrerenderedPage('about', { locale: 'fr' }, pageData)

      const cache = JSON.parse(localStorage.getItem('spothitch_static_seo'))
      const key = 'about_' + JSON.stringify({ locale: 'fr' })

      expect(cache[key]).toHaveProperty('timestamp')
      expect(cache[key]).toHaveProperty('data')
    })

    it('should handle JSON parse errors gracefully when saving', () => {
      // Create invalid JSON in localStorage
      localStorage.setItem('spothitch_static_seo', 'invalid json')

      const saved = savePrerenderedPage('about', { locale: 'fr' }, { content: 'test' })
      // Should fail due to JSON.parse error
      expect(saved).toBe(false)
    })

    it('should handle JSON parse errors gracefully when loading', () => {
      // Create invalid JSON in localStorage
      localStorage.setItem('spothitch_static_seo', 'invalid json')

      const loaded = loadPrerenderedPage('about', { locale: 'fr' })
      expect(loaded).toBeNull()
    })
  })

  describe('clearCache', () => {
    it('should clear all cached pages', () => {
      savePrerenderedPage('about', { locale: 'fr' }, { content: 'test1' })
      savePrerenderedPage('faq', { locale: 'fr' }, { content: 'test2' })

      const cleared = clearCache()
      expect(cleared).toBe(true)

      const loaded1 = loadPrerenderedPage('about', { locale: 'fr' })
      const loaded2 = loadPrerenderedPage('faq', { locale: 'fr' })

      expect(loaded1).toBeNull()
      expect(loaded2).toBeNull()
    })

    it('should succeed even if cache is empty', () => {
      clearCache()
      const cleared = clearCache()
      expect(cleared).toBe(true)
    })

    it('should remove the cache key from localStorage', () => {
      savePrerenderedPage('about', { locale: 'fr' }, { content: 'test' })
      expect(localStorage.getItem('spothitch_static_seo')).not.toBeNull()

      clearCache()
      expect(localStorage.getItem('spothitch_static_seo')).toBeNull()
    })
  })

  describe('Integration tests', () => {
    it('should generate complete country page with all metadata', () => {
      const page = generateCountryPage('FR', 'fr')
      expect(page.metadata.canonical).toBeDefined()
      expect(page.metadata.alternates.length).toBe(5)
      expect(page.metadata.breadcrumbs.length).toBeGreaterThan(0)
    })

    it('should generate complete spot page with schema', () => {
      const page = generateSpotLandingPage(1, 'fr')
      expect(page.schema['@type']).toBe('Place')
      expect(page.metadata.canonical).toContain('/spot/1')
      expect(page.nearbySpots.length).toBeGreaterThan(0)
    })

    it('should handle full workflow: generate, save, load', () => {
      const page = prerenderPage('about', { locale: 'fr' })
      savePrerenderedPage('about', { locale: 'fr' }, page)
      const loaded = loadPrerenderedPage('about', { locale: 'fr' })

      expect(loaded.type).toBe('about')
      expect(loaded.prerendered).toBe(true)
      expect(loaded.metadata).toBeDefined()
    })

    it('should generate routes and create all pages', () => {
      const routes = generateStaticRoutes()
      const aboutRoutes = routes.filter(r => r.type === 'about')

      aboutRoutes.forEach(route => {
        const page = generateStaticPage('about', { locale: route.locale })
        expect(page).toBeDefined()
        expect(page.type).toBe('about')
      })
    })
  })
})
