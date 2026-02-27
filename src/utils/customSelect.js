/**
 * Custom Select Dropdown — reusable component matching SpotHitch design
 *
 * Usage:
 *   renderCustomSelect({ id, options, value, label })
 *
 * Handlers (auto-registered on window):
 *   toggleCustomSelect(id)   — open/close dropdown
 *   selectCustomOption(id, value, label) — pick an option
 */

import { icon } from './icons.js'

/**
 * Render a custom dropdown that matches the app design
 * @param {Object} params
 * @param {string} params.id — unique id (used for DOM ids)
 * @param {string} params.label — label text above the dropdown
 * @param {Array<{value:string, text:string}>} params.options — list of options
 * @param {string} [params.value] — default selected value (first option if omitted)
 * @param {string} [params.className] — extra classes on wrapper
 * @returns {string} HTML string
 */
export function renderCustomSelect({ id, label, options, value, className = '' }) {
  const selected = options.find(o => o.value === value) || options[0] || { value: '', text: '' }
  return `
    <div class="${className} relative">
      ${label ? `<label class="text-xs text-slate-400 mb-1 block">${label}</label>` : ''}
      <input type="hidden" id="${id}" value="${selected.value}" />
      <button type="button" onclick="toggleCustomSelect('${id}')" id="${id}-btn"
        class="input-field w-full text-left flex items-center justify-between" role="listbox" aria-expanded="false">
        <span id="${id}-label" class="truncate">${selected.text}</span>
        ${icon('chevron-down', 'w-4 h-4 text-slate-400 shrink-0 ml-1')}
      </button>
      <div id="${id}-menu" class="custom-select-menu hidden absolute z-50 left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-xl bg-dark-secondary/95 backdrop-blur-lg border border-white/10 max-h-60 overflow-y-auto">
        ${options.map(o => `
          <button type="button" onclick="selectCustomOption('${id}','${o.value}',this.textContent)"
            class="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 border-b border-white/5 last:border-0 transition-colors">${o.text}</button>
        `).join('')}
      </div>
    </div>
  `
}

// ---- Global handlers (one set for all custom selects) ----

if (typeof window !== 'undefined' && !window.toggleCustomSelect) {
  window.toggleCustomSelect = (id) => {
    const menu = document.getElementById(`${id}-menu`)
    const btn = document.getElementById(`${id}-btn`)
    if (!menu) return
    const isOpen = !menu.classList.contains('hidden')
    // Close all open custom select menus first
    document.querySelectorAll('.custom-select-menu').forEach(m => m.classList.add('hidden'))
    document.querySelectorAll('[id$="-btn"][aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'))
    if (!isOpen) {
      menu.classList.remove('hidden')
      btn?.setAttribute('aria-expanded', 'true')
    }
  }

  window.selectCustomOption = (id, value, label) => {
    const hidden = document.getElementById(id)
    const labelEl = document.getElementById(`${id}-label`)
    const menu = document.getElementById(`${id}-menu`)
    const btn = document.getElementById(`${id}-btn`)
    if (hidden) hidden.value = value
    if (labelEl) labelEl.textContent = label
    if (menu) menu.classList.add('hidden')
    if (btn) btn.setAttribute('aria-expanded', 'false')
  }

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[id$="-btn"]') && !e.target.closest('.custom-select-menu')) {
      document.querySelectorAll('.custom-select-menu').forEach(m => m.classList.add('hidden'))
      document.querySelectorAll('[id$="-btn"][aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'))
    }
  })
}
