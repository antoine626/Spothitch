/**
 * Image Optimizer Service
 * Generate thumbnails and optimize images for better performance
 */

// Thumbnail sizes configuration
export const THUMBNAIL_SIZES = {
  small: { width: 128, height: 128 },
  medium: { width: 256, height: 256 },
  card: { width: 256, height: 192 },
  profile: { width: 96, height: 96 },
  spot: { width: 400, height: 300 },
};

// Max file sizes (in bytes)
const MAX_ORIGINAL_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_THUMBNAIL_SIZE = 100 * 1024; // 100KB

// Supported formats
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Cache for generated thumbnails
const thumbnailCache = new Map();

/**
 * Compress and resize an image
 * @param {File|Blob|string} source - Image source (File, Blob, or data URL)
 * @param {Object} options - Compression options
 * @returns {Promise<{dataUrl: string, blob: Blob, width: number, height: number}>}
 */
export async function compressImage(source, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    format = 'image/jpeg',
  } = options;

  // Load image
  const img = await loadImage(source);

  // Calculate new dimensions
  const { width, height } = calculateDimensions(
    img.width,
    img.height,
    maxWidth,
    maxHeight
  );

  // Create canvas and compress
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');

  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw image
  ctx.drawImage(img, 0, 0, width, height);

  // Get compressed data
  const dataUrl = canvas.toDataURL(format, quality);
  const blob = await canvasToBlob(canvas, format, quality);

  return {
    dataUrl,
    blob,
    width,
    height,
    size: blob.size,
    format,
  };
}

/**
 * Generate a thumbnail from an image
 * @param {File|Blob|string} source - Image source
 * @param {string} size - Size preset (small, medium, card, profile, spot)
 * @returns {Promise<{dataUrl: string, blob: Blob}>}
 */
export async function generateThumbnail(source, size = 'medium') {
  // Check cache
  const cacheKey = typeof source === 'string' ? source : source.name || Date.now();
  const cached = thumbnailCache.get(`${cacheKey}_${size}`);
  if (cached) return cached;

  const dimensions = THUMBNAIL_SIZES[size] || THUMBNAIL_SIZES.medium;

  // Load image
  const img = await loadImage(source);

  // Calculate crop dimensions to maintain aspect ratio
  const { sx, sy, sw, sh, dw, dh } = calculateCropDimensions(
    img.width,
    img.height,
    dimensions.width,
    dimensions.height
  );

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = dw;
  canvas.height = dh;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw cropped and resized image
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

  // Convert to optimized format
  const format = 'image/webp';
  const quality = 0.8;

  const dataUrl = canvas.toDataURL(format, quality);
  const blob = await canvasToBlob(canvas, format, quality);

  const result = { dataUrl, blob, width: dw, height: dh, size: blob.size };

  // Cache result
  thumbnailCache.set(`${cacheKey}_${size}`, result);

  // Limit cache size
  if (thumbnailCache.size > 100) {
    const firstKey = thumbnailCache.keys().next().value;
    thumbnailCache.delete(firstKey);
  }

  return result;
}

/**
 * Generate all thumbnail sizes for an image
 * @param {File|Blob|string} source
 * @returns {Promise<Object>}
 */
export async function generateAllThumbnails(source) {
  const results = {};

  for (const [sizeName] of Object.entries(THUMBNAIL_SIZES)) {
    try {
      results[sizeName] = await generateThumbnail(source, sizeName);
    } catch (error) {
      console.error(`Failed to generate ${sizeName} thumbnail:`, error);
    }
  }

  return results;
}

/**
 * Validate image file
 * @param {File} file
 * @returns {{valid: boolean, error?: string}}
 */
