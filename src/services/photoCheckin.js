/**
 * Photo Check-in Service
 * Handles photo validation for spot creation and check-ins
 *
 * Rules:
 * - Spot creation: Photo is REQUIRED (1 photo obligatoire)
 * - Check-in: Photo is OPTIONAL but gives +15 bonus points
 * - Photo rotation: Keep maximum 5 photos per spot (FIFO)
 * - Creator's original photo is ALWAYS preserved (never removed by rotation)
 */

import { getState, setState } from '../stores/state.js'
import { showToast } from './notifications.js'

// Configuration constants
export const PHOTO_CONFIG = {
  // Points
  CHECKIN_PHOTO_BONUS: 15,
  SPOT_CREATION_POINTS: 20,

  // Photo rotation
  MAX_PHOTOS_PER_SPOT: 5, // Maximum 5 photos per spot (FIFO)

  // File constraints
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],

  // Compression
  COMPRESSION_QUALITY: 0.8,
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1080,
}

// Storage key for photo rotation config
const STORAGE_KEY = 'spothitch_photoRotationConfig'

/**
 * Photo validation status enum
 */
export const PhotoValidationStatus = {
  VALID: 'valid',
  INVALID_TYPE: 'invalid_type',
  TOO_LARGE: 'too_large',
  MISSING: 'missing',
  COMPRESSION_FAILED: 'compression_failed',
}

/**
 * Validate if photo is required for a given action
 * @param {string} action - 'create_spot' or 'checkin'
 * @returns {boolean} Whether photo is required
 */
export function isPhotoRequired(action) {
  if (action === 'create_spot') {
    return true
  }
  if (action === 'checkin') {
    return false
  }
  // Unknown action - default to not required
  return false
}

/**
 * Get bonus points for adding a photo to a check-in
 * @returns {number} Bonus points for photo
 */
export function getCheckinPhotoBonus() {
  return PHOTO_CONFIG.CHECKIN_PHOTO_BONUS
}

/**
 * Validate a photo file
 * @param {File|Blob|null} file - The photo file to validate
 * @param {string} action - 'create_spot' or 'checkin'
 * @returns {{valid: boolean, status: string, message: string}}
 */
export function validatePhoto(file, action = 'checkin') {
  // Check if photo is required and missing
  if (!file) {
    if (isPhotoRequired(action)) {
      return {
        valid: false,
        status: PhotoValidationStatus.MISSING,
        message: 'Une photo est requise pour creer un spot',
      }
    }
    // Photo optional for check-in
    return {
      valid: true,
      status: PhotoValidationStatus.VALID,
      message: 'Photo optionnelle',
    }
  }

  // Validate file type
  if (!PHOTO_CONFIG.ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      status: PhotoValidationStatus.INVALID_TYPE,
      message: `Format non supporte. Utilisez: ${PHOTO_CONFIG.ALLOWED_TYPES.map(t => t.split('/')[1].toUpperCase()).join(', ')}`,
    }
  }

  // Validate file size
  const maxSizeBytes = PHOTO_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      status: PhotoValidationStatus.TOO_LARGE,
      message: `Fichier trop volumineux. Maximum: ${PHOTO_CONFIG.MAX_FILE_SIZE_MB}MB`,
    }
  }

  return {
    valid: true,
    status: PhotoValidationStatus.VALID,
    message: 'Photo valide',
  }
}

/**
 * Calculate total points for a check-in
 * @param {Object} options - Check-in options
 * @param {boolean} options.hasPhoto - Whether check-in includes a photo
 * @param {number} options.basePoints - Base check-in points (default 5)
 * @param {Object} options.characteristics - Confirmed spot characteristics
 * @returns {{total: number, breakdown: Object}}
 */
export function calculateCheckinPoints(options = {}) {
  const {
    hasPhoto = false,
    basePoints = 5,
    characteristics = {},
  } = options

  const breakdown = {
    base: basePoints,
    photo: 0,
    details: 0,
  }

  // Photo bonus
  if (hasPhoto) {
    breakdown.photo = PHOTO_CONFIG.CHECKIN_PHOTO_BONUS
  }

  // Details bonus (if 3+ characteristics confirmed)
  const confirmedCount = Object.values(characteristics).filter(Boolean).length
  if (confirmedCount >= 3) {
    breakdown.details = 5
  }

  const total = breakdown.base + breakdown.photo + breakdown.details

  return { total, breakdown }
}

