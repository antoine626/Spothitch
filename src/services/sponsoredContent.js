/**
 * Sponsored Content Service
 * Handles local sponsors and partnerships with rest areas, gas stations, etc.
 * Ads are integrated naturally into spot descriptions
 * Categories: restaurant, hotel, transport, shop
 */

import { getState } from '../stores/state.js'
import { trackEvent } from './analytics.js'

// Sponsored partners database by category
// In production, this would come from Firebase with real sponsor data
const sponsoredPartners = {
  // Restaurants & Food (category: restaurant)
  restaurant: [
    {
      id: 'mcdo-highway',
      name: 'McDonald\'s',
      category: 'restaurant',
      type: 'fast_food',
      countries: ['FR', 'DE', 'ES', 'BE', 'NL', 'IT'],
      logo: '/sponsors/mcdonalds.png',
      descriptionTemplate: {
        fr: 'McDonald\'s à {distance}m - wifi gratuit et toilettes',
        en: 'McDonald\'s {distance}m away - free wifi and toilets',
        es: 'McDonald\'s a {distance}m - wifi gratis y baños',
        de: 'McDonald\'s {distance}m entfernt - kostenloses WLAN und Toiletten',
      },
      benefits: ['wifi', 'toilets', 'food'],
      trackingUrl: 'https://tracking.spothitch.com/sponsor/mcdo',
    },
    {
      id: 'burger-king-highway',
      name: 'Burger King',
      category: 'restaurant',
      type: 'fast_food',
      countries: ['FR', 'DE', 'ES'],
      logo: '/sponsors/burgerking.png',
      descriptionTemplate: {
        fr: 'Burger King à {distance}m pour se poser et recharger',
        en: 'Burger King {distance}m away to rest and recharge',
        es: 'Burger King a {distance}m para descansar y recargar',
        de: 'Burger King {distance}m entfernt zum Ausruhen und Aufladen',
      },
      benefits: ['wifi', 'food', 'charging'],
      trackingUrl: 'https://tracking.spothitch.com/sponsor/bk',
    },
  ],

  // Hotels & Accommodation (category: hotel)
  hotel: [
    {
      id: 'formule1-highway',
      name: 'Formule 1',
      category: 'hotel',
      type: 'budget_hotel',
      countries: ['FR', 'ES', 'IT'],
      logo: '/sponsors/formule1.png',
      descriptionTemplate: {
        fr: 'Formule 1 à {distance}m - chambre à partir de 40€',
        en: 'Formule 1 {distance}m away - room from €40',
        es: 'Formule 1 a {distance}m - habitación desde 40€',
        de: 'Formule 1 {distance}m entfernt - Zimmer ab 40€',
      },
      benefits: ['accommodation', 'wifi', 'parking'],
      trackingUrl: 'https://tracking.spothitch.com/sponsor/formule1',
    },
  ],

  // Transport & Services (category: transport)
  transport: [
    {
      id: 'total-energies-fr',
      name: 'TotalEnergies',
      category: 'transport',
      type: 'gas_station',
      countries: ['FR'],
      logo: '/sponsors/total.png',
      description: {
        fr: 'Station TotalEnergies - douches, wifi gratuit, restauration',
        en: 'TotalEnergies station - showers, free wifi, food',
        es: 'Estación TotalEnergies - duchas, wifi gratis, comida',
        de: 'TotalEnergies Tankstelle - Duschen, kostenloses WLAN, Essen',
      },
      benefits: ['wifi', 'showers', 'food', 'rest_area'],
      trackingUrl: 'https://tracking.spothitch.com/sponsor/total',
    },
    {
      id: 'shell-eu',
      name: 'Shell',
      category: 'transport',
      type: 'gas_station',
      countries: ['DE', 'NL', 'BE', 'FR'],
      logo: '/sponsors/shell.png',
      description: {
        fr: 'Station Shell - espace repos et snacks',
        en: 'Shell station - rest area and snacks',
        es: 'Estación Shell - área de descanso y snacks',
        de: 'Shell Tankstelle - Rastbereich und Snacks',
      },
      benefits: ['rest_area', 'food'],
      trackingUrl: 'https://tracking.spothitch.com/sponsor/shell',
    },
  ],

  // Shops & Supplies (category: shop)
  shop: [
    {
      id: 'carrefour-express',
      name: 'Carrefour Express',
      category: 'shop',
      type: 'supermarket',
      countries: ['FR', 'ES', 'IT', 'BE'],
      logo: '/sponsors/carrefour.png',
      descriptionTemplate: {
        fr: 'Carrefour Express à {distance}m - provisions et snacks',
        en: 'Carrefour Express {distance}m away - supplies and snacks',
        es: 'Carrefour Express a {distance}m - provisiones y snacks',
        de: 'Carrefour Express {distance}m entfernt - Vorräte und Snacks',
      },
      benefits: ['food', 'supplies'],
      trackingUrl: 'https://tracking.spothitch.com/sponsor/carrefour',
    },
  ],
}

