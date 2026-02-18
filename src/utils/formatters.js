/**
 * Shared date/time formatters
 * Single source of truth — replaces duplicates in Social.js, Feed.js, Conversations.js
 */

import { t } from '../i18n/index.js'
import { getState } from '../stores/state.js'

const localeMap = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', de: 'de-DE' }

function getUserLocale() {
  const lang = getState().lang || 'fr'
  return localeMap[lang] || lang
}

/**
 * Format a timestamp to HH:MM in the user's locale
 */
export function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleTimeString(getUserLocale(), { hour: '2-digit', minute: '2-digit' })
}

/**
 * Format a date string as relative time (e.g. "5m", "2h", "3d")
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return t('justNow')
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}${t('daysShort')}`
    return date.toLocaleDateString(getUserLocale())
  } catch {
    return ''
  }
}

/**
 * Format a date string as "12 Feb 2026" in the user's locale
 */
export function formatEventDate(dateStr) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString(getUserLocale(), { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}
