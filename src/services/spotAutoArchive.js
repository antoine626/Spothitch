/**
 * Spot Auto-Archive Service
 * Automatically archives spots with no activity for 3+ years
 * Archived spots are hidden from default views but can be reactivated
 */

import { getState, setState } from '../stores/state.js'

const ARCHIVE_STORAGE_KEY = 'spothitch_archived_spots'
const ARCHIVE_THRESHOLD_YEARS = 3
const ARCHIVE_THRESHOLD_MS = ARCHIVE_THRESHOLD_YEARS * 365.25 * 24 * 60 * 60 * 1000

/**
 * Archive reasons
 */
export const ArchiveReasons = {
  INACTIVITY: 'inactivity',
  MANUAL: 'manual',
  DUPLICATE: 'duplicate',
  INVALID_LOCATION: 'invalid_location',
}

/**
 * Get archived spots from storage
 * @returns {Object} Map of spotId -> archive info
 */
export function getArchivedSpots() {
  try {
    const data = localStorage.getItem(ARCHIVE_STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

/**
 * Save archived spots to storage
 * @param {Object} archived - Map of spotId -> archive info
 */
function saveArchivedSpots(archived) {
  try {
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archived))
  } catch (e) {
    console.warn('[SpotAutoArchive] Failed to save:', e)
  }
}

/**
 * Check if a spot should be auto-archived based on inactivity
 * @param {Object} spot - Spot object
 * @returns {boolean}
 */
export function shouldArchiveSpot(spot) {
  if (!spot) return false

  const now = Date.now()
  const lastActivity = getLastActivityDate(spot)

  if (!lastActivity) return false

  return (now - lastActivity.getTime()) >= ARCHIVE_THRESHOLD_MS
}

/**
 * Get the last activity date for a spot
 * @param {Object} spot - Spot object
 * @returns {Date|null}
 */
export function getLastActivityDate(spot) {
  if (!spot) return null

  const dates = [
    spot.lastUsed,
    spot.lastReview,
    spot.lastCheckin,
    spot.updatedAt,
    spot.createdAt,
  ].filter(Boolean).map(d => new Date(d))

  if (dates.length === 0) return null

  return new Date(Math.max(...dates.map(d => d.getTime())))
}

/**
 * Archive a spot
 * @param {number|string} spotId - Spot ID
 * @param {string} reason - Archive reason
 * @param {string} archivedBy - User who archived (or 'system')
 * @returns {Object} Archive record
 */
export function archiveSpot(spotId, reason = ArchiveReasons.INACTIVITY, archivedBy = 'system') {
  const archived = getArchivedSpots()

  if (archived[spotId]) {
    return archived[spotId]
  }

  const record = {
    spotId,
    reason,
    archivedBy,
    archivedAt: new Date().toISOString(),
    reactivated: false,
  }

  archived[spotId] = record
  saveArchivedSpots(archived)

  return record
}

/**
 * Reactivate an archived spot
 * @param {number|string} spotId - Spot ID
 * @param {string} reactivatedBy - User who reactivated
 * @returns {boolean} Success
 */
export function reactivateSpot(spotId, reactivatedBy = 'user') {
  const archived = getArchivedSpots()

  if (!archived[spotId]) return false

  archived[spotId].reactivated = true
  archived[spotId].reactivatedAt = new Date().toISOString()
  archived[spotId].reactivatedBy = reactivatedBy
  delete archived[spotId]

  saveArchivedSpots(archived)
  return true
}

/**
 * Check if a spot is archived
 * @param {number|string} spotId - Spot ID
 * @returns {boolean}
 */
export function isSpotArchived(spotId) {
  const archived = getArchivedSpots()
  return !!archived[spotId] && !archived[spotId].reactivated
}

/**
 * Run auto-archive scan on a list of spots
 * @param {Array} spots - List of spot objects
 * @returns {Object} { archived: [], skipped: [], total: number }
 */
export function runAutoArchiveScan(spots) {
  if (!Array.isArray(spots)) return { archived: [], skipped: [], total: 0 }

  const results = { archived: [], skipped: [], total: spots.length }
  const alreadyArchived = getArchivedSpots()

  for (const spot of spots) {
    const id = spot.id || spot.spotId
    if (!id) continue

    if (alreadyArchived[id]) {
      results.skipped.push(id)
      continue
    }

    if (shouldArchiveSpot(spot)) {
      archiveSpot(id, ArchiveReasons.INACTIVITY, 'system')
      results.archived.push(id)
    }
  }

  if (results.archived.length > 0) {
    console.log(`[SpotAutoArchive] Archived ${results.archived.length} inactive spots`)
  }

  return results
}

/**
 * Filter out archived spots from a list
 * @param {Array} spots - List of spot objects
 * @param {boolean} showArchived - If true, include archived spots
 * @returns {Array} Filtered spots
 */
export function filterArchivedSpots(spots, showArchived = false) {
  if (!Array.isArray(spots)) return []
  if (showArchived) return spots

  const archived = getArchivedSpots()
  return spots.filter(spot => {
    const id = spot.id || spot.spotId
    return !archived[id]
  })
}

/**
 * Get archive stats
 * @returns {Object} { totalArchived, byReason, oldestArchive, newestArchive }
 */
export function getArchiveStats() {
  const archived = getArchivedSpots()
  const entries = Object.values(archived)

  const stats = {
    totalArchived: entries.length,
    byReason: {},
    oldestArchive: null,
    newestArchive: null,
  }

  for (const entry of entries) {
    stats.byReason[entry.reason] = (stats.byReason[entry.reason] || 0) + 1

    const date = new Date(entry.archivedAt)
    if (!stats.oldestArchive || date < new Date(stats.oldestArchive)) {
      stats.oldestArchive = entry.archivedAt
    }
    if (!stats.newestArchive || date > new Date(stats.newestArchive)) {
      stats.newestArchive = entry.archivedAt
    }
  }

  return stats
}

/**
 * Get years since last activity for a spot
 * @param {Object} spot - Spot object
 * @returns {number|null} Years since last activity
 */
export function getYearsSinceLastActivity(spot) {
  const lastDate = getLastActivityDate(spot)
  if (!lastDate) return null

  const diffMs = Date.now() - lastDate.getTime()
  return diffMs / (365.25 * 24 * 60 * 60 * 1000)
}

/**
 * Render archive badge for a spot
 * @param {number|string} spotId - Spot ID
 * @param {string} lang - Language code
 * @returns {string} HTML badge or empty string
 */
export function renderArchiveBadge(spotId, lang = 'fr') {
  if (!isSpotArchived(spotId)) return ''

  const labels = {
    fr: 'Archivé',
    en: 'Archived',
    es: 'Archivado',
    de: 'Archiviert',
  }

  const label = labels[lang] || labels.fr

  return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
    <i class="fas fa-archive text-[10px]" aria-hidden="true"></i>
    <span>${label}</span>
  </span>`
}

/**
 * Clear all archive data (for testing)
 */
export function clearArchiveData() {
  try {
    localStorage.removeItem(ARCHIVE_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export default {
  ArchiveReasons,
  getArchivedSpots,
  shouldArchiveSpot,
  getLastActivityDate,
  archiveSpot,
  reactivateSpot,
  isSpotArchived,
  runAutoArchiveScan,
  filterArchivedSpots,
  getArchiveStats,
  getYearsSinceLastActivity,
  renderArchiveBadge,
  clearArchiveData,
}
