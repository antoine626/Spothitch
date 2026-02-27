/**
 * ============================================================
 * CANONICAL SEARCH INPUT — the ONE AND ONLY search input in SpotHitch
 * ============================================================
 * ALL search inputs with a magnifying glass icon MUST use
 * renderSearchInput() from this file. NO inline search+icon HTML
 * is allowed anywhere else. If you need a search input, import this.
 *
 * This prevents the recurring bug where the search icon overlaps
 * the typed text (caused by CSS specificity issues with padding-left).
 *
 * The helper ensures:
 *   - Icon is absolutely positioned on the left, pointer-events-none
 *   - Input has enough left padding (pl-10 minimum) so text never overlaps
 *   - Consistent styling across the entire app
 *   - Accessible with aria-label
 *
 * @see ERR-044 in memory/errors.md
 * ============================================================
 */

import { icon } from './icons.js'

/**
 * Render a search input with a properly positioned search icon.
 *
 * @param {Object} options
 * @param {string} [options.id] - Input id attribute
 * @param {string} [options.placeholder] - Placeholder text
 * @param {string} [options.ariaLabel] - Accessible label (defaults to placeholder)
 * @param {string} [options.value] - Current input value
 * @param {string} [options.oninput] - oninput handler string
 * @param {string} [options.onkeydown] - onkeydown handler string
 * @param {string} [options.onfocus] - onfocus handler string
 * @param {string} [options.inputClass] - Additional classes for the <input> (default: 'input-field w-full')
 * @param {string} [options.wrapperClass] - Additional classes for the wrapper <div>
 * @param {string} [options.iconSize] - Icon size class (default: 'w-5 h-5')
 * @param {string} [options.iconLeft] - Icon left position (default: 'left-3')
 * @param {string} [options.paddingLeft] - Input padding-left (default: 'pl-10')
 * @param {string} [options.type] - Input type (default: 'text')
 * @param {string} [options.autocomplete] - autocomplete attribute
 * @param {string} [options.extraHTML] - Extra HTML inside the wrapper (e.g. clear button, suggestions div)
 * @returns {string} HTML string
 */
export function renderSearchInput(options = {}) {
  const {
    id = '',
    placeholder = '',
    ariaLabel = '',
    value = '',
    oninput = '',
    onkeydown = '',
    onfocus = '',
    inputClass = 'input-field w-full',
    wrapperClass = '',
    iconSize = 'w-5 h-5',
    iconLeft = 'left-3',
    paddingLeft = 'pl-10',
    type = 'text',
    autocomplete = '',
    extraHTML = '',
  } = options

  const idAttr = id ? `id="${id}"` : ''
  const valAttr = value ? `value="${value}"` : ''
  const oninputAttr = oninput ? `oninput="${oninput}"` : ''
  const onkeydownAttr = onkeydown ? `onkeydown="${onkeydown}"` : ''
  const onfocusAttr = onfocus ? `onfocus="${onfocus}"` : ''
  const autocompleteAttr = autocomplete ? `autocomplete="${autocomplete}"` : ''
  const label = ariaLabel || placeholder

  return `
    <div class="relative ${wrapperClass}">
      ${icon('search', `${iconSize} absolute ${iconLeft} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`)}
      <input
        type="${type}"
        ${idAttr}
        placeholder="${placeholder}"
        aria-label="${label}"
        class="${inputClass} ${paddingLeft}"
        ${valAttr}
        ${oninputAttr}
        ${onkeydownAttr}
        ${onfocusAttr}
        ${autocompleteAttr}
      />
      ${extraHTML}
    </div>
  `
}
