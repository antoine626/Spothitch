/**
 * Share Target Service
 * PWA Share Target API for receiving shared content from other apps
 * Supports text, URLs, and images
 */

import { getState, setState } from '../stores/state.js';
import { t } from '../i18n/index.js';

// Storage key for share target data
const STORAGE_KEY = 'spothitch_share_target';

// SpotHitch URL patterns
const SPOTHITCH_URL_PATTERNS = [
  /^https?:\/\/(www\.)?spothitch\.(app|com|fr)/i,
  /^https?:\/\/.*github\.io\/Spothitch/i,
  /spothitch/i,
];

// Coordinate regex patterns
const COORDINATE_PATTERNS = [
  // Decimal degrees: 48.8566, 2.3522 or 48.8566,2.3522
  /(-?\d+\.?\d*)\s*[,;]\s*(-?\d+\.?\d*)/,
  // DMS format: 48°51'24"N 2°21'7"E
  /(\d+)[°]\s*(\d+)['\u2019]\s*(\d+(?:\.\d+)?)["\u201D]?\s*([NS])\s*(\d+)[°]\s*(\d+)['\u2019]\s*(\d+(?:\.\d+)?)["\u201D]?\s*([EW])/i,
  // Google Maps URL coordinates
  /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  // Coordinates with labels: lat: 48.8566, lng: 2.3522
  /lat(?:itude)?[:\s]*(-?\d+\.?\d*)[,\s]+(?:lon|lng|longitude)[:\s]*(-?\d+\.?\d*)/i,
];

// Supported share types
const SUPPORTED_SHARE_TYPES = ['text', 'url', 'image'];

// Supported image MIME types
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Translations for share target UI
const shareTargetTranslations = {
  fr: {
    shareTargetTitle: 'Contenu partagé',
    shareTargetSubtitle: 'Que veux-tu faire avec ce contenu ?',
    sharedUrl: 'URL partagée',
    sharedText: 'Texte partagé',
    sharedImage: 'Image partagée',
    sharedLocation: 'Position partagée',
    openSpot: 'Ouvrir le spot',
    createSpotFromLocation: 'Créer un spot ici',
    createSpotFromImage: 'Créer un spot avec cette photo',
    addToTrip: 'Ajouter à mon voyage',
    shareInChat: 'Partager dans le chat',
    cancel: 'Annuler',
    processing: 'Traitement en cours...',
    spotDetected: 'Spot SpotHitch détecté !',
    locationDetected: 'Coordonnées détectées !',
    noContentReceived: 'Aucun contenu reçu',
    invalidImageType: 'Type d\'image non supporté',
    imageTooLarge: 'Image trop volumineuse (max 10 Mo)',
    shareTargetError: 'Erreur lors du traitement du contenu partagé',
    urlCopied: 'URL copiée !',
    textCopied: 'Texte copié !',
  },
  en: {
    shareTargetTitle: 'Shared Content',
    shareTargetSubtitle: 'What do you want to do with this content?',
    sharedUrl: 'Shared URL',
    sharedText: 'Shared text',
    sharedImage: 'Shared image',
    sharedLocation: 'Shared location',
    openSpot: 'Open spot',
    createSpotFromLocation: 'Create spot here',
    createSpotFromImage: 'Create spot with this photo',
    addToTrip: 'Add to my trip',
    shareInChat: 'Share in chat',
    cancel: 'Cancel',
    processing: 'Processing...',
    spotDetected: 'SpotHitch spot detected!',
    locationDetected: 'Coordinates detected!',
    noContentReceived: 'No content received',
    invalidImageType: 'Unsupported image type',
    imageTooLarge: 'Image too large (max 10 MB)',
    shareTargetError: 'Error processing shared content',
    urlCopied: 'URL copied!',
    textCopied: 'Text copied!',
  },
  es: {
    shareTargetTitle: 'Contenido compartido',
    shareTargetSubtitle: 'Que quieres hacer con este contenido?',
    sharedUrl: 'URL compartida',
    sharedText: 'Texto compartido',
    sharedImage: 'Imagen compartida',
    sharedLocation: 'Ubicacion compartida',
    openSpot: 'Abrir spot',
    createSpotFromLocation: 'Crear spot aqui',
    createSpotFromImage: 'Crear spot con esta foto',
    addToTrip: 'Añadir a mi viaje',
    shareInChat: 'Compartir en el chat',
    cancel: 'Cancelar',
    processing: 'Procesando...',
    spotDetected: 'Spot SpotHitch detectado!',
    locationDetected: 'Coordenadas detectadas!',
    noContentReceived: 'No se recibio contenido',
    invalidImageType: 'Tipo de imagen no compatible',
    imageTooLarge: 'Imagen demasiado grande (max 10 MB)',
    shareTargetError: 'Error al procesar el contenido compartido',
    urlCopied: 'URL copiada!',
    textCopied: 'Texto copiado!',
  },
  de: {
    shareTargetTitle: 'Geteilter Inhalt',
    shareTargetSubtitle: 'Was mochtest du mit diesem Inhalt machen?',
    sharedUrl: 'Geteilte URL',
    sharedText: 'Geteilter Text',
    sharedImage: 'Geteiltes Bild',
    sharedLocation: 'Geteilter Standort',
    openSpot: 'Spot offnen',
    createSpotFromLocation: 'Spot hier erstellen',
    createSpotFromImage: 'Spot mit diesem Foto erstellen',
    addToTrip: 'Zu meiner Reise hinzufugen',
    shareInChat: 'Im Chat teilen',
    cancel: 'Abbrechen',
    processing: 'Wird verarbeitet...',
    spotDetected: 'SpotHitch Spot erkannt!',
    locationDetected: 'Koordinaten erkannt!',
    noContentReceived: 'Kein Inhalt empfangen',
    invalidImageType: 'Nicht unterstützter Bildtyp',
    imageTooLarge: 'Bild zu groß (max 10 MB)',
    shareTargetError: 'Fehler bei der Verarbeitung des geteilten Inhalts',
    urlCopied: 'URL kopiert!',
    textCopied: 'Text kopiert!',
  },
};

/**
 * Get translation for share target
 * @param {string} key - Translation key
 * @returns {string} Translated string
 */
function getTranslation(key) {
  const lang = getState()?.lang || 'fr';
  const translations = shareTargetTranslations[lang] || shareTargetTranslations.fr;
  return translations[key] || shareTargetTranslations.fr[key] || key;
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type (success, error, info)
 */
function showToast(message, type = 'info') {
  if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
    window.showToast(message, type);
  }
}

/**
 * Save share target data to localStorage
 * @param {Object} data - Share data to save
 */
function saveToStorage(data) {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn('[ShareTarget] Failed to save to storage:', error);
    }
  }
}

