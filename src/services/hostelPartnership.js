/**
 * Hostel Partnership Service
 * Feature #238 - Partenariats avec auberges de jeunesse
 *
 * Partner hostels offer 10-20% discount to SpotHitch users.
 * Discount codes are unique per user and expire after 30 days.
 */

import { getState, setState } from '../stores/state.js'
import { trackEvent } from './analytics.js'

// Storage key for discount codes
const STORAGE_KEY = 'spothitch_hostel_codes'

// Discount code expiration in days
const CODE_EXPIRATION_DAYS = 30

/**
 * Partner hostels database
 * In production, this would come from Firebase
 */
const partnerHostels = {
  // France
  FR: [
    {
      id: 'hostel-fr-001',
      name: 'Le Routard Paris',
      city: 'Paris',
      country: 'FR',
      address: '12 Rue du Faubourg Saint-Denis, 75010 Paris',
      coordinates: { lat: 48.8722, lng: 2.3542 },
      nearSpotIds: ['spot-paris-nord', 'spot-paris-peripherique', 'spot-a1-north'],
      description: {
        fr: 'Auberge de jeunesse au coeur de Paris, ambiance routard garantie',
        en: 'Youth hostel in the heart of Paris, hitchhiker vibes guaranteed',
        es: 'Albergue juvenil en el corazon de Paris, ambiente mochilero garantizado',
        de: 'Jugendherberge im Herzen von Paris, Tramper-Atmosphare garantiert',
      },
      discount: 15,
      amenities: ['wifi', 'kitchen', 'lounge', 'lockers', 'laundry', 'bar'],
      priceRange: { min: 25, max: 45, currency: 'EUR' },
      rating: 4.5,
      reviewCount: 234,
      reviews: [],
      photos: ['/hostels/routard-paris-1.jpg', '/hostels/routard-paris-2.jpg'],
      bookingUrl: 'https://leroutard-paris.com/book',
      phone: '+33 1 42 46 22 10',
      email: 'contact@leroutard-paris.com',
      checkIn: '15:00',
      checkOut: '11:00',
      isActive: true,
      partnerSince: '2025-01-01',
    },
    {
      id: 'hostel-fr-002',
      name: 'Auberge de Lyon',
      city: 'Lyon',
      country: 'FR',
      address: '45 Quai Rambaud, 69002 Lyon',
      coordinates: { lat: 45.7485, lng: 4.8138 },
      nearSpotIds: ['spot-a7-lyon-north', 'spot-a6-lyon-south'],
      description: {
        fr: 'Auberge moderne sur les quais de la Saone, parfait pour les routards',
        en: 'Modern hostel on the Saone riverbank, perfect for hitchhikers',
        es: 'Albergue moderno en los muelles del Saona, perfecto para autoestopistas',
        de: 'Modernes Hostel am Saone-Ufer, perfekt fur Tramper',
      },
      discount: 12,
      amenities: ['wifi', 'kitchen', 'terrace', 'lockers', 'bikes'],
      priceRange: { min: 22, max: 38, currency: 'EUR' },
      rating: 4.3,
      reviewCount: 156,
      reviews: [],
      photos: ['/hostels/auberge-lyon-1.jpg'],
      bookingUrl: 'https://auberge-lyon.fr/book',
      phone: '+33 4 78 92 51 00',
      email: 'info@auberge-lyon.fr',
      checkIn: '14:00',
      checkOut: '10:00',
      isActive: true,
      partnerSince: '2025-03-15',
    },
    {
      id: 'hostel-fr-003',
      name: 'Hostel du Soleil',
      city: 'Marseille',
      country: 'FR',
      address: '8 Rue de la Republique, 13001 Marseille',
      coordinates: { lat: 43.2965, lng: 5.3698 },
      nearSpotIds: ['spot-a7-marseille', 'spot-marseille-nord'],
      description: {
        fr: 'Auberge ensoleille pres du Vieux-Port, ideal pour decouvrir le sud',
        en: 'Sunny hostel near the Old Port, ideal for discovering the south',
        es: 'Albergue soleado cerca del Puerto Viejo, ideal para descubrir el sur',
        de: 'Sonniges Hostel nahe dem Alten Hafen, ideal um den Suden zu entdecken',
      },
      discount: 10,
      amenities: ['wifi', 'kitchen', 'terrace', 'lockers', 'breakfast'],
      priceRange: { min: 20, max: 35, currency: 'EUR' },
      rating: 4.1,
      reviewCount: 89,
      reviews: [],
      photos: ['/hostels/hostel-soleil-1.jpg'],
      bookingUrl: 'https://hosteldusoleil.fr/book',
      phone: '+33 4 91 54 00 00',
      email: 'contact@hosteldusoleil.fr',
      checkIn: '15:00',
      checkOut: '11:00',
      isActive: true,
      partnerSince: '2025-06-01',
    },
  ],
  // Germany
  DE: [
    {
      id: 'hostel-de-001',
      name: 'Berlin Backpackers',
      city: 'Berlin',
      country: 'DE',
      address: 'Chausseestrasse 102, 10115 Berlin',
      coordinates: { lat: 52.5318, lng: 13.3836 },
      nearSpotIds: ['spot-a10-berlin', 'spot-berlin-ring'],
      description: {
        fr: 'Le meilleur hostel de Berlin pour les vrais backpackers',
        en: 'The best hostel in Berlin for real backpackers',
        es: 'El mejor hostal de Berlin para mochileros de verdad',
        de: 'Das beste Hostel in Berlin fur echte Rucksacktouristen',
      },
      discount: 20,
      amenities: ['wifi', 'kitchen', 'bar', 'lounge', 'lockers', 'events'],
      priceRange: { min: 18, max: 40, currency: 'EUR' },
      rating: 4.7,
      reviewCount: 456,
      reviews: [],
      photos: ['/hostels/berlin-backpackers-1.jpg', '/hostels/berlin-backpackers-2.jpg'],
      bookingUrl: 'https://berlin-backpackers.de/book',
      phone: '+49 30 2839 0965',
      email: 'hello@berlin-backpackers.de',
      checkIn: '14:00',
      checkOut: '11:00',
      isActive: true,
      partnerSince: '2025-02-01',
    },
    {
      id: 'hostel-de-002',
      name: 'Munich Meininger',
      city: 'Munich',
      country: 'DE',
      address: 'Landsberger Strasse 20, 80339 Munich',
      coordinates: { lat: 48.1394, lng: 11.5461 },
      nearSpotIds: ['spot-a8-munich', 'spot-munich-sud'],
      description: {
        fr: 'Hostel moderne et propre, pres de la gare centrale',
        en: 'Modern and clean hostel, close to the central station',
        es: 'Hostal moderno y limpio, cerca de la estacion central',
        de: 'Modernes und sauberes Hostel, nahe dem Hauptbahnhof',
      },
      discount: 15,
      amenities: ['wifi', 'kitchen', 'lounge', 'lockers', 'laundry', 'breakfast'],
      priceRange: { min: 22, max: 48, currency: 'EUR' },
      rating: 4.4,
      reviewCount: 312,
      reviews: [],
      photos: ['/hostels/munich-meininger-1.jpg'],
      bookingUrl: 'https://meininger-hotels.com/munich',
      phone: '+49 89 5450 9820',
      email: 'munich@meininger-hotels.com',
      checkIn: '15:00',
      checkOut: '10:00',
      isActive: true,
      partnerSince: '2025-04-01',
    },
  ],
  // Spain
  ES: [
    {
      id: 'hostel-es-001',
      name: 'Barcelona Beach Hostel',
      city: 'Barcelona',
      country: 'ES',
      address: 'Carrer de la Marina 19, 08005 Barcelona',
      coordinates: { lat: 41.3851, lng: 2.1946 },
      nearSpotIds: ['spot-ap7-barcelona', 'spot-barcelona-nord'],
      description: {
        fr: 'Hostel a deux pas de la plage, ambiance festive',
        en: 'Hostel steps from the beach, party atmosphere',
        es: 'Hostal a dos pasos de la playa, ambiente festivo',
        de: 'Hostel nur Schritte vom Strand entfernt, Party-Atmosphare',
      },
      discount: 18,
      amenities: ['wifi', 'kitchen', 'terrace', 'bar', 'lockers', 'events'],
      priceRange: { min: 20, max: 42, currency: 'EUR' },
      rating: 4.6,
      reviewCount: 523,
      reviews: [],
      photos: ['/hostels/barcelona-beach-1.jpg', '/hostels/barcelona-beach-2.jpg'],
      bookingUrl: 'https://barcelona-beach-hostel.com/book',
      phone: '+34 93 221 0808',
      email: 'info@barcelona-beach-hostel.com',
      checkIn: '14:00',
      checkOut: '11:00',
      isActive: true,
      partnerSince: '2025-01-15',
    },
    {
      id: 'hostel-es-002',
      name: 'Madrid Central Hostel',
      city: 'Madrid',
      country: 'ES',
      address: 'Calle de Atocha 45, 28012 Madrid',
      coordinates: { lat: 40.4115, lng: -3.6957 },
      nearSpotIds: ['spot-a1-madrid', 'spot-madrid-sur'],
      description: {
        fr: 'Hostel central et convivial, parfait pour explorer Madrid',
        en: 'Central and friendly hostel, perfect for exploring Madrid',
        es: 'Hostal centrico y acogedor, perfecto para explorar Madrid',
        de: 'Zentrales und freundliches Hostel, perfekt um Madrid zu erkunden',
      },
      discount: 15,
      amenities: ['wifi', 'kitchen', 'lounge', 'lockers', 'tours'],
      priceRange: { min: 18, max: 35, currency: 'EUR' },
      rating: 4.4,
      reviewCount: 287,
      reviews: [],
      photos: ['/hostels/madrid-central-1.jpg'],
      bookingUrl: 'https://madrid-central-hostel.com/book',
      phone: '+34 91 429 3100',
      email: 'reservas@madrid-central-hostel.com',
      checkIn: '15:00',
      checkOut: '11:00',
      isActive: true,
      partnerSince: '2025-05-01',
    },
  ],
  // Netherlands
  NL: [
    {
      id: 'hostel-nl-001',
      name: 'Amsterdam Flying Pig',
      city: 'Amsterdam',
      country: 'NL',
      address: 'Nieuwendijk 100, 1012 MR Amsterdam',
      coordinates: { lat: 52.3767, lng: 4.8973 },
      nearSpotIds: ['spot-a10-amsterdam', 'spot-amsterdam-ring'],
      description: {
        fr: 'Hostel legendaire au coeur d\'Amsterdam, ambiance unique',
        en: 'Legendary hostel in the heart of Amsterdam, unique atmosphere',
        es: 'Hostal legendario en el corazon de Amsterdam, ambiente unico',
        de: 'Legendares Hostel im Herzen von Amsterdam, einzigartige Atmosphare',
      },
      discount: 12,
      amenities: ['wifi', 'kitchen', 'bar', 'lounge', 'lockers', 'tours'],
      priceRange: { min: 28, max: 55, currency: 'EUR' },
      rating: 4.5,
      reviewCount: 678,
      reviews: [],
      photos: ['/hostels/flying-pig-1.jpg', '/hostels/flying-pig-2.jpg'],
      bookingUrl: 'https://flyingpig.nl/book',
      phone: '+31 20 420 6822',
      email: 'downtown@flyingpig.nl',
      checkIn: '14:00',
      checkOut: '10:00',
      isActive: true,
      partnerSince: '2025-02-15',
    },
  ],
  // Portugal
  PT: [
    {
      id: 'hostel-pt-001',
      name: 'Lisbon Surf House',
      city: 'Lisbon',
      country: 'PT',
      address: 'Rua da Madalena 98, 1100-321 Lisboa',
      coordinates: { lat: 38.7097, lng: -9.1337 },
      nearSpotIds: ['spot-a1-lisbon', 'spot-lisbon-norte'],
      description: {
        fr: 'Hostel surf-style au coeur de Lisbonne, parfait pour les aventuriers',
        en: 'Surf-style hostel in the heart of Lisbon, perfect for adventurers',
        es: 'Hostal estilo surf en el corazon de Lisboa, perfecto para aventureros',
        de: 'Surf-Style Hostel im Herzen von Lissabon, perfekt fur Abenteurer',
      },
      discount: 15,
      amenities: ['wifi', 'kitchen', 'terrace', 'surfboards', 'lockers', 'breakfast'],
      priceRange: { min: 16, max: 35, currency: 'EUR' },
      rating: 4.6,
      reviewCount: 345,
      reviews: [],
      photos: ['/hostels/lisbon-surf-1.jpg'],
      bookingUrl: 'https://lisbon-surfhouse.pt/book',
      phone: '+351 21 888 0000',
      email: 'info@lisbon-surfhouse.pt',
      checkIn: '14:00',
      checkOut: '11:00',
      isActive: true,
      partnerSince: '2025-03-01',
    },
  ],
  // Italy
  IT: [
    {
      id: 'hostel-it-001',
      name: 'Roma Termini Hostel',
      city: 'Rome',
      country: 'IT',
      address: 'Via Marsala 22, 00185 Roma',
      coordinates: { lat: 41.9012, lng: 12.5026 },
      nearSpotIds: ['spot-a1-rome', 'spot-rome-nord'],
      description: {
        fr: 'Hostel pratique pres de la gare Termini, ideal pour explorer Rome',
        en: 'Convenient hostel near Termini station, ideal for exploring Rome',
        es: 'Hostal practico cerca de la estacion Termini, ideal para explorar Roma',
        de: 'Praktisches Hostel nahe dem Bahnhof Termini, ideal um Rom zu erkunden',
      },
      discount: 10,
      amenities: ['wifi', 'kitchen', 'lounge', 'lockers', 'tours', 'breakfast'],
      priceRange: { min: 20, max: 45, currency: 'EUR' },
      rating: 4.2,
      reviewCount: 234,
      reviews: [],
      photos: ['/hostels/roma-termini-1.jpg'],
      bookingUrl: 'https://roma-termini-hostel.it/book',
      phone: '+39 06 4470 0000',
      email: 'info@roma-termini-hostel.it',
      checkIn: '14:00',
      checkOut: '10:00',
      isActive: true,
      partnerSince: '2025-04-15',
    },
  ],
}

