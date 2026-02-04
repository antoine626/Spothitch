/**
 * Image Compression Service
 * Provides image compression, resizing, and conversion utilities for spot photo uploads
 * Uses Canvas API for browser-based image processing (no external dependencies)
 */

// Default compression options
export const DEFAULT_OPTIONS = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'jpeg',
}

// Supported formats for compression
export const SUPPORTED_FORMATS = ['jpeg', 'webp', 'png']
const MIME_TYPES = {
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  png: 'image/png',
}

// Maximum file size constants
const MAX_FILE_SIZE_MB = 10 // Maximum allowed file size
const BYTES_PER_MB = 1024 * 1024

/**
 * Compress an image file before upload
 * @param {File} file - Image file to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Maximum width (default 1920)
 * @param {number} options.maxHeight - Maximum height (default 1080)
 * @param {number} options.quality - Quality 0-1 (default 0.8)
 * @param {string} options.format - Output format 'jpeg', 'webp', or 'png' (default 'jpeg')
 * @returns {Promise<{file: File, blob: Blob, dataUrl: string, width: number, height: number, originalSize: number, compressedSize: number, compressionRatio: number}>}
 */
export async function compressImage(file, options = {}) {
  // Validate input
  if (!file || !(file instanceof Blob)) {
    throw new Error('Invalid file: expected a File or Blob object')
  }

  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type: expected an image file')
  }

  const config = { ...DEFAULT_OPTIONS, ...options }

  // Validate format
  if (!SUPPORTED_FORMATS.includes(config.format)) {
    throw new Error(`Unsupported format: ${config.format}. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`)
  }

  // Validate quality
  if (config.quality < 0 || config.quality > 1) {
    throw new Error('Quality must be between 0 and 1')
  }

  const originalSize = file.size
  const mimeType = MIME_TYPES[config.format]

  // Load image
  const img = await loadImageFromFile(file)

  // Calculate new dimensions
  const { width, height } = calculateDimensions(
    img.width,
    img.height,
    config.maxWidth,
    config.maxHeight
  )

  // Create canvas and compress
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Draw image
  ctx.drawImage(img, 0, 0, width, height)

  // Get compressed data
  const dataUrl = canvas.toDataURL(mimeType, config.quality)
  const blob = await canvasToBlob(canvas, mimeType, config.quality)

  // Create new File object
  const fileName = generateFileName(file.name, config.format)
  const compressedFile = new File([blob], fileName, { type: mimeType })

  const compressedSize = blob.size
  const compressionRatio = originalSize > 0 ? Math.round((compressedSize / originalSize) * 100) : 100

  return {
    file: compressedFile,
    blob,
    dataUrl,
    width,
    height,
    originalSize,
    compressedSize,
    compressionRatio,
  }
}

/**
 * Resize an image without changing quality (maintains original format quality)
 * @param {File} file - Image file to resize
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {Promise<{file: File, blob: Blob, width: number, height: number}>}
 */
export async function resizeImage(file, maxWidth, maxHeight) {
  // Validate input
  if (!file || !(file instanceof Blob)) {
    throw new Error('Invalid file: expected a File or Blob object')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type: expected an image file')
  }

  if (typeof maxWidth !== 'number' || typeof maxHeight !== 'number') {
    throw new Error('maxWidth and maxHeight must be numbers')
  }

  if (maxWidth <= 0 || maxHeight <= 0) {
    throw new Error('maxWidth and maxHeight must be positive numbers')
  }

  // Load image
  const img = await loadImageFromFile(file)

  // Calculate new dimensions
  const { width, height } = calculateDimensions(
    img.width,
    img.height,
    maxWidth,
    maxHeight
  )

  // If no resize needed, return original
  if (width === img.width && height === img.height) {
    return {
      file,
      blob: file,
      width: img.width,
      height: img.height,
    }
  }

  // Create canvas
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.drawImage(img, 0, 0, width, height)

  // Maintain original format with high quality
  const mimeType = file.type || 'image/jpeg'
  const quality = 1 // Maximum quality to preserve detail

  const blob = await canvasToBlob(canvas, mimeType, quality)
  const resizedFile = new File([blob], file.name, { type: mimeType })

  return {
    file: resizedFile,
    blob,
    width,
    height,
  }
}

/**
 * Get dimensions of an image file
 * @param {File} file - Image file
 * @returns {Promise<{width: number, height: number}>}
 */
export async function getImageDimensions(file) {
  // Validate input
  if (!file || !(file instanceof Blob)) {
    throw new Error('Invalid file: expected a File or Blob object')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type: expected an image file')
  }

  const img = await loadImageFromFile(file)
  return {
    width: img.width,
    height: img.height,
  }
}

/**
 * Convert an image file to WebP format
 * @param {File} file - Image file to convert
 * @param {number} quality - Quality 0-1 (default 0.8)
 * @returns {Promise<{file: File, blob: Blob, dataUrl: string, originalSize: number, convertedSize: number}>}
 */
