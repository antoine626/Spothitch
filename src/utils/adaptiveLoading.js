/**
 * Adaptive Loading Utility
 * Adjusts app behavior based on network conditions and device capabilities
 * Uses Network Information API + device memory detection
 */

/**
 * Get current network quality level
 * @returns {'high'|'medium'|'low'|'offline'}
 */
function getNetworkQuality() {
  if (!navigator.onLine) return 'offline'

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (!conn) return 'high' // Assume good if API unavailable

  // effectiveType: 'slow-2g', '2g', '3g', '4g'
  const type = conn.effectiveType
  if (type === '4g') return 'high'
  if (type === '3g') return 'medium'
  return 'low' // 2g or slow-2g
}

/**
 * Get device capability level
 * @returns {'high'|'medium'|'low'}
 */
function getDeviceCapability() {
  const memory = navigator.deviceMemory // GB (Chrome only)
  const cores = navigator.hardwareConcurrency || 2

  if (memory && memory <= 2) return 'low'
  if (memory && memory <= 4) return 'medium'
  if (cores <= 2) return 'low'
  if (cores <= 4) return 'medium'
  return 'high'
}

/**
 * Check if data saver mode is active
 * @returns {boolean}
 */
function isDataSaverEnabled() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  return conn?.saveData === true
}

/**
 * Get recommended image quality based on conditions
 * @returns {'high'|'medium'|'low'|'none'}
 */
function getImageQuality() {
  if (isDataSaverEnabled()) return 'low'

  const network = getNetworkQuality()
  if (network === 'offline') return 'none'
  if (network === 'low') return 'low'
  if (network === 'medium') return 'medium'
  return 'high'
}

/**
 * Get recommended number of items to load at once
 * @param {number} [defaultCount=20]
 * @returns {number}
 */
function getPageSize(defaultCount = 20) {
  const network = getNetworkQuality()
  const device = getDeviceCapability()

  if (network === 'low' || device === 'low') return Math.ceil(defaultCount / 2)
  if (network === 'medium' || device === 'medium') return defaultCount
  return Math.floor(defaultCount * 1.5)
}

/**
 * Listen for network quality changes
 * @param {Function} callback - (quality: string) => void
 * @returns {Function} cleanup
 */
function onNetworkChange(callback) {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (!conn) return () => {}

  const handler = () => callback(getNetworkQuality())
  conn.addEventListener('change', handler)
  return () => conn.removeEventListener('change', handler)
}

/**
 * Get a full adaptive config object
 * @returns {Object} Configuration based on current conditions
 */
function getAdaptiveConfig() {
  return {
    network: getNetworkQuality(),
    device: getDeviceCapability(),
    dataSaver: isDataSaverEnabled(),
    imageQuality: getImageQuality(),
    pageSize: getPageSize(),
  }
}

export default {
  getNetworkQuality,
  getDeviceCapability,
  getImageQuality,
  getPageSize,
  onNetworkChange,
  getAdaptiveConfig,
}
