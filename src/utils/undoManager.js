/**
 * Undo Manager with Toast-Undo Pattern
 * Allows users to undo destructive actions within a grace period
 * Shows a toast with "Annuler" button before executing the action
 */

const UNDO_TIMEOUT = 5000 // 5 seconds to undo
const pendingActions = new Map()
let actionCounter = 0

/**
 * Schedule a destructive action with undo capability
 * Shows a toast, waits for timeout, then executes
 * @param {Object} config
 * @param {string} config.message - Toast message (e.g., "Spot supprime")
 * @param {Function} config.execute - Function to execute after grace period
 * @param {Function} [config.onUndo] - Function to call if user undoes
 * @param {number} [config.timeout] - Grace period in ms (default 5000)
 * @returns {string} Action ID (for programmatic undo)
 */
export function scheduleAction(config) {
  const { message, execute, onUndo, timeout = UNDO_TIMEOUT } = config
  const id = `undo_${++actionCounter}`

  // Show undo toast
  const toast = showUndoToast(id, message)

  const timer = setTimeout(() => {
    // Execute the action
    try {
      execute()
    } catch (e) {
      console.error('[UndoManager] Action failed:', e)
    }
    pendingActions.delete(id)
    removeToast(toast)
  }, timeout)

  pendingActions.set(id, { timer, execute, onUndo, toast })

  return id
}

/**
 * Undo a pending action
 * @param {string} actionId
 * @returns {boolean} true if undone, false if too late
 */
export function undoAction(actionId) {
  const action = pendingActions.get(actionId)
  if (!action) return false

  clearTimeout(action.timer)
  pendingActions.delete(actionId)

  if (action.onUndo) {
    try {
      action.onUndo()
    } catch (e) {
      console.error('[UndoManager] Undo callback failed:', e)
    }
  }

  removeToast(action.toast)
  return true
}

/**
 * Cancel all pending actions (execute immediately)
 */
export function flushAll() {
  for (const [id, action] of pendingActions) {
    clearTimeout(action.timer)
    try {
      action.execute()
    } catch (e) {
      console.error('[UndoManager] Flush failed:', e)
    }
    removeToast(action.toast)
  }
  pendingActions.clear()
}

/**
 * Cancel all pending actions (don't execute)
 */
export function cancelAll() {
  for (const [id, action] of pendingActions) {
    clearTimeout(action.timer)
    removeToast(action.toast)
  }
  pendingActions.clear()
}

/**
 * Show an undo toast notification
 */
function showUndoToast(actionId, message) {
  // Create toast container if it doesn't exist
  let container = document.getElementById('undo-toast-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'undo-toast-container'
    container.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:10000;display:flex;flex-direction:column;gap:8px;align-items:center;'
    document.body.appendChild(container)
  }

  const toast = document.createElement('div')
  toast.className = 'undo-toast'
  toast.dataset.actionId = actionId
  toast.style.cssText = `
    display:flex;align-items:center;gap:12px;
    background:#1a2332;border:1px solid #334155;
    color:#e2e8f0;padding:12px 16px;border-radius:12px;
    box-shadow:0 4px 12px rgba(0,0,0,0.3);
    font-size:14px;min-width:280px;
    animation:slideUp 0.3s ease;
  `
  toast.innerHTML = `
    <span style="flex:1">${message}</span>
    <button onclick="window.undoAction('${actionId}')"
            style="background:#f59e0b;color:white;border:none;padding:6px 14px;
                   border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;
                   white-space:nowrap;">
      Annuler
    </button>
  `

  container.appendChild(toast)
  return toast
}

/**
 * Remove a toast element
 */
function removeToast(toast) {
  if (!toast || !toast.parentNode) return
  toast.style.animation = 'slideDown 0.3s ease'
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast)
    // Remove container if empty
    const container = document.getElementById('undo-toast-container')
    if (container && container.children.length === 0) {
      container.remove()
    }
  }, 300)
}

// Global handler for onclick
if (typeof window !== 'undefined') {
  window.undoAction = undoAction
}

export default { scheduleAction, undoAction, flushAll, cancelAll }