/**
 * Translations for hostel partnership
 */
const translations = {
  fr: {
    partnerHostel: 'Auberge partenaire',
    discountLabel: 'Reduction SpotHitch',
    bookNow: 'Reserver maintenant',
    generateCode: 'Obtenir mon code promo',
    codeGenerated: 'Code promo genere !',
    codeCopied: 'Code copie !',
    codeExpires: 'Expire le',
    discountApplied: 'Reduction appliquee',
    noHostelsFound: 'Aucune auberge partenaire trouvee',
    nearYou: 'Pres de vous',
    inCity: 'A {city}',
    fromPrice: 'A partir de',
    perNight: '/nuit',
    amenities: 'Equipements',
    reviews: 'avis',
    checkIn: 'Arrivee',
    checkOut: 'Depart',
    seeDetails: 'Voir les details',
    exclusive: 'Offre exclusive',
    verified: 'Partenaire verifie',
    codeInvalid: 'Code invalide ou expire',
    codeAlreadyUsed: 'Code deja utilise',
    codeRedeemed: 'Code utilise avec succes !',
    loginRequired: 'Connexion requise pour generer un code',
    addReview: 'Laisser un avis',
    yourRating: 'Votre note',
    yourReview: 'Votre avis',
    submitReview: 'Envoyer',
    reviewAdded: 'Avis ajoute !',
    discountBanner: '{discount}% de reduction pour les utilisateurs SpotHitch',
    wifi: 'Wifi',
    kitchen: 'Cuisine',
    lounge: 'Salon',
    lockers: 'Casiers',
    laundry: 'Laverie',
    bar: 'Bar',
    terrace: 'Terrasse',
    bikes: 'Velos',
    breakfast: 'Petit-dejeuner',
    events: 'Evenements',
    tours: 'Visites',
    surfboards: 'Planches de surf',
  },
  en: {
    partnerHostel: 'Partner Hostel',
    discountLabel: 'SpotHitch Discount',
    bookNow: 'Book Now',
    generateCode: 'Get my promo code',
    codeGenerated: 'Promo code generated!',
    codeCopied: 'Code copied!',
    codeExpires: 'Expires on',
    discountApplied: 'Discount applied',
    noHostelsFound: 'No partner hostels found',
    nearYou: 'Near you',
    inCity: 'In {city}',
    fromPrice: 'From',
    perNight: '/night',
    amenities: 'Amenities',
    reviews: 'reviews',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    seeDetails: 'See details',
    exclusive: 'Exclusive offer',
    verified: 'Verified partner',
    codeInvalid: 'Invalid or expired code',
    codeAlreadyUsed: 'Code already used',
    codeRedeemed: 'Code redeemed successfully!',
    loginRequired: 'Login required to generate a code',
    addReview: 'Leave a review',
    yourRating: 'Your rating',
    yourReview: 'Your review',
    submitReview: 'Submit',
    reviewAdded: 'Review added!',
    discountBanner: '{discount}% off for SpotHitch users',
    wifi: 'Wifi',
    kitchen: 'Kitchen',
    lounge: 'Lounge',
    lockers: 'Lockers',
    laundry: 'Laundry',
    bar: 'Bar',
    terrace: 'Terrace',
    bikes: 'Bikes',
    breakfast: 'Breakfast',
    events: 'Events',
    tours: 'Tours',
    surfboards: 'Surfboards',
  },
  es: {
    partnerHostel: 'Albergue asociado',
    discountLabel: 'Descuento SpotHitch',
    bookNow: 'Reservar ahora',
    generateCode: 'Obtener mi codigo promo',
    codeGenerated: 'Codigo promocional generado!',
    codeCopied: 'Codigo copiado!',
    codeExpires: 'Expira el',
    discountApplied: 'Descuento aplicado',
    noHostelsFound: 'No se encontraron albergues asociados',
    nearYou: 'Cerca de ti',
    inCity: 'En {city}',
    fromPrice: 'Desde',
    perNight: '/noche',
    amenities: 'Servicios',
    reviews: 'opiniones',
    checkIn: 'Llegada',
    checkOut: 'Salida',
    seeDetails: 'Ver detalles',
    exclusive: 'Oferta exclusiva',
    verified: 'Socio verificado',
    codeInvalid: 'Codigo invalido o expirado',
    codeAlreadyUsed: 'Codigo ya utilizado',
    codeRedeemed: 'Codigo canjeado con exito!',
    loginRequired: 'Inicio de sesion requerido para generar un codigo',
    addReview: 'Dejar una opinion',
    yourRating: 'Tu puntuacion',
    yourReview: 'Tu opinion',
    submitReview: 'Enviar',
    reviewAdded: 'Opinion anadida!',
    discountBanner: '{discount}% de descuento para usuarios de SpotHitch',
    wifi: 'Wifi',
    kitchen: 'Cocina',
    lounge: 'Sala',
    lockers: 'Taquillas',
    laundry: 'Lavanderia',
    bar: 'Bar',
    terrace: 'Terraza',
    bikes: 'Bicicletas',
    breakfast: 'Desayuno',
    events: 'Eventos',
    tours: 'Tours',
    surfboards: 'Tablas de surf',
  },
  de: {
    partnerHostel: 'Partner-Hostel',
    discountLabel: 'SpotHitch-Rabatt',
    bookNow: 'Jetzt buchen',
    generateCode: 'Meinen Promo-Code erhalten',
    codeGenerated: 'Promo-Code generiert!',
    codeCopied: 'Code kopiert!',
    codeExpires: 'Gultig bis',
    discountApplied: 'Rabatt angewendet',
    noHostelsFound: 'Keine Partner-Hostels gefunden',
    nearYou: 'In Ihrer Nahe',
    inCity: 'In {city}',
    fromPrice: 'Ab',
    perNight: '/Nacht',
    amenities: 'Ausstattung',
    reviews: 'Bewertungen',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    seeDetails: 'Details anzeigen',
    exclusive: 'Exklusives Angebot',
    verified: 'Verifizierter Partner',
    codeInvalid: 'Ungultiger oder abgelaufener Code',
    codeAlreadyUsed: 'Code bereits verwendet',
    codeRedeemed: 'Code erfolgreich eingelost!',
    loginRequired: 'Anmeldung erforderlich um einen Code zu generieren',
    addReview: 'Eine Bewertung hinterlassen',
    yourRating: 'Ihre Bewertung',
    yourReview: 'Ihre Meinung',
    submitReview: 'Senden',
    reviewAdded: 'Bewertung hinzugefugt!',
    discountBanner: '{discount}% Rabatt fur SpotHitch-Benutzer',
    wifi: 'WLAN',
    kitchen: 'Kuche',
    lounge: 'Aufenthaltsraum',
    lockers: 'Schliefacher',
    laundry: 'Wascherei',
    bar: 'Bar',
    terrace: 'Terrasse',
    bikes: 'Fahrrader',
    breakfast: 'Fruhstuck',
    events: 'Veranstaltungen',
    tours: 'Touren',
    surfboards: 'Surfbretter',
  },
}

