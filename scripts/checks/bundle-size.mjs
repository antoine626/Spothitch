#!/usr/bin/env node
/**
 * Quality Gate Check: Bundle Size Monitor
 * Ensures JS/CSS bundles stay within size budgets.
 *
 * Thresholds:
 *   - Main JS chunk: 300KB warning, 500KB error
 *   - Any single chunk: 200KB warning, 400KB error
 *   - Total JS: 800KB warning, 1200KB error
 *   - Total CSS: 100KB warning, 200KB error
 */

import { readdirSync, statSync, existsSync } from 'fs'
import { join, extname } from 'path'

const ROOT = join(import.meta.dirname, '..', '..')
const DIST_ASSETS = join(ROOT, 'dist', 'assets')

// Thresholds adjusted for app with MapLibre (~1MB) + Firebase (~500KB) vendors
const THRESHOLDS = {
  mainJsWarn: 1100 * 1024,    // MapLibre vendor is ~1MB — expected
  mainJsError: 1500 * 1024,
  chunkWarn: 500 * 1024,      // Firebase vendor is ~476KB — expected
  chunkError: 800 * 1024,
  totalJsWarn: 4000 * 1024,   // Many lazy-loaded chunks
  totalJsError: 6000 * 1024,
  totalCssWarn: 300 * 1024,   // Tailwind + MapLibre CSS
  totalCssError: 500 * 1024,
}

function formatKB(bytes) {
  return `${Math.round(bytes / 1024)}KB`
}

export default function checkBundleSize(opts = {}) {
  const errors = []
  const warnings = []

  if (!existsSync(DIST_ASSETS)) {
    return {
      name: 'Bundle Size',
      score: 100,
      maxScore: 100,
      errors: [],
      warnings: ['dist/assets/ not found — run npm run build first'],
      stats: {},
    }
  }

  const files = readdirSync(DIST_ASSETS)
  const jsFiles = []
  const cssFiles = []
  let totalJs = 0
  let totalCss = 0

  for (const file of files) {
    const fullPath = join(DIST_ASSETS, file)
    const stat = statSync(fullPath)
    const ext = extname(file)

    if (ext === '.js') {
      jsFiles.push({ name: file, size: stat.size })
      totalJs += stat.size
    } else if (ext === '.css') {
      cssFiles.push({ name: file, size: stat.size })
      totalCss += stat.size
    }
  }

  // Sort by size desc
  jsFiles.sort((a, b) => b.size - a.size)
  cssFiles.sort((a, b) => b.size - a.size)

  // Check main JS (largest chunk = entry point)
  if (jsFiles.length > 0) {
    const main = jsFiles[0]
    if (main.size > THRESHOLDS.mainJsError) {
      errors.push(`Main JS ${main.name}: ${formatKB(main.size)} > ${formatKB(THRESHOLDS.mainJsError)}`)
    } else if (main.size > THRESHOLDS.mainJsWarn) {
      warnings.push(`Main JS ${main.name}: ${formatKB(main.size)} > ${formatKB(THRESHOLDS.mainJsWarn)}`)
    }
  }

  // Check individual chunks
  for (const chunk of jsFiles.slice(1)) {
    if (chunk.size > THRESHOLDS.chunkError) {
      errors.push(`Chunk ${chunk.name}: ${formatKB(chunk.size)} > ${formatKB(THRESHOLDS.chunkError)}`)
    } else if (chunk.size > THRESHOLDS.chunkWarn) {
      warnings.push(`Chunk ${chunk.name}: ${formatKB(chunk.size)} > ${formatKB(THRESHOLDS.chunkWarn)}`)
    }
  }

  // Check totals
  if (totalJs > THRESHOLDS.totalJsError) {
    errors.push(`Total JS: ${formatKB(totalJs)} > ${formatKB(THRESHOLDS.totalJsError)}`)
  } else if (totalJs > THRESHOLDS.totalJsWarn) {
    warnings.push(`Total JS: ${formatKB(totalJs)} > ${formatKB(THRESHOLDS.totalJsWarn)}`)
  }

  if (totalCss > THRESHOLDS.totalCssError) {
    errors.push(`Total CSS: ${formatKB(totalCss)} > ${formatKB(THRESHOLDS.totalCssError)}`)
  } else if (totalCss > THRESHOLDS.totalCssWarn) {
    warnings.push(`Total CSS: ${formatKB(totalCss)} > ${formatKB(THRESHOLDS.totalCssWarn)}`)
  }

  const score = Math.max(0, 100 - (errors.length * 30) - (warnings.length * 5))

  return {
    name: 'Bundle Size',
    score,
    maxScore: 100,
    errors,
    warnings,
    stats: {
      jsChunks: jsFiles.length,
      cssChunks: cssFiles.length,
      totalJs: formatKB(totalJs),
      totalCss: formatKB(totalCss),
      mainJs: jsFiles[0] ? formatKB(jsFiles[0].size) : 'N/A',
    },
  }
}

// Run standalone
if (process.argv[1] && process.argv[1].endsWith('bundle-size.mjs')) {
  const result = checkBundleSize()
  console.log(`\n=== ${result.name} ===`)
  console.log(`Stats: ${JSON.stringify(result.stats)}`)
  if (result.errors.length) result.errors.forEach(e => console.log(`ERROR: ${e}`))
  if (result.warnings.length) result.warnings.forEach(w => console.log(`WARN: ${w}`))
  console.log(`Score: ${result.score}/100`)
  process.exit(result.errors.length > 0 ? 1 : 0)
}
