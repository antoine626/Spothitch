/**
 * Auto Translate Service
 * Provides automatic translation with ability to view original text
 * Supports FR, EN, ES, DE with hitchhiking-specific vocabulary
 */

import { getState } from '../stores/state.js';

// Supported languages
export const SUPPORTED_LANGUAGES = ['fr', 'en', 'es', 'de'];

// Language detection patterns (common words and their languages)
const LANGUAGE_PATTERNS = {
  fr: [
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'est', 'sont',
    'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'ce', 'cette',
    'avec', 'pour', 'dans', 'sur', 'qui', 'que', 'quoi', 'comment', 'pourquoi',
    'bonjour', 'merci', 'bien', 'tres', 'plus', 'moins', 'aussi', 'mais',
    'autostop', 'conducteur', 'voiture', 'route', 'trajet', 'attente', 'suis'
  ],
  en: [
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her',
    'with', 'for', 'from', 'to', 'at', 'by', 'about', 'into', 'through',
    'hitchhike', 'hitchhiker', 'driver', 'car', 'road', 'ride', 'waiting', 'spot',
    'hello', 'am', 'and', 'or', 'not', 'this', 'that', 'these', 'those'
  ],
  es: [
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'es', 'son',
    'yo', 'tu', 'el', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas',
    'con', 'para', 'en', 'sobre', 'que', 'como', 'porque', 'cuando',
    'hola', 'gracias', 'bien', 'muy', 'mas', 'menos', 'tambien', 'pero',
    'autostop', 'conductor', 'coche', 'carretera', 'viaje', 'espera', 'estoy', 'buscando'
  ],
  de: [
    'der', 'die', 'das', 'ein', 'eine', 'und', 'ist', 'sind', 'war', 'waren',
    'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mein', 'dein', 'sein',
    'mit', 'fur', 'von', 'zu', 'bei', 'nach', 'uber', 'unter', 'durch',
    'hallo', 'danke', 'gut', 'sehr', 'mehr', 'weniger', 'auch', 'aber',
    'trampen', 'fahrer', 'auto', 'strasse', 'fahrt', 'warten', 'suche', 'einen'
  ]
};