/**
 * Get translation for current language
 * @param {string} key - Translation key
 * @param {Object} params - Optional parameters for interpolation
 * @returns {string} Translated string
 */
function t(key, params = {}) {
  const state = getState()
  const lang = state.lang || 'fr'
  const langTranslations = translations[lang] || translations.fr
  let text = langTranslations[key] || translations.en[key] || key

  // Interpolate parameters
  Object.keys(params).forEach((param) => {
    text = text.replace(`{${param}}`, params[param])
  })

  return text
}

/**
 * Get all partner hostels
 * @returns {Array} List of all active partner hostels
 */
export function getPartnerHostels() {
  const allHostels = Object.values(partnerHostels).flat()
  return allHostels.filter((hostel) => hostel.isActive)
}

/**
 * Get hostel details by ID
 * @param {string} hostelId - Hostel ID
 * @returns {Object|null} Hostel details or null
 */
export function getHostelDetails(hostelId) {
  if (!hostelId) return null
  const allHostels = Object.values(partnerHostels).flat()
  return allHostels.find((hostel) => hostel.id === hostelId) || null
}

/**
 * Get hostels near a specific spot
 * @param {string} spotId - Spot ID
 * @param {number} radiusKm - Search radius in kilometers (default: 10)
 * @returns {Array} List of hostels near the spot
 */
