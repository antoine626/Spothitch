/**
 * Render a flat-minimal toggle switch (Design #5)
 * CSS-driven transitions: .spothitch-toggle-dot styles in main.css control
 * position and color — no Tailwind utility conflicts.
 * overflow-hidden on the container ensures the dot never visually escapes.
 * onclick immediately toggles 'toggle-on' class → instant visual feedback,
 * then calls the real handler after 30ms so the animation plays first.
 *
 * @param {boolean} isOn - Current toggle state
 * @param {string} handler - onclick handler string (e.g. "toggleTheme()")
 * @param {string} label - Accessibility aria-label
 * @returns {string} HTML string
 */
export function renderToggle(isOn, handler, label) {
  return `<button onclick="this.classList.toggle('toggle-on');setTimeout(()=>{${handler}},30)" role="switch" aria-checked="${isOn}" aria-label="${label}"
    class="spothitch-toggle relative w-[44px] h-[24px] rounded-xl shrink-0 border-2 overflow-hidden ${isOn ? 'toggle-on' : ''}"
    style="outline:none">
    <span class="spothitch-toggle-dot absolute top-[2px] left-[2px] w-4 h-4 rounded-full"></span>
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
    class="spothitch-toggle spothitch-toggle-compact relative w-[38px] h-[20px] rounded-lg shrink-0 border-2 overflow-hidden ${isOn ? 'toggle-on' : ''}"
    style="outline:none">
    <span class="spothitch-toggle-dot absolute top-[1px] left-[1px] w-3.5 h-3.5 rounded-full"></span>
  </button>`
}
