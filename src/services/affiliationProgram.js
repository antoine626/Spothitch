const AFFILIATE_CATEGORIES = {
  EQUIPMENT: 'equipment',
  TRANSPORT: 'transport',
  ACCOMMODATION: 'accommodation',
  INSURANCE: 'insurance',
  FOOD: 'food',
  APPS: 'apps'
}

const COMMISSION_TIERS = {
  TIER_1: 5,
  TIER_2: 8,
  TIER_3: 10,
  TIER_4: 15
}

const STORAGE_KEY = 'spothitch_affiliation'
const CLICK_STORAGE_KEY = 'spothitch_affiliation_clicks'

const defaultAffiliatePartners = [
  {
    id: 'decathlon-001',
    name: 'Decathlon',
    category: 'equipment',
    url: 'https://www.decathlon.com',
    commission: 8,
    description: 'Sacs à dos, vêtements, équipement outdoor',
    logo: 'https://img.decathlon.com/favicon.png',
    featured: true,
    clicks: 0,
    activeFromDate: '2026-01-01'
  },
  {
    id: 'blablacar-001',
    name: 'BlaBlaCar',
    category: 'transport',
    url: 'https://www.blablacar.com',
    commission: 10,
    description: 'Covoiturage en Europe, trajets confortables',
    logo: 'https://www.blablacar.com/favicon.ico',
    featured: true,
    clicks: 0,
    activeFromDate: '2026-01-01'
  },
  {
    id: 'hostelworld-001',
    name: 'Hostelworld',
    category: 'accommodation',
    url: 'https://www.hostelworld.com',
    commission: 8,
    description: 'Auberges, hostels, logements économiques',
    logo: 'https://www.hostelworld.com/favicon.ico',
    featured: true,
    clicks: 0,
    activeFromDate: '2026-01-01'
  },
  {
    id: 'booking-001',
    name: 'Booking.com',
    category: 'accommodation',
    url: 'https://www.booking.com',
    commission: 5,
    description: 'Réservation hôtels et logements worldwide',
    logo: 'https://www.booking.com/favicon.ico',
    featured: true,
    clicks: 0,
    activeFromDate: '2026-01-01'
  },
  {
    id: 'worldnomads-001',
    name: 'World Nomads',
    category: 'insurance',
    url: 'https://www.worldnomads.com',
    commission: 10,
    description: 'Assurance voyage, couverture globale',
    logo: 'https://www.worldnomads.com/favicon.ico',
    featured: true,
    clicks: 0,
    activeFromDate: '2026-01-01'
  },
  {
    id: 'inreach-001',
    name: 'Garmin inReach',
    category: 'equipment',
    url: 'https://www.garmin.com/en-US/p/590627',
    commission: 8,
    description: 'GPS satellite pour aventures hors réseau',
    logo: 'https://www.garmin.com/favicon.ico',
    featured: false,
    clicks: 0,
    activeFromDate: '2026-01-05'
  },
  {
    id: 'seatgeek-001',
    name: 'SeatGeek',
    category: 'apps',
    url: 'https://seatgeek.com',
    commission: 5,
    description: 'Événements, concerts, spectacles locaux',
    logo: 'https://seatgeek.com/favicon.ico',
    featured: false,
    clicks: 0,
    activeFromDate: '2026-01-10'
  },
  {
    id: 'tripadvisor-001',
    name: 'TripAdvisor',
    category: 'accommodation',
    url: 'https://www.tripadvisor.com',
    commission: 5,
    description: 'Avis, restaurants, attractions touristiques',
    logo: 'https://www.tripadvisor.com/favicon.ico',
    featured: false,
    clicks: 0,
    activeFromDate: '2026-01-01'
  },
  {
    id: 'raileurope-001',
    name: 'Rail Europe',
    category: 'transport',
    url: 'https://www.raileurope.com',
    commission: 8,
    description: 'Pass train Europe, voyages ferroviaires',
    logo: 'https://www.raileurope.com/favicon.ico',
    featured: false,
    clicks: 0,
    activeFromDate: '2026-01-03'
  },
  {
    id: 'airbnb-001',
    name: 'Airbnb',
    category: 'accommodation',
    url: 'https://www.airbnb.com',
    commission: 5,
    description: 'Appartements, maisons, logements privés',
    logo: 'https://www.airbnb.com/favicon.ico',
    featured: false,
    clicks: 0,
    activeFromDate: '2026-01-01'
  },
  {
    id: 'wishlisting-001',
    name: 'Wishlisting',
    category: 'apps',
    url: 'https://wishlisting.com',
    commission: 8,
    description: 'App de liste de voyage, planification',
    logo: 'https://wishlisting.com/favicon.ico',
    featured: false,
    clicks: 0,
    activeFromDate: '2026-01-08'
  },
  {
    id: 'gorillas-001',
    name: 'Gorillas',
    category: 'food',
    url: 'https://gorillas.io',
    commission: 8,
    description: 'Livraison épicerie 10 minutes',
    logo: 'https://gorillas.io/favicon.ico',
    featured: false,
    clicks: 0,
    activeFromDate: '2026-01-12'
  },
  {
    id: 'skyscanner-001',
    name: 'Skyscanner',
    category: 'transport',
    url: 'https://www.skyscanner.com',
    commission: 5,
    description: 'Comparateur vol, train, bus, voiture',
    logo: 'https://www.skyscanner.com/favicon.ico',
    featured: false,
    clicks: 0,
    activeFromDate: '2026-01-01'
  },
  {
    id: 'urbanspoon-001',
    name: 'Urbanspoon',
    category: 'food',
    url: 'https://www.urbanspoon.com',
    commission: 5,
    description: 'Restaurants locaux, réservations dining',
    logo: 'https://www.urbanspoon.com/favicon.ico',
    featured: false,
    clicks: 0,
    activeFromDate: '2026-01-06'
  },
  {
    id: 'kayak-001',
    name: 'Kayak',
    category: 'transport',
    url: 'https://www.kayak.com',
    commission: 5,
    description: 'Recherche vol, hôtel, voiture de location',
    logo: 'https://www.kayak.com/favicon.ico',
    featured: false,
    clicks: 0,
    activeFromDate: '2026-01-07'
  }
]

