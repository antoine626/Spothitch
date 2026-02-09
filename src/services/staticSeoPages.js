/**
 * Static SEO Pages Service
 * Generates static pages optimized for SEO
 *
 * Features:
 * - Static page generation (About, FAQ, Country, City, Spot)
 * - Page metadata with i18n support
 * - Canonical URLs and alternate links
 * - Breadcrumb navigation
 * - Schema.org structured data
 * - Pre-rendering support
 */

import { getState } from '../stores/state.js'
import { sampleSpots, getSpotsByCountry } from '../data/spots.js'

const STORAGE_KEY = 'spothitch_static_seo'
const BASE_URL = 'https://antoine626.github.io/Spothitch'
const SUPPORTED_LANGUAGES = ['fr', 'en', 'es', 'de']

// Country names by language
const COUNTRY_NAMES = {
  FR: { fr: 'France', en: 'France', es: 'Francia', de: 'Frankreich' },
  DE: { fr: 'Allemagne', en: 'Germany', es: 'Alemania', de: 'Deutschland' },
  ES: { fr: 'Espagne', en: 'Spain', es: 'España', de: 'Spanien' },
  IT: { fr: 'Italie', en: 'Italy', es: 'Italia', de: 'Italien' },
  BE: { fr: 'Belgique', en: 'Belgium', es: 'Bélgica', de: 'Belgien' },
  NL: { fr: 'Pays-Bas', en: 'Netherlands', es: 'Países Bajos', de: 'Niederlande' },
  PL: { fr: 'Pologne', en: 'Poland', es: 'Polonia', de: 'Polen' },
  IE: { fr: 'Irlande', en: 'Ireland', es: 'Irlanda', de: 'Irland' },
  AT: { fr: 'Autriche', en: 'Austria', es: 'Austria', de: 'Österreich' },
  CZ: { fr: 'République Tchèque', en: 'Czech Republic', es: 'República Checa', de: 'Tschechien' },
  PT: { fr: 'Portugal', en: 'Portugal', es: 'Portugal', de: 'Portugal' },
  CH: { fr: 'Suisse', en: 'Switzerland', es: 'Suiza', de: 'Schweiz' },
  HR: { fr: 'Croatie', en: 'Croatia', es: 'Croacia', de: 'Kroatien' },
  HU: { fr: 'Hongrie', en: 'Hungary', es: 'Hungría', de: 'Ungarn' },
  DK: { fr: 'Danemark', en: 'Denmark', es: 'Dinamarca', de: 'Dänemark' },
  SE: { fr: 'Suède', en: 'Sweden', es: 'Suecia', de: 'Schweden' }
}

// Page type translations
const PAGE_TYPES = {
  about: {
    fr: 'À propos',
    en: 'About',
    es: 'Acerca de',
    de: 'Über uns'
  },
  faq: {
    fr: 'FAQ',
    en: 'FAQ',
    es: 'Preguntas frecuentes',
    de: 'Häufige Fragen'
  },
  country: {
    fr: 'Pays',
    en: 'Country',
    es: 'País',
    de: 'Land'
  },
  city: {
    fr: 'Ville',
    en: 'City',
    es: 'Ciudad',
    de: 'Stadt'
  },
  spot: {
    fr: 'Spot',
    en: 'Spot',
    es: 'Spot',
    de: 'Spot'
  }
}

/**
 * Generate static page content
 * @param {string} pageType - Type of page (about, faq, country, city, spot)
 * @param {Object} data - Page data
 * @returns {Object} Page content
 */
export function generateStaticPage(pageType, data = {}) {
  const { locale = 'fr', countryCode, cityName, spotId, content } = data

  switch (pageType) {
    case 'about':
      return generateAboutPage(locale)
    case 'faq':
      return generateFaqPage(locale)
    case 'country':
      return generateCountryPage(countryCode, locale)
    case 'city':
      return generateCityPage(cityName, countryCode, locale)
    case 'spot':
      return generateSpotLandingPage(spotId, locale)
    default:
      return null
  }
}

/**
 * Get page metadata
 * @param {string} pageType - Type of page
 * @param {Object} params - Page parameters
 * @returns {Object} Page metadata
 */
