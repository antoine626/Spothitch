/**
 * Targeted Ads Service
 * Publicites non intrusives ciblees voyage (auberges, equipement)
 * Format natif integre au flux, option premium sans pub
 * Feature #237
 */

import { getState, setState } from '../stores/state.js'
import { trackEvent } from './analytics.js'
import { t } from '../i18n/index.js'

/**
 * Ad categories relevant to hitchhikers
 */
export const AdCategory = {
  HOSTELS: 'hostels',
  EQUIPMENT: 'equipment',
  TRANSPORT: 'transport',
  INSURANCE: 'insurance',
  APPS: 'apps',
  BOOKS: 'books',
}

/**
 * Ad placement positions
 */
export const AdPlacement = {
  SPOT_LIST: 'spot_list', // Between spots in list
  SPOT_DETAIL: 'spot_detail', // In spot detail page
  FEED: 'feed', // In activity feed
  PROFILE: 'profile', // In profile page
  MAP_OVERLAY: 'map_overlay', // Subtle map overlay
}

/**
 * Ad format types
 */
export const AdFormat = {
  NATIVE_CARD: 'native_card', // Looks like content
  BANNER_SMALL: 'banner_small', // Small banner
  BANNER_MEDIUM: 'banner_medium', // Medium banner
  RECOMMENDATION: 'recommendation', // Appears as suggestion
}

/**
 * Premium status check
 * @returns {boolean} Whether user has premium (ad-free)
 */
export function isPremiumUser() {
  const state = getState()
  return state.isPremium === true || state.adFreeUntil > Date.now()
}

/**
 * Check if ads are enabled
 * @returns {boolean} Whether ads should be shown
 */
export function areAdsEnabled() {
  const state = getState()

  // Don't show ads to premium users
  if (isPremiumUser()) return false

  // Check if user has opted out (GDPR)
  if (state.adsOptedOut === true) return false

  // Check consent
  if (state.cookieConsent?.marketing === false) return false

  return true
}

/**
 * Targeted ads database
 * In production, this would come from an ad network API
 */