// Sponsored spots - spots with integrated sponsor content
// In production, this would be managed through an admin panel
const sponsoredSpots = new Map()

/**
 * Get sponsored content for a specific spot and category
 * Returns null if no sponsor is relevant for this location
 * @param {string|number} spotId - The spot ID
 * @param {string} category - Category: 'restaurant', 'hotel', 'transport', 'shop'
 * @returns {Object|null} Sponsored content or null
 */
export function getSponsoredContent(spotId, category) {
  // Get spot data from state if needed
  const state = getState()
  const spots = state.spots || []
  const spot = spots.find(s => s.id === spotId || s.name === spotId)

  if (!spot || !spot.country) return null
  if (!category || !sponsoredPartners[category]) return null

  const { lang } = state
  const country = spot.country.toUpperCase()

  // Get partners for this category
  const categoryPartners = sponsoredPartners[category] || []
  const relevantPartners = categoryPartners.filter((partner) =>
    partner.countries.includes(country)
  )

  if (relevantPartners.length === 0) return null

  // Select a random partner (in production, use location proximity)
  const randomPartner =
    relevantPartners[Math.floor(Math.random() * relevantPartners.length)]

  return formatSponsoredContent(
    {
      partner: randomPartner,
      distance: Math.floor(Math.random() * 300) + 50, // 50-350m for demo
      category,
    },
    lang
  )
}

/**
 * Legacy function for backward compatibility
 * Get sponsored content for a specific spot (any category)
 * Returns null if no sponsor is relevant for this location
 * @param {Object} spot - The spot object with location
 * @returns {Object|null} Sponsored content or null
 */
export function getSponsoredContentForSpot(spot) {
  if (!spot || !spot.country) return null

  const { lang } = getState()
  const country = spot.country.toUpperCase()

  // Check if this spot has direct sponsored content
  if (sponsoredSpots.has(spot.id)) {
    const sponsorship = sponsoredSpots.get(spot.id)
    return formatSponsoredContent(sponsorship, lang)
  }

  // Find relevant sponsors for this country (all categories)
  const allPartners = Object.values(sponsoredPartners).flat()

  const relevantPartners = allPartners.filter((partner) =>
    partner.countries.includes(country)
  )

  if (relevantPartners.length === 0) return null

  // For demo: randomly select one partner
  const randomPartner =
    relevantPartners[Math.floor(Math.random() * relevantPartners.length)]

  return formatSponsoredContent(
    {
      partner: randomPartner,
      distance: Math.floor(Math.random() * 300) + 50,
      category: randomPartner.category,
    },
    lang
  )
}

/**
 * Format sponsored content for display
 * @param {Object} sponsorship - Sponsorship data
 * @param {string} lang - Current language
 * @returns {Object} Formatted sponsored content
 */
