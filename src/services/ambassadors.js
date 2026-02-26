import { Storage } from '../utils/storage.js'
import { getState, setState } from '../stores/state.js'
import { t } from '../i18n/index.js'

const STORAGE_KEY = 'spothitch_ambassadors'

// Sample demo ambassadors
const DEMO_AMBASSADORS = [
  {
    userId: 'demo_paris_1',
    userName: 'Sophie Martin',
    userAvatar: '🇫🇷',
    city: 'Paris',
    country: 'France',
    bio: 'Hitchhiking around Europe since 2018. Happy to help with Paris spots!',
    languages: ['fr', 'en', 'es'],
    availability: 'available',
    registeredAt: Date.now() - 86400000 * 180,
    spotsCreated: 23,
    checkins: 47
  },
  {
    userId: 'demo_berlin_1',
    userName: 'Max Schmidt',
    userAvatar: '🇩🇪',
    city: 'Berlin',
    country: 'Germany',
    bio: 'Local hitchhiker and guide. Know all the best spots around Berlin!',
    languages: ['de', 'en'],
    availability: 'available',
    registeredAt: Date.now() - 86400000 * 365,
    spotsCreated: 45,
    checkins: 89
  },
  {
    userId: 'demo_barcelona_1',
    userName: 'Carlos García',
    userAvatar: '🇪🇸',
    city: 'Barcelona',
    country: 'Spain',
    bio: 'Traveled to 30+ countries by thumb. Love helping new hitchhikers!',
    languages: ['es', 'en', 'fr'],
    availability: 'busy',
    registeredAt: Date.now() - 86400000 * 270,
    spotsCreated: 31,
    checkins: 52
  },
  {
    userId: 'demo_london_1',
    userName: 'Emma Thompson',
    userAvatar: '🇬🇧',
    city: 'London',
    country: 'United Kingdom',
    bio: 'Weekend hitchhiker, happy to share tips for leaving London.',
    languages: ['en'],
    availability: 'available',
    registeredAt: Date.now() - 86400000 * 90,
    spotsCreated: 12,
    checkins: 18
  },
  {
    userId: 'demo_rome_1',
    userName: 'Marco Rossi',
    userAvatar: '🇮🇹',
    city: 'Rome',
    country: 'Italy',
    bio: 'Hitchhiking enthusiast. Can help with spots and safety tips in Rome.',
    languages: ['it', 'en'],
    availability: 'unavailable',
    registeredAt: Date.now() - 86400000 * 200,
    spotsCreated: 19,
    checkins: 34
  }
]

// Initialize storage with demo data if empty
function initAmbassadors() {
  const stored = Storage.get(STORAGE_KEY)
  if (!stored || stored.length === 0) {
    Storage.set(STORAGE_KEY, DEMO_AMBASSADORS)
    return DEMO_AMBASSADORS
  }
  return stored
}

// Get all ambassadors or filter by city
export function getAmbassadors(city = null) {
  const ambassadors = initAmbassadors()
  if (!city) return ambassadors
  return ambassadors.filter(a => a.city.toLowerCase() === city.toLowerCase())
}

// Check if current user is eligible to become an ambassador
export function isEligibleForAmbassador() {
  const state = getState()
  if (!state.user) return false

  const trustScore = state.user.trustScore || 0
  const spotsCreated = state.user.spotsCreated || 0
  const checkins = state.user.checkins || 0

  return trustScore >= 50 || spotsCreated >= 10 || checkins >= 5
}

