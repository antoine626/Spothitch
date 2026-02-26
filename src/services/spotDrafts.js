/**
 * Spot Drafts Service
 * Saves incomplete spots as drafts in localStorage for offline usage
 * Stores ALL form data for complete restoration
 * Schedules reminder notifications after 1h and 6h
 */

import { t } from '../i18n/index.js'

const STORAGE_KEY = 'spothitch_spot_drafts'
const EXPIRY_DAYS = 7

/**
 * Save a spot draft to localStorage with ALL form data
 * @param {Object} data - Complete spot form data
 * @returns {string} Draft ID
 */
export function saveSpotDraft(data) {
  const drafts = getSpotDrafts()
  const id = `draft_${Date.now()}_${crypto.getRandomValues(new Uint32Array(1))[0].toString(36).substring(0, 5)}`
  const now = Date.now()
  const draft = {
    id,
    ...data,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(now + EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    reminders: {
      oneHour: new Date(now + 60 * 60 * 1000).toISOString(),
      sixHours: new Date(now + 6 * 60 * 60 * 1000).toISOString(),
    },
  }
  drafts.push(draft)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))

  // Schedule reminder notifications
  scheduleReminders(draft)

  // Update banner visibility
  import('../stores/state.js').then(({ setState }) => {
    setState({ spotDraftsBannerVisible: true })
  }).catch(() => {})

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

  // Update banner visibility
  if (filtered.length === 0) {
    import('../stores/state.js').then(({ setState }) => {
      setState({ spotDraftsBannerVisible: false })
    }).catch(() => {})
  }
}

/**
 * Clean up expired drafts
 */
export function cleanupExpiredDrafts() {
  const drafts = getSpotDrafts() // already filters expired
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
}

/**
 * Check for drafts and update banner state
 */
export function checkDraftsOnReconnect() {
  const drafts = getSpotDrafts()
  if (drafts.length > 0) {
    import('../stores/state.js').then(({ setState }) => {
      setState({ spotDraftsBannerVisible: true })
    }).catch(() => {})

    import('./notifications.js').then(({ showInfo }) => {
      const msg = `${drafts.length} ${t('draftsToComplete') || 'spot(s) à compléter'}`
      showInfo(msg)
    }).catch(() => {})
  }
}

/**
 * Schedule reminder notifications for a draft
 * Uses setTimeout for in-session reminders
 */
function scheduleReminders(draft) {
  const now = Date.now()
  const oneHourMs = new Date(draft.reminders.oneHour).getTime() - now
  const sixHoursMs = new Date(draft.reminders.sixHours).getTime() - now

  // 1-hour reminder
  if (oneHourMs > 0 && oneHourMs < 7200000) {
    setTimeout(() => {
      // Check if draft still exists (not submitted/deleted)
      const current = getSpotDrafts()
      if (current.find(d => d.id === draft.id)) {
        import('./notifications.js').then(({ showInfo }) => {
          showInfo(t('draftReminderBody') || 'Tu as un brouillon de spot en attente')
        }).catch(() => {})
      }
    }, oneHourMs)
  }

  // 6-hour reminder
  if (sixHoursMs > 0 && sixHoursMs < 25200000) {
    setTimeout(() => {
      const current = getSpotDrafts()
      if (current.find(d => d.id === draft.id)) {
        import('./notifications.js').then(({ showInfo }) => {
          showInfo(t('draftReminderBody') || 'Tu as un brouillon de spot en attente')
        }).catch(() => {})
      }
    }, sixHoursMs)
  }
}

/**
 * Render draft banner HTML (called from App.js)
 */
export function renderDraftBanner() {
  const drafts = getSpotDrafts()
  if (drafts.length === 0) return ''

  const latest = drafts[drafts.length - 1]
  const cityName = latest.departureCity || latest.directionCity || ''

  return `
    <div class="draft-banner" role="button" tabindex="0" onclick="openSpotDraft('${latest.id}')">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3 min-w-0 text-white">
          <span class="text-xl">📝</span>
          <div class="min-w-0">
            <div class="text-sm font-semibold">${t('draftBannerTitle') || 'Brouillon en attente'}</div>
            <div class="text-xs opacity-80 truncate">${cityName ? cityName : (t('draftBannerDesc') || 'Tu as un spot à terminer')}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            onclick="event.stopPropagation();openSpotDraft('${latest.id}')"
            class="px-3 py-1 rounded-lg bg-white/20 text-white text-xs font-medium"
          >
            ${t('draftBannerResume') || 'Reprendre'}
          </button>
          <button
            onclick="event.stopPropagation();deleteSpotDraft('${latest.id}')"
            class="px-2 py-1 rounded-lg bg-white/10 text-white/70 text-xs"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  `
}

// Listen for online event to notify about pending drafts
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    setTimeout(checkDraftsOnReconnect, 2000)
  })

  // Check on init
  setTimeout(() => {
    const drafts = getSpotDrafts()
    if (drafts.length > 0) {
      import('../stores/state.js').then(({ setState }) => {
        setState({ spotDraftsBannerVisible: true })
      }).catch(() => {})
    }
  }, 3000)
}

export default {
  saveSpotDraft,
  getSpotDrafts,
  deleteSpotDraft,
  cleanupExpiredDrafts,
  checkDraftsOnReconnect,
  renderDraftBanner,
}
