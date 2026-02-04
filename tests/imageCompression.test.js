/**
 * Image Compression Service Tests
 * Tests for image compression, resizing, and conversion utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  compressImage,
  resizeImage,
  getImageDimensions,
  convertToWebP,
  estimateCompressedSize,
  isImageTooLarge,
  createThumbnail,
  validateImageFile,
  getCompressionRecommendation,
  calculateOptimalSettings,
  SUPPORTED_FORMATS,
  DEFAULT_OPTIONS,
} from '../src/services/imageCompression.js'

// Mock canvas and image loading
function createMockFile(options = {}) {
  const {
    name = 'test-image.jpg',
    type = 'image/jpeg',
    size = 1024 * 1024, // 1MB default
  } = options

  const file = new File(['mock-content'], name, { type })

  // Override size getter
  Object.defineProperty(file, 'size', { value: size })

  return file
}

// Mock Image class for testing
class MockImage {
  constructor() {
    this.width = 1920
    this.height = 1080
    this.onload = null
    this.onerror = null
    this.src = ''
  }

  set src(value) {
    this._src = value
    // Simulate async loading
    setTimeout(() => {
      if (this.onload) {
        this.onload()
      }
    }, 0)
  }

  get src() {
    return this._src
  }
}

// Mock FileReader
class MockFileReader {
  constructor() {
    this.onload = null
    this.onerror = null
    this.result = 'data:image/jpeg;base64,mockdata'
  }

  readAsDataURL() {
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: this.result } })
      }
    }, 0)
  }
}

// Mock canvas context
const mockContext = {
  drawImage: vi.fn(),
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high',
}

// Mock canvas
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockContext),
  toDataURL: vi.fn(() => 'data:image/jpeg;base64,compressed'),
  toBlob: vi.fn((callback, type, quality) => {
    const blob = new Blob(['compressed'], { type: type || 'image/jpeg' })
    callback(blob)
  }),
}

// Setup global mocks
beforeEach(() => {
  vi.clearAllMocks()

  // Mock Image
  global.Image = MockImage

  // Mock FileReader
  global.FileReader = MockFileReader

  // Mock document.createElement for canvas
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    if (tag === 'canvas') {
      return { ...mockCanvas }
    }
    return document.createElement(tag)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Image Compression Service', () => {
  describe('compressImage', () => {
    it('should compress an image file', async () => {
      const file = createMockFile()
      const result = await compressImage(file)

      expect(result).toBeDefined()
      expect(result.file).toBeInstanceOf(File)
      expect(result.blob).toBeInstanceOf(Blob)
      expect(result.dataUrl).toBeDefined()
      expect(result.width).toBeDefined()
      expect(result.height).toBeDefined()
    })

    it('should use default options when none provided', async () => {
      const file = createMockFile()
      const result = await compressImage(file)

      expect(result.width).toBeLessThanOrEqual(DEFAULT_OPTIONS.maxWidth)
      expect(result.height).toBeLessThanOrEqual(DEFAULT_OPTIONS.maxHeight)
    })

    it('should accept custom maxWidth option', async () => {
      const file = createMockFile()
      const result = await compressImage(file, { maxWidth: 800 })

      expect(result).toBeDefined()
    })

    it('should accept custom maxHeight option', async () => {
      const file = createMockFile()
      const result = await compressImage(file, { maxHeight: 600 })

      expect(result).toBeDefined()
    })

    it('should accept custom quality option', async () => {
      const file = createMockFile()
      const result = await compressImage(file, { quality: 0.5 })

      expect(result).toBeDefined()
    })

    it('should accept jpeg format', async () => {
      const file = createMockFile()
      const result = await compressImage(file, { format: 'jpeg' })

      expect(result.file.type).toBe('image/jpeg')
    })

    it('should accept webp format', async () => {
      const file = createMockFile()
      const result = await compressImage(file, { format: 'webp' })

      expect(result.file.type).toBe('image/webp')
    })

    it('should accept png format', async () => {
      const file = createMockFile()
      const result = await compressImage(file, { format: 'png' })

      expect(result.file.type).toBe('image/png')
    })

    it('should throw error for invalid file', async () => {
      await expect(compressImage(null)).rejects.toThrow('Invalid file')
    })

    it('should throw error for non-image file', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      await expect(compressImage(file)).rejects.toThrow('Invalid file type')
    })

    it('should throw error for unsupported format', async () => {
      const file = createMockFile()
      await expect(compressImage(file, { format: 'bmp' })).rejects.toThrow('Unsupported format')
    })

    it('should throw error for invalid quality (negative)', async () => {
      const file = createMockFile()
      await expect(compressImage(file, { quality: -0.5 })).rejects.toThrow('Quality must be between 0 and 1')
    })

    it('should throw error for invalid quality (over 1)', async () => {
      const file = createMockFile()
      await expect(compressImage(file, { quality: 1.5 })).rejects.toThrow('Quality must be between 0 and 1')
    })

    it('should return originalSize and compressedSize', async () => {
      const file = createMockFile({ size: 2 * 1024 * 1024 })
      const result = await compressImage(file)

      expect(result.originalSize).toBe(2 * 1024 * 1024)
      expect(result.compressedSize).toBeDefined()
      expect(typeof result.compressedSize).toBe('number')
    })

    it('should return compressionRatio', async () => {
      const file = createMockFile()
      const result = await compressImage(file)

      expect(result.compressionRatio).toBeDefined()
      expect(typeof result.compressionRatio).toBe('number')
    })
  })

  describe('resizeImage', () => {
    it('should resize an image', async () => {
      const file = createMockFile()
      const result = await resizeImage(file, 800, 600)

      expect(result).toBeDefined()
      expect(result.file).toBeDefined()
      expect(result.blob).toBeDefined()
    })

    it('should return width and height', async () => {
      const file = createMockFile()
      const result = await resizeImage(file, 800, 600)

      expect(result.width).toBeDefined()
      expect(result.height).toBeDefined()
    })

    it('should throw error for invalid file', async () => {
      await expect(resizeImage(null, 800, 600)).rejects.toThrow('Invalid file')
    })

    it('should throw error for non-image file', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      await expect(resizeImage(file, 800, 600)).rejects.toThrow('Invalid file type')
    })

    it('should throw error for non-numeric maxWidth', async () => {
      const file = createMockFile()
      await expect(resizeImage(file, 'invalid', 600)).rejects.toThrow('maxWidth and maxHeight must be numbers')
    })

    it('should throw error for negative dimensions', async () => {
      const file = createMockFile()
      await expect(resizeImage(file, -800, 600)).rejects.toThrow('maxWidth and maxHeight must be positive numbers')
    })

    it('should throw error for zero dimensions', async () => {
      const file = createMockFile()
      await expect(resizeImage(file, 0, 600)).rejects.toThrow('maxWidth and maxHeight must be positive numbers')
    })
  })

  describe('getImageDimensions', () => {
    it('should return image dimensions', async () => {
      const file = createMockFile()
      const result = await getImageDimensions(file)

      expect(result).toBeDefined()
      expect(result.width).toBeDefined()
      expect(result.height).toBeDefined()
    })

    it('should return width as a number', async () => {
      const file = createMockFile()
      const result = await getImageDimensions(file)

      expect(typeof result.width).toBe('number')
    })

    it('should return height as a number', async () => {
      const file = createMockFile()
      const result = await getImageDimensions(file)

      expect(typeof result.height).toBe('number')
    })

    it('should throw error for invalid file', async () => {
      await expect(getImageDimensions(null)).rejects.toThrow('Invalid file')
    })

    it('should throw error for non-image file', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      await expect(getImageDimensions(file)).rejects.toThrow('Invalid file type')
    })
  })

  describe('convertToWebP', () => {
    it('should convert image to WebP', async () => {
      const file = createMockFile()
      const result = await convertToWebP(file)

      expect(result).toBeDefined()
      expect(result.file).toBeDefined()
    })

    it('should return a WebP file', async () => {
      const file = createMockFile()
      const result = await convertToWebP(file)

      expect(result.file.type).toBe('image/webp')
    })

    it('should return a blob', async () => {
      const file = createMockFile()
      const result = await convertToWebP(file)

      expect(result.blob).toBeInstanceOf(Blob)
    })

    it('should return dataUrl', async () => {
      const file = createMockFile()
      const result = await convertToWebP(file)

      expect(result.dataUrl).toBeDefined()
      expect(typeof result.dataUrl).toBe('string')
    })

    it('should accept custom quality', async () => {
      const file = createMockFile()
      const result = await convertToWebP(file, 0.5)

      expect(result).toBeDefined()
    })

    it('should throw error for invalid file', async () => {
      await expect(convertToWebP(null)).rejects.toThrow('Invalid file')
    })

    it('should throw error for invalid quality', async () => {
      const file = createMockFile()
      await expect(convertToWebP(file, 2)).rejects.toThrow('Quality must be between 0 and 1')
    })

    it('should return originalSize and convertedSize', async () => {
      const file = createMockFile()
      const result = await convertToWebP(file)

      expect(result.originalSize).toBeDefined()
      expect(result.convertedSize).toBeDefined()
    })

    it('should generate .webp filename', async () => {
      const file = createMockFile({ name: 'photo.jpg' })
      const result = await convertToWebP(file)

      expect(result.file.name).toContain('.webp')
    })
  })

  describe('estimateCompressedSize', () => {
    it('should estimate compressed size', async () => {
      const file = createMockFile()
      const result = await estimateCompressedSize(file)

      expect(result).toBeDefined()
      expect(result.estimatedSize).toBeDefined()
    })

    it('should return estimatedSizeKB', async () => {
      const file = createMockFile()
      const result = await estimateCompressedSize(file)

      expect(result.estimatedSizeKB).toBeDefined()
      expect(typeof result.estimatedSizeKB).toBe('number')
    })

    it('should return originalSize', async () => {
      const file = createMockFile({ size: 2 * 1024 * 1024 })
      const result = await estimateCompressedSize(file)

      expect(result.originalSize).toBe(2 * 1024 * 1024)
    })

    it('should return ratio', async () => {
      const file = createMockFile()
      const result = await estimateCompressedSize(file)

      expect(result.ratio).toBeDefined()
      expect(typeof result.ratio).toBe('number')
    })

    it('should accept custom quality', async () => {
      const file = createMockFile()
      const result = await estimateCompressedSize(file, 0.5)

      expect(result).toBeDefined()
    })

    it('should throw error for invalid file', async () => {
      await expect(estimateCompressedSize(null)).rejects.toThrow('Invalid file')
    })

    it('should throw error for invalid quality', async () => {
      const file = createMockFile()
      await expect(estimateCompressedSize(file, -0.5)).rejects.toThrow('Quality must be between 0 and 1')
    })
  })

  describe('isImageTooLarge', () => {
    it('should return false for small files', () => {
      const file = createMockFile({ size: 1024 * 1024 }) // 1MB
      const result = isImageTooLarge(file, 5)

      expect(result.isTooLarge).toBe(false)
    })

    it('should return true for large files', () => {
      const file = createMockFile({ size: 10 * 1024 * 1024 }) // 10MB
      const result = isImageTooLarge(file, 5)

      expect(result.isTooLarge).toBe(true)
    })

    it('should return currentSizeMB', () => {
      const file = createMockFile({ size: 2 * 1024 * 1024 }) // 2MB
      const result = isImageTooLarge(file, 5)

      expect(result.currentSizeMB).toBe(2)
    })

    it('should return maxSizeMB', () => {
      const file = createMockFile()
      const result = isImageTooLarge(file, 10)

      expect(result.maxSizeMB).toBe(10)
    })

    it('should return exceedsByMB when too large', () => {
      const file = createMockFile({ size: 8 * 1024 * 1024 }) // 8MB
      const result = isImageTooLarge(file, 5)

      expect(result.exceedsByMB).toBe(3)
    })

    it('should return 0 exceedsByMB when not too large', () => {
      const file = createMockFile({ size: 1024 * 1024 }) // 1MB
      const result = isImageTooLarge(file, 5)

      expect(result.exceedsByMB).toBe(0)
    })

    it('should use default maxSizeMB of 5', () => {
      const file = createMockFile({ size: 6 * 1024 * 1024 }) // 6MB
      const result = isImageTooLarge(file)

      expect(result.isTooLarge).toBe(true)
      expect(result.maxSizeMB).toBe(5)
    })

    it('should throw error for invalid file', () => {
      expect(() => isImageTooLarge(null)).toThrow('Invalid file')
    })

    it('should throw error for invalid maxSizeMB', () => {
      const file = createMockFile()
      expect(() => isImageTooLarge(file, -5)).toThrow('maxSizeMB must be a positive number')
    })

    it('should throw error for zero maxSizeMB', () => {
      const file = createMockFile()
      expect(() => isImageTooLarge(file, 0)).toThrow('maxSizeMB must be a positive number')
    })
  })

  describe('createThumbnail', () => {
    it('should create a thumbnail', async () => {
      const file = createMockFile()
      const result = await createThumbnail(file)

      expect(result).toBeDefined()
      expect(result.file).toBeDefined()
    })

    it('should create a square thumbnail', async () => {
      const file = createMockFile()
      const result = await createThumbnail(file, 200)

      expect(result.size).toBe(200)
    })

    it('should return a blob', async () => {
      const file = createMockFile()
      const result = await createThumbnail(file)

      expect(result.blob).toBeInstanceOf(Blob)
    })

    it('should return a dataUrl', async () => {
      const file = createMockFile()
      const result = await createThumbnail(file)

      expect(result.dataUrl).toBeDefined()
      expect(typeof result.dataUrl).toBe('string')
    })

    it('should use default size of 200', async () => {
      const file = createMockFile()
      const result = await createThumbnail(file)

      expect(result.size).toBe(200)
    })

    it('should accept custom size', async () => {
      const file = createMockFile()
      const result = await createThumbnail(file, 150)

      expect(result.size).toBe(150)
    })

    it('should throw error for invalid file', async () => {
      await expect(createThumbnail(null)).rejects.toThrow('Invalid file')
    })

    it('should throw error for non-image file', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      await expect(createThumbnail(file)).rejects.toThrow('Invalid file type')
    })

    it('should throw error for invalid size', async () => {
      const file = createMockFile()
      await expect(createThumbnail(file, 'invalid')).rejects.toThrow('Size must be a positive number')
    })

    it('should throw error for negative size', async () => {
      const file = createMockFile()
      await expect(createThumbnail(file, -100)).rejects.toThrow('Size must be a positive number')
    })

    it('should generate thumb filename', async () => {
      const file = createMockFile({ name: 'photo.jpg' })
      const result = await createThumbnail(file, 150)

      expect(result.file.name).toContain('_thumb_150')
    })
  })

  describe('validateImageFile', () => {
    it('should return valid for JPEG', () => {
      const file = createMockFile({ type: 'image/jpeg' })
      const result = validateImageFile(file)

      expect(result.valid).toBe(true)
    })

    it('should return valid for PNG', () => {
      const file = createMockFile({ type: 'image/png' })
      const result = validateImageFile(file)

      expect(result.valid).toBe(true)
    })

    it('should return valid for WebP', () => {
      const file = createMockFile({ type: 'image/webp' })
      const result = validateImageFile(file)

      expect(result.valid).toBe(true)
    })

    it('should return valid for GIF', () => {
      const file = createMockFile({ type: 'image/gif' })
      const result = validateImageFile(file)

      expect(result.valid).toBe(true)
    })

    it('should return invalid for null file', () => {
      const result = validateImageFile(null)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Aucun fichier fourni')
    })

    it('should return invalid for non-Blob', () => {
      const result = validateImageFile('not a file')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Fichier invalide')
    })

    it('should return invalid for unsupported format', () => {
      const file = new File(['test'], 'test.bmp', { type: 'image/bmp' })
      const result = validateImageFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Format non supporté')
    })

    it('should return invalid for too large file', () => {
      const file = createMockFile({ size: 15 * 1024 * 1024 }) // 15MB
      const result = validateImageFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('trop volumineux')
    })
  })

  describe('getCompressionRecommendation', () => {
    it('should recommend no compression for small files', () => {
      const file = createMockFile({ size: 0.3 * 1024 * 1024 }) // 300KB
      const result = getCompressionRecommendation(file)

      expect(result.shouldCompress).toBe(false)
    })

    it('should recommend light compression for medium files', () => {
      const file = createMockFile({ size: 1 * 1024 * 1024 }) // 1MB
      const result = getCompressionRecommendation(file)

      expect(result.shouldCompress).toBe(true)
      expect(result.quality).toBeGreaterThanOrEqual(0.8)
    })

    it('should recommend moderate compression for large files', () => {
      const file = createMockFile({ size: 3 * 1024 * 1024 }) // 3MB
      const result = getCompressionRecommendation(file)

      expect(result.shouldCompress).toBe(true)
      expect(result.quality).toBeLessThan(0.85)
    })

    it('should recommend aggressive compression for very large files', () => {
      const file = createMockFile({ size: 8 * 1024 * 1024 }) // 8MB
      const result = getCompressionRecommendation(file)

      expect(result.shouldCompress).toBe(true)
      expect(result.quality).toBeLessThanOrEqual(0.6)
    })

    it('should return format recommendation', () => {
      const file = createMockFile()
      const result = getCompressionRecommendation(file)

      expect(result.format).toBeDefined()
      expect(['jpeg', 'webp', 'png']).toContain(result.format)
    })

    it('should return reason', () => {
      const file = createMockFile()
      const result = getCompressionRecommendation(file)

      expect(result.reason).toBeDefined()
      expect(typeof result.reason).toBe('string')
    })

    it('should handle invalid file gracefully', () => {
      const result = getCompressionRecommendation(null)

      expect(result.shouldCompress).toBe(true)
      expect(result.reason).toContain('Unable to analyze')
    })
  })

  describe('calculateOptimalSettings', () => {
    it('should return optimal settings for target size', async () => {
      const file = createMockFile({ size: 2 * 1024 * 1024 }) // 2MB
      const result = await calculateOptimalSettings(file, 500)

      expect(result).toBeDefined()
      expect(result.maxWidth).toBeDefined()
      expect(result.maxHeight).toBeDefined()
      expect(result.quality).toBeDefined()
    })

    it('should return high quality for files under target', async () => {
      const file = createMockFile({ size: 200 * 1024 }) // 200KB
      const result = await calculateOptimalSettings(file, 500)

      expect(result.quality).toBeGreaterThanOrEqual(0.9)
    })

    it('should reduce quality for larger files', async () => {
      const file = createMockFile({ size: 5 * 1024 * 1024 }) // 5MB
      const result = await calculateOptimalSettings(file, 200)

      expect(result.quality).toBeLessThan(0.9)
    })

    it('should throw error for invalid file', async () => {
      await expect(calculateOptimalSettings(null, 500)).rejects.toThrow('Invalid file')
    })

    it('should use default target of 500KB', async () => {
      const file = createMockFile({ size: 100 * 1024 }) // 100KB
      const result = await calculateOptimalSettings(file)

      expect(result.quality).toBeGreaterThanOrEqual(0.9)
    })
  })

  describe('Constants', () => {
    it('should export SUPPORTED_FORMATS', () => {
      expect(SUPPORTED_FORMATS).toBeDefined()
      expect(Array.isArray(SUPPORTED_FORMATS)).toBe(true)
    })

    it('should include jpeg in SUPPORTED_FORMATS', () => {
      expect(SUPPORTED_FORMATS).toContain('jpeg')
    })

    it('should include webp in SUPPORTED_FORMATS', () => {
      expect(SUPPORTED_FORMATS).toContain('webp')
    })

    it('should include png in SUPPORTED_FORMATS', () => {
      expect(SUPPORTED_FORMATS).toContain('png')
    })

    it('should export DEFAULT_OPTIONS', () => {
      expect(DEFAULT_OPTIONS).toBeDefined()
      expect(typeof DEFAULT_OPTIONS).toBe('object')
    })

    it('should have default maxWidth of 1920', () => {
      expect(DEFAULT_OPTIONS.maxWidth).toBe(1920)
    })

    it('should have default maxHeight of 1080', () => {
      expect(DEFAULT_OPTIONS.maxHeight).toBe(1080)
    })

    it('should have default quality of 0.8', () => {
      expect(DEFAULT_OPTIONS.quality).toBe(0.8)
    })

    it('should have default format of jpeg', () => {
      expect(DEFAULT_OPTIONS.format).toBe('jpeg')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty file name', async () => {
      const file = createMockFile({ name: '' })
      const result = await compressImage(file)

      expect(result.file.name).toContain('_compressed')
    })

    it('should handle file with multiple dots in name', async () => {
      const file = createMockFile({ name: 'my.photo.vacation.jpg' })
      const result = await compressImage(file)

      expect(result.file.name).toBeDefined()
    })

    it('should handle very small quality value', async () => {
      const file = createMockFile()
      const result = await compressImage(file, { quality: 0.01 })

      expect(result).toBeDefined()
    })

    it('should handle quality of exactly 0', async () => {
      const file = createMockFile()
      const result = await compressImage(file, { quality: 0 })

      expect(result).toBeDefined()
    })

    it('should handle quality of exactly 1', async () => {
      const file = createMockFile()
      const result = await compressImage(file, { quality: 1 })

      expect(result).toBeDefined()
    })

    it('should handle very large maxWidth', async () => {
      const file = createMockFile()
      const result = await compressImage(file, { maxWidth: 10000 })

      expect(result).toBeDefined()
    })

    it('should handle very small thumbnail size', async () => {
      const file = createMockFile()
      const result = await createThumbnail(file, 10)

      expect(result.size).toBe(10)
    })
  })
})
