/**
 * Tests for Core Web Vitals Service
 * @see src/services/coreWebVitals.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  THRESHOLDS,
  initCoreWebVitals,
  getRating,
  getMetrics,
  getMetric,
  getOverallRating,
  isMetricGood,
  areAllVitalsGood,
  getPerformanceReport,
  onMetric,
  stopCollecting,
  resetMetrics,
  renderMetricBadge,
  renderPerformanceDashboard,
  simulateMetrics,
} from '../src/services/coreWebVitals.js'

// Mock PerformanceObserver
class MockPerformanceObserver {
  constructor(callback) {
    this.callback = callback
    this.observing = false
  }
  observe() {
    this.observing = true
  }
  disconnect() {
    this.observing = false
  }
}

// Mock performance API
const mockPerformance = {
  getEntriesByType: vi.fn(() => []),
}

describe('Core Web Vitals Service', () => {
  beforeEach(() => {
    // Reset metrics before each test
    resetMetrics()
    vi.clearAllMocks()

    // Setup global mocks
    global.window = {
      PerformanceObserver: MockPerformanceObserver,
      addEventListener: vi.fn(),
      location: { pathname: '/test' },
      matchMedia: vi.fn(() => ({ matches: false })),
    }
    global.performance = mockPerformance
    global.document = {
      visibilityState: 'visible',
    }
  })

  describe('THRESHOLDS', () => {
    it('should have correct LCP thresholds', () => {
      expect(THRESHOLDS.LCP.good).toBe(2500)
      expect(THRESHOLDS.LCP.needsImprovement).toBe(4000)
    })

    it('should have correct FID thresholds', () => {
      expect(THRESHOLDS.FID.good).toBe(100)
      expect(THRESHOLDS.FID.needsImprovement).toBe(300)
    })

    it('should have correct CLS thresholds', () => {
      expect(THRESHOLDS.CLS.good).toBe(0.1)
      expect(THRESHOLDS.CLS.needsImprovement).toBe(0.25)
    })

    it('should have correct FCP thresholds', () => {
      expect(THRESHOLDS.FCP.good).toBe(1800)
      expect(THRESHOLDS.FCP.needsImprovement).toBe(3000)
    })

    it('should have correct TTFB thresholds', () => {
      expect(THRESHOLDS.TTFB.good).toBe(800)
      expect(THRESHOLDS.TTFB.needsImprovement).toBe(1800)
    })

    it('should have correct INP thresholds', () => {
      expect(THRESHOLDS.INP.good).toBe(200)
      expect(THRESHOLDS.INP.needsImprovement).toBe(500)
    })

    it('should have all 6 metrics defined', () => {
      expect(Object.keys(THRESHOLDS)).toHaveLength(6)
      expect(THRESHOLDS).toHaveProperty('LCP')
      expect(THRESHOLDS).toHaveProperty('FID')
      expect(THRESHOLDS).toHaveProperty('CLS')
      expect(THRESHOLDS).toHaveProperty('FCP')
      expect(THRESHOLDS).toHaveProperty('TTFB')
      expect(THRESHOLDS).toHaveProperty('INP')
    })
  })

  describe('getRating()', () => {
    it('should return "good" for LCP <= 2500ms', () => {
      expect(getRating('LCP', 1000)).toBe('good')
      expect(getRating('LCP', 2500)).toBe('good')
    })

    it('should return "needs-improvement" for LCP between 2500ms and 4000ms', () => {
      expect(getRating('LCP', 2501)).toBe('needs-improvement')
      expect(getRating('LCP', 3500)).toBe('needs-improvement')
      expect(getRating('LCP', 4000)).toBe('needs-improvement')
    })

    it('should return "poor" for LCP > 4000ms', () => {
      expect(getRating('LCP', 4001)).toBe('poor')
      expect(getRating('LCP', 6000)).toBe('poor')
    })

    it('should return "good" for FID <= 100ms', () => {
      expect(getRating('FID', 50)).toBe('good')
      expect(getRating('FID', 100)).toBe('good')
    })

    it('should return "needs-improvement" for FID between 100ms and 300ms', () => {
      expect(getRating('FID', 150)).toBe('needs-improvement')
      expect(getRating('FID', 300)).toBe('needs-improvement')
    })

    it('should return "poor" for FID > 300ms', () => {
      expect(getRating('FID', 400)).toBe('poor')
    })

    it('should return "good" for CLS <= 0.1', () => {
      expect(getRating('CLS', 0.05)).toBe('good')
      expect(getRating('CLS', 0.1)).toBe('good')
    })

    it('should return "needs-improvement" for CLS between 0.1 and 0.25', () => {
      expect(getRating('CLS', 0.15)).toBe('needs-improvement')
      expect(getRating('CLS', 0.25)).toBe('needs-improvement')
    })

    it('should return "poor" for CLS > 0.25', () => {
      expect(getRating('CLS', 0.3)).toBe('poor')
      expect(getRating('CLS', 0.5)).toBe('poor')
    })

    it('should return "unknown" for null value', () => {
      expect(getRating('LCP', null)).toBe('unknown')
    })

    it('should return "unknown" for undefined value', () => {
      expect(getRating('LCP', undefined)).toBe('unknown')
    })

    it('should return "unknown" for unknown metric', () => {
      expect(getRating('UNKNOWN', 100)).toBe('unknown')
    })

    it('should handle edge case of 0', () => {
      expect(getRating('LCP', 0)).toBe('good')
      expect(getRating('FID', 0)).toBe('good')
      expect(getRating('CLS', 0)).toBe('good')
    })
  })

  describe('getMetrics()', () => {
    it('should return all metrics initially null', () => {
      const metrics = getMetrics()
      expect(metrics.LCP).toBeNull()
      expect(metrics.FID).toBeNull()
      expect(metrics.CLS).toBeNull()
      expect(metrics.FCP).toBeNull()
      expect(metrics.TTFB).toBeNull()
      expect(metrics.INP).toBeNull()
    })

    it('should return a copy, not the original object', () => {
      const metrics1 = getMetrics()
      const metrics2 = getMetrics()
      expect(metrics1).not.toBe(metrics2)
      expect(metrics1).toEqual(metrics2)
    })

    it('should return simulated metrics after simulateMetrics', () => {
      simulateMetrics({ LCP: 2000, FID: 50 })
      const metrics = getMetrics()
      expect(metrics.LCP).toBe(2000)
      expect(metrics.FID).toBe(50)
    })
  })

  describe('getMetric()', () => {
    it('should return null for unset metric', () => {
      expect(getMetric('LCP')).toBeNull()
    })

    it('should return metric value after simulation', () => {
      simulateMetrics({ LCP: 1500 })
      expect(getMetric('LCP')).toBe(1500)
    })

    it('should return null for unknown metric name', () => {
      expect(getMetric('UNKNOWN')).toBeNull()
    })
  })

  describe('getOverallRating()', () => {
    it('should return "unknown" when no metrics are set', () => {
      expect(getOverallRating()).toBe('unknown')
    })

    it('should return "good" when all core metrics are good', () => {
      simulateMetrics({ LCP: 2000, FID: 50, CLS: 0.05 })
      expect(getOverallRating()).toBe('good')
    })

    it('should return "poor" when any core metric is poor', () => {
      simulateMetrics({ LCP: 5000, FID: 50, CLS: 0.05 })
      expect(getOverallRating()).toBe('poor')
    })

    it('should return "needs-improvement" when any core metric needs improvement', () => {
      simulateMetrics({ LCP: 3000, FID: 50, CLS: 0.05 })
      expect(getOverallRating()).toBe('needs-improvement')
    })

    it('should prioritize "poor" over "needs-improvement"', () => {
      simulateMetrics({ LCP: 5000, FID: 200, CLS: 0.05 })
      expect(getOverallRating()).toBe('poor')
    })

    it('should only consider LCP, FID, CLS for overall rating', () => {
      simulateMetrics({ TTFB: 5000, FCP: 5000, INP: 1000 })
      expect(getOverallRating()).toBe('unknown')
    })

    it('should work with partial core metrics', () => {
      simulateMetrics({ LCP: 2000 })
      expect(getOverallRating()).toBe('good')
    })
  })

  describe('isMetricGood()', () => {
    it('should return false for unset metric', () => {
      expect(isMetricGood('LCP')).toBe(false)
    })

    it('should return true for good metric', () => {
      simulateMetrics({ LCP: 2000 })
      expect(isMetricGood('LCP')).toBe(true)
    })

    it('should return false for poor metric', () => {
      simulateMetrics({ LCP: 5000 })
      expect(isMetricGood('LCP')).toBe(false)
    })

    it('should return false for needs-improvement metric', () => {
      simulateMetrics({ LCP: 3000 })
      expect(isMetricGood('LCP')).toBe(false)
    })
  })

  describe('areAllVitalsGood()', () => {
    it('should return false when no metrics are set', () => {
      expect(areAllVitalsGood()).toBe(false)
    })

    it('should return true when all core metrics are good', () => {
      simulateMetrics({ LCP: 2000, FID: 50, CLS: 0.05 })
      expect(areAllVitalsGood()).toBe(true)
    })

    it('should return false when any core metric is not good', () => {
      simulateMetrics({ LCP: 2000, FID: 50, CLS: 0.2 })
      expect(areAllVitalsGood()).toBe(false)
    })
  })

  describe('getPerformanceReport()', () => {
    it('should return a report object with metrics', () => {
      const report = getPerformanceReport()
      expect(report).toHaveProperty('metrics')
      expect(report).toHaveProperty('overallRating')
      expect(report).toHaveProperty('recommendations')
      expect(report).toHaveProperty('timestamp')
    })

    it('should include all 6 metrics in report', () => {
      const report = getPerformanceReport()
      expect(Object.keys(report.metrics)).toHaveLength(6)
    })

    it('should include threshold for each metric', () => {
      const report = getPerformanceReport()
      Object.entries(report.metrics).forEach(([name, data]) => {
        expect(data).toHaveProperty('threshold')
        expect(data.threshold).toEqual(THRESHOLDS[name])
      })
    })

    it('should include unit for each metric', () => {
      const report = getPerformanceReport()
      expect(report.metrics.CLS.unit).toBe('score')
      expect(report.metrics.LCP.unit).toBe('ms')
      expect(report.metrics.FID.unit).toBe('ms')
    })

    it('should add recommendations for poor metrics', () => {
      simulateMetrics({ LCP: 5000 })
      const report = getPerformanceReport()
      expect(report.recommendations.length).toBeGreaterThan(0)
      expect(report.recommendations[0].metric).toBe('LCP')
      expect(report.recommendations[0].tips.length).toBeGreaterThan(0)
    })

    it('should add recommendations for needs-improvement metrics', () => {
      simulateMetrics({ FID: 200 })
      const report = getPerformanceReport()
      expect(report.recommendations.length).toBeGreaterThan(0)
    })

    it('should not add recommendations for good metrics', () => {
      simulateMetrics({ LCP: 2000, FID: 50, CLS: 0.05 })
      const report = getPerformanceReport()
      expect(report.recommendations.length).toBe(0)
    })

    it('should have valid timestamp', () => {
      const report = getPerformanceReport()
      expect(new Date(report.timestamp).getTime()).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('onMetric()', () => {
    it('should throw error for non-function callback', () => {
      expect(() => onMetric('not a function')).toThrow('onMetric callback must be a function')
      expect(() => onMetric(null)).toThrow('onMetric callback must be a function')
    })

    it('should accept function callback', () => {
      const callback = vi.fn()
      expect(() => onMetric(callback)).not.toThrow()
    })

    it('should return unsubscribe function', () => {
      const callback = vi.fn()
      const unsubscribe = onMetric(callback)
      expect(typeof unsubscribe).toBe('function')
    })

    it('should call callback when metric is simulated', () => {
      const callback = vi.fn()
      onMetric(callback)
      simulateMetrics({ LCP: 2000 })
      expect(callback).toHaveBeenCalled()
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        name: 'LCP',
        value: 2000,
        rating: 'good',
      }))
    })

    it('should unsubscribe when calling returned function', () => {
      const callback = vi.fn()
      const unsubscribe = onMetric(callback)
      unsubscribe()
      simulateMetrics({ FID: 50 })
      expect(callback).not.toHaveBeenCalled()
    })

    it('should support multiple callbacks', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      onMetric(callback1)
      onMetric(callback2)
      simulateMetrics({ CLS: 0.05 })
      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })
  })

  describe('resetMetrics()', () => {
    it('should reset all metrics to null', () => {
      simulateMetrics({ LCP: 2000, FID: 50, CLS: 0.05 })
      resetMetrics()
      const metrics = getMetrics()
      expect(metrics.LCP).toBeNull()
      expect(metrics.FID).toBeNull()
      expect(metrics.CLS).toBeNull()
    })

    it('should reset overall rating to unknown', () => {
      simulateMetrics({ LCP: 2000, FID: 50, CLS: 0.05 })
      resetMetrics()
      expect(getOverallRating()).toBe('unknown')
    })
  })

  describe('stopCollecting()', () => {
    it('should not throw when called', () => {
      expect(() => stopCollecting()).not.toThrow()
    })
  })

  describe('simulateMetrics()', () => {
    it('should set single metric', () => {
      simulateMetrics({ LCP: 1500 })
      expect(getMetric('LCP')).toBe(1500)
    })

    it('should set multiple metrics', () => {
      simulateMetrics({ LCP: 1500, FID: 75, CLS: 0.08 })
      expect(getMetric('LCP')).toBe(1500)
      expect(getMetric('FID')).toBe(75)
      expect(getMetric('CLS')).toBe(0.08)
    })

    it('should ignore invalid metric names', () => {
      simulateMetrics({ INVALID: 1000 })
      expect(getMetric('INVALID')).toBeNull()
    })

    it('should round ms metrics to integers', () => {
      simulateMetrics({ LCP: 1500.7 })
      expect(getMetric('LCP')).toBe(1501)
    })

    it('should keep CLS precision to 3 decimal places', () => {
      simulateMetrics({ CLS: 0.12345 })
      expect(getMetric('CLS')).toBe(0.123)
    })
  })

  describe('renderMetricBadge()', () => {
    it('should render badge with metric name', () => {
      const html = renderMetricBadge('LCP')
      expect(html).toContain('LCP')
    })

    it('should render "unknown" for unset metric', () => {
      const html = renderMetricBadge('LCP')
      expect(html).toContain('Non mesure')
      expect(html).toContain('-')
    })

    it('should render "good" badge for good metric', () => {
      simulateMetrics({ LCP: 2000 })
      const html = renderMetricBadge('LCP')
      expect(html).toContain('Bon')
      expect(html).toContain('2000ms')
      expect(html).toContain('bg-green')
    })

    it('should render "needs-improvement" badge', () => {
      simulateMetrics({ LCP: 3000 })
      const html = renderMetricBadge('LCP')
      expect(html).toContain('A ameliorer')
      expect(html).toContain('bg-yellow')
    })

    it('should render "poor" badge', () => {
      simulateMetrics({ LCP: 5000 })
      const html = renderMetricBadge('LCP')
      expect(html).toContain('Mauvais')
      expect(html).toContain('bg-red')
    })

    it('should render CLS without ms unit', () => {
      simulateMetrics({ CLS: 0.05 })
      const html = renderMetricBadge('CLS')
      expect(html).toContain('0.050')
      expect(html).not.toContain('0.050ms')
    })

    it('should include aria-label for accessibility', () => {
      simulateMetrics({ LCP: 2000 })
      const html = renderMetricBadge('LCP')
      expect(html).toContain('aria-label')
      expect(html).toContain('role="status"')
    })
  })

  describe('renderPerformanceDashboard()', () => {
    it('should render dashboard container', () => {
      const html = renderPerformanceDashboard()
      expect(html).toContain('Core Web Vitals')
      expect(html).toContain('role="region"')
    })

    it('should render all metrics', () => {
      const html = renderPerformanceDashboard()
      expect(html).toContain('LCP')
      expect(html).toContain('FID')
      expect(html).toContain('CLS')
      expect(html).toContain('FCP')
      expect(html).toContain('TTFB')
      expect(html).toContain('INP')
    })

    it('should render overall rating label', () => {
      const html = renderPerformanceDashboard()
      expect(html).toContain('En cours de mesure')
    })

    it('should render good overall rating', () => {
      simulateMetrics({ LCP: 2000, FID: 50, CLS: 0.05 })
      const html = renderPerformanceDashboard()
      expect(html).toContain('Excellentes performances')
      expect(html).toContain('bg-green-500')
    })

    it('should render needs-improvement overall rating', () => {
      simulateMetrics({ LCP: 3000, FID: 50, CLS: 0.05 })
      const html = renderPerformanceDashboard()
      expect(html).toContain('Performances a ameliorer')
      expect(html).toContain('bg-yellow-500')
    })

    it('should render poor overall rating', () => {
      simulateMetrics({ LCP: 5000, FID: 50, CLS: 0.05 })
      const html = renderPerformanceDashboard()
      expect(html).toContain('Performances insuffisantes')
      expect(html).toContain('bg-red-500')
    })

    it('should render recommendations for poor metrics', () => {
      simulateMetrics({ LCP: 5000 })
      const html = renderPerformanceDashboard()
      expect(html).toContain('Recommandations')
      expect(html).toContain('Largest Contentful Paint trop lent')
    })

    it('should not render recommendations for good metrics', () => {
      simulateMetrics({ LCP: 2000, FID: 50, CLS: 0.05 })
      const html = renderPerformanceDashboard()
      expect(html).not.toContain('Recommandations')
    })

    it('should include timestamp', () => {
      const html = renderPerformanceDashboard()
      expect(html).toContain('Mesure a')
    })
  })

  describe('initCoreWebVitals()', () => {
    it('should return false if window is undefined', () => {
      global.window = undefined
      expect(initCoreWebVitals()).toBe(false)
    })

    it('should return false if PerformanceObserver is not supported', () => {
      global.window = { PerformanceObserver: undefined }
      expect(initCoreWebVitals()).toBe(false)
    })

    it('should return true when successfully initialized', () => {
      mockPerformance.getEntriesByType.mockReturnValue([{ responseStart: 100, requestStart: 50 }])
      expect(initCoreWebVitals()).toBe(true)
    })

    it('should accept onMetric callback option', () => {
      const callback = vi.fn()
      initCoreWebVitals({ onMetric: callback })
      simulateMetrics({ LCP: 2000 })
      expect(callback).toHaveBeenCalled()
    })

    it('should setup reporting listeners when reportToAnalytics is true', () => {
      initCoreWebVitals({ reportToAnalytics: true })
      expect(window.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
      expect(window.addEventListener).toHaveBeenCalledWith('pagehide', expect.any(Function))
    })

    it('should not setup reporting listeners when reportToAnalytics is false', () => {
      global.window.addEventListener = vi.fn()
      initCoreWebVitals({ reportToAnalytics: false })
      expect(window.addEventListener).not.toHaveBeenCalled()
    })
  })

  describe('Recommendations', () => {
    it('should provide LCP recommendations', () => {
      simulateMetrics({ LCP: 5000 })
      const report = getPerformanceReport()
      const rec = report.recommendations.find(r => r.metric === 'LCP')
      expect(rec.tips).toContain('Optimiser les images (WebP, lazy loading)')
      expect(rec.tips).toContain('Utiliser un CDN pour les assets')
    })

    it('should provide FID recommendations', () => {
      simulateMetrics({ FID: 400 })
      const report = getPerformanceReport()
      const rec = report.recommendations.find(r => r.metric === 'FID')
      expect(rec.tips).toContain('Reduire le JavaScript execute au chargement')
    })

    it('should provide CLS recommendations', () => {
      simulateMetrics({ CLS: 0.3 })
      const report = getPerformanceReport()
      const rec = report.recommendations.find(r => r.metric === 'CLS')
      expect(rec.tips).toContain('Definir les dimensions des images et videos')
    })

    it('should provide FCP recommendations', () => {
      simulateMetrics({ FCP: 4000 })
      const report = getPerformanceReport()
      const rec = report.recommendations.find(r => r.metric === 'FCP')
      expect(rec.tips).toContain('Reduire le temps de reponse serveur')
    })

    it('should provide TTFB recommendations', () => {
      simulateMetrics({ TTFB: 2000 })
      const report = getPerformanceReport()
      const rec = report.recommendations.find(r => r.metric === 'TTFB')
      expect(rec.tips).toContain('Utiliser un CDN')
    })

    it('should provide INP recommendations', () => {
      simulateMetrics({ INP: 600 })
      const report = getPerformanceReport()
      const rec = report.recommendations.find(r => r.metric === 'INP')
      expect(rec.tips).toContain('Reduire la complexite des event handlers')
    })
  })

  describe('Edge Cases', () => {
    it('should handle extremely large values', () => {
      simulateMetrics({ LCP: 100000 })
      expect(getMetric('LCP')).toBe(100000)
      expect(getRating('LCP', 100000)).toBe('poor')
    })

    it('should handle negative values as valid', () => {
      // Negative values could theoretically happen with timing issues
      simulateMetrics({ TTFB: -10 })
      expect(getMetric('TTFB')).toBe(-10)
    })

    it('should handle empty object simulation', () => {
      simulateMetrics({})
      expect(getMetrics().LCP).toBeNull()
    })

    it('should handle multiple rapid simulations', () => {
      for (let i = 0; i < 100; i++) {
        simulateMetrics({ LCP: i })
      }
      expect(getMetric('LCP')).toBe(99)
    })
  })

  describe('Integration Tests', () => {
    it('should track complete user journey', () => {
      const callback = vi.fn()
      onMetric(callback)

      // Simulate page load metrics
      simulateMetrics({ TTFB: 200, FCP: 1500, LCP: 2200 })

      // Simulate user interaction
      simulateMetrics({ FID: 50 })

      // Simulate layout shifts
      simulateMetrics({ CLS: 0.08 })

      const report = getPerformanceReport()
      expect(report.overallRating).toBe('good')
      expect(callback).toHaveBeenCalledTimes(5)
    })

    it('should maintain state across multiple resets', () => {
      simulateMetrics({ LCP: 2000 })
      expect(getMetric('LCP')).toBe(2000)

      resetMetrics()
      expect(getMetric('LCP')).toBeNull()

      simulateMetrics({ LCP: 3000 })
      expect(getMetric('LCP')).toBe(3000)
    })

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Test error')
      })
      const normalCallback = vi.fn()

      onMetric(errorCallback)
      onMetric(normalCallback)

      // Should not throw and should still call other callbacks
      expect(() => simulateMetrics({ LCP: 2000 })).not.toThrow()
      expect(normalCallback).toHaveBeenCalled()
    })
  })
})