// Hitchhiking-specific dictionary (bidirectional translations)
const HITCHHIKING_DICTIONARY = {
  // Core hitchhiking terms
  hitchhike: { fr: 'autostop', en: 'hitchhike', es: 'autostop', de: 'trampen' },
  hitchhiker: { fr: 'autostoppeur', en: 'hitchhiker', es: 'autoestopista', de: 'tramper' },
  hitchhiking: { fr: 'autostop', en: 'hitchhiking', es: 'autostop', de: 'trampen' },
  autostop: { fr: 'autostop', en: 'hitchhiking', es: 'autostop', de: 'trampen' },
  autostoppeur: { fr: 'autostoppeur', en: 'hitchhiker', es: 'autoestopista', de: 'tramper' },
  trampen: { fr: 'autostop', en: 'hitchhiking', es: 'autostop', de: 'trampen' },
  tramper: { fr: 'autostoppeur', en: 'hitchhiker', es: 'autoestopista', de: 'tramper' },

  // Transportation
  driver: { fr: 'conducteur', en: 'driver', es: 'conductor', de: 'fahrer' },
  conducteur: { fr: 'conducteur', en: 'driver', es: 'conductor', de: 'fahrer' },
  conductor: { fr: 'conducteur', en: 'driver', es: 'conductor', de: 'fahrer' },
  fahrer: { fr: 'conducteur', en: 'driver', es: 'conductor', de: 'fahrer' },
  car: { fr: 'voiture', en: 'car', es: 'coche', de: 'auto' },
  voiture: { fr: 'voiture', en: 'car', es: 'coche', de: 'auto' },
  coche: { fr: 'voiture', en: 'car', es: 'coche', de: 'auto' },
  auto: { fr: 'voiture', en: 'car', es: 'coche', de: 'auto' },
  truck: { fr: 'camion', en: 'truck', es: 'camion', de: 'lastwagen' },
  camion: { fr: 'camion', en: 'truck', es: 'camion', de: 'lastwagen' },
  lastwagen: { fr: 'camion', en: 'truck', es: 'camion', de: 'lastwagen' },
  ride: { fr: 'trajet', en: 'ride', es: 'viaje', de: 'fahrt' },
  trajet: { fr: 'trajet', en: 'ride', es: 'viaje', de: 'fahrt' },
  viaje: { fr: 'trajet', en: 'ride', es: 'viaje', de: 'fahrt' },
  fahrt: { fr: 'trajet', en: 'ride', es: 'viaje', de: 'fahrt' },

  // Locations
  spot: { fr: 'spot', en: 'spot', es: 'spot', de: 'stelle' },
  stelle: { fr: 'spot', en: 'spot', es: 'spot', de: 'stelle' },
  road: { fr: 'route', en: 'road', es: 'carretera', de: 'strasse' },
  route: { fr: 'route', en: 'road', es: 'carretera', de: 'strasse' },
  carretera: { fr: 'route', en: 'road', es: 'carretera', de: 'strasse' },
  strasse: { fr: 'route', en: 'road', es: 'carretera', de: 'strasse' },
  highway: { fr: 'autoroute', en: 'highway', es: 'autopista', de: 'autobahn' },
  autoroute: { fr: 'autoroute', en: 'highway', es: 'autopista', de: 'autobahn' },
  autopista: { fr: 'autoroute', en: 'highway', es: 'autopista', de: 'autobahn' },
  autobahn: { fr: 'autoroute', en: 'highway', es: 'autopista', de: 'autobahn' },
  'gas station': { fr: 'station-service', en: 'gas station', es: 'gasolinera', de: 'tankstelle' },
  'station-service': { fr: 'station-service', en: 'gas station', es: 'gasolinera', de: 'tankstelle' },
  gasolinera: { fr: 'station-service', en: 'gas station', es: 'gasolinera', de: 'tankstelle' },
  tankstelle: { fr: 'station-service', en: 'gas station', es: 'gasolinera', de: 'tankstelle' },
  'rest area': { fr: 'aire de repos', en: 'rest area', es: 'area de descanso', de: 'rastplatz' },
  'aire de repos': { fr: 'aire de repos', en: 'rest area', es: 'area de descanso', de: 'rastplatz' },
  rastplatz: { fr: 'aire de repos', en: 'rest area', es: 'area de descanso', de: 'rastplatz' },

  // Actions & States
  waiting: { fr: 'attente', en: 'waiting', es: 'espera', de: 'warten' },
  attente: { fr: 'attente', en: 'waiting', es: 'espera', de: 'warten' },
  espera: { fr: 'attente', en: 'waiting', es: 'espera', de: 'warten' },
  warten: { fr: 'attente', en: 'waiting', es: 'espera', de: 'warten' },
  destination: { fr: 'destination', en: 'destination', es: 'destino', de: 'ziel' },
  destino: { fr: 'destination', en: 'destination', es: 'destino', de: 'ziel' },
  ziel: { fr: 'destination', en: 'destination', es: 'destino', de: 'ziel' },
  departure: { fr: 'depart', en: 'departure', es: 'salida', de: 'abfahrt' },
  depart: { fr: 'depart', en: 'departure', es: 'salida', de: 'abfahrt' },
  salida: { fr: 'depart', en: 'departure', es: 'salida', de: 'abfahrt' },
  abfahrt: { fr: 'depart', en: 'departure', es: 'salida', de: 'abfahrt' },

  // Rating & Quality
  good: { fr: 'bon', en: 'good', es: 'bueno', de: 'gut' },
  bon: { fr: 'bon', en: 'good', es: 'bueno', de: 'gut' },
  bueno: { fr: 'bon', en: 'good', es: 'bueno', de: 'gut' },
  gut: { fr: 'bon', en: 'good', es: 'bueno', de: 'gut' },
  bad: { fr: 'mauvais', en: 'bad', es: 'malo', de: 'schlecht' },
  mauvais: { fr: 'mauvais', en: 'bad', es: 'malo', de: 'schlecht' },
  malo: { fr: 'mauvais', en: 'bad', es: 'malo', de: 'schlecht' },
  schlecht: { fr: 'mauvais', en: 'bad', es: 'malo', de: 'schlecht' },
  safe: { fr: 'sur', en: 'safe', es: 'seguro', de: 'sicher' },
  sur: { fr: 'sur', en: 'safe', es: 'seguro', de: 'sicher' },
  seguro: { fr: 'sur', en: 'safe', es: 'seguro', de: 'sicher' },
  sicher: { fr: 'sur', en: 'safe', es: 'seguro', de: 'sicher' },
  dangerous: { fr: 'dangereux', en: 'dangerous', es: 'peligroso', de: 'gefahrlich' },
  dangereux: { fr: 'dangereux', en: 'dangerous', es: 'peligroso', de: 'gefahrlich' },
  peligroso: { fr: 'dangereux', en: 'dangerous', es: 'peligroso', de: 'gefahrlich' },
  gefahrlich: { fr: 'dangereux', en: 'dangerous', es: 'peligroso', de: 'gefahrlich' },

  // Time
  minutes: { fr: 'minutes', en: 'minutes', es: 'minutos', de: 'minuten' },
  minutos: { fr: 'minutes', en: 'minutes', es: 'minutos', de: 'minuten' },
  minuten: { fr: 'minutes', en: 'minutes', es: 'minutos', de: 'minuten' },
  hours: { fr: 'heures', en: 'hours', es: 'horas', de: 'stunden' },
  heures: { fr: 'heures', en: 'hours', es: 'horas', de: 'stunden' },
  horas: { fr: 'heures', en: 'hours', es: 'horas', de: 'stunden' },
  stunden: { fr: 'heures', en: 'hours', es: 'horas', de: 'stunden' },

  // Common phrases
  'thank you': { fr: 'merci', en: 'thank you', es: 'gracias', de: 'danke' },
  merci: { fr: 'merci', en: 'thank you', es: 'gracias', de: 'danke' },
  gracias: { fr: 'merci', en: 'thank you', es: 'gracias', de: 'danke' },
  danke: { fr: 'merci', en: 'thank you', es: 'gracias', de: 'danke' },
  hello: { fr: 'bonjour', en: 'hello', es: 'hola', de: 'hallo' },
  bonjour: { fr: 'bonjour', en: 'hello', es: 'hola', de: 'hallo' },
  hola: { fr: 'bonjour', en: 'hello', es: 'hola', de: 'hallo' },
  hallo: { fr: 'bonjour', en: 'hello', es: 'hola', de: 'hallo' },
  goodbye: { fr: 'au revoir', en: 'goodbye', es: 'adios', de: 'tschuss' },
  'au revoir': { fr: 'au revoir', en: 'goodbye', es: 'adios', de: 'tschuss' },
  adios: { fr: 'au revoir', en: 'goodbye', es: 'adios', de: 'tschuss' },
  tschuss: { fr: 'au revoir', en: 'goodbye', es: 'adios', de: 'tschuss' },

  // Reviews
  review: { fr: 'avis', en: 'review', es: 'opinion', de: 'bewertung' },
  avis: { fr: 'avis', en: 'review', es: 'opinion', de: 'bewertung' },
  opinion: { fr: 'avis', en: 'review', es: 'opinion', de: 'bewertung' },
  bewertung: { fr: 'avis', en: 'review', es: 'opinion', de: 'bewertung' },
  rating: { fr: 'note', en: 'rating', es: 'valoracion', de: 'bewertung' },
  note: { fr: 'note', en: 'rating', es: 'valoracion', de: 'bewertung' },
  valoracion: { fr: 'note', en: 'rating', es: 'valoracion', de: 'bewertung' },

  // Checkin
  checkin: { fr: 'check-in', en: 'check-in', es: 'registro', de: 'einchecken' },
  'check-in': { fr: 'check-in', en: 'check-in', es: 'registro', de: 'einchecken' },
  registro: { fr: 'check-in', en: 'check-in', es: 'registro', de: 'einchecken' },
  einchecken: { fr: 'check-in', en: 'check-in', es: 'registro', de: 'einchecken' },
};

