/**
 * Spot Drafts Service
 * Saves incomplete spots as drafts in localStorage for offline usage
 */

import { t } from '../i18n/index.js'

const STORAGE_KEY = 'spothitch_spot_drafts'
const EXPIRY_DAYS = 7

/**
 * Save a spot draft to localStorage
 * @param {Object} data - Partial spot data (photo, type, position, etc.)
 * @returns {string} Draft ID
 */
export function saveSpotDraft(data) {
  const drafts = getSpotDrafts()
  const id = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const draft = {
    id,
    ...data,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  }
  drafts.push(draft)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
  return id
}

/**
 * Get all non-expired drafts
 * @returns {Array} Drafts
 */
export function getSpotDrafts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const drafts = JSON.parse(raw)
    const now = new Date()
    return drafts.filter(d => new Date(d.expiresAt) > now)
  } catch {
    return []
  }
}

/**
 * Delete a specific draft
 * @param {string} draftId - Draft ID to delete
 */
export function deleteSpotDraft(draftId) {
  const drafts = getSpotDrafts()
  const filtered = drafts.filter(d => d.id !== draftId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

/**
 * Clean up expired drafts
 */
export function cleanupExpiredDrafts() {
  const drafts = getSpotDrafts() // already filters expired
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
}

/**
 * Check for drafts when coming back online and show notification
 */
export function checkDraftsOnReconnect() {
  const drafts = getSpotDrafts()
  if (drafts.length > 0) {
    import('./notifications.js').then(({ showInfo }) => {
      const msg = `${drafts.length} ${t('draftsToComplete') || 'spot(s) à compléter'}`
      showInfo(msg)
    }).catch(() => {})
  }
}

// Listen for online event to notify about pending drafts
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    setTimeout(checkDraftsOnReconnect, 2000)
  })
}

export default {
  saveSpotDraft,
  getSpotDrafts,
  deleteSpotDraft,
  cleanupExpiredDrafts,
  checkDraftsOnReconnect,
}
