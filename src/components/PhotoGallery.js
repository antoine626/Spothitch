/**
 * PhotoGallery Component (#62)
 * Carousel gallery for spot photos
 */

import { escapeHTML } from '../utils/sanitize.js';

/**
 * Render photo gallery with carousel
 * @param {Array} photos - Array of photo URLs
 * @param {string} spotId - Spot ID for identification
 * @returns {string} HTML string
 */
export function renderPhotoGallery(photos = [], spotId = 0) {
  if (!photos || photos.length === 0) {
    return `
      <div class="photo-gallery-empty bg-gray-800 rounded-xl p-8 text-center">
        <i class="fas fa-camera text-4xl text-slate-500 mb-3"></i>
        <p class="text-slate-400 text-sm">Aucune photo pour ce spot</p>
        <button
          onclick="openPhotoUpload(${spotId})"
          class="mt-3 text-primary-400 text-sm hover:underline"
        >
          <i class="fas fa-plus mr-1"></i>Ajouter une photo
        </button>
      </div>
    `;
  }

  const galleryId = `gallery-${spotId}`;

  return `
    <div class="photo-gallery relative" data-gallery-id="${galleryId}" data-current="0">
      <!-- Main Image -->
      <div class="relative aspect-video rounded-xl overflow-hidden bg-gray-800">
        <img
          id="${galleryId}-main"
          src="${escapeHTML(photos[0])}"
          alt="Photo du spot"
          class="w-full h-full object-cover transition-opacity duration-300"
          loading="lazy"
          onclick="openPhotoFullscreen('${galleryId}', 0)"
        />

        <!-- Navigation Arrows -->
        ${photos.length > 1 ? `
          <button
            onclick="prevPhoto('${galleryId}')"
            class="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50
              flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            aria-label="Photo precedente"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <button
            onclick="nextPhoto('${galleryId}')"
            class="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50
              flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            aria-label="Photo suivante"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        ` : ''}

        <!-- Photo Counter -->
        ${photos.length > 1 ? `
          <div class="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 text-white text-sm">
            <span id="${galleryId}-counter">1</span>/${photos.length}
          </div>
        ` : ''}

        <!-- Fullscreen Button -->
        <button
          onclick="openPhotoFullscreen('${galleryId}', getCurrentPhotoIndex('${galleryId}'))"
          class="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50
            flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          aria-label="Plein ecran"
        >
          <i class="fas fa-expand"></i>
        </button>
      </div>

      <!-- Thumbnails -->
      ${photos.length > 1 ? `
        <div class="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-thin">
          ${photos.map((photo, index) => `
            <button
              onclick="goToPhoto('${galleryId}', ${index})"
              class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
                ${index === 0 ? 'border-primary-500' : 'border-transparent hover:border-white/30'}"
              data-thumb-index="${index}"
              aria-label="Photo ${index + 1}"
            >
              <img
                src="${escapeHTML(photo)}"
                alt="Miniature ${index + 1}"
                class="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          `).join('')}
        </div>
      ` : ''}

      <!-- Add Photo Button -->
      <button
        onclick="openPhotoUpload(${spotId})"
        class="mt-3 w-full py-2 border border-dashed border-slate-600 rounded-lg text-slate-400
          hover:border-primary-500 hover:text-primary-400 transition-colors flex items-center justify-center gap-2"
      >
        <i class="fas fa-plus"></i>
        Ajouter une photo
      </button>

      <!-- Hidden data for JS -->
      <script type="application/json" id="${galleryId}-data">
        ${JSON.stringify(photos)}
      </script>
    </div>
  `;
}

/**
 * Render fullscreen photo viewer
 * @param {Array} photos - Array of photo URLs
 * @param {number} currentIndex - Current photo index
 * @param {string} galleryId - Gallery identifier
 * @returns {string} HTML string
 */
