/**
 * Spot Freshness/Reliability Service
 * Color-coded system based on USER validations (not HitchWiki ratings)
 *
 * Reliability (based on user check-ins/validations):
 *   - Grey:  Unverified (HitchWiki import, 0 user validations)
 *   - Amber: Some activity (1-2 validations)
 *   - Emerald: Reliable (3+ validations)
 *   - Blue:  Very reliable (5+ validations)
 *   - Purple: Ambassador-verified
 *   - Red:   Reported dangerous
 *
 * Freshness (age without new validation):
 *   - < 1 year: Nouveau / New
 *   - 1-3 years: Ancien / Old
 *   - 3-5 years: Historique / Historic
 *   - > 5 years: auto-deleted (handled in spotLoader)
 */

import { getState } from '../stores/state.js'
import { t } from '../i18n/index.js'
import { icon } from '../utils/icons.js'

/**
 * Get spot reliability status based on USER validations
 * @param {Object} spot - Spot object
 * @returns {Object} { color, labelKey, icon, bgClass, textClass, borderClass }
 */
export function getSpotFreshness(spot) {
  if (!spot) {
    return {
      color: 'slate',
      labelKey: 'unverifiedSpot',
      icon: 'help-circle',
      bgClass: 'bg-slate-500/20',
      textClass: 'text-slate-400',
      borderClass: 'border-slate-500/30'
    }
  }

  // RED: Dangerous or reported
  if (spot.dangerous === true || spot.reported === true) {
    return {
      color: 'red',
      labelKey: 'dangerousSpot',
      icon: 'triangle-alert',
      bgClass: 'bg-red-500/20',
      textClass: 'text-red-400',
      borderClass: 'border-red-500/30'
    }
  }

  // PURPLE: Ambassador-verified
  if (spot.ambassadorVerified === true) {
    return {
      color: 'purple',
      labelKey: 'ambassadorVerified',
      icon: 'badge-check',
      bgClass: 'bg-purple-500/20',
      textClass: 'text-purple-400',
      borderClass: 'border-purple-500/30'
    }
  }

  // Count user validations (check-ins from app users, not HitchWiki reviews)
  const userValidations = spot.userValidations || 0

  // BLUE: Very reliable (5+ user validations)
  if (userValidations >= 5) {
    return {
      color: 'blue',
      labelKey: 'veryReliableSpot',
      icon: 'shield-check',
      bgClass: 'bg-blue-500/20',
      textClass: 'text-blue-400',
      borderClass: 'border-blue-500/30'
    }
  }

  // EMERALD: Reliable (3+ user validations)
  if (userValidations >= 3) {
    return {
      color: 'emerald',
      labelKey: 'reliableSpot',
      icon: 'circle-check',
      bgClass: 'bg-emerald-500/20',
      textClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/30'
    }
  }

  // AMBER: Some activity (1-2 user validations)
  if (userValidations >= 1) {
    return {
      color: 'amber',
      labelKey: 'partiallyVerified',
      icon: 'circle-alert',
      bgClass: 'bg-amber-500/20',
      textClass: 'text-amber-400',
      borderClass: 'border-amber-500/30'
    }
  }

  // GREY: Unverified (HitchWiki import or no user validation)
  return {
    color: 'slate',
    labelKey: 'unverifiedSpot',
    icon: 'help-circle',
    bgClass: 'bg-slate-500/20',
    textClass: 'text-slate-400',
    borderClass: 'border-slate-500/30'
  }
}

/**
 * Get spot age/freshness status
 * @param {Object} spot - Spot object
 * @returns {Object} { labelKey, icon, bgClass, textClass, borderClass }
 */
export function getSpotAge(spot) {
  const lastDate = spot?.lastCheckin || spot?.lastUsed || spot?.createdAt
  if (!lastDate) {
    return { labelKey: 'unknownAge', icon: 'clock', bgClass: 'bg-slate-500/20', textClass: 'text-slate-400', borderClass: 'border-slate-500/30' }
  }

  const now = new Date()
  const spotDate = new Date(lastDate)
  const diffMs = now - spotDate
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25)

  if (diffYears < 1) {
    return { labelKey: 'freshSpot', icon: 'sparkles', bgClass: 'bg-emerald-500/20', textClass: 'text-emerald-400', borderClass: 'border-emerald-500/30' }
  }
  if (diffYears < 3) {
    return { labelKey: 'agingSpot', icon: 'clock', bgClass: 'bg-yellow-500/20', textClass: 'text-yellow-400', borderClass: 'border-yellow-500/30' }
  }
  if (diffYears < 5) {
    return { labelKey: 'oldSpot', icon: 'archive', bgClass: 'bg-orange-500/20', textClass: 'text-orange-400', borderClass: 'border-orange-500/30' }
  }
  // > 5 years — should have been auto-deleted, but fallback
  return { labelKey: 'oldSpot', icon: 'archive', bgClass: 'bg-red-500/20', textClass: 'text-red-400', borderClass: 'border-red-500/30' }
}

/**
 * Render reliability badge HTML
 * @param {Object} spot - Spot object
 * @param {string} size - Badge size: 'sm', 'md', 'lg'
 * @returns {string} HTML string for the badge
 */
export function renderFreshnessBadge(spot, size = 'md') {
  const freshness = getSpotFreshness(spot)
  const label = t(freshness.labelKey) || freshness.labelKey

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

  const validations = spot?.userValidations || 0
  const countText = validations > 0 ? ` (${validations})` : ''

  return `
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${sizes[size]} font-medium ${freshness.bgClass} ${freshness.textClass} border ${freshness.borderClass}">
      ${icon(freshness.icon, `${iconSizes[size]}`)}
      <span>${label}${countText}</span>
    </span>
  `
}

/**
 * Render age badge HTML
 * @param {Object} spot - Spot object
 * @param {string} size - Badge size: 'sm', 'md', 'lg'
 * @returns {string}
 */
export function renderAgeBadge(spot, size = 'sm') {
  const age = getSpotAge(spot)
  const label = t(age.labelKey) || age.labelKey

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
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${sizes[size]} font-medium ${age.bgClass} ${age.textClass} border ${age.borderClass}">
      ${icon(age.icon, `${iconSizes[size]}`)}
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
    slate: '#94a3b8',    // Grey — unverified
    amber: '#f59e0b',    // Some activity
    emerald: '#10b981',  // Reliable
    blue: '#3b82f6',     // Very reliable
    purple: '#a855f7',   // Ambassador verified
    red: '#ef4444',      // Dangerous
  }
  return colors[freshness.color] || colors.slate
}

export default {
  getSpotFreshness,
  getSpotAge,
  renderFreshnessBadge,
  renderAgeBadge,
  getFreshnessColor
}
