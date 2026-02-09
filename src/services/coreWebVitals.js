/**
 * Core Web Vitals Service
 * Mesure et reporte les metriques de performance Google
 *
 * Metriques principales:
 * - LCP (Largest Contentful Paint): Temps de rendu du plus grand element visible (<2.5s = bon)
 * - FID (First Input Delay): Delai avant premiere interaction (<100ms = bon)
 * - CLS (Cumulative Layout Shift): Stabilite visuelle (<0.1 = bon)
 * - FCP (First Contentful Paint): Premier rendu de contenu (<1.8s = bon)
 * - TTFB (Time To First Byte): Temps de reponse serveur (<800ms = bon)
 * - INP (Interaction to Next Paint): Reactivite aux interactions (<200ms = bon)
 *
 * @see https://web.dev/vitals/
 */

// Seuils de performance (en ms sauf CLS qui est un score)
export const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  FID: { good: 100, needsImprovement: 300 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 },
}

// Stockage des metriques
let metrics = {
  LCP: null,
  FID: null,
  CLS: null,
  FCP: null,
  TTFB: null,
  INP: null,
}

// Observers actifs
let observers = {
  lcp: null,
  fid: null,
  cls: null,
  inp: null,
}

// Callbacks pour les metriques
let onMetricCallbacks = []

// CLS accumule les valeurs
let clsValue = 0
let clsEntries = []

// INP tracks all interactions
let inpEntries = []

/**
 * Initialise la collecte des Core Web Vitals
 */
export function initCoreWebVitals(options = {}) {
  const { reportToAnalytics = true, onMetric = null } = options

  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    console.warn('[CoreWebVitals] PerformanceObserver not supported')
    return false
  }

  try {
    if (onMetric && typeof onMetric === 'function') {
      onMetricCallbacks.push(onMetric)
    }

    measureTTFB()
    measureFCP()
    observeLCP()
    observeFID()
    observeCLS()
    observeINP()

    if (reportToAnalytics) {
      setupReporting()
    }

    console.log('[CoreWebVitals] Initialized successfully')
    return true
  } catch (error) {
    console.error('[CoreWebVitals] Initialization failed:', error)
    return false
  }
}

function measureTTFB() {
  try {
    const navEntry = performance.getEntriesByType('navigation')[0]
    if (navEntry) {
      const ttfb = navEntry.responseStart - navEntry.requestStart
      if (ttfb >= 0) {
        setMetric('TTFB', ttfb)
      }
    }
  } catch (error) {
    console.warn('[CoreWebVitals] TTFB measurement failed:', error)
  }
}

function measureFCP() {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') {
          setMetric('FCP', entry.startTime)
          observer.disconnect()
        }
      }
    })
    observer.observe({ type: 'paint', buffered: true })
  } catch (error) {
    console.warn('[CoreWebVitals] FCP measurement failed:', error)
  }
}

function observeLCP() {
  try {
    observers.lcp = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      if (lastEntry) {
        setMetric('LCP', lastEntry.startTime)
      }
    })
    observers.lcp.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch (error) {
    console.warn('[CoreWebVitals] LCP observation failed:', error)
  }
}

function observeFID() {
  try {
    observers.fid = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      if (entries.length > 0 && metrics.FID === null) {
        const firstInput = entries[0]
        const fid = firstInput.processingStart - firstInput.startTime
        setMetric('FID', fid)
        observers.fid.disconnect()
      }
    })
    observers.fid.observe({ type: 'first-input', buffered: true })
  } catch (error) {
    console.warn('[CoreWebVitals] FID observation failed:', error)
  }
}

function observeCLS() {
  try {
    observers.cls = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      for (const entry of entries) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
          clsEntries.push(entry)
          setMetric('CLS', clsValue)
        }
      }
    })
    observers.cls.observe({ type: 'layout-shift', buffered: true })
  } catch (error) {
    console.warn('[CoreWebVitals] CLS observation failed:', error)
  }
}

function observeINP() {
  try {
    observers.inp = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      for (const entry of entries) {
        const duration = entry.duration
        inpEntries.push(duration)
        if (inpEntries.length > 0) {
          const sorted = [...inpEntries].sort((a, b) => a - b)
          const p98Index = Math.floor(sorted.length * 0.98)
          const inp = sorted[Math.min(p98Index, sorted.length - 1)]
          setMetric('INP', inp)
        }
      }
    })
    observers.inp.observe({ type: 'event', buffered: true, durationThreshold: 16 })
  } catch (error) {
    console.warn('[CoreWebVitals] INP observation not supported')
  }
}