/**
 * Get the photos for a spot, sorted by date (newest first)
 * @param {string} spotId - The spot ID
 * @returns {Object[]} Array of photo objects sorted by date
 */
export function getSpotPhotos(spotId) {
  if (!spotId) return []

  const state = getState()
  const spotPhotos = state.spotPhotos || {}
  const photos = spotPhotos[spotId] || []

  // Sort by date descending (newest first)
  return [...photos].sort((a, b) => {
    const dateA = new Date(a.timestamp || a.createdAt || 0)
    const dateB = new Date(b.timestamp || b.createdAt || 0)
    return dateB - dateA
  })
}

/**
 * Add a photo to a spot with rotation
 * Keeps only MAX_PHOTOS_PER_SPOT (5) photos, but ALWAYS preserves creator's original photo
 * @param {string} spotId - The spot ID
 * @param {Object} photoData - Photo data to add
 * @param {string} photoData.url - Photo URL
 * @param {string} photoData.userId - User who added the photo
 * @param {string} [photoData.type] - 'creation' or 'checkin'
 * @param {boolean} [photoData.isCreator] - Whether this is the original creator's photo
 * @returns {{added: boolean, removed: Object[], photos: Object[]}}
 */
export function addPhotoToSpot(spotId, photoData) {
  if (!spotId || !photoData?.url) {
    return { added: false, removed: [], photos: [] }
  }

  const state = getState()
  const spotPhotos = { ...(state.spotPhotos || {}) }
  const currentPhotos = [...(spotPhotos[spotId] || [])]

  // Create new photo entry
  const newPhoto = {
    id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    url: photoData.url,
    userId: photoData.userId || state.user?.uid || 'anonymous',
    type: photoData.type || 'checkin',
    isCreator: photoData.isCreator || false,
    timestamp: new Date().toISOString(),
    spotId,
  }

  // Add to beginning (newest first)
  currentPhotos.unshift(newPhoto)

  // Apply rotation - keep only MAX_PHOTOS_PER_SPOT
  // IMPORTANT: Never remove the creator's original photo
  const removed = []
  const maxPhotos = getPhotoRotationConfig().maxPhotos

  while (currentPhotos.length > maxPhotos) {
    // Find the oldest non-creator photo to remove
    let indexToRemove = -1
    for (let i = currentPhotos.length - 1; i >= 0; i--) {
      if (!currentPhotos[i].isCreator) {
        indexToRemove = i
        break
      }
    }

    if (indexToRemove !== -1) {
      const removedPhoto = currentPhotos.splice(indexToRemove, 1)[0]
      removed.push(removedPhoto)
    } else {
      // All remaining photos are creator photos - should not happen normally
      // but we stop rotation to preserve creator's photo
      console.warn(`[PhotoCheckin] Cannot remove more photos - only creator photos remain`)
      break
    }
  }

  // Update state
  spotPhotos[spotId] = currentPhotos
  setState({ spotPhotos })

  // Log removed photos for cleanup
  if (removed.length > 0) {
    console.log(`[PhotoCheckin] Removed ${removed.length} old photo(s) from spot ${spotId}`)
  }

  return {
    added: true,
    removed,
    photos: currentPhotos,
    newPhoto,
  }
}

/**
 * Remove a specific photo from a spot
 * @param {string} spotId - The spot ID
 * @param {string} photoId - The photo ID to remove
 * @returns {{removed: boolean, photo: Object|null}}
 */
export function removePhotoFromSpot(spotId, photoId) {
  if (!spotId || !photoId) {
    return { removed: false, photo: null }
  }

  const state = getState()
  const spotPhotos = { ...(state.spotPhotos || {}) }
  const currentPhotos = [...(spotPhotos[spotId] || [])]

  const photoIndex = currentPhotos.findIndex(p => p.id === photoId)
  if (photoIndex === -1) {
    return { removed: false, photo: null }
  }

  const [removedPhoto] = currentPhotos.splice(photoIndex, 1)
  spotPhotos[spotId] = currentPhotos
  setState({ spotPhotos })

  return { removed: true, photo: removedPhoto }
}

/**
 * Get photo count for a spot
 * @param {string} spotId - The spot ID
 * @returns {number} Number of photos
 */
export function getPhotoCount(spotId) {
  const photos = getSpotPhotos(spotId)
  return photos.length
}

/**
 * Check if a spot has reached the maximum photo limit
 * @param {string} spotId - The spot ID
 * @returns {boolean} Whether spot is at max photos
 */