export function getPageMetadata(pageType, params = {}) {
  const { locale = 'fr', countryCode, cityName, spotId } = params

  const metadata = {
    locale,
    canonical: getCanonicalUrl(pageType, params),
    alternates: getAlternateLinks(pageType, params),
    breadcrumbs: generateBreadcrumbs(pageType, params),
    robots: 'index, follow'
  }

  switch (pageType) {
    case 'about':
      metadata.title = {
        fr: 'À propos de SpotHitch',
        en: 'About SpotHitch',
        es: 'Acerca de SpotHitch',
        de: 'Über SpotHitch'
      }[locale]
      metadata.description = {
        fr: 'Découvrez SpotHitch, la communauté des autostoppeurs. Notre mission, notre équipe et notre vision pour rendre le voyage plus accessible.',
        en: 'Discover SpotHitch, the hitchhiking community. Our mission, team and vision to make travel more accessible.',
        es: 'Descubre SpotHitch, la comunidad de autoestopistas. Nuestra misión, equipo y visión para hacer el viaje más accesible.',
        de: 'Entdecken Sie SpotHitch, die Tramper-Community. Unsere Mission, unser Team und unsere Vision für zugänglicheres Reisen.'
      }[locale]
      break

    case 'faq':
      metadata.title = {
        fr: 'Questions fréquentes - SpotHitch',
        en: 'Frequently Asked Questions - SpotHitch',
        es: 'Preguntas frecuentes - SpotHitch',
        de: 'Häufig gestellte Fragen - SpotHitch'
      }[locale]
      metadata.description = {
        fr: 'Trouvez des réponses à vos questions sur l\'autostop, l\'utilisation de SpotHitch et nos fonctionnalités.',
        en: 'Find answers to your questions about hitchhiking, using SpotHitch and our features.',
        es: 'Encuentra respuestas a tus preguntas sobre autoestop, usar SpotHitch y nuestras funciones.',
        de: 'Finden Sie Antworten auf Ihre Fragen zum Trampen, zur Nutzung von SpotHitch und unseren Funktionen.'
      }[locale]
      break

    case 'country':
      if (countryCode && COUNTRY_NAMES[countryCode]) {
        const countryName = COUNTRY_NAMES[countryCode][locale]
        const spots = getSpotsByCountry(countryCode)
        metadata.title = {
          fr: `Spots d'autostop en ${countryName}`,
          en: `Hitchhiking spots in ${countryName}`,
          es: `Spots de autoestop en ${countryName}`,
          de: `Tramper-Spots in ${countryName}`
        }[locale]
        metadata.description = {
          fr: `Découvrez ${spots.length} spots d'autostop vérifiés en ${countryName}. Guides, conseils et avis de la communauté.`,
          en: `Discover ${spots.length} verified hitchhiking spots in ${countryName}. Guides, tips and community reviews.`,
          es: `Descubre ${spots.length} spots de autoestop verificados en ${countryName}. Guías, consejos y opiniones de la comunidad.`,
          de: `Entdecken Sie ${spots.length} verifizierte Tramper-Spots in ${countryName}. Anleitungen, Tipps und Community-Bewertungen.`
        }[locale]
      }
      break

    case 'city':
      if (cityName) {
        metadata.title = {
          fr: `Spots d'autostop à ${cityName}`,
          en: `Hitchhiking spots in ${cityName}`,
          es: `Spots de autoestop en ${cityName}`,
          de: `Tramper-Spots in ${cityName}`
        }[locale]
        metadata.description = {
          fr: `Trouvez les meilleurs spots d'autostop à ${cityName}. Conseils, photos et avis de voyageurs.`,
          en: `Find the best hitchhiking spots in ${cityName}. Tips, photos and traveler reviews.`,
          es: `Encuentra los mejores spots de autoestop en ${cityName}. Consejos, fotos y opiniones de viajeros.`,
          de: `Finden Sie die besten Tramper-Spots in ${cityName}. Tipps, Fotos und Reisendenbewertungen.`
        }[locale]
      }
      break

    case 'spot':
      if (spotId) {
        const spot = sampleSpots.find(s => s.id === parseInt(spotId))
        if (spot) {
          metadata.title = {
            fr: `Spot ${spot.from} → ${spot.to}`,
            en: `Spot ${spot.from} → ${spot.to}`,
            es: `Spot ${spot.from} → ${spot.to}`,
            de: `Spot ${spot.from} → ${spot.to}`
          }[locale]
          metadata.description = spot.description
        }
      }
      break
  }

  return metadata
}

