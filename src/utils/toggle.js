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
 * onclick immediately toggles 'toggle-on' class -> instant
 * visual feedback, then calls the real handler after 30ms so
 * the animation plays first.
 *
 * Variants:
 *   renderToggle()        — standard size (44x24)
 *   renderToggleCompact() — smaller (38x20), for inline lists
 *
 * For form toggles that also control a hidden checkbox, use
 * the handler: "toggleFormToggle('checkboxId')"
 * ============================================================
 *
 * @param {boolean} isOn - Current toggle state
 * @param {string} handler - onclick handler string (e.g. "toggleTheme()")
 * @param {string} label - Accessibility aria-label
 * @returns {string} HTML string
 */

// Sanitize a string for safe use in an HTML attribute context
// Escapes &, <, >, ", ' to prevent attribute injection (CodeQL: improper code sanitization)
function escapeAttr(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function renderToggle(isOn, handler, label) {
  const safeLabel = escapeAttr(label)
  // handler is always developer-controlled code (never user input),
  // but we sanitize to prevent accidental attribute breakout
  const safeHandler = escapeAttr(handler)
  return `<button onclick="this.classList.toggle('toggle-on');this.setAttribute('aria-checked',this.classList.contains('toggle-on'));setTimeout(()=>{${safeHandler}},30)" role="switch" aria-checked="${isOn}" aria-label="${safeLabel}"
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
  const safeHandler = escapeAttr(handler)
  return `<button onclick="this.classList.toggle('toggle-on');this.setAttribute('aria-checked',this.classList.contains('toggle-on'));setTimeout(()=>{${safeHandler}},30)" role="switch" aria-checked="${isOn}" aria-label="${safeLabel}"
    class="spothitch-toggle spothitch-toggle-compact relative w-[38px] h-[20px] rounded-lg shrink-0 border-2 overflow-hidden ${isOn ? 'toggle-on' : ''}"
    style="outline:none">
    <span class="spothitch-toggle-dot absolute top-[3px] left-[2px] w-3.5 h-3.5 rounded-full"></span>
  </button>`
}