export function isAtMaxPhotos(spotId) {
  return getPhotoCount(spotId) >= PHOTO_CONFIG.MAX_PHOTOS_PER_SPOT
}

/**
 * Get the oldest photo that would be removed if a new one is added
 * @param {string} spotId - The spot ID
 * @returns {Object|null} The oldest photo or null
 */
export function getOldestPhoto(spotId) {
  const photos = getSpotPhotos(spotId)
  if (photos.length < PHOTO_CONFIG.MAX_PHOTOS_PER_SPOT) {
    return null
  }
  // Photos are sorted newest first, so oldest is last
  return photos[photos.length - 1]
}

/**
 * Process a check-in with optional photo
 * @param {Object} checkinData - Check-in data
 * @param {string} checkinData.spotId - Spot being checked in
 * @param {string} [checkinData.photoUrl] - Optional photo URL
 * @param {Object} [checkinData.characteristics] - Confirmed characteristics
 * @returns {{success: boolean, points: number, breakdown: Object, photoAdded: boolean}}
 */
export async function processCheckin(checkinData) {
  const { spotId, photoUrl, characteristics = {} } = checkinData

  if (!spotId) {
    return {
      success: false,
      points: 0,
      breakdown: {},
      photoAdded: false,
      error: 'Spot ID requis',
    }
  }

  const state = getState()
  const hasPhoto = !!photoUrl
  let photoAdded = false
  let removedPhotos = []

  // Calculate points
  const { total, breakdown } = calculateCheckinPoints({
    hasPhoto,
    characteristics,
  })

  // Add photo to spot if provided
  if (hasPhoto) {
    const result = addPhotoToSpot(spotId, {
      url: photoUrl,
      userId: state.user?.uid,
      type: 'checkin',
      isCreator: false, // Check-in photos are not creator photos
    })
    photoAdded = result.added
    removedPhotos = result.removed
  }

  // Show toast with points breakdown
  if (hasPhoto && photoAdded) {
    showToast(`+${PHOTO_CONFIG.CHECKIN_PHOTO_BONUS} points bonus pour la photo !`, 'success')
  }

  return {
    success: true,
    points: total,
    breakdown,
    photoAdded,
    removedPhotos,
  }
}

/**
 * Validate spot creation requirements
 * @param {Object} spotData - Spot data to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateSpotCreation(spotData) {
  const errors = []

  // Check required fields
  if (!spotData.from?.trim()) {
    errors.push('Le champ "Depuis" est requis')
  }

  if (!spotData.to?.trim()) {
    errors.push('Le champ "Vers" est requis')
  }

  // Photo is required for spot creation
  if (!spotData.photo && !spotData.photoUrl) {
    errors.push('Une photo est requise pour creer un spot')
  }

  // Validate photo if provided
  if (spotData.photo) {
    const photoValidation = validatePhoto(spotData.photo, 'create_spot')
    if (!photoValidation.valid) {
      errors.push(photoValidation.message)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get photo statistics for a user
 * @param {string} userId - User ID (optional, defaults to current user)
 * @returns {{totalPhotos: number, spotsWithPhotos: number, checkinPhotos: number, creationPhotos: number}}
 */
export function getUserPhotoStats(userId) {
  const state = getState()
  const targetUserId = userId || state.user?.uid
  const spotPhotos = state.spotPhotos || {}

  let totalPhotos = 0
  let spotsWithPhotos = 0
  let checkinPhotos = 0
  let creationPhotos = 0

  for (const photos of Object.values(spotPhotos)) {
    const userPhotos = photos.filter(p => p.userId === targetUserId)
    if (userPhotos.length > 0) {
      spotsWithPhotos++
      totalPhotos += userPhotos.length
      checkinPhotos += userPhotos.filter(p => p.type === 'checkin').length
      creationPhotos += userPhotos.filter(p => p.type === 'creation').length
    }
  }

  return {
    totalPhotos,
    spotsWithPhotos,
    checkinPhotos,
    creationPhotos,
  }
}

/**
 * Clean up old photos (can be called periodically)
 * Removes excess photos but ALWAYS preserves creator's original photo
 * @param {number} maxAgeMs - Maximum age in milliseconds (default: 30 days)
 * @returns {{cleaned: number, spots: string[]}}
 */