/**
 * Generate country page
 * @param {string} countryCode - Country code (FR, DE, ES, etc.)
 * @param {string} locale - Language code
 * @returns {Object} Country page data
 */
export function generateCountryPage(countryCode, locale = 'fr') {
  if (!countryCode || !COUNTRY_NAMES[countryCode]) {
    return null
  }

  const spots = getSpotsByCountry(countryCode)
  const countryName = COUNTRY_NAMES[countryCode][locale]

  return {
    type: 'country',
    countryCode,
    countryName,
    locale,
    spots,
    totalSpots: spots.length,
    avgRating: spots.reduce((acc, s) => acc + s.globalRating, 0) / spots.length,
    topSpots: spots.sort((a, b) => b.globalRating - a.globalRating).slice(0, 5),
    metadata: getPageMetadata('country', { countryCode, locale })
  }
}

/**
 * Generate city page
 * @param {string} cityName - City name
 * @param {string} countryCode - Country code
 * @param {string} locale - Language code
 * @returns {Object} City page data
 */
export function generateCityPage(cityName, countryCode, locale = 'fr') {
  if (!cityName) {
    return null
  }

  const citySpots = sampleSpots.filter(s =>
    s.from.toLowerCase().includes(cityName.toLowerCase()) ||
    s.to.toLowerCase().includes(cityName.toLowerCase())
  )

  return {
    type: 'city',
    cityName,
    countryCode,
    locale,
    spots: citySpots,
    totalSpots: citySpots.length,
    avgRating: citySpots.length > 0
      ? citySpots.reduce((acc, s) => acc + s.globalRating, 0) / citySpots.length
      : 0,
    metadata: getPageMetadata('city', { cityName, countryCode, locale })
  }
}

/**
 * Generate spot landing page
 * @param {number|string} spotId - Spot ID
 * @param {string} locale - Language code
 * @returns {Object} Spot landing page data
 */
export function generateSpotLandingPage(spotId, locale = 'fr') {
  const spot = sampleSpots.find(s => s.id === parseInt(spotId))
  if (!spot) {
    return null
  }

  return {
    type: 'spot',
    spot,
    locale,
    nearbySpots: sampleSpots
      .filter(s => s.id !== spot.id && s.country === spot.country)
      .slice(0, 3),
    metadata: getPageMetadata('spot', { spotId, locale }),
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: `${spot.from} → ${spot.to}`,
      description: spot.description,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: spot.coordinates?.lat,
        longitude: spot.coordinates?.lng
      },
      photo: spot.photoUrl,
      aggregateRating: spot.globalRating ? {
        '@type': 'AggregateRating',
        ratingValue: spot.globalRating.toFixed(1),
        ratingCount: spot.totalReviews || 1,
        bestRating: '5',
        worstRating: '1'
      } : undefined,
      address: {
        '@type': 'PostalAddress',
        addressCountry: spot.country
      }
    }
  }
}

/**
 * Generate FAQ page
 * @param {string} locale - Language code
 * @returns {Object} FAQ page data
 */