/**
 * Load share target data from localStorage
 * @returns {Object|null} Saved share data or null
 */
function loadFromStorage() {
  if (typeof localStorage !== 'undefined') {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Expire after 1 hour
        if (Date.now() - parsed.timestamp < 3600000) {
          return parsed;
        }
        // Clean up expired data
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.warn('[ShareTarget] Failed to load from storage:', error);
    }
  }
  return null;
}

/**
 * Clear share target data from localStorage
 */
function clearStorage() {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('[ShareTarget] Failed to clear storage:', error);
    }
  }
}

/**
 * Check if a URL is a SpotHitch spot URL
 * @param {string} url - URL to check
 * @returns {boolean} True if it's a SpotHitch URL
 */
export function isSpotUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  return SPOTHITCH_URL_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Extract spot ID from a SpotHitch URL
 * @param {string} url - SpotHitch URL
 * @returns {string|null} Spot ID or null
 */
export function extractSpotIdFromUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Match patterns like /spot/123, #/spot/123, ?spot=123
  const patterns = [
    /\/spot\/([a-zA-Z0-9_-]+)/,
    /#\/spot\/([a-zA-Z0-9_-]+)/,
    /[?&]spot=([a-zA-Z0-9_-]+)/,
    /[?&]spotId=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Convert DMS (Degrees, Minutes, Seconds) to decimal degrees
 * @param {number} degrees - Degrees
 * @param {number} minutes - Minutes
 * @param {number} seconds - Seconds
 * @param {string} direction - N, S, E, or W
 * @returns {number} Decimal degrees
 */
function dmsToDecimal(degrees, minutes, seconds, direction) {
  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (direction === 'S' || direction === 'W') {
    decimal = -decimal;
  }
  return decimal;
}

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if valid
 */
function isValidCoordinates(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Extract coordinates from text
 * @param {string} text - Text containing coordinates
 * @returns {{ lat: number, lng: number }|null} Coordinates or null
 */
export function extractCoordinatesFromText(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Try each pattern
  for (const pattern of COORDINATE_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;

    let lat, lng;

    // DMS format
    if (match.length === 9) {
      lat = dmsToDecimal(
        parseFloat(match[1]),
        parseFloat(match[2]),
        parseFloat(match[3]),
        match[4].toUpperCase()
      );
      lng = dmsToDecimal(
        parseFloat(match[5]),
        parseFloat(match[6]),
        parseFloat(match[7]),
        match[8].toUpperCase()
      );
    }
    // Decimal format (with optional labels)
    else if (match.length >= 3) {
      lat = parseFloat(match[1]);
      lng = parseFloat(match[2]);
    }

    if (isValidCoordinates(lat, lng)) {
      return { lat, lng };
    }
  }

  return null;
}

/**
 * Parse a shared URL
 * @param {string} url - URL to parse
 * @returns {Object} Parsed URL data
 */
export function parseSharedUrl(url) {
  if (!url || typeof url !== 'string') {
    return { type: 'invalid', url: null };
  }

  const result = {
    type: 'url',
    url: url.trim(),
    isSpotUrl: false,
    spotId: null,
    coordinates: null,
  };

  // Check if it's a SpotHitch URL
  if (isSpotUrl(url)) {
    result.isSpotUrl = true;
    result.spotId = extractSpotIdFromUrl(url);
  }

  // Try to extract coordinates from the URL
  const coordinates = extractCoordinatesFromText(url);
  if (coordinates) {
    result.coordinates = coordinates;
  }

  return result;
}

/**
 * Parse shared text
 * @param {string} text - Text to parse
 * @returns {Object} Parsed text data
 */
export function parseSharedText(text) {
  if (!text || typeof text !== 'string') {
    return { type: 'invalid', text: null };
  }

  const result = {
    type: 'text',
    text: text.trim(),
    urls: [],
    coordinates: null,
    spotUrls: [],
  };

  // Extract URLs from text
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const urls = text.match(urlPattern);
  if (urls) {
    result.urls = urls;
    // Check for SpotHitch URLs
    result.spotUrls = urls.filter(url => isSpotUrl(url));
  }

  // Try to extract coordinates
  const coordinates = extractCoordinatesFromText(text);
  if (coordinates) {
    result.coordinates = coordinates;
  }

  return result;
}

/**
 * Validate image file
 * @param {File} file - Image file
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'noContentReceived' };
  }

  // Check MIME type
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'invalidImageType' };
  }

  // Check file size (max 10 MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'imageTooLarge' };
  }

  return { valid: true };
}

/**
 * Parse shared files (images)
 * @param {FileList|File[]} files - Files to parse
 * @returns {Promise<Object>} Parsed files data
 */
export async function parseSharedFiles(files) {
  const result = {
    type: 'files',
    images: [],
    errors: [],
  };

  if (!files || files.length === 0) {
    return result;
  }

  const fileArray = Array.from(files);

  for (const file of fileArray) {
    const validation = validateImageFile(file);

    if (validation.valid) {
      try {
        // Create a preview URL for the image
        let previewUrl = null;
        if (typeof URL !== 'undefined' && URL.createObjectURL) {
          previewUrl = URL.createObjectURL(file);
        }

        result.images.push({
          file,
          name: file.name,
          type: file.type,
          size: file.size,
          previewUrl,
        });
      } catch (error) {
        result.errors.push({
          name: file.name,
          error: 'shareTargetError',
        });
      }
    } else {
      result.errors.push({
        name: file.name,
        error: validation.error,
      });
    }
  }

  return result;
}

/**
 * Handle shared location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} Location handling result
 */
export function handleSharedLocation(lat, lng) {
  if (!isValidCoordinates(lat, lng)) {
    return {
      success: false,
      error: 'Invalid coordinates',
    };
  }

  // Save to storage for later use
  saveToStorage({
    type: 'location',
    coordinates: { lat, lng },
  });

  return {
    success: true,
    coordinates: { lat, lng },
    actions: ['createSpot', 'viewOnMap', 'addToTrip'],
  };
}

/**
 * Handle shared image
 * @param {File} file - Image file
 * @returns {Promise<Object>} Image handling result
 */
export async function handleSharedImage(file) {
  const validation = validateImageFile(file);

  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  try {
    // Create preview URL
    let previewUrl = null;
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      previewUrl = URL.createObjectURL(file);
    }

    // Save reference to storage
    saveToStorage({
      type: 'image',
      imageName: file.name,
      imageType: file.type,
      imageSize: file.size,
    });

    return {
      success: true,
      file,
      previewUrl,
      actions: ['createSpotWithPhoto', 'shareInChat'],
    };
  } catch (error) {
    return {
      success: false,
      error: 'shareTargetError',
    };
  }
}

/**
 * Handle shared content (main entry point)
 * @param {Object} data - Shared data { title, text, url, files }
 * @returns {Promise<Object>} Processed content
 */
export async function handleSharedContent(data) {
  if (!data) {
    return {
      success: false,
      error: 'noContentReceived',
      type: null,
    };
  }

  const result = {
    success: true,
    type: null,
    title: data.title || null,
    parsedData: null,
    actions: [],
  };

  // Process URL if present
  if (data.url) {
    const urlData = parseSharedUrl(data.url);
    result.type = 'url';
    result.parsedData = urlData;

    if (urlData.isSpotUrl && urlData.spotId) {
      result.actions.push('openSpot');
    }
    if (urlData.coordinates) {
      result.actions.push('createSpotFromLocation', 'viewOnMap');
    }
    result.actions.push('shareInChat', 'copyUrl');
  }
  // Process text if present and no URL
  else if (data.text) {
    const textData = parseSharedText(data.text);
    result.type = 'text';
    result.parsedData = textData;

    if (textData.spotUrls.length > 0) {
      result.actions.push('openSpot');
    }
    if (textData.coordinates) {
      result.actions.push('createSpotFromLocation', 'viewOnMap');
    }
    result.actions.push('shareInChat', 'copyText');
  }
  // Process files if present
  else if (data.files && data.files.length > 0) {
    const filesData = await parseSharedFiles(data.files);
    result.type = 'files';
    result.parsedData = filesData;

    if (filesData.images.length > 0) {
      result.actions.push('createSpotFromImage', 'shareInChat');
    }

    if (filesData.errors.length > 0) {
      result.errors = filesData.errors;
    }
  } else {
    return {
      success: false,
      error: 'noContentReceived',
      type: null,
    };
  }

  // Save to storage
  saveToStorage({
    type: result.type,
    title: result.title,
    data: result.parsedData,
    processedAt: Date.now(),
  });

  return result;
}

/**
 * Render the share target modal HTML
 * @param {Object} data - Processed share data
 * @returns {string} HTML string
 */
export function renderShareTargetModal(data) {
  if (!data || !data.success) {
    return `
      <div id="share-target-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="share-target-title">
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 m-4 max-w-md w-full shadow-xl">
          <h2 id="share-target-title" class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            ${getTranslation('shareTargetTitle')}
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            ${getTranslation(data?.error || 'noContentReceived')}
          </p>
          <button
            type="button"
            onclick="window.cancelShareTarget()"
            class="w-full py-3 px-4 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
          >
            ${getTranslation('cancel')}
          </button>
        </div>
      </div>
    `;
  }

  const { type, parsedData, actions, title } = data;

  let contentPreview = '';
  let actionButtons = '';

  // Content preview based on type
  if (type === 'url') {
    const urlInfo = parsedData.isSpotUrl
      ? `<span class="text-primary-500">${getTranslation('spotDetected')}</span>`
      : '';
    contentPreview = `
      <div class="bg-gray-100 dark:bg-slate-700 rounded-xl p-4 mb-4">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">${getTranslation('sharedUrl')}</p>
        <p class="text-gray-900 dark:text-white break-all">${escapeHtml(parsedData.url)}</p>
        ${urlInfo}
        ${parsedData.coordinates ? `<p class="text-sm text-green-500 mt-2">${getTranslation('locationDetected')} (${parsedData.coordinates.lat.toFixed(6)}, ${parsedData.coordinates.lng.toFixed(6)})</p>` : ''}
      </div>
    `;
  } else if (type === 'text') {
    const truncatedText = parsedData.text.length > 200
      ? parsedData.text.substring(0, 200) + '...'
      : parsedData.text;
    contentPreview = `
      <div class="bg-gray-100 dark:bg-slate-700 rounded-xl p-4 mb-4">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">${getTranslation('sharedText')}</p>
        <p class="text-gray-900 dark:text-white whitespace-pre-wrap">${escapeHtml(truncatedText)}</p>
        ${parsedData.coordinates ? `<p class="text-sm text-green-500 mt-2">${getTranslation('locationDetected')} (${parsedData.coordinates.lat.toFixed(6)}, ${parsedData.coordinates.lng.toFixed(6)})</p>` : ''}
      </div>
    `;
  } else if (type === 'files' && parsedData.images.length > 0) {
    const imagePreview = parsedData.images[0].previewUrl
      ? `<img src="${parsedData.images[0].previewUrl}" alt="${getTranslation('sharedImage')}" class="w-full h-48 object-cover rounded-lg mb-2" />`
      : '';
    contentPreview = `
      <div class="bg-gray-100 dark:bg-slate-700 rounded-xl p-4 mb-4">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">${getTranslation('sharedImage')}</p>
        ${imagePreview}
        <p class="text-sm text-gray-600 dark:text-gray-400">${parsedData.images.length} image${parsedData.images.length > 1 ? 's' : ''}</p>
      </div>
    `;
  }

  // Generate action buttons
  const actionConfigs = {
    openSpot: {
      label: getTranslation('openSpot'),
      icon: 'fas fa-map-marker-alt',
      class: 'bg-primary-500 hover:bg-primary-600 text-white',
      handler: 'handleShareTargetOpenSpot',
    },
    createSpotFromLocation: {
      label: getTranslation('createSpotFromLocation'),
      icon: 'fas fa-plus-circle',
      class: 'bg-green-500 hover:bg-green-600 text-white',
      handler: 'handleShareTargetCreateSpot',
    },
    createSpotFromImage: {
      label: getTranslation('createSpotFromImage'),
      icon: 'fas fa-camera',
      class: 'bg-green-500 hover:bg-green-600 text-white',
      handler: 'handleShareTargetCreateSpotFromImage',
    },
    viewOnMap: {
      label: getTranslation('addToTrip'),
      icon: 'fas fa-route',
      class: 'bg-blue-500 hover:bg-blue-600 text-white',
      handler: 'handleShareTargetAddToTrip',
    },
    shareInChat: {
      label: getTranslation('shareInChat'),
      icon: 'fas fa-comment',
      class: 'bg-purple-500 hover:bg-purple-600 text-white',
      handler: 'handleShareTargetShareInChat',
    },
  };

  for (const action of actions) {
    const config = actionConfigs[action];
    if (config) {
      actionButtons += `
        <button
          type="button"
          onclick="window.${config.handler}()"
          class="flex items-center justify-center gap-2 py-3 px-4 ${config.class} rounded-xl font-semibold transition-colors"
          aria-label="${config.label}"
        >
          <i class="${config.icon}" aria-hidden="true"></i>
          <span>${config.label}</span>
        </button>
      `;
    }
  }

  return `
    <div id="share-target-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="share-target-title">
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 m-4 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 id="share-target-title" class="text-xl font-bold text-gray-900 dark:text-white mb-2">
          ${getTranslation('shareTargetTitle')}
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          ${getTranslation('shareTargetSubtitle')}
        </p>

        ${title ? `<p class="text-sm text-gray-500 dark:text-gray-400 mb-2">${escapeHtml(title)}</p>` : ''}

        ${contentPreview}

        <div class="space-y-3">
          ${actionButtons}

          <button
            type="button"
            onclick="window.cancelShareTarget()"
            class="w-full py-3 px-4 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
          >
            ${getTranslation('cancel')}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, char => escapeMap[char]);
}

/**
 * Show the share target UI
 * @param {Object} sharedData - Processed share data
 */
export function showShareTargetUI(sharedData) {
  if (typeof document === 'undefined') {
    return;
  }

  // Remove existing modal if any
  const existingModal = document.getElementById('share-target-modal');
  if (existingModal) {
    existingModal.remove();
  }

  // Create and append modal
  const modalHtml = renderShareTargetModal(sharedData);
  const container = document.createElement('div');
  container.innerHTML = modalHtml;
  document.body.appendChild(container.firstElementChild);

  // Store shared data for action handlers
  if (typeof window !== 'undefined') {
    window._shareTargetData = sharedData;
  }
}

/**
 * Cancel/close the share target modal
 */
export function cancelShareTarget() {
  if (typeof document === 'undefined') {
    return;
  }

  const modal = document.getElementById('share-target-modal');
  if (modal) {
    modal.remove();
  }

  // Clear stored data
  clearStorage();

  if (typeof window !== 'undefined') {
    delete window._shareTargetData;
  }
}

/**
 * Initialize share target handlers
 * Sets up the PWA share target handling
 */
export function initShareTarget() {
  if (typeof window === 'undefined') {
    return { initialized: false, reason: 'no_window' };
  }

  // Check for URL parameters (Web Share Target API uses GET params)
  const urlParams = new URLSearchParams(window.location.search);
  const sharedTitle = urlParams.get('title');
  const sharedText = urlParams.get('text');
  const sharedUrl = urlParams.get('url');

  // Check if we received shared content
  const hasSharedContent = sharedTitle || sharedText || sharedUrl;

  if (hasSharedContent) {
    // Process the shared content
    handleSharedContent({
      title: sharedTitle,
      text: sharedText,
      url: sharedUrl,
    }).then(result => {
      showShareTargetUI(result);

      // Clean up URL parameters
      if (typeof history !== 'undefined' && history.replaceState) {
        const cleanUrl = window.location.pathname + window.location.hash;
        history.replaceState(null, '', cleanUrl);
      }
    });
  }

  // Register global handlers
  window.cancelShareTarget = cancelShareTarget;
  window.handleShareTargetOpenSpot = handleShareTargetOpenSpot;
  window.handleShareTargetCreateSpot = handleShareTargetCreateSpot;
  window.handleShareTargetCreateSpotFromImage = handleShareTargetCreateSpotFromImage;
  window.handleShareTargetAddToTrip = handleShareTargetAddToTrip;
  window.handleShareTargetShareInChat = handleShareTargetShareInChat;

  return {
    initialized: true,
    hasSharedContent,
  };
}

/**
 * Handler: Open a shared spot
 */
function handleShareTargetOpenSpot() {
  const data = typeof window !== 'undefined' ? window._shareTargetData : null;
  if (!data || !data.parsedData) return;

  let spotId = null;

  if (data.type === 'url' && data.parsedData.spotId) {
    spotId = data.parsedData.spotId;
  } else if (data.type === 'text' && data.parsedData.spotUrls.length > 0) {
    spotId = extractSpotIdFromUrl(data.parsedData.spotUrls[0]);
  }

  if (spotId) {
    // Navigate to spot
    if (typeof window !== 'undefined') {
      window.location.hash = `#/spot/${spotId}`;
    }
    showToast(getTranslation('spotDetected'), 'success');
  }

  cancelShareTarget();
}

