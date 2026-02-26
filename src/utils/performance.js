/**
 * Performance utilities - debounce, throttle
 */

const timers = {}

/**
 * Debounce a function call by key
 * @param {string} key - Unique identifier for this debounce
 * @param {Function} fn - Function to call
 * @param {number} delay - Delay in ms (default 300)
 */
export function debounce(key, fn, delay = 300) {
  if (timers[key]) clearTimeout(timers[key])
  timers[key] = setTimeout(() => {
    delete timers[key]
    fn()
  }, delay)
}

/**
 * Throttle a function call by key
 * @param {string} key - Unique identifier for this throttle
 * @param {Function} fn - Function to call
 * @param {number} interval - Minimum interval in ms (default 200)
 */
function throttle(key, fn, interval = 200) {
  if (timers[key]) return
  fn()
  timers[key] = setTimeout(() => {
    delete timers[key]
  }, interval)
}

/**
 * Cancel a pending debounce/throttle by key
 */
function cancelDebounce(key) {
  if (timers[key]) {
    clearTimeout(timers[key])
    delete timers[key]
  }
}

export default { debounce, throttle, cancelDebounce }
