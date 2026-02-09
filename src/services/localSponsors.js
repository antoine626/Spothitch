/**
 * Local Sponsors Service
 * Partenariats avec commerces pres des spots (restaurants, hotels, stations)
 * Affichage discret dans la description des spots
 * Feature #236
 */

import { getState } from '../stores/state.js'
import { trackEvent } from './analytics.js'
import { t } from '../i18n/index.js'

/**
 * Sponsor categories
 */
export const SponsorCategory = {
  RESTAURANT: 'restaurant',
  HOTEL: 'hotel',
  HOSTEL: 'hostel',
  STATION: 'station',
  SUPERMARKET: 'supermarket',
  CAMPING: 'camping',
}

/**
 * Benefit types offered by sponsors
 */
export const BenefitType = {
  DISCOUNT: 'discount',
  FREE_WIFI: 'free_wifi',
  FREE_DRINK: 'free_drink',
  FREE_SHOWER: 'free_shower',
  FREE_CHARGE: 'free_charge',
  PRIORITY: 'priority',
  FREE_NIGHT: 'free_night',
  LUGGAGE_STORAGE: 'luggage_storage',
}

/**
 * Local sponsors database by country
 * In production, this would come from Firebase
 */
const localSponsorsDB = {
  FR: [
    {
      id: 'sponsor-fr-001',
      name: 'Auberge du Routard',
      category: SponsorCategory.HOSTEL,
      city: 'Paris',
      region: 'Ile-de-France',
      nearSpotIds: ['spot-paris-peripherique', 'spot-a1-north'],
      logo: '/sponsors/auberge-routard.png',
      description: {
        fr: "Auberge de jeunesse a 500m - -15% pour les autostoppeurs SpotHitch",
        en: "Youth hostel 500m away - 15% off for SpotHitch hitchhikers",
        es: "Albergue juvenil a 500m - 15% de descuento para autoestopistas SpotHitch",
        de: "Jugendherberge 500m entfernt - 15% Rabatt fur SpotHitch-Anhalter",
      },
      benefits: [
        { type: BenefitType.DISCOUNT, value: 15, unit: 'percent' },
        { type: BenefitType.FREE_WIFI },
        { type: BenefitType.LUGGAGE_STORAGE },
      ],
      promoCode: 'SPOTHITCH15',
      validUntil: '2026-12-31',
      website: 'https://auberge-routard.fr',
      phone: '+33 1 23 45 67 89',
      coordinates: { lat: 48.8566, lng: 2.3522 },
      rating: 4.5,
      reviewCount: 234,
      isActive: true,
    },
    {
      id: 'sponsor-fr-002',
      name: 'Cafe de la Route',
      category: SponsorCategory.RESTAURANT,
      city: 'Lyon',
      region: 'Auvergne-Rhone-Alpes',
      nearSpotIds: ['spot-a7-lyon-north', 'spot-a6-lyon-south'],
      logo: '/sponsors/cafe-route.png',
      description: {
        fr: "Cafe-restaurant a 200m - cafe offert aux routards + wifi gratuit",
        en: "Cafe-restaurant 200m away - free coffee for hitchhikers + free wifi",
        es: "Cafe-restaurante a 200m - cafe gratis para autoestopistas + wifi gratis",
        de: "Cafe-Restaurant 200m entfernt - Gratiskaffee fur Anhalter + kostenloses WLAN",
      },
      benefits: [
        { type: BenefitType.FREE_DRINK, value: 'coffee' },
        { type: BenefitType.FREE_WIFI },
        { type: BenefitType.FREE_CHARGE },
      ],
      promoCode: null, // Just show SpotHitch app
      validUntil: '2026-12-31',
      website: null,
      phone: '+33 4 56 78 90 12',
      coordinates: { lat: 45.7640, lng: 4.8357 },
      rating: 4.2,
      reviewCount: 156,
      isActive: true,
    },
    {
      id: 'sponsor-fr-003',
      name: 'Station TotalEnergies A7',
      category: SponsorCategory.STATION,
      city: 'Valence',
      region: 'Auvergne-Rhone-Alpes',
      nearSpotIds: ['spot-a7-valence'],
      logo: '/sponsors/total.png',
      description: {
        fr: "Station service avec douches et espace repos - -10% sur restauration",
        en: "Service station with showers and rest area - 10% off food",
        es: "Estacion de servicio con duchas y area de descanso - 10% de descuento en comida",
        de: "Tankstelle mit Duschen und Rastbereich - 10% Rabatt auf Essen",
      },
      benefits: [
        { type: BenefitType.FREE_SHOWER },
        { type: BenefitType.DISCOUNT, value: 10, unit: 'percent' },
        { type: BenefitType.FREE_WIFI },
      ],
      promoCode: 'HITCHIKE10',
      validUntil: '2026-06-30',
      website: 'https://totalenergies.fr',
      phone: null,
      coordinates: { lat: 44.9333, lng: 4.8917 },
      rating: 3.8,
      reviewCount: 89,
      isActive: true,
    },
  ],
  DE: [
    {
      id: 'sponsor-de-001',
      name: 'Happy Hostel Berlin',
      category: SponsorCategory.HOSTEL,
      city: 'Berlin',
      region: 'Berlin',
      nearSpotIds: ['spot-a10-berlin', 'spot-berlin-ring'],
      logo: '/sponsors/happy-hostel.png',
      description: {
        fr: "Auberge de jeunesse a 800m - 20% de reduction avec SpotHitch",
        en: "Youth hostel 800m away - 20% off with SpotHitch",
        es: "Albergue juvenil a 800m - 20% de descuento con SpotHitch",
        de: "Jugendherberge 800m entfernt - 20% Rabatt mit SpotHitch",
      },
      benefits: [
        { type: BenefitType.DISCOUNT, value: 20, unit: 'percent' },
        { type: BenefitType.FREE_WIFI },
        { type: BenefitType.LUGGAGE_STORAGE },
      ],
      promoCode: 'SPOTHITCH20',
      validUntil: '2026-12-31',
      website: 'https://happy-hostel.de',
      phone: '+49 30 123 456 78',
      coordinates: { lat: 52.5200, lng: 13.4050 },
      rating: 4.6,
      reviewCount: 312,
      isActive: true,
    },
  ],
  ES: [
    {
      id: 'sponsor-es-001',
      name: 'Hostal del Camino',
      category: SponsorCategory.HOSTEL,
      city: 'Barcelona',
      region: 'Cataluna',
      nearSpotIds: ['spot-ap7-barcelona'],
      logo: '/sponsors/hostal-camino.png',
      description: {
        fr: "Hostal economique a 300m - premiere nuit -25% pour autostoppeurs",
        en: "Budget hostel 300m away - first night 25% off for hitchhikers",
        es: "Hostal economico a 300m - primera noche 25% de descuento para autoestopistas",
        de: "Gunstiges Hostel 300m entfernt - erste Nacht 25% Rabatt fur Anhalter",
      },
      benefits: [
        { type: BenefitType.DISCOUNT, value: 25, unit: 'percent' },
        { type: BenefitType.FREE_WIFI },
      ],
      promoCode: 'HITCH25',
      validUntil: '2026-12-31',
      website: 'https://hostaldelcamino.es',
      phone: '+34 93 123 45 67',
      coordinates: { lat: 41.3851, lng: 2.1734 },
      rating: 4.3,
      reviewCount: 198,
      isActive: true,
    },
  ],
}

