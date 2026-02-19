/**
 * Internationalization (i18n) Module
 * Handles translations, language detection, and pluralization
 * Languages are loaded on demand — only the active language is in memory
 */

import { getState, setState } from '../stores/state.js';

// Language configurations with flags
export const languageConfig = {
  fr: { code: 'fr', name: 'Francais', flag: '\uD83C\uDDEB\uD83C\uDDF7', nativeName: 'Francais' },
  en: { code: 'en', name: 'English', flag: '\uD83C\uDDEC\uD83C\uDDE7', nativeName: 'English' },
  es: { code: 'es', name: 'Espanol', flag: '\uD83C\uDDEA\uD83C\uDDF8', nativeName: 'Espanol' },
  de: { code: 'de', name: 'German', flag: '\uD83C\uDDE9\uD83C\uDDEA', nativeName: 'Deutsch' },
};

/**
 * Pluralization rules per language
 */
const pluralRules = {
  fr: (count) => (count <= 1 ? 'one' : 'other'),
  en: (count) => (count === 1 ? 'one' : 'other'),
  es: (count) => (count === 1 ? 'one' : 'other'),
  de: (count) => (count === 1 ? 'one' : 'other'),
};

/**
 * Plural forms for common words
 */
const pluralForms = {
  fr: {
    point: { one: 'pouce', other: 'pouces' },
    day: { one: 'jour', other: 'jours' },
    hour: { one: 'heure', other: 'heures' },
    minute: { one: 'minute', other: 'minutes' },
    kilometer: { one: 'kilometre', other: 'kilometres' },
    message: { one: 'message', other: 'messages' },
    photo: { one: 'photo', other: 'photos' },
    result: { one: 'resultat', other: 'resultats' },
    entry: { one: 'entree', other: 'entrees' },
    notification: { one: 'notification', other: 'notifications' },
  },
  en: {
    point: { one: 'thumb', other: 'thumbs' },
    day: { one: 'day', other: 'days' },
    hour: { one: 'hour', other: 'hours' },
    minute: { one: 'minute', other: 'minutes' },
    kilometer: { one: 'kilometer', other: 'kilometers' },
    message: { one: 'message', other: 'messages' },
    photo: { one: 'photo', other: 'photos' },
    result: { one: 'result', other: 'results' },
    entry: { one: 'entry', other: 'entries' },
    notification: { one: 'notification', other: 'notifications' },
  },
  es: {
    point: { one: 'pulgar', other: 'pulgares' },
    day: { one: 'dia', other: 'dias' },
    hour: { one: 'hora', other: 'horas' },
    minute: { one: 'minuto', other: 'minutos' },
    kilometer: { one: 'kilometro', other: 'kilometros' },
    message: { one: 'mensaje', other: 'mensajes' },
    photo: { one: 'foto', other: 'fotos' },
    result: { one: 'resultado', other: 'resultados' },
    entry: { one: 'entrada', other: 'entradas' },
    notification: { one: 'notificacion', other: 'notificaciones' },
  },
  de: {
    point: { one: 'Daumen', other: 'Daumen' },
    day: { one: 'Tag', other: 'Tage' },
    hour: { one: 'Stunde', other: 'Stunden' },
    minute: { one: 'Minute', other: 'Minuten' },
    kilometer: { one: 'Kilometer', other: 'Kilometer' },
    message: { one: 'Nachricht', other: 'Nachrichten' },
    photo: { one: 'Foto', other: 'Fotos' },
    result: { one: 'Ergebnis', other: 'Ergebnisse' },
    entry: { one: 'Eintrag', other: 'Eintrage' },
    notification: { one: 'Benachrichtigung', other: 'Benachrichtigungen' },
  },
};

// Dynamic language loaders — Vite code-splits each into its own chunk
const langLoaders = {
  fr: () => import('./lang/fr.js'),
  en: () => import('./lang/en.js'),
  es: () => import('./lang/es.js'),
  de: () => import('./lang/de.js'),
}