// Register current user as ambassador
export function registerAsAmbassador(data) {
  const state = getState()
  if (!state.user) {
    throw new Error(t('pleaseLoginFirst'))
  }

  if (!isEligibleForAmbassador()) {
    throw new Error(t('notEligibleForAmbassador'))
  }

  const { city, country, bio, languages, availability } = data
  if (!city || !country || !bio) {
    throw new Error(t('allFieldsRequired'))
  }

  const ambassadors = initAmbassadors()

  // Check if already registered
  const existingIndex = ambassadors.findIndex(a => a.userId === state.user.uid)

  const ambassador = {
    userId: state.user.uid,
    userName: state.user.displayName || state.user.email,
    userAvatar: state.user.avatar || '👤',
    city,
    country,
    bio,
    languages: languages || ['en'],
    availability: availability || 'available',
    registeredAt: existingIndex >= 0 ? ambassadors[existingIndex].registeredAt : Date.now(),
    spotsCreated: state.user.spotsCreated || 0,
    checkins: state.user.checkins || 0
  }

  if (existingIndex >= 0) {
    ambassadors[existingIndex] = ambassador
  } else {
    ambassadors.push(ambassador)
  }

  Storage.set(STORAGE_KEY, ambassadors)

  // Update user state
  setState({
    user: {
      ...state.user,
      isAmbassador: true,
      ambassadorCity: city
    }
  })

  return ambassador
}

// Unregister current user as ambassador
export function unregisterAmbassador() {
  const state = getState()
  if (!state.user) return false

  const ambassadors = initAmbassadors()
  const filtered = ambassadors.filter(a => a.userId !== state.user.uid)

  Storage.set(STORAGE_KEY, filtered)

  setState({
    user: {
      ...state.user,
      isAmbassador: false,
      ambassadorCity: null
    }
  })

  return true
}

// Search ambassadors by city/country name
export function searchAmbassadors(query) {
  if (!query || query.trim().length < 2) return []

  const ambassadors = initAmbassadors()
  const lowerQuery = query.toLowerCase().trim()

  return ambassadors.filter(a =>
    a.city.toLowerCase().includes(lowerQuery) ||
    a.country.toLowerCase().includes(lowerQuery) ||
    a.userName.toLowerCase().includes(lowerQuery)
  )
}

// Get a specific ambassador's profile
export function getAmbassadorProfile(userId) {
  const ambassadors = initAmbassadors()
  return ambassadors.find(a => a.userId === userId) || null
}

// Get ambassador for current user
export function getCurrentAmbassadorProfile() {
  const state = getState()
  if (!state.user) return null
  return getAmbassadorProfile(state.user.uid)
}

// Update ambassador availability
export function updateAmbassadorAvailability(availability) {
  const state = getState()
  if (!state.user) return false

  const ambassadors = initAmbassadors()
  const index = ambassadors.findIndex(a => a.userId === state.user.uid)

  if (index < 0) return false

  ambassadors[index].availability = availability
  Storage.set(STORAGE_KEY, ambassadors)

  return true
}

// Global window handlers for UI
window.searchAmbassadors = function(query) {
  const results = searchAmbassadors(query)
  setState({ ambassadorSearchResults: results })
  return results
}

window.registerAmbassador = function(city, country, bio, languages, availability) {
  try {
    const ambassador = registerAsAmbassador({
      city,
      country,
      bio,
      languages: languages ? languages.split(',').map(l => l.trim()) : ['en'],
      availability: availability || 'available'
    })
    setState({ showAmbassadorSuccess: true })
    return ambassador
  } catch (error) {
    setState({ ambassadorError: error.message })
    return null
  }
}

window.contactAmbassador = function(userId) {
  const ambassador = getAmbassadorProfile(userId)
  if (!ambassador) return

  setState({
    selectedAmbassador: ambassador,
    showContactAmbassador: true
  })
}

window.unregisterAmbassador = function() {
  if (confirm(t('confirmUnregisterAmbassador'))) {
    unregisterAmbassador()
    setState({ showAmbassadorProfile: false })
  }
}

window.updateAmbassadorAvailability = function(availability) {
  updateAmbassadorAvailability(availability)
  const profile = getCurrentAmbassadorProfile()
  setState({ currentAmbassadorProfile: profile })
}