/**
 * Get local sponsors for a specific spot
 * @param {string} spotId - The spot ID
 * @param {string} country - Country code (FR, DE, ES, etc.)
 * @returns {Array} List of sponsors near the spot
 */
export function getSponsorsForSpot(spotId, country) {
  if (!spotId || !country) return []

  const countrySponsors = localSponsorsDB[country.toUpperCase()] || []
  return countrySponsors.filter(
    (sponsor) => sponsor.isActive && sponsor.nearSpotIds.includes(spotId)
  )
}

/**
 * Get sponsors by country
 * @param {string} country - Country code
 * @param {string} category - Optional category filter
 * @returns {Array} List of sponsors
 */
export function getSponsorsByCountry(country, category = null) {
  const countrySponsors = localSponsorsDB[country.toUpperCase()] || []
  const activeSponsors = countrySponsors.filter((s) => s.isActive)

  if (category) {
    return activeSponsors.filter((s) => s.category === category)
  }
  return activeSponsors
}

/**
 * Get sponsors by category
 * @param {string} category - Category from SponsorCategory
 * @returns {Array} List of sponsors in this category
 */
export function getSponsorsByCategory(category) {
  const allSponsors = Object.values(localSponsorsDB).flat()
  return allSponsors.filter((s) => s.isActive && s.category === category)
}

