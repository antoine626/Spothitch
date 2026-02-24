/**
 * Render a pill-style toggle switch (Style 1: Pill classique with 👍/👎)
 * Consistent UI component used across the entire app.
 *
 * @param {boolean} isOn - Current toggle state
 * @param {string} handler - onclick handler string (e.g. "toggleTheme()")
 * @param {string} label - Accessibility aria-label
 * @returns {string} HTML string
 */
export function renderToggle(isOn, handler, label) {
  return `<button onclick="${handler}" role="switch" aria-checked="${isOn}" aria-label="${label}"
    class="relative w-14 h-7 rounded-full transition-colors shrink-0 ${isOn ? 'bg-emerald-500' : 'bg-slate-600'}">
    <span class="absolute top-0.5 ${isOn ? 'right-0.5' : 'left-0.5'} w-6 h-6 rounded-full bg-white flex items-center justify-center text-sm shadow transition-all">
      ${isOn ? '👍' : '👎'}
    </span>
  </button>`
}

/**
 * Render a compact pill toggle (smaller, for inline use in lists)
 *
 * @param {boolean} isOn - Current toggle state
 * @param {string} handler - onclick handler string
 * @param {string} label - Accessibility aria-label
 * @returns {string} HTML string
 */
export function renderToggleCompact(isOn, handler, label) {
  return `<button onclick="${handler}" role="switch" aria-checked="${isOn}" aria-label="${label}"
    class="relative w-12 h-6 rounded-full transition-colors shrink-0 ${isOn ? 'bg-emerald-500' : 'bg-slate-600'}">
    <span class="absolute top-0.5 ${isOn ? 'right-0.5' : 'left-0.5'} w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs shadow transition-all">
      ${isOn ? '👍' : '👎'}
    </span>
  </button>`
}
