/**
 * ============================================================
 * CANONICAL TOGGLE — the ONE AND ONLY toggle in SpotHitch
 * ============================================================
 * ALL toggles in the entire app MUST use renderToggle() or
 * renderToggleCompact() from this file. NO inline toggle HTML
 * is allowed anywhere else. If you need a toggle, import this.
 *
 * Design #5 — Flat Minimal, CSS-driven transitions.
 * .spothitch-toggle-dot styles in main.css control position
 * and color — no Tailwind utility conflicts.
 * overflow-hidden on the container ensures the dot never
 * visually escapes.
 *
 * Uses a handler registry to avoid inline JS interpolation
 * (CodeQL: improper code sanitization). Handlers are stored
 * in a Map and executed via a global delegated click handler.
 *
 * Variants:
 *   renderToggle()        — standard size (44x24)
 *   renderToggleCompact() — smaller (38x20), for inline lists
 *
 * For form toggles that also control a hidden checkbox, use
 * the handler: "toggleFormToggle('checkboxId')"
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

// Global delegated handler — called from onclick with the toggle element
// Reads the handler ID from data-tid, looks up the registered handler,
// and executes it after a 30ms delay (so CSS animation plays first).
window._toggleExec = (el) => {
  el.classList.toggle('toggle-on')
  const on = el.classList.contains('toggle-on')
  el.setAttribute('aria-checked', on)
  const tid = el.dataset.tid
  const handler = _handlers.get(tid)
  if (handler) {
    setTimeout(() => {
      // handler is always developer-controlled (never user input)
      new Function(handler)()
    }, 30)
  }
}

export function renderToggle(isOn, handler, label) {
  const safeLabel = escapeAttr(label)
  const tid = `t${_nextId++}`
  _handlers.set(tid, handler)
  return `<button onclick="window._toggleExec(this)" data-tid="${tid}" role="switch" aria-checked="${isOn}" aria-label="${safeLabel}"
    class="spothitch-toggle relative w-[44px] h-[24px] rounded-xl shrink-0 border-2 overflow-hidden ${isOn ? 'toggle-on' : ''}"
    style="outline:none">
    <span class="spothitch-toggle-dot absolute top-[4px] left-[2px] w-4 h-4 rounded-full"></span>
  </button>`
}

/**
 * Render a compact toggle (smaller, for inline use in lists)
 *
 * @param {boolean} isOn - Current toggle state
 * @param {string} handler - onclick handler string
 * @param {string} label - Accessibility aria-label
 * @returns {string} HTML string
 */
export function renderToggleCompact(isOn, handler, label) {
  const safeLabel = escapeAttr(label)
  const tid = `t${_nextId++}`
  _handlers.set(tid, handler)
  return `<button onclick="window._toggleExec(this)" data-tid="${tid}" role="switch" aria-checked="${isOn}" aria-label="${safeLabel}"
    class="spothitch-toggle spothitch-toggle-compact relative w-[38px] h-[20px] rounded-lg shrink-0 border-2 overflow-hidden ${isOn ? 'toggle-on' : ''}"
    style="outline:none">
    <span class="spothitch-toggle-dot absolute top-[3px] left-[2px] w-3.5 h-3.5 rounded-full"></span>
  </button>`
}