export async function convertToWebP(file, quality = 0.8) {
  // Validate input
  if (!file || !(file instanceof Blob)) {
    throw new Error('Invalid file: expected a File or Blob object')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type: expected an image file')
  }

  if (quality < 0 || quality > 1) {
    throw new Error('Quality must be between 0 and 1')
  }

  const originalSize = file.size

  // Load image
  const img = await loadImageFromFile(file)

  // Create canvas at original size
  const canvas = createCanvas(img.width, img.height)
  const ctx = canvas.getContext('2d')

  ctx.drawImage(img, 0, 0)

  // Convert to WebP
  const mimeType = 'image/webp'
  const dataUrl = canvas.toDataURL(mimeType, quality)
  const blob = await canvasToBlob(canvas, mimeType, quality)

  // Generate filename with .webp extension
  const baseName = file.name.replace(/\.[^.]+$/, '')
  const fileName = `${baseName}.webp`
  const convertedFile = new File([blob], fileName, { type: mimeType })

  return {
    file: convertedFile,
    blob,
    dataUrl,
    originalSize,
    convertedSize: blob.size,
  }
}

/**
 * Estimate the compressed size of an image at a given quality
 * @param {File} file - Image file
 * @param {number} quality - Quality 0-1
 * @returns {Promise<{estimatedSize: number, estimatedSizeKB: number, originalSize: number, ratio: number}>}
 */
export async function estimateCompressedSize(file, quality = 0.8) {
  // Validate input
  if (!file || !(file instanceof Blob)) {
    throw new Error('Invalid file: expected a File or Blob object')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type: expected an image file')
  }

  if (quality < 0 || quality > 1) {
    throw new Error('Quality must be between 0 and 1')
  }

  const originalSize = file.size

  // Load and compress to estimate
  const img = await loadImageFromFile(file)

  const canvas = createCanvas(img.width, img.height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)

  // Use JPEG for estimation as it's most common
  const blob = await canvasToBlob(canvas, 'image/jpeg', quality)
  const estimatedSize = blob.size

  return {
    estimatedSize,
    estimatedSizeKB: Math.round(estimatedSize / 1024),
    originalSize,
    ratio: originalSize > 0 ? Math.round((estimatedSize / originalSize) * 100) : 100,
  }
}

/**
 * Check if an image file exceeds a size limit
 * @param {File} file - Image file to check
 * @param {number} maxSizeMB - Maximum size in megabytes (default 5)
 * @returns {{isTooLarge: boolean, currentSizeMB: number, maxSizeMB: number, exceedsByMB: number}}
 */
export function isImageTooLarge(file, maxSizeMB = 5) {
  // Validate input
  if (!file || typeof file.size !== 'number') {
    throw new Error('Invalid file: expected a File or Blob object with size property')
  }

  if (typeof maxSizeMB !== 'number' || maxSizeMB <= 0) {
    throw new Error('maxSizeMB must be a positive number')
  }

  const fileSizeMB = file.size / BYTES_PER_MB
  const isTooLarge = fileSizeMB > maxSizeMB
  const exceedsByMB = isTooLarge ? fileSizeMB - maxSizeMB : 0

  return {
    isTooLarge,
    currentSizeMB: Math.round(fileSizeMB * 100) / 100,
    maxSizeMB,
    exceedsByMB: Math.round(exceedsByMB * 100) / 100,
  }
}

/**
 * Create a square thumbnail from an image file
 * @param {File} file - Image file
 * @param {number} size - Thumbnail size in pixels (default 200)
 * @returns {Promise<{file: File, blob: Blob, dataUrl: string, size: number}>}
 */
export async function createThumbnail(file, size = 200) {
  // Validate input
  if (!file || !(file instanceof Blob)) {
    throw new Error('Invalid file: expected a File or Blob object')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type: expected an image file')
  }

  if (typeof size !== 'number' || size <= 0) {
    throw new Error('Size must be a positive number')
  }

  // Load image
  const img = await loadImageFromFile(file)

  // Calculate crop for center-square
  const cropParams = calculateCenterCrop(img.width, img.height, size)

  // Create canvas
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Draw cropped and resized image
  ctx.drawImage(
    img,
    cropParams.sx,
    cropParams.sy,
    cropParams.sw,
    cropParams.sh,
    0,
    0,
    size,
    size
  )

  // Use JPEG for thumbnails (smaller file size)
  const mimeType = 'image/jpeg'
  const quality = 0.8

  const dataUrl = canvas.toDataURL(mimeType, quality)
  const blob = await canvasToBlob(canvas, mimeType, quality)

  // Generate thumbnail filename
  const baseName = file.name.replace(/\.[^.]+$/, '')
  const fileName = `${baseName}_thumb_${size}.jpg`
  const thumbnailFile = new File([blob], fileName, { type: mimeType })

  return {
    file: thumbnailFile,
    blob,
    dataUrl,
    size,
  }
}