export function validateImage(file) {
  if (!file) {
    return { valid: false, error: 'Aucun fichier fourni' };
  }

  if (!SUPPORTED_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: 'Format non supporté. Utilisez JPG, PNG, WebP ou GIF',
    };
  }

  if (file.size > MAX_ORIGINAL_SIZE) {
    const sizeMB = (MAX_ORIGINAL_SIZE / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      error: `Fichier trop volumineux. Maximum ${sizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Get image dimensions without loading full image
 * @param {File|Blob|string} source
 * @returns {Promise<{width: number, height: number}>}
 */
export async function getImageDimensions(source) {
  const img = await loadImage(source);
  return { width: img.width, height: img.height };
}

/**
 * Convert image to WebP format
 * @param {File|Blob|string} source
 * @param {number} quality
 * @returns {Promise<{dataUrl: string, blob: Blob}>}
 */
export async function convertToWebP(source, quality = 0.85) {
  const img = await loadImage(source);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const dataUrl = canvas.toDataURL('image/webp', quality);
  const blob = await canvasToBlob(canvas, 'image/webp', quality);

  return { dataUrl, blob, size: blob.size };
}

/**
 * Create a placeholder image (blur placeholder for lazy loading)
 * @param {File|Blob|string} source
 * @returns {Promise<string>} - Base64 blur placeholder
 */
export async function createBlurPlaceholder(source) {
  const img = await loadImage(source);

  // Very small dimensions for blur
  const width = 10;
  const height = Math.round((img.height / img.width) * width);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  // Return tiny base64
  return canvas.toDataURL('image/jpeg', 0.5);
}

/**
 * Load an image from various sources
 * @param {File|Blob|string} source
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));

    if (source instanceof Blob || source instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(source);
    } else if (typeof source === 'string') {
      img.src = source;
    } else {
      reject(new Error('Invalid image source'));
    }
  });
}

/**
 * Calculate dimensions maintaining aspect ratio
 * @param {number} srcWidth
 * @param {number} srcHeight
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @returns {{width: number, height: number}}
 */
function calculateDimensions(srcWidth, srcHeight, maxWidth, maxHeight) {
  let width = srcWidth;
  let height = srcHeight;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  return { width, height };
}

/**
 * Calculate crop dimensions for center-crop
 * @param {number} srcWidth
 * @param {number} srcHeight
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @returns {Object}
 */
function calculateCropDimensions(srcWidth, srcHeight, targetWidth, targetHeight) {
  const srcAspect = srcWidth / srcHeight;
  const targetAspect = targetWidth / targetHeight;

  let sx, sy, sw, sh;

  if (srcAspect > targetAspect) {
    // Source is wider - crop horizontally
    sh = srcHeight;
    sw = srcHeight * targetAspect;
    sx = (srcWidth - sw) / 2;
    sy = 0;
  } else {
    // Source is taller - crop vertically
    sw = srcWidth;
    sh = srcWidth / targetAspect;
    sx = 0;
    sy = (srcHeight - sh) / 2;
  }

  return {
    sx,
    sy,
    sw,
    sh,
    dw: targetWidth,
    dh: targetHeight,
  };
}

/**
 * Convert canvas to Blob
 * @param {HTMLCanvasElement} canvas
 * @param {string} type
 * @param {number} quality
 * @returns {Promise<Blob>}
 */
function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      type,
      quality
    );
  });
}

/**
 * Clear thumbnail cache
 */
export function clearThumbnailCache() {
  thumbnailCache.clear();
}

/**
 * Get cache statistics
 * @returns {{size: number, entries: number}}
 */
export function getCacheStats() {
  let totalSize = 0;
  thumbnailCache.forEach((entry) => {
    totalSize += entry.size || 0;
  });

  return {
    entries: thumbnailCache.size,
    size: totalSize,
    sizeFormatted: formatBytes(totalSize),
  };
}

/**
 * Format bytes to human readable
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default {
  compressImage,
  generateThumbnail,
  generateAllThumbnails,
  validateImage,
  getImageDimensions,
  convertToWebP,
  createBlurPlaceholder,
  clearThumbnailCache,
  getCacheStats,
  THUMBNAIL_SIZES,
};