export function renderPhotoFullscreen(photos, currentIndex, galleryId) {
  return `
    <div
      id="photo-fullscreen"
      class="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      onclick="closePhotoFullscreen(event)"
    >
      <!-- Close Button -->
      <button
        onclick="closePhotoFullscreen()"
        class="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-white/10
          flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        aria-label="Fermer"
      >
        <i class="fas fa-times text-xl"></i>
      </button>

      <!-- Main Image Container -->
      <div class="relative w-full h-full flex items-center justify-center p-4" onclick="event.stopPropagation()">
        <img
          id="fullscreen-image"
          src="${escapeHTML(photos[currentIndex])}"
          alt="Photo en plein ecran"
          class="max-w-full max-h-full object-contain"
        />
      </div>

      <!-- Navigation -->
      ${photos.length > 1 ? `
        <button
          onclick="prevPhotoFullscreen(); event.stopPropagation();"
          class="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10
            flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label="Photo precedente"
        >
          <i class="fas fa-chevron-left text-xl"></i>
        </button>
        <button
          onclick="nextPhotoFullscreen(); event.stopPropagation();"
          class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10
            flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label="Photo suivante"
        >
          <i class="fas fa-chevron-right text-xl"></i>
        </button>
      ` : ''}

      <!-- Counter -->
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white">
        <span id="fullscreen-counter">${currentIndex + 1}</span> / ${photos.length}
      </div>

      <!-- Thumbnails Bar -->
      ${photos.length > 1 ? `
        <div class="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-lg">
          ${photos.map((photo, index) => `
            <button
              onclick="goToPhotoFullscreen(${index}); event.stopPropagation();"
              class="w-12 h-12 rounded overflow-hidden border-2 transition-all
                ${index === currentIndex ? 'border-primary-500' : 'border-transparent opacity-60 hover:opacity-100'}"
              aria-label="Photo ${index + 1}"
            >
              <img
                src="${escapeHTML(photo)}"
                alt="Miniature ${index + 1}"
                class="w-full h-full object-cover"
              />
            </button>
          `).join('')}
        </div>
      ` : ''}

      <!-- Hidden data -->
      <input type="hidden" id="fullscreen-gallery-id" value="${galleryId}" />
      <input type="hidden" id="fullscreen-current-index" value="${currentIndex}" />
      <script type="application/json" id="fullscreen-photos-data">
        ${JSON.stringify(photos)}
      </script>
    </div>
  `;
}

// ==================== GLOBAL HANDLERS ====================

/**
 * Get current photo index for a gallery
 */
window.getCurrentPhotoIndex = (galleryId) => {
  const gallery = document.querySelector(`[data-gallery-id="${galleryId}"]`);
  return parseInt(gallery?.dataset.current || 0);
};

/**
 * Go to specific photo in gallery
 */
window.goToPhoto = (galleryId, index) => {
  const gallery = document.querySelector(`[data-gallery-id="${galleryId}"]`);
  if (!gallery) return;

  const dataEl = document.getElementById(`${galleryId}-data`);
  if (!dataEl) return;

  const photos = JSON.parse(dataEl.textContent);
  if (index < 0 || index >= photos.length) return;

  // Update main image
  const mainImg = document.getElementById(`${galleryId}-main`);
  if (mainImg) {
    mainImg.style.opacity = '0';
    setTimeout(() => {
      mainImg.src = photos[index];
      mainImg.style.opacity = '1';
    }, 150);
  }

  // Update counter
  const counter = document.getElementById(`${galleryId}-counter`);
  if (counter) counter.textContent = index + 1;

  // Update thumbnails
  gallery.querySelectorAll('[data-thumb-index]').forEach((thumb, i) => {
    thumb.classList.toggle('border-primary-500', i === index);
    thumb.classList.toggle('border-transparent', i !== index);
  });

  // Store current index
  gallery.dataset.current = index;
};

/**
 * Go to next photo
 */
window.nextPhoto = (galleryId) => {
  const gallery = document.querySelector(`[data-gallery-id="${galleryId}"]`);
  if (!gallery) return;

  const dataEl = document.getElementById(`${galleryId}-data`);
  if (!dataEl) return;

  const photos = JSON.parse(dataEl.textContent);
  const current = parseInt(gallery.dataset.current || 0);
  const next = (current + 1) % photos.length;

  window.goToPhoto(galleryId, next);
};

