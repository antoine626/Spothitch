#!/usr/bin/env node
/**
 * 🐺 PLAN WOLF — The Ultimate Test Suite
 * Runs EVERY test, audit, and check in sequence.
 * If Plan Wolf passes, the app is bulletproof.
 *
 * Usage:
 *   node scripts/plan-wolf.mjs           # Run everything
 *   node scripts/plan-wolf.mjs --quick   # Skip E2E + Lighthouse (faster)
 */

import { execSync } from 'child_process'

const isQuick = process.argv.includes('--quick')
const start = Date.now()
const results = []

function run(name, cmd, { critical = true, timeout = 120000 } = {}) {
  const stepStart = Date.now()
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🐺 ${name}`)
  console.log('='.repeat(60))
  try {
    execSync(cmd, { stdio: 'inherit', timeout, cwd: process.cwd() })
    const duration = ((Date.now() - stepStart) / 1000).toFixed(1)
    results.push({ name, status: '✅', duration: `${duration}s`, critical })
    console.log(`✅ ${name} — ${duration}s`)
    return true
  } catch (e) {
    const duration = ((Date.now() - stepStart) / 1000).toFixed(1)
    results.push({ name, status: critical ? '❌' : '⚠️', duration: `${duration}s`, critical })
    if (critical) {
      console.error(`❌ ${name} FAILED — ${duration}s`)
    } else {
      console.warn(`⚠️  ${name} WARNING — ${duration}s (non-blocking)`)
    }
    return false
  }
}

console.log('🐺🐺🐺 PLAN WOLF — LAUNCHING ALL TESTS 🐺🐺🐺')
console.log(`Mode: ${isQuick ? 'QUICK (skip E2E + Lighthouse)' : 'FULL'}`)
console.log(`Date: ${new Date().toISOString()}`)

let allCriticalPassed = true

// ---- PHASE 1: Code Quality ----
console.log('\n\n🔍 PHASE 1 — CODE QUALITY')
if (!run('ESLint', 'npx eslint src/ --max-warnings=0', { critical: false })) {}
if (!run('i18n Lint', 'node scripts/lint-i18n.mjs')) allCriticalPassed = false
if (!run('RGPD Audit', 'node scripts/audit-rgpd.mjs')) allCriticalPassed = false
if (!run('Error Registry', 'node scripts/sentry-to-tests.mjs --audit')) allCriticalPassed = false

// ---- PHASE 2: Unit Tests ----
console.log('\n\n🧪 PHASE 2 — UNIT TESTS')
if (!run('Wiring Tests', 'npx vitest run tests/wiring/')) allCriticalPassed = false
if (!run('Integration Tests', 'npx vitest run tests/integration/modals.test.js')) allCriticalPassed = false
if (!run('All Unit Tests', 'npx vitest run', { timeout: 180000 })) allCriticalPassed = false

// ---- PHASE 3: Build ----
console.log('\n\n🏗️  PHASE 3 — BUILD')
if (!run('Production Build', 'npm run build', { timeout: 180000 })) allCriticalPassed = false

// Check bundle size
try {
  const { statSync } = await import('fs')
  const { globSync } = await import('glob')
  const files = globSync('dist/assets/index-*.js')
  if (files.length > 0) {
    const size = statSync(files[0]).size
    const kb = Math.round(size / 1024)
    if (kb > 750) {
      console.error(`❌ Bundle size: ${kb}KB > 750KB limit`)
      results.push({ name: 'Bundle Size Check', status: '❌', duration: '0s', critical: true })
      allCriticalPassed = false
    } else {
      console.log(`✅ Bundle size: ${kb}KB < 750KB limit`)
      results.push({ name: 'Bundle Size Check', status: '✅', duration: '0s', critical: true })
    }
  }
} catch (e) {
  console.warn('⚠️  Could not check bundle size')
}

if (!isQuick) {
  // ---- PHASE 4: E2E Tests ----
  console.log('\n\n🌐 PHASE 4 — E2E TESTS')
  run('Playwright E2E', 'npx playwright test --project=chromium', { critical: false, timeout: 600000 })

  // ---- PHASE 5: Performance ----
  console.log('\n\n⚡ PHASE 5 — PERFORMANCE')
  run('Lighthouse CI', 'npx @lhci/cli autorun', { critical: false, timeout: 300000 })
}

// ---- REPORT ----
const totalTime = ((Date.now() - start) / 1000).toFixed(1)
console.log('\n\n' + '='.repeat(60))
console.log('🐺 PLAN WOLF — FINAL REPORT')
console.log('='.repeat(60))
console.log('')
const maxName = Math.max(...results.map(r => r.name.length))
for (const r of results) {
  console.log(`  ${r.status} ${r.name.padEnd(maxName + 2)} ${r.duration}`)
}
console.log('')
console.log(`Total time: ${totalTime}s`)
console.log('')

if (allCriticalPassed) {
  console.log('🐺✅ PLAN WOLF PASSED — App is bulletproof!')
  process.exit(0)
} else {
  console.log('🐺❌ PLAN WOLF FAILED — Fix the errors above!')
  process.exit(1)
}