export function cleanupOldPhotos(maxAgeMs = 30 * 24 * 60 * 60 * 1000) {
  const state = getState()
  const spotPhotos = { ...(state.spotPhotos || {}) }
  const maxPhotos = getPhotoRotationConfig().maxPhotos
  let cleaned = 0
  const affectedSpots = []

  for (const [spotId, photos] of Object.entries(spotPhotos)) {
    const originalCount = photos.length

    // Sort by timestamp (newest first)
    const sortedPhotos = [...photos].sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp)
    })

    // Separate creator and non-creator photos
    const creatorPhotos = sortedPhotos.filter(p => p.isCreator)
    const nonCreatorPhotos = sortedPhotos.filter(p => !p.isCreator)

    // Keep all creator photos + most recent non-creator photos up to maxPhotos
    const availableSlots = Math.max(0, maxPhotos - creatorPhotos.length)
    const photosToKeep = [
      ...creatorPhotos,
      ...nonCreatorPhotos.slice(0, availableSlots),
    ]

    // Sort final list by timestamp (newest first)
    photosToKeep.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    if (photosToKeep.length < originalCount) {
      spotPhotos[spotId] = photosToKeep
      const removedCount = originalCount - photosToKeep.length
      cleaned += removedCount
      affectedSpots.push(spotId)
    }
  }

  if (cleaned > 0) {
    setState({ spotPhotos })
    console.log(`[PhotoCheckin] Cleaned ${cleaned} photos from ${affectedSpots.length} spots`)
  }

  return { cleaned, spots: affectedSpots }
}

/**
 * Get photo rotation configuration
 * @returns {{maxPhotos: number}}
 */
export function getPhotoRotationConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const config = JSON.parse(stored)
      return { maxPhotos: config.maxPhotos || PHOTO_CONFIG.MAX_PHOTOS_PER_SPOT }
    }
  } catch (error) {
    console.error('[PhotoCheckin] Error reading config:', error)
  }
  return { maxPhotos: PHOTO_CONFIG.MAX_PHOTOS_PER_SPOT }
}

/**
 * Set maximum number of photos per spot
 * @param {number} max - Maximum number of photos (minimum 1)
 * @returns {boolean} Whether config was updated successfully
 */
export function setMaxPhotos(max) {
  if (typeof max !== 'number' || max < 1) {
    console.error('[PhotoCheckin] Invalid max photos value:', max)
    return false
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ maxPhotos: max }))
    return true
  } catch (error) {
    console.error('[PhotoCheckin] Error saving config:', error)
    return false
  }
}

/**
 * Add a photo to a spot (alias for consistency with design doc)
 * @param {string} spotId - The spot ID
 * @param {Object} photoData - Photo data to add
 * @param {boolean} [isCreator] - Whether this is the creator's photo
 * @returns {{added: boolean, removed: Object[], photos: Object[]}}
 */
export function addSpotPhoto(spotId, photoData, isCreator = false) {
  return addPhotoToSpot(spotId, { ...photoData, isCreator })
}

/**
 * Get photo rotation info for a spot
 * @param {string} spotId - The spot ID
 * @returns {{current: number, max: number, canAdd: boolean, willRemove: Object|null, creatorPhotoCount: number}}
 */
export function getPhotoRotationInfo(spotId) {
  const photos = getSpotPhotos(spotId)
  const current = photos.length
  const max = getPhotoRotationConfig().maxPhotos
  const canAdd = true // Always can add, rotation handles overflow
  const creatorPhotoCount = photos.filter(p => p.isCreator).length

  // Find oldest non-creator photo that would be removed
  let willRemove = null
  if (current >= max) {
    for (let i = photos.length - 1; i >= 0; i--) {
      if (!photos[i].isCreator) {
        willRemove = photos[i]
        break
      }
    }
  }

  return {
    current,
    max,
    canAdd,
    willRemove,
    creatorPhotoCount,
    percentFull: Math.round((current / max) * 100),
  }
}

// Export default object with all functions
export default {
  // Config
  PHOTO_CONFIG,
  PhotoValidationStatus,

  // Validation
  isPhotoRequired,
  validatePhoto,
  validateSpotCreation,

  // Points
  getCheckinPhotoBonus,
  calculateCheckinPoints,

  // Photo management
  getSpotPhotos,
  addPhotoToSpot,
  addSpotPhoto,
  removePhotoFromSpot,
  getPhotoCount,
  isAtMaxPhotos,
  getOldestPhoto,
  getPhotoRotationInfo,
  getPhotoRotationConfig,
  setMaxPhotos,

  // Check-in processing
  processCheckin,

  // Statistics
  getUserPhotoStats,

  // Cleanup
  cleanupOldPhotos,
}