/**
 * Handler: Create a spot from shared location
 */
function handleShareTargetCreateSpot() {
  const data = typeof window !== 'undefined' ? window._shareTargetData : null;
  if (!data || !data.parsedData) return;

  const coordinates = data.parsedData.coordinates;
  if (coordinates) {
    // Set state to open add spot modal with coordinates
    setState({
      showAddSpot: true,
      newSpotCoordinates: coordinates,
    });
    showToast(getTranslation('locationDetected'), 'success');
  }

  cancelShareTarget();
}

/**
 * Handler: Create a spot from shared image
 */
function handleShareTargetCreateSpotFromImage() {
  const data = typeof window !== 'undefined' ? window._shareTargetData : null;
  if (!data || !data.parsedData || !data.parsedData.images) return;

  const images = data.parsedData.images;
  if (images.length > 0) {
    // Set state to open add spot modal with image
    setState({
      showAddSpot: true,
      newSpotPhoto: images[0].file,
    });
    showToast(getTranslation('sharedImage'), 'success');
  }

  cancelShareTarget();
}

/**
 * Handler: Add to trip planner
 */
function handleShareTargetAddToTrip() {
  const data = typeof window !== 'undefined' ? window._shareTargetData : null;
  if (!data || !data.parsedData) return;

  const coordinates = data.parsedData.coordinates;
  if (coordinates) {
    // Add step to trip
    const state = getState();
    const newStep = {
      id: Date.now().toString(),
      lat: coordinates.lat,
      lng: coordinates.lng,
      name: getTranslation('sharedLocation'),
    };

    setState({
      tripSteps: [...(state.tripSteps || []), newStep],
      activeTab: 'planner',
      showTripPlanner: true,
    });

    showToast(getTranslation('addToTrip'), 'success');
  }

  cancelShareTarget();
}

