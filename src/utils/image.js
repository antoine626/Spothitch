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
async function compressDataUrl(dataUrl, maxWidth = 1200, quality = 0.8) {
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
function getImageDimensions(src) {
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
function fileToBase64(file) {
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
async function createThumbnail(src, size = 100) {
  return compressDataUrl(src, size, 0.7);
}

/**
 * Lazy load images using Intersection Observer
 * More control than native loading="lazy" for custom behavior
 * @param {string} selector - CSS selector for images to observe
 * @param {Object} options - IntersectionObserver options
 * @returns {IntersectionObserver|null} The observer instance
 */
export function lazyLoadImages(selector = 'img[data-src]', options = {}) {
  // Check for browser support
  if (!('IntersectionObserver' in window)) {
    // Fallback: load all images immediately
    const images = document.querySelectorAll(selector);
    images.forEach((img) => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        delete img.dataset.src;
      }
    });
    return null;
  }

  const defaultOptions = {
    root: null,
    rootMargin: '50px 0px', // Start loading 50px before entering viewport
    threshold: 0.01,
  };

  const observerOptions = { ...defaultOptions, ...options };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;

        // Load the image
        if (img.dataset.src) {
          img.src = img.dataset.src;
          delete img.dataset.src;
        }

        // Add loaded class for fade-in animation
        img.classList.add('lazy-loaded');

        // Stop observing this image
        obs.unobserve(img);
      }
    });
  }, observerOptions);

  // Observe all matching images
  const images = document.querySelectorAll(selector);
  images.forEach((img) => observer.observe(img));

  return observer;
}

/**
 * Initialize lazy loading for dynamically added images
 * Call this after adding new images to the DOM
 * @param {HTMLElement} container - Container element to search within
 * @param {IntersectionObserver} observer - Existing observer instance
 */
export function observeNewImages(container, observer) {
  if (!observer) return;

  const images = container.querySelectorAll('img[data-src]');
  images.forEach((img) => observer.observe(img));
}

/**
 * Create a placeholder for lazy loading
 * @param {number} width - Width of the placeholder
 * @param {number} height - Height of the placeholder
 * @param {string} color - Background color (default: slate-700)
 * @returns {string} Base64 SVG placeholder
 */
export function createPlaceholder(width = 400, height = 300, color = '#334155') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="${color}"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Preload critical images (above the fold)
 * @param {string[]} urls - Array of image URLs to preload
 * @returns {Promise<void[]>}
 */
export function preloadImages(urls) {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to preload: ${url}`));
          img.src = url;
        })
    )
  );
}

export default {
  compressImage,
  compressDataUrl,
  getImageDimensions,
  fileToBase64,
  createThumbnail,
  lazyLoadImages,
  observeNewImages,
  createPlaceholder,
  preloadImages,
};
