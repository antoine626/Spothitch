/**
 * Core Web Vitals - Real User Monitoring (RUM)
 * Measures LCP, FID, CLS, TTFB, INP using PerformanceObserver
 * Lightweight: no external dependencies
 */

const metrics = {}
const callbacks = []

/**
 * Report a metric value
 */
function reportMetric(name, value, rating) {
  metrics[name] = { value, rating, timestamp: Date.now() }
  callbacks.forEach(cb => cb(name, value, rating))

  // Log in dev mode
  if (import.meta.env?.DEV) {
    const color = rating === 'good' ? '#0f0' : rating === 'needs-improvement' ? '#ff0' : '#f00'
    console.log(`%c[Web Vital] ${name}: ${Math.round(value)}ms (${rating})`, `color: ${color}`)
  }
}

/**
 * Rate a metric value against thresholds
 */
function rate(value, good, poor) {
  if (value <= good) return 'good'
  if (value <= poor) return 'needs-improvement'
  return 'poor'
}

/**
 * Observe Largest Contentful Paint (LCP)
 * Good: ≤2500ms | Poor: >4000ms
 */
function observeLCP() {
  if (typeof PerformanceObserver === 'undefined') return

  try {
    const po = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1]
      if (last) {
        reportMetric('LCP', last.startTime, rate(last.startTime, 2500, 4000))
      }
    })
    po.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch (e) { /* Browser doesn't support this entry type */ }
}

/**
 * Observe First Input Delay (FID)
 * Good: ≤100ms | Poor: >300ms
 */
function observeFID() {
  if (typeof PerformanceObserver === 'undefined') return

  try {
    const po = new PerformanceObserver((list) => {
      const entry = list.getEntries()[0]
      if (entry) {
        const fid = entry.processingStart - entry.startTime
        reportMetric('FID', fid, rate(fid, 100, 300))
      }
    })
    po.observe({ type: 'first-input', buffered: true })
  } catch (e) { /* Browser doesn't support */ }
}

/**
 * Observe Cumulative Layout Shift (CLS)
 * Good: ≤0.1 | Poor: >0.25
 */
function observeCLS() {
  if (typeof PerformanceObserver === 'undefined') return

  let clsValue = 0

  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      }
      reportMetric('CLS', clsValue * 1000, rate(clsValue, 0.1, 0.25))
    })
    po.observe({ type: 'layout-shift', buffered: true })
  } catch (e) { /* Browser doesn't support */ }
}

/**
 * Observe Interaction to Next Paint (INP)
 * Good: ≤200ms | Poor: >500ms
 */
function observeINP() {
  if (typeof PerformanceObserver === 'undefined') return

  const interactions = []

  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.interactionId) {
          interactions.push(entry.duration)
          // INP = p98 of interactions
          interactions.sort((a, b) => b - a)
          const p98Index = Math.floor(interactions.length * 0.02)
          const inp = interactions[p98Index] || interactions[0]
          reportMetric('INP', inp, rate(inp, 200, 500))
        }
      }
    })
    po.observe({ type: 'event', buffered: true, durationThreshold: 16 })
  } catch (e) { /* Browser doesn't support */ }
}

/**
 * Measure Time To First Byte (TTFB)
 * Good: ≤800ms | Poor: >1800ms
 */
function measureTTFB() {
  try {
    const nav = performance.getEntriesByType('navigation')[0]
    if (nav) {
      const ttfb = nav.responseStart - nav.requestStart
      reportMetric('TTFB', ttfb, rate(ttfb, 800, 1800))
    }
  } catch (e) { /* fallback */ }
}

/**
 * Initialize all Web Vitals observers
 * Call once on app startup
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return

  // Defer to not impact startup
  requestAnimationFrame(() => {
    observeLCP()
    observeFID()
    observeCLS()
    observeINP()
    measureTTFB()
  })
}

/**
 * Get all collected metrics
 * @returns {Object} { LCP, FID, CLS, INP, TTFB }
 */
export function getMetrics() {
  return { ...metrics }
}

/**
 * Subscribe to metric updates
 * @param {Function} callback - (name, value, rating) => void
 * @returns {Function} unsubscribe
 */
export function onMetric(callback) {
  callbacks.push(callback)
  return () => {
    const idx = callbacks.indexOf(callback)
    if (idx >= 0) callbacks.splice(idx, 1)
  }
}

/**
 * Get a summary string for debugging
 * @returns {string}
 */
export function getVitalsSummary() {
  const m = metrics
  const parts = []
  if (m.LCP) parts.push(`LCP:${Math.round(m.LCP.value)}ms`)
  if (m.FID) parts.push(`FID:${Math.round(m.FID.value)}ms`)
  if (m.CLS) parts.push(`CLS:${(m.CLS.value / 1000).toFixed(3)}`)
  if (m.INP) parts.push(`INP:${Math.round(m.INP.value)}ms`)
  if (m.TTFB) parts.push(`TTFB:${Math.round(m.TTFB.value)}ms`)
  return parts.join(' | ') || 'No metrics yet'
}

/**
 * Send metrics to analytics endpoint (optional)
 * @param {string} endpoint - URL to POST metrics to
 */
export async function sendMetrics(endpoint) {
  if (Object.keys(metrics).length === 0) return

  try {
    const body = JSON.stringify({
      url: window.location.href,
      metrics,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connection: navigator.connection?.effectiveType || 'unknown',
    })

    // Use sendBeacon for reliability on page unload
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body)
    } else {
      await fetch(endpoint, { method: 'POST', body, keepalive: true })
    }
  } catch (e) {
    // Silent fail - analytics should never break the app
  }
}

export default { initWebVitals, getMetrics, onMetric, getVitalsSummary, sendMetrics }