/**
 * Handler: Share in chat
 */
function handleShareTargetShareInChat() {
  const data = typeof window !== 'undefined' ? window._shareTargetData : null;
  if (!data || !data.parsedData) return;

  let messageContent = '';

  if (data.type === 'url') {
    messageContent = data.parsedData.url;
  } else if (data.type === 'text') {
    messageContent = data.parsedData.text;
  } else if (data.type === 'files' && data.parsedData.images.length > 0) {
    messageContent = getTranslation('sharedImage');
  }

  if (messageContent) {
    // Navigate to chat with prefilled message
    setState({
      activeTab: 'chat',
      prefillChatMessage: messageContent,
    });

    showToast(getTranslation('shareInChat'), 'success');
  }

  cancelShareTarget();
}

/**
 * Get the share_target configuration for manifest.json
 * @returns {Object} Share target configuration
 */
export function getShareTargetConfig() {
  return {
    action: '/Spothitch/',
    method: 'GET',
    params: {
      title: 'title',
      text: 'text',
      url: 'url',
    },
    enctype: 'application/x-www-form-urlencoded',
  };
}

/**
 * Get supported share types
 * @returns {string[]} Array of supported types
 */
export function getSupportedShareTypes() {
  return [...SUPPORTED_SHARE_TYPES];
}

/**
 * Get supported image types
 * @returns {string[]} Array of supported MIME types
 */
export function getSupportedImageTypes() {
  return [...SUPPORTED_IMAGE_TYPES];
}

// Attach handlers to window for onclick usage
if (typeof window !== 'undefined') {
  window.cancelShareTarget = cancelShareTarget;
  window.initShareTarget = initShareTarget;
}

export default {
  initShareTarget,
  handleSharedContent,
  parseSharedUrl,
  parseSharedText,
  parseSharedFiles,
  isSpotUrl,
  extractSpotIdFromUrl,
  extractCoordinatesFromText,
  handleSharedLocation,
  handleSharedImage,
  showShareTargetUI,
  renderShareTargetModal,
  getShareTargetConfig,
  getSupportedShareTypes,
  getSupportedImageTypes,
  cancelShareTarget,
};