export function getHostelsNearSpot(spotId, radiusKm = 10) {
  if (!spotId) return []

  const state = getState()
  const spots = state.spots || []
  const spot = spots.find((s) => s.id === spotId)

  // First check for hostels that reference this spot
  const allHostels = getPartnerHostels()
  const nearbyByReference = allHostels.filter((hostel) =>
    hostel.nearSpotIds && hostel.nearSpotIds.includes(spotId)
  )

  // If spot has coordinates, also find by distance
  if (spot && spot.coordinates) {
    const nearbyByDistance = allHostels
      .map((hostel) => {
        const distance = calculateDistance(
          spot.coordinates.lat,
          spot.coordinates.lng,
          hostel.coordinates.lat,
          hostel.coordinates.lng
        )
        return { ...hostel, distance }
      })
      .filter((hostel) => hostel.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)

    // Merge results, avoiding duplicates
    const seenIds = new Set(nearbyByReference.map((h) => h.id))
    const merged = [...nearbyByReference]
    nearbyByDistance.forEach((hostel) => {
      if (!seenIds.has(hostel.id)) {
        merged.push(hostel)
        seenIds.add(hostel.id)
      }
    })
    return merged
  }

  return nearbyByReference
}

/**
 * Get hostels in a specific city
 * @param {string} city - City name
 * @returns {Array} List of hostels in the city
 */
export function getHostelsInCity(city) {
  if (!city) return []
  const cityLower = city.toLowerCase().trim()
  const allHostels = getPartnerHostels()
  return allHostels.filter((hostel) =>
    hostel.city.toLowerCase() === cityLower
  )
}

/**
 * Get hostels by country code
 * @param {string} countryCode - ISO country code (FR, DE, ES, etc.)
 * @returns {Array} List of hostels in the country
 */
export function getHostelsByCountry(countryCode) {
  if (!countryCode) return []
  const country = countryCode.toUpperCase()
  const countryHostels = partnerHostels[country] || []
  return countryHostels.filter((hostel) => hostel.isActive)
}

/**
 * Search hostels by query
 * @param {string} query - Search query
 * @returns {Array} List of matching hostels
 */
