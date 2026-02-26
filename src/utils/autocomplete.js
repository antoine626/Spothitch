/**
 * Autocomplete Component
 * Reusable debounced autocomplete with keyboard nav, offline fallback
 */

import { t } from '../i18n/index.js'
import { icon } from './icons.js'

/**
 * Initialize autocomplete on an input element
 * @param {Object} options
 * @param {string} options.inputId - Input element ID
 * @param {Function} options.searchFn - Async search function (query) => results[]
 * @param {Function} options.onSelect - Callback when item selected (item) => void
 * @param {Function} [options.renderItem] - Custom render (item) => html string
 * @param {string} [options.dropdownId] - Custom dropdown container ID
 * @param {number} [options.debounceMs=200] - Debounce delay
 * @param {number} [options.minChars=2] - Min chars before searching
 * @param {boolean} [options.forceSelection=false] - If true, input is invalid unless item selected from list
 * @param {Function} [options.onClear] - Callback when user clears their selection
 * @returns {{ destroy: Function, isValid: Function }} Cleanup handle + validation
 */
export function initAutocomplete({
  inputId,
  searchFn,
  onSelect,
  renderItem,
  dropdownId,
  debounceMs = 200,
  minChars = 2,
  forceSelection = false,
  onClear,
}) {
  const input = document.getElementById(inputId)
  if (!input) return { destroy() {}, isValid() { return true } }

  let timer = null
  let activeIndex = -1
  let results = []
  let dropdown = null
  let selectedItem = null // Track if user picked from list

  // Create dropdown container
  function getDropdown() {
    if (dropdown) return dropdown
    const id = dropdownId || `${inputId}-dropdown`
    dropdown = document.getElementById(id)
    if (!dropdown) {
      dropdown = document.createElement('div')
      dropdown.id = id
      dropdown.className = 'autocomplete-dropdown hidden'
      dropdown.setAttribute('role', 'listbox')
      dropdown.setAttribute('aria-label', t('suggestions') || 'Suggestions')
      input.parentElement.style.position = 'relative'
      input.parentElement.appendChild(dropdown)
    }
    return dropdown
  }

  function showDropdown(items) {
    results = items
    activeIndex = -1
    const dd = getDropdown()

    if (!items.length) {
      dd.classList.add('hidden')
      return
    }

    const defaultRender = (item) => `
      <div class="font-medium text-sm">${escapeHTML(item.name || item.fullName || '')}</div>
      ${item.fullName && item.fullName !== item.name ? `<div class="text-xs text-slate-400 truncate">${escapeHTML(item.fullName)}</div>` : ''}
    `

    dd.innerHTML = items.map((item, i) => `
      <div class="autocomplete-item" data-index="${i}" role="option">
        ${(renderItem || defaultRender)(item)}
      </div>
    `).join('')

    dd.classList.remove('hidden')

    // Click handlers on items
    dd.querySelectorAll('.autocomplete-item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault()
        const idx = parseInt(el.dataset.index, 10)
        selectItem(idx)
      })
    })
  }

  function hideDropdown() {
    if (dropdown) dropdown.classList.add('hidden')
    results = []
    activeIndex = -1
  }

  function selectItem(index) {
    if (index >= 0 && index < results.length) {
      const item = results[index]
      input.value = item.name || item.fullName || ''
      selectedItem = item
      hideDropdown()
      // Remove invalid state
      input.classList.remove('border-red-500')
      onSelect(item)
    }
  }

  function setActive(index) {
    if (!dropdown) return
    const items = dropdown.querySelectorAll('.autocomplete-item')
    items.forEach(el => el.classList.remove('active'))
    if (index >= 0 && index < items.length) {
      items[index].classList.add('active')
      items[index].scrollIntoView({ block: 'nearest' })
    }
    activeIndex = index
  }

  function showLoading() {
    const dd = getDropdown()
    dd.innerHTML = `
      <div class="autocomplete-item opacity-60">
        ${icon('loader-circle', 'w-4 h-4 animate-spin inline-block mr-2')}
        ${t('searching') || 'Recherche...'}
      </div>
    `
    dd.classList.remove('hidden')
  }

  // Event handlers
  function onInput() {
    const query = input.value.trim()
    clearTimeout(timer)

    // If forceSelection and user types (modifying selected value), invalidate
    if (forceSelection && selectedItem) {
      const selectedName = selectedItem.name || selectedItem.fullName || ''
      if (query !== selectedName) {
        selectedItem = null
        if (onClear) onClear()
      }
    }

    // If field is cleared
    if (!query && forceSelection) {
      selectedItem = null
      if (onClear) onClear()
    }

    if (query.length < minChars) {
      hideDropdown()
      return
    }

    timer = setTimeout(async () => {
      // Check if we're offline
      if (!navigator.onLine) {
        hideDropdown()
        return
      }

      showLoading()

      try {
        const items = await searchFn(query)
        // Only show if input still has same value
        if (input.value.trim() === query) {
          showDropdown(items)
        }
      } catch {
        hideDropdown()
      }
    }, debounceMs)
  }

  function onKeydown(e) {
    if (!dropdown || dropdown.classList.contains('hidden')) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(Math.min(activeIndex + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(Math.max(activeIndex - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0) {
        selectItem(activeIndex)
      }
    } else if (e.key === 'Escape') {
      hideDropdown()
    }
  }

  function onBlur() {
    // Delay to allow click on dropdown items
    setTimeout(() => {
      hideDropdown()
      // If forceSelection and nothing was selected, mark invalid
      if (forceSelection && !selectedItem && input.value.trim()) {
        input.classList.add('border-red-500')
      }
    }, 200)
  }

  // Attach events
  input.addEventListener('input', onInput)
  input.addEventListener('keydown', onKeydown)
  input.addEventListener('blur', onBlur)
  input.setAttribute('autocomplete', 'off')
  input.setAttribute('role', 'combobox')
  input.setAttribute('aria-autocomplete', 'list')

  return {
    destroy() {
      clearTimeout(timer)
      input.removeEventListener('input', onInput)
      input.removeEventListener('keydown', onKeydown)
      input.removeEventListener('blur', onBlur)
      if (dropdown) dropdown.remove()
    },
    isValid() {
      if (!forceSelection) return true
      return !!selectedItem
    },
    getSelectedItem() {
      return selectedItem
    },
    setSelectedItem(item) {
      selectedItem = item
      if (item) {
        input.value = item.name || item.fullName || ''
        input.classList.remove('border-red-500')
      }
    },
  }
}

function escapeHTML(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export default { initAutocomplete }