export function generateFaqPage(locale = 'fr') {
  const faqs = {
    fr: [
      {
        question: 'Comment trouver un bon spot d\'autostop ?',
        answer: 'Utilisez SpotHitch pour trouver des spots vérifiés par la communauté. Les meilleurs spots ont une bonne visibilité, sont sécurisés et ont un trafic régulier vers votre destination.'
      },
      {
        question: 'L\'application fonctionne-t-elle hors ligne ?',
        answer: 'Oui, SpotHitch est une PWA qui fonctionne hors ligne. Les spots que vous avez consultés sont mis en cache pour une utilisation sans connexion.'
      },
      {
        question: 'Comment ajouter un nouveau spot ?',
        answer: 'Cliquez sur le bouton "Ajouter un spot", renseignez les informations (lieu, description, photo) et partagez votre expérience avec la communauté.'
      },
      {
        question: 'Est-ce que SpotHitch est gratuit ?',
        answer: 'Oui, SpotHitch est 100% gratuit et open-source. Nous croyons que le voyage devrait être accessible à tous.'
      },
      {
        question: 'Comment signaler un spot dangereux ?',
        answer: 'Utilisez la fonction de signalement sur chaque spot. Notre équipe de modération examinera le signalement dans les 24 heures.'
      }
    ],
    en: [
      {
        question: 'How to find a good hitchhiking spot?',
        answer: 'Use SpotHitch to find community-verified spots. The best spots have good visibility, are safe and have regular traffic to your destination.'
      },
      {
        question: 'Does the app work offline?',
        answer: 'Yes, SpotHitch is a PWA that works offline. Spots you\'ve viewed are cached for offline use.'
      },
      {
        question: 'How to add a new spot?',
        answer: 'Click the "Add spot" button, fill in the information (location, description, photo) and share your experience with the community.'
      },
      {
        question: 'Is SpotHitch free?',
        answer: 'Yes, SpotHitch is 100% free and open-source. We believe travel should be accessible to everyone.'
      },
      {
        question: 'How to report a dangerous spot?',
        answer: 'Use the report function on each spot. Our moderation team will review the report within 24 hours.'
      }
    ],
    es: [
      {
        question: '¿Cómo encontrar un buen spot de autoestop?',
        answer: 'Use SpotHitch para encontrar spots verificados por la comunidad. Los mejores spots tienen buena visibilidad, son seguros y tienen tráfico regular hacia su destino.'
      },
      {
        question: '¿La aplicación funciona sin conexión?',
        answer: 'Sí, SpotHitch es una PWA que funciona sin conexión. Los spots que ha visto se almacenan en caché para uso sin conexión.'
      },
      {
        question: '¿Cómo agregar un nuevo spot?',
        answer: 'Haga clic en el botón "Agregar spot", complete la información (ubicación, descripción, foto) y comparta su experiencia con la comunidad.'
      },
      {
        question: '¿Es SpotHitch gratis?',
        answer: 'Sí, SpotHitch es 100% gratuito y de código abierto. Creemos que viajar debería ser accesible para todos.'
      },
      {
        question: '¿Cómo reportar un spot peligroso?',
        answer: 'Use la función de reporte en cada spot. Nuestro equipo de moderación revisará el reporte en 24 horas.'
      }
    ],
    de: [
      {
        question: 'Wie finde ich einen guten Tramper-Spot?',
        answer: 'Verwenden Sie SpotHitch, um von der Community verifizierte Spots zu finden. Die besten Spots haben gute Sichtbarkeit, sind sicher und haben regelmäßigen Verkehr zu Ihrem Ziel.'
      },
      {
        question: 'Funktioniert die App offline?',
        answer: 'Ja, SpotHitch ist eine PWA, die offline funktioniert. Spots, die Sie angesehen haben, werden für die Offline-Nutzung zwischengespeichert.'
      },
      {
        question: 'Wie füge ich einen neuen Spot hinzu?',
        answer: 'Klicken Sie auf die Schaltfläche "Spot hinzufügen", geben Sie die Informationen ein (Standort, Beschreibung, Foto) und teilen Sie Ihre Erfahrung mit der Community.'
      },
      {
        question: 'Ist SpotHitch kostenlos?',
        answer: 'Ja, SpotHitch ist 100% kostenlos und Open-Source. Wir glauben, dass Reisen für alle zugänglich sein sollte.'
      },
      {
        question: 'Wie melde ich einen gefährlichen Spot?',
        answer: 'Verwenden Sie die Meldefunktion bei jedem Spot. Unser Moderationsteam überprüft die Meldung innerhalb von 24 Stunden.'
      }
    ]
  }

  return {
    type: 'faq',
    locale,
    faqs: faqs[locale] || faqs.fr,
    metadata: getPageMetadata('faq', { locale }),
    schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: (faqs[locale] || faqs.fr).map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    }
  }
}

/**
 * Generate About page
 * @param {string} locale - Language code
 * @returns {Object} About page data
 */