const adsDatabase = {
  [AdCategory.HOSTELS]: [
    {
      id: 'ad-hostel-001',
      category: AdCategory.HOSTELS,
      format: AdFormat.NATIVE_CARD,
      advertiser: 'Hostelworld',
      title: {
        fr: 'Trouve les meilleures auberges de jeunesse',
        en: 'Find the best hostels worldwide',
        es: 'Encuentra los mejores albergues del mundo',
        de: 'Finde die besten Hostels weltweit',
      },
      description: {
        fr: 'Plus de 16 000 auberges dans 170 pays. Reserve en quelques clics.',
        en: 'Over 16,000 hostels in 170 countries. Book in seconds.',
        es: 'Mas de 16.000 albergues en 170 paises. Reserva en segundos.',
        de: 'Uber 16.000 Hostels in 170 Landern. Buche in Sekunden.',
      },
      image: '/ads/hostelworld.jpg',
      cta: {
        fr: 'Reserver',
        en: 'Book Now',
        es: 'Reservar',
        de: 'Jetzt buchen',
      },
      url: 'https://www.hostelworld.com/?source=spothitch',
      targetCountries: ['FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'PT', 'GB'],
      targetLevel: { min: 1, max: 100 },
      priority: 10,
      bidCPM: 2.50, // Cost per 1000 impressions
      isActive: true,
    },
    {
      id: 'ad-hostel-002',
      category: AdCategory.HOSTELS,
      format: AdFormat.NATIVE_CARD,
      advertiser: 'Booking.com',
      title: {
        fr: 'Hebergements a petits prix',
        en: 'Budget-friendly accommodations',
        es: 'Alojamientos economicos',
        de: 'Gunstige Unterkunfte',
      },
      description: {
        fr: 'Des chambres privees aux dortoirs, trouve ton spot pour dormir.',
        en: 'From private rooms to dorms, find your place to sleep.',
        es: 'Desde habitaciones privadas hasta dormitorios, encuentra tu lugar.',
        de: 'Von Privatzimmern bis Schlafsalen, finde deinen Schlafplatz.',
      },
      image: '/ads/booking.jpg',
      cta: {
        fr: 'Chercher',
        en: 'Search',
        es: 'Buscar',
        de: 'Suchen',
      },
      url: 'https://www.booking.com/?aid=spothitch',
      targetCountries: ['FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'PT', 'GB', 'PL', 'CZ'],
      targetLevel: { min: 1, max: 100 },
      priority: 8,
      bidCPM: 2.00,
      isActive: true,
    },
  ],
  [AdCategory.EQUIPMENT]: [
    {
      id: 'ad-equip-001',
      category: AdCategory.EQUIPMENT,
      format: AdFormat.NATIVE_CARD,
      advertiser: 'Decathlon',
      title: {
        fr: 'Equipement de voyage pas cher',
        en: 'Affordable travel gear',
        es: 'Equipo de viaje economico',
        de: 'Gunstige Reiseausrustung',
      },
      description: {
        fr: 'Sacs a dos, tentes, duvets... Tout pour l\'aventure a petits prix.',
        en: 'Backpacks, tents, sleeping bags... Everything for adventure on a budget.',
        es: 'Mochilas, tiendas, sacos de dormir... Todo para la aventura.',
        de: 'Rucksacke, Zelte, Schlafsacke... Alles fur das Abenteuer.',
      },
      image: '/ads/decathlon.jpg',
      cta: {
        fr: 'Voir',
        en: 'Shop',
        es: 'Ver',
        de: 'Ansehen',
      },
      url: 'https://www.decathlon.fr/voyage?source=spothitch',
      targetCountries: ['FR', 'ES', 'DE', 'BE', 'IT', 'PT', 'PL'],
      targetLevel: { min: 1, max: 50 },
      priority: 7,
      bidCPM: 1.50,
      isActive: true,
    },
    {
      id: 'ad-equip-002',
      category: AdCategory.EQUIPMENT,
      format: AdFormat.RECOMMENDATION,
      advertiser: 'Amazon',
      title: {
        fr: 'Les essentiels du routard',
        en: 'Hitchhiker essentials',
        es: 'Esenciales del autoestopista',
        de: 'Anhalter-Grundausstattung',
      },
      description: {
        fr: 'Power banks, lampes frontales, kits premiers secours...',
        en: 'Power banks, headlamps, first aid kits...',
        es: 'Baterias externas, linternas frontales, botiquines...',
        de: 'Powerbanks, Stirnlampen, Erste-Hilfe-Sets...',
      },
      image: '/ads/amazon-travel.jpg',
      cta: {
        fr: 'Acheter',
        en: 'Buy',
        es: 'Comprar',
        de: 'Kaufen',
      },
      url: 'https://www.amazon.fr/travel-essentials?tag=spothitch',
      targetCountries: ['FR', 'DE', 'ES', 'IT', 'GB'],
      targetLevel: { min: 1, max: 100 },
      priority: 6,
      bidCPM: 1.80,
      isActive: true,
    },
  ],
  [AdCategory.TRANSPORT]: [
    {
      id: 'ad-transport-001',
      category: AdCategory.TRANSPORT,
      format: AdFormat.NATIVE_CARD,
      advertiser: 'BlaBlaCar',
      title: {
        fr: 'Covoiturage en Europe',
        en: 'Carpooling across Europe',
        es: 'Coche compartido en Europa',
        de: 'Mitfahrgelegenheiten in Europa',
      },
      description: {
        fr: 'Quand le pouce ne suffit pas, partage un trajet a petit prix.',
        en: 'When hitchhiking isn\'t enough, share a ride at low cost.',
        es: 'Cuando el autostop no basta, comparte viaje a bajo costo.',
        de: 'Wenn Trampen nicht reicht, teile eine Fahrt gunstig.',
      },
      image: '/ads/blablacar.jpg',
      cta: {
        fr: 'Trouver',
        en: 'Find',
        es: 'Buscar',
        de: 'Finden',
      },
      url: 'https://www.blablacar.fr/?source=spothitch',
      targetCountries: ['FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'PT', 'PL'],
      targetLevel: { min: 1, max: 100 },
      priority: 9,
      bidCPM: 2.20,
      isActive: true,
    },
  ],
  [AdCategory.INSURANCE]: [
    {
      id: 'ad-insurance-001',
      category: AdCategory.INSURANCE,
      format: AdFormat.BANNER_SMALL,
      advertiser: 'World Nomads',
      title: {
        fr: 'Assurance voyage backpacker',
        en: 'Backpacker travel insurance',
        es: 'Seguro de viaje mochilero',
        de: 'Backpacker-Reiseversicherung',
      },
      description: {
        fr: 'Protection complete pour les aventuriers. A partir de 3EUR/jour.',
        en: 'Complete protection for adventurers. From $3/day.',
        es: 'Proteccion completa para aventureros. Desde 3EUR/dia.',
        de: 'Kompletter Schutz fur Abenteurer. Ab 3EUR/Tag.',
      },
      image: '/ads/worldnomads.jpg',
      cta: {
        fr: 'Souscrire',
        en: 'Get Quote',
        es: 'Cotizar',
        de: 'Angebot',
      },
      url: 'https://www.worldnomads.com/?source=spothitch',
      targetCountries: ['FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'PT', 'GB', 'PL'],
      targetLevel: { min: 5, max: 100 },
      priority: 5,
      bidCPM: 3.00,
      isActive: true,
    },
  ],
  [AdCategory.APPS]: [
    {
      id: 'ad-apps-001',
      category: AdCategory.APPS,
      format: AdFormat.RECOMMENDATION,
      advertiser: 'Maps.me',
      title: {
        fr: 'Cartes hors-ligne gratuites',
        en: 'Free offline maps',
        es: 'Mapas sin conexion gratis',
        de: 'Kostenlose Offline-Karten',
      },
      description: {
        fr: 'Telecharge les cartes pour naviguer sans internet.',
        en: 'Download maps to navigate without internet.',
        es: 'Descarga mapas para navegar sin internet.',
        de: 'Lade Karten herunter, um ohne Internet zu navigieren.',
      },
      image: '/ads/mapsme.jpg',
      cta: {
        fr: 'Telecharger',
        en: 'Download',
        es: 'Descargar',
        de: 'Herunterladen',
      },
      url: 'https://maps.me/?source=spothitch',
      targetCountries: ['FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'PT', 'GB', 'PL', 'CZ'],
      targetLevel: { min: 1, max: 100 },
      priority: 4,
      bidCPM: 1.00,
      isActive: true,
    },
  ],
  [AdCategory.BOOKS]: [
    {
      id: 'ad-books-001',
      category: AdCategory.BOOKS,
      format: AdFormat.NATIVE_CARD,
      advertiser: 'Lonely Planet',
      title: {
        fr: 'Guides de voyage Lonely Planet',
        en: 'Lonely Planet travel guides',
        es: 'Guias de viaje Lonely Planet',
        de: 'Lonely Planet Reisefuhrer',
      },
      description: {
        fr: 'Les meilleurs conseils pour tes aventures en Europe.',
        en: 'The best tips for your European adventures.',
        es: 'Los mejores consejos para tus aventuras en Europa.',
        de: 'Die besten Tipps fur deine Europa-Abenteuer.',
      },
      image: '/ads/lonelyplanet.jpg',
      cta: {
        fr: 'Decouvrir',
        en: 'Explore',
        es: 'Descubrir',
        de: 'Entdecken',
      },
      url: 'https://www.lonelyplanet.com/europe?source=spothitch',
      targetCountries: ['FR', 'DE', 'ES', 'IT', 'BE', 'NL', 'PT', 'GB'],
      targetLevel: { min: 1, max: 100 },
      priority: 3,
      bidCPM: 1.20,
      isActive: true,
    },
  ],
}

/**
 * Get relevant ads for a user based on context
 * @param {Object} options - Targeting options
 * @param {string} options.placement - Ad placement
 * @param {string} options.category - Optional category filter
 * @param {number} options.limit - Max number of ads
 * @returns {Array} List of relevant ads
 */
export function getRelevantAds(options = {}) {
  const { placement = AdPlacement.FEED, category = null, limit = 1 } = options

  if (!areAdsEnabled()) return []

  const state = getState()
  const userCountry = state.userCountry || 'FR'
  const userLevel = state.level || 1

  // Get all ads
  let allAds = Object.values(adsDatabase).flat()

  // Filter by category if specified
  if (category) {
    allAds = allAds.filter((ad) => ad.category === category)
  }

  // Filter active ads
  allAds = allAds.filter((ad) => ad.isActive)

  // Filter by target country
  allAds = allAds.filter((ad) => ad.targetCountries.includes(userCountry))

  // Filter by target level
  allAds = allAds.filter(
    (ad) => userLevel >= ad.targetLevel.min && userLevel <= ad.targetLevel.max
  )

  // Sort by priority and bid
  allAds.sort((a, b) => {
    const scoreA = a.priority * 10 + a.bidCPM
    const scoreB = b.priority * 10 + b.bidCPM
    return scoreB - scoreA
  })

  // Get top ads
  const selectedAds = allAds.slice(0, limit)

  // Track impressions
  selectedAds.forEach((ad) => {
    trackAdImpression(ad.id, placement)
  })

  return selectedAds
}

/**
 * Get a single ad for a placement
 * @param {string} placement - Ad placement
 * @param {string} category - Optional category
 * @returns {Object|null} Ad or null
 */
export function getAdForPlacement(placement, category = null) {
  const ads = getRelevantAds({ placement, category, limit: 1 })
  return ads[0] || null
}

/**
 * Track ad impression
 * @param {string} adId - Ad ID
 * @param {string} placement - Placement where ad was shown
 */
export function trackAdImpression(adId, placement) {
  const state = getState()
  const impressions = state.adImpressions || []

  // Track locally
  impressions.push({
    adId,
    placement,
    timestamp: Date.now(),
  })

  // Keep only last 1000 impressions
  if (impressions.length > 1000) {
    impressions.splice(0, impressions.length - 1000)
  }

  setState({ adImpressions: impressions })

  // Track event
  trackEvent('ad_impression', {
    ad_id: adId,
    placement,
  })
}

/**
 * Track ad click
 * @param {string} adId - Ad ID
 * @param {string} placement - Placement where ad was clicked
 */
export function trackAdClick(adId, placement) {
  const state = getState()
  const clicks = state.adClicks || []

  // Track locally
  clicks.push({
    adId,
    placement,
    timestamp: Date.now(),
  })

  setState({ adClicks: clicks })

  // Track event
  trackEvent('ad_click', {
    ad_id: adId,
    placement,
  })
}

/**
 * Render native ad card HTML
 * @param {Object} ad - Ad object
 * @param {string} placement - Placement context
 * @returns {string} HTML string
 */
export function renderNativeAdCard(ad, placement = AdPlacement.FEED) {
  if (!ad) return ''

  const state = getState()
  const lang = state.lang || 'fr'

  const title = ad.title[lang] || ad.title.en
  const description = ad.description[lang] || ad.description.en
  const cta = ad.cta[lang] || ad.cta.en

  return `
    <div class="native-ad-card rounded-xl overflow-hidden bg-dark-700 border border-dark-600 hover:border-primary/50 transition-all"
         data-ad-id="${ad.id}"
         data-placement="${placement}"
         role="article"
         aria-label="${t('sponsoredContent')}">
      <a href="${ad.url}" target="_blank" rel="noopener sponsored"
         onclick="window.handleAdClick?.('${ad.id}', '${placement}')"
         class="block">
        ${ad.image ? `
          <div class="relative h-32 bg-dark-600">
            <img src="${ad.image}" alt="${ad.advertiser}" class="w-full h-full object-cover" loading="lazy" />
            <span class="absolute top-2 right-2 bg-black/60 text-xs px-2 py-0.5 rounded text-gray-300">
              ${t('ad')}
            </span>
          </div>
        ` : ''}
        <div class="p-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs text-gray-500">${ad.advertiser}</span>
            <span class="text-xs text-primary/60">${t('sponsored')}</span>
          </div>
          <h3 class="font-semibold text-white mb-1">${title}</h3>
          <p class="text-sm text-gray-400 mb-3">${description}</p>
          <span class="inline-flex items-center gap-1 text-primary text-sm font-medium">
            ${cta}
            <i class="fas fa-arrow-right text-xs"></i>
          </span>
        </div>
      </a>
    </div>
  `
}

/**
 * Render small banner ad HTML
 * @param {Object} ad - Ad object
 * @param {string} placement - Placement context
 * @returns {string} HTML string
 */
export function renderBannerAd(ad, placement = AdPlacement.FEED) {
  if (!ad) return ''

  const state = getState()
  const lang = state.lang || 'fr'

  const title = ad.title[lang] || ad.title.en
  const cta = ad.cta[lang] || ad.cta.en

  return `
    <div class="banner-ad rounded-lg overflow-hidden bg-gradient-to-r from-dark-700 to-dark-600 border border-dark-500"
         data-ad-id="${ad.id}"
         data-placement="${placement}">
      <a href="${ad.url}" target="_blank" rel="noopener sponsored"
         onclick="window.handleAdClick?.('${ad.id}', '${placement}')"
         class="flex items-center gap-3 p-3">
        ${ad.image ? `
          <img src="${ad.image}" alt="${ad.advertiser}" class="w-12 h-12 rounded object-cover" loading="lazy" />
        ` : ''}
        <div class="flex-1 min-w-0">
          <p class="text-xs text-gray-500 mb-0.5">${t('ad')} - ${ad.advertiser}</p>
          <p class="text-sm text-white truncate">${title}</p>
        </div>
        <span class="text-primary text-sm font-medium whitespace-nowrap">${cta}</span>
      </a>
    </div>
  `
}

/**
 * Render recommendation ad HTML (looks like a suggestion)
 * @param {Object} ad - Ad object
 * @param {string} placement - Placement context
 * @returns {string} HTML string
 */
export function renderRecommendationAd(ad, placement = AdPlacement.FEED) {
  if (!ad) return ''

  const state = getState()
  const lang = state.lang || 'fr'

  const title = ad.title[lang] || ad.title.en
  const description = ad.description[lang] || ad.description.en
  const cta = ad.cta[lang] || ad.cta.en

  return `
    <div class="recommendation-ad rounded-lg p-3 bg-primary/5 border border-primary/20 hover:border-primary/40 transition-colors"
         data-ad-id="${ad.id}"
         data-placement="${placement}">
      <a href="${ad.url}" target="_blank" rel="noopener sponsored"
         onclick="window.handleAdClick?.('${ad.id}', '${placement}')"
         class="block">
        <div class="flex items-center gap-2 mb-2">
          <i class="fas fa-lightbulb text-primary text-sm"></i>
          <span class="text-xs text-primary">${t('recommended')}</span>
          <span class="text-xs text-gray-500 ml-auto">${t('ad')}</span>
        </div>
        <p class="text-sm font-medium text-white mb-1">${title}</p>
        <p class="text-xs text-gray-400 mb-2">${description}</p>
        <span class="text-xs text-primary font-medium">${cta} <i class="fas fa-external-link-alt ml-1"></i></span>
      </a>
    </div>
  `
}

/**
 * Render ad based on its format
 * @param {Object} ad - Ad object
 * @param {string} placement - Placement context
 * @returns {string} HTML string
 */
export function renderAd(ad, placement = AdPlacement.FEED) {
  if (!ad) return ''

  switch (ad.format) {
    case AdFormat.NATIVE_CARD:
      return renderNativeAdCard(ad, placement)
    case AdFormat.BANNER_SMALL:
    case AdFormat.BANNER_MEDIUM:
      return renderBannerAd(ad, placement)
    case AdFormat.RECOMMENDATION:
      return renderRecommendationAd(ad, placement)
    default:
      return renderNativeAdCard(ad, placement)
  }
}

/**
 * Handle ad click (exposed globally)
 * @param {string} adId - Ad ID
 * @param {string} placement - Placement
 */
export function handleAdClick(adId, placement) {
  trackAdClick(adId, placement)
}

/**
 * Opt out of personalized ads
 */
export function optOutOfAds() {
  setState({ adsOptedOut: true })
  trackEvent('ads_opt_out')
}

/**
 * Opt back in to ads
 */
export function optInToAds() {
  setState({ adsOptedOut: false })
  trackEvent('ads_opt_in')
}

/**
 * Get ad statistics
 * @returns {Object} Ad stats
 */
export function getAdStats() {
  const state = getState()
  const impressions = state.adImpressions || []
  const clicks = state.adClicks || []

  const now = Date.now()
  const oneDayAgo = now - 24 * 60 * 60 * 1000

  return {
    totalImpressions: impressions.length,
    todayImpressions: impressions.filter((i) => i.timestamp > oneDayAgo).length,
    totalClicks: clicks.length,
    todayClicks: clicks.filter((c) => c.timestamp > oneDayAgo).length,
    ctr: impressions.length > 0 ? ((clicks.length / impressions.length) * 100).toFixed(2) : 0,
    isPremium: isPremiumUser(),
    adsEnabled: areAdsEnabled(),
  }
}

/**
 * Enable premium (ad-free) mode
 * @param {number} durationMs - Duration in milliseconds
 */
export function enablePremium(durationMs) {
  const adFreeUntil = Date.now() + durationMs
  setState({ adFreeUntil, isPremium: true })
  trackEvent('premium_enabled', { duration: durationMs })
}

/**
 * Disable premium mode
 */
export function disablePremium() {
  setState({ adFreeUntil: null, isPremium: false })
  trackEvent('premium_disabled')
}

/**
 * Get all ad categories
 * @returns {Array} List of categories
 */
export function getAdCategories() {
  return Object.values(AdCategory)
}

/**
 * Get all ad formats
 * @returns {Array} List of formats
 */
export function getAdFormats() {
  return Object.values(AdFormat)
}

/**
 * Get all ad placements
 * @returns {Array} List of placements
 */
export function getAdPlacements() {
  return Object.values(AdPlacement)
}

/**
 * Render premium upgrade prompt
 * @returns {string} HTML string
 */
export function renderPremiumPrompt() {
  return `
    <div class="premium-prompt rounded-xl p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/30">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <i class="fas fa-crown text-yellow-400"></i>
        </div>
        <div>
          <h3 class="font-bold text-white">${t('goPremium')}</h3>
          <p class="text-xs text-gray-400">${t('premiumSubtitle')}</p>
        </div>
      </div>
      <ul class="text-sm text-gray-300 space-y-2 mb-4">
        <li><i class="fas fa-check text-green-400 mr-2"></i>${t('premiumBenefitNoAds')}</li>
        <li><i class="fas fa-check text-green-400 mr-2"></i>${t('premiumBenefitBadge')}</li>
        <li><i class="fas fa-check text-green-400 mr-2"></i>${t('premiumBenefitPriority')}</li>
      </ul>
      <button onclick="window.openPremiumModal?.()"
        class="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 rounded-lg transition-colors">
        ${t('upgradeToPremium')}
      </button>
    </div>
  `
}

// Expose functions globally for onclick handlers
if (typeof window !== 'undefined') {
  window.handleAdClick = handleAdClick
  window.optOutOfAds = optOutOfAds
  window.optInToAds = optInToAds
}

export default {
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
}