/**
 * Get sponsor by ID
 * @param {string} sponsorId - Sponsor ID
 * @returns {Object|null} Sponsor or null
 */
export function getSponsorById(sponsorId) {
  const allSponsors = Object.values(localSponsorsDB).flat()
  return allSponsors.find((s) => s.id === sponsorId) || null
}

/**
 * Get sponsors near a location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radiusKm - Search radius in kilometers
 * @returns {Array} List of nearby sponsors
 */
export function getSponsorsNearLocation(lat, lng, radiusKm = 5) {
  const allSponsors = Object.values(localSponsorsDB).flat()
  const activeSponsors = allSponsors.filter((s) => s.isActive)

  return activeSponsors
    .map((sponsor) => {
      const distance = calculateDistance(lat, lng, sponsor.coordinates.lat, sponsor.coordinates.lng)
      return { ...sponsor, distance }
    })
    .filter((s) => s.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
}

/**
 * Calculate distance between two points in km
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg) {
  return deg * (Math.PI / 180)
}

/**
 * Format sponsor benefits as text
 * @param {Array} benefits - Sponsor benefits
 * @returns {string} Formatted benefits text
 */
export function formatBenefits(benefits) {
  const state = getState()
  const lang = state.lang || 'fr'

  return benefits
    .map((benefit) => {
      switch (benefit.type) {
        case BenefitType.DISCOUNT:
          return t('benefitDiscount', { value: benefit.value })
        case BenefitType.FREE_WIFI:
          return t('benefitFreeWifi')
        case BenefitType.FREE_DRINK:
          return t('benefitFreeDrink', { drink: benefit.value || 'drink' })
        case BenefitType.FREE_SHOWER:
          return t('benefitFreeShower')
        case BenefitType.FREE_CHARGE:
          return t('benefitFreeCharge')
        case BenefitType.PRIORITY:
          return t('benefitPriority')
        case BenefitType.FREE_NIGHT:
          return t('benefitFreeNight')
        case BenefitType.LUGGAGE_STORAGE:
          return t('benefitLuggageStorage')
        default:
          return benefit.type
      }
    })
    .join(' | ')
}

/**
 * Get category icon
 * @param {string} category - Sponsor category
 * @returns {string} FontAwesome icon class
 */
export function getCategoryIcon(category) {
  const icons = {
    [SponsorCategory.RESTAURANT]: 'fa-utensils',
    [SponsorCategory.HOTEL]: 'fa-hotel',
    [SponsorCategory.HOSTEL]: 'fa-bed',
    [SponsorCategory.STATION]: 'fa-gas-pump',
    [SponsorCategory.SUPERMARKET]: 'fa-shopping-cart',
    [SponsorCategory.CAMPING]: 'fa-campground',
  }
  return icons[category] || 'fa-store'
}

/**
 * Get category label
 * @param {string} category - Sponsor category
 * @returns {string} Localized category label
 */
export function getCategoryLabel(category) {
  return t(`sponsorCategory${category.charAt(0).toUpperCase() + category.slice(1)}`)
}

/**
 * Get benefit icon
 * @param {string} benefitType - Benefit type
 * @returns {string} FontAwesome icon class
 */
export function getBenefitIcon(benefitType) {
  const icons = {
    [BenefitType.DISCOUNT]: 'fa-percent',
    [BenefitType.FREE_WIFI]: 'fa-wifi',
    [BenefitType.FREE_DRINK]: 'fa-coffee',
    [BenefitType.FREE_SHOWER]: 'fa-shower',
    [BenefitType.FREE_CHARGE]: 'fa-plug',
    [BenefitType.PRIORITY]: 'fa-star',
    [BenefitType.FREE_NIGHT]: 'fa-moon',
    [BenefitType.LUGGAGE_STORAGE]: 'fa-suitcase',
  }
  return icons[benefitType] || 'fa-gift'
}

/**
 * Track sponsor view
 * @param {string} sponsorId - Sponsor ID
 */
export function trackSponsorView(sponsorId) {
  const sponsor = getSponsorById(sponsorId)
  if (!sponsor) return

  trackEvent('local_sponsor_view', {
    sponsor_id: sponsorId,
    sponsor_name: sponsor.name,
    sponsor_category: sponsor.category,
    sponsor_city: sponsor.city,
  })
}

/**
 * Track sponsor click/interaction
 * @param {string} sponsorId - Sponsor ID
 * @param {string} action - Action type (website, phone, promo_copy)
 */
export function trackSponsorClick(sponsorId, action) {
  const sponsor = getSponsorById(sponsorId)
  if (!sponsor) return

  trackEvent('local_sponsor_click', {
    sponsor_id: sponsorId,
    sponsor_name: sponsor.name,
    action,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Track promo code usage
 * @param {string} sponsorId - Sponsor ID
 * @param {string} promoCode - Promo code used
 */
export function trackPromoCodeUsed(sponsorId, promoCode) {
  const sponsor = getSponsorById(sponsorId)
  if (!sponsor) return

  trackEvent('local_sponsor_promo_used', {
    sponsor_id: sponsorId,
    sponsor_name: sponsor.name,
    promo_code: promoCode,
  })
}

/**
 * Render sponsor banner HTML (for spot description)
 * Non-intrusive, helpful display
 * @param {Object} sponsor - Sponsor object
 * @returns {string} HTML string
 */
export function renderSponsorBanner(sponsor) {
  if (!sponsor || !sponsor.isActive) return ''

  const state = getState()
  const lang = state.lang || 'fr'
  const description = sponsor.description[lang] || sponsor.description.en || sponsor.description.fr

  const benefitIcons = sponsor.benefits
    .map((b) => `<i class="fas ${getBenefitIcon(b.type)}" title="${formatBenefitTooltip(b)}"></i>`)
    .join(' ')

  return `
    <div class="local-sponsor-banner rounded-lg p-3 mt-3 border border-green-500/30 bg-gradient-to-r from-green-900/20 to-green-800/10 hover:border-green-500/50 transition-colors"
         data-sponsor-id="${sponsor.id}"
         role="article"
         aria-label="${t('localPartner')}: ${sponsor.name}"
         onclick="window.openSponsorDetail?.('${sponsor.id}')">
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <span class="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-green-500/20 text-green-400">
            <i class="fas ${getCategoryIcon(sponsor.category)}"></i>
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-2 flex-wrap">
            <p class="text-sm font-semibold text-white">${sponsor.name}</p>
            <span class="text-xs text-green-400">${getCategoryLabel(sponsor.category)}</span>
          </div>
          <p class="text-sm text-gray-300 mt-1">${description}</p>
          <div class="flex items-center gap-2 mt-2 text-xs text-gray-400">
            ${benefitIcons}
            ${sponsor.promoCode ? `
              <button onclick="event.stopPropagation(); window.copySponsorPromo?.('${sponsor.id}', '${sponsor.promoCode}')"
                class="ml-auto text-green-400 hover:text-green-300 font-medium flex items-center gap-1">
                <i class="fas fa-tag"></i>
                <span>${sponsor.promoCode}</span>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
      <div class="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-xs text-gray-500">
        <span><i class="fas fa-handshake mr-1"></i>${t('verifiedPartner')}</span>
        <span>${t('tapForDetails')}</span>
      </div>
    </div>
  `
}

/**
 * Format benefit tooltip
 */
function formatBenefitTooltip(benefit) {
  if (benefit.type === BenefitType.DISCOUNT) {
    return `${benefit.value}% ${t('discount')}`
  }
  return t(`benefit${benefit.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`)
}

/**
 * Render sponsor list HTML (for nearby sponsors section)
 * @param {Array} sponsors - List of sponsors
 * @returns {string} HTML string
 */
export function renderSponsorList(sponsors) {
  if (!sponsors || sponsors.length === 0) {
    return `
      <div class="text-center py-4 text-gray-400">
        <i class="fas fa-store-slash text-2xl mb-2"></i>
        <p>${t('noLocalSponsors')}</p>
      </div>
    `
  }

  return `
    <div class="space-y-3">
      ${sponsors.map((sponsor) => renderSponsorBanner(sponsor)).join('')}
    </div>
  `
}

/**
 * Render sponsor detail modal HTML
 * @param {string} sponsorId - Sponsor ID
 * @returns {string} HTML string
 */
export function renderSponsorDetail(sponsorId) {
  const sponsor = getSponsorById(sponsorId)
  if (!sponsor) return ''

  const state = getState()
  const lang = state.lang || 'fr'
  const description = sponsor.description[lang] || sponsor.description.en

  trackSponsorView(sponsorId)

  return `
    <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
         onclick="if(event.target === this) window.closeSponsorDetail?.()"
         role="dialog"
         aria-modal="true"
         aria-labelledby="sponsor-modal-title">
      <div class="bg-dark-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="sticky top-0 bg-dark-800 p-4 border-b border-dark-600 flex items-center justify-between">
          <h2 id="sponsor-modal-title" class="text-xl font-bold text-white flex items-center gap-2">
            <i class="fas ${getCategoryIcon(sponsor.category)} text-green-400"></i>
            ${sponsor.name}
          </h2>
          <button onclick="window.closeSponsorDetail?.()"
            class="text-gray-400 hover:text-white"
            aria-label="${t('close')}">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <div class="p-4 space-y-4">
          <!-- Location -->
          <div class="flex items-center gap-2 text-gray-400">
            <i class="fas fa-map-marker-alt"></i>
            <span>${sponsor.city}, ${sponsor.region}</span>
          </div>

          <!-- Rating -->
          <div class="flex items-center gap-2">
            <div class="flex items-center text-yellow-400">
              ${Array.from({ length: 5 }, (_, i) =>
                `<i class="fas fa-star${i < Math.floor(sponsor.rating) ? '' : '-half-alt text-gray-500'}"></i>`
              ).join('')}
            </div>
            <span class="text-white">${sponsor.rating}</span>
            <span class="text-gray-400">(${sponsor.reviewCount} ${t('reviews')})</span>
          </div>

          <!-- Description -->
          <div class="bg-dark-700 rounded-lg p-3">
            <p class="text-gray-300">${description}</p>
          </div>

          <!-- Benefits -->
          <div>
            <h3 class="font-semibold text-white mb-2">${t('sponsorBenefits')}</h3>
            <div class="grid grid-cols-2 gap-2">
              ${sponsor.benefits.map((benefit) => `
                <div class="flex items-center gap-2 bg-green-500/10 rounded-lg p-2 text-green-400">
                  <i class="fas ${getBenefitIcon(benefit.type)}"></i>
                  <span class="text-sm">${formatBenefitLabel(benefit)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Promo Code -->
          ${sponsor.promoCode ? `
            <div class="bg-gradient-to-r from-green-500/20 to-green-600/10 rounded-lg p-4 border border-green-500/30">
              <p class="text-sm text-gray-400 mb-2">${t('promoCode')}</p>
              <div class="flex items-center justify-between">
                <span class="font-mono text-xl font-bold text-green-400">${sponsor.promoCode}</span>
                <button onclick="window.copySponsorPromo?.('${sponsor.id}', '${sponsor.promoCode}')"
                  class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm">
                  <i class="fas fa-copy mr-1"></i>${t('copy')}
                </button>
              </div>
              <p class="text-xs text-gray-500 mt-2">${t('validUntil')} ${new Date(sponsor.validUntil).toLocaleDateString()}</p>
            </div>
          ` : ''}

          <!-- Contact -->
          <div class="flex gap-2">
            ${sponsor.website ? `
              <button onclick="window.open('${sponsor.website}', '_blank'); window.trackSponsorClick?.('${sponsor.id}', 'website')"
                class="flex-1 bg-primary hover:bg-primary/80 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                <i class="fas fa-globe"></i>
                <span>${t('visitWebsite')}</span>
              </button>
            ` : ''}
            ${sponsor.phone ? `
              <button onclick="window.open('tel:${sponsor.phone}'); window.trackSponsorClick?.('${sponsor.id}', 'phone')"
                class="flex-1 bg-dark-600 hover:bg-dark-500 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                <i class="fas fa-phone"></i>
                <span>${t('call')}</span>
              </button>
            ` : ''}
          </div>

          <!-- Verified partner note -->
          <div class="text-center text-xs text-gray-500 pt-2 border-t border-dark-600">
            <i class="fas fa-check-circle text-green-400 mr-1"></i>
            ${t('verifiedPartnerNote')}
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Format benefit label
 */
function formatBenefitLabel(benefit) {
  if (benefit.type === BenefitType.DISCOUNT) {
    return `-${benefit.value}%`
  }
  if (benefit.type === BenefitType.FREE_DRINK) {
    return t('freeDrink')
  }
  return t(`benefit${benefit.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`)
}

/**
 * Copy sponsor promo code
 * @param {string} sponsorId - Sponsor ID
 * @param {string} promoCode - Promo code
 */
export function copySponsorPromo(sponsorId, promoCode) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(promoCode)
  } else {
    const textarea = document.createElement('textarea')
    textarea.value = promoCode
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }

  const { showToast } = require('./notifications.js')
  showToast(t('promoCodeCopied'), 'success')
  trackPromoCodeUsed(sponsorId, promoCode)
}

/**
 * Get all available categories
 * @returns {Array} List of categories
 */
export function getAvailableCategories() {
  return Object.values(SponsorCategory)
}

/**
 * Get all available benefit types
 * @returns {Array} List of benefit types
 */
export function getAvailableBenefitTypes() {
  return Object.values(BenefitType)
}

/**
 * Check if there are sponsors in a country
 * @param {string} country - Country code
 * @returns {boolean} Whether sponsors exist
 */
export function hasSponsorsInCountry(country) {
  const sponsors = localSponsorsDB[country.toUpperCase()]
  if (!sponsors) return false
  return sponsors.some((s) => s.isActive)
}

// Expose functions globally for onclick handlers
if (typeof window !== 'undefined') {
  window.openSponsorDetail = (sponsorId) => {
    const html = renderSponsorDetail(sponsorId)
    const container = document.getElementById('modal-container')
    if (container) {
      container.innerHTML = html
    }
  }
  window.closeSponsorDetail = () => {
    const container = document.getElementById('modal-container')
    if (container) {
      container.innerHTML = ''
    }
  }
  window.copySponsorPromo = copySponsorPromo
  window.trackSponsorClick = trackSponsorClick
}

export default {
  SponsorCategory,
  BenefitType,
  getSponsorsForSpot,
  getSponsorsByCountry,
  getSponsorsByCategory,
  getSponsorById,
  getSponsorsNearLocation,
  formatBenefits,
  getCategoryIcon,
  getCategoryLabel,
  getBenefitIcon,
  trackSponsorView,
  trackSponsorClick,
  trackPromoCodeUsed,
  renderSponsorBanner,
  renderSponsorList,
  renderSponsorDetail,
  copySponsorPromo,
  getAvailableCategories,
  getAvailableBenefitTypes,
  hasSponsorsInCountry,
}
