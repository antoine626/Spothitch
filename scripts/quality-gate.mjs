#!/usr/bin/env node
/**
 * Quality Gate - Orchestrator
 * Runs all quality checks and produces a unified score.
 *
 * Usage: node scripts/quality-gate.mjs [--threshold=80] [--json]
 *
 * Checks:
 *   1. Handlers wiring (tests ↔ code sync)
 *   2. i18n keys (translations complete in 4 languages)
 *   3. Dead exports (unused exports in src/)
 *   4. Security patterns (Math.random IDs, innerHTML XSS, manual escaping)
 *   5. localStorage RGPD (all keys registered)
 *   6. Error patterns (regressions from errors.md lessons)
 *
 * Exit code 1 if score < threshold (default 80)
 */

import checkHandlers from './checks/handlers.mjs'
import checkI18nKeys from './checks/i18n-keys.mjs'
import checkDeadExports from './checks/dead-exports.mjs'
import checkConsoleErrors from './checks/console-errors.mjs'
import checkLocalStorage from './checks/localstorage.mjs'
import checkErrorPatterns from './checks/error-patterns.mjs'

// Parse args
const args = process.argv.slice(2)
const thresholdArg = args.find(a => a.startsWith('--threshold='))
const THRESHOLD = thresholdArg ? parseInt(thresholdArg.split('=')[1], 10) : 70
const JSON_OUTPUT = args.includes('--json')

// Check weights (must sum to 100)
const WEIGHTS = {
  'Handlers Wiring': 20,
  'i18n Keys': 20,
  'Dead Exports': 10,
  'Security Patterns': 20,
  'localStorage RGPD': 10,
  'Error Patterns': 20,
}

async function runAllChecks() {
  const checks = [
    { fn: checkHandlers, weight: WEIGHTS['Handlers Wiring'] },
    { fn: checkI18nKeys, weight: WEIGHTS['i18n Keys'] },
    { fn: checkDeadExports, weight: WEIGHTS['Dead Exports'] },
    { fn: checkConsoleErrors, weight: WEIGHTS['Security Patterns'] },
    { fn: checkLocalStorage, weight: WEIGHTS['localStorage RGPD'] },
    { fn: checkErrorPatterns, weight: WEIGHTS['Error Patterns'] },
  ]

  const results = []
  let totalWeightedScore = 0
  let totalErrors = 0
  let totalWarnings = 0

  for (const check of checks) {
    try {
      const result = check.fn()
      result.weight = check.weight
      result.weightedScore = Math.round((result.score / 100) * check.weight)
      totalWeightedScore += result.weightedScore
      totalErrors += result.errors.length
      totalWarnings += result.warnings.length
      results.push(result)
    } catch (err) {
      results.push({
        name: check.fn.name || 'Unknown',
        score: 0,
        maxScore: 100,
        weight: check.weight,
        weightedScore: 0,
        errors: [`Check crashed: ${err.message}`],
        warnings: [],
        stats: {},
      })
    }
  }

  return { results, totalWeightedScore, totalErrors, totalWarnings }
}

// Main
const { results, totalWeightedScore, totalErrors, totalWarnings } = await runAllChecks()

if (JSON_OUTPUT) {
  console.log(JSON.stringify({
    score: totalWeightedScore,
    threshold: THRESHOLD,
    passed: totalWeightedScore >= THRESHOLD,
    checks: results.map(r => ({
      name: r.name,
      score: r.score,
      weight: r.weight,
      weightedScore: r.weightedScore,
      errors: r.errors.length,
      warnings: r.warnings.length,
    })),
    totalErrors,
    totalWarnings,
    timestamp: new Date().toISOString(),
  }, null, 2))
} else {
  // Console output with table
  console.log('\n╔══════════════════════════════════════════════════════╗')
  console.log('║              QUALITY GATE REPORT                     ║')
  console.log('╠══════════════════════════════════════════════════════╣')

  for (const result of results) {
    const status = result.score >= 80 ? '✓' : result.score >= 50 ? '~' : '✗'
    const pad = (s, n) => s.padEnd(n)
    console.log(`║ ${status} ${pad(result.name, 22)} ${String(result.score).padStart(3)}/100  (×${String(result.weight).padStart(2)}%) = ${String(result.weightedScore).padStart(2)}pts ║`)

    if (result.errors.length > 0) {
      result.errors.slice(0, 3).forEach(e => {
        console.log(`║   ERROR: ${e.substring(0, 46).padEnd(46)} ║`)
      })
      if (result.errors.length > 3) {
        console.log(`║   ... and ${result.errors.length - 3} more error(s)${' '.repeat(32)} ║`)
      }
    }
    if (result.warnings.length > 0) {
      console.log(`║   ${result.warnings.length} warning(s)${' '.repeat(39)} ║`)
    }
  }

  console.log('╠══════════════════════════════════════════════════════╣')

  const scoreBar = '█'.repeat(Math.round(totalWeightedScore / 2)) + '░'.repeat(50 - Math.round(totalWeightedScore / 2))
  const passed = totalWeightedScore >= THRESHOLD
  const statusIcon = passed ? '✓ PASSED' : '✗ FAILED'
  console.log(`║ Score: ${totalWeightedScore}/100  ${scoreBar.substring(0, 20)} ║`)
  console.log(`║ Threshold: ${THRESHOLD}   Status: ${statusIcon}${' '.repeat(24 - statusIcon.length)}║`)
  console.log(`║ Errors: ${totalErrors}   Warnings: ${totalWarnings}${' '.repeat(32 - String(totalErrors).length - String(totalWarnings).length)}║`)
  console.log('╚══════════════════════════════════════════════════════╝')

  if (!passed) {
    console.log(`\nQuality Gate FAILED: score ${totalWeightedScore} < threshold ${THRESHOLD}`)
  }
}

process.exit(totalWeightedScore >= THRESHOLD ? 0 : 1)
