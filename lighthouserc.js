module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--headless --no-sandbox --disable-gpu',
        onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices'],
      },
    },
    assert: {
      assertions: {
        // Performance: warn if below 40 (map-heavy app with large JS)
        'categories:performance': ['warn', { minScore: 0.4 }],
        // Accessibility: must stay above 90
        'categories:accessibility': ['error', { minScore: 0.9 }],
        // SEO: must stay above 85
        'categories:seo': ['error', { minScore: 0.85 }],
        // Best practices: warn if below 80
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        // Core Web Vitals thresholds
        'first-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 6000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.25 }],
        'total-blocking-time': ['warn', { maxNumericValue: 3000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