// Store for original texts
const originalTexts = new Map();

// Store for translation cache
const translationCache = new Map();

/**
 * Get supported languages list
 * @returns {string[]} Array of language codes
 */
export function getSupportedLanguages() {
  return [...SUPPORTED_LANGUAGES];
}

/**
 * Check if a language is supported
 * @param {string} lang - Language code
 * @returns {boolean} True if supported
 */
export function isLanguageSupported(lang) {
  if (!lang || typeof lang !== 'string') return false;
  return SUPPORTED_LANGUAGES.includes(lang.toLowerCase());
}

/**
 * Detect language of text
 * @param {string} text - Text to analyze
 * @returns {string} Detected language code (fr, en, es, de) or 'unknown'
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string') {
    return 'unknown';
  }

  const normalizedText = text.toLowerCase().trim();
  if (!normalizedText) {
    return 'unknown';
  }

  // Split text into words (keep single char words for 'I' and 'a')
  const words = normalizedText
    .replace(/[^\w\s\u00C0-\u017F-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 1);

  if (words.length === 0) {
    return 'unknown';
  }

  // Count matches for each language
  const scores = {
    fr: 0,
    en: 0,
    es: 0,
    de: 0
  };

  for (const word of words) {
    for (const lang of SUPPORTED_LANGUAGES) {
      if (LANGUAGE_PATTERNS[lang].includes(word)) {
        scores[lang] += 1;
      }
    }
  }

  // Find language with highest score
  let maxScore = 0;
  let detectedLang = 'unknown';

  for (const [lang, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  }

  // Require at least 1 match to be confident
  if (maxScore < 1) {
    return 'unknown';
  }

  return detectedLang;
}

/**
 * Translate text to target language
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @param {string} [sourceLang] - Source language code (auto-detected if not provided)
 * @returns {Promise<{translated: string, sourceLang: string, targetLang: string, isTranslated: boolean}>}
 */
