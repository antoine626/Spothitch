/**
 * Spot Freshness/Reliability Service
 * Color-coded indicator system for spot quality and recency
 */

import { getState } from '../stores/state.js'
import { icon } from '../utils/icons.js'

/**
 * Get spot freshness/reliability status
 * @param {Object} spot - Spot object with rating, lastUsed, dangerous, reported
 * @returns {Object} { color, label, labelEn, labelEs, labelDe, icon, bgClass, textClass, borderClass }
 */
export function getSpotFreshness(spot) {
  if (!spot) {
    return {
      color: 'amber',
      label: 'Inconnu',
      labelEn: 'Unknown',
      labelEs: 'Desconocido',
      labelDe: 'Unbekannt',
      icon: 'info',
      bgClass: 'bg-amber-500/20',
      textClass: 'text-amber-400',
      borderClass: 'border-amber-500/30'
    }
  }

  // RED: Dangerous, reported, or very low rating
  if (spot.dangerous === true || spot.reported === true || (spot.globalRating && spot.globalRating < 2.5)) {
    return {
      color: 'red',
      label: 'Déconseillé',
      labelEn: 'Not recommended',
      labelEs: 'No recomendado',
      labelDe: 'Nicht empfohlen',
      icon: 'circle-x',
      bgClass: 'bg-red-500/20',
      textClass: 'text-red-400',
      borderClass: 'border-red-500/30'
    }
  }

  // GREEN: Recent review (< 6 months) OR high rating
  const lastDate = spot.lastUsed || spot.lastReview || spot.lastCheckin
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const hasRecentReview = lastDate && new Date(lastDate) > sixMonthsAgo
  const hasGoodRating = spot.globalRating && spot.globalRating >= 3.5

  if (hasRecentReview || hasGoodRating) {
    return {
      color: 'emerald',
      label: 'Fiable',
      labelEn: 'Reliable',
      labelEs: 'Confiable',
      labelDe: 'Zuverlässig',
      icon: 'circle-check',
      bgClass: 'bg-emerald-500/20',
      textClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/30'
    }
  }

  // ORANGE: No review in 18+ months
  const eighteenMonthsAgo = new Date()
  eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18)

  if (lastDate && new Date(lastDate) < eighteenMonthsAgo) {
    return {
      color: 'orange',
      label: 'Ancien',
      labelEn: 'Outdated',
      labelEs: 'Antiguo',
      labelDe: 'Veraltet',
      icon: 'clock',
      bgClass: 'bg-orange-500/20',
      textClass: 'text-orange-400',
      borderClass: 'border-orange-500/30'
    }
  }

  // YELLOW: Between 6-18 months, decent rating (or no rating)
  return {
    color: 'amber',
    label: 'À vérifier',
    labelEn: 'Needs verification',
    labelEs: 'Necesita verificación',
    labelDe: 'Überprüfung erforderlich',
    icon: 'circle-alert',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30'
  }
}

/**
 * Render freshness badge HTML
 * @param {Object} spot - Spot object
 * @param {string} size - Badge size: 'sm', 'md', 'lg'
 * @returns {string} HTML string for the badge
 */
export function renderFreshnessBadge(spot, size = 'md') {
  const freshness = getSpotFreshness(spot)
  const state = getState()
  const lang = state.lang || 'fr'

  // Select label based on language
  let label = freshness.label // default French
  if (lang === 'en') label = freshness.labelEn
  else if (lang === 'es') label = freshness.labelEs
  else if (lang === 'de') label = freshness.labelDe

  const sizes = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  }

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  return `
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${sizes[size]} font-medium ${freshness.bgClass} ${freshness.textClass} border ${freshness.borderClass}">
      ${icon(freshness.icon, `${iconSizes[size]}`)}
      <span>${label}</span>
    </span>
  `
}

/**
 * Get hex color for marker tinting
 * @param {Object} spot - Spot object
 * @returns {string} Hex color code
 */
export function getFreshnessColor(spot) {
  const freshness = getSpotFreshness(spot)
  const colors = {
    emerald: '#10b981',
    amber: '#f59e0b',
    orange: '#f97316',
    red: '#ef4444'
  }
  return colors[freshness.color] || colors.amber
}

export default {
  getSpotFreshness,
  renderFreshnessBadge,
  getFreshnessColor
}