/**
 * Validate if a file is a valid image for upload
 * @param {File} file - File to validate
 * @returns {{valid: boolean, error?: string}}
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'Aucun fichier fourni' }
  }

  if (!(file instanceof Blob)) {
    return { valid: false, error: 'Fichier invalide' }
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Format non supporté. Utilisez JPG, PNG, WebP ou GIF' }
  }

  if (file.size > MAX_FILE_SIZE_MB * BYTES_PER_MB) {
    return { valid: false, error: `Fichier trop volumineux. Maximum ${MAX_FILE_SIZE_MB}MB` }
  }

  return { valid: true }
}

/**
 * Get compression recommendations based on file size
 * @param {File} file - Image file
 * @returns {{quality: number, format: string, shouldCompress: boolean, reason: string}}
 */
export function getCompressionRecommendation(file) {
  if (!file || typeof file.size !== 'number') {
    return {
      quality: 0.8,
      format: 'jpeg',
      shouldCompress: true,
      reason: 'Unable to analyze file',
    }
  }

  const sizeMB = file.size / BYTES_PER_MB

  // Small files don't need compression
  if (sizeMB < 0.5) {
    return {
      quality: 0.95,
      format: 'webp',
      shouldCompress: false,
      reason: 'File is already small enough',
    }
  }

  // Medium files - light compression
  if (sizeMB < 2) {
    return {
      quality: 0.85,
      format: 'webp',
      shouldCompress: true,
      reason: 'Light compression recommended',
    }
  }

  // Large files - moderate compression
  if (sizeMB < 5) {
    return {
      quality: 0.75,
      format: 'jpeg',
      shouldCompress: true,
      reason: 'Moderate compression recommended',
    }
  }

  // Very large files - aggressive compression
  return {
    quality: 0.6,
    format: 'jpeg',
    shouldCompress: true,
    reason: 'Aggressive compression recommended for large file',
  }
}

/**
 * Calculate optimal dimensions for a target file size
 * @param {File} file - Image file
 * @param {number} targetSizeKB - Target file size in KB
 * @returns {Promise<{maxWidth: number, maxHeight: number, quality: number}>}
 */
export async function calculateOptimalSettings(file, targetSizeKB = 500) {
  if (!file || !(file instanceof Blob)) {
    throw new Error('Invalid file: expected a File or Blob object')
  }

  const dimensions = await getImageDimensions(file)
  const currentSizeKB = file.size / 1024

  // If already under target, minimal changes needed
  if (currentSizeKB <= targetSizeKB) {
    return {
      maxWidth: dimensions.width,
      maxHeight: dimensions.height,
      quality: 0.9,
    }
  }

  // Calculate reduction ratio
  const ratio = targetSizeKB / currentSizeKB

  // Adjust dimensions and quality based on ratio
  let quality = 0.8
  let scale = 1

  if (ratio < 0.1) {
    // Need significant reduction
    quality = 0.5
    scale = 0.5
  } else if (ratio < 0.3) {
    quality = 0.6
    scale = 0.7
  } else if (ratio < 0.5) {
    quality = 0.7
    scale = 0.85
  }

  return {
    maxWidth: Math.round(dimensions.width * scale),
    maxHeight: Math.round(dimensions.height * scale),
    quality,
  }
}

// ==================== Private Helper Functions ====================

/**
 * Load an image from a File object
 * @private
 */
function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target.result
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Calculate dimensions maintaining aspect ratio
 * @private
 */
function calculateDimensions(srcWidth, srcHeight, maxWidth, maxHeight) {
  let width = srcWidth
  let height = srcHeight

  // Scale down if width exceeds max
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width)
    width = maxWidth
  }

  // Scale down if height still exceeds max
  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height)
    height = maxHeight
  }

  return { width, height }
}

/**
 * Calculate center crop parameters for square thumbnail
 * @private
 */
function calculateCenterCrop(srcWidth, srcHeight, targetSize) {
  const srcAspect = srcWidth / srcHeight
  const targetAspect = 1 // Square

  let sx, sy, sw, sh

  if (srcAspect > targetAspect) {
    // Source is wider - crop horizontally
    sh = srcHeight
    sw = srcHeight // Square crop from height
    sx = (srcWidth - sw) / 2
    sy = 0
  } else {
    // Source is taller - crop vertically
    sw = srcWidth
    sh = srcWidth // Square crop from width
    sx = 0
    sy = (srcHeight - sh) / 2
  }

  return { sx, sy, sw, sh }
}

/**
 * Create a canvas element
 * @private
 */
function createCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

/**
 * Convert canvas to Blob
 * @private
 */
function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob from canvas'))
        }
      },
      type,
      quality
    )
  })
}

/**
 * Generate a new filename with the specified format extension
 * @private
 */
function generateFileName(originalName, format) {
  const baseName = originalName.replace(/\.[^.]+$/, '')
  const extension = format === 'jpeg' ? 'jpg' : format
  return `${baseName}_compressed.${extension}`
}

// Export default object with all functions
export default {
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
}