/**
 * Go to previous photo
 */
window.prevPhoto = (galleryId) => {
  const gallery = document.querySelector(`[data-gallery-id="${galleryId}"]`);
  if (!gallery) return;

  const dataEl = document.getElementById(`${galleryId}-data`);
  if (!dataEl) return;

  const photos = JSON.parse(dataEl.textContent);
  const current = parseInt(gallery.dataset.current || 0);
  const prev = (current - 1 + photos.length) % photos.length;

  window.goToPhoto(galleryId, prev);
};

/**
 * Open fullscreen photo viewer
 */
window.openPhotoFullscreen = async (galleryId, index) => {
  const dataEl = document.getElementById(`${galleryId}-data`);
  if (!dataEl) return;

  const photos = JSON.parse(dataEl.textContent);

  // Create fullscreen container
  const container = document.createElement('div');
  container.innerHTML = renderPhotoFullscreen(photos, index, galleryId);
  document.body.appendChild(container.firstElementChild);

  // Prevent body scroll
  document.body.style.overflow = 'hidden';

  // Add keyboard navigation
  document.addEventListener('keydown', handleFullscreenKeydown);
};

/**
 * Close fullscreen viewer
 */
window.closePhotoFullscreen = (event) => {
  if (event && event.target !== event.currentTarget) return;

  const fullscreen = document.getElementById('photo-fullscreen');
  if (fullscreen) {
    fullscreen.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleFullscreenKeydown);
  }
};

/**
 * Navigate fullscreen photos
 */
window.nextPhotoFullscreen = () => {
  const dataEl = document.getElementById('fullscreen-photos-data');
  const indexEl = document.getElementById('fullscreen-current-index');
  if (!dataEl || !indexEl) return;

  const photos = JSON.parse(dataEl.textContent);
  const current = parseInt(indexEl.value);
  const next = (current + 1) % photos.length;

  updateFullscreenPhoto(photos, next);
};

window.prevPhotoFullscreen = () => {
  const dataEl = document.getElementById('fullscreen-photos-data');
  const indexEl = document.getElementById('fullscreen-current-index');
  if (!dataEl || !indexEl) return;

  const photos = JSON.parse(dataEl.textContent);
  const current = parseInt(indexEl.value);
  const prev = (current - 1 + photos.length) % photos.length;

  updateFullscreenPhoto(photos, prev);
};

window.goToPhotoFullscreen = (index) => {
  const dataEl = document.getElementById('fullscreen-photos-data');
  if (!dataEl) return;

  const photos = JSON.parse(dataEl.textContent);
  updateFullscreenPhoto(photos, index);
};

/**
 * Update fullscreen photo display
 */
function updateFullscreenPhoto(photos, index) {
  const img = document.getElementById('fullscreen-image');
  const counter = document.getElementById('fullscreen-counter');
  const indexEl = document.getElementById('fullscreen-current-index');

  if (img) img.src = photos[index];
  if (counter) counter.textContent = index + 1;
  if (indexEl) indexEl.value = index;

  // Update thumbnails
  const container = document.getElementById('photo-fullscreen');
  if (container) {
    container.querySelectorAll('button[aria-label^="Photo"]').forEach((btn, i) => {
      btn.classList.toggle('border-primary-500', i === index);
      btn.classList.toggle('border-transparent', i !== index);
      btn.classList.toggle('opacity-60', i !== index);
    });
  }
}

/**
 * Handle keyboard navigation in fullscreen
 */
function handleFullscreenKeydown(e) {
  if (e.key === 'Escape') {
    window.closePhotoFullscreen();
  } else if (e.key === 'ArrowRight') {
    window.nextPhotoFullscreen();
  } else if (e.key === 'ArrowLeft') {
    window.prevPhotoFullscreen();
  }
}

/**
 * Open photo upload modal
 */
window.openPhotoUpload = async (spotId) => {
  const { setState } = await import('../stores/state.js');
  setState({ showPhotoUpload: true, photoUploadSpotId: spotId });
};

export default { renderPhotoGallery, renderPhotoFullscreen };
