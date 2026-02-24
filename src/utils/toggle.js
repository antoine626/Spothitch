/**
 * Render a flat-minimal toggle switch (Design #5)
 * Uses transform: translateX() for smooth CSS transitions.
 * The onclick first animates the toggle visually (class toggle),
 * then calls the handler — so the animation plays even during full re-render.
 *
 * @param {boolean} isOn - Current toggle state
 * @param {string} handler - onclick handler string (e.g. "toggleTheme()")
 * @param {string} label - Accessibility aria-label
 * @returns {string} HTML string
 */
export function renderToggle(isOn, handler, label) {
  return `<button onclick="this.classList.toggle('toggle-on');setTimeout(()=>{${handler}},30)" role="switch" aria-checked="${isOn}" aria-label="${label}"
    class="relative w-[44px] h-[24px] rounded-xl shrink-0 border-2 transition-colors duration-200 ease-out ${isOn ? 'toggle-on border-amber-500 bg-dark-primary' : 'border-slate-600 bg-dark-primary'}"
    style="outline:none">
    <span class="absolute top-[2px] left-[2px] w-4 h-4 rounded-lg transition-all duration-200 ease-out ${isOn ? 'translate-x-5 bg-amber-500' : 'translate-x-0 bg-slate-500'}"></span>
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
  return `<button onclick="this.classList.toggle('toggle-on');setTimeout(()=>{${handler}},30)" role="switch" aria-checked="${isOn}" aria-label="${label}"
    class="relative w-[38px] h-[20px] rounded-lg shrink-0 border-2 transition-colors duration-200 ease-out ${isOn ? 'toggle-on border-amber-500 bg-dark-primary' : 'border-slate-600 bg-dark-primary'}"
    style="outline:none">
    <span class="absolute top-[1px] left-[1px] w-3.5 h-3.5 rounded-md transition-all duration-200 ease-out ${isOn ? 'translate-x-[18px] bg-amber-500' : 'translate-x-0 bg-slate-500'}"></span>
  </button>`
}