// Loaded translations cache (only active + fallback language in memory)
const translations = {}

// Fallback language
const FALLBACK = 'fr'

/**
 * Load a language into cache
 */
async function loadLang(lang) {
  if (translations[lang]) return translations[lang]
  const loader = langLoaders[lang]
  if (!loader) return null
  const mod = await loader()
  translations[lang] = mod.default
  return mod.default
}

/**
 * Initialize i18n — MUST be called before first render
 * Loads the detected language (and fallback if different)
 */
export async function initI18n() {
  const lang = detectLanguage()
  await loadLang(lang)
  if (lang !== FALLBACK) {
    // Load fallback in background for missing key lookups
    loadLang(FALLBACK)
  }
  return lang
}

/**
 * Pluralize a word based on count and current language
 */
export function pluralize(key, count, includeCount = true) {
  const { lang } = getState();
  const langForms = pluralForms[lang] || pluralForms.en;
  const langRule = pluralRules[lang] || pluralRules.en;
  const forms = langForms[key];
  if (!forms) {
    return includeCount ? `${count} ${key}` : key;
  }
  const form = langRule(count);
  const word = forms[form] || forms.other;
  return includeCount ? `${count} ${word}` : word;
}

export function formatCount(count, key) {
  return pluralize(key, count, true);
}

export function getPluralWord(key, count) {
  return pluralize(key, count, false);
}

/**
 * Detect browser/device language automatically
 */
export function detectLanguage() {
  const supported = Object.keys(languageConfig);

  try {
    const saved = JSON.parse(localStorage.getItem('spothitch_v4_state') || '{}')
    if (saved.lang && supported.includes(saved.lang)) {
      return saved.lang
    }
  } catch (e) { /* no-op */ }

  const browserLang = navigator.language?.substring(0, 2).toLowerCase();
  if (supported.includes(browserLang)) {
    return browserLang;
  }

  if (navigator.languages && navigator.languages.length > 0) {
    for (const lang of navigator.languages) {
      const langCode = lang.substring(0, 2).toLowerCase();
      if (supported.includes(langCode)) {
        return langCode;
      }
    }
  }

  return 'en';
}

export function isFirstLaunch() {
  return !localStorage.getItem('spothitch_language_selected');
}

export function markLanguageSelected() {
  localStorage.setItem('spothitch_language_selected', 'true');
}

/**
 * Get translation by key (synchronous — language must be loaded first via initI18n)
 */
export function t(key, params = {}) {
  const { lang } = getState();
  const langTranslations = translations[lang] || translations[FALLBACK] || {};
  const fallback = translations[FALLBACK] || {};
  let text = langTranslations[key] || fallback[key] || key;

  Object.entries(params).forEach(([k, v]) => {
    text = text.replace(`{${k}}`, v);
  });

  return text;
}

/**
 * Set language — loads translations dynamically if not yet cached
 */
export async function setLanguage(lang) {
  if (!languageConfig[lang]) return false
  await loadLang(lang)
  setState({ lang });
  document.documentElement.lang = lang;
  return true;
}

export function getAvailableLanguages() {
  return Object.values(languageConfig);
}

export function getLanguageInfo(code) {
  return languageConfig[code] || languageConfig.en;
}

/**
 * Load external translations (for future expansion)
 */
export async function loadTranslations(lang) {
  try {
    const response = await fetch(`/i18n/${lang}.json`);
    if (response.ok) {
      const data = await response.json();
      translations[lang] = { ...(translations[lang] || {}), ...data };
      return true;
    }
  } catch (error) {
    console.warn(`Failed to load external translations for ${lang}`);
  }
  return false;
}

export { translations, pluralForms, pluralRules };
export default {
  t,
  setLanguage,
  detectLanguage,
  getAvailableLanguages,
  getLanguageInfo,
  isFirstLaunch,
  markLanguageSelected,
  languageConfig,
  pluralize,
  formatCount,
  getPluralWord,
  initI18n,
};