function formatSponsoredContent(sponsorship, lang) {
  const { partner, distance, category } = sponsorship

  let description = partner.description
    ? partner.description[lang] || partner.description.en
    : partner.descriptionTemplate[lang] || partner.descriptionTemplate.en

  // Replace distance placeholder
  if (distance) {
    description = description.replace('{distance}', distance)
  }

  return {
    id: partner.id,
    name: partner.name,
    type: partner.type,
    category: category || partner.category,
    logo: partner.logo,
    description,
    benefits: partner.benefits,
    distance,
    trackingUrl: partner.trackingUrl,
    isSponsored: true,
  }
}

/**
 * Generate the HTML for sponsored content banner
 * This is designed to be non-intrusive and helpful
 * @param {Object} content - Sponsored content object from getSponsoredContent()
 * @returns {string} HTML string for sponsored banner
 */
export function renderSponsoredBanner(content) {
  if (!content) return ''

  const benefitIcons = {
    wifi: '<i class="fas fa-wifi"></i>',
    showers: '<i class="fas fa-shower"></i>',
    food: '<i class="fas fa-utensils"></i>',
    toilets: '<i class="fas fa-restroom"></i>',
    rest_area: '<i class="fas fa-couch"></i>',
    charging: '<i class="fas fa-plug"></i>',
    supplies: '<i class="fas fa-shopping-basket"></i>',
    accommodation: '<i class="fas fa-bed"></i>',
    parking: '<i class="fas fa-parking"></i>',
  }

  const categoryLabels = {
    restaurant: '🍽️ Restaurant',
    hotel: '🛏️ Hébergement',
    transport: '⛽ Transport',
    shop: '🛒 Magasin',
  }

  const benefitsHtml = content.benefits
    .map((b) => benefitIcons[b] || '')
    .filter(Boolean)
    .join(' ')

  const categoryLabel = categoryLabels[content.category] || 'Partenaire'

  return `
    <div class="sponsored-banner rounded-lg p-4 mt-4 border border-accent-500/30 bg-gradient-to-r from-accent-900/20 to-accent-800/10 hover:border-accent-500/50 transition-colors cursor-pointer"
         data-sponsor-id="${content.id}"
         role="article"
         aria-label="Contenu sponsorisé: ${content.name}"
         onclick="window.trackSponsorClick?.('${content.id}')">
      <div class="flex items-start gap-3">
        <div class="shrink-0">
          <span class="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-accent-500/20 text-accent-400">
            <i class="fas fa-handshake text-sm"></i>
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-2 flex-wrap">
            <p class="text-sm font-semibold text-white">${content.name}</p>
            <span class="text-xs text-accent-400">${categoryLabel}</span>
          </div>
          <p class="text-sm text-gray-300 mt-1">
            ${content.description}
          </p>
          <div class="flex items-center gap-2 mt-2 text-xs text-gray-400 flex-wrap">
            ${benefitsHtml}
            ${content.distance ? `<span class="ml-auto text-accent-400 font-medium">${content.distance}m</span>` : ''}
          </div>
        </div>
      </div>
      <div class="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <span class="text-xs text-gray-500">🤝 Partenaire vérifié</span>
        <span class="text-xs text-gray-400">Tap pour en savoir plus</span>
      </div>
    </div>
  `
}

/**
 * Legacy function for backward compatibility
 * Generate the HTML for sponsored content in spot description
 * This is designed to be non-intrusive and helpful
 * @param {Object} spot - The spot object
 * @returns {string} HTML string for sponsored content
 */
export function renderSponsoredContent(spot) {
  const sponsored = getSponsoredContentForSpot(spot)
  if (!sponsored) return ''
  return renderSponsoredBanner(sponsored)
}

/**
 * Track sponsor click for analytics
 * @param {string} sponsorId - Sponsor ID
 */
