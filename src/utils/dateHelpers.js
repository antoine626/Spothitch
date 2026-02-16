/**
 * Date Helpers Utility
 * Functions for calculating and displaying time-based information
 */

import { getState } from '../stores/state.js';
import { icon } from './icons.js'

/**
 * Freshness levels for spots based on last check-in date
 */
export const FRESHNESS_LEVELS = {
  ACTIVE: 'active',      // < 1 week
  RECENT: 'recent',      // < 1 month
  OLD: 'old',            // < 6 months
  UNVERIFIED: 'unverified' // > 6 months
};

/**
 * Freshness thresholds in milliseconds
 */
const THRESHOLDS = {
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  ONE_MONTH: 30 * 24 * 60 * 60 * 1000,
  SIX_MONTHS: 180 * 24 * 60 * 60 * 1000
};

/**
 * Get human-readable time ago string
 * @param {string|Date} date - The date to compare
 * @returns {string} Human-readable time ago string
 */
export function getTimeAgo(date) {
  if (!date) return null;

  const { lang } = getState();
  const now = new Date();
  const pastDate = new Date(date);
  const diffMs = now - pastDate;

  // Handle invalid dates
  if (isNaN(diffMs)) return null;

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  // Translations for time units
  const translations = {
    fr: {
      justNow: "a l'instant",
      minutesAgo: (n) => n === 1 ? 'il y a 1 minute' : `il y a ${n} minutes`,
      hoursAgo: (n) => n === 1 ? 'il y a 1 heure' : `il y a ${n} heures`,
      daysAgo: (n) => n === 1 ? 'il y a 1 jour' : `il y a ${n} jours`,
      weeksAgo: (n) => n === 1 ? 'il y a 1 semaine' : `il y a ${n} semaines`,
      monthsAgo: (n) => n === 1 ? 'il y a 1 mois' : `il y a ${n} mois`,
      yearsAgo: (n) => n === 1 ? 'il y a 1 an' : `il y a ${n} ans`
    },
    en: {
      justNow: 'just now',
      minutesAgo: (n) => n === 1 ? '1 minute ago' : `${n} minutes ago`,
      hoursAgo: (n) => n === 1 ? '1 hour ago' : `${n} hours ago`,
      daysAgo: (n) => n === 1 ? '1 day ago' : `${n} days ago`,
      weeksAgo: (n) => n === 1 ? '1 week ago' : `${n} weeks ago`,
      monthsAgo: (n) => n === 1 ? '1 month ago' : `${n} months ago`,
      yearsAgo: (n) => n === 1 ? '1 year ago' : `${n} years ago`
    },
    es: {
      justNow: 'ahora mismo',
      minutesAgo: (n) => n === 1 ? 'hace 1 minuto' : `hace ${n} minutos`,
      hoursAgo: (n) => n === 1 ? 'hace 1 hora' : `hace ${n} horas`,
      daysAgo: (n) => n === 1 ? 'hace 1 dia' : `hace ${n} dias`,
      weeksAgo: (n) => n === 1 ? 'hace 1 semana' : `hace ${n} semanas`,
      monthsAgo: (n) => n === 1 ? 'hace 1 mes' : `hace ${n} meses`,
      yearsAgo: (n) => n === 1 ? 'hace 1 ano' : `hace ${n} anos`
    },
    de: {
      justNow: 'gerade eben',
      minutesAgo: (n) => n === 1 ? 'vor 1 Minute' : `vor ${n} Minuten`,
      hoursAgo: (n) => n === 1 ? 'vor 1 Stunde' : `vor ${n} Stunden`,
      daysAgo: (n) => n === 1 ? 'vor 1 Tag' : `vor ${n} Tagen`,
      weeksAgo: (n) => n === 1 ? 'vor 1 Woche' : `vor ${n} Wochen`,
      monthsAgo: (n) => n === 1 ? 'vor 1 Monat' : `vor ${n} Monaten`,
      yearsAgo: (n) => n === 1 ? 'vor 1 Jahr' : `vor ${n} Jahren`
    }
  };

  const t = translations[lang] || translations.en;

  if (diffSeconds < 60) return t.justNow;
  if (diffMinutes < 60) return t.minutesAgo(diffMinutes);
  if (diffHours < 24) return t.hoursAgo(diffHours);
  if (diffDays < 7) return t.daysAgo(diffDays);
  if (diffWeeks < 5) return t.weeksAgo(diffWeeks);
  if (diffMonths < 12) return t.monthsAgo(diffMonths);
  return t.yearsAgo(diffYears);
}

