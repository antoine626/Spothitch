/**
 * Lazy Image Loading with Intersection Observer
 * Defers loading of off-screen images until they enter the viewport
 * Supports native loading="lazy" with IO fallback
 */

const OBSERVED = new WeakSet()
const DEFAULT_THRESHOLD = 0.1
const DEFAULT_ROOT_MARGIN = '200px 0px' // Start loading 200px before visible

let observer = null

/**
 * Create or return the shared IntersectionObserver
 */
function getObserver() {
  if (observer) return observer

  if (typeof IntersectionObserver === 'undefined') return null

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target
        loadImage(img)
        observer.unobserve(img)
      }
    })
  }, {
    rootMargin: DEFAULT_ROOT_MARGIN,
    threshold: DEFAULT_THRESHOLD,
  })

  return observer
}

/**
 * Load the actual image source
 */
function loadImage(img) {
  const src = img.dataset.src
  const srcset = img.dataset.srcset

  if (src) {
    img.src = src
    img.removeAttribute('data-src')
  }
  if (srcset) {
    img.srcset = srcset
    img.removeAttribute('data-srcset')
  }

  img.classList.remove('lazy')
  img.classList.add('lazy-loaded')

  // Fade-in animation
  if (!img.closest('[data-no-animation]')) {
    img.style.opacity = '0'
    img.style.transition = 'opacity 0.3s ease'
    img.onload = () => {
      img.style.opacity = '1'
    }
  }
}

/**
 * Observe a single image element for lazy loading
 * @param {HTMLImageElement} img
 */
function observeImage(img) {
  if (OBSERVED.has(img)) return
  OBSERVED.add(img)

  // Use native lazy loading if available
  if ('loading' in HTMLImageElement.prototype && !img.dataset.forceIo) {
    img.loading = 'lazy'
    loadImage(img)
    return
  }

  const io = getObserver()
  if (io) {
    io.observe(img)
  } else {
    // Fallback: load immediately
    loadImage(img)
  }
}

/**
 * Scan the DOM for lazy images and observe them
 * Call after each render cycle
 * Images should have: <img data-src="..." class="lazy" alt="...">
 */
export function observeAllLazyImages(root = document) {
  const images = root.querySelectorAll('img[data-src]:not(.lazy-loaded)')
  images.forEach(observeImage)
}

/**
 * Generate a lazy image HTML string (for template rendering)
 * @param {string} src - The actual image URL
 * @param {string} alt - Alt text
 * @param {string} [className] - CSS classes
 * @param {number} [width] - Width
 * @param {number} [height] - Height
 * @returns {string} HTML string
 */
function lazyImg(src, alt, className = '', width = '', height = '') {
  const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect fill="%231e293b" width="1" height="1"/%3E%3C/svg%3E'
  const w = width ? `width="${width}"` : ''
  const h = height ? `height="${height}"` : ''
  return `<img src="${placeholder}" data-src="${src}" alt="${alt}" class="lazy ${className}" ${w} ${h} loading="lazy">`
}

/**
 * Cleanup observer
 */
function destroyLazyObserver() {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

export default { observeImage, observeAllLazyImages, lazyImg, destroyLazyObserver }
