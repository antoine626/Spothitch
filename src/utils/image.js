/**
 * Image Utility Functions
 * Compression and processing
 */

/**
 * Compress an image file
 * @param {File} file - Image file to compress
 * @param {number} maxWidth - Maximum width (default 1200)
 * @param {number} quality - JPEG quality 0-1 (default 0.8)
 * @returns {Promise<string>} Base64 data URL
 */
export async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64
        const compressed = canvas.toDataURL('image/jpeg', quality);

        // Log compression ratio
        const originalSize = e.target.result.length;
        const compressedSize = compressed.length;
        const ratio = Math.round(compressedSize / originalSize * 100);
        const origKB = Math.round(originalSize / 1024);
        const compKB = Math.round(compressedSize / 1024);
        console.log(`📸 Compressed: ${origKB}KB → ${compKB}KB (${ratio}%)`);

        resolve(compressed);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress a base64 data URL
 * @param {string} dataUrl - Base64 data URL
 * @param {number} maxWidth - Maximum width
 * @param {number} quality - JPEG quality
 * @returns {Promise<string>} Compressed base64 data URL
 */
export async function compressDataUrl(dataUrl, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width));
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/**
 * Get image dimensions
 * @param {string} src - Image source (URL or data URL)
 * @returns {Promise<{width: number, height: number}>}
 */
export function getImageDimensions(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Convert file to base64
 * @param {File} file - File to convert
 * @returns {Promise<string>} Base64 data URL
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Create thumbnail from image
 * @param {string} src - Image source
 * @param {number} size - Thumbnail size
 * @returns {Promise<string>} Thumbnail data URL
 */
export async function createThumbnail(src, size = 100) {
  return compressDataUrl(src, size, 0.7);
}

export default {
  compressImage,
  compressDataUrl,
  getImageDimensions,
  fileToBase64,
  createThumbnail,
};