export function trackSponsorClick(sponsorId) {
  // Find the sponsor to get details
  const allPartners = Object.values(sponsoredPartners).flat()
  const partner = allPartners.find((p) => p.id === sponsorId)

  if (!partner) {
    console.warn(`[Sponsor] Unknown sponsor ID: ${sponsorId}`)
    return
  }

  // Track in analytics
  trackEvent('sponsor_click', {
    sponsor_id: sponsorId,
    sponsor_name: partner.name,
    sponsor_category: partner.category,
    sponsor_type: partner.type,
    timestamp: new Date().toISOString(),
  })

  // Send tracking beacon to sponsor's tracking URL
  if (partner.trackingUrl) {
    try {
      const beacon = new Image()
      beacon.src = `${partner.trackingUrl}?action=click&sponsor_id=${sponsorId}&timestamp=${Date.now()}`
      // Silently fail if tracking fails
    } catch (error) {
      // Ignore tracking errors
    }
  }
}

/**
 * Register a sponsored spot (admin function)
 * @param {string} spotId - Spot ID
 * @param {Object} sponsorship - Sponsorship data
 */
export function registerSponsoredSpot(spotId, sponsorship) {
  sponsoredSpots.set(spotId, sponsorship)
}

/**
 * Get all available sponsor categories
 * @returns {Array} List of sponsor categories
 */
export function getSponsorCategories() {
  return Object.keys(sponsoredPartners)
}

/**
 * Get all available sponsor types
 * @returns {Array} List of sponsor types
 */
export function getSponsorTypes() {
  const types = new Set()
  Object.values(sponsoredPartners).forEach((partners) => {
    partners.forEach((p) => types.add(p.type))
  })
  return Array.from(types)
}

/**
 * Get sponsors by country
 * @param {string} countryCode - ISO country code
 * @param {string} category - Optional category filter
 * @returns {Array} List of sponsors for the country
 */
export function getSponsorsByCountry(countryCode, category = null) {
  const country = countryCode.toUpperCase()
  let allPartners = []

  if (category && sponsoredPartners[category]) {
    allPartners = sponsoredPartners[category]
  } else {
    allPartners = Object.values(sponsoredPartners).flat()
  }

  return allPartners.filter((partner) => partner.countries.includes(country))
}

/**
 * Get sponsors by category
 * @param {string} category - Category: 'restaurant', 'hotel', 'transport', 'shop'
 * @returns {Array} List of sponsors for the category
 */
export function getSponsorsByCategory(category) {
  return sponsoredPartners[category] || []
}

/**
 * Calculate impression value for sponsors
 * Used for reporting to sponsors
 * @param {string} sponsorId - Sponsor ID
 * @returns {number} Estimated impression value in cents
 */
export function calculateImpressionValue(sponsorId) {
  // Base value per impression in cents
  const baseValue = 0.5
  // Premium multiplier for high-traffic spots
  const premiumMultiplier = 1.5

  // In production, this would use actual impression data
  return baseValue * premiumMultiplier
}

/**
 * Check if sponsor is available for a location
 * @param {string} sponsorId - Sponsor ID
 * @param {string} countryCode - ISO country code
 * @returns {boolean} True if sponsor is available
 */
export function isSponsorAvailable(sponsorId, countryCode) {
  const country = countryCode.toUpperCase()
  const allPartners = Object.values(sponsoredPartners).flat()
  const sponsor = allPartners.find((p) => p.id === sponsorId)
  return sponsor ? sponsor.countries.includes(country) : false
}

// Expose tracking function globally for onclick handlers
if (typeof window !== 'undefined') {
  window.trackSponsorClick = trackSponsorClick
}

export default {
  getSponsoredContent,
  getSponsoredContentForSpot,
  renderSponsoredBanner,
  renderSponsoredContent,
  trackSponsorClick,
  registerSponsoredSpot,
  getSponsorCategories,
  getSponsorTypes,
  getSponsorsByCountry,
  getSponsorsByCategory,
  calculateImpressionValue,
  isSponsorAvailable,
}
