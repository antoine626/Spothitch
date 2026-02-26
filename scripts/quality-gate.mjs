#!/usr/bin/env node
/**
 * Quality Gate - Orchestrator
 * Runs all quality checks and produces a unified score.
 *
 * Usage: node scripts/quality-gate.mjs [--threshold=80] [--json] [--fix]
 *
 * --fix: Auto-correct fixable issues (dead exports, i18n, handlers, a11y)
 *        then re-run all checks to verify improvements.
 *
 * Checks:
 *   1. Handlers wiring (tests ↔ code sync)       [fixable]
 *   2. i18n keys (translations complete)           [fixable]
 *   3. Dead exports (unused exports in src/)       [fixable]
 *   4. Security patterns (XSS, Math.random IDs)
 *   5. localStorage RGPD (all keys registered)
 *   6. Error patterns (regressions from errors.md)
 *   7. Duplicate handlers
 *   8. Accessibility (div onclick without a11y)    [fixable]
 *   9. Bundle size (JS/CSS within budget)
 *  10. Import cycles (circular dependencies)
 *
 * Exit code 1 if score < threshold (default 70)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import checkHandlers from './checks/handlers.mjs'
import checkI18nKeys from './checks/i18n-keys.mjs'
import checkDeadExports from './checks/dead-exports.mjs'
import checkConsoleErrors from './checks/console-errors.mjs'
import checkLocalStorage from './checks/localstorage.mjs'
import checkErrorPatterns from './checks/error-patterns.mjs'
import checkDuplicateHandlers from './checks/duplicate-handlers.mjs'
import checkA11y from './checks/a11y-autofix.mjs'
import checkBundleSize from './checks/bundle-size.mjs'
import checkImportCycles from './checks/import-cycles.mjs'

const ROOT = join(import.meta.dirname, '..')
const RATCHET_PATH = join(ROOT, '.quality-ratchet.json')

// Parse args
const args = process.argv.slice(2)
const thresholdArg = args.find(a => a.startsWith('--threshold='))
const THRESHOLD = thresholdArg ? parseInt(thresholdArg.split('=')[1], 10) : 70
const JSON_OUTPUT = args.includes('--json')
const FIX_MODE = args.includes('--fix')

// Check weights (must sum to 100)
const WEIGHTS = {
  'Handlers Wiring': 12,
  'i18n Keys': 15,
  'Dead Exports': 8,
  'Security Patterns': 18,
  'localStorage RGPD': 10,
  'Error Patterns': 14,
  'Duplicate Handlers': 10,
  'Accessibility': 7,
  'Bundle Size': 3,
  'Import Cycles': 3,
}

function runAllChecks(fix = false) {
  const checks = [
    { fn: checkHandlers, weight: WEIGHTS['Handlers Wiring'], fixable: true },
    { fn: checkI18nKeys, weight: WEIGHTS['i18n Keys'], fixable: true },
    { fn: checkDeadExports, weight: WEIGHTS['Dead Exports'], fixable: false },
    { fn: checkConsoleErrors, weight: WEIGHTS['Security Patterns'], fixable: false },
    { fn: checkLocalStorage, weight: WEIGHTS['localStorage RGPD'], fixable: false },
    { fn: checkErrorPatterns, weight: WEIGHTS['Error Patterns'], fixable: false },
    { fn: checkDuplicateHandlers, weight: WEIGHTS['Duplicate Handlers'], fixable: false },
    { fn: checkA11y, weight: WEIGHTS['Accessibility'], fixable: true },
    { fn: checkBundleSize, weight: WEIGHTS['Bundle Size'], fixable: false },
    { fn: checkImportCycles, weight: WEIGHTS['Import Cycles'], fixable: false },
  ]

  const results = []
  let totalWeightedScore = 0
  let totalErrors = 0
  let totalWarnings = 0

  for (const check of checks) {
    try {
      const shouldFix = fix && check.fixable
      const result = check.fn({ fix: shouldFix })
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

// === RATCHET SYSTEM ===
function loadRatchet() {
  if (!existsSync(RATCHET_PATH)) return null
  try {
    return JSON.parse(readFileSync(RATCHET_PATH, 'utf-8'))
  } catch {
    return null
  }
}

function saveRatchet(results, totalScore) {
  const ratchet = {
    totalScore,
    updatedAt: new Date().toISOString(),
    checks: {},
  }
  for (const r of results) {
    ratchet.checks[r.name] = {
      score: r.score,
      errors: r.errors.length,
      warnings: r.warnings.length,
    }
  }
  writeFileSync(RATCHET_PATH, JSON.stringify(ratchet, null, 2) + '\n')
}

function checkRatchet(results, totalScore) {
  const ratchet = loadRatchet()
  if (!ratchet) return { passed: true, regressions: [] }

  const regressions = []

  // Check total score
  if (totalScore < ratchet.totalScore) {
    regressions.push(`Total score dropped: ${ratchet.totalScore} → ${totalScore}`)
  }

  // Check per-check scores
  for (const r of results) {
    const prev = ratchet.checks[r.name]
    if (!prev) continue
    if (r.score < prev.score) {
      regressions.push(`${r.name}: ${prev.score} → ${r.score} (-${prev.score - r.score})`)
    }
  }

  return { passed: regressions.length === 0, regressions }
}

// === MAIN ===

if (FIX_MODE && !JSON_OUTPUT) {
  console.log('\n🔧 FIX MODE: Auto-correcting fixable issues...\n')
}

// If --fix, run with fix first, then re-run to verify
if (FIX_MODE) {
  runAllChecks(true)
  if (!JSON_OUTPUT) {
    console.log('🔧 Fixes applied. Re-running checks to verify...\n')
  }
}

// Final run (always without fix to get accurate scores)
const { results, totalWeightedScore, totalErrors, totalWarnings } = runAllChecks(false)

// Ratchet check
const ratchetResult = checkRatchet(results, totalWeightedScore)

// Update ratchet if scores improved
const ratchet = loadRatchet()
if (!ratchet || totalWeightedScore >= ratchet.totalScore) {
  saveRatchet(results, totalWeightedScore)
}

if (JSON_OUTPUT) {
  console.log(JSON.stringify({
    score: totalWeightedScore,
    threshold: THRESHOLD,
    passed: totalWeightedScore >= THRESHOLD,
    ratchet: ratchetResult,
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
  const passed = totalWeightedScore >= THRESHOLD && ratchetResult.passed
  const statusIcon = passed ? '✓ PASSED' : '✗ FAILED'
  console.log(`║ Score: ${totalWeightedScore}/100  ${scoreBar.substring(0, 20)} ║`)
  console.log(`║ Threshold: ${THRESHOLD}   Status: ${statusIcon}${' '.repeat(24 - statusIcon.length)}║`)
  console.log(`║ Errors: ${totalErrors}   Warnings: ${totalWarnings}${' '.repeat(32 - String(totalErrors).length - String(totalWarnings).length)}║`)

  if (!ratchetResult.passed) {
    console.log('╠══════════════════════════════════════════════════════╣')
    console.log('║ ⚠ RATCHET REGRESSION DETECTED                       ║')
    for (const r of ratchetResult.regressions) {
      console.log(`║   ${r.substring(0, 52).padEnd(52)}║`)
    }
  }

  console.log('╚══════════════════════════════════════════════════════╝')

  if (!passed) {
    if (!ratchetResult.passed) {
      console.log(`\nQuality Gate FAILED: ratchet regression detected`)
    } else {
      console.log(`\nQuality Gate FAILED: score ${totalWeightedScore} < threshold ${THRESHOLD}`)
    }
  }
}

process.exit((totalWeightedScore >= THRESHOLD && ratchetResult.passed) ? 0 : 1)