/**
 * Get freshness level based on last check-in date
 * @param {string|Date} date - The last check-in date
 * @returns {string} One of FRESHNESS_LEVELS values
 */
export function getFreshnessLevel(date) {
  if (!date) return FRESHNESS_LEVELS.UNVERIFIED;

  const now = new Date();
  const pastDate = new Date(date);
  const diffMs = now - pastDate;

  // Handle invalid dates
  if (isNaN(diffMs)) return FRESHNESS_LEVELS.UNVERIFIED;

  if (diffMs < THRESHOLDS.ONE_WEEK) return FRESHNESS_LEVELS.ACTIVE;
  if (diffMs < THRESHOLDS.ONE_MONTH) return FRESHNESS_LEVELS.RECENT;
  if (diffMs < THRESHOLDS.SIX_MONTHS) return FRESHNESS_LEVELS.OLD;
  return FRESHNESS_LEVELS.UNVERIFIED;
}

/**
 * Get freshness badge configuration
 * @param {string} level - Freshness level from getFreshnessLevel
 * @returns {Object} Badge configuration with icon, label, color classes
 */
export function getFreshnessBadge(level) {
  const { lang } = getState();

  const badges = {
    [FRESHNESS_LEVELS.ACTIVE]: {
      icon: 'circle',
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
      label: {
        fr: 'Actif',
        en: 'Active',
        es: 'Activo',
        de: 'Aktiv'
      },
      description: {
        fr: 'Verifie recemment',
        en: 'Recently verified',
        es: 'Verificado recientemente',
        de: 'Kurzlich verifiziert'
      }
    },
    [FRESHNESS_LEVELS.RECENT]: {
      icon: 'circle',
      iconColor: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-400',
      label: {
        fr: 'Recent',
        en: 'Recent',
        es: 'Reciente',
        de: 'Aktuell'
      },
      description: {
        fr: 'Verifie ce mois-ci',
        en: 'Verified this month',
        es: 'Verificado este mes',
        de: 'Diesen Monat verifiziert'
      }
    },
    [FRESHNESS_LEVELS.OLD]: {
      icon: 'circle',
      iconColor: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500/30',
      textColor: 'text-orange-400',
      label: {
        fr: 'Ancien',
        en: 'Old',
        es: 'Antiguo',
        de: 'Alt'
      },
      description: {
        fr: 'Verifie il y a quelques mois',
        en: 'Verified months ago',
        es: 'Verificado hace meses',
        de: 'Vor Monaten verifiziert'
      }
    },
    [FRESHNESS_LEVELS.UNVERIFIED]: {
      icon: 'circle',
      iconColor: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
      label: {
        fr: 'Non verifie',
        en: 'Unverified',
        es: 'No verificado',
        de: 'Nicht verifiziert'
      },
      description: {
        fr: 'Aucune verification recente',
        en: 'No recent verification',
        es: 'Sin verificacion reciente',
        de: 'Keine aktuelle Verifizierung'
      }
    }
  };

  const badge = badges[level] || badges[FRESHNESS_LEVELS.UNVERIFIED];

  return {
    ...badge,
    label: badge.label[lang] || badge.label.en,
    description: badge.description[lang] || badge.description.en
  };
}

/**
 * Get warning message for unverified spots
 * @param {string} level - Freshness level
 * @returns {string|null} Warning message or null if not needed
 */
export function getFreshnessWarning(level) {
  if (level !== FRESHNESS_LEVELS.UNVERIFIED) return null;

  const { lang } = getState();

  const warnings = {
    fr: 'Ce spot n\'a pas ete verifie depuis longtemps. Les informations peuvent avoir change.',
    en: 'This spot has not been verified recently. Information may have changed.',
    es: 'Este spot no ha sido verificado recientemente. La informacion puede haber cambiado.',
    de: 'Dieser Spot wurde lange nicht verifiziert. Die Informationen konnten sich geandert haben.'
  };

  return warnings[lang] || warnings.en;
}

