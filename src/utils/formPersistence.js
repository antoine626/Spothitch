/**
 * Smart Form Persistence
 * Auto-saves form drafts to localStorage on input
 * Restores them when the form re-opens (prevents lost work)
 */

const STORAGE_PREFIX = 'spothitch_draft_'
const DRAFT_TTL = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Save a form draft
 * @param {string} formId - Unique form identifier (e.g., 'addSpot', 'review')
 * @param {Object} data - Form data to save
 */
export function saveDraft(formId, data) {
  try {
    const key = STORAGE_PREFIX + formId
    const draft = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(draft))
  } catch (e) {
    // localStorage full or unavailable
  }
}

/**
 * Load a form draft
 * @param {string} formId
 * @returns {Object|null} Saved data or null if expired/not found
 */
export function loadDraft(formId) {
  try {
    const key = STORAGE_PREFIX + formId
    const raw = localStorage.getItem(key)
    if (!raw) return null

    const draft = JSON.parse(raw)
    if (Date.now() - draft.timestamp > DRAFT_TTL) {
      localStorage.removeItem(key)
      return null
    }

    return draft.data
  } catch (e) {
    return null
  }
}

/**
 * Clear a form draft
 * @param {string} formId
 */
export function clearDraft(formId) {
  localStorage.removeItem(STORAGE_PREFIX + formId)
}

/**
 * Check if a draft exists for a form
 * @param {string} formId
 * @returns {boolean}
 */
export function hasDraft(formId) {
  return loadDraft(formId) !== null
}

/**
 * Auto-persist a form by observing input events
 * Call after rendering a form
 * @param {string} formId - Unique form identifier
 * @param {string} formSelector - CSS selector for the form element
 * @param {string[]} fieldNames - Field names to track
 * @returns {Function} cleanup function to stop observing
 */
export function autoSaveForm(formId, formSelector, fieldNames) {
  const form = document.querySelector(formSelector)
  if (!form) return () => {}

  // Restore draft on init
  const draft = loadDraft(formId)
  if (draft) {
    fieldNames.forEach(name => {
      const field = form.querySelector(`[name="${name}"], #${name}`)
      if (field && draft[name] !== undefined) {
        field.value = draft[name]
      }
    })
  }

  // Save on input
  const handler = () => {
    const data = {}
    fieldNames.forEach(name => {
      const field = form.querySelector(`[name="${name}"], #${name}`)
      if (field) data[name] = field.value
    })
    saveDraft(formId, data)
  }

  form.addEventListener('input', handler)
  form.addEventListener('change', handler)

  return () => {
    form.removeEventListener('input', handler)
    form.removeEventListener('change', handler)
  }
}

/**
 * Render a "draft restored" banner
 * @param {string} formId
 * @returns {string} HTML string (empty if no draft)
 */
export function renderDraftBanner(formId) {
  if (!hasDraft(formId)) return ''

  return `
    <div class="flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-lg px-3 py-2 mb-3 text-sm text-amber-300">
      <i class="fas fa-file-alt"></i>
      <span>Brouillon restaure</span>
      <button onclick="window.clearFormDraft('${formId}')" class="ml-auto text-amber-400 hover:text-amber-200 text-xs underline">
        Effacer
      </button>
    </div>
  `
}

/**
 * Clear all expired drafts
 */
export function cleanupDrafts() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX))
    keys.forEach(key => {
      try {
        const draft = JSON.parse(localStorage.getItem(key))
        if (Date.now() - draft.timestamp > DRAFT_TTL) {
          localStorage.removeItem(key)
        }
      } catch (e) {
        localStorage.removeItem(key)
      }
    })
  } catch (e) { /* ignore */ }
}

export default { saveDraft, loadDraft, clearDraft, hasDraft, autoSaveForm, renderDraftBanner, cleanupDrafts }
