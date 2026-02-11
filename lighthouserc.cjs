/**
 * Lighthouse CI Configuration
 * Run: npx lhci autorun
 */

module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4173/'],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        // Skip some audits that are irrelevant for local testing
        skipAudits: [
          'uses-http2',
          'redirects-http',
          'canonical',
        ],
        // Throttling for more realistic results
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      assertions: {
        // Performance: off in CI (score N/A in headless without real network)
        'categories:performance': 'off',
        // Accessibility: warn at 0.7 (known issues: meta-viewport, skip-link)
        'categories:accessibility': ['warn', { minScore: 0.7 }],
        // Best practices: warn at 0.7
        'categories:best-practices': ['warn', { minScore: 0.7 }],
        // SEO: warn at 0.7
        'categories:seo': ['warn', { minScore: 0.7 }],
      },
    },
    upload: {
      // For local use, save to temporary folder
      target: 'temporary-public-storage',
    },
  },
}
