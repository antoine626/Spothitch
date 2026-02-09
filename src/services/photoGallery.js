/**
 * Photo Gallery Service (#62)
 * Manages photos for spots: CRUD, likes, reports, metadata
 *
 * Features:
 * - Get/add/delete photos for spots
 * - Set main/cover photo
 * - Reorder photos
 * - Photo metadata (date, user, etc.)
 * - Like/unlike photos
 * - Report inappropriate photos
 * - Render photo grid, lightbox, uploader
 * - Lightbox navigation
 *
 * Supported formats: JPEG, PNG, WebP
 * Max photos per spot: 10
 * Storage: localStorage with key 'spothitch_photo_gallery'
 */

import { getState, setState } from '../stores/state.js';
import { escapeHTML } from '../utils/sanitize.js';

// ==================== CONSTANTS ====================

const STORAGE_KEY = 'spothitch_photo_gallery';
const MAX_PHOTOS_PER_SPOT = 10;
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'jpeg', 'jpg', 'png', 'webp'];

// ==================== i18n TRANSLATIONS ====================

const translations = {
  fr: {
    noPhotos: 'Aucune photo pour ce spot',
    addPhoto: 'Ajouter une photo',
    photoOf: 'Photo du spot',
    previousPhoto: 'Photo precedente',
    nextPhoto: 'Photo suivante',
    fullscreen: 'Plein ecran',
    close: 'Fermer',
    thumbnail: 'Miniature',
    likes: 'J\'aime',
    like: 'Aimer',
    unlike: 'Ne plus aimer',
    report: 'Signaler',
    reportPhoto: 'Signaler cette photo',
    reportReason: 'Raison du signalement',
    reportReasons: {
      inappropriate: 'Contenu inapproprie',
      offensive: 'Contenu offensant',
      spam: 'Spam ou publicite',
      copyright: 'Violation de droits d\'auteur',
      other: 'Autre',
    },
    reportSubmitted: 'Signalement envoye',
    uploadPhoto: 'Telecharger une photo',
    dragDrop: 'Glissez une photo ici ou cliquez pour selectionner',
    maxPhotos: 'Maximum {max} photos par spot',
    photoAdded: 'Photo ajoutee !',
    photoDeleted: 'Photo supprimee',
    mainPhotoSet: 'Photo principale definie',
    photosReordered: 'Photos reordonnees',
    invalidFormat: 'Format non supporte. Utilisez JPEG, PNG ou WebP',
    maxPhotosReached: 'Limite de {max} photos atteinte',
    uploadError: 'Erreur lors du telechargement',
    deleteConfirm: 'Supprimer cette photo ?',
    photoBy: 'Photo par',
    addedOn: 'Ajoutee le',
    mainPhoto: 'Photo principale',
    setAsMain: 'Definir comme principale',
    delete: 'Supprimer',
  },
  en: {
    noPhotos: 'No photos for this spot',
    addPhoto: 'Add a photo',
    photoOf: 'Spot photo',
    previousPhoto: 'Previous photo',
    nextPhoto: 'Next photo',
    fullscreen: 'Fullscreen',
    close: 'Close',
    thumbnail: 'Thumbnail',
    likes: 'Likes',
    like: 'Like',
    unlike: 'Unlike',
    report: 'Report',
    reportPhoto: 'Report this photo',
    reportReason: 'Report reason',
    reportReasons: {
      inappropriate: 'Inappropriate content',
      offensive: 'Offensive content',
      spam: 'Spam or advertising',
      copyright: 'Copyright violation',
      other: 'Other',
    },
    reportSubmitted: 'Report submitted',
    uploadPhoto: 'Upload a photo',
    dragDrop: 'Drag a photo here or click to select',
    maxPhotos: 'Maximum {max} photos per spot',
    photoAdded: 'Photo added!',
    photoDeleted: 'Photo deleted',
    mainPhotoSet: 'Main photo set',
    photosReordered: 'Photos reordered',
    invalidFormat: 'Unsupported format. Use JPEG, PNG or WebP',
    maxPhotosReached: 'Limit of {max} photos reached',
    uploadError: 'Upload error',
    deleteConfirm: 'Delete this photo?',
    photoBy: 'Photo by',
    addedOn: 'Added on',
    mainPhoto: 'Main photo',
    setAsMain: 'Set as main',
    delete: 'Delete',
  },
  es: {
    noPhotos: 'Sin fotos para este spot',
    addPhoto: 'Agregar una foto',
    photoOf: 'Foto del spot',
    previousPhoto: 'Foto anterior',
    nextPhoto: 'Foto siguiente',
    fullscreen: 'Pantalla completa',
    close: 'Cerrar',
    thumbnail: 'Miniatura',
    likes: 'Me gusta',
    like: 'Me gusta',
    unlike: 'Ya no me gusta',
    report: 'Reportar',
    reportPhoto: 'Reportar esta foto',
    reportReason: 'Razon del reporte',
    reportReasons: {
      inappropriate: 'Contenido inapropiado',
      offensive: 'Contenido ofensivo',
      spam: 'Spam o publicidad',
      copyright: 'Violacion de derechos de autor',
      other: 'Otro',
    },
    reportSubmitted: 'Reporte enviado',
    uploadPhoto: 'Subir una foto',
    dragDrop: 'Arrastra una foto aqui o haz clic para seleccionar',
    maxPhotos: 'Maximo {max} fotos por spot',
    photoAdded: 'Foto agregada!',
    photoDeleted: 'Foto eliminada',
    mainPhotoSet: 'Foto principal definida',
    photosReordered: 'Fotos reordenadas',
    invalidFormat: 'Formato no soportado. Usa JPEG, PNG o WebP',
    maxPhotosReached: 'Limite de {max} fotos alcanzado',
    uploadError: 'Error al subir',
    deleteConfirm: 'Eliminar esta foto?',
    photoBy: 'Foto por',
    addedOn: 'Agregada el',
    mainPhoto: 'Foto principal',
    setAsMain: 'Definir como principal',
    delete: 'Eliminar',
  },
  de: {
    noPhotos: 'Keine Fotos fur diesen Spot',
    addPhoto: 'Foto hinzufugen',
    photoOf: 'Spot-Foto',
    previousPhoto: 'Vorheriges Foto',
    nextPhoto: 'Nachstes Foto',
    fullscreen: 'Vollbild',
    close: 'Schliessen',
    thumbnail: 'Miniaturansicht',
    likes: 'Gefallt mir',
    like: 'Gefallt mir',
    unlike: 'Gefallt mir nicht mehr',
    report: 'Melden',
    reportPhoto: 'Dieses Foto melden',
    reportReason: 'Meldegrund',
    reportReasons: {
      inappropriate: 'Unangemessener Inhalt',
      offensive: 'Anstossiger Inhalt',
      spam: 'Spam oder Werbung',
      copyright: 'Urheberrechtsverletzung',
      other: 'Andere',
    },
    reportSubmitted: 'Meldung gesendet',
    uploadPhoto: 'Foto hochladen',
    dragDrop: 'Ziehen Sie ein Foto hierher oder klicken Sie zum Auswahlen',
    maxPhotos: 'Maximal {max} Fotos pro Spot',
    photoAdded: 'Foto hinzugefugt!',
    photoDeleted: 'Foto geloscht',
    mainPhotoSet: 'Hauptfoto festgelegt',
    photosReordered: 'Fotos neu geordnet',
    invalidFormat: 'Nicht unterstutztes Format. Verwenden Sie JPEG, PNG oder WebP',
    maxPhotosReached: 'Limit von {max} Fotos erreicht',
    uploadError: 'Fehler beim Hochladen',
    deleteConfirm: 'Dieses Foto loschen?',
    photoBy: 'Foto von',
    addedOn: 'Hinzugefugt am',
    mainPhoto: 'Hauptfoto',
    setAsMain: 'Als Hauptfoto festlegen',
    delete: 'Loschen',
  },
};