const getAffiliatePartners = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const partners = JSON.parse(stored)
      return Array.isArray(partners) ? partners : defaultAffiliatePartners
    } catch (e) {
      console.error('Error parsing affiliate partners:', e)
      return defaultAffiliatePartners
    }
  }
  const fresh = JSON.parse(JSON.stringify(defaultAffiliatePartners))
  return fresh
}

const getPartnersByCategory = (category) => {
  const partners = getAffiliatePartners()
  return partners.filter(p => p.category === category)
}

const getPartnerById = (partnerId) => {
  const partners = getAffiliatePartners()
  return partners.find(p => p.id === partnerId)
}

const trackAffiliateClick = (partnerId, userId) => {
  if (!partnerId || !userId) {
    throw new Error('partnerId and userId are required')
  }

  const clicksData = JSON.parse(localStorage.getItem(CLICK_STORAGE_KEY) || '{}')
  const timestamp = new Date().toISOString()

  if (!clicksData[partnerId]) {
    clicksData[partnerId] = []
  }

  clicksData[partnerId].push({
    userId,
    timestamp,
    ip: null
  })

  localStorage.setItem(CLICK_STORAGE_KEY, JSON.stringify(clicksData))

  const partners = getAffiliatePartners()
  const partnerIdx = partners.findIndex(p => p.id === partnerId)
  if (partnerIdx !== -1) {
    partners[partnerIdx].clicks = (partners[partnerIdx].clicks || 0) + 1
    localStorage.setItem(STORAGE_KEY, JSON.stringify(partners))
  }

  return {
    partnerId,
    userId,
    timestamp
  }
}

const getClickStats = (partnerId) => {
  if (!partnerId) {
    throw new Error('partnerId is required')
  }

  const clicksData = JSON.parse(localStorage.getItem(CLICK_STORAGE_KEY) || '{}')
  const clicks = clicksData[partnerId] || []
  const partner = getPartnerById(partnerId)

  return {
    partnerId,
    totalClicks: clicks.length,
    uniqueUsers: new Set(clicks.map(c => c.userId)).size,
    clicks,
    estimatedRevenue: clicks.length * (partner?.commission || 0) * 0.1,
    commissionRate: partner?.commission || 0
  }
}