export function searchHostels(query) {
  if (!query || query.trim().length < 2) return []

  const queryLower = query.toLowerCase().trim()
  const state = getState()
  const lang = state.lang || 'fr'
  const allHostels = getPartnerHostels()

  return allHostels.filter((hostel) => {
    // Search in name
    if (hostel.name.toLowerCase().includes(queryLower)) return true
    // Search in city
    if (hostel.city.toLowerCase().includes(queryLower)) return true
    // Search in country
    if (hostel.country.toLowerCase().includes(queryLower)) return true
    // Search in description
    const description = hostel.description[lang] || hostel.description.en || ''
    if (description.toLowerCase().includes(queryLower)) return true
    // Search in amenities
    if (hostel.amenities.some((a) => a.toLowerCase().includes(queryLower))) return true
    return false
  })
}

/**
 * Get SpotHitch user discount for a hostel
 * @param {string} hostelId - Hostel ID
 * @returns {Object|null} Discount info or null
 */
export function getHostelDiscount(hostelId) {
  const hostel = getHostelDetails(hostelId)
  if (!hostel) return null

  return {
    hostelId: hostel.id,
    hostelName: hostel.name,
    discountPercent: hostel.discount,
    description: t('discountBanner', { discount: hostel.discount }),
  }
}

/**
 * Generate a unique discount code for a user
 * @param {string} hostelId - Hostel ID
 * @param {string} userId - User ID
 * @returns {Object} Generated discount code info
 */
export function generateDiscountCode(hostelId, userId) {
  const state = getState()

  // Check if user is logged in
  if (!userId && !state.user) {
    return { success: false, error: 'loginRequired', message: t('loginRequired') }
  }

  const hostel = getHostelDetails(hostelId)
  if (!hostel) {
    return { success: false, error: 'hostelNotFound', message: 'Hostel not found' }
  }

  const effectiveUserId = userId || state.user?.uid || state.user?.id || 'anonymous'

  // Generate unique code
  const timestamp = Date.now()
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
  const code = `SH-${hostel.country}-${randomPart}-${timestamp.toString(36).toUpperCase().slice(-4)}`

  // Calculate expiration date (30 days from now)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + CODE_EXPIRATION_DAYS)

  const discountCode = {
    code,
    hostelId,
    hostelName: hostel.name,
    userId: effectiveUserId,
    discountPercent: hostel.discount,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    isUsed: false,
    usedAt: null,
  }

  // Save to localStorage
  const storedCodes = getStoredCodes()
  storedCodes.push(discountCode)
  saveStoredCodes(storedCodes)

  // Track event
  trackEvent('hostel_discount_generated', {
    hostel_id: hostelId,
    hostel_name: hostel.name,
    discount_percent: hostel.discount,
    code,
  })

  return {
    success: true,
    code,
    discountPercent: hostel.discount,
    expiresAt: expiresAt.toISOString(),
    message: t('codeGenerated'),
  }
}

/**
 * Validate a discount code
 * @param {string} code - Discount code
 * @returns {Object} Validation result
 */
export function validateDiscountCode(code) {
  if (!code) {
    return { valid: false, error: 'codeInvalid', message: t('codeInvalid') }
  }

  const storedCodes = getStoredCodes()
  const discountCode = storedCodes.find((c) => c.code === code)

  if (!discountCode) {
    return { valid: false, error: 'codeInvalid', message: t('codeInvalid') }
  }

  // Check if expired
  const now = new Date()
  const expiresAt = new Date(discountCode.expiresAt)
  if (now > expiresAt) {
    return { valid: false, error: 'codeExpired', message: t('codeInvalid') }
  }

  // Check if already used
  if (discountCode.isUsed) {
    return { valid: false, error: 'codeAlreadyUsed', message: t('codeAlreadyUsed') }
  }

  return {
    valid: true,
    discountCode,
    discountPercent: discountCode.discountPercent,
    hostelId: discountCode.hostelId,
    hostelName: discountCode.hostelName,
    expiresAt: discountCode.expiresAt,
  }
}

/**
 * Redeem a discount code
 * @param {string} code - Discount code
 * @param {string} hostelId - Hostel ID where the code is being redeemed
 * @returns {Object} Redemption result
 */
export function redeemDiscount(code, hostelId) {
  const validation = validateDiscountCode(code)

  if (!validation.valid) {
    return { success: false, ...validation }
  }

  // Check if code is for this hostel
  if (validation.hostelId !== hostelId) {
    return {
      success: false,
      error: 'hostelMismatch',
      message: 'This code is for a different hostel'
    }
  }

  // Mark as used
  const storedCodes = getStoredCodes()
  const codeIndex = storedCodes.findIndex((c) => c.code === code)
  if (codeIndex !== -1) {
    storedCodes[codeIndex].isUsed = true
    storedCodes[codeIndex].usedAt = new Date().toISOString()
    saveStoredCodes(storedCodes)
  }

  // Track event
  trackEvent('hostel_discount_redeemed', {
    hostel_id: hostelId,
    code,
    discount_percent: validation.discountPercent,
  })

  return {
    success: true,
    discountPercent: validation.discountPercent,
    message: t('codeRedeemed'),
  }
}

/**
 * Get hostel amenities
 * @param {string} hostelId - Hostel ID
 * @returns {Array} List of amenities with labels
 */
export function getHostelAmenities(hostelId) {
  const hostel = getHostelDetails(hostelId)
  if (!hostel) return []

  return hostel.amenities.map((amenity) => ({
    id: amenity,
    label: t(amenity),
    icon: getAmenityIcon(amenity),
  }))
}

/**
 * Get hostel reviews from SpotHitch users
 * @param {string} hostelId - Hostel ID
 * @returns {Array} List of reviews
 */
export function getHostelReviews(hostelId) {
  const hostel = getHostelDetails(hostelId)
  if (!hostel) return []

  // Get reviews from localStorage
  const storedReviews = getStoredReviews()
  const hostelReviews = storedReviews.filter((r) => r.hostelId === hostelId)

  // Merge with hostel's default reviews
  return [...(hostel.reviews || []), ...hostelReviews].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )
}

/**
 * Add a review for a hostel
 * @param {string} hostelId - Hostel ID
 * @param {Object} review - Review data
 * @returns {Object} Result
 */
