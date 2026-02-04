/**
 * Sponsored Content Service
 * Handles local sponsors and partnerships with rest areas, gas stations, etc.
 * Ads are integrated naturally into spot descriptions
 */

import { getState } from '../stores/state.js'

// Sponsored partners database
// In production, this would come from Firebase
const sponsoredPartners = {
  // Rest areas / Gas stations
  restAreas: [
    {
      id: 'total-energies-fr',
      name: 'TotalEnergies',
      type: 'gas_station',
      countries: ['FR'],
      logo: '/sponsors/total.png',
      description: {
        fr: 'Station TotalEnergies a proximite - douches, wifi gratuit, restauration',
        en: 'TotalEnergies station nearby - showers, free wifi, food',
        es: 'Estacion TotalEnergies cerca - duchas, wifi gratis, comida',
        de: 'TotalEnergies Tankstelle in der Nahe - Duschen, kostenloses WLAN, Essen',
      },
      benefits: ['wifi', 'showers', 'food', 'rest_area'],
      trackingUrl: 'https://tracking.spothitch.com/sponsor/total',
    },
    {
      id: 'shell-eu',
      name: 'Shell',
      type: 'gas_station',
      countries: ['DE', 'NL', 'BE', 'FR'],
      logo: '/sponsors/shell.png',
      description: {
        fr: 'Station Shell avec espace repos et snacks',
        en: 'Shell station with rest area and snacks',
        es: 'Estacion Shell con area de descanso y snacks',
        de: 'Shell Tankstelle mit Rastbereich und Snacks',
      },
      benefits: ['rest_area', 'food'],
      trackingUrl: 'https://tracking.spothitch.com/sponsor/shell',
    },
  ],

  // Fast food / Restaurants near spots
  restaurants: [
    {
      id: 'mcdo-highway',
      name: 'McDonald\'s',
      type: 'fast_food',
      countries: ['FR', 'DE', 'ES', 'BE', 'NL', 'IT'],
      logo: '/sponsors/mcdonalds.png',
      descriptionTemplate: {
        fr: 'Il y a un McDonald\'s a {distance}m - wifi gratuit et toilettes',
        en: 'There\'s a McDonald\'s {distance}m away - free wifi and toilets',
        es: 'Hay un McDonald\'s a {distance}m - wifi gratis y banos',
        de: 'Es gibt ein McDonald\'s {distance}m entfernt - kostenloses WLAN und Toiletten',
      },
      benefits: ['wifi', 'toilets', 'food'],
      trackingUrl: 'https://tracking.spothitch.com/sponsor/mcdo',
    },
    {
      id: 'burger-king-highway',
      name: 'Burger King',
      type: 'fast_food',
      countries: ['FR', 'DE', 'ES'],
      logo: '/sponsors/burgerking.png',
      descriptionTemplate: {
        fr: 'Burger King a {distance}m pour se poser et recharger',
        en: 'Burger King {distance}m away to rest and recharge',
        es: 'Burger King a {distance}m para descansar y recargar',
        de: 'Burger King {distance}m entfernt zum Ausruhen und Aufladen',
      },
      benefits: ['wifi', 'food', 'charging'],
      trackingUrl: 'https://tracking.spothitch.com/sponsor/bk',
    },
  ],

  // Supermarkets near spots
  supermarkets: [
    {
      id: 'carrefour-express',
      name: 'Carrefour Express',
      type: 'supermarket',
      countries: ['FR', 'ES', 'IT', 'BE'],
      logo: '/sponsors/carrefour.png',
      descriptionTemplate: {
        fr: 'Carrefour Express a {distance}m pour faire le plein de provisions',
        en: 'Carrefour Express {distance}m away for supplies',
        es: 'Carrefour Express a {distance}m para provisiones',
        de: 'Carrefour Express {distance}m entfernt fur Vorrate',
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
 * Get sponsored content for a specific spot
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

  // Find relevant sponsors for this country
  const allPartners = [
    ...sponsoredPartners.restAreas,
    ...sponsoredPartners.restaurants,
    ...sponsoredPartners.supermarkets,
  ]

  const relevantPartners = allPartners.filter((partner) =>
    partner.countries.includes(country)
  )

  if (relevantPartners.length === 0) return null

  // For demo: randomly select one partner (in production, use location proximity)
  // This would use actual geolocation to find nearby partners
  const randomPartner =
    relevantPartners[Math.floor(Math.random() * relevantPartners.length)]

  return formatSponsoredContent(
    {
      partner: randomPartner,
      distance: Math.floor(Math.random() * 300) + 50, // 50-350m for demo
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
  const { partner, distance } = sponsorship

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
    logo: partner.logo,
    description,
    benefits: partner.benefits,
    distance,
    trackingUrl: partner.trackingUrl,
    isSponsored: true,
  }
}

/**
 * Generate the HTML for sponsored content in spot description
 * This is designed to be non-intrusive and helpful
 * @param {Object} spot - The spot object
 * @returns {string} HTML string for sponsored content
 */
export function renderSponsoredContent(spot) {
  const sponsored = getSponsoredContentForSpot(spot)
  if (!sponsored) return ''

  const benefitIcons = {
    wifi: '<i class="fas fa-wifi"></i>',
    showers: '<i class="fas fa-shower"></i>',
    food: '<i class="fas fa-utensils"></i>',
    toilets: '<i class="fas fa-restroom"></i>',
    rest_area: '<i class="fas fa-couch"></i>',
    charging: '<i class="fas fa-plug"></i>',
    supplies: '<i class="fas fa-shopping-basket"></i>',
  }

  const benefitsHtml = sponsored.benefits
    .map((b) => benefitIcons[b] || '')
    .filter(Boolean)
    .join(' ')

  return `
    <div class="sponsored-content bg-gray-800/50 rounded-lg p-3 mt-3 border border-gray-700/50"
         data-sponsor-id="${sponsored.id}"
         onclick="window.trackSponsorClick?.('${sponsored.id}')">
      <div class="flex items-start gap-3">
        <div class="flex-1">
          <p class="text-gray-300 text-sm">
            <span class="text-primary-400 font-medium">${sponsored.name}</span> -
            ${sponsored.description}
          </p>
          <div class="flex items-center gap-2 mt-2 text-xs text-gray-400">
            ${benefitsHtml}
            ${sponsored.distance ? `<span class="ml-2">${sponsored.distance}m</span>` : ''}
          </div>
        </div>
      </div>
      <span class="text-[10px] text-gray-500 mt-1 block">Partenaire SpotHitch</span>
    </div>
  `
}

/**
 * Track sponsor click for analytics
 * @param {string} sponsorId - Sponsor ID
 */
export function trackSponsorClick(sponsorId) {
  console.log(`[Sponsor] Click tracked for: ${sponsorId}`)

  // In production, send to analytics
  // analytics.track('sponsor_click', { sponsorId, timestamp: Date.now() })

  // Find the sponsor to get tracking URL
  const allPartners = [
    ...sponsoredPartners.restAreas,
    ...sponsoredPartners.restaurants,
    ...sponsoredPartners.supermarkets,
  ]

  const partner = allPartners.find((p) => p.id === sponsorId)
  if (partner?.trackingUrl) {
    // Track the click (would be sent to tracking server)
    fetch(partner.trackingUrl, {
      method: 'POST',
      body: JSON.stringify({
        sponsorId,
        timestamp: Date.now(),
        action: 'click',
      }),
    }).catch(() => {
      // Silently fail if tracking fails
    })
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
 * Get all available sponsor types
 * @returns {Array} List of sponsor types
 */
export function getSponsorTypes() {
  return ['gas_station', 'fast_food', 'supermarket', 'rest_area', 'cafe']
}

/**
 * Get sponsors by country
 * @param {string} countryCode - ISO country code
 * @returns {Array} List of sponsors for the country
 */
export function getSponsorsByCountry(countryCode) {
  const country = countryCode.toUpperCase()
  const allPartners = [
    ...sponsoredPartners.restAreas,
    ...sponsoredPartners.restaurants,
    ...sponsoredPartners.supermarkets,
  ]

  return allPartners.filter((partner) => partner.countries.includes(country))
}

/**
 * Calculate impression value for sponsors
 * Used for reporting to sponsors
 * @param {string} sponsorId - Sponsor ID
 * @returns {number} Estimated impression value
 */
export function calculateImpressionValue(sponsorId) {
  // Base value per impression in cents
  const baseValue = 0.5
  // Premium multiplier for high-traffic spots
  const premiumMultiplier = 1.5

  // In production, this would use actual impression data
  return baseValue * premiumMultiplier
}

// Expose tracking function globally for onclick handlers
if (typeof window !== 'undefined') {
  window.trackSponsorClick = trackSponsorClick
}

export default {
  getSponsoredContentForSpot,
  renderSponsoredContent,
  trackSponsorClick,
  registerSponsoredSpot,
  getSponsorTypes,
  getSponsorsByCountry,
  calculateImpressionValue,
}
