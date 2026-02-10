/**
 * Spot Worker Client
 * Clean API to communicate with the spot filter Web Worker
 * Falls back to main-thread execution if Workers unavailable
 */

let worker = null
let requestId = 0
const pending = new Map()

/**
 * Initialize the worker
 */
function getWorker() {
  if (worker) return worker

  if (typeof Worker === 'undefined') return null

  try {
    worker = new Worker(
      new URL('../workers/spotFilter.worker.js', import.meta.url),
      { type: 'module' }
    )

    worker.onmessage = (e) => {
      const { id, results, count, duration } = e.data
      const resolver = pending.get(id)
      if (resolver) {
        pending.delete(id)
        resolver({ results, count, duration })
      }
    }

    worker.onerror = (e) => {
      console.error('[SpotWorker] Error:', e.message)
      // Reject all pending
      for (const [id, resolver] of pending) {
        resolver({ results: [], error: e.message })
      }
      pending.clear()
    }

    return worker
  } catch (e) {
    console.warn('[SpotWorker] Failed to create worker:', e)
    return null
  }
}

/**
 * Send a message to the worker and get a promise back
 */
function postMessage(data) {
  return new Promise((resolve) => {
    const w = getWorker()
    const id = ++requestId

    if (!w) {
      // Fallback: can't use worker, resolve empty
      resolve({ results: [], error: 'Worker unavailable' })
      return
    }

    // Timeout after 10s
    const timeout = setTimeout(() => {
      pending.delete(id)
      resolve({ results: [], error: 'Worker timeout' })
    }, 10000)

    pending.set(id, (result) => {
      clearTimeout(timeout)
      resolve(result)
    })

    w.postMessage({ ...data, id })
  })
}

/**
 * Filter spots in the worker thread
 * @param {Array} spots - All spots
 * @param {Object} filters - { country, minRating, maxWait, verifiedOnly, query, bounds, userLocation, maxDistance, amenities }
 * @returns {Promise<{results: Array, count: number, duration: number}>}
 */
export async function filterSpots(spots, filters) {
  return postMessage({ type: 'filter', spots, filters })
}

/**
 * Sort spots in the worker thread
 * @param {Array} spots
 * @param {string} sortBy - 'rating' | 'distance' | 'recent' | 'wait' | 'name'
 * @param {Object} [userLocation] - { lat, lng }
 */
export async function sortSpots(spots, sortBy, userLocation) {
  return postMessage({ type: 'sort', spots, sortBy, userLocation })
}

/**
 * Filter AND sort in one worker call (most common use case)
 * @param {Array} spots
 * @param {Object} filters
 * @param {string} sortBy
 * @param {Object} [userLocation]
 */
export async function filterAndSort(spots, filters, sortBy, userLocation) {
  return postMessage({ type: 'filterAndSort', spots, filters, sortBy, userLocation })
}

/**
 * Calculate distances from user to all spots
 * @param {Array} spots
 * @param {Object} userLocation - { lat, lng }
 */
export async function calculateDistances(spots, userLocation) {
  return postMessage({ type: 'distances', spots, userLocation })
}

/**
 * Find spots along a route
 * @param {Array} spots
 * @param {Object} from - { lat, lng }
 * @param {Object} to - { lat, lng }
 * @param {number} [corridorWidth=50] - km
 */
export async function findSpotsAlongRoute(spots, from, to, corridorWidth = 50) {
  return postMessage({ type: 'route', spots, from, to, corridorWidth })
}

/**
 * Filter spots along an OSRM route polyline corridor
 * @param {Array} spots - All spots
 * @param {Array<[number,number]>} polyline - OSRM GeoJSON coordinates [lng, lat]
 * @param {number} [corridorKm=2] - Max distance from route in km
 * @returns {Promise<Array>} Spots within corridor, sorted by route position
 */
export async function filterRouteCorridor(spots, polyline, corridorKm = 2) {
  const { results } = await postMessage({ type: 'routeCorridor', spots, polyline, corridorKm })
  return results || []
}

/**
 * Cluster spots for map display
 * @param {Array} spots
 * @param {number} zoom - Map zoom level
 */
export async function clusterSpots(spots, zoom) {
  return postMessage({ type: 'cluster', spots, zoom })
}

/**
 * Destroy the worker
 */
export function destroyWorker() {
  if (worker) {
    worker.terminate()
    worker = null
  }
  pending.clear()
}

export default {
  filterSpots,
  sortSpots,
  filterAndSort,
  calculateDistances,
  findSpotsAlongRoute,
  filterRouteCorridor,
  clusterSpots,
  destroyWorker,
}
