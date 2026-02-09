/**
 * Detailed Profiles Service
 * Comprehensive user profile management with bio, languages, travel preferences, and social links
 */

import { getState, setState } from '../stores/state.js'
import { showToast } from './notifications.js'

/**
 * Available languages for user profiles
 */
export const AVAILABLE_LANGUAGES = {
  fr: { code: 'fr', name: 'Francais', flag: '🇫🇷', nativeName: 'Francais' },
  en: { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  es: { code: 'es', name: 'Espanol', flag: '🇪🇸', nativeName: 'Espanol' },
  de: { code: 'de', name: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
  it: { code: 'it', name: 'Italian', flag: '🇮🇹', nativeName: 'Italiano' },
  pt: { code: 'pt', name: 'Portuguese', flag: '🇵🇹', nativeName: 'Portugues' },
  nl: { code: 'nl', name: 'Dutch', flag: '🇳🇱', nativeName: 'Nederlands' },
  pl: { code: 'pl', name: 'Polish', flag: '🇵🇱', nativeName: 'Polski' },
  ru: { code: 'ru', name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
  cs: { code: 'cs', name: 'Czech', flag: '🇨🇿', nativeName: 'Cestina' },
  sv: { code: 'sv', name: 'Swedish', flag: '🇸🇪', nativeName: 'Svenska' },
  da: { code: 'da', name: 'Danish', flag: '🇩🇰', nativeName: 'Dansk' },
  no: { code: 'no', name: 'Norwegian', flag: '🇳🇴', nativeName: 'Norsk' },
  fi: { code: 'fi', name: 'Finnish', flag: '🇫🇮', nativeName: 'Suomi' },
  el: { code: 'el', name: 'Greek', flag: '🇬🇷', nativeName: 'Ελληνικα' },
  tr: { code: 'tr', name: 'Turkish', flag: '🇹🇷', nativeName: 'Turkce' },
  hr: { code: 'hr', name: 'Croatian', flag: '🇭🇷', nativeName: 'Hrvatski' },
  ro: { code: 'ro', name: 'Romanian', flag: '🇷🇴', nativeName: 'Romana' },
  hu: { code: 'hu', name: 'Hungarian', flag: '🇭🇺', nativeName: 'Magyar' },
  sk: { code: 'sk', name: 'Slovak', flag: '🇸🇰', nativeName: 'Slovencina' },
}

/**
 * European countries for travel history
 */
export const EUROPEAN_COUNTRIES = {
  FR: { code: 'FR', name: 'France', flag: '🇫🇷' },
  DE: { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  ES: { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
  IT: { code: 'IT', name: 'Italie', flag: '🇮🇹' },
  PT: { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  GB: { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧' },
  NL: { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱' },
  BE: { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  CH: { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  AT: { code: 'AT', name: 'Autriche', flag: '🇦🇹' },
  PL: { code: 'PL', name: 'Pologne', flag: '🇵🇱' },
  CZ: { code: 'CZ', name: 'Tchequie', flag: '🇨🇿' },
  SE: { code: 'SE', name: 'Suede', flag: '🇸🇪' },
  DK: { code: 'DK', name: 'Danemark', flag: '🇩🇰' },
  NO: { code: 'NO', name: 'Norvege', flag: '🇳🇴' },
  FI: { code: 'FI', name: 'Finlande', flag: '🇫🇮' },
  GR: { code: 'GR', name: 'Grece', flag: '🇬🇷' },
  HR: { code: 'HR', name: 'Croatie', flag: '🇭🇷' },
  RO: { code: 'RO', name: 'Roumanie', flag: '🇷🇴' },
  HU: { code: 'HU', name: 'Hongrie', flag: '🇭🇺' },
  IE: { code: 'IE', name: 'Irlande', flag: '🇮🇪' },
  SK: { code: 'SK', name: 'Slovaquie', flag: '🇸🇰' },
  SI: { code: 'SI', name: 'Slovenie', flag: '🇸🇮' },
  BG: { code: 'BG', name: 'Bulgarie', flag: '🇧🇬' },
  RS: { code: 'RS', name: 'Serbie', flag: '🇷🇸' },
  BA: { code: 'BA', name: 'Bosnie', flag: '🇧🇦' },
  ME: { code: 'ME', name: 'Montenegro', flag: '🇲🇪' },
  AL: { code: 'AL', name: 'Albanie', flag: '🇦🇱' },
  MK: { code: 'MK', name: 'Macedoine', flag: '🇲🇰' },
  LT: { code: 'LT', name: 'Lituanie', flag: '🇱🇹' },
  LV: { code: 'LV', name: 'Lettonie', flag: '🇱🇻' },
  EE: { code: 'EE', name: 'Estonie', flag: '🇪🇪' },
  MT: { code: 'MT', name: 'Malte', flag: '🇲🇹' },
  CY: { code: 'CY', name: 'Chypre', flag: '🇨🇾' },
  LU: { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  IS: { code: 'IS', name: 'Islande', flag: '🇮🇸' },
  UA: { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  TR: { code: 'TR', name: 'Turquie', flag: '🇹🇷' },
  MA: { code: 'MA', name: 'Maroc', flag: '🇲🇦' },
}

/**
 * Travel styles definitions
 */
export const TRAVEL_STYLES = {
  solo: {
    id: 'solo',
    name: 'Solo',
    nameEn: 'Solo',
    icon: '🧍',
    description: 'Je prefere voyager seul',
    descriptionEn: 'I prefer traveling alone',
  },
  duo: {
    id: 'duo',
    name: 'En duo',
    nameEn: 'Duo',
    icon: '👫',
    description: 'Je voyage generalement a deux',
    descriptionEn: 'I usually travel with one companion',
  },
  group: {
    id: 'group',
    name: 'En groupe',
    nameEn: 'Group',
    icon: '👥',
    description: 'J\'aime voyager en petit groupe (3-5 personnes)',
    descriptionEn: 'I like traveling in small groups (3-5 people)',
  },
  flexible: {
    id: 'flexible',
    name: 'Flexible',
    nameEn: 'Flexible',
    icon: '🔄',
    description: 'Je m\'adapte selon les opportunites',
    descriptionEn: 'I adapt depending on opportunities',
  },
}

/**
 * Preferred vehicle types
 */
export const PREFERRED_VEHICLES = {
  car: {
    id: 'car',
    name: 'Voiture',
    nameEn: 'Car',
    icon: '🚗',
    description: 'Voitures particulieres',
  },
  truck: {
    id: 'truck',
    name: 'Camion',
    nameEn: 'Truck',
    icon: '🚛',
    description: 'Poids lourds et camions',
  },
  van: {
    id: 'van',
    name: 'Van/Camping-car',
    nameEn: 'Van/Campervan',
    icon: '🚐',
    description: 'Vans, camping-cars, fourgons',
  },
  motorcycle: {
    id: 'motorcycle',
    name: 'Moto',
    nameEn: 'Motorcycle',
    icon: '🏍️',
    description: 'Motos et scooters',
  },
  any: {
    id: 'any',
    name: 'Tout vehicule',
    nameEn: 'Any vehicle',
    icon: '🚙',
    description: 'Pas de preference particuliere',
  },
}

/**
 * Availability options
 */
export const AVAILABILITY_OPTIONS = {
  available: {
    id: 'available',
    name: 'Disponible',
    nameEn: 'Available',
    icon: '✅',
    color: '#10b981',
    description: 'Pret a voyager maintenant',
  },
  planning: {
    id: 'planning',
    name: 'En planification',
    nameEn: 'Planning',
    icon: '📅',
    color: '#f59e0b',
    description: 'Je planifie un prochain voyage',
  },
  busy: {
    id: 'busy',
    name: 'Occupe',
    nameEn: 'Busy',
    icon: '⏳',
    color: '#ef4444',
    description: 'Pas disponible actuellement',
  },
  seasonal: {
    id: 'seasonal',
    name: 'Saisonnier',
    nameEn: 'Seasonal',
    icon: '🌞',
    color: '#3b82f6',
    description: 'Disponible uniquement certaines periodes',
  },
}

/**
 * Social link types
 */
export const SOCIAL_LINK_TYPES = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: 'fab fa-instagram',
    baseUrl: 'https://instagram.com/',
    placeholder: '@username',
    color: '#E1306C',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: 'fab fa-facebook',
    baseUrl: 'https://facebook.com/',
    placeholder: 'username',
    color: '#1877F2',
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: 'fab fa-x-twitter',
    baseUrl: 'https://x.com/',
    placeholder: '@username',
    color: '#000000',
  },
  couchsurfing: {
    id: 'couchsurfing',
    name: 'Couchsurfing',
    icon: 'fas fa-couch',
    baseUrl: 'https://couchsurfing.com/people/',
    placeholder: 'username',
    color: '#F5615A',
  },
  bewelcome: {
    id: 'bewelcome',
    name: 'BeWelcome',
    icon: 'fas fa-home',
    baseUrl: 'https://bewelcome.org/members/',
    placeholder: 'username',
    color: '#4CAF50',
  },
  trustroots: {
    id: 'trustroots',
    name: 'Trustroots',
    icon: 'fas fa-leaf',
    baseUrl: 'https://trustroots.org/profile/',
    placeholder: 'username',
    color: '#12B886',
  },
  hitchwiki: {
    id: 'hitchwiki',
    name: 'Hitchwiki',
    icon: 'fas fa-thumbs-up',
    baseUrl: 'https://hitchwiki.org/en/User:',
    placeholder: 'username',
    color: '#5C9632',
  },
  website: {
    id: 'website',
    name: 'Site web',
    icon: 'fas fa-globe',
    baseUrl: '',
    placeholder: 'https://example.com',
    color: '#6366f1',
  },
}

/**
 * Profile completeness weights
 */
const COMPLETENESS_WEIGHTS = {
  bio: 20,
  languages: 15,
  countriesVisited: 15,
  travelStyle: 10,
  preferredVehicle: 10,
  availability: 10,
  socialLinks: 10,
  profilePhoto: 10,
}

/**
 * Storage key for detailed profiles
 */
const PROFILES_STORAGE_KEY = 'spothitch_detailed_profiles'

/**
 * Get profiles from storage
 * @returns {Object} Profiles object
 */
function getProfilesFromStorage() {
  try {
    const stored = localStorage.getItem(PROFILES_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error reading profiles from storage:', error)
    return {}
  }
}

/**
 * Save profiles to storage
 * @param {Object} profiles - Profiles object
 */
function saveProfilesToStorage(profiles) {
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles))
  } catch (error) {
    console.error('Error saving profiles to storage:', error)
  }
}

/**
 * Create default detailed profile structure
 * @returns {Object} Default profile
 */
export function createDefaultProfile() {
  return {
    bio: '',
    languages: [],
    countriesVisited: [],
    travelStyle: null,
    preferredVehicle: null,
    availability: null,
    availabilityDetails: '',
    socialLinks: {},
    profilePhoto: null,
    interests: [],
    travelExperience: 0, // years of hitchhiking experience
    preferredRoutes: [], // favorite routes (e.g., "Paris-Berlin")
    tips: '', // personal travel tips
    createdAt: null,
    updatedAt: null,
  }
}

/**
 * Get detailed profile for a user
 * @param {string} userId - User ID (optional, defaults to current user)
 * @returns {Object} Detailed profile data
 */
export function getDetailedProfile(userId = null) {
  const state = getState()
  const targetUserId = userId || state.user?.uid || 'anonymous'

  const profiles = getProfilesFromStorage()
  const storedProfile = profiles[targetUserId]

  if (storedProfile) {
    return {
      ...createDefaultProfile(),
      ...storedProfile,
      userId: targetUserId,
    }
  }

  // Return default profile with basic state info
  return {
    ...createDefaultProfile(),
    userId: targetUserId,
    username: state.username || '',
    avatar: state.avatar || '🤙',
  }
}

/**
 * Update detailed profile
 * @param {Object} data - Profile data to update
 * @param {string} userId - User ID (optional, defaults to current user)
 * @returns {Object} Result with success status
 */
export function updateDetailedProfile(data, userId = null) {
  const state = getState()
  const targetUserId = userId || state.user?.uid || 'anonymous'

  // Validate data
  const validation = validateProfileData(data)
  if (!validation.valid) {
    return { success: false, error: validation.error, errors: validation.errors }
  }

  const profiles = getProfilesFromStorage()
  const existingProfile = profiles[targetUserId] || createDefaultProfile()

  // Merge data with existing profile
  const updatedProfile = {
    ...existingProfile,
    ...data,
    updatedAt: new Date().toISOString(),
  }

  // Set createdAt if new profile
  if (!existingProfile.createdAt) {
    updatedProfile.createdAt = updatedProfile.updatedAt
  }

  // Save to storage
  profiles[targetUserId] = updatedProfile
  saveProfilesToStorage(profiles)

  // Update state if it's the current user
  if (!userId || userId === state.user?.uid) {
    setState({
      detailedProfile: updatedProfile,
    })
  }

  showToast('Profil mis a jour !', 'success')

  return { success: true, profile: updatedProfile }
}

/**
 * Validate profile data
 * @param {Object} data - Profile data to validate
 * @returns {Object} Validation result
 */
export function validateProfileData(data) {
  const errors = []

  // Validate bio length
  if (data.bio !== undefined) {
    if (typeof data.bio !== 'string') {
      errors.push({ field: 'bio', message: 'La bio doit etre du texte' })
    } else if (data.bio.length > 500) {
      errors.push({ field: 'bio', message: 'La bio ne doit pas depasser 500 caracteres' })
    }
  }

  // Validate languages
  if (data.languages !== undefined) {
    if (!Array.isArray(data.languages)) {
      errors.push({ field: 'languages', message: 'Les langues doivent etre un tableau' })
    } else {
      const invalidLangs = data.languages.filter(lang => !AVAILABLE_LANGUAGES[lang])
      if (invalidLangs.length > 0) {
        errors.push({ field: 'languages', message: `Langues invalides: ${invalidLangs.join(', ')}` })
      }
    }
  }

  // Validate countries visited
  if (data.countriesVisited !== undefined) {
    if (!Array.isArray(data.countriesVisited)) {
      errors.push({ field: 'countriesVisited', message: 'Les pays visites doivent etre un tableau' })
    } else {
      const invalidCountries = data.countriesVisited.filter(c => !EUROPEAN_COUNTRIES[c])
      if (invalidCountries.length > 0) {
        errors.push({ field: 'countriesVisited', message: `Pays invalides: ${invalidCountries.join(', ')}` })
      }
    }
  }

  // Validate travel style
  if (data.travelStyle !== undefined && data.travelStyle !== null) {
    if (!TRAVEL_STYLES[data.travelStyle]) {
      errors.push({ field: 'travelStyle', message: 'Style de voyage invalide' })
    }
  }

  // Validate preferred vehicle
  if (data.preferredVehicle !== undefined && data.preferredVehicle !== null) {
    if (!PREFERRED_VEHICLES[data.preferredVehicle]) {
      errors.push({ field: 'preferredVehicle', message: 'Type de vehicule invalide' })
    }
  }

  // Validate availability
  if (data.availability !== undefined && data.availability !== null) {
    if (!AVAILABILITY_OPTIONS[data.availability]) {
      errors.push({ field: 'availability', message: 'Disponibilite invalide' })
    }
  }

  // Validate social links
  if (data.socialLinks !== undefined) {
    if (typeof data.socialLinks !== 'object' || Array.isArray(data.socialLinks)) {
      errors.push({ field: 'socialLinks', message: 'Les liens sociaux doivent etre un objet' })
    } else {
      for (const [platform, value] of Object.entries(data.socialLinks)) {
        if (!SOCIAL_LINK_TYPES[platform]) {
          errors.push({ field: 'socialLinks', message: `Plateforme invalide: ${platform}` })
        }
        if (value && typeof value !== 'string') {
          errors.push({ field: 'socialLinks', message: `Valeur invalide pour ${platform}` })
        }
      }
    }
  }

  // Validate travel experience
  if (data.travelExperience !== undefined) {
    if (typeof data.travelExperience !== 'number' || data.travelExperience < 0 || data.travelExperience > 50) {
      errors.push({ field: 'travelExperience', message: 'Experience de voyage invalide (0-50 ans)' })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    error: errors.length > 0 ? errors[0].message : null,
  }
}

/**
 * Calculate profile completeness percentage
 * @param {Object} profile - Profile object (optional, uses current user if not provided)
 * @returns {Object} Completeness info
 */
export function getProfileCompleteness(profile = null) {
  const profileData = profile || getDetailedProfile()
  let totalWeight = 0
  let earnedWeight = 0
  const missing = []
  const completed = []

  // Check bio
  if (profileData.bio && profileData.bio.length >= 20) {
    earnedWeight += COMPLETENESS_WEIGHTS.bio
    completed.push('bio')
  } else {
    missing.push({ field: 'bio', label: 'Ajoute une bio', weight: COMPLETENESS_WEIGHTS.bio })
  }
  totalWeight += COMPLETENESS_WEIGHTS.bio

  // Check languages
  if (profileData.languages && profileData.languages.length > 0) {
    earnedWeight += COMPLETENESS_WEIGHTS.languages
    completed.push('languages')
  } else {
    missing.push({ field: 'languages', label: 'Indique tes langues parlees', weight: COMPLETENESS_WEIGHTS.languages })
  }
  totalWeight += COMPLETENESS_WEIGHTS.languages

  // Check countries visited
  if (profileData.countriesVisited && profileData.countriesVisited.length > 0) {
    earnedWeight += COMPLETENESS_WEIGHTS.countriesVisited
    completed.push('countriesVisited')
  } else {
    missing.push({ field: 'countriesVisited', label: 'Ajoute tes pays visites', weight: COMPLETENESS_WEIGHTS.countriesVisited })
  }
  totalWeight += COMPLETENESS_WEIGHTS.countriesVisited

  // Check travel style
  if (profileData.travelStyle) {
    earnedWeight += COMPLETENESS_WEIGHTS.travelStyle
    completed.push('travelStyle')
  } else {
    missing.push({ field: 'travelStyle', label: 'Choisis ton style de voyage', weight: COMPLETENESS_WEIGHTS.travelStyle })
  }
  totalWeight += COMPLETENESS_WEIGHTS.travelStyle

  // Check preferred vehicle
  if (profileData.preferredVehicle) {
    earnedWeight += COMPLETENESS_WEIGHTS.preferredVehicle
    completed.push('preferredVehicle')
  } else {
    missing.push({ field: 'preferredVehicle', label: 'Indique ton type de vehicule prefere', weight: COMPLETENESS_WEIGHTS.preferredVehicle })
  }
  totalWeight += COMPLETENESS_WEIGHTS.preferredVehicle

  // Check availability
  if (profileData.availability) {
    earnedWeight += COMPLETENESS_WEIGHTS.availability
    completed.push('availability')
  } else {
    missing.push({ field: 'availability', label: 'Indique ta disponibilite', weight: COMPLETENESS_WEIGHTS.availability })
  }
  totalWeight += COMPLETENESS_WEIGHTS.availability

  // Check social links (at least one)
  if (profileData.socialLinks && Object.keys(profileData.socialLinks).filter(k => profileData.socialLinks[k]).length > 0) {
    earnedWeight += COMPLETENESS_WEIGHTS.socialLinks
    completed.push('socialLinks')
  } else {
    missing.push({ field: 'socialLinks', label: 'Ajoute au moins un lien social', weight: COMPLETENESS_WEIGHTS.socialLinks })
  }
  totalWeight += COMPLETENESS_WEIGHTS.socialLinks

  // Check profile photo
  if (profileData.profilePhoto) {
    earnedWeight += COMPLETENESS_WEIGHTS.profilePhoto
    completed.push('profilePhoto')
  } else {
    missing.push({ field: 'profilePhoto', label: 'Ajoute une photo de profil', weight: COMPLETENESS_WEIGHTS.profilePhoto })
  }
  totalWeight += COMPLETENESS_WEIGHTS.profilePhoto

  const percentage = Math.round((earnedWeight / totalWeight) * 100)

  return {
    percentage,
    earnedWeight,
    totalWeight,
    completed,
    missing,
    isComplete: percentage === 100,
    nextStep: missing.length > 0 ? missing[0] : null,
  }
}

/**
 * Add a language to the profile
 * @param {string} langCode - Language code
 * @returns {Object} Result
 */
export function addLanguage(langCode) {
  if (!AVAILABLE_LANGUAGES[langCode]) {
    return { success: false, error: 'Langue invalide' }
  }

  const profile = getDetailedProfile()
  if (profile.languages.includes(langCode)) {
    return { success: false, error: 'Langue deja ajoutee' }
  }

  const languages = [...profile.languages, langCode]
  return updateDetailedProfile({ languages })
}

/**
 * Remove a language from the profile
 * @param {string} langCode - Language code
 * @returns {Object} Result
 */
export function removeLanguage(langCode) {
  const profile = getDetailedProfile()
  const languages = profile.languages.filter(l => l !== langCode)
  return updateDetailedProfile({ languages })
}

/**
 * Add a country to visited countries
 * @param {string} countryCode - Country code
 * @returns {Object} Result
 */
export function addCountryVisited(countryCode) {
  if (!EUROPEAN_COUNTRIES[countryCode]) {
    return { success: false, error: 'Pays invalide' }
  }

  const profile = getDetailedProfile()
  if (profile.countriesVisited.includes(countryCode)) {
    return { success: false, error: 'Pays deja ajoute' }
  }

  const countriesVisited = [...profile.countriesVisited, countryCode]
  return updateDetailedProfile({ countriesVisited })
}

/**
 * Remove a country from visited countries
 * @param {string} countryCode - Country code
 * @returns {Object} Result
 */
export function removeCountryVisited(countryCode) {
  const profile = getDetailedProfile()
  const countriesVisited = profile.countriesVisited.filter(c => c !== countryCode)
  return updateDetailedProfile({ countriesVisited })
}

/**
 * Update bio
 * @param {string} bio - New bio text
 * @returns {Object} Result
 */
export function updateBio(bio) {
  return updateDetailedProfile({ bio })
}

/**
 * Set travel style
 * @param {string} style - Travel style ID
 * @returns {Object} Result
 */
export function setTravelStyle(style) {
  return updateDetailedProfile({ travelStyle: style })
}

/**
 * Set preferred vehicle
 * @param {string} vehicle - Vehicle type ID
 * @returns {Object} Result
 */
export function setPreferredVehicle(vehicle) {
  return updateDetailedProfile({ preferredVehicle: vehicle })
}

/**
 * Set availability
 * @param {string} availability - Availability ID
 * @param {string} details - Additional details
 * @returns {Object} Result
 */
export function setAvailability(availability, details = '') {
  return updateDetailedProfile({ availability, availabilityDetails: details })
}

/**
 * Update a social link
 * @param {string} platform - Platform ID
 * @param {string} value - Username or URL
 * @returns {Object} Result
 */
export function updateSocialLink(platform, value) {
  if (!SOCIAL_LINK_TYPES[platform]) {
    return { success: false, error: 'Plateforme invalide' }
  }

  const profile = getDetailedProfile()
  const socialLinks = { ...profile.socialLinks, [platform]: value }

  // Remove empty links
  if (!value) {
    delete socialLinks[platform]
  }

  return updateDetailedProfile({ socialLinks })
}

/**
 * Get full social link URL
 * @param {string} platform - Platform ID
 * @param {string} value - Username or URL
 * @returns {string} Full URL
 */
export function getSocialLinkUrl(platform, value) {
  const platformConfig = SOCIAL_LINK_TYPES[platform]
  if (!platformConfig || !value) return ''

  // If value is already a URL, return it
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  // Clean username (remove @ if present)
  const cleanValue = value.startsWith('@') ? value.substring(1) : value

  return platformConfig.baseUrl + cleanValue
}

/**
 * Render detailed profile HTML
 * @param {Object} profile - Profile object
 * @param {Object} options - Rendering options
 * @returns {string} HTML string
 */
export function renderDetailedProfile(profile, options = {}) {
  const {
    showEditButtons = false,
    compact = false,
    showCompleteness = true,
  } = options

  const lang = getState().lang || 'fr'
  const completeness = getProfileCompleteness(profile)

  // Escape HTML to prevent XSS
  const escapeHtml = (str) => {
    if (!str) return ''
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  // Render languages
  const languagesHtml = profile.languages && profile.languages.length > 0
    ? profile.languages.map(code => {
        const lang = AVAILABLE_LANGUAGES[code]
        return lang ? `<span class="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full text-sm">${lang.flag} ${lang.name}</span>` : ''
      }).join('')
    : '<span class="text-slate-500 text-sm">Aucune langue ajoutee</span>'

  // Render countries
  const countriesHtml = profile.countriesVisited && profile.countriesVisited.length > 0
    ? profile.countriesVisited.map(code => {
        const country = EUROPEAN_COUNTRIES[code]
        return country ? `<span class="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full text-sm" title="${country.name}">${country.flag}</span>` : ''
      }).join('')
    : '<span class="text-slate-500 text-sm">Aucun pays ajoute</span>'

  // Render travel style
  const travelStyle = profile.travelStyle ? TRAVEL_STYLES[profile.travelStyle] : null
  const travelStyleHtml = travelStyle
    ? `<span class="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/20 rounded-full text-sm">${travelStyle.icon} ${travelStyle.name}</span>`
    : '<span class="text-slate-500 text-sm">Non defini</span>'

  // Render preferred vehicle
  const vehicle = profile.preferredVehicle ? PREFERRED_VEHICLES[profile.preferredVehicle] : null
  const vehicleHtml = vehicle
    ? `<span class="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full text-sm">${vehicle.icon} ${vehicle.name}</span>`
    : '<span class="text-slate-500 text-sm">Non defini</span>'

  // Render availability
  const availability = profile.availability ? AVAILABILITY_OPTIONS[profile.availability] : null
  const availabilityHtml = availability
    ? `<span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm" style="background: ${availability.color}20; color: ${availability.color}">${availability.icon} ${availability.name}</span>`
    : '<span class="text-slate-500 text-sm">Non defini</span>'

  // Render social links
  const socialLinksHtml = profile.socialLinks && Object.keys(profile.socialLinks).filter(k => profile.socialLinks[k]).length > 0
    ? Object.entries(profile.socialLinks)
        .filter(([_, value]) => value)
        .map(([platform, value]) => {
          const config = SOCIAL_LINK_TYPES[platform]
          if (!config) return ''
          const url = getSocialLinkUrl(platform, value)
          return `
            <a
              href="${escapeHtml(url)}"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              style="color: ${config.color}"
              aria-label="${config.name}"
            >
              <i class="${config.icon}" aria-hidden="true"></i>
              <span class="text-sm text-white">${config.name}</span>
            </a>
          `
        }).join('')
    : '<span class="text-slate-500 text-sm">Aucun lien social ajoute</span>'

  // Render completeness bar if enabled
  const completenessHtml = showCompleteness && !completeness.isComplete
    ? `
      <div class="mb-6 p-4 bg-white/5 rounded-xl">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium">Profil complete a ${completeness.percentage}%</span>
          ${completeness.nextStep ? `<span class="text-xs text-primary-400">${completeness.nextStep.label}</span>` : ''}
        </div>
        <div class="h-2 bg-white/10 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all" style="width: ${completeness.percentage}%"></div>
        </div>
      </div>
    `
    : ''

  return `
    <div class="detailed-profile space-y-6" data-user-id="${escapeHtml(profile.userId)}">
      ${completenessHtml}

      ${!compact ? `
        <!-- Bio Section -->
        <section class="profile-section" aria-labelledby="bio-heading">
          <div class="flex items-center justify-between mb-3">
            <h3 id="bio-heading" class="font-semibold flex items-center gap-2">
              <span>📝</span> Bio
            </h3>
            ${showEditButtons ? '<button onclick="editProfileBio()" class="text-primary-400 text-sm hover:underline">Modifier</button>' : ''}
          </div>
          <p class="text-slate-300 whitespace-pre-wrap">${escapeHtml(profile.bio) || '<span class="text-slate-500 italic">Pas de bio</span>'}</p>
        </section>
      ` : ''}

      <!-- Languages Section -->
      <section class="profile-section" aria-labelledby="languages-heading">
        <div class="flex items-center justify-between mb-3">
          <h3 id="languages-heading" class="font-semibold flex items-center gap-2">
            <span>🗣️</span> Langues parlees
          </h3>
          ${showEditButtons ? '<button onclick="editProfileLanguages()" class="text-primary-400 text-sm hover:underline">Modifier</button>' : ''}
        </div>
        <div class="flex flex-wrap gap-2">
          ${languagesHtml}
        </div>
      </section>

      <!-- Countries Visited Section -->
      <section class="profile-section" aria-labelledby="countries-heading">
        <div class="flex items-center justify-between mb-3">
          <h3 id="countries-heading" class="font-semibold flex items-center gap-2">
            <span>🌍</span> Pays visites (${profile.countriesVisited?.length || 0})
          </h3>
          ${showEditButtons ? '<button onclick="editProfileCountries()" class="text-primary-400 text-sm hover:underline">Modifier</button>' : ''}
        </div>
        <div class="flex flex-wrap gap-2">
          ${countriesHtml}
        </div>
      </section>

      <!-- Travel Preferences Section -->
      <section class="profile-section" aria-labelledby="preferences-heading">
        <div class="flex items-center justify-between mb-3">
          <h3 id="preferences-heading" class="font-semibold flex items-center gap-2">
            <span>🎒</span> Preferences de voyage
          </h3>
          ${showEditButtons ? '<button onclick="editProfilePreferences()" class="text-primary-400 text-sm hover:underline">Modifier</button>' : ''}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div class="text-xs text-slate-500 mb-1">Style de voyage</div>
            ${travelStyleHtml}
          </div>
          <div>
            <div class="text-xs text-slate-500 mb-1">Vehicule prefere</div>
            ${vehicleHtml}
          </div>
          <div>
            <div class="text-xs text-slate-500 mb-1">Disponibilite</div>
            ${availabilityHtml}
          </div>
        </div>
        ${profile.availabilityDetails ? `<p class="mt-2 text-sm text-slate-400">${escapeHtml(profile.availabilityDetails)}</p>` : ''}
      </section>

      ${profile.travelExperience > 0 ? `
        <!-- Experience Section -->
        <section class="profile-section" aria-labelledby="experience-heading">
          <div class="flex items-center gap-2 mb-2">
            <h3 id="experience-heading" class="font-semibold flex items-center gap-2">
              <span>⭐</span> Experience
            </h3>
          </div>
          <p class="text-slate-300">${profile.travelExperience} ${profile.travelExperience === 1 ? 'an' : 'ans'} d'autostop</p>
        </section>
      ` : ''}

      ${profile.tips ? `
        <!-- Tips Section -->
        <section class="profile-section" aria-labelledby="tips-heading">
          <div class="flex items-center gap-2 mb-2">
            <h3 id="tips-heading" class="font-semibold flex items-center gap-2">
              <span>💡</span> Conseils
            </h3>
          </div>
          <p class="text-slate-300 whitespace-pre-wrap">${escapeHtml(profile.tips)}</p>
        </section>
      ` : ''}

      <!-- Social Links Section -->
      <section class="profile-section" aria-labelledby="social-heading">
        <div class="flex items-center justify-between mb-3">
          <h3 id="social-heading" class="font-semibold flex items-center gap-2">
            <span>🔗</span> Liens sociaux
          </h3>
          ${showEditButtons ? '<button onclick="editProfileSocialLinks()" class="text-primary-400 text-sm hover:underline">Modifier</button>' : ''}
        </div>
        <div class="flex flex-wrap gap-2">
          ${socialLinksHtml}
        </div>
      </section>
    </div>
  `
}

/**
 * Render profile edit form HTML
 * @param {Object} profile - Profile object
 * @returns {string} HTML string
 */
export function renderProfileEditForm(profile) {
  const escapeHtml = (str) => {
    if (!str) return ''
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  return `
    <form id="profile-edit-form" class="space-y-6" onsubmit="handleProfileFormSubmit(event)">
      <!-- Bio -->
      <div class="form-group">
        <label for="profile-bio" class="block text-sm font-medium mb-2">Bio</label>
        <textarea
          id="profile-bio"
          name="bio"
          rows="4"
          maxlength="500"
          class="w-full p-3 bg-white/10 border border-white/20 rounded-xl focus:border-primary-500 focus:outline-none resize-none"
          placeholder="Presente-toi en quelques mots..."
        >${escapeHtml(profile.bio)}</textarea>
        <div class="text-xs text-slate-500 mt-1">
          <span id="bio-char-count">${profile.bio?.length || 0}</span>/500 caracteres
        </div>
      </div>

      <!-- Travel Style -->
      <div class="form-group">
        <label class="block text-sm font-medium mb-2">Style de voyage</label>
        <div class="grid grid-cols-2 gap-2">
          ${Object.values(TRAVEL_STYLES).map(style => `
            <label class="relative cursor-pointer">
              <input
                type="radio"
                name="travelStyle"
                value="${style.id}"
                ${profile.travelStyle === style.id ? 'checked' : ''}
                class="sr-only peer"
              />
              <div class="p-3 rounded-xl border-2 border-white/20 peer-checked:border-primary-500 peer-checked:bg-primary-500/10 transition-all">
                <span class="text-xl mr-2">${style.icon}</span>
                <span class="font-medium">${style.name}</span>
              </div>
            </label>
          `).join('')}
        </div>
      </div>

      <!-- Preferred Vehicle -->
      <div class="form-group">
        <label class="block text-sm font-medium mb-2">Vehicule prefere</label>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          ${Object.values(PREFERRED_VEHICLES).map(vehicle => `
            <label class="relative cursor-pointer">
              <input
                type="radio"
                name="preferredVehicle"
                value="${vehicle.id}"
                ${profile.preferredVehicle === vehicle.id ? 'checked' : ''}
                class="sr-only peer"
              />
              <div class="p-3 rounded-xl border-2 border-white/20 peer-checked:border-primary-500 peer-checked:bg-primary-500/10 transition-all text-center">
                <span class="text-2xl block mb-1">${vehicle.icon}</span>
                <span class="text-sm font-medium">${vehicle.name}</span>
              </div>
            </label>
          `).join('')}
        </div>
      </div>

      <!-- Availability -->
      <div class="form-group">
        <label class="block text-sm font-medium mb-2">Disponibilite</label>
        <div class="grid grid-cols-2 gap-2">
          ${Object.values(AVAILABILITY_OPTIONS).map(option => `
            <label class="relative cursor-pointer">
              <input
                type="radio"
                name="availability"
                value="${option.id}"
                ${profile.availability === option.id ? 'checked' : ''}
                class="sr-only peer"
              />
              <div class="p-3 rounded-xl border-2 border-white/20 peer-checked:border-primary-500 peer-checked:bg-primary-500/10 transition-all">
                <span class="text-xl mr-2">${option.icon}</span>
                <span class="font-medium">${option.name}</span>
              </div>
            </label>
          `).join('')}
        </div>
      </div>

      <!-- Travel Experience -->
      <div class="form-group">
        <label for="profile-experience" class="block text-sm font-medium mb-2">
          Experience d'autostop (annees)
        </label>
        <input
          type="number"
          id="profile-experience"
          name="travelExperience"
          min="0"
          max="50"
          value="${profile.travelExperience || 0}"
          class="w-full p-3 bg-white/10 border border-white/20 rounded-xl focus:border-primary-500 focus:outline-none"
        />
      </div>

      <!-- Tips -->
      <div class="form-group">
        <label for="profile-tips" class="block text-sm font-medium mb-2">Tes conseils de routard</label>
        <textarea
          id="profile-tips"
          name="tips"
          rows="3"
          maxlength="300"
          class="w-full p-3 bg-white/10 border border-white/20 rounded-xl focus:border-primary-500 focus:outline-none resize-none"
          placeholder="Partage tes astuces..."
        >${escapeHtml(profile.tips)}</textarea>
      </div>

      <!-- Submit -->
      <div class="flex gap-3">
        <button
          type="submit"
          class="flex-1 btn btn-primary"
        >
          Enregistrer
        </button>
        <button
          type="button"
          onclick="closeProfileEdit()"
          class="btn btn-secondary"
        >
          Annuler
        </button>
      </div>
    </form>
  `
}

/**
 * Delete detailed profile
 * @param {string} userId - User ID (optional)
 * @returns {Object} Result
 */
export function deleteDetailedProfile(userId = null) {
  const state = getState()
  const targetUserId = userId || state.user?.uid || 'anonymous'

  const profiles = getProfilesFromStorage()

  if (!profiles[targetUserId]) {
    return { success: false, error: 'Profil non trouve' }
  }

  delete profiles[targetUserId]
  saveProfilesToStorage(profiles)

  setState({ detailedProfile: null })

  return { success: true }
}

/**
 * Export profile data (for GDPR compliance)
 * @param {string} userId - User ID (optional)
 * @returns {Object} Profile data
 */
export function exportProfileData(userId = null) {
  const profile = getDetailedProfile(userId)
  return {
    exportedAt: new Date().toISOString(),
    profile,
  }
}

/**
 * Search profiles by criteria
 * @param {Object} criteria - Search criteria
 * @returns {Array} Matching profiles
 */
export function searchProfiles(criteria = {}) {
  const profiles = getProfilesFromStorage()
  const results = []

  for (const [userId, profile] of Object.entries(profiles)) {
    let matches = true

    // Filter by language
    if (criteria.language && profile.languages) {
      if (!profile.languages.includes(criteria.language)) {
        matches = false
      }
    }

    // Filter by country visited
    if (criteria.countryVisited && profile.countriesVisited) {
      if (!profile.countriesVisited.includes(criteria.countryVisited)) {
        matches = false
      }
    }

    // Filter by travel style
    if (criteria.travelStyle && profile.travelStyle !== criteria.travelStyle) {
      matches = false
    }

    // Filter by availability
    if (criteria.availability && profile.availability !== criteria.availability) {
      matches = false
    }

    // Filter by minimum experience
    if (criteria.minExperience && (profile.travelExperience || 0) < criteria.minExperience) {
      matches = false
    }

    if (matches) {
      results.push({ userId, ...profile })
    }
  }

  return results
}

// Register global handlers
if (typeof window !== 'undefined') {
  window.editProfileBio = () => setState({ showProfileBioEdit: true })
  window.editProfileLanguages = () => setState({ showProfileLanguagesEdit: true })
  window.editProfileCountries = () => setState({ showProfileCountriesEdit: true })
  window.editProfilePreferences = () => setState({ showProfilePreferencesEdit: true })
  window.editProfileSocialLinks = () => setState({ showProfileSocialLinksEdit: true })
  window.closeProfileEdit = () => setState({
    showProfileBioEdit: false,
    showProfileLanguagesEdit: false,
    showProfileCountriesEdit: false,
    showProfilePreferencesEdit: false,
    showProfileSocialLinksEdit: false,
  })
  window.handleProfileFormSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    const data = Object.fromEntries(formData.entries())

    // Parse numeric fields
    if (data.travelExperience) {
      data.travelExperience = parseInt(data.travelExperience, 10)
    }

    updateDetailedProfile(data)
    window.closeProfileEdit()
  }
}

export default {
  AVAILABLE_LANGUAGES,
  EUROPEAN_COUNTRIES,
  TRAVEL_STYLES,
  PREFERRED_VEHICLES,
  AVAILABILITY_OPTIONS,
  SOCIAL_LINK_TYPES,
  createDefaultProfile,
  getDetailedProfile,
  updateDetailedProfile,
  validateProfileData,
  getProfileCompleteness,
  addLanguage,
  removeLanguage,
  addCountryVisited,
  removeCountryVisited,
  updateBio,
  setTravelStyle,
  setPreferredVehicle,
  setAvailability,
  updateSocialLink,
  getSocialLinkUrl,
  renderDetailedProfile,
  renderProfileEditForm,
  deleteDetailedProfile,
  exportProfileData,
  searchProfiles,
}