export function addHostelReview(hostelId, review) {
  const state = getState()
  const hostel = getHostelDetails(hostelId)

  if (!hostel) {
    return { success: false, error: 'hostelNotFound', message: 'Hostel not found' }
  }

  if (!review || !review.rating) {
    return { success: false, error: 'ratingRequired', message: 'Rating is required' }
  }

  const newReview = {
    id: `review-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    hostelId,
    userId: state.user?.uid || state.user?.id || 'anonymous',
    username: state.username || 'Anonymous',
    avatar: state.avatar || '🤙',
    rating: Math.min(5, Math.max(1, review.rating)),
    comment: review.comment || '',
    createdAt: new Date().toISOString(),
  }

  // Save to localStorage
  const storedReviews = getStoredReviews()
  storedReviews.push(newReview)
  saveStoredReviews(storedReviews)

  // Track event
  trackEvent('hostel_review_added', {
    hostel_id: hostelId,
    hostel_name: hostel.name,
    rating: newReview.rating,
  })

  return {
    success: true,
    review: newReview,
    message: t('reviewAdded'),
  }
}

/**
 * Get average rating for a hostel
 * @param {string} hostelId - Hostel ID
 * @returns {Object} Rating info
 */
export function getHostelRating(hostelId) {
  const hostel = getHostelDetails(hostelId)
  if (!hostel) return { average: 0, count: 0 }

  const reviews = getHostelReviews(hostelId)

  if (reviews.length === 0) {
    return { average: hostel.rating, count: hostel.reviewCount }
  }

  // Calculate average from SpotHitch reviews + original rating
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0) + (hostel.rating * hostel.reviewCount)
  const totalCount = reviews.length + hostel.reviewCount
  const average = totalRating / totalCount

  return {
    average: Math.round(average * 10) / 10,
    count: totalCount,
    spotHitchReviews: reviews.length,
  }
}

/**
 * Redirect to booking with discount
 * @param {string} hostelId - Hostel ID
 * @param {Object} dates - Booking dates
 * @returns {Object} Booking info
 */
export function bookHostel(hostelId, dates = {}) {
  const hostel = getHostelDetails(hostelId)
  if (!hostel) {
    return { success: false, error: 'hostelNotFound', message: 'Hostel not found' }
  }

  const state = getState()
  const userId = state.user?.uid || state.user?.id

  // Generate discount code if user is logged in
  let discountCode = null
  if (userId) {
    const codeResult = generateDiscountCode(hostelId, userId)
    if (codeResult.success) {
      discountCode = codeResult.code
    }
  }

  // Build booking URL with parameters
  let bookingUrl = hostel.bookingUrl
  if (dates.checkIn || dates.checkOut || discountCode) {
    const params = new URLSearchParams()
    if (dates.checkIn) params.append('checkin', dates.checkIn)
    if (dates.checkOut) params.append('checkout', dates.checkOut)
    if (discountCode) params.append('promo', discountCode)
    bookingUrl = `${hostel.bookingUrl}?${params.toString()}`
  }

  // Track event
  trackEvent('hostel_booking_clicked', {
    hostel_id: hostelId,
    hostel_name: hostel.name,
    has_discount: !!discountCode,
    check_in: dates.checkIn || null,
    check_out: dates.checkOut || null,
  })

  return {
    success: true,
    bookingUrl,
    discountCode,
    discountPercent: hostel.discount,
    hostel: {
      name: hostel.name,
      city: hostel.city,
    },
  }
}

/**
 * Track hostel click for analytics
 * @param {string} hostelId - Hostel ID
 */
export function trackHostelClick(hostelId) {
  const hostel = getHostelDetails(hostelId)
  if (!hostel) return

  trackEvent('hostel_click', {
    hostel_id: hostelId,
    hostel_name: hostel.name,
    hostel_city: hostel.city,
    hostel_country: hostel.country,
    discount_percent: hostel.discount,
    timestamp: new Date().toISOString(),
  })

}

/**
 * Render hostel card HTML
 * @param {Object} hostel - Hostel object
 * @returns {string} HTML string
 */
export function renderHostelCard(hostel) {
  if (!hostel) return ''

  const state = getState()
  const lang = state.lang || 'fr'
  const description = hostel.description[lang] || hostel.description.en
  const ratingInfo = getHostelRating(hostel.id)

  const amenityIcons = hostel.amenities.slice(0, 4).map((a) => {
    const icon = getAmenityIcon(a)
    return `<i class="fas ${icon}" title="${t(a)}"></i>`
  }).join(' ')

  return `
    <div class="hostel-card rounded-xl p-4 bg-dark-primary border border-white/10 hover:border-primary-500 transition-all cursor-pointer"
         data-hostel-id="${hostel.id}"
         onclick="window.openHostelDetail?.('${hostel.id}')"
         role="article"
         aria-label="${t('partnerHostel')}: ${hostel.name}">
      <div class="flex items-start gap-4">
        <!-- Photo -->
        <div class="w-24 h-24 rounded-lg bg-white/5 overflow-hidden shrink-0">
          ${hostel.photos && hostel.photos[0]
            ? `<img src="${hostel.photos[0]}" alt="${hostel.name}" class="w-full h-full object-cover">`
            : `<div class="w-full h-full flex items-center justify-center text-3xl">🏨</div>`
          }
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-semibold text-white text-lg truncate">${hostel.name}</h3>
              <p class="text-sm text-slate-400">${hostel.city}, ${hostel.country}</p>
            </div>
            <span class="bg-primary-500/20 text-primary-400 px-2 py-1 rounded-lg text-sm font-medium whitespace-nowrap">
              -${hostel.discount}%
            </span>
          </div>

          <!-- Rating -->
          <div class="flex items-center gap-2 mt-2">
            <div class="flex items-center text-yellow-400 text-sm">
              <i class="fas fa-star"></i>
              <span class="ml-1 text-white">${ratingInfo.average}</span>
            </div>
            <span class="text-xs text-slate-500">(${ratingInfo.count} ${t('reviews')})</span>
          </div>

          <!-- Amenities -->
          <div class="flex items-center gap-3 mt-2 text-slate-400 text-sm">
            ${amenityIcons}
          </div>

          <!-- Price -->
          <div class="mt-2 text-sm">
            <span class="text-slate-400">${t('fromPrice')}</span>
            <span class="text-white font-semibold ml-1">${hostel.priceRange.min}${hostel.priceRange.currency === 'EUR' ? '€' : hostel.priceRange.currency}</span>
            <span class="text-slate-400">${t('perNight')}</span>
          </div>
        </div>
      </div>

      <!-- Partner badge -->
      <div class="flex items-center justify-between mt-3 pt-3 border-t border-white/10 text-xs">
        <span class="text-primary-400 flex items-center gap-1">
          <i class="fas fa-check-circle"></i>
          ${t('verified')}
        </span>
        <span class="text-slate-500">${t('seeDetails')} →</span>
      </div>
    </div>
  `
}

/**
 * Render hostel list HTML
 * @param {Array} hostels - List of hostels
 * @returns {string} HTML string
 */
export function renderHostelList(hostels) {
  if (!hostels || hostels.length === 0) {
    return `
      <div class="text-center py-8 text-slate-400">
        <i class="fas fa-hotel text-4xl mb-3"></i>
        <p>${t('noHostelsFound')}</p>
      </div>
    `
  }

  return `
    <div class="space-y-4">
      ${hostels.map((hostel) => renderHostelCard(hostel)).join('')}
    </div>
  `
}

/**
 * Render hostel detail HTML
 * @param {Object} hostel - Hostel object
 * @returns {string} HTML string
 */
export function renderHostelDetail(hostel) {
  if (!hostel) return ''

  const state = getState()
  const lang = state.lang || 'fr'
  const description = hostel.description[lang] || hostel.description.en
  const ratingInfo = getHostelRating(hostel.id)
  const amenities = getHostelAmenities(hostel.id)
  const reviews = getHostelReviews(hostel.id)

  // Track view
  trackHostelClick(hostel.id)

  return `
    <div class="hostel-detail fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
         onclick="if(event.target === this) window.closeHostelDetail?.()"
         role="dialog"
         aria-modal="true"
         aria-labelledby="hostel-modal-title">
      <div class="bg-white/5 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="sticky top-0 bg-white/5 p-4 border-b border-white/10 flex items-center justify-between z-10">
          <h2 id="hostel-modal-title" class="text-xl font-bold text-white">${hostel.name}</h2>
          <button onclick="window.closeHostelDetail?.()"
            class="text-slate-400 hover:text-white w-8 h-8 flex items-center justify-center"
            aria-label="Close">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Photo gallery -->
        ${hostel.photos && hostel.photos.length > 0 ? `
          <div class="relative h-48 bg-dark-primary">
            <img src="${hostel.photos[0]}" alt="${hostel.name}" class="w-full h-full object-cover">
            <div class="absolute top-2 right-2 bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              -${hostel.discount}% SpotHitch
            </div>
          </div>
        ` : ''}

        <div class="p-4 space-y-4">
          <!-- Location -->
          <div class="flex items-center gap-2 text-slate-400">
            <i class="fas fa-map-marker-alt"></i>
            <span>${hostel.address}</span>
          </div>

          <!-- Rating -->
          <div class="flex items-center gap-2">
            <div class="flex items-center text-yellow-400">
              ${renderStars(ratingInfo.average)}
            </div>
            <span class="text-white font-semibold">${ratingInfo.average}</span>
            <span class="text-slate-400">(${ratingInfo.count} ${t('reviews')})</span>
          </div>

          <!-- Description -->
          <p class="text-slate-300">${description}</p>

          <!-- Price -->
          <div class="bg-dark-primary rounded-lg p-3">
            <span class="text-slate-400 text-sm">${t('fromPrice')}</span>
            <span class="text-2xl font-bold text-white ml-2">${hostel.priceRange.min}€</span>
            <span class="text-slate-400">${t('perNight')}</span>
            <div class="text-primary-400 text-sm mt-1">
              <i class="fas fa-tag mr-1"></i>
              ${t('discountBanner', { discount: hostel.discount })}
            </div>
          </div>

          <!-- Amenities -->
          <div>
            <h3 class="font-semibold text-white mb-2">${t('amenities')}</h3>
            <div class="flex flex-wrap gap-2">
              ${amenities.map((a) => `
                <span class="flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full text-sm text-slate-300">
                  <i class="fas ${a.icon}"></i>
                  ${a.label}
                </span>
              `).join('')}
            </div>
          </div>

          <!-- Check-in/out -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-dark-primary rounded-lg p-3">
              <span class="text-slate-400 text-sm">${t('checkIn')}</span>
              <p class="text-white font-semibold">${hostel.checkIn}</p>
            </div>
            <div class="bg-dark-primary rounded-lg p-3">
              <span class="text-slate-400 text-sm">${t('checkOut')}</span>
              <p class="text-white font-semibold">${hostel.checkOut}</p>
            </div>
          </div>

          <!-- Reviews preview -->
          ${reviews.length > 0 ? `
            <div>
              <h3 class="font-semibold text-white mb-2">${t('reviews')} SpotHitch</h3>
              <div class="space-y-2">
                ${reviews.slice(0, 3).map((review) => `
                  <div class="bg-dark-primary rounded-lg p-3">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-lg">${review.avatar || '🤙'}</span>
                      <span class="text-white text-sm">${review.username}</span>
                      <div class="text-yellow-400 text-xs ml-auto">
                        ${renderStars(review.rating)}
                      </div>
                    </div>
                    ${review.comment ? `<p class="text-slate-400 text-sm">${review.comment}</p>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Action buttons -->
          <div class="flex gap-3 pt-2">
            <button onclick="window.generateHostelCode?.('${hostel.id}')"
              class="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2">
              <i class="fas fa-ticket-alt"></i>
              ${t('generateCode')}
            </button>
            <button onclick="window.bookHostelNow?.('${hostel.id}')"
              class="flex-1 bg-primary hover:bg-primary/80 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold">
              <i class="fas fa-external-link-alt"></i>
              ${t('bookNow')}
            </button>
          </div>

          <!-- Contact -->
          <div class="flex gap-2 pt-2">
            ${hostel.phone ? `
              <button onclick="window.open('tel:${hostel.phone}')"
                class="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2">
                <i class="fas fa-phone"></i>
                Call
              </button>
            ` : ''}
            ${hostel.email ? `
              <button onclick="window.open('mailto:${hostel.email}')"
                class="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2">
                <i class="fas fa-envelope"></i>
                Email
              </button>
            ` : ''}
          </div>

          <!-- Partner badge -->
          <div class="text-center text-xs text-slate-500 pt-2 border-t border-white/10">
            <i class="fas fa-check-circle text-primary-400 mr-1"></i>
            ${t('verified')} - ${t('exclusive')}
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Render discount banner HTML
 * @param {Object} discount - Discount info
 * @returns {string} HTML string
 */
export function renderDiscountBanner(discount) {
  if (!discount) return ''

  return `
    <div class="discount-banner rounded-lg p-4 bg-gradient-to-r from-primary-500/20 to-primary-600/10 border border-primary-500/30"
         role="banner"
         aria-label="${t('discountLabel')}">
      <div class="flex items-center gap-3">
        <div class="shrink-0">
          <span class="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary-500/30 text-primary-400">
            <i class="fas fa-percent text-xl"></i>
          </span>
        </div>
        <div class="flex-1">
          <p class="font-semibold text-white">${discount.hostelName || t('partnerHostel')}</p>
          <p class="text-primary-400">
            <span class="text-2xl font-bold">-${discount.discountPercent}%</span>
            <span class="ml-1">${t('discountLabel')}</span>
          </p>
          ${discount.code ? `
            <div class="mt-2 flex items-center gap-2">
              <code class="bg-white/5 px-3 py-1 rounded font-mono text-white">${discount.code}</code>
              <button onclick="window.copyHostelCode?.('${discount.code}')"
                class="text-primary-400 hover:text-primary-300">
                <i class="fas fa-copy"></i>
              </button>
            </div>
            ${discount.expiresAt ? `
              <p class="text-xs text-slate-500 mt-1">
                ${t('codeExpires')} ${new Date(discount.expiresAt).toLocaleDateString()}
              </p>
            ` : ''}
          ` : ''}
        </div>
      </div>
    </div>
  `
}

// ============= Helper Functions =============

/**
 * Get stored discount codes from localStorage
 */
function getStoredCodes() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('[HostelPartnership] Error reading stored codes:', error)
    return []
  }
}

/**
 * Save discount codes to localStorage
 */
function saveStoredCodes(codes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(codes))
  } catch (error) {
    console.error('[HostelPartnership] Error saving codes:', error)
  }
}

/**
 * Get stored reviews from localStorage
 */
function getStoredReviews() {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_reviews`)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    return []
  }
}

/**
 * Save reviews to localStorage
 */
function saveStoredReviews(reviews) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_reviews`, JSON.stringify(reviews))
  } catch (error) {
    console.error('[HostelPartnership] Error saving reviews:', error)
  }
}

/**
 * Calculate distance between two coordinates in km
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
 * Get FontAwesome icon for amenity
 */
function getAmenityIcon(amenity) {
  const icons = {
    wifi: 'fa-wifi',
    kitchen: 'fa-utensils',
    lounge: 'fa-couch',
    lockers: 'fa-lock',
    laundry: 'fa-tshirt',
    bar: 'fa-glass-martini-alt',
    terrace: 'fa-sun',
    bikes: 'fa-bicycle',
    breakfast: 'fa-coffee',
    events: 'fa-calendar-alt',
    tours: 'fa-map',
    surfboards: 'fa-water',
  }
  return icons[amenity] || 'fa-check'
}

/**
 * Render star rating HTML
 */
function renderStars(rating) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.5
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0)

  let html = ''
  for (let i = 0; i < fullStars; i++) {
    html += '<i class="fas fa-star"></i>'
  }
  if (hasHalf) {
    html += '<i class="fas fa-star-half-alt"></i>'
  }
  for (let i = 0; i < emptyStars; i++) {
    html += '<i class="far fa-star text-slate-500"></i>'
  }
  return html
}

// ============= Global Window Handlers =============

if (typeof window !== 'undefined') {
  window.openHostelDetail = (hostelId) => {
    const hostel = getHostelDetails(hostelId)
    if (hostel) {
      const html = renderHostelDetail(hostel)
      const container = document.getElementById('modal-container')
      if (container) {
        container.innerHTML = html
      } else {
        document.body.insertAdjacentHTML('beforeend', html)
      }
    }
  }

  window.closeHostelDetail = () => {
    const detail = document.querySelector('.hostel-detail')
    if (detail) {
      detail.remove()
    }
    const container = document.getElementById('modal-container')
    if (container) {
      container.innerHTML = ''
    }
  }

  window.generateHostelCode = (hostelId) => {
    const state = getState()
    const result = generateDiscountCode(hostelId, state.user?.uid)
    if (result.success) {
      // Show the code in a toast or update UI
      const { showToast } = require('./notifications.js')
      if (showToast) {
        showToast(`${t('codeGenerated')} ${result.code}`, 'success')
      }
      // Copy to clipboard
      if (navigator.clipboard) {
        navigator.clipboard.writeText(result.code)
      }
    } else {
      const { showToast } = require('./notifications.js')
      if (showToast) {
        showToast(result.message, 'error')
      }
    }
  }

  window.bookHostelNow = (hostelId) => {
    const result = bookHostel(hostelId)
    if (result.success) {
      window.open(result.bookingUrl, '_blank')
    }
  }

  window.copyHostelCode = (code) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code)
      const { showToast } = require('./notifications.js')
      if (showToast) {
        showToast(t('codeCopied'), 'success')
      }
    }
  }

  window.trackHostelClick = trackHostelClick
}

// ============= Default Export =============

export default {
  getPartnerHostels,
  getHostelDetails,
  getHostelsNearSpot,
  getHostelsInCity,
  getHostelsByCountry,
  searchHostels,
  getHostelDiscount,
  generateDiscountCode,
  validateDiscountCode,
  redeemDiscount,
  getHostelAmenities,
  getHostelReviews,
  addHostelReview,
  getHostelRating,
  bookHostel,
  renderHostelCard,
  renderHostelList,
  renderHostelDetail,
  renderDiscountBanner,
  trackHostelClick,
}