export function generateAboutPage(locale = 'fr') {
  const content = {
    fr: {
      mission: 'SpotHitch est une application communautaire pour les autostoppeurs. Notre mission est de rendre le voyage plus accessible en partageant les meilleurs spots d\'auto-stop dans le monde.',
      vision: 'Créer une communauté mondiale de voyageurs qui s\'entraident et partagent leurs connaissances pour voyager de manière plus durable et économique.',
      features: [
        'Plus de 100 spots vérifiés',
        'Communauté active de voyageurs',
        'Guides par pays',
        'Fonctionne hors ligne',
        'Gratuit et open-source'
      ]
    },
    en: {
      mission: 'SpotHitch is a community app for hitchhikers. Our mission is to make travel more accessible by sharing the best hitchhiking spots around the world.',
      vision: 'Create a global community of travelers who help each other and share their knowledge to travel more sustainably and economically.',
      features: [
        'Over 100 verified spots',
        'Active traveler community',
        'Country guides',
        'Works offline',
        'Free and open-source'
      ]
    },
    es: {
      mission: 'SpotHitch es una aplicación comunitaria para autoestopistas. Nuestra misión es hacer el viaje más accesible compartiendo los mejores spots de autoestop en Europa.',
      vision: 'Crear una comunidad global de viajeros que se ayuden mutuamente y compartan su conocimiento para viajar de manera más sostenible y económica.',
      features: [
        'Más de 100 spots verificados',
        'Comunidad activa de viajeros',
        'Guías por país',
        'Funciona sin conexión',
        'Gratis y de código abierto'
      ]
    },
    de: {
      mission: 'SpotHitch ist eine Community-App für Tramper. Unsere Mission ist es, Reisen zugänglicher zu machen, indem wir die besten Tramper-Spots in Europa teilen.',
      vision: 'Eine globale Gemeinschaft von Reisenden schaffen, die sich gegenseitig helfen und ihr Wissen teilen, um nachhaltiger und wirtschaftlicher zu reisen.',
      features: [
        'Über 100 verifizierte Spots',
        'Aktive Reisenden-Community',
        'Länderführer',
        'Funktioniert offline',
        'Kostenlos und Open-Source'
      ]
    }
  }

  return {
    type: 'about',
    locale,
    content: content[locale] || content.fr,
    metadata: getPageMetadata('about', { locale }),
    schema: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About SpotHitch',
      description: content[locale]?.mission || content.fr.mission
    }
  }
}

/**
 * Get canonical URL for a page
 * @param {string} pageType - Type of page
 * @param {Object} params - Page parameters
 * @returns {string} Canonical URL
 */
export function getCanonicalUrl(pageType, params = {}) {
  const { locale = 'fr', countryCode, cityName, spotId } = params

  let path = ''
  switch (pageType) {
    case 'about':
      path = '/about'
      break
    case 'faq':
      path = '/faq'
      break
    case 'country':
      path = `/country/${countryCode}`
      break
    case 'city':
      path = `/city/${encodeURIComponent(cityName)}`
      break
    case 'spot':
      path = `/spot/${spotId}`
      break
    default:
      path = '/'
  }

  return `${BASE_URL}${path}?lang=${locale}`
}

/**
 * Generate breadcrumbs for a page
 * @param {string} pageType - Type of page
 * @param {Object} params - Page parameters
 * @returns {Array} Breadcrumb items
 */
export function generateBreadcrumbs(pageType, params = {}) {
  const { locale = 'fr', countryCode, cityName, spotId } = params
  const breadcrumbs = [
    {
      name: 'SpotHitch',
      url: BASE_URL
    }
  ]

  switch (pageType) {
    case 'about':
      breadcrumbs.push({
        name: PAGE_TYPES.about[locale],
        url: getCanonicalUrl('about', { locale })
      })
      break

    case 'faq':
      breadcrumbs.push({
        name: PAGE_TYPES.faq[locale],
        url: getCanonicalUrl('faq', { locale })
      })
      break

    case 'country':
      if (countryCode && COUNTRY_NAMES[countryCode]) {
        breadcrumbs.push({
          name: COUNTRY_NAMES[countryCode][locale],
          url: getCanonicalUrl('country', { countryCode, locale })
        })
      }
      break

    case 'city':
      if (cityName) {
        breadcrumbs.push({
          name: cityName,
          url: getCanonicalUrl('city', { cityName, locale })
        })
      }
      break

    case 'spot':
      if (spotId) {
        const spot = sampleSpots.find(s => s.id === parseInt(spotId))
        if (spot) {
          if (spot.country && COUNTRY_NAMES[spot.country]) {
            breadcrumbs.push({
              name: COUNTRY_NAMES[spot.country][locale],
              url: getCanonicalUrl('country', { countryCode: spot.country, locale })
            })
          }
          breadcrumbs.push({
            name: `${spot.from} → ${spot.to}`,
            url: getCanonicalUrl('spot', { spotId, locale })
          })
        }
      }
      break
  }

  return breadcrumbs
}

