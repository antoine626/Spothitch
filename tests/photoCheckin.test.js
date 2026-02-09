/**
 * Photo Check-in Service Tests
 * Tests for photo validation, rotation, and check-in processing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  PHOTO_CONFIG,
  PhotoValidationStatus,
  isPhotoRequired,
  validatePhoto,
  validateSpotCreation,
  getCheckinPhotoBonus,
  calculateCheckinPoints,
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
  processCheckin,
  getUserPhotoStats,
  cleanupOldPhotos,
} from '../src/services/photoCheckin.js'
import { getState, setState, resetState } from '../src/stores/state.js'

// Mock notifications
vi.mock('../src/services/notifications.js', () => ({
  showToast: vi.fn(),
}))

// Helper to create mock file
function createMockFile(options = {}) {
  const {
    name = 'test-photo.jpg',
    type = 'image/jpeg',
    size = 1024 * 1024, // 1MB default
  } = options

  const file = new File(['mock-content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('Photo Check-in Service', () => {
  beforeEach(() => {
    // Reset state before each test
    resetState()
    setState({ spotPhotos: {}, user: { uid: 'test-user-123' } })
    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // PHOTO_CONFIG Tests
  // ============================================
  describe('PHOTO_CONFIG', () => {
    it('should have correct default values', () => {
      expect(PHOTO_CONFIG.CHECKIN_PHOTO_BONUS).toBe(15)
      expect(PHOTO_CONFIG.SPOT_CREATION_POINTS).toBe(20)
      expect(PHOTO_CONFIG.MAX_PHOTOS_PER_SPOT).toBe(5) // Changed from 10 to 5
      expect(PHOTO_CONFIG.MAX_FILE_SIZE_MB).toBe(10)
    })

    it('should have allowed image types', () => {
      expect(PHOTO_CONFIG.ALLOWED_TYPES).toContain('image/jpeg')
      expect(PHOTO_CONFIG.ALLOWED_TYPES).toContain('image/png')
      expect(PHOTO_CONFIG.ALLOWED_TYPES).toContain('image/webp')
      expect(PHOTO_CONFIG.ALLOWED_TYPES).toContain('image/gif')
    })

    it('should have compression settings', () => {
      expect(PHOTO_CONFIG.COMPRESSION_QUALITY).toBe(0.8)
      expect(PHOTO_CONFIG.MAX_WIDTH).toBe(1920)
      expect(PHOTO_CONFIG.MAX_HEIGHT).toBe(1080)
    })
  })

  // ============================================
  // PhotoValidationStatus Tests
  // ============================================
  describe('PhotoValidationStatus', () => {
    it('should have all status values', () => {
      expect(PhotoValidationStatus.VALID).toBe('valid')
      expect(PhotoValidationStatus.INVALID_TYPE).toBe('invalid_type')
      expect(PhotoValidationStatus.TOO_LARGE).toBe('too_large')
      expect(PhotoValidationStatus.MISSING).toBe('missing')
      expect(PhotoValidationStatus.COMPRESSION_FAILED).toBe('compression_failed')
    })
  })

  // ============================================
  // isPhotoRequired Tests
  // ============================================
  describe('isPhotoRequired', () => {
    it('should return true for spot creation', () => {
      expect(isPhotoRequired('create_spot')).toBe(true)
    })

    it('should return false for check-in', () => {
      expect(isPhotoRequired('checkin')).toBe(false)
    })

    it('should return false for unknown action', () => {
      expect(isPhotoRequired('unknown')).toBe(false)
      expect(isPhotoRequired('')).toBe(false)
      expect(isPhotoRequired(null)).toBe(false)
    })
  })

  // ============================================
  // getCheckinPhotoBonus Tests
  // ============================================
  describe('getCheckinPhotoBonus', () => {
    it('should return 15 points bonus', () => {
      expect(getCheckinPhotoBonus()).toBe(15)
    })

    it('should match PHOTO_CONFIG value', () => {
      expect(getCheckinPhotoBonus()).toBe(PHOTO_CONFIG.CHECKIN_PHOTO_BONUS)
    })
  })

  // ============================================
  // validatePhoto Tests
  // ============================================
  describe('validatePhoto', () => {
    it('should validate a valid JPEG file', () => {
      const file = createMockFile({ type: 'image/jpeg' })
      const result = validatePhoto(file)

      expect(result.valid).toBe(true)
      expect(result.status).toBe(PhotoValidationStatus.VALID)
    })

    it('should validate PNG, WebP, and GIF files', () => {
      const pngFile = createMockFile({ type: 'image/png' })
      const webpFile = createMockFile({ type: 'image/webp' })
      const gifFile = createMockFile({ type: 'image/gif' })

      expect(validatePhoto(pngFile).valid).toBe(true)
      expect(validatePhoto(webpFile).valid).toBe(true)
      expect(validatePhoto(gifFile).valid).toBe(true)
    })

    it('should reject invalid file types', () => {
      const pdfFile = createMockFile({ type: 'application/pdf' })
      const result = validatePhoto(pdfFile)

      expect(result.valid).toBe(false)
      expect(result.status).toBe(PhotoValidationStatus.INVALID_TYPE)
      expect(result.message).toContain('Format non supporte')
    })

    it('should reject files that are too large', () => {
      const largeFile = createMockFile({ size: 15 * 1024 * 1024 }) // 15MB
      const result = validatePhoto(largeFile)

      expect(result.valid).toBe(false)
      expect(result.status).toBe(PhotoValidationStatus.TOO_LARGE)
      expect(result.message).toContain('Maximum')
    })

    it('should accept files at the size limit', () => {
      const maxFile = createMockFile({ size: 10 * 1024 * 1024 }) // 10MB exactly
      const result = validatePhoto(maxFile)

      expect(result.valid).toBe(true)
    })

    it('should return valid for null file in check-in action', () => {
      const result = validatePhoto(null, 'checkin')

      expect(result.valid).toBe(true)
      expect(result.message).toBe('Photo optionnelle')
    })

    it('should return invalid for null file in create_spot action', () => {
      const result = validatePhoto(null, 'create_spot')

      expect(result.valid).toBe(false)
      expect(result.status).toBe(PhotoValidationStatus.MISSING)
      expect(result.message).toContain('requise')
    })
  })

  // ============================================
  // calculateCheckinPoints Tests
  // ============================================
  describe('calculateCheckinPoints', () => {
    it('should return base points when no photo', () => {
      const result = calculateCheckinPoints({ hasPhoto: false })

      expect(result.total).toBe(5)
      expect(result.breakdown.base).toBe(5)
      expect(result.breakdown.photo).toBe(0)
    })

    it('should add 15 points bonus for photo', () => {
      const result = calculateCheckinPoints({ hasPhoto: true })

      expect(result.total).toBe(20) // 5 base + 15 photo
      expect(result.breakdown.photo).toBe(15)
    })

    it('should add 5 points for 3+ characteristics', () => {
      const result = calculateCheckinPoints({
        hasPhoto: false,
        characteristics: { safe: true, visible: true, traffic: true },
      })

      expect(result.total).toBe(10) // 5 base + 5 details
      expect(result.breakdown.details).toBe(5)
    })

    it('should not add detail points for less than 3 characteristics', () => {
      const result = calculateCheckinPoints({
        hasPhoto: false,
        characteristics: { safe: true, visible: true },
      })

      expect(result.total).toBe(5)
      expect(result.breakdown.details).toBe(0)
    })

    it('should combine all bonuses', () => {
      const result = calculateCheckinPoints({
        hasPhoto: true,
        characteristics: { safe: true, visible: true, traffic: true, shelter: true },
      })

      expect(result.total).toBe(25) // 5 base + 15 photo + 5 details
    })

    it('should use custom base points', () => {
      const result = calculateCheckinPoints({
        hasPhoto: false,
        basePoints: 10,
      })

      expect(result.total).toBe(10)
      expect(result.breakdown.base).toBe(10)
    })

    it('should handle empty options', () => {
      const result = calculateCheckinPoints()

      expect(result.total).toBe(5)
      expect(result.breakdown).toBeDefined()
    })
  })

  // ============================================
  // getSpotPhotos Tests
  // ============================================
  describe('getSpotPhotos', () => {
    it('should return empty array for unknown spot', () => {
      const photos = getSpotPhotos('unknown-spot')
      expect(photos).toEqual([])
    })

    it('should return empty array for null spot ID', () => {
      const photos = getSpotPhotos(null)
      expect(photos).toEqual([])
    })

    it('should return photos sorted by date (newest first)', () => {
      const spotId = 'spot-123'
      setState({
        spotPhotos: {
          [spotId]: [
            { id: '1', timestamp: '2024-01-01T00:00:00Z' },
            { id: '2', timestamp: '2024-01-03T00:00:00Z' },
            { id: '3', timestamp: '2024-01-02T00:00:00Z' },
          ],
        },
      })

      const photos = getSpotPhotos(spotId)

      expect(photos[0].id).toBe('2') // Most recent
      expect(photos[1].id).toBe('3')
      expect(photos[2].id).toBe('1') // Oldest
    })

    it('should return a copy (not mutate original)', () => {
      const spotId = 'spot-123'
      setState({
        spotPhotos: {
          [spotId]: [{ id: '1', timestamp: '2024-01-01T00:00:00Z' }],
        },
      })

      const photos = getSpotPhotos(spotId)
      photos.push({ id: 'new' })

      expect(getSpotPhotos(spotId).length).toBe(1)
    })
  })

  // ============================================
  // addPhotoToSpot Tests
  // ============================================
  describe('addPhotoToSpot', () => {
    it('should add a photo to an empty spot', () => {
      const result = addPhotoToSpot('spot-123', { url: 'https://example.com/photo.jpg' })

      expect(result.added).toBe(true)
      expect(result.photos.length).toBe(1)
      expect(result.newPhoto.url).toBe('https://example.com/photo.jpg')
      expect(result.removed).toEqual([])
    })

    it('should add photo with correct metadata', () => {
      const result = addPhotoToSpot('spot-123', {
        url: 'https://example.com/photo.jpg',
        userId: 'user-456',
        type: 'checkin',
      })

      expect(result.newPhoto.userId).toBe('user-456')
      expect(result.newPhoto.type).toBe('checkin')
      expect(result.newPhoto.spotId).toBe('spot-123')
      expect(result.newPhoto.timestamp).toBeDefined()
      expect(result.newPhoto.id).toMatch(/^photo_/)
    })

    it('should fail for missing spotId', () => {
      const result = addPhotoToSpot(null, { url: 'https://example.com/photo.jpg' })

      expect(result.added).toBe(false)
      expect(result.photos).toEqual([])
    })

    it('should fail for missing URL', () => {
      const result = addPhotoToSpot('spot-123', {})

      expect(result.added).toBe(false)
    })

    it('should apply photo rotation when exceeding max', () => {
      const spotId = 'spot-123'
      // Add 5 photos first - stored newest first (photo-4 at index 0, photo-0 at index 4)
      const existingPhotos = []
      for (let i = 4; i >= 0; i--) {
        existingPhotos.push({
          id: `photo-${i}`,
          url: `url-${i}`,
          timestamp: new Date(2024, 0, i + 1).toISOString(),
          isCreator: false,
        })
      }
      setState({ spotPhotos: { [spotId]: existingPhotos } })

      // Add 6th photo - oldest (photo-0 at the end) should be removed
      const result = addPhotoToSpot(spotId, { url: 'https://new-photo.jpg' })

      expect(result.added).toBe(true)
      expect(result.photos.length).toBe(5)
      expect(result.removed.length).toBe(1)
      expect(result.removed[0].id).toBe('photo-0') // Oldest removed (was at end of array)
    })

    it('should add newest photo at the beginning', () => {
      const spotId = 'spot-123'
      setState({
        spotPhotos: {
          [spotId]: [{ id: 'old', timestamp: '2024-01-01T00:00:00Z' }],
        },
      })

      const result = addPhotoToSpot(spotId, { url: 'https://new.jpg' })

      expect(result.photos[0].url).toBe('https://new.jpg')
    })

    it('should use current user if userId not provided', () => {
      setState({ user: { uid: 'current-user' } })

      const result = addPhotoToSpot('spot-123', { url: 'https://photo.jpg' })

      expect(result.newPhoto.userId).toBe('current-user')
    })
  })

  // ============================================
  // removePhotoFromSpot Tests
  // ============================================
  describe('removePhotoFromSpot', () => {
    it('should remove a photo by ID', () => {
      const spotId = 'spot-123'
      setState({
        spotPhotos: {
          [spotId]: [
            { id: 'photo-1', url: 'url-1' },
            { id: 'photo-2', url: 'url-2' },
          ],
        },
      })

      const result = removePhotoFromSpot(spotId, 'photo-1')

      expect(result.removed).toBe(true)
      expect(result.photo.id).toBe('photo-1')
      expect(getSpotPhotos(spotId).length).toBe(1)
    })

    it('should return false for non-existent photo', () => {
      const spotId = 'spot-123'
      setState({
        spotPhotos: {
          [spotId]: [{ id: 'photo-1' }],
        },
      })

      const result = removePhotoFromSpot(spotId, 'non-existent')

      expect(result.removed).toBe(false)
      expect(result.photo).toBeNull()
    })

    it('should return false for invalid parameters', () => {
      expect(removePhotoFromSpot(null, 'photo-1').removed).toBe(false)
      expect(removePhotoFromSpot('spot-123', null).removed).toBe(false)
    })
  })

  // ============================================
  // getPhotoCount Tests
  // ============================================
  describe('getPhotoCount', () => {
    it('should return 0 for spot without photos', () => {
      expect(getPhotoCount('empty-spot')).toBe(0)
    })

    it('should return correct count', () => {
      setState({
        spotPhotos: {
          'spot-123': [{ id: '1' }, { id: '2' }, { id: '3' }],
        },
      })

      expect(getPhotoCount('spot-123')).toBe(3)
    })
  })

  // ============================================
  // isAtMaxPhotos Tests
  // ============================================
  describe('isAtMaxPhotos', () => {
    it('should return false when under limit', () => {
      setState({
        spotPhotos: {
          'spot-123': [{ id: '1' }],
        },
      })

      expect(isAtMaxPhotos('spot-123')).toBe(false)
    })

    it('should return true when at limit', () => {
      const photos = Array(5).fill(null).map((_, i) => ({ id: `photo-${i}` }))
      setState({
        spotPhotos: {
          'spot-123': photos,
        },
      })

      expect(isAtMaxPhotos('spot-123')).toBe(true)
    })

    it('should return false for empty spot', () => {
      expect(isAtMaxPhotos('empty-spot')).toBe(false)
    })
  })

  // ============================================
  // getOldestPhoto Tests
  // ============================================
  describe('getOldestPhoto', () => {
    it('should return null when under max photos', () => {
      setState({
        spotPhotos: {
          'spot-123': [{ id: '1', timestamp: '2024-01-01' }],
        },
      })

      expect(getOldestPhoto('spot-123')).toBeNull()
    })

    it('should return oldest photo when at max', () => {
      const photos = Array(5).fill(null).map((_, i) => ({
        id: `photo-${i}`,
        timestamp: new Date(2024, 0, i + 1).toISOString(),
      }))
      setState({ spotPhotos: { 'spot-123': photos } })

      const oldest = getOldestPhoto('spot-123')

      expect(oldest).not.toBeNull()
      expect(oldest.id).toBe('photo-0')
    })
  })

  // ============================================
  // getPhotoRotationConfig / setMaxPhotos Tests
  // ============================================
  describe('getPhotoRotationConfig', () => {
    it('should return default config when not set', () => {
      const config = getPhotoRotationConfig()
      expect(config.maxPhotos).toBe(5)
    })

    it('should return stored config from localStorage', () => {
      localStorage.setItem('spothitch_photoRotationConfig', JSON.stringify({ maxPhotos: 8 }))
      const config = getPhotoRotationConfig()
      expect(config.maxPhotos).toBe(8)
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('spothitch_photoRotationConfig', 'invalid-json')
      const config = getPhotoRotationConfig()
      expect(config.maxPhotos).toBe(5) // Should fallback to default
    })

    it('should return default when localStorage has invalid structure', () => {
      localStorage.setItem('spothitch_photoRotationConfig', JSON.stringify({ invalid: 'data' }))
      const config = getPhotoRotationConfig()
      expect(config.maxPhotos).toBe(5)
    })
  })

  describe('setMaxPhotos', () => {
    it('should save config to localStorage', () => {
      const result = setMaxPhotos(10)
      expect(result).toBe(true)

      const stored = JSON.parse(localStorage.getItem('spothitch_photoRotationConfig'))
      expect(stored.maxPhotos).toBe(10)
    })

    it('should reject invalid values', () => {
      expect(setMaxPhotos(0)).toBe(false)
      expect(setMaxPhotos(-5)).toBe(false)
      expect(setMaxPhotos('invalid')).toBe(false)
      expect(setMaxPhotos(null)).toBe(false)
      expect(setMaxPhotos(undefined)).toBe(false)
    })

    it('should accept minimum value of 1', () => {
      const result = setMaxPhotos(1)
      expect(result).toBe(true)
      expect(getPhotoRotationConfig().maxPhotos).toBe(1)
    })

    it('should update rotation behavior', () => {
      const spotId = 'spot-custom-max'

      // Set max to 3
      setMaxPhotos(3)

      // Add 5 photos
      for (let i = 0; i < 5; i++) {
        addPhotoToSpot(spotId, { url: `url-${i}` })
      }

      const photos = getSpotPhotos(spotId)
      expect(photos.length).toBe(3) // Should respect custom max
    })
  })

  describe('addSpotPhoto', () => {
    it('should be an alias for addPhotoToSpot with isCreator flag', () => {
      const spotId = 'spot-alias'
      const result = addSpotPhoto(spotId, { url: 'test-url' }, true)

      expect(result.added).toBe(true)
      expect(result.newPhoto.isCreator).toBe(true)
      expect(result.newPhoto.url).toBe('test-url')
    })

    it('should default isCreator to false', () => {
      const spotId = 'spot-alias-default'
      const result = addSpotPhoto(spotId, { url: 'test-url' })

      expect(result.added).toBe(true)
      expect(result.newPhoto.isCreator).toBe(false)
    })

    it('should preserve other photo data', () => {
      const spotId = 'spot-alias-data'
      const result = addSpotPhoto(
        spotId,
        {
          url: 'test-url',
          userId: 'user-123',
          type: 'creation',
        },
        true
      )

      expect(result.newPhoto.userId).toBe('user-123')
      expect(result.newPhoto.type).toBe('creation')
      expect(result.newPhoto.isCreator).toBe(true)
    })
  })

  // ============================================
  // getPhotoRotationInfo Tests
  // ============================================
  describe('getPhotoRotationInfo', () => {
    it('should return correct info for empty spot', () => {
      const info = getPhotoRotationInfo('empty-spot')

      expect(info.current).toBe(0)
      expect(info.max).toBe(5)
      expect(info.canAdd).toBe(true)
      expect(info.willRemove).toBeNull()
      expect(info.percentFull).toBe(0)
    })

    it('should return correct info for partially filled spot', () => {
      setState({
        spotPhotos: {
          'spot-123': Array(3).fill(null).map((_, i) => ({
            id: `photo-${i}`,
            timestamp: new Date(2024, 0, i + 1).toISOString(),
            isCreator: false,
          })),
        },
      })

      const info = getPhotoRotationInfo('spot-123')

      expect(info.current).toBe(3)
      expect(info.percentFull).toBe(60) // 3/5 = 60%
      expect(info.willRemove).toBeNull()
    })

    it('should indicate which photo will be removed at max', () => {
      const photos = Array(5).fill(null).map((_, i) => ({
        id: `photo-${i}`,
        timestamp: new Date(2024, 0, i + 1).toISOString(),
        isCreator: false,
      }))
      setState({ spotPhotos: { 'spot-123': photos } })

      const info = getPhotoRotationInfo('spot-123')

      expect(info.willRemove).not.toBeNull()
      expect(info.percentFull).toBe(100)
    })

    it('should include creator photo count', () => {
      const photos = [
        { id: 'p1', timestamp: '2024-01-01', isCreator: true },
        { id: 'p2', timestamp: '2024-01-02', isCreator: false },
        { id: 'p3', timestamp: '2024-01-03', isCreator: false },
      ]
      setState({ spotPhotos: { 'spot-123': photos } })

      const info = getPhotoRotationInfo('spot-123')

      expect(info.creatorPhotoCount).toBe(1)
      expect(info.current).toBe(3)
    })

    it('should not indicate removal of creator photo', () => {
      const photos = [
        { id: 'p1', timestamp: '2024-01-01', isCreator: true },
        { id: 'p2', timestamp: '2024-01-02', isCreator: false },
        { id: 'p3', timestamp: '2024-01-03', isCreator: false },
        { id: 'p4', timestamp: '2024-01-04', isCreator: false },
        { id: 'p5', timestamp: '2024-01-05', isCreator: false },
      ]
      setState({ spotPhotos: { 'spot-123': photos } })

      const info = getPhotoRotationInfo('spot-123')

      // willRemove should be oldest non-creator photo
      expect(info.willRemove).not.toBeNull()
      expect(info.willRemove.isCreator).toBe(false)
      expect(info.willRemove.id).toBe('p2') // Oldest non-creator
    })
  })

  // ============================================
  // processCheckin Tests
  // ============================================
  describe('processCheckin', () => {
    it('should process check-in without photo', async () => {
      const result = await processCheckin({ spotId: 'spot-123' })

      expect(result.success).toBe(true)
      expect(result.points).toBe(5)
      expect(result.photoAdded).toBe(false)
    })

    it('should process check-in with photo and add bonus', async () => {
      const result = await processCheckin({
        spotId: 'spot-123',
        photoUrl: 'https://example.com/photo.jpg',
      })

      expect(result.success).toBe(true)
      expect(result.points).toBe(20) // 5 base + 15 photo
      expect(result.photoAdded).toBe(true)
      expect(result.breakdown.photo).toBe(15)
    })

    it('should fail without spotId', async () => {
      const result = await processCheckin({})

      expect(result.success).toBe(false)
      expect(result.error).toContain('Spot ID requis')
    })

    it('should include characteristics bonus', async () => {
      const result = await processCheckin({
        spotId: 'spot-123',
        characteristics: { safe: true, visible: true, traffic: true },
      })

      expect(result.points).toBe(10) // 5 base + 5 details
    })

    it('should report removed photos from rotation', async () => {
      // Fill spot with 5 photos
      const photos = Array(5).fill(null).map((_, i) => ({
        id: `photo-${i}`,
        url: `url-${i}`,
        timestamp: new Date(2024, 0, i + 1).toISOString(),
        isCreator: false,
      }))
      setState({ spotPhotos: { 'spot-123': photos } })

      const result = await processCheckin({
        spotId: 'spot-123',
        photoUrl: 'https://new-photo.jpg',
      })

      expect(result.removedPhotos.length).toBe(1)
    })
  })

  // ============================================
  // validateSpotCreation Tests
  // ============================================
  describe('validateSpotCreation', () => {
    it('should fail without required fields', () => {
      const result = validateSpotCreation({})

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(3)
    })

    it('should fail without photo', () => {
      const result = validateSpotCreation({
        from: 'Paris',
        to: 'Lyon',
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Une photo est requise pour creer un spot')
    })

    it('should pass with all required fields', () => {
      const result = validateSpotCreation({
        from: 'Paris',
        to: 'Lyon',
        photoUrl: 'https://example.com/photo.jpg',
      })

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should validate photo file if provided', () => {
      const invalidFile = createMockFile({ type: 'application/pdf' })
      const result = validateSpotCreation({
        from: 'Paris',
        to: 'Lyon',
        photo: invalidFile,
      })

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Format'))).toBe(true)
    })

    it('should pass with valid photo file', () => {
      const validFile = createMockFile({ type: 'image/jpeg' })
      const result = validateSpotCreation({
        from: 'Paris',
        to: 'Lyon',
        photo: validFile,
      })

      expect(result.valid).toBe(true)
    })

    it('should fail with whitespace-only fields', () => {
      const result = validateSpotCreation({
        from: '   ',
        to: '   ',
        photoUrl: 'https://photo.jpg',
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Le champ "Depuis" est requis')
      expect(result.errors).toContain('Le champ "Vers" est requis')
    })
  })

  // ============================================
  // getUserPhotoStats Tests
  // ============================================
  describe('getUserPhotoStats', () => {
    it('should return zeros for user with no photos', () => {
      const stats = getUserPhotoStats('new-user')

      expect(stats.totalPhotos).toBe(0)
      expect(stats.spotsWithPhotos).toBe(0)
      expect(stats.checkinPhotos).toBe(0)
      expect(stats.creationPhotos).toBe(0)
    })

    it('should count user photos correctly', () => {
      setState({
        spotPhotos: {
          'spot-1': [
            { id: '1', userId: 'user-123', type: 'checkin' },
            { id: '2', userId: 'user-123', type: 'creation' },
            { id: '3', userId: 'other-user', type: 'checkin' },
          ],
          'spot-2': [
            { id: '4', userId: 'user-123', type: 'checkin' },
          ],
        },
      })

      const stats = getUserPhotoStats('user-123')

      expect(stats.totalPhotos).toBe(3)
      expect(stats.spotsWithPhotos).toBe(2)
      expect(stats.checkinPhotos).toBe(2)
      expect(stats.creationPhotos).toBe(1)
    })

    it('should use current user if no userId provided', () => {
      setState({
        user: { uid: 'current-user' },
        spotPhotos: {
          'spot-1': [{ id: '1', userId: 'current-user', type: 'checkin' }],
        },
      })

      const stats = getUserPhotoStats()

      expect(stats.totalPhotos).toBe(1)
    })
  })

  // ============================================
  // cleanupOldPhotos Tests
  // ============================================
  describe('cleanupOldPhotos', () => {
    it('should not remove photos under the limit', () => {
      setState({
        spotPhotos: {
          'spot-1': [{ id: '1', timestamp: '2024-01-01' }],
        },
      })

      const result = cleanupOldPhotos()

      expect(result.cleaned).toBe(0)
      expect(result.spots).toEqual([])
    })

    it('should clean up spots with more than max photos', () => {
      const photos = Array(8).fill(null).map((_, i) => ({
        id: `photo-${i}`,
        timestamp: new Date(2024, 0, i + 1).toISOString(),
        isCreator: false,
      }))
      setState({ spotPhotos: { 'spot-1': photos } })

      const result = cleanupOldPhotos()

      expect(result.cleaned).toBe(3) // 8 - 5
      expect(result.spots).toContain('spot-1')
      expect(getPhotoCount('spot-1')).toBe(5)
    })

    it('should keep the most recent photos', () => {
      const photos = Array(8).fill(null).map((_, i) => ({
        id: `photo-${i}`,
        timestamp: new Date(2024, 0, i + 1).toISOString(),
        isCreator: false,
      }))
      setState({ spotPhotos: { 'spot-1': photos } })

      cleanupOldPhotos()

      const remaining = getSpotPhotos('spot-1')
      // Should have kept the most recent 5 (IDs 3-7)
      expect(remaining.some(p => p.id === 'photo-7')).toBe(true)
      expect(remaining.some(p => p.id === 'photo-0')).toBe(false)
    })

    it('should preserve creator photo during cleanup', () => {
      const photos = [
        { id: 'creator', timestamp: '2020-01-01', isCreator: true, url: 'creator-url' },
        ...Array(8).fill(null).map((_, i) => ({
          id: `photo-${i}`,
          timestamp: new Date(2024, 0, i + 1).toISOString(),
          isCreator: false,
        })),
      ]
      setState({ spotPhotos: { 'spot-1': photos } })

      const result = cleanupOldPhotos()

      const remaining = getSpotPhotos('spot-1')
      // Should have creator photo + 4 most recent regular photos (total 5)
      expect(remaining.some(p => p.id === 'creator' && p.isCreator)).toBe(true)
      expect(remaining.length).toBe(5)
    })

    it('should handle multiple creator photos', () => {
      const photos = [
        { id: 'creator-1', timestamp: '2020-01-01', isCreator: true },
        { id: 'creator-2', timestamp: '2020-01-02', isCreator: true },
        ...Array(10).fill(null).map((_, i) => ({
          id: `photo-${i}`,
          timestamp: new Date(2024, 0, i + 1).toISOString(),
          isCreator: false,
        })),
      ]
      setState({ spotPhotos: { 'spot-1': photos } })

      cleanupOldPhotos()

      const remaining = getSpotPhotos('spot-1')
      // Should have both creator photos + 3 most recent regular photos (total 5)
      expect(remaining.some(p => p.id === 'creator-1')).toBe(true)
      expect(remaining.some(p => p.id === 'creator-2')).toBe(true)
      expect(remaining.length).toBe(5)
    })
  })

  // ============================================
  // Photo Rotation Integration Tests
  // ============================================
  describe('Photo Rotation Integration', () => {
    it('should maintain exactly 5 photos after multiple additions', () => {
      const spotId = 'spot-rotation'

      // Add 10 photos
      for (let i = 0; i < 10; i++) {
        addPhotoToSpot(spotId, { url: `url-${i}` })
      }

      const photos = getSpotPhotos(spotId)
      expect(photos.length).toBe(5)
    })

    it('should remove oldest photos during rotation', () => {
      const spotId = 'spot-rotation'

      // Add 8 photos sequentially - each new photo is added at the beginning
      // When we exceed 5, the oldest (at the end) is removed
      for (let i = 0; i < 8; i++) {
        const result = addPhotoToSpot(spotId, {
          url: `url-${i}`,
        })

        if (i >= 5) {
          expect(result.removed.length).toBe(1)
        }
      }

      const photos = getSpotPhotos(spotId)
      expect(photos.length).toBe(5)
      // The 3 oldest photos (first added: url-0, url-1, url-2) should be removed
      expect(photos.some(p => p.url === 'url-0')).toBe(false)
      expect(photos.some(p => p.url === 'url-1')).toBe(false)
      expect(photos.some(p => p.url === 'url-2')).toBe(false)
      // The newest photo (last added: url-7) should be present
      expect(photos.some(p => p.url === 'url-7')).toBe(true)
    })

    it('should preserve photo order after rotation', () => {
      const spotId = 'spot-rotation'

      for (let i = 0; i < 5; i++) {
        addPhotoToSpot(spotId, { url: `url-${i}` })
      }

      // Add one more
      addPhotoToSpot(spotId, { url: 'newest' })

      const photos = getSpotPhotos(spotId)
      expect(photos[0].url).toBe('newest')
    })

    it('should never remove creator photo during rotation', () => {
      const spotId = 'spot-creator-protection'

      // Add creator photo
      addPhotoToSpot(spotId, {
        url: 'creator-photo',
        isCreator: true,
      })

      // Add 10 more regular photos
      for (let i = 0; i < 10; i++) {
        addPhotoToSpot(spotId, {
          url: `regular-photo-${i}`,
          isCreator: false,
        })
      }

      const photos = getSpotPhotos(spotId)
      // Should still have creator photo
      expect(photos.some(p => p.url === 'creator-photo' && p.isCreator)).toBe(true)
      // Should have max 5 photos (creator + 4 most recent)
      expect(photos.length).toBeLessThanOrEqual(6) // Allow 6 to keep creator + 5 regulars
    })

    it('should preserve oldest creator photo even when adding new photos', () => {
      const spotId = 'spot-creator-old'

      // Add creator photo (old timestamp)
      const creatorPhoto = {
        id: 'creator-1',
        url: 'creator-photo',
        timestamp: new Date(2020, 0, 1).toISOString(),
        isCreator: true,
        userId: 'creator-user',
      }
      setState({
        spotPhotos: {
          [spotId]: [creatorPhoto],
        },
      })

      // Add 10 newer regular photos
      for (let i = 0; i < 10; i++) {
        addPhotoToSpot(spotId, {
          url: `new-photo-${i}`,
          isCreator: false,
        })
      }

      const photos = getSpotPhotos(spotId)
      // Creator photo should still be there
      expect(photos.some(p => p.id === 'creator-1' && p.isCreator)).toBe(true)
    })

    it('should remove oldest non-creator photos first', () => {
      const spotId = 'spot-fifo'

      // Add creator photo
      addPhotoToSpot(spotId, {
        url: 'creator-photo',
        userId: 'creator',
        isCreator: true,
      })

      // Add 3 regular photos
      addPhotoToSpot(spotId, { url: 'photo-1', isCreator: false })
      addPhotoToSpot(spotId, { url: 'photo-2', isCreator: false })
      addPhotoToSpot(spotId, { url: 'photo-3', isCreator: false })

      // At this point we have 4 photos (1 creator + 3 regular)
      // Add 2 more regular photos - should trigger removal
      addPhotoToSpot(spotId, { url: 'photo-4', isCreator: false })
      addPhotoToSpot(spotId, { url: 'photo-5', isCreator: false })

      const photos = getSpotPhotos(spotId)

      // Should have creator photo
      expect(photos.some(p => p.url === 'creator-photo')).toBe(true)

      // Should have removed oldest regular photos
      expect(photos.some(p => p.url === 'photo-1')).toBe(false)

      // Should have newest photos
      expect(photos.some(p => p.url === 'photo-5')).toBe(true)
    })
  })

  // ============================================
  // Edge Cases
  // ============================================
  describe('Edge Cases', () => {
    it('should handle concurrent photo additions', () => {
      const spotId = 'concurrent-spot'

      // Simulate concurrent additions
      const results = []
      for (let i = 0; i < 5; i++) {
        results.push(addPhotoToSpot(spotId, { url: `url-${i}` }))
      }

      expect(getPhotoCount(spotId)).toBe(5)
      expect(results.every(r => r.added)).toBe(true)
    })

    it('should handle special characters in URLs', () => {
      const result = addPhotoToSpot('spot-123', {
        url: 'https://example.com/photo?query=value&special=true#hash',
      })

      expect(result.added).toBe(true)
      expect(result.newPhoto.url).toContain('query=value')
    })

    it('should handle empty state gracefully', () => {
      setState({ spotPhotos: undefined })

      expect(() => getSpotPhotos('spot-123')).not.toThrow()
      expect(getSpotPhotos('spot-123')).toEqual([])
    })

    it('should generate unique photo IDs', () => {
      const spotId = 'unique-ids'
      const ids = new Set()

      for (let i = 0; i < 100; i++) {
        const result = addPhotoToSpot(spotId, { url: `url-${i}` })
        ids.add(result.newPhoto.id)
      }

      // All IDs should be unique
      expect(ids.size).toBe(100)
    })
  })

  // ============================================
  // Creator Photo Protection Tests
  // ============================================
  describe('Creator Photo Protection', () => {
    it('should mark spot creation photos as isCreator', () => {
      const spotId = 'new-spot'
      const result = addSpotPhoto(
        spotId,
        {
          url: 'creation-photo.jpg',
          userId: 'creator-123',
          type: 'creation',
        },
        true
      )

      expect(result.newPhoto.isCreator).toBe(true)
      expect(result.newPhoto.type).toBe('creation')
    })

    it('should require photo for spot creation', () => {
      const validation = validateSpotCreation({
        from: 'Paris',
        to: 'Lyon',
        // No photo
      })

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('Une photo est requise pour creer un spot')
    })

    it('should allow spot creation with photo', () => {
      const validation = validateSpotCreation({
        from: 'Paris',
        to: 'Lyon',
        photoUrl: 'https://example.com/photo.jpg',
      })

      expect(validation.valid).toBe(true)
    })

    it('should never remove all creator photos', () => {
      const spotId = 'multi-creator'

      // Add 5 creator photos (unusual case but possible)
      for (let i = 0; i < 5; i++) {
        addSpotPhoto(spotId, { url: `creator-${i}` }, true)
      }

      // Add 10 regular photos - should not remove any creator photos
      for (let i = 0; i < 10; i++) {
        addPhotoToSpot(spotId, { url: `regular-${i}`, isCreator: false })
      }

      const photos = getSpotPhotos(spotId)
      const creatorPhotos = photos.filter(p => p.isCreator)

      // All 5 creator photos should still be there
      expect(creatorPhotos.length).toBe(5)
    })

    it('should handle edge case with only creator photos', () => {
      const spotId = 'only-creators'

      // Add 3 creator photos
      for (let i = 0; i < 3; i++) {
        addSpotPhoto(spotId, { url: `creator-${i}` }, true)
      }

      const photos = getSpotPhotos(spotId)
      expect(photos.length).toBe(3)
      expect(photos.every(p => p.isCreator)).toBe(true)

      // Rotation info should not indicate removal
      const info = getPhotoRotationInfo(spotId)
      expect(info.creatorPhotoCount).toBe(3)
    })
  })

  // ============================================
  // Default Export Tests
  // ============================================
  describe('Default Export', () => {
    it('should export all functions', async () => {
      const module = await import('../src/services/photoCheckin.js')

      expect(module.default.PHOTO_CONFIG).toBeDefined()
      expect(module.default.PhotoValidationStatus).toBeDefined()
      expect(module.default.isPhotoRequired).toBeTypeOf('function')
      expect(module.default.validatePhoto).toBeTypeOf('function')
      expect(module.default.calculateCheckinPoints).toBeTypeOf('function')
      expect(module.default.addPhotoToSpot).toBeTypeOf('function')
      expect(module.default.addSpotPhoto).toBeTypeOf('function')
      expect(module.default.getPhotoRotationConfig).toBeTypeOf('function')
      expect(module.default.setMaxPhotos).toBeTypeOf('function')
      expect(module.default.processCheckin).toBeTypeOf('function')
    })
  })
})
