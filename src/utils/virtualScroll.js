/**
 * Virtual Scrolling Utility
 * Only renders items visible in the viewport + buffer
 * Handles lists of 1000+ items smoothly
 */

const BUFFER_SIZE = 5 // Extra items above/below viewport

/**
 * Initialize virtual scrolling on a container
 * @param {Object} config
 * @param {string} config.containerId - ID of the scroll container
 * @param {Array} config.items - Full array of items
 * @param {Function} config.renderItem - (item, index) => HTML string
 * @param {number} config.itemHeight - Estimated item height in px
 * @param {string} [config.emptyMessage] - Message when no items
 * @returns {Object} Controller with update() and destroy()
 */
export function createVirtualScroller(config) {
  const { containerId, items, renderItem, itemHeight = 120, emptyMessage = '' } = config

  let currentItems = items
  let scrollHandler = null
  let resizeObserver = null

  function getContainer() {
    return document.getElementById(containerId)
  }

  function render() {
    const container = getContainer()
    if (!container) return

    if (currentItems.length === 0) {
      container.innerHTML = emptyMessage
      return
    }

    const totalHeight = currentItems.length * itemHeight
    const scrollTop = container.scrollTop
    const viewportHeight = container.clientHeight

    // Calculate visible range
    const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - BUFFER_SIZE)
    const endIdx = Math.min(
      currentItems.length,
      Math.ceil((scrollTop + viewportHeight) / itemHeight) + BUFFER_SIZE
    )

    const visibleItems = currentItems.slice(startIdx, endIdx)
    const offsetTop = startIdx * itemHeight
    const offsetBottom = totalHeight - endIdx * itemHeight

    // Render with spacers
    container.innerHTML = `
      <div style="height:${offsetTop}px" aria-hidden="true"></div>
      ${visibleItems.map((item, i) => renderItem(item, startIdx + i)).join('')}
      <div style="height:${Math.max(0, offsetBottom)}px" aria-hidden="true"></div>
    `
  }

  function init() {
    const container = getContainer()
    if (!container) return

    // Make container scrollable
    container.style.overflowY = 'auto'

    // Debounced scroll handler
    let ticking = false
    scrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          render()
          ticking = false
        })
        ticking = true
      }
    }

    container.addEventListener('scroll', scrollHandler, { passive: true })

    // Re-render on resize
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => render())
      resizeObserver.observe(container)
    }

    render()
  }

  function update(newItems) {
    currentItems = newItems
    render()
  }

  function destroy() {
    const container = getContainer()
    if (container && scrollHandler) {
      container.removeEventListener('scroll', scrollHandler)
    }
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
  }

  // Auto-init when DOM is ready
  if (document.getElementById(containerId)) {
    init()
  } else {
    requestAnimationFrame(init)
  }

  return { update, destroy, render: init }
}

export default { createVirtualScroller }