/**
 * Get alternate language links
 * @param {string} pageType - Type of page
 * @param {Object} params - Page parameters
 * @returns {Array} Alternate links
 */
export function getAlternateLinks(pageType, params = {}) {
  const alternates = []

  SUPPORTED_LANGUAGES.forEach(lang => {
    alternates.push({
      hreflang: lang,
      href: getCanonicalUrl(pageType, { ...params, locale: lang })
    })
  })

  // Add x-default
  alternates.push({
    hreflang: 'x-default',
    href: getCanonicalUrl(pageType, { ...params, locale: 'fr' })
  })

  return alternates
}

/**
 * Generate list of all static routes
 * @returns {Array} Static routes
 */
export function generateStaticRoutes() {
  const routes = []

  // About and FAQ pages
  SUPPORTED_LANGUAGES.forEach(locale => {
    routes.push({
      path: getCanonicalUrl('about', { locale }),
      type: 'about',
      locale,
      priority: 0.8,
      changefreq: 'monthly'
    })
    routes.push({
      path: getCanonicalUrl('faq', { locale }),
      type: 'faq',
      locale,
      priority: 0.7,
      changefreq: 'monthly'
    })
  })

  // Country pages
  const countries = [...new Set(sampleSpots.map(s => s.country))]
  countries.forEach(countryCode => {
    SUPPORTED_LANGUAGES.forEach(locale => {
      routes.push({
        path: getCanonicalUrl('country', { countryCode, locale }),
        type: 'country',
        countryCode,
        locale,
        priority: 0.9,
        changefreq: 'weekly'
      })
    })
  })

  // Spot pages
  sampleSpots.forEach(spot => {
    SUPPORTED_LANGUAGES.forEach(locale => {
      routes.push({
        path: getCanonicalUrl('spot', { spotId: spot.id, locale }),
        type: 'spot',
        spotId: spot.id,
        locale,
        priority: 0.8,
        changefreq: 'weekly'
      })
    })
  })

  return routes
}

/**
 * Pre-render page content
 * @param {string} pageType - Type of page
 * @param {Object} params - Page parameters
 * @returns {Object} Pre-rendered page data
 */
export function prerenderPage(pageType, params = {}) {
  const pageData = generateStaticPage(pageType, params)
  const metadata = getPageMetadata(pageType, params)

  if (!pageData) {
    return null
  }

  return {
    ...pageData,
    metadata,
    prerendered: true,
    timestamp: new Date().toISOString()
  }
}

/**
 * Save pre-rendered page to storage
 * @param {string} pageType - Type of page
 * @param {Object} params - Page parameters
 * @param {Object} data - Page data
 */
export function savePrerenderedPage(pageType, params, data) {
  try {
    const cache = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const key = `${pageType}_${JSON.stringify(params)}`
    cache[key] = {
      data,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
    return true
  } catch (error) {
    console.error('[StaticSEO] Save error:', error)
    return false
  }
}

/**
 * Load pre-rendered page from storage
 * @param {string} pageType - Type of page
 * @param {Object} params - Page parameters
 * @returns {Object|null} Cached page data
 */
export function loadPrerenderedPage(pageType, params) {
  try {
    const cache = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const key = `${pageType}_${JSON.stringify(params)}`
    return cache[key]?.data || null
  } catch (error) {
    console.error('[StaticSEO] Load error:', error)
    return null
  }
}

/**
 * Clear pre-rendered cache
 */
export function clearCache() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('[StaticSEO] Clear cache error:', error)
    return false
  }
}

export default {
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
}