/**
 * Get translation for current language
 * @param {string} key - Translation key
 * @param {Object} params - Parameters for interpolation
 * @returns {string} Translated text
 */
function t(key, params = {}) {
  const state = getState();
  const lang = state.lang || 'fr';
  const langTranslations = translations[lang] || translations.fr;

  let text = langTranslations[key] || translations.fr[key] || key;

  // Interpolate parameters
  Object.entries(params).forEach(([param, value]) => {
    text = text.replace(`{${param}}`, value);
  });

  return text;
}

// ==================== STORAGE HELPERS ====================

/**
 * Get photo gallery data from localStorage
 * @returns {Object} Gallery data { photos: {}, likes: {}, reports: [] }
 */
function getGalleryData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Error reading photo gallery data:', e);
  }
  return { photos: {}, likes: {}, reports: [], mainPhotos: {} };
}

/**
 * Save photo gallery data to localStorage
 * @param {Object} data - Gallery data to save
 */
function saveGalleryData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn('Error saving photo gallery data:', e);
    return false;
  }
}

/**
 * Generate unique photo ID
 * @returns {string} Unique ID
 */
function generatePhotoId() {
  return `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ==================== PHOTO CRUD OPERATIONS ====================

/**
 * Get all photos for a spot
 * @param {string} spotId - Spot ID
 * @returns {Array} Array of photo objects
 */
export function getSpotPhotos(spotId) {
  if (!spotId) return [];

  const data = getGalleryData();
  const spotPhotos = data.photos[spotId] || [];

  // Sort by order, then by date
  return spotPhotos.sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    return new Date(b.addedAt) - new Date(a.addedAt);
  });
}

/**
 * Add a photo to a spot
 * @param {string} spotId - Spot ID
 * @param {Object} photoData - Photo data { url, userId?, username?, format? }
 * @returns {Object|null} Added photo object or null if failed
 */
export function addPhotoToSpot(spotId, photoData) {
  if (!spotId || !photoData || !photoData.url) {
    return null;
  }

  const data = getGalleryData();

  // Initialize spot photos array if needed
  if (!data.photos[spotId]) {
    data.photos[spotId] = [];
  }

  // Check max photos limit
  if (data.photos[spotId].length >= MAX_PHOTOS_PER_SPOT) {
    console.warn(`Max photos (${MAX_PHOTOS_PER_SPOT}) reached for spot ${spotId}`);
    return null;
  }

  // Validate format if provided
  if (photoData.format) {
    const format = photoData.format.toLowerCase().replace('image/', '');
    if (!SUPPORTED_FORMATS.includes(format) && !SUPPORTED_FORMATS.includes(photoData.format)) {
      console.warn('Unsupported photo format:', photoData.format);
      return null;
    }
  }

  const state = getState();
  const photo = {
    id: generatePhotoId(),
    url: photoData.url,
    userId: photoData.userId || state.user?.uid || 'anonymous',
    username: photoData.username || state.username || 'Anonymous',
    format: photoData.format || 'image/jpeg',
    addedAt: new Date().toISOString(),
    order: data.photos[spotId].length,
    likes: 0,
    metadata: photoData.metadata || {},
  };

  data.photos[spotId].push(photo);

  // Set as main photo if it's the first one
  if (data.photos[spotId].length === 1) {
    data.mainPhotos[spotId] = photo.id;
  }

  saveGalleryData(data);
  return photo;
}

/**
 * Delete a photo from a spot
 * @param {string} spotId - Spot ID
 * @param {string} photoId - Photo ID
 * @returns {boolean} Success status
 */
export function deletePhotoFromSpot(spotId, photoId) {
  if (!spotId || !photoId) return false;

  const data = getGalleryData();

  if (!data.photos[spotId]) return false;

  const initialLength = data.photos[spotId].length;
  data.photos[spotId] = data.photos[spotId].filter(p => p.id !== photoId);

  if (data.photos[spotId].length === initialLength) {
    return false; // Photo not found
  }

  // Update order for remaining photos
  data.photos[spotId].forEach((photo, index) => {
    photo.order = index;
  });

  // Update main photo if deleted
  if (data.mainPhotos[spotId] === photoId) {
    data.mainPhotos[spotId] = data.photos[spotId][0]?.id || null;
  }

  // Remove likes for this photo
  delete data.likes[photoId];

  saveGalleryData(data);
  return true;
}

/**
 * Set the main/cover photo for a spot
 * @param {string} spotId - Spot ID
 * @param {string} photoId - Photo ID to set as main
 * @returns {boolean} Success status
 */
export function setSpotMainPhoto(spotId, photoId) {
  if (!spotId || !photoId) return false;

  const data = getGalleryData();

  // Verify photo exists for this spot
  const photos = data.photos[spotId] || [];
  const photoExists = photos.some(p => p.id === photoId);

  if (!photoExists) return false;

  data.mainPhotos[spotId] = photoId;
  saveGalleryData(data);
  return true;
}

/**
 * Get the main/cover photo for a spot
 * @param {string} spotId - Spot ID
 * @returns {Object|null} Main photo object or null
 */
export function getSpotMainPhoto(spotId) {
  if (!spotId) return null;

  const data = getGalleryData();
  const photos = data.photos[spotId] || [];
  const mainPhotoId = data.mainPhotos[spotId];

  if (mainPhotoId) {
    const mainPhoto = photos.find(p => p.id === mainPhotoId);
    if (mainPhoto) return mainPhoto;
  }

  // Return first photo if no main set
  return photos[0] || null;
}

/**
 * Reorder photos for a spot
 * @param {string} spotId - Spot ID
 * @param {Array} photoIds - Array of photo IDs in new order
 * @returns {boolean} Success status
 */
export function reorderSpotPhotos(spotId, photoIds) {
  if (!spotId || !Array.isArray(photoIds) || photoIds.length === 0) return false;

  const data = getGalleryData();
  const photos = data.photos[spotId] || [];

  // Verify all photo IDs exist
  const existingIds = new Set(photos.map(p => p.id));
  const allExist = photoIds.every(id => existingIds.has(id));

  if (!allExist || photoIds.length !== photos.length) {
    return false;
  }

  // Create new ordered array
  const reordered = photoIds.map((id, index) => {
    const photo = photos.find(p => p.id === id);
    return { ...photo, order: index };
  });

  data.photos[spotId] = reordered;
  saveGalleryData(data);
  return true;
}

// ==================== PHOTO METADATA ====================

/**
 * Get photo metadata
 * @param {string} photoId - Photo ID
 * @returns {Object|null} Photo metadata or null
 */
export function getPhotoMetadata(photoId) {
  if (!photoId) return null;

  const data = getGalleryData();

  // Search all spots for this photo
  for (const spotId in data.photos) {
    const photo = data.photos[spotId].find(p => p.id === photoId);
    if (photo) {
      return {
        id: photo.id,
        url: photo.url,
        userId: photo.userId,
        username: photo.username,
        format: photo.format,
        addedAt: photo.addedAt,
        order: photo.order,
        likes: photo.likes,
        spotId: spotId,
        isMain: data.mainPhotos[spotId] === photoId,
        metadata: photo.metadata || {},
      };
    }
  }

  return null;
}

/**
 * Get photo count for a spot
 * @param {string} spotId - Spot ID
 * @returns {number} Number of photos
 */
export function getPhotosCount(spotId) {
  if (!spotId) return 0;

  const data = getGalleryData();
  return (data.photos[spotId] || []).length;
}

/**
 * Get recent photos for a spot
 * @param {string} spotId - Spot ID
 * @param {number} limit - Maximum number of photos to return
 * @returns {Array} Array of recent photos
 */
export function getRecentPhotos(spotId, limit = 5) {
  if (!spotId) return [];

  const data = getGalleryData();
  const photos = data.photos[spotId] || [];

  // Sort by date descending
  const sorted = [...photos].sort((a, b) =>
    new Date(b.addedAt) - new Date(a.addedAt)
  );

  return sorted.slice(0, limit);
}

/**
 * Get photos uploaded by a specific user for a spot
 * @param {string} spotId - Spot ID
 * @param {string} userId - User ID
 * @returns {Array} Array of user's photos
 */
export function getUserPhotosForSpot(spotId, userId) {
  if (!spotId || !userId) return [];

  const data = getGalleryData();
  const photos = data.photos[spotId] || [];

  return photos.filter(p => p.userId === userId);
}

// ==================== LIKES ====================

/**
 * Like a photo
 * @param {string} photoId - Photo ID
 * @returns {boolean} Success status
 */
export function likePhoto(photoId) {
  if (!photoId) return false;

  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const data = getGalleryData();

  // Initialize likes for this photo if needed
  if (!data.likes[photoId]) {
    data.likes[photoId] = [];
  }

  // Check if already liked
  if (data.likes[photoId].includes(userId)) {
    return false;
  }

  data.likes[photoId].push(userId);

  // Update photo likes count
  for (const spotId in data.photos) {
    const photo = data.photos[spotId].find(p => p.id === photoId);
    if (photo) {
      photo.likes = data.likes[photoId].length;
      break;
    }
  }

  saveGalleryData(data);
  return true;
}

/**
 * Unlike a photo
 * @param {string} photoId - Photo ID
 * @returns {boolean} Success status
 */
export function unlikePhoto(photoId) {
  if (!photoId) return false;

  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const data = getGalleryData();

  if (!data.likes[photoId]) return false;

  const index = data.likes[photoId].indexOf(userId);
  if (index === -1) return false;

  data.likes[photoId].splice(index, 1);

  // Update photo likes count
  for (const spotId in data.photos) {
    const photo = data.photos[spotId].find(p => p.id === photoId);
    if (photo) {
      photo.likes = data.likes[photoId].length;
      break;
    }
  }

  saveGalleryData(data);
  return true;
}

/**
 * Get like count for a photo
 * @param {string} photoId - Photo ID
 * @returns {number} Number of likes
 */
export function getPhotoLikes(photoId) {
  if (!photoId) return 0;

  const data = getGalleryData();
  return (data.likes[photoId] || []).length;
}

/**
 * Check if current user has liked a photo
 * @param {string} photoId - Photo ID
 * @returns {boolean} Whether user has liked
 */
export function hasUserLikedPhoto(photoId) {
  if (!photoId) return false;

  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const data = getGalleryData();
  return (data.likes[photoId] || []).includes(userId);
}

// ==================== REPORTS ====================

/**
 * Report an inappropriate photo
 * @param {string} photoId - Photo ID
 * @param {string} reason - Report reason
 * @returns {Object|null} Report object or null if failed
 */
export function reportPhoto(photoId, reason) {
  if (!photoId || !reason) return null;

  const state = getState();
  const userId = state.user?.uid || 'anonymous';

  const data = getGalleryData();

  // Check if user already reported this photo
  const alreadyReported = data.reports.some(
    r => r.photoId === photoId && r.userId === userId
  );

  if (alreadyReported) {
    return null;
  }

  const report = {
    id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    photoId,
    userId,
    reason,
    reportedAt: new Date().toISOString(),
    status: 'pending',
  };

  data.reports.push(report);
  saveGalleryData(data);

  return report;
}

/**
 * Get reports for a photo
 * @param {string} photoId - Photo ID
 * @returns {Array} Array of reports
 */
export function getPhotoReports(photoId) {
  if (!photoId) return [];

  const data = getGalleryData();
  return data.reports.filter(r => r.photoId === photoId);
}

// ==================== RENDER FUNCTIONS ====================

/**
 * Render photo grid HTML
 * @param {Array} photos - Array of photo objects
 * @param {Object} options - Render options { showLikes, showDelete, onPhotoClick, columns }
 * @returns {string} HTML string
 */
export function renderPhotoGrid(photos, options = {}) {
  const {
    showLikes = true,
    showDelete = false,
    showSetMain = false,
    columns = 3,
    spotId = null,
  } = options;

  if (!photos || photos.length === 0) {
    return `
      <div class="photo-grid-empty bg-gray-800 rounded-xl p-8 text-center">
        <i class="fas fa-camera text-4xl text-slate-500 mb-3"></i>
        <p class="text-slate-400 text-sm">${t('noPhotos')}</p>
        ${spotId ? `
          <button
            onclick="openPhotoUpload('${spotId}')"
            class="mt-3 text-primary-400 text-sm hover:underline"
          >
            <i class="fas fa-plus mr-1"></i>${t('addPhoto')}
          </button>
        ` : ''}
      </div>
    `;
  }

  const data = getGalleryData();
  const mainPhotoId = spotId ? data.mainPhotos[spotId] : null;

  const gridClass = columns === 2 ? 'grid-cols-2' : columns === 4 ? 'grid-cols-4' : 'grid-cols-3';

  return `
    <div class="photo-grid grid ${gridClass} gap-2">
      ${photos.map((photo, index) => {
        const isMain = photo.id === mainPhotoId;
        const liked = hasUserLikedPhoto(photo.id);
        const likes = getPhotoLikes(photo.id);

        return `
          <div class="photo-grid-item relative group aspect-square rounded-lg overflow-hidden bg-gray-800">
            <img
              src="${escapeHTML(photo.url)}"
              alt="${t('photoOf')} ${index + 1}"
              class="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
              loading="lazy"
              onclick="openLightbox('${spotId || 'gallery'}', ${index})"
            />

            <!-- Overlay on hover -->
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
              <div class="flex items-center gap-2 w-full">
                ${showLikes ? `
                  <button
                    onclick="event.stopPropagation(); ${liked ? 'unlikePhotoHandler' : 'likePhotoHandler'}('${photo.id}')"
                    class="flex items-center gap-1 text-sm ${liked ? 'text-red-400' : 'text-white'} hover:scale-110 transition-transform"
                    aria-label="${liked ? t('unlike') : t('like')}"
                  >
                    <i class="fas fa-heart${liked ? '' : '-o'}"></i>
                    <span>${likes}</span>
                  </button>
                ` : ''}

                ${showSetMain && !isMain ? `
                  <button
                    onclick="event.stopPropagation(); setMainPhotoHandler('${spotId}', '${photo.id}')"
                    class="text-sm text-white hover:text-primary-400 ml-auto"
                    aria-label="${t('setAsMain')}"
                    title="${t('setAsMain')}"
                  >
                    <i class="fas fa-star"></i>
                  </button>
                ` : ''}

                ${showDelete ? `
                  <button
                    onclick="event.stopPropagation(); deletePhotoHandler('${spotId}', '${photo.id}')"
                    class="text-sm text-white hover:text-red-400 ${showSetMain && !isMain ? '' : 'ml-auto'}"
                    aria-label="${t('delete')}"
                    title="${t('delete')}"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Main photo badge -->
            ${isMain ? `
              <div class="absolute top-2 left-2 px-2 py-1 bg-primary-500 rounded-full text-xs text-white">
                <i class="fas fa-star mr-1"></i>${t('mainPhoto')}
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Render photo lightbox HTML
 * @param {Array} photos - Array of photo objects
 * @param {number} currentIndex - Current photo index
 * @returns {string} HTML string
 */
export function renderPhotoLightbox(photos, currentIndex = 0) {
  if (!photos || photos.length === 0) return '';

  const photo = photos[currentIndex];
  const liked = hasUserLikedPhoto(photo.id);
  const likes = getPhotoLikes(photo.id);

  return `
    <div
      id="photo-lightbox"
      class="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onclick="closeLightbox()"
      role="dialog"
      aria-modal="true"
      aria-label="${t('fullscreen')}"
    >
      <!-- Close Button -->
      <button
        onclick="closeLightbox()"
        class="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-white/10
          flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        aria-label="${t('close')}"
      >
        <i class="fas fa-times text-xl"></i>
      </button>

      <!-- Main Image Container -->
      <div class="relative w-full h-full flex items-center justify-center p-4" onclick="event.stopPropagation()">
        <img
          id="lightbox-image"
          src="${escapeHTML(photo.url)}"
          alt="${t('photoOf')} ${currentIndex + 1}"
          class="max-w-full max-h-[80vh] object-contain"
        />
      </div>

      <!-- Navigation -->
      ${photos.length > 1 ? `
        <button
          onclick="prevPhoto(); event.stopPropagation();"
          class="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10
            flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label="${t('previousPhoto')}"
        >
          <i class="fas fa-chevron-left text-xl"></i>
        </button>
        <button
          onclick="nextPhoto(); event.stopPropagation();"
          class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10
            flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label="${t('nextPhoto')}"
        >
          <i class="fas fa-chevron-right text-xl"></i>
        </button>
      ` : ''}

      <!-- Bottom Bar -->
      <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div class="flex items-center justify-between max-w-4xl mx-auto">
          <!-- Photo Info -->
          <div class="text-white text-sm">
            <p class="font-medium">${t('photoBy')} ${escapeHTML(photo.username || 'Anonymous')}</p>
            <p class="text-white/60">${t('addedOn')} ${new Date(photo.addedAt).toLocaleDateString()}</p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-4">
            <button
              onclick="event.stopPropagation(); ${liked ? 'unlikePhotoHandler' : 'likePhotoHandler'}('${photo.id}')"
              class="flex items-center gap-2 px-4 py-2 rounded-full ${liked ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'} hover:bg-white/20 transition-colors"
              aria-label="${liked ? t('unlike') : t('like')}"
            >
              <i class="fas fa-heart"></i>
              <span>${likes} ${t('likes')}</span>
            </button>

            <button
              onclick="event.stopPropagation(); openReportModal('${photo.id}')"
              class="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="${t('report')}"
            >
              <i class="fas fa-flag"></i>
              <span>${t('report')}</span>
            </button>
          </div>

          <!-- Counter -->
          <div class="px-4 py-2 rounded-full bg-white/10 text-white">
            <span id="lightbox-counter">${currentIndex + 1}</span> / ${photos.length}
          </div>
        </div>
      </div>

      <!-- Thumbnails -->
      ${photos.length > 1 ? `
        <div class="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-lg max-w-[90vw] overflow-x-auto">
          ${photos.map((p, index) => `
            <button
              onclick="goToLightboxPhoto(${index}); event.stopPropagation();"
              class="flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all
                ${index === currentIndex ? 'border-primary-500' : 'border-transparent opacity-60 hover:opacity-100'}"
              aria-label="${t('thumbnail')} ${index + 1}"
            >
              <img
                src="${escapeHTML(p.url)}"
                alt="${t('thumbnail')} ${index + 1}"
                class="w-full h-full object-cover"
              />
            </button>
          `).join('')}
        </div>
      ` : ''}

      <!-- Hidden data -->
      <input type="hidden" id="lightbox-current-index" value="${currentIndex}" />
      <script type="application/json" id="lightbox-photos-data">
        ${JSON.stringify(photos)}
      </script>
    </div>
  `;
}

/**
 * Render photo uploader form HTML
 * @param {string} spotId - Spot ID
 * @returns {string} HTML string
 */
export function renderPhotoUploader(spotId) {
  const photoCount = getPhotosCount(spotId);
  const canAddMore = photoCount < MAX_PHOTOS_PER_SPOT;

  return `
    <div class="photo-uploader bg-gray-800 rounded-xl p-6">
      <h3 class="text-lg font-semibold text-white mb-4">
        <i class="fas fa-camera mr-2"></i>${t('uploadPhoto')}
      </h3>

      ${canAddMore ? `
        <div
          id="photo-drop-zone"
          class="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer
            hover:border-primary-500 hover:bg-primary-500/5 transition-colors"
          onclick="triggerPhotoInput('${spotId}')"
          ondragover="handleDragOver(event)"
          ondrop="handlePhotoDrop(event, '${spotId}')"
        >
          <i class="fas fa-cloud-upload-alt text-4xl text-slate-500 mb-3"></i>
          <p class="text-slate-400">${t('dragDrop')}</p>
          <p class="text-slate-500 text-sm mt-2">${t('maxPhotos', { max: MAX_PHOTOS_PER_SPOT })}</p>
          <p class="text-slate-500 text-xs mt-1">${photoCount}/${MAX_PHOTOS_PER_SPOT}</p>
        </div>

        <input
          type="file"
          id="photo-input-${spotId}"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          onchange="handlePhotoSelect(event, '${spotId}')"
        />
      ` : `
        <div class="text-center py-8">
          <i class="fas fa-exclamation-circle text-4xl text-amber-500 mb-3"></i>
          <p class="text-amber-400">${t('maxPhotosReached', { max: MAX_PHOTOS_PER_SPOT })}</p>
        </div>
      `}

      <!-- Upload Progress -->
      <div id="upload-progress-${spotId}" class="hidden mt-4">
        <div class="flex items-center gap-3">
          <div class="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div id="upload-progress-bar-${spotId}" class="h-full bg-primary-500 transition-all duration-300" style="width: 0%"></div>
          </div>
          <span id="upload-progress-text-${spotId}" class="text-sm text-slate-400">0%</span>
        </div>
      </div>
    </div>
  `;
}

// ==================== LIGHTBOX NAVIGATION ====================

// Store for lightbox state
let lightboxState = {
  isOpen: false,
  photos: [],
  currentIndex: 0,
  spotId: null,
};

/**
 * Open lightbox at specific index
 * @param {string} spotId - Spot ID
 * @param {number} photoIndex - Photo index to show
 */
export function openLightbox(spotId, photoIndex = 0) {
  const photos = getSpotPhotos(spotId);
  if (!photos || photos.length === 0) return;

  lightboxState = {
    isOpen: true,
    photos,
    currentIndex: Math.min(Math.max(0, photoIndex), photos.length - 1),
    spotId,
  };

  // Render lightbox
  const container = document.createElement('div');
  container.innerHTML = renderPhotoLightbox(photos, lightboxState.currentIndex);
  document.body.appendChild(container.firstElementChild);

  // Prevent body scroll
  document.body.style.overflow = 'hidden';

  // Add keyboard navigation
  document.addEventListener('keydown', handleLightboxKeydown);
}

/**
 * Close lightbox
 */
export function closeLightbox() {
  const lightbox = document.getElementById('photo-lightbox');
  if (lightbox) {
    lightbox.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleLightboxKeydown);
  }

  lightboxState.isOpen = false;
}

/**
 * Navigate to next photo in lightbox
 */
export function nextPhoto() {
  if (!lightboxState.isOpen || lightboxState.photos.length <= 1) return;

  lightboxState.currentIndex = (lightboxState.currentIndex + 1) % lightboxState.photos.length;
  updateLightboxPhoto();
}

/**
 * Navigate to previous photo in lightbox
 */
export function prevPhoto() {
  if (!lightboxState.isOpen || lightboxState.photos.length <= 1) return;

  lightboxState.currentIndex = (lightboxState.currentIndex - 1 + lightboxState.photos.length) % lightboxState.photos.length;
  updateLightboxPhoto();
}

/**
 * Go to specific photo in lightbox
 * @param {number} index - Photo index
 */
function goToLightboxPhoto(index) {
  if (!lightboxState.isOpen) return;
  if (index < 0 || index >= lightboxState.photos.length) return;

  lightboxState.currentIndex = index;
  updateLightboxPhoto();
}

/**
 * Update lightbox photo display
 */
function updateLightboxPhoto() {
  const photo = lightboxState.photos[lightboxState.currentIndex];
  if (!photo) return;

  const img = document.getElementById('lightbox-image');
  const counter = document.getElementById('lightbox-counter');
  const indexInput = document.getElementById('lightbox-current-index');

  if (img) img.src = photo.url;
  if (counter) counter.textContent = lightboxState.currentIndex + 1;
  if (indexInput) indexInput.value = lightboxState.currentIndex;

  // Update thumbnails
  const lightbox = document.getElementById('photo-lightbox');
  if (lightbox) {
    lightbox.querySelectorAll('button[aria-label^="' + t('thumbnail') + '"]').forEach((btn, i) => {
      btn.classList.toggle('border-primary-500', i === lightboxState.currentIndex);
      btn.classList.toggle('border-transparent', i !== lightboxState.currentIndex);
      btn.classList.toggle('opacity-60', i !== lightboxState.currentIndex);
    });
  }
}

/**
 * Handle keyboard navigation in lightbox
 */
function handleLightboxKeydown(e) {
  if (e.key === 'Escape') {
    closeLightbox();
  } else if (e.key === 'ArrowRight') {
    nextPhoto();
  } else if (e.key === 'ArrowLeft') {
    prevPhoto();
  }
}

// ==================== GLOBAL WINDOW HANDLERS ====================

// Make functions available globally for onclick handlers
if (typeof window !== 'undefined') {
  window.openLightbox = openLightbox;
  window.closeLightbox = closeLightbox;
  window.nextPhoto = nextPhoto;
  window.prevPhoto = prevPhoto;
  window.goToLightboxPhoto = goToLightboxPhoto;

  window.likePhotoHandler = (photoId) => {
    likePhoto(photoId);
    // Refresh UI if in lightbox
    if (lightboxState.isOpen) {
      const lightbox = document.getElementById('photo-lightbox');
      if (lightbox) {
        lightbox.remove();
        document.body.appendChild(
          createElementFromHTML(renderPhotoLightbox(lightboxState.photos, lightboxState.currentIndex))
        );
      }
    }
  };

  window.unlikePhotoHandler = (photoId) => {
    unlikePhoto(photoId);
    // Refresh UI if in lightbox
    if (lightboxState.isOpen) {
      const lightbox = document.getElementById('photo-lightbox');
      if (lightbox) {
        lightbox.remove();
        document.body.appendChild(
          createElementFromHTML(renderPhotoLightbox(lightboxState.photos, lightboxState.currentIndex))
        );
      }
    }
  };

  window.setMainPhotoHandler = (spotId, photoId) => {
    setSpotMainPhoto(spotId, photoId);
    // Could trigger UI refresh here
  };

  window.deletePhotoHandler = (spotId, photoId) => {
    if (confirm(t('deleteConfirm'))) {
      deletePhotoFromSpot(spotId, photoId);
      // Could trigger UI refresh here
    }
  };

  window.openReportModal = (photoId) => {
    // Could open a report modal here
    const reason = prompt(t('reportReason'));
    if (reason) {
      reportPhoto(photoId, reason);
      alert(t('reportSubmitted'));
    }
  };

  window.triggerPhotoInput = (spotId) => {
    const input = document.getElementById(`photo-input-${spotId}`);
    if (input) input.click();
  };

  window.handleDragOver = (event) => {
    event.preventDefault();
    event.currentTarget.classList.add('border-primary-500', 'bg-primary-500/10');
  };

  window.handlePhotoDrop = (event, spotId) => {
    event.preventDefault();
    event.currentTarget.classList.remove('border-primary-500', 'bg-primary-500/10');

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      processPhotoUpload(files[0], spotId);
    }
  };

  window.handlePhotoSelect = (event, spotId) => {
    const files = event.target.files;
    if (files.length > 0) {
      processPhotoUpload(files[0], spotId);
    }
  };
}

/**
 * Process photo upload
 * @param {File} file - File to upload
 * @param {string} spotId - Spot ID
 */
async function processPhotoUpload(file, spotId) {
  // Validate format
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    alert(t('invalidFormat'));
    return;
  }

  // Check photo count
  if (getPhotosCount(spotId) >= MAX_PHOTOS_PER_SPOT) {
    alert(t('maxPhotosReached', { max: MAX_PHOTOS_PER_SPOT }));
    return;
  }

  // Show progress
  const progressContainer = document.getElementById(`upload-progress-${spotId}`);
  const progressBar = document.getElementById(`upload-progress-bar-${spotId}`);
  const progressText = document.getElementById(`upload-progress-text-${spotId}`);

  if (progressContainer) progressContainer.classList.remove('hidden');

  try {
    // Simulate upload progress (in real app, this would be actual upload)
    for (let i = 0; i <= 100; i += 10) {
      if (progressBar) progressBar.style.width = `${i}%`;
      if (progressText) progressText.textContent = `${i}%`;
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Create data URL for local storage (in real app, would upload to server)
    const reader = new FileReader();
    reader.onload = (e) => {
      const photo = addPhotoToSpot(spotId, {
        url: e.target.result,
        format: file.type,
      });

      if (photo) {
        alert(t('photoAdded'));
        // Could trigger UI refresh here
      } else {
        alert(t('uploadError'));
      }

      if (progressContainer) progressContainer.classList.add('hidden');
    };
    reader.readAsDataURL(file);

  } catch (error) {
    console.error('Upload error:', error);
    alert(t('uploadError'));
    if (progressContainer) progressContainer.classList.add('hidden');
  }
}

/**
 * Helper to create element from HTML string
 * @param {string} html - HTML string
 * @returns {Element} DOM element
 */
function createElementFromHTML(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Check if format is supported
 * @param {string} format - Format to check
 * @returns {boolean} Whether format is supported
 */
export function isSupportedFormat(format) {
  if (!format) return false;
  const normalized = format.toLowerCase().replace('image/', '');
  return SUPPORTED_FORMATS.includes(normalized) || SUPPORTED_FORMATS.includes(format.toLowerCase());
}

/**
 * Get max photos per spot constant
 * @returns {number} Max photos per spot
 */
export function getMaxPhotosPerSpot() {
  return MAX_PHOTOS_PER_SPOT;
}

/**
 * Get supported formats
 * @returns {Array} Array of supported formats
 */
export function getSupportedFormats() {
  return [...SUPPORTED_FORMATS];
}

/**
 * Clear all gallery data (for testing)
 */
export function clearGalleryData() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get the lightbox state (for testing)
 * @returns {Object} Lightbox state
 */
export function getLightboxState() {
  return { ...lightboxState };
}

// ==================== EXPORTS ====================

export default {
  // CRUD
  getSpotPhotos,
  addPhotoToSpot,
  deletePhotoFromSpot,
  setSpotMainPhoto,
  getSpotMainPhoto,
  reorderSpotPhotos,

  // Metadata
  getPhotoMetadata,
  getPhotosCount,
  getRecentPhotos,
  getUserPhotosForSpot,

  // Likes
  likePhoto,
  unlikePhoto,
  getPhotoLikes,
  hasUserLikedPhoto,

  // Reports
  reportPhoto,
  getPhotoReports,

  // Render
  renderPhotoGrid,
  renderPhotoLightbox,
  renderPhotoUploader,

  // Lightbox navigation
  openLightbox,
  closeLightbox,
  nextPhoto,
  prevPhoto,

  // Utilities
  isSupportedFormat,
  getMaxPhotosPerSpot,
  getSupportedFormats,
  clearGalleryData,
  getLightboxState,
};