function setMetric(name, value) {
  const roundedValue = name === 'CLS' ? Math.round(value * 1000) / 1000 : Math.round(value)
  metrics[name] = roundedValue
  const rating = getRating(name, roundedValue)

  if (import.meta.env?.DEV) {
    const unit = name === 'CLS' ? '' : 'ms'
    console.log('[CoreWebVitals] ' + name + ': ' + roundedValue + unit + ' (' + rating + ')')
  }

  const metricData = { name, value: roundedValue, rating, timestamp: Date.now() }
  onMetricCallbacks.forEach((callback) => {
    try {
      callback(metricData)
    } catch (error) {
      console.warn('[CoreWebVitals] Callback error:', error)
    }
  })
}

function setupReporting() {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') reportMetrics()
  })
  window.addEventListener('pagehide', reportMetrics)
}

function reportMetrics() {
  try {
    import('./analytics.js').then(({ trackEvent }) => {
      const data = getMetrics()
      if (Object.values(data).some((v) => v !== null)) {
        trackEvent('web_vitals', { ...data, overall_rating: getOverallRating(), page_url: window.location.pathname })
      }
    }).catch(() => {})
  } catch {
    // Ignore errors
  }
}

export function getRating(name, value) {
  const threshold = THRESHOLDS[name]
  if (!threshold || value === null || value === undefined) return 'unknown'
  if (value <= threshold.good) return 'good'
  if (value <= threshold.needsImprovement) return 'needs-improvement'
  return 'poor'
}

export function getMetrics() {
  return { ...metrics }
}

export function getMetric(name) {
  return metrics[name] ?? null
}

export function getOverallRating() {
  const coreMetrics = ['LCP', 'FID', 'CLS']
  const ratings = coreMetrics.map((name) => {
    const value = metrics[name]
    return value !== null ? getRating(name, value) : null
  }).filter(Boolean)
  if (ratings.length === 0) return 'unknown'
  if (ratings.includes('poor')) return 'poor'
  if (ratings.includes('needs-improvement')) return 'needs-improvement'
  return 'good'
}

export function isMetricGood(name) {
  const value = metrics[name]
  if (value === null) return false
  return getRating(name, value) === 'good'
}

export function areAllVitalsGood() {
  return getOverallRating() === 'good'
}

export function getPerformanceReport() {
  const report = { metrics: {}, overallRating: getOverallRating(), recommendations: [], timestamp: new Date().toISOString() }
  Object.keys(metrics).forEach((name) => {
    const value = metrics[name]
    const rating = value !== null ? getRating(name, value) : 'not-measured'
    report.metrics[name] = { value, rating, unit: name === 'CLS' ? 'score' : 'ms', threshold: THRESHOLDS[name] || null }
    if (rating === 'poor' || rating === 'needs-improvement') {
      report.recommendations.push(getRecommendation(name, value, rating))
    }
  })
  return report
}

function getRecommendation(name, value, rating) {
  const recommendations = {
    LCP: { title: 'Largest Contentful Paint trop lent', tips: ['Optimiser les images (WebP, lazy loading)', 'Precharger les ressources critiques', 'Utiliser un CDN pour les assets', 'Reduire le CSS bloquant le rendu'] },
    FID: { title: 'First Input Delay trop long', tips: ['Reduire le JavaScript execute au chargement', 'Diviser le code en chunks plus petits', 'Utiliser requestIdleCallback pour les taches non-critiques', 'Optimiser les event handlers'] },
    CLS: { title: 'Cumulative Layout Shift trop eleve', tips: ['Definir les dimensions des images et videos', 'Reserver espace pour les publicites/embeds', 'Eviter inserer du contenu au-dessus du contenu existant', 'Utiliser transform au lieu de modifier la geometrie'] },
    FCP: { title: 'First Contentful Paint trop lent', tips: ['Reduire le temps de reponse serveur', 'Eliminer les ressources bloquant le rendu', 'Precharger les fonts et CSS critiques', 'Utiliser le cache navigateur'] },
    TTFB: { title: 'Time To First Byte trop long', tips: ['Optimiser le backend/API', 'Utiliser un CDN', 'Activer la compression (gzip/brotli)', 'Optimiser les requetes base de donnees'] },
    INP: { title: 'Interaction to Next Paint trop lent', tips: ['Reduire la complexite des event handlers', 'Utiliser requestAnimationFrame pour les animations', 'Eviter les reflows forces', 'Debouncer les interactions frequentes'] },
  }
  const rec = recommendations[name] || { title: 'Metrique a ameliorer', tips: [] }
  return { metric: name, value, rating, ...rec }
}

