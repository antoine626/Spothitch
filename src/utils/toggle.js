/**
 * ============================================================
 * CANONICAL TOGGLE — the ONE AND ONLY toggle in SpotHitch
 * ============================================================
 * ALL toggles in the entire app MUST use renderToggle() or
 * renderToggleCompact() from this file. NO inline toggle HTML
 * is allowed anywhere else. If you need a toggle, import this.
 *
 * Design #11 — Neon Glow Thumb (👎→👍).
 * Dark pill with neon amber border glow when ON.
 * Emoji thumb slides from left (👎) to right (👍).
 * .spothitch-toggle styles in main.css control glow + transitions.
 *
 * ⚠️ THIS DESIGN WAS CHOSEN BY THE USER (2026-02-28).
 * DO NOT CHANGE without explicit user approval.
 *
 * Uses a handler registry to avoid inline JS interpolation
 * (CodeQL: improper code sanitization). Handlers are stored
 * in a Map and executed via a global delegated click handler.
 *
 * Variants:
 *   renderToggle()        — standard size (60x32)
 *   renderToggleCompact() — smaller (48x26), for inline lists
 * ============================================================
 */

// Handler registry — maps toggle IDs to handler strings
const _handlers = new Map()
let _nextId = 0

// Sanitize a string for safe use in an HTML attribute context
function escapeAttr(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Parse a handler string like "toggleTheme()" or "togglePrivacy('showToNonFriends')"
// into a function call on window, without using new Function (CSP-safe).
function execHandler(handlerStr) {
  if (!handlerStr) return
  const match = handlerStr.match(/^(\w+)\((.*)\)$/)
  if (!match) return
  const fnName = match[1]
  const fn = window[fnName]
  if (typeof fn !== 'function') return
  const rawArgs = match[2].trim()
  if (!rawArgs) {
    fn()
  } else {
    // Parse arguments: supports 'string', "string", and numbers
    const args = rawArgs.split(',').map(a => {
      a = a.trim()
      // String argument (single or double quotes)
      if ((a.startsWith("'") && a.endsWith("'")) || (a.startsWith('"') && a.endsWith('"'))) {
        return a.slice(1, -1)
      }
      // Boolean
      if (a === 'true') return true
      if (a === 'false') return false
      // Number
      const n = Number(a)
      if (!isNaN(n)) return n
      return a
    })
    fn(...args)
  }
}

// Global delegated handler — called from onclick with the toggle element
// Reads the handler ID from data-tid, looks up the registered handler,
// and executes it after a 30ms delay (so CSS animation plays first).
window._toggleExec = (el) => {
  el.classList.toggle('toggle-on')
  const on = el.classList.contains('toggle-on')
  el.setAttribute('aria-checked', on)
  // Update thumb emoji
  const thumb = el.querySelector('.spothitch-toggle-thumb')
  if (thumb) thumb.textContent = on ? '👍' : '👎'
  const tid = el.dataset.tid
  const handler = _handlers.get(tid)
  if (handler) {
    setTimeout(() => {
      // handler is always developer-controlled (never user input)
      // CSP-safe: parsed and called via window[fnName] instead of new Function
      execHandler(handler)
    }, 30)
  }
}

export function renderToggle(isOn, handler, label) {
  const safeLabel = escapeAttr(label)
  const tid = `t${_nextId++}`
  _handlers.set(tid, handler)
  return `<button onclick="window._toggleExec(this)" data-tid="${tid}" role="switch" aria-checked="${isOn}" aria-label="${safeLabel}"
    class="spothitch-toggle shrink-0 ${isOn ? 'toggle-on' : ''}"
    style="outline:none">
    <span class="spothitch-toggle-thumb">${isOn ? '👍' : '👎'}</span>
  </button>`
}

/**
 * Render a compact toggle (smaller, for inline use in lists)
 */
export function renderToggleCompact(isOn, handler, label) {
  const safeLabel = escapeAttr(label)
  const tid = `t${_nextId++}`
  _handlers.set(tid, handler)
  return `<button onclick="window._toggleExec(this)" data-tid="${tid}" role="switch" aria-checked="${isOn}" aria-label="${safeLabel}"
    class="spothitch-toggle spothitch-toggle-compact shrink-0 ${isOn ? 'toggle-on' : ''}"
    style="outline:none">
    <span class="spothitch-toggle-thumb">${isOn ? '👍' : '👎'}</span>
  </button>`
}