export async function translateText(text, targetLang, sourceLang = null) {
  // Validate inputs
  if (!text || typeof text !== 'string') {
    return {
      translated: text || '',
      sourceLang: sourceLang || 'unknown',
      targetLang: targetLang || 'en',
      isTranslated: false
    };
  }

  if (!targetLang || !isLanguageSupported(targetLang)) {
    targetLang = getState()?.lang || 'en';
  }

  targetLang = targetLang.toLowerCase();

  // Detect source language if not provided
  const detectedSource = sourceLang || detectLanguage(text);
  const actualSourceLang = isLanguageSupported(detectedSource) ? detectedSource : 'en';

  // If same language, no translation needed
  if (actualSourceLang === targetLang) {
    return {
      translated: text,
      sourceLang: actualSourceLang,
      targetLang,
      isTranslated: false
    };
  }

  // Check cache
  const cacheKey = `${text}|${actualSourceLang}|${targetLang}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  // Perform dictionary-based translation
  const translated = translateWithDictionary(text, actualSourceLang, targetLang);

  const result = {
    translated,
    sourceLang: actualSourceLang,
    targetLang,
    isTranslated: translated !== text
  };

  // Cache the result
  translationCache.set(cacheKey, result);

  return result;
}

/**
 * Translate text using dictionary
 * @private
 */
function translateWithDictionary(text, sourceLang, targetLang) {
  if (!text) return text;

  let result = text;

  // Sort dictionary entries by length (longest first) to handle phrases before words
  const entries = Object.entries(HITCHHIKING_DICTIONARY)
    .sort((a, b) => b[0].length - a[0].length);

  for (const [term, translations] of entries) {
    // Skip if this term is not in the source language
    const sourceTranslation = findSourceTerm(term, sourceLang);
    if (!sourceTranslation) continue;

    const targetTranslation = translations[targetLang];
    if (!targetTranslation || sourceTranslation === targetTranslation) continue;

    // Create case-insensitive regex for the source term
    const regex = new RegExp(`\\b${escapeRegex(sourceTranslation)}\\b`, 'gi');

    result = result.replace(regex, (match) => {
      // Preserve original case
      if (match === match.toUpperCase()) {
        return targetTranslation.toUpperCase();
      } else if (match[0] === match[0].toUpperCase()) {
        return targetTranslation.charAt(0).toUpperCase() + targetTranslation.slice(1);
      }
      return targetTranslation;
    });
  }

  return result;
}

/**
 * Find the source term for a given language
 * @private
 */
function findSourceTerm(term, sourceLang) {
  const translations = HITCHHIKING_DICTIONARY[term.toLowerCase()];
  if (!translations) return null;
  return translations[sourceLang] || null;
}

/**
 * Escape special regex characters
 * @private
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Store original text for later retrieval
 * @param {string} elementId - Element ID
 * @param {string} originalText - Original text
 */
export function storeOriginalText(elementId, originalText) {
  if (!elementId || typeof elementId !== 'string') {
    console.warn('[AutoTranslate] Invalid elementId');
    return;
  }
  originalTexts.set(elementId, originalText);
}

/**
 * Get original text for an element
 * @param {string} elementId - Element ID
 * @returns {string|null} Original text or null
 */
export function getOriginalText(elementId) {
  return originalTexts.get(elementId) || null;
}

/**
 * Render a translate button
 * @param {string} text - Text to translate
 * @param {string} elementId - Element ID for this translatable content
 * @returns {string} HTML for translate button
 */
export function renderTranslateButton(text, elementId) {
  if (!text || !elementId) {
    return '';
  }

  const state = getState() || {};
  const userLang = state.lang || 'fr';
  const detectedLang = detectLanguage(text);

  // Don't show button if text is in user's language or unknown
  if (detectedLang === userLang || detectedLang === 'unknown') {
    return '';
  }

  // Store original text
  storeOriginalText(elementId, text);

  const langNames = {
    fr: 'francais',
    en: 'English',
    es: 'Espanol',
    de: 'Deutsch'
  };

  const buttonLabel = {
    fr: 'Traduire',
    en: 'Translate',
    es: 'Traducir',
    de: 'Ubersetzen'
  };

  return `
    <button
      type="button"
      class="translate-btn inline-flex items-center gap-1 text-xs text-primary-500 hover:text-primary-400 transition-colors mt-1"
      onclick="window.translateElement('${escapeHtml(elementId)}')"
      aria-label="${buttonLabel[userLang] || 'Translate'}"
      data-element-id="${escapeHtml(elementId)}"
      data-source-lang="${detectedLang}"
      data-target-lang="${userLang}"
    >
      <i class="fas fa-language" aria-hidden="true"></i>
      <span>${buttonLabel[userLang] || 'Translate'} (${langNames[detectedLang] || detectedLang})</span>
    </button>
  `;
}

/**
 * Render "show original" button
 * @param {string} elementId - Element ID
 * @returns {string} HTML for show original button
 */
export function renderShowOriginalButton(elementId) {
  if (!elementId) {
    return '';
  }

  const state = getState() || {};
  const userLang = state.lang || 'fr';

  const buttonLabel = {
    fr: 'Voir l\'original',
    en: 'Show original',
    es: 'Ver original',
    de: 'Original zeigen'
  };

  return `
    <button
      type="button"
      class="show-original-btn inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300 transition-colors mt-1"
      onclick="window.showOriginal('${escapeHtml(elementId)}')"
      aria-label="${buttonLabel[userLang] || 'Show original'}"
      data-element-id="${escapeHtml(elementId)}"
    >
      <i class="fas fa-undo" aria-hidden="true"></i>
      <span>${buttonLabel[userLang] || 'Show original'}</span>
    </button>
  `;
}

/**
 * Render translated content with toggle
 * @param {string} original - Original text
 * @param {string} translated - Translated text
 * @param {string} elementId - Element ID
 * @param {boolean} showTranslated - Whether to show translated version
 * @returns {string} HTML with content and toggle button
 */
export function renderTranslatedContent(original, translated, elementId, showTranslated = false) {
  if (!elementId) {
    return original || '';
  }

  // Store original
  storeOriginalText(elementId, original);

  const displayText = showTranslated ? translated : original;
  const button = showTranslated
    ? renderShowOriginalButton(elementId)
    : renderTranslateButton(original, elementId);

  return `
    <div class="translatable-content" data-element-id="${escapeHtml(elementId)}">
      <div class="translatable-text" id="${escapeHtml(elementId)}">${escapeHtml(displayText)}</div>
      <div class="translation-controls">${button}</div>
    </div>
  `;
}

/**
 * Show original text for an element
 * @param {string} elementId - Element ID
 */
export function showOriginal(elementId) {
  if (!elementId) {
    console.warn('[AutoTranslate] No elementId provided');
    return;
  }

  const original = getOriginalText(elementId);
  if (!original) {
    console.warn('[AutoTranslate] No original text found for:', elementId);
    return;
  }

  // Update DOM
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = original;
  }

  // Update button
  const container = document.querySelector(`.translatable-content[data-element-id="${elementId}"]`);
  if (container) {
    const controlsContainer = container.querySelector('.translation-controls');
    if (controlsContainer) {
      controlsContainer.innerHTML = renderTranslateButton(original, elementId);
    }
  }
}

/**
 * Translate an element by ID
 * @param {string} elementId - Element ID
 */
export async function translateElement(elementId) {
  if (!elementId) {
    console.warn('[AutoTranslate] No elementId provided');
    return;
  }

  const original = getOriginalText(elementId);
  if (!original) {
    console.warn('[AutoTranslate] No original text found for:', elementId);
    return;
  }

  const state = getState() || {};
  const targetLang = state.lang || 'fr';

  const result = await translateText(original, targetLang);

  // Update DOM
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = result.translated;
  }

  // Update button
  const container = document.querySelector(`.translatable-content[data-element-id="${elementId}"]`);
  if (container) {
    const controlsContainer = container.querySelector('.translation-controls');
    if (controlsContainer) {
      controlsContainer.innerHTML = renderShowOriginalButton(elementId);
    }
  }
}

/**
 * Clear translation cache
 */
export function clearTranslationCache() {
  translationCache.clear();
}

/**
 * Clear original texts store
 */
export function clearOriginalTexts() {
  originalTexts.clear();
}

/**
 * Get dictionary term translations
 * @param {string} term - Term to look up
 * @returns {Object|null} Translations object or null
 */
export function getDictionaryTerm(term) {
  if (!term || typeof term !== 'string') return null;
  return HITCHHIKING_DICTIONARY[term.toLowerCase()] || null;
}

/**
 * Get all dictionary terms
 * @returns {string[]} Array of dictionary terms
 */
export function getDictionaryTerms() {
  return Object.keys(HITCHHIKING_DICTIONARY);
}

/**
 * Escape HTML special characters
 * @private
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Register global handlers
if (typeof window !== 'undefined') {
  window.translateElement = translateElement;
  window.showOriginal = showOriginal;
}

export default {
  translateText,
  detectLanguage,
  renderTranslateButton,
  renderShowOriginalButton,
  renderTranslatedContent,
  showOriginal,
  translateElement,
  getSupportedLanguages,
  isLanguageSupported,
  storeOriginalText,
  getOriginalText,
  clearTranslationCache,
  clearOriginalTexts,
  getDictionaryTerm,
  getDictionaryTerms,
};