/**
 * Get last check-in text
 * @param {string|Date} date - The last check-in date
 * @returns {string} Formatted last check-in text
 */
export function getLastCheckinText(date) {
  const { lang } = getState();

  const labels = {
    fr: 'Dernier check-in',
    en: 'Last check-in',
    es: 'Ultimo check-in',
    de: 'Letzter Check-in'
  };

  const unknownText = {
    fr: 'Inconnu',
    en: 'Unknown',
    es: 'Desconocido',
    de: 'Unbekannt'
  };

  const label = labels[lang] || labels.en;
  const timeAgo = getTimeAgo(date);

  if (!timeAgo) {
    return `${label}: ${unknownText[lang] || unknownText.en}`;
  }

  return `${label}: ${timeAgo}`;
}

/**
 * Render freshness badge HTML
 * @param {string|Date} date - The last check-in date
 * @param {string} size - Badge size: 'sm', 'md', 'lg'
 * @returns {string} HTML string for the freshness badge
 */
export function renderFreshnessBadge(date, size = 'md') {
  const level = getFreshnessLevel(date);
  const badge = getFreshnessBadge(level);

  const sizes = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };

  return `
    <span
      class="inline-flex items-center gap-1 rounded-full ${badge.bgColor} ${badge.borderColor} border ${sizes[size]}"
      title="${badge.description}"
      aria-label="Statut: ${badge.label} - ${badge.description}"
    >
      ${icon(badge.icon, `${badge.iconColor} ${iconSizes[size]}`)}
      <span class="${badge.textColor} font-medium">${badge.label}</span>
    </span>
  `;
}

/**
 * Render freshness indicator (compact version for cards)
 * @param {string|Date} date - The last check-in date
 * @returns {string} HTML string for the compact indicator
 */
export function renderFreshnessIndicator(date) {
  const level = getFreshnessLevel(date);
  const badge = getFreshnessBadge(level);

  return `
    <span
      class="inline-flex items-center justify-center w-3 h-3 rounded-full ${badge.bgColor} border ${badge.borderColor}"
      title="${badge.label}: ${badge.description}"
      aria-label="Fraicheur: ${badge.label}"
    >
      <span class="w-1.5 h-1.5 rounded-full ${badge.iconColor.replace('text-', 'bg-')}" aria-hidden="true"></span>
    </span>
  `;
}

/**
 * Render full freshness section for spot detail
 * @param {string|Date} lastCheckinDate - The last check-in date
 * @returns {string} HTML string for the freshness section
 */
export function renderFreshnessSection(lastCheckinDate) {
  const level = getFreshnessLevel(lastCheckinDate);
  const badge = getFreshnessBadge(level);
  const warning = getFreshnessWarning(level);
  const timeAgo = getTimeAgo(lastCheckinDate);
  const { lang } = getState();

  const labels = {
    fr: 'Dernier check-in',
    en: 'Last check-in',
    es: 'Ultimo check-in',
    de: 'Letzter Check-in'
  };

  const unknownText = {
    fr: 'Aucun check-in enregistre',
    en: 'No check-in recorded',
    es: 'Sin check-in registrado',
    de: 'Kein Check-in registriert'
  };

  const label = labels[lang] || labels.en;

  return `
    <div class="mb-4 p-3 rounded-xl ${badge.bgColor} border ${badge.borderColor}">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          ${icon('clock', `w-5 h-5 ${badge.iconColor}`)}
          <span class="text-sm font-medium ${badge.textColor}">${label}</span>
        </div>
        ${renderFreshnessBadge(lastCheckinDate, 'sm')}
      </div>
      <div class="text-lg font-bold ${badge.textColor}">
        ${timeAgo || unknownText[lang] || unknownText.en}
      </div>
      ${warning ? `
        <div class="mt-3 flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          ${icon('triangle-alert', 'w-5 h-5 text-red-400 mt-0.5')}
          <p class="text-xs text-red-300">${warning}</p>
        </div>
      ` : ''}
    </div>
  `;
}

export default {
  getTimeAgo,
  getFreshnessLevel,
  getFreshnessBadge,
  getFreshnessWarning,
  getLastCheckinText,
  renderFreshnessBadge,
  renderFreshnessIndicator,
  renderFreshnessSection,
  FRESHNESS_LEVELS
};