export function onMetric(callback) {
  if (typeof callback !== 'function') throw new Error('onMetric callback must be a function')
  onMetricCallbacks.push(callback)
  return () => {
    const index = onMetricCallbacks.indexOf(callback)
    if (index > -1) onMetricCallbacks.splice(index, 1)
  }
}

export function stopCollecting() {
  Object.values(observers).forEach((observer) => {
    if (observer) {
      try {
        observer.disconnect()
      } catch {
        // Ignore errors
      }
    }
  })
  observers = { lcp: null, fid: null, cls: null, inp: null }
  console.log('[CoreWebVitals] Stopped collecting')
}

export function resetMetrics() {
  metrics = { LCP: null, FID: null, CLS: null, FCP: null, TTFB: null, INP: null }
  clsValue = 0
  clsEntries = []
  inpEntries = []
}

export function renderMetricBadge(name) {
  const value = metrics[name]
  const rating = value !== null ? getRating(name, value) : 'unknown'
  const colors = { good: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', 'needs-improvement': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', poor: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', unknown: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' }
  const labels = { good: 'Bon', 'needs-improvement': 'A ameliorer', poor: 'Mauvais', unknown: 'Non mesure' }
  const displayValue = value !== null ? (name === 'CLS' ? value.toFixed(3) : value + 'ms') : '-'
  return '<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full ' + colors[rating] + '" role="status" aria-label="' + name + ': ' + displayValue + ' - ' + labels[rating] + '"><span class="font-medium">' + name + '</span><span class="font-mono">' + displayValue + '</span><span class="text-xs opacity-75">' + labels[rating] + '</span></div>'
}

export function renderPerformanceDashboard() {
  const report = getPerformanceReport()
  const overallColors = { good: 'border-green-500 bg-green-50 dark:bg-green-900/20', 'needs-improvement': 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20', poor: 'border-red-500 bg-red-50 dark:bg-red-900/20', unknown: 'border-gray-300 bg-gray-50 dark:bg-gray-800' }
  const overallLabels = { good: 'Excellentes performances', 'needs-improvement': 'Performances a ameliorer', poor: 'Performances insuffisantes', unknown: 'En cours de mesure...' }
  const metricsHtml = Object.entries(report.metrics).map(([name]) => renderMetricBadge(name)).join('')
  let recommendationsHtml = ''
  if (report.recommendations.length > 0) {
    const recsContent = report.recommendations.map((rec) => {
      const tipsHtml = rec.tips.map((tip) => '<li>' + tip + '</li>').join('')
      return '<div class="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm"><h5 class="font-medium text-gray-800 dark:text-gray-200">' + rec.title + '</h5><ul class="mt-2 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">' + tipsHtml + '</ul></div>'
    }).join('')
    recommendationsHtml = '<div class="mt-4 space-y-3"><h4 class="font-semibold text-gray-700 dark:text-gray-300">Recommandations</h4>' + recsContent + '</div>'
  }
  const ratingClass = report.overallRating === 'good' ? 'bg-green-500 text-white' : report.overallRating === 'needs-improvement' ? 'bg-yellow-500 text-white' : report.overallRating === 'poor' ? 'bg-red-500 text-white' : 'bg-gray-400 text-white'
  return '<div class="p-4 rounded-xl border-2 ' + overallColors[report.overallRating] + '" role="region" aria-label="Tableau de bord des performances"><div class="flex items-center justify-between mb-4"><h3 class="text-lg font-bold text-gray-800 dark:text-white">Core Web Vitals</h3><span class="px-3 py-1 rounded-full text-sm font-medium ' + ratingClass + '">' + overallLabels[report.overallRating] + '</span></div><div class="flex flex-wrap gap-2">' + metricsHtml + '</div>' + recommendationsHtml + '<p class="mt-4 text-xs text-gray-500 dark:text-gray-400">Mesure a ' + new Date(report.timestamp).toLocaleTimeString('fr-FR') + '</p></div>'
}

export function simulateMetrics(simulatedMetrics) {
  Object.entries(simulatedMetrics).forEach(([name, value]) => {
    if (name in metrics) setMetric(name, value)
  })
}

export default {
  initCoreWebVitals, getMetrics, getMetric, getRating, getOverallRating, isMetricGood, areAllVitalsGood,
  getPerformanceReport, onMetric, stopCollecting, resetMetrics, renderMetricBadge, renderPerformanceDashboard,
  simulateMetrics, THRESHOLDS,
}