const getUserClicks = (userId) => {
  if (!userId) {
    throw new Error('userId is required')
  }

  const clicksData = JSON.parse(localStorage.getItem(CLICK_STORAGE_KEY) || '{}')
  const userClicks = []

  Object.entries(clicksData).forEach(([partnerId, clicks]) => {
    const userPartnerClicks = clicks.filter(c => c.userId === userId)
    if (userPartnerClicks.length > 0) {
      const partner = getPartnerById(partnerId)
      userClicks.push({
        partnerId,
        partnerName: partner?.name || 'Unknown',
        clickCount: userPartnerClicks.length,
        lastClick: userPartnerClicks[userPartnerClicks.length - 1].timestamp
      })
    }
  })

  return userClicks.sort((a, b) => new Date(b.lastClick) - new Date(a.lastClick))
}

const generateAffiliateLink = (partnerId, userId) => {
  if (!partnerId || !userId) {
    throw new Error('partnerId and userId are required')
  }

  const partner = getPartnerById(partnerId)
  if (!partner) {
    throw new Error(`Partner not found: ${partnerId}`)
  }

  const baseUrl = partner.url
  const separator = baseUrl.includes('?') ? '&' : '?'
  const affiliateLink = `${baseUrl}${separator}utm_source=spothitch&utm_medium=affiliate&utm_campaign=${partnerId}&utm_content=${userId}`

  trackAffiliateClick(partnerId, userId)

  return affiliateLink
}

const getTopPartners = (limit = 5) => {
  const partners = getAffiliatePartners()
  return partners
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, limit)
}

const getAffiliateRevenue = () => {
  const partners = getAffiliatePartners()
  let totalRevenue = 0
  const breakdown = {}

  partners.forEach(partner => {
    const stats = getClickStats(partner.id)
    breakdown[partner.id] = {
      name: partner.name,
      clicks: stats.totalClicks,
      commission: partner.commission,
      estimatedRevenue: stats.estimatedRevenue
    }
    totalRevenue += stats.estimatedRevenue
  })

  return {
    totalRevenue,
    breakdown
  }
}

const searchPartners = (query) => {
  if (!query || query.length === 0) {
    return []
  }

  const partners = getAffiliatePartners()
  const lowerQuery = query.toLowerCase()

  return partners.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery) ||
    p.category.toLowerCase().includes(lowerQuery)
  )
}

const getFeaturedPartners = () => {
  const partners = getAffiliatePartners()
  return partners.filter(p => p.featured === true)
}

const renderPartnerCard = (partner) => {
  if (!partner) {
    return ''
  }

  return `
    <div class="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-gray-900">${partner.name}</h3>
          <p class="text-xs text-gray-500 mt-1">${partner.category}</p>
        </div>
        <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">${partner.commission}%</span>
      </div>
      <p class="text-sm text-gray-700 mb-3">${partner.description}</p>
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-500">${partner.clicks || 0} clics</span>
        <a
          href="${partner.url}"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Visiter →
        </a>
      </div>
    </div>
  `
}

const renderPartnerList = (partners) => {
  if (!partners || partners.length === 0) {
    return '<p class="text-gray-500">Aucun partenaire trouvé.</p>'
  }

  const cards = partners.map(p => renderPartnerCard(p)).join('')
  return `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${cards}
    </div>
  `
}

const clearAffiliateData = () => {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(CLICK_STORAGE_KEY)
}

export default {
  AFFILIATE_CATEGORIES,
  COMMISSION_TIERS,
  getAffiliatePartners,
  getPartnersByCategory,
  getPartnerById,
  trackAffiliateClick,
  getClickStats,
  getUserClicks,
  generateAffiliateLink,
  getTopPartners,
  getAffiliateRevenue,
  searchPartners,
  getFeaturedPartners,
  renderPartnerCard,
  renderPartnerList,
  clearAffiliateData
}
